#!/usr/bin/env python3
"""Real World — local analytics report generator.

Reads NDJSON captured by tools/analytics_sink.py (or any conforming
collector) and prints the markdown metrics block defined in
ANALYTICS.md §8 plus a fuller breakdown matching the §7 dashboard spec.

Everything is computed locally from the event file — no network, no DB.

Usage:
    python3 marketing/tools/analytics_report.py events.ndjson
    python3 marketing/tools/analytics_report.py events.ndjson --week 2026-W39
    python3 marketing/tools/analytics_report.py events.ndjson --json

Funnel stages (from analytics-events.json):
    visit(pageview) → engaged(cta_click/scroll_depth/screenshot_view)
      → press(press_kit_download) / community(community_join/recap_open)
      / watch(watch_start) → request(request_submitted) → create(character_created)
Session-joined on `sid` (a per-tab nonce — NOT a visitor id; treat
"uniques" here as session counts. True daily-unique counting is the
server-side salted-hash job described in ANALYTICS.md §1).
"""
import argparse
import json
import sys
from collections import Counter, defaultdict

FUNNEL = ["pageview", "engaged", "community", "watch_start", "request_submitted", "character_created"]
ENGAGED_EVENTS = {"cta_click", "scroll_depth", "screenshot_view", "share_click",
                  "price_calc", "request_simulated"}
COMMUNITY_EVENTS = {"community_join", "recap_open", "watch_party_rsvp"}


def load(path):
    evts = []
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                evts.append(json.loads(line))
            except ValueError:
                print(f"# warn: line {i} not JSON, skipped", file=sys.stderr)
    return evts


def stage_of(evt):
    name = evt.get("event")
    if name == "pageview":
        return "pageview"
    if name in ENGAGED_EVENTS:
        return "engaged"
    if name in COMMUNITY_EVENTS:
        return "community"
    return name


def report(evts, week=None):
    sessions = defaultdict(set)           # sid -> set of stages reached
    sids = set()
    pageviews = Counter()
    pages = Counter()
    sources = Counter()
    campaigns = Counter()
    refs = Counter()
    shots = Counter()
    ctas = Counter()
    outbound = Counter()
    notfound = Counter()
    engaged_secs = defaultdict(int)
    scroll_marks = Counter()
    shares = Counter()
    calc_uses = Counter()
    calc_mins = []
    sim_uses = Counter()
    onboard = Counter()
    tour_skip_beats = Counter()
    personas = Counter()
    events_total = Counter()

    for e in evts:
        name = e.get("event") or "?"
        events_total[name] += 1
        sid = e.get("sid")
        if sid:
            sids.add(sid)
            sessions[sid].add(stage_of(e))
        path = e.get("path") or ""
        props = e.get("props") or {}
        utm = e.get("utm") or {}

        if name == "pageview":
            pageviews[path] += 1
            pages[props.get("page") or path or "?"] += 1
            if props.get("page") == "404" or path.endswith("404.html"):
                notfound[path] += 1
            if utm.get("utm_source"):
                sources[utm["utm_source"]] += 1
            if utm.get("utm_campaign"):
                campaigns[utm["utm_campaign"]] += 1
            if e.get("ref"):
                refs[e["ref"]] += 1
        elif name == "cta_click":
            ctas[props.get("cta") or "?"] += 1
        elif name == "screenshot_view":
            shots[(props.get("shot") or "?").split("/")[-1]] += 1
        elif name == "outbound_click":
            outbound[props.get("href") or "?"] += 1
        elif name == "scroll_depth":
            scroll_marks[props.get("depth")] += 1
        elif name == "engaged_time":
            engaged_secs[props.get("page") or path or "?"] += int(props.get("seconds") or 0)
        elif name == "share_click":
            shares[props.get("method") or "?"] += 1
        elif name == "price_calc":
            key = props.get("class") or "?"
            if props.get("queued"):
                key += "+queued"
            if props.get("surge"):
                key += "+surge"
            calc_uses[key] += 1
            if props.get("minutes"):
                calc_mins.append(int(props["minutes"]))
        elif name == "request_simulated":
            sim_uses[f'{props.get("action") or "?"}/{props.get("class") or "?"}'] += 1
        elif name in ("tour_started", "tour_beat", "tour_completed", "tour_skipped",
                      "handle_set", "wallet_explained", "topup_shown",
                      "first_request_filed", "onboard_dismissed",
                      "persona_chosen", "handle_taken_shown",
                      "decline_lesson_shown", "returning_session"):
            onboard[name] += 1
            if name == "tour_skipped":
                tour_skip_beats[props.get("at_beat", "?")] += 1
            if name == "persona_chosen":
                personas[props.get("persona") or "?"] += 1

    def reached(stage):
        return sum(1 for st in sessions.values() if stage in st)

    n_visit = reached("pageview")
    funnel_rows = []
    prev = None
    for stage in FUNNEL:
        n = reached(stage)
        pct = f"{100 * n / prev:.0f}%" if prev else "—"
        funnel_rows.append((stage, n, pct))
        prev = n

    def pct_bar(n, total):
        return f"{100 * n / total:.0f}%" if total else "—"

    out = []
    out.append(f"## metrics — week {week or '{{ISO week}}'}")
    out.append(f"- sessions: {len(sids)} · pageviews: {sum(pageviews.values())} "
               f"· events: {sum(events_total.values())}")
    if sources:
        out.append("- top sources: " + ", ".join(f"{s} ({n})" for s, n in sources.most_common(3)))
    else:
        out.append("- top sources: none tagged (direct/untagged traffic)")
    if campaigns:
        out.append("- campaigns: " + ", ".join(f"{c} ({n})" for c, n in campaigns.most_common(5)))
    funnel_str = " → ".join(f"{s} {n} ({pct_bar(n, n_visit)} of visits)" for s, n, _ in funnel_rows)
    out.append(f"- funnel: {funnel_str}")
    if shots:
        out.append("- top shots: " + ", ".join(f"{s} ({n})" for s, n in shots.most_common(3)))
    out.append(f"- 404s: {sum(notfound.values())}"
               + (f" (worst path: {notfound.most_common(1)[0][0]})" if notfound else ""))
    out.append("- action taken: {{one line — what we changed because of the numbers}}")
    out.append("")

    out.append("### detail")
    out.append("")
    out.append("| stage | sessions | vs prev |")
    out.append("|---|---|---|")
    for stage, n, pct in funnel_rows:
        out.append(f"| {stage} | {n} | {pct} |")
    out.append("")
    if pages:
        out.append("**pageviews by page:** " + ", ".join(f"{p} ({n})" for p, n in pages.most_common()))
        out.append("")
    if ctas:
        out.append("**cta_click by slot:** " + ", ".join(f"{c} ({n})" for c, n in ctas.most_common()))
        out.append("")
    if scroll_marks:
        total = sum(scroll_marks.values())
        out.append("**scroll depth reach:** " + ", ".join(
            f"≥{m}%: {scroll_marks[m]}" for m in sorted(scroll_marks)) + f" (of {total} marks)")
        out.append("")
    if engaged_secs:
        out.append("**engaged seconds by page:** " + ", ".join(
            f"{p}: {s}s" for p, s in sorted(engaged_secs.items(), key=lambda kv: -kv[1])))
        out.append("")
    if shares:
        out.append("**shares by method:** " + ", ".join(f"{m} ({n})" for m, n in shares.most_common()))
        out.append("")
    if calc_uses:
        avg_min = f"{sum(calc_mins) / len(calc_mins):.0f} min" if calc_mins else "—"
        out.append("**price estimator uses:** " + ", ".join(
            f"{k} ({n})" for k, n in calc_uses.most_common())
            + f" — avg {avg_min} priced per use")
        out.append("")
    if sim_uses:
        out.append("**request simulator (action/class):** " + ", ".join(
            f"{k} ({n})" for k, n in sim_uses.most_common()))
        out.append("")
    if onboard:
        out.append("**onboarding (world-v11/v25 hooks, game-side):** " + ", ".join(
            f"{k}: {v}" for k, v in sorted(onboard.items())))
        if personas:
            out.append("  persona split: " + ", ".join(
                f"{p} ({n})" for p, n in personas.most_common()))
        if tour_skip_beats:
            out.append("  tour_skipped at beat: " + ", ".join(
                f"{b} ×{n}" for b, n in sorted(tour_skip_beats.items())))
        out.append("")
    if refs:
        out.append("**referrer hosts:** " + ", ".join(f"{r} ({n})" for r, n in refs.most_common(8)))
        out.append("")
    if outbound:
        out.append("**outbound targets:** " + ", ".join(f"{h} ({n})" for h, n in outbound.most_common(8)))
        out.append("")
    out.append("**raw event counts:** " + ", ".join(f"{k}: {v}" for k, v in events_total.most_common()))
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ndjson", help="event file written by analytics_sink.py")
    ap.add_argument("--week", default=None, help="ISO week label for the report header")
    ap.add_argument("--json", action="store_true", help="dump raw aggregates instead of markdown")
    args = ap.parse_args()
    evts = load(args.ndjson)
    if args.json:
        from collections import Counter as C
        print(json.dumps({"events": len(evts),
                          "by_event": dict(C(e.get("event") for e in evts)),
                          "sessions": len({e.get("sid") for e in evts if e.get("sid")})},
                         indent=2, sort_keys=True))
        return
    print(report(evts, args.week))


if __name__ == "__main__":
    main()
