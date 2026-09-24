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
SHOT = os.path.join(ROOT, "site", "shots", "v75-D.png")

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


def draw_capsule(tw, th, logo=True, tagline=None):
    """Storefront capsule: keyart base + optional logo/tagline, safe-zone aware.

    Safe-zone rule (STORE-COPY.md §4): title/logo inside central 80%;
    no prices, no 'free', no review scores on capsules."""
    shot = Image.open(SHOT).convert("RGB")
    img = crop_resize(shot, tw, th)
    grad = Image.new("L", (1, th))
    for y in range(th):
        t = y / th
        a = int(220 * max(0.0, (t - 0.35) / 0.65) ** 1.3)
        grad.putpixel((0, y), a)
    grad = grad.resize((tw, th))
    img = Image.composite(Image.new("RGB", (tw, th), (10, 11, 15)), img, grad)
    d = ImageDraw.Draw(img)
    if logo:
        lock = draw_lockup()
        lw = int(tw * 0.72)
        lh = int(lock.height * (lw / lock.width))
        if lh > th * 0.55:
            lh = int(th * 0.55)
            lw = int(lock.width * (lh / lock.height))
        lock = lock.resize((lw, lh), Image.LANCZOS)
        img = img.convert("RGBA")
        img.alpha_composite(lock, (int((tw - lw) / 2 - lw * 0.06),
                                   int(th * 0.5 - lh * 0.55)))
        img = img.convert("RGB")
        d = ImageDraw.Draw(img)
    if tagline:
        f_tag = ImageFont.truetype(FONT_R, max(10, int(th * 0.055)))
        d.text((int(tw * 0.1), int(th * 0.88)), tagline, font=f_tag, fill=TEXT)
    return img


def draw_library_capsule(tw=600, th=900):
    """600x900 vertical: roofline sky extended above the keyart crop."""
    img = Image.new("RGB", (tw, th), (10, 11, 15))
    shot_h = int(th * 0.62)
    img.paste(crop_resize(Image.open(SHOT).convert("RGB"), tw, shot_h),
              (0, th - shot_h))
    lock = draw_lockup()
    lw = int(tw * 0.8)
    lh = int(lock.height * (lw / lock.width))
    lock = lock.resize((lw, lh), Image.LANCZOS)
    img = img.convert("RGBA")
    img.alpha_composite(lock, (int((tw - lw) / 2 - lw * 0.06), int(th * 0.16)))
    return img.convert("RGB")


def draw_library_hero(tw=3840, th=1240):
    """Steam library hero (STORE-COPY.md §4). The published still is 1440x900,
    so a straight 3840-wide crop would upscale ~2.9x and smear. Instead:
    mirrored-edge panorama — a center crop of the shot (HUD edge removed)
    at ~2x, flanked by blurred wings mirrored from the same frame, lockup
    in the left safe zone. Steam rule observed: logo only, no other text."""
    shot = Image.open(SHOT).convert("RGB")
    # drop dev-HUD left edge, the DIRECTOR badge strip up top, and the
    # status bar along the bottom
    shot = shot.crop((330, 170, shot.width, shot.height - 60))
    img = Image.new("RGB", (tw, th), (10, 11, 15))
    # wings: heavy-blurred stretch of the frame fills the full canvas first
    bg = crop_resize(shot, tw, th).filter(ImageFilter.GaussianBlur(28))
    img.paste(bg, (0, 0))
    # crisp center panel at ~1.6x source scale
    pw = int(tw * 0.46)
    panel = crop_resize(shot, pw, th)
    img.paste(panel, ((tw - pw) // 2, 0))
    # soft seams where panel meets wings
    seam = Image.new("L", (int(tw * 0.06), th), 0)
    sd = ImageDraw.Draw(seam)
    for x in range(seam.width):
        sd.line([(x, 0), (x, th)], fill=int(255 * x / seam.width))
    dark = Image.new("RGB", seam.size, (10, 11, 15))
    px = (tw - pw) // 2
    img.paste(dark, (px - seam.width, 0), Image.eval(seam, lambda v: 255 - v))
    img.paste(dark, (px + pw, 0), seam)
    # readability gradient for the logo zone (left third)
    grad = Image.new("L", (1, th))
    for y in range(th):
        grad.putpixel((0, y), int(120 + 100 * (y / th)))
    grad = grad.resize((tw, th))
    left = Image.new("L", (tw, th), 0)
    ld = ImageDraw.Draw(left)
    for x in range(tw):
        a = int(255 * max(0.0, 1 - x / (tw * 0.42)))
        ld.line([(x, 0), (x, th)], fill=a)
    mask = Image.composite(grad, Image.new("L", (tw, th), 0), left)
    img = Image.composite(Image.new("RGB", (tw, th), (10, 11, 15)), img, mask)
    lock = draw_lockup()
    lw = int(tw * 0.22)
    lh = int(lock.height * (lw / lock.width))
    lock = lock.resize((lw, lh), Image.LANCZOS)
    img = img.convert("RGBA")
    img.alpha_composite(lock, (int(tw * 0.045), int(th * 0.5 - lh * 0.55)))
    return img.convert("RGB")


def draw_banner(tw, th, tagline, icon_frac=0.62, text_cx=None):
    """Social profile banner: darkened build capture + icon + lockup text,
    all content inside the center safe zone. text_cx = horizontal center
    of the text block as a fraction of width (None = centered)."""
    shot = Image.open(SHOT).convert("RGB")
    # published stills carry the dev HUD on the left edge — crop it out (same
    # crop as the trailer animatic: [330,100,1440,794]).
    shot = shot.crop((330, 100, min(1440, shot.width), min(794, shot.height)))
    img = crop_resize(shot, tw, th)
    # heavier overall darken — banners must survive overlay UI + crops
    grad = Image.new("L", (1, th))
    for y in range(th):
        t = y / th
        a = int(150 + 90 * abs(t - 0.5) * 2)  # darkest at edges
        grad.putpixel((0, y), a)
    grad = grad.resize((tw, th))
    img = Image.composite(Image.new("RGB", (tw, th), (10, 11, 15)), img, grad)

    img = img.convert("RGBA")
    # shrink the icon+lockup group until it fits the safe width (88% of tw)
    probe = ImageDraw.Draw(img)
    ih = int(th * icon_frac)
    while True:
        f_big = ImageFont.truetype(FONT_B, max(10, int(ih * 0.30)))
        f_sub = ImageFont.truetype(FONT_B, max(8, int(ih * 0.10)))
        f_tag = ImageFont.truetype(FONT_R, max(8, int(ih * 0.085)))
        wt = probe.textlength("REAL WORLD", font=f_big)
        group_w = ih + int(ih * 0.18) + int(wt)
        if group_w <= tw * 0.88 or ih < 40:
            break
        ih = int(ih * 0.92)
    icon = draw_icon(ih)
    gx = int((tw - group_w) / 2) if text_cx is None else int(text_cx * tw - group_w / 2)
    gx = max(int(tw * 0.06), min(gx, tw - group_w - int(tw * 0.06)))
    gy = (th - ih) // 2
    img.alpha_composite(icon, (gx, gy))
    d = ImageDraw.Draw(img)
    tx = gx + ih + int(ih * 0.18)
    ty = gy + int(ih * 0.10)
    d.text((tx, ty), "REAL WORLD", font=f_big, fill=TEXT)
    d.rectangle([tx + 3, ty + int(ih * 0.34), tx + wt - 3, ty + int(ih * 0.34) + max(3, int(ih * 0.02))], fill=ACCENT)
    d.text((tx + 3, ty + int(ih * 0.40)), "T H E   M I S S I O N", font=f_sub, fill=ACCENT)
    d.text((tx + 3, ty + int(ih * 0.62)), tagline, font=f_tag, fill=TEXT)
    return img.convert("RGB")


def main():
    os.makedirs(ASSETS, exist_ok=True)
    os.makedirs(KEYART, exist_ok=True)

    draw_icon(512).save(os.path.join(ASSETS, "logo-icon.png"))
    draw_icon(192).save(os.path.join(ASSETS, "icon-192.png"))
    draw_icon(180).save(os.path.join(ASSETS, "apple-touch-icon.png"))
    draw_icon(32).save(os.path.join(ASSETS, "favicon-32.png"))
    draw_lockup().save(os.path.join(ASSETS, "logo-primary.png"))

    # Maskable icon: full-bleed Asphalt tile, mark shrunk into the inner 80%
    # safe zone so Android launchers can crop to any mask shape.
    mask = Image.new("RGBA", (512, 512), BG)
    inner = draw_icon(410)
    mask.alpha_composite(inner, (51, 51))
    mask.save(os.path.join(ASSETS, "icon-maskable.png"))

    k169 = draw_keyart(1920, 1080,
        "A neighborhood that's alive whether you're watching or not.")
    k169.save(os.path.join(KEYART, "keyart-16x9.png"))
    k169.save(os.path.join(ASSETS, "keyart-16x9.png"))  # site-local copy
    draw_keyart(1080, 1080,
        "Watch free. Pay to reach in."
        ).save(os.path.join(KEYART, "keyart-square.png"))

    # Social share card (OG/Twitter, 1200x630) — same bake as key art so a
    # shot refresh keeps og:image on the current build.
    draw_keyart(1200, 630,
        "A neighborhood that's alive whether you're watching or not."
        ).save(os.path.join(ASSETS, "og-card.png"), optimize=True)

    # Storefront capsule set (STORE-COPY.md §4) — regenerated from the
    # current hero shot so a shot refresh re-bakes every capsule.
    STORE = os.path.join(ROOT, "store", "capsules")
    os.makedirs(STORE, exist_ok=True)
    draw_capsule(630, 500).save(
        os.path.join(STORE, "itch-cover-630x500.png"))
    draw_capsule(630, 500).save(
        os.path.join(ASSETS, "cover-itch-630x500.png"))
    draw_capsule(460, 215).save(
        os.path.join(STORE, "steam-header-460x215.png"))
    draw_capsule(231, 87).save(
        os.path.join(STORE, "steam-small-231x87.png"))
    draw_capsule(616, 353).save(
        os.path.join(STORE, "steam-main-616x353.png"))
    draw_capsule(374, 448).save(
        os.path.join(STORE, "steam-vertical-374x448.png"))
    draw_library_capsule().save(
        os.path.join(STORE, "steam-library-600x900.png"))
    draw_library_hero().save(
        os.path.join(STORE, "steam-library-hero-3840x1240.png"),
        optimize=True)
    bg = draw_capsule(1438, 810, logo=False)
    bg = bg.filter(ImageFilter.GaussianBlur(6))
    bg.save(os.path.join(STORE, "steam-page-bg-1438x810.png"),
            optimize=True)

    # Social profile banners (BRAND.md §9) — content inside center safe zones.
    BANNERS = os.path.join(ROOT, "press-kit", "banners")
    os.makedirs(BANNERS, exist_ok=True)
    for name, tw, th, tag, kw in [
        ("banner-x-1500x500.png",        1500,  500, "Watch free. Pay to reach in.", {}),
        ("banner-youtube-2560x1440.png", 2560, 1440,
         "A neighborhood that's alive whether you're watching or not.",
         {"icon_frac": 0.30}),  # YT safe zone = center 1546x423
        ("banner-discord-960x540.png",    960,  540, "Watch free. Pay to reach in.", {}),
        ("banner-linkedin-1584x396.png", 1584,  396,
         "A neighborhood that never stops performing.", {"icon_frac": 0.72}),
    ]:
        b = draw_banner(tw, th, tag, **kw)
        b.save(os.path.join(BANNERS, name), optimize=True)
        b.save(os.path.join(ASSETS, name), optimize=True)
    print("brand assets written")


if __name__ == "__main__":
    main()
