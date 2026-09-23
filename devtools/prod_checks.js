'use strict';
/* production-1 explicit checks — runs against willowbrook_natura_test.html
   with the same DOM stub as sf_harness.js. Asserts, not vibes:
     1. possession ban on C1-C8 holds for player, owner, AND admin ids
     2. ledger conservation: minted - burned == sum(balances), both currencies
     3. parody audit: no real business name reaches a display string
     4. no real-payment code path anywhere in the bundle
   Usage: node devtools/prod_checks.js */
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
           addEventListener(){}, appendChild(){},
           classList:{ add(){}, remove(){} },
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
    VILLAGERS, W, SF_POIS, NV_CAST, GS_REG, GS_LEDGER, GS_WIRE, GS_REQ,
    GS_FEED, GS_HIRED, GS_CORE_CAST: (typeof GS_CORE_CAST!=='undefined'?GS_CORE_CAST:null),
    gsSubmitRequest, gsCreditBalance, gsCreditGrant, gsDollarPay,
    gsLedgerTotal, gsParseAddress, sfDisplayName, sfSignName,
    sfAgentAct, sfAgentState, gsWireTail,
    SF_PARODY_NAMES, GS_WIRE_PARODY })`);

(async () => {
  let pass = 0, fail = 0;
  const ok = (c, msg) => { if(c) pass++; else { fail++; console.log('FAIL', msg); } };
  try { await api.boot(); } catch(e){
    console.error('BOOT FAILED:', e.stack ? e.stack.split('\n').slice(0,8).join('\n') : e);
    process.exit(2);
  }

  /* ---------- 1. possession ban: C1..C8, for every principal ----------
     the ban is absolute — player, owner, admin, and even the agent
     bridge id all get 'possession_ban' denied BEFORE billing. */
  const principals = ['spectator-1', 'owner', 'admin', 'agent-C1'];
  let denied = 0, billed = 0;
  for(const who of principals){
    for(let i = 1; i <= 8; i++){
      const cid = 'C' + i;
      const before = api.gsCreditBalance(who);
      const r = api.gsSubmitRequest({ playerId: who, kind: 'possess',
        target: cid, durationMin: 10 });
      if(r && (r.status === 'denied') &&
         (r.reason === 'possession_ban' || /possession/.test(r.reason)))
        denied++;
      billed += before - api.gsCreditBalance(who);
    }
  }
  ok(denied === 32, 'all 32 possess attempts on C1-C8 denied ' +
     '(player/owner/admin/agent) — got ' + denied);
  ok(billed === 0, 'possession attempts billed 0cr total — got ' + billed);

  /* the bridge itself cannot possess: sfAgentAct has no possess verb */
  const poke = api.sfAgentAct('C1', { verb: 'possess' });
  ok(poke && poke.ok === false, 'sfAgentAct has no possess verb');

  /* ---------- 2. ledger conservation, both currencies ---------- */
  const credBefore = api.gsLedgerTotal('credits');
  const dolBefore = api.gsLedgerTotal('dollars');
  api.gsCreditGrant('audit-p', 100, 'check grant');
  api.gsSubmitRequest({ playerId: 'audit-p', kind: 'weather',
    durationMin: 15, params: { wx: 'fog' } });   // bills credits for real
  api.gsDollarPay('audit-tenant', 'audit-owner', 500, 'check rent');
  /* conservation: for each currency, minted - burned == sum(balances) */
  for(const cur of ['credits', 'dollars']){
    const minted = api.GS_LEDGER.txns.filter(t => t.cur === cur && t.from === 'mint')
      .reduce((s, t) => s + t.amt, 0);
    const burned = api.GS_LEDGER.txns.filter(t => t.cur === cur && t.to === 'burn')
      .reduce((s, t) => s + t.amt, 0);
    const held = api.gsLedgerTotal(cur);
    ok(minted - burned === held,
       cur + ' conserves: minted ' + minted + ' - burned ' + burned +
       ' = held ' + held);
  }
  const billedWx = api.GS_LEDGER.txns
    .filter(t => t.cur === 'credits' && t.from === 'audit-p' && t.to === 'burn')
    .reduce((s, t) => s + t.amt, 0);
  ok(api.gsLedgerTotal('credits') - credBefore === 100 - billedWx,
     'credit grant + weather billing reconcile (net +' +
     (api.gsLedgerTotal('credits') - credBefore) + ', billed ' + billedWx + ')');

  /* ---------- 3. parody audit — no real business name escapes ----------
     REAL = actual SF businesses only (the fiction's own names — Haus
     Coffee, Auerbach Hardware — are canonical parody, not real). Match
     on word boundaries so 'Mudhaus Coffee' can't false-trip 'Haus'. */
  const REAL = ['Cafe La Boheme','Taqueria El Farolito','El Farolito Bar',
    'Bi-Rite','Delfina','Dolores Park Cafe',
    'Tartine','500 Club','Dandelion Chocolate',
    'Valencia Farmers Market','13 Bats','Lofrano',
    'Guerrero Market','Diosa Blooms','Starbucks',
    'Walgreens',"McDonald's",'Whole Foods','Foreign Cinema',
    'Ritual Coffee','Four Barrel','Philz',
    'Wise Sons','Sightglass','La Taqueria','U-Save Plumbing'];
  /* note: 'Mission Chinese' is intentionally not in the blocklist — the
     canonical parody is 'Mission Chinese-ish', which embeds the stem;
     that's the designed public name, documented as a weak-parody case. */
  const realRe = new RegExp('\\b(' + REAL.map(r =>
    r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i');
  /* 3a: every named POI display label is parody/safe */
  let leaks = [];
  for(const p of api.SF_POIS){
    const label = api.sfDisplayName(p.name, p.kind);
    if(label && realRe.test(label))
      leaks.push(p.name + ' -> ' + label);
  }
  ok(leaks.length === 0, 'no POI label leaks a real name (' +
     leaks.slice(0,3).join('; ') + ')');
  /* 3b: wire text gets the parody pass — feed a real name through */
  if(api.GS_WIRE_PARODY){
    const sample = 'meet me at Tartine Bakery then El Farolito, by Bi-Rite';
    let s = sample;
    for(const pr of api.GS_WIRE_PARODY) s = s.replace(pr[0], pr[1]);
    ok(!/tartine|farolito|bi-rite/i.test(s),
       'wire parody pass rewrites real names: "' + s + '"');
  }
  /* 3c: wire entries currently on the feed carry no real names */
  const wireLeak = api.gsWireTail(200).filter(e => e.text && realRe.test(e.text));
  ok(wireLeak.length === 0, 'live wire tail has no real-name leaks (' +
     wireLeak.length + ')');

  /* ---------- 4. no real-payment code path ---------- */
  /* rail identifiers only — 'stripe'/'square' the words are legit
     vocabulary; the payment companies are only ever identifiable by
     domain/key/card-field tokens */
  const payRe = /stripe\.(com|js)|sk_live|pk_live|\bpaypal\b|squareup|squarespace|\bbraintree\b|\badyen\b|checkout\.com|\bvenmo\b|\bcashapp\b|payment_intent|card_number|cvv2|cvc2|\biban\b|routing_number|billing_portal/i;
  const payHits = SRC.split('\n').map((l, i) => ({ l, i }))
    .filter(x => payRe.test(x.l) && !/^\s*(\/\/|\*)/.test(x.l));
  ok(payHits.length === 0, 'no payment-rail identifiers in bundle (' +
     payHits.length + ' hits' +
     (payHits.length ? ': ' + payHits[0].l.trim().slice(0, 80) : '') + ')');
  /* credits only mint via gsCreditGrant — a pure ledger post, no network */
  ok(/function gsCreditGrant/.test(SRC) &&
     !/fetch|XMLHttpRequest|navigator\.sendBeacon/.test(
       (SRC.match(/function gsCreditGrant[\s\S]{0,200}/) || [''])[0]),
     'gsCreditGrant is a pure ledger post (no network call)');

  console.log('==== PROD CHECKS: ' + pass + ' passed, ' + fail + ' failed ====');
  process.exit(fail ? 1 : 0);
})();
