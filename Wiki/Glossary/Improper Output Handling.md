---
type: glossary
status: verified
aliases:
  - LLM10
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on: 2026-11-22
---
> [!summary]
> **Improper output handling:** insufficient validation, sanitization, and handling of model output before it is passed to other components and systems.[^1] Because prompt input can control that output, OWASP likens it to giving users indirect access to extra functionality; exploits can include cross-site scripting, privilege escalation, or remote code execution.[^1] In 2026 it also covers the insecure code that AI assistants generate at scale.[^2]

**Used in:** [[OWASP Top 10 for Large Language Model Applications]]

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=55|OWASP, p. 55]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]
