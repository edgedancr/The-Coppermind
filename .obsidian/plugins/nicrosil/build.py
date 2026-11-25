"""Build Nicrosil's main.js and styles.css from the parts in src/.

Obsidian loads only main.js and styles.css. They are built files: the code lives in
src/js/ and the styles in src/css/, split by feature so an agent can open the one part
it needs instead of the whole 400 KB file. See src/README.md for what is in each part.

    python build.py          join the parts into main.js and styles.css
    python build.py --check  report whether main.js and styles.css match the parts (changes nothing)
    python build.py --map    list the parts with their sizes

The parts are joined in file-name order, byte for byte, with nothing added between them.
The parts of the plugin class (src/js/14-... onward) are pieces of one class body, so a
single part is not valid JavaScript on its own; only the joined main.js is.
Needs only Python 3.
"""
import pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
JS_BANNER = b"// BUILT FILE: do not edit. Edit the parts in src/js/ and run `python build.py` (see src/README.md).\n"
CSS_BANNER = b"/* BUILT FILE: do not edit. Edit the parts in src/css/ and run `python build.py` (see src/README.md). */\n"
TARGETS = [("main.js", "js", JS_BANNER), ("styles.css", "css", CSS_BANNER)]


def parts(kind):
    return sorted((HERE / "src" / kind).glob(f"*.{kind}"))


def built(kind, banner):
    body = b"".join(p.read_bytes() for p in parts(kind))
    if b"\r\n" in body[:4096]:  # match the parts' line endings (Windows files use CRLF)
        banner = banner.replace(b"\n", b"\r\n")
    return banner + body


def main(argv):
    mode = argv[1] if len(argv) > 1 else "--build"
    if mode == "--map":
        for _, kind, _ in TARGETS:
            for p in parts(kind):
                data = p.read_bytes()
                lines = data.count(b"\n")
                print(f"src/{kind}/{p.name}  {len(data) // 1024} KB  {lines} lines")
        return 0
    stale = []
    for target, kind, banner in TARGETS:
        if not parts(kind):
            print(f"no parts in src/{kind}/"); return 2
        want = built(kind, banner)
        path = HERE / target
        have = path.read_bytes() if path.exists() else b""
        if mode == "--check":
            if have != want:
                stale.append(target)
        elif mode == "--build":
            if have != want:
                path.write_bytes(want)
                print(f"built {target} from {len(parts(kind))} parts ({len(want) // 1024} KB)")
            else:
                print(f"{target} already matches its parts")
        else:
            print(__doc__); return 2
    if mode == "--check":
        if stale:
            print("OUT OF DATE: " + ", ".join(stale) + " no longer match src/. If someone edited the built file "
                  "directly, copy that change into the right part in src/ and run `python build.py`.")
            return 1
        print("main.js and styles.css match src/.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
