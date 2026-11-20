---
type: glossary
status: verified
aliases:
  - Catastrophic Interference
courses:
  - SAIL
sources:
  - "[[SRC - RAG vs Fine-Tuning vs Prompt Engineering]]"
  - "[[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on: 2026-11-20
---
> [!summary]
> **Catastrophic forgetting:** when a [[Fine-Tuning|fine-tuned]] model loses some of its general capabilities while it is learning specialized ones.[^1] IBM's video calls it "perhaps most importantly of all" the downsides of fine-tuning.[^1] Richard Sutton describes the same effect in deep learning generally: training on something new will often "catastrophically interfere with all the old things that you knew," which he calls "exactly bad generalization".[^2]

**Used in:** [[Fine-Tuning]], [[Out-of-Distribution Generalization]], [[Retrieval-Augmented Generation vs. Fine-Tuning vs. Prompt Engineering]]

## Footnotes
[^1]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]]
[^2]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Current architectures generalize poorly out of distribution"]]
