"""
Generate rune-themed dice atlases from the default dice-box number atlases.

Reads public/assets/dice-box/themes/default/diffuse-{dark,light}.png, finds each
number glyph, and replaces it with an Elder Futhark rune at the same position
and rotation. Writes to public/assets/dice-box/themes/magic/.
"""

import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

SRC_DIR = Path("public/assets/dice-box/themes/default")
DST_DIR = Path("public/assets/dice-box/themes/magic")
FONT_PATH = "C:/Windows/Fonts/seguihis.ttf"

# Elder Futhark runes (U+16A0 – U+16F0 range, curated for visual variety)
RUNES = [
    "\u16A0", "\u16A2", "\u16A6", "\u16A8", "\u16A9", "\u16AB", "\u16B1",
    "\u16B2", "\u16B3", "\u16B7", "\u16B9", "\u16BA", "\u16BE", "\u16C1",
    "\u16C3", "\u16C7", "\u16C8", "\u16CF", "\u16D2", "\u16D6", "\u16D7",
    "\u16DA", "\u16DC", "\u16DE", "\u16DF", "\u16E1",
]

DILATE_ITERATIONS = 9  # merge multi-digit numbers into single clusters


def principal_angle_deg(ys: np.ndarray, xs: np.ndarray) -> float:
    """Return the principal-axis angle in degrees for a pixel cloud."""
    if len(ys) < 3:
        return 0.0
    pts = np.column_stack([xs - xs.mean(), ys - ys.mean()]).astype(np.float64)
    cov = np.cov(pts, rowvar=False)
    eigvals, eigvecs = np.linalg.eigh(cov)
    # Largest eigenvalue's eigenvector = principal axis
    vx, vy = eigvecs[:, -1]
    return float(np.degrees(np.arctan2(vy, vx)))


def find_glyph_regions(alpha: np.ndarray):
    """Return list of (centroid_y, centroid_x, diag_size, angle_deg, bbox_slice)."""
    mask = alpha > 128
    dilated = ndimage.binary_dilation(mask, iterations=DILATE_ITERATIONS)
    labels, n = ndimage.label(dilated)
    regions = []
    for i in range(1, n + 1):
        cluster = labels == i
        # Use the ORIGINAL glyph pixels (not dilated) for centroid & angle
        glyph = cluster & mask
        ys, xs = np.where(glyph)
        if len(ys) < 5:
            continue
        cy, cx = ys.mean(), xs.mean()
        y0, y1 = ys.min(), ys.max()
        x0, x1 = xs.min(), xs.max()
        diag = float(np.hypot(y1 - y0, x1 - x0))
        angle = principal_angle_deg(ys, xs)
        # Normalise the rune's "tall axis" with the glyph's tall axis.
        # Runes are drawn vertical by default (tall axis = 90deg), so the
        # rotation needed to align them to the glyph's long axis is angle+90.
        rune_rotation = angle + 90.0
        bbox = (slice(y0, y1 + 1), slice(x0, x1 + 1))
        regions.append((cy, cx, diag, rune_rotation, bbox))
    return regions


def render_rune(rune_char: str, target_size: int, color: tuple, angle_deg: float) -> Image.Image:
    """Render a single rune as an RGBA image, rotated, ready to paste."""
    # Oversize the canvas to allow rotation without clipping
    canvas = target_size * 2
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Find a font size that makes the rune approximately target_size tall
    font_size = int(target_size * 1.3)
    font = ImageFont.truetype(FONT_PATH, font_size)
    bbox = draw.textbbox((0, 0), rune_char, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (canvas - tw) // 2 - bbox[0]
    ty = (canvas - th) // 2 - bbox[1]
    draw.text((tx, ty), rune_char, font=font, fill=color)

    img = img.rotate(-angle_deg, resample=Image.BICUBIC, expand=False)
    return img


def build_atlas(src_path: Path, dst_path: Path, color: tuple, seed: int = 42) -> None:
    src = Image.open(src_path).convert("RGBA")
    arr = np.array(src)
    alpha = arr[:, :, 3]

    # Start from a fully transparent canvas (wipe the original numbers)
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))

    regions = find_glyph_regions(alpha)
    rng = random.Random(seed)

    for (cy, cx, diag, angle, _bbox) in regions:
        rune = rng.choice(RUNES)
        # Scale rune size to match the original glyph's diagonal
        size = max(12, int(diag * 0.85))
        rune_img = render_rune(rune, size, color, angle)
        rw, rh = rune_img.size
        px = int(cx - rw / 2)
        py = int(cy - rh / 2)
        out.alpha_composite(rune_img, (px, py))

    out.save(dst_path, optimize=True)
    print(f"Wrote {dst_path} ({len(regions)} runes)")


def main() -> None:
    DST_DIR.mkdir(parents=True, exist_ok=True)
    # Dark atlas = dark text on light dice (black runes)
    build_atlas(SRC_DIR / "diffuse-dark.png", DST_DIR / "diffuse-dark.png", (20, 20, 20, 255))
    # Light atlas = light text on dark dice (white runes)
    build_atlas(SRC_DIR / "diffuse-light.png", DST_DIR / "diffuse-light.png", (245, 245, 245, 255))


if __name__ == "__main__":
    main()
