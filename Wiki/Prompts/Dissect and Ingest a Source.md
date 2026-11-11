---
type: prompt
status: verified
aliases:
  - Ingest Prompt
courses:
  - SAIL
applies_to:
  - "[[LLM Wiki]]"
related:
  - "[[SCHEMA]]"
  - "[[Think-Calculate-Verify Loop]]"
  - "[[Verifying Pages with the Review Buttons]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-11
---
> [!summary]
> The prompt I paste when I want the agent to break a source into its ideas and either create new wiki pages from it or add the new information to pages that already exist. It holds only the inputs for each run and the steps [[SCHEMA]] doesn't spell out; everything else (naming, properties, citations, attribution, review, index, log) comes from the schema itself.

## The Prompt
Fill in the five lines at the top. Anything left blank uses the default in brackets.

```
Ingest a source into the Coppermind. Read SCHEMA.md first and follow it. This prompt only adds what the schema doesn't cover; if the two disagree, the schema wins and you tell me.

SOURCE: 
SCOPE: [default: everything not yet listed under "Ingest Progress" on its source card]
WHAT MATTERS: [default: everything substantive; skip assignment logistics, grading, and deadlines]
MODE: [default: plan first. Or "draft directly" to skip the plan step]
VERIFIED PAGES: [default: propose changes only. Or "edit" to change them directly]

1. ORIENT
- If I attached the source and it isn't in Sources/ yet, copy it unchanged into the right subfolder and tell me where it went.
- Read index.md, the source's card in Sources/Source Cards/ if it has one (check Ingest Progress so nothing is ingested twice), and every existing page this source is likely to touch. Search titles and aliases, not just exact names.

2. DISSECT
Before thinking about pages, break the in-scope part of the source into its ideas. For each one, note:
- the claim, in a sentence
- its location (date heading, page number, section, or timestamp)
- its voice: the author, the course and date, a quoted person, or unclear (unclear becomes a "Whose view is this?" flag; never guess)
- its kind: term, concept, framework, case, person, or procedure
If the source is my own work (Sources/My Work/), its arguments are my voice. Don't turn them into wiki claims; list them in the report as material for Perspectives, which I write. Facts my paper takes from another source can be used only if that source is in the vault.

3. DECIDE: APPEND, CREATE, OR SKIP
Check each idea against the wiki:
- APPEND when an existing page already covers the same idea, under any title or alias. Put the new material under the heading of that page's template where it belongs, cite it to the new source, and add the new source card to the page's `sources`. A new name for an existing idea becomes an alias, not a new page.
- CREATE when the idea is distinct and the source gives enough to write the page properly: a definition for a glossary term; roughly 150 words of sourced content for a concept, framework, or case study. Anything thinner becomes a glossary term or a bullet on its parent page. One idea per page; if an append would push a page past about 500 words, propose a split instead.
- SKIP anything out of scope, anything the page already says with nothing new, and anything WHAT MATTERS rules out. List skips in the report.
- For a reading or course document, also draft one summary page following the "In the Coppermind" rules of Wiki/Prompts/Intelligence Community Style Summaries. Not for class notes.

4. RECONCILE WITH WHAT'S THERE
- If the new source fills an open flag on an existing page (a gap, an accuracy check, or unsourced background), add the sourced content but leave the callout in place, with one added line: "> Possibly resolved by [[SRC - ...]], <location>." I resolve it with the Resolve button.
- If the new source disagrees with an existing page, overwrite neither claim. Keep both, each attributed and cited, and add:
  > [!caution] Sources disagree
  > <claim A> (source A) vs. <claim B> (source B)
- Use only these four flag callouts, so the review queue sees them: [!question] Whose view is this?, [!warning] Unsourced background — verify or remove, [!caution] Accuracy check (or "Sources disagree"), [!todo] Gap in my notes (or "Gap in the source").
- Verified pages: by default, don't edit them. Put the exact proposed change in the report as a before/after. If VERIFIED PAGES is "edit", make the change and set the page back to status: draft (Schema §7, item 5).

5. SOURCE CARD
Create the card if it doesn't exist, or update it: propose an Admiralty rating with a one-sentence reason (never set the final rating), and add this ingest under Ingest Progress with today's date and what was skipped.

6. REPORT, THEN BOOKKEEPING
If MODE is "plan first", do steps 1–3, give me sections A–C below as a plan, and stop until I approve it. Otherwise draft everything, then report:
A. Defaults used, and any reading of my request you had to choose
B. Created: [[Page]] (type) — one line each
C. Appended: [[Page]] — what was added; verified pages as a proposed before/after
D. Proposed typed links: [[A]] → relation → [[B]] — one-line reason each
E. Flags: whose view, unsourced background, accuracy checks, sources disagree, gaps, and flags this source may resolve
F. Skipped on purpose, and Perspectives material from my own work
Then update index.md, append the log entry (operation: ingest), and suggest a commit message in the schema's format.
```

## Why It Works
- **It points at the schema instead of copying it.** Naming, properties, typed links, citation formats, attribution, draft vs. verified, permissions, and the index and log formats all live in [[SCHEMA]], so a schema change takes effect without editing this prompt.
- **It dissects before it decides.** Listing every claim with its location and voice first means attribution is settled before any page is written, and create-or-append is decided per idea rather than per page.
- **It writes down the create-or-append rule**, which the schema doesn't have yet: append on a matching title or alias, create only when there's enough to fill the template, and turn new names into aliases.
- **It keeps verified pages safe by default.** Changes to a verified page always need item-by-item review ([[SCHEMA#7. Draft vs. verified|Schema §7]]), so the default is to propose them, not make them.
- **New flags use the four callout types the review plugin reads**, so they show up as badges in the queue and on the [[Dashboard]].

## When Not to Use It
- **Questions to the wiki:** use the query operation instead ([[SCHEMA#10. The three operations|Schema §10]]).
- **Whole-wiki reviews:** use a health check.
- **A single-fact correction to one page:** just ask for the edit.
- **Writing my own views:** Perspectives are mine to write; this prompt only lists material for them.
