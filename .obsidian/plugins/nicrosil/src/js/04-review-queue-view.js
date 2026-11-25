/* ---------- sidebar queue ---------- */

class QueueView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Review queue"; }
  getIcon() { return "badge-check"; }
  async onOpen() { this.render(); }
  async onClose() { this.containerEl.children[1].empty(); }

  render() {
    const p = this.plugin;
    const root = this.containerEl.children[1];
    const before = new Map();
    root.querySelectorAll(".cm-row[data-path]").forEach((r) => before.set(r.getAttribute("data-path"), r.getBoundingClientRect().top));
    root.empty();
    root.addClass("cm-queue");

    const all = p.items;
    const drafts = all.filter((i) => i.status === "draft");
    const verified = all.filter((i) => i.status === "verified");
    root.createEl("h4", { text: "Review queue" });
    progressBar(root, verified.length, all.length);

    // controls
    const controls = root.createDiv({ cls: "cm-controls" });
    const sel = controls.createEl("select", { cls: "dropdown" });
    Object.entries(SORTS).forEach(([k, v]) => {
      const o = sel.createEl("option", { text: v, value: k });
      if (k === p.settings.sort) o.selected = true;
    });
    sel.addEventListener("change", async () => { p.settings.sort = sel.value; await p.persist(); p.renderAll(); });
    const auto = controls.createEl("label", { cls: "cm-auto" });
    const cb = auto.createEl("input", { type: "checkbox" });
    cb.checked = p.settings.autoAdvance;
    auto.appendText(" Open next after verify");
    cb.addEventListener("change", async () => { p.settings.autoAdvance = cb.checked; await p.persist(); });

    // current page card
    const cur = p.currentFile();
    const curItem = cur && all.find((i) => i.path === cur.path);
    if (curItem && curItem.status === "draft") {
      const card = root.createDiv({ cls: "cm-card" });
      card.createDiv({ cls: "cm-card-label", text: "Reviewing" });
      card.createDiv({ cls: "cm-card-title", text: curItem.name });
      if (curItem.changes.length) {
        const box = card.createDiv({ cls: "cm-changes" });
        box.createDiv({ cls: "cm-changes-head", text: "Changed since verified" });
        const cl = box.createEl("ul");
        curItem.changes.forEach((c) => drawChangeLine(cl.createEl("li"), p, curItem.path, c));
      }
      if (curItem.flags.length) {
        const ul = card.createEl("ul", { cls: "cm-card-flags" });
        curItem.flags.forEach((f) => {
          const li = ul.createEl("li", { cls: `cm-flag-${f.kind}` });
          li.createSpan({ text: flagName(f) });
          const b = li.createEl("button", { cls: "cm-mini", text: "Resolve" });
          b.addEventListener("click", () => p.startResolve(cur, f));
        });
      } else {
        card.createDiv({ cls: "cm-ok", text: "No open flags." });
      }
      if (p.isSourceCard(cur)) p.drawRatingButtons(card.createDiv({ cls: "cm-ratebar cm-ratebar-card" }), cur);
      const pending = p.resolvedFor(cur.path);
      if (pending.length) card.createDiv({ cls: "cm-pending", text: `${pending.length} flag${pending.length > 1 ? "s" : ""} resolved; logged when you verify.` });
      const row = card.createDiv({ cls: "cm-card-buttons" });
      const mk = (text, cls, fn, hk) => {
        const b = row.createEl("button", { text, cls });
        b.setAttr("aria-label", hk);
        b.addEventListener("click", fn);
      };
      mk("Verify", "mod-cta", () => p.verify(cur), "Alt+V");
      mk("Skip", "", () => p.skip(cur), "Alt+S");
      mk("Reject", "cm-danger", () => p.reject(cur), "Alt+R");
    } else {
      const start = root.createDiv({ cls: "cm-card" });
      start.createDiv({ cls: "cm-card-label", text: curItem ? `“${curItem.name}” is verified` : "Not reviewing a draft" });
      const b = start.createEl("button", { cls: "mod-cta cm-gbtn", text: drafts.length ? "Open next draft" : "Queue is empty" });
      b.disabled = !drafts.length;
      b.setAttr("aria-label", "Alt+N");
      b.addEventListener("click", (e) => p.openNext(cur ? cur.path : null, undefined, e.ctrlKey || e.metaKey));
    }

    // the queue
    const order = p.queue();
    const rechecks = order.filter((i) => i.changes.length);
    const fresh = order.filter((i) => !i.changes.length);
    const drawRows = (title, rows) => {
      const list = root.createDiv({ cls: "cm-list" });
      list.createDiv({ cls: "cm-list-head", text: `${title} (${rows.length})` });
      let lastGroup = null;
      rows.forEach((item) => {
        if (p.settings.sort === "type" && item.group !== lastGroup) {
          list.createDiv({ cls: "cm-group", text: item.group });
          lastGroup = item.group;
        }
        const row = list.createDiv({ cls: "cm-row" });
        if (cur && item.path === cur.path) row.addClass("is-current");
        if (p.skipped.includes(item.path)) row.addClass("is-skipped");
        if (item.changes.length) row.addClass("has-changes");
        if (item.flags.length) row.addClass("has-flags");
        const nameEl = row.createDiv({ cls: "cm-row-name", text: item.name });
        if (p.settings.sort !== "type") nameEl.createSpan({ cls: "cm-row-group", text: item.group });
        changeBadge(row, item.changes);
        flagBadges(row, item.flags, item.path);
        row.setAttr("data-path", item.path);
        row.addEventListener("click", (e) => p.openFile(item.path, e.ctrlKey || e.metaKey));
      });
    };
    if (rechecks.length) drawRows("Changed since verified", rechecks);
    drawRows(rechecks.length ? "New drafts" : "Drafts", fresh);

    if (verified.length) {
      const det = root.createEl("details", { cls: "cm-verified" });
      det.createEl("summary", { text: `Verified (${verified.length})` });
      verified.sort((a, b) => a.name.localeCompare(b.name)).forEach((item) => {
        const row = det.createDiv({ cls: "cm-row" });
        row.createDiv({ cls: "cm-row-name", text: item.name });
        row.addEventListener("click", (e) => p.openFile(item.path, e.ctrlKey || e.metaKey));
      });
    }
    BADGE_STATE.primed = true;
    // rows that moved slide from their old place to their new one
    if (before.size && !prefersReduced()) {
      root.querySelectorAll(".cm-row[data-path]").forEach((r) => {
        const old = before.get(r.getAttribute("data-path"));
        if (old === undefined) return;
        const d = old - r.getBoundingClientRect().top;
        if (Math.abs(d) < 3) return;
        r.style.transition = "none";
        r.style.transform = `translateY(${d}px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transition = "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)"; r.style.transform = ""; }));
      });
    }
  }
}

