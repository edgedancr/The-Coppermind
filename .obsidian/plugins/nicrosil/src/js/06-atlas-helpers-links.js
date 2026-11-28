/* ---------- Atlas: topics, page placement and layout (pure helpers, tested outside Obsidian) ---------- */

/**
 * The topics in _topics.md: each `## Name` heading, the first plain line under it as its description,
 * and the [[links]] in its list items as its anchor pages. Text before the first heading is the file's intro.
 */
function parseTopics(text) {
  const body = String(text || "").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const topics = [];
  let cur = null;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    const h = /^##\s+(.+?)\s*#*$/.exec(line);
    if (h && !/^###/.test(line)) { cur = { name: h[1].trim(), desc: "", anchors: [] }; topics.push(cur); continue; }
    if (!cur || !line) continue;
    if (/^[-*+]\s/.test(line)) {
      const re = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
      let m;
      while ((m = re.exec(line))) cur.anchors.push(m[1].trim());
    } else if (!cur.desc && !/^#/.test(line)) cur.desc = line;
  }
  return topics.filter((t) => t.name);
}

/**
 * Which topic each page belongs to. ids: page ids; adj: Map id -> Map(neighbor id -> weight), undirected;
 * anchors: one array of page ids per topic. Each topic spreads its weight out from its anchors along the
 * links (a random walk that restarts at the anchors); a page joins the topic that reaches it most strongly.
 * Anchors stay in their own topic (the first one, if a page is listed twice). Returns
 * { topic: Map id -> index or -1, score: Map id -> Float64Array of every topic's share, sorted by nothing }.
 */
function assignTopics(ids, adj, anchors, opts = {}) {
  const restart = opts.restart ?? 0.25, rounds = opts.rounds ?? 40;
  const n = ids.length, T = anchors.length;
  const ix = new Map(ids.map((id, i) => [id, i]));
  const nb = ids.map((id) => [...(adj.get(id) || new Map())].filter(([j]) => ix.has(j)).map(([j, w]) => [ix.get(j), w]));
  const wsum = nb.map((l) => l.reduce((s, [, w]) => s + w, 0));
  const pinned = new Map();
  anchors.forEach((list, t) => list.forEach((id) => { if (ix.has(id) && !pinned.has(ix.get(id))) pinned.set(ix.get(id), t); }));
  const scores = [];
  for (let t = 0; t < T; t++) {
    const seeds = anchors[t].filter((id) => ix.has(id) && pinned.get(ix.get(id)) === t).map((id) => ix.get(id));
    const s0 = new Float64Array(n);
    seeds.forEach((i) => { s0[i] = 1 / seeds.length; });
    let p = Float64Array.from(s0);
    for (let r = 0; r < rounds && seeds.length; r++) {
      const q = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        if (!p[i] || !wsum[i]) continue;
        const share = (p[i] * (1 - restart)) / wsum[i];
        for (const [j, w] of nb[i]) q[j] += share * w;
      }
      for (let i = 0; i < n; i++) q[i] += restart * s0[i];
      p = q;
    }
    scores.push(p);
  }
  const topic = new Map(), score = new Map();
  ids.forEach((id, i) => {
    const row = new Float64Array(T);
    let best = -1, bv = 0, tot = 0;
    for (let t = 0; t < T; t++) {
      // divide by the page's own link weight, so a busy page is judged by its mix of links, not their number
      const v = scores[t][i] / Math.max(1, wsum[i]);
      row[t] = v; tot += v;
      if (v > bv) { bv = v; best = t; }
    }
    if (tot > 0) for (let t = 0; t < T; t++) row[t] /= tot;
    topic.set(id, pinned.has(i) ? pinned.get(i) : bv > 1e-12 ? best : -1);
    score.set(id, row);
  });
  return { topic, score };
}

/** A small repeatable number in [0, 1) from a string, so the layout is the same every time it is drawn. */
function hash01(s, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Positions for the atlas, worked out once (no live motion).
 * groups: [{ key, members: [id] }] (the topics, then "No topic yet" if it has pages);
 * adj: as for assignTopics; radiusOf(id): a dot's radius; anchorSet: ids pinned as anchors; aspect: the width the
 * whole map should have for its height (the atlas's tab is wider than it is tall).
 * Returns { groups: [{ key, x, y, r }], pos: Map id -> { x, y } }.
 */
function layoutAtlas(groups, adj, radiusOf, anchorSet = new Set(), aspect = 1.7) {
  const G = groups.length;
  const gOf = new Map();
  groups.forEach((g, i) => g.members.forEach((id) => gOf.set(id, i)));
  const rad = groups.map((g) => 26 + 21 * Math.sqrt(Math.max(1, g.members.length)));
  const GAP = 58; // room between circles for a topic's name (one or two lines), which sits above its circle
  // links between groups
  const W = groups.map(() => new Float64Array(G));
  for (const [a, m] of adj) {
    const ga = gOf.get(a);
    if (ga === undefined) continue;
    for (const [b, w] of m) { const gb = gOf.get(b); if (gb !== undefined && gb !== ga) W[ga][gb] += w / 2; }
  }
  // 1. the topic circles: start on a ring in file order, pull linked topics together, push overlaps apart
  const ringR = groups.reduce((s, _, i) => s + rad[i], 0) / Math.PI;
  const P = groups.map((g, i) => ({ x: Math.cos((2 * Math.PI * i) / G - Math.PI / 2) * ringR * Math.sqrt(aspect), y: Math.sin((2 * Math.PI * i) / G - Math.PI / 2) * ringR / Math.sqrt(aspect) }));
  const maxW = Math.max(1, ...W.map((r) => Math.max(...r)));
  for (let it = 0; it < 600; it++) {
    const heat = 1 - it / 600;
    const F = P.map(() => ({ x: 0, y: 0 }));
    for (let a = 0; a < G; a++) for (let b = a + 1; b < G; b++) {
      let dx = P[b].x - P[a].x, dy = P[b].y - P[a].y;
      const d = Math.hypot(dx, dy) || 0.01; dx /= d; dy /= d;
      const want = rad[a] + rad[b] + GAP + 8;
      const w = W[a][b] / maxW;
      let f = 0;
      if (d < want) f = -(want - d) * 0.5;                       // overlap: push apart
      else f = (d - want) * (0.004 + 0.05 * Math.sqrt(w));      // apart: linked topics pull together harder
      F[a].x += dx * f; F[a].y += dy * f; F[b].x -= dx * f; F[b].y -= dy * f;
    }
    for (let a = 0; a < G; a++) { F[a].x -= (P[a].x * 0.002) / aspect; F[a].y -= P[a].y * 0.002 * aspect; } // squashed gravity: wider than tall
    for (let a = 0; a < G; a++) { P[a].x += F[a].x * (0.3 + heat); P[a].y += F[a].y * (0.3 + heat); }
  }
  // stretch toward the wanted shape, then let the overlap pass below space the circles out again
  let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
  P.forEach((p, i) => { bx0 = Math.min(bx0, p.x - rad[i]); bx1 = Math.max(bx1, p.x + rad[i]); by0 = Math.min(by0, p.y - rad[i]); by1 = Math.max(by1, p.y + rad[i]); });
  const have = (bx1 - bx0) / Math.max(1, by1 - by0);
  if (G > 2 && have < aspect) { const f = Math.sqrt(aspect / have); P.forEach((p) => { p.x *= f; p.y /= f; }); }
  for (let it = 0; it < 400; it++) { // final pass: no two circles touch
    let moved = false;
    for (let a = 0; a < G; a++) for (let b = a + 1; b < G; b++) {
      let dx = P[b].x - P[a].x, dy = P[b].y - P[a].y;
      const d = Math.hypot(dx, dy) || 0.01; const want = rad[a] + rad[b] + GAP;
      if (d < want) { const m = (want - d) / 2; dx /= d; dy /= d; P[a].x -= dx * m; P[a].y -= dy * m; P[b].x += dx * m; P[b].y += dy * m; moved = true; }
    }
    if (!moved) break;
  }
  // 2. the pages inside each circle: linked pages near each other, anchors toward the middle,
  //    and a page with links to another topic toward that side of its circle
  const pos = new Map();
  groups.forEach((g, gi) => {
    const R = rad[gi], cx = P[gi].x, cy = P[gi].y;
    const mem = g.members;
    const loc = mem.map((id) => {
      const a = hash01(id, 1) * 2 * Math.PI, r = Math.sqrt(hash01(id, 2)) * R * (anchorSet.has(id) ? 0.25 : 0.8);
      return { id, x: Math.cos(a) * r, y: Math.sin(a) * r, r: radiusOf(id), tx: 0, ty: 0, pull: 0 };
    });
    const li = new Map(mem.map((id, i) => [id, i]));
    const springs = [];
    loc.forEach((p, i) => {
      let ox = 0, oy = 0, ow = 0;
      for (const [b, w] of adj.get(p.id) || []) {
        const j = li.get(b);
        if (j !== undefined) { if (j > i) springs.push([i, j, w]); continue; }
        const gb = gOf.get(b);
        if (gb === undefined) continue;
        const dx = P[gb].x - cx, dy = P[gb].y - cy, d = Math.hypot(dx, dy) || 1;
        ox += (dx / d) * w; oy += (dy / d) * w; ow += w;
      }
      let own = 0;
      for (const [b, w] of adj.get(p.id) || []) if (li.has(b)) own += w;
      if (ow) { const d = Math.hypot(ox, oy) || 1; p.tx = (ox / d) * R * 0.78; p.ty = (oy / d) * R * 0.78; p.pull = ow / (ow + own); }
    });
    const k = R / Math.sqrt(Math.max(1, mem.length)) * 0.62;
    for (let it = 0; it < 260; it++) {
      const heat = 1 - it / 260;
      const F = loc.map(() => ({ x: 0, y: 0 }));
      for (let i = 0; i < loc.length; i++) for (let j = i + 1; j < loc.length; j++) {
        let dx = loc[j].x - loc[i].x, dy = loc[j].y - loc[i].y;
        let d = Math.hypot(dx, dy);
        if (d < 0.01) { dx = hash01(loc[i].id + loc[j].id) - 0.5; dy = 0.5 - hash01(loc[j].id + loc[i].id); d = Math.hypot(dx, dy) || 0.01; }
        let f = (k * k) / d;
        const min = loc[i].r + loc[j].r + 4;
        if (d < min) f += (min - d) * 3;
        F[i].x -= (dx / d) * f; F[i].y -= (dy / d) * f; F[j].x += (dx / d) * f; F[j].y += (dy / d) * f;
      }
      for (const [i, j, w] of springs) {
        const dx = loc[j].x - loc[i].x, dy = loc[j].y - loc[i].y, d = Math.hypot(dx, dy) || 0.01;
        const f = (d * d) / k * 0.04 * Math.min(2, w);
        F[i].x += (dx / d) * f; F[i].y += (dy / d) * f; F[j].x -= (dx / d) * f; F[j].y -= (dy / d) * f;
      }
      loc.forEach((p, i) => {
        const c = anchorSet.has(p.id) ? 0.14 : 0.045;
        F[i].x += -p.x * c + (p.tx - p.x) * 0.06 * p.pull;
        F[i].y += -p.y * c + (p.ty - p.y) * 0.06 * p.pull;
        const step = Math.min(k * 0.6 * heat + 0.5, Math.hypot(F[i].x, F[i].y));
        const fl = Math.hypot(F[i].x, F[i].y) || 1;
        p.x += (F[i].x / fl) * step; p.y += (F[i].y / fl) * step;
        const lim = R - p.r - 6, d = Math.hypot(p.x, p.y);
        if (d > lim) { p.x *= lim / d; p.y *= lim / d; }
      });
    }
    loc.forEach((p) => pos.set(p.id, { x: cx + p.x, y: cy + p.y }));
  });
  return { groups: groups.map((g, i) => ({ key: g.key, x: P[i].x, y: P[i].y, r: rad[i] })), pos };
}

/**
 * Pages two steps away from `id` that it doesn't link with: pages that several of its neighbors also
 * link with. A neighbor or a candidate with many links counts for less, so a summary or a hub page that
 * links to everything doesn't make everything look related. Returns [{ id, via: [neighbor ids], score }].
 */
function suggestLinks(id, adj, opts = {}) {
  const min = opts.min ?? 2, limit = opts.limit ?? 8, skip = opts.skip || (() => false);
  const mine = adj.get(id) || new Map();
  const cand = new Map();
  for (const [n] of mine) {
    const nn = adj.get(n) || new Map();
    const w = 1 / Math.log(2 + nn.size);
    for (const [c] of nn) {
      if (c === id || mine.has(c) || skip(c)) continue;
      if (!cand.has(c)) cand.set(c, { id: c, via: [], score: 0 });
      const o = cand.get(c); o.via.push(n); o.score += w;
    }
  }
  // a candidate with many links of its own is reached from everywhere, so it counts for less too
  for (const c of cand.values()) c.score /= Math.sqrt(1 + (adj.get(c.id) || new Map()).size);
  return [...cand.values()].filter((c) => c.via.length >= min).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}

/* ---------- Links between pages, shared by Connections and the atlas ---------- */

/** The typed-link properties, in the order SCHEMA §5 lists them, with how each reads from each side. */
const REL_TYPES = {
  type_of:      { out: "Is a kind of",     inn: "Kinds of this",         color: "#b87333", dash: "" },
  part_of:      { out: "Is part of",       inn: "Parts of this",         color: "#5fae9e", dash: "" },
  example_of:   { out: "Is an example of", inn: "Examples of this",      color: "#e0c040", dash: "" },
  causes:       { out: "Causes",           inn: "Caused by",             color: "#e07a5f", dash: "" },
  counters:     { out: "Counters",         inn: "Countered by",          color: "#b97f93", dash: "" },
  threatens:    { out: "Threatens",        inn: "Threatened by",         color: "#c0603a", dash: "6 2" }, // 4.8.0
  applies_to:   { out: "Applies to",       inn: "Applied by",            color: "#6a9fd8", dash: "" },
  requires:     { out: "Requires",         inn: "Required by",           color: "#4fb3c8", dash: "" }, // 4.8.0
  supports:     { out: "Supports",         inn: "Supported by",          color: "#8bbf6a", dash: "" },
  contradicts:  { out: "Contradicts",      inn: "Contradicted by",       color: "#d9435e", dash: "2 3" },
  developed_by: { out: "Developed by",     inn: "Ideas developed here",  color: "#a58ad6", dash: "" },
  summarizes:   { out: "Summarizes",       inn: "Summarized in",         color: "#c9a66b", dash: "1 3" }, // 4.8.0
  related:      { out: "Related to",       inn: "Related from",          color: "#8a8a8a", dash: "5 4" },
};
/** Plain links in the text (and in properties that aren't typed links): "see also" links, drawn after the typed ones (3.29.0). */
const LINK_TYPES = { ...REL_TYPES, see: { out: "Links to", inn: "Linked from", color: "#8c8174", dash: "3 3", label: "see also" } };
const linkLabel = (t) => LINK_TYPES[t].label || t.replace("_", " ");

/** Every typed link in the vault as {from, to, type}, read from the metadata cache (no file reads). */
function collectRelations(app) {
  const edges = [];
  const mc = app.metadataCache;
  for (const f of app.vault.getMarkdownFiles()) {
    const fm = (mc.getFileCache(f) || {}).frontmatter;
    if (!fm) continue;
    for (const type of Object.keys(REL_TYPES)) {
      const raw = fm[type];
      if (raw === undefined || raw === null) continue;
      const vals = [].concat(raw).flat(3);
      for (const v of vals) {
        const m = /\[\[([^\]|#]+)/.exec(String(v));
        if (!m) continue;
        const dest = mc.getFirstLinkpathDest(m[1].trim(), f.path);
        edges.push({ from: f.path, to: dest ? dest.path : null, toName: m[1].trim(), type });
      }
    }
  }
  return edges;
}

/** Pages Connections shows links between: wiki pages, perspectives and source cards (not the index, logs or rule files, which link to everything). */
const inLinkScope = (path) => /\.md$/.test(path) && (/^(Wiki|Perspectives)\//.test(path) || path.startsWith("Sources/Source Cards/"));
/** Pages on the atlas: wiki pages and perspectives (source cards would bury it). */
const inAtlasScope = (path) => /\.md$/.test(path) && /^(Wiki|Perspectives)\//.test(path);

/**
 * Every link between pages in scope, once per page pair and type: the typed links in the properties, then a "see"
 * link for each other link Obsidian resolved (the text, and properties such as `sources`) between two pages that no typed link joins in that direction.
 */
function collectLinks(app, rels) {
  const seen = new Set();
  const edges = [];
  for (const e of rels || collectRelations(app)) {
    if (!e.to || e.from === e.to || !inLinkScope(e.from) || !inLinkScope(e.to)) continue;
    const k = `${e.from}|${e.to}|${e.type}`;
    if (seen.has(k)) continue;
    seen.add(k); seen.add(`${e.from}|${e.to}`);
    edges.push({ from: e.from, to: e.to, type: e.type });
  }
  const rl = app.metadataCache.resolvedLinks || {};
  for (const from of Object.keys(rl)) {
    if (!inLinkScope(from)) continue;
    for (const to of Object.keys(rl[from] || {})) {
      if (to === from || !inLinkScope(to) || seen.has(`${from}|${to}`)) continue;
      seen.add(`${from}|${to}`);
      edges.push({ from, to, type: "see" });
    }
  }
  return edges;
}

/** A page's review state: verified, rereview (a verified page changed since), draft, or "" (no status). */
function pageState(fm) {
  if (!fm) return "";
  if (fm.status === "verified") return "verified";
  if (fm.status === "draft") return [].concat(fm.changes_since_verified || []).some((x) => String(x || "").trim()) ? "rereview" : "draft";
  return "";
}
const STATE_COLORS = { verified: "#5fae9e", rereview: "#ecb54e", draft: "#a65f2b", "": "#8a8178" };
const STATE_LABELS = { verified: "Verified", rereview: "Re-review", draft: "Draft", "": "No status" };

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(parent, tag, attrs, text) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  parent.appendChild(el);
  return el;
}
function clip(s, n) { return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; }
/** Words in lines of about n letters, at most two lines (the second takes the rest). */
function wrapWords(s, n) {
  const words = String(s).split(" ");
  let a = "";
  while (words.length && (!a || (a + " " + words[0]).length <= n)) a = (a ? a + " " : "") + words.shift();
  return words.length ? [a, words.join(" ")] : [a];
}

