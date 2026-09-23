/* =====================================================================
   PART 41C: GAME SYSTEMS — REQUEST BUS (player agency)
   rw-game-design-2026-09-22 §5: to act inside the world a player files a
   REQUEST declaring action + duration upfront. The bus classifies
   conflicts (exclusive / compatible / queued), charges credits scaled by
   duration paid upfront (hard cap — no overrun), queues first-come-first-
   served, and auto-refunds requests that expire before activation.

   v1: the request lifecycle is now REAL.
   - Full action catalogue: possess / weather / street_event / hire /
     listing / buy, each with an honest per-minute rate (see RATE CARD).
   - Effect dispatch: 'maintained' effects run activate()/deactivate()
     around the active window; 'once' effects fire once at activation.
     Requests actually move the world — possession suspends a hired
     character's AI, weather overrides the sky, listings open real sales.
   - Per-minute metering: upfront charge is the hard cap; early player
     cancel refunds whole UNUSED minutes at the applied rate. Admin
     revokes always compensate in full (design §3).
   - Queued requests are re-validated at promotion: if the world changed
     under them (unit leased, character un-hired, listing sold) they fail
     honestly with a full refund instead of running stale.
   - Viewer layer: queue positions, live meters, public feed, and a
     read-only gsViewerState() snapshot for the feed UI / __aiBridge.
   - gsBusTick is now wired into the live sim via registerSimTick — the
     bus runs on real wall-clock minutes (the show is real-time).

   RATE CARD (design §9.3 — honest pricing tracks real compute cost):
     possess      4 cr/min — interactive session relay; the character's
                   LLM brain is SUSPENDED while possessed, so compute cost
                   is low — most of the price is exclusivity on one body.
     weather      6 cr/min — no inference at all; priced for being a
                   world-scale exclusive resource every viewer sees.
     street_event 5 cr/min — perturbs ~20 thin-AI ambient schedules
                   (cheap reflex recompute, no LLM calls).
     hire        30 cr/min (fixed 5-min processing) — creates a character
                   with a standing full-brain compute budget + a lease.
     listing      1 cr/min — a registry row + feed entry; near-zero cost.
     buy         25 cr flat (1-min escrow window) — paperwork one-shot.
   Surge multiplier hook stays flat at 1 — v7 (anti-grief) owns surge.

   Time unit: real minutes (the show runs on real SF time). All entry
   points take an explicit nowMin so tests stay deterministic.
   ===================================================================== */

const GS_REQ = {
  seq: 0,
  reqs: [],          // every request ever filed (audit trail)
  cdP: {},           // 'playerId|kind' -> cooldown-until minute
  cdG: {},           // 'kind'        -> global cooldown-until minute
  actions: {},       // kind -> action spec
};
const GS_FEED = [];        // public request feed — append-only (v6 formats it)
const GS_BUS_HOOKS = [];   // feed/event listeners: fn(evt)
const GS_FEED_SEQ = { n: 0 };

/* core cast are NEVER possessable (design §2/§7 — not even by the owner) */
const GS_CORE_CAST = { C1:1, C2:1, C3:1, C4:1, C5:1, C6:1, C7:1, C8:1 };
/* hired characters: charId -> {playerId, name, role, hiredMin, unitId,
   spawned}. Filled by the 'hire' action (v8 deepens spawn/cast wiring). */
const GS_HIRED = {};
/* creation limits (design §9.5 — sized to the compute budget: 8 mains on
   full brains + hired cast; 24 hired keeps the show inside its envelope) */
const GS_MAX_HIRED_PER_PLAYER = 3;
const GS_MAX_HIRED_TOTAL = 24;
const GS_HIRE_STAKE_MULT = 2;   // move-in stake = 2 months rent + pad
const GS_HIRE_STAKE_PAD = 1200;

/* ---- live effect state (the world-side residue of active requests) ---- */
const GS_POSSESS = {};     // charId -> {playerId, reqId, sinceMin}
const GS_WX_OVR = { wx: null, untilMin: 0, reqId: null, baseHum: null };
const GS_EVENTS = [];      // {id, event, at, sinceMin, untilMin, reqId, playerId}
const GS_LISTINGS = {};    // unitId -> {ask, by, sinceMin, reqId}
const GS_FX_SEQ = { n: 0 };

function gsNowMin(){ return Date.now() / 60000; }
function gsIsAdmin(pid){ return pid === 'owner' || pid === 'admin'; }

function gsBusEmit(type, req, extra){
  const evt = Object.assign({
    n: ++GS_FEED_SEQ.n, min: req && req._now != null ? req._now : null,
    type, player: req && req.playerId, kind: req && req.kind,
    target: req && req.target, req: req && req.id,
  }, extra || {});
  GS_FEED.push(evt);
  for(const fn of GS_BUS_HOOKS){ try{ fn(evt); }catch(e){} }
  return evt;
}
function gsBusOnEvent(fn){ GS_BUS_HOOKS.push(fn); }

/* ---- action catalogue ----
   spec: { scope:'target'|'global', exclusive:bool, ratePerMin:int,
           minMin, maxMin, cdPlayerMin, cdGlobalMin, ttlMin,
           effect:'maintained'|'once'|'none',
           allow(req) -> true | reason-string,
           activate(r, nowMin) -> true | {ok:false, reason},
           deactivate(r, nowMin, why)  (maintained only) }           */
function gsDefineAction(kind, spec){
  GS_REQ.actions[kind] = Object.assign({
    scope: 'target', exclusive: true, ratePerMin: 1,
    minMin: 1, maxMin: 240, cdPlayerMin: 0, cdGlobalMin: 0, ttlMin: 60,
    effect: 'none', allow: null, activate: null, deactivate: null,
  }, spec || {});
}

function gsMarkHired(charId, playerId, meta){
  GS_HIRED[charId] = Object.assign({ playerId, name: null, role: 'Resident',
    hiredMin: null, unitId: null, spawned: false }, meta || {});
}
function gsHiredOwner(charId){
  const h = GS_HIRED[charId];
  if(!h) return null;
  return typeof h === 'string' ? h : h.playerId;   // tolerate legacy shape
}
function gsHiredCount(pid){
  let n = 0;
  for(const k in GS_HIRED) if(gsHiredOwner(k) === pid) n++;
  return n;
}
function gsIsPossessable(charId, playerId){
  if(GS_CORE_CAST[charId]) return false;      // absolute ban, incl. owner
  return gsHiredOwner(charId) === playerId;   // only YOUR hired character
}

/* ---- live villager lookup: hired characters join VILLAGERS under
   _castId (v8 spawn path); possession flips isNPC, which suspends the AI
   schedule (updateVillagerAI) and hands the body to updatePlayerPawn. ---- */
function gsVillagerForChar(cid){
  if(typeof VILLAGERS === 'undefined') return null;
  return VILLAGERS.find(v => v._castId === cid || v.gsCharId === cid) || null;
}
function gsIsBrainSuspended(cid){ return !!GS_POSSESS[cid]; }

/* ---- effect implementations ---- */
function gsFxPossessOn(r, now){
  GS_POSSESS[r.target] = { playerId: r.playerId, reqId: r.id, sinceMin: now };
  const v = gsVillagerForChar(r.target);
  if(v){ v.gsPossessed = r.id; v.isNPC = false; }  // LLM/AI brain suspended
  return true;
}
function gsFxPossessOff(r){
  delete GS_POSSESS[r.target];
  const v = gsVillagerForChar(r.target);
  if(v && v.gsPossessed === r.id){ v.gsPossessed = null; v.isNPC = true; }
}

const GS_WX_KINDS = {   // honest Mission-plausible sky states (Karl included)
  rain:     { rain: 0.75, storm: 0.10, cover: 0.90, dTemp: -2, dHum: +0.20 },
  storm:    { rain: 0.90, storm: 0.80, cover: 1.00, dTemp: -4, dHum: +0.25 },
  clear:    { rain: 0.00, storm: 0.00, cover: 0.15, dTemp: +1, dHum: -0.10 },
  fog:      { rain: 0.10, storm: 0.00, cover: 1.00, dTemp: -3, dHum: +0.30 },
  heatwave: { rain: 0.00, storm: 0.00, cover: 0.05, dTemp: +8, dHum: -0.15 },
};
function gsFxWxOn(r, now){
  const prof = GS_WX_KINDS[r.params && r.params.wx];
  if(!prof) return { ok: false, reason: 'bad_weather' };
  GS_WX_OVR.wx = r.params.wx; GS_WX_OVR.untilMin = r.endMin; GS_WX_OVR.reqId = r.id;
  GS_WX_OVR.baseHum = (typeof W !== 'undefined') ? W.hum : null; // hum isn't
  return true;                                   // recomputed per-frame: capture base
}
function gsFxWxOff(r){
  if(GS_WX_OVR.reqId !== r.id) return;
  if(GS_WX_OVR.baseHum != null && typeof W !== 'undefined') W.hum = GS_WX_OVR.baseHum;
  GS_WX_OVR.wx = null; GS_WX_OVR.untilMin = 0; GS_WX_OVR.reqId = null;
  GS_WX_OVR.baseHum = null;
}
/* applied every sim frame AFTER the natural/live weather writes, so the
   request's sky wins while active and nature resumes the frame it ends */
function gsApplyWxOverride(){
  const prof = GS_WX_KINDS[GS_WX_OVR.wx];
  if(!prof || typeof W === 'undefined') return;
  W.rain = prof.rain; W.storm = prof.storm;
  W.temp += prof.dTemp;                          // temp IS recomputed per-frame
  if(GS_WX_OVR.baseHum != null) W.hum = clamp(GS_WX_OVR.baseHum + prof.dHum, 0, 1);
  if(typeof SF_WX !== 'undefined') SF_WX.cover = prof.cover;
}

const GS_EVENT_KINDS = {   // permitted civic events — Mission-plausible
  block_party: 1, street_fair: 1, farmers_market: 1, parade: 1,
  movie_night: 1, park_cleanup: 1, mural_tour: 1,
};
function gsFxEventOn(r, now){
  const kind = r.params && r.params.event;
  if(!GS_EVENT_KINDS[kind]) return { ok: false, reason: 'bad_event' };
  GS_EVENTS.push({ id: 'evt-' + (++GS_FX_SEQ.n), event: kind,
    at: (r.params && r.params.at) || null, sinceMin: now, untilMin: r.endMin,
    reqId: r.id, playerId: r.playerId });
  return true;
}
function gsFxEventOff(r){
  const i = GS_EVENTS.findIndex(e => e.reqId === r.id);
  if(i >= 0) GS_EVENTS.splice(i, 1);
}

function gsFxHire(r, now){
  const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
  if(!u) return { ok: false, reason: 'unknown_unit' };
  if(gsActiveLease(u.id)) return { ok: false, reason: 'unit_occupied' };
  let n = 1; while(GS_HIRED['H' + n]) n++;        // first free id, deterministic
  const cid = 'H' + n;
  gsMarkHired(cid, r.playerId, {
    name: (r.params && r.params.name) || ('Resident ' + cid),
    role: (r.params && r.params.role) || 'Resident',
    hiredMin: now, unitId: u.id, spawned: false,  // world spawn lands in v8
  });
  gsSignLease(u.id, cid, { start: 'hire:' + r.id, monthly_rent: u.base_rent,
                           occupants: [cid] });
  gsDollarGrant(cid, u.base_rent * GS_HIRE_STAKE_MULT + GS_HIRE_STAKE_PAD,
                'move-in stake');
  gsBusEmit('hire', r, { charId: cid, unit: u.id });
  return true;
}

function gsFxListOn(r, now){
  const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
  if(!u) return { ok: false, reason: 'unknown_unit' };
  if(GS_LISTINGS[u.id]) return { ok: false, reason: 'already_listed' };
  const ask = (r.params && r.params.ask > 0) ? Math.floor(r.params.ask)
                                           : u.base_rent * 150;
  GS_LISTINGS[u.id] = { ask, by: r.playerId, sinceMin: now, reqId: r.id,
                        address: gsAddressOfUnit(u.id) };
  return true;
}
function gsFxListOff(r){
  const l = GS_LISTINGS[r.target];
  if(l && l.reqId === r.id) delete GS_LISTINGS[r.target];
}

/* purchase: once-effect — title moves to the buyer's hired character,
   dollars move through the ledger, any tenants' leases survive (SF). */
function gsFxBuy(r, now){
  const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
  const l = u && GS_LISTINGS[u.id];
  if(!l) return { ok: false, reason: 'not_listed' };
  const buyer = r.params && r.params.buyerId;
  const b = gsBldById(u.bld_id);
  const seller = u.owner_id || (b && b.owner_id) || 'landlord';
  if(gsDollarBalance(buyer) < l.ask) return { ok: false, reason: 'insufficient_dollars' };
  gsDollarPay(buyer, seller, l.ask, 'purchase ' + l.address);
  u.owner_id = buyer;                            // condo-style unit title
  delete GS_LISTINGS[u.id];
  const listReq = gsRequestById(l.reqId);        // the seller's listing is done
  if(listReq && listReq.status === 'active'){
    listReq.status = 'completed'; listReq._now = now;
    listReq.usedMin = now - (listReq.startMin || now);
    listReq.fxOn = false;
    gsBusEmit('complete', listReq, { sold: true, usedMin: listReq.usedMin });
  }
  gsBusEmit('sale', r, { unit: u.id, address: l.address, price: l.ask, buyer });
  return true;
}

/* ---- the catalogue ---- */
gsDefineAction('possess', {
  scope: 'target', exclusive: true, ratePerMin: 4,
  minMin: 5, maxMin: 120, cdPlayerMin: 30, ttlMin: 30,
  effect: 'maintained',
  allow: (r) => gsIsPossessable(r.target, r.playerId)
    ? true : (GS_CORE_CAST[r.target] ? 'possession_ban' : 'not_your_character'),
  activate: gsFxPossessOn, deactivate: gsFxPossessOff,
});
gsDefineAction('weather', {
  scope: 'global', exclusive: true, ratePerMin: 6,
  minMin: 10, maxMin: 240, cdPlayerMin: 120, cdGlobalMin: 60, ttlMin: 60,
  effect: 'maintained',
  allow: (r) => (r.params && GS_WX_KINDS[r.params.wx]) ? true : 'bad_weather',
  activate: gsFxWxOn, deactivate: gsFxWxOff,
});
gsDefineAction('street_event', {
  scope: 'global', exclusive: false, ratePerMin: 5,
  minMin: 15, maxMin: 180, cdPlayerMin: 240, ttlMin: 120,
  effect: 'maintained',
  allow: (r) => (r.params && GS_EVENT_KINDS[r.params.event]) ? true : 'bad_event',
  activate: gsFxEventOn, deactivate: gsFxEventOff,
});
gsDefineAction('hire', {
  scope: 'target', exclusive: true, ratePerMin: 30,
  minMin: 5, maxMin: 5, cdPlayerMin: 1440, ttlMin: 30,
  effect: 'once',
  allow: (r) => {
    if(!r.target) return 'needs_housing';        // design §6: housing required
    const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
    if(!u) return 'unknown_unit';
    if(gsActiveLease(u.id)) return 'unit_occupied';
    if(gsHiredCount(r.playerId) >= GS_MAX_HIRED_PER_PLAYER) return 'hire_cap';
    if(Object.keys(GS_HIRED).length >= GS_MAX_HIRED_TOTAL) return 'cast_cap';
    return true;
  },
  activate: gsFxHire,
});
gsDefineAction('listing', {
  scope: 'target', exclusive: true, ratePerMin: 1,
  minMin: 30, maxMin: 4320, ttlMin: 60,
  effect: 'maintained',
  allow: (r) => {
    const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
    if(!u) return 'unknown_unit';
    const b = gsBldById(u.bld_id);
    const owner = u.owner_id || (b && b.owner_id);
    if(owner !== r.playerId && !(gsIsAdmin(r.playerId) && owner === 'landlord'))
      return 'not_owner';
    if(GS_LISTINGS[u.id]) return 'already_listed';
    return true;
  },
  activate: gsFxListOn, deactivate: gsFxListOff,
});
gsDefineAction('buy', {
  scope: 'target', exclusive: true, ratePerMin: 25,
  minMin: 1, maxMin: 1, ttlMin: 15,
  effect: 'once',
  allow: (r) => {
    const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
    if(!u) return 'unknown_unit';
    const l = GS_LISTINGS[u.id];
    if(!l) return 'not_listed';
    const buyer = r.params && r.params.buyerId;
    if(!buyer || gsHiredOwner(buyer) !== r.playerId) return 'buyer_not_hired';
    if(gsHiredOwner(buyer) === l.by) return 'self_deal';
    if(gsDollarBalance(buyer) < l.ask) return 'insufficient_dollars';
    return true;
  },
  activate: gsFxBuy,
});

function gsResourceKey(kind, target){
  const s = GS_REQ.actions[kind];
  return (s && s.scope === 'global') ? 'g:' + kind : 't:' + kind + ':' + target;
}
function gsActiveOn(resKey){
  return GS_REQ.reqs.filter(r => r.resKey === resKey && r.status === 'active');
}
function gsQueueOf(resKey){
  return GS_REQ.reqs.filter(r => r.resKey === resKey && r.status === 'queued')
                    .sort((a, b) => a.submittedMin - b.submittedMin ||
                                   a.n - b.n);
}
function gsRequestById(id){
  return GS_REQ.reqs.find(r => r.id === id) || null;
}
/* 1-based position in a resource queue, 0 when not queued — viewer-facing */
function gsQueuePosition(id){
  const r = gsRequestById(id);
  if(!r || r.status !== 'queued') return 0;
  const q = gsQueueOf(r.resKey);
  const i = q.findIndex(x => x.id === id);
  return i < 0 ? 0 : i + 1;
}

/* surge hook — v7 anti-grief replaces the constant with queue-depth math */
function gsSurgeFactor(resKey){ return 1; }

/* ---- effect dispatch plumbing ---- */
function gsFxActivate(r, now){
  const a = GS_REQ.actions[r.kind];
  if(!a || !a.activate){ r.fxOn = false; return true; }
  let res;
  try{ res = a.activate(r, now); }
  catch(e){ res = { ok: false, reason: 'effect_error' }; }
  if(res === false || (res && res.ok === false)){
    r.status = 'failed'; r._now = now;
    r.failReason = (res && res.reason) || 'effect_failed';
    if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed, 'activation failed');
                      r.refunded = r.billed; }
    gsBusEmit('fail', r, { reason: r.failReason, refund: r.billed });
    return false;
  }
  r.fxOn = true;
  return true;
}
function gsFxDeactivate(r, now, why){
  const a = GS_REQ.actions[r.kind];
  if(r.fxOn && a && a.effect === 'maintained' && a.deactivate){
    try{ a.deactivate(r, now, why); }catch(e){}
  }
  r.fxOn = false;
}
/* promotion revalidation: the world may have changed while the request
   waited — re-run allow(); a stale request fails with a full refund. */
function gsPromoteNext(resKey, now){
  while(true){
    const next = gsQueueOf(resKey)[0];
    if(!next) return;
    if(now > next.expireMin){                    // TTL already lapsed: refund,
      next.status = 'expired'; next._now = now;  // don't activate a dead request
      if(next.billed > 0){ gsCreditRefund(next.playerId, next.billed,
                                           'queue expired');
                           next.refunded = next.billed; }
      gsBusEmit('expire', next, { refund: next.billed });
      continue;
    }
    const a = GS_REQ.actions[next.kind];
    if(a && a.allow){
      const why = a.allow({ playerId: next.playerId, target: next.target,
                            kind: next.kind, params: next.params });
      if(why !== true){
        next.status = 'failed'; next._now = now; next.failReason = why;
        if(next.billed > 0){ gsCreditRefund(next.playerId, next.billed,
                                             'conditions changed');
                             next.refunded = next.billed; }
        gsBusEmit('fail', next, { reason: why, refund: next.billed,
                                  stale: true });
        continue;                                // FCFS: try the next in line
      }
    }
    next.status = 'active'; next.startMin = now;
    next.endMin = now + next.durationMin; next.expireMin = null;
    next._now = now;
    gsBusEmit('approve', next, { promoted: true, price: next.price });
    if(!gsFxActivate(next, now)) continue;       // activation failed: next
    return;
  }
}

/* file a request. Returns the request record (status: active | queued |
   denied | failed). Denials never bill; queued requests bill upfront and
   are auto-refunded if they expire or go stale before activation. */
function gsSubmitRequest(spec, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const pid = spec.playerId, kind = spec.kind, target = spec.target || null;
  const dur = spec.durationMin;
  const params = spec.params || null;
  const a = GS_REQ.actions[kind];
  const deny = (reason) => {
    const r = { id: 'req-' + (++GS_REQ.seq), n: GS_REQ.seq, playerId: pid,
      kind, target, durationMin: dur, params, price: 0, status: 'denied',
      reason, submittedMin: now, _now: now };
    GS_REQ.reqs.push(r); gsBusEmit('deny', r, { reason }); return r;
  };
  if(!a) return deny('unknown_action');
  if(a.scope === 'target' && !target) return deny('missing_target');
  if(!(dur >= a.minMin && dur <= a.maxMin)) return deny('bad_duration');
  if(a.allow){ const why = a.allow({ playerId: pid, target, kind, params });
               if(why !== true) return deny(why); }
  if((GS_REQ.cdP[pid + '|' + kind] || 0) > now) return deny('cooldown');
  if((GS_REQ.cdG[kind] || 0) > now) return deny('global_cooldown');

  const resKey = gsResourceKey(kind, target);
  const price = Math.ceil(a.ratePerMin * dur * gsSurgeFactor(resKey));
  /* admin ('owner'/'admin') files free — the owner exercises power through
     admin tools (design §3), never buys it back from themselves. */
  if(price > 0 && !gsIsAdmin(pid) &&
     !gsCreditSpend(pid, price, kind + ' request'))
    return deny('insufficient_credits');

  const conflict = a.exclusive && gsActiveOn(resKey).length > 0;
  const r = { id: 'req-' + (++GS_REQ.seq), n: GS_REQ.seq, playerId: pid,
    kind, target, durationMin: dur, params, price, resKey,
    billed: gsIsAdmin(pid) ? 0 : price,
    rateApplied: dur > 0 ? price / dur : 0,
    submittedMin: now, status: conflict ? 'queued' : 'active',
    startMin: conflict ? null : now,
    endMin: conflict ? null : now + dur,
    expireMin: conflict ? now + a.ttlMin : null,
    usedMin: 0, refunded: 0, fxOn: false, _now: now };
  GS_REQ.reqs.push(r);
  if(conflict){
    gsBusEmit('queue', r, { price, pos: gsQueuePosition(r.id) });
  } else {
    gsBusEmit('approve', r, { price });
    if(gsFxActivate(r, now) && gsLowCredit(pid))
      gsBusEmit('warn', r, { low_credits: true,
                             balance: gsCreditBalance(pid) });
  }
  return r;
}

/* advance the bus: complete finished actives (set cooldowns, promote the
   FCFS head of the resource queue), expire stale queued requests with a
   full auto-refund. */
function gsBusTick(nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  for(const r of GS_REQ.reqs.slice()){
    if(r.status === 'queued' && now > r.expireMin){
      r.status = 'expired'; r._now = now;
      if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed, 'queue expired');
                        r.refunded = r.billed; }
      gsBusEmit('expire', r, { refund: r.billed });
      continue;
    }
    if(r.status === 'active' && now >= r.endMin){
      gsFxDeactivate(r, now, 'completed');
      r.status = 'completed'; r._now = now;
      r.usedMin = r.durationMin;
      const a = GS_REQ.actions[r.kind];
      if(a.cdPlayerMin) GS_REQ.cdP[r.playerId + '|' + r.kind] = now + a.cdPlayerMin;
      if(a.cdGlobalMin) GS_REQ.cdG[r.kind] = now + a.cdGlobalMin;
      gsBusEmit('complete', r, { usedMin: r.usedMin });
      gsPromoteNext(r.resKey, now);
    }
  }
}

/* cancel a queued/active request.
   - queued: full refund (it never ran)
   - active, by player: whole UNUSED minutes refunded at the applied rate
     (per-minute billing is real — a started minute is consumed)
   - active, by admin/owner: FULL refund — admin overrides always
     compensate the player (design §3)                                 */
function gsCancelRequest(id, nowMin, by){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const r = gsRequestById(id);
  if(!r || (r.status !== 'queued' && r.status !== 'active')) return false;
  const isAdmin = (by === 'admin' || by === 'owner');
  let refund;
  if(r.status === 'queued' || isAdmin){
    refund = r.billed;
  } else {
    const unusedWholeMin = Math.max(0, Math.floor(r.endMin - now));
    refund = Math.min(r.billed, Math.floor(r.rateApplied * unusedWholeMin));
  }
  r.usedMin = r.status === 'active'
    ? Math.max(0, Math.min(r.durationMin, now - (r.startMin || now))) : 0;
  r.status = 'cancelled'; r._now = now; r.by = by || 'player';
  gsFxDeactivate(r, now, 'cancelled');
  if(refund > 0){ gsCreditRefund(r.playerId, refund, 'cancelled');
                  r.refunded = refund; }
  gsBusEmit('cancel', r, { by: r.by, refund, usedMin: r.usedMin });
  return true;
}

/* owner revoke switch (design §8): full compensation + a public admin
   line on the feed, so the override is transparent to every viewer. */
function gsAdminRevoke(id, reason, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const r = gsRequestById(id);
  if(!r || (r.status !== 'queued' && r.status !== 'active')) return false;
  gsBusEmit('admin', { playerId: 'owner', kind: 'admin', id: null, _now: now },
            { action: 'revoke', target: id, reason: reason || 'revoked' });
  return gsCancelRequest(id, now, 'admin');
}
/* every admin action lands on the public feed (design §3 transparency) */
function gsAdminAction(label, detail, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  return gsBusEmit('admin', { playerId: 'owner', kind: 'admin', id: null,
                              _now: now },
                   Object.assign({ action: label }, detail || {}));
}

/* ---- viewer layer: read-only projections of bus state ---- */
function gsRequestMeter(id, nowMin){
  const r = gsRequestById(id);
  const now = (nowMin != null) ? nowMin : gsNowMin();
  if(!r) return null;
  const m = { id: r.id, kind: r.kind, status: r.status, price: r.price,
              refunded: r.refunded || 0 };
  if(r.status === 'active'){
    m.elapsedMin = Math.max(0, now - r.startMin);
    m.remainingMin = Math.max(0, r.endMin - now);
    m.spentSoFar = Math.min(r.price, Math.ceil(r.rateApplied * m.elapsedMin));
    m.lowCredits = gsLowCredit(r.playerId);
  } else {
    m.usedMin = r.usedMin || 0;
  }
  if(r.status === 'queued') m.queuePos = gsQueuePosition(id);
  return m;
}
function gsViewerState(nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const queues = {};
  for(const r of GS_REQ.reqs){
    if(r.status !== 'queued') continue;
    (queues[r.resKey] = queues[r.resKey] || []).push({
      id: r.id, player: r.playerId, kind: r.kind, target: r.target,
      pos: gsQueuePosition(r.id), expiresInMin: +(r.expireMin - now).toFixed(1),
    });
  }
  return {
    nowMin: now,
    feed: GS_FEED.slice(-50),
    active: gsActiveSessions(now),
    queues,
    listings: JSON.parse(JSON.stringify(GS_LISTINGS)),
    events: GS_EVENTS.map(e => Object.assign({}, e)),
    weather: GS_WX_OVR.wx ? { wx: GS_WX_OVR.wx, untilMin: GS_WX_OVR.untilMin } : null,
  };
}
function gsActiveSessions(now){
  return GS_REQ.reqs.filter(r => r.status === 'active').map(r => ({
    id: r.id, player: r.playerId, kind: r.kind, target: r.target,
    remainingMin: +(r.endMin - now).toFixed(1), price: r.price,
  }));
}

/* possession briefing (design §7 — public fields ONLY; drama seeds and
   secrets are redacted by construction: they never enter this object).
   v5 deepens this into the full pre-possession packet. */
function gsPossessionBriefing(charId){
  const owner = gsHiredOwner(charId);
  if(!owner) return null;
  const h = GS_HIRED[charId];
  const v = gsVillagerForChar(charId);
  const lease = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor(charId).find(l => l.status === 'active') : null;
  return {
    id: charId,
    name: (h && h.name) || (v && v.name) || charId,
    role: (h && h.role) || (v && v.role) || 'Resident',
    home: lease ? gsAddressOfUnit(lease.unit_id) : null,
    routine: v && v.sfSched ? 'daily schedule — observable in world' : null,
    possessedBy: GS_POSSESS[charId] ? GS_POSSESS[charId].playerId : null,
  };
}

/* ---- live wiring: the show runs on real wall-clock minutes. The bus
   tick is throttled to 4x/sec; the weather override applies EVERY frame
   so it wins over both the medieval front math and the live Open-Meteo
   fetch (this module loads after sf/, so its SIM_TICK runs later). ---- */
let gsLastBusMs = 0;
function gsSysTick(dtH){
  if(GS_WX_OVR.wx) gsApplyWxOverride();
  const ms = Date.now();
  if(ms - gsLastBusMs < 250) return;
  gsLastBusMs = ms;
  gsBusTick(ms / 60000);
}
if(typeof registerSimTick === 'function') registerSimTick(gsSysTick);

/* ---- JSON persistence (request trail + cooldowns + feed + live fx) ---- */
function gsBusSnapshot(){
  return JSON.stringify({ seq: GS_REQ.seq, reqs: GS_REQ.reqs,
    cdP: GS_REQ.cdP, cdG: GS_REQ.cdG,
    feed: GS_FEED, feedN: GS_FEED_SEQ.n, hired: GS_HIRED,
    possess: GS_POSSESS, events: GS_EVENTS,
    listings: GS_LISTINGS, wxOvr: GS_WX_OVR, fxSeq: GS_FX_SEQ.n });
}
function gsBusLoad(json){
  try{
    const d = JSON.parse(json);
    if(!d || !Array.isArray(d.reqs)) return false;
    GS_REQ.seq = d.seq || 0; GS_REQ.reqs = d.reqs;
    GS_REQ.cdP = d.cdP || {}; GS_REQ.cdG = d.cdG || {};
    GS_FEED.length = 0; if(d.feed) GS_FEED.push.apply(GS_FEED, d.feed);
    GS_FEED_SEQ.n = d.feedN || 0;
    for(const k in GS_HIRED) delete GS_HIRED[k];
    if(d.hired) Object.assign(GS_HIRED, d.hired);
    for(const k in GS_POSSESS) delete GS_POSSESS[k];
    if(d.possess) Object.assign(GS_POSSESS, d.possess);
    GS_EVENTS.length = 0; if(d.events) GS_EVENTS.push.apply(GS_EVENTS, d.events);
    for(const k in GS_LISTINGS) delete GS_LISTINGS[k];
    if(d.listings) Object.assign(GS_LISTINGS, d.listings);
    if(d.wxOvr) Object.assign(GS_WX_OVR, d.wxOvr);
    GS_FX_SEQ.n = d.fxSeq || 0;
    // re-assert brain suspension on any already-spawned villagers
    for(const cid in GS_POSSESS){
      const v = gsVillagerForChar(cid);
      if(v){ v.gsPossessed = GS_POSSESS[cid].reqId; v.isNPC = false; }
    }
    return true;
  }catch(e){ return false; }
}

function gsBusReset(){
  GS_REQ.reqs.length = 0; GS_REQ.cdP = {}; GS_REQ.cdG = {};
  GS_FEED.length = 0; GS_FEED_SEQ.n = 0;
  for(const k in GS_HIRED) delete GS_HIRED[k];
  for(const k in GS_POSSESS) delete GS_POSSESS[k];
  GS_EVENTS.length = 0;
  for(const k in GS_LISTINGS) delete GS_LISTINGS[k];
  GS_WX_OVR.wx = null; GS_WX_OVR.untilMin = 0; GS_WX_OVR.reqId = null;
  GS_WX_OVR.baseHum = null;
  GS_FX_SEQ.n = 0;
}

/* ---- bridge surface (read-only viewer API + request filing) ---- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.gsSubmitRequest = (spec) => gsSubmitRequest(spec);
  window.__aiBridge.gsCancelRequest = (id) => gsCancelRequest(id, null, 'player');
  window.__aiBridge.gsViewerState = () => gsViewerState();
  window.__aiBridge.gsRequestMeter = (id) => gsRequestMeter(id);
  window.__aiBridge.gsQueuePosition = (id) => gsQueuePosition(id);
  window.__aiBridge.gsPossessionBriefing = (cid) => gsPossessionBriefing(cid);
}
