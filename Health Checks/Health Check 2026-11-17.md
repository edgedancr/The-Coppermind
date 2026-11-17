---
type: health-check
date: "2026-11-17"
scope: whole vault
checked_by: Claude (claude-sonnet-5-5)
pages_checked: 236
flags_total: 11
flags_open: 11
previous:
---
> [!summary]
> The wiki is structurally healthy: all 236 pages are in the index under the right heading, no links are broken, no draft is older than 14 days, and every direct quote I checked against the class notes is in the section it cites. The two things most worth your attention are a verified prompt page that was edited after it was verified, with nothing in the log, and how typed links are used: 82% are `related`, and 70 pairs are stored on both pages. Nine of the 11 flags need your judgment; two are mechanical.

## At a glance

| Check | Flags | Since last check |
|---|---|---|
| Claims without citations, or citations that don't support them | 1 | new |
| Contradictions between pages | 0 | new |
| Typed links that don't hold up, or links that are missing | 3 | new |
| Broken links, orphan pages, duplicate pages | 2 | new |
| "Whose view?" and unsourced-background callouts still open | 1 | new |
| Drafts older than 14 days | 0 | new |
| Verified pages changed since they were verified | 1 | new |
| Gaps in sources ("?" placeholders, empty definitions) | 1 | new |
| Pages missing from the index, or index entries with no page | 0 | new |
| `Find.md` or `Library.base` out of date | 1 | new |
| `Ingest Queue.md` out of date | 0 | new |
| Anything else found (properties, formatting) | 1 | new |
| **Total** | **11** | |

## Needs my decision

1. **[[Dissect and Ingest a Source]]** (verified page changed): the file was last modified on 2026-11-17 at 11:02. It was verified on 2026-11-11 and still says `verified`, and no log entry records an edit.
   - **Fix:** if the content changed, set it back to `draft` and log it (§7). If the edit was yours or only cosmetic, tell me and I'll log it.
   - **Decision:** 

2. **[[Find]]** (out of date, or links that no longer work): every one-click link opens a vault named `The Coppermind`, but the folder I read is named `The-Coppermind`. If that is the name Obsidian shows, none of the links will run.
   - **Fix:** tell me the vault name Obsidian uses. If it differs, I'll update the links in `Find.md` (§2).
   - **Decision:** 

3. **Reciprocal `related` links** (typed links): 70 pairs of pages store the same `related` link on both pages, and 17 of those pairs include a verified page. §5 says to store a relationship once, on the page doing the relating.
   - **Fix:** keep the link on one page of each pair. Pairs that include a verified page are reviewed item by item.
   - **Decision:** 

4. **`related` is 313 of 381 typed links** (82%): `supports` is used once and `contradicts` never. §5 says to use `related` sparingly, only when no other type fits.
   - **Fix:** I propose stronger types (`part_of`, `example_of`, `supports`) for a sample of pages, with a reason for each, and you approve each one. Or accept as is.
   - **Decision:** 

5. **Unlinked mentions** (missing links): 80 mentions of another page's title on 54 pages have no link anywhere on the page. For example, [[MITRE ATLAS]] names Prompt Injection, Jailbreak, and Data and Model Poisoning but links none of them.
   - **Fix:** I list the proposed links page by page, with a reason for each (§5).
   - **Decision:** 

6. **Four orphan pages** have no link in from any other page: [[Open Skies Treaty]], [[Bach Faucet]], and [[Ages of U.S. Intelligence]] (all verified), and [[System 1 and System 2 Thinking]] (draft).
   - **Fix:** I propose a page to link each one from, with a reason. A link added to a verified page is reviewed item by item.
   - **Decision:** 

7. **22 of 25 summaries** are linked only from the index. Source cards don't point to their summary.
   - **Fix:** add a "Summary" link to each source card, or accept, since summaries are reachable through the index and Library.
   - **Decision:** 

8. **Open callouts on 8 draft pages** (none on verified pages). "Whose view?": [[Centaur Analyst]], [[Intelligence (National Security)]], [[Intelligence vs. Consciousness]], [[Three-Ps Risk Framework]]. Unsourced background: [[System 1 and System 2 Thinking]], [[Enframing]], [[MITRE ATLAS]], [[Puzzles and Mysteries]]. Drafts also carry 28 accuracy checks and 11 "sources disagree" callouts, which [[Find]] already lists.
   - **Fix:** you resolve each one before verifying its page: attribute it, source it, move it, or cut it (§6).
   - **Decision:** 

9. **Class notes with nothing written for past dates:** SAIL 11/3, 11/5, 11/10, and 11/12, and Intro 11/12. The Intro notes also have a placeholder, "Influence of US actions TBD (Dynamic)", under "Connecting the Dots".
   - **Fix:** add the notes, or tell me those days had no class so they stop counting as gaps.
   - **Decision:** 

## Mechanical fixes

**Batch decision:** 

10. **[[Intelligence Collection Disciplines]]** lists `SRC - SAIL Class Notes (Fall 2026)` in `sources` but never cites it. Remove it from `sources`, or add the citation if something on the page came from there.
11. **Empty lists in properties:** 26 pages have `aliases: []` (13 verified), and the verified guides [[Setting Up Git for the Coppermind]] and [[Verifying Pages with the Review Buttons]] have `sources: []`. §4 says not to leave empty lists on finished pages. Remove them; the 15 verified pages are approved item by item.

## Since last check
First health check; nothing to compare.

## Scope and limits
- **Checked:** whole vault: 236 pages (204 wiki pages, 31 source cards, 1 perspective), plus `index.md`, `Find.md`, `Library.base`, `Ingest Queue.md`, and both class-notes files. Freedom's Foundations 1 is in scope but has no notes, cards, or pages yet, so Find and Library correctly leave it out.
- **Not checked, or checked only in part:**
  - Whether each citation supports its claim. I confirmed that every page cites a source, that every class-notes date link points at a real heading, and that all 21 direct quotes next to a class-notes citation appear in the cited section. I did not compare citations to the transcripts, PDFs, and other readings against their text.
  - Contradictions: I compared definitions of AGI, intelligence, generative vs. agentic AI, and hallucination, not every pair of pages.
  - Verified pages changed since verification: I used file modification dates, not git history, so a change made on the same day as the verification would not show.
  - Typed links: I checked that every target exists, not whether each link holds up. Unlinked mentions match exact titles only.
