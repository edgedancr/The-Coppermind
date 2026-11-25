/* ---------- Transcription queue (3.16.0) ---------- */

/** Asks before a transcription is verified: it moves its scans to the trash. `unsure` unsure words need a tick. */
/** Checks a new name typed for a note in the transcription queue (3.17.0). Returns { ok, name } or { ok: false, error }. */
function cleanNoteName(raw) {
  const n = String(raw || "").trim().replace(/\.md$/i, "").trim();
  if (!n) return { ok: false, error: "A note needs a name." };
  const bad = n.match(/[\\/:*?"<>|#^\[\]]/);
  if (bad) return { ok: false, error: `A note's name can't contain ${bad[0]}` };
  if (n.startsWith(".")) return { ok: false, error: "A note's name can't start with a dot." };
  return { ok: true, name: n };
}

class TranscribeVerifyModal extends Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts; // { name, scans: [{ name, keep }], unsure, onConfirm }
  }

  onOpen() {
    const { name, scans, unsure, onConfirm } = this.opts;
    const el = this.contentEl;
    this.modalEl.addClass("nicrosil-modal");
    el.empty();
    el.createEl("h2", { text: `Verify “${name}”?` });
    el.createDiv({
      cls: "cm-sub",
      text: "This means you checked the transcription against the scan. It removes the transcription and scan_pages properties from the note and adds a log entry. The scans below go to the trash, so Obsidian's trash setting decides whether they can still be recovered.",
    });
    const goners = scans.filter((s) => !s.keep);
    const keepers = scans.filter((s) => s.keep);
    if (goners.length) {
      el.createDiv({ text: `${goners.length} scan${goners.length === 1 ? "" : "s"} will be moved to the trash:` });
      const ul = el.createEl("ul", { cls: "cm-links" });
      goners.forEach((s) => ul.createEl("li", { text: s.name }));
    }
    if (keepers.length) {
      el.createDiv({ text: `${keepers.length} stay, because another unverified note lists the same page:` });
      const ul = el.createEl("ul", { cls: "cm-links" });
      keepers.forEach((s) => ul.createEl("li", { text: s.name }));
    }
    let confirmed = !unsure;
    if (unsure) {
      const row = el.createDiv({ cls: "cm-check" });
      const cb = row.createEl("input", { type: "checkbox" });
      row.createSpan({ text: `${unsure} unsure word${unsure === 1 ? " is" : "s are"} still in the note. Verify anyway (the scan will be gone).` });
      cb.addEventListener("change", () => { confirmed = cb.checked; refresh(); });
    }
    const buttons = el.createDiv({ cls: "cm-buttons" });
    buttons.createSpan({ cls: "cm-hint", text: "Ctrl+Enter to confirm" });
    buttons.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    const go = buttons.createEl("button", { text: goners.length ? "Verify and delete scans" : "Verify", cls: "mod-cta" });
    go.addEventListener("click", async () => { go.disabled = true; this.close(); await onConfirm(); });
    confirmOnCtrlEnter(this, go);
    const refresh = () => { go.disabled = !confirmed; };
    refresh();
  }

  onClose() { this.contentEl.empty(); }
}

/**
 * The Transcription queue (3.28.0): a locked split. The scan is on the left (this view); the note is on the right in an ordinary Obsidian editor
 * (Live Preview, spellcheck, every plugin), with the review bar (the note picker, previous and next, the course folder, the unsure words, Verify, Skip, Discard, Close) across its top. The two
 * panes are made by the queue and have no tabs; every other pane in the main area is hidden while the queue is open and comes back when it closes.
 * The note is never held in a text box of our own: edits to it (leaving out a drawing, accepting a guess, keeping a screenshot) are made in the editor,
 * so Obsidian's undo and autosave look after them.
 */
class TranscribeView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.path = null;       // the note being reviewed
    this.noteLeaf = null;   // the pane that holds it: an ordinary Obsidian editor
    this.bar = null;        // the review bar, drawn at the top of that pane
    this.barSig = "";       // what the bar was last drawn for (the note), to tell when it needs drawing again
    this.pages = [];        // the scan names the note lists
    this.page = 0;          // which of them is showing
    this.zoom = 100;        // scan width as a percent of its pane
    this.cropFor = null;    // the drawing a screenshot is being chosen for
    this.cropRect = null;   // { x, y, w, h } as fractions of the scan
    this.trayOpen = true;   // the drawings under the scan are open
    this.decisions = {};    // note path -> [{ label, decision }], for the log
    this.busy = false;
    this.building = false;  // the queue is making or filling its own panes, so Obsidian's "active pane changed" is not me leaving
    this.closing = false;
    this.sig = "";          // what the list looked like when it was last drawn
    this.checksSoon = debounce(() => this.renderChecks(), 250, true);
    this.watchSoon = debounce(() => this.checkNoteLeaf(), 150, true);
    // a note came or went, or a scan did: redraw, unless I am choosing a screenshot
    this.refreshSoon = debounce(() => {
      if (this.cropFor || this.building || this.closing) return;
      if (this.listSig() !== this.sig) this.render();
    }, 400, true);
  }

  /** A short description of the queue (which notes, their scans, how many scans are not in a note), to tell when it has changed. */
  listSig() {
    const items = this.plugin.pendingTranscriptions();
    return items.map((i) => i.file.path + "|" + i.pages.join(",")).join("¦") + "¦" + this.plugin.scansWaiting(items).length;
  }

  getViewType() { return TR_VIEW_TYPE; }
  getDisplayText() { return "Transcription scan"; }
  getIcon() { return "scan-text"; }

  async onOpen() {
    const ws = this.app.workspace;
    this.containerEl.addClass("cm-tr-leaf");
    this.registerEvent(this.app.metadataCache.on("changed", (f) => this.onNoteChanged(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => { if (f.path.startsWith(NOTES_DIR) || f.path.startsWith(SCAN_DIR)) this.refreshSoon(); }));
    this.registerEvent(this.app.vault.on("create", (f) => { if (f.path.startsWith(SCAN_DIR)) this.refreshSoon(); }));
    // a note was renamed (here, or anywhere): keep showing it under its new name
    this.registerEvent(this.app.vault.on("rename", (f, oldPath) => {
      if (!f.path.startsWith(NOTES_DIR) && !oldPath.startsWith(NOTES_DIR)) return;
      if (oldPath === this.path) this.path = f.path;
      if (this.decisions[oldPath]) { this.decisions[f.path] = this.decisions[oldPath]; delete this.decisions[oldPath]; }
      this.refreshSoon();
    }));
    // typing in the note: the drawing and unsure-word counts follow
    this.registerEvent(ws.on("editor-change", (ed, info) => { if (info && info.file && info.file.path === this.path) this.checksSoon(); }));
    this.registerEvent(ws.on("layout-change", () => this.watchSoon()));
    this.registerEvent(ws.on("file-open", () => this.watchSoon()));
    this.registerEvent(ws.on("active-leaf-change", (leaf) => this.onLeafChange(leaf)));
    await this.render();
  }

  async onClose() {
    await this.closeLayout();
    this.contentEl.empty();
  }

  /* --- the two panes --- */

  noteView() {
    const l = this.noteLeaf;
    return l && l.view instanceof MarkdownView ? l.view : null;
  }

  leafAlive(l) {
    if (!l) return false;
    let hit = false;
    this.app.workspace.iterateAllLeaves((x) => { if (x === l) hit = true; });
    return hit;
  }

  /** The note as it is in the editor now (properties included). Empty when the right pane isn't showing the queue's note. */
  text() {
    const v = this.noteView();
    return v && v.file && v.file.path === this.path ? v.editor.getValue() : "";
  }

  async saveNote() {
    const v = this.noteView();
    if (!v || !v.file) return;
    try { await v.save(); } catch (e) { console.error("Nicrosil: couldn't save the note", e); }
  }

  /** Puts `next` in the editor in place of what is there, replacing only the part that differs, so the cursor and Obsidian's undo stay put. Then saves. */
  async applyText(next) {
    const v = this.noteView();
    if (!v || !v.file || v.file.path !== this.path) return false;
    const ed = v.editor, cur = ed.getValue();
    if (next === cur) return true;
    const max = Math.min(cur.length, next.length);
    let a = 0;
    while (a < max && cur.charCodeAt(a) === next.charCodeAt(a)) a++;
    let b = 0;
    while (b < max - a && cur.charCodeAt(cur.length - 1 - b) === next.charCodeAt(next.length - 1 - b)) b++;
    ed.replaceRange(next.slice(a, next.length - b), ed.offsetToPos(a), ed.offsetToPos(cur.length - b));
    await this.saveNote();
    return true;
  }

  /** Makes the right-hand pane, beside this one, if it isn't there. */
  async ensureNoteLeaf() {
    if (this.leafAlive(this.noteLeaf)) return;
    this.building = true;
    try {
      this.noteLeaf = this.app.workspace.createLeafBySplit(this.leaf, "vertical");
    } finally { this.building = false; }
  }

  async openInNote(file) {
    if (!this.leafAlive(this.noteLeaf) || !(file instanceof TFile)) return;
    this.building = true;
    try {
      await this.noteLeaf.openFile(file, { active: false, state: { mode: "source", source: false } }); // Live Preview
    } finally { this.building = false; }
  }

  /** Closes the right-hand pane (nothing is waiting, or the queue is closing). */
  async dropNoteLeaf() {
    if (this.leafAlive(this.noteLeaf)) {
      await this.saveNote();
      this.building = true;
      try { this.noteLeaf.detach(); } finally { this.building = false; }
    }
    this.noteLeaf = null;
  }

  /** The two panes get no tab strip, and every other pane in the main area is hidden until the queue closes. */
  syncLock() {
    const mine = new Set();
    [this.leaf, this.noteLeaf].forEach((l) => {
      const g = l && l.containerEl && l.containerEl.closest(".workspace-tabs");
      if (g) { g.classList.add("cm-tr-locked"); mine.add(g); }
    });
    this.app.workspace.iterateRootLeaves((l) => {
      const g = l.containerEl && l.containerEl.closest(".workspace-tabs");
      if (g && !mine.has(g)) g.classList.add("cm-tr-hidden");
    });
    document.body.classList.add("cm-tr-on");
  }

  unlock() {
    document.querySelectorAll(".workspace-tabs.cm-tr-hidden").forEach((el) => el.classList.remove("cm-tr-hidden"));
    document.querySelectorAll(".workspace-tabs.cm-tr-locked").forEach((el) => el.classList.remove("cm-tr-locked"));
    document.body.classList.remove("cm-tr-on");
  }

  removeBar() {
    if (this.bar) this.bar.remove();
    this.bar = null;
    this.barSig = "";
    this.verifyBtn = null;
    this.unsureEl = null;
  }

  async closeLayout() {
    if (this.closing) return;
    this.closing = true;
    try {
      await this.dropNoteLeaf();
      this.removeBar();
      this.unlock();
    } finally { this.closing = false; }
  }

  /** The Close button: both panes go and the main area is as it was. */
  async closeQueue() {
    await this.saveNote();
    this.leaf.detach();
  }

  /** The main area was moved to another page (the Dashboard, a link opened in a new tab): that is leaving the queue. */
  onLeafChange(leaf) {
    if (this.building || this.closing || !leaf || leaf === this.leaf || leaf === this.noteLeaf) return;
    if (leaf.getRoot && leaf.getRoot() !== this.app.workspace.rootSplit) return; // a sidebar
    this.closeQueue();
  }

  /** Something changed in the layout: the right pane may show another note, or have gone. */
  checkNoteLeaf() {
    if (this.building || this.closing || this.busy) return;
    const items = this.plugin.pendingTranscriptions();
    if (items.length && !this.leafAlive(this.noteLeaf)) { this.render(); return; } // the note's pane was closed (a discarded note takes it with it)
    const v = this.noteView();
    if (!v) return;
    const f = v.file;
    if (f && f.path !== this.path) {
      const hit = items.find((i) => i.file.path === f.path);
      if (hit) { this.path = f.path; this.page = 0; this.cropFor = null; this.cropRect = null; this.render(); return; } // another waiting note was opened: follow it
    }
    const sig = f ? f.path : "";
    if (sig !== this.barSig) this.drawBar();
    this.syncLock();
  }

  /* --- drawing the queue --- */

  currentItem(items) {
    return items.find((i) => i.file.path === this.path) || null;
  }

  async onNoteChanged(file) {
    if (!file || !file.path.startsWith(NOTES_DIR)) return;
    if (file.path === this.path && !this.cropFor) this.checksSoon();
    this.refreshSoon();
  }

  async render() {
    if (this.busy) { this.again = true; return; }
    this.busy = true;
    try {
      await this.draw();
    } finally {
      this.busy = false;
      if (this.again) { this.again = false; this.render(); }
    }
  }

  async draw() {
    const p = this.plugin;
    const root = this.contentEl;
    root.empty();
    root.addClass("cm-tr");
    const items = p.pendingTranscriptions();
    if (!this.currentItem(items)) { this.path = items.length ? items[0].file.path : null; this.page = 0; this.cropFor = null; }
    const item = this.currentItem(items);
    const waiting = p.scansWaiting(items);
    this.sig = this.listSig();

    if (!item) {
      await this.dropNoteLeaf();
      this.removeBar();
      const head = root.createDiv({ cls: "cm-tr-head" });
      head.createEl("h4", { text: "Transcription queue", cls: "cm-tin-gradient-style" });
      head.createEl("button", { cls: "cm-mini cm-tr-x", text: "Close" }).addEventListener("click", () => this.closeQueue());
      const empty = root.createDiv({ cls: "cm-tr-empty" });
      empty.createDiv({ cls: "cm-card-label", text: "Nothing to review" });
      empty.createDiv({ text: "When Claude transcribes scans, each note it makes (with transcription: draft in its properties) shows up here, next to its scan." });
      empty.createDiv({ cls: "cm-sub", text: waiting.length ? `${waiting.length} scan${waiting.length === 1 ? "" : "s"} in Sources/Scans are not in any note yet.` : "There are no scans waiting in Sources/Scans." });
      this.syncLock();
      return;
    }

    await this.ensureNoteLeaf();
    const nv = this.noteView();
    if (!nv || !nv.file || nv.file.path !== item.file.path) await this.openInNote(item.file);
    this.pages = item.pages;
    if (this.page >= this.pages.length) this.page = 0;

    this.scanPane = root.createDiv({ cls: "cm-tr-scan" });
    this.checksEl = root.createDiv({ cls: "cm-tr-checks" });
    this.syncLock();
    this.drawBar();
    this.renderChecks();
    await this.drawScan();
  }

  /** The review bar across the top of the note: where you are in the queue, the buttons, and the unsure words. */
  drawBar() {
    const p = this.plugin;
    const v = this.noteView();
    if (!v) return;
    let bar = this.bar;
    if (!bar || !bar.isConnected || bar.parentElement !== v.containerEl) {
      if (bar) bar.remove();
      bar = createDiv({ cls: "cm-tr-bar" });
      v.containerEl.insertBefore(bar, v.containerEl.querySelector(":scope > .view-content"));
      this.bar = bar;
    }
    bar.empty();
    this.verifyBtn = null;
    this.unsureEl = null;
    const items = p.pendingTranscriptions();
    const item = this.currentItem(items);
    this.barSig = v.file ? v.file.path : "";
    if (!item) return;
    const waiting = p.scansWaiting(items);
    const idx = items.findIndex((i) => i.file.path === item.file.path);
    const file = item.file;

    // the pane was moved to a note that isn't waiting here: say so, and offer the way back
    if (v.file && v.file.path !== file.path) {
      const top = bar.createDiv({ cls: "cm-trb-top" });
      top.createEl("h4", { text: "Transcription queue", cls: "cm-tin-gradient-style cm-trb-title" });
      top.createSpan({ cls: "cm-tr-count", text: `This pane is showing “${v.file.basename}”, not the note you were checking.` });
      const sub = bar.createDiv({ cls: "cm-trb-sub" });
      const act = sub.createDiv({ cls: "cm-trb-actions" });
      act.createEl("button", { text: `Back to “${file.basename}”`, cls: "mod-cta" }).addEventListener("click", async () => { await this.openInNote(file); this.drawBar(); this.renderChecks(); });
      act.createEl("button", { cls: "cm-mini", text: "Close" }).addEventListener("click", () => this.closeQueue());
      return;
    }

    const top = bar.createDiv({ cls: "cm-trb-top" });
    top.createEl("h4", { text: "Transcription queue", cls: "cm-tin-gradient-style cm-trb-title" });
    top.createSpan({ cls: "cm-tr-count", text: `${idx + 1} of ${items.length}` });
    const sel = top.createEl("select", { cls: "dropdown cm-tr-select" });
    items.forEach((i) => {
      const o = sel.createEl("option", { text: i.file.basename, value: i.file.path });
      if (i.file.path === file.path) o.selected = true;
    });
    sel.addEventListener("change", () => this.go(sel.value));
    const prev = top.createEl("button", { cls: "cm-mini", text: "◀" });
    const next = top.createEl("button", { cls: "cm-mini", text: "▶" });
    prev.setAttr("aria-label", "Previous note");
    next.setAttr("aria-label", "Next note");
    prev.disabled = next.disabled = items.length < 2;
    prev.addEventListener("click", () => this.go(items[(idx + items.length - 1) % items.length].file.path));
    next.addEventListener("click", () => this.go(items[(idx + 1) % items.length].file.path));

    // the second row: the course folder at the left, then the unsure words, and the buttons at the right (the top right of the window is under the window controls)
    const sub = bar.createDiv({ cls: "cm-trb-sub" });
    sub.createSpan({ cls: "cm-tr-where", text: file.parent ? file.parent.path.replace(NOTES_DIR, "") : "" });
    this.unsureEl = sub.createDiv({ cls: "cm-trb-unsure" });
    if (waiting.length) sub.createSpan({ cls: "cm-tr-waiting", text: `${waiting.length} scan${waiting.length === 1 ? "" : "s"} not in a note yet` });

    const act = sub.createDiv({ cls: "cm-trb-actions" });
    const verify = act.createEl("button", { text: "Verify", cls: "mod-cta" });
    verify.setAttr("aria-label", "I checked this against the scan: remove the scan and clear the draft mark");
    verify.addEventListener("click", () => this.verify(item));
    act.createEl("button", { text: "Skip" }).addEventListener("click", () => this.skip(items, idx));
    const discard = act.createEl("button", { text: "Discard transcription", cls: "cm-danger" });
    discard.setAttr("aria-label", "Delete this draft note and keep the scans, so it can be redone");
    discard.addEventListener("click", () => this.discard(item, items, idx));
    const x = act.createEl("button", { cls: "cm-mini cm-tr-x", text: "Close" });
    x.setAttr("aria-label", "Close the queue and get the other panes back");
    x.addEventListener("click", () => this.closeQueue());
    this.verifyBtn = verify;
  }

  async setMode(mode) {
    const v = this.noteView();
    if (!v || v.getMode() === mode) return;
    try { await v.setState({ ...v.getState(), mode, source: false }, { history: false }); } catch (e) { console.error("Nicrosil: couldn't switch the note's view", e); }
    this.drawBar();
    this.renderChecks();
  }

  async go(path) {
    await this.saveNote();
    this.path = path;
    this.page = 0;
    this.cropFor = null;
    this.cropRect = null;
    await this.render();
  }

  /* --- the scan (left) --- */

  scanFile(name) {
    const f = this.app.vault.getAbstractFileByPath(scanPath(name));
    return f instanceof TFile ? f : null;
  }

  async drawScan() {
    const pane = this.scanPane;
    if (!pane || !pane.isConnected) return;
    pane.empty();
    const name = this.pages[this.page];
    const bar = pane.createDiv({ cls: "cm-tr-scanbar" });
    const tabs = bar.createDiv({ cls: "cm-tr-tabs" });
    this.pages.forEach((n, i) => {
      const t = tabs.createEl("button", { cls: "cm-mini" + (i === this.page ? " is-on" : ""), text: this.pages.length > 1 ? `Page ${i + 1}` : "Scan" });
      t.setAttr("aria-label", n);
      t.addEventListener("click", () => { if (this.cropFor) { new Notice("Finish or cancel the screenshot first."); return; } this.page = i; this.drawScan(); });
    });
    if (name) tabs.createSpan({ cls: "cm-tr-file", text: name });
    const zoom = bar.createDiv({ cls: "cm-tr-zoom" });
    const setZoom = (z) => { this.zoom = Math.max(50, Math.min(400, z)); if (this.wrap) this.wrap.style.width = this.zoom + "%"; zlabel.setText(this.zoom + "%"); };
    zoom.createEl("button", { cls: "cm-mini", text: "−" }).addEventListener("click", () => setZoom(this.zoom - 25));
    const zlabel = zoom.createSpan({ cls: "cm-tr-zlabel", text: this.zoom + "%" });
    zoom.createEl("button", { cls: "cm-mini", text: "+" }).addEventListener("click", () => setZoom(this.zoom + 25));
    zoom.createEl("button", { cls: "cm-mini", text: "Fit" }).addEventListener("click", () => setZoom(100));

    if (this.cropFor) {
      const banner = pane.createDiv({ cls: "cm-tr-cropbar" });
      banner.createSpan({ text: "Drag a box over the drawing, then Save." });
      this.cropSave = banner.createEl("button", { cls: "cm-mini mod-cta", text: "Save screenshot" });
      this.cropSave.disabled = true;
      this.cropSave.addEventListener("click", () => this.saveCrop(false));
      banner.createEl("button", { cls: "cm-mini", text: "Whole page" }).addEventListener("click", () => this.saveCrop(true));
      banner.createEl("button", { cls: "cm-mini", text: "Cancel" }).addEventListener("click", () => { this.cropFor = null; this.cropRect = null; this.drawScan(); });
    }

    const view = pane.createDiv({ cls: "cm-tr-scanview" });
    const file = name ? this.scanFile(name) : null;
    if (!name) { view.createDiv({ cls: "cm-sub cm-tr-missing", text: "This note doesn't list a scan (scan_pages in its properties)." }); return; }
    if (!file) { view.createDiv({ cls: "cm-sub cm-tr-missing", text: `${name} isn't in Sources/Scans. If this note is already checked, verify it to clear the draft mark.` }); return; }
    const wrap = view.createDiv({ cls: "cm-tr-imgwrap" });
    wrap.style.width = this.zoom + "%";
    this.wrap = wrap;
    const img = wrap.createEl("img", { cls: "cm-tr-img" });
    img.src = this.app.vault.getResourcePath(file);
    img.draggable = false;
    if (this.cropFor) this.drawCropLayer(wrap);
  }

  /** A transparent layer over the scan that turns a drag into a box (kept as fractions of the scan, so zooming doesn't move it). */
  drawCropLayer(wrap) {
    const layer = wrap.createDiv({ cls: "cm-tr-croplayer" });
    const box = layer.createDiv({ cls: "cm-tr-cropbox" });
    box.style.display = "none";
    let start = null;
    const frac = (e) => {
      const r = layer.getBoundingClientRect();
      return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
    };
    const paint = () => {
      const c = this.cropRect;
      if (!c) { box.style.display = "none"; return; }
      box.style.display = "block";
      box.style.left = c.x * 100 + "%"; box.style.top = c.y * 100 + "%";
      box.style.width = c.w * 100 + "%"; box.style.height = c.h * 100 + "%";
    };
    layer.addEventListener("pointerdown", (e) => { e.preventDefault(); layer.setPointerCapture(e.pointerId); start = frac(e); this.cropRect = { x: start.x, y: start.y, w: 0, h: 0 }; paint(); });
    layer.addEventListener("pointermove", (e) => {
      if (!start) return;
      const q = frac(e);
      this.cropRect = { x: Math.min(start.x, q.x), y: Math.min(start.y, q.y), w: Math.abs(q.x - start.x), h: Math.abs(q.y - start.y) };
      paint();
    });
    layer.addEventListener("pointerup", () => {
      start = null;
      const c = this.cropRect;
      if (this.cropSave) this.cropSave.disabled = !(c && c.w > 0.02 && c.h > 0.02);
    });
    paint();
  }

  /** Saves the chosen part of the scan (or the whole page) as an image in _attachments/Tinmind/ and puts it in the note where the drawing flag was. */
  async saveCrop(whole) {
    const d = this.cropFor;
    if (!d) return;
    const c = whole ? { x: 0, y: 0, w: 1, h: 1 } : this.cropRect;
    if (!c || c.w <= 0.02 || c.h <= 0.02) { new Notice("Drag a box over the drawing first."); return; }
    const name = d.scan || this.pages[this.page];
    const scan = name && this.scanFile(name);
    if (!scan) { new Notice("That scan isn't in Sources/Scans any more."); return; }
    try {
      const url = URL.createObjectURL(new Blob([await this.app.vault.readBinary(scan)], { type: "image/jpeg" }));
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("couldn't open the scan as an image")); i.src = url; });
      const sx = Math.round(c.x * img.naturalWidth), sy = Math.round(c.y * img.naturalHeight);
      const sw = Math.max(1, Math.round(c.w * img.naturalWidth)), sh = Math.max(1, Math.round(c.h * img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = sw; canvas.height = sh;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, sw, sh);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      URL.revokeObjectURL(url);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
      if (!blob) throw new Error("couldn't make the image");
      const file = this.app.vault.getAbstractFileByPath(this.path);
      await this.plugin.tinEnsureFolder(TIN_DRAWINGS_DIR);
      const out = this.plugin.tinUniquePath(TIN_DRAWINGS_DIR, `${cleanName(file.basename)} drawing`, ".jpg");
      await this.app.vault.createBinary(out, await blob.arrayBuffer());
      const made = out.split("/").pop();
      this.record(d, whole ? "kept a screenshot of the whole page" : "kept a screenshot of part of the page");
      await this.applyText(keepDrawing(this.text(), this.drawingNow(d), made));
      this.cropFor = null; this.cropRect = null;
      new Notice(`Saved ${made} in ${TIN_DRAWINGS_DIR}/ and put it in the note.`, 5000);
      await this.render();
    } catch (e) {
      console.error("Nicrosil: saving the screenshot failed", e);
      new Notice(`Couldn't save the screenshot: ${e.message}`, 8000);
    }
  }

  /* --- what still needs me (under the scan, and the unsure words in the bar) --- */

  record(d, decision) {
    (this.decisions[this.path] = this.decisions[this.path] || []).push({ label: d.label, decision });
  }

  /** The drawing as it stands in the text now (its line numbers may have moved since the card was drawn). */
  drawingNow(d) {
    return parseDrawings(this.text()).find((x) => x.label === d.label && x.scan === d.scan && x.kind === d.kind) || d;
  }

  /** The "recreated" marker as it stands in the text now. */
  recheckNow(r) {
    return parseRechecks(this.text()).find((x) => x.scan === r.scan && x.label === r.label) || r;
  }

  async change(next, decisionFor, decision) {
    if (decisionFor) this.record(decisionFor, decision);
    await this.applyText(next);
    this.renderChecks();
  }

  showScan(name) {
    const i = this.pages.findIndex((n) => scanKey(n) === scanKey(name));
    if (i >= 0 && !this.cropFor) { this.page = i; this.drawScan(); }
  }

  renderChecks() {
    const el = this.checksEl;
    if (!el || !el.isConnected) return;
    el.empty();
    const text = this.text();
    const drawings = parseDrawings(text);
    const rechecks = parseRechecks(text);
    const unsure = findUnsure(text);
    const open = drawings.length + rechecks.length;

    if (open) {
      const hd = el.createDiv({ cls: "cm-tr-trayhead" });
      hd.createSpan({ cls: "cm-tr-checkhead", text: `Needs you (${open})` });
      const tg = hd.createEl("button", { cls: "cm-mini", text: this.trayOpen ? "Hide" : "Show" });
      tg.addEventListener("click", () => { this.trayOpen = !this.trayOpen; this.renderChecks(); });
    }
    if (open && this.trayOpen) {
      if (drawings.length) {
        el.createDiv({ cls: "cm-tr-checkhead", text: `Drawings (${drawings.length})` });
        drawings.forEach((d) => {
          const card = el.createDiv({ cls: "cm-tr-card cm-tr-" + d.kind });
          const top = card.createDiv({ cls: "cm-tr-cardtop" });
          top.createSpan({ cls: "cm-tr-cardtitle", text: d.label || "Drawing" });
          top.createSpan({ cls: "cm-tr-cardkind", text: d.kind === "recreate" ? "waiting to be recreated" : "needs your decision" });
          if (d.body) card.createDiv({ cls: "cm-tr-cardbody", text: d.body });
          const row = card.createDiv({ cls: "cm-tr-cardbtns" });
          if (d.scan) {
            const look = row.createEl("button", { cls: "cm-mini", text: "Show on scan" });
            look.addEventListener("click", () => this.showScan(d.scan));
          }
          const keep = row.createEl("button", { cls: "cm-mini", text: d.kind === "recreate" ? "Keep screenshot instead" : "Keep screenshot" });
          keep.addEventListener("click", () => { this.cropFor = d; this.cropRect = null; if (d.scan) { const i = this.pages.findIndex((n) => scanKey(n) === scanKey(d.scan)); if (i >= 0) this.page = i; } this.drawScan(); });
          if (d.kind === "drawing") {
            row.createEl("button", { cls: "cm-mini", text: "Recreate" }).addEventListener("click", () => this.change(recreateDrawing(this.text(), this.drawingNow(d)), d, "to be recreated in the note"));
          }
          row.createEl("button", { cls: "cm-mini", text: "Leave out" }).addEventListener("click", () => this.change(leaveOutDrawing(this.text(), this.drawingNow(d)), d, "left out of the note"));
          if (d.kind === "recreate") card.createDiv({ cls: "cm-sub", text: "The scan stays until you check the recreated drawing. Ask Claude to recreate it." });
        });
      }
      if (rechecks.length) {
        el.createDiv({ cls: "cm-tr-checkhead", text: `Recreated drawings to check (${rechecks.length})` });
        rechecks.forEach((r) => {
          const card = el.createDiv({ cls: "cm-tr-card cm-tr-recheck" });
          const top = card.createDiv({ cls: "cm-tr-cardtop" });
          top.createSpan({ cls: "cm-tr-cardtitle", text: r.label || "Recreated drawing" });
          top.createSpan({ cls: "cm-tr-cardkind", text: "compare with the scan" });
          const row = card.createDiv({ cls: "cm-tr-cardbtns" });
          if (r.scan) row.createEl("button", { cls: "cm-mini", text: "Show on scan" }).addEventListener("click", () => this.showScan(r.scan));
          row.createEl("button", { cls: "cm-mini mod-cta", text: "Looks right" }).addEventListener("click", () => this.change(clearRecheck(this.text(), this.recheckNow(r)), { label: r.label || "Recreated drawing" }, "recreated, and I checked it"));
        });
      }
    }
    if (!open && !unsure.length) el.createDiv({ cls: "cm-ok", text: "No drawings or unsure words left." });
    else if (!open) el.createDiv({ cls: "cm-sub", text: "No drawings to decide on. Unsure words are in the bar above the note." });

    // the bar: the unsure words and whether Verify is open
    const showing = !!text || (this.noteView() && this.noteView().file && this.noteView().file.path === this.path);
    if (this.verifyBtn && this.verifyBtn.isConnected) {
      this.verifyBtn.disabled = open > 0 || !showing;
      this.verifyBtn.setAttr("title", open ? "Decide on every drawing first" : "");
    }
    const u = this.unsureEl;
    if (u && u.isConnected) {
      u.empty();
      if (unsure.length) {
        u.createSpan({ cls: "cm-tr-checkhead", text: `Unsure words (${unsure.length})` });
        u.createEl("button", { cls: "cm-mini", text: "Next unsure word" }).addEventListener("click", () => this.nextUnsure());
        u.createEl("button", { cls: "cm-mini", text: "Accept the guess" }).addEventListener("click", () => this.acceptCurrent());
      } else {
        u.createSpan({ cls: "cm-tr-count", text: "No unsure words" });
      }
    }
  }

  /** Selects the next [?word?] or [??] in the note (from the cursor on, then from the top) and scrolls to it. */
  async nextUnsure() {
    const v = this.noteView();
    if (!v || !v.file || v.file.path !== this.path) return;
    if (v.getMode() !== "source") await this.setMode("source");
    const ed = v.editor;
    const list = findUnsure(ed.getValue());
    if (!list.length) return;
    const from = ed.posToOffset(ed.getCursor("to"));
    const u = list.find((x) => x.index >= from) || list[0];
    const a = ed.offsetToPos(u.index), b = ed.offsetToPos(u.index + u.length);
    ed.setSelection(a, b);
    ed.scrollIntoView({ from: a, to: b }, true);
    ed.focus();
  }

  /** Puts the guess in place of the selected [?word?], then moves to the next one. */
  async acceptCurrent() {
    const v = this.noteView();
    if (!v || !v.file || v.file.path !== this.path) return;
    const ed = v.editor;
    const list = findUnsure(ed.getValue());
    const s = ed.posToOffset(ed.getCursor("from")), e = ed.posToOffset(ed.getCursor("to"));
    const u = list.find((x) => s >= x.index && e <= x.index + x.length && e > s);
    if (!u) { await this.nextUnsure(); return; }
    if (!u.guess) { new Notice("That one has no guess. Type the word in."); return; }
    ed.replaceRange(u.guess, ed.offsetToPos(u.index), ed.offsetToPos(u.index + u.length));
    ed.setCursor(ed.offsetToPos(u.index + u.guess.length));
    await this.saveNote();
    this.renderChecks();
    await this.nextUnsure();
  }

  /* --- the buttons --- */

  /** Moves to the note after the one at `idx` (or the first if it was the last), after this one goes away. */
  afterWith(items, idx) {
    const rest = items.filter((_, i) => i !== idx);
    const next = rest[idx] || rest[0];
    this.path = next ? next.file.path : null;
    this.page = 0;
    this.cropFor = null;
  }

  async skip(items, idx) {
    if (items.length < 2) { new Notice("That is the only note waiting."); return; }
    await this.go(items[(idx + 1) % items.length].file.path);
  }

  async verify(item) {
    await this.saveNote();
    const text = this.text();
    const open = parseDrawings(text).length + parseRechecks(text).length;
    if (open) { new Notice("Decide on every drawing first."); return; }
    const p = this.plugin;
    const used = p.scanKeysUsedElsewhere(item.file.path);
    const scans = this.pages.map((n) => ({ name: n, keep: used.has(scanKey(n)) }));
    const unsure = findUnsure(text).length;
    new TranscribeVerifyModal(this.app, {
      name: item.file.basename, scans, unsure,
      onConfirm: async () => {
        const items = p.pendingTranscriptions();
        const idx = items.findIndex((i) => i.file.path === item.file.path);
        try {
          await p.verifyTranscription(item.file, this.pages, this.decisions[item.file.path] || [], unsure);
          delete this.decisions[item.file.path];
          this.afterWith(items, idx);
        } catch (e) {
          console.error("Nicrosil: verifying a transcription failed", e);
          new Notice(`Verify failed: ${e.message}. Check the note, its scans and the log.`, 10000);
        }
        this.render();
      },
    }).open();
  }

  async discard(item, items, idx) {
    await this.saveNote();
    const p = this.plugin;
    const reason = String((await p.tinPrompt({ title: `Discard “${item.file.basename}”?`, label: "This deletes the draft note and keeps its scans, so Claude can try again. Why are you discarding it? (required)", ok: "Discard" })) || "").trim();
    if (!reason) { new Notice("A reason is required, so nothing was discarded."); return; }
    try {
      // move the right-hand pane on first, so deleting the note doesn't close the pane with it
      const rest = items.filter((_, i) => i !== idx);
      if (rest.length) {
        const next = rest[idx] || rest[0];
        this.path = next.file.path; this.page = 0; this.cropFor = null;
        await this.openInNote(next.file);
      }
      await p.discardTranscription(item.file, reason);
      delete this.decisions[item.file.path];
      if (!rest.length) this.path = null;
    } catch (e) {
      console.error("Nicrosil: discarding a transcription failed", e);
      new Notice(`Discard failed: ${e.message}`, 10000);
    }
    this.render();
  }
}

