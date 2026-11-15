---
type: glossary
status: draft
aliases:
  - RAG
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
related:
  - "[[Embedding]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> **Retrieval-augmented generation (RAG):** the most familiar case of an LLM application that converts content into numerical representations ([[Embedding|embeddings]]) and uses similarity search to decide what the model sees ([[OWASP Top 10 for LLM Applications 2026.pdf#page=50|OWASP, p. 50]]). OWASP treats a RAG corpus as an attack surface for [[Prompt Injection|prompt injection]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, p. 10]]), [[Data and Model Poisoning|poisoning]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=33|OWASP, p. 33]]), and [[Vector and Embedding Weaknesses|embedding attacks]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=50|OWASP, p. 50]]).

**Used in:** [[Prompt Injection]], [[Vector and Embedding Weaknesses]]
