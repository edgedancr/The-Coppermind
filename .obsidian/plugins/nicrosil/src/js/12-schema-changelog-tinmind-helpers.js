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
 * Finds the Changelog section. Returns { eol, lines, headingIdx, firstBulletIdx, versions }
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
  let firstBulletIdx = -1;
  const versions = [];
  for (let i = headingIdx + 1; i < end; i++) {
    const m = lines[i].match(/^- \*\*(\d+\.\d+)\b/);
    if (m) { if (firstBulletIdx === -1) firstBulletIdx = i; versions.push(m[1]); }
  }
  return { eol, lines, headingIdx, firstBulletIdx, versions };
}

/** Frontmatter value of a simple `key: value` property, or null. */
function frontmatterValue(text, key) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const k = m[1].match(new RegExp(`^${escapeRegExp(key)}:[ \\t]*(.*?)[ \\t]*$`, "m"));
  return k ? k[1] : null;
}

/** Sets simple `key: value` properties in place (only keys that already exist), keeping everything else as it is. */
function setFrontmatterProps(text, props) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return text;
  const close = lines.indexOf("---", 1);
  for (let i = 1; i < close; i++) {
    for (const [k, v] of Object.entries(props)) if (new RegExp(`^${escapeRegExp(k)}:`).test(lines[i])) lines[i] = `${k}: ${v}`;
  }
  return lines.join(eol);
}

/** Current version, the latest changelog version, and the changelog as seen by the modal.
 *  The version lives in SCHEMAS/SCHEMA.md, so it can be passed in; otherwise it is read from the text. */
function schemaInfo(text, fmOverride) {
  const cl = findChangelog(text);
  const fmVersion = fmOverride !== undefined ? fmOverride : frontmatterValue(text, "version");
  const latest = cl && cl.versions.length
    ? cl.versions.reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b))
    : null;
  return { hasChangelog: !!cl, fmVersion, latest, versions: cl ? cl.versions : [] };
}

/** Returns an error message for a bad version, or "" if it is fine. */
function checkVersion(text, version, fmOverride) {
  if (!/^\d+\.\d+$/.test(version)) return "Use the form 4.2 (a whole number, a dot, and a number).";
  const info = schemaInfo(text, fmOverride);
  if (!info.hasChangelog) return "Schema Changelog has no “Changelog” heading to add to.";
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
  if (!cl) throw new Error("No Changelog heading in Schema Changelog");
  const { eol, lines } = cl;
  const line = entryLine(version, date, desc);
  if (cl.firstBulletIdx !== -1) {
    // Newest first: the new line goes above the existing ones.
    lines.splice(cl.firstBulletIdx, 0, line);
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

/* ---------- The Tinmind's sidebar and course pages: helpers (3.1.0) ---------- */
const byOldestSemester = (p, q) => {
  const kp = semesterKey(p), kq = semesterKey(q);
  if (kp !== null && kq !== null) return kp - kq;
  if (kp !== null) return -1;
  if (kq !== null) return 1;
  return p.localeCompare(q);
};
const newestSemester = (list) => [...list].reverse().find((x) => semesterKey(x) !== null) || list[list.length - 1] || "";
const naturalCompare = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }); // "Lecture 2" before "Lecture 10"
/** A name typed into a prompt, made safe for a file name: no slashes or other characters Obsidian can't use in a link. */
const cleanName = (s) => String(s || "").replace(/[\\/:*?"<>|#^\[\]]/g, " ").replace(/\.md$/i, "").replace(/\s+/g, " ").trim();

/** A one-line text prompt. `done` gets the text, or null if cancelled. */
class TinPromptModal extends Modal {
  constructor(app, opts, done) {
    super(app);
    this.opts = opts;
    this.done = done;
    this.finished = false;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nicrosil-modal");
    this.titleEl.setText(this.opts.title);
    if (this.opts.label) contentEl.createDiv({ cls: "cm-sub", text: this.opts.label });
    const input = contentEl.createEl("input", { type: "text", cls: "cm-tin-input" });
    input.value = this.opts.value || "";
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); this.finish(input.value); } });
    const btns = contentEl.createDiv({ cls: "cm-buttons" });
    btns.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    btns.createEl("button", { text: this.opts.ok || "OK", cls: "mod-cta" }).addEventListener("click", () => this.finish(input.value));
    setTimeout(() => { input.focus(); if (this.opts.caret === "end") input.setSelectionRange(input.value.length, input.value.length); else input.select(); }, 0);
  }

  finish(value) {
    if (this.finished) return;
    this.finished = true;
    this.done(value);
    this.close();
  }

  onClose() {
    this.contentEl.empty();
    if (!this.finished) { this.finished = true; this.done(null); }
  }
}

/** A yes/no question. `done` gets true or false. */
class TinConfirmModal extends Modal {
  constructor(app, opts, done) {
    super(app);
    this.opts = opts;
    this.done = done;
    this.finished = false;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nicrosil-modal");
    this.titleEl.setText(this.opts.title);
    contentEl.createDiv({ cls: "cm-sub", text: this.opts.message });
    const btns = contentEl.createDiv({ cls: "cm-buttons" });
    btns.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    const ok = btns.createEl("button", { text: this.opts.ok || "OK", cls: "mod-warning" });
    ok.addEventListener("click", () => { this.finished = true; this.done(true); this.close(); });
    setTimeout(() => ok.focus(), 0);
  }

  onClose() {
    this.contentEl.empty();
    if (!this.finished) { this.finished = true; this.done(false); }
  }
}

/* ---------- schema changelog dialog ---------- */

class SchemaLogModal extends Modal {
  constructor(app, plugin, text, fmVersion) {
    super(app);
    this.plugin = plugin;
    this.text = text;
    this.fmVersion = fmVersion;
    this.version = "";
    this.desc = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("cm-schemalog");
    this.titleEl.setText("Log a schema change");

    const info = schemaInfo(this.text, this.fmVersion);
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
    this.descInput = descWrap.createEl("textarea", { attr: { rows: "5", placeholder: "SCHEMA - Review: reworded rule 6 so a rejected draft is deleted, never kept." } });
    this.descInput.addEventListener("input", () => { this.desc = this.descInput.value; this.refresh(); });
    this.descInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.submit(); }
    });

    contentEl.createDiv({ cls: "cm-schemalog-label", text: `Will be added to the top of the changelog (dated ${date}):` });
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
    this.error = this.version ? checkVersion(this.text, this.version, this.fmVersion) : "";
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

