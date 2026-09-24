#!/usr/bin/env python3
"""checklist_audit.py — self-consistency audit for LAUNCH-CHECKLIST.md.

The checklist is the launch contract; if it drifts from the tree it describes
(stale gate counts, dead script paths, gates with no proof row), a GO becomes
less boring than it should be. This tool mechanically verifies:

  1. Gate table (§1): ids are contiguous G1..Gn, no dupes.
  2. Coverage matrix (§11): every gate has a proof row.
  3. Command card (§4): every `./tools/X`, `./build-press-kit.sh`, and
     `deploy/X` invocation names a file that exists.
  4. Coverage matrix proof column: every backticked local path exists.
  5. Sign-off table (§7): every gate whose §1 owner column names "owner"
     has a sign-off row.
  6. Gate-count consistency: "G1..G16", "x/16", "of 16", "all-N-gate"
     style references inside the checklist AND inside tools/gonogo.sh
     agree with the real gate count; gonogo.sh emits one line per gate.
  7. Never-do list (§12) present and non-empty.
  8. Live world-contract freshness: the version pins quoted in the gates
     (feed request_status list, onboarding storage key + hook count, and
     every world analytics_hook being spec'd, playtest PT range) are
     diffed against the live world-sim-world worktree. Skips with a WARN
     when that worktree isn't mounted.
  9. Rehearsal-log containment: every dated "| YYYY-MM-DD | ... |" table
     row lives inside §10 (rows pasted at end-of-file get orphaned under
     later sections and become invisible to gate_freshness.sh). Also:
     every D0.x task in §3 has a §11 proof-row mention.

Usage: ./tools/checklist_audit.py   (run from marketing/ or repo root)
Exit:  0 = no FAILs (warns allowed), 1 = any FAIL.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKLIST = os.path.join(ROOT, "LAUNCH-CHECKLIST.md")
GONOGO = os.path.join(ROOT, "tools", "gonogo.sh")

PASS = WARN = FAIL = 0
def ok(m):   global PASS; PASS += 1; print(f"  PASS  {m}")
def warn(m): global WARN; WARN += 1; print(f"  WARN  {m}")
def bad(m):  global FAIL; FAIL += 1; print(f"  FAIL  {m}")

print("=== checklist audit ===")
text = open(CHECKLIST, encoding="utf-8").read()
lines = text.splitlines()

# ── 1. gate table ──
gates = [int(m.group(1)) for l in lines
         for m in [re.match(r"\|\s*G(\d+)\s*\|", l)] if m]
if gates == list(range(1, len(gates) + 1)):
    ok(f"gate table contiguous G1..G{len(gates)}")
elif gates:
    bad(f"gate ids not contiguous/unique: {gates}")
N = max(gates) if gates else 0

# owner-classified gates (column 3 contains 'owner')
owner_gates = set()
for l in lines:
    m = re.match(r"\|\s*G(\d+)\s*\|[^|]*\|([^|]*)\|", l)
    if m and "owner" in m.group(2):
        owner_gates.add(int(m.group(1)))

# ── 2/4. coverage matrix ──
matrix = re.search(r"(?m)^## §11.*?(?=^## |\Z)", text, re.S)
if not matrix:
    bad("§11 rehearsal coverage matrix not found")
    matrix_text = ""
else:
    matrix_text = matrix.group(0)
    missing = [g for g in gates if not re.search(rf"\bG{g}\b", matrix_text)]
    if missing:
        bad(f"gates with no §11 proof row: {missing}")
    else:
        ok(f"all {N} gates have a §11 proof row")

    missing_files = []
    for path in re.findall(r"`([^`]+)`", matrix_text):
        p = path.split()[0]
        if p.startswith(("site/", "tools/", "deploy/", "world/", "social/",
                          "templates/", "analytics", "MODERATION", "COMMUNITY",
                          "INFRASTRUCTURE", "build-press-kit.sh", "dist/")):
            if not os.path.exists(os.path.join(ROOT, p)) and \
               not os.path.exists(os.path.join("/home/hatch/workspace/world-sim-world", p)):
                missing_files.append(p)
    if missing_files:
        bad(f"§11 proof paths that don't exist: {missing_files}")
    else:
        ok("all §11 backticked proof paths exist")

# ── 3. command card paths ──
card = re.search(r"## §4.*?```sh\n(.*?)```", text, re.S)
if not card:
    bad("§4 command card fenced block not found")
else:
    missing_cmds = []
    for line in card.group(1).splitlines():
        line = line.split("#", 1)[0]  # strip comments
        for cmd in re.findall(r"(?<![\w./-])(?:\./)?((?:tools|deploy)/[\w.-]+|build-press-kit\.sh)", line):
            if not os.path.exists(os.path.join(ROOT, cmd)):
                missing_cmds.append(cmd)
    if missing_cmds:
        bad(f"command card references missing files: {sorted(set(missing_cmds))}")
    else:
        ok("every command-card invocation resolves to a real file")

# ── 5. sign-off rows for owner gates ──
signoff = re.search(r"## §7.*?(?=\n## |\Z)", text, re.S)
if not signoff:
    bad("§7 owner sign-off record not found")
else:
    st = signoff.group(0)
    missing = [g for g in sorted(owner_gates) if f"G{g})" not in st]
    if missing:
        warn(f"owner gates with no §7 sign-off row: {missing}")
    else:
        ok(f"all {len(owner_gates)} owner gates have §7 sign-off rows")

# ── 6. gate-count consistency ──
# §10 rehearsal log is append-only history — dated results stay verbatim, so
# count references are only audited outside it.
live_text = re.sub(r"## §10.*?(?=\n## §11)", "", text, flags=re.S)
stale = []
for m in re.finditer(r"G1\.\.G(\d+)|all-(\d+)-gate|all (\d+) gates|"
                     r"[x0-9]+/(\d+) (?:auto-)?green|of (\d+)(?=\s*\n)", live_text):
    n = next(g for g in m.groups() if g)
    if int(n) != N:
        stale.append(m.group(0))
if stale:
    bad(f"stale gate-count references (real count {N}): "
        f"{sorted(set(stale))}")
else:
    ok(f"no stale gate-count references in checklist (N={N})")

if not os.path.exists(GONOGO):
    bad("tools/gonogo.sh missing")
else:
    g = open(GONOGO, encoding="utf-8").read()
    emitted = sorted({int(m.group(1)) for m in re.finditer(
        r"^\s*(?:auto_ok|auto_pend|owner|track)\s+(\d+)\s", g, re.M)})
    if emitted != list(range(1, N + 1)):
        bad(f"gonogo.sh gate lines {emitted} != checklist G1..G{N}")
    else:
        ok(f"gonogo.sh covers all {N} gates")
    stale_g = [m.group(0) for m in re.finditer(
        r"all-(\d+)-gate|of (\d+)\b|/(\d+) auto-green", g)
        if any(x and int(x) != N for x in m.groups())]
    if stale_g:
        bad(f"stale gate-count references in gonogo.sh: {sorted(set(stale_g))}")
    else:
        ok("gonogo.sh gate-count strings current")

# ── 7. never-do list ──
nd = re.search(r"## §12.*?(?=\n## |\Z)", text, re.S)
if nd and nd.group(0).count("\n-") >= 3:
    ok("§12 never-do list present")
else:
    bad("§12 never-do list missing or gutted")

# ── 8. live world-contract freshness ──
WORLD = os.path.join("/home/hatch/workspace/world-sim-world", "world")
if not os.path.isdir(WORLD):
    warn("world worktree not mounted — contract freshness unchecked")
else:
    # feed vocabulary quoted in G15 vs live feed.json
    try:
        feed = json.load(open(os.path.join(WORLD, "feed.json"), encoding="utf-8"))
        statuses = feed["request_status"]
        if isinstance(statuses, dict):
            statuses = list(statuses)
        missing = [s for s in statuses if s not in live_text]
        if missing:
            bad(f"feed request_status values not quoted in G15: {missing}")
        else:
            ok(f"G15 quotes all {len(statuses)} live request_status values")
    except Exception as e:
        warn(f"feed.json unreadable: {e}")

    # onboarding storage key + hook contract vs live onboarding.json
    try:
        ob = json.load(open(os.path.join(WORLD, "onboarding.json"), encoding="utf-8"))
        key = ob.get("storage_key")
        if key and key in live_text:
            ok(f"onboarding storage key {key} matches live contract")
        else:
            bad(f"onboarding storage key drift — live={key!r}")
        hooks = [h.split(" ")[0] for h in ob.get("analytics_hooks", [])
                 if not h.startswith("plus")]
        cited = {int(m.group(1)) for m in re.finditer(r"(\d+)-hook", live_text)}
        if cited and cited != {len(hooks)}:
            bad(f"checklist cites {sorted(cited)}-hook set; live contract "
                f"has {len(hooks)} analytics_hooks")
        elif cited:
            ok(f"onboarding hook count {len(hooks)} matches checklist")
        spec = json.load(open(os.path.join(ROOT, "analytics-events.json"),
                              encoding="utf-8"))["events"]
        unspec = [h for h in hooks if h not in spec]
        if unspec:
            bad(f"world analytics_hooks missing from analytics-events.json: {unspec}")
        else:
            ok(f"all {len(hooks)} world analytics_hooks spec'd in analytics-events.json")
    except Exception as e:
        warn(f"onboarding.json unreadable: {e}")

    # playtest scenario range cited vs live playtest.json
    try:
        pt = json.load(open(os.path.join(WORLD, "playtest.json"), encoding="utf-8"))
        n = len(pt.get("scenarios", []))
        refs = {int(m.group(1)) for m in re.finditer(r"PT1[–-]PT(\d+)", live_text)}
        if refs and refs != {n}:
            bad(f"playtest range drift — checklist {sorted(refs)} vs live PT1–PT{n}")
        elif refs:
            ok(f"playtest scenario range PT1–PT{n} matches live harness")
        else:
            warn("no PT1–PTn citation found in checklist")
    except Exception as e:
        warn(f"playtest.json unreadable: {e}")

# ── 9. rehearsal-log containment + D0 coverage ──
s10_start = text.find("## §10")
s11_start = text.find("## §11")
stray = []
for i, l in enumerate(lines):
    if re.match(r"\| 202\d-", l):
        pos = sum(len(x) + 1 for x in lines[:i])
        if not (s10_start <= pos < s11_start):
            stray.append(i + 1)
if stray:
    bad(f"dated rehearsal-log rows outside §10 (lines {stray}) — "
        f"move them inside the §10 table (tools/log_rehearsal.sh)")
else:
    ok("all dated rehearsal-log rows live inside §10")

d0_ids = sorted({m.group(0) for l in lines
                 for m in [re.search(r"D0\.\d+b?", l)] if m})
# §11 may cite a task as part of a range ("D0.5–D0.8 posts") — expand those
covered = set(re.findall(r"D0\.\d+b?", matrix_text))
for m in re.finditer(r"D0\.(\d+)b?\s*[–-]\s*D0\.(\d+)b?", matrix_text):
    covered.update(f"D0.{n}" for n in range(int(m.group(1)), int(m.group(2)) + 1))
missing_d0 = [d for d in d0_ids if d not in covered]
if missing_d0:
    bad(f"§3 day-0 tasks with no §11 proof-row mention: {missing_d0}")
else:
    ok(f"all {len(d0_ids)} D0.x tasks are mentioned in §11")

print(f"\nchecklist audit: {PASS} pass / {WARN} warn / {FAIL} fail")
sys.exit(1 if FAIL else 0)
