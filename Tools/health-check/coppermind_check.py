#!/usr/bin/env python3
"""
Coppermind health check: the mechanical checks.

Run from the vault's top folder (or pass the vault's path):

    python Tools/health-check/coppermind_check.py
    python Tools/health-check/coppermind_check.py --out "check.md"
    python Tools/health-check/coppermind_check.py path/to/vault --full

It reads files and never changes any. It needs only Python 3.8 or newer, with no extra packages.
It prints a Markdown report: one row per health check (the same rows as the Health Check Report
template), the details behind each count, and the pages to read for the checks that need judgment.
The rules it follows are in SCHEMAS/SCHEMA - Health Check.md.
"""

import argparse
import datetime as dt
import os
import random
import re
import subprocess
import sys
from collections import Counter, defaultdict

TYPED = ["type_of", "part_of", "example_of", "causes", "counters", "applies_to",
         "supports", "contradicts", "developed_by", "related"]
PAGE_TYPES = {"concept", "glossary", "framework", "case-study", "person", "summary", "prompt",
              "workflow", "guide", "analysis", "perspective", "source"}
FLAG_KINDS = {"question": "Whose view?", "warning": "Unsourced background",
              "caution": "Accuracy check / sources disagree", "todo": "Gap"}
SKIP_DIRS = {".git", ".obsidian", ".trash", "node_modules"}
# Sources I have not ingested yet. Nothing in here is read, listed, or checked.
SKIP_PATHS = {"Ingestion/Raw"}
RECORD_PREFIXES = ("_logs/", "_log.md", "Health Checks/", "_changelogs/")   # records: links in them are history, not checked
STALE_DAYS = 14
SAMPLE_SIZE = 20

LINK_RE = re.compile(r"(!?)\[\[([^\]\n]*?)\]\]")
FOOTDEF_RE = re.compile(r"^\[\^([^\]\s]+)\]:", re.M)
FOOTREF_RE = re.compile(r"\[\^([^\]\s]+)\](?!:)")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*#*\s*$", re.M)
CALLOUT_RE = re.compile(r"^>\s*\[!(question|warning|caution|todo)\][-+]?\s*(.*)$", re.M | re.I)
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
NOTES_DATE_HEADING_RE = re.compile(r"^(#{1,6})\s+.*\b\d{1,2}/\d{1,2}/\d{2,4}\b")


# ---------- reading ----------

def read(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.read().replace("\r\n", "\n")


def split_frontmatter(text):
    """Returns (frontmatter text, body, number of lines the frontmatter takes)."""
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        if end != -1:
            nl = text.find("\n", end + 4)
            body = text[nl + 1:] if nl != -1 else ""
            fm = text[4:end]
            return fm, body, fm.count("\n") + 2
    return "", text, 0


def unquote(v):
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        v = v[1:-1]
    return v


def parse_frontmatter(fm):
    """A small YAML reader for the shapes the vault uses: `key: value`, `key: [a, b]`, and `key:` with `- item` lines."""
    data, key = {}, None
    for line in fm.split("\n"):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if m and not line.startswith((" ", "\t")):
            key, val = m.group(1), m.group(2).strip()
            if val == "":
                data[key] = []
            elif val.startswith("[") and val.endswith("]"):
                inner = val[1:-1].strip()
                data[key] = [unquote(x) for x in re.findall(r'"[^"]*"|\'[^\']*\'|[^,]+', inner) if x.strip()] if inner else []
            else:
                data[key] = unquote(val)
            continue
        m = re.match(r"^\s+-\s*(.*)$", line)
        if m and key is not None:
            if not isinstance(data.get(key), list):
                data[key] = [] if data.get(key) in ("", None) else [data[key]]
            data[key].append(unquote(m.group(1)))
    return data


def as_list(v):
    if v is None or v == "":
        return []
    return v if isinstance(v, list) else [v]


def strip_code(text):
    """Blanks out fenced code, inline code, and %% comments %%, keeping line numbers."""
    out, fence = [], None
    for line in text.split("\n"):
        s = line.lstrip()
        if fence:
            if s.startswith(fence):
                fence = None
            out.append("")
            continue
        if s.startswith("```") or s.startswith("~~~"):
            fence = s[:3]
            out.append("")
            continue
        out.append(line)
    text = "\n".join(out)
    text = re.sub(r"%%.*?%%", lambda m: re.sub(r"[^\n]", " ", m.group(0)), text, flags=re.S)
    text = re.sub(r"`[^`\n]*`", lambda m: " " * len(m.group(0)), text)
    return text


def norm_heading(h):
    h = re.sub(r"\[\[([^\]|]*\|)?([^\]]*)\]\]", r"\2", h)
    h = re.sub(r"[*_=`]", "", h)
    return re.sub(r"\s+", " ", h).strip().lower()


def parse_link(inner):
    """'Page#Heading|alias' -> (page, heading or None)."""
    target = inner.split("|", 1)[0].replace("\\", "").strip()
    page, _, head = target.partition("#")
    return page.strip(), (head.strip() or None) if "#" in target else None


# ---------- the vault ----------

class Vault:
    def __init__(self, root):
        self.root = root
        self.files = []          # relative paths with "/" separators
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS
                           and os.path.relpath(os.path.join(dirpath, d), root).replace(os.sep, "/") not in SKIP_PATHS]
            for fn in filenames:
                rel = os.path.relpath(os.path.join(dirpath, fn), root).replace(os.sep, "/")
                self.files.append(rel)
        self.by_name = defaultdict(list)   # lowercased name (without .md, or with extension) -> paths
        for p in self.files:
            base = p.rsplit("/", 1)[-1]
            if base.lower().endswith(".md"):
                self.by_name[base[:-3].lower()].append(p)
                self.by_name[p[:-3].lower()].append(p)
            else:
                self.by_name[base.lower()].append(p)
                self.by_name[p.lower()].append(p)
        self.pages = {}
        for p in self.files:
            if p.endswith(".md"):
                text = read(os.path.join(root, p))
                fm_text, body, fm_lines = split_frontmatter(text)
                self.pages[p] = {"text": text, "fm": parse_frontmatter(fm_text), "fm_text": fm_text,
                                 "body": body, "fm_lines": fm_lines, "clean": strip_code(body)}
        self._headings = {}

    def resolve(self, page, from_path=None):
        if not page:
            return from_path
        key = page.lower()
        if key.endswith(".md"):
            key = key[:-3]
        hits = self.by_name.get(key) or self.by_name.get(key.lstrip("/"))
        if not hits:
            return None
        if from_path and len(hits) > 1:
            folder = from_path.rsplit("/", 1)[0] if "/" in from_path else ""
            same = [h for h in hits if (h.rsplit("/", 1)[0] if "/" in h else "") == folder]
            if same:
                return same[0]
        return sorted(hits, key=lambda h: (h.count("/"), h))[0]

    def headings(self, path):
        if path not in self._headings:
            pg = self.pages.get(path)
            self._headings[path] = {norm_heading(m.group(2)) for m in HEADING_RE.finditer(pg["clean"])} if pg else set()
        return self._headings[path]


def is_wiki_page(p):
    return p.endswith(".md") and (p.startswith("Wiki/") or p.startswith("Perspectives/") or p.startswith("Sources/Source Cards/"))


def is_rule_file(p):
    return p.startswith("SCHEMAS/") and p.endswith(".md")


def is_record(p):
    return p.startswith(RECORD_PREFIXES)


def last_report(root):
    best = None
    folder = os.path.join(root, "Health Checks")
    if os.path.isdir(folder):
        for fn in os.listdir(folder):
            m = re.match(r"^Health Check (\d{4}-\d{2}-\d{2})(?: \(\d+\))?\.md$", fn)
            if m and (best is None or m.group(1) > best):
                best = m.group(1)
    return best


def changed_since(root, files, since):
    """Pages changed on or after `since`: from git if this is a repository, otherwise from file dates."""
    try:
        out = subprocess.run(["git", "-C", root, "log", f"--since={since} 00:00", "--name-only", "--format="],
                             capture_output=True, text=True, timeout=30, check=True).stdout
        dirty = subprocess.run(["git", "-C", root, "status", "--porcelain", "-uall"],
                               capture_output=True, text=True, timeout=30, check=True).stdout
        names = {l.strip().strip('"') for l in out.splitlines() if l.strip()}
        names |= {l[3:].strip().strip('"').split(" -> ")[-1] for l in dirty.splitlines() if len(l) > 3}
        return {f for f in files if f in names}, "git"
    except Exception:
        cutoff = dt.datetime.strptime(since, "%Y-%m-%d").timestamp()
        return {f for f in files if os.path.getmtime(os.path.join(root, f)) >= cutoff}, "file dates"


# ---------- checks ----------

def run(root, today, full):
    v = Vault(root)
    pages = sorted(p for p in v.pages if is_wiki_page(p))
    rules = sorted(p for p in v.pages if is_rule_file(p))
    checked = pages + rules
    link_scope = [p for p in v.pages if not is_record(p) and not p.startswith("_templates/")
                  and not (p.startswith("Sources/") and not p.startswith("Sources/Source Cards/"))]
    R = defaultdict(list)       # check key -> list of finding lines
    info = {}

    # Footnotes and citations (wiki pages only)
    card_for_file = {}
    for p in pages:
        if p.startswith("Sources/Source Cards/"):
            for f in as_list(v.pages[p]["fm"].get("file")):
                for m in LINK_RE.finditer(f):
                    tgt = v.resolve(parse_link(m.group(2))[0], p)
                    if tgt:
                        card_for_file[tgt] = p
    for p in pages:
        pg = v.pages[p]
        clean = pg["clean"]
        defs = FOOTDEF_RE.findall(clean)
        def_set = set(defs)
        refs = set(FOOTREF_RE.findall(re.sub(r"^\[\^[^\]\s]+\]:", "", clean, flags=re.M)))
        for d, n in Counter(defs).items():
            if n > 1:
                R["cite"].append(f"[[{name(p)}]]: footnote `[^{d}]` is defined {n} times")
        for r in sorted(refs - def_set):
            R["cite"].append(f"[[{name(p)}]]: marker `[^{r}]` has no definition")
        for d in sorted(def_set - refs):
            R["cite"].append(f"[[{name(p)}]]: definition `[^{d}]` is never used")
        if def_set and not re.search(r"^## Footnotes\s*$", clean, re.M):
            R["cite"].append(f"[[{name(p)}]]: has footnotes but no `## Footnotes` section")
        for m in re.finditer(r"\(\s*\[\[([^\]]+)\]\][^()\n]{0,40}\)", clean):
            tgt = v.resolve(parse_link(m.group(1))[0], p)
            if tgt and tgt.startswith("Sources/"):
                R["cite"].append(f"[[{name(p)}]]: old parenthetical citation `{m.group(0)[:70]}`")
        # cited sources missing from `sources`
        listed = set()
        for s in as_list(pg["fm"].get("sources")):
            for m in LINK_RE.finditer(s):
                t = v.resolve(parse_link(m.group(2))[0], p)
                if t:
                    listed.add(t)
        for line in re.findall(r"^\[\^[^\]\s]+\]:(.*)$", clean, re.M):
            for m in LINK_RE.finditer(line):
                t = v.resolve(parse_link(m.group(2))[0], p)
                if not t or not t.startswith("Sources/") or p.startswith("Sources/Source Cards/"):
                    continue
                card = t if t.startswith("Sources/Source Cards/") else card_for_file.get(t)
                if card and card not in listed:
                    R["cite"].append(f"[[{name(p)}]]: cites [[{name(card)}]] but it is not in `sources`")
                    listed.add(card)
    R["cite"] = sorted(set(R["cite"]))

    # Links: broken links and broken heading links, and inbound links for orphans
    inbound = defaultdict(set)
    for p in link_scope:
        pg = v.pages[p]
        places = [(pg["clean"], pg["fm_lines"])]
        if pg["fm_text"]:
            places.append((pg["fm_text"], 1))
        for text, offset in places:
            for m in LINK_RE.finditer(text):
                page, head = parse_link(m.group(2))
                if not page and not head:
                    continue
                tgt = v.resolve(page, p)
                line_no = text.count("\n", 0, m.start()) + offset + (0 if offset == 1 else 1)
                if not tgt:
                    R["broken"].append(f"[[{name(p)}]] (line {line_no}): `[[{m.group(2)[:60]}]]` points to a page that doesn't exist")
                    continue
                if tgt != p:
                    inbound[tgt].add(p)
                if head and tgt.endswith(".md") and not head.startswith("^"):
                    want = norm_heading(head.split("#")[-1])
                    if want not in v.headings(tgt):
                        R["broken"].append(f"[[{name(p)}]] (line {line_no}): `[[{m.group(2)[:70]}]]`: no heading \"{head}\" in [[{name(tgt)}]]")
    not_inbound_sources = {"_index.md", "_dashboard.md", "Dashboard.md", "Ingestion/Triage.md"}
    for p in pages:
        if not {q for q in inbound.get(p, set()) if q not in not_inbound_sources}:
            R["orphan"].append(f"[[{name(p)}]]: no other page links to it")

    # Typed-link mix and relationships stored twice
    mix, edges = Counter(), defaultdict(set)
    for p in pages:
        fm = v.pages[p]["fm"]
        for t in TYPED:
            for item in as_list(fm.get(t)):
                for m in LINK_RE.finditer(item):
                    tgt = v.resolve(parse_link(m.group(2))[0], p)
                    mix[t] += 1
                    if not tgt:
                        R["typed"].append(f"[[{name(p)}]] → {t} → `{m.group(2)}`: the target doesn't exist")
                    elif tgt == p:
                        R["typed"].append(f"[[{name(p)}]] → {t} → itself")
                    else:
                        edges[(p, tgt)].add(t)
    twice = []
    for (a, b), ts in edges.items():
        if a < b and (b, a) in edges:
            twice.append(f"[[{name(a)}]] ({', '.join(sorted(ts))}) and [[{name(b)}]] ({', '.join(sorted(edges[(b, a)]))}) point at each other")
    for (a, b), ts in edges.items():
        if len(ts) > 1:
            twice.append(f"[[{name(a)}]] → [[{name(b)}]] is stored as more than one type: {', '.join(sorted(ts))}")
    total_typed = sum(mix.values())
    info["mix"] = mix
    info["related_share"] = (mix["related"] / total_typed * 100) if total_typed else 0
    R["twice"] = sorted(twice)

    # Open flag callouts
    open_flags = Counter()
    for p in checked:
        pg = v.pages[p]
        for m in CALLOUT_RE.finditer(pg["clean"]):
            kind = m.group(1).lower()
            open_flags[kind] += 1
            line = f"[[{name(p)}]]: {FLAG_KINDS[kind]}: {m.group(2).strip()[:70]}"
            (R["flags"] if kind in ("question", "warning") else R["otherflags"]).append(line)
            if pg["fm"].get("status") == "verified" and kind == "warning":
                R["props"].append(f"[[{name(p)}]]: verified, but still has an unsourced-background callout")
    info["open_flags"] = open_flags

    # Drafts older than 14 days; change notes; verified pages edited after verification
    today_d = dt.date.fromisoformat(today)
    edited_after, verified_count = [], 0
    for p in checked:
        fm = v.pages[p]["fm"]
        status = fm.get("status")
        notes = as_list(fm.get("changes_since_verified"))
        if status == "draft":
            dates = [d for d in [fm.get("drafted_on")] if isinstance(d, str) and DATE_RE.match(d)]
            dates += [n[:10] for n in notes if DATE_RE.match(n[:10])]
            if dates:
                age = (today_d - dt.date.fromisoformat(max(dates))).days
                if age > STALE_DAYS:
                    R["stale"].append(f"[[{name(p)}]]: draft for {age} days (since {max(dates)})")
            if fm.get("verified_on") and not notes:
                R["changed"].append(f"[[{name(p)}]]: a draft with `verified_on` but no `changes_since_verified` note")
            for n in notes:
                if not re.match(r"^\d{4}-\d{2}-\d{2}: \S", n):
                    R["changed"].append(f"[[{name(p)}]]: change note not in the form `YYYY-MM-DD: what changed (why)`: \"{n[:60]}\"")
        elif status == "verified":
            verified_count += 1
            if notes:
                R["changed"].append(f"[[{name(p)}]]: verified, but still carries a `changes_since_verified` note")
            vo = fm.get("verified_on")
            if isinstance(vo, str) and DATE_RE.match(vo):
                mdate = dt.date.fromtimestamp(os.path.getmtime(os.path.join(root, p)))
                if mdate > dt.date.fromisoformat(vo):
                    edited_after.append(f"[[{name(p)}]]: verified {vo}, file last changed {mdate.isoformat()}")
    if verified_count and len(edited_after) > verified_count / 2:
        info["edited_after_note"] = (f"{len(edited_after)} of {verified_count} verified pages have file dates after their `verified_on`; "
                                     "the dates were probably reset (a fresh clone or a copy), so this check was skipped.")
    else:
        R["changed"].extend(f"{line} (possibly edited after it was verified; check the log or git)" for line in edited_after)

    # Gaps in the sources: "?" placeholders and empty date headings in class notes
    for p in sorted(x for x in v.pages if x.startswith("Sources/Class Notes/")):
        lines = v.pages[p]["clean"].split("\n")
        qs = [i + 1 for i, l in enumerate(lines) if re.match(r"^\s*(?:[-*]\s*)?\?+\s*$", l) or "??" in l or re.search(r":\s*\?\s*$", l)]
        if qs:
            R["gaps"].append(f"[[{name(p)}]]: {len(qs)} \"?\" placeholder(s), lines {', '.join(map(str, qs[:12]))}{'…' if len(qs) > 12 else ''}")
        for i, l in enumerate(lines):
            hm = NOTES_DATE_HEADING_RE.match(l)
            if not hm:
                continue
            dm = re.search(r"\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b", l)
            try:
                y = int(dm.group(3)); y = y + 2000 if y < 100 else y
                if dt.date(y, int(dm.group(1)), int(dm.group(2))) >= today_d:
                    continue   # a class that hasn't happened yet (or is today)
            except ValueError:
                pass
            level = len(hm.group(1))
            j, content = i + 1, False
            while j < len(lines):
                nm = re.match(r"^(#{1,6})\s", lines[j])
                if nm and len(nm.group(1)) <= level:
                    break
                if lines[j].strip() and not nm:
                    content = True
                    break
                j += 1
            if not content:
                R["gaps"].append(f"[[{name(p)}]]: heading \"{l.strip('# ').strip()}\" has no notes under it")

    # Index
    idx = v.pages.get("_index.md") or v.pages.get("index.md")
    if idx:
        sections, cur, listed_total = {}, None, None
        m = re.search(r"\*\*Total:\*\*\s*(\d+)", idx["body"])
        listed_total = int(m.group(1)) if m else None
        for line in idx["body"].split("\n"):
            hm = re.match(r"^##\s+(.+?)\s*\((\d+)\)\s*$", line)
            if hm:
                cur = hm.group(1)
                sections[cur] = {"count": int(hm.group(2)), "entries": []}
                continue
            em = re.match(r"^\s*-\s*\[\[([^\]]+)\]\]", line)
            if em and cur:
                sections[cur]["entries"].append(parse_link(em.group(1))[0])
        indexed = {}
        for sec, d in sections.items():
            if d["count"] != len(d["entries"]):
                R["index"].append(f"_index.md: \"{sec}\" says {d['count']} but lists {len(d['entries'])}")
            for e in d["entries"]:
                tgt = v.resolve(e)
                if not tgt or not is_wiki_page(tgt):
                    R["index"].append(f"_index.md: \"{sec}\" lists [[{e}]], which isn't a page in Wiki/, Perspectives/, or Source Cards/")
                elif tgt in indexed:
                    R["index"].append(f"_index.md: [[{e}]] is listed twice")
                else:
                    indexed[tgt] = sec
                    want = section_for(tgt)
                    if want and want != sec:
                        R["index"].append(f"_index.md: [[{e}]] is under \"{sec}\" but its folder is \"{want}\"")
        for p in pages:
            if p not in indexed:
                R["index"].append(f"_index.md: [[{name(p)}]] is missing")
        n_entries = sum(len(d["entries"]) for d in sections.values())
        if listed_total is not None and listed_total != len(pages):
            R["index"].append(f"_index.md: the total says {listed_total}, but there are {len(pages)} pages ({n_entries} listed)")

    # Triage
    q = v.pages.get("Ingestion/Triage.md")
    if q:
        lines = q["clean"].split("\n")
        batch = None
        def close(b):
            if not b:
                return
            mark, title, links, line_no = b
            cards = [l for l in links if parse_link(l)[0].startswith("SRC - ")]
            exist = [c for c in cards if v.resolve(parse_link(c)[0])]
            missing = [c for c in cards if not v.resolve(parse_link(c)[0])]
            for c in missing:
                R["queue"].append(f"Triage.md (line {line_no}): \"{title}\" links [[{parse_link(c)[0]}]], which doesn't exist")
            if mark == " " and exist:
                R["queue"].append(f"Triage.md (line {line_no}): \"{title}\" is marked waiting but already has source cards")
            if mark in ("~", "x") and not cards:
                R["queue"].append(f"Triage.md (line {line_no}): \"{title}\" is marked {'done' if mark == 'x' else 'drafted'} but links no source card")
        for i, line in enumerate(lines):
            bm = re.match(r"^(\s*)-\s*`?\[([ ~x])\]`?\s*(.*)$", line)
            if bm:
                if batch and len(bm.group(1)) > batch[4]:
                    close(batch[:4])  # a sub-batch replaces its parent as the open batch
                elif batch:
                    close(batch[:4])
                title = re.sub(r"\*\*|`", "", bm.group(3)).strip()[:60]
                batch = [bm.group(2), title, [m.group(2) for m in LINK_RE.finditer(line)], i + 1, len(bm.group(1))]
                continue
            if batch and (line.startswith((" ", "\t")) and line.strip()):
                batch[2].extend(m.group(2) for m in LINK_RE.finditer(line))
            elif line.strip() and not line.startswith((" ", "\t")):
                close(batch[:4] if batch else None)
                batch = None
        close(batch[:4] if batch else None)

    # Properties
    for p in checked:
        fm = v.pages[p]["fm"]
        if not v.pages[p]["fm_text"]:
            R["props"].append(f"[[{name(p)}]]: has no properties")
            continue
        t, s = fm.get("type"), fm.get("status")
        if is_rule_file(p) and t == "changelog":
            continue   # the changelog is history: no status, never verified
        if is_wiki_page(p) and t not in PAGE_TYPES:
            R["props"].append(f"[[{name(p)}]]: `type` is \"{t}\", not one of the page types")
        if s not in ("draft", "verified"):
            R["props"].append(f"[[{name(p)}]]: `status` is \"{s}\", not draft or verified")
        for k in ("drafted_on", "verified_on"):
            val = fm.get(k)
            if isinstance(val, str) and val and not DATE_RE.match(val):
                R["props"].append(f"[[{name(p)}]]: `{k}` is \"{val}\", not YYYY-MM-DD")
        if s == "verified" and not fm.get("verified_on"):
            R["props"].append(f"[[{name(p)}]]: verified but has no `verified_on`")

    # Pages to read for the judgment checks
    since = last_report(root)
    judged = []
    if since:
        changed, how = changed_since(root, pages, since)
        info["since"], info["how"] = since, how
        info["changed"] = sorted(changed)
        rest = sorted(set(pages) - changed)
        rng = random.Random(today)
        info["sample"] = sorted(rng.sample(rest, min(SAMPLE_SIZE, len(rest))))
    info["pages"], info["rules"] = len(pages), len(rules)
    return R, info


def name(p):
    base = p.rsplit("/", 1)[-1]
    return base[:-3] if base.endswith(".md") else base


def section_for(p):
    if p.startswith("Perspectives/"):
        return "Perspectives"
    if p.startswith("Sources/Source Cards/"):
        return "Source Cards"
    m = re.match(r"^Wiki/([^/]+)/", p)
    return m.group(1) if m else None


# ---------- report ----------

ROWS = [
    ("Claims without citations, citations that don't support them, or footnote problems", "cite", "judgment for support; the script counts footnote and `sources` problems"),
    ("Contradictions between pages", None, "judgment"),
    ("Typed links that don't hold up, or links that are missing", "typed", "judgment; the script counts typed links to missing pages"),
    ("Typed-link mix: share that are `related`, relationships stored twice", "twice", None),
    ("Broken links, orphan pages, duplicate pages", "broken+orphan", "duplicates are judgment"),
    ("\"Whose view?\" and unsourced-background callouts still open", "flags", None),
    ("Drafts older than 14 days", "stale", None),
    ("Verified pages changed since they were verified", "changed", None),
    ("Gaps in sources (\"?\" placeholders, empty definitions)", "gaps", "the script only reads the class notes"),
    ("Pages missing from the index, or index entries with no page", "index", None),
    ("`Triage.md` out of date", "queue", None),
    ("Anything else found (properties, formatting)", "props", None),
]

DETAIL = [
    ("cite", "Footnotes, old citations, and `sources`"),
    ("broken", "Broken links and heading links"),
    ("orphan", "Orphan pages"),
    ("typed", "Typed links to missing pages"),
    ("twice", "Relationships stored twice"),
    ("flags", "Open \"Whose view?\" and unsourced-background callouts"),
    ("otherflags", "Other open flags (accuracy checks, sources disagree, gaps)"),
    ("stale", "Drafts older than 14 days"),
    ("changed", "Change notes and verified pages"),
    ("gaps", "Gaps in the class notes"),
    ("index", "Index"),
    ("queue", "Triage"),
    ("props", "Properties"),
]


def report(R, info, today, full):
    out = [f"# Coppermind health check: mechanical checks ({today})", ""]
    out.append(f"Read {info['pages']} pages (wiki pages, perspectives, and source cards) and {info['rules']} rule files. "
               "Nothing was changed. Rows marked *judgment* still need an agent to read the pages listed at the end.")
    out += ["", "| Check | Found by the script | Still needs judgment |", "|---|---|---|"]
    for label, key, note in ROWS:
        if key is None:
            n = "—"
        elif key == "broken+orphan":
            n = f"{len(R['broken'])} broken, {len(R['orphan'])} orphans"
        elif key == "twice":
            mix = info["mix"]
            n = f"{len(R['twice'])} stored twice; {info['related_share']:.0f}% `related` of {sum(mix.values())}"
        else:
            n = str(len(R[key]))
        out.append(f"| {label} | {n} | {note or ''} |")
    mix = info["mix"]
    out += ["", "**Typed-link mix:** " + ", ".join(f"`{t}` {mix[t]}" for t in TYPED if mix[t]) + "."]
    of = info["open_flags"]
    if of:
        out.append("**Open flag callouts:** " + ", ".join(f"{FLAG_KINDS[k]} {of[k]}" for k in FLAG_KINDS if of[k]) + ".")
    if info.get("edited_after_note"):
        out.append(f"**Note:** {info['edited_after_note']}")
    limit = None if full else 40
    for key, title in DETAIL:
        items = R[key]
        if not items:
            continue
        out += ["", f"## {title} ({len(items)})", ""]
        shown = items if limit is None else items[:limit]
        out += [f"- {i}" for i in shown]
        if limit is not None and len(items) > limit:
            out.append(f"- …and {len(items) - limit} more (run with `--full` to list them all)")
    out += ["", "## Pages to read for the judgment checks", ""]
    if info.get("since"):
        ch = info["changed"]
        out.append(f"Changed since the last report ({info['since']}, from {info['how']}): {len(ch)}.")
        out += [f"- [[{name(p)}]]" for p in ch]
        out += ["", f"A random sample of {len(info['sample'])} other pages (the same sample all day):"]
        out += [f"- [[{name(p)}]]" for p in info["sample"]]
    else:
        out.append("No earlier report in `Health Checks/`, so read the whole wiki for the judgment checks.")
    return "\n".join(out) + "\n"


def main():
    ap = argparse.ArgumentParser(description="Run the Coppermind's mechanical health checks.")
    ap.add_argument("vault", nargs="?", default=".", help="the vault's top folder (default: the current folder)")
    ap.add_argument("--out", help="also write the report to this file")
    ap.add_argument("--full", action="store_true", help="list every finding, not just the first 40 of each kind")
    ap.add_argument("--today", help=argparse.SUPPRESS)
    a = ap.parse_args()
    root = os.path.abspath(a.vault)
    if not os.path.isdir(os.path.join(root, "Wiki")):
        sys.exit(f"{root} doesn't look like the Coppermind (no Wiki/ folder). Run this from the vault's top folder.")
    today = a.today or dt.date.today().isoformat()
    R, info = run(root, today, a.full)
    text = report(R, info, today, a.full)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(text)
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    sys.stdout.write(text)


if __name__ == "__main__":
    main()
