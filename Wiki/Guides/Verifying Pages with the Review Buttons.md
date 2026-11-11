---
type: guide
status: draft
aliases: [Review Buttons]
courses: [SAIL]
sources: []
related: ["[[SCHEMA]]", "[[Setting Up Git for the Coppermind]]"]
drafted_by: Claude (claude-sonnet-5-5)
drafted_on: 2026-11-11
verified_on: 
---
The Coppermind has two buttons in the top-right corner of every wiki page: **Verify** (a check-badge icon) and **Reject** (a trash icon). They are for the moment I finish checking a draft. ==The buttons do the bookkeeping, but the checking is still mine==, because a page only becomes verified when I decide it has been checked against its sources ([[SCHEMA#7. Draft vs. verified|Schema §7]]).

The buttons come from a small plugin I keep in the vault, **Coppermind Review** (`.obsidian/plugins/coppermind-review/`). It only works on pages in `Wiki/`, `Perspectives/`, and `Sources/Source Cards/` that have `status: draft`.

## Turn it on (once per computer)
1. In Obsidian: **Settings → Community plugins**. If the list shows "Restricted mode," turn it off.
2. Click the refresh icon next to "Installed plugins," find **Coppermind Review**, and switch it on.
3. Open any wiki page. Two icons should appear next to the page's menu (⋮) at the top right. Hover to see their names.
4. The plugin files are tracked in git, so on a second computer they arrive with a pull. Repeat steps 1–3 there, since the on/off setting is local.

## Verify a page
1. Read the page and check it against the sources it cites. Resolve or remove every flag callout (`[!caution]` accuracy checks, `[!todo]` gaps, `[!question]` "Whose view is this?"). Edit the page if it needs fixing.
2. Click **Verify**. A dialog lists any flags still on the page. To verify with flags open, tick the box saying so; that choice is recorded in the log.
3. Optionally, write what you changed and why. This becomes a "Revised" line in the log ([[SCHEMA#11. Index and log|Schema §11]] asks for the reason behind corrections).
4. Confirm. The plugin then:
   - sets `status: verified` and `verified_on` to today's date on the page
   - changes the page's line in [[index]] to `(verified)` and recalculates the totals
   - adds an entry to [[log]]
5. Commit and push (see [[Setting Up Git for the Coppermind]]). A page is only "saved as final" once it is verified **and** committed.

## Reject a draft
1. Click **Reject**. The dialog lists any pages that link to this one; those links will break, so fix them afterward.
2. Write the reason. It is required, and it goes in the log.
3. Confirm. The plugin logs the reason, removes the page from the index, and deletes the page ([[SCHEMA#7. Draft vs. verified|Schema §7]]: a rejected draft is deleted, never kept). Where the file goes depends on Obsidian's "Deleted files" setting, and git keeps the history.

## What it will not do
- **It never verifies on its own.** Every change starts with my click.
- **It does not commit to git.** Commit and push yourself afterward.
- **It will not verify a source card with a blank `reliability` rating.** Ratings are always item by item ([[SCHEMA#7. Draft vs. verified|Schema §7]]).
- **It does not touch pages that are already verified.** If a verified page's content changes, it goes back to `draft` and needs checking again.
- **It cannot undo a verify.** To undo one, set `status: draft` by hand, change the index line back, and add a correction to the log (the log is append-only).

## Troubleshooting
- **No icons on the page:** the plugin is off, or the page is outside the folders above. Check Settings → Community plugins. A page whose properties don't include `status: draft` shows a message instead of acting.
- **"It wasn't in index.md":** the page's entry is missing or renamed. Add or fix its line in [[index]] by hand.
- **Properties look reformatted after verifying:** Obsidian rewrites a page's properties when a plugin edits them. The content is the same.
- **Merge conflict in `index.md` or `log.md`:** this happens if two computers verify pages before syncing. Pull before you start a review session and push when you finish.
