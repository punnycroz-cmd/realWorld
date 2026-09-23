#!/usr/bin/env python3
"""seo_audit.py — static on-page SEO audit for the Real World marketing site.

Zero-dependency, offline, reads site/*.html directly (no server needed).
Goes deeper than staging_dryrun.sh: title/description LENGTHS, single-H1,
canonical/OG/Twitter completeness, JSON-LD parse + @type inventory, image
alt coverage + file-weight budget, internal-link targets, orphan pages,
weak anchor text, sitemap parity both directions.

Usage:  ./tools/seo_audit.py            (from marketing/ or repo root)
Exit:   0 = no FAILs (WARNs allowed), 1 = any FAIL, 2 = misuse.
"""
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
PLACEHOLDER_DOMAIN = "realworld-game.example"

TITLE_MAX = 60          # SERP truncation ~580px / ~60 chars
DESC_MAX = 155          # meta description truncation
DESC_MIN = 70           # below this it's usually snippet-thin
IMG_WARN_BYTES = 1_500_000  # >1.5MB raster is a performance flag
BAD_ANCHOR = {"click here", "here", "read more", "link", "this", "learn more"}
NOINDEX_PAGES = {"404.html"}  # pages excluded from sitemap/orphan checks

PASS = 0
WARN = 0
FAIL = 0


def ok(msg):
    global PASS
    PASS += 1
    print(f"  PASS  {msg}")


def warn(msg):
    global WARN
    WARN += 1
    print(f"  WARN  {msg}")


def bad(msg):
    global FAIL
    FAIL += 1
    print(f"  FAIL  {msg}")


class PageParser(HTMLParser):
    """Collects the SEO-relevant surface of one HTML file."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self._in_title = False
        self.h1_count = 0
        self._in_h1 = False
        self.meta_desc = None
        self.canonical = None
        self.lang = None
        self.viewport = None
        self.og = {}            # property -> content
        self.twitter = {}       # name -> content
        self.imgs = []          # (src, alt_or_None, attrs_dict)
        self.srcsets = []       # srcset strings from <source>/<img>
        self.links = []         # (href, anchor_text)
        self._link_href = None  # current open <a>
        self._link_text = []
        self.jsonld_raw = []    # list of script bodies
        self._in_jsonld = False
        self._jsonld_buf = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title":
            self._in_title = True
        elif tag == "h1":
            self.h1_count += 1
            self._in_h1 = True
        elif tag == "meta":
            if a.get("name") == "description":
                self.meta_desc = a.get("content", "")
            elif a.get("name") == "viewport":
                self.viewport = a.get("content", "")
            elif a.get("property", "").startswith("og:"):
                self.og[a["property"]] = a.get("content", "")
            elif a.get("name", "").startswith("twitter:"):
                self.twitter[a["name"]] = a.get("content", "")
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        elif tag == "img":
            self.imgs.append((a.get("src", ""), a.get("alt"), a))
            if a.get("srcset"):
                self.srcsets.append(a["srcset"])
        elif tag == "source" and a.get("srcset"):
            self.srcsets.append(a["srcset"])
        elif tag == "a" and a.get("href"):
            self._link_href = a["href"]
            self._link_text = []
        elif tag == "script" and a.get("type") == "application/ld+json":
            self._in_jsonld = True
            self._jsonld_buf = []

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False
        elif tag == "a" and self._link_href is not None:
            self.links.append((self._link_href, " ".join("".join(self._link_text).split())))
            self._link_href = None
        elif tag == "script" and self._in_jsonld:
            self.jsonld_raw.append("".join(self._jsonld_buf))
            self._in_jsonld = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._link_href is not None:
            self._link_text.append(data)
        if self._in_jsonld:
            self._jsonld_buf.append(data)


def audit_page(fname, html):
    """Returns (link_targets:set[str], jsonld_types:set[str]) for cross-page checks."""
    p = PageParser()
    p.feed(html)
    label = fname if fname != "index.html" else "index (/)"

    # --- head essentials ---
    title = p.title.strip()
    if not title:
        bad(f"{label}: missing <title>")
    elif len(title) > TITLE_MAX:
        bad(f"{label}: title {len(title)} chars (> {TITLE_MAX}) — truncates in SERP: {title[:50]}…")
    else:
        ok(f"{label}: title {len(title)} chars")

    if p.meta_desc is None:
        bad(f"{label}: missing meta description")
    else:
        d = len(p.meta_desc)
        if d > DESC_MAX:
            bad(f"{label}: meta description {d} chars (> {DESC_MAX})")
        elif d < DESC_MIN:
            warn(f"{label}: meta description thin ({d} chars) — snippet may undersell")
        else:
            ok(f"{label}: meta description {d} chars")

    if p.h1_count == 0:
        bad(f"{label}: no <h1>")
    elif p.h1_count > 1:
        bad(f"{label}: {p.h1_count} <h1> elements (must be exactly 1)")
    else:
        ok(f"{label}: exactly one h1")

    if fname not in NOINDEX_PAGES:
        if not p.canonical:
            bad(f"{label}: missing canonical link")
        elif PLACEHOLDER_DOMAIN in p.canonical:
            warn(f"{label}: canonical on placeholder domain (expected pre-launch)")
        else:
            ok(f"{label}: canonical set")
    if not p.lang:
        bad(f"{label}: <html> missing lang")
    if not p.viewport:
        bad(f"{label}: missing viewport meta")

    # --- social cards ---
    if fname not in NOINDEX_PAGES:
        for prop in ("og:title", "og:description", "og:image"):
            if prop not in p.og:
                bad(f"{label}: missing {prop}")
        if "twitter:card" not in p.twitter:
            bad(f"{label}: missing twitter:card")

    # --- JSON-LD ---
    types = set()
    for blob in p.jsonld_raw:
        try:
            data = json.loads(blob)
        except json.JSONDecodeError as e:
            bad(f"{label}: JSON-LD does not parse — {e}")
            continue
        t = data.get("@type")
        types.add(t)
        if t == "FAQPage":
            # every visible <summary> phrased as a question should have a
            # schema twin — non-question disclosures (tables, notes) are exempt
            visible = re.findall(r"<summary>(.*?)</summary>", html, re.S)
            schema_qs = {e.get("name") for e in data.get("mainEntity", [])}
            for q in visible:
                q_clean = re.sub(r"<[^>]+>", "", q).strip()
                if not q_clean.endswith("?"):
                    continue
                if q_clean not in schema_qs:
                    bad(f"{label}: visible FAQ '{q_clean[:50]}' missing from FAQPage schema")
            for q in schema_qs:
                if not any(q in re.sub(r"<[^>]+>", "", v) for v in visible):
                    bad(f"{label}: schema FAQ '{q[:50]}' has no visible <details> twin")
        if t == "VideoGame" and not data.get("screenshot"):
            warn(f"{label}: VideoGame schema has no screenshot[] — free rich-result asset")
    if p.jsonld_raw:
        ok(f"{label}: {len(p.jsonld_raw)} JSON-LD block(s) parse — {sorted(t for t in types if t)}")

    # --- images: alt + weight + dimensions + srcset resolution ---
    no_alt = [s for s, a, _ in p.imgs if a is None]
    if no_alt:
        bad(f"{label}: {len(no_alt)} <img> missing alt attribute: {no_alt[:3]}")
    elif p.imgs:
        ok(f"{label}: all {len(p.imgs)} images carry alt")
    no_dims = [s for s, _, a in p.imgs if "width" not in a or "height" not in a]
    if no_dims:
        warn(f"{label}: {len(no_dims)} <img> missing width/height (CLS risk): {no_dims[:3]}")
    raster_refs = [s for s, _, _ in p.imgs]
    for ss in p.srcsets:
        # "a.webp 1x, b.webp 2x" or bare "a.webp" — take the URL part of each candidate
        raster_refs += [c.strip().split(" ")[0] for c in ss.split(",") if c.strip()]
    for src in raster_refs:
        if not src or src.startswith(("http", "//", "data:")):
            continue
        fpath = os.path.join(SITE, src.split("#")[0].split("?")[0])
        if os.path.exists(fpath):
            size = os.path.getsize(fpath)
            if size > IMG_WARN_BYTES and not src.endswith(".webp"):
                warn(f"{label}: {src} is {size/1e6:.1f}MB raster (>{IMG_WARN_BYTES//1e6}MB budget)")
        else:
            bad(f"{label}: image target missing on disk: {src}")

    # --- og:image resolves to a real file (once domain is stripped) ---
    ogimg = p.og.get("og:image", "")
    if ogimg:
        if PLACEHOLDER_DOMAIN in ogimg:
            ogrel = ogimg.split(PLACEHOLDER_DOMAIN, 1)[1].lstrip("/")
            if not os.path.exists(os.path.join(SITE, ogrel)):
                bad(f"{label}: og:image file missing on disk: {ogrel}")
        elif ogimg.startswith(("http", "//")):
            pass  # real domain post-launch — validated by prod_smoke instead
        elif not os.path.exists(os.path.join(SITE, ogimg)):
            bad(f"{label}: og:image file missing on disk: {ogimg}")

    # --- anchors ---
    for href, text in p.links:
        if text.strip().lower() in BAD_ANCHOR:
            warn(f"{label}: weak anchor text '{text}' → {href}")

    link_targets = set()
    for href, _ in p.links:
        h = href.split("#")[0].split("?")[0]
        if not h or h.startswith(("http", "//", "mailto:", "tel:")):
            continue
        if h.endswith(".html"):
            link_targets.add(h)
            if not os.path.exists(os.path.join(SITE, h)):
                bad(f"{label}: internal link target missing: {href}")
    return link_targets, types, title, (p.meta_desc or "")


def main():
    if not os.path.isdir(SITE):
        print(f"FATAL: {SITE} not found — run from marketing/ or repo root", file=sys.stderr)
        return 2

    pages = sorted(f for f in os.listdir(SITE) if f.endswith(".html"))
    print(f"=== Real World SEO audit — {len(pages)} pages in {SITE} ===")

    inbound = {p: set() for p in pages}
    all_types = set()
    titles = {}
    descs = {}
    faq_schema_count = 0
    for fname in pages:
        with open(os.path.join(SITE, fname), encoding="utf-8") as fh:
            html = fh.read()
        targets, types, title, desc = audit_page(fname, html)
        all_types |= types
        titles[fname] = title
        descs[fname] = desc
        if "FAQPage" in types and fname == "faq.html":
            for blob in re.findall(
                    r'<script type="application/ld\+json">(.*?)</script>',
                    html, re.S):
                try:
                    d = json.loads(blob)
                except json.JSONDecodeError:
                    continue
                if d.get("@type") == "FAQPage":
                    faq_schema_count += len(d.get("mainEntity", []))
        for t in targets:
            if t in inbound and t != fname:
                inbound[t].add(fname)

    # --- duplicate titles / descriptions (SERP cannibalization tell) ---
    for pool, label in ((titles, "title"), (descs, "meta description")):
        seen = {}
        for fname, val in pool.items():
            v = val.strip()
            if not v:
                continue
            if v in seen:
                bad(f"duplicate {label} on {seen[v]} and {fname}: '{v[:50]}…'")
            else:
                seen[v] = fname
    ok("title/description uniqueness checked")

    # --- orphan check (404 is intentionally unlinked) ---
    print("[cross-page] internal-link graph")
    for fname in pages:
        if fname in NOINDEX_PAGES:
            continue
        if not inbound[fname]:
            bad(f"orphan page: no other page links to {fname}")
    ok("orphan scan done")

    # --- sitemap parity, both directions ---
    sitemap = os.path.join(SITE, "sitemap.xml")
    if not os.path.exists(sitemap):
        bad("sitemap.xml missing")
    else:
        sm = open(sitemap, encoding="utf-8").read()
        locs = re.findall(r"<loc>([^<]+)</loc>", sm)
        locs = [l for l in locs if "/shots/" not in l]  # image:locs share the tag
        for fname in pages:
            if fname in NOINDEX_PAGES:
                continue
            needle = "/" if fname == "index.html" else f"/{fname}"
            if not any(l.endswith(needle) for l in locs):
                bad(f"{fname} absent from sitemap.xml")
        for l in locs:
            path = l.rsplit("/", 1)[-1] or "index.html"
            if path == "index.html" or path.endswith(".html"):
                if not os.path.exists(os.path.join(SITE, path)):
                    bad(f"sitemap loc has no file: {l}")
        # image entries resolve?
        for img in re.findall(r"<image:loc>([^<]+)</image:loc>", sm):
            f = os.path.join(SITE, img.rsplit("/", 1)[-1])
            if not os.path.exists(os.path.join(SITE, "shots", img.rsplit("/", 1)[-1])):
                bad(f"sitemap image missing on disk: {img}")
        # lastmod sanity — real dates, never future-dated
        import datetime
        today = datetime.date.today()
        for lm in re.findall(r"<lastmod>([^<]+)</lastmod>", sm):
            try:
                d = datetime.date.fromisoformat(lm.strip())
            except ValueError:
                bad(f"sitemap lastmod not ISO date: {lm}")
                continue
            if d > today:
                bad(f"sitemap lastmod in the future: {lm}")
        ok("sitemap ↔ filesystem parity checked")

    # --- llms.txt (AI answer engines) ---
    llms_path = os.path.join(SITE, "llms.txt")
    if os.path.exists(llms_path):
        ok("llms.txt present")
        llms = open(llms_path, encoding="utf-8").read()
        # every markdown link target must resolve to a real page
        for target in re.findall(r"\]\(([^)]+)\)", llms):
            if target.startswith(("http", "//", "mailto:")):
                continue
            if not os.path.exists(os.path.join(SITE, target.split("#")[0])):
                bad(f"llms.txt links to missing file: {target}")
        # any "N questions" claim must match the live FAQPage count
        for m in re.findall(r"(\d+)\s+questions", llms):
            if faq_schema_count and int(m) != faq_schema_count:
                bad(f"llms.txt claims {m} questions; FAQPage schema has {faq_schema_count}")
        ok("llms.txt links + FAQ count checked")
    else:
        warn("llms.txt missing — AI answer engines get no entity briefing")

    print()
    print(f"=== SEO AUDIT: {PASS} pass / {WARN} warn / {FAIL} fail ===")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
