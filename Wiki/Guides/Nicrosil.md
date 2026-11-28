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
drafted_by: Claude (claude-sonnet-5-5, claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-28
---
> [!summary]
> **Nicrosil** is the plugin that does the Coppermind's bookkeeping: the review loop for drafts, the [[_dashboard|Dashboard]], search, query mode, ingesting from Raw, keeping [[_index|index]] and log in step, the atlas and Lens, schema-change logging, and the Tinmind (my class notes). ==It does the bookkeeping, but the checking is still mine.==[^1]

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
My class notes in `The Tinmind/`, kept apart from the wiki. **The Tinmind** button (or `Alt+Shift+D`) switches mode; the review queue and Lens are off there.
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

## The Lens
`Alt+L`. Follows the open page and changes nothing. It shows the page's map (pages linking in on the left, out on the right; typed links colored, plain links dashed; **Enlarge** shows all), pages two steps away that aren't linked yet (worth checking, not auto-adding), and lists of outgoing and incoming links by type.[^3]

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

## Hotkeys and buttons
| Key | Action |
| --- | --- |
| `Alt+V` / `Alt+R` / `Alt+S` | Verify / Reject / Skip |
| `Alt+N` | Next draft |
| `Alt+F` | Resolve a flag |
| `Alt+Q` / `Alt+L` | Review queue / Lens |
| `Alt+T` | Transcription queue |
| `Alt+I` | Triage |
| `Alt+M` | Atlas |
| `Alt+D` | Dashboard |
| `Alt+Shift+D` | Switch Coppermind / Tinmind |
| `Alt+E` | Show the file list |
| `Ctrl+click` | Open in a new tab |

Change them in **Settings → Hotkeys**. The left sidebar's tab bar also has: mode switch, show/hide `_` files, review queue and Lens (or the transcription queue in Tinmind mode), and **Commit-and-sync** / **Pull** buttons that run Obsidian Git. The status bar counts verified pages.

## Settings
**Settings → Nicrosil:** open the next draft after verifying; verify animation; close extra sidebar panels and other tabs on startup; which pages open in Reading view; days between health checks (14); queue order; Claude Code path; photos folder; Python path; live usage meter.

## What it will not do
- Verify anything without my click.
- Let Claude write to the Tinmind, or move files in an ingest.
- Delete a scan except when I verify its transcription.
- Run git except when I click a git button.
- Verify a source card with no `reliability` rating.[^1]
- Undo a verify or a resolved flag. To undo a verify, set `status: draft` by hand, fix the index line, and log a correction; restore a resolved flag from git.
- Keep skips past a restart.

## Troubleshooting
- **No buttons or sidebar:** the plugin is off, the page is outside the review folders, or you're in Tinmind mode.
- **No Resolve button:** use Reading view, the sidebar card, or `Alt+F`.
- **Resolved flags lost between computers:** they wait in `data.json`; push before verifying on the other computer.
- **"It wasn't in _index.md":** fix the page's line in [[_index|index]] by hand.
- **Merge conflict in the index or log:** pull before reviewing, push after.
- **Hotkey dead after an update:** switch Nicrosil off and on.

## Keeping this guide current
Code lives in the plugin's `src/` parts and is built with `python build.py` (see `src/README.md`). For every change, follow [[SCHEMA - Changes#Nicrosil and other tools]]: one version bump, one changelog line and one `tool` log entry per session. Update this guide only when what Nicrosil does changes. Looks and history go in [[Nicrosil Changelog]], not here.

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
[^2]: [[SCHEMA - Review|Schema: Review]], rule 8
[^3]: [[SCHEMA - Writing Pages#Typed links|Schema: Typed links]]
[^4]: [[SCHEMA - Changes#Changing the rules|Schema: Changing the rules]]
[^5]: [[SCHEMA - Index and Log#One file per month|Schema: One file per month]]
