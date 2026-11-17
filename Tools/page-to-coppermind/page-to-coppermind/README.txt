Page to Coppermind (v1.0)
1. Unzip somewhere permanent.
2. Chrome > chrome://extensions > Developer mode on > Load unpacked > pick this folder. Pin it with the puzzle-piece icon.
3. On any web page, click the extension icon. Badge: ... then a green check (file is in Downloads), or a red ! (hover for the reason).
4. Move "<Site> - <Title>.md" from Downloads to Sources/Readings/.

Output: title line, URL, Author / Published / Accessed, "Text:", then the article as Markdown with headings, lists, tables,
links and code kept; images become [Image: alt text]. Ads, menus and comments are stripped (Mozilla Readability + Turndown).
Won't work on: PDFs (save the file itself), chrome:// pages, or pages with no article text (apps, dashboards, search results).
Libraries in lib/: Readability (Apache-2.0), Turndown and turndown-plugin-gfm (MIT).
