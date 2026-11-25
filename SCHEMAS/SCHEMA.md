---
type: schema
version: 12
status: verified
owner: Harrison Nickles
updated: 2026-11-24
verified_on: 2026-11-24
---
This is the overview of the Coppermind's rules: what the wiki is for, how it is laid out, and which rule file covers what. It is the rulebook for my personal LLM wiki. The Coppermind follows the SAIL version of the LLM-wiki pattern, not Karpathy's original: **I design, the AI drafts, I verify.** Nothing becomes part of the wiki as final until I have reviewed and approved it.

An agent starts at `_AGENTS.md`, which holds the rules for every task and points to the rule files below. Where a rule file and an instruction in chat disagree, the agent asks me before acting.

## The rule files

| File | What it covers |
|---|---|
| `_AGENTS.md` (vault root) | Read by every agent, every time: scope, drafts only, permissions, voices, no unsourced claims, the index rule and log entry formats, and which rule files to read |
| [[SCHEMA - Writing Pages]] | Naming, page properties, typed links, citations, attribution, source reliability, and page style |
| [[SCHEMA - Review]] | Draft vs. verified, change notes on verified pages, and review size |
| [[SCHEMA - Transcription]] | Turning scans of my handwritten notes into Tinmind notes, drawing flags, and the transcription review queue |
| [[SCHEMA - Ingest]] | The ingest operation, step by step, Triage, and raw sources |
| [[SCHEMA - Query]] | Answering questions from the wiki and filing answers back |
| [[SCHEMA - Health Check]] | What a health check covers, the check script, and the report archive |
| [[SCHEMA - Index and Log]] | The index, the log (one file per month), and git |
| [[SCHEMA - Changes]] | Changing these rules, the templates, the tools, and Nicrosil |
| [[SCHEMA - Export]] | Keeping the vault portable and moving it to another tool |
| [[Schema Changelog]] (in `_changelogs/`) | The history of every version of the rules |

All of them, `_AGENTS.md` included, are one rulebook with one version number, kept in this file's `version` property.

## Purpose and scope

The Coppermind has two jobs, in priority order:

1. **A productivity tool for life.** It should help me in later courses, apprenticeships, and work.
2. **A record of my developing perspective.** My own views sit next to outside sources and show how my thinking grows.

What is in and out of scope is in `_AGENTS.md`, because every task needs it.

## The six parts of the wiki

| Part         | Folder / file   | What it holds                                                                                          | Who writes it                            |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Sources      | `Sources/`      | My notes, assignments, and readings in their original form, plus a source card for each (scans of handwritten notes are only held until they are transcribed) | I collect; the agent drafts source cards |
| Wiki pages   | `Wiki/`         | Concept, glossary, framework, case study, person, summary, prompt, workflow, guide, and analysis pages | The agent drafts; I verify               |
| Schema       | `SCHEMAS/` and `_AGENTS.md` | This rulebook                                                                               | I direct                                 |
| Index        | `_index.md`      | A map of every page                                                                                    | Nicrosil maintains; I check              |
| Log          | `_logs/`              | A dated record of every operation and my decisions                                                | The agent maintains; I check             |
| Perspectives | `Perspectives/` | My reflections, opinions, and conclusions                                                              | I write                                  |

## Folder layout

```
The Coppermind/
├── _AGENTS.md              Start here: the rules for every task, and which rule file to read
├── _dashboard.md           Front door and review dashboard (hidden in the file list unless the eye button is on)
├── _index.md               Map of every page
├── _topics.md              The wiki's major topics and their anchor pages, drawn by Nicrosil's atlas
├── _logs/                  The log: one file per month ("_log 11-26" is November 2026)
├── Ingestion/              Everything before ingestion
│   ├── Triage.md           Sources I've collected that are waiting to be ingested, in batches
│   └── Raw/                Sources I haven't put through ingestion yet (agents never look in here)
├── SCHEMAS/                This rulebook: this overview and one file per area
├── Sources/
│   ├── Class Notes/        Copies of my course notes (one file per course)
│   ├── My Work/            My assignments, papers, analyses
│   ├── Readings/           Articles, books, course documents, media, and a "(text)" copy of each PDF, Office file or saved web page for agents to read
│   ├── Scans/              Shrunk photos of my handwritten notes waiting to be transcribed (kept in git; Nicrosil deletes a scan when I verify its transcription)
│   └── Source Cards/       One "SRC - " card per source
├── Wiki/
│   ├── Concepts/           One idea per page
│   ├── Glossary/           Short definitions
│   ├── Frameworks/         Structured ways of thinking
│   ├── Case Studies/       Real events used to teach a lesson
│   ├── People/             Thinkers, authors, historical figures
│   ├── Summaries/          Summaries of individual sources
│   ├── Prompts/            My most effective prompts
│   ├── Workflows/          Step-by-step processes, from my courses and from running this wiki
│   ├── Guides/             How-to pages about the Coppermind itself (its tools, setup, and use)
│   └── Analyses/           Answers to questions, filed back from queries
├── Perspectives/           My views, organized by the Architecture of Worldview
├── The Tinmind/            My own class notes and their dashboard (agents work in here only on a task I say is about the Tinmind)
├── Health Checks/          One report per health check, plus a table of past reports
├── Tools/                  Tools I use and have built (browser extensions, scripts, the health check script)
├── _changelogs/            The changelog of the rules and of each tool (Nicrosil's), kept out of the files agents read
├── _templates/             One template per page type
└── _attachments/           Images and diagrams used on wiki pages, and drawings I keep from transcribed notes (Tinmind/)
```

## Files that are not wiki pages

`_index.md`, `_topics.md`, the log, `Ingestion/Triage.md`, the reports in `Health Checks/`, everything in `Tools/`, everything in `The Tinmind/`, and the files in `_changelogs/` are not wiki pages: they have no `status`, are not in `_index.md`, and I don't verify them. Like every file here, they also carry no `# Title` line that repeats the file name, because Obsidian already shows the name at the top. The rule files in `SCHEMAS/` do have a `status`, and I verify them like pages, but they are not listed in the index either.

### Guides: about the Coppermind itself

A **guide** explains how to set up, run, review, or get the most out of the Coppermind: its plugin, its git setup, which Claude model to use for which job. Guides are about the vault, not about the subjects in it.

- **A how-to about anything else is not a guide.** A process taken from a course, a guest lecture, or a reading (for example, getting a law enforcement intelligence internship) is a **workflow** if it is a sequence of steps, and otherwise a concept, framework, or summary.
- **Test:** if the page would still be useful with the Coppermind deleted, it is not a guide.
- **The Dashboard's "Guides" card** opens this section of the index, and its description is "How the vault works."

### The other files

- **Topics:** `_topics.md` lists the wiki's major topics, each with a one-line description and its anchor pages (the pages at its center). The atlas in [[Nicrosil]] draws a circle for each and places every other page from its links, so pages carry no topic property. I own the list; the agent checks it at each ingest, may add a topic or an anchor, and proposes any other change ([[SCHEMA - Ingest#6. Check the topic list]]).
- **Triage:** sources waiting to be ingested, in batches. See [[SCHEMA - Ingest#Triage]].
- **Raw sources:** `Ingestion/Raw/` holds sources I haven't ingested yet. It isn't part of the wiki, and agents never look in it. See [[SCHEMA - Ingest#Raw sources]].
- **Health Checks:** one report per health check. See [[SCHEMA - Health Check#The report archive]].
- **Tools:** my working equipment, not sources or knowledge. See [[SCHEMA - Changes#Tools]].
- **Changelogs:** `_changelogs/` holds the [[Schema Changelog]] and one file per tool (for now, [[Nicrosil Changelog]]), so the guides and rule files stay short. See [[SCHEMA - Changes#Nicrosil and other tools]].
- **The log:** see [[SCHEMA - Index and Log#The log]].
