  /* --- dashboard --- */

  dashboardFile() {
    for (const p of [DASHBOARD_PATH, ...LEGACY_DASHBOARD_PATHS]) {
      const f = this.app.vault.getAbstractFileByPath(p);
      if (f instanceof TFile) return f;
    }
    return null;
  }

  isDashboard(file) {
    return file instanceof TFile && (file.path === DASHBOARD_PATH || LEGACY_DASHBOARD_PATHS.includes(file.path));
  }

  /** The Tinmind page (The Tinmind/Tinmind Dashboard): like the Dashboard, it never shows properties or a strip. */
  isTinDashboard(file) {
    return file instanceof TFile && file.path === NOTES_DASHBOARD + ".md";
  }

  /**
   * Tag panes showing the Dashboard, index, or log so CSS can hide their properties (and the Dashboard's title),
   * tag the body when the Dashboard is the active note, and fold the log's entries the first time it opens.
   */
  /** Record the title's text width in `--cm-title-w` so a verified title's gradient spans its words, not the whole line. */
  fitTitle(view) {
    const t = view.containerEl.querySelector(".inline-title");
    if (!t) return;
    const measure = () => {
      try {
        const r = document.createRange();
        r.selectNodeContents(t);
        const w = Math.ceil(r.getBoundingClientRect().width);
        if (w > 0) t.style.setProperty("--cm-title-w", w + "px");
      } catch (e) { /* ignore */ }
    };
    measure();
    requestAnimationFrame(measure);
    setTimeout(measure, 250);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure); // the title's font (Almendra SC) may finish loading after the first measure
    if (!t.dataset.cmFit) { t.dataset.cmFit = "1"; t.addEventListener("input", measure); }
  }

  syncDashboardLeaves(enforce) {
    const ws = this.app.workspace;
    ws.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;
      const path = view.file ? view.file.path : "";
      const isDash = this.isDashboard(view.file);
      const isLog = isLogPath(path);
      view.containerEl.classList.toggle("cm-dashboard-leaf", isDash);
      const isTin = this.isTinDashboard(view.file);
      view.containerEl.classList.toggle("cm-tin-leaf", isTin); // the Tinmind page: its own colors, no properties, and its file name and path are replaced by the hero (2.16.0, 2.17.0)
      if (leaf.tabHeaderEl) leaf.tabHeaderEl.classList.toggle("cm-dashboard-tab", isDash); // the Dashboard's tab shows the logo, not the file name
      view.containerEl.classList.toggle("cm-tinnote-leaf", !!view.file && path.startsWith(NOTES_DIR) && !isTin); // every note in the Tinmind: its title in the Tinmind Gradient Style (3.3.0)
      view.containerEl.classList.toggle("cm-log-leaf", isLog);
      view.containerEl.classList.toggle("cm-topics-leaf", path === TOPICS_PATH); // its file name in the Coppermind Gradient Style (3.30.0)
      view.containerEl.classList.toggle("cm-agents-leaf", path === "_AGENTS.md"); // its title reads AGENTS in the Coppermind Gradient Style (2.18.2)
      const logM = /^_logs\/_log (\d{2}-\d{2})\.md$/.exec(path); // a log's title reads "Log 11-26" (the theme draws it from --cm-log-title)
      if (logM) view.containerEl.style.setProperty("--cm-log-title", `"Log ${logM[1]}"`); else view.containerEl.style.removeProperty("--cm-log-title");
      view.containerEl.classList.toggle("cm-noprops-leaf", isDash || isTin || isLog || path === INDEX_PATH || (!!view.file && path.startsWith(NOTES_DIR))); // no properties on any note in the Tinmind (3.6.0)
      const pageStatus = view.file ? ((this.app.metadataCache.getFileCache(view.file) || {}).frontmatter || {}).status : "";
      view.containerEl.classList.toggle("cm-st-verified", pageStatus === "verified");
      view.containerEl.classList.toggle("cm-st-draft", pageStatus === "draft");
      try { this.fitTitle(view); } catch (e) { /* the title gradient is cosmetic; never let it stop the rest */ }
      const useStrip = !!view.file && !isDash && !isTin && !isLog && path !== INDEX_PATH;
      view.containerEl.classList.toggle("cm-strip-leaf", useStrip);
      if (this.stripPaths.get(view) !== path) {
        this.stripPaths.set(view, path);
        view.containerEl.classList.remove("cm-props-open"); // each note starts collapsed
      }
      if (useStrip) this.watchStrip(view); else this.removeStrips(view);
      if (isDash && enforce) this.enforceReading(leaf);
      if (isLog && this.foldedViews.get(view) !== path) {
        this.foldedViews.set(view, path);
        setTimeout(() => this.foldLogEntries(view), 300);
      }
      if (!isLog) this.foldedViews.delete(view);
    });
    document.body.classList.toggle("cm-on-dashboard", this.isDashboard(ws.getActiveFile()));
    document.body.classList.toggle("cm-on-tin", this.isTinDashboard(ws.getActiveFile()));
  }

  /**
   * Properties strip: the native Properties block is hidden and a one-line summary
   * (type, status, date) sits in its place. Clicking it expands the real block.
   */
  watchStrip(view) {
    this.ensureStrips(view);
    if (!view.__cmStripObs) {
      let timer = null;
      const obs = new MutationObserver(() => {
        if (timer) return;
        timer = setTimeout(() => { timer = null; this.ensureStrips(view); }, 60);
      });
      obs.observe(view.containerEl, { childList: true, subtree: true });
      view.__cmStripObs = obs;
      this.stripObservers.add(obs);
    }
  }

  /** A hover preview of a page gets the same one-line strip as an open page, in place of its Properties block. */
  watchPopover(el) {
    const hv = this.lastHover;
    if (!hv || Date.now() - hv.t > 4000) return;
    const file = hv.file;
    if ([DASHBOARD_PATH, ...LEGACY_DASHBOARD_PATHS, INDEX_PATH].includes(file.path) || this.isTinDashboard(file) || isLogPath(file.path) || !this.stripInfo(file)) return;
    el.classList.add("cm-strip-leaf");
    this.ensureStripsIn(el, file);
    let timer = null;
    const obs = new MutationObserver(() => {
      if (!el.isConnected) { obs.disconnect(); this.popObservers.delete(obs); return; }
      if (timer) return;
      timer = setTimeout(() => { timer = null; this.ensureStripsIn(el, file); }, 60);
    });
    obs.observe(el, { childList: true, subtree: true });
    this.popObservers.add(obs);
  }

  removeStrips(view) {
    view.containerEl.querySelectorAll(".cm-propstrip, .cm-ratebar, .cm-mytake, .cm-typedbar").forEach((e) => e.remove());
    if (view.__cmStripObs) { view.__cmStripObs.disconnect(); this.stripObservers.delete(view.__cmStripObs); view.__cmStripObs = null; }
  }

  stripInfo(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache && cache.frontmatter;
    if (!fm) return null;
    const day = (v) => (v ? String(v).slice(0, 10) : "");
    const status = fm.status ? String(fm.status) : "";
    const when = status === "verified" && fm.verified_on ? "verified " + day(fm.verified_on) : fm.drafted_on ? "drafted " + day(fm.drafted_on) : "";
    return { type: fm.type ? String(fm.type) : "", status, when };
  }

  ensureStrips(view) { this.ensureStripsIn(view.containerEl, view.file); }

  ensureStripsIn(root, file) {
    if (!file) return;
    // The Dashboard, index and logs never get a strip. A strip step queued by the note a pane showed before can run after the pane switches, so take any strip away here too.
    if (this.isDashboard(file) || this.isTinDashboard(file) || file.path === INDEX_PATH || isLogPath(file.path)) { root.querySelectorAll(".cm-propstrip, .cm-hub, .cm-backpill").forEach((s) => s.remove()); return; }
    const info = this.stripInfo(file);
    // When Obsidian re-renders a note (for example on switching between editing and reading),
    // it can re-create the Properties block or move the title, leaving an old strip stranded
    // somewhere else. Remove every strip that isn't directly in front of a Properties block,
    // so each block keeps exactly one strip.
    root.querySelectorAll(".cm-propstrip").forEach((s) => {
      const next = s.nextElementSibling;
      if (!next || !next.classList.contains("metadata-container")) s.remove();
    });
    root.querySelectorAll(".cm-ratebar").forEach((b) => {
      const prev = b.previousElementSibling;
      if (!prev || !prev.classList.contains("metadata-container")) b.remove();
    });
    root.querySelectorAll(".cm-mytake").forEach((b) => {
      const prev = b.previousElementSibling;
      if (!prev || !(prev.classList.contains("metadata-container") || prev.classList.contains("cm-ratebar"))) b.remove();
    });
    const inPreview = !!(root.classList.contains("hover-popover") || root.closest(".hover-popover"));
    const responses = inPreview ? [] : this.responsesTo(file);
    // Source cards also get the rating buttons, just under the Properties block (not in hover previews).
    const wantBar = this.isSourceCard(file) && !root.classList.contains("hover-popover") && !root.closest(".hover-popover");
    const metas = root.querySelectorAll(".metadata-container");
    // A course page (type: class-notes) gets the course's notes tree under its properties, drawn on screen only (3.1.0).
    const isHub = !inPreview && this.isClassHub(file);
    root.querySelectorAll(".cm-hub").forEach((h) => {
      const prev = h.previousElementSibling;
      if (!isHub || !prev || !prev.classList.contains("metadata-container") || h.__cmFile !== file) h.remove();
    });
    // A note inside a course gets a pill above its title that goes back to the course page (3.6.0), drawn on screen only.
    const back = inPreview || isHub ? null : this.backTarget(file);
    root.querySelectorAll(".cm-backpill").forEach((p) => {
      const nx = p.nextElementSibling;
      if (!back || p.__cmFile !== file || !nx || !(nx.classList.contains("inline-title") || nx.classList.contains("cm-propstrip") || nx.classList.contains("metadata-container"))) p.remove();
    });
    metas.forEach((meta) => {
      // The Add typed link button sits at the end of the open Properties block, on pages in Wiki/ (4.1.0).
      let tbar = meta.querySelector(":scope > .cm-typedbar");
      if (inPreview || !/^Wiki\//.test(file.path)) { if (tbar) tbar.remove(); }
      else {
        if (!tbar) { tbar = document.createElement("div"); tbar.className = "cm-typedbar"; meta.appendChild(tbar); }
        if (tbar.__cmFile !== file) { tbar.__cmFile = file; tbar.__open = false; this.drawTypedBar(tbar, file); }
        else if (tbar.__refresh) tbar.__refresh();
      }
      if (back) {
        const anchor = meta.parentElement.querySelector(":scope > .inline-title") || (meta.previousElementSibling && meta.previousElementSibling.classList.contains("cm-propstrip") ? meta.previousElementSibling : meta);
        let pill = anchor.previousElementSibling;
        if (pill && !pill.classList.contains("cm-backpill")) pill = null;
        if (!pill) {
          pill = document.createElement("div");
          pill.className = "cm-backpill";
          pill.setAttribute("role", "button");
          pill.tabIndex = 0;
          pill.addEventListener("click", (e) => { if (pill.__cmHub) this.openTinFile(pill.__cmHub, e.ctrlKey || e.metaKey); });
          pill.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && pill.__cmHub) { e.preventDefault(); this.openTinFile(pill.__cmHub, e.ctrlKey || e.metaKey); } });
          anchor.parentElement.insertBefore(pill, anchor);
        }
        pill.__cmFile = file;
        pill.__cmHub = back;
        const psig = [file.path, back.path, this.courseCtx(back).course].join("|");
        if (pill.dataset.sig !== psig) { pill.dataset.sig = psig; this.drawBackPill(pill, back); }
      }
      if (isHub) {
        let hub = meta.nextElementSibling;
        if (hub && !hub.classList.contains("cm-hub")) hub = null;
        if (!hub) {
          hub = document.createElement("div");
          hub.className = "cm-hub";
          meta.parentElement.insertBefore(hub, meta.nextSibling);
        }
        hub.__cmFile = file;
        const hsig = this.hubSig(file);
        if (hub.dataset.sig !== hsig) { hub.dataset.sig = hsig; this.drawHub(hub, file); }
      }
      let strip = meta.previousElementSibling;
      if (strip && !strip.classList.contains("cm-propstrip")) strip = null;
      if (!info) { if (strip) strip.remove(); return; }
      const sig = [info.type, info.status, info.when].join("|");
      if (!strip) {
        strip = document.createElement("div");
        strip.className = "cm-propstrip";
        strip.setAttribute("role", "button");
        strip.tabIndex = 0;
        const toggle = () => {
          const open = root.classList.toggle("cm-props-open");
          root.querySelectorAll(".cm-propstrip").forEach((s) => s.setAttribute("aria-expanded", String(open)));
        };
        strip.addEventListener("click", toggle);
        strip.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
        meta.parentElement.insertBefore(strip, meta);
      }
      strip.setAttribute("aria-expanded", String(root.classList.contains("cm-props-open")));
      strip.setAttribute("aria-label", "Show or hide this page's properties");
      let bar = meta.nextElementSibling;
      if (bar && bar.classList.contains("cm-hub")) bar = bar.nextElementSibling;
      if (bar && !bar.classList.contains("cm-ratebar")) bar = null;
      if (!wantBar) { if (bar) bar.remove(); }
      else {
        if (!bar) {
          bar = document.createElement("div");
          bar.className = "cm-ratebar";
          meta.parentElement.insertBefore(bar, meta.nextSibling);
        }
        const r = ratingOf(this.fm(file));
        const bsig = [file.path, file.stat.mtime, r.rel, r.cred].join("|");
        if (bar.dataset.sig !== bsig) { bar.dataset.sig = bsig; this.drawRatingButtons(bar, file); }
      }
      // "My take": the perspectives that respond to this page
      const anchor = wantBar && bar ? bar : meta;
      let take = anchor.nextElementSibling;
      if (take && !take.classList.contains("cm-mytake")) take = null;
      if (!responses.length) { if (take) take.remove(); }
      else {
        if (!take) {
          take = document.createElement("div");
          take.className = "cm-mytake";
          anchor.parentElement.insertBefore(take, anchor.nextSibling);
        }
        const tsig = [file.path, ...responses.map((f) => `${f.path}|${this.fm(f).status}`)].join(";");
        if (take.dataset.sig !== tsig) { take.dataset.sig = tsig; this.drawMyTake(take, responses); }
      }
      if (strip.dataset.sig === sig) return;
      strip.dataset.sig = sig;
      strip.empty ? strip.empty() : (strip.textContent = "");
      const chev = document.createElement("span");
      chev.className = "cm-strip-chev";
      try { setIcon(chev, "chevron-right"); } catch (e) { chev.textContent = "›"; }
      strip.appendChild(chev);
      const parts = [];
      if (info.type) parts.push(["cm-strip-type", info.type]);
      if (info.status) parts.push(["cm-strip-status cm-strip-" + info.status.replace(/[^a-z]/gi, ""), info.status]);
      if (info.when) parts.push(["cm-strip-when", info.when]);
      if (!parts.length) parts.push(["cm-strip-type", "properties"]);
      parts.forEach(([cls, text], i) => {
        if (i) { const dot = document.createElement("span"); dot.className = "cm-strip-dot"; dot.textContent = "·"; strip.appendChild(dot); }
        const s = document.createElement("span"); s.className = cls; s.textContent = text; strip.appendChild(s);
      });
    });
  }

  /** Fold every log entry heading (and nothing else) so the log opens as a short list. Editing view only. */
  foldLogEntries(view) {
    const ed = view.editor;
    if (!ed || !view.file || !isLogPath(view.file.path) || view.getMode() !== "source") return;
    try {
      ed.exec("unfoldAll");
      for (let i = 0, n = ed.lineCount(); i < n; i++) {
        if (/^#{2,4}\s+\[\d{4}-\d{2}-\d{2}\]/.test(ed.getLine(i))) {
          ed.setCursor({ line: i, ch: 0 });
          ed.exec("toggleFold");
        }
      }
      ed.setCursor({ line: 0, ch: 0 });
      ed.scrollTo(0, 0);
    } catch (e) {
      console.error("Nicrosil: couldn't fold the log", e);
    }
  }

  /** The Dashboard always opens in Reading view. Every other note keeps whatever mode it was in. */
  async enforceReading(leaf) {
    const view = leaf && leaf.view;
    if (!(view instanceof MarkdownView) || !this.isDashboard(view.file) || view.getMode() !== "source") return;
    const state = leaf.getViewState();
    await leaf.setViewState({ ...state, state: { ...state.state, mode: "preview" } });
  }

  /**
   * Opening a page puts it in Reading view (verified pages by default; see the "Open pages in Reading view" setting). Pages in The Tinmind are the exception: they open in editing view.
   * Each tab is looked at once per page it shows, so switching a page to editing yourself is left alone until that tab opens another page.
   */
  async readOnOpen(file) {
    try {
      const mode = this.settings.readMode || "verified";
      if (!(file instanceof TFile) || file.extension !== "md") return;
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view || !view.file || view.file.path !== file.path) return;
      const leaf = view.leaf;
      // Notes in The Tinmind open in editing view, whatever the setting says (3.3.1). A tab that was in Reading view for the page before
      // (the Tinmind Dashboard, say) would otherwise keep that mode. The dashboard itself stays in Reading view.
      if (file.path.startsWith(NOTES_DIR) && !this.isTinDashboard(file)) {
        if (this.readHandled.get(leaf) === file.path) return;
        this.readHandled.set(leaf, file.path);
        if (view.getMode() === "preview") {
          const st = leaf.getViewState();
          await leaf.setViewState({ ...st, state: { ...st.state, mode: "source" } });
        }
        return;
      }
      if (mode === "off") return;
      if (this.readHandled.get(leaf) === file.path) return;
      this.readHandled.set(leaf, file.path);
      if (view.getMode() !== "source") return;
      const status = ((this.app.metadataCache.getFileCache(file) || {}).frontmatter || {}).status;
      const wanted = mode === "all" ? file.stat.size > 0 : status === "verified";
      if (!wanted) return;
      const state = leaf.getViewState();
      await leaf.setViewState({ ...state, state: { ...state.state, mode: "preview" } });
    } catch (e) {
      console.error("Nicrosil: couldn't open the page in Reading view", e);
    }
  }

  /** The newest saved health check report (Health Checks/Health Check YYYY-MM-DD), read from file names. */
  latestHealthCheck() {
    let best = null;
    for (const f of this.app.vault.getMarkdownFiles()) {
      const m = /^Health Checks\/Health Check (\d{4}-\d{2}-\d{2})(?: \(\d+\))?\.md$/.exec(f.path);
      if (m && (!best || m[1] > best.date)) best = { date: m[1], file: f };
    }
    return best;
  }

  /** A small card on the Dashboard: days since the last health check against the schedule; amber when close, red when overdue. */
  drawHealthCard(el, intro) {
    const every = Math.max(1, parseInt(this.settings.healthDays, 10) || 14);
    const last = this.latestHealthCheck();
    const h = healthStatus(last ? last.date : null, today(), every);
    const card = el.createDiv({ cls: `cm-hc cm-hc-${h.state}` });
    const head = card.createDiv({ cls: "cm-hc-head" });
    head.createSpan({ cls: "cm-hc-title", text: "Health check" });
    const verdict = h.state === "none" ? "None recorded yet"
      : h.left < 0 ? `${plural(-h.left, "day")} overdue`
      : h.left === 0 ? "Due today"
      : h.left === 1 ? "Due tomorrow"
      : `Due in ${plural(h.left, "day")}`;
    head.createSpan({ cls: "cm-hc-verdict", text: verdict });
    const track = card.createDiv({ cls: "cm-hc-track" });
    const fill = track.createDiv({ cls: "cm-hc-fill" });
    const target = `${(h.pct * 100).toFixed(1)}%`;
    fill.style.width = intro ? "0%" : target;
    if (intro) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = target; }));
    let sub = `One every ${plural(every, "day")}.`;
    if (last) {
      const [y, mo, d] = last.date.split("-").map(Number);
      const when = new Date(y, mo - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      const ago = h.elapsed === 0 ? "today" : h.elapsed === 1 ? "yesterday" : `${plural(h.elapsed, "day")} ago`;
      sub = `Last one ${when} (${ago}). One every ${plural(every, "day")}.`;
      card.addClass("is-link");
      card.setAttr("role", "button"); card.setAttr("tabindex", "0");
      card.setAttr("aria-label", `Open the health check from ${when}`);
      const go = (e) => this.app.workspace.getLeaf(e.ctrlKey || e.metaKey ? "tab" : false).openFile(last.file);
      card.addEventListener("click", go);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter") go(e); });
    }
    card.createDiv({ cls: "cm-hc-sub", text: sub });
  }

  /** Goes to the part of a page a change note points to (its [[#Heading]]); with no location, just opens the page. */
  async openChange(path, change, newTab) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    const { target } = parseChange(change);
    const line = target ? locateInCache(this.app.metadataCache.getFileCache(file), target) : null;
    if (target && line === null) new Notice(`Couldn't find “${target.split("#").pop()}” in ${file.basename}, so I opened the page.`);
    const leaf = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view.file && l.view.file.path === path);
    if (leaf && !newTab) {
      this.app.workspace.setActiveLeaf(leaf, { focus: true });
      if (line !== null) leaf.view.setEphemeralState({ line });
      return;
    }
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file, line !== null ? { eState: { line } } : undefined);
  }

  /**
   * Start with one tab (3.21.0): once Obsidian has started and the startup page has had a moment to open, every main-area tab except the Dashboard is closed,
   * so a page left open last time (the transcription queue, a note) doesn't come back beside it in the Coppermind's mode. The Dashboard is opened if the
   * startup page didn't. Sidebars are left alone. Off with "Close the other tabs on startup" in the settings.
   */
  async closeOtherTabsOnStart() {
    if (this.settings.closeTabsOnStart === false) return;
    try {
      const ws = this.app.workspace;
      const f = this.dashboardFile();
      if (!f) return;
      const isDash = (l) => {
        const vs = l.getViewState();
        if (!vs || vs.type !== "markdown") return false;
        const p = l.view && l.view.file ? l.view.file.path : (vs.state || {}).file;
        return p === f.path;
      };
      const find = () => { let hit = null; ws.iterateRootLeaves((l) => { if (!hit && isDash(l)) hit = l; }); return hit; };
      let keep = find();
      if (!keep) { await this.openDashboard(); keep = find(); }
      if (!keep) return;
      const others = [];
      ws.iterateRootLeaves((l) => { if (l !== keep) others.push(l); });
      others.forEach((l) => l.detach());
      ws.setActiveLeaf(keep, { focus: true });
    } catch (e) { console.error("Nicrosil: couldn't close the other tabs on startup", e); }
  }

  async openDashboard(newTab) {
    const f = this.dashboardFile();
    if (!f) { new Notice(`Couldn't find ${DASHBOARD_PATH}.`); return; }
    this.exitTinMode();
    const already = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view.file && l.view.file.path === f.path);
    if (already && !newTab) { this.app.workspace.setActiveLeaf(already, { focus: true }); return; }
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(f, { state: { mode: "preview" } });
  }

