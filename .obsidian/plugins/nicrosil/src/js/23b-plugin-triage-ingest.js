  /* ---------- Triage dashboard and ingest runs (4.4.0) ---------- */

  /**
   * While the Triage tab is the page in front, the right sidebar is closed so the list and queue have the room (4.4.1), the same way the atlas
   * closes its sidebars (syncAtlasSidebars). It opens again when another page comes to the front or the tab closes. Whether it was open is kept in
   * `settings.triageSidebar`, so it survives a restart with Triage still open; a sidebar I open myself meanwhile is left as I set it.
   */
  syncTriageSidebar() {
    const ws = this.app.workspace;
    const front = ws.getMostRecentLeaf ? ws.getMostRecentLeaf(ws.rootSplit) : null;
    const onTriage = !!(front && front.view instanceof TriageView);
    const saved = this.settings.triageSidebar;
    if (onTriage && !saved) {
      const open = !!ws.rightSplit && !ws.rightSplit.collapsed;
      this.settings.triageSidebar = { right: open };
      this.persist();
      if (open) ws.rightSplit.collapse();
    } else if (!onTriage && saved) this.restoreTriageSidebar();
  }

  restoreTriageSidebar() {
    const ws = this.app.workspace, saved = this.settings && this.settings.triageSidebar;
    if (!saved) return;
    delete this.settings.triageSidebar;
    this.persist();
    if (saved.right && !this.settings.tinmindMode && ws.rightSplit && ws.rightSplit.collapsed) ws.rightSplit.expand(); // the Tinmind's mode keeps the right sidebar closed
  }

  /** Opens the Triage tab, or brings it forward if it is open. */
  async activateTriage() {
    const open = this.app.workspace.getLeavesOfType(TRIAGE_VIEW_TYPE)[0];
    if (open) { this.app.workspace.revealLeaf(open); return; }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: TRIAGE_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  /** Every source in Ingestion/Raw, from the file records only (names, types, sizes, dates); no file is opened. */
  rawEntries(now) {
    const files = this.app.vault.getFiles()
      .filter((f) => f.path.startsWith(RAW_DIR) || f.path.startsWith("Sources/"))
      .map((f) => ({ path: f.path, name: f.name, basename: f.basename, extension: f.extension, size: f.stat.size, ctime: f.stat.ctime }));
    return triageEntries(files, now || Date.now());
  }

  refreshTriage() {
    this.app.workspace.getLeavesOfType(TRIAGE_VIEW_TYPE).forEach((l) => { if (l.view instanceof TriageView) l.view.render(); });
  }

  /** Starts a run over the chosen sources: one ingest tab each, in list order. auto: the next starts when the last one's first turn ends. */
  startIngest(entries, opts) {
    if (Platform.isMobile) { new Notice("Ingesting needs Obsidian on a computer: it runs Claude Code."); return; }
    if (!entries.length) return;
    this.ingestRun = { items: entries.slice(), next: 0, opts, lastView: null };
    this.ingestStartNext(null);
  }

  /** Opens the next source's tab. from: the tab asking, which must be the latest one (so an old tab's button can't skip ahead). */
  async ingestStartNext(from) {
    const run = this.ingestRun;
    if (!run || run.next >= run.items.length) return;
    if (from && from !== run.lastView) return;
    const entry = run.items[run.next];
    run.next++;
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: INGEST_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
    if (!(leaf.view instanceof IngestView)) return;
    run.lastView = leaf.view;
    const o = run.opts;
    leaf.view.begin({ entry, model: o.model, effort: o.effort, mode: o.mode, focus: o.focus, batch: run.items.length > 1 ? { n: run.next, of: run.items.length } : null });
  }

  /** An ingest tab's first turn ended (answered, failed or cancelled): in a batch, start the next source. */
  ingestTurnDone(view) {
    const run = this.ingestRun;
    if (run && run.opts.auto && view === run.lastView) this.ingestStartNext(view);
  }

  /** The source a one-at-a-time run would start next from this tab, or null. */
  ingestNextFor(view) {
    const run = this.ingestRun;
    if (!run || run.opts.auto || view !== run.lastView || run.next >= run.items.length) return null;
    return run.items[run.next];
  }

  /** Copies one Raw file, unchanged, into Ingestion/.selected/ for Claude to read, and returns the copy's path. */
  async stageForIngest(path) {
    const ad = this.app.vault.adapter;
    if (!(await ad.exists(INGEST_STAGE_DIR))) await ad.mkdir(INGEST_STAGE_DIR);
    const name = path.split("/").pop();
    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    let dest = `${INGEST_STAGE_DIR}/${name}`;
    for (let i = 2; await ad.exists(dest); i++) dest = `${INGEST_STAGE_DIR}/${stem} (${i})${ext}`;
    await ad.copy(path, dest);
    return dest;
  }

  /** Removes a staged copy, and the folder once it is empty. */
  async unstageIngest(p) {
    const ad = this.app.vault.adapter;
    try { if (await ad.exists(p)) await ad.remove(p); } catch (e) { console.warn("Nicrosil: couldn't remove the staged copy", p, e); }
    try {
      if (await ad.exists(INGEST_STAGE_DIR)) {
        const l = await ad.list(INGEST_STAGE_DIR);
        if (!l.files.length && !l.folders.length) await ad.rmdir(INGEST_STAGE_DIR, false);
      }
    } catch (e) { /* leave it for next start */ }
  }

  /** At startup no ingest tab is running (they don't survive a restart), so any staged copies left behind are removed. */
  async clearIngestStage() {
    const ad = this.app.vault.adapter;
    try { if (await ad.exists(INGEST_STAGE_DIR)) await ad.rmdir(INGEST_STAGE_DIR, true); } catch (e) { console.warn("Nicrosil: couldn't clear", INGEST_STAGE_DIR, e); }
  }

