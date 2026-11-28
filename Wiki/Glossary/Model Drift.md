---
type: glossary
status: verified
aliases:
  - Data Drift
  - Distributional Shift
courses:
  - SAIL
sources:
  - "[[SRC - AI Ethics Framework for the Intelligence Community]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-28
verified_on: 2026-11-28
---
> [!summary]
> **Model drift:** the [[ODNI AI Ethics Framework]]'s concern that, ==as time passes and conditions change, the data an AI meets in operation drifts away from the data it was trained on==, so its performance slips from its baseline.[^1][^2] ODNI asks developers to account for "natural data drift within the operational environment compared to training data,"[^1] to decide how much "distributional shift or model drift from baseline performance is acceptable," and to monitor metrics such as accuracy after deployment.[^2] It notes accuracy can change because of an adversary's attempts to disrupt the AI or because of unrelated changes in the operational environment.[^2]

**Used in:** [[ODNI AI Ethics Framework]]; compare [[Out-of-Distribution Generalization]]

## Footnotes
[^1]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=4|ODNI framework, p. 4]]
[^2]: [[ODNI - AI Ethics Framework for the Intelligence Community (2020).pdf#page=6|ODNI framework, p. 6]]
