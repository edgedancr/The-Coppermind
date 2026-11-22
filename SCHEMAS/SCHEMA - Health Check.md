---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-22
verified_on: 2026-11-22
---
A health check reviews the whole wiki (or one folder) and saves a short report I can decide from. One is due every 14 days, counted from the date of the newest report in `Health Checks/`. The Dashboard's health check card ([[Nicrosil]]) shows the days since the last one and turns red when the next is overdue. I can ask for one sooner at any time.

## Running a health check

1. **Think (me).** I start a review of the whole wiki or one folder.
2. **Calculate (agent).**
   1. **Run the script first:** `python Tools/health-check/coppermind_check.py` from the vault's top folder (add `--out <file>` to save its output). It needs only Python 3, and it reads files without changing any. It does every mechanical check: footnote problems and old parenthetical citations, cited sources missing from `sources`, broken links and heading links, orphan pages, the typed-link mix and relationships stored twice, open flag callouts, drafts older than 14 days, `changes_since_verified` problems, verified pages edited after their `verified_on` date, `?` placeholders and empty date headings in my notes, index mismatches, the Ingest Queue, and missing or malformed properties. It also lists the pages changed since the last report and a random sample of 20 others.
   2. **Check the script's findings** where they need a judgment (for example, whether an orphan page should be linked or is fine alone).
   3. **Do the judgment checks** on the pages the script listed, unless I asked for the whole wiki or a folder: claims without citations, or citations that don't support the claim; contradictions between pages; typed links that don't hold up, and missing links that should exist; duplicate pages for the same idea; and gaps in the sources the script can't see. Read the cited source sections only for the claims being checked.
   4. **Save the report** in `Health Checks/` (see [[#The report archive]]), written from the `Health Check Report` template: a short summary, one row per check in a table, and the flags as a numbered list with a suggested fix for each. Mechanical fixes are listed separately so I can approve them as a batch ([[SCHEMA - Review#Review size]]).
3. **Verify (me).** I decide how to resolve each flag: fix, accept as is, or defer. The agent changes nothing until I decide, then records each decision in the report.
4. **Commit and log.** The report keeps each flag and how I resolved it. The log entry (operation: `health-check`) links to the report (`Health Check YYYY-MM-DD`) and gives the counts, without repeating each flag. Mechanical fixes (index updates, broken links, formatting) can be approved as a batch.

### The checks

The report's table has one row for each of these, in this order, every time:

- claims without citations, or citations that don't support the claim; footnote markers with no definition, definitions no marker uses, and citations still in the old parenthetical form
- contradictions between pages
- typed links that don't hold up, and missing links that should exist
- the typed-link mix: how many links of each type, the share that are `related`, and any relationship stored twice (on both pages, or as `related` on one page and a stronger type on the other)
- broken links, orphan pages, and duplicate pages for the same idea
- "Whose view?" callouts and unsourced-background callouts still open
- drafts older than 14 days
- verified pages changed since they were verified, and drafts that have `verified_on` but no `changes_since_verified` note, or verified pages that still carry one (the rule files in `SCHEMAS/` are checked like any other page)
- gaps in the sources themselves (unfinished notes, "?" placeholders, empty definitions)
- pages missing from `_index.md`, or index entries for pages that no longer exist
- `Ingestion/Triage.md` out of date: a batch still marked waiting whose sources already have source cards, a batch marked partly ingested (`[~]`) whose sources don't, or a batch that is fully ingested but still listed

`Ingestion/Raw/` is outside every check: the script leaves it out, and the judgment checks don't open it ([[SCHEMA - Ingest#Raw sources]]).

If this list changes, the agent updates the Health Check Report template and the script to match, so the table's rows stay the same in every report.

## The report archive

`Health Checks/` holds one report for each health check, so I can go back and see how the wiki's health has changed. Like Triage, it is not one of the six parts and not a wiki page: reports have no `status`, are not in `_index.md`, and I don't verify them. **The agent writes the reports; I decide each flag in them.**

- **Reports are short.** About one screen, written from the `Health Check Report` template in `_templates/`: a summary callout, a table with one row per check (the same rows every time, so reports can be compared), the flags that need my decision, the mechanical fixes for batch approval, and what changed since the last check.
- **Naming:** `Health Check YYYY-MM-DD`, with ` (2)` added for a second report on the same day. The date is in the name because a report is a record, not a wiki page.
- **Each report links to the one before it** in its `previous` property.
- **A saved report is a record.** As I decide, the agent fills in its Decision lines and keeps its `flags_open` count current. It doesn't change the findings afterward; a new health check makes a new report.
- **`Health Check History.base`** in the folder is a table of every report, newest first, with a view of the reports that still have undecided flags. It is an Obsidian-only convenience ([[SCHEMA - Export]]).
