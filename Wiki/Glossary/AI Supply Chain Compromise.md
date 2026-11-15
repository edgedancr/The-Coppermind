---
type: glossary
status: draft
aliases:
  - LLM04
  - Slopsquatting
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
  - "[[SRC - MITRE ATLAS Matrix]]"
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
related:
  - "[[Data and Model Poisoning]]"
  - "[[MITRE ATLAS]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> **AI supply chain compromise:** tampering with, poisoning, or replacing the third-party parts an AI system is built from, such as pre-trained models, datasets, adapters, conversion pipelines, and deployment platforms, causing biased outputs, security breaches, or failures ([[OWASP Top 10 for LLM Applications 2026.pdf#page=27|OWASP, p. 27]]). It is OWASP's LLM04 (Supply Chain) ([[OWASP Top 10 for LLM Applications 2026.pdf#page=27|OWASP, p. 27]]) and an Initial Access technique in [[MITRE ATLAS]] ([[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]). One newer variant, "slopsquatting": coding assistants invent plausible package names, and attackers register them in advance so the AI's suggestions install malicious code ([[OWASP Top 10 for LLM Applications 2026.pdf#page=28|OWASP, p. 28]]).

**Used in:** [[OWASP Top 10 for Large Language Model Applications]], [[MITRE ATLAS]]
