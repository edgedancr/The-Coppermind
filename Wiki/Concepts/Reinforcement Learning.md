---
type: concept
status: draft
aliases:
  - RL
courses:
  - SAIL
sources:
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End]]"
part_of:
  - "[[Machine Learning]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> Reinforcement learning (RL) is a learning method in which a system learns how to behave in a situation from feedback on its actions.[^1] SAIL described its key idea as ==learning a policy π(a | s) that maximizes long-term reward==, used for sequential decision-making and control problems.[^2] [[Richard Sutton]], one of its founders, calls it "basic AI" because it is about understanding your world.[^3]

## Key Points
**In SAIL's history of AI**
- RL is a step in SAIL's progression: statistics → machine learning → deep learning → reinforcement learning → [[Generative AI|generative AI]] → [[Agentic AI|agentic AI]].[^1]
- It was one of three breakthroughs, with CNNs and GPUs, that unlocked [[Deep Learning|deep learning]] around 2012: a system learning through pure trial and error rather than trained datasets.[^2]
- AlphaGo (2016) combined deep learning, to recognize board patterns, with RL, to improve through self-play and rewards.[^2]

**Sutton's account**
- **Reward defines "right":** in RL there is a right thing to do, the thing that gets you reward, so knowledge can be checked against it.[^3]
- **The reward is arbitrary:** winning at chess, getting nuts for a squirrel, or for an animal, avoiding pain and gaining pleasure, perhaps plus an intrinsic reward for understanding its environment.[^4]
- **Four parts of an agent**:[^4]
	- a **policy**: what to do in the current situation
	- a **value function**: a number saying how well things are going, learned with [[Temporal Difference Learning|TD learning]]
	- **perception**: the agent's sense of where it is now
	- a **transition model of the world**: what will happen if it acts; see [[World Model]]
- **Precedents:** TD-Gammon used TD learning to beat the world's best backgammon players; Sutton calls AlphaGo largely a scaling-up of it, with a new search method.[^5]
- **No imitation in nature:** Sutton argues animals learn by prediction and trial-and-error control, and that supervised learning "is not something that happens in nature".[^6]

## Why It Matters
- Sutton expects systems that learn from experience to supersede [[Large Language Model|large language models]].[^3] See [[Critiques of Large Language Models]] and [[Continual Learning]].
- Compare [[Reinforcement Learning with Human Feedback]], the human-feedback training that tunes LLMs into assistants.

## Footnotes
[^1]: [[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]]
[^2]: [[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]
[^3]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]]
[^4]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "The Era of Experience"]]
[^5]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Surprises in the AI field"]]
[^6]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Do humans do imitation learning?"]]
