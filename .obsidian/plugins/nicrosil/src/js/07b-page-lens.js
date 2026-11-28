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
    else { this.drawMap(body, file, out, inn); }

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

  /**
   * The map (4.11): the pages linking in on the left and the pages this one links to on the right, grouped by link type. Each
   * group shows its busiest pages and folds the rest behind "+ N more", and a band as thick as the group runs to the open page.
   */
  drawMap(root, file, out, inn) {
    const wrap = root.createDiv({ cls: "cm-rb" });
    const svg = svgEl(wrap, "svg", { class: "cm-rb-svg", "aria-hidden": "true" });
    const bands = svgEl(svg, "g");
    const cols = wrap.createDiv({ cls: "cm-rb-cols" });
    const bandData = [];
    const column = (cls, list, dir, key) => {
      const col = cols.createDiv({ cls: `cm-rb-col ${cls}` });
      for (const t of Object.keys(LINK_TYPES)) {
        const items = this.neighbors(list.filter((e) => e.type === t), key);
        if (!items.length) continue;
        const info = LINK_TYPES[t];
        const grp = col.createDiv({ cls: "cm-rb-group" });
        grp.style.setProperty("--c", info.color);
        const h = grp.createDiv({ cls: "cm-rb-head" });
        const sw = h.createSpan({ cls: "cm-rel-swatch" });
        sw.style.background = info.color; sw.style.setProperty("--c", info.color);
        if (info.dash) sw.addClass("is-dashed");
        h.createSpan({ cls: "cm-rb-label", text: info[dir] });
        h.createSpan({ cls: "cm-rel-count", text: String(items.length) });
        const rows = grp.createDiv({ cls: "cm-rb-rows" });
        const key2 = `bundle:${dir}:${t}`;
        const lim = items.length <= 5 ? items.length : 4;
        const rowEls = items.map((it, i) => {
          const row = rows.createDiv({ cls: "cm-rb-row", attr: { role: "button", tabindex: "0", title: it.name } });
          const st = this.stateOf(it.path);
          row.createSpan({ cls: `cm-rel-dot ${st ? "cm-rel-dot-" + st : ""}` }).setAttr("aria-label", STATE_LABELS[st]);
          row.createSpan({ cls: "cm-rel-name", text: it.name });
          row.addEventListener("click", (e) => this.go(it.path, e.ctrlKey || e.metaKey));
          row.addEventListener("keydown", (e) => { if (e.key === "Enter") this.go(it.path, e.ctrlKey || e.metaKey); });
          return row;
        });
        if (items.length > lim) {
          const more = grp.createEl("button", { cls: "cm-rb-more" });
          const sync = () => {
            const open = this.plugin.pageLensLists.has(key2);
            rowEls.forEach((r, i) => r.toggleClass("is-hidden", !open && i >= lim));
            rows.toggleClass("is-open", open);
            more.setText(open ? "Show fewer" : `+ ${items.length - lim} more`);
          };
          more.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this.plugin.pageLensLists.has(key2)) this.plugin.pageLensLists.delete(key2); else this.plugin.pageLensLists.add(key2);
            sync(); layout();
          });
          sync();
        }
        const band = svgEl(bands, "path", { fill: "none", stroke: info.color, "stroke-linecap": "round", class: "cm-rb-band" });
        band.setAttribute("stroke-width", String(Math.min(14, 2 + items.length * 0.45)));
        if (info.dash) band.setAttribute("stroke-dasharray", "6 5");
        grp.addEventListener("mouseenter", () => band.classList.add("is-hl"));
        grp.addEventListener("mouseleave", () => band.classList.remove("is-hl"));
        bandData.push({ grp, band, dir });
      }
      return col;
    };
    column("is-in", inn, "inn", (e) => e.from);
    const mid = cols.createDiv({ cls: "cm-rb-mid" });
    column("is-out", out, "out", (e) => e.to);
    const centre = mid.createDiv({ cls: "cm-rb-centre", attr: { title: file.basename } });
    centre.createDiv({ cls: "cm-rb-centre-name", text: file.basename });
    centre.createDiv({ cls: "cm-rb-centre-sub", text: `${new Set(inn.map((e) => e.from)).size} in · ${new Set(out.map((e) => e.to)).size} out` });

    const layout = () => {
      const w = wrap.getBoundingClientRect();
      if (!w.width) return;
      svg.setAttribute("width", String(w.width)); svg.setAttribute("height", String(w.height));
      svg.setAttribute("viewBox", `0 0 ${w.width} ${w.height}`);
      const c = centre.getBoundingClientRect();
      const cy = c.top - w.top + c.height / 2;
      for (const b of bandData) {
        const g = b.grp.getBoundingClientRect();
        const y = g.top - w.top + g.height / 2;
        const x1 = b.dir === "inn" ? g.right - w.left : g.left - w.left;
        const x2 = b.dir === "inn" ? c.left - w.left : c.right - w.left;
        const mx = (x1 + x2) / 2;
        b.band.setAttribute("d", `M${x1},${y} C${mx},${y} ${mx},${cy} ${x2},${cy}`);
      }
    };
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => layout());
      ro.observe(wrap);
      this.cleanups.push(() => ro.disconnect());
    }
    layout();
    requestAnimationFrame(layout);
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
