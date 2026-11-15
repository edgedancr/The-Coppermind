---
type: source
status: draft
source_type: reading
author: OWASP GenAI Security Project (project lead Steve Wilson, co-lead Rock Lambros)
date: 2026-08-04
file: Sources/Readings/OWASP Top 10 for LLM Applications 2026.pdf
courses:
  - SAIL
reliability:
credibility:
ingested:
  - Pages 1–57, front matter and all ten entries (2026-11-14)
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
## What It Is
The 2026 edition of the OWASP Top 10 for LLM Applications, a 122-page ranked list of the ten most critical security risks for applications built on large language models, from the OWASP GenAI Security Project. Each entry has a description, common examples, prevention strategies, and attack scenarios. It is licensed CC BY-SA 4.0. The original is in `Sources/Readings/`.

## Reliability Notes
**Proposed B-2** (usually reliable; probably true). OWASP is an established open security community, and this edition checks a practitioner vote against a corpus of 7,714 real incidents and cites research for its claims. But this copy is marked "Version 2026" with "[Publication date to be set]" above "August 4th, 2026" on its cover, so it may differ from the final release. Harrison sets the final rating.

## Ingest Progress
- **Pages 1–57** (cover, letter from the project leads, what's new, and LLM01–LLM10): ingested 2026-11-14.
- **Used only for cross-links:** Appendix A, Related Framework Mappings (pp. 58–105), for the link to MITRE ATLAS.
- **Skipped:** the license page, Appendix B (pp. 106–107, figures with no text), references, and acknowledgements. Each entry's long lists of research incidents were summarized, not reproduced.

> [!todo] Gap in the source
> Three figures carry information the text doesn't repeat: Figure 1 (rank changes from 2025 to 2026, p. 6), Figure 2 (attack-surface "bullseye," p. 9), and Figure 3 (supply-chain threat model, p. 27). They weren't ingested.
