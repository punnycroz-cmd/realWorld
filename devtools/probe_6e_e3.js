'use strict';
// devtools/probe_6e_e3.js
// Production-path probe for Phase 6E Slice E3:
// 1. A2 Physical hearing propagation with distance falloff.
// 2. 3B stressResidue accumulator, hard ceiling assertion (0.35 * maxStress), and 8%/day recovery.
// 3. Differential tests for acceptance criteria (a) through (f).

const fs = require('fs');
const vm = require('vm');
const htmlPath = '/home/hatch/workspace/world-sim/willowbrook_natura_test.html';
const html = fs.readFileSync(htmlPath, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }
const pageJS = m[1];

// ---- DOM / Canvas stubs ----
function makeCtx() {
  const grad = { addColorStop(){} };
  return new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return { width: 64, height: 64 };
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
      if (k === 'getImageData' || k === 'createImageData') return (w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
      if (k === 'measureText') return () => ({ width: 10 });
      return t[k] !== undefined ? t[k] : (() => {});
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}
function makeCanvas() {
  return { width: 300, height: 150, style: {}, getContext: () => makeCtx(), addEventListener(){}, getBoundingClientRect: () => ({ left: 0, top: 0 }) };
}
const elements = {};
function makeEl(id) {
  return { id, style: {}, textContent: '', innerHTML: '', title: '', addEventListener(){}, appendChild(){}, classList: { add(){}, remove(){} }, getContext: () => makeCtx(), width: 300, height: 150 };
}

global.window = {
  addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') cb(); },
  removeEventListener(){},
  __aiBridge: undefined,
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
global.document = {
  getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
  createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
  title: '', addEventListener(){}, body: makeEl('body'),
};
global.location = { search: '' };
global.requestAnimationFrame = () => 0;
try { global.navigator = { userAgent: 'node' }; } catch (e) {}

try {
  vm.runInThisContext(pageJS, { filename: 'willowbrook_natura.page.js' });
} catch (e) {
  console.error('BUNDLE EVAL FAILED:', e.message);
  process.exit(1);
}

// ---- Probe Harness ----
let passedCount = 0;
let failedCount = 0;

function assert(cond, testName, detail) {
  if (cond) {
    console.log(`[PASS] ${testName} | ${detail || ''}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${testName} | ${detail || ''}`);
    failedCount++;
  }
}

const createdTestPawns = [];
function makeTestPawn(name, wx, wy, options) {
  const v = createVillager(name, 'Villager', null, wx, wy, Object.assign({ stage: 'adult' }, options || {}));
  ensureBody(v);
  FeelingSubstrate.ensureSubstrate(v);
  VILLAGERS.push(v);
  createdTestPawns.push(v);
  return v;
}

function cleanupPawns() {
  for (const v of createdTestPawns) {
    const idx = VILLAGERS.indexOf(v);
    if (idx >= 0) VILLAGERS.splice(idx, 1);
  }
  createdTestPawns.length = 0;
}

console.log('=== PHASE 6E SLICE E3 PRODUCTION-PATH PROBE ===');

// =========================================================================
// 1. Acceptance Criteria 3(a): Real scream via production path
// Villager A screams via production path (downed / shoutForHelp) ->
// Bystander B (5 cells away) receives acoustic signal (scape leaves content).
// Bystander C (50 cells away) does NOT receive signal (negative control, stays content).
// =========================================================================
const pA = makeTestPawn('T_VictimA', 0, 0);
const pB = makeTestPawn('T_NearB', 5, 0);    // 5 cells away
const pC = makeTestPawn('T_FarC', 50, 0);    // 50 cells away

// Verify baseline
const bBase = FeelingSubstrate.getFeelingScape(pB);
const cBase = FeelingSubstrate.getFeelingScape(pC);
const baseOk = bBase.dominant === 'content' && cBase.dominant === 'content';

// Production path: A is downed (e.g. by sudden trauma)
setDowned(pA, 'unconscious', 'rockfall');

// Verify B received acoustic signal and left content
const bSignals = pB._recentSignals || [];
const bReceivedAcoustic = bSignals.some(s => s.kind === 'acoustic_scream' || s.domain === 'acoustic');
const bScape = FeelingSubstrate.getFeelingScape(pB);
const bLeftContent = bScape.dominant !== 'content';

// Verify C received NO acoustic signal and remained in content
const cSignals = pC._recentSignals || [];
const cReceivedAcoustic = cSignals.some(s => s.kind === 'acoustic_scream' || s.domain === 'acoustic');
const cScape = FeelingSubstrate.getFeelingScape(pC);
const cStaysContent = cScape.dominant === 'content';

assert(baseOk && bReceivedAcoustic && bLeftContent && !cReceivedAcoustic && cStaysContent,
  'Criteria 3(a): Real scream via production path triggers near listener while negative control stays content',
  `bReceived=${bReceivedAcoustic} bDominant=${bScape.dominant} cReceived=${cReceivedAcoustic} cDominant=${cScape.dominant}`);

// =========================================================================
// 2. Acceptance Criteria 3(b): Measurable distance falloff
// For the same scream, B (5 cells) intensity is measurably higher than D (15 cells).
// =========================================================================
const pD = makeTestPawn('T_MidD', 15, 0); // 15 cells away
const screamOrigin = { x: pA.x, y: pA.y };

// Propagate standard scream
const delivered = FeelingSubstrate.propagateSound({
  kind: 'scream',
  originX: screamOrigin.x,
  originY: screamOrigin.y,
  source: pA,
  radius: 25,
  metadata: { test: true }
});

const sigB = (pB._recentSignals || []).slice().reverse().find(s => s.kind === 'acoustic_scream');
const sigD = (pD._recentSignals || []).slice().reverse().find(s => s.kind === 'acoustic_scream');

const intB = sigB ? sigB.intensity : 0;
const intD = sigD ? sigD.intensity : 0;
const falloffOk = (intB > 0) && (intD > 0) && (intB > intD) && (Math.abs((intB - intD) - 0.340) < 0.05);

assert(falloffOk,
  'Criteria 3(b): Distance falloff is measurably distinguished (5 cells > 15 cells)',
  `intNear(5cells)=${intB} intMid(15cells)=${intD} delta=${+(intB - intD).toFixed(3)}`);

// =========================================================================
// 3. Acceptance Criteria 3(c): Hard Ceiling on stressResidue
// Multiple days of extreme acute stress -> stressResidue NEVER exceeds 0.35 * maxStress.
// =========================================================================
const pStress = makeTestPawn('T_CeilingPawn', 20, 20);
const maxStress1 = FeelingSubstrate.getMaxStress(pStress); // 1.0
const ceiling1 = 0.35 * maxStress1;

// Bombard with 5 days (120 hours) of extreme trauma and maximum stress
let assertTriggered = false;
for (let h = 0; h < 120; h += 0.5) {
  // Maximum acute conditions
  pStress.hungerStressAcc = 1.0;
  pStress.body.stress = 1.0;
  pStress.body.satiety = 0.0;
  // Repeated severe trauma signals
  FeelingSubstrate.receiveSignal(pStress, {
    kind: 'fear',
    intensity: 1.0,
    affect: 'fear',
    domain: 'danger',
    tick: h
  });
  try {
    FeelingSubstrate.update(pStress, 0.5);
  } catch (err) {
    assertTriggered = true;
  }
}

const finalResidue1 = FeelingSubstrate.getStressResidue(pStress);
const ceiling1Ok = !assertTriggered && (finalResidue1 <= ceiling1 + 1e-6) && (finalResidue1 >= ceiling1 - 1e-4);

// Also test custom maxStress (e.g. 0.80)
const pCustom = makeTestPawn('T_CustomCeiling', 22, 22);
pCustom.body.maxStress = 0.80;
const customCeiling = 0.35 * 0.80; // 0.2800

for (let h = 0; h < 72; h += 0.5) {
  pCustom.hungerStressAcc = 1.0;
  pCustom.body.stress = 1.0;
  FeelingSubstrate.receiveSignal(pCustom, { kind: 'fear', intensity: 1.0, affect: 'fear', domain: 'danger', tick: h });
  FeelingSubstrate.update(pCustom, 0.5);
}
const finalResidueCustom = FeelingSubstrate.getStressResidue(pCustom);
const customCeilingOk = (finalResidueCustom <= customCeiling + 1e-6) && (finalResidueCustom >= customCeiling - 1e-4);

assert(ceiling1Ok && customCeilingOk,
  'Criteria 3(c): Hard ceiling on stressResidue (≤ 0.35 * maxStress) strictly enforced',
  `standardResidue=${finalResidue1} ceiling=${ceiling1} customResidue=${finalResidueCustom} customCeiling=${customCeiling.toFixed(4)}`);

// =========================================================================
// 4. Acceptance Criteria 3(d): Recovery after 1 peaceful day (-8%/day)
// After 1 absolutely peaceful day (24h), residue decreases by ~8% (~0.08).
// 2-3 peaceful days ≈ fully dissipated.
// =========================================================================
const pHeal = makeTestPawn('T_PeacefulHeal', 30, 30);
pHeal.stressResidue = 0.2500;
pHeal.body.stress = 0.05;
pHeal.body.satiety = 0.90;
pHeal.body.hydration = 0.90;
pHeal.body.fatigue = 0.10;
pHeal.hungerStressAcc = 0.0;
pHeal.fearFatigueAcc = 0.0;
pHeal.painPatienceAcc = 0.0;
pHeal._recentSignals = []; // perfectly peaceful

const rBeforeDay1 = FeelingSubstrate.getStressResidue(pHeal);

// Simulate 24 hours of peaceful time (48 ticks of 0.5h)
for (let t = 0; t < 48; t++) {
  FeelingSubstrate.update(pHeal, 0.5);
}

const rAfterDay1 = FeelingSubstrate.getStressResidue(pHeal);
const day1Loss = rBeforeDay1 - rAfterDay1;
const day1Ok = Math.abs(day1Loss - 0.080) < 0.005;

// Simulate 2 more peaceful days (48 hours)
for (let t = 0; t < 96; t++) {
  FeelingSubstrate.update(pHeal, 0.5);
}
const rAfterDay3 = FeelingSubstrate.getStressResidue(pHeal);
const day3TanHet = rAfterDay3 <= 0.015; // 0.25 - 3 * 0.08 = 0.01 -> tan het

assert(day1Ok && day3TanHet,
  'Criteria 3(d): Peaceful day recovery matches ~8%/day; 2-3 peaceful days ≈ dissipates completely',
  `initial=${rBeforeDay1} afterDay1=${rAfterDay1} loss=${day1Loss.toFixed(4)} afterDay3=${rAfterDay3}`);

// =========================================================================
// 5. Acceptance Criteria 3(e): Residue does NOT drown out acute signal
// Pawn with high residue has background anxious/vigilant, but when encountering
// a real wildfire, acute dominant is still overwhelmingly 'terrified'.
// =========================================================================
const pTrauma = makeTestPawn('T_TraumaFire', 40, 40);
pTrauma.stressResidue = 0.3500; // max ceiling residue
pTrauma.body.stress = 0.10;
pTrauma.body.satiety = 0.85;
pTrauma.body.hydration = 0.85;
pTrauma.body.fatigue = 0.20;

// In peace: pawn feels background unease (anxious or vigilant, not content)
const peaceScape = FeelingSubstrate.getFeelingScape(pTrauma);
const feelsUneaseInPeace = peaceScape.dominant === 'anxious' || peaceScape.dominant === 'vigilant';

// Now real wildfire breaks out 3 cells away
const origBurning = (typeof BURNING !== 'undefined' && Array.isArray(BURNING)) ? BURNING.slice() : [];
if (typeof BURNING !== 'undefined') BURNING.length = 0;
const fireTile = { wx: 43, wy: 40, t: 5.0 };
if (typeof BURNING !== 'undefined') BURNING.push(fireTile);

// Run production wildfireTick
wildfireTick(0.1);

const fireScape = FeelingSubstrate.getFeelingScape(pTrauma);
const acuteWins = fireScape.dominant === 'terrified';

// Restore burning
if (typeof BURNING !== 'undefined') {
  BURNING.length = 0;
  for (const b of origBurning) BURNING.push(b);
}

assert(feelsUneaseInPeace && acuteWins,
  'Criteria 3(e): Background stress residue yields to acute disaster (fire dominant = terrified)',
  `peaceDominant=${peaceScape.dominant} fireDominant=${fireScape.dominant} acuteWins=${acuteWins}`);

// =========================================================================
// 6. Acceptance Criteria 3(f): No double- or triple-counting from same fire
// Along with wildfireTick (<=16) and survivalGuard (<=12) and acoustic fire roar,
// verify total signal ingested into accumulators in a single tick does not exceed single-source cap.
// =========================================================================
const pFireGuard = makeTestPawn('T_FireGuard', 60, 60);
pFireGuard.fearFatigueAcc = 0.0;
pFireGuard.x = 60 * CS + 16;
pFireGuard.y = 60 * CS + 16;

// Create fire tile 6 cells away: within wildfireTick (16), survivalGuard (12), and fire_roar (16)
const fireTileMulti = { wx: 66, wy: 60, x: 66 * CS + 16, y: 60 * CS + 16, burnH: 5.0, kind: 'wildfire', t: 5.0 };
if (typeof BURNING !== 'undefined') BURNING.push(fireTileMulti);

const tickNow = 10.0;
W.day = 1; W.tod = 10;

// Run wildfireTick (emits visual wildfire signal AND propagates acoustic fire roar)
wildfireTick(0.1);
const accAfterWildfire = pFireGuard.fearFatigueAcc;

// Run survivalGuard (detects same fire threat)
survivalGuard(pFireGuard);
const accAfterGuard = pFireGuard.fearFatigueAcc;

// Clean up burning tile
const bIdx = BURNING.indexOf(fireTileMulti);
if (bIdx >= 0) BURNING.splice(bIdx, 1);

// Formula guarantee: total accumulator added in tick does NOT sum all 3 (e.g. 0.85 + 0.82 + 0.50 = 2.17)
// Instead it is clamped to peak single-source intensity (<= 0.95)
const noTripleCount = accAfterGuard <= 0.95 && (accAfterGuard === accAfterWildfire || accAfterGuard < accAfterWildfire + 0.1);

assert(noTripleCount && accAfterGuard > 0,
  'Criteria 3(f): No double/triple-counting — multi-system fire emissions bounded by co-channel peak',
  `accAfterWildfire+Roar=${accAfterWildfire.toFixed(3)} accAfterSurvivalGuard=${accAfterGuard.toFixed(3)} bounded=${noTripleCount}`);

// =========================================================================
// 7. Sleeping pawn acoustic waking/interruption
// A sleeping guard or villager is jolted awake by loud acoustic scream.
// =========================================================================
const pSleep = makeTestPawn('T_SleepGuard', 70, 70, { role: 'guard' });
pSleep.state = 'sleep';
pSleep.plan = [{ verb: 'sleep' }];

// Propagate scream 5 cells away
FeelingSubstrate.propagateSound({
  kind: 'scream',
  originX: (75 * CS + 16),
  originY: (70 * CS + 16),
  radius: 25,
  sourceName: 'screamer'
});

const wokeUp = pSleep.state !== 'sleep';
assert(wokeUp,
  'A2 Sleeping pawn interruption: Loud acoustic scream wakes sleeping guard',
  `stateAfterScream=${pSleep.state}`);

// =========================================================================
// 8. Sound Event Kinds Coverage (scream, fire_roar, wolf_growl, brawl_noise, thunder)
// All 5 sound events in SPEC E3 map to acoustic_* in WORLD_EVENT_SIGNAL_TABLE.
// =========================================================================
const testKinds = ['scream', 'fire_roar', 'wolf_growl', 'brawl_noise', 'thunder'];
const allAcoustic = testKinds.every(k => {
  const norm = FeelingSubstrate.normalizeEvent(k);
  return norm.domain === 'acoustic' && norm.kind.startsWith('acoustic_');
});

assert(allAcoustic,
  'A2 Acoustic Sound Kinds: All 5 sound events normalize to acoustic_* domain with proper metadata',
  `kindsTested=${testKinds.join(', ')} allAcoustic=${allAcoustic}`);

// =========================================================================
// 9. WorkFactor impact from stressResidue
// stressResidue reduces body workFactor slightly according to ADR-003.
// =========================================================================
const pWf = makeTestPawn('T_WfTest', 80, 80);
pWf.stressResidue = 0.0;
calcBodyFactors(pWf);
const wfBaseline = pWf.bodyWorkFactor;

pWf.stressResidue = 0.35; // max ceiling
calcBodyFactors(pWf);
const wfWithResidue = pWf.bodyWorkFactor;

const wfReducedSlightly = wfWithResidue < wfBaseline && wfWithResidue >= 0.85;
assert(wfReducedSlightly,
  '3B WorkFactor Impact: stressResidue slightly reduces workFactor without economic collapse',
  `wfBaseline=${wfBaseline} wfWithMaxResidue=${wfWithResidue} reduction=${+(wfBaseline - wfWithResidue).toFixed(3)}`);

// =========================================================================
// 10. Test Entity Cleanup & Canonical Settlement Preservation
// =========================================================================
const pawnsCleanedCount = createdTestPawns.length;
cleanupPawns();
const canonicalSafe = VILLAGERS.every(v => !v.name.startsWith('T_'));

assert(pawnsCleanedCount > 0 && createdTestPawns.length === 0 && canonicalSafe,
  'Cleanup: All test pawns removed cleanly; canonical settlement preserved',
  `cleanedCount=${pawnsCleanedCount} canonicalSafe=${canonicalSafe}`);

console.log('================================================');
console.log(`Probe results: ${passedCount} passed, ${failedCount} failed.`);
console.log('================================================');

if (failedCount > 0) {
  process.exit(1);
}
