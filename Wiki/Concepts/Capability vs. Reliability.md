---
type: concept
status: draft
aliases: []
courses: ["SAIL", "Intro to Intelligence"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]", "[[SRC - Intro to Intelligence Class Notes (Fall 2026)]]", "[[SRC - OWASP Top 10 for LLM Applications 2026]]"]
related:
  - "[[Hallucination]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> ==Capability is not reliability.== SAIL drew this lesson from [[Mata v. Avianca (2023)]]: AI is *capable* of generating professional-quality legal language, but it is not *reliable* enough to verify facts or sources on its own, and confusing the two leads to misuse.[^1]

## Key Points
- [[Generative AI]] systems are powerful tools, not authoritative sources. They can produce fluent, confident output even when it is false.[^1]
- Using AI in high-risk professional settings without verification exposes others to real harm: "Using AI without understanding its limits is not innovation; it is risk transfer."[^1]
- Intro to Intelligence's AI video analysis exercise ended with two takeaways: "Detail doesn't carry the same weight as documentation," and "Precision does not excuse lack of accuracy."[^2]

> [!todo] Gap in my notes
> The 11/10 notes list the video's claims and the two takeaways, but not what the exercise concluded about the video itself.

- The OWASP Top 10 for LLM applications describes a related failure, **misinformation** (LLM07): incorrect or misleading output that appears credible enough to influence a decision, an automated workflow, or an agent's action. Its core risk is that ==the incorrect output is trusted and acted upon==, and OWASP names overreliance as a key factor, since people and systems treat fluent, confident, well-structured output as authoritative.[^3] Its remedies include a "claim-check-act" pattern that separates generating a claim from acting on it.[^4] See [[OWASP Top 10 for Large Language Model Applications]].
- The remedy is to always think, calculate, then verify; see [[Think-Calculate-Verify Loop]].[^1]

## Footnotes
[^1]: [[SAIL Class Notes (Fall 2026)#9/1/26|SAIL notes, 9/1/26]]
[^2]: [[Intro to Intelligence Class Notes (Fall 2026)#11/10/26|Intro notes, 11/10/26]]
[^3]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=43|OWASP, p. 43]]
[^4]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=44|OWASP, p. 44]]
