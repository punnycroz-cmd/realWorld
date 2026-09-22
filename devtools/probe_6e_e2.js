'use strict';
// devtools/probe_6e_e2.js
// Production-path probe for Phase 6E Slice E2:
// 1. Core 12 Qualities feeling-scape merge (A1/D2).
// 2. D2 Vocabulary-only reading conditions[] (Burnt-throat differential test).
// 3. Dynamic responsiveness (fire overrides content).
// 4. WHY HUD float purge (qualities displayed in words, zero float feelings).
// 5. S2 substrate lint check with bracket access hardening.
// 6. Test entity cleanup.

const fs = require('fs');
const pathModule = require('path');
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
  process.exit(2);
}

console.log('=== PHASE 6E SLICE E2 PRODUCTION-PATH PROBE ===');

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

// -------------------------------------------------------------------
// 1. S2: Substrate Lint Rule & Bracket Access Bypass Test
// -------------------------------------------------------------------
const cleanSnippet = "const felt = FeelingSubstrate.feel(v);\nif(felt.stress > 0.5) rest();";
const dotBypass = "const h = v.body.hydration;\nif(h < 0.2) drink();";
const bracketBypass = "const f = v['body'].fatigue;\nif(f > 0.8) sleep();";

const cleanRes = FeelingSubstrate.lintBrainCode(cleanSnippet);
const dotRes = FeelingSubstrate.lintBrainCode(dotBypass);
const bracketRes = FeelingSubstrate.lintBrainCode(bracketBypass);

assertProbe(
  cleanRes.passed === true && dotRes.passed === false && bracketRes.passed === false,
  'S2 Bypass Test (Dot + Bracket Access)',
  `clean=${cleanRes.passed} dotCatch=${!dotRes.passed} bracketCatch=${!bracketRes.passed}`
);

// -------------------------------------------------------------------
// 2. S2: Static Audit of src/brain/**
// -------------------------------------------------------------------
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
    if (/\bv\.body\./.test(line) || /\bv\s*\[\s*['"]body['"]\s*\]\./.test(line)) {
      if (line.includes('lintBrainCode') || line.includes('/\\bv\\.body\\./')) continue;
      if (bf === '09_bridge.js' && (trimmed.includes('v.body.hydration = 1.0;') || trimmed.includes('v.body.satiety = 1.0;'))) {
        legacyCount++;
      } else {
        unwhitelistedCount++;
      }
    }
  }
}
assertProbe(
  unwhitelistedCount === 0 && legacyCount === 2,
  'S2 Codebase Audit in src/brain/**',
  `unwhitelisted=${unwhitelistedCount} grandfatheredLegacy=${legacyCount} (expected 2 in 09_bridge.js)`
);

// -------------------------------------------------------------------
// 3. A1/D2: 12 Core Qualities Full Coverage & Quota Cap
// -------------------------------------------------------------------
const CORE_12 = ['hollow', 'parched', 'heavy', 'burning', 'anxious', 'terrified', 'enraged', 'content', 'lonely', 'revered', 'confused', 'vigilant'];
const testPawn = {
  name: 'T_Probe_Pawn',
  role: 'farmer',
  body: { satiety: 0.9, hydration: 0.9, fatigue: 0.1, coreTemp: 37.0, stress: 0.05, injury: 0.0, blood: 1.0, wounds: [] },
  conditions: [],
  emotions: [],
  thoughts: [],
  chatT: 0
};
FeelingSubstrate.ensureSubstrate(testPawn);

const verifiedQualities = new Set();

// a. Content (equilibrium)
const scContent = FeelingSubstrate.getFeelingScape(testPawn);
if (scContent.dominant === 'content') verifiedQualities.add('content');

// b. Hollow (hunger)
testPawn.body.satiety = 0.10;
const scHollow = FeelingSubstrate.getFeelingScape(testPawn);
if (scHollow.dominant === 'hollow') verifiedQualities.add('hollow');
testPawn.body.satiety = 0.90;

// c. Parched (thirst)
testPawn.body.hydration = 0.10;
const scParched = FeelingSubstrate.getFeelingScape(testPawn);
if (scParched.dominant === 'parched') verifiedQualities.add('parched');
testPawn.body.hydration = 0.90;

// d. Heavy (fatigue)
testPawn.body.fatigue = 0.90;
const scHeavy = FeelingSubstrate.getFeelingScape(testPawn);
if (scHeavy.dominant === 'heavy') verifiedQualities.add('heavy');
testPawn.body.fatigue = 0.10;

// e. Burning (fever)
testPawn.body.coreTemp = 39.5;
const scBurning = FeelingSubstrate.getFeelingScape(testPawn);
if (scBurning.dominant === 'burning') verifiedQualities.add('burning');
testPawn.body.coreTemp = 37.0;

// f. Terrified (fire signal / fear)
FeelingSubstrate.receiveSignal(testPawn, { kind: 'threat_fire', intensity: 0.95, domain: 'danger', affect: 'fear', tick: 0 });
const scTerrified = FeelingSubstrate.getFeelingScape(testPawn);
if (scTerrified.dominant === 'terrified') verifiedQualities.add('terrified');
testPawn._recentSignals = [];
testPawn.fearFatigueAcc = 0.0;

// g. Anxious (stress)
testPawn.body.stress = 0.85;
const scAnxious = FeelingSubstrate.getFeelingScape(testPawn);
if (scAnxious.dominant === 'anxious') verifiedQualities.add('anxious');
testPawn.body.stress = 0.05;

// h. Enraged (anger)
testPawn.emotions = [{ tag: 'anger', intensity: 0.90 }];
const scEnraged = FeelingSubstrate.getFeelingScape(testPawn);
if (scEnraged.dominant === 'enraged') verifiedQualities.add('enraged');
testPawn.emotions = [];

// i. Lonely (social isolation)
testPawn.chatT = 18.0;
const scLonely = FeelingSubstrate.getFeelingScape(testPawn);
if (scLonely.dominant === 'lonely') verifiedQualities.add('lonely');
testPawn.chatT = 0;

// j. Revered (social pride / elder)
testPawn.role = 'elder';
testPawn.reputation = 0.85;
const scRevered = FeelingSubstrate.getFeelingScape(testPawn);
if (scRevered.dominant === 'revered') verifiedQualities.add('revered');
testPawn.role = 'farmer';
testPawn.reputation = 0.3;

// k. Confused (severe fever delirium / head trauma)
testPawn.conditions = [{ id: 'concussion', loc: 'head', sev: 0.7 }];
const scConfused = FeelingSubstrate.getFeelingScape(testPawn);
if (scConfused.dominant === 'confused') verifiedQualities.add('confused');
testPawn.conditions = [];

// l. Vigilant (hunt action / guard)
testPawn.state = 'hunt';
const scVigilant = FeelingSubstrate.getFeelingScape(testPawn);
if (scVigilant.dominant === 'vigilant') verifiedQualities.add('vigilant');
testPawn.state = 'sleep';

const all12Covered = CORE_12.every(q => verifiedQualities.has(q));
assertProbe(
  all12Covered && verifiedQualities.size === 12,
  'A1/D2 12 Core Qualities Quota Coverage',
  `covered=${verifiedQualities.size}/12 [${Array.from(verifiedQualities).join(', ')}]`
);

// -------------------------------------------------------------------
// 4. D2: Burnt-Throat vs Hydration Differential Test
// -------------------------------------------------------------------
const ctrlPawn = {
  name: 'T_Probe_Ctrl',
  body: { satiety: 0.8, hydration: 0.15, fatigue: 0.1, coreTemp: 37.0, stress: 0.05 },
  conditions: []
};
const burntPawn = {
  name: 'T_Probe_BurntThroat',
  body: { satiety: 0.8, hydration: 0.15, fatigue: 0.1, coreTemp: 37.0, stress: 0.05 },
  conditions: [{ id: 'throat_burn', blocksAction: 'drink', desc: 'scorched throat' }]
};
FeelingSubstrate.ensureSubstrate(ctrlPawn);
FeelingSubstrate.ensureSubstrate(burntPawn);

// Both drink water to full hydration
ctrlPawn.body.hydration = 1.0;
burntPawn.body.hydration = 1.0;

const scapeCtrl = FeelingSubstrate.getFeelingScape(ctrlPawn);
const scapeBurnt = FeelingSubstrate.getFeelingScape(burntPawn);

const differentialOk = scapeCtrl.dominant === 'content' && scapeBurnt.dominant === 'parched';
assertProbe(
  differentialOk,
  'D2 Burnt-Throat Differential Test (conditions[])',
  `ctrlDominant=${scapeCtrl.dominant} burntThroatDominant=${scapeBurnt.dominant}`
);

// -------------------------------------------------------------------
// 5A. Production-Path Wildfire Differential Probe (ZERO manual injection)
// Examiner Requirement 3: Real wildfire through game systems shifts nearby
// villager scape from content without taking body burn damage; control pawn stays content.
// -------------------------------------------------------------------
const ctrlPawnNoFire = {
  name: 'T_Probe_Ctrl_NoFire',
  x: 50 * 32 + 16, y: 50 * 32 + 16,
  body: { satiety: 0.9, hydration: 0.9, fatigue: 0.1, stress: 0.05, injury: 0 },
  conditions: [],
  _recentSignals: []
};
const expPawnWildfire = {
  name: 'T_Probe_Exp_Wildfire',
  x: 50 * 32 + 16, y: 50 * 32 + 16,
  body: { satiety: 0.9, hydration: 0.9, fatigue: 0.1, stress: 0.05, injury: 0 },
  conditions: [],
  _recentSignals: []
};
FeelingSubstrate.ensureSubstrate(ctrlPawnNoFire);
FeelingSubstrate.ensureSubstrate(expPawnWildfire);

VILLAGERS.push(ctrlPawnNoFire);
VILLAGERS.push(expPawnWildfire);

const backupBurning = (typeof BURNING !== 'undefined' && Array.isArray(BURNING)) ? BURNING.slice() : [];
BURNING.length = 0;

// 1. Control run: no fire anywhere -> scape must be content
if (typeof wildfireTick === 'function') wildfireTick(0.1);
const ctrlScape = FeelingSubstrate.getFeelingScape(ctrlPawnNoFire);
const okCtrl = ctrlScape.dominant === 'content' && ctrlScape.tone === 'positive';

// 2. Real wildfire run: add burning tile at wx: 53, wy: 50 (3 cells away, within sight 16 cells, > 1.2 cells so ZERO injury)
BURNING.push({ wx: 53, wy: 50, t: 5.0 });
if (typeof wildfireTick === 'function') wildfireTick(0.1);

const expInjury = expPawnWildfire.body.injury || 0;
const expScape = FeelingSubstrate.getFeelingScape(expPawnWildfire);
const okExp = expInjury === 0 && expScape.dominant === 'terrified' && expScape.tone === 'negative';

// Restore BURNING and cleanup
BURNING.length = 0;
for (const b of backupBurning) BURNING.push(b);
const cIdx = VILLAGERS.indexOf(ctrlPawnNoFire); if (cIdx >= 0) VILLAGERS.splice(cIdx, 1);
const eIdx = VILLAGERS.indexOf(expPawnWildfire); if (eIdx >= 0) VILLAGERS.splice(eIdx, 1);

assertProbe(
  okCtrl && okExp,
  'Production-Path Wildfire Differential Probe (Game Systems, Zero Injection)',
  `ctrlDominant=${ctrlScape.dominant} expDominant=${expScape.dominant} expInjury=${expInjury}`
);

// -------------------------------------------------------------------
// 5B. Live A3 Arrows for 5 previously dead signals (Fix B1 Nửa 1)
// death -> heavy, downed -> terrified/heavy, gossip -> vigilant/anxious,
// birth -> revered, marriage -> revered. High intensity never drops to content.
// -------------------------------------------------------------------
const pDeath = { name: 'T_P_Death', body: { satiety: 0.9, hydration: 0.9 }, conditions: [], _recentSignals: [] };
FeelingSubstrate.receiveSignal(pDeath, FeelingSubstrate.normalizeEvent('death', null, { intensity: 1.0 }));
const scDeath = FeelingSubstrate.getFeelingScape(pDeath);

const pDowned = { name: 'T_P_Downed', body: { satiety: 0.9, hydration: 0.9 }, conditions: [], _recentSignals: [] };
FeelingSubstrate.receiveSignal(pDowned, FeelingSubstrate.normalizeEvent('downed', null, { intensity: 0.95 }));
const scDowned = FeelingSubstrate.getFeelingScape(pDowned);

const pGossip = { name: 'T_P_Gossip', body: { satiety: 0.9, hydration: 0.9 }, conditions: [], _recentSignals: [] };
FeelingSubstrate.receiveSignal(pGossip, FeelingSubstrate.normalizeEvent('gossip', null, { intensity: 0.85 }));
const scGossip = FeelingSubstrate.getFeelingScape(pGossip);

const pBirth = { name: 'T_P_Birth', body: { satiety: 0.9, hydration: 0.9 }, conditions: [], _recentSignals: [] };
FeelingSubstrate.receiveSignal(pBirth, FeelingSubstrate.normalizeEvent('birth', null, { intensity: 0.85 }));
const scBirth = FeelingSubstrate.getFeelingScape(pBirth);

const pMarriage = { name: 'T_P_Marriage', body: { satiety: 0.9, hydration: 0.9 }, conditions: [], _recentSignals: [] };
FeelingSubstrate.receiveSignal(pMarriage, FeelingSubstrate.normalizeEvent('marriage', null, { intensity: 0.85 }));
const scMarriage = FeelingSubstrate.getFeelingScape(pMarriage);

const ok5DeadSignals = (scDeath.dominant === 'heavy' && scDeath.tone === 'negative') &&
                       ((scDowned.dominant === 'terrified' || scDowned.dominant === 'heavy') && scDowned.tone === 'negative') &&
                       ((scGossip.dominant === 'vigilant' || scGossip.dominant === 'anxious') && scGossip.dominant !== 'content') &&
                       (scBirth.dominant === 'revered' && scBirth.tone === 'positive') &&
                       (scMarriage.dominant === 'revered' && scMarriage.tone === 'positive');

assertProbe(
  ok5DeadSignals,
  'Live A3 Arrows: 5 Previously Dead Kinds Route to Active Scape',
  `death=${scDeath.dominant} downed=${scDowned.dominant} gossip=${scGossip.dominant} birth=${scBirth.dominant} marriage=${scMarriage.dominant}`
);

// -------------------------------------------------------------------
// 5C. Production Caller Wiring: killVillager, setDowned, spreadGossip
// -------------------------------------------------------------------
const pVictim = { name: 'T_P_Victim', x: 20 * 32, y: 20 * 32, body: { satiety: 0.5 }, conditions: [] };
const pWitness = { name: 'T_P_Witness', x: 22 * 32, y: 20 * 32, body: { satiety: 0.9, hydration: 0.9 }, conditions: [], _recentSignals: [] };
VILLAGERS.push(pVictim, pWitness);
if (typeof killVillager === 'function') killVillager(pVictim, 'exposure');
const scWitness = FeelingSubstrate.getFeelingScape(pWitness);

const pDownTarget = { name: 'T_P_DownTarget', x: 25 * 32, y: 25 * 32, body: { satiety: 0.9, hydration: 0.9 }, conditions: [], _recentSignals: [] };
VILLAGERS.push(pDownTarget);
if (typeof setDowned === 'function') setDowned(pDownTarget, 'unconscious', 'fever');
const scDownTarget = FeelingSubstrate.getFeelingScape(pDownTarget);

const pGossipSpk = { name: 'T_P_GSpk', x: 30 * 32, y: 30 * 32, body: {}, conditions: [] };
const pGossipLst = { name: 'T_P_GLst', x: 31 * 32, y: 30 * 32, body: { satiety: 0.9, hydration: 0.9 }, conditions: [], _recentSignals: [] };
VILLAGERS.push(pGossipSpk, pGossipLst);
if (typeof spreadGossip === 'function') spreadGossip(pGossipSpk, pGossipLst, { kind: 'theft-witnessed' });
const scGossipLst = FeelingSubstrate.getFeelingScape(pGossipLst);

const okCallers = (scWitness.dominant === 'heavy') &&
                  (scDownTarget.dominant === 'terrified' || scDownTarget.dominant === 'heavy') &&
                  (scGossipLst.dominant === 'vigilant' || scGossipLst.dominant === 'anxious');

// Cleanup
for (const p of [pVictim, pWitness, pDownTarget, pGossipSpk, pGossipLst]) {
  const idx = VILLAGERS.indexOf(p);
  if (idx >= 0) VILLAGERS.splice(idx, 1);
}

assertProbe(
  okCallers,
  'Production Callers Emit Signals via Real Systems (killVillager, setDowned, spreadGossip)',
  `witnessDeath=${scWitness.dominant} setDowned=${scDownTarget.dominant} spreadGossip=${scGossipLst.dominant}`
);

// -------------------------------------------------------------------
// 6. WHY HUD: Float Purge & Text Display
// -------------------------------------------------------------------
const whyPawn = {
  name: 'T_Probe_WhyHud',
  role: 'farmer',
  body: { satiety: 0.25, hydration: 0.8, fatigue: 0.7, stress: 0.65, coreTemp: 37.0 },
  inv: {},
  traits: [],
  personality: { brave: 1.0, cautious: 1.0, industrious: 1.0, lazy: 0.0 },
  equippedTool: { icon: '🪓', name: 'Axe', desc: 'Tool' },
  conditions: [],
  thoughts: [],
  emotions: [],
  plan: []
};
FeelingSubstrate.ensureSubstrate(whyPawn);
evaluateVillagerUtility(whyPawn);

// Set inspected pawn
if (typeof VILLAGERS !== 'undefined') {
  VILLAGERS.push(whyPawn);
  inspectedPawnIdx = VILLAGERS.length - 1;
}
updateHUD();

const piWhyEl = document.getElementById('pi-why');
const whyHtml = piWhyEl ? piWhyEl.innerHTML : '';

const hasFeelingDiv = whyHtml.includes('pi-why-feeling');
const feelingWordsPattern = /feeling:\s*[a-z]+(\s*·\s*[a-z]+)?/i.test(whyHtml);
const noFloatFeelings = !/stress\s*0\.\d+/i.test(whyHtml) && !/feeling:\s*\d+/i.test(whyHtml) && !/hungry\s*\d+%/i.test(whyHtml);

// Verify explainAction
const explainData = window.__aiBridge.explainAction(whyPawn.name);
const explainScapeOk = explainData && explainData.feelingScape && typeof explainData.feelingScape.dominant === 'string';

// Cleanup from VILLAGERS
if (typeof VILLAGERS !== 'undefined') {
  const idx = VILLAGERS.indexOf(whyPawn);
  if (idx !== -1) VILLAGERS.splice(idx, 1);
}

assertProbe(
  hasFeelingDiv && feelingWordsPattern && noFloatFeelings && explainScapeOk,
  'WHY HUD Float Purge & Qualitative Text Display',
  `hasDiv=${hasFeelingDiv} wordsOnly=${feelingWordsPattern} noFloats=${noFloatFeelings} explainScape=${explainScapeOk}`
);

// -------------------------------------------------------------------
// 7. Entity Cleanup & Canonical Settlement Preservation
// -------------------------------------------------------------------
const canonicalPurity = (typeof VILLAGERS === 'undefined') || VILLAGERS.every(v => !v.name.startsWith('T_Probe'));
assertProbe(canonicalPurity, 'Entity Cleanup & Canonical Settlement Integrity', `canonicalSafe=${canonicalPurity}`);

console.log('='.repeat(48));
console.log(`Probe results: ${passCount} passed, ${failCount} failed.`);
console.log('='.repeat(48));

if (failCount > 0) {
  process.exit(1);
}
