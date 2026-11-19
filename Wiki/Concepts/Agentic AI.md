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
  - "[[SRC - The Catastrophic Risks of AI and a Safer Path]]"
type_of:
  - "[[Artificial Intelligence]]"
causes:
  - "[[Emergent Behavior]]"
related:
  - "[[Prompt Engineering]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-18
changes_since_verified:
  - "2026-11-19: citations moved from parentheses to footnotes; wording unchanged (schema 6.0 citation change, approved by Harrison)"
---
> [!summary]
> Agentic AI is AI that has access to external tools.[^1] It is the latest step in SAIL's progression of AI,[^2] and SAIL warned that ==access to external tools increases emergent behavior and risk==.[^1]

## Key Points
- With tool use, the model is not just a chatbot; it is an operating system that can call tools to solve problems.[^3]
- **IBM's account:** agentic systems are proactive rather than reactive. They often start from a prompt but use it to pursue goals through a series of actions, in a cycle of perceiving the environment, deciding on an action, executing it, and learning from the result, "all with minimal human intervention".[^4] See [[Generative vs. Agentic AI]].
- **The reasoning engine:** large language models provide the reasoning engine for agentic systems,[^5] through [[Chain-of-Thought Reasoning|chain-of-thought reasoning]].[^6]
- **Example:** a personal shopping agent searches platforms for a product, monitors prices, handles checkout, and coordinates delivery, largely by itself, seeking input only when needed.[^7]
- AI agents at work are on the near horizon.[^1]
- OWASP calls the vulnerability that lets an LLM's unexpected or manipulated output trigger damaging actions [[Excessive Agency]], caused by excessive functionality, permissions, or autonomy.[^8] It treats the model as a component; once the model becomes an actor, with tools it can call, memory it carries between sessions, and downstream consequences, the risk moves to the OWASP Top 10 for Agentic Applications.[^9]
- **Bengio's main worry:** [[Yoshua Bengio]] says what worries him most is AI's increasing agency. He calls planning and agency the main thing separating current AI from human-level cognition; AIs are still weak at planning, but in one study the length of tasks they could complete has doubled every seven months over five years.[^10] On that curve, he estimates about five years to human level.[^11]
- **Commercial pressure:** he argues there is "huge commercial pressure" to build AIs with more and more agency to replace human labor, without the scientific answers or societal guardrails to do it safely.[^12] See [[AI Deception]].
- **His message to AI companies:** ==slow down on giving AIs agency==, and invest heavily in research on making agents behave safely.[^11] He proposes a non-agentic [[Scientist AI]] as a guardrail on untrusted agents.[^13]
- See [[Emergent Behavior]].

## Footnotes
[^1]: [[SAIL Class Notes (Fall 2026)#10/15/26|SAIL notes, 10/15/26]]
[^2]: [[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]]
[^3]: [[SAIL Class Notes (Fall 2026)#10/1/26|SAIL notes, 10/1/26]]
[^4]: [[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 2]]
[^5]: [[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 3]]
[^6]: [[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 5]]
[^7]: [[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 4]]
[^8]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=23|OWASP, p. 23]]
[^9]: [[OWASP Top 10 for LLM Applications 2026.pdf#page=7|OWASP, p. 7]]
[^10]: [[TED - Yoshua Bengio, The Catastrophic Risks of AI and a Safer Path (transcript)|Bengio, ch. 6]]
[^11]: [[TED - Yoshua Bengio, The Catastrophic Risks of AI and a Safer Path (transcript)|Bengio, ch. 11]]
[^12]: [[TED - Yoshua Bengio, The Catastrophic Risks of AI and a Safer Path (transcript)|Bengio, ch. 8]]
[^13]: [[TED - Yoshua Bengio, The Catastrophic Risks of AI and a Safer Path (transcript)|Bengio, ch. 9]]
