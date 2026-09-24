'use strict';
// Time-perception harness — rw-time-perception-spec.md §7 acceptance.
// Boots the test bundle with ?sf (no ?test), then verifies:
//  1. default state carries NO exact clock string / no `time` field
//  2. ?glance=phone returns exact tod and updates lastClockCheck
//  3. ?glance=wallclock outside -> error; inside a clocked POI -> skewed
//  4. senses mentions rain / darkness / venue open state
//  5. felt anchor absent on a fresh pawn, present after a check
//  + Jules-in-the-rain: outdoor rest refused in rain, shelter routing
//    delivers a pawn indoors; standing directive promotes on order end.
// Usage: node devtools/time_perception_harness.js
const fs = require('fs');
const path = require('path');
const page = path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }

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
           addEventListener(){}, appendChild(){},
           classList: { add(){}, remove(){} },
           getContext: () => makeCtx(), width: 300, height: 150 };
}
let domReadyCb = null;
const autotestEl = makeEl('autotest');
global.window = {
  addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') domReadyCb = cb; },
  removeEventListener(){},
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
global.document = {
  getElementById(id) { if (id === 'autotest') return autotestEl;
    return elements[id] || (elements[id] = makeEl(id)); },
  createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
  title: '', addEventListener(){}, body: makeEl('body'),
};
global.location = { search: '?sf' };
global.requestAnimationFrame = () => 0;
global.fetch = () => Promise.reject(new Error('offline harness'));
try { global.navigator = { userAgent: 'node' }; } catch (e) {}

const api = eval(m[1] + `
;({ boot: (typeof boot!=='undefined') ? boot : null,
    sfAgentState, sfAgentAct, sfAgentNext, sfNpcTick, sfFindPOI,
    sfEnterPOI, sfExitPOI, sfPoiDoor,
    gsTimeSenses, gsTimeFelt, gsTimeGlance, gsTimeShelter, gsPoiOpenNow,
    VILLAGERS, W, SF_POIS, CS })`);

function fmtHHMM(t){
  const tot = Math.round((((t % 24) + 24) % 24) * 60) % (24 * 60);
  const h = Math.floor(tot / 60), mn = tot % 60;
  return (h < 10 ? '0' : '') + h + ':' + (mn < 10 ? '0' : '') + mn;
}

(async () => {
  if (!api.boot) { console.error('no boot'); process.exit(2); }
  try { await api.boot(); } catch (e) {
    console.error('BOOT FAILED:', e.stack ? e.stack.split('\n').slice(0,8).join('\n') : e);
    process.exit(2);
  }
  let pass = 0, fail = 0;
  const ok = (c, msg, extra) => {
    if (c) pass++;
    else { fail++; console.log('FAIL', msg, extra != null ? ('— ' + extra) : ''); }
  };
  const { W, VILLAGERS, CS } = api;
  const pawn = VILLAGERS.find(v => v._castId === 'C2') || VILLAGERS[0];
  const cid = pawn._castId || pawn.name;

  /* ---- pin a known afternoon ------------------------------ */
  const savedTod = W.tod, savedRain = W.rain, savedStorm = W.storm;
  const savedDay = W.day;
  W.tod = 15.8; W.rain = 0; W.storm = 0;

  /* ---- check 1: no exact clock in the default payload ------ */
  pawn.lastClockCheck = null;
  const st0 = api.sfAgentState(cid, { turn: 1 });
  const payload = JSON.stringify(st0);
  ok(!('"time"' in st0), 'state carries no `time` field');
  ok(!payload.includes(fmtHHMM(15.8)),
     'payload never contains the current HH:MM', fmtHHMM(15.8));
  ok(typeof st0.senses === 'string' && st0.senses.length > 0 &&
     typeof st0.felt === 'string',
     'senses + felt replace the pushed clock');

  /* ---- check 5a: felt anchor absent on a fresh pawn -------- */
  ok(/haven't checked/.test(st0.felt),
     'fresh pawn: felt says no check yet today', st0.felt);

  /* ---- check 2: phone glance = exact, updates the anchor --- */
  const st1 = api.sfAgentState(cid, { turn: 2, glance: 'phone' });
  ok(st1.glance && st1.glance.ok === true && st1.glance.said === fmtHHMM(15.8),
     'glance=phone returns exact sim time', JSON.stringify(st1.glance));
  ok(pawn.lastClockCheck && pawn.lastClockCheck.source === 'phone' &&
     Math.abs(pawn.lastClockCheck.said - 15.8) < 0.001 &&
     pawn.lastClockCheck.turn === 2,
     'the glance updated lastClockCheck {said, at, source, turn}');
  const st2 = api.sfAgentState(cid, { turn: 5 });
  ok(/last checked .*it said 15:48/.test(st2.felt),
     'felt anchors on the last check (coarse ago + quoted said)',
     st2.felt);

  /* ---- check 3: wallclock needs a clocked room, and can LIE  */
  const wasIn = pawn.inBuilding, wasInside = pawn.inside;
  pawn.inBuilding = false; pawn.inside = null;
  const stOut = api.sfAgentState(cid, { glance: 'wallclock' });
  ok(stOut.glance && stOut.glance.ok === false,
     'glance=wallclock outdoors errors honestly', JSON.stringify(stOut.glance));
  pawn.inBuilding = true; pawn.inside = 'Mudhaus Coffee';   // +10 fast clock
  const stClk = api.sfAgentState(cid, { glance: 'wallclock' });
  const expect = fmtHHMM(15.8 + 10 / 60);
  ok(stClk.glance && stClk.glance.ok === true &&
     stClk.glance.said === expect,
     'wallclock inside a clocked venue returns its OWN (skewed) time — ' +
     'Mudhaus runs +10', JSON.stringify(stClk.glance) + ' want ' + expect);
  /* spec mini-playtest made deterministic: the skew propagates into the
     pawn's anchor — they now BELIEVE a fast clock. That is the lateness
     mechanism the acceptance asks for. */
  ok(pawn.lastClockCheck.source === 'wallclock' &&
     pawn.lastClockCheck.said > 15.8,
     'the skewed read becomes the pawn\'s own anchor (blame-the-clock)');

  /* ---- check 4: senses read the world ----------------------- */
  pawn.inBuilding = wasIn; pawn.inside = wasInside;
  pawn.inBuilding = false;
  W.tod = 23.2; W.rain = 0;
  const sNight = api.gsTimeSenses(pawn);
  ok(/dark/.test(sNight), 'senses: darkness past ~21:30', sNight);
  W.tod = 15.0; W.rain = 0.5;
  const sRain = api.gsTimeSenses(pawn);
  ok(/rain|grey/.test(sRain), 'senses: rain visible in the light line',
     sRain);
  W.rain = 0;
  ok(api.gsPoiOpenNow('Haus Coffee', 12) === true &&
     api.gsPoiOpenNow('Haus Coffee', 23.5) === false &&
     api.gsPoiOpenNow('Mission Branch Library', 9) === false,
     'venue hours gate the open/dark senses line');
  const noon = api.gsTimeSenses(pawn);
  ok(!/\d{1,2}:\d{2}/.test(noon), 'senses itself never states a clock',
     noon);

  /* ---- the Jules fix: rain refuses, shelter routes ---------- */
  W.tod = 15.8; W.rain = 0.5; W.storm = 0;
  const rRain = api.sfAgentAct(cid, { verb: 'rest' });
  ok(rRain.ok === false && /rain/.test(rRain.err) && !!rRain.suggest,
     'rest outdoors in rain is refused with a suggestion', rRain.err);
  W.rain = 0;
  const rShel = api.sfAgentAct(cid, { verb: 'rest' });
  ok(rShel.ok === true && rShel.sheltering === 'home' &&
     pawn.sfAgent && pawn.sfAgent.shelter,
     'rest outdoors routes to shelter first (Jules goes home)',
     JSON.stringify(rShel));
  /* walk her to the door and verify she actually goes inside */
  if (pawn.sfAgent && pawn.sfAgent.shelter){
    const c = pawn.sfAgent.shelter.cell;
    pawn.x = c.wx * CS + 16; pawn.y = c.wy * CS + 16;   // at the door
    pawn.sfPath = null;
    for (let i = 0; i < 90 && !pawn.inBuilding; i++)
      api.sfNpcTick(pawn, 0.016);
    ok(pawn.inBuilding === true && pawn.state === 'rest',
       'the shelter phase delivers her inside and resting',
       pawn.state + ' inBuilding=' + pawn.inBuilding);
  }
  pawn.inBuilding = false; pawn.inside = null; pawn.sfAgent = null;
  pawn.sfAgentDriven = false; pawn.sfDirective = null;
  pawn.sfGap = false; pawn.sfAgentResult = null; pawn.sfReflex = null;

  /* ---- standing directive: the durable will fills the gap ----- */
  const rDir = api.sfAgentAct(cid, { verb: 'idle', holdH: 0.25 },
    { directive: { verb: 'work', untilH: 4, why: 'shift at the café' } });
  ok(rDir.ok === true && pawn.sfDirective &&
     pawn.sfDirective.verb === 'work' && pawn.sfAgentDriven === true,
     'a filed act stores the standing directive as a durable will');
  W.tod += 0.5;                       // past the order's until
  api.sfNpcTick(pawn, 0.016);
  ok(pawn.sfAgent && pawn.sfAgent.verb === 'work' &&
     pawn.sfAgent.fromDirective === true,
     'order expiry promotes the directive same-tick (no idle gap)',
     pawn.sfAgent && pawn.sfAgent.verb);
  ok(pawn.sfAgentResult && pawn.sfAgentResult.verb === 'idle' &&
     pawn.sfAgentResult.status === 'expired',
     'the ended order reports its outcome for the next turn',
     JSON.stringify(pawn.sfAgentResult));
  const stDir = api.sfAgentState(cid, {});
  ok(stDir.directive && stDir.directive.verb === 'work' &&
     stDir.order && stDir.order.verb === 'work' && stDir.gap === false,
     'state surfaces order + will + gap for the brain');

  /* the will lapsing leaves a visible intention_gap — the pawn does
     NOT quietly resume its code-authored schedule */
  pawn.sfAgent = null; pawn.sfDirective = null;
  api.sfNpcTick(pawn, 0.016);
  api.sfNpcTick(pawn, 0.016);
  ok(pawn.sfGap === true && pawn.state === 'idle' &&
     pawn.sfAgent === null,
     'a lapsed will leaves the intention gap — no invented behavior');
  ok(api.sfAgentState(cid, {}).gap === true,
     'the gap is visible on the state payload');

  /* stale-seq filings are rejected, not applied */
  const sA = api.sfAgentAct(cid, { verb: 'idle', holdH: 0.25 },
                            { seq: 30 });
  const sB = api.sfAgentAct(cid, { verb: 'work', holdH: 0.25 },
                            { seq: 29 });
  ok(sA.ok === true && sB.ok === false && /stale/.test(sB.err || ''),
     'a late stale-seq act is rejected — newer filings stand');

  const badDir = api.sfAgentAct(cid, { verb: 'idle' },
    { directive: { verb: 'fly' } });
  ok(badDir && badDir.thenDropped,
     'a nonsense directive is dropped with a reason at filing');
  pawn.sfAgent = null; pawn.sfAgentDriven = false;
  pawn.sfDirective = null; pawn.sfGap = false;
  pawn.sfAgentResult = null; pawn.sfReflex = null;
  pawn._agentSeq = null; pawn._dirStreak = 0; pawn._dirSig = null;

  /* ---- restore world pins ---------------------------------- */
  W.tod = savedTod; W.rain = savedRain; W.storm = savedStorm;
  W.day = savedDay;
  pawn.lastClockCheck = null;

  console.log(pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
