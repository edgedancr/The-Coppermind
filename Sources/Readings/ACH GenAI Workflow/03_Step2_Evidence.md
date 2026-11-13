# Step 2 — Evidence Collection

## Objective

Compile the evidence base that will populate the ACH matrix. This step begins by determining HOW evidence will be gathered, then follows the appropriate path.

## Prompt — Part A: Determine Evidence Mode

```
Before we compile evidence, I need to establish how the evidence for this analysis will be gathered. Please ask me which of the following modes I want to use:

**Mode 1 — Analyst-Provided:** I will supply the evidence. Your role is to help me structure, clarify, and assess it for completeness. You will not independently research or generate evidence items.

**Mode 2 — AI-Researched:** You will research and compile evidence using available tools (web search, uploaded documents, your training knowledge). I will verify and supplement your findings.

**Mode 3 — Hybrid (Recommended):** I will provide some evidence from my own sources. You will supplement it with additional research. We will then merge both sets into a unified evidence list.

Which mode should we use?
```

**Analyst Action:** Select the mode that fits your situation. Mode 3 (Hybrid) is the default recommendation because it combines your domain knowledge and access to restricted sources with the AI's breadth. Mode 1 is appropriate when working with classified or proprietary information the AI cannot access. Mode 2 is appropriate for training exercises or open-source analysis.

---

## Prompt — Part B: Collect Evidence

After selecting the mode, use the appropriate prompt below.

### If Mode 1 (Analyst-Provided):

```
I will now provide my evidence. For each item I give you, do the following:
- Assign it a sequential evidence number (E1, E2, E3...).
- Restate it in a clear, concise, single-sentence format suitable for matrix analysis.
- Tag it with a source category: [OSINT], [HUMINT], [SIGINT], [GEOINT], [SME Assessment], [Logical Inference], [Open Source], [Internal Document], or another appropriate tag I specify.
- If an item is vague or could be interpreted multiple ways, ask me to clarify before finalizing it.

After I have finished providing evidence, I will say "Evidence complete." At that point, do the following:
- Present the full numbered evidence list.
- Identify any obvious gaps: based on the hypotheses from Step 1, is there evidence we would EXPECT to see for or against specific hypotheses that is not represented? List these as potential gaps, and ask whether I want to add them, flag them as information gaps, or disregard them.
- Flag any items where absence of expected evidence could be diagnostic. Label these as "[Absent — meaningful]" or "[Absent — gap]" based on my input.

Do not proceed to matrix construction until I say "Evidence approved."

[BEGIN PROVIDING YOUR EVIDENCE ITEMS]
```

### If Mode 2 (AI-Researched):

```
Research and compile evidence relevant to the analytic question and the hypotheses generated in Step 1.

Requirements:
- Produce at least 10 evidence items. Breadth is more important than depth at this stage.
- For each item, provide:
  - A sequential evidence number (E1, E2, E3...)
  - A clear, concise, single-sentence statement of the evidence
  - A source tag: [OSINT], [Academic], [Government Report], [News Media], [SME Assessment], [Logical Inference], or another appropriate category
  - A verification status: [Verified] if you are confident in the factual accuracy, [Unverified] if you are drawing from training knowledge and cannot confirm recency or accuracy, [Assumption] if it is an inference rather than a reported fact
- Include at least 2 items addressing ABSENCE of evidence: things you would expect to see if specific hypotheses were true that do not appear to be present. Label these "[Absent]."
- Include evidence that cuts AGAINST the most obvious hypothesis, not just evidence that supports it.
- Do NOT assess how evidence relates to hypotheses yet.

If you have access to web search or uploaded documents, use them. Prioritize primary and authoritative sources over secondary commentary.

Checkpoint.
```

### If Mode 3 (Hybrid — Recommended):

```
We will build the evidence list together.

**Phase 1 — My evidence first.** I will provide evidence items from my own sources. For each item:
- Assign a sequential evidence number (E1, E2, E3...).
- Restate it clearly in a single sentence.
- Tag it with a source category I specify.
- Ask for clarification if an item is ambiguous.

I will say "My evidence complete" when I am done.

**Phase 2 — Your supplemental research.** After I finish, you will:
- Review my evidence list against the hypotheses from Step 1.
- Research and propose additional evidence items that I may have missed, focusing on:
  - Evidence that distinguishes between hypotheses (diagnostic evidence)
  - Evidence that challenges the most obvious hypothesis
  - Absence of expected evidence for specific hypotheses
- For each item you propose, include the same format: number, statement, source tag, and verification status ([Verified], [Unverified], or [Assumption]).
- Clearly label your additions as "[AI-Researched]" so I can distinguish them from my own inputs.

**Phase 3 — Merge and review.** Present the combined evidence list. I will review, approve, modify, or remove items.

Do not proceed to matrix construction until I say "Evidence approved."

[BEGIN PROVIDING YOUR EVIDENCE ITEMS]
```

---

## Analyst Checkpoint (All Modes)

Before approving the evidence list, verify the following:

- **Factual accuracy:** For AI-researched items, have you confirmed the claims are real? This is where hallucination risk is highest. Do not let fabricated evidence enter the matrix.
- **Completeness:** Are there at least 8–12 items? Are multiple hypotheses addressed? Is there evidence that cuts against the leading hypothesis, not just for it?
- **Absent evidence:** Have you considered what you would EXPECT to see if each hypothesis were true? Is that expected evidence present or absent? This is often the most diagnostic category and the most commonly overlooked.
- **Source diversity:** Does the evidence come from multiple source types? An evidence base drawn entirely from one category (e.g., all OSINT) has blind spots.
- **Verification tagging:** Is every item honestly tagged? If the AI marked something [Verified] but you cannot confirm it, downgrade it to [Unverified].
- **No premature analysis:** Neither you nor the AI should have assessed how the evidence relates to hypotheses yet. That happens in Step 3.

When satisfied, tell the AI: *"Evidence approved. Proceed to Step 3."*
