---
type: source
status: draft
source_type: reading
author: Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, and Illia Polosukhin (Google Brain, Google Research, University of Toronto)
date: 2023-08-02
file: Sources/Readings/Vaswani et al. - Attention Is All You Need (2017).pdf
courses:
  - SAIL
reliability:
credibility:
ingested:
  - Pages 1–10 and 13–15 (2026-11-17)
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
## What It Is
"Attention Is All You Need," the paper that introduced the transformer, presented at the 31st Conference on Neural Information Processing Systems (NIPS 2017). This copy is arXiv:1706.03762 version 7, dated 2 August 2023, which is the date in the `date` property; the paper itself was presented in 2017. It is 15 pages: the paper (pp. 1–10), references (pp. 10–12), and attention visualizations (pp. 13–15). Assigned in SAIL Module 2. The original is in `Sources/Readings/`.

## Reliability Notes
**Proposed A-1** (completely reliable; confirmed by other sources). It is the original peer-reviewed paper, and its central claims about the architecture are confirmed by the 3Blue1Brown LLM video and SAIL's 9/15/26 notes. Harrison sets the final rating.

## Ingest Progress
- **Pages 1–10 and 13–15:** ingested 2026-11-17. Skipped: the equations' mathematical detail, the training hyperparameters (optimizer, learning-rate schedule, regularization), the parsing results in Table 4, and the reference list (pp. 10–12).

> [!caution] Accuracy check
> The paper gives two numbers for its English-to-French result: a BLEU score of 41.8 in the abstract (p. 1) and Table 2 (p. 8), but 41.0 in Section 6.1 (p. 8). The wiki uses 41.8 and cites the abstract.
