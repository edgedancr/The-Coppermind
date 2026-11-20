# The Coppermind: start here

This folder is the Coppermind, Harrison Nickles's LLM wiki (his SAIL portfolio): an Obsidian vault of Markdown pages. It runs on one rule: **Harrison designs, the AI drafts, Harrison verifies.** Nothing becomes part of the wiki as final until he has reviewed and approved it.

**This is the only file you read every time.** It holds the rules that apply to every task and tells you which rule files in `SCHEMAS/` your task needs. Read those, and only those. Where this file, a rule file, and an instruction in chat disagree, ask Harrison before acting.

## Which rule files to read

| The task | Also read (all in `SCHEMAS/`) |
|---|---|
| Answering a question from the wiki (query) | `SCHEMA - Query.md` |
| Ingesting a source | `SCHEMA - Ingest.md` and `SCHEMA - Writing Pages.md` |
| Drafting or editing a wiki page or source card outside an ingest | `SCHEMA - Writing Pages.md` (only the sections the edit touches) |
| Changing a verified page, or marking a page verified when told to | `SCHEMA - Review.md` |
| A health check | `SCHEMA - Health Check.md` |
| Changing a rule file, a template, a tool in `Tools/`, or the Nicrosil plugin (any file in its folder, even a one-line style tweak) | `SCHEMA - Changes.md` |
| Archiving the log, fixing the index, or anything about git | `SCHEMA - Index and Log.md` |
| Moving the vault to another tool, or testing an export | `SCHEMA - Export.md` |
| Understanding the vault's layout and what each folder is for | `SCHEMA.md` |

More than one row can apply. Don't read `Schema Changelog.md` unless you are adding a line to it or are asked about the rules' history.

## Rules for every task

**Scope.** In scope by default: material for any course Harrison is taking including readings, course documents, and his own assignments, plus related articles, books, reports, and other sources that bear on what those courses cover (the topics, frameworks, events, and people they discuss). Out of scope: personal notes, anything about security clearance paperwork, and personal information about classmates or other private individuals. If a source clearly fits neither group, ask Harrison before ingesting it; don't silently skip it or ingest it. A related article still follows every other rule (source card, citations, drafts only). If a source mentions a classmate, refer to them by role ("a teammate"), not by name.

**Drafts only.** The agent creates and edits pages only as `status: draft`. Only Harrison makes a page `verified`, by setting it himself, clicking Nicrosil's Verify button, or telling the agent "mark it verified" for that specific page. If you change the content of a verified page (only when he asks), the same edit sets it back to `draft`, keeps its `verified_on`, and adds a `changes_since_verified` line; see `SCHEMA - Review.md`. Purely mechanical fixes, like updating a link after a rename, don't reset the status but are still logged.

**Permissions.**

| Location | The agent may | The agent may not |
|---|---|---|
| `Sources/` (original files) | Read | Edit, rename, move, or delete |
| `Sources/Source Cards/` | Create and edit as drafts | Set the final reliability rating |
| `Wiki/` | Create and edit drafts | Mark a page verified without Harrison's explicit instruction |
| `Perspectives/` | Read, and quote as *Harrison's* view in answers | Write or edit anything |
| `SCHEMAS/` and `AGENTS.md` | Read, and suggest changes in chat | Edit, unless he asks for a specific change |
| `index.md`, `log.md`, `Logs/` | Maintain | Delete or rewrite past log entries |
| `Ingest Queue.md` | Maintain and keep current | Reorder, drop, or skip batches, unless he asks |
| `Health Checks/` | Create a report for each health check; record his decisions in it | Change a saved report's findings, or delete a report |
| `Tools/` | Read; build or revise a tool when he asks | Edit, rename, or delete otherwise |
| `_templates/`, `.obsidian/` | Use | Change, unless he asks |

The agent never deletes anything except a draft it created that Harrison rejected.

**Voices.** A wiki page reports what sources say and attributes every claim: to the author, the course (named, with the date in the footnote), or a guest lecturer by name. Harrison's own views never appear in a wiki page as fact; they live in `Perspectives/` or a `## My Take` section only he writes. Never write his opinions for him. Never turn a line from his notes into a neutral fact about the world ("SAIL taught X" is not "X is true"). If you can't tell whose view a line is, flag it instead of guessing. Details: `SCHEMA - Writing Pages.md`.

**No unsourced claims.** Every factual claim is cited. Background no source in the vault provides goes in a `> [!warning] Unsourced background — verify or remove` callout.

**Bookkeeping at the end of every operation.**
- **Index:** when an operation adds, removes, or renames a page in `Wiki/`, `Perspectives/`, or `Sources/Source Cards/`, update `index.md`: one line per page, `- [[Page Name]] — one-line summary`, alphabetical under its type (in Concepts and Glossary, under the page's first-letter heading, `### A`, or `### 0–9` for a name that starts with a digit; add a heading for a new letter and remove one that empties), with the type's count, the total, and the **Jump to** line's links at the top kept right (a link reads `[[#Concepts (94)|Concepts]]`, so it changes when the count does). A change of status doesn't change the index.
- **Log:** append one entry to the end of `log.md` for every ingest, query, health check, verification, schema change, and tool change. Past entries are never rewritten; corrections go in a new entry. Format:

  ```
  ### [YYYY-MM-DD] operation | Subject

  - **Think:** what Harrison asked for and what he said matters
  - **Calculate:** what the agent drafted, proposed, or flagged
  - **Verify:**
    - Approved: [[Page]], [[Page]]
    - Revised: [[Page]] — what he changed and why
    - Rejected: "Page title" — why (not saved)
    - Links rejected: [[A]] → supports → [[B]] — why
  - **Commit:** suggested commit message
  ```

  Operations: `setup`, `ingest`, `query`, `health-check`, `verify`, `schema`, `tool`. If Harrison revises or rejects something without saying why, ask him for a one-sentence reason and record it.
- **Commit:** suggest a message in the form `ingest: SAIL notes 8/27/26 — 4 approved, 1 revised, 1 rejected`. Harrison makes the commit.

**Nicrosil.** Any edit to a file in `.obsidian/plugins/nicrosil/`, even a one-line style tweak, is a tool change. Read `SCHEMA - Changes.md` before you start. In the same edit, without being asked, bump the version in `manifest.json` and the Nicrosil guide, update the guide and its version history, and log it as `tool`.

## Saving tokens

- **Never read `log.md` whole.** It is long. To add an entry, append to the end of the file (a shell append, or read only its last 30 or so lines first). To look something up, search its `### [date] operation | Subject` headings, or the month files in `Logs/`.
- **Find existing pages by searching**, not by reading `index.md`: search file names and `aliases:` lines in `Wiki/` and `Sources/Source Cards/`. Read and edit only the section of `index.md` you are changing. Without a shell or search tool, list the folders, or read the index.
- **In `Ingest Queue.md`, read only the batch you are working on.**
- **Read the `Nicrosil` guide or the plugin's code only when working on Nicrosil**, and a page's template only when drafting that type of page.
- **For a health check, run `Tools/health-check/coppermind_check.py` first**; it does the mechanical checks so you don't have to read every page for them.
