---
type: glossary
status: draft
aliases:
  - RAG
courses:
  - SAIL
sources:
  - "[[SRC - RAG vs Fine-Tuning vs Prompt Engineering]]"
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
part_of:
  - "[[Retrieval-Augmented Generation vs. Fine-Tuning vs. Prompt Engineering]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> **Retrieval-augmented generation (RAG):** a way to improve a model's answers by retrieving relevant, up-to-date information from a corpus, adding it to the prompt, and generating a response from that enriched context.[^1] Retrieval works by meaning rather than keywords: the query and the documents are converted into vector [[Embedding|embeddings]] and matched by similarity.[^1] OWASP calls it the most familiar case of an LLM application that converts content into numerical representations ([[Embedding|embeddings]]) and uses similarity search to decide what the model sees.[^2] OWASP treats a RAG corpus as an attack surface for [[Prompt Injection|prompt injection]],[^3] [[Data and Model Poisoning|poisoning]],[^4] and [[Vector and Embedding Weaknesses|embedding attacks]].[^2]

**Used in:** [[Retrieval-Augmented Generation vs. Fine-Tuning vs. Prompt Engineering]], [[Prompt Injection]], [[Vector and Embedding Weaknesses]]

## Footnotes
[^1]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 1]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=50|OWASP, p. 50]]
[^3]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, p. 10]]
[^4]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=33|OWASP, p. 33]]
