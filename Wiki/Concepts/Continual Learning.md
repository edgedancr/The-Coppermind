---
type: concept
status: draft
aliases:
  - Experiential Learning
  - On-the-Job Learning
  - Era of Experience
courses:
  - SAIL
sources:
  - "[[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End]]"
supports:
  - "[[Critiques of Large Language Models]]"
related:
  - "[[Reinforcement Learning]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> Continual learning is learning during an agent's normal interaction with the world, rather than in a separate training phase before deployment ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]]). Dwarkesh Patel's summary of [[Richard Sutton]]'s view: ==LLMs can't learn on the job, so no amount of scaling will be enough==; a new architecture will be needed, after which agents will learn on the fly "like all humans, and indeed, like all animals" ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, introduction]]).

## Key Points
- **The experiential paradigm:** Sutton describes life as a stream of sensation, action, and reward; intelligence alters actions to increase the rewards, and knowledge is about the stream, so it can be tested against the stream and learned continually ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "The Era of Experience"]]).
- **Weights, not context:** Patel asks how an agent would hold all the context a new employee picks up. Sutton answers that in LLMs that information has to go into the context window, but in continual learning "it just goes into the weights" ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "The Era of Experience"]]).
- **The big world hypothesis:** people become useful on the job because they meet their own part of the world, which "can't all have been put in in advance." Sutton calls the LLM dream that "you can teach the agent everything" in advance mistaken for this reason ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "The Era of Experience"]]).
- **Learning from more than reward:** agents learn from all their sensations, not just the reward signal ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "The Era of Experience"]]).
- **What mammals have and AI lacks:** Patel notes that all mammals can learn continually but AI can't, while AI can solve hard math problems almost no animal can; Sutton names this Moravec's paradox ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Do humans do imitation learning?"]]).
- **Sharing across copies:** a digital intelligence could learn once and copy what it learned into new instances, which Sutton calls "a huge savings" ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "The Era of Experience"]]).

> [!caution] Sources disagree
> Patel: LLMs could be the prior or foundation on which experiential learning is built ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]]). vs. Sutton: you can always start with human knowledge, but in practice that approach "has always turned out to be bad" ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]]).

## Why It Matters
- **A security risk:** Sutton warns that if spawned copies learn and report back, folding their knowledge in could corrupt the central mind: the bits "could have viruses in them, they could have hidden goals." He asks how to have cybersecurity "in the age of digital spawning" ([[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Will The Bitter Lesson still apply after AGI?"]]). Compare [[Prompt Injection]] and [[Data and Model Poisoning]].
- See [[Catastrophic Forgetting]] for why training on new things can damage old knowledge.
