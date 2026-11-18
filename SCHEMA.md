---
type: schema
version: 5.2
status: verified
owner: Harrison Nickles
updated: 2026-11-17
verified_on: 2026-11-17
---
# The Coppermind — Schema

This is the rulebook for the Coppermind, my personal LLM wiki (SAIL portfolio). Any AI agent working in this vault reads this file first and follows it. Where this file and an instruction in chat disagree, ask me before acting.

The Coppermind follows the SAIL version of the LLM-wiki pattern, not Karpathy's original: **I design, the AI drafts, I verify.** Nothing becomes part of the wiki as final until I have reviewed and approved it.

---

## 1. Purpose and scope

The Coppermind has three jobs, in priority order:

1. **A productivity tool for life.** It should help me in later courses, apprenticeships, and work.
2. **A showcase.** An employer or mentor should be able to open it and see what I know and how I think.
3. **A record of my developing perspective.** My own views sit next to outside sources and show how my thinking grows.

**In scope right now:**
- SAIL (INT323), Fall 2026
- Intro to Intelligence, Fall 2026
- Freedom's Foundations 1, Fall 2026
- Readings, course documents, and my own assignments from those three courses

**Out of scope until I say otherwise:** other courses, personal notes, anything about security clearance paperwork, and personal information about classmates or other private individuals. If a source mentions a classmate, refer to them by role ("a teammate"), not by name.

---

## 2. The six parts of the wiki

| Part         | Folder / file   | What it holds                                                                                          | Who writes it                            |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Sources      | `Sources/`      | My notes, assignments, readings, and scans in their original form, plus a source card for each         | I collect; the agent drafts source cards |
| Wiki pages   | `Wiki/`         | Concept, glossary, framework, case study, person, summary, prompt, workflow, guide, and analysis pages | The agent drafts; I verify               |
| Schema       | `SCHEMA.md`     | This rulebook                                                                                          | I direct                                 |
| Index        | `index.md`      | A map of every page                                                                                    | The agent maintains; I check             |
| Log          | `log.md`        | A dated record of every operation and my decisions                                                     | The agent maintains; I check             |
| Perspectives | `Perspectives/` | My reflections, opinions, and conclusions                                                              | I write                                  |

### Folder layout

```
The Coppermind/
├── Dashboard.md            Front door and review dashboard
├── SCHEMA.md               This file
├── index.md                Map of every page
├── log.md                  Dated record of every operation
├── Ingest Queue.md         Sources I've collected that are waiting to be ingested, in batches
├── Review Queue.base       Live list of pages waiting for review, with a view for verified pages that changed
├── AGENTS.md               Pointers to this file for agents
├── Sources/
│   ├── Class Notes/        Copies of my course notes (one file per course)
│   ├── My Work/            My assignments, papers, analyses
│   ├── Readings/           Articles, books, course documents, media
│   ├── Scans/              Photos of my handwritten notes
│   └── Source Cards/       One "SRC - " card per source
├── Wiki/
│   ├── Concepts/           One idea per page
│   ├── Glossary/           Short definitions
│   ├── Frameworks/         Structured ways of thinking
│   ├── Case Studies/       Real events used to teach a lesson
│   ├── People/             Thinkers, authors, historical figures
│   ├── Summaries/          Summaries of individual sources
│   ├── Prompts/            My most effective prompts
│   ├── Workflows/          Step-by-step processes, including the ones that run this wiki
│   ├── Guides/             How-to pages for me or someone else
│   └── Analyses/           Answers to questions, filed back from queries
├── Perspectives/           My views, organized by the Architecture of Worldview
├── Health Checks/          One report per health check, plus a table of past reports
├── Tools/                  Tools I use and have built (browser extensions, scripts, templates)
├── _templates/             One template per page type
└── _attachments/           Images and diagrams used on wiki pages
```

### Ingest Queue: sources waiting their turn

`Ingest Queue.md` lists sources I've collected but not yet ingested, grouped into the batches we plan to ingest them in, with each batch's status. Like the index and the log, it is not one of the six parts and not a wiki page: it has no `status`, is not in `index.md`, and I don't verify it. **The agent maintains it, and it must stay current.**

- **It is a plan, not a record.** The log records what was done, and each source card's Ingest Progress records what has been ingested from that source. The queue only says what is still waiting and in what order.
- **When I hand over a set of sources to triage,** the agent adds them to the queue in batches, and lists what it recommends skipping and why. I decide the order and the skips.
- **At the end of every ingest that takes a batch from the queue,** the agent marks the batch done, links its source cards, and notes anything deferred to a later batch.
- **I can reorder, split, or drop batches at any time;** the agent changes the order only when I ask.

### Health Checks: the report archive

`Health Checks/` holds one report for each health check (§10), so I can go back and see how the wiki's health has changed. Like the Ingest Queue, it is not one of the six parts and not a wiki page: reports have no `status`, are not in `index.md`, and I don't verify them. **The agent writes the reports; I decide each flag in them.**

- **Reports are short.** About one screen, written from the `Health Check Report` template in `_templates/`: a summary callout, a table with one row per check (the same rows every time, so reports can be compared), the flags that need my decision, the mechanical fixes for batch approval, and what changed since the last check.
- **Naming:** `Health Check YYYY-MM-DD`, with ` (2)` added for a second report on the same day. The date is in the name because a report is a record, not a wiki page (§3).
- **Each report links to the one before it** in its `previous` property.
- **A saved report is a record.** As I decide, the agent fills in its Decision lines and its `flags_open` count. It doesn't change the findings afterward; a new health check makes a new report.
- **`Health Check History.base`** in the folder is a table of every report, newest first, with a view of the reports that still have undecided flags. It is an Obsidian-only convenience (§13).

### Tools: the toolbox

`Tools/` is where I keep the tools I use: browser extensions, scripts, and similar things, each as a single file or zip. It is not one of the six parts and not a wiki page folder: files there have no `status`, are not in `index.md`, and I don't verify them. They are my own working equipment, not sources or knowledge.

- **I add and update the tools.** The agent may read them, and may build or revise one only when I ask.
- **A tool that helps feed the wiki** (such as the YouTube transcript extension) does not change the rules for sources: whatever it produces still goes through Ingest like any other source.
- **Naming:** a plain descriptive name, with the version in a zip's name only when I keep more than one (`yt-to-coppermind.zip`).
- **Plain files only,** so the folder stays portable (§13).

---

## 3. Naming conventions

- **The file name is the page title.** Use Title Case and plain words: `Automation Bias.md`, not `automation-bias.md`.
- **Use the singular** for concepts: `Hallucination`, not `Hallucinations`.
- **Spell out acronyms in titles** and put the acronym in `aliases`: `Analysis of Competing Hypotheses` with alias `ACH`.
- **Every file name is unique across the whole vault**, because links resolve by name.
- **Add a disambiguator in parentheses only when two pages would collide**, and make it readable to an outsider: `Leak (Intelligence)`, not `Leak (SI)`.
- **People:** first and last name: `Dalinar Kholin`.
- **Case studies:** the common name of the case, with the year when helpful: `Mata v. Avianca (2023)`.
- **Analyses:** a short descriptive title of the question answered: `Frameworks for Assessing AI Risk`.
- **Source cards:** `SRC - ` plus the source title: `SRC - SAIL Class Notes (Fall 2026)`.
- **Original source files** keep a descriptive name: `SAIL Class Notes (Fall 2026).md`. My own assignments keep the course's submission name (e.g., `Nickles_HW1_Unverified_GenAI_Information`).
- **No dates in wiki page names.** Dates belong in sources, properties, and the log.
- **Health check reports are the one exception**, because they are records and not wiki pages: `Health Check 2026-11-17`.

---

## 4. Page properties (frontmatter)

Every page in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/` starts with YAML properties. The templates in `_templates/` show the exact set for each type.

| Property                                                                                | Values                                                                                                            | Notes                                    |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `type`                                                                                  | concept, glossary, framework, case-study, person, summary, prompt, workflow, guide, analysis, perspective, source | Required                                 |
| `status`                                                                                | `draft` or `verified`                                                                                             | Required. See section 7                  |
| `aliases`                                                                               | list                                                                                                              | Acronyms and other names                 |
| `courses`                                                                               | SAIL, Intro to Intelligence, Freedom's Foundations                                                                | Which course(s) the content comes from   |
| `sources`                                                                               | list of source-card links                                                                                         | Every source the page draws on           |
| `type_of`, `part_of`, `example_of`, `causes`, `counters`, `applies_to`, `supports`, `contradicts`, `developed_by`, `related` | lists of links                                                                                                    | Typed links. See section 5               |
| `drafted_by`                                                                            | e.g. `Claude (claude-opus-5-5)`                                                                                   | The agent and model that wrote the draft |
| `drafted_on`                                                                            | YYYY-MM-DD                                                                                                        |                                          |
| `verified_on`                                                                           | YYYY-MM-DD                                                                                                        | Set only when I verify the page          |
| `changes_since_verified`                                                                | list of one-line notes                                                                                            | Only on a verified page the agent changed at my request. Deleted when I verify the page again (§7)|


Rules:
- Dates are always `YYYY-MM-DD`.
- Links in properties are written in quotes: `supports: ["[[Automation Bias]]"]`.
- `changes_since_verified` is not in the templates. The agent adds it only when it changes a verified page (§7), and it is deleted when I verify the page again.

---

## 5. Linking rules and ontology

Links should carry meaning. A plain link in the body says "see also"; a typed link in the properties says *how* two ideas relate.

### Relationship types

Read each one as a sentence: "this page ___ the target." The types are listed in the order the agent tries them (see rule 4).

| Property       | Meaning: "This page ___ the target"                      | Example                                                                     |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `type_of`      | is a kind of                                             | Large Language Model → type_of → Generative AI                              |
| `part_of`      | is a component or stage of                               | Attention Head → part_of → Self-Attention                                   |
| `example_of`   | is a specific case or instance of                        | Mata v. Avianca (2023) → example_of → Hallucination                         |
| `causes`       | leads to, enables, or makes more likely                  | Deepfake → causes → Liar's Dividend                                         |
| `counters`     | is a safeguard against, or mitigates                     | Analysis of Competing Hypotheses → counters → Confirmation Bias             |
| `applies_to`   | is a method, tool, or rule used on or governing          | Executive Order 12333 → applies_to → United States Intelligence Community   |
| `supports`     | gives evidence or argument for the target's main claim   | Mata v. Avianca (2023) → supports → Capability vs. Reliability              |
| `contradicts`  | argues against, or is in tension with, the target's main claim | Any "Sources disagree" callout that sets this page's claim against another page's |
| `developed_by` | was created, proposed, or argued by (the target is a person page) | Bitter Lesson → developed_by → Richard Sutton                        |
| `related`      | is connected, but none of the above fit                  | The last resort. Its reason must say why the closest type doesn't fit       |

`part_of` is for components and stages; `type_of` is for kinds. A transformer has self-attention as a part; a large language model is a kind of generative AI.

`supports`, `contradicts`, and `related` mirror the Supports / Contradicts / Neither marks in an ACH matrix. Concept pages can support or contradict each other: a page supports another when its content is evidence or argument for that page's main claim, and contradicts it when its content argues against it.

### Linking rules

1. **Store a relationship once, on the page the sentence starts with.** "ACH counters Confirmation Bias" goes on the ACH page. Never also store the reverse, as `related` or as any other type; Obsidian's backlinks show it.
2. **If that page is verified,** the agent proposes the link there as a before/after change (§7). It never puts a `related` link on the other page instead.
3. **Typed links say how two ideas relate; plain links in the text say "see also."** A link that only means "see also" or "compare" stays in the page text ("Used in:", "See", "Compare") and does not also go in `related`.
4. **Choose the type in table order.** Try each type from the top, and use `related` only when none fits. Every proposed `related` link names the closest type and says why it doesn't fit.
5. **Every proposed link must be real.** It comes from what a source says, not from the agent's own view, so its one-line reason can point to the sentence or section it rests on. When drafting, the agent lists each new typed link with that reason so I can check it. I approve or reject links individually.
6. **When a "Sources disagree" callout sets a claim on one page against a claim on another page,** the agent also proposes a `contradicts` link between the two pages.
7. **Glossary terms and the concept pages that use them link to each other in the page text:** a glossary term's "Used in:" line names the concept pages, and a concept page links a glossary term on first use. Add a typed link only when a type fits, and only on one of the two pages (rule 1).
8. **Link to a page that doesn't exist yet only if the agent is proposing to create it** in the same operation. Otherwise use plain text.
9. **Links inside original source files are left alone**, even if they point to notes outside this vault.

---

## 6. Citation and attribution

### Citations

1. **Every factual claim (or group of claims that originate from the same source) in a wiki page is cited inline, right after the claim**, with a link to the original source and a location. The display text should be readable:
   - Class notes, by date heading: `([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]])`
   - Classical texts, by Stephanus or Bekker number, plus where I took the note: `(Republic 425, via [[Freedom's Foundations 1 Class Notes (Fall 2026)#9/9/26|FF1 notes, 9/9/26]])`
   - PDFs, by page: `([[ODNI Principles of AI Ethics.pdf#page=2|ODNI, p. 2]])`
   - Other sources: a link to the source card plus a page, section, or timestamp.
   - **Keep the class-notes display text in the form `<Course> notes, M/D/YY`** (`SAIL notes, 10/20/26`, `Intro notes, 10/20/26`) so citations read the same everywhere.
   - Web pages used only for a how-to guide about tools (not course content) may be cited by URL directly, without a source card.
2. **Every source a page cites is also listed in its `sources` property.**
3. **No unsourced claims.** If the agent thinks background knowledge is needed that no source in the vault provides, it goes in a callout that I must either source or delete before verifying:
   ```
   > [!warning] Unsourced background — verify or remove
   > ...
   ```
   A verified page never contains one of these callouts.
4. **Direct quotes** use quotation marks or a blockquote and name the speaker.

### Attribution: whose voice is this?

My class notes mix four voices, and the wiki keeps them separate:

| Voice | How to write it |
|---|---|
| **A source or author** (a book, article, quoted person) | Name them: "Heuer developed ACH to counter confirmation bias…" |
| **The instructor / course** | Name the course and date: "SAIL presented the Three-Ps framework as… (9/1/26)" |
| **A guest lecturer** | Name them, by the title and name my notes give, with the course and date: "In an Intro to Intelligence guest lecture, CDR Blocker argued… (8/27/26)" |
| **Me** | Never in a wiki page as fact. My views go in `Perspectives/`, or in a `## My Take` section that only I write |

Rules:
- **By default, content in my class notes is treated as what was taught in class**, unless it is quoted (then it belongs to the person quoted).
- **Content under a guest-lecture heading belongs to the guest lecturer**, not the course, and is attributed to them by name. Their name is the only personal detail that goes in the wiki: never their contact information, where they live, or other personal information. Guest lecturers don't get People pages unless I ask for one.
- **If a line in my notes sounds like an opinion or a judgment** and it isn't clear whether it was the instructor's or mine, the agent does not guess. It flags it:
  ```
  > [!question] Whose view is this?
  > "<the line from my notes>" (source, date)
  ```
  I resolve it before verifying: attribute it, move it to Perspectives, or cut it.
- **The agent never turns a line from my notes into a neutral statement of fact** about the world. "SAIL taught X" is not the same as "X is true."
- **The agent never writes my opinions for me**, even if it can guess them from `Perspectives/My Worldview.md`.

### Source reliability (source cards)

Each source card rates the source with the Admiralty Code. The agent may propose a rating with a one-sentence reason; I set the final rating.

| Reliability of the source | Credibility of the information |
|---|---|
| A: Completely reliable | 1: Confirmed by other sources |
| B: Usually reliable | 2: Probably true |
| C: Fairly reliable | 3: Possibly true |
| D: Not usually reliable | 4: Doubtful |
| E: Unreliable | 5: Improbable |
| F: Cannot be judged | 6: Cannot be judged |

---

## 7. Draft vs. verified

1. **Every wiki page, source card, and perspective has a `status`**: `draft` (not yet reviewed by me) or `verified` (I reviewed and approved it).
2. **The agent only ever creates drafts.** It writes new pages directly into the vault with `status: draft`, so I can review them in Obsidian, where the links and formatting render and I can click through to check each citation.
3. **Only I make a page verified.** I either change the property myself, or tell the agent explicitly, for that specific page, "mark it verified." The agent then sets `status: verified` and `verified_on`, and logs it. Clicking the **Verify** button added by the Nicrosil plugin counts as me making that change ([[Nicrosil]]).
4. **"Saved as final" means verified and committed to git.** A draft in the vault is a proposal, not part of the wiki's baseline.
5. **If the agent changes the content of a verified page, the page goes back to `draft`** and the change is logged. It also records what changed in the page's `changes_since_verified` property (rule 8). Purely mechanical fixes, like updating a link after a page is renamed, don't reset the status but are still logged.
6. **A rejected draft is deleted, never kept,** and the rejection is recorded in the log with my reason. The **Reject** button does this, and also removes the page from the index.
7. **Drafts don't sit forever.** A health check flags any draft older than 14 days.
8. **A verified page the agent changed carries a note of what changed.** The agent only changes a verified page when I tell it to. In that same edit it sets `status: draft`, keeps the old `verified_on`, and adds one line per change to `changes_since_verified`, written as `YYYY-MM-DD: what changed (why)`. A later edit adds another line. The field lives in the properties, never in the page text. When I verify the page, the field is deleted; the log keeps the history. A draft with `verified_on` and this field is a re-review: I check only the listed changes. A draft without the field is new. The **Verify** button in [[Nicrosil]] deletes the field, lists re-reviews first in the queue with an **R** badge, and shows the lines on the review card. `Review Queue.base` has a separate view for them.

### Review size

- **Default: item by item.** I review each page and each proposed link.
- **Batch approval is allowed for mechanical changes only**: index updates, broken-link fixes, formatting, and typo fixes found in a health check. I read the whole batch before approving it.
- **Always item by item** for anything that touches a verified page, a source card's reliability rating, or attribution.
- I can switch to item by item at any time, and should whenever something looks off.

---

## 8. Page style

- **Start with two or three sentences of plain prose** that explain the idea to a smart reader who wasn't in the class. **Put them in a `> [!summary]` callout** as the first thing on the page, so the summary stands out. A glossary term's definition goes in the callout too.
- **Then use nested bullets**, the way I take notes, for the details.
- **Use `==highlight==` for the key claim or two** on the page, as I do in my notes. Use **bold** for terms being defined. Don't overuse either.
- **Write for an outsider:** spell out acronyms on first use, and never say "in class" without naming the course and date.
- **Keep the tone neutral and plain**, in the spirit of ICD 203: report what sources say, attribute claims, and don't editorialize.
- **Length:** glossary terms are 1–3 sentences plus links. Concept and framework pages are usually 150–500 words. Split anything longer into linked pages.
- **Don't repeat the title as a heading at the top of the page**; Obsidian already shows it.

---

## 9. Agent permissions

| Location                    | The agent may                           | The agent may not                                     |
| --------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `Sources/` (original files) | Read                                    | Edit, rename, move, or delete                         |
| `Sources/Source Cards/`     | Create and edit as drafts               | Set the final reliability rating                      |
| `Wiki/`                     | Create and edit drafts                  | Mark a page verified without my explicit instruction  |
| `Perspectives/`             | Read, and quote as *my* view in answers | Write or edit anything                                |
| `SCHEMA.md`                 | Read, and suggest changes in chat       | Edit, unless I ask for a specific change              |
| `index.md`, `log.md`        | Maintain                                | Delete or rewrite past log entries                    |
| `Ingest Queue.md`           | Maintain and keep current (see §2)      | Reorder, drop, or skip batches, unless I ask          |
| `Health Checks/`            | Create a report for each health check; record my decisions in it (see §2) | Change a saved report's findings, or delete a report |
| `Tools/`                    | Read; build or revise a tool when I ask | Edit, rename, or delete otherwise                     |
| `_templates/`, `.obsidian/` | Use                                     | Change, unless I ask                                  |


The agent never deletes anything except a draft it created that I rejected.

---

## 10. The three operations

Every operation follows the think-calculate-verify loop, then a commit. Revisions go back to the calculate step. Rejections are logged, not saved.

### Ingest: adding a source
1. Follow the Dissect and Ingest a Source prompt.
2. **Think (me).** I name the source and the part of it to ingest, usually one class session (one date heading) or one topic, and say what matters in it.
3. **Plan (agent).** Before drafting, the agent proposes a short plan: the pages it will create or update, and the source card if one is needed. I approve or adjust the plan. This keeps drafts focused and saves effort.
4. **Calculate (agent).** The agent drafts the pages with `status: draft`, following the templates, citation rules, and attribution rules. In chat, it then lists:
   - each page created or changed, with a one-line summary
   - each proposed typed link, with its reason
   - each flag: "Whose view?", unsourced background, conflicts with existing pages, gaps in my notes
5. **Verify (me).** For each page, I approve it, ask for revisions (back to step 4), or reject it. I check the links the same way.
6. **Commit.** The agent updates `index.md`, **marks the batch done in `Ingest Queue.md` if it came from there**, appends the log entry, and suggests a git commit message. I commit.

### Query: asking the wiki a question

1. **Think (me).** I ask a question.
2. **Calculate (agent).** The agent answers **from the wiki first**, citing wiki pages. It prefers verified pages and labels anything drawn from a draft. It quotes my Perspectives only as my view. If the wiki can't answer, the agent says what's missing instead of filling the gap. Outside knowledge is labeled as outside knowledge.
3. **Verify (me).** I check the answer against the cited pages and decide whether to file it back.
4. **File back (optional).** If I say so, the agent saves the answer as a draft in `Wiki/Analyses/`, which then goes through normal verification.
5. **Log** the question, the pages used, and whether it was filed back.

### Health check: reviewing the whole wiki

1. **Think (me).** I start a review of the whole wiki or one folder.
2. **Calculate (agent).** The agent checks for each of the following and saves the results as a report in `Health Checks/` (§2), written from the Health Check Report template: a short summary, one row per check in a table, and the flags as a numbered list with a suggested fix for each. Mechanical fixes are listed separately so I can approve them as a batch (§7). The checks:
   - claims without citations, or citations that don't support the claim
   - contradictions between pages
   - typed links that don't hold up, and missing links that should exist
   - the typed-link mix: how many links of each type, the share that are `related`, and any relationship stored twice (on both pages, or as `related` on one page and a stronger type on the other)
   - broken links, orphan pages, and duplicate pages for the same idea
   - "Whose view?" callouts and unsourced-background callouts still open
   - drafts older than 14 days
   - verified pages changed since they were verified, and drafts that have `verified_on` but no `changes_since_verified` note, or verified pages that still carry one
   - gaps in the sources themselves (unfinished notes, "?" placeholders, empty definitions)
   - pages missing from `index.md`, or index entries for pages that no longer exist
   - `Ingest Queue.md` out of date: a batch still marked waiting whose sources already have source cards, or a batch marked done whose sources don't
3. **Verify (me).** I decide how to resolve each flag: fix, accept as is, or defer. The agent changes nothing until I decide, then records each decision in the report.
4. **Commit and log.** The report keeps each flag and how I resolved it. The log entry links to the report and gives the counts, without repeating each flag. Mechanical fixes (index updates, broken links, formatting) can be approved as a batch (§7).

---

## 11. Index and log

### Index (`index.md`)

- Lists **every page** in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, grouped by type, with a count per group and a total at the top.
- Under each type, pages are listed alphabetically in one list, with no split by status. Each entry is one line: `- [[Page Name]] — one-line summary`. The index does not show whether a page is draft or verified; the review queue and the page's own `status` do.
- The agent updates the index **at the end of every operation** that adds, removes, or renames a page. A change of status does not change the index.
- I check the index during each health check.

### Ingest Queue (`Ingest Queue.md`)

- Not listed in `index.md`, because it is a plan and not a page.
- The agent updates it at the end of every ingest that takes a batch from it, and notes the change in that operation's log entry.
- I check it during each health check.

### Health Checks (`Health Checks/`)

- Not listed in `index.md`, because the reports are records and not pages.
- The agent saves a report at the end of the Calculate step of every health check, links it to the previous one, and keeps its `flags_open` count current as I decide.
- If the list of checks in §10 changes, the agent updates the Health Check Report template to match, so the table's rows stay the same in every report.

### Log (`log.md`)

- **Append-only and chronological** (newest at the bottom). Past entries are never rewritten. Corrections go in a new entry.
- **Every ingest, query, health check, verification, and schema change gets an entry**, in this format:

```
### [YYYY-MM-DD] operation | Subject

- **Think:** what I asked for and what I said matters
- **Calculate:** what the agent drafted, proposed, or flagged
- **Verify:**
  - Approved: [[Page]], [[Page]]
  - Revised: [[Page]] — what I changed and why
  - Rejected: "Page title" — why (not saved)
  - Links rejected: [[A]] → supports → [[B]] — why
- **Commit:** suggested commit message
```

- Entries use `###` headings, so a folded log reads as a short list. The Nicrosil plugin folds them when the log opens in editing view.
- Operations are: `setup`, `ingest`, `query`, `health-check`, `verify`, `schema`.
- **A `health-check` entry links to its report** (`Health Check YYYY-MM-DD`) and gives the counts, instead of repeating each flag.
- **If I revise or reject something without saying why, the agent asks me for a one-sentence reason** and records it. Corrections are the best evidence of my learning, so they should be recorded well.

---

## 12. Version control (git)

- The vault is a git repository. **A commit marks the end of the verify step:** it is the moment changes become part of the baseline.
- At the end of each operation, the agent suggests a commit message in this form: `ingest: SAIL notes 8/27/26 — 4 approved, 1 revised, 1 rejected`.
- I make the commit (see [[Setting Up Git for the Coppermind]]).

---

## 13. Export protocol (keeping it portable)

The Coppermind must outlive any one tool or agent.

1. **Everything that matters is plain text:** Markdown pages, YAML properties, and `[[wikilinks]]`. Images, PDFs, and tools sit in ordinary folders.
2. **Obsidian-only extras are conveniences, never the only copy of anything:** `Review Queue.base`, `Health Check History.base`, CSS snippets, themes, and `.obsidian/` settings. Outside Obsidian, the pages themselves are plain text and read fine.
3. **This schema is written in plain language**, so any agent can follow it. `AGENTS.md` points agents here. For a new agent, point its instructions file at `SCHEMA.md`.
4. **To move to a new tool:**
   1. Commit everything, then copy the whole folder (or clone the git repository).
   2. If the new tool doesn't support `[[wikilinks]]`, convert them to standard Markdown links (`[Text](Page%20Name.md)`). Obsidian can do this through Settings → Files and links → turn off "Use `[[Wikilinks]]`", then use a link-conversion plugin or script on the whole vault.
   3. Heading links (`[[Page#Heading]]`) become anchor links (`Page.md#heading`).
   4. YAML properties carry over as-is to most Markdown tools. For Notion, import the folder as Markdown and check that the properties came through.
   5. Open three pages at random and check that links, citations, and images still work. Log the export.
5. **Test the export once a semester** and log the result.

---

## 14. Changing this schema

- The schema has a version number. Small clarifications bump the decimal (1.0 → 1.1); changes to structure or workflow bump the whole number.
- The agent may suggest schema changes in chat, especially after a health check, but only I approve them.
- Every schema change gets a `schema` entry in the log and a line in the changelog below.

### Changelog

- **0.1 (2026-11-10):** First draft. Structure, naming, ontology, citation and attribution rules, draft/verified workflow, three operations, export protocol.
- **0.2 (2026-11-11):** Guest lecturers added as a fourth voice in §6: named by title and name, with no personal details and no People pages unless I ask.
- **1.0 (2026-11-11):** `Find.md` and `Library.base` added to the structure (§2 folder layout and a new "Find and Library" subsection). The agent now maintains them (§9, §10 ingest and health check, §11), and class-notes citations must keep the form `<Course> notes, M/D/YY` (§6). Ingest steps renumbered.
- **2.0 (2026-11-17):** `Tools/` folder added to the structure (§2 folder layout and a new "Tools: the toolbox" subsection), with a permissions row (§9) and a note in the export protocol (§13). Tools are not one of the six parts: no status, not in the index, not verified. Because the schema changed, its status returns to `draft` until I verify it again (§7).
- **3.0 (2026-11-17):** `Ingest Queue.md` added to the structure (§2 folder layout and a new "Ingest Queue" subsection): a plan of the sources waiting to be ingested, in batches, maintained by the agent and not one of the six parts. Added to permissions (§9), the ingest commit step and the health check (§10), and §11. Status returns to `draft` until I verify it again (§7).
- **4.0 (2026-11-17):** Health checks now produce a saved report. `Health Checks/` added to the structure (§2 folder layout and a new "Health Checks" subsection) with a `Health Check Report` template in `_templates/` and a `Health Check History.base` table. §10: the check writes a short report, with mechanical fixes listed for batch approval, and each decision is recorded in the report. §11: the log entry links to the report instead of repeating each flag, and a new Health Checks subsection. §3: report naming. §9: a permissions row. §13: the history table listed as Obsidian-only. Status returns to `draft` until I verify it again (§7).
- **4.1 (2026-11-17):** Removed a rule about empty list properties.
- **4.2 (2026-11-17):** Reworded a small part of the Find and Search description.
- **4.3 (2026-11-17):** The review plugin is now called Nicrosil (§2, §7, §11). The name only changed; nothing about how reviewing works. Status returns to `draft` until I verify it again (§7).
- **4.4 (2026-11-17):** `Find.md` and `Library.base` removed from the vault, and every mention of them removed from the rules (§2, §6, §9, §10, §11, §13). Earlier changelog lines still name them, since they record what was true then. Status returns to `draft` until I verify it again (§7).
- **5.0 (2026-11-17):** Typed links reworked after the first health check found 82% of them were `related`, about half of those stored on both pages. §5: three new types (`type_of`, `causes`, `developed_by`), `applies_to` widened to rules that govern something, `supports` and `contradicts` defined for concept pages, and the types listed in the order the agent tries them. New linking rules: store a relationship on the page the sentence starts with and never store the reverse; propose links to verified pages instead of falling back to `related`; "see also" links stay in the page text; every `related` link says why no stronger type fits; links rest on what a source says; "Sources disagree" across two pages becomes a `contradicts` proposal; glossary and concept pages link to each other in the text, not in both pages' properties. §4: the new property names. §10: the health check now reports the typed-link mix. The page templates, the Health Check Report template, and [[Dissect and Ingest a Source]] were updated to match. Status returns to `draft` until I verify it again (§7).
- **5.1 (2026-11-17):** The index no longer splits each type into Verified and Drafts (§11). Each type is one alphabetical list with a single total, and a change of status no longer changes the index. Nicrosil v0.8.6 was updated to match. Status returns to `draft` until I verify it again (§7).
- **5.2 (2026-11-17):** Verified pages the agent changes now say what changed. §4: new `changes_since_verified` property, a list of one-line notes. §7: new rule 8 and a longer rule 5; the agent adds the note in the same edit that sets the page back to `draft`, and verifying the page deletes it. §10: the health check flags re-reviews without a note. `Review Queue.base` has a "Changed since verified" view, and Nicrosil v0.8.11 deletes the field on Verify, lists these pages first with an R badge, and shows the notes on the card and the Dashboard. Status returns to `draft` until I verify it again (§7).
