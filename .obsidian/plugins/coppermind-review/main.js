"use strict";
/*
 * Coppermind Review
 * One-click Verify / Reject for draft wiki pages.
 *
 * Verify: sets status: verified and verified_on, flips the page's entry in index.md
 *         to (verified), recomputes the totals, and appends an entry to log.md.
 * Reject: asks for a reason, logs it, removes the page from index.md, and deletes the page
 *         (SCHEMA §7: a rejected draft is deleted, never kept).
 * Nothing is committed to git; do that yourself afterward.
 */
const { Plugin, Modal, Notice, MarkdownView, TFile } = require("obsidian");

const INDEX_PATH = "index.md";
const LOG_PATH = "log.md";
const REVIEWABLE = [/^Wiki\//, /^Perspectives\//, /^Sources\/Source Cards\//];

/* ---------- pure helpers (tested outside Obsidian) ---------- */

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripFrontmatter(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

/** Open flag callouts: caution = accuracy check, todo = gap, question = "whose view?" etc. */
function findFlags(text) {
  const body = stripFrontmatter(text);
  const labels = { caution: "Accuracy check", todo: "Gap", question: "Question", warning: "Warning" };
  const flags = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^>\s*\[!(caution|todo|question|warning)\][+-]?\s*(.*)$/i);
    if (m) {
      const kind = m[1].toLowerCase();
      let title = m[2].trim();
      if (title.toLowerCase() === labels[kind].toLowerCase()) title = "";
      flags.push({ kind, label: labels[kind], title });
    }
  }
  return flags;
}

function recomputeIndex(text, date) {
  const lines = text.split("\n");
  let heading = -1;
  const counts = new Map();
  lines.forEach((line, i) => {
    if (/^## .+\(\d+\)\s*$/.test(line)) heading = i;
    else if (/^- \[\[/.test(line) && heading >= 0) counts.set(heading, (counts.get(heading) || 0) + 1);
  });
  for (let i = 0; i < lines.length; i++) {
    if (/^## .+\(\d+\)\s*$/.test(lines[i])) {
      lines[i] = lines[i].replace(/\(\d+\)\s*$/, `(${counts.get(i) || 0})`);
    }
  }
  let out = lines.join("\n");
  const verified = (out.match(/\(verified\)[ \t]*$/gm) || []).length;
  const drafts = (out.match(/\(draft\)[ \t]*$/gm) || []).length;
  out = out.replace(/^\*\*Totals:\*\*.*$/m, `**Totals:** ${verified} verified · ${drafts} drafts`);
  out = out.replace(/^updated:.*$/m, `updated: ${date}`);
  return out;
}

/** Returns { text, found }. mode: "verify" flips (draft) to (verified); "remove" deletes the entry. */
function editIndex(text, name, mode, date) {
  const entry = new RegExp(`^- \\[\\[${escapeRegExp(name)}(\\||\\]\\])`);
  let found = false;
  const kept = [];
  for (const line of text.split("\n")) {
    if (entry.test(line)) {
      found = true;
      if (mode === "remove") continue;
      kept.push(line.replace(/\((draft|verified)\)[ \t]*$/, "(verified)"));
    } else {
      kept.push(line);
    }
  }
  return { text: recomputeIndex(kept.join("\n"), date), found };
}

function oneLine(s) {
  return s.replace(/\s*\n\s*/g, " ").trim();
}

function verifyLogEntry({ name, date, note, openFlags }) {
  const lines = [`## [${date}] verify | ${name}`, "", "- **Verify:**", `  - Approved: [[${name}]]`];
  if (note) lines.push(`  - Revised: [[${name}]] — ${oneLine(note)}`);
  if (openFlags.length) {
    lines.push(`  - Flags still on the page when I approved it (${openFlags.length}): ` +
      openFlags.map((f) => `${f.label}${f.title ? " — " + f.title : ""}`).join("; "));
  }
  lines.push(`- **Commit:** \`verify: ${name}\``);
  return lines.join("\n");
}

function rejectLogEntry({ name, date, reason, dangling }) {
  const lines = [`## [${date}] verify | ${name} (rejected)`, "", "- **Verify:**",
    `  - Rejected: "${name}" — ${oneLine(reason)} (not saved)`];
  if (dangling.length) lines.push(`  - Pages that still link to it: ${dangling.map((n) => `[[${n}]]`).join(", ")}`);
  lines.push(`- **Commit:** \`reject: ${name}\``);
  return lines.join("\n");
}

function appendToLog(text, entry) {
  return text.replace(/\s*$/, "") + "\n\n" + entry + "\n";
}

/* ---------- dialog ---------- */

class ReviewModal extends Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts; // { mode, name, flags, backlinks, onConfirm }
  }

  onOpen() {
    const { mode, name, flags, backlinks, onConfirm } = this.opts;
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
        flags.forEach((f) => ul.createEl("li", { text: `${f.label}${f.title ? ": " + f.title : ""}` }));
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

    function refresh() {
      go.disabled = !confirmed || (!isVerify && ta.value.trim().length === 0);
    }
    refresh();
    setTimeout(() => ta.focus(), 50);
  }

  onClose() { this.contentEl.empty(); }
}

/* ---------- plugin ---------- */

module.exports = class CoppermindReview extends Plugin {
  async onload() {
    this.decorated = new WeakSet();

    this.addCommand({
      id: "verify-page",
      name: "Verify this page",
      checkCallback: (checking) => {
        const f = this.app.workspace.getActiveFile();
        if (!f || !this.isReviewable(f)) return false;
        if (!checking) this.verify(f);
        return true;
      },
    });
    this.addCommand({
      id: "reject-page",
      name: "Reject this draft (deletes it)",
      checkCallback: (checking) => {
        const f = this.app.workspace.getActiveFile();
        if (!f || !this.isReviewable(f)) return false;
        if (!checking) this.reject(f);
        return true;
      },
    });

    const decorate = () => this.decorateViews();
    this.registerEvent(this.app.workspace.on("layout-change", decorate));
    this.registerEvent(this.app.workspace.on("file-open", decorate));
    this.app.workspace.onLayoutReady(decorate);
  }

  onunload() {
    document.querySelectorAll(".coppermind-verify, .coppermind-reject").forEach((e) => e.remove());
  }

  decorateViews() {
    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView) || this.decorated.has(view)) return;
      this.decorated.add(view);
      view.addAction("badge-check", "Verify this page", () => view.file && this.verify(view.file))
        .addClass("coppermind-verify");
      view.addAction("trash-2", "Reject this draft (deletes it)", () => view.file && this.reject(view.file))
        .addClass("coppermind-reject");
    });
  }

  isReviewable(file) {
    return file instanceof TFile && file.extension === "md" && REVIEWABLE.some((re) => re.test(file.path));
  }

  fm(file) {
    return (this.app.metadataCache.getFileCache(file) || {}).frontmatter || {};
  }

  /** Common checks. Returns frontmatter if the page can be reviewed, else null (and shows a notice). */
  precheck(file) {
    if (!this.isReviewable(file)) {
      new Notice("Coppermind Review only works on pages in Wiki/, Perspectives/, or Sources/Source Cards/.");
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
      new Notice("Fill in this source card's reliability rating first (SCHEMA §7: ratings are item-by-item).", 8000);
      return;
    }
    const flags = findFlags(await this.app.vault.cachedRead(file));
    new ReviewModal(this.app, {
      mode: "verify", name: file.basename, flags, backlinks: [],
      onConfirm: async (note) => {
        const date = today();
        try {
          await this.app.fileManager.processFrontMatter(file, (f) => {
            f.status = "verified";
            f.verified_on = date;
          });
          const indexed = await this.updateIndex(file.basename, "verify", date);
          await this.appendLog(verifyLogEntry({ name: file.basename, date, note, openFlags: flags }));
          new Notice(`Verified “${file.basename}”.` + (indexed ? "" : " It wasn't in index.md; add it by hand."), 6000);
        } catch (e) {
          console.error("Coppermind Review: verify failed", e);
          new Notice(`Verify failed: ${e.message}. Check status, index.md and log.md.`, 10000);
        }
      },
    }).open();
  }

  async reject(file) {
    const fm = this.precheck(file);
    if (!fm) return;
    const backlinks = this.backlinksTo(file);
    new ReviewModal(this.app, {
      mode: "reject", name: file.basename, flags: [], backlinks,
      onConfirm: async (reason) => {
        const date = today();
        try {
          // Log first, so the reason is recorded even if a later step fails.
          await this.appendLog(rejectLogEntry({ name: file.basename, date, reason, dangling: backlinks }));
          const indexed = await this.updateIndex(file.basename, "remove", date);
          await this.app.fileManager.trashFile(file);
          new Notice(`Rejected and deleted “${file.basename}”.` + (indexed ? "" : " It wasn't in index.md."), 6000);
        } catch (e) {
          console.error("Coppermind Review: reject failed", e);
          new Notice(`Reject failed: ${e.message}. Check log.md, index.md and the page.`, 10000);
        }
      },
    }).open();
  }

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

module.exports.__test = { findFlags, editIndex, recomputeIndex, verifyLogEntry, rejectLogEntry, appendToLog, today };
