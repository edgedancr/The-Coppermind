---
type: concept
status: draft
aliases:
  - AI Agents
courses:
  - SAIL
sources:
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
  - "[[SRC - OWASP Top 10 for LLM Applications 2026]]"
  - "[[SRC - Generative vs Agentic AI]]"
related:
  - "[[Emergent Behavior]]"
  - "[[Prompt Engineering]]"
  - "[[Artificial Intelligence]]"
  - "[[Excessive Agency]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-11
---
> [!summary]
> Agentic AI is AI that has access to external tools ([[SAIL Class Notes (Fall 2026)#10/15/26|SAIL notes, 10/15/26]]). It is the latest step in SAIL's progression of AI ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]]), and SAIL warned that ==access to external tools increases emergent behavior and risk== ([[SAIL Class Notes (Fall 2026)#10/15/26|SAIL notes, 10/15/26]]).

## Key Points
- With tool use, the model is not just a chatbot; it is an operating system that can call tools to solve problems ([[SAIL Class Notes (Fall 2026)#10/1/26|SAIL notes, 10/1/26]]).
- **IBM's account:** agentic systems are proactive rather than reactive. They often start from a prompt but use it to pursue goals through a series of actions, in a cycle of perceiving the environment, deciding on an action, executing it, and learning from the result, "all with minimal human intervention" ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 2]]). See [[Generative vs. Agentic AI]].
- **The reasoning engine:** large language models provide the reasoning engine for agentic systems ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 3]]), through [[Chain-of-Thought Reasoning|chain-of-thought reasoning]] ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 5]]).
- **Example:** a personal shopping agent searches platforms for a product, monitors prices, handles checkout, and coordinates delivery, largely by itself, seeking input only when needed ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 4]]).
- AI agents at work are on the near horizon ([[SAIL Class Notes (Fall 2026)#10/15/26|SAIL notes, 10/15/26]]).
- OWASP calls the vulnerability that lets an LLM's unexpected or manipulated output trigger damaging actions [[Excessive Agency]], caused by excessive functionality, permissions, or autonomy ([[OWASP Top 10 for LLM Applications 2026.pdf#page=23|OWASP, p. 23]]). It treats the model as a component; once the model becomes an actor, with tools it can call, memory it carries between sessions, and downstream consequences, the risk moves to the OWASP Top 10 for Agentic Applications ([[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]).
- See [[Emergent Behavior]].
