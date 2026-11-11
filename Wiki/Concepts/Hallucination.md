---
type: concept
status: draft
aliases: ["AI Hallucination", "Hallucinated Citation"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]"]
related: ["[[Capability vs. Reliability]]", "[[Transformer]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
A hallucination is fluent, confident AI output that is false. In SAIL's main example, [[Mata v. Avianca (2023)]], ChatGPT invented a legal case that looked real; the model was not retrieving records but filling in the gaps of what it needed with fiction ([[SAIL Class Notes (Fall 2026)#9/1/26|SAIL notes, 9/1/26]]).

## Key Points
- SAIL calls hallucination ==a feature, not a bug== ([[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]).
- SAIL's explanation: the model gets the meaning of a word wrong. It searches for meanings, and we cannot always know whether the meaning it finds is the one we were looking for ([[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]).
- In the [[Three-Ps Risk Framework]], hallucinations are a program-level risk ([[SAIL Class Notes (Fall 2026)#8/27/26|SAIL notes, 8/27/26]]).
- In [[Analysis of Competing Hypotheses]], a matrix with no contradictions means the AI is "hallucinating agreement" ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).

> [!caution] Accuracy check
> The "wrong meaning of a word" explanation in my notes may be a simplification of how hallucinations happen. Check it against the 3Blue1Brown videos or another reading before verifying.
