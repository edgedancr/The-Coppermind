---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-20
verified_on: 2026-11-20
---
How the index, the log, and git work. The everyday parts (the index line, the log entry format, the commit message) are in `AGENTS.md`; this file has the rest.

## The index

- `index.md` lists **every page** in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, grouped by type, with a count per group and a total at the top.
- Under each type, pages are listed alphabetically in one list, with no split by status. Each entry is one line: `- [[Page Name]] — one-line summary`. The index does not show whether a page is draft or verified; the review queue and the page's own `status` do.
- **Concepts and Glossary, the two long types, are split by first letter** under `### A`, `### B` ... headings (`### 0–9` for names that start with a digit). Pages stay alphabetical, and there is a heading only for a letter that has pages: add one when a page brings a new letter, remove one that empties. Other types stay one plain list.
- **A Jump to line** under the total links to each type's heading, as `**Jump to:** [[#Concepts (94)|Concepts]] ...`. A link has to match its heading's count, so update it whenever a count changes. A stale one shows in a health check as a broken heading link.
- **Looks:** `index.md` has `cssclasses: coppermind-index`, which the `coppermind.css` snippet styles (columns, bold names, quieter summaries, letter tabs, jump chips). It changes only how the page looks; the line format above stays exactly as is. Nicrosil keeps the letter headings and the Jump to line right when I reject a page.
- The agent updates the index **at the end of every operation** that adds, removes, or renames a page. A change of status does not change the index.
- Not in the index: the rule files in `SCHEMAS/`, the Ingest Queue (a plan), the log and the reports in `Health Checks/` (records), and `Tools/`.
- **Read only the section you are changing.** To find whether a page exists, search file names and aliases instead.
- I check the index during each health check.

## The log

- **Append-only and chronological** (newest at the bottom). Past entries are never rewritten. Corrections go in a new entry.
- **Every ingest, query, health check, verification, schema change, and tool change gets an entry**, in the format in `AGENTS.md`.
- **Operations:** `setup`, `ingest`, `query`, `health-check`, `verify`, `schema`, `tool`.
  - `schema` is for changes to the rule files, `AGENTS.md`, and the templates.
  - `tool` is for changes to anything in `Tools/` and to Nicrosil. A tool entry is short: what changed and the new version in two or three bullets, what to check, and the commit message. The details belong in the tool's own guide (Nicrosil's version history) or README, not in the log.
- **A `health-check` entry links to its report** (`Health Check YYYY-MM-DD`) and gives the counts, instead of repeating each flag.
- **If I revise or reject something without saying why, the agent asks me for a one-sentence reason** and records it. Corrections are the best evidence of my learning, so they should be recorded well.
- Entries use `###` headings, so a folded log reads as a short list. Nicrosil folds them when the log opens in editing view.

### One file per month

- `log.md` holds the **current month's** entries. Each earlier month is in `Logs/Log YYYY-MM.md` (for example `Logs/Log 2026-11.md`), with its entries in their original order and wording. Moving a month there is not rewriting it.
- **Nicrosil moves a finished month** out of `log.md` the first time Obsidian opens in a new month, and before it adds an entry in a new month. If an agent appends to `log.md` in a new month before that has happened, that's fine: the move sorts it out.
- The month files are records, like health check reports: no `status`, not in the index.

### Reading the log

- **Never read `log.md` or a month file whole.** To add an entry, append to the end. To look something up, search the `### [YYYY-MM-DD] operation | Subject` headings for the date, operation, or page you need, then read only those entries.

## Version control (git)

- The vault is a git repository. **A commit marks the end of the verify step:** it is the moment changes become part of the baseline.
- At the end of each operation, the agent suggests a commit message in this form: `ingest: SAIL notes 8/27/26 — 4 approved, 1 revised, 1 rejected`.
- I make the commit (see [[Setting Up Git for the Coppermind]]).
