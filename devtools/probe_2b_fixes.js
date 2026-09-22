// Probe for Phase 2B ghost-target fix — demonstrates:
// (a) demolish/expand/clean with an explicit unmatched building name fails honestly
//     (planForVerb -> {ok:false}), building count unchanged, materials unspent,
//     the inn still standing (the Examiner's demolished-inn case)
// (b) generic 'house'/'home'/'nearest' requests still resolve via nearest fallback
// (c) demolishing an occupied building nulls the sleeper's homeId
// (d) empty barn: no animal-driven cleanliness decay
// Modelled on devtools/node_harness.js; boots the world WITHOUT the ?test suite.
const fs = require('fs');
const vm = require('vm');
const path = '/home/hatch/workspace/world-sim/willowbrook_natura_test.html';
const html = fs.readFileSync(path, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }
const pageJS = m[1];

// ---- DOM/canvas stubs (same as harness) ----
function makeCtx() {
  const grad = { addColorStop(){} };
  return new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return { width: 64, height: 64 };
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
      if (k === 'getImageData') return (x,y,w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
      if (k === 'createImageData') return (w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
      if (k === 'measureText') return () => ({ width: 10 });
      return t[k] !== undefined ? t[k] : (() => {});
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}
function makeCanvas() {
  return { width: 300, height: 150, style: {}, getContext: () => makeCtx(),
           addEventListener(){}, getBoundingClientRect: () => ({left:0,top:0}) };
}
const elements = {};
function makeEl(id) {
  return { id, style: {}, textContent: '', innerHTML: '', title: '',
           addEventListener(){}, appendChild(){}, classList: { add(){}, remove(){} },
           getContext: () => makeCtx(), width: 300, height: 150 };
}
let domReadyCb = null;
global.window = {
  addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') domReadyCb = cb; },
  removeEventListener(){},
  __aiBridge: undefined,
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
global.document = {
  getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
  createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
  title: '', addEventListener(){}, body: makeEl('body'),
};
global.location = { search: '' }; // boot WITHOUT the ?test suite
global.requestAnimationFrame = () => 0;
try { global.navigator = { userAgent: 'node' }; } catch (e) {}

try {
  vm.runInThisContext(pageJS, { filename: 'willowbrook_natura.page.js' });
} catch (e) {
  console.error('PAGE LOAD FAILED:', e.message);
  process.exit(2);
}
if (typeof domReadyCb !== 'function') { console.error('NO DOMContentLoaded HANDLER'); process.exit(2); }
domReadyCb(); // synchronous boot

const results = [];
const check = (ok, label, detail) => {
  results.push(!!ok);
  console.log((ok ? 'PROBE-PASS' : 'PROBE-FAIL') + ' | ' + label + (detail ? ' — ' + detail : ''));
};
const runPlan = (v, maxIter) => {
  for (let i = 0; i < (maxIter || 400) && v.plan && v.plan.length; i++) planTick(v, 0.1);
};

try {
  // Sanity: no hut / barn / old mill in the default settlement
  const noHut = !VILLAGE_BUILDINGS.some(b => /hut/i.test(b.id + ' ' + b.kind + ' ' + b.name));
  const noBarn = !VILLAGE_BUILDINGS.some(b => /barn/i.test(b.id + ' ' + b.kind));
  console.log('preconditions: noHut=' + noHut + ' noBarn=' + noBarn + ' buildings=' + VILLAGE_BUILDINGS.length);

  // ============ (a) ghost targets fail honestly ============
  const countBefore = VILLAGE_BUILDINGS.length;
  const innBefore = VILLAGE_BUILDINGS.some(b => b.id === 'inn');

  const G = mkTestV15('ProbeGhost', 0, 0);
  G.inv.log = 6; G.inv.stone = 4;

  const demPlan = planForVerb(G, { kind: 'demolish', target: 'hut' });
  check(demPlan && demPlan.ok === false && /no building to demolish/i.test(demPlan.reason || ''),
    '(a1) demolish the old hut (no hut) -> ok:false, honest reason',
    'ok=' + (demPlan && demPlan.ok) + ' reason=' + (demPlan && demPlan.reason));

  const expPlan = planForVerb(G, { kind: 'expand', target: 'barn' });
  check(expPlan && expPlan.ok === false && /no building to expand/i.test(expPlan.reason || ''),
    '(a2) expand the barn (no barn) -> ok:false',
    'ok=' + (expPlan && expPlan.ok) + ' reason=' + (expPlan && expPlan.reason));

  const cleanPlan = planForVerb(G, { kind: 'clean', target: 'old mill' });
  check(cleanPlan && cleanPlan.ok === false && /no building to clean/i.test(cleanPlan.reason || ''),
    '(a3) clean the old mill (no mill) -> ok:false',
    'ok=' + (cleanPlan && cleanPlan.ok) + ' reason=' + (cleanPlan && cleanPlan.reason));

  check((G.inv.log || 0) === 6 && (G.inv.stone || 0) === 4,
    '(a4) villager materials unspent', 'log=' + (G.inv.log || 0) + ' stone=' + (G.inv.stone || 0));
  check(VILLAGE_BUILDINGS.length === countBefore,
    '(a5) building count unchanged', 'before=' + countBefore + ' after=' + VILLAGE_BUILDINGS.length);
  check(VILLAGE_BUILDINGS.some(b => b.id === 'inn') === innBefore,
    '(a6) the inn still stands', 'inn=' + VILLAGE_BUILDINGS.some(b => b.id === 'inn'));

  // ============ (b) generic fallbacks still work ============
  const H = mkTestV15('ProbeGen', 0, 0);
  for (const t of ['house', 'home', 'nearest', '']) {
    const p = planForVerb(H, { kind: 'clean', target: t });
    check(p && p.ok === true && p.steps && p.steps.length > 0 && p.steps[1] && p.steps[1].building,
      "(b) generic '" + (t || '(empty)') + "' still resolves", 'building=' + (p && p.steps && p.steps[1] && p.steps[1].building));
  }
  // Explicit real building still resolves by kind and by name fragment
  const innPlan = planForVerb(H, { kind: 'clean', target: 'inn' });
  check(innPlan && innPlan.ok === true && innPlan.steps[1].building === 'inn',
    '(b2) explicit existing kind "inn" resolves', 'building=' + (innPlan && innPlan.steps[1].building));

  // ============ (c) demolition nulls dangling homeId ============
  const tmpB = {
    id: 'probe_home_bld', kind: 'house', name: 'Probe Home',
    wx: 40, wy: 40, tw: 4, th: 4, x: 40*CS, y: 40*CS,
    door: { wx: 42, wy: 44 },
    indoorTemp: 20, cleanliness: 1, capacity: 2, integrity: 1, maxInteg: 1,
    hasFire: false, fireplaceLit: false, daysUnoccupied: 0, residents: ['ProbeSleeper'],
    materials: { log: 10, stone: 6 }
  };
  VILLAGE_BUILDINGS.push(tmpB);
  const S = mkTestV15('ProbeSleeper', 42, 44);
  S.homeId = 'probe_home_bld';
  S.x = 42 * CS + 16; S.y = 44 * CS + 16;
  S.plan = [{ verb: 'demolish', building: 'probe_home_bld' }];
  runPlan(S, 200);
  const gone = !VILLAGE_BUILDINGS.some(b => b.id === 'probe_home_bld');
  check(gone && S.homeId === null,
    '(c) demolishing occupied building nulls sleeper homeId',
    'removed=' + gone + ' homeId=' + S.homeId);

  // ============ (d) empty barn: no animal-driven decay ============
  const eb = {
    id: 'probe_empty_barn', kind: 'barn', name: 'Empty Barn',
    wx: -45, wy: -45, tw: 5, th: 4, x: -45*CS, y: -45*CS,
    indoorTemp: 20, cleanliness: 1.0, capacity: 8, integrity: 1, maxInteg: 1,
    hasFire: false, fireplaceLit: false, daysUnoccupied: 0, residents: [],
    animalsHoused: 0
  };
  VILLAGE_BUILDINGS.push(eb);
  buildingTick(1.0); // 1 sim hour, no occupants, no animals
  check(eb.cleanliness === 1.0,
    '(d) empty barn keeps cleanliness 1.0 after 1h (no phantom animal decay)',
    'cleanliness=' + eb.cleanliness.toFixed(3));
  const ebI = VILLAGE_BUILDINGS.indexOf(eb);
  if (ebI >= 0) VILLAGE_BUILDINGS.splice(ebI, 1);

  rmTestV13(G); rmTestV13(H); rmTestV13(S);
} catch (e) {
  console.error('PROBE EXCEPTION:', e && e.stack || e);
  process.exit(2);
}

const nPass = results.filter(Boolean).length;
console.log('==== probe_2b_fixes: ' + nPass + '/' + results.length + ' passed ====');
process.exit(nPass === results.length ? 0 : 1);
