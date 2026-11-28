/* ---------- Home dashboard block ---------- */

class LiveBlock extends MarkdownRenderChild {
  constructor(el, plugin, method) {
    super(el);
    this.plugin = plugin;
    this.method = method;
  }
  onload() {
    this.render = () => this.plugin[this.method](this.containerEl);
    this.plugin.dashboards.add(this.render);
    this.render();
  }
  onunload() { this.plugin.dashboards.delete(this.render); }
}

/* ---------- settings ---------- */

class ReviewSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const el = this.containerEl;
    el.empty();
    new Setting(el).setName("Open the next draft after verifying or rejecting")
      .setDesc("Keeps a review session moving without going back to the queue.")
      .addToggle((t) => t.setValue(this.plugin.settings.autoAdvance).onChange(async (v) => {
        this.plugin.settings.autoAdvance = v; await this.plugin.persist();
      }));
    new Setting(el).setName("Play an animation when I verify a page")
      .setDesc("A check stamp and a burst of sparks, then the next page slides in (with Open next after verify off, only the stamp and sparks play and the page stays put). It is skipped if your computer is set to reduce motion.")
      .addToggle((t) => t.setValue(this.plugin.settings.celebrate !== false).onChange(async (v) => {
        this.plugin.settings.celebrate = v; await this.plugin.persist();
      }));
    new Setting(el).setName("Keep the index up to date")
      .setDesc("When a page in Wiki, Perspectives or Source Cards is added, removed, renamed or moved, _index.md is updated by itself (entry, section, counts, total and the Jump to line). A new page's line uses its summary callout. “Update the index now” in the command palette does it on demand.")
      .addToggle((t) => t.setValue(this.plugin.settings.autoIndex !== false).onChange(async (v) => {
        this.plugin.settings.autoIndex = v; await this.plugin.persist();
        if (v) this.plugin.scheduleIndexSync(500);
      }));
    new Setting(el).setName("Show Connections on pages")
      .setDesc("A folding section above each wiki page's Footnotes heading (or at the end of a page without one) with the page's link counts, a map of its links, and lists of its links and of pages two steps away. Alt+L opens or folds it on every page. Turning it off takes effect on the pages you open next.")
      .addToggle((t) => t.setValue(this.plugin.settings.pageLens !== false).onChange(async (v) => {
        this.plugin.settings.pageLens = v; await this.plugin.persist();
        this.plugin.refreshPageLenses();
      }));
    new Setting(el).setName("Close the extra sidebar panels on startup")
      .setDesc("Closes Backlinks, Outgoing links, Tags, All properties and Outline in the sidebar each time Obsidian starts. You can still open any of them from the command palette during a session.")
      .addToggle((t) => t.setValue(this.plugin.settings.hidePanels !== false).onChange(async (v) => { this.plugin.settings.hidePanels = v; await this.plugin.persist(); }));
    new Setting(el).setName("Close the other tabs on startup")
      .setDesc("When Obsidian starts, keeps only the Dashboard open in the main area and closes every other tab, so a page left open last time (the transcription queue, a note) doesn't come back in the wrong mode. Does nothing when you only reload the plugin during a session.")
      .addToggle((t) => t.setValue(this.plugin.settings.closeTabsOnStart !== false).onChange(async (v) => { this.plugin.settings.closeTabsOnStart = v; await this.plugin.persist(); }));
    new Setting(el).setName("Open pages in Reading view")
      .setDesc("When a page is opened (from a link, the file list, search or the Dashboard), it opens in Reading view instead of editing. Switching to editing yourself sticks until you open a different page in that tab. \"Every page\" also covers drafts; empty new notes always open ready to type.")
      .addDropdown((d) => {
        Object.entries(READ_MODES).forEach(([k, v]) => d.addOption(k, v));
        d.setValue(this.plugin.settings.readMode || "verified").onChange(async (v) => { this.plugin.settings.readMode = v; await this.plugin.persist(); });
      });
    new Setting(el).setName("Days between health checks")
      .setDesc("The Dashboard's health check card fills up over this many days since the last report in Health Checks/, turns amber in the last two days, and turns red once it is overdue.")
      .addText((t) => {
        t.inputEl.type = "number"; t.inputEl.min = "1"; t.inputEl.max = "365"; t.inputEl.style.width = "70px";
        t.setValue(String(this.plugin.settings.healthDays || 14)).onChange(async (v) => {
          const n = parseInt(v, 10);
          if (!(n >= 1 && n <= 365)) return;
          this.plugin.settings.healthDays = n; await this.plugin.persist(); this.plugin.renderAll();
        });
      });
    new Setting(el).setName("Queue order")
      .setDesc("Clean pages first gives quick wins; flagged first tackles the hard ones while you're fresh.")
      .addDropdown((d) => {
        Object.entries(SORTS).forEach(([k, v]) => d.addOption(k, v));
        d.setValue(this.plugin.settings.sort).onChange(async (v) => {
          this.plugin.settings.sort = v; await this.plugin.persist(); this.plugin.renderAll();
        });
      });
    new Setting(el).setName("Claude Code for query mode")
      .setDesc("Where Claude Code is on this computer, for the search bar's Query switch. Leave it blank to look in the usual places (~/.local/bin, then npm's folder, then the PATH). Claude Code uses its own sign-in; only the live usage meter below reads it. Desktop only.")
      .addText((t) => {
        t.inputEl.style.width = "260px";
        t.setPlaceholder("Found by itself").setValue(this.plugin.settings.claudePath || "").onChange(async (v) => { this.plugin.settings.claudePath = v.trim(); await this.plugin.persist(); });
      })
      .addButton((b) => b.setButtonText("Test").onClick(() => {
        let child;
        try { child = this.plugin.spawnClaude(["--version"]); } catch (e) { new Notice("Couldn't start Claude Code: " + e.message, 8000); return; }
        let out = "";
        child.stdout.on("data", (c) => { out += c; });
        child.on("error", () => new Notice("Claude Code wasn't found. Install it, or set its path here.", 8000));
        child.on("close", (code) => { if (code === 0) new Notice(`Found Claude Code ${out.trim()} at ${this.plugin.claudeCommand()}.`, 6000); });
      }));
    new Setting(el).setName("Photos folder (for transcribing)")
      .setDesc("Where your phone photos of handwritten notes land on this computer. The Transcription queue lists new ones there and shrinks the ones you tick into Sources/Scans with Tools/shrink-scans/shrink_scans.py. Your originals are never changed. Desktop only.")
      .addText((t) => {
        t.inputEl.style.width = "300px";
        t.setPlaceholder("C:\\Users\\you\\Pictures\\Notes").setValue(this.plugin.settings.photosDir || "").onChange(async (v) => { this.plugin.settings.photosDir = v.trim(); await this.plugin.persist(); });
      });
    new Setting(el).setName("Python for shrinking")
      .setDesc("Where Python is, for the shrink tool. Leave it blank to try python, py and python3. The tool needs Pillow (pip install pillow).")
      .addText((t) => {
        t.inputEl.style.width = "260px";
        t.setPlaceholder("Found by itself").setValue(this.plugin.settings.pythonPath || "").onChange(async (v) => { this.plugin.settings.pythonPath = v.trim(); await this.plugin.persist(); });
      })
      .addButton((b) => b.setButtonText("Test").onClick(async () => {
        const r = await this.plugin.runPython(["-c", "import PIL; print('Pillow ' + PIL.__version__)"]);
        if (r.missing) new Notice("Python wasn't found. Install it, or set its path here.", 8000);
        else if (r.ok) new Notice(`Python works (${r.cmd}, ${r.out.trim()}).`, 6000);
        else new Notice(/PIL|Pillow/i.test(r.err) ? "Python was found, but Pillow isn't installed. Run: pip install pillow" : "Python stopped: " + (r.err || r.out).trim().split(/\r?\n/).pop(), 9000);
      }));
    new Setting(el).setName("Live usage meter")
      .setDesc("When Obsidian starts, every 30 seconds (every 10 while Claude Code is running) and after each Claude Code run, ask Anthropic how much of your plan limit you've used and show it under the search bar. To do that Nicrosil reads Claude Code's saved sign-in (.claude/.credentials.json in your user folder) and sends it only to api.anthropic.com; it is never saved, shown or logged. Anthropic doesn't document this service, so it may stop working. Desktop only.")
      .addToggle((t) => t.setValue(this.plugin.settings.liveUsage !== false).onChange(async (v) => {
        this.plugin.settings.liveUsage = v; await this.plugin.persist();
        if (v) this.plugin.refreshUsage({ force: true }); else this.plugin.setUsageState("off");
      }));
    el.createEl("p", {
      cls: "setting-item-description",
      text: "Hotkeys: Alt+V verify, Alt+R reject, Alt+S skip, Alt+N next draft, Alt+F resolve a flag, Alt+Q open the queue, Alt+L open or fold Connections. Change them under Settings → Hotkeys (search “Coppermind”).",
    });
  }
}

/* ---------- plugin ---------- */

