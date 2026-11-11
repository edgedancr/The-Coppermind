---
type: guide
status: draft
aliases: [Git Setup]
courses: [SAIL]
sources: []
related: ["[[SCHEMA]]"]
drafted_by: Claude (claude-opus-5-5)
drafted_on: 2026-11-10
verified_on: 
---
Git keeps a full history of the Coppermind, so every approved change is recorded and any mistake can be undone. In this wiki, ==a git commit is the "save as final" step==: it happens right after I verify the agent's drafts ([[SCHEMA#12. Version control (git)|Schema §12]]). This guide sets git up once and then explains the habit for each review session.

There are two ways to do it. **Option A is recommended**, because everything stays inside Obsidian and it creates the repository in this folder exactly as it is.

## Option A: Obsidian Git plugin (recommended)

### One-time setup
1. Install Git for Windows.
   > [!warning] Unsourced background — verify or remove
   > Git for Windows is downloaded from git-scm.com. The default installer options are fine.
2. In Obsidian: **Settings → Community plugins → Browse**, search for **Git** (by Vinzent), install it, and enable it.
3. Open the command palette (`Ctrl+P`) and run **Git: Initialize a new repo** ([Obsidian Git docs](https://publish.obsidian.md/git-doc/Getting%20Started)).
4. Run **Git: Commit all changes with specific message** and enter `setup: Coppermind skeleton, schema v0.1` ([Obsidian Git docs](https://publish.obsidian.md/git-doc/Getting%20Started)). That's the first commit.
5. The `.gitignore` file in the vault already stops git from tracking Obsidian's window-layout files, which change constantly.

### Optional: online backup
- Create an **empty, private** repository on GitHub, then run the plugin's **Push** command, enter `origin` as the remote name, and paste the repository URL. You'll need to set up authentication first ([Obsidian Git docs](https://publish.obsidian.md/git-doc/Getting%20Started)).

## Option B: GitHub Desktop

GitHub Desktop has a clear side-by-side view of what changed, but it has one catch with this folder.
- Adding a folder that is *already* a repository: **File → Add local repository → Choose…**, then pick the folder ([GitHub Docs](https://docs.github.com/en/enterprise-server@3.17/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop)).
- Creating a new repository: set the local path to the **parent** folder and give the repository **exactly the same name** as the existing folder. If the names differ, GitHub Desktop creates a new subfolder instead of using this one ([ofitselfso guide](https://www.ofitselfso.com/MiscNotes/Creating_GitHub_Repository_from_an_Existing_Project_or_Folder_using_GitHub_Desktop.php)).
  - Because this folder's name has spaces and parentheses, the simplest fix is to rename the folder to something like `The-Coppermind` before you start.

## The habit: after every review session
1. Finish the review: approve, revise, or reject each draft.
2. Read the list of changed files before committing. This is a second look at what's about to become final.
3. Commit, using the message the agent suggests at the end of the operation (format: `ingest: SAIL notes 8/27/26 — 4 approved, 1 revised, 1 rejected`).

## Troubleshooting
- **"Not a git repository":** the repository was created in a different folder. Check that a hidden `.git` folder is inside the Coppermind folder itself.
- **A commit I regret:** git can revert any commit without losing the history of what happened, which is itself worth noting in the [[log]].
