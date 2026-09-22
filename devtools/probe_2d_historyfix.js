// Probe for Phase 2D history-integrity fixes — replicates the Examiner's demonstrations:
// (1) place north->south conflict on a NON-hardcoded key -> old entry superseded:true,
//     kept in history, new belief active (was: silent Object.assign merge, superseded=0).
// (2) evidence aliasing: observe + reinforce -> historical entry's evidence unchanged,
//     belief.evidence !== memory.evidence (was: shared array, history mutated).
// (3) dedupe: equivalent re-observation within the window reinforces the belief
//     WITHOUT pushing a duplicate memory entry.
// (4) claimOwnership: claimant's belief must not alias the claim memory entry.
// Modelled on devtools/probe_2c_stalethought.js; boots the world WITHOUT the ?test suite.
const fs = require('fs');
const vm = require('vm');
const pagePath = process.argv[2] || '/home/hatch/workspace/world-sim/willowbrook_natura_test.html';
const html = fs.readFileSync(pagePath, 'utf-8');
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
  // ============ (1) Defect 1: non-hardcoded key conflict must supersede ============
  const v1 = mkTestV19('Probe2DNorth', 0, 0);
  const m1a = observe(v1, { place: 'north' }, { topic: 'cache_spot', source: 'direct', confidence: 0.9, salience: 0.6 });
  const m1b = observe(v1, { place: 'south' }, { topic: 'cache_spot', source: 'direct', confidence: 0.9, salience: 0.6 });
  const b1 = getBelief(v1, 'cache_spot');
  const old1 = v1.epistemic.memories.find(x => x.id === m1a.id);
  check(b1 && b1.content && b1.content.place === 'south',
    '(1a) new belief active with place=south', 'place=' + (b1 && b1.content && b1.content.place));
  check(old1 && old1.superseded === true && old1.supersededBy === m1b.id,
    '(1b) old entry marked superseded with supersededBy link', 'superseded=' + (old1 && old1.superseded));
  check(v1.epistemic.memories.some(x => x.id === m1a.id),
    '(1c) old entry KEPT in history (not overwritten)', 'historyLen=' + v1.epistemic.memories.length);
  rmTestV13(v1);

  // ============ (2) Defect 2: evidence must not be aliased ============
  const v2 = mkTestV19('Probe2DEv', 0, 0);
  const m2a = observe(v2, { color: 'red' }, {
    topic: 'banner_color', source: 'direct', confidence: 0.8, salience: 0.6, evidence: ['saw deed']
  });
  observe(v2, { color: 'red' }, {
    topic: 'banner_color', source: 'direct', confidence: 0.85, salience: 0.6, evidence: ['saw again']
  });
  const hist2 = v2.epistemic.memories.find(x => x.id === m2a.id);
  const b2 = getBelief(v2, 'banner_color');
  check(hist2 && hist2.evidence.length === 1 && hist2.evidence[0] === 'saw deed',
    '(2a) historical entry evidence unchanged after reinforce', 'histEv=' + JSON.stringify(hist2 && hist2.evidence));
  check(b2 && hist2 && b2.evidence !== hist2.evidence,
    '(2b) belief.evidence is a different array object than memory.evidence', 'aliased=' + (b2 && hist2 && b2.evidence === hist2.evidence));
  check(b2 && b2.evidence.includes('saw deed') && b2.evidence.includes('saw again'),
    '(2c) belief accumulated both evidence items', 'beliefEv=' + JSON.stringify(b2 && b2.evidence));
  rmTestV13(v2);

  // ============ (3) Dedupe: equivalent re-observation does not push ============
  const v3 = mkTestV19('Probe2DDedupe', 0, 0);
  const before3 = v3.epistemic.memories.length;
  observe(v3, { foodKind: 'bread', wx: 5, wy: 5 }, {
    topic: 'pile_5_5', source: 'direct', confidence: 0.95, dedupeWindowH: 6
  });
  const afterFirst = v3.epistemic.memories.length;
  const confFirst = getBelief(v3, 'pile_5_5').confidence;
  observe(v3, { foodKind: 'bread', wx: 5, wy: 5 }, {
    topic: 'pile_5_5', source: 'direct', confidence: 0.95, dedupeWindowH: 6
  });
  const afterSecond = v3.epistemic.memories.length;
  const confSecond = getBelief(v3, 'pile_5_5').confidence;
  check(afterFirst === before3 + 1,
    '(3a) first observation pushes one memory', 'before=' + before3 + ' after=' + afterFirst);
  check(afterSecond === afterFirst,
    '(3b) equivalent re-observation within window pushes NO new memory', 'afterSecond=' + afterSecond);
  check(confSecond >= confFirst,
    '(3c) belief still reinforced on dedupe', 'conf ' + confFirst.toFixed(2) + ' -> ' + confSecond.toFixed(2));
  // Different content must NOT dedupe (still a real new observation).
  observe(v3, { foodKind: 'berries', wx: 5, wy: 5 }, {
    topic: 'pile_5_5', source: 'direct', confidence: 0.95, dedupeWindowH: 6
  });
  check(v3.epistemic.memories.length === afterSecond + 1,
    '(3d) different content still pushes', 'len=' + v3.epistemic.memories.length);
  rmTestV13(v3);

  // ============ (4) claimOwnership: no aliasing between claim memory and belief ============
  const v4 = mkTestV19('Probe2DClaim', 0, 0);
  const cres = claimOwnership(v4, 'old_axe', { text: 'Mine!' });
  const cmem = v4.epistemic.memories.find(x => x.id === cres.claim.id);
  const cbel = getBelief(v4, 'ownership_old_axe');
  check(cmem && cbel && cbel.evidence !== cmem.evidence,
    '(4a) claim belief evidence not aliased with claim memory', 'aliased=' + (cbel && cmem && cbel.evidence === cmem.evidence));
  cbel.evidence.push('tamper');
  check(!cmem.evidence.includes('tamper'),
    '(4b) mutating belief evidence does not corrupt history', 'cmemEv=' + JSON.stringify(cmem && cmem.evidence));
  rmTestV13(v4);

  // ============ (5) recordOwnershipBelief: no aliasing ============
  const v5 = mkTestV19('Probe2DRec', 0, 0);
  recordOwnershipBelief(v5, 'barn', { knownOwner: 'Bram', suspectedOwner: 'Bram', confidence: 0.8, evidence: ['deed seen'] });
  const rmem = v5.epistemic.memories.find(x => x.topic === 'ownership_barn');
  const rbel = getBelief(v5, 'ownership_barn');
  check(rmem && rbel && rbel !== rmem && rbel.evidence !== rmem.evidence,
    '(5a) ownership belief is a separate object with separate evidence', 'sameObj=' + (rbel === rmem));
  rmTestV13(v5);

  const passed = results.filter(Boolean).length;
  console.log('\nPROBE RESULT: ' + passed + '/' + results.length + ' passed');
  process.exit(passed === results.length ? 0 : 1);
} catch (e) {
  console.error('PROBE ERROR:', e.stack);
  process.exit(2);
}
