---
type: concept
status: draft
aliases:
  - LLM Critiques
  - LLMs Are a Dead End
  - Limits of LLMs
courses:
  - SAIL
  - Intro to Intelligence
sources:
  - "[[SRC - Current AI Models Have 3 Unfixable Problems]]"
  - "[[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End]]"
  - "[[SRC - The Catastrophic Risks of AI and a Safer Path]]"
  - "[[SRC - AI and Biblical Thinking (Bible Study Fellowship)]]"
applies_to:
  - "[[Large Language Model]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> Some researchers and commentators argue that [[Large Language Model|large language models]] (LLMs), however much they are scaled, will not reach [[Artificial General Intelligence|artificial general intelligence]]. Sabine Hossenfelder argues they can't reason abstractly, can't be protected from prompt injection, and can't generalize.[^1] [[Richard Sutton]] argues they are ==about mimicking people, not figuring out what to do==.[^2]

## Key Points
**Hossenfelder's problems**
- **Purpose-bound:** trained to find patterns in certain types of data, not usable for any purpose.[^3]
- **[[Hallucination]]:** not much of a problem in her view; it "will likely never be solved completely," but she thinks "that's okay".[^3]
- **[[Prompt Injection]]:** "basically impossible to solve," because LLMs can't tell instructions from input.[^4]
- **[[Out-of-Distribution Generalization|Generalization]]:** "they interpolate, they don't extrapolate" (quoting Gary Marcus).[^1]
- **Her alternative:** abstract reasoning networks, "a kind of logic language without words," with world models and neurosymbolic reasoning as steps toward them.[^5]

**Sutton's critique**[^2]
- **No [[World Model|world model]]:** they predict what a person would say, not what will happen.
- **No goal:** next-token prediction "doesn't change the world," so it isn't a substantive goal.
- **No ground truth:** with no goal, there is no right thing to say, so no feedback on what was right.
- **No surprise:** if the unexpected happens, they don't adjust.
- **Imitation, not experience:** they learn from "here's what a person did," which never happens in an agent's normal life.[^6] See [[Continual Learning]].

**Yann LeCun's view, as [[John Lennox]] reports it**[^9]
- Lennox notes "vast differences of opinion" on whether LLMs will lead to AGI, and finds it interesting that "someone of the stature of Yann LeCun" doesn't believe they will.
- LeCun has announced "a huge billion-dollar company," which the transcript gives as "Ami, the French for friend," for "artificial mechanical intelligence."
- His argument, in Lennox's words: "LLMs are never going to bring AGI… What we need is an AI system developed to model the physical world." See [[World Model]].

> [!caution] Accuracy check
> The company's name and what it stands for come from an auto-captioned transcript of Lennox speaking from memory. Check them against a news source or LeCun's own announcement.

**Counterarguments from Dwarkesh Patel**[^2]
- LLMs seem to have "very robust world models," the best made in AI to date.
- Next-token prediction is itself a goal, and models trained toward math goals won gold at the International Math Olympiad.
- Imitation can give a good prior for later learning from experience.

> [!caution] Sources disagree
> [[Yoshua Bengio|Bengio]]: on his chart's trend, AI would reach human level in about five years.[^7] vs. Hossenfelder: current models won't get there given more time.[^8]

## Why It Matters
- Hossenfelder predicts the revenue expected to justify AI companies' valuations will evaporate, though the models will keep their uses.[^1]
- Sutton expects LLMs to be superseded by systems that learn from experience, another case of the [[Bitter Lesson]].[^2]

## Footnotes
[^1]: [[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 4]]
[^2]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]]
[^3]: [[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 2]]
[^4]: [[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 3]]
[^5]: [[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 5]]
[^6]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Do humans do imitation learning?"]]
[^7]: [[TED - Yoshua Bengio, The Catastrophic Risks of AI and a Safer Path (transcript)|Bengio, ch. 11]]
[^8]: [[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, intro]]
[^9]: [[Bible Study Fellowship - AI and Biblical Thinking (transcript)|Lennox interview, ch. 2]]
