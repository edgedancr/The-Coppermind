---
type: concept
status: draft
aliases:
  - The Bitter Lesson
courses:
  - SAIL
sources:
  - "[[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End]]"
supports:
  - "[[Critiques of Large Language Models]]"
developed_by:
  - "[[Richard Sutton]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> "The Bitter Lesson" is a 2019 essay by [[Richard Sutton]], which Dwarkesh Patel calls perhaps the most influential essay in the history of AI.[^1] As Sutton states it in the interview, ==methods that use human knowledge are eventually superseded by methods that learn from experience and computation==.[^1] Patel's reading is that human hand-tuning scales much worse than compute, which grows exponentially.[^2]

## Key Points
- **Why it keeps happening:** you can always start with human knowledge and then add scalable methods, but in practice "it has always turned out to be bad." People get locked into the human-knowledge approach and "get their lunch eaten by the methods that are truly scalable".[^1]
- **Weak vs. strong methods:** early AI called general methods such as search and learning "weak" and methods built on human knowledge, such as symbolic systems, "strong." Sutton says the weak methods "have just totally won".[^3]
- **AlphaZero as an example:** it improved on AlphaGo by not using human knowledge, learning only from experience.[^2]
- **Not a law:** Sutton calls it "an empirical observation about a particular period in history," 70 years that need not predict the next 70.[^2]

**Are [[Large Language Model|LLMs]] a case of it?**[^1]
- Patel notes people cite the essay to justify scaling LLMs, as the one way found to pour huge amounts of compute into learning.
- Sutton calls it "an interesting question": LLMs scale with computation up to the limits of the internet, but they also put in lots of human knowledge. He expects them to reach the limits of their data and be superseded by systems that learn from experience, which would be "another instance of the bitter lesson."

## Why It Matters
- It is the core of Sutton's case that LLMs are a dead end; see [[Critiques of Large Language Models]]. Compare [[Scaling Laws]].

## Footnotes
[^1]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Are LLMs a dead end?"]]
[^2]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Will The Bitter Lesson still apply after AGI?"]]
[^3]: [[SRC - Richard Sutton, Father of RL Thinks LLMs Are a Dead End|Sutton interview, "Surprises in the AI field"]]
