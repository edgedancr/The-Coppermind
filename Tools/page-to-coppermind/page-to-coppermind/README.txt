Page to Coppermind (v1.1)
1. Unzip somewhere permanent.
2. Chrome > chrome://extensions > Developer mode on > Load unpacked > pick this folder. Pin it with the puzzle-piece icon.
   (If updating from 1.0: click the reload arrow on the extension. Chrome will ask to approve the new Downloads permission.)
3. On any web page, click the extension icon. Badge: ... then a green check (the file is in the vault's Ingestion/Raw), or a red ! (hover for the reason).
4. Nothing to move. "<Site> - <Title>.md" is saved straight into Ingestion/Raw, ready to be ingested when you ask. A file with the same name gets (1), (2), and so on.

How it finds the vault: the vault is the folder "The Coppermind" inside your Downloads folder, so the file is saved as Downloads/The Coppermind/Ingestion/Raw/<name>.md.
If the vault moves, or Chrome's download location isn't Downloads, change VAULT_FOLDER at the top of background.js. Chrome's "Ask where to save each file" setting must be off.

Output: title line, URL, Author / Published / Accessed, "Text:", then the article as Markdown with headings, lists, tables,
links and code kept; images become [Image: alt text]. Ads, menus and comments are stripped (Mozilla Readability + Turndown).
Won't work on: PDFs (save the file itself), chrome:// pages, or pages with no article text (apps, dashboards, search results).
Libraries in lib/: Readability (Apache-2.0), Turndown and turndown-plugin-gfm (MIT).
