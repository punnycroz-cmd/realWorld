// Live probe for Phase 6C Survival Guard & Anti-Oscillation Fix
// Demonstrates against the REAL bundled willowbrook_natura.html:
// (1) Live bundled planTick chain: {verb:'work'} step, blood=0.5 -> interrupted=true, plan becomes rest/tend with guard:true
// (2) Stability >= 8 ticks after trigger under continued low blood (no oscillation / blind re-cancel)
// (3) Production brainThink choke point: {verb:'work'} step, blood=0.5 -> interrupted=true, plan becomes rest/tend with guard:true
// (4) Stability >= 8 ticks after trigger in brainThink
// (5) Stability after guardLock decay (10 ticks): action remains guarded rest/tend, no thrash
// (6) Healthy control villager: blood=1.0, {verb:'work'} progresses normally without false interrupt
const fs = require('fs');
const vm = require('vm');
const path = '/home/hatch/workspace/world-sim/willowbrook_natura.html';
const html = fs.readFileSync(path, 'utf-8');
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
global.location = { search: '' }; // boot WITHOUT ?test suite
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
  console.log('\n=== PROBE 1: REAL BUNDLED planTick WRAPPER CHAIN WITH {verb:\'work\'} & blood=0.5 ===');
  const v1 = mkTestV15('Probe_PlanTick_Work', 5, 5);
  v1.body.hydration = 0.90;
  v1.body.satiety = 0.90;
  v1.body.coreTemp = 37.0;
  v1.body.blood = 0.50; // blood=0.5 (low blood deficit triggers rest_or_tend)
  v1.plan = [{ verb: 'work', hours: 3 }];
  v1.currentAction = { id: 'work_farming', category: 'work' };

  // Trigger interrupt via real bundled planTick chain
  planTick(v1, 0.05);

  const p1Interrupted = v1.interrupted === true && v1.guardLock > 0;
  const p1Step = v1.plan && v1.plan.length ? v1.plan[0] : null;
  const p1IsRestOrTend = p1Step && (p1Step.verb === 'rest' || p1Step.verb === 'tend') && p1Step.guard === true;

  check(p1Interrupted, 'P1.1: planTick interrupts work action on blood=0.5',
    `interrupted=${v1.interrupted} guardLock=${v1.guardLock}`);
  check(p1IsRestOrTend, 'P1.2: plan replaced with guarded rest/tend',
    `verb=${p1Step && p1Step.verb} guard=${p1Step && p1Step.guard}`);

  // Stability for >= 8 ticks under continued low blood (blood=0.50)
  let p1Stable = true;
  for(let i = 0; i < 8; i++){
    planTick(v1, 0.02);
    const cur = v1.plan && v1.plan.length ? v1.plan[0] : null;
    if(!cur || (cur.verb !== 'rest' && cur.verb !== 'tend') || !cur.guard){
      p1Stable = false;
      break;
    }
  }
  check(p1Stable, 'P1.3: planTick stays stable >= 8 ticks after trigger (no oscillation)',
    `stable=${p1Stable} curVerb=${v1.plan && v1.plan[0] && v1.plan[0].verb}`);
  rmTestV13(v1);

  console.log('\n=== PROBE 2: PRODUCTION brainThink CHOKE POINT WITH {verb:\'work\'} & blood=0.5 ===');
  const v2 = mkTestV15('Probe_BrainThink_Work', 5, 5);
  v2.body.hydration = 0.90;
  v2.body.satiety = 0.90;
  v2.body.coreTemp = 37.0;
  v2.body.blood = 0.50;
  v2.plan = [{ verb: 'work', hours: 3 }];
  v2.currentAction = { id: 'work_farming', category: 'work' };

  // Trigger interrupt via production brainThink
  const outcome2 = brainThink(v2, 0.05);

  const p2Interrupted = v2.interrupted === true && v2.guardLock > 0;
  const p2Step = v2.plan && v2.plan.length ? v2.plan[0] : null;
  const p2IsRestOrTend = p2Step && (p2Step.verb === 'rest' || p2Step.verb === 'tend') && p2Step.guard === true;
  const p2OutcomeValid = outcome2 != null && outcome2.plan != null;

  check(p2Interrupted, 'P2.1: brainThink interrupts work action on blood=0.5',
    `interrupted=${v2.interrupted} guardLock=${v2.guardLock}`);
  check(p2IsRestOrTend, 'P2.2: brainThink sets plan to guarded rest/tend',
    `verb=${p2Step && p2Step.verb} guard=${p2Step && p2Step.guard}`);
  check(p2OutcomeValid, 'P2.3: brainThink returns valid outcome object for brainLearn',
    `outcomeValid=${p2OutcomeValid}`);

  // Stability for >= 8 ticks under continued low blood in brainThink
  let p2Stable = true;
  for(let i = 0; i < 8; i++){
    brainThink(v2, 0.02);
    const cur = v2.plan && v2.plan.length ? v2.plan[0] : null;
    if(!cur || (cur.verb !== 'rest' && cur.verb !== 'tend') || !cur.guard){
      p2Stable = false;
      break;
    }
  }
  check(p2Stable, 'P2.4: brainThink stays stable >= 8 ticks after trigger',
    `stable=${p2Stable} curVerb=${v2.plan && v2.plan[0] && v2.plan[0].verb}`);
  rmTestV13(v2);

  console.log('\n=== PROBE 3: FULL ANTI-OSCILLATION & LOCK EXPIRATION (>10 TICKS) ===');
  const v3 = mkTestV15('Probe_AntiOsc_Decay', 5, 5);
  v3.body.hydration = 0.90;
  v3.body.satiety = 0.90;
  v3.body.coreTemp = 37.0;
  v3.body.blood = 0.50;
  v3.plan = [{ verb: 'work', hours: 3 }];
  v3.currentAction = { id: 'work_farming', category: 'work' };

  // Trigger
  brainThink(v3, 0.05);
  check(v3.guardLock === 10, 'P3.1: guardLock initialized to 10 on interrupt', `lock=${v3.guardLock}`);

  // Run 12 ticks through brainThink so guardLock decays through 0
  let lockReachedZero = false;
  let stayedOnGuardedRest = true;
  for(let tick = 1; tick <= 12; tick++){
    brainThink(v3, 0.02);
    if(v3.guardLock === 0) lockReachedZero = true;
    const cur = v3.plan && v3.plan.length ? v3.plan[0] : null;
    if(!cur || (cur.verb !== 'rest' && cur.verb !== 'tend') || !cur.guard){
      stayedOnGuardedRest = false;
      break;
    }
  }
  check(lockReachedZero, 'P3.2: guardLock decayed to 0 after >10 ticks', `lock=${v3.guardLock}`);
  check(stayedOnGuardedRest, 'P3.3: action remains guarded rest even after lock=0 (no blind re-cancel)',
    `stayedGuarded=${stayedOnGuardedRest} curVerb=${v3.plan && v3.plan[0] && v3.plan[0].verb}`);
  rmTestV13(v3);

  console.log('\n=== PROBE 4: HEALTHY CONTROL (blood=1.0) PROGRESSES WORK WITHOUT FALSE INTERRUPT ===');
  const v4 = mkTestV15('Probe_Healthy_Work', 5, 5);
  v4.body.hydration = 0.90;
  v4.body.satiety = 0.90;
  v4.body.coreTemp = 37.0;
  v4.body.blood = 1.00; // Full health
  v4.plan = [{ verb: 'work', hours: 3 }];
  v4.currentAction = { id: 'work_farming', category: 'work' };

  planTick(v4, 0.1);
  const prog1 = v4.workProgress || 0;
  planTick(v4, 0.1);
  const prog2 = v4.workProgress || 0;

  const noFalseInterrupt = !v4.interrupted && (!v4.guardLock || v4.guardLock === 0);
  const workProgressed = prog2 > prog1 && prog1 > 0;
  const verbStillWork = v4.plan && v4.plan[0] && v4.plan[0].verb === 'work';

  check(noFalseInterrupt, 'P4.1: healthy villager has zero interrupt/lock',
    `interrupted=${v4.interrupted} guardLock=${v4.guardLock}`);
  check(workProgressed, 'P4.2: workProgress advances under planTick',
    `prog1=${prog1.toFixed(3)} prog2=${prog2.toFixed(3)}`);
  check(verbStillWork, 'P4.3: plan verb remains work',
    `verb=${v4.plan && v4.plan[0] && v4.plan[0].verb}`);
  rmTestV13(v4);

  console.log('\n=== SUMMARY ===');
  const total = results.length;
  const passed = results.filter(Boolean).length;
  const failed = total - passed;
  console.log(`Probe complete: ${passed}/${total} assertions passed (${failed} failed).`);
  process.exit(failed ? 1 : 0);
} catch (e) {
  console.error('PROBE EXECUTION ERROR:', e);
  process.exit(1);
}
