---
type: concept
status: draft
aliases:
  - LLM
  - LLMs
  - Large Language Models
courses:
  - SAIL
sources:
  - "[[SRC - Large Language Models Explained Briefly]]"
  - "[[SRC - AI, Machine Learning, Deep Learning, and Generative AI Explained]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
part_of:
  - "[[Generative AI]]"
related:
  - "[[Transformer]]"
  - "[[Foundation Model]]"
  - "[[Emergent Behavior]]"
  - "[[Critiques of Large Language Models]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> 3Blue1Brown defines a large language model (LLM) as ==a sophisticated mathematical function that predicts what word comes next for any piece of text==, assigning a probability to every possible next word ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 2]]). A chatbot works by laying out a script of a conversation between a user and an AI assistant and having the model predict the assistant's reply one word at a time ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 1–2]]). IBM's explainer calls an LLM an example of a [[Foundation Model|foundation model]] ([[IBM Technology - AI, Machine Learning, Deep Learning, and Generative AI Explained (transcript)|IBM Technology video, ch. 5]]).

## Key Points
**How it produces text** ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 2]])
- Picking less likely words at random along the way makes output sound more natural, so although the model itself is deterministic, the same prompt usually gets a different answer each time.

> [!caution] Sources disagree
> 3Blue1Brown: an LLM predicts the next word, repeatedly ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 2]]); SAIL: it finds "the most likely next word" ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]). vs. IBM: "they're not predicting the next word. They're predicting the next sentence, the next paragraph, the next entire document" ([[IBM Technology - AI, Machine Learning, Deep Learning, and Generative AI Explained (transcript)|IBM Technology video, ch. 5]]).

**What sets its behavior: parameters**
- Its behavior is "entirely determined" by continuous values called [[Parameter|parameters]] or weights; the "large" refers to having hundreds of billions of them ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 3]]). SAIL described an LLM as having about 140 billion parameters, and said no one knows exactly why they work as well as they do ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]]).
- No human sets them. They start at random and are refined on example text: the model predicts the last word of each example, and [[Backpropagation|backpropagation]] nudges every parameter toward the right answer ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 4]]).

**Training**
- **[[Pre-Training|Pre-training]]** on enormous amounts of text, mostly from the internet. A person reading the text used to train GPT-3 nonstop would need over 2,600 years ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 3]]).
- The computation for the largest models would take "well over 100 million years" at a billion operations per second ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 5]]). It is only possible on GPUs, chips built to run many operations in parallel ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 6]]).
- **[[Reinforcement Learning with Human Feedback]]** then tunes the model to be a good assistant, since autocompleting internet text is a different goal ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 6]]).

**Architecture**
- Before 2017, most language models processed text one word at a time. The [[Transformer|transformer]], introduced that year by a team at Google, takes it all in at once, in parallel ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 7–8]]). See [[Self-Attention]].

## Why It Matters
- Researchers design the framework, but ==the model's specific behavior is "an emergent phenomenon"== of how its parameters were tuned, so it is very hard to say why it makes a given prediction ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 10]]). See [[Emergent Behavior]].
- For arguments that LLMs will not reach general intelligence, see [[Critiques of Large Language Models]].
