---
type: concept
status: draft
aliases:
  - LLM Critiques
  - LLMs Are a Dead End
  - Limits of LLMs
courses:
  - SAIL
sources:
  - "[[SRC - Current AI Models Have 3 Unfixable Problems]]"
  - "[[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End]]"
  - "[[SRC - The Catastrophic Risks of AI and a Safer Path]]"
applies_to:
  - "[[Large Language Model]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> Some researchers and commentators argue that [[Large Language Model|large language models]] (LLMs), however much they are scaled, will not reach [[Artificial General Intelligence|artificial general intelligence]]. Sabine Hossenfelder argues they can't reason abstractly, can't be protected from prompt injection, and can't generalize ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 4]]). [[Richard Sutton]] argues they are ==about mimicking people, not figuring out what to do== ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]]).

## Key Points
**Hossenfelder's problems**
- **Purpose-bound:** trained to find patterns in certain types of data, not usable for any purpose ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 2]]).
- **[[Hallucination]]:** not much of a problem in her view; it "will likely never be solved completely," but she thinks "that's okay" ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 2]]).
- **[[Prompt Injection]]:** "basically impossible to solve," because LLMs can't tell instructions from input ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 3]]).
- **[[Out-of-Distribution Generalization|Generalization]]:** "they interpolate, they don't extrapolate" (quoting Gary Marcus) ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 4]]).
- **Her alternative:** abstract reasoning networks, "a kind of logic language without words," with world models and neurosymbolic reasoning as steps toward them ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 5]]).

**Sutton's critique** ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]])
- **No [[World Model|world model]]:** they predict what a person would say, not what will happen.
- **No goal:** next-token prediction "doesn't change the world," so it isn't a substantive goal.
- **No ground truth:** with no goal, there is no right thing to say, so no feedback on what was right.
- **No surprise:** if the unexpected happens, they don't adjust.
- **Imitation, not experience:** they learn from "here's what a person did," which never happens in an agent's normal life ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Do humans do imitation learning?"]]). See [[Continual Learning]].

**Counterarguments from Dwarkesh Patel** ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]])
- LLMs seem to have "very robust world models," the best made in AI to date.
- Next-token prediction is itself a goal, and models trained toward math goals won gold at the International Math Olympiad.
- Imitation can give a good prior for later learning from experience.

> [!caution] Sources disagree
> Bengio: on his chart's trend, AI would reach human level in about five years ([[TED - Yoshua Bengio, The Catastrophic Risks of AI and a Safer Path (transcript)|Bengio, ch. 11]]). vs. Hossenfelder: current models won't get there given more time ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, intro]]).

## Why It Matters
- Hossenfelder predicts the revenue expected to justify AI companies' valuations will evaporate, though the models will keep their uses ([[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 4]]).
- Sutton expects LLMs to be superseded by systems that learn from experience, another case of the [[Bitter Lesson]] ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]]).
