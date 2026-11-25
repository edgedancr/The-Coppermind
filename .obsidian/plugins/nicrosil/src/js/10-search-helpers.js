/* ---------- search (pure helpers, tested outside Obsidian) ---------- */

const SEARCH_PAGE = 20; // cards drawn at a time; more are drawn as the results list is scrolled
const SEARCH_SCOPE = [/^Wiki\//, /^Perspectives\//, /^Sources\/Source Cards\//];
const TYPE_LABELS = { source: "Source card", "case-study": "Case study", perspective: "Perspective" };
const TITLE_SCORE = [0, 45, 65, 80, 100];
const ALIAS_SCORE = [0, 40, 55, 75, 95];
const HEADING_SCORE = [0, 18, 25, 25, 25];
const ALNUM = /[\p{L}\p{N}]/u;

function inSearchScope(path) {
  return SEARCH_SCOPE.some((re) => re.test(path));
}

/** Plain text of a note body: no frontmatter, no markdown punctuation, one line. */
function plainBody(text) {
  let t = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  t = t
    // Footnotes (Schema §6): drop the Footnotes section, any stray definitions, and the [^n] markers.
    .replace(/(^|\r?\n)#{1,6}[ \t]+Footnotes[ \t]*(\r?\n[\s\S]*)?$/i, "\n")
    .replace(/^\[\^[^\]\s]+\]:.*$/gm, "")
    .replace(/\[\^[^\]\s]+\]/g, "")
    .replace(/```[^\n]*\n?/g, " ")
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2")
    .replace(/\[\[([^\]#]*)#?([^\]]*)\]\]/g, (m, a, b) => a || b)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*>\s*\[![a-z]+\][-+]?\s*/gim, " ")
    .replace(/^[ \t]*(?:>[ \t]*)+/gm, "")
    .replace(/^[ \t]*[-*+][ \t]+/gm, "")
    .replace(/^#{1,6}[ \t]+/gm, "")
    .replace(/[*_`|]+/g, " ")
    .replace(/\s\^[a-z0-9-]+(?=\s|$)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t;
}

/** Short description for the card: the page's summary callout, else its first readable line. */
function leadLine(text) {
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const m = body.match(/^>[ \t]*\[!summary\][-+]?[^\n]*\n((?:>[^\n]*(?:\n|$))+)/im);
  if (m) {
    const p = plainBody(m[1].replace(/^>[ \t]?/gm, ""));
    if (p.length >= 12) return clip(p, 150);
  }
  let inFence = false;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("```")) { inFence = !inFence; continue; }
    if (inFence || !line) continue;
    if (/^(#|>|\||---|!\[\[|%%|\[\^)/.test(line)) continue;
    const p = plainBody(line);
    if (p.length < 12) continue;
    return clip(p, 150);
  }
  return "";
}

function clip(s, n) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut) + "…";
}

function titleCase(s) {
  return s.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Builds the searchable record of one page. */
function makeEntry(path, text, yaml) {
  const fm = yaml || {};
  const name = path.replace(/^.*\//, "").replace(/\.md$/, "");
  let aliases = fm.aliases || fm.alias || [];
  if (typeof aliases === "string") aliases = aliases.split(",");
  aliases = (Array.isArray(aliases) ? aliases : []).map((a) => String(a).trim()).filter(Boolean);
  const type = fm.type ? String(fm.type) : "";
  const body = plainBody(text);
  const headings = [];
  for (const m of text.matchAll(/^#{1,6}[ \t]+(.+?)[ \t]*$/gm)) headings.push(m[1].replace(/[*_`]/g, ""));
  return {
    path,
    name,
    nameL: name.toLowerCase(),
    aliases,
    aliasesL: aliases.map((a) => a.toLowerCase()),
    type,
    typeLabel: TYPE_LABELS[type] || (type ? titleCase(type) : ""),
    status: fm.status === "verified" ? "verified" : fm.status === "draft" ? "draft" : "",
    headingsL: headings.map((h) => h.toLowerCase()),
    body,
    bodyL: body.toLowerCase(),
    lead: leadLine(text),
  };
}

const STOPWORDS = new Set(["of", "the", "and", "to", "in", "a", "an", "is", "for", "on", "vs"]);

/** The typed words: one-letter words dropped, and small joining words dropped when other words remain. */
function tokenize(q) {
  const all = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 2).slice(0, 6);
  const content = all.filter((t) => !STOPWORDS.has(t));
  return content.length ? content : all;
}

/** 4 exact, 3 starts with, 2 starts a word, 1 appears inside, 0 absent. */
function fieldMatch(s, tok) {
  if (s === tok) return 4;
  let i = s.indexOf(tok);
  if (i < 0) return 0;
  if (i === 0) return 3;
  while (i >= 0) {
    if (i === 0 || !ALNUM.test(s[i - 1])) return 2;
    i = s.indexOf(tok, i + 1);
  }
  return 1;
}

/** True when a and b differ by at most one edit (insert, delete, replace, swap). */
function within1(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
}

function countOccurrences(s, tok, max) {
  let n = 0, i = s.indexOf(tok);
  while (i >= 0 && n < max) { n++; i = s.indexOf(tok, i + tok.length); }
  return n;
}

/** Score one page against the typed words. Every word must match somewhere; null if not. */
function scoreEntry(e, tokens, full) {
  let score = 0;
  let aliasNote = "";
  const bodyTokens = [];
  const titleWords = e.nameL.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const aliasWords = e.aliasesL.flatMap((a) => a.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  for (const tok of tokens) {
    let best = 0, src = "";
    const t = TITLE_SCORE[fieldMatch(e.nameL, tok)];
    if (t > best) { best = t; src = "title"; }
    let aliasHit = "";
    e.aliasesL.forEach((a, i) => {
      const s = ALIAS_SCORE[fieldMatch(a, tok)];
      if (s > best) { best = s; src = "alias"; aliasHit = e.aliases[i]; }
    });
    for (const h of e.headingsL) {
      const s = HEADING_SCORE[fieldMatch(h, tok)];
      if (s > best) { best = s; src = "heading"; }
    }
    const c = countOccurrences(e.bodyL, tok, 4);
    if (c && 9 + c > best) { best = 9 + c; src = "body"; }
    if (!best && tok.length >= 4) {
      if (titleWords.some((w) => within1(w, tok)) || aliasWords.some((w) => within1(w, tok))) { best = 28; src = "fuzzy"; }
    }
    if (!best) return null;
    score += best;
    if (src === "alias" && !aliasNote) aliasNote = aliasHit;
    if (src === "heading" || src === "body") bodyTokens.push(tok);
  }
  if (e.nameL === full) score += 60;
  else if (full.includes(" ") && e.nameL.includes(full)) score += 30;
  return { score, aliasNote, bodyTokens };
}

/** A window of the body around a matched word. */
function snippetAround(e, tok) {
  const i = e.bodyL.indexOf(tok);
  if (i < 0) return e.lead;
  const start = Math.max(0, i - 55);
  const end = Math.min(e.body.length, i + tok.length + 90);
  let s = e.body.slice(start, end);
  if (start > 0) s = "…" + s.replace(/^\S*\s/, "");
  if (end < e.body.length) s = s.replace(/\s\S*$/, "") + "…";
  return s;
}

/** Splits text into pieces, marking the parts that match a typed word. */
function highlight(text, tokens) {
  const low = text.toLowerCase();
  const ranges = [];
  for (const tok of tokens) {
    let i = low.indexOf(tok);
    while (i >= 0) { ranges.push([i, i + tok.length]); i = low.indexOf(tok, i + tok.length); }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  const out = [];
  let pos = 0;
  for (const [a, b] of merged) {
    if (a > pos) out.push({ t: text.slice(pos, a), hit: false });
    out.push({ t: text.slice(a, b), hit: true });
    pos = b;
  }
  if (pos < text.length) out.push({ t: text.slice(pos), hit: false });
  return out;
}

/** The suggestions for what has been typed. entries is any iterable of makeEntry records. */
function searchEntries(entries, query, limit) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const full = tokens.join(" ");
  const hits = [];
  for (const e of entries) {
    const r = scoreEntry(e, tokens, full);
    if (!r) continue;
    // The snippet is worked out only when a card is drawn, so every match can be ranked cheaply.
    const hit = { entry: e, score: r.score, aliasNote: r.aliasNote, tokens, _snip: null };
    const bodyTok = r.bodyTokens.length ? r.bodyTokens[0] : null;
    Object.defineProperty(hit, "snippet", { enumerable: true, get() {
      if (hit._snip === null) hit._snip = bodyTok ? snippetAround(e, bodyTok) : e.lead;
      return hit._snip;
    } });
    hits.push(hit);
  }
  hits.sort((a, b) =>
    b.score - a.score ||
    (a.entry.status === "verified" ? 0 : 1) - (b.entry.status === "verified" ? 0 : 1) ||
    a.entry.name.length - b.entry.name.length ||
    a.entry.name.localeCompare(b.entry.name));
  return limit ? hits.slice(0, limit) : hits;
}

/* ---------- the Tinmind's search (3.26.0): every note under The Tinmind/, and every heading in them ---------- */

function inTinScope(path) {
  return path.startsWith(NOTES_DIR) && path !== NOTES_DASHBOARD + ".md";
}

/** A class note's searchable record: the usual one, plus its headings as written and where it sits ("Fall 26 › SAIL"). */
function makeTinEntry(path, text, yaml) {
  const e = makeEntry(path, text, yaml);
  const headings = [];
  let inFence = false;
  for (const raw of text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").split(/\r?\n/)) {
    if (/^\s*```/.test(raw)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = raw.match(/^#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/);
    if (!m) continue;
    const h = m[1].replace(/[*_`]/g, "").trim();
    if (h && h.toLowerCase() !== "footnotes") headings.push(h);
  }
  const parts = path.slice(NOTES_DIR.length).split("/");
  parts.pop();
  e.headings = headings;
  e.headingsTL = headings.map((h) => h.toLowerCase());
  e.where = parts.join(" › ");
  e.typeLabel = e.where; // shown as the tag on a note's card
  e.status = "";
  return e;
}

/** Notes (by title, alias and text, as the Coppermind's search ranks them) and headings (a card each), best first. */
function searchTin(entries, query, limit) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const list = [...entries];
  const hits = searchEntries(list, query);
  const full = tokens.join(" ");
  for (const e of list) {
    (e.headingsTL || []).forEach((hl, i) => {
      let score = 0;
      for (const tok of tokens) {
        const s = TITLE_SCORE[fieldMatch(hl, tok)];
        if (!s) return;
        score += s;
      }
      if (hl === full) score += 40;
      hits.push({ entry: e, heading: e.headings[i], idx: i, score: Math.round(score * 0.9), aliasNote: "", tokens, snippet: "" });
    });
  }
  hits.sort((a, b) =>
    b.score - a.score ||
    (a.heading ? 1 : 0) - (b.heading ? 1 : 0) ||
    a.entry.name.localeCompare(b.entry.name) ||
    (a.idx || 0) - (b.idx || 0));
  return limit ? hits.slice(0, limit) : hits;
}

/** The link that opens a heading: the note, then # and the heading with the characters links can't hold turned to spaces. */
function headingLink(path, heading) {
  return path.replace(/\.md$/, "") + "#" + heading.replace(/[#|^:%\[\]]/g, " ").replace(/\s+/g, " ").trim();
}

