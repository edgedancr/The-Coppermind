---
type: concept
status: draft
aliases:
  - Custom GPTs
  - GPTs
  - GPT Builder
courses:
  - SAIL
sources:
  - "[[SRC - How to Create Custom GPT]]"
  - "[[SRC - RAG vs Fine-Tuning vs Prompt Engineering]]"
example_of:
  - "[[Generative AI]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on:
---
> [!summary]
> A custom GPT is a version of ChatGPT that its builder has specialized for one task with written instructions, uploaded reference files, and optional tools,[^1],[^2],[^3].[^4] Kevin Stratvert's tutorial builds one, a "Cookie Helper" for a cookie company, and says that ==a GPT focused on a specific task should give more accurate results==.[^5] Making one requires a premium ChatGPT subscription.[^1]

## Key Points
- **Two ways to build, which can be combined:** *Create*, a conversation with the GPT Builder, which asks questions and writes the setup; and *Configure*, a form filled in by hand.[^6]
- **Instructions** set the tone, the task, and what to avoid. The tutorial's told the GPT to steer off-topic questions back to baking,[^2] and it did when asked about the weather.[^7] The Builder writes the instructions from the conversation, and they can be edited at any time.[^8]
- **Knowledge:** uploaded files become reference material. The GPT couldn't answer about the company's own cookie until its recipe was uploaded.[^3]
- **Formatting by example:** adding an example of the wanted layout to the instructions changed how answers were formatted, in a chapter titled "Few shot learning".[^9] See [[Prompt Engineering]].
- **Capabilities:** web browsing (off limits the GPT to what it's been given), DALL-E image generation, and a code interpreter for code, math, and data analysis.[^4]
- **Actions** connect the GPT to outside services through their APIs, with the GPT as "the conversational layer." An OpenAPI schema tells it how to call the API, and a public GPT with actions needs a privacy policy.[^10]
- **Sharing:** only me, anyone with the link (in practice, anyone with a ChatGPT subscription), or the GPT Store.[^11]

## Why It Matters
- A setting decides whether conversations with the GPT are shared with OpenAI "to improve our models" or kept private.[^12]
- The tutorial suggests a GPT for any task done again and again, such as one per class with the textbook uploaded, or one that pulls information from a weekly invoice,[^3].[^13]

> [!caution] Sources disagree
> Stratvert: a GPT "has all the different knowledge and data available on the internet," though it can't answer what it doesn't know.[^3] vs. IBM: what a model knows depends on its training data and knowledge cutoff date, so newer or missing data has to be retrieved.[^14]

> [!caution] Accuracy check
> The tutorial says you "teach" a custom GPT,[^1] that other GPTs were "trained" on papers or GitHub data,[^5] and that you can "train" yours on an invoice.[^13] What it demonstrates is writing instructions and uploading files. IBM's video uses training to mean changing a model's [[Parameter|weights]], as in [[Fine-Tuning|fine-tuning]].[^15] Check which sense applies before relying on "trained" here.

> [!todo] Gap in the source
> The tutorial has no recording date, so the interface it shows may have changed since.

## Footnotes
[^1]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 1]]
[^2]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 6]]
[^3]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 9]]
[^4]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 11]]
[^5]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 2]]
[^6]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 3]]
[^7]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 8]]
[^8]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 7]]
[^9]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 10]]
[^10]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 12]]
[^11]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 14]]
[^12]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 13]]
[^13]: [[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 15]]
[^14]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 1]]
[^15]: [[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]]
