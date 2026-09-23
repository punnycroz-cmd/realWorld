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

Usage: ./tools/checklist_audit.py   (run from marketing/ or repo root)
Exit:  0 = no FAILs (warns allowed), 1 = any FAIL.
"""
import os, re, sys

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
matrix = re.search(r"## §11.*?(?=\n## |\Z)", text, re.S)
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

print(f"\nchecklist audit: {PASS} pass / {WARN} warn / {FAIL} fail")
sys.exit(1 if FAIL else 0)
