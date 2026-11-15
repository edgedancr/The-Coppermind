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
related:
  - "[[MITRE ATLAS]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> The OWASP Top 10 for LLM Applications is a ranked list of the ten most critical security risks for applications built on large language models (LLMs), from the OWASP GenAI Security Project ([[OWASP Top 10 for LLM Applications 2026.pdf#page=3|OWASP, p. 3]]). The 2026 edition's guiding posture, in the project leads' words: =="Stop trying to build a model that cannot be fooled. Build the system around it,"== so that when the model is fooled, nothing important breaks ([[OWASP Top 10 for LLM Applications 2026.pdf#page=5|OWASP, p. 5]]). Reach for it when designing, reviewing, or testing any system that puts an LLM inside an application.

## Components

| # | Risk | In one line |
|---|---|---|
| LLM01 | [[Prompt Injection]] | Any input changes the model's behavior against the developer's intent ([[OWASP Top 10 for LLM Applications 2026.pdf#page=10\|OWASP, p. 10]]) |
| LLM02 | [[Sensitive Information Disclosure]] | The system exposes protected data through a channel no one authorized ([[OWASP Top 10 for LLM Applications 2026.pdf#page=18\|OWASP, p. 18]]) |
| LLM03 | [[Excessive Agency]] | Too much functionality, permission, or autonomy turns bad output into damaging action ([[OWASP Top 10 for LLM Applications 2026.pdf#page=23\|OWASP, p. 23]]) |
| LLM04 | Supply Chain: [[AI Supply Chain Compromise]] | Third-party models, datasets, and adapters are tampered with or replaced ([[OWASP Top 10 for LLM Applications 2026.pdf#page=27\|OWASP, p. 27]]) |
| LLM05 | [[Data and Model Poisoning]] | Manipulated data or artifacts embed harmful behavior ([[OWASP Top 10 for LLM Applications 2026.pdf#page=33\|OWASP, p. 33]]) |
| LLM06 | [[Unbounded Consumption]] | Uncontrolled inference drains availability, money, or intellectual property ([[OWASP Top 10 for LLM Applications 2026.pdf#page=38\|OWASP, p. 38]]) |
| LLM07 | Misinformation | Credible but false output is trusted and acted upon ([[OWASP Top 10 for LLM Applications 2026.pdf#page=43\|OWASP, p. 43]]); see [[Capability vs. Reliability]] |
| LLM08 | [[Hidden Context Exposure]] | Hidden instructions or context are extracted or reconstructed ([[OWASP Top 10 for LLM Applications 2026.pdf#page=46\|OWASP, p. 46]]) |
| LLM09 | [[Vector and Embedding Weaknesses]] | Attacks on the similarity search that decides what the model sees ([[OWASP Top 10 for LLM Applications 2026.pdf#page=50\|OWASP, p. 50]]) |
| LLM10 | [[Improper Output Handling]] | Model output reaches downstream systems without validation ([[OWASP Top 10 for LLM Applications 2026.pdf#page=55\|OWASP, p. 55]]) |

## How to Use It
1. Work all ten, starting at the top, and build each for the day the model is turned against you ([[OWASP Top 10 for LLM Applications 2026.pdf#page=8|OWASP, p. 8]]).
2. Read each entry for the model as a component. When the model becomes an actor, with tools, memory, and downstream consequences, pair the entry with the OWASP Top 10 for Agentic Applications ([[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]).
3. Use Appendix A to map each risk to other frameworks, including [[MITRE ATLAS]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=58|OWASP, p. 58]]).

## Limits and Cautions
- **How it was ranked:** a practitioner vote carries three-quarters of the weight and a corpus of real incidents one-quarter. Of 7,714 incidents collected, 6,639 had enough detail to classify ([[OWASP Top 10 for LLM Applications 2026.pdf#page=5|OWASP, p. 5]]).
- **Belief versus evidence:** prompt injection ranks first by vote but falls out of the top ten by raw incident count, which the leads attribute to a "defense effect"; misinformation ranks low by vote but near the top by incidents ([[OWASP Top 10 for LLM Applications 2026.pdf#page=5|OWASP, p. 5]]).
- **What changed in 2026:** Excessive Agency rose to third, Unbounded Consumption rose four places, Improper Output Handling fell from fifth to tenth, and System Prompt Leakage became Hidden Context Exposure ([[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]).
- The saved copy is marked "Version 2026" with its publication date "to be set" ([[OWASP Top 10 for LLM Applications 2026.pdf#page=1|OWASP, p. 1]]).
