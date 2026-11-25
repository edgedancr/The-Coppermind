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
  triageEntries, fileSize, addedWhen, parseIngestPlan,
};
