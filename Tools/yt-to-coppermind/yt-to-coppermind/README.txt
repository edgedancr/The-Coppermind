YouTube to Coppermind (v1.2)
1. Unzip this folder somewhere permanent.
2. Chrome > chrome://extensions > turn on Developer mode > Load unpacked > pick this folder.
   (If updating: click the reload arrow on the extension instead. Chrome will ask to approve the new Downloads permission.)
3. Click the puzzle-piece icon in Chrome's toolbar and pin the extension.
4. On a YouTube video, click the extension icon. The badge shows ... then a green check when the file is in the vault's
   Ingestion/Raw, or a red ! (hover the icon to read the message).
5. Nothing to move. "<Channel> - <Title> (transcript).md" is saved straight into Ingestion/Raw, ready to be ingested when you ask.
   A file with the same name gets (1), (2), and so on.

How it finds the vault: the vault is the folder "The Coppermind" inside your Downloads folder, so the file is saved as
Downloads/The Coppermind/Ingestion/Raw/<name>.md. If the vault moves, or Chrome's download location isn't Downloads, change
VAULT_FOLDER at the top of background.js. Chrome's "Ask where to save each file" setting must be off.
If YouTube changes its page and it breaks, the selectors are in format.js under CM.SEL.
