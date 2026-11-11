"use strict";
/*
 * Coppermind Review (v0.4)
 *
 * Review tools for draft pages (all in the sidebar and on hotkeys; no buttons on the page header):
 *  - verify-and-next and skip, so a review session never goes back to a list
 *  - a review queue in the right sidebar with progress and flag badges
 *  - "Resolve" on flag callouts: removes the callout and records my decision,
 *    which is written to the log when the page is verified or rejected
 *  - hotkeys and a status-bar counter
 *  - Dashboard page blocks (```coppermind-hero```, -dashboard, -nav, -activity), a ribbon
 *    logo button and Alt+H to go back to the Dashboard, and a one-time Home to Dashboard rename
 *
 * Verify: sets status: verified and verified_on, flips the page's entry in index.md,
 *         recomputes the totals, and appends to log.md.
 * Reject: asks for a reason, logs it, removes the page from index.md, and deletes the page
 *         (SCHEMA §7: a rejected draft is deleted, never kept).
 * Nothing is committed to git; do that yourself afterward.
 */
const {
  Plugin, Modal, Notice, MarkdownView, TFile, ItemView, FuzzySuggestModal,
  PluginSettingTab, Setting, MarkdownRenderChild, setIcon, addIcon, debounce,
} = require("obsidian");

const INDEX_PATH = "index.md";
const LOG_PATH = "log.md";
const DASHBOARD_PATH = "Dashboard.md";
const OLD_HOME_PATH = "Home.md";
// Feruchemical copper symbol, drawn for Obsidian's 100x100 icon box.
const LOGO_ICON = `<g transform="translate(9.79 0) scale(0.2)"><path fill="currentColor" transform="translate(283.29507 359.37144)" d="M -161.19707,-1.8874443 V -79.964444 c 22.166,18.637 46.922,37.621 46.922,37.621 l 22.132996,-22.167 c 0,0 -40.038996,-25.523 -69.054996,-46.888996 v -143.076 l 279.99996,395.104 -10.77,-47.203004 -307.69096,-452.796996 v 212.379 c -21.332,-25.804 -50.807,-66.68 -53.221,-69.965 1.504,3.705 25.49,61.466 53.221,98.776 v 82.970996 l -83.637,-72.412996 v 33.812996 l 83.637,73.28499966 V 140.62856 H 3.4179256 L -43.020074,100.41856 -161.19707,-1.8874443 z m 0,102.3070043 V 33.147556 l 76.743996,67.272004 h -76.743996 z"/></g>`;
const VIEW_TYPE = "coppermind-review-queue";
const REVIEWABLE = [/^Wiki\//, /^Perspectives\//, /^Sources\/Source Cards\//];
const GROUP_ORDER = ["Frameworks", "Concepts", "Case Studies", "Glossary", "People", "Summaries",
  "Prompts", "Workflows", "Guides", "Analyses", "Perspectives", "Source Cards"];
const FLAG_KINDS = {
  caution: { label: "Accuracy check", plural: "Accuracy checks", short: "A" },
  todo: { label: "Gap", plural: "Gaps", short: "G" },
  question: { label: "Question", plural: "Questions (whose view?)", short: "Q" },
  warning: { label: "Warning", plural: "Warnings (unsourced)", short: "W" },
};
const STALE_DAYS = 14;
const DEFAULT_SETTINGS = { autoAdvance: true, sort: "clean" };
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
  const m = path.match(/^Wiki\/([^/]+)\//);
  return m ? m[1] : "Other";
}

function groupRank(g) {
  const i = GROUP_ORDER.indexOf(g);
  return i < 0 ? GROUP_ORDER.length : i;
}

/** Order drafts for review. Skipped pages go to the end, in the order they were skipped. */
function sortQueue(drafts, mode, skipped) {
  const byType = (a, b) => groupRank(a.group) - groupRank(b.group) || a.name.localeCompare(b.name);
  const cmp = {
    clean: (a, b) => a.flags.length - b.flags.length || byType(a, b),
    flagged: (a, b) => b.flags.length - a.flags.length || byType(a, b),
    type: byType,
    az: (a, b) => a.name.localeCompare(b.name),
  }[mode] || byType;
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
 * index.md model. Each "## Type (n)" section holds entries, split under "### Verified (n)" and
 * "### Drafts (n)". The older format (status in brackets at the end of each line) is read too,
 * and rewritten in the new format.
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
  let sub = "draft";
  for (const line of lines) {
    let m;
    if ((m = line.match(/^## (.+?)\s*\(\d+\)\s*$/))) {
      cur = { title: m[1], entries: [], extra: [] };
      sections.push(cur);
      sub = "draft";
    } else if (!cur) {
      head.push(line);
    } else if ((m = line.match(/^### (Verified|Drafts)\b/i))) {
      sub = m[1].toLowerCase() === "verified" ? "verified" : "draft";
    } else if (/^- \[\[/.test(line)) {
      let status = sub;
      const t = line.match(/\s\((draft|verified)\)\s*$/);
      if (t) status = t[1];
      cur.entries.push({ name: entryName(line), status, text: line.replace(/\s\((draft|verified)\)\s*$/, "").replace(/\s+$/, "") });
    } else if (line.trim() !== "") {
      cur.extra.push(line);
    }
  }
  while (head.length && head[head.length - 1].trim() === "") head.pop();
  return { head, sections };
}

function renderIndex(model, date) {
  const byName = (a, b) => (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" });
  let verified = 0, drafts = 0;
  const body = [];
  for (const sec of model.sections) {
    const v = sec.entries.filter((e) => e.status === "verified").sort(byName);
    const d = sec.entries.filter((e) => e.status !== "verified").sort(byName);
    verified += v.length;
    drafts += d.length;
    body.push(`## ${sec.title} (${v.length + d.length})`, "");
    if (v.length) body.push(`### Verified (${v.length})`, ...v.map((e) => e.text), "");
    if (d.length) body.push(`### Drafts (${d.length})`, ...d.map((e) => e.text), "");
    if (sec.extra.length) body.push(...sec.extra, "");
  }
  let head = model.head.join("\n");
  head = head.replace(/^\*\*Totals:\*\*.*$/m, `**Totals:** ${verified} verified · ${drafts} drafts`);
  head = head.replace(/^updated:.*$/m, `updated: ${date}`);
  return head + "\n\n" + body.join("\n").replace(/\n+$/, "") + "\n";
}

/** Returns { text, found }. mode: "verify" moves the entry to Verified; "remove" deletes it. */
function editIndex(text, name, mode, date) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const model = parseIndex(text);
  let found = false;
  for (const sec of model.sections) {
    const k = sec.entries.findIndex((e) => e.name === name);
    if (k < 0) continue;
    found = true;
    if (mode === "remove") sec.entries.splice(k, 1);
    else sec.entries[k].status = "verified";
    break;
  }
  if (!found) return { text, found: false };
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

function progressBar(parent, done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const wrap = parent.createDiv({ cls: "cm-progress" });
  wrap.createDiv({ cls: "cm-progress-fill" }).style.width = `${pct}%`;
  parent.createDiv({ cls: "cm-progress-label", text: `${done} of ${total} pages verified (${pct}%)` });
}

function flagBadges(parent, flags) {
  const counts = {};
  flags.forEach((f) => { counts[f.kind] = (counts[f.kind] || 0) + 1; });
  const wrap = parent.createSpan({ cls: "cm-badges" });
  Object.keys(FLAG_KINDS).forEach((k) => {
    if (!counts[k]) return;
    const b = wrap.createSpan({ cls: `cm-badge cm-badge-${k}`, text: `${FLAG_KINDS[k].short}${counts[k] > 1 ? counts[k] : ""}` });
    b.setAttr("aria-label", `${counts[k]} ${counts[k] > 1 ? FLAG_KINDS[k].plural.toLowerCase() : FLAG_KINDS[k].label.toLowerCase()}`);
  });
  if (!flags.length) wrap.createSpan({ cls: "cm-badge cm-badge-clean", text: "✓" }).setAttr("aria-label", "No open flags");
  return wrap;
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
    this.modalEl.addClass("coppermind-review-modal");
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
    this.modalEl.addClass("coppermind-review-modal");
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
    const list = root.createDiv({ cls: "cm-list" });
    list.createDiv({ cls: "cm-list-head", text: `Drafts (${order.length})` });
    let lastGroup = null;
    order.forEach((item) => {
      if (p.settings.sort === "type" && item.group !== lastGroup) {
        list.createDiv({ cls: "cm-group", text: item.group });
        lastGroup = item.group;
      }
      const row = list.createDiv({ cls: "cm-row" });
      if (cur && item.path === cur.path) row.addClass("is-current");
      if (p.skipped.includes(item.path)) row.addClass("is-skipped");
      const nameEl = row.createDiv({ cls: "cm-row-name", text: item.name });
      if (p.settings.sort !== "type") nameEl.createSpan({ cls: "cm-row-group", text: item.group });
      flagBadges(row, item.flags);
      row.addEventListener("click", () => p.openFile(item.path));
    });

    if (verified.length) {
      const det = root.createEl("details", { cls: "cm-verified" });
      det.createEl("summary", { text: `Verified (${verified.length})` });
      verified.sort((a, b) => a.name.localeCompare(b.name)).forEach((item) => {
        const row = det.createDiv({ cls: "cm-row" });
        row.createDiv({ cls: "cm-row-name", text: item.name });
        row.addEventListener("click", () => p.openFile(item.path));
      });
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

module.exports = class CoppermindReview extends Plugin {
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

    this.registerView(VIEW_TYPE, (leaf) => new QueueView(leaf, this));
    this.addSettingTab(new ReviewSettings(this.app, this));
    this.registerCommands();

    this.statusEl = this.addStatusBarItem();
    this.statusEl.addClass("cm-status", "mod-clickable");
    this.statusEl.setAttr("aria-label", "Open the review queue");
    this.statusEl.addEventListener("click", () => this.activateView());

    addIcon("coppermind-logo", LOGO_ICON);
    this.ribbonEl = this.addRibbonIcon("coppermind-logo", "Dashboard (Alt+H)", () => this.openDashboard());
    this.ribbonEl.addClass("cm-ribbon-logo");

    this.registerMarkdownCodeBlockProcessor("coppermind-hero", (src, el) => this.renderHero(el, src));
    for (const [name, method] of [["coppermind-dashboard", "renderDashboard"], ["coppermind-nav", "renderNav"], ["coppermind-activity", "renderActivity"]]) {
      this.registerMarkdownCodeBlockProcessor(name, (src, el, ctx) => ctx.addChild(new LiveBlock(el, this, method)));
    }
    this.registerMarkdownPostProcessor((el, ctx) => this.addResolveButtons(el, ctx));

    this.scheduleRefresh = debounce(() => this.refresh(), 400, true);
    this.registerEvent(this.app.workspace.on("file-open", (file) => {
      if (file) this.currentPath = file.path;
      this.syncDashboardLeaves(true);
      this.renderViews();
    }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      this.syncDashboardLeaves(false);
      this.enforceReading(leaf);
    }));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.syncDashboardLeaves(false)));
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRefresh()));
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file, oldPath)));
    this.app.workspace.onLayoutReady(async () => {
      await this.migrateHome();
      this.syncDashboardLeaves(true);
      const f = this.app.workspace.getActiveFile();
      if (f) this.currentPath = f.path;
      this.refresh();
    });
  }

  onunload() {
    document.querySelectorAll(".cm-resolve-btn, .cm-ribbon-logo").forEach((e) => e.remove());
    document.body.classList.remove("cm-on-dashboard");
    document.querySelectorAll(".cm-dashboard-leaf, .cm-log-leaf, .cm-noprops-leaf").forEach((e) => e.classList.remove("cm-dashboard-leaf", "cm-log-leaf", "cm-noprops-leaf"));
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
    this.addCommand({ id: "open-dashboard", name: "Go to the Dashboard", hotkeys: [{ modifiers: ["Alt"], key: "h" }], callback: () => this.openDashboard() });
    this.addCommand({ id: "open-queue", name: "Open the review queue", hotkeys: [{ modifiers: ["Alt"], key: "q" }], callback: () => this.activateView() });
  }

  /* --- state --- */

  async refresh() {
    const items = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!this.isReviewable(f)) continue;
      const fm = this.fm(f);
      if (fm.status !== "draft" && fm.status !== "verified") continue;
      const flags = fm.status === "draft" ? parseFlags(await this.app.vault.cachedRead(f)) : [];
      items.push({ path: f.path, name: f.basename, group: groupOf(f.path), status: fm.status, flags, draftedOn: fm.drafted_on ? String(fm.drafted_on) : "" });
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

  renderHero(el, src) {
    el.empty();
    el.addClass("cm-hero");
    el.createSpan({ cls: "cm-logo cm-logo-hero" }).setAttr("aria-hidden", "true");
    const text = el.createDiv({ cls: "cm-hero-text" });
    text.createDiv({ cls: "cm-hero-title", text: "The Coppermind" });
    const tagline = String(src || "").trim();
    if (tagline) text.createDiv({ cls: "cm-hero-tagline", text: tagline });
    el.createDiv({ cls: "cm-hero-rule" });
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

    // stat tiles
    const tiles = el.createDiv({ cls: "cm-tiles" });
    const tile = (num, label, sub, cls) => {
      const t = tiles.createDiv({ cls: `cm-tile ${cls}` });
      t.createDiv({ cls: "cm-tile-num", text: String(num) });
      t.createDiv({ cls: "cm-tile-label", text: label });
      t.createDiv({ cls: "cm-tile-sub", text: sub });
    };
    tile(verified, "Verified", `of ${all.length} pages`, "cm-tile-verified");
    tile(drafts.length, "Drafts", stale.length ? `${stale.length} older than ${STALE_DAYS} days` : "waiting for review", "cm-tile-drafts");
    const breakdown = Object.entries(FLAG_KINDS)
      .map(([k, info]) => [info.short, drafts.reduce((n, i) => n + i.flags.filter((f) => f.kind === k).length, 0)])
      .filter(([, n]) => n > 0).map(([s, n]) => `${n} ${s}`).join(" · ");
    tile(flagCount, "Open flags", breakdown || "none", "cm-tile-flags");

    // progress + start
    const top = el.createDiv({ cls: "cm-dash-top" });
    progressBar(top.createDiv({ cls: "cm-dash-progress" }), verified, all.length);
    const btn = top.createEl("button", { cls: "mod-cta", text: drafts.length ? "Start reviewing" : "All verified" });
    btn.disabled = !drafts.length;
    btn.addEventListener("click", async () => { await this.activateView(); this.openNext(null); });

    // details
    const details = (key, title, openDefault, fill) => {
      const d = el.createEl("details", { cls: "cm-dash-details" });
      d.open = this.dashOpen[key] !== undefined ? this.dashOpen[key] : openDefault;
      d.createEl("summary", { text: title });
      d.addEventListener("toggle", () => { this.dashOpen[key] = d.open; });
      fill(d);
    };

    details("flags", `Open flags (${flagCount})`, true, (d) => {
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

    details("types", "By page type", false, (d) => {
      const groups = [...new Set(all.map((i) => i.group))].sort((a, b) => groupRank(a) - groupRank(b));
      const table = d.createEl("table", { cls: "cm-dash-table" });
      const head = table.createEl("tr");
      ["Page type", "Verified", "Drafts", "Open flags"].forEach((h) => head.createEl("th", { text: h }));
      groups.forEach((g) => {
        const inG = all.filter((i) => i.group === g);
        const tr = table.createEl("tr");
        tr.createEl("td", { text: g });
        tr.createEl("td", { text: String(inG.filter((i) => i.status === "verified").length) });
        tr.createEl("td", { text: String(inG.filter((i) => i.status === "draft").length) });
        tr.createEl("td", { text: String(inG.reduce((n, i) => n + i.flags.length, 0)) });
      });
    });

    details("stale", `Drafts older than ${STALE_DAYS} days (${stale.length})`, false, (d) => {
      if (!stale.length) { d.createDiv({ cls: "cm-sub", text: "None." }); return; }
      const row = d.createDiv();
      stale.forEach((i, idx) => { if (idx) row.appendText(" · "); this.linkTo(row, i); });
    });
  }

  guidesLink() {
    const f = this.app.vault.getAbstractFileByPath(INDEX_PATH);
    const cache = f instanceof TFile ? this.app.metadataCache.getFileCache(f) : null;
    const h = cache && (cache.headings || []).find((x) => /^Guides\b/.test(x.heading));
    return h ? `index#${h.heading}` : "index";
  }

  renderNav(el) {
    el.empty();
    el.addClass("cm-nav");
    const drafts = this.items.filter((i) => i.status === "draft").length;
    const open = (link) => () => this.app.workspace.openLinkText(link, "", false);
    const cards = [
      { icon: "list", title: "Index", sub: "Every page, by type", go: open("index") },
      { icon: "badge-check", title: "Review queue", sub: drafts ? `${drafts} drafts waiting` : "Nothing waiting", go: () => this.activateView() },
      { icon: "compass", title: "My Worldview", sub: "The convictions behind my views", go: open("My Worldview") },
      { icon: "scroll-text", title: "Log", sub: "Every change and decision", go: open("log") },
      { icon: "book-open", title: "Schema", sub: "The rulebook", go: open("SCHEMA") },
      { icon: "life-buoy", title: "Guides", sub: "How the vault works", go: open(this.guidesLink()) },
    ];
    cards.forEach((c) => {
      const card = el.createDiv({ cls: "cm-navcard" });
      card.setAttr("role", "button");
      card.setAttr("tabindex", "0");
      setIcon(card.createSpan({ cls: "cm-navcard-icon" }), c.icon);
      card.createDiv({ cls: "cm-navcard-title", text: c.title });
      card.createDiv({ cls: "cm-navcard-sub", text: c.sub });
      card.addEventListener("click", c.go);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.go(); } });
    });
  }

  async renderActivity(el) {
    const f = this.app.vault.getAbstractFileByPath(LOG_PATH);
    const entries = f instanceof TFile ? parseLog(await this.app.vault.cachedRead(f)).slice(-6).reverse() : [];
    el.empty();
    el.addClass("cm-activity");
    if (!entries.length) { el.createDiv({ cls: "cm-sub", text: "Nothing in the log yet." }); return; }
    const icons = { verify: "check", ingest: "download", setup: "wrench", schema: "file-pen", query: "search", "health-check": "stethoscope" };
    entries.forEach((e) => {
      const row = el.createDiv({ cls: "cm-act-row" });
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
      if (isDash && enforce) this.enforceReading(leaf);
      if (isLog && this.foldedViews.get(view) !== path) {
        this.foldedViews.set(view, path);
        setTimeout(() => this.foldLogEntries(view), 300);
      }
      if (!isLog) this.foldedViews.delete(view);
    });
    document.body.classList.toggle("cm-on-dashboard", this.isDashboard(ws.getActiveFile()));
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
      console.error("Coppermind Review: couldn't fold the log", e);
    }
  }

  /** The Dashboard always opens in Reading view. Every other note keeps whatever mode it was in. */
  async enforceReading(leaf) {
    const view = leaf && leaf.view;
    if (!(view instanceof MarkdownView) || !this.isDashboard(view.file) || view.getMode() !== "source") return;
    const state = leaf.getViewState();
    await leaf.setViewState({ ...state, state: { ...state.state, mode: "preview" } });
  }

  async openDashboard() {
    const f = this.dashboardFile();
    if (!f) { new Notice("Couldn't find Dashboard.md."); return; }
    const already = this.app.workspace.getLeavesOfType("markdown").find((l) => l.view.file && l.view.file.path === f.path);
    if (already) { this.app.workspace.setActiveLeaf(already, { focus: true }); return; }
    await this.app.workspace.getLeaf(false).openFile(f, { state: { mode: "preview" } });
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
      console.error("Coppermind Review: rename failed", e);
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
      console.error("Coppermind Review: couldn't update the startup page setting", e);
      new Notice("Couldn't update the startup page setting. In Settings → Homepage, choose Dashboard.", 10000);
    }
  }

  /* --- navigation --- */

  mainLeaf() {
    const cur = this.currentPath;
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    return leaves.find((l) => l.view.file && l.view.file.path === cur) || leaves[0] || this.app.workspace.getLeaf(false);
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
      new Notice("Coppermind Review only works on pages in Wiki/, Perspectives/, or Sources/Source Cards/.");
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
          });
          const indexed = await this.updateIndex(file.basename, "verify", date);
          await this.appendLog(verifyLogEntry({ name: file.basename, date, note, openFlags: flags, resolved }));
          delete this.resolved[file.path];
          await this.persist();
          new Notice(`Verified “${file.basename}”.` + (indexed ? "" : " It wasn't in index.md; add it by hand."), 5000);
          if (this.settings.autoAdvance) await this.openNext(file.path, order);
        } catch (e) {
          console.error("Coppermind Review: verify failed", e);
          new Notice(`Verify failed: ${e.message}. Check status, index.md and log.md.`, 10000);
        }
        this.scheduleRefresh();
      },
    }).open();
  }

  async reject(file) {
    const fm = this.precheck(file);
    if (!fm) return;
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
          console.error("Coppermind Review: reject failed", e);
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
