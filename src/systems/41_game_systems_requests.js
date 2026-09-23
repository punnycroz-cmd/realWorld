/* =====================================================================
   PART 41C: GAME SYSTEMS — REQUEST BUS (player agency)
   rw-game-design-2026-09-22 §5: to act inside the world a player files a
   REQUEST declaring action + duration upfront. The bus classifies
   conflicts (exclusive / compatible / queued), charges credits scaled by
   duration paid upfront (hard cap — no overrun), queues first-come-first-
   served, and auto-refunds requests that expire before activation.

   Skeleton scope (v0): lifecycle + classification + cooldowns + ledger
   charging + public feed log. Effect dispatch (actually steering a
   character or the weather) is v1+ — requests resolve to 'completed'
   honestly without pretending to have moved the world.

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
/* hired characters: charId -> owning playerId. Filled by the hiring
   system (v8); exposed now so the possession gate is real from day one. */
const GS_HIRED = {};

function gsNowMin(){ return Date.now() / 60000; }

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
           allow(req) -> true | reason-string }                        */
function gsDefineAction(kind, spec){
  GS_REQ.actions[kind] = Object.assign({
    scope: 'target', exclusive: true, ratePerMin: 1,
    minMin: 1, maxMin: 240, cdPlayerMin: 0, cdGlobalMin: 0, ttlMin: 60,
    allow: null,
  }, spec || {});
}

function gsMarkHired(charId, playerId){ GS_HIRED[charId] = playerId; }
function gsIsPossessable(charId, playerId){
  if(GS_CORE_CAST[charId]) return false;      // absolute ban, incl. owner
  return GS_HIRED[charId] === playerId;        // only YOUR hired character
}

/* default action kinds — the v0 catalogue. Rates are placeholder credits/
   minute pending the pricing decision (design §9.3). */
gsDefineAction('possess', {
  scope: 'target', exclusive: true, ratePerMin: 2,
  minMin: 5, maxMin: 120, cdPlayerMin: 30, ttlMin: 30,
  allow: (r) => gsIsPossessable(r.target, r.playerId)
    ? true : (GS_CORE_CAST[r.target] ? 'possession_ban' : 'not_your_character'),
});
gsDefineAction('weather', {
  scope: 'global', exclusive: true, ratePerMin: 5,
  minMin: 10, maxMin: 240, cdPlayerMin: 120, cdGlobalMin: 60, ttlMin: 60,
});
gsDefineAction('street_event', {
  scope: 'global', exclusive: false, ratePerMin: 3,
  minMin: 15, maxMin: 180, cdPlayerMin: 240, ttlMin: 120,
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

/* surge hook — v7 anti-grief replaces the constant with queue-depth math */
function gsSurgeFactor(resKey){ return 1; }

/* file a request. Returns the request record (status: active | queued |
   denied). Denials never bill; queued requests bill upfront and are
   auto-refunded if they expire before activation (design §5.4–5.5). */
function gsSubmitRequest(spec, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const pid = spec.playerId, kind = spec.kind, target = spec.target || null;
  const dur = spec.durationMin;
  const a = GS_REQ.actions[kind];
  const deny = (reason) => {
    const r = { id: 'req-' + (++GS_REQ.seq), n: GS_REQ.seq, playerId: pid,
      kind, target, durationMin: dur, price: 0, status: 'denied', reason,
      submittedMin: now, _now: now };
    GS_REQ.reqs.push(r); gsBusEmit('deny', r, { reason }); return r;
  };
  if(!a) return deny('unknown_action');
  if(a.scope === 'target' && !target) return deny('missing_target');
  if(!(dur >= a.minMin && dur <= a.maxMin)) return deny('bad_duration');
  if(a.allow){ const why = a.allow({ playerId: pid, target, kind });
               if(why !== true) return deny(why); }
  if((GS_REQ.cdP[pid + '|' + kind] || 0) > now) return deny('cooldown');
  if((GS_REQ.cdG[kind] || 0) > now) return deny('global_cooldown');

  const resKey = gsResourceKey(kind, target);
  const price = Math.ceil(a.ratePerMin * dur * gsSurgeFactor(resKey));
  if(price > 0 && !gsCreditSpend(pid, price, kind + ' request'))
    return deny('insufficient_credits');

  const conflict = a.exclusive && gsActiveOn(resKey).length > 0;
  const r = { id: 'req-' + (++GS_REQ.seq), n: GS_REQ.seq, playerId: pid,
    kind, target, durationMin: dur, price, resKey, submittedMin: now,
    status: conflict ? 'queued' : 'active',
    startMin: conflict ? null : now,
    endMin: conflict ? null : now + dur,
    expireMin: conflict ? now + a.ttlMin : null,
    _now: now };
  GS_REQ.reqs.push(r);
  gsBusEmit(conflict ? 'queue' : 'approve', r, { price });
  return r;
}

/* advance the bus: complete finished actives (set cooldowns, promote the
   FCFS head of the resource queue), expire stale queued requests with a
   full auto-refund. */
function gsBusTick(nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  for(const r of GS_REQ.reqs){
    if(r.status === 'queued' && now > r.expireMin){
      r.status = 'expired'; r._now = now;
      if(r.price > 0) gsCreditRefund(r.playerId, r.price, 'queue expired');
      gsBusEmit('expire', r, { refund: r.price });
    }
    if(r.status === 'active' && now >= r.endMin){
      r.status = 'completed'; r._now = now;
      const a = GS_REQ.actions[r.kind];
      if(a.cdPlayerMin) GS_REQ.cdP[r.playerId + '|' + r.kind] = now + a.cdPlayerMin;
      if(a.cdGlobalMin) GS_REQ.cdG[r.kind] = now + a.cdGlobalMin;
      gsBusEmit('complete', r);
      const next = gsQueueOf(r.resKey)[0];
      if(next && next.status === 'queued'){
        next.status = 'active'; next.startMin = now;
        next.endMin = now + next.durationMin; next.expireMin = null;
        next._now = now;
        gsBusEmit('approve', next, { promoted: true });
      }
    }
  }
}

/* cancel a pending/active request with a full refund. Admin revokes
   compensate the player (design §3/§8) — always full price. */
function gsCancelRequest(id, nowMin, by){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const r = gsRequestById(id);
  if(!r || (r.status !== 'queued' && r.status !== 'active')) return false;
  r.status = 'cancelled'; r._now = now; r.by = by || 'player';
  if(r.price > 0) gsCreditRefund(r.playerId, r.price, 'cancelled');
  gsBusEmit('cancel', r, { by: r.by, refund: r.price });
  return true;
}

/* ---- JSON persistence (request trail + cooldowns + feed) ---- */
function gsBusSnapshot(){
  return JSON.stringify({ seq: GS_REQ.seq, reqs: GS_REQ.reqs,
    cdP: GS_REQ.cdP, cdG: GS_REQ.cdG,
    feed: GS_FEED, feedN: GS_FEED_SEQ.n, hired: GS_HIRED });
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
    return true;
  }catch(e){ return false; }
}

function gsBusReset(){
  GS_REQ.reqs.length = 0; GS_REQ.cdP = {}; GS_REQ.cdG = {};
  GS_FEED.length = 0; GS_FEED_SEQ.n = 0;
  for(const k in GS_HIRED) delete GS_HIRED[k];
}
