#!/usr/bin/env python3
"""build_willowbrook_natura.py — thin bundler for Willowbrook Natura.

Assembles the single self-contained willowbrook_natura.html from:
  1. willowbrook/dev/pa-*.js   (pixel-art modules; shared with Willowbrook)
  2. src/**/*.js               (game simulation, bundle order = src/_order.txt)
  3. HTML_TEMPLATE below       (HTML shell + CSS)

Output is one plain <script> block: no ES modules, no external requests,
stays openable from file://.

Rules:
  - Game code lives in src/ modules. Never hand-edit willowbrook_natura.html.
  - All src/ modules share one script scope: keep top-level names unique and
    keep src/_order.txt order (see src/MANIFEST.md).
  - Phase 1 guarantee: bundling must reproduce the pre-split page byte for
    byte. Verify with: cmp <(git show HEAD:willowbrook_natura.html) willowbrook_natura.html
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV_DIR = os.path.join(BASE_DIR, 'willowbrook', 'dev')
SRC_DIR = os.path.join(BASE_DIR, 'src')
OUT_FILE = os.path.join(BASE_DIR, 'willowbrook_natura.html')
TEST_OUT_FILE = os.path.join(BASE_DIR, 'willowbrook_natura_test.html')

# Pixel-art modules, in bundle order (PART 1)
PA_ORDER = [
    'pa-core.js',
    'pa-terrain.js',
    'pa-veg.js',
    'pa-props.js',
    'pa-buildings.js',
    'pa-chars.js',
    'pa-fx.js',
]

PART1_HEADER = (
"/* =====================================================================\n"
                   "   PART 1: WILLOWBROOK PIXEL-ART MODULES (NATIVE PROCEDURAL COMPILER)\n"
                   "   ===================================================================== */"
)

HTML_FOOTER = "\n</script>\n</body>\n</html>\n"


def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def read_dev(name):
    return read_file(os.path.join(DEV_DIR, name))


def read_src(rel):
    return read_file(os.path.join(SRC_DIR, rel))


HTML_TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Willowbrook Natura — Living World Simulation</title>
<style>
  :root {
    --bg: #07090e;
    --panel: rgba(13, 18, 28, 0.92);
    --panel-border: #1e293b;
    --text: #f1f5f9;
    --muted: #94a3b8;
    --gold: #f59e0b;
    --blue: #38bdf8;
    --green: #4ade80;
    --red: #f43f5e;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
    background: var(--bg); color: var(--text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none; -webkit-user-select: none;
  }
  #top {
    position: fixed; top: 0; left: 0; right: 0; height: 44px;
    background: rgba(10, 14, 23, 0.95); backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--panel-border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px; z-index: 20; font-size: 13px;
  }
  .top-left, .top-right, .top-center { display: flex; align-items: center; gap: 10px; }
  .title { font-weight: 800; color: #86efac; letter-spacing: 0.5px; font-size: 14px; display: flex; align-items: center; gap: 6px; }
  .pill {
    background: #162032; border: 1px solid #283548; border-radius: 999px;
    padding: 3px 11px; font-size: 12px; color: #cbd5e1; font-weight: 500;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .pill-weather { color: #38bdf8; border-color: rgba(56,189,248,0.3); }
  .pill-temp { color: #facc15; }
  .btn {
    background: #1e293b; border: 1px solid #334155; color: #f8fafc;
    border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 12px;
    font-family: inherit; transition: all 0.15s ease;
  }
  .btn:hover { background: #334155; border-color: #475569; }
  .btn.active { background: #047857; border-color: #10b981; color: #ecfdf5; font-weight: 600; }
  #cv {
    position: fixed; top: 44px; left: 0; width: 100vw; height: calc(100vh - 44px);
    display: block; cursor: crosshair; image-rendering: pixelated;
  }

  /* RimWorld-Style Pawn Inspector */
  #pawn-inspector {
    position: fixed; left: 16px; bottom: 16px; width: 330px;
    background: var(--panel); backdrop-filter: blur(14px);
    border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px;
    padding: 12px 14px; z-index: 25; box-shadow: 0 16px 36px rgba(0,0,0,0.65);
    display: flex; flex-direction: column; gap: 10px;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .pi-header { display: flex; align-items: center; gap: 12px; }
  .pi-avatar-wrap {
    width: 44px; height: 52px; background: #0f172a; border-radius: 8px;
    border: 1px solid #334155; overflow: hidden; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pi-avatar-wrap canvas { width: 44px; height: 52px; image-rendering: pixelated; }
  .pi-meta { flex: 1; min-width: 0; }
  .pi-name-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .pi-name { font-weight: 800; font-size: 14.5px; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pi-badge {
    font-size: 9.5px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;
    padding: 2px 7px; border-radius: 999px; background: #1e3a8a; color: #93c5fd; border: 1px solid #3b82f6;
  }
  .pi-badge.controlled { background: #854d0e; color: #fef08a; border-color: #eab308; }
  .pi-role { font-size: 11.5px; color: var(--muted); margin-top: 1px; }
  .pi-trait-badge {
    display: inline-block; padding: 2px 7px; border-radius: 999px;
    font-size: 10px; font-weight: 700; margin-top: 3px; letter-spacing: 0.3px;
  }
  .pi-trait-swimmer { background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #7dd3fc; }
  .pi-trait-nonswimmer { background: rgba(248, 113, 113, 0.2); border: 1px solid #f87171; color: #fca5a5; }
  .pi-act {
    font-size: 11.5px; color: #e2e8f0; display: flex; align-items: center; gap: 6px;
    background: rgba(15,23,42,0.6); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);
  }
  .pi-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; flex-shrink: 0; }

  /* Biological Needs Grid */
  .pi-needs { display: flex; flex-direction: column; gap: 5px; }
  .pi-need-row { display: flex; flex-direction: column; gap: 2px; }
  .pi-need-head { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--muted); }
  .pi-need-head span:last-child { color: #e2e8f0; font-weight: 700; }
  .pi-track { height: 5px; background: #0f172a; border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
  .pi-fill { height: 100%; transition: width 0.25s ease; }
  .pi-food-fill { background: linear-gradient(90deg, #eab308, #4ade80); }
  .pi-hydro-fill { background: linear-gradient(90deg, #0284c7, #38bdf8); }
  .pi-rest-fill { background: linear-gradient(90deg, #6366f1, #a855f7); }
  .pi-temp-fill { background: linear-gradient(90deg, #38bdf8, #22c55e, #f97316); }
  .pi-mood-fill { background: linear-gradient(90deg, #ec4899, #f43f5e); }

  /* Gear & Thoughts */
  .pi-gear-card {
    display: flex; align-items: center; gap: 8px; padding: 5px 8px;
    background: rgba(15,23,42,0.6); border-radius: 6px; border: 1px solid #1e293b;
  }
  .pi-gear-icon { font-size: 15px; flex-shrink: 0; }
  .pi-gear-details { flex: 1; min-width: 0; }
  .pi-gear-name { font-weight: 700; font-size: 11px; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pi-gear-desc { font-size: 9.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .pi-thoughts-box { display: flex; flex-direction: column; gap: 3px; max-height: 85px; overflow-y: auto; }
  .pi-th-title { font-size: 9.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .pi-thought-item {
    font-size: 10.5px; padding: 2px 6px; border-radius: 4px; background: rgba(30,41,59,0.5);
    color: #cbd5e1; display: flex; justify-content: space-between;
  }
  .pi-thought-pos { color: #86efac; border-left: 2px solid #22c55e; }
  .pi-thought-neg { color: #fca5a5; border-left: 2px solid #ef4444; }

  /* Controls row */
  .pi-actions { display: flex; gap: 6px; }
  .pi-actions button { flex: 1; padding: 5px 0; font-size: 11px; font-weight: 600; border-radius: 6px; }

  /* Floating notification & hints */
  #toast {
    position: fixed; top: 58px; left: 50%; transform: translateX(-50%);
    background: rgba(15,23,42,0.92); border: 1px solid #38bdf8; color: #f8fafc;
    padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 600;
    pointer-events: none; opacity: 0; transition: opacity 0.25s ease; z-index: 30;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  #help-bar {
    position: fixed; right: 16px; bottom: 16px;
    background: rgba(10,14,23,0.85); backdrop-filter: blur(8px);
    border: 1px solid var(--panel-border); border-radius: 8px;
    padding: 6px 12px; font-size: 11.5px; color: var(--muted);
    display: flex; gap: 12px; z-index: 15;
  }
  #help-bar kbd {
    background: #1e293b; border: 1px solid #475569; color: #e2e8f0;
    padding: 1px 5px; border-radius: 4px; font-size: 10.5px; font-weight: 700;
  }
  /* Phase 3: debug panel + event feed + why-section */
  #debug-panel {
    position: fixed; right: 16px; top: 56px; width: 210px; z-index: 30;
    background: var(--panel); border: 1px solid var(--panel-border);
    border-radius: 10px; padding: 10px 12px; display: none;
    box-shadow: 0 12px 28px rgba(0,0,0,0.6); font-size: 12px;
  }
  #debug-panel label { display: flex; align-items: center; gap: 7px; padding: 3px 0; cursor: pointer; color: var(--text); }
  #debug-panel .dbg-title { font-weight: 700; margin-bottom: 6px; color: var(--gold); }
  #debug-feed {
    position: fixed; right: 16px; bottom: 16px; width: 300px; max-height: 220px;
    overflow-y: auto; z-index: 30; background: var(--panel);
    border: 1px solid var(--panel-border); border-radius: 10px;
    padding: 8px 10px; font-size: 11px; display: none;
  }
  .dbg-feed-title { font-weight: 700; color: var(--gold); margin-bottom: 4px; }
  .dbg-feed-row { padding: 2px 0; border-top: 1px solid #1e293b; color: var(--muted); }
  .dbg-feed-day { color: var(--blue); }
  .pi-why-box { border-top: 1px solid #1e293b; padding-top: 8px; }
  .pi-why-title { font-weight: 700; font-size: 12px; color: var(--gold); margin-bottom: 4px; }
  #pi-why { font-size: 11.5px; color: var(--text); display: flex; flex-direction: column; gap: 3px; }
  .pi-why-winner { font-weight: 700; }
  .pi-why-score { color: var(--muted); font-weight: 400; }
  .pi-why-feeling { color: #38bdf8; font-weight: 500; }
  .pi-why-why { color: var(--muted); }
  .pi-why-top { color: var(--muted); padding-left: 2px; }
  .pi-why-fail { color: var(--red); }
  #autotest {
    position: fixed; top: 60px; right: 20px; width: 380px; max-height: 80vh;
    background: rgba(10,14,24,0.95); border: 2px solid #38bdf8; border-radius: 8px;
    padding: 12px; font-family: monospace; font-size: 11.5px; line-height: 1.5;
    color: #cbd5e1; overflow-y: auto; z-index: 999; display: none; white-space: pre-wrap;
  }
  /* Phones: inspector becomes a bottom sheet, top bar scrolls, canvas
     takes touch gestures (drag = pan, pinch = zoom, tap = inspect). */
  @media (max-width: 720px){
    #top { padding: 0 8px; gap: 6px; overflow-x: auto; overflow-y: hidden;
           font-size: 11.5px; }
    .top-left, .top-right, .top-center { gap: 6px; flex-shrink: 0; }
    .pill { padding: 2px 8px; font-size: 10.5px; }
    .btn { padding: 4px 8px; font-size: 11px; min-height: 30px; }
    #cv { touch-action: none; }
    #pawn-inspector {
      left: 8px; right: 8px; bottom: 8px; width: auto;
      max-height: 42vh; overflow-y: auto; -webkit-overflow-scrolling: touch;
      padding: 10px 12px; gap: 8px;
    }
    #help-bar { display: none; }
    #debug-feed { right: 8px; bottom: 8px; width: 46vw; max-height: 30vh; }
    #toast { top: 50px; font-size: 11px; max-width: 92vw;
             text-align: center; }
    #autotest { right: 8px; left: 8px; top: 52px; width: auto; }
  }
</style>
</head>
<body>

<div id="top">
  <div class="top-left">
    <span class="title">🌿 WILLOWBROOK NATURA</span>
    <span class="pill" id="ui-clock">Day 1 · Spring · 08:00</span>
    <span class="pill pill-weather" id="ui-weather">⛅ Fair</span>
    <span class="pill pill-temp" id="ui-temp">21°C</span>
  </div>
  <div class="top-center">
    <button class="btn" id="btn-pause">⏸</button>
    <button class="btn active" id="btn-speed-1">1×</button>
    <button class="btn" id="btn-speed-2">2×</button>
    <button class="btn" id="btn-speed-4">4×</button>
    <button class="btn" id="btn-speed-16">16×</button>
  </div>
  <div class="top-right">
    <button class="btn" id="btn-sound">🔊 Sound: ON</button>
    <button class="btn" id="btn-spawn-visitor">✦ Invite Visitor</button>
    <button class="btn" id="btn-save">💾 Save</button>
    <button class="btn" id="btn-load">📂 Load</button>
    <button class="btn" id="btn-debug">🛠 Debug</button>
  </div>
</div>

<canvas id="cv"></canvas>

<!-- RimWorld-Style Pawn Inspector -->
<div id="pawn-inspector">
  <div class="pi-header">
    <div class="pi-avatar-wrap"><canvas id="pi-avatar" width="44" height="52"></canvas></div>
    <div class="pi-meta">
      <div class="pi-name-row">
        <span class="pi-name" id="pi-name">Marta</span>
        <span class="pi-badge controlled" id="pi-badge">Controlled</span>
      </div>
      <div class="pi-role" id="pi-role">Village Farmer</div>
      <div class="pi-trait-badge pi-trait-swimmer" id="pi-swim-badge">🏊 Swimmer (Skill 60%)</div>
    </div>
  </div>

  <div class="pi-act" id="pi-act-box">
    <div class="pi-dot" id="pi-dot"></div>
    <span id="pi-act-label">Tending the vegetable rows</span>
  </div>

  <!-- Real-time Biological Needs (Metabolism & Thermoregulation) -->
  <div class="pi-needs">
    <div class="pi-need-row">
      <div class="pi-need-head"><span>🍞 Food (Satiety)</span><span id="pi-val-food">90%</span></div>
      <div class="pi-track"><div class="pi-fill pi-food-fill" id="pi-fill-food" style="width:90%"></div></div>
    </div>
    <div class="pi-need-row">
      <div class="pi-need-head"><span>💧 Hydration (Water)</span><span id="pi-val-hydro">85%</span></div>
      <div class="pi-track"><div class="pi-fill pi-hydro-fill" id="pi-fill-hydro" style="width:85%"></div></div>
    </div>
    <div class="pi-need-row">
      <div class="pi-need-head"><span>💤 Rest (Stamina)</span><span id="pi-val-rest">92%</span></div>
      <div class="pi-track"><div class="pi-fill pi-rest-fill" id="pi-fill-rest" style="width:92%"></div></div>
    </div>
    <div class="pi-need-row">
      <div class="pi-need-head"><span>🌡️ Body Temp</span><span id="pi-val-temp">37.0°C</span></div>
      <div class="pi-track"><div class="pi-fill pi-temp-fill" id="pi-fill-temp" style="width:70%"></div></div>
    </div>
    <div class="pi-need-row">
      <div class="pi-need-head"><span>❤️ Mood</span><span id="pi-val-mood">95%</span></div>
      <div class="pi-track"><div class="pi-fill pi-mood-fill" id="pi-fill-mood" style="width:95%"></div></div>
    </div>
  </div>

  <!-- Active Tool Gear -->
  <div class="pi-gear-card">
    <div class="pi-gear-icon" id="pi-gear-icon">🌾</div>
    <div class="pi-gear-details">
      <div class="pi-gear-name" id="pi-gear-name">Sturdy Farming Hoe</div>
      <div class="pi-gear-desc" id="pi-gear-desc">Hand-forged blade, ash wood handle.</div>
    </div>
  </div>

  <!-- Psychological & Biological Thoughts -->
  <div class="pi-thoughts-box">
    <div class="pi-th-title">Recent Thoughts & Sensations</div>
    <div id="pi-th-list" style="display:flex; flex-direction:column; gap:3px;"></div>
  </div>

  <!-- Phase 3: Why-Action Inspector -->
  <div class="pi-why-box">
    <div class="pi-why-title">🧠 Why this action?</div>
    <div id="pi-why">No decision recorded yet.</div>
  </div>

  <!-- Actions -->
  <div class="pi-actions">
    <button class="btn" id="btn-prev-pawn">◀ Prev</button>
    <button class="btn active" id="btn-toggle-ctrl">Release to AI</button>
    <button class="btn" id="btn-next-pawn">Next ▶</button>
  </div>
</div>

<div id="toast">✦ A visitor arrives</div>

<div id="help-bar">
  <span><kbd>WASD</kbd> Move</span>
  <span><kbd>Click</kbd> Select / Walk</span>
  <span><kbd>Tab</kbd> Cycle Pawn</span>
  <span><kbd>E</kbd> Interact / Drink / Work</span>
</div>

<div id="debug-panel">
  <div class="dbg-title">🛠 Debug overlays</div>
  <label><input type="checkbox" data-overlay="needs"> Needs bars</label>
  <label><input type="checkbox" data-overlay="ownership"> Ownership labels</label>
  <label><input type="checkbox" data-overlay="beliefs"> Belief view</label>
  <label><input type="checkbox" data-overlay="zones"> Zones</label>
  <label><input type="checkbox" data-overlay="feed"> Event feed</label>
</div>
<div id="debug-feed"></div>
<div id="autotest"></div>

<script>
'use strict';
'''


def check_substrate_lint():
    """S2: Lint rule forbidding direct 'v.body' accesses in src/brain/**.
    Fails build immediately if any un-allowlisted violation is found.
    (Harden N2: catches bare v.body as well as dot and bracket notation).
    """
    import re
    brain_dir = os.path.join(SRC_DIR, 'brain')
    # Grandfathered legacy violations in src/brain/** recorded in docs/archive/checkpoints/.phase6e_progress.md
    legacy_allowlist = {
        ('brain/09_bridge.js', 'v.body.hydration = 1.0;'),
        ('brain/09_bridge.js', 'v.body.satiety = 1.0;'),
    }
    violations = []
    bare_pattern = re.compile(r'\bv\.body\b|\bv\s*\[\s*[\'"]body[\'"]\s*\]')
    for root, _, files in os.walk(brain_dir):
        for fname in files:
            if not fname.endswith('.js'):
                continue
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, SRC_DIR).replace('\\', '/')
            if rel_path == 'brain/14_substrate.js':
                continue
            with open(full_path, 'r', encoding='utf-8') as f:
                for line_no, line in enumerate(f, 1):
                    trimmed = line.strip()
                    if trimmed.startswith('//') or trimmed.startswith('*') or trimmed.startswith('/*'):
                        continue
                    if bare_pattern.search(line):
                        if (rel_path, trimmed) not in legacy_allowlist:
                            violations.append((rel_path, line_no, trimmed))
    if violations:
        print("\n[LINT FAILURE — S2 SUBSTRATE VIOLATION]")
        print("Direct 'v.body' access is strictly prohibited in src/brain/**.")
        for v in violations:
            print(f"  --> {v[0]}:{v[1]}: {v[2]}")
        raise SystemExit(1)
    print("  Substrate lint check passed (0 new 'v.body' violations in src/brain/**).")


# ---------------------------------------------------------------------------
# Encapsulation-law lints (docs/ARCHITECTURE.md). All static, regex/AST-lite.
# ---------------------------------------------------------------------------

def _strip_comments(text):
    """Remove // and /* */ comments while preserving string/template content.
    Regex literals are left alone (they never start with '//' or '/*')."""
    out = []
    i, n = 0, len(text)
    state = None  # None | "'" | '"' | '`' | 'line' | 'block'
    while i < n:
        c = text[i]
        nxt = text[i + 1] if i + 1 < n else ''
        if state == 'line':
            if c == '\n':
                state = None
                out.append(c)
        elif state == 'block':
            if c == '*' and nxt == '/':
                state = None
                i += 1
            elif c == '\n':
                out.append('\n')  # keep line numbers stable
        elif state in ("'", '"', '`'):
            out.append(c)
            if c == '\\':
                i += 1
                if i < n:
                    out.append(text[i])
            elif c == state:
                state = None
        else:
            if c == '/' and nxt == '/':
                state = 'line'
                i += 1
            elif c == '/' and nxt == '*':
                state = 'block'
                i += 1
            else:
                out.append(c)
                if c in ("'", '"', '`'):
                    state = c
        i += 1
    return ''.join(out)


def _iter_src_modules():
    """Yield (rel_path, comment-stripped source) for every module in _order.txt."""
    with open(os.path.join(SRC_DIR, '_order.txt'), 'r', encoding='utf-8') as f:
        for rel in (ln.strip() for ln in f if ln.strip()):
            yield rel, _strip_comments(read_src(rel))


def check_no_test_refs():
    """no-test-refs: production modules must not reference identifiers that are
    only defined under src/tests/. Tests are stripped from the release bundle,
    so such a reference either breaks the release or makes test code
    load-bearing (the boot-hook and mkTestV13 incidents)."""
    import re
    decl_re = re.compile(r'^(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)', re.M)
    modules = list(_iter_src_modules())
    test_defs = set()
    prod_defs = set()
    for rel, src in modules:
        (test_defs if rel.startswith('tests/') else prod_defs).update(decl_re.findall(src))
    test_only = test_defs - prod_defs
    # Justified exceptions: (module, identifier). Add only with a WORK_LOG note.
    allowlist = set()
    violations = []
    for rel, src in modules:
        if rel.startswith('tests/'):
            continue
        for ident in sorted(test_only):
            if (rel, ident) in allowlist:
                continue
            for m in re.finditer(r'\b' + re.escape(ident) + r'\b', src):
                line_no = src.count('\n', 0, m.start()) + 1
                violations.append((rel, line_no, ident))
    if violations:
        print("\n[LINT FAILURE — NO-TEST-REFS VIOLATION]")
        print("Production code references an identifier defined only in src/tests/.")
        print("Move the helper into production code (e.g. src/data/) instead.")
        for rel, line_no, ident in violations:
            print(f"  --> {rel}:{line_no}: '{ident}'")
        raise SystemExit(1)
    print(f"  no-test-refs check passed ({len(test_only)} test-only identifiers, 0 referenced).")


def check_no_duplicates():
    """no-duplicates: a top-level function/const/let/var name may be defined in
    exactly one src module. All modules share one script scope — a second
    'function NAME' silently shadows the first (hashString18 precedent)."""
    import re
    decl_re = re.compile(r'^(?:function\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)', re.M)
    seen = {}
    violations = []
    for rel, src in _iter_src_modules():
        for name in decl_re.findall(src):
            if name in seen:
                violations.append((name, seen[name], rel))
            else:
                seen[name] = rel
    if violations:
        print("\n[LINT FAILURE — NO-DUPLICATES VIOLATION]")
        print("Duplicate top-level definitions across modules (shared script scope).")
        for name, first, second in violations:
            print(f"  --> '{name}' defined in {first} and again in {second}")
        raise SystemExit(1)
    print(f"  no-duplicates check passed ({len(seen)} top-level names, all unique).")


def check_no_new_wraps():
    """no-new-wraps: planTick/simTick/bodyTick/updateVillagerAI may only be
    extended via registerSimTick/registerBodyTick/registerVerbHandler
    (sim/00_core.js). The wraps below predate the registry and are
    grandfathered; new ones fail the build."""
    import re
    # (module, target) -> number of allowed top-level reassignments
    legacy_wraps = {
        ('sim/12a_events.js', 'bodyTick'): 1,
        ('sim/12a_events.js', 'updateVillagerAI'): 1,
        ('sim/12d_world.js', 'simTick'): 1,
        ('sim/22a_save.js', 'simTick'): 1,
        ('brain/knowledge.js', 'planTick'): 1,
        ('brain/knowledge.js', 'bodyTick'): 1,
        ('brain/utility.js', 'planTick'): 1,
        ('brain/utility.js', 'updateVillagerAI'): 1,
        ('systems/13b_economy.js', 'planTick'): 1,
        ('systems/14f_wiring.js', 'planTick'): 1,
        ('systems/14f_wiring.js', 'bodyTick'): 1,
        ('systems/14f_wiring.js', 'simTick'): 1,
        ('systems/14f_wiring.js', 'updateVillagerAI'): 1,
        ('systems/15a_food.js', 'bodyTick'): 1,
        ('systems/15f_wiring.js', 'planTick'): 1,
        ('systems/15f_wiring.js', 'simTick'): 1,
        ('systems/15f_wiring.js', 'updateVillagerAI'): 1,
        ('systems/16a_recipes.js', 'planTick'): 1,
        ('systems/17a_buildings.js', 'planTick'): 1,
        ('systems/17a_buildings.js', 'bodyTick'): 1,
        ('systems/17a_buildings.js', 'simTick'): 1,
        ('systems/20_social_life.js', 'planTick'): 1,
        ('systems/21a_ownership.js', 'planTick'): 1,
        ('systems/21a_ownership.js', 'simTick'): 1,
    }
    wrap_re = re.compile(r'^(planTick|simTick|bodyTick|updateVillagerAI)\s*=(?!=)', re.M)
    violations = []
    for rel, src in _iter_src_modules():
        counts = {}
        first_line = {}
        for m in wrap_re.finditer(src):
            target = m.group(1)
            counts[target] = counts.get(target, 0) + 1
            first_line.setdefault(target, src.count('\n', 0, m.start()) + 1)
        for target, count in counts.items():
            allowed = legacy_wraps.get((rel, target), 0)
            if count > allowed:
                violations.append((rel, first_line[target], target, count, allowed))
    if violations:
        print("\n[LINT FAILURE — NO-NEW-WRAPS VIOLATION]")
        print("Do not reassign planTick/simTick/bodyTick/updateVillagerAI.")
        print("Use registerSimTick / registerBodyTick / registerVerbHandler (sim/00_core.js).")
        for rel, line_no, target, count, allowed in violations:
            print(f"  --> {rel}:{line_no}: '{target} =' x{count} (allowed: {allowed})")
        raise SystemExit(1)
    print(f"  no-new-wraps check passed ({len(legacy_wraps)} legacy wraps, 0 new).")


def generate():
    print("Running S2 substrate lint check...")
    check_substrate_lint()
    print("Running encapsulation-law checks (docs/ARCHITECTURE.md)...")
    check_no_test_refs()
    check_no_duplicates()
    check_no_new_wraps()

    print("Reading Willowbrook pixel-art dev modules...")
    full_js = [PART1_HEADER]
    for name in PA_ORDER:
        full_js.append(read_dev(name))

    print("Reading src/ game modules...")
    with open(os.path.join(SRC_DIR, '_order.txt'), 'r', encoding='utf-8') as f:
        modules = [ln.strip() for ln in f if ln.strip()]

    # Tests are excluded from the shipped bundle: willowbrook_natura.html is
    # the release build (game only); willowbrook_natura_test.html carries the
    # autotest modules and is what devtools/harnesses run.
    test_modules = [m for m in modules if m.startswith('tests/')]
    game_modules = [m for m in modules if not m.startswith('tests/')]
    print(f"  {len(game_modules)} game modules + {len(test_modules)} test modules")

    parts = HTML_TEMPLATE.split("<script>\n'use strict';")
    assert len(parts) == 2, "HTML shell script-tag anchor changed"

    def emit(out_path, mods, label):
        bridge_js = "\n".join(read_src(m) for m in mods)
        output = (
            parts[0]
            + "<script>\n'use strict';\n"
            + "\n".join(full_js)
            + "\n"
            + bridge_js
            + HTML_FOOTER
        )
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"Compiled {label}: {out_path} ({len(output)} bytes)")

    emit(OUT_FILE, game_modules, 'release (no tests)')
    emit(TEST_OUT_FILE, modules, 'test bundle (game + autotests)')


if __name__ == '__main__':
    generate()
