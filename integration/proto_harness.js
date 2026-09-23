'use strict';
/* =====================================================================
   integration-1: PROTOTYPE HARNESS — the closed minimal loop, headless.

   Boots the real bundled game (willowbrook_natura_test.html) in ?sf mode
   under Node DOM stubs — same technique as devtools/sf_harness.js — then
   drives the actual production path:

     watch free      — boot, renderWorld() into a counting ctx, simTick()
     cheap request   — hire (review lane) -> possess a HIRED character
     public resolution — the Wire (gsWireTail / gsViewerState().feed)
                       + the two-currency ledger (GS_LEDGER.txns)

   Every request is filed at real wall-clock minutes (the same clock
   gsSysTick uses inside simTick), while gsBusTick(nowMin) jumps the bus
   forward deterministically — no waiting, no faked minutes.

   Usage: node integration/proto_harness.js
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const page = process.env.GS_TEST_HTML ||
  path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }

/* ---- DOM stubs (sf_harness.js pattern) + a ctx that counts draw ops ---- */
let drawOps = 0;
function makeCtx() {
  const grad = { addColorStop(){} };
  return new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return { width: 64, height: 64 };
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
      if (k === 'getImageData') return (x,y,w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
      if (k === 'createImageData') return (w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
      if (k === 'measureText') return () => ({ width: 10 });
      if (t[k] !== undefined) return t[k];
      return (...a) => { drawOps++; };      // every other ctx call counts
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
  const el = { id, style: {}, textContent: '', innerHTML: '', title: '',
    children: [],
    addEventListener(){}, appendChild(c){ this.children.push(c); },
    classList: { add(){}, remove(){}, toggle(){} },
    setAttribute(){}, getContext: () => makeCtx(), width: 300, height: 150,
    querySelector(){ return null; }, querySelectorAll(){ return []; } };
  return el;
}
let domReadyCb = null;
const autotestEl = makeEl('autotest');
global.window = {
  addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') domReadyCb = cb; },
  removeEventListener(){},
  __aiBridge: undefined,
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
  location: null,   // set below
};
global.document = {
  getElementById(id) { if (id === 'autotest') return autotestEl;
    return elements[id] || (elements[id] = makeEl(id)); },
  createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
  createTextNode(t) { return { textContent: t }; },
  title: '', addEventListener(){}, body: makeEl('body'),
  querySelector(){ return null; }, querySelectorAll(){ return []; },
};
global.location = { search: '?sf', href: 'file:///proto?sf', hash: '' };
global.window.location = global.location;
let rafCb = null;
global.requestAnimationFrame = (cb) => { rafCb = cb; return 0; };
global.fetch = () => Promise.reject(new Error('offline harness'));
try { global.navigator = { userAgent: 'node' }; } catch (e) {}

/* ---- load the real bundle ---- */
let api;
try {
  api = eval(m[1] + `
;({ boot, VILLAGERS, W, G, cam, NV_CAST: (typeof NV_CAST!=='undefined'?NV_CAST:null),
    PA, SF_MODE, SF_MAP, SF_REG: (typeof SF_REG!=='undefined'?SF_REG:null),
    simTick, renderWorld, updateHUD, loop, soulTick,
    GS_REG, GS_LEDGER, GS_FEED, GS_WIRE: (typeof GS_WIRE!=='undefined'?GS_WIRE:null),
    GS_HIRED, GS_POSSESS, GS_REQ, GS_LISTINGS, GS_EVENTS, GS_WX_OVR,
    gsSubmitRequest, gsCancelRequest, gsBusTick, gsViewerState, gsRequestMeter,
    gsExplainRequest, gsReviewResolve, gsReviewQueue, gsQueuePosition,
    gsPossessionBriefing, gsConflictRules, gsCoSessions,
    gsCreditGrant, gsCreditSpend, gsCreditRefund, gsCreditBalance,
    gsDollarBalance, gsDollarGrant, gsLedgerSnapshot, gsLedgerTotal,
    gsMarkHired, gsHiredOwner, gsIsPossessable, gsPossessDeny, gsCharName,
    gsUnitById, gsBldById, gsUnitsOf, gsUnitVacant, gsUnitLivable,
    gsActiveLease, gsLeasesFor, gsHomeOf, gsAddressOfUnit, gsCastHousing,
    gsWireTail, gsWireClock, gsBrainMode, gsBrainModes, gsPresenceOf,
    gsPriceQuote: (typeof gsPriceQuote!=='undefined'?gsPriceQuote:null),
    gsResourceBoard: (typeof gsResourceBoard!=='undefined'?gsResourceBoard:null),
    gsHireJobs: (typeof GS_JOBS!=='undefined'?GS_JOBS:null),
    sfFindPOI, sfGoTo, sfNpcTick, sfPoiDoor, sfPathfind, sfEnterPOI,
    sfExitPOI, sfFollowPath, CS })`);
} catch (e) {
  console.error('PAGE LOAD FAILED:', e.message);
  console.error(e.stack.split('\n').slice(0, 8).join('\n'));
  process.exit(2);
}

/* ---- evidence helpers ---- */
const EV = [];
function ev(tag, obj) {
  const line = `[EV] ${tag} ${JSON.stringify(obj)}`;
  EV.push(line); console.log(line);
}
let passN = 0, failN = 0;
function check(ok, name, detail) {
  if (ok) passN++; else failN++;
  console.log((ok ? 'PASS: ' : 'FAIL: ') + name + (detail ? ' — ' + detail : ''));
}
const nowMin = () => Date.now() / 60000;

(async () => {
  if (!api.boot) { console.error('no boot'); process.exit(2); }
  try { await api.boot(); } catch (e) {
    console.error('BOOT FAILED:', e.stack ? e.stack.split('\n').slice(0, 10).join('\n') : e);
    process.exit(2);
  }

  /* ============ STEP A — WATCH FREE ============ */
  console.log('\n===== A. WATCH FREE — the world renders and ticks =====');
  check(api.SF_MODE === true, 'SF_MODE on', 'Mission scenario active');
  check(api.VILLAGERS.length >= 28, 'cast on stage',
    api.VILLAGERS.length + ' villagers (8 mains + 20 ambients)');
  const mains = (api.NV_CAST || []).filter(c => c.tier === 'core');
  check(mains.length === 8, '8 mains present',
    mains.map(c => c.id + ':' + (c.name || '')).join(', '));
  check(api.GS_REG.buildings.length > 200, 'SF registry seeded',
    api.GS_REG.buildings.length + ' buildings, ' + api.GS_REG.units.length + ' units');
  const housed = api.gsCastHousing();
  check(housed.housed === housed.total, 'all cast housed', housed.housed + '/' + housed.total);

  drawOps = 0;
  api.renderWorld();                                   // the real paint call
  check(drawOps > 1000, 'renderWorld paints the scene', drawOps + ' ctx ops');

  const tod0 = api.W.tod;
  for (let i = 0; i < 240; i++) api.simTick(0.02);     // ~4.8 game-hours of steps
  check(api.W.tod !== tod0 || api.W.day !== undefined, 'world clock advances',
    'tod ' + tod0.toFixed(2) + ' -> ' + api.W.tod.toFixed(2) + ' day ' + api.W.day);

  /* schedule adherence: at tod~13 Marisol's block says 'serve at Haus
     Coffee' — the thin-AI follower should have her at the door/inside.
     (C2 Jules is the audience surrogate — isNPC=false by design, she is
     the player's own pawn and does not run a schedule.) */
  const mars = api.VILLAGERS.find(v => v._castId === 'C1');
  const haus = api.sfFindPOI('Haus Coffee');
  const hDoor = haus && api.sfPoiDoor(haus);
  const mDist = hDoor && Math.hypot(mars.x - (hDoor.wx * api.CS + 16),
                                    mars.y - (hDoor.wy * api.CS + 16)) / api.CS;
  check(mars.inside === 'Haus Coffee' || mDist < 12,
    'schedule adherence: Marisol works her Haus Coffee shift',
    'state=' + mars.state + ' inside=' + (mars.inside || mars.inBuilding) +
    ' distToDoor=' + (mDist != null ? mDist.toFixed(1) + ' cells' : '?'));

  /* and a real walk on the production path: Haus Coffee -> El Farolote */
  const faro = api.sfFindPOI('Taqueria El Farolito');
  const fDoor = api.sfPoiDoor(faro);
  mars.x = hDoor.wx * api.CS + 16; mars.y = hDoor.wy * api.CS + 16;
  mars.sfPath = null; mars.inside = null; mars.inBuilding = false;
  api.sfGoTo(mars, fDoor.wx, fDoor.wy);
  let steps = 0;
  while (mars.sfPath && mars.sfPath.length && steps++ < 20000)
    api.sfFollowPath(mars, 0.016);
  const walked = Math.hypot(mars.x - (fDoor.wx * api.CS + 16),
                            mars.y - (fDoor.wy * api.CS + 16)) / api.CS;
  check(walked < 3, 'a pawn can really walk the Mission (Haus -> El Farolote)',
    'ended ' + walked.toFixed(1) + ' cells from the door');

  /* ============ STEP B — THE CHEAP REQUEST (hire, then possess) ============ */
  console.log('\n===== B. REQUEST — hire, then possess the hired character =====');
  const T0 = nowMin();
  api.gsCreditGrant('proto1', 2000, 'prototype stake');
  api.gsCreditGrant('proto2', 2000, 'prototype stake');
  ev('credits', { proto1: api.gsCreditBalance('proto1') });

  /* pick a livable, vacant, on-map unit for the hire to move into */
  let unit = null;
  for (const u of api.GS_REG.units) {
    if (!api.gsUnitVacant(u)) continue;
    const b = api.gsBldById(u.bld_id);
    if (!b || b.offmap || b.status !== 'standing') continue;
    unit = u; break;
  }
  check(!!unit, 'a vacant on-map unit exists for the hire',
    unit ? api.gsAddressOfUnit(unit.id) + ' @ $' + unit.base_rent : 'none');

  /* the hire files like a player files it — a named application parks in
     human review (billOnApproval: nothing is charged until approval) */
  const hire = api.gsSubmitRequest({
    playerId: 'proto1', kind: 'hire', target: unit.id, durationMin: 5,
    params: {
      name: 'Dana Okafor', age: 29, job: 'seeking',
      pronouns: 'she/her',
      bio: 'new to the Mission; early riser, knows her way around a produce order',
      arrival: 'here for the farmers market and a quieter block',
      look: { build: 'compact', palette: 'ochre',
              signature: 'denim jacket, pins on the collar' },
    },
    note: 'a neighbor for the block',
  }, T0);
  ev('hire.filed', { id: hire.id, status: hire.status, billed: hire.billed,
                     deferred: hire.deferred, price: hire.price });
  check(hire.status === 'in_review' && hire.billed === 0,
    'named hire parks in human review unbilled', 'status=' + hire.status);
  check(api.gsCreditBalance('proto1') === 2000, 'no charge before approval');

  const res = api.gsReviewResolve(hire.id, true, { by: 'reviewer-1', nowMin: T0 + 0.1 });
  ev('hire.resolved', { status: res.status, charId: res.charId, billed: res.billed });
  check(res.status === 'completed' || res.status === 'active',
    'hire approved -> activates on the spot (once-effect)', 'status=' + res.status);
  const cid = res.charId;
  check(!!cid && !!api.GS_HIRED[cid], 'hired character exists', cid);
  check(api.gsCreditBalance('proto1') === 1500, 'flat 500cr billed at approval',
    'balance=' + api.gsCreditBalance('proto1'));
  const hv = api.VILLAGERS.find(v => v._castId === cid);
  check(!!hv && hv.gsHired === true, 'hired pawn walks onto the stage',
    hv ? hv.name + ' @ ' + Math.round(hv.x) + ',' + Math.round(hv.y) : 'missing');
  const lease = api.gsLeasesFor(cid).find(l => l.status === 'active');
  check(!!lease, 'hire signed a real lease', lease ? api.gsAddressOfUnit(lease.unit_id) : 'none');
  check(api.gsDollarBalance(cid) > 0, 'arrival bank landed in dollars',
    '$' + api.gsDollarBalance(cid));

  /* the cheap request: 5-minute possess of OUR hired character */
  const pos = api.gsSubmitRequest({ playerId: 'proto1', kind: 'possess',
    target: cid, durationMin: 5,
    params: { note: 'walking Dana to the park for her first morning' } }, T0 + 0.2);
  ev('possess.filed', { id: pos.id, status: pos.status, billed: pos.billed });
  check(pos.status === 'active' && pos.billed === 20,
    'possess activates at 4cr/min x 5min', 'status=' + pos.status + ' billed=' + pos.billed);
  check(!!api.GS_POSSESS[cid], 'session live in GS_POSSESS');
  check(hv.isNPC === false && hv.gsPossessed === pos.id,
    'the brain is suspended — player at the wheel');
  check(api.gsBrainMode(cid, T0 + 0.3) === 'possessed', 'brain mode reads possessed');
  const brief = api.gsPossessionBriefing(cid);
  ev('briefing', brief && { name: brief.name, home: brief.home });

  /* possession ban stays enforced on the 8 mains — even for the owner */
  const banC3 = api.gsSubmitRequest({ playerId: 'proto2', kind: 'possess',
    target: 'C3', durationMin: 10 }, T0 + 0.3);
  const banOwner = api.gsSubmitRequest({ playerId: 'owner', kind: 'possess',
    target: 'C7', durationMin: 10 }, T0 + 0.3);
  check(banC3.status === 'denied' && banC3.reason === 'possession_ban' &&
        banOwner.status === 'denied',
    'possession ban on mains holds (player + owner)', banC3.reason);

  /* ============ STEP C — PUBLIC RESOLUTION ============ */
  console.log('\n===== C. RESOLVE — the bus ticks, the feed + ledger tell it =====');
  api.gsBusTick(T0 + 0.6);              // inside the window: still running
  check(api.gsRequestMeter(pos.id, T0 + 0.6).status === 'active',
    'mid-session meter', JSON.stringify(api.gsRequestMeter(pos.id, T0 + 0.6)));
  api.gsBusTick(T0 + 6);                // past endMin -> graceful completion
  check(pos.status === 'completed', 'possess session wraps at the cap');
  check(!api.GS_POSSESS[cid] && hv.isNPC === true,
    'handoff: the pawn is back on its own AI');

  const vs = api.gsViewerState(T0 + 6.1);
  const feed = vs.feed || [];
  const posLines = feed.filter(e => e.req === pos.id);
  const hireLines = feed.filter(e => e.req === hire.id ||
    (e.mentions && e.mentions.indexOf(cid) >= 0));
  console.log('--- wire lines for the possess request ---');
  posLines.forEach(e => console.log('  ', e.id, '|', e.kind, '|', e.status || '-', '|', e.text));
  console.log('--- wire lines for the hire ---');
  hireLines.forEach(e => console.log('  ', e.id, '|', e.kind, '|', e.status || '-', '|', e.text));
  check(posLines.some(e => e.status === 'running') &&
        posLines.some(e => e.status === 'resolved' || e.status === 'player session ended'),
    'public feed shows the full possess lifecycle',
    posLines.map(e => e.status || e.kind).join(' -> '));
  check(hireLines.some(e => e.kind === 'cast'),
    'hire announced on the public feed as a cast beat');
  const denyLine = feed.find(e => e.status === 'not approved');
  check(!!denyLine && denyLine.text === 'request not approved',
    'denied possess on a main renders verbatim contract wording',
    denyLine ? denyLine.reason_code : 'none');

  /* the ledger: every credit moved is a row */
  const txns = api.GS_LEDGER.txns;
  console.log('--- ledger tail ---');
  txns.slice(-8).forEach(t =>
    console.log('  ', '#' + t.n, t.cur, t.from, '->', t.to, t.amt, '|', t.reason));
  check(txns.some(t => t.cur === 'credits' && t.to === 'proto1' && t.amt === 2000) &&
        txns.some(t => t.cur === 'credits' && t.from === 'proto1' && t.amt === 500) &&
        txns.some(t => t.cur === 'credits' && t.from === 'proto1' && t.amt === 20),
    'ledger: grant + 500cr hire + 20cr possess are all posted');
  check(api.gsCreditBalance('proto1') === 1480,
    'credits conserved: 2000 - 500 - 20 = 1480', 'bal=' + api.gsCreditBalance('proto1'));
  const balSum = Object.keys(api.GS_LEDGER.credits)
    .reduce((s, k) => s + api.GS_LEDGER.credits[k], 0);
  const minted = txns.filter(t => t.from === 'mint' && t.cur === 'credits')
    .reduce((s, t) => s + t.amt, 0);
  const burned = txns.filter(t => t.to === 'burn' && t.cur === 'credits')
    .reduce((s, t) => s + t.amt, 0);
  check(balSum === minted - burned, 'credit conservation holds',
    minted + ' minted - ' + burned + ' burned = ' + balSum);

  /* a queued request for contrast: proto2 files possess on OUR hire ->
     denied (not_your_character) — ownership is the gate */
  const notYours = api.gsSubmitRequest({ playerId: 'proto2', kind: 'possess',
    target: cid, durationMin: 10 }, T0 + 7);
  check(notYours.status === 'denied' && notYours.reason === 'not_your_character',
    'another player cannot drive your hire', notYours.reason);

  /* ============ summary ============ */
  console.log('\n===== SUMMARY =====');
  console.log('viewer board keys:', Object.keys(vs.board || {}).length,
    '| active:', vs.active.length, '| queues:', Object.keys(vs.queues).length);
  console.log(`==== PROTO LOOP: ${passN} passed, ${failN} failed ====`);
  process.exit(failN ? 1 : 0);
})().catch(e => {
  console.error('HARNESS ERROR:', e.stack || e);
  process.exit(2);
});
