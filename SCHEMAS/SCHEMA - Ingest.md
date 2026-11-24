---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-23
verified_on: 2026-11-23
---
How a source becomes wiki pages. Read this with [[SCHEMA - Writing Pages]], which covers naming, properties, links, citations, attribution, and style.

## The ingest operation

Every operation follows the think-calculate-verify loop, then a commit. Revisions go back to the calculate step. Rejections are logged, not saved.

1. **Think (me).** I name the source and the part of it to ingest, usually one class session (one date heading) or one topic, and say what matters in it. Usually I do this by pasting [[Dissect and Ingest a Source]], which gives the run's five inputs and their defaults: SOURCE, SCOPE, WHAT MATTERS, MODE, and VERIFIED PAGES.
2. **Plan (agent).** Before drafting, the agent proposes a short plan: the pages it will create or update, and the source card if one is needed. I approve or adjust the plan. This keeps drafts focused and saves effort. If MODE is "plan first" (the default), the agent does steps 1–3 of [[#Dissect and draft]], gives me sections A–C of [[#The report]] as the plan, and stops until I approve it. If MODE is "draft directly," it skips this step.
3. **Calculate (agent).** The agent works through [[#Dissect and draft]], drafting the pages with `status: draft`, then gives me [[#The report]].
4. **Verify (me).** For each page, I approve it, ask for revisions (back to step 3), or reject it. I check the links the same way.
5. **Commit.** The agent deletes the batch from `Ingestion/Triage.md` if it came from there and is now fully ingested ([[#Triage]]), and adds the log entry (operation: `ingest`). I commit.

## Dissect and draft

### 1. Orient
- If I attached the source and it isn't in `Sources/` yet, copy it unchanged into the right subfolder and tell me where it went. A source I name in `Ingestion/Raw/` is handled the same way; leave the original in `Raw/` and tell me I can delete it ([[#Raw sources]]).
- Read the source's card in `Sources/Source Cards/` if it has one (check Ingest Progress so nothing is ingested twice), and every existing page this source is likely to touch.
- Find those pages by searching file names and `aliases:` lines in `Wiki/`, not just exact names. Read `_index.md` whole only if you can't search.

### 2. Dissect
Before thinking about pages, break the in-scope part of the source into its ideas. For each one, note:
- the claim, in a sentence
- its location (date heading, page number, section, or timestamp)
- its voice: the author, the course and date, a quoted person, or unclear (unclear becomes a "Whose view is this?" flag; never guess)
- its kind: term, concept, framework, case, person, or procedure
- its relations: any link the source itself states between this idea and another idea, in the source or already in the wiki ("X is a kind of Y", "X is part of Y", "X is an example of Y", "X causes Y", "X counters Y", "X is used on Y", "X is evidence for or against Y", "X was developed by Y"), with its location. These become the proposed typed links.

If the source is my own work (`Sources/My Work/`), its arguments are my voice. Don't turn them into wiki claims; list them in the report as material for Perspectives, which I write. Facts my paper takes from another source can be used only if that source is in the vault.

If the source is a video transcript, skip the timestamps when dissecting and summarizing it.

### 3. Decide: append, create, or skip
Check each idea against the wiki:
- **Append** when an existing page already covers the same idea, under any title or alias. Put the new material under the heading of that page's template where it belongs, cite it to the new source with footnotes that continue the page's numbering, and add the new source card to the page's `sources`. A new name for an existing idea becomes an alias, not a new page.
- **Create** when the idea is distinct and the source gives enough to write the page properly: a definition for a glossary term; roughly 150 words of sourced content for a concept, framework, or case study. Anything thinner becomes a glossary term or a bullet on its parent page. One idea per page; if an append would push a page past about 500 words, propose a split instead.
- **Skip** anything out of scope, anything the page already says with nothing new, and anything WHAT MATTERS rules out. List skips in the report.
- For a reading or course document, also draft one summary page following the "In the Coppermind" rules of [[Intelligence Community Style Summaries]]. Not for class notes.

### 4. Reconcile with what's there
- If the new source fills an open flag on an existing page (a gap, an accuracy check, or unsourced background), add the sourced content but leave the callout in place, with one added line: `> Possibly resolved by [[SRC - ...]], <location>.` I resolve it with the Resolve button.
- If the new source disagrees with an existing page, overwrite neither claim. Keep both, each attributed and cited, and add:
  ```
  > [!caution] Sources disagree
  > <claim A> (source A) vs. <claim B> (source B)
  ```
- Typed links ([[SCHEMA - Writing Pages#Typed links]]): for each relation from step 2, pick the type in the order of the table and use `related` only when none fits. Put the link on the page the sentence starts with, which may be an existing page, not the page you are drafting. Never store the reverse as well. If that page is verified, propose the link as a before/after instead of putting `related` on the other page. Links that only mean "see also" stay in the page text, not in `related`. If a "Sources disagree" callout sets a claim on one page against another page, propose `contradicts` between them.
- Use only these four flag callouts, so the review queue sees them: `[!question] Whose view is this?`, `[!warning] Unsourced background — verify or remove`, `[!caution] Accuracy check` (or "Sources disagree"), `[!todo] Gap in my notes` (or "Gap in the source").
- Verified pages: by default (VERIFIED PAGES: "propose changes only"), don't edit them. Put the exact proposed change in the report as a before/after. If VERIFIED PAGES is "edit", make the change and follow [[SCHEMA - Review#Changing a verified page]]. The one exception is the link backfill in step 5, which edits verified pages directly in every mode.

### 5. Backfill links to the new pages
Pages written before a page existed name it without linking to it, and nothing else goes back for them. So once the new pages are drafted, link to them from the pages that already mention them.
- **What to search for:** the title and every alias of each page this ingest created, and each alias this ingest added to an existing page.
- **Where:** every page in `Wiki/`, as whole words, plurals included. Skip pages that already link to the target, footnote definitions, source files, and, as always, `Ingestion/Raw/` and `The Tinmind/`.
- **What to change:** on each page found, link the first mention only, following [[SCHEMA - Writing Pages#Linking rules]] rule 6: wrap the words already there in a link, with display text if they differ from the title, and change no other wording. If the words name something else ("The Wall Street Journal" is not [[The Wall (FBI)]]), leave them.
- **Links only.** A backfill adds plain links in the text and nothing else: no new content, no typed links, no new `sources`. A relation that deserves a typed link goes in report section D as a proposal, under the usual rules.
- **Drafts:** edit them directly. A draft under re-review (one with `verified_on`) gets a `changes_since_verified` line like a verified page.
- **Verified pages: edit them directly too, whatever VERIFIED PAGES says.** I've asked for this standing edit because I can re-verify a backfilled page quickly when I know exactly what changed. In the same edit, set `status: draft`, keep `verified_on`, and add one `changes_since_verified` line per page per ingest naming each link added and the words linked, ending with a link to the section when it is in one place ([[SCHEMA - Review#Changing a verified page]]), for example: `"2026-11-24: linked first mention of 'LLMs' to [[Large Language Model]] (backfill, Module 6 ingest) [[#Key Points]]"`.
- **In "plan first" mode,** the plan doesn't list the backfill; it runs during the calculate step and is reported in section C.

### 6. Check the topic list
`_topics.md` lists the wiki's major topics for the atlas in [[Nicrosil]]: each is a `##` heading, one line on what it covers, and a list of its anchor pages (the pages at its center). Nicrosil places every other page from its links, so pages get no topic property and the agent never sorts pages into topics.
- **Read `_topics.md`** once the pages are drafted. It is short.
- **Add a topic** only when this ingest starts a subject that no topic covers and that is big enough to stand alone: about five or more new pages on it, or a new course. Give it a name, a one-line description, and two to six anchors.
- **Add an anchor** to an existing topic when a page this ingest created is now central to it and the topic has fewer than six.
- **Propose, don't make,** any rename, merge, split, or removal of a topic, and any removal of an anchor. These go in the report for me to decide.
- **Most ingests change nothing here.** Say so in the report.

### 7. Source card
Create the card if it doesn't exist, or update it: propose an Admiralty rating with a one-sentence reason (never set the final rating), and add this ingest under Ingest Progress with today's date and what was skipped.

## The report

- **A.** Defaults used, and any reading of my request you had to choose
- **B.** Created: `[[Page]] (type)` — one line each
- **C.** Appended: `[[Page]]` — what was added; verified pages as a proposed before/after. Then the backfilled links from step 5, one line per page: `[[Page]]`: linked "words" → `[[New page]]`, with pages that were verified marked as now back to `draft`. Last, the topic list from step 6: what was added to `_topics.md` and any change proposed, or "topic list: no change"
- **D.** Proposed typed links, grouped by type: `[[A]] → relation → [[B]]` — a one-line reason each, pointing to where the source says it. Each `related` link also says which type came closest and why it doesn't fit. If more than about a third of the links are `related`, re-check them before reporting.
- **E.** Flags: whose view, unsourced background, accuracy checks, sources disagree, gaps, and flags this source may resolve
- **F.** Skipped on purpose, and Perspectives material from my own work

## Raw sources

`Ingestion/Raw/` is where I put sources I've collected but haven't put through ingestion. It is not one of the six parts and not a wiki page folder: nothing in it has a source card, a page, or an index entry, and a source isn't part of the wiki until it is ingested.

- **The agent doesn't look at it.** No task reads, lists, searches, quotes, counts, or mentions what is in `Raw/`: not queries, health checks, triage, or index work. Searches over the vault leave it out.
- **Only I open it up.** The one exception is a source I name in `Raw/` and ask the agent to ingest. The agent reads that file only and ingests it as usual: Orient copies it unchanged into `Sources/`, and every step after is the same. It leaves the original in `Raw/` (the agent never moves or deletes my files) and tells me I can delete it.
- **Triage is mine too.** The agent adds sources to Triage only when I hand them over or name them in chat. It never finds them by looking in `Raw/`.
- **The health check skips it.** The script leaves `Ingestion/Raw/` out, so nothing in it is checked or flagged.

## Triage

`Ingestion/Triage.md` lists sources I've collected but not yet ingested, grouped into the batches we plan to ingest them in, with each batch's status. It is not one of the six parts and not a wiki page: it has no `status`, is not in `_index.md`, and I don't verify it. **The agent maintains it, and it must stay current.**

- **It is a plan, not a record.** The log records what was done, and each source card's Ingest Progress records what has been ingested from that source. The queue only says what is still waiting and in what order.
- **Read only the batch you are working on**, plus the status key at the top.
- **When I hand over a set of sources to triage,** the agent adds them to the queue in batches, and lists what it recommends skipping and why. I decide the order and the skips.
- **At the end of every ingest that takes a batch from the queue,** the agent deletes the batch once it is fully ingested, and notes that in the operation's log entry. If part of it is deferred to a later batch, the agent keeps only that part, marks it `[~]` (partly ingested), and links its source card.
- **Whether the pages are verified doesn't matter to Triage.** There are no done marks and no Done section: a batch is either still on the page or gone.
- **I can reorder, split, or drop batches at any time;** the agent changes the order only when I ask.
- I check the queue during each health check.
