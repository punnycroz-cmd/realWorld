#!/usr/bin/env python3
"""Launch-day live analytics monitor — tails the capture file in real time.

Every other tool in the stack is batch: analytics_report grades a finished
capture, analytics_watch diffs two weeks, analytics_history trends a season.
This one is for the war room on day-0: point it at the NDJSON file the sink
is appending to and it prints a refreshing console readout — rolling rates,
live funnel, top referrers, 404 radar, and WARN lines the moment something
drifts.

    python3 tools/analytics_live.py /tmp/rw-events.ndjson              # watch
    python3 tools/analytics_live.py capture.ndjson --once              # snapshot
    python3 tools/analytics_live.py capture.ndjson --once --strict     # exit 1 on WARN
    python3 tools/analytics_live.py capture.ndjson --json              # machine-readable

The file is tailed incrementally (seek-offset), so it is cheap to run for
hours. If the file shrinks (rotation/truncation) state resets automatically.

Alert rules (all thresholds flaggable):
  spec-drift   — an event name arrived that analytics-events.json doesn't know
  404-spike    — 404 pageviews exceed --notfound-pct of window pageviews
  funnel-stall — window has >= --stall-sessions sessions but zero watch_start
  malformed    — lines that aren't JSON are counted, never crash the monitor

LOCAL ONLY. Reads files, binds no ports, sends nothing anywhere.
"""
import argparse
import json
import sys
import time
from collections import Counter, deque
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
try:
    from analytics_report import stage_of, FUNNEL
except ImportError:  # fallback if the file was copied standalone
    FUNNEL = ["pageview", "engaged", "community", "watch_start",
              "request_submitted", "character_created"]
    _ENG = {"cta_click", "scroll_depth", "screenshot_view", "share_click",
            "price_calc", "scene_calc", "sub_calc", "request_simulated"}
    _COM = {"community_join", "recap_open", "watch_party_rsvp"}

    def stage_of(evt):
        n = evt.get("event")
        if n == "pageview":
            return "pageview"
        if n in _ENG:
            return "engaged"
        if n in _COM:
            return "community"
        return n

SPEC = HERE.parent / "analytics-events.json"


def known_events():
    try:
        return set(json.loads(SPEC.read_text(encoding="utf-8")).get("events", {}))
    except Exception:
        return None  # no spec -> drift check disabled


def pct(n, d):
    return f"{100 * n / d:.1f}%" if d else "—"


class Tailer:
    """Incremental NDJSON reader with per-event window + all-time aggregates."""

    def __init__(self, path, window_s):
        self.path = Path(path)
        self.window_ms = window_s * 1000
        self.reset()

    def reset(self):
        self.offset = 0
        self.total = 0
        self.malformed = 0
        self.events = Counter()
        self.sessions = set()
        self.stage_by_sid = {}
        self.unknown = Counter()
        self.window = deque()          # (ts, name, sid, ref, utm_src, is404)
        self.first_ts = None
        self.last_ts = None

    def poll(self, spec_names):
        """Read newly appended lines; returns count consumed this round."""
        try:
            size = self.path.stat().st_size
        except FileNotFoundError:
            return 0
        if size < self.offset:           # rotated/truncated -> start over
            self.reset()
        n = 0
        with open(self.path, encoding="utf-8") as f:
            f.seek(self.offset)
            for line in f:
                line = line.strip()
                if not line:
                    continue
                n += 1
                self.total += 1
                try:
                    e = json.loads(line)
                except ValueError:
                    self.malformed += 1
                    continue
                name = e.get("event") or "?"
                ts = int(e.get("ts") or 0)
                sid = e.get("sid")
                props = e.get("props") or {}
                is404 = (name == "pageview" and
                         (props.get("page") == "404" or
                          str(e.get("path") or "").endswith("404.html")))
                self.events[name] += 1
                if spec_names is not None and name not in spec_names:
                    self.unknown[name] += 1
                if sid:
                    self.sessions.add(sid)
                    self.stage_by_sid.setdefault(sid, set()).add(stage_of(e))
                self.first_ts = ts if self.first_ts is None else min(self.first_ts, ts)
                self.last_ts = max(self.last_ts or 0, ts)
                self.window.append((ts, name, sid, e.get("ref"),
                                    (e.get("utm") or {}).get("utm_source"), is404,
                                    e.get("path")))
            self.offset = f.tell()
        return n


def snapshot(t, now_ms, stall_sessions, notfound_pct, target_sessions):
    cutoff = now_ms - t.window_ms
    while t.window and t.window[0][0] < cutoff:
        t.window.popleft()
    win = list(t.window)
    w_sids = {x[2] for x in win if x[2]}
    w_names = Counter(n for _, n, *_ in win)
    w_pv = w_names.get("pageview", 0)
    w_404_paths = Counter(x[6] for x in win if x[5])
    refs = Counter(x[3] for x in win if x[3])
    utm = Counter(x[4] for x in win if x[4])
    w_watch = sum(1 for x in win if x[1] == "watch_start")

    stages = {st: sum(1 for s in t.stage_by_sid.values() if st in s)
              for st in FUNNEL}
    span_ms = max((t.last_ts - t.first_ts), 1) if t.first_ts is not None else 0
    pace_sessions_wk = (len(t.sessions) / (span_ms / (7 * 24 * 3600 * 1000))
                        if span_ms else 0)

    alerts = []
    if t.unknown:
        alerts.append(f"spec-drift: unknown event names seen: "
                      + ", ".join(f"{k}×{v}" for k, v in t.unknown.most_common()))
    share404 = (sum(w_404_paths.values()) / w_pv) if w_pv else 0
    if w_pv and 100 * share404 > notfound_pct:
        alerts.append(f"404-spike: {100 * share404:.1f}% of window pageviews "
                      f"(>{notfound_pct}%) — worst: {w_404_paths.most_common(3)}")
    if len(w_sids) >= stall_sessions and w_watch == 0:
        alerts.append(f"funnel-stall: {len(w_sids)} sessions in window, "
                      "zero watch_start — check the demo/embed")
    if t.malformed:
        alerts.append(f"malformed: {t.malformed} non-JSON line(s) in capture")

    return {
        "now": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "totals": {"events": t.total, "sessions": len(t.sessions),
                   "malformed": t.malformed,
                   "span_min": round(span_ms / 60000, 1)},
        "window": {"events": len(win), "sessions": len(w_sids),
                   "per_min": round(len(win) / max(t.window_ms / 60000, 1), 2),
                   "top_events": w_names.most_common(6),
                   "refs": refs.most_common(5), "utm": utm.most_common(5),
                   "404_paths": w_404_paths.most_common(5)},
        "funnel": stages,
        "pace": {"sessions_per_wk_projected": round(pace_sessions_wk, 1),
                 "target_sessions_wk": target_sessions,
                 "on_pace": (pace_sessions_wk >= target_sessions
                            if target_sessions else None)},
        "alerts": alerts,
    }


def render(s, window_s):
    w = s["window"]
    lines = [f"== real world · live analytics == {s['now']}Z  (window {window_s}s)",
             f"capture: {s['totals']['events']} events · "
             f"{s['totals']['sessions']} sessions · span {s['totals']['span_min']}m"
             + (f" · {s['totals']['malformed']} malformed"
                if s["totals"]["malformed"] else ""),
             f"window : {w['events']} events ({w['per_min']}/min) · "
             f"{w['sessions']} sessions · 404s {sum(n for _, n in w['404_paths'])}",
             "funnel : " + " → ".join(f"{k} {v}" for k, v in s["funnel"].items())]
    if w["top_events"]:
        lines.append("events : " + ", ".join(f"{k}×{v}" for k, v in w["top_events"]))
    if w["refs"]:
        lines.append("refs   : " + ", ".join(f"{k}×{v}" for k, v in w["refs"]))
    if w["utm"]:
        lines.append("utm    : " + ", ".join(f"{k}×{v}" for k, v in w["utm"]))
    if w["404_paths"]:
        lines.append("404s   : " + ", ".join(f"{k}×{v}" for k, v in w["404_paths"]))
    p = s["pace"]
    if p["target_sessions_wk"]:
        flag = "ON-PACE" if p["on_pace"] else "BEHIND"
        lines.append(f"pace   : {p['sessions_per_wk_projected']}/wk projected vs "
                     f"{p['target_sessions_wk']} target — {flag}")
    lines.append("alerts : " + ("none" if not s["alerts"] else ""))
    lines += ["  WARN " + a for a in s["alerts"]]
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ndjson", help="capture file the sink is appending to")
    ap.add_argument("--once", action="store_true", help="print one snapshot and exit")
    ap.add_argument("--interval", type=float, default=5,
                    help="seconds between refreshes in watch mode (default 5)")
    ap.add_argument("--window", type=int, default=900,
                    help="rolling window in seconds (default 900 = 15 min)")
    ap.add_argument("--stall-sessions", type=int, default=10,
                    help="window sessions needed before a zero-watch WARN fires")
    ap.add_argument("--notfound-pct", type=float, default=2.0,
                    help="404 share of window pageviews that triggers a WARN")
    ap.add_argument("--target-sessions", type=int, default=0,
                    help="optional weekly session goal — enables the pace line")
    ap.add_argument("--json", action="store_true",
                    help="emit the snapshot as JSON instead of the console block")
    ap.add_argument("--strict", action="store_true",
                    help="with --once/--json: exit 1 if any alert is firing")
    ap.add_argument("--no-clear", action="store_true",
                    help="watch mode: append blocks instead of clearing the screen")
    args = ap.parse_args()

    spec_names = known_events()
    if spec_names is None:
        print("# note: analytics-events.json unreadable — spec-drift check off",
              file=sys.stderr)
    t = Tailer(args.ndjson, args.window)

    if args.once or args.json:
        t.poll(spec_names)
        s = snapshot(t, int(time.time() * 1000), args.stall_sessions,
                     args.notfound_pct, args.target_sessions)
        print(json.dumps(s, indent=2, sort_keys=True) if args.json else
              render(s, args.window))
        if args.strict and s["alerts"]:
            return 1
        return 0

    while True:
        t.poll(spec_names)
        s = snapshot(t, int(time.time() * 1000), args.stall_sessions,
                     args.notfound_pct, args.target_sessions)
        block = render(s, args.window)
        if args.no_clear:
            print(block + "\n")
        else:
            print("\033[2J\033[H" + block, flush=True)
        time.sleep(args.interval)


if __name__ == "__main__":
    sys.exit(main() or 0)
