/* ---------- small DOM helpers ---------- */

const prefersReduced = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const DASH_COLORS = ["#5fae9e", "#d98a4a", "#7aa2d6", "#e0a846", "#b97f93", "#8fc09a"];

/** Counts a number up from zero (the Dashboard tiles use this when it opens). */
function countUp(el, to, ms = 850) {
  if (!to) return;
  el.setText("0");
  const t0 = performance.now();
  const f = (now) => {
    const u = Math.min(1, (now - t0) / ms);
    el.setText(String(Math.round(to * (1 - Math.pow(1 - u, 3)))));
    if (u < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

function progressBar(parent, done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const wrap = parent.createDiv({ cls: "cm-progress" });
  wrap.createDiv({ cls: "cm-progress-fill" }).style.width = `${pct}%`;
  parent.createDiv({ cls: "cm-progress-label", text: `${done} of ${total} pages verified (${pct}%)` });
}

const BADGE_STATE = { seen: new Set(), primed: false };

function flagBadges(parent, flags, key) {
  const counts = {};
  flags.forEach((f) => { counts[f.kind] = (counts[f.kind] || 0) + 1; });
  const wrap = parent.createSpan({ cls: "cm-badges" });
  Object.keys(FLAG_KINDS).forEach((k) => {
    if (!counts[k]) return;
    const b = wrap.createSpan({ cls: `cm-badge cm-badge-${k}`, text: `${FLAG_KINDS[k].short}${counts[k] > 1 ? counts[k] : ""}` });
    if (key) {
      const bk = `${key}|${k}|${counts[k]}`;
      if (BADGE_STATE.primed && !BADGE_STATE.seen.has(bk)) b.addClass("is-new");
      BADGE_STATE.seen.add(bk);
    }
    b.setAttr("aria-label", `${counts[k]} ${counts[k] > 1 ? FLAG_KINDS[k].plural.toLowerCase() : FLAG_KINDS[k].label.toLowerCase()}`);
  });
  if (!flags.length) wrap.createSpan({ cls: "cm-badge cm-badge-clean", text: "✓" }).setAttr("aria-label", "No open flags");
  return wrap;
}

function changeBadge(parent, changes) {
  if (!changes || !changes.length) return null;
  const b = parent.createSpan({ cls: "cm-badge cm-badge-recheck", text: "R" });
  b.setAttr("aria-label", `Changed since verified: ${changes.length} change${changes.length > 1 ? "s" : ""}`);
  return b;
}

function confirmOnCtrlEnter(modal, button) {
  modal.scope.register(["Mod"], "Enter", () => { if (!button.disabled) button.click(); return false; });
}

/* ---------- dialogs ---------- */

class ReviewModal extends Modal {
  constructor(app, opts) {
    super(app);
    this.opts = opts; // { mode, name, flags, resolved, backlinks, onConfirm }
  }

  onOpen() {
    const { mode, name, flags, resolved, backlinks, onConfirm } = this.opts;
    const el = this.contentEl;
    this.modalEl.addClass("nicrosil-modal");
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
        flags.forEach((f) => ul.createEl("li", { text: flagName(f) }));
      } else {
        el.createDiv({ cls: "cm-ok", text: "No open flags on this page." });
      }
    } else {
      el.createDiv({
        cls: "cm-sub",
        text: "A rejected draft is deleted (SCHEMA - Review). The reason is saved in the log. Obsidian's trash setting decides where the file goes, and git also keeps its history.",
      });
      if (backlinks.length) {
        el.createDiv({ text: `${backlinks.length} page${backlinks.length === 1 ? "" : "s"} link to this page and will have a broken link:` });
        const ul = el.createEl("ul", { cls: "cm-links" });
        backlinks.forEach((n) => ul.createEl("li", { text: n }));
      }
    }
    if (resolved && resolved.length) {
      el.createDiv({ text: `Flags you resolved on this page (these go in the log entry):` });
      const ul = el.createEl("ul", { cls: "cm-resolved" });
      resolved.forEach((r) => ul.createEl("li", { text: `${flagName(r)}: ${oneLine(r.decision)}` }));
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
    buttons.createSpan({ cls: "cm-hint", text: "Ctrl+Enter to confirm" });
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
    confirmOnCtrlEnter(this, go);

    function refresh() {
      go.disabled = !confirmed || (!isVerify && ta.value.trim().length === 0);
    }
    refresh();
    setTimeout(() => ta.focus(), 50);
  }

  onClose() { this.contentEl.empty(); }
}

class ResolveModal extends Modal {
  constructor(app, flag, onConfirm) {
    super(app);
    this.flag = flag;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const el = this.contentEl;
    this.modalEl.addClass("nicrosil-modal");
    el.empty();
    el.createEl("h2", { text: `Resolve: ${flagName(this.flag)}` });
    if (this.flag.body) el.createDiv({ cls: `cm-flagbody cm-flagbody-${this.flag.kind}`, text: this.flag.body });
    el.createDiv({
      cls: "cm-sub",
      text: "Resolving removes this callout from the page. If the claim needed correcting, edit the page text first. Your decision is saved and written to the log when you verify or reject the page.",
    });
    el.createDiv({ text: "What did you decide? (required)" });
    const ta = el.createEl("textarea");
    const buttons = el.createDiv({ cls: "cm-buttons" });
    buttons.createSpan({ cls: "cm-hint", text: "Ctrl+Enter to confirm" });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    const go = buttons.createEl("button", { text: "Resolve flag", cls: "mod-cta" });
    const refresh = () => { go.disabled = ta.value.trim().length === 0; };
    ta.addEventListener("input", refresh);
    cancel.addEventListener("click", () => this.close());
    go.addEventListener("click", async () => {
      go.disabled = true;
      this.close();
      await this.onConfirm(ta.value.trim());
    });
    confirmOnCtrlEnter(this, go);
    refresh();
    setTimeout(() => ta.focus(), 50);
  }

  onClose() { this.contentEl.empty(); }
}

class FlagPicker extends FuzzySuggestModal {
  constructor(app, flags, onChoose) {
    super(app);
    this.flags = flags;
    this.onChoose = onChoose;
    this.setPlaceholder("Which flag do you want to resolve?");
  }
  getItems() { return this.flags; }
  getItemText(f) { return `${flagName(f)} — ${oneLine(f.body).slice(0, 90)}`; }
  onChooseItem(f) { this.onChoose(f); }
}

/** When a page already has responses: open one of them, or start another. */
class ResponsePicker extends FuzzySuggestModal {
  constructor(app, existing, onChoose) {
    super(app);
    this.items = [...existing.map((f) => ({ file: f })), { fresh: true }];
    this.onChoose = onChoose;
    this.setPlaceholder("This page already has a response. Open it, or write another?");
  }
  getItems() { return this.items; }
  getItemText(i) { return i.fresh ? "Write a new response" : `Open: ${i.file.basename}`; }
  onChooseItem(i) { this.onChoose(i); }
}

