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
  Platform, normalizePath, requestUrl,
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
const DEFAULT_SETTINGS = { autoAdvance: true, sort: "clean", celebrate: true, hidePanels: true, closeTabsOnStart: true, readMode: "verified", healthDays: 14, autoIndex: true, liveUsage: true };
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

