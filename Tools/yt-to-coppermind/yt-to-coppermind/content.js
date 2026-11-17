// Injected on demand by background.js when the toolbar icon is clicked.
// Defines window.CMSave(), which background.js then calls and awaits.
(function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function isWatchPage() {
    return location.pathname === "/watch" && new URLSearchParams(location.search).has("v");
  }

  function getMeta() {
    const q = (s) => document.querySelector(s);
    const title =
      (q("ytd-watch-metadata h1") || {}).textContent ||
      (q('meta[name="title"]') || {}).content ||
      document.title.replace(/ - YouTube$/, "");
    const channel =
      (q("ytd-watch-metadata ytd-channel-name a") || {}).textContent ||
      (q("#owner ytd-channel-name a") || {}).textContent ||
      (q('link[itemprop="name"]') || {}).content ||
      "";
    const id = new URLSearchParams(location.search).get("v");
    return {
      title: title.replace(/\s+/g, " ").trim(),
      channel: channel.replace(/\s+/g, " ").trim(),
      url: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  async function openTranscript() {
    if (document.querySelector(CM.SEL.segment)) return true;
    // Expand the description, then click "Show transcript".
    const expand = document.querySelector("#description-inline-expander #expand, tp-yt-paper-button#expand");
    if (expand) expand.click();
    for (let i = 0; i < 20; i++) {
      const btn =
        document.querySelector("ytd-video-description-transcript-section-renderer button") ||
        [...document.querySelectorAll("button")].find((b) =>
          /show transcript/i.test((b.getAttribute("aria-label") || "") + " " + b.textContent)
        );
      if (btn) {
        btn.click();
        break;
      }
      await sleep(250);
    }
    for (let i = 0; i < 60; i++) {
      if (document.querySelector(CM.SEL.segment)) return true;
      await sleep(250);
    }
    return false;
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  window.CMSave = async function () {
    try {
      if (!isWatchPage()) return { ok: false, message: "Open a YouTube video first" };
      if (!(await openTranscript())) return { ok: false, message: "No transcript found on this video" };
      await sleep(600); // let the panel finish rendering
      const items = CM.extractItems(document);
      if (!items.some((i) => i.kind === "line")) return { ok: false, message: "Transcript was empty" };
      const meta = getMeta();
      const name = CM.fileName(meta.channel, meta.title);
      download(name, CM.buildMarkdown(meta, items));
      return { ok: true, message: "Saved to Downloads: " + name };
    } catch (e) {
      return { ok: false, message: (e && e.message) || "Something went wrong" };
    }
  };
})();
