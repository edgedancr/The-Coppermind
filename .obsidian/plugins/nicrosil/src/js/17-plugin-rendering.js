  /* --- rendering --- */

  renderAll() {
    this.renderStatus();
    this.renderViews();
    this.dashboards.forEach((r) => r());
  }

  renderStatus() {
    if (!this.statusEl) return;
    const done = this.items.filter((i) => i.status === "verified").length;
    if (this.lastDone !== undefined && done > this.lastDone && !prefersReduced()) {
      this.statusEl.addClass("cm-status-up");
      clearTimeout(this.statusUpTimer);
      this.statusUpTimer = setTimeout(() => this.statusEl.removeClass("cm-status-up"), 1500);
    }
    this.lastDone = done;
    this.statusEl.empty();
    const icon = this.statusEl.createSpan({ cls: "cm-status-icon" });
    setIcon(icon, "badge-check");
    this.statusEl.createSpan({ text: ` ${done}/${this.items.length} verified` });
  }

  renderViews() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((l) => l.view instanceof QueueView && l.view.render());
  }

  async activateView() {
    if (this.settings.tinmindMode) { new Notice("The Tinmind has no review queue. Click The Coppermind to go back."); return; }
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  /** Starts the Dashboard's entrance animation; it lasts a couple of seconds after the page opens. */
  startDashIntro() {
    this.dashIntro = true;
    clearTimeout(this.dashIntroTimer);
    this.dashIntroTimer = setTimeout(() => { this.dashIntro = false; }, 2400);
  }

  isQuiet() { return true; } // the Dashboard always uses the quiet style (2.4.2)

  renderHero(el, src, ctx) {
    el.empty();
    el.addClass("cm-hero");
    el.toggleClass("is-intro", !!this.dashIntro && !prefersReduced());
    const bg = el.createDiv({ cls: "cm-hero-bg" });
    bg.setAttr("aria-hidden", "true");
    for (let i = 0; i < (this.isQuiet() ? 0 : 16); i++) {
      const s = bg.createSpan({ cls: "cm-hero-spark" + (i % 3 === 0 ? " is-teal" : "") });
      s.style.left = `${(i * 37 + 11) % 97}%`;
      s.style.setProperty("--d", `${6 + ((i * 7) % 6)}s`);
      s.style.setProperty("--s", `${2 + (i % 3)}px`);
      s.style.animationDelay = `-${(i * 13) % 11}s`;
    }
    el.createSpan({ cls: "cm-logo cm-logo-hero" }).setAttr("aria-hidden", "true");
    const text = el.createDiv({ cls: "cm-hero-text" });
    text.createDiv({ cls: "cm-hero-title", text: "The Coppermind" });
    const tagline = String(src || "").trim();
    if (tagline) text.createDiv({ cls: "cm-hero-tagline", text: tagline });
    const host = el.createDiv({ cls: "cm-hero-search" });
    if (ctx) ctx.addChild(new SearchBlock(host, this));
  }

  /** The Tinmind page's hero (2.16.0): the tin logo, the title, and the block's text as the quote under it. From 3.26.0 a search box sits at its right. */
  renderTinHero(el, src, ctx) {
    el.empty();
    el.addClass("cm-hero", "cm-tin-hero");
    el.createSpan({ cls: "cm-logo cm-logo-hero cm-logo-tin" }).setAttr("aria-hidden", "true");
    const text = el.createDiv({ cls: "cm-hero-text" });
    text.createDiv({ cls: "cm-hero-title", text: "The Tinmind" });
    const tagline = String(src || "").trim();
    if (tagline) text.createDiv({ cls: "cm-hero-tagline", text: tagline });
    if (ctx) {
      const host = el.createDiv({ cls: "cm-hero-search cm-tin-hero-search" });
      ctx.addChild(new SearchBlock(host, this, { tin: true }));
    }
  }

  renderDashboard(el) {
    el.empty();
    el.addClass("cm-dashboard");
    const all = this.items;
    const drafts = all.filter((i) => i.status === "draft");
    const verified = all.length - drafts.length;
    const flagCount = drafts.reduce((n, i) => n + i.flags.length, 0);
    const now = today();
    const stale = drafts.filter((i) => { const d = daysBetween(i.draftedOn, now); return d !== null && d > STALE_DAYS; });

    const intro = !!this.dashIntro && !prefersReduced();
    el.toggleClass("is-intro", intro);
    let ix = 6;

    const quiet = this.isQuiet();
    if (quiet) {
      // stats as one line of text above a thin bar, instead of number tiles and a ring
      const pctQ = all.length ? verified / all.length : 0;
      const box = el.createDiv({ cls: "cm-qstats" });
      // three parts side by side (3.9.0): the number verified, the line and bar, and the button
      const left = box.createDiv({ cls: "cm-q-left" });
      left.createDiv({ cls: "cm-q-big", text: String(verified) });
      left.createDiv({ cls: "cm-q-of", text: `of ${all.length} pages verified` });
      const mid = box.createDiv({ cls: "cm-q-mid" });
      const line = mid.createDiv({ cls: "cm-qstats-line" });
      line.createSpan({ cls: "cm-q-verified", text: `${Math.round(pctQ * 100)}%` });
      line.appendText(` verified · ${drafts.length} draft${drafts.length === 1 ? "" : "s"} · ${flagCount} open flag${flagCount === 1 ? "" : "s"}`);
      const bar = mid.createDiv({ cls: "cm-qbar" }).createDiv({ cls: "cm-qbar-fill" });
      bar.style.width = `${(pctQ * 100).toFixed(1)}%`;
      const bdQ = Object.entries(FLAG_KINDS)
        .map(([k, info]) => [info, drafts.reduce((n, i) => n + i.flags.filter((f) => f.kind === k).length, 0)])
        .filter(([, n]) => n > 0).map(([info, n]) => `${n} ${(n === 1 ? info.label : info.plural.replace(/ \(.*\)$/, "")).toLowerCase()}`).join(", ");
      const subBits = [bdQ ? `Open flags: ${bdQ}` : "", stale.length ? `${stale.length} draft${stale.length === 1 ? "" : "s"} older than ${STALE_DAYS} days` : ""].filter(Boolean);
      if (subBits.length) mid.createDiv({ cls: "cm-qstats-sub", text: subBits.join(". ") + "." });
      // opens the next draft in the queue (and shows the review queue); Ctrl+click opens it in a new tab
      const nextBtn = box.createEl("button", { cls: "mod-cta cm-gbtn cm-qnext", text: drafts.length ? "Open next draft" : "All verified" });
      nextBtn.disabled = !drafts.length;
      nextBtn.addEventListener("click", async (e) => { const tab = e.ctrlKey || e.metaKey; await this.activateView(); this.openNext(null, undefined, tab); });
      // keep the milestone up to date, so switching back to Classic doesn't replay old bursts
      if (all.length) {
        const ms = verified >= all.length ? 100 : Math.floor((pctQ * 100) / 25) * 25;
        if (this.settings.milestone !== ms) { this.settings.milestone = ms; this.persist(); }
      }
    }

    this.drawHealthCard(el, intro);

    // stat tiles
    const tiles = quiet ? createDiv() : el.createDiv({ cls: "cm-tiles" });
    const tile = (num, label, sub, cls) => {
      const t = tiles.createDiv({ cls: `cm-tile ${cls}` });
      t.style.setProperty("--i", String(ix++));
      const n = t.createDiv({ cls: "cm-tile-num", text: String(num) });
      if (intro) countUp(n, num);
      t.createDiv({ cls: "cm-tile-label", text: label });
      t.createDiv({ cls: "cm-tile-sub", text: sub });
    };
    tile(verified, "Verified", `of ${all.length} pages`, "cm-tile-verified");
    tile(drafts.length, "Drafts", stale.length ? `${stale.length} older than ${STALE_DAYS} days` : "waiting for review", "cm-tile-drafts");
    const breakdown = Object.entries(FLAG_KINDS)
      .map(([k, info]) => [info.short, drafts.reduce((n, i) => n + i.flags.filter((f) => f.kind === k).length, 0)])
      .filter(([, n]) => n > 0).map(([s, n]) => `${n} ${s}`).join(" · ");
    tile(flagCount, "Open flags", breakdown || "none", "cm-tile-flags");

    // graphs: a verification ring and pages by type
    const graphs = el.createDiv({ cls: "cm-graphs" });
    const ringHost = quiet ? createDiv() : graphs;
    const gcard = (title, cls, host) => {
      const c = (host || graphs).createDiv({ cls: `cm-gcard ${cls || ""}` });
      c.style.setProperty("--i", String(ix++));
      c.createDiv({ cls: "cm-gcard-title", text: title });
      return c;
    };
    const rc = gcard("Verification", "cm-ring-card cm-wide", ringHost);
    const rbody = rc.createDiv({ cls: "cm-ring-body" });
    const pct = all.length ? verified / all.length : 0;
    const R = 46, C = 2 * Math.PI * R;
    const rwrap = rbody.createDiv({ cls: "cm-ring-wrap" });
    const rsvg = svgEl(rwrap, "svg", { viewBox: "0 0 120 120", class: "cm-ring", role: "img", "aria-label": `${Math.round(pct * 100)} percent of pages verified` });
    svgEl(rsvg, "circle", { cx: 60, cy: 60, r: R, class: "cm-ring-track" });
    // the filled part is drawn as small colored pieces that run from copper to green, so it needs no gradient reference
    const SEG = 72, segLen = C / SEG;
    const nSeg = pct > 0 ? Math.max(1, Math.round(pct * SEG)) : 0;
    const lerp = (x, y, t) => Math.round(x + (y - x) * t);
    const from = [217, 138, 74], to = [134, 210, 193];
    const arc = svgEl(rsvg, "g", { class: "cm-ring-arc", transform: "rotate(-90 60 60)" });
    for (let i = 0; i < nSeg; i++) {
      const t = nSeg > 1 ? i / (nSeg - 1) : 1;
      const s = svgEl(arc, "circle", {
        cx: 60, cy: 60, r: R, class: "cm-ring-seg",
        stroke: `rgb(${lerp(from[0], to[0], t)},${lerp(from[1], to[1], t)},${lerp(from[2], to[2], t)})`,
        "stroke-dasharray": `${(segLen + 0.7).toFixed(2)} ${C.toFixed(2)}`,
        "stroke-dashoffset": (-(i * segLen)).toFixed(2),
      });
      s.style.setProperty("--k", String(i));
    }
    svgEl(rsvg, "text", { x: 60, y: 62, class: "cm-ring-pct" }, `${Math.round(pct * 100)}%`);
    svgEl(rsvg, "text", { x: 60, y: 77, class: "cm-ring-cap" }, "verified");
    // a short burst of sparks each time the ring passes 25, 50, 75 or 100 percent
    if (all.length) {
      const ms = verified >= all.length ? 100 : Math.floor((pct * 100) / 25) * 25;
      const prev = this.settings.milestone;
      if (!quiet && (prev === undefined || ms !== prev)) {
        this.settings.milestone = ms;
        this.persist();
        if (prev !== undefined && ms > prev && !prefersReduced()) setTimeout(() => this.sparkBurst(rwrap, ms === 100 ? 80 : 36, ms === 100 ? 210 : 130), 650);
      }
    }
    const rside = rbody.createDiv({ cls: "cm-ring-side" });
    rside.createDiv({ cls: "cm-ring-big", text: `${verified} of ${all.length}` });
    rside.createDiv({ cls: "cm-sub", text: "pages verified" });
    const btn = rside.createEl("button", { cls: "mod-cta", text: drafts.length ? "Open next draft" : "All verified" });
    btn.disabled = !drafts.length;
    btn.addEventListener("click", async (e) => { const tab = e.ctrlKey || e.metaKey; await this.activateView(); this.openNext(null, undefined, tab); });

        const tc = gcard("Pages by type", "cm-wide");
    const groups = [...new Set(all.map((i) => i.group))].sort((a, b) => groupRank(a) - groupRank(b));
    const gmax = Math.max(1, ...groups.map((g) => all.filter((i) => i.group === g).length));
    groups.forEach((g, gi) => {
      const inG = all.filter((i) => i.group === g);
      const v = inG.filter((i) => i.status === "verified").length, d = inG.length - v;
      const fl = inG.reduce((n, i) => n + i.flags.length, 0);
      const row = tc.createDiv({ cls: "cm-tr" });
      row.createSpan({ cls: "cm-tr-label", text: g });
      const fill = row.createDiv({ cls: "cm-tbar" }).createDiv({ cls: "cm-tbar-fill" });
      const sv = fill.createSpan({ cls: "cm-tseg-v" }); sv.style.flexGrow = String(v);
      const sd = fill.createSpan({ cls: "cm-tseg-d" }); sd.style.flexGrow = String(d);
      const target = `${(inG.length / gmax) * 100}%`;
      fill.style.transitionDelay = `${gi * 60}ms`;
      fill.style.width = intro ? "0%" : target;
      if (intro) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = target; }));
      const cnt = row.createSpan({ cls: "cm-tr-count", text: `${v} verified · ${d} draft${d === 1 ? "" : "s"}` });
      if (fl) cnt.createSpan({ cls: "cm-tr-flag", text: ` · ${fl} flag${fl === 1 ? "" : "s"}` });
    });
    const key = tc.createDiv({ cls: "cm-wm-legend" });
    [["verified", "#5fae9e"], ["draft", "#d98a4a"]].forEach(([t, c]) => { const s = key.createSpan({ cls: "cm-rel-chip" }); const dt = s.createSpan({ cls: "cm-legend-dot" }); dt.style.background = c; s.appendText(t); });

    // details
    const details = (key, title, openDefault, fill, remember = true) => {
      const d = el.createEl("details", { cls: "cm-dash-details" });
      d.open = remember && this.dashOpen[key] !== undefined ? this.dashOpen[key] : openDefault;
      d.createEl("summary", { text: title });
      if (remember) d.addEventListener("toggle", () => { this.dashOpen[key] = d.open; });
      fill(d);
    };

    const rechecks = drafts.filter((i) => i.changes.length);
    if (rechecks.length) {
      details("changes", `Changed since verified (${rechecks.length})`, false, (d) => {
        rechecks.sort((a, b) => a.name.localeCompare(b.name)).forEach((i) => {
          const row = d.createDiv({ cls: "cm-dash-change" });
          row.createDiv({ cls: "cm-dash-change-name", text: i.name });
          i.changes.forEach((c) => drawChangeLine(row.createDiv({ cls: "cm-dash-change-line" }), this, i.path, c));
          row.setAttr("role", "button");
          row.setAttr("tabindex", "0");
          row.addEventListener("click", (e) => this.openFile(i.path, e.ctrlKey || e.metaKey));
        });
      }, false);
    }

    details("flags", `Open flags (${flagCount})`, false, (d) => {
      let any = false;
      Object.entries(FLAG_KINDS).forEach(([k, info]) => {
        const pages = drafts.filter((i) => i.flags.some((f) => f.kind === k));
        if (!pages.length) return;
        any = true;
        const n = pages.reduce((s, i) => s + i.flags.filter((f) => f.kind === k).length, 0);
        const row = d.createDiv({ cls: `cm-dash-flagrow cm-flag-${k}` });
        row.createSpan({ cls: "cm-dash-flagname", text: `${info.plural} (${n}): ` });
        pages.sort((a, b) => a.name.localeCompare(b.name)).forEach((i, idx) => {
          if (idx) row.appendText(" · ");
          this.linkTo(row, i);
        });
      });
      if (!any) d.createDiv({ cls: "cm-ok", text: "No open flags on any draft." });
    });

    details("stale", `Drafts older than ${STALE_DAYS} days (${stale.length})`, false, (d) => {
      if (!stale.length) { d.createDiv({ cls: "cm-sub", text: "None." }); return; }
      const row = d.createDiv();
      stale.forEach((i, idx) => { if (idx) row.appendText(" · "); this.linkTo(row, i); });
    });
  }

  renderNav(el) {
    el.empty();
    const open = (link) => (newTab) => this.app.workspace.openLinkText(link, "", !!newTab);
    const cards = [
      { icon: "list", title: "Index", sub: "Every page, by type", go: open("_index") },
      { icon: "scroll-text", title: "Log", sub: "Every change and decision", go: (newTab) => { const f = this.latestLogFile(); if (f) this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(f); else new Notice("There is no log file yet."); } },
      { icon: "network", title: "Atlas", sub: "The wiki's topics and how they connect", go: () => this.activateWikiMap() },
      { icon: "book-open", title: "Schema", sub: "The rulebook", go: open("SCHEMA") },
      { icon: "list-checks", title: "Triage", sub: "Sources waiting to be ingested", go: open("Ingestion/Triage") }, // sits under Wiki map (first column)
      { icon: "bot", title: "Agents", sub: "The rules every agent reads first", go: open("_AGENTS"), under: true }, // sits under Schema (second column); the Tinmind has its own button in the file list
    ];
    this.drawNavCards(el, cards);
  }

  /**
   * The semester switcher (3.11.0, one control since 3.11.1): the picked semester as a title in the Tinmind Gradient Style, with a chevron that opens
   * a menu of every semester. The Tinmind Dashboard draws it full size; the course tree draws it small (`side`) under the Tinmind button.
   */
  drawSemSwitch(el, semesters, chosen, side = false) {
    // The semester is the section's title (3.11.0): the picked semester in the Tinmind Gradient Style, with a chevron that opens a menu of every semester.
    const wrap = el.createDiv({ cls: "cm-sem-title" + (side ? " is-side" : "") });
    const head = wrap.createDiv({ cls: "cm-sem-head" });
    head.setAttr("role", "button");
    head.setAttr("tabindex", "0");
    head.setAttr("aria-haspopup", "listbox");
    head.setAttr("aria-expanded", "false");
    head.setAttr("aria-label", "Semester: pick another");
    head.createSpan({ cls: "cm-sem-value", text: chosen });
    setIcon(head.createSpan({ cls: "cm-sem-chev" }), "chevron-down");
    let menu = null;
    const close = () => {
      if (!menu) return;
      menu.remove();
      menu = null;
      head.removeClass("is-open");
      head.setAttr("aria-expanded", "false");
      document.removeEventListener("click", outside, true);
      document.removeEventListener("keydown", onKey, true);
    };
    const outside = (e) => { if (!wrap.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === "Escape") { close(); head.focus(); } };
    const pick = async (sem) => {
      close();
      if (sem === chosen) return;
      this.settings.tinmindSemester = sem;
      await this.persist();
      this.dashboards.forEach((r) => r());
      this.refreshTin();
    };
    const open = () => {
      menu = wrap.createDiv({ cls: "cm-sem-menu" });
      menu.setAttr("role", "listbox");
      semesters.forEach((sem) => {
        const item = menu.createDiv({ cls: "cm-sem-item" + (sem === chosen ? " is-on" : ""), text: sem });
        item.setAttr("role", "option");
        item.setAttr("tabindex", "0");
        item.setAttr("aria-selected", String(sem === chosen));
        item.addEventListener("click", () => pick(sem));
        item.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(sem); } });
      });
      head.addClass("is-open");
      head.setAttr("aria-expanded", "true");
      document.addEventListener("click", outside, true);
      document.addEventListener("keydown", onKey, true);
    };
    const toggle = () => (menu ? close() : open());
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  
  }

  /**
   * The Notes dashboard's switcher and cards (```coppermind-classes```). Every notes file in the Tinmind folder with `type: class-notes`
   * has a `semester`; the title at the top (3.11.0) picks one, and the cards are that semester's courses, then a card for the all-notes page.
   * The pick is saved in Nicrosil's settings, so it is still there after Obsidian closes. Until something is picked, the semester
   * of the files marked `current: true` (else the newest) is shown.
   */
  renderClassNav(el) {
    el.empty();
    const open = (link) => (newTab) => this.app.workspace.openLinkText(link, "", !!newTab);
    const { semesters, chosen, courses } = this.tinSemesterState();

    this.drawShelf(el, open); // the Notebook and the transcription queue, between the hero and the semester (3.19.0)

    if (semesters.length) this.drawSemSwitch(el, semesters, chosen);

    const cards = courses.map((c) => ({ icon: "book-open", title: c.name, sub: this.courseCardLine(c.file), go: open(c.file.path) }));
    this.drawNavCards(el.createDiv(), cards);
    if (!semesters.length) el.createDiv({ cls: "cm-sub", text: "No courses yet. Make a semester with New semester in the Tinmind's course tree." });
  }

  /**
   * The shelf (3.19.0): the Notebook and the transcription queue as two text links in the Tinmind Gradient Style, in a row under the hero and above the
   * semester title, so the course cards below are only class notes. The Notebook shows in every semester, with a small Quick note beside it; Transcriptions
   * shows only while there are notes to review or scans waiting, as before. Ctrl+click or middle-click opens the Notebook in a new tab, like a card.
   */
  drawShelf(el, open) {
    const nb = this.notebookFile();
    const trItems = this.pendingTranscriptions(), trWait = this.scansWaiting(trItems).length;
    const hasTr = !!(trItems.length || trWait);
    if (!nb && !hasTr) return;
    const shelf = el.createDiv({ cls: "cm-shelf" });
    const link = (parent, icon, text, label, go) => {
      const b = parent.createEl("button", { cls: "cm-shelf-link" });
      b.setAttr("aria-label", label);
      setIcon(b.createSpan({ cls: "cm-shelf-icon" }), icon);
      b.createSpan({ cls: "cm-shelf-text cm-tin-gradient-style", text });
      b.addEventListener("click", (e) => go(e.ctrlKey || e.metaKey));
      b.addEventListener("auxclick", (e) => { if (e.button === 1) { e.preventDefault(); go(true); } });
      b.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
      return b;
    };
    if (nb) {
      link(shelf, "pen-line", "Notebook", "Open the Notebook: notes that aren't for a class (Ctrl+click for a new tab)", open(nb.path));
      const q = shelf.createEl("button", { cls: "cm-shelf-quick" });
      q.setAttr("aria-label", "Quick note: make a dated note in the Notebook and open it");
      setIcon(q.createSpan({ cls: "cm-shelf-quick-icon" }), "plus");
      q.createSpan({ text: "Quick note" });
      q.addEventListener("click", () => this.tinQuickNote());
    }
    if (nb && hasTr) shelf.createSpan({ cls: "cm-shelf-sep" });
    if (hasTr) {
      link(shelf, "scan-text", "Transcriptions", "Open the transcription queue", () => this.activateTranscribe());
      const sub = [trItems.length ? `${trItems.length} to review` : "", trWait ? `${trWait} scan${trWait === 1 ? "" : "s"} waiting` : ""].filter(Boolean).join(" \u00b7 ");
      shelf.createSpan({ cls: "cm-shelf-sub", text: sub });
    }
  }

  /** The line under a course's name on the Tinmind Dashboard (3.7.0): how many notes it has and the newest date in a note's name. Only names are read, never what is inside. */
  courseCardLine(hub) {
    const folder = this.app.vault.getAbstractFileByPath(this.courseFolderPath(hub));
    let n = 0, last = 0;
    const walk = (f) => {
      for (const k of f.children) {
        if (k instanceof TFolder) { walk(k); continue; }
        if (!(k instanceof TFile) || k.extension !== "md") continue;
        n++;
        const m = /(\d{2})-(\d{2})-(\d{2})$/.exec(k.basename);
        if (m) last = Math.max(last, Number(m[3]) * 10000 + Number(m[1]) * 100 + Number(m[2]));
      }
    };
    if (folder instanceof TFolder) walk(folder);
    if (!n) return "No notes yet";
    const when = last ? ` \u00b7 last ${String(Math.floor(last / 100) % 100).padStart(2, "0")}-${String(last % 100).padStart(2, "0")}` : "";
    return `${n} note${n === 1 ? "" : "s"}${when}`;
  }

  /** Draws a row of Dashboard-style cards into `el` from {icon, title, sub, go, under?} entries. */
  drawNavCards(el, cards) {
    el.addClass("cm-nav");
    el.toggleClass("is-quiet", this.isQuiet());
    el.toggleClass("is-intro", !!this.dashIntro && !prefersReduced());
    cards.forEach((c, idx) => {
      const card = el.createDiv({ cls: "cm-navcard" });
      if (c.under) card.addClass("cm-navcard-under");
      if (!this.isQuiet()) card.style.setProperty("--acc", DASH_COLORS[idx % DASH_COLORS.length]);
      card.style.setProperty("--i", String(idx));
      card.setAttr("role", "button");
      card.setAttr("tabindex", "0");
      if (!this.isQuiet()) setIcon(card.createSpan({ cls: "cm-navcard-icon" }), c.icon);
      card.createDiv({ cls: "cm-navcard-title", text: c.title });
      card.createDiv({ cls: "cm-navcard-sub", text: c.sub });
      if (c.action) { // a small button inside the card (the Notebook's Quick note, 3.10.0)
        const act = card.createDiv({ cls: "cm-navcard-act" });
        act.setAttr("role", "button");
        act.setAttr("tabindex", "0");
        setIcon(act.createSpan({ cls: "cm-navcard-act-icon" }), "plus");
        act.createSpan({ text: c.action.label });
        const run = (e) => { e.preventDefault(); e.stopPropagation(); c.action.run(); };
        act.addEventListener("click", run);
        act.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") run(e); });
        act.addEventListener("auxclick", (e) => e.stopPropagation());
        act.addEventListener("mousedown", (e) => e.stopPropagation());
      }
      card.addEventListener("click", (e) => c.go(e.ctrlKey || e.metaKey));
      card.addEventListener("auxclick", (e) => { if (e.button === 1) { e.preventDefault(); c.go(true); } });
      card.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.go(e.ctrlKey || e.metaKey); } });
    });
  }

  async renderActivity(el) {
    // Each month's file is newest first, and the files go from the newest month to the oldest.
    const files = this.app.vault.getMarkdownFiles().filter((x) => isLogPath(x.path)).sort((p, q) => logOrder(q.path) - logOrder(p.path));
    const all = [];
    for (const f of files) {
      for (const e of parseLog(await this.app.vault.cachedRead(f))) all.push({ ...e, file: f });
      if (all.length >= 6) break;
    }
    const entries = all.slice(0, 6);
    el.empty();
    el.addClass("cm-activity");
    el.toggleClass("is-intro", !!this.dashIntro && !prefersReduced());
    if (!entries.length) { el.createDiv({ cls: "cm-sub", text: "Nothing in the log yet." }); return; }
    const icons = { verify: "check", ingest: "download", setup: "wrench", schema: "file-pen", tool: "hammer", query: "search", "health-check": "stethoscope" };
    entries.forEach((e, ei) => {
      const row = el.createDiv({ cls: "cm-act-row" });
      row.style.setProperty("--i", String(12 + ei));
      if (ei === 0) row.addClass("cm-act-new");
      row.setAttr("role", "button");
      row.setAttr("tabindex", "0");
      setIcon(row.createSpan({ cls: `cm-act-icon cm-act-${e.rejected ? "rejected" : e.op}` }), e.rejected ? "x" : (icons[e.op] || "circle"));
      row.createSpan({ cls: "cm-act-text", text: describeEntry(e) });
      row.createSpan({ cls: "cm-act-date", text: e.date });
      const go = () => {
        const target = e.op === "verify" && !e.rejected ? this.app.metadataCache.getFirstLinkpathDest(e.subject, "") : null;
        this.app.workspace.openLinkText(target ? target.path : e.file.path, "", false);
      };
      row.addEventListener("click", go);
      row.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); } });
    });
  }

  linkTo(parent, item) {
    const a = parent.createEl("a", { cls: "internal-link", text: item.name, href: item.name });
    a.setAttr("data-href", item.name);
    a.addEventListener("click", (e) => { e.preventDefault(); this.openFile(item.path, e.ctrlKey || e.metaKey); });
  }

