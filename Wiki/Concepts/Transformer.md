---
type: concept
status: draft
aliases: ["GPT", "Generative Pre-trained Transformer"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]"]
related: ["[[Tokenization]]", "[[Embedding]]", "[[Attention Head]]", "[[Deep Learning]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> A transformer is the architecture behind large language models (LLMs). GPT stands for *generative pre-trained transformer*, a general term that has nothing to do with OpenAI specifically ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]). A text-driven GPT uses its training data to work from a prompt and find ==the most likely next word== ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]).

## Key Points
- Transformers break text into tokens ([[Tokenization]]), map them as vectors in a high-dimensional space ([[Embedding]]), and use vector math to find the answer ([[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]).
- The original transformer was an encoder–decoder built for language translation: English → numbers, then numbers → Spanish ([[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]).
- A token's starting vector is the same regardless of context; [[Attention Head|attention heads]] compare tokens against one another ([[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]).

> [!caution] Accuracy check
> My 9/10 notes say a model puts your prompt "through EVERYTHING in their database," and that the most powerful model checks it "against 140 billion pieces of data." This may be describing the model's parameters as if they were a database. Check it against the 3Blue1Brown video and rewrite it before adding it here.
