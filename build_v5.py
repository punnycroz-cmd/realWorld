#!/usr/bin/env python3
"""natura-v4.html -> natura-v5.html : bake in the food system v2 (farming + animals).

Anchors are asserted unique before replacement. The farm module is inserted at
the TRUE genesis (the end-of-script block that runs once on load), and the
"bNew" new-world button re-runs farmGenesis() so a fresh world restocks.
"""
import sys

BASE = '/home/hatch/workspace/world-sim/natura-v4.html'
OUT = '/home/hatch/workspace/world-sim/natura-v5.html'
FARMJS = '/home/hatch/workspace/world-sim/farm_v2.js'

src = open(BASE).read()

def rep(old, new):
    global src
    n = src.count(old)
    assert n == 1, 'ANCHOR x%d: %s' % (n, old[:70])
    src = src.replace(old, new)

# ---- titles ----
rep('<title>Natura v4 — a living world</title>', '<title>Natura v5 — a living world</title>')
rep('<span class="title">NATURA v4</span>', '<span class="title">NATURA v5</span>')
rep('NATURA v4 — a watchmaker world sim.', 'NATURA v5 — a watchmaker world sim.')

# ---- bNew: restock the farm on a new world (unique: has SETTLE.founded=false prefix) ----
rep("  SETTLE.founded=false; foundSettlement(); spawnTomas();",
    "  SETTLE.founded=false; foundSettlement(); spawnTomas();\n"
    "  if(window.farmGenesis) farmGenesis();")

# ---- NV: pause / resume / addTraveler (nv.py calls these; v4 never had them) ----
rep("""  speed(s){ if(s===1||s===4||s===16||s===64) setSpeed(s); return 'speed '+W.speed; }
};""",
"""  speed(s){ if(s===1||s===4||s===16||s===64) setSpeed(s); return 'speed '+W.speed; },
  pause(){ W.paused=true; return 'paused'; },
  resume(){ W.paused=false; return 'running'; },
  addTraveler(name,sex,age,colors,skills){
    if(vByName(name)) return 'already here';
    const a=Math.random()*6.283;
    const wx=SETTLE.wx+Math.round(Math.cos(a)*20), wy=SETTLE.wy+Math.round(Math.sin(a)*20);
    const v=addVillager(name,sex,age,wx*CS,wy*CS,
      colors||{dress:'#777',skin:'#e8b88a',hat:null,hair:'#333'},skills||null);
    v.job={kind:'goto',wx:SETTLE.wx,wy:SETTLE.wy,label:'walking in'};
    logEvent('life','A traveler walks in from the hills. Their name is '+name+'.');
    return 'welcome '+name;
  }
};""")
anchor = """foundSettlement(); spawnTomas();
logEvent('life','A new world condenses out of the noise. Seed '+SEED+'.');
logEvent('life','Grass spreads. Seeds fall. No one is watching — yet.');
frame();"""
assert src.count(anchor) == 1, 'genesis anchor x%d' % src.count(anchor)
farm_js = open(FARMJS).read()
assert '__FARMV2' in farm_js and 'window.farmGenesis' in farm_js
src = src.replace(anchor,
    """foundSettlement(); spawnTomas();
logEvent('life','A new world condenses out of the noise. Seed '+SEED+'.');
logEvent('life','Grass spreads. Seeds fall. No one is watching — yet.');
/* ================= food system v2 (farming + scripted animals) ================= */
""" + farm_js + """
farmGenesis();
frame();""")

open(OUT, 'w').write(src)
print('v5 bytes:', len(src))
js = src[src.index('<script>') + 8:src.index('</script>')]
print('naive braces:', js.count('{') - js.count('}'))
print('FARMV2 present:', '__FARMV2' in src, '| farmGenesis calls:', src.count('farmGenesis()'))
