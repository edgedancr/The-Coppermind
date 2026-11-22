// Injected on demand by background.js. Defines window.PMSave(), which background.js then calls and awaits. It returns the Markdown; background.js saves it.
(function () {
  window.PMSave = async function () {
    try {
      if (document.contentType && document.contentType !== "text/html") {
        return { ok: false, message: "Not a web page (PDF or file): save the file itself instead" };
      }
      const r = PM.convert(document, location.href.split("#")[0], new Date().toISOString());
      if (!r.ok) return r;
      return { ok: true, fileName: r.fileName, markdown: r.markdown }; // background.js saves it into Ingestion/Raw
    } catch (e) {
      return { ok: false, message: (e && e.message) || "Something went wrong" };
    }
  };
})();
