---
type: glossary
status: draft
aliases:
  - LLM08
  - System Prompt Leakage
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> **Hidden context exposure:** the unauthorized extraction, inference, or reconstruction of the hidden instructions and context placed in a model's context window, such as the system prompt, developer instructions, and tool schemas.[^1] OWASP advises designing as if hidden context is discoverable: never put credentials in it, and never rely on its secrecy for authorization or content filtering.[^1] It replaced "System Prompt Leakage" on the 2026 list.[^2] In SAIL's [[Bing Sydney Incident (2023)]], prompt injection let users expose hidden system prompts and codenames.[^3]

**Used in:** [[OWASP Top 10 for Large Language Model Applications]], [[Prompt Injection]]

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=46|OWASP, p. 46]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]
[^3]: [[SAIL Class Notes (Fall 2026)#10/1/26|SAIL notes, 10/1/26]]
