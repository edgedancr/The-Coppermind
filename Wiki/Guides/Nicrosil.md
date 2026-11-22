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
drafted_by: Claude (claude-sonnet-5-5; review queue, flags, hotkeys and dashboard added by claude-opus-5-5; Dashboard page and home button by claude-sonnet-5-5; rewritten as the full Nicrosil guide by claude-sonnet-5-5; quiet Dashboard by claude-opus-5-5; relations map glow, Reading view on open, health check card, clickable change lines, the restyled map and hierarchy and the hover-preview strip by claude-sonnet-5-5; SCHEMAS folder and monthly log by claude-opus-5-5; larger file-list button name and index letter headings and jump bar, the flat relations map, the trimmed guide body, and the changelog moved to its own file, by claude-sonnet-5-5; Coppermind Gradient Style section by claude-sonnet-5-5; the Tinmind (notes dashboard, semester switcher, hero, button, mode) and the Tinmind Gradient Style by claude-sonnet-5-5; trimmed to what Nicrosil does and brought to v3.0.0 by claude-sonnet-5-5; Tinmind course tree and course pages by claude-sonnet-5-5; mode button, dashboard status bar and the dashboards' Ledger look by claude-sonnet-5-5; the Notebook by claude-sonnet-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-22
changes_since_verified:
  - "2026-11-22: Added the Notebook, a pinned card and tree row with no semester and a Quick note button (Nicrosil 3.10.0); version now 3.10.0 [[#The Tinmind]]"
  - "2026-11-22: The semester switcher on the Tinmind Dashboard is now the page title with a menu, and the course tree has no switcher (Nicrosil 3.11.0); version now 3.11.0 [[#The Tinmind]]"
  - "2026-11-22: The course tree has a small semester switcher again, at the top under the Tinmind button (Nicrosil 3.11.1); version now 3.11.1 [[#The Tinmind]]"
---
> [!summary]
> **Nicrosil** is the plugin that does the Coppermind's bookkeeping. It runs the review loop for draft pages, draws the [[_dashboard|Dashboard]], searches the wiki, keeps [[_index|index]] and log in step, tidies how pages look, records schema changes, and runs the Tinmind, my own class notes. ==It does the bookkeeping, but the checking is still mine==, because a page only becomes verified when I decide it has been checked against its sources.[^1]

This guide describes Nicrosil **v3.11.1**. Its folder is `.obsidian/plugins/nicrosil/`. When the plugin changes, this guide changes with it (see [[#Keeping this guide current]]).

## What Nicrosil does
| Area | What it does | Where to read more |
| --- | --- | --- |
| **Review** | A queue of drafts, flag callouts with **Resolve** buttons, and **Verify**, **Skip**, and **Reject** | [[#Review tools]] |
| **Relations** | A side panel for the open page: its typed links, outgoing and incoming | [[#The relations panel]] |
| **Wiki map** | Two views of the whole wiki's typed links: a hierarchy tree and a zoomable map | [[#The wiki map]] |
| **Dashboard** | The front page: progress, search box, navigation cards, recent activity | [[#The Dashboard]] |
| **Tinmind** | A button, a Tinmind Dashboard with a semester switcher, a mode that recolors the app, a course tree for making and managing notes, and a Notebook for notes that aren't for a class | [[#The Tinmind]] |
| **Search** | A live search box over wiki pages, source cards, and perspectives | [[#Search]] |
| **Index and log** | Keeps [[_index|index]] and the log in step with each verify or reject, and starts each month's log file | [[#The index and the log]] |
| **Page tidying** | Replaces each page's properties block with a one-line strip | [[#The properties strip]] |
| **Schema changes** | A button that adds a line to [[Schema Changelog]] and updates the version in [[SCHEMA]] | [[#Logging a schema change]] |
| **Shortcuts** | Hotkeys, a button for each of the two modes above the file list, and a status-bar counter | [[#Hotkeys and buttons]] |

## Turn it on (once per computer)
1. In Obsidian: **Settings → Community plugins**, click the refresh icon next to "Installed plugins," and switch on **Nicrosil**.
2. After an update, switch it off and on again (or restart Obsidian) to load the new version.
3. The plugin files are tracked in git, so a second computer gets them with a pull. Switch it on there too, since the on/off setting is local.

## Review tools
Review tools work on pages in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, the rule files in `SCHEMAS/`, and root-level files, that have a `status` property.

- **Review queue (right sidebar).** Open it with `Alt+Q` or the ribbon button. It shows a progress bar, a card for the page I'm on with its flags and the **Verify**, **Skip**, and **Reject** buttons, and every draft in review order with flag badges: **A** accuracy check, **G** gap, **Q** question ("Whose view is this?"), **W** unsourced warning, **✓** no flags.
- **Changed since verified.** A list at the top (badge **R**) of verified pages the AI changed at my request. Each shows the lines from its `changes_since_verified` property, so I check only what changed. A line that ends with a link to a section (`[[#Heading]]`) is clickable and goes to that spot; `Ctrl+click` opens the page in a new tab.
- **Resolve buttons on flags.** Each flag callout gets a **Resolve** button in Reading view. In editing view, use the sidebar card or `Alt+F`.

### A review session
1. Pull first (see [[Setting Up Git for the Coppermind]]).
2. On the [[_dashboard|Dashboard]], click **Open next draft**, or press `Alt+N`.
3. Read the page and check it against the sources it cites.
4. **Resolve each flag.** If a claim needs correcting, edit the page text first. Then click **Resolve** and write what I decided. The callout is removed, and my decision is written into the log when I verify (or reject) the page.
5. **Decide:**
   - **Verify** (`Alt+V`): optionally note what I changed and why, then `Ctrl+Enter`. The page gets `status: verified` and `verified_on`, and the log gets an entry listing any flags I resolved. If flags are still open, I have to tick a box to verify anyway, and the log records them.
     - If the page has a `changes_since_verified` property, Verify deletes it, and the log keeps the record.[^2]
   - **Skip** (`Alt+S`): moves the page to the end of the queue for this session and opens the next one.
   - **Reject** (`Alt+R`): write the reason (required), then `Ctrl+Enter`. The reason is logged, the page is removed from the index, and the page is deleted.[^1] The dialog lists pages that link to it, so I can fix those links afterward.
6. After Verify or Reject, the next draft opens automatically (this can be turned off).
7. When finished, commit and push. A page is only "saved as final" once it is verified **and** committed.

## The Dashboard
[[_dashboard|Dashboard]] is the page the vault opens on. It is the file `_dashboard.md`; the underscore keeps it out of the file list unless the eye button is on. The **The Coppermind** button above the file list and `Alt+D` open it, and it always opens in Reading view (`Ctrl+E` edits it). Each section is a block in the page's text, so a section can be moved or deleted by editing the note. From top to bottom it has:
- **Header** (`coppermind-hero`): the logo, name and tagline, with the search box (see [[#Search]]).
- **Six link cards** (`coppermind-nav`): Index, Log (the newest month's file), Wiki map, Schema, Triage, and Agents (`_AGENTS`, the rules every agent reads first). `Ctrl+click` or middle-click opens a card's page in a new tab; the Wiki map card opens its own tab. Each card is a ruled row with an arrow; on hover the arrow moves and the title glows in the Coppermind's gradient.
- **Review progress** (`coppermind-dashboard`, no heading): one strip with the number of pages verified, the percentage, drafts and open flags on a bar, and the **Open next draft** button; under it a **health check card** showing the days since the last health check (it reads the report names in `Health Checks/`, and clicking it opens the latest report), then the **Changed since verified** list and folded lists of pages with open flags and of stale drafts.
- **Recent activity** (`coppermind-activity`): the last six log entries. Click one to open the page it names.

## The Tinmind
The **Tinmind** is my own class notes, in the folder `The Tinmind/`, kept apart from the wiki. Nicrosil gives it six things.
- **A button.** **The Tinmind** sits under **The Coppermind** above the file list. It opens the Tinmind page, and `Ctrl+click` or middle-click opens it in a new tab.
- **A dashboard.** The page `The Tinmind/Tinmind Dashboard` opens with a hero (tin logo, title and a quote) and one block, `coppermind-classes`. Each class notes file has `type: class-notes`, a `course`, a `semester` (such as `Fall 26`), a `current` flag and an `order`. The picked semester is the page's title, in the Tinmind Gradient Style, with a chevron; clicking it opens a menu of every semester found, oldest first, and the cards under it are that semester's courses. Each card has the same left bar in the Tinmind's lilac, and under the name it says how many notes the course has and the newest date in a note's name (for example `28 notes · last 11-17`, or `No notes yet`); that is counted from file names, never from what is inside. The pick is saved, so it is there after Obsidian closes; until one is made, the box shows the semester marked `current: true`. To add a course, make its notes file with those properties. The block only reads properties, never the notes. The page shows no properties and no file path. Properties are hidden on every note in `The Tinmind/`, not only this page.
- **A mode.** Clicking the button switches the whole app to the Tinmind's grey-and-lilac colors and closes the right sidebar, so the review queue and relations panel are gone (`Alt+Q` and `Alt+L` only show a note). Clicking **The Coppermind**, or pressing `Alt+D`, switches back and reopens the sidebar if it was open before. The mode is not remembered: Obsidian always opens in the Coppermind's mode, with the right sidebar back as it was.
- **A course tree.** While the mode is on, the file list shows the semester's courses instead of folders. At the top, under the **The Tinmind** button, is a small copy of the dashboard's semester switcher (the same title and menu); it and the dashboard always show the same semester. A course is its notes file plus the folder next to it with the same name (`Fall 26/SAIL.md` and `Fall 26/SAIL/`). Opening a course lists the folder's notes and sub-folders, then the headings on the course page, so a class split into many notes and a class in one long file both read as a list. Click a course, note or heading to open it; middle-click or `Ctrl+click` opens it in a new tab. Hover a course for **+** (new note) and **...**; right-click or **...** on a note or folder to **Rename** or **Delete** it (deletes go to the trash and ask first). **New course** makes a course page for the semester showing, with the properties above. **New semester** asks for a season and a year (such as `Fall 27`; it suggests the next one), makes the semester's folder and switches to it. **All Class Notes**, a table of every class notes file, has its own row at the bottom of the tree and no other button. A new note's name starts as the course and today's date (`SAIL 11-22-26`; dashes, because a file name can't hold slashes), and I can add to it or change it before creating. It starts with `type: course-note` and the course and semester (properties, which stay in the file but are not shown), and opens in the editing view. A note inside a course shows a pill with the course's name above its title; clicking it (or `Ctrl+click` for a new tab) goes to the course page. It is drawn on screen from the note's folder, so the note has no link line, and on the first start after 3.6.0 Nicrosil took the old `← [[...]]` line out of the notes that had one. Course pages have no link back to the dashboard (the **The Tinmind** button goes back); on the first start after 3.3.0 Nicrosil took that line out of the ones that had it, and new course pages are made without it.
- **A course page.** A class notes file also shows a panel under its properties with the same list, **New note** and **New folder**. The panel is drawn on screen; the file is not changed. Nicrosil makes folders and notes only when I ask in the tree or the panel, and reads only folder names and the page's headings, not what the notes say. Not covered: renaming or deleting a course or a semester, and reordering notes (they sort by name, with numbers in order).
- **A Notebook.** A place for notes that aren't for a class. The page `The Tinmind/Notebook` has `type: notebook` and no semester, so its card is on the Tinmind Dashboard whichever semester is picked, after that semester's courses, and it has its own row in the course tree under the courses. It works like a course: its notes sit in the folder `Notebook/` next to the page (made with the first note), I can make topic folders in it, and its page has the same panel with **New note** and **New folder**. A note's name starts as `Notebook` and today's date (`Notebook 11-22-26`) and can be changed before creating; its only property is `type: notebook-note`, and the pill above its title says Notebook. The card has a **Quick note** button that makes that note without asking for a name and opens it ready to type. The card and the row show no count, and nothing sorts or moves notes into courses. The Notebook is not listed in **All Class Notes**. Like the rest of the Tinmind, Nicrosil reads only folder names, file names and headings in it, never what the notes say.

## Search
The search box on the [[_dashboard|Dashboard]] shows suggestion cards as I type, over wiki pages, source cards, and perspectives. It does not search the raw class notes or readings, and it only reads: it never changes a page.
- **Open a result:** click it, or use the arrow keys and `Enter`. `Ctrl+Enter` opens it in a new tab.
- **Each card shows** the page's title, type and status, any alias that matched, and a snippet. More cards appear as I scroll, and a line at the bottom says how many matched.
- **Esc** closes the list, and pressing it again clears the box.
- It stays up to date as pages are created, edited, renamed, or deleted.

## The index and the log
- **Index:** [[_index|index]] lists every page under its type, alphabetically, with a count per type, a total, and a **Jump to** line. Concepts and Glossary are split under A–Z letter headings. When I verify a page, Nicrosil only checks that it is listed. When I reject one, its line is removed and the counts, letter headings and jump links are rebuilt.
- **Log:** Nicrosil adds the entry for each verify and reject to the top of the current month's log file (newest first, old entries never rewritten). The log opens with every entry folded, which needs Obsidian's **Fold heading** option (Settings → Editor) to be on.
- **One log file per month:** the log lives in `_logs/`, named `_log MM-YY` (`_log 11-26` is November 2026). The first time Obsidian opens in a new month, Nicrosil creates that month's file with its header.[^5]

## The relations panel
Open it with `Alt+L` or the ribbon button. It follows the open page and shows how it connects to the rest of the wiki through the typed links in its properties:[^3]
- **A map** with the page in the middle: pages that point at it on the left, pages it points at on the right. Arrows are colored by relationship type (the legend names them), and a page's outline shows its status. Click a page to open it (`Ctrl+click` for a new tab). The map shows up to six pages a side; **Enlarge** shows every page.
- **Two lists:** "This page…" groups outgoing links by type, and "Pointing at this page…" groups incoming ones. Incoming links are worked out from the other pages' properties, since each relationship is stored once.[^3]
- **Not shown:** plain links in the page text, which are "see also" links, not relationships.

## The wiki map
Open it with `Alt+M` or the Wiki map card. It opens in its own tab with two views, chosen at the top. Both read only the typed links in the properties,[^3] and neither changes a file.
- **Hierarchy.** A tree built from `type_of`, `part_of`, and `example_of`. Each page is a card under the page it is a kind of, a part of, or an example of. Click a card to open the page; the circle on its edge opens or closes the branch. A box filters by name, and **Expand all**, **Collapse all** and **Show examples** do what they say. Pages with none of these links are in a folded list at the bottom.
- **Map.** Every page with a typed link is a dot, and every typed link is an arrow from the page that states it. Scroll to zoom, drag to pan, and drag a dot to move it. Click a relationship name to hide or show that type; menus filter by status, page type and course; the box finds a page by name. Click a dot to focus on it and its neighbors, and `Ctrl+click` to open it. The **Flow** button turns the moving pulses on arrows off. Pages with no typed links are not shown, and a note says how many.

## The properties strip
On every note except the Dashboard, the Tinmind page, the index and the logs, Nicrosil hides the full Properties block and puts a one-line strip in its place, showing the page's **type**, **status**, and a date. Click the strip to open the real Properties block. Each note starts collapsed again when I open it. The preview that appears when I point at a link shows the same strip.

## Gradient styles
The vault has two named title styles, each a gradient with a still glow in the font Almendra SC.
- **Coppermind Gradient Style (CGS):** copper to teal. It is used for the Dashboard's name, a verified page's title, the panel headings, the index's section headings, and the titles of the Index, `_AGENTS` ("AGENTS") and each month's log ("Log 11-26").
- **Tinmind Gradient Style (TGS):** grey to lilac. It is used for the Tinmind page's title and button, and for the title of every note in `The Tinmind/`. While the Tinmind mode is on, it replaces the CGS on every title.

Each is defined once in the plugin's `styles.css` (`--cm-gradient`, `--cm-gradient-glow` and `--cm-gradient-font` for the CGS; `--cm-tin-gradient` and `--cm-tin-gradient-glow` for the TGS), and the theme snippet reads the same variables. To give a title in a new feature a style, add the class `cm-gradient-style` or `cm-tin-gradient-style`. Changing a variable changes every title that uses it. The exact colors are in [[Nicrosil Changelog]].

Nicrosil also adds small animations, such as a glow on page titles by status, a pulse on flag callouts and sparks in the wiki map. None of them change how anything works, and they are all off if the computer is set to reduce motion.

## Logging a schema change
Every change to the rules (`_AGENTS.md` or a file in `SCHEMAS/`) needs a line in [[Schema Changelog]].[^4] Nicrosil adds it for me:
1. On any page in `SCHEMAS/`, click the pen button in the page header, or run **Log a schema change** from the command palette.
2. Enter the new version number in the form `4.2` and a description of what changed. The version must be newer than the current one and not already in the changelog.
3. Nicrosil adds the dated line at the top of the changelog and updates its `updated` property, then sets `version` and `updated` on [[SCHEMA]], which holds the rulebook's version.

It does not touch `status`, `verified_on`, or the log. After a schema change, each changed rule file goes back to `draft` with a change note,[^1] and the log entry is still mine to add.

## Hotkeys and buttons
| Key | Action |
| --- | --- |
| `Alt+V` | Verify this page |
| `Alt+R` | Reject this draft |
| `Alt+S` | Skip this draft for now |
| `Alt+N` | Open the next draft |
| `Alt+F` | Resolve a flag on this page |
| `Alt+Q` | Open the review queue |
| `Alt+L` | Open the relations panel |
| `Alt+M` | Open the wiki map |
| `Alt+D` | Go to the Dashboard |
| `Ctrl+Enter` | Confirm a dialog |
| `Ctrl+click` or middle-click | Open a card, a button, a search result or a queue page in a new tab |

Change any of them in **Settings → Hotkeys** (search "Nicrosil"). Nicrosil also adds:
- A **mode button** right after the eye, in the same tab bar. It shows the logo of the mode you are in (the Coppermind's or the Tinmind's); clicking it switches to the other mode ([[#The Tinmind]]) and opens no page. It shows while the Files tab is open, in both modes.
- **The Coppermind** and **The Tinmind** buttons above the files in the file list. They open the Dashboard and the Tinmind page, and switch the mode ([[#The Tinmind]]).
- Two **ribbon** buttons, for the relations panel and the review queue.
- A **status-bar counter** of verified pages (for example, `12/60 verified`).
- An **eye button** in the left sidebar's tab bar, right next to the Files icon (the Search and Bookmarks icons are hidden; `Ctrl+Shift+F` still opens search) that shows or hides folders and files whose names start with an underscore. It appears while the Files tab is open (not in the Tinmind's mode, where the file list is replaced). They are hidden each time Obsidian opens. The file list's own toolbar (new note, new folder, sort and the rest) is hidden; those actions are still in the command palette and the right-click menu.

**Log a schema change** has no default hotkey.

## Settings
In **Settings → Nicrosil**:
- **Open the next draft after verifying or rejecting** (on by default).
- **Play an animation when I verify a page** (on by default). With the setting above off, only the check and sparks play.
- **Close the extra sidebar panels on startup** (on by default): closes Backlinks, Outgoing links, Tags, All properties and Outline each time Obsidian starts. They can still be opened from the command palette.
- **Open pages in Reading view:** "Verified pages only" (the default), "Every page", or "Off". If I switch a page to editing myself, it stays that way until that tab opens a different page. A new empty note always opens ready to type. Notes in `The Tinmind/` always open in editing view, whatever this is set to; only the Tinmind Dashboard opens in Reading view.
- **Days between health checks** (14 by default): how long the Dashboard's health check card counts before it calls the check overdue.
- **Queue order:** clean pages first (default), flagged pages first, by page type, or A to Z.

## What it will not do
- **It never verifies on its own.** Every change starts with my click or keypress.
- **It does not commit to git.**
- **It will not verify a source card with a blank `reliability` rating.** Ratings are always item by item.[^1]
- **It does not touch verified pages.** If a verified page's content changes, it goes back to `draft` and needs checking again.
- **It cannot undo a verify or a resolved flag.** To undo a verify, set `status: draft` by hand, change the index line back, and add a correction to the log (past entries are never rewritten). To undo a resolved flag, restore the callout from git before verifying.
- **Skips last only until Obsidian restarts.**

## Troubleshooting
- **No buttons or sidebar:** the plugin is off, or the page is outside the folders above. In the Tinmind mode the right sidebar is closed on purpose; click **The Coppermind**.
- **No Resolve button on a callout:** switch to Reading view, or use the sidebar card or `Alt+F`.
- **Resolved flags waiting to be logged:** they are stored in the plugin's `data.json`, which git syncs. If I resolve flags on one computer, push before verifying that page on the other.
- **"It wasn't in _index.md":** the page's entry is missing or renamed. Fix its line in [[_index|index]] by hand.
- **Properties look reformatted after verifying:** Obsidian rewrites a page's properties when a plugin edits them. The content is the same.
- **Merge conflict in `_index.md` or a log file:** two computers verified pages before syncing. Pull before a review session and push after.
- **A hotkey does nothing after an update:** switch Nicrosil off and on again, then check **Settings → Hotkeys**.

## Keeping this guide current
This guide describes what the plugin does today. Whenever Nicrosil is updated:
1. Change the version number near the top of the page and in the plugin's `manifest.json`.
2. Update the table in [[#What Nicrosil does]], the matching section, and the hotkey table if anything was added, removed, or renamed.
3. Add a line at the top of [[Nicrosil Changelog]].
4. The change makes this page a changed page, so it goes back to `draft` until I verify it.[^1]
5. Log it as a `tool` entry ([[SCHEMA - Changes#Nicrosil and other tools]]).

Keep the body of this guide to what each part does. Details of how something looks (corners, fonts, colors, animations) and the history of each change go only in [[Nicrosil Changelog]]. These steps apply to **every** change to a file in the plugin's folder, even a one-line style tweak, and they are done in the same edit without being asked.

The changelog of every version is [[Nicrosil Changelog]] (in `_changelogs/`), newest first. Read it only to add a line or to look up when something changed.

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
[^2]: [[SCHEMA - Review|Schema: Review]], rule 8
[^3]: [[SCHEMA - Writing Pages#Typed links|Schema: Typed links]]
[^4]: [[SCHEMA - Changes#Changing the rules|Schema: Changing the rules]]
[^5]: [[SCHEMA - Index and Log#One file per month|Schema: One file per month]]
