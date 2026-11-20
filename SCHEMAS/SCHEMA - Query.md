---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-19
verified_on: 2026-11-19
---
How I ask the wiki a question, and how an answer gets filed back.

## Asking the wiki a question

1. **Think (me).** I ask a question.
2. **Calculate (agent).** The agent answers **from the wiki first**, citing wiki pages.
   - Find the pages by searching file names, `aliases:` lines, and page text in `Wiki/`; read only the pages the answer needs.
   - Prefer verified pages, and label anything drawn from a draft.
   - Quote my Perspectives only as my view.
   - If the wiki can't answer, say what's missing instead of filling the gap. Outside knowledge is labeled as outside knowledge.
3. **Verify (me).** I check the answer against the cited pages and decide whether to file it back.
4. **File back (optional).** If I say so, the agent saves the answer as a draft in `Wiki/Analyses/` from the `Analysis` template, following [[SCHEMA - Writing Pages]]. It then goes through normal verification, and the index gets its line.
5. **Log** the question, the pages used, and whether it was filed back (operation: `query`).
