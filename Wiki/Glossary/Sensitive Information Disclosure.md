---
type: glossary
status: draft
aliases:
  - LLM02
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> **Sensitive information disclosure:** when an LLM-integrated system exposes confidential, regulated, privileged, or proprietary data through a channel the data's owner did not authorize ([[OWASP Top 10 for LLM Applications 2026.pdf#page=18|OWASP, p. 18]]). OWASP stresses that the final answer is only one channel: reasoning traces, tool-call arguments, retrieved chunks, logs, embeddings, and even response timing or length can leak ([[OWASP Top 10 for LLM Applications 2026.pdf#page=18|OWASP, p. 18]]). It ranks second on the 2026 list, the one place at the top where OWASP says belief and evidence agree ([[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]).

**Used in:** [[OWASP Top 10 for Large Language Model Applications]]
