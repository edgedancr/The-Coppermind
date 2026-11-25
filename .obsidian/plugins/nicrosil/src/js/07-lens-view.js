/* ---------- The Lens (the relations panel) ---------- */

/** The Lens's map in a large window, with every page (opened by the Enlarge button). */
class RelationsMapModal extends Modal {
  constructor(app, view, file, out, inn) { super(app); this.view = view; this.file = file; this.out = out; this.inn = inn; }
  onOpen() {
    this.modalEl.addClass("cm-rel-modal");
    this.titleEl.setText(`Lens: ${this.file.basename}`);
    this.view.bigModal = this;
    this.view.drawMap(this.contentEl, this.file, this.out, this.inn, true);
    this.view.drawLegend(this.contentEl, this.out, this.inn);
  }
  onClose() { if (this.view.bigModal === this) this.view.bigModal = null; this.contentEl.empty(); }
}

/**
 * The Lens (Alt+L, 3.29.0; the relations panel before): the open page's neighborhood. A map with the pages that link to it
 * on the left and the pages it links to on the right, typed links first and then plain links; its topic on the atlas;
 * pages two steps away that it doesn't link with yet; and the trail of pages opened while it was open.
 */
class RelationsView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.file = null;
    this.trail = [];
    this.token = 0;
    this.rerender = debounce(() => this.render(), 400, true);
  }
  getViewType() { return REL_VIEW_TYPE; }
  getDisplayText() { return "Lens"; }
  getIcon() { return "git-fork"; }
  async onOpen() {
    this.setFile(this.plugin.currentFile());
    this.registerEvent(this.app.workspace.on("file-open", (f) => { if (f) this.setFile(f); }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
      const f = this.plugin.currentFile();
      if (f && (!this.file || f.path !== this.file.path)) this.setFile(f);
    }));
    this.registerEvent(this.app.metadataCache.on("changed", () => this.rerender()));
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.rerender()));
    this.registerEvent(this.app.vault.on("rename", (f, old) => { this.trail = this.trail.map((p) => (p === old ? f.path : p)); this.rerender(); }));
    this.registerEvent(this.app.vault.on("delete", (f) => { this.trail = this.trail.filter((p) => p !== f.path); this.rerender(); }));
  }
  async onClose() { this.containerEl.children[1].empty(); }

  setFile(f) {
    this.file = f;
    if (f && inLinkScope(f.path)) {
      this.trail = this.trail.filter((p) => p !== f.path);
      this.trail.push(f.path);
      if (this.trail.length > 8) this.trail.shift();
    }
    this.render();
  }

  go(path, newTab) {
    if (!path) return;
    if (this.bigModal) this.bigModal.close();
    if (!newTab) { this.plugin.openFile(path); return; }
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof TFile) this.app.workspace.getLeaf(true).openFile(f);
  }

  stateOf(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    return f instanceof TFile ? pageState((this.app.metadataCache.getFileCache(f) || {}).frontmatter) : "";
  }
  nameOf(path) { return this.app.vault.getAbstractFileByPath(path)?.basename || String(path).replace(/^.*\//, "").replace(/\.md$/, ""); }

  async render() {
    const token = ++this.token;
    const file = this.file && this.app.vault.getAbstractFileByPath(this.file.path) instanceof TFile ? this.file : null;
    let atlas = null;
    if (file && inAtlasScope(file.path)) { try { atlas = await this.plugin.atlas(); } catch (e) { console.error("Nicrosil: atlas", e); } }
    if (token !== this.token) return; // a newer render started while this one waited
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("cm-rel");
    if (!file) { root.createDiv({ cls: "cm-sub", text: "Open a page to see its neighborhood in the wiki." }); return; }
    if (!inLinkScope(file.path)) {
      root.createDiv({ cls: "cm-rel-title", text: file.basename });
      root.createDiv({ cls: "cm-sub cm-rel-empty", text: "The Lens shows wiki pages, perspectives and source cards." });
      return;
    }

    const edges = collectLinks(this.app);
    this.inDeg = new Map();
    for (const e of edges) this.inDeg.set(e.to, (this.inDeg.get(e.to) || 0) + 1);
    const out = edges.filter((e) => e.from === file.path);
    const inn = edges.filter((e) => e.to === file.path);

    this.drawTrail(root, file);
    const head = root.createDiv({ cls: "cm-rel-head" });
    head.createDiv({ cls: "cm-rel-title", text: file.basename });
    const meta = head.createDiv({ cls: "cm-rel-meta" });
    const st = this.stateOf(file.path);
    if (st) meta.createSpan({ cls: `cm-rel-status cm-rel-${st}`, text: STATE_LABELS[st] });
    if (atlas) {
      const ti = atlas.topic.get(file.path);
      const name = ti === undefined ? null : ti < 0 ? "No topic yet" : atlas.topics[ti].name;
      if (name) {
        const chip = meta.createSpan({ cls: "cm-rel-topic", text: name, attr: { role: "button", tabindex: "0", "aria-label": `Show ${file.basename} in the atlas` } });
        const show = () => this.plugin.activateWikiMap({ focus: file.path });
        chip.addEventListener("click", show);
        chip.addEventListener("keydown", (e) => { if (e.key === "Enter") show(); });
      }
    }
    const typedN = (l) => l.filter((e) => e.type !== "see").length;
    head.createDiv({ cls: "cm-sub", text: `${out.length} out (${typedN(out)} typed) · ${inn.length} in (${typedN(inn)} typed)` });

    if (!out.length && !inn.length) {
      root.createDiv({ cls: "cm-sub cm-rel-empty", text: "No links to or from this page yet." });
    } else {
      this.drawMap(root, file, out, inn);
      this.drawLegend(root, out, inn);
    }
    if (atlas) this.drawSuggestions(root, file, atlas);
    this.drawGroups(root, "This page…", out, "out", (e) => e.to);
    this.drawGroups(root, "Pointing at this page…", inn, "inn", (e) => e.from);
  }

  /** The pages opened before this one while the Lens was open, oldest first; click one to go back to it. */
  drawTrail(root, file) {
    const prev = this.trail.filter((p) => p !== file.path && this.app.vault.getAbstractFileByPath(p)).slice(-5);
    if (!prev.length) return;
    const row = root.createDiv({ cls: "cm-rel-trail" });
    row.createSpan({ cls: "cm-rel-trail-label", text: "Trail" });
    prev.forEach((p) => {
      const c = row.createSpan({ cls: "cm-rel-trail-step", text: clip(this.nameOf(p), 22), attr: { role: "button", tabindex: "0", title: this.nameOf(p) } });
      c.addEventListener("click", (e) => this.go(p, e.ctrlKey || e.metaKey));
      c.addEventListener("keydown", (e) => { if (e.key === "Enter") this.go(p, e.ctrlKey || e.metaKey); });
    });
  }

  /** Neighbors on one side, one per page, each keeping the types that link it: typed links first, then the most-linked pages. */
  neighbors(list, key) {
    const map = new Map();
    for (const e of list) {
      const id = key(e);
      if (!map.has(id)) map.set(id, { path: id, name: this.nameOf(id), types: [] });
      const n = map.get(id);
      if (!n.types.includes(e.type)) n.types.push(e.type);
    }
    const typed = (n) => n.types.some((t) => t !== "see");
    return [...map.values()].sort((a, b) => typed(b) - typed(a) || (this.inDeg.get(b.path) || 0) - (this.inDeg.get(a.path) || 0) || a.name.localeCompare(b.name));
  }

  drawMap(root, file, out, inn, big = false) {
    const LIMIT = 6;
    const MAX = big ? Infinity : LIMIT;
    const L = this.neighbors(inn, (e) => e.from);
    const R = this.neighbors(out, (e) => e.to);
    const Ls = L.slice(0, MAX), Rs = R.slice(0, MAX);
    const NW = 100, NH = 26, GAP = 10, CW = 100, X1 = 0, X2 = 136, X3 = 272, W = 372;
    const extra = (L.length > MAX || R.length > MAX) ? 1 : 0;
    const rows = Math.max(Ls.length, Rs.length, 1) + extra;
    const H = rows * (NH + GAP) + GAP;
    const cy = H / 2;
    const wrap = root.createDiv({ cls: "cm-rel-map" });
    const svg = svgEl(wrap, "svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": `Lens map for ${file.basename}` });
    svg.classList.add("cm-rel-svg");
    const defs = svgEl(svg, "defs");
    const cg = svgEl(defs, "linearGradient", { id: "cm-rel-cg", x1: 0, y1: 0, x2: 0, y2: 1 });
    svgEl(cg, "stop", { offset: "0%", style: "stop-color: var(--cm-copper); stop-opacity: .42" });
    svgEl(cg, "stop", { offset: "100%", style: "stop-color: var(--cm-copper); stop-opacity: .12" });
    const ng = svgEl(defs, "linearGradient", { id: "cm-rel-ng", x1: 0, y1: 0, x2: 0, y2: 1 });
    svgEl(ng, "stop", { offset: "0%", style: "stop-color: var(--background-secondary); stop-opacity: 1" });
    svgEl(ng, "stop", { offset: "100%", style: "stop-color: var(--background-primary); stop-opacity: 1" });
    // the open page's outline: the copper-to-teal gradient used on the file-list button
    const og = svgEl(defs, "linearGradient", { id: "cm-rel-og", x1: 0, y1: 0, x2: 1, y2: 1 });
    svgEl(og, "stop", { offset: "0%", style: "stop-color: #e89a5a" });
    svgEl(og, "stop", { offset: "100%", style: "stop-color: #86d2c1" });
    for (const [t, info] of Object.entries(LINK_TYPES)) {
      const m = svgEl(defs, "marker", { id: `cm-arrow-${t}`, viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
      svgEl(m, "path", { d: "M0,0 L8,4 L0,8 z", fill: info.color });
    }
    const yFor = (i, n) => GAP + i * (NH + GAP) + ((rows - n - extra) * (NH + GAP)) / 2;

    const edgePath = (x1, y1, x2, y2) => `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
    const edgeEls = {};
    const drawEdges = (side, nodes, n) => {
      nodes.forEach((nd, i) => {
        const y = yFor(i, n) + NH / 2;
        nd.types.forEach((t, k) => {
          const info = LINK_TYPES[t];
          const off = (k - (nd.types.length - 1) / 2) * 4;
          const attrs = { fill: "none", stroke: info.color, "stroke-width": 1.6, "stroke-opacity": t === "see" ? 0.6 : 0.9, "marker-end": `url(#cm-arrow-${t})` };
          if (info.dash) attrs["stroke-dasharray"] = info.dash;
          const d = side === "out" ? edgePath(X2 + CW, cy + off, X3 - 1, y + off) : edgePath(X1 + NW, y + off, X2 - 1, cy + off);
          const p = svgEl(svg, "path", { ...attrs, d, class: "cm-rel-edge" + (t === "see" ? " is-see" : "") });
          p.style.setProperty("--c", info.color);
          (edgeEls[side + i] = edgeEls[side + i] || []).push(p);
        });
      });
    };
    drawEdges("inn", Ls, Ls.length);
    drawEdges("out", Rs, Rs.length);

    const node = (x, y, w, nd, key) => {
      const g = svgEl(svg, "g", { class: "cm-rel-node", tabindex: 0, role: "button" });
      const hot = (on) => {
        svg.classList.toggle("is-hovering", on); g.classList.toggle("is-hl", on);
        (edgeEls[key] || []).forEach((el) => el.classList.toggle("is-hl", on));
        // light up this page's link types in the legend under the map
        root.querySelectorAll(".cm-rel-chip").forEach((c) => c.classList.toggle("is-hl", on && nd.types.includes(c.getAttribute("data-type"))));
      };
      g.addEventListener("mouseenter", () => hot(true)); g.addEventListener("mouseleave", () => hot(false));
      g.addEventListener("focus", () => hot(true)); g.addEventListener("blur", () => hot(false));
      const st = this.stateOf(nd.path);
      svgEl(g, "rect", { x, y, width: w, height: NH, rx: 5, class: `cm-rel-box ${st ? "cm-rel-box-" + st : ""}` });
      svgEl(g, "text", { x: x + w / 2, y: y + NH / 2 + 4, "text-anchor": "middle", class: "cm-rel-label" }, clip(nd.name, 16));
      svgEl(g, "title", {}, `${nd.name} (${nd.types.map(linkLabel).join(", ")})`);
      g.addEventListener("click", (e) => this.go(nd.path, e.ctrlKey || e.metaKey));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter") this.go(nd.path, e.ctrlKey || e.metaKey); });
    };
    Ls.forEach((nd, i) => node(X1, yFor(i, Ls.length), NW, nd, "inn" + i));
    Rs.forEach((nd, i) => node(X3, yFor(i, Rs.length), NW, nd, "out" + i));
    const ch = Math.min(H - 2 * GAP, 56);
    const g = svgEl(svg, "g", { class: "cm-rel-node is-center" });
    svgEl(g, "rect", { x: X2, y: cy - ch / 2, width: CW, height: ch, rx: 7, class: "cm-rel-box cm-rel-box-center" });
    const words = file.basename.split(" "); const lines = []; let cur = "";
    for (const w of words) { if ((cur + " " + w).trim().length > 15 && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
    if (cur) lines.push(cur);
    const shown = lines.slice(0, 3);
    shown.forEach((ln, i) => svgEl(g, "text", { x: X2 + CW / 2, y: cy - ((shown.length - 1) * 6.5) + i * 13 + 4, "text-anchor": "middle", class: "cm-rel-label cm-rel-center-label" }, clip(ln, 16)));
    svgEl(g, "title", {}, file.basename);
    if (extra) svgEl(svg, "text", { x: W / 2, y: H - 4, "text-anchor": "middle", class: "cm-rel-more" }, `${L.length > MAX ? L.length - MAX + " more in" : ""}${L.length > MAX && R.length > MAX ? " · " : ""}${R.length > MAX ? R.length - MAX + " more out" : ""} (Enlarge to see all)`);
    if (!big) {
      const btn = root.createEl("button", { cls: "mod-cta cm-gbtn cm-rel-expand", text: "Enlarge" });
      btn.addEventListener("click", () => new RelationsMapModal(this.app, this, file, out, inn).open());
    }
  }

  drawLegend(root, out, inn) {
    const present = Object.keys(LINK_TYPES).filter((t) => out.concat(inn).some((e) => e.type === t));
    const lg = root.createDiv({ cls: "cm-rel-legend" });
    present.forEach((t) => {
      const chip = lg.createSpan({ cls: "cm-rel-chip" });
      chip.setAttr("data-type", t); chip.style.setProperty("--c", LINK_TYPES[t].color);
      const sw = chip.createSpan({ cls: "cm-rel-swatch" });
      sw.style.background = LINK_TYPES[t].color; sw.style.setProperty("--c", LINK_TYPES[t].color);
      if (LINK_TYPES[t].dash) sw.addClass("is-dashed");
      chip.appendText(linkLabel(t));
    });
  }

  /** Pages two steps away that this page doesn't link with: each is linked with at least two of its neighbors. */
  drawSuggestions(root, file, atlas) {
    const skip = (id) => { const n = atlas.nodes.get(id); return !n || ["summary", "guide", "prompt"].includes(n.type); };
    const list = suggestLinks(file.path, atlas.adj, { skip, limit: 6 });
    root.createEl("h5", { cls: "cm-rel-h", text: "Two steps away, not linked yet" });
    if (!list.length) { root.createDiv({ cls: "cm-sub cm-rel-sugg-none", text: "None: no page is linked with two of this page's neighbors without being linked with it." }); return; }
    const box = root.createDiv({ cls: "cm-rel-group cm-rel-sugg" });
    list.forEach((s) => {
      const row = box.createDiv({ cls: "cm-rel-item", attr: { role: "button", tabindex: "0" } });
      const st = this.stateOf(s.id);
      row.createSpan({ cls: `cm-rel-dot ${st ? "cm-rel-dot-" + st : ""}` });
      const txt = row.createDiv({ cls: "cm-rel-sugg-text" });
      txt.createSpan({ cls: "cm-rel-name", text: this.nameOf(s.id) });
      const via = s.via.map((p) => this.nameOf(p));
      txt.createSpan({ cls: "cm-rel-via", text: `via ${via.slice(0, 2).join(", ")}${via.length > 2 ? ` +${via.length - 2}` : ""}` });
      row.setAttr("title", `Linked with ${via.length} of this page's neighbors: ${via.join(", ")}`);
      row.addEventListener("click", (e) => this.go(s.id, e.ctrlKey || e.metaKey));
      row.addEventListener("keydown", (e) => { if (e.key === "Enter") this.go(s.id, e.ctrlKey || e.metaKey); });
    });
  }

  drawGroups(root, title, list, dir, key) {
    if (!list.length) return;
    root.createEl("h5", { cls: "cm-rel-h", text: title });
    for (const t of Object.keys(LINK_TYPES)) {
      const items = this.neighbors(list.filter((e) => e.type === t), key);
      if (!items.length) continue;
      // plain links can run long, so a long list starts folded
      const grp = t === "see" ? root.createEl("details", { cls: "cm-rel-group cm-rel-see" }) : root.createDiv({ cls: "cm-rel-group" });
      if (t === "see") grp.open = items.length <= 8;
      const h = t === "see" ? grp.createEl("summary", { cls: "cm-rel-grouphead" }) : grp.createDiv({ cls: "cm-rel-grouphead" });
      const sw = h.createSpan({ cls: "cm-rel-swatch" });
      sw.style.background = LINK_TYPES[t].color; sw.style.setProperty("--c", LINK_TYPES[t].color);
      if (LINK_TYPES[t].dash) sw.addClass("is-dashed");
      h.appendText(LINK_TYPES[t][dir]);
      h.createSpan({ cls: "cm-rel-count", text: String(items.length) });
      items.sort((a, b) => a.name.localeCompare(b.name)).forEach((it) => {
        const row = grp.createDiv({ cls: "cm-rel-item" });
        const st = this.stateOf(it.path);
        row.createSpan({ cls: `cm-rel-dot ${st ? "cm-rel-dot-" + st : ""}` }).setAttr("aria-label", STATE_LABELS[st]);
        row.createSpan({ cls: "cm-rel-name", text: it.name });
        row.setAttr("role", "button"); row.setAttr("tabindex", "0");
        row.addEventListener("click", (e) => this.go(it.path, e.ctrlKey || e.metaKey));
        row.addEventListener("keydown", (e) => { if (e.key === "Enter") this.go(it.path, e.ctrlKey || e.metaKey); });
      });
    }
  }
}

