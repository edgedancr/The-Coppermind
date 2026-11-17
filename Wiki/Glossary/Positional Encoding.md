---
type: glossary
status: draft
aliases:
  - Positional Encodings
courses:
  - SAIL
sources:
  - "[[SRC - Attention Is All You Need]]"
part_of:
  - "[[Transformer]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> **Positional encoding:** information about each token's position, added to its [[Embedding|embedding]] so the [[Transformer|transformer]] can use word order, since it has no recurrence to track it ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=6|Vaswani et al., p. 6]]). The original paper used sine and cosine waves of different frequencies, and found learned positional embeddings gave nearly identical results ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=6|Vaswani et al., p. 6]]).

**Used in:** [[Transformer]], [[Self-Attention]]
