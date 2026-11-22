---
type: guide
status: verified
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
---
> [!summary]
> **Nicrosil** is the plugin that does the Coppermind's bookkeeping. It runs the review loop for draft pages, draws the [[_dashboard|Dashboard]], searches the wiki, keeps [[_index|index]] and log in step, tidies how pages look, records schema changes, and runs the Tinmind, my own class notes. ==It does the bookkeeping, but the checking is still mine==, because a page only becomes verified when I decide it has been checked against its sources.[^1]

This guide describes Nicrosil **v3.13.3**. Its folder is `.obsidian/plugins/nicrosil/`. When the plugin changes, this guide changes with it (see [[#Keeping this guide current]]).

## Turn it on (once per computer)
1. In Obsidian: **Settings → Community plugins**, click the refresh icon next to "Installed plugins," and switch on **Nicrosil**.
2. After an update, switch it off and on again (or restart Obsidian).
3. The plugin files are tracked in git, so a second computer gets them with a pull. Switch it on there too, since the on/off setting is local.

## Review tools
They work on pages in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, the rule files in `SCHEMAS/`, and root-level files, that have a `status` property.

- **Review queue (right sidebar).** `Alt+Q` or its button. It shows a progress bar, a card for the open page with its flags and **Verify**, **Skip**, and **Reject**, and every draft in review order with flag badges: **A** accuracy check, **G** gap, **Q** question ("Whose view is this?"), **W** unsourced warning, **✓** no flags.
- **Changed since verified** (badge **R**). Verified pages the AI changed at my request, each showing its `changes_since_verified` lines. A line ending in `[[#Heading]]` is clickable and goes to that spot; `Ctrl+click` opens the page in a new tab.
- **Resolve buttons on flags.** Each flag callout gets **Resolve** in Reading view. In editing view, use the sidebar card or `Alt+F`.

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
6. After Verify or Reject, the next draft opens automatically (can be turned off).
7. When finished, commit and push. A page is only "saved as final" once it is verified **and** committed.

## The Dashboard
[[_dashboard|Dashboard]] is the page the vault opens on (`_dashboard.md`, hidden from the file list unless the eye button is on). The **The Coppermind** button above the file list and `Alt+D` open it, always in Reading view. Each section is a block in the note, so a section can be moved or deleted by editing the note. It has:
- **Header** (`coppermind-hero`): logo, name, tagline, and the search box ([[#Search]]).
- **Six link cards** (`coppermind-nav`): Index, Log (newest month's file), Wiki map, Schema, Triage, and Agents (`_AGENTS`). `Ctrl+click` or middle-click opens a card's page in a new tab; the Wiki map card opens its own tab.
- **Review progress** (`coppermind-dashboard`): verified count and percentage, drafts and open flags, and **Open next draft**. Under it: a **health check card** (days since the last health check, read from the report names in `Health Checks/`; click opens the latest report), the **Changed since verified** list, and folded lists of pages with open flags and of stale drafts.
- **Recent activity** (`coppermind-activity`): the last six log entries; click one to open the page it names.

## The Tinmind
The **Tinmind** is my own class notes, in `The Tinmind/`, kept apart from the wiki. Nicrosil gives it six things.
- **A button.** **The Tinmind**, under **The Coppermind** above the file list, opens the Tinmind Dashboard (`Ctrl+click` or middle-click: new tab).
- **A dashboard.** `The Tinmind/Tinmind Dashboard` has a hero and one block, `coppermind-classes`. Each class notes file has `type: class-notes`, a `course`, a `semester` (such as `Fall 26`), a `current` flag and an `order`. The page title is the picked semester; clicking it opens a menu of every semester, oldest first, and the cards under it are that semester's courses. Each card shows the note count and the newest date in a note's name (`28 notes · last 11-17`, or `No notes yet`), counted from file names, never from note contents. The pick is saved; until one is made, the semester marked `current: true` shows. To add a course, make its notes file with those properties. Properties are hidden on every note in `The Tinmind/`.
- **A mode.** Clicking the button switches the whole app to the Tinmind's colors and closes the right sidebar, so the review queue and relations panel are gone (`Alt+Q` and `Alt+L` only show a note). **The Coppermind** or `Alt+D` switches back and reopens the sidebar if it was open. The mode is not remembered: Obsidian always opens in the Coppermind's mode.
- **A course tree.** In the mode, the file list shows the semester's courses instead of folders, under a copy of the dashboard's semester switcher (same pick). A course is its notes file plus the same-named folder (`Fall 26/SAIL.md` and `Fall 26/SAIL/`). Opening a course lists the folder's notes and sub-folders, then the course page's headings. Click to open; middle-click or `Ctrl+click` for a new tab. Hover a course for **+** (new note) and **...**; right-click or **...** on a note or folder to **Rename** or **Delete** (deletes go to the trash and ask first). **New course** makes a course page for the semester showing, with the properties above. **New semester** asks for a season and year (it suggests the next one), makes the folder and switches to it. **All Class Notes**, a table of every class notes file, has its own row at the bottom. A new note's name starts as the course and today's date (`SAIL 11-22-26`) and can be changed before creating; it gets `type: course-note`, the course and semester (hidden properties), and opens in editing view. A note inside a course shows a pill with the course's name above its title that links to the course page (drawn from the note's folder, so the note has no link line). Course pages have no link back to the dashboard.
- **A course page.** A class notes file also shows a panel under its properties with the same list, **New note** and **New folder**. It is drawn on screen; the file is not changed. Nicrosil makes folders and notes only when I ask, and reads only folder names and headings, never what the notes say. Not covered: renaming or deleting a course or semester, and reordering notes (they sort by name).
- **A Notebook.** A place for notes that aren't for a class. `The Tinmind/Notebook` has `type: notebook` and no semester, so its card shows on the Tinmind Dashboard whichever semester is picked, after the courses, and it has its own row in the course tree. It works like a course: notes sit in `Notebook/` next to the page (made with the first note), topic folders are allowed, and its page has the same panel. A note's name starts as `Notebook` and today's date; its only property is `type: notebook-note`, and its pill says Notebook. The card has a **Quick note** button that makes a note without asking for a name and opens it ready to type. No counts, nothing sorts notes into courses, and the Notebook is not in **All Class Notes**.

## Search
The search box on the [[_dashboard|Dashboard]] shows suggestion cards as I type, over wiki pages, source cards, and perspectives (not raw class notes or readings). It only reads; it never changes a page.
- Open a result with a click, or arrow keys and `Enter`; `Ctrl+Enter` opens it in a new tab.
- Each card shows the title, type, status, any alias that matched, and a snippet. More load on scroll, and a line at the bottom gives the match count.
- `Esc` closes the list; pressing it again clears the box.
- It stays current as pages are created, edited, renamed, or deleted.

## The index and the log
- **Index:** [[_index|index]] lists every page under its type, alphabetically, with a count per type, a total, and a **Jump to** line. Concepts and Glossary are split under A–Z letter headings. When I verify a page, Nicrosil only checks that it is listed. When I reject one, its line is removed and the counts, letter headings and jump links are rebuilt.
- **Log:** Nicrosil adds the entry for each verify and reject to the top of the current month's log file (newest first, old entries never rewritten). The log opens with every entry folded, which needs Obsidian's **Fold heading** option (Settings → Editor).
- **One log file per month:** in `_logs/`, named `_log MM-YY` (`_log 11-26` is November 2026). The first time Obsidian opens in a new month, Nicrosil creates that month's file with its header.[^5]

## The relations panel
`Alt+L` or its button opens it. It follows the open page and shows its typed links from the properties:[^3]
- **A map** with the page in the middle: pages that point at it on the left, pages it points at on the right (up to six a side; **Enlarge** shows all). Arrows are colored by relationship type (legend), and a page's outline shows its status. Click a page to open it (`Ctrl+click`: new tab).
- **Two lists:** "This page…" (outgoing, grouped by type) and "Pointing at this page…" (incoming, worked out from other pages' properties, since each relationship is stored once).[^3]
- **Not shown:** plain links in the page text, which are "see also" links, not relationships.

## The wiki map
`Alt+M` or the Wiki map card opens it in its own tab, with two views chosen at the top. Both read only the typed links in the properties[^3] and change no file.
- **Hierarchy.** A tree built from `type_of`, `part_of`, and `example_of`: each page is a card under the page it is a kind of, part of, or example of. Click a card to open the page; the circle on its edge opens or closes the branch. A box filters by name; **Expand all**, **Collapse all** and **Show examples** do what they say. Pages with none of these links are in a folded list at the bottom.
- **Map.** Every page with a typed link is a dot, and every typed link an arrow from the page that states it. Scroll to zoom, drag to pan, drag a dot to move it. Click a relationship name to hide or show that type; menus filter by status, page type and course; the box finds a page by name. Click a dot to focus on it and its neighbors, `Ctrl+click` to open it. **Flow** turns the pulses on arrows off. Pages with no typed links are not shown, and a note says how many.

## The properties strip
On every note except the Dashboard, the Tinmind page, the index and the logs, Nicrosil replaces the Properties block with a one-line strip showing **type**, **status**, and a date. Click it to open the real block; each note starts collapsed again when opened. The link hover preview shows the same strip.

## Gradient styles
Two named title styles, each a gradient with a glow in the font Almendra SC:
- **Coppermind Gradient Style (CGS):** copper to teal. Used for the Dashboard's name, verified page titles, panel headings, the index's section headings, and the titles of the Index, `_AGENTS` and each month's log.
- **Tinmind Gradient Style (TGS):** grey to lilac. Used for the Tinmind page's title and button and every note title in `The Tinmind/`. In the Tinmind mode it replaces the CGS everywhere.

Both are defined once in the plugin's `styles.css` as CSS variables (`--cm-gradient*`, `--cm-tin-gradient*`). To style a new title, add the class `cm-gradient-style` or `cm-tin-gradient-style`. Exact colors are in [[Nicrosil Changelog]]. Small animations (title glows, flag pulses, map sparks) do not affect function and turn off under the system's reduce-motion setting.

## Logging a schema change
Every change to the rules (`_AGENTS.md` or a file in `SCHEMAS/`) needs a line in [[Schema Changelog]].[^4] Nicrosil adds it:
1. On any page in `SCHEMAS/`, click the pen button in the page header, or run **Log a schema change** from the command palette.
2. Enter the new version in the form `4.2` and a description. The version must be newer than the current one and not already in the changelog.
3. Nicrosil adds the dated line at the top of the changelog, updates its `updated` property, then sets `version` and `updated` on [[SCHEMA]], which holds the rulebook's version.

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

Change them in **Settings → Hotkeys** (search "Nicrosil"). **Log a schema change** has no default hotkey. Nicrosil also adds:
- **The Coppermind** and **The Tinmind** buttons above the file list: open the Dashboard and the Tinmind page, and switch the mode ([[#The Tinmind]]).
- **Left sidebar tab bar buttons** (shown while the Files tab is open; the Files, Search and Bookmarks icons and Obsidian's far-left ribbon are hidden, so other plugins' ribbon icons are hidden too; `Ctrl+Shift+F` still opens search):
  - **Collapse button** (Obsidian's own, first); the **Toggle left sidebar** command is also in the command palette.
  - **Mode button** (both modes): shows the current mode's logo; click to switch to the other mode ([[#The Tinmind]]). Opens no page.
  - **Eye button** (Coppermind mode only, since the Tinmind replaces the file list): shows or hides files and folders whose names start with an underscore. Hidden each time Obsidian opens. The file list's own toolbar is hidden; those actions are still in the command palette and right-click menu.
  - **Review queue** and **Relations panel** buttons (Coppermind mode only).
  - **Two git buttons** (both modes): an up arrow runs Obsidian Git's **Commit-and-sync** (commit everything, pull if Obsidian Git is set to pull before pushing, push, with its usual message); a down arrow runs **Pull**. Same as the Source Control panel's buttons; Obsidian Git's notices report the result, and the button says so if Obsidian Git is off.
- A **status-bar counter** of verified pages (for example, `12/60 verified`).

## Settings
In **Settings → Nicrosil**:
- **Open the next draft after verifying or rejecting** (on by default).
- **Play an animation when I verify a page** (on by default). With the setting above off, only the check and sparks play.
- **Close the extra sidebar panels on startup** (on by default): closes Backlinks, Outgoing links, Tags, All properties and Outline each start. They can still be opened from the command palette.
- **Open pages in Reading view:** "Verified pages only" (default), "Every page", or "Off". Switching a page to editing myself keeps it that way until that tab opens a different page. A new empty note always opens ready to type. Notes in `The Tinmind/` always open in editing view; only the Tinmind Dashboard opens in Reading view.
- **Days between health checks** (14 by default): how long before the Dashboard's health check card calls the check overdue.
- **Queue order:** clean pages first (default), flagged pages first, by page type, or A to Z.

## What it will not do
- **It never verifies on its own.** Every change starts with my click or keypress.
- **It does not run git itself.** The two git buttons only run Obsidian Git's own Commit-and-sync and Pull commands when I click one.
- **It will not verify a source card with a blank `reliability` rating.** Ratings are always item by item.[^1]
- **It does not touch verified pages.** If a verified page's content changes, it goes back to `draft` and needs checking again.
- **It cannot undo a verify or a resolved flag.** To undo a verify, set `status: draft` by hand, change the index line back, and add a correction to the log (past entries are never rewritten). To undo a resolved flag, restore the callout from git before verifying.
- **Skips last only until Obsidian restarts.**

## Troubleshooting
- **No buttons or sidebar:** the plugin is off, or the page is outside the folders above. In the Tinmind mode the right sidebar is closed on purpose; click **The Coppermind**.
- **No Resolve button on a callout:** switch to Reading view, or use the sidebar card or `Alt+F`.
- **Resolved flags waiting to be logged:** they are stored in the plugin's `data.json`, which git syncs. If I resolve flags on one computer, push before verifying that page on the other.
- **"It wasn't in _index.md":** the page's entry is missing or renamed. Fix its line in [[_index|index]] by hand.
- **Properties look reformatted after verifying:** Obsidian rewrites properties when a plugin edits them. The content is the same.
- **Merge conflict in `_index.md` or a log file:** two computers verified pages before syncing. Pull before a review session and push after.
- **A hotkey does nothing after an update:** switch Nicrosil off and on again, then check **Settings → Hotkeys**.

## Keeping this guide current
This guide describes what the plugin does today. Whenever Nicrosil is updated:
1. Change the version number near the top of the page and in the plugin's `manifest.json`.
2. Update the matching section, and the hotkey table if anything was added, removed, or renamed.
3. Add a line at the top of [[Nicrosil Changelog]].
4. The change makes this page a changed page, so it goes back to `draft` until I verify it.[^1]
5. Log it as a `tool` entry ([[SCHEMA - Changes#Nicrosil and other tools]]).

Keep the body of this guide to what each part does. Details of how something looks (corners, fonts, colors, animations, positions) and the history of each change go only in [[Nicrosil Changelog]]; an AI that needs a design or position detail reads the plugin itself. These steps apply to **every** change to a file in the plugin's folder, even a one-line style tweak, and are done in the same edit without being asked. Read the changelog only to add a line or to look up when something changed.

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
[^2]: [[SCHEMA - Review|Schema: Review]], rule 8
[^3]: [[SCHEMA - Writing Pages#Typed links|Schema: Typed links]]
[^4]: [[SCHEMA - Changes#Changing the rules|Schema: Changing the rules]]
[^5]: [[SCHEMA - Index and Log#One file per month|Schema: One file per month]]
