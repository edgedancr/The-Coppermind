---
type: health-check
date: "{{date:YYYY-MM-DD}}"
scope: whole vault
checked_by: 
pages_checked: 
flags_total: 
flags_open: 
previous: 
---
%% A health check report: a short, dated snapshot of the whole wiki (or one folder). Saved as "Health Checks/Health Check YYYY-MM-DD.md" (add " (2)" if a second one is saved the same day).
Not a wiki page: no status, not in index.md, not verified. The agent writes it; Harrison decides each flag.
Keep it to about one screen. Write for a reader who has 60 seconds. Delete nothing from the At a glance table, so reports stay comparable over time.
scope = "whole vault" or the folder checked. previous = link to the last report in quotes, e.g. "[[Health Check 2026-11-10]]". Leave empty on the first report.
flags_open = flags I haven't decided yet. The agent updates flags_open and each Decision line after I decide. %%

> [!summary]
> %% 2–3 sentences, bottom line first: how healthy the wiki is right now, and the one to three things that most need my decision. %%

## At a glance

| Check | Flags | Since last check |
|---|---|---|
| Claims without citations, or citations that don't support them | | |
| Contradictions between pages | | |
| Typed links that don't hold up, or links that are missing | | |
| Typed-link mix: share that are `related`, relationships stored twice | | |
| Broken links, orphan pages, duplicate pages | | |
| "Whose view?" and unsourced-background callouts still open | | |
| Drafts older than 14 days | | |
| Verified pages changed since they were verified | | |
| Gaps in sources ("?" placeholders, empty definitions) | | |
| Pages missing from the index, or index entries with no page | | |
| `Ingest Queue.md` out of date | | |
| Anything else found (properties, formatting) | | |
| **Total** | | |

%% Flags = the number of numbered flags below for that check. One flag can cover many pages; say how many in its text. Since last check: "+2", "−1", "same", or "new" on the first report.
For the typed-link mix, give the counts in the flag's text: links of each type, the share that are `related`, and how many relationships are stored twice. %%

## Needs my decision
%% Flags that need judgment. Numbered, most important first, numbering continues into the next section. If there are more than 10, list the top 10 and group the rest by check, with a count and the pages involved. Leave Decision blank for me: fix, accept as is, or defer (with a one-line reason if deferred). %%

1. **[[Page]]** (check name): what's wrong.
   - **Fix:** the suggested fix
   - **Decision:** 

## Mechanical fixes
%% Index updates, broken-link fixes, formatting, and typos. One line each. I can approve these as a single batch after reading them (SCHEMA §7). %%

**Batch decision:** 

-  

## Since last check
%% New: n · Carried over: n · Resolved: n. One line on anything that got better or worse. On the first report, write "First health check; nothing to compare." %%

## Scope and limits
- **Checked:** %% whole vault or folder, and how many pages %%
- **Not checked, or couldn't check:** %% anything skipped, and why %%
