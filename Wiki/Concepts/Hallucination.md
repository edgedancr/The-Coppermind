---
type: concept
status: draft
aliases: ["AI Hallucination", "Hallucinated Citation"]
courses: ["SAIL", "Intro to Intelligence"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]", "[[SRC - Intro to Intelligence Class Notes (Fall 2026)]]", "[[SRC - ACH GenAI Workflow]]", "[[SRC - OWASP Top 10 for LLM Applications 2026]]", "[[SRC - Current AI Models Have 3 Unfixable Problems]]"]
related: ["[[Capability vs. Reliability]]", "[[Transformer]]", "[[Critiques of Large Language Models]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> A hallucination is fluent, confident AI output that is false. In SAIL's main example, [[Mata v. Avianca (2023)]], ChatGPT invented a legal case that looked real; the model was not retrieving records but filling in the gaps of what it needed with fiction ([[SAIL Class Notes (Fall 2026)#9/1/26|SAIL notes, 9/1/26]]).

## Key Points
- SAIL calls hallucination ==a feature, not a bug== ([[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]).
- SAIL's explanation: the model gets the meaning of a word wrong. It searches for meanings, and we cannot always know whether the meaning it finds is the one we were looking for ([[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]).
- In the [[Three-Ps Risk Framework]], hallucinations are a program-level risk ([[SAIL Class Notes (Fall 2026)#8/27/26|SAIL notes, 8/27/26]]).
- In [[Analysis of Competing Hypotheses]], a matrix with no contradictions means the AI is "hallucinating agreement" ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).
- Detective Mennen told an Intro to Intelligence class that AI will "mess up or hallucinate," so verifying it is necessary ([[Intro to Intelligence Class Notes (Fall 2026)#10/1/26|Intro notes, 10/1/26]]).
- In the [[ACH GenAI Workflow]], AI-researched evidence must be tagged [Verified], [Unverified] or [Assumption], and the analyst must confirm each item is real before it enters the matrix, because the AI may hallucinate sources, fabricate data, or mischaracterize reports ([[SRC - ACH GenAI Workflow|ACH Workflow, Orchestrator and Step 2]]).
- OWASP lists hallucination as one cause of LLM misinformation, which becomes a system-level failure when false output drives decisions, tool calls, or code ([[OWASP Top 10 for LLM Applications 2026.pdf#page=43|OWASP, p. 43]]). It is also a common trigger of [[Excessive Agency]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=23|OWASP, p. 23]]). Coding assistants hallucinate plausible but nonexistent package names, which attackers register in advance ("slopsquatting"); see [[AI Supply Chain Compromise]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=28|OWASP, p. 28]]).
- **Hossenfelder's account:** hallucinations happen when an LLM answers a factual question with words that have no relation to reality, typically when the correct answer wasn't in the training data or appeared only a few times. LLMs don't search their training data for an answer, she says; they look for a string of words close to a correct answer, and if every option has low probability they still give one, which is then unlikely to be right ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 2]]).
- **A proposed fix and its critic:** she reports that OpenAI researchers proposed rewarding models for acknowledging uncertainty, so that a low-probability best answer becomes "I don't know." Mathematician Wei Xing criticized this, arguing users expect a correct reply, not "I don't know" ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 2]]).
- Hossenfelder thinks both are partly right: if "I don't know" is rare it will be good enough, and it would stop users believing false answers. ==Hallucinations "will likely never be solved completely, but I think that's okay"== ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 2]]). See [[Critiques of Large Language Models]].

> [!caution] Accuracy check
> The "wrong meaning of a word" explanation in my notes may be a simplification of how hallucinations happen. Check it against the 3Blue1Brown videos or another reading before verifying.
> Possibly resolved by [[SRC - Current AI Models Have 3 Unfixable Problems]], ch. 2.
