---
type: glossary
status: draft
aliases:
  - Catastrophic Interference
courses:
  - SAIL
sources:
  - "[[SRC - RAG vs Fine-Tuning vs Prompt Engineering]]"
  - "[[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End]]"
related:
  - "[[Fine-Tuning]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> **Catastrophic forgetting:** when a [[Fine-Tuning|fine-tuned]] model loses some of its general capabilities while it is learning specialized ones ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]]). IBM's video calls it "perhaps most importantly of all" the downsides of fine-tuning ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]]). Richard Sutton describes the same effect in deep learning generally: training on something new will often "catastrophically interfere with all the old things that you knew," which he calls "exactly bad generalization" ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Current architectures generalize poorly out of distribution"]]).

**Used in:** [[Fine-Tuning]], [[Out-of-Distribution Generalization]], [[Retrieval-Augmented Generation vs. Fine-Tuning vs. Prompt Engineering]]
