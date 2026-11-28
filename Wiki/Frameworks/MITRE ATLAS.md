---
type: framework
status: verified
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
verified_on: 2026-11-28
---
> [!summary]
> MITRE ATLAS is the MITRE Corporation's "ATLAS Matrix for AI Systems," which arranges ==16 tactics as columns, from Reconnaissance to Impact, with 111 techniques for attacking AI systems beneath them==.[^1] Fourteen of the tactics are marked as adapted from MITRE ATT&CK.[^1] Reach for it to name and organize the specific ways an adversary can attack an AI system; the [[OWASP Top 10 for Large Language Model Applications]] maps its risks to ATLAS.[^2]

## Components
Tactics in matrix order, with technique counts and examples:[^1]

| Tactic | Techniques | Examples |
|---|---|---|
| Reconnaissance | 8 | Gather [[Retrieval-Augmented Generation\|RAG]]-Indexed Targets; Search Open AI Vulnerability Analysis |
| Resource Development | 10 | Publish Poisoned AI Artifacts; Publish Hallucinated Entities |
| Initial Access | 7 | AI Supply Chain Compromise; Evade AI Model; Phishing |
| **AI Model Access** | 4 | AI Model Inference API Access; Full AI Model Access |
| Execution | 6 | [[Large Language Model\|LLM]] [[Prompt Injection]]; AI Agent Tool Invocation |
| Persistence | 9 | AI Agent Context Poisoning; RAG Poisoning; [[Data and Model Poisoning\|Training Data Poisoning]] |
| Privilege Escalation | 4 | [[Jailbreak\|LLM Jailbreak]]; Escape to Host |
| Defense Evasion | 15 | LLM Prompt Obfuscation; False RAG Entry Injection |
| Credential Access | 7 | RAG Credential Harvesting; Credentials from AI Agent Configuration |
| Discovery | 9 | Discover LLM [[Hallucination\|Hallucinations]]; Discover LLM System Information |
| Lateral Movement | 3 | AI Agent Tool Invocation; Phishing |
| Collection | 4 | Data from AI Services; AI Artifact Collection |
| **AI Attack Staging** | 6 | Craft Adversarial Data; Create Proxy AI Model; Generate [[Deepfake\|Deepfakes]] |
| Command and Control | 4 | AI Agent; Reverse Shell |
| Exfiltration | 6 | Exfiltration via AI Inference API; Extract LLM System Prompt |
| Impact | 9 | Cost Harvesting; Denial of AI Service; Erode AI Model Integrity |

- The two tactics in bold are the only ones not marked as adapted from ATT&CK.[^1]

## How to Use It
1. Filter the matrix by platform (predictive AI, [[Generative AI|generative AI]], [[Agentic AI|agentic AI]], and enterprise) and by maturity (feasible, demonstrated, and realized).[^1]
2. Read down a tactic's column to see its techniques, and expand techniques to see their subtechniques.[^1]
3. Pair it with a defensive list. OWASP maps each of its ten LLM risks to ATLAS tactics,[^3] and cites ATLAS technique AML.T0010, AI Supply Chain Compromise, for its supply-chain entry.[^4] See [[AI Supply Chain Compromise]].

## Footnotes
[^1]: [[MITRE ATLAS Matrix.pdf|MITRE ATLAS, matrix]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=4|OWASP, p. 4]]
[^3]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=58|OWASP, p. 58]]
[^4]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=27|OWASP, p. 27]]
