// Runs when the toolbar icon is clicked. "activeTab" gives temporary access to the current tab only.
const DEFAULT_TITLE = "Save this page to the Coppermind (Ingestion/Raw)";

// The vault is a folder inside Chrome's Downloads folder, so a download named "The Coppermind/Ingestion/Raw/<file>"
// lands straight in the vault. If the vault ever moves, change VAULT_FOLDER (a path inside Downloads).
const VAULT_FOLDER = "The Coppermind";
const RAW_PATH = VAULT_FOLDER + "/Ingestion/Raw";

function waitForDownload(id) {
  return new Promise((resolve) => {
    const finish = (item) => { chrome.downloads.onChanged.removeListener(onChange); clearTimeout(timer); resolve(item); };
    const check = async () => {
      const [item] = await chrome.downloads.search({ id });
      if (item && item.state !== "in_progress") finish(item);
    };
    const onChange = (delta) => { if (delta.id === id && delta.state) check(); };
    const timer = setTimeout(() => finish(null), 15000);
    chrome.downloads.onChanged.addListener(onChange);
    check();
  });
}

// Saves the Markdown into Ingestion/Raw/ in the vault. Returns { ok, message }.
async function saveToRaw(fileName, markdown) {
  const safe = fileName.replace(/[\\/:*?"<>|]/g, "-");
  const url = "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown);
  if (url.length > 1.9e6) return { ok: false, message: "Too large to save in one file (" + Math.round(markdown.length / 1000) + " KB)" };
  const id = await chrome.downloads.download({ url, filename: RAW_PATH + "/" + safe, conflictAction: "uniquify", saveAs: false });
  const item = await waitForDownload(id);
  if (!item) return { ok: false, message: "Chrome didn't finish the download in time; check chrome://downloads" };
  if (item.state !== "complete") return { ok: false, message: "Download failed: " + (item.error || "unknown error") };
  const where = item.filename.replace(/\\/g, "/");
  const name = where.split("/").pop();
  return /\/Ingestion\/Raw\/[^/]+$/.test(where)
    ? { ok: true, message: "Saved to Ingestion/Raw: " + name }
    : { ok: true, message: "Saved to " + where + " (not the vault's Raw folder; check Chrome's download location)" };
}

async function flash(tabId, text, color, title) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
  await chrome.action.setTitle({ tabId, title });
  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: "" });
    chrome.action.setTitle({ tabId, title: DEFAULT_TITLE });
  }, 5000);
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  if (!/^https?:\/\//.test(tab.url || "")) {
    await flash(tab.id, "!", "#c0392b", "Chrome doesn't allow extensions on this kind of page");
    return;
  }
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#b87333" });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "…" });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["lib/Readability.js", "lib/turndown.js", "lib/turndown-plugin-gfm.js", "convert.js", "content.js"],
    });
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.PMSave(),
    });
    let r = res && res.result ? res.result : { ok: false, message: "No response from the page" };
    if (r.ok && r.markdown) r = await saveToRaw(r.fileName, r.markdown);
    await flash(tab.id, r.ok ? "✓" : "!", r.ok ? "#2e8b57" : "#c0392b", r.message);
  } catch (e) {
    await flash(tab.id, "!", "#c0392b", "Error: " + ((e && e.message) || e));
  }
});
