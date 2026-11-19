---
type: concept
status: draft
aliases:
  - Generalization
  - Out-of-Distribution
  - Transfer
courses:
  - SAIL
sources:
  - "[[SRC - Current AI Models Have 3 Unfixable Problems]]"
  - "[[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End]]"
part_of:
  - "[[Critiques of Large Language Models]]"
related:
  - "[[Continual Learning]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> Generalization is how training on one thing affects what a system does on other things;[^1] out-of-distribution generalization is handling cases beyond the examples a model was trained on. Sabine Hossenfelder argues current models can't truly do this; quoting Gary Marcus, ==they "interpolate, they don't extrapolate"==.[^2]

## Key Points
**Hossenfelder**[^2]
- Image and video generators work well within their training examples but produce "garbage" beyond them, like failed attempts to get Veo 3 to show Jupiter removing asteroids with a vacuum cleaner.
- LLMs are good at summarizing, drafting emails, and producing things similar to what exists, but struggle with anything new, which she calls the biggest obstacle to using them in science.
- She also calls the models "purpose bound": trained to find patterns in particular types of data, not an abstract thinking device usable for any purpose.[^3]

**[[Richard Sutton]]**[^1]
- "We're not seeing transfer anywhere." There are very few automated techniques to promote it, and none are used in modern [[Deep Learning|deep learning]].
- ==Gradient descent "will make you solve the problem," but not generalize well.== Where models do generalize well, Sutton says, the researchers sculpted it.
- Training on something new often "catastrophically interfere[s]" with what a network knew, which he calls "exactly bad generalization." See [[Catastrophic Forgetting]].
- Generalization always happens; the question is whether it is good or bad. If a problem has only one solution, finding it isn't generalization.
- LLMs are too uncontrolled to test this: no one knows what they saw in training.

> [!caution] Sources disagree
> Patel: LLMs have widened the scope of generalization, from basic arithmetic to Math Olympiad problems, and coding agents are getting better at choosing good designs.[^1] vs. Sutton: "There's nothing in them which will cause it to generalize well";[^1] and Hossenfelder: "they can't generalize".[^2]

## Why It Matters
- Both critics treat poor generalization as a reason current models won't reach [[Artificial General Intelligence|AGI]],[^2].[^1]

## Footnotes
[^1]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Current architectures generalize poorly out of distribution"]]
[^2]: [[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 4]]
[^3]: [[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 2]]
