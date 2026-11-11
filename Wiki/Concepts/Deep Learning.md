---
type: concept
status: draft
aliases: ["DL"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]"]
part_of: ["[[Machine Learning]]"]
related: ["[[Transformer]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
Deep learning is the form of machine learning that learns implicitly, using depth to build progressively more abstract representations ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]). SAIL taught that ==deep learning shifted AI from discriminative to generative== ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]).

## Key Points
- **Why "deep" matters:** depth allows progressive abstraction ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]):
	- simple representations (edges in images, tones in audio, word fragments in text)
	- → combinations (shapes, phonemes, phrases)
	- → high-level concepts (objects such as faces or cars, words and meanings, strategies or intents).
- **Examples:** convolutional neural networks (CNNs) for images; RNNs and [[Transformer|transformers]] for text ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]).

**Milestones** ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]])
- **ImageNet competition (2012), "the Big Bang of modern AI":** deep learning was unlocked by combined breakthroughs in CNNs (specialized networks tailored to kinds of pattern recognition), GPUs (making training on very large datasets feasible), and reinforcement learning.
- **AlphaGo (2016), "when AI learned strategy":** Go has more positions than atoms in the universe (2.08 × 10¹⁷⁰). AlphaGo won by combining deep learning (recognizing patterns in board positions) with reinforcement learning (improving through self-play and rewards). It showed AI could learn something close to strategic intuition, not just rules, and adapt to a player's moves, demonstrating the power of learning representations plus learning actions.

> [!caution] Accuracy check
> My notes list reinforcement learning as one of the three breakthroughs behind the 2012 ImageNet result. Reinforcement learning is usually associated with AlphaGo rather than ImageNet; check the slide or a reading before verifying.
