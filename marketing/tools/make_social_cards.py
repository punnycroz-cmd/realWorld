#!/usr/bin/env python3
"""Generate post-ready social cards (local, reproducible).

Composites real published captures from site/shots/ with the brand palette
into attach-ready images for the post bank in social/drafts/. Every card is
1200x675 (X/Bluesky image card) unless noted; a square teaser is emitted at
1080x1080 for TikTok/IG cover frames.

Outputs (relative to marketing/):
  social/cards/spotlight-c{1..8}-<slug>.png   cast spotlight cards (8)
  social/cards/card-teaser-tomorrow.png       T-1 "Tomorrow." card
  social/cards/card-teaser-tomorrow-sq.png    1080x1080 square variant
  social/cards/card-recap.png                 "This Week on the Block" masthead
  social/cards/card-receipt.png               Counter/receipt arc card
  social/cards/card-empty-feed.png            feed-honesty launch-hour card
  social/cards/card-watchfree.png             evergreen CTA card
  social/cards/manifest.json                  card -> draft -> alt-text map

Run: python3 tools/make_social_cards.py   (idempotent; overwrites cards/)
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "site", "shots")
OUT = os.path.join(ROOT, "social", "cards")
ICON = os.path.join(ROOT, "site", "assets", "logo-icon.png")

BG = (20, 22, 28, 255)
PANEL = (29, 32, 41, 255)
BORDER = (44, 48, 60, 255)
TEXT = (236, 231, 220, 255)
MUTED = (190, 196, 208, 255)
FAINT = (120, 128, 146, 255)
ACCENT = (232, 160, 76, 255)    # café-light amber
GREEN = (79, 157, 105, 255)

FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_O = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

W, H = 1200, 675

# Spoiler-safe role lines — tease, never confirm (SOCIAL-LAUNCH-PLAN §4).
SPOTLIGHTS = [
    ("c1-marisol",  "v52-INT-cafe.png", "Marisol Delgado",
     "opens Mudhaus at six", "Everybody reads the neighborhood blog. Nobody knows who writes it."),
    ("c2-jules",    "v55-B.png", "Jules Park",
     "new here too", "Three weeks in. Still learning the regulars."),
    ("c3-dani",     "v52-INT-flat.png", "Dani Reyes",
     "draws the chalkboards", "The block notices more than you'd think."),
    ("c4-priya",    "v53-A.png", "Priya Raman",
     "med-surg, three 12s a week", "Everybody on this block has a ritual."),
    ("c5-marcus",   "v55-A.png", "Marcus Bell",
     "courier, knows every porch", "Ask him what he heard today."),
    ("c6-carmen",   "v55-C.png", "Carmen Echeverría",
     "same palm, every afternoon", "She knows this block's history by heart."),
    ("c7-victor",   "v52-INT-hw.png", "Victor Auerbach",
     "Auerbach Hardware, nine to six", "Two Guerrero buildings are quietly for sale. He hasn't mentioned it."),
    ("c8-tomas",    "v52-INT-taq.png", "Tomás Herrera",
     "works the line at El Farolote", "His 3 p.m. coffee isn't about the coffee."),
]


def font(path, size):
    return ImageFont.truetype(path, size)


def cover_shot(name, w, h, dim=0.45, blur=0):
    """Load a real capture, center-crop to w x h, dim for legibility."""
    img = Image.open(os.path.join(SHOTS, name)).convert("RGB")
    sw, sh = img.size
    scale = max(w / sw, h / sh)
    img = img.resize((int(sw * scale) + 1, int(sh * scale) + 1),
                     Image.LANCZOS)
    x = (img.width - w) // 2
    y = (img.height - h) // 2
    img = img.crop((x, y, x + w, y + h))
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    return Image.blend(img, Image.new("RGB", (w, h), BG[:3]), dim)


def scrim(img, height=280):
    """Bottom-up black gradient for caption legibility."""
    s = Image.new("L", (1, height))
    for i in range(height):
        s.putpixel((0, i), int(200 * (i / height) ** 1.5))
    s = s.resize((img.width, height))
    img.paste(BG[:3], (0, img.height - height), s)
    return img


def paste_icon(img, size=64, pos=None, alpha=200):
    icon = Image.open(ICON).convert("RGBA").resize((size, size),
                                                   Image.LANCZOS)
    if alpha < 255:
        icon.putalpha(icon.getchannel("A").point(lambda a: a * alpha // 255))
    pos = pos or (img.width - size - 32, img.height - size - 32)
    img.paste(icon, pos, icon)


def wrap(d, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for word in words:
        t = (cur + " " + word).strip()
        if d.textlength(t, font=fnt) <= max_w:
            cur = t
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def frame(img):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, img.width - 1, img.height - 1], outline=BORDER,
                width=3)
    return img


def spotlight(slug, shot, name, role, teaser):
    img = scrim(cover_shot(shot, W, H, dim=0.30), 300)
    d = ImageDraw.Draw(img)
    pad, base = 44, H - 60
    # amber rule
    d.rectangle([pad, base - 210, pad + 56, base - 204], fill=ACCENT)
    f_name = font(FONT_B, 64)
    f_role = font(FONT_O, 30)
    f_tease = font(FONT_R, 30)
    d.text((pad, base - 196), name, font=f_name, fill=TEXT)
    d.text((pad, base - 118), role.upper(), font=f_role, fill=ACCENT)
    for i, line in enumerate(wrap(d, teaser, f_tease, W - pad * 2 - 120)):
        d.text((pad, base - 78 + i * 40), line, font=f_tease, fill=MUTED)
    paste_icon(img)
    img = frame(img)
    img.save(os.path.join(OUT, f"spotlight-{slug}.png"))
    return f"spotlight-{slug}.png"


def title_card(fname, shot, kicker, headline, sub, square=False):
    w, h = (1080, 1080) if square else (W, H)
    img = scrim(cover_shot(shot, w, h, dim=0.42), h // 2)
    d = ImageDraw.Draw(img)
    pad = 48
    f_kick = font(FONT_B, 30)
    f_head = font(FONT_B, 96 if not square else 110)
    f_sub = font(FONT_R, 34)
    y = h - pad
    for i, line in enumerate(reversed(wrap(d, sub, f_sub, w - pad * 2))):
        d.text((pad, y - (i + 1) * 44), line, font=f_sub, fill=MUTED)
    head_lines = wrap(d, headline, f_head, w - pad * 2)
    y -= len(wrap(d, sub, f_sub, w - pad * 2)) * 44 + 24
    for line in reversed(head_lines):
        d.text((pad, y - 110), line, font=f_head, fill=TEXT)
        y -= 110
    d.text((pad, y - 54), kicker.upper(), font=f_kick, fill=ACCENT)
    paste_icon(img, pos=(img.width - 96, 32))
    img = frame(img)
    img.save(os.path.join(OUT, fname))
    return fname


def receipt_card():
    """Counter-arc card: a receipt panel, honest 'demo' badge."""
    img = cover_shot("v55-A.png", W, H, dim=0.62, blur=2)
    d = ImageDraw.Draw(img)
    # receipt panel
    px, py, pw, ph = 330, 90, 540, 495
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=10, fill=PANEL,
                        outline=BORDER, width=2)
    f_mono = font(FONT_R, 26)
    f_b = font(FONT_B, 30)
    cx = px + 40
    d.text((cx, py + 34), "THE COUNTER", font=f_b, fill=ACCENT)
    d.line([cx, py + 82, px + pw - 40, py + 82], fill=BORDER, width=2)
    rows = ["rq-____ .................. filed",
            "wording check ............. free",
            "sponsor ................... open",
            "status .................. public"]
    for i, r in enumerate(rows):
        d.text((cx, py + 106 + i * 42), r, font=f_mono, fill=MUTED)
    d.line([cx, py + 288, px + pw - 40, py + 288], fill=BORDER, width=2)
    d.text((cx, py + 310), "every request", font=f_mono, fill=TEXT)
    d.text((cx, py + 348), "leaves a receipt.", font=f_mono, fill=TEXT)
    # demo badge — baked per the feed-honesty rule for pre-launch shots
    d.rounded_rectangle([cx, py + ph - 76, cx + 150, py + ph - 36],
                        radius=6, outline=ACCENT, width=2)
    d.text((cx + 18, py + ph - 70), "DEMO", font=f_mono, fill=ACCENT)
    paste_icon(img, pos=(W - 96, 32))
    img = frame(img)
    img.save(os.path.join(OUT, "card-receipt.png"))
    return "card-receipt.png"


def main():
    os.makedirs(OUT, exist_ok=True)
    made = [spotlight(*s) for s in SPOTLIGHTS]
    made.append(title_card(
        "card-teaser-tomorrow.png", "v55-D.png",
        "the Mission · day zero", "Tomorrow.",
        "Twenty-eight lives on one block. Watch free."))
    made.append(title_card(
        "card-teaser-tomorrow-sq.png", "v55-D.png",
        "the Mission · day zero", "Tomorrow.",
        "Twenty-eight lives. One block. Watch free.", square=True))
    made.append(title_card(
        "card-recap.png", "v55-C.png",
        "weekly · real events only", "This Week on the Block",
        "A recap of what actually happened — pulled from the public feed."))
    made.append(receipt_card())
    made.append(title_card(
        "card-empty-feed.png", "v53-C.png",
        "launch hour · honest report", "The feed is empty.",
        "No requests yet. Be the first."))
    made.append(title_card(
        "card-watchfree.png", "v55-A.png",
        "a real Mission block", "Watch free.",
        "Twenty-eight characters. Their own plans. Your requests on the public feed."))

    manifest = {
        "version": 109,
        "schema": "social-cards/v1",
        "note": ("Post-ready cards for social/drafts/. All backgrounds are real "
                 "published captures from site/shots/; receipt card carries a "
                 "baked DEMO badge per the feed-honesty rule. LOCAL ONLY — "
                 "nothing here has been posted."),
        "cards": {
            "spotlight-c1-marisol.png": {"draft": "cast-spotlights.md C1", "shot": "v52-INT-cafe.png"},
            "spotlight-c2-jules.png": {"draft": "cast-spotlights.md C2", "shot": "v55-B.png"},
            "spotlight-c3-dani.png": {"draft": "cast-spotlights.md C3", "shot": "v52-INT-flat.png"},
            "spotlight-c4-priya.png": {"draft": "cast-spotlights.md C4", "shot": "v53-A.png"},
            "spotlight-c5-marcus.png": {"draft": "cast-spotlights.md C5", "shot": "v55-A.png"},
            "spotlight-c6-carmen.png": {"draft": "cast-spotlights.md C6", "shot": "v55-C.png"},
            "spotlight-c7-victor.png": {"draft": "cast-spotlights.md C7", "shot": "v52-INT-hw.png"},
            "spotlight-c8-tomas.png": {"draft": "cast-spotlights.md C8", "shot": "v52-INT-taq.png"},
            "card-teaser-tomorrow.png": {"draft": "launch-thread.md T-1", "shot": "v55-D.png"},
            "card-teaser-tomorrow-sq.png": {"draft": "launch-thread.md T-1 (square)", "shot": "v55-D.png"},
            "card-recap.png": {"draft": "recap-format.md", "shot": "v55-C.png"},
            "card-receipt.png": {"draft": "counter-arc.md", "shot": "v55-A.png"},
            "card-empty-feed.png": {"draft": "launch-thread.md feed-honesty slot", "shot": "v53-C.png"},
            "card-watchfree.png": {"draft": "evergreen CTA", "shot": "v55-A.png"},
        },
    }
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"make_social_cards: {len(made)} cards + manifest -> {OUT}")


if __name__ == "__main__":
    main()
