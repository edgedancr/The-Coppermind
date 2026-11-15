---
type: concept
status: draft
aliases:
  - AI Bias
courses:
  - SAIL
sources:
  - "[[SRC - Algorithmic Bias and Fairness (Crash Course AI 18)]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
related:
  - "[[Data and Model Poisoning]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> Algorithmic bias is the idea that, because algorithms are created by people and use people's data, ==biases that exist in the real world are mimicked or even exaggerated by AI systems== ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, intro]]). Crash Course AI separates bias, which everyone has because our brains take shortcuts by finding patterns, from discrimination against [[Protected Class|protected classes]], which society has laws to prevent ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, intro]]).

## Key Points
**Five types**, of the "at least 5" Crash Course AI says to watch ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, intro]])
1. **Hidden social bias in training data.** Text from news and books links "nurse" with women and "programmer" with men, and image searches show the same pattern; a search for "programmer 1960" shows many more women, a cultural change algorithms are poor at recognizing ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 2]]). Leaving protected classes out of the data doesn't prevent discrimination, because they can return as [[Correlated Feature|correlated features]] ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 2]]).
2. **Too few examples of a class.** Many facial-recognition systems are trained on far more white faces than others; one passport photo checker had trouble with photos of people of Asian descent ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 3]]).
3. **Hard-to-quantify features.** AI essay graders for tests like the SAT and GRE measured sentence length, vocabulary, and grammar rather than clarity, structure, and creativity; MIT students generated nonsense essays that scored highly ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 4]]).
4. **Feedback loops.** The algorithm influences the data it later learns from, creating a [[Positive Feedback Loop|positive feedback loop]], as with [[PredPol]] ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]).
5. **Intentional manipulation.** In 2016, Microsoft's Twitter chatbot Tay began posting violent, sexist, antisemitic, and racist tweets within 12 hours, after a "coordinated attack by a subset of people" biased its data set; Microsoft's Xiaoice in China (2014) had over 40 million conversations with no incidents ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 6]]).

**The "HireMe!" thought experiment** ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 7]])
- A hypothetical hiring AI predicts that John-Green-bot is unlikely to last because past "Johns" were fired; he is rejected, the rejection is fed back in, and future Johns' chances drop further.
- It might also link higher age to weaker digital skills and suggest hiring younger applicants: illegal discrimination by age, and a link that may not even be true.
- Algorithms can link two kinds of data without explaining why, so humans must check recommendations for fairness.

**Proposed solutions** ([[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 8]])
- Understand that algorithms will be biased, and be critical of recommendations instead of accepting that "the computer said so."
- [[Algorithmic Transparency]], though the hidden layers of deep learning are hard to interpret.
- More training data on protected classes, to check for discrimination. Crash Course calls this a double-edged sword, since members of those groups may worry about privacy or being targeted.
- Some advocate testing algorithms for "side effects" the way medicines are tested; the episode says nothing like that was in the works.

## Why It Matters
- SAIL lists bias at scale, where small model bias becomes systemic outcomes, as one path in the [[Cascade of Unintended Consequences]] ([[SAIL Class Notes (Fall 2026)#9/1/26|SAIL notes, 9/1/26]]), and biased data as a program-level vulnerability in the [[Three-Ps Risk Framework]] ([[SAIL Class Notes (Fall 2026)#8/27/26|SAIL notes, 8/27/26]]).
