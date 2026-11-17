// Turns a web page into Coppermind-style Markdown.
// Needs the globals Readability, TurndownService and turndownPluginGfm (loaded before this file).
// Kept free of Chrome APIs so it can be tested in Node.
(function (root) {
  const PM = {};

  PM.sanitize = function (s, max) {
    let out = String(s || "")
      .replace(/[\u0000-\u001f<>:"\/\\|?*]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/, "");
    if (max && out.length > max) out = out.slice(0, max).replace(/[. ]+$/, "");
    return out;
  };

  PM.fileName = function (site, title) {
    const s = PM.sanitize(site, 40) || "Web";
    const t = PM.sanitize(title, 90) || "Untitled Page";
    return `${s} - ${t}.md`;
  };

  PM.isoDate = function (value) {
    if (!value) return "";
    const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(value);
    return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  };

  function meta(doc, ...names) {
    for (const n of names) {
      const el = doc.querySelector(`meta[property="${n}"], meta[name="${n}"], meta[itemprop="${n}"]`);
      if (el && el.getAttribute("content")) return el.getAttribute("content").trim();
    }
    return "";
  }

  function jsonLd(doc) {
    const out = {};
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try {
        const data = JSON.parse(s.textContent);
        const list = Array.isArray(data) ? data : data["@graph"] || [data];
        for (const o of list) {
          if (!o || typeof o !== "object") continue;
          if (o.datePublished && !out.published) out.published = o.datePublished;
          if (o.author && !out.author) {
            const a = Array.isArray(o.author) ? o.author[0] : o.author;
            out.author = typeof a === "string" ? a : (a && a.name) || "";
          }
        }
      } catch (e) {}
    });
    return out;
  }

  // "About Us - Arena.ai" on site "Arena AI" -> "About Us"
  PM.stripSite = function (title, site, host) {
    const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const stem = norm(String(host || "").replace(/\.[a-z]{2,}$/i, ""));
    const sites = [norm(site), stem, norm(host)].filter((x) => x.length >= 3);
    const parts = title.split(/\s+[|\-\u2013\u2014\u00b7\u2022:]\s+/);
    if (parts.length < 2) return title;
    const last = norm(parts[parts.length - 1]);
    if (last.length >= 3 && sites.some((x) => x.includes(last) || last.includes(x))) {
      return parts.slice(0, -1).join(" - ").trim() || title;
    }
    return title;
  };

  PM.makeTurndown = function () {
    const td = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      linkStyle: "inlined",
    });
    td.use(turndownPluginGfm.gfm);
    // Images carry little meaning in a text source: keep the alt text, drop the picture.
    td.addRule("images", {
      filter: "img",
      replacement: (c, node) => {
        const alt = (node.getAttribute("alt") || "").trim();
        return alt ? `[Image: ${alt}]` : "";
      },
    });
    // Drop things that only add noise.
    td.remove(["script", "style", "noscript", "iframe", "svg", "button", "form"]);
    return td;
  };

  // doc: the live document. Returns {ok, markdown, fileName, title} or {ok:false, message}.
  PM.convert = function (doc, url, now) {
    const clone = doc.cloneNode(true);
    const article = new Readability(clone, { keepClasses: false }).parse();
    if (!article || !article.content || (article.textContent || "").trim().length < 200) {
      return { ok: false, message: "Couldn't find an article on this page" };
    }
    const ld = jsonLd(doc);
    const host = new URL(url).hostname.replace(/^www\./, "");
    const site = (article.siteName || meta(doc, "og:site_name", "application-name") || host).trim();
    const title = PM.stripSite((article.title || doc.title || "").replace(/\s+/g, " ").trim(), site, host);
    const authorCandidates = [meta(doc, "author", "article:author", "twitter:creator"), ld.author, article.byline];
    const author =
      authorCandidates
        .map((a) => String(a || "").replace(/^by\s+/i, "").replace(/\s+/g, " ").trim())
        .find((a) => a && a.length <= 80 && !/^https?:/i.test(a) && !/min read|\d{4}/i.test(a)) ||
      // Last resort: a byline like "Jane Doe4th Jun 2023 ..." -> "Jane Doe"
      String(article.byline || "").split(/\d/)[0].replace(/^by\s+/i, "").trim().slice(0, 60);
    const published = PM.isoDate(
      article.publishedTime || meta(doc, "article:published_time", "datePublished", "date", "pubdate") || ld.published ||
        ((doc.querySelector("time[datetime]") || {}).getAttribute && doc.querySelector("time[datetime]").getAttribute("datetime"))
    );
    const accessed = PM.isoDate(now || new Date().toISOString());

    let body = PM.makeTurndown().turndown(article.content);
    body = body.replace(/\n{3,}/g, "\n\n").trim();

    const head = [`${title} - ${site}`, "", url, ""];
    if (author) head.push(`Author: ${author}`);
    if (published) head.push(`Published: ${published}`);
    head.push(`Accessed: ${accessed}`, "", "Text:", "");
    return {
      ok: true,
      title,
      fileName: PM.fileName(site, title),
      markdown: head.join("\n") + body + "\n",
    };
  };

  root.PM = PM;
  if (typeof module !== "undefined" && module.exports) module.exports = PM;
})(typeof window !== "undefined" ? window : globalThis);
