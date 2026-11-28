/* ---------- Triage dashboard and ingest tabs (4.4.0) ---------- */
/*
 * Triage (Alt+I, and the Triage card on the Dashboard) lists every source in Ingestion/Raw, newest first, and keeps itself up to
 * date as files come and go. Nicrosil, not Claude, looks in Raw: it reads only the names, types and sizes, and decides from those
 * whether each source already has a text copy, needs one, is an image or is empty. I tick the sources I want, pick the model,
 * effort and mode, and press Ingest. Each source then gets an ingest tab: Nicrosil copies that one file to Ingestion/.selected/
 * (a hidden folder), and Claude Code ingests it by SCHEMA - Ingest with Raw still closed to it. Claude may write only where an
 * ingest writes (Wiki, Sources, the log, the topic list) and run only the two tools the ingest uses. Claude names where the source
 * goes (`source_to`); once the drafts are written, Nicrosil itself moves the original from Raw to Sources/ under that name, with its
 * text copy (4.7.0). The copy in .selected is removed when the drafts are written or the tab is closed. Desktop only.
 */
const TRIAGE_VIEW_TYPE = "nicrosil-triage";
const INGEST_VIEW_TYPE = "nicrosil-ingest";
const RAW_DIR = "Ingestion/Raw/";
const INGEST_STAGE_DIR = "Ingestion/.selected";
const TEXT_COPY_SUFFIX = " (text).md";
const CONVERTIBLE_EXT = ["pdf", "docx", "doc", "pptx", "ppt", "xlsx", "xls", "html", "htm"]; // what Tools/source-to-text reads
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "heic", "tif", "tiff", "bmp"];
const INGEST_MODES = [["plan", "Plan first"], ["draft", "Draft directly"]];
const SOURCE_FOLDERS = ["Readings", "Class Notes", "My Work"]; // where an ingested original may be moved to, under Sources/
/** Sent with an approved plan (4.6.4): a verified page left ticked is approved for editing, so its change gets made, not just proposed. */
const INGEST_VERIFIED_OK = "These verified pages are approved for the change you proposed. Make each change now, by SCHEMA - Review (Changing a verified page): set status: draft, keep verified_on, and add a changes_since_verified line. Don't leave them as before/afters:";
const INGEST_DENY = [
  "Read(./Ingestion/Raw/**)", "Read(./The Tinmind/**)", "Read(./.obsidian/**)", "Read(./.git/**)",
  "Edit(./Ingestion/**)", "Edit(./The Tinmind/**)", "Edit(./SCHEMAS/**)", "Edit(./_AGENTS.md)", "Edit(./CLAUDE.md)", "Edit(./_index.md)",
  "Edit(./Perspectives/**)", "Edit(./Tools/**)", "Edit(./_templates/**)", "Edit(./_changelogs/**)", "Edit(./Health Checks/**)",
  "Edit(./Sources/Scans/**)", "Edit(./.obsidian/**)", "Edit(./.git/**)",
];
const INGEST_ALLOW = [
  "Read", "Glob", "Grep", "Write", "Edit",
  "Bash(python Tools/source-to-text/source_to_text.py:*)", "Bash(python Tools/health-check/coppermind_check.py:*)",
];
const NEW_HOURS = 24; // a file added within this many hours gets the NEW mark

/**
 * The Triage list, worked out from file records ({ path, name, basename, extension, size, ctime }) alone; nothing is opened.
 * Text copies in Raw are folded into their original rather than listed. A source counts as having a text copy when
 * "<name> (text).md" sits in Raw or anywhere in Sources/; "in Sources" means a file of the same name is already there.
 */
function triageEntries(files, now) {
  const raw = files.filter((f) => f.path.startsWith(RAW_DIR) && !f.path.slice(RAW_DIR.length).startsWith("."));
  const known = files.filter((f) => f.path.startsWith(RAW_DIR) || f.path.startsWith("Sources/"));
  const copies = new Set(known.filter((f) => f.name.endsWith(TEXT_COPY_SUFFIX)).map((f) => f.name.slice(0, -TEXT_COPY_SUFFIX.length).toLowerCase()));
  const inSources = new Set(files.filter((f) => f.path.startsWith("Sources/")).map((f) => f.name.toLowerCase()));
  return raw.filter((f) => !f.name.endsWith(TEXT_COPY_SUFFIX)).map((f) => {
    const ext = String(f.extension || "").toLowerCase();
    let status;
    if (!f.size) status = "empty";
    else if (ext === "md" || ext === "txt") status = "text";
    else if (CONVERTIBLE_EXT.includes(ext)) status = copies.has(String(f.basename).toLowerCase()) ? "ready" : "convert";
    else if (IMAGE_EXT.includes(ext)) status = "image";
    else status = "unknown";
    return {
      path: f.path, name: f.name, ext, size: f.size, ctime: f.ctime, status,
      isNew: now - f.ctime < NEW_HOURS * 3600 * 1000,
      inSources: inSources.has(String(f.name).toLowerCase()),
    };
  }).sort((a, b) => b.ctime - a.ctime || a.name.localeCompare(b.name));
}

const TRIAGE_STATUS = {
  ready: { label: "Text copy ready", cls: "is-ready", note: "has a text copy" },
  text: { label: "Already text", cls: "is-ready", note: "already text" },
  convert: { label: "Needs text copy", cls: "is-convert", note: "needs a text copy, made with Tools/source-to-text once it is in Sources/ (a scanned PDF is read with OCR)" },
  image: { label: "Image", cls: "is-image", note: "an image; the text tool doesn't read images, so read it directly" },
  unknown: { label: "Unknown type", cls: "is-unknown", note: "a file type the text tool doesn't know; say in the report if it can't be read" },
  empty: { label: "Empty file", cls: "is-empty", note: "empty" },
};

function fileSize(n) {
  if (!n) return "0 bytes";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function addedWhen(ms, now) {
  const mins = Math.round((now - ms) / 60000);
  if (mins < 1) return "added just now";
  if (mins < 60) return `added ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `added ${hrs} h ago`;
  if (hrs < 48) return "added yesterday";
  const d = new Date(ms);
  return `added ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Where Claude says an ingested source goes: "Readings/Some Name (2020).pdf" (or with a leading "Sources/"). Returns { folder, name, path },
 * or null when it isn't one of the allowed subfolders of Sources/ plus a plain file name. The extension is always the original's.
 */
function sourceDestination(to, rawPath) {
  const t = String(to || "").trim().replace(/\\/g, "/").replace(/^\.?\/+/, "").replace(/^Sources\//i, "");
  const parts = t.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const folder = SOURCE_FOLDERS.find((f) => f.toLowerCase() === parts[0].toLowerCase());
  if (!folder) return null;
  const orig = String(rawPath || "").split("/").pop();
  const dot = orig.lastIndexOf(".");
  const ext = dot > 0 ? orig.slice(dot) : "";
  let name = parts[1].replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
  if (ext && name.toLowerCase().endsWith(ext.toLowerCase())) name = name.slice(0, -ext.length).trim();
  if (!name || name.startsWith(".")) return null;
  name += ext;
  return { folder, name, path: `Sources/${folder}/${name}` };
}

/** Takes the ```nicrosil-plan block out of an ingest reply: { plan, rest }. plan is null when there is none or it isn't JSON. */
function parseIngestPlan(text) {
  const src = String(text || "");
  const m = /```nicrosil-plan[^\n]*\n([\s\S]*?)```/.exec(src);
  if (!m) return { plan: null, rest: src };
  const rest = (src.slice(0, m.index) + src.slice(m.index + m[0].length)).trim();
  let p;
  try { p = JSON.parse(m[1]); } catch (e) { return { plan: null, rest }; }
  if (!p || typeof p !== "object") return { plan: null, rest };
  const str = (v) => (v == null ? "" : String(v).trim());
  const items = (Array.isArray(p.items) ? p.items : []).filter((i) => i && str(i.title)).map((i, n) => ({
    id: str(i.id) || String(n + 1), kind: str(i.kind).toLowerCase(), title: bareLink(str(i.title)), summary: str(i.summary), from: str(i.from), add: str(i.add), verified: !!i.verified,
  }));
  const questions = (Array.isArray(p.questions) ? p.questions : []).map((q) => (typeof q === "string" ? { q, options: [] } : { q: str(q && q.q), options: asList(q && q.options) })).filter((q) => q.q);
  return { plan: { items, questions, skipped: asList(p.skipped), notes: str(p.notes), sourceTo: str(p.source_to) }, rest };
}

/** The Triage tab: every source in Raw, the filter tabs, the queue, model, effort and mode, and the two Ingest buttons. */
class TriageView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.selected = new Set(); // paths
    this.filter = "all";
  }
  getViewType() { return TRIAGE_VIEW_TYPE; }
  getDisplayText() { return "Triage"; }
  getIcon() { return "list-checks"; }

  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("cm-tri-view");
    this.wrap = this.contentEl.createDiv({ cls: "cm-tri" });
    listenUsage(this, () => redrawUsage(this));
    this.render();
    this.registerInterval(window.setInterval(() => this.render(), 60000)); // keeps "added 5 min ago" and NEW true
  }

  render() {
    if (!this.wrap) return;
    const now = Date.now();
    const st = this.plugin.settings;
    const all = this.plugin.rawEntries(now);
    const live = new Set(all.map((e) => e.path));
    [...this.selected].forEach((p) => { if (!live.has(p)) this.selected.delete(p); }); // a file that left Raw leaves the queue
    const tests = {
      all: () => true,
      ready: (e) => e.status === "ready" || e.status === "text",
      work: (e) => ["convert", "image", "unknown", "empty"].includes(e.status),
      new: (e) => e.isNew,
    };
    const shown = all.filter(tests[this.filter] || tests.all);
    const chosen = all.filter((e) => this.selected.has(e.path));
    const w = this.wrap;
    const keepScroll = w.querySelector(".cm-tri-list");
    const top = keepScroll ? keepScroll.scrollTop : 0;
    w.empty();

    // header: the title, the watch line, and the counts
    const head = w.createDiv({ cls: "cm-tri-head" });
    const left = head.createDiv();
    left.createEl("h1", { cls: "cm-tri-title cm-gradient-style", text: "Triage" });
    const watch = left.createDiv({ cls: "cm-tri-watch" });
    watch.createSpan({ cls: "cm-tri-pulse" });
    const last = all.length ? Math.max(...all.map((e) => e.ctime)) : 0;
    watch.createSpan({ text: `Watching ${RAW_DIR.replace(/\/$/, "")} · updates on its own${last ? ` · last file ${addedWhen(last, now).replace(/^added /, "")}` : ""}` });
    const stats = head.createDiv({ cls: "cm-tri-stats" });
    const stat = (n, label, cls) => {
      const s = stats.createDiv({ cls: "cm-tri-stat" });
      s.createDiv({ cls: "cm-tri-num " + (cls || "cm-gradient-style"), text: String(n) });
      s.createDiv({ cls: "cm-tri-statlabel", text: label });
    };
    stat(all.length, "In Raw");
    stat(all.filter((e) => e.isNew).length, "New today", "is-amber");
    stat(chosen.length, "Selected");

    const body = w.createDiv({ cls: "cm-tri-body" });
    const main = body.createDiv({ cls: "cm-tri-main" });

    // filter tabs and select / clear
    const bar = main.createDiv({ cls: "cm-tri-bar" });
    const tabs = bar.createDiv({ cls: "cm-tri-tabs" });
    [["all", "All"], ["ready", "Text ready"], ["work", "Needs work"], ["new", "New"]].forEach(([k, label]) => {
      const b = tabs.createEl("button", { cls: "cm-tri-tab" + (this.filter === k ? " is-on" : "") });
      b.setAttr("aria-pressed", this.filter === k ? "true" : "false");
      b.createSpan({ text: label });
      b.createSpan({ cls: "cm-tri-tabn", text: String(all.filter(tests[k]).length) });
      b.addEventListener("click", () => { this.filter = k; this.render(); });
    });
    const acts = bar.createDiv({ cls: "cm-tri-acts" });
    const selAll = acts.createEl("button", { cls: "cm-tri-link", text: "Select all shown" });
    selAll.addEventListener("click", () => { shown.forEach((e) => { if (e.status !== "empty") this.selected.add(e.path); }); this.render(); });
    const clear = acts.createEl("button", { cls: "cm-tri-link is-mute", text: "Clear" });
    clear.addEventListener("click", () => { this.selected.clear(); this.render(); });

    // the list
    const list = main.createDiv({ cls: "cm-tri-list" });
    if (!all.length) list.createDiv({ cls: "cm-tri-empty", text: `Nothing is waiting. Put a source in ${RAW_DIR.replace(/\/$/, "")} and it shows up here.` });
    else if (!shown.length) list.createDiv({ cls: "cm-tri-empty", text: "No sources match this filter." });
    shown.forEach((e) => {
      const on = this.selected.has(e.path);
      const off = e.status === "empty";
      const row = list.createEl("button", { cls: "cm-tri-row" + (on ? " is-on" : "") + (off ? " is-off" : "") });
      row.setAttr("aria-pressed", on ? "true" : "false");
      if (off) row.setAttr("aria-disabled", "true");
      row.createSpan({ cls: "cm-tri-box" });
      const txt = row.createSpan({ cls: "cm-tri-text" });
      txt.createSpan({ cls: "cm-tri-name", text: e.name });
      txt.createSpan({ cls: "cm-tri-meta", text: `${e.ext || "file"} · ${fileSize(e.size)} · ${addedWhen(e.ctime, now)}` });
      if (e.isNew) row.createSpan({ cls: "cm-tri-chip is-new", text: "New" });
      if (e.inSources) row.createSpan({ cls: "cm-tri-chip is-insources", text: "Already in Sources" });
      const s = TRIAGE_STATUS[e.status];
      row.createSpan({ cls: "cm-tri-chip " + s.cls, text: s.label });
      row.addEventListener("click", () => {
        if (off) { new Notice("This file is empty (0 bytes). Download it again, then it can be ingested."); return; }
        if (on) this.selected.delete(e.path); else this.selected.add(e.path);
        this.render();
      });
    });
    if (keepScroll) list.scrollTop = top;

    // the queue and the run settings
    const side = body.createDiv({ cls: "cm-tri-side" });
    side.createEl("h2", { cls: "cm-tri-qtitle cm-gradient-style", text: "Ingest queue" });
    if (!chosen.length) side.createDiv({ cls: "cm-tri-hint", text: "Click sources on the left to add them. They run top to bottom, in the order the list shows." });
    const q = side.createDiv({ cls: "cm-tri-queue" });
    chosen.forEach((e, i) => {
      const r = q.createDiv({ cls: "cm-tri-qrow" });
      r.createSpan({ cls: "cm-tri-qn", text: String(i + 1) });
      const t = r.createSpan({ cls: "cm-tri-qtext" });
      t.createSpan({ cls: "cm-tri-qname", text: e.name });
      t.createSpan({ cls: "cm-tri-meta", text: TRIAGE_STATUS[e.status].label });
      const x = r.createEl("button", { cls: "cm-tri-qx", attr: { "aria-label": `Remove ${e.name} from the queue` } });
      setIcon(x, "x");
      x.addEventListener("click", () => { this.selected.delete(e.path); this.render(); });
    });

    const model = st.ingestModel || "sonnet";
    const effort = st.ingestEffort || "medium";
    const mode = st.ingestMode || "plan";
    const seg = (label, opts, value, key, disabled) => {
      side.createDiv({ cls: "cm-tri-flabel", text: label });
      const g = side.createDiv({ cls: "cm-tri-seg" + (disabled ? " is-off" : "") });
      opts.forEach(([k, name]) => {
        const b = g.createEl("button", { cls: "cm-tri-segbtn" + (!disabled && value === k ? " is-on" : ""), text: name });
        b.setAttr("aria-pressed", !disabled && value === k ? "true" : "false");
        if (disabled) b.setAttr("disabled", "true");
        b.addEventListener("click", async () => { st[key] = k; await this.plugin.persist(); this.render(); });
      });
      return g;
    };
    seg("Model", QUERY_MODELS, model, "ingestModel", false);
    seg("Effort", QUERY_EFFORTS, effort, "ingestEffort", model === "haiku");
    side.createDiv({ cls: "cm-tri-hint", text: model === "haiku" ? "Haiku runs without an effort setting." : "Applies to every source in the run." });
    seg("Mode", INGEST_MODES, mode, "ingestMode", false);
    side.createDiv({ cls: "cm-tri-hint", text: mode === "plan" ? "Claude proposes the pages first and waits for your go-ahead in the tab." : "Claude drafts the pages straight away and gives you the report." });
    const focusId = "cm-tri-focus";
    side.createEl("label", { cls: "cm-tri-flabel", text: "What matters (optional)", attr: { for: focusId } });
    const focus = side.createEl("input", { cls: "cm-tri-input", attr: { id: focusId, type: "text", placeholder: "Same note for every source in this run" } });
    focus.value = this.focus || "";
    focus.addEventListener("input", () => { this.focus = focus.value; });

    side.createDiv({ cls: "cm-tri-note", text: "Claude sees only the sources you pick. Each one opens its own ingest tab; the drafts go to the review queue, and nothing is verified until you verify it." });
    const grow = side.createDiv({ cls: "cm-tri-grow" });
    mountUsageButton(this, grow, { up: true }); // 4.6.3: a Usage button in the spare space above the Ingest buttons
    const go = side.createEl("button", { cls: "cm-tri-go", text: chosen.length ? `Ingest ${chosen.length} as a batch` : "Ingest as a batch" });
    const one = side.createEl("button", { cls: "cm-tri-one", text: "One at a time, review between" });
    if (!chosen.length) { go.setAttr("disabled", "true"); one.setAttr("disabled", "true"); }
    const start = (auto) => {
      if (!chosen.length) return;
      this.plugin.startIngest(chosen, { model, effort, mode, focus: (this.focus || "").trim(), auto });
      this.selected.clear();
      this.render();
    };
    go.addEventListener("click", () => start(true));
    one.addEventListener("click", () => start(false));
  }
}

/** One source's ingest: Query mode's runner and answer page, with ingest rules, wider tools, and its own side panel. */
class IngestView extends QueryView {
  constructor(leaf, plugin) {
    super(leaf, plugin);
    this.staged = null; // the copy in Ingestion/.selected, while the run needs it
    this.drafted = false;
    this.reported = false; // told the plugin the first turn finished
  }
  getViewType() { return INGEST_VIEW_TYPE; }
  getDisplayText() { return this.q ? `Ingest · ${this.q.entry.name}`.slice(0, 70) : "Ingest"; }
  getIcon() { return "file-input"; }

  async onOpen() {
    await super.onOpen();
    listenUsage(this, () => redrawUsage(this));
    if (!this.q) { this.wrap.empty(); this.wrap.createDiv({ cls: "cm-query-note", text: "This ingest tab was left from an earlier session, so its run is gone. Start it again from Triage." }); }
  }

  async onClose() {
    this.stop();
    await this.unstage();
  }

  async begin(q) {
    this.q = Object.assign({ question: q.entry.name, depth: "standard" }, q);
    this.sessionId = newUuid();
    this.leaf.updateHeader && this.leaf.updateHeader();
    try {
      this.staged = await this.plugin.stageForIngest(q.entry.path);
    } catch (e) {
      this.wrap.empty();
      this.drawHeader(this.wrap, "Couldn't start");
      this.wrap.createDiv({ cls: "cm-query-error", text: "Nicrosil couldn't copy the source for Claude: " + (e.message || e) });
      this.report();
      return;
    }
    this.run(this.firstMessage(), false);
  }

  async unstage() {
    if (!this.staged) return;
    const p = this.staged;
    this.staged = null;
    await this.plugin.unstageIngest(p);
  }

  /** Tells the plugin this source's first turn is over, once, so a batch can start the next source. */
  report() {
    if (this.reported) return;
    this.reported = true;
    this.plugin.ingestTurnDone(this);
  }

  ui(followUp) {
    return {
      label: followUp ? "Working on your reply" : "Ingesting",
      working: followUp ? "Carrying on with the ingest…" : (this.q.mode === "plan" ? "Reading and planning…" : "Reading and drafting…"),
      sub: "Claude writes drafts only. Nothing becomes final until you verify it.",
      foot: "The bar is an estimate: files read and written",
      cancel: "Cancel ingest",
      cap: 30,
    };
  }

  argsFor({ model, effort, sessionId, resume }) {
    const a = ["-p", "--output-format", "stream-json", "--verbose", "--model", model];
    if (effort && model !== "haiku") a.push("--effort", effort);
    a.push("--tools", "Read,Glob,Grep,Write,Edit,Bash", "--allowedTools", ...INGEST_ALLOW, "--permission-mode", "dontAsk", "--max-turns", "200");
    a.push("--disallowedTools", ...INGEST_DENY);
    if (resume) a.push("--resume", resume); else if (sessionId) a.push("--session-id", sessionId);
    return a;
  }

  firstMessage() { return "Ingest this source."; }
  answerLabel() { return this.drafted ? "Drafts written" : "Ingest report"; }
  metaMissingNote() { return "Claude didn't end with the status block, so the side panel may be incomplete. The report above is still complete."; }

  promptFor(question, followUp) {
    const meta = [
      "",
      "End your reply with this block and nothing after it (valid JSON):",
      "```nicrosil-meta",
      '{"stage": "plan|drafted|stopped", "copied_to": "Sources/... (the copy you made, or empty)", "source_card": "Name of the source card, or empty", "source_to": "Readings/Author - Title (Year).ext (where the original goes in Sources/)", "created": ["Page"], "appended": ["Page"], "edited_verified": ["Verified page you changed (now draft)"], "proposed": ["Verified page with a change you proposed but did NOT make"], "typed_links": [{"from": "Page the link is on", "type": "counters", "to": "Target page", "why": "One line: where the source says it, or the words it is inferred from", "inferred": false, "verified": false}], "flags": 0, "summary": "One line on what this ingest did"}',
      "```",
      "`typed_links` lists every typed link you added in this ingest so far, the same ones as report section D: `inferred` is true for an inferred link, `verified` true when adding it set a verified page back to draft. Empty when none. Nicrosil shows them in the tab, where Harrison can remove any.", // 4.8.0
    ];
    const plan = [
      "",
      "Whenever this reply proposes a plan (or a changed plan), put it, before the nicrosil-meta block, in this block too (valid JSON), so Nicrosil can draw it as cards:",
      "```nicrosil-plan",
      '{"items": [{"id": "1", "kind": "card|summary|new|update", "title": "Page title", "summary": "One line on what the draft holds", "from": "Where in the source (pages, chapter, date)", "add": "For an update: the gist of what is added, else empty", "verified": false}], "questions": [{"q": "A question only Harrison can settle", "options": ["Yes", "No"]}], "skipped": ["What you leave out, and why, in a few words"], "notes": "One line: topic list and anything else he should know", "source_to": "Readings/Author - Title (Year).ext"}',
      "```",
      "Keep the prose plan short beside it: the cards are what he reads.",
    ];
    if (followUp) return [`Harrison's reply, in the same ingest: ${question}`, "", "Carry on by SCHEMA - Ingest. Give the report sections that changed, and a new nicrosil-meta block.", "In nicrosil-meta, `edited_verified` lists every verified page changed in this ingest so far and `proposed` every verified-page change still not made (empty when none).", ...plan, ...meta].join("\n");
    const e = this.q.entry;
    const staged = this.staged;
    const s = TRIAGE_STATUS[e.status] || TRIAGE_STATUS.unknown;
    return [
      "This is an ingest from Nicrosil's Triage dashboard. Harrison picked this source in Ingestion/Raw and asked for it to be ingested.",
      "",
      "First read `_AGENTS.md`, then `SCHEMAS/SCHEMA - Ingest.md` and `SCHEMAS/SCHEMA - Writing Pages.md`, and ingest by those rules.",
      "",
      "The inputs (SCHEMA - Ingest, Think):",
      `- SOURCE: \`${e.path}\` (the original in Raw). Nicrosil copied it unchanged to \`${staged}\` for this run. Read that copy; Ingestion/Raw itself stays closed to you, as the rules say.`,
      "- SCOPE: the whole source.",
      `- WHAT MATTERS: ${this.q.focus || "not given; use the course it belongs to and your judgment, and say which reading you took."}`,
      `- MODE: ${this.q.mode === "plan" ? "plan first" : "draft directly"}.`,
      ...(this.q.mode === "plan" ? [
        "- VERIFIED PAGES: propose changes only in the plan. Put each verified page you would change in the plan as an item with `\"verified\": true` and the gist of the change in `add`.",
        "  When Harrison approves the plan, every verified page he leaves ticked is his request for that change (VERIFIED PAGES becomes \"edit\" for those pages only): make it while drafting, by SCHEMA - Review (Changing a verified page). Never leave an approved change as a before/after.",
      ] : [
        "- VERIFIED PAGES: propose changes only. Give each as a before/after in the report, and list each such page under `proposed` in the nicrosil-meta block so Nicrosil can show that it hasn't been made.",
      ]),
      "- Typed links are the exception (SCHEMA - Ingest, step 4): add them directly, on verified pages too, stated and inferred alike, and list them under `typed_links`.", // 4.8.0
      "",
      `Nicrosil's check of the file: it is ${s.note}.${e.inSources ? " A file with the same name is already in Sources/; check its source card's Ingest Progress before doing anything twice." : ""}`,
      "",
      "How this differs from a chat ingest (Harrison designed it this way):",
      `- Orient: don't copy or move the source yourself. Nicrosil moves the original from Ingestion/Raw into Sources/ once the drafts are written. Choose where it goes first: a subfolder of Sources/ (${SOURCE_FOLDERS.map((f) => "\`" + f + "\`").join(", ")}) and a file name in the vault's style, \`Author - Title (Year)\` plus the original's extension. Cite the source by that name and path everywhere (wiki citations, the source card's \`file:\` property) as if it were already there, and give the same \`<subfolder>/<file name>\` as \`source_to\` in the nicrosil-plan block and in the nicrosil-meta block. If it needs a text copy, make it from the staged copy with \`python Tools/source-to-text/source_to_text.py "${staged}"\`; it appears beside the staged copy, and Nicrosil moves it into Sources/ with the original, renamed to match.`,
      "- This source didn't come from Ingestion/Triage.md, so leave that file alone.",
      "- Harrison reads your reply in an ingest tab and answers in its reply box, which continues this session. In plan-first mode, stop after the plan (sections A–C of the report) and wait for him.",
      "- When the drafts are written, add the `ingest` log entry yourself, by _AGENTS.md, with **Verify:** pending Harrison's review. Don't log the plan on its own. List verified pages you changed as `Changed (verified → draft): [[Page]]`, and any change you proposed but did not make as `Proposed, NOT made: [[Page]]`.",
      "- Don't tell him to delete or move the original: Nicrosil moves it and reports where it went. If it can't (the name is taken, say), Nicrosil tells him.",
      "- Write the report in Markdown with its sections as `##` headings. Don't start with a `# Title` line.",
      ...plan,
      ...meta,
    ].join("\n");
  }

  drawHeader(w, label) {
    const head = w.createDiv({ cls: "cm-query-head" });
    head.createDiv({ cls: "cm-query-label", text: label });
    head.createDiv({ cls: "cm-query-title cm-draft-title-style", text: this.q.entry.name });
    const chips = head.createDiv({ cls: "cm-query-chips" });
    const name = (list, k) => (list.find((x) => x[0] === k) || [k, k])[1];
    chips.createSpan({ cls: "cm-query-chip", text: name(QUERY_MODELS, this.q.model) });
    if (this.q.model !== "haiku") chips.createSpan({ cls: "cm-query-chip", text: `${name(QUERY_EFFORTS, this.q.effort)} effort` });
    chips.createSpan({ cls: "cm-query-chip", text: name(INGEST_MODES, this.q.mode) });
    if (this.q.batch) chips.createSpan({ cls: "cm-query-chip is-type", text: `${this.q.batch.n} of ${this.q.batch.of}` });
    mountUsageButton(this, chips, { cls: "cm-ingest-usagewrap" }); // 4.6.3
    return head;
  }

  async answered(question, text, followUp, ev) {
    const parsed = parseQueryReply(text);
    const { meta, metaOk } = parsed;
    const { plan, rest } = parseIngestPlan(parsed.answer);
    this.turns.push({ question, answer: rest, meta, followUp, plan });
    this.planOff = new Set(); this.planAnswers = {};
    if (ev && ev.usage) this.plugin.noteRun(ev);
    if (meta.stage === "drafted") {
      this.drafted = true;
      if (!this.moved) this.moved = await this.plugin.moveIngestSource(this.q.entry.path, this.staged, meta.source_to); // 4.7.0
      await this.unstage(); this.plugin.scheduleRefresh && this.plugin.scheduleRefresh(); }
    this.drawAnswer(metaOk);
    this.report();
  }

  cancelled(followUp) { super.cancelled(followUp); this.report(); }
  failed(msg, followUp) { super.failed(msg, followUp); this.report(); }

  /** A plan comes back as cards (4.4.0): the plan board. Anything else, or a plan without its block, is drawn as text, as before. */
  drawAnswer(metaOk, note) {
    const last = this.turns[this.turns.length - 1];
    if (!last || !last.plan || last.meta.stage !== "plan" || this.drafted) return super.drawAnswer(metaOk, note);
    const w = this.wrap;
    w.empty();
    const board = w.createDiv({ cls: "cm-plan" });
    const head = this.drawHeader(board, "Ingest plan · waiting for your go-ahead");
    const steps = head.createDiv({ cls: "cm-plan-steps" });
    ["Orient", "Read", "Plan", "Draft", "Link", "Topics"].forEach((t, i) => {
      if (i) steps.createSpan({ cls: "cm-plan-stepline" });
      steps.createSpan({ cls: "cm-plan-step" + (i < 2 ? " is-done" : i === 2 ? " is-now" : ""), text: t });
    });
    if (note) board.createDiv({ cls: "cm-query-note", text: note });
    const plan = last.plan;
    const items = plan.items;
    const layout = board.createDiv({ cls: "cm-plan-layout" });
    const main = layout.createDiv({ cls: "cm-plan-main" });
    const counts = {};
    items.forEach((i) => { counts[i.kind] = (counts[i.kind] || 0) + 1; });
    const kindName = { card: "source card", summary: "summary", new: "new page", update: "update" };
    main.createDiv({ cls: "cm-plan-count", text: `${items.length} draft${items.length === 1 ? "" : "s"} proposed` + (items.length ? ": " + Object.keys(counts).map((k) => `${counts[k]} ${kindName[k] || k}${counts[k] > 1 && k !== "summary" ? "s" : ""}`).join(" · ") : "") });
    const groups = [["Source", ["card"]], ["New pages", ["summary", "new"]], ["Updates to existing pages", ["update"]], ["Other", null]];
    const placed = new Set();
    let approve;
    const sync = () => { const n = items.length - this.planOff.size; approve.setText(n === items.length ? `Approve ${n} and draft` : `Approve ${n} of ${items.length} and draft`); approve.toggleAttribute("disabled", n === 0); };
    groups.forEach(([title, kinds]) => {
      const list = items.filter((i) => !placed.has(i) && (kinds ? kinds.includes(i.kind) : true));
      if (!list.length) return;
      list.forEach((i) => placed.add(i));
      main.createDiv({ cls: "cm-plan-group cm-gradient-style", text: title });
      list.forEach((i) => {
        const row = main.createDiv({ cls: "cm-plan-row" + (this.planOff.has(i.id) ? " is-off" : "") });
        const id = "cmp-" + Math.random().toString(36).slice(2, 8);
        const box = row.createEl("input", { cls: "cm-plan-check", attr: { type: "checkbox", id } });
        box.checked = !this.planOff.has(i.id);
        const body = row.createDiv({ cls: "cm-plan-body" });
        const top = body.createDiv({ cls: "cm-plan-top" });
        top.createEl("label", { cls: "cm-plan-title", text: i.title, attr: { for: id } });
        top.createSpan({ cls: "cm-plan-kind is-" + (kindName[i.kind] ? i.kind : "other"), text: kindName[i.kind] || i.kind || "draft" });
        if (i.verified) top.createSpan({ cls: "cm-plan-kind is-verified", text: "verified → draft" });
        top.createSpan({ cls: "cm-plan-grow" });
        if (i.from) top.createSpan({ cls: "cm-plan-from", text: i.from });
        if (i.summary) body.createDiv({ cls: "cm-plan-summary", text: i.summary });
        if (i.add) body.createDiv({ cls: "cm-plan-add", text: i.add });
        box.addEventListener("change", () => {
          if (box.checked) this.planOff.delete(i.id); else this.planOff.add(i.id);
          row.toggleClass("is-off", !box.checked);
          sync();
        });
      });
    });
    if (!items.length) main.createDiv({ cls: "cm-query-note", text: "Claude sent the plan without any pages. Its full text is below." });
    const more = main.createEl("details", { cls: "cm-plan-text" });
    more.createEl("summary", { text: "Claude's full plan, as text" });
    MarkdownRenderer.render(this.app, last.answer, more.createDiv({ cls: "cm-query-answer markdown-rendered" }), "", this);

    const side = layout.createDiv({ cls: "cm-plan-side" });
    if (plan.questions.length) {
      side.createDiv({ cls: "cm-plan-shead is-amber", text: "Needs your call" });
      plan.questions.forEach((q, qi) => {
        const box = side.createDiv({ cls: "cm-plan-q" });
        box.createDiv({ text: q.q });
        const opts = box.createDiv({ cls: "cm-plan-opts" });
        (q.options.length ? q.options : ["Yes", "No"]).forEach((o) => {
          const b = opts.createEl("button", { cls: "cm-plan-opt" + (this.planAnswers[qi] === o ? " is-on" : ""), text: o });
          b.addEventListener("click", () => {
            this.planAnswers[qi] = this.planAnswers[qi] === o ? undefined : o;
            opts.querySelectorAll("button").forEach((x) => x.toggleClass("is-on", x.textContent === this.planAnswers[qi]));
          });
        });
      });
    }
    if (plan.skipped.length) {
      side.createDiv({ cls: "cm-plan-shead", text: "Skipped on purpose" });
      const ul = side.createEl("ul", { cls: "cm-plan-skips" });
      plan.skipped.forEach((x) => ul.createEl("li", { text: x }));
    }
    if (plan.notes) side.createDiv({ cls: "cm-plan-notes", text: plan.notes });
    const dest = sourceDestination(plan.sourceTo, this.q.entry.path);
    side.createDiv({ cls: "cm-plan-notes", text: dest ? `Once the drafts are written, Nicrosil moves the original from Ingestion/Raw to ${dest.path}.` : "Claude hasn't named a place in Sources/ for the original, so it will stay in Ingestion/Raw. Adjust the plan to ask for one." });
    if (items.some((i) => i.verified)) side.createDiv({ cls: "cm-plan-notes", text: "Saving an update to a verified page sets it back to draft, with a note of what changed." });

    const next = this.plugin.ingestNextFor(this);
    if (next) {
      const nb = side.createEl("button", { cls: "cm-plan-opt cm-plan-next", text: `Start next: ${next.name}`.slice(0, 60) });
      nb.addEventListener("click", () => this.plugin.ingestStartNext(this));
    }
    const foot = board.createDiv({ cls: "cm-plan-foot" });
    foot.createDiv({ cls: "cm-plan-footnote", text: "Nothing is written until you approve, and everything is saved as a draft." });
    const input = foot.createEl("input", { cls: "cm-plan-input", attr: { type: "text", placeholder: "Or tell Claude what to change", "aria-label": "Adjust the plan" } });
    const adjust = foot.createEl("button", { cls: "cm-plan-adjust", text: "Adjust the plan" });
    approve = foot.createEl("button", { cls: "cm-plan-approve" });
    sync();
    const answers = () => plan.questions.map((q, qi) => (this.planAnswers[qi] ? `- ${q.q} ${this.planAnswers[qi]}.` : null)).filter(Boolean);
    adjust.addEventListener("click", () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      const a = answers();
      this.run([v, ...(a.length ? ["", "My answers to your questions:", ...a] : [])].join("\n"), true);
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); adjust.click(); } });
    approve.addEventListener("click", () => {
      const left = items.filter((i) => this.planOff.has(i.id));
      const a = answers();
      const open = plan.questions.filter((q, qi) => !this.planAnswers[qi]);
      const msg = ["The plan is approved. Go ahead and draft it."];
      const vok = items.filter((i) => i.verified && !this.planOff.has(i.id));
      if (vok.length) msg.push("", INGEST_VERIFIED_OK, ...vok.map((i) => `- ${i.title}${i.add ? `: ${i.add}` : ""}`));
      if (left.length) msg.push("", "Leave these out (don't draft them):", ...left.map((i) => `- ${i.title} (${kindName[i.kind] || i.kind})`));
      if (a.length) msg.push("", "My answers to your questions:", ...a);
      if (open.length) msg.push("", "I didn't answer these; take the most reasonable reading and flag it in the report:", ...open.map((q) => `- ${q.q}`));
      this.run(msg.join("\n"), true);
    });
  }

  drawFollowUp(main) {
    const last = this.turns[this.turns.length - 1];
    if (last && last.meta.stage === "plan") {
      const row = main.createDiv({ cls: "cm-query-row cm-ing-quick" });
      const ok = row.createEl("button", { text: "Approve the plan" });
      ok.addEventListener("click", () => this.run(["The plan is approved. Go ahead and draft it.", "", INGEST_VERIFIED_OK, "- every verified page in your plan"].join("\n"), true));
    }
    const box = main.createDiv({ cls: "cm-query-follow" });
    const input = box.createEl("input", { cls: "cm-query-follow-input", attr: { type: "text", placeholder: last && last.meta.stage === "plan" ? "Or adjust the plan: tell Claude what to change" : "Reply to Claude in the same ingest", "aria-label": "Reply to Claude" } });
    const go = box.createEl("button", { cls: "cm-query-follow-go", attr: { "aria-label": "Send reply" } });
    setIcon(go, "arrow-right");
    const send = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      this.run(v, true);
    };
    go.addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); send(); } });
  }

  /**
   * The typed links this ingest added (4.8.0): "A → type → B", marked inferred or verified → draft, with the reason on hover.
   * Remove asks for a one-line reason, takes the link out of the page's properties, and logs it as a rejected link.
   */
  drawTypedLinks(side, links) {
    this.removedLinks = this.removedLinks || new Set();
    side.createDiv({ cls: "cm-query-flabel", text: `Typed links added (${links.length})` });
    if (!links.length) { side.createDiv({ cls: "cm-query-hint", text: "None reported." }); return; }
    const box = side.createDiv({ cls: "cm-ing-typed" });
    const go = (n) => { const a = createEl("a", { cls: "internal-link", text: n, attr: { "data-href": n, href: n } }); return a; };
    for (const l of links) {
      const key = `${l.from}|${l.type}|${l.to}`;
      const row = box.createDiv({ cls: "cm-ing-typed-row" + (this.removedLinks.has(key) ? " is-removed" : "") });
      if (l.why) row.title = l.why;
      const line = row.createDiv({ cls: "cm-ing-typed-line" });
      line.appendChild(go(l.from));
      line.createSpan({ cls: "cm-ing-typed-type", text: linkLabel(l.type) });
      line.appendChild(go(l.to));
      const tags = row.createDiv({ cls: "cm-ing-typed-tags" });
      tags.createSpan({ cls: "cm-ing-typed-tag" + (l.inferred ? " is-inferred" : ""), text: l.inferred ? "inferred" : "stated" });
      if (l.verified) tags.createSpan({ cls: "cm-ing-typed-tag is-verified", text: "verified → draft" });
      if (this.removedLinks.has(key)) { tags.createSpan({ cls: "cm-ing-typed-tag", text: "removed" }); continue; }
      const rm = tags.createEl("button", { cls: "cm-mini cm-ing-typed-rm", text: "Remove", attr: { type: "button", title: "Remove this link and log it as rejected" } });
      rm.addEventListener("click", () => {
        new TinPromptModal(this.app, { title: "Remove typed link", label: `${l.from} → ${l.type} → ${l.to}. Why? (one line, for the log)`, ok: "Remove" }, async (reason) => {
          if (reason === null) return;
          if (!reason.trim()) { new Notice("Give a one-line reason; the log records why a link was rejected.", 6000); return; }
          try {
            const out = await this.plugin.removeTypedLink(l.from, l.type, l.to);
            if (out === "missing") { new Notice(`Couldn't find ${l.type} → ${l.to} on “${l.from}”. Nothing changed.`, 8000); return; }
            await this.plugin.appendLog(typedLinkRejectLogEntry({ date: today(), ingest: this.q.entry.name, from: l.from, type: l.type, to: l.to, reason }));
            this.removedLinks.add(key);
            row.addClass("is-removed");
            rm.replaceWith(createSpan({ cls: "cm-ing-typed-tag", text: "removed" }));
            new Notice(`Removed ${l.type} → ${l.to} from “${l.from}” and logged it.`, 5000);
          } catch (e) {
            console.error("Nicrosil: couldn't remove the typed link", e);
            new Notice(`Couldn't remove the link: ${e.message}`, 10000);
          }
        }).open();
      });
    }
  }

  drawKeep(side, last) {
    const m = last.meta || {};
    const unmade = m.stage === "plan" ? [] : asList(m.proposed).map(bareLink).filter(Boolean);
    const stage = m.stage === "drafted" ? (unmade.length ? "Drafts written · not finished" : "Drafts written") : m.stage === "plan" ? "Plan ready" : "Waiting on you";
    side.createDiv({ cls: "cm-query-keep-title cm-gradient-style", text: stage });
    if (unmade.length) { // 4.6.4: a proposed change to a verified page lives only in this tab's report until it is made
      const box = side.createDiv({ cls: "cm-ing-unmade" });
      box.createDiv({ cls: "cm-ing-unmade-title", text: `${unmade.length} change${unmade.length === 1 ? "" : "s"} to verified pages not made` });
      const links = box.createDiv({ cls: "cm-ing-pages" });
      unmade.forEach((n) => links.createEl("a", { cls: "internal-link", text: n, attr: { "data-href": n, href: n } }));
      box.createDiv({ cls: "cm-ing-unmade-note", text: "Claude only proposed these. The before/after is in this report and nowhere else, so make them now or copy the report before you close the tab." });
      const mk = box.createEl("button", { cls: "cm-query-save mod-cta", text: `Make ${unmade.length === 1 ? "this change" : "these changes"}` });
      mk.addEventListener("click", () => this.run([INGEST_VERIFIED_OK, ...unmade.map((n) => `- ${n}`), "", "Past log entries are never rewritten, so add a short new `ingest` log entry naming them as `Changed (verified → draft): [[Page]]`. Give the report's section C again and a new nicrosil-meta block."].join("\n"), true));
    }
    if (m.summary) side.createDiv({ cls: "cm-query-sub", text: String(m.summary) });
    if (m.stage !== "plan") this.drawTypedLinks(side, ingestTypedLinks(m.typed_links));
    const pages = (label, list) => {
      const items = asList(list);
      if (!items.length) return;
      side.createDiv({ cls: "cm-query-flabel", text: label });
      const box = side.createDiv({ cls: "cm-ing-pages" });
      items.forEach((p) => { const n = bareLink(p); box.createEl("a", { cls: "internal-link", text: n, attr: { "data-href": n, href: n } }); });
    };
    pages("Created", m.created);
    pages("Appended", m.appended);
    pages("Verified → draft", m.edited_verified);
    if (m.source_card) pages("Source card", [m.source_card]);
    if (m.copied_to) { side.createDiv({ cls: "cm-query-flabel", text: "Copied to" }); side.createDiv({ cls: "cm-query-hint", text: String(m.copied_to) }); }
    if (Number(m.flags)) side.createDiv({ cls: "cm-query-suggest", text: `${m.flags} flag${Number(m.flags) === 1 ? "" : "s"} for you to check.` });
    if (this.drafted) {
      const rq = side.createEl("button", { cls: "cm-query-save mod-cta" });
      setIcon(rq.createSpan(), "list-checks");
      rq.appendText("Open the review queue");
      rq.addEventListener("click", () => this.plugin.activateView());
      const mv = this.moved;
      if (mv && mv.ok) side.createDiv({ cls: "cm-query-hint", text: `Moved the original from Ingestion/Raw to ${mv.to}` + (mv.textCopy ? ", with its text copy." : ".") });
      else side.createDiv({ cls: "cm-ing-unmade" }).createDiv({ cls: "cm-ing-unmade-note", text: `The original is still in Ingestion/Raw. ${mv ? mv.note : ""}` });
    }
    const next = this.plugin.ingestNextFor(this);
    if (next) {
      const b = side.createEl("button", { cls: "cm-query-save cm-ing-next" });
      setIcon(b.createSpan(), "arrow-right");
      b.appendText(`Start next: ${next.name}`.slice(0, 60));
      b.addEventListener("click", () => this.plugin.ingestStartNext(this));
    }
    const row = side.createDiv({ cls: "cm-query-row" });
    const copy = row.createEl("button", { text: "Copy report" });
    copy.addEventListener("click", async () => { await navigator.clipboard.writeText(last.answer); new Notice("Report copied."); });
    const close = row.createEl("button", { text: "Close" });
    let armed = false;
    close.addEventListener("click", () => {
      if (unmade.length && !armed) { armed = true; close.setText("Close anyway?"); close.addClass("mod-warning"); return; }
      this.leaf.detach();
    });
    side.createDiv({ cls: "cm-query-hint", text: unmade.length ? "Closing the tab ends the run and loses the proposed changes above. Drafts already written stay as drafts." : "Closing the tab ends the run. Drafts already written stay as drafts." });
  }
}

