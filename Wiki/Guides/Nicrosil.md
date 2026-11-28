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
changes_since_verified:
  - "2026-11-28: replaced the Lens sections and mentions with Connections (Nicrosil 4.9.2)"
<<<<<<< HEAD
verified_on: 2026-11-28
=======
verified_on: 2026-11-26
>>>>>>> origin/master
---
> [!summary]
> **Nicrosil** is the plugin that does the Coppermind's bookkeeping: the review loop for drafts, the [[_dashboard|Dashboard]], search, query mode, ingesting from Raw, keeping [[_index|index]] and log in step, the atlas and Connections, schema-change logging, and the Tinmind (my class notes). ==It does the bookkeeping, but the checking is still mine.==[^1]

<<<<<<< HEAD
Folder: `.obsidian/plugins/nicrosil/`. Version: `manifest.json` and [[Nicrosil Changelog]].

## Turn it on (once per computer)
**Settings → Community plugins** → switch on **Nicrosil**. After an update, switch it off and on. The files sync through git; the on/off setting doesn't.

## Review tools
For pages with a `status` in `Wiki/`, `Perspectives/`, `Sources/Source Cards/`, `SCHEMAS/` and the vault root.
- **Review queue** (`Alt+Q`): the open page's flags and **Verify / Skip / Reject**, then every draft with flag badges (**A** accuracy, **G** gap, **Q** whose view, **W** unsourced, **✓** none).
- **Changed since verified** (**R**): verified pages the AI changed, with their `changes_since_verified` lines; a line ending in `[[#Heading]]` jumps there.
- **Resolve** a flag: the button on the callout (Reading view), the sidebar card, or `Alt+F`.

### A review session
1. Pull, then **Open next draft** (`Alt+N`).
2. Check the page against its sources.
3. Resolve each flag (fix the text first if needed) and note what I decided.
4. **Verify** (`Alt+V`): sets `verified`, clears `changes_since_verified`,[^2] and logs it with resolved flags; open flags need a tick to override. **Skip** (`Alt+S`): end of the queue for this session. **Reject** (`Alt+R`, reason required): logs, removes from the index, deletes.[^1]
5. Commit and push: "final" means verified **and** committed.

## The Dashboard
`Alt+D` or **The Coppermind** button. Search box; cards for Index, Log, Atlas, Schema, Triage and Agents; review progress with **Open next draft**; the health check card (days since the last check); changed-since-verified, flagged and stale-draft lists; recent log entries.

## Search
The Dashboard search box searches wiki pages, source cards and perspectives as I type. `Enter` opens, `Ctrl+Enter` opens in a new tab, `Esc` closes.

## Query mode
Flip the Dashboard bar to **Query** (computer only) to ask the wiki a question through Claude Code. Pick **Model**, **Effort** and **Depth** ([[SCHEMA - Query#Depth]]).
- **Ask** opens a tab; **Cancel query** stops it. Claude is read-only and can't open Raw, the Tinmind, `.obsidian/` or `.git/`.
- Every answer is logged as a `query` entry. **Save to Analyses** files it as a draft in `Wiki/Analyses/` and logs that. Follow-ups continue the same session.
- **Setup:** install Claude Code and run `claude` once to sign in. If `ANTHROPIC_API_KEY` is set, it bills the API instead of my plan.
- **Usage** button (in Query, Triage, ingest tabs and the transcription tray): shows my 5-hour and 7-day plan limits. It reads Claude Code's saved sign-in and sends it only to Anthropic. Anthropic doesn't document this, so it may break. Turn off under Settings.

## Triage and ingest
**Triage** (`Alt+I`, computer only) lists every source in `Ingestion/Raw/` with a status (text copy ready, needs text copy, image, empty, etc.). Nicrosil reads only names, types and sizes; Claude never sees the list.
- **Start:** tick sources, pick **Model**, **Effort**, **Mode** (**Plan first** or **Draft directly**) and an optional **What matters**. **Ingest as a batch** runs them one after another; **One at a time** waits for **Start next**.
- **The plan** comes back as cards. Untick drafts to leave them out, answer Claude's questions, then **Approve and draft** or **Adjust the plan**. A ticked update to a verified page counts as my request: Claude makes it, and the page goes back to draft with a change note. The plan shows where the original will move to.
- **The report** lists pages created and appended, verified pages changed, flags, and where the original went. If a change to a verified page was only proposed, an amber box says so with **Make these changes**, and **Close** asks twice, since that before/after exists only in the tab.
- **Typed links** in the report: each link Claude added (on verified pages too, which go back to draft), marked *stated* or *inferred*; hover for the reason. **Remove** asks why, takes the link off the page and logs it as rejected ([[SCHEMA - Ingest#4. Reconcile with what's there]]).
- **What Claude can do:** read a copy of the chosen file (staged in hidden `Ingestion/.selected/`), make its text copy, and write drafts, the source card and the log entry. It can't write rules, the index, Perspectives, the Tinmind, Ingestion, Tools, templates or changelogs, and can't move files.
- **The move:** once the drafts are written, Nicrosil moves and renames the original from Raw into the `Sources/` subfolder and name Claude chose (`Readings`, `Class Notes` or `My Work`), with its text copy. It never overwrites; if it can't move, it says why. A cancelled run leaves Raw alone.

## The Tinmind
My class notes in `The Tinmind/`, kept apart from the wiki. **The Tinmind** button (or `Alt+Shift+D`) switches mode; the review queue is off there.
- **Dashboard:** the semester's courses as cards. A course is a notes file (`type: class-notes`, `course`, `semester`, `current`, `order`) plus a same-named folder. Pick the semester from the title.
- **Course tree** (file list in Tinmind mode): new note (named course + date), rename, delete (to trash), new course, delete course, new semester, and **All Class Notes**.
- **Notebook:** for non-class notes; works like a course. **Quick note** makes one without asking for a name.
- **Search:** searches every Tinmind note by title, text and heading.

### Transcription queue
`Alt+T`. The scan on the left, the note on the right, for every note with `transcription: draft` ([[SCHEMA - Transcription]]).
- **Transcribe with Claude:** tick new photos or unlisted scans in the tray, then **✦ Transcribe**; pick course, date, model and effort, and whether to shrink new photos first (runs `shrink_scans.py`, no tokens, originals untouched). Claude gets read-only access to the scans; Nicrosil writes the draft note and log entry.
- **Drawings** (`> [!drawing]`): **Keep screenshot**, **Recreate** (or **✦ Recreate with Claude**), or **Leave out**. A recreated drawing needs **Looks right**.
- **Unsure words** (`[?word?]`): **Next unsure word**, **Accept the guess**, or **✦ Look again**.
- **Verify** (only once drawings are settled): removes the transcription properties, trashes the scans, logs it. **Discard transcription** deletes the draft and keeps the scans.
- Needs Claude Code, and Python with Pillow for shrinking.

## The index and the log
- **Index:** Verify checks the page is listed; Reject removes its line and fixes the counts. Otherwise Nicrosil keeps [[_index|index]] up to date itself.
- **Log:** verify and reject entries go at the top of the month's file in `_logs/` (`_log MM-YY`), which Nicrosil creates the first time Obsidian opens in a new month.[^5] The log opens folded (needs Obsidian's **Fold heading** option).

## Connections
`Alt+L` opens or folds it on every page. A folding section at the bottom of each wiki page, perspective and source card, just above its Footnotes heading, drawn by Nicrosil from the page's links; it changes no file. Folded, it shows the link counts and the page's two biggest typed-link groups. Open, it shows a map (pages linking in on the left, out on the right; typed links colored, plain links dashed; **Ctrl + scroll** zooms, a drag pans, double-click shows it all), then folded lists of pages two steps away that aren't linked yet (worth checking, not auto-adding), the pages it links to, and the pages linking to it, by type.[^3]

## The atlas
`Alt+M`. A map of the wiki by the topics in [[_topics]]; changes nothing. Each topic's anchors are pinned and other pages join the topic they link to most; unconnected pages sit in **No topic yet**. Click a topic or page to see its links; scroll zooms, drag pans, `Esc` goes up. **Edit topics** opens `_topics.md`. The topic list is mine; the agent checks it at each ingest ([[SCHEMA - Ingest#6. Check the topic list]]).

## The properties strip
Notes show a one-line strip of type, status and date instead of the Properties block; click it to open the real one. On `Wiki/` pages, **Add typed link** adds a typed link (pick the type and page). On a verified page that sets it back to draft with a change note.[^2][^3]

## Gradient styles
- **Coppermind Gradient Style (CGS):** copper to teal, for Coppermind titles and headings.
- **Tinmind Gradient Style (TGS):** grey to lilac, for the Tinmind; replaces the CGS in Tinmind mode.

New titles use the class `cm-gradient-style` or `cm-tin-gradient-style`.

## Logging a schema change
On a page in `SCHEMAS/`, click the pen button (or run **Log a schema change**), enter the new version and a description. Nicrosil adds the line to [[Schema Changelog]] and updates the version on [[SCHEMA]].[^4] Change notes on the rule files and the log entry are still mine (or the agent's) to add.
=======
Its folder is `.obsidian/plugins/nicrosil/`. The current version is in `manifest.json` and at the top of [[Nicrosil Changelog]]. When what the plugin does changes, this guide changes with it (see [[#Keeping this guide current]]).

## Turn it on (once per computer)
**Settings → Community plugins**, refresh, switch on **Nicrosil**. After an update, switch it off and on. The plugin files are in git, but the on/off setting is local.

## Review tools
They work on pages with a `status` property in `Wiki/`, `Perspectives/`, `Sources/Source Cards/`, `SCHEMAS/`, and the vault root.

- **Review queue** (`Alt+Q`). Shows the open page's flags with **Verify**, **Skip**, **Reject**, and every draft in review order with flag badges: **A** accuracy check, **G** gap, **Q** question ("Whose view is this?"), **W** unsourced warning, **✓** no flags.
- **Changed since verified** (badge **R**). Verified pages the AI changed at my request, with their `changes_since_verified` lines. A line ending in `[[#Heading]]` goes to that spot when clicked.
- **Resolve** on flag callouts: a button in Reading view; in editing view use the queue card or `Alt+F`.

### A review session
1. Pull first ([[Setting Up Git for the Coppermind]]), then **Open next draft** on the [[_dashboard|Dashboard]] or `Alt+N`.
2. Check the page against its cited sources.
3. **Resolve each flag**: fix the page text first if needed, then click **Resolve** and write what I decided. The callout is removed, and the decision goes into the log when I verify or reject.
4. **Decide:**
   - **Verify** (`Alt+V`; optional note): sets `status: verified` and `verified_on`, deletes `changes_since_verified` (the log keeps it),[^2] and logs the entry with any resolved flags. With flags still open I must tick a box to verify anyway, and the log records them.
   - **Skip** (`Alt+S`): moves the page to the end of the queue for this session.
   - **Reject** (`Alt+R`; reason required): logs the reason, removes the page from the index, and deletes the page.[^1] The dialog lists pages that link to it.
5. The next draft then opens automatically (optional). When finished, commit and push: a page is "saved as final" only when verified **and** committed.

## The Dashboard
[[_dashboard|Dashboard]] (`_dashboard.md`) is the page the vault opens on (`Alt+D`), always in Reading view. Its sections are blocks in the note and can be moved or deleted by editing it. It has:
- **Search:** [[#Search]].
- **Link cards:** Index, Log (newest month), Atlas, Schema, Triage ([[#Triage and ingest]]), Agents (`_AGENTS`).
- **Review progress:** verified count and percentage, drafts and open flags, **Open next draft**; a **health check card** (days since the last check, from report names in `Health Checks/`; opens the latest report); the **Changed since verified** list; lists of pages with open flags and of stale drafts.
- **Recent activity:** the last six log entries; click opens the page named.

## The Tinmind
My own class notes, in `The Tinmind/`, kept apart from the wiki.
- **Mode.** The **The Tinmind** button opens the Tinmind Dashboard and switches to the Tinmind's mode, with the right sidebar closed, so the review queue is unavailable. **The Coppermind** or `Alt+D` switches back. The mode isn't remembered: Obsidian opens in the Coppermind's.
- **Dashboard.** `The Tinmind/Tinmind Dashboard` shows the picked semester's courses as cards with note count and newest date, counted from file names only. A class notes file has `type: class-notes`, `course`, `semester` (`Fall 26`), `current` and `order`; to add a course, make that file. The semester menu's pick is saved; until then the one marked `current: true` shows. Properties are hidden on every note in `The Tinmind/`.
- **Search.** Read-only search of every note under `The Tinmind/` by title, alias, text and heading (a heading is its own result and jumps to it).
- **Course tree.** The file list shows the semester's courses (a course is its notes file plus a same-named folder: `Fall 26/SAIL.md`, `Fall 26/SAIL/`). It offers new note, **Rename**, **Delete** (to the trash, after asking), **New course**, **Delete course** (page and folder, after a file count; not the Notebook), **New semester** (suggests the next one, makes the folder, switches to it), and an **All Class Notes** table. A new note is named course + date (`SAIL 11-22-26`, editable first), gets `type: course-note` with hidden course and semester properties, opens in editing view, and links back to its course page. Not covered: renaming or deleting a semester, renaming a course, reordering notes (sorted by name).
- **Course page.** Lists the course's notes and folders, with **New note** and **New folder**. Nicrosil makes files only when I ask, and reads only folder names and headings.
- **Notebook.** For notes that aren't for a class. `The Tinmind/Notebook` (`type: notebook`, no semester) works like a course (notes in `Notebook/`, topic folders allowed) but has no counts and isn't in **All Class Notes**. Its notes are named `Notebook` + date with only `type: notebook-note`. **Quick note** makes one without asking for a name.
- **Transcription queue.** `Alt+T` or the **Transcriptions** link on the Tinmind Dashboard opens the scan beside the note in an ordinary editor; **Close** ends it. It works in either mode. It lists every note with `transcription: draft` ([[SCHEMA - Transcription]]) in photographed order, and how many scans in `Sources/Scans/` no note lists yet. If the editor moves to a note that isn't waiting, the bar offers **Back to** the one I was checking.
- **Transcribe scans with Claude.** The tray lists new phone photos in the photos folder (see Settings) that aren't shrunk yet, and the scans no note lists yet. **✦ Transcribe** opens a panel where I tick scans and pick the course, optionally the class date, the model and the effort, and whether to shrink the ticked photos first. Shrinking runs `Tools/shrink-scans/shrink_scans.py` on this computer, uses no tokens, and never touches my originals. Claude Code gets only the Read tool, for `Sources/Scans/`, [[SCHEMA - Transcription]] and `_AGENTS.md`: it can't write, delete or open the Tinmind. Nicrosil writes the draft in the course's folder with `transcription: draft` and `scan_pages`, adds the `transcribe` log entry, and opens it in the queue, where Verify is still mine. The tray's **Usage** button opens the usage meter ([[#Query mode]]). Desktop only; it needs Claude Code, and Python with Pillow for shrinking.
  - **Drawing flags** (`> [!drawing]`): **Show on scan**; **Keep screenshot** (a dragged box or the **Whole page**, saved as a JPEG in `_attachments/Tinmind/` and embedded in place of the flag); **Recreate** (Claude redraws it as Mermaid, a table or a list, marked `> [!recreate]`; the scan stays until the result is checked with **Looks right**); **Leave out**. These edit the note, so Obsidian's undo works.
  - **Unsure words** (`[?word?]`, `[??]`): counted in the bar, with **Next unsure word**, **Accept the guess**, and **✦ Look again**, which asks Claude for better guesses (they stay marked until I accept them).
  - **Verify** is off while a drawing is undecided, waiting to be recreated or checked. It asks first (and again if unsure words remain), removes `transcription` and `scan_pages` from the note, trashes its scans (a scan another unverified note lists stays), and logs a `verify` entry. **Discard transcription** deletes the draft, keeps the scans and logs my reason. **Skip** moves on.

## Search
The Dashboard search box suggests wiki pages, source cards and perspectives (not class notes or readings) as I type, with type, status, matched alias and a snippet. Click or `Enter` opens one; `Ctrl+Enter` opens it in a new tab. Read-only, and it stays current as pages change.

## Query mode
The Dashboard's **Search / Query** switch (computer only) makes the search bar ask the wiki a question through Claude Code instead of matching keywords. I choose **Model** (Haiku, Sonnet, Opus), **Effort** (Low to Max; Haiku has none) and **Depth** (Quick, Standard, Deep, as in [[SCHEMA - Query#Depth]]); the choices are remembered. A **Usage** button opens the usage meter.

- **Ask** (or Enter) opens a query tab that lists each step (rules read, searches, pages read) with elapsed time and estimated progress. **Cancel query** stops it, and nothing is logged.
- **The answer** comes back in the Analysis template's sections, with links that open the pages. Claude has read-only tools and can't open `Ingestion/Raw/`, `The Tinmind/`, `.obsidian/` or `.git/`, so it can't file or log anything itself.
- **Nicrosil logs every answer** as a `query` entry (model, effort, depth, pages used, "not filed back yet").
- **Save to Analyses** writes the answer to `Wiki/Analyses/` as a draft, with its properties and summary callout filled in, the file name and **Ask again if** line editable first, and a second `query` entry saying it was filed back. It refuses a name already taken. **Copy** copies the answer; **Discard** closes the tab.
- **Follow-ups** continue the same Claude Code session; Save files the newest answer.
- **Setup, once per computer:** install Claude Code and sign in by running `claude` in a terminal. If `ANTHROPIC_API_KEY` is set, Claude Code bills the API instead of my plan; the query tab says so.
- **The usage meter** shows how much of my plan's limits I've used: the 5-hour and 7-day windows (and a Sonnet or Opus window when the plan has one), each with when it resets. It refreshes about every 30 seconds (every 10 during a Claude Code run, and once after each run) and pauses while Obsidian is hidden. To get the figures, Nicrosil reads Claude Code's saved sign-in (`.claude/.credentials.json` in my user folder), sends it only to Anthropic, and never keeps, shows or logs it. Anthropic doesn't document this service, so it may stop working. If the sign-in is missing or expired (Claude Code renews it the next time it runs), the meter keeps its last reading and says why it is paused. It opens from a **Usage** button in Query, Triage, each ingest tab and the transcription tray. Turn it off under Settings → Nicrosil → Live usage meter; the meter then shows a percent only if Claude Code reports one during a query, and otherwise the last query's tokens.

## Triage and ingest
**Triage** (`Alt+I`, or the Triage card on the Dashboard; computer only) lists every source in `Ingestion/Raw/`, newest first, and updates itself when a file is added, removed or renamed. Nicrosil reads only each file's name, type, size and date; it never opens a file, and Claude never sees the list.

- **Each source** shows a status from its type: **Text copy ready** (a `(text).md` copy is in Raw or `Sources/`), **Already text** (`.md`, `.txt`), **Needs text copy** (a PDF or Office or web file without one), **Image**, **Unknown type**, or **Empty file** (can't be picked). **New** marks files added in the last day, and **Already in Sources** a file whose name is already there. Filters: All, Text ready, Needs work, New.
- **Pick sources** by clicking them (or **Select all shown**). The **Ingest queue** lists them in order. I choose **Model**, **Effort** (Haiku has none) and **Mode**, **Plan first** or **Draft directly** (the MODE input of [[SCHEMA - Ingest#The ingest operation]]), and optionally one **What matters** note for the run. The choices are remembered.
- **Ingest as a batch** opens one ingest tab per source, each starting when the one before it has given its plan or report. **One at a time** opens the first; **Start next** in its tab opens the next.
- **An ingest tab** works like a query tab: the steps while Claude works, then its report, with links to the pages. In plan-first mode **Approve the plan** tells Claude to draft; the reply box adjusts the plan or answers its questions in the same session. It lists the pages created and appended, the source card, where the source was copied, the number of flags, and **Open the review queue**.
- **The plan board.** In plan-first mode the plan comes back as cards: the proposed drafts grouped as Source, New pages and Updates to existing pages, each with its type, what it holds, where in the source it comes from, what an update adds, and a mark on updates to verified pages. Untick a draft to leave it out. Claude's questions come with answer buttons, and it lists what it skipped and its notes. **Approve and draft** sends the go-ahead with the drafts left out and my answers; **Adjust the plan** sends what I type instead. A plan without the cards' data is shown as text.
- **What Claude can do in an ingest:** Nicrosil copies the one chosen file, unchanged, to the hidden `Ingestion/.selected/` folder, and Claude reads it there; `Ingestion/Raw/` stays closed to it. Claude follows [[SCHEMA - Ingest]]: it copies the source into `Sources/`, makes the text copy with `Tools/source-to-text`, drafts the pages and source card, and adds the `ingest` log entry. It can write only where an ingest writes (not `SCHEMAS/`, `_AGENTS.md`, `_index.md`, `Perspectives/`, `The Tinmind/`, `Ingestion/`, `Tools/`, templates or changelogs) and run only the copy, folder, text-copy and health-check commands. Every page it writes is a draft.
- **The staged copy** is removed when the drafts are written or the tab is closed, and any left over at startup. The original stays in Raw for me to delete.

## The index and the log
- **Index:** [[_index|index]] lists every page under its type, alphabetically, with counts, a total and a **Jump to** line. Verify only checks that the page is listed. Reject removes its line and rebuilds the counts and jump links.
- **Log:** Nicrosil adds each verify and reject entry at the top of the current month's file (newest first, old entries never rewritten).
- **One file per month** in `_logs/`, named `_log MM-YY`. The first time Obsidian opens in a new month, Nicrosil creates it with its header.[^5]

## Connections
`Alt+L` opens or folds it on every page; a setting turns it off. It sits just above the Footnotes heading of each wiki page, perspective and source card (at the end of a page with none), in Reading view and Live Preview, and is drawn from the links; it changes no file.
- **Folded:** the link counts and the page's two biggest typed-link groups.
- **Map:** the page, the pages linking to it, and the pages it links to, all of them, typed links first. Typed links are colored by relationship type; plain links (in text or in properties such as `sources`) are "see also". **Ctrl + scroll** (or a pinch) zooms, a drag pans, and the corner buttons or a double-click show the whole map. Click opens a page; `Ctrl+click` a new tab.
- **Two steps away, not linked yet:** up to six pages that at least two of this page's neighbors link with but this page doesn't, best first (summaries, guides and prompts excluded). Links worth checking, not to add unread.
- **Two lists:** outgoing ("This page links to") and incoming ("Pointing at this page", worked out from other pages since each relationship is stored once),[^3] grouped by type, with plain links last.

## The atlas
`Alt+M` or the Atlas card. Reads the links and [[_topics]]; changes no file.
- **Topics.** Each topic in `_topics.md` has anchor pages. Every other page in `Wiki/` and `Perspectives/` joins the topic that reaches it most strongly by spreading out from the anchors along links (a typed link counts double). Pages with no link path to an anchor sit in **No topic yet**. Nothing is written on pages. It recomputes when links, pages or the topic list change.
- **Whole wiki.** Shows how many links join two topics, and pages sized by incoming links, colored by type (or by status with **Status**). The side panel gives counts and lists topics.
- **A topic** (click): its links, anchors and busiest pages; the side panel adds its description, status, most-linked pages, topics it links with most and never links with, and pages almost in another topic (candidates for an anchor or a link there).
- **A page** (click, or search): its links by type, its topic, and **Open page**. Double-click or `Ctrl+click` opens it.
- `Esc` goes up a level, **Atlas** returns to the whole wiki. **Edit topics** opens `_topics.md`; **Show this page in the atlas** (command palette) opens it on the current page.
- **The topic list is mine.** The agent checks it at each ingest ([[SCHEMA - Ingest#6. Check the topic list]]). Anchors that aren't pages are listed in the side panel.

## The properties strip
On every note except the Dashboard, the Tinmind page, the index and the logs, a one-line strip of **type**, **status** and a date replaces the Properties block; click to open the real one. Link hover previews show it too.

On pages in `Wiki/`, the open Properties block ends with an **Add typed link** button: choose one of the ten link types, search for a Wiki page (aliases count), and press **Add** or Enter. The link goes into that type's property, and Enter keeps the row open for the next link. A link already under the same type is refused. On a verified page the same edit sets `status: draft`, keeps `verified_on` and adds a `changes_since_verified` line, like any change to a verified page.[^2][^3]

## Gradient styles
- **Coppermind Gradient Style (CGS):** for the Dashboard's name, verified page titles, panel headings, the index's section headings, and the titles of the Index, `_AGENTS` and each month's log.
- **Tinmind Gradient Style (TGS):** for the Tinmind page and every note title in `The Tinmind/`; in the Tinmind mode it replaces the CGS.

To style a new title, add the class `cm-gradient-style` or `cm-tin-gradient-style`.

## Logging a schema change
Every change to the rules (`_AGENTS.md` or a file in `SCHEMAS/`) needs a line in [[Schema Changelog]].[^4] On any page in `SCHEMAS/`, click the pen button or run **Log a schema change**, then enter the new version (such as `4.2`, newer than the current one and not already in the changelog) and a description. Nicrosil adds the dated line to the changelog, updates its `updated` property, and sets `version` and `updated` on [[SCHEMA]]. It does not touch `status`, `verified_on` or the log: each changed rule file goes back to `draft` with a change note,[^1] and the log entry is still mine to add.
>>>>>>> origin/master

## Hotkeys and buttons
| Key | Action |
| --- | --- |
| `Alt+V` / `Alt+R` / `Alt+S` | Verify / Reject / Skip |
| `Alt+N` | Next draft |
| `Alt+F` | Resolve a flag |
| `Alt+Q` / `Alt+L` | Review queue / Open or fold Connections |
| `Alt+T` | Transcription queue |
| `Alt+I` | Triage |
| `Alt+M` | Atlas |
| `Alt+D` | Dashboard |
| `Alt+Shift+D` | Switch Coppermind / Tinmind |
| `Alt+E` | Show the file list |
| `Ctrl+click` | Open in a new tab |

<<<<<<< HEAD
Change them in **Settings → Hotkeys**. The left sidebar's tab bar also has: mode switch, show/hide `_` files, review queue (or the transcription queue in Tinmind mode), and **Commit-and-sync** / **Pull** buttons that run Obsidian Git. The status bar counts verified pages.

## Settings
**Settings → Nicrosil:** open the next draft after verifying; verify animation; close extra sidebar panels and other tabs on startup; which pages open in Reading view; days between health checks (14); queue order; Claude Code path; photos folder; Python path; live usage meter.
=======
Change them in **Settings → Hotkeys** (search "Nicrosil"). **Log a schema change** and **Show this page in the atlas** have no default hotkey. Nicrosil also adds:
- **The Coppermind** and **The Tinmind** buttons (open the Dashboard or Tinmind page and switch mode).
- **Left sidebar buttons**, with Obsidian's ribbon and the Files, Search and Bookmarks icons hidden (so other plugins' ribbon icons too; `Ctrl+Shift+F` still opens search):
  - **Mode button** (both modes): switches mode, opens no page.
  - **Eye button** (Coppermind mode): shows or hides files and folders starting with an underscore; hidden on each start. The file list's own toolbar is hidden; its actions remain in the command palette and right-click menu.
  - **Review queue** (Coppermind mode); **Transcription queue** (Tinmind mode).
  - **Git buttons** (both modes): up arrow runs Obsidian Git's **Commit-and-sync**, down arrow runs **Pull**. The button says so if Obsidian Git is off.
- A **status-bar counter** of verified pages (`12/60 verified`).

## Settings
In **Settings → Nicrosil**:
- **Open the next draft after verifying or rejecting** (on).
- **Play an animation when I verify a page** (on). With the setting above off, only the check and sparks play.
- **Close the extra sidebar panels on startup** (on): Backlinks, Outgoing links, Tags, All properties, Outline.
- **Close the other tabs on startup** (on): keeps only the Dashboard open, so a page left open doesn't come back in the wrong mode.
- **Open pages in Reading view:** "Verified pages only" (default), "Every page", or "Off". Switching a page to editing myself holds until that tab opens a different page. A new empty note opens ready to type. Notes in `The Tinmind/` open in editing view; only the Tinmind Dashboard opens in Reading view.
- **Days between health checks** (14): when the Dashboard's health check card calls the check overdue.
- **Queue order:** clean pages first (default), flagged first, by page type, or A to Z.
- **Claude Code for query mode:** blank finds Claude Code by itself; or enter its path. **Test** shows the version found.
- **Photos folder (for transcribing):** where my phone photos land on this computer.
- **Python for shrinking:** blank tries `python`, `py` and `python3`. **Test** checks that Python and Pillow work.
>>>>>>> origin/master

## What it will not do
- Verify anything without my click.
- Let Claude write to the Tinmind, or move files in an ingest.
- Delete a scan except when I verify its transcription.
- Run git except when I click a git button.
- Verify a source card with no `reliability` rating.[^1]
- Undo a verify or a resolved flag. To undo a verify, set `status: draft` by hand, fix the index line, and log a correction; restore a resolved flag from git.
- Keep skips past a restart.

## Troubleshooting
<<<<<<< HEAD
- **No buttons or sidebar:** the plugin is off, the page is outside the review folders, or you're in Tinmind mode.
- **No Resolve button:** use Reading view, the sidebar card, or `Alt+F`.
- **Resolved flags lost between computers:** they wait in `data.json`; push before verifying on the other computer.
- **"It wasn't in _index.md":** fix the page's line in [[_index|index]] by hand.
- **Merge conflict in the index or log:** pull before reviewing, push after.
- **Hotkey dead after an update:** switch Nicrosil off and on.

## Keeping this guide current
Code lives in the plugin's `src/` parts and is built with `python build.py` (see `src/README.md`). For every change, follow [[SCHEMA - Changes#Nicrosil and other tools]]: one version bump, one changelog line and one `tool` log entry per session. Update this guide only when what Nicrosil does changes. Looks and history go in [[Nicrosil Changelog]], not here.
=======
- **No buttons or sidebar:** the plugin is off, or the page is outside the folders above. In the Tinmind mode the right sidebar is closed on purpose.
- **No Resolve button:** switch to Reading view, or use the queue card or `Alt+F`.
- **Resolved flags waiting to be logged** are stored in the plugin's `data.json`, which git syncs. If I resolve flags on one computer, push before verifying on the other.
- **"It wasn't in _index.md":** the page's entry is missing or renamed; fix its line in [[_index|index]] by hand.
- **Properties look reformatted after verifying:** Obsidian rewrites them when a plugin edits them; content is the same.
- **Merge conflict in `_index.md` or a log file:** two computers verified before syncing. Pull before a review session, push after.
- **A hotkey does nothing after an update:** switch Nicrosil off and on, then check **Settings → Hotkeys**.

## Keeping this guide current
The code is edited in the parts in the plugin's `src/` folder and built into `main.js` and `styles.css` with `python build.py`; `src/README.md` says what each part holds. Whenever Nicrosil is updated ([[SCHEMA - Changes#Nicrosil and other tools]]):
1. Bump the version in `manifest.json`, once per session.
2. Add one line at the top of [[Nicrosil Changelog]] for the session, at most two sentences.
3. Log it as one `tool` entry for the session.
4. Only if what Nicrosil does has changed: update the matching section here (and the hotkey table if a key changed). This page then goes back to `draft` until I verify it.[^1] A fix or a change in looks needs nothing here.

Keep this guide to what each part does. How something looks and the history of each change go only in [[Nicrosil Changelog]]; an AI that needs a detail searches the plugin's `src/` parts. These steps apply to **every** change to a plugin file, even a one-line style tweak, and are done without being asked.
>>>>>>> origin/master

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
[^2]: [[SCHEMA - Review|Schema: Review]], rule 8
[^3]: [[SCHEMA - Writing Pages#Typed links|Schema: Typed links]]
[^4]: [[SCHEMA - Changes#Changing the rules|Schema: Changing the rules]]
[^5]: [[SCHEMA - Index and Log#One file per month|Schema: One file per month]]
