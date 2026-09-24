'use strict';
// v12 onboarding probe — boots the test bundle in SF mode and drives the
// viewer→player path end to end through the REAL bus.
const fs = require('fs');
const path = require('path');
const page = process.env.GS_TEST_HTML ||
  path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
const pageJS = m[1];

const PROBE = `
;globalThis.__probe = function(){
  const out = [];
  const p = (...a) => out.push(a.join(' '));
  const J = (x) => JSON.stringify(x);
  const NOW = 100000;
  try{
    // fresh player — free observe
    p('state fresh:', J(gsOnbState('nb', NOW)));
    p('players after state call:', Object.keys(GS_ONB.players).length);

    p('start:', J(gsOnbStart('nb', NOW)));
    p('fork bad:', J(gsOnbFork('nb', 'bogus', NOW)));
    p('fork play:', J(gsOnbFork('nb', 'play', NOW)));

    // tour
    p('tour start:', J(gsOnbTourStart('nb', NOW)));
    for(let i = 0; i < 8; i++) p('beat', i, J(gsOnbTourBeat('nb', NOW)));
    p('card after tour:', J(gsOnbCard('nb', NOW)));

    // handle
    p('handle Victor:', J(gsHandleCheck('Victor')));
    p('handle "x":', J(gsHandleCheck('x')));
    p('handle good:', J(gsSetHandle('nb', 'watchful_neighbor', NOW)));
    p('handle of:', J(gsHandleOf('nb')));
    p('handle dup other pid:', J(gsSetHandle('nb2', 'watchful_neighbor', NOW)));

    // wallet
    const w = gsWallet('nb', NOW);
    p('wallet packs:', J(w.packs), 'bonusLeft:', w.bonusLeft, 'credits:', w.credits);
    p('buy bogus:', J(gsBuyPack('nb', 'yacht', NOW)));
    p('buy starter:', J(gsBuyPack('nb', 'starter', NOW)));
    p('buy mogul (cap?):', J(gsBuyPack('nb', 'mogul', NOW)));
    p('credits now:', gsCreditBalance('nb'));
    p('wallet ledger tail:', J(gsWalletLedger('nb').slice(-3)));

    // first ask — camera
    p('card S4:', J(gsOnbCard('nb', NOW)));
    p('first ask:', J(gsOnbFirstAsk('nb', NOW)));
    const camReq = GS_REQ.reqs[GS_REQ.reqs.length-1];
    p('cam req status:', camReq.status, 'billed:', camReq.billed, 'claims:', J(gsClaimsOf(camReq)));
    p('camera sessions:', J(gsCameraSessions(NOW+5)));
    p('balance after cam:', gsCreditBalance('nb'));

    // low-balance lesson on the live camera session
    p('lowbal on cam:', J(gsOnbLowBal('nb', camReq.id, NOW+10)));
    p('lowbal on dead req:', J(gsOnbLowBal('nb', 'req-9999', NOW)));

    // review lesson — weather parks in_review
    p('review lesson:', J(gsOnbLesson('nb', 'review', NOW+10)));
    const revReq = GS_REQ.reqs[GS_REQ.reqs.length-1];
    p('rev req:', revReq.kind, revReq.status, 'billed:', revReq.billed);
    p('review queue:', J(gsReviewQueue().map(r=>r.id)));
    p('resolve deny:', J(gsReviewResolve(revReq.id, false, { nowMin: NOW+20 })));
    p('lesson outcome:', J(GS_ONB.players.nb.lessons));

    // queue lesson — needs a real blocker: someone else's contradictory
    // weather running on the sky
    gsCreditGrant('p2', 500, 'probe fund');
    const p2wx = gsSubmitRequest({ playerId:'p2', kind:'weather', durationMin:30,
      params:{ wx:'rain' } }, NOW+30);
    p('p2 wx (should park in_review):', p2wx.status, p2wx.id, 'reason:', p2wx.reason);
    if(p2wx.status === 'in_review'){
      const rs = gsReviewResolve(p2wx.id, true, { nowMin: NOW+31 });
      p('p2 wx approved->', rs && rs.status);
    }
    p('sky now:', J(GS_WX_OVR.wx), 'sponsors:', J(Object.keys(GS_WX_OVR.sponsors||{})));
    p('queue lesson (fog into claimed sky):', J(gsOnbLesson('nb', 'queue', NOW+40)));
    const qReq = GS_REQ.reqs[GS_REQ.reqs.length-1];
    p('queue req:', qReq.kind, qReq.status, 'billed:', qReq.billed, 'disc:', J(qReq.discount));
    // expire it
    gsBusTick(NOW+40+ (GS_REQ.actions.weather.ttlMin||60) + 1);
    p('queue req after ttl:', qReq.status, 'refunded:', qReq.refunded);
    p('queue lesson outcome:', J(GS_ONB.players.nb.lessons.queue));

    // decline lesson — costar on a thin ambient (SF has 20)
    p('decline lesson:', J(gsOnbLesson('nb', 'decline', NOW+50)));
    p('decline outcome:', J(GS_ONB.players.nb.lessons.decline));

    // hire path read
    const hp = gsOnbHirePath('nb', NOW+60);
    p('hirepath fee:', hp.fee, 'jobs:', (hp.jobs||[]).length, 'vac:', (hp.vacancies||[]).length, 'slots:', J(hp.slots));

    // settle fork then real hire through the bus
    p('settle hire:', J(gsOnbSettle('nb', 'hire', NOW+60)));
    const unit0 = hp.vacancies[0];
    p('picked unit:', J(unit0));
    const hireReq = gsSubmitRequest({ playerId:'nb', kind:'hire', durationMin:5,
      target: unit0 && unit0.id,
      params:{ name:'Probe Person', age:30, pronouns:'they/them', bio:'a probe',
        arrival:'the 24 bus', look:{ build:'compact', palette:'moss', signature:'windbreaker, always' },
        job:'seeking', moveInDate:'2026-09-24' } }, NOW+60);
    p('hire req:', hireReq.status, hireReq.id, 'billed:', hireReq.billed,
      'reason:', hireReq.reason);
    if(hireReq.status === 'in_review'){
      const hr = gsReviewResolve(hireReq.id, true, { nowMin: NOW+61 });
      p('hire resolved:', hr && hr.status, 'billed:', hr && hr.billed);
    }
    p('hired roster:', J(Object.keys(GS_HIRED)));
    p('nb hires:', J(GS_ONB.players.nb.hires), 'hiredCardFor:', GS_ONB.players.nb.hiredCardFor);
    p('S6 card:', J(gsOnbCard('nb', NOW+70)));
    p('stage now:', gsOnbStageOf(GS_ONB.players.nb));

    // deep links
    p('deeplink bogus:', J(gsOnbDeepLink('nb', '?foo=1')));
    p('deeplink hired:', J(gsOnbDeepLink('nb', '?hired=1')));

    // audit + events
    p('audit:', J(gsOnbAudit()));
    p('events seen:', J(gsOnbEvents('nb').map(e=>e.hook)));

    // checklist + state
    p('checklist:', J(gsOnbChecklist('nb', NOW+80)));
    p('wire tail:', J(gsWireTail(5).map(e=>e.text)));

    // snapshot round-trip
    const snap = gsBusSnapshot();
    const nEv = GS_ONB.events.length;
    gsBusReset();
    const wiped = Object.keys(GS_ONB.players).length === 0;
    gsBusLoad(snap);
    p('snapshot wiped:', wiped, 'restored players:', Object.keys(GS_ONB.players).length,
      'events:', GS_ONB.events.length, '=== nEv:', nEv,
      'handle kept:', gsHandleOf('nb'), 'camera kept:', Object.keys(GS_CAMERA).length);
  }catch(e){ p('PROBE THREW:', e.stack || e.message); }
  return out.join('\\n');
};
`;

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
const autotestEl = makeEl('autotest');
global.window = {
  addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') domReadyCb = cb; },
  removeEventListener(){},
  __aiBridge: undefined,
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
global.document = {
  getElementById(id) { if (id === 'autotest') return autotestEl; return elements[id] || (elements[id] = makeEl(id)); },
  createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
  title: '',
  addEventListener(){}, body: makeEl('body'),
};
global.location = { search: process.env.GS_TEST_QUERY || '?sf=1&test' };
global.requestAnimationFrame = () => 0;
try { global.navigator = { userAgent: 'node' }; } catch (e) {}
eval(pageJS + PROBE);
(async () => {
  try { await domReadyCb(); } catch (e) { console.error('BOOT FAILED', e); process.exit(2); }
  await new Promise(r => setTimeout(r, 3000));
  console.log(globalThis.__probe());
  process.exit(0);
})();
