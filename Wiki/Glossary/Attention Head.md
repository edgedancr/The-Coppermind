---
type: glossary
status: draft
aliases:
  - Attention
courses:
  - SAIL
sources:
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - Attention Is All You Need]]"
part_of:
  - "[[Transformer]]"
  - "[[Self-Attention]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-11
---
> [!summary]
> **Attention head:** in a transformer, a single thing a token is compared against (for example, adjectives); each additional comparison is another attention head. A *query vector* is what goes and finds everything that matches the attention head.[^1] The original transformer ran eight heads in parallel, letting the model attend to different kinds of information at different positions,[^2] and its authors found that individual heads learn to perform different tasks.[^3]

**Used in:** [[Transformer]], [[Self-Attention]]

## Footnotes
[^1]: [[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]
[^2]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=5|Vaswani et al., p. 5]]
[^3]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=7|Vaswani et al., p. 7]]
