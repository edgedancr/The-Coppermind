  /* ---------- AI transcription: Claude Code jobs and shrinking new photos (4.6.0) ---------- */

  /** The folder my phone photos land in (Settings → Nicrosil, or the queue's tray). "" until it is set. */
  photosDir() { return String(this.settings.photosDir || "").trim(); }

  /** The Python commands to try for shrinking: the one in Settings, else the usual names for this system. */
  pythonCommands() {
    const set = String(this.settings.pythonPath || "").trim();
    if (set) return [set];
    return process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
  }

  /** Runs Python with these arguments in the vault folder. Resolves { ok, out, err, code, cmd }, or { missing: true } when no Python was found. Nothing here reads or writes the vault: the script does. */
  runPython(args) {
    const { spawn } = require("child_process");
    const cmds = this.pythonCommands();
    const cwd = this.app.vault.adapter.getBasePath();
    return new Promise((resolve) => {
      const attempt = (i) => {
        if (i >= cmds.length) { resolve({ ok: false, missing: true, out: "", err: "" }); return; }
        let child;
        try { child = spawn(cmds[i], args, { cwd, env: process.env, windowsHide: true }); } catch (e) { attempt(i + 1); return; }
        let out = "", err = "", settled = false;
        child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
        child.stdout.on("data", (c) => { out += c; });
        child.stderr.on("data", (c) => { err += c; });
        child.on("error", (e) => { if (settled) return; settled = true; if (e && e.code === "ENOENT") attempt(i + 1); else resolve({ ok: false, out, err: String(e && e.message || e), code: -1, cmd: cmds[i] }); });
        child.on("close", (code) => {
          if (settled) return;
          settled = true;
          // Windows' "python" can be a stub that points at the Microsoft Store: try the next name
          if (code !== 0 && /was not found|Microsoft Store/i.test(out + err) && i + 1 < cmds.length) { attempt(i + 1); return; }
          resolve({ ok: code === 0, out, err, code, cmd: cmds[i] });
        });
      };
      attempt(0);
    });
  }

  /**
   * The photos in the photos folder that have no shrunk copy in Sources/Scans and weren't shrunk before by Nicrosil.
   * "fresh" ones are newer than the last shrink (or than the newest scan, the first time); "older" ones are the rest. Both sorted by name (the order photographed).
   * state: "unset" | "unreadable" | "ok" | "mobile".
   */
  listPhotos() {
    if (Platform.isMobile) return { state: "mobile", dir: "", fresh: [], older: [], heic: 0 };
    const dir = this.photosDir();
    if (!dir) return { state: "unset", dir, fresh: [], older: [], heic: 0 };
    const fs = require("fs"), path = require("path");
    let names;
    try { names = fs.readdirSync(dir); } catch (e) { return { state: "unreadable", dir, fresh: [], older: [], heic: 0 }; }
    const scans = this.scanFiles();
    const stems = new Set(scans.map((f) => f.basename.toLowerCase()));
    const done = new Set((this.settings.shrunkPhotos || []).map(String));
    const since = Number(this.settings.lastShrinkAt) || scans.reduce((m, f) => Math.max(m, f.stat.mtime), 0);
    const fresh = [], older = [];
    let heic = 0;
    for (const name of names) {
      const ok = TR_PHOTO_OK.test(name), isHeic = TR_PHOTO_HEIC.test(name);
      if (!ok && !isHeic) continue;
      const stem = name.replace(/\.[^.]+$/, "").toLowerCase();
      if (stems.has(stem) || done.has(name)) continue;
      let st;
      try { st = fs.statSync(path.join(dir, name)); } catch (e) { continue; }
      if (!st.isFile()) continue;
      if (isHeic) { heic++; continue; }
      (st.mtimeMs > since ? fresh : older).push({ name, size: st.size, mtime: st.mtimeMs, ok: true });
    }
    const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });
    return { state: "ok", dir, fresh: fresh.sort(byName), older: older.sort(byName), heic };
  }

  /**
   * Shrinks these photos (file names in the photos folder) into Sources/Scans with Tools/shrink-scans/shrink_scans.py.
   * The script works on a whole folder, so the chosen photos are first copied into a temporary folder and the script runs on that; the originals
   * are never touched, and photos I didn't choose (or old ones I already finished) are never brought back into the scans.
   * Resolves { ok, scans: [file names in Sources/Scans], message }.
   */
  async shrinkPhotos(names) {
    if (Platform.isMobile) return { ok: false, scans: [], message: "Shrinking needs Obsidian on a computer." };
    const fs = require("fs"), path = require("path"), os = require("os");
    const dir = this.photosDir();
    if (!dir) return { ok: false, scans: [], message: "Set the photos folder first." };
    const base = this.app.vault.adapter.getBasePath();
    const script = path.join(base, "Tools", "shrink-scans", "shrink_scans.py");
    if (!fs.existsSync(script)) return { ok: false, scans: [], message: "Tools/shrink-scans/shrink_scans.py isn't in the vault." };
    const dest = path.join(base, "Sources", "Scans");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nicrosil-shrink-"));
    try {
      const copied = [];
      let newest = 0;
      for (const n of names) {
        if (path.basename(n) !== n) continue; // a name, never a path
        const src = path.join(dir, n);
        try { newest = Math.max(newest, fs.statSync(src).mtimeMs); fs.copyFileSync(src, path.join(tmp, n)); copied.push(n); } catch (e) { /* skipped below */ }
      }
      if (!copied.length) return { ok: false, scans: [], message: "None of those photos could be read from the photos folder." };
      const r = await this.runPython([script, tmp, dest]);
      if (r.missing) return { ok: false, scans: [], message: "Nicrosil couldn't find Python. Install it (python.org), or put its path under Settings → Nicrosil → Python for shrinking." };
      if (!r.ok) {
        const msg = (r.err || r.out || "").trim();
        if (/Pillow/i.test(msg)) return { ok: false, scans: [], message: "Shrinking needs Pillow. In a terminal, run: pip install pillow" };
        return { ok: false, scans: [], message: "The shrink tool stopped: " + (msg.split(/\r?\n/).slice(-2).join(" ") || `exit code ${r.code}`) };
      }
      const scans = copied.map((n) => n.replace(/\.[^.]+$/, "") + ".jpg").filter((n) => fs.existsSync(path.join(dest, n)));
      if (!scans.length) return { ok: false, scans: [], message: "The shrink tool ran, but no shrunk copies appeared in Sources/Scans." };
      this.settings.shrunkPhotos = [...new Set([...(this.settings.shrunkPhotos || []), ...copied])].slice(-3000);
      this.settings.lastShrinkAt = Math.max(Number(this.settings.lastShrinkAt) || 0, newest);
      await this.persist();
      for (let i = 0; i < 25 && !scans.every((n) => this.app.vault.getAbstractFileByPath(SCAN_DIR + n)); i++) await new Promise((res) => window.setTimeout(res, 200)); // let Obsidian notice the new files
      const line = (r.out || "").trim().split(/\r?\n/).pop();
      return { ok: true, scans, message: `Shrunk ${scans.length} photo${scans.length === 1 ? "" : "s"} into Sources/Scans.${line ? " " + line : ""}` };
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* a temp folder; the system clears it */ }
    }
  }

  /**
   * Runs one Claude Code job with these arguments and sends it `prompt` on stdin. `onEvent` gets { type: "init" | "tool" | "writing", text }.
   * Returns { done, cancel }: `done` resolves { text, ev, model, startedAt } or rejects with an Error (cancelled: true when I pressed Cancel).
   */
  claudeJob(args, prompt, onEvent) {
    const job = { proc: null, cancelled: false, cancel() { this.cancelled = true; if (this.proc) { try { this.proc.kill(); } catch (e) { /* already gone */ } } } };
    const startedAt = Date.now();
    job.done = new Promise((resolve, reject) => {
      let child;
      try { child = this.spawnClaude(args); } catch (e) { reject(e); return; }
      job.proc = child;
      let buf = "", errText = "", resultEv = null, lastText = "", modelId = "", wrote = false;
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
            if (ev.model) modelId = ev.model;
            if (onEvent) onEvent({ type: "init", text: "" });
          } else if (ev.type === "assistant" && ev.message && Array.isArray(ev.message.content)) {
            for (const c of ev.message.content) {
              if (c.type === "tool_use") { if (onEvent) onEvent({ type: "tool", text: describeToolUse(c.name, c.input).text }); }
              else if (c.type === "text" && c.text) { lastText = c.text; if (!wrote && onEvent) { wrote = true; onEvent({ type: "writing", text: "" }); } }
            }
          } else if (ev.type === "result") resultEv = ev;
          else { const u = usageFromEvent(ev); if (u) this.noteUsage(u); }
        }
      });
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (c) => { errText += c; });
      child.on("error", (e) => {
        if (job.cancelled) return;
        reject(new Error(e && e.code === "ENOENT" ? "Nicrosil couldn't find Claude Code on this computer. Install it, sign in once by running claude in a terminal, or set its path in Settings → Nicrosil." : String(e && e.message || e)));
      });
      child.on("close", (code) => {
        if (job.cancelled) { const e = new Error("cancelled"); e.cancelled = true; reject(e); return; }
        if (resultEv && !resultEv.is_error && (resultEv.result || lastText)) {
          if (resultEv.usage) this.noteRun(resultEv);
          resolve({ text: resultEv.result || lastText, ev: resultEv, model: modelId, startedAt });
        } else reject(new Error((resultEv && (resultEv.result || resultEv.subtype)) || errText.trim() || `Claude Code stopped (exit code ${code}).`));
      });
      child.stdin.end(prompt);
    });
    return job;
  }

