---
type: workflow
status: draft
aliases:
  - ACH Workflow
  - ACH with AI
courses:
  - SAIL
sources:
  - "[[SRC - ACH GenAI Workflow]]"
  - "[[SRC - SAIL Class Notes (Fall 2026)]]"
applies_to:
  - "[[Analysis of Competing Hypotheses]]"
counters:
  - "[[Automation Bias]]"
  - "[[Hallucination]]"
drafted_by: Claude (claude-sonnet-5-5)
drafted_on: 2026-11-12
verified_on: 2026-11-18
changes_since_verified:
  - "2026-11-19: citations moved from parentheses to footnotes; wording unchanged (schema 6.0 citation change, approved by Harrison)"
---
> [!summary]
> The ACH GenAI Workflow is a seven-step prompt sequence (Steps 0–6) from the SAIL ACH module for running [[Analysis of Competing Hypotheses]] with a generative AI assistant as a structured reasoning partner, not a replacement for analytic judgment.[^1] Each step has a prompt, guardrails for the AI, and a checkpoint where the analyst reviews and approves before moving on. ==The AI drafts; the analyst decides==.[^1]

## Steps
1. **Step 0, Context & Rules.** Sets the AI's role and constraints before any analysis: use disconfirmation, never collapse to one hypothesis early, never fabricate evidence, and give no conclusion until Step 6.[^2]
2. **Step 1, Hypotheses.** The AI lists at least four, including one unlikely but plausible, one contrarian or adversary view, and one that involves deception. It does not rank them.[^3]
3. **Step 2, Evidence.** The analyst picks a mode: analyst-provided, AI-researched, or hybrid (the recommended default). Each item gets a number, a source tag, and, if AI-researched, a verification status of `[Verified]`, `[Unverified]` or `[Assumption]`. Expected-but-missing evidence is labeled `[Absent — meaningful]` or `[Absent — gap]`.[^4] See [[Meaningful Absence]].
4. **Step 3, Matrix.** Each evidence–hypothesis pair is rated CC, C, N, I or II with a one-phrase reason. The matrix totals I + II per hypothesis and rates each row's diagnosticity High, Medium or Low.[^5] See [[Diagnostic Evidence]].
5. **Step 4, Analysis & Linchpins.** Hypotheses are ranked by fewest I and II ratings, the 3–5 most diagnostic items are listed, linchpins are identified, and information gaps are named.[^6] See [[Linchpin Evidence]].
6. **Step 5, Devil's Advocate.** The AI attacks the leader, defends the runner-up, tests each linchpin, and checks for deception and [[Mirror Imaging]]. It ends with "Ranking holds," "Ranking shifts," or "Confidence reduced".[^7] The orchestrator says never to skip this step.[^1]
7. **Step 6, Report.** The final product has a BLUF with a stated confidence level, hypothesis rankings, key evidence, linchpins, collection requirements, observable milestones, any dissenting view, and a methodology note.[^8]

## Checks
- **Three ways to run it:** sequential prompting (recommended for learning), uploading all step documents as project context, or selective use. Always start with Step 0.[^1]
- **Five rules for the analyst:** own the product, verify evidence, add what the AI can't see, don't skip steps, and treat confidence levels as qualitative, not calibrated.[^1]
- **Matrix review (Step 3):** challenge every cell, watch for confirmation drift, and push back on harsh ratings of unlikely hypotheses.[^5]
- **Final review (Step 6):** check every factual claim for hallucination, check that confidence matches the number and fragility of linchpins, and edit the report as your own.[^8]

## Common Mistakes
- Copy-pasting every AI output without review, which the orchestrator calls automation bias.[^1]
- Using an evidence base that is entirely AI-generated and unverified.[^1]
- Starting from a vague analytic question.[^1]
- Treating the final output as finished intelligence without editorial review.[^1]

## Footnotes
[^1]: [[SRC - ACH GenAI Workflow|ACH Workflow, Orchestrator]]
[^2]: [[SRC - ACH GenAI Workflow|ACH Workflow, Step 0]]
[^3]: [[SRC - ACH GenAI Workflow|ACH Workflow, Step 1]]
[^4]: [[SRC - ACH GenAI Workflow|ACH Workflow, Step 2]]
[^5]: [[SRC - ACH GenAI Workflow|ACH Workflow, Step 3]]
[^6]: [[SRC - ACH GenAI Workflow|ACH Workflow, Step 4]]
[^7]: [[SRC - ACH GenAI Workflow|ACH Workflow, Step 5]]
[^8]: [[SRC - ACH GenAI Workflow|ACH Workflow, Step 6]]
