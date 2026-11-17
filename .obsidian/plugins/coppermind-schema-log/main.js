"use strict";
/*
 * Coppermind Schema Log (v1.0)
 *
 * After I change SCHEMA.md by hand, one button asks for the new version number and a
 * description of what I changed, then adds a line to the Changelog at the bottom of
 * SCHEMA.md (SCHEMA §14) and keeps the `version` and `updated` properties in step.
 *
 * It does not touch `status`, `verified_on`, log.md, or index.md. Verify the page with
 * Coppermind Review as usual, and commit to git yourself afterward.
 */
const { Plugin, Modal, Notice, Setting, TFile } = require("obsidian");

const SCHEMA_PATH = "SCHEMA.md";

/* ---------- pure helpers (tested outside Obsidian) ---------- */

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

/* ---------- the dialog ---------- */

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
      await this.plugin.addEntry(this.version, this.desc);
      this.close();
    } catch (e) {
      this.errorEl.setText(String(e && e.message ? e.message : e));
    }
  }

  onClose() { this.contentEl.empty(); }
}

/* ---------- the plugin ---------- */

module.exports = class CoppermindSchemaLog extends Plugin {
  async onload() {
    this.addRibbonIcon("file-pen", "Log a schema change", () => this.openDialog());
    this.addCommand({
      id: "log-schema-change",
      name: "Log a schema change",
      callback: () => this.openDialog(),
    });
  }

  schemaFile() {
    const f = this.app.vault.getAbstractFileByPath(SCHEMA_PATH);
    return f instanceof TFile ? f : null;
  }

  async openDialog() {
    const file = this.schemaFile();
    if (!file) { new Notice(`Could not find ${SCHEMA_PATH} at the top of the vault.`); return; }
    const text = await this.app.vault.read(file);
    if (!findChangelog(text)) { new Notice("SCHEMA.md has no “Changelog” heading, so there is nowhere to add the entry."); return; }
    new SchemaLogModal(this.app, this, text).open();
  }

  async addEntry(version, desc) {
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
};

// Exposed for tests outside Obsidian.
module.exports.__test = { addChangelogEntry, checkVersion, cleanDescription, entryLine, schemaInfo, compareVersions };
