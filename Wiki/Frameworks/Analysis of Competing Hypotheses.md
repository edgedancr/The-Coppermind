---
type: framework
status: draft
aliases: ["ACH"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]"]
counters: ["[[Confirmation Bias]]"]
related: ["[[Richards Heuer]]", "[[Prompt Engineering]]", "[[Capability vs. Reliability]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> Analysis of Competing Hypotheses (ACH) is a structured analytic technique that reverses the usual order of analysis: instead of starting from a conclusion and gathering support for it, the analyst lists every plausible hypothesis and uses the evidence to disprove them ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]). SAIL taught that it was developed by [[Richards Heuer]] at the CIA in 1999 to counteract [[Confirmation Bias]] ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).

## The Great Inversion
- **Normal analysis (advocacy):** intuition → conclusion → gather evidence to support it ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).
- **ACH (rigor):** generate *all* plausible hypotheses → use evidence to *disprove* each → ==the survivor is the answer== ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).

## Components: The Six Stages
1. **Hypotheses:** generate all plausible explanations, at least four, including deeply uncomfortable ones.
2. **Evidence:** list what is actually known versus what is merely assumed.
3. **Matrix (the engine):** cross the evidence against the hypotheses and mark each cell Supports (S), Contradicts (C), or Neither (N).
4. **Refine.**
5. **Conclude.**
6. **Sensitivity check:** identify the critical point of failure.

Source for the stages: ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]])

> [!todo] Gap in my notes
> Stages 4 (Refine) and 5 (Conclude) have no description in my notes.

## How to Use It With AI
LLMs pattern-match to the most plausible, fluent narrative, so by default they do normal analysis (confirmation bias), not ACH's elimination logic ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).

**Do** ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]])
- Force at least four hypotheses, explicitly including political or internal adversarial motives.
- Prompt the AI strictly step by step: hypotheses, then evidence, then the matrix.
- Demand honest contradiction marks. ==If the matrix has no contradictions, the AI is hallucinating agreement.==
- Run the stage 6 sensitivity check to find the critical point of failure.

**Don't** ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]])
- Ask the AI for a conclusion first. It will instantly generate a plausible narrative and skip the analysis.
- Trust a matrix filled entirely with S or N marks. That is confirmation bias rendered in table form.
- Mistake the AI's formatting fluency for analytic rigor.
- Confuse "would I sign this polished memo?" with "is this conclusion actually correct?"

## Limits and Cautions
- The Coppermind's own link types (`supports`, `contradicts`, `related`) are modeled on ACH's S/C/N marks; see [[SCHEMA#5. Linking rules and ontology|Schema §5]].
