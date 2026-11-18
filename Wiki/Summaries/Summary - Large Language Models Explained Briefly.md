---
type: summary
status: draft
courses:
  - SAIL
sources:
  - "[[SRC - Large Language Models Explained Briefly]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
## Executive Summary
3Blue1Brown's short video explains that a [[Large Language Model|large language model]] (LLM) is a mathematical function that predicts what word comes next, assigning a probability to every possible next word ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 2]]). A chatbot repeatedly asks the model to continue a script of a conversation between a user and an AI assistant ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 1–2]]). The model's behavior is set by hundreds of billions of [[Parameter|parameters]], refined during [[Pre-Training|pre-training]] with [[Backpropagation|backpropagation]] ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 3–4]]) and then by [[Reinforcement Learning with Human Feedback|reinforcement learning with human feedback]] ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 6]]). Since 2017, the [[Transformer|transformer]] has made this practical by processing text in parallel, using [[Self-Attention|attention]] ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 7–8]]). Because the behavior emerges from training, it is hard to tell why a model predicts what it does ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 10]]).

## Main Points
- Sampling less likely words makes output more natural, so the same prompt usually gets a different answer each time ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 2]]).
- Training the largest models would take well over 100 million years at a billion operations per second ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 5]]).
- This scale depends on GPUs, chips built to run many operations in parallel ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 6]]).

## Themes
- Scale as the source of capability.
- Designed framework, emergent behavior.

## Key Takeaways
- Explicit: the specific behavior of an LLM is "an emergent phenomenon" of training ([[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 10]]).
- [inferred] Fluent output comes from prediction, not from looking anything up.
