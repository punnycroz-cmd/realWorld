/* ---- PART 13 test factory ---- */
function mkTestV13(name, wx, wy, extra){
  const v = Object.assign({
    name, role:'Test', homeId:'inn',
    x:wx * CS + 16, y:wy * CS + 16, targetX:null, targetY:null,
    face:0, state:'idle', moving:false, walkPhase:0, seed:1,
    isNPC:true, inBuilding:false, canSwim:true, swimSkill:0.5, swimReason:'',
    workProgress:0, triumphT:0,
    equippedTool:{ kind:'none', name:'', icon:'', desc:'' },
    mood:0.9, hunger:0.9, energy:0.9, hydration:0.9, coreTemp:37.0, thoughts:[],
    sex:'m', ageY:30, adult:true, childScale:1, gold:25, dreams:[],
    inv:{}, bonds:{}, bondMile:{}, danger:[], events:[], plan:[],
    brainControlled:true, pregnant:null, chatT:0
  }, extra || {});
  ensureBody(v); v.body.injury = 0; v.body.illness = 0;
  VILLAGERS.push(v);
  return v;
}
function rmTestV13(v){ const i = VILLAGERS.indexOf(v); if(i >= 0) VILLAGERS.splice(i, 1); }
/* ---- extended autotest: PART 13 systems ---- */
const __runAutoTest13 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest13();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok, title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };

  // 11. intent -> real multi-step plan
  let t11 = mkTestV13('TestInt', 2, 5);
  const i11 = window.__aiBridge.postIntent('TestInt', 'stoke the fire');
  const vv11 = t11.plan.map(s => s.verb).join(',');
  log(i11.ok === true && vv11.indexOf('take') >= 0 && vv11.indexOf('use') >= 0,
    'intent13: "stoke the fire" compiles to take+go+use', vv11);
  t11.plan = [];
  const i11b = window.__aiBridge.postIntent('TestInt', 'butcher a chicken');
  log(i11b.ok === true && t11.plan.some(s => s.verb === 'butcher'),
    'intent13: "butcher a chicken" compiles to butcher verb');
  t11.plan = [];
  const i11c = window.__aiBridge.postIntent('TestInt', 'talk to Marta about the storm');
  log(i11c.ok === true && t11.plan.some(s => s.verb === 'speak'),
    'intent13: "talk to Marta about the storm" compiles to go+speak');
  t11.plan = [];
  rmTestV13(t11);

  // 12. unknown intent -> dream, 3x -> capability gap
  let t12 = mkTestV13('TestDream', 2, 6);
  const r12 = window.__aiBridge.postIntent('TestDream', 'pilot a helicopter');
  const d12 = (t12.dreams || []).length;
  window.__aiBridge.postIntent('TestDream', 'pilot a helicopter');
  window.__aiBridge.postIntent('TestDream', 'pilot a helicopter');
  const gaps = window.__aiBridge.getCapabilityGaps();
  log(r12.ok === false && r12.dream === true && d12 === 1,
    'intent13: unknown intent logged as dream, never squashed');
  log(gaps.indexOf('pilot a helicopter') >= 0,
    'intent13: 3x repeated dream flagged as capability gap');
  const gi = CAPABILITY_GAPS.indexOf('pilot a helicopter'); if(gi >= 0) CAPABILITY_GAPS.splice(gi, 1);
  rmTestV13(t12);

  // 13. economy: buy/sell conserve gold, stock is real
  const sella = VILLAGERS.find(v => v.name === 'Sella');
  let t13 = mkTestV13('TestTrade', 9, -12);
  t13.gold = 50; t13.inv = {};
  const gSellaBefore = sella.gold || 0;
  const stockBefore = SHOP.stock.bread;
  const totalBefore = VILLAGERS.reduce((a, v) => a + (v.gold || 0), 0);
  const pr13 = window.__aiBridge.postAction('TestTrade', { kind:'buy', what:'bread' });
  let ok13 = pr13.ok === true;
  for(let i = 0; i < 900 && t13.plan.length; i++) planTick(t13, 0.1);
  const totalAfter = VILLAGERS.reduce((a, v) => a + (v.gold || 0), 0);
  ok13 = ok13 && (t13.inv.bread || 0) > 0 && t13.gold === 47 &&
    SHOP.stock.bread === stockBefore - 1 && (sella.gold || 0) === gSellaBefore + 3 &&
    totalBefore === totalAfter;
  log(ok13, 'econ13: buy moves gold+stock, total conserved',
    'gold 50->' + t13.gold + ', bread=' + (t13.inv.bread || 0));
  const pr13b = window.__aiBridge.postAction('TestTrade', { kind:'sell', what:'bread' });
  for(let i = 0; i < 900 && t13.plan.length; i++) planTick(t13, 0.1);
  const totalAfter2 = VILLAGERS.reduce((a, v) => a + (v.gold || 0), 0);
  log(pr13b.ok === true && (t13.inv.bread || 0) === 0 && t13.gold === 49 && totalAfter2 === totalBefore,
    'econ13: sell returns gold at sell price, conserved', 'gold=' + t13.gold);
  rmTestV13(t13);

  // 14. corpse decay through stages, then gone
  let t14 = mkTestV13('TestCorpse', 3, 5);
  killVillager(t14, 'test');
  corpseTick(25);
  const st1 = t14.corpseStage;
  corpseTick(50);
  const gone14 = VILLAGERS.indexOf(t14) === -1;
  log(st1 === 1 && gone14, 'corpse13: decay stages then removed', 'stage=' + st1 + ', gone=' + gone14);

  // 15. burial creates grave marker
  let t15 = mkTestV13('TestGraved', 4, 5);
  let t15b = mkTestV13('TestBody', 4, 6);
  killVillager(t15b, 'test');
  const pr15 = window.__aiBridge.postAction('TestGraved', { kind:'bury' });
  for(let i = 0; i < 900 && t15.plan.length; i++) planTick(t15, 0.1);
  const buried = GRAVES.some(g => g.name === 'TestBody') && VILLAGERS.indexOf(t15b) === -1;
  log(pr15.ok === true && buried, 'corpse13: bury creates grave marker', 'graves=' + GRAVES.length);
  rmTestV13(t15);
  for(let i = GRAVES.length - 1; i >= 0; i--) if(GRAVES[i].name === 'TestBody') GRAVES.splice(i, 1);

  // 16. wildfire scorches then destroys a building
  const bld = VILLAGE_BUILDINGS.find(b => b.id === 'house1');
  const bwx = bld.wx + Math.floor(bld.tw / 2), bwy = bld.wy + Math.floor(bld.th / 2);
  ignite(bwx, bwy);
  fireBuildingTick(3);
  const scorched = (bld.scorch || 0) > 0;
  fireBuildingTick(5);
  const destroyed = VILLAGE_BUILDINGS.indexOf(bld) === -1 && RUINED.some(r => r.id === 'house1') &&
    VILLAGE_OBJECTS.some(o => o.kind === 'rubble');
  log(scorched, 'fire13: adjacent wildfire scorches building', 'scorch=' + (bld.scorch || 0).toFixed(1));
  log(destroyed, 'fire13: sustained burn destroys building -> rubble + ruin record');
  for(let i = BURNING.length - 1; i >= 0; i--) BURNING.splice(i, 1);
  for(let i = RUINED.length - 1; i >= 0; i--) if(RUINED[i].id === 'house1') RUINED.splice(i, 1);
  for(let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--){
    const o = VILLAGE_OBJECTS[i];
    if(o.kind === 'rubble' && o.wx === bld.wx && o.wy === bld.wy) VILLAGE_OBJECTS.splice(i, 1);
  }
  bld.scorch = 0; bld.scorchNoted = false; bld.ruined = false;
  VILLAGE_BUILDINGS.push(bld);

  // 17. child proportions
  const cs17 = childScales(0.55);
  log(cs17.head > cs17.body && Math.abs(cs17.head / 0.55 - 1.25) < 0.01,
    'child13: child proportions big-head short-body', 'head=' + cs17.head.toFixed(3) + ' body=' + cs17.body.toFixed(3));
  const pip = VILLAGERS.find(v => v.name === 'Pip');
  log(!!pip && !pip.adult && (pip.childScale || 1) !== 1 && typeof drawChildPawn === 'function',
    'child13: child flag routes to child renderer');

  // 18. butcher chicken -> raw meat
  let t18 = mkTestV13('TestButch', -12, -2);
  const chN = CHICKENS.length;
  const pr18 = window.__aiBridge.postAction('TestButch', { kind:'butcher' });
  for(let i = 0; i < 600 && t18.plan.length; i++) planTick(t18, 0.1);
  log(pr18.ok === true && CHICKENS.length === chN - 1 && (t18.inv.rawMeat || 0) >= 2,
    'butcher13: butcher chicken -> raw meat', 'rawMeat=' + (t18.inv.rawMeat || 0));
  rmTestV13(t18);

  const passed = res.filter(r => r.ok).length;
  el.textContent += '\n==== part13 ' + passed + '/' + res.length + ' passed ====\n';
};

