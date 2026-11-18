"use strict";
/*
 * Nicrosil (v0.10.0)
 *
 * A nicrosil mind stores investiture and amplifies whoever draws on it. This plugin does the same for
 * the Coppermind: it holds the tools that make working in the vault faster. (Its folder and id are
 * `nicrosil`; they used to be `coppermind-review`.)
 *
 * Review tools for draft pages (all in the sidebar and on hotkeys; no buttons on the page header):
 *  - verify-and-next and skip, so a review session never goes back to a list
 *  - a review queue in the right sidebar with progress and flag badges
 *  - "Resolve" on flag callouts: removes the callout and records my decision,
 *    which is written to the log when the page is verified or rejected
 *  - hotkeys and a status-bar counter
 *  - a search box for the Dashboard (```coppermind-search```): suggestion cards under it as I type,
 *    over wiki pages, source cards, and perspectives (not raw class notes); it only reads
 *  - Dashboard page blocks (```coppermind-hero```, -dashboard, -nav, -activity), a ribbon
 *    logo button and Alt+D to go back to the Dashboard, and a one-time Home to Dashboard rename
 *  - "Log a schema change" (a pen button in the header of the SCHEMA page, or the command palette): asks for the new version number
 *    and what I changed, then adds the line to the Changelog at the bottom of SCHEMA.md and keeps its
 *    `version` and `updated` properties in step. It does not touch status, verified_on, or log.md.
 *
 * Relations panel (Alt+L): for the open page, a map and grouped lists of its typed links (SCHEMA §5),
 *         outgoing and incoming, colored by type. The incoming side is worked out from the other pages.
 *
 * Wiki map (Alt+M): two views of the whole wiki's typed links. Hierarchy is a collapsible tree built from
 *         type_of, part_of and example_of; Map is a zoomable network of every typed link, with filters.
 *
 * Verify: sets status: verified and verified_on, deletes `changes_since_verified` if the page has it,
 *         checks the page is listed in index.md, and appends to log.md.
 * Re-reviews: a draft that has a `changes_since_verified` list is a verified page the AI edited at my
 *         request. The queue lists these first, with an R badge, and the card shows what changed.
 * Reject: asks for a reason, logs it, removes the page from index.md, and deletes the page
 *         (SCHEMA §7: a rejected draft is deleted, never kept).
 * Nothing is committed to git; do that yourself afterward.
 */
const {
  Plugin, Modal, Notice, MarkdownView, TFile, ItemView, FuzzySuggestModal,
  PluginSettingTab, Setting, MarkdownRenderChild, setIcon, addIcon, debounce, parseYaml,
} = require("obsidian");

const INDEX_PATH = "index.md";
const LOG_PATH = "log.md";
const DASHBOARD_PATH = "Dashboard.md";
const SCHEMA_PATH = "SCHEMA.md";
const OLD_HOME_PATH = "Home.md";
// Feruchemical copper symbol, drawn for Obsidian's 100x100 icon box.
const LOGO_ICON = `<g transform="translate(9.79 0) scale(0.2)"><path fill="currentColor" transform="translate(283.29507 359.37144)" d="M -161.19707,-1.8874443 V -79.964444 c 22.166,18.637 46.922,37.621 46.922,37.621 l 22.132996,-22.167 c 0,0 -40.038996,-25.523 -69.054996,-46.888996 v -143.076 l 279.99996,395.104 -10.77,-47.203004 -307.69096,-452.796996 v 212.379 c -21.332,-25.804 -50.807,-66.68 -53.221,-69.965 1.504,3.705 25.49,61.466 53.221,98.776 v 82.970996 l -83.637,-72.412996 v 33.812996 l 83.637,73.28499966 V 140.62856 H 3.4179256 L -43.020074,100.41856 -161.19707,-1.8874443 z m 0,102.3070043 V 33.147556 l 76.743996,67.272004 h -76.743996 z"/></g>`;
const VIEW_TYPE = "nicrosil-queue";
// Root-level .md files (e.g. SCHEMA.md) are reviewable too, but only count once they carry a status property.
const REVIEWABLE = [/^Wiki\//, /^Perspectives\//, /^Sources\/Source Cards\//, /^[^/]+\.md$/];
const GROUP_ORDER = ["Frameworks", "Concepts", "Case Studies", "Glossary", "People", "Summaries",
  "Prompts", "Workflows", "Guides", "Analyses", "Perspectives", "Source Cards", "Vault files"];
const FLAG_KINDS = {
  caution: { label: "Accuracy check", plural: "Accuracy checks", short: "A" },
  todo: { label: "Gap", plural: "Gaps", short: "G" },
  question: { label: "Question", plural: "Questions (whose view?)", short: "Q" },
  warning: { label: "Warning", plural: "Warnings (unsourced)", short: "W" },
};
const STALE_DAYS = 14;
const DEFAULT_SETTINGS = { autoAdvance: true, sort: "clean", celebrate: true, ambient: true, hidePanels: true, dashStyle: "quiet" };
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

function groupOf(path) {
  if (path.startsWith("Perspectives/")) return "Perspectives";
  if (path.startsWith("Sources/Source Cards/")) return "Source Cards";
  if (!path.includes("/")) return "Vault files";
  const m = path.match(/^Wiki\/([^/]+)\//);
  return m ? m[1] : "Other";
}

function groupRank(g) {
  const i = GROUP_ORDER.indexOf(g);
  return i < 0 ? GROUP_ORDER.length : i;
}

/** Order drafts for review. Skipped pages go to the end, in the order they were skipped. */
/** The `changes_since_verified` property as a list of plain strings (it may be a list or a single string). */
function changeLines(v) {
  if (v === undefined || v === null || v === "") return [];
  return (Array.isArray(v) ? v : [v]).map((x) => String(x).trim()).filter(Boolean);
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

function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso), b = Date.parse(toIso);
  if (isNaN(a) || isNaN(b)) return null;
  return Math.floor((b - a) / 86400000);
}

/**
 * index.md model. Each "## Type (n)" section holds its entries in one alphabetical list, with no
 * split by status. The older formats are still read, and rewritten in this one: entries under
 * "### Verified (n)" and "### Drafts (n)" headings, or with the status in brackets at the end of each line.
 */
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
  for (const sec of model.sections) {
    const all = sec.entries.slice().sort(byName);
    total += all.length;
    body.push(`## ${sec.title} (${all.length})`, "");
    if (all.length) body.push(...all.map((e) => e.text), "");
    if (sec.extra.length) body.push(...sec.extra, "");
  }
  let head = model.head.join("\n");
  head = head.replace(/^\*\*Totals?:\*\*.*$/m, `**Total:** ${total} pages`);
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
  lines.push(`- **Commit:** \`verify: ${name}\``);
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
  lines.push(`- **Commit:** \`reject: ${name}\``);
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
    "- **Commit:** `setup: rename Home to Dashboard`",
  ].join("\n");
}

function appendToLog(text, entry) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  return text.replace(/\s*$/, "") + eol + eol + entry.replace(/\n/g, eol) + eol;
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
        text: "A rejected draft is deleted (SCHEMA §7). The reason is saved in the log. Obsidian's trash setting decides where the file goes, and git also keeps its history.",
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
        curItem.changes.forEach((c) => cl.createEl("li", { text: c }));
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
      const b = start.createEl("button", { cls: "mod-cta", text: drafts.length ? "Open next draft" : "Queue is empty" });
      b.disabled = !drafts.length;
      b.setAttr("aria-label", "Alt+N");
      b.addEventListener("click", () => p.openNext(cur ? cur.path : null));
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
        row.addEventListener("click", () => p.openFile(item.path));
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
        row.addEventListener("click", () => p.openFile(item.path));
      });
    }
    BADGE_STATE.primed = true;
    // rows that moved slide from their old place to their new one
    if (before.size && p.settings.ambient !== false && !prefersReduced()) {
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

/* ---------- Relations panel and local map ---------- */

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

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(parent, tag, attrs, text) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  parent.appendChild(el);
  return el;
}
function clip(s, n) { return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; }

class RelationsView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.file = null;
    this.rerender = debounce(() => this.render(), 250, true);
  }
  getViewType() { return REL_VIEW_TYPE; }
  getDisplayText() { return "Relations"; }
  getIcon() { return "git-fork"; }
  async onOpen() {
    this.file = this.plugin.currentFile();
    this.render();
    this.registerEvent(this.app.workspace.on("file-open", (f) => { if (f) { this.file = f; this.render(); } }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
      const f = this.plugin.currentFile();
      if (f && (!this.file || f.path !== this.file.path)) { this.file = f; this.render(); }
    }));
    this.registerEvent(this.app.metadataCache.on("changed", () => this.rerender()));
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.rerender()));
    this.registerEvent(this.app.vault.on("rename", () => this.rerender()));
    this.registerEvent(this.app.vault.on("delete", () => this.rerender()));
  }
  async onClose() { this.containerEl.children[1].empty(); }

  go(path, newTab) {
    if (!path) return;
    if (!newTab) { this.plugin.openFile(path); return; }
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof TFile) this.app.workspace.getLeaf(true).openFile(f);
  }

  statusOf(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    const fm = f instanceof TFile ? (this.app.metadataCache.getFileCache(f) || {}).frontmatter : null;
    return fm && fm.status ? String(fm.status) : "";
  }

  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("cm-rel");
    const file = this.file && this.app.vault.getAbstractFileByPath(this.file.path) instanceof TFile ? this.file : null;
    if (!file) { root.createDiv({ cls: "cm-sub", text: "Open a page to see how it relates to the rest of the wiki." }); return; }

    const edges = collectRelations(this.app);
    const out = edges.filter((e) => e.from === file.path);
    const inn = edges.filter((e) => e.to === file.path);

    const head = root.createDiv({ cls: "cm-rel-head" });
    head.createDiv({ cls: "cm-rel-title", text: file.basename });
    const st = this.statusOf(file.path);
    if (st) head.createSpan({ cls: `cm-rel-status cm-rel-${st}`, text: st });
    head.createDiv({ cls: "cm-sub", text: `${out.length} outgoing · ${inn.length} incoming` });

    if (!out.length && !inn.length) {
      root.createDiv({ cls: "cm-sub cm-rel-empty", text: "No typed links to or from this page yet. Plain links in the text don't show here; only the typed properties do (Schema §5)." });
      return;
    }

    this.drawMap(root, file, out, inn);
    this.drawLegend(root, out, inn);
    this.drawGroups(root, "This page…", out, "out", (e) => e.to, (e) => e.toName);
    this.drawGroups(root, "Pointing at this page…", inn, "inn", (e) => e.from, (e) => this.app.vault.getAbstractFileByPath(e.from)?.basename || e.from);
  }

  /** Neighbors on both sides, deduplicated by page, each keeping the types that link it. */
  neighbors(list, key, name) {
    const map = new Map();
    for (const e of list) {
      const id = key(e) || "x:" + name(e);
      if (!map.has(id)) map.set(id, { path: key(e), name: name(e), types: [] });
      const n = map.get(id);
      if (!n.types.includes(e.type)) n.types.push(e.type);
    }
    return [...map.values()];
  }

  drawMap(root, file, out, inn) {
    const MAX = 10;
    const L = this.neighbors(inn, (e) => e.from, (e) => this.app.vault.getAbstractFileByPath(e.from)?.basename || e.from);
    const R = this.neighbors(out, (e) => e.to, (e) => e.toName);
    const Ls = L.slice(0, MAX), Rs = R.slice(0, MAX);
    const NW = 100, NH = 26, GAP = 10, CW = 100, X1 = 0, X2 = 136, X3 = 272, W = 372;
    const rows = Math.max(Ls.length, Rs.length, 1) + ((L.length > MAX || R.length > MAX) ? 1 : 0);
    const H = rows * (NH + GAP) + GAP;
    const cy = H / 2;
    const wrap = root.createDiv({ cls: "cm-rel-map" });
    const svg = svgEl(wrap, "svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": `Relations map for ${file.basename}` });
    const defs = svgEl(svg, "defs");
    for (const [t, info] of Object.entries(REL_TYPES)) {
      const m = svgEl(defs, "marker", { id: `cm-arrow-${t}`, viewBox: "0 0 8 8", refX: 7, refY: 4, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
      svgEl(m, "path", { d: "M0,0 L8,4 L0,8 z", fill: info.color });
    }
    const yFor = (i, n) => GAP + i * (NH + GAP) + ((rows - n - ((L.length > MAX || R.length > MAX) ? 1 : 0)) * (NH + GAP)) / 2;

    const edgePath = (x1, y1, x2, y2) => `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
    const drawEdges = (side, nodes, n) => {
      nodes.forEach((nd, i) => {
        const y = yFor(i, n) + NH / 2;
        nd.types.forEach((t, k) => {
          const info = REL_TYPES[t];
          const off = (k - (nd.types.length - 1) / 2) * 4;
          const attrs = { fill: "none", stroke: info.color, "stroke-width": 1.6, "stroke-opacity": 0.9, "marker-end": `url(#cm-arrow-${t})` };
          if (info.dash) attrs["stroke-dasharray"] = info.dash;
          if (side === "out") svgEl(svg, "path", { ...attrs, d: edgePath(X2 + CW, cy + off, X3 - 1, y + off) });
          else svgEl(svg, "path", { ...attrs, d: edgePath(X1 + NW, y + off, X2 - 1, cy + off) });
        });
      });
    };
    drawEdges("inn", Ls, Ls.length);
    drawEdges("out", Rs, Rs.length);

    const node = (x, y, w, nd, center) => {
      const g = svgEl(svg, "g", { class: "cm-rel-node" + (center ? " is-center" : "") + (nd.path ? "" : " is-missing"), tabindex: 0, role: "button" });
      const st = nd.path ? this.statusOf(nd.path) : "";
      svgEl(g, "rect", { x, y, width: w, height: NH, rx: 5, class: `cm-rel-box ${st ? "cm-rel-box-" + st : ""}` });
      svgEl(g, "text", { x: x + w / 2, y: y + NH / 2 + 4, "text-anchor": "middle", class: "cm-rel-label" }, clip(nd.name, center ? 15 : 16));
      svgEl(g, "title", {}, nd.name + (nd.path ? "" : " (page not found)"));
      if (nd.path && !center) {
        g.addEventListener("click", (e) => this.go(nd.path, e.ctrlKey || e.metaKey));
        g.addEventListener("keydown", (e) => { if (e.key === "Enter") this.go(nd.path, e.ctrlKey || e.metaKey); });
      }
    };
    Ls.forEach((nd, i) => node(X1, yFor(i, Ls.length), NW, nd, false));
    Rs.forEach((nd, i) => node(X3, yFor(i, Rs.length), NW, nd, false));
    const ch = Math.min(H - 2 * GAP, 56);
    const g = svgEl(svg, "g", { class: "cm-rel-node is-center" });
    svgEl(g, "rect", { x: X2, y: cy - ch / 2, width: CW, height: ch, rx: 7, class: "cm-rel-box cm-rel-box-center" });
    const words = file.basename.split(" "); const lines = []; let cur = "";
    for (const w of words) { if ((cur + " " + w).trim().length > 15 && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
    if (cur) lines.push(cur);
    const shown = lines.slice(0, 3);
    shown.forEach((ln, i) => svgEl(g, "text", { x: X2 + CW / 2, y: cy - ((shown.length - 1) * 6.5) + i * 13 + 4, "text-anchor": "middle", class: "cm-rel-label cm-rel-center-label" }, clip(ln, 16)));
    svgEl(g, "title", {}, file.basename);
    const more = (L.length - Ls.length) + (R.length - Rs.length);
    if (more > 0) svgEl(svg, "text", { x: W / 2, y: H - 4, "text-anchor": "middle", class: "cm-rel-more" }, `${L.length > MAX ? L.length - MAX + " more incoming" : ""}${L.length > MAX && R.length > MAX ? " · " : ""}${R.length > MAX ? R.length - MAX + " more outgoing" : ""} (see the lists below)`);
    svgEl(svg, "text", { x: X1, y: 8, class: "cm-rel-side" }, "");
  }

  drawLegend(root, out, inn) {
    const present = Object.keys(REL_TYPES).filter((t) => out.concat(inn).some((e) => e.type === t));
    const lg = root.createDiv({ cls: "cm-rel-legend" });
    present.forEach((t) => {
      const chip = lg.createSpan({ cls: "cm-rel-chip" });
      const sw = chip.createSpan({ cls: "cm-rel-swatch" });
      sw.style.background = REL_TYPES[t].color;
      if (REL_TYPES[t].dash) sw.addClass("is-dashed");
      chip.appendText(t.replace("_", " "));
    });
  }

  drawGroups(root, title, list, dir, key, name) {
    if (!list.length) return;
    root.createEl("h5", { cls: "cm-rel-h", text: title });
    for (const t of Object.keys(REL_TYPES)) {
      const items = this.neighbors(list.filter((e) => e.type === t), key, name);
      if (!items.length) continue;
      const grp = root.createDiv({ cls: "cm-rel-group" });
      const h = grp.createDiv({ cls: "cm-rel-grouphead" });
      const sw = h.createSpan({ cls: "cm-rel-swatch" });
      sw.style.background = REL_TYPES[t].color;
      if (REL_TYPES[t].dash) sw.addClass("is-dashed");
      h.appendText(REL_TYPES[t][dir]);
      h.createSpan({ cls: "cm-rel-count", text: String(items.length) });
      items.sort((a, b) => a.name.localeCompare(b.name)).forEach((it) => {
        const row = grp.createDiv({ cls: "cm-rel-item" + (it.path ? "" : " is-missing") });
        const st = it.path ? this.statusOf(it.path) : "";
        row.createSpan({ cls: `cm-rel-dot ${st ? "cm-rel-dot-" + st : ""}` }).setAttr("aria-label", st || "no status");
        row.createSpan({ cls: "cm-rel-name", text: it.name });
        if (!it.path) row.createSpan({ cls: "cm-rel-miss", text: "no page" });
        else {
          row.setAttr("role", "button"); row.setAttr("tabindex", "0");
          row.addEventListener("click", (e) => this.go(it.path, e.ctrlKey || e.metaKey));
          row.addEventListener("keydown", (e) => { if (e.key === "Enter") this.go(it.path, e.ctrlKey || e.metaKey); });
        }
      });
    }
  }
}

/* ---------- Wiki map: hierarchy tree and typed-link map ---------- */

const MAP_VIEW_TYPE = "nicrosil-wikimap";

/** Fill colors for the map's dots, by page type. */
const PAGE_COLORS = {
  concept: "#7aa2d6", glossary: "#9ac28a", framework: "#d6a76a", "case-study": "#d98a8a",
  person: "#c3a0d9", summary: "#8fb8b0", prompt: "#d9cf7a", workflow: "#8aa0b8",
  guide: "#b8b08a", analysis: "#cc9a7a", perspective: "#a8a8a8", source: "#888888",
};
const pageColor = (t) => PAGE_COLORS[t] || "#999999";
const inMapScope = (path) => /^(Wiki|Perspectives)\//.test(path) || path.startsWith("Sources/Source Cards/");

/** Pages (nodes) and typed links (edges) for the whole wiki, from the metadata cache. */
function buildWikiGraph(app) {
  const mc = app.metadataCache;
  const nodes = new Map();
  for (const f of app.vault.getMarkdownFiles()) {
    if (!inMapScope(f.path)) continue;
    const fm = (mc.getFileCache(f) || {}).frontmatter || {};
    nodes.set(f.path, {
      path: f.path, name: f.basename, type: String(fm.type || ""),
      status: fm.status === "verified" ? "verified" : fm.status === "draft" ? "draft" : "",
      courses: [].concat(fm.courses || []).map(String), out: [], in: [], deg: 0,
      changed: [].concat(fm.changes_since_verified || []).some((x) => String(x).trim()),
    });
  }
  const edges = [];
  const seen = new Set();
  for (const e of collectRelations(app)) {
    if (!e.to || e.from === e.to || !nodes.has(e.from) || !nodes.has(e.to)) continue;
    const k = `${e.from}|${e.to}|${e.type}`;
    if (seen.has(k)) continue;
    seen.add(k);
    edges.push(e);
    nodes.get(e.from).out.push(e);
    nodes.get(e.to).in.push(e);
  }
  for (const n of nodes.values()) n.deg = new Set(n.out.map((e) => e.to).concat(n.in.map((e) => e.from))).size;
  return { nodes, edges };
}

const SIM = { rep: 500, spr: 0.25, len: 40, grav: 0.06 };

/** Start positions for the map: a small, repeatable cloud around the middle, from the page paths. */
function seedPositions(ids, W, H) {
  return ids.map((id) => {
    let h = 7;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    const a = ((h % 3600) / 3600) * 2 * Math.PI;
    const r = Math.sqrt(((h >>> 8) % 1000) / 1000) * Math.min(W, H) * 0.105;
    return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r };
  });
}

/**
 * Live physics for the map. State S = { p: [{x,y,vx,vy,r,fixed}], E: [[a,b]], W, H, k }.
 * Each step pushes every pair of dots apart, pulls linked dots together, and nudges everything
 * toward the middle. `alpha` is the "heat": it falls each step and the motion stops when it is low.
 */
function stepSim(S, alpha) {
  const { p, E, W, H, k } = S;
  const n = p.length;
  const reach = k * 4;
  for (let i = 0; i < n; i++) {
    const a = p[i];
    for (let j = i + 1; j < n; j++) {
      const b = p[j];
      let dx = a.x - b.x, dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 > reach * reach) continue;
      if (d2 < 1) { dx = (i % 2 ? 1 : -1) * 0.7; dy = ((i + j) % 2 ? 1 : -1) * 0.7; d2 = dx * dx + dy * dy; }
      const d = Math.sqrt(d2);
      let f = SIM.rep / d;
      const min = a.r + b.r + 9;
      if (d < min) f += (min - d) * 1.2;
      const fx = (dx / d) * f * alpha, fy = (dy / d) * f * alpha;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }
  }
  for (const [ia, ib] of E) {
    const a = p[ia], b = p[ib];
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const f = ((d - SIM.len) / d) * SIM.spr * alpha;
    a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
  }
  for (const a of p) {
    a.vx += (W / 2 - a.x) * SIM.grav * alpha; a.vy += (H / 2 - a.y) * SIM.grav * alpha;
    if (a.fixed) { a.vx = 0; a.vy = 0; continue; }
    a.vx *= 0.6; a.vy *= 0.6;
    const sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    if (sp > 14) { a.vx *= 14 / sp; a.vy *= 14 / sp; }
    a.x = Math.min(W - 20, Math.max(20, a.x + a.vx));
    a.y = Math.min(H - 20, Math.max(20, a.y + a.vy));
  }
}

class WikiMapView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.state = {
      tab: "map", // the map always opens first; the Hierarchy tab is one click away
      open: new Set(), openInit: false, filter: "", examples: true,
      hidden: new Set(), status: "", ptype: "", course: "", focus: null, q: "",
    };
    this.view = { x: 0, y: 0, k: 1 };
    this.layoutKey = "";
    this.layout = null;
    this.simRaf = 0;
    this.glideRaf = 0;
    this.rerender = debounce(() => this.render(), 600, true);
  }
  getViewType() { return MAP_VIEW_TYPE; }
  getDisplayText() { return "Wiki map"; }
  getIcon() { return "network"; }
  async onOpen() {
    this.render();
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.rerender()));
    this.registerEvent(this.app.vault.on("rename", () => this.rerender()));
    this.registerEvent(this.app.vault.on("delete", () => this.rerender()));
  }
  async onClose() { this.stopSim(); this.containerEl.children[1].empty(); }
  stopSim() { cancelAnimationFrame(this.simRaf); cancelAnimationFrame(this.glideRaf); this.simRaf = 0; this.glideRaf = 0; }

  go(path, newTab) {
    if (!path) return;
    if (!newTab) { this.plugin.openFile(path); return; }
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof TFile) this.app.workspace.getLeaf(true).openFile(f);
  }

  render() {
    this.stopSim();
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("cm-wm");
    this.graph = buildWikiGraph(this.app);
    const tabs = root.createDiv({ cls: "cm-wm-tabs" });
    [["tree", "Hierarchy"], ["map", "Map"]].forEach(([id, label]) => {
      const b = tabs.createEl("button", { text: label, cls: this.state.tab === id ? "is-active" : "" });
      b.addEventListener("click", async () => {
        this.state.tab = id; this.plugin.settings.mapTab = id; await this.plugin.persist(); this.render();
      });
    });
    const connected = [...this.graph.nodes.values()].filter((n) => n.deg > 0).length;
    tabs.createSpan({ cls: "cm-sub cm-wm-stats", text: `${this.graph.nodes.size} pages · ${this.graph.edges.length} typed links · ${connected} pages linked` });
    this.body = root.createDiv({ cls: "cm-wm-body" });
    if (this.state.tab === "map") this.renderMap(this.body); else this.renderTree(this.body);
  }

  /* ---------- hierarchy tree ---------- */

  renderTree(el) {
    const g = this.graph;
    const HIER = { type_of: "kind of", part_of: "part of", example_of: "example" };
    const kids = new Map(), hasParent = new Set();
    for (const e of g.edges) {
      if (!HIER[e.type] || (e.type === "example_of" && !this.state.examples)) continue;
      if (!kids.has(e.to)) kids.set(e.to, []);
      kids.get(e.to).push({ path: e.from, type: e.type });
      hasParent.add(e.from);
    }
    const nm = (p) => (g.nodes.get(p) || {}).name || p;
    // descendants of each page (as a set), guarding against loops
    const desc = new Map();
    const descOf = (p, seen) => {
      if (desc.has(p)) return desc.get(p);
      const s = new Set();
      if (seen.has(p)) return s;
      seen.add(p);
      for (const c of kids.get(p) || []) { s.add(c.path); for (const d of descOf(c.path, seen)) s.add(d); }
      seen.delete(p);
      desc.set(p, s);
      return s;
    };
    for (const p of kids.keys()) descOf(p, new Set());
    let roots = [...kids.keys()].filter((p) => !hasParent.has(p));
    const covered = new Set(roots.flatMap((r) => [r, ...descOf(r, new Set())]));
    for (const p of kids.keys()) if (!covered.has(p)) { roots.push(p); descOf(p, new Set()).forEach((d) => covered.add(d)); covered.add(p); }
    const size = (p) => (desc.get(p) ? desc.get(p).size : 0);
    roots.sort((a, b) => size(b) - size(a) || nm(a).localeCompare(nm(b)));

    const st = this.state;
    if (!st.openInit) { roots.forEach((r) => st.open.add(r)); st.openInit = true; }
    let q = st.filter.trim().toLowerCase();
    // with a search, show only branches that contain a match
    const matches = (p, seen) => {
      if (nm(p).toLowerCase().includes(q)) return true;
      if (seen.has(p)) return false;
      seen.add(p);
      const r = (kids.get(p) || []).some((c) => matches(c.path, seen));
      seen.delete(p);
      return r;
    };

    const bar = el.createDiv({ cls: "cm-wt-bar" });
    const input = bar.createEl("input", { type: "text", cls: "cm-wt-filter", placeholder: "Filter the tree by page name…", value: st.filter });
    input.addEventListener("input", () => { st.filter = input.value; q = input.value.trim().toLowerCase(); this.drawTreeRows(rows, roots, kids, HIER, desc, nm, q, matches); });
    const mkBtn = (txt, fn) => { const b = bar.createEl("button", { text: txt }); b.addEventListener("click", fn); };
    mkBtn("Expand all", () => { const all = (p, key, seen) => { st.open.add(key); if (seen.has(p)) return; seen.add(p); (kids.get(p) || []).forEach((c) => all(c.path, key + "/" + c.path, seen)); seen.delete(p); }; roots.forEach((r) => all(r, r, new Set())); this.render(); });
    mkBtn("Collapse all", () => { st.open.clear(); this.render(); });
    const ex = bar.createEl("label", { cls: "cm-wt-ex" });
    const cb = ex.createEl("input", { type: "checkbox" });
    cb.checked = st.examples;
    ex.appendText(" Show examples");
    cb.addEventListener("change", () => { st.examples = cb.checked; this.render(); });

    if (!roots.length) { el.createDiv({ cls: "cm-sub cm-wt-empty", text: "No kind-of, part-of or example-of links yet, so there is no hierarchy to show." }); return; }
    const rows = el.createDiv({ cls: "cm-wt-rows" });
    this._treeFresh = true;
    this.drawTreeRows(rows, roots, kids, HIER, desc, nm, q, matches);

    // pages the hierarchy doesn't reach
    const inTree = new Set(roots.flatMap((r) => [r, ...descOf(r, new Set())]));
    const outside = [...g.nodes.values()].filter((n) => n.path.startsWith("Wiki/") && !inTree.has(n.path)).sort((a, b) => a.name.localeCompare(b.name));
    const legend = el.createDiv({ cls: "cm-wm-legend" });
    for (const t of Object.keys(HIER)) {
      const c = legend.createSpan({ cls: "cm-rel-chip" });
      const sw = c.createSpan({ cls: "cm-rel-swatch" }); sw.style.background = REL_TYPES[t].color; if (REL_TYPES[t].dash) sw.addClass("is-dashed");
      c.appendText(`${HIER[t]} (line to the page above)`);
    }
    [...new Set([...inTree].map((p) => (g.nodes.get(p) || {}).type))].filter(Boolean).sort().forEach((t) => {
      const c = legend.createSpan({ cls: "cm-rel-chip" });
      const dot = c.createSpan({ cls: "cm-wm-legdot" }); dot.style.background = pageColor(t);
      c.appendText(t);
    });
    legend.createSpan({ cls: "cm-sub", text: "Click a card to open the page (Ctrl+click for a new tab). The circle at its right opens or closes a branch; the number is how many pages sit below. Teal ring = verified, dashed copper ring = draft. Drag the background to pan." });
    const det = el.createEl("details", { cls: "cm-wt-outside" });
    det.createEl("summary", { text: `Wiki pages outside the hierarchy (${outside.length})` });
    outside.forEach((n) => {
      const r = det.createDiv({ cls: "cm-wt-out-row" });
      r.createSpan({ cls: `cm-rel-dot ${n.status ? "cm-rel-dot-" + n.status : ""}` });
      r.createSpan({ text: n.name });
      r.createSpan({ cls: "cm-wt-tag", text: n.type });
      r.addEventListener("click", (e) => this.go(n.path, e.ctrlKey || e.metaKey));
    });
  }

  /** Draws the hierarchy as a left-to-right branching diagram of cards joined by curved lines. */
  drawTreeRows(rows, roots, kids, HIER, desc, nm, q, matches) {
    const g = this.graph, st = this.state;
    const keepX = rows.scrollLeft, keepY = this.body ? this.body.scrollTop : 0;
    rows.empty();
    const ROW = 34, CH = 26, GAP = 66, PAD = 14;
    const items = [];
    const build = (p, key, depth, via, path, parent) => {
      if (q && !matches(p, new Set())) return null;
      const node = g.nodes.get(p);
      const ch = (kids.get(p) || []).slice().sort((x, y) => ((kids.get(y.path) || []).length > 0) - ((kids.get(x.path) || []).length > 0) || nm(x.path).localeCompare(nm(y.path)));
      const hasKids = ch.length > 0 && !path.has(p);
      const inst = { p, key, depth, via, parent, node, ch: [], hasKids, open: hasKids && (q ? true : st.open.has(key)), cnt: desc.get(p) ? desc.get(p).size : 0 };
      const name = nm(p);
      inst.label = clip(name, 26);
      inst.w = Math.max(100, Math.min(26, name.length) * 6.4 + (inst.cnt ? 62 : 42));
      items.push(inst);
      if (inst.open) {
        const np = new Set(path); np.add(p);
        ch.forEach((c) => { const k = build(c.path, key + "/" + c.path, depth + 1, c.type, np, inst); if (k) inst.ch.push(k); });
      }
      return inst;
    };
    const tops = roots.map((r) => build(r, r, 0, null, new Set(), null)).filter(Boolean);
    if (!tops.length) {
      if (q) rows.createDiv({ cls: "cm-sub cm-wt-empty", text: `No page in the hierarchy matches \u201c${st.filter.trim()}\u201d.` });
      return;
    }
    let row = 0;
    const place = (n) => {
      if (!n.ch.length) { n.y = PAD + row * ROW + ROW / 2; row++; return; }
      n.ch.forEach(place);
      n.y = (n.ch[0].y + n.ch[n.ch.length - 1].y) / 2;
    };
    tops.forEach((t) => { place(t); row += 0.45; });
    const cw = [];
    items.forEach((n) => { cw[n.depth] = Math.max(cw[n.depth] || 0, n.w); });
    const cx = [PAD];
    for (let d = 1; d < cw.length; d++) cx[d] = cx[d - 1] + cw[d - 1] + GAP;
    items.forEach((n) => { n.x = cx[n.depth]; });
    const Wd = cx[cw.length - 1] + cw[cw.length - 1] + PAD + 14, Ht = PAD * 2 + row * ROW;

    const svg = svgEl(rows, "svg", { width: Wd, height: Ht, viewBox: `0 0 ${Wd} ${Ht}`, class: "cm-wt-svg" + (this._treeFresh ? " is-new" : ""), role: "img", "aria-label": "Hierarchy of pages" });
    this._treeFresh = false;
    const lines = svgEl(svg, "g");
    const cards = svgEl(svg, "g");
    items.forEach((n) => {
      if (n.parent) {
        const pa = n.parent, x1 = pa.x + pa.w + 17, x2 = n.x, xm = (x1 + x2) / 2, info = REL_TYPES[n.via];
        const attrs = { d: `M${x1},${pa.y} C${xm},${pa.y} ${xm},${n.y} ${x2},${n.y}`, fill: "none", stroke: info.color, "stroke-width": 1.7, class: "cm-wt-edge" };
        if (info.dash) attrs["stroke-dasharray"] = info.dash;
        n.edge = svgEl(lines, "path", attrs);
        svgEl(n.edge, "title", {}, `${nm(n.p)} \u2014 ${HIER[n.via]} \u2192 ${nm(pa.p)}`);
      }
    });
    const hit = (n) => !!q && nm(n.p).toLowerCase().includes(q);
    items.forEach((n) => {
      const node = n.node || {};
      const grp = svgEl(cards, "g", { class: "cm-wt-card" + (hit(n) ? " is-match" : "") + (node.changed ? " is-changed" : ""), transform: `translate(${n.x},${n.y - CH / 2})` });
      n.el = grp;
      svgEl(grp, "rect", { width: n.w, height: CH, rx: 8, class: `cm-wt-box cm-wt-box-${node.status || "none"}` });
      svgEl(grp, "circle", { cx: 13, cy: CH / 2, r: 5, fill: pageColor(node.type), class: "cm-wt-pdot" });
      svgEl(grp, "text", { x: 24, y: CH / 2 + 4, class: "cm-wt-label" }, n.label);
      if (n.cnt) svgEl(grp, "text", { x: n.w - 9, y: CH / 2 + 4, "text-anchor": "end", class: "cm-wt-cnt" }, String(n.cnt));
      svgEl(grp, "title", {}, `${nm(n.p)} (${node.type || "page"}, ${node.status || "no status"})${n.cnt ? `, ${n.cnt} below` : ""}`);
      grp.addEventListener("click", (e) => this.go(n.p, e.ctrlKey || e.metaKey));
      const chain = (on) => {
        svg.toggleClass("is-hovering", on);
        const mark = (x, up) => {
          x.el.toggleClass("is-hl", on);
          if (x.edge) x.edge.toggleClass("is-hl", on);
          if (up && x.parent) mark(x.parent, true);
        };
        mark(n, true);
        const down = (x) => x.ch.forEach((c) => { c.el.toggleClass("is-hl", on); c.edge.toggleClass("is-hl", on); down(c); });
        down(n);
      };
      grp.addEventListener("pointerenter", () => chain(true));
      grp.addEventListener("pointerleave", () => chain(false));
      if (n.hasKids) {
        const tg = svgEl(svg, "g", { class: "cm-wt-tog", transform: `translate(${n.x + n.w + 17},${n.y})`, role: "button", tabindex: 0 });
        const col = REL_TYPES[n.ch.length ? n.ch[0].via : "part_of"].color;
        svgEl(tg, "circle", { r: 8.5, class: "cm-wt-tog-bg", stroke: col });
        svgEl(tg, "path", { d: n.open ? "M-3.5,0 H3.5" : "M-3.5,0 H3.5 M0,-3.5 V3.5", class: "cm-wt-tog-mark" });
        svgEl(tg, "title", {}, n.open ? "Close this branch" : "Open this branch");
        const flip = () => { if (n.open) st.open.delete(n.key); else st.open.add(n.key); this.drawTreeRows(rows, roots, kids, HIER, desc, nm, q, matches); };
        tg.addEventListener("click", flip);
        tg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
      }
    });
    // drag the background to pan
    let pan = null;
    svg.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest && (ev.target.closest(".cm-wt-card") || ev.target.closest(".cm-wt-tog"))) return;
      pan = { x: ev.clientX, y: ev.clientY, l: rows.scrollLeft, t: this.body ? this.body.scrollTop : 0 };
      svg.setPointerCapture(ev.pointerId); svg.addClass("is-drag");
    });
    svg.addEventListener("pointermove", (ev) => { if (!pan) return; rows.scrollLeft = pan.l - (ev.clientX - pan.x); if (this.body) this.body.scrollTop = pan.t - (ev.clientY - pan.y); });
    const endPan = () => { pan = null; svg.removeClass("is-drag"); };
    svg.addEventListener("pointerup", endPan); svg.addEventListener("pointercancel", endPan);
    rows.scrollLeft = keepX;
    if (this.body) this.body.scrollTop = keepY;
  }

  /* ---------- typed-link map ---------- */

  renderMap(el) {
    const g = this.graph, st = this.state;
    const ids = [...g.nodes.values()].filter((n) => n.deg > 0).map((n) => n.path).sort();
    const isolated = g.nodes.size - ids.length;
    if (!ids.length) { el.createDiv({ cls: "cm-sub cm-wt-empty", text: "No typed links yet, so there is nothing to map." }); return; }
    const W = 1000, H = 700;
    const key = ids.join("|") + "#" + g.edges.map((e) => `${e.from}>${e.to}`).sort().join(",");
    const radius = (n) => 4 + Math.sqrt(n.deg) * 2.4;
    const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const fresh = key !== this.layoutKey || !this.layout;
    if (fresh) { this.layout = seedPositions(ids, W, H); this.layoutKey = key; this.ids = ids; }
    const idx = new Map(ids.map((id, i) => [id, i]));
    const S = {
      p: ids.map((id, i) => ({ x: this.layout[i].x, y: this.layout[i].y, vx: 0, vy: 0, r: radius(g.nodes.get(id)), fixed: false })),
      E: g.edges.map((e) => [idx.get(e.from), idx.get(e.to)]), W, H, k: Math.sqrt((W * H) / ids.length) * 0.75,
    };
    const pos = new Map(ids.map((id, i) => [id, S.p[i]]));
    let alpha = fresh ? 1 : 0; // the "heat" of the physics; it cools to zero and the map comes to rest
    if (fresh && reduce) { while (alpha > 0.02) { stepSim(S, alpha); alpha *= 0.99; } alpha = 0; this.layout = S.p.map((q) => ({ x: q.x, y: q.y })); }
    let flowOn = this.plugin.settings.mapFlow !== false;

    // toolbar
    const bar = el.createDiv({ cls: "cm-wm-bar" });
    const chips = bar.createDiv({ cls: "cm-wm-chips" });
    const present = Object.keys(REL_TYPES).filter((t) => g.edges.some((e) => e.type === t));
    const chipEls = {};
    present.forEach((t) => {
      const c = chips.createSpan({ cls: "cm-rel-chip cm-wm-chip" + (st.hidden.has(t) ? " is-off" : ""), attr: { role: "button", tabindex: "0" } });
      const sw = c.createSpan({ cls: "cm-rel-swatch" }); sw.style.background = REL_TYPES[t].color; if (REL_TYPES[t].dash) sw.addClass("is-dashed");
      c.appendText(t.replace("_", " "));
      const tog = () => { if (st.hidden.has(t)) st.hidden.delete(t); else st.hidden.add(t); c.toggleClass("is-off", st.hidden.has(t)); apply(); };
      c.addEventListener("click", tog);
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } });
      chipEls[t] = c;
    });
    const sel = (label, values, cur, setter) => {
      const s = bar.createEl("select", { cls: "dropdown cm-wm-sel", attr: { "aria-label": label } });
      s.createEl("option", { text: label, value: "" });
      values.forEach((v) => { const o = s.createEl("option", { text: v, value: v }); if (v === cur) o.selected = true; });
      s.addEventListener("change", () => { setter(s.value); apply(); });
    };
    const nodes = [...g.nodes.values()].filter((n) => n.deg > 0);
    sel("Any status", ["verified", "draft"], st.status, (v) => { st.status = v; });
    sel("Any page type", [...new Set(nodes.map((n) => n.type).filter(Boolean))].sort(), st.ptype, (v) => { st.ptype = v; });
    sel("Any course", [...new Set(nodes.flatMap((n) => n.courses))].sort(), st.course, (v) => { st.course = v; });
    const find = bar.createEl("input", { type: "text", cls: "cm-wt-filter cm-wm-find", placeholder: "Find a page, Enter to focus it", value: st.q });
    const reset = bar.createEl("button", { text: "Reset view" });
    const flowBtn = bar.createEl("button", { text: "Flow", attr: { "aria-label": "Animate the links" } });
    flowBtn.toggleClass("is-active", flowOn);

    const stage = el.createDiv({ cls: "cm-wm-stage" });
    const svg = svgEl(stage, "svg", { viewBox: `0 0 ${W} ${H}`, class: "cm-wm-svg", role: "img", "aria-label": "Map of typed links between pages" });
    const defs = svgEl(svg, "defs");
    for (const [t, info] of Object.entries(REL_TYPES)) {
      const m = svgEl(defs, "marker", { id: `cm-wm-arrow-${t}`, viewBox: "0 0 8 8", refX: 8, refY: 4, markerWidth: 6, markerHeight: 6, markerUnits: "userSpaceOnUse", orient: "auto" });
      svgEl(m, "path", { d: "M0,0 L8,4 L0,8 z", fill: info.color });
    }
    const world = svgEl(svg, "g", { class: "cm-wm-world" });
    svg.toggleClass("no-flow", !flowOn);
    flowBtn.addEventListener("click", async () => {
      flowOn = !flowOn; flowBtn.toggleClass("is-active", flowOn); svg.toggleClass("no-flow", !flowOn);
      this.plugin.settings.mapFlow = flowOn; await this.plugin.persist();
    });
    // curved arrow from a to b, ending at the edge of b's dot
    const edgePath = (a, b, r) => {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / d, uy = dy / d, bend = d * 0.13;
      const ex = b.x - ux * r, ey = b.y - uy * r;
      return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${((a.x + b.x) / 2 - uy * bend).toFixed(1)},${((a.y + b.y) / 2 + ux * bend).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
    };
    const edgeEls = g.edges.map((e) => {
      const nb = g.nodes.get(e.to);
      const info = REL_TYPES[e.type];
      const attrs = { d: "M0,0", fill: "none", stroke: info.color, "stroke-width": 1.2, "marker-end": `url(#cm-wm-arrow-${e.type})`, class: "cm-wm-edge" };
      if (info.dash) attrs["stroke-dasharray"] = info.dash;
      const ln = svgEl(world, "path", attrs);
      svgEl(ln, "title", {}, `${g.nodes.get(e.from).name} — ${e.type.replace("_", " ")} → ${nb.name}`);
      const flow = svgEl(world, "path", { d: "M0,0", fill: "none", stroke: info.color, class: "cm-wm-flow" });
      return { e, el: ln, flow, r: radius(nb) + 1 };
    });
    const nodeEls = new Map();
    for (const id of ids) {
      const n = g.nodes.get(id), p = pos.get(id);
      const grp = svgEl(world, "g", { class: "cm-wm-node" + (n.deg >= 3 ? " is-hub" : "") + (n.changed ? " is-changed" : ""), transform: `translate(${p.x},${p.y})`, tabindex: 0, role: "button" });
      if (n.status === "verified") {
        for (let s = 0; s < 2; s++) {
          const sp = svgEl(grp, "circle", { cx: (s ? 1 : -1) * radius(n) * 0.45, cy: -radius(n) * 0.6, r: 1.5, class: "cm-wm-spark" });
          sp.style.animationDelay = `-${(((ids.indexOf(id) * 7 + s * 13) % 30) / 10).toFixed(1)}s`;
        }
      }
      svgEl(grp, "circle", { r: radius(n), fill: pageColor(n.type), class: `cm-wm-dot cm-wm-dot-${n.status || "none"}` });
      svgEl(grp, "text", { x: radius(n) + 3, y: 3.5, class: "cm-wm-label" }, clip(n.name, 26));
      svgEl(grp, "title", {}, `${n.name} (${n.type || "page"}, ${n.status || "no status"})`);
      let nd = null, suppress = false;
      grp.addEventListener("pointerdown", (ev) => {
        suppress = false;
        if (ev.button !== 0 || ev.ctrlKey || ev.metaKey) return;
        nd = { x: ev.clientX, y: ev.clientY, moved: false };
        grp.setPointerCapture(ev.pointerId);
      });
      grp.addEventListener("pointermove", (ev) => {
        if (!nd || (!nd.moved && Math.hypot(ev.clientX - nd.x, ev.clientY - nd.y) < 5)) return;
        if (!nd.moved) { nd.moved = true; grp.addClass("is-drag"); }
        const q = toSvg(ev), pp = pos.get(id);
        pp.fixed = true;
        pp.x = Math.min(W - 20, Math.max(20, (q.x - v.x) / v.k));
        pp.y = Math.min(H - 20, Math.max(20, (q.y - v.y) / v.k));
        draw(); heat(0.35);
      });
      const drop = () => { if (!nd) return; pos.get(id).fixed = false; suppress = nd.moved; grp.removeClass("is-drag"); nd = null; };
      grp.addEventListener("pointerup", drop); grp.addEventListener("pointercancel", drop);
      grp.addEventListener("pointerenter", () => { if (!nd) hover(id); });
      grp.addEventListener("pointerleave", () => { if (!nd) hover(null); });
      grp.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (suppress) { suppress = false; return; }
        if (ev.ctrlKey || ev.metaKey) this.go(id, true); else { st.focus = st.focus === id ? null : id; apply(); if (st.focus) { glideNode(id); ripple(id); } }
      });
      grp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { st.focus = st.focus === id ? null : id; apply(); if (st.focus) { glideNode(id); ripple(id); } } });
      nodeEls.set(id, grp);
    }
    const draw = () => {
      nodeEls.forEach((grp, id) => { const q = pos.get(id); grp.setAttribute("transform", `translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`); });
      edgeEls.forEach(({ e, el: ln, flow, r }) => { const d = edgePath(pos.get(e.from), pos.get(e.to), r); ln.setAttribute("d", d); flow.setAttribute("d", d); });
    };
    // physics: a few steps per frame while the map is warm, then it rests until a dot is dragged
    const frame = () => {
      this.simRaf = 0;
      for (let s = 0; s < 3 && alpha > 0.02; s++) { stepSim(S, alpha); alpha *= 0.99; }
      draw();
      if (alpha > 0.02) this.simRaf = requestAnimationFrame(frame);
      else { alpha = 0; this.layout = S.p.map((q) => ({ x: q.x, y: q.y })); }
    };
    const heat = (a) => { alpha = Math.max(alpha, a); if (!this.simRaf) this.simRaf = requestAnimationFrame(frame); };
    // pointing at a dot lights up its links and neighbors
    const hover = (id) => {
      svg.toggleClass("is-hovering", !!id);
      nodeEls.forEach((n) => n.removeClass("is-hl"));
      edgeEls.forEach(({ el: ln, flow }) => { ln.removeClass("is-hl"); flow.removeClass("is-hl"); });
      if (!id) return;
      nodeEls.get(id).addClass("is-hl");
      edgeEls.forEach(({ e, el: ln, flow }) => {
        if ((e.from !== id && e.to !== id) || ln.hasClass("is-hidden")) return;
        ln.addClass("is-hl"); flow.addClass("is-hl");
        nodeEls.get(e.from).addClass("is-hl"); nodeEls.get(e.to).addClass("is-hl");
      });
    };
    // a ring spreads out from a focused dot, and its neighbors flash one after another
    const ripple = (id) => {
      if (reduce || this.plugin.settings.ambient === false) return;
      const q = pos.get(id);
      const ring = svgEl(world, "circle", { cx: q.x, cy: q.y, r: 6, class: "cm-wm-ripple" });
      setTimeout(() => ring.remove(), 1100);
      const nb = new Set();
      g.edges.forEach((e) => { if (e.from === id) nb.add(e.to); else if (e.to === id) nb.add(e.from); });
      [...nb].forEach((nid, i) => {
        const el2 = nodeEls.get(nid);
        if (!el2) return;
        setTimeout(() => { el2.addClass("is-ping"); setTimeout(() => el2.removeClass("is-ping"), 700); }, 160 + i * 90);
      });
    };
    // smooth camera moves
    const glideTo = (tx, ty, tk, ms = 480) => {
      cancelAnimationFrame(this.glideRaf);
      if (reduce) { v.x = tx; v.y = ty; v.k = tk; setView(); return; }
      const f = { x: v.x, y: v.y, k: v.k }, t0 = performance.now();
      const stepG = (now) => {
        const u = Math.min(1, (now - t0) / ms), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        v.x = f.x + (tx - f.x) * e; v.y = f.y + (ty - f.y) * e; v.k = f.k + (tk - f.k) * e;
        setView();
        if (u < 1) this.glideRaf = requestAnimationFrame(stepG);
      };
      this.glideRaf = requestAnimationFrame(stepG);
    };
    const glideNode = (id, k) => { const q = pos.get(id), kk = k || Math.max(v.k, 1.5); glideTo(W / 2 - q.x * kk, H / 2 - q.y * kk, kk); };
    const info = el.createDiv({ cls: "cm-wm-info" });
    const legend = el.createDiv({ cls: "cm-wm-legend" });
    [...new Set(nodes.map((n) => n.type))].filter(Boolean).sort().forEach((t) => {
      const c = legend.createSpan({ cls: "cm-rel-chip" });
      const dot = c.createSpan({ cls: "cm-wm-legdot" }); dot.style.background = pageColor(t);
      c.appendText(t);
    });
    legend.createSpan({ cls: "cm-sub", text: "Dot size = number of linked pages. Teal ring = verified, dashed copper ring = draft. Click a dot to focus it, Ctrl+click to open the page, drag a dot to move it. Scroll to zoom, drag the background to pan." + (isolated ? ` ${isolated} pages have no typed links and are not shown.` : "") });

    // zoom and pan
    const v = this.view;
    const setView = () => {
      world.setAttribute("transform", `translate(${v.x},${v.y}) scale(${v.k})`);
      svg.toggleClass("zoom-all", v.k >= 1.7);
    };
    setView();
    const toSvg = (ev) => { const r = svg.getBoundingClientRect(); return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H }; };
    svg.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      cancelAnimationFrame(this.glideRaf);
      const p = toSvg(ev);
      const nk = Math.min(6, Math.max(0.4, v.k * (ev.deltaY < 0 ? 1.15 : 1 / 1.15)));
      v.x = p.x - ((p.x - v.x) / v.k) * nk; v.y = p.y - ((p.y - v.y) / v.k) * nk; v.k = nk;
      setView();
    }, { passive: false });
    let drag = null;
    svg.addEventListener("pointerdown", (ev) => { if (ev.target.closest && ev.target.closest(".cm-wm-node")) return; cancelAnimationFrame(this.glideRaf); drag = { x: ev.clientX, y: ev.clientY, vx: v.x, vy: v.y }; svg.setPointerCapture(ev.pointerId); svg.addClass("is-drag"); });
    svg.addEventListener("pointermove", (ev) => { if (!drag) return; const r = svg.getBoundingClientRect(); v.x = drag.vx + ((ev.clientX - drag.x) / r.width) * W; v.y = drag.vy + ((ev.clientY - drag.y) / r.height) * H; setView(); });
    const end = () => { drag = null; svg.removeClass("is-drag"); };
    svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
    svg.addEventListener("click", (ev) => { if (!ev.target.closest(".cm-wm-node")) { st.focus = null; apply(); } });
    reset.addEventListener("click", () => { v.x = 0; v.y = 0; v.k = 1; st.focus = null; st.hidden.clear(); st.status = ""; st.ptype = ""; st.course = ""; st.q = ""; this.render(); });
    find.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      const q = find.value.trim().toLowerCase(); st.q = find.value;
      const hit = ids.map((i) => g.nodes.get(i)).filter((n) => !nodeEls.get(n.path).hasClass("is-hidden")).find((n) => n.name.toLowerCase().includes(q));
      if (!hit || !q) return;
      st.focus = hit.path;
      apply(); glideNode(hit.path, 2.2);
    });

    const apply = () => {
      const edgeOn = (e) => !st.hidden.has(e.type);
      const passes = (n) => (!st.status || n.status === st.status) && (!st.ptype || n.type === st.ptype) && (!st.course || n.courses.includes(st.course));
      const vis = new Set();
      edgeEls.forEach(({ e }) => { if (edgeOn(e) && passes(g.nodes.get(e.from)) && passes(g.nodes.get(e.to))) { vis.add(e.from); vis.add(e.to); } });
      const near = new Set();
      if (st.focus && vis.has(st.focus)) {
        near.add(st.focus);
        edgeEls.forEach(({ e }) => { if (edgeOn(e) && vis.has(e.from) && vis.has(e.to) && (e.from === st.focus || e.to === st.focus)) { near.add(e.from); near.add(e.to); } });
      }
      const focusing = near.size > 0;
      edgeEls.forEach(({ e, el: ln, flow }) => {
        const shown = edgeOn(e) && vis.has(e.from) && vis.has(e.to);
        const dim = shown && focusing && !(e.from === st.focus || e.to === st.focus);
        for (const x of [ln, flow]) { x.toggleClass("is-hidden", !shown); x.toggleClass("is-dim", dim); }
      });
      nodeEls.forEach((grp, id) => {
        grp.toggleClass("is-hidden", !vis.has(id));
        grp.toggleClass("is-dim", vis.has(id) && focusing && !near.has(id));
        grp.toggleClass("is-near", focusing && near.has(id));
        grp.toggleClass("is-focus", focusing && id === st.focus);
      });
      this.drawInfo(info, focusing ? st.focus : null, vis, (id) => { st.focus = id; apply(); glideNode(id); });
    };
    apply();
    draw();
    if (alpha > 0) this.simRaf = requestAnimationFrame(frame);
  }

  drawInfo(el, path, vis, focusOn) {
    el.empty();
    const g = this.graph;
    const n = path ? g.nodes.get(path) : null;
    if (!n) { el.createDiv({ cls: "cm-sub", text: "Click a dot to see how that page connects." }); return; }
    const head = el.createDiv({ cls: "cm-wm-info-head" });
    head.createSpan({ cls: "cm-wm-info-name", text: n.name });
    head.createSpan({ cls: "cm-wt-tag", text: n.type || "page" });
    if (n.status) head.createSpan({ cls: `cm-rel-status cm-rel-${n.status}`, text: n.status });
    const open = head.createEl("button", { text: "Open page", cls: "mod-cta" });
    open.addEventListener("click", () => this.go(n.path, false));
    const groups = el.createDiv({ cls: "cm-wm-info-groups" });
    for (const t of Object.keys(REL_TYPES)) {
      for (const [dir, list, other] of [["out", n.out.filter((e) => e.type === t), (e) => e.to], ["inn", n.in.filter((e) => e.type === t), (e) => e.from]]) {
        const items = list.filter((e) => vis.has(other(e)));
        if (!items.length) continue;
        const row = groups.createDiv({ cls: "cm-wm-info-row" });
        const lab = row.createSpan({ cls: "cm-wm-info-label", text: REL_TYPES[t][dir] });
        lab.style.color = REL_TYPES[t].color;
        items.forEach((e) => {
          const id = other(e);
          const c = row.createSpan({ cls: "cm-wm-info-link", text: g.nodes.get(id).name, attr: { role: "button", tabindex: "0" } });
          c.addEventListener("click", () => focusOn(id));
        });
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
      .setDesc("A check stamp and a burst of sparks, then the next page slides in. It is skipped if your computer is set to reduce motion.")
      .addToggle((t) => t.setValue(this.plugin.settings.celebrate !== false).onChange(async (v) => {
        this.plugin.settings.celebrate = v; await this.plugin.persist();
      }));
    new Setting(el).setName("Close the extra sidebar panels on startup")
      .setDesc("Closes Backlinks, Outgoing links, Tags, All properties and Outline in the sidebar each time Obsidian starts. You can still open any of them from the command palette during a session.")
      .addToggle((t) => t.setValue(this.plugin.settings.hidePanels !== false).onChange(async (v) => { this.plugin.settings.hidePanels = v; await this.plugin.persist(); }));
    new Setting(el).setName("Dashboard style")
      .setDesc("Quiet: plain text links, stats in one line, small serif capitals, no sparks or glow boxes. Classic: the original cards and tiles.")
      .addDropdown((d) => {
        d.addOption("quiet", "Quiet").addOption("classic", "Classic");
        d.setValue(this.plugin.settings.dashStyle === "classic" ? "classic" : "quiet").onChange(async (v) => {
          this.plugin.settings.dashStyle = v; await this.plugin.persist();
          document.body.classList.toggle("cm-quiet", v !== "classic");
          this.plugin.renderAll();
        });
      });
    new Setting(el).setName("Ambient animations")
      .setDesc("Glowing titles, breathing flag callouts, sparkles on the map, page fade-ins, and a slowly drifting background. Turn off for a still, quiet vault. They are also off if your computer is set to reduce motion.")
      .addToggle((t) => t.setValue(this.plugin.settings.ambient !== false).onChange(async (v) => {
        this.plugin.settings.ambient = v; await this.plugin.persist();
        document.body.classList.toggle("cm-calm", !v);
      }));
    new Setting(el).setName("Queue order")
      .setDesc("Clean pages first gives quick wins; flagged first tackles the hard ones while you're fresh.")
      .addDropdown((d) => {
        Object.entries(SORTS).forEach(([k, v]) => d.addOption(k, v));
        d.setValue(this.plugin.settings.sort).onChange(async (v) => {
          this.plugin.settings.sort = v; await this.plugin.persist(); this.plugin.renderAll();
        });
      });
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
    if (/^(#|>|\||---|!\[\[|%%)/.test(line)) continue;
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

/* ---------- search box on the Dashboard ---------- */

/** Keeps a searchable record of every page in scope, refreshed as pages change. */
class SearchIndex {
  constructor(app) {
    this.app = app;
    this.entries = new Map();
    this.dirty = new Set();
    this.ready = null;
  }

  start() {
    this.ready = this.buildAll();
    return this.ready;
  }

  async buildAll() {
    const files = this.app.vault.getMarkdownFiles().filter((f) => inSearchScope(f.path));
    for (const f of files) await this.index(f);
    // Drop anything that has since left the scope or the vault.
    for (const p of [...this.entries.keys()]) if (!this.app.vault.getAbstractFileByPath(p)) this.entries.delete(p);
  }

  async index(file) {
    if (!(file instanceof TFile) || !inSearchScope(file.path)) return;
    try {
      const text = await this.app.vault.read(file);
      const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      let yaml = {};
      if (m) { try { yaml = parseYaml(m[1]) || {}; } catch (e) { yaml = {}; } }
      this.entries.set(file.path, makeEntry(file.path, text, yaml));
    } catch (e) {
      this.entries.delete(file.path);
    }
  }

  /** Called when a page changes: re-reads it a moment later, once. */
  touch(file) {
    if (!(file instanceof TFile) || !inSearchScope(file.path)) return;
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

  search(q) { return searchEntries(this.entries.values(), q); }
}

class SearchBlock extends MarkdownRenderChild {
  constructor(el, plugin) {
    super(el);
    this.plugin = plugin;
    this.app = plugin.app;
    this.hits = [];
    this.active = 0;
    this.query = "";
  }

  onload() {
    const el = this.containerEl;
    el.empty();
    el.addClass("cm-search");
    const bar = el.createDiv({ cls: "cm-search-bar" });
    setIcon(bar.createSpan({ cls: "cm-search-icon" }), "search");
    this.input = bar.createEl("input", { cls: "cm-search-input", attr: { type: "text", placeholder: "Search the Coppermind…", spellcheck: "false", autocomplete: "off", "aria-label": "Search the Coppermind" } });
    this.clearBtn = bar.createSpan({ cls: "cm-search-clear", attr: { role: "button", "aria-label": "Clear search" } });
    setIcon(this.clearBtn, "x");
    this.list = el.createDiv({ cls: "cm-search-results" });
    this.list.hide();

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

  async onType() {
    this.query = this.input.value;
    this.clearBtn.toggleClass("is-visible", !!this.query);
    if (!this.query.trim()) { this.hits = []; this.list.hide(); return; }
    if (this.plugin.searchIndex.ready) await this.plugin.searchIndex.ready;
    if (this.query !== this.input.value) return; // typed more while waiting
    this.hits = this.plugin.searchIndex.search(this.query);
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
      list.createDiv({ cls: "cm-search-empty", text: `No pages match “${this.query.trim()}”.` });
    }
    this.cards = list.createDiv({ cls: "cm-search-cards" });
    this.shown = 0;
    const foot = list.createDiv({ cls: "cm-search-foot" });
    this.count = foot.createSpan({ cls: "cm-search-count" });
    const link = foot.createSpan({ cls: "cm-search-more", text: "Search everything, including class notes ↗", attr: { role: "button", tabindex: "0" } });
    const go = () => this.searchAll();
    link.addEventListener("click", go);
    link.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); go(); } });
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
      this.marked(title, e.name, tokens);
      if (e.typeLabel) top.createSpan({ cls: "cm-search-tag", text: e.typeLabel });
      if (e.status) top.createSpan({ cls: "cm-search-status cm-search-" + e.status, text: e.status });
      if (h.aliasNote) {
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
    this.app.workspace.openLinkText(hit.entry.path, "", !!newTab);
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
 * Finds the Changelog section. Returns { eol, lines, headingIdx, lastBulletIdx, versions }
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
  let lastBulletIdx = -1;
  const versions = [];
  for (let i = headingIdx + 1; i < end; i++) {
    const m = lines[i].match(/^- \*\*(\d+\.\d+)\b/);
    if (m) { lastBulletIdx = i; versions.push(m[1]); }
  }
  return { eol, lines, headingIdx, lastBulletIdx, versions };
}

/** Frontmatter value of a simple `key: value` property, or null. */
function frontmatterValue(text, key) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const k = m[1].match(new RegExp(`^${escapeRegExp(key)}:[ \\t]*(.*?)[ \\t]*$`, "m"));
  return k ? k[1] : null;
}

/** Current version, the latest changelog version, and the changelog as seen by the modal. */
function schemaInfo(text) {
  const cl = findChangelog(text);
  const fmVersion = frontmatterValue(text, "version");
  const latest = cl && cl.versions.length
    ? cl.versions.reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b))
    : null;
  return { hasChangelog: !!cl, fmVersion, latest, versions: cl ? cl.versions : [] };
}

/** Returns an error message for a bad version, or "" if it is fine. */
function checkVersion(text, version) {
  if (!/^\d+\.\d+$/.test(version)) return "Use the form 4.2 (a whole number, a dot, and a number).";
  const info = schemaInfo(text);
  if (!info.hasChangelog) return "SCHEMA.md has no “Changelog” heading to add to.";
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
  if (!cl) throw new Error("No Changelog heading in SCHEMA.md");
  const { eol, lines } = cl;
  const line = entryLine(version, date, desc);
  if (cl.lastBulletIdx !== -1) {
    lines.splice(cl.lastBulletIdx + 1, 0, line);
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

/* ---------- schema changelog dialog ---------- */

class SchemaLogModal extends Modal {
  constructor(app, plugin, text) {
    super(app);
    this.plugin = plugin;
    this.text = text;
    this.version = "";
    this.desc = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cm-schemalog");
    this.titleEl.setText("Log a schema change");

    const info = schemaInfo(this.text);
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
    this.descInput = descWrap.createEl("textarea", { attr: { rows: "5", placeholder: "Reworded §7 so a rejected draft is deleted, never kept." } });
    this.descInput.addEventListener("input", () => { this.desc = this.descInput.value; this.refresh(); });
    this.descInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.submit(); }
    });

    contentEl.createDiv({ cls: "cm-schemalog-label", text: `Will be added to the bottom of the changelog (dated ${date}):` });
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
    this.error = this.version ? checkVersion(this.text, this.version) : "";
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
    this.stripPaths = new WeakMap();
    this.stripObservers = new Set();

    this.registerView(VIEW_TYPE, (leaf) => new QueueView(leaf, this));
    this.registerView(REL_VIEW_TYPE, (leaf) => new RelationsView(leaf, this));
    this.registerView(MAP_VIEW_TYPE, (leaf) => new WikiMapView(leaf, this));
    this.addSettingTab(new ReviewSettings(this.app, this));
    this.registerCommands();

    document.body.classList.toggle("cm-calm", this.settings.ambient === false);
    document.body.classList.toggle("cm-quiet", this.settings.dashStyle !== "classic");
    this.statusEl = this.addStatusBarItem();
    this.statusEl.addClass("cm-status", "mod-clickable");
    this.statusEl.setAttr("aria-label", "Open the review queue");
    this.statusEl.addEventListener("click", () => this.activateView());

    addIcon("coppermind-logo", LOGO_ICON);
    // A middle-click can reach the ribbon callback more than once (and without a usable button number),
    // so remember when the middle button went down and open the new tab exactly once per press.
    this.middleDownAt = 0;
    this.middleHandled = false;
    this.ribbonEl = this.addRibbonIcon("coppermind-logo", "Dashboard (Alt+D)", (evt) => {
      const middle = Date.now() - this.middleDownAt < 800 || !!(evt && evt.button === 1);
      if (middle) {
        if (this.middleHandled) return;
        this.middleHandled = true;
        this.openDashboard(true);
        return;
      }
      this.openDashboard(!!(evt && (evt.ctrlKey || evt.metaKey)));
    });
    this.ribbonEl.addClass("cm-ribbon-logo");
    this.addRibbonIcon("git-fork", "Relations panel (Alt+L)", () => this.activateRelations());
    this.ribbonEl.addEventListener("mousedown", (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      this.middleDownAt = Date.now();
      this.middleHandled = false;
    }, true);
    this.addRibbonIcon("badge-check", "Review queue (Alt+Q)", () => this.activateView());

    this.registerMarkdownCodeBlockProcessor("coppermind-hero", (src, el, ctx) => this.renderHero(el, src, ctx));
    for (const [name, method] of [["coppermind-dashboard", "renderDashboard"], ["coppermind-nav", "renderNav"], ["coppermind-activity", "renderActivity"]]) {
      this.registerMarkdownCodeBlockProcessor(name, (src, el, ctx) => ctx.addChild(new LiveBlock(el, this, method)));
    }
    this.registerMarkdownPostProcessor((el, ctx) => this.addResolveButtons(el, ctx));
    this.searchIndex = new SearchIndex(this.app);
    this.registerMarkdownCodeBlockProcessor("coppermind-search", (src, el, ctx) => ctx.addChild(new SearchBlock(el, this)));
    this.registerEvent(this.app.vault.on("modify", (f) => this.searchIndex.touch(f)));
    this.registerEvent(this.app.vault.on("create", (f) => this.searchIndex.touch(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.searchIndex.remove(f.path)));
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => this.searchIndex.rename(f, oldPath)));

    this.scheduleRefresh = debounce(() => this.refresh(), 400, true);
    this.registerEvent(this.app.workspace.on("file-open", (file) => {
      this.syncSchemaButtons();
      if (file) this.currentPath = file.path;
      if (file && this.isDashboard(file)) this.startDashIntro();
      this.syncDashboardLeaves(true);
      if (file && !this.isDashboard(file)) this.pageIn();
      this.renderViews();
    }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      this.syncDashboardLeaves(false);
      this.enforceReading(leaf);
    }));
    this.registerEvent(this.app.workspace.on("layout-change", () => { this.syncSchemaButtons(); this.syncDashboardLeaves(false); }));
    this.registerEvent(this.app.metadataCache.on("changed", () => { this.scheduleRefresh(); this.syncDashboardLeaves(false); }));
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file, oldPath)));
    this.app.workspace.onLayoutReady(async () => {
      // close the panels Obsidian keeps bringing back in the right sidebar (backlinks, outgoing links, tags, properties, outline)
      if (this.settings.hidePanels !== false) {
        for (const t of ["backlink", "outgoing-link", "tag", "all-properties", "outline"]) this.app.workspace.detachLeavesOfType(t);
      }
      this.startDashIntro();
      this.searchIndex.start();
      this.syncSchemaButtons();
      await this.migrateHome();
      this.syncDashboardLeaves(true);
      const f = this.app.workspace.getActiveFile();
      if (f) this.currentPath = f.path;
      this.refresh();
    });
  }

  onunload() {
    clearTimeout(this.dashIntroTimer);
    document.querySelectorAll(".cm-schema-log-btn").forEach((e) => e.remove());
    this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view) l.view.__cmSchemaBtn = null; });
    document.querySelectorAll(".cm-resolve-btn, .cm-ribbon-logo").forEach((e) => e.remove());
    document.body.classList.remove("cm-on-dashboard");
    document.querySelectorAll(".cm-dashboard-leaf, .cm-log-leaf, .cm-noprops-leaf, .cm-strip-leaf, .cm-props-open, .cm-st-verified, .cm-st-draft").forEach((e) => e.classList.remove("cm-dashboard-leaf", "cm-log-leaf", "cm-noprops-leaf", "cm-strip-leaf", "cm-props-open", "cm-st-verified", "cm-st-draft"));
    document.body.classList.remove("cm-calm", "cm-quiet");
    document.querySelectorAll(".cm-propstrip").forEach((e) => e.remove());
    this.stripObservers.forEach((o) => o.disconnect());
    this.stripObservers.clear();
    this.app.workspace.getLeavesOfType("markdown").forEach((l) => { if (l.view && l.view.containerEl) { l.view.containerEl.classList.remove("cm-strip-leaf", "cm-props-open"); l.view.containerEl.querySelectorAll(".cm-propstrip").forEach((e) => e.remove()); l.view.__cmStripObs = null; } });
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
    this.addCommand({ id: "open-dashboard", name: "Go to the Dashboard", hotkeys: [{ modifiers: ["Alt"], key: "d" }], callback: () => this.openDashboard() });
    this.addCommand({ id: "log-schema-change", name: "Log a schema change", callback: () => this.openSchemaLog() });
    this.addCommand({ id: "open-wiki-map", name: "Open the wiki map", hotkeys: [{ modifiers: ["Alt"], key: "m" }], callback: () => this.activateWikiMap() });
    this.addCommand({ id: "open-relations", name: "Open the relations panel", hotkeys: [{ modifiers: ["Alt"], key: "l" }], callback: () => this.activateRelations() });
    this.addCommand({ id: "open-queue", name: "Open the review queue", hotkeys: [{ modifiers: ["Alt"], key: "q" }], callback: () => this.activateView() });
  }

  /* --- schema changelog --- */

  /** Shows a pen button in the header of any open SCHEMA.md tab, and removes it from every other tab. It is drawn on screen only; nothing is written to the page. */
  syncSchemaButtons() {
    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (!view || typeof view.addAction !== "function") return;
      const onSchema = !!(view.file && view.file.path === SCHEMA_PATH);
      const has = view.__cmSchemaBtn && view.__cmSchemaBtn.isConnected;
      if (onSchema && !has) {
        const btn = view.addAction("file-pen", "Log a schema change", () => this.openSchemaLog());
        btn.addClass("cm-schema-log-btn");
        view.__cmSchemaBtn = btn;
      } else if (!onSchema && view.__cmSchemaBtn) {
        view.__cmSchemaBtn.remove();
        view.__cmSchemaBtn = null;
      }
    });
  }

  schemaFile() {
    const f = this.app.vault.getAbstractFileByPath(SCHEMA_PATH);
    return f instanceof TFile ? f : null;
  }

  async openSchemaLog() {
    const file = this.schemaFile();
    if (!file) { new Notice(`Could not find ${SCHEMA_PATH} at the top of the vault.`); return; }
    const text = await this.app.vault.read(file);
    if (!findChangelog(text)) { new Notice("SCHEMA.md has no “Changelog” heading, so there is nowhere to add the entry."); return; }
    new SchemaLogModal(this.app, this, text).open();
  }

  async addSchemaEntry(version, desc) {
    const file = this.schemaFile();
    if (!file) throw new Error(`Could not find ${SCHEMA_PATH}.`);
    const date = today();
    await this.app.vault.process(file, (text) => {
      // Re-check against the file as it is right now (it may have changed since the dialog opened).
      const err = checkVersion(text, version);
      if (err) throw new Error(err);
      return addChangelogEntry(text, version, date, desc);
    });
    new Notice(`Added ${version} to the SCHEMA changelog.`);
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
    if (this.lastDone !== undefined && done > this.lastDone && this.settings.ambient !== false && !prefersReduced()) {
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

  isQuiet() { return this.settings.dashStyle !== "classic"; }

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
      const line = box.createDiv({ cls: "cm-qstats-line" });
      line.createSpan({ cls: "cm-q-verified", text: `${verified} of ${all.length}` });
      line.appendText(` pages verified (${Math.round(pctQ * 100)}%) · ${drafts.length} draft${drafts.length === 1 ? "" : "s"} · ${flagCount} open flag${flagCount === 1 ? "" : "s"}`);
      const bar = box.createDiv({ cls: "cm-qbar" }).createDiv({ cls: "cm-qbar-fill" });
      bar.style.width = `${(pctQ * 100).toFixed(1)}%`;
      const bdQ = Object.entries(FLAG_KINDS)
        .map(([k, info]) => [info, drafts.reduce((n, i) => n + i.flags.filter((f) => f.kind === k).length, 0)])
        .filter(([, n]) => n > 0).map(([info, n]) => `${n} ${(n === 1 ? info.label : info.plural.replace(/ \(.*\)$/, "")).toLowerCase()}`).join(", ");
      const subBits = [bdQ ? `Open flags: ${bdQ}` : "", stale.length ? `${stale.length} draft${stale.length === 1 ? "" : "s"} older than ${STALE_DAYS} days` : ""].filter(Boolean);
      if (subBits.length) box.createDiv({ cls: "cm-qstats-sub", text: subBits.join(". ") + "." });
      // keep the milestone up to date, so switching back to Classic doesn't replay old bursts
      if (all.length) {
        const ms = verified >= all.length ? 100 : Math.floor((pctQ * 100) / 25) * 25;
        if (this.settings.milestone !== ms) { this.settings.milestone = ms; this.persist(); }
      }
    }

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
        if (prev !== undefined && ms > prev && this.settings.ambient !== false && !prefersReduced()) setTimeout(() => this.sparkBurst(rwrap, ms === 100 ? 80 : 36, ms === 100 ? 210 : 130), 650);
      }
    }
    const rside = rbody.createDiv({ cls: "cm-ring-side" });
    rside.createDiv({ cls: "cm-ring-big", text: `${verified} of ${all.length}` });
    rside.createDiv({ cls: "cm-sub", text: "pages verified" });
    const btn = rside.createEl("button", { cls: "mod-cta", text: drafts.length ? "Start reviewing" : "All verified" });
    btn.disabled = !drafts.length;
    btn.addEventListener("click", async () => { await this.activateView(); this.openNext(null); });

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
          i.changes.forEach((c) => row.createDiv({ cls: "cm-dash-change-line", text: c }));
          row.setAttr("role", "button");
          row.setAttr("tabindex", "0");
          row.addEventListener("click", () => this.openFile(i.path));
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

  /** Draws the last 14 days of log activity as small stacked bars: verifications and other changes. */
  guidesLink() {
    const f = this.app.vault.getAbstractFileByPath(INDEX_PATH);
    const cache = f instanceof TFile ? this.app.metadataCache.getFileCache(f) : null;
    const h = cache && (cache.headings || []).find((x) => /^Guides\b/.test(x.heading));
    return h ? `index#${h.heading}` : "index";
  }

  renderNav(el) {
    el.empty();
    el.addClass("cm-nav");
    el.toggleClass("is-quiet", this.isQuiet());
    el.toggleClass("is-intro", !!this.dashIntro && !prefersReduced());
    const drafts = this.items.filter((i) => i.status === "draft").length;
    const rechecks = this.items.filter((i) => i.status === "draft" && i.changes.length).length;
    const open = (link) => (newTab) => this.app.workspace.openLinkText(link, "", !!newTab);
    const cards = [
      { icon: "list", title: "Index", sub: "Every page, by type", go: open("index") },
      { icon: "badge-check", title: "Review queue", sub: drafts ? `${drafts} drafts waiting${rechecks ? `, ${rechecks} changed since verified` : ""}` : "Nothing waiting", go: () => this.activateView() },
      { icon: "network", title: "Wiki map", sub: "Every typed link, as a tree and a map", go: () => this.activateWikiMap() },
      { icon: "scroll-text", title: "Log", sub: "Every change and decision", go: open("log") },
      { icon: "book-open", title: "Schema", sub: "The rulebook", go: open("SCHEMA") },
      { icon: "life-buoy", title: "Guides", sub: "How the vault works", go: open(this.guidesLink()) },
    ];
    cards.forEach((c, idx) => {
      const card = el.createDiv({ cls: "cm-navcard" });
      if (!this.isQuiet()) card.style.setProperty("--acc", DASH_COLORS[idx % DASH_COLORS.length]);
      card.style.setProperty("--i", String(idx));
      card.setAttr("role", "button");
      card.setAttr("tabindex", "0");
      if (!this.isQuiet()) setIcon(card.createSpan({ cls: "cm-navcard-icon" }), c.icon);
      card.createDiv({ cls: "cm-navcard-title", text: c.title });
      card.createDiv({ cls: "cm-navcard-sub", text: c.sub });
      card.addEventListener("click", (e) => c.go(e.ctrlKey || e.metaKey));
      card.addEventListener("auxclick", (e) => { if (e.button === 1) { e.preventDefault(); c.go(true); } });
      card.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.go(e.ctrlKey || e.metaKey); } });
    });
  }

  async renderActivity(el) {
    const f = this.app.vault.getAbstractFileByPath(LOG_PATH);
    const entries = f instanceof TFile ? parseLog(await this.app.vault.cachedRead(f)).slice(-6).reverse() : [];
    el.empty();
    el.addClass("cm-activity");
    el.toggleClass("is-intro", !!this.dashIntro && !prefersReduced());
    if (!entries.length) { el.createDiv({ cls: "cm-sub", text: "Nothing in the log yet." }); return; }
    const icons = { verify: "check", ingest: "download", setup: "wrench", schema: "file-pen", query: "search", "health-check": "stethoscope" };
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
        this.app.workspace.openLinkText(target ? target.path : "log", "", false);
      };
      row.addEventListener("click", go);
      row.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); } });
    });
  }

  linkTo(parent, item) {
    const a = parent.createEl("a", { cls: "internal-link", text: item.name, href: item.name });
    a.setAttr("data-href", item.name);
    a.addEventListener("click", (e) => { e.preventDefault(); this.openFile(item.path); });
  }

  /* --- dashboard --- */

  dashboardFile() {
    for (const p of [DASHBOARD_PATH, OLD_HOME_PATH]) {
      const f = this.app.vault.getAbstractFileByPath(p);
      if (f instanceof TFile) return f;
    }
    return null;
  }

  isDashboard(file) {
    return file instanceof TFile && (file.path === DASHBOARD_PATH || file.path === OLD_HOME_PATH);
  }

  /**
   * Tag panes showing the Dashboard, index, or log so CSS can hide their properties (and the Dashboard's title),
   * tag the body when the Dashboard is the active note, and fold the log's entries the first time it opens.
   */
  syncDashboardLeaves(enforce) {
    const ws = this.app.workspace;
    ws.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;
      const path = view.file ? view.file.path : "";
      const isDash = this.isDashboard(view.file);
      const isLog = path === LOG_PATH;
      view.containerEl.classList.toggle("cm-dashboard-leaf", isDash);
      view.containerEl.classList.toggle("cm-log-leaf", isLog);
      view.containerEl.classList.toggle("cm-noprops-leaf", isDash || isLog || path === INDEX_PATH);
      const pageStatus = view.file ? ((this.app.metadataCache.getFileCache(view.file) || {}).frontmatter || {}).status : "";
      view.containerEl.classList.toggle("cm-st-verified", pageStatus === "verified");
      view.containerEl.classList.toggle("cm-st-draft", pageStatus === "draft");
      const useStrip = !!view.file && !isDash && !isLog && path !== INDEX_PATH;
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

  removeStrips(view) {
    view.containerEl.querySelectorAll(".cm-propstrip").forEach((e) => e.remove());
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

  ensureStrips(view) {
    if (!view.file) return;
    const info = this.stripInfo(view.file);
    const root = view.containerEl;
    // When Obsidian re-renders a note (for example on switching between editing and reading),
    // it can re-create the Properties block or move the title, leaving an old strip stranded
    // somewhere else. Remove every strip that isn't directly in front of a Properties block,
    // so each block keeps exactly one strip.
    root.querySelectorAll(".cm-propstrip").forEach((s) => {
      const next = s.nextElementSibling;
      if (!next || !next.classList.contains("metadata-container")) s.remove();
    });
    const metas = root.querySelectorAll(".metadata-container");
    metas.forEach((meta) => {
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
    if (!ed || !view.file || view.file.path !== LOG_PATH || view.getMode() !== "source") return;
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

  async openDashboard(newTab) {
    const f = this.dashboardFile();
    if (!f) { new Notice("Couldn't find Dashboard.md."); return; }
    const already = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view.file && l.view.file.path === f.path);
    if (already && !newTab) { this.app.workspace.setActiveLeaf(already, { focus: true }); return; }
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(f, { state: { mode: "preview" } });
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

  async fixHomepageSetting() {
    const path = `${this.app.vault.configDir}/plugins/homepage/data.json`;
    try {
      if (!(await this.app.vault.adapter.exists(path))) return;
      const data = JSON.parse(await this.app.vault.adapter.read(path));
      let changed = false;
      Object.values(data.homepages || {}).forEach((h) => {
        if (h && (h.value === OLD_HOME_PATH || h.value === "Home")) { h.value = DASHBOARD_PATH; h.view = "Reading view"; changed = true; }
      });
      if (changed) await this.app.vault.adapter.write(path, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Nicrosil: couldn't update the startup page setting", e);
      new Notice("Couldn't update the startup page setting. In Settings → Homepage, choose Dashboard.", 10000);
    }
  }

  /* --- navigation --- */

  mainLeaf() {
    const cur = this.currentPath;
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    return leaves.find((l) => l.view.file && l.view.file.path === cur) || leaves[0] || this.app.workspace.getLeaf(false);
  }

  async activateWikiMap() {
    let leaf = this.app.workspace.getLeavesOfType(MAP_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: MAP_VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  async activateRelations() {
    let leaf = this.app.workspace.getLeavesOfType(REL_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf.setViewState({ type: REL_VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  async openFile(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return;
    const leaf = this.mainLeaf();
    await leaf.openFile(f);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }

  async openNext(fromPath, order) {
    const next = nextAfter(order || this.queue(), fromPath);
    if (!next) { new Notice("The review queue is empty."); return; }
    await this.openFile(next.path);
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
      new Notice("Nicrosil only works on pages in Wiki/, Perspectives/, Sources/Source Cards/, or root-level files like SCHEMA.md.");
      return null;
    }
    const fm = this.fm(file);
    if (fm.status === "verified") { new Notice(`“${file.basename}” is already verified.`); return null; }
    if (fm.status !== "draft") { new Notice(`“${file.basename}” has no status: draft property, so I left it alone.`); return null; }
    return fm;
  }

  async verify(file) {
    const fm = this.precheck(file);
    if (!fm) return;
    if (fm.type === "source" && !String(fm.reliability || "").trim()) {
      new Notice("Fill in this source card's reliability rating first (SCHEMA §7: ratings are item by item).", 8000);
      return;
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
          new Notice(`Verified “${file.basename}”.` + (indexed || !file.path.includes("/") ? "" : " It wasn't in index.md; add it by hand."), 5000);
          const nxt = nextAfter(order, file.path);
          const fx = this.settings.celebrate !== false && !prefersReduced() ? await this.playVerifyOut(file, order.length > 1 ? "Verified" : "All drafts verified") : null;
          if (this.settings.autoAdvance) await this.openNext(file.path, order);
          if (fx) this.playVerifyIn(fx, this.settings.autoAdvance && nxt ? `Next: ${nxt.name} · ${Math.max(0, order.length - 1)} left` : "");
          else this.vfBusy = false;
          if (!this.settings.autoAdvance) setTimeout(() => this.pulseStrip(file), 600);
        } catch (e) {
          console.error("Nicrosil: verify failed", e);
          new Notice(`Verify failed: ${e.message}. Check status, index.md and log.md.`, 10000);
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
  /** A newly opened page fades in with a slight rise. */
  pageIn() {
    if (this.vfBusy || this.settings.ambient === false || prefersReduced()) return;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const c = view && view.containerEl && view.containerEl.querySelector(".view-content");
    if (!c) return;
    c.removeClass("cm-page-in");
    void c.offsetWidth;
    c.addClass("cm-page-in");
    setTimeout(() => c.removeClass("cm-page-in"), 450);
  }

  /** The properties strip glows once on a page that was just verified. */
  pulseStrip(file) {
    const view = this.app.workspace.getLeavesOfType("markdown").map((l) => l.view).find((v) => v && v.file && v.file.path === file.path);
    const strip = view && view.containerEl && view.containerEl.querySelector(".cm-propstrip");
    if (!strip) return;
    strip.addClass("cm-strip-pulse");
    setTimeout(() => strip.removeClass("cm-strip-pulse"), 2200);
  }

  playVerifyOut(file, label) {
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
    content.addClass("cm-vf-out");
    return new Promise((res) => setTimeout(() => { ov.remove(); res({ host, content }); }, 700));
  }

  playVerifyIn(fx, label) {
    fx.content.removeClass("cm-vf-out");
    const leaf = this.mainLeaf();
    const host = leaf && leaf.view && leaf.view.containerEl;
    const content = host && host.querySelector(".view-content");
    if (content) {
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
          new Notice(`Rejected and deleted “${file.basename}”.` + (indexed ? "" : " It wasn't in index.md."), 5000);
        } catch (e) {
          console.error("Nicrosil: reject failed", e);
          new Notice(`Reject failed: ${e.message}. Check log.md, index.md and the page.`, 10000);
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

  async updateIndex(name, mode, date) {
    const f = this.app.vault.getAbstractFileByPath(INDEX_PATH);
    if (!(f instanceof TFile)) { new Notice("index.md not found; update it by hand."); return false; }
    let found = false;
    await this.app.vault.process(f, (text) => {
      const r = editIndex(text, name, mode, date);
      found = r.found;
      return r.text;
    });
    return found;
  }

  async appendLog(entry) {
    const f = this.app.vault.getAbstractFileByPath(LOG_PATH);
    if (!(f instanceof TFile)) throw new Error("log.md not found");
    await this.app.vault.process(f, (text) => appendToLog(text, entry));
  }
};

module.exports.__test = {
  parseFlags, removeLines, sortQueue, nextAfter, groupOf, editIndex,
  verifyLogEntry, rejectLogEntry, appendToLog, daysBetween, today, parseLog, describeEntry, renameLogEntry, parseIndex, renderIndex,
};
