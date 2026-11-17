---
type: glossary
status: draft
aliases:
  - RNN
  - RNNs
  - Long Short-Term Memory
courses:
  - SAIL
sources:
  - "[[SRC - Attention Is All You Need]]"
related:
  - "[[Self-Attention]]"
  - "[[Neural Network]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> **Recurrent neural network (RNN):** a sequence model that processes input one position at a time, each step depending on the one before; with variants such as long short-term memory, RNNs were the state of the art for language modeling and translation before the transformer ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=2|Vaswani et al., p. 2]]). Their step-by-step nature prevents parallel computation within a training example, the constraint the [[Transformer|transformer]] was designed to remove ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=2|Vaswani et al., p. 2]]).

**Used in:** [[Self-Attention]], [[Deep Learning]]
