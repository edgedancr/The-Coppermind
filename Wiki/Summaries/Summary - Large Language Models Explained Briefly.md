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
3Blue1Brown's short video explains that a [[Large Language Model|large language model]] (LLM) is a mathematical function that predicts what word comes next, assigning a probability to every possible next word.[^1] A chatbot repeatedly asks the model to continue a script of a conversation between a user and an AI assistant.[^2] The model's behavior is set by hundreds of billions of [[Parameter|parameters]], refined during [[Pre-Training|pre-training]] with [[Backpropagation|backpropagation]][^3] and then by [[Reinforcement Learning with Human Feedback|reinforcement learning with human feedback]].[^4] Since 2017, the [[Transformer|transformer]] has made this practical by processing text in parallel, using [[Self-Attention|attention]].[^5] Because the behavior emerges from training, it is hard to tell why a model predicts what it does.[^6]

## Main Points
- Sampling less likely words makes output more natural, so the same prompt usually gets a different answer each time.[^1]
- Training the largest models would take well over 100 million years at a billion operations per second.[^7]
- This scale depends on GPUs, chips built to run many operations in parallel.[^4]

## Themes
- Scale as the source of capability.
- Designed framework, [[Emergent Behavior|emergent behavior]].

## Key Takeaways
- Explicit: the specific behavior of an LLM is "an emergent phenomenon" of training.[^6]
- [inferred] Fluent output comes from prediction, not from looking anything up.

## Footnotes
[^1]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 2]]
[^2]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 1–2]]
[^3]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 3–4]]
[^4]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 6]]
[^5]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 7–8]]
[^6]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 10]]
[^7]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 5]]
