---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-19
verified_on: 2026-11-19
---
How the rules, templates, and tools change, and how each change is recorded.

## Changing the rules

The rules are `AGENTS.md` and the files in `SCHEMAS/`. Together they are one rulebook with one version number, kept in the `version` property of [[SCHEMA]].

- **The agent may suggest changes in chat**, especially after a health check, **but only I approve them**, and the agent edits a rule file only when I ask for a specific change.
- **Put each rule in the one file it belongs to**, using the table in [[SCHEMA#The rule files]]. Don't repeat a rule in a second file; point to it. A rule every task needs goes in `AGENTS.md`, and `AGENTS.md` stays short, because every agent reads it every time.
- **Version numbers:** small clarifications bump the decimal (1.0 → 1.1); changes to structure or workflow bump the whole number.
- **Every change gets three records, written in the same edit:**
  1. **A change note on each rule file changed.** The agent sets that file to `draft`, keeps its `verified_on`, and adds one line per rule changed to its `changes_since_verified`, exactly as for any verified page ([[SCHEMA - Review#Changing a verified page]]). `AGENTS.md` has no properties, so a change to it is noted on [[SCHEMA]]. I re-review only the listed changes, and the notes are deleted when I verify the file.
  2. **A line in [[Schema Changelog]]**, with the new version and date, naming the files and sections changed. The **Log a schema change** button in [[Nicrosil]] adds it and updates the version in [[SCHEMA]].
  3. **A `schema` entry in the log.**

  The change note and the changelog do different jobs: the changelog is the permanent history of every version, and the note is the short list I re-review, deleted when I verify the file. The agent writes both, and a changelog line never stands in for the note.
- **If the list of health checks changes,** the agent updates the Health Check Report template and the check script to match ([[SCHEMA - Health Check#The checks]]).
- **If a page type's properties or sections change,** the agent updates its template in `_templates/` in the same edit.

## Tools

`Tools/` is where I keep the tools I use: browser extensions, scripts, and similar things, each as a single file, folder, or zip. It is not one of the six parts and not a wiki page folder: files there have no `status`, are not in `index.md`, and I don't verify them. They are my own working equipment, not sources or knowledge.

- **I add and update the tools.** The agent may read them, and may build or revise one only when I ask.
- **A tool that helps feed the wiki** (such as the YouTube transcript extension) does not change the rules for sources: whatever it produces still goes through Ingest like any other source.
- **A tool that helps check the wiki** (the health check script) reads files and never changes them.
- **Naming:** a plain descriptive name, with the version in a zip's name only when I keep more than one (`yt-to-coppermind.zip`).
- **Plain files only,** so the folder stays portable ([[SCHEMA - Export]]).

## Nicrosil and other tools

- **Nicrosil** lives in `.obsidian/plugins/nicrosil/`. The agent changes it only when I ask.
- **Each change bumps its version** in `manifest.json` and the [[Nicrosil]] guide, adds a line to the guide's version history, and updates the sections of the guide it affects. The guide is a verified page, so that edit sets it to `draft` with a change note ([[SCHEMA - Review#Changing a verified page]]).
- **Log it as `tool`**, briefly: the details are in the guide's version history ([[SCHEMA - Index and Log#The log]]). A small fix to a version not yet checked in Obsidian can share that version's entry rather than adding a new one.
