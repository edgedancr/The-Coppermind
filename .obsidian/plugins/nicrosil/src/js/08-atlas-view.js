/* ---------- The atlas (the wiki map, 3.29.0) ---------- */

const MAP_VIEW_TYPE = "nicrosil-wikimap";
const TOPICS_PATH = "_topics.md"; // the topic list: a heading, a line and anchor pages for each topic (SCHEMA - Ingest, step 6)

/** Dot colors by page type, for the atlas's "Type" coloring. */
const PAGE_COLORS = {
  concept: "#7aa2d6", glossary: "#9ac28a", framework: "#d6a76a", "case-study": "#d98a8a",
  person: "#c3a0d9", summary: "#8fb8b0", prompt: "#d9cf7a", workflow: "#8aa0b8",
  guide: "#b8b08a", analysis: "#cc9a7a", perspective: "#a8a8a8",
};
const pageColor = (t) => PAGE_COLORS[t] || "#999999";
const dotRadius = (inDeg) => 3.2 + Math.min(8, 1.5 * Math.sqrt(inDeg));

/**
 * The atlas: every topic in _topics.md as a circle, every page in Wiki/ and Perspectives/ as a dot in its topic's circle,
 * and the links between topics as bands whose width is the number of links. Click a topic to look inside it, a dot to
 * trace its links; scroll zooms, dragging pans. Nothing moves on its own: the layout is worked out once from the links
 * (Nicrosil's atlas(), again only when the links or the topic list change), and the view only changes what it shows.
 */
class WikiMapView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.st = { topic: null, focus: null, color: "type" };
    this.vb = null;
    this.raf = 0;
    this.token = 0;
    this.rerender = debounce(() => this.render(), 900, true);
  }
  getViewType() { return MAP_VIEW_TYPE; }
  getDisplayText() { return "Atlas"; }
  getIcon() { return "network"; }
  async onOpen() {
    this.render();
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.rerender()));
    this.registerEvent(this.app.metadataCache.on("changed", () => this.rerender()));
    this.registerEvent(this.app.vault.on("rename", () => this.rerender()));
    this.registerEvent(this.app.vault.on("delete", () => this.rerender()));
    this.registerDomEvent(this.containerEl, "keydown", (e) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) { this.back(); e.preventDefault(); }
    });
  }
  async onClose() { cancelAnimationFrame(this.raf); clearTimeout(this.refitTimer); if (this.ro) this.ro.disconnect(); this.containerEl.children[1].empty(); }
  /** The tab was resized or shown (a sidebar closing, say): glide to the view that fits the new space. */
  onResize() { this.rectCache = null; this.refit(); }

  go(path, newTab) {
    if (!path) return;
    if (!newTab) { this.plugin.openFile(path); return; }
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof TFile) this.app.workspace.getLeaf(true).openFile(f);
  }

  /** Opens on a topic or a page (from the Lens, a command or the Dashboard). */
  show(opts = {}) {
    if (opts.focus) { this.st.focus = opts.focus; this.st.topic = null; }
    else if (opts.topic !== undefined) { this.st.topic = opts.topic; this.st.focus = null; }
    if (this.data) this.apply(); else this.render();
  }

  back() {
    if (this.st.focus) this.st.focus = null;
    else if (this.st.topic !== null) this.st.topic = null;
    else return;
    this.apply();
  }

  async render() {
    const token = ++this.token;
    let data;
    try { data = await this.plugin.atlas(); } catch (e) { console.error("Nicrosil: atlas", e); return; }
    if (token !== this.token) return;
    if (data === this.data && this.svg && this.svg.isConnected) {
      // the same links and topics: only statuses may have changed, so recolor and keep the view (and its zoom) as it is
      this.paintDots();
      const sc = this.side.scrollTop;
      const focus = this.st.focus ? data.nodes.get(this.st.focus) : null;
      this.drawSide(focus ? data.topic.get(focus.path) : this.st.topic, focus);
      this.side.scrollTop = sc;
      return;
    }
    this.data = data;
    if (this.st.focus && !data.nodes.has(this.st.focus)) this.st.focus = null;
    if (this.st.topic !== null && !data.groups.some((g) => g.key === this.st.topic)) this.st.topic = null;
    cancelAnimationFrame(this.raf);
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("cm-at");
    this.drawBar(root);
    const main = root.createDiv({ cls: "cm-at-main" });
    this.stage = main.createDiv({ cls: "cm-at-stage" });
    this.side = main.createDiv({ cls: "cm-at-side" });
    this.drawSvg();
    this.apply(true);
    if (!this.introDone) {
      // the first time the atlas opens it eases in from a wider view, so it settles into place
      this.introDone = true;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const f = this.vb, w = f.w * 1.5, h = f.h * 1.5;
        this.setVb({ x: f.x - (w - f.w) / 2, y: f.y - (h - f.h) / 2, w, h });
        window.requestAnimationFrame(() => this.glide(f, false));
      }
    }
  }

  drawBar(root) {
    const bar = root.createDiv({ cls: "cm-at-bar" });
    const title = bar.createDiv({ cls: "cm-at-title", text: "Atlas", attr: { role: "button", tabindex: "0", title: "Back to the whole wiki" } });
    const home = () => { this.st.topic = null; this.st.focus = null; this.apply(); };
    title.addEventListener("click", home);
    title.addEventListener("keydown", (e) => { if (e.key === "Enter") home(); });
    this.crumbs = bar.createDiv({ cls: "cm-at-crumbs" });
    bar.createDiv({ cls: "cm-at-gap" });
    const sw = bar.createDiv({ cls: "cm-at-search" });
    const input = sw.createEl("input", { type: "search", attr: { placeholder: "Find a page…", "aria-label": "Find a page on the atlas" } });
    const list = sw.createDiv({ cls: "cm-at-results" });
    let hits = [], act = 0;
    const pick = (p) => { input.value = ""; list.empty(); list.removeClass("is-open"); this.st.focus = p; this.st.topic = null; this.apply(); };
    const draw = () => {
      list.empty();
      list.toggleClass("is-open", hits.length > 0);
      hits.forEach((n, i) => {
        const r = list.createDiv({ cls: "cm-at-result" + (i === act ? " is-active" : ""), text: n.name });
        r.createSpan({ cls: "cm-at-result-topic", text: this.topicName(this.data.topic.get(n.path)) });
        r.addEventListener("mousedown", (e) => { e.preventDefault(); pick(n.path); });
      });
    };
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      act = 0;
      hits = !q ? [] : [...this.data.nodes.values()].filter((n) => n.name.toLowerCase().includes(q))
        .sort((a, b) => (b.name.toLowerCase().startsWith(q) - a.name.toLowerCase().startsWith(q)) || b.inDeg - a.inDeg).slice(0, 8);
      draw();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && hits.length) { act = (act + 1) % hits.length; draw(); e.preventDefault(); }
      else if (e.key === "ArrowUp" && hits.length) { act = (act - 1 + hits.length) % hits.length; draw(); e.preventDefault(); }
      else if (e.key === "Enter" && hits[act]) pick(hits[act].path);
      else if (e.key === "Escape") { input.value = ""; hits = []; draw(); }
    });
    input.addEventListener("blur", () => { list.removeClass("is-open"); });
    const seg = bar.createDiv({ cls: "cm-at-seg", attr: { role: "group", "aria-label": "Color the dots by" } });
    [["type", "Type"], ["state", "Status"]].forEach(([id, label]) => {
      const b = seg.createEl("button", { text: label, cls: this.st.color === id ? "is-active" : "" });
      b.addEventListener("click", () => { this.st.color = id; seg.querySelectorAll("button").forEach((x) => x.toggleClass("is-active", x === b)); this.paintDots(); this.drawKey(); });
    });
    const edit = bar.createEl("button", { cls: "cm-at-edit", text: "Edit topics" });
    edit.addEventListener("click", async (e) => {
      let f = this.app.vault.getAbstractFileByPath(TOPICS_PATH);
      if (!(f instanceof TFile)) f = await this.app.vault.create(TOPICS_PATH, "The major topics of the Coppermind, for the atlas. Each `## Topic` heading is a circle; under it, one line on what it covers and a list of its anchor pages (`- [[Page]]`).\n");
      this.go(f.path, e.ctrlKey || e.metaKey || true);
    });
  }

  topicName(key) {
    if (key === undefined || key === null) return "";
    return key < 0 ? "No topic yet" : this.data.topics[key].name;
  }
  group(key) { return this.data.groups.find((g) => g.key === key); }

  drawSvg() {
    const d = this.data;
    this.stage.empty();
    const svg = this.svg = svgEl(this.stage, "svg", { class: "cm-at-svg", role: "img", "aria-label": "Atlas of the wiki's topics" });
    this.rectCache = null; this.kSet = 0;
    const defs = svgEl(svg, "defs");
    const fill = svgEl(defs, "radialGradient", { id: "cm-at-fill", cx: 0.5, cy: 0.42, r: 0.62 });
    svgEl(fill, "stop", { offset: "0%", style: "stop-color: #b87333; stop-opacity: .17" });
    svgEl(fill, "stop", { offset: "100%", style: "stop-color: #b87333; stop-opacity: .04" });
    const fillNone = svgEl(defs, "radialGradient", { id: "cm-at-fill-none", cx: 0.5, cy: 0.45, r: 0.6 });
    svgEl(fillNone, "stop", { offset: "0%", style: "stop-color: #8a8178; stop-opacity: .12" });
    svgEl(fillNone, "stop", { offset: "100%", style: "stop-color: #8a8178; stop-opacity: .03" });
    for (const [t, info] of Object.entries(LINK_TYPES)) {
      const m = svgEl(defs, "marker", { id: `cm-at-arrow-${t}`, viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" });
      svgEl(m, "path", { d: "M0,0 L8,4 L0,8 z", fill: info.color });
    }
    this.gBands = svgEl(svg, "g", { class: "cm-at-bands" });
    this.gTopics = svgEl(svg, "g", { class: "cm-at-topics" });
    this.gEdges = svgEl(svg, "g", { class: "cm-at-edges" });
    this.gDots = svgEl(svg, "g", { class: "cm-at-dots" });
    this.gLabels = svgEl(svg, "g", { class: "cm-at-labels" });
    // the topic names go last, so they are always drawn on top of the dots and page labels
    this.gNames = svgEl(svg, "g", { class: "cm-at-names" });

    // bands between topics: from rim to rim, bowed a little, as wide as the links between them
    this.bandEls = [];
    for (const [k, n] of d.pairs) {
      const [a, b] = k.split("|").map(Number);
      const A = this.group(a), B = this.group(b);
      if (!A || !B) continue;
      const dx = B.x - A.x, dy = B.y - A.y, dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
      const x1 = A.x + ux * A.r, y1 = A.y + uy * A.r, x2 = B.x - ux * B.r, y2 = B.y - uy * B.r;
      const mx = (x1 + x2) / 2 - uy * dist * 0.08, my = (y1 + y2) / 2 + ux * dist * 0.08;
      const p = svgEl(this.gBands, "path", { d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}`, class: "cm-at-band" });
      p.style.strokeWidth = `calc(${Math.min(16, 1.2 + 1.5 * Math.sqrt(n))}px * var(--k, 1))`;
      svgEl(p, "title", {}, `${this.topicName(a)} ↔ ${this.topicName(b)}: ${n} link${n === 1 ? "" : "s"}`);
      this.bandEls.push({ a, b, el: p });
    }

    // topic circles and their names
    this.topicEls = new Map();
    this.nameEls = new Map();
    for (const g of d.groups) {
      const el = svgEl(this.gTopics, "g", { class: "cm-at-topic" + (g.key < 0 ? " is-none" : ""), tabindex: 0, role: "button", "aria-label": `${this.topicName(g.key)}, ${g.members.length} pages` });
      svgEl(el, "circle", { cx: g.x, cy: g.y, r: g.r, class: "cm-at-disc", fill: g.key < 0 ? "url(#cm-at-fill-none)" : "url(#cm-at-fill)" });
      // the name above the circle, on two lines when it is long
      const lines = wrapWords(this.topicName(g.key), 18);
      const nm = svgEl(this.gNames, "g", { class: "cm-at-topicname" + (g.key < 0 ? " is-none" : "") });
      this.nameEls.set(g.key, nm);
      const tx = svgEl(nm, "text", { x: g.x, y: g.y - g.r - 8, "text-anchor": "middle", class: "cm-at-tname" });
      lines.forEach((ln, i) => svgEl(tx, "tspan", { x: g.x, dy: i ? "1.15em" : `${-(lines.length - 1) * 1.15}em` }, ln));
      svgEl(el, "title", {}, `${this.topicName(g.key)}: ${g.members.length} pages`);
      el.addEventListener("click", (e) => { if (this.dragged) return; e.stopPropagation(); this.st.topic = g.key; this.st.focus = null; this.apply(); });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") { this.st.topic = g.key; this.st.focus = null; this.apply(); } });
      this.topicEls.set(g.key, el);
    }

    // one dot per page; anchors get a ring
    this.dotEls = new Map();
    this.labelEls = new Map();
    for (const n of d.nodes.values()) {
      const p = d.pos.get(n.path);
      if (!p) continue;
      const c = svgEl(this.gDots, "circle", { cx: p.x, cy: p.y, r: dotRadius(n.inDeg), class: "cm-at-dot" + (d.anchorSet.has(n.path) ? " is-anchor" : "") });
      svgEl(c, "title", {}, `${n.name} · ${STATE_LABELS[n.state].toLowerCase()} · ${n.inDeg} link${n.inDeg === 1 ? "" : "s"} in`);
      c.addEventListener("click", (e) => {
        if (this.dragged) return;
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) { this.go(n.path, true); return; }
        this.st.focus = this.st.focus === n.path ? null : n.path;
        this.apply();
      });
      c.addEventListener("dblclick", (e) => { e.stopPropagation(); this.go(n.path, false); });
      this.dotEls.set(n.path, c);
      const t = svgEl(this.gLabels, "text", { x: p.x, y: p.y - dotRadius(n.inDeg) - 3, "text-anchor": "middle", class: "cm-at-label" }, clip(n.name, 26));
      c.addEventListener("mouseenter", () => t.addClass("is-hover"));
      c.addEventListener("mouseleave", () => t.removeClass("is-hover"));
      this.labelEls.set(n.path, t);
    }
    this.paintDots();

    this.key = this.stage.createDiv({ cls: "cm-at-key" });
    this.drawKey();

    // zoom with the wheel around the pointer; drag to pan; a click on empty space goes back to the whole wiki
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const pt = this.toSvg(e.clientX, e.clientY), f = Math.exp(e.deltaY * 0.0015), vb = this.vb;
      const w = Math.max(60, Math.min(this.full.w * 2, vb.w * f)), h = w * (vb.h / vb.w), k = w / vb.w;
      cancelAnimationFrame(this.raf);
      this.userView = true;
      this.queueVb({ x: pt.x - (pt.x - vb.x) * k, y: pt.y - (pt.y - vb.y) * k, w, h });
    }, { passive: false });
    svg.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      this.rectCache = null;
      const start = { x: e.clientX, y: e.clientY, vb: { ...this.vb } };
      const scale = this.vb.w / (this.svgRect().width || 1);
      this.dragged = false;
      const move = (ev) => {
        const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        if (!this.dragged && Math.hypot(dx, dy) < 4) return;
        this.dragged = true; this.userView = true; svg.addClass("is-panning");
        cancelAnimationFrame(this.raf);
        this.queueVb({ ...start.vb, x: start.vb.x - dx * scale, y: start.vb.y - dy * scale });
      };
      const up = () => {
        window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        svg.removeClass("is-panning");
        window.setTimeout(() => { this.dragged = false; }, 0);
      };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    });
    svg.addEventListener("click", () => { if (this.dragged) return; if (this.st.focus || this.st.topic !== null) { this.st.focus = null; this.st.topic = null; this.apply(); } });
    this.drawSvgBounds();
    // the stage changes size when a sidebar opens or closes or the window is resized: fit the view to the new space
    if (this.ro) this.ro.disconnect();
    if (typeof ResizeObserver !== "undefined") {
      let last = 0;
      this.ro = new ResizeObserver(() => { this.rectCache = null; const w = this.stage.clientWidth; if (Math.abs(w - last) > 2) { last = w; this.refit(); } });
      this.ro.observe(this.stage);
    }
  }

  /** The box that shows the whole wiki, with room for the topic names above the circles. */
  drawSvgBounds() {
    const d = this.data;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    // a topic's name can be wider than its circle: allow about 9.5px a letter at the size the whole map is drawn
    let k0 = 1;
    for (let pass = 0; pass < 2; pass++) {
      x0 = Infinity; y0 = Infinity; x1 = -Infinity; y1 = -Infinity;
      for (const g of d.groups) {
        const lines = wrapWords(this.topicName(g.key), 18);
        const half = Math.max(g.r, (Math.max(...lines.map((l) => l.length)) * 9.5 * k0) / 2);
        x0 = Math.min(x0, g.x - half); x1 = Math.max(x1, g.x + half); y0 = Math.min(y0, g.y - g.r - (10 + 18 * lines.length) * k0); y1 = Math.max(y1, g.y + g.r);
      }
      k0 = (x1 - x0) / Math.max(400, this.stage.clientWidth || 1000);
    }
    if (!isFinite(x0)) { x0 = -100; y0 = -100; x1 = 100; y1 = 100; }
    const m = 30;
    this.full = { x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m };
  }

  toSvg(cx, cy) {
    const r = this.svgRect(), vb = this.vb;
    const s = Math.max(vb.w / (r.width || 1), vb.h / (r.height || 1)); // preserveAspectRatio "meet": the larger scale wins
    return { x: vb.x + vb.w / 2 + (cx - r.left - r.width / 2) * s, y: vb.y + vb.h / 2 + (cy - r.top - r.height / 2) * s };
  }
  /** The size of the svg on screen, measured once and again only when the space changes (measuring on every move forces a layout). */
  svgRect() {
    if (!this.rectCache) { const r = this.svg.getBoundingClientRect(); this.rectCache = { left: r.left, top: r.top, width: r.width, height: r.height }; }
    return this.rectCache;
  }
  setVb(v) {
    this.vb = v;
    this.svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
    // labels and lines keep their size on screen as the view zooms; a pan doesn't change it, so then nothing is restyled
    const r = this.svgRect();
    const s = Math.max(v.w / (r.width || 800), v.h / (r.height || 600));
    if (!this.kSet || Math.abs(s - this.kSet) > this.kSet * 1e-4) { this.kSet = s; this.svg.style.setProperty("--k", String(s)); }
  }
  /** While the view moves the dashed links are drawn solid (dashing is the slowest thing to redraw); they are dashed again a moment after it stops. */
  moving() {
    if (!this.svg) return;
    this.svg.addClass("is-moving");
    clearTimeout(this.movingTimer);
    this.movingTimer = window.setTimeout(() => { if (this.svg) this.svg.removeClass("is-moving"); }, 180);
  }
  /** For the wheel and the drag: remember the view now and draw it once a frame, however many events came in. */
  queueVb(v) {
    this.vb = v;
    this.moving();
    if (this.queued) return;
    this.queued = window.requestAnimationFrame(() => { this.queued = 0; if (this.svg && this.svg.isConnected && this.vb) this.setVb(this.vb); });
  }
  glide(to, now) {
    cancelAnimationFrame(this.raf);
    const from = this.vb;
    if (!from || now || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { this.setVb(to); return; }
    const t0 = performance.now(), dur = 380;
    const step = (t) => {
      const u = Math.min(1, (t - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      this.moving();
      this.setVb({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
      if (u < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  paintDots() {
    for (const [path, el] of this.dotEls || []) {
      const n = this.data.nodes.get(path);
      el.style.fill = this.st.color === "type" ? pageColor(n.type) : STATE_COLORS[n.state];
    }
  }

  drawKey() {
    if (!this.key) return;
    this.key.empty();
    const entries = this.st.color === "type"
      ? Object.keys(PAGE_COLORS).filter((t) => [...this.data.nodes.values()].some((n) => n.type === t)).map((t) => [t.replace("-", " "), PAGE_COLORS[t]])
      : ["verified", "rereview", "draft"].map((s) => [STATE_LABELS[s], STATE_COLORS[s]]);
    entries.forEach(([label, col]) => { const s = this.key.createSpan({ cls: "cm-at-keyitem" }); s.createSpan({ cls: "cm-at-keydot" }).style.background = col; s.appendText(label); });
    const a = this.key.createSpan({ cls: "cm-at-keyitem" }); a.createSpan({ cls: "cm-at-keydot is-anchor" }); a.appendText("anchor");
  }

  /** Puts the view in line with this.st: what is lit, dimmed and labeled, which links are drawn, the side panel and the zoom. */
  apply(now = false) {
    const d = this.data, st = this.st;
    this.userView = false; // picking something fits it; zooming or panning by hand sets this again
    const focus = st.focus ? d.nodes.get(st.focus) : null;
    const tkey = focus ? d.topic.get(focus.path) : st.topic;
    const near = new Set();
    if (focus) { near.add(focus.path); for (const e of focus.out) near.add(e.to); for (const e of focus.inn) near.add(e.from); }
    this.svg.toggleClass("is-zoomed", tkey !== null && tkey !== undefined);
    this.svg.toggleClass("is-tracing", !!focus);

    for (const [k, el] of this.topicEls) el.toggleClass("is-active", k === tkey);
    for (const [k, el] of this.nameEls) el.toggleClass("is-active", k === tkey);
    for (const b of this.bandEls) {
      b.el.toggleClass("is-lit", !focus && tkey !== null && (b.a === tkey || b.b === tkey));
      b.el.toggleClass("is-faded", !!focus || (tkey !== null && b.a !== tkey && b.b !== tkey));
    }
    // labels: the anchors and busiest pages of the open topic, or the traced page and its neighbors
    const labeled = new Set();
    if (focus) {
      // a busy page's neighbors would bury each other's names: then only its typed links and its busiest neighbors are named
      const typedNear = new Set([...focus.out, ...focus.inn].filter((e) => e.type !== "see").map((e) => (e.from === focus.path ? e.to : e.from)));
      const list = [...near];
      const keep = list.length <= 22 ? list : [focus.path, ...typedNear, ...list.sort((a, b) => d.nodes.get(b).inDeg - d.nodes.get(a).inDeg).slice(0, 10)];
      keep.forEach((p) => labeled.add(p));
    }
    else if (tkey !== null) {
      const g = this.group(tkey);
      const busiest = g ? [...g.members].sort((a, b) => d.nodes.get(b).inDeg - d.nodes.get(a).inDeg).slice(0, 14) : [];
      busiest.forEach((p) => labeled.add(p));
      if (g) g.members.forEach((p) => { if (d.anchorSet.has(p)) labeled.add(p); });
    }
    for (const [p, el] of this.dotEls) {
      const inT = d.topic.get(p) === tkey;
      el.toggleClass("is-focus", !!focus && p === focus.path);
      el.toggleClass("is-near", !!focus && near.has(p) && p !== focus.path);
      el.toggleClass("is-dim", focus ? !near.has(p) : tkey !== null && !inT);
    }
    for (const [p, el] of this.labelEls) el.toggleClass("is-shown", labeled.has(p));

    // links between pages: the traced page's, or those of the open topic (none on the whole-wiki view, where the bands stand for them)
    this.gEdges.empty();
    // a topic has hundreds of links: those of one kind share one path, so the browser has a few shapes to draw and not hundreds
    const merged = new Map();
    const line = (e, cls) => {
      const a = d.pos.get(e.from), b = d.pos.get(e.to);
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1;
      const rb = dotRadius(d.nodes.get(e.to).inDeg) + 1.5;
      const x2 = b.x - (dx / dist) * rb, y2 = b.y - (dy / dist) * rb;
      const mx = (a.x + x2) / 2 - (dy / dist) * dist * 0.1, my = (a.y + y2) / 2 + (dx / dist) * dist * 0.1;
      const info = LINK_TYPES[e.type];
      const dd = `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
      if (cls !== "is-trace") { const k = cls + "|" + e.type; merged.set(k, (merged.get(k) || "") + dd); return; }
      const p = svgEl(this.gEdges, "path", { d: dd, class: `cm-at-edge ${cls}` + (e.type === "see" ? " is-see" : "") });
      p.style.stroke = info.color;
      p.setAttribute("marker-end", `url(#cm-at-arrow-${e.type})`);
    };
    if (focus) { focus.out.forEach((e) => line(e, "is-trace")); focus.inn.forEach((e) => line(e, "is-trace")); }
    else if (tkey !== null) {
      for (const e of d.edges) {
        const ta = d.topic.get(e.from), tb = d.topic.get(e.to);
        if (ta === tkey && tb === tkey) line(e, "is-inside");
        else if (ta === tkey || tb === tkey) line(e, "is-across");
      }
      for (const [k, dd] of merged) {
        const [cls, type] = k.split("|");
        const p = svgEl(this.gEdges, "path", { d: dd, class: `cm-at-edge ${cls}` + (type === "see" ? " is-see" : "") });
        p.style.stroke = LINK_TYPES[type].color;
      }
    }
    this.drawCrumbs(tkey, focus);
    this.drawSide(tkey, focus);

    this.glide(this.fitBox(), now || !this.vb);
  }

  /** The view that shows what is open (the traced page and its neighbors, the open topic, or the whole wiki) at the shape of the space it has now. */
  fitBox() {
    const d = this.data, st = this.st;
    const focus = st.focus ? d.nodes.get(st.focus) : null;
    const tkey = focus ? d.topic.get(focus.path) : st.topic;
    let box = this.full;
    if (focus) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const near = new Set([focus.path]);
      for (const e of focus.out) near.add(e.to);
      for (const e of focus.inn) near.add(e.from);
      near.forEach((p) => { const q = d.pos.get(p); if (q) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); } });
      const w = Math.max(220, x1 - x0 + 120), h = Math.max(160, y1 - y0 + 120);
      box = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
    } else if (tkey !== null) {
      const g = this.group(tkey);
      if (g) { const s = g.r * 1.25; box = { x: g.x - s, y: g.y - s - 18, w: 2 * s, h: 2 * s + 18 }; }
    }
    const r = this.svgRect();
    const asp = r.width && r.height ? r.width / r.height : 1.5;
    if (box.w / box.h < asp) { const w = box.h * asp; box = { ...box, x: box.x - (w - box.w) / 2, w }; }
    else { const h = box.w / asp; box = { ...box, y: box.y - (h - box.h) / 2, h }; }
    return box;
  }

  /**
   * The space the atlas has changed (a sidebar opened or closed, the window was resized): glide to the view that fits it,
   * unless I have zoomed or panned myself since I last picked something. Waits for the resizing to settle, so it glides once.
   */
  refit() {
    clearTimeout(this.refitTimer);
    this.refitTimer = window.setTimeout(() => {
      if (!this.svg || !this.svg.isConnected || !this.data) return;
      this.rectCache = null;
      const r = this.svgRect();
      if (!r.width || !r.height) return;
      this.drawSvgBounds();          // the whole-wiki box depends on the width (topic names), so work it out again
      if (!this.vb) { this.apply(true); return; }
      if (this.userView) { this.setVb(this.vb); return; }
      this.glide(this.fitBox(), false);
    }, 140);
  }

  drawCrumbs(tkey, focus) {
    const c = this.crumbs;
    c.empty();
    const step = (text, fn, last) => {
      const s = c.createSpan({ cls: "cm-at-crumb" + (last ? " is-last" : ""), text });
      if (!last) { s.setAttr("role", "button"); s.setAttr("tabindex", "0"); s.addEventListener("click", fn); s.addEventListener("keydown", (e) => { if (e.key === "Enter") fn(); }); }
    };
    const levels = [["Wiki", () => { this.st.topic = null; this.st.focus = null; this.apply(); }]];
    if (tkey !== null && tkey !== undefined) levels.push([this.topicName(tkey), () => { this.st.topic = tkey; this.st.focus = null; this.apply(); }]);
    if (focus) levels.push([focus.name, () => {}]);
    levels.forEach(([t, fn], i) => { if (i) c.createSpan({ cls: "cm-at-sep", text: "›" }); step(t, fn, i === levels.length - 1); });
  }

  /* ---------- side panel ---------- */

  stateBar(parent, paths) {
    const n = { verified: 0, rereview: 0, draft: 0, "": 0 };
    paths.forEach((p) => { n[this.data.nodes.get(p).state]++; });
    const bar = parent.createDiv({ cls: "cm-at-sbar" });
    for (const s of ["verified", "rereview", "draft", ""]) if (n[s]) { const seg = bar.createSpan(); seg.style.flexGrow = String(n[s]); seg.style.background = STATE_COLORS[s]; seg.setAttr("title", `${STATE_LABELS[s]}: ${n[s]}`); }
    const txt = parent.createDiv({ cls: "cm-at-snums" });
    for (const s of ["verified", "rereview", "draft", ""]) if (n[s]) { const t = txt.createSpan(); t.createSpan({ cls: "cm-at-keydot" }).style.background = STATE_COLORS[s]; t.appendText(`${n[s]} ${STATE_LABELS[s].toLowerCase()}`); }
  }
  pageRow(parent, path, extra) {
    const n = this.data.nodes.get(path);
    const row = parent.createDiv({ cls: "cm-at-row", attr: { role: "button", tabindex: "0" } });
    row.createSpan({ cls: "cm-at-keydot" }).style.background = STATE_COLORS[n.state];
    row.createSpan({ cls: "cm-at-row-name", text: n.name });
    if (extra !== undefined) row.createSpan({ cls: "cm-at-row-num", text: String(extra) });
    const fn = (e) => { if (e && (e.ctrlKey || e.metaKey)) { this.go(path, true); return; } this.st.focus = path; this.apply(); };
    row.addEventListener("click", fn);
    row.addEventListener("keydown", (e) => { if (e.key === "Enter") fn(e); });
    return row;
  }
  topicRow(parent, key, num) {
    const row = parent.createDiv({ cls: "cm-at-row", attr: { role: "button", tabindex: "0" } });
    row.createSpan({ cls: "cm-at-ring" + (key < 0 ? " is-none" : "") });
    row.createSpan({ cls: "cm-at-row-name", text: this.topicName(key) });
    if (num !== undefined) row.createSpan({ cls: "cm-at-row-num", text: String(num) });
    const fn = () => { this.st.topic = key; this.st.focus = null; this.apply(); };
    row.addEventListener("click", fn);
    row.addEventListener("keydown", (e) => { if (e.key === "Enter") fn(); });
    return row;
  }
  h(parent, text) { parent.createDiv({ cls: "cm-at-h", text }); }

  drawSide(tkey, focus) {
    const el = this.side, d = this.data;
    el.empty();
    el.scrollTop = 0;
    if (focus) return this.sidePage(el, focus);
    if (tkey !== null && tkey !== undefined) return this.sideTopic(el, tkey);
    el.createDiv({ cls: "cm-at-side-title", text: "The Coppermind" });
    const typed = d.edges.filter((e) => e.type !== "see").length;
    el.createDiv({ cls: "cm-sub", text: `${d.nodes.size} pages · ${d.edges.length} links (${typed} typed) · ${d.topics.length} topics` });
    this.stateBar(el, [...d.nodes.keys()]);
    if (!d.hasFile) el.createDiv({ cls: "cm-at-warn", text: `There is no ${TOPICS_PATH} yet, so every page is under "No topic yet". Edit topics makes it.` });
    if (d.missing.length) {
      const w = el.createDiv({ cls: "cm-at-warn" });
      w.createDiv({ text: `Anchors in ${TOPICS_PATH} that aren't pages:` });
      d.missing.forEach(([t, name]) => w.createDiv({ cls: "cm-at-warn-item", text: `${name} (${t})` }));
    }
    if (d.topics.length) this.h(el, "Topics");
    d.groups.filter((g) => g.key >= 0).forEach((g) => this.topicRow(el, g.key, g.members.length));
    d.topics.forEach((t, i) => { if (!this.group(i)) el.createDiv({ cls: "cm-at-row is-empty", text: `${t.name}: no pages found` }); });
    const none = this.group(-1);
    if (none) { this.h(el, "Not in a topic"); this.topicRow(el, -1, none.members.length); el.createDiv({ cls: "cm-sub", text: "Pages with no path of links to any anchor. List one as an anchor to give it a topic." }); }
  }

  sideTopic(el, key) {
    const d = this.data, g = this.group(key);
    if (!g) return;
    const t = key >= 0 ? d.topics[key] : null;
    el.createDiv({ cls: "cm-at-side-title", text: this.topicName(key) });
    if (t && t.desc) el.createDiv({ cls: "cm-at-desc", text: t.desc });
    const inside = d.edges.filter((e) => d.topic.get(e.from) === key && d.topic.get(e.to) === key).length;
    let across = 0;
    const per = new Map();
    for (const [k, n] of d.pairs) { const [a, b] = k.split("|").map(Number); if (a === key || b === key) { const o = a === key ? b : a; per.set(o, n); across += n; } }
    el.createDiv({ cls: "cm-sub", text: `${g.members.length} pages · ${inside} links inside · ${across} to other topics` });
    this.stateBar(el, g.members);
    if (t) {
      const anchors = g.members.filter((p) => d.anchorSet.has(p));
      if (anchors.length) { this.h(el, "Anchors"); anchors.forEach((p) => this.pageRow(el, p)); }
    }
    this.h(el, "Most linked");
    [...g.members].sort((a, b) => d.nodes.get(b).inDeg - d.nodes.get(a).inDeg).slice(0, 8).forEach((p) => this.pageRow(el, p, d.nodes.get(p).inDeg));
    const linked = [...per].sort((a, b) => b[1] - a[1]);
    if (linked.length) { this.h(el, "Linked topics"); linked.slice(0, 6).forEach(([o, n]) => this.topicRow(el, o, n)); }
    if (key >= 0) {
      const none = d.groups.filter((x) => x.key >= 0 && x.key !== key && !per.has(x.key));
      if (none.length) { this.h(el, "No links with"); const w = el.createDiv({ cls: "cm-at-chips" }); none.forEach((x) => { const c = w.createSpan({ cls: "cm-at-chip", text: this.topicName(x.key), attr: { role: "button", tabindex: "0" } }); c.addEventListener("click", () => { this.st.topic = x.key; this.apply(); }); }); }
      // pages nearly as close to another topic: candidates for an anchor there, or for a link
      const lean = [];
      for (const p of g.members) {
        if (d.anchorSet.has(p)) continue;
        const row = d.score.get(p);
        if (!row) continue;
        let o = -1, ov = 0;
        row.forEach((v, i) => { if (i !== key && v > ov) { ov = v; o = i; } });
        if (o >= 0 && row[key] > 0 && ov / row[key] >= 0.75) lean.push([p, o, ov / row[key]]);
      }
      if (lean.length) {
        this.h(el, "Almost in another topic");
        lean.sort((a, b) => b[2] - a[2]).slice(0, 6).forEach(([p, o]) => { const r = this.pageRow(el, p); r.createSpan({ cls: "cm-at-row-num", text: `→ ${clip(this.topicName(o), 18)}` }); });
      }
    } else el.createDiv({ cls: "cm-sub cm-at-pad", text: "These pages link to nothing that leads to an anchor. Add links, or list one as an anchor in a topic." });
  }

  sidePage(el, n) {
    const d = this.data;
    el.createDiv({ cls: "cm-at-side-title", text: n.name });
    const meta = el.createDiv({ cls: "cm-at-meta" });
    meta.createSpan({ cls: "cm-at-tag", text: n.type || "page" });
    if (n.state) meta.createSpan({ cls: `cm-rel-status cm-rel-${n.state}`, text: STATE_LABELS[n.state] });
    const key = d.topic.get(n.path);
    const tl = el.createDiv({ cls: "cm-sub cm-at-pad" });
    tl.appendText(d.anchorSet.has(n.path) ? "Anchor of " : "In ");
    const tlink = tl.createSpan({ cls: "cm-at-inlink", text: this.topicName(key), attr: { role: "button", tabindex: "0" } });
    tlink.addEventListener("click", () => { this.st.focus = null; this.st.topic = key; this.apply(); });
    const row = d.score.get(n.path);
    if (row && key >= 0) {
      let o = -1, ov = 0;
      row.forEach((v, i) => { if (i !== key && v > ov) { ov = v; o = i; } });
      if (o >= 0 && ov >= 0.2) tl.appendText(` · also close to ${this.topicName(o)}`);
    }
    const btns = el.createDiv({ cls: "cm-at-btns" });
    const open = btns.createEl("button", { cls: "mod-cta cm-gbtn", text: "Open page" });
    open.addEventListener("click", (e) => this.go(n.path, e.ctrlKey || e.metaKey));
    el.createDiv({ cls: "cm-sub", text: `${n.out.length} links out · ${n.inn.length} in` });
    for (const [dir, list, other] of [["out", n.out, (e) => e.to], ["inn", n.inn, (e) => e.from]]) {
      for (const t of Object.keys(LINK_TYPES)) {
        const items = list.filter((e) => e.type === t);
        if (!items.length) continue;
        const grp = el.createDiv({ cls: "cm-at-lgroup" });
        const lab = grp.createDiv({ cls: "cm-at-lhead" });
        const sw = lab.createSpan({ cls: "cm-rel-swatch" });
        sw.style.background = LINK_TYPES[t].color; sw.style.setProperty("--c", LINK_TYPES[t].color);
        if (LINK_TYPES[t].dash) sw.addClass("is-dashed");
        lab.appendText(`${LINK_TYPES[t][dir]} (${items.length})`);
        const w = grp.createDiv({ cls: "cm-at-chips" });
        const names = items.map(other).sort((a, b) => d.nodes.get(a).name.localeCompare(d.nodes.get(b).name));
        names.slice(0, 24).forEach((p) => {
          const c = w.createSpan({ cls: "cm-at-chip", text: d.nodes.get(p).name, attr: { role: "button", tabindex: "0" } });
          c.style.setProperty("--c", STATE_COLORS[d.nodes.get(p).state]);
          c.addEventListener("click", (e) => { if (e.ctrlKey || e.metaKey) { this.go(p, true); return; } this.st.focus = p; this.apply(); });
        });
        if (names.length > 24) w.createSpan({ cls: "cm-sub", text: `+${names.length - 24} more` });
      }
    }
  }
}

