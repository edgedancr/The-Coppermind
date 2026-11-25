"use strict";
/*
 * Nicrosil (the version is in manifest.json; the full guide is Wiki/Guides/Nicrosil.md)
 *
 * A nicrosil mind stores investiture and amplifies whoever draws on it. This plugin does the same for
 * the Coppermind: it holds the tools that make working in the vault faster. (Its folder and id are
 * `nicrosil`; they used to be `coppermind-review`.)
 *
 * 3.0.0 work so far:
 *  - Log entries no longer carry a suggested commit message.
 *  - Rating buttons (reliability A–F, credibility 1–6) on source cards, under the properties strip and on the
 *    review card. They write `reliability` and `credibility`; the agent's "Proposed B-2" line is marked on them.
 *  - A Triage link on the Dashboard, under Schema, that opens Ingestion/Triage.md.
 *  - The index keeps itself: _index.md gains, loses, renames and moves its lines (letter headings, counts, total and Jump to line
 *    included) when a page in Wiki/, Perspectives/ or Sources/Source Cards/ is added, removed, renamed or moved, and at startup.
 *    A new page's summary comes from its summary callout. "Update the index now" does it on demand; a setting turns it off.
 *  - "Respond to this page" (a header button and Alt+P) on pages in Wiki/, Sources/Source Cards/ and Perspectives/: makes
 *    Perspectives/Response to <page>.md from the Perspective template with `responds_to` set, opened beside the page. Each page
 *    shows a "My take" line under its properties that links the perspectives responding to it (drawn on screen; the page file is not changed).
 *
 * Review tools for draft pages (all in the sidebar and on hotkeys; no buttons on the page header):
 *  - verify-and-next and skip, so a review session never goes back to a list
 *  - a review queue in the right sidebar with progress and flag badges
 *  - "Resolve" on flag callouts: removes the callout and records my decision,
 *    which is written to the log when the page is verified or rejected
 *  - hotkeys and a status-bar counter
 *  - a search box for the Dashboard (```coppermind-search```): suggestion cards under it as I type,
 *    over wiki pages, source cards, and perspectives (not raw class notes); it only reads
 *  - Dashboard page blocks (```coppermind-hero```, -dashboard, -nav, -activity, -classes for the Notes dashboard, and tinmind-hero for its title), a ribbon
 *    logo button and Alt+D to go back to the Dashboard, and a one-time Home to Dashboard rename
 *  - "Log a schema change" (a pen button in the header of any page in SCHEMAS/, or the command palette): asks for the new
 *    version number and what I changed, then adds the line to _changelogs/Schema Changelog.md and keeps the `version` and
 *    `updated` properties of SCHEMAS/SCHEMA.md in step. It does not touch status, verified_on, or the log.
 *  - Monthly log: one file per month, _logs/_log MM-YY.md. When Obsidian opens in a new month (and before an entry is
 *    added in a new month), the new month's file is created with its header. Earlier months are left as they are.
 *
 * Transcription queue (3.16.0, Alt+T, the scan button in the Tinmind's sidebar, and a card on the Tinmind Dashboard): every note in The Tinmind
 *         with `transcription: draft` in its properties is checked here against the scans it came from (`scan_pages`). Since 3.28.0 it is a locked
 *         split: the scan on the left, and the note on the right in an ordinary Obsidian editor (Live Preview, spellcheck, plugins) with a review bar
 *         across its top (the note picker, previous and next, the course folder, the unsure words, Verify, Skip, Discard, Close). Both panes have no tabs, the other panes in
 *         the main area are hidden while it is open, and Close puts everything back. Drawing callouts (> [!drawing]) get three choices under the scan: keep a
 *         screenshot (a box dragged over the scan, saved to _attachments/Tinmind/ and embedded), recreate (the scan stays until the recreated drawing is
 *         checked) or leave out. Verify clears the draft mark, moves the scans to the trash and logs it; Discard deletes the draft and keeps the scans.
 *
 * The Lens (Alt+L; the relations panel before 3.29.0): for the open page, a map and grouped lists of its links, outgoing
 *         and incoming, typed links colored by type and plain links after them; its topic; pages two steps away it
 *         doesn't link with yet; and a trail of the pages opened before it.
 *
 * Atlas (Alt+M; the wiki map, 3.29.0): the topics in _topics.md as circles, every page as a dot in its topic's circle, and
 *         the links between topics as bands. Which topic a page is in is worked out from the links, spreading out from
 *         each topic's anchor pages; nobody tags pages. Click a topic to zoom in, a dot to trace its links.
 *
 * Verify: sets status: verified and verified_on, deletes `changes_since_verified` if the page has it,
 *         checks the page is listed in _index.md, and adds an entry at the top of the current month's log file.
 * Re-reviews: a draft that has a `changes_since_verified` list is a verified page the AI edited at my
 *         request. The queue lists these first, with an R badge, and the card shows what changed.
 * Reject: asks for a reason, logs it, removes the page from _index.md, and deletes the page
 *         (SCHEMA - Review: a rejected draft is deleted, never kept).
 * Nothing is committed to git; do that yourself afterward.
 */
const {
  Plugin, Modal, Notice, MarkdownView, TFile, ItemView, FuzzySuggestModal,
  PluginSettingTab, Setting, MarkdownRenderChild, MarkdownRenderer, setIcon, addIcon, debounce, parseYaml, Menu, TFolder,
  Platform, normalizePath,
} = require("obsidian");

const INDEX_PATH = "_index.md";
const NOTES_DIR = "The Tinmind/";                   // my own class notes (the Notes dashboard, one file per course, the all-notes page)
const NOTES_DASHBOARD = "The Tinmind/Tinmind Dashboard"; // opened by the Tinmind button (named Notes Dashboard before 3.2.0)
const OLD_NOTES_DASHBOARD = "The Tinmind/Notes Dashboard.md";
const GIT_BUTTONS = [ // the two git shortcuts in the left sidebar's tab bar (3.12.0); each runs one of Obsidian Git's own commands
  { cls: "cm-git-sync", icon: "arrow-up-circle", label: "Commit and push", command: "obsidian-git:push" },
  { cls: "cm-git-pull", icon: "download", label: "Pull", command: "obsidian-git:pull" },
];
const PANEL_BUTTONS = [ // the review queue and relations panel buttons in the same tab bar, before the git ones (3.13.0); the far-left ribbon that held them is hidden
  { cls: "cm-queue-btn", icon: "badge-check", label: "Review queue (Alt+Q)", method: "activateView" },
  { cls: "cm-rel-btn", icon: "git-fork", label: "Lens (Alt+L)", method: "activateRelations" },
  { cls: "cm-tr-btn", icon: "scan-text", label: "Transcription queue (Alt+T)", method: "activateTranscribe" }, // shows in the Tinmind's mode only (3.16.0)
];
const NOTEBOOK_PAGE = "The Tinmind/Notebook";  // the pinned Notebook (type: notebook, no semester): its card is on the Tinmind Dashboard in every semester (3.10.0)
const ALL_NOTES_PAGE = "The Tinmind/All Class Notes";  // opened by the All Class Notes row in the Tinmind's course tree
const SCAN_DIR = "Sources/Scans/";                 // shrunk photos of my handwritten notes, waiting to be checked against their transcription (3.16.0)
const TIN_DRAWINGS_DIR = "_attachments/Tinmind";   // drawings I keep as a screenshot from a scan (3.16.0)
const TR_VIEW_TYPE = "nicrosil-transcribe";

/** Sort key for a semester name such as "Fall 26" (year, then winter < spring < summer < fall); null when the name doesn't fit that shape. */
function semesterKey(name) {
  const m = /^(winter|spring|summer|fall|autumn)\s+(\d{2}|\d{4})$/i.exec(String(name).trim());
  if (!m) return null;
  let y = Number(m[2]);
  if (y < 100) y += 2000;
  return y * 10 + { winter: 0, spring: 1, summer: 2, fall: 3, autumn: 3 }[m[1].toLowerCase()];
}
const LOG_DIR = "_logs";                            // _logs/_log MM-YY.md, one file per month
const DASHBOARD_PATH = "_dashboard.md";          // the underscore keeps it out of the file list unless the eye button is on
const LEGACY_DASHBOARD_PATHS = ["Dashboard.md", "Home.md"]; // old names, still recognised if a vault has one
const SCHEMA_DIR = "SCHEMAS/";
const SCHEMA_PATH = "SCHEMAS/SCHEMA.md";           // the rules overview; holds the rulebook's version
const CHANGELOG_PATH = "_changelogs/Schema Changelog.md";
const OLD_HOME_PATH = "Home.md";
const VIEW_TYPE = "nicrosil-queue";
// The rule files in SCHEMAS/ and root-level .md files are reviewable too, but only count once they carry a status property.
const REVIEWABLE = [/^Wiki\//, /^Perspectives\//, /^Sources\/Source Cards\//, /^SCHEMAS\//, /^[^/]+\.md$/];
const GROUP_ORDER = ["Frameworks", "Concepts", "Case Studies", "Glossary", "People", "Summaries",
  "Prompts", "Workflows", "Guides", "Analyses", "Perspectives", "Source Cards", "Schemas", "Vault files"];
const FLAG_KINDS = {
  caution: { label: "Accuracy check", plural: "Accuracy checks", short: "A" },
  todo: { label: "Gap", plural: "Gaps", short: "G" },
  question: { label: "Question", plural: "Questions (whose view?)", short: "Q" },
  warning: { label: "Warning", plural: "Warnings (unsourced)", short: "W" },
};
const STALE_DAYS = 14;
const DEFAULT_SETTINGS = { autoAdvance: true, sort: "clean", celebrate: true, hidePanels: true, closeTabsOnStart: true, readMode: "verified", healthDays: 14, autoIndex: true };
const READ_MODES = { verified: "Verified pages only", all: "Every page", off: "Off" };
// Admiralty Code, as SCHEMA - Writing Pages lays it out: reliability of the source, credibility of the information.
const RATING_REL = [["A", "Completely reliable"], ["B", "Usually reliable"], ["C", "Fairly reliable"], ["D", "Not usually reliable"], ["E", "Unreliable"], ["F", "Cannot be judged"]];
const RATING_CRED = [["1", "Confirmed by other sources"], ["2", "Probably true"], ["3", "Possibly true"], ["4", "Doubtful"], ["5", "Improbable"], ["6", "Cannot be judged"]];
/** The "**Proposed B-2**" line the agent writes on a source card, as { rel, cred }, or null. */
function parseProposedRating(text) {
  const m = /\*\*Proposed ([A-F])-([1-6])\*\*/.exec(text || "");
  return m ? { rel: m[1], cred: m[2] } : null;
}
/** A card's rating from its properties: reliability is a letter A–F, credibility a digit 1–6; anything else counts as blank. */
function ratingOf(fm) {
  const rel = String((fm && fm.reliability) || "").trim().toUpperCase();
  const cred = String((fm && fm.credibility) || "").trim();
  return { rel: /^[A-F]$/.test(rel) ? rel : "", cred: /^[1-6]$/.test(cred) ? cred : "" };
}
const SORTS = { clean: "Clean pages first", flagged: "Flagged pages first", type: "By page type", az: "A to Z" };

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

/* ---------- small DOM helpers ---------- */

const prefersReduced = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const DASH_COLORS = ["#5fae9e", "#d98a4a", "#7aa2d6", "#e0a846", "#b97f93", "#8fc09a"];

/** Counts a number up from zero (the Dashboard tiles use this when it opens). */
function countUp(el, to, ms = 850) {
  if (!to) return;
  el.setText("0");
  const t0 = performance.now();
  const f = (now) => {
    const u = Math.min(1, (now - t0) / ms);
    el.setText(String(Math.round(to * (1 - Math.pow(1 - u, 3)))));
    if (u < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

function progressBar(parent, done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const wrap = parent.createDiv({ cls: "cm-progress" });
  wrap.createDiv({ cls: "cm-progress-fill" }).style.width = `${pct}%`;
  parent.createDiv({ cls: "cm-progress-label", text: `${done} of ${total} pages verified (${pct}%)` });
}

const BADGE_STATE = { seen: new Set(), primed: false };

function flagBadges(parent, flags, key) {
  const counts = {};
  flags.forEach((f) => { counts[f.kind] = (counts[f.kind] || 0) + 1; });
  const wrap = parent.createSpan({ cls: "cm-badges" });
  Object.keys(FLAG_KINDS).forEach((k) => {
    if (!counts[k]) return;
    const b = wrap.createSpan({ cls: `cm-badge cm-badge-${k}`, text: `${FLAG_KINDS[k].short}${counts[k] > 1 ? counts[k] : ""}` });
    if (key) {
      const bk = `${key}|${k}|${counts[k]}`;
      if (BADGE_STATE.primed && !BADGE_STATE.seen.has(bk)) b.addClass("is-new");
      BADGE_STATE.seen.add(bk);
    }
    b.setAttr("aria-label", `${counts[k]} ${counts[k] > 1 ? FLAG_KINDS[k].plural.toLowerCase() : FLAG_KINDS[k].label.toLowerCase()}`);
  });
  if (!flags.length) wrap.createSpan({ cls: "cm-badge cm-badge-clean", text: "✓" }).setAttr("aria-label", "No open flags");
  return wrap;
}

function changeBadge(parent, changes) {
  if (!changes || !changes.length) return null;
  const b = parent.createSpan({ cls: "cm-badge cm-badge-recheck", text: "R" });
  b.setAttr("aria-label", `Changed since verified: ${changes.length} change${changes.length > 1 ? "s" : ""}`);
  return b;
}

function confirmOnCtrlEnter(modal, button) {
  modal.scope.register(["Mod"], "Enter", () => { if (!button.disabled) button.click(); return false; });
}

/* ---------- dialogs ---------- */

class ReviewModal extends Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts; // { mode, name, flags, resolved, backlinks, onConfirm }
  }

  onOpen() {
    const { mode, name, flags, resolved, backlinks, onConfirm } = this.opts;
    const el = this.contentEl;
    this.modalEl.addClass("nicrosil-modal");
    el.empty();
    const isVerify = mode === "verify";
    el.createEl("h2", { text: isVerify ? `Verify “${name}”?` : `Reject “${name}”?` });

    if (isVerify) {
      el.createDiv({
        cls: "cm-sub",
        text: "This marks the page as verified, which means you checked it against the sources. It sets status and verified_on, updates the index, and adds a log entry.",
      });
      if (flags.length) {
        el.createDiv({ text: `${flags.length} flag${flags.length === 1 ? "" : "s"} still on this page:` });
        const ul = el.createEl("ul", { cls: "cm-flags" });
        flags.forEach((f) => ul.createEl("li", { text: flagName(f) }));
      } else {
        el.createDiv({ cls: "cm-ok", text: "No open flags on this page." });
      }
    } else {
      el.createDiv({
        cls: "cm-sub",
        text: "A rejected draft is deleted (SCHEMA - Review). The reason is saved in the log. Obsidian's trash setting decides where the file goes, and git also keeps its history.",
      });
      if (backlinks.length) {
        el.createDiv({ text: `${backlinks.length} page${backlinks.length === 1 ? "" : "s"} link to this page and will have a broken link:` });
        const ul = el.createEl("ul", { cls: "cm-links" });
        backlinks.forEach((n) => ul.createEl("li", { text: n }));
      }
    }
    if (resolved && resolved.length) {
      el.createDiv({ text: `Flags you resolved on this page (these go in the log entry):` });
      const ul = el.createEl("ul", { cls: "cm-resolved" });
      resolved.forEach((r) => ul.createEl("li", { text: `${flagName(r)}: ${oneLine(r.decision)}` }));
    }

    let confirmed = !(isVerify && flags.length);
    if (isVerify && flags.length) {
      const row = el.createDiv({ cls: "cm-check" });
      const cb = row.createEl("input", { type: "checkbox" });
      row.createSpan({ text: "I've dealt with these flags and want to verify anyway." });
      cb.addEventListener("change", () => { confirmed = cb.checked; refresh(); });
    }

    el.createDiv({
      text: isVerify
        ? "What did you change or fix, and why? (optional; leave blank if nothing)"
        : "Why are you rejecting it? (required)",
    });
    const ta = el.createEl("textarea");
    ta.addEventListener("input", refresh);

    const buttons = el.createDiv({ cls: "cm-buttons" });
    buttons.createSpan({ cls: "cm-hint", text: "Ctrl+Enter to confirm" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    const go = buttons.createEl("button", {
      text: isVerify ? "Verify" : "Reject and delete",
      cls: isVerify ? "mod-cta" : "cm-danger",
    });
    cancel.addEventListener("click", () => this.close());
    go.addEventListener("click", async () => {
      go.disabled = true;
      this.close();
      await onConfirm(ta.value.trim());
    });
    confirmOnCtrlEnter(this, go);

    function refresh() {
      go.disabled = !confirmed || (!isVerify && ta.value.trim().length === 0);
    }
    refresh();
    setTimeout(() => ta.focus(), 50);
  }

  onClose() { this.contentEl.empty(); }
}

class ResolveModal extends Modal {
  constructor(app, flag, onConfirm) {
    super(app);
    this.flag = flag;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const el = this.contentEl;
    this.modalEl.addClass("nicrosil-modal");
    el.empty();
    el.createEl("h2", { text: `Resolve: ${flagName(this.flag)}` });
    if (this.flag.body) el.createDiv({ cls: `cm-flagbody cm-flagbody-${this.flag.kind}`, text: this.flag.body });
    el.createDiv({
      cls: "cm-sub",
      text: "Resolving removes this callout from the page. If the claim needed correcting, edit the page text first. Your decision is saved and written to the log when you verify or reject the page.",
    });
    el.createDiv({ text: "What did you decide? (required)" });
    const ta = el.createEl("textarea");
    const buttons = el.createDiv({ cls: "cm-buttons" });
    buttons.createSpan({ cls: "cm-hint", text: "Ctrl+Enter to confirm" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    const go = buttons.createEl("button", { text: "Resolve flag", cls: "mod-cta" });
    const refresh = () => { go.disabled = ta.value.trim().length === 0; };
    ta.addEventListener("input", refresh);
    cancel.addEventListener("click", () => this.close());
    go.addEventListener("click", async () => {
      go.disabled = true;
      this.close();
      await this.onConfirm(ta.value.trim());
    });
    confirmOnCtrlEnter(this, go);
    refresh();
    setTimeout(() => ta.focus(), 50);
  }

  onClose() { this.contentEl.empty(); }
}

class FlagPicker extends FuzzySuggestModal {
  constructor(app, flags, onChoose) {
    super(app);
    this.flags = flags;
    this.onChoose = onChoose;
    this.setPlaceholder("Which flag do you want to resolve?");
  }
  getItems() { return this.flags; }
  getItemText(f) { return `${flagName(f)} — ${oneLine(f.body).slice(0, 90)}`; }
  onChooseItem(f) { this.onChoose(f); }
}

/** When a page already has responses: open one of them, or start another. */
class ResponsePicker extends FuzzySuggestModal {
  constructor(app, existing, onChoose) {
    super(app);
    this.items = [...existing.map((f) => ({ file: f })), { fresh: true }];
    this.onChoose = onChoose;
    this.setPlaceholder("This page already has a response. Open it, or write another?");
  }
  getItems() { return this.items; }
  getItemText(i) { return i.fresh ? "Write a new response" : `Open: ${i.file.basename}`; }
  onChooseItem(i) { this.onChoose(i); }
}

/* ---------- sidebar queue ---------- */

class QueueView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Review queue"; }
  getIcon() { return "badge-check"; }
  async onOpen() { this.render(); }
  async onClose() { this.containerEl.children[1].empty(); }

  render() {
    const p = this.plugin;
    const root = this.containerEl.children[1];
    const before = new Map();
    root.querySelectorAll(".cm-row[data-path]").forEach((r) => before.set(r.getAttribute("data-path"), r.getBoundingClientRect().top));
    root.empty();
    root.addClass("cm-queue");

    const all = p.items;
    const drafts = all.filter((i) => i.status === "draft");
    const verified = all.filter((i) => i.status === "verified");
    root.createEl("h4", { text: "Review queue" });
    progressBar(root, verified.length, all.length);

    // controls
    const controls = root.createDiv({ cls: "cm-controls" });
    const sel = controls.createEl("select", { cls: "dropdown" });
    Object.entries(SORTS).forEach(([k, v]) => {
      const o = sel.createEl("option", { text: v, value: k });
      if (k === p.settings.sort) o.selected = true;
    });
    sel.addEventListener("change", async () => { p.settings.sort = sel.value; await p.persist(); p.renderAll(); });
    const auto = controls.createEl("label", { cls: "cm-auto" });
    const cb = auto.createEl("input", { type: "checkbox" });
    cb.checked = p.settings.autoAdvance;
    auto.appendText(" Open next after verify");
    cb.addEventListener("change", async () => { p.settings.autoAdvance = cb.checked; await p.persist(); });

    // current page card
    const cur = p.currentFile();
    const curItem = cur && all.find((i) => i.path === cur.path);
    if (curItem && curItem.status === "draft") {
      const card = root.createDiv({ cls: "cm-card" });
      card.createDiv({ cls: "cm-card-label", text: "Reviewing" });
      card.createDiv({ cls: "cm-card-title", text: curItem.name });
      if (curItem.changes.length) {
        const box = card.createDiv({ cls: "cm-changes" });
        box.createDiv({ cls: "cm-changes-head", text: "Changed since verified" });
        const cl = box.createEl("ul");
        curItem.changes.forEach((c) => drawChangeLine(cl.createEl("li"), p, curItem.path, c));
      }
      if (curItem.flags.length) {
        const ul = card.createEl("ul", { cls: "cm-card-flags" });
        curItem.flags.forEach((f) => {
          const li = ul.createEl("li", { cls: `cm-flag-${f.kind}` });
          li.createSpan({ text: flagName(f) });
          const b = li.createEl("button", { cls: "cm-mini", text: "Resolve" });
          b.addEventListener("click", () => p.startResolve(cur, f));
        });
      } else {
        card.createDiv({ cls: "cm-ok", text: "No open flags." });
      }
      if (p.isSourceCard(cur)) p.drawRatingButtons(card.createDiv({ cls: "cm-ratebar cm-ratebar-card" }), cur);
      const pending = p.resolvedFor(cur.path);
      if (pending.length) card.createDiv({ cls: "cm-pending", text: `${pending.length} flag${pending.length > 1 ? "s" : ""} resolved; logged when you verify.` });
      const row = card.createDiv({ cls: "cm-card-buttons" });
      const mk = (text, cls, fn, hk) => {
        const b = row.createEl("button", { text, cls });
        b.setAttr("aria-label", hk);
        b.addEventListener("click", fn);
      };
      mk("Verify", "mod-cta", () => p.verify(cur), "Alt+V");
      mk("Skip", "", () => p.skip(cur), "Alt+S");
      mk("Reject", "cm-danger", () => p.reject(cur), "Alt+R");
    } else {
      const start = root.createDiv({ cls: "cm-card" });
      start.createDiv({ cls: "cm-card-label", text: curItem ? `“${curItem.name}” is verified` : "Not reviewing a draft" });
      const b = start.createEl("button", { cls: "mod-cta cm-gbtn", text: drafts.length ? "Open next draft" : "Queue is empty" });
      b.disabled = !drafts.length;
      b.setAttr("aria-label", "Alt+N");
      b.addEventListener("click", (e) => p.openNext(cur ? cur.path : null, undefined, e.ctrlKey || e.metaKey));
    }

    // the queue
    const order = p.queue();
    const rechecks = order.filter((i) => i.changes.length);
    const fresh = order.filter((i) => !i.changes.length);
    const drawRows = (title, rows) => {
      const list = root.createDiv({ cls: "cm-list" });
      list.createDiv({ cls: "cm-list-head", text: `${title} (${rows.length})` });
      let lastGroup = null;
      rows.forEach((item) => {
        if (p.settings.sort === "type" && item.group !== lastGroup) {
          list.createDiv({ cls: "cm-group", text: item.group });
          lastGroup = item.group;
        }
        const row = list.createDiv({ cls: "cm-row" });
        if (cur && item.path === cur.path) row.addClass("is-current");
        if (p.skipped.includes(item.path)) row.addClass("is-skipped");
        if (item.changes.length) row.addClass("has-changes");
        if (item.flags.length) row.addClass("has-flags");
        const nameEl = row.createDiv({ cls: "cm-row-name", text: item.name });
        if (p.settings.sort !== "type") nameEl.createSpan({ cls: "cm-row-group", text: item.group });
        changeBadge(row, item.changes);
        flagBadges(row, item.flags, item.path);
        row.setAttr("data-path", item.path);
        row.addEventListener("click", (e) => p.openFile(item.path, e.ctrlKey || e.metaKey));
      });
    };
    if (rechecks.length) drawRows("Changed since verified", rechecks);
    drawRows(rechecks.length ? "New drafts" : "Drafts", fresh);

    if (verified.length) {
      const det = root.createEl("details", { cls: "cm-verified" });
      det.createEl("summary", { text: `Verified (${verified.length})` });
      verified.sort((a, b) => a.name.localeCompare(b.name)).forEach((item) => {
        const row = det.createDiv({ cls: "cm-row" });
        row.createDiv({ cls: "cm-row-name", text: item.name });
        row.addEventListener("click", (e) => p.openFile(item.path, e.ctrlKey || e.metaKey));
      });
    }
    BADGE_STATE.primed = true;
    // rows that moved slide from their old place to their new one
    if (before.size && !prefersReduced()) {
      root.querySelectorAll(".cm-row[data-path]").forEach((r) => {
        const old = before.get(r.getAttribute("data-path"));
        if (old === undefined) return;
        const d = old - r.getBoundingClientRect().top;
        if (Math.abs(d) < 3) return;
        r.style.transition = "none";
        r.style.transform = `translateY(${d}px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transition = "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)"; r.style.transform = ""; }));
      });
    }
  }
}

/* ---------- Transcription queue (3.16.0) ---------- */

/** Asks before a transcription is verified: it moves its scans to the trash. `unsure` unsure words need a tick. */
/** Checks a new name typed for a note in the transcription queue (3.17.0). Returns { ok, name } or { ok: false, error }. */
function cleanNoteName(raw) {
  const n = String(raw || "").trim().replace(/\.md$/i, "").trim();
  if (!n) return { ok: false, error: "A note needs a name." };
  const bad = n.match(/[\\/:*?"<>|#^\[\]]/);
  if (bad) return { ok: false, error: `A note's name can't contain ${bad[0]}` };
  if (n.startsWith(".")) return { ok: false, error: "A note's name can't start with a dot." };
  return { ok: true, name: n };
}

class TranscribeVerifyModal extends Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts; // { name, scans: [{ name, keep }], unsure, onConfirm }
  }

  onOpen() {
    const { name, scans, unsure, onConfirm } = this.opts;
    const el = this.contentEl;
    this.modalEl.addClass("nicrosil-modal");
    el.empty();
    el.createEl("h2", { text: `Verify “${name}”?` });
    el.createDiv({
      cls: "cm-sub",
      text: "This means you checked the transcription against the scan. It removes the transcription and scan_pages properties from the note and adds a log entry. The scans below go to the trash, so Obsidian's trash setting decides whether they can still be recovered.",
    });
    const goners = scans.filter((s) => !s.keep);
    const keepers = scans.filter((s) => s.keep);
    if (goners.length) {
      el.createDiv({ text: `${goners.length} scan${goners.length === 1 ? "" : "s"} will be moved to the trash:` });
      const ul = el.createEl("ul", { cls: "cm-links" });
      goners.forEach((s) => ul.createEl("li", { text: s.name }));
    }
    if (keepers.length) {
      el.createDiv({ text: `${keepers.length} stay, because another unverified note lists the same page:` });
      const ul = el.createEl("ul", { cls: "cm-links" });
      keepers.forEach((s) => ul.createEl("li", { text: s.name }));
    }
    let confirmed = !unsure;
    if (unsure) {
      const row = el.createDiv({ cls: "cm-check" });
      const cb = row.createEl("input", { type: "checkbox" });
      row.createSpan({ text: `${unsure} unsure word${unsure === 1 ? " is" : "s are"} still in the note. Verify anyway (the scan will be gone).` });
      cb.addEventListener("change", () => { confirmed = cb.checked; refresh(); });
    }
    const buttons = el.createDiv({ cls: "cm-buttons" });
    buttons.createSpan({ cls: "cm-hint", text: "Ctrl+Enter to confirm" });
    buttons.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    const go = buttons.createEl("button", { text: goners.length ? "Verify and delete scans" : "Verify", cls: "mod-cta" });
    go.addEventListener("click", async () => { go.disabled = true; this.close(); await onConfirm(); });
    confirmOnCtrlEnter(this, go);
    const refresh = () => { go.disabled = !confirmed; };
    refresh();
  }

  onClose() { this.contentEl.empty(); }
}

/**
 * The Transcription queue (3.28.0): a locked split. The scan is on the left (this view); the note is on the right in an ordinary Obsidian editor
 * (Live Preview, spellcheck, every plugin), with the review bar (the note picker, previous and next, the course folder, the unsure words, Verify, Skip, Discard, Close) across its top. The two
 * panes are made by the queue and have no tabs; every other pane in the main area is hidden while the queue is open and comes back when it closes.
 * The note is never held in a text box of our own: edits to it (leaving out a drawing, accepting a guess, keeping a screenshot) are made in the editor,
 * so Obsidian's undo and autosave look after them.
 */
class TranscribeView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.path = null;       // the note being reviewed
    this.noteLeaf = null;   // the pane that holds it: an ordinary Obsidian editor
    this.bar = null;        // the review bar, drawn at the top of that pane
    this.barSig = "";       // what the bar was last drawn for (the note), to tell when it needs drawing again
    this.pages = [];        // the scan names the note lists
    this.page = 0;          // which of them is showing
    this.zoom = 100;        // scan width as a percent of its pane
    this.cropFor = null;    // the drawing a screenshot is being chosen for
    this.cropRect = null;   // { x, y, w, h } as fractions of the scan
    this.trayOpen = true;   // the drawings under the scan are open
    this.decisions = {};    // note path -> [{ label, decision }], for the log
    this.busy = false;
    this.building = false;  // the queue is making or filling its own panes, so Obsidian's "active pane changed" is not me leaving
    this.closing = false;
    this.sig = "";          // what the list looked like when it was last drawn
    this.checksSoon = debounce(() => this.renderChecks(), 250, true);
    this.watchSoon = debounce(() => this.checkNoteLeaf(), 150, true);
    // a note came or went, or a scan did: redraw, unless I am choosing a screenshot
    this.refreshSoon = debounce(() => {
      if (this.cropFor || this.building || this.closing) return;
      if (this.listSig() !== this.sig) this.render();
    }, 400, true);
  }

  /** A short description of the queue (which notes, their scans, how many scans are not in a note), to tell when it has changed. */
  listSig() {
    const items = this.plugin.pendingTranscriptions();
    return items.map((i) => i.file.path + "|" + i.pages.join(",")).join("¦") + "¦" + this.plugin.scansWaiting(items).length;
  }

  getViewType() { return TR_VIEW_TYPE; }
  getDisplayText() { return "Transcription scan"; }
  getIcon() { return "scan-text"; }

  async onOpen() {
    const ws = this.app.workspace;
    this.containerEl.addClass("cm-tr-leaf");
    this.registerEvent(this.app.metadataCache.on("changed", (f) => this.onNoteChanged(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => { if (f.path.startsWith(NOTES_DIR) || f.path.startsWith(SCAN_DIR)) this.refreshSoon(); }));
    this.registerEvent(this.app.vault.on("create", (f) => { if (f.path.startsWith(SCAN_DIR)) this.refreshSoon(); }));
    // a note was renamed (here, or anywhere): keep showing it under its new name
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => {
      if (!f.path.startsWith(NOTES_DIR) && !oldPath.startsWith(NOTES_DIR)) return;
      if (oldPath === this.path) this.path = f.path;
      if (this.decisions[oldPath]) { this.decisions[f.path] = this.decisions[oldPath]; delete this.decisions[oldPath]; }
      this.refreshSoon();
    }));
    // typing in the note: the drawing and unsure-word counts follow
    this.registerEvent(ws.on("editor-change", (ed, info) => { if (info && info.file && info.file.path === this.path) this.checksSoon(); }));
    this.registerEvent(ws.on("layout-change", () => this.watchSoon()));
    this.registerEvent(ws.on("file-open", () => this.watchSoon()));
    this.registerEvent(ws.on("active-leaf-change", (leaf) => this.onLeafChange(leaf)));
    await this.render();
  }

  async onClose() {
    await this.closeLayout();
    this.contentEl.empty();
  }

  /* --- the two panes --- */

  noteView() {
    const l = this.noteLeaf;
    return l && l.view instanceof MarkdownView ? l.view : null;
  }

  leafAlive(l) {
    if (!l) return false;
    let hit = false;
    this.app.workspace.iterateAllLeaves((x) => { if (x === l) hit = true; });
    return hit;
  }

  /** The note as it is in the editor now (properties included). Empty when the right pane isn't showing the queue's note. */
  text() {
    const v = this.noteView();
    return v && v.file && v.file.path === this.path ? v.editor.getValue() : "";
  }

  async saveNote() {
    const v = this.noteView();
    if (!v || !v.file) return;
    try { await v.save(); } catch (e) { console.error("Nicrosil: couldn't save the note", e); }
  }

  /** Puts `next` in the editor in place of what is there, replacing only the part that differs, so the cursor and Obsidian's undo stay put. Then saves. */
  async applyText(next) {
    const v = this.noteView();
    if (!v || !v.file || v.file.path !== this.path) return false;
    const ed = v.editor, cur = ed.getValue();
    if (next === cur) return true;
    const max = Math.min(cur.length, next.length);
    let a = 0;
    while (a < max && cur.charCodeAt(a) === next.charCodeAt(a)) a++;
    let b = 0;
    while (b < max - a && cur.charCodeAt(cur.length - 1 - b) === next.charCodeAt(next.length - 1 - b)) b++;
    ed.replaceRange(next.slice(a, next.length - b), ed.offsetToPos(a), ed.offsetToPos(cur.length - b));
    await this.saveNote();
    return true;
  }

  /** Makes the right-hand pane, beside this one, if it isn't there. */
  async ensureNoteLeaf() {
    if (this.leafAlive(this.noteLeaf)) return;
    this.building = true;
    try {
      this.noteLeaf = this.app.workspace.createLeafBySplit(this.leaf, "vertical");
    } finally { this.building = false; }
  }

  async openInNote(file) {
    if (!this.leafAlive(this.noteLeaf) || !(file instanceof TFile)) return;
    this.building = true;
    try {
      await this.noteLeaf.openFile(file, { active: false, state: { mode: "source", source: false } }); // Live Preview
    } finally { this.building = false; }
  }

  /** Closes the right-hand pane (nothing is waiting, or the queue is closing). */
  async dropNoteLeaf() {
    if (this.leafAlive(this.noteLeaf)) {
      await this.saveNote();
      this.building = true;
      try { this.noteLeaf.detach(); } finally { this.building = false; }
    }
    this.noteLeaf = null;
  }

  /** The two panes get no tab strip, and every other pane in the main area is hidden until the queue closes. */
  syncLock() {
    const mine = new Set();
    [this.leaf, this.noteLeaf].forEach((l) => {
      const g = l && l.containerEl && l.containerEl.closest(".workspace-tabs");
      if (g) { g.classList.add("cm-tr-locked"); mine.add(g); }
    });
    this.app.workspace.iterateRootLeaves((l) => {
      const g = l.containerEl && l.containerEl.closest(".workspace-tabs");
      if (g && !mine.has(g)) g.classList.add("cm-tr-hidden");
    });
    document.body.classList.add("cm-tr-on");
  }

  unlock() {
    document.querySelectorAll(".workspace-tabs.cm-tr-hidden").forEach((el) => el.classList.remove("cm-tr-hidden"));
    document.querySelectorAll(".workspace-tabs.cm-tr-locked").forEach((el) => el.classList.remove("cm-tr-locked"));
    document.body.classList.remove("cm-tr-on");
  }

  removeBar() {
    if (this.bar) this.bar.remove();
    this.bar = null;
    this.barSig = "";
    this.verifyBtn = null;
    this.unsureEl = null;
  }

  async closeLayout() {
    if (this.closing) return;
    this.closing = true;
    try {
      await this.dropNoteLeaf();
      this.removeBar();
      this.unlock();
    } finally { this.closing = false; }
  }

  /** The Close button: both panes go and the main area is as it was. */
  async closeQueue() {
    await this.saveNote();
    this.leaf.detach();
  }

  /** The main area was moved to another page (the Dashboard, a link opened in a new tab): that is leaving the queue. */
  onLeafChange(leaf) {
    if (this.building || this.closing || !leaf || leaf === this.leaf || leaf === this.noteLeaf) return;
    if (leaf.getRoot && leaf.getRoot() !== this.app.workspace.rootSplit) return; // a sidebar
    this.closeQueue();
  }

  /** Something changed in the layout: the right pane may show another note, or have gone. */
  checkNoteLeaf() {
    if (this.building || this.closing || this.busy) return;
    const items = this.plugin.pendingTranscriptions();
    if (items.length && !this.leafAlive(this.noteLeaf)) { this.render(); return; } // the note's pane was closed (a discarded note takes it with it)
    const v = this.noteView();
    if (!v) return;
    const f = v.file;
    if (f && f.path !== this.path) {
      const hit = items.find((i) => i.file.path === f.path);
      if (hit) { this.path = f.path; this.page = 0; this.cropFor = null; this.cropRect = null; this.render(); return; } // another waiting note was opened: follow it
    }
    const sig = f ? f.path : "";
    if (sig !== this.barSig) this.drawBar();
    this.syncLock();
  }

  /* --- drawing the queue --- */

  currentItem(items) {
    return items.find((i) => i.file.path === this.path) || null;
  }

  async onNoteChanged(file) {
    if (!file || !file.path.startsWith(NOTES_DIR)) return;
    if (file.path === this.path && !this.cropFor) this.checksSoon();
    this.refreshSoon();
  }

  async render() {
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    try {
      await this.draw();
    } finally {
      this.busy = false;
      if (this.again) { this.again = false; this.render(); }
    }
  }

  async draw() {
    const p = this.plugin;
    const root = this.contentEl;
    root.empty();
    root.addClass("cm-tr");
    const items = p.pendingTranscriptions();
    if (!this.currentItem(items)) { this.path = items.length ? items[0].file.path : null; this.page = 0; this.cropFor = null; }
    const item = this.currentItem(items);
    const waiting = p.scansWaiting(items);
    this.sig = this.listSig();

    if (!item) {
      await this.dropNoteLeaf();
      this.removeBar();
      const head = root.createDiv({ cls: "cm-tr-head" });
      head.createEl("h4", { text: "Transcription queue", cls: "cm-tin-gradient-style" });
      head.createEl("button", { cls: "cm-mini cm-tr-x", text: "Close" }).addEventListener("click", () => this.closeQueue());
      const empty = root.createDiv({ cls: "cm-tr-empty" });
      empty.createDiv({ cls: "cm-card-label", text: "Nothing to review" });
      empty.createDiv({ text: "When Claude transcribes scans, each note it makes (with transcription: draft in its properties) shows up here, next to its scan." });
      empty.createDiv({ cls: "cm-sub", text: waiting.length ? `${waiting.length} scan${waiting.length === 1 ? "" : "s"} in Sources/Scans are not in any note yet.` : "There are no scans waiting in Sources/Scans." });
      this.syncLock();
      return;
    }

    await this.ensureNoteLeaf();
    const nv = this.noteView();
    if (!nv || !nv.file || nv.file.path !== item.file.path) await this.openInNote(item.file);
    this.pages = item.pages;
    if (this.page >= this.pages.length) this.page = 0;

    this.scanPane = root.createDiv({ cls: "cm-tr-scan" });
    this.checksEl = root.createDiv({ cls: "cm-tr-checks" });
    this.syncLock();
    this.drawBar();
    this.renderChecks();
    await this.drawScan();
  }

  /** The review bar across the top of the note: where you are in the queue, the buttons, and the unsure words. */
  drawBar() {
    const p = this.plugin;
    const v = this.noteView();
    if (!v) return;
    let bar = this.bar;
    if (!bar || !bar.isConnected || bar.parentElement !== v.containerEl) {
      if (bar) bar.remove();
      bar = createDiv({ cls: "cm-tr-bar" });
      v.containerEl.insertBefore(bar, v.containerEl.querySelector(":scope > .view-content"));
      this.bar = bar;
    }
    bar.empty();
    this.verifyBtn = null;
    this.unsureEl = null;
    const items = p.pendingTranscriptions();
    const item = this.currentItem(items);
    this.barSig = v.file ? v.file.path : "";
    if (!item) return;
    const waiting = p.scansWaiting(items);
    const idx = items.findIndex((i) => i.file.path === item.file.path);
    const file = item.file;

    // the pane was moved to a note that isn't waiting here: say so, and offer the way back
    if (v.file && v.file.path !== file.path) {
      const top = bar.createDiv({ cls: "cm-trb-top" });
      top.createEl("h4", { text: "Transcription queue", cls: "cm-tin-gradient-style cm-trb-title" });
      top.createSpan({ cls: "cm-tr-count", text: `This pane is showing “${v.file.basename}”, not the note you were checking.` });
      const sub = bar.createDiv({ cls: "cm-trb-sub" });
      const act = sub.createDiv({ cls: "cm-trb-actions" });
      act.createEl("button", { text: `Back to “${file.basename}”`, cls: "mod-cta" }).addEventListener("click", async () => { await this.openInNote(file); this.drawBar(); this.renderChecks(); });
      act.createEl("button", { cls: "cm-mini", text: "Close" }).addEventListener("click", () => this.closeQueue());
      return;
    }

    const top = bar.createDiv({ cls: "cm-trb-top" });
    top.createEl("h4", { text: "Transcription queue", cls: "cm-tin-gradient-style cm-trb-title" });
    top.createSpan({ cls: "cm-tr-count", text: `${idx + 1} of ${items.length}` });
    const sel = top.createEl("select", { cls: "dropdown cm-tr-select" });
    items.forEach((i) => {
      const o = sel.createEl("option", { text: i.file.basename, value: i.file.path });
      if (i.file.path === file.path) o.selected = true;
    });
    sel.addEventListener("change", () => this.go(sel.value));
    const prev = top.createEl("button", { cls: "cm-mini", text: "◀" });
    const next = top.createEl("button", { cls: "cm-mini", text: "▶" });
    prev.setAttr("aria-label", "Previous note");
    next.setAttr("aria-label", "Next note");
    prev.disabled = next.disabled = items.length < 2;
    prev.addEventListener("click", () => this.go(items[(idx + items.length - 1) % items.length].file.path));
    next.addEventListener("click", () => this.go(items[(idx + 1) % items.length].file.path));

    // the second row: the course folder at the left, then the unsure words, and the buttons at the right (the top right of the window is under the window controls)
    const sub = bar.createDiv({ cls: "cm-trb-sub" });
    sub.createSpan({ cls: "cm-tr-where", text: file.parent ? file.parent.path.replace(NOTES_DIR, "") : "" });
    this.unsureEl = sub.createDiv({ cls: "cm-trb-unsure" });
    if (waiting.length) sub.createSpan({ cls: "cm-tr-waiting", text: `${waiting.length} scan${waiting.length === 1 ? "" : "s"} not in a note yet` });

    const act = sub.createDiv({ cls: "cm-trb-actions" });
    const verify = act.createEl("button", { text: "Verify", cls: "mod-cta" });
    verify.setAttr("aria-label", "I checked this against the scan: remove the scan and clear the draft mark");
    verify.addEventListener("click", () => this.verify(item));
    act.createEl("button", { text: "Skip" }).addEventListener("click", () => this.skip(items, idx));
    const discard = act.createEl("button", { text: "Discard transcription", cls: "cm-danger" });
    discard.setAttr("aria-label", "Delete this draft note and keep the scans, so it can be redone");
    discard.addEventListener("click", () => this.discard(item, items, idx));
    const x = act.createEl("button", { cls: "cm-mini cm-tr-x", text: "Close" });
    x.setAttr("aria-label", "Close the queue and get the other panes back");
    x.addEventListener("click", () => this.closeQueue());
    this.verifyBtn = verify;
  }

  async setMode(mode) {
    const v = this.noteView();
    if (!v || v.getMode() === mode) return;
    try { await v.setState({ ...v.getState(), mode, source: false }, { history: false }); } catch (e) { console.error("Nicrosil: couldn't switch the note's view", e); }
    this.drawBar();
    this.renderChecks();
  }

  async go(path) {
    await this.saveNote();
    this.path = path;
    this.page = 0;
    this.cropFor = null;
    this.cropRect = null;
    await this.render();
  }

  /* --- the scan (left) --- */

  scanFile(name) {
    const f = this.app.vault.getAbstractFileByPath(scanPath(name));
    return f instanceof TFile ? f : null;
  }

  async drawScan() {
    const pane = this.scanPane;
    if (!pane || !pane.isConnected) return;
    pane.empty();
    const name = this.pages[this.page];
    const bar = pane.createDiv({ cls: "cm-tr-scanbar" });
    const tabs = bar.createDiv({ cls: "cm-tr-tabs" });
    this.pages.forEach((n, i) => {
      const t = tabs.createEl("button", { cls: "cm-mini" + (i === this.page ? " is-on" : ""), text: this.pages.length > 1 ? `Page ${i + 1}` : "Scan" });
      t.setAttr("aria-label", n);
      t.addEventListener("click", () => { if (this.cropFor) { new Notice("Finish or cancel the screenshot first."); return; } this.page = i; this.drawScan(); });
    });
    if (name) tabs.createSpan({ cls: "cm-tr-file", text: name });
    const zoom = bar.createDiv({ cls: "cm-tr-zoom" });
    const setZoom = (z) => { this.zoom = Math.max(50, Math.min(400, z)); if (this.wrap) this.wrap.style.width = this.zoom + "%"; zlabel.setText(this.zoom + "%"); };
    zoom.createEl("button", { cls: "cm-mini", text: "−" }).addEventListener("click", () => setZoom(this.zoom - 25));
    const zlabel = zoom.createSpan({ cls: "cm-tr-zlabel", text: this.zoom + "%" });
    zoom.createEl("button", { cls: "cm-mini", text: "+" }).addEventListener("click", () => setZoom(this.zoom + 25));
    zoom.createEl("button", { cls: "cm-mini", text: "Fit" }).addEventListener("click", () => setZoom(100));

    if (this.cropFor) {
      const banner = pane.createDiv({ cls: "cm-tr-cropbar" });
      banner.createSpan({ text: "Drag a box over the drawing, then Save." });
      this.cropSave = banner.createEl("button", { cls: "cm-mini mod-cta", text: "Save screenshot" });
      this.cropSave.disabled = true;
      this.cropSave.addEventListener("click", () => this.saveCrop(false));
      banner.createEl("button", { cls: "cm-mini", text: "Whole page" }).addEventListener("click", () => this.saveCrop(true));
      banner.createEl("button", { cls: "cm-mini", text: "Cancel" }).addEventListener("click", () => { this.cropFor = null; this.cropRect = null; this.drawScan(); });
    }

    const view = pane.createDiv({ cls: "cm-tr-scanview" });
    const file = name ? this.scanFile(name) : null;
    if (!name) { view.createDiv({ cls: "cm-sub cm-tr-missing", text: "This note doesn't list a scan (scan_pages in its properties)." }); return; }
    if (!file) { view.createDiv({ cls: "cm-sub cm-tr-missing", text: `${name} isn't in Sources/Scans. If this note is already checked, verify it to clear the draft mark.` }); return; }
    const wrap = view.createDiv({ cls: "cm-tr-imgwrap" });
    wrap.style.width = this.zoom + "%";
    this.wrap = wrap;
    const img = wrap.createEl("img", { cls: "cm-tr-img" });
    img.src = this.app.vault.getResourcePath(file);
    img.draggable = false;
    if (this.cropFor) this.drawCropLayer(wrap);
  }

  /** A transparent layer over the scan that turns a drag into a box (kept as fractions of the scan, so zooming doesn't move it). */
  drawCropLayer(wrap) {
    const layer = wrap.createDiv({ cls: "cm-tr-croplayer" });
    const box = layer.createDiv({ cls: "cm-tr-cropbox" });
    box.style.display = "none";
    let start = null;
    const frac = (e) => {
      const r = layer.getBoundingClientRect();
      return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
    };
    const paint = () => {
      const c = this.cropRect;
      if (!c) { box.style.display = "none"; return; }
      box.style.display = "block";
      box.style.left = c.x * 100 + "%"; box.style.top = c.y * 100 + "%";
      box.style.width = c.w * 100 + "%"; box.style.height = c.h * 100 + "%";
    };
    layer.addEventListener("pointerdown", (e) => { e.preventDefault(); layer.setPointerCapture(e.pointerId); start = frac(e); this.cropRect = { x: start.x, y: start.y, w: 0, h: 0 }; paint(); });
    layer.addEventListener("pointermove", (e) => {
      if (!start) return;
      const q = frac(e);
      this.cropRect = { x: Math.min(start.x, q.x), y: Math.min(start.y, q.y), w: Math.abs(q.x - start.x), h: Math.abs(q.y - start.y) };
      paint();
    });
    layer.addEventListener("pointerup", () => {
      start = null;
      const c = this.cropRect;
      if (this.cropSave) this.cropSave.disabled = !(c && c.w > 0.02 && c.h > 0.02);
    });
    paint();
  }

  /** Saves the chosen part of the scan (or the whole page) as an image in _attachments/Tinmind/ and puts it in the note where the drawing flag was. */
  async saveCrop(whole) {
    const d = this.cropFor;
    if (!d) return;
    const c = whole ? { x: 0, y: 0, w: 1, h: 1 } : this.cropRect;
    if (!c || c.w <= 0.02 || c.h <= 0.02) { new Notice("Drag a box over the drawing first."); return; }
    const name = d.scan || this.pages[this.page];
    const scan = name && this.scanFile(name);
    if (!scan) { new Notice("That scan isn't in Sources/Scans any more."); return; }
    try {
      const url = URL.createObjectURL(new Blob([await this.app.vault.readBinary(scan)], { type: "image/jpeg" }));
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("couldn't open the scan as an image")); i.src = url; });
      const sx = Math.round(c.x * img.naturalWidth), sy = Math.round(c.y * img.naturalHeight);
      const sw = Math.max(1, Math.round(c.w * img.naturalWidth)), sh = Math.max(1, Math.round(c.h * img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = sw; canvas.height = sh;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, sw, sh);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      URL.revokeObjectURL(url);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
      if (!blob) throw new Error("couldn't make the image");
      const file = this.app.vault.getAbstractFileByPath(this.path);
      await this.plugin.tinEnsureFolder(TIN_DRAWINGS_DIR);
      const out = this.plugin.tinUniquePath(TIN_DRAWINGS_DIR, `${cleanName(file.basename)} drawing`, ".jpg");
      await this.app.vault.createBinary(out, await blob.arrayBuffer());
      const made = out.split("/").pop();
      this.record(d, whole ? "kept a screenshot of the whole page" : "kept a screenshot of part of the page");
      await this.applyText(keepDrawing(this.text(), this.drawingNow(d), made));
      this.cropFor = null; this.cropRect = null;
      new Notice(`Saved ${made} in ${TIN_DRAWINGS_DIR}/ and put it in the note.`, 5000);
      await this.render();
    } catch (e) {
      console.error("Nicrosil: saving the screenshot failed", e);
      new Notice(`Couldn't save the screenshot: ${e.message}`, 8000);
    }
  }

  /* --- what still needs me (under the scan, and the unsure words in the bar) --- */

  record(d, decision) {
    (this.decisions[this.path] = this.decisions[this.path] || []).push({ label: d.label, decision });
  }

  /** The drawing as it stands in the text now (its line numbers may have moved since the card was drawn). */
  drawingNow(d) {
    return parseDrawings(this.text()).find((x) => x.label === d.label && x.scan === d.scan && x.kind === d.kind) || d;
  }

  /** The "recreated" marker as it stands in the text now. */
  recheckNow(r) {
    return parseRechecks(this.text()).find((x) => x.scan === r.scan && x.label === r.label) || r;
  }

  async change(next, decisionFor, decision) {
    if (decisionFor) this.record(decisionFor, decision);
    await this.applyText(next);
    this.renderChecks();
  }

  showScan(name) {
    const i = this.pages.findIndex((n) => scanKey(n) === scanKey(name));
    if (i >= 0 && !this.cropFor) { this.page = i; this.drawScan(); }
  }

  renderChecks() {
    const el = this.checksEl;
    if (!el || !el.isConnected) return;
    el.empty();
    const text = this.text();
    const drawings = parseDrawings(text);
    const rechecks = parseRechecks(text);
    const unsure = findUnsure(text);
    const open = drawings.length + rechecks.length;

    if (open) {
      const hd = el.createDiv({ cls: "cm-tr-trayhead" });
      hd.createSpan({ cls: "cm-tr-checkhead", text: `Needs you (${open})` });
      const tg = hd.createEl("button", { cls: "cm-mini", text: this.trayOpen ? "Hide" : "Show" });
      tg.addEventListener("click", () => { this.trayOpen = !this.trayOpen; this.renderChecks(); });
    }
    if (open && this.trayOpen) {
      if (drawings.length) {
        el.createDiv({ cls: "cm-tr-checkhead", text: `Drawings (${drawings.length})` });
        drawings.forEach((d) => {
          const card = el.createDiv({ cls: "cm-tr-card cm-tr-" + d.kind });
          const top = card.createDiv({ cls: "cm-tr-cardtop" });
          top.createSpan({ cls: "cm-tr-cardtitle", text: d.label || "Drawing" });
          top.createSpan({ cls: "cm-tr-cardkind", text: d.kind === "recreate" ? "waiting to be recreated" : "needs your decision" });
          if (d.body) card.createDiv({ cls: "cm-tr-cardbody", text: d.body });
          const row = card.createDiv({ cls: "cm-tr-cardbtns" });
          if (d.scan) {
            const look = row.createEl("button", { cls: "cm-mini", text: "Show on scan" });
            look.addEventListener("click", () => this.showScan(d.scan));
          }
          const keep = row.createEl("button", { cls: "cm-mini", text: d.kind === "recreate" ? "Keep screenshot instead" : "Keep screenshot" });
          keep.addEventListener("click", () => { this.cropFor = d; this.cropRect = null; if (d.scan) { const i = this.pages.findIndex((n) => scanKey(n) === scanKey(d.scan)); if (i >= 0) this.page = i; } this.drawScan(); });
          if (d.kind === "drawing") {
            row.createEl("button", { cls: "cm-mini", text: "Recreate" }).addEventListener("click", () => this.change(recreateDrawing(this.text(), this.drawingNow(d)), d, "to be recreated in the note"));
          }
          row.createEl("button", { cls: "cm-mini", text: "Leave out" }).addEventListener("click", () => this.change(leaveOutDrawing(this.text(), this.drawingNow(d)), d, "left out of the note"));
          if (d.kind === "recreate") card.createDiv({ cls: "cm-sub", text: "The scan stays until you check the recreated drawing. Ask Claude to recreate it." });
        });
      }
      if (rechecks.length) {
        el.createDiv({ cls: "cm-tr-checkhead", text: `Recreated drawings to check (${rechecks.length})` });
        rechecks.forEach((r) => {
          const card = el.createDiv({ cls: "cm-tr-card cm-tr-recheck" });
          const top = card.createDiv({ cls: "cm-tr-cardtop" });
          top.createSpan({ cls: "cm-tr-cardtitle", text: r.label || "Recreated drawing" });
          top.createSpan({ cls: "cm-tr-cardkind", text: "compare with the scan" });
          const row = card.createDiv({ cls: "cm-tr-cardbtns" });
          if (r.scan) row.createEl("button", { cls: "cm-mini", text: "Show on scan" }).addEventListener("click", () => this.showScan(r.scan));
          row.createEl("button", { cls: "cm-mini mod-cta", text: "Looks right" }).addEventListener("click", () => this.change(clearRecheck(this.text(), this.recheckNow(r)), { label: r.label || "Recreated drawing" }, "recreated, and I checked it"));
        });
      }
    }
    if (!open && !unsure.length) el.createDiv({ cls: "cm-ok", text: "No drawings or unsure words left." });
    else if (!open) el.createDiv({ cls: "cm-sub", text: "No drawings to decide on. Unsure words are in the bar above the note." });

    // the bar: the unsure words and whether Verify is open
    const showing = !!text || (this.noteView() && this.noteView().file && this.noteView().file.path === this.path);
    if (this.verifyBtn && this.verifyBtn.isConnected) {
      this.verifyBtn.disabled = open > 0 || !showing;
      this.verifyBtn.setAttr("title", open ? "Decide on every drawing first" : "");
    }
    const u = this.unsureEl;
    if (u && u.isConnected) {
      u.empty();
      if (unsure.length) {
        u.createSpan({ cls: "cm-tr-checkhead", text: `Unsure words (${unsure.length})` });
        u.createEl("button", { cls: "cm-mini", text: "Next unsure word" }).addEventListener("click", () => this.nextUnsure());
        u.createEl("button", { cls: "cm-mini", text: "Accept the guess" }).addEventListener("click", () => this.acceptCurrent());
      } else {
        u.createSpan({ cls: "cm-tr-count", text: "No unsure words" });
      }
    }
  }

  /** Selects the next [?word?] or [??] in the note (from the cursor on, then from the top) and scrolls to it. */
  async nextUnsure() {
    const v = this.noteView();
    if (!v || !v.file || v.file.path !== this.path) return;
    if (v.getMode() !== "source") await this.setMode("source");
    const ed = v.editor;
    const list = findUnsure(ed.getValue());
    if (!list.length) return;
    const from = ed.posToOffset(ed.getCursor("to"));
    const u = list.find((x) => x.index >= from) || list[0];
    const a = ed.offsetToPos(u.index), b = ed.offsetToPos(u.index + u.length);
    ed.setSelection(a, b);
    ed.scrollIntoView({ from: a, to: b }, true);
    ed.focus();
  }

  /** Puts the guess in place of the selected [?word?], then moves to the next one. */
  async acceptCurrent() {
    const v = this.noteView();
    if (!v || !v.file || v.file.path !== this.path) return;
    const ed = v.editor;
    const list = findUnsure(ed.getValue());
    const s = ed.posToOffset(ed.getCursor("from")), e = ed.posToOffset(ed.getCursor("to"));
    const u = list.find((x) => s >= x.index && e <= x.index + x.length && e > s);
    if (!u) { await this.nextUnsure(); return; }
    if (!u.guess) { new Notice("That one has no guess. Type the word in."); return; }
    ed.replaceRange(u.guess, ed.offsetToPos(u.index), ed.offsetToPos(u.index + u.length));
    ed.setCursor(ed.offsetToPos(u.index + u.guess.length));
    await this.saveNote();
    this.renderChecks();
    await this.nextUnsure();
  }

  /* --- the buttons --- */

  /** Moves to the note after the one at `idx` (or the first if it was the last), after this one goes away. */
  afterWith(items, idx) {
    const rest = items.filter((_, i) => i !== idx);
    const next = rest[idx] || rest[0];
    this.path = next ? next.file.path : null;
    this.page = 0;
    this.cropFor = null;
  }

  async skip(items, idx) {
    if (items.length < 2) { new Notice("That is the only note waiting."); return; }
    await this.go(items[(idx + 1) % items.length].file.path);
  }

  async verify(item) {
    await this.saveNote();
    const text = this.text();
    const open = parseDrawings(text).length + parseRechecks(text).length;
    if (open) { new Notice("Decide on every drawing first."); return; }
    const p = this.plugin;
    const used = p.scanKeysUsedElsewhere(item.file.path);
    const scans = this.pages.map((n) => ({ name: n, keep: used.has(scanKey(n)) }));
    const unsure = findUnsure(text).length;
    new TranscribeVerifyModal(this.app, {
      name: item.file.basename, scans, unsure,
      onConfirm: async () => {
        const items = p.pendingTranscriptions();
        const idx = items.findIndex((i) => i.file.path === item.file.path);
        try {
          await p.verifyTranscription(item.file, this.pages, this.decisions[item.file.path] || [], unsure);
          delete this.decisions[item.file.path];
          this.afterWith(items, idx);
        } catch (e) {
          console.error("Nicrosil: verifying a transcription failed", e);
          new Notice(`Verify failed: ${e.message}. Check the note, its scans and the log.`, 10000);
        }
        this.render();
      },
    }).open();
  }

  async discard(item, items, idx) {
    await this.saveNote();
    const p = this.plugin;
    const reason = String((await p.tinPrompt({ title: `Discard “${item.file.basename}”?`, label: "This deletes the draft note and keeps its scans, so Claude can try again. Why are you discarding it? (required)", ok: "Discard" })) || "").trim();
    if (!reason) { new Notice("A reason is required, so nothing was discarded."); return; }
    try {
      // move the right-hand pane on first, so deleting the note doesn't close the pane with it
      const rest = items.filter((_, i) => i !== idx);
      if (rest.length) {
        const next = rest[idx] || rest[0];
        this.path = next.file.path; this.page = 0; this.cropFor = null;
        await this.openInNote(next.file);
      }
      await p.discardTranscription(item.file, reason);
      delete this.decisions[item.file.path];
      if (!rest.length) this.path = null;
    } catch (e) {
      console.error("Nicrosil: discarding a transcription failed", e);
      new Notice(`Discard failed: ${e.message}`, 10000);
    }
    this.render();
  }
}

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

/* ---------- Links between pages, shared by the Lens and the atlas ---------- */

const REL_VIEW_TYPE = "nicrosil-relations";

/** The typed-link properties, in the order SCHEMA §5 lists them, with how each reads from each side. */
const REL_TYPES = {
  type_of:      { out: "Is a kind of",     inn: "Kinds of this",         color: "#b87333", dash: "" },
  part_of:      { out: "Is part of",       inn: "Parts of this",         color: "#5fae9e", dash: "" },
  example_of:   { out: "Is an example of", inn: "Examples of this",      color: "#e0c040", dash: "" },
  causes:       { out: "Causes",           inn: "Caused by",             color: "#e07a5f", dash: "" },
  counters:     { out: "Counters",         inn: "Countered by",          color: "#b97f93", dash: "" },
  applies_to:   { out: "Applies to",       inn: "Applied by",            color: "#6a9fd8", dash: "" },
  supports:     { out: "Supports",         inn: "Supported by",          color: "#8bbf6a", dash: "" },
  contradicts:  { out: "Contradicts",      inn: "Contradicted by",       color: "#d9435e", dash: "2 3" },
  developed_by: { out: "Developed by",     inn: "Ideas developed here",  color: "#a58ad6", dash: "" },
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

/** Pages the Lens shows links between: wiki pages, perspectives and source cards (not the index, logs or rule files, which link to everything). */
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

/* ---------- Home dashboard block ---------- */

class LiveBlock extends MarkdownRenderChild {
  constructor(el, plugin, method) {
    super(el);
    this.plugin = plugin;
    this.method = method;
  }
  onload() {
    this.render = () => this.plugin[this.method](this.containerEl);
    this.plugin.dashboards.add(this.render);
    this.render();
  }
  onunload() { this.plugin.dashboards.delete(this.render); }
}

/* ---------- settings ---------- */

class ReviewSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const el = this.containerEl;
    el.empty();
    new Setting(el).setName("Open the next draft after verifying or rejecting")
      .setDesc("Keeps a review session moving without going back to the queue.")
      .addToggle((t) => t.setValue(this.plugin.settings.autoAdvance).onChange(async (v) => {
        this.plugin.settings.autoAdvance = v; await this.plugin.persist();
      }));
    new Setting(el).setName("Play an animation when I verify a page")
      .setDesc("A check stamp and a burst of sparks, then the next page slides in (with Open next after verify off, only the stamp and sparks play and the page stays put). It is skipped if your computer is set to reduce motion.")
      .addToggle((t) => t.setValue(this.plugin.settings.celebrate !== false).onChange(async (v) => {
        this.plugin.settings.celebrate = v; await this.plugin.persist();
      }));
    new Setting(el).setName("Keep the index up to date")
      .setDesc("When a page in Wiki, Perspectives or Source Cards is added, removed, renamed or moved, _index.md is updated by itself (entry, section, counts, total and the Jump to line). A new page's line uses its summary callout. “Update the index now” in the command palette does it on demand.")
      .addToggle((t) => t.setValue(this.plugin.settings.autoIndex !== false).onChange(async (v) => {
        this.plugin.settings.autoIndex = v; await this.plugin.persist();
        if (v) this.plugin.scheduleIndexSync(500);
      }));
    new Setting(el).setName("Close the extra sidebar panels on startup")
      .setDesc("Closes Backlinks, Outgoing links, Tags, All properties and Outline in the sidebar each time Obsidian starts. You can still open any of them from the command palette during a session.")
      .addToggle((t) => t.setValue(this.plugin.settings.hidePanels !== false).onChange(async (v) => { this.plugin.settings.hidePanels = v; await this.plugin.persist(); }));
    new Setting(el).setName("Close the other tabs on startup")
      .setDesc("When Obsidian starts, keeps only the Dashboard open in the main area and closes every other tab, so a page left open last time (the transcription queue, a note) doesn't come back in the wrong mode. Does nothing when you only reload the plugin during a session.")
      .addToggle((t) => t.setValue(this.plugin.settings.closeTabsOnStart !== false).onChange(async (v) => { this.plugin.settings.closeTabsOnStart = v; await this.plugin.persist(); }));
    new Setting(el).setName("Open pages in Reading view")
      .setDesc("When a page is opened (from a link, the file list, search or the Dashboard), it opens in Reading view instead of editing. Switching to editing yourself sticks until you open a different page in that tab. \"Every page\" also covers drafts; empty new notes always open ready to type.")
      .addDropdown((d) => {
        Object.entries(READ_MODES).forEach(([k, v]) => d.addOption(k, v));
        d.setValue(this.plugin.settings.readMode || "verified").onChange(async (v) => { this.plugin.settings.readMode = v; await this.plugin.persist(); });
      });
    new Setting(el).setName("Days between health checks")
      .setDesc("The Dashboard's health check card fills up over this many days since the last report in Health Checks/, turns amber in the last two days, and turns red once it is overdue.")
      .addText((t) => {
        t.inputEl.type = "number"; t.inputEl.min = "1"; t.inputEl.max = "365"; t.inputEl.style.width = "70px";
        t.setValue(String(this.plugin.settings.healthDays || 14)).onChange(async (v) => {
          const n = parseInt(v, 10);
          if (!(n >= 1 && n <= 365)) return;
          this.plugin.settings.healthDays = n; await this.plugin.persist(); this.plugin.renderAll();
        });
      });
    new Setting(el).setName("Queue order")
      .setDesc("Clean pages first gives quick wins; flagged first tackles the hard ones while you're fresh.")
      .addDropdown((d) => {
        Object.entries(SORTS).forEach(([k, v]) => d.addOption(k, v));
        d.setValue(this.plugin.settings.sort).onChange(async (v) => {
          this.plugin.settings.sort = v; await this.plugin.persist(); this.plugin.renderAll();
        });
      });
    new Setting(el).setName("Claude Code for query mode")
      .setDesc("Where Claude Code is on this computer, for the search bar's Query switch. Leave it blank to look in the usual places (~/.local/bin, then npm's folder, then the PATH). Claude Code uses its own sign-in; Nicrosil never sees it. Desktop only.")
      .addText((t) => {
        t.inputEl.style.width = "260px";
        t.setPlaceholder("Found by itself").setValue(this.plugin.settings.claudePath || "").onChange(async (v) => { this.plugin.settings.claudePath = v.trim(); await this.plugin.persist(); });
      })
      .addButton((b) => b.setButtonText("Test").onClick(() => {
        let child;
        try { child = this.plugin.spawnClaude(["--version"]); } catch (e) { new Notice("Couldn't start Claude Code: " + e.message, 8000); return; }
        let out = "";
        child.stdout.on("data", (c) => { out += c; });
        child.on("error", () => new Notice("Claude Code wasn't found. Install it, or set its path here.", 8000));
        child.on("close", (code) => { if (code === 0) new Notice(`Found Claude Code ${out.trim()} at ${this.plugin.claudeCommand()}.`, 6000); });
      }));
    el.createEl("p", {
      cls: "setting-item-description",
      text: "Hotkeys: Alt+V verify, Alt+R reject, Alt+S skip, Alt+N next draft, Alt+F resolve a flag, Alt+Q open the queue. Change them under Settings → Hotkeys (search “Coppermind”).",
    });
  }
}

/* ---------- plugin ---------- */

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
    if (this.canQuery) {
      const sw = bar.createDiv({ cls: "cm-qswitch", attr: { role: "group", "aria-label": "Search or query" } });
      this.swSearch = sw.createEl("button", { cls: "cm-qswitch-btn", attr: { type: "button", "aria-label": "Keyword search" } });
      setIcon(this.swSearch.createSpan(), "search");
      this.swSearch.appendText("Search");
      this.swQuery = sw.createEl("button", { cls: "cm-qswitch-btn", attr: { type: "button", "aria-label": "Ask Claude (query mode)" } });
      setIcon(this.swQuery.createSpan(), "sparkles");
      this.swQuery.appendText("Query");
      this.swSearch.addEventListener("click", () => this.setMode("search"));
      this.swQuery.addEventListener("click", () => this.setMode("query"));
    } else setIcon(bar.createSpan({ cls: "cm-search-icon" }), "search");
    this.input = bar.createEl("input", { cls: "cm-search-input", attr: { type: "text", placeholder: `Search ${what}…`, spellcheck: "false", autocomplete: "off", "aria-label": `Search ${what}` } });
    this.clearBtn = bar.createSpan({ cls: "cm-search-clear", attr: { role: "button", "aria-label": "Clear search" } });
    setIcon(this.clearBtn, "x");
    if (this.canQuery) {
      this.askBtn = bar.createEl("button", { cls: "cm-qask", attr: { type: "button" } });
      this.askBtn.appendText("Ask");
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
      g.createDiv({ cls: "cm-qlabel", text: label });
      const row = g.createDiv({ cls: "cm-qseg", attr: { role: "group", "aria-label": label } });
      const cur = st[key] || def;
      for (const [k, name] of list) {
        const b = row.createEl("button", { cls: "cm-qseg-btn" + (k === cur ? " is-on" : ""), text: name, attr: { type: "button", "aria-pressed": String(k === cur) } });
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

/* ---------- schema changelog (pure helpers) ---------- */

/** Compare "4.10" and "4.2" as major.minor numbers: returns <0, 0 or >0. */
function compareVersions(a, b) {
  const [a1, a2] = a.split(".").map(Number);
  const [b1, b2] = b.split(".").map(Number);
  return a1 - b1 || a2 - b2;
}

/** One line of text: newlines collapsed, trimmed, ending in punctuation. */
function cleanDescription(desc) {
  let s = desc.replace(/\s*\r?\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  if (s && !/[.!?)"'`]$/.test(s)) s += ".";
  return s;
}

function entryLine(version, date, desc) {
  return `- **${version} (${date}):** ${cleanDescription(desc)}`;
}

/**
 * Finds the Changelog section. Returns { eol, lines, headingIdx, firstBulletIdx, versions }
 * or null if there is no Changelog heading.
 */
function findChangelog(text) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const headingIdx = lines.findIndex((l) => /^#{1,6}\s+Changelog\s*$/.test(l));
  if (headingIdx === -1) return null;
  let end = lines.length;
  for (let i = headingIdx + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i]) || /^---\s*$/.test(lines[i])) { end = i; break; }
  }
  let firstBulletIdx = -1;
  const versions = [];
  for (let i = headingIdx + 1; i < end; i++) {
    const m = lines[i].match(/^- \*\*(\d+\.\d+)\b/);
    if (m) { if (firstBulletIdx === -1) firstBulletIdx = i; versions.push(m[1]); }
  }
  return { eol, lines, headingIdx, firstBulletIdx, versions };
}

/** Frontmatter value of a simple `key: value` property, or null. */
function frontmatterValue(text, key) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const k = m[1].match(new RegExp(`^${escapeRegExp(key)}:[ \\t]*(.*?)[ \\t]*$`, "m"));
  return k ? k[1] : null;
}

/** Sets simple `key: value` properties in place (only keys that already exist), keeping everything else as it is. */
function setFrontmatterProps(text, props) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return text;
  const close = lines.indexOf("---", 1);
  for (let i = 1; i < close; i++) {
    for (const [k, v] of Object.entries(props)) if (new RegExp(`^${escapeRegExp(k)}:`).test(lines[i])) lines[i] = `${k}: ${v}`;
  }
  return lines.join(eol);
}

/** Current version, the latest changelog version, and the changelog as seen by the modal.
 *  The version lives in SCHEMAS/SCHEMA.md, so it can be passed in; otherwise it is read from the text. */
function schemaInfo(text, fmOverride) {
  const cl = findChangelog(text);
  const fmVersion = fmOverride !== undefined ? fmOverride : frontmatterValue(text, "version");
  const latest = cl && cl.versions.length
    ? cl.versions.reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b))
    : null;
  return { hasChangelog: !!cl, fmVersion, latest, versions: cl ? cl.versions : [] };
}

/** Returns an error message for a bad version, or "" if it is fine. */
function checkVersion(text, version, fmOverride) {
  if (!/^\d+\.\d+$/.test(version)) return "Use the form 4.2 (a whole number, a dot, and a number).";
  const info = schemaInfo(text, fmOverride);
  if (!info.hasChangelog) return "Schema Changelog has no “Changelog” heading to add to.";
  if (info.versions.includes(version)) return `Version ${version} is already in the changelog.`;
  const newest = [info.latest, info.fmVersion && /^\d+\.\d+$/.test(info.fmVersion) ? info.fmVersion : null]
    .filter(Boolean)
    .reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b), "0.0");
  if (compareVersions(version, newest) <= 0) return `That is not newer than ${newest}.`;
  return "";
}

/**
 * Adds the changelog line, and updates `version` and `updated` in the frontmatter.
 * Throws if the Changelog heading is missing. Keeps the file's line endings.
 */
function addChangelogEntry(text, version, date, desc) {
  const cl = findChangelog(text);
  if (!cl) throw new Error("No Changelog heading in Schema Changelog");
  const { eol, lines } = cl;
  const line = entryLine(version, date, desc);
  if (cl.firstBulletIdx !== -1) {
    // Newest first: the new line goes above the existing ones.
    lines.splice(cl.firstBulletIdx, 0, line);
  } else {
    // Empty changelog: add after the heading and a blank line.
    let at = cl.headingIdx + 1;
    if (lines[at] === "") at++;
    else lines.splice(at++, 0, "");
    lines.splice(at, 0, line);
  }
  // Frontmatter: only the two properties, edited in place so nothing else is reformatted.
  if (lines[0] === "---") {
    const close = lines.indexOf("---", 1);
    for (let i = 1; i < close; i++) {
      if (/^version:/.test(lines[i])) lines[i] = `version: ${version}`;
      else if (/^updated:/.test(lines[i])) lines[i] = `updated: ${date}`;
    }
  }
  return lines.join(eol);
}

/* ---------- The Tinmind's sidebar and course pages: helpers (3.1.0) ---------- */
const byOldestSemester = (p, q) => {
  const kp = semesterKey(p), kq = semesterKey(q);
  if (kp !== null && kq !== null) return kp - kq;
  if (kp !== null) return -1;
  if (kq !== null) return 1;
  return p.localeCompare(q);
};
const newestSemester = (list) => [...list].reverse().find((x) => semesterKey(x) !== null) || list[list.length - 1] || "";
const naturalCompare = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }); // "Lecture 2" before "Lecture 10"
/** A name typed into a prompt, made safe for a file name: no slashes or other characters Obsidian can't use in a link. */
const cleanName = (s) => String(s || "").replace(/[\\/:*?"<>|#^\[\]]/g, " ").replace(/\.md$/i, "").replace(/\s+/g, " ").trim();

/** A one-line text prompt. `done` gets the text, or null if cancelled. */
class TinPromptModal extends Modal {
  constructor(app, opts, done) {
    super(app);
    this.opts = opts;
    this.done = done;
    this.finished = false;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nicrosil-modal");
    this.titleEl.setText(this.opts.title);
    if (this.opts.label) contentEl.createDiv({ cls: "cm-sub", text: this.opts.label });
    const input = contentEl.createEl("input", { type: "text", cls: "cm-tin-input" });
    input.value = this.opts.value || "";
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); this.finish(input.value); } });
    const btns = contentEl.createDiv({ cls: "cm-buttons" });
    btns.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    btns.createEl("button", { text: this.opts.ok || "OK", cls: "mod-cta" }).addEventListener("click", () => this.finish(input.value));
    setTimeout(() => { input.focus(); if (this.opts.caret === "end") input.setSelectionRange(input.value.length, input.value.length); else input.select(); }, 0);
  }

  finish(value) {
    if (this.finished) return;
    this.finished = true;
    this.done(value);
    this.close();
  }

  onClose() {
    this.contentEl.empty();
    if (!this.finished) { this.finished = true; this.done(null); }
  }
}

/** A yes/no question. `done` gets true or false. */
class TinConfirmModal extends Modal {
  constructor(app, opts, done) {
    super(app);
    this.opts = opts;
    this.done = done;
    this.finished = false;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nicrosil-modal");
    this.titleEl.setText(this.opts.title);
    contentEl.createDiv({ cls: "cm-sub", text: this.opts.message });
    const btns = contentEl.createDiv({ cls: "cm-buttons" });
    btns.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    const ok = btns.createEl("button", { text: this.opts.ok || "OK", cls: "mod-warning" });
    ok.addEventListener("click", () => { this.finished = true; this.done(true); this.close(); });
    setTimeout(() => ok.focus(), 0);
  }

  onClose() {
    this.contentEl.empty();
    if (!this.finished) { this.finished = true; this.done(false); }
  }
}

/* ---------- schema changelog dialog ---------- */

class SchemaLogModal extends Modal {
  constructor(app, plugin, text, fmVersion) {
    super(app);
    this.plugin = plugin;
    this.text = text;
    this.fmVersion = fmVersion;
    this.version = "";
    this.desc = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cm-schemalog");
    this.titleEl.setText("Log a schema change");

    const info = schemaInfo(this.text, this.fmVersion);
    const current = info.latest || info.fmVersion || "none yet";
    const date = today();

    new Setting(contentEl)
      .setName("New version number")
      .setDesc(`Current version: ${current}. Small change: bump the decimal. Structure or workflow change: bump the whole number.`)
      .addText((t) => {
        this.versionInput = t.inputEl;
        t.setPlaceholder("4.2").onChange((v) => { this.version = v.trim(); this.refresh(); });
        t.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); this.descInput.focus(); }
        });
        setTimeout(() => t.inputEl.focus(), 0);
      });

    const descWrap = contentEl.createDiv({ cls: "cm-schemalog-desc" });
    descWrap.createDiv({ cls: "setting-item-name", text: "What I changed" });
    descWrap.createDiv({ cls: "setting-item-description", text: "A sentence or two, in the same style as the changelog entries. Name the sections you touched." });
    this.descInput = descWrap.createEl("textarea", { attr: { rows: "5", placeholder: "SCHEMA - Review: reworded rule 6 so a rejected draft is deleted, never kept." } });
    this.descInput.addEventListener("input", () => { this.desc = this.descInput.value; this.refresh(); });
    this.descInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.submit(); }
    });

    contentEl.createDiv({ cls: "cm-schemalog-label", text: `Will be added to the top of the changelog (dated ${date}):` });
    this.previewEl = contentEl.createDiv({ cls: "cm-schemalog-preview" });
    this.errorEl = contentEl.createDiv({ cls: "cm-schemalog-error" });

    new Setting(contentEl)
      .addButton((b) => { this.addBtn = b; b.setButtonText("Add to changelog").setCta().onClick(() => this.submit()); })
      .addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()));
    this.refresh();
  }

  refresh() {
    const v = this.version || "?";
    const d = cleanDescription(this.desc) || "…";
    this.previewEl.setText(`- ${v} (${today()}): ${d}`);
    const ready = !!this.version && !!this.desc.trim();
    // Only complain about the version once something has been typed in that field.
    this.error = this.version ? checkVersion(this.text, this.version, this.fmVersion) : "";
    this.errorEl.setText(this.error);
    if (this.addBtn) this.addBtn.setDisabled(!ready || !!this.error);
  }

  async submit() {
    if (!this.version || !this.desc.trim() || this.error) return;
    try {
      await this.plugin.addSchemaEntry(this.version, this.desc);
      this.close();
    } catch (e) {
      this.errorEl.setText(String(e && e.message ? e.message : e));
    }
  }

  onClose() { this.contentEl.empty(); }
}

/* ---------- query mode (4.2.0): ask the wiki from the Dashboard's search bar ---------- */
/*
 * The search bar's Query switch sends the question to Claude Code (`claude -p`, the official program, signed in with
 * my own Claude account on this computer). Nicrosil never reads or stores the login. Claude gets read-only tools
 * (Read, Glob, Grep), can't open Ingestion/Raw or The Tinmind, answers in the Analysis template's sections, and ends
 * with a small `nicrosil-meta` JSON block. The answer opens in a new tab; Nicrosil, not Claude, writes the query log
 * entry and, when I press Save to Analyses, the draft page in Wiki/Analyses. Desktop only.
 */
const QUERY_VIEW_TYPE = "nicrosil-query";
const ANALYSES_DIR = "Wiki/Analyses";
const QUERY_MODELS = [["haiku", "Haiku"], ["sonnet", "Sonnet"], ["opus", "Opus"]];
const QUERY_EFFORTS = [["low", "Low"], ["medium", "Medium"], ["high", "High"], ["max", "Max"]];
const QUERY_DEPTHS = [["quick", "Quick"], ["standard", "Standard"], ["deep", "Deep"]];
const QUERY_DEPTH_CAP = { quick: 3, standard: 8, deep: 15 }; // SCHEMA - Query's page guide, used only for the progress estimate
const QUERY_TYPES = ["lookup", "compare", "synthesis", "disagreement", "gap"];
const QUERY_DENY = ["Read(./Ingestion/Raw/**)", "Read(./The Tinmind/**)", "Read(./.obsidian/**)", "Read(./.git/**)"];
const USAGE_URL = "https://claude.ai/settings/usage";
const QUERY_SECTIONS = ["Answer", "Confidence", "Supporting Evidence", "Counter-Evidence", "Outside Knowledge", "Gaps and Uncertainties", "Pages Used", "Footnotes"];

/** The message Nicrosil sends Claude for a new question (or a follow-up, with `followUp` set). */
function buildQueryPrompt({ question, depth, followUp }) {
  const head = followUp
    ? [`Follow-up question from Harrison, in the same query: ${question}`, "",
      "Answer it the same way as before: the same sections, and a new nicrosil-meta block at the end describing this answer as a whole (it replaces the earlier one)."]
    : [
      "This is a query from Nicrosil's query mode, the search bar on the Coppermind's Dashboard.",
      "",
      "First read `_AGENTS.md`, then `SCHEMAS/SCHEMA - Query.md`, and answer by those rules (wiki first, cite pages, label drafts, label outside knowledge, keep Harrison's Perspectives as his view).",
      "",
      "How query mode differs from a chat query (Harrison designed it this way):",
      "- You have read-only tools. Don't try to create, edit or delete any file.",
      "- Don't add a log entry and don't file the answer back: Nicrosil writes the log entry, and files the answer to Wiki/Analyses only if Harrison presses Save. So skip the Log and File back steps of SCHEMA - Query.",
      "- Don't ask questions you need answered before you can go on; nobody can reply until you finish. Make the most reasonable reading and say which one you took in one line.",
      "",
      `Depth: ${depth}. Pick the question type yourself and say the type and depth in one line at the top of the Answer section.`,
      "",
      "Write the answer in Markdown using exactly these `##` sections, in this order, so it can be filed as an Analysis page without rewriting:",
      ...QUERY_SECTIONS.map((s) => `- ## ${s}`),
      "Shape Supporting Evidence by the question type (a table for compare, themes for synthesis, positions for disagreement). Counter-Evidence: at quick or standard depth write one line saying it was not searched at this depth. Outside Knowledge: leave the section out if none was used. Pages Used: each page read, as [[Page]] (verified) or [[Page]] (draft). Cite with footnotes, [^1]: [[Page#Section|Text]].",
      "Don't start with a `# Title` line.",
      "",
      `Question: ${question}`,
    ];
  return [
    ...head,
    "",
    "End your reply with this block and nothing after it (valid JSON; leave a list empty if nothing fits):",
    "```nicrosil-meta",
    '{"title": "Short page title for this answer", "question_type": "lookup|compare|synthesis|disagreement|gap", "depth": "quick|standard|deep", "summary": "One sentence for the index", "re_ask_if": "What would make this worth asking again", "file_back": "suggest|no", "pages_used": ["Page"], "verified_pages": 0, "draft_pages": 0, "courses": [], "sources": [], "related": [], "existing_analysis": ""}',
    "```",
  ].join("\n");
}

/** Splits Claude's reply into the answer and its nicrosil-meta block. meta is {} when the block is missing or not JSON. */
function parseQueryReply(text) {
  const src = String(text || "");
  const re = /```nicrosil-meta[^\n]*\n([\s\S]*?)```\s*$/;
  const m = re.exec(src.trimEnd());
  if (!m) return { answer: src.trim(), meta: {}, metaOk: false };
  let meta = {};
  let ok = false;
  try { meta = JSON.parse(m[1]); ok = meta && typeof meta === "object" && !Array.isArray(meta); } catch (e) { meta = {}; }
  if (!ok) meta = {};
  return { answer: src.trimEnd().slice(0, m.index).trim(), meta, metaOk: ok };
}

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => String(x).trim()).filter(Boolean);
const bareLink = (s) => String(s).replace(/^\[\[|\]\]$/g, "").split("|")[0].trim();
const yamlStr = (s) => JSON.stringify(String(s == null ? "" : s)); // JSON strings are valid YAML double-quoted strings
const yamlLinks = (key, items) => (items.length ? `${key}:\n${items.map((x) => `  - ${yamlStr(`[[${bareLink(x)}]]`)}`).join("\n")}` : `${key}: []`);
const yamlPlain = (key, items) => (items.length ? `${key}:\n${items.map((x) => `  - ${yamlStr(x)}`).join("\n")}` : `${key}: []`);

/** The whole Analysis page Nicrosil writes when I press Save: the template's properties, a summary callout for the index, then the answer. */
function analysisPage({ question, meta, answer, reAskIf, date, model }) {
  const m = meta || {};
  const qtype = QUERY_TYPES.includes(String(m.question_type || "").toLowerCase()) ? String(m.question_type).toLowerCase() : "";
  const depth = ["quick", "standard", "deep"].includes(String(m.depth || "").toLowerCase()) ? String(m.depth).toLowerCase() : "";
  const summary = oneLine(String(m.summary || "").trim()) || oneLine(question);
  const lines = [
    "---",
    "type: analysis",
    "status: draft",
    `question: ${yamlStr(question)}`,
    `question_type: ${qtype}`,
    `depth: ${depth}`,
    `asked_on: ${yamlStr(date)}`,
    `re_ask_if: ${yamlStr(reAskIf || m.re_ask_if || "")}`,
    yamlPlain("courses", asList(m.courses)),
    yamlLinks("sources", asList(m.sources)),
    "type_of: []", "part_of: []", "example_of: []", "causes: []", "counters: []", "applies_to: []", "supports: []", "contradicts: []", "developed_by: []",
    yamlLinks("related", asList(m.related)),
    `drafted_by: ${yamlStr(`Claude (${model || "unknown model"}), filed by Nicrosil query mode`)}`,
    `drafted_on: ${yamlStr(date)}`,
    "verified_on: ",
    "---",
    "> [!summary]",
    `> ${summary}`,
    "",
    String(answer || "").trim(),
    "",
  ];
  return lines.join("\n");
}

/** The `query` log entry Nicrosil adds when an answer comes back. */
function queryLogEntry({ question, date, model, effort, depth, meta, followUp }) {
  const m = meta || {};
  const pages = asList(m.pages_used).map((p) => `[[${bareLink(p)}]]`);
  const type = m.question_type ? String(m.question_type) : "type not given";
  const counts = (Number.isFinite(m.verified_pages) || Number.isFinite(m.draft_pages))
    ? ` (${m.verified_pages || 0} verified, ${m.draft_pages || 0} draft)` : "";
  const suggest = m.file_back === "suggest" ? " Claude suggested filing it back." : "";
  return [
    `### [${date}] query | ${oneLine(question)}${followUp ? " (follow-up)" : ""}`,
    "",
    `- **Think:** Harrison asked this from the Dashboard's query mode (${model}${effort ? `, ${effort} effort` : ""}, ${depth} depth). ${type[0].toUpperCase()}${type.slice(1)}.`,
    `- **Calculate:** Answered from ${pages.length ? pages.join(", ") : "no wiki pages"}${counts}. Not filed back yet.${suggest}`,
    "- **Verify:** Pending Harrison's review.",
  ].join("\n");
}

/** The entry added when I press Save to Analyses (the earlier query entry is never rewritten). */
function queryFiledLogEntry({ question, date, name }) {
  return [
    `### [${date}] query | ${oneLine(question)} (filed back)`,
    "",
    `- **Calculate:** Harrison saved the answer with Nicrosil's Save to Analyses button, as [[${name}]] (draft).`,
    "- **Verify:** Pending Harrison's review.",
  ].join("\n");
}

/** One line describing a tool call Claude made, for the query tab's step list. */
function describeToolUse(name, input) {
  const i = input || {};
  const short = (p) => String(p || "").replace(/\\/g, "/").split("/").pop().replace(/\.md$/i, "");
  if (name === "Read") return { text: `Read ${short(i.file_path || i.path)}`, page: /\/Wiki\//.test("/" + String(i.file_path || "").replace(/\\/g, "/")) };
  if (name === "Glob") return { text: `Listed files matching ${i.pattern || "…"}`, page: false };
  if (name === "Grep") return { text: `Searched for “${i.pattern || "…"}”${i.path ? ` in ${short(i.path)}` : ""}`, page: false };
  return { text: `Used ${name}`, page: false };
}

/** Usage percent (0–100) from a stream-json event, if the event carries one; null otherwise.
 *  Untested guess at the field names: Claude Code's rate limit events are read loosely, so a missing field just means no meter. */
function usageFromEvent(ev) {
  if (!ev || typeof ev !== "object" || !/rate.?limit/i.test(String(ev.type || ""))) return null;
  const info = ev.rate_limit_info || ev.rateLimitInfo || ev;
  for (const [k, v] of Object.entries(info)) {
    if (!/utiliz|percent|used/i.test(k)) continue;
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    const pct = n <= 1 ? n * 100 : n;
    if (pct >= 0 && pct <= 100) return { pct: Math.round(pct), kind: String(info.rateLimitType || info.rate_limit_type || ""), resetsAt: info.resetsAt || info.resets_at || null };
  }
  return null;
}

/** The arguments for `claude`: print mode, streamed JSON, the chosen model and effort, read-only tools. The question goes in on stdin. */
function claudeArgs({ model, effort, sessionId, resume }) {
  const a = ["-p", "--output-format", "stream-json", "--verbose", "--model", model];
  if (effort && model !== "haiku") a.push("--effort", effort);
  a.push("--tools", "Read,Glob,Grep", "--allowedTools", "Read,Glob,Grep", "--permission-mode", "dontAsk", "--max-turns", "60");
  a.push("--disallowedTools", ...QUERY_DENY);
  if (resume) a.push("--resume", resume); else if (sessionId) a.push("--session-id", sessionId);
  return a;
}

/** Quotes one argument for cmd.exe, used only when Claude Code is an npm .cmd shim. */
function winQuote(s) {
  return `"${String(s).replace(/"/g, '""')}"`;
}

function newUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** A tab with one query: the step list while Claude works, then the answer, Save to Analyses, Copy, Discard, and a follow-up box. */
class QueryView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.q = null;       // { question, model, effort, depth }
    this.turns = [];     // [{ question, answer, meta, followUp }]
    this.sessionId = null;
    this.modelId = "";
    this.proc = null;
    this.saved = null;   // name of the Analysis page, once saved
  }
  getViewType() { return QUERY_VIEW_TYPE; }
  getDisplayText() { return this.q ? oneLine(this.q.question).slice(0, 60) : "Query"; }
  getIcon() { return "sparkles"; }

  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("cm-query-view");
    this.wrap = this.contentEl.createDiv({ cls: "cm-query" });
    if (!this.q) this.wrap.createDiv({ cls: "cm-query-note", text: "This query tab was left from an earlier session, so its answer is gone. Ask again from the Dashboard." });
    this.registerDomEvent(this.contentEl, "click", (e) => {
      const a = e.target && e.target.closest && e.target.closest("a.internal-link");
      if (!a) return;
      e.preventDefault();
      this.app.workspace.openLinkText(a.getAttr("data-href") || a.getText(), "", e.ctrlKey || e.metaKey || e.button === 1);
    });
  }

  async onClose() { this.stop(); }

  /** Starts the first turn. */
  begin(q) {
    this.q = q;
    this.sessionId = newUuid();
    this.leaf.updateHeader && this.leaf.updateHeader();
    this.run(q.question, false);
  }

  stop() {
    if (this.proc) { try { this.proc.kill(); } catch (e) { /* already gone */ } this.proc = null; }
    if (this.timer) { window.clearInterval(this.timer); this.timer = null; }
  }

  /** Runs one turn: draws the waiting card, starts claude, reads its events line by line. */
  run(question, followUp) {
    const w = this.wrap;
    w.empty();
    this.drawHeader(w, followUp ? "Working on your follow-up" : "Reading the wiki");
    const card = w.createDiv({ cls: "cm-query-card is-working" });
    const bg = card.createDiv({ cls: "cm-hero-bg" });
    bg.setAttr("aria-hidden", "true");
    for (let i = 0; i < 5; i++) {
      const s = bg.createSpan({ cls: "cm-hero-spark" + (i % 2 ? " is-teal" : "") });
      s.style.left = `${(i * 23 + 9) % 95}%`;
      s.style.setProperty("--d", `${7 + i}s`);
      s.style.animationDelay = `-${i * 2}s`;
    }
    card.createDiv({ cls: "cm-query-working cm-gradient-style", text: followUp ? "Thinking it through…" : "Reading the wiki…" });
    card.createDiv({ cls: "cm-query-sub", text: "Claude answers from your pages first. Nothing is saved until you press Save to Analyses." });
    const steps = card.createDiv({ cls: "cm-query-steps" });
    const bar = card.createDiv({ cls: "cm-progress" }).createDiv({ cls: "cm-progress-fill" });
    bar.style.width = "4%";
    const foot = card.createDiv({ cls: "cm-query-foot" });
    const elapsed = foot.createSpan({ text: "Elapsed 0:00" });
    foot.createSpan({ text: "The bar is an estimate: pages read against the depth's guide" });
    const cancel = w.createEl("button", { cls: "cm-query-cancel", text: "Cancel query" });
    cancel.addEventListener("click", () => { this.stop(); this.cancelled(followUp); });

    const started = Date.now();
    this.timer = window.setInterval(() => {
      const s = Math.round((Date.now() - started) / 1000);
      elapsed.setText(`Elapsed ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
    }, 1000);
    let pagesRead = 0;
    let current = null;
    const step = (text) => {
      if (current) { current.removeClass("is-now"); current.addClass("is-done"); }
      current = steps.createDiv({ cls: "cm-query-step is-now" });
      current.createSpan({ cls: "cm-query-dot" });
      current.createSpan({ text });
      steps.scrollTop = steps.scrollHeight;
    };
    step(followUp ? "Picking up where the last answer left off" : "Starting Claude Code");

    let child;
    try {
      child = this.plugin.spawnClaude(claudeArgs({ model: this.q.model, effort: this.q.effort, sessionId: followUp ? null : this.sessionId, resume: followUp ? this.sessionId : null }));
    } catch (e) {
      this.stop();
      return this.failed(String(e && e.message || e), followUp);
    }
    this.proc = child;
    let buf = "", errText = "", resultEv = null, lastText = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let ev;
        try { ev = JSON.parse(line); } catch (e) { continue; }
        if (ev.type === "system" && ev.subtype === "init") {
          if (ev.model) this.modelId = ev.model;
          if (ev.apiKeySource && ev.apiKeySource !== "none") step(`Note: signed in with an API key (${ev.apiKeySource}), so this bills to the API`);
          step("Reading the rules");
        } else if (ev.type === "assistant" && ev.message && Array.isArray(ev.message.content)) {
          for (const c of ev.message.content) {
            if (c.type === "tool_use") {
              const d = describeToolUse(c.name, c.input);
              if (d.page) pagesRead++;
              step(d.text);
              const cap = QUERY_DEPTH_CAP[this.q.depth] || 8;
              bar.style.width = `${Math.min(90, 8 + (pagesRead / cap) * 80)}%`;
            } else if (c.type === "text" && c.text) lastText = c.text;
          }
        } else if (ev.type === "result") {
          resultEv = ev;
        } else {
          const u = usageFromEvent(ev);
          if (u) this.plugin.noteUsage(u);
        }
      }
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (c) => { errText += c; });
    child.on("error", (e) => {
      if (this.proc !== child) return;
      this.stop();
      this.failed(e && e.code === "ENOENT" ? "Nicrosil couldn't find Claude Code on this computer. Install it, sign in once by running claude in a terminal, or set its path in Settings → Nicrosil." : String(e.message || e), followUp);
    });
    child.on("close", (code) => {
      if (this.proc !== child) return; // cancelled
      this.stop();
      if (resultEv && !resultEv.is_error && (resultEv.result || lastText)) this.answered(question, resultEv.result || lastText, followUp, resultEv);
      else this.failed((resultEv && (resultEv.result || resultEv.subtype)) || errText.trim() || `Claude Code stopped (exit code ${code}).`, followUp);
    });
    child.stdin.end(buildQueryPrompt({ question, depth: this.q.depth, followUp }));
  }

  drawHeader(w, label) {
    const head = w.createDiv({ cls: "cm-query-head" });
    head.createDiv({ cls: "cm-query-label", text: label });
    head.createDiv({ cls: "cm-query-title cm-draft-title-style", text: this.q.question });
    const chips = head.createDiv({ cls: "cm-query-chips" });
    const name = (list, k) => (list.find((x) => x[0] === k) || [k, k])[1];
    chips.createSpan({ cls: "cm-query-chip", text: name(QUERY_MODELS, this.q.model) });
    if (this.q.model !== "haiku") chips.createSpan({ cls: "cm-query-chip", text: `${name(QUERY_EFFORTS, this.q.effort)} effort` });
    chips.createSpan({ cls: "cm-query-chip", text: `${name(QUERY_DEPTHS, this.q.depth)} depth` });
    return head;
  }

  async answered(question, text, followUp, ev) {
    const { answer, meta, metaOk } = parseQueryReply(text);
    this.turns.push({ question, answer, meta, followUp });
    try {
      await this.plugin.appendLog(queryLogEntry({ question, date: today(), model: this.modelId || this.q.model, effort: this.q.model === "haiku" ? "" : this.q.effort, depth: this.q.depth, meta, followUp }));
    } catch (e) { new Notice("The answer came back, but Nicrosil couldn't add the log entry: " + e.message, 8000); }
    if (ev && ev.usage) this.plugin.noteRun(ev);
    this.drawAnswer(metaOk);
  }

  cancelled(followUp) {
    if (this.turns.length) return this.drawAnswer(true, "Follow-up cancelled.");
    const w = this.wrap;
    w.empty();
    this.drawHeader(w, "Cancelled");
    w.createDiv({ cls: "cm-query-note", text: "The query was cancelled before Claude answered, so nothing was logged or saved. Close this tab, or ask again from the Dashboard." });
  }

  failed(msg, followUp) {
    if (this.turns.length) return this.drawAnswer(true, "The follow-up failed: " + msg);
    const w = this.wrap;
    w.empty();
    this.drawHeader(w, "Something went wrong");
    w.createDiv({ cls: "cm-query-error", text: msg });
    const again = w.createEl("button", { cls: "cm-query-cancel", text: "Try again" });
    again.addEventListener("click", () => { this.sessionId = newUuid(); this.run(this.q.question, false); });
  }

  /** The answer page: each turn's answer (newest last), the keep panel beside it. */
  drawAnswer(metaOk, note) {
    const w = this.wrap;
    w.empty();
    const last = this.turns[this.turns.length - 1];
    const layout = w.createDiv({ cls: "cm-query-layout" });
    const main = layout.createDiv({ cls: "cm-query-main" });
    const head = this.drawHeader(main, this.saved ? "Saved to Analyses" : "Draft, not saved");
    if (last.meta.question_type || last.meta.depth) {
      const chips = head.querySelector(".cm-query-chips");
      if (last.meta.question_type) chips.createSpan({ cls: "cm-query-chip is-type", text: String(last.meta.question_type) });
    }
    if (note) main.createDiv({ cls: "cm-query-note", text: note });
    if (!metaOk) main.createDiv({ cls: "cm-query-note", text: "Claude didn't end with the metadata block, so the title, summary and log details are partly blank. Fill them in before saving." });
    if (last.meta.existing_analysis) {
      const n = main.createDiv({ cls: "cm-query-note" });
      n.appendText("Claude found an earlier analysis of this question: ");
      const name = bareLink(last.meta.existing_analysis);
      n.createEl("a", { cls: "internal-link", text: name, attr: { "data-href": name, href: name } });
      n.appendText(". Saving makes a second page; you may want to have Claude update that one instead.");
    }
    this.turns.forEach((t, i) => {
      const sec = main.createDiv({ cls: "cm-query-turn" + (i === this.turns.length - 1 ? " is-last" : " is-earlier") });
      if (t.followUp) sec.createDiv({ cls: "cm-query-followq", text: t.question });
      const body = sec.createDiv({ cls: "cm-query-answer markdown-rendered" });
      MarkdownRenderer.render(this.app, t.answer, body, "", this);
    });
    this.drawFollowUp(main);
    this.drawKeep(layout.createDiv({ cls: "cm-query-side" }), last);
  }

  drawFollowUp(main) {
    const box = main.createDiv({ cls: "cm-query-follow" });
    const input = box.createEl("input", { cls: "cm-query-follow-input", attr: { type: "text", placeholder: "Ask a follow-up in the same session", "aria-label": "Ask a follow-up" } });
    const go = box.createEl("button", { cls: "cm-query-follow-go", attr: { "aria-label": "Send follow-up" } });
    setIcon(go, "arrow-right");
    const send = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      this.run(v, true);
    };
    go.addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); send(); } });
  }

  drawKeep(side, last) {
    side.createDiv({ cls: "cm-query-keep-title cm-gradient-style", text: this.saved ? "Saved" : "Keep this answer?" });
    if (this.saved) {
      const p = side.createDiv({ cls: "cm-query-sub" });
      p.appendText("Filed as ");
      p.createEl("a", { cls: "internal-link", text: this.saved, attr: { "data-href": this.saved, href: this.saved } });
      p.appendText(", a draft in the review queue.");
      return;
    }
    side.createDiv({ cls: "cm-query-sub", text: "Saves the latest answer to Wiki/Analyses as a draft. You verify it later, like any page." });
    if (last.meta.file_back === "suggest") side.createDiv({ cls: "cm-query-suggest", text: "Claude suggests filing this one back." });
    const nameIn = this.field(side, "File name", "input");
    nameIn.value = cleanName(last.meta.title || this.q.question).slice(0, 120);
    const reIn = this.field(side, "Ask again if", "textarea");
    reIn.rows = 3;
    reIn.value = String(last.meta.re_ask_if || "");
    side.createDiv({ cls: "cm-query-hint", text: "Claude suggested this. Edit it before you save." });
    const err = side.createDiv({ cls: "cm-query-err" });
    const save = side.createEl("button", { cls: "cm-query-save mod-cta" });
    setIcon(save.createSpan(), "check");
    save.appendText("Save to Analyses");
    save.addEventListener("click", async () => {
      err.setText("");
      const name = cleanName(nameIn.value);
      if (!name) { err.setText("Enter a file name first."); nameIn.focus(); return; }
      try {
        await this.plugin.saveAnalysis({ name, question: this.q.question, turn: last, reAskIf: reIn.value.trim(), model: this.modelId || this.q.model });
        this.saved = name;
        this.drawAnswer(true);
      } catch (e) { err.setText(e.message || String(e)); }
    });
    const row = side.createDiv({ cls: "cm-query-row" });
    const copy = row.createEl("button", { text: "Copy" });
    copy.addEventListener("click", async () => { await navigator.clipboard.writeText(last.answer); new Notice("Answer copied."); });
    const discard = row.createEl("button", { text: "Discard" });
    discard.addEventListener("click", () => this.leaf.detach());
    side.createDiv({ cls: "cm-query-hint", text: "Discard closes the tab. The log entry stays, as every query is logged." });
  }

  field(parent, label, tag) {
    const id = "cmq-" + Math.random().toString(36).slice(2, 8);
    parent.createEl("label", { cls: "cm-query-flabel", text: label, attr: { for: id } });
    return parent.createEl(tag, { cls: "cm-query-input", attr: { id } });
  }
}

module.exports = class Nicrosil extends Plugin {
  async onload() {
    const data = (await this.loadData()) || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
    this.resolved = data.resolved || {}; // path -> [{kind,label,title,decision,date}]
    this.skipped = [];                   // this session only
    this.items = [];
    this.dashboards = new Set();
    this.currentPath = null;
    this.dashOpen = {};
    this.foldedViews = new WeakMap();
    this.readHandled = new WeakMap(); // leaf -> path already considered for Reading view
    this.stripPaths = new WeakMap();
    this.stripObservers = new Set();
    this.indexRenames = [];   // [oldName, newName] pairs waiting for the next index sync, so a renamed page keeps its summary
    this.indexEmpty = new Set(); // paths of pages whose index entry has no summary yet
    this.proposedCache = new Map(); // source card path -> { mtime, value } for its "Proposed B-2" line
    this.popObservers = new Set(); // watchers on hover previews, dropped when the preview closes
    this.lastHover = null;         // the page the pointer last hovered a link to, so a hover preview knows which page it shows

    this.registerView(VIEW_TYPE, (leaf) => new QueueView(leaf, this));
    this.registerView(TR_VIEW_TYPE, (leaf) => new TranscribeView(leaf, this));
    this.registerView(REL_VIEW_TYPE, (leaf) => new RelationsView(leaf, this));
    this.registerView(MAP_VIEW_TYPE, (leaf) => new WikiMapView(leaf, this));
    this.registerView(QUERY_VIEW_TYPE, (leaf) => new QueryView(leaf, this));
    this.addSettingTab(new ReviewSettings(this.app, this));
    this.registerCommands();

    delete this.settings.ambient; // the Ambient animations switch was removed in 2.7.6: everything it controlled is always on
    delete this.settings.dashStyle; // the Classic/Quiet switch was removed in 2.4.2
    delete this.settings.mapTab; delete this.settings.mapFlow; // the wiki map's Hierarchy/Map tabs and Flow switch went with the atlas in 3.29.0
    document.body.classList.add("cm-quiet");
    // no status bar counter (removed in 2.13.4): renderStatus() does nothing while statusEl is unset

    // (3.13.0: the review queue and relations panel buttons are in the left sidebar's tab bar now, and the ribbon is hidden)

    this.registerMarkdownCodeBlockProcessor("coppermind-hero", (src, el, ctx) => this.renderHero(el, src, ctx));
    this.registerMarkdownCodeBlockProcessor("tinmind-hero", (src, el, ctx) => this.renderTinHero(el, src, ctx));
    for (const [name, method] of [["coppermind-dashboard", "renderDashboard"], ["coppermind-nav", "renderNav"], ["coppermind-classes", "renderClassNav"], ["coppermind-activity", "renderActivity"]]) {
      this.registerMarkdownCodeBlockProcessor(name, (src, el, ctx) => ctx.addChild(new LiveBlock(el, this, method)));
    }
    this.registerMarkdownPostProcessor((el, ctx) => this.addResolveButtons(el, ctx));
    this.searchIndex = new SearchIndex(this.app);
    this.registerMarkdownCodeBlockProcessor("coppermind-search", (src, el, ctx) => ctx.addChild(new SearchBlock(el, this)));
    this.registerEvent(this.app.vault.on("modify", (f) => this.searchIndex.touch(f)));
    this.registerEvent(this.app.vault.on("create", (f) => this.searchIndex.touch(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.searchIndex.remove(f.path)));
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => this.searchIndex.rename(f, oldPath)));
    this.tinIndex = new SearchIndex(this.app, inTinScope, makeTinEntry, searchTin);
    this.registerEvent(this.app.vault.on("modify", (f) => this.tinIndex.touch(f)));
    this.registerEvent(this.app.vault.on("create", (f) => this.tinIndex.touch(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.tinIndex.remove(f.path)));
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => this.tinIndex.rename(f, oldPath)));

    this.scheduleRefresh = debounce(() => this.refresh(), 400, true);
    this.registerInterval(window.setInterval(() => this.scheduleRefresh(), 60 * 60 * 1000)); // keeps the health check card current overnight
    this.registerEvent(this.app.workspace.on("file-open", (file) => {
      this.readOnOpen(file);
      this.syncSchemaButtons(); this.syncHomeButtons();
      if (file) this.currentPath = file.path;
      if (file && this.isDashboard(file)) this.startDashIntro();
      this.syncDashboardLeaves(true);
      this.renderViews();
    }));
    // folders and files whose names start with "_" are hidden in the file list every time Obsidian opens; the eye button in its toolbar shows them until Obsidian closes
    document.body.classList.add("cm-hide-underscore");
    this.installPageFade();
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      this.syncDashboardLeaves(false);
      this.enforceReading(leaf);
      this.syncAtlasSidebars();
    }));
    this.registerEvent(this.app.workspace.on("layout-change", () => { this.syncSchemaButtons(); this.syncHomeButtons(); this.syncDashboardLeaves(false); this.syncAtlasSidebars(); }));
    this.registerEvent(this.app.workspace.on("hover-link", (e) => {
      try {
        const lt = String(e.linktext || "").split("#")[0].split("|")[0];
        const file = this.app.metadataCache.getFirstLinkpathDest(lt, e.sourcePath || "") || this.app.vault.getAbstractFileByPath(lt);
        // A link to a spot on the page it is written in (a footnote, a heading, a block) previews part of that page, not the page, so the preview gets no strip.
        const samePart = String(e.linktext || "").includes("#") && (lt === "" || (file instanceof TFile && file.path === e.sourcePath));
        this.lastHover = file instanceof TFile && !samePart ? { file, t: Date.now() } : null;
      } catch (err) { this.lastHover = null; }
    }));
    const popWatch = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => { if (n instanceof HTMLElement && n.classList.contains("hover-popover")) this.watchPopover(n); });
    });
    popWatch.observe(document.body, { childList: true });
    this.register(() => popWatch.disconnect());
    this.registerEvent(this.app.metadataCache.on("changed", (file) => {
      this.scheduleRefresh(); this.syncDashboardLeaves(false);
      if (file && this.indexEmpty.has(file.path)) this.scheduleIndexSync(6000); // the page now may have a summary to show
      if (file && file.path.startsWith("Perspectives/")) this.refreshAllStrips(); // a response may have been added, renamed or changed
      else if (file) this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view && l.view.file && l.view.file.path === file.path) this.ensureStrips(l.view); });
    }));
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file, oldPath)));
    this.app.workspace.onLayoutReady(async () => {
      // keep _index.md up to date (registered now, so the files Obsidian loads at startup don't each count as a new page)
      this.registerEvent(this.app.vault.on("create", (f) => { if (this.indexable(f)) this.scheduleIndexSync(); }));
      this.registerEvent(this.app.vault.on("delete", (f) => { if (this.indexable(f)) this.scheduleIndexSync(); }));
      if (this.settings.autoIndex !== false) this.scheduleIndexSync(4000);
      // close the panels Obsidian keeps bringing back in the right sidebar (backlinks, outgoing links, tags, properties, outline)
      if (this.settings.hidePanels !== false) {
        for (const t of ["backlink", "outgoing-link", "tag", "all-properties", "outline"]) this.app.workspace.detachLeavesOfType(t);
      }
      if (performance.now() < 20000) window.setTimeout(() => this.closeOtherTabsOnStart(), 1500); // only when Obsidian itself just started (3.21.0), not when the plugin is reloaded later
      this.exitTinMode(); // Obsidian always opens in the Coppermind's mode (3.2.1): colors back, the right sidebar as it was before the Tinmind
      this.paintTinMode();
      this.startDashIntro();
      this.searchIndex.start();
      this.tinIndex.start();
      this.syncSchemaButtons(); this.syncHomeButtons();
      this.syncAtlasSidebars();
      await this.migrateHome();
      await this.migrateTinDashboard();
      await this.migrateTinBacklinks();
      await this.migrateHubNames();
      await this.migrateCourseLinks();
      this.registerEvent(this.app.metadataCache.on("resolved", () => { if (!this.settings.tinHubsRenamed) this.migrateHubNames(); })); // runs again once the properties are indexed
      if (this.app.vault.getAbstractFileByPath(DASHBOARD_PATH)) await this.fixHomepageSetting(); // the startup page follows the Dashboard's name
      await this.migrateSchemaStub();
      try {
        const r = await this.ensureLog(today());
        if (r.created) new Notice(`Started this month's log: ${r.file.basename}.`, 6000);
      } catch (e) { console.error("Nicrosil: could not start this month's log", e); new Notice(`Could not start this month's log: ${e.message}`, 10000); }
      this.syncDashboardLeaves(true);
      const f = this.app.workspace.getActiveFile();
      if (f) this.currentPath = f.path;
      this.refresh();
    });
  }

  onunload() {
    this.restoreAtlasSidebars();
    clearTimeout(this.dashIntroTimer);
    clearTimeout(this.indexTimer);
    document.querySelectorAll(".cm-schema-log-btn, .cm-respond-btn").forEach((e) => e.remove());
    this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view) { l.view.__cmSchemaBtn = null; l.view.__cmRespondBtn = null; } });
    document.querySelectorAll(".cm-resolve-btn, .cm-home-btn, .cm-underscore-btn, .cm-mode-btn, .cm-git-btn, .cm-panel-btn").forEach((e) => e.remove());
    document.body.classList.remove("cm-hide-underscore");
    document.body.classList.remove("cm-on-dashboard", "cm-on-tin", "cm-tin-mode");
    document.querySelectorAll(".cm-dashboard-leaf, .cm-log-leaf, .cm-agents-leaf, .cm-topics-leaf, .cm-tinnote-leaf, .cm-noprops-leaf, .cm-strip-leaf, .cm-props-open, .cm-st-verified, .cm-st-draft").forEach((e) => { e.classList.remove("cm-dashboard-leaf", "cm-log-leaf", "cm-agents-leaf", "cm-topics-leaf", "cm-tinnote-leaf", "cm-noprops-leaf", "cm-strip-leaf", "cm-props-open", "cm-st-verified", "cm-st-draft"); e.style.removeProperty("--cm-log-title"); });
    document.querySelectorAll(".cm-dashboard-tab").forEach((e) => e.classList.remove("cm-dashboard-tab"));
    document.body.classList.remove("cm-quiet");
    document.querySelectorAll(".cm-propstrip, .cm-ratebar, .cm-mytake, .cm-typedbar").forEach((e) => e.remove());
    this.stripObservers.forEach((o) => o.disconnect());
    this.stripObservers.clear();
    this.popObservers.forEach((o) => o.disconnect());
    this.popObservers.clear();
    this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view && l.view.containerEl) { l.view.containerEl.classList.remove("cm-strip-leaf", "cm-props-open"); l.view.containerEl.querySelectorAll(".cm-propstrip, .cm-ratebar, .cm-mytake, .cm-typedbar").forEach((e) => e.remove()); l.view.__cmStripObs = null; } });
  }

  async persist() {
    await this.saveData({ settings: this.settings, resolved: this.resolved });
  }

  registerCommands() {
    const onPage = (fn) => (checking) => {
      const f = this.currentFile();
      if (!f || !this.isReviewable(f)) return false;
      if (!checking) fn(f);
      return true;
    };
    this.addCommand({ id: "verify-page", name: "Verify this page", hotkeys: [{ modifiers: ["Alt"], key: "v" }], checkCallback: onPage((f) => this.verify(f)) });
    this.addCommand({ id: "reject-page", name: "Reject this draft (deletes it)", hotkeys: [{ modifiers: ["Alt"], key: "r" }], checkCallback: onPage((f) => this.reject(f)) });
    this.addCommand({ id: "skip-page", name: "Skip this draft for now", hotkeys: [{ modifiers: ["Alt"], key: "s" }], checkCallback: onPage((f) => this.skip(f)) });
    this.addCommand({ id: "resolve-flag", name: "Resolve a flag on this page", hotkeys: [{ modifiers: ["Alt"], key: "f" }], checkCallback: onPage((f) => this.pickFlag(f)) });
    this.addCommand({ id: "next-draft", name: "Open the next draft", hotkeys: [{ modifiers: ["Alt"], key: "n" }], callback: () => { const f = this.currentFile(); this.openNext(f ? f.path : null); } });
    this.addCommand({ id: "switch-mode", name: "Switch between the Coppermind and the Tinmind", hotkeys: [{ modifiers: ["Alt", "Shift"], key: "d" }], callback: () => this.toggleMode() });
    this.addCommand({ id: "show-files", name: "Show the file list", hotkeys: [{ modifiers: ["Alt"], key: "e" }], callback: () => this.showFiles() });
    this.addCommand({ id: "open-dashboard", name: "Go to the Dashboard", hotkeys: [{ modifiers: ["Alt"], key: "d" }], callback: () => this.openDashboard() });
    this.registerInterval(window.setInterval(() => this.syncHomeButtons(), 1500));
    this.scheduleTinRefresh = debounce(() => this.refreshTin(), 150, true);
    const inTin = (f) => !!f && typeof f.path === "string" && f.path.startsWith(NOTES_DIR);
    this.registerEvent(this.app.vault.on("create", (f) => { if (inTin(f)) this.scheduleTinRefresh(); }));
    this.registerEvent(this.app.vault.on("delete", (f) => { if (inTin(f)) this.scheduleTinRefresh(); }));
    this.registerEvent(this.app.vault.on("rename", (f, old) => { if (inTin(f) || String(old).startsWith(NOTES_DIR)) this.scheduleTinRefresh(); }));
    this.registerEvent(this.app.metadataCache.on("changed", (f) => { if (inTin(f)) this.scheduleTinRefresh(); }));
    this.registerEvent(this.app.workspace.on("file-open", (f) => { if (inTin(f)) this.scheduleTinRefresh(); }));
    this.addCommand({ id: "respond-to-page", name: "Respond to this page (new perspective)", hotkeys: [{ modifiers: ["Alt"], key: "p" }], checkCallback: (checking) => {
      const f = this.currentFile();
      if (!f || !this.isRespondable(f)) return false;
      if (!checking) this.respondTo(f);
      return true;
    } });
    this.addCommand({ id: "update-index", name: "Update the index now", callback: () => this.syncIndex({ manual: true }) });
    this.addCommand({ id: "log-schema-change", name: "Log a schema change", callback: () => this.openSchemaLog() });
    this.addCommand({ id: "open-wiki-map", name: "Open the atlas", hotkeys: [{ modifiers: ["Alt"], key: "m" }], callback: () => this.activateWikiMap() });
    this.addCommand({ id: "show-in-atlas", name: "Show this page in the atlas", checkCallback: (checking) => {
      const f = this.currentFile();
      if (!f || !inAtlasScope(f.path)) return false;
      if (!checking) this.activateWikiMap({ focus: f.path });
      return true;
    } });
    this.addCommand({ id: "open-relations", name: "Open the Lens", hotkeys: [{ modifiers: ["Alt"], key: "l" }], callback: () => this.activateRelations() });
    this.addCommand({ id: "open-queue", name: "Open the review queue", hotkeys: [{ modifiers: ["Alt"], key: "q" }], callback: () => this.activateView() });
    this.addCommand({ id: "open-transcription-queue", name: "Open the transcription queue", hotkeys: [{ modifiers: ["Alt"], key: "t" }], callback: () => this.activateTranscribe() });
  }

  /* --- the Coppermind button at the top of the file list --- */

  /** Puts a large "The Coppermind" button above the files in every file explorer. It opens the Dashboard; Ctrl+click or middle-click opens it in a new tab. */
  syncHomeButtons() {
    // Find the file explorers in the page itself rather than through leaf.view: sidebar views can still be
    // "deferred" (not loaded) when Obsidian starts, and then leaf.view has no content to look at.
    document.querySelectorAll('.workspace-leaf-content[data-type="file-explorer"]').forEach((leafEl) => {
      // The file list keeps its header buttons (.nav-header) and the files directly in the leaf, with no .view-content around them.
      const header = leafEl.querySelector(".nav-header");
      const holder = header ? header.parentElement : (leafEl.querySelector(".view-content") || leafEl);
      // the eye button sits at the right end of the sidebar's tab bar, beside the Files, Search and Bookmarks icons (3.4.0); the file list's own toolbar is hidden by styles.css
      const tabs = leafEl.closest(".workspace-tabs");
      const tabBar = tabs ? tabs.querySelector(":scope > .workspace-tab-header-container") : null;
      const tabRow = tabBar ? tabBar.querySelector(":scope > .workspace-tab-header-container-inner") : null;
      if (tabBar) tabBar.querySelectorAll(":scope > .cm-underscore-btn").forEach((e) => e.remove()); // the 3.4.0 spot, at the far right
      if (tabRow && !tabRow.querySelector(":scope > .cm-underscore-btn")) {
        const eye = createDiv({ cls: "clickable-icon cm-underscore-btn" });
        eye.setAttr("role", "button");
        eye.addEventListener("click", () => this.toggleUnderscoreFolders());
        tabRow.appendChild(eye); // right after the Files icon (Search and Bookmarks are hidden)
      }
      this.paintUnderscoreButtons();
      // the mode button sits right after the eye (3.8.0): it switches between the Coppermind and the Tinmind without opening a page
      if (tabRow && !tabRow.querySelector(":scope > .cm-mode-btn")) {
        const mode = createDiv({ cls: "clickable-icon cm-mode-btn" });
        mode.setAttr("role", "button"); mode.setAttr("tabindex", "0");
        mode.addEventListener("click", () => this.toggleMode());
        mode.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.toggleMode(); } });
        tabRow.insertBefore(mode, tabRow.querySelector(":scope > .cm-underscore-btn")); // the mode button comes first, then the eye (3.13.2)
      }
      if (tabRow) { // a tab bar made before 3.13.2 has the eye first: put the mode button ahead of it
        const eyeEl = tabRow.querySelector(":scope > .cm-underscore-btn"), modeEl = tabRow.querySelector(":scope > .cm-mode-btn");
        if (eyeEl && modeEl && (eyeEl.compareDocumentPosition(modeEl) & Node.DOCUMENT_POSITION_FOLLOWING)) tabRow.insertBefore(modeEl, eyeEl);
      }
      // after the mode button: the review queue and relations buttons (3.13.0, Coppermind mode only), then the two git buttons (3.12.0, both modes): Commit-and-sync, then Pull
      if (tabRow) {
        for (const g of [...PANEL_BUTTONS, ...GIT_BUTTONS]) {
          if (tabRow.querySelector(":scope > ." + g.cls)) continue;
          const b = createDiv({ cls: "clickable-icon " + (g.command ? "cm-git-btn " : "cm-panel-btn ") + g.cls });
          b.setAttr("role", "button"); b.setAttr("tabindex", "0");
          b.setAttr("aria-label", g.label);
          setIcon(b, g.icon);
          const go = () => (g.command ? this.runGit(g) : this[g.method]());
          b.addEventListener("click", go);
          b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
          tabRow.insertBefore(b, g.command ? null : tabRow.querySelector(":scope > .cm-git-btn")); // panel buttons go before the git ones
        }
      }
      this.paintModeButtons();
      const homeBtn = holder.querySelector(":scope > .cm-home-btn:not(.cm-tin-btn)");
      if (homeBtn && !holder.querySelector(":scope > .cm-tin-btn")) this.makeTinButton(homeBtn); // the Tinmind button sits under it (2.17.0)
      if (homeBtn) { this.ensureTinSide(holder); return; }
      const btn = createDiv({ cls: "cm-home-btn" });
      btn.setAttr("role", "button"); btn.setAttr("tabindex", "0");
      btn.setAttr("aria-label", "Open the Dashboard (Ctrl+click for a new tab)");
      btn.createSpan({ cls: "cm-logo cm-home-logo" }).setAttr("aria-hidden", "true");
      btn.createSpan({ cls: "cm-home-name", text: "The Coppermind" });
      btn.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); }); // no autoscroll on middle-click
      btn.addEventListener("click", (e) => this.openDashboard(e.ctrlKey || e.metaKey));
      btn.addEventListener("auxclick", (e) => { if (e.button === 1) { e.preventDefault(); this.openDashboard(true); } });
      btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.openDashboard(e.ctrlKey || e.metaKey); } });
      if (header) header.after(btn); else holder.prepend(btn);
      this.makeTinButton(btn);
      this.ensureTinSide(holder);
    });
  }

  /** The Tinmind button, directly under the Coppermind one: the same button in the Tinmind's colors and logo. It opens The Tinmind/Tinmind Dashboard; Ctrl+click or middle-click opens it in a new tab. */
  makeTinButton(after) {
    const btn = createDiv({ cls: "cm-home-btn cm-tin-btn" });
    btn.setAttr("role", "button"); btn.setAttr("tabindex", "0");
    btn.setAttr("aria-label", "Open The Tinmind (Ctrl+click for a new tab)");
    btn.createSpan({ cls: "cm-logo cm-logo-tin cm-home-logo" }).setAttr("aria-hidden", "true");
    btn.createSpan({ cls: "cm-home-name", text: "The Tinmind" });
    btn.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
    btn.addEventListener("click", (e) => this.openTinmind(e.ctrlKey || e.metaKey));
    btn.addEventListener("auxclick", (e) => { if (e.button === 1) { e.preventDefault(); this.openTinmind(true); } });
    btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.openTinmind(e.ctrlKey || e.metaKey); } });
    after.after(btn);
  }

  /**
   * Tinmind mode (2.18.0). Clicking The Tinmind (the file list button, or the Dashboard's card) switches the whole app to the Tinmind's
   * grey-and-lilac colors (the body class `cm-tin-mode`) and closes the right sidebar, which holds the review queue and the relations
   * panel. Opening the Dashboard (the Coppermind button, Alt+D) switches back, and the right sidebar comes back if it was open before.
   * The mode is saved in `data.json`, so it is still on after Obsidian restarts.
   */
  enterTinMode() {
    if (!this.settings.tinmindMode) {
      const rs = this.app.workspace.rightSplit;
      this.settings.tinmindMode = true;
      this.settings.tinRightWasOpen = !!rs && !rs.collapsed;
      this.persist();
    }
    this.paintTinMode();
    try {
      const ls = this.app.workspace.leftSplit;
      if (ls && ls.collapsed) ls.expand();
      const fe = this.app.workspace.getLeavesOfType("file-explorer")[0];
      if (fe) this.app.workspace.revealLeaf(fe); // the course tree lives in the file list's place
    } catch (e) { /* the tree is a convenience */ }
    this.refreshTin();
  }

  exitTinMode() {
    if (!this.settings.tinmindMode) return;
    const reopen = !!this.settings.tinRightWasOpen;
    this.settings.tinmindMode = false;
    delete this.settings.tinRightWasOpen;
    this.persist();
    this.paintTinMode();
    const rs = this.app.workspace.rightSplit;
    if (reopen && rs && rs.collapsed) rs.expand();
  }

  /** Puts the page in line with the saved mode: the body class, and the right sidebar closed while the mode is on. */
  paintTinMode() {
    const on = !!this.settings.tinmindMode;
    document.body.classList.toggle("cm-tin-mode", on);
    const rs = this.app.workspace.rightSplit;
    if (on && rs && !rs.collapsed) rs.collapse();
    this.paintModeButtons();
  }

  /** The mode button in the left sidebar's tab bar (3.8.0): switches between the Coppermind and the Tinmind, and opens no page. */
  /** Runs one of Obsidian Git's commands, as if I had clicked it in the Source Control panel. Nicrosil runs no git itself. */
  runGit(g) {
    const ok = this.app.commands.executeCommandById(g.command);
    if (!ok) new Notice("Obsidian Git isn't turned on, so this button can't run. Turn it on in Settings, Community plugins.", 8000);
  }

  /** Switches between the Coppermind and the Tinmind and brings the file list back (3.27.0), whichever left sidebar tab was showing. */
  toggleMode() {
    if (this.settings.tinmindMode) this.exitTinMode(); else this.enterTinMode();
    this.showFiles();
  }

  /** Opens the left sidebar on the file list (the Files tab's icon is hidden, so this is the way back from the search tab). */
  showFiles() {
    try {
      const ls = this.app.workspace.leftSplit;
      if (ls && ls.collapsed) ls.expand();
      const fe = this.app.workspace.getLeavesOfType("file-explorer")[0];
      if (fe) this.app.workspace.revealLeaf(fe);
    } catch (e) { /* a convenience */ }
  }

  /** Draws the mode button's icon: the Coppermind's logo in the Coppermind's mode, the Tinmind's logo in the Tinmind's. Drawn in the tab bar's own icon color, not a gradient. */
  paintModeButtons() {
    const tin = !!this.settings.tinmindMode;
    document.querySelectorAll(".cm-mode-btn").forEach((b) => {
      const mode = tin ? "tin" : "copper";
      if (b.dataset.mode === mode) return;
      b.dataset.mode = mode;
      b.empty();
      b.createSpan({ cls: tin ? "cm-logo cm-logo-tin cm-mode-logo" : "cm-logo cm-mode-logo" }).setAttr("aria-hidden", "true");
      b.setAttr("aria-label", tin ? "Switch to the Coppermind" : "Switch to the Tinmind");
    });
  }

  async openTinmind(newTab) {
    await this.migrateTinDashboard();
    const f = this.app.vault.getAbstractFileByPath(NOTES_DASHBOARD + ".md");
    if (!(f instanceof TFile)) { new Notice(`Couldn't find ${NOTES_DASHBOARD}.md.`); return; }
    this.enterTinMode();
    const already = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view.file && l.view.file.path === f.path);
    if (already && !newTab) { this.app.workspace.setActiveLeaf(already, { focus: true }); return; }
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(f, { state: { mode: "preview" } });
  }

  /** Shows or hides the folders and files whose names start with "_" in the file list. It is not remembered: they start hidden each time Obsidian opens. */
  toggleUnderscoreFolders() {
    document.body.classList.toggle("cm-hide-underscore");
    this.paintUnderscoreButtons();
  }

  paintUnderscoreButtons() {
    const hidden = document.body.classList.contains("cm-hide-underscore");
    document.querySelectorAll(".cm-underscore-btn").forEach((b) => {
      b.empty();
      setIcon(b, hidden ? "eye-off" : "eye");
      b.setAttr("aria-label", hidden ? "Show files and folders that start with _" : "Hide files and folders that start with _");
      b.toggleClass("is-active", !hidden);
    });
  }

  /* --- schema changelog --- */

  /** Shows a pen button in the header of any open tab in SCHEMAS/, and removes it from every other tab. It is drawn on screen only; nothing is written to the page. */
  syncSchemaButtons() {
    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (!view || typeof view.addAction !== "function") return;
      const onSchema = !!(view.file && view.file.path.startsWith(SCHEMA_DIR));
      const has = view.__cmSchemaBtn && view.__cmSchemaBtn.isConnected;
      if (onSchema && !has) {
        const btn = view.addAction("file-pen", "Log a schema change", () => this.openSchemaLog());
        btn.addClass("cm-schema-log-btn");
        view.__cmSchemaBtn = btn;
      } else if (!onSchema && view.__cmSchemaBtn) {
        view.__cmSchemaBtn.remove();
        view.__cmSchemaBtn = null;
      }
      // the Respond button, on pages in Wiki/, Sources/Source Cards/ and Perspectives/
      const canRespond = !!view.file && this.isRespondable(view.file);
      const hasR = view.__cmRespondBtn && view.__cmRespondBtn.isConnected;
      if (canRespond && !hasR) {
        const btn = view.addAction("message-square-plus", "Respond to this page (Alt+P)", () => { if (view.file) this.respondTo(view.file); });
        btn.addClass("cm-respond-btn");
        view.__cmRespondBtn = btn;
      } else if (!canRespond && view.__cmRespondBtn) {
        view.__cmRespondBtn.remove();
        view.__cmRespondBtn = null;
      }
    });
  }

  /* --- respond to a page: a perspective saved in Perspectives/, linked back from the page --- */

  isRespondable(file) {
    return file instanceof TFile && file.extension === "md" && /^(Wiki|Sources\/Source Cards|Perspectives)\//.test(file.path);
  }

  /** The perspectives whose `responds_to` points at this page, by name. */
  responsesTo(file) {
    const out = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!f.path.startsWith("Perspectives/") || f.path === file.path) continue;
      const fm = this.fm(f);
      if (String(fm.type || "") !== "perspective") continue;
      const v = fm.responds_to;
      const list = Array.isArray(v) ? v : v ? [v] : [];
      const hit = list.some((x) => {
        const m = /\[\[([^\]|#]+)/.exec(String(x));
        const dest = m && this.app.metadataCache.getFirstLinkpathDest(m[1].trim(), f.path);
        return !!dest && dest.path === file.path;
      });
      if (hit) out.push(f);
    }
    return out.sort((a, b) => a.basename.localeCompare(b.basename));
  }

  async respondTo(file) {
    const existing = this.responsesTo(file);
    if (!existing.length) return this.createResponse(file);
    new ResponsePicker(this.app, existing, (i) => { if (i.fresh) this.createResponse(file); else this.openResponse(i.file); }).open();
  }

  async openResponse(f) {
    const leaf = this.app.workspace.getLeaf("split", "vertical");
    await leaf.openFile(f, { state: { mode: "source" } });
  }

  /** Makes Perspectives/Response to <page>.md from the Perspective template, with `responds_to` set to the page, and opens it beside the page. */
  async createResponse(file) {
    try {
      const tplFile = this.app.vault.getAbstractFileByPath("_templates/Perspective.md");
      let tpl = tplFile instanceof TFile ? (await this.app.vault.read(tplFile)).replace(/\r\n/g, "\n") : "";
      if (!tpl.startsWith("---")) tpl = "---\ntype: perspective\nstatus: draft\nlayer: \nresponds_to: []\ncourses: []\nwritten_on: \"{{date:YYYY-MM-DD}}\"\nverified_on: \n---\n## My View\n- \n\n## Why I Hold It\n- \n\n## Where I Disagree or Feel Tension\n- \n\n## What Would Change My Mind\n- \n";
      const raw = this.fm(file).courses;
      const courses = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((c) => String(c).trim()).filter(Boolean);
      tpl = tpl.replace(/\{\{date:YYYY-MM-DD\}\}/g, today());
      tpl = tpl.replace(/^responds_to:.*$/m, `responds_to:\n  - ${JSON.stringify(`[[${file.basename}]]`)}`);
      if (courses.length) tpl = tpl.replace(/^courses:.*$/m, `courses:\n${courses.map((c) => `  - ${JSON.stringify(c)}`).join("\n")}`);
      if (!this.app.vault.getAbstractFileByPath("Perspectives")) await this.app.vault.createFolder("Perspectives");
      let name = `Response to ${file.basename}`, path = `Perspectives/${name}.md`, n = 2;
      while (this.app.vault.getAbstractFileByPath(path)) { name = `Response to ${file.basename} ${n++}`; path = `Perspectives/${name}.md`; }
      const made = await this.app.vault.create(path, tpl);
      await this.openResponse(made);
      new Notice(`Started “${name}”. The page links to it under its properties.`, 6000);
    } catch (e) {
      console.error("Nicrosil: couldn't start a response", e);
      new Notice(`Couldn't start a response: ${e.message}`, 8000);
    }
  }

  /** The "My take" line under a page's properties: links to the perspectives that respond to it. */
  drawMyTake(host, responses) {
    host.empty();
    host.createSpan({ cls: "cm-mytake-label", text: "My take" });
    responses.forEach((f) => {
      const a = host.createEl("a", { cls: "cm-mytake-link", text: f.basename, attr: { href: "#" } });
      a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); this.app.workspace.getLeaf(e.ctrlKey || e.metaKey ? "tab" : false).openFile(f); });
      if (this.fm(f).status !== "verified") host.createSpan({ cls: "cm-mytake-draft", text: "draft" });
    });
  }

  refreshAllStrips() {
    this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view && l.view.file) this.ensureStrips(l.view); });
  }

  schemaFile() {
    const f = this.app.vault.getAbstractFileByPath(SCHEMA_PATH);
    return f instanceof TFile ? f : null;
  }

  changelogFile() {
    const f = this.app.vault.getAbstractFileByPath(CHANGELOG_PATH);
    return f instanceof TFile ? f : null;
  }

  async openSchemaLog() {
    const file = this.changelogFile();
    if (!file) { new Notice(`Could not find ${CHANGELOG_PATH}.`); return; }
    const text = await this.app.vault.read(file);
    if (!findChangelog(text)) { new Notice("Schema Changelog has no “Changelog” heading, so there is nowhere to add the entry."); return; }
    const schema = this.schemaFile();
    const fmVersion = schema ? frontmatterValue(await this.app.vault.read(schema), "version") : null;
    new SchemaLogModal(this.app, this, text, fmVersion).open();
  }

  async addSchemaEntry(version, desc) {
    const file = this.changelogFile();
    if (!file) throw new Error(`Could not find ${CHANGELOG_PATH}.`);
    const schema = this.schemaFile();
    const date = today();
    const fmVersion = schema ? frontmatterValue(await this.app.vault.read(schema), "version") : null;
    await this.app.vault.process(file, (text) => {
      // Re-check against the file as it is right now (it may have changed since the dialog opened).
      const err = checkVersion(text, version, fmVersion);
      if (err) throw new Error(err);
      return addChangelogEntry(text, version, date, desc);
    });
    if (schema) await this.app.vault.process(schema, (text) => setFrontmatterProps(text, { version, updated: date }));
    new Notice(`Added ${version} to the Schema Changelog.`);
  }

  /* --- state --- */

  async refresh() {
    const items = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!this.isReviewable(f)) continue;
      const fm = this.fm(f);
      if (fm.status !== "draft" && fm.status !== "verified") continue;
      const flags = fm.status === "draft" ? parseFlags(await this.app.vault.cachedRead(f)) : [];
      items.push({ path: f.path, name: f.basename, group: groupOf(f.path), status: fm.status, flags, draftedOn: fm.drafted_on ? String(fm.drafted_on) : "", changes: fm.status === "draft" ? changeLines(fm.changes_since_verified) : [] });
    }
    this.items = items;
    this.skipped = this.skipped.filter((p) => items.some((i) => i.path === p && i.status === "draft"));
    this.renderAll();
  }

  queue() {
    return sortQueue(this.items.filter((i) => i.status === "draft"), this.settings.sort, this.skipped);
  }

  resolvedFor(path) { return this.resolved[path] || []; }

  async onRename(file, oldPath) {
    const wasIn = oldPath.endsWith(".md") && INDEX_SCOPE.some((re) => re.test(oldPath));
    if (wasIn || this.indexable(file)) {
      const oldName = oldPath.replace(/^.*\//, "").replace(/\.md$/, "");
      if (wasIn && this.indexable(file) && oldName !== file.basename) this.indexRenames.push([oldName, file.basename]);
      this.scheduleIndexSync();
    }
    if (this.resolved[oldPath]) {
      this.resolved[file.path] = this.resolved[oldPath];
      delete this.resolved[oldPath];
      await this.persist();
    }
    this.skipped = this.skipped.map((p) => (p === oldPath ? file.path : p));
    if (this.currentPath === oldPath) this.currentPath = file.path;
    this.scheduleRefresh();
  }

  currentFile() {
    const active = this.app.workspace.getActiveFile();
    if (active) return active;
    const f = this.currentPath && this.app.vault.getAbstractFileByPath(this.currentPath);
    return f instanceof TFile ? f : null;
  }

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

  /* --- dashboard --- */

  dashboardFile() {
    for (const p of [DASHBOARD_PATH, ...LEGACY_DASHBOARD_PATHS]) {
      const f = this.app.vault.getAbstractFileByPath(p);
      if (f instanceof TFile) return f;
    }
    return null;
  }

  isDashboard(file) {
    return file instanceof TFile && (file.path === DASHBOARD_PATH || LEGACY_DASHBOARD_PATHS.includes(file.path));
  }

  /** The Tinmind page (The Tinmind/Tinmind Dashboard): like the Dashboard, it never shows properties or a strip. */
  isTinDashboard(file) {
    return file instanceof TFile && file.path === NOTES_DASHBOARD + ".md";
  }

  /**
   * Tag panes showing the Dashboard, index, or log so CSS can hide their properties (and the Dashboard's title),
   * tag the body when the Dashboard is the active note, and fold the log's entries the first time it opens.
   */
  /** Record the title's text width in `--cm-title-w` so a verified title's gradient spans its words, not the whole line. */
  fitTitle(view) {
    const t = view.containerEl.querySelector(".inline-title");
    if (!t) return;
    const measure = () => {
      try {
        const r = document.createRange();
        r.selectNodeContents(t);
        const w = Math.ceil(r.getBoundingClientRect().width);
        if (w > 0) t.style.setProperty("--cm-title-w", w + "px");
      } catch (e) { /* ignore */ }
    };
    measure();
    requestAnimationFrame(measure);
    setTimeout(measure, 250);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure); // the title's font (Almendra SC) may finish loading after the first measure
    if (!t.dataset.cmFit) { t.dataset.cmFit = "1"; t.addEventListener("input", measure); }
  }

  syncDashboardLeaves(enforce) {
    const ws = this.app.workspace;
    ws.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;
      const path = view.file ? view.file.path : "";
      const isDash = this.isDashboard(view.file);
      const isLog = isLogPath(path);
      view.containerEl.classList.toggle("cm-dashboard-leaf", isDash);
      const isTin = this.isTinDashboard(view.file);
      view.containerEl.classList.toggle("cm-tin-leaf", isTin); // the Tinmind page: its own colors, no properties, and its file name and path are replaced by the hero (2.16.0, 2.17.0)
      if (leaf.tabHeaderEl) leaf.tabHeaderEl.classList.toggle("cm-dashboard-tab", isDash); // the Dashboard's tab shows the logo, not the file name
      view.containerEl.classList.toggle("cm-tinnote-leaf", !!view.file && path.startsWith(NOTES_DIR) && !isTin); // every note in the Tinmind: its title in the Tinmind Gradient Style (3.3.0)
      view.containerEl.classList.toggle("cm-log-leaf", isLog);
      view.containerEl.classList.toggle("cm-topics-leaf", path === TOPICS_PATH); // its file name in the Coppermind Gradient Style (3.30.0)
      view.containerEl.classList.toggle("cm-agents-leaf", path === "_AGENTS.md"); // its title reads AGENTS in the Coppermind Gradient Style (2.18.2)
      const logM = /^_logs\/_log (\d{2}-\d{2})\.md$/.exec(path); // a log's title reads "Log 11-26" (the theme draws it from --cm-log-title)
      if (logM) view.containerEl.style.setProperty("--cm-log-title", `"Log ${logM[1]}"`); else view.containerEl.style.removeProperty("--cm-log-title");
      view.containerEl.classList.toggle("cm-noprops-leaf", isDash || isTin || isLog || path === INDEX_PATH || (!!view.file && path.startsWith(NOTES_DIR))); // no properties on any note in the Tinmind (3.6.0)
      const pageStatus = view.file ? ((this.app.metadataCache.getFileCache(view.file) || {}).frontmatter || {}).status : "";
      view.containerEl.classList.toggle("cm-st-verified", pageStatus === "verified");
      view.containerEl.classList.toggle("cm-st-draft", pageStatus === "draft");
      try { this.fitTitle(view); } catch (e) { /* the title gradient is cosmetic; never let it stop the rest */ }
      const useStrip = !!view.file && !isDash && !isTin && !isLog && path !== INDEX_PATH;
      view.containerEl.classList.toggle("cm-strip-leaf", useStrip);
      if (this.stripPaths.get(view) !== path) {
        this.stripPaths.set(view, path);
        view.containerEl.classList.remove("cm-props-open"); // each note starts collapsed
      }
      if (useStrip) this.watchStrip(view); else this.removeStrips(view);
      if (isDash && enforce) this.enforceReading(leaf);
      if (isLog && this.foldedViews.get(view) !== path) {
        this.foldedViews.set(view, path);
        setTimeout(() => this.foldLogEntries(view), 300);
      }
      if (!isLog) this.foldedViews.delete(view);
    });
    document.body.classList.toggle("cm-on-dashboard", this.isDashboard(ws.getActiveFile()));
    document.body.classList.toggle("cm-on-tin", this.isTinDashboard(ws.getActiveFile()));
  }

  /**
   * Properties strip: the native Properties block is hidden and a one-line summary
   * (type, status, date) sits in its place. Clicking it expands the real block.
   */
  watchStrip(view) {
    this.ensureStrips(view);
    if (!view.__cmStripObs) {
      let timer = null;
      const obs = new MutationObserver(() => {
        if (timer) return;
        timer = setTimeout(() => { timer = null; this.ensureStrips(view); }, 60);
      });
      obs.observe(view.containerEl, { childList: true, subtree: true });
      view.__cmStripObs = obs;
      this.stripObservers.add(obs);
    }
  }

  /** A hover preview of a page gets the same one-line strip as an open page, in place of its Properties block. */
  watchPopover(el) {
    const hv = this.lastHover;
    if (!hv || Date.now() - hv.t > 4000) return;
    const file = hv.file;
    if ([DASHBOARD_PATH, ...LEGACY_DASHBOARD_PATHS, INDEX_PATH].includes(file.path) || this.isTinDashboard(file) || isLogPath(file.path) || !this.stripInfo(file)) return;
    el.classList.add("cm-strip-leaf");
    this.ensureStripsIn(el, file);
    let timer = null;
    const obs = new MutationObserver(() => {
      if (!el.isConnected) { obs.disconnect(); this.popObservers.delete(obs); return; }
      if (timer) return;
      timer = setTimeout(() => { timer = null; this.ensureStripsIn(el, file); }, 60);
    });
    obs.observe(el, { childList: true, subtree: true });
    this.popObservers.add(obs);
  }

  removeStrips(view) {
    view.containerEl.querySelectorAll(".cm-propstrip, .cm-ratebar, .cm-mytake, .cm-typedbar").forEach((e) => e.remove());
    if (view.__cmStripObs) { view.__cmStripObs.disconnect(); this.stripObservers.delete(view.__cmStripObs); view.__cmStripObs = null; }
  }

  stripInfo(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache && cache.frontmatter;
    if (!fm) return null;
    const day = (v) => (v ? String(v).slice(0, 10) : "");
    const status = fm.status ? String(fm.status) : "";
    const when = status === "verified" && fm.verified_on ? "verified " + day(fm.verified_on) : fm.drafted_on ? "drafted " + day(fm.drafted_on) : "";
    return { type: fm.type ? String(fm.type) : "", status, when };
  }

  ensureStrips(view) { this.ensureStripsIn(view.containerEl, view.file); }

  ensureStripsIn(root, file) {
    if (!file) return;
    // The Dashboard, index and logs never get a strip. A strip step queued by the note a pane showed before can run after the pane switches, so take any strip away here too.
    if (this.isDashboard(file) || this.isTinDashboard(file) || file.path === INDEX_PATH || isLogPath(file.path)) { root.querySelectorAll(".cm-propstrip, .cm-hub, .cm-backpill").forEach((s) => s.remove()); return; }
    const info = this.stripInfo(file);
    // When Obsidian re-renders a note (for example on switching between editing and reading),
    // it can re-create the Properties block or move the title, leaving an old strip stranded
    // somewhere else. Remove every strip that isn't directly in front of a Properties block,
    // so each block keeps exactly one strip.
    root.querySelectorAll(".cm-propstrip").forEach((s) => {
      const next = s.nextElementSibling;
      if (!next || !next.classList.contains("metadata-container")) s.remove();
    });
    root.querySelectorAll(".cm-ratebar").forEach((b) => {
      const prev = b.previousElementSibling;
      if (!prev || !prev.classList.contains("metadata-container")) b.remove();
    });
    root.querySelectorAll(".cm-mytake").forEach((b) => {
      const prev = b.previousElementSibling;
      if (!prev || !(prev.classList.contains("metadata-container") || prev.classList.contains("cm-ratebar"))) b.remove();
    });
    const inPreview = !!(root.classList.contains("hover-popover") || root.closest(".hover-popover"));
    const responses = inPreview ? [] : this.responsesTo(file);
    // Source cards also get the rating buttons, just under the Properties block (not in hover previews).
    const wantBar = this.isSourceCard(file) && !root.classList.contains("hover-popover") && !root.closest(".hover-popover");
    const metas = root.querySelectorAll(".metadata-container");
    // A course page (type: class-notes) gets the course's notes tree under its properties, drawn on screen only (3.1.0).
    const isHub = !inPreview && this.isClassHub(file);
    root.querySelectorAll(".cm-hub").forEach((h) => {
      const prev = h.previousElementSibling;
      if (!isHub || !prev || !prev.classList.contains("metadata-container") || h.__cmFile !== file) h.remove();
    });
    // A note inside a course gets a pill above its title that goes back to the course page (3.6.0), drawn on screen only.
    const back = inPreview || isHub ? null : this.backTarget(file);
    root.querySelectorAll(".cm-backpill").forEach((p) => {
      const nx = p.nextElementSibling;
      if (!back || p.__cmFile !== file || !nx || !(nx.classList.contains("inline-title") || nx.classList.contains("cm-propstrip") || nx.classList.contains("metadata-container"))) p.remove();
    });
    metas.forEach((meta) => {
      // The Add typed link button sits at the end of the open Properties block, on pages in Wiki/ (4.1.0).
      let tbar = meta.querySelector(":scope > .cm-typedbar");
      if (inPreview || !/^Wiki\//.test(file.path)) { if (tbar) tbar.remove(); }
      else {
        if (!tbar) { tbar = document.createElement("div"); tbar.className = "cm-typedbar"; meta.appendChild(tbar); }
        if (tbar.__cmFile !== file) { tbar.__cmFile = file; tbar.__open = false; this.drawTypedBar(tbar, file); }
        else if (tbar.__refresh) tbar.__refresh();
      }
      if (back) {
        const anchor = meta.parentElement.querySelector(":scope > .inline-title") || (meta.previousElementSibling && meta.previousElementSibling.classList.contains("cm-propstrip") ? meta.previousElementSibling : meta);
        let pill = anchor.previousElementSibling;
        if (pill && !pill.classList.contains("cm-backpill")) pill = null;
        if (!pill) {
          pill = document.createElement("div");
          pill.className = "cm-backpill";
          pill.setAttribute("role", "button");
          pill.tabIndex = 0;
          pill.addEventListener("click", (e) => { if (pill.__cmHub) this.openTinFile(pill.__cmHub, e.ctrlKey || e.metaKey); });
          pill.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && pill.__cmHub) { e.preventDefault(); this.openTinFile(pill.__cmHub, e.ctrlKey || e.metaKey); } });
          anchor.parentElement.insertBefore(pill, anchor);
        }
        pill.__cmFile = file;
        pill.__cmHub = back;
        const psig = [file.path, back.path, this.courseCtx(back).course].join("|");
        if (pill.dataset.sig !== psig) { pill.dataset.sig = psig; this.drawBackPill(pill, back); }
      }
      if (isHub) {
        let hub = meta.nextElementSibling;
        if (hub && !hub.classList.contains("cm-hub")) hub = null;
        if (!hub) {
          hub = document.createElement("div");
          hub.className = "cm-hub";
          meta.parentElement.insertBefore(hub, meta.nextSibling);
        }
        hub.__cmFile = file;
        const hsig = this.hubSig(file);
        if (hub.dataset.sig !== hsig) { hub.dataset.sig = hsig; this.drawHub(hub, file); }
      }
      let strip = meta.previousElementSibling;
      if (strip && !strip.classList.contains("cm-propstrip")) strip = null;
      if (!info) { if (strip) strip.remove(); return; }
      const sig = [info.type, info.status, info.when].join("|");
      if (!strip) {
        strip = document.createElement("div");
        strip.className = "cm-propstrip";
        strip.setAttribute("role", "button");
        strip.tabIndex = 0;
        const toggle = () => {
          const open = root.classList.toggle("cm-props-open");
          root.querySelectorAll(".cm-propstrip").forEach((s) => s.setAttribute("aria-expanded", String(open)));
        };
        strip.addEventListener("click", toggle);
        strip.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
        meta.parentElement.insertBefore(strip, meta);
      }
      strip.setAttribute("aria-expanded", String(root.classList.contains("cm-props-open")));
      strip.setAttribute("aria-label", "Show or hide this page's properties");
      let bar = meta.nextElementSibling;
      if (bar && bar.classList.contains("cm-hub")) bar = bar.nextElementSibling;
      if (bar && !bar.classList.contains("cm-ratebar")) bar = null;
      if (!wantBar) { if (bar) bar.remove(); }
      else {
        if (!bar) {
          bar = document.createElement("div");
          bar.className = "cm-ratebar";
          meta.parentElement.insertBefore(bar, meta.nextSibling);
        }
        const r = ratingOf(this.fm(file));
        const bsig = [file.path, file.stat.mtime, r.rel, r.cred].join("|");
        if (bar.dataset.sig !== bsig) { bar.dataset.sig = bsig; this.drawRatingButtons(bar, file); }
      }
      // "My take": the perspectives that respond to this page
      const anchor = wantBar && bar ? bar : meta;
      let take = anchor.nextElementSibling;
      if (take && !take.classList.contains("cm-mytake")) take = null;
      if (!responses.length) { if (take) take.remove(); }
      else {
        if (!take) {
          take = document.createElement("div");
          take.className = "cm-mytake";
          anchor.parentElement.insertBefore(take, anchor.nextSibling);
        }
        const tsig = [file.path, ...responses.map((f) => `${f.path}|${this.fm(f).status}`)].join(";");
        if (take.dataset.sig !== tsig) { take.dataset.sig = tsig; this.drawMyTake(take, responses); }
      }
      if (strip.dataset.sig === sig) return;
      strip.dataset.sig = sig;
      strip.empty ? strip.empty() : (strip.textContent = "");
      const chev = document.createElement("span");
      chev.className = "cm-strip-chev";
      try { setIcon(chev, "chevron-right"); } catch (e) { chev.textContent = "›"; }
      strip.appendChild(chev);
      const parts = [];
      if (info.type) parts.push(["cm-strip-type", info.type]);
      if (info.status) parts.push(["cm-strip-status cm-strip-" + info.status.replace(/[^a-z]/gi, ""), info.status]);
      if (info.when) parts.push(["cm-strip-when", info.when]);
      if (!parts.length) parts.push(["cm-strip-type", "properties"]);
      parts.forEach(([cls, text], i) => {
        if (i) { const dot = document.createElement("span"); dot.className = "cm-strip-dot"; dot.textContent = "·"; strip.appendChild(dot); }
        const s = document.createElement("span"); s.className = cls; s.textContent = text; strip.appendChild(s);
      });
    });
  }

  /** Fold every log entry heading (and nothing else) so the log opens as a short list. Editing view only. */
  foldLogEntries(view) {
    const ed = view.editor;
    if (!ed || !view.file || !isLogPath(view.file.path) || view.getMode() !== "source") return;
    try {
      ed.exec("unfoldAll");
      for (let i = 0, n = ed.lineCount(); i < n; i++) {
        if (/^#{2,4}\s+\[\d{4}-\d{2}-\d{2}\]/.test(ed.getLine(i))) {
          ed.setCursor({ line: i, ch: 0 });
          ed.exec("toggleFold");
        }
      }
      ed.setCursor({ line: 0, ch: 0 });
      ed.scrollTo(0, 0);
    } catch (e) {
      console.error("Nicrosil: couldn't fold the log", e);
    }
  }

  /** The Dashboard always opens in Reading view. Every other note keeps whatever mode it was in. */
  async enforceReading(leaf) {
    const view = leaf && leaf.view;
    if (!(view instanceof MarkdownView) || !this.isDashboard(view.file) || view.getMode() !== "source") return;
    const state = leaf.getViewState();
    await leaf.setViewState({ ...state, state: { ...state.state, mode: "preview" } });
  }

  /**
   * Opening a page puts it in Reading view (verified pages by default; see the "Open pages in Reading view" setting). Pages in The Tinmind are the exception: they open in editing view.
   * Each tab is looked at once per page it shows, so switching a page to editing yourself is left alone until that tab opens another page.
   */
  async readOnOpen(file) {
    try {
      const mode = this.settings.readMode || "verified";
      if (!(file instanceof TFile) || file.extension !== "md") return;
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view || !view.file || view.file.path !== file.path) return;
      const leaf = view.leaf;
      // Notes in The Tinmind open in editing view, whatever the setting says (3.3.1). A tab that was in Reading view for the page before
      // (the Tinmind Dashboard, say) would otherwise keep that mode. The dashboard itself stays in Reading view.
      if (file.path.startsWith(NOTES_DIR) && !this.isTinDashboard(file)) {
        if (this.readHandled.get(leaf) === file.path) return;
        this.readHandled.set(leaf, file.path);
        if (view.getMode() === "preview") {
          const st = leaf.getViewState();
          await leaf.setViewState({ ...st, state: { ...st.state, mode: "source" } });
        }
        return;
      }
      if (mode === "off") return;
      if (this.readHandled.get(leaf) === file.path) return;
      this.readHandled.set(leaf, file.path);
      if (view.getMode() !== "source") return;
      const status = ((this.app.metadataCache.getFileCache(file) || {}).frontmatter || {}).status;
      const wanted = mode === "all" ? file.stat.size > 0 : status === "verified";
      if (!wanted) return;
      const state = leaf.getViewState();
      await leaf.setViewState({ ...state, state: { ...state.state, mode: "preview" } });
    } catch (e) {
      console.error("Nicrosil: couldn't open the page in Reading view", e);
    }
  }

  /** The newest saved health check report (Health Checks/Health Check YYYY-MM-DD), read from file names. */
  latestHealthCheck() {
    let best = null;
    for (const f of this.app.vault.getMarkdownFiles()) {
      const m = /^Health Checks\/Health Check (\d{4}-\d{2}-\d{2})(?: \(\d+\))?\.md$/.exec(f.path);
      if (m && (!best || m[1] > best.date)) best = { date: m[1], file: f };
    }
    return best;
  }

  /** A small card on the Dashboard: days since the last health check against the schedule; amber when close, red when overdue. */
  drawHealthCard(el, intro) {
    const every = Math.max(1, parseInt(this.settings.healthDays, 10) || 14);
    const last = this.latestHealthCheck();
    const h = healthStatus(last ? last.date : null, today(), every);
    const card = el.createDiv({ cls: `cm-hc cm-hc-${h.state}` });
    const head = card.createDiv({ cls: "cm-hc-head" });
    head.createSpan({ cls: "cm-hc-title", text: "Health check" });
    const verdict = h.state === "none" ? "None recorded yet"
      : h.left < 0 ? `${plural(-h.left, "day")} overdue`
      : h.left === 0 ? "Due today"
      : h.left === 1 ? "Due tomorrow"
      : `Due in ${plural(h.left, "day")}`;
    head.createSpan({ cls: "cm-hc-verdict", text: verdict });
    const track = card.createDiv({ cls: "cm-hc-track" });
    const fill = track.createDiv({ cls: "cm-hc-fill" });
    const target = `${(h.pct * 100).toFixed(1)}%`;
    fill.style.width = intro ? "0%" : target;
    if (intro) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = target; }));
    let sub = `One every ${plural(every, "day")}.`;
    if (last) {
      const [y, mo, d] = last.date.split("-").map(Number);
      const when = new Date(y, mo - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      const ago = h.elapsed === 0 ? "today" : h.elapsed === 1 ? "yesterday" : `${plural(h.elapsed, "day")} ago`;
      sub = `Last one ${when} (${ago}). One every ${plural(every, "day")}.`;
      card.addClass("is-link");
      card.setAttr("role", "button"); card.setAttr("tabindex", "0");
      card.setAttr("aria-label", `Open the health check from ${when}`);
      const go = (e) => this.app.workspace.getLeaf(e.ctrlKey || e.metaKey ? "tab" : false).openFile(last.file);
      card.addEventListener("click", go);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter") go(e); });
    }
    card.createDiv({ cls: "cm-hc-sub", text: sub });
  }

  /** Goes to the part of a page a change note points to (its [[#Heading]]); with no location, just opens the page. */
  async openChange(path, change, newTab) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    const { target } = parseChange(change);
    const line = target ? locateInCache(this.app.metadataCache.getFileCache(file), target) : null;
    if (target && line === null) new Notice(`Couldn't find “${target.split("#").pop()}” in ${file.basename}, so I opened the page.`);
    const leaf = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view.file && l.view.file.path === path);
    if (leaf && !newTab) {
      this.app.workspace.setActiveLeaf(leaf, { focus: true });
      if (line !== null) leaf.view.setEphemeralState({ line });
      return;
    }
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file, line !== null ? { eState: { line } } : undefined);
  }

  /**
   * Start with one tab (3.21.0): once Obsidian has started and the startup page has had a moment to open, every main-area tab except the Dashboard is closed,
   * so a page left open last time (the transcription queue, a note) doesn't come back beside it in the Coppermind's mode. The Dashboard is opened if the
   * startup page didn't. Sidebars are left alone. Off with "Close the other tabs on startup" in the settings.
   */
  async closeOtherTabsOnStart() {
    if (this.settings.closeTabsOnStart === false) return;
    try {
      const ws = this.app.workspace;
      const f = this.dashboardFile();
      if (!f) return;
      const isDash = (l) => {
        const vs = l.getViewState();
        if (!vs || vs.type !== "markdown") return false;
        const p = l.view && l.view.file ? l.view.file.path : (vs.state || {}).file;
        return p === f.path;
      };
      const find = () => { let hit = null; ws.iterateRootLeaves((l) => { if (!hit && isDash(l)) hit = l; }); return hit; };
      let keep = find();
      if (!keep) { await this.openDashboard(); keep = find(); }
      if (!keep) return;
      const others = [];
      ws.iterateRootLeaves((l) => { if (l !== keep) others.push(l); });
      others.forEach((l) => l.detach());
      ws.setActiveLeaf(keep, { focus: true });
    } catch (e) { console.error("Nicrosil: couldn't close the other tabs on startup", e); }
  }

  async openDashboard(newTab) {
    const f = this.dashboardFile();
    if (!f) { new Notice(`Couldn't find ${DASHBOARD_PATH}.`); return; }
    this.exitTinMode();
    const already = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view.file && l.view.file.path === f.path);
    if (already && !newTab) { this.app.workspace.setActiveLeaf(already, { focus: true }); return; }
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(f, { state: { mode: "preview" } });
  }

  /* ---------- The Tinmind's sidebar and course pages (3.1.0) ---------- */
  /*
   * In Tinmind mode the file list is replaced, under the two buttons, by a tree of the semester's courses, so my class notes can be
   * made, renamed and deleted without the folders. A course is its notes file (`type: class-notes`, the "hub") and the folder next to
   * it with the same name (The Tinmind/Fall 26/SAIL.md and The Tinmind/Fall 26/SAIL/). The tree shows that folder's
   * notes and folders as they are, and the hub's headings. The same tree and a **New note** button are drawn at the top of each hub
   * page. All of it comes from folders and from Obsidian's index of headings and properties: Nicrosil never reads what the notes say,
   * and the page files are not changed by the panel.
   */

  isClassHub(file) {
    if (!(file instanceof TFile) || file.extension !== "md" || !file.path.startsWith(NOTES_DIR)) return false;
    if (this.isTinDashboard(file) || file.path === ALL_NOTES_PAGE + ".md") return false; // the Tinmind's own pages are not courses
    const fm = (this.app.metadataCache.getFileCache(file) || {}).frontmatter;
    return !!fm && (fm.type === "class-notes" || (fm.type === "notebook" && file.path === NOTEBOOK_PAGE + ".md")); // the Notebook works like a course with no semester (3.10.0)
  }

  isNotebook(file) { return file instanceof TFile && file.path === NOTEBOOK_PAGE + ".md"; }

  /** The Notebook page, when it is there and its properties are indexed (3.10.0). */
  notebookFile() {
    const f = this.app.vault.getAbstractFileByPath(NOTEBOOK_PAGE + ".md");
    return f instanceof TFile && this.isClassHub(f) ? f : null;
  }

  /** The folder that holds a course's own notes: the hub's folder plus the hub's name (a leftover " Notes" from before 3.5.0 is ignored). */
  courseFolderPath(hub) {
    const dir = hub.parent && hub.parent.path && hub.parent.path !== "/" ? hub.parent.path + "/" : "";
    return dir + hub.basename.replace(/ Notes$/, "");
  }

  courseCtx(hub) {
    const fm = (this.app.metadataCache.getFileCache(hub) || {}).frontmatter || {};
    return { hub, course: String(fm.course || hub.basename.replace(/ Notes$/, "")), semester: String(fm.semester || "").trim(), folder: this.courseFolderPath(hub), notebook: this.isNotebook(hub) };
  }

  /** The semesters and courses found in the Tinmind, and which semester is showing (the saved pick, else the current or newest). */
  tinSemesterState() {
    const all = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!f.path.startsWith(NOTES_DIR)) continue;
      const fm = (this.app.metadataCache.getFileCache(f) || {}).frontmatter;
      if (!fm || fm.type !== "class-notes" || !fm.semester) continue;
      const order = Number(fm.order);
      all.push({ file: f, order: Number.isFinite(order) ? order : 999, name: String(fm.course || f.basename), semester: String(fm.semester).trim(), current: fm.current === true });
    }
    // semesters made with New semester stay listed while their folder is there, even with no course in them yet
    const made = (this.settings.tinSemesters || []).filter((n) => this.app.vault.getAbstractFileByPath(NOTES_DIR + n) instanceof TFolder);
    const semesters = [...new Set([...all.map((c) => c.semester), ...made])].sort(byOldestSemester);
    const flagged = [...new Set(all.filter((c) => c.current).map((c) => c.semester))].sort(byOldestSemester);
    let chosen = this.settings.tinmindSemester;
    if (!semesters.includes(chosen)) chosen = newestSemester(flagged) || newestSemester(semesters);
    const courses = all.filter((c) => c.semester === chosen).sort((p, q) => p.order - q.order || p.name.localeCompare(q.name));
    return { all, semesters, chosen, courses };
  }

  treeSig(folder) {
    if (!(folder instanceof TFolder)) return "";
    return folder.children.map((c) => (c instanceof TFolder ? c.path + "/" + this.treeSig(c) : c.path)).join(",");
  }

  /** What a hub panel shows, as one string, so it is only redrawn when that changes. */
  hubSig(file) {
    const folder = this.app.vault.getAbstractFileByPath(this.courseFolderPath(file));
    const cache = this.app.metadataCache.getFileCache(file) || {};
    const heads = (cache.headings || []).map((h) => h.level + h.heading).join("|");
    const active = this.app.workspace.getActiveFile();
    return [file.path, (cache.frontmatter || {}).course, this.treeSig(folder), heads, active ? active.path : "", JSON.stringify(this.settings.tinOpen || {})].join("¦");
  }

  /** Redraws the sidebar tree and every hub panel (after a change in the Tinmind folder, a click, or a switch of mode). */
  refreshTin() {
    const st = this.tinSemesterState();
    const nbf = this.notebookFile();
    const sideSig = [st.chosen, st.semesters.join(","), ...st.courses.map((c) => this.hubSig(c.file)), nbf ? this.hubSig(nbf) : ""].join("§");
    document.querySelectorAll(".cm-tin-side").forEach((el) => {
      if (el.dataset.sig === sideSig) return;
      el.dataset.sig = sideSig;
      this.drawTinSide(el);
    });
    document.querySelectorAll(".cm-hub").forEach((el) => {
      if (!el.__cmFile || !el.isConnected) return;
      const sig = this.hubSig(el.__cmFile);
      if (el.dataset.sig === sig) return;
      el.dataset.sig = sig;
      this.drawHub(el, el.__cmFile);
    });
  }

  /** Makes sure a file list has the tree box under the two buttons. */
  ensureTinSide(holder) {
    if (holder.querySelector(":scope > .cm-tin-side")) return;
    const after = holder.querySelector(":scope > .cm-tin-btn");
    if (!after) return;
    const side = createDiv({ cls: "cm-tin-side" });
    after.after(side);
    this.drawTinSide(side);
  }

  drawTinSide(el) {
    el.empty();
    const st = this.tinSemesterState();
    if (st.semesters.length) this.drawSemSwitch(el, st.semesters, st.chosen, true); // under the Tinmind button (3.11.1)
    const list = el.createDiv({ cls: "cm-tin-list" });
    for (const c of st.courses) this.drawTinCourse(list, c);
    if (!st.courses.length) list.createDiv({ cls: "cm-sub", text: "No courses yet." });
    const nbf = this.notebookFile(); // pinned under the semester's courses, whichever semester is picked (3.10.0)
    if (nbf) this.drawTinCourse(el.createDiv({ cls: "cm-tin-pin" }), { file: nbf, name: "Notebook", icon: "pen-line" });
    const foot = el.createDiv({ cls: "cm-tin-foot" });
    const all = this.tinRow(foot, { depth: 0, icon: "library", label: "All Class Notes" });
    all.addEventListener("click", (e) => this.app.workspace.openLinkText(ALL_NOTES_PAGE, "", e.ctrlKey || e.metaKey));
    const add = this.tinRow(foot, { depth: 0, icon: "plus", label: "New course" });
    add.addClass("cm-tin-add");
    add.addEventListener("click", () => this.tinNewCourse(st));
    const addSem = this.tinRow(foot, { depth: 0, icon: "calendar-plus", label: "New semester" });
    addSem.addClass("cm-tin-add");
    addSem.addEventListener("click", () => this.tinNewSemester(st));
  }

  tinToggle(path) {
    const open = this.settings.tinOpen || (this.settings.tinOpen = {});
    open[path] = !open[path];
    this.persist();
    this.refreshTin();
  }

  /** Marks a course and the folders down to `folderPath` as open, so a new note is visible in the tree. */
  tinExpandTo(folderPath, ctx) {
    const open = this.settings.tinOpen || (this.settings.tinOpen = {});
    open[ctx.hub.path] = true;
    let cur = ctx.folder;
    open[cur] = true;
    if (folderPath.startsWith(ctx.folder + "/")) {
      for (const part of folderPath.slice(ctx.folder.length + 1).split("/")) { cur += "/" + part; open[cur] = true; }
    }
    this.persist();
  }

  tinRow(parentEl, o) {
    const row = parentEl.createDiv({ cls: "cm-tin-row" + (o.active ? " is-active" : "") + (o.cls ? " " + o.cls : "") });
    row.style.paddingLeft = 6 + o.depth * 14 + "px";
    const chev = row.createSpan({ cls: "cm-tin-chev" });
    if (o.chev !== undefined) setIcon(chev, o.chev ? "chevron-down" : "chevron-right");
    setIcon(row.createSpan({ cls: "cm-tin-icon" }), o.icon);
    row.createSpan({ cls: "cm-tin-label", text: o.label });
    // Middle button (3.6.1): no autoscroll cursor on a row, and a middle-click does what Ctrl+click does.
    row.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
    row.addEventListener("auxclick", (e) => {
      if (e.button !== 1 || e.__cmMiddle) return;
      e.preventDefault();
      row.dispatchEvent(new MouseEvent("click", { bubbles: false, cancelable: true, ctrlKey: true, button: 0 }));
    });
    return row;
  }

  /** Adds the "..." button and the right-click menu to a row. */
  tinRowMenu(row, show) {
    const more = row.createSpan({ cls: "cm-tin-more clickable-icon" });
    setIcon(more, "more-horizontal");
    more.setAttr("aria-label", "More");
    const fire = (e) => { e.preventDefault(); e.stopPropagation(); show(e); };
    more.addEventListener("click", fire);
    row.addEventListener("contextmenu", fire);
  }

  drawTinCourse(list, c) {
    const ctx = this.courseCtx(c.file);
    const open = this.settings.tinOpen || (this.settings.tinOpen = {});
    const isOpen = !!open[c.file.path];
    const active = this.app.workspace.getActiveFile();
    const row = this.tinRow(list, { depth: 0, icon: c.icon || "book-open", label: c.name, chev: isOpen, cls: "cm-tin-course", active: !!active && active.path === c.file.path });
    row.querySelector(".cm-tin-chev").addEventListener("click", (e) => { e.stopPropagation(); this.tinToggle(c.file.path); });
    row.addEventListener("click", (e) => {
      if (!isOpen) { open[c.file.path] = true; this.persist(); }
      this.openTinFile(c.file, e.ctrlKey || e.metaKey);
      this.refreshTin();
    });
    const plus = row.createSpan({ cls: "cm-tin-plus clickable-icon" });
    setIcon(plus, "plus");
    plus.setAttr("aria-label", "New note");
    plus.addEventListener("click", (e) => { e.stopPropagation(); this.tinNewNote(ctx.folder, ctx); });
    this.tinRowMenu(row, (e) => this.tinCourseMenu(e, ctx));
    if (!isOpen) return;
    this.drawCourseBody(list, ctx, 1);
  }

  /** The inside of a course: its folder's notes and folders, then the hub's own headings. Used by the sidebar and by the hub panel. */
  drawCourseBody(parentEl, ctx, depth) {
    const folder = this.app.vault.getAbstractFileByPath(ctx.folder);
    const hasNotes = folder instanceof TFolder && folder.children.some((k) => k instanceof TFolder || (k instanceof TFile && k.extension === "md"));
    if (hasNotes) this.drawTinFolder(parentEl, folder, depth, ctx);
    const heads = ((this.app.metadataCache.getFileCache(ctx.hub) || {}).headings || []).filter((h) => h.level <= 3);
    if (heads.length) {
      if (hasNotes) parentEl.createDiv({ cls: "cm-tin-label2", text: "On the course page" }).style.paddingLeft = 6 + depth * 14 + "px";
      const minLevel = Math.min(...heads.map((h) => h.level));
      for (const h of heads) {
        const row = this.tinRow(parentEl, { depth: depth + (h.level - minLevel), icon: "hash", label: h.heading, cls: "cm-tin-heading" });
        row.addEventListener("click", (e) => this.app.workspace.openLinkText(ctx.hub.path.replace(/\.md$/, "") + "#" + h.heading, "", e.ctrlKey || e.metaKey));
      }
    }
    if (!hasNotes && !heads.length) {
      const empty = parentEl.createDiv({ cls: "cm-tin-empty", text: "No notes yet. " });
      empty.style.paddingLeft = 6 + depth * 14 + "px";
      const a = empty.createEl("a", { text: "New note" });
      a.addEventListener("click", () => this.tinNewNote(ctx.folder, ctx));
    }
  }

  drawTinFolder(parentEl, folder, depth, ctx) {
    const kids = [...folder.children].filter((k) => k instanceof TFolder || (k instanceof TFile && k.extension === "md"));
    kids.sort((a, b) => ((a instanceof TFolder) === (b instanceof TFolder) ? naturalCompare(a.name, b.name) : a instanceof TFolder ? -1 : 1));
    const active = this.app.workspace.getActiveFile();
    const open = this.settings.tinOpen || (this.settings.tinOpen = {});
    for (const k of kids) {
      if (k instanceof TFolder) {
        const isOpen = !!open[k.path];
        const row = this.tinRow(parentEl, { depth, icon: isOpen ? "folder-open" : "folder", label: k.name, chev: isOpen, cls: isOpen ? "is-open" : "" });
        row.addEventListener("click", (e) => { if (!e.ctrlKey) this.tinToggle(k.path); });
        this.tinRowMenu(row, (e) => this.tinItemMenu(e, k, ctx));
        // an open folder's notes sit in their own block (3.25.0), so the course page can draw a guide line beside them; the sidebar draws it exactly as before
        if (isOpen) this.drawTinFolder(parentEl.createDiv({ cls: "cm-tin-nest" }), k, depth + 1, ctx);
      } else {
        const row = this.tinRow(parentEl, { depth, icon: "file-text", label: k.basename, active: !!active && active.path === k.path });
        row.addEventListener("click", (e) => this.openTinFile(k, e.ctrlKey || e.metaKey));
        this.tinRowMenu(row, (e) => this.tinItemMenu(e, k, ctx));
      }
    }
  }

  async openTinFile(file, newTab) {
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file, { state: { mode: "source" } }); // editing view (3.3.1)
  }

  tinCourseMenu(e, ctx) {
    const menu = new Menu();
    menu.addItem((i) => i.setTitle("New note").setIcon("file-plus").onClick(() => this.tinNewNote(ctx.folder, ctx)));
    menu.addItem((i) => i.setTitle("New folder").setIcon("folder-plus").onClick(() => this.tinNewFolder(ctx.folder, ctx)));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle(ctx.notebook ? "Open the Notebook page" : "Open the course page").setIcon("book-open").onClick(() => this.openTinFile(ctx.hub, false)));
    if (!ctx.notebook) { // 3.20.0: the Notebook is pinned and has no delete
      menu.addSeparator();
      menu.addItem((i) => i.setTitle("Delete course").setIcon("trash-2").setWarning(true).onClick(() => this.tinDeleteCourse(ctx)));
    }
    menu.showAtMouseEvent(e);
  }

  /**
   * Delete a course (3.20.0): its page and its folder go to the trash together, after a question that says how many files are in the folder.
   * The folder goes first, so a failure leaves the page (and the course) in place. Nothing else is touched; links to the deleted notes are left as they are.
   */
  async tinDeleteCourse(ctx) {
    const hub = ctx.hub;
    if (!hub || ctx.notebook) return;
    const name = ctx.course || hub.basename.replace(/ Notes$/, "");
    const folder = this.app.vault.getAbstractFileByPath(ctx.folder);
    let count = 0;
    const walk = (f) => f.children.forEach((c) => (c instanceof TFolder ? walk(c) : count++));
    if (folder instanceof TFolder) walk(folder);
    const message = count
      ? `Delete the course "${name}"? Its page and its folder, with the ${count} file${count === 1 ? "" : "s"} in it, go to the trash. Move any notes you want to keep first.`
      : `Delete the course "${name}"? Its page${folder instanceof TFolder ? " and its empty folder" : ""} go to the trash.`;
    if (!(await this.tinConfirm({ title: "Delete course", message, ok: "Delete course" }))) return;
    try {
      if (folder instanceof TFolder) await this.app.fileManager.trashFile(folder);
      await this.app.fileManager.trashFile(hub);
      const open = this.settings.tinOpen || {};
      for (const k of Object.keys(open)) if (k === hub.path || k.startsWith(ctx.folder + "/")) delete open[k];
      this.persist();
      new Notice(`Deleted the course "${name}". It is in the trash.`);
    } catch (e) {
      console.error("Nicrosil: couldn't delete the course", e);
      new Notice("Couldn't delete that course. See the console for why.");
    }
    this.refreshTin();
    this.dashboards.forEach((r) => r());
  }

  tinItemMenu(e, target, ctx) {
    const menu = new Menu();
    if (target instanceof TFolder) {
      menu.addItem((i) => i.setTitle("New note here").setIcon("file-plus").onClick(() => this.tinNewNote(target.path, ctx)));
      menu.addItem((i) => i.setTitle("New folder here").setIcon("folder-plus").onClick(() => this.tinNewFolder(target.path, ctx)));
      menu.addSeparator();
    } else {
      menu.addItem((i) => i.setTitle("Open in a new tab").setIcon("external-link").onClick(() => this.openTinFile(target, true)));
      menu.addSeparator();
    }
    menu.addItem((i) => i.setTitle("Rename").setIcon("pencil").onClick(() => this.tinRename(target)));
    menu.addItem((i) => i.setTitle("Delete").setIcon("trash-2").setWarning(true).onClick(() => this.tinDelete(target)));
    menu.showAtMouseEvent(e);
  }

  tinPrompt(opts) { return new Promise((resolve) => new TinPromptModal(this.app, opts, resolve).open()); }
  tinConfirm(opts) { return new Promise((resolve) => new TinConfirmModal(this.app, opts, resolve).open()); }

  async tinEnsureFolder(path) {
    let cur = "";
    for (const part of path.split("/")) {
      cur = cur ? cur + "/" + part : part;
      if (!this.app.vault.getAbstractFileByPath(cur)) await this.app.vault.createFolder(cur);
    }
  }

  tinUniquePath(dir, name, ext) {
    let p = `${dir}/${name}${ext}`, n = 2;
    while (this.app.vault.getAbstractFileByPath(p)) p = `${dir}/${name} ${n++}${ext}`;
    return p;
  }

  /** Asks for a name and makes a note in `folderPath` (made if it isn't there yet), with the course and semester as properties and a link back to the course page. */
  async tinNewNote(folderPath, ctx, quick = false) {
    // The name starts as "<course> mm-dd-yy" for today (dashes, because a file name can't hold slashes); Enter takes it, or add to it first. A second note the same day gets " 2".
    const now = new Date(), pad = (n) => String(n).padStart(2, "0");
    const stamp = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${String(now.getFullYear()).slice(-2)}`;
    // quick (3.10.0): the Notebook's Quick note takes that name without asking.
    const name = cleanName(quick ? `${ctx.course} ${stamp}` : await this.tinPrompt({ title: "New note", label: `In ${ctx.course}`, value: `${ctx.course} ${stamp}`, caret: "end", ok: "Create" }));
    if (!name) return;
    try {
      await this.tinEnsureFolder(folderPath);
      const path = this.tinUniquePath(folderPath, name, ".md");
      const body = ctx.notebook ? `---\ntype: notebook-note\n---\n` : `---\ntype: course-note\ncourse: ${JSON.stringify(ctx.course)}\nsemester: ${JSON.stringify(ctx.semester)}\n---\n`;
      const file = await this.app.vault.create(path, body);
      this.tinExpandTo(folderPath, ctx);
      await this.app.workspace.getLeaf(false).openFile(file, { state: { mode: "source" } });
    } catch (e) {
      console.error("Nicrosil: couldn't make the note", e);
      new Notice("Couldn't make that note. See the console for why.");
    }
    this.refreshTin();
  }

  /** The Notebook card's Quick note (3.10.0): a note named "Notebook mm-dd-yy" in the Notebook folder, made and opened ready to type with no question asked. */
  async tinQuickNote() {
    const nb = this.notebookFile();
    if (!nb) { new Notice("The Notebook page isn't there yet: The Tinmind/Notebook.md with type: notebook."); return; }
    const ctx = this.courseCtx(nb);
    await this.tinNewNote(ctx.folder, ctx, true);
  }

  async tinNewFolder(parentPath, ctx) {
    const name = cleanName(await this.tinPrompt({ title: "New folder", label: `In ${ctx.course}`, ok: "Create" }));
    if (!name) return;
    try {
      await this.tinEnsureFolder(parentPath);
      const path = this.tinUniquePath(parentPath, name, "");
      await this.app.vault.createFolder(path);
      this.tinExpandTo(parentPath, ctx);
      this.settings.tinOpen[path] = true;
      this.persist();
    } catch (e) {
      console.error("Nicrosil: couldn't make the folder", e);
      new Notice("Couldn't make that folder. See the console for why.");
    }
    this.refreshTin();
  }

  async tinRename(target) {
    const isFolder = target instanceof TFolder;
    const current = isFolder ? target.name : target.basename;
    const name = cleanName(await this.tinPrompt({ title: isFolder ? "Rename folder" : "Rename note", value: current, ok: "Rename" }));
    if (!name || name === current) return;
    const dir = target.parent && target.parent.path && target.parent.path !== "/" ? target.parent.path + "/" : "";
    const newPath = dir + name + (isFolder ? "" : "." + target.extension);
    if (this.app.vault.getAbstractFileByPath(newPath)) { new Notice(`"${name}" already exists there.`); return; }
    const oldPath = target.path;
    try {
      await this.app.fileManager.renameFile(target, newPath); // Obsidian updates links to it
      const open = this.settings.tinOpen || {};
      for (const k of Object.keys(open)) {
        if (k === oldPath || k.startsWith(oldPath + "/")) { open[newPath + k.slice(oldPath.length)] = open[k]; delete open[k]; }
      }
      this.persist();
    } catch (e) {
      console.error("Nicrosil: couldn't rename", e);
      new Notice("Couldn't rename that. See the console for why.");
    }
    this.refreshTin();
  }

  async tinDelete(target) {
    const isFolder = target instanceof TFolder;
    let count = 0;
    const walk = (f) => f.children.forEach((c) => (c instanceof TFolder ? walk(c) : count++));
    if (isFolder) walk(target);
    const message = isFolder
      ? `Delete the folder "${target.name}" and the ${count} file${count === 1 ? "" : "s"} in it? They go to the trash.`
      : `Delete "${target.basename}"? It goes to the trash.`;
    if (!(await this.tinConfirm({ title: isFolder ? "Delete folder" : "Delete note", message, ok: "Delete" }))) return;
    try {
      await this.app.fileManager.trashFile(target);
    } catch (e) {
      console.error("Nicrosil: couldn't delete", e);
      new Notice("Couldn't delete that. See the console for why.");
    }
    this.refreshTin();
  }

  /** Asks for a semester name ("Fall 27", "Spring 2027"), makes its folder, and switches to it. The name is tidied to "Season YY" so the semesters sort by date. */
  async tinNewSemester(st) {
    let suggest = "";
    const newest = [...st.semesters].reverse().find((x) => semesterKey(x) !== null);
    if (newest) {
      const k = semesterKey(newest), y = Math.floor(k / 10), season = k % 10;
      suggest = season >= 3 ? `Spring ${String(y + 1).slice(-2)}` : season === 0 ? `Spring ${String(y).slice(-2)}` : `Fall ${String(y).slice(-2)}`;
    }
    const typed = cleanName(await this.tinPrompt({ title: "New semester", label: "A season and a year, such as Fall 27 or Spring 2027", value: suggest, ok: "Create" }));
    if (!typed) return;
    const m = /^(winter|spring|summer|fall|autumn)\s+(\d{2}|\d{4})$/i.exec(typed);
    if (!m) { new Notice("Use a season and a year, such as Fall 27, so semesters stay in order."); return; }
    const name = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() + " " + m[2].slice(-2);
    try {
      if (!st.semesters.includes(name)) {
        await this.tinEnsureFolder(NOTES_DIR + name);
        this.settings.tinSemesters = [...new Set([...(this.settings.tinSemesters || []), name])];
      }
      this.settings.tinmindSemester = name;
      await this.persist();
      this.dashboards.forEach((r) => r());
    } catch (e) {
      console.error("Nicrosil: couldn't make the semester", e);
      new Notice("Couldn't make that semester. See the console for why.");
    }
    this.refreshTin();
  }

  /** Makes a course page (and, on its first note, its folder) for the semester showing. */
  async tinNewCourse(st) {
    if (!st.chosen) { new Notice("There is no semester yet. Make one with New semester first."); return; }
    const name = cleanName(await this.tinPrompt({ title: "New course", label: `In ${st.chosen}`, ok: "Create" }));
    if (!name) return;
    try {
      const dir = st.courses.length ? st.courses[0].file.parent.path : NOTES_DIR + st.chosen;
      await this.tinEnsureFolder(dir);
      const path = this.tinUniquePath(dir, name, ".md"); // the course page is named for the course (3.5.0)
      const order = st.courses.reduce((m, c) => (c.order < 999 ? Math.max(m, c.order) : m), 0) + 1;
      const current = st.courses.some((c) => c.current);
      const body = `---\ntype: class-notes\ncourse: ${JSON.stringify(name)}\nsemester: ${JSON.stringify(st.chosen)}\ncurrent: ${current}\norder: ${order}\n---\n`;
      const file = await this.app.vault.create(path, body);
      this.settings.tinOpen = this.settings.tinOpen || {};
      this.settings.tinOpen[file.path] = true;
      this.persist();
    } catch (e) {
      console.error("Nicrosil: couldn't make the course", e);
      new Notice("Couldn't make that course. See the console for why.");
    }
    this.refreshTin();
  }

  /** The course page a note belongs to: found by walking up the note's folders for one whose name matches a course page (Fall 26/Chinese I/ goes with Fall 26/Chinese I.md). */
  backTarget(file) {
    if (!(file instanceof TFile) || file.extension !== "md" || !file.path.startsWith(NOTES_DIR)) return null;
    if (this.isClassHub(file) || this.isTinDashboard(file) || file.path === ALL_NOTES_PAGE + ".md") return null;
    const root = NOTES_DIR.replace(/\/$/, "");
    let p = file.parent;
    while (p && p.path && p.path !== "/" && p.path.startsWith(root)) {
      const h = this.app.vault.getAbstractFileByPath(p.path + ".md");
      if (h instanceof TFile && this.isClassHub(h)) return h;
      p = p.parent;
    }
    return null;
  }

  drawBackPill(pill, hub) {
    pill.empty();
    pill.setAttribute("aria-label", this.isNotebook(hub) ? "Go to the Notebook page (Ctrl+click for a new tab)" : "Go to the course page (Ctrl+click for a new tab)");
    setIcon(pill.createSpan({ cls: "cm-backpill-icon" }), "arrow-left");
    pill.createSpan({ text: this.courseCtx(hub).course });
  }

  /** The panel at the top of a course page: New note and New folder buttons, the course's notes, and the page's headings. Drawn on screen; the page file is not changed. */
  drawHub(panel, file) {
    panel.empty();
    const ctx = this.courseCtx(file);
    // Open tree (3.25.0): a section heading with a rule running out to the right, and the two actions as text links.
    const head = panel.createDiv({ cls: "cm-hub-head" });
    head.createEl("h4", { cls: "cm-hub-title cm-tin-gradient-style", text: "Notes" });
    head.createDiv({ cls: "cm-hub-rule" });
    const btns = head.createDiv({ cls: "cm-hub-btns" });
    const act = (label, icon, fn) => {
      const b = btns.createEl("button", { cls: "cm-hub-act" });
      setIcon(b.createSpan({ cls: "cm-hub-act-icon" }), icon);
      b.createSpan({ text: label });
      b.addEventListener("click", fn);
    };
    act("New note", "plus", () => this.tinNewNote(ctx.folder, ctx));
    btns.createDiv({ cls: "cm-hub-sep" });
    act("New folder", "folder-plus", () => this.tinNewFolder(ctx.folder, ctx));
    const body = panel.createDiv({ cls: "cm-hub-body" });
    this.drawCourseBody(body, ctx, 0);
  }

  /** One time (3.2.0): The Tinmind/Notes Dashboard.md becomes Tinmind Dashboard.md. Obsidian's own rename, so links to it follow. */
  async migrateTinDashboard() {
    const old = this.app.vault.getAbstractFileByPath(OLD_NOTES_DASHBOARD);
    if (!(old instanceof TFile) || this.app.vault.getAbstractFileByPath(NOTES_DASHBOARD + ".md")) return;
    try {
      await this.app.fileManager.renameFile(old, NOTES_DASHBOARD + ".md");
      new Notice("Renamed Notes Dashboard to Tinmind Dashboard.", 6000);
    } catch (e) {
      console.error("Nicrosil: couldn't rename the Tinmind Dashboard", e);
      new Notice(`Couldn't rename Notes Dashboard to Tinmind Dashboard: ${e.message}. Rename it by hand in the file list.`, 10000);
    }
  }

  /**
   * One time (3.3.0): takes the "← [[...Dashboard]]" line out of the Tinmind's notes (course pages had one under their properties).
   * The Tinmind button already goes back. Only a line that is exactly that link is removed; nothing else in a note is touched.
   * It runs once, at startup, and the count is shown. New course pages are made without the line.
   */
  async migrateTinBacklinks() {
    if (this.settings.tinBacklinksRemoved) return;
    const re = /^[ \t]*\u2190[ \t]*\[\[[^\]\n]*(?:Notes|Tinmind) Dashboard[^\]\n]*\]\][ \t]*(?:\r?\n|$)/gm;
    let n = 0;
    try {
      for (const f of this.app.vault.getMarkdownFiles()) {
        if (!f.path.startsWith(NOTES_DIR) || this.isTinDashboard(f) || f.path === OLD_NOTES_DASHBOARD || f.path === ALL_NOTES_PAGE + ".md") continue;
        let changed = false;
        await this.app.vault.process(f, (text) => {
          const next = text.replace(re, "");
          changed = next !== text;
          return next;
        });
        if (changed) n++;
      }
      this.settings.tinBacklinksRemoved = true;
      await this.persist();
      if (n) new Notice(`Removed the link to the Tinmind Dashboard from ${n} course note${n === 1 ? "" : "s"}.`, 8000);
    } catch (e) {
      console.error("Nicrosil: couldn't remove the dashboard links", e);
    }
  }

  /**
   * One time (3.5.0): a course page named "<Course> Notes" becomes "<Course>" (Obsidian's own rename, so links follow). Only a note directly in a
   * semester folder with `type: class-notes` is renamed, and not if the new name is taken or another note anywhere already has that name (links by
   * name would become ambiguous). Notes whose properties aren't indexed yet are left for the next run; it runs again until all are seen.
   */
  async migrateHubNames() {
    if (this.settings.tinHubsRenamed || this._renamingHubs) return;
    this._renamingHubs = true;
    try {
      const re = /^The Tinmind\/[^/]+\/([^/]+) Notes\.md$/;
      let pending = false, n = 0;
      const skipped = [];
      const open = this.settings.tinOpen || {};
      for (const f of [...this.app.vault.getMarkdownFiles()]) {
        const m = re.exec(f.path);
        if (!m) continue;
        const cache = this.app.metadataCache.getFileCache(f);
        if (!cache) { pending = true; continue; }
        if (!cache.frontmatter || cache.frontmatter.type !== "class-notes") continue;
        const target = f.parent.path + "/" + m[1] + ".md";
        if (this.app.vault.getAbstractFileByPath(target) || this.app.vault.getMarkdownFiles().some((g) => g !== f && g.basename === m[1])) { skipped.push(m[1]); continue; }
        const oldPath = f.path;
        try {
          await this.app.fileManager.renameFile(f, target);
          if (open[oldPath] !== undefined) { open[target] = open[oldPath]; delete open[oldPath]; }
          n++;
        } catch (e) { console.error("Nicrosil: couldn't rename a course page", e); skipped.push(m[1]); }
      }
      if (!pending) { this.settings.tinHubsRenamed = true; }
      await this.persist();
      if (n) new Notice(`Renamed ${n} course page${n === 1 ? "" : "s"}: "Notes" is gone from the end of their names.`, 8000);
      if (skipped.length) new Notice(`Left these course pages as they are, because another note already has that name: ${skipped.join(", ")}.`, 12000);
      if (n) this.refreshTin();
    } catch (e) {
      console.error("Nicrosil: couldn't rename the course pages", e);
    } finally {
      this._renamingHubs = false;
    }
  }

  /**
   * One time (3.6.0): takes the "← [[The Tinmind/.../Course]]" line out of the notes inside courses (type: course-note). The pill above the title
   * does that job now. Only that one line, at the start of a line and pointing into The Tinmind/, and the blank line after it; nothing else is touched.
   */
  async migrateCourseLinks() {
    if (this.settings.tinCourseLinksRemoved) return;
    const re = /^\u2190[ \t]*\[\[The Tinmind\/[^\]\n]*\]\][ \t]*\r?\n(?:[ \t]*\r?\n)?/m;
    let n = 0;
    try {
      for (const f of this.app.vault.getMarkdownFiles()) {
        if (!f.path.startsWith(NOTES_DIR) || this.isTinDashboard(f) || f.path === ALL_NOTES_PAGE + ".md") continue;
        let changed = false;
        await this.app.vault.process(f, (text) => {
          if (!/^---\r?\n(?:[^\n]*\n){0,8}?type:[ \t]*"?course-note"?/.test(text)) return text;
          const next = text.replace(re, "");
          changed = next !== text;
          return next;
        });
        if (changed) n++;
      }
      this.settings.tinCourseLinksRemoved = true;
      await this.persist();
      if (n) new Notice(`Took the course link out of ${n} note${n === 1 ? "" : "s"}; a button above the title does that now.`, 8000);
    } catch (e) {
      console.error("Nicrosil: couldn't remove the course links", e);
    }
  }

  /** One-time: rename Home.md to Dashboard.md (Obsidian updates links) and repoint the startup-page plugin. */
  async migrateHome() {
    const old = this.app.vault.getAbstractFileByPath(OLD_HOME_PATH);
    if (!(old instanceof TFile) || this.app.vault.getAbstractFileByPath(DASHBOARD_PATH)) return;
    try {
      await this.app.fileManager.renameFile(old, DASHBOARD_PATH);
      await this.fixHomepageSetting();
      await this.appendLog(renameLogEntry(today()));
      new Notice("Renamed Home to Dashboard and updated its links. Restart Obsidian once so the startup page uses the new name.", 15000);
    } catch (e) {
      console.error("Nicrosil: rename failed", e);
      new Notice(`Couldn't rename Home to Dashboard: ${e.message}. Rename it by hand in the file list.`, 10000);
    }
  }

  /** One time, after the rules moved to SCHEMAS/ (rules 7.0): the old SCHEMA.md at the top of the vault is a
   *  "moved" stub, so it goes to the trash, leaving one page named SCHEMA for links to find. Only a file that
   *  carries the stub's `moved_to` property is touched. */
  async migrateSchemaStub() {
    const old = this.app.vault.getAbstractFileByPath("SCHEMA.md");
    if (!(old instanceof TFile) || !(this.app.vault.getAbstractFileByPath(SCHEMA_PATH) instanceof TFile)) return;
    if (frontmatterValue(await this.app.vault.read(old), "moved_to") !== SCHEMA_PATH) return;
    try {
      await this.app.fileManager.trashFile(old);
      new Notice("The rules now live in SCHEMAS/, so the old SCHEMA.md at the top of the vault was moved to the trash.", 10000);
    } catch (e) {
      console.error("Nicrosil: couldn't remove the old SCHEMA.md", e);
      new Notice(`Couldn't remove the old SCHEMA.md: ${e.message}. Delete it by hand; the rules are in SCHEMAS/.`, 10000);
    }
  }

  async fixHomepageSetting() {
    const path = `${this.app.vault.configDir}/plugins/homepage/data.json`;
    try {
      if (!(await this.app.vault.adapter.exists(path))) return;
      const data = JSON.parse(await this.app.vault.adapter.read(path));
      let changed = false;
      Object.values(data.homepages || {}).forEach((h) => {
        if (h && [OLD_HOME_PATH, "Home", "Dashboard.md", "Dashboard"].includes(h.value)) { h.value = DASHBOARD_PATH; h.view = "Reading view"; changed = true; }
      });
      if (changed) await this.app.vault.adapter.write(path, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Nicrosil: couldn't update the startup page setting", e);
      new Notice("Couldn't update the startup page setting. In Settings → Homepage, choose _dashboard.", 10000);
    }
  }

  /**
   * The atlas's data (3.29.0): every page in Wiki/ and Perspectives/, the links between them, the topics in _topics.md,
   * which topic each page is in, and where everything sits. Worked out again only when the links, the pages or the topic
   * list change; a status change only recolors. Shared by the atlas and the Lens.
   */
  async atlas() {
    const mc = this.app.metadataCache;
    const tf = this.app.vault.getAbstractFileByPath(TOPICS_PATH);
    const text = tf instanceof TFile ? await this.app.vault.cachedRead(tf) : null;
    const files = this.app.vault.getMarkdownFiles().filter((f) => inAtlasScope(f.path)).sort((a, b) => (a.path < b.path ? -1 : 1));
    const edges = collectLinks(this.app).filter((e) => inAtlasScope(e.from) && inAtlasScope(e.to));
    const key = `${text}\n${files.map((f) => f.path).join("\n")}\n${edges.map((e) => `${e.from}>${e.to}>${e.type}`).sort().join("\n")}`;
    const fmOf = (f) => (mc.getFileCache(f) || {}).frontmatter || {};
    if (this.atlasCache && this.atlasCache.key === key) {
      for (const f of files) { const n = this.atlasCache.nodes.get(f.path); if (n) { const fm = fmOf(f); n.state = pageState(fm); n.type = String(fm.type || ""); } }
      return this.atlasCache;
    }
    const nodes = new Map();
    for (const f of files) {
      const fm = fmOf(f);
      nodes.set(f.path, { path: f.path, name: f.basename, type: String(fm.type || ""), state: pageState(fm), out: [], inn: [], inDeg: 0 });
    }
    const adj = new Map([...nodes.keys()].map((p) => [p, new Map()]));
    for (const e of edges) {
      nodes.get(e.from).out.push(e);
      nodes.get(e.to).inn.push(e);
      const w = e.type === "see" ? 1 : 2; // a typed link ties two pages twice as closely as a plain one
      adj.get(e.from).set(e.to, (adj.get(e.from).get(e.to) || 0) + w);
      adj.get(e.to).set(e.from, (adj.get(e.to).get(e.from) || 0) + w);
    }
    for (const n of nodes.values()) n.inDeg = new Set(n.inn.map((e) => e.from)).size;

    const topics = text === null ? [] : parseTopics(text);
    const missing = [];
    const anchorSet = new Set();
    topics.forEach((t) => {
      t.paths = [];
      for (const name of t.anchors) {
        const dest = mc.getFirstLinkpathDest(name, TOPICS_PATH);
        if (dest && nodes.has(dest.path)) { t.paths.push(dest.path); anchorSet.add(dest.path); } else missing.push([t.name, name]);
      }
    });
    const ids = [...nodes.keys()];
    const { topic, score } = assignTopics(ids, adj, topics.map((t) => t.paths));
    const groups = topics.map((t, i) => ({ key: i, members: ids.filter((p) => topic.get(p) === i) })).filter((g) => g.members.length);
    const loose = ids.filter((p) => topic.get(p) < 0);
    if (loose.length) groups.push({ key: -1, members: loose });
    const lay = layoutAtlas(groups, adj, (p) => dotRadius(nodes.get(p).inDeg), anchorSet);
    lay.groups.forEach((g, i) => Object.assign(groups[i], { x: g.x, y: g.y, r: g.r }));
    // links between topics, counted once per page pair
    const pairs = new Map();
    const seen = new Set();
    for (const e of edges) {
      const a = topic.get(e.from), b = topic.get(e.to);
      const pk = e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`;
      if (a === b || seen.has(pk)) continue;
      seen.add(pk);
      const k = a < b ? `${a}|${b}` : `${b}|${a}`;
      pairs.set(k, (pairs.get(k) || 0) + 1);
    }
    this.atlasCache = { key, nodes, edges, adj, topics, topic, score, groups, pos: lay.pos, pairs, anchorSet, missing, hasFile: text !== null };
    return this.atlasCache;
  }

  /**
   * While the atlas is the page in front, both sidebars are closed so it has the room (3.30.0); when another page in the main
   * area comes to the front, or the atlas is closed, each sidebar that was open opens again. What was open is kept in
   * `settings.atlasSidebars`, so it survives a restart with the atlas still open. A sidebar I open myself meanwhile is left as I
   * set it, and working in a sidebar (the Lens, say) isn't leaving the atlas: the main area's front page is still the atlas.
   */
  syncAtlasSidebars() {
    const ws = this.app.workspace;
    const front = ws.getMostRecentLeaf ? ws.getMostRecentLeaf(ws.rootSplit) : null;
    const onAtlas = !!(front && front.view instanceof WikiMapView);
    const saved = this.settings.atlasSidebars;
    if (onAtlas && !saved) {
      const open = (s) => !!s && !s.collapsed;
      this.settings.atlasSidebars = { left: open(ws.leftSplit), right: open(ws.rightSplit) };
      this.persist();
      if (open(ws.leftSplit)) ws.leftSplit.collapse();
      if (open(ws.rightSplit)) ws.rightSplit.collapse();
    } else if (!onAtlas && saved) this.restoreAtlasSidebars();
  }

  restoreAtlasSidebars() {
    const ws = this.app.workspace, saved = this.settings && this.settings.atlasSidebars;
    if (!saved) return;
    delete this.settings.atlasSidebars;
    this.persist();
    if (saved.left && ws.leftSplit && ws.leftSplit.collapsed) ws.leftSplit.expand();
    if (saved.right && !this.settings.tinmindMode && ws.rightSplit && ws.rightSplit.collapsed) ws.rightSplit.expand(); // the Tinmind's mode keeps the right sidebar closed
  }

  /* --- navigation --- */

  mainLeaf() {
    const cur = this.currentPath;
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    return leaves.find((l) => l.view.file && l.view.file.path === cur) || leaves[0] || this.app.workspace.getLeaf(false);
  }

  /** Opens the atlas in its own tab (or brings it forward), on a topic ({ topic }) or a page ({ focus: path }) if given. */
  async activateWikiMap(opts = {}) {
    let leaf = this.app.workspace.getLeavesOfType(MAP_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: MAP_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (leaf.loadIfDeferred) await leaf.loadIfDeferred();
    if (leaf.view instanceof WikiMapView && (opts.focus || opts.topic !== undefined)) leaf.view.show(opts);
  }

  async activateRelations() {
    if (this.settings.tinmindMode) { new Notice("The Tinmind has no Lens. Click The Coppermind to go back."); return; }
    let leaf = this.app.workspace.getLeavesOfType(REL_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: REL_VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  async openFile(path, newTab) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return;
    const leaf = newTab ? this.app.workspace.getLeaf("tab") : this.mainLeaf();
    await leaf.openFile(f);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }

  async openNext(fromPath, order, newTab) {
    const next = nextAfter(order || this.queue(), fromPath);
    if (!next) { new Notice("The review queue is empty."); return; }
    await this.openFile(next.path, newTab);
  }

  async skip(file) {
    const order = this.queue();
    this.skipped = this.skipped.filter((p) => p !== file.path).concat(file.path);
    new Notice(`Skipped “${file.basename}”. It's at the end of the queue for this session.`);
    await this.openNext(file.path, order);
    this.renderAll();
  }

  /* --- review actions --- */

  isReviewable(file) {
    return file instanceof TFile && file.extension === "md" && REVIEWABLE.some((re) => re.test(file.path));
  }

  fm(file) {
    return (this.app.metadataCache.getFileCache(file) || {}).frontmatter || {};
  }

  precheck(file) {
    if (!this.isReviewable(file)) {
      new Notice("Nicrosil only works on pages in Wiki/, Perspectives/, Sources/Source Cards/, SCHEMAS/, or root-level files.");
      return null;
    }
    const fm = this.fm(file);
    if (fm.status === "verified") { new Notice(`“${file.basename}” is already verified.`); return null; }
    if (fm.status !== "draft") { new Notice(`“${file.basename}” has no status: draft property, so I left it alone.`); return null; }
    return fm;
  }

  isSourceCard(file) {
    return !!file && file.extension === "md" && /^Sources\/Source Cards\//.test(file.path) && String(this.fm(file).type || "") === "source";
  }

  /** The agent's "Proposed B-2" line on a card; read once per saved version of the file. undefined is never returned. */
  async proposedRating(file) {
    const c = this.proposedCache.get(file.path);
    if (c && c.mtime === file.stat.mtime) return c.value;
    let value = null;
    try { value = parseProposedRating(await this.app.vault.cachedRead(file)); } catch (e) { console.error("Nicrosil: couldn't read the proposed rating", e); }
    this.proposedCache.set(file.path, { mtime: file.stat.mtime, value });
    return value;
  }

  /** Write one half of the rating (part "rel" or "cred"; null clears it), or both at once (part "both", value { rel, cred }). */
  async setRating(file, part, value) {
    try {
      await this.app.fileManager.processFrontMatter(file, (f) => {
        if (part === "both") { f.reliability = value.rel; f.credibility = String(value.cred); }
        else if (part === "rel") f.reliability = value;
        else f.credibility = value === null ? null : String(value);
      });
    } catch (e) {
      console.error("Nicrosil: couldn't set the rating", e);
      new Notice(`Couldn't set the rating: ${e.message}`, 8000);
    }
  }

  /**
   * Two rows of buttons: reliability A–F and credibility 1–6. A click sets that value; clicking the lit one clears it.
   * If the card has a "Proposed B-2" line, those two buttons get a dotted outline and a "Use B-2" button sets both.
   * The new value reaches the page through the metadata cache, which redraws the buttons.
   */
  drawRatingButtons(host, file, proposed) {
    if (!host.isConnected && proposed !== undefined) return;
    const cached = this.proposedCache.get(file.path);
    if (proposed === undefined && cached && cached.mtime === file.stat.mtime) proposed = cached.value;
    host.empty();
    const cur = ratingOf(this.fm(file));
    const box = host.createDiv({ cls: "cm-rate" });
    const row = (label, list, now, part, prop) => {
      const r = box.createDiv({ cls: "cm-rate-row" });
      r.createSpan({ cls: "cm-rate-label", text: label });
      const g = r.createDiv({ cls: "cm-rate-group" });
      g.setAttr("role", "group");
      g.setAttr("aria-label", label);
      list.forEach(([k, meaning]) => {
        const b = g.createEl("button", { cls: "cm-rate-btn", text: k });
        b.setAttr("title", `${k}: ${meaning}` + (prop === k ? " (proposed)" : ""));
        b.setAttr("aria-label", `${label} ${k}: ${meaning}`);
        b.setAttr("aria-pressed", String(now === k));
        if (now === k) b.addClass("is-on");
        if (prop === k && now !== k) b.addClass("is-proposed");
        b.addEventListener("click", (e) => { e.stopPropagation(); this.setRating(file, part, now === k ? null : k); });
      });
    };
    row("Reliability", RATING_REL, cur.rel, "rel", proposed ? proposed.rel : "");
    row("Credibility", RATING_CRED, cur.cred, "cred", proposed ? proposed.cred : "");
    const foot = box.createDiv({ cls: "cm-rate-foot" });
    const meaning = (list, k) => (list.find((x) => x[0] === k) || [])[1] || "";
    if (cur.rel && cur.cred) foot.createSpan({ cls: "cm-rate-sum", text: `${cur.rel}-${cur.cred}: ${meaning(RATING_REL, cur.rel)}; ${meaning(RATING_CRED, cur.cred).toLowerCase()}` });
    else foot.createSpan({ cls: "cm-rate-sum is-empty", text: cur.rel || cur.cred ? "Half rated. Set both before verifying." : "Not rated yet" });
    if (proposed && (cur.rel !== proposed.rel || cur.cred !== proposed.cred)) {
      const use = foot.createEl("button", { cls: "cm-mini", text: `Use ${proposed.rel}-${proposed.cred}` });
      use.setAttr("title", "Set both to the rating the agent proposed");
      use.addEventListener("click", (e) => { e.stopPropagation(); this.setRating(file, "both", proposed); });
    }
    if (proposed === undefined) this.proposedRating(file).then((p) => { if (host.isConnected) this.drawRatingButtons(host, file, p); });
  }

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

  /* --- flags --- */

  addResolveButtons(el, ctx) {
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(file instanceof TFile) || !this.isReviewable(file)) return;
    if (this.fm(file).status !== "draft") return;
    el.querySelectorAll(".callout[data-callout]").forEach((callout) => {
      const kind = (callout.getAttribute("data-callout") || "").toLowerCase();
      if (!FLAG_KINDS[kind]) return;
      const titleEl = callout.querySelector(".callout-title");
      if (!titleEl || titleEl.querySelector(".cm-resolve-btn")) return;
      const btn = titleEl.createEl("button", { cls: "cm-resolve-btn", text: "Resolve" });
      btn.setAttr("aria-label", "Resolve this flag (Alt+F)");
      const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
      btn.addEventListener("mousedown", stop);
      btn.addEventListener("click", async (e) => {
        stop(e);
        const titleText = (titleEl.querySelector(".callout-title-inner") || titleEl).textContent.trim();
        const info = ctx.getSectionInfo(el);
        const flags = parseFlags(await this.app.vault.read(file));
        let hit = info ? flags.find((f) => f.start === info.lineStart && f.kind === kind) : null;
        if (!hit) {
          const want = titleText.toLowerCase();
          const same = flags.filter((f) => f.kind === kind && (f.title || FLAG_KINDS[kind].label).toLowerCase() === want);
          const pool = same.length ? same : flags.filter((f) => f.kind === kind);
          if (pool.length === 1) hit = pool[0];
          else if (pool.length > 1) { new FlagPicker(this.app, pool, (f) => this.startResolve(file, f)).open(); return; }
        }
        if (hit) this.startResolve(file, hit);
        else new Notice("Couldn't find that flag in the file. Try Alt+F.");
      });
    });
  }

  async pickFlag(file) {
    const flags = parseFlags(await this.app.vault.read(file));
    if (!flags.length) { new Notice("No open flags on this page."); return; }
    if (flags.length === 1) this.startResolve(file, flags[0]);
    else new FlagPicker(this.app, flags, (f) => this.startResolve(file, f)).open();
  }

  startResolve(file, flag) {
    new ResolveModal(this.app, flag, (decision) => this.resolveFlag(file, flag, decision)).open();
  }

  async resolveFlag(file, flag, decision) {
    let removed = false;
    await this.app.vault.process(file, (text) => {
      const flags = parseFlags(text);
      const same = (f) => f.kind === flag.kind && f.title === flag.title && f.body === flag.body;
      const hit = flags.find((f) => f.start === flag.start && same(f)) || flags.find(same);
      if (!hit) return text;
      removed = true;
      return removeLines(text, hit.start, hit.end);
    });
    if (!removed) { new Notice("That flag has changed since you opened it, so nothing was removed. Try again."); return; }
    (this.resolved[file.path] = this.resolved[file.path] || []).push({
      kind: flag.kind, label: flag.label, title: flag.title, decision, date: today(),
    });
    await this.persist();
    new Notice(`Resolved: ${flagName(flag)}. It will be logged when you verify the page.`, 5000);
    this.scheduleRefresh();
  }

  /* --- files --- */

  backlinksTo(file) {
    const resolved = this.app.metadataCache.resolvedLinks;
    return Object.keys(resolved)
      .filter((src) => src !== file.path && resolved[src][file.path])
      .map((src) => src.replace(/^.*\//, "").replace(/\.md$/, ""))
      .sort();
  }

  indexable(f) {
    return f instanceof TFile && f.extension === "md" && INDEX_SCOPE.some((re) => re.test(f.path));
  }

  /** Runs soon after the last change, so a burst of new pages makes one update. */
  scheduleIndexSync(delay = 3000) {
    if (this.settings.autoIndex === false) return;
    clearTimeout(this.indexTimer);
    this.indexTimer = setTimeout(() => this.syncIndex({}), delay);
  }

  /**
   * Makes _index.md match the pages in Wiki/, Perspectives/ and Sources/Source Cards/ (see syncIndex). A new page's line takes its
   * summary from the page's summary callout. An automatic run refuses a very large change (more than 20 removals or 100 additions at
   * once) and says so; "Update the index now" does it anyway. Nothing is written when the index is already right.
   */
  async syncIndex({ manual = false } = {}) {
    if (this.indexBusy) { this.indexAgain = true; return; }
    this.indexBusy = true;
    try {
      const f = this.app.vault.getAbstractFileByPath(INDEX_PATH);
      if (!(f instanceof TFile)) { if (manual) new Notice("_index.md not found."); return; }
      const files = this.app.vault.getMarkdownFiles().filter((x) => this.indexable(x));
      if (!files.length) { if (manual) new Notice("No pages found to index."); return; }
      const pages = files.map((x) => ({ name: x.basename, group: groupOf(x.path), file: x }));
      const renames = this.indexRenames.splice(0);
      const date = today();
      const text = await this.app.vault.read(f);
      const need = indexNeeds(text, pages.map((p) => p.name));
      const summaries = {};
      for (const p of pages) if (need.has(p.name)) { try { summaries[p.name] = leadLine(await this.app.vault.cachedRead(p.file)); } catch (e) { /* no summary yet */ } }
      let r = syncIndex(text, pages, summaries, renames, date);
      this.indexEmpty = new Set(pages.filter((p) => r.empty.includes(p.name)).map((p) => p.file.path));
      if (!r.changed) { if (manual) new Notice("The index is already up to date."); return; }
      if (!manual && (r.removed.length > 20 || r.added.length > 100)) {
        new Notice(`The index is out of step by a lot (${r.added.length} to add, ${r.removed.length} to remove), so I left it. Run “Update the index now” if that is right.`, 12000);
        return;
      }
      await this.app.vault.process(f, (cur) => {
        const again = syncIndex(cur, pages, summaries, renames, date);
        r = again.changed ? again : r;
        return again.changed ? again.text : cur;
      });
      const bits = [];
      const list = (a) => a.slice(0, 3).join(", ") + (a.length > 3 ? ` and ${a.length - 3} more` : "");
      if (r.added.length) bits.push(`added ${list(r.added)}`);
      if (r.removed.length) bits.push(`removed ${list(r.removed)}`);
      if (r.moved.length) bits.push(`moved ${list(r.moved)}`);
      if (r.renamed.length) bits.push(`renamed ${list(r.renamed)}`);
      if (r.filled.length) bits.push(`filled in ${r.filled.length} summar${r.filled.length === 1 ? "y" : "ies"}`);
      new Notice("Index updated: " + (bits.join("; ") || "tidied") + ".", 5000);
    } catch (e) {
      console.error("Nicrosil: index update failed", e);
      new Notice(`Couldn't update the index: ${e.message}`, 8000);
    } finally {
      this.indexBusy = false;
      if (this.indexAgain) { this.indexAgain = false; this.scheduleIndexSync(); }
    }
  }

  async updateIndex(name, mode, date) {
    const f = this.app.vault.getAbstractFileByPath(INDEX_PATH);
    if (!(f instanceof TFile)) { new Notice("_index.md not found; update it by hand."); return false; }
    let found = false;
    await this.app.vault.process(f, (text) => {
      const r = editIndex(text, name, mode, date);
      found = r.found;
      return r.text;
    });
    return found;
  }

  /** The newest month's log file in _logs/ (by year, then month), or null. */
  latestLogFile() {
    let best = null;
    for (const f of this.app.vault.getMarkdownFiles()) if (isLogPath(f.path) && (!best || logOrder(f.path) > logOrder(best.path))) best = f;
    return best;
  }

  /** The log file for the month of `date` ("YYYY-MM-DD"), created with its header if it isn't there yet. */
  async ensureLog(date) {
    const path = logPathFor(date);
    const have = this.app.vault.getAbstractFileByPath(path);
    if (have instanceof TFile) return { file: have, created: false };
    if (!this.app.vault.getAbstractFileByPath(LOG_DIR)) await this.app.vault.createFolder(LOG_DIR);
    const file = await this.app.vault.create(path, logFileHeader(date) + "\n");
    return { file, created: true };
  }

  /* ---------- Transcription queue (3.16.0) ---------- */

  /** Notes in the Tinmind whose properties say `transcription: draft`, each with the scans it lists, in the order the scans were photographed. */
  pendingTranscriptions() {
    const out = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!f.path.startsWith(NOTES_DIR)) continue;
      const fm = (this.app.metadataCache.getFileCache(f) || {}).frontmatter;
      if (!fm || String(fm.transcription || "").trim().toLowerCase() !== "draft") continue;
      out.push({ file: f, pages: scanNames(fm.scan_pages) });
    }
    const num = { numeric: true };
    return out.sort((a, b) => (a.pages[0] || "~").localeCompare(b.pages[0] || "~", undefined, num) || a.file.path.localeCompare(b.file.path, undefined, num));
  }

  /** The scans in Sources/Scans. */
  scanFiles() {
    return this.app.vault.getFiles().filter((f) => f.path.startsWith(SCAN_DIR) && /\.(jpe?g|png|webp)$/i.test(f.path));
  }

  /** The scans no pending note lists yet: the pages still to be transcribed. */
  scansWaiting(items) {
    const used = new Set();
    items.forEach((i) => i.pages.forEach((n) => used.add(scanKey(n))));
    return this.scanFiles().filter((f) => !used.has(scanKey(f.name)));
  }

  /** The scans (as scanKey) that pending notes other than `path` still list, so a page two notes share isn't deleted under the second one. */
  scanKeysUsedElsewhere(path) {
    const used = new Set();
    this.pendingTranscriptions().filter((i) => i.file.path !== path).forEach((i) => i.pages.forEach((n) => used.add(scanKey(n))));
    return used;
  }

  /**
   * Opens the queue (3.28.0): a pane of its own, split off the main area, that makes the note's pane beside it (see TranscribeView).
   * If the queue is already open it is brought forward and its layout checked.
   */
  async activateTranscribe() {
    const ws = this.app.workspace;
    let leaf = ws.getLeavesOfType(TR_VIEW_TYPE)[0];
    if (!leaf) {
      const base = ws.getMostRecentLeaf(ws.rootSplit) || ws.getLeaf("tab");
      leaf = ws.createLeafBySplit(base, "vertical");
      await leaf.setViewState({ type: TR_VIEW_TYPE, active: true });
    } else if (leaf.view instanceof TranscribeView) {
      await leaf.view.render();
    }
    ws.revealLeaf(leaf);
  }

  /**
   * Verify a transcription: the scans it lists go to the trash (all but any that another unverified note still lists), then the note
   * loses `transcription` and `scan_pages`, then the log gets an entry. The scans go first, so a failure there leaves the note as it was.
   */
  async verifyTranscription(file, pages, decisions, unsure) {
    const date = today();
    const names = [...new Set(pages)];
    const used = this.scanKeysUsedElsewhere(file.path);
    const trashed = [], kept = [], missing = [];
    for (const name of names) {
      const f = this.app.vault.getAbstractFileByPath(scanPath(name));
      if (!(f instanceof TFile)) { missing.push(name); continue; }
      if (used.has(scanKey(name))) { kept.push(name); continue; }
      await this.app.fileManager.trashFile(f);
      trashed.push(name);
    }
    await this.app.fileManager.processFrontMatter(file, (fm) => { delete fm.transcription; delete fm.scan_pages; });
    await this.appendLog(transcribeVerifyLogEntry({ name: file.basename, date, pages: names, trashed, kept, missing, drawings: decisions, unsure }));
    new Notice(`Verified “${file.basename}”. ${trashed.length} scan${trashed.length === 1 ? "" : "s"} moved to the trash.`, 5000);
    this.scheduleTinRefresh();
    this.dashboards.forEach((r) => r());
  }

  /** Discard a transcription: the draft note is deleted and its scans stay, so it can be done again. The reason is logged first. */
  async discardTranscription(file, reason) {
    await this.appendLog(rejectLogEntry({ name: `${file.basename} (transcription)`, date: today(), reason, dangling: [], resolved: [] }));
    const name = file.basename;
    await this.app.fileManager.trashFile(file);
    new Notice(`Discarded “${name}”. Its scans are still in Sources/Scans.`, 5000);
    this.scheduleTinRefresh();
    this.dashboards.forEach((r) => r());
  }


  /* ---------- query mode (4.2.0) ---------- */

  /** Opens a new tab and asks Claude. q: { question, model, effort, depth }. */
  async startQuery(q) {
    if (Platform.isMobile) { new Notice("Query mode needs Obsidian on a computer: it runs Claude Code."); return; }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: QUERY_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof QueryView) leaf.view.begin(q);
  }

  /** Where Claude Code is: the path in Settings, else its usual install places, else `claude` on the PATH. */
  claudeCommand() {
    const set = String(this.settings.claudePath || "").trim();
    if (set) return set;
    const fs = require("fs");
    const path = require("path");
    const os = require("os");
    const home = os.homedir();
    const env = process.env;
    const tries = process.platform === "win32"
      ? [path.join(home, ".local", "bin", "claude.exe"), env.APPDATA && path.join(env.APPDATA, "npm", "claude.cmd"), env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Programs", "claude", "claude.exe")]
      : [path.join(home, ".local", "bin", "claude"), path.join(home, ".claude", "local", "claude"), "/opt/homebrew/bin/claude", "/usr/local/bin/claude"];
    for (const t of tries) { try { if (t && fs.existsSync(t)) return t; } catch (e) { /* keep looking */ } }
    return "claude";
  }

  /** Starts Claude Code in the vault folder with these arguments. Its login stays Claude Code's own; Nicrosil only starts the program. */
  spawnClaude(args) {
    const { spawn } = require("child_process");
    const cmd = this.claudeCommand();
    const cwd = this.app.vault.adapter.getBasePath();
    const shim = /\.(cmd|bat)$/i.test(cmd);
    const opts = { cwd, env: process.env, windowsHide: true, shell: shim };
    // An npm .cmd shim can only run through cmd.exe, so its arguments are quoted; the question itself goes in on stdin, never on the command line.
    return shim ? spawn(winQuote(cmd), args.map(winQuote), opts) : spawn(cmd, args, opts);
  }

  /** Remembers the plan usage a run reported, for the meter under the search bar. */
  noteUsage(u) {
    this.settings.lastUsage = { pct: u.pct, kind: u.kind, resetsAt: u.resetsAt, at: Date.now() };
    this.persist();
    this.dashboards.forEach((r) => r());
    (this.usageListeners || new Set()).forEach((f) => f());
  }

  /** Remembers the last run's tokens, shown when no usage percent is known. */
  noteRun(ev) {
    const u = ev.usage || {};
    const tokens = (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    this.settings.lastRun = { tokens, at: Date.now() };
    this.persist();
    (this.usageListeners || new Set()).forEach((f) => f());
  }

  /** Writes the draft Analysis page, logs it, and opens it beside the query tab. Throws a readable error if it can't. */
  async saveAnalysis({ name, question, turn, reAskIf, model }) {
    const path = normalizePath(`${ANALYSES_DIR}/${name}.md`);
    if (this.app.vault.getAbstractFileByPath(path)) throw new Error(`“${name}” already exists in Analyses. Pick another name, or ask Claude to update that page instead.`);
    if (!this.app.vault.getAbstractFileByPath(ANALYSES_DIR)) await this.app.vault.createFolder(ANALYSES_DIR);
    const date = today();
    const file = await this.app.vault.create(path, analysisPage({ question, meta: turn.meta, answer: turn.answer, reAskIf, date, model }));
    await this.appendLog(queryFiledLogEntry({ question, date, name }));
    new Notice(`Saved “${name}” to Analyses as a draft.`, 5000);
    await this.app.workspace.getLeaf("tab").openFile(file);
    this.scheduleRefresh();
  }

  async appendLog(entry) {
    const { file } = await this.ensureLog(today());
    await this.app.vault.process(file, (text) => addToLog(text, entry));
  }
};

module.exports.__test = {
  makeTinEntry, searchTin, inTinScope, headingLink,
  parseProposedRating, ratingOf, syncIndex, indexNeeds, leadLine, parseFlags, removeLines, sortQueue, nextAfter, groupOf, editIndex,
  verifyLogEntry, rejectLogEntry, addToLog, daysBetween, today, parseLog, describeEntry, renameLogEntry, parseIndex, renderIndex,
  logPathFor, logOrder, logFileHeader, isLogPath, setFrontmatterProps, schemaInfo, checkVersion, addChangelogEntry, findChangelog,
  cleanNoteName, scanPath, scanNames, scanKey, splitNote, parseDrawings, parseRechecks, findUnsure, acceptGuess, keepDrawing, recreateDrawing, leaveOutDrawing, clearRecheck, transcribeVerifyLogEntry,
  parseTopics, assignTopics, layoutAtlas, suggestLinks, pageState,
  buildQueryPrompt, parseQueryReply, analysisPage, queryLogEntry, queryFiledLogEntry, describeToolUse, usageFromEvent, claudeArgs, winQuote,
};
