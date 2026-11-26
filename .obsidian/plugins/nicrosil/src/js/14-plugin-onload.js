module.exports = class Nicrosil extends Plugin {
  async onload() {
    const data = (await this.loadData()) || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
    this.resolved = data.resolved || {}; // path -> [{kind,label,title,decision,date}]
    this.skipped = [];                   // this session only
    this.items = [];
    this.dashboards = new Set();
    this.currentPath = null;
    this.dashOpen = {};
    this.foldedViews = new WeakMap();
    this.readHandled = new WeakMap(); // leaf -> path already considered for Reading view
    this.stripPaths = new WeakMap();
    this.stripObservers = new Set();
    this.indexRenames = [];   // [oldName, newName] pairs waiting for the next index sync, so a renamed page keeps its summary
    this.indexEmpty = new Set(); // paths of pages whose index entry has no summary yet
    this.proposedCache = new Map(); // source card path -> { mtime, value } for its "Proposed B-2" line
    this.popObservers = new Set(); // watchers on hover previews, dropped when the preview closes
    this.lastHover = null;         // the page the pointer last hovered a link to, so a hover preview knows which page it shows

    this.registerView(VIEW_TYPE, (leaf) => new QueueView(leaf, this));
    this.registerView(TR_VIEW_TYPE, (leaf) => new TranscribeView(leaf, this));
    this.registerView(REL_VIEW_TYPE, (leaf) => new RelationsView(leaf, this));
    this.registerView(MAP_VIEW_TYPE, (leaf) => new WikiMapView(leaf, this));
    this.registerView(QUERY_VIEW_TYPE, (leaf) => new QueryView(leaf, this));
    this.registerView(TRIAGE_VIEW_TYPE, (leaf) => new TriageView(leaf, this));
    this.registerView(INGEST_VIEW_TYPE, (leaf) => new IngestView(leaf, this));
    this.addSettingTab(new ReviewSettings(this.app, this));
    this.registerCommands();

    delete this.settings.ambient; // the Ambient animations switch was removed in 2.7.6: everything it controlled is always on
    delete this.settings.dashStyle; // the Classic/Quiet switch was removed in 2.4.2
    delete this.settings.mapTab; delete this.settings.mapFlow; // the wiki map's Hierarchy/Map tabs and Flow switch went with the atlas in 3.29.0
    document.body.classList.add("cm-quiet");
    // no status bar counter (removed in 2.13.4): renderStatus() does nothing while statusEl is unset

    // (3.13.0: the review queue and relations panel buttons are in the left sidebar's tab bar now, and the ribbon is hidden)

    this.registerMarkdownCodeBlockProcessor("coppermind-hero", (src, el, ctx) => this.renderHero(el, src, ctx));
    this.registerMarkdownCodeBlockProcessor("tinmind-hero", (src, el, ctx) => this.renderTinHero(el, src, ctx));
    for (const [name, method] of [["coppermind-dashboard", "renderDashboard"], ["coppermind-nav", "renderNav"], ["coppermind-classes", "renderClassNav"], ["coppermind-activity", "renderActivity"]]) {
      this.registerMarkdownCodeBlockProcessor(name, (src, el, ctx) => ctx.addChild(new LiveBlock(el, this, method)));
    }
    this.registerMarkdownPostProcessor((el, ctx) => this.addResolveButtons(el, ctx));
    this.searchIndex = new SearchIndex(this.app);
    this.registerMarkdownCodeBlockProcessor("coppermind-search", (src, el, ctx) => ctx.addChild(new SearchBlock(el, this)));
    this.registerEvent(this.app.vault.on("modify", (f) => this.searchIndex.touch(f)));
    this.registerEvent(this.app.vault.on("create", (f) => this.searchIndex.touch(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.searchIndex.remove(f.path)));
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => this.searchIndex.rename(f, oldPath)));
    this.tinIndex = new SearchIndex(this.app, inTinScope, makeTinEntry, searchTin);
    this.registerEvent(this.app.vault.on("modify", (f) => this.tinIndex.touch(f)));
    this.registerEvent(this.app.vault.on("create", (f) => this.tinIndex.touch(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.tinIndex.remove(f.path)));
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => this.tinIndex.rename(f, oldPath)));

    this.scheduleRefresh = debounce(() => this.refresh(), 400, true);
    this.registerInterval(window.setInterval(() => this.scheduleRefresh(), 60 * 60 * 1000)); // keeps the health check card current overnight
    this.startUsagePolling();
    this.registerEvent(this.app.workspace.on("file-open", (file) => {
      this.readOnOpen(file);
      this.syncSchemaButtons(); this.syncHomeButtons();
      if (file) this.currentPath = file.path;
      if (file && this.isDashboard(file)) this.startDashIntro();
      this.syncDashboardLeaves(true);
      this.renderViews();
    }));
    // folders and files whose names start with "_" are hidden in the file list every time Obsidian opens; the eye button in its toolbar shows them until Obsidian closes
    document.body.classList.add("cm-hide-underscore");
    this.installPageFade();
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      this.syncDashboardLeaves(false);
      this.enforceReading(leaf);
      this.syncAtlasSidebars();
      this.syncTriageSidebar();
    }));
    this.registerEvent(this.app.workspace.on("layout-change", () => { this.syncSchemaButtons(); this.syncHomeButtons(); this.syncDashboardLeaves(false); this.syncAtlasSidebars(); this.syncTriageSidebar(); }));
    this.registerEvent(this.app.workspace.on("hover-link", (e) => {
      try {
        const lt = String(e.linktext || "").split("#")[0].split("|")[0];
        const file = this.app.metadataCache.getFirstLinkpathDest(lt, e.sourcePath || "") || this.app.vault.getAbstractFileByPath(lt);
        // A link to a spot on the page it is written in (a footnote, a heading, a block) previews part of that page, not the page, so the preview gets no strip.
        const samePart = String(e.linktext || "").includes("#") && (lt === "" || (file instanceof TFile && file.path === e.sourcePath));
        this.lastHover = file instanceof TFile && !samePart ? { file, t: Date.now() } : null;
      } catch (err) { this.lastHover = null; }
    }));
    const popWatch = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => { if (n instanceof HTMLElement && n.classList.contains("hover-popover")) this.watchPopover(n); });
    });
    popWatch.observe(document.body, { childList: true });
    this.register(() => popWatch.disconnect());
    this.registerEvent(this.app.metadataCache.on("changed", (file) => {
      this.scheduleRefresh(); this.syncDashboardLeaves(false);
      if (file && this.indexEmpty.has(file.path)) this.scheduleIndexSync(6000); // the page now may have a summary to show
      if (file && file.path.startsWith("Perspectives/")) this.refreshAllStrips(); // a response may have been added, renamed or changed
      else if (file) this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view && l.view.file && l.view.file.path === file.path) this.ensureStrips(l.view); });
    }));
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file, oldPath)));
    this.app.workspace.onLayoutReady(async () => {
      // keep _index.md up to date (registered now, so the files Obsidian loads at startup don't each count as a new page)
      this.registerEvent(this.app.vault.on("create", (f) => { if (this.indexable(f)) this.scheduleIndexSync(); }));
      this.registerEvent(this.app.vault.on("delete", (f) => { if (this.indexable(f)) this.scheduleIndexSync(); }));
      if (this.settings.autoIndex !== false) this.scheduleIndexSync(4000);
      // close the panels Obsidian keeps bringing back in the right sidebar (backlinks, outgoing links, tags, properties, outline)
      if (this.settings.hidePanels !== false) {
        for (const t of ["backlink", "outgoing-link", "tag", "all-properties", "outline"]) this.app.workspace.detachLeavesOfType(t);
      }
      if (performance.now() < 20000) window.setTimeout(() => this.closeOtherTabsOnStart(), 1500); // only when Obsidian itself just started (3.21.0), not when the plugin is reloaded later
      this.exitTinMode(); // Obsidian always opens in the Coppermind's mode (3.2.1): colors back, the right sidebar as it was before the Tinmind
      this.paintTinMode();
      this.startDashIntro();
      this.searchIndex.start();
      this.tinIndex.start();
      this.syncSchemaButtons(); this.syncHomeButtons();
      this.syncAtlasSidebars();
      this.syncTriageSidebar();
      await this.migrateHome();
      await this.migrateTinDashboard();
      await this.migrateTinBacklinks();
      await this.migrateHubNames();
      await this.migrateCourseLinks();
      this.registerEvent(this.app.metadataCache.on("resolved", () => { if (!this.settings.tinHubsRenamed) this.migrateHubNames(); })); // runs again once the properties are indexed
      if (this.app.vault.getAbstractFileByPath(DASHBOARD_PATH)) await this.fixHomepageSetting(); // the startup page follows the Dashboard's name
      await this.migrateSchemaStub();
      try {
        const r = await this.ensureLog(today());
        if (r.created) new Notice(`Started this month's log: ${r.file.basename}.`, 6000);
      } catch (e) { console.error("Nicrosil: could not start this month's log", e); new Notice(`Could not start this month's log: ${e.message}`, 10000); }
      this.syncDashboardLeaves(true);
      const f = this.app.workspace.getActiveFile();
      if (f) this.currentPath = f.path;
      this.refresh();
    });
  }

  onunload() {
    this.restoreAtlasSidebars();
    this.restoreTriageSidebar();
    clearTimeout(this.dashIntroTimer);
    clearTimeout(this.indexTimer);
    clearTimeout(this.usageTimer);
    document.querySelectorAll(".cm-schema-log-btn, .cm-respond-btn").forEach((e) => e.remove());
    this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view) { l.view.__cmSchemaBtn = null; l.view.__cmRespondBtn = null; } });
    document.querySelectorAll(".cm-resolve-btn, .cm-home-btn, .cm-underscore-btn, .cm-mode-btn, .cm-git-btn, .cm-panel-btn").forEach((e) => e.remove());
    document.body.classList.remove("cm-hide-underscore");
    document.body.classList.remove("cm-on-dashboard", "cm-on-tin", "cm-tin-mode");
    document.querySelectorAll(".cm-dashboard-leaf, .cm-log-leaf, .cm-agents-leaf, .cm-topics-leaf, .cm-tinnote-leaf, .cm-noprops-leaf, .cm-strip-leaf, .cm-props-open, .cm-st-verified, .cm-st-draft").forEach((e) => { e.classList.remove("cm-dashboard-leaf", "cm-log-leaf", "cm-agents-leaf", "cm-topics-leaf", "cm-tinnote-leaf", "cm-noprops-leaf", "cm-strip-leaf", "cm-props-open", "cm-st-verified", "cm-st-draft"); e.style.removeProperty("--cm-log-title"); });
    document.querySelectorAll(".cm-dashboard-tab").forEach((e) => e.classList.remove("cm-dashboard-tab"));
    document.body.classList.remove("cm-quiet");
    document.querySelectorAll(".cm-propstrip, .cm-ratebar, .cm-mytake, .cm-typedbar").forEach((e) => e.remove());
    this.stripObservers.forEach((o) => o.disconnect());
    this.stripObservers.clear();
    this.popObservers.forEach((o) => o.disconnect());
    this.popObservers.clear();
    this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view && l.view.containerEl) { l.view.containerEl.classList.remove("cm-strip-leaf", "cm-props-open"); l.view.containerEl.querySelectorAll(".cm-propstrip, .cm-ratebar, .cm-mytake, .cm-typedbar").forEach((e) => e.remove()); l.view.__cmStripObs = null; } });
  }

  async persist() {
    await this.saveData({ settings: this.settings, resolved: this.resolved });
  }

  registerCommands() {
    const onPage = (fn) => (checking) => {
      const f = this.currentFile();
      if (!f || !this.isReviewable(f)) return false;
      if (!checking) fn(f);
      return true;
    };
    this.addCommand({ id: "verify-page", name: "Verify this page", hotkeys: [{ modifiers: ["Alt"], key: "v" }], checkCallback: onPage((f) => this.verify(f)) });
    this.addCommand({ id: "reject-page", name: "Reject this draft (deletes it)", hotkeys: [{ modifiers: ["Alt"], key: "r" }], checkCallback: onPage((f) => this.reject(f)) });
    this.addCommand({ id: "skip-page", name: "Skip this draft for now", hotkeys: [{ modifiers: ["Alt"], key: "s" }], checkCallback: onPage((f) => this.skip(f)) });
    this.addCommand({ id: "resolve-flag", name: "Resolve a flag on this page", hotkeys: [{ modifiers: ["Alt"], key: "f" }], checkCallback: onPage((f) => this.pickFlag(f)) });
    this.addCommand({ id: "next-draft", name: "Open the next draft", hotkeys: [{ modifiers: ["Alt"], key: "n" }], callback: () => { const f = this.currentFile(); this.openNext(f ? f.path : null); } });
    this.addCommand({ id: "switch-mode", name: "Switch between the Coppermind and the Tinmind", hotkeys: [{ modifiers: ["Alt", "Shift"], key: "d" }], callback: () => this.toggleMode() });
    this.addCommand({ id: "show-files", name: "Show the file list", hotkeys: [{ modifiers: ["Alt"], key: "e" }], callback: () => this.showFiles() });
    this.addCommand({ id: "open-dashboard", name: "Go to the Dashboard", hotkeys: [{ modifiers: ["Alt"], key: "d" }], callback: () => this.openDashboard() });
    this.registerInterval(window.setInterval(() => this.syncHomeButtons(), 1500));
    this.scheduleTinRefresh = debounce(() => this.refreshTin(), 150, true);
    const inTin = (f) => !!f && typeof f.path === "string" && f.path.startsWith(NOTES_DIR);
    this.registerEvent(this.app.vault.on("create", (f) => { if (inTin(f)) this.scheduleTinRefresh(); }));
    this.registerEvent(this.app.vault.on("delete", (f) => { if (inTin(f)) this.scheduleTinRefresh(); }));
    this.registerEvent(this.app.vault.on("rename", (f, old) => { if (inTin(f) || String(old).startsWith(NOTES_DIR)) this.scheduleTinRefresh(); }));
    this.registerEvent(this.app.metadataCache.on("changed", (f) => { if (inTin(f)) this.scheduleTinRefresh(); }));
    this.registerEvent(this.app.workspace.on("file-open", (f) => { if (inTin(f)) this.scheduleTinRefresh(); }));
    this.addCommand({ id: "respond-to-page", name: "Respond to this page (new perspective)", hotkeys: [{ modifiers: ["Alt"], key: "p" }], checkCallback: (checking) => {
      const f = this.currentFile();
      if (!f || !this.isRespondable(f)) return false;
      if (!checking) this.respondTo(f);
      return true;
    } });
    this.addCommand({ id: "update-index", name: "Update the index now", callback: () => this.syncIndex({ manual: true }) });
    this.addCommand({ id: "log-schema-change", name: "Log a schema change", callback: () => this.openSchemaLog() });
    this.addCommand({ id: "open-wiki-map", name: "Open the atlas", hotkeys: [{ modifiers: ["Alt"], key: "m" }], callback: () => this.activateWikiMap() });
    this.addCommand({ id: "show-in-atlas", name: "Show this page in the atlas", checkCallback: (checking) => {
      const f = this.currentFile();
      if (!f || !inAtlasScope(f.path)) return false;
      if (!checking) this.activateWikiMap({ focus: f.path });
      return true;
    } });
    this.addCommand({ id: "open-relations", name: "Open the Lens", hotkeys: [{ modifiers: ["Alt"], key: "l" }], callback: () => this.activateRelations() });
    this.addCommand({ id: "open-queue", name: "Open the review queue", hotkeys: [{ modifiers: ["Alt"], key: "q" }], callback: () => this.activateView() });
    this.addCommand({ id: "open-transcription-queue", name: "Open the transcription queue", hotkeys: [{ modifiers: ["Alt"], key: "t" }], callback: () => this.activateTranscribe() });
    this.addCommand({ id: "open-triage", name: "Open Triage (the sources waiting in Ingestion/Raw)", hotkeys: [{ modifiers: ["Alt"], key: "i" }], callback: () => this.activateTriage() });
    // Triage keeps itself current: a file added, removed, renamed or changed in Raw (or a text copy in Sources/) redraws it.
    this.scheduleTriageRefresh = debounce(() => this.refreshTriage(), 300, true);
    const forTriage = (p) => typeof p === "string" && (p.startsWith(RAW_DIR) || p.startsWith("Sources/"));
    ["create", "delete", "modify"].forEach((ev) => this.registerEvent(this.app.vault.on(ev, (f) => { if (f && forTriage(f.path)) this.scheduleTriageRefresh(); })));
    this.registerEvent(this.app.vault.on("rename", (f, old) => { if ((f && forTriage(f.path)) || forTriage(old)) this.scheduleTriageRefresh(); }));
    this.app.workspace.onLayoutReady(() => this.clearIngestStage());
  }

