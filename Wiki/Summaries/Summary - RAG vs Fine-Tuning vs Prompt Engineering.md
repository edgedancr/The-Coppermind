---
type: summary
status: draft
courses:
  - SAIL
sources:
  - "[[SRC - RAG vs Fine-Tuning vs Prompt Engineering]]"
related:
  - "[[Retrieval-Augmented Generation vs. Fine-Tuning vs. Prompt Engineering]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
## Executive Summary
IBM Technology's video, presented by Martin Keen, asks how to improve a [[Large Language Model|large language model]]'s answers, starting from the point that models answer differently because their training data and knowledge cutoff dates differ.[^1] It presents three methods. [[Retrieval-Augmented Generation|Retrieval-augmented generation]] (RAG) retrieves relevant, current information, matched by meaning through vector [[Embedding|embeddings]], and adds it to the prompt, at a cost in latency and infrastructure.[^1] [[Fine-Tuning|Fine-tuning]] gives an existing model further supervised training on a focused dataset; it brings deep expertise but needs many examples and heavy computing, must be retrained to update, and risks [[Catastrophic Forgetting|catastrophic forgetting]].[^2] [[Prompt Engineering|Prompt engineering]] steers the model with examples, context, and format, with no infrastructure change, but can't add knowledge.[^3] Thesis: the three are commonly combined, and the right mix depends on the need.[^4]

## Main Points
- RAG suits up-to-date and domain-specific information.[^1]
- Fine-tuning changes how a model processes information, not just which facts it holds.[^2]
- Prompt engineering is "as much an art as it is a science".[^3]
- A legal AI system could use all three at once.[^4]

## Themes
- Trade-offs among flexibility, knowledge, and cost.
- [inferred] Changing what goes into the model versus changing the model itself.

## Key Takeaways
- Explicit: pick the methods that work for you.[^4]

## Footnotes
[^1]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 1]]
[^2]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]]
[^3]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 3]]
[^4]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 4]]
