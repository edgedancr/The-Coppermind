---
type: glossary
status: draft
aliases:
  - Embeddings
courses:
  - SAIL
sources:
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - Large Language Models Explained Briefly]]"
  - "[[SRC - Attention Is All You Need]]"
part_of:
  - "[[Transformer]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-11
---
> [!summary]
> **Embedding:** taking a token and making a vector out of it. The example in class used 12,288 dimensions ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]). 3Blue1Brown explains why: training works only with continuous values, so each word is encoded as a long list of numbers that may capture its meaning ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 8]]). The original transformer used learned embeddings of 512 dimensions ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=5|Vaswani et al., p. 5]]).

**Used in:** [[Transformer]], [[Tokenization]], [[Retrieval-Augmented Generation]], [[Vector and Embedding Weaknesses]]
