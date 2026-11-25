  /* --- flags --- */

  addResolveButtons(el, ctx) {
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(file instanceof TFile) || !this.isReviewable(file)) return;
    if (this.fm(file).status !== "draft") return;
    el.querySelectorAll(".callout[data-callout]").forEach((callout) => {
      const kind = (callout.getAttribute("data-callout") || "").toLowerCase();
      if (!FLAG_KINDS[kind]) return;
      const titleEl = callout.querySelector(".callout-title");
      if (!titleEl || titleEl.querySelector(".cm-resolve-btn")) return;
      const btn = titleEl.createEl("button", { cls: "cm-resolve-btn", text: "Resolve" });
      btn.setAttr("aria-label", "Resolve this flag (Alt+F)");
      const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
      btn.addEventListener("mousedown", stop);
      btn.addEventListener("click", async (e) => {
        stop(e);
        const titleText = (titleEl.querySelector(".callout-title-inner") || titleEl).textContent.trim();
        const info = ctx.getSectionInfo(el);
        const flags = parseFlags(await this.app.vault.read(file));
        let hit = info ? flags.find((f) => f.start === info.lineStart && f.kind === kind) : null;
        if (!hit) {
          const want = titleText.toLowerCase();
          const same = flags.filter((f) => f.kind === kind && (f.title || FLAG_KINDS[kind].label).toLowerCase() === want);
          const pool = same.length ? same : flags.filter((f) => f.kind === kind);
          if (pool.length === 1) hit = pool[0];
          else if (pool.length > 1) { new FlagPicker(this.app, pool, (f) => this.startResolve(file, f)).open(); return; }
        }
        if (hit) this.startResolve(file, hit);
        else new Notice("Couldn't find that flag in the file. Try Alt+F.");
      });
    });
  }

  async pickFlag(file) {
    const flags = parseFlags(await this.app.vault.read(file));
    if (!flags.length) { new Notice("No open flags on this page."); return; }
    if (flags.length === 1) this.startResolve(file, flags[0]);
    else new FlagPicker(this.app, flags, (f) => this.startResolve(file, f)).open();
  }

  startResolve(file, flag) {
    new ResolveModal(this.app, flag, (decision) => this.resolveFlag(file, flag, decision)).open();
  }

  async resolveFlag(file, flag, decision) {
    let removed = false;
    await this.app.vault.process(file, (text) => {
      const flags = parseFlags(text);
      const same = (f) => f.kind === flag.kind && f.title === flag.title && f.body === flag.body;
      const hit = flags.find((f) => f.start === flag.start && same(f)) || flags.find(same);
      if (!hit) return text;
      removed = true;
      return removeLines(text, hit.start, hit.end);
    });
    if (!removed) { new Notice("That flag has changed since you opened it, so nothing was removed. Try again."); return; }
    (this.resolved[file.path] = this.resolved[file.path] || []).push({
      kind: flag.kind, label: flag.label, title: flag.title, decision, date: today(),
    });
    await this.persist();
    new Notice(`Resolved: ${flagName(flag)}. It will be logged when you verify the page.`, 5000);
    this.scheduleRefresh();
  }

  /* --- files --- */

  backlinksTo(file) {
    const resolved = this.app.metadataCache.resolvedLinks;
    return Object.keys(resolved)
      .filter((src) => src !== file.path && resolved[src][file.path])
      .map((src) => src.replace(/^.*\//, "").replace(/\.md$/, ""))
      .sort();
  }

  indexable(f) {
    return f instanceof TFile && f.extension === "md" && INDEX_SCOPE.some((re) => re.test(f.path));
  }

  /** Runs soon after the last change, so a burst of new pages makes one update. */
  scheduleIndexSync(delay = 3000) {
    if (this.settings.autoIndex === false) return;
    clearTimeout(this.indexTimer);
    this.indexTimer = setTimeout(() => this.syncIndex({}), delay);
  }

  /**
   * Makes _index.md match the pages in Wiki/, Perspectives/ and Sources/Source Cards/ (see syncIndex). A new page's line takes its
   * summary from the page's summary callout. An automatic run refuses a very large change (more than 20 removals or 100 additions at
   * once) and says so; "Update the index now" does it anyway. Nothing is written when the index is already right.
   */
  async syncIndex({ manual = false } = {}) {
    if (this.indexBusy) { this.indexAgain = true; return; }
    this.indexBusy = true;
    try {
      const f = this.app.vault.getAbstractFileByPath(INDEX_PATH);
      if (!(f instanceof TFile)) { if (manual) new Notice("_index.md not found."); return; }
      const files = this.app.vault.getMarkdownFiles().filter((x) => this.indexable(x));
      if (!files.length) { if (manual) new Notice("No pages found to index."); return; }
      const pages = files.map((x) => ({ name: x.basename, group: groupOf(x.path), file: x }));
      const renames = this.indexRenames.splice(0);
      const date = today();
      const text = await this.app.vault.read(f);
      const need = indexNeeds(text, pages.map((p) => p.name));
      const summaries = {};
      for (const p of pages) if (need.has(p.name)) { try { summaries[p.name] = leadLine(await this.app.vault.cachedRead(p.file)); } catch (e) { /* no summary yet */ } }
      let r = syncIndex(text, pages, summaries, renames, date);
      this.indexEmpty = new Set(pages.filter((p) => r.empty.includes(p.name)).map((p) => p.file.path));
      if (!r.changed) { if (manual) new Notice("The index is already up to date."); return; }
      if (!manual && (r.removed.length > 20 || r.added.length > 100)) {
        new Notice(`The index is out of step by a lot (${r.added.length} to add, ${r.removed.length} to remove), so I left it. Run “Update the index now” if that is right.`, 12000);
        return;
      }
      await this.app.vault.process(f, (cur) => {
        const again = syncIndex(cur, pages, summaries, renames, date);
        r = again.changed ? again : r;
        return again.changed ? again.text : cur;
      });
      const bits = [];
      const list = (a) => a.slice(0, 3).join(", ") + (a.length > 3 ? ` and ${a.length - 3} more` : "");
      if (r.added.length) bits.push(`added ${list(r.added)}`);
      if (r.removed.length) bits.push(`removed ${list(r.removed)}`);
      if (r.moved.length) bits.push(`moved ${list(r.moved)}`);
      if (r.renamed.length) bits.push(`renamed ${list(r.renamed)}`);
      if (r.filled.length) bits.push(`filled in ${r.filled.length} summar${r.filled.length === 1 ? "y" : "ies"}`);
      new Notice("Index updated: " + (bits.join("; ") || "tidied") + ".", 5000);
    } catch (e) {
      console.error("Nicrosil: index update failed", e);
      new Notice(`Couldn't update the index: ${e.message}`, 8000);
    } finally {
      this.indexBusy = false;
      if (this.indexAgain) { this.indexAgain = false; this.scheduleIndexSync(); }
    }
  }

  async updateIndex(name, mode, date) {
    const f = this.app.vault.getAbstractFileByPath(INDEX_PATH);
    if (!(f instanceof TFile)) { new Notice("_index.md not found; update it by hand."); return false; }
    let found = false;
    await this.app.vault.process(f, (text) => {
      const r = editIndex(text, name, mode, date);
      found = r.found;
      return r.text;
    });
    return found;
  }

  /** The newest month's log file in _logs/ (by year, then month), or null. */
  latestLogFile() {
    let best = null;
    for (const f of this.app.vault.getMarkdownFiles()) if (isLogPath(f.path) && (!best || logOrder(f.path) > logOrder(best.path))) best = f;
    return best;
  }

  /** The log file for the month of `date` ("YYYY-MM-DD"), created with its header if it isn't there yet. */
  async ensureLog(date) {
    const path = logPathFor(date);
    const have = this.app.vault.getAbstractFileByPath(path);
    if (have instanceof TFile) return { file: have, created: false };
    if (!this.app.vault.getAbstractFileByPath(LOG_DIR)) await this.app.vault.createFolder(LOG_DIR);
    const file = await this.app.vault.create(path, logFileHeader(date) + "\n");
    return { file, created: true };
  }

