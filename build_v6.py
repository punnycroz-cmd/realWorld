#!/usr/bin/env python3
"""natura-v5.html -> natura-v6.html : bake in the wild ecology v1 (sky/water/land wildlife).

Anchors are asserted unique before replacement. The wild module is inserted at
the genesis block after farmGenesis(), and the "bNew" button re-runs
wildGenesis() so a fresh world restocks the wilds.
"""
BASE = '/home/hatch/workspace/world-sim/natura-v5.html'
OUT = '/home/hatch/workspace/world-sim/natura-v6.html'
WILDJS = '/home/hatch/workspace/world-sim/wild_v1.js'

src = open(BASE).read()

def rep(old, new):
    global src
    n = src.count(old)
    assert n == 1, 'ANCHOR x%d: %s' % (n, old[:70])
    src = src.replace(old, new)

# ---- titles ----
rep('<title>Natura v5 — a living world</title>', '<title>Natura v6 — a living world</title>')
rep('<span class="title">NATURA v5</span>', '<span class="title">NATURA v6</span>')
rep('NATURA v5 — a watchmaker world sim.', 'NATURA v6 — a watchmaker world sim.')

# ---- bNew: restock the wilds on a new world ----
rep("  if(window.farmGenesis) farmGenesis();",
    "  if(window.farmGenesis) farmGenesis();\n"
    "  if(window.wildGenesis) wildGenesis();")

# ---- genesis: insert wild module + wildGenesis() after farmGenesis() ----
anchor = "\nfarmGenesis();\nframe();"
assert src.count(anchor) == 1, 'genesis anchor x%d' % src.count(anchor)
wild_js = open(WILDJS).read()
assert '__WILDV1' in wild_js and 'window.wildGenesis' in wild_js
src = src.replace(anchor,
    "\nfarmGenesis();\n"
    "/* ================= wild ecology v1 (sky/water/land wildlife) ================= */\n"
    + wild_js + "\nwildGenesis();\nframe();")

open(OUT, 'w').write(src)
print('v6 bytes:', len(src))
js = src[src.index('<script>') + 8:src.index('</script>')]
print('naive braces:', js.count('{') - js.count('}'))
print('WILDV1 present:', '__WILDV1' in src, '| wildGenesis calls:', src.count('wildGenesis()'))
