// Probe for Phase 2A Examiner fixes — demonstrates:
// (a) provenance survives craft -> drop -> pile -> another villager's hands (no ghosts)
// (b) unreachable workstation ends with an explanatory thought, not silence
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

// ---- load page JS as a classic script: top-level functions become globals ----
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
  results.push(ok);
  console.log((ok ? 'PROBE-PASS' : 'PROBE-FAIL') + ' | ' + label + (detail ? ' — ' + detail : ''));
};
const runPlan = (v, maxIter) => {
  for (let i = 0; i < (maxIter || 400) && v.plan && v.plan.length; i++) planTick(v, 0.1);
};

try {
  // ============ (a) craft -> drop -> pile -> other villager ============
  // workbench-free: temporarily remove world benches so the recipe works in place
  const benches = [];
  for (let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--)
    if (VILLAGE_OBJECTS[i].kind === 'bench') benches.push(VILLAGE_OBJECTS.splice(i, 1)[0]);

  const A = mkTestV15('ProbeA', 4, 8);
  A.inv.log = 1;
  A.plan = [{ verb: 'recipe', recipe: 'plank' }];
  runPlan(A, 300);
  const crafted = (A.inv.plank || 0) === 2;
  const provA = getItemProvenance(A, 'plank');
  check(crafted && !!provA && provA.creator === 'ProbeA',
    '(a1) A crafts 2 planks with provenance', 'planks=' + (A.inv.plank || 0) + ' creator=' + (provA && provA.creator));

  A.plan = [{ verb: 'drop', what: 'plank', n: 2 }];
  runPlan(A, 50);
  const noGhost = (A.inv.plank || 0) === 0 && !getItemProvenance(A, 'plank');
  const pile = PILES.find(p => p.prov && p.prov.plank && p.prov.plank.length > 0);
  const pileOk = !!pile && pile.items.plank === 2 && pile.prov.plank.length === 2;
  check(noGhost, '(a2) after drop: A holds nothing, no ghost provenance', 'inv=' + (A.inv.plank || 0));
  check(pileOk, '(a3) pile carries 2 planks + 2 provenance records',
    pile ? ('items=' + pile.items.plank + ' recs=' + pile.prov.plank.length) : 'no pile found');

  const B = mkTestV15('ProbeB', 4, 8);
  B.x = A.x + 5; B.y = A.y;
  B.plan = [{ verb: 'take', what: 'plank' }];
  runPlan(B, 200);
  const provB = getItemProvenance(B, 'plank');
  const transferOk = (B.inv.plank || 0) === 2 && !!provB &&
    provB.creator === 'ProbeA' && provB.materials && provB.materials.log === 1 &&
    provB.quality > 0 && provB.quality <= 1 &&
    provB.history.some(h => h.action === 'crafted');
  check(transferOk, '(a4) B takes planks: provenance = ProbeA/log/quality/history intact',
    'took=' + (B.inv.plank || 0) + ' creator=' + (provB && provB.creator) +
    ' q=' + (provB && provB.quality.toFixed(2)));

  // cleanup (a)
  for (let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--)
    if (VILLAGE_OBJECTS[i].kind === 'bench') VILLAGE_OBJECTS.splice(i, 1);
  for (const b of benches) VILLAGE_OBJECTS.push(b);
  const pilesBefore = new Set(); // remove only piles created in this probe
  rmTestV13(A); rmTestV13(B);

  // ============ (b) unreachable workstation -> thought, not silence ============
  const C = mkTestV15('ProbeC', 4, 8);
  const f0 = FIRES[0];
  C.x = f0.x + CS * 20; C.y = f0.y; // far from the firepit
  C.inv.flour = 1;
  const realPMT = planMoveToward;
  planMoveToward = function () { return 'stuck'; }; // pathing blocked
  C.plan = [{ verb: 'recipe', recipe: 'bread' }];
  runPlan(C, 20);
  planMoveToward = realPMT;
  const thought = (C.thoughts || []).find(t => /can't reach/i.test(t.text || ''));
  const silentNoMore = !!thought && (C.inv.bread || 0) === 0 && (C.inv.flour || 0) === 1;
  check(silentNoMore, '(b) stuck pathing -> explanatory thought, inputs kept',
    'thought="' + (thought && thought.text) + '" flour=' + (C.inv.flour || 0));
  rmTestV13(C);

  // remove probe-created piles (those holding plank prov records)
  for (let i = PILES.length - 1; i >= 0; i--) {
    const p = PILES[i];
    if (p.prov && p.prov.plank) PILES.splice(i, 1);
  }
} catch (e) {
  console.error('PROBE ERROR:', e.message);
  console.error(e.stack.split('\n').slice(0, 8).join('\n'));
  process.exit(2);
}

const fails = results.filter(r => !r).length;
console.log('--- probe totals: ' + results.length + ' checks, ' + fails + ' failed ---');
process.exit(fails ? 1 : 0);
