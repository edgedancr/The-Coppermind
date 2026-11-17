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
> A custom GPT is a version of ChatGPT that its builder has specialized for one task with written instructions, uploaded reference files, and optional tools ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 1]]), ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 6]]), ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 9]]), ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 11]]). Kevin Stratvert's tutorial builds one, a "Cookie Helper" for a cookie company, and says that ==a GPT focused on a specific task should give more accurate results== ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 2]]). Making one requires a premium ChatGPT subscription ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 1]]).

## Key Points
- **Two ways to build, which can be combined:** *Create*, a conversation with the GPT Builder, which asks questions and writes the setup; and *Configure*, a form filled in by hand ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 3]]).
- **Instructions** set the tone, the task, and what to avoid. The tutorial's told the GPT to steer off-topic questions back to baking ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 6]]), and it did when asked about the weather ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 8]]). The Builder writes the instructions from the conversation, and they can be edited at any time ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 7]]).
- **Knowledge:** uploaded files become reference material. The GPT couldn't answer about the company's own cookie until its recipe was uploaded ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 9]]).
- **Formatting by example:** adding an example of the wanted layout to the instructions changed how answers were formatted, in a chapter titled "Few shot learning" ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 10]]). See [[Prompt Engineering]].
- **Capabilities:** web browsing (off limits the GPT to what it's been given), DALL-E image generation, and a code interpreter for code, math, and data analysis ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 11]]).
- **Actions** connect the GPT to outside services through their APIs, with the GPT as "the conversational layer." An OpenAPI schema tells it how to call the API, and a public GPT with actions needs a privacy policy ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 12]]).
- **Sharing:** only me, anyone with the link (in practice, anyone with a ChatGPT subscription), or the GPT Store ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 14]]).

## Why It Matters
- A setting decides whether conversations with the GPT are shared with OpenAI "to improve our models" or kept private ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 13]]).
- The tutorial suggests a GPT for any task done again and again, such as one per class with the textbook uploaded, or one that pulls information from a weekly invoice ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 9]]), ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 15]]).

> [!caution] Sources disagree
> Stratvert: a GPT "has all the different knowledge and data available on the internet," though it can't answer what it doesn't know ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 9]]). vs. IBM: what a model knows depends on its training data and knowledge cutoff date, so newer or missing data has to be retrieved ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 1]]).

> [!caution] Accuracy check
> The tutorial says you "teach" a custom GPT ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 1]]), that other GPTs were "trained" on papers or GitHub data ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 2]]), and that you can "train" yours on an invoice ([[Kevin Stratvert - How to Create a Custom GPT (transcript)|Stratvert, custom GPT, ch. 15]]). What it demonstrates is writing instructions and uploading files. IBM's video uses training to mean changing a model's weights, as in [[Fine-Tuning|fine-tuning]] ([[IBM Technology - RAG vs Fine-Tuning vs Prompt Engineering (transcript)|IBM, RAG vs. fine-tuning, ch. 2]]). Check which sense applies before relying on "trained" here.

> [!todo] Gap in the source
> The tutorial has no recording date, so the interface it shows may have changed since.
