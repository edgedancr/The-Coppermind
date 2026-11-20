---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-19
verified_on: 2026-11-19
---
The Coppermind must outlive any one tool or agent.

## Keeping it portable

1. **Everything that matters is plain text:** Markdown pages, YAML properties, and `[[wikilinks]]`. Images, PDFs, and tools sit in ordinary folders.
2. **Obsidian-only extras are conveniences, never the only copy of anything:** `Review Queue.base`, `Health Check History.base`, the Nicrosil plugin, CSS snippets, themes, and `.obsidian/` settings. Outside Obsidian, the pages themselves are plain text and read fine.
3. **The rules are written in plain language**, so any agent can follow them. `AGENTS.md` is where every agent starts, and `CLAUDE.md` loads it for Claude Code. For a new agent, point its instructions file at `AGENTS.md`.

## Moving to a new tool

1. Commit everything, then copy the whole folder (or clone the git repository).
2. If the new tool doesn't support `[[wikilinks]]`, convert them to standard Markdown links (`[Text](Page%20Name.md)`). Obsidian can do this through Settings → Files and links → turn off "Use `[[Wikilinks]]`", then use a link-conversion plugin or script on the whole vault.
3. Heading links (`[[Page#Heading]]`) become anchor links (`Page.md#heading`).
4. YAML properties carry over as-is to most Markdown tools. For Notion, import the folder as Markdown and check that the properties came through.
5. Open three pages at random and check that links, citations, and images still work. Log the export.
