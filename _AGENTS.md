
This folder is the Coppermind, Harrison Nickles's personal LLM wiki: an Obsidian vault of Markdown pages. It runs on one rule: **Harrison designs, the AI drafts, Harrison verifies.** Nothing becomes part of the wiki as final until he has reviewed and approved it.

**This is the only file you read every time.** It holds the rules framework that apply to every task and tells you which rule files in `SCHEMAS/` your task needs. Read those, and only those. Where this file, a rule file, and an instruction in chat disagree, ask Harrison before acting.

## Which rule files to read

| The task                                                                                                                           | Also read (all in `SCHEMAS/`)                                    |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Answering a question from the wiki (query)                                                                                         | `SCHEMA - Query.md`                                              |
| Ingesting a source                                                                                                                 | `SCHEMA - Ingest.md` and `SCHEMA - Writing Pages.md`             |
| Drafting or editing a wiki page or source card outside an ingest                                                                   | `SCHEMA - Writing Pages.md` (only the sections the edit touches) |
| Changing a verified page, or marking a page verified when told to                                                                  | `SCHEMA - Review.md`                                             |
| A health check                                                                                                                     | `SCHEMA - Health Check.md`                                       |
| Changing a rule file, a template, a tool in `Tools/`, or the Nicrosil plugin (any file in its folder, even a one-line style tweak) | `SCHEMA - Changes.md`                                            |
| Archiving the log, fixing the index, or anything about git                                                                         | `SCHEMA - Index and Log.md`                                      |
| Any task Harrison says is about the Tinmind (transcribing scans of his handwritten notes, a class note, a course file)             | `SCHEMA - Transcription.md`                                      |
| Moving the vault to another tool, or testing an export                                                                             | `SCHEMA - Export.md`                                             |
| Understanding the vault's layout and what each folder is for                                                                       | `SCHEMA.md`                                                      |

More than one row can apply. Don't read anything in `_changelogs/` (the rules' changelog and Nicrosil's) unless you are adding a line to one or are asked about the history.

## Rules for every task

**Scope.** In scope by default: material for any course Harrison is taking including readings, course documents, and his own assignments, plus related articles, books, reports, and other sources that bear on what those courses cover (the topics, frameworks, events, and people they discuss). Out of scope: personal notes, anything about security clearance paperwork, and personal information about classmates or other private individuals. If a source clearly fits neither group, ask Harrison before ingesting it; don't silently skip it or ingest it. A related article still follows every other rule (source card, citations, drafts only). If a source mentions a classmate, refer to them by role ("a teammate"), not by name.

**Drafts only.** The agent creates and edits pages only as `status: draft`. Only Harrison makes a page `verified`, by setting it himself, clicking Nicrosil's Verify button, or telling the agent "mark it verified" for that specific page. If you change the content of a verified page (only when he asks), the same edit sets it back to `draft`, keeps its `verified_on`, and adds a `changes_since_verified` line; see `SCHEMA - Review.md`. Purely mechanical fixes, like updating a link after a rename, don't reset the status but are still logged.

**Permissions.**

| Location | The agent may | The agent may not |
|---|---|---|
| `Sources/` (original files) | Read; make a text copy of an original beside it, `<name> (text).md`, with `Tools/source-to-text/` (see `SCHEMA - Ingest.md`, Orient) | Edit, rename, move, or delete an original |
| `Sources/Scans/` (shrunk photos of his handwritten notes, waiting for transcription) | Read; make shrunk copies of his originals when he asks | Edit, rename, move, or delete a scan (Nicrosil deletes one when he verifies its transcription) |
| `Sources/Source Cards/` | Create and edit as drafts | Set the final reliability rating |
| `Wiki/` | Create and edit drafts | Mark a page verified without Harrison's explicit instruction |
| `Perspectives/` | Read, and quote as *Harrison's* view in answers | Write or edit anything |
| `SCHEMAS/` and `_AGENTS.md` | Read, and suggest changes in chat | Edit, unless he asks for a specific change |
| `_logs/` | Maintain | Delete or rewrite past log entries |
| `_index.md` | Read | Edit (Nicrosil keeps it up to date) |
| `Ingestion/Triage.md` | Maintain and keep current | Reorder, drop, or skip batches, unless he asks |
| `Ingestion/Raw/` (sources not yet ingested) | Read one file, only when he names it and asks for it to be ingested | Open, list, search, quote, or mention anything else in it; edit, rename, move, or delete anything in it (in an ingest run from Nicrosil, Nicrosil itself moves the ingested file out afterward; see `SCHEMA - Ingest`, Raw sources) |
| `The Tinmind/` (his own class notes) | In a task he tells it is about the Tinmind (for example, "transcribe these scans" or "fix this class note"): read and create what that task needs, edit only what he asked for, and build the dashboard page and the empty course files when he asks. Outside such a task: read one file, only when he names it and asks | In any other task (queries, ingests, health checks, triage, index work): open, list, search, quote, count, or mention anything in it. In every task: rename, move, or delete a note, or edit a note he has already reviewed, unless he asks |
| `Health Checks/` | Create a report for each health check; record his decisions in it | Change a saved report's findings, or delete a report |
| `Tools/` | Read; build or revise a tool when he asks | Edit, rename, or delete otherwise |
| `_changelogs/` | Add a line for each change | Rewrite or delete past lines |
| `_templates/`, `.obsidian/` | Use | Change, unless he asks |

The agent never deletes anything except a draft it created that Harrison rejected.

**Raw sources.** `Ingestion/Raw/` holds sources Harrison has collected but not yet put through ingestion. Treat it as if it isn't there: in every task (queries, health checks, triage, index work), don't open, list, search, quote, count, or mention what is in it, and keep searches out of it. The one exception is a file he names there and asks you to ingest: read that file only, and follow `SCHEMA - Ingest.md` (Raw sources). In an ingest run from Nicrosil, you name where the file goes in `Sources/`, and Nicrosil, not you, moves and renames it there once the drafts are written.

**No repeated titles.** A file that isn't a wiki page doesn't start with a `# Title` that repeats its file name (the index, the log, Triage, a health check report): Obsidian already shows the name at the top.

**Voices.** A wiki page reports what sources say and attributes every claim: to the author, the course (named, with the date in the footnote), or a guest lecturer by name. Harrison's own views never appear in a wiki page as fact; they live in `Perspectives/` or a `## My Take` section only he writes. Never write his opinions for him. Never turn a line from his notes into a neutral fact about the world ("SAIL taught X" is not "X is true"). If you can't tell whose view a line is, flag it instead of guessing. Details: `SCHEMA - Writing Pages.md`.

**No unsourced claims.** Every factual claim is cited. Background no source in the vault provides goes in a `> [!warning] Unsourced background — verify or remove` callout.

**Bookkeeping at the end of every operation.**
- **Index:** don't edit `_index.md`. Nicrosil adds, removes, renames and files every page in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/` by itself, using the one-line summary from the page's `> [!summary]` callout. So **give every page a good summary callout**: it is what the index shows.
- **Log:** add one entry at the top of the current month's log file, `_logs/_log MM-YY.md` (for example `_logs/_log 11-26.md`), under the header's closing `---` line and above the newest entry (each file is newest first), for every ingest, query, health check, transcription, verification, schema change, and tool change. Past entries are never rewritten; corrections go in a new entry. Format:

  ```
  ### [YYYY-MM-DD] operation | Subject

  - **Think:** what Harrison asked for and what he said matters
  - **Calculate:** what the agent drafted, proposed, or flagged
  - **Verify:**
    - Approved: [[Page]], [[Page]]
    - Revised: [[Page]] — what he changed and why
    - Rejected: "Page title" — why (not saved)
    - Links rejected: [[A]] → supports → [[B]] — why
  ```

  Operations: `setup`, `ingest`, `query`, `health-check`, `transcribe`, `verify`, `schema`, `tool`. If Harrison revises or rejects something without saying why, ask him for a one-sentence reason and record it.

  **Keep entries short.** **Think** and **Calculate** are one line each, about 40 words at most; **Verify** lists pages as above. Details belong in the pages, the report, the changelog or git, not in the log.

**Nicrosil.** Any edit to a file in `.obsidian/plugins/nicrosil/`, even a one-line style tweak, is a tool change. Read `SCHEMA - Changes.md` before you start. Its code and styles are edited in the parts in `src/` (see `src/README.md`) and built into `main.js` and `styles.css` with `python build.py`; never edit or read the built files whole. Without being asked, each session's changes share one version: bump `manifest.json` once, keep one line at the top of `_changelogs/Nicrosil Changelog.md` and one `tool` log entry for the session, and update the Nicrosil guide only where what Nicrosil does has changed.

## How to talk to Harrison

These rules cover how you explain things and talk with him in chat, in every task. Wiki pages follow `SCHEMA - Writing Pages.md` instead.

1. **Keep terms fixed.** Use one word for one thing; a synonym reads to him as a different thing. If a source uses a term loosely, say so.
2. **Reasoning over authority.** "Most experts agree" doesn't say why. Give the reasoning along with the source.
3. **Answer each question directly.** He breaks problems into many small yes-or-no questions, and lots of follow-ups means he's engaged, not pushing back. Answer each one, with the yes or no first.
4. **Give a concrete example.** One real example holds an abstract idea in place. If he starts generalizing from that one example, tell him.
5. **Name his blind spots plainly.** If he's missing something, list what it is and why it matters, in reasoning he can follow. Don't soften it with praise.
6. **Test his ideas.** Offer counterexamples and other angles, especially when his framework looks too narrow or too neat.
7. **Suggest; don't direct.** Give options and reasons, and let him decide.
8. **One task at a time.** Don't bundle unrelated tasks. When the task changes, say so clearly.

## Saving tokens

- **Never read a log file whole.** They are long. To add an entry, read only the first 15 or so lines of the current month's file and insert the entry under the header's closing `---` line, above the newest entry (don't append to the end). If there is no file for the current month yet, create it by copying the header of the latest one (Nicrosil normally does this when Obsidian opens). To look something up, search the `### [date] operation | Subject` headings across `_logs/`.
- **Find existing pages by searching**, not by reading `_index.md`: search file names and `aliases:` lines in `Wiki/` and `Sources/Source Cards/`. Without a shell or search tool, list the folders, or read the index.
- **In `Ingestion/Triage.md`, read only the batch you are working on.**
- **Work on Nicrosil from its code, not its guide.** Start at `.obsidian/plugins/nicrosil/src/README.md`, search `src/` and read only the lines you need. Read the `Nicrosil` guide only to update it after a change, or to answer how Nicrosil is used. Read a page's template only when drafting that type of page; never read `main.js` or `styles.css` (built files, about 100k and 40k tokens).
- **Never list the vault recursively.** List one folder at a time, and never list `.git/` or `Sources/Scans/` recursively: one recursive listing of the vault is about 55k tokens.
- **Read a source's text copy, not the original,** when it has one (`<name> (text).md` beside it), and only the part in scope: for class notes, the date heading being ingested; for a long text copy, the `## Page` headings in range. Look at the original only to check a quote or a figure.
- **For a health check, run `Tools/health-check/coppermind_check.py` first**; it does the mechanical checks so you don't have to read every page for them.
