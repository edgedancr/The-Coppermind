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
drafted_by: Claude (claude-sonnet-5-5; review queue, flags, hotkeys and dashboard added by claude-opus-5-5; Dashboard page and home button by claude-sonnet-5-5; rewritten as the full Nicrosil guide by claude-sonnet-5-5; quiet Dashboard by claude-opus-5-5; relations map glow, Reading view on open, health check card, clickable change lines, the restyled map and hierarchy and the hover-preview strip by claude-sonnet-5-5; SCHEMAS folder and monthly log by claude-opus-5-5; larger file-list button name and index letter headings and jump bar, the flat relations map, the trimmed guide body, and the changelog moved to its own file, by claude-sonnet-5-5; Coppermind Gradient Style section by claude-sonnet-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-21
---
> [!summary]
> **Nicrosil** is the plugin that does the Coppermind's bookkeeping. It runs the review loop for draft pages, draws the [[_dashboard|Dashboard]], searches the wiki, keeps [[_index|index]] and log in step, tidies how pages look, and records schema changes. ==It does the bookkeeping, but the checking is still mine==, because a page only becomes verified when I decide it has been checked against its sources.[^1]

This guide describes Nicrosil **v2.13.6**. Its folder is `.obsidian/plugins/nicrosil/`. When the plugin changes, this guide changes with it (see [[#Keeping this guide current]]).

## What Nicrosil does
| Area | What it does | Where to read more |
| --- | --- | --- |
| **Review** | A queue of drafts, flag callouts with **Resolve** buttons, and **Verify**, **Skip**, and **Reject** | [[#Review tools]] |
| **Relations** | A side panel for the open page: a map and grouped lists of its typed links, outgoing and incoming | [[#The relations panel]] |
| **Wiki map** | Two views of the whole wiki's typed links: a collapsible hierarchy tree and a zoomable map | [[#The wiki map]] |
| **Dashboard** | The front page: progress, search box, six navigation cards, recent activity | [[#The Dashboard]] |
| **Search** | A live search box over wiki pages, source cards, and perspectives | [[#Search]] |
| **Index and log** | Checks [[_index|index]] and writes to log after each verify or reject, folds the log's entries, and starts each month's log file in `_logs/` | [[#The index and the log]] |
| **Page tidying** | Replaces each page's properties block with a one-line strip | [[#The properties strip]] |
| **Schema changes** | A button that adds a line to [[Schema Changelog]] and updates the version in [[SCHEMA]] | [[#Logging a schema change]] |
| **Shortcuts** | Hotkeys, a Coppermind button above the file list, and a status-bar counter | [[#Hotkeys and buttons]] |

## Turn it on (once per computer)
1. In Obsidian: **Settings → Community plugins**, click the refresh icon next to "Installed plugins," and switch on **Nicrosil**.
2. After an update, switch it off and on again (or restart Obsidian) to load the new version.
3. The plugin files are tracked in git, so a second computer gets them with a pull. Switch it on there too, since the on/off setting is local.

## Review tools
Review tools work on pages in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, the rule files in `SCHEMAS/`, and root-level files, that have a `status` property. The rule files appear in the queue under **Schemas**.

- **Review queue (right sidebar).** Open it with `Alt+Q` or the ribbon button. It shows:
  - a progress bar
  - a card for the page I'm on, with its flags and **Verify**, **Skip**, and **Reject** buttons
  - every draft, in review order, with flag badges: **A** accuracy check, **G** gap, **Q** question ("Whose view is this?"), **W** unsourced warning, **✓** no flags
  - a **Changed since verified** list at the top, with an **R** badge on each page: verified pages the AI changed at my request. Their card shows the lines from the page's `changes_since_verified` property, so I check only what changed. A line that ends with a link to a section (`[[#Heading]]`) is clickable, on the card and on the Dashboard, and goes to that spot in the page; `Ctrl+click` opens the page in a new tab
  - a collapsed list of verified pages
- **Resolve buttons on flags.** Each flag callout gets a **Resolve** button in its title bar in Reading view. In editing view, use the sidebar card or `Alt+F`.

### A review session
1. Pull first (see [[Setting Up Git for the Coppermind]]).
2. On [[_dashboard|Dashboard]], click **Open next draft**, or press `Alt+N`.
3. Read the page and check it against the sources it cites.
4. **Resolve each flag.** If a claim needs correcting, edit the page text first. Then click **Resolve** and write what I decided. The callout is removed from the page, and my decision is saved and written into the log when I verify (or reject) the page.
5. **Decide:**
   - **Verify** (`Alt+V`): optionally note what I changed and why, then `Ctrl+Enter`. The page gets `status: verified` and `verified_on`, and log gets an entry listing any flags I resolved. A short animation plays (see [[#Settings]] to turn it off). If flags are still open, I have to tick a box to verify anyway, and the log records them.
     - If the page has a `changes_since_verified` property, Verify deletes it, and the log keeps the record.[^2]
   - **Skip** (`Alt+S`): moves the page to the end of the queue for this session and opens the next one.
   - **Reject** (`Alt+R`): write the reason (required), then `Ctrl+Enter`. The reason is logged, the page is removed from the index, and the page is deleted.[^1] The dialog lists pages that link to it, so I can fix those links afterward.
6. After Verify or Reject, the next draft opens automatically. Turn this off with the checkbox in the sidebar or in the plugin's settings.
7. When finished, commit and push. A page is only "saved as final" once it is verified **and** committed.

## The Dashboard
[[_dashboard|Dashboard]] is the page the vault opens on. It is the file `_dashboard.md`; the underscore keeps it out of the file list unless the eye button is on, and the Coppermind button and `Alt+D` open it. Each section is a block in the page's text, so a section can be moved or deleted by editing the note. From top to bottom it has:
- **Header** (`coppermind-hero`): the Coppermind logo, name, and tagline, with the search box (see [[#Search]]) right under them.
- **Four link cards** (`coppermind-nav`): Index, Log, Wiki map, and Schema, each a name and a one-line description. The **Log** card opens the newest month's log file. A click opens the page in the current tab. ==`Ctrl+click` (or middle-click) opens it in a new tab.== The Wiki map card opens its own tab instead, so it has no new-tab version.
- **Review progress** (`coppermind-dashboard`): one line of stats (pages verified, with the share, drafts, and open flags), a progress bar showing how much is verified, and a small line counting the open flags by kind and the drafts older than 14 days. Under it is a bar for each page type showing its verified and draft pages. A **Changed since verified** section lists each re-review with its change lines. Below that are folded lists naming the pages with open flags, by kind, and the drafts older than 14 days. To start a review session from the Dashboard, use the **Open next draft** button on the first card (`Ctrl+click` opens the draft in a new tab). It also shows the review queue on the right.
- **Health check card:** inside the review progress section, showing how long it has been since the last health check. A bar fills over the 14 days between checks, and it changes color for the last two days and again once the check is overdue (or if none has been saved yet). It reads the dates from the report names in `Health Checks/`, so it updates itself when a new report is saved, and clicking it opens the latest report.
- **Recent activity** (`coppermind-activity`): the last six log entries (early in a month, the rest come from last month's file in `_logs/`). Click one to open the page it names, or the log file it came from.
- **Reference:** folded sections on what the Coppermind is, how to read it, what it covers, and its six parts. These are ordinary text in the note.

**Reading and editing.** The Dashboard always opens in Reading view, and every other note keeps the mode it was in. Its properties are hidden, and so is the Properties side pane while the Dashboard is the active note. To edit it, press `Ctrl+E`; it stays in editing until I click into the Dashboard again from another tab or note.

**Getting back to it from anywhere:** click the large **The Coppermind** button at the top of the file list, or press `Alt+D`. If the Dashboard is already open in a tab, this switches to that tab; otherwise it opens in the current tab. `Ctrl+click` or middle-click on the button always opens it in a new tab, even if the Dashboard is already open in another one.

**Look.** Every note, the Dashboard included, sits on the vault's brown with a copper and teal glow. The background is a single CSS variable, `--cm-bg-gradient`, defined in the plugin's `styles.css`; change it there to change every page at once. The sidebars and the open file in the file list carry a matching glow. All of this only applies while Nicrosil is enabled, and the sidebar and file-list colors only in dark mode.

## Search
The search box on the [[_dashboard|Dashboard]] shows suggestion cards as I type, over wiki pages, source cards, and perspectives. It does not search the raw class notes or readings, and it only reads: it never changes a page.
- **Open a result:** click it, or use the arrow keys and `Enter`. `Ctrl+Enter` opens it in a new tab.
- **Every match is reachable.** The best matches come first, and more cards appear as I scroll. A line at the bottom says how many pages matched.
- **Each card shows** the page's title, its type and status, any alias that matched, and a snippet of the matching text. Snippets and review cards leave out footnote markers and the Footnotes section.
- **Esc** closes the list, and pressing it again clears the box.
- It stays up to date on its own as pages are created, edited, renamed, or deleted.

## The index and the log
- **Index:** [[_index|index]] lists every page under its type, in alphabetical order, with a count per type and a total at the top. Concepts and Glossary are split under A–Z letter headings, and a **Jump to** line under the total links to each type. It does not show whether a page is verified; the review queue and the Dashboard do that. When I verify a page, Nicrosil only checks that the page is listed. When I reject one, its line is removed and Nicrosil rebuilds the counts, letter headings and jump links.
- **Log:** Nicrosil adds the entry for each verify and reject to the top of the current month's log file (newest first, never rewriting old entries). The log opens with every entry folded, so it reads as a short list; this needs Obsidian's **Fold heading** option (Settings → Editor) to be on.
- **One log file per month:** the log lives in `_logs/`, one file per month, named `_log MM-YY` (`_log 11-26` is November 2026). The first time Obsidian opens in a new month (and before Nicrosil adds an entry in one), it creates that month's file with its header. Earlier months' files are left as they are, and every month's file opens folded, like the log.[^5]
- **Properties:** [[_index|index]], every month's log file, and the Dashboard hide their properties entirely.

## The relations panel
Open it with `Alt+L` or the branching-arrows button in the ribbon. It follows whichever page is open and shows how that page connects to the rest of the wiki through the typed links in its properties:[^3]
- **A map.** The page sits in the middle. Pages that point at it are on the left; pages it points at are on the right. Each arrow is colored by relationship type, and the legend under the map names the colors. Some types are also dashed (`related` is dashed, `contradicts` is dotted), so color is never the only cue. A page's outline shows its status: teal for verified, copper for a draft, dashed grey for none. Pointing at a page highlights its arrows and lights up its relationship names in the legend. Click a page to open it, or `Ctrl+click` for a new tab. The map shows up to six pages on each side. An **Enlarge** button under the map (always there) opens the map in a large window with every page, and clicking a page there opens it. The lists below always show them all.
- **Two lists.** "This page…" groups the outgoing links by type ("Is part of", "Supports", and so on). "Pointing at this page…" groups the incoming links ("Parts of this", "Examples of this", "Supported by"). Incoming links are worked out from the other pages' properties, since each relationship is stored only once.[^3]
- **Not shown:** plain links in the page text. They are "see also" links, not relationships.

## The wiki map
Open it with `Alt+M` or the Wiki map card on the Dashboard. It opens in its own tab, on the Map view, and has two views, chosen at the top. Both read only the typed links in the properties,[^3] never the plain links in the text, and neither changes a file.
- **Hierarchy.** A branching diagram built from `type_of`, `part_of`, and `example_of`: each page is a card joined by a line to the page it is a kind of, a part of, or an example of, so Artificial Intelligence → Machine Learning → Deep Learning reads left to right. A card shows its page type, its status, and the number of pages below it. Click a card to open the page (`Ctrl+click` for a new tab). The circle at its right edge opens or closes the branch, and pointing at a card lights up the path to its top page and everything below it. The box filters by page name, **Expand all** and **Collapse all** do what they say, **Show examples** adds or removes the `example_of` pages, and dragging the background pans. A page that is part of two things appears under both, and pages with none of these links are in a folded list at the bottom.
- **Map.** Every page that has a typed link is a dot, and every typed link is an arrow from the page that states it to the page it points at.
  - **Colors:** arrows are colored by relationship type, with `related` dashed and `contradicts` dotted. Dots are colored by page type. A teal ring means verified, a dashed copper ring means draft, and an amber outline means the page changed since it was verified. Bigger dots have more links.
  - **Move around:** scroll to zoom, drag the background to pan, and click **Reset view** to start over. Names show for the busiest pages, for a focused page and its neighbors, and for every page once zoomed in.
  - **Motion:** the dots settle when the map opens. Drag a dot to move it; the dots it links to follow. Pointing at a dot lights up its links and neighbors, and clicking a dot, or choosing a neighbor in the panel, glides the view to it. A pulse of light travels along each arrow in the direction of the link; the **Flow** button turns this off, and it stays off between visits. If your computer is set to reduce motion, the map skips the settling and the pulses.
  - **Filters:** click a relationship name at the top to hide or show that type. The menus filter by status, page type, and course. The box finds a page by name; press `Enter` to zoom to it.
  - **Focus:** click a dot to dim everything except that page and its neighbors. The panel under the map lists how it connects, and its neighbors are clickable. `Ctrl+click` a dot to open the page.
  - **Not shown:** pages with no typed links. The note under the map says how many there are.

## The properties strip
On every other note, Nicrosil hides the full Properties block and puts a one-line strip in its place, showing the page's **type**, **status**, and a date (`drafted` or `verified`). Click the strip to open the real Properties block. Each note starts collapsed again when I open it. The pop-up preview that appears when I point at a link shows the same strip, so a preview looks like the page itself.

## Ambience
Small animations make the vault feel alive. None of them change how anything works. They include glows on page titles by status (a verified title is a copper-to-teal gradient, a draft title pulses like an ember), a soft pulse on flag callouts, a fade when a page opens, sparks on verified dots in the wiki map, a pulse on the newest Dashboard activity row, rows sliding into place in the review queue, and a glow on the status-bar count when it goes up.
They are all off if the computer is set to reduce motion.

## Coppermind Gradient Style
The **Coppermind Gradient Style** is the vault's one look for a gradient title: copper-to-teal lettering in Almendra SC with a still glow. It is used for the Dashboard's name and title, a verified page's title, the review queue and relations panel headings, and the index's section headings. It is defined once in the plugin's `styles.css` as `--cm-gradient`, `--cm-gradient-font` and `--cm-gradient-glow`, and the theme snippet reads the same three. To give a title in a new feature the style, add the class `cm-gradient-style` to it. Change a variable and every title follows; the exact colors are in [[Nicrosil Changelog]].

## Logging a schema change
Every change to the rules (`AGENTS.md` or a file in `SCHEMAS/`) needs a line in [[Schema Changelog]].[^4] Nicrosil adds it for me:
1. On any page in `SCHEMAS/`, click the pen button in the page header, or run **Log a schema change** from the command palette.
2. Enter the new version number in the form `4.2` and a description of what changed. The version must be newer than the current one and not already in the changelog.
3. Nicrosil adds the dated line at the top of the changelog and updates its `updated` property, then sets `version` and `updated` on [[SCHEMA]], which holds the rulebook's version.

It does not touch `status`, `verified_on`, or log. After a schema change, each changed rule file goes back to `draft` with a change note,[^1] and the log entry is still mine to add.

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
| `Ctrl+click` or middle-click | Open a Dashboard card or the Coppermind button in a new tab (search results: `Ctrl+click` or `Ctrl+Enter`). `Ctrl+click` also opens a page from the review queue, **Open next draft**, and the Dashboard's page lists in a new tab |

Change any of them in **Settings → Hotkeys** (search "Nicrosil"). Nicrosil also adds a large **The Coppermind** button above the files in the file list (it opens the Dashboard), two **ribbon** buttons (branching arrows for the relations panel and a check badge for the review queue; the wiki map has a Dashboard card instead), and a **status-bar counter** showing how many pages are verified (for example, `12/60 verified`). **Log a schema change** has no default hotkey. The file list's toolbar also has an **eye button** that shows or hides folders whose names start with an underscore (`_templates`, `_changelogs`, and so on). They are hidden every time Obsidian opens, and showing them lasts only until Obsidian closes.

## Settings
In **Settings → Nicrosil**:
- **Open the next draft after verifying or rejecting** (on by default)
- **Play an animation when I verify a page** (on by default): the check, sparks, and page lift described in [[#A review session]]. It is skipped if the computer is set to reduce motion.
- **Close the extra sidebar panels on startup** (on by default): closes Backlinks, Outgoing links, Tags, All properties and Outline each time Obsidian starts, so they stop coming back. They can still be opened from the command palette.
- **Open pages in Reading view:** "Verified pages only" (the default), "Every page", or "Off". When a page is opened from a link, the file list, search or the Dashboard, it opens in Reading view instead of editing. If I switch a page to editing myself, it stays that way until that tab opens a different page. "Every page" also covers drafts, but a new empty note always opens ready to type.
- **Days between health checks** (14 by default): how long the Dashboard's health check card counts before it calls the check overdue.
- **Queue order:** clean pages first (default), flagged pages first, by page type, or A to Z. The same menu is at the top of the sidebar.

## What it will not do
- **It never verifies on its own.** Every change starts with my click or keypress.
- **It does not commit to git.**
- **It will not verify a source card with a blank `reliability` rating.** Ratings are always item by item.[^1]
- **It does not touch verified pages.** If a verified page's content changes, it goes back to `draft` and needs checking again.
- **It cannot undo a verify or a resolved flag.** To undo a verify, set `status: draft` by hand, change the index line back, and add a correction to the log (past log entries are never rewritten). To undo a resolved flag, restore the callout from git (the last commit still has it) before verifying.
- **Skips last only until Obsidian restarts.**

## Troubleshooting
- **No buttons or sidebar:** the plugin is off, or the page is outside the folders above.
- **No Resolve button on a callout:** switch to Reading view, or use the sidebar card or `Alt+F`.
- **Resolved flags waiting to be logged:** they are stored in the plugin's `data.json`, which git syncs. If I resolve flags on one computer, push before verifying that page on the other.
- **"It wasn't in _index.md":** the page's entry is missing or renamed. Fix its line in [[_index|index]] by hand.
- **Properties look reformatted after verifying:** Obsidian rewrites a page's properties when a plugin edits them. The content is the same.
- **Merge conflict in `_index.md` or `_log.md`:** two computers verified pages before syncing. Pull before a review session and push after.
- **A hotkey does nothing after an update:** switch Nicrosil off and on again, then check **Settings → Hotkeys**.

## Keeping this guide current
This guide describes what the plugin does today. Whenever Nicrosil is updated:
1. Change the version number near the top of the page and in the plugin's `manifest.json`.
2. Update the table in [[#What Nicrosil does]], the matching section, and the hotkey table if anything was added, removed, or renamed.
3. Add a line at the top of [[Nicrosil Changelog]].
4. The change makes this page a changed page, so it goes back to `draft` until I verify it.[^1]
5. Log it as a `tool` entry ([[SCHEMA - Changes#Nicrosil and other tools]]).

Keep the body of this guide to what each part does. Details of how something looks (corners, fonts, colors, animations) go only in [[Nicrosil Changelog]].

These steps apply to **every** change to a file in the plugin's folder, even a one-line style tweak. Asking for the change is asking for the steps, and they are done in the same edit without being asked.

### Changelog
The changelog of every version is [[Nicrosil Changelog]] (in `_changelogs/`), newest first. Read it only to add a line or to look up when something changed.

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
[^2]: [[SCHEMA - Review|Schema: Review]], rule 8
[^3]: [[SCHEMA - Writing Pages#Typed links|Schema: Typed links]]
[^4]: [[SCHEMA - Changes#Changing the rules|Schema: Changing the rules]]
[^5]: [[SCHEMA - Index and Log#One file per month|Schema: One file per month]]
