// Injected on demand by background.js. Defines window.PMSave(), which background.js then calls and awaits.
(function () {
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

  window.PMSave = async function () {
    try {
      if (document.contentType && document.contentType !== "text/html") {
        return { ok: false, message: "Not a web page (PDF or file): save the file itself instead" };
      }
      const r = PM.convert(document, location.href.split("#")[0], new Date().toISOString());
      if (!r.ok) return r;
      download(r.fileName, r.markdown);
      return { ok: true, message: "Saved to Downloads: " + r.fileName };
    } catch (e) {
      return { ok: false, message: (e && e.message) || "Something went wrong" };
    }
  };
})();
