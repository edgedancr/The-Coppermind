---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-24
verified_on: 2026-11-24
---
How the rules, templates, and tools change, and how each change is recorded.

## Changing the rules

The rules are `_AGENTS.md` and the files in `SCHEMAS/`. Together they are one rulebook with one version number, kept in the `version` property of [[SCHEMA]].

- **The agent may suggest changes in chat**, especially after a health check, **but only I approve them**, and the agent edits a rule file only when I ask for a specific change.
- **Put each rule in the one file it belongs to**, using the table in [[SCHEMA#The rule files]]. Don't repeat a rule in a second file; point to it. A rule every task needs goes in `_AGENTS.md`, and `_AGENTS.md` stays short, because every agent reads it every time.
- **Version numbers:** small clarifications bump the decimal (1.0 → 1.1); changes to structure or workflow bump the whole number.
- **One version per session.** All the rule changes made in one session are one version, numbered by the largest change in it, with one changelog line and one `schema` log entry. Each rule changed still gets its own line in its file's change note. When the agent has several changes to suggest (after a health check, or noticed during a task), it proposes them together as one list, and I approve them item by item before any is made; it doesn't make them one at a time.
- **Every change gets three records, written in the same edit:**
  1. **A change note on each rule file changed.** The agent sets that file to `draft`, keeps its `verified_on`, and adds one line per rule changed to its `changes_since_verified`, exactly as for any verified page ([[SCHEMA - Review#Changing a verified page]]). `_AGENTS.md` has no properties, so a change to it is noted on [[SCHEMA]]. I re-review only the listed changes, and the notes are deleted when I verify the file.
  2. **A line in [[Schema Changelog]]**, with the new version and date, naming the files and sections changed. The **Log a schema change** button in [[Nicrosil]] adds it and updates the version in [[SCHEMA]]. **Keep it to about 60 words:** what changed and why, and the files and sections, without restating the rules; the rule files and git hold the rest.
  3. **A `schema` entry in the log.**

  The change note and the changelog do different jobs: the changelog is the permanent history of every version, and the note is the short list I re-review, deleted when I verify the file. The agent writes both, and a changelog line never stands in for the note.
- **If the list of health checks changes,** the agent updates the Health Check Report template and the check script to match ([[SCHEMA - Health Check#The checks]]).
- **If a page type's properties or sections change,** the agent updates its template in `_templates/` in the same edit.

## Tools

`Tools/` is where I keep the tools I use: browser extensions, scripts, and similar things, each as a single file, folder, or zip. It is not one of the six parts and not a wiki page folder: files there have no `status`, are not in `_index.md`, and I don't verify them. They are my own working equipment, not sources or knowledge.

- **I add and update the tools.** The agent may read them, and may build or revise one only when I ask.
- **A tool that helps feed the wiki** (such as the YouTube transcript extension) does not change the rules for sources: whatever it produces still goes through Ingest like any other source.
- **A tool that helps check the wiki** (the health check script) reads files and never changes them.
- **Naming:** a plain descriptive name, with the version in a zip's name only when I keep more than one (`yt-to-coppermind.zip`).
- **Plain files only,** so the folder stays portable ([[SCHEMA - Export]]).

## Nicrosil and other tools

- **Nicrosil** lives in `.obsidian/plugins/nicrosil/`. The agent changes it only when I ask.
- **Edit the parts, then build.** Obsidian loads `main.js` and `styles.css`, but both are built from the parts in `src/js/` and `src/css/`, split by feature. The agent finds the part by searching `src/` (the table in `src/README.md` says what each holds), reads only the lines it needs, edits the part in place, and runs `python build.py` in the plugin folder; `python build.py --check` then says the built files match. It never edits or reads `main.js` or `styles.css` whole, and never rewrites a whole part when an in-place edit will do.
- **Every change counts, even a one-line style tweak.** Asking for the change is asking for everything below, and the agent does it without being asked. Starting a Nicrosil edit means reading this section first.
- **One version per session.** All the Nicrosil changes made in one session share one version: the agent bumps `manifest.json` once, at the first change (a patch number for fixes and looks, a minor number for a new feature), and keeps one line at the top of [[Nicrosil Changelog]] and one `tool` log entry for the session, updating that line and that entry as later changes land instead of adding new ones. Once a version is committed, its line is never rewritten.
- **The guide changes only when what Nicrosil does changes.** The [[Nicrosil]] guide carries no version number (it is in `manifest.json` and the changelog), so a fix or a change in looks doesn't touch it. When a change adds, removes or changes something the guide describes, the agent updates those sections; the guide is a verified page, so that edit sets it to `draft` with a change note ([[SCHEMA - Review#Changing a verified page]]).
- **A Nicrosil changelog line is at most two sentences:** what changed, as I would see it. No function names, CSS selectors, colors, sizes or other code details: git keeps the exact change.
- Whenever Harrison references Coppermind Gradient Style (CGS) or Tinmind Gradient Style (TGS), descriptions of those styles can be found in [[Nicrosil#Gradient styles]].
- **Log it as `tool`**, briefly: the details are in [[Nicrosil Changelog]] and git ([[SCHEMA - Index and Log#The log]]). One entry per session, as above.
- **Changelogs live in `_changelogs/`:** one for the rules ([[Schema Changelog]]) and one for Nicrosil ([[Nicrosil Changelog]]). They are kept out of the guide and the rule files so those stay short, and an agent reads a changelog only to add a line or when asked. Both are newest first: a new line goes at the top (in the Schema Changelog, directly under the `## Changelog` heading). Past lines are never rewritten. How something looks goes in the changelog, in a few words, not in the guide's body.
