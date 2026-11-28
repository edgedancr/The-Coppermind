/* ---------- pure helpers (tested outside Obsidian) ---------- */

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Number of lines taken by the frontmatter block (0 if none). */
function frontmatterLines(lines) {
  if (lines[0] !== "---") return 0;
  for (let i = 1; i < lines.length; i++) if (lines[i] === "---") return i + 1;
  return 0;
}

/**
 * Flag callouts with their line ranges (0-based, inclusive) in the full file.
 * caution = accuracy check, todo = gap, question = "whose view?", warning = unsourced.
 */
function parseFlags(text) {
  const lines = text.split(/\r?\n/);
  const flags = [];
  for (let i = frontmatterLines(lines); i < lines.length; i++) {
    const m = lines[i].match(/^>\s*\[!(caution|todo|question|warning)\][+-]?\s*(.*)$/i);
    if (!m) continue;
    const kind = m[1].toLowerCase();
    const label = FLAG_KINDS[kind].label;
    let title = m[2].trim();
    if (title.toLowerCase() === label.toLowerCase()) title = "";
    let end = i;
    const body = [];
    while (end + 1 < lines.length && /^>/.test(lines[end + 1])) {
      end++;
      body.push(lines[end].replace(/^>\s?/, ""));
    }
    flags.push({ kind, label, title, start: i, end, body: body.join("\n").trim() });
    i = end;
  }
  return flags;
}

/** Remove lines start..end (inclusive), and one blank line so no double gap is left behind. */
function removeLines(text, start, end) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  lines.splice(start, end - start + 1);
  if (start < lines.length && lines[start].trim() === "" && (start === 0 || lines[start - 1].trim() === "")) {
    lines.splice(start, 1);
  }
  return lines.join(eol);
}

/* ---------- transcription review helpers (3.16.0) ---------- */

/** A scan's path in the vault from the name a note lists (IMG_0805.jpg), or the path itself if it has a folder in it. */
function scanPath(name) {
  const n = String(name || "").trim().replace(/^\[\[|\]\]$/g, "");
  return n.includes("/") ? n : SCAN_DIR + n;
}

/** The scan names in a note's `scan_pages` property (a list or one string), without any [[ ]]. */
function scanNames(v) {
  if (v === undefined || v === null || v === "") return [];
  return (Array.isArray(v) ? v : [v]).map((x) => String(x).trim().replace(/^\[\[|\]\]$/g, "")).filter(Boolean);
}

/** The key two notes share when they list the same scan, however it is written. */
const scanKey = (name) => String(name || "").trim().replace(/^\[\[|\]\]$/g, "").split("/").pop().toLowerCase();

/** A note split into its properties block (with its closing line and line break), its body, and the line break it uses. */
function splitNote(text) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const n = frontmatterLines(lines);
  return { head: n ? lines.slice(0, n).join(eol) + eol : "", body: lines.slice(n).join(eol), eol };
}

/**
 * Drawing callouts in a note's body, as { kind, label, body, scan, start, end } (0-based, inclusive lines, like parseFlags).
 * `> [!drawing]` is a drawing that still needs my decision; `> [!recreate]` is one I asked to have recreated.
 * The "scan: IMG_0805.jpg" line inside the callout says which page it is on.
 */
function parseDrawings(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  for (let i = frontmatterLines(lines); i < lines.length; i++) {
    const m = lines[i].match(/^>\s*\[!(drawing|recreate)\][+-]?\s*(.*)$/i);
    if (!m) continue;
    let end = i;
    const said = [];
    let scan = "";
    while (end + 1 < lines.length && /^>/.test(lines[end + 1])) {
      end++;
      const b = lines[end].replace(/^>\s?/, "");
      const s = b.match(/^scan:\s*(.+?)\s*$/i);
      if (s) scan = s[1].replace(/^\[\[|\]\]$/g, ""); else said.push(b);
    }
    out.push({ kind: m[1].toLowerCase(), label: m[2].trim(), body: said.join(" ").trim(), scan, start: i, end });
    i = end;
  }
  return out;
}

/** The "%% recreated: IMG_0805.jpg | label %%" lines the agent leaves under a drawing it recreated, as { line, scan, label }. */
function parseRechecks(text) {
  const out = [];
  text.split(/\r?\n/).forEach((l, i) => {
    const m = l.match(/^\s*%%\s*recreated:\s*(.*?)\s*%%\s*$/i);
    if (!m) return;
    const parts = m[1].split("|");
    out.push({ line: i, scan: (parts[0] || "").trim().replace(/^\[\[|\]\]$/g, ""), label: parts.slice(1).join("|").trim() });
  });
  return out;
}

/** Words I'd better look at again: [?word?] is a guess, [??] is unreadable. { index, length, text, guess }. */
function findUnsure(text) {
  const out = [];
  const re = /\[\?[^\]\n]*?\?\]/g;
  let m;
  while ((m = re.exec(text))) out.push({ index: m.index, length: m[0].length, text: m[0], guess: m[0].slice(2, -2).trim() });
  return out;
}

/** Puts a guess in the text in place of its [?...?] marker. */
function acceptGuess(text, u) {
  return text.slice(0, u.index) + u.guess + text.slice(u.index + u.length);
}

function replaceLines(text, start, end, newLines) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  lines.splice(start, end - start + 1, ...newLines);
  return lines.join(eol);
}

/** Keep screenshot: the drawing callout becomes an embedded image (the label is its alt text). */
function keepDrawing(text, d, imageName) {
  let alt = String(d.label || "").replace(/[|\[\]\n]/g, " ").replace(/\s+/g, " ").trim();
  if (/^\d+(x\d+)?$/.test(alt)) alt = "Drawing " + alt; // a bare number would be read as a width
  return replaceLines(text, d.start, d.end, [`![[${imageName}${alt ? "|" + alt : ""}]]`]);
}

/** Recreate: the callout's type changes from drawing to recreate; everything else stays, so the scan reference is kept. */
function recreateDrawing(text, d) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  lines[d.start] = lines[d.start].replace(/\[!drawing\]/i, "[!recreate]");
  return lines.join(eol);
}

/** Leave out: the callout is removed and nothing replaces it. */
function leaveOutDrawing(text, d) { return removeLines(text, d.start, d.end); }

/** Looks right: the "recreated" marker line is removed. */
function clearRecheck(text, r) { return removeLines(text, r.line, r.line); }

/** The log entry for a verified transcription. `drawings` is [{ label, decision }]. */
function transcribeVerifyLogEntry({ name, date, pages, trashed, kept, missing = [], drawings = [], unsure = 0 }) {
  const lines = [`### [${date}] verify | ${name} (transcription)`, "", "- **Verify:**", `  - Approved: [[${name}]]`];
  const bits = [`${trashed.length} moved to the trash`];
  if (kept.length) bits.push(`${kept.length} kept because another unverified note lists it (${kept.join(", ")})`);
  if (missing.length) bits.push(`${missing.length} already gone (${missing.join(", ")})`);
  lines.push(`  - Scans (${pages.length}): ${pages.join(", ") || "none listed"} — ${bits.join("; ")}`);
  if (drawings.length) {
    lines.push(`  - Drawings I decided on (${drawings.length}):`);
    drawings.forEach((d) => lines.push(`    - ${oneLine(d.label || "Drawing")} — ${oneLine(d.decision)}`));
  }
  if (unsure) lines.push(`  - Unsure words still in the note when I approved it: ${unsure}`);
  return lines.join("\n");
}

function groupOf(path) {
  if (path.startsWith("Perspectives/")) return "Perspectives";
  if (path.startsWith("Sources/Source Cards/")) return "Source Cards";
  if (path.startsWith(SCHEMA_DIR)) return "Schemas";
  if (!path.includes("/")) return "Vault files";
  const m = path.match(/^Wiki\/([^/]+)\//);
  return m ? m[1] : "Other";
}

function groupRank(g) {
  const i = GROUP_ORDER.indexOf(g);
  return i < 0 ? GROUP_ORDER.length : i;
}

/** Order drafts for review. Skipped pages go to the end, in the order they were skipped. */
/** The line a typed link adds to `changes_since_verified` on a verified page (4.1.0). The target is plain text, not a [[link]], so it isn't read as a second link. */
function typedLinkNote(date, type, name) {
  return `${date}: Added typed link ${type} → ${name} (Add typed link button)`;
}

/** The log entry for a typed link I removed from an ingest tab (4.8.0): it is recorded as a rejected link, with my reason. */
function typedLinkRejectLogEntry({ date, ingest, from, type, to, reason }) {
  return [`### [${date}] verify | Typed link from ${oneLine(ingest)}`, "", "- **Verify:**",
    `  - Links rejected: [[${from}]] → ${type} → [[${to}]] — ${oneLine(reason)}`].join("\n");
}

/** The typed links an ingest reports in its nicrosil-meta block (4.8.0), cleaned up: { from, type, to, why, inferred, verified }. Unknown types are dropped. */
function ingestTypedLinks(list) {
  const str = (v) => (v == null ? "" : String(v).trim());
  return (Array.isArray(list) ? list : []).map((l) => ({
    from: bareLink(str(l && l.from)), type: str(l && l.type).toLowerCase(), to: bareLink(str(l && l.to)),
    why: str(l && l.why), inferred: !!(l && l.inferred), verified: !!(l && l.verified),
  })).filter((l) => l.from && l.to && REL_TYPES[l.type]);
}

/** The Wiki pages that match what was typed, best first, at most 8: exact name, name start, a word's start, anywhere in the name, then an alias. Nothing for an empty box. */
function rankTargets(targets, query) {
  const s = String(query || "").trim().toLowerCase();
  if (!s) return [];
  const rows = [];
  for (const t of targets) {
    const n = t.name.toLowerCase();
    let rank = -1, alias = "";
    if (n === s) rank = 0;
    else if (n.startsWith(s)) rank = 1;
    else if (n.split(/[\s\-–—(]+/).some((w) => w.startsWith(s))) rank = 2;
    else if (n.includes(s)) rank = 3;
    else {
      const a = t.aliases.find((x) => x.toLowerCase().includes(s));
      if (a) { rank = 4; alias = a; }
    }
    if (rank >= 0) rows.push({ t, rank, alias });
  }
  rows.sort((a, b) => a.rank - b.rank || a.t.name.localeCompare(b.t.name));
  return rows.slice(0, 8);
}

/** The `changes_since_verified` property as a list of plain strings (it may be a list or a single string). */
function changeLines(v) {
  if (v === undefined || v === null || v === "") return [];
  return (Array.isArray(v) ? v : [v]).map((x) => String(x).trim()).filter(Boolean);
}

/** Splits a change note into its words and an optional location: a "[[#Heading]]" (or "[[#^block]]") anywhere in the line. */
function parseChange(line) {
  const m = /\[\[#([^\]|]+?)(?:\|([^\]]*))?\]\]/.exec(String(line));
  if (!m) return { text: String(line), target: "", label: "" };
  const target = m[1].trim();
  const label = (m[2] || (target.startsWith("^") ? "marked passage" : target.split("#").pop())).trim();
  const text = String(line).replace(m[0], "").replace(/\s{2,}/g, " ").replace(/\s+([.,;:)])/g, "$1").trim();
  return { text, target, label };
}

const normHeading = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** The line number a change note's location points to, read from the page's metadata, or null if it can't be found. */
function locateInCache(cache, target) {
  if (!cache || !target) return null;
  if (target.startsWith("^")) {
    const id = target.slice(1).toLowerCase();
    const b = Object.entries(cache.blocks || {}).find(([k]) => k.toLowerCase() === id);
    return b ? b[1].position.start.line : null;
  }
  const want = normHeading(target.split("#").pop());
  const h = (cache.headings || []).find((x) => normHeading(x.heading) === want);
  return h ? h.position.start.line : null;
}

/** Writes one change line into `el`. A line that names a location becomes a link that goes there. */
function drawChangeLine(el, plugin, path, change) {
  const { text, target, label } = parseChange(change);
  el.appendText(text);
  if (!target) return false;
  el.addClass("cm-chg-link");
  el.setAttr("role", "button"); el.setAttr("tabindex", "0");
  el.setAttr("aria-label", `Go to “${label}” in this page`);
  el.createSpan({ cls: "cm-chg-loc", text: `→ ${label}` });
  const go = (e) => { e.stopPropagation(); plugin.openChange(path, change, e.ctrlKey || e.metaKey); };
  el.addEventListener("click", go);
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") go(e); });
  return true;
}

function sortQueue(drafts, mode, skipped) {
  const byType = (a, b) => groupRank(a.group) - groupRank(b.group) || a.name.localeCompare(b.name);
  const base = {
    clean: (a, b) => a.flags.length - b.flags.length || byType(a, b),
    flagged: (a, b) => b.flags.length - a.flags.length || byType(a, b),
    type: byType,
    az: (a, b) => a.name.localeCompare(b.name),
  }[mode] || byType;
  // re-reviews (verified pages the AI changed) always come first
  const cmp = (a, b) => (b.changes.length > 0) - (a.changes.length > 0) || base(a, b);
  const skip = skipped || [];
  const normal = drafts.filter((d) => !skip.includes(d.path)).sort(cmp);
  const later = skip.map((p) => drafts.find((d) => d.path === p)).filter(Boolean);
  return normal.concat(later);
}

/** The page after `path` in `order` (wrapping), ignoring `path` itself. */
function nextAfter(order, path) {
  const rest = order.filter((d) => d.path !== path);
  if (!rest.length) return null;
  const i = order.findIndex((d) => d.path === path);
  if (i < 0) return rest[0];
  for (let k = i + 1; k < order.length; k++) if (order[k].path !== path) return order[k];
  return rest[0];
}

/** Where a health check stands: how many days since the last one, and whether the next is on time, close, or overdue. */
function healthStatus(lastIso, nowIso, every) {
  if (!lastIso) return { state: "none", elapsed: null, left: null, pct: 1 };
  const elapsed = daysBetween(lastIso, nowIso);
  if (elapsed === null) return { state: "none", elapsed: null, left: null, pct: 1 };
  const left = every - elapsed;
  const state = left < 0 ? "overdue" : left <= 2 ? "soon" : "ok";
  return { state, elapsed, left, pct: Math.max(0, Math.min(1, elapsed / every)) };
}
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso), b = Date.parse(toIso);
  if (isNaN(a) || isNaN(b)) return null;
  return Math.floor((b - a) / 86400000);
}

/**
 * _index.md model. Each "## Type (n)" section holds its entries in one alphabetical list, with no
 * split by status. Concepts and Glossary (INDEX_LETTERED) are split under "### A" ... "### 0–9" letter
 * headings; those are dropped when reading and rebuilt when writing, and the "**Jump to:**" line under
 * the total is rebuilt from the sections. The older formats are still read, and rewritten in this one: entries under
 * "### Verified (n)" and "### Drafts (n)" headings, or with the status in brackets at the end of each line.
 */
const INDEX_LETTERED = new Set(["Concepts", "Glossary"]);

function indexLetter(name) {
  const m = String(name || "").normalize("NFD").match(/[A-Za-z0-9]/);
  const c = m ? m[0].toUpperCase() : "";
  return /[A-Z]/.test(c) ? c : "0–9";
}

function entryName(line) {
  const m = line.match(/^- \[\[([^\]|#]+)/);
  return m ? m[1].trim() : null;
}

function parseIndex(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const head = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    let m;
    if ((m = line.match(/^## (.+?)\s*\(\d+\)\s*$/))) {
      cur = { title: m[1], entries: [], extra: [] };
      sections.push(cur);
    } else if (!cur) {
      head.push(line);
    } else if (/^### (Verified|Drafts)\b/i.test(line)) {
      // an old status heading: dropped
    } else if (/^### (?:[A-Z]|0–9)\s*$/.test(line)) {
      // a letter heading: dropped, rebuilt by renderIndex
    } else if (/^- \[\[/.test(line)) {
      cur.entries.push({ name: entryName(line), text: line.replace(/\s\((draft|verified)\)\s*$/, "").replace(/\s+$/, "") });
    } else if (line.trim() !== "") {
      cur.extra.push(line);
    }
  }
  while (head.length && head[head.length - 1].trim() === "") head.pop();
  return { head, sections };
}

function renderIndex(model, date) {
  const byName = (a, b) => (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" });
  let total = 0;
  const body = [];
  const jump = [];
  for (const sec of model.sections) {
    const all = sec.entries.slice().sort(byName);
    total += all.length;
    body.push(`## ${sec.title} (${all.length})`, "");
    jump.push(`[[#${sec.title} (${all.length})|${sec.title}]]`);
    if (all.length && INDEX_LETTERED.has(sec.title)) {
      let last = null;
      for (const e of all) {
        const L = indexLetter(e.name);
        if (L !== last) {
          if (last !== null) body.push("");
          body.push(`### ${L}`, "");
          last = L;
        }
        body.push(e.text);
      }
      body.push("");
    } else if (all.length) body.push(...all.map((e) => e.text), "");
    if (sec.extra.length) body.push(...sec.extra, "");
  }
  let head = model.head.join("\n");
  head = head.replace(/^\*\*Totals?:\*\*.*$/m, `**Total:** ${total} pages`);
  head = head.replace(/^\*\*Jump to:\*\*.*$/m, () => `**Jump to:** ${jump.join(" ")}`);
  head = head.replace(/^updated:.*$/m, `updated: ${date}`);
  return head + "\n\n" + body.join("\n").replace(/\n+$/, "") + "\n";
}

/**
 * Returns { text, found }. mode "remove" deletes the entry and fixes the counts. mode "verify" only
 * checks that the entry exists, since the index no longer shows a page's status.
 */
function editIndex(text, name, mode, date) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const model = parseIndex(text);
  let found = false;
  for (const sec of model.sections) {
    const k = sec.entries.findIndex((e) => e.name === name);
    if (k < 0) continue;
    found = true;
    if (mode === "remove") sec.entries.splice(k, 1);
    break;
  }
  if (!found) return { text, found: false };
  if (mode !== "remove") return { text, found: true };
  return { text: renderIndex(model, date).replace(/\n/g, eol), found: true };
}

/* ---- keeping _index.md up to date by itself ---- */
const INDEX_SCOPE = [/^Wiki\//, /^Perspectives\//, /^Sources\/Source Cards\//];
const isEmptyIndexLine = (t) => /^- \[\[[^\]]+\]\]\s*(?:\u2014\s*)?$/.test(t);
const indexLine = (name, summary) => (summary ? `- [[${name}]] \u2014 ${summary}` : `- [[${name}]]`);

/** Which of these page names an index text still needs a look at: names with no entry, and entries with no summary. */
function indexNeeds(text, names) {
  const have = new Map();
  for (const sec of parseIndex(text).sections) for (const e of sec.entries) if (e.name) have.set(e.name, isEmptyIndexLine(e.text));
  return new Set(names.filter((n) => !have.has(n) || have.get(n)));
}

/**
 * Brings the index text in line with the pages that exist. pages: [{ name, group }] (group = the section title, from groupOf);
 * summaries: { name: one-line summary } for pages that need one; renames: [[oldName, newName]], which keep an entry's summary.
 * Adds an entry for each page that has none, removes entries whose page is gone, moves an entry to the right section,
 * fills an empty summary when one is available, and drops a duplicate or a stray |alias. Counts, letter headings, the total
 * and the Jump to line are rebuilt by renderIndex. Returns { text, changed, added, removed, moved, renamed, filled, empty }; text is
 * the original, untouched, when nothing changed.
 */
function syncIndex(text, pages, summaries, renames, date) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const model = parseIndex(text);
  const out = { text, changed: false, added: [], removed: [], moved: [], renamed: [], filled: [], empty: [] };
  const want = new Map();
  for (const p of pages) if (!want.has(p.name)) want.set(p.name, p);
  const names = () => new Set(model.sections.flatMap((s) => s.entries.map((e) => e.name)));
  for (const [from, to] of renames || []) {
    const have = names();
    if (from === to || !have.has(from) || have.has(to) || !want.has(to)) continue;
    for (const sec of model.sections) for (const e of sec.entries) if (e.name === from) { e.text = e.text.replace("[[" + from, "[[" + to); e.name = to; out.renamed.push(to); }
  }
  const seen = new Set(), moving = [];
  for (const sec of model.sections) {
    sec.entries = sec.entries.filter((e) => {
      if (e.name === null) return true;
      const p = want.get(e.name);
      if (!p) { out.removed.push(e.name); return false; }
      if (seen.has(e.name)) return false;
      seen.add(e.name);
      e.text = e.text.replace(/^(- \[\[[^\]|]+)\|[^\]]*\]\]/, "$1]]");
      if (sec.title !== p.group) { out.moved.push(e.name); moving.push({ p, text: e.text }); return false; }
      if (isEmptyIndexLine(e.text) && summaries && summaries[e.name]) { e.text = indexLine(e.name, summaries[e.name]); out.filled.push(e.name); }
      return true;
    });
  }
  const place = (p, line) => {
    let sec = model.sections.find((s) => s.title === p.group);
    if (!sec) { sec = { title: p.group, entries: [], extra: [] }; model.sections.push(sec); }
    sec.entries.push({ name: p.name, text: line });
  };
  for (const m of moving) place(m.p, m.text);
  for (const [name, p] of want) if (!seen.has(name)) { place(p, indexLine(name, (summaries && summaries[name]) || "")); out.added.push(name); }
  for (const sec of model.sections) for (const e of sec.entries) if (e.name && isEmptyIndexLine(e.text)) out.empty.push(e.name);
  const oldDate = (/^updated:[ \t]*(.*?)\s*$/m.exec(text) || [])[1] || date;
  const before = renderIndex(parseIndex(text), oldDate);
  if (renderIndex(model, oldDate) === before) return out;
  out.changed = true;
  out.text = renderIndex(model, date).replace(/\n/g, eol);
  return out;
}

function oneLine(s) {
  return String(s).replace(/\s*\n\s*/g, " ").trim();
}

function flagName(f) {
  return `${f.label}${f.title ? " (" + f.title + ")" : ""}`;
}

function resolvedLines(resolved) {
  return resolved.map((r) => `    - ${flagName(r)} — ${oneLine(r.decision)}`);
}

function verifyLogEntry({ name, date, note, openFlags, resolved = [] }) {
  const lines = [`### [${date}] verify | ${name}`, "", "- **Verify:**", `  - Approved: [[${name}]]`];
  if (note) lines.push(`  - Revised: [[${name}]] — ${oneLine(note)}`);
  if (resolved.length) {
    lines.push(`  - Flags I resolved before approving (${resolved.length}):`);
    lines.push(...resolvedLines(resolved));
  }
  if (openFlags.length) {
    lines.push(`  - Flags still on the page when I approved it (${openFlags.length}): ` +
      openFlags.map(flagName).join("; "));
  }
  return lines.join("\n");
}

function rejectLogEntry({ name, date, reason, dangling, resolved = [] }) {
  const lines = [`### [${date}] verify | ${name} (rejected)`, "", "- **Verify:**",
    `  - Rejected: "${name}" — ${oneLine(reason)} (not saved)`];
  if (resolved.length) {
    lines.push(`  - Flags I had resolved before rejecting (${resolved.length}):`);
    lines.push(...resolvedLines(resolved));
  }
  if (dangling.length) lines.push(`  - Pages that still link to it: ${dangling.map((n) => `[[${n}]]`).join(", ")}`);
  return lines.join("\n");
}

/** Log headings, oldest first: { date, op, subject, rejected }. */
function parseLog(text) {
  const out = [];
  const re = /^#{2,4} \[(\d{4}-\d{2}-\d{2})\] ([A-Za-z-]+) \| (.+?)\s*$/gm;
  let m;
  while ((m = re.exec(text))) {
    let subject = m[3];
    let rejected = false;
    if (/\(rejected\)$/.test(subject)) { rejected = true; subject = subject.replace(/\s*\(rejected\)$/, ""); }
    out.push({ date: m[1], op: m[2].toLowerCase(), subject, rejected });
  }
  return out;
}

function describeEntry(e) {
  if (e.op === "verify") return e.rejected ? `Rejected ${e.subject}` : `Verified ${e.subject}`;
  const op = e.op === "health-check" ? "Health check" : e.op.charAt(0).toUpperCase() + e.op.slice(1);
  return `${op}: ${e.subject}`;
}

function renameLogEntry(date) {
  return [
    `### [${date}] setup | Renamed Home to Dashboard`, "",
    "- **Think:** The front page works as a dashboard, so it should be named like one.",
    "- **Calculate:** The Coppermind Review plugin renamed `Home.md` to `Dashboard.md` through Obsidian, which updated the links that pointed to it, and pointed the startup-page plugin at the new name.",
    "- **Verify:** pending. To check that the links to the Dashboard still work.",
  ].join("\n");
}

function addToLog(text, entry) {
  // The log is newest first: the entry goes just above the first existing entry, under the header.
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex((l) => /^#{2,4} \[\d{4}-\d{2}-\d{2}\] /.test(l));
  const added = entry.split(/\r?\n/);
  if (at === -1) return text.replace(/\s*$/, "") + eol + eol + added.join(eol) + eol; // no entries yet
  lines.splice(at, 0, ...added, "");
  return lines.join(eol);
}

/** The log file for a date "YYYY-MM-DD": _logs/_log 11-26.md for November 2026. */
function logPathFor(date) {
  const [y, m] = date.split("-");
  return `${LOG_DIR}/_log ${m}-${y.slice(2)}.md`;
}

/** True for a month's log file, _logs/_log MM-YY.md. */
function isLogPath(path) {
  return /^_logs\/_log \d{2}-\d{2}\.md$/.test(path);
}

/** Sort key of a month's log file (year, then month); -1 for any other path. */
function logOrder(path) {
  const m = /^_logs\/_log (\d{2})-(\d{2})\.md$/.exec(path);
  return m ? Number(m[2]) * 100 + Number(m[1]) : -1;
}

/** The first lines of a new month's log file, for the month of a date "YYYY-MM-DD". */
function logFileHeader(date) {
  const [y, m] = date.split("-").map(Number);
  const name = new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  return [
    "---", "type: log", "---",
    `A dated record of every ingest, query, health check, verification, schema change, and tool change, and what I approved, revised, or rejected. Newest entries are at the top, so a new entry goes just under the line below, above the newest one. Past entries are never rewritten. This file holds ${name}; each month has its own file in \`${LOG_DIR}/\`. Format and rules: \`_AGENTS.md\` and [[SCHEMA - Index and Log#The log]]. Agents: don't read this file whole; read only the first 15 or so lines to add an entry, and search the headings.`,
    "", "---",
  ].join("\n");
}

