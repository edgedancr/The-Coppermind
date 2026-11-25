#!/usr/bin/env python3
"""
Source to text: make a Markdown text copy of a source, once, so agents read text instead of page images.

    python Tools/source-to-text/source_to_text.py "Sources/Readings/Some Book (scan).pdf"
    python Tools/source-to-text/source_to_text.py Sources/Readings            (every source in the folder)
    python Tools/source-to-text/source_to_text.py Sources/Readings --force    (redo copies that already exist)
    python Tools/source-to-text/source_to_text.py "Sources/Readings/X.pdf" --force --ocr   (OCR every page)

For each source it writes "<name> (text).md" beside it, for example
"Kaiser and Pherson - Analytic Writing Guide, ch. 3 (scan) (text).md". The original is never changed.
A copy that already exists is left alone unless --force is given.

What it reads:
- .pdf: the PDF's own text, page by page. A page with almost no text (a scan) is read with OCR,
  if Tesseract and Poppler are installed. Each page starts with a "## Page N" heading, where N is the
  PDF's page number, the one to cite as [[file.pdf#page=N]].
- .docx, .html, .htm: converted with Pandoc if it is installed, else with python-docx (.docx only).
- .pptx: one "## Slide N" heading per slide, with its text and speaker notes (python-pptx).
- .xlsx: one "## Sheet" heading per sheet, as a table (openpyxl).
- .doc, .ppt, .xls: first turned into .docx, .pptx or .xlsx with LibreOffice, in a temporary folder.
- .md and .txt are already text and are skipped.

What it needs: Python 3.8+. Python packages: pypdf, python-docx, python-pptx, openpyxl
(`pip install pypdf python-docx python-pptx openpyxl`). Programs, each optional: Pandoc, LibreOffice,
and for scans Tesseract, Poppler (pdftoppm) and Pillow (`pip install pillow`, to turn sideways scans upright). It says what is missing for a file it can't convert.

The rules for text copies are in SCHEMAS/SCHEMA - Ingest.md (Orient) and _AGENTS.md (Permissions).
"""

import argparse
import datetime as dt
import os
import re
import shutil
import subprocess
import sys
import tempfile

TEXT_SUFFIX = " (text).md"
CONVERTIBLE = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls", ".html", ".htm"}
OCR_MIN_CHARS = 40      # a page with less text than this is treated as a scan
OCR_DPI = 300


def which(*names):
    for n in names:
        p = shutil.which(n)
        if p:
            return p
    return None


def tidy(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\x0c", "\n")
    text = re.sub(r"(?<=\S)[ \t]{2,}", " ", text)          # runs of spaces from page layout
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ---------- PDF ----------

def pdf_pages_text(path):
    """The PDF's own text, one string per page."""
    exe = which("pdftotext")
    if exe:
        out = subprocess.run([exe, "-enc", "UTF-8", path, "-"], capture_output=True)
        if out.returncode == 0:
            pages = out.stdout.decode("utf-8", "replace").split("\x0c")
            if pages and not pages[-1].strip():
                pages = pages[:-1]
            return pages
    try:
        from pypdf import PdfReader
    except ImportError:
        raise RuntimeError("needs pypdf (pip install pypdf) or Poppler's pdftotext")
    return [(pg.extract_text() or "") for pg in PdfReader(path).pages]


def word_score(text):
    """How much of an OCR result looks like English words: a sideways page reads as fragments."""
    words = re.findall(r"[A-Za-z]+", text)
    return sum(len(w) for w in words if len(w) >= 3 and (w.islower() or w.istitle()))


def upright(png, tesseract):
    """Turns a sideways or upside-down scan upright before OCR: Tesseract's own orientation check if it
    has one (the "osd" data), otherwise the quarter turn whose OCR reads most like words. Needs Pillow."""
    try:
        from PIL import Image
    except ImportError:
        return
    turn = None
    osd = subprocess.run([tesseract, png, "-", "--psm", "0"], capture_output=True)
    m = re.search(rb"Rotate: (\d+)", osd.stdout + osd.stderr)
    c = re.search(rb"Orientation confidence: ([\d.]+)", osd.stdout + osd.stderr)
    if m and c and float(c.group(1)) >= 1.0:
        turn = int(m.group(1))
    else:                                         # no orientation data, or unsure: try each quarter turn on a small copy
        img = Image.open(png)
        small = img.copy()
        small.thumbnail((1200, 1200))
        best = (-1, 0)
        for t in (0, 90, 180, 270):
            probe = png + f".{t}.png"
            small.rotate(-t, expand=True).save(probe)
            text = subprocess.run([tesseract, probe, "-", "--psm", "3"], capture_output=True).stdout.decode("utf-8", "replace")
            os.remove(probe)
            best = max(best, (word_score(text), t))
        turn = best[1]
    if turn:
        Image.open(png).rotate(-turn, expand=True).save(png)


def ocr_page(path, number, workdir):
    pdftoppm, tesseract = which("pdftoppm"), which("tesseract")
    if not (pdftoppm and tesseract):
        return None
    stem = os.path.join(workdir, f"p{number}")
    subprocess.run([pdftoppm, "-r", str(OCR_DPI), "-gray", "-f", str(number), "-l", str(number),
                    "-png", "-singlefile", path, stem], check=True, capture_output=True)
    upright(stem + ".png", tesseract)
    out = subprocess.run([tesseract, stem + ".png", "-", "--psm", "3"], capture_output=True)
    os.remove(stem + ".png")
    return out.stdout.decode("utf-8", "replace") if out.returncode == 0 else None


def convert_pdf(path, force_ocr=False):
    pages = pdf_pages_text(path)
    ocr_count, missing = 0, []
    parts = []
    with tempfile.TemporaryDirectory() as workdir:
        for i, text in enumerate(pages, start=1):
            note = ""
            if force_ocr or len(re.sub(r"\s", "", text)) < OCR_MIN_CHARS:
                ocr = ocr_page(path, i, workdir)
                if ocr is None:
                    missing.append(i)
                    note = "\n\n*(No text on this page, and OCR is not installed: read the PDF page.)*"
                else:
                    ocr_count += 1
                    parts.append(f"## Page {i}\n\n*(read with OCR)*\n\n{tidy(ocr)}")
                    continue
            parts.append(f"## Page {i}\n\n{tidy(text)}{note}")
    how = f"its own text; {ocr_count} of {len(pages)} pages read with OCR" if ocr_count else "its own text"
    if missing:
        how += f"; {len(missing)} pages left unread (no OCR)"
    return "\n\n".join(parts), how, f"{len(pages)} pages"


# ---------- Office and HTML ----------

def pandoc_to_md(path, fmt):
    exe = which("pandoc")
    if not exe:
        return None
    out = subprocess.run([exe, path, "-f", fmt, "-t", "gfm-raw_html", "--wrap=none"], capture_output=True)
    if out.returncode != 0:
        return None
    text = out.stdout.decode("utf-8", "replace")
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)        # images: the text copy is for reading words
    return text


def convert_docx(path):
    text = pandoc_to_md(path, "docx")
    if text is not None and "[TABLE]" not in text:      # Pandoc drops tables with merged cells as "[TABLE]"
        return text, "Pandoc", ""
    try:
        import docx
    except ImportError:
        raise RuntimeError("needs Pandoc or python-docx (pip install python-docx)")
    d = docx.Document(path)
    lines = []
    for para in d.paragraphs:
        style = (para.style.name or "").lower() if para.style is not None else ""
        t = para.text.strip()
        if not t:
            continue
        m = re.match(r"heading (\d)", style)
        lines.append(("#" * min(6, int(m.group(1)) + 1) + " " + t) if m else t)
    for table in d.tables:
        lines.append(md_table([[c.text.strip() for c in row.cells] for row in table.rows]))
    return "\n\n".join(lines), "python-docx", ""


def convert_html(path):
    text = pandoc_to_md(path, "html")
    if text is None:
        raise RuntimeError("needs Pandoc for HTML")
    return text, "Pandoc", ""


def convert_pptx(path):
    try:
        from pptx import Presentation
    except ImportError:
        raise RuntimeError("needs python-pptx (pip install python-pptx)")
    pres = Presentation(path)
    parts = []
    for i, slide in enumerate(pres.slides, start=1):
        texts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                t = "\n".join(p.text for p in shape.text_frame.paragraphs).strip()
                if t:
                    texts.append(t)
            elif getattr(shape, "has_table", False) and shape.has_table:
                texts.append(md_table([[c.text.strip() for c in row.cells] for row in shape.table.rows]))
        notes = ""
        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text.strip()
        body = "\n\n".join(texts) or "*(no text on this slide)*"
        if notes:
            body += f"\n\n**Speaker notes:** {notes}"
        parts.append(f"## Slide {i}\n\n{body}")
    return "\n\n".join(parts), "python-pptx", f"{len(pres.slides)} slides"


def convert_xlsx(path):
    try:
        import openpyxl
    except ImportError:
        raise RuntimeError("needs openpyxl (pip install openpyxl)")
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    parts = []
    for ws in wb.worksheets:
        rows = [["" if v is None else str(v).strip() for v in row] for row in ws.iter_rows(values_only=True)]
        rows = [r for r in rows if any(r)]
        parts.append(f"## {ws.title}\n\n" + (md_table(rows) if rows else "*(empty sheet)*"))
    return "\n\n".join(parts), "openpyxl", f"{len(wb.worksheets)} sheets"


def md_table(rows):
    if not rows:
        return ""
    width = max(len(r) for r in rows)
    rows = [[c.replace("|", "\\|").replace("\n", " ") for c in r] + [""] * (width - len(r)) for r in rows]
    out = ["| " + " | ".join(rows[0]) + " |", "|" + " --- |" * width]
    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return "\n".join(out)


def via_libreoffice(path, target_ext, convert):
    exe = which("soffice", "libreoffice")
    if not exe:
        raise RuntimeError(f"needs LibreOffice to read {os.path.splitext(path)[1]} files")
    with tempfile.TemporaryDirectory() as workdir:
        subprocess.run([exe, "--headless", "--convert-to", target_ext.lstrip("."), "--outdir", workdir, path],
                       check=True, capture_output=True, timeout=300)
        out = os.path.join(workdir, os.path.splitext(os.path.basename(path))[0] + target_ext)
        if not os.path.exists(out):
            raise RuntimeError("LibreOffice did not convert it")
        text, how, extent = convert(out)
        return text, f"LibreOffice, then {how}", extent


def convert(path, force_ocr=False):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return convert_pdf(path, force_ocr)
    if ext == ".docx":
        return convert_docx(path)
    if ext in (".html", ".htm"):
        return convert_html(path)
    if ext == ".pptx":
        return convert_pptx(path)
    if ext == ".xlsx":
        return convert_xlsx(path)
    if ext == ".doc":
        return via_libreoffice(path, ".docx", convert_docx)
    if ext == ".ppt":
        return via_libreoffice(path, ".pptx", convert_pptx)
    if ext == ".xls":
        return via_libreoffice(path, ".xlsx", convert_xlsx)
    raise RuntimeError(f"can't convert {ext} files")


# ---------- writing the copy ----------

def text_copy_path(path):
    folder, base = os.path.split(path)
    return os.path.join(folder, os.path.splitext(base)[0] + TEXT_SUFFIX)


def write_copy(path, force, today, force_ocr=False):
    out = text_copy_path(path)
    if os.path.exists(out) and not force:
        return f"skipped (copy exists): {os.path.basename(out)}"
    body, how, extent = convert(path, force_ocr)
    base = os.path.basename(path)
    pdf_note = (f" Each `## Page N` heading is page N of the PDF: cite it as `[[{base}#page=N]]`."
                if base.lower().endswith(".pdf") else "")
    header = (f"Text copy of [[{base}]], made {today} by `Tools/source-to-text/source_to_text.py` "
              f"({how}{', ' + extent if extent else ''}). Agents read this copy instead of the original to save tokens, "
              f"but cite the original, never this copy.{pdf_note} OCR and conversion can drop or garble words: "
              f"check a quote against the original before relying on it.\n\n---\n\n")
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(header + tidy(body) + "\n")
    size = os.path.getsize(out)
    return f"wrote {os.path.basename(out)} ({size // 1024} KB; {how})"


def targets(paths):
    for p in paths:
        if os.path.isdir(p):
            for base in sorted(os.listdir(p)):
                full = os.path.join(p, base)
                if os.path.isfile(full) and os.path.splitext(base)[1].lower() in CONVERTIBLE:
                    yield full
        elif os.path.isfile(p):
            yield p
        else:
            print(f"not found: {p}", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser(description="Make Markdown text copies of sources, beside the originals.")
    ap.add_argument("paths", nargs="+", help="source files, or folders to convert every source in")
    ap.add_argument("--force", action="store_true", help="redo copies that already exist")
    ap.add_argument("--ocr", action="store_true",
                    help="read every PDF page with OCR, even pages that have text (for PDFs whose own text is a poor old OCR)")
    args = ap.parse_args()
    norm = lambda p: os.path.abspath(p).replace(os.sep, "/")
    if any("/Ingestion/Raw/" in norm(p) + "/" or "/The Tinmind/" in norm(p) + "/" for p in args.paths):
        print("Refused: Ingestion/Raw/ and The Tinmind/ are not converted (see _AGENTS.md).", file=sys.stderr)
        return 2
    today = dt.date.today().isoformat()
    failures = 0
    for path in targets(args.paths):
        if path.endswith(TEXT_SUFFIX) or os.path.splitext(path)[1].lower() not in CONVERTIBLE:
            continue
        try:
            print(f"{os.path.basename(path)}: {write_copy(path, args.force, today, args.ocr)}")
        except Exception as e:  # keep going with the other files
            failures += 1
            print(f"{os.path.basename(path)}: FAILED, {e}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
