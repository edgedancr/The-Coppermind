---
type: schema
version: 7.10
status: draft
owner: Harrison Nickles
updated: 2026-11-20
verified_on: 2026-11-20
changes_since_verified:
  - "2026-11-20: `Review Queue.base` is gone from the folder layout [[#Folder layout]]"
  - "2026-11-20: the log is one file per month in `_logs/`, named `_log MM-YY` [[#Folder layout]]"
  - "2026-11-20: the index and the log are `_index.md` and `_log.md` [[#Folder layout]]"
  - "2026-11-20: the Dashboard is `_dashboard.md` [[#Folder layout]]"
  - "2026-11-20: AGENTS.md: a permissions row and a read rule for `_changelogs/`, and the Nicrosil rule now says its changelog line goes in that folder (versions 7.3 and 7.4)"
  - "2026-11-20: the folder layout lists `_changelogs/`, and the Schema Changelog moved there from `SCHEMAS/` [[#Folder layout]]"
---
This is the overview of the Coppermind's rules: what the wiki is for, how it is laid out, and which rule file covers what. It is the rulebook for my personal LLM wiki (SAIL portfolio). The Coppermind follows the SAIL version of the LLM-wiki pattern, not Karpathy's original: **I design, the AI drafts, I verify.** Nothing becomes part of the wiki as final until I have reviewed and approved it.

An agent starts at `AGENTS.md`, which holds the rules for every task and points to the rule files below. Where a rule file and an instruction in chat disagree, the agent asks me before acting.

## The rule files

| File | What it covers |
|---|---|
| `AGENTS.md` (vault root) | Read by every agent, every time: scope, drafts only, permissions, voices, no unsourced claims, the index line and log entry formats, and which rule files to read |
| [[SCHEMA - Writing Pages]] | Naming, page properties, typed links, citations, attribution, source reliability, and page style |
| [[SCHEMA - Review]] | Draft vs. verified, change notes on verified pages, and review size |
| [[SCHEMA - Ingest]] | The ingest operation, step by step, and the Ingest Queue |
| [[SCHEMA - Query]] | Answering questions from the wiki and filing answers back |
| [[SCHEMA - Health Check]] | What a health check covers, the check script, and the report archive |
| [[SCHEMA - Index and Log]] | The index, the log (one file per month), and git |
| [[SCHEMA - Changes]] | Changing these rules, the templates, the tools, and Nicrosil |
| [[SCHEMA - Export]] | Keeping the vault portable and moving it to another tool |
| [[Schema Changelog]] (in `_changelogs/`) | The history of every version of the rules |

All of them, `AGENTS.md` included, are one rulebook with one version number, kept in this file's `version` property.

## Purpose and scope

The Coppermind has three jobs, in priority order:

1. **A productivity tool for life.** It should help me in later courses, apprenticeships, and work.
2. **A showcase.** An employer or mentor should be able to open it and see what I know and how I think.
3. **A record of my developing perspective.** My own views sit next to outside sources and show how my thinking grows.

What is in and out of scope is in `AGENTS.md`, because every task needs it.

## The six parts of the wiki

| Part         | Folder / file   | What it holds                                                                                          | Who writes it                            |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Sources      | `Sources/`      | My notes, assignments, readings, and scans in their original form, plus a source card for each         | I collect; the agent drafts source cards |
| Wiki pages   | `Wiki/`         | Concept, glossary, framework, case study, person, summary, prompt, workflow, guide, and analysis pages | The agent drafts; I verify               |
| Schema       | `SCHEMAS/` and `AGENTS.md` | This rulebook                                                                               | I direct                                 |
| Index        | `_index.md`      | A map of every page                                                                                    | The agent maintains; I check             |
| Log          | `_logs/`              | A dated record of every operation and my decisions                                                | The agent maintains; I check             |
| Perspectives | `Perspectives/` | My reflections, opinions, and conclusions                                                              | I write                                  |

## Folder layout

```
The Coppermind/
├── AGENTS.md               Start here: the rules for every task, and which rule file to read
├── CLAUDE.md               Loads AGENTS.md for Claude Code
├── _dashboard.md           Front door and review dashboard (hidden in the file list unless the eye button is on)
├── _index.md               Map of every page
├── _logs/                  The log: one file per month ("_log 11-26" is November 2026)
├── Ingest Queue.md         Sources I've collected that are waiting to be ingested, in batches
├── SCHEMAS/                This rulebook: this overview and one file per area
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
│   ├── Workflows/          Step-by-step processes, from my courses and from running this wiki
│   ├── Guides/             How-to pages about the Coppermind itself (its tools, setup, and use)
│   └── Analyses/           Answers to questions, filed back from queries
├── Perspectives/           My views, organized by the Architecture of Worldview
├── Health Checks/          One report per health check, plus a table of past reports
├── Tools/                  Tools I use and have built (browser extensions, scripts, the health check script)
├── _changelogs/            The changelog of the rules and of each tool (Nicrosil's), kept out of the files agents read
├── _templates/             One template per page type
└── _attachments/           Images and diagrams used on wiki pages
```

## Files that are not wiki pages

`_index.md`, the log, `Ingest Queue.md`, the reports in `Health Checks/`, everything in `Tools/`, and the files in `_changelogs/` are not wiki pages: they have no `status`, are not in `_index.md`, and I don't verify them. The rule files in `SCHEMAS/` do have a `status`, and I verify them like pages, but they are not listed in the index either.

### Guides: about the Coppermind itself

A **guide** explains how to set up, run, review, or get the most out of the Coppermind: its plugin, its git setup, which Claude model to use for which job. Guides are about the vault, not about the subjects in it.

- **A how-to about anything else is not a guide.** A process taken from a course, a guest lecture, or a reading (for example, getting a law enforcement intelligence internship) is a **workflow** if it is a sequence of steps, and otherwise a concept, framework, or summary.
- **Test:** if the page would still be useful with the Coppermind deleted, it is not a guide.
- **The Dashboard's "Guides" card** opens this section of the index, and its description is "How the vault works."

### The other files

- **Ingest Queue:** sources waiting to be ingested, in batches. See [[SCHEMA - Ingest#The Ingest Queue]].
- **Health Checks:** one report per health check. See [[SCHEMA - Health Check#The report archive]].
- **Tools:** my working equipment, not sources or knowledge. See [[SCHEMA - Changes#Tools]].
- **Changelogs:** `_changelogs/` holds the [[Schema Changelog]] and one file per tool (for now, [[Nicrosil Changelog]]), so the guides and rule files stay short. See [[SCHEMA - Changes#Nicrosil and other tools]].
- **The log:** see [[SCHEMA - Index and Log#The log]].
