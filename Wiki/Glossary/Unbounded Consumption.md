---
type: glossary
status: draft
aliases:
  - LLM06
  - Denial of Wallet
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> **Unbounded consumption:** when an LLM application allows excessive, uncontrolled inference, letting attackers disrupt service, inflict unsustainable costs, or steal intellectual property by cloning the model.[^1] Its defining trait is cost asymmetry: attackers trigger expensive computation at negligible cost to themselves.[^1] **Denial of wallet** is the variant that exploits pay-per-use pricing to run up costs the provider can't sustain.[^1]

**Used in:** [[OWASP Top 10 for Large Language Model Applications]]

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=38|OWASP, p. 38]]
