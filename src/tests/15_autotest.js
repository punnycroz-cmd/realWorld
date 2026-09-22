/* =====================================================================
   PART 15 AUTOTEST
   ===================================================================== */
function mkTestV15(name, wx, wy, extra){
  const v = mkTestV14(name, wx, wy, extra);
  v.grudges = {}; v.rivals = {}; v.invAge = {}; v.taintedMeals = {};
  return v;
}
const __runAutoTest15 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest15();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const runPlan = (v, maxIter) => {
    for(let i = 0; i < (maxIter || 400) && v.plan && v.plan.length; i++) planTick(v, 0.1);
  };

  // 15.1 meal quality tiers: skill + variety decide lavish vs poor
  let t = mkTestV15('TMeal1', 2, 5);
  FIRES[0].burnH = 3;
  t.x = FIRES[0].x + 20; t.y = FIRES[0].y;
  t.skills.cooking = { lvl: 8, xp: 0 };
  t.inv.fish = 2; t.inv.crop = 2; t.inv.berries = 2;
  t.plan = [{ verb: 'cook', meal: true }];
  runPlan(t, 300);
  const lavish = (t.inv.mealLavish || 0) >= 1;
  log(lavish, 'meal15: skilled cook + variety -> lavish meal',
    'lavish=' + (t.inv.mealLavish || 0) + ' fine=' + (t.inv.mealFine || 0) + ' poor=' + (t.inv.mealPoor || 0));
  const t2 = mkTestV15('TMeal2', 2, 6);
  t2.x = FIRES[0].x + 20; t2.y = FIRES[0].y;
  t2.skills.cooking = { lvl: 0, xp: 0 };
  t2.inv.fish = 2;
  t2.plan = [{ verb: 'cook', meal: true }];
  runPlan(t2, 300);
  const poor = (t2.inv.mealPoor || 0) >= 1 && (t2.inv.mealLavish || 0) === 0;
  log(poor, 'meal15: unskilled cook, no sides -> poor meal',
    'poor=' + (t2.inv.mealPoor || 0));
  rmTestV13(t); rmTestV13(t2);

  // 15.2 raw meat -> poison risk path exists; poison makes you sick
  t = mkTestV15('TPois', 3, 5);
  const b = ensureBody(t);
  b.poison = 0.6;
  const sat0 = b.satiety;
  for(let i = 0; i < 20; i++) bodyTick(t, 0.5); // 10h
  log(b.satiety < sat0 && (b.illness || 0) > 0 && (b.poison || 0) < 0.6,
    'meal15: poison causes vomiting/illness then decays',
    'sat ' + sat0.toFixed(2) + '->' + b.satiety.toFixed(2) + ' ill=' + (b.illness || 0).toFixed(2));
  // and the raw-meat hook fires: force by stubbing random
  const tR = mkTestV15('TPoisR', 3, 6);
  tR.inv.rawMeat = 2;
  const __rnd = Math.random; Math.random = () => 0.01; // force the 35% roll
  tR.plan = [{ verb: 'eat' }];
  runPlan(tR, 30);
  Math.random = __rnd;
  log((tR.body.poison || 0) > 0, 'meal15: eating raw meat can poison',
    'poison=' + (tR.body.poison || 0).toFixed(2));
  rmTestV13(t); rmTestV13(tR);

  // 15.3 spoilage converts old food to rot
  t = mkTestV15('TSpoil', 4, 5);
  t.inv.fish = 3; t.invAge = { fish: 0 };
  W.temp = 30;
  for(let i = 0; i < 3; i++) spoilTick(); // 3 hot days > 2-day spoil
  const spoiled = (t.inv.fish || 0) === 0 && (t.inv.rot || 0) === 3;
  W.temp = 20;
  log(spoiled, 'meal15: fish spoils to rot after 3 hot days',
    'fish=' + (t.inv.fish || 0) + ' rot=' + (t.inv.rot || 0));
  rmTestV13(t);

  // 15.4 tame chicken -> tamed, penned, fed hens lay
  t = mkTestV15('TTame', 5, 5);
  t.skills.foraging = { lvl: 9, xp: 0 };
  t.inv.berries = 5;
  CHICKENS.push({ name: 'Wild1', x: t.x + 30, y: t.y, state: 'peck', t: 2, eggT: 20, tamed: false });
  const wc = CHICKENS[CHICKENS.length - 1];
  COOPS.push({ x: t.x + 200, y: t.y, integrity: 1 });
  t.plan = [{ verb: 'tame', what: 'chicken' }];
  const __rnd2 = Math.random; Math.random = () => 0.5; // mid roll; chance=0.25+0.63=0.88 -> success
  runPlan(t, 500);
  Math.random = __rnd2;
  const tamedOk = wc.tamed === true && !!wc.pen;
  dropPileAt(t.x + 200, t.y, 'crop', 3);
  const egg0 = wc.eggT;
  for(let i = 0; i < 12; i++) chickenTick(1); // 12h with feed nearby
  const laidFaster = wc.eggT < egg0 - 10;
  { const i = CHICKENS.indexOf(wc); if(i >= 0) CHICKENS.splice(i, 1); }
  COOPS.pop();
  for(let i = PILES.length - 1; i >= 0; i--) if(PILES[i].items.crop) PILES.splice(i, 1);
  log(tamedOk && laidFaster, 'tame15: chicken tamed, penned, fed hens lay faster',
    'tamed=' + tamedOk + ' eggT ' + egg0.toFixed(1) + '->' + wc.eggT.toFixed(1));
  rmTestV13(t);

  // 15.5 caravan arrives with stock, trades, departs
  t = mkTestV15('TTrade', 6, 5);
  t.gold = 50;
  arriveCaravan();
  const arrived = CARAVAN.active && CARAVAN.members.length === 3 && (CARAVAN.stock.spice || 0) === 6;
  const m0 = CARAVAN.members[0];
  m0.plan = []; m0.x = t.x + 40; m0.y = t.y; // hold the trader still
  const g0 = t.gold, mg0 = m0.gold;
  t.plan = [{ verb: 'trade', what: 'spice', buy: true }];
  runPlan(t, 500);
  const traded = (t.inv.spice || 0) === 1 && t.gold === g0 - 12 && m0.gold === mg0 + 12 &&
    (CARAVAN.stock.spice || 0) === 5;
  // gold conservation across the whole exchange
  t.inv.hide = 2;
  t.plan = [{ verb: 'trade', what: 'hide', buy: false }];
  runPlan(t, 500);
  const soldOk = (t.inv.hide || 0) === 1 && t.gold === g0 - 12 + 6;
  departCaravan();
  const left = !CARAVAN.active && !VILLAGERS.some(v => v.outsider);
  log(arrived && traded && soldOk && left, 'trade15: caravan arrives, buys/sells conserve gold, departs',
    'spice=' + (t.inv.spice || 0) + ' gold=' + t.gold);
  rmTestV13(t);

  // 15.6 insult -> bond drop -> rivalry -> fight -> injuries -> ends
  const a = mkTestV15('TFightA', 7, 5);
  const bb = mkTestV15('TFightB', 7, 5);
  a.x = bb.x + 30;
  a.bonds[bb.name] = 0.05; bb.bonds[a.name] = 0.05;
  doInsult(a, bb);
  const bondDropped = (a.bonds[bb.name] || 0) < 0.05;
  doInsult(a, bb); doInsult(a, bb); doInsult(bb, a);
  const rivals = !!(a.rivals && a.rivals[bb.name]);
  startFight(a, bb, 'test');
  const __rnd3 = Math.random; Math.random = () => 0.9; // no bystander intervention luck needed
  for(let i = 0; i < 60 && (a.fight || bb.fight); i++) fightTick(0.3);
  Math.random = __rnd3;
  const injured = (a.body.wounds.length + bb.body.wounds.length) > 0;
  const ended = !a.fight && !bb.fight;
  const noMurder = !a.dead && !bb.dead;
  log(bondDropped && rivals && injured && ended && noMurder,
    'fight15: insult->rivalry->brawl injures but never kills, then ends',
    'rivals=' + rivals + ' wounds=' + (a.body.wounds.length + bb.body.wounds.length));
  rmTestV13(a); rmTestV13(bb);

  // 15.7 apology repairs
  const c1 = mkTestV15('TSorryA', 8, 5);
  const c2 = mkTestV15('TSorryB', 8, 5);
  c1.bonds[c2.name] = 0.05; c2.bonds[c1.name] = 0.05;
  doInsult(c1, c2); doInsult(c1, c2); doInsult(c1, c2);
  const wasRival = !!(c1.rivals && c1.rivals[c2.name]);
  c1.x = c2.x + 30;
  c1.plan = [{ verb: 'speak', to: c2.name, apologize: true, text: 'I am sorry.' }];
  runPlan(c1, 200);
  const peace = !(c1.rivals && c1.rivals[c2.name]) && (c1.bonds[c2.name] || 0) > 0.05;
  log(wasRival && peace, 'fight15: apology dissolves rivalry, bond recovers');
  rmTestV13(c1); rmTestV13(c2);

  // 15.8 douse reduces fire cells
  // NOTE (determinism, fixed 2026-09-16): single fire cell on OPEN GROUND next
  // to the barn. Two adjacent cells made the test depend on the 50%
  // adjacent-douse roll in doDouseStep, and cells placed ON the barn footprint
  // trapped the villager on the barn wall just outside douse range (~40% flake).
  // (8,4) has a clear path from the well; the nearby barn keeps firePriority
  // high ("threatening") so the villager actually fights it. No Math.random
  // remains on this path, so the test is fully deterministic.
  const d = mkTestV15('TDouse', 9, 5);
  VILLAGE_BUILDINGS.push({ id: 'testbarn', name: 'Test Barn', wx: 9, wy: 5, tw: 4, th: 4, integrity: 1, maxInteg: 1 });
  BURNING.push({ wx: 8, wy: 4, t: 0.6 });
  const well = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  d.x = well.x + 30; d.y = well.y;
  d.plan = [{ verb: 'douse' }];
  runPlan(d, 600);
  const burningLeft = BURNING.length; // capture BEFORE cleanup (was always 0 after)
  const doused = burningLeft === 0;
  { const i = VILLAGE_BUILDINGS.findIndex(b => b.id === 'testbarn'); if(i >= 0) VILLAGE_BUILDINGS.splice(i, 1); }
  BURNING.length = 0;
  log(doused, 'fire15: douse verb extinguishes threatening fire cells',
    'burning left=' + burningLeft);
  rmTestV13(d);

  // 15.9 intent patterns compile
  const ti = mkTestV15('TIntent15', 3, 8);
  const checks = [
    ['smoke the meat', 'preserve'],
    ['tame a chicken', 'tame'],
    ['put out the fire', 'douse'],
    ['trade with the caravan', 'trade'],
  ];
  let allOk = true, detail = [];
  for(const [txt, want] of checks){
    ti.plan = [];
    const r = window.__aiBridge.postIntent('TIntent15', txt);
    const verbs = ti.plan.map(s => s.verb).join(',');
    const ok = r.ok && verbs.indexOf(want) >= 0;
    if(!ok) allOk = false;
    detail.push(txt + '->' + verbs);
  }
  ti.plan = [];
  const rAp = window.__aiBridge.postIntent('TIntent15', 'cook a fine meal');
  const verbsAp = ti.plan.map(s => s.verb + (s.meal ? ':meal' : '')).join(',');
  allOk = allOk && rAp.ok && verbsAp.indexOf('cook:meal') >= 0;
  detail.push('cook a fine meal->' + verbsAp);
  log(allOk, 'intent15: preserve/tame/douse/trade/fine-meal intents compile', detail.join(' | '));
  rmTestV13(ti);

  const passed = res.filter(r => r.ok).length;
  el.textContent += '\n==== part15 ' + passed + '/' + res.length + ' passed ====\n';
};
