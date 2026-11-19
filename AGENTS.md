# Instructions for AI agents

This folder is the Coppermind, Harrison's LLM wiki. Before doing anything here, read `SCHEMA.md` and follow it. It is the rulebook for structure, naming, citation, review, and the index and log.

Key rules, in case of doubt: draft only, never mark a page verified without Harrison's explicit instruction, never edit `Sources/` originals or anything in `Perspectives/`, and log every operation in `log.md`.

`Tools/` holds the tools Harrison uses (browser extensions, scripts). Read it if relevant, but build or change a tool only when he asks. It is not part of the wiki: no status, not in the index. See `SCHEMA.md` §2.

`Ingest Queue.md` lists the sources waiting to be ingested, in batches. Mark a batch done at the end of each ingest that comes from it. It is a plan, not a page: no status, not in the index. See `SCHEMA.md` §2.

`Health Checks/` holds one short report for each health check, written from `_templates/Health Check Report.md`. Save a new report at the end of every health check and record Harrison's decisions in it. It is an archive, not part of the wiki: no status, not in the index. See `SCHEMA.md` §2 and §10.

When Harrison tells you to change a verified page, set it back to `draft`, keep its `verified_on`, and add one line per change to its `changes_since_verified` property in the same edit (`YYYY-MM-DD: what changed (why)`); when the change is in one section, end the line with a link to it, `[[#Heading]]`, so Harrison can click the line to go there. Never put that note in the page text. This applies to `SCHEMA.md` too: when you edit the schema, set it to `draft` and add its `changes_since_verified` lines in the same edit, as well as the changelog line. See `SCHEMA.md` §7 rule 8.
