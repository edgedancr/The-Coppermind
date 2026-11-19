---
type: concept
status: draft
aliases:
  - LLM05
  - Data Poisoning
  - Model Poisoning
  - Training Data Poisoning
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - Algorithmic Bias and Fairness (Crash Course AI 18)]]"
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> OWASP defines data and model poisoning as attacks or failures in which an adversary, or an unsafe process, manipulates data or model artifacts to embed harmful behavior, bias, or exploitable weaknesses in an AI system.[^1] ==Poisoning targets the model's learning process, not a single runtime bug==, so fixing it can mean revalidating data, retraining, or replacing the model rather than patching code.[^1]

## Key Points
- **Intentional or accidental:** malicious poisoning, or poor data hygiene and contaminated sources.[^1]
- **Where it happens**:[^1] pre-training corpora, fine-tuning datasets, stored [[Embedding|embeddings]], reused models (transfer learning), and continuous-learning pipelines that ingest data automatically.
- **Backdoors and "sleeper agents":** shared model files can carry malicious code or tampered settings, and a backdoor may leave behavior untouched until a trigger changes it.[^2]
- **Small amounts are enough:** OWASP cites research finding that as few as 250 poisoned documents compromised models from 600 million to 13 billion parameters, regardless of dataset size.[^2]
- **Examples**:[^3] mislabeled transactions that teach a fraud model to ignore fraud; trigger phrases planted in a widely used open dataset; hidden web instructions that poison an AI's memory; and minimal poisoning of medical training data that still passes standard evaluations.
- **Mitigations**:[^4] track data and model lineage and sign artifacts; validate incoming data and vet vendors; sandbox; watch for anomalies; keep datasets under version control; require human oversight of automated retraining; and red-team for hidden triggers after every alignment cycle, because safety alignment does not remove backdoors.

## Why It Matters
- SAIL warned that U.S. military systems remain vulnerable to data poisoning, sensor spoofing, and model manipulation.[^5] See [[AI in Warfighting]].
- Compare Crash Course AI's "intentional data manipulation": Microsoft's Tay chatbot, trained on Twitter conversations, began posting racist and violent tweets within 12 hours after a coordinated group biased its data set.[^6] See [[Algorithmic Bias]].

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=33|OWASP, p. 33]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=34|OWASP, p. 34]]
[^3]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=34|OWASP, pp. 34–35]]
[^4]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=35|OWASP, p. 35]]
[^5]: [[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]
[^6]: [[Crash Course AI 18 - Algorithmic Bias and Fairness (transcript)|Crash Course AI, ch. 6]]
