---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-22
verified_on: 2026-11-23
---
How scans of my handwritten notes become class notes in the Tinmind, and how I check them. Read this file for any task I say is about the Tinmind. The permissions are in `_AGENTS.md`; the review tool is [[Nicrosil]]'s **Transcription queue**.

## The idea

A scan is only a way to get my handwriting into a note. Once I have checked the transcription against the scan and verified it, the scan has done its job and is deleted. The note is what stays. **I design, the AI drafts, I verify** applies here the same as everywhere: a transcription is a draft until I verify it.

## Where things live

| What | Where | Notes |
|---|---|---|
| Scans waiting to be transcribed | `Sources/Scans/` | Shrunk copies (see below). The folder is kept in git (the shrunk scans are small enough to push); a scan leaves it when I verify its transcription. |
| My original photos | wherever I keep them (outside the vault) | The agent never changes them. They are my backup until I delete them. |
| The transcription | the course's folder in `The Tinmind/`, one note per class session | Same file name pattern, properties and layout as the other notes in that course. If the course has no note to copy, the agent asks me. |
| A drawing I keep as an image | `_attachments/Tinmind/` | A crop of the scan, saved by the queue when I choose **Keep screenshot**. |

## Shrinking scans

Photos are 4–6 MB each, so they are shrunk before they go in the vault: turned upright (a page written sideways is turned a quarter turn so the writing reads normally), grayscale, long edge 2200 px, JPEG quality 78. That is about 0.4–0.6 MB a page, and handwriting stays easy to read. The tool for this is `Tools/shrink-scans/shrink_scans.py`. The agent runs it or an equivalent when I ask; it never replaces or deletes my originals.

## Transcribing (the agent's part)

Only when I tell the agent to transcribe, and only the pages I name.

1. **Work one class session at a time.** Read the pages in file-name order (the order I photographed them) and use what is written on them (course, date) to decide which session each line belongs to. A page that holds two sessions goes in two notes; a session that runs over several pages is one note listing all of them. If a course or date is missing or unclear, flag it in the note and say so in chat; don't guess.
2. **Write what I wrote.** Keep my words, order, spelling, abbreviations and structure (bullets, indents, arrows). Don't correct, summarize, reword, add facts, or tidy my reasoning, and don't turn a line of mine into a neutral statement about the world ([[SCHEMA - Writing Pages#Attribution: whose voice is this?]]). Show emphasis the way it looks: a star at the start of a line becomes ★, a circled or boxed word **bold**, a highlighted passage ==highlight==, underlining `<u>underline</u>`. A margin note goes on its own line, starting `(margin)`. These are defaults; I can change them at review.
3. **Mark what you can't read.** Never guess silently. A best guess is `[?word?]`; an unreadable stretch is `[??]`. The review queue counts these and steps through them.
4. **Flag every drawing** with a drawing callout, at the place it occurs on the page (see below). A ruled table of plain words is transcribed as a Markdown table instead; if its lines, arrows or shapes carry meaning, flag it as a drawing.
5. **Add two properties** to the note: `transcription: draft` and `scan_pages:` (a list of the scan file names it came from, such as `IMG_0805.jpg`).
6. **Log it:** one `transcribe` entry per batch, with the format in `_AGENTS.md`. Think: what I asked for. Calculate: scans read, notes made, how many drawings and unsure words are flagged. Leave Verify empty; the queue logs each verification as its own `verify` entry.

The agent never verifies a transcription, never deletes a scan, and never edits a note after I verify it unless I ask.

## Drawing flags

A drawing is anything that isn't text: a graph, chart, diagram, map, sketch, symbol or doodle. The agent leaves this where it occurs:

```
> [!drawing] Short label
> One or two plain sentences on what it shows. No interpretation.
> scan: IMG_0805.jpg
```

In the queue I choose one of three things for each drawing flag:

- **Keep screenshot.** I drag a box over the scan (or take the whole page); the queue saves that crop to `_attachments/Tinmind/` and replaces the callout with `![[the image]]`.
- **Recreate.** The callout becomes `> [!recreate] ...` and the scan is kept, so I can't verify the note yet. When I ask, the agent replaces the callout with a Mermaid diagram, a Markdown table or similar, using only what the drawing shows and my labels, and puts `%% recreated: IMG_0805.jpg | Short label %%` on the line below. In the queue I compare it to the scan and click **Looks right**, which removes that line. If a drawing can't be recreated faithfully, the agent says so and leaves the callout for me to turn into a screenshot.
- **Leave out.** The callout is removed and nothing replaces it.

## Review (the queue)

The **Transcription queue** (Alt+T, or the Tinmind's scan button, or the Transcriptions card on the Tinmind Dashboard) lists every note with `transcription: draft`. For each, it shows the scan pages on the left and the transcription, which I can edit, on the right.

- **Verify** is blocked while any drawing flag is open or waiting to be recreated or checked. If unsure words remain, I confirm that I want to verify anyway.
- **Verifying** removes `transcription` and `scan_pages` from the note, moves the scan files to Obsidian's trash (unless another unverified note still lists the same page), and adds a `verify` entry to the log. The trash setting decides whether it is Obsidian's `.trash` or the system's, so a scan can be recovered from there.
- **Discard transcription** deletes the draft note, keeps the scans so the agent can try again, and logs my reason, as for any rejected draft ([[SCHEMA - Review#Draft vs. verified]]).
- **Skip** leaves the note as it is.

## What stays the same

The Tinmind is still outside queries, ingests, health checks and the index. A transcribed note is not a source or a wiki page. If I later want it in the wiki, it goes through Ingest like any other source ([[SCHEMA - Ingest]]).
