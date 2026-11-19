---
type: concept
status: draft
aliases: ["GPT", "Generative Pre-trained Transformer"]
courses: ["SAIL"]
sources: ["[[SRC - SAIL Class Notes (Fall 2026)]]", "[[SRC - Attention Is All You Need]]", "[[SRC - Large Language Models Explained Briefly]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on:
---
> [!summary]
> A transformer is the architecture behind large language models (LLMs). GPT stands for *generative pre-trained transformer*, a general term that has nothing to do with OpenAI specifically.[^1] A text-driven GPT uses its training data to work from a prompt and find ==the most likely next word==.[^1]

## Key Points
- Transformers break text into tokens ([[Tokenization]]), map them as vectors in a high-dimensional space ([[Embedding]]), and use vector math to find the answer.[^1]
- The original transformer was an encoder–decoder built for language translation: English → numbers, then numbers → Spanish.[^2]
- A token's starting vector is the same regardless of context; [[Attention Head|attention heads]] compare tokens against one another.[^2]
- **Origin:** the transformer was introduced in "Attention Is All You Need" (2017) by eight researchers, most at Google Brain and Google Research, as a model =="based solely on attention mechanisms, dispensing with recurrence and convolutions entirely"==.[^3] See [[Self-Attention]].
- **Why it mattered:** before 2017, most language models processed text one word at a time; transformers take it all in at once, in parallel.[^4] The original base model trained in 12 hours on eight GPUs.[^5]
- **The original design:** an [[Encoder-Decoder Architecture|encoder-decoder]] with six identical layers in each half, each pairing multi-head self-attention with a [[Feed-Forward Neural Network|feed-forward network]].[^6] Its embeddings had 512 dimensions,[^7] and [[Positional Encoding|positional encodings]] supplied word order.[^8]
- **Inside a language model:** each word becomes a list of numbers; attention lets those lists refine one another based on context, and feed-forward layers store patterns learned in training. After many rounds, the last vector produces a probability for every possible next word.[^9] See [[Large Language Model]].

> [!caution] Accuracy check
> My 9/10 notes say a model puts your prompt "through EVERYTHING in their database," and that the most powerful model checks it "against 140 billion pieces of data." This may be describing the model's parameters as if they were a database. Check it against the 3Blue1Brown video and rewrite it before adding it here.
> Possibly resolved by [[SRC - Large Language Models Explained Briefly]], ch. 3: a model's behavior is "entirely determined" by its parameters, also called weights, which large models have hundreds of billions of. See [[Parameter]].

## Footnotes
[^1]: [[SAIL Class Notes (Fall 2026)#9/10/26|SAIL notes, 9/10/26]]
[^2]: [[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]
[^3]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=1|Vaswani et al., p. 1]]
[^4]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 7–8]]
[^5]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=7|Vaswani et al., p. 7]]
[^6]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=3|Vaswani et al., p. 3]]
[^7]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=5|Vaswani et al., p. 5]]
[^8]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=6|Vaswani et al., p. 6]]
[^9]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 8–9]]
