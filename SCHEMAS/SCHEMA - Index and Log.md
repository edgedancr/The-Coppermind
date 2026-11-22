---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-22
verified_on: 2026-11-22
---
How the index, the log, and git work. The everyday parts (the index rule and the log entry format) are in `_AGENTS.md`; this file has the rest.

## The index

- `_index.md` lists **every page** in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/`, grouped by type, with a count per group and a total at the top.
- Under each type, pages are listed alphabetically in one list, with no split by status. Each entry is one line: `- [[Page Name]] — one-line summary`. The index does not show whether a page is draft or verified; the review queue and the page's own `status` do.
- **Concepts and Glossary, the two long types, are split by first letter** under `### A`, `### B` ... headings (`### 0–9` for names that start with a digit). Pages stay alphabetical, and there is a heading only for a letter that has pages: add one when a page brings a new letter, remove one that empties. Other types stay one plain list.
- **A Jump to line** under the total links to each type's heading, as `**Jump to:** [[#Concepts (94)|Concepts]] ...`. A link has to match its heading's count, so update it whenever a count changes. A stale one shows in a health check as a broken heading link.
- **Looks:** `_index.md` has `cssclasses: coppermind-index`, which the `coppermind.css` snippet styles (columns, bold names, quieter summaries, letter tabs, jump chips). It changes only how the page looks; the line format above stays exactly as is. Nicrosil keeps the letter headings and the Jump to line right.
- **Nicrosil keeps the index up to date; the agent doesn't edit it.** It adds a page when one is created, removes the entry when one is deleted or rejected, keeps the entry when a page is renamed, moves it when the page changes folder, and fills in an empty summary, each time fixing the counts, the total and the Jump to line. It checks everything when Obsidian opens and a few seconds after each change, and the **Update the index now** command runs it on request. The setting **Keep the index up to date** turns the automatic part off. If one automatic run would remove more than 20 entries or add more than 100, it stops and shows a notice instead, so a bad sync can't wreck the index; the command lets me go ahead. A change of status doesn't change the index.
- Not in the index: the rule files in `SCHEMAS/`, Triage (a plan), `Ingestion/Raw/` (sources not yet ingested), the log and the reports in `Health Checks/` (records), and `Tools/`.
- **The summary comes from the page.** The text after the dash is the first sentence or two of the page's `> [!summary]` callout, cut to about 150 characters. To change an entry, change the callout, not the index. I can still edit a line by hand, and Nicrosil leaves a line that has a summary alone.
- I check the index during each health check, and the check script still compares it to the pages.

## The log

- **Newest first.** A new entry goes at the top, under the header's closing `---` line and above the newest entry. Past entries are never rewritten. Corrections go in a new entry.
- **Every ingest, query, health check, transcription, verification, schema change, and tool change gets an entry**, in the format in `_AGENTS.md`.
- **Operations:** `setup`, `ingest`, `query`, `health-check`, `transcribe`, `verify`, `schema`, `tool`.
  - `transcribe` is for a batch of scans the agent turned into Tinmind notes ([[SCHEMA - Transcription]]): one entry per batch. The Verify part stays empty, because [[Nicrosil]]'s Transcription queue logs each transcription I verify (or discard) as its own `verify` entry.
  - `schema` is for changes to the rule files, `_AGENTS.md`, and the templates.
  - `tool` is for changes to anything in `Tools/` and to Nicrosil. A tool entry is short: what changed and the new version in two or three bullets, and what to check. The details belong in the tool's changelog ([[Nicrosil Changelog]]) or README, not in the log.
- **A `health-check` entry links to its report** (`Health Check YYYY-MM-DD`) and gives the counts, instead of repeating each flag.
- **If I revise or reject something without saying why, the agent asks me for a one-sentence reason** and records it. Corrections are the best evidence of my learning, so they should be recorded well.
- Entries use `###` headings, so a folded log reads as a short list. Nicrosil folds them when the log opens in editing view.

### One file per month

- The log is in `_logs/`, **one file per month**, named `_log MM-YY` (for example `_logs/_log 11-26.md` for November 2026). New entries go in the current month's file, at the top.
- **Nicrosil starts each month's file** the first time Obsidian opens in a new month, and before it adds an entry in one, with the same header as the others. If an agent needs to add an entry and there is no file for the current month yet, it creates one by copying the header of the latest file.
- Earlier months' files are left as they are. They are records, like health check reports: no `status`, not in the index.

### Reading the log

- **Never read a log file whole.** To add an entry, read only the first 15 or so lines of the current month's file and insert it under the header's closing `---` line. To look something up, search the `### [YYYY-MM-DD] operation | Subject` headings across `_logs/` for the date, operation, or page you need, then read only those entries.

## Version control (git)

- The vault is a git repository. **A commit marks the end of the verify step:** it is the moment changes become part of the baseline.
- I make the commit (see [[Setting Up Git for the Coppermind]]).
