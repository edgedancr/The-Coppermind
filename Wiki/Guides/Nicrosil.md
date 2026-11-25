---
type: guide
status: draft
aliases:
  - Nicrosil
  - Nicrosil Guide
  - Review Buttons
  - Review Queue Guide
  - Dashboard Guide
courses:
  - SAIL
sources: []
related:
  - "[[SCHEMA]]"
drafted_by: Claude (claude-sonnet-5-5, claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-24
changes_since_verified:
  - "2026-11-24: Added the Query mode section (the search bar's Query switch, the query tab, Save to Analyses), the Claude Code setting, and version 4.2.0"
  - "2026-11-24: Query mode bar restyled (version 4.3.0); no change to what it does"
  - "2026-11-24: Fixed gray fills on the query controls (version 4.3.1); no change to what they do"
  - "2026-11-24: Query controls take the CGS glow, the bar stays flat when clicked, and the selected choice stays lit (version 4.3.2); no change to what they do"
  - "2026-11-24: Coppermind Dashboard spacing tightened so more fits on a laptop screen (version 4.3.3); no change to what anything does"
  - "2026-11-24: More space above the Dashboard hero (version 4.3.4); no change to what anything does"
---
> [!summary]
> **Nicrosil** is the plugin that does the Coppermind's bookkeeping. It runs the review loop for draft pages, draws the [[_dashboard|Dashboard]], searches the wiki, keeps [[_index|index]] and log in step, tidies how pages look, records schema changes, and runs the Tinmind, my own class notes. ==It does the bookkeeping, but the checking is still mine==, because a page only becomes verified when I decide it has been checked against its sources.[^1]

This guide describes Nicrosil **v4.3.4**. Its folder is `.obsidian/plugins/nicrosil/`. When the plugin changes, this guide changes with it (see [[#Keeping this guide current]]).

## Turn it on (once per computer)
**Settings → Community plugins**, refresh, switch on **Nicrosil**. After an update, switch it off and on (or restart Obsidian). The plugin files are in git, so another computer gets them with a pull, but the on/off setting is local.

## Review tools
They work on pages with a `status` property in `Wiki/`, `Perspectives/`, `Sources/Source Cards/`, `SCHEMAS/`, and the vault root.

- **Review queue (right sidebar).** `Alt+Q`. A progress bar, a card for the open page with its flags and **Verify**, **Skip**, **Reject**, and every draft in review order with flag badges: **A** accuracy check, **G** gap, **Q** question ("Whose view is this?"), **W** unsourced warning, **✓** no flags.
- **Changed since verified** (badge **R**). Verified pages the AI changed at my request, with their `changes_since_verified` lines. A line ending in `[[#Heading]]` is clickable and goes to that spot.
- **Resolve** on flag callouts: a button in Reading view; in editing view use the sidebar card or `Alt+F`.

### A review session
1. Pull first ([[Setting Up Git for the Coppermind]]), then **Open next draft** on the [[_dashboard|Dashboard]] or `Alt+N`.
2. Check the page against its cited sources.
3. **Resolve each flag**: fix the page text first if needed, then click **Resolve** and write what I decided. The callout is removed, and the decision goes into the log when I verify or reject.
4. **Decide:**
   - **Verify** (`Alt+V`; optional note, `Ctrl+Enter`): sets `status: verified` and `verified_on`, deletes `changes_since_verified` (the log keeps it),[^2] and logs the entry with any resolved flags. With flags still open I must tick a box to verify anyway, and the log records them.
   - **Skip** (`Alt+S`): moves the page to the end of the queue for this session.
   - **Reject** (`Alt+R`; reason required, `Ctrl+Enter`): logs the reason, removes the page from the index, and deletes the page.[^1] The dialog lists pages that link to it.
5. The next draft then opens automatically (can be turned off). When finished, commit and push: a page is "saved as final" only when verified **and** committed.

## The Dashboard
[[_dashboard|Dashboard]] (`_dashboard.md`) is the page the vault opens on; the **The Coppermind** button and `Alt+D` open it, always in Reading view. Its sections are blocks in the note and can be moved or deleted by editing it. It has:
- **Header:** the search box ([[#Search]]).
- **Link cards:** Index, Log (newest month), Atlas (own tab), Schema, Triage, Agents (`_AGENTS`).
- **Review progress:** verified count and percentage, drafts and open flags, **Open next draft**; a **health check card** (days since the last health check, from report names in `Health Checks/`; click opens the latest report); the **Changed since verified** list; folded lists of pages with open flags and of stale drafts.
- **Recent activity:** the last six log entries; click opens the page named.

## The Tinmind
My own class notes, in `The Tinmind/`, kept apart from the wiki.
- **Mode.** The **The Tinmind** button (or the mode button) opens the Tinmind Dashboard and switches the app to the Tinmind's colors with the right sidebar closed, so the review queue and Lens are unavailable. **The Coppermind** or `Alt+D` switches back. Not remembered: Obsidian opens in the Coppermind's mode.
- **Dashboard.** `The Tinmind/Tinmind Dashboard` shows the picked semester's courses as cards: note count and newest date, counted from note file names only. A class notes file has `type: class-notes`, `course`, `semester` (`Fall 26`), `current` and `order`; to add a course, make that file. The semester is picked from a menu in the page title; the pick is saved, and until then the one marked `current: true` shows. Properties are hidden on every note in `The Tinmind/`.
- **Search.** Searches every note under `The Tinmind/` by title, alias, text and heading (a heading is its own result and jumps to it). Read-only.
- **Course tree.** In the mode the file list shows the semester's courses (a course is its notes file plus a same-named folder: `Fall 26/SAIL.md`, `Fall 26/SAIL/`) under the same semester switcher. Opening a course lists its notes, sub-folders and the page's headings. It offers new note, **Rename** and **Delete** (to the trash, after asking), **New course**, **Delete course** (page and folder, after a file count; not the Notebook), **New semester** (suggests the next one, makes the folder, switches to it), and an **All Class Notes** table. A new note is named course + date (`SAIL 11-22-26`, editable first), gets `type: course-note` with hidden course and semester properties, opens in editing view, and shows a pill linking to its course page.
- **Course page.** Shows a panel of the course's notes and folders with **New note** and **New folder**. Display only; Nicrosil makes files only when I ask, and reads only folder names and headings. Not covered: renaming or deleting a semester, renaming a course, reordering notes (sorted by name).
- **Notebook.** For notes that aren't for a class. `The Tinmind/Notebook` (`type: notebook`, no semester) is linked from the Tinmind Dashboard under every semester, has its own tree row, and works like a course (notes in `Notebook/`, topic folders allowed, same panel) but with no counts and not in **All Class Notes**. Its notes are named `Notebook` + date with only `type: notebook-note`. **Quick note** makes a note without asking for a name and opens it ready to type.
- **Transcription queue.** `Alt+T`, the tab-bar scan button (Tinmind mode), or the **Transcriptions** link on the Tinmind Dashboard opens a locked split: the scan on the left, the note in an ordinary Obsidian editor on the right. **Close** (or opening another page in the main area) closes it. It works in either mode. It lists every note with `transcription: draft` ([[SCHEMA - Transcription]]) in photographed order, and how many scans in `Sources/Scans/` no note lists yet. If the right pane moves to a note that isn't waiting, the bar offers **Back to** the one I was checking.
  - **Scan side:** a tab per scan page, zoom, and what still needs me.
  - **Drawing flags** (`> [!drawing]`): **Show on scan**; **Keep screenshot** (drag a box or take **Whole page**; saved as a JPEG in `_attachments/Tinmind/` and embedded in place of the flag); **Recreate** (becomes `> [!recreate]`; the scan stays until the recreated drawing, marked `%% recreated: ... %%`, is checked with **Looks right**); **Leave out**. These edit the note, so Obsidian's undo works.
  - **Unsure words** (`[?word?]`, `[??]`): counted in the bar, with **Next unsure word** and **Accept the guess**.
  - **Verify** is off while a drawing is undecided, waiting to be recreated or checked. It asks first (and again if unsure words remain), removes `transcription` and `scan_pages` from the note, trashes its scans (a scan another unverified note lists stays), and logs a `verify` entry. **Discard transcription** deletes the draft, keeps the scans and logs my reason. **Skip** moves on.

## Search
The Dashboard search box shows suggestions as I type over wiki pages, source cards and perspectives (not class notes or readings), each with title, type, status, matched alias and a snippet, plus a match count. Click, or arrows and `Enter`, opens one; `Ctrl+Enter` opens it in a new tab; `Esc` closes the list, again clears the box. Read-only, and it stays current as pages change.

## Query mode
The Dashboard's search bar has a **Search / Query** switch (on a computer only; the Tinmind's bar has none). In **Query**, the bar asks the wiki a question through Claude Code instead of matching keywords. Under it are **Model** (Haiku, Sonnet, Opus), **Effort** (Low to Max; Haiku has none), **Depth** (Quick, Standard, Deep, as in [[SCHEMA - Query#Depth]]), and a **Usage** meter with a link to the usage page. The switch and the three choices are remembered.

- **Ask** (or Enter) opens a new tab. While Claude works, it lists each step (rules read, searches, pages read), the elapsed time and an estimated progress bar; **Cancel query** stops it, and nothing is logged.
- **The answer** comes back in the Analysis template's sections, with links that open the pages. Claude has read-only tools and can't open `Ingestion/Raw/`, `The Tinmind/`, `.obsidian/` or `.git/`, so it can't file or log anything itself.
- **Nicrosil logs every answer** as a `query` entry (model, effort, depth, pages used, "not filed back yet").
- **Save to Analyses** writes the answer to `Wiki/Analyses/` as a draft, with its properties and summary callout filled in from what Claude returned, the file name and **Ask again if** line I can edit first, and a second `query` entry saying it was filed back. It refuses a name already taken. **Copy** copies the answer; **Discard** closes the tab.
- **Follow-ups** continue the same Claude Code session on that computer; Save files the newest answer.
- **Setup, once per computer:** install Claude Code and sign in by running `claude` in a terminal. Nicrosil only starts that program, and Claude Code keeps its own sign-in. If `ANTHROPIC_API_KEY` is set, Claude Code bills the API instead of my plan; the query tab says so when that happens.
- **The usage meter** shows a percent only if Claude Code reports one during a query; otherwise it shows the last query's tokens.

## The index and the log
- **Index:** [[_index|index]] lists every page under its type, alphabetically, with counts, a total and a **Jump to** line; Concepts and Glossary are split by letter. Verify only checks that the page is listed. Reject removes its line and rebuilds the counts, letter headings and jump links.
- **Log:** Nicrosil adds each verify and reject entry at the top of the current month's file (newest first, old entries never rewritten). The log opens folded, which needs Obsidian's **Fold heading** option.
- **One file per month** in `_logs/`, named `_log MM-YY`. The first time Obsidian opens in a new month, Nicrosil creates it with its header.[^5]

## The Lens
`Alt+L`. Right sidebar; follows the open wiki page, perspective or source card; changes no file.
- **Trail:** pages opened while the Lens was open; click to go back.
- **Header:** the page's status and atlas topic (click shows it in the atlas).
- **Map:** the page in the middle, pages linking to it on the left, pages it links to on the right (six a side, typed links first; **Enlarge** shows all). Typed links are colored by relationship type; plain links (in text or in properties such as `sources`) are "see also" and dashed. Click opens a page; `Ctrl+click` a new tab.
- **Two steps away, not linked yet:** up to six pages that at least two of this page's neighbors link with but this page doesn't, best first, with the neighbors joining them (summaries, guides and prompts excluded). Links worth checking, not to add unread.
- **Two lists:** outgoing ("This page…") and incoming ("Pointing at this page…", worked out from other pages since each relationship is stored once),[^3] grouped by type, with plain links last.

## The atlas
`Alt+M` or the Atlas card, in its own tab. Reads the links and [[_topics]]; changes no file.
- **Topics.** Each topic in `_topics.md` is a circle with its anchor pages pinned. Every other page in `Wiki/` and `Perspectives/` joins the topic that reaches it most strongly by spreading out from the anchors along links (a typed link counts double). Pages with no link path to an anchor sit in **No topic yet**. Nothing is written on pages. It recomputes when links, pages or the topic list change.
- **Whole wiki.** Bands show how many links join two topics. Dots are pages, sized by incoming links, colored by type (or by status with **Status**), anchors ringed. The side panel gives counts and lists topics.
- **A topic** (click): its links, anchors and busiest pages; the side panel adds its description, status, most-linked pages, topics it links with most and never links with, and pages almost in another topic (candidates for an anchor or a link there).
- **A page** (click a dot, or search): its links in their colors, the rest faded; the side panel lists links by type, its topic, and **Open page**. Double-click or `Ctrl+click` opens it.
- **Navigation.** Scroll zooms, drag pans, `Esc` or the top path goes up a level, **Atlas** returns to the whole wiki. The view refits when its space changes unless I have zoomed or panned since my last pick. **Edit topics** opens `_topics.md`; **Show this page in the atlas** (command palette) opens it on the current page.
- **Sidebars** close while the atlas is in front and reopen when it isn't (the right one stays closed in the Tinmind's mode). A sidebar I open myself is left alone.
- **The topic list is mine.** The agent checks it at each ingest ([[SCHEMA - Ingest#6. Check the topic list]]). Anchors that aren't pages are listed in the side panel.

## The properties strip
On every note except the Dashboard, the Tinmind page, the index and the logs, a one-line strip of **type**, **status** and a date replaces the Properties block; click to open the real one (collapsed again each time a note opens). Link hover previews show it too, except for links to a spot on their own page.

On pages in `Wiki/`, the open Properties block ends with an **Add typed link** button. It opens one row, "This page [type] [page]": choose one of the ten link types, search for a Wiki page (aliases count), and press **Add** or Enter. The link goes into that type's property, and Enter keeps the row open for the next link. A link already under the same type is refused. On a verified page the same edit sets `status: draft`, keeps `verified_on` and adds a `changes_since_verified` line, like any change to a verified page.[^2][^3]

## Gradient styles
- **Coppermind Gradient Style (CGS):** copper to teal. For the Dashboard's name, verified page titles, panel headings, the index's section headings, and the titles of the Index, `_AGENTS` and each month's log.
- **Tinmind Gradient Style (TGS):** grey to lilac. For the Tinmind page's title and button and every note title in `The Tinmind/`; in the Tinmind mode it replaces the CGS everywhere.

To style a new title, add the class `cm-gradient-style` or `cm-tin-gradient-style`. Colors and fonts are in `styles.css`.

## Logging a schema change
Every change to the rules (`_AGENTS.md` or a file in `SCHEMAS/`) needs a line in [[Schema Changelog]].[^4] On any page in `SCHEMAS/`, click the pen button in the page header or run **Log a schema change**, then enter the new version (such as `4.2`, newer than the current one and not already in the changelog) and a description. Nicrosil adds the dated line at the top of the changelog, updates its `updated` property, and sets `version` and `updated` on [[SCHEMA]]. It does not touch `status`, `verified_on` or the log: each changed rule file goes back to `draft` with a change note,[^1] and the log entry is still mine to add.

## Hotkeys and buttons
| Key | Action |
| --- | --- |
| `Alt+V` | Verify this page |
| `Alt+R` | Reject this draft |
| `Alt+S` | Skip this draft for now |
| `Alt+N` | Open the next draft |
| `Alt+F` | Resolve a flag on this page |
| `Alt+Q` | Open the review queue |
| `Alt+L` | Open the Lens |
| `Alt+T` | Open the transcription queue |
| `Alt+M` | Open the atlas |
| `Alt+D` | Go to the Dashboard |
| `Alt+Shift+D` | Switch between the Coppermind and the Tinmind, and bring the file list back |
| `Alt+E` | Show the file list (the way back from the sidebar's search tab) |
| `Ctrl+Enter` | Confirm a dialog |
| `Ctrl+click` or middle-click | Open a card, button, search result or queue page in a new tab |

Change them in **Settings → Hotkeys** (search "Nicrosil"). **Log a schema change** and **Show this page in the atlas** have no default hotkey. Nicrosil also adds:
- **The Coppermind** and **The Tinmind** buttons above the file list (open the Dashboard or Tinmind page and switch mode).
- **Left sidebar tab bar buttons**, shown with the Files tab. Obsidian's ribbon and the Files, Search and Bookmarks icons are hidden (so other plugins' ribbon icons too); `Ctrl+Shift+F` still opens search.
  - **Collapse button** (Obsidian's own, first); **Toggle left sidebar** is also in the command palette.
  - **Mode button** (both modes): switches mode, opens no page.
  - **Eye button** (Coppermind mode): shows or hides files and folders starting with an underscore; hidden on each start. The file list's own toolbar is hidden; its actions remain in the command palette and right-click menu.
  - **Review queue** and **Lens** (Coppermind mode); **Transcription queue** (Tinmind mode).
  - **Two git buttons** (both modes): up arrow runs Obsidian Git's **Commit-and-sync**, down arrow runs **Pull**. Obsidian Git's notices report the result; the button says so if Obsidian Git is off.
- A **status-bar counter** of verified pages (`12/60 verified`).

## Settings
In **Settings → Nicrosil**:
- **Open the next draft after verifying or rejecting** (on).
- **Play an animation when I verify a page** (on). With the setting above off, only the check and sparks play.
- **Close the extra sidebar panels on startup** (on): Backlinks, Outgoing links, Tags, All properties, Outline. Still openable from the command palette.
- **Close the other tabs on startup** (on): keeps only the Dashboard open, so a page left open doesn't come back in the wrong mode. Reloading the plugin mid-session doesn't do this.
- **Open pages in Reading view:** "Verified pages only" (default), "Every page", or "Off". Switching a page to editing myself holds until that tab opens a different page. A new empty note opens ready to type. Notes in `The Tinmind/` open in editing view; only the Tinmind Dashboard opens in Reading view.
- **Days between health checks** (14): when the Dashboard's health check card calls the check overdue.
- **Queue order:** clean pages first (default), flagged first, by page type, or A to Z.
- **Claude Code for query mode:** blank finds Claude Code by itself; or enter its path. **Test** shows the version it found.

## What it will not do
- **Verify on its own.** Every change starts with my click or keypress.
- **Delete a scan on its own.** A scan is trashed only when I click **Verify** in the transcription queue and confirm; Obsidian's trash setting decides whether it can be recovered.
- **Run git itself.** The git buttons only run Obsidian Git's commands when I click.
- **Verify a source card with a blank `reliability` rating.**[^1]
- **Touch verified pages.** If a verified page's content changes, it goes back to `draft`.
- **Undo a verify or a resolved flag.** To undo a verify, set `status: draft` by hand, fix the index line, and add a correction to the log. To undo a resolved flag, restore the callout from git before verifying.
- **Keep skips past a restart.**

## Troubleshooting
- **No buttons or sidebar:** the plugin is off, or the page is outside the folders above. In the Tinmind mode the right sidebar is closed on purpose.
- **No Resolve button:** switch to Reading view, or use the sidebar card or `Alt+F`.
- **Resolved flags waiting to be logged** are stored in the plugin's `data.json`, which git syncs. If I resolve flags on one computer, push before verifying on the other.
- **"It wasn't in _index.md":** the page's entry is missing or renamed; fix its line in [[_index|index]] by hand.
- **Properties look reformatted after verifying:** Obsidian rewrites them when a plugin edits them; content is the same.
- **Merge conflict in `_index.md` or a log file:** two computers verified before syncing. Pull before a review session, push after.
- **A hotkey does nothing after an update:** switch Nicrosil off and on, then check **Settings → Hotkeys**.

## Keeping this guide current
Whenever Nicrosil is updated:
1. Bump the version here and in the plugin's `manifest.json`.
2. Update the matching section (and the hotkey table if a key changed) only for a functional change; design tweaks need no sentence here.
3. Add a line at the top of [[Nicrosil Changelog]].
4. This page goes back to `draft` until I verify it.[^1]
5. Log it as a `tool` entry ([[SCHEMA - Changes#Nicrosil and other tools]]).

Keep this guide to what each part does. How something looks (corners, fonts, colors, animations, positions) and the history of each change go only in [[Nicrosil Changelog]]; an AI that needs a detail reads the plugin itself. These steps apply to **every** change to a plugin file, even a one-line style tweak, and are done in the same edit without being asked.

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
[^2]: [[SCHEMA - Review|Schema: Review]], rule 8
[^3]: [[SCHEMA - Writing Pages#Typed links|Schema: Typed links]]
[^4]: [[SCHEMA - Changes#Changing the rules|Schema: Changing the rules]]
[^5]: [[SCHEMA - Index and Log#One file per month|Schema: One file per month]]
