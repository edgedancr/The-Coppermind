  /* --- navigation --- */

  mainLeaf() {
    const cur = this.currentPath;
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    return leaves.find((l) => l.view.file && l.view.file.path === cur) || leaves[0] || this.app.workspace.getLeaf(false);
  }

  /** Opens the atlas in its own tab (or brings it forward), on a topic ({ topic }) or a page ({ focus: path }) if given. */
  async activateWikiMap(opts = {}) {
    let leaf = this.app.workspace.getLeavesOfType(MAP_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: MAP_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (leaf.loadIfDeferred) await leaf.loadIfDeferred();
    if (leaf.view instanceof WikiMapView && (opts.focus || opts.topic !== undefined)) leaf.view.show(opts);
  }

  /**
   * Reading view's half of Connections (4.9.0): adds the section to the block that starts with the Footnotes heading,
   * above the heading, or to the page's last block on a page without one. Live Preview's half is pageLensEditorExtension.
   */
  addPageLens(el, ctx) {
    if (this.settings.pageLens === false || !inLinkScope(ctx.sourcePath || "")) return;
    const info = ctx.getSectionInfo(el);
    if (!info) return; // an embed or an export: no section info, and no Connections
    const lines = info.text.split("\n").map((l) => l.replace(/\r$/, ""));
    let where = null;
    if (FOOTNOTES_HEADING.test(lines[info.lineStart] || "")) where = "before";
    else if (!lines.some((l) => FOOTNOTES_HEADING.test(l))) {
      let last = lines.length - 1;
      while (last > 0 && !lines[last].trim()) last--;
      if (info.lineEnd >= last) where = "after";
    }
    if (!where) return;
    const box = createDiv();
    if (where === "before") el.prepend(box); else el.append(box);
    ctx.addChild(new PageLens(box, this, ctx.sourcePath));
  }

  /** Redraws every Connections section (after it is opened or folded, or turned on or off in the settings). */
  refreshPageLenses() {
    this.pageLenses.forEach((l) => { l.sig = null; l.render(); });
  }

  /** Alt+L: opens Connections on every page, or folds it. */
  togglePageLens() {
    if (this.settings.pageLens === false) { new Notice("Connections is turned off. Turn it on in Nicrosil's settings."); return; }
    this.settings.pageLensOpen = !this.settings.pageLensOpen;
    this.persist();
    this.refreshPageLenses();
  }

  async openFile(path, newTab) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return;
    const leaf = newTab ? this.app.workspace.getLeaf("tab") : this.mainLeaf();
    await leaf.openFile(f);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }

  async openNext(fromPath, order, newTab) {
    const next = nextAfter(order || this.queue(), fromPath);
    if (!next) { new Notice("The review queue is empty."); return; }
    await this.openFile(next.path, newTab);
  }

  async skip(file) {
    const order = this.queue();
    this.skipped = this.skipped.filter((p) => p !== file.path).concat(file.path);
    new Notice(`Skipped “${file.basename}”. It's at the end of the queue for this session.`);
    await this.openNext(file.path, order);
    this.renderAll();
  }

  /* --- review actions --- */

  isReviewable(file) {
    return file instanceof TFile && file.extension === "md" && REVIEWABLE.some((re) => re.test(file.path));
  }

  fm(file) {
    return (this.app.metadataCache.getFileCache(file) || {}).frontmatter || {};
  }

  precheck(file) {
    if (!this.isReviewable(file)) {
      new Notice("Nicrosil only works on pages in Wiki/, Perspectives/, Sources/Source Cards/, SCHEMAS/, or root-level files.");
      return null;
    }
    const fm = this.fm(file);
    if (fm.status === "verified") { new Notice(`“${file.basename}” is already verified.`); return null; }
    if (fm.status !== "draft") { new Notice(`“${file.basename}” has no status: draft property, so I left it alone.`); return null; }
    return fm;
  }

  isSourceCard(file) {
    return !!file && file.extension === "md" && /^Sources\/Source Cards\//.test(file.path) && String(this.fm(file).type || "") === "source";
  }

  /** The agent's "Proposed B-2" line on a card; read once per saved version of the file. undefined is never returned. */
  async proposedRating(file) {
    const c = this.proposedCache.get(file.path);
    if (c && c.mtime === file.stat.mtime) return c.value;
    let value = null;
    try { value = parseProposedRating(await this.app.vault.cachedRead(file)); } catch (e) { console.error("Nicrosil: couldn't read the proposed rating", e); }
    this.proposedCache.set(file.path, { mtime: file.stat.mtime, value });
    return value;
  }

  /** Write one half of the rating (part "rel" or "cred"; null clears it), or both at once (part "both", value { rel, cred }). */
  async setRating(file, part, value) {
    try {
      await this.app.fileManager.processFrontMatter(file, (f) => {
        if (part === "both") { f.reliability = value.rel; f.credibility = String(value.cred); }
        else if (part === "rel") f.reliability = value;
        else f.credibility = value === null ? null : String(value);
      });
    } catch (e) {
      console.error("Nicrosil: couldn't set the rating", e);
      new Notice(`Couldn't set the rating: ${e.message}`, 8000);
    }
  }

  /**
   * Two rows of buttons: reliability A–F and credibility 1–6. A click sets that value; clicking the lit one clears it.
   * If the card has a "Proposed B-2" line, those two buttons get a dotted outline and a "Use B-2" button sets both.
   * The new value reaches the page through the metadata cache, which redraws the buttons.
   */
  drawRatingButtons(host, file, proposed) {
    if (!host.isConnected && proposed !== undefined) return;
    const cached = this.proposedCache.get(file.path);
    if (proposed === undefined && cached && cached.mtime === file.stat.mtime) proposed = cached.value;
    host.empty();
    const cur = ratingOf(this.fm(file));
    const box = host.createDiv({ cls: "cm-rate" });
    const row = (label, list, now, part, prop) => {
      const r = box.createDiv({ cls: "cm-rate-row" });
      r.createSpan({ cls: "cm-rate-label", text: label });
      const g = r.createDiv({ cls: "cm-rate-group" });
      g.setAttr("role", "group");
      g.setAttr("aria-label", label);
      list.forEach(([k, meaning]) => {
        const b = g.createEl("button", { cls: "cm-rate-btn", text: k });
        b.setAttr("title", `${k}: ${meaning}` + (prop === k ? " (proposed)" : ""));
        b.setAttr("aria-label", `${label} ${k}: ${meaning}`);
        b.setAttr("aria-pressed", String(now === k));
        if (now === k) b.addClass("is-on");
        if (prop === k && now !== k) b.addClass("is-proposed");
        b.addEventListener("click", (e) => { e.stopPropagation(); this.setRating(file, part, now === k ? null : k); });
      });
    };
    row("Reliability", RATING_REL, cur.rel, "rel", proposed ? proposed.rel : "");
    row("Credibility", RATING_CRED, cur.cred, "cred", proposed ? proposed.cred : "");
    const foot = box.createDiv({ cls: "cm-rate-foot" });
    const meaning = (list, k) => (list.find((x) => x[0] === k) || [])[1] || "";
    if (cur.rel && cur.cred) foot.createSpan({ cls: "cm-rate-sum", text: `${cur.rel}-${cur.cred}: ${meaning(RATING_REL, cur.rel)}; ${meaning(RATING_CRED, cur.cred).toLowerCase()}` });
    else foot.createSpan({ cls: "cm-rate-sum is-empty", text: cur.rel || cur.cred ? "Half rated. Set both before verifying." : "Not rated yet" });
    if (proposed && (cur.rel !== proposed.rel || cur.cred !== proposed.cred)) {
      const use = foot.createEl("button", { cls: "cm-mini", text: `Use ${proposed.rel}-${proposed.cred}` });
      use.setAttr("title", "Set both to the rating the agent proposed");
      use.addEventListener("click", (e) => { e.stopPropagation(); this.setRating(file, "both", proposed); });
    }
    if (proposed === undefined) this.proposedRating(file).then((p) => { if (host.isConnected) this.drawRatingButtons(host, file, p); });
  }

