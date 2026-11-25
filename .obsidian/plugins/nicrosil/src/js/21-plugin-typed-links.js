  /* --- Add typed link (4.1.0) --- */

  /** The Wiki pages a typed link can point to, other than the page itself: { file, name, aliases }. */
  typedTargets(file) {
    const out = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!f.path.startsWith("Wiki/") || f.path === file.path) continue;
      const a = this.fm(f).aliases;
      const aliases = (a === undefined || a === null ? [] : [].concat(a)).map((x) => String(x).trim()).filter(Boolean);
      out.push({ file: f, name: f.basename, aliases });
    }
    return out;
  }

  /**
   * Adds [[target]] to the typed-link property `type`. A link already under that type is left alone ("duplicate").
   * On a verified page the same edit sets status: draft, keeps verified_on and adds a changes_since_verified line, as SCHEMA - Review rule 8 says ("reset").
   * `other` lists the other typed properties that already link to the target, so the caller can say so.
   */
  async addTypedLink(file, type, target) {
    const link = `[[${this.app.metadataCache.fileToLinktext(target, file.path)}]]`;
    const other = [];
    let outcome = "added";
    await this.app.fileManager.processFrontMatter(file, (f) => {
      const list = (k) => (f[k] === undefined || f[k] === null || f[k] === "" ? [] : [].concat(f[k]).flat(3));
      const hits = (k) => list(k).filter((v) => {
        const m = /\[\[([^\]|#]+)/.exec(String(v));
        const dest = m && this.app.metadataCache.getFirstLinkpathDest(m[1].trim(), file.path);
        return dest && dest.path === target.path;
      });
      if (hits(type).length) { outcome = "duplicate"; return; }
      for (const k of Object.keys(REL_TYPES)) if (k !== type && hits(k).length) other.push(k);
      f[type] = [...list(type), link];
      if (f.status === "verified") {
        f.status = "draft";
        f.changes_since_verified = [...changeLines(f.changes_since_verified), typedLinkNote(today(), type, target.basename)];
        outcome = "reset";
      }
    });
    return { outcome, other };
  }

  /**
   * The button under the properties, and the row it opens: "This page [type] [search for a page] Add". Enter adds and keeps the row open for the next link; Esc closes it.
   * Drawn once per page, not on every redraw of the note, so what is being typed isn't lost.
   */
  drawTypedBar(host, file) {
    host.empty();
    host.__refresh = null;
    if (!host.__open) {
      const b = host.createEl("button", { cls: "cm-typed-open", attr: { type: "button", title: "Add a typed link to this page" } });
      setIcon(b.createSpan({ cls: "cm-typed-ico" }), "plus");
      b.createSpan({ text: "Add typed link" });
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        host.__open = true;
        this.drawTypedBar(host, file);
        const i = host.querySelector(".cm-typed-input");
        if (i) i.focus();
      });
      return;
    }
    const targets = this.typedTargets(file);
    const box = host.createDiv({ cls: "cm-typed-box" });
    box.createSpan({ cls: "cm-typed-lbl", text: "This page" });
    const sel = box.createEl("select", { cls: "dropdown cm-typed-type", attr: { "aria-label": "Link type" } });
    for (const [k, v] of Object.entries(REL_TYPES)) { const o = sel.createEl("option", { text: k, value: k }); o.title = v.out; }
    sel.value = this.lastTypedType && REL_TYPES[this.lastTypedType] ? this.lastTypedType : "supports";
    sel.addEventListener("change", () => { this.lastTypedType = sel.value; });
    const find = box.createDiv({ cls: "cm-typed-find" });
    const input = find.createEl("input", { cls: "cm-typed-input", attr: { type: "text", placeholder: "Search pages", "aria-label": "Page to link to", autocomplete: "off", spellcheck: "false" } });
    const list = find.createDiv({ cls: "cm-typed-list" });
    const add = box.createEl("button", { cls: "cm-mini mod-cta", text: "Add", attr: { type: "button" } });
    const cancel = box.createEl("button", { cls: "cm-mini", text: "Cancel", attr: { type: "button" } });
    const msg = host.createDiv({ cls: "cm-typed-msg" });
    let rows = [], active = 0, chosen = null;
    const note = (text, kind) => { msg.setText(text || ""); msg.dataset.k = kind || ""; msg.className = "cm-typed-msg" + (kind ? " is-" + kind : ""); };
    const idle = () => { const v = this.fm(file).status === "verified"; note(v ? "This page is verified. Adding a link sets its status back to draft." : "", v ? "warn" : ""); };
    host.__refresh = () => { if (!msg.dataset.k || msg.dataset.k === "warn") idle(); };
    const close = () => { host.__open = false; this.drawTypedBar(host, file); };
    const mark = () => list.querySelectorAll(".cm-typed-item").forEach((el, i) => el.classList.toggle("is-active", i === active));
    const pick = (r) => { chosen = r.t; input.value = r.t.name; list.removeClass("is-open"); idle(); };
    const showList = () => {
      rows = rankTargets(targets, input.value);
      active = 0;
      list.empty();
      rows.forEach((r) => {
        const it = list.createDiv({ cls: "cm-typed-item" });
        it.createSpan({ cls: "cm-typed-name", text: r.alias ? `${r.alias} → ${r.t.name}` : r.t.name });
        it.createSpan({ cls: "cm-typed-grp", text: r.t.file.parent && r.t.file.parent.name !== "Wiki" ? r.t.file.parent.name : "" });
        it.addEventListener("mousedown", (e) => { e.preventDefault(); pick(r); });
      });
      mark();
      list.toggleClass("is-open", rows.length > 0);
    };
    const submit = async () => {
      let t = chosen;
      if (!t) {
        const s = input.value.trim().toLowerCase();
        t = s ? targets.find((x) => x.name.toLowerCase() === s) || targets.find((x) => x.aliases.some((a) => a.toLowerCase() === s)) : null;
      }
      if (!t) {
        note(input.value.trim() ? "No Wiki page by that name. Pick one from the list." : "Pick a page first", "err");
        input.focus();
        return;
      }
      add.disabled = true;
      try {
        const res = await this.addTypedLink(file, sel.value, t.file);
        if (res.outcome === "duplicate") note(`“${t.name}” is already under ${sel.value}.`, "err");
        else {
          let text = `Added ${sel.value} → ${t.name}.`;
          if (res.other.length) text += ` It is also under ${res.other.join(", ")}.`;
          if (res.outcome === "reset") text += " Status is now draft.";
          note(text, "ok");
          new Notice(text, 6000);
          chosen = null;
          input.value = "";
          list.removeClass("is-open");
        }
      } catch (e) {
        console.error("Nicrosil: couldn't add the typed link", e);
        note(`Couldn't add the link: ${e.message}`, "err");
      }
      add.disabled = false;
      input.focus();
    };
    input.addEventListener("input", () => { chosen = null; if (msg.dataset.k !== "warn") idle(); showList(); });
    input.addEventListener("blur", () => list.removeClass("is-open"));
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      const open = list.hasClass("is-open");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) showList();
        else if (rows.length) { active = (active + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length; mark(); }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (open && rows[active]) pick(rows[active]); else submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (open) list.removeClass("is-open"); else close();
      }
    });
    add.addEventListener("click", submit);
    cancel.addEventListener("click", close);
    idle();
  }

  async verify(file) {
    const fm = this.precheck(file);
    if (!fm) return;
    if (fm.type === "source") {
      const r = ratingOf(fm);
      if (!r.rel || !r.cred) {
        new Notice("Rate this source card first: reliability A–F and credibility 1–6 (SCHEMA - Review: ratings are item by item).", 8000);
        return;
      }
    }
    const flags = parseFlags(await this.app.vault.read(file));
    const resolved = this.resolvedFor(file.path);
    new ReviewModal(this.app, {
      mode: "verify", name: file.basename, flags, resolved, backlinks: [],
      onConfirm: async (note) => {
        const date = today();
        const order = this.queue();
        try {
          await this.app.fileManager.processFrontMatter(file, (f) => {
            f.status = "verified";
            f.verified_on = date;
            delete f.changes_since_verified;
          });
          const indexed = await this.updateIndex(file.basename, "verify", date);
          await this.appendLog(verifyLogEntry({ name: file.basename, date, note, openFlags: flags, resolved }));
          delete this.resolved[file.path];
          await this.persist();
          new Notice(`Verified “${file.basename}”.` + (indexed || !file.path.includes("/") || file.path.startsWith(SCHEMA_DIR) ? "" : " It wasn't in _index.md; add it by hand."), 5000);
          const nxt = nextAfter(order, file.path);
          const fx = this.settings.celebrate !== false && !prefersReduced() ? await this.playVerifyOut(file, order.length > 1 ? "Verified" : "All drafts verified", !!this.settings.autoAdvance) : null;
          if (this.settings.autoAdvance) await this.openNext(file.path, order);
          if (fx) this.playVerifyIn(fx, this.settings.autoAdvance && nxt ? `Next: ${nxt.name} · ${Math.max(0, order.length - 1)} left` : "", !!this.settings.autoAdvance);
          else this.vfBusy = false;
          if (!this.settings.autoAdvance) setTimeout(() => this.pulseStrip(file), 600);
        } catch (e) {
          console.error("Nicrosil: verify failed", e);
          new Notice(`Verify failed: ${e.message}. Check status, _index.md and the log.`, 10000);
        }
        this.scheduleRefresh();
      },
    }).open();
  }

  /** A ring and a burst of sparks over an element (used for the Dashboard's milestone). */
  sparkBurst(host, n, spread) {
    if (!host || !host.isConnected) return;
    const ov = host.createDiv({ cls: "cm-vf-overlay cm-ring-burst" });
    ov.setAttr("aria-hidden", "true");
    ov.createDiv({ cls: "cm-vf-ring" });
    const cols = ["#d98a4a", "#86d2c1", "#e0a846", "#5fae9e"];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 3) * 0.19;
      const d = spread * 0.45 + ((i * 53) % Math.round(spread * 0.9));
      const p = ov.createSpan({ cls: "cm-vf-p" });
      p.style.setProperty("--dx", `${Math.round(Math.cos(a) * d)}px`);
      p.style.setProperty("--dy", `${Math.round(Math.sin(a) * d)}px`);
      p.style.setProperty("--s", `${3 + (i % 4)}px`);
      p.style.setProperty("--c", cols[i % 4]);
      p.style.animationDelay = `${(i % 6) * 24}ms`;
    }
    setTimeout(() => ov.remove(), 1600);
  }

  /**
   * The verify animation: the page is stamped with a check, bursts into copper and teal sparks, and slides
   * away. Returns what playVerifyIn needs to bring the next page in.
   */
  /**
   * A newly opened page fades in. Obsidian's "file-open" event only fires after the page has loaded and been drawn, so
   * starting the fade from there made the page show and then fade. Instead this wraps MarkdownView.onLoadFile: the
   * page's text is held back while the file loads and fades in as soon as it has, with no movement. The background
   * stays put. If anything goes wrong the text is shown again after 0.6 seconds.
   */
  installPageFade() {
    const proto = MarkdownView && MarkdownView.prototype;
    if (!proto || typeof proto.onLoadFile !== "function") return;
    const plugin = this;
    const orig = proto.onLoadFile;
    const hadOwn = Object.prototype.hasOwnProperty.call(proto, "onLoadFile");
    const patched = function (file) {
      let c = null;
      try {
        if (file && !plugin.vfBusy && !prefersReduced() && !plugin.isDashboard(file) && this.containerEl) c = this.containerEl.querySelector(".view-content");
      } catch (e) { c = null; }
      if (!c) return orig.apply(this, arguments);
      c.addClass("cm-page-pre");
      const guard = setTimeout(() => c.removeClass("cm-page-pre"), 600);
      const done = () => {
        clearTimeout(guard);
        c.removeClass("cm-page-pre");
        c.removeClass("cm-page-in");
        void c.offsetWidth;
        c.addClass("cm-page-in");
        setTimeout(() => c.removeClass("cm-page-in"), 350);
      };
      let r;
      try { r = orig.apply(this, arguments); } catch (e) { done(); throw e; }
      return Promise.resolve(r).then((v) => { done(); return v; }, (e) => { done(); throw e; });
    };
    proto.onLoadFile = patched;
    this.register(() => {
      if (proto.onLoadFile !== patched) return;
      if (hadOwn) proto.onLoadFile = orig; else delete proto.onLoadFile;
    });
  }

  /** The properties strip glows once on a page that was just verified. */
  pulseStrip(file) {
    const view = this.app.workspace.getLeavesOfType("markdown").map((l) => l.view).find((v) => v && v.file && v.file.path === file.path);
    const strip = view && view.containerEl && view.containerEl.querySelector(".cm-propstrip");
    if (!strip) return;
    strip.addClass("cm-strip-pulse");
    setTimeout(() => strip.removeClass("cm-strip-pulse"), 2200);
  }

  /** `slide` is false when "Open next after verify" is off: then only the check and sparks play and the page stays where it is. */
  playVerifyOut(file, label, slide = true) {
    this.vfBusy = true;
    const view = this.app.workspace.getLeavesOfType("markdown").map((l) => l.view).find((v) => v && v.file && v.file.path === file.path);
    const host = view && view.containerEl;
    const content = host && host.querySelector(".view-content");
    if (!content) { this.vfBusy = false; return Promise.resolve(null); }
    host.addClass("cm-vf-host");
    const ov = host.createDiv({ cls: "cm-vf-overlay" });
    ov.setAttr("aria-hidden", "true");
    ov.createDiv({ cls: "cm-vf-ring" });
    setIcon(ov.createDiv({ cls: "cm-vf-badge" }), "check");
    ov.createDiv({ cls: "cm-vf-label", text: label });
    const cols = ["#d98a4a", "#86d2c1", "#e0a846", "#5fae9e"];
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + (i % 3) * 0.21;
      const d = 90 + ((i * 53) % 150);
      const p = ov.createSpan({ cls: "cm-vf-p" });
      p.style.setProperty("--dx", `${Math.round(Math.cos(a) * d)}px`);
      p.style.setProperty("--dy", `${Math.round(Math.sin(a) * d)}px`);
      p.style.setProperty("--s", `${3 + (i % 4)}px`);
      p.style.setProperty("--c", cols[i % 4]);
      p.style.animationDelay = `${(i % 5) * 22}ms`;
    }
    if (slide) content.addClass("cm-vf-out");
    return new Promise((res) => setTimeout(() => { ov.remove(); res({ host, content }); }, 700));
  }

  playVerifyIn(fx, label, slide = true) {
    fx.content.removeClass("cm-vf-out");
    const leaf = this.mainLeaf();
    const host = leaf && leaf.view && leaf.view.containerEl;
    const content = host && host.querySelector(".view-content");
    if (content && slide) {
      content.addClass("cm-vf-in");
      setTimeout(() => content.removeClass("cm-vf-in"), 650);
    }
    if (host && label) {
      host.addClass("cm-vf-host");
      const pill = host.createDiv({ cls: "cm-vf-next", text: label });
      setTimeout(() => pill.remove(), 2200);
    }
    setTimeout(() => { fx.host.removeClass("cm-vf-host"); if (host) host.removeClass("cm-vf-host"); }, 2300);
    setTimeout(() => { this.vfBusy = false; }, 700);
  }

  async reject(file) {
    const fm = this.precheck(file);
    if (!fm) return;
    if (!file.path.includes("/")) {
      new Notice(`Reject would delete “${file.basename}”, so it is disabled for root-level files. Revise it instead, or delete it by hand.`, 8000);
      return;
    }
    const backlinks = this.backlinksTo(file);
    const resolved = this.resolvedFor(file.path);
    new ReviewModal(this.app, {
      mode: "reject", name: file.basename, flags: [], resolved, backlinks,
      onConfirm: async (reason) => {
        const date = today();
        const order = this.queue();
        try {
          // Log first, so the reason is recorded even if a later step fails.
          await this.appendLog(rejectLogEntry({ name: file.basename, date, reason, dangling: backlinks, resolved }));
          const indexed = await this.updateIndex(file.basename, "remove", date);
          const path = file.path;
          if (this.settings.autoAdvance) await this.openNext(path, order);
          await this.app.fileManager.trashFile(file);
          delete this.resolved[path];
          await this.persist();
          new Notice(`Rejected and deleted “${file.basename}”.` + (indexed ? "" : " It wasn't in _index.md."), 5000);
        } catch (e) {
          console.error("Nicrosil: reject failed", e);
          new Notice(`Reject failed: ${e.message}. Check the log, _index.md and the page.`, 10000);
        }
        this.scheduleRefresh();
      },
    }).open();
  }

