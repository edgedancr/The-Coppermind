// Pure helpers: no browser APIs except the DOM passed in, so they can be tested in Node.
(function (root) {
  const CM = {};

  // Windows-safe file name part.
  CM.sanitize = function (s, max) {
    let out = String(s || "")
      .replace(/[\u0000-\u001f<>:"\/\\|?*]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/, "");
    if (max && out.length > max) out = out.slice(0, max).replace(/[. ]+$/, "");
    return out;
  };

  CM.fileName = function (channel, title) {
    const c = CM.sanitize(channel, 40) || "Unknown Channel";
    const t = CM.sanitize(title, 90) || "Untitled Video";
    return `${c} - ${t} (transcript).md`;
  };

  CM.cleanTimestamp = function (s) {
    const m = String(s || "").match(/\d+(?::\d{2}){1,2}/);
    return m ? m[0] : "";
  };

  // items: [{kind:"chapter", title} | {kind:"line", time, text}]
  CM.buildMarkdown = function (meta, items) {
    const out = [];
    out.push(`${meta.title} - ${meta.channel}`, "", meta.url, "", "Transcript:");
    let n = 0;
    for (const it of items) {
      if (it.kind === "chapter") {
        n += 1;
        // YouTube's own chapter titles may already read "Chapter 1: ..."; keep those as is.
        out.push(/^chapter\s*\d+/i.test(it.title) ? it.title : `Chapter ${n}: ${it.title}`);
      } else {
        out.push(it.time ? `${it.time} ${it.text}` : it.text);
      }
    }
    return out.join("\n") + "\n";
  };

  // Reads the transcript panel in a document. Selectors are kept in one place
  // so they are easy to fix if YouTube changes its markup.
  // Current YouTube layout (view-model elements) first, older layout as fallback.
  CM.SEL = {
    segment: "transcript-segment-view-model, ytd-transcript-segment-renderer",
    header: "timeline-chapter-view-model, ytd-transcript-section-header-renderer",
    time: ".ytwTranscriptSegmentViewModelTimestamp, .segment-timestamp",
    text: ".ytAttributedStringHost, [role='text'], .segment-text",
    headerTitle: "h3, #title, .shelf-header-title, h2",
  };
  CM.SEL.row = CM.SEL.segment + ", " + CM.SEL.header;

  CM.extractItems = function (doc) {
    const items = [];
    doc.querySelectorAll(CM.SEL.row).forEach((el) => {
      if (el.matches(CM.SEL.header)) {
        const raw = (el.querySelector(CM.SEL.headerTitle) || el).textContent || "";
        const title = raw.split("\n").map((s) => s.trim()).filter(Boolean)[0] || "";
        if (title) items.push({ kind: "chapter", title });
      } else {
        const text = ((el.querySelector(CM.SEL.text) || {}).textContent || "").replace(/\s+/g, " ").trim();
        const time = CM.cleanTimestamp((el.querySelector(CM.SEL.time) || {}).textContent);
        if (text) items.push({ kind: "line", time, text });
      }
    });
    return items;
  };

  root.CM = CM;
  if (typeof module !== "undefined" && module.exports) module.exports = CM;
})(typeof window !== "undefined" ? window : globalThis);
