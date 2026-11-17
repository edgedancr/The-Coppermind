"use strict";
/*
 * Nicrosil for the Coppermind (v0.7)
 *
 * A nicrosil mind stores investiture and amplifies whoever draws on it. This plugin does the same for
 * the Coppermind: it holds the tools that make working in the vault faster. (Its folder and id are
 * still `coppermind-review`, so my settings, saved decisions, and hotkeys carry over.)
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
 *    logo button and Alt+H to go back to the Dashboard, and a one-time Home to Dashboard rename
 *  - "Log a schema change" (ribbon pen icon, or the command palette): asks for the new version number
 *    and what I changed, then adds the line to the Changelog at the bottom of SCHEMA.md and keeps its
 *    `version` and `updated` properties in step. It does not touch status, verified_on, or log.md.
 *
 * Verify: sets status: verified and verified_on, flips the page's entry in index.md,
 *         recomputes the totals, and appends to log.md.
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
const VIEW_TYPE = "coppermind-review-queue";
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
  if (!path.includes("/")) return "Vault files";
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

/* ---------- search (pure helpers, tested outside Obsidian) ---------- */

const SEARCH_LIMIT = 8;
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
    let snippet = "";
    if (r.bodyTokens.length) snippet = snippetAround(e, r.bodyTokens[0]);
    else snippet = e.lead;
    hits.push({ entry: e, score: r.score, aliasNote: r.aliasNote, snippet, tokens });
  }
  hits.sort((a, b) =>
    b.score - a.score ||
    (a.entry.status === "verified" ? 0 : 1) - (b.entry.status === "verified" ? 0 : 1) ||
    a.entry.name.length - b.entry.name.length ||
    a.entry.name.localeCompare(b.entry.name));
  return hits.slice(0, limit || SEARCH_LIMIT);
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

  search(q) { return searchEntries(this.entries.values(), q, SEARCH_LIMIT); }
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
    const tokens = tokenize(this.query);
    if (!tokens.length) {
      list.createDiv({ cls: "cm-search-empty", text: "Keep typing…" });
      return;
    }
    if (!this.hits.length) {
      list.createDiv({ cls: "cm-search-empty", text: `No pages match “${this.query.trim()}”.` });
    }
    this.hits.forEach((h, i) => {
      const e = h.entry;
      const card = list.createDiv({ cls: "cm-search-card" + (i === this.active ? " is-active" : "") });
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
    });
    const foot = list.createDiv({ cls: "cm-search-foot" });
    const link = foot.createSpan({ cls: "cm-search-more", text: "Search everything, including class notes ↗", attr: { role: "button", tabindex: "0" } });
    const go = () => this.searchAll();
    link.addEventListener("click", go);
    link.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); go(); } });
  }

  marked(el, text, tokens) {
    for (const part of highlight(text, tokens)) {
      if (part.hit) el.createEl("mark", { text: part.t });
      else el.appendText(part.t);
    }
  }

  setActive(i, scroll) {
    if (i === this.active) return;
    this.active = i;
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

module.exports = class NicrosilForTheCoppermind extends Plugin {
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
    this.addSettingTab(new ReviewSettings(this.app, this));
    this.registerCommands();

    this.statusEl = this.addStatusBarItem();
    this.statusEl.addClass("cm-status", "mod-clickable");
    this.statusEl.setAttr("aria-label", "Open the review queue");
    this.statusEl.addEventListener("click", () => this.activateView());

    addIcon("coppermind-logo", LOGO_ICON);
    this.ribbonEl = this.addRibbonIcon("coppermind-logo", "Dashboard (Alt+H)", () => this.openDashboard());
    this.ribbonEl.addClass("cm-ribbon-logo");
    this.addRibbonIcon("file-pen", "Log a schema change", () => this.openSchemaLog());

    this.registerMarkdownCodeBlockProcessor("coppermind-hero", (src, el) => this.renderHero(el, src));
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
      if (file) this.currentPath = file.path;
      this.syncDashboardLeaves(true);
      this.renderViews();
    }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      this.syncDashboardLeaves(false);
      this.enforceReading(leaf);
    }));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.syncDashboardLeaves(false)));
    this.registerEvent(this.app.metadataCache.on("changed", () => { this.scheduleRefresh(); this.syncDashboardLeaves(false); }));
    this.registerEvent(this.app.metadataCache.on("resolved", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file, oldPath)));
    this.app.workspace.onLayoutReady(async () => {
      this.searchIndex.start();
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
    document.querySelectorAll(".cm-dashboard-leaf, .cm-log-leaf, .cm-noprops-leaf, .cm-strip-leaf, .cm-props-open").forEach((e) => e.classList.remove("cm-dashboard-leaf", "cm-log-leaf", "cm-noprops-leaf", "cm-strip-leaf", "cm-props-open"));
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
    this.addCommand({ id: "open-dashboard", name: "Go to the Dashboard", hotkeys: [{ modifiers: ["Alt"], key: "h" }], callback: () => this.openDashboard() });
    this.addCommand({ id: "log-schema-change", name: "Log a schema change", callback: () => this.openSchemaLog() });
    this.addCommand({ id: "open-queue", name: "Open the review queue", hotkeys: [{ modifiers: ["Alt"], key: "q" }], callback: () => this.activateView() });
  }

  /* --- schema changelog --- */

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
          });
          const indexed = await this.updateIndex(file.basename, "verify", date);
          await this.appendLog(verifyLogEntry({ name: file.basename, date, note, openFlags: flags, resolved }));
          delete this.resolved[file.path];
          await this.persist();
          new Notice(`Verified “${file.basename}”.` + (indexed || !file.path.includes("/") ? "" : " It wasn't in index.md; add it by hand."), 5000);
          if (this.settings.autoAdvance) await this.openNext(file.path, order);
        } catch (e) {
          console.error("Nicrosil: verify failed", e);
          new Notice(`Verify failed: ${e.message}. Check status, index.md and log.md.`, 10000);
        }
        this.scheduleRefresh();
      },
    }).open();
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
