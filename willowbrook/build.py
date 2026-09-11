#!/usr/bin/env python3
"""Build the integrated index.html: patch game code + embed PA art modules."""
import os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'index.html')
BAK = os.path.join(HERE, 'index.html.bak-v1')
DEV = ['pa-core.js','pa-terrain.js','pa-veg.js','pa-props.js','pa-buildings.js','pa-chars.js','pa-fx.js','pa-integrate.js']

def patch_once(src, old, new, name):
    n = src.count(old)
    if n != 1:
        print(f'PATCH {name}: expected 1 match, found {n}'); sys.exit(1)
    return src.replace(old, new)

def main():
    if not os.path.exists(BAK):
        shutil.copy2(SRC, BAK)
        print('backup ->', BAK)
    with open(SRC, encoding='utf-8') as f:
        html = f.read()

    # 1. buildWorld: don't prerender ground yet (PA art not built)
    html = patch_once(html,
        "  buildObjects();\n  buildCollision();\n  buildInteractables();\n  prerenderGround();\n}",
        "  buildObjects();\n  buildCollision();\n  buildInteractables();\n}",
        'buildWorld-no-prerender')

    # 2. buildCollision: decor collision
    html = patch_once(html,
        "    else if(o.kind==='sign') solidRectPx(o.x-4,o.y-4,8,8);",
        "    else if(o.kind==='sign') solidRectPx(o.x-4,o.y-4,8,8);\n"
        "    else if(o.kind==='haybale'||o.kind==='firewood') solidRectPx(o.x-11,o.y-11,22,22);\n"
        "    else if(o.kind==='flowerbox') solidRectPx(o.x-12,o.y-8,24,10);",
        'decor-collision')

    # 3. update(): FX update hook
    html = patch_once(html,
        "  ambientAudio(dt);\n  G.frame++;\n}",
        "  paFxUpdate(dt);\n  ambientAudio(dt);\n  G.frame++;\n}",
        'fx-update')

    # 4. update(): particle loop -> PA version
    html = patch_once(html,
        "  // particles\n  for(let i=G.particles.length-1;i>=0;i--){\n"
        "    const p=G.particles[i];\n"
        "    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=160*dt; p.life-=dt*1.4;\n"
        "    if(p.life<=0) G.particles.splice(i,1);\n  }\n",
        "  paUpdateParticles(dt);\n",
        'particle-update')

    # 5. render(): water before drawables, in world space
    html = patch_once(html,
        "  ctx.translate(-cx,-cy);\n",
        "  ctx.translate(-cx,-cy);\n  paDrawWater(ctx,cx,cy,CW,CH);\n",
        'water-draw')

    # 6. render(): building draws with float darkness for day/night blend
    html = patch_once(html,
        "      drawBuilding(ctx,d.b,dark>0.45);",
        "      drawBuilding(ctx,d.b,dark);",
        'building-dark')

    # 7. render(): particle draw -> PA version
    html = patch_once(html,
        "  // particles\n  for(const p of G.particles){\n"
        "    ctx.globalAlpha=clamp(p.life,0,1);\n"
        "    ctx.fillStyle=p.color; ctx.fillRect(p.x-2,p.y-2,4,4);\n  }\n  ctx.globalAlpha=1;\n",
        "  paDrawParticles(ctx);\n",
        'particle-draw')

    # 8. boot(): build art, then prerender ground
    html = patch_once(html,
        "    G.villagers[0].isNPC=false;\n    setLoad('Lighting lamps…');",
        "    G.villagers[0].isNPC=false;\n    setLoad('Painting the village…');\n"
        "    PAinit();\n    prerenderGround();\n    setLoad('Lighting lamps…');",
        'boot-paint')

    # 9. expose PA for tests
    html = patch_once(html,
        "update,controlledVillager,version:'1.0.0'};",
        "update,controlledVillager,version:'2.0.0',PA};",
        'version-pa')

    # 10. render(): define villager merge helper BEFORE the drawables loop,
    #     and remove the old separate villager pass.
    html = patch_once(html,
        "  // static drawables (culled)\n",
        "  // villagers merge into the y-sorted pass (true y-sort)\n"
        "  const vs=G.villagers.slice().sort((a,b)=>a.y-b.y);\n"
        "  let vi=0;\n"
        "  const drawVsUpTo=(y)=>{ while(vi<vs.length&&vs[vi].y<=y){\n"
        "    const v=vs[vi++];\n"
        "    if(v.x<x0||v.x>x1||v.y<y0-80||v.y>y1) continue;\n"
        "    drawVillager(ctx,v); } };\n"
        "  // static drawables (culled)\n",
        'ysort-def')

    # 11. render(): flush villagers inside/after the drawables loop
    html = patch_once(html,
        "  for(const d of drawables){\n"
        "    if(d.b){",
        "  for(const d of drawables){\n"
        "    drawVsUpTo(d.y);\n"
        "    if(d.b){",
        'ysort-flush')

    html = patch_once(html,
        "  // villagers sorted by y\n"
        "  const vs=G.villagers.slice().sort((a,b)=>a.y-b.y);\n"
        "  for(const v of vs){\n"
        "    if(v.x<x0||v.x>x1||v.y<y0-80||v.y>y1) continue;\n"
        "    drawVillager(ctx,v);\n"
        "  }\n"
        "  paDrawParticles(ctx);",
        "  drawVsUpTo(1e9);\n"
        "  paDrawParticles(ctx);",
        'ysort-final')

    # 12. shop E-buy fix (Pass 3 found: early return skipped shopKey, so buying
    # bread with E never worked in the original game)
    html = patch_once(html,
        "  if(e.code==='KeyE'){\n"
        "    if(G.dialogue&&G.dialogue.shop) return;\n"
        "    doInteractKey();\n"
        "  }",
        "  if(e.code==='KeyE'){\n"
        "    if(G.dialogue&&G.dialogue.shop){ shopKey(e.code); return; }\n"
        "    doInteractKey();\n"
        "  }",
        'shop-ebuy-fix')

    # 13. embed PA modules before the debug API section
    mods = []
    for fn in DEV:
        p = os.path.join(HERE, 'dev', fn)
        with open(p, encoding='utf-8') as f:
            mods.append(f'\n/* ================= {fn} ================= */\n' + f.read())
    bundle = ''.join(mods)
    html = patch_once(html,
        "// debug / test API",
        "/* =====================================================================\n"
        "   PIXEL-ART MODULES (embedded build) — original hand-coded sprites\n"
        "   ===================================================================== */"
        + bundle + "\n// debug / test API",
        'embed-modules')

    with open(SRC, 'w', encoding='utf-8') as f:
        f.write(html)
    print('built OK, bytes:', len(html))

if __name__ == '__main__':
    main()
