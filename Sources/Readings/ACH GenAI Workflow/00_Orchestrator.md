# ACH GenAI Workflow — Orchestrator Guide

## What This Is

This is a modular prompt workflow for conducting Analysis of Competing Hypotheses (ACH) with a generative AI assistant. It is designed for intelligence students and analysts who want to use AI as a structured reasoning partner — not a replacement for analytic judgment.

The workflow is broken into **seven step documents** (Steps 0–6). Each step contains a prompt you copy into your AI conversation, built-in guardrails for the AI, and a checkpoint where you — the analyst — review, correct, and approve before moving on.

## The Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **Step 0 — Context & Rules** | Sets the AI's role, methodology, and constraints | Always. Start every ACH session with this. |
| **Step 1 — Hypotheses** | Generates competing hypotheses | Always. |
| **Step 2 — Evidence Collection** | Compiles the evidence base | Always. Asks you how evidence will be gathered (you provide it, AI researches it, or hybrid). |
| **Step 3 — Matrix Construction** | Builds the diagnosticity matrix | Always. |
| **Step 4 — Analysis & Linchpins** | Interprets the matrix and identifies fragile assumptions | Always. |
| **Step 5 — Devil's Advocate** | Stress-tests the leading hypothesis | Always. |
| **Step 6 — Report** | Produces the final analytic product | Always. |

## How to Use These Documents

**Option A: Sequential prompting.** Open a conversation with your AI tool. Copy the Step 0 prompt first, then proceed through Steps 1–6 in order, pausing at each checkpoint. This is the recommended approach for learning ACH.

**Option B: Project context.** Upload all step documents into a Claude Project, NotebookLM notebook, or similar tool as reference material. Then tell the AI: *"Follow the ACH workflow in the uploaded step documents. Begin with Step 0."* The AI will use the documents as instructions.

**Option C: Selective use.** If you have already completed some steps manually (e.g., you already have hypotheses and evidence), you can skip to the relevant step. However, always start with Step 0 to establish the rules, and never skip Step 5 (Devil's Advocate).

## Rules for the Analyst

1. **You own the product.** The AI drafts; you decide. Every checkpoint exists so you can correct, add, or override the AI's work.
2. **Verify evidence.** The AI may hallucinate sources, fabricate data, or mischaracterize reports. Every factual claim in the evidence list must be verified before it enters the matrix.
3. **Add what the AI can't see.** If you have access to classified reporting, internal documents, or domain expertise the AI lacks, inject that evidence at Step 2. The AI cannot do ACH on information it doesn't have.
4. **Don't skip steps to save time.** The structure is the point. Skipping steps — especially the Devil's Advocate — defeats the purpose of using ACH at all.
5. **Treat confidence levels as qualitative, not calibrated.** When the AI says "moderate confidence," it is using a label, not a statistical probability. Your judgment determines the final confidence assessment.

## When This Workflow Works Well

- You have a genuine analytic question with multiple plausible explanations
- You bring domain knowledge and can challenge the AI's reasoning
- You use every checkpoint as a real decision point
- You combine AI-generated evidence with your own verified sources

## When This Workflow Fails

- You copy-paste every AI output without review (automation bias)
- The entire evidence base is AI-generated and unverified (hallucination risk)
- The analytic question is too vague to generate meaningful hypotheses
- You treat the final output as finished intelligence without editorial review

---

*This orchestrator is part of the SAIL course ACH module. Companion document: ACH Student Primer.*
