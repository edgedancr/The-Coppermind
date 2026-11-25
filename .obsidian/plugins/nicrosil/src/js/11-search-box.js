/* ---------- search box on the Dashboard ---------- */

/** Keeps a searchable record of every page in scope, refreshed as pages change. */
class SearchIndex {
  constructor(app, scope, make, searcher) {
    this.app = app;
    this.scope = scope || inSearchScope;
    this.make = make || makeEntry;
    this.searcher = searcher || searchEntries;
    this.entries = new Map();
    this.dirty = new Set();
    this.ready = null;
  }

  start() {
    this.ready = this.buildAll();
    return this.ready;
  }

  async buildAll() {
    const files = this.app.vault.getMarkdownFiles().filter((f) => this.scope(f.path));
    for (const f of files) await this.index(f);
    // Drop anything that has since left the scope or the vault.
    for (const p of [...this.entries.keys()]) if (!this.app.vault.getAbstractFileByPath(p)) this.entries.delete(p);
  }

  async index(file) {
    if (!(file instanceof TFile) || !this.scope(file.path)) return;
    try {
      const text = await this.app.vault.read(file);
      const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      let yaml = {};
      if (m) { try { yaml = parseYaml(m[1]) || {}; } catch (e) { yaml = {}; } }
      this.entries.set(file.path, this.make(file.path, text, yaml));
    } catch (e) {
      this.entries.delete(file.path);
    }
  }

  /** Called when a page changes: re-reads it a moment later, once. */
  touch(file) {
    if (!(file instanceof TFile) || !this.scope(file.path)) return;
    this.dirty.add(file.path);
    if (this.timer) return;
    this.timer = setTimeout(async () => {
      this.timer = null;
      const paths = [...this.dirty];
      this.dirty.clear();
      for (const p of paths) {
        const f = this.app.vault.getAbstractFileByPath(p);
        if (f) await this.index(f); else this.entries.delete(p);
      }
    }, 1200);
  }

  remove(path) { this.entries.delete(path); }

  async rename(file, oldPath) {
    this.entries.delete(oldPath);
    await this.index(file);
  }

  search(q) { return this.searcher(this.entries.values(), q); }
}

class SearchBlock extends MarkdownRenderChild {
  /** opts.tin: the Tinmind's search (its own index, heading cards, no "search everything" link). */
  constructor(el, plugin, opts) {
    super(el);
    this.opts = opts || {};
    this.plugin = plugin;
    this.app = plugin.app;
    this.hits = [];
    this.active = 0;
    this.query = "";
  }

  idx() { return this.opts.tin ? this.plugin.tinIndex : this.plugin.searchIndex; }

  onload() {
    const el = this.containerEl;
    el.empty();
    el.addClass("cm-search");
    const what = this.opts.tin ? "the Tinmind" : "the Coppermind";
    const bar = el.createDiv({ cls: "cm-search-bar" });
    // Query mode (4.2.0): the Coppermind's bar only, and only on a computer, gets a Search / Query switch in place of the search icon
    this.canQuery = !this.opts.tin && !Platform.isMobile;
    if (this.canQuery) el.addClass("has-qswitch");
    if (this.canQuery) {
      const sw = bar.createDiv({ cls: "cm-qswitch", attr: { role: "group", "aria-label": "Search or query" } });
      this.swSearch = sw.createEl("button", { cls: "cm-qswitch-btn", attr: { type: "button", "aria-label": "Keyword search" } });
      setIcon(this.swSearch.createSpan(), "search");
      this.swSearch.createSpan({ cls: "cm-qtxt", text: "Search" });
      this.swQuery = sw.createEl("button", { cls: "cm-qswitch-btn", attr: { type: "button", "aria-label": "Ask Claude (query mode)" } });
      setIcon(this.swQuery.createSpan(), "sparkles");
      this.swQuery.createSpan({ cls: "cm-qtxt", text: "Query" });
      this.swSearch.addEventListener("click", () => this.setMode("search"));
      this.swQuery.addEventListener("click", () => this.setMode("query"));
    } else setIcon(bar.createSpan({ cls: "cm-search-icon" }), "search");
    this.input = bar.createEl("input", { cls: "cm-search-input", attr: { type: "text", placeholder: `Search ${what}…`, spellcheck: "false", autocomplete: "off", "aria-label": `Search ${what}` } });
    this.clearBtn = bar.createSpan({ cls: "cm-search-clear", attr: { role: "button", "aria-label": "Clear search" } });
    setIcon(this.clearBtn, "x");
    if (this.canQuery) {
      this.askBtn = bar.createEl("button", { cls: "cm-qask", attr: { type: "button" } });
      this.askBtn.createSpan({ cls: "cm-qtxt", text: "Ask" });
      setIcon(this.askBtn.createSpan(), "arrow-right");
      this.askBtn.addEventListener("click", () => this.ask());
      this.qOpts = el.createDiv({ cls: "cm-qopts" });
      this.drawQueryOptions();
      this.plugin.usageListeners = this.plugin.usageListeners || new Set();
      const redraw = () => this.drawUsage();
      this.plugin.usageListeners.add(redraw);
      this.register(() => this.plugin.usageListeners.delete(redraw));
    }
    this.list = el.createDiv({ cls: "cm-search-results" });
    this.list.hide();
    this.mode = "search";
    if (this.canQuery) this.setMode(this.plugin.settings.searchMode === "query" ? "query" : "search", true);

    this.input.addEventListener("input", () => this.onType());
    this.input.addEventListener("focus", () => { if (this.query.trim()) this.show(); });
    this.input.addEventListener("keydown", (e) => this.onKey(e));
    this.clearBtn.addEventListener("click", () => { this.input.value = ""; this.onType(); this.input.focus(); });
    this.registerDomEvent(document, "mousedown", (e) => { if (!el.contains(e.target)) this.list.hide(); });
    // keep drawing results as the list is scrolled toward its end
    this.list.addEventListener("scroll", () => {
      const l = this.list;
      if (l.scrollTop + l.clientHeight >= l.scrollHeight - 160) this.more();
    });
  }

  /** Switches the bar between keyword search and query mode, and remembers the choice. */
  setMode(mode, quiet) {
    this.mode = mode;
    const q = mode === "query";
    this.containerEl.toggleClass("is-query", q);
    this.swSearch.toggleClass("is-on", !q); this.swSearch.setAttr("aria-pressed", String(!q));
    this.swQuery.toggleClass("is-on", q); this.swQuery.setAttr("aria-pressed", String(q));
    this.input.setAttr("placeholder", q ? "Ask the Coppermind a question…" : "Search the Coppermind…");
    this.input.setAttr("aria-label", q ? "Ask the Coppermind a question" : "Search the Coppermind");
    this.qOpts.toggle(q);
    this.askBtn.toggle(q);
    if (q) { this.hits = []; this.list.hide(); } else this.onType();
    if (!quiet) {
      this.plugin.settings.searchMode = mode; this.plugin.persist();
      this.input.focus();
    }
  }

  /** The Model, Effort and Depth switches and the usage meter, under the bar in query mode. */
  drawQueryOptions() {
    const box = this.qOpts;
    box.empty();
    const st = this.plugin.settings;
    const group = (label, list, key, def) => {
      const g = box.createDiv({ cls: "cm-qgroup" });
      const lb = g.createDiv({ cls: "cm-qlabel" });
      lb.createSpan({ text: label });
      lb.createSpan({ cls: "cm-qrule" });
      const row = g.createDiv({ cls: "cm-qseg", attr: { role: "group", "aria-label": label } });
      const cur = st[key] || def;
      for (const [k, name] of list) {
        const b = row.createEl("button", { cls: "cm-qseg-btn" + (k === cur ? " is-on" : ""), attr: { type: "button", "aria-pressed": String(k === cur) } });
        b.createSpan({ cls: "cm-qtxt", text: name });
        b.addEventListener("click", () => { st[key] = k; this.plugin.persist(); this.drawQueryOptions(); });
      }
      return g;
    };
    group("Model", QUERY_MODELS, "queryModel", "sonnet");
    const eff = group("Effort", QUERY_EFFORTS, "queryEffort", "medium");
    if ((st.queryModel || "sonnet") === "haiku") { eff.addClass("is-off"); eff.setAttr("title", "Haiku runs without an effort setting"); }
    group("Depth", QUERY_DEPTHS, "queryDepth", "standard");
    this.usageEl = box.createDiv({ cls: "cm-qusage" });
    this.drawUsage();
  }

  drawUsage() {
    const el = this.usageEl;
    if (!el) return;
    el.empty();
    const u = this.plugin.settings.lastUsage;
    const head = el.createDiv({ cls: "cm-qlabel cm-qusage-head" });
    head.createSpan({ text: "Usage" });
    head.createSpan({ cls: "cm-qrule" });
    const link = head.createEl("a", { cls: "cm-qusage-link", text: "View usage ↗", attr: { href: USAGE_URL } });
    link.addEventListener("click", (e) => { e.preventDefault(); window.open(USAGE_URL); });
    if (u && Number.isFinite(u.pct)) {
      const row = el.createDiv({ cls: "cm-qusage-row" });
      row.createSpan({ text: u.kind ? u.kind.replace(/_/g, " ") : "Plan limit" });
      row.createSpan({ cls: "cm-qusage-pct", text: `${u.pct}%` });
      const fill = el.createDiv({ cls: "cm-progress" }).createDiv({ cls: "cm-progress-fill" });
      fill.style.width = `${u.pct}%`;
      el.createDiv({ cls: "cm-qusage-note", text: `As of ${new Date(u.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}, from the last query` });
    } else {
      const r = this.plugin.settings.lastRun;
      el.createDiv({ cls: "cm-qusage-note", text: r ? `Last query used about ${Math.round(r.tokens / 1000)}k tokens. Claude Code didn't report a usage percent.` : "Shows after your first query, if Claude Code reports it." });
    }
  }

  /** Sends the question in the box to a new query tab. */
  ask() {
    const question = this.input.value.trim();
    if (!question) { this.input.focus(); new Notice("Type a question first."); return; }
    const st = this.plugin.settings;
    this.plugin.startQuery({ question, model: st.queryModel || "sonnet", effort: st.queryEffort || "medium", depth: st.queryDepth || "standard" });
    this.input.value = "";
    this.clearBtn.removeClass("is-visible");
  }

  async onType() {
    this.query = this.input.value;
    this.clearBtn.toggleClass("is-visible", !!this.query);
    if (this.mode === "query") { this.hits = []; this.list.hide(); return; }
    if (!this.query.trim()) { this.hits = []; this.list.hide(); return; }
    const idx = this.idx();
    if (idx.ready) await idx.ready;
    if (this.query !== this.input.value) return; // typed more while waiting
    this.hits = idx.search(this.query);
    this.active = 0;
    this.render();
  }

  show() {
    if (this.query.trim()) { this.render(); }
  }

  render() {
    const list = this.list;
    list.empty();
    list.show();
    this.cards = null;
    const tokens = tokenize(this.query);
    if (!tokens.length) {
      list.createDiv({ cls: "cm-search-empty", text: "Keep typing…" });
      return;
    }
    if (!this.hits.length) {
      list.createDiv({ cls: "cm-search-empty", text: this.opts.tin ? `No notes or headings match “${this.query.trim()}”.` : `No pages match “${this.query.trim()}”.` });
    }
    this.cards = list.createDiv({ cls: "cm-search-cards" });
    this.shown = 0;
    const foot = list.createDiv({ cls: "cm-search-foot" });
    this.count = foot.createSpan({ cls: "cm-search-count" });
    if (!this.opts.tin) {
      const link = foot.createSpan({ cls: "cm-search-more", text: "Search everything, including class notes ↗", attr: { role: "button", tabindex: "0" } });
      const go = () => this.searchAll();
      link.addEventListener("click", go);
      link.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); go(); } });
    }
    this.more();
    this.updateCount();
    // if the first batch doesn't fill the list, there is nothing to scroll: draw until it does
    while (this.shown < this.hits.length && list.scrollHeight <= list.clientHeight + 160 && list.clientHeight > 0) this.more();
  }

  /** Draws the next batch of result cards (all of them stay reachable by scrolling or the arrow keys). */
  more() {
    if (!this.cards || this.shown >= this.hits.length) return;
    const tokens = tokenize(this.query);
    const end = Math.min(this.shown + SEARCH_PAGE, this.hits.length);
    const first = this.shown;
    for (let i = this.shown; i < end; i++) {
      const h = this.hits[i];
      const e = h.entry;
      const card = this.cards.createDiv({ cls: "cm-search-card" + (i === this.active ? " is-active" : "") });
      card.style.setProperty("--i", String(Math.min(i - first, 12)));
      card.setAttr("role", "option");
      const top = card.createDiv({ cls: "cm-search-top" });
      const title = top.createSpan({ cls: "cm-search-title" });
      this.marked(title, h.heading || e.name, tokens);
      if (h.heading) top.createSpan({ cls: "cm-search-tag", text: "Heading" });
      else if (e.typeLabel) top.createSpan({ cls: "cm-search-tag", text: e.typeLabel });
      if (e.status) top.createSpan({ cls: "cm-search-status cm-search-" + e.status, text: e.status });
      if (h.heading) {
        const a = card.createDiv({ cls: "cm-search-alias" });
        a.appendText("In ");
        a.createSpan({ text: e.name });
        if (e.where) a.appendText(" · " + e.where);
      } else if (h.aliasNote) {
        const a = card.createDiv({ cls: "cm-search-alias" });
        a.appendText("Also known as ");
        this.marked(a.createSpan(), h.aliasNote, tokens);
      }
      if (h.snippet) this.marked(card.createDiv({ cls: "cm-search-snippet" }), h.snippet, tokens);
      card.addEventListener("mousemove", () => this.setActive(i, false));
      card.addEventListener("click", (ev) => this.open(h, ev.ctrlKey || ev.metaKey));
    }
    this.shown = end;
    this.updateCount();
  }

  updateCount() {
    if (!this.count) return;
    const n = this.hits.length;
    this.count.setText(this.shown < n ? `${this.shown} of ${n} matches · scroll for more` : `${n} ${n === 1 ? "match" : "matches"}`);
  }

  /** Makes sure the card for result i has been drawn. */
  ensure(i) { while (this.shown <= i && this.shown < this.hits.length) this.more(); }

  marked(el, text, tokens) {
    for (const part of highlight(text, tokens)) {
      if (part.hit) el.createEl("mark", { text: part.t });
      else el.appendText(part.t);
    }
  }

  setActive(i, scroll) {
    if (i === this.active) return;
    this.active = i;
    this.ensure(i);
    const cards = this.list.querySelectorAll(".cm-search-card");
    cards.forEach((c, k) => c.toggleClass("is-active", k === i));
    if (scroll && cards[i]) cards[i].scrollIntoView({ block: "nearest" });
  }

  onKey(e) {
    if (this.mode === "query") {
      if (e.key === "Enter") { e.preventDefault(); this.ask(); }
      else if (e.key === "Escape") { this.input.value = ""; this.onType(); this.input.blur(); }
      return;
    }
    if (e.key === "ArrowDown" && this.hits.length) { e.preventDefault(); this.list.show(); this.setActive((this.active + 1) % this.hits.length, true); }
    else if (e.key === "ArrowUp" && this.hits.length) { e.preventDefault(); this.setActive((this.active - 1 + this.hits.length) % this.hits.length, true); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const h = this.hits[this.active];
      if (h) this.open(h, e.ctrlKey || e.metaKey);
    } else if (e.key === "Escape") {
      if (this.list.isShown()) this.list.hide();
      else { this.input.value = ""; this.onType(); this.input.blur(); }
    }
  }

  open(hit, newTab) {
    this.app.workspace.openLinkText(hit.heading ? headingLink(hit.entry.path, hit.heading) : hit.entry.path, "", !!newTab);
    if (!newTab) { this.input.value = ""; this.onType(); }
    else this.list.hide();
  }

  searchAll() {
    const url = `obsidian://search?vault=${encodeURIComponent(this.app.vault.getName())}&query=${encodeURIComponent(this.query.trim())}`;
    window.open(url);
  }
}

