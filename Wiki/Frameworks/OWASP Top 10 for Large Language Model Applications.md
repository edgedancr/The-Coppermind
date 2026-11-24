---
type: framework
status: draft
aliases:
  - OWASP Top 10 for LLM Applications
  - OWASP LLM Top 10
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> The OWASP Top 10 for LLM Applications is a ranked list of the ten most critical security risks for applications built on [[Large Language Model|large language models]] (LLMs), from the OWASP GenAI Security Project.[^1] The 2026 edition's guiding posture, in the project leads' words: =="Stop trying to build a model that cannot be fooled. Build the system around it,"== so that when the model is fooled, nothing important breaks.[^2] Reach for it when designing, reviewing, or testing any system that puts an LLM inside an application.

## Components

| # | Risk | In one line |
|---|---|---|
| LLM01 | [[Prompt Injection]] | Any input changes the model's behavior against the developer's intent[^3] |
| LLM02 | [[Sensitive Information Disclosure]] | The system exposes protected data through a channel no one authorized[^4] |
| LLM03 | [[Excessive Agency]] | Too much functionality, permission, or autonomy turns bad output into damaging action[^5] |
| LLM04 | Supply Chain: [[AI Supply Chain Compromise]] | Third-party models, datasets, and adapters are tampered with or replaced[^6] |
| LLM05 | [[Data and Model Poisoning]] | Manipulated data or artifacts embed harmful behavior[^7] |
| LLM06 | [[Unbounded Consumption]] | Uncontrolled inference drains availability, money, or intellectual property[^8] |
| LLM07 | Misinformation | Credible but false output is trusted and acted upon;[^9] see [[Capability vs. Reliability]] |
| LLM08 | [[Hidden Context Exposure]] | Hidden instructions or context are extracted or reconstructed[^10] |
| LLM09 | [[Vector and Embedding Weaknesses]] | Attacks on the similarity search that decides what the model sees[^11] |
| LLM10 | [[Improper Output Handling]] | Model output reaches downstream systems without validation[^12] |

## How to Use It
1. Work all ten, starting at the top, and build each for the day the model is turned against you.[^13]
2. Read each entry for the model as a component. When the model becomes an actor, with tools, memory, and downstream consequences, pair the entry with the OWASP Top 10 for Agentic Applications.[^14]
3. Use Appendix A to map each risk to other frameworks, including [[MITRE ATLAS]].[^15]

## Limits and Cautions
- **How it was ranked:** a practitioner vote carries three-quarters of the weight and a corpus of real incidents one-quarter. Of 7,714 incidents collected, 6,639 had enough detail to classify.[^2]
- **Belief versus evidence:** prompt injection ranks first by vote but falls out of the top ten by raw incident count, which the leads attribute to a "defense effect"; misinformation ranks low by vote but near the top by incidents.[^2]
- **What changed in 2026:** Excessive Agency rose to third, Unbounded Consumption rose four places, Improper Output Handling fell from fifth to tenth, and System Prompt Leakage became Hidden Context Exposure.[^14]
- The saved copy is marked "Version 2026" with its publication date "to be set".[^16]

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=3|OWASP, p. 3]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=5|OWASP, p. 5]]
[^3]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, p. 10]]
[^4]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=18|OWASP, p. 18]]
[^5]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=23|OWASP, p. 23]]
[^6]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=27|OWASP, p. 27]]
[^7]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=33|OWASP, p. 33]]
[^8]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=38|OWASP, p. 38]]
[^9]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=43|OWASP, p. 43]]
[^10]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=46|OWASP, p. 46]]
[^11]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=50|OWASP, p. 50]]
[^12]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=55|OWASP, p. 55]]
[^13]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=8|OWASP, p. 8]]
[^14]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]
[^15]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=58|OWASP, p. 58]]
[^16]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=1|OWASP, p. 1]]
