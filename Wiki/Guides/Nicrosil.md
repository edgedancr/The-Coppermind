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
drafted_by: Claude (claude-sonnet-5-5; review queue, flags, hotkeys and dashboard added by claude-opus-5-5; Dashboard page and home button by claude-sonnet-5-5; rewritten as the full Nicrosil guide by claude-sonnet-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> **Nicrosil** is the plugin that does the Coppermind's bookkeeping. It runs the review loop for draft pages, draws the [[Dashboard]], searches the wiki, keeps [[index]] and [[log]] in step, tidies how pages look, and records schema changes. ==It does the bookkeeping, but the checking is still mine==, because a page only becomes verified when I decide it has been checked against its sources ([[SCHEMA#7. Draft vs. verified|Schema §7]]).

This guide describes Nicrosil **v0.9.2**. Its folder is `.obsidian/plugins/nicrosil/`. When the plugin changes, this guide changes with it (see [[#Keeping this guide current]]).

## What Nicrosil does
| Area | What it does | Where to read more |
| --- | --- | --- |
| **Review** | A queue of drafts, flag callouts with **Resolve** buttons, and **Verify**, **Skip**, and **Reject** | [[#Review tools]] |
| **Relations** | A side panel for the open page: a map and grouped lists of its typed links, outgoing and incoming | [[#The relations panel]] |
| **Dashboard** | The front page: progress, search box, six navigation cards, recent activity | [[#The Dashboard]] |
| **Search** | A live search box over wiki pages, source cards, and perspectives | [[#Search]] |
| **Index and log** | Checks [[index]] and writes to [[log]] after each verify or reject, and folds the log's entries | [[#The index and the log]] |
| **Page tidying** | Replaces each page's properties block with a one-line strip | [[#The properties strip]] |
| **Schema changes** | A button that adds a line to the Changelog in [[SCHEMA]] | [[#Logging a schema change]] |
| **Shortcuts** | Hotkeys, a ribbon logo, and a status-bar counter | [[#Hotkeys and buttons]] |

## Turn it on (once per computer)
1. In Obsidian: **Settings → Community plugins**, click the refresh icon next to "Installed plugins," and switch on **Nicrosil**.
2. After an update, switch it off and on again (or restart Obsidian) to load the new version.
3. The plugin files are tracked in git, so a second computer gets them with a pull. Switch it on there too, since the on/off setting is local.

## Review tools
Review tools work on pages in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, plus root-level files like `SCHEMA.md`, that have a `status` property.

- **Review queue (right sidebar).** Open it with `Alt+Q`, the ribbon button, or by clicking the "verified" counter in the status bar. It shows:
  - a progress bar
  - a card for the page I'm on, with its flags and **Verify**, **Skip**, and **Reject** buttons
  - every draft, in review order, with flag badges: **A** accuracy check, **G** gap, **Q** question ("Whose view is this?"), **W** unsourced warning, **✓** no flags
  - a **Changed since verified** list at the top, with an **R** badge on each page: verified pages the AI changed at my request. Their card shows the lines from the page's `changes_since_verified` property, so I check only what changed
  - a collapsed list of verified pages
- **Resolve buttons on flags.** Each flag callout gets a **Resolve** button in its title bar in Reading view. In editing view, use the sidebar card or `Alt+F`.

### A review session
1. Pull first (see [[Setting Up Git for the Coppermind]]).
2. On [[Dashboard]], click **Start reviewing**, or press `Alt+N`.
3. Read the page and check it against the sources it cites.
4. **Resolve each flag.** If a claim needs correcting, edit the page text first. Then click **Resolve** and write what I decided. The callout is removed from the page, and my decision is saved and written into the log when I verify (or reject) the page.
5. **Decide:**
   - **Verify** (`Alt+V`): optionally note what I changed and why, then `Ctrl+Enter`. The page gets `status: verified` and `verified_on`, and [[log]] gets an entry listing any flags I resolved. If flags are still open, I have to tick a box to verify anyway, and the log records them.
     - If the page has a `changes_since_verified` property, Verify deletes it, and the log keeps the record ([[SCHEMA#7. Draft vs. verified|Schema §7]], rule 8).
   - **Skip** (`Alt+S`): moves the page to the end of the queue for this session and opens the next one.
   - **Reject** (`Alt+R`): write the reason (required), then `Ctrl+Enter`. The reason is logged, the page is removed from the index, and the page is deleted ([[SCHEMA#7. Draft vs. verified|Schema §7]]). The dialog lists pages that link to it, so I can fix those links afterward.
6. After Verify or Reject, the next draft opens automatically. Turn this off with the checkbox in the sidebar or in the plugin's settings.
7. When finished, commit and push. A page is only "saved as final" once it is verified **and** committed.

## The Dashboard
[[Dashboard]] is the page the vault opens on. Each section is a block in the page's text, so a section can be moved or deleted by editing the note. From top to bottom it has:
- **Header** (`coppermind-hero`): the Coppermind logo, name, and tagline.
- **Six navigation cards** (`coppermind-nav`): Index, Review queue, My Worldview, Log, Schema, and Guides. A click opens the page in the current tab. ==`Ctrl+click` (or middle-click) opens it in a new tab.== The Review queue card opens the sidebar instead, so it has no new-tab version.
- **Search box** (`coppermind-search`): see [[#Search]].
- **Review progress** (`coppermind-dashboard`): stat tiles for verified, drafts, and open flags, a progress bar, and **Start reviewing**. A **Changed since verified** section lists each re-review with its change lines. Below that are the open flags by kind, a table by page type, and drafts older than 14 days.
- **Recent activity** (`coppermind-activity`): the last six log entries. Click one to open the page it names, or the log.
- **Reference:** folded sections on what the Coppermind is, how to read it, what it covers, and its six parts. These are ordinary text in the note.

**Reading and editing.** The Dashboard always opens in Reading view, whether I open it from the ribbon, a link, a tab, or at startup, and every other note keeps the mode it was in. Its properties are hidden, and so is the Properties side pane while the Dashboard is the active note. To edit it, press `Ctrl+E`. It stays in editing until I click into the Dashboard again from another tab or note, which puts it back in Reading view.

**Getting back to it from anywhere:** click the copper logo in the left ribbon, or press `Alt+D`. If the Dashboard is already open in a tab, this switches to that tab; otherwise it opens in the current tab. `Ctrl+click` or middle-click on the logo always opens it in a new tab, even if the Dashboard is already open in another one. The ribbon icon can be dragged to the top of the ribbon (right-click the ribbon to rearrange or hide icons).

## Search
The search box on the [[Dashboard]] shows suggestion cards as I type, over wiki pages, source cards, and perspectives. It does not search the raw class notes or readings, and it only reads: it never changes a page.
- **Open a result:** click it, or use the arrow keys and `Enter`. `Ctrl+Enter` opens it in a new tab.
- **Every match is reachable.** The list shows the best matches first, and more cards appear as I scroll it (or press the down arrow past the last card). A line at the bottom of the list says how many pages matched, for example "20 of 143 matches · scroll for more", and stays in view while scrolling.
- **Each card shows** the page's title, its type and status, any alias that matched, and a snippet of the text that matched.
- **Esc** closes the list, and pressing it again clears the box.
- It stays up to date on its own as pages are created, edited, renamed, or deleted.

## The index and the log
- **Index:** [[index]] lists every page under its type, in alphabetical order, with a count per type and a total at the top. It does not show whether a page is verified; the review queue and the Dashboard do that. When I verify a page, Nicrosil only checks that the page is listed. When I reject one, its line is removed and the counts are updated.
- **Log:** Nicrosil appends the entry for each verify and reject to [[log]] (newest at the bottom, never rewriting old entries). The log opens with every entry folded, so it reads as a short list. Click an entry's heading (or its arrow) to open it. This happens when the log opens in editing view, once per opening, so switching tabs doesn't re-fold it. It needs Obsidian's **Fold heading** option (Settings → Editor) to be on.
- **Properties:** [[index]], [[log]], and the Dashboard hide their properties entirely.

## The relations panel
Open it with `Alt+L` or the branching-arrows button in the ribbon. It follows whichever page is open and shows how that page connects to the rest of the wiki through the typed links in its properties ([[SCHEMA#5. Linking rules and ontology|Schema §5]]):
- **A map.** The page sits in the middle. Pages that point at it are on the left; pages it points at are on the right. Each arrow is colored by relationship type, and the legend under the map names the colors. Some types are also dashed (`related` is dashed, `contradicts` is dotted), so color is never the only cue. A solid teal outline means the other page is verified, a copper outline a draft, and a dashed grey outline no status. Click a page to open it, or `Ctrl+click` for a new tab. The map shows up to ten pages on each side; the lists below show them all.
- **Two lists.** "This page…" groups the outgoing links by type ("Is part of", "Supports", and so on). "Pointing at this page…" groups the incoming links ("Parts of this", "Examples of this", "Supported by"). Incoming links are worked out from the other pages' properties, since each relationship is stored only once ([[SCHEMA#5. Linking rules and ontology|Schema §5]]).
- **Not shown:** plain links in the page text. They are "see also" links, not relationships.

## The properties strip
On every other note, Nicrosil hides the full Properties block and puts a one-line strip in its place, showing the page's **type**, **status**, and a date (`drafted` or `verified`). Click the strip to open the real Properties block. Each note starts collapsed again when I open it.

## Logging a schema change
Every change to [[SCHEMA]] needs a line in its Changelog ([[SCHEMA#14. Changing this schema|Schema §14]]). Nicrosil adds it for me:
1. On the SCHEMA page, click the pen button in the page header, or run **Log a schema change** from the command palette.
2. Enter the new version number in the form `4.2` and a description of what changed. The version must be newer than the latest one and not already in the changelog.
3. Nicrosil adds the dated line at the end of the Changelog and updates the `version` and `updated` properties.

It does not touch `status`, `verified_on`, or [[log]]. After a schema change, the schema goes back to `draft` ([[SCHEMA#7. Draft vs. verified|Schema §7]]), and the log entry is still mine to add.

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
| `Alt+D` | Go to the Dashboard |
| `Ctrl+Enter` | Confirm a dialog |
| `Ctrl+click` or middle-click | Open a Dashboard card or the ribbon logo in a new tab (search results: `Ctrl+click` or `Ctrl+Enter`) |

Change any of them in **Settings → Hotkeys** (search "Nicrosil"). Beyond the keys, Nicrosil adds two **ribbon** buttons (the copper logo for the Dashboard, and a check badge for the review queue) and a **status-bar counter** showing how many pages are verified (for example, `12/60 verified`). **Log a schema change** has no default hotkey.

## Settings
In **Settings → Nicrosil**:
- **Open the next draft after verifying or rejecting** (on by default)
- **Queue order:** clean pages first (default), flagged pages first, by page type, or A to Z. The same menu is at the top of the sidebar.

## What it will not do
- **It never verifies on its own.** Every change starts with my click or keypress.
- **It does not commit to git.**
- **It will not verify a source card with a blank `reliability` rating.** Ratings are always item by item ([[SCHEMA#7. Draft vs. verified|Schema §7]]).
- **It does not touch verified pages.** If a verified page's content changes, it goes back to `draft` and needs checking again.
- **It cannot undo a verify or a resolved flag.** To undo a verify, set `status: draft` by hand, change the index line back, and add a correction to the log (the log is append-only). To undo a resolved flag, restore the callout from git (the last commit still has it) before verifying.
- **Skips last only until Obsidian restarts.**

## Troubleshooting
- **No buttons or sidebar:** the plugin is off, or the page is outside the folders above.
- **No Resolve button on a callout:** switch to Reading view, or use the sidebar card or `Alt+F`.
- **Resolved flags waiting to be logged:** they are stored in the plugin's `data.json`, which git syncs. If I resolve flags on one computer, push before verifying that page on the other.
- **"It wasn't in index.md":** the page's entry is missing or renamed. Fix its line in [[index]] by hand.
- **Properties look reformatted after verifying:** Obsidian rewrites a page's properties when a plugin edits them. The content is the same.
- **Merge conflict in `index.md` or `log.md`:** two computers verified pages before syncing. Pull before a review session and push after.
- **A hotkey does nothing after an update:** switch Nicrosil off and on again, then check **Settings → Hotkeys**.

## Keeping this guide current
This guide describes what the plugin does today. Whenever Nicrosil is updated:
1. Change the version number near the top of the page.
2. Update the table in [[#What Nicrosil does]], the matching section, and the hotkey table if anything was added, removed, or renamed.
3. Add a line to the version history below.
4. The change makes this page a changed page, so it goes back to `draft` until I verify it ([[SCHEMA#7. Draft vs. verified|Schema §7]]).

### Version history
- **0.9.2:** The Dashboard search box no longer stops at 8 results. It ranks every match and draws 20 cards at a time, loading more as the list is scrolled or the arrow keys go past the end, with a running count at the bottom.
- **0.9.1:** The Dashboard's "Changed since verified" section is always collapsed when the Dashboard opens or refreshes.
- **0.9.0:** New relations panel (`Alt+L`): a map and grouped lists of the open page's typed links, both outgoing and incoming.
- **0.8.11:** Verified pages the AI changed at my request carry a `changes_since_verified` note. Verify deletes it; the queue lists these pages first with an **R** badge; the review card and the Dashboard show the notes.
- **0.8.10:** Middle-clicking the Dashboard logo now opens exactly one new tab and leaves the current tab alone. Obsidian was sending the middle-click to the logo's click handler more than once, so the plugin now counts one middle-button press as one open.
- **0.8.9:** Fixed middle-click on the Dashboard logo also loading the Dashboard into the current tab. It now opens one new tab and leaves the current tab alone.
- **0.8.8:** Middle-click or Ctrl+click on the Dashboard logo now opens a new tab even when the Dashboard is already open; before, it just switched to the open tab.
- **0.8.7:** Middle-clicking the Dashboard logo in the ribbon opens the Dashboard in a new tab.
- **0.8.6:** The index no longer splits each type into Verified and Drafts. It is one alphabetical list per type with a single total, and verifying a page no longer changes the index. A page's status is shown by the review queue, the Dashboard, and the page's own properties strip.
- **0.8.5:** The Dashboard's six navigation cards open in a new tab on `Ctrl+click` or middle-click. The plugin's id and folder changed from `coppermind-review` to `nicrosil`. The guide became a guide to the whole plugin, not only the review buttons.
- **0.8.4 and earlier:** Review queue, flags, hotkeys, Dashboard blocks, search, the properties strip, log folding, and the schema-change button. See the dated entries in [[log]] for each step.
