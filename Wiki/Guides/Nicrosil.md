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
drafted_by: Claude (claude-sonnet-5-5; review queue, flags, hotkeys and dashboard added by claude-opus-5-5; Dashboard page and home button by claude-sonnet-5-5; rewritten as the full Nicrosil guide by claude-sonnet-5-5; quiet Dashboard by claude-opus-5-5; relations map glow, Reading view on open, health check card, clickable change lines, the restyled map and hierarchy and the hover-preview strip by claude-sonnet-5-5; SCHEMAS folder and monthly log by claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-19
---
> [!summary]
> **Nicrosil** is the plugin that does the Coppermind's bookkeeping. It runs the review loop for draft pages, draws the [[Dashboard]], searches the wiki, keeps [[index]] and [[log]] in step, tidies how pages look, and records schema changes. ==It does the bookkeeping, but the checking is still mine==, because a page only becomes verified when I decide it has been checked against its sources.[^1]

This guide describes Nicrosil **v2.6.3**. Its folder is `.obsidian/plugins/nicrosil/`. When the plugin changes, this guide changes with it (see [[#Keeping this guide current]]).

## What Nicrosil does
| Area | What it does | Where to read more |
| --- | --- | --- |
| **Review** | A queue of drafts, flag callouts with **Resolve** buttons, and **Verify**, **Skip**, and **Reject** | [[#Review tools]] |
| **Relations** | A side panel for the open page: a map and grouped lists of its typed links, outgoing and incoming | [[#The relations panel]] |
| **Wiki map** | Two views of the whole wiki's typed links: a collapsible hierarchy tree and a zoomable map | [[#The wiki map]] |
| **Dashboard** | The front page: progress, search box, six navigation cards, recent activity | [[#The Dashboard]] |
| **Search** | A live search box over wiki pages, source cards, and perspectives | [[#Search]] |
| **Index and log** | Checks [[index]] and writes to [[log]] after each verify or reject, folds the log's entries, and moves each finished month to `Logs/` | [[#The index and the log]] |
| **Page tidying** | Replaces each page's properties block with a one-line strip | [[#The properties strip]] |
| **Schema changes** | A button that adds a line to [[Schema Changelog]] and updates the version in [[SCHEMA]] | [[#Logging a schema change]] |
| **Shortcuts** | Hotkeys, a Coppermind button above the file list, and a status-bar counter | [[#Hotkeys and buttons]] |

## Turn it on (once per computer)
1. In Obsidian: **Settings → Community plugins**, click the refresh icon next to "Installed plugins," and switch on **Nicrosil**.
2. After an update, switch it off and on again (or restart Obsidian) to load the new version.
3. The plugin files are tracked in git, so a second computer gets them with a pull. Switch it on there too, since the on/off setting is local.

## Review tools
Review tools work on pages in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, the rule files in `SCHEMAS/`, and root-level files, that have a `status` property. The rule files appear in the queue under **Schemas**.

- **Review queue (right sidebar).** Open it with `Alt+Q`, the ribbon button, or by clicking the "verified" counter in the status bar. It shows:
  - a progress bar
  - a card for the page I'm on, with its flags and **Verify**, **Skip**, and **Reject** buttons
  - every draft, in review order, with flag badges: **A** accuracy check, **G** gap, **Q** question ("Whose view is this?"), **W** unsourced warning, **✓** no flags
  - a **Changed since verified** list at the top, with an **R** badge on each page: verified pages the AI changed at my request. Their card shows the lines from the page's `changes_since_verified` property, so I check only what changed. A line that ends with a link to a section (`[[#Heading]]`) is clickable, on the card and on the Dashboard, and goes to that spot in the page; `Ctrl+click` opens the page in a new tab
  - a collapsed list of verified pages
- **Resolve buttons on flags.** Each flag callout gets a **Resolve** button in its title bar in Reading view. In editing view, use the sidebar card or `Alt+F`.

### A review session
1. Pull first (see [[Setting Up Git for the Coppermind]]).
2. On [[Dashboard]], click **Start reviewing**, or press `Alt+N`.
3. Read the page and check it against the sources it cites.
4. **Resolve each flag.** If a claim needs correcting, edit the page text first. Then click **Resolve** and write what I decided. The callout is removed from the page, and my decision is saved and written into the log when I verify (or reject) the page.
5. **Decide:**
   - **Verify** (`Alt+V`): optionally note what I changed and why, then `Ctrl+Enter`. The page gets `status: verified` and `verified_on`, and [[log]] gets an entry listing any flags I resolved. Then a check stamps the page, a burst of copper and teal sparks plays, the page lifts up and fades out, and the next one rises in from the bottom with a small "Next: … · N left" note (see [[#Settings]] to turn it off). If flags are still open, I have to tick a box to verify anyway, and the log records them.
     - If the page has a `changes_since_verified` property, Verify deletes it, and the log keeps the record.[^2]
   - **Skip** (`Alt+S`): moves the page to the end of the queue for this session and opens the next one.
   - **Reject** (`Alt+R`): write the reason (required), then `Ctrl+Enter`. The reason is logged, the page is removed from the index, and the page is deleted.[^1] The dialog lists pages that link to it, so I can fix those links afterward.
6. After Verify or Reject, the next draft opens automatically. Turn this off with the checkbox in the sidebar or in the plugin's settings.
7. When finished, commit and push. A page is only "saved as final" once it is verified **and** committed.

## The Dashboard
[[Dashboard]] is the page the vault opens on. Each section is a block in the page's text, so a section can be moved or deleted by editing the note. From top to bottom it has:
- **Header** (`coppermind-hero`): the Coppermind logo, name, and tagline, left-aligned with no panel around them (the name is set in Almendra SC, a copper-to-teal gradient with a soft glow), and the search box (see [[#Search]]) right under them.
- **Six link cards** (`coppermind-nav`), in two columns: small, sharp-cornered cards with a copper edge, each a name and a one-line description, with no icons. They are Index, Review queue, Wiki map, Log, Schema, and Guides. A click opens the page in the current tab. ==`Ctrl+click` (or middle-click) opens it in a new tab.== The Review queue and Wiki map cards open a sidebar or their own tab instead, so they have no new-tab version.
- **Review progress** (`coppermind-dashboard`): a card with one line of stats (pages verified, with the share, drafts, and open flags), a glowing copper-to-teal bar showing how much is verified, and a small line counting the open flags by kind and the drafts older than 14 days. Under it is a bar for each page type showing its verified and draft pages. A **Changed since verified** section lists each re-review with its change lines. Below that are folded lists naming the pages with open flags, by kind, and the drafts older than 14 days. To start a review session from the Dashboard, use the Review queue card.
- **Health check card:** a small card inside the review progress section showing how long it has been since the last health check. A bar fills over the 14 days between checks. It is teal while there is time, amber for the last two days, and red with a gentle pulse once the check is overdue (or if none has been saved yet). It reads the dates from the report names in `Health Checks/`, so it updates itself when a new report is saved, and clicking it opens the latest report.
- **Recent activity** (`coppermind-activity`): the last six log entries. Early in a month, when [[log]] has fewer than six, the rest come from last month's file in `Logs/`. Click one to open the page it names, or the log.
- **Reference:** folded sections on what the Coppermind is, how to read it, what it covers, and its six parts. These are ordinary text in the note.

**Reading and editing.** The Dashboard always opens in Reading view, whether I open it from the ribbon, a link, a tab, or at startup, and every other note keeps the mode it was in. Its properties are hidden, and so is the Properties side pane while the Dashboard is the active note. To edit it, press `Ctrl+E`. It stays in editing until I click into the Dashboard again from another tab or note, which puts it back in Reading view.

**Getting back to it from anywhere:** click the large **The Coppermind** button at the top of the file list, or press `Alt+D`. If the Dashboard is already open in a tab, this switches to that tab; otherwise it opens in the current tab. `Ctrl+click` or middle-click on the button always opens it in a new tab, even if the Dashboard is already open in another one. The button has the copper logo and the name (in Almendra SC) on a copper-to-teal gradient, with a gradient border and sharp corners (a 2px radius). It glows on hover, and it has a soft inner glow while the Dashboard is the open page.

**Look and motion.** Every note, the Dashboard included, sits on the vault's brown blended into a copper glow at the top left and a teal glow at the top right. The background is a single CSS variable, `--cm-bg-gradient`, defined in the plugin's `styles.css`; change it there to change every page at once. Both sidebars carry a fainter version of the same glow (copper at the top of the left one, teal at the top of the right one), so they match the page between them. In the file list, the open file has a copper highlight that fades toward teal, and its name shades from teal to pale copper. All of this only applies while Nicrosil is enabled, and the sidebar and file-list colors only in dark mode.

The Dashboard keeps its design quiet on purpose: color only where it means something (copper for links and actions, teal for verified), small serif capitals for the section headings, small corners, and no glow boxes or floating sparks. When it opens, the page-type bars fill; that plays only when the page opens, not every time it refreshes, and not at all if the computer is set to reduce motion.

## Search
The search box on the [[Dashboard]] shows suggestion cards as I type, over wiki pages, source cards, and perspectives. It does not search the raw class notes or readings, and it only reads: it never changes a page.
- **Open a result:** click it, or use the arrow keys and `Enter`. `Ctrl+Enter` opens it in a new tab.
- **Every match is reachable.** The list shows the best matches first, and more cards appear as I scroll it (or press the down arrow past the last card). A line at the bottom of the list says how many pages matched, for example "20 of 143 matches · scroll for more", and stays in view while scrolling.
- **Each card shows** the page's title, its type and status, any alias that matched, and a snippet of the text that matched. Snippets and review cards leave out footnote markers and the Footnotes section, so citations don't crowd the text.
- **Esc** closes the list, and pressing it again clears the box.
- It stays up to date on its own as pages are created, edited, renamed, or deleted.

## The index and the log
- **Index:** [[index]] lists every page under its type, in alphabetical order, with a count per type and a total at the top. It does not show whether a page is verified; the review queue and the Dashboard do that. When I verify a page, Nicrosil only checks that the page is listed. When I reject one, its line is removed and the counts are updated.
- **Log:** Nicrosil appends the entry for each verify and reject to [[log]] (newest at the bottom, never rewriting old entries). The log opens with every entry folded, so it reads as a short list. Click an entry's heading (or its arrow) to open it. This happens when the log opens in editing view, once per opening, so switching tabs doesn't re-fold it. It needs Obsidian's **Fold heading** option (Settings → Editor) to be on.
- **One log file per month:** [[log]] holds the current month. The first time Obsidian opens in a new month (and before Nicrosil adds an entry in a new month), it moves every earlier month's entries, word for word and in order, to `Logs/Log YYYY-MM.md`, creating the folder and the file if needed, and shows a notice. It writes the month file before trimming the log, so a failure never loses entries. Month files open folded, like the log.[^5]
- **Properties:** [[index]], [[log]], the month files, and the Dashboard hide their properties entirely.

## The relations panel
Open it with `Alt+L` or the branching-arrows button in the ribbon. It follows whichever page is open and shows how that page connects to the rest of the wiki through the typed links in its properties:[^3]
- **A map.** The page sits in the middle. Pages that point at it are on the left; pages it points at are on the right. Each arrow is colored by relationship type, and the legend under the map names the colors. Some types are also dashed (`related` is dashed, `contradicts` is dotted), so color is never the only cue. A solid teal outline means the other page is verified, a copper outline a draft, and a dashed grey outline no status. The map glows and moves: small dots flow along each arrow in its direction, the center page has a slow pulsing halo, and pointing at a page lights up its arrows and dims the rest (the motion stops if your system asks for reduced motion). Click a page to open it, or `Ctrl+click` for a new tab. The map shows up to ten pages on each side; the lists below show them all.
- **Two lists.** "This page…" groups the outgoing links by type ("Is part of", "Supports", and so on). "Pointing at this page…" groups the incoming links ("Parts of this", "Examples of this", "Supported by"). Incoming links are worked out from the other pages' properties, since each relationship is stored only once.[^3]
- **Not shown:** plain links in the page text. They are "see also" links, not relationships.

## The wiki map
Open it with `Alt+M` or the Wiki map card on the Dashboard. It opens in its own tab, on the Map view, and has two views, chosen at the top. Both read only the typed links in the properties,[^3] never the plain links in the text, and neither changes a file. Both share the look of the [[#The relations panel]]: a soft copper glow behind it, with glowing cards and lines in the hierarchy (the map's dots and arrows stay plain).
- **Hierarchy.** A branching diagram built from `type_of`, `part_of`, and `example_of`. Each page is a rounded card, and a curved line, colored by the relationship, joins it to the page it is a kind of, a part of, or an example of, so Artificial Intelligence → Machine Learning → Deep Learning reads left to right as a branch. The cards fade in from left to right when the tree opens, and a small light runs along each branch from the page above to the page below. A card has a dot in its page-type color, a teal ring if verified or a dashed copper ring if draft, and the number of pages below it. Click a card to open the page (`Ctrl+click` for a new tab). The circle at its right edge opens or closes the branch. Pointing at a card lights up the path to its top page and everything below it. The box filters the diagram by page name and outlines the matches, **Expand all** and **Collapse all** do what they say, and **Show examples** adds or removes the `example_of` pages. Drag the background to pan. A page that is part of two things appears under both. Wiki pages with none of these links are listed at the bottom, in a folded list.
- **Map.** Every page that has a typed link is a dot, and every typed link is an arrow from the page that states it to the page it points at.
  - **Colors:** arrows are curved and colored by relationship type, with `related` dashed and `contradicts` dotted. Dots are colored by page type. A teal ring means verified, and a dashed copper ring means draft. Bigger dots have more links.
  - **Move around:** scroll to zoom, drag the background to pan, and click **Reset view** to start over. Names show for the busiest pages, for a focused page and its neighbors, and for every page once zoomed in.
  - **Motion:** when the map opens, the dots drift out from the middle and settle in about two seconds. Drag a dot to move it; the dots it links to follow, and everything settles again when you let go. Pointing at a dot lights up its links and neighbors and fades the rest. Clicking a dot, or choosing a neighbor in the panel, glides the view to it. A pulse of light travels along each arrow in the direction of the link; the **Flow** button turns this off, and it stays off between visits. If your computer is set to reduce motion, or **Ambient animations** is off, the map skips the drifting and the pulses, and the hierarchy skips its fade-in and flowing lights.
  - **Filters:** click a relationship name at the top to hide or show that type. The menus filter by status, page type, and course. The box finds a page by name; press `Enter` to zoom to it.
  - **Focus:** click a dot to dim everything except that page and its neighbors. The panel under the map lists how it connects, and its neighbors are clickable. `Ctrl+click` a dot to open the page.
  - **Not shown:** pages with no typed links. The note under the map says how many there are.
  - **Layout:** the layout is worked out from the links, so the same wiki settles into the same map each time it opens, and it moves when links are added. A dot you dragged keeps its place while the tab stays open, and goes back to its settled spot the next time the map is reopened.

## The properties strip
On every other note, Nicrosil hides the full Properties block and puts a one-line strip in its place, showing the page's **type**, **status**, and a date (`drafted` or `verified`). Click the strip to open the real Properties block. Each note starts collapsed again when I open it. The pop-up preview that appears when I point at a link shows the same strip, so a preview looks like the page itself.

## Ambience
Small animations make the vault feel alive. None of them change how anything works.
- **Notes:** a verified page's title has a teal glow with a slow shimmer; a draft's title has a dim copper ember. The properties strip glows once right after I verify. Flag callouts (`caution`, `todo`, `question`, `warning`) breathe softly in their flag color. Internal links glow when hovered. Opening a page plays a short, quiet fade-in. The background drifts very slowly.
- **Wiki map and hierarchy:** verified dots give off small sparks. Pages with `changes_since_verified` have an amber outline on the map and in the hierarchy. Clicking a dot sends a ring out from it and pings its neighbors in turn.
- **Dashboard:** the newest activity row pulses once.
- **Review queue:** the title is a copper-to-teal gradient, the larger, sharp-edged progress bar has a steady glow like the Dashboard's progress bar, rows slide to their new places when the order changes, and new flag badges pop in.
- **Smaller touches:** search results fade in one after another, notices have a teal edge, and the status-bar verified count glows when it goes up.

Turn them all off with **Ambient animations** in the settings. They are also off if the computer is set to reduce motion.

## Logging a schema change
Every change to the rules (`AGENTS.md` or a file in `SCHEMAS/`) needs a line in [[Schema Changelog]].[^4] Nicrosil adds it for me:
1. On any page in `SCHEMAS/`, click the pen button in the page header, or run **Log a schema change** from the command palette.
2. Enter the new version number in the form `4.2` and a description of what changed. The version must be newer than the current one and not already in the changelog.
3. Nicrosil adds the dated line at the end of the changelog and updates its `updated` property, then sets `version` and `updated` on [[SCHEMA]], which holds the rulebook's version.

It does not touch `status`, `verified_on`, or [[log]]. After a schema change, each changed rule file goes back to `draft` with a change note,[^1] and the log entry is still mine to add.

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
| `Ctrl+click` or middle-click | Open a Dashboard card or the Coppermind button in a new tab (search results: `Ctrl+click` or `Ctrl+Enter`) |

Change any of them in **Settings → Hotkeys** (search "Nicrosil"). Beyond the keys, Nicrosil adds a large **The Coppermind** button above the files in the file list (it opens the Dashboard), and two **ribbon** buttons (branching arrows for the relations panel and a check badge for the review queue; the wiki map has a Dashboard card instead) and a **status-bar counter** showing how many pages are verified (for example, `12/60 verified`). **Log a schema change** has no default hotkey.

## Settings
In **Settings → Nicrosil**:
- **Open the next draft after verifying or rejecting** (on by default)
- **Play an animation when I verify a page** (on by default): the check, sparks, and page lift described in [[#A review session]]. It is skipped if the computer is set to reduce motion.
- **Close the extra sidebar panels on startup** (on by default): closes Backlinks, Outgoing links, Tags, All properties and Outline each time Obsidian starts, so they stop coming back. They can still be opened from the command palette.
- **Ambient animations** (on by default): the glows, sparkles and fades described in [[#Ambience]].
- **Open pages in Reading view:** "Verified pages only" (the default), "Every page", or "Off". When a page is opened from a link, the file list, search or the Dashboard, it opens in Reading view instead of editing. If I switch a page to editing myself, it stays that way until that tab opens a different page. "Every page" also covers drafts, but a new empty note always opens ready to type.
- **Days between health checks** (14 by default): how long the Dashboard's health check card counts before it calls the check overdue.
- **Queue order:** clean pages first (default), flagged pages first, by page type, or A to Z. The same menu is at the top of the sidebar.

## What it will not do
- **It never verifies on its own.** Every change starts with my click or keypress.
- **It does not commit to git.**
- **It will not verify a source card with a blank `reliability` rating.** Ratings are always item by item.[^1]
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
1. Change the version number near the top of the page and in the plugin's `manifest.json`.
2. Update the table in [[#What Nicrosil does]], the matching section, and the hotkey table if anything was added, removed, or renamed.
3. Add a line to the version history below.
4. The change makes this page a changed page, so it goes back to `draft` until I verify it.[^1]
5. Log it as a `tool` entry ([[SCHEMA - Changes#Nicrosil and other tools]]).

These steps apply to **every** change to a file in the plugin's folder, even a one-line style tweak. Asking for the change is asking for the steps, and they are done in the same edit without being asked.

### Version history
- **2.6.3:** The Dashboard name's copper-to-teal gradient now spans the width of the name itself instead of the whole header, so the teal end shows and it matches the file-list button.
- **2.6.2:** The Coppermind name on the Dashboard and on the file-list button is set in **Almendra SC**. The Dashboard name has a copper-to-teal gradient and a soft glow. The font loads from Google Fonts, so it needs an internet connection; offline it falls back to Georgia.
- **2.6.1:** The **The Coppermind** button at the top of the file list has a copper-to-teal gradient fill and border, the name fades from copper to teal, and its corners are sharp (2px). Hover glows in both colors.
- **2.6.0:** The rules moved to `SCHEMAS/`: the rule files are reviewable (grouped as **Schemas** in the queue), the pen button shows on every page there, and **Log a schema change** writes to [[Schema Changelog]] and keeps the version in [[SCHEMA]]. The log is split by month: finished months move to `Logs/Log YYYY-MM.md`, month files open folded, and Recent activity fills from last month early in a month. Log entries with the new `tool` operation get a hammer icon. Once, at startup, the old root `SCHEMA.md` (left as a "moved" stub) goes to the trash.
- **2.5.3:** The Dashboard button moved from the left ribbon to a large **The Coppermind** button, with the logo, at the top of the file list. Click opens the Dashboard; `Ctrl+click` or middle-click opens it in a new tab. The ribbon logo is gone.
- **2.5.2:** The pop-up preview of a linked page shows the one-line properties strip (type, status, date) instead of the full Properties block, like an open page. Click the strip in the preview to open the real block.
- **2.5.1:** The wiki map is plain again: no halos around the dots, no breathing, no fade-in, and no dotted backdrop, only a soft copper edge and glow on the frame. The dropdown menus keep their arrows. The hierarchy keeps its glow.
- **2.5.0:** The wiki map and the hierarchy look like the relations panel: a dotted backdrop with a copper glow, glowing borders and buttons, lit dots with halos, cards with teal or copper glow, glowing branches with lights flowing from parent to child, and a fade-in when they open. The info card and the buttons, menus and relationship chips are restyled to match.
- **2.4.9:** A line in a page's **Changed since verified** list is a link when it ends with `[[#Heading]]`: clicking it, on the review card or the Dashboard, goes to that section of the page. A line with no location still opens the page.
- **2.4.8:** The Dashboard has a health check card: a bar that fills over the 14 days since the last report in `Health Checks/`, amber when the next check is due within two days and red when it is overdue. New setting **Days between health checks**.
- **2.4.7:** New setting **Open pages in Reading view**: verified pages (or every page, or none) open in Reading view instead of editing, and stay in editing if I switch them there myself.
- **2.4.6:** The relations map is livelier: glowing arrows with dots flowing along them, a pulsing center page, a dotted copper-lit backdrop, nodes that fade in, and a hover highlight that lights a page's arrows and dims the rest.
- **2.4.5:** Search snippets and review-card summaries leave out footnote markers (`[^1]`) and the Footnotes section, after citations moved to footnotes (Schema §6).
- **2.4.4:** The verify animation's check is a copper-to-teal gradient, with no orb behind it.
- **2.4.3:** Made some small visual improvements to the review queue panel.
- **2.4.2:** The Dashboard always uses the quiet style; the Classic/Quiet setting is gone. The open file in the file list has a soft copper-to-teal highlight and a teal-to-pale-copper name instead of flat orange and teal.
- **2.4.1:** The Dashboard's six links are small, sharp-cornered cards again, and Review progress is a card with larger text and a glowing copper-to-teal bar.
- **2.4.0:** A quieter Dashboard: plain header without a panel or sparks, links without icons or per-card colors, the stat tiles and ring replaced by one line of stats, and small serif capitals for headings. Also since 2.3.0: the verify animation lifts the page up and the next one rises from the bottom, both sidebars share the background glow, and the open file's name in the file list is teal.
- **2.3.0:** Removed the 14-day activity chart from the Dashboard; the Verification card is now full width with a larger ring and larger text.
- **2.2.1:** Fixed the verify animation: the page slides away and the next one slides in again (the background drift had been overriding it). Removed the sparks from opening a page, leaving only a short fade.
- **2.2.0:** Review queue: the progress bar is sharper with a steady glow (no pulse or sheen), and the draft list is a set of cards with a colored edge (amber for flags, rust for changed since verified, teal for the current page) and the page type under each name.
- **2.1.0:** The page-open transition is sparks only (no light sweep), with more sparks that rise higher. A new setting closes the Backlinks, Outgoing links, Tags, All properties and Outline panels at startup.
- **2.0.0:** Page-open transition (copper light sweep and rising sparks), a larger glowing progress bar and a gradient title in the review queue. Removed the Dashboard spotlight, the amber pulse on the map, and the relations-panel line animation. Fixed two animation names that clashed with the Dashboard hero.
- **1.6.0:** Ambience: title auras, breathing flag callouts, map sparks, ripples and amber pulses, relations lines that draw in, Dashboard spotlight and milestone bursts, queue and search touches, page fade-ins, and a slow background drift. A new setting turns them off.
- **1.5.0:** Verifying a page plays an animation: a check stamp and spark burst, the page slides away, and the next page slides in. A new setting turns it off.
- **1.4.1:** Dashboard fixes: the verification ring's filled part is drawn again, shading from copper to green; the three stat tiles glow only when pointed at; and the six navigation cards have a colored outline all the way around.
- **1.4.0:** The copper-and-teal gradient background now applies to every note, not just the Dashboard.
- **1.3.2:** The Dashboard background is a stronger copper-to-teal gradient over the brown, defined as the reusable variable `--cm-bg-gradient`.
- **1.3.1:** The Dashboard goes back to the vault's brown background, so moving to another page is less jarring. Cards and the header are re-tinted brown to match.
- **1.3.0:** Dashboard redesign: copper and teal accents (first with a slate background, replaced in 1.3.1), gradient-edged cards, colored navigation icons, a header with drifting sparks and the search box inside it, a verification ring, a 14-day activity chart, per-type bars, and entrance animations. The separate search block was removed from the Dashboard page.
- **1.2.1:** The wiki map always opens on the Map tab instead of remembering the last tab used.
- **1.2.0:** The Hierarchy view is now a branching diagram of cards joined by curved colored lines, with open/close circles, hover highlighting of a page's path, and drag to pan. Fixed the filter box, which did not update the diagram as you typed.
- **1.1.0:** The wiki map is alive: dots settle with physics and can be dragged, pointing at a dot highlights its links, the view glides to a focused page, arrows are curved with a soft glow on verified pages, and a pulse flows along each link (with a **Flow** switch).
- **1.0.1:** The wiki map's relationship chips no longer show a count after each name.
- **1.0.0:** The wiki map moved from the left ribbon to a Dashboard card, replacing the My Worldview card (`Alt+M` still works).
- **0.10.0:** New wiki map (`Alt+M`) with a hierarchy tree and a zoomable map of all typed links.
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

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
[^2]: [[SCHEMA - Review|Schema: Review]], rule 8
[^3]: [[SCHEMA - Writing Pages#Typed links|Schema: Typed links]]
[^4]: [[SCHEMA - Changes#Changing the rules|Schema: Changing the rules]]
[^5]: [[SCHEMA - Index and Log#One file per month|Schema: One file per month]]
