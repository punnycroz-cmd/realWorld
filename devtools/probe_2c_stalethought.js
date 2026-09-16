// Probe for Phase 2C stale-thought fix — demonstrates:
// (a) P5a/P5b replication: stale failure thought + fresh valid plan -> the valid
//     target is NOT blacklisted, the plan is NOT churned, the step advances.
// (b) A GENUINE new failure during the tick still triggers handleActionFailure
//     EXACTLY ONCE (instrumented counter), with fresh observation text.
// (c) After the genuine failure, a fresh plan on subsequent ticks does NOT
//     re-trigger (the new thought is now "stale" and must be ignored).
// Modelled on devtools/probe_2b_fixes.js; boots the world WITHOUT the ?test suite.
const fs = require('fs');
const vm = require('vm');
const path = '/home/hatch/workspace/world-sim/willowbrook_natura.html';
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

try {
  // ============ (a) P5a/P5b: stale thought must not churn a fresh valid plan ============
  const A = mkTestV15('ProbeStale', 0, 0);
  A.brainControlled = true; // isolate planTick wrapper (no utility re-evaluation)
  A.unreachable = {};
  A.thoughts = [{ text: 'Could not reach pile_2_0', val: -2 }]; // stale, already handled
  A.plan = [{ verb: 'rest', hours: 2, targetKey: 'rest_spot' }]; // fresh valid plan
  const planRefA = A.plan;
  for (let i = 0; i < 5; i++) planTick(A, 0.1);
  check(A.plan === planRefA && A.plan.length === 1,
    '(a1) fresh plan NOT churned by stale thought', 'sameArray=' + (A.plan === planRefA));
  check(!A.unreachable['rest_spot'] && !A.unreachable['pile_2_0'],
    '(a2) valid target NOT blacklisted', 'keys=' + Object.keys(A.unreachable).join(','));
  check(A.plan.length === 1 && (A.plan[0].t || 0) >= 0.49,
    '(a3) plan step actually advanced', 'stepT=' + (A.plan[0] && A.plan[0].t));
  rmTestV13(A);

  // ============ (b) genuine new failure triggers handleActionFailure EXACTLY once ============
  // Instrument the failure handler with a call counter.
  const __origHAF = handleActionFailure;
  let hafCalls = 0;
  handleActionFailure = function (v, a, r, k) { hafCalls++; return __origHAF(v, a, r, k); };

  // Force a REAL 'stuck' out of planMoveToward (stubbed): the base 'go' case then
  // posts 'Could not reach destination' by array replace, exactly like a genuine
  // pathing failure. (Positioning inside a real wall is flaky: one tick moves
  // 153px, enough to exit thin walls. The wrapper behavior under test is
  // identical either way.)
  const __origPMT = planMoveToward;
  planMoveToward = function () { return 'stuck'; };
  const B = mkTestV15('ProbeGenuine', 0, 0);
  B.brainControlled = true;
  B.unreachable = {};
  B.thoughts = [];
  B.plan = [{ verb: 'go', tx: 9999, ty: 9999, targetKey: 'probe_wall' }];
  planTick(B, 0.1); // single tick -> base posts failure thought -> wrapper must handle once
  planMoveToward = __origPMT; // restore immediately
  check(hafCalls === 1,
    '(b1) genuine new failure triggers handleActionFailure exactly once', 'calls=' + hafCalls);
  check(B.thoughts && B.thoughts[0] && /Can't reach go: unreachable/.test(B.thoughts[0].text),
    '(b2) fresh observation text describes the NEW event',
    'thought=' + (B.thoughts[0] && B.thoughts[0].text));
  check(B.unreachable['probe_wall'] && (!B.plan || B.plan.length === 0),
    '(b3) failed target blacklisted, failed plan cleared',
    'blacklisted=' + !!B.unreachable['probe_wall'] + ' planLen=' + (B.plan && B.plan.length));

  // ============ (c) the new thought is now stale: fresh plan must not re-trigger ============
  B.plan = [{ verb: 'rest', hours: 2, targetKey: 'rest_spot2' }];
  const planRefB = B.plan;
  for (let i = 0; i < 3; i++) planTick(B, 0.1);
  check(hafCalls === 1,
    '(c1) no re-trigger on subsequent ticks (fresh thought treated as stale)', 'calls=' + hafCalls);
  check(B.plan === planRefB && B.plan.length === 1 && !B.unreachable['rest_spot2'],
    '(c2) fresh plan survives after a handled failure',
    'sameArray=' + (B.plan === planRefB) + ' stepT=' + (B.plan[0] && B.plan[0].t));
  rmTestV13(B);

  // restore original handler (hygiene; probe is single-run anyway)
  handleActionFailure = __origHAF;

  // ============ (d) kitchen candidate: hasBread now reflects the real (inn) stock pool ============
  // The default worldgen does not place a kitchen (2B: constructible), so add one
  // manually — same pattern as the 2B probe's manual barn.
  const kb = {
    id: 'probe_kitchen', kind: 'kitchen', name: 'Probe Kitchen',
    wx: 60, wy: 60, tw: 4, th: 4, x: 60 * CS, y: 60 * CS,
    indoorTemp: 20, cleanliness: 1.0, capacity: 4, integrity: 1, maxInteg: 1,
    hasFire: true, fireplaceLit: true, daysUnoccupied: 0, residents: []
  };
  // NOTE: the candidate looks up id 'kitchen' specifically
  kb.id = 'kitchen';
  VILLAGE_BUILDINGS.push(kb);
  const D = mkTestV15('ProbeKitchen', 0, 0);
  const oldInn = FOOD_STOCK.inn;
  FOOD_STOCK.inn = 5;
  const chFull = evaluateVillagerUtility(D);
  const kFull = chFull.candidates.find(c => c.id === 'eat_kitchen');
  FOOD_STOCK.inn = 0;
  const chEmpty = evaluateVillagerUtility(D);
  const kEmpty = chEmpty.candidates.find(c => c.id === 'eat_kitchen');
  FOOD_STOCK.inn = oldInn;
  check(!!kFull && kFull.hasBread === true,
    '(d1) eat_kitchen hasBread=true when inn stock > 0', 'hasBread=' + (kFull && kFull.hasBread));
  check(!kEmpty || kEmpty.hasBread === false,
    '(d2) eat_kitchen hasBread=false when inn stock = 0', 'hasBread=' + (kEmpty && kEmpty.hasBread));
  rmTestV13(D);
  { const kbi = VILLAGE_BUILDINGS.indexOf(kb); if (kbi >= 0) VILLAGE_BUILDINGS.splice(kbi, 1); }
} catch (e) {
  console.error('PROBE EXCEPTION:', e && e.stack || e);
  process.exit(2);
}

const nPass = results.filter(Boolean).length;
console.log('==== probe_2c_stalethought: ' + nPass + '/' + results.length + ' passed ====');
process.exit(nPass === results.length ? 0 : 1);
