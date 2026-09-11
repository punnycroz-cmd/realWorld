#!/usr/bin/env python3
"""Natura v9: the living body.

Patches natura-v8.html -> natura-v9.html:
  - v.body: hydration/satiety/fatigue/sleepDebt/coreTemp/pain/illness/injury/
    stress/thermal/tissue, simulated in bodyTick() with real feedback loops
  - bodyEnv(): the body reads the actual world (rain, wet, hut, fire warmth)
  - bodyDrives(): numbers -> feelings (words); the brain never sees a stat
  - drink: a real physical action (walk to the creek, drink, hydration up)
  - survivalGuard(): deterministic, runs every tick — the body can interrupt
    the plan (thirst/hunger/exhaustion/temperature) without an LLM call
  - bodyTick() is the SINGLE source of truth for metabolism: the old v8
    hunger/energy/hp drains in soulTick() and metabolize() are removed
    (aging + death watch remain where they were)
  - eat/eggEat write through the body (satiety/lastMeal), not v.hunger
  - NV.order gains the 'drink' verb; snapFor().me gains feelings[]
"""
import re, sys

SRC = 'natura-v8.html'
DST = 'natura-v9.html'

s = open(SRC, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, count=1):
    global s
    found = s.count(old)
    assert found == count, f'expected {count}x, found {found}x: {old[:80]!r}'
    s = s.replace(old, new)

BODY = r'''
// ---------- v9: the living body ----------
// The simulation owns these values. The brain never sees them —
// it only receives feelings (words) via bodySummary().
function ensureBody(v){
  if(v.body) return v.body;
  v.body={
    hydration:1,                       // 0..1 body water
    satiety:clamp(v.hunger==null?1:v.hunger,0,1),
    fatigue:clamp(1-(v.energy==null?1:v.energy),0,1),
    sleepDebt:0,                       // hours of missed restorative sleep
    coreTemp:37.0,
    pain:0,
    illness:0,
    injury:0,
    stress:0,
    thermal:0,                         // |coreTemp-37|/2
    tissue:clamp(v.hp==null?1:v.hp,0.05,1),
    lastMeal:0,                        // hours since eating
    lastDrink:0                        // hours since drinking
  };
  return v.body;
}
function bodyEnv(v){
  const wx=Math.round(v.x/CS), wy=Math.round(v.y/CS);
  const {c,i}=cellChunk(wx,wy);
  const land=c.h[i]>=SEA;
  const hut=BUILD.huts.some(h=>Math.abs(wx-h.wx)<=h.w&&Math.abs(wy-h.wy)<=h.h);
  const fireD=FIREPIT.burn>0?Math.hypot(wx-FIREPIT.wx,wy-FIREPIT.wy):999;
  const fireWarm=fireD<8?Math.max(0,1-fireD/8)*Math.min(1,FIREPIT.burn/4):0;
  return {temp:c.temp[i],rain:c.rain[i],storm:c.storm[i],
    wet:land&&c.rain[i]>0.05,humid:c.hum[i],cloud:c.cloud[i],
    hut,fireWarm,groundWet:c.moist[i]};
}
function bodyTick(v,dtH){
  const b=ensureBody(v), e=bodyEnv(v);
  const J=v.job;
  const sleeping=J&&J.kind==='sleep';
  const resting=J&&J.kind==='rest';
  const working=!!J&&!sleeping&&!resting;
  const moving=J&&(
    J.kind==='goto'||J.kind==='take'||J.kind==='haul'||J.kind==='fell'||
    J.kind==='saw'||J.kind==='craft'||J.kind==='build_hut'||J.kind==='forage'||
    J.kind==='bond'||J.kind==='give'||J.kind==='say_to'||J.kind==='fish'||
    J.kind==='gather_wild'||J.kind==='till'||J.kind==='plant'||J.kind==='tend'||
    J.kind==='harvest'||J.kind==='collect'||J.kind==='slaughter'||J.kind==='hunt'||
    J.kind==='drink');
  const ageFactor=v.age<6?0.75:v.age<14?0.9:v.age>60?1.06:1;
  const exert=(working?1.8:0)+(moving?0.6:0)+(resting?0.15:0);
  const climateCold=clamp((18-e.temp)/18,0,2);
  const climateHot=clamp((e.temp-26)/18,0,2);
  // water loss
  const waterLoss=(0.006+0.0025*exert+0.004*climateHot+0.0015*climateCold)*dtH*ageFactor;
  b.hydration=clamp(b.hydration-waterLoss,0,1);
  // food / energy expenditure
  const pregnancy=v.pregnant>0?1.25:1;
  const calorieLoss=(0.006+0.004*exert)*dtH*ageFactor*pregnancy;
  b.satiety=clamp(b.satiety-calorieLoss,0,1);
  b.lastMeal+=dtH; b.lastDrink+=dtH;
  // sleep and rest
  if(sleeping){
    b.fatigue=clamp(b.fatigue-dtH/5.5,0,1);
    b.sleepDebt=Math.max(0,b.sleepDebt-dtH*1.15);
  }else if(resting){
    b.fatigue=clamp(b.fatigue-dtH/13,0,1);
    b.sleepDebt=Math.max(0,b.sleepDebt-dtH*0.22);
  }else{
    b.fatigue=clamp(b.fatigue+(0.004+0.014*exert+0.006*b.sleepDebt/8)*dtH*ageFactor,0,1);
    b.sleepDebt=Math.min(18,b.sleepDebt+dtH*0.018);
  }
  // core temperature seeks the environment's target
  const target=37+(e.temp-20)*0.045+e.fireWarm*0.65-(e.wet?0.55:0)+(e.hut?0.10:0);
  const tempRate=0.10+0.025*exert;
  b.coreTemp+=(target-b.coreTemp)*Math.min(1,tempRate*dtH);
  b.thermal=clamp(Math.abs(b.coreTemp-37)/2.0,0,1);
  // physiological stress accumulates from every deficit
  const physiologicalStress=(1-b.hydration)*0.9+(1-b.satiety)*0.75+b.fatigue*0.55
    +b.thermal*0.85+b.pain*0.6+b.illness*0.5;
  b.stress=clamp(b.stress+(physiologicalStress*0.18-b.stress*0.06)*dtH,0,1);
  // healing is slower under stress, hunger and thirst
  const recovery=Math.max(0,0.012-b.stress*0.008-(1-b.satiety)*0.006-(1-b.hydration)*0.004);
  b.injury=Math.max(0,b.injury-recovery*0.35*dtH);
  b.illness=Math.max(0,b.illness-recovery*0.55*dtH);
  // severe deficits damage tissue
  if(b.hydration<0.18||b.satiety<0.12||b.coreTemp<35.5||b.coreTemp>39.0){
    b.tissue=clamp(b.tissue-(0.010+0.020*b.stress)*dtH,0.05,1);
  }else{
    b.tissue=clamp(b.tissue+recovery*dtH,0.05,1);
  }
  // v8 compatibility: the old stats mirror the body, nothing else writes them
  v.hunger=b.satiety;
  v.energy=clamp(1-b.fatigue,0,1);
  v.hp=clamp(b.tissue,0.05,1);
  v.drives=bodyDrives(v);
}
// the sensation surface: numbers become feelings (words, never stats)
function bodyDrives(v){
  const b=ensureBody(v), out=[];
  if(b.hydration<0.12) out.push('your mouth is very dry; you urgently need water');
  else if(b.hydration<0.28) out.push('your mouth feels dry; you should drink soon');
  if(b.satiety<0.10) out.push('you feel weak and hollow with hunger; food is becoming urgent');
  else if(b.satiety<0.26) out.push('your stomach is empty and you need food soon');
  else if(b.lastMeal>10&&b.satiety<0.42) out.push('it has been many hours since you last ate');
  if(b.fatigue>0.82) out.push('your whole body feels heavy; you badly need sleep');
  else if(b.fatigue>0.62) out.push('you feel tired and your movements take effort');
  if(b.sleepDebt>7) out.push('you are carrying several nights of poor sleep');
  if(b.coreTemp<36.0) out.push('you feel chilled to the bone');
  else if(b.coreTemp>38.0) out.push('you feel overheated and flushed');
  if(b.pain>0.55) out.push('something hurts enough to distract you');
  else if(b.pain>0.18) out.push('there is a nagging soreness in your body');
  if(b.illness>0.55) out.push('you feel sick and drained');
  else if(b.illness>0.20) out.push('you feel slightly unwell');
  if(b.stress>0.72) out.push('you feel tense and unable to settle');
  else if(b.stress>0.42) out.push('a quiet strain sits in the back of your mind');
  if(!out.length) out.push('your body feels steady and capable');
  return out.slice(0,5);
}
function bodySummary(v){
  ensureBody(v);
  return {feelings:v.drives&&v.drives.length?v.drives:bodyDrives(v)};
}
function nearestWater(v,maxD){
  const wx=Math.round(v.x/CS), wy=Math.round(v.y/CS);
  let best=null, bd=maxD==null?1e9:maxD;
  for(const c of CREEK){
    const d=Math.hypot(c.wx-wx,c.wy-wy);
    if(d<bd){ bd=d; best=c; }
  }
  return best?{wx:best.wx,wy:best.wy}:null;
}
// deterministic survival: the body interrupts the plan — no LLM call spent
function survivalGuard(v){
  const b=ensureBody(v), J=v.job;
  if(J&&(J.kind==='drink'||J.kind==='eat')) return false;
  if(b.hydration<0.10){                       // critical thirst
    const w=nearestWater(v,40);
    if(w){
      v.job={kind:'drink',wx:w.wx,wy:w.wy,t:0};
      v.lastResult={kind:'body',note:'thirst interrupted your plan'};
      return true;
    }
  }
  if(b.satiety<0.08&&                        // critical hunger
     ((v.inv.food||0)>0||(v.inv.berries||0)>=2||(v.inv.eggs||0)>=2)){
    v.job={kind:'eat',t:0};
    v.lastResult={kind:'body',note:'hunger interrupted your plan'};
    return true;
  }
  if(b.fatigue>0.96&&                        // severe exhaustion
     (!J||J.kind==='work'||J.kind==='fell'||J.kind==='saw'||J.kind==='craft'||J.kind==='forage')){
    v.job={kind:'sleep'};
    v.lastResult={kind:'body',note:'exhaustion forced you to rest'};
    return true;
  }
  if((b.coreTemp<35.5||b.coreTemp>39.0)&&     // dangerous temperature: shelter, then stop
     (!J||J.kind!=='sleep')){
    const h=BUILD.huts[0];
    const dest=h?{wx:h.wx+1,wy:h.wy}:(FIREPIT.burn>0?{wx:FIREPIT.wx,wy:FIREPIT.wy}:null);
    const wx0=Math.round(v.x/CS), wy0=Math.round(v.y/CS);
    if(dest&&Math.hypot(dest.wx-wx0,dest.wy-wy0)>3){
      v.job={kind:'goto',wx:dest.wx,wy:dest.wy,label:'seeking shelter',t:0};
    }else{
      v.job={kind:'rest',t:0};
    }
    v.lastResult={kind:'body',note:'your body forces you to stop and shelter'};
    return true;
  }
  return false;
}
'''

# P1: insert the body system just before the original soulTick
rep("function soulTick(v,dtH){", BODY + "\nfunction soulTick(v,dtH){")

# P2: remove the old v8 inline hunger/energy drain (bodyTick owns it now)
rep("""  const drain=v.age<6?48:96;
  v.hunger=clamp(v.hunger-dtH/drain*(v.pregnant>0?1.35:1),0,1);
  v.energy=clamp(v.energy+(sleeping?dtH/6:resting?dtH/10:working?-dtH/26:-dtH/48),0,1);
""", "")

# P6: metabolize() becomes aging + death watch only (single source of truth)
# (runs before P3: its block contains one copy of the hp-drift line)
rep("""function metabolize(v,dtH){   // the body's native upkeep; farming is honest work too
  const drain=v.age<6?48:96;
  v.hunger=clamp(v.hunger-dtH/drain*(v.pregnant>0?1.35:1),0,1);
  v.energy=clamp(v.energy-dtH/26,0,1);
  v.age+=dtH/8760;
  const maxHp=v.age>70?Math.max(0.08,1-(v.age-70)*0.12):1;
  v.hp=clamp(v.hp+(v.hunger<=0?-dtH/60:v.hunger>0.3?dtH/120:0),0.05,1);
  v.hp=Math.min(v.hp,maxHp);""",
"""function metabolize(v,dtH){   // aging + death watch (farm path); bodyTick() owns hunger/energy/hp
  v.age+=dtH/8760;
  const maxHp=v.age>70?Math.max(0.08,1-(v.age-70)*0.12):1;
  v.hp=Math.min(v.hp,maxHp);""")

# P3: remove the old v8 hp drift (bodyTick owns tissue now; maxHp line stays)
rep("  v.hp=clamp(v.hp+(v.hunger<=0?-dtH/60:v.hunger>0.3?dtH/120:0),0.05,1);\n", "")

# P4: eat writes through the body
rep("""      if(v.inv.food>0){ v.inv.food--; v.hunger=1; }
      else if(v.inv.berries>=2){ v.inv.berries-=2; v.hunger=1; }""",
"""      const _bd=ensureBody(v);
      if(v.inv.food>0){ v.inv.food--; _bd.satiety=1; _bd.lastMeal=0; }
      else if(v.inv.berries>=2){ v.inv.berries-=2; _bd.satiety=Math.min(1,_bd.satiety+0.6); _bd.lastMeal=0; }""")

# P5: the drink job, right before sleep in the dispatch chain
rep("""  }else if(J.kind==='sleep'){""",
"""  }else if(J.kind==='drink'){
    const target=J.wx!=null?{wx:J.wx,wy:J.wy}:null;
    if(target&&!near(target.wx,target.wy,1.8)){ v.act='walk'; v.actLabel='going to water'; at(target.wx,target.wy); return; }
    v.act='drink'; v.actLabel='drinking from the creek'; J.t+=dtH;
    if(J.t>=0.20){
      const _bd2=ensureBody(v);
      _bd2.hydration=Math.min(1,_bd2.hydration+0.75);
      _bd2.lastDrink=0;
      v.lastResult={kind:'drink',note:'cool water, thirst eased'};
      v.job=null;
    }
  }else if(J.kind==='sleep'){""")


# P7: wrapper soulTick runs guard + bodyTick first, on every path
rep("""soulTick=function(v,dtH){
  if(!v.speed) v.speed=()=>70*(v.age<14?0.55:1);   // bodies always know their pace
  const J=v.job;""",
"""soulTick=function(v,dtH){
  if(!v.speed) v.speed=()=>70*(v.age<14?0.55:1);   // bodies always know their pace
  survivalGuard(v);   // the body can interrupt the plan — no LLM call spent
  bodyTick(v,dtH);    // single source of truth for metabolism
  const J=v.job;""")

# P8: egg-eating writes through the body
rep("    if(J.t>=0.25){ v.inv.eggs-=2; v.hunger=1; v.job=null; }",
    "    if(J.t>=0.25){ v.inv.eggs-=2; const _be=ensureBody(v); _be.satiety=Math.min(1,_be.satiety+0.5); _be.lastMeal=0; v.job=null; }")

# P9: NV.order gains the drink verb
rep("""    if(vb==='eat'){
      if(v.inv.food<=0&&v.inv.berries<2) return 'nothing to eat';
      v.job={kind:'eat',t:0}; return 'ok';
    }""",
"""    if(vb==='eat'){
      if(v.inv.food<=0&&v.inv.berries<2) return 'nothing to eat';
      v.job={kind:'eat',t:0}; return 'ok';
    }
    if(vb==='drink'){
      if(same('drink')) return 'already drinking';
      const w=nearestWater(v,80);
      if(!w) return 'no water near';
      v.job={kind:'drink',wx:w.wx,wy:w.wy,t:0}; return 'ok';
    }""")

# P10: snapFor().me gains feelings[] (the brain's only view of the body)
rep("        carrying:v.carry.slice(),carryMax:v.carryMax,thought:v.thought,",
    "        carrying:v.carry.slice(),carryMax:v.carryMax,thought:v.thought,\n        feelings:bodySummary(v).feelings,")

# P11: the wild-ecology hooks wrapper must run the same single upkeep —
# otherwise fishing/gathering villagers get no body, or get it twice
rep("""const _soulTickW=soulTick;
soulTick=function(v,dtH){
  const J=v.job;
  if(J&&(J.kind==='fish'||J.kind==='gather_wild')){
    if(!v.speed) v.speed=()=>70*(v.age<14?0.55:1);
    wildJobTick(v,dtH);
    if(villagers.indexOf(v)>=0&&window.metabolize) window.metabolize(v,dtH);
    return;
  }
  return _soulTickW(v,dtH);
};""",
"""const _soulTickW=soulTick;
soulTick=function(v,dtH){
  const J0=v.job;
  if(J0&&(J0.kind==='fish'||J0.kind==='gather_wild')){
    if(!v.speed) v.speed=()=>70*(v.age<14?0.55:1);
    survivalGuard(v);   // same single upkeep as every other path
    bodyTick(v,dtH);
    const J=v.job;
    if(J&&(J.kind==='fish'||J.kind==='gather_wild')){
      wildJobTick(v,dtH);
      if(villagers.indexOf(v)>=0&&window.metabolize) window.metabolize(v,dtH);
      return;
    }
    return _soulTickF(v,dtH);   // the body interrupted the wild job: normal dispatch
  }
  return _soulTickW(v,dtH);
};""")

# bump the title marker
rep("<title>Natura v7 — a living world</title>", "<title>Natura v9 — the living body</title>")

open(DST, 'w', encoding='utf-8').write(s)
print(f'v8 {n0} -> v9 {len(s)} bytes')
print('patches applied: P1..P10')
