'use strict';
/* production-3 direction-acceptance checks — runs against
   willowbrook_natura_test.html with the prod_checks DOM stub.
   Asserts the Astra direction, not vibes:
     1. real-estate admin absent (no assessor/parcel/tax-roll machinery)
     2. minimal housing constraint present and exercised
     3. catalytic actions: instant delivery AND honest refusal paths
     4. intervention log written and readable
     5. refund path on a denied review
     6. closed minimal loop: watch -> catalytic buy -> ledger conserved
   Usage: node devtools/prod3_checks.js */
const fs = require('fs');
const path = require('path');
const page = path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if(!m){ console.error('NO SCRIPT BLOCK'); process.exit(2); }
const SRC = m[1];

function makeCtx(){
  const grad = { addColorStop(){} };
  return new Proxy({}, {
    get(t, k){
      if(k === 'canvas') return { width:64, height:64 };
      if(k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
      if(k === 'getImageData') return (x,y,w,h) => ({ data:new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1 });
      if(k === 'createImageData') return (w,h) => ({ data:new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1 });
      if(k === 'measureText') return () => ({ width:10 });
      return t[k] !== undefined ? t[k] : (() => {});
    },
    set(t, k, v){ t[k]=v; return true; }
  });
}
function makeCanvas(){
  return { width:300, height:150, style:{}, getContext:() => makeCtx(),
           addEventListener(){}, getBoundingClientRect:() => ({left:0,top:0}) };
}
const elements = {};
function makeEl(id){
  return { id, style:{}, textContent:'', innerHTML:'', title:'',
           addEventListener(){}, appendChild(){}, classList:{ add(){}, remove(){} },
           getContext:() => makeCtx(), width:300, height:150 };
}
global.window = {
  addEventListener(){}, removeEventListener(){},
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
global.document = {
  getElementById(id){ return elements[id] || (elements[id] = makeEl(id)); },
  createElement(tag){ return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
  title: '', addEventListener(){}, body: makeEl('body'),
};
global.location = { search: '?sf&test=1' };
global.requestAnimationFrame = () => 0;
global.fetch = () => Promise.reject(new Error('offline harness'));
try { global.navigator = { userAgent: 'node' }; } catch(e){}

const api = eval(SRC + `
;({ boot: (typeof boot!=='undefined') ? boot : null,
    VILLAGERS, GS_POSSESS, GS_HIRED, GS_LEDGER, GS_REQ, CS,
    gsSubmitRequest, gsCreditBalance, gsCreditGrant, gsMarkHired,
    gsSpawnHired, gsHiredRoutine, gsDollarGrant, gsDollarBalance,
    gsLedgerTotal, gsWireTail, gsPossessLog, gsPossessDebrief,
    gsCancelRequest, gsReviewQueue, gsReviewResolve, gsRequestById,
    gsVacantUnits, gsApplyForLease, gsLeaseBook, gsVillagerForChar,
    /* the banned county recorder — must be absent */
    gsAssessorTick: (typeof gsAssessorTick !== 'undefined') ? gsAssessorTick : null,
    gsParcelOf: (typeof gsParcelOf !== 'undefined') ? gsParcelOf : null,
    GS_PARC: (typeof GS_PARC !== 'undefined') ? GS_PARC : null,
    gsPayTaxBill: (typeof gsPayTaxBill !== 'undefined') ? gsPayTaxBill : null,
    gsAssessorSnapshot: (typeof gsAssessorSnapshot !== 'undefined') ? gsAssessorSnapshot : null,
    gsTaxRoll: (typeof gsTaxRoll !== 'undefined') ? gsTaxRoll : null,
    /* catalytic verbs */
    gsPossessEnter: (typeof gsPossessEnter !== 'undefined') ? gsPossessEnter : null,
    gsPossessExit: (typeof gsPossessExit !== 'undefined') ? gsPossessExit : null,
    gsPossessBuy: (typeof gsPossessBuy !== 'undefined') ? gsPossessBuy : null,
    gsPossessGreet: (typeof gsPossessGreet !== 'undefined') ? gsPossessGreet : null,
    gsPossessRest: (typeof gsPossessRest !== 'undefined') ? gsPossessRest : null,
    gsPossessMenu: (typeof gsPossessMenu !== 'undefined') ? gsPossessMenu : null,
    GS_BOARDS: (typeof GS_BOARDS !== 'undefined') ? GS_BOARDS : null })`);

(async () => {
  let pass = 0, fail = 0;
  const ok = (c, msg) => { if(c) pass++; else { fail++; console.log('FAIL', msg); } };
  try { await api.boot(); } catch(e){
    console.error('BOOT FAILED:', e.stack ? e.stack.split('\n').slice(0,8).join('\n') : e);
    process.exit(2);
  }

  /* ---------- 1. real-estate administration: GONE ---------- */
  ok(api.gsAssessorTick === null, 'county assessor tick absent (real-estate admin cut)');
  ok(api.gsParcelOf === null && api.GS_PARC === null, 'parcel roll absent');
  ok(api.gsPayTaxBill === null && api.gsTaxRoll === null && api.gsAssessorSnapshot === null,
     'tax bill/roll/snapshot absent');
  const SRC_HAS_41R = /gsAssessorTick\s*=|const GS_PARC\s*=|function gsPayTaxBill/.test(SRC);
  ok(!SRC_HAS_41R, 'no assessor module code in the production bundle');

  /* ---------- 2. minimal housing constraint: present + exercised ---------- */
  ok(typeof api.gsVacantUnits === 'function' && typeof api.gsApplyForLease === 'function' &&
     typeof api.gsLeaseBook === 'function', 'housing APIs present (lease/apply/book)');
  const vac = api.gsVacantUnits ? api.gsVacantUnits({}) : [];
  ok(Array.isArray(vac) && vac.length > 0, 'vacant units on the map (' + vac.length + ')');

  /* ---------- 3. catalytic actions: refusal first, then delivery ---------- */
  ok(api.gsPossessRest && api.gsPossessEnter && api.gsPossessBuy &&
     api.gsPossessGreet && api.gsPossessMenu && api.gsPossessExit,
     'catalytic verb set present');
  const cold = api.gsPossessRest('HX', 'pA');
  ok(cold && cold.ok === false && cold.err === 'not_possessed',
     'catalytic action refused honestly without a session: ' + (cold && cold.err));

  /* hire + spawn a pawn, then possess it (real bus, real billing) */
  api.gsCreditGrant('pA', 10000, 'stake');
  const stake = api.gsCreditBalance('pA');
  api.gsMarkHired('HX', 'pA');
  const hx = { _castId: 'HX', gsHired: true, isNPC: true,
               name: 'Kit Driver', role: 'messenger', x: 320, y: 640,
               body: { satiety: 0.4, hydration: 0.5, fatigue: 0.6 } };
  api.VILLAGERS.push(hx);
  const poss = api.gsSubmitRequest({ playerId: 'pA', kind: 'possess',
    target: 'HX', durationMin: 30 }, 0);
  ok(poss.status === 'active' && api.GS_POSSESS.HX,
     'possession activates — hook live (status ' + poss.status + ')');
  ok(api.gsCreditBalance('pA') < stake,
     'possession billed credits up front (' + (stake - api.gsCreditBalance('pA')) + 'cr)');

  const rest = api.gsPossessRest('HX', 'pA');
  ok(rest && rest.ok === true,
     'catalytic rest delivered instantly: ' + JSON.stringify(rest));
  const far = api.gsPossessEnter('HX', 'pA', 'Il Delfino');
  ok(far && far.ok === false && far.err,
     'catalytic enter refused honestly (too_far/unknown): ' + (far && far.err));
  const notYours = api.gsPossessRest('HX', 'pB');
  ok(notYours && notYours.ok === false && notYours.err === 'not_driver',
     'non-driver refused: ' + (notYours && notYours.err));

  /* ---------- 4. intervention log: written + readable ---------- */
  const sess = api.GS_POSSESS.HX;
  ok(sess.acts && sess.acts.length >= 2 &&
     sess.acts.some(a => a.k === 'rest'),
     'intervention trail recorded the delivered beats (sess.acts)');

  /* ---------- 5. refund path: denied review returns the bill ---------- */
  api.gsCreditGrant('pR', 10000, 'stake');
  const rStake = api.gsCreditBalance('pR');
  const rev = api.gsSubmitRequest({ playerId: 'pR', kind: 'street_event',
    durationMin: 30, params: { event: 'block_party', at: 'dolores park' } }, 0);
  ok(rev.status === 'in_review' || rev.status === 'queued' || rev.status === 'active',
     'review-kind request filed (status ' + rev.status + ')');
  if(rev.status === 'in_review'){
    api.gsReviewResolve(rev.id, false, { by: 'local-desk', code: 'gray-zone' });
    ok(api.gsCreditBalance('pR') === rStake,
       'denied review refunded the bill (balance restored)');
  } else {
    /* kind didn't park this build — cancel exercises the same refund lane */
    api.gsCancelRequest(rev.id);
    ok(api.gsCreditBalance('pR') === rStake,
       'cancelled request refunded the bill (balance restored)');
  }

  /* ---------- 6. closed minimal loop: watch -> catalytic buy -> conserved ---------- */
  const wire = api.gsWireTail ? api.gsWireTail(5) : [];
  ok(Array.isArray(wire), 'watch surface readable (' + wire.length + ' wire entries)');
  /* drop the pawn next to an openAir board, fund it, buy off the board */
  let venueName = null, ven = null;
  if(api.GS_BOARDS){
    for(const n in api.GS_BOARDS)
      if(api.GS_BOARDS[n].openAir){ venueName = n; break; }
  }
  ok(venueName != null, 'an openAir board exists (' + venueName + ')');
  let bought = null;
  if(venueName){
    /* the menu gates on distance <= 4 cells of the board venue; park the
       pawn on top of it via the scene/menu call's own distance rule */
    const SF_POIS = (typeof global.__pois === 'undefined') ? null : global.__pois;
    /* venue coords come from gsPossessMenu's own lookup — emulate by
       probing every board venue until one accepts the pawn nearby */
    api.gsDollarGrant('HX', 200, 'lunch money');
    const dolBefore = api.gsDollarBalance('HX');
    /* find the venue's door coords through a scene/menu scan: gsErrandVenue
       is module-local, so walk every board entry, place the pawn on each
       openAir venue's door via the POI table if available */
    let menu = api.gsPossessMenu('HX', 'pA');
    if(!menu || !menu.ok){
      /* try each openAir board by teleporting near its poi if listed */
      const poi = (typeof SF_POIS_SRC !== 'undefined') ? SF_POIS_SRC : null;
      /* fallback: move pawn to inside the venue directly */
      hx.inside = venueName;
      menu = api.gsPossessMenu('HX', 'pA');
    }
    ok(menu && menu.ok === true,
       'menu delivered (' + (menu && menu.venue) + '): ' + (menu && menu.err));
    if(menu && menu.ok){
      const item = menu.items.find(i => i.cost > 0);
      bought = api.gsPossessBuy('HX', 'pA', item.id || item.label);
      ok(bought && bought.ok === true,
         'catalytic buy delivered instantly: ' + JSON.stringify(bought).slice(0, 120));
      ok(api.gsDollarBalance('HX') === dolBefore - item.cost,
         'dollars moved: pawn -$' + item.cost + ' (consequence)');
      /* conservation across the whole dollar book */
      const minted = api.GS_LEDGER.txns.filter(t => t.cur === 'dollars' && t.from === 'mint')
        .reduce((s, t) => s + t.amt, 0);
      const burned = api.GS_LEDGER.txns.filter(t => t.cur === 'dollars' && t.to === 'burn')
        .reduce((s, t) => s + t.amt, 0);
      ok(minted - burned === api.gsLedgerTotal('dollars'),
         'dollar book conserved: ' + minted + ' - ' + burned +
         ' = ' + api.gsLedgerTotal('dollars'));
      const acts2 = api.GS_POSSESS.HX.acts || [];
      ok(acts2.some(a => a.k === 'buy'),
         'the buy landed in the intervention trail');
    }
  }

  /* ending the session writes the readable driving record (debrief) */
  api.gsCancelRequest(poss.id);
  const logEnd = api.gsPossessLog('HX');
  ok(Array.isArray(logEnd) && logEnd.length > 0 &&
     logEnd[0].char === 'HX' && logEnd[0].endReason != null,
     'intervention log written at handoff — readable debrief (' +
     (logEnd[0] && logEnd[0].endReason) + ')');

  console.log('==== PROD3 CHECKS: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('THREW:', e.stack || e); process.exit(2); });
