// Runs when the toolbar icon is clicked. "activeTab" gives temporary access to the current tab only.
async function flash(tabId, text, color, title) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
  await chrome.action.setTitle({ tabId, title });
  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: "" });
    chrome.action.setTitle({ tabId, title: "Save transcript to Downloads (Coppermind format)" });
  }, 5000);
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https:\/\/www\.youtube\.com\/watch/.test(tab.url || "")) {
    if (tab.id) await flash(tab.id, "!", "#c0392b", "Open a YouTube video first");
    return;
  }
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#b87333" });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "…" });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["format.js", "content.js"] });
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.CMSave(),
    });
    const r = res && res.result ? res.result : { ok: false, message: "No response from the page" };
    await flash(tab.id, r.ok ? "✓" : "!", r.ok ? "#2e8b57" : "#c0392b", r.message);
  } catch (e) {
    await flash(tab.id, "!", "#c0392b", "Error: " + ((e && e.message) || e));
  }
});
