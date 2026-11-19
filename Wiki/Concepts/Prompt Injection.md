---
type: concept
status: draft
aliases:
  - LLM01
  - Direct Prompt Injection
  - Indirect Prompt Injection
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - Current AI Models Have 3 Unfixable Problems]]"
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> Prompt injection happens when any input to a large language model (LLM), from a user's message to a retrieved web page, an image, or the model's own memory, changes the model's behavior in ways the developer did not intend.[^1] OWASP ranks it first among LLM application risks and explains why it can't simply be filtered out: ==LLMs make no architectural distinction between instructions and data==, since both are tokens on the same stream.[^1]

## Key Points
**Types**[^2]
- **Direct:** a user, or an attacker with the user's access, supplies input that changes the model's behavior, on purpose or by accident. [[Jailbreak|Jailbreaking]] is the subset aimed at breaking the model's safety protocols.
- **Indirect:** the model reads instructions hidden in outside content (a web page, email, document, tool response, or retrieved passage) that the user didn't write or see. OWASP sorts these surfaces as untrusted, semi-trusted, or trusted. In the trusted case, an attacker plants text in a low-privilege channel such as a support ticket and waits for the user's own agent to act on it with the user's credentials.

**What makes it worse**[^1]
- *Context-window pooling:* the system prompt, user input, documents, tool output, and memory form one token stream with no enforced trust boundary.
- *Memory persistence:* an injection written to memory or a [[Retrieval-Augmented Generation|RAG]] corpus taints every later session that reads it.
- *Agentic execution:* when output drives tool calls, the damage reaches whatever the tools can reach. See [[Excessive Agency]].

**Examples**
- Instructions hidden in invisible Unicode characters, in images or audio below human perception, or in Base64 or low-resource languages that filters weren't trained on.[^3]
- A crafted email made Microsoft 365 Copilot exfiltrate organizational data with no user interaction.[^4]
- As few as five poisoned documents reached about 90% attack success against a knowledge base of millions of texts.[^5]
- SAIL's [[Bing Sydney Incident (2023)]] included a prompt-injection vulnerability that let users expose hidden system prompts and codenames.[^6] See [[Hidden Context Exposure]].

## Why It Matters
- OWASP's position is that ==no reliable prevention exists today==, so defense must be architectural: design the system on the assumption that the instruction boundary will be bypassed, and limit what the model may do and where its output may go.[^7]
- Sabine Hossenfelder agrees: she calls prompt injection =="basically impossible to solve"== because LLMs "can't distinguish" instructions from other input. Formatting rules or outside screening can help, but she expects the models to "remain untrustworthy and unsuitable for many tasks".[^8] See [[Critiques of Large Language Models]].
- Its recommended controls include holding credentials and privileges in application code rather than the model, requiring human confirmation of privileged or irreversible actions, and checking agents against the [[Lethal Trifecta]] and the Rule of Two.[^9]
- OWASP warns that defenses tested only against static attacks mislead: one study found static attack success near zero but adaptive success above 90% for most of 12 recent defenses.[^10]

## Footnotes
[^1]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, p. 10]]
[^2]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=11|OWASP, pp. 11–12]]
[^3]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=12|OWASP, pp. 12–13]]
[^4]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=16|OWASP, p. 16]]
[^5]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=15|OWASP, pp. 15–16]]
[^6]: [[SAIL Class Notes (Fall 2026)#10/1/26|SAIL notes, 10/1/26]]
[^7]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=13|OWASP, p. 13]]
[^8]: [[Sabine Hossenfelder - Current AI Models Have 3 Unfixable Problems (transcript)|Hossenfelder, ch. 3]]
[^9]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=13|OWASP, pp. 13–14]]
[^10]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=15|OWASP, p. 15]]
