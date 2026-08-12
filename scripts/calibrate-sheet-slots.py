#!/usr/bin/env python3
"""
Measure the character sheet's slot artwork so src/utils/daggerheartSheetLayout.js
can be re-derived if Darrington Press republishes the sheet.

The printed *labels* on the sheet have text anchors and can be read straight out
of the PDF's text layer. The slot graphics — HP/Stress boxes, Hope diamonds,
armor pips, gold coins, proficiency circles — are pure vector art with no text,
so they have to be measured off a raster render.

Requires (not project dependencies — install ad hoc when recalibrating):
    pip install pypdfium2 pillow

Usage:
    python3 scripts/calibrate-sheet-slots.py [public/assets/daggerheart-sheet-template.pdf]

Prints measurements in PDF points, origin bottom-left, for the generic sheet
(the last page of the template). Every front page shares this layout.

Pixel -> point conversion at render scale S:  x = px / S,  y = 792 - py / S
"""
import sys
import pypdfium2 as pdfium
from PIL import Image

SCALE = 4.0
PAGE_H = 792.0
DEFAULT_PDF = "public/assets/daggerheart-sheet-template.pdf"


def render(pdf_path, page_index=-1):
    doc = pdfium.PdfDocument(pdf_path)
    page = doc[page_index if page_index >= 0 else len(doc) - 1]
    return page.render(scale=SCALE).to_pil().convert("L")


def x2px(x):
    return int(x * SCALE)


def y2px(y):
    return int((PAGE_H - y) * SCALE)


def px2x(px):
    return px / SCALE


def px2y(py):
    return PAGE_H - py / SCALE


def h_groups(px, y0, y1, x0, x1, thr=225, gap=1, min_w=5, width=None):
    """Column-projection over a horizontal band; returns (center, width) in points.

    Works for evenly spaced glyphs that don't touch. `gap` bridges dash gaps.
    """
    xa, xb = x2px(x0), min(x2px(x1), width)
    ya, yb = y2px(y1), y2px(y0)
    out, cur, last = [], None, None
    for x in range(xa, xb):
        hit = any(px[x, y] < thr for y in range(ya, yb))
        if hit:
            if cur is None:
                cur = [x, x]
            elif x - last <= gap:
                cur[1] = x
            else:
                out.append(cur)
                cur = [x, x]
            last = x
    if cur:
        out.append(cur)
    return [
        (round((a + b) / 2 / SCALE, 2), round((b - a + 1) / SCALE, 2))
        for a, b in out
        if (b - a + 1) / SCALE >= min_w
    ]


def ring_centers(px, y, x0, x1, thr=200, width=None):
    """Find circles that touch each other by pairing their left/right ring walls.

    Column projection merges touching circles into one blob; scanning a single
    row through their centers gives two short dark runs per circle instead.
    """
    py = y2px(y)
    runs, st = [], None
    xb = min(x2px(x1), width)
    for x in range(x2px(x0), xb):
        dark = px[x, py] < thr
        if dark and st is None:
            st = x
        elif not dark and st is not None:
            runs.append((st, x - 1))
            st = None
    return [(round((runs[i][0] + runs[i + 1][1]) / 2 / SCALE, 2)) for i in range(0, len(runs) - 1, 2)]


def light_runs(px, y, x0, x1, thr=240, min_w=10, width=None):
    """White glyphs on a grey field — the Hope diamonds."""
    py = y2px(y)
    out, st = [], None
    xb = min(x2px(x1), width)
    for x in range(x2px(x0), xb):
        lit = px[x, py] > thr
        if lit and st is None:
            st = x
        elif not lit and st is not None:
            if x - st >= min_w:
                out.append((st, x - 1))
            st = None
    return [(round((a + b) / 2 / SCALE, 2), round((b - a + 1) / SCALE, 2)) for a, b in out]


def rules(px, x0, x1, y0, y1, min_frac=0.5, thr=235, width=None):
    """Long horizontal writing rules — the weapon/experience/inventory lines."""
    xa, xb = x2px(x0), min(x2px(x1), width)
    span = xb - xa
    hits = []
    for py in range(y2px(y1), y2px(y0)):
        n = sum(1 for x in range(xa, xb) if px[x, py] < thr)
        if n >= span * min_frac:
            hits.append(round(px2y(py), 2))
    out, prev = [], None
    for y in hits:
        if prev is None or abs(prev - y) > 1.0:
            out.append(y)
        prev = y
    return out


def show(label, values):
    print(f"--- {label}")
    print(f"    {values}")
    centers = [v[0] if isinstance(v, tuple) else v for v in values]
    if len(centers) > 1:
        pitch = (centers[-1] - centers[0]) / (len(centers) - 1)
        print(f"    count={len(centers)} pitch={pitch:.3f}")


def main():
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PDF
    img = render(pdf_path)
    px = img.load()
    W = img.size[0]
    print(f"Rendered {pdf_path} at scale {SCALE} -> {img.size}\n")

    show("HP boxes (solid + dashed)", h_groups(px, 553, 570, 30, 300, gap=1, min_w=10, width=W))
    show("STRESS boxes (solid + dashed)", h_groups(px, 531, 548, 55, 300, gap=1, min_w=10, width=W))
    show("HOPE diamonds", light_runs(px, 488.75, 40, 260, width=W))
    show("ARMOR pips (columns)", h_groups(px, 686, 698, 130, 180, gap=2, min_w=4, width=W))
    show("GOLD coins", h_groups(px, 269, 280, 5, 135, gap=1, min_w=6, width=W))
    show("GOLD bags", h_groups(px, 266, 282, 132, 236, gap=1, min_w=6, width=W))
    show("GOLD chest", h_groups(px, 264, 283, 238, 266, gap=3, min_w=6, width=W))
    show("PROFICIENCY circles", ring_centers(px, 616, 428, 520, width=W))
    show("TRAIT label bars", h_groups(px, 714, 724, 190, 600, gap=6, min_w=6, width=W))

    print()
    show("WEAPON rules", rules(px, 292, 595, 440, 600, 0.45, width=W))
    show("ARMOR rules", rules(px, 292, 595, 330, 395, 0.45, width=W))
    show("INVENTORY WEAPON rules", rules(px, 292, 595, 15, 185, 0.45, width=W))
    show("EXPERIENCE rules", rules(px, 22, 170, 330, 420, 0.6, width=W))
    show("INVENTORY rules", rules(px, 302, 592, 180, 300, 0.6, width=W))


if __name__ == "__main__":
    main()
