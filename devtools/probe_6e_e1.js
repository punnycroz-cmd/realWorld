'use strict';
// devtools/probe_6e_e1.js
// Production-path probe for Phase 6E Slice E1:
// S1 (Substrate Interface), S2 (Lint Rule & Bypass Test), A3 (Event->Signal Table),
// D1 (3 Decay Accumulators: hunger->stress, fear->exhaustion, pain->patience),
// and Determinism across tick sizes.
const fs = require('fs');
const pathModule = require('path');
const vm = require('vm');
const htmlPath = '/home/hatch/workspace/world-sim/willowbrook_natura.html';
const html = fs.readFileSync(htmlPath, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }
const pageJS = m[1];

// ---- DOM/canvas stubs ----
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
global.location = { search: '' }; // Live sim boot without ?test suite
global.requestAnimationFrame = () => 0;
try { global.navigator = { userAgent: 'node' }; } catch (e) {}

try {
  vm.runInThisContext(pageJS, { filename: 'willowbrook_natura.page.js' });
} catch (e) {
  console.error('BUNDLE EVAL FAILED:', e.message);
  process.exit(2);
}

console.log('=== PHASE 6E SLICE E1 PRODUCTION-PATH PROBE ===');

let passCount = 0;
let failCount = 0;
function assertProbe(ok, label, detail) {
  if (ok) {
    passCount++;
    console.log(`[PASS] ${label} | ${detail || ''}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${label} | ${detail || ''}`);
  }
}

// 1. S2: Lint Rule bypass test
const cleanSnippet = "const felt = FeelingSubstrate.feel(v);\nif(felt.stress > 0.5) rest();";
const bypassSnippet = "const h = v.body.hydration;\nif(h < 0.2) drink();";
const cleanRes = FeelingSubstrate.lintBrainCode(cleanSnippet);
const bypassRes = FeelingSubstrate.lintBrainCode(bypassSnippet);
assertProbe(
  cleanRes.passed === true && bypassRes.passed === false && bypassRes.violations.length === 1,
  'S2 Bypass Test',
  `cleanPass=${cleanRes.passed} bypassFail=${!bypassRes.passed}`
);

// 2. S2: Real src/brain/** static audit
const brainDir = htmlPath.replace('willowbrook_natura.html', 'src/brain');
const brainFiles = fs.readdirSync(brainDir).filter(f => f.endsWith('.js'));
let unwhitelistedCount = 0;
let legacyCount = 0;
for (const bf of brainFiles) {
  const content = fs.readFileSync(pathModule.join(brainDir, bf), 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    if (line.includes('v.body.')) {
      if (line.includes('lintBrainCode') || line.includes('/v.body./')) continue;
      if (bf === '09_bridge.js' && (trimmed === 'v.body.hydration = 1.0;' || trimmed === 'v.body.satiety = 1.0;')) {
        legacyCount++;
      } else {
        unwhitelistedCount++;
        console.error(`  Un-whitelisted v.body. in ${bf}:${i+1}: ${trimmed}`);
      }
    }
  }
}
assertProbe(
  unwhitelistedCount === 0 && legacyCount === 2,
  'S2 Codebase Audit',
  `unwhitelisted=${unwhitelistedCount} grandfatheredLegacy=${legacyCount} (expected 2 in 09_bridge.js)`
);

// Helper for temporary test villager
const initialVillagerCount = VILLAGERS.length;
function createProbeVillager(name) {
  const v = mkTestV13(name, 40 * CS, 40 * CS, { stage: 'adult' });
  ensureBody(v);
  ensureEpistemic(v);
  FeelingSubstrate.ensureSubstrate(v);
  return v;
}

// 3. S1: Substrate Interface Contract
const vContract = createProbeVillager('Probe_Contract');
vContract.body.satiety = 0.65;
vContract.body.fatigue = 0.35;
vContract.body.hydration = 0.85;
const felt = FeelingSubstrate.feel(vContract);
const layers = FeelingSubstrate.getLayers(vContract);
const scape = FeelingSubstrate.getFeelingScape(vContract);
assertProbe(
  felt && layers && scape &&
  typeof felt.satiety === 'number' && typeof felt.patience === 'number' &&
  layers.couplings && layers.body && Array.isArray(layers.recentSignals) &&
  typeof scape.dominant === 'string',
  'S1 Substrate Interface Contract',
  `feel.patience=${felt.patience} layers.couplings=${JSON.stringify(layers.couplings)} scape=${JSON.stringify(scape)}`
);

// 4. A3: Event -> Signal Normalization & Ingestion
const testEvents = [
  'fire', 'wildfire', 'wolf', 'bear', 'storm', 'cold_snap',
  'death', 'birth', 'gossip', 'insult', 'fight', 'price_shock',
  'theft', 'injury', 'starvation', 'scream'
];
let allEventsNormalized = true;
for (const ev of testEvents) {
  const sig = FeelingSubstrate.normalizeEvent(ev, 10.0);
  if (!sig || !sig.kind || sig.intensity == null || sig.tick == null) {
    allEventsNormalized = false;
    break;
  }
}
const vSig = createProbeVillager('Probe_Signal');
const wolfSig = FeelingSubstrate.normalizeEvent('wolf', 10.0);
FeelingSubstrate.receiveSignal(vSig, wolfSig);
assertProbe(
  allEventsNormalized && vSig.fearFatigueAcc > 0.8 && vSig._recentSignals.length === 1,
  'A3 Event->Signal Table & Ingestion',
  `eventsChecked=${testEvents.length} pawnFearAcc=${vSig.fearFatigueAcc.toFixed(2)}`
);

// 5. D1 Coupling 1: hunger↑ → stress↑ (6h starving -> increases; eating full -> decays to ~0)
const vHunger = createProbeVillager('Probe_Hunger');
vHunger.body.satiety = 0.15; // starving (< 0.35)
vHunger.hungerStressAcc = 0.0;
const hungerAccTrend = [];
for (let h = 1; h <= 6; h++) {
  FeelingSubstrate.update(vHunger, 1.0);
  hungerAccTrend.push(vHunger.hungerStressAcc);
}
const monotonicRise = hungerAccTrend.every((v, i) => (i === 0 ? v > 0 : v > hungerAccTrend[i-1]));
const peakHungerAcc = vHunger.hungerStressAcc;

// Now eat to full and observe decay
vHunger.body.satiety = 1.0;
for (let h = 1; h <= 8; h++) {
  FeelingSubstrate.update(vHunger, 1.0);
}
const decayedHungerAcc = vHunger.hungerStressAcc;
assertProbe(
  monotonicRise && peakHungerAcc > 0.15 && decayedHungerAcc < 0.005,
  'D1 Coupling 1 (hunger -> stress)',
  `monotonicRise=${monotonicRise} peak6h=${peakHungerAcc.toFixed(4)} decayed8h=${decayedHungerAcc.toFixed(6)}`
);

// 6. D1 Coupling 2: fear↑↑ → exhaustion (3h boost then expires)
const vFear = createProbeVillager('Probe_Fear');
const vFearCtrl = createProbeVillager('Probe_FearCtrl');
vFear.body.fatigue = 0.10;
vFearCtrl.body.fatigue = 0.10;
vFear.state = 'sit';
vFearCtrl.state = 'sit';

// Trigger fear on vFear
FeelingSubstrate.receiveSignal(vFear, { kind: 'fear', intensity: 1.0, tick: 1 });
const initialFearAcc = vFear.fearFatigueAcc;

// Hour 1
FeelingSubstrate.update(vFear, 1.0);
FeelingSubstrate.update(vFearCtrl, 1.0);
const fearFatigue1h = vFear.body.fatigue - 0.10;
const ctrlFatigue1h = vFearCtrl.body.fatigue - 0.10;
const elevatedH1 = fearFatigue1h > ctrlFatigue1h;

// Hours 2 and 3
FeelingSubstrate.update(vFear, 1.0);
FeelingSubstrate.update(vFear, 1.0);
const fearAccEnd3h = vFear.fearFatigueAcc;

// Hour 4 (accumulator should have expired to 0)
const fatigueH4Start = vFear.body.fatigue;
FeelingSubstrate.update(vFear, 1.0);
const fatigueRateH4 = vFear.body.fatigue - fatigueH4Start;

assertProbe(
  initialFearAcc === 1.0 && elevatedH1 && fearAccEnd3h === 0.0 && fatigueRateH4 <= 0.0,
  'D1 Coupling 2 (fear -> exhaustion)',
  `initialAcc=${initialFearAcc} elevatedH1=${elevatedH1} fearAccEnd3h=${fearAccEnd3h} fatigueRateH4=${fatigueRateH4.toFixed(4)}`
);

// 7. D1 Coupling 3: pain↑ → patience↓ (social utility reduction)
const vHealthy = createProbeVillager('Probe_Healthy');
const vInjured = createProbeVillager('Probe_Injured');
const vPartner = createProbeVillager('Probe_Partner');
vHealthy.body.injury = 0.0;
vInjured.body.injury = 1.0; // High pain
vHealthy.chatT = 8.0;
vInjured.chatT = 8.0;

FeelingSubstrate.update(vHealthy, 1.0);
FeelingSubstrate.update(vInjured, 1.0);

const healthyPatience = FeelingSubstrate.getPatience(vHealthy);
const injuredPatience = FeelingSubstrate.getPatience(vInjured);

const socialCand = { id: 'socialize_' + vPartner.name, category: 'social' };
const healthySocialScore = scoreCandidateAction(vHealthy, socialCand);
const injuredSocialScore = scoreCandidateAction(vInjured, socialCand);
const socialPenalty = healthySocialScore - injuredSocialScore;

assertProbe(
  healthyPatience === 1.0 && injuredPatience < 0.85 && socialPenalty > 3.0,
  'D1 Coupling 3 (pain -> patience -> social utility)',
  `healthyPatience=${healthyPatience} injuredPatience=${injuredPatience} penalty=${socialPenalty.toFixed(2)}`
);

// 8. Determinism: identical values across different tick-sizes
const vDet1 = createProbeVillager('Probe_Det1');
const vDet2 = createProbeVillager('Probe_Det2');
const vDet3 = createProbeVillager('Probe_Det3');
vDet1.body.satiety = 0.10;
vDet2.body.satiety = 0.10;
vDet3.body.satiety = 0.10;

// 3h total: 3 x 1.0h vs 6 x 0.5h vs 12 x 0.25h
for (let i = 0; i < 3; i++) FeelingSubstrate.update(vDet1, 1.0);
for (let i = 0; i < 6; i++) FeelingSubstrate.update(vDet2, 0.5);
for (let i = 0; i < 12; i++) FeelingSubstrate.update(vDet3, 0.25);

const err12 = Math.abs(vDet1.hungerStressAcc - vDet2.hungerStressAcc);
const err13 = Math.abs(vDet1.hungerStressAcc - vDet3.hungerStressAcc);
assertProbe(
  err12 < 1e-4 && err13 < 1e-4,
  'Determinism Across Tick Sizes',
  `1.0h=${vDet1.hungerStressAcc.toFixed(6)} 0.5h=${vDet2.hungerStressAcc.toFixed(6)} 0.25h=${vDet3.hungerStressAcc.toFixed(6)} err12=${err12.toExponential(2)} err13=${err13.toExponential(2)}`
);

// 9. Cleanup verification
for (let i = VILLAGERS.length - 1; i >= 0; i--) {
  if (VILLAGERS[i].name.startsWith('Probe_')) {
    VILLAGERS.splice(i, 1);
  }
}
const finalVillagerCount = VILLAGERS.length;
assertProbe(
  finalVillagerCount === initialVillagerCount,
  'Test Entity Cleanup',
  `initial=${initialVillagerCount} final=${finalVillagerCount} cleaned=${initialVillagerCount === finalVillagerCount}`
);

console.log(`\nProbe results: ${passCount} passed, ${failCount} failed.`);
process.exit(failCount === 0 ? 0 : 1);
