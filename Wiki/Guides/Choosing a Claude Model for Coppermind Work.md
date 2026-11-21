---
type: guide
status: verified
aliases:
  - Model Guide
  - Which Model to Use
courses:
  - SAIL
sources: []
type_of: []
part_of: []
example_of: []
causes: []
counters: []
applies_to:
  - "[[LLM Wiki]]"
supports: []
contradicts: []
developed_by: []
related: []
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-17
verified_on: 2026-11-19
---
> [!summary]
> Which Claude model to pick for each kind of Coppermind work: ingesting sources, health checks, queries, editing pages, and building tools. ==Opus is the default for anything that needs judgment about sources, attribution, or links; Sonnet handles routine and tool-building work; Haiku handles mechanical chores; Fable is the escalation for the largest, longest jobs.== No model replaces my verify step.[^1]

## The four models (as of November 2026)
- **Claude Fable 5.2:** Anthropic's most capable generally available model, for demanding reasoning and long-horizon agentic work.[^2]
  - Costs twice as much as Opus per token ($8 / $40 per million input / output tokens, against $4 / $20), so it uses up plan limits fastest.[^2]
- **Claude Opus 5.5:** for long-running agentic coding and knowledge work; Anthropic's suggested starting point for most workloads.[^2]
- **Claude Sonnet 5.5:** "the best combination of speed and intelligence," for everyday coding, content creation, and agentic tool use, at half Opus's price.[^2][^3]
- **Claude Haiku 5.5:** the fastest and cheapest, for high-volume tasks such as classification, extraction, and routing.[^2]
- All four have a 1M-token context window, so a whole class-notes file fits in any of them.[^2] ==The difference is how carefully they reason, not how much they can read.==
- **Effort is a second dial.** Anthropic notes that turning effort up or down is often a better lever than switching models.[^3] Before moving up a model, try the same model at higher effort, if the app offers the setting.

## What the log already shows
- Opus did the large ingests, the schema rework that fixed the typed links, the ingest prompt, and the vault skeleton.[^4]
- Sonnet built and revised the Nicrosil plugin and the Dashboard, ran the first health check,[^5] and did one small ingest, [[ACH GenAI Workflow]].[^4]
- That first health check found 82% of typed links were `related`, many from early ingests. The fix needed the kind of rule-following across many pages that this guide sends to Opus.[^6]

## By task

| Task | Default | Step down to | Step up to |
|---|---|---|---|
| Ingest a source[^7] | Opus | Sonnet, for one short, clean source | Fable, for a multi-source batch or a long PDF |
| Triage new sources into Triage | Sonnet | Haiku | Opus |
| Health check, whole vault | Opus | Sonnet, for mechanical checks only | Fable |
| Health check, one folder | Sonnet | | Opus |
| Query, quick lookup | Sonnet | Haiku | Opus |
| Query, synthesis to file back as an Analysis | Opus | | Fable |
| Mechanical edits (typos, formatting, index lines) | Haiku | | Sonnet |
| Content edits to a page, or any change to a verified page | Opus | | |
| Schema change | Opus, high effort | | Fable, if it touches most of the vault |
| New guide or prompt page | Opus | Sonnet | |
| Plugin, Dashboard, or tool: small feature or fix | Sonnet | | Opus |
| Plugin or tool: new feature, or a bug Sonnet couldn't fix | Opus | | Fable, for a ground-up rebuild |
| Export test[^8] | Sonnet | | |

### Ingesting
- **Use Opus.** Ingest is where the schema's hardest rules apply at once:
  - keeping the four voices apart, and flagging "Whose view is this?" lines instead of guessing[^9]
  - citing every claim to the right date heading or page
  - picking typed links in table order, with a reason for each[^10]
- **Sonnet is fine** for one short, well-structured source, such as a single video transcript. Check its typed links and attribution more closely.
- **Move up to Fable** for a batch of several long sources ingested in one session, or a dense PDF that touches many existing pages, where the job runs long and has to stay consistent.

### Health checks
- **Whole vault: use Opus.** The checks that matter most need judgment: whether a citation supports its claim, whether two pages contradict each other, whether a typed link holds up.[^11]
- **Sonnet is enough** for the mechanical rows: broken links, index sync, draft age, Triage, and link counts. It is also enough for a check of one folder.
- **A useful split:** run the mechanical rows with Sonnet, then ask Opus to check only the citation, contradiction, and typed-link rows.

### Queries
- **Quick lookups** ("which page covers PredPol?", "what did SAIL say on 10/20/26?"): Sonnet, or Haiku for pure "where is it" questions.
- **Synthesis** across several pages, especially an answer I might file back to `Wiki/Analyses/`: Opus. It has to keep verified and draft pages apart, quote my Perspectives only as my view, and say what's missing instead of filling gaps.[^14]

### Improving pages
- **Mechanical fixes** (typos, formatting, index lines, a renamed link): Haiku, or Sonnet if the fix spans many files.
- **Content changes** (rewriting a section, adding a claim, splitting a long page): Opus, because each change needs a citation and the right attribution.
- **Anything touching a verified page:** Opus. The change sends the page back to `draft` and is reviewed item by item,[^1] so it's worth getting right the first time.

### Building features and tools
- **Small plugin or Dashboard changes, CSS, a new hotkey:** Sonnet. This is what built Nicrosil.[^4]
- **A new feature with many moving parts**, or a bug Sonnet has tried and failed to fix: Opus.
- **A ground-up rebuild** of Nicrosil or a tool in `Tools/`: Fable.
- Whichever model builds it, I test it before relying on it, and the guide that describes it[^12] gets updated in the same session.

## Steps: choosing for a session
1. Find the task in the table above and start with the default.
2. If the result misses rules (wrong attribution, weak typed links, citations that don't hold), redo it at higher effort first, then one model up.
3. If a routine task keeps coming back clean, try it one model down next time.
4. Make sure `drafted_by` names the model that actually wrote the draft, e.g. `Claude (claude-sonnet-5-5)`.[^13] Over time this shows which model's drafts needed the most correction.
5. Review the result the same way whichever model wrote it.[^12]

## Troubleshooting
- **A model isn't in the picker:** which models I can use depends on my plan. Use Opus at higher effort instead.
- **I hit usage limits mid-ingest:** split the batch in Triage, or let Sonnet draft the source cards and Opus draft the pages.
- **The model names here are out of date:** newer models replace these, and each has a published retirement date.[^2] Check the [Models overview](https://platform.claude.com/docs/en/about-claude/models.md) and update the four model descriptions; the tiers' roles change less often than the version numbers.

## Footnotes
[^1]: [[SCHEMA - Review|Schema: Review]]
[^2]: [Models overview](https://platform.claude.com/docs/en/about-claude/models.md)
[^3]: [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
[^4]: [[_log 11-26]]
[^5]: [[Health Check 2026-11-17]]
[^6]: [[_log 11-26]], 2026-11-17 schema entry
[^7]: [[Dissect and Ingest a Source]]
[^8]: [[SCHEMA - Export|Schema: Export]]
[^9]: [[SCHEMA - Writing Pages#Citations|Schema: Citations]]
[^10]: [[SCHEMA - Writing Pages#Typed links|Schema: Typed links]]
[^11]: [[SCHEMA - Health Check|Schema: Health Check]]
[^12]: [[Nicrosil]]
[^13]: [[SCHEMA - Writing Pages#Page properties|Schema: Page properties]]
[^14]: [[SCHEMA - Query|Schema: Query]]
