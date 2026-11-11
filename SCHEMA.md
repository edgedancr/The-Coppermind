---
type: schema
version: 0.1
status: draft
owner: Harrison Nickles
updated: 2026-11-10
---
# The Coppermind — Schema

This is the rulebook for the Coppermind, my personal LLM wiki (my SAIL portfolio). Any AI agent working in this vault reads this file first and follows it. Where this file and an instruction in chat disagree, ask me before acting.

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

**Out of scope until I say otherwise:** other courses, personal notes (personality typing, social notes, personal reminders), anything about my security clearance paperwork, and personal information about classmates or other private individuals. If a source mentions a classmate, refer to them by role ("a teammate"), not by name.

---

## 2. The six parts of the wiki

| Part | Folder / file | What it holds | Who writes it |
|---|---|---|---|
| Sources | `Sources/` | My notes, assignments, readings, and scans in their original form, plus a source card for each | I collect; the agent drafts source cards |
| Wiki pages | `Wiki/` | Concept, glossary, framework, case study, person, summary, prompt, workflow, guide, and analysis pages | The agent drafts; I verify |
| Schema | `SCHEMA.md` | This rulebook | I direct |
| Index | `index.md` | A map of every page | The agent maintains; I check |
| Log | `log.md` | A dated record of every operation and my decisions | The agent maintains; I check |
| Perspectives | `Perspectives/` | My reflections, opinions, and conclusions | I write |

### Folder layout

```
The Coppermind/
├── Home.md                 Front door for human readers
├── SCHEMA.md               This file
├── index.md                Map of every page
├── log.md                  Dated record of every operation
├── Review Queue.base       Live list of pages waiting for review
├── CLAUDE.md, AGENTS.md    Pointers to this file for different agents
├── Sources/
│   ├── Class Notes/        Copies of my course notes (one file per course)
│   ├── My Work/            My assignments, papers, analyses
│   ├── Readings/           Articles, books, course documents, media
│   ├── Scans/              Photos of my handwritten notes
│   └── Source Cards/       One "SRC - " card per source
├── Wiki/
│   ├── Concepts/           One idea per page, in my words
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
├── _templates/             One template per page type
└── _attachments/           Images and diagrams used on wiki pages
```

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
| `supports`, `contradicts`, `example_of`, `part_of`, `applies_to`, `counters`, `related` | lists of links                                                                                                    | Typed links. See section 5               |
| `drafted_by`                                                                            | e.g. `Claude (claude-opus-5-5)`                                                                                   | The agent and model that wrote the draft |
| `drafted_on`                                                                            | YYYY-MM-DD                                                                                                        |                                          |
| `verified_on`                                                                           | YYYY-MM-DD                                                                                                        | Set only when I verify the page          |


Rules:
- Dates are always `YYYY-MM-DD`.
- Leave out typed-link properties that would be empty; don't leave empty lists on a finished page.
- Links in properties are written in quotes: `supports: ["[[Automation Bias]]"]`.

---

## 5. Linking rules and ontology

Links should carry meaning. A plain link in the body says "see also"; a typed link in the properties says *how* two ideas relate.

### Relationship types

| Property      | Meaning: "This page ___ the target"     | Example                                                               |
| ------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `supports`    | gives evidence for, or strengthens      | Mata v. Avianca (2023) → supports → Capability vs. Reliability        |
| `contradicts` | conflicts with, or is in tension with   | (a claim) → contradicts → (another claim)                             |
| `example_of`  | is an instance or case of               | Bing Sydney Incident → example_of → Emergent Behavior                 |
| `part_of`     | is a component or stage of              | Person (Risk Level) → part_of → Three-Ps Risk Framework               |
| `applies_to`  | is a method or tool used on             | Analysis of Competing Hypotheses → applies_to → Intelligence Analysis |
| `counters`    | is a safeguard against, or mitigates    | Analysis of Competing Hypotheses → counters → Confirmation Bias       |
| `related`     | is connected, but none of the above fit | Use sparingly, only if none of the other categories fit               |

The first two and the last mirror the Supports / Contradicts / Neither marks in an ACH matrix.

### Linking rules

1. **Store a relationship once**, on the page doing the relating. Obsidian's backlinks show the reverse direction.
2. **Every proposed link must be real.** When drafting, the agent lists each new typed link with a one-line reason so I can check it. I approve or reject links individually.
3. **Glossary terms link to the concept pages where they matter**, and concept pages link to the glossary terms they use, on first use.
4. **Link to a page that doesn't exist yet only if the agent is proposing to create it** in the same operation. Otherwise use plain text.
5. **Links inside original source files are left alone**, even if they point to notes outside this vault.

---

## 6. Citation and attribution

### Citations

1. **Every factual claim in a wiki page is cited inline, right after the claim**, with a link to the original source and a location. The display text should be readable:
   - Class notes, by date heading: `([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]])`
   - Classical texts, by Stephanus or Bekker number, plus where I took the note: `(Republic 425, via [[Freedom's Foundations 1 Class Notes (Fall 2026)#9/9/26|FF1 notes, 9/9/26]])`
   - PDFs, by page: `([[ODNI Principles of AI Ethics.pdf#page=2|ODNI, p. 2]])`
   - Other sources: a link to the source card plus a page, section, or timestamp.
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

My class notes mix three voices, and the wiki keeps them separate:

| Voice | How to write it |
|---|---|
| **A source or author** (a book, article, quoted person) | Name them: "Heuer developed ACH to counter confirmation bias…" |
| **The instructor / course** | Name the course and date: "SAIL presented the Three-Ps framework as… (9/1/26)" |
| **Me** | Never in a wiki page as fact. My views go in `Perspectives/`, or in a `## My Take` section that only I write |

Rules:
- **By default, content in my class notes is treated as what was taught in class**, unless it is quoted (then it belongs to the person quoted).
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
3. **Only I make a page verified.** I either change the property myself, or tell the agent explicitly, for that specific page, "mark it verified." The agent then sets `status: verified` and `verified_on`, and logs it. Clicking the **Verify** button added by the Coppermind Review plugin counts as me making that change ([[Verifying Pages with the Review Buttons]]).
4. **"Saved as final" means verified and committed to git.** A draft in the vault is a proposal, not part of the wiki's baseline.
5. **If the agent changes the content of a verified page, the page goes back to `draft`** and the change is logged. Purely mechanical fixes, like updating a link after a page is renamed, don't reset the status but are still logged.
6. **A rejected draft is deleted, never kept,** and the rejection is recorded in the log with my reason. The **Reject** button does this, and also removes the page from the index.
7. **Drafts don't sit forever.** A health check flags any draft older than 14 days.

### Review size

- **Default: item by item.** I review each page and each proposed link.
- **Batch approval is allowed for mechanical changes only**: index updates, broken-link fixes, formatting, and typo fixes found in a health check. I read the whole batch before approving it.
- **Always item by item** for anything that touches a verified page, a source card's reliability rating, or attribution.
- I can switch to item by item at any time, and should whenever something looks off.

---

## 8. Page style

- **Start with two or three sentences of plain prose** that explain the idea to a smart reader who wasn't in the class.
- **Then use nested bullets**, the way I take notes, for the details.
- **Use `==highlight==` for the key claim or two** on the page, as I do in my notes. Use **bold** for terms being defined. Don't overuse either.
- **Write for an outsider:** spell out acronyms on first use, and never say "in class" without naming the course and date.
- **Keep the tone neutral and plain**, in the spirit of ICD 203: report what sources say, attribute claims, and don't editorialize.
- **Length:** glossary terms are 1–3 sentences plus links. Concept and framework pages are usually 150–500 words. Split anything longer into linked pages.
- **Don't repeat the title as a heading at the top of the page**; Obsidian already shows it.

---

## 9. Agent permissions

| Location | The agent may | The agent may not |
|---|---|---|
| `Sources/` (original files) | Read | Edit, rename, move, or delete |
| `Sources/Source Cards/` | Create and edit as drafts | Set the final reliability rating |
| `Wiki/` | Create and edit drafts | Mark a page verified without my explicit instruction |
| `Perspectives/` | Read, and quote as *my* view in answers | Write or edit anything |
| `SCHEMA.md` | Read, and suggest changes in chat | Edit, unless I ask for a specific change |
| `index.md`, `log.md` | Maintain | Delete or rewrite past log entries |
| `_templates/`, `.obsidian/` | Use | Change, unless I ask |

The agent never deletes anything except a draft it created that I rejected.

---

## 10. The three operations

Every operation follows the think-calculate-verify loop, then a commit. Revisions go back to the calculate step. Rejections are logged, not saved.

### Ingest: adding a source

1. **Think (me).** I name the source and the part of it to ingest, usually one class session (one date heading) or one topic, and say what matters in it.
2. **Plan (agent).** Before drafting, the agent proposes a short plan: the pages it will create or update, and the source card if one is needed. I approve or adjust the plan. This keeps drafts focused and saves effort.
3. **Calculate (agent).** The agent drafts the pages with `status: draft`, following the templates, citation rules, and attribution rules. In chat, it then lists:
   - each page created or changed, with a one-line summary
   - each proposed typed link, with its reason
   - each flag: "Whose view?", unsourced background, conflicts with existing pages, gaps in my notes
4. **Verify (me).** For each page, I approve it, ask for revisions (back to step 3), or reject it. I check the links the same way.
5. **Commit.** The agent updates `index.md`, appends the log entry, and suggests a git commit message. I commit.

### Query: asking the wiki a question

1. **Think (me).** I ask a question.
2. **Calculate (agent).** The agent answers **from the wiki first**, citing wiki pages. It prefers verified pages and labels anything drawn from a draft. It quotes my Perspectives only as my view. If the wiki can't answer, the agent says what's missing instead of filling the gap. Outside knowledge is labeled as outside knowledge.
3. **Verify (me).** I check the answer against the cited pages and decide whether to file it back.
4. **File back (optional).** If I say so, the agent saves the answer as a draft in `Wiki/Analyses/`, which then goes through normal verification.
5. **Log** the question, the pages used, and whether it was filed back.

### Health check: reviewing the whole wiki

1. **Think (me).** I start a review of the whole wiki or one folder.
2. **Calculate (agent).** The agent checks for, and reports as a numbered list of flags with a suggested fix for each:
   - claims without citations, or citations that don't support the claim
   - contradictions between pages
   - typed links that don't hold up, and missing links that should exist
   - broken links, orphan pages, and duplicate pages for the same idea
   - "Whose view?" callouts and unsourced-background callouts still open
   - drafts older than 14 days
   - verified pages changed since they were verified
   - gaps in the sources themselves (unfinished notes, "?" placeholders, empty definitions)
   - pages missing from `index.md`, or index entries for pages that no longer exist
3. **Verify (me).** I decide how to resolve each flag: fix, accept as is, or defer. The agent changes nothing until I decide.
4. **Commit and log** each flag and how I resolved it.

---

## 11. Index and log

### Index (`index.md`)

- Lists **every page** in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, grouped by type, with a count per group.
- Each entry is one line: `- [[Page Name]] — one-line summary (draft)` or `(verified)`.
- The agent updates the index **at the end of every operation** that adds, removes, renames, or changes the status of a page.
- I check the index during each health check.

### Log (`log.md`)

- **Append-only and chronological** (newest at the bottom). Past entries are never rewritten. Corrections go in a new entry.
- **Every ingest, query, health check, verification, and schema change gets an entry**, in this format:

```
## [YYYY-MM-DD] operation | Subject

- **Think:** what I asked for and what I said matters
- **Calculate:** what the agent drafted, proposed, or flagged
- **Verify:**
  - Approved: [[Page]], [[Page]]
  - Revised: [[Page]] — what I changed and why
  - Rejected: "Page title" — why (not saved)
  - Links rejected: [[A]] → supports → [[B]] — why
- **Commit:** suggested commit message
```

- Operations are: `setup`, `ingest`, `query`, `health-check`, `verify`, `schema`.
- **If I revise or reject something without saying why, the agent asks me for a one-sentence reason** and records it. Corrections are the best evidence of my learning, so they should be recorded well.

---

## 12. Version control (git)

- The vault is a git repository. **A commit marks the end of the verify step:** it is the moment changes become part of the baseline.
- At the end of each operation, the agent suggests a commit message in this form: `ingest: SAIL notes 8/27/26 — 4 approved, 1 revised, 1 rejected`.
- I make the commit (see [[Setting Up Git for the Coppermind]]).

---

## 13. Export protocol (keeping it portable)

The Coppermind must outlive any one tool or agent.

1. **Everything that matters is plain text:** Markdown pages, YAML properties, and `[[wikilinks]]`. Images and PDFs sit in ordinary folders.
2. **Obsidian-only extras are conveniences, never the only copy of anything:** `Review Queue.base`, CSS snippets, themes, and `.obsidian/` settings.
3. **This schema is written in plain language**, so any agent can follow it. `CLAUDE.md` and `AGENTS.md` point agents here. For a new agent, point its instructions file at `SCHEMA.md`.
4. **To move to a new tool:**
   1. Commit everything, then copy the whole folder (or clone the git repository).
   2. If the new tool doesn't support `[[wikilinks]]`, convert them to standard Markdown links (`[Text](Page%20Name.md)`). Obsidian can do this through Settings → Files and links → turn off "Use `[[Wikilinks]]`", then use a link-conversion plugin or script on the whole vault.
   3. Heading links (`[[Page#Heading]]`) become anchor links (`Page.md#heading`).
   4. YAML properties carry over as-is to most Markdown tools. For Notion, import the folder as Markdown and check that the properties came through.
   5. Open three pages at random and check that links, citations, and images still work. Log the export.
5. **Test the export once a semester** and log the result.

---

## 14. Changing this schema

- The schema has a version number. Small clarifications bump the decimal (0.1 → 0.2); changes to structure or workflow bump the whole number.
- The agent may suggest schema changes in chat, especially after a health check, but only I approve them.
- Every schema change gets a `schema` entry in the log and a line in the changelog below.

### Changelog

- **0.1 (2026-11-10):** First draft. Structure, naming, ontology, citation and attribution rules, draft/verified workflow, three operations, export protocol.
