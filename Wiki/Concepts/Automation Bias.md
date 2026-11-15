---
type: concept
status: draft
aliases:
  - Oval Office Vulnerability
courses:
  - SAIL
sources:
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
related:
  - "[[Human Decision Point]]"
  - "[[Capability vs. Reliability]]"
  - "[[AI in Intelligence Production]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-11
---
> [!summary]
> Automation bias is the tendency to over-trust confident AI outputs ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]). SAIL called it the core risk of policymaking under AI: at the decision stage, ==confident AI outputs are often mistaken for verified intelligence==, a weakness SAIL called the "Oval Office vulnerability" ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).

## Key Points
- AI-generated assessments are now reaching the highest levels of decision-making ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).
- An open question from class: if the President's Daily Brief contains AI-assisted analysis, should the President know? ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]])
- The OWASP Top 10 for LLM applications calls the same tendency **overreliance**: humans and systems often treat fluent, confident, or well-structured outputs as authoritative, and in agentic systems this overreliance is often built into the design ([[OWASP Top 10 for LLM Applications 2026.pdf#page=43|OWASP, p. 43]]). See [[Capability vs. Reliability]].
