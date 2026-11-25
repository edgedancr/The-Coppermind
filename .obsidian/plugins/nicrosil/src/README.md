Nicrosil's source, split by feature so an agent opens only the part it needs.

Obsidian loads only `main.js` and `styles.css` in the folder above. Both are **built files**: `build.py` joins the parts below, in file-name order, byte for byte, and adds one "BUILT FILE" line at the top. Never edit `main.js` or `styles.css` directly, never read them whole, and never rewrite a part whole when an in-place edit will do.

## Making a change

1. **Find the part.** Search `src/` for the function, class, method, CSS class or words on screen (`grep -rn "drawTypedBar" src/`), or pick it from the table below. Read only the lines you need, not the whole part.
2. **Edit the part in place.**
   - A new helper or class goes in the part for its feature. A new method of the plugin class goes in the `plugin-*` part for its feature.
   - Parts `14-plugin-onload.js` to `24-plugin-query-mode-exports.js` are pieces of one class body (`class Nicrosil extends Plugin { ... }`), so none of them is valid JavaScript alone. Keep every method whole inside one part.
   - **CSS order matters:** a later part overrides an earlier one. Look for later rules that override the selector you are changing (`grep -rn "cm-typedbar" src/css/`). New styles go at the end of `10-query-mode-and-later.css` unless they belong with an existing feature's rules and nothing later overrides them.
   - A new part sorts by name: `13b-new-feature.js` goes between `13-` and `14-`. Add it to the table below.
3. **Build:** `python build.py` from this plugin folder (`.obsidian/plugins/nicrosil/`). Then `python build.py --check` should say both files match. If `node` is installed, `node --check main.js` checks the syntax.
4. Without a shell on the computer, stage the part, edit it, run `build.py` on a copy of the plugin folder, and write back both the part and the built file.

`python build.py --map` lists every part with its size. `--check` changes nothing and reports whether the built files still match the parts (for example, after someone edited `main.js` directly: copy that change into the right part, then build).

## The parts

| Part | What is in it |
|---|---|
| `js/01-header-imports-constants.js` | Header comment, Obsidian imports, paths and constants, settings defaults, rating scales |
| `js/02-pure-helpers-index-log.js` | Pure helpers: flags, transcription text helpers, queue sorting, health status, `_index.md` parsing and syncing, log entries and month files |
| `js/03-dom-helpers-dialogs.js` | Count-up, progress bar, badges; Review, Resolve, flag and response pickers |
| `js/04-review-queue-view.js` | The review queue sidebar (`QueueView`) |
| `js/05-transcription-view.js` | The transcription queue view (`TranscribeView`) and its verify dialog |
| `js/06-atlas-helpers-links.js` | Atlas layout helpers, typed-link types (`REL_TYPES`), link collection, SVG helpers |
| `js/07-lens-view.js` | The Lens (relations panel) and its enlarged map |
| `js/08-atlas-view.js` | The atlas (wiki map view) |
| `js/09-live-block-settings.js` | The Dashboard's live block; the settings tab |
| `js/10-search-helpers.js` | Search scoring and the Tinmind's search |
| `js/11-search-box.js` | The search index and the Dashboard search box |
| `js/12-schema-changelog-tinmind-helpers.js` | Schema changelog helpers, Tinmind prompt dialogs, the Log a schema change dialog |
| `js/13-query-mode-view.js` | Query mode: the prompt, reply parsing, Analysis page, query log entries, the query tab (`QueryView`) |
| `js/14-plugin-onload.js` | Start of the plugin class: `onload`, `onunload`, `persist`, `registerCommands` |
| `js/15-plugin-file-list-button-schema-log.js` | The Coppermind and Tinmind buttons, Tinmind mode, git and mode buttons, hidden `_` folders, schema buttons |
| `js/16-plugin-respond-state.js` | Respond to a page and "My take"; Log a schema change actions; refresh, queue state, renames |
| `js/17-plugin-rendering.js` | Status bar and views; the Dashboard and Tinmind heroes, nav cards, semester switcher, shelf, recent activity |
| `js/18-plugin-dashboard.js` | Dashboard tabs and title, properties strips, log folding, read mode, health check card, opening the Dashboard |
| `js/19-plugin-tinmind-sidebar-courses.js` | The Tinmind's sidebar, course tree, course pages and Notebook; one-time migrations; opening the atlas |
| `js/20-plugin-navigation-review-actions.js` | Opening views and files, Open next draft, Skip; source card rating buttons |
| `js/21-plugin-typed-links.js` | The Add typed link button; Verify (with its animations) and Reject |
| `js/22-plugin-flags-files.js` | Resolving flags; keeping `_index.md` up to date; the month's log file |
| `js/23-plugin-transcription.js` | Opening and running the transcription queue |
| `js/24-plugin-query-mode-exports.js` | Query mode actions (running Claude Code, Save to Analyses, log); end of the class; test exports |
| `css/01-base-gradient-styles-queue-dialogs.css` | Fonts, variables, the CGS and TGS classes, status bar, queue, dialogs |
| `css/02-logo-dashboard-index-search-relations.css` | Logo, Dashboard page, index and log pages, properties strip, search box, schema dialog, relations |
| `css/03-dashboard-polish-verify-ambience.css` | Dashboard polish (1.3.0), the verify animation, ambience and motion |
| `css/04-review-queue-sidebars-quiet-dashboard.css` | Review queue header and list, sidebars, file list, Quiet dashboard |
| `css/05-health-card-lens-buttons-ratings.css` | Health check card, Lens look, gradient buttons, rating buttons, "My take" |
| `css/06-tinmind-hero-mode-course-tree.css` | Tinmind hero, Tinmind mode, `_AGENTS` title, course tree, note titles, the course pill |
| `css/07-dashboard-cards-ledger-notebook-sidebar.css` | Dashboard cards, the Ledger look, Notebook, semester title, git buttons, ribbon, hover previews |
| `css/08-transcription-queue-shelf-tinmind-search.css` | Transcription queue, Tinmind shelf, course notes panel, Tinmind search |
| `css/09-atlas-lens-typed-links.css` | Atlas, Lens (3.29.0), atlas buttons, Add typed link |
| `css/10-query-mode-and-later.css` | Query mode (4.2.0 onward) and every style added since |
