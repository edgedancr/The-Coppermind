---
type: concept
status: draft
aliases: ["Prompting", "ORTCOW"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]", "[[SRC - RAG vs Fine-Tuning vs Prompt Engineering]]", "[[SRC - How to Create Custom GPT]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> Prompt engineering is the practice of instructing an AI so that it produces useful output. SAIL's fundamentals: explain exactly what you need and the context of the situation, because ==the AI responds from the viewpoint you give it==, and without one its answer will be broad and largely unhelpful.[^1]

## Key Points
- **Give it a worldview explicitly:** telling an AI to "think with a Christian worldview" does not make it think like you; you must feed it the worldview you want it to have.[^2] See [[Architecture of Worldview]].
- **Plan before prompting:** research, decide what's important, and then do the tasking. Good instructions up front cost far fewer tokens than trial and error, and coming back the next day helps with refining.[^3]
- **Advanced techniques**:[^4]
	- *Personas:* give the model a role and context to shift the probability distribution of its response, e.g., "You are a skeptical red team analyst."
	- *[[Chain-of-Thought Reasoning|Chain of thought]]:* force the model to reason before answering: "Think step-by-step. Break the problem into sub-tasks. Explain reasoning before providing the final answer..."
	- *Tool use:* the model is not just a chatbot; it is an operating system that can call tools to solve problems. See [[Agentic AI]].
	- *ORTCOW:* a structure for prompts: Objectives, Requirements, Tasking, Constraints, Output, Workflow.
- **Why prompting works, per IBM:** a model processes a prompt through layers of attention mechanisms, each focusing on different aspects of the text. Including examples, context, or the desired format directs its attention to relevant patterns it learned in training, and telling it to "think about this step-by-step" activates patterns from training data where methodical reasoning led to accurate results.[^5]
- **Formatting by example:** in a custom GPT tutorial, adding an example of the wanted layout to the GPT's instructions changed how its answers were formatted.[^6] See [[Custom GPT]].
- Compared with retrieval and fine-tuning, prompt engineering needs no new data or infrastructure but can't teach a model new information.[^5] See [[Retrieval-Augmented Generation vs. Fine-Tuning vs. Prompt Engineering]].
- How far a person takes these is measured by the [[Four Levels of Prompt Engineering]].[^2]
- For analysis, [[Analysis of Competing Hypotheses]] includes specific rules for prompting an AI step by step.[^7]

> [!todo] Gap in my notes
> ORTCOW is only listed as an acronym. My notes don't explain each part or give an example.

> [!caution] Accuracy check
> The IBM transcript says the layers are "essentially tension mechanisms".[^5] This page reads it as "attention mechanisms." Check the video.

## Footnotes
[^1]: [[SAIL Class Notes (Fall 2026)#8/27/26|SAIL notes, 8/27/26]]
[^2]: [[SAIL Class Notes (Fall 2026)#9/3/26|SAIL notes, 9/3/26]]
[^3]: [[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]
[^4]: [[SAIL Class Notes (Fall 2026)#10/1/26|SAIL notes, 10/1/26]]
[^5]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 3]]
[^6]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 10]]
[^7]: [[SAIL Class Notes (Fall 2026)#10/20/26|SAIL notes, 10/20/26]]
