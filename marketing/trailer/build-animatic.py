#!/usr/bin/env python3
"""Build the 'Real World — The Mission' trailer animatic from edl.json.

Renders every frame with PIL (Ken Burns motion, brand title cards, mocked
feed/request UI, dip-to-black transitions, persistent DEVELOPMENT BUILD bug)
and pipes raw frames to ffmpeg -> mp4. Fully local; no uploads, no keys.

Usage:  python3 build-animatic.py [--program hero|teaser|all]
Output: out/animatic-<program>.mp4 + captions-<program>.srt
"""

import json
import math
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1440, 900
FPS = 24
DIP = 6  # frames of fade-out + fade-in per "dip" transition

FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_M = "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"
FONT_MB = "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf"

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageFilter


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


class Build:
    def __init__(self, edl):
        self.edl = edl
        self.c = {k: hexrgb(v) for k, v in edl["brand"].items() if v.startswith("#")}
        self.bug_text = edl["brand"]["dev_bug"]
        self.shots_dir = os.path.join(HERE, edl["shots_dir"])
        self.assets_dir = os.path.join(HERE, edl["assets_dir"])
        self.f_card = ImageFont.truetype(FONT_B, 52)
        self.f_end = ImageFont.truetype(FONT_B, 120)
        self.f_sub = ImageFont.truetype(FONT_B, 36)
        self.f_tag = ImageFont.truetype(FONT_R, 30)
        self.f_mono = ImageFont.truetype(FONT_M, 26)
        self.f_monob = ImageFont.truetype(FONT_MB, 26)
        self.f_bug = ImageFont.truetype(FONT_B, 15)
        self.f_chip = ImageFont.truetype(FONT_B, 22)
        self.f_req = ImageFont.truetype(FONT_M, 30)
        self.f_reqb = ImageFont.truetype(FONT_MB, 30)
        self._still_cache = {}

    # ---------- primitives ----------

    def still(self, shot):
        name = shot["src"]
        crop = tuple(shot.get("crop") or (0, 0, W, H))
        key = (name, crop)
        if key not in self._still_cache:
            img = Image.open(os.path.join(self.shots_dir, name)).convert("RGB")
            img = img.crop(crop).resize((W, H), Image.LANCZOS)
            self._still_cache[key] = img
        return self._still_cache[key]

    def kenburns(self, img, f, n, z0, z1, pan):
        """Slow push/pull with a directional drift."""
        t = f / max(n - 1, 1)
        t = t * t * (3 - 2 * t)  # smoothstep
        z = z0 + (z1 - z0) * t
        cw, ch = W / z, H / z
        sw, sh = img.size
        mx, my = sw - cw, sh - ch
        pans = {
            "left": ((1 - t) * mx, my * 0.5),
            "right": (t * mx, my * 0.5),
            "up": (mx * 0.5, (1 - t) * my),
            "down": (mx * 0.5, t * my),
            "none": (mx * 0.5, my * 0.5),
        }
        x, y = pans.get(pan, pans["none"])
        crop = img.crop((int(x), int(y), int(x + cw), int(y + ch)))
        return crop.resize((W, H), Image.LANCZOS)

    def grade(self, img, kind):
        if kind == "wet":
            img = ImageEnhance.Brightness(img).enhance(0.72)
            img = ImageEnhance.Color(img).enhance(0.78)
            img = ImageEnhance.Contrast(img).enhance(1.06)
            blue = Image.new("RGB", img.size, (28, 40, 60))
            img = Image.blend(img, blue, 0.16)
        elif kind == "night":
            img = ImageEnhance.Brightness(img).enhance(0.38)
            img = ImageEnhance.Color(img).enhance(0.7)
            blue = Image.new("RGB", img.size, (10, 14, 34))
            img = Image.blend(img, blue, 0.28)
        return img

    def vignette(self, img, strength=0.35):
        mask = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(mask)
        d.ellipse((-W * 0.25, -H * 0.35, W * 1.25, H * 1.35), fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(180))
        black = Image.new("RGB", (W, H), (0, 0, 0))
        return Image.composite(img, black, mask.point(lambda p: 255 - (255 - p) * strength))

    def lower_third(self, img, text):
        if not text:
            return img
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)
        band_h = 118
        y0 = H - band_h - 64
        d.rectangle((0, y0, W, y0 + band_h), fill=self.c["bg"] + (222,))
        d.rectangle((88, y0 + 26, 96, y0 + band_h - 26), fill=self.c["accent"] + (255,))
        tw = d.textlength(text, font=self.f_card)
        size = 52
        font = self.f_card
        while tw > W - 260 and size > 30:
            size -= 2
            font = ImageFont.truetype(FONT_B, size)
            tw = d.textlength(text, font=font)
        d.text((128, y0 + (band_h - size) / 2 - 6), text, font=font, fill=self.c["text"])
        img = img.convert("RGBA")
        img.alpha_composite(overlay)
        return img.convert("RGB")

    def corner_bug(self, img):
        d = ImageDraw.Draw(img)
        label = self.bug_text
        tw = d.textlength(label, font=self.f_bug)
        x0, y0 = W - tw - 46, 24
        d.rectangle((x0 - 12, y0 - 7, W - 22, y0 + 22), fill=(0, 0, 0), outline=self.c["border"])
        d.rectangle((x0 - 12, y0 - 7, x0 - 4, y0 + 22), fill=self.c["accent3"])
        d.text((x0, y0), label, font=self.f_bug, fill=self.c["muted"])
        return img

    def chip(self, img, states, f, n):
        """AI/YOU possession chip top-left; flips at 40% of the shot."""
        cur = states[0] if f < n * 0.4 else states[1]
        d = ImageDraw.Draw(img)
        label = f" {cur} "
        tw = d.textlength(label, font=self.f_chip)
        x0, y0 = 36, 22
        col = self.c["accent"] if cur == "YOU" else self.c["accent2"]
        d.rectangle((x0, y0, x0 + tw + 22, y0 + 34), fill=(0, 0, 0), outline=col, width=2)
        d.text((x0 + 11, y0 + 5), label, font=self.f_chip, fill=col)
        if cur == "YOU":
            d.ellipse((x0 + tw + 30, y0 + 10, x0 + tw + 44, y0 + 24), fill=self.c["accent3"])
        return img

    def timer_bar(self, img, f, n):
        """Draining possession timer across the top — hard cap visualized."""
        d = ImageDraw.Draw(img)
        t = min(f / max(n - 1, 1), 1.0)
        x0, x1, y = 36, 340, 74
        d.rectangle((x0, y, x1, y + 10), outline=self.c["border"])
        fill_w = int((x1 - x0 - 4) * (1 - t))
        col = self.c["accent"] if t < 0.8 else self.c["accent3"]
        if fill_w > 0:
            d.rectangle((x0 + 2, y + 2, x0 + 2 + fill_w, y + 8), fill=col)
        d.text((x0, y + 18), "possession time remaining", font=self.f_bug, fill=self.c["muted"])
        return img

    # ---------- shot renderers ----------

    def render_feedline(self, shot, f, n):
        img = Image.new("RGB", (W, H), (8, 9, 12))
        d = ImageDraw.Draw(img)
        shown = int(len(shot["line"]) * min(f / (n * 0.8), 1.0))
        text = shot["line"][:shown]
        if f % 16 < 10:
            text += "▌"
        tw = d.textlength(shot["line"], font=self.f_mono)
        d.text(((W - tw) / 2, H / 2 - 16), text, font=self.f_mono, fill=self.c["text"])
        return img

    def render_feed(self, shot, f, n):
        img = Image.new("RGB", (W, H), hexrgb("#101218"))
        d = ImageDraw.Draw(img)
        px, py, pw, ph = 150, 110, W - 300, H - 260
        d.rectangle((px, py, px + pw, py + ph), fill=self.c["panel"], outline=self.c["border"])
        d.rectangle((px, py, px + pw, py + 52), fill=self.c["bg"])
        d.text((px + 24, py + 13), "PUBLIC FEED — THE MISSION", font=self.f_monob, fill=self.c["accent"])
        d.text((px + pw - 190, py + 13), "watching: free", font=self.f_mono, fill=self.c["muted"])
        lines = shot["lines"]
        per = max(n * 0.75 / len(lines), 1)
        shown = min(int(f / per) + 1, len(lines))
        for i, line in enumerate(lines[:shown]):
            y = py + 84 + i * 56
            alpha_col = self.c["text"] if i == shown - 1 else self.c["muted"]
            d.text((px + 24, y), line, font=self.f_mono, fill=alpha_col)
            d.line((px + 24, y + 40, px + pw - 24, y + 40), fill=self.c["border"])
        return img

    def render_ledger(self, shot, f, n):
        img = Image.new("RGB", (W, H), hexrgb("#101218"))
        d = ImageDraw.Draw(img)
        px, py, pw, ph = 110, 130, W - 220, H - 300
        d.rectangle((px, py, px + pw, py + ph), fill=self.c["panel"], outline=self.c["border"])
        d.rectangle((px, py, px + pw, py + 52), fill=self.c["bg"])
        d.text((px + 24, py + 13), "PUBLIC REQUEST FEED", font=self.f_monob, fill=self.c["accent"])
        d.text((px + pw - 250, py + 13), "every move attributed", font=self.f_mono, fill=self.c["muted"])
        lines = shot["lines"]
        per = max(n * 0.7 / len(lines), 1)
        shown = min(int(f / per) + 1, len(lines))
        for i, line in enumerate(lines[:shown]):
            y = py + 88 + i * 62
            d.rectangle((px + 18, y - 6, px + 26, y + 26), fill=self.c["accent"])
            d.text((px + 44, y), line, font=self.f_mono,
                   fill=self.c["text"] if i == shown - 1 else self.c["muted"])
        return img

    def render_requestcard(self, shot, f, n):
        img = Image.new("RGB", (W, H), hexrgb("#0d0f14"))
        d = ImageDraw.Draw(img)
        cw, ch = 760, 460
        x0, y0 = (W - cw) / 2, (H - ch) / 2 - 30
        d.rectangle((x0, y0, x0 + cw, y0 + ch), fill=self.c["panel"], outline=self.c["border"], width=2)
        d.rectangle((x0, y0, x0 + cw, y0 + 64), fill=self.c["bg"])
        d.text((x0 + 28, y0 + 17), "REQUEST", font=self.f_monob, fill=self.c["accent"])
        d.text((x0 + cw - 230, y0 + 17), "viewer → world", font=self.f_mono, fill=self.c["muted"])
        rows = [("action", shot["fields"]["action"]),
                ("duration", shot["fields"]["duration"]),
                ("cost", shot["fields"]["cost"]),
                ("status", shot["fields"]["status"])]
        reveal = min(int(f / (n * 0.15)) + 1, len(rows))
        for i, (k, v) in enumerate(rows[:reveal]):
            y = y0 + 112 + i * 66
            d.text((x0 + 32, y), k.upper(), font=self.f_reqb, fill=self.c["muted"])
            d.text((x0 + 240, y), v, font=self.f_req,
                   fill=self.c["accent2"] if k == "status" else self.c["text"])
            d.line((x0 + 32, y + 44, x0 + cw - 32, y + 44), fill=self.c["border"])
        if f > n * 0.62:
            bx, by, bw, bh = x0 + cw - 240, y0 + ch - 70, 200, 46
            d.rectangle((bx, by, bx + bw, by + bh), fill=self.c["accent2"])
            t = "✓ APPROVED"
            tw = d.textlength(t, font=self.f_monob)
            d.text((bx + (bw - tw) / 2, by + 10), t, font=self.f_monob, fill=(10, 12, 10))
        return img

    def render_endcard(self, shot, f, n):
        img = Image.new("RGB", (W, H), hexrgb("#0a0b0f"))
        d = ImageDraw.Draw(img)
        t = min(f / (n * 0.35), 1.0)
        fade = Image.new("L", (W, H), int(255 * t))
        layer = Image.new("RGB", (W, H), hexrgb("#0a0b0f"))
        dl = ImageDraw.Draw(layer)
        tw = dl.textlength(shot["title"], font=self.f_end)
        x = (W - tw) / 2
        dl.text((x, H / 2 - 160), shot["title"], font=self.f_end, fill=self.c["text"])
        dl.rectangle((x, H / 2 - 24, x + tw, H / 2 - 18), fill=self.c["accent"])
        tw2 = dl.textlength(shot["subtitle"], font=self.f_sub)
        dl.text(((W - tw2) / 2, H / 2 + 8), shot["subtitle"], font=self.f_sub, fill=self.c["accent"])
        if shot.get("tagline") and t > 0.6:
            tw3 = dl.textlength(shot["tagline"], font=self.f_tag)
            dl.text(((W - tw3) / 2, H / 2 + 110), shot["tagline"], font=self.f_tag, fill=self.c["muted"])
        if shot.get("url") and t > 0.8:
            tw4 = dl.textlength(shot["url"], font=self.f_mono)
            dl.text(((W - tw4) / 2, H / 2 + 170), shot["url"], font=self.f_mono, fill=self.c["muted"])
        img = Image.composite(layer, img, fade)
        return img

    def render_frame(self, shot, f, n):
        kind = shot["kind"]
        if kind == "feedline":
            img = self.render_feedline(shot, f, n)
        elif kind == "feed":
            img = self.render_feed(shot, f, n)
        elif kind == "ledger":
            img = self.render_ledger(shot, f, n)
        elif kind == "requestcard":
            img = self.render_requestcard(shot, f, n)
        elif kind == "endcard":
            img = self.render_endcard(shot, f, n)
        else:  # still
            base = self.still(shot)
            z0, z1 = shot.get("zoom", [1.0, 1.08])
            img = self.kenburns(base, f, n, z0, z1, shot.get("pan", "none"))
            if shot.get("grade"):
                img = self.grade(img, shot["grade"])
            img = self.vignette(img)
            if shot.get("chip"):
                img = self.chip(img, shot["chip"], f, n)
            if shot.get("timer"):
                img = self.timer_bar(img, f, n)
        if shot.get("card"):
            img = self.lower_third(img, shot["card"])
        return self.corner_bug(img)

    # ---------- assembly ----------

    def build(self, name, prog):
        shots = prog["shots"]
        out_path = os.path.join(HERE, "out", prog["file"])
        total = sum(int(round(s["t"] * FPS)) for s in shots)
        print(f"[{name}] {len(shots)} shots, {total} frames ({total/FPS:.0f}s)")

        ff = subprocess.Popen(
            ["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
             "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
             "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-crf", "28", "-preset", "medium", "-movflags", "+faststart",
             out_path],
            stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

        black = Image.new("RGB", (W, H), (0, 0, 0))
        for i, shot in enumerate(shots):
            n = int(round(shot["t"] * FPS))
            # trim tail for dip-out / head for dip-in
            dip_out = DIP if shot.get("transition") == "dip" and i < len(shots) - 1 else 0
            dip_in = DIP if i > 0 and shots[i - 1].get("transition") == "dip" else 0
            for f in range(n):
                img = self.render_frame(shot, f, n)
                if dip_in and f < DIP:
                    img = Image.blend(black, img, (f + 1) / DIP)
                if dip_out and f >= n - DIP:
                    img = Image.blend(img, black, (f - (n - DIP) + 1) / DIP)
                ff.stdin.write(img.tobytes())
            print(f"  {shot['id']} done ({n}f)")
        ff.stdin.close()
        ff.wait()
        size = os.path.getsize(out_path) / 1e6
        print(f"  -> {out_path} ({size:.1f} MB)")

    def write_srt(self, prog):
        path = os.path.join(HERE, "out", prog["captions"])
        t = 0.0
        lines = []
        idx = 1

        def ts(s):
            h = int(s // 3600); m = int(s % 3600 // 60)
            sec = s % 60
            return f"{h:02d}:{m:02d}:{sec:06.3f}".replace(".", ",")

        for shot in prog["shots"]:
            dur = shot["t"]
            text = shot.get("card")
            if shot["kind"] == "feedline":
                text = shot["line"]
            if shot["kind"] == "endcard":
                parts = [shot["title"], shot["subtitle"].replace("  ", " ")]
                if shot.get("tagline"):
                    parts.append(shot["tagline"])
                text = " — ".join(p.strip() for p in parts)
            if text:
                lines.append(f"{idx}\n{ts(t)} --> {ts(t + dur - 0.15)}\n{text}\n")
                idx += 1
            t += dur
        with open(path, "w") as fh:
            fh.write("\n".join(lines))
        print(f"  -> {path}")


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    edl = json.load(open(os.path.join(HERE, "edl.json")))
    b = Build(edl)
    progs = edl["programs"] if which == "all" else {which: edl["programs"][which]}
    for name, prog in progs.items():
        b.build(name, prog)
        b.write_srt(prog)


if __name__ == "__main__":
    main()
