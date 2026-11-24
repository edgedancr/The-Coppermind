---
type: concept
status: draft
aliases: ["DL"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]", "[[SRC - AI, Machine Learning, Deep Learning, and Generative AI Explained]]", "[[SRC - But What Is a Neural Network]]"]
part_of: ["[[Machine Learning]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> Deep learning is the form of machine learning that learns implicitly, using depth to build progressively more abstract representations.[^1] SAIL taught that ==deep learning shifted AI from discriminative to generative==.[^1]

## Key Points
- **Why "deep" matters:** depth allows progressive abstraction:[^1]
	- simple representations (edges in images, tones in audio, word fragments in text)
	- → combinations (shapes, phonemes, phrases)
	- → high-level concepts (objects such as faces or cars, words and meanings, strategies or intents).
	- 3Blue1Brown's digit network illustrates the same hope: edges in one layer, loops and lines in the next, digits at the end. Parsing speech similarly moves from sounds to syllables to words to phrases.[^2] See [[Neural Network]].
- **IBM's explainer:** deep learning uses [[Neural Network|neural networks]], and is called deep because it has multiple layers of them. Like human brains, it can be unpredictable, and with so many layers it can be hard to work out why it gives the results it does. IBM dates its popularity to the 2010s and calls it the basis of [[Generative AI|generative AI]].[^3]
- **Examples:** convolutional neural networks (CNNs) for images; [[Recurrent Neural Network|RNNs]] and [[Transformer|transformers]] for text.[^1]

**Milestones**[^1]
- **ImageNet competition (2012), "the Big Bang of modern AI":** deep learning was unlocked by combined breakthroughs in CNNs (specialized networks tailored to kinds of pattern recognition), GPUs (making training on very large datasets feasible), and [[Reinforcement Learning|reinforcement learning]].
- **AlphaGo (2016), "when AI learned strategy":** Go has more positions than atoms in the universe (2.08 × 10¹⁷⁰). AlphaGo won by combining deep learning (recognizing patterns in board positions) with reinforcement learning (improving through self-play and rewards). It showed AI could learn something close to strategic intuition, not just rules, and adapt to a player's moves, demonstrating the power of learning representations plus learning actions.

> [!caution] Accuracy check
> My notes list reinforcement learning as one of the three breakthroughs behind the 2012 ImageNet result. Reinforcement learning is usually associated with AlphaGo rather than ImageNet; check the slide or a reading before verifying.

## Footnotes
[^1]: [[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]
[^2]: [[3Blue1Brown - But What Is a Neural Network (transcript)|3Blue1Brown, neural networks, ch. 5]]
[^3]: [[IBM Technology - AI, Machine Learning, Deep Learning, and Generative AI Explained (transcript)|IBM Technology video, ch. 4]]
