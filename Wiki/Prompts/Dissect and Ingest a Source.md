---
type: prompt
status: verified
aliases:
  - Ingest Prompt
courses:
  - SAIL
applies_to:
  - "[[LLM Wiki]]"
related:
  - "[[Think-Calculate-Verify Loop]]"
  - "[[Nicrosil]]"
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-11
verified_on: 2026-11-19
---
> [!summary]
> The prompt I paste when I want the agent to break a source into its ideas and either create new wiki pages from it or add the new information to pages that already exist. It holds only the inputs for each run; the steps themselves are in [[SCHEMA - Ingest]], and everything else (naming, properties, citations, attribution, review, index, log) comes from the rest of the schema.

## The Prompt
Fill in the five lines. Anything left blank uses the default in brackets.

```
Ingest a source into the Coppermind. Read _AGENTS.md, then SCHEMAS/SCHEMA - Ingest.md and SCHEMAS/SCHEMA - Writing Pages.md, and follow them. If this prompt and those files disagree, the files win and you tell me.

SOURCE: 
SCOPE: [default: everything not yet listed under "Ingest Progress" on its source card]
WHAT MATTERS: [default: everything substantive; skip assignment logistics, grading, and deadlines]
MODE: [default: plan first. Or "draft directly" to skip the plan step]
VERIFIED PAGES: [default: propose changes only. Or "edit" to change them directly]
```

## Why It Works
- **It points at the schema instead of copying it.** The ingest steps live in [[SCHEMA - Ingest]], and naming, properties, typed links, citation formats, and attribution in [[SCHEMA - Writing Pages]], so a rule change takes effect without editing this prompt, and the agent reads only the rules an ingest needs.
- **It dissects before it decides.** The steps list every claim with its location and voice first, so attribution is settled before any page is written, and create-or-append is decided per idea rather than per page.
- **It keeps verified pages safe by default.** Changes to a verified page always need item-by-item review,[^1] so the default is to propose them, not make them.
- **New flags use the four callout types the review plugin reads**, so they show up as badges in the queue and on the [[_dashboard]].

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
