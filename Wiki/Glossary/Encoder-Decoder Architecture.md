---
type: glossary
status: verified
aliases:
  - Encoder-Decoder
  - Encoder
  - Decoder
courses:
  - SAIL
sources:
  - "[[SRC - Attention Is All You Need]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
part_of:
  - "[[Transformer]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on: 2026-11-21
---
> [!summary]
> **Encoder-decoder architecture:** a model structure in which an encoder maps an input sequence to continuous representations, and a decoder then generates the output one symbol at a time, feeding each output back in as input for the next.[^1] The original [[Transformer|transformer]] used one, with six layers in each half.[^2] SAIL described it as built for translation: English → numbers, then numbers → Spanish.[^3]

**Used in:** [[Transformer]], [[Self-Attention]]

## Footnotes
[^1]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=2|Vaswani et al., p. 2]]
[^2]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=3|Vaswani et al., p. 3]]
[^3]: [[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]
