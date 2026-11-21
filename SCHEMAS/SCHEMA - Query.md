---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-20
verified_on: 2026-11-20
---
How I ask the wiki a question, and how an answer gets filed back.

## Asking the wiki a question

1. **Think (me).** I ask a question. I may name a depth (quick, standard, or deep); if I don't, it is standard.
2. **Calculate (agent).** The agent answers **from the wiki first**, citing wiki pages.
   - Decide the [[#Question types|type]] and the [[#Depth|depth]], and say both in one line at the top of the answer.
   - Search `Wiki/Analyses/` first: if I already filed an answer to this question, start from it and check whether it is still current ([[#Filing an answer back]]).
   - Find the pages by searching file names, `aliases:` lines, and page text in `Wiki/`; read only the pages the answer needs.
   - Prefer verified pages, and label anything drawn from a draft.
   - Quote my Perspectives only as my view.
   - If the wiki can't answer, say what's missing instead of filling the gap. Outside knowledge is labeled as outside knowledge.
3. **Verify (me).** I check the answer against the cited pages and decide whether to file it back.
4. **File back (optional).** If I say so, the agent saves the answer as a draft ([[#Filing an answer back]]). It then goes through normal verification, and the index gets its line.
5. **Log** the question, its type and depth, the pages used, and whether it was filed back (operation: `query`).

## Depth

I name the depth when I ask ("quick: what is X?", "deep: how do X and Y relate?"). The page counts are a guide to effort, not a quota. If the agent reaches the cap with more it should have read, it says so in the answer.

| Depth | How far the agent goes | What I get |
|---|---|---|
| **Quick** | Aliases, Glossary, and the one or two most likely pages. About 3 pages at most. | A few sentences, citations, and the confidence line. Not filed back unless I ask. |
| **Standard** (default) | Searches names, aliases, and page text; reads what the answer needs, about 8 pages at most. | The answer in the shape of its type, with every part of [[#Every answer]]. |
| **Deep** | Standard, plus one hop along the typed links ([[SCHEMA - Writing Pages#Typed links]]) from the pages it found, in both directions: the page's own link properties, and pages whose properties name it. It follows `contradicts` and `counters` on purpose, so the answer has the opposing view. About 15 pages at most. | The full shape, with counter-evidence that was looked for. The agent suggests filing it back. |

## Question types

The type sets the shape of the answer. If a question fits more than one type, the agent picks the closest and says which. A type changes the shape, never the rules in [[#Every answer]].

| Type | Example | Shape of the answer |
|---|---|---|
| **Lookup** | "What is automation bias?" | The answer in a few sentences, one or two citations. |
| **Compare** | "How does ACH differ from a red team analysis?" | A table with one row per dimension and one column per item, cited in each cell. Then what the difference means. |
| **Synthesis** | "What do my courses say about trust in AI?" | Themes, each with the course or source it comes from named, so the courses' views stay separate. |
| **Disagreement** | "Where do my sources disagree on X?" | Each position with who holds it, built from `contradicts` links and `Sources disagree` callouts, then what the disagreement turns on. No winner unless a source gives one. |
| **Gap** | "What don't I know about X?" | What the wiki covers, what it doesn't, and what kind of source would fill each gap. |

## Every answer

- **Bottom line first**, in two or three sentences.
- **A confidence line:** how many verified and how many draft pages the answer rests on, plus whether any of it is outside knowledge. Example: "Rests on 3 verified and 2 draft pages; one point is outside knowledge."
- **Counter-evidence.** Say what contradicts, counters, or complicates the answer, with citations. If the agent looked and found none, it says "none found in the pages read" and, at standard depth, that it didn't follow links.
- **Sources and my views stay apart.** What the wiki's sources say goes in the body. If one of my Perspectives bears on the question, it gets its own short labeled part, quoted as my view and never as a fact.
- **Outside knowledge in a labeled block,** in the `> [!warning] Unsourced background — verify or remove` form from `AGENTS.md`, never mixed into the cited text.
- **Gaps:** what the wiki couldn't answer, and a suggestion of what source would help. The agent doesn't add to `Ingestion/Triage.md` unless I ask.
- **Citations** follow [[SCHEMA - Writing Pages]]. Anything from a draft page is labeled as such.

## Filing an answer back

The agent suggests filing an answer back when it **synthesizes three or more pages**, is **likely to be asked again**, or **exposes a gap or a disagreement** worth keeping. A lookup that one page already answers isn't worth filing. The agent suggests; I decide, and a quick answer is filed only if I ask.

- **Search first.** Before drafting, the agent searches `Wiki/Analyses/` by file name, the `question:` property, and page text. If a page already answers the question, the agent updates it as a draft instead of making a second one; if the question is close but different, it asks me which I want. Changing a verified analysis follows [[SCHEMA - Review#Changing a verified page]].
- **Draft it** from the `Analysis` template, following [[SCHEMA - Writing Pages]]. The page keeps the type and depth of the question, lists the pages it used, and says in `re_ask_if` what would make the answer worth asking again.
- **My Perspectives are linked, not quoted,** in a filed analysis: put them in `related`. Quoting my view as mine is for chat answers.
- **Stale analyses.** An analysis may be out of date when a page it cites changed, or when a later ingest added pages on its topic, after its `asked_on` date. When the agent opens an analysis for any reason and sees this, or `re_ask_if` applies, it says so and offers to re-ask the question. It doesn't update the analysis on its own.
