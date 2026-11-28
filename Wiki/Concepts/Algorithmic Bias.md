---
type: concept
status: verified
aliases:
  - AI Bias
courses:
  - SAIL
sources:
  - "[[SRC - Algorithmic Bias and Fairness (Crash Course AI 18)]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - AI Ethics Framework for the Intelligence Community]]"
related:
  - "[[Data and Model Poisoning]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on: 2026-11-28
---
> [!summary]
> Algorithmic bias is the idea that, because algorithms are created by people and use people's data, ==biases that exist in the real world are mimicked or even exaggerated by AI systems==.[^1] Crash Course AI separates bias, which everyone has because our brains take shortcuts by finding patterns, from discrimination against [[Protected Class|protected classes]], which society has laws to prevent.[^1]

## Key Points
**Five types**, of the "at least 5" Crash Course AI says to watch[^1]
1. **Hidden social bias in training data.** Text from news and books links "nurse" with women and "programmer" with men, and image searches show the same pattern; a search for "programmer 1960" shows many more women, a cultural change algorithms are poor at recognizing.[^2] Leaving protected classes out of the data doesn't prevent discrimination, because they can return as [[Correlated Feature|correlated features]].[^2]
2. **Too few examples of a class.** Many facial-recognition systems are trained on far more white faces than others; one passport photo checker had trouble with photos of people of Asian descent.[^3]
3. **Hard-to-quantify features.** AI essay graders for tests like the SAT and GRE measured sentence length, vocabulary, and grammar rather than clarity, structure, and creativity; MIT students generated nonsense essays that scored highly.[^4]
4. **Feedback loops.** The algorithm influences the data it later learns from, creating a [[Positive Feedback Loop|positive feedback loop]], as with [[PredPol]].[^5]
5. **Intentional manipulation.** In 2016, Microsoft's Twitter chatbot Tay began posting violent, sexist, antisemitic, and racist tweets within 12 hours, after a "coordinated attack by a subset of people" biased its data set; Microsoft's Xiaoice in China (2014) had over 40 million conversations with no incidents.[^6]

**The "HireMe!" thought experiment**[^7]
- A hypothetical hiring AI predicts that John-Green-bot is unlikely to last because past "Johns" were fired; he is rejected, the rejection is fed back in, and future Johns' chances drop further.
- It might also link higher age to weaker digital skills and suggest hiring younger applicants: illegal discrimination by age, and a link that may not even be true.
- Algorithms can link two kinds of data without explaining why, so humans must check recommendations for fairness.

**Proposed solutions**[^8]
- Understand that algorithms will be biased, and be critical of recommendations instead of accepting that "the computer said so."
- [[Algorithmic Transparency]], though the [[Hidden Layer|hidden layers]] of [[Deep Learning|deep learning]] are hard to interpret.
- More training data on protected classes, to check for discrimination. Crash Course calls this a double-edged sword, since members of those groups may worry about privacy or being targeted.
- Some advocate testing algorithms for "side effects" the way medicines are tested; the episode says nothing like that was in the works.

**In the Intelligence Community: ODNI's framework**
- The [[ODNI AI Ethics Framework]] aims to minimize [[Undesired Bias|undesired bias]], not all bias: the IC deliberately designs models and chooses data to screen out irrelevant information, focus on foreign targets, and minimize U.S. person information.[^11]
- Undesired bias can enter through data collection, feature extraction, curating and labeling data, model selection and development, and even user training.[^11]
- ODNI asks what types of bias exist in the training data (statistical, contextual, historical, or other), what the trade-offs are between reducing undesired bias and accuracy, and whether the team is diverse enough to minimize human bias.[^12]
- It also asks whether outcomes "cause an inappropriate feedback loop," and wants known biases documented and communicated to anyone who uses the AI or its outputs.[^11][^12]

## Why It Matters
- SAIL lists bias at scale, where small model bias becomes systemic outcomes, as one path in the [[Cascade of Unintended Consequences]],[^9] and biased data as a program-level vulnerability in the [[Three-Ps Risk Framework]].[^10]

## Footnotes
[^1]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, intro]]
[^2]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 2]]
[^3]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 3]]
[^4]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 4]]
[^5]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 5]]
[^6]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 6]]
[^7]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 7]]
[^8]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 8]]
[^9]: [[SAIL Class Notes (Fall 2026)#9/1/26|SAIL notes, 9/1/26]]
[^10]: [[SAIL Class Notes (Fall 2026)#8/27/26|SAIL notes, 8/27/26]]
[^11]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=3|ODNI framework, p. 3]]
[^12]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=4|ODNI framework, p. 4]]
