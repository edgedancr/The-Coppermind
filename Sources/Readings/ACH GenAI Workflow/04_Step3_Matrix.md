# Step 3 — Matrix Construction

## Objective

Systematically assess each evidence item against each hypothesis to build the ACH diagnosticity matrix. This is the analytical engine of the entire process.

## Prompt

```
Build the ACH matrix using the approved hypotheses from Step 1 and the approved evidence list from Step 2.

Create a table with:
- Rows: each evidence item (use the E1, E2... labels)
- Columns: each hypothesis (use the H1, H2... labels)
- Cell values: rate each evidence-hypothesis pair using this scale:
  - **CC** — Strongly Consistent: this evidence is highly expected if this hypothesis is true
  - **C** — Consistent: this evidence is compatible with this hypothesis
  - **N** — Neutral / Not Applicable: the evidence has no meaningful bearing on this hypothesis
  - **I** — Inconsistent: this evidence argues against this hypothesis
  - **II** — Strongly Inconsistent: this evidence is very difficult to reconcile with this hypothesis

Rules for rating:
1. Evaluate each cell INDEPENDENTLY. Do not let your rating of one cell influence how you rate adjacent cells in the same row or column.
2. For each rating, provide a brief parenthetical justification (one phrase) explaining why. Example: "I (this evidence contradicts the timeline required by H2)"
3. After completing the matrix, add a final row: "Total I + II count" for each hypothesis.
4. Add a "Diagnosticity" column on the right. For each evidence row, rate its diagnosticity:
   - **High** — ratings vary significantly across hypotheses (e.g., CC for one, I for another)
   - **Medium** — some variation exists
   - **Low** — same or nearly same rating across all hypotheses (non-diagnostic)
5. Flag any evidence item rated Low diagnosticity. These items do not help distinguish between hypotheses and should be deprioritized in the analysis.

Present the completed matrix.

Checkpoint.
```

## Analyst Checkpoint

This is the most important review point in the entire workflow. Take time here.

- **Challenge every cell.** Read each rating and its justification. Are you persuaded? Would you rate it differently based on your domain knowledge?
- **Watch for confirmation drift.** Is the AI rating evidence more favorably for whichever hypothesis it seems to prefer? Look for patterns where one column is suspiciously clean.
- **Check non-diagnostic items.** If most of your evidence is rated Low diagnosticity, the evidence base is not doing useful work. You may need to return to Step 2 and add more discriminating evidence.
- **Check for harsh ratings on unlikely hypotheses.** ACH is designed to protect unlikely-but-true hypotheses. If the AI is rating a "long shot" hypothesis as II across the board without strong justification, push back.
- **Verify absent-evidence ratings.** Items tagged [Absent] in Step 2 should be rated as Inconsistent with hypotheses that would predict their presence. Confirm the AI handled these correctly.

Make corrections by telling the AI which cells to change and why. When satisfied, approve the matrix.
