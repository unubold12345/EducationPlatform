"""Crop the ЭЕШ diagram SVGs to their drawing.

Many generated diagrams draw in one corner of a fixed 640x360 canvas, which leaves a large blank band
on the page. This measures each drawing in a headless browser (transforms included), sets the root
viewBox/width/height to the drawing plus a margin, and updates the figure width/height in
assets/entrance-mocks so layout keeps the right ratio. Idempotent: rerun after build-entrance-mocks.mjs.

    python scripts/trim-figure-svgs.py [--dry-run]
"""
import json
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public" / "exam-assets" / "eesh"
MOCKS = ROOT / "assets" / "entrance-mocks"
PAD = 16          # margin kept around the drawing, in SVG units
MIN_SAVING = 0.08 # leave a file alone unless a side loses at least 8%

MEASURE = """() => {
  const svg = document.querySelector('svg');
  const vb = (svg.getAttribute('viewBox') || '').split(/[\\s,]+/).map(Number);
  const [vx, vy, W, H] = vb.length === 4 ? vb : [0, 0, svg.width.baseVal.value, svg.height.baseVal.value];
  const box = svg.getBoundingClientRect(), sx = W / box.width, sy = H / box.height;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const el of svg.querySelectorAll('*')) {
    if (el.closest('defs, marker, style, title, clipPath, mask, pattern')) continue;
    if (!(el instanceof SVGGraphicsElement) || el.tagName === 'g') continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    const ex0 = vx + (r.left - box.left) * sx, ey0 = vy + (r.top - box.top) * sy;
    const ex1 = ex0 + r.width * sx, ey1 = ey0 + r.height * sy;
    // The full-canvas background is not part of the drawing.
    if (el.tagName === 'rect' && ex1 - ex0 >= W * 0.97 && ey1 - ey0 >= H * 0.97) continue;
    x0 = Math.min(x0, ex0); y0 = Math.min(y0, ey0); x1 = Math.max(x1, ex1); y1 = Math.max(y1, ey1);
  }
  return { vx, vy, W, H, x0, y0, x1, y1 };
}"""


def fmt(n):
    return str(int(n)) if float(n).is_integer() else f"{n:.1f}"


def set_attr(tag, name, value):
    if re.search(rf'\s{name}="[^"]*"', tag):
        return re.sub(rf'(\s{name}=")[^"]*(")', rf'\g<1>{value}\g<2>', tag, count=1)
    return tag[:-1] + f' {name}="{value}">'


def main():
    dry = "--dry-run" in sys.argv
    files = sorted(PUBLIC.glob("*/*/*.svg"))
    sizes = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1600, "height": 1200})
        for file in files:
            text = file.read_text(encoding="utf-8")
            page.set_content("<!doctype html><body style='margin:0'>" + text)
            m = page.evaluate(MEASURE)
            if not m or m["x1"] < m["x0"]:
                continue
            x0 = max(m["vx"], m["x0"] - PAD); y0 = max(m["vy"], m["y0"] - PAD)
            x1 = min(m["vx"] + m["W"], m["x1"] + PAD); y1 = min(m["vy"] + m["H"], m["y1"] + PAD)
            w, h = x1 - x0, y1 - y0
            if w > m["W"] * (1 - MIN_SAVING) and h > m["H"] * (1 - MIN_SAVING):
                continue
            # Never crop on one axis only by a sliver: keep the full extent of an axis that barely changes.
            if w > m["W"] * (1 - MIN_SAVING):
                x0, w = m["vx"], m["W"]
            if h > m["H"] * (1 - MIN_SAVING):
                y0, h = m["vy"], m["H"]
            head = re.search(r"<svg\b[^>]*>", text)
            tag = head.group(0)
            tag = set_attr(tag, "viewBox", f"{fmt(x0)} {fmt(y0)} {fmt(w)} {fmt(h)}")
            tag = set_attr(tag, "width", fmt(w))
            tag = set_attr(tag, "height", fmt(h))
            src = "/" + file.relative_to(ROOT / "public").as_posix()
            sizes[src] = (round(w), round(h))
            if not dry:
                file.write_text(text[:head.start()] + tag + text[head.end():], encoding="utf-8", newline="")
        browser.close()

    changed_json = 0
    for mock in sorted(MOCKS.glob("*/*.json")):
        raw = mock.read_text(encoding="utf-8")
        data = json.loads(raw)
        touched = False

        def walk(node):
            nonlocal touched
            if isinstance(node, dict):
                if node.get("kind") == "image" and node.get("src") in sizes:
                    w, h = sizes[node["src"]]
                    if node.get("width") or node.get("height"):
                        # Keep the authored display width; derive the height from the cropped ratio.
                        width = node.get("width") or w
                        height = round(width * h / w)
                        if (node.get("width"), node.get("height")) != (width, height):
                            node["width"], node["height"] = width, height
                            touched = True
                for value in node.values():
                    walk(value)
            elif isinstance(node, list):
                for value in node:
                    walk(value)

        walk(data)
        if touched:
            changed_json += 1
            if not dry:
                indent = 2 if raw.startswith("{\n  ") else None
                mock.write_text(json.dumps(data, ensure_ascii=False, indent=indent) + ("\n" if raw.endswith("\n") else ""), encoding="utf-8", newline="")
    print(f"{'would crop' if dry else 'cropped'} {len(sizes)} of {len(files)} SVGs; {changed_json} mock files {'would change' if dry else 'updated'}")


if __name__ == "__main__":
    main()
