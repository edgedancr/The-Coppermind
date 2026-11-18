---
type: concept
status: draft
aliases:
  - LLM03
courses:
  - SAIL
sources:
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
part_of:
  - "[[OWASP Top 10 for Large Language Model Applications]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-14
verified_on:
---
> [!summary]
> Excessive agency is the vulnerability that lets an LLM-based system take damaging actions in response to unexpected, ambiguous, or manipulated model output, whatever is causing the model to malfunction ([[OWASP Top 10 for LLM Applications 2026.pdf#page=23|OWASP, p. 23]]). OWASP traces it to three root causes: ==excessive functionality, excessive permissions, and excessive autonomy== ([[OWASP Top 10 for LLM Applications 2026.pdf#page=23|OWASP, p. 23]]). It rose to third on the 2026 list, which OWASP calls the most consequential move, because both the practitioner vote and the incident record show damage landing in agentic deployments ([[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]).

## Key Points
- **Agency** here means the developer's grant of tools (also called extensions, plugins, or skills) that let the model call functions or interface with other systems; an agent may also choose which tool to call ([[OWASP Top 10 for LLM Applications 2026.pdf#page=23|OWASP, p. 23]]).
- **Triggers** include [[Hallucination|hallucination]], a poorly performing or misaligned model, and direct or indirect [[Prompt Injection|prompt injection]] ([[OWASP Top 10 for LLM Applications 2026.pdf#page=23|OWASP, p. 23]]).
- **The three root causes, with OWASP's examples** ([[OWASP Top 10 for LLM Applications 2026.pdf#page=24|OWASP, p. 24]])
	- *Functionality:* a tool needed only to read documents can also modify and delete them; a tool tried during development is left available.
	- *Permissions:* a read-only tool connects with an identity that can also update and delete; a per-user tool uses an account that can reach every user's files.
	- *Autonomy:* high-impact actions, such as deleting a user's documents, happen without confirmation.
- **Prevention** ([[OWASP Top 10 for LLM Applications 2026.pdf#page=24|OWASP, pp. 24–26]]): minimize tools and their functions; avoid open-ended tools such as "run a shell command"; minimize permissions; run tools in the user's own context; require user approval for high-impact actions; and practice **complete mediation**, enforcing authorization in code rather than letting the LLM decide whether an action is allowed. Monitoring and rate limiting limit the damage but don't prevent it.
- **Example:** an email-summarizing assistant whose mail tool can also send messages is tricked by a malicious incoming email into forwarding sensitive mail to the attacker ([[OWASP Top 10 for LLM Applications 2026.pdf#page=26|OWASP, p. 26]]).

## Why It Matters
- OWASP describes prompt injection as the input-side compromise and excessive agency as what gives that compromise consequences outside the chat window ([[OWASP Top 10 for LLM Applications 2026.pdf#page=13|OWASP, p. 13]]).
- SAIL warned that access to external tools increases emergent behavior and risk ([[SAIL Class Notes (Fall 2026)#10/15/26|SAIL notes, 10/15/26]]). See [[Agentic AI]].
