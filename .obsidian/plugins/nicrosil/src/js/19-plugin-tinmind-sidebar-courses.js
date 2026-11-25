  /* ---------- The Tinmind's sidebar and course pages (3.1.0) ---------- */
  /*
   * In Tinmind mode the file list is replaced, under the two buttons, by a tree of the semester's courses, so my class notes can be
   * made, renamed and deleted without the folders. A course is its notes file (`type: class-notes`, the "hub") and the folder next to
   * it with the same name (The Tinmind/Fall 26/SAIL.md and The Tinmind/Fall 26/SAIL/). The tree shows that folder's
   * notes and folders as they are, and the hub's headings. The same tree and a **New note** button are drawn at the top of each hub
   * page. All of it comes from folders and from Obsidian's index of headings and properties: Nicrosil never reads what the notes say,
   * and the page files are not changed by the panel.
   */

  isClassHub(file) {
    if (!(file instanceof TFile) || file.extension !== "md" || !file.path.startsWith(NOTES_DIR)) return false;
    if (this.isTinDashboard(file) || file.path === ALL_NOTES_PAGE + ".md") return false; // the Tinmind's own pages are not courses
    const fm = (this.app.metadataCache.getFileCache(file) || {}).frontmatter;
    return !!fm && (fm.type === "class-notes" || (fm.type === "notebook" && file.path === NOTEBOOK_PAGE + ".md")); // the Notebook works like a course with no semester (3.10.0)
  }

  isNotebook(file) { return file instanceof TFile && file.path === NOTEBOOK_PAGE + ".md"; }

  /** The Notebook page, when it is there and its properties are indexed (3.10.0). */
  notebookFile() {
    const f = this.app.vault.getAbstractFileByPath(NOTEBOOK_PAGE + ".md");
    return f instanceof TFile && this.isClassHub(f) ? f : null;
  }

  /** The folder that holds a course's own notes: the hub's folder plus the hub's name (a leftover " Notes" from before 3.5.0 is ignored). */
  courseFolderPath(hub) {
    const dir = hub.parent && hub.parent.path && hub.parent.path !== "/" ? hub.parent.path + "/" : "";
    return dir + hub.basename.replace(/ Notes$/, "");
  }

  courseCtx(hub) {
    const fm = (this.app.metadataCache.getFileCache(hub) || {}).frontmatter || {};
    return { hub, course: String(fm.course || hub.basename.replace(/ Notes$/, "")), semester: String(fm.semester || "").trim(), folder: this.courseFolderPath(hub), notebook: this.isNotebook(hub) };
  }

  /** The semesters and courses found in the Tinmind, and which semester is showing (the saved pick, else the current or newest). */
  tinSemesterState() {
    const all = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (!f.path.startsWith(NOTES_DIR)) continue;
      const fm = (this.app.metadataCache.getFileCache(f) || {}).frontmatter;
      if (!fm || fm.type !== "class-notes" || !fm.semester) continue;
      const order = Number(fm.order);
      all.push({ file: f, order: Number.isFinite(order) ? order : 999, name: String(fm.course || f.basename), semester: String(fm.semester).trim(), current: fm.current === true });
    }
    // semesters made with New semester stay listed while their folder is there, even with no course in them yet
    const made = (this.settings.tinSemesters || []).filter((n) => this.app.vault.getAbstractFileByPath(NOTES_DIR + n) instanceof TFolder);
    const semesters = [...new Set([...all.map((c) => c.semester), ...made])].sort(byOldestSemester);
    const flagged = [...new Set(all.filter((c) => c.current).map((c) => c.semester))].sort(byOldestSemester);
    let chosen = this.settings.tinmindSemester;
    if (!semesters.includes(chosen)) chosen = newestSemester(flagged) || newestSemester(semesters);
    const courses = all.filter((c) => c.semester === chosen).sort((p, q) => p.order - q.order || p.name.localeCompare(q.name));
    return { all, semesters, chosen, courses };
  }

  treeSig(folder) {
    if (!(folder instanceof TFolder)) return "";
    return folder.children.map((c) => (c instanceof TFolder ? c.path + "/" + this.treeSig(c) : c.path)).join(",");
  }

  /** What a hub panel shows, as one string, so it is only redrawn when that changes. */
  hubSig(file) {
    const folder = this.app.vault.getAbstractFileByPath(this.courseFolderPath(file));
    const cache = this.app.metadataCache.getFileCache(file) || {};
    const heads = (cache.headings || []).map((h) => h.level + h.heading).join("|");
    const active = this.app.workspace.getActiveFile();
    return [file.path, (cache.frontmatter || {}).course, this.treeSig(folder), heads, active ? active.path : "", JSON.stringify(this.settings.tinOpen || {})].join("¦");
  }

  /** Redraws the sidebar tree and every hub panel (after a change in the Tinmind folder, a click, or a switch of mode). */
  refreshTin() {
    const st = this.tinSemesterState();
    const nbf = this.notebookFile();
    const sideSig = [st.chosen, st.semesters.join(","), ...st.courses.map((c) => this.hubSig(c.file)), nbf ? this.hubSig(nbf) : ""].join("§");
    document.querySelectorAll(".cm-tin-side").forEach((el) => {
      if (el.dataset.sig === sideSig) return;
      el.dataset.sig = sideSig;
      this.drawTinSide(el);
    });
    document.querySelectorAll(".cm-hub").forEach((el) => {
      if (!el.__cmFile || !el.isConnected) return;
      const sig = this.hubSig(el.__cmFile);
      if (el.dataset.sig === sig) return;
      el.dataset.sig = sig;
      this.drawHub(el, el.__cmFile);
    });
  }

  /** Makes sure a file list has the tree box under the two buttons. */
  ensureTinSide(holder) {
    if (holder.querySelector(":scope > .cm-tin-side")) return;
    const after = holder.querySelector(":scope > .cm-tin-btn");
    if (!after) return;
    const side = createDiv({ cls: "cm-tin-side" });
    after.after(side);
    this.drawTinSide(side);
  }

  drawTinSide(el) {
    el.empty();
    const st = this.tinSemesterState();
    if (st.semesters.length) this.drawSemSwitch(el, st.semesters, st.chosen, true); // under the Tinmind button (3.11.1)
    const list = el.createDiv({ cls: "cm-tin-list" });
    for (const c of st.courses) this.drawTinCourse(list, c);
    if (!st.courses.length) list.createDiv({ cls: "cm-sub", text: "No courses yet." });
    const nbf = this.notebookFile(); // pinned under the semester's courses, whichever semester is picked (3.10.0)
    if (nbf) this.drawTinCourse(el.createDiv({ cls: "cm-tin-pin" }), { file: nbf, name: "Notebook", icon: "pen-line" });
    const foot = el.createDiv({ cls: "cm-tin-foot" });
    const all = this.tinRow(foot, { depth: 0, icon: "library", label: "All Class Notes" });
    all.addEventListener("click", (e) => this.app.workspace.openLinkText(ALL_NOTES_PAGE, "", e.ctrlKey || e.metaKey));
    const add = this.tinRow(foot, { depth: 0, icon: "plus", label: "New course" });
    add.addClass("cm-tin-add");
    add.addEventListener("click", () => this.tinNewCourse(st));
    const addSem = this.tinRow(foot, { depth: 0, icon: "calendar-plus", label: "New semester" });
    addSem.addClass("cm-tin-add");
    addSem.addEventListener("click", () => this.tinNewSemester(st));
  }

  tinToggle(path) {
    const open = this.settings.tinOpen || (this.settings.tinOpen = {});
    open[path] = !open[path];
    this.persist();
    this.refreshTin();
  }

  /** Marks a course and the folders down to `folderPath` as open, so a new note is visible in the tree. */
  tinExpandTo(folderPath, ctx) {
    const open = this.settings.tinOpen || (this.settings.tinOpen = {});
    open[ctx.hub.path] = true;
    let cur = ctx.folder;
    open[cur] = true;
    if (folderPath.startsWith(ctx.folder + "/")) {
      for (const part of folderPath.slice(ctx.folder.length + 1).split("/")) { cur += "/" + part; open[cur] = true; }
    }
    this.persist();
  }

  tinRow(parentEl, o) {
    const row = parentEl.createDiv({ cls: "cm-tin-row" + (o.active ? " is-active" : "") + (o.cls ? " " + o.cls : "") });
    row.style.paddingLeft = 6 + o.depth * 14 + "px";
    const chev = row.createSpan({ cls: "cm-tin-chev" });
    if (o.chev !== undefined) setIcon(chev, o.chev ? "chevron-down" : "chevron-right");
    setIcon(row.createSpan({ cls: "cm-tin-icon" }), o.icon);
    row.createSpan({ cls: "cm-tin-label", text: o.label });
    // Middle button (3.6.1): no autoscroll cursor on a row, and a middle-click does what Ctrl+click does.
    row.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
    row.addEventListener("auxclick", (e) => {
      if (e.button !== 1 || e.__cmMiddle) return;
      e.preventDefault();
      row.dispatchEvent(new MouseEvent("click", { bubbles: false, cancelable: true, ctrlKey: true, button: 0 }));
    });
    return row;
  }

  /** Adds the "..." button and the right-click menu to a row. */
  tinRowMenu(row, show) {
    const more = row.createSpan({ cls: "cm-tin-more clickable-icon" });
    setIcon(more, "more-horizontal");
    more.setAttr("aria-label", "More");
    const fire = (e) => { e.preventDefault(); e.stopPropagation(); show(e); };
    more.addEventListener("click", fire);
    row.addEventListener("contextmenu", fire);
  }

  drawTinCourse(list, c) {
    const ctx = this.courseCtx(c.file);
    const open = this.settings.tinOpen || (this.settings.tinOpen = {});
    const isOpen = !!open[c.file.path];
    const active = this.app.workspace.getActiveFile();
    const row = this.tinRow(list, { depth: 0, icon: c.icon || "book-open", label: c.name, chev: isOpen, cls: "cm-tin-course", active: !!active && active.path === c.file.path });
    row.querySelector(".cm-tin-chev").addEventListener("click", (e) => { e.stopPropagation(); this.tinToggle(c.file.path); });
    row.addEventListener("click", (e) => {
      if (!isOpen) { open[c.file.path] = true; this.persist(); }
      this.openTinFile(c.file, e.ctrlKey || e.metaKey);
      this.refreshTin();
    });
    const plus = row.createSpan({ cls: "cm-tin-plus clickable-icon" });
    setIcon(plus, "plus");
    plus.setAttr("aria-label", "New note");
    plus.addEventListener("click", (e) => { e.stopPropagation(); this.tinNewNote(ctx.folder, ctx); });
    this.tinRowMenu(row, (e) => this.tinCourseMenu(e, ctx));
    if (!isOpen) return;
    this.drawCourseBody(list, ctx, 1);
  }

  /** The inside of a course: its folder's notes and folders, then the hub's own headings. Used by the sidebar and by the hub panel. */
  drawCourseBody(parentEl, ctx, depth) {
    const folder = this.app.vault.getAbstractFileByPath(ctx.folder);
    const hasNotes = folder instanceof TFolder && folder.children.some((k) => k instanceof TFolder || (k instanceof TFile && k.extension === "md"));
    if (hasNotes) this.drawTinFolder(parentEl, folder, depth, ctx);
    const heads = ((this.app.metadataCache.getFileCache(ctx.hub) || {}).headings || []).filter((h) => h.level <= 3);
    if (heads.length) {
      if (hasNotes) parentEl.createDiv({ cls: "cm-tin-label2", text: "On the course page" }).style.paddingLeft = 6 + depth * 14 + "px";
      const minLevel = Math.min(...heads.map((h) => h.level));
      for (const h of heads) {
        const row = this.tinRow(parentEl, { depth: depth + (h.level - minLevel), icon: "hash", label: h.heading, cls: "cm-tin-heading" });
        row.addEventListener("click", (e) => this.app.workspace.openLinkText(ctx.hub.path.replace(/\.md$/, "") + "#" + h.heading, "", e.ctrlKey || e.metaKey));
      }
    }
    if (!hasNotes && !heads.length) {
      const empty = parentEl.createDiv({ cls: "cm-tin-empty", text: "No notes yet. " });
      empty.style.paddingLeft = 6 + depth * 14 + "px";
      const a = empty.createEl("a", { text: "New note" });
      a.addEventListener("click", () => this.tinNewNote(ctx.folder, ctx));
    }
  }

  drawTinFolder(parentEl, folder, depth, ctx) {
    const kids = [...folder.children].filter((k) => k instanceof TFolder || (k instanceof TFile && k.extension === "md"));
    kids.sort((a, b) => ((a instanceof TFolder) === (b instanceof TFolder) ? naturalCompare(a.name, b.name) : a instanceof TFolder ? -1 : 1));
    const active = this.app.workspace.getActiveFile();
    const open = this.settings.tinOpen || (this.settings.tinOpen = {});
    for (const k of kids) {
      if (k instanceof TFolder) {
        const isOpen = !!open[k.path];
        const row = this.tinRow(parentEl, { depth, icon: isOpen ? "folder-open" : "folder", label: k.name, chev: isOpen, cls: isOpen ? "is-open" : "" });
        row.addEventListener("click", (e) => { if (!e.ctrlKey) this.tinToggle(k.path); });
        this.tinRowMenu(row, (e) => this.tinItemMenu(e, k, ctx));
        // an open folder's notes sit in their own block (3.25.0), so the course page can draw a guide line beside them; the sidebar draws it exactly as before
        if (isOpen) this.drawTinFolder(parentEl.createDiv({ cls: "cm-tin-nest" }), k, depth + 1, ctx);
      } else {
        const row = this.tinRow(parentEl, { depth, icon: "file-text", label: k.basename, active: !!active && active.path === k.path });
        row.addEventListener("click", (e) => this.openTinFile(k, e.ctrlKey || e.metaKey));
        this.tinRowMenu(row, (e) => this.tinItemMenu(e, k, ctx));
      }
    }
  }

  async openTinFile(file, newTab) {
    await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file, { state: { mode: "source" } }); // editing view (3.3.1)
  }

  tinCourseMenu(e, ctx) {
    const menu = new Menu();
    menu.addItem((i) => i.setTitle("New note").setIcon("file-plus").onClick(() => this.tinNewNote(ctx.folder, ctx)));
    menu.addItem((i) => i.setTitle("New folder").setIcon("folder-plus").onClick(() => this.tinNewFolder(ctx.folder, ctx)));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle(ctx.notebook ? "Open the Notebook page" : "Open the course page").setIcon("book-open").onClick(() => this.openTinFile(ctx.hub, false)));
    if (!ctx.notebook) { // 3.20.0: the Notebook is pinned and has no delete
      menu.addSeparator();
      menu.addItem((i) => i.setTitle("Delete course").setIcon("trash-2").setWarning(true).onClick(() => this.tinDeleteCourse(ctx)));
    }
    menu.showAtMouseEvent(e);
  }

  /**
   * Delete a course (3.20.0): its page and its folder go to the trash together, after a question that says how many files are in the folder.
   * The folder goes first, so a failure leaves the page (and the course) in place. Nothing else is touched; links to the deleted notes are left as they are.
   */
  async tinDeleteCourse(ctx) {
    const hub = ctx.hub;
    if (!hub || ctx.notebook) return;
    const name = ctx.course || hub.basename.replace(/ Notes$/, "");
    const folder = this.app.vault.getAbstractFileByPath(ctx.folder);
    let count = 0;
    const walk = (f) => f.children.forEach((c) => (c instanceof TFolder ? walk(c) : count++));
    if (folder instanceof TFolder) walk(folder);
    const message = count
      ? `Delete the course "${name}"? Its page and its folder, with the ${count} file${count === 1 ? "" : "s"} in it, go to the trash. Move any notes you want to keep first.`
      : `Delete the course "${name}"? Its page${folder instanceof TFolder ? " and its empty folder" : ""} go to the trash.`;
    if (!(await this.tinConfirm({ title: "Delete course", message, ok: "Delete course" }))) return;
    try {
      if (folder instanceof TFolder) await this.app.fileManager.trashFile(folder);
      await this.app.fileManager.trashFile(hub);
      const open = this.settings.tinOpen || {};
      for (const k of Object.keys(open)) if (k === hub.path || k.startsWith(ctx.folder + "/")) delete open[k];
      this.persist();
      new Notice(`Deleted the course "${name}". It is in the trash.`);
    } catch (e) {
      console.error("Nicrosil: couldn't delete the course", e);
      new Notice("Couldn't delete that course. See the console for why.");
    }
    this.refreshTin();
    this.dashboards.forEach((r) => r());
  }

  tinItemMenu(e, target, ctx) {
    const menu = new Menu();
    if (target instanceof TFolder) {
      menu.addItem((i) => i.setTitle("New note here").setIcon("file-plus").onClick(() => this.tinNewNote(target.path, ctx)));
      menu.addItem((i) => i.setTitle("New folder here").setIcon("folder-plus").onClick(() => this.tinNewFolder(target.path, ctx)));
      menu.addSeparator();
    } else {
      menu.addItem((i) => i.setTitle("Open in a new tab").setIcon("external-link").onClick(() => this.openTinFile(target, true)));
      menu.addSeparator();
    }
    menu.addItem((i) => i.setTitle("Rename").setIcon("pencil").onClick(() => this.tinRename(target)));
    menu.addItem((i) => i.setTitle("Delete").setIcon("trash-2").setWarning(true).onClick(() => this.tinDelete(target)));
    menu.showAtMouseEvent(e);
  }

  tinPrompt(opts) { return new Promise((resolve) => new TinPromptModal(this.app, opts, resolve).open()); }
  tinConfirm(opts) { return new Promise((resolve) => new TinConfirmModal(this.app, opts, resolve).open()); }

  async tinEnsureFolder(path) {
    let cur = "";
    for (const part of path.split("/")) {
      cur = cur ? cur + "/" + part : part;
      if (!this.app.vault.getAbstractFileByPath(cur)) await this.app.vault.createFolder(cur);
    }
  }

  tinUniquePath(dir, name, ext) {
    let p = `${dir}/${name}${ext}`, n = 2;
    while (this.app.vault.getAbstractFileByPath(p)) p = `${dir}/${name} ${n++}${ext}`;
    return p;
  }

  /** Asks for a name and makes a note in `folderPath` (made if it isn't there yet), with the course and semester as properties and a link back to the course page. */
  async tinNewNote(folderPath, ctx, quick = false) {
    // The name starts as "<course> mm-dd-yy" for today (dashes, because a file name can't hold slashes); Enter takes it, or add to it first. A second note the same day gets " 2".
    const now = new Date(), pad = (n) => String(n).padStart(2, "0");
    const stamp = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${String(now.getFullYear()).slice(-2)}`;
    // quick (3.10.0): the Notebook's Quick note takes that name without asking.
    const name = cleanName(quick ? `${ctx.course} ${stamp}` : await this.tinPrompt({ title: "New note", label: `In ${ctx.course}`, value: `${ctx.course} ${stamp}`, caret: "end", ok: "Create" }));
    if (!name) return;
    try {
      await this.tinEnsureFolder(folderPath);
      const path = this.tinUniquePath(folderPath, name, ".md");
      const body = ctx.notebook ? `---\ntype: notebook-note\n---\n` : `---\ntype: course-note\ncourse: ${JSON.stringify(ctx.course)}\nsemester: ${JSON.stringify(ctx.semester)}\n---\n`;
      const file = await this.app.vault.create(path, body);
      this.tinExpandTo(folderPath, ctx);
      await this.app.workspace.getLeaf(false).openFile(file, { state: { mode: "source" } });
    } catch (e) {
      console.error("Nicrosil: couldn't make the note", e);
      new Notice("Couldn't make that note. See the console for why.");
    }
    this.refreshTin();
  }

  /** The Notebook card's Quick note (3.10.0): a note named "Notebook mm-dd-yy" in the Notebook folder, made and opened ready to type with no question asked. */
  async tinQuickNote() {
    const nb = this.notebookFile();
    if (!nb) { new Notice("The Notebook page isn't there yet: The Tinmind/Notebook.md with type: notebook."); return; }
    const ctx = this.courseCtx(nb);
    await this.tinNewNote(ctx.folder, ctx, true);
  }

  async tinNewFolder(parentPath, ctx) {
    const name = cleanName(await this.tinPrompt({ title: "New folder", label: `In ${ctx.course}`, ok: "Create" }));
    if (!name) return;
    try {
      await this.tinEnsureFolder(parentPath);
      const path = this.tinUniquePath(parentPath, name, "");
      await this.app.vault.createFolder(path);
      this.tinExpandTo(parentPath, ctx);
      this.settings.tinOpen[path] = true;
      this.persist();
    } catch (e) {
      console.error("Nicrosil: couldn't make the folder", e);
      new Notice("Couldn't make that folder. See the console for why.");
    }
    this.refreshTin();
  }

  async tinRename(target) {
    const isFolder = target instanceof TFolder;
    const current = isFolder ? target.name : target.basename;
    const name = cleanName(await this.tinPrompt({ title: isFolder ? "Rename folder" : "Rename note", value: current, ok: "Rename" }));
    if (!name || name === current) return;
    const dir = target.parent && target.parent.path && target.parent.path !== "/" ? target.parent.path + "/" : "";
    const newPath = dir + name + (isFolder ? "" : "." + target.extension);
    if (this.app.vault.getAbstractFileByPath(newPath)) { new Notice(`"${name}" already exists there.`); return; }
    const oldPath = target.path;
    try {
      await this.app.fileManager.renameFile(target, newPath); // Obsidian updates links to it
      const open = this.settings.tinOpen || {};
      for (const k of Object.keys(open)) {
        if (k === oldPath || k.startsWith(oldPath + "/")) { open[newPath + k.slice(oldPath.length)] = open[k]; delete open[k]; }
      }
      this.persist();
    } catch (e) {
      console.error("Nicrosil: couldn't rename", e);
      new Notice("Couldn't rename that. See the console for why.");
    }
    this.refreshTin();
  }

  async tinDelete(target) {
    const isFolder = target instanceof TFolder;
    let count = 0;
    const walk = (f) => f.children.forEach((c) => (c instanceof TFolder ? walk(c) : count++));
    if (isFolder) walk(target);
    const message = isFolder
      ? `Delete the folder "${target.name}" and the ${count} file${count === 1 ? "" : "s"} in it? They go to the trash.`
      : `Delete "${target.basename}"? It goes to the trash.`;
    if (!(await this.tinConfirm({ title: isFolder ? "Delete folder" : "Delete note", message, ok: "Delete" }))) return;
    try {
      await this.app.fileManager.trashFile(target);
    } catch (e) {
      console.error("Nicrosil: couldn't delete", e);
      new Notice("Couldn't delete that. See the console for why.");
    }
    this.refreshTin();
  }

  /** Asks for a semester name ("Fall 27", "Spring 2027"), makes its folder, and switches to it. The name is tidied to "Season YY" so the semesters sort by date. */
  async tinNewSemester(st) {
    let suggest = "";
    const newest = [...st.semesters].reverse().find((x) => semesterKey(x) !== null);
    if (newest) {
      const k = semesterKey(newest), y = Math.floor(k / 10), season = k % 10;
      suggest = season >= 3 ? `Spring ${String(y + 1).slice(-2)}` : season === 0 ? `Spring ${String(y).slice(-2)}` : `Fall ${String(y).slice(-2)}`;
    }
    const typed = cleanName(await this.tinPrompt({ title: "New semester", label: "A season and a year, such as Fall 27 or Spring 2027", value: suggest, ok: "Create" }));
    if (!typed) return;
    const m = /^(winter|spring|summer|fall|autumn)\s+(\d{2}|\d{4})$/i.exec(typed);
    if (!m) { new Notice("Use a season and a year, such as Fall 27, so semesters stay in order."); return; }
    const name = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() + " " + m[2].slice(-2);
    try {
      if (!st.semesters.includes(name)) {
        await this.tinEnsureFolder(NOTES_DIR + name);
        this.settings.tinSemesters = [...new Set([...(this.settings.tinSemesters || []), name])];
      }
      this.settings.tinmindSemester = name;
      await this.persist();
      this.dashboards.forEach((r) => r());
    } catch (e) {
      console.error("Nicrosil: couldn't make the semester", e);
      new Notice("Couldn't make that semester. See the console for why.");
    }
    this.refreshTin();
  }

  /** Makes a course page (and, on its first note, its folder) for the semester showing. */
  async tinNewCourse(st) {
    if (!st.chosen) { new Notice("There is no semester yet. Make one with New semester first."); return; }
    const name = cleanName(await this.tinPrompt({ title: "New course", label: `In ${st.chosen}`, ok: "Create" }));
    if (!name) return;
    try {
      const dir = st.courses.length ? st.courses[0].file.parent.path : NOTES_DIR + st.chosen;
      await this.tinEnsureFolder(dir);
      const path = this.tinUniquePath(dir, name, ".md"); // the course page is named for the course (3.5.0)
      const order = st.courses.reduce((m, c) => (c.order < 999 ? Math.max(m, c.order) : m), 0) + 1;
      const current = st.courses.some((c) => c.current);
      const body = `---\ntype: class-notes\ncourse: ${JSON.stringify(name)}\nsemester: ${JSON.stringify(st.chosen)}\ncurrent: ${current}\norder: ${order}\n---\n`;
      const file = await this.app.vault.create(path, body);
      this.settings.tinOpen = this.settings.tinOpen || {};
      this.settings.tinOpen[file.path] = true;
      this.persist();
    } catch (e) {
      console.error("Nicrosil: couldn't make the course", e);
      new Notice("Couldn't make that course. See the console for why.");
    }
    this.refreshTin();
  }

  /** The course page a note belongs to: found by walking up the note's folders for one whose name matches a course page (Fall 26/Chinese I/ goes with Fall 26/Chinese I.md). */
  backTarget(file) {
    if (!(file instanceof TFile) || file.extension !== "md" || !file.path.startsWith(NOTES_DIR)) return null;
    if (this.isClassHub(file) || this.isTinDashboard(file) || file.path === ALL_NOTES_PAGE + ".md") return null;
    const root = NOTES_DIR.replace(/\/$/, "");
    let p = file.parent;
    while (p && p.path && p.path !== "/" && p.path.startsWith(root)) {
      const h = this.app.vault.getAbstractFileByPath(p.path + ".md");
      if (h instanceof TFile && this.isClassHub(h)) return h;
      p = p.parent;
    }
    return null;
  }

  drawBackPill(pill, hub) {
    pill.empty();
    pill.setAttribute("aria-label", this.isNotebook(hub) ? "Go to the Notebook page (Ctrl+click for a new tab)" : "Go to the course page (Ctrl+click for a new tab)");
    setIcon(pill.createSpan({ cls: "cm-backpill-icon" }), "arrow-left");
    pill.createSpan({ text: this.courseCtx(hub).course });
  }

  /** The panel at the top of a course page: New note and New folder buttons, the course's notes, and the page's headings. Drawn on screen; the page file is not changed. */
  drawHub(panel, file) {
    panel.empty();
    const ctx = this.courseCtx(file);
    // Open tree (3.25.0): a section heading with a rule running out to the right, and the two actions as text links.
    const head = panel.createDiv({ cls: "cm-hub-head" });
    head.createEl("h4", { cls: "cm-hub-title cm-tin-gradient-style", text: "Notes" });
    head.createDiv({ cls: "cm-hub-rule" });
    const btns = head.createDiv({ cls: "cm-hub-btns" });
    const act = (label, icon, fn) => {
      const b = btns.createEl("button", { cls: "cm-hub-act" });
      setIcon(b.createSpan({ cls: "cm-hub-act-icon" }), icon);
      b.createSpan({ text: label });
      b.addEventListener("click", fn);
    };
    act("New note", "plus", () => this.tinNewNote(ctx.folder, ctx));
    btns.createDiv({ cls: "cm-hub-sep" });
    act("New folder", "folder-plus", () => this.tinNewFolder(ctx.folder, ctx));
    const body = panel.createDiv({ cls: "cm-hub-body" });
    this.drawCourseBody(body, ctx, 0);
  }

  /** One time (3.2.0): The Tinmind/Notes Dashboard.md becomes Tinmind Dashboard.md. Obsidian's own rename, so links to it follow. */
  async migrateTinDashboard() {
    const old = this.app.vault.getAbstractFileByPath(OLD_NOTES_DASHBOARD);
    if (!(old instanceof TFile) || this.app.vault.getAbstractFileByPath(NOTES_DASHBOARD + ".md")) return;
    try {
      await this.app.fileManager.renameFile(old, NOTES_DASHBOARD + ".md");
      new Notice("Renamed Notes Dashboard to Tinmind Dashboard.", 6000);
    } catch (e) {
      console.error("Nicrosil: couldn't rename the Tinmind Dashboard", e);
      new Notice(`Couldn't rename Notes Dashboard to Tinmind Dashboard: ${e.message}. Rename it by hand in the file list.`, 10000);
    }
  }

  /**
   * One time (3.3.0): takes the "← [[...Dashboard]]" line out of the Tinmind's notes (course pages had one under their properties).
   * The Tinmind button already goes back. Only a line that is exactly that link is removed; nothing else in a note is touched.
   * It runs once, at startup, and the count is shown. New course pages are made without the line.
   */
  async migrateTinBacklinks() {
    if (this.settings.tinBacklinksRemoved) return;
    const re = /^[ \t]*\u2190[ \t]*\[\[[^\]\n]*(?:Notes|Tinmind) Dashboard[^\]\n]*\]\][ \t]*(?:\r?\n|$)/gm;
    let n = 0;
    try {
      for (const f of this.app.vault.getMarkdownFiles()) {
        if (!f.path.startsWith(NOTES_DIR) || this.isTinDashboard(f) || f.path === OLD_NOTES_DASHBOARD || f.path === ALL_NOTES_PAGE + ".md") continue;
        let changed = false;
        await this.app.vault.process(f, (text) => {
          const next = text.replace(re, "");
          changed = next !== text;
          return next;
        });
        if (changed) n++;
      }
      this.settings.tinBacklinksRemoved = true;
      await this.persist();
      if (n) new Notice(`Removed the link to the Tinmind Dashboard from ${n} course note${n === 1 ? "" : "s"}.`, 8000);
    } catch (e) {
      console.error("Nicrosil: couldn't remove the dashboard links", e);
    }
  }

  /**
   * One time (3.5.0): a course page named "<Course> Notes" becomes "<Course>" (Obsidian's own rename, so links follow). Only a note directly in a
   * semester folder with `type: class-notes` is renamed, and not if the new name is taken or another note anywhere already has that name (links by
   * name would become ambiguous). Notes whose properties aren't indexed yet are left for the next run; it runs again until all are seen.
   */
  async migrateHubNames() {
    if (this.settings.tinHubsRenamed || this._renamingHubs) return;
    this._renamingHubs = true;
    try {
      const re = /^The Tinmind\/[^/]+\/([^/]+) Notes\.md$/;
      let pending = false, n = 0;
      const skipped = [];
      const open = this.settings.tinOpen || {};
      for (const f of [...this.app.vault.getMarkdownFiles()]) {
        const m = re.exec(f.path);
        if (!m) continue;
        const cache = this.app.metadataCache.getFileCache(f);
        if (!cache) { pending = true; continue; }
        if (!cache.frontmatter || cache.frontmatter.type !== "class-notes") continue;
        const target = f.parent.path + "/" + m[1] + ".md";
        if (this.app.vault.getAbstractFileByPath(target) || this.app.vault.getMarkdownFiles().some((g) => g !== f && g.basename === m[1])) { skipped.push(m[1]); continue; }
        const oldPath = f.path;
        try {
          await this.app.fileManager.renameFile(f, target);
          if (open[oldPath] !== undefined) { open[target] = open[oldPath]; delete open[oldPath]; }
          n++;
        } catch (e) { console.error("Nicrosil: couldn't rename a course page", e); skipped.push(m[1]); }
      }
      if (!pending) { this.settings.tinHubsRenamed = true; }
      await this.persist();
      if (n) new Notice(`Renamed ${n} course page${n === 1 ? "" : "s"}: "Notes" is gone from the end of their names.`, 8000);
      if (skipped.length) new Notice(`Left these course pages as they are, because another note already has that name: ${skipped.join(", ")}.`, 12000);
      if (n) this.refreshTin();
    } catch (e) {
      console.error("Nicrosil: couldn't rename the course pages", e);
    } finally {
      this._renamingHubs = false;
    }
  }

  /**
   * One time (3.6.0): takes the "← [[The Tinmind/.../Course]]" line out of the notes inside courses (type: course-note). The pill above the title
   * does that job now. Only that one line, at the start of a line and pointing into The Tinmind/, and the blank line after it; nothing else is touched.
   */
  async migrateCourseLinks() {
    if (this.settings.tinCourseLinksRemoved) return;
    const re = /^\u2190[ \t]*\[\[The Tinmind\/[^\]\n]*\]\][ \t]*\r?\n(?:[ \t]*\r?\n)?/m;
    let n = 0;
    try {
      for (const f of this.app.vault.getMarkdownFiles()) {
        if (!f.path.startsWith(NOTES_DIR) || this.isTinDashboard(f) || f.path === ALL_NOTES_PAGE + ".md") continue;
        let changed = false;
        await this.app.vault.process(f, (text) => {
          if (!/^---\r?\n(?:[^\n]*\n){0,8}?type:[ \t]*"?course-note"?/.test(text)) return text;
          const next = text.replace(re, "");
          changed = next !== text;
          return next;
        });
        if (changed) n++;
      }
      this.settings.tinCourseLinksRemoved = true;
      await this.persist();
      if (n) new Notice(`Took the course link out of ${n} note${n === 1 ? "" : "s"}; a button above the title does that now.`, 8000);
    } catch (e) {
      console.error("Nicrosil: couldn't remove the course links", e);
    }
  }

  /** One-time: rename Home.md to Dashboard.md (Obsidian updates links) and repoint the startup-page plugin. */
  async migrateHome() {
    const old = this.app.vault.getAbstractFileByPath(OLD_HOME_PATH);
    if (!(old instanceof TFile) || this.app.vault.getAbstractFileByPath(DASHBOARD_PATH)) return;
    try {
      await this.app.fileManager.renameFile(old, DASHBOARD_PATH);
      await this.fixHomepageSetting();
      await this.appendLog(renameLogEntry(today()));
      new Notice("Renamed Home to Dashboard and updated its links. Restart Obsidian once so the startup page uses the new name.", 15000);
    } catch (e) {
      console.error("Nicrosil: rename failed", e);
      new Notice(`Couldn't rename Home to Dashboard: ${e.message}. Rename it by hand in the file list.`, 10000);
    }
  }

  /** One time, after the rules moved to SCHEMAS/ (rules 7.0): the old SCHEMA.md at the top of the vault is a
   *  "moved" stub, so it goes to the trash, leaving one page named SCHEMA for links to find. Only a file that
   *  carries the stub's `moved_to` property is touched. */
  async migrateSchemaStub() {
    const old = this.app.vault.getAbstractFileByPath("SCHEMA.md");
    if (!(old instanceof TFile) || !(this.app.vault.getAbstractFileByPath(SCHEMA_PATH) instanceof TFile)) return;
    if (frontmatterValue(await this.app.vault.read(old), "moved_to") !== SCHEMA_PATH) return;
    try {
      await this.app.fileManager.trashFile(old);
      new Notice("The rules now live in SCHEMAS/, so the old SCHEMA.md at the top of the vault was moved to the trash.", 10000);
    } catch (e) {
      console.error("Nicrosil: couldn't remove the old SCHEMA.md", e);
      new Notice(`Couldn't remove the old SCHEMA.md: ${e.message}. Delete it by hand; the rules are in SCHEMAS/.`, 10000);
    }
  }

  async fixHomepageSetting() {
    const path = `${this.app.vault.configDir}/plugins/homepage/data.json`;
    try {
      if (!(await this.app.vault.adapter.exists(path))) return;
      const data = JSON.parse(await this.app.vault.adapter.read(path));
      let changed = false;
      Object.values(data.homepages || {}).forEach((h) => {
        if (h && [OLD_HOME_PATH, "Home", "Dashboard.md", "Dashboard"].includes(h.value)) { h.value = DASHBOARD_PATH; h.view = "Reading view"; changed = true; }
      });
      if (changed) await this.app.vault.adapter.write(path, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Nicrosil: couldn't update the startup page setting", e);
      new Notice("Couldn't update the startup page setting. In Settings → Homepage, choose _dashboard.", 10000);
    }
  }

  /**
   * The atlas's data (3.29.0): every page in Wiki/ and Perspectives/, the links between them, the topics in _topics.md,
   * which topic each page is in, and where everything sits. Worked out again only when the links, the pages or the topic
   * list change; a status change only recolors. Shared by the atlas and the Lens.
   */
  async atlas() {
    const mc = this.app.metadataCache;
    const tf = this.app.vault.getAbstractFileByPath(TOPICS_PATH);
    const text = tf instanceof TFile ? await this.app.vault.cachedRead(tf) : null;
    const files = this.app.vault.getMarkdownFiles().filter((f) => inAtlasScope(f.path)).sort((a, b) => (a.path < b.path ? -1 : 1));
    const edges = collectLinks(this.app).filter((e) => inAtlasScope(e.from) && inAtlasScope(e.to));
    const key = `${text}\n${files.map((f) => f.path).join("\n")}\n${edges.map((e) => `${e.from}>${e.to}>${e.type}`).sort().join("\n")}`;
    const fmOf = (f) => (mc.getFileCache(f) || {}).frontmatter || {};
    if (this.atlasCache && this.atlasCache.key === key) {
      for (const f of files) { const n = this.atlasCache.nodes.get(f.path); if (n) { const fm = fmOf(f); n.state = pageState(fm); n.type = String(fm.type || ""); } }
      return this.atlasCache;
    }
    const nodes = new Map();
    for (const f of files) {
      const fm = fmOf(f);
      nodes.set(f.path, { path: f.path, name: f.basename, type: String(fm.type || ""), state: pageState(fm), out: [], inn: [], inDeg: 0 });
    }
    const adj = new Map([...nodes.keys()].map((p) => [p, new Map()]));
    for (const e of edges) {
      nodes.get(e.from).out.push(e);
      nodes.get(e.to).inn.push(e);
      const w = e.type === "see" ? 1 : 2; // a typed link ties two pages twice as closely as a plain one
      adj.get(e.from).set(e.to, (adj.get(e.from).get(e.to) || 0) + w);
      adj.get(e.to).set(e.from, (adj.get(e.to).get(e.from) || 0) + w);
    }
    for (const n of nodes.values()) n.inDeg = new Set(n.inn.map((e) => e.from)).size;

    const topics = text === null ? [] : parseTopics(text);
    const missing = [];
    const anchorSet = new Set();
    topics.forEach((t) => {
      t.paths = [];
      for (const name of t.anchors) {
        const dest = mc.getFirstLinkpathDest(name, TOPICS_PATH);
        if (dest && nodes.has(dest.path)) { t.paths.push(dest.path); anchorSet.add(dest.path); } else missing.push([t.name, name]);
      }
    });
    const ids = [...nodes.keys()];
    const { topic, score } = assignTopics(ids, adj, topics.map((t) => t.paths));
    const groups = topics.map((t, i) => ({ key: i, members: ids.filter((p) => topic.get(p) === i) })).filter((g) => g.members.length);
    const loose = ids.filter((p) => topic.get(p) < 0);
    if (loose.length) groups.push({ key: -1, members: loose });
    const lay = layoutAtlas(groups, adj, (p) => dotRadius(nodes.get(p).inDeg), anchorSet);
    lay.groups.forEach((g, i) => Object.assign(groups[i], { x: g.x, y: g.y, r: g.r }));
    // links between topics, counted once per page pair
    const pairs = new Map();
    const seen = new Set();
    for (const e of edges) {
      const a = topic.get(e.from), b = topic.get(e.to);
      const pk = e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`;
      if (a === b || seen.has(pk)) continue;
      seen.add(pk);
      const k = a < b ? `${a}|${b}` : `${b}|${a}`;
      pairs.set(k, (pairs.get(k) || 0) + 1);
    }
    this.atlasCache = { key, nodes, edges, adj, topics, topic, score, groups, pos: lay.pos, pairs, anchorSet, missing, hasFile: text !== null };
    return this.atlasCache;
  }

  /**
   * While the atlas is the page in front, both sidebars are closed so it has the room (3.30.0); when another page in the main
   * area comes to the front, or the atlas is closed, each sidebar that was open opens again. What was open is kept in
   * `settings.atlasSidebars`, so it survives a restart with the atlas still open. A sidebar I open myself meanwhile is left as I
   * set it, and working in a sidebar (the Lens, say) isn't leaving the atlas: the main area's front page is still the atlas.
   */
  syncAtlasSidebars() {
    const ws = this.app.workspace;
    const front = ws.getMostRecentLeaf ? ws.getMostRecentLeaf(ws.rootSplit) : null;
    const onAtlas = !!(front && front.view instanceof WikiMapView);
    const saved = this.settings.atlasSidebars;
    if (onAtlas && !saved) {
      const open = (s) => !!s && !s.collapsed;
      this.settings.atlasSidebars = { left: open(ws.leftSplit), right: open(ws.rightSplit) };
      this.persist();
      if (open(ws.leftSplit)) ws.leftSplit.collapse();
      if (open(ws.rightSplit)) ws.rightSplit.collapse();
    } else if (!onAtlas && saved) this.restoreAtlasSidebars();
  }

  restoreAtlasSidebars() {
    const ws = this.app.workspace, saved = this.settings && this.settings.atlasSidebars;
    if (!saved) return;
    delete this.settings.atlasSidebars;
    this.persist();
    if (saved.left && ws.leftSplit && ws.leftSplit.collapsed) ws.leftSplit.expand();
    if (saved.right && !this.settings.tinmindMode && ws.rightSplit && ws.rightSplit.collapsed) ws.rightSplit.expand(); // the Tinmind's mode keeps the right sidebar closed
  }

