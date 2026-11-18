---
type: framework
status: draft
aliases:
  - ATLAS
  - ATLAS Matrix
courses:
  - SAIL
sources:
  - "[[SRC - MITRE ATLAS Matrix]]"
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> MITRE ATLAS is the MITRE Corporation's "ATLAS Matrix for AI Systems," which arranges ==16 tactics as columns, from Reconnaissance to Impact, with 111 techniques for attacking AI systems beneath them== ([[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]). Fourteen of the tactics are marked as adapted from MITRE ATT&CK ([[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]). Reach for it to name and organize the specific ways an adversary can attack an AI system; the [[OWASP Top 10 for Large Language Model Applications]] maps its risks to ATLAS ([[OWASP Top 10 for LLM Applications 2026.pdf#page=4|OWASP, p. 4]]).

> [!warning] Unsourced background — verify or remove
> ATLAS stands for "Adversarial Threat Landscape for Artificial-Intelligence Systems." The saved page doesn't spell out the acronym.

## Components
Tactics in matrix order, with technique counts and examples ([[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]):

| Tactic | Techniques | Examples |
|---|---|---|
| Reconnaissance | 8 | Gather RAG-Indexed Targets; Search Open AI Vulnerability Analysis |
| Resource Development | 10 | Publish Poisoned AI Artifacts; Publish Hallucinated Entities |
| Initial Access | 7 | AI Supply Chain Compromise; Evade AI Model; Phishing |
| **AI Model Access** | 4 | AI Model Inference API Access; Full AI Model Access |
| Execution | 6 | LLM Prompt Injection; AI Agent Tool Invocation |
| Persistence | 9 | AI Agent Context Poisoning; RAG Poisoning; Training Data Poisoning |
| Privilege Escalation | 4 | LLM Jailbreak; Escape to Host |
| Defense Evasion | 15 | LLM Prompt Obfuscation; False RAG Entry Injection |
| Credential Access | 7 | RAG Credential Harvesting; Credentials from AI Agent Configuration |
| Discovery | 9 | Discover LLM Hallucinations; Discover LLM System Information |
| Lateral Movement | 3 | AI Agent Tool Invocation; Phishing |
| Collection | 4 | Data from AI Services; AI Artifact Collection |
| **AI Attack Staging** | 6 | Craft Adversarial Data; Create Proxy AI Model; Generate Deepfakes |
| Command and Control | 4 | AI Agent; Reverse Shell |
| Exfiltration | 6 | Exfiltration via AI Inference API; Extract LLM System Prompt |
| Impact | 9 | Cost Harvesting; Denial of AI Service; Erode AI Model Integrity |

- The two tactics in bold are the only ones not marked as adapted from ATT&CK ([[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]).

## How to Use It
1. Filter the matrix by platform (predictive AI, generative AI, agentic AI, and enterprise) and by maturity (feasible, demonstrated, and realized) ([[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]).
2. Read down a tactic's column to see its techniques, and expand techniques to see their subtechniques ([[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]).
3. Pair it with a defensive list. OWASP maps each of its ten LLM risks to ATLAS tactics ([[OWASP Top 10 for LLM Applications 2026.pdf#page=58|OWASP, p. 58]]), and cites ATLAS technique AML.T0010, AI Supply Chain Compromise, for its supply-chain entry ([[OWASP Top 10 for LLM Applications 2026.pdf#page=27|OWASP, p. 27]]). See [[AI Supply Chain Compromise]].

## Limits and Cautions
> [!todo] Gap in the source
> The saved page is only the matrix: it has no definitions of the tactics or techniques, and none of ATLAS's mitigations or case studies.
