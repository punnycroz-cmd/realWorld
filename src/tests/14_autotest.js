/* =====================================================================
   PART 14 AUTOTEST
   ===================================================================== */
function mkTestV14(name, wx, wy, extra){
  const v = mkTestV13(name, wx, wy, extra);
  ensureSkills(v);
  v.talents = { strong: [], weak: [] };
  v.workPrio = {};
  v.clothes = { base: null, outer: null, feet: null };
  syncWounds(v);
  return v;
}
const __runAutoTest14 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest14();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const runPlan = (v, maxIter) => {
    for(let i = 0; i < (maxIter || 400) && v.plan && v.plan.length; i++) planTick(v, 0.1);
  };

  // 14.1 poultice stops bleeding
  let t = mkTestV14('TMed1', 2, 5);
  addWound(t, 'arm', 0.5);
  const w0 = t.body.wounds[0];
  const bled = w0.bleed > 0.05;
  t.inv.poultice = 1;
  t.plan = [{ verb: 'tend', person: t.name }];
  runPlan(t);
  log(bled && w0.bleed === 0 && w0.dressed === true && !t.plan.length,
    'med14: poultice stops bleeding via tend', 'bleed=' + w0.bleed.toFixed(2));
  rmTestV13(t);

  // 14.2 infection rises untreated, falls when dressed
  t = mkTestV14('TMed2', 2, 6);
  addWound(t, 'arm', 0.4);
  const w2 = t.body.wounds[0];
  for(let i = 0; i < 60; i++) woundTick(t, 0.5); // 30h
  const infHigh = w2.inf > 0.25;
  t.inv.poultice = 1;
  t.plan = [{ verb: 'tend', person: t.name }];
  runPlan(t);
  for(let i = 0; i < 40; i++) woundTick(t, 0.5); // 20h dressed
  log(infHigh && w2.inf < 0.25 && w2.dressed === true,
    'med14: infection rises untreated, poultice reverses it',
    'inf was high=' + infHigh + ' now=' + w2.inf.toFixed(2));
  rmTestV13(t);

  // 14.3 splint + rest heals fracture, downed clears
  t = mkTestV14('TMed3', 3, 5);
  addWound(t, 'leg', 0.8);
  const wasDown = !!t.downed;
  t.inv.splint = 1;
  t.plan = [{ verb: 'tend', person: t.name }];
  runPlan(t);
  const splinted = t.body.wounds.some(w => w.splint);
  t.state = 'rest'; t.body.satiety = 0.8;
  for(let i = 0; i < 120; i++){ woundTick(t, 1); downedTick(t, 1); } // 5 days rest
  log(wasDown && splinted && !t.downed,
    'med14: splint + rest heals fracture, downed clears', 'downed=' + !!t.downed);
  rmTestV13(t);

  // 14.4 downed + rescue -> carried to shelter
  const tv = mkTestV14('TVic', 7, 13);
  const tr = mkTestV14('TResc', 8, 13);
  tv.body.blood = 0.6;
  setDowned(tv, 'bleeding', 'test wound');
  tr.plan = [{ verb: 'rescue', person: tv.name }];
  runPlan(tr, 800);
  log(tv.inBuilding === true && !tr.carrying && !tr.plan.length,
    'med14: rescue carries downed to shelter', 'inBuilding=' + tv.inBuilding);
  rmTestV13(tv); rmTestV13(tr);

  // 14.5 wolf hunts lone villager -> villager flees
  const tl = mkTestV14('TLone', 10, 10);
  tl.brainControlled = false;
  const wl = spawnAnimal('wolf', (10 + 8) * CS + 16, 10 * CS + 16);
  wl.hunger = 0.9;
  W.tod = 23;
  for(let i = 0; i < 5; i++) wolfBrain(wl, 0.03);
  const engaged = wl.state === 'stalk' || wl.state === 'attack'; // hunting = stalking or attacking
  survivalGuard(tl);
  const fled = tl.plan.length > 0 && tl.plan[0].verb === 'go' && tl.plan[0].guard === true;
  { const i = ANIMALS.indexOf(wl); if(i >= 0) ANIMALS.splice(i, 1); }
  W.tod = 12;
  log(engaged && fled, 'wild14: wolf hunts lone villager, villager flees to shelter',
    'wolf=' + wl.state + ' fled=' + fled);
  rmTestV13(tl);

  // 14.6 hunt + butcher -> meat + hide
  const th = mkTestV14('THunt', 12, 10);
  th.equippedTool = { kind: 'sword', name: 'Sword', icon: '', desc: '' };
  const boar = spawnAnimal('boar', 12 * CS + 30, 10 * CS + 16);
  th.plan = [{ verb: 'hunt', kind: 'boar' }];
  runPlan(th, 600);
  const carcassMade = CARCASSES.length > 0 || boar.dead;
  th.plan = [{ verb: 'butcher' }];
  runPlan(th, 400);
  const gotGoods = (th.inv.rawMeat || 0) >= 2 && (th.inv.hide || 0) >= 1;
  { const i = ANIMALS.indexOf(boar); if(i >= 0) ANIMALS.splice(i, 1); }
  CARCASSES.length = 0;
  log(carcassMade && gotGoods, 'wild14: hunt boar -> butcher -> meat + hide',
    'meat=' + (th.inv.rawMeat || 0) + ' hide=' + (th.inv.hide || 0));
  rmTestV13(th);

  // 14.7 skill XP + level effect
  const ts = mkTestV14('TSkill', 2, 7);
  const m0 = skillMult(ts, 'farming');
  gainXP(ts, 'farming', 250);
  const m1 = skillMult(ts, 'farming');
  log(skillLvl(ts, 'farming') >= 2 && m1 > m0,
    'skill14: XP gain levels up, multiplier rises', 'lvl=' + skillLvl(ts, 'farming').toFixed(1));
  rmTestV13(ts);

  // 14.8 build consumes materials
  const tb = mkTestV14('TBuild', 6, 6);
  const f0 = FENCES.length;
  tb.inv.log = 10;
  tb.plan = [{ verb: 'build', what: 'fence' }];
  runPlan(tb, 500);
  log(FENCES.length === f0 + 1 && (tb.inv.log || 0) === 6,
    'build14: fence consumes 4 logs', 'fences=' + FENCES.length + ' logs left=' + (tb.inv.log || 0));
  { FENCES.splice(f0, 1); }
  rmTestV13(tb);

  // 14.9 clothing insulation math
  const tc = mkTestV14('TCloth', 2, 8);
  const insNaked = clothingInsul(tc);
  tc.clothes.outer = { type: 'coat', dur: 1 };
  const insCoat = clothingInsul(tc);
  tc.body.wetness = 0.9;
  const insWet = clothingInsul(tc);
  log(insNaked === 0 && insCoat > 0.8 && insWet < insCoat * 0.5,
    'cloth14: coat insulates, wet clothing loses insulation',
    'naked=' + insNaked.toFixed(2) + ' coat=' + insCoat.toFixed(2) + ' wet=' + insWet.toFixed(2));
  rmTestV13(tc);

  // 14.10 assignWork bridge
  const tw = mkTestV14('TWork', 2, 9);
  const aw = window.__aiBridge.assignWork('TWork', 'farm', 9);
  const gw = window.__aiBridge.getWork('TWork');
  log(aw.ok === true && gw && gw.farm === 9,
    'skill14: assignWork/getWork round-trip');
  rmTestV13(tw);

  // 14.11 craft poultice from herbs
  const tcr = mkTestV14('TCraft', 3, 7);
  tcr.inv.herb = 4;
  tcr.plan = [{ verb: 'craft', what: 'poultice' }];
  runPlan(tcr, 300);
  log((tcr.inv.poultice || 0) === 1 && (tcr.inv.herb || 0) === 2,
    'med14: craft poultice consumes 2 herbs', 'poultice=' + (tcr.inv.poultice || 0));
  rmTestV13(tcr);

  // 14.12 intent patterns for new verbs
  const ti = mkTestV14('TIntent', 3, 8);
  const ri1 = window.__aiBridge.postIntent('TIntent', 'tend to Marta');
  const v1 = ti.plan.map(s => s.verb).join(',');
  ti.plan = [];
  const ri2 = window.__aiBridge.postIntent('TIntent', 'hunt wolves');
  const v2 = ti.plan.map(s => s.verb + ':' + (s.kind || '')).join(',');
  ti.plan = [];
  const ri3 = window.__aiBridge.postIntent('TIntent', 'build a fence');
  const v3 = ti.plan.map(s => s.verb + ':' + (s.what || '')).join(',');
  ti.plan = [];
  log(ri1.ok && v1.indexOf('tend') >= 0 && ri2.ok && v2.indexOf('hunt:wolf') >= 0 && ri3.ok && v3.indexOf('build:fence') >= 0,
    'intent14: tend/hunt/build-fence intents compile', v1 + ' | ' + v2 + ' | ' + v3);
  rmTestV13(ti);

  const passed = res.filter(r => r.ok).length;
  el.textContent += '\n==== part14 ' + passed + '/' + res.length + ' passed ====\n';
};
