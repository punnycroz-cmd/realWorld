#!/usr/bin/env python3
"""Generate Real World brand/press-kit raster assets (local, reproducible).

Outputs (relative to marketing/):
  site/assets/logo-icon.png        512x512 app-icon style mark
  site/assets/logo-primary.png     1600x480 horizontal lockup (icon + wordmark)
  site/assets/favicon-32.png       32x32 favicon
  site/assets/apple-touch-icon.png 180x180
  press-kit/keyart/keyart-16x9.png 1920x1080 key art (real build capture + title)
  press-kit/keyart/keyart-square.png 1080x1080 social square

Vector sources (logo-*.svg, favicon.svg) are hand-authored and live in
site/assets/; this script renders matching PNGs since no SVG rasterizer
is guaranteed on the build machine.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "site", "assets")
KEYART = os.path.join(ROOT, "press-kit", "keyart")
SHOT = os.path.join(ROOT, "site", "shots", "v16-D.png")

BG = (20, 22, 28, 255)          # --bg
PANEL = (29, 32, 41, 255)       # --panel
BORDER = (44, 48, 60, 255)      # --border
TEXT = (236, 231, 220, 255)     # --text
MUTED = (120, 128, 146, 255)
ACCENT = (232, 160, 76, 255)    # café-light amber
GREEN = (79, 157, 105, 255)     # park green
RED = (212, 100, 92, 255)       # mural red

FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def rounded(d, box, r, fill):
    d.rounded_rectangle(box, radius=r, fill=fill)


def draw_icon(size):
    """Rowhouse mark: dark facade, 3x3 window grid, one amber lit window."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = size / 512.0
    # tile background
    rounded(d, [0, 0, size - 1, size - 1], 112 * u, BG)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=112 * u,
                        outline=BORDER, width=max(2, int(6 * u)))
    # facade
    fx0, fy0, fx1, fy1 = 106 * u, 128 * u, 406 * u, 430 * u
    d.rectangle([fx0, fy0, fx1, fy1], fill=PANEL)
    # parapet / cornice
    d.rectangle([fx0 - 14 * u, fy0 - 20 * u, fx1 + 14 * u, fy0 + 4 * u], fill=BORDER)
    # bay dividers
    for x in (fx0 + 100 * u, fx0 + 200 * u):
        d.rectangle([x, fy0, x + 4 * u, fy1], fill=BORDER)
    # windows: 3 cols x 3 rows
    cols = [fx0 + 18 * u, fx0 + 118 * u, fx0 + 218 * u]
    rows = [fy0 + 30 * u, fy0 + 128 * u, fy0 + 226 * u]
    ww, wh = 64 * u, 72 * u
    lit = (1, 1)  # center window lit
    for ci, x in enumerate(cols):
        for ri, y in enumerate(rows):
            color = MUTED
            if (ci, ri) == lit:
                color = ACCENT
            elif ci == 0 and ri == 2:
                color = GREEN
            elif ci == 2 and ri == 0:
                color = RED
            rounded(d, [x, y, x + ww, y + wh], 8 * u, color)
    # warm glow spilling from the lit window
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gx, gy = cols[1] + ww / 2, rows[1] + wh / 2
    gd.ellipse([gx - 90 * u, gy - 90 * u, gx + 90 * u, gy + 90 * u],
               fill=(232, 160, 76, 46))
    glow = glow.filter(ImageFilter.GaussianBlur(28 * u))
    img = Image.alpha_composite(glow, img)
    return img


def draw_lockup(w=1600, h=480):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    icon = draw_icon(380)
    img.alpha_composite(icon, (40, 50))
    d = ImageDraw.Draw(img)
    f_big = ImageFont.truetype(FONT_B, 148)
    f_sub = ImageFont.truetype(FONT_B, 44)
    x = 470
    d.text((x, 120), "REAL WORLD", font=f_big, fill=TEXT)
    # accent underline
    tw = d.textlength("REAL WORLD", font=f_big)
    d.rectangle([x + 4, 292, x + tw - 4, 302], fill=ACCENT)
    d.text((x + 4, 322), "T H E   M I S S I O N", font=f_sub, fill=ACCENT)
    return img


def crop_resize(img, tw, th):
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    img = img.resize((int(sw * scale + .5), int(sh * scale + .5)), Image.LANCZOS)
    x = (img.width - tw) // 2
    y = (img.height - th) // 2
    return img.crop((x, y, x + tw, y + th))


def draw_keyart(tw, th, tagline):
    shot = Image.open(SHOT).convert("RGB")
    img = crop_resize(shot, tw, th)
    # cinematic dark gradient, bottom-weighted
    grad = Image.new("L", (1, th))
    for y in range(th):
        t = y / th
        a = int(235 * max(0.0, (t - 0.28) / 0.72) ** 1.25)
        grad.putpixel((0, y), a)
    grad = grad.resize((tw, th))
    img = Image.composite(Image.new("RGB", (tw, th), (10, 11, 15)), img, grad)
    # vignette
    vig = Image.new("L", (tw, th), 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse([-tw * .25, -th * .25, tw * 1.25, th * 1.25], fill=70)
    vig = vig.filter(ImageFilter.GaussianBlur(th // 6))
    img = Image.composite(img, Image.new("RGB", (tw, th), (10, 11, 15)), vig)

    d = ImageDraw.Draw(img)
    margin = int(tw * 0.055)
    f_title = ImageFont.truetype(FONT_B, int(th * 0.125))
    f_sub = ImageFont.truetype(FONT_B, int(th * 0.038))
    f_tag = ImageFont.truetype(FONT_R, int(th * 0.030))
    y = int(th * 0.66)
    d.text((margin, y), "REAL WORLD", font=f_title, fill=TEXT)
    twd = d.textlength("REAL WORLD", font=f_title)
    y2 = y + int(th * 0.135)
    d.rectangle([margin + 4, y2, margin + twd - 4, y2 + int(th * 0.008)], fill=ACCENT)
    d.text((margin + 4, y2 + int(th * 0.02)), "T H E   M I S S I O N",
           font=f_sub, fill=ACCENT)
    d.text((margin + 4, y2 + int(th * 0.075)), tagline, font=f_tag, fill=TEXT)
    d.text((margin + 4, th - int(th * 0.055)),
           "IN DEVELOPMENT — development-build capture",
           font=ImageFont.truetype(FONT_R, int(th * 0.022)), fill=(200, 200, 205))
    return img


def main():
    os.makedirs(ASSETS, exist_ok=True)
    os.makedirs(KEYART, exist_ok=True)

    draw_icon(512).save(os.path.join(ASSETS, "logo-icon.png"))
    draw_icon(180).save(os.path.join(ASSETS, "apple-touch-icon.png"))
    draw_icon(32).save(os.path.join(ASSETS, "favicon-32.png"))
    draw_lockup().save(os.path.join(ASSETS, "logo-primary.png"))

    k169 = draw_keyart(1920, 1080,
        "A neighborhood that's alive whether you're watching or not.")
    k169.save(os.path.join(KEYART, "keyart-16x9.png"))
    k169.save(os.path.join(ASSETS, "keyart-16x9.png"))  # site-local copy
    draw_keyart(1080, 1080,
        "Watch free. Pay to reach in."
        ).save(os.path.join(KEYART, "keyart-square.png"))
    print("brand assets written")


if __name__ == "__main__":
    main()
