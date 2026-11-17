---
type: framework
status: draft
aliases:
  - RAG vs Fine-Tuning vs Prompt Engineering
  - Three Ways to Improve LLM Answers
courses:
  - SAIL
sources:
  - "[[SRC - RAG vs Fine-Tuning vs Prompt Engineering]]"
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> IBM Technology's video lays out three ways to get better answers from a [[Large Language Model|large language model]]: search for new information and add it to the prompt ([[Retrieval-Augmented Generation|retrieval-augmented generation]], or RAG), use a model given extra specialized training ([[Fine-Tuning|fine-tuning]]), or ask a query that better specifies what you want ([[Prompt Engineering|prompt engineering]]) ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 1]]). Each has strengths and costs, and ==they are commonly used in combination== ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 4]]). Use it when deciding how to adapt a model to a task.

## Components
**The problem:** models answer the same question differently because they have different training data and different knowledge cutoff dates ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 1]]).

1. **Retrieval-augmented generation** ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 1]])
	- *How:* retrieve external, up-to-date information from a corpus, such as an organization's spreadsheets, PDFs, and internal wikis; augment the prompt with it; and generate a response from the enriched context.
	- Retrieval matches meaning, not keywords. The query and the documents are turned into vector [[Embedding|embeddings]], so a question about "revenue growth" can find documents about quarterly sales.
	- *Strengths:* up-to-date and domain-specific information.
	- *Costs:* latency from the retrieval step on every query, and the processing and infrastructure for embedding documents and storing them in a database.
2. **Fine-tuning** ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]])
	- *How:* further supervised training of an existing model on a focused dataset, adjusting its weights.
	- *Strengths:* deep domain expertise; faster at inference; no vector database.
	- *Costs:* thousands of high-quality examples, heavy GPU computing, retraining to update, and [[Catastrophic Forgetting|catastrophic forgetting]].
3. **Prompt engineering** ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 3]])
	- *How:* include examples, context, or the desired format in the prompt to direct the model toward patterns it learned in training. "Is this code secure?" is a weak prompt; a detailed one gets more from the same model without new training or data.
	- *Strengths:* no infrastructure changes, and immediate results.
	- *Costs:* "as much an art as it is a science," with trial and error; and it is limited to what the model already knows, so it can't teach it truly new information.

## How to Use It
1. Match the method to the need: prompt engineering for flexibility and immediate results, RAG to extend the model's knowledge with current information, and fine-tuning for deep domain expertise ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 4]]).
2. Combine them. In the video's legal AI system, RAG retrieves specific cases and recent court decisions, prompt engineering ensures proper legal document formats, and fine-tuning helps the model master firm-specific policies ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 4]]).

## Limits and Cautions
- The presenter's one-line trade-offs: prompt engineering "can't extend knowledge," RAG comes "with computational overhead," and fine-tuning "requires significant resources and maintenance" ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 4]]).
- A RAG corpus is also an attack surface: OWASP lists it as a route for [[Prompt Injection|prompt injection]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, p. 10]]) and [[Data and Model Poisoning|poisoning]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=33|OWASP, p. 33]]).
