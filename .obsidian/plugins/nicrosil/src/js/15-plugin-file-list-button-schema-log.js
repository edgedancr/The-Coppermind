  /* --- the Coppermind button at the top of the file list --- */

  /** Puts a large "The Coppermind" button above the files in every file explorer. It opens the Dashboard; Ctrl+click or middle-click opens it in a new tab. */
  syncHomeButtons() {
    // Find the file explorers in the page itself rather than through leaf.view: sidebar views can still be
    // "deferred" (not loaded) when Obsidian starts, and then leaf.view has no content to look at.
    document.querySelectorAll('.workspace-leaf-content[data-type="file-explorer"]').forEach((leafEl) => {
      // The file list keeps its header buttons (.nav-header) and the files directly in the leaf, with no .view-content around them.
      const header = leafEl.querySelector(".nav-header");
      const holder = header ? header.parentElement : (leafEl.querySelector(".view-content") || leafEl);
      // the eye button sits at the right end of the sidebar's tab bar, beside the Files, Search and Bookmarks icons (3.4.0); the file list's own toolbar is hidden by styles.css
      const tabs = leafEl.closest(".workspace-tabs");
      const tabBar = tabs ? tabs.querySelector(":scope > .workspace-tab-header-container") : null;
      const tabRow = tabBar ? tabBar.querySelector(":scope > .workspace-tab-header-container-inner") : null;
      if (tabBar) tabBar.querySelectorAll(":scope > .cm-underscore-btn").forEach((e) => e.remove()); // the 3.4.0 spot, at the far right
      if (tabRow && !tabRow.querySelector(":scope > .cm-underscore-btn")) {
        const eye = createDiv({ cls: "clickable-icon cm-underscore-btn" });
        eye.setAttr("role", "button");
        eye.addEventListener("click", () => this.toggleUnderscoreFolders());
        tabRow.appendChild(eye); // right after the Files icon (Search and Bookmarks are hidden)
      }
      this.paintUnderscoreButtons();
      // the mode button sits right after the eye (3.8.0): it switches between the Coppermind and the Tinmind without opening a page
      if (tabRow && !tabRow.querySelector(":scope > .cm-mode-btn")) {
        const mode = createDiv({ cls: "clickable-icon cm-mode-btn" });
        mode.setAttr("role", "button"); mode.setAttr("tabindex", "0");
        mode.addEventListener("click", () => this.toggleMode());
        mode.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.toggleMode(); } });
        tabRow.insertBefore(mode, tabRow.querySelector(":scope > .cm-underscore-btn")); // the mode button comes first, then the eye (3.13.2)
      }
      if (tabRow) { // a tab bar made before 3.13.2 has the eye first: put the mode button ahead of it
        const eyeEl = tabRow.querySelector(":scope > .cm-underscore-btn"), modeEl = tabRow.querySelector(":scope > .cm-mode-btn");
        if (eyeEl && modeEl && (eyeEl.compareDocumentPosition(modeEl) & Node.DOCUMENT_POSITION_FOLLOWING)) tabRow.insertBefore(modeEl, eyeEl);
      }
      // after the mode button: the review queue and relations buttons (3.13.0, Coppermind mode only), then the two git buttons (3.12.0, both modes): Commit-and-sync, then Pull
      if (tabRow) {
        for (const g of [...PANEL_BUTTONS, ...GIT_BUTTONS]) {
          if (tabRow.querySelector(":scope > ." + g.cls)) continue;
          const b = createDiv({ cls: "clickable-icon " + (g.command ? "cm-git-btn " : "cm-panel-btn ") + g.cls });
          b.setAttr("role", "button"); b.setAttr("tabindex", "0");
          b.setAttr("aria-label", g.label);
          setIcon(b, g.icon);
          const go = () => (g.command ? this.runGit(g) : this[g.method]());
          b.addEventListener("click", go);
          b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
          tabRow.insertBefore(b, g.command ? null : tabRow.querySelector(":scope > .cm-git-btn")); // panel buttons go before the git ones
        }
      }
      this.paintModeButtons();
      const homeBtn = holder.querySelector(":scope > .cm-home-btn:not(.cm-tin-btn)");
      if (homeBtn && !holder.querySelector(":scope > .cm-tin-btn")) this.makeTinButton(homeBtn); // the Tinmind button sits under it (2.17.0)
      if (homeBtn) { this.ensureTinSide(holder); return; }
      const btn = createDiv({ cls: "cm-home-btn" });
      btn.setAttr("role", "button"); btn.setAttr("tabindex", "0");
      btn.setAttr("aria-label", "Open the Dashboard (Ctrl+click for a new tab)");
      btn.createSpan({ cls: "cm-logo cm-home-logo" }).setAttr("aria-hidden", "true");
      btn.createSpan({ cls: "cm-home-name", text: "The Coppermind" });
      btn.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); }); // no autoscroll on middle-click
      btn.addEventListener("click", (e) => this.openDashboard(e.ctrlKey || e.metaKey));
      btn.addEventListener("auxclick", (e) => { if (e.button === 1) { e.preventDefault(); this.openDashboard(true); } });
      btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.openDashboard(e.ctrlKey || e.metaKey); } });
      if (header) header.after(btn); else holder.prepend(btn);
      this.makeTinButton(btn);
      this.ensureTinSide(holder);
    });
  }

  /** The Tinmind button, directly under the Coppermind one: the same button in the Tinmind's colors and logo. It opens The Tinmind/Tinmind Dashboard; Ctrl+click or middle-click opens it in a new tab. */
  makeTinButton(after) {
    const btn = createDiv({ cls: "cm-home-btn cm-tin-btn" });
    btn.setAttr("role", "button"); btn.setAttr("tabindex", "0");
    btn.setAttr("aria-label", "Open The Tinmind (Ctrl+click for a new tab)");
    btn.createSpan({ cls: "cm-logo cm-logo-tin cm-home-logo" }).setAttr("aria-hidden", "true");
    btn.createSpan({ cls: "cm-home-name", text: "The Tinmind" });
    btn.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
    btn.addEventListener("click", (e) => this.openTinmind(e.ctrlKey || e.metaKey));
    btn.addEventListener("auxclick", (e) => { if (e.button === 1) { e.preventDefault(); this.openTinmind(true); } });
    btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.openTinmind(e.ctrlKey || e.metaKey); } });
    after.after(btn);
  }

  /**
   * Tinmind mode (2.18.0). Clicking The Tinmind (the file list button, or the Dashboard's card) switches the whole app to the Tinmind's
   * grey-and-lilac colors (the body class `cm-tin-mode`) and closes the right sidebar, which holds the review queue and the relations
   * panel. Opening the Dashboard (the Coppermind button, Alt+D) switches back, and the right sidebar comes back if it was open before.
   * The mode is saved in `data.json`, so it is still on after Obsidian restarts.
   */
  enterTinMode() {
    if (!this.settings.tinmindMode) {
      const rs = this.app.workspace.rightSplit;
      this.settings.tinmindMode = true;
      this.settings.tinRightWasOpen = !!rs && !rs.collapsed;
      this.persist();
    }
    this.paintTinMode();
    try {
      const ls = this.app.workspace.leftSplit;
      if (ls && ls.collapsed) ls.expand();
      const fe = this.app.workspace.getLeavesOfType("file-explorer")[0];
      if (fe) this.app.workspace.revealLeaf(fe); // the course tree lives in the file list's place
    } catch (e) { /* the tree is a convenience */ }
    this.refreshTin();
  }

  exitTinMode() {
    if (!this.settings.tinmindMode) return;
    const reopen = !!this.settings.tinRightWasOpen;
    this.settings.tinmindMode = false;
    delete this.settings.tinRightWasOpen;
    this.persist();
    this.paintTinMode();
    const rs = this.app.workspace.rightSplit;
    if (reopen && rs && rs.collapsed) rs.expand();
  }

  /** Puts the page in line with the saved mode: the body class, and the right sidebar closed while the mode is on. */
  paintTinMode() {
    const on = !!this.settings.tinmindMode;
    document.body.classList.toggle("cm-tin-mode", on);
    const rs = this.app.workspace.rightSplit;
    if (on && rs && !rs.collapsed) rs.collapse();
    this.paintModeButtons();
  }

  /** The mode button in the left sidebar's tab bar (3.8.0): switches between the Coppermind and the Tinmind, and opens no page. */
  /** Runs one of Obsidian Git's commands, as if I had clicked it in the Source Control panel. Nicrosil runs no git itself. */
  runGit(g) {
    const ok = this.app.commands.executeCommandById(g.command);
    if (!ok) new Notice("Obsidian Git isn't turned on, so this button can't run. Turn it on in Settings, Community plugins.", 8000);
  }

  /** Switches between the Coppermind and the Tinmind and brings the file list back (3.27.0), whichever left sidebar tab was showing. */
  toggleMode() {
    if (this.settings.tinmindMode) this.exitTinMode(); else this.enterTinMode();
    this.showFiles();
  }

  /** Opens the left sidebar on the file list (the Files tab's icon is hidden, so this is the way back from the search tab). */
  showFiles() {
    try {
      const ls = this.app.workspace.leftSplit;
      if (ls && ls.collapsed) ls.expand();
      const fe = this.app.workspace.getLeavesOfType("file-explorer")[0];
      if (fe) this.app.workspace.revealLeaf(fe);
    } catch (e) { /* a convenience */ }
  }

  /** Draws the mode button's icon: the Coppermind's logo in the Coppermind's mode, the Tinmind's logo in the Tinmind's. Drawn in the tab bar's own icon color, not a gradient. */
  paintModeButtons() {
    const tin = !!this.settings.tinmindMode;
    document.querySelectorAll(".cm-mode-btn").forEach((b) => {
      const mode = tin ? "tin" : "copper";
      if (b.dataset.mode === mode) return;
      b.dataset.mode = mode;
      b.empty();
      b.createSpan({ cls: tin ? "cm-logo cm-logo-tin cm-mode-logo" : "cm-logo cm-mode-logo" }).setAttr("aria-hidden", "true");
      b.setAttr("aria-label", tin ? "Switch to the Coppermind" : "Switch to the Tinmind");
    });
  }

  async openTinmind(newTab) {
    await this.migrateTinDashboard();
    const f = this.app.vault.getAbstractFileByPath(NOTES_DASHBOARD + ".md");
    if (!(f instanceof TFile)) { new Notice(`Couldn't find ${NOTES_DASHBOARD}.md.`); return; }
    this.enterTinMode();
    const already = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view.file && l.view.file.path === f.path);
    if (already && !newTab) { this.app.workspace.setActiveLeaf(already, { focus: true }); return; }
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(f, { state: { mode: "preview" } });
  }

  /** Shows or hides the folders and files whose names start with "_" in the file list. It is not remembered: they start hidden each time Obsidian opens. */
  toggleUnderscoreFolders() {
    document.body.classList.toggle("cm-hide-underscore");
    this.paintUnderscoreButtons();
  }

  paintUnderscoreButtons() {
    const hidden = document.body.classList.contains("cm-hide-underscore");
    document.querySelectorAll(".cm-underscore-btn").forEach((b) => {
      b.empty();
      setIcon(b, hidden ? "eye-off" : "eye");
      b.setAttr("aria-label", hidden ? "Show files and folders that start with _" : "Hide files and folders that start with _");
      b.toggleClass("is-active", !hidden);
    });
  }

  /* --- schema changelog --- */

  /** Shows a pen button in the header of any open tab in SCHEMAS/, and removes it from every other tab. It is drawn on screen only; nothing is written to the page. */
  syncSchemaButtons() {
    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (!view || typeof view.addAction !== "function") return;
      const onSchema = !!(view.file && view.file.path.startsWith(SCHEMA_DIR));
      const has = view.__cmSchemaBtn && view.__cmSchemaBtn.isConnected;
      if (onSchema && !has) {
        const btn = view.addAction("file-pen", "Log a schema change", () => this.openSchemaLog());
        btn.addClass("cm-schema-log-btn");
        view.__cmSchemaBtn = btn;
      } else if (!onSchema && view.__cmSchemaBtn) {
        view.__cmSchemaBtn.remove();
        view.__cmSchemaBtn = null;
      }
      // the Respond button, on pages in Wiki/, Sources/Source Cards/ and Perspectives/
      const canRespond = !!view.file && this.isRespondable(view.file);
      const hasR = view.__cmRespondBtn && view.__cmRespondBtn.isConnected;
      if (canRespond && !hasR) {
        const btn = view.addAction("message-square-plus", "Respond to this page (Alt+P)", () => { if (view.file) this.respondTo(view.file); });
        btn.addClass("cm-respond-btn");
        view.__cmRespondBtn = btn;
      } else if (!canRespond && view.__cmRespondBtn) {
        view.__cmRespondBtn.remove();
        view.__cmRespondBtn = null;
      }
    });
  }

