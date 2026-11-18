---
type: glossary
status: draft
aliases:
  - Rule of Two
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> **Lethal trifecta:** Simon Willison's (2025) pre-deployment check: an AI agent that can at once access private data, ingest untrusted content, and communicate externally has the conditions for high-impact exploitation, and removing any one of the three removes them ([[OWASP Top 10 for LLM Applications 2026.pdf#page=13|OWASP, p. 13]]). OWASP pairs it with Meta's **Rule of Two** (2025) as a minimum: an agent with untrusted input, sensitive data, and the ability to change state or communicate externally needs human approval for each action ([[OWASP Top 10 for LLM Applications 2026.pdf#page=14|OWASP, p. 14]]).

**Used in:** [[Prompt Injection]], [[Excessive Agency]]
