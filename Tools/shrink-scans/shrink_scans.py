"""Shrink phone photos of handwritten notes so they can sit in the vault until they are transcribed.

For each photo: turned upright (EXIF), grayscale, contrast stretched a little, long edge 2200 px,
saved as a progressive JPEG at quality 78. A 5 MB photo becomes about 0.4-0.6 MB and handwriting
stays easy to read. A page that comes out landscape was written sideways (text running bottom to top),
so it is turned a quarter turn clockwise so the writing reads normally.

Your originals are never changed or deleted. A photo whose shrunk copy already exists is skipped,
so you can run this again on a folder that has new photos in it.

Needs Python 3 and Pillow (pip install pillow). Phone photos in HEIC format also need pillow-heif.

    python shrink_scans.py "C:\\path\\to\\photos" "C:\\path\\to\\The-Coppermind\\Sources\\Scans"

Options: --edge 2200   --quality 78

The Coppermind's rules for this are in SCHEMAS/SCHEMA - Transcription.md.
"""
import argparse
import os
import sys
from concurrent.futures import ProcessPoolExecutor

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("This tool needs Pillow: pip install pillow")

EXTENSIONS = (".jpg", ".jpeg", ".png")


def shrink(job):
    src, out, edge, quality = job
    im = ImageOps.exif_transpose(Image.open(src)).convert("L")
    w, h = im.size
    scale = edge / max(w, h)
    if scale < 1:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    im = ImageOps.autocontrast(im, cutoff=0.5)
    if im.width > im.height:
        im = im.rotate(-90, expand=True)
    im.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    return os.path.basename(out), os.path.getsize(src), os.path.getsize(out)


def main():
    ap = argparse.ArgumentParser(description="Shrink photos of handwritten notes (see the top of this file).")
    ap.add_argument("source", help="folder with the original photos")
    ap.add_argument("dest", help="folder for the shrunk copies (Sources/Scans in the vault)")
    ap.add_argument("--edge", type=int, default=2200, help="long edge in pixels (default 2200)")
    ap.add_argument("--quality", type=int, default=78, help="JPEG quality (default 78)")
    a = ap.parse_args()

    os.makedirs(a.dest, exist_ok=True)
    jobs = []
    for name in sorted(os.listdir(a.source)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in EXTENSIONS:
            continue
        out = os.path.join(a.dest, stem + ".jpg")
        if not os.path.exists(out):
            jobs.append((os.path.join(a.source, name), out, a.edge, a.quality))
    if not jobs:
        print("Nothing new to shrink.")
        return
    with ProcessPoolExecutor() as pool:
        done = list(pool.map(shrink, jobs))
    before = sum(d[1] for d in done)
    after = sum(d[2] for d in done)
    print(f"{len(done)} photos: {before / 1e6:.0f} MB -> {after / 1e6:.0f} MB")


if __name__ == "__main__":
    main()
