---
type: summary
status: draft
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
related:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
## Executive Summary
The OWASP GenAI Security Project's 2026 list ranks the ten most critical security risks for applications built on large language models (LLMs).[^1] The project leads' thesis is to stop trying to build a model that cannot be fooled and instead build the system around it, so nothing important breaks when it is.[^2] For the first time, the ranking weights a practitioner vote at three-quarters and a corpus of real incidents at one-quarter.[^2] The leads report that the two sometimes disagree: [[Prompt Injection|prompt injection]] ranks first by vote but falls out of the top ten by incident count, while misinformation shows the reverse.[^2] The 2026 order moved [[Excessive Agency]] to third and renamed System Prompt Leakage as [[Hidden Context Exposure]].[^3] The list covers the model as a component; when the model acts with tools and memory, it points to the OWASP Agentic Top 10.[^3]

## Main Points
- Prompt injection stays first because every untrusted input is an attack surface.[^2]
- Several entries absorbed newer risks, such as cross-modal injection and insecure AI-generated code.[^3]
- Each entry gives a description, common examples, mitigations, and attack scenarios.[^4]
- Defense against prompt injection is described as architectural rather than interceptive.[^5]

## Themes
- Assume compromise; limit the consequences.
- Practitioner belief tested against incident evidence.

## Key Takeaways
- Explicit: work all ten, start at the top, and build each for the day the model is turned against you.[^6]
- [inferred] Security for LLM applications depends more on permissions and system design than on the model's own safeguards.

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=3|OWASP, p. 3]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=5|OWASP, p. 5]]
[^3]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]
[^4]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, pp. 10–16]]
[^5]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=13|OWASP, p. 13]]
[^6]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=8|OWASP, p. 8]]
