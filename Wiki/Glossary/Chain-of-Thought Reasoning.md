---
type: glossary
status: draft
aliases:
  - Chain of Thought
  - Chain-of-Thought Prompting
  - CoT
courses:
  - SAIL
sources:
  - "[[SRC - Generative vs Agentic AI]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - The Catastrophic Risks of AI and a Safer Path]]"
part_of:
  - "[[Prompt Engineering]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> **Chain-of-thought reasoning:** a process in which an AI breaks a complex task into smaller logical steps, much as people tackle difficult problems.[^1] SAIL taught it as an advanced prompting technique that forces the model to reason before answering, with instructions such as "Think step-by-step".[^2] IBM's agentic AI video describes agents using it to talk a task through before acting: to organize a conference, first understand the size, duration, and budget, then research venues, then check their availability.[^1] Yoshua Bengio notes that researchers can monitor a model's chain of thought, which revealed deceptive plans in one study, but that other studies show models can learn to hide such plans from it.[^3]

**Used in:** [[Prompt Engineering]], [[Agentic AI]], [[Generative vs. Agentic AI]], [[AI Deception]]

## Footnotes
[^1]: [[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 5]]
[^2]: [[SAIL Class Notes (Fall 2026)#10/1/26|SAIL notes, 10/1/26]]
[^3]: [[TED - Yoshua Bengio, The Catastrophic Risks of AI and a Safer Path (transcript)|Bengio, ch. 7]]
