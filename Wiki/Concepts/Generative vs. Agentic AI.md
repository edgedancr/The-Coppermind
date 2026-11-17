---
type: concept
status: draft
aliases:
  - Generative AI vs. Agentic AI
  - Reactive vs. Proactive AI
courses:
  - SAIL
sources:
  - "[[SRC - Generative vs Agentic AI]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> IBM Technology's video separates two approaches to AI. ==Generative AI is reactive: it waits for a prompt, generates content, and stops. Agentic AI is proactive: it uses a prompt to pursue a goal through a series of actions, with minimal human intervention== ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 1]]), ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 2]]). Both usually rest on the same foundation, the [[Large Language Model|large language model]] (LLM) ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 3]]).

## Key Points
**[[Generative AI]]: reactive** ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 1]])
- It waits for a prompt, then generates content (text, an image, code, or audio) from patterns it learned in training.
- The video calls these systems "sophisticated pattern matching machines" that have learned statistical relationships between words, pixels, and sound waves from massive datasets.
- Its work ends at generation. It takes no further steps without your input.

**[[Agentic AI]]: proactive** ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 2]])
- It often starts with a prompt too, but uses it to pursue goals through a series of actions.
- It works in a cycle: perceive its environment, decide on an action, execute it, learn from the result, and repeat.

**Shared foundation**
- LLMs are the backbone of chatbots (images and audio typically use diffusion models instead), and they also provide the reasoning engine for agentic systems ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 3]]).
- Agents reason through [[Chain-of-Thought Reasoning|chain-of-thought reasoning]], which the video calls "what LLMs are so good at." In its words, "Gen AI is basically the cognitive engine driving an agent's decision-making" ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 5]]).

**Examples** ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 4]])
- *Generative:* a YouTuber uses generative AI to review scripts, suggest thumbnail ideas, and make background music, but a human reviews, refines, and directs each step. ==The AI "generates possibilities but the human curates them."==
- *Agentic:* a personal shopping agent, given a product, searches platforms for it, monitors prices, handles checkout, and coordinates delivery, largely by itself, asking for input only when needed. The video says agentic AI suits ongoing management and multi-step processes.

## Why It Matters
- The video predicts that the most powerful systems won't be purely one or the other, but "intelligent collaborators" that know when to explore options through generation and when to commit to action ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 5]]), ([[IBM Technology - Generative vs Agentic AI (transcript)|IBM, generative vs. agentic, ch. 6]]).
- SAIL's progression of AI places generative AI just before agentic AI ([[SAIL Class Notes (Fall 2026)#9/8/26|SAIL notes, 9/8/26]]), and SAIL warned that access to external tools increases emergent behavior and risk ([[SAIL Class Notes (Fall 2026)#10/15/26|SAIL notes, 10/15/26]]).
