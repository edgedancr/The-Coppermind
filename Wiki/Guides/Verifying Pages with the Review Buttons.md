---
type: guide
status: draft
aliases: [Review Buttons, Review Queue Guide, Dashboard Guide]
courses: [SAIL]
sources: []
related: ["[[SCHEMA]]", "[[Setting Up Git for the Coppermind]]"]
drafted_by: Claude (claude-sonnet-5-5; review queue, flags, hotkeys and dashboard added by claude-opus-5-5; Dashboard page and home button by claude-sonnet-5-5)
drafted_on: 2026-11-11
verified_on: 
---
> [!summary]
> The Coppermind's review tools turn checking drafts into one steady loop: open the next draft, check it, resolve its flags, verify or reject it, and land on the next one. ==The tools do the bookkeeping, but the checking is still mine==, because a page only becomes verified when I decide it has been checked against its sources ([[SCHEMA#7. Draft vs. verified|Schema §7]]).

The tools come from a small plugin I keep in the vault, **Coppermind Review** (`.obsidian/plugins/coppermind-review/`). They work on pages in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/` that have `status: draft`.

## Turn it on (once per computer)
1. In Obsidian: **Settings → Community plugins**, click the refresh icon next to "Installed plugins," and switch on **Coppermind Review**. After an update, switch it off and on again (or restart Obsidian) to load the new version.
2. The plugin files are tracked in git, so a second computer gets them with a pull. Switch it on there too, since the on/off setting is local.

## The parts
- **Review queue (right sidebar).** Open it with `Alt+Q` or by clicking the "verified" counter in the bottom status bar. It shows:
  - a progress bar
  - a card for the page I'm on, with its flags and **Verify**, **Skip**, and **Reject** buttons
  - every draft, in review order, with flag badges: **A** accuracy check, **G** gap, **Q** question ("Whose view is this?"), **W** unsourced warning, **✓** no flags
  - a collapsed list of verified pages
- **Resolve buttons on flags.** Each flag callout gets a **Resolve** button in its title bar in Reading view. In editing view, use the sidebar card or `Alt+F`.
- **Dashboard.** The front page, [[Dashboard]], shows the review stats: verified, drafts, and open flags, with a progress bar and a **Start reviewing** button. Below that are the open flags by kind, a table by page type, and drafts older than 14 days.

## A review session
1. Pull first (see [[Setting Up Git for the Coppermind]]).
2. On [[Dashboard]], click **Start reviewing**, or press `Alt+N`.
3. Read the page and check it against the sources it cites.
4. **Resolve each flag.** If a claim needs correcting, edit the page text first. Then click **Resolve** and write what I decided. The callout is removed from the page, and my decision is saved and written into the log when I verify (or reject) the page.
5. **Decide:**
   - **Verify** (`Alt+V`): optionally note what I changed and why, then `Ctrl+Enter`. The page gets `status: verified` and `verified_on`, its line in [[index]] changes to `(verified)`, the totals update, and [[log]] gets an entry listing any flags I resolved. If flags are still open, I have to tick a box to verify anyway, and the log records them.
   - **Skip** (`Alt+S`): moves the page to the end of the queue for this session and opens the next one.
   - **Reject** (`Alt+R`): write the reason (required), then `Ctrl+Enter`. The reason is logged, the page is removed from the index, and the page is deleted ([[SCHEMA#7. Draft vs. verified|Schema §7]]). The dialog lists pages that link to it, so I can fix those links afterward.
6. After Verify or Reject, the next draft opens automatically. Turn this off with the checkbox in the sidebar or in the plugin's settings.
7. When finished, commit and push. A page is only "saved as final" once it is verified **and** committed.

## The Dashboard
[[Dashboard]] is the page the vault opens on. From top to bottom it has:
- **The header:** the Coppermind logo and name.
- **Review progress:** stat tiles, the progress bar, and **Start reviewing**.
- **Where to start:** six cards (Index, Review queue, My Worldview, Log, Schema, Guides).
- **Recent activity:** the last six log entries. Click one to open the page it names, or the log.
- **Reference:** folded sections on what the Coppermind is, how to read it, what it covers, and its six parts.

Each section is a block in the page's text (`coppermind-hero`, `coppermind-dashboard`, `coppermind-nav`, `coppermind-activity`), so a section can be moved or deleted by editing the note. The Dashboard always opens in Reading view, whether I open it from the ribbon, a link, a tab, or at startup, and every other note keeps the mode it was in. The Dashboard's own properties are hidden, and so is the Properties side pane while the Dashboard is the active note.

To edit the Dashboard, press `Ctrl+E` to switch to editing. It stays in editing until I click into the Dashboard again from another tab or note, which puts it back in Reading view.

**Getting back to it from anywhere:** click the copper logo in the left ribbon, or press `Alt+H`. If the Dashboard is already open in a tab, this switches to that tab; otherwise it opens in the current tab. The ribbon icon can be dragged to the top of the ribbon (right-click the ribbon to rearrange or hide icons).

## The index and the log
- **Index:** [[index]] splits each type into **Verified** and **Drafts**. When I verify a page, the plugin moves its line to Verified and updates the counts and totals. When I reject one, its line is removed.
- **Log:** [[log]] opens with every entry folded, newest at the bottom. Click an entry's heading (or its arrow) to open it. This happens when the log opens in editing view, once per opening, so switching tabs doesn't re-fold it. It needs Obsidian's **Fold heading** option (Settings → Editor) to be on.
- **Properties:** both pages hide their properties, like the Dashboard.

## Hotkeys
| Key | Action |
|---|---|
| `Alt+V` | Verify this page |
| `Alt+R` | Reject this draft |
| `Alt+S` | Skip this draft for now |
| `Alt+N` | Open the next draft |
| `Alt+F` | Resolve a flag on this page |
| `Alt+Q` | Open the review queue |
| `Alt+H` | Go to the Dashboard |
| `Ctrl+Enter` | Confirm a dialog |

Change any of them in **Settings → Hotkeys** (search "Coppermind").

## Settings
In **Settings → Coppermind Review**:
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
