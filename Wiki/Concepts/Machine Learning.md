---
type: concept
status: draft
aliases: ["ML"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]"]
related: ["[[Artificial Intelligence]]", "[[Deep Learning]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> Machine learning (ML) is the step in SAIL's progression of AI that comes after statistics and before deep learning ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]]). SAIL described early approaches, such as Markov chains and the McCulloch & Pitts artificial neuron, as trying every path until one happens to be correct, then replicating it ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]]).

## Key Points
**Two types of problems** ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]])
- **Classification** (*What is it? What are its qualities and categories?*): decision trees, ChatGPT, email spam detection, fraud detection. Old-fashioned AI needed far more hand-written rules than is practical to replicate what modern LLMs can do.
- **Regression** (*How much? What are its quantities and measurements?*): linear regression, neural networks, price forecasting, weather forecasting.

**Learning methods** ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]]) ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]])

| Method | Key idea | Typical tasks |
|---|---|---|
| Supervised | Learn a mapping (x → y) from labeled data | *(not recorded)* |
| Unsupervised | Find hidden structure in x, without labeled data | Clustering, dimensionality reduction |
| Reinforcement | Learn a policy π(a \| s) that maximizes long-term reward, from feedback on actions | Sequential decision making, control problems |
| Deep learning | Learns implicitly | See [[Deep Learning]] |

**Scaling** ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]])
- *Multiplicity (space-bound):* more examples (rows of data) and more diversity (ensembles of models).
- *Complexity (time-bound):* more breadth (features, or columns of data) and more depth ("bigger brains").
- ==The fundamental limit for most ML techniques is good data.== With the data, a lot of value can already be extracted.
- Effective systems match how much of the world they see with how richly they can describe it.
- Training minimizes a cost function; gradient descent points in the fastest direction to reduce local error.

**Other points** ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]])
- LLMs are ML with a very large number of parameters.
- AI uses both example and enthymeme (inductive and deductive) reasoning.

> [!todo] Gap in my notes
> The typical tasks for supervised learning are blank in my 9/10 notes.
