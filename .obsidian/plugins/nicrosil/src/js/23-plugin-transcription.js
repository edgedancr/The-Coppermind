  /* ---------- Transcription queue (3.16.0) ---------- */

  /** Notes in the Tinmind whose properties say `transcription: draft`, each with the scans it lists, in the order the scans were photographed. */
  pendingTranscriptions() {
    const out = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!f.path.startsWith(NOTES_DIR)) continue;
      const fm = (this.app.metadataCache.getFileCache(f) || {}).frontmatter;
      if (!fm || String(fm.transcription || "").trim().toLowerCase() !== "draft") continue;
      out.push({ file: f, pages: scanNames(fm.scan_pages) });
    }
    const num = { numeric: true };
    return out.sort((a, b) => (a.pages[0] || "~").localeCompare(b.pages[0] || "~", undefined, num) || a.file.path.localeCompare(b.file.path, undefined, num));
  }

  /** The scans in Sources/Scans. */
  scanFiles() {
    return this.app.vault.getFiles().filter((f) => f.path.startsWith(SCAN_DIR) && /\.(jpe?g|png|webp)$/i.test(f.path));
  }

  /** The scans no pending note lists yet: the pages still to be transcribed. */
  scansWaiting(items) {
    const used = new Set();
    items.forEach((i) => i.pages.forEach((n) => used.add(scanKey(n))));
    return this.scanFiles().filter((f) => !used.has(scanKey(f.name)));
  }

  /** The scans (as scanKey) that pending notes other than `path` still list, so a page two notes share isn't deleted under the second one. */
  scanKeysUsedElsewhere(path) {
    const used = new Set();
    this.pendingTranscriptions().filter((i) => i.file.path !== path).forEach((i) => i.pages.forEach((n) => used.add(scanKey(n))));
    return used;
  }

  /**
   * Opens the queue (3.28.0): a pane of its own, split off the main area, that makes the note's pane beside it (see TranscribeView).
   * If the queue is already open it is brought forward and its layout checked.
   */
  async activateTranscribe() {
    const ws = this.app.workspace;
    let leaf = ws.getLeavesOfType(TR_VIEW_TYPE)[0];
    if (!leaf) {
      const base = ws.getMostRecentLeaf(ws.rootSplit) || ws.getLeaf("tab");
      leaf = ws.createLeafBySplit(base, "vertical");
      await leaf.setViewState({ type: TR_VIEW_TYPE, active: true });
    } else if (leaf.view instanceof TranscribeView) {
      await leaf.view.render();
    }
    ws.revealLeaf(leaf);
  }

  /**
   * Verify a transcription: the scans it lists go to the trash (all but any that another unverified note still lists), then the note
   * loses `transcription` and `scan_pages`, then the log gets an entry. The scans go first, so a failure there leaves the note as it was.
   */
  async verifyTranscription(file, pages, decisions, unsure) {
    const date = today();
    const names = [...new Set(pages)];
    const used = this.scanKeysUsedElsewhere(file.path);
    const trashed = [], kept = [], missing = [];
    for (const name of names) {
      const f = this.app.vault.getAbstractFileByPath(scanPath(name));
      if (!(f instanceof TFile)) { missing.push(name); continue; }
      if (used.has(scanKey(name))) { kept.push(name); continue; }
      await this.app.fileManager.trashFile(f);
      trashed.push(name);
    }
    await this.app.fileManager.processFrontMatter(file, (fm) => { delete fm.transcription; delete fm.scan_pages; });
    await this.appendLog(transcribeVerifyLogEntry({ name: file.basename, date, pages: names, trashed, kept, missing, drawings: decisions, unsure }));
    new Notice(`Verified “${file.basename}”. ${trashed.length} scan${trashed.length === 1 ? "" : "s"} moved to the trash.`, 5000);
    this.scheduleTinRefresh();
    this.dashboards.forEach((r) => r());
  }

  /** Discard a transcription: the draft note is deleted and its scans stay, so it can be done again. The reason is logged first. */
  async discardTranscription(file, reason) {
    await this.appendLog(rejectLogEntry({ name: `${file.basename} (transcription)`, date: today(), reason, dangling: [], resolved: [] }));
    const name = file.basename;
    await this.app.fileManager.trashFile(file);
    new Notice(`Discarded “${name}”. Its scans are still in Sources/Scans.`, 5000);
    this.scheduleTinRefresh();
    this.dashboards.forEach((r) => r());
  }


