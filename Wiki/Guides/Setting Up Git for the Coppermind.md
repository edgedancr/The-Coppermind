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

### Push to GitHub (online backup, and the link between computers)
1. Create an **empty, private** repository on GitHub: no README, no .gitignore, no license. On its page, click the green **Code** button and copy the **HTTPS** URL.
2. In Obsidian, open the command palette, type `remote`, and pick the command that adds a remote. It asks for two separate things: the name (`origin`), then the URL.
3. Run **Git: Push**. It asks which remote branch to use. Type the name of your local branch (shown in Obsidian's bottom status bar) and select that row.
4. Sign in. On Windows, a Git Credential Manager window may appear ([Obsidian Git docs](https://publish.obsidian.md/git-doc/Authentication)). If you get a username and password box instead, enter your GitHub username and a **personal access token** as the password. A normal account password is rejected with "Password authentication is not supported for Git operations."
5. Refresh the repository page on GitHub. The vault files should be at the top level, not inside a subfolder.

> [!warning] Unsourced background — verify or remove
> How to create a token: on GitHub, profile picture → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic). Give it a name and an expiration, check the `repo` scope, and copy it right away, because GitHub only shows it once. This is from general knowledge of GitHub and may differ on your screen. Never save a token inside the vault.

## Option B: GitHub Desktop

GitHub Desktop has a clear side-by-side view of what changed, but it has one catch with this folder.
- Adding a folder that is *already* a repository: **File → Add local repository → Choose…**, then pick the folder ([GitHub Docs](https://docs.github.com/en/enterprise-server@3.17/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop)).
- Creating a new repository: set the local path to the **parent** folder and give the repository **exactly the same name** as the existing folder. If the names differ, GitHub Desktop creates a new subfolder instead of using this one ([ofitselfso guide](https://www.ofitselfso.com/MiscNotes/Creating_GitHub_Repository_from_an_Existing_Project_or_Folder_using_GitHub_Desktop.php)).
  - Because this folder's name has spaces and parentheses, the simplest fix is to rename the folder to something like `The-Coppermind` before you start.

## Using the Coppermind on a second computer

The vault is not synced by OneDrive or Obsidian Sync, which avoids corrupted files and conflicted copies. Instead, GitHub holds the shared copy, and each computer has its own clone of it. Changes only travel when I push on one computer and pull on the other.

### One-time setup on the new computer
1. Install Git for Windows and Obsidian.
2. Create a personal access token for this computer, using the steps above. Use one token per computer, named for it (for example `Coppermind laptop`), so one can be revoked if a computer is lost.
3. Choose a folder **outside OneDrive**, such as Downloads. Open it in File Explorer, click the address bar, type `cmd`, and press Enter. Then run:
   ```
   git clone https://github.com/<your-username>/The-Coppermind.git
   ```
   Sign in when asked, the same way as above. This creates a `The-Coppermind` folder containing the whole wiki.
4. Tell git who I am, once per computer (use the same name and email on both):
   ```
   git config --global user.name "My Name"
   git config --global user.email "me@example.com"
   ```
5. In Obsidian, choose **Open folder as vault** and select the `The-Coppermind` folder. If Obsidian asks whether to trust the vault's community plugins, allow it. If the Git plugin isn't listed under Settings → Community plugins, install it from Browse.
6. Test it: run **Git: Pull**, change one line in `Home.md`, commit, push, then pull on the first computer and check that the change arrived.

> [!warning] Unsourced background — verify or remove
> The `git clone` and `git config` commands, the folder trick for opening Command Prompt, and Obsidian's plugin-trust prompt are from general knowledge, not from a source in this vault. Check each against my screen the first time and correct this section.

### Going back and forth
The rule: **pull when I sit down, commit and push when I leave.** Never walk away from a computer with unpushed work.
1. **Start:** run **Git: Pull** before touching anything.
2. **Work and review** as usual.
3. **Finish:** commit with a message (see the habit below), then run **Git: Push**.
4. **Check:** the Source Control panel should show nothing waiting to be committed or pushed.

If I forget to push on one computer, go back to it and push, then pull on the other. If a pull reports a conflict, stop. A conflict means the same lines were changed on both computers. Don't resolve it by deleting files; ask for help first and record what happened in the [[log]]. To avoid conflicts, only work on one computer at a time, and run Claude on only one computer at a time.

## The habit: every session
1. **Pull** when I start, if I use more than one computer.
2. Finish the review: approve, revise, or reject each draft.
3. Read the list of changed files before committing. This is a second look at what's about to become final.
4. Commit, using the message the agent suggests at the end of the operation (format: `ingest: SAIL notes 8/27/26 — 4 approved, 1 revised, 1 rejected`).
5. **Push**, so GitHub and my other computer have it.

## Troubleshooting
- **"Not a git repository":** the repository was created in a different folder. Check that a hidden `.git` folder is inside the Coppermind folder itself.
- **A commit I regret:** git can revert any commit without losing the history of what happened, which is itself worth noting in the [[log]].
- **"Password authentication is not supported" or "Authentication failed" on push:** GitHub rejected the password. Use a personal access token as the password, with the `repo` scope. If the box never reappears, remove old `git:https://github.com` entries in Windows Credential Manager and push again.
- **A prompt about the remote branch:** type the name of the local branch and select that row.
- **A commit fails with "Please tell me who you are":** run the two `git config --global` commands from the second-computer setup.
