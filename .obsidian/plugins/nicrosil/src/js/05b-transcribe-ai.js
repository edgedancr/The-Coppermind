/* ---------- AI transcription in the queue (4.6.0) ---------- */
/*
 * The queue's "Transcribe scans" button sends the scans I tick to Claude Code (`claude -p`, signed in with my own account) and gets back
 * the transcription as text. Claude has ONE tool, Read, and only for Sources/Scans, the Transcription schema and _AGENTS.md; it cannot
 * write, edit or delete anything, and it cannot open the Tinmind, Ingestion/Raw or the rest of the vault. Nicrosil, not Claude, writes the
 * draft note (type, course, semester, `transcription: draft`, `scan_pages`), adds the `transcribe` log entry, and leaves Verify to me.
 * The same one-tool run powers "Recreate with Claude" (a drawing becomes Mermaid, a table or a list, marked for me to check) and
 * "Look again at the unsure ones" (better guesses, still marked [?...?] so I decide). New photos can be shrunk first with
 * Tools/shrink-scans/shrink_scans.py (see plugin part 23c). Desktop only. The methods below are added to TranscribeView.
 */
const TR_AI_ALLOW = ["Read(./Sources/Scans/**)", "Read(./SCHEMAS/SCHEMA - Transcription.md)", "Read(./_AGENTS.md)"];
const TR_AI_DENY = ["Read(./Ingestion/Raw/**)", "Read(./The Tinmind/**)", "Read(./.obsidian/**)", "Read(./.git/**)"];
const TR_PHOTO_OK = /\.(jpe?g|png)$/i;      // what shrink_scans.py takes
const TR_PHOTO_HEIC = /\.(heic|heif)$/i;    // phone photos it can't read without pillow-heif
const trSleep = (ms) => new Promise((r) => window.setTimeout(r, ms));

/** The arguments for a transcription job: print mode, streamed JSON, the chosen model and effort, and Read for the scans only. The prompt goes in on stdin. */
function trClaudeArgs({ model, effort, sessionId }) {
  const a = ["-p", "--output-format", "stream-json", "--verbose", "--model", model];
  if (effort && model !== "haiku") a.push("--effort", effort);
  a.push("--tools", "Read", "--allowedTools", ...TR_AI_ALLOW, "--permission-mode", "dontAsk", "--max-turns", "80");
  a.push("--disallowedTools", ...TR_AI_DENY);
  if (sessionId) a.push("--session-id", sessionId);
  return a;
}

/** "11/24/26", "11-24-2026", "1.5.26" -> "11-24-26" (the date in a class note's name); "" if it isn't a date. */
function normDate(s) {
  const m = /^\s*(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2}|\d{4})\s*$/.exec(String(s || ""));
  if (!m) return "";
  const mo = Number(m[1]), d = Number(m[2]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return "";
  return `${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}-${m[3].slice(-2)}`;
}

/** The model and effort the queue suggests for `n` pages, with a line saying why. */
function suggestTranscribe(n) {
  if (!(n > 0)) return null;
  if (n > 10) return { model: "sonnet", effort: "medium", why: `${n} pages in one run is a long one. One class session at a time keeps each run short and lets you check as you go.` };
  return { model: "sonnet", effort: "medium", why: "Sonnet at medium effort is the starting point for handwriting. Try Opus only if the pages are hard to read: “Look again at the unsure ones” can settle a few words for less than a rerun." };
}

/** The message Nicrosil sends Claude to transcribe `pages` (file names in Sources/Scans), for a course Harrison chose. */
function buildTranscribePrompt({ pages, course, semester, date, sample }) {
  const lines = [
    "This is a transcription run from Nicrosil's Transcription queue in the Tinmind.",
    "",
    "First read `SCHEMAS/SCHEMA - Transcription.md` and follow its Transcribing and Drawing flags sections exactly: write what Harrison wrote, mark what you can't read, flag every drawing. (_AGENTS.md is already loaded.)",
    "",
    "How this run differs from a chat transcription (Harrison designed it this way):",
    "- You have one tool, Read, for the scans only. Don't try to create or edit a file. Nicrosil writes each note, adds its properties (type, course, semester, transcription: draft, scan_pages) and adds the log entry. So skip the properties and Log steps of the schema, and don't put a properties block in a note.",
    "- Don't ask questions; nobody can answer until you finish. Flag what is unclear inside the note, as the schema says, and list it under problems.",
    "",
    `Course: ${course} (${semester}). Harrison chose it, so every page is from this course.`,
    date ? `Class date: Harrison says these pages are from ${date} (MM-DD-YY).` : "Class date: read it from the page. If a session has no date you can read, write date=unknown; don't guess.",
    "",
    "Scans, in the order they were photographed. Read every one of them:",
    ...pages.map((p) => `- Sources/Scans/${p}`),
    "",
  ];
  if (sample) lines.push("This is the start of another class note in the course, only so you can match how Harrison lays notes out (headings, bullets, tabs). Don't copy its content:", "```markdown", sample, "```", "");
  lines.push(
    "Write the answer as one block per class session, exactly like this (pages= lists the scans that session's lines come from, comma-separated, file names only):",
    "=== NOTE date=MM-DD-YY pages=IMG_0805.jpg,IMG_0806.jpg ===",
    "(the note's Markdown)",
    "=== END NOTE ===",
    "",
    "A page that holds two sessions goes in two blocks; a session that runs over several pages is one block. Put the exact scan file name in the `scan:` line of every drawing flag.",
    "",
    "After the last block, end your reply with this block and nothing after it (valid JSON):",
    "```nicrosil-meta",
    '{"problems": ["One short line for each thing Harrison should look at first, such as a missing date or a page you could not read"]}',
    "```",
  );
  return lines.join("\n");
}

/** Takes a properties block off the top of a note body, if Claude wrote one anyway. */
function stripProps(body) {
  const m = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(body);
  return m ? body.slice(m[0].length) : body;
}

/** Splits Claude's reply into notes: [{ date, pages, body }], with the problems it listed. notes is [] when no block was found. */
function parseTranscribeReply(text) {
  const { answer, meta } = parseQueryReply(text);
  const notes = [];
  const re = /^=== NOTE([^\n]*?)===[ \t]*\r?\n([\s\S]*?)\r?\n=== END NOTE ===[ \t]*$/gm;
  let m;
  while ((m = re.exec(answer))) {
    const head = m[1];
    const d = /date=(\S+)/i.exec(head);
    const p = /pages=(.*?)\s*$/i.exec(head);
    const pages = p ? p[1].split(/[,;]\s*|\s+/).map((x) => x.trim().replace(/^\[\[|\]\]$/g, "").split("/").pop()).filter((x) => /\.(jpe?g|png|webp)$/i.test(x)) : [];
    const body = stripProps(m[2]).trim();
    if (body) notes.push({ date: d ? normDate(d[1]) : "", pages, body });
  }
  return { notes, problems: asList(meta && meta.problems), metaOk: !!(meta && Object.keys(meta).length) };
}

/** The whole draft note Nicrosil writes: the properties the Tinmind's class notes have, the two the queue needs, then what Claude transcribed. */
function transcriptionNote({ course, semester, pages, body }) {
  return [
    "---",
    "type: course-note",
    `course: ${yamlStr(course)}`,
    `semester: ${yamlStr(semester)}`,
    "transcription: draft",
    yamlPlain("scan_pages", pages),
    "---",
    body,
    "",
  ].join("\n");
}

/** How many drawing flags and unsure words a note has. */
function noteChecks(text) {
  return { drawings: parseDrawings(text).length, unsure: findUnsure(text).length };
}

/** The `transcribe` log entry Nicrosil adds when notes were drafted (Verify stays empty: the queue logs each verification itself). */
function transcribeLogEntry({ course, date, model, effort, pages, notes, drawings, unsure, problems = [], shrunk = 0 }) {
  const s = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const think = `Harrison transcribed ${s(pages.length, "scan")} for ${course} from the Transcription queue (${model}${effort && model !== "haiku" ? `, ${effort} effort` : ""}).${shrunk ? ` Nicrosil shrank ${s(shrunk, "new photo")} first.` : ""}`;
  const calc = `Read ${s(pages.length, "scan")} and drafted ${s(notes.length, "note")}: ${notes.map((n) => `[[${n}]]`).join(", ")}. Flagged ${s(drawings, "drawing")} and ${s(unsure, "unsure word")}.${problems.length ? ` Claude listed: ${problems.map((p) => oneLine(p).replace(/[.\s]+$/, "")).join("; ")}.` : ""}`;
  return [`### [${date}] transcribe | ${course} (${s(pages.length, "scan")})`, "", `- **Think:** ${think}`, `- **Calculate:** ${calc}`, "- **Verify:**"].join("\n");
}

/** The message that asks Claude to recreate one flagged drawing. */
function buildRecreatePrompt({ scan, label, body }) {
  return [
    "This is a request from Nicrosil's Transcription queue: recreate one drawing from a scan of Harrison's handwritten notes.",
    "",
    "Read `SCHEMAS/SCHEMA - Transcription.md` (the Recreate part of Drawing flags), then look at the scan: `Sources/Scans/" + scan + "`.",
    `The drawing: ${label || "(no label)"}. The transcription described it as: ${body || "(no description)"}`,
    "",
    "Recreate it as a Mermaid diagram, a Markdown table or a nested list, whichever shows it most faithfully. Use only what the drawing shows and Harrison's own labels, spelled the way he wrote them. Don't add, interpret or tidy anything. If it can't be recreated faithfully this way (a sketch, a map, a graph with a curve), say so.",
    "You have one tool, Read. Don't try to create or edit a file: Nicrosil puts your answer in the note.",
    "",
    "Reply with exactly one of these, and nothing else:",
    "=== RECREATED ===",
    "(the Markdown: a ```mermaid fenced block, a table or a list)",
    "=== END ===",
    "or",
    "=== CANNOT ===",
    "(one sentence on why)",
    "=== END ===",
  ].join("\n");
}

/** Claude's answer to the recreate prompt: { ok: true, md } or { ok: false, why }. */
function parseRecreateReply(text) {
  const src = String(text || "");
  const a = /^=== RECREATED ===[ \t]*\r?\n([\s\S]*?)\r?\n=== END ===/m.exec(src);
  if (a && a[1].trim()) return { ok: true, md: a[1].replace(/^\s*\n+|\s+$/g, "") };
  const b = /^=== CANNOT ===[ \t]*\r?\n([\s\S]*?)(?:\r?\n=== END ===|$)/m.exec(src);
  if (b) return { ok: false, why: oneLine(b[1]) || "no reason given" };
  return { ok: false, why: "Claude's answer wasn't in the format Nicrosil expects" };
}

/** A few words either side of an unsure word, on one line, so Claude can find it on the page. */
function unsureContext(text, u) {
  const before = text.slice(Math.max(0, u.index - 70), u.index).replace(/\s*\r?\n\s*/g, " / ");
  const after = text.slice(u.index + u.length, u.index + u.length + 40).replace(/\s*\r?\n\s*/g, " / ");
  return `…${before}${u.text}${after}…`;
}

/** The message that asks Claude to look again at each unsure word. items: [{ n, text, context }]. */
function buildRecheckPrompt({ scans, items }) {
  return [
    "This is a request from Nicrosil's Transcription queue: look again at the words in a transcription that Harrison's draft marked as unsure.",
    "",
    "Read `SCHEMAS/SCHEMA - Transcription.md` (rule 3, Mark what you can't read), then look at these scans again:",
    ...scans.map((s) => `- Sources/Scans/${s}`),
    "",
    "For each numbered marker below, find that spot on the page and decide:",
    "- a better reading: write it as `[?word?]` (a guess stays a guess, Harrison decides whether to accept it);",
    "- still unreadable: `[??]`;",
    "- no better than before: give the marker back exactly as it was.",
    "Never write a plain word without the marker, and don't touch anything else in the note.",
    "You have one tool, Read. Don't try to create or edit a file.",
    "",
    ...items.map((i) => `${i.n}. ${i.text}   in: ${i.context}`),
    "",
    "Reply with this block and nothing else (valid JSON; \"to\" is the whole marker, brackets included):",
    "```nicrosil-unsure",
    '{"fixes": [{"n": 1, "to": "[?word?]"}]}',
    "```",
  ].join("\n");
}

/** Claude's answer to the recheck prompt as { n: marker } for the fixes that are valid markers; {} when none. */
function parseRecheckReply(text, count) {
  const m = /```nicrosil-unsure[^\n]*\n([\s\S]*?)```/.exec(String(text || ""));
  if (!m) return {};
  let j;
  try { j = JSON.parse(m[1]); } catch (e) { return {}; }
  const out = {};
  for (const f of (j && Array.isArray(j.fixes) ? j.fixes : [])) {
    const n = Number(f && f.n), to = f && typeof f.to === "string" ? f.to.trim() : "";
    if (Number.isInteger(n) && n >= 1 && n <= count && /^\[\?[^\]\n]*\?\]$/.test(to)) out[n] = to;
  }
  return out;
}

/** Puts the new markers in place of the old ones. `list` is findUnsure(text); returns { text, changed } (changed: how many markers differ now). */
function applyRecheck(text, list, fixes) {
  let out = text, changed = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    const to = fixes[i + 1];
    if (!to || to === list[i].text) continue;
    out = out.slice(0, list[i].index) + to + out.slice(list[i].index + list[i].length);
    changed++;
  }
  return { text: out, changed };
}

/** The courses a draft can go in: every course page (type: class-notes) with its folder, the current semester first. */
function trCourses(app) {
  const out = [];
  for (const f of app.vault.getMarkdownFiles()) {
    if (!f.path.startsWith(NOTES_DIR) || !f.parent) continue;
    const fm = (app.metadataCache.getFileCache(f) || {}).frontmatter;
    if (!fm || fm.type !== "class-notes" || !fm.course || !fm.semester) continue;
    const course = String(fm.course), semester = String(fm.semester);
    out.push({ course, semester, current: fm.current === true || fm.current === "true", folder: `${f.parent.path}/${course}`, key: `${semester}|${course}` });
  }
  return out.sort((a, b) => (b.current - a.current) || ((semesterKey(b.semester) || 0) - (semesterKey(a.semester) || 0)) || a.course.localeCompare(b.course));
}

/** The first lines of the course's latest class note, only to show Claude how Harrison lays notes out; "" if there isn't one. */
async function trSample(app, folderPath) {
  const dir = app.vault.getAbstractFileByPath(folderPath);
  if (!(dir instanceof TFolder)) return "";
  const notes = dir.children.filter((c) => c instanceof TFile && c.extension === "md").filter((c) => {
    const fm = (app.metadataCache.getFileCache(c) || {}).frontmatter;
    return !(fm && fm.transcription);
  });
  if (!notes.length) return "";
  const pick = notes.reduce((a, b) => (b.stat.mtime > a.stat.mtime ? b : a));
  try {
    const body = splitNote(await app.vault.cachedRead(pick)).body.split(/\r?\n/).slice(0, 24).join("\n").slice(0, 1600).trim();
    return body;
  } catch (e) { return ""; }
}

/* ---------- the queue's side of it: the tray under the scan, the panel over the note, the progress card ---------- */

Object.assign(TranscribeView.prototype, {
  /** The queue's AI state (what is ticked, what is chosen, what is running). */
  trxState() {
    if (!this.trx) {
      const s = this.plugin.settings;
      this.trx = { open: false, mode: "form", sel: new Set(), photoSel: new Set(), seeded: false, showOld: false, course: s.trCourse || "", date: "", model: s.trModel || "sonnet", effort: s.trEffort || "medium", shrink: s.trShrink !== false, run: null, err: "", last: -1, shrinking: false, setDir: false, names: new Map() };
    }
    return this.trx;
  },

  /** The scans no note lists yet, in photographed order. */
  trxWaiting(waiting) {
    return [...waiting].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  },

  /** The photos folder's contents, looked up at most every few seconds. */
  photoInfo(force) {
    if (!force && this.photoCache && Date.now() - this.photoCache.at < 4000) return this.photoCache.data;
    const data = this.plugin.listPhotos();
    this.photoCache = { at: Date.now(), data };
    return data;
  },

  /** The tray under the scan: new photos that aren't shrunk yet, and the scans no note lists yet, each with a tick box. */
  drawTray(parent, waiting) {
    const trx = this.trxState();
    const list = this.trxWaiting(waiting);
    const keys = new Set(list.map((f) => scanKey(f.name)));
    for (const k of [...trx.sel]) if (!keys.has(k)) trx.sel.delete(k);
    const photos = Platform.isMobile ? { state: "mobile", fresh: [], older: [] } : this.photoInfo(false);
    if (!trx.seeded) {
      trx.seeded = true;
      if (list.length && list.length <= 12) list.forEach((f) => trx.sel.add(scanKey(f.name)));
      if (photos.fresh && photos.fresh.length && photos.fresh.length <= 12) photos.fresh.forEach((p) => trx.photoSel.add(p.name));
    }
    const have = new Set([...(photos.fresh || []), ...(photos.older || [])].map((p) => p.name));
    for (const n of [...trx.photoSel]) if (!have.has(n)) trx.photoSel.delete(n);

    const tray = parent.createDiv({ cls: "cm-trw" });
    this.trayHost = tray;

    // new photos
    if (!Platform.isMobile) {
      const sec = tray.createDiv({ cls: "cm-trw-sec" });
      if (photos.state === "unset" || trx.setDir) {
        sec.createDiv({ cls: "cm-tr-checkhead", text: "New photos" });
        sec.createDiv({ cls: "cm-sub", text: "Where do your phone photos land on this computer? Nicrosil shrinks new ones into Sources/Scans for you. Your originals are never changed." });
        const row = sec.createDiv({ cls: "cm-trw-dir" });
        const inp = row.createEl("input", { type: "text", attr: { placeholder: "C:\\Users\\you\\Pictures\\Notes", "aria-label": "Photos folder" } });
        inp.value = this.plugin.photosDir();
        const save = row.createEl("button", { cls: "cm-mini", text: "Save" });
        const done = async () => {
          this.plugin.settings.photosDir = inp.value.trim();
          await this.plugin.persist();
          trx.setDir = false; this.photoCache = null; trx.photoSel.clear();
          this.redrawTray();
        };
        save.addEventListener("click", done);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); done(); } });
        if (photos.state !== "unset") row.createEl("button", { cls: "cm-mini", text: "Cancel" }).addEventListener("click", () => { trx.setDir = false; this.redrawTray(); });
      } else if (photos.state === "unreadable") {
        sec.createDiv({ cls: "cm-tr-checkhead", text: "New photos" });
        sec.createDiv({ cls: "cm-sub", text: `Nicrosil can't open ${photos.dir}.` });
        sec.createEl("button", { cls: "cm-mini", text: "Change folder" }).addEventListener("click", () => { trx.setDir = true; this.redrawTray(); });
      } else {
        const shown = trx.showOld ? [...photos.fresh, ...photos.older] : photos.fresh;
        const hd = sec.createDiv({ cls: "cm-trw-head" });
        hd.createSpan({ cls: "cm-tr-checkhead", text: photos.fresh.length ? `New photos, not shrunk yet (${photos.fresh.length})` : "No new photos to shrink" });
        const acts = hd.createDiv({ cls: "cm-trw-acts" });
        if (photos.older.length) acts.createEl("button", { cls: "cm-mini", text: trx.showOld ? "Hide older" : `Show older (${photos.older.length})` }).addEventListener("click", () => { trx.showOld = !trx.showOld; this.redrawTray(); });
        acts.createEl("button", { cls: "cm-mini", text: "Folder" }).addEventListener("click", () => { trx.setDir = true; this.redrawTray(); });
        const pick = [...trx.photoSel].length;
        const go = acts.createEl("button", { cls: "cm-mini cm-trx-accent", text: trx.shrinking ? "Shrinking…" : pick ? `Shrink ${pick} now` : "Shrink now" });
        go.disabled = trx.shrinking || !pick;
        go.addEventListener("click", () => this.shrinkNow());
        if (shown.length) {
          const box = sec.createDiv({ cls: "cm-trw-list" });
          shown.forEach((p) => {
            const row = box.createEl("label", { cls: "cm-trw-row" + (p.ok ? "" : " is-off") });
            const cb = row.createEl("input", { type: "checkbox" });
            cb.checked = trx.photoSel.has(p.name);
            cb.disabled = !p.ok;
            cb.addEventListener("change", () => { if (cb.checked) trx.photoSel.add(p.name); else trx.photoSel.delete(p.name); this.redrawTray(); });
            row.createSpan({ cls: "cm-trw-name", text: p.name });
            row.createSpan({ cls: "cm-trw-meta", text: p.ok ? fileSize(p.size) : "can't shrink (HEIC)" });
          });
        }
        if (photos.heic) sec.createDiv({ cls: "cm-sub", text: `${photos.heic} HEIC photo${photos.heic === 1 ? "" : "s"} can't be shrunk without pillow-heif; export them as JPEG first.` });
      }
    }

    // scans waiting
    const sec = tray.createDiv({ cls: "cm-trw-sec" });
    const hd = sec.createDiv({ cls: "cm-trw-head" });
    hd.createSpan({ cls: "cm-tr-checkhead", text: `Scans not in a note yet (${list.length})` });
    const acts = hd.createDiv({ cls: "cm-trw-acts" });
    if (list.length) {
      acts.createEl("button", { cls: "cm-mini", text: "All" }).addEventListener("click", () => { list.forEach((f) => trx.sel.add(scanKey(f.name))); this.redrawTray(); });
      acts.createEl("button", { cls: "cm-mini", text: "None" }).addEventListener("click", () => { trx.sel.clear(); this.redrawTray(); });
    }
    if (!list.length) sec.createDiv({ cls: "cm-sub", text: "Every scan in Sources/Scans is in a note." });
    else {
      const box = sec.createDiv({ cls: "cm-trw-list" });
      list.forEach((f, i) => {
        const row = box.createEl("label", { cls: "cm-trw-row" });
        const cb = row.createEl("input", { type: "checkbox" });
        cb.checked = trx.sel.has(scanKey(f.name));
        cb.addEventListener("click", (e) => {
          // shift-click ticks (or unticks) everything between this scan and the last one clicked
          if (e.shiftKey && trx.last >= 0) {
            const [a, b] = [Math.min(trx.last, i), Math.max(trx.last, i)];
            for (let j = a; j <= b; j++) { if (cb.checked) trx.sel.add(scanKey(list[j].name)); else trx.sel.delete(scanKey(list[j].name)); }
          } else if (cb.checked) trx.sel.add(scanKey(f.name)); else trx.sel.delete(scanKey(f.name));
          trx.last = i;
          this.redrawTray();
        });
        row.createSpan({ cls: "cm-trw-name", text: f.name });
        row.createSpan({ cls: "cm-trw-meta", text: fileSize(f.stat.size) });
      });
    }
    const foot = tray.createDiv({ cls: "cm-trw-foot" });
    const n = trx.sel.size;
    foot.createSpan({ cls: "cm-tr-count", text: n ? `${n} scan${n === 1 ? "" : "s"} ticked` : "Tick the pages from one class session, then transcribe them." });
    const goes = foot.createDiv({ cls: "cm-trw-gowrap" });
    if (!Platform.isMobile) this.drawUsageButton(goes);
    const go = goes.createEl("button", { cls: "cm-trx-go", text: n ? `✦ Transcribe ${n}` : "✦ Transcribe scans" });
    go.addEventListener("click", () => this.openTrx());
    return tray;
  },

  /** Draws just the tray again (and the panel's counts), so ticking a box doesn't reload the scan. */
  redrawTray() {
    const old = this.trayHost;
    if (old && old.isConnected) {
      const holder = createDiv();
      const t = this.drawTray(holder, this.plugin.scansWaiting(this.plugin.pendingTranscriptions()));
      old.replaceWith(t);
    }
    if (this.trx && this.trx.open && this.trx.mode === "form") this.drawTrx();
  },

  /** A small Usage button beside Transcribe. The meter opens above it when clicked and is not on screen otherwise (4.6.2). The open state survives the tray being redrawn. */
  drawUsageButton(wrap) {
    const trx = this.trxState();
    const holder = wrap.createDiv({ cls: "cm-trw-usagewrap" });
    const btn = holder.createEl("button", { cls: "cm-mini cm-trw-usagebtn" + (trx.usageOpen ? " is-on" : ""), text: "Usage", attr: { "aria-label": "Show how much of my plan I have used", "aria-expanded": trx.usageOpen ? "true" : "false" } });
    btn.addEventListener("click", () => { if (trx.usageOpen) this.closeUsage(); else this.openUsage(); });
    this.usageBtn = btn;
    this.usageEl = null;
    if (trx.usageOpen) {
      this.usageEl = holder.createDiv({ cls: "cm-qusage cm-trw-usagepop" });
      drawUsageMeter(this.usageEl, this.plugin);
    }
  },

  openUsage() {
    const trx = this.trxState();
    const holder = this.usageBtn && this.usageBtn.parentElement;
    if (trx.usageOpen || !holder || !holder.isConnected) return;
    trx.usageOpen = true;
    this.usageBtn.addClass("is-on");
    this.usageBtn.setAttr("aria-expanded", "true");
    this.usageEl = holder.createDiv({ cls: "cm-qusage cm-trw-usagepop" });
    drawUsageMeter(this.usageEl, this.plugin);
    this.plugin.refreshUsage({ force: true }); // a fresh figure; the open meter redraws when it arrives
  },

  closeUsage() {
    const trx = this.trxState();
    trx.usageOpen = false;
    if (this.usageEl) this.usageEl.remove();
    this.usageEl = null;
    if (this.usageBtn) { this.usageBtn.removeClass("is-on"); this.usageBtn.setAttr("aria-expanded", "false"); }
  },

  async shrinkNow() {
    const trx = this.trxState();
    const names = [...trx.photoSel];
    if (!names.length || trx.shrinking) return;
    trx.shrinking = true;
    this.redrawTray();
    let r;
    try { r = await this.plugin.shrinkPhotos(names); } catch (e) { r = { ok: false, message: String(e && e.message || e) }; }
    trx.shrinking = false;
    this.photoCache = null;
    if (r.ok) { r.scans.forEach((n) => { trx.sel.add(scanKey(n)); trx.names.set(scanKey(n), n); }); trx.photoSel.clear(); }
    new Notice(r.message, r.ok ? 6000 : 12000);
    await this.redrawTray();
  },

  /* --- the panel over the note --- */

  openTrx() {
    if (Platform.isMobile) { new Notice("Transcribing needs Obsidian on a computer: it runs Claude Code."); return; }
    const trx = this.trxState();
    if (!trx.run) { trx.mode = "form"; trx.err = ""; }
    trx.open = true;
    this.drawTrx();
  },

  closeTrx() {
    const trx = this.trxState();
    if (trx.run) return;
    trx.open = false; trx.err = ""; trx.mode = "form";
    this.drawTrx();
  },

  removeTrx() {
    if (this.trxEl) this.trxEl.remove();
    this.trxEl = null;
    document.querySelectorAll(".cm-trx-open").forEach((el) => el.removeClass("cm-trx-open"));
  },

  /** Stops anything running and takes the panel away (the queue is closing). */
  trxStop() {
    const trx = this.trx;
    if (trx && trx.run && trx.run.cancel) trx.run.cancel();
    if (this.trxTimer) { window.clearInterval(this.trxTimer); this.trxTimer = null; }
    if (trx) { trx.run = null; trx.open = false; }
    this.removeTrx();
  },

  /** (Re)draws the panel from the state: over the note when there is one, over the whole queue when nothing is waiting. */
  drawTrx() {
    this.removeTrx();
    if (this.trxTimer) { window.clearInterval(this.trxTimer); this.trxTimer = null; }
    const trx = this.trxState();
    if (!trx.open) return;
    const v = this.noteView();
    const onNote = !!(v && v.containerEl && v.containerEl.isConnected);
    const host = onNote ? v.containerEl : this.contentEl;
    const el = createDiv({ cls: "cm-trx" });
    if (onNote) {
      host.addClass("cm-trx-open");
      const bar = host.querySelector(":scope > .cm-tr-bar");
      if (bar) bar.after(el); else host.appendChild(el);
    } else host.appendChild(el);
    this.trxEl = el;
    if (trx.mode === "run" && trx.run) this.drawTrxRun(el, trx.run);
    else if (trx.mode === "error") this.drawTrxError(el);
    else this.drawTrxForm(el);
  },

  drawTrxForm(el) {
    const trx = this.trxState();
    const s = this.plugin.settings;
    const courses = trCourses(this.app);
    if (!courses.some((c) => c.key === trx.course)) trx.course = courses.length ? courses[0].key : "";
    const photoN = trx.shrink ? [...trx.photoSel].length : 0;
    const total = trx.sel.size + photoN;

    const head = el.createDiv({ cls: "cm-trx-head" });
    head.createDiv({ cls: "cm-trx-label", text: "New draft from scans" });
    head.createEl("h4", { cls: "cm-tin-gradient-style cm-trx-title", text: total ? `Transcribe ${total} page${total === 1 ? "" : "s"}` : "Transcribe scans" });
    head.createDiv({ cls: "cm-sub", text: "Claude reads the pages and writes a draft note. You still check every line against the scan, and only you can verify it." });

    const grid = el.createDiv({ cls: "cm-trx-grid" });
    const row = (label) => { grid.createDiv({ cls: "cm-trx-label", text: label }); return grid.createDiv({ cls: "cm-trx-field" }); };

    const cf = row("Course");
    if (!courses.length) cf.createSpan({ cls: "cm-sub", text: "No course pages found in the Tinmind." });
    else {
      const sel = cf.createEl("select", { cls: "dropdown cm-tr-select" });
      courses.forEach((c) => { const o = sel.createEl("option", { text: `${c.course} · ${c.semester}`, value: c.key }); if (c.key === trx.course) o.selected = true; });
      sel.addEventListener("change", () => { trx.course = sel.value; s.trCourse = sel.value; this.plugin.persist(); });
      cf.createSpan({ cls: "cm-sub", text: "The draft goes in this course's folder" });
    }

    const df = row("Session");
    const din = df.createEl("input", { type: "text", cls: "cm-trx-date", attr: { placeholder: "Read it from the page", "aria-label": "Class date, MM-DD-YY" } });
    din.value = trx.date;
    const dhint = df.createSpan({ cls: "cm-sub", text: "or type the class date, MM-DD-YY" });
    din.addEventListener("input", () => {
      trx.date = din.value.trim();
      const ok = !trx.date || !!normDate(trx.date);
      dhint.setText(ok ? "or type the class date, MM-DD-YY" : "That isn't a date I can read (try 11-24-26).");
      dhint.toggleClass("is-bad", !ok);
    });

    const mf = row("Model");
    const effortRow = { f: null };
    QUERY_MODELS.forEach(([k, name]) => {
      const b = mf.createEl("button", { cls: "cm-trx-chip" + (trx.model === k ? " is-on" : ""), text: name });
      b.addEventListener("click", () => { trx.model = k; s.trModel = k; this.plugin.persist(); this.drawTrx(); });
    });
    if (trx.model !== "haiku") {
      const ef = row("Effort");
      QUERY_EFFORTS.forEach(([k, name]) => {
        const b = ef.createEl("button", { cls: "cm-trx-chip" + (trx.effort === k ? " is-on" : ""), text: name });
        b.addEventListener("click", () => { trx.effort = k; s.trEffort = k; this.plugin.persist(); this.drawTrx(); });
      });
    }

    const xf = row("Extra");
    const lab = xf.createEl("label", { cls: "cm-trx-check" });
    const cb = lab.createEl("input", { type: "checkbox" });
    cb.checked = trx.shrink;
    cb.addEventListener("change", () => { trx.shrink = cb.checked; s.trShrink = cb.checked; this.plugin.persist(); this.drawTrx(); });
    lab.createSpan({ text: trx.photoSel.size ? `Shrink the ${trx.photoSel.size} ticked new photo${trx.photoSel.size === 1 ? "" : "s"} first (runs on this computer, uses no tokens)` : "Shrink new photos first (none ticked in the tray)" });
    xf.createDiv({ cls: "cm-sub", text: "Flagging every drawing is always on; it comes from the schema." });

    const sug = suggestTranscribe(total);
    if (sug) {
      const box = el.createDiv({ cls: "cm-trx-suggest" });
      box.createSpan({ cls: "cm-trx-spark", text: "✦" });
      const t = box.createDiv();
      t.createEl("b", { text: `Suggested: ${(QUERY_MODELS.find((m) => m[0] === sug.model) || [0, sug.model])[1]} · ${(QUERY_EFFORTS.find((m) => m[0] === sug.effort) || [0, sug.effort])[1]}. ` });
      t.appendText(sug.why);
      if (sug.model !== trx.model || sug.effort !== trx.effort) {
        box.createEl("button", { cls: "cm-mini", text: "Use it" }).addEventListener("click", () => { trx.model = sug.model; trx.effort = sug.effort; s.trModel = sug.model; s.trEffort = sug.effort; this.plugin.persist(); this.drawTrx(); });
      }
    }

    if (trx.err) el.createDiv({ cls: "cm-trx-err", text: trx.err });

    const foot = el.createDiv({ cls: "cm-trx-foot" });
    const go = foot.createEl("button", { cls: "cm-trx-go", text: total ? `Transcribe ${total} page${total === 1 ? "" : "s"}` : "Transcribe" });
    const bad = !courses.length || (trx.date && !normDate(trx.date));
    go.disabled = !total || bad;
    go.setAttr("title", !total ? "Tick the scans to transcribe in the tray under the scan" : "");
    go.addEventListener("click", () => this.startTrx());
    foot.createEl("button", { text: "Not now" }).addEventListener("click", () => this.closeTrx());
    foot.createSpan({ cls: "cm-sub cm-trx-fine", text: "Claude can only read the scans. Nicrosil writes the note and the log entry." });
  },

  drawTrxError(el) {
    const trx = this.trxState();
    el.createDiv({ cls: "cm-trx-head" }).createDiv({ cls: "cm-trx-label", text: "Something went wrong" });
    el.createDiv({ cls: "cm-trx-err", text: trx.err || "Claude Code stopped." });
    const foot = el.createDiv({ cls: "cm-trx-foot" });
    foot.createEl("button", { cls: "cm-trx-go", text: "Back" }).addEventListener("click", () => { trx.mode = "form"; trx.open = trx.lastKind === "transcribe"; this.drawTrx(); });
    foot.createEl("button", { text: "Close" }).addEventListener("click", () => this.closeTrx());
  },

  drawTrxRun(el, run) {
    const head = el.createDiv({ cls: "cm-trx-head" });
    head.createDiv({ cls: "cm-trx-label", text: "Claude is working" });
    head.createEl("h4", { cls: "cm-tin-gradient-style cm-trx-title", text: run.title });
    if (run.sub) head.createDiv({ cls: "cm-sub", text: run.sub });
    const chips = el.createDiv({ cls: "cm-trx-chips" });
    chips.createSpan({ cls: "cm-trx-pill", text: (QUERY_MODELS.find((m) => m[0] === run.model) || [0, run.model])[1] });
    if (run.model !== "haiku" && run.effort) chips.createSpan({ cls: "cm-trx-pill", text: `${(QUERY_EFFORTS.find((m) => m[0] === run.effort) || [0, run.effort])[1]} effort` });
    const steps = el.createDiv({ cls: "cm-trx-steps" });
    run.steps.slice(-9).forEach((t, i, a) => steps.createDiv({ cls: "cm-trx-step" + (i === a.length - 1 ? " is-now" : " is-done"), text: t }));
    const bar = el.createDiv({ cls: "cm-progress" }).createDiv({ cls: "cm-progress-fill" });
    bar.style.width = `${run.pct}%`;
    const foot = el.createDiv({ cls: "cm-trx-foot" });
    const elapsed = foot.createSpan({ cls: "cm-sub", text: "Elapsed 0:00" });
    foot.createEl("button", { text: "Cancel" }).addEventListener("click", () => { if (run.cancel) run.cancel(); });
    this.trxRefs = { steps, bar, elapsed, run };
    const tick = () => {
      const s = Math.round((Date.now() - run.startedAt) / 1000);
      elapsed.setText(`Elapsed ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
    };
    tick();
    this.trxTimer = window.setInterval(tick, 1000);
  },

  pushStep(run, text, pct) {
    run.steps.push(text);
    if (pct != null) run.pct = pct;
    const r = this.trxRefs;
    if (!r || r.run !== run || !r.steps.isConnected) return;
    r.steps.querySelectorAll(".is-now").forEach((n) => { n.removeClass("is-now"); n.addClass("is-done"); });
    r.steps.createDiv({ cls: "cm-trx-step is-now", text });
    while (r.steps.children.length > 9) r.steps.firstChild.remove();
    r.steps.scrollTop = r.steps.scrollHeight;
    r.bar.style.width = `${run.pct}%`;
  },

  /**
   * Runs one Claude Code job behind the progress card, then hands its reply to `o.finish`.
   * o: { kind, title, sub, model, effort, prompt, cap (pages to read, for the bar), finish(res) }. Returns the reply, or null if it failed or was cancelled.
   */
  async runAi(o) {
    const trx = this.trxState();
    if (trx.run) { new Notice("Claude is already working on something here."); return null; }
    if (Platform.isMobile) { new Notice("This needs Obsidian on a computer: it runs Claude Code."); return null; }
    const run = { title: o.title, sub: o.sub, model: o.model, effort: o.effort, steps: [], pct: 4, startedAt: Date.now(), reads: 0, cap: Math.max(1, o.cap || 1), cancel: null };
    trx.run = run; trx.open = true; trx.mode = "run"; trx.lastKind = o.kind; trx.err = "";
    this.drawTrx();
    this.pushStep(run, "Starting Claude Code");
    const job = this.plugin.claudeJob(trClaudeArgs({ model: o.model, effort: o.effort, sessionId: newUuid() }), o.prompt, (e) => {
      if (e.type === "init") this.pushStep(run, "Reading the rules");
      else if (e.type === "tool") {
        if (/^Read\b/.test(e.text) && /\.(jpe?g|png|webp)\b/i.test(e.text)) run.reads++;
        this.pushStep(run, e.text, Math.min(90, 8 + (run.reads / run.cap) * 80));
      } else if (e.type === "writing") this.pushStep(run, "Writing it out", Math.max(run.pct, 92));
    });
    run.cancel = () => job.cancel();
    let res = null, failure = "";
    try { res = await job.done; } catch (e) { failure = e && e.cancelled ? "Cancelled. Nothing was written." : String(e && e.message || e); }
    trx.run = null;
    if (this.trxTimer) { window.clearInterval(this.trxTimer); this.trxTimer = null; }
    if (!res) { trx.mode = "error"; trx.err = failure; trx.open = true; this.drawTrx(); return null; }
    trx.open = false; trx.mode = "form";
    this.drawTrx();
    try { await o.finish(res); }
    catch (e) { console.error("Nicrosil: finishing a Claude Code job failed", e); new Notice(`Claude answered, but Nicrosil couldn't use the answer: ${e.message}`, 12000); }
    return res;
  },

  /* --- transcribing --- */

  async startTrx() {
    const trx = this.trxState();
    const s = this.plugin.settings;
    const course = trCourses(this.app).find((c) => c.key === trx.course);
    if (!course) { trx.err = "Pick a course first."; this.drawTrx(); return; }
    const date = trx.date ? normDate(trx.date) : "";
    const photoNames = trx.shrink ? [...trx.photoSel] : [];
    let shrunk = 0;

    // 1. shrink the ticked new photos, if asked
    if (photoNames.length) {
      trx.shrinking = true;
      new Notice(`Shrinking ${photoNames.length} photo${photoNames.length === 1 ? "" : "s"}…`, 3000);
      let r;
      try { r = await this.plugin.shrinkPhotos(photoNames); } catch (e) { r = { ok: false, message: String(e && e.message || e) }; }
      trx.shrinking = false;
      this.photoCache = null;
      if (!r.ok) { trx.err = r.message; trx.mode = "form"; trx.open = true; this.drawTrx(); return; }
      r.scans.forEach((n) => { trx.sel.add(scanKey(n)); trx.names.set(scanKey(n), n); });
      trx.photoSel.clear();
      shrunk = r.scans.length;
    }

    // 2. the pages, by the names the scans have in Sources/Scans, in photographed order
    const byKey = new Map();
    this.plugin.scanFiles().forEach((f) => byKey.set(scanKey(f.name), f.name));
    const pages = [...trx.sel].map((k) => byKey.get(k) || trx.names.get(k) || k).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!pages.length) { trx.err = "No scans are ticked."; trx.mode = "form"; trx.open = true; this.drawTrx(); return; }

    const sample = await trSample(this.app, course.folder);
    const prompt = buildTranscribePrompt({ pages, course: course.course, semester: course.semester, date, sample });
    const model = trx.model, effort = model === "haiku" ? "" : trx.effort;
    const label = `${pages.length} page${pages.length === 1 ? "" : "s"}`;
    await this.runAi({
      kind: "transcribe", title: `Transcribing ${label} of ${course.course}`,
      sub: "Claude reads each scan and writes it out. Nothing is saved until it finishes, and every draft waits for your check.",
      model, effort, prompt, cap: pages.length,
      finish: (res) => this.finishTranscribe(res, { course, pages, date, model, effort, shrunk, startedAt: Date.now() }),
    });
  },

  /** Claude's reply came back: write each draft note, add the log entry, and open the first note in the queue. */
  async finishTranscribe(res, ctx) {
    const p = this.plugin;
    const { notes, problems } = parseTranscribeReply(res.text);
    if (!notes.length) {
      const trx = this.trxState();
      trx.mode = "error"; trx.open = true; trx.lastKind = "transcribe";
      trx.err = "Claude answered, but not in the format Nicrosil needs (blocks starting === NOTE ... ===), so no note was written. Its reply:\n\n" + String(res.text || "").slice(0, 600);
      this.drawTrx();
      return;
    }
    const known = new Map(ctx.pages.map((n) => [scanKey(n), n]));
    const extra = [...problems];
    const files = [], names = [];
    let drawings = 0, unsure = 0;
    await p.tinEnsureFolder(ctx.course.folder);
    for (const n of notes) {
      let pages = [...new Set(n.pages.map((x) => known.get(scanKey(x))).filter(Boolean))];
      if (!pages.length) { pages = ctx.pages.slice(); extra.push("A note didn't say which scans it came from, so all the ticked scans are listed on it."); }
      const date = n.date || ctx.date;
      if (!date) extra.push("A note has no class date; its name says so.");
      const name = cleanName(date ? `${ctx.course.course} ${date}` : `${ctx.course.course} date unknown`);
      const path = p.tinUniquePath(ctx.course.folder, name, ".md");
      const text = transcriptionNote({ course: ctx.course.course, semester: ctx.course.semester, pages, body: n.body });
      const f = await this.app.vault.create(path, text);
      files.push(f); names.push(f.basename);
      const c = noteChecks(text);
      drawings += c.drawings; unsure += c.unsure;
    }
    const used = new Set();
    notes.forEach((n) => n.pages.forEach((x) => { if (known.has(scanKey(x))) used.add(scanKey(x)); }));
    const unused = ctx.pages.filter((n) => !used.has(scanKey(n)));
    if (unused.length && notes.every((n) => n.pages.length)) extra.push(`${unused.length} ticked scan${unused.length === 1 ? " is" : "s are"} in no note: ${unused.slice(0, 4).join(", ")}${unused.length > 4 ? "…" : ""}.`);
    try {
      await p.appendLog(transcribeLogEntry({ course: ctx.course.course, date: today(), model: res.model || ctx.model, effort: ctx.effort, pages: ctx.pages, notes: names, drawings, unsure, problems: extra, shrunk: ctx.shrunk }));
    } catch (e) { new Notice("The notes were written, but Nicrosil couldn't add the log entry: " + e.message, 10000); }
    p.settings.trRuns = p.settings.trRuns || {};
    files.forEach((f) => { p.settings.trRuns[f.path] = { model: res.model || ctx.model, effort: ctx.effort, pages: ctx.pages.length, at: Date.now() }; });
    p.persist();
    for (let i = 0; i < 25; i++) {
      if (files.every((f) => { const fm = (this.app.metadataCache.getFileCache(f) || {}).frontmatter; return fm && String(fm.transcription || "").toLowerCase() === "draft"; })) break;
      await trSleep(150);
    }
    const trx = this.trxState();
    trx.sel.clear();
    p.scheduleTinRefresh();
    p.dashboards.forEach((r) => r());
    this.path = files[0].path; this.page = 0; this.cropFor = null; this.cropRect = null;
    await this.render();
    new Notice(`Drafted ${notes.length} note${notes.length === 1 ? "" : "s"} from ${ctx.pages.length} scan${ctx.pages.length === 1 ? "" : "s"}: ${drawings} drawing${drawings === 1 ? "" : "s"} to decide on, ${unsure} unsure word${unsure === 1 ? "" : "s"}.${extra.length ? " Claude flagged: " + extra.join(" ") : ""}`, extra.length ? 15000 : 8000);
  },

  /* --- one drawing, one set of unsure words --- */

  async recreateWithClaude(d) {
    if (Platform.isMobile) { new Notice("This needs Obsidian on a computer: it runs Claude Code."); return; }
    await this.saveNote();
    const cur = this.drawingNow(d);
    const scan = cur.scan || this.pages[this.page];
    const file = scan ? this.scanFile(scan) : null;
    if (!file) { new Notice("That drawing's scan isn't in Sources/Scans, so Claude has nothing to look at. Keep a screenshot or leave it out."); return; }
    const s = this.plugin.settings;
    const model = s.trModel || "sonnet", effort = model === "haiku" ? "" : (s.trEffort || "medium");
    const label = cur.label || "Drawing";
    await this.runAi({
      kind: "recreate", title: `Recreating “${label}”`,
      sub: "Claude looks at the scan and redraws it as Mermaid, a table or a list. You compare it with the scan and click Looks right.",
      model, effort, cap: 1, prompt: buildRecreatePrompt({ scan: file.name, label, body: cur.body }),
      finish: async (res) => {
        const r = parseRecreateReply(res.text);
        if (!r.ok) { new Notice(`Claude couldn't recreate “${label}”: ${r.why}. Keep a screenshot instead, or leave it out.`, 12000); return; }
        const now = parseDrawings(this.text()).find((x) => x.label === cur.label && x.scan === cur.scan);
        if (!now) { new Notice("The drawing's flag moved or was changed while Claude worked, so nothing was put in the note."); return; }
        const lines = [...r.md.split(/\r?\n/), `%% recreated: ${file.name} | ${label} %%`];
        await this.applyText(replaceLines(this.text(), now.start, now.end, lines));
        this.renderChecks();
        new Notice(`Recreated “${label}”. Compare it with the scan, then click Looks right.`, 8000);
      },
    });
  },

  async recheckUnsure() {
    if (Platform.isMobile) { new Notice("This needs Obsidian on a computer: it runs Claude Code."); return; }
    await this.saveNote();
    const text = this.text();
    const list = findUnsure(text);
    if (!list.length) { new Notice("No unsure words left."); return; }
    const scans = this.pages.filter((n) => this.scanFile(n));
    if (!scans.length) { new Notice("This note's scans aren't in Sources/Scans, so Claude has nothing to look at."); return; }
    const s = this.plugin.settings;
    const model = s.trModel || "sonnet", effort = model === "haiku" ? "" : "high";
    const items = list.map((u, i) => ({ n: i + 1, text: u.text, context: unsureContext(text, u) }));
    await this.runAi({
      kind: "recheck", title: `Looking again at ${list.length} unsure word${list.length === 1 ? "" : "s"}`,
      sub: "Claude re-reads the scan for each one and offers a better guess. Every guess stays marked, so you decide.",
      model, effort, cap: scans.length, prompt: buildRecheckPrompt({ scans, items }),
      finish: async (res) => {
        const fixes = parseRecheckReply(res.text, list.length);
        const now = this.text(), nowList = findUnsure(now);
        if (nowList.length !== list.length || nowList.some((u, i) => u.text !== list[i].text)) { new Notice("The unsure words changed while Claude looked, so nothing was changed. Try again."); return; }
        const out = applyRecheck(now, nowList, fixes);
        if (!out.changed) { new Notice("Claude had no better readings. The unsure words are as they were.", 8000); return; }
        await this.applyText(out.text);
        this.renderChecks();
        new Notice(`Claude offered a new reading for ${out.changed} of ${list.length} unsure word${list.length === 1 ? "" : "s"}. They are still marked: check each against the scan.`, 10000);
      },
    });
  },

  /** A line above the note saying Claude drafted it (from what Nicrosil recorded when it did). */
  drawAiStrip(bar, file) {
    const r = this.plugin.settings.trRuns && this.plugin.settings.trRuns[file.path];
    if (!r) return;
    const row = bar.createDiv({ cls: "cm-trb-ai" });
    row.createSpan({ cls: "cm-trx-spark", text: "✦" });
    const name = (list, k) => (list.find((x) => x[0] === k) || [k, k])[1];
    row.createSpan({ text: `Draft by Claude · ${name(QUERY_MODELS, String(r.model).replace(/^claude-/, "").split("-")[0]) || r.model}${r.effort ? ` · ${name(QUERY_EFFORTS, r.effort)}` : ""} · ${r.pages} page${r.pages === 1 ? "" : "s"} · ${new Date(r.at).toLocaleDateString([], { month: "short", day: "numeric" })}` });
    row.createSpan({ cls: "cm-trb-ai-note", text: "You check it, you verify it" });
  },
});
