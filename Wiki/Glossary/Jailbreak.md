---
type: glossary
status: verified
aliases:
  - Jailbreaking
  - LLM Jailbreak
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
  - "[[SRC - MITRE ATLAS Matrix]]"
part_of:
  - "[[Prompt Injection]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on: 2026-11-24
---
> [!summary]
> **Jailbreak:** the subset of [[Prompt Injection|prompt injection]] in which the attacker's goal is to make the model violate its safety protocols.[^1] OWASP says application-level safeguards help contain it, but effective prevention requires ongoing updates to the model's training and safety mechanisms.[^1] [[MITRE ATLAS]] lists LLM Jailbreak as a technique.[^2]

**Used in:** [[Prompt Injection]]

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=11|OWASP, p. 11]]
[^2]: [[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]
