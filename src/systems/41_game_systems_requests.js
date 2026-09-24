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

   v14: THE BOOK — scheduled exclusives (world/bookings.json, v74).
   An exclusive-class request may name WHEN it runs, not just WHAT:
   - Bookable kinds: weather + street_event. Sessions (possess/camera)
     stay now-or-queued; paperwork (hire/listing/buy) stays paperwork.
   - spec.start_slot (minutes-from-now, the world contract) or
     spec.startMin (absolute) declare the window. The start snaps UP to
     the next half-hour slot; the book's horizon is the next 24 h.
   - A time slot is not an upgrade: same price math; surge keys off the
     WINDOW's local hour, shown in the quote before payment.
   - A cleared booking lands on the public calendar (status 'booked')
     and fires when the window arrives — already approved by then.
     Cancel before the start refunds in full; after it, the live
     exclusive refunds whole unused minutes.
   - The book never skips cooldowns: a window opening inside a venue
     rest or a sky/player cooldown tail is refused at the door — the
     picker can't offer a slot that can't legally fire.
   - FCFS, never auctioned: an overlapping ask queues, and a queued
     booking that reaches the front with its window taken slides to the
     soonest free slot (or refunds in full past the horizon).
   - The running lock always wins — a live exclusive can't be booked
     over; and a booked span is honored the other way too: a queued
     request that would run into it either fits before it (clipped,
     difference refunded) or waits for after it.

   v15: THE MUNICIPAL CODE — conflicts grow a second dimension (see
   41_game_systems_civic.js for the civic state; this file carries the
   matrix math it hooks into):
   - Venue claims may carry ZONES — 'venue:<place>@<zone>' occupies a
     named area of a subdividable venue (the table lives in 41P); two
     permits at the same place clash only when their areas touch
     (gsVenueResTouch: same zone, or either side the whole place).
   - Amplified event kinds claim the place's airspace 'noise:<place>'
     on top of their ground — the noise floor clashes with EVERY venue
     claim there — and rest 22:00-06:00 PT (the noise ordinance); the
     door, the picker, and promotion all enforce the same clock.
   - Co-hosting: two identical events on touching ground at overlapping
     times are one party with two permits — the claims don't clash and
     the event lives till its last sponsor's window ends.
   - City holds (41P): an admin-declared closure on any claim res beats
     every request — bumps live claims with full compensation at
     declaration, denies overlapping filings 'city_hold', and holds
     queued/booked requests until it lifts or they slide past it.
   - The clerk answers honestly: gsReqOutlook gives any request its
     not-before estimate; gsPriceQuote denies with 'alts' — the soonest
     legal slots — and queues with an earliest-start estimate.

   RATE CARD (design §9.3 — honest pricing tracks real compute cost):
     possess      4 cr/min — interactive session relay; the character's
                   LLM brain is SUSPENDED while possessed, so compute cost
                   is low — most of the price is exclusivity on one body.
     weather      6 cr/min — no inference at all; priced for being a
                   world-scale exclusive resource every viewer sees.
     street_event 5 cr/min — perturbs ~20 thin-AI ambient schedules
                   (cheap reflex recompute, no LLM calls).
     hire       500 cr flat (fixed 5-min processing) — creates a character
                   with a standing full-brain compute budget + a lease.
                   requests.json: billing 'flat', billed ONCE after
                   screening passes — a parked (named) hire defers the
                   charge to approval; denied applications never bill.
     rehouse    150 cr flat — the eviction loop's humane end: re-door a
                   hired character who lost their home (v8).
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
  cdClaim: {},       // claim res    -> cooldown-until ("one per resource /24h")
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
   sky — severe weather may not run over a permitted outdoor event.
   v15 flags: amplified = the permit carries amplified sound — it claims
   the place's noise floor AND rests 22:00-06:00 PT (the ordinance in
   41P); zoned = the permit may name an area of a zoned venue instead of
   the whole place. */
const GS_EVENT_KINDS = {
  block_party:     { outdoor: 1, venue: 1, amplified: 1 },
  street_fair:     { outdoor: 1, venue: 1, amplified: 1 },
  parade:          { outdoor: 1, venue: 1, amplified: 1 },
  movie_night:     { outdoor: 1, venue: 1, amplified: 1, zoned: 1 },
  farmers_market:  { outdoor: 1, venue: 1 },
  park_cleanup:    { outdoor: 1, venue: 1, zoned: 1 },
  fitness_class:   { outdoor: 1, venue: 1, zoned: 1 },
  mural_tour:      { outdoor: 1, venue: 0 },
};
function gsFxEventOn(r, now){
  const kind = r.params && r.params.event;
  if(!GS_EVENT_KINDS[kind]) return { ok: false, reason: 'bad_event' };
  const at = (r.params && r.params.at) || null;
  const claims = gsClaimsOf(r);
  const res = (claims[0] && claims[0].cls === 'venue')
    ? claims[0].res : null;
  /* v15 co-hosting: an identical live event on touching ground absorbs
     this permit as a second sponsor — one party, two names on the
     paper. The event lives until its LAST sponsor's window ends (the
     sky's own rule), and the wire prints the join. */
  if(res && typeof gsVenueResTouch === 'function'){
    const host = GS_EVENTS.find(e => e.event === kind && e.atRes &&
      gsVenueResTouch(e.atRes, res));
    if(host){
      (host.sponsors = host.sponsors || {})[r.id] =
        { endMin: r.endMin, playerId: r.playerId };
      host.untilMin = Math.max.apply(null,
        Object.keys(host.sponsors).map(k => host.sponsors[k].endMin));
      host.reqId = r.id;
      host.co = Object.keys(host.sponsors).length;
      gsBusEmit('cohost', r, { event: kind, at: at, co: host.co });
      return true;
    }
  }
  const rec = { id: 'evt-' + (++GS_FX_SEQ.n), event: kind, at: at,
    atRes: res, sinceMin: now, untilMin: r.endMin,
    reqId: r.id, playerId: r.playerId, co: 1 };
  (rec.sponsors = {})[r.id] = { endMin: r.endMin, playerId: r.playerId };
  GS_EVENTS.push(rec);
  return true;
}
function gsFxEventOff(r){
  const i = GS_EVENTS.findIndex(e => e.reqId === r.id ||
    (e.sponsors && e.sponsors[r.id]));
  if(i < 0) return;
  const ev = GS_EVENTS[i];
  if(ev.sponsors && ev.sponsors[r.id]){
    delete ev.sponsors[r.id];
    const left = Object.keys(ev.sponsors);
    if(left.length){
      /* the party outlives any one sponsor — the remaining permits
         carry it until their own windows end */
      ev.untilMin = Math.max.apply(null,
        left.map(k => ev.sponsors[k].endMin));
      ev.reqId = left[left.length - 1];
      ev.co = left.length;
      return;
    }
  }
  GS_EVENTS.splice(i, 1);
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
  /* v10: building-scope cards live in the deed office's own map */
  if(typeof gsListingOff === 'function') gsListingOff(r);
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
  minMin: 10, maxMin: 240, cdPlayerMin: 240, cdGlobalMin: 240, ttlMin: 60,
  /* v7: weather is the contract's 'exclusive' class — every sky change
     parks for a human before it runs (requests.json classes.exclusive
     + moderation.json exclusive lane). cooldowns are the contract's
     4-hour exclusive cooldown; the sky itself rests 4h (spec range 4-8). */
  review: 'always',
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
  /* v7: event permits are exclusive-class too (requests.json) — human
     review before activation — and a venue that ran an event rests 24h:
     "one event per resource per 24h" is a claim-level cooldown stamped
     when the permit activates, refused by allow() at file + promotion. */
  review: 'always', cdClaimMin: 1440,
  effect: 'maintained',
  allow: (r, now) => {
    if(!(r.params && GS_EVENT_KINDS[r.params.event])) return 'bad_event';
    const meta = GS_EVENT_KINDS[r.params.event];
    const nowM = (now != null) ? now : gsNowMin();
    /* v15: the permit names real ground — a zone the venue doesn't have
       (or a zone on a whole-venue kind) is a structural deny, never
       billed */
    const parsed = (typeof gsVenueZoneParse === 'function')
      ? gsVenueZoneParse(r) : { place: gsNormVenue(r.params.at) };
    if(parsed.err) return parsed.err;
    /* v14: a booking's venue-rest check keys off the WINDOW start, not
       filing time — the permit office stamps the slot it will use */
    const atMin = (r.bookedStart != null) ? r.bookedStart : nowM;
    /* v15: the noise ordinance — amplified permits rest 22:00-06:00 PT.
       The check keys off the whole window the filing would run, so a
       loud event ending exactly at 22:00 is legal and one minute over
       is not. */
    if(meta.amplified && typeof gsQuietOverlap === 'function' &&
       gsQuietOverlap(atMin, atMin + (r.durationMin || 0)))
      return 'quiet_hours';
    /* v15: venue rest is zone-aware — a resting lawn refuses its own
       zone and whole-venue filings; a resting venue refuses every zone.
       The one exemption is the live identical event this filing would
       co-host (its ground stays open to its own party). */
    if(meta.venue && parsed.place){
      const res = 'venue:' + parsed.place +
                  (parsed.zone ? '@' + parsed.zone : '');
      if(gsVenueRestAt(res, atMin) &&
         !(typeof gsCoSponsorLive === 'function' &&
           gsCoSponsorLive(r, nowM)))
        return 'venue_rest';
    }
    return true;
  },
  activate: gsFxEventOn, deactivate: gsFxEventOff,
  claims: (r) => {
    /* v15: the municipal module writes the real claims — zones on the
       venue res, a noise floor for amplified kinds */
    if(typeof gsEventClaims === 'function') return gsEventClaims(r);
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
  scope: 'target', exclusive: true, ratePerMin: 100,
  minMin: 5, maxMin: 5, cdPlayerMin: 1440, ttlMin: 30,
  /* v8: flat 500cr billed AFTER screening (requests.json billing 'flat'
     + creation.json "denied applications never bill") — a parked hire
     defers the charge to approval; gsReviewResolve collects it there.
     The personnel office (41_game_systems_hiring.js) owns validation +
     activation; the fallbacks keep a module-less build legal. */
  billOnApproval: true,
  effect: 'once',
  allow: (r, now) => (typeof gsHireAllow === 'function')
    ? gsHireAllow(r, now)
    : (() => {
        if(!r.target) return 'needs_housing';
        const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
        if(!u) return 'unknown_unit';
        if(!gsUnitLivable(u)) return 'unit_not_livable';
        const hb = gsBldById(u.bld_id);
        if(hb && hb.offmap) return 'unit_offmap';
        if(gsActiveLease(u.id)) return 'unit_occupied';
        if(gsHiredCount(r.playerId) >= GS_MAX_HIRED_PER_PLAYER) return 'hire_cap';
        if(Object.keys(GS_HIRED).length >= GS_MAX_HIRED_TOTAL) return 'cast_cap';
        return true;
      })(),
  activate: (r, now) => (typeof gsHireActivate === 'function')
    ? gsHireActivate(r, now) : gsFxHire(r, now),
  /* the unit's paperwork serializes — a buy escrow or another hire on
     the same unit waits its turn, like real title work */
  claims: (r) => [{ cls: 'paper', res: 'paper:' + r.target }],
});
gsDefineAction('listing', {
  scope: 'target', exclusive: true, ratePerMin: 1,
  minMin: 30, maxMin: 4320, ttlMin: 60,
  effect: 'maintained',
  /* v10: the deed office (41J) owns listing validation — sale AND rent
     cards, quiet pocket listings, and whole-building filings. The
     fallback keeps a module-less build legal (sale-only, unit-only). */
  allow: (r, now) => (typeof gsListingAllow === 'function')
    ? gsListingAllow(r, now)
    : (() => {
        const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
        if(!u) return 'unknown_unit';
        if(!gsUnitLivable(u)) return 'unit_not_livable';
        const b = gsBldById(u.bld_id);
        if(b && b.offmap) return 'unit_offmap'; // listings are on-map stock
        const owner = u.owner_id || (b && b.owner_id);
        if(owner !== r.playerId &&
           !(gsIsAdmin(r.playerId) && owner === 'landlord'))
          return 'not_owner';
        if(GS_LISTINGS[u.id]) return 'already_listed';
        return true;
      })(),
  activate: (r, now) => (typeof gsListingActivate === 'function')
    ? gsListingActivate(r, now) : gsFxListOn(r, now),
  deactivate: gsFxListOff,
  claims: (r) => [{ cls: 'listing', res: 'listing:' + r.target }],
});
gsDefineAction('buy', {
  scope: 'target', exclusive: true, ratePerMin: 25,
  minMin: 1, maxMin: 1, ttlMin: 15,
  effect: 'once',
  /* v10: the deed office runs the escrow — offer at asking (no
     bidding), deed fee in credits, seller-carried financing when the
     card offers it, title written as owner_id (never a lease). The
     fallback is the v1 cash path. */
  allow: (r, now) => (typeof gsBuyAllow === 'function')
    ? gsBuyAllow(r, now)
    : (() => {
        const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
        if(!u) return 'unknown_unit';
        const l = GS_LISTINGS[u.id];
        if(!l) return 'not_listed';
        const buyer = r.params && r.params.buyerId;
        if(!buyer || gsHiredOwner(buyer) !== r.playerId)
          return 'buyer_not_hired';
        if(gsHiredOwner(buyer) === l.by) return 'self_deal';
        if(gsDollarBalance(buyer) < l.ask) return 'insufficient_dollars';
        return true;
      })(),
  activate: (r, now) => (typeof gsListingBuy === 'function')
    ? gsListingBuy(r, now) : gsFxBuy(r, now),
  claims: (r) => {
    /* a whole-building escrow touches every door's paperwork — it
       serializes against hires and buys on any member unit */
    const b = (typeof gsBldById === 'function') && gsBldById(r.target);
    if(b && !(typeof gsUnitById === 'function' && gsUnitById(r.target)))
      return b.units.map(u => ({ cls: 'paper', res: 'paper:' + u }))
           .concat([{ cls: 'paper', res: 'paper:' + b.id }]);
    return [{ cls: 'paper', res: 'paper:' + r.target }];
  },
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
/* v15: venue claims may name an AREA — 'venue:<place>@<zone>' occupies
   a named zone of a subdividable venue (the zone table lives in 41P;
   this is the pure res-string math the matrix runs on). 'noise:<place>'
   is the place's airspace — the amplified-sound claim a loud permit
   files alongside its ground. */
function gsVenueResParts(res){
  let m = /^venue:(.+?)(?:@(.+))?$/.exec(res);
  if(m) return { cls: 'venue', place: m[1], zone: m[2] || null };
  m = /^noise:(.+)$/.exec(res);
  if(m) return { cls: 'noise', place: m[1], zone: null };
  return null;
}
/* do two place claims share ground? Same place, and for venue claims
   same zone or either side the whole place; the noise floor is the
   place's airspace — an amplified permit fills it everywhere, so a
   noise claim touches EVERY claim on the place, zoned or whole (a
   loud party and a quiet cleanup can't share a lawn, or any lawn
   under the same permit office's sky). */
function gsVenueResTouch(a, b){
  const pa = gsVenueResParts(a), pb = gsVenueResParts(b);
  if(!pa || !pb || pa.place !== pb.place) return false;
  if(pa.cls === 'noise' || pb.cls === 'noise') return true;
  return !pa.zone || !pb.zone || pa.zone === pb.zone;
}
/* a venue res rests while ANY stamped rest key touches it — a zone's
   day off refuses the whole place too, the whole place's day off
   refuses every zone */
function gsVenueRestAt(res, atMin){
  for(const k in GS_REQ.cdClaim)
    if((GS_REQ.cdClaim[k] || 0) > atMin && gsVenueResTouch(k, res))
      return true;
  return false;
}
/* v15 co-hosting: two identical events sharing the same ground at
   overlapping times are one party with two permits — the sky's own
   co-sponsor rule extended to event permits. Each sponsor pays their
   own span; the event lives till the last sponsor ends. A same-kind
   filing for a NON-overlapping window is a new event — venue_rest
   judges it, not the matrix. */
function gsCoSponsor(ra, rb){
  return ra.kind === 'street_event' && rb.kind === 'street_event' &&
    !!(ra.params && rb.params && ra.params.event === rb.params.event);
}
/* the live identical event a filing would join — the venue_rest
   exemption: a running party's ground stays open to its own co-hosts */
function gsCoSponsorLive(r, now){
  if(r.kind !== 'street_event' || !r.params) return null;
  for(const x of GS_REQ.reqs){
    if(x.status !== 'active' || x === r || (r.id && x.id === r.id))
      continue;
    if(x.kind !== 'street_event' || !x.params ||
       x.params.event !== r.params.event) continue;
    let share = false;
    for(const ca of gsClaimsOf(r)) for(const cb of gsClaimsOf(x))
      if(ca.cls === 'venue' && cb.cls === 'venue' &&
         gsVenueResTouch(ca.res, cb.res)) share = true;
    if(!share) continue;
    if(gsWindowsOverlap(gsReqWindow(r, now), gsReqWindow(x, now)))
      return x;
  }
  return null;
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
   forecast, events care whether they're outdoors). v15 passes each
   request's window (wa/wb) so co-hosting can prove the two parties
   share ground at the same TIME — overlap shares, distance re-files. */
function gsClaimClash(ca, ra, cb, rb, wa, wb){
  /* v15 co-hosting: identical events on touching ground at overlapping
     times are one party — every claim pair shares, never clashes. */
  if(gsCoSponsor(ra, rb) && wa && wb && gsWindowsOverlap(wa, wb))
    return false;
  /* v15: two permits at the same place clash only when their areas
     touch — same zone, or either side claims the whole place */
  if(ca.cls === 'venue' && cb.cls === 'venue')
    return gsVenueResTouch(ca.res, cb.res);
  /* v15 the noise floor: an amplified permit fills the place's
     airspace — it clashes with EVERY venue claim on that ground,
     zoned or whole (a loud party and a quiet cleanup can't share a
     lawn, and a loud zone does reach the whole place's quiet) */
  if(ca.cls === 'noise' || cb.cls === 'noise'){
    const n = ca.cls === 'noise' ? ca : cb;
    const o = ca.cls === 'noise' ? cb : ca;
    if(o.cls !== 'venue' && o.cls !== 'noise') return false;
    return gsVenueResTouch(n.res, o.res);
  }
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
function gsRequestsConflict(ra, rb, now){
  if(ra === rb || (ra.id && rb.id && ra.id === rb.id)) return false;
  const A = gsClaimsOf(ra), B = gsClaimsOf(rb);
  /* v14/v15: bookings hold their claims for a DECLARED span and
     co-hosting judges overlap — compute both windows once so every
     claim pair judges the same clock */
  let wa = null, wb = null;
  let clash = false;
  for(const ca of A) for(const cb of B){
    if(!wa){
      if(now == null) now = gsNowMin();
      wa = gsReqWindow(ra, now); wb = gsReqWindow(rb, now);
    }
    if(gsClaimClash(ca, ra, cb, rb, wa, wb)){ clash = true; break; }
  }
  if(!clash) return false;
  if(ra.bookedStart != null || rb.bookedStart != null)
    return gsWindowsOverlap(wa, wb);
  return true;
}
/* live requests filed BEFORE r that clash with it — its blockers.
   FCFS-fair: a request may never activate while an earlier live request
   it clashes with is still in line or running, so no leapfrogging and
   no starvation (every blocker has a hard endMin cap). A not-yet-filed
   candidate passes n:Infinity — everything live is earlier. v14 adds
   'booked' to the live set: a calendar span is a real claim. */
function gsFindBlockers(r, now){
  const n = (r.n != null) ? r.n : Infinity;
  if(now == null) now = gsNowMin();
  return GS_REQ.reqs.filter(x => x.n < n &&
    (x.status === 'active' || x.status === 'queued' ||
     x.status === 'booked' ||
     /* v7: an exclusive request parked for review AT its activation
        still holds the FCFS slot it earned — nothing leapfrogs while a
        human decides (requests.json: review on activation) */
     (x.status === 'in_review' && x.holdsLine)) &&
    gsRequestsConflict(x, r, now));
}
/* the clashing claim resources on BOTH sides — for feed/viewer display.
   r's own res names what it filed; the blocker's res names what it
   waits on (the noise floor is the blocker's claim, not the filer's) */
function gsLiveClashes(r){
  const seen = {};
  const now = gsNowMin();
  for(const b of gsFindBlockers(r, now)){
    const wa = gsReqWindow(r, now), wb = gsReqWindow(b, now);
    for(const ca of gsClaimsOf(r)) for(const cb of gsClaimsOf(b))
      if(gsClaimClash(ca, r, cb, b, wa, wb)){
        seen[ca.res] = 1; seen[cb.res] = 1; }
  }
  return Object.keys(seen);
}
function gsClaimLabel(res){
  if(res === 'sky') return 'the sky';
  let m = res.match(/^venue:(.+?)@(.+)$/);
  if(m) return m[1] + ' — ' + m[2] + ' (permitted area)';
  m = res.match(/^venue:(.+)$/);   if(m) return m[1] + ' (permitted venue)';
  m = res.match(/^noise:(.+)$/);   if(m) return 'amplified sound at ' + m[1];
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
      (b.status === 'active' || b.status === 'booked' ? act : line)
        .push(b.id);
    o.blockedBy = act; o.behind = line;
    o.on = gsLiveClashes(r).map(gsClaimLabel);
    /* v15: a request with no request-blockers may still be parked by a
       city hold — the explanation names the hold, not an empty line */
    const held = (typeof gsLiveHolds === 'function')
      ? gsLiveHolds(r) : [];
    if(held.length){
      o.held = held.map(h => h.id);
      o.on = o.on.concat(held.map(h => gsHoldLabel(h.res)));
    }
    o.queuePos = gsQueuePosition(id);
    o.note = act.length
      ? 'waiting for ' + act.join(', ') + ' to finish (' + o.on.join('; ') + ')'
      : held.length
        ? 'held by the city until ' +
          gsBookHHMM(Math.max.apply(null, held.map(h => h.endMin)))
        : 'in line behind ' + line.join(', ');
  } else if(r.status === 'booked'){
    o.booked = gsBookHHMM(r.bookedStart);
    o.day = gsBookClock(r.bookedStart).day;
    o.note = 'on the book for ' + o.booked +
             (o.day ? ' (' + o.day + ')' : '') + ' — fires at the window';
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
    'venue zones — a zoned permit occupies its named area; the whole ' +
      'place touches every zone and vice versa',
    'noise — amplified permits claim the place\'s airspace and rest ' +
      '22:00-06:00 PT under the noise ordinance',
    'co-hosting — identical events sharing the same ground at the same ' +
      'time are one party with two permits',
    'city holds — the city may close a claim window; live claims are ' +
      'bumped with full compensation and filings wait or slide',
    'paper — one registry change per unit at a time (hire and buy serialize)',
    'listing — one live listing per unit',
    'queued requests are never leapfrogged by later conflicting requests',
    'the book — weather and event permits may claim a declared window ' +
      'up to 24h out; booked spans block overlaps and never run early',
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

/* ================= v14: THE BOOK — scheduled exclusives =================
   world/bookings.json (world-v74): a booked span claims the resource for
   that span; an overlapping ask queues for the next free window — FCFS,
   never auctioned. Bookable kinds are the flat-rate exclusives. The book
   is public: gsBookCalendar feeds gsViewerState().calendar. */
const GS_BOOK_CFG = { horizonMin: 1440, slotMin: 30 };
const GS_BOOKABLE = { weather: 1, street_event: 1 };

function gsIsBooking(r){ return r != null && r.bookedStart != null; }
function gsBookSnap(min){
  return Math.ceil(min / GS_BOOK_CFG.slotMin) * GS_BOOK_CFG.slotMin;
}
function gsBookP2(x){ return (x < 10 ? '0' : '') + x; }
function gsBookClock(min){
  return (typeof gsWireClock === 'function') ? gsWireClock(min)
    : { t: ((Math.floor(min) % 1440) + 1440) % 1440, day: null };
}
function gsBookHHMM(min){
  const t = gsBookClock(min).t;
  return gsBookP2(Math.floor(t / 60)) + ':' + gsBookP2(t % 60);
}
/* the span a request holds (or would hold) its claims on the world:
   bookings hold their declared window; an active holds its run; a queued,
   parked, or not-yet-filed request could run from now for its duration. */
function gsReqWindow(r, now){
  if(r.bookedStart != null)
    return [r.bookedStart, r.bookedStart + r.durationMin];
  if(r.status === 'active')
    return [r.startMin != null ? r.startMin : now,
            r.endMin != null ? r.endMin : Infinity];
  return [now, now + (r.durationMin || 0)];
}
function gsWindowsOverlap(a, b){ return a[0] < b[1] && b[0] < a[1]; }

/* normalize a filing's declared window — {startMin} or {err}; null when
   the spec carries no time field at all (an ordinary now-or-queued ask) */
function gsBookWindowSpec(spec, a, now){
  const rel = spec.start_slot, abs = spec.startMin;
  if(rel == null && abs == null) return null;
  if(!GS_BOOKABLE[spec.kind]) return { err: 'not_bookable' };
  const want = (abs != null) ? abs : now + (+rel || 0);
  if(!isFinite(want)) return { err: 'bad_window' };
  const start = gsBookSnap(want);
  if(start < now) return { err: 'bad_window' };          // the past is gone
  if(start > now + GS_BOOK_CFG.horizonMin)
    return { err: 'beyond_horizon' };                    // the book is 24 h
  return { startMin: start };
}

/* a slot that opens inside a cooldown tail can never legally fire —
   the picker never offers it (bookings.json honesty rules). Covers the
   standing claim rests + kind/player cooldowns on the clock AND the
   implied tails of anything booked or running now. Overlap itself is a
   clash matter (queue), never a tail denial. */
function gsBookTailDeny(r, s, now){
  const a = GS_REQ.actions[r.kind];
  for(const c of gsClaimsOf(r)){
    if((GS_REQ.cdClaim[c.res] || 0) > s) return 'slot_rest';
    /* v15: a zone's rest touches its whole place and vice versa — the
       tail check uses the same touch math as the matrix */
    if(c.cls === 'venue' && gsVenueRestAt(c.res, s)) return 'slot_rest';
  }
  if((GS_REQ.cdG[r.kind] || 0) > s) return 'cooldown_tail';
  if((GS_REQ.cdP[r.playerId + '|' + r.kind] || 0) > s)
    return 'cooldown_tail';
  for(const b of GS_REQ.reqs){
    if(b === r || (r.id && b.id === r.id)) continue;
    if(b.status !== 'booked' && b.status !== 'active') continue;
    const bEnd = gsReqWindow(b, now)[1];
    if(s < bEnd) continue;                 // overlapping the run is a clash
    if(b.kind === r.kind){
      if(a.cdGlobalMin && s < bEnd + a.cdGlobalMin) return 'cooldown_tail';
      if(a.cdPlayerMin && b.playerId === r.playerId &&
         s < bEnd + a.cdPlayerMin) return 'cooldown_tail';
    }
    const bCd = (GS_REQ.actions[b.kind] || {}).cdClaimMin;
    if(bCd && s < bEnd + bCd){
      for(const cb of gsClaimsOf(b))
        for(const c of gsClaimsOf(r))
          if(cb.res === c.res ||
             (cb.cls === 'venue' && c.cls === 'venue' &&
              gsVenueResTouch(cb.res, c.res)))
            return 'slot_rest';
    }
  }
  return null;
}

/* is [s, s+r.durationMin) claimable for r right now — no booked span or
   live lock on a clashing claim, no cooldown tail contains the start,
   and (v15) the noise ordinance + city holds fence the slot the same
   way they fence the door */
function gsBookSlotFree(r, s, now){
  const w = [s, s + r.durationMin];
  if(typeof gsCivicSlotDeny === 'function' &&
     gsCivicSlotDeny(r, s, now)) return false;
  for(const b of GS_REQ.reqs){
    if(b === r || (r.id && b.id === r.id)) continue;
    if(b.status !== 'booked' && b.status !== 'active') continue;
    if(!gsWindowsOverlap(w, gsReqWindow(b, now))) continue;
    let hit = false;
    for(const ca of gsClaimsOf(r)) for(const cb of gsClaimsOf(b))
      if(gsClaimClash(ca, r, cb, b, w, gsReqWindow(b, now))){
        hit = true; break; }
    if(hit) return false;
  }
  return !gsBookTailDeny(r, s, now);
}
/* the soonest grid slot at/after r's declared start (never before the
   snapped present) where the whole window is free — the slide target */
function gsBookNextFree(r, now){
  let s = Math.max(gsBookSnap(now),
                   r.bookedStart != null ? r.bookedStart : gsBookSnap(now));
  const lastStart = now + GS_BOOK_CFG.horizonMin;
  for(; s <= lastStart; s += GS_BOOK_CFG.slotMin)
    if(gsBookSlotFree(r, s, now)) return s;
  return null;
}
/* every on-calendar span whose claims clash with r's prospective run —
   later-filed bookings count too: once a span is on the book it is a
   promise, whatever the filing order was */
function gsBookedOverlaps(r, now){
  const w = gsReqWindow(r, now), out = [];
  for(const b of GS_REQ.reqs){
    if(b === r || (r.id && b.id === r.id)) continue;
    if(b.status !== 'booked') continue;
    if(!gsWindowsOverlap(w, gsReqWindow(b, now))) continue;
    let hit = false;
    for(const ca of gsClaimsOf(r)) for(const cb of gsClaimsOf(b))
      if(gsClaimClash(ca, r, cb, b, w, gsReqWindow(b, now))){
        hit = true; break; }
    if(hit) out.push(b);
  }
  return out;
}
/* the clip rule: when the ONLY thing ahead of r is booked span(s), r may
   run NOW if its minimum duration fits before the first booked window —
   its endMin clips to the window's edge and the un-run minutes refund at
   completion. Returns {endMin, by} or null (wait in line instead). */
function gsBookingClip(r, blockers, now){
  if(r.bookedStart != null) return null;      // bookings never clip
  const bookd = gsBookedOverlaps(r, now);
  if(!bookd.length) return null;
  for(const b of blockers) if(b.status !== 'booked') return null;
  const a = GS_REQ.actions[r.kind];
  const first = Math.min.apply(null, bookd.map(b => b.bookedStart));
  if(first - now < ((a && a.minMin) || 1)) return null;
  return { endMin: first,
           by: bookd.filter(b => b.bookedStart === first)[0].id };
}
/* approval (or promotion) lands a booking on the calendar — the public
   promise. A window still ahead becomes 'booked'; a window in progress
   fires its remainder; a window fully past ends it with a full refund. */
function gsBookLand(r, now){
  const s = r.bookedStart, e = s + r.durationMin;
  r.holdsLine = false;
  if(now >= e){
    r.status = 'expired'; r._now = now; r.reason = 'window_missed';
    if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed, 'window missed');
                      r.refunded = (r.refunded || 0) + r.billed; }
    gsBusEmit('expire', r, { refund: r.billed, via: 'window' });
    return r;
  }
  r.expireMin = null; r._now = now;
  if(now >= s){
    /* approval landed inside the window — fire the remainder; the
       un-run minutes come back at completion (shortRun honesty) */
    r.status = 'active'; r.startMin = now; r.endMin = e;
    r.shortRun = now > s;
    gsBusEmit('fire', r, { price: r.billed, booked: s,
                           hhmm: gsBookHHMM(s), late: now > s });
    gsFxActivate(r, now);
    return r;
  }
  r.status = 'booked';
  r.startMin = null; r.endMin = null;   // a promise, not a run — yet
  gsBusEmit('approve', r, { price: r.billed, booked: s,
    hhmm: gsBookHHMM(s),
    slid: r.slidFrom != null ? gsBookHHMM(r.slidFrom) : null,
    surge: r.surge > 1 ? r.surge : null });
  return r;
}
/* a queued booking reaching the front of the line: wait behind earlier
   speculative (queued) blockers; slide past hard claims on its window;
   review before it lands (a booked request is already approved); then
   land it. Returns true when the line should move on to the next. */
function gsBookPlace(next, blockers, now){
  const soft = blockers.filter(b => b.status === 'queued' ||
    (b.status === 'in_review' && b.holdsLine));
  if(soft.length) return true;                 // earlier line — wait it out
  /* v15: a city hold on the declared window slides the booking past the
     closure, same as a taken slot — the book only promises legal time */
  const held = (typeof gsLiveHolds === 'function')
    ? gsLiveHolds(next, now).length > 0 : false;
  if(blockers.length || held ||
     now >= next.bookedStart + next.durationMin){
    /* the declared window is taken or gone — the ask queues for the
       next free window (never an auction) */
    const s = gsBookNextFree(next, now);
    if(s == null){
      next.status = 'expired'; next._now = now; next.reason = 'window_missed';
      if(next.billed > 0){ gsCreditRefund(next.playerId, next.billed,
                                           'window missed');
                           next.refunded = (next.refunded || 0) +
                                           next.billed; }
      gsBusEmit('expire', next, { refund: next.billed, via: 'window' });
      return true;
    }
    if(s !== next.bookedStart){
      next.slidFrom = next.bookedStart; next.bookedStart = s;
    }
  }
  const a = GS_REQ.actions[next.kind];
  if(!gsIsAdmin(next.playerId) && a && a.review === 'always' &&
     next.reviewedMin == null){
    next.status = 'in_review'; next.holdsLine = true;
    next.expireMin = null;
    next.reviewExpireMin = now + GS_REVIEW_TTL_MIN;
    next.lane = next.lane || 'exclusive';
    gsBusEmit('review', next, { action: 'in_review',
      code: next.screen || null, lane: 'exclusive',
      booked: gsBookHHMM(next.bookedStart),
      expiresInMin: GS_REVIEW_TTL_MIN });
    return true;
  }
  gsBookLand(next, now);
  return true;
}
/* the public strip (bookings.json live seam): every claimed window with
   the holder's handle — attribution is the payoff and the anti-grief
   surface. Shapes the world's 24 h book view. */
function gsBookClaimLabel(r){
  if(r.kind === 'weather') return 'sky';
  const c = gsClaimsOf(r)[0];
  if(!c) return r.kind;
  if(c.cls === 'venue'){
    const vid = (typeof gsWireVenueId === 'function')
      ? gsWireVenueId(r.params && r.params.at) : null;
    /* v15: the calendar keeps the zone — 'venue:park@north lawn' */
    const parts = (typeof gsVenueResParts === 'function')
      ? gsVenueResParts(c.res) : null;
    return 'venue:' + (vid || (parts && parts.place) || c.res.slice(6)) +
           (parts && parts.zone ? '@' + parts.zone : '');
  }
  return 'openair';
}
/* a booking's window arrives: fire it unless a live lock still holds a
   clashing claim — a running exclusive is never booted mid-scene, so the
   booking waits, fires late (un-run minutes refund at completion), or
   expires 'window_missed' with a full refund if the run outlasts it. */
function gsFireBooking(r, now){
  const e = r.bookedStart + r.durationMin;
  if(now >= e){
    r.status = 'expired'; r._now = now; r.reason = 'window_missed';
    if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed, 'window missed');
                      r.refunded = (r.refunded || 0) + r.billed; }
    gsBusEmit('expire', r, { refund: r.billed, via: 'window' });
    return 'missed';
  }
  const w = [r.bookedStart, e];
  for(const x of GS_REQ.reqs){
    if(x === r || x.status !== 'active') continue;
    if(!gsWindowsOverlap(w, gsReqWindow(x, now))) continue;
    for(const ca of gsClaimsOf(r)) for(const cb of gsClaimsOf(x))
      if(gsClaimClash(ca, r, cb, x, w, gsReqWindow(x, now)))
        return 'held';
  }
  /* v15: a city hold covering the window keeps the permit unfired —
     if the closure outlasts the slot the booking expires missed and
     refunds in full, same honesty as a running lock */
  if(typeof gsLiveHolds === 'function' && gsLiveHolds(r, now).length)
    return 'held';
  r.status = 'active'; r.startMin = now; r.endMin = e; r._now = now;
  r.shortRun = now > r.bookedStart;
  gsBusEmit('fire', r, { price: r.billed, booked: r.bookedStart,
    hhmm: gsBookHHMM(r.bookedStart), late: r.shortRun || null });
  gsFxActivate(r, now);
  return 'fired';
}
function gsBookWhat(r){
  const p = r.params || {};
  if(r.kind === 'weather') return 'weather — ' + (p.wx || 'a sky change');
  const lbl = p.event ? String(p.event).replace(/_/g, ' ') : 'an event';
  return 'event — ' + lbl + (p.at ? ' at ' + p.at : '');
}
function gsBookCalendar(nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  return GS_REQ.reqs.filter(r => r.status === 'booked')
    .sort((a, b) => a.bookedStart - b.bookedStart || a.n - b.n)
    .map(r => ({
      req: r.id, claim: gsBookClaimLabel(r),
      res: gsClaimsOf(r).map(c => c.res),
      start_min: r.bookedStart, min: r.durationMin,
      start: gsBookHHMM(r.bookedStart),
      day: gsBookClock(r.bookedStart).day,
      who: (typeof gsWireWho === 'function')
        ? gsWireWho(r.playerId) : r.playerId,
      what: gsBookWhat(r),
    }));
}
/* the picker's free-slot list: the next `count` half-hour windows where
   this filing could legally run — free spans, no cooldown tails. */
function gsBookableSlots(spec, nowMin, count){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const a = spec && GS_REQ.actions[spec.kind];
  if(!a || !GS_BOOKABLE[spec.kind])
    return { ok: false, err: 'not_bookable', slots: [] };
  const dur = spec.durationMin;
  if(!(dur >= a.minMin && dur <= a.maxMin))
    return { ok: false, err: 'bad_duration', slots: [] };
  const r = { playerId: spec.playerId, kind: spec.kind,
              target: spec.target || null, params: spec.params || null,
              durationMin: dur };
  const slots = [];
  for(let s = gsBookSnap(now);
      s <= now + GS_BOOK_CFG.horizonMin && slots.length < (count || 24);
      s += GS_BOOK_CFG.slotMin)
    if(gsBookSlotFree(r, s, now))
      slots.push({ startMin: s, start: gsBookHHMM(s),
                   day: gsBookClock(s).day });
  return { ok: true, slots: slots };
}

/* ================= v7: SURGE — the cover charge goes up when there's a
   line (requests.json surge + monetization §2.3) =================
   Pressure = recent (6h) non-denied requests sharing a claim resource.
   A same-player re-filing on a target-scope request does not count —
   re-driving your own hire is the play loop, not contention; world-scale
   filings always count (back-to-back weather IS the grief), and primetime
   (18:00-23:00 PT) adds one step for global asks. 1.5x at first pressure,
   +0.25 per step after, capped 2.5x — the contract's range verbatim. The
   multiplier is computed BEFORE payment and returned by gsPriceQuote. */
const GS_SURGE_CFG = { windowMin: 360, base: 1.5, step: 0.25, cap: 2.5 };
const GS_QUEUE_DISCOUNT = 0.15;   // a queued filing bills at -15%
function gsBusPtMin(now){
  /* SF wall-time minute-of-day — the same clock the wire stamps with */
  if(typeof gsWireClock === 'function'){
    const c = gsWireClock(now);
    if(c && c.t != null) return c.t;
  }
  return ((Math.floor(now) % 1440) + 1440) % 1440;
}
function gsBusPrimetime(now){
  const t = gsBusPtMin(now);
  return t >= 18 * 60 && t < 23 * 60;
}
function gsSurgePressure(cand, now, atMin){
  const res = {};
  for(const c of gsClaimsOf(cand)) res[c.res] = 1;
  if(!Object.keys(res).length) return 0;
  const a = GS_REQ.actions[cand.kind];
  const worldAsk = !!(a && a.scope === 'global');
  let n = 0;
  for(const r of GS_REQ.reqs){
    if(r.submittedMin == null ||
       (now - r.submittedMin) > GS_SURGE_CFG.windowMin) continue;
    if(r.status === 'denied' || r.status === 'failed') continue;
    if(!worldAsk && r.playerId === cand.playerId) continue;
    for(const c of gsClaimsOf(r)){
      /* v15: a zoned permit contends for its whole place's demand —
         pressure counts any prior claim TOUCHING the filing's ground */
      let shares = !!res[c.res];
      if(!shares && c.cls === 'venue')
        for(const k in res)
          if(gsVenueResTouch(k, c.res)){ shares = true; break; }
      if(shares){ n++; break; }
    }
  }
  /* v14: for a booking the window's own hour is what matters — a 21:30
     slot in primetime prices at primetime, even filed at noon */
  if(worldAsk && gsBusPrimetime(atMin != null ? atMin : now)) n++;
  return n;
}
function gsSurgeFactor(cand, now, atMin){
  const p = gsSurgePressure(cand, now, atMin);
  if(p <= 0) return 1;
  return Math.min(GS_SURGE_CFG.cap,
                  GS_SURGE_CFG.base + GS_SURGE_CFG.step * (p - 1));
}

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
                      r.refunded = (r.refunded || 0) + r.billed; }
    gsBusEmit('fail', r, { reason: r.failReason, refund: r.billed });
    return false;
  }
  /* v9 co-star decline: the pawn said no — a real outcome, not an
     error. Half the bill comes back, the request resolves declined,
     nothing ran (thinai.json costar rules). */
  if(res && res.declined){
    r.fxOn = false; r.status = 'completed'; r._now = now;
    r.usedMin = 0; r.declined = res.declined;
    const back = r.billed - Math.ceil(r.billed * 0.5);
    if(back > 0){ gsCreditRefund(r.playerId, back, 'costar declined');
                  r.refunded = (r.refunded || 0) + back; }
    gsBusEmit('complete', r, { declined: res.declined, refund: back });
    return true;
  }
  r.fxOn = true;
  /* v7: a consumed permit rests the venue — "one event per resource per
     24h" (requests.json). Stamped at ACTIVATION (the slot was used the
     moment it ran, even if admin-ended later); allow() refuses the venue
     while it rests, at file time and again at promotion. */
  if(a.cdClaimMin)
    for(const c of gsClaimsOf(r))
      if(c.cls === 'venue') GS_REQ.cdClaim[c.res] = now + a.cdClaimMin;
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
                           next.refunded = (next.refunded || 0) +
                                           next.billed; }       // a dead request
      gsBusEmit('expire', next, { refund: next.billed });
      continue;
    }
    const a = GS_REQ.actions[next.kind];
    if(a && a.allow){
      const why = a.allow({ playerId: next.playerId, target: next.target,
                            kind: next.kind, params: next.params,
                            bookedStart: next.bookedStart,
                            durationMin: next.durationMin }, now);
      if(why !== true){
        next.status = 'failed'; next._now = now; next.failReason = why;
        if(next.billed > 0){ gsCreditRefund(next.playerId, next.billed,
                                             'conditions changed');
                             next.refunded = (next.refunded || 0) +
                                             next.billed; }
        gsBusEmit('fail', next, { reason: why, refund: next.billed,
                                  stale: true });
        continue;                                // FCFS: try the next in line
      }
    }
    const blockers = gsFindBlockers(next, now);
    /* v15: a city hold covering the prospective window parks the line —
       the request waits for the hold to lift (booked requests slide
       past the closure inside gsBookPlace) */
    const held = (typeof gsLiveHolds === 'function')
      ? gsLiveHolds(next, now).length > 0 : false;
    /* v14: a queued booking reaching the front waits behind earlier
       speculative (queued) line-holders but slides past hard claims on
       its declared window — FCFS, never an auction, never a leapfrog. */
    if(next.bookedStart != null){
      if(gsBookPlace(next, blockers, now)) continue;
    } else if(held) continue;
    /* v14 the clip rule: when the ONLY thing ahead is booked span(s), a
       now-or-queued request runs NOW if its minimum duration fits before
       the first booked window — its endMin clips to the window's edge
       and the un-run minutes refund at completion. */
    var clipTo = null;
    if(blockers.length){
      clipTo = gsBookingClip(next, blockers, now);
      if(!clipTo) continue;                      // still blocked — hold the line
    }
    /* v7: the exclusive class reviews AT ACTIVATION (requests.json:
       "review happens on activation, not while waiting"). The request
       leaves the queue but keeps holding its earned FCFS slot via
       holdsLine — a parked-for-review exclusive still blocks everything
       behind it, so nobody leapfrogs while the human reads. */
    if(!gsIsAdmin(next.playerId) && a && a.review === 'always' &&
       next.reviewedMin == null){
      next.status = 'in_review'; next.holdsLine = true;
      next.expireMin = null;
      next.reviewExpireMin = now + GS_REVIEW_TTL_MIN;
      next.lane = next.lane || 'exclusive';
      gsBusEmit('review', next, { action: 'in_review',
        code: next.screen || null, lane: 'exclusive',
        atActivation: true, expiresInMin: GS_REVIEW_TTL_MIN });
      continue;
    }
    next.status = 'active'; next.startMin = now;
    next.endMin = clipTo ? clipTo.endMin : now + next.durationMin;
    if(clipTo){ next.clippedBy = clipTo.by; next.clipEndMin = clipTo.endMin; }
    next.expireMin = null;
    next._now = now;
    gsBusEmit('approve', next, { promoted: true, price: next.billed,
      clipped: clipTo ? gsBookHHMM(clipTo.endMin) : null,
      clippedBy: clipTo ? clipTo.by : null,
      surge: next.surge > 1 ? next.surge : null,
      discount: next.discount || null });
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
  /* v9: filing is an interactive act — the player at the door is online
     (the quiet-hours presence layer wakes them + their hires). */
  if(typeof gsPresenceSeen === 'function') gsPresenceSeen(pid, now);
  const deny = (reason) => {
    const r = { id: 'req-' + (++GS_REQ.seq), n: GS_REQ.seq, playerId: pid,
      kind, target, durationMin: dur, params, price: 0, status: 'denied',
      reason, submittedMin: now, _now: now };
    GS_REQ.reqs.push(r); gsBusEmit('deny', r, { reason }); return r;
  };
  if(!a) return deny('unknown_action');
  if(a.scope === 'target' && !target) return deny('missing_target');
  if(!(dur >= a.minMin && dur <= a.maxMin)) return deny('bad_duration');
  /* v14 the Book: an exclusive filing may declare its start window.
     Normalize it before anything else reads the spec — a malformed or
     out-of-horizon window is a structural deny, never a billed one. */
  var bookStart = null;
  if(spec.start_slot != null || spec.startMin != null){
    const bw = gsBookWindowSpec(spec, a, now);
    if(bw && bw.err) return deny(bw.err);
    if(bw) bookStart = bw.startMin;
  }
  /* v7 door policy (41G): the account exists from its first knock on the
     door; suspended/held accounts are refused before content is even
     read, and flagged accounts route every filing through the human
     lane. Admin bypasses — the owner IS the reviewer. */
  if(typeof gsAccountSeen === 'function') gsAccountSeen(pid, now);
  var acctGate = null;
  if(!gsIsAdmin(pid) && typeof gsAccountGate === 'function')
    acctGate = gsAccountGate(pid, now);
  if(acctGate && acctGate.deny) return deny(acctGate.deny);
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
  /* v7 flood control: the door opens only so often — per-player filings
     per hour and live-request caps refuse pre-billing (a script can file
     forever; the bus just says no). */
  if(!gsIsAdmin(pid) && typeof gsRateCheck === 'function'){
    const rc = gsRateCheck(pid, now);
    if(rc) return deny(rc);
  }
  /* v7 appeal finality: a request text that was denied twice is closed —
     the appeal lane already had its say; refiling it is refused. */
  if(!gsIsAdmin(pid) && typeof gsFinalText === 'function' &&
     gsFinalText(pid, spec))
    return deny('appeal_final');
  if(a.allow){ const why = a.allow({ playerId: pid, target, kind, params,
                                    bookedStart: bookStart,
                                    durationMin: dur }, now);
               if(why !== true) return deny(why); }
  if((GS_REQ.cdP[pid + '|' + kind] || 0) > now) return deny('cooldown');
  if((GS_REQ.cdG[kind] || 0) > now) return deny('global_cooldown');
  /* v14: a slot inside a rest/cooldown tail can never legally fire —
     denied at the door, no money moves (the picker's own rule). */
  if(bookStart != null){
    const tail = gsBookTailDeny(
      { playerId: pid, kind, target, params,
        bookedStart: bookStart, durationMin: dur }, bookStart, now);
    if(tail) return deny(tail);
  }

  /* v2 pairwise conflicts: the request queues iff ANY earlier live
     request (active or queued) clashes with one of its claims — a
     queued blocker counts too, so nobody leapfrogs the line. v14:
     clash is window-aware when either side is a booking. */
  const cand = { playerId: pid, kind, target, params, n: Infinity,
    durationMin: dur };
  if(bookStart != null) cand.bookedStart = bookStart;
  const claims = gsClaimsOf(cand);
  /* v15: the city's hand — a hold covering this filing's claims and
     window denies at the door without billing, whatever the line
     looks like behind it */
  if(typeof gsCivicHoldDeny === 'function' && gsCivicHoldDeny(cand, now))
    return deny('city_hold');
  const blockers = gsFindBlockers(cand, now);
  const conflict = blockers.length > 0;
  /* v7 lane decision BEFORE billing: screening hits, flagged accounts,
     player-authored naming strings, and UNBLOCKED exclusive-class asks
     (weather, street_event — requests.json human review) park in_review.
     A blocked exclusive QUEUES like anything else — review happens on
     activation, not while waiting (requests.json resource_board). */
  const named = (kind === 'hire' && params && typeof params.name === 'string'
                 && params.name.trim().length > 0);
  const parked = !gsIsAdmin(pid) &&
    !!(screened || (acctGate && acctGate.review) || named ||
       (a.review === 'always' && !conflict));
  /* v7 pricing: base rate x minutes x surge; the surge is computed BEFORE
     payment and disclosed via gsPriceQuote. A filing that joins the line
     immediately bills at -15% — patience is cheaper (queue discount).
     v14: booking primetime keys off the WINDOW's hour; a time slot is
     not an upgrade (same math) and a booking takes no queue discount —
     it isn't queuing. */
  const surge = gsSurgeFactor(cand, now, bookStart);
  const price = Math.ceil(a.ratePerMin * dur * surge);
  const discounted = conflict && !parked && !gsIsAdmin(pid) &&
                     bookStart == null;
  const billed = discounted ? Math.ceil(price * (1 - GS_QUEUE_DISCOUNT))
                            : price;
  /* v8 deferred billing: an action with billOnApproval (the hire — a
     denied application must NEVER have billed) that parks in review
     holds its charge until a human approves it. The credit leaves once,
     at approval — screening first, then money. */
  const deferBill = !!a.billOnApproval && parked;
  /* admin ('owner'/'admin') files free — the owner exercises power through
     admin tools (design §3), never buys it back from themselves. Admin
     requests join the same FCFS line as everyone else's — the override
     mechanism is the revoke switch, not queue privilege. */
  if(billed > 0 && !gsIsAdmin(pid) && !deferBill &&
     !gsCreditSpend(pid, billed, kind + ' request'))
    return deny('insufficient_credits');

  const resKey = gsResourceKey(kind, target);
  const r = { id: 'req-' + (++GS_REQ.seq), n: GS_REQ.seq, playerId: pid,
    kind, target, durationMin: dur, params, price, resKey, claims,
    billed: (gsIsAdmin(pid) || deferBill) ? 0 : billed,
    deferred: deferBill && !gsIsAdmin(pid),
    surge, discount: discounted ? GS_QUEUE_DISCOUNT : 0,
    rateApplied: dur > 0 ? ((gsIsAdmin(pid) || deferBill) ? 0 : billed) / dur : 0,
    submittedMin: now, status: conflict ? 'queued' : 'active',
    startMin: conflict ? null : now,
    endMin: conflict ? null : now + dur,
    expireMin: conflict ? now + a.ttlMin : null,
    usedMin: 0, refunded: 0, fxOn: false, _now: now };
  if(bookStart != null) r.bookedStart = bookStart;
  if(screened){ r.screen = screened.code; r.lane = 'screen'; }
  else if(named) r.lane = 'naming';
  else if(a.review === 'always'){
    r.lane = 'exclusive';
    /* moderation.json: a first-week account reaching for world-scale
       agency is flagged for the reviewer on sight */
    if(typeof gsAcctAgeDays === 'function' && gsAcctAgeDays(pid, now) < 3)
      r.screen = 'first-time-exclusive';
  }
  else if(acctGate && acctGate.review) r.lane = 'flagged';
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
    gsBusEmit('review', r, { action: 'in_review', code: r.screen || null,
      lane: r.lane || null, price: r.billed, surge: surge > 1 ? surge : null,
      booked: bookStart != null ? gsBookHHMM(bookStart) : null,
      expiresInMin: GS_REVIEW_TTL_MIN });
    return r;
  }
  if(conflict){
    r.queuedBehind = blockers.map(b => b.id);
    gsBusEmit('queue', r, { price: r.billed, pos: gsQueuePosition(r.id),
      blockedBy: r.queuedBehind.slice(), on: gsLiveClashes(cand),
      surge: surge > 1 ? surge : null,
      discount: r.discount || null,
      booked: bookStart != null ? gsBookHHMM(bookStart) : null });
  } else if(bookStart != null){
    /* v14: a cleared booking lands on the calendar — never fires early */
    gsBookLand(r, now);
  } else {
    gsBusEmit('approve', r, { price: r.billed,
      surge: surge > 1 ? surge : null });
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
    /* v14: a booked window that has arrived fires — or waits behind a
       still-running lock, or expires missed with a full refund */
    if(r.status === 'booked'){
      if(now >= r.bookedStart) gsFireBooking(r, now);
      continue;
    }
    /* an unreviewed request lapses out of the lane with a full refund —
       it never ran, so it never should have kept the money */
    if(r.status === 'in_review' && r.reviewExpireMin != null &&
       now > r.reviewExpireMin){
      r.status = 'expired'; r._now = now; r.reason = 'review_lapsed';
      if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed,
                                       'review lapsed');
                        r.refunded = (r.refunded || 0) + r.billed; }
      gsBusEmit('expire', r, { refund: r.billed, via: 'review' });
      continue;
    }
    if(r.status === 'queued' && r.expireMin != null && now > r.expireMin){
      r.status = 'expired'; r._now = now;
      if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed, 'queue expired');
                        r.refunded = (r.refunded || 0) + r.billed; }
      gsBusEmit('expire', r, { refund: r.billed });
      continue;
    }
    if(r.status === 'active' && now >= r.endMin){
      gsFxDeactivate(r, now, 'completed');
      r.status = 'completed'; r._now = now;
      r.usedMin = Math.max(0, Math.min(r.durationMin,
                                     r.endMin - (r.startMin || now)));
      /* v14: a clipped run or a late-fired booking ran fewer minutes
         than billed — the un-run whole minutes come back at the paid
         rate, same honesty rule as an early cancel */
      const unrun = r.durationMin - r.usedMin;
      if(unrun > 0 && r.billed > 0){
        const back = Math.min(r.billed, Math.floor(r.rateApplied * unrun));
        if(back > 0){ gsCreditRefund(r.playerId, back, 'short run');
                      r.refunded = (r.refunded || 0) + back; }
      }
      const a = GS_REQ.actions[r.kind];
      if(a.cdPlayerMin) GS_REQ.cdP[r.playerId + '|' + r.kind] = now + a.cdPlayerMin;
      if(a.cdGlobalMin) GS_REQ.cdG[r.kind] = now + a.cdGlobalMin;
      gsBusEmit('complete', r, { usedMin: r.usedMin,
        clipped: r.clipEndMin != null || r.shortRun ? true : null });
    }
  }
  gsPromoteAll(now);
  /* v5: wind-down warnings + the orphan sweep ride the same bus beat */
  if(typeof gsPossessTick === 'function') gsPossessTick(now);
  /* v6: the wire's honest-empty marker rides the same beat */
  if(typeof gsWireTick === 'function') gsWireTick(now);
  /* v9: the quiet-hours beat — linger expiries drop brains, the seam
     drains, the ladder re-evaluates, needs + compute accrue */
  if(typeof gsOffTick === 'function') gsOffTick(now);
  /* v15: the city's hand — lapsed holds lift themselves on the same
     beat (the lift promotes the line it was parking) */
  if(typeof gsCivicTick === 'function') gsCivicTick(now);
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
            r.status !== 'in_review' && r.status !== 'booked'))
    return false;
  const isAdmin = (by === 'admin' || by === 'owner');
  let refund;
  /* queued, still-parked, or not-yet-fired bookings never ran — the
     full bill comes back (cancel before the window = full refund) */
  if(r.status === 'queued' || r.status === 'in_review' ||
     r.status === 'booked' || isAdmin){
    refund = r.billed;
  } else {
    const unusedWholeMin = Math.max(0, Math.floor(r.endMin - now));
    refund = Math.min(r.billed, Math.floor(r.rateApplied * unusedWholeMin));
  }
  const wasBooked = r.status === 'booked';
  r.usedMin = r.status === 'active'
    ? Math.max(0, Math.min(r.durationMin, now - (r.startMin || now))) : 0;
  r.status = 'cancelled'; r._now = now; r.by = by || 'player';
  gsFxDeactivate(r, now, 'cancelled');
  if(refund > 0){ gsCreditRefund(r.playerId, refund, 'cancelled');
                  r.refunded = (r.refunded || 0) + refund; }
  gsBusEmit('cancel', r, { by: r.by, refund, usedMin: r.usedMin,
    pre_window: wasBooked || null });
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
            r.status !== 'in_review' && r.status !== 'booked'))
    return false;
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
  /* v7 appeal rule (moderation.json): a different reviewer must take the
     appeal — enforced, not just shown on the console. */
  if(r.appealOf && opts.by && r.origReviewer &&
     opts.by === r.origReviewer)
    return { error: 'same_reviewer', id: r.id };
  const a = GS_REQ.actions[r.kind];
  /* approve-modified (moderation.json 'approved (modified)'): a reviewer
     may trim duration/scope, never widen it; the unused minutes refund
     at the applied rate before the request enters the line. */
  var modified = false;
  if(approve && opts.modifyMin != null && a &&
     opts.modifyMin >= a.minMin && opts.modifyMin < r.durationMin){
    r.durationMin = Math.floor(opts.modifyMin);
    r.price = Math.ceil(a.ratePerMin * r.durationMin * (r.surge || 1));
    modified = true;
  }
  gsBusEmit('review', r, { action: approve
    ? (modified ? 'approved_modified' : 'approved') : 'denied',
    code: opts.code || r.screen || null, by: opts.by || 'reviewer' });
  r._now = now;
  r.reviewedBy = opts.by || 'reviewer';
  if(!approve){
    r.status = 'denied';
    r.reason = opts.code || 'review_denied';
    r.screenDenied = r.reason;         // a reviewer denial is a content denial
    if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed, 'review denied');
                    r.refunded = (r.refunded || 0) + r.billed; }
    /* a second denial is final for that request text (moderation.json) */
    if(r.appealOf && typeof gsAppealFinal === 'function')
      gsAppealFinal(r, now);
    gsBusEmit('deny', r, { reason: r.reason, via: 'review',
                           refund: r.billed });
    if(r.holdsLine){ r.holdsLine = false; gsPromoteAll(now); }
    return r;
  }
  /* v7: the door can close while a request waits — re-check the account
     gate at approval (a suspended account's parked request cannot run). */
  if(!gsIsAdmin(r.playerId) && typeof gsAccountGate === 'function'){
    const g = gsAccountGate(r.playerId, now);
    if(g && g.deny){
      r.status = 'denied'; r.reason = g.deny;
      if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed,
                                       'account closed');
                        r.refunded = (r.refunded || 0) + r.billed; }
      gsBusEmit('deny', r, { reason: g.deny, via: 'review',
                             refund: r.billed });
      if(r.holdsLine){ r.holdsLine = false; gsPromoteAll(now); }
      return r;
    }
  }
  /* v7 appeals re-bill on approval: the original charge was refunded at
     denial; the appealed run pays once — the appeal itself is free. */
  if(r.appealOf && r.billed <= 0 && !gsIsAdmin(r.playerId)){
    if(!gsCreditSpend(r.playerId, r.price, r.kind + ' request (appeal)')){
      r.status = 'failed'; r.failReason = 'insufficient_credits';
      gsBusEmit('fail', r, { reason: 'insufficient_credits', refund: 0 });
      if(r.holdsLine){ r.holdsLine = false; gsPromoteAll(now); }
      return r;
    }
    r.billed = r.price;
    r.rateApplied = r.durationMin > 0 ? r.billed / r.durationMin : 0;
  }
  if(modified && r.billed > 0){
    /* refund the trimmed minutes at the (possibly discounted) rate */
    const want = r.discount ? Math.ceil(r.price * (1 - r.discount))
                            : r.price;
    const diff = r.billed - want;
    if(diff > 0){
      gsCreditRefund(r.playerId, diff, 'review modified');
      r.refunded = (r.refunded || 0) + diff; r.billed = want;
      r.rateApplied = r.durationMin > 0 ? r.billed / r.durationMin : 0;
    }
  }
  /* approval = entering the line NOW: fresh sequence (no leapfrog of
     requests filed while it parked) and a fresh queue TTL. */
  r.n = ++GS_REQ.seq;
  r.reviewedMin = now;
  if(a && a.allow){
    const why = a.allow({ playerId: r.playerId, target: r.target,
                          kind: r.kind, params: r.params,
                          bookedStart: r.bookedStart,
                          durationMin: r.durationMin }, now);
    if(why !== true){
      r.status = 'failed'; r.failReason = why;
      if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed,
                                       'conditions changed');
                      r.refunded = (r.refunded || 0) + r.billed; }
      gsBusEmit('fail', r, { reason: why, refund: r.billed, stale: true });
      if(r.holdsLine){ r.holdsLine = false; gsPromoteAll(now); }
      return r;
    }
  }
  const blockers = gsFindBlockers(r, now);
  /* v8: a deferred-billed request (the hire) pays ONCE here — screening
     passed, the reviewer approved, now the flat fee lands. A request
     that still has to queue pays the discounted patience rate instead
     of the list price; a player whose credits ran out while they waited
     fails honestly with nothing to refund (none ever moved). */
  if(r.deferred && r.billed <= 0 && !gsIsAdmin(r.playerId)){
    const want = blockers.length
      ? Math.ceil(r.price * (1 - GS_QUEUE_DISCOUNT)) : r.price;
    if(!gsCreditSpend(r.playerId, want, r.kind + ' request')){
      r.status = 'failed'; r.failReason = 'insufficient_credits';
      gsBusEmit('fail', r, { reason: 'insufficient_credits', refund: 0 });
      if(r.holdsLine){ r.holdsLine = false; gsPromoteAll(now); }
      return r;
    }
    r.billed = want; r.deferred = false;
    if(blockers.length && r.bookedStart == null)
      r.discount = GS_QUEUE_DISCOUNT;
    r.rateApplied = r.durationMin > 0 ? r.billed / r.durationMin : 0;
  }
  /* v14: an approved booking goes to the CALENDAR, not the run floor.
     It waits in line only behind earlier speculative claims; hard claims
     on its window make it slide to the soonest free slot — a booked
     span is a promise whoever filed first. */
  if(r.bookedStart != null){
    const soft = blockers.filter(b => b.status === 'queued' ||
      (b.status === 'in_review' && b.holdsLine));
    if(soft.length){
      r.status = 'queued'; r.holdsLine = false;
      r.expireMin = now + (a.ttlMin || 60);
      r.queuedBehind = blockers.map(b => b.id);
      gsBusEmit('queue', r, { price: r.billed, pos: gsQueuePosition(r.id),
        blockedBy: r.queuedBehind.slice(), on: gsLiveClashes(r),
        reviewed: true, booked: gsBookHHMM(r.bookedStart) });
      return r;
    }
    if(blockers.length ||
       now >= r.bookedStart + r.durationMin){
      const s = gsBookNextFree(r, now);
      if(s == null){
        r.status = 'expired'; r.reason = 'window_missed';
        if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed,
                                         'window missed');
                          r.refunded = (r.refunded || 0) + r.billed; }
        gsBusEmit('expire', r, { refund: r.billed, via: 'window' });
        if(r.holdsLine){ r.holdsLine = false; gsPromoteAll(now); }
        return r;
      }
      if(s !== r.bookedStart){ r.slidFrom = r.bookedStart;
                               r.bookedStart = s; }
    }
    r.holdsLine = false;
    gsBookLand(r, now);
    gsPromoteAll(now);
    return r;
  }
  if(blockers.length){
    r.status = 'queued';
    r.expireMin = now + (a.ttlMin || 60);
    r.queuedBehind = blockers.map(b => b.id);
    /* v7: the patience discount lands here — a reviewed request that
       still has to wait bills at -15% and the difference comes back */
    if(!r.discount && r.billed > 0){
      const want = Math.ceil(r.price * (1 - GS_QUEUE_DISCOUNT));
      const diff = r.billed - want;
      if(diff > 0){
        gsCreditRefund(r.playerId, diff, 'queue discount');
        r.refunded = (r.refunded || 0) + diff; r.billed = want;
        r.rateApplied = r.durationMin > 0 ? r.billed / r.durationMin : 0;
      }
      r.discount = GS_QUEUE_DISCOUNT;
    }
    gsBusEmit('queue', r, { price: r.billed, pos: gsQueuePosition(r.id),
      blockedBy: r.queuedBehind.slice(), on: gsLiveClashes(r),
      reviewed: true, surge: r.surge > 1 ? r.surge : null,
      discount: r.discount || null });
    return r;
  }
  r.status = 'active'; r.startMin = now;
  r.endMin = now + r.durationMin; r.expireMin = null;
  r.holdsLine = false;              // the held slot is now just running
  gsBusEmit('approve', r, { price: r.billed, reviewed: true,
    surge: r.surge > 1 ? r.surge : null });
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
      .filter(b => b.status === 'active' || b.status === 'booked')
      .map(b => b.id);
    m.on = gsLiveClashes(r).map(gsClaimLabel);
    if(r.bookedStart != null){
      m.booked = gsBookHHMM(r.bookedStart);
      m.day = gsBookClock(r.bookedStart).day;
    }
  }
  /* v14: an on-calendar span shows its window, not a running meter */
  if(r.status === 'booked'){
    m.booked = gsBookHHMM(r.bookedStart);
    m.day = gsBookClock(r.bookedStart).day;
    m.startsInMin = +(r.bookedStart - now).toFixed(1);
    m.on = gsClaimsOf(r).map(c => gsClaimLabel(c.res));
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
      price: r.billed,
      surge: (r.surge && r.surge > 1) ? r.surge : null,
      discount: r.discount || null,
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
    /* v10: the public board — quiet pocket listings are absent, not
       redacted; building-scope sale cards ride the same projection */
    listings: (typeof gsListingsPublic === 'function')
      ? gsListingsPublic() : JSON.parse(JSON.stringify(GS_LISTINGS)),
    events: GS_EVENTS.map(e => Object.assign({}, e)),
    sessions: gsCoSessions(),
    /* v14: THE BOOK — the public 24 h calendar of claimed exclusive
       windows (world/bookings.json live seam). Booked spans only;
       attribution by spectator handle; nothing private. */
    calendar: gsBookCalendar(now),
    weather: GS_WX_OVR.wx ? { wx: GS_WX_OVR.wx, untilMin: GS_WX_OVR.untilMin,
      sponsors: Object.keys(GS_WX_OVR.sponsors || {}).length } : null,
    /* v7: the resource board (requests.json) — per-claim state for every
       contended resource, free/cool/locked/queued with honest times */
    board: (typeof gsResourceBoard === 'function')
      ? gsResourceBoard(now) : {},
    /* v11: the block's memory, public face — every subject with public
       record, worst first. Fair means card-shaped: band + counts, never
       a float bar, never a private ledger line */
    reputation: (typeof gsCharRepBoard === 'function')
      ? gsCharRepBoard() : [],
    /* v15: the city's posted closures — a hold is a public fact (the
       admin line that declared it already aired on the wire) */
    holds: (typeof gsHoldList === 'function') ? gsHoldList(now) : [],
    /* v17: the county's public roll — parcel counts, total assessed,
       open delinquencies. Assessor records are public in real life;
       per-parcel detail comes from gsParcelView */
    county: (typeof gsCountyStats === 'function')
      ? gsCountyStats() : null,
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
    cdP: GS_REQ.cdP, cdG: GS_REQ.cdG, cdClaim: GS_REQ.cdClaim,
    feed: GS_FEED, feedN: GS_FEED_SEQ.n, hired: GS_HIRED,
    possess: GS_POSSESS, events: GS_EVENTS,
    listings: GS_LISTINGS, wxOvr: GS_WX_OVR, fxSeq: GS_FX_SEQ.n,
    plog: (typeof gsPossessSnapshot === 'function')
          ? gsPossessSnapshot() : null,             // v5 driving record
    wire: (typeof gsWireSnapshot === 'function')
          ? gsWireSnapshot() : null,                // v6 formatted feed
    grief: (typeof gsGriefSnapshot === 'function')
           ? gsGriefSnapshot() : null,             // v7 door-policy state
    hiring: (typeof gsHireSnapshot === 'function')
            ? gsHireSnapshot() : null,             // v8 personnel office
    offline: (typeof gsOffSnapshot === 'function')
             ? gsOffSnapshot() : null,             // v9 quiet hours
    deeds: (typeof gsListingSnapshot === 'function')
           ? gsListingSnapshot() : null,          // v10 title office
    crep: (typeof gsCrepSnapshot === 'function')
          ? gsCrepSnapshot() : null,              // v11 block's memory
    onb: (typeof gsOnbSnapshot === 'function')
         ? gsOnbSnapshot() : null,            // v12 welcome wagon
    econ: (typeof gsEconSnapshot === 'function')
          ? gsEconSnapshot() : null,          // v13 Friday payroll
    civic: (typeof gsCivicSnapshot === 'function')
           ? gsCivicSnapshot() : null,     // v15 municipal code
    assessor: (typeof gsAssessorSnapshot === 'function')
              ? gsAssessorSnapshot() : null }); // v17 the county roll
}
function gsBusLoad(json){
  try{
    const d = JSON.parse(json);
    if(!d || !Array.isArray(d.reqs)) return false;
    GS_REQ.seq = d.seq || 0; GS_REQ.reqs = d.reqs;
    GS_REQ.cdP = d.cdP || {}; GS_REQ.cdG = d.cdG || {};
    GS_REQ.cdClaim = d.cdClaim || {};
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
    /* v7: account flags, appeals, ads + rep notebook */
    if(typeof gsGriefLoad === 'function') gsGriefLoad(d.grief);
    /* v8: job openings + the h## counter */
    if(typeof gsHireLoad === 'function') gsHireLoad(d.hiring);
    /* v9: presence, degrade set, notes, needs, co-star + compute */
    if(typeof gsOffLoad === 'function') gsOffLoad(d.offline);
    /* v10: building listings, deeds, the transfer book, licenses */
    if(typeof gsListingLoad === 'function') gsListingLoad(d.deeds);
    /* v11: the reputation journal — restored verbatim; anything older
       than the saved cursor stays put (the feed replay is deduped) */
    if(typeof gsCrepLoad === 'function' && d.crep) gsCrepLoad(d.crep);
    /* v12: journeys, handles, camera sessions, the analytics ledger */
    if(typeof gsOnbLoad === 'function') gsOnbLoad(d.onb);
    /* v13: payroll/nut marks + the audit index — restored so a loaded
       world never double-pays a Friday */
    if(typeof gsEconLoad === 'function' && d.econ) gsEconLoad(d.econ);
    /* v15: declared city holds ride back verbatim — the closure a save
       carried still fences the same claims */
    if(typeof gsCivicLoad === 'function') gsCivicLoad(d.civic);
    /* v17: the county roll — parcels, APN lots, bills, defaults */
    if(typeof gsAssessorLoad === 'function') gsAssessorLoad(d.assessor);
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
  GS_REQ.cdClaim = {};
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
  if(typeof gsGriefReset === 'function') gsGriefReset();     // v7
  if(typeof gsHireReset === 'function') gsHireReset();       // v8
  if(typeof gsOffReset === 'function') gsOffReset();         // v9
  if(typeof gsListingReset === 'function') gsListingReset(); // v10
  if(typeof gsCrepReset === 'function') gsCrepReset();       // v11
  if(typeof gsOnbReset === 'function') gsOnbReset();         // v12
  if(typeof gsEconReset === 'function') gsEconReset();       // v13
  if(typeof gsCivicReset === 'function') gsCivicReset();     // v15
  if(typeof gsAssessorReset === 'function') gsAssessorReset(); // v17
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
  /* v7 door-policy surface (the pre-payment receipt + the board) */
  window.__aiBridge.gsPriceQuote = (spec) =>
    (typeof gsPriceQuote === 'function') ? gsPriceQuote(spec) : null;
  window.__aiBridge.gsResourceBoard = () =>
    (typeof gsResourceBoard === 'function') ? gsResourceBoard() : {};
  /* v14 the Book (world/bookings.json live seam): the public calendar
     rides gsViewerState().calendar; the slot picker asks what's free */
  window.__aiBridge.gsBookCalendar = () => gsBookCalendar();
  window.__aiBridge.gsBookableSlots = (spec, count) =>
    gsBookableSlots(spec, null, count);
  /* v15 the municipal code: holds are admin verbs; the zone list and
     the clerk's outlook are the read side */
  window.__aiBridge.gsAdminHold = (spec) =>
    (typeof gsAdminHold === 'function') ? gsAdminHold(spec) : null;
  window.__aiBridge.gsLiftHold = (id) =>
    (typeof gsLiftHold === 'function') ? gsLiftHold(id) : false;
  window.__aiBridge.gsHoldList = () =>
    (typeof gsHoldList === 'function') ? gsHoldList() : [];
  window.__aiBridge.gsVenueZoneList = (at) =>
    (typeof gsVenueZoneList === 'function') ? gsVenueZoneList(at) : null;
  window.__aiBridge.gsReqOutlook = (id) =>
    (typeof gsReqOutlook === 'function') ? gsReqOutlook(id) : null;
  window.__aiBridge.gsWatchAd = (pid) =>
    (typeof gsWatchAd === 'function') ? gsWatchAd(pid) : null;
  window.__aiBridge.gsAdStatus = (pid) =>
    (typeof gsAdStatus === 'function') ? gsAdStatus(pid) : null;
  window.__aiBridge.gsAppealRequest = (id, opts) =>
    (typeof gsAppealRequest === 'function') ? gsAppealRequest(id, opts) : null;
  window.__aiBridge.gsAppealStats = () =>
    (typeof gsAppealStats === 'function') ? gsAppealStats() : null;
  window.__aiBridge.gsFlagStatus = (pid) =>
    (typeof gsFlagStatus === 'function') ? gsFlagStatus(pid) : null;
  window.__aiBridge.gsEscalateLegal = (id) =>
    (typeof gsEscalateLegal === 'function') ? gsEscalateLegal(id) : false;
  window.__aiBridge.gsRepLedger = (id) =>
    (typeof gsRepLedger === 'function') ? gsRepLedger(id) : [];
  window.__aiBridge.gsModMetrics = () =>
    (typeof gsModMetrics === 'function') ? gsModMetrics() : null;
}
