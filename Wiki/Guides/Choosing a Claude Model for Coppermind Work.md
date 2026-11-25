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
drafted_by: Claude (claude-opus-5-5; Tinmind, health check, query depth and Nicrosil updates by claude-sonnet-5-5)
drafted_on: 2026-11-17
verified_on: 2026-11-24
---
> [!summary]
> Which Claude model to pick for each kind of Coppermind and Tinmind work: ingesting sources, health checks, queries, editing pages, transcribing scans of my handwriting, and building tools. ==Opus is the default for anything that needs judgment about sources, attribution, links, or reading my handwriting faithfully; Sonnet handles routine and tool-building work; Haiku handles mechanical chores; Fable is the escalation for the largest, longest jobs.== No model replaces my verify step.[^1]

## The four models (as of November 2026)
- **Claude Fable 5.2:** Anthropic's most capable generally available model, for demanding reasoning and long-horizon agentic work.[^2]
  - Costs twice as much as Opus per token ($8 / $40 per million input / output tokens, against $4 / $20), so it uses up plan limits fastest.[^2]
- **Claude Opus 5.5:** for long-running agentic coding and knowledge work; Anthropic's suggested starting point for most workloads.[^2]
- **Claude Sonnet 5.5:** "the best combination of speed and intelligence," for everyday coding, content creation, and agentic tool use, at half Opus's price.[^2][^3]
- **Claude Haiku 5.5:** the fastest and cheapest, for high-volume tasks such as classification, extraction, and routing.[^2]
- All four have a 1M-token context window, so a whole class-notes file fits in any of them, and all four take images as input, so any of them can read a scan.[^2] ==The difference is how carefully they reason, not how much they can read.==
- **Effort is a second dial.** Anthropic notes that turning effort up or down is often a better lever than switching models.[^3] Before moving up a model, try the same model at higher effort, if the app offers the setting. On the API the default effort is `high` for Fable and Sonnet and `medium` for Opus and Haiku, and Anthropic suggests trying Opus at higher effort before moving to Fable.[^2]
- I re-checked this list against the models overview on 2026-11-22: the four models, their prices and their context windows have not changed.[^2]

## What the log already shows
- Opus did the large ingests, the schema rework that fixed the typed links, the ingest prompt, and the vault skeleton.[^4]
- Sonnet built and revised the Nicrosil plugin and the Dashboard, ran the first health check,[^5] and did one small ingest, [[ACH GenAI Workflow]].[^4] The Nicrosil guide credits Sonnet with most of the plugin since then, including the Tinmind's dashboard, course tree, Notebook and transcription queue, and Opus with the review queue and flags.[^12]
- That first health check found 82% of typed links were `related`, many from early ingests. The fix needed the kind of rule-following across many pages that this guide sends to Opus.[^6] Health checks now start with a script that does the mechanical checks.[^16]
- **As of 2026-11-22, nothing has been transcribed.** The 119 scans of my handwritten notes have been shrunk and are waiting in `Sources/Scans/`,[^18] so the Tinmind rows below come from the rules, not from a model's track record. After the first batch, I should update this section.

## By task

| Task                                                                                 | Default           |
| ------------------------------------------------------------------------------------ | ----------------- |
| Ingest a source[^7]                                                                  | Opus              |
| Triage new sources into Triage                                                       | Sonnet            |
| Health check: run the script, write the report                                       | Sonnet            |
| Health check: judgment checks (citations, contradictions, typed links)               | Opus              |
| Query, quick or standard (a lookup or a compare)[^23]                                | Sonnet            |
| Query, deep, or a synthesis, disagreement or gap, or one to file back as an Analysis | Opus              |
| Mechanical edits (typos, formatting, a renamed link)                                 | Haiku             |
| Content edits to a page, or any change to a verified page                            | Opus              |
| Schema change                                                                        | Opus, high effort |
| New guide or prompt page                                                             | Opus              |
| Plugin, Dashboard, or tool: small feature or fix                                     | Sonnet            |
| Plugin or tool: new feature, or a bug Sonnet couldn't fix                            | Opus              |
| Transcribe scans into Tinmind notes[^15]                                             | Opus              |
| Recreate a flagged drawing as a diagram or table[^15]                                | Opus              |
| Shrink new scans (`shrink_scans.py`)[^15]                                            | Haiku             |
| Tinmind chores: empty course files, the dashboard page, fixing a note I name[^17]    | Haiku             |
| Export test[^8]                                                                      | Sonnet            |

### Ingesting
- **Use Opus.** Ingest is where the schema's hardest rules apply at once:
  - keeping the four voices apart, and flagging "Whose view is this?" lines instead of guessing[^9]
  - citing every claim to the right date heading or page
  - picking typed links in table order, with a reason for each[^10]
- **Sonnet is fine** for one short, well-structured source, such as a single video transcript. Check its typed links and attribution more closely.
- **Move up to Fable** for a batch of several long sources ingested in one session, or a dense PDF that touches many existing pages, where the job runs long and has to stay consistent.

### Health checks
- **Run the script first, with any model.** `Tools/health-check/coppermind_check.py` does the mechanical checks: footnotes, broken links, orphans, the typed-link mix, open flags, draft age, index sync and Triage. Sonnet is enough to run it and write the report, and Haiku is enough to run it and file the result.[^16]
- **Judgment checks: use Opus.** The checks that matter most need judgment: whether a citation supports its claim, whether two pages contradict each other, whether a typed link holds up.[^11] The script lists the pages that need them, so Opus reads only those unless I asked for the whole wiki or a folder.[^16]
- **Sonnet is enough** for a check of one folder.
- **Fable** is for the whole wiki, when the judgment checks run long and have to stay consistent.

### Queries
- **I name the depth when I ask** (quick, standard or deep), which sets how far the model reads and how long the answer is.[^23] The model should match.
- **Quick or standard** ("which page covers PredPol?", "what did SAIL say on 10/20/26?", a compare of two ideas): Sonnet, or Haiku for a quick "where is it" question.
- **Deep, synthesis, disagreement or gap:** Opus. A deep query follows typed links one hop in both directions and goes looking for the opposing view on purpose, and a disagreement answer gives no winner unless a source does. It also has to keep verified and draft pages apart, quote my Perspectives only as my view, and say what's missing instead of filling gaps.[^14] An answer I might file back to `Wiki/Analyses/` belongs here too.

### Improving pages
- **Mechanical fixes** (typos, formatting, a renamed link): Haiku, or Sonnet if the fix spans many files. There are no index lines to edit: Nicrosil keeps the index, using each page's summary callout,[^22] so the summary callout on a new page is worth getting right.
- **Content changes** (rewriting a section, adding a claim, splitting a long page): Opus, because each change needs a citation and the right attribution.
- **Anything touching a verified page:** Opus. The change sends the page back to `draft` and is reviewed item by item,[^1] so it's worth getting right the first time.

### The Tinmind
- **Say the task is about the Tinmind, in the first message.** An agent works in `The Tinmind/` only on a task I tell it is about the Tinmind, and in any other task it leaves the folder alone.[^17] Whichever model I pick, it also reads `SCHEMA - Transcription` for that task.[^15]
- **Transcribing: use Opus.** Every rule in it is about faithfulness, and a model that gets one wrong does it quietly:
  - write what I wrote, with no correcting, summarizing or tidying, and no turning a line of mine into a neutral fact
  - mark a best guess `[?word?]` and an unreadable stretch `[??]`, never guess silently
  - decide from what the page says (course, date) which class session each line belongs to
  - flag every drawing, in two plain sentences with no interpretation[^15]

  I review each transcription beside its scan in the queue, but I can only catch what I notice, so a wrong word with no mark costs more than a model that is a little slower.[^19]
- **Sonnet is worth trying** on clean, upright, well-lit pages once a sample has come back clean. Run the same session through both, and count what I correct in the queue.
- **Work one class session at a time**, and only the pages I name.[^15] With 119 scans waiting,[^18] that also keeps one run inside plan limits.
- **Recreating a drawing: Opus.** The recreation may use only what the drawing shows and my labels, and the model has to say so when it can't make one faithfully.[^15] A simple table or a short flow can go to Sonnet.
- **Shrinking scans and Tinmind chores** are mechanical: Haiku can run the shrink script, build empty course files, and fix a note I name. Never a note I've already reviewed unless I ask.[^15][^17]
- **The Tinmind stays outside queries, ingests and health checks,** so those rows don't apply to it. If I later want a note in the wiki, it goes through Ingest like any other source, and the Ingest row applies.[^15]

### Building features and tools
- **Small plugin or Dashboard changes, CSS, a new hotkey:** Sonnet. This is what built Nicrosil.[^4][^12]
- **A new feature with many moving parts**, or a bug Sonnet has tried and failed to fix: Opus.
- **A ground-up rebuild** of Nicrosil or a tool in `Tools/`: Fable.
- **Every Nicrosil session, even one with a single style tweak, comes with bookkeeping:** one version bump in `manifest.json`, one line in the changelog and one `tool` log entry for the session, and the guide's sections only when what Nicrosil does has changed; the code is edited in the plugin's `src/` parts and built with `build.py`.[^20] A model that skips them is what the 2026-11-19 rule was written to stop,[^21] so I check they were done, whichever model made the change.
- Whichever model builds it, I test it in Obsidian before relying on it, in the Coppermind's mode and the Tinmind's, because Nicrosil now has both,[^19] and when what it does changes, the guide that describes it[^12] is updated in the same session.

## Steps: choosing for a session
1. Find the task in the table above and start with the default.
2. If the result misses rules (wrong attribution, weak typed links, citations that don't hold, a transcription that corrected my words), redo it at higher effort first, then one model up.
3. If a routine task keeps coming back clean, try it one model down next time.
4. Make sure `drafted_by` names the model that actually wrote the draft, e.g. `Claude (claude-sonnet-5-5)`.[^13] Over time this shows which model's drafts needed the most correction. A transcribed note has no `drafted_by`, so for those the `transcribe` log entry's Calculate line should name the model.[^15]
5. Review the result the same way whichever model wrote it.[^12]

## Troubleshooting
- **A model isn't in the picker:** which models I can use depends on my plan. Use Opus at higher effort instead.
- **I hit usage limits mid-ingest:** split the batch in Triage, or let Sonnet draft the source cards and Opus draft the pages.
- **I hit usage limits mid-transcription:** stop at a class session boundary and run the rest later. Every note already made is a draft in the queue.[^15]
- **A transcription fixed my spelling, or guessed a word without marking it:** redo that session at higher effort, then one model up. The rule is to keep my words and mark every guess.[^15]
- **A drawing flag explains the drawing instead of describing it:** ask for a redo. A flag is one or two plain sentences with no interpretation.[^15]
- **The agent says it can't open the Tinmind:** tell it the task is about the Tinmind.[^17]
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
[^15]: [[SCHEMA - Transcription|Schema: Transcription]]
[^16]: [[SCHEMA - Health Check#Running a health check|Schema: Health Check, running one]]
[^17]: [[_AGENTS]], Permissions
[^18]: [[_log 11-26]], 2026-11-22 schema entry, 9.0
[^19]: [[Nicrosil#The Tinmind]]
[^20]: [[SCHEMA - Changes#Nicrosil and other tools|Schema: Changes, Nicrosil]]
[^21]: [[_log 11-26]], 2026-11-19 schema entry, 7.1
[^22]: [[Nicrosil#The index and the log]]
[^23]: [[SCHEMA - Query#Depth|Schema: Query, depth]]
