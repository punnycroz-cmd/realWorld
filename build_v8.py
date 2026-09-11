#!/usr/bin/env python3
"""build_v8.py — natura-v7.html -> natura-v8.html (the body model).

v8 adds, on top of v7:
  - bodily primitives: take / drop / use (hands, not verb-tickets)
  - a real campfire: FIREPIT with burn-hours; 'use log on firepit' feeds it
  - a creek carved west of the settlement + loose stones nearby
  - dam physics: enough stones placed in contiguous creek cells -> DAM.formed,
    a still pool forms, fishing near the pool yields +1
  - snapFor extensions: item types+positions, water {creek, dammed, pool},
    fire {burn}
Everything else (23 verbs, farming, wildlife, minds' memory) is untouched.
"""
import sys

SRC = 'natura-v7.html'
DST = 'natura-v8.html'

src = open(SRC).read()
out = src
n = 0

def rep(old, new, expect=1):
    global out, n
    c = out.count(old)
    assert c == expect, f'anchor x{c} (expected x{expect}): {old[:70]!r}'
    out = out.replace(old, new)
    n += 1

# ---- R1: v8 globals ----
rep(
"const items=[]; let itemSeq=1;                 // ground items: {id,type:'log',x,y}",
"""const items=[]; let itemSeq=1;                 // ground items: {id,type:'log',x,y}
/* ---- v8: the body model ---- */
const FIREPIT={wx:0,wy:0,burn:0};           // campfire by the hut; burn = hours of flame left
const CREEK=[];                             // creek water cells in flow order [{wx,wy}]
const DAM={stones:{},formed:false,pool:null}; // stones: "wx,wy" -> n placed""")

# ---- R2: take / drop / use verbs (inserted at the top of the dispatch) ----
rep(
"    if(vb==='wait'){ return 'waiting'; }",
"""    if(vb==='wait'){ return 'waiting'; }
    /* v8 bodily primitives: hands, not verb-tickets */
    if(vb==='take'){
      const it=items.find(e=>e.id===o.id);
      if(!it) return 'nothing there to take';
      if(Math.hypot(it.x-v.x,it.y-v.y)/CS>2.5) return 'too far to reach';
      if(same('take',()=>v.job.id===o.id)) return 'already taking it';
      v.job={kind:'take',id:o.id,t:0}; return 'ok';
    }
    if(vb==='drop'){
      const what=String(o.what||'');
      if(!what) return 'drop what?';
      const ci=v.carry.indexOf(what);
      if(ci>=0) v.carry.splice(ci,1);
      else if((v.inv[what]||0)>0) v.inv[what]--;
      else return 'not carrying '+what;
      items.push({id:itemSeq++,type:what,x:v.x,y:v.y});
      v.lastResult='dropped '+what; return 'dropped '+what;
    }
    if(vb==='use'){
      const what=String(o.what||''), on=String(o.on||'');
      const consume=()=>{
        const ci=v.carry.indexOf(what);
        if(ci>=0){ v.carry.splice(ci,1); return true; }
        if((v.inv[what]||0)>0){ v.inv[what]--; return true; }
        return false;
      };
      if(on==='firepit'){
        if(what!=='log'&&what!=='timber') return 'that will not burn well';
        if(!consume()) return 'no '+what+' to burn';
        FIREPIT.burn=Math.min(30,FIREPIT.burn+4);
        v.lastResult='the fire takes the '+what+', flames rise';
        return 'the fire takes the '+what;
      }
      if(on==='creek'||on==='water'){
        if(what!=='stone') return 'that will not hold back water';
        if(!consume()) return 'no stone in hand';
        const vx=Math.round(v.x/CS), vy=Math.round(v.y/CS);
        let best=null,bd=1e9;
        for(const c of CREEK){ const d=Math.hypot(c.wx-vx,c.wy-vy); if(d<bd){ bd=d; best=c; } }
        if(!best||bd>4) return 'no creek water in reach';
        const k=best.wx+','+best.wy;
        DAM.stones[k]=(DAM.stones[k]||0)+1;
        checkDam();
        v.lastResult='placed a stone in the creek ('+DAM.stones[k]+' here)';
        return 'placed a stone in the creek';
      }
      return 'nothing happens';
    }""")

# ---- R3: take job resolution in villagerTick ----
rep(
"  }else if(J.kind==='haul'){",
"""  }else if(J.kind==='take'){
    const it=items.find(e=>e.id===J.id);
    if(!it){ v.job=null; return; }
    v.act='take'; v.actLabel='picking up '+it.type; J.t+=dtH;
    if(J.t>=0.2){
      const k=items.indexOf(it); if(k>=0) items.splice(k,1);
      if(v.carry.length<v.carryMax) v.carry.push(it.type);
      else v.inv[it.type]=(v.inv[it.type]||0)+1;
      v.lastResult='took '+it.type; v.job=null;
    }
  }else if(J.kind==='haul'){""")

# ---- R4: snapFor — richer items, water, fire ----
rep(
"    see:{trees,bushes,logs:items.map(e=>({id:e.id,d:Math.round(Math.hypot(e.x-v.x,e.y-v.y)/CS)}))},",
"""    see:{trees,bushes,logs:items.map(e=>({id:e.id,type:e.type,
        wx:Math.round(e.x/CS),wy:Math.round(e.y/CS),
        d:Math.round(Math.hypot(e.x-v.x,e.y-v.y)/CS)}))},
    water:(()=>{
      const list=CREEK.map(c=>({wx:c.wx,wy:c.wy,
        d:Math.round(Math.hypot(c.wx-wx,c.wy-wy))}))
        .filter(c=>c.d<=60).sort((a,b)=>a.d-b.d).slice(0,5);
      return {dammed:DAM.formed,pool:DAM.pool,
        stonesPlaced:Object.keys(DAM.stones).length,creek:list};
    })(),
    fire:{burn:+FIREPIT.burn.toFixed(1),wx:FIREPIT.wx,wy:FIREPIT.wy},""")

# ---- R5: firepit burn decay ----
rep(
"simTick=function(dtH){ wildTick(dtH); return _simTickW(dtH); };",
"""simTick=function(dtH){ wildTick(dtH); return _simTickW(dtH); };
const _simTickV8=simTick;
simTick=function(dtH){
  if(FIREPIT.burn>0) FIREPIT.burn=Math.max(0,FIREPIT.burn-dtH);
  return _simTickV8(dtH);
};""")

# ---- R6: bNew handler calls v8genesis ----
rep(
"  SETTLE.founded=false; foundSettlement();",
"  SETTLE.founded=false; foundSettlement();\n  v8genesis();")

# ---- R7: initial page-load calls v8genesis ----
rep(
"""foundSettlement();
logEvent('life','A new world condenses out of the noise. Seed '+SEED+'.');
logEvent('life','Grass spreads. Seeds fall. No one is watching — yet.');""",
"""foundSettlement();
v8genesis();
logEvent('life','A new world condenses out of the noise. Seed '+SEED+'.');
logEvent('life','Grass spreads. Seeds fall. No one is watching — yet.');""")

# ---- R8: v8genesis + checkDam (before food system v2) ----
rep(
"/* ================= food system v2 (farming + scripted animals) ================= */",
"""/* ================= natura v8: creek, stones, firepit ================= */
function checkDam(){
  if(DAM.formed) return;
  let run=0;
  for(const c of CREEK){
    if((DAM.stones[c.wx+','+c.wy]||0)>=3) run++; else run=0;
    if(run>=4){
      DAM.formed=true; DAM.pool={wx:c.wx,wy:c.wy};
      logEvent('life','Stones choke the creek — the water slows and pools behind them.');
      break;
    }
  }
}
function v8genesis(){
  // carve a meandering creek west of the settlement
  CREEK.length=0; DAM.stones={}; DAM.formed=false; DAM.pool=null;
  const sx=SETTLE.wx, sy=SETTLE.wy, cx0=sx-26;
  for(let wy=sy-60;wy<=sy+60;wy++){
    const wx=cx0+Math.round(Math.sin(wy*0.11+(SEED%7))*4+Math.sin(wy*0.031)*3);
    const {c,i}=cellChunk(wx,wy);
    c.h[i]=Math.min(c.h[i],SEA-0.06);
    c.tStage[i]=0; c.tHp[i]=0; c.bush[i]=0; c.snag[i]=0;
    CREEK.push({wx,wy});
  }
  // campfire by the bench, embers still warm
  FIREPIT.wx=BUILD.bench.wx; FIREPIT.wy=BUILD.bench.wy; FIREPIT.burn=6;
  // loose stones scattered near the creek (old ones cleared on re-genesis)
  for(let k=items.length-1;k>=0;k--) if(items[k].type==='stone') items.splice(k,1);
  let placed=0, guard=0;
  while(placed<12&&guard++<400){
    const c=CREEK[Math.floor(hash2(guard,3,SEED+900)*CREEK.length)];
    const wx=c.wx+Math.round((hash2(guard,7,SEED+901)-0.5)*12);
    const wy=c.wy+Math.round((hash2(guard,11,SEED+902)-0.5)*12);
    const cc=cellChunk(wx,wy);
    if(cc.c.h[cc.i]>=SEA+0.02){ items.push({id:itemSeq++,type:'stone',x:wx*CS,y:wy*CS}); placed++; }
  }
}
/* ================= food system v2 (farming + scripted animals) ================= */""")

# ---- R9: pool fishing bonus ----
rep(
"      const y=h<SEA-0.12?3:2;",
"""      let y=h<SEA-0.12?3:2;
      if(DAM.formed&&DAM.pool&&Math.hypot(J.wx-DAM.pool.wx,J.wy-DAM.pool.wy)<9) y+=1; // still pool""")

open(DST, 'w').write(out)
print(f'v8 built: {n} patches -> {DST}')
