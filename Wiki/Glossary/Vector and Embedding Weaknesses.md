---
type: glossary
status: draft
aliases:
  - LLM09
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
> **Vector and embedding weaknesses:** security risks in any LLM application that turns content into numerical representations and uses similarity search to decide what the model sees, as in [[Retrieval-Augmented Generation|RAG]].[^1] They exploit the geometry of the embedding space rather than the model's instruction-following; OWASP sums them up as: poisoning makes the system wrong, inversion makes it leak, jamming makes it silent, and access-control failure makes it indiscriminate.[^1] Embedding inversion, for example, can recover source text from stored vectors.[^2]

**Used in:** [[OWASP Top 10 for Large Language Model Applications]]; see [[Embedding]]

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=50|OWASP, p. 50]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=51|OWASP, p. 51]]
