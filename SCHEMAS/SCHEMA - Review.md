---
type: schema
status: verified
owner: Harrison Nickles
updated: 2026-11-19
verified_on: 2026-11-19
---
How a page goes from draft to verified, what happens when the agent changes a verified page, and how much I review at once. Applies to every page in `Wiki/`, every source card, every perspective, and the rule files in `SCHEMAS/`.

## Draft vs. verified

1. **Every wiki page, source card, and perspective has a `status`**: `draft` (not yet reviewed by me) or `verified` (I reviewed and approved it).
2. **The agent only ever creates drafts.** It writes new pages directly into the vault with `status: draft`, so I can review them in Obsidian, where the links and formatting render and I can click through to check each citation.
3. **Only I make a page verified.** I either change the property myself, or tell the agent explicitly, for that specific page, "mark it verified." The agent then sets `status: verified` and `verified_on`, and logs it. Clicking the **Verify** button added by the Nicrosil plugin counts as me making that change ([[Nicrosil]]).
4. **"Saved as final" means verified and committed to git.** A draft in the vault is a proposal, not part of the wiki's baseline.
5. **If the agent changes the content of a verified page, the page goes back to `draft`** and the change is logged. It also records what changed in the page's `changes_since_verified` property (rule 8). Purely mechanical fixes, like updating a link after a page is renamed, don't reset the status but are still logged.
6. **A rejected draft is deleted, never kept,** and the rejection is recorded in the log with my reason. The **Reject** button does this, and also removes the page from the index.
7. **Drafts don't sit forever.** A health check flags any draft older than 14 days.

## Changing a verified page

8. **A verified page the agent changed carries a note of what changed.** The agent only changes a verified page when I tell it to. In that same edit it sets `status: draft`, keeps the old `verified_on`, and adds one line per change to `changes_since_verified`, written as `YYYY-MM-DD: what changed (why)`.
   - When the change is in one place, the line ends with a link to that section, written `[[#Heading]]` (the heading's own words), so clicking the line in Nicrosil goes to that spot in the page. A change that touches the whole page needs no link.
   - Keep the line in quotes in the properties. A later edit adds another line.
   - The field lives in the properties, never in the page text.
   - When I verify the page, the field is deleted; the log keeps the history.
   - A draft with `verified_on` and this field is a re-review: I check only the listed changes. A draft without the field is new.
   - The rule files in `SCHEMAS/` follow this rule too; see [[SCHEMA - Changes#Changing the rules]].

## Review size

- **Default: item by item.** I review each page and each proposed link.
- **Batch approval is allowed for mechanical changes only**: index updates, broken-link fixes, formatting, and typo fixes found in a health check. I read the whole batch before approving it.
- **Always item by item** for anything that touches a verified page, a source card's reliability rating, or attribution.
- I can switch to item by item at any time, and should whenever something looks off.
