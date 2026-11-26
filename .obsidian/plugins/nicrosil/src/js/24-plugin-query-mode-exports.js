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
    const child = shim ? spawn(winQuote(cmd), args.map(winQuote), opts) : spawn(cmd, args, opts);
    if (args.includes("-p")) this.watchRun(child);
    return child;
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

  /* ---------- live usage meter (4.5.0) ---------- */

  /** While a Claude Code run is going the meter checks more often; one more check, just after it ends, picks up what it used. */
  watchRun(child) {
    this.usageRuns = (this.usageRuns || 0) + 1;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      this.usageRuns = Math.max(0, this.usageRuns - 1);
      window.setTimeout(() => this.refreshUsage({ force: true }), 2000);
    };
    child.on("close", finish);
    child.on("error", finish);
  }

  /** Checks on a timer: every 30 seconds, every 10 seconds while a run is going, and once a few seconds after Obsidian starts (even if the window is hidden then).
   *  Timer checks pause while Obsidian is hidden; a check also runs when it comes back. */
  startUsagePolling() {
    if (Platform.isMobile) return;
    const tick = (first) => {
      this.refreshUsage({ force: first === true });
      this.usageTimer = window.setTimeout(tick, this.usageRuns > 0 ? 10000 : 30000);
    };
    this.usageTimer = window.setTimeout(() => tick(true), 4000);
    this.registerDomEvent(document, "visibilitychange", () => { if (document.visibilityState === "visible") this.refreshUsage(); });
  }

  /** Where Claude Code keeps its sign-in: the folder in CLAUDE_CONFIG_DIR, else .claude in the home folder. */
  claudeLoginPath() {
    const path = require("path");
    return path.join(process.env.CLAUDE_CONFIG_DIR || path.join(require("os").homedir(), ".claude"), ".credentials.json");
  }

  /** Records why the meter can't show a live figure (null when it can) and redraws it. */
  setUsageState(state) {
    if (this.usageState === state) return;
    this.usageState = state;
    (this.usageListeners || new Set()).forEach((f) => f());
  }

  /** Asks Anthropic how much of the plan limit is used and shows it in the meter. Reads Claude Code's saved sign-in for one request and sends it only to api.anthropic.com;
   *  the sign-in is never stored on the plugin, written to a file, or put in a message. It is never refreshed here: Claude Code renews it when it runs. */
  async refreshUsage({ force = false } = {}) {
    if (Platform.isMobile) return;
    if (this.settings.liveUsage === false) { this.setUsageState("off"); return; }
    const now = Date.now();
    if (this.usageBusy || now < (this.usageBackoffUntil || 0)) return;
    if (!force && document.visibilityState === "hidden") return;
    if (now - (this.usageFetchedAt || 0) < (force ? 5000 : 8000)) return;
    this.usageBusy = true;
    try {
      let text;
      try { text = require("fs").readFileSync(this.claudeLoginPath(), "utf8"); } catch (e) { this.setUsageState("missing"); return; }
      const login = parseClaudeLogin(text, now);
      text = null;
      if (login.error) { this.setUsageState(login.error); return; }
      this.usageFetchedAt = now;
      const res = await requestUrl({ url: USAGE_API_URL, method: "GET", headers: { Authorization: `Bearer ${login.token}`, "anthropic-beta": "oauth-2025-04-20", Accept: "application/json" }, throw: false });
      if (res.status === 200) {
        let body = null;
        try { body = res.json; } catch (e) { /* not JSON */ }
        const u = usageFromApi(body);
        if (u) this.noteLiveUsage(u); else this.setUsageState("changed");
      } else if (res.status === 401 || res.status === 403) {
        this.setUsageState("expired");
      } else if (res.status === 429) {
        const wait = Number(res.headers && (res.headers["retry-after"] || res.headers["Retry-After"]));
        this.usageBackoffUntil = Date.now() + (Number.isFinite(wait) && wait > 0 ? Math.min(wait, 1800) * 1000 : 10 * 60 * 1000);
        this.setUsageState("slow");
      } else {
        this.setUsageState("error");
      }
    } catch (e) {
      this.setUsageState("offline");
    } finally {
      this.usageBusy = false;
    }
  }

  /** Keeps a live reading for the meter, and saves it only when a figure changed. */
  noteLiveUsage(u) {
    const prev = this.settings.lastUsage;
    const same = prev && prev.source === "live" && JSON.stringify(prev.windows) === JSON.stringify(u.windows);
    this.settings.lastUsage = { pct: u.pct, kind: u.kind, resetsAt: u.resetsAt, windows: u.windows, source: "live", at: Date.now() };
    this.usageState = null;
    if (!same) this.persist();
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
  buildQueryPrompt, parseQueryReply, analysisPage, queryLogEntry, queryFiledLogEntry, describeToolUse, usageFromEvent, usageFromApi, parseClaudeLogin, resetText, usageLabel, claudeArgs, winQuote,
  triageEntries, fileSize, addedWhen, parseIngestPlan,
  trClaudeArgs, normDate, suggestTranscribe, buildTranscribePrompt, parseTranscribeReply, transcriptionNote, noteChecks, transcribeLogEntry, buildRecreatePrompt, parseRecreateReply, buildRecheckPrompt, parseRecheckReply, applyRecheck, unsureContext, trCourses, TranscribeView,
};
