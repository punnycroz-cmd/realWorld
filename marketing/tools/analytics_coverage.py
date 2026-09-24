#!/usr/bin/env python3
"""Real World — analytics coverage audit (site ↔ spec drift gate).

analytics_validate.py checks captured EVENTS against the spec. This tool is
the complementary static gate: it checks the SITE against the spec without
needing a running browser or sink. It catches drift the moment a page or
emitter changes — before a single event is ever sent.

Checks (site = marketing/site, spec = marketing/analytics-events.json):

  pages     every site/*.html loads js/analytics.js and carries a
            body[data-page] slug that is inside the spec's pageview domain
  attrs     every data-rw-event="..." in HTML names an event in the spec;
            every data-rw-props='...' is valid JSON; prop keys ⊆ the spec's
            prop list for that event; string values inside enumerated
            domains (a|b|c) match the domain
  emitters  every window.rw.track("name", {...}) call in site/js/*.js names
            a spec'd event; literal prop keys ⊆ spec props; literal string
            values within enum domains
  live      every spec event marked LIVE on the site (no `status`, or a
            status containing "LIVE") has at least one emitter somewhere —
            an event nobody emits is a dead metric
  orphans   events the site emits that carry props the spec never declared
            (same check as attrs, reported together)

Warnings (non-fatal): spec events with no emitter but marked PENDING
(game-side contract — expected), data-rw-props values that are clearly
dynamic (checked only when literal).

Usage:
    python3 marketing/tools/analytics_coverage.py
    python3 marketing/tools/analytics_coverage.py --json
    python3 marketing/tools/analytics_coverage.py --site marketing/site \\
        --spec marketing/analytics-events.json

Exit 0 = clean or warnings only, 1 = at least one FAIL.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC_PATH = ROOT / "analytics-events.json"
SITE_PATH = ROOT / "site"

EVENT_ATTR_RE = re.compile(r'data-rw-event="([^"]+)"')
PROPS_ATTR_RE = re.compile(r"data-rw-props='([^']*)'")
DATAPAGE_RE = re.compile(r'data-page="([^"]+)"')
TRACK_RE = re.compile(r'(?:window\.rw\.)?\btrack\(\s*"([^"]+)"\s*(?:,\s*(\{))?', re.S)
PROPKEY_RE = re.compile(r'(?<![\w.])([A-Za-z_][A-Za-z0-9_]*)\s*:')
PROPVAL_RE = re.compile(r'(?<![\w.])([A-Za-z_][A-Za-z0-9_]*)\s*:\s*"([^"]*)"')

ENUM_RE = re.compile(r"[A-Za-z0-9_.\-]+(?:\|[A-Za-z0-9_.\-]+)+")


def enum_domain(desc):
    """Pull an a|b|c domain out of a prop description (same rule as
    analytics_validate.enum_domain)."""
    best = None
    for m in ENUM_RE.finditer(desc or ""):
        if best is None or len(m.group(0)) > len(best):
            best = m.group(0)
    return set(best.split("|")) if best else None


def load_spec(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def page_domain(spec):
    """The pageview spec describes the data-page slug domain in prose."""
    props = spec["events"].get("pageview", {}).get("props", {})
    return enum_domain(props.get("page", "")) or set()


def check_value(findings, loc, name, pk, pv, spec):
    desc = (spec.get("props") or {}).get(pk, "")
    dom = enum_domain(desc)
    if dom and isinstance(pv, str) and pv not in dom:
        findings.append(("FAIL", loc,
                         f"{name}: prop '{pk}' = {pv!r} outside spec domain "
                         f"{sorted(dom)}"))


def check_props(findings, loc, name, props, spec):
    allowed = set(spec.get("props") or {})
    for pk, pv in props.items():
        if pk not in allowed:
            findings.append(("FAIL", loc,
                             f"{name}: prop '{pk}' not declared in spec "
                             f"(allowed: {sorted(allowed) or 'none'})"))
            continue
        check_value(findings, loc, name, pk, pv, spec)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default=str(SITE_PATH))
    ap.add_argument("--spec", default=str(SPEC_PATH))
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    spec = load_spec(args.spec)
    events = spec["events"]
    site = Path(args.site)
    findings = []
    emitted = {}          # event -> [locations]
    pages_seen = {}       # html file -> data-page slug

    # --- HTML pass -----------------------------------------------------------
    html_files = sorted(site.glob("*.html"))
    if not html_files:
        findings.append(("FAIL", str(site), "no *.html found — wrong --site?"))

    for f in html_files:
        text = f.read_text(encoding="utf-8")
        rel = f.name
        if "js/analytics.js" not in text:
            findings.append(("FAIL", rel, "does not load js/analytics.js — "
                                        "pageviews from this page are invisible"))
        m = DATAPAGE_RE.search(text)
        if not m:
            findings.append(("FAIL", rel, "no body[data-page] slug"))
        else:
            pages_seen[rel] = m.group(1)

        for m in EVENT_ATTR_RE.finditer(text):
            name = m.group(1)
            loc = f"{rel}:data-rw-event"
            if name not in events:
                findings.append(("FAIL", loc, f"emits '{name}' — not in "
                                            "analytics-events.json"))
            else:
                emitted.setdefault(name, []).append(rel)

        # pair each props attr with the nearest preceding event attr on the tag
        for tag in re.finditer(r"<[^>]+>", text):
            t = tag.group(0)
            ev = EVENT_ATTR_RE.search(t)
            pm = PROPS_ATTR_RE.search(t)
            if pm and not ev:
                findings.append(("WARN", rel, "data-rw-props without "
                                            "data-rw-event on the same tag"))
                continue
            if ev and pm:
                name = ev.group(1)
                loc = f"{rel}:{name}"
                try:
                    props = json.loads(pm.group(1))
                except ValueError:
                    findings.append(("FAIL", loc, "data-rw-props is not "
                                                f"valid JSON: {pm.group(1)[:60]!r}"))
                    continue
                if not isinstance(props, dict):
                    findings.append(("FAIL", loc, "data-rw-props must be a "
                                                "JSON object"))
                    continue
                if name in events:
                    check_props(findings, loc, name, props, events[name])
                emitted.setdefault(name, []).append(rel)

    # page slugs vs spec domain
    dom = page_domain(spec)
    for rel, slug in sorted(pages_seen.items()):
        if dom and slug not in dom:
            findings.append(("FAIL", rel, f"data-page='{slug}' not in the "
                                        f"spec's pageview domain {sorted(dom)} "
                                        "— add it to analytics-events.json"))
    if dom:
        for slug in sorted(dom - set(pages_seen.values())):
            findings.append(("WARN", "spec", f"pageview domain lists '{slug}' "
                                           "but no page carries it — stale or "
                                           "unshipped page?"))

    # --- JS emitter pass -----------------------------------------------------
    for f in sorted((site / "js").glob("*.js")):
        text = f.read_text(encoding="utf-8")
        for m in TRACK_RE.finditer(text):
            name = m.group(1)
            loc = f"js/{f.name}:{name}"
            emitted.setdefault(name, []).append(f"js/{f.name}")
            if name not in events:
                findings.append(("FAIL", loc, f"emits '{name}' — not in "
                                            "analytics-events.json"))
                continue
            if m.group(2):
                # grab a balanced-ish literal object: up to the closing '})'
                start = m.start(2)
                depth, i = 0, start
                while i < len(text):
                    if text[i] == "{":
                        depth += 1
                    elif text[i] == "}":
                        depth -= 1
                        if depth == 0:
                            break
                    i += 1
                blob = text[start:i + 1]
                # literal prop keys only (identifiers before ':', not after '.')
                for pk in PROPKEY_RE.findall(blob):
                    if pk not in set(events[name].get("props") or {}):
                        findings.append(("FAIL", loc,
                                         f"prop '{pk}' not declared in spec"))
                # literal string values — check against enum domains
                for kv in PROPVAL_RE.finditer(blob):
                    check_value(findings, loc, name, kv.group(1),
                                kv.group(2), events[name])

    # --- LIVE-but-unemitted --------------------------------------------------
    for name, ev in sorted(events.items()):
        status = ev.get("status", "")
        live = "LIVE" in status or not status
        site_side = "game" not in status.lower()  # PENDING game build = skip
        if live and site_side and name not in emitted:
            findings.append(("FAIL", "spec", f"'{name}' is marked live on "
                                           "the site but nothing emits it — "
                                           "wire it or mark it PENDING"))
        if "PENDING" in status and name not in emitted:
            findings.append(("WARN", "spec", f"'{name}' PENDING ({status.split('—')[0].strip()}) "
                                           "— no emitter yet, expected"))

    fails = sum(1 for s, *_ in findings if s == "FAIL")
    warns = sum(1 for s, *_ in findings if s == "WARN")

    if args.json:
        print(json.dumps({
            "pages": len(html_files),
            "events_emitted": sorted(emitted),
            "fail": fails, "warn": warns,
            "findings": [{"sev": s, "at": a, "msg": m} for s, a, m in findings],
        }, indent=2))
    else:
        print(f"# analytics_coverage — {site}")
        print(f"{len(html_files)} pages · {len(emitted)} distinct events "
              f"emitted · {fails} FAIL · {warns} WARN\n")
        for sev, at, msg in findings:
            print(f"[{sev}] {at}: {msg}")
        print("\n" + ("FAIL — site and spec have drifted; fix before trusting "
                      "any capture." if fails else
                      "PASS — every emitted event is in the spec and every "
                      "live spec event has an emitter"
                      + (f" ({warns} warnings)" if warns else "")))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
