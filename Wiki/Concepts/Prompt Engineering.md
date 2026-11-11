---
type: concept
status: draft
aliases: ["Prompting", "ORTCOW"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]"]
related: ["[[Architecture of Worldview]]", "[[Analysis of Competing Hypotheses]]", "[[Agentic AI]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
Prompt engineering is the practice of instructing an AI so that it produces useful output. SAIL's fundamentals: explain exactly what you need and the context of the situation, because ==the AI responds from the viewpoint you give it==, and without one its answer will be broad and largely unhelpful ([[SAIL Class Notes (Fall 2026)#8/27/26|SAIL notes, 8/27/26]]).

## Key Points
- **Give it a worldview explicitly:** telling an AI to "think with a Christian worldview" does not make it think like you; you must feed it the worldview you want it to have ([[SAIL Class Notes (Fall 2026)#9/3/26|SAIL notes, 9/3/26]]). See [[Architecture of Worldview]].
- **Plan before prompting:** research, decide what's important, and then do the tasking. Good instructions up front cost far fewer tokens than trial and error, and coming back the next day helps with refining ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]).
- **Advanced techniques** ([[SAIL Class Notes (Fall 2026)#10/1/26|SAIL notes, 10/1/26]]):
	- *Personas:* give the model a role and context to shift the probability distribution of its response, e.g., "You are a skeptical red team analyst."
	- *Chain of thought:* force the model to reason before answering: "Think step-by-step. Break the problem into sub-tasks. Explain reasoning before providing the final answer..."
	- *Tool use:* the model is not just a chatbot; it is an operating system that can call tools to solve problems. See [[Agentic AI]].
	- *ORTCOW:* a structure for prompts: Objectives, Requirements, Tasking, Constraints, Output, Workflow.
- How far a person takes these is measured by the [[Four Levels of Prompt Engineering]] ([[SAIL Class Notes (Fall 2026)#9/3/26|SAIL notes, 9/3/26]]).
- For analysis, [[Analysis of Competing Hypotheses]] includes specific rules for prompting an AI step by step ([[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]).

> [!todo] Gap in my notes
> ORTCOW is only listed as an acronym. My notes don't explain each part or give an example.
