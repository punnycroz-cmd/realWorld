#!/usr/bin/env python3
"""natura-v6.html -> natura-v7.html : third spring.

- gainSkill initializes missing skills (hunt/fish/... no longer NaN).
- Genesis is founder-neutral: the site is prepared, no hardcoded Marta/Tomas.
  Founders arrive via NV.addTraveler at launch.
- Fresh valley seed.
Anchors are asserted unique before replacement.
"""
BASE = '/home/hatch/workspace/world-sim/natura-v6.html'
OUT = '/home/hatch/workspace/world-sim/natura-v7.html'

src = open(BASE).read()

def rep(old, new):
    global src
    n = src.count(old)
    assert n == 1, 'ANCHOR x%d: %s' % (n, old[:70])
    src = src.replace(old, new)

# ---- titles ----
rep('<title>Natura v6 — a living world</title>', '<title>Natura v7 — a living world</title>')
rep('<span class="title">NATURA v6</span>', '<span class="title">NATURA v7</span>')
rep('NATURA v6 — a watchmaker world sim.', 'NATURA v7 — a watchmaker world sim.')

# ---- gainSkill: initialize missing skills instead of NaN ----
rep("function gainSkill(v,k,amt){ v.skills[k]=clamp(v.skills[k]+(amt||0.04)*(v.age<14?2:1),0,1); }",
    "function gainSkill(v,k,amt){ v.skills[k]=clamp((v.skills[k]||0)+(amt||0.04)*(v.age<14?2:1),0,1); }")

# ---- fresh valley seed ----
rep("let SEED=20260910;", "let SEED=20260911;")

# ---- founder-neutral settlement: site prep only, no hardcoded villagers ----
rep("""  addVillager('Marta','F',34,(sx-1)*CS,(sy+1)*CS,
    {dress:'#3a5a8a',skin:'#e8b88a',hat:'#c8a04a',hair:'#5a3a22'});
  SETTLE.founded=true;
  logEvent('life','A settler raises a hut on the green. Her name is Marta.');""",
    """  SETTLE.founded=true;
  logEvent('life','A hut stands on the green, weathered but sound. No one is home — yet.');""")

# ---- genesis: no hardcoded founders ----
rep("foundSettlement(); spawnTomas();\nlogEvent('life','A new world condenses",
    "foundSettlement();\nlogEvent('life','A new world condenses")
rep("  SETTLE.founded=false; foundSettlement(); spawnTomas();",
    "  SETTLE.founded=false; foundSettlement();")

# ---- design credit: no resurrection by attribution ----
rep("DESIGNS.table={name:'table',timber:4,hours:6,sprite:null,by:'Marta',made:true};",
    "DESIGNS.table={name:'table',timber:4,hours:6,sprite:null,by:'unknown',made:true};")

open(OUT, 'w').write(src)
print('v7 bytes:', len(src))
js = src[src.index('<script>') + 8:src.index('</script>')]
print('naive braces:', js.count('{') - js.count('}'))
print('Marta remnants:', src.count("'Marta'"), '| spawnTomas calls:', src.count('spawnTomas()'))
