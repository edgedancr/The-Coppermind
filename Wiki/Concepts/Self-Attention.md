---
type: concept
status: draft
aliases:
  - Attention Mechanism
  - Multi-Head Attention
  - Scaled Dot-Product Attention
courses:
  - SAIL
sources:
  - "[[SRC - Attention Is All You Need]]"
  - "[[SRC - Large Language Models Explained Briefly]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
part_of:
  - "[[Transformer]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> Self-attention is an attention mechanism that relates different positions in a single sequence, such as the words of a sentence, to compute a representation of that sequence.[^1] It is the core of the [[Transformer|transformer]]: Vaswani et al. built ==the first sequence model "relying entirely on self-attention,"== without the recurrence that earlier models used.[^1] 3Blue1Brown describes it as giving each word's list of numbers "a chance to talk to one another" and refine their meanings based on context, all in parallel.[^2]

## Key Points
**How it works**
- An attention function maps a **query** and a set of **key-value** pairs to an output: a weighted sum of the values, where each weight depends on how well the query matches the corresponding key.[^3]
- The transformer's version, **scaled dot-product attention**, computes those matches with dot products and scales them down so the math stays stable for large vectors.[^4]
- **Multi-head attention** runs several attention functions in parallel, eight in the original model, so the model can attend to different kinds of information at different positions at once.[^5] Each is an [[Attention Head|attention head]].
- 3Blue1Brown's example: the numbers encoding "bank" can shift, based on surrounding words, to encode the more specific notion of a riverbank.[^2]

**Three uses in the original transformer**[^5]
- *Encoder self-attention:* every position attends to every position in the input.
- *Decoder self-attention:* each position attends only to earlier positions, preserving word-by-word generation.
- *Encoder-decoder attention:* the decoder attends to the encoded input. See [[Encoder-Decoder Architecture]].

**Why it replaced recurrence**[^6]
- A self-attention layer connects all positions in a constant number of sequential steps, while a [[Recurrent Neural Network|recurrent layer]] needs one step per position. That makes it far easier to run in parallel and to learn connections between distant words.
- Because attention ignores word order on its own, the model adds [[Positional Encoding|positional encodings]].[^7]

## Why It Matters
- Vaswani et al. note that self-attention could make models more interpretable: different heads clearly learn different tasks, some tied to the grammar of the sentence.[^8] Their examples show heads tracking a distant verb and resolving what "its" refers to.[^9]
- SAIL's 9/15/26 notes describe a single attention head as one thing a token is compared against, with a query vector finding everything that matches it.[^10]

## Footnotes
[^1]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=2|Vaswani et al., p. 2]]
[^2]: [[3Blue1Brown - Large Language Models Explained Briefly (transcript)|3Blue1Brown, LLMs, ch. 8]]
[^3]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=3|Vaswani et al., pp. 3–4]]
[^4]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=4|Vaswani et al., p. 4]]
[^5]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=5|Vaswani et al., p. 5]]
[^6]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=6|Vaswani et al., pp. 6–7]]
[^7]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=6|Vaswani et al., p. 6]]
[^8]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=7|Vaswani et al., p. 7]]
[^9]: [[Vaswani et al. - Attention Is All You Need (2017).pdf#page=13|Vaswani et al., pp. 13–14]]
[^10]: [[SAIL Class Notes (Fall 2026)#9/15/26|SAIL notes, 9/15/26]]
