---
type: log
---
# Log

A dated, append-only record of every ingest, query, health check, verification, and schema change, and what I approved, revised, or rejected. Newest entries are at the bottom. Format and rules: [[SCHEMA#11. Index and log]].

---

### [2026-11-10] setup | Vault skeleton and schema v0.1

- **Think:** I set the design decisions: Obsidian vault in a local folder with git; Claude desktop app as the agent; scope limited to SAIL, Intro to Intelligence, and Freedom's Foundations 1 (Fall 2026); pages written as a short prose opening plus bullets; Coppermind colors and theme for the look, but plain names for everything else so any reader can follow it.
- **Calculate:** Claude (claude-opus-5-5) created the folder structure, [[SCHEMA]] v0.1, [[Dashboard]], [[index]], this log, [[Review Queue.base|Review Queue]], one template per page type in `_templates/`, the agent pointer files (`CLAUDE.md`, `AGENTS.md`), `.gitignore`, a [[My Worldview]] skeleton (headings only), and a draft guide, [[Setting Up Git for the Coppermind]].
- **Verify:** pending
  - [[SCHEMA]]: to review section by section; it is my rulebook, so I edit it into my own words
  - [[Setting Up Git for the Coppermind]]: to verify after I follow it
- **Commit:** `setup: Coppermind skeleton, schema v0.1`

### [2026-11-11] ingest | SAIL Class Notes, 8/27/26–10/29/26

- **Think:** I gave Claude my full SAIL notes and asked for as many pages as the notes support, to build a foundation: concepts, frameworks, case studies, and terms. Skip tests and assignment logistics, but keep the philosophy behind projects like the portfolio. Don't create pages needlessly. Flag anything incomplete or needing attention. I asked for the drafts directly, so the separate plan-approval step (Schema §10, step 2) was skipped for this ingest.
- **Calculate:** Claude (claude-opus-5-5) copied the notes unchanged into `Sources/Class Notes` as [[SAIL Class Notes (Fall 2026)]], drafted [[SRC - SAIL Class Notes (Fall 2026)]] (proposed rating B-2), and drafted 50 pages: 9 frameworks, 26 concepts, 2 case studies, 12 glossary terms, and 1 person. Every claim cites the notes by class date. Flags on the pages:
  - **Whose view? (4):** [[Three-Ps Risk Framework]] (Christian biases), [[Intelligence vs. Consciousness]] (AI will never be conscious), [[AI Alignment]] ("the user" decides), [[Centaur Analyst]] (engineer and design or be replaced).
  - **Accuracy checks (7):** [[Liar's Dividend]] definition, [[Intelligence vs. Consciousness]] (Turing attribution), [[Deep Learning]] (reinforcement learning and ImageNet), [[Transformer]] ("database" and "140 billion pieces of data"), [[Cognitive Debt]] ("permanently"), [[Hallucination]] (word-meaning explanation), [[LMSYS Chatbot Arena]] (method and name).
  - **Gaps in my notes (8 pages):** [[ODNI AI Ethics Framework]] (principles missing), [[Imago Dei]] (three aspects undescribed), [[Analysis of Competing Hypotheses]] (stages 4–5), [[Think-Calculate-Verify Loop]] (steps undefined), [[Prompt Engineering]] (ORTCOW only an acronym), [[Machine Learning]] (supervised learning tasks), [[AI in Warfighting]] (Adversarial Vectors empty), [[Intelligence-to-Action Convergence Matrix]] (blank cells), plus the empty "Trust but Verify Exercise" heading (9/15) and sessions 11/3, 11/5, and 11/10 with no notes.
  - **Left out on purpose:** assignment logistics, the specifics of HW2, the grading note, and the line "The internet is stupid."
- **Verify:** pending. Item by item.
- **Commit:** `ingest: SAIL notes 8/27–10/29 — 50 drafts + source card, pending review`

### [2026-11-11] setup | Verify and Reject buttons

- **Think:** I wanted a button on each wiki page that does the logistics of verifying a draft, so reviewing is easier. Verifying still means I checked the page; the button only does the bookkeeping.
- **Calculate:** Claude (claude-sonnet-5-5) wrote a small local plugin, Coppermind Review (`.obsidian/plugins/coppermind-review/`), with a Verify button and a Reject button on every page in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`. Verify sets `status` and `verified_on`, updates [[index]], and appends to this log; it warns about open flag callouts and blocks source cards with no reliability rating. Reject requires a reason, logs it, removes the index entry, and deletes the page. Neither button commits to git. Drafted the guide [[Verifying Pages with the Review Buttons]]. Also added one sentence to [[SCHEMA#7. Draft vs. verified|Schema §7]] (items 3 and 6) saying the buttons count as me marking a page verified or rejecting it.
  - Tested on copies of the real [[index]] and this log (text changes only). Not yet tried inside Obsidian.
- **Verify:** pending
  - [[Verifying Pages with the Review Buttons]]: to verify after I follow it
  - Plugin: to try on one page and check that the page, [[index]], and this log all change correctly
  - [[SCHEMA]]: the §7 wording is mine to approve or rewrite
- **Commit:** `setup: Verify and Reject buttons (Coppermind Review plugin)`

### [2026-11-11] verify | Agentic AI

- **Verify:**
  - Approved: [[Agentic AI]]
- **Commit:** `verify: Agentic AI`

### [2026-11-11] setup | Review queue, flag resolving, hotkeys, and Home dashboard

- **Think:** The Verify button worked, but reviewing still meant going back to a long list after every page. I asked for: verify-and-next with a skip option, a review sidebar that stays open, a Resolve button on flags, hotkeys and a status-bar counter, and a dashboard on Home. I asked to be told which design choices need my input.
- **Calculate:** Claude (claude-opus-5-5) updated the Coppermind Review plugin to v0.2:
  - **Verify and next:** after Verify or Reject, the next draft in the queue opens (setting, on by default). **Skip** moves a draft to the end of the queue until Obsidian restarts.
  - **Review queue sidebar:** progress bar, a card for the current page with its flags and Verify / Skip / Reject buttons, every draft with flag badges, a queue-order menu (default: clean pages first), and a collapsed list of verified pages.
  - **Resolve flags:** a Resolve button on accuracy-check, gap, question, and warning callouts (Reading view), in the sidebar card, and on `Alt+F`. It asks what I decided, removes the callout, and saves the decision; the decision is written into this log when I verify or reject the page.
  - **Hotkeys and status bar:** `Alt+V` verify, `Alt+R` reject, `Alt+S` skip, `Alt+N` next, `Alt+F` resolve, `Alt+Q` queue, `Ctrl+Enter` to confirm; "X/Y verified" in the status bar opens the queue.
  - **Home dashboard:** a live `coppermind-dashboard` block added to [[Dashboard]] under "Review progress": progress, a table by page type, open flags by kind with links, and drafts older than 14 days ([[SCHEMA#7. Draft vs. verified|Schema §7]], item 7).
  - Rewrote [[Verifying Pages with the Review Buttons]] to cover all of it.
  - Tested outside Obsidian against copies of the SAIL drafts, [[index]], and this log (flag parsing and removal on every draft, queue order, skip, verify, reject, and log entries). Not yet tried inside Obsidian.
- **Verify:** pending
  - Plugin v0.2: to try a short review session and check the page, [[index]], and this log after each action
  - [[Verifying Pages with the Review Buttons]]: to verify after I follow it
  - [[Dashboard]]: whether I want the dashboard there
- **Commit:** `setup: review queue, flag resolving, hotkeys, Home dashboard (Coppermind Review v0.2)`

### [2026-11-11] verify | Architecture of Worldview

- **Verify:**
  - Approved: [[Architecture of Worldview]]
- **Commit:** `verify: Architecture of Worldview`

### [2026-11-11] verify | Setting Up Git for the Coppermind

- **Verify:**
  - Approved: [[Setting Up Git for the Coppermind]]
  - Flags I resolved before approving (2):
    - Warning (Unsourced background — verify or remove) — This is correct
    - Warning (Unsourced background — verify or remove) — This is correct
- **Commit:** `verify: Setting Up Git for the Coppermind`

### [2026-11-11] setup | Sidebar-only review controls

- **Think:** The Verify and Reject icons at the top of each page are redundant now that the review sidebar does the same job. I want to review from the sidebar only.
- **Calculate:** Claude (claude-sonnet-5-5) removed the page-header Verify and Reject icons from the Coppermind Review plugin, and their styles. Verify, Skip, and Reject are now in the sidebar card and on the hotkeys (`Alt+V`, `Alt+S`, `Alt+R`). Updated [[Verifying Pages with the Review Buttons]] to match. Nothing else changed. Re-ran the outside-Obsidian tests; they still pass.
- **Verify:** pending. To check that no icons show on a page after reloading the plugin.
- **Commit:** `setup: remove page-header review buttons, sidebar only`

### [2026-11-11] setup | Dashboard page and home button

- **Think:** I open the front page every time I open the wiki, so it should look good and help me work. I asked for the changes below, to rename Home to Dashboard, and for a logo button that always takes me back to it, using the feruchemical copper symbol.
- **Calculate:** Claude (claude-sonnet-5-5) rebuilt the front page and extended the Coppermind Review plugin to v0.3:
  - **Page:** a header with the logo, stat tiles (verified, drafts, open flags), the progress bar and Start reviewing, six navigation cards, a Recent activity list read from this log, and the old explanatory text folded under Reference. The title and properties are hidden on this page, and the Homepage plugin is set to open it in Reading view.
  - **Home button:** the copper logo in the left ribbon, and `Alt+H`. It switches to the Dashboard if it's already open.
  - **Rename:** when the plugin loads, it renames `Home.md` to `Dashboard.md` through Obsidian (which updates links) and points the Homepage plugin at the new name; it adds its own log entry when it does.
  - Saved the logo as `_attachments/coppermind-logo.svg` and updated [[SCHEMA]]'s folder tree and [[Verifying Pages with the Review Buttons]].
  - Left out of the Dashboard: the link to [[Review Queue.base|Review Queue]] (the sidebar replaces it; the file is still there).
  - **Restored this log:** two of my earlier writes to this file were reverted on disk, so the entries for [[Architecture of Worldview]], [[Setting Up Git for the Coppermind]], and the "Sidebar-only review controls" change were missing. I put them back from my copy.
  - Tested outside Obsidian (rename, ribbon, hotkey, all four page blocks, the activity list, link clicks) and previewed the layout in a browser at desktop and phone widths. Not yet seen in Obsidian itself, where the icons will be Obsidian's own.
- **Verify:** pending
  - Plugin v0.3 and the Dashboard: to reload the plugin, restart Obsidian once, and check the page, the ribbon button, and `Alt+H`
  - [[Verifying Pages with the Review Buttons]]: to verify after I follow it
- **Commit:** `setup: Dashboard page, logo home button, Home renamed (Coppermind Review v0.3)`

### [2026-11-11] setup | Renamed Home to Dashboard

- **Think:** The front page works as a dashboard, so it should be named like one.
- **Calculate:** The Coppermind Review plugin renamed `Home.md` to `Dashboard.md` through Obsidian, which updated the links that pointed to it, and pointed the startup-page plugin at the new name.
- **Verify:** pending. To check that the links to the Dashboard still work.
- **Commit:** `setup: rename Home to Dashboard`

### [2026-11-11] setup | Dashboard always in Reading view, properties hidden

- **Think:** The Dashboard's properties were still showing, and I want it in Reading view every time I open it or click into it, without changing how any other note opens.
- **Calculate:** Claude (claude-sonnet-5-5) updated the Coppermind Review plugin to v0.3.1:
  - **Properties:** the plugin now tags every pane showing the Dashboard, and the hiding rule applies to that tag as well as to the page's `cssclasses`, with `!important` so nothing overrides it. The Properties side pane is also emptied while the Dashboard is the active note.
  - **Reading view:** the plugin switches the Dashboard to Reading view whenever it is opened or I click into it (switching tabs counts). `Ctrl+E` still lets me edit; it holds until I leave and come back. Other notes are untouched, and the ribbon button and `Alt+H` open it in Reading view directly.
  - Updated [[Verifying Pages with the Review Buttons]]. Left the tagline I wrote on the [[Dashboard]] as it is.
  - Tested outside Obsidian: open, click-in, already-in-Reading-view, another note staying in editing, and cleanup on unload. Not yet seen in Obsidian itself.
- **Verify:** pending. To reload the plugin and check that the Dashboard shows no properties and opens in Reading view.
- **Commit:** `setup: Dashboard always in Reading view, properties hidden (Coppermind Review v0.3.1)`

### [2026-11-11] verify | Cascade of Unintended Consequences

- **Verify:**
  - Approved: [[Cascade of Unintended Consequences]]
- **Commit:** `verify: Cascade of Unintended Consequences`

### [2026-11-11] setup | Index split by status, folded log, properties hidden

- **Think:** The index and log should look like the Dashboard, with no properties at the top. The log was too long to scroll, so I wanted every entry folded by default with smaller headings. In the index, I wanted headings to split verified and draft pages instead of a status in brackets on every line.
- **Calculate:** Claude (claude-sonnet-5-5) made these changes:
  - **Properties:** hidden on [[index]] and [[log]] (and still on the [[Dashboard]]), by the Coppermind Review plugin (v0.4.0). The titles stay.
  - **Log:** entry headings changed from `##` to `###` (12 existing entries, a formatting change only; the text is untouched), and the plugin appends new entries as `###`. When the log opens in editing view, the plugin folds every entry heading and nothing else. It does this once each time the log is opened, so switching tabs doesn't re-fold what I opened. Reading view doesn't fold.
  - **Index:** under each type, pages are split under `### Verified` and `### Drafts` headings (shown only when that group has pages). The `(draft)` and `(verified)` endings are gone from the lines. The plugin moves a page from Drafts to Verified when I verify it, and keeps the counts and totals right.
  - Updated [[SCHEMA#11. Index and log|Schema §11]] to describe the new index and log formats, and [[Verifying Pages with the Review Buttons]].
  - Tested outside Obsidian on copies of the real index and log (reading the old format, writing the new one, verify and reject moves, empty groups, folding only the entry headings). Not yet seen in Obsidian itself.
- **Verify:** pending. To reload the plugin, open the log and the index, then verify one page to check that it moves to the Verified list.
- **Commit:** `setup: index split by status, folded log, properties hidden (Coppermind Review v0.4.0)`

### [2026-11-11] verify | Essay Types

- **Verify:**
  - Approved: [[Essay Types]]
- **Commit:** `verify: Essay Types`

### [2026-11-11] verify | Four Levels of Prompt Engineering

- **Verify:**
  - Approved: [[Four Levels of Prompt Engineering]]
- **Commit:** `verify: Four Levels of Prompt Engineering`

### [2026-11-11] schema | Summary callout at the top of every wiki page

- **Think:** The summary at the top of a wiki page needs to stand out. I picked option B from the mockups: a callout card labelled "Summary".
- **Calculate:** Claude (claude-sonnet-5-5) made these changes:
  - Wrapped the opening paragraph of all 52 pages in `Wiki/` in a `> [!summary]` callout. Nothing else on any page changed: I compared every page with its original, minus the wrapper, and checked that the flag callouts are unchanged. For glossary terms, the callout holds the definition and "Used in" stays below it.
  - 6 of those pages were already verified ([[Setting Up Git for the Coppermind]], [[Agentic AI]], [[Architecture of Worldview]], [[Cascade of Unintended Consequences]], [[Essay Types]], [[Four Levels of Prompt Engineering]]). This is a formatting change only, so they stay verified ([[SCHEMA#7. Draft vs. verified|Schema §7]], item 5).
  - Left alone: [[My Worldview]] (the agent never edits it), the source card, and the Analysis, Summary, Perspective and Source Card templates.
  - Styled the callout in the Coppermind theme (`coppermind.css`): a patina bar, a small uppercase "Summary" label, and slightly larger text.
  - Updated the Concept, Case Study, Framework, Guide, Person, Prompt, Workflow and Glossary Term templates, and [[SCHEMA#8. Page style|Schema §8]], so new pages start this way.
  - Tested outside Obsidian (reversal check on every page, flag parsing before and after). Not yet seen in Obsidian itself.
- **Verify:** pending. To open a few pages and check how the summary looks, and to decide whether the "Whose view is this?" callout (also patina) needs a different color.
- **Commit:** `schema: summary callout at the top of every wiki page`


### [2026-11-11] schema | Properties strip replaces the Properties block

- **Think:** The Properties block at the top of every wiki page took up space I no longer need, since verifying happens from the review sidebar. I picked option 2: hide the block and show a one-line strip instead.
- **Calculate:** Claude (claude-sonnet-5-5) updated the Coppermind Review plugin to v0.5.0:
  - On every note except the Dashboard, index, and log (which hide properties entirely), the native Properties block is hidden and a one-line strip sits in its place: type, status (DRAFT or VERIFIED), and the drafted or verified date.
  - Clicking the strip (or pressing Enter on it) expands the real Properties block in place. Each note opens collapsed.
  - The strip reads the page's frontmatter, so it updates when a page is verified. No page content or property values changed.
  - Tested outside Obsidian (jsdom and a screenshot of the styling). Not yet seen in Obsidian itself.
- **Verify:** pending. To reload the plugin, open a wiki page in Reading view and in edit view, and check that the strip shows, expands, and survives switching modes.
- **Commit:** `plugin: collapsible properties strip (v0.5.0)`

### [2026-11-11] verify | AI in Intelligence Production

- **Verify:**
  - Approved: [[AI in Intelligence Production]]
- **Commit:** `verify: AI in Intelligence Production`

### [2026-11-11] verify | AI-Enabled Surveillance

- **Verify:**
  - Approved: [[AI-Enabled Surveillance]]
- **Commit:** `verify: AI-Enabled Surveillance`

### [2026-11-11] verify | My Worldview

- **Verify:**
  - Approved: [[My Worldview]]
  - Revised: [[My Worldview]] — Added in my worldview. It could use some more detail, but it will suffice for the time being.
- **Commit:** `verify: My Worldview`

### [2026-11-11] setup | Ingest prompt

- **Think:** I asked for a prompt to use whenever I want a source dissected and turned into new wiki pages or additions to existing ones, and asked how much of that framework already exists in the Coppermind and how much belongs in the prompt.
- **Calculate:** Claude (claude-opus-5-5) drafted [[Dissect and Ingest a Source]] in `Wiki/Prompts/`. The prompt points to [[SCHEMA]] for everything the schema already covers and adds only: per-run inputs with defaults, a dissect-first step, a create / append / skip rule, how to handle sources that disagree and flags a new source may resolve, a default of proposing (not making) changes to verified pages, and the report format.
  - Proposed typed link: [[Dissect and Ingest a Source]] → applies_to → [[LLM Wiki]] — the prompt is a tool used on this wiki.
  - Suggested in chat, not made: schema additions for the create-or-append rule, the two flag callouts the review plugin reads but §6 doesn't list (`[!caution]` accuracy check, `[!todo]` gap), handling sources that disagree, and how to treat my own work as a source.
- **Verify:** pending. To try the prompt on the next source and verify the page after.
- **Commit:** `setup: ingest prompt (draft)`

### [2026-11-11] setup | Summary prompt

- **Think:** I gave Claude my summary prompt (the one the Summary template calls "SAIL IC Style Summaries") and asked whether it should change to work better with the Coppermind.
- **Calculate:** Claude (claude-opus-5-5) drafted [[Intelligence Community Style Summaries]] in `Wiki/Prompts/`, with my old name as an alias. Changes from my version:
  - Fixed "the text I paste between" (it now says the text below the prompt, or a file I attach or name) and dropped "that is provided in your context" for ICD 203, which isn't in the vault.
  - Added a locator after every claim. The length rule already excluded locators, but the prompt never asked for them.
  - The attribution line now asks for the exact model name or ID, and says "model not stated" instead of guessing.
  - Added an "In the Coppermind" section: Summary template, `Summary - <source title>` page name, properties instead of the attribution line, the schema's wikilink citation format, a `[!todo]` callout for transcript gaps, links to existing pages, and typed links proposed in chat.
  - Left the content rules, length budget, and the four sections as I wrote them, with small wording fixes.
  - Pointed [[Dissect and Ingest a Source]] at the new page for summaries of readings.
- **Verify:** pending. To compare with my original and verify after using it once.
- **Commit:** `setup: summary prompt (draft)`

### [2026-11-11] verify | Dissect and Ingest a Source

- **Verify:**
  - Approved: [[Dissect and Ingest a Source]]
- **Commit:** `verify: Dissect and Ingest a Source`

### [2026-11-11] verify | Intelligence Community Style Summaries

- **Verify:**
  - Approved: [[Intelligence Community Style Summaries]]
- **Commit:** `verify: Intelligence Community Style Summaries`

### [2026-11-11] schema | Guest lecturers named (v0.2)

- **Think:** During the Intro to Intelligence ingest plan, I decided guest lecturers should be named in the wiki, and asked for that rule to go in the schema or the prompt.
- **Calculate:** Claude (claude-opus-5-5) added it to [[SCHEMA#6. Citation and attribution|Schema §6]]: a fourth voice, "a guest lecturer," named by title and name with the course and date, and a rule that content under a guest-lecture heading belongs to the guest, with no contact details or other personal information and no People pages unless I ask. Version 0.1 → 0.2, with a changelog line.
- **Verify:** pending. The wording is mine to approve or rewrite.
- **Commit:** `schema: v0.2, guest lecturers named`

### [2026-11-11] ingest | Intro to Intelligence Class Notes, 8/25/26–11/10/26

- **Think:** I asked Claude to dissect and ingest my Intro to Intelligence notes using [[Dissect and Ingest a Source]] with its defaults (plan first, whole file, skip assignment logistics). I approved the plan with three changes: keep guest lecturers' names (now [[SCHEMA#6. Citation and attribution|Schema §6]]), skip the Four Tiers of AI Governance, and make the internship guide.
- **Calculate:** Claude (claude-opus-5-5) copied the notes unchanged into `Sources/Class Notes` as [[Intro to Intelligence Class Notes (Fall 2026)]], drafted [[SRC - Intro to Intelligence Class Notes (Fall 2026)]] (proposed rating B-2), and drafted 46 pages: 8 frameworks, 14 concepts, 2 case studies, 21 glossary terms, and 1 guide. Every claim cites the notes by class date.
  - **Added to existing drafts (6):** [[Capability vs. Reliability]] (11/10 video exercise takeaways), [[Human Decision Point]], [[Centaur Analyst]], and [[Hallucination]] (Detective Mennen on AI), [[Intelligence-to-Action Convergence Matrix]] (a "Sources disagree" flag on the intelligence cycle, and the TCPED link), and [[Analysis of Competing Hypotheses]] (example_of → [[Structured Analytic Technique]]).
  - **Proposed for verified pages, not made:** [[Architecture of Worldview]] (the 9/1 worldview questions for biographical sketches) and [[AI in Intelligence Production]] (a "Sources disagree" flag on whether INT names mean the product or the collection).
  - **Flags on the pages:** 13 accuracy checks, 13 gaps in my notes, 2 "Sources disagree," 1 "Whose view?" ([[Intelligence (National Security)]], 8/25), and 2 unsourced-background notes (Treverton on [[Puzzles and Mysteries]]; Kahneman on [[System 1 and System 2 Thinking]]).
  - **Typed links proposed:** 40, listed with reasons in chat.
  - **Left out on purpose:** listed on the source card under Ingest Progress.
- **Verify:** pending. Item by item.
- **Commit:** `ingest: Intro to Intelligence notes 8/25–11/10 — 46 drafts + source card, pending review`

### [2026-11-11] verify | Information Model

- **Verify:**
  - Approved: [[Information Model]]
- **Commit:** `verify: Information Model`

### [2026-11-11] verify | Tasking, Collection, Processing, Exploitation, and Dissemination

- **Verify:**
  - Approved: [[Tasking, Collection, Processing, Exploitation, and Dissemination]]
- **Commit:** `verify: Tasking, Collection, Processing, Exploitation, and Dissemination`

### [2026-11-11] verify | Artificial Intelligence

- **Verify:**
  - Approved: [[Artificial Intelligence]]
- **Commit:** `verify: Artificial Intelligence`

### [2026-11-11] verify | Automation Bias

- **Verify:**
  - Approved: [[Automation Bias]]
- **Commit:** `verify: Automation Bias`

### [2026-11-11] verify | Curiosity, Character, and Competence

- **Verify:**
  - Approved: [[Curiosity, Character, and Competence]]
- **Commit:** `verify: Curiosity, Character, and Competence`

### [2026-11-11] verify | Emergent Behavior

- **Verify:**
  - Approved: [[Emergent Behavior]]
- **Commit:** `verify: Emergent Behavior`

### [2026-11-11] verify | Human Decision Point

- **Verify:**
  - Approved: [[Human Decision Point]]
- **Commit:** `verify: Human Decision Point`

### [2026-11-11] verify | Human-Centered AI

- **Verify:**
  - Approved: [[Human-Centered AI]]
- **Commit:** `verify: Human-Centered AI`

### [2026-11-11] verify | Intelligence as Attentive Understanding

- **Verify:**
  - Approved: [[Intelligence as Attentive Understanding]]
- **Commit:** `verify: Intelligence as Attentive Understanding`

### [2026-11-11] verify | Intelligence Writing Style

- **Verify:**
  - Approved: [[Intelligence Writing Style]]
- **Commit:** `verify: Intelligence Writing Style`

### [2026-11-11] verify | Intelligence-Led Policing

- **Verify:**
  - Approved: [[Intelligence-Led Policing]]
- **Commit:** `verify: Intelligence-Led Policing`

### [2026-11-11] verify | LLM Wiki

- **Verify:**
  - Approved: [[LLM Wiki]]
- **Commit:** `verify: LLM Wiki`

### [2026-11-11] verify | Narrow AI

- **Verify:**
  - Approved: [[Narrow AI]]
- **Commit:** `verify: Narrow AI`

### [2026-11-11] verify | Pi-Shaped Person

- **Verify:**
  - Approved: [[Pi-Shaped Person]]
- **Commit:** `verify: Pi-Shaped Person`

### [2026-11-11] verify | Politicized Intelligence

- **Verify:**
  - Approved: [[Politicized Intelligence]]
- **Commit:** `verify: Politicized Intelligence`

### [2026-11-11] verify | Polygraph Examination

- **Verify:**
  - Approved: [[Polygraph Examination]]
- **Commit:** `verify: Polygraph Examination`

### [2026-11-11] verify | Security Classification

- **Verify:**
  - Approved: [[Security Classification]]
- **Commit:** `verify: Security Classification`

### [2026-11-11] verify | Time Compression Trap

- **Verify:**
  - Approved: [[Time Compression Trap]]
- **Commit:** `verify: Time Compression Trap`

### [2026-11-11] verify | Tokenization

- **Verify:**
  - Approved: [[Tokenization]]
- **Commit:** `verify: Tokenization`

### [2026-11-11] verify | Bing Sydney Incident (2023)

- **Verify:**
  - Approved: [[Bing Sydney Incident (2023)]]
- **Commit:** `verify: Bing Sydney Incident (2023)`

### [2026-11-11] verify | Mata v. Avianca (2023)

- **Verify:**
  - Approved: [[Mata v. Avianca (2023)]]
- **Commit:** `verify: Mata v. Avianca (2023)`

### [2026-11-11] verify | All-Source Intelligence

- **Verify:**
  - Approved: [[All-Source Intelligence]]
- **Commit:** `verify: All-Source Intelligence`

### [2026-11-11] verify | Analytic Confidence

- **Verify:**
  - Approved: [[Analytic Confidence]]
- **Commit:** `verify: Analytic Confidence`

### [2026-11-11] verify | Artificial General Intelligence

- **Verify:**
  - Approved: [[Artificial General Intelligence]]
- **Commit:** `verify: Artificial General Intelligence`

### [2026-11-11] verify | Attention Head

- **Verify:**
  - Approved: [[Attention Head]]
- **Commit:** `verify: Attention Head`

### [2026-11-11] verify | Bach Faucet

- **Verify:**
  - Approved: [[Bach Faucet]]
- **Commit:** `verify: Bach Faucet`
