---
type: glossary
status: verified
aliases:
  - Feed-Forward Network
  - Feed-Forward Layer
courses:
  - SAIL
sources:
  - "[[SRC - Large Language Models Explained Briefly]]"
  - "[[SRC - Attention Is All You Need]]"
part_of:
  - "[[Transformer]]"
related:
  - "[[Neural Network]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on: 2026-11-23
---
> [!summary]
> **Feed-forward neural network:** the second core operation in a [[Transformer|transformer]] layer, alongside attention, which 3Blue1Brown says gives the model extra capacity to store patterns about language learned in training.[^1] In the original paper, it is applied to each position separately and identically: two linear transformations with a [[Sigmoid Function|ReLU]] between them.[^2]

**Used in:** [[Transformer]]

## Footnotes
[^1]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 8]]
[^2]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=5|Vaswani et al., p. 5]]
