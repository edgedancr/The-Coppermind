/* ---------- Connections: a folding section on each page showing its links (4.9.0) ---------- */

/** The heading a page's footnotes sit under. Connections goes just above it, or at the end of a page without one. */
const FOOTNOTES_HEADING = /^#{1,6}\s+Footnotes\s*$/i;

/**
 * Connections (4.9.0): the page's links drawn inside the page, above its Footnotes heading. Folded, it is
 * one line with the link counts and the page's biggest typed-link groups. Open, it shows the legend, the map and Enlarge,
 * then three folded lists: pages two steps away, the pages this one links to and the pages that link to it. Nicrosil
 * draws it from the links and typed links, so nothing is written into the page. Reading view adds it with a
 * post-processor (`addPageLens`), Live Preview with an editor widget (`pageLensEditorExtension`). Folding or opening it
 * on one page does the same on every page, and the choice is kept (`settings.pageLensOpen`).
 */
class PageLens extends MarkdownRenderChild {
  constructor(el, plugin, path) {
    super(el);
    this.plugin = plugin;
    this.app = plugin.app;
    this.path = path;
    this.token = 0;
    this.sig = null;
    this.cleanups = []; // stops the map's zoom watcher and animation when the section is redrawn or removed
    this.rerender = debounce(() => this.render(), 600, true);
  }
  onload() {
    this.containerEl.addClass("cm-plens");
    this.plugin.pageLenses.add(this);
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.rerender()));
    this.registerEvent(this.app.vault.on("rename", (f, old) => { if (old === this.path) this.path = f.path; this.rerender(); }));
    this.render();
    // a page shown inside another (an embed or a hover preview) doesn't get its own Connections
    window.requestAnimationFrame(() => {
      if (this.containerEl.closest(".hover-popover, .popover, .markdown-embed")) this.containerEl.addClass("is-hidden");
    });
  }
  onunload() {
    this.plugin.pageLenses.delete(this);
    this.runCleanups();
    this.containerEl.empty();
  }
  runCleanups() { this.cleanups.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* already gone */ } }); }

  setOpen(open) {
    this.plugin.settings.pageLensOpen = open;
    this.plugin.persist();
    this.plugin.refreshPageLenses();
  }

  render() {
    const token = ++this.token;
    const root = this.containerEl;
    const f = this.app.vault.getAbstractFileByPath(this.path);
    const file = f instanceof TFile && inLinkScope(f.path) && this.plugin.settings.pageLens !== false ? f : null;
    if (!file) { this.runCleanups(); root.empty(); this.sig = null; return; }

    const edges = collectLinks(this.app);
    const out = edges.filter((e) => e.from === file.path);
    const inn = edges.filter((e) => e.to === file.path);
    const open = !!this.plugin.settings.pageLensOpen;
    const near = [...new Set(out.map((e) => e.to).concat(inn.map((e) => e.from)))];
    // redraw only when something it shows changed (the metadata cache settles after every keystroke)
    const sig = JSON.stringify([file.path, open, out, inn, near.map((p) => this.stateOf(p))]);
    if (sig === this.sig) return;
    this.sig = sig;
    this.inDeg = new Map();
    for (const e of edges) this.inDeg.set(e.to, (this.inDeg.get(e.to) || 0) + 1);

    this.runCleanups();
    root.empty();
    root.toggleClass("is-open", open);
    const head = root.createDiv({ cls: "cm-plens-head", attr: { role: "button", tabindex: "0", "aria-expanded": String(open), "aria-label": open ? "Fold Connections" : "Show Connections" } });
    setIcon(head.createSpan({ cls: "cm-plens-chev" }), open ? "chevron-down" : "chevron-right");
    head.createSpan({ cls: "cm-plens-title", text: "Connections" });
    const typedN = (l) => l.filter((e) => e.type !== "see").length;
    head.createSpan({ cls: "cm-plens-count", text: `${out.length} out (${typedN(out)} typed) · ${inn.length} in (${typedN(inn)} typed)` });
    if (!open) {
      // the two biggest typed-link groups, so a folded section still says something about the page
      const groups = [];
      for (const [list, dir, key] of [[out, "out", (e) => e.to], [inn, "inn", (e) => e.from]]) {
        for (const t of Object.keys(REL_TYPES)) {
          const n = new Set(list.filter((e) => e.type === t).map(key)).size;
          if (n) groups.push({ t, dir, n });
        }
      }
      const chips = head.createSpan({ cls: "cm-plens-chips" });
      groups.sort((a, b) => b.n - a.n).slice(0, 2).forEach((g) => {
        const c = chips.createSpan({ cls: "cm-plens-chip", text: `${LINK_TYPES[g.t][g.dir]} ${g.n}` });
        c.style.setProperty("--c", LINK_TYPES[g.t].color);
      });
    }
    const toggle = (e) => { e.preventDefault(); e.stopPropagation(); this.setOpen(!open); };
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") toggle(e); });
    if (!open) return;

    const body = root.createDiv({ cls: "cm-plens-body cm-rel" });
    if (!out.length && !inn.length) body.createDiv({ cls: "cm-sub cm-rel-empty", text: "No links to or from this page yet." });
    else { this.drawLegend(body, out, inn); this.drawMap(body, file, out, inn); }

    if (inAtlasScope(file.path)) {
      const s = this.section(body, "Two steps away, not linked yet", null);
      this.plugin.atlas().then((atlas) => {
        if (token !== this.token) return;
        this.drawSuggestions(s.box, file, atlas);
        this.dropHeadings(s.box);
        s.count.setText(String(s.box.querySelectorAll(".cm-rel-item").length));
      }).catch((e) => { console.error("Nicrosil: atlas", e); s.el.remove(); });
    }
    if (out.length) {
      const s = this.section(body, "This page links to", new Set(out.map((e) => e.to)).size);
      this.drawGroups(s.box, "", out, "out", (e) => e.to);
      this.dropHeadings(s.box);
    }
    if (inn.length) {
      const s = this.section(body, "Pointing at this page", new Set(inn.map((e) => e.from)).size);
      this.drawGroups(s.box, "", inn, "inn", (e) => e.from);
      this.dropHeadings(s.box);
    }
  }

  /* the map, its legend and lists, and opening a page */
  go(path, newTab) {
    if (!path) return;
    if (!newTab) { this.plugin.openFile(path); return; }
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof TFile) this.app.workspace.getLeaf(true).openFile(f);
  }

  stateOf(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    return f instanceof TFile ? pageState((this.app.metadataCache.getFileCache(f) || {}).frontmatter) : "";
  }
  nameOf(path) { return this.app.vault.getAbstractFileByPath(path)?.basename || String(path).replace(/^.*\//, "").replace(/\.md$/, ""); }

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

  /** The map: the pages linking in on the left, the pages this one links to on the right, every one of them, wide enough to fill the page's column; zoomable. */
  drawMap(root, file, out, inn) {
    const L = this.neighbors(inn, (e) => e.from);
    const R = this.neighbors(out, (e) => e.to);
    const Ls = L, Rs = R;
    const NW = 190, NH = 28, GAP = 12, CW = 210, GX = 150;
    const X1 = 0, X2 = NW + GX, X3 = X2 + CW + GX, W = X3 + NW;
    const rows = Math.max(Ls.length, Rs.length, 1);
    const H = rows * (NH + GAP) + GAP;
    const cy = H / 2;
    const wrap = root.createDiv({ cls: "cm-rel-map cm-rel-map-page" });
    wrap.style.aspectRatio = `${W} / ${H}`;
    const svg = svgEl(wrap, "svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": `Map of the links of ${file.basename}` });
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
    const yFor = (i, n) => GAP + i * (NH + GAP) + ((rows - n) * (NH + GAP)) / 2;

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
      svgEl(g, "text", { x: x + w / 2, y: y + NH / 2 + 4, "text-anchor": "middle", class: "cm-rel-label" }, clip(nd.name, 30));
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
    for (const w of words) { if ((cur + " " + w).trim().length > 24 && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
    if (cur) lines.push(cur);
    const shown = lines.slice(0, 3);
    shown.forEach((ln, i) => svgEl(g, "text", { x: X2 + CW / 2, y: cy - ((shown.length - 1) * 6.5) + i * 13 + 4, "text-anchor": "middle", class: "cm-rel-label cm-rel-center-label" }, clip(ln, 26)));
    svgEl(g, "title", {}, file.basename);
    this.enableMapZoom(wrap, svg, W, H);
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

  /**
   * Zoom and pan for the map (4.9.1). Ctrl+scroll (or a trackpad pinch) zooms at the pointer, a drag pans, the + and - buttons
   * zoom from the middle, and double-clicking the background or the fit button shows the whole map again. Zooming eases
   * over 160 ms. Plain scrolling is left alone so the page still scrolls past the map. The view is the SVG's viewBox, kept
   * at the box's own shape so the pointer maps straight onto it; while the map hasn't been zoomed it refits when the box resizes.
   */
  enableMapZoom(wrap, svg, W, H) {
    const MIN = 0.6, MAX = 8; // zoom, relative to showing the whole map
    let cur = null, tgt = null, anim = 0, fitted = true, drag = null, swallow = false;
    const fitView = () => {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const ar = r.width / r.height, w = Math.max(W, H * ar), h = w / ar;
      return { x: (W - w) / 2, y: (H - h) / 2, w, h };
    };
    const apply = (v) => { cur = v; svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`); };
    const jump = (v) => { cancelAnimationFrame(anim); apply(v); tgt = v; };
    const go = (v) => {
      if (!cur) return;
      cancelAnimationFrame(anim);
      const from = cur;
      let t0 = null; // the first frame's own timestamp, so the easing never depends on which clock started it
      tgt = v;
      const step = (now) => {
        if (t0 === null) t0 = now;
        const k = Math.min(1, (now - t0) / 160), e = 1 - Math.pow(1 - k, 3);
        apply({ x: from.x + (v.x - from.x) * e, y: from.y + (v.y - from.y) * e, w: from.w + (v.w - from.w) * e, h: from.h + (v.h - from.h) * e });
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    const showAll = () => { fitted = true; const f = fitView(); if (f) go(f); };
    const zoomAt = (factor, fx, fy) => {
      const fit = fitView(), base = tgt || cur;
      if (!fit || !base) return;
      const z = Math.min(MAX, Math.max(MIN, (fit.w / base.w) * factor));
      const w = fit.w / z, h = fit.h / z;
      fitted = false;
      go({ x: base.x + fx * (base.w - w), y: base.y + fy * (base.h - h), w, h });
    };

    const ro = new ResizeObserver(() => { if (fitted) { const f = fitView(); if (f) jump(f); } });
    ro.observe(svg);
    this.cleanups.push(() => { ro.disconnect(); cancelAnimationFrame(anim); });

    svg.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault(); e.stopPropagation();
      const r = svg.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022)), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    }, { passive: false });
    svg.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !(tgt || cur)) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, v: { ...(tgt || cur) }, on: false };
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.hypot(dx, dy) < 4) return; // a click on a page, not a drag
        drag.on = true; fitted = false;
        svg.setPointerCapture(e.pointerId);
        wrap.addClass("is-panning");
      }
      const r = svg.getBoundingClientRect(), v = drag.v;
      jump({ x: v.x - (dx / r.width) * v.w, y: v.y - (dy / r.height) * v.h, w: v.w, h: v.h });
    });
    const end = () => {
      if (!drag) return;
      if (drag.on) { wrap.removeClass("is-panning"); swallow = true; window.setTimeout(() => { swallow = false; }, 0); }
      drag = null;
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("click", (e) => { if (swallow) { e.preventDefault(); e.stopPropagation(); } }, true);
    svg.addEventListener("dblclick", (e) => { if (!e.target.closest || !e.target.closest(".cm-rel-node")) showAll(); });

    const ctl = wrap.createDiv({ cls: "cm-rel-zoom" });
    const btn = (icon, label, fn) => {
      const b = ctl.createEl("button", { attr: { "aria-label": label, title: label } });
      setIcon(b, icon);
      b.addEventListener("click", fn);
    };
    btn("plus", "Zoom in", () => zoomAt(1.5, 0.5, 0.5));
    btn("minus", "Zoom out", () => zoomAt(1 / 1.5, 0.5, 0.5));
    btn("maximize", "Show the whole map", showAll);
    wrap.createDiv({ cls: "cm-rel-zoomhint", text: "Ctrl + scroll to zoom · drag to pan" });
  }

  /** A folded list under the map; which ones are open is kept for the session, so a redraw doesn't fold them again. */
  section(body, title, n) {
    const el = body.createEl("details", { cls: "cm-plens-list" });
    el.open = this.plugin.pageLensLists.has(title);
    el.addEventListener("toggle", () => { if (el.open) this.plugin.pageLensLists.add(title); else this.plugin.pageLensLists.delete(title); });
    const sum = el.createEl("summary", { cls: "cm-plens-listhead" });
    sum.createSpan({ text: title });
    const count = sum.createSpan({ cls: "cm-rel-count", text: n == null ? "" : String(n) });
    const box = el.createDiv({ cls: "cm-plens-listbody" });
    return { el, box, count };
  }
  /** The lists' own headings; the folded list's summary line says the same. */
  dropHeadings(box) { box.querySelectorAll(":scope > h5.cm-rel-h").forEach((h) => h.remove()); }
}

/**
 * Live Preview's half of Connections: a block widget above the Footnotes heading line, or after the last line. The
 * widget keeps its section while you type (it is rebuilt only when the page or its place changes) and its clicks don't
 * move the cursor. Source mode has none.
 */
function pageLensEditorExtension(plugin) {
  let cmState, cmView;
  try { cmState = require("@codemirror/state"); cmView = require("@codemirror/view"); } catch (e) { return []; }
  const { StateField } = cmState;
  const { Decoration, EditorView, WidgetType } = cmView;

  class LensWidget extends WidgetType {
    constructor(path) { super(); this.path = path; }
    eq(other) { return other.path === this.path; }
    toDOM() {
      const el = document.createElement("div");
      el.className = "cm-plens-widget";
      const lens = new PageLens(el, plugin, this.path);
      el.cmLens = lens;
      lens.load();
      return el;
    }
    destroy(el) { if (el.cmLens) el.cmLens.unload(); }
    ignoreEvent() { return true; }
    get estimatedHeight() { return 44; }
  }

  const place = (state) => {
    if (plugin.settings.pageLens === false) return null;
    let live = false, file = null;
    try { live = state.field(editorLivePreviewField); } catch (e) { /* not a note editor */ }
    try { file = state.field(editorInfoField)?.file; } catch (e) { /* not a note editor */ }
    if (!live || !file || !inLinkScope(file.path)) return null;
    const doc = state.doc;
    for (let n = doc.lines; n >= 1; n--) {
      const line = doc.line(n);
      if (FOOTNOTES_HEADING.test(line.text)) return { path: file.path, pos: line.from, side: -1 };
    }
    return { path: file.path, pos: doc.length, side: 1 };
  };
  const build = (p) => ({
    p,
    deco: p ? Decoration.set([Decoration.widget({ widget: new LensWidget(p.path), block: true, side: p.side }).range(p.pos)]) : Decoration.none,
  });
  const field = StateField.define({
    create: (state) => build(place(state)),
    update(v, tr) {
      const p = place(tr.state);
      if (p && v.p && p.path === v.p.path && p.side === v.p.side && tr.changes.mapPos(v.p.pos, p.side) === p.pos) {
        return { p, deco: v.deco.map(tr.changes) };
      }
      if (!p && !v.p) return v;
      return build(p);
    },
    provide: (f) => EditorView.decorations.from(f, (v) => v.deco),
  });
  return [field];
}
