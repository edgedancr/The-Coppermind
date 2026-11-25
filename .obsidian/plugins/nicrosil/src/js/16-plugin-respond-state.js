  /* --- respond to a page: a perspective saved in Perspectives/, linked back from the page --- */

  isRespondable(file) {
    return file instanceof TFile && file.extension === "md" && /^(Wiki|Sources\/Source Cards|Perspectives)\//.test(file.path);
  }

  /** The perspectives whose `responds_to` points at this page, by name. */
  responsesTo(file) {
    const out = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!f.path.startsWith("Perspectives/") || f.path === file.path) continue;
      const fm = this.fm(f);
      if (String(fm.type || "") !== "perspective") continue;
      const v = fm.responds_to;
      const list = Array.isArray(v) ? v : v ? [v] : [];
      const hit = list.some((x) => {
        const m = /\[\[([^\]|#]+)/.exec(String(x));
        const dest = m && this.app.metadataCache.getFirstLinkpathDest(m[1].trim(), f.path);
        return !!dest && dest.path === file.path;
      });
      if (hit) out.push(f);
    }
    return out.sort((a, b) => a.basename.localeCompare(b.basename));
  }

  async respondTo(file) {
    const existing = this.responsesTo(file);
    if (!existing.length) return this.createResponse(file);
    new ResponsePicker(this.app, existing, (i) => { if (i.fresh) this.createResponse(file); else this.openResponse(i.file); }).open();
  }

  async openResponse(f) {
    const leaf = this.app.workspace.getLeaf("split", "vertical");
    await leaf.openFile(f, { state: { mode: "source" } });
  }

  /** Makes Perspectives/Response to <page>.md from the Perspective template, with `responds_to` set to the page, and opens it beside the page. */
  async createResponse(file) {
    try {
      const tplFile = this.app.vault.getAbstractFileByPath("_templates/Perspective.md");
      let tpl = tplFile instanceof TFile ? (await this.app.vault.read(tplFile)).replace(/\r\n/g, "\n") : "";
      if (!tpl.startsWith("---")) tpl = "---\ntype: perspective\nstatus: draft\nlayer: \nresponds_to: []\ncourses: []\nwritten_on: \"{{date:YYYY-MM-DD}}\"\nverified_on: \n---\n## My View\n- \n\n## Why I Hold It\n- \n\n## Where I Disagree or Feel Tension\n- \n\n## What Would Change My Mind\n- \n";
      const raw = this.fm(file).courses;
      const courses = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((c) => String(c).trim()).filter(Boolean);
      tpl = tpl.replace(/\{\{date:YYYY-MM-DD\}\}/g, today());
      tpl = tpl.replace(/^responds_to:.*$/m, `responds_to:\n  - ${JSON.stringify(`[[${file.basename}]]`)}`);
      if (courses.length) tpl = tpl.replace(/^courses:.*$/m, `courses:\n${courses.map((c) => `  - ${JSON.stringify(c)}`).join("\n")}`);
      if (!this.app.vault.getAbstractFileByPath("Perspectives")) await this.app.vault.createFolder("Perspectives");
      let name = `Response to ${file.basename}`, path = `Perspectives/${name}.md`, n = 2;
      while (this.app.vault.getAbstractFileByPath(path)) { name = `Response to ${file.basename} ${n++}`; path = `Perspectives/${name}.md`; }
      const made = await this.app.vault.create(path, tpl);
      await this.openResponse(made);
      new Notice(`Started “${name}”. The page links to it under its properties.`, 6000);
    } catch (e) {
      console.error("Nicrosil: couldn't start a response", e);
      new Notice(`Couldn't start a response: ${e.message}`, 8000);
    }
  }

  /** The "My take" line under a page's properties: links to the perspectives that respond to it. */
  drawMyTake(host, responses) {
    host.empty();
    host.createSpan({ cls: "cm-mytake-label", text: "My take" });
    responses.forEach((f) => {
      const a = host.createEl("a", { cls: "cm-mytake-link", text: f.basename, attr: { href: "#" } });
      a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); this.app.workspace.getLeaf(e.ctrlKey || e.metaKey ? "tab" : false).openFile(f); });
      if (this.fm(f).status !== "verified") host.createSpan({ cls: "cm-mytake-draft", text: "draft" });
    });
  }

  refreshAllStrips() {
    this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view && l.view.file) this.ensureStrips(l.view); });
  }

  schemaFile() {
    const f = this.app.vault.getAbstractFileByPath(SCHEMA_PATH);
    return f instanceof TFile ? f : null;
  }

  changelogFile() {
    const f = this.app.vault.getAbstractFileByPath(CHANGELOG_PATH);
    return f instanceof TFile ? f : null;
  }

  async openSchemaLog() {
    const file = this.changelogFile();
    if (!file) { new Notice(`Could not find ${CHANGELOG_PATH}.`); return; }
    const text = await this.app.vault.read(file);
    if (!findChangelog(text)) { new Notice("Schema Changelog has no “Changelog” heading, so there is nowhere to add the entry."); return; }
    const schema = this.schemaFile();
    const fmVersion = schema ? frontmatterValue(await this.app.vault.read(schema), "version") : null;
    new SchemaLogModal(this.app, this, text, fmVersion).open();
  }

  async addSchemaEntry(version, desc) {
    const file = this.changelogFile();
    if (!file) throw new Error(`Could not find ${CHANGELOG_PATH}.`);
    const schema = this.schemaFile();
    const date = today();
    const fmVersion = schema ? frontmatterValue(await this.app.vault.read(schema), "version") : null;
    await this.app.vault.process(file, (text) => {
      // Re-check against the file as it is right now (it may have changed since the dialog opened).
      const err = checkVersion(text, version, fmVersion);
      if (err) throw new Error(err);
      return addChangelogEntry(text, version, date, desc);
    });
    if (schema) await this.app.vault.process(schema, (text) => setFrontmatterProps(text, { version, updated: date }));
    new Notice(`Added ${version} to the Schema Changelog.`);
  }

  /* --- state --- */

  async refresh() {
    const items = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!this.isReviewable(f)) continue;
      const fm = this.fm(f);
      if (fm.status !== "draft" && fm.status !== "verified") continue;
      const flags = fm.status === "draft" ? parseFlags(await this.app.vault.cachedRead(f)) : [];
      items.push({ path: f.path, name: f.basename, group: groupOf(f.path), status: fm.status, flags, draftedOn: fm.drafted_on ? String(fm.drafted_on) : "", changes: fm.status === "draft" ? changeLines(fm.changes_since_verified) : [] });
    }
    this.items = items;
    this.skipped = this.skipped.filter((p) => items.some((i) => i.path === p && i.status === "draft"));
    this.renderAll();
  }

  queue() {
    return sortQueue(this.items.filter((i) => i.status === "draft"), this.settings.sort, this.skipped);
  }

  resolvedFor(path) { return this.resolved[path] || []; }

  async onRename(file, oldPath) {
    const wasIn = oldPath.endsWith(".md") && INDEX_SCOPE.some((re) => re.test(oldPath));
    if (wasIn || this.indexable(file)) {
      const oldName = oldPath.replace(/^.*\//, "").replace(/\.md$/, "");
      if (wasIn && this.indexable(file) && oldName !== file.basename) this.indexRenames.push([oldName, file.basename]);
      this.scheduleIndexSync();
    }
    if (this.resolved[oldPath]) {
      this.resolved[file.path] = this.resolved[oldPath];
      delete this.resolved[oldPath];
      await this.persist();
    }
    this.skipped = this.skipped.map((p) => (p === oldPath ? file.path : p));
    if (this.currentPath === oldPath) this.currentPath = file.path;
    this.scheduleRefresh();
  }

  currentFile() {
    const active = this.app.workspace.getActiveFile();
    if (active) return active;
    const f = this.currentPath && this.app.vault.getAbstractFileByPath(this.currentPath);
    return f instanceof TFile ? f : null;
  }

