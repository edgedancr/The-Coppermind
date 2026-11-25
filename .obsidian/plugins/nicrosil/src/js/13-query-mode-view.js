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
  if (name === "Write") return { text: `Wrote ${short(i.file_path)}`, page: true };
  if (name === "Edit") return { text: `Edited ${short(i.file_path)}`, page: true };
  if (name === "Bash") return { text: i.description ? String(i.description) : `Ran ${String(i.command || "a command").slice(0, 70)}`, page: false };
  return { text: `Used ${name}`, page: false };
}

/** Usage percent (0–100) from a stream-json event, if the event carries one; null otherwise.
 *  On a Claude.ai login the rate limit event lists every window in `unifiedWindows` ({ five_hour: { utilization, resetsAt }, seven_day: ... }, utilization 0–1),
 *  even while the status is "allowed". The window closest to its limit wins, since that is the one that stops a run.
 *  The older top-level `utilization` field is still read as a fallback: Claude Code only fills it once a window nears its limit. */
function usageFromEvent(ev) {
  if (!ev || typeof ev !== "object" || !/rate.?limit/i.test(String(ev.type || ""))) return null;
  const info = ev.rate_limit_info || ev.rateLimitInfo || ev;
  const toPct = (v) => {
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const pct = n <= 1 ? n * 100 : n;
    return pct >= 0 && pct <= 100 ? pct : null;
  };
  const windows = info.unifiedWindows || info.unified_windows;
  if (windows && typeof windows === "object") {
    let best = null;
    for (const [kind, w] of Object.entries(windows)) {
      if (!w || typeof w !== "object") continue;
      const pct = toPct(w.utilization);
      if (pct !== null && (!best || pct > best.pct)) best = { pct, kind, resetsAt: w.resetsAt || w.resets_at || null };
    }
    if (best) return { pct: Math.round(best.pct), kind: best.kind, resetsAt: best.resetsAt };
  }
  for (const [k, v] of Object.entries(info)) {
    if (!/utiliz|percent|used/i.test(k)) continue;
    const pct = toPct(v);
    if (pct !== null) return { pct: Math.round(pct), kind: String(info.rateLimitType || info.rate_limit_type || ""), resetsAt: info.resetsAt || info.resets_at || null };
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
    const ui = this.ui(followUp);
    this.drawHeader(w, ui.label);
    const card = w.createDiv({ cls: "cm-query-card is-working" });
    const bg = card.createDiv({ cls: "cm-hero-bg" });
    bg.setAttr("aria-hidden", "true");
    for (let i = 0; i < 5; i++) {
      const s = bg.createSpan({ cls: "cm-hero-spark" + (i % 2 ? " is-teal" : "") });
      s.style.left = `${(i * 23 + 9) % 95}%`;
      s.style.setProperty("--d", `${7 + i}s`);
      s.style.animationDelay = `-${i * 2}s`;
    }
    card.createDiv({ cls: "cm-query-working cm-gradient-style", text: ui.working });
    card.createDiv({ cls: "cm-query-sub", text: ui.sub });
    const steps = card.createDiv({ cls: "cm-query-steps" });
    const bar = card.createDiv({ cls: "cm-progress" }).createDiv({ cls: "cm-progress-fill" });
    bar.style.width = "4%";
    const foot = card.createDiv({ cls: "cm-query-foot" });
    const elapsed = foot.createSpan({ text: "Elapsed 0:00" });
    foot.createSpan({ text: ui.foot });
    const cancel = w.createEl("button", { cls: "cm-query-cancel", text: ui.cancel });
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
      child = this.plugin.spawnClaude(this.argsFor({ model: this.q.model, effort: this.q.effort, sessionId: followUp ? null : this.sessionId, resume: followUp ? this.sessionId : null }));
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
              const cap = ui.cap;
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
    child.stdin.end(this.promptFor(question, followUp));
  }

  /** The words on the working card, and the page count the bar measures against (4.4.0: hooks, so the ingest tab can reuse run()). */
  ui(followUp) {
    return {
      label: followUp ? "Working on your follow-up" : "Reading the wiki",
      working: followUp ? "Thinking it through…" : "Reading the wiki…",
      sub: "Claude answers from your pages first. Nothing is saved until you press Save to Analyses.",
      foot: "The bar is an estimate: pages read against the depth's guide",
      cancel: "Cancel query",
      cap: QUERY_DEPTH_CAP[this.q.depth] || 8,
    };
  }
  argsFor(o) { return claudeArgs(o); }
  answerLabel() { return this.saved ? "Saved to Analyses" : "Draft, not saved"; }
  metaMissingNote() { return "Claude didn't end with the metadata block, so the title, summary and log details are partly blank. Fill them in before saving."; }
  promptFor(question, followUp) { return buildQueryPrompt({ question, depth: this.q.depth, followUp }); }

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
    const head = this.drawHeader(main, this.answerLabel());
    if (last.meta.question_type || last.meta.depth) {
      const chips = head.querySelector(".cm-query-chips");
      if (last.meta.question_type) chips.createSpan({ cls: "cm-query-chip is-type", text: String(last.meta.question_type) });
    }
    if (note) main.createDiv({ cls: "cm-query-note", text: note });
    if (!metaOk) main.createDiv({ cls: "cm-query-note", text: this.metaMissingNote() });
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

