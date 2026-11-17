---
type: concept
status: draft
aliases:
  - Fine Tuning
  - Fine-Tuned Model
courses:
  - SAIL
sources:
  - "[[SRC - RAG vs Fine-Tuning vs Prompt Engineering]]"
part_of:
  - "[[Retrieval-Augmented Generation vs. Fine-Tuning vs. Prompt Engineering]]"
applies_to:
  - "[[Large Language Model]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> Fine-tuning takes an existing model that already has broad knowledge and gives it additional, specialized training on a focused dataset ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]]). Unlike retrieval or better prompting, ==it changes the model itself, making small adjustments to the weights the model learned in pre-training== ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]]). IBM's video presents it as one of three ways to get better answers from a [[Large Language Model|large language model]], alongside [[Retrieval-Augmented Generation|retrieval-augmented generation]] and [[Prompt Engineering|prompt engineering]] ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 1]]).

## Key Points
**How it works** ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]])
- Fine-tuning updates the model's internal [[Parameter|parameters]]. The weights start where [[Pre-Training|pre-training]] left them, and training on the specialized dataset adjusts them slightly.
- It typically uses supervised learning (see [[Machine Learning]]): input-output pairs that show the kind of responses wanted. To fine-tune for technical support, for example, you might provide thousands of customer queries, each paired with a correct technical response.
- The model adjusts its weights through [[Backpropagation|backpropagation]] to shrink the difference between its predicted outputs and the target responses.
- The presenter says this does more than teach the model new facts: it changes how the model processes information, so it learns to recognize domain-specific patterns.

**Strengths** ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]])
- Deep domain expertise.
- Faster than RAG at inference time, because it doesn't search external data, and no separate vector database to maintain, because the knowledge is "baked into the model's weights."

**Costs** ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]])
- Thousands of high-quality training examples.
- Substantial computing cost, requiring many GPUs.
- Maintenance: updating a fine-tuned model takes another round of training, whereas RAG can add documents to its knowledge base at any time.
- [[Catastrophic Forgetting|Catastrophic forgetting]], which the presenter calls "perhaps most importantly of all" the risks.

## Why It Matters
- In the video's legal AI example, fine-tuning helps the model master firm-specific policies, while RAG retrieves cases and prompt engineering enforces document formats ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 4]]). See [[Retrieval-Augmented Generation vs. Fine-Tuning vs. Prompt Engineering]].
