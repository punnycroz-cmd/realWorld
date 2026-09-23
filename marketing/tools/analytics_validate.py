#!/usr/bin/env python3
"""Real World — analytics capture validator (spec + privacy lint).

Checks an NDJSON capture (analytics_sink.py format, or any conforming
collector export) against the event spec in marketing/analytics-events.json:

  envelope   v=1 int · site str · event in spec · path str · props obj ·
             sid nonempty str · utm obj (spec keys only) · ref null or
             bare HOST (never a full URL — privacy contract) · ts int
  per-event  props ⊆ the prop names listed in the spec; values checked
             against enumerated domains when the spec describes one
             (e.g. "watch|play", "25|50|75|100")
  privacy    FAIL on PII-shaped prop names (handle/email/ip/user_id…),
             PII-shaped prop values (email address, IPv4), full-URL refs,
             or props on events that must carry none-of-that-kind data

The sink accepts anything and annotates unknown events; this tool is the
hard gate — run it on any capture before trusting a report, and on
exporter output before wiring a new emitter. The privacy contract is
load-bearing (ANALYTICS.md §1): "if an event starts collecting something
personal, it leaves the spec" — this is the check that catches it.

Usage:
    python3 marketing/tools/analytics_validate.py events.ndjson
    python3 marketing/tools/analytics_validate.py events.ndjson --json
    python3 marketing/tools/analytics_validate.py events.ndjson --warn-extra-props

Exit 0 = clean or warnings only, 1 = at least one FAIL.
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

SPEC_PATH = Path(__file__).resolve().parent.parent / "analytics-events.json"

UTM_KEYS = {"utm_source", "utm_medium", "utm_campaign", "utm_content",
            "utm_term", "ref"}

# Prop names that must never appear — the privacy contract in lint form.
PII_NAMES = re.compile(
    r"(email|e-mail|handle|user_?name|full_?name|first_?name|last_?name|"
    r"ip(_?addr|_?address)?|user_?id|uid|device_?id|cookie|token|"
    r"password|phone|address|fingerprint)", re.I)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
IPV4_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")
# A pure enumeration inside a spec description: one token run of a|b|c.
ENUM_RE = re.compile(r"[A-Za-z0-9_.\-]+(?:\|[A-Za-z0-9_.\-]+)+")


def load_spec(path=SPEC_PATH):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def enum_domain(desc):
    """Pull an a|b|c domain out of a prop description, if it states one.

    Longest | -joined token run wins; single tokens or prose without a
    pipe are not domains. Returns a set of strings or None.
    """
    best = None
    for m in ENUM_RE.finditer(desc or ""):
        if best is None or len(m.group(0)) > len(best):
            best = m.group(0)
    return set(best.split("|")) if best else None


def check_event(evt, spec_events, strict_props, findings, line_no):
    loc = f"line {line_no}"
    if not isinstance(evt, dict):
        findings.append(("FAIL", loc, "not a JSON object"))
        return

    v = evt.get("v")
    if v != 1 or not isinstance(v, int):
        findings.append(("FAIL", loc, f"v must be int 1, got {v!r}"))
    if not isinstance(evt.get("site"), str) or not evt["site"]:
        findings.append(("FAIL", loc, "site missing/not a string"))
    name = evt.get("event")
    if not isinstance(name, str):
        findings.append(("FAIL", loc, "event missing/not a string"))
        return
    spec = spec_events.get(name)
    if spec is None:
        findings.append(("FAIL", loc, f"unknown event '{name}' — not in "
                                    "analytics-events.json"))
        spec = {"props": {}}
    if not isinstance(evt.get("path"), str):
        findings.append(("FAIL", loc, f"{name}: path missing/not a string"))
    if not isinstance(evt.get("props"), dict):
        findings.append(("FAIL", loc, f"{name}: props missing/not an object"))
        return
    sid = evt.get("sid")
    if not isinstance(sid, str) or not sid:
        findings.append(("FAIL", loc, f"{name}: sid missing — sessions are "
                                    "anonymous but not optional"))
    if not isinstance(evt.get("ts"), int):
        findings.append(("WARN", loc, f"{name}: ts not an int ({evt.get('ts')!r})"))

    ref = evt.get("ref")
    if ref is not None:
        if not isinstance(ref, str):
            findings.append(("FAIL", loc, f"{name}: ref must be string|null"))
        elif "/" in ref or "?" in ref or "@" in ref:
            findings.append(("FAIL", loc, f"{name}: ref '{ref}' is a URL, "
                                          "not a bare host — privacy contract "
                                          "is referrer HOST only"))
    utm = evt.get("utm")
    if utm is not None:
        if not isinstance(utm, dict):
            findings.append(("FAIL", loc, f"{name}: utm not an object"))
        else:
            for k in utm:
                if k not in UTM_KEYS:
                    findings.append(("FAIL", loc, f"{name}: utm.{k} is not a "
                                                  f"spec'd key {sorted(UTM_KEYS)}"))
                elif PII_NAMES.search(str(utm[k])) or EMAIL_RE.match(str(utm[k])):
                    findings.append(("FAIL", loc, f"{name}: utm.{k} value looks "
                                                  "like PII — no PII in utm values"))

    allowed = set(spec.get("props") or {})
    for pk, pv in evt["props"].items():
        if PII_NAMES.search(pk):
            findings.append(("FAIL", loc, f"{name}: prop name '{pk}' matches "
                                          "the PII denylist"))
        if pk not in allowed:
            sev = "FAIL" if strict_props else "WARN"
            findings.append((sev, loc, f"{name}: prop '{pk}' not in spec "
                                       f"(allowed: {sorted(allowed) or 'none'})"))
            continue
        if isinstance(pv, str):
            if EMAIL_RE.match(pv) or IPV4_RE.match(pv):
                findings.append(("FAIL", loc, f"{name}: prop '{pk}' value looks "
                                              f"like PII ({pv[:24]}…)"))
            dom = enum_domain(spec["props"][pk])
            if dom and pv not in dom:
                findings.append(("WARN", loc, f"{name}: prop '{pk}' = {pv!r} "
                                              f"outside spec domain {sorted(dom)}"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ndjson", help="event capture file (NDJSON)")
    ap.add_argument("--spec", default=str(SPEC_PATH),
                    help="event spec JSON (default: marketing/analytics-events.json)")
    ap.add_argument("--warn-extra-props", action="store_true",
                    help="downgrade unknown-prop findings from FAIL to WARN")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()

    spec_events = load_spec(args.spec)["events"]
    findings = []
    counts = Counter()
    n = 0
    with open(args.ndjson, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            n += 1
            try:
                evt = json.loads(line)
            except ValueError:
                findings.append(("FAIL", f"line {i}", "not valid JSON"))
                continue
            counts[evt.get("event") if isinstance(evt, dict) else "?"] += 1
            check_event(evt, spec_events, not args.warn_extra_props,
                        findings, i)

    fails = sum(1 for s, *_ in findings if s == "FAIL")
    warns = sum(1 for s, *_ in findings if s == "WARN")

    if args.json:
        print(json.dumps({
            "events": n, "fail": fails, "warn": warns,
            "by_event": dict(counts),
            "findings": [{"sev": s, "at": a, "msg": m} for s, a, m in findings],
        }, indent=2))
    else:
        print(f"# analytics_validate — {args.ndjson}")
        print(f"{n} events checked · {fails} FAIL · {warns} WARN\n")
        for sev, at, msg in findings[:200]:
            print(f"[{sev}] {at}: {msg}")
        if len(findings) > 200:
            print(f"… {len(findings) - 200} more findings")
        print("\n" + ("FAIL — capture violates the spec; do not report on it."
                      if fails else
                      "PASS — capture conforms to analytics-events.json"
                      + (f" ({warns} warnings)" if warns else "")))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
