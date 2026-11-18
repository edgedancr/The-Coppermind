---
type: summary
status: draft
courses:
  - SAIL
sources:
  - "[[SRC - Attention Is All You Need]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
## Executive Summary
Eight researchers, most at Google Brain and Google Research, propose the [[Transformer|transformer]], ==a sequence model "based solely on attention mechanisms, dispensing with recurrence and convolutions entirely"== ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=1|Vaswani et al., p. 1]]). At the time, [[Recurrent Neural Network|recurrent neural networks]] were the state of the art for tasks like translation, but they process text one position at a time, which blocks parallel computation ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=2|Vaswani et al., p. 2]]). The transformer instead uses [[Self-Attention|self-attention]] to relate every position to every other at once ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=2|Vaswani et al., p. 2]]). It keeps the [[Encoder-Decoder Architecture|encoder-decoder]] structure, with six layers on each side ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=2|Vaswani et al., pp. 2–3]]). It set new records on two translation benchmarks, including 28.4 BLEU on English-to-German, at a fraction of earlier models' training cost ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=1|Vaswani et al., p. 1]]).

## Main Points
- Multi-head attention runs eight attention functions in parallel, each attending to different information ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=5|Vaswani et al., p. 5]]).
- Because there is no recurrence, [[Positional Encoding|positional encodings]] tell the model the order of words ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=6|Vaswani et al., p. 6]]).
- The base model trained in 12 hours on eight GPUs ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=7|Vaswani et al., p. 7]]).
- Individual attention heads appear to learn different tasks, some related to sentence structure ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=7|Vaswani et al., pp. 7, 13–15]]).

## Themes
- Parallelism as the key to scale.
- Simplicity: one mechanism replacing two.

## Key Takeaways
- Explicit: the authors planned to extend attention-based models to images, audio, and video ([[Vaswani et al. - Attention Is All You Need (2017).pdf#page=10|Vaswani et al., p. 10]]).
- [inferred] Removing the sequential bottleneck is what made much larger models practical to train.
