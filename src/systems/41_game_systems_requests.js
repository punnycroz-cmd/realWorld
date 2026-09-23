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

   v2: conflicts are now a PAIRWISE CLAIMS matrix (the permit-office
   model) instead of a single exclusive resource key:
   - Every request declares what it claims: char:<id> (one driver per
     body), sky (one forecast — but design §5 only makes CONTRADICTORY
     weather exclusive, so identical forecasts may co-sponsor the same
     sky via GS_WX_OVR.sponsors), venue:<place> (one permit per
     location), openair (roving/city-assigned events — never block each
     other but still flag outdoor), paper:<unit> (one registry paperwork
     change per unit — hire and buy serialize), listing:<unit>.
   - Pairwise clash rules: same class + same resource clash, EXCEPT a
     shared sky forecast; and sky.severe x event.outdoor clashes BOTH
     ways — you cannot rain on a permitted outdoor event (pay-to-grief
     is forbidden), and the city does not issue outdoor permits into a
     storm hold.
   - FCFS under pairwise conflicts: a request queues iff it clashes
     with ANY earlier live request (active or queued). Queued requests
     can never be leapfrogged by later conflicting ones — starvation is
     impossible because every blocker has a hard endMin cap.
   - Promotion is global (gsPromoteAll): after any completion, expiry,
     cancel or revoke, the whole queue is scanned in submission order
     and every request that has become unblocked activates. v1 only
     promoted on natural completion — a cancelled request left its
     queue stranded until something else finished. That hole is closed.
   - Compatible multiplayer is made visible: co-possession by different
     players emits a 'session' feed event and gsCoSessions() reports
     the overlaps — two players steering two characters through one
     interaction is the best multiplayer (design §5).
   - Transparency: queue feed entries carry blockedBy + on (the
     clashing claims); gsExplainRequest gives the plain-English reason;
     gsConflictRules lists the matrix for the debug panel.

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
const GS_POSSESS = {};     // charId -> {playerId, reqId, sinceMin, prevNPC, ...}
/* the sky may have several sponsors when identical forecasts co-run
   (design §5: only CONTRADICTORY weather is exclusive) — sponsors maps
   reqId -> that request's endMin; the override holds while it is
   non-empty and untilMin is the furthest sponsor end. */
const GS_WX_OVR = { wx: null, untilMin: 0, reqId: null, baseHum: null,
                    sponsors: {} };
const GS_EVENTS = [];      // {id, event, at, sinceMin, untilMin, reqId, playerId}
const GS_LISTINGS = {};    // unitId -> {ask, by, sinceMin, reqId}
const GS_FX_SEQ = { n: 0 };
/* §11.4: a request the intent screen flags for human eyes parks in
   'in_review' at most this long — lapse auto-refunds (moderation.json:
   queued/under-review requests that expire before activation auto-refund). */
const GS_REVIEW_TTL_MIN = 720;

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
   _castId (v5 spawn path); possession flips isNPC, which suspends the AI
   schedule (updateVillagerAI) and hands the body to updatePlayerPawn. ---- */
function gsVillagerForChar(cid){
  if(typeof VILLAGERS === 'undefined') return null;
  return VILLAGERS.find(v => v._castId === cid || v.gsCharId === cid) || null;
}
function gsIsBrainSuspended(cid){ return !!GS_POSSESS[cid]; }

/* ---- effect implementations ---- */
function gsFxPossessOn(r, now){
  const v = gsVillagerForChar(r.target);
  GS_POSSESS[r.target] = { playerId: r.playerId, reqId: r.id, sinceMin: now,
                           prevNPC: v ? v.isNPC : true };
  if(v){ v.gsPossessed = r.id; v.isNPC = false;    // LLM/AI brain suspended
         v.targetX = null; v.targetY = null; v.sfPath = null; }
  /* v5: the session record picks up meters, pickup cell, feed 'begin' */
  if(typeof gsPossessOn === 'function') gsPossessOn(r, now);
  /* compatible multiplayer made visible (design §5): when this activation
     puts two DIFFERENT players behind two different characters at once,
     that's a shared scene — report it on the feed as one. */
  const others = Object.keys(GS_POSSESS).filter(c =>
    c !== r.target && GS_POSSESS[c].playerId !== r.playerId);
  if(others.length){
    const players = [r.playerId].concat(others.map(c => GS_POSSESS[c].playerId));
    gsBusEmit('session', r, {
      players: players.filter((x, i) => players.indexOf(x) === i),
      chars: [r.target].concat(others),
    });
  }
  return true;
}
function gsFxPossessOff(r, now, why){
  const sess = GS_POSSESS[r.target];
  /* v5: write the driving record while the session is still live */
  if(typeof gsPossessOff === 'function') gsPossessOff(r, now, why);
  delete GS_POSSESS[r.target];
  const v = gsVillagerForChar(r.target);
  if(v && v.gsPossessed === r.id){
    v.gsPossessed = null;
    v.isNPC = (sess && sess.prevNPC != null) ? sess.prevNPC : true;
    v.targetX = null; v.targetY = null; v.sfPath = null;  // AI resumes here
  }
}

const GS_WX_KINDS = {   // honest Mission-plausible sky states (Karl included)
  rain:     { rain: 0.75, storm: 0.10, cover: 0.90, dTemp: -2, dHum: +0.20, severe: 1 },
  storm:    { rain: 0.90, storm: 0.80, cover: 1.00, dTemp: -4, dHum: +0.25, severe: 1 },
  clear:    { rain: 0.00, storm: 0.00, cover: 0.15, dTemp: +1, dHum: -0.10, severe: 0 },
  fog:      { rain: 0.10, storm: 0.00, cover: 1.00, dTemp: -3, dHum: +0.30, severe: 0 },
  heatwave: { rain: 0.00, storm: 0.00, cover: 0.05, dTemp: +8, dHum: -0.15, severe: 0 },
};
/* severe = weather the city would not issue an outdoor permit into, and
   that may not be summoned over a permitted outdoor event (v2 matrix).
   Fog stays benign — Karl over a Dolores movie night is authentic, not
   griefing; heatwaves are real SF and don't cancel fairs either. */
function gsFxWxOn(r, now){
  const prof = GS_WX_KINDS[r.params && r.params.wx];
  if(!prof) return { ok: false, reason: 'bad_weather' };
  const wx = r.params.wx;
  /* a different forecast still holds the sky — the matrix should have
     queued this request; never clobber a paid override. */
  if(GS_WX_OVR.wx && GS_WX_OVR.wx !== wx)
    return { ok: false, reason: 'sky_busy' };
  if(!GS_WX_OVR.wx)                            // first sponsor: capture base
    GS_WX_OVR.baseHum = (typeof W !== 'undefined') ? W.hum : null; // hum isn't
  GS_WX_OVR.wx = wx;                           // recomputed per-frame
  (GS_WX_OVR.sponsors = GS_WX_OVR.sponsors || {})[r.id] = r.endMin;
  GS_WX_OVR.untilMin = Math.max.apply(null,
    Object.keys(GS_WX_OVR.sponsors).map(k => GS_WX_OVR.sponsors[k]));
  GS_WX_OVR.reqId = r.id;                      // most recent sponsor (info)
  return true;
}
function gsFxWxOff(r){
  const s = GS_WX_OVR.sponsors || {};
  if(!(r.id in s)) return;                     // never sponsored the sky
  delete s[r.id];
  const rest = Object.keys(s);
  if(rest.length){                             // sponsors remain: sky holds
    GS_WX_OVR.untilMin = Math.max.apply(null, rest.map(k => s[k]));
    GS_WX_OVR.reqId = rest[rest.length - 1];
    return;
  }
  if(GS_WX_OVR.baseHum != null && typeof W !== 'undefined') W.hum = GS_WX_OVR.baseHum;
  GS_WX_OVR.wx = null; GS_WX_OVR.untilMin = 0; GS_WX_OVR.reqId = null;
  GS_WX_OVR.baseHum = null; GS_WX_OVR.sponsors = {};
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

/* permitted civic events — Mission-plausible. venue:1 = occupies its
   location (one permit per venue); venue:0 = roving (a walking tour
   passes through, it does not occupy). outdoor flags exposure to the
   sky — severe weather may not run over a permitted outdoor event. */
const GS_EVENT_KINDS = {
  block_party:     { outdoor: 1, venue: 1 },
  street_fair:     { outdoor: 1, venue: 1 },
  farmers_market:  { outdoor: 1, venue: 1 },
  parade:          { outdoor: 1, venue: 1 },
  movie_night:     { outdoor: 1, venue: 1 },
  park_cleanup:    { outdoor: 1, venue: 1 },
  mural_tour:      { outdoor: 1, venue: 0 },
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
  if(!gsUnitLivable(u)) return { ok: false, reason: 'unit_not_livable' };
  const hb = gsBldById(u.bld_id);
  if(hb && hb.offmap) return { ok: false, reason: 'unit_offmap' };
  if(gsActiveLease(u.id)) return { ok: false, reason: 'unit_occupied' };
  let n = 1; while(GS_HIRED['H' + n]) n++;        // first free id, deterministic
  const cid = 'H' + n;
  gsMarkHired(cid, r.playerId, {
    name: (r.params && r.params.name) || ('Resident ' + cid),
    role: (r.params && r.params.role) || 'Resident',
    hiredMin: now, unitId: u.id, spawned: false,
  });
  gsSignLease(u.id, cid, { start: (typeof gsTodayStr === 'function' &&
    gsTodayStr()) || ('hire:' + r.id), monthly_rent: u.base_rent,
    occupants: [cid] });
  gsDollarGrant(cid, u.base_rent * GS_HIRE_STAKE_MULT + GS_HIRE_STAKE_PAD,
                'move-in stake');
  /* v5: the hired character walks onto the stage — a real pawn with a
     deterministic look and a routine anchored to this lease's door */
  if(typeof gsSpawnHired === 'function') gsSpawnHired(cid);
  gsBusEmit('hire', r, { charId: cid, unit: u.id });
  return true;
}

function gsFxListOn(r, now){
  const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
  if(!u) return { ok: false, reason: 'unknown_unit' };
  if(!gsUnitLivable(u)) return { ok: false, reason: 'unit_not_livable' };
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

/* ---- the catalogue ----
   claims(r) declares what a request occupies while it runs (v2 conflict
   matrix — see gsClaimClash). allow() still decides standing validity
   (ownership, bans, caps); the matrix decides transient occupancy. */
gsDefineAction('possess', {
  scope: 'target', exclusive: true, ratePerMin: 4,
  minMin: 5, maxMin: 120, cdPlayerMin: 30, ttlMin: 30,
  effect: 'maintained',
  allow: (r) => (typeof gsPossessDeny === 'function')
    ? (gsPossessDeny(r.target, r.playerId) || true)      // v5: ambient denied too
    : (gsIsPossessable(r.target, r.playerId)
       ? true : (GS_CORE_CAST[r.target] ? 'possession_ban' : 'not_your_character')),
  activate: gsFxPossessOn, deactivate: gsFxPossessOff,
  claims: (r) => [{ cls: 'char', res: 'char:' + r.target }],
});
gsDefineAction('weather', {
  scope: 'global', exclusive: true, ratePerMin: 6,
  minMin: 10, maxMin: 240, cdPlayerMin: 120, cdGlobalMin: 60, ttlMin: 60,
  effect: 'maintained',
  allow: (r) => (r.params && GS_WX_KINDS[r.params.wx]) ? true : 'bad_weather',
  activate: gsFxWxOn, deactivate: gsFxWxOff,
  claims: (r) => {
    const k = GS_WX_KINDS[r.params && r.params.wx];
    return [{ cls: 'sky', res: 'sky', severe: k && k.severe ? 1 : 0 }];
  },
});
gsDefineAction('street_event', {
  scope: 'global', exclusive: false, ratePerMin: 5,
  minMin: 15, maxMin: 180, cdPlayerMin: 240, ttlMin: 120,
  effect: 'maintained',
  allow: (r) => (r.params && GS_EVENT_KINDS[r.params.event]) ? true : 'bad_event',
  activate: gsFxEventOn, deactivate: gsFxEventOff,
  claims: (r) => {
    const meta = GS_EVENT_KINDS[(r.params && r.params.event)] || {};
    const at = gsNormVenue(r.params && r.params.at);
    const out = meta.outdoor ? 1 : 0;
    /* a venue event with a named location takes the permit for that
       spot; a roving or unlocated event claims no venue but still flags
       outdoor so severe weather can't stomp it either. */
    if(meta.venue && at)
      return [{ cls: 'venue', res: 'venue:' + at, outdoor: out }];
    return [{ cls: 'openair', outdoor: out, excl: false,
              res: 'openair:' + r.playerId + ':' + (r.params && r.params.event) }];
  },
});
gsDefineAction('hire', {
  scope: 'target', exclusive: true, ratePerMin: 30,
  minMin: 5, maxMin: 5, cdPlayerMin: 1440, ttlMin: 30,
  effect: 'once',
  allow: (r) => {
    if(!r.target) return 'needs_housing';        // design §6: housing required
    const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
    if(!u) return 'unknown_unit';
    if(!gsUnitLivable(u)) return 'unit_not_livable';
    const hb = gsBldById(u.bld_id);              // hired cast live on-map
    if(hb && hb.offmap) return 'unit_offmap';
    if(gsActiveLease(u.id)) return 'unit_occupied';
    if(gsHiredCount(r.playerId) >= GS_MAX_HIRED_PER_PLAYER) return 'hire_cap';
    if(Object.keys(GS_HIRED).length >= GS_MAX_HIRED_TOTAL) return 'cast_cap';
    return true;
  },
  activate: gsFxHire,
  /* the unit's paperwork serializes — a buy escrow or another hire on
     the same unit waits its turn, like real title work */
  claims: (r) => [{ cls: 'paper', res: 'paper:' + r.target }],
});
gsDefineAction('listing', {
  scope: 'target', exclusive: true, ratePerMin: 1,
  minMin: 30, maxMin: 4320, ttlMin: 60,
  effect: 'maintained',
  allow: (r) => {
    const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
    if(!u) return 'unknown_unit';
    if(!gsUnitLivable(u)) return 'unit_not_livable';
    const b = gsBldById(u.bld_id);
    if(b && b.offmap) return 'unit_offmap';      // listings are on-map stock
    const owner = u.owner_id || (b && b.owner_id);
    if(owner !== r.playerId && !(gsIsAdmin(r.playerId) && owner === 'landlord'))
      return 'not_owner';
    if(GS_LISTINGS[u.id]) return 'already_listed';
    return true;
  },
  activate: gsFxListOn, deactivate: gsFxListOff,
  claims: (r) => [{ cls: 'listing', res: 'listing:' + r.target }],
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
  claims: (r) => [{ cls: 'paper', res: 'paper:' + r.target }],
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

/* ================= v2: THE CONFLICT MATRIX =================
   The permit-office model: every request declares claims
   {cls, res, ...}; two live requests conflict iff ANY claim pair
   clashes. Classes in play:
     char    'char:H3'        — one driver per body
     sky     'sky'            — one forecast; IDENTICAL forecasts may
                                co-sponsor (only contradictory weather
                                is exclusive — design §5)
     venue   'venue:<place>'  — one permitted event per location
     openair                  — roving / city-assigned events; never
                                block each other, still flag outdoor
     paper   'paper:<unit>'   — one registry change per unit at a time
     listing 'listing:<unit>' — one live listing per unit           */
function gsNormVenue(at){
  return (at == null) ? '' :
    String(at).trim().toLowerCase().replace(/\s+/g, ' ');
}
function gsClaimsOf(r){
  const a = GS_REQ.actions[r.kind];
  if(a && a.claims){
    try{ return a.claims(r) || []; }catch(e){ return []; }
  }
  /* catalogue entries without claims() fall back to the v1 model: the
     primary resource key, exclusive iff the action is */
  return [{ cls: 'res', res: gsResourceKey(r.kind, r.target),
            excl: !a || a.exclusive !== false }];
}
/* one claim pair, both requests for context (the sky cares WHICH
   forecast, events care whether they're outdoors) */
function gsClaimClash(ca, ra, cb, rb){
  if(ca.cls === cb.cls){
    if(ca.res !== cb.res) return false;
    if(ca.excl === false && cb.excl === false) return false; // two sharers
    if(ca.cls === 'sky' &&
       (ra.params || {}).wx === (rb.params || {}).wx)
      return false;                      // identical forecast co-sponsors
    return true;
  }
  /* severe weather may not run over a permitted outdoor event — and the
     city does not issue outdoor permits into a storm hold */
  const skyVsEvent = (sk, ev) =>
    (sk.cls === 'sky' && (ev.cls === 'venue' || ev.cls === 'openair'))
      ? !!(sk.severe && ev.outdoor) : null;
  const s1 = skyVsEvent(ca, cb); if(s1 !== null) return s1;
  const s2 = skyVsEvent(cb, ca); if(s2 !== null) return s2;
  return false;
}
function gsRequestsConflict(ra, rb){
  if(ra === rb || (ra.id && rb.id && ra.id === rb.id)) return false;
  const A = gsClaimsOf(ra), B = gsClaimsOf(rb);
  for(const ca of A) for(const cb of B)
    if(gsClaimClash(ca, ra, cb, rb)) return true;
  return false;
}
/* live requests filed BEFORE r that clash with it — its blockers.
   FCFS-fair: a request may never activate while an earlier live request
   it clashes with is still in line or running, so no leapfrogging and
   no starvation (every blocker has a hard endMin cap). A not-yet-filed
   candidate passes n:Infinity — everything live is earlier. */
function gsFindBlockers(r){
  const n = (r.n != null) ? r.n : Infinity;
  return GS_REQ.reqs.filter(x => x.n < n &&
    (x.status === 'active' || x.status === 'queued') &&
    gsRequestsConflict(x, r));
}
/* the clashing claim resources on r's side — for feed/viewer display */
function gsLiveClashes(r){
  const seen = {};
  for(const b of gsFindBlockers(r))
    for(const ca of gsClaimsOf(r)) for(const cb of gsClaimsOf(b))
      if(gsClaimClash(ca, r, cb, b)) seen[ca.res] = 1;
  return Object.keys(seen);
}
function gsClaimLabel(res){
  if(res === 'sky') return 'the sky';
  let m = res.match(/^venue:(.+)$/);   if(m) return m[1] + ' (permitted venue)';
  m = res.match(/^char:(.+)$/);       if(m) return 'character ' + m[1];
  m = res.match(/^paper:(.+)$/);      if(m) return 'registry paperwork on ' + m[1];
  m = res.match(/^listing:(.+)$/);    if(m) return 'the listing on ' + m[1];
  m = res.match(/^openair:(.+)$/);    if(m) return 'the open air (event permit)';
  return res;
}
/* plain-English why-is-this-waiting, for the feed UI / debug panel */
function gsExplainRequest(id){
  const r = gsRequestById(id);
  if(!r) return null;
  const o = { id: r.id, kind: r.kind, player: r.playerId, status: r.status };
  if(r.status === 'queued'){
    const act = [], line = [];
    for(const b of gsFindBlockers(r))
      (b.status === 'active' ? act : line).push(b.id);
    o.blockedBy = act; o.behind = line;
    o.on = gsLiveClashes(r).map(gsClaimLabel);
    o.queuePos = gsQueuePosition(id);
    o.note = act.length
      ? 'waiting for ' + act.join(', ') + ' to finish (' + o.on.join('; ') + ')'
      : 'in line behind ' + line.join(', ');
  } else if(r.status === 'in_review'){
    o.code = r.screen || null;
    o.note = 'awaiting human review' + (o.code ? ' (' + o.code + ')' : '');
  } else if(r.status === 'active'){
    o.note = 'running';
  } else {
    const why = r.reason || r.failReason;
    o.note = r.status + (why ? ': ' + why : '');
  }
  return o;
}
/* the rule table, readable — viewers and devs can ask why the matrix
   decided what it did */
function gsConflictRules(){
  return [
    'char — one driver per body: possession is exclusive per character',
    'sky — one forecast at a time; identical forecasts co-sponsor the same sky',
    'sky × outdoor event — severe weather never runs over a permitted ' +
      'outdoor event, and no outdoor permits are issued into a storm hold',
    'venue — one permitted event per location at a time',
    'paper — one registry change per unit at a time (hire and buy serialize)',
    'listing — one live listing per unit',
    'queued requests are never leapfrogged by later conflicting requests',
  ];
}
/* co-possession overlaps between DIFFERENT players — the compatible-
   multiplayer sessions currently live in the world */
function gsCoSessions(){
  const act = Object.keys(GS_POSSESS).map(c => ({
    char: c, player: GS_POSSESS[c].playerId,
    sinceMin: GS_POSSESS[c].sinceMin }));
  const pairs = [];
  for(let i = 0; i < act.length; i++)
    for(let j = i + 1; j < act.length; j++)
      if(act[i].player !== act[j].player) pairs.push({ a: act[i], b: act[j] });
  return pairs;
}

/* 1-based position among the queued requests it conflicts with, 0 when
   not queued — your place in line can never grow, only shrink */
function gsQueuePosition(id){
  const r = gsRequestById(id);
  if(!r || r.status !== 'queued') return 0;
  let ahead = 0;
  for(const x of GS_REQ.reqs)
    if(x.n < r.n && x.status === 'queued' && gsRequestsConflict(x, r))
      ahead++;
  return ahead + 1;
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
/* promotion (v2): scan the WHOLE queue in submission order — conflicts
   are pairwise, so a freed resource can unblock requests on several
   resource keys at once, and a later request may activate only when no
   earlier live request clashes with it (no leapfrog = no starvation).
   The world may have changed while a request waited — re-run allow();
   a stale request fails with a full refund and the scan moves on. */
function gsPromoteAll(now){
  const q = GS_REQ.reqs.filter(r => r.status === 'queued')
    .sort((a, b) => a.submittedMin - b.submittedMin || a.n - b.n);
  for(const next of q){
    if(next.status !== 'queued') continue;       // resolved earlier in scan
    if(next.expireMin != null && now > next.expireMin){
      next.status = 'expired'; next._now = now;  // TTL lapsed: refund,
      if(next.billed > 0){ gsCreditRefund(next.playerId, next.billed,
                                           'queue expired');   // don't run
                           next.refunded = next.billed; }       // a dead request
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
    if(gsFindBlockers(next).length) continue;    // still blocked — hold the line
    next.status = 'active'; next.startMin = now;
    next.endMin = now + next.durationMin; next.expireMin = null;
    next._now = now;
    gsBusEmit('approve', next, { promoted: true, price: next.price });
    if(!gsFxActivate(next, now)) continue;       // activation failed: next
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
  /* v5 intent screen (design §11.3/§11.4): classify the request's own
     text before any billing — a denied intent never moves credits.
     Review-tier hits park the request in_review for a human resolution
     (GS_REVIEW_TTL_MIN, then auto-refund). Admin filings are screened too
     — the legal backstop binds the owner — but never parked: the owner IS
     the reviewer, so a review hit on an admin request is just recorded. */
  var screened = null;
  if(typeof gsIntentScreen === 'function'){
    const scr = gsIntentScreen({ playerId: pid, kind, target, params,
      note: spec.note, appeal_of: spec.appeal_of, now });
    if(scr && scr.verdict === 'deny'){
      const dr = deny(scr.code);
      dr.screenDenied = scr.code;      // content denials feed repeat-pattern
      return dr;
    }
    if(scr && scr.verdict === 'review') screened = scr;
  }
  if(a.allow){ const why = a.allow({ playerId: pid, target, kind, params });
               if(why !== true) return deny(why); }
  if((GS_REQ.cdP[pid + '|' + kind] || 0) > now) return deny('cooldown');
  if((GS_REQ.cdG[kind] || 0) > now) return deny('global_cooldown');

  const resKey = gsResourceKey(kind, target);
  const price = Math.ceil(a.ratePerMin * dur * gsSurgeFactor(resKey));
  /* admin ('owner'/'admin') files free — the owner exercises power through
     admin tools (design §3), never buys it back from themselves. Admin
     requests join the same FCFS line as everyone else's — the override
     mechanism is the revoke switch, not queue privilege. */
  if(price > 0 && !gsIsAdmin(pid) &&
     !gsCreditSpend(pid, price, kind + ' request'))
    return deny('insufficient_credits');

  /* v2 pairwise conflicts: the request queues iff ANY earlier live
     request (active or queued) clashes with one of its claims — a
     queued blocker counts too, so nobody leapfrogs the line. */
  const cand = { playerId: pid, kind, target, params, n: Infinity };
  const claims = gsClaimsOf(cand);
  const blockers = gsFindBlockers(cand);
  const conflict = blockers.length > 0;
  const parked = screened && !gsIsAdmin(pid);
  const r = { id: 'req-' + (++GS_REQ.seq), n: GS_REQ.seq, playerId: pid,
    kind, target, durationMin: dur, params, price, resKey, claims,
    billed: gsIsAdmin(pid) ? 0 : price,
    rateApplied: dur > 0 ? price / dur : 0,
    submittedMin: now, status: conflict ? 'queued' : 'active',
    startMin: conflict ? null : now,
    endMin: conflict ? null : now + dur,
    expireMin: conflict ? now + a.ttlMin : null,
    usedMin: 0, refunded: 0, fxOn: false, _now: now };
  if(screened) r.screen = screened.code;
  if(parked){
    /* review tier: billed upfront like any queued request, but it never
       enters the line — gsReviewResolve (or the TTL lapse) decides.
       Claims are re-evaluated at approval; the world may have moved. */
    r.status = 'in_review'; r.startMin = null; r.endMin = null;
    r.expireMin = null;
    r.reviewExpireMin = now + GS_REVIEW_TTL_MIN;
  }
  GS_REQ.reqs.push(r);
  if(parked){
    gsBusEmit('review', r, { action: 'in_review', code: screened.code,
      price, expiresInMin: GS_REVIEW_TTL_MIN });
    return r;
  }
  if(conflict){
    r.queuedBehind = blockers.map(b => b.id);
    gsBusEmit('queue', r, { price, pos: gsQueuePosition(r.id),
      blockedBy: r.queuedBehind.slice(), on: gsLiveClashes(cand) });
  } else {
    gsBusEmit('approve', r, { price });
    if(gsFxActivate(r, now) && gsLowCredit(pid))
      gsBusEmit('warn', r, { low_credits: true,
                             balance: gsCreditBalance(pid) });
  }
  return r;
}

/* advance the bus: complete finished actives (set cooldowns), expire
   stale queued requests with a full auto-refund, then run ONE global
   FCFS promotion scan — pairwise conflicts mean a single freed resource
   can unblock several queues at once. */
function gsBusTick(nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  for(const r of GS_REQ.reqs.slice()){
    /* an unreviewed request lapses out of the lane with a full refund —
       it never ran, so it never should have kept the money */
    if(r.status === 'in_review' && r.reviewExpireMin != null &&
       now > r.reviewExpireMin){
      r.status = 'expired'; r._now = now; r.reason = 'review_lapsed';
      if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed,
                                       'review lapsed');
                        r.refunded = r.billed; }
      gsBusEmit('expire', r, { refund: r.billed, via: 'review' });
      continue;
    }
    if(r.status === 'queued' && r.expireMin != null && now > r.expireMin){
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
    }
  }
  gsPromoteAll(now);
  /* v5: wind-down warnings + the orphan sweep ride the same bus beat */
  if(typeof gsPossessTick === 'function') gsPossessTick(now);
  /* v6: the wire's honest-empty marker rides the same beat */
  if(typeof gsWireTick === 'function') gsWireTick(now);
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
  if(!r || (r.status !== 'queued' && r.status !== 'active' &&
            r.status !== 'in_review')) return false;
  const isAdmin = (by === 'admin' || by === 'owner');
  let refund;
  /* queued or still-parked requests never ran — the full bill comes back */
  if(r.status === 'queued' || r.status === 'in_review' || isAdmin){
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
  /* v2 fix: freeing a resource (or a queue slot, when a queued request
     is cancelled) must promote — v1 waited for a natural completion and
     could let a queued request expire while its resource sat idle.
     This is also what makes possession handoff instant. */
  gsPromoteAll(now);
  return true;
}

/* owner revoke switch (design §8): full compensation + a public admin
   line on the feed, so the override is transparent to every viewer. */
function gsAdminRevoke(id, reason, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const r = gsRequestById(id);
  if(!r || (r.status !== 'queued' && r.status !== 'active' &&
            r.status !== 'in_review')) return false;
  gsBusEmit('admin', { playerId: 'owner', kind: 'admin', id: null, _now: now },
            { action: 'revoke', target: id, reason: reason || 'revoked',
              compensated_cr: r.billed });
  return gsCancelRequest(id, now, 'admin');
}

/* ---- the review lane (design §11.4): gray-zone intent hits park in
   'in_review' until a human resolves them. gsReviewResolve is the
   reviewer's door — approve enters the line AT APPROVAL TIME (a fresh
   sequence number, so a parked request can't leapfrog requests filed
   while it waited) and re-runs standing validity, since the world may
   have moved under it; deny refunds in full. Both land on the feed. */
function gsReviewQueue(){
  return GS_REQ.reqs.filter(r => r.status === 'in_review');
}
function gsReviewResolve(id, approve, opts){
  opts = opts || {};
  const now = (opts.nowMin != null) ? opts.nowMin : gsNowMin();
  const r = gsRequestById(id);
  if(!r || r.status !== 'in_review') return null;
  gsBusEmit('review', r, { action: approve ? 'approved' : 'denied',
    code: opts.code || r.screen || null, by: opts.by || 'reviewer' });
  r._now = now;
  if(!approve){
    r.status = 'denied';
    r.reason = opts.code || 'review_denied';
    r.screenDenied = r.reason;         // a reviewer denial is a content denial
    if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed, 'review denied');
                    r.refunded = r.billed; }
    gsBusEmit('deny', r, { reason: r.reason, via: 'review',
                           refund: r.billed });
    return r;
  }
  /* approval = entering the line NOW: fresh sequence (no leapfrog of
     requests filed while it parked) and a fresh queue TTL. */
  r.n = ++GS_REQ.seq;
  r.reviewedMin = now;
  const a = GS_REQ.actions[r.kind];
  if(a && a.allow){
    const why = a.allow({ playerId: r.playerId, target: r.target,
                          kind: r.kind, params: r.params });
    if(why !== true){
      r.status = 'failed'; r.failReason = why;
      if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed,
                                       'conditions changed');
                      r.refunded = r.billed; }
      gsBusEmit('fail', r, { reason: why, refund: r.billed, stale: true });
      return r;
    }
  }
  const blockers = gsFindBlockers(r);
  if(blockers.length){
    r.status = 'queued';
    r.expireMin = now + (a.ttlMin || 60);
    r.queuedBehind = blockers.map(b => b.id);
    gsBusEmit('queue', r, { price: r.price, pos: gsQueuePosition(r.id),
      blockedBy: r.queuedBehind.slice(), on: gsLiveClashes(r),
      reviewed: true });
    return r;
  }
  r.status = 'active'; r.startMin = now;
  r.endMin = now + r.durationMin; r.expireMin = null;
  gsBusEmit('approve', r, { price: r.price, reviewed: true });
  gsFxActivate(r, now);
  return r;
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
  if(r.status === 'queued'){
    m.queuePos = gsQueuePosition(id);
    m.blockedBy = gsFindBlockers(r)
      .filter(b => b.status === 'active').map(b => b.id);
    m.on = gsLiveClashes(r).map(gsClaimLabel);
  }
  if(r.status === 'in_review'){
    m.reviewCode = r.screen || null;
    m.reviewExpiresInMin = r.reviewExpireMin != null
      ? +(r.reviewExpireMin - now).toFixed(1) : null;
  }
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
      blockedBy: gsFindBlockers(r)
        .filter(b => b.status === 'active').map(b => b.id),
    });
  }
  return {
    nowMin: now,
    /* v6: the public feed surface is THE WIRE — formatted, display-safe
       entries (world/feed.json schema). feedRaw keeps the raw lifecycle
       rows for the console/debug; nothing private reaches `feed`. */
    feed: (typeof gsWireTail === 'function') ? gsWireTail(50)
                                           : GS_FEED.slice(-50),
    feedRaw: GS_FEED.slice(-50),
    active: gsActiveSessions(now),
    queues,
    review: gsReviewQueue().map(r => ({ id: r.id, player: r.playerId,
      kind: r.kind, target: r.target, code: r.screen || null,
      expiresInMin: r.reviewExpireMin != null
        ? +(r.reviewExpireMin - now).toFixed(1) : null })),
    driving: (typeof gsPossessDriving === 'function')
      ? gsPossessDriving(now) : [],
    listings: JSON.parse(JSON.stringify(GS_LISTINGS)),
    events: GS_EVENTS.map(e => Object.assign({}, e)),
    sessions: gsCoSessions(),
    weather: GS_WX_OVR.wx ? { wx: GS_WX_OVR.wx, untilMin: GS_WX_OVR.untilMin,
      sponsors: Object.keys(GS_WX_OVR.sponsors || {}).length } : null,
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
   v5's gsPossessBrief is the full packet (wallet, lease, routine, rules,
   audit); this stub remains the fallback shape if that module is absent. */
function gsPossessionBriefing(charId){
  if(typeof gsPossessBrief === 'function') return gsPossessBrief(charId);
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
    listings: GS_LISTINGS, wxOvr: GS_WX_OVR, fxSeq: GS_FX_SEQ.n,
    plog: (typeof gsPossessSnapshot === 'function')
          ? gsPossessSnapshot() : null,             // v5 driving record
    wire: (typeof gsWireSnapshot === 'function')
          ? gsWireSnapshot() : null });             // v6 formatted feed
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
    /* legacy snapshots predate sky sponsors — rebuild the sponsor map
       from the single-reqId override so deactivation still balances */
    if(GS_WX_OVR.wx &&
       (!GS_WX_OVR.sponsors || !Object.keys(GS_WX_OVR.sponsors).length))
      GS_WX_OVR.sponsors = GS_WX_OVR.reqId
        ? { [GS_WX_OVR.reqId]: GS_WX_OVR.untilMin } : {};
    GS_FX_SEQ.n = d.fxSeq || 0;
    if(typeof gsPossessLoad === 'function') gsPossessLoad(d.plog);
    /* v6: restore the formatted wire verbatim; a snapshot without one
       leaves the cursor at 0 and the wire rebuilds from the feed */
    if(typeof gsWireLoad === 'function') gsWireLoad(d.wire);
    /* v5: hired cast are world residents — any whose body is missing
       walks back on stage before we re-assert possession on them */
    if(typeof gsSpawnHired === 'function')
      for(const cid in GS_HIRED) gsSpawnHired(cid);
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
  /* v5: reset removes hired bodies too — a reset world has exactly the
     cast it started with (the pawn is despawned, its _ci tombstoned) */
  if(typeof gsDespawnHired === 'function' && typeof VILLAGERS !== 'undefined')
    for(const v of VILLAGERS.slice())
      if(v.gsHired) gsDespawnHired(v._castId);
  for(const k in GS_HIRED) delete GS_HIRED[k];
  for(const k in GS_POSSESS) delete GS_POSSESS[k];
  GS_EVENTS.length = 0;
  for(const k in GS_LISTINGS) delete GS_LISTINGS[k];
  GS_WX_OVR.wx = null; GS_WX_OVR.untilMin = 0; GS_WX_OVR.reqId = null;
  GS_WX_OVR.baseHum = null; GS_WX_OVR.sponsors = {};
  GS_FX_SEQ.n = 0;
  if(typeof gsPossessReset === 'function') gsPossessReset();
  if(typeof gsWireReset === 'function') gsWireReset();       // v6
}

/* ---- bridge surface (read-only viewer API + request filing) ---- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.gsSubmitRequest = (spec) => gsSubmitRequest(spec);
  window.__aiBridge.gsCancelRequest = (id) => gsCancelRequest(id, null, 'player');
  window.__aiBridge.gsViewerState = () => gsViewerState();
  window.__aiBridge.gsRequestMeter = (id) => gsRequestMeter(id);
  window.__aiBridge.gsQueuePosition = (id) => gsQueuePosition(id);
  window.__aiBridge.gsPossessionBriefing = (cid) => gsPossessionBriefing(cid);
  window.__aiBridge.gsExplainRequest = (id) => gsExplainRequest(id);
  window.__aiBridge.gsConflictRules = () => gsConflictRules();
  window.__aiBridge.gsCoSessions = () => gsCoSessions();
  window.__aiBridge.gsReviewQueue = () => gsReviewQueue();
  window.__aiBridge.gsReviewResolve = (id, approve, opts) =>
    gsReviewResolve(id, approve, opts);
}
