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
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
related:
  - "[[Excessive Agency]]"
  - "[[Hidden Context Exposure]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> Prompt injection happens when any input to a large language model (LLM), from a user's message to a retrieved web page, an image, or the model's own memory, changes the model's behavior in ways the developer did not intend ([[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, p. 10]]). OWASP ranks it first among LLM application risks and explains why it can't simply be filtered out: ==LLMs make no architectural distinction between instructions and data==, since both are tokens on the same stream ([[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, p. 10]]).

## Key Points
**Types** ([[OWASP Top 10 for LLM Applications 2026.pdf#page=11|OWASP, pp. 11–12]])
- **Direct:** a user, or an attacker with the user's access, supplies input that changes the model's behavior, on purpose or by accident. [[Jailbreak|Jailbreaking]] is the subset aimed at breaking the model's safety protocols.
- **Indirect:** the model reads instructions hidden in outside content (a web page, email, document, tool response, or retrieved passage) that the user didn't write or see. OWASP sorts these surfaces as untrusted, semi-trusted, or trusted. In the trusted case, an attacker plants text in a low-privilege channel such as a support ticket and waits for the user's own agent to act on it with the user's credentials.

**What makes it worse** ([[OWASP Top 10 for LLM Applications 2026.pdf#page=10|OWASP, p. 10]])
- *Context-window pooling:* the system prompt, user input, documents, tool output, and memory form one token stream with no enforced trust boundary.
- *Memory persistence:* an injection written to memory or a [[Retrieval-Augmented Generation|RAG]] corpus taints every later session that reads it.
- *Agentic execution:* when output drives tool calls, the damage reaches whatever the tools can reach. See [[Excessive Agency]].

**Examples**
- Instructions hidden in invisible Unicode characters, in images or audio below human perception, or in Base64 or low-resource languages that filters weren't trained on ([[OWASP Top 10 for LLM Applications 2026.pdf#page=12|OWASP, pp. 12–13]]).
- A crafted email made Microsoft 365 Copilot exfiltrate organizational data with no user interaction ([[OWASP Top 10 for LLM Applications 2026.pdf#page=16|OWASP, p. 16]]).
- As few as five poisoned documents reached about 90% attack success against a knowledge base of millions of texts ([[OWASP Top 10 for LLM Applications 2026.pdf#page=15|OWASP, pp. 15–16]]).
- SAIL's [[Bing Sydney Incident (2023)]] included a prompt-injection vulnerability that let users expose hidden system prompts and codenames ([[SAIL Class Notes (Fall 2026)#10/1/26|SAIL notes, 10/1/26]]). See [[Hidden Context Exposure]].

## Why It Matters
- OWASP's position is that ==no reliable prevention exists today==, so defense must be architectural: design the system on the assumption that the instruction boundary will be bypassed, and limit what the model may do and where its output may go ([[OWASP Top 10 for LLM Applications 2026.pdf#page=13|OWASP, p. 13]]).
- Its recommended controls include holding credentials and privileges in application code rather than the model, requiring human confirmation of privileged or irreversible actions, and checking agents against the [[Lethal Trifecta]] and the Rule of Two ([[OWASP Top 10 for LLM Applications 2026.pdf#page=13|OWASP, pp. 13–14]]).
- OWASP warns that defenses tested only against static attacks mislead: one study found static attack success near zero but adaptive success above 90% for most of 12 recent defenses ([[OWASP Top 10 for LLM Applications 2026.pdf#page=15|OWASP, p. 15]]).
