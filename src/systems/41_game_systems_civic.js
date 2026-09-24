/* =====================================================================
   PART 41P: GAME SYSTEMS — THE MUNICIPAL CODE (v15: conflicts, pass two)

   v2 gave the request bus a pairwise claims matrix and v14 put the
   claims on a calendar. What was missing is everything a real permit
   office knows that a flat resource key can't say:

   1. THE ZONE MAP (space) — a venue claim 'venue:<place>' was one blob.
      A real permit names an AREA. Venues that genuinely subdivide carry
      a zone table (Dolores Park is the canonical one — it hosts a dozen
      permitted things at once, and the city writes permits by area). A
      zoned filing claims 'venue:<place>@<zone>'; a bare venue filing is
      the whole place and touches every zone. Zone relations live in the
      matrix (gsVenueResTouch, requests.js) — same place + same zone or
      either side whole = the same ground.

   2. THE NOISE ORDINANCE (time) — amplified-sound permits rest
      22:00-06:00 PT (SF PD Article 29's own shape). An event kind's
      'amplified' flag makes it claim 'noise:<place>' on top of its
      ground — the noise floor is the place's airspace and clashes with
      EVERY venue claim there (a loud party and a quiet cleanup can't
      share a lawn). The check keys off the RUN window — declared for
      bookings, prospective for now-or-queued asks — so the door, the
      picker, and promotion all enforce the same clock.

   3. THE CITY'S HAND (holds) — admin may place a duration-bounded HOLD
      on any claimable resource: 'sky' (airspace), 'venue:<place>' /
      'venue:<place>@<zone>' (a closure), 'noise:<place>' (a quiet
      rule), 'openair' (roving permits grounded), 'char:<id>',
      'paper:<id>', 'listing:<id>'. The city always wins: declaring a
      hold sweeps every live claim that overlaps its window and pays the
      standing admin compensation (full refund, public line); filings
      into a hold are denied 'city_hold' without billing; a queued or
      booked request that reaches a held window waits or slides past it,
      never fires into it.

   4. CO-HOSTING (shared permits) — two identical events on the same
      ground at the same time are ONE event with two permits (the sky's
      own co-sponsor rule). The claims don't clash; each sponsor pays
      their own span; the event record lives until its last sponsor's
      window ends; the wire prints the second permit as a co-host.

   5. THE CLERK'S ANSWERS (explainability) — gsReqOutlook gives any
      request its honest outlook (queue position + not-before estimate,
      booked window, review TTL); gsCivicAlts feeds gsPriceQuote's
      'alts' — a denied or would-queue filing answers with the soonest
      legal slots instead of a bare no.

   Everything is a claim-space fact: no new currencies, no mind control,
   no real addresses. Municipal realism only.
   ===================================================================== */

/* ---- the map beneath the map: venue zones ----
   A place gets a zone table only when it genuinely subdivides in real
   life. Streets stay whole-segment — a 'Valencia Street' closure is the
   street face as named (no invented block numbers on real streets). */
const GS_VENUE_ZONES = {
  'dolores park':  ['north lawn', 'south lawn', 'playground',
                    'tennis courts', 'church street edge'],
  'precita park':  ['the lawn', 'the plaza'],
};

function gsVenueZoneList(at){
  const place = (typeof gsNormVenue === 'function')
    ? gsNormVenue(at) : String(at || '').toLowerCase();
  const z = GS_VENUE_ZONES[place];
  return z ? z.slice() : null;
}

/* parse an event filing's ground: params.zone wins, then 'at' suffixes —
   'Dolores Park (north lawn)', 'Dolores Park — north lawn', or a bare
   trailing zone name ('dolores park north lawn'). Returns
   {place, zone, err} — err 'bad_zone' when the named zone isn't real or
   the event kind doesn't take zones at all (a fair is whole-venue). */
function gsVenueZoneParse(r){
  const p = (r && r.params) || {};
  const meta = (typeof GS_EVENT_KINDS !== 'undefined')
    ? (GS_EVENT_KINDS[p.event] || {}) : {};
  let at = (typeof gsNormVenue === 'function')
    ? gsNormVenue(p.at) : String(p.at || '').toLowerCase();
  let zone = (typeof p.zone === 'string' && p.zone.trim())
    ? gsNormVenue(p.zone) : null;
  let m = at.match(/^(.*?)\s*\(([^()]*)\)\s*$/);          // 'place (zone)'
  if(!m) m = at.match(/^(.*?)\s*[–—]\s*(.+)$/);          // 'place — zone'
  if(m){ at = gsNormVenue(m[1]); if(!zone) zone = gsNormVenue(m[2]); }
  if(!zone){
    /* bare suffix: 'dolores park north lawn' */
    for(const place in GS_VENUE_ZONES)
      if(at.length > place.length && at.indexOf(place + ' ') === 0){
        const cand = at.slice(place.length + 1);
        if(GS_VENUE_ZONES[place].indexOf(cand) >= 0){
          at = place; zone = cand; break;
        }
      }
  }
  const zones = GS_VENUE_ZONES[at] || null;
  let err = null;
  if(zone && (!zones || zones.indexOf(zone) < 0)) err = 'bad_zone';
  if(zone && !meta.zoned) err = 'bad_zone';
  return { place: at, zone: err ? null : zone, err: err };
}

/* the claims an event filing holds on the world (v15 replaces the
   requests.js fallback): a zoned venue filing claims 'venue:P@Z';
   amplified kinds also claim the place's airspace 'noise:P' — the
   permit office writes both lines on one permit. */
function gsEventClaims(r){
  const meta = GS_EVENT_KINDS[(r.params && r.params.event)] || {};
  const parsed = gsVenueZoneParse(r);
  const out = meta.outdoor ? 1 : 0;
  if(meta.venue && parsed.place){
    const claims = [{ cls: 'venue',
      res: 'venue:' + parsed.place + (parsed.zone ? '@' + parsed.zone : ''),
      outdoor: out }];
    if(meta.amplified)
      claims.push({ cls: 'noise', res: 'noise:' + parsed.place });
    return claims;
  }
  return [{ cls: 'openair', outdoor: out, excl: false,
            res: 'openair:' + r.playerId + ':' + (r.params && r.params.event) }];
}

/* ---- the noise ordinance: amplified sound rests 22:00-06:00 PT ----
   The window is judged per-minute — a permit that would run ANY of its
   minutes inside quiet hours is refused; one ending exactly at 22:00
   runs clean. gsBusPtMin is the wire's own SF wall clock. */
const GS_NOISE_ORDINANCE = { quietFrom: 22 * 60, quietTo: 6 * 60 };
function gsQuietMin(pt){
  return pt >= GS_NOISE_ORDINANCE.quietFrom ||
         pt <  GS_NOISE_ORDINANCE.quietTo;
}
/* does [sMin,eMin) touch quiet hours? The window's covered PT minutes
   are [pt0, pt0+dur) in unwrapped space (pt0 = PT minute-of-day at the
   start); the quiet band is the continuous [22:00, 30:00) = 22:00-06:00
   across midnight. A window starting INSIDE the early half of the band
   is the same interval shifted a day forward — check both placements.
   O(1): the picker runs this once per grid slot. */
function gsQuietOverlap(sMin, eMin){
  if(!(eMin > sMin)) return false;
  const dur = Math.min(eMin - sMin, 1440);
  const a = gsBusPtMin(sMin), b = a + dur;
  const qf = GS_NOISE_ORDINANCE.quietFrom,
        qt = GS_NOISE_ORDINANCE.quietTo + 1440;
  return (a < qt && qf < b) || (a + 1440 < qt && qf < b + 1440);
}
function gsQuietDeny(sMin, eMin){
  return gsQuietOverlap(sMin, eMin) ? 'quiet_hours' : null;
}
/* does this request's kind carry an amplified permit? */
function gsCivicLoud(r){
  return r && r.kind === 'street_event' && r.params &&
    !!(GS_EVENT_KINDS[r.params.event] || {}).amplified;
}

/* ---- the city's hand: administrative holds ----
   A hold is a duration-bounded closure on claim-space. It is not a
   request — it has no billing, no queue slot, and it always wins. */
const GS_HOLDS = [];
const GS_HOLD_SEQ = { n: 0 };
const GS_HOLD_CFG = { minMin: 15, maxMin: 1440 };

/* does a hold on res cover the claim? Place-level relations reuse the
   matrix's zone math: a whole-place hold covers every zone and the
   noise floor; a zone hold covers its zone AND whole-venue filings
   (you can't permit the whole park with a lawn closed); a noise hold
   is a quiet rule — it silences loud permits, it does not close the
   venue itself. */
function gsHoldCover(holdRes, claimRes){
  if(holdRes === 'sky') return claimRes === 'sky';
  if(holdRes === 'openair') return claimRes.indexOf('openair:') === 0;
  if(holdRes.indexOf('noise:') === 0) return claimRes === holdRes;
  const hp = (typeof gsVenueResParts === 'function')
    ? gsVenueResParts(holdRes) : null;
  if(hp && hp.cls === 'venue'){
    if(claimRes === ('noise:' + hp.place)) return !hp.zone; // whole-place
    return gsVenueResTouch(holdRes, claimRes);              // only quiets
  }
  return claimRes === holdRes;                              // char/paper/
}                                                           // listing
function gsHoldsOver(claims, w, now){
  const out = [];
  for(const h of GS_HOLDS){
    if(h.endMin <= now) continue;                            // swept
    if(!gsWindowsOverlap(w, [h.startMin, h.endMin])) continue;
    for(const c of claims)
      if(gsHoldCover(h.res, c.res)){ out.push(h); break; }
  }
  return out;
}
/* live holds clashing with r over its prospective/declared window */
function gsLiveHolds(r, now){
  return GS_HOLDS.length
    ? gsHoldsOver(gsClaimsOf(r), gsReqWindow(r, now), now) : [];
}
function gsCivicHoldDeny(r, now){
  return gsLiveHolds(r, now).length ? 'city_hold' : null;
}
/* the picker-side legality check: a slot can't be offered when the
   ordinance or a hold would fence the whole window */
function gsCivicSlotDeny(r, s, now){
  if(gsCivicLoud(r) && gsQuietOverlap(s, s + r.durationMin))
    return 'quiet_hours';
  if(gsHoldsOver(gsClaimsOf(r), [s, s + r.durationMin], now).length)
    return 'city_hold';
  return null;
}

/* normalize + validate a hold's claim target. Accepts raw claim res
   strings ('sky', 'venue:dolores park', 'venue:dolores park@north
   lawn', 'noise:dolores park', 'openair', 'char:H3', 'paper:u..',
   'listing:u..') or a {place, zone} spec for venue holds. */
function gsHoldResNorm(res, spec){
  let s = (typeof res === 'string' ? res : '').toLowerCase()
    .trim().replace(/\s+/g, ' ');
  if(!s && spec && spec.place){
    s = 'venue:' + gsNormVenue(spec.place) +
        (spec.zone ? '@' + gsNormVenue(spec.zone) : '');
  }
  if(!s) return null;
  if(s === 'sky' || s === 'openair') return s;
  if(s.indexOf('venue:') === 0){
    const p = gsVenueResParts(s);
    if(!p || !p.place) return null;
    if(p.zone &&
       (GS_VENUE_ZONES[p.place] || []).indexOf(p.zone) < 0)
      return null;                          // the city permits real areas
    return s;
  }
  if(/^(noise|char|paper|listing):.+/.test(s)) return s;
  return null;
}
function gsHoldLabel(res){
  if(res === 'sky') return 'the sky';
  if(res === 'openair') return 'the open air';
  const p = gsVenueResParts(res);
  if(p){
    const disp = (typeof gsWireDispName === 'function')
      ? gsWireDispName(p.place) : p.place;
    if(p.cls === 'noise') return 'quiet at ' + (disp || p.place);
    return (disp || p.place) + (p.zone ? ' — ' + p.zone : ' (all areas)');
  }
  return res;
}

/* admin verb: declare a hold. The sweep is the honest part — every live
   claim overlapping the window is bumped with the standing admin
   compensation (full refund) and the public line says so. */
function gsAdminHold(spec, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const by = (spec && spec.by) || 'owner';
  if(!gsIsAdmin(by)) return { ok: false, err: 'admin_only' };
  const res = gsHoldResNorm(spec && spec.res, spec);
  if(!res) return { ok: false, err: 'bad_claim' };
  const s = (spec && spec.startMin != null) ? +spec.startMin : now;
  const dur = (spec && spec.durationMin != null) ? +spec.durationMin : 60;
  if(!isFinite(s) || !isFinite(dur)) return { ok: false, err: 'bad_window' };
  if(!(dur >= GS_HOLD_CFG.minMin && dur <= GS_HOLD_CFG.maxMin))
    return { ok: false, err: 'bad_duration' };
  if(s + dur <= now) return { ok: false, err: 'window_past' };
  const h = { id: 'hold-' + (++GS_HOLD_SEQ.n), res: res,
    startMin: s, endMin: s + dur,
    reason: (spec && spec.reason) || 'city work',
    by: by, sinceMin: now };
  const bumped = [];
  let comp = 0;
  for(const r of GS_REQ.reqs.slice()){
    if(r.status !== 'active' && r.status !== 'queued' &&
       r.status !== 'in_review' && r.status !== 'booked') continue;
    if(!gsWindowsOverlap(gsReqWindow(r, now), [h.startMin, h.endMin]))
      continue;
    let hit = false;
    for(const c of gsClaimsOf(r))
      if(gsHoldCover(res, c.res)){ hit = true; break; }
    if(!hit) continue;
    const back = r.billed || 0;
    if(gsCancelRequest(r.id, now, 'admin')){
      bumped.push(r.id); comp += back;
    }
  }
  h.bumped = bumped;
  GS_HOLDS.push(h);
  gsBusEmit('admin', { playerId: 'owner', kind: 'admin', id: null,
    _now: now }, { action: 'hold', hold: h.id, res: res,
    address: gsHoldLabel(res), detail: h.reason,
    startMin: h.startMin, endMin: h.endMin, until: gsBookHHMM(h.endMin),
    bumped: bumped.length || null, compensated_cr: comp || null });
  if(typeof gsRepNote === 'function')
    gsRepNote('owner', 'hold', 0,
      { res: res, bumped: bumped.length }, now);
  return { ok: true, hold: h, bumped: bumped };
}
function gsLiftHold(id, nowMin, via){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const i = GS_HOLDS.findIndex(h => h.id === id);
  if(i < 0) return false;
  const h = GS_HOLDS.splice(i, 1)[0];
  gsBusEmit('admin', { playerId: 'owner', kind: 'admin', id: null,
    _now: now }, { action: 'hold_lift', hold: h.id, res: h.res,
    address: gsHoldLabel(h.res),
    detail: via === 'expire' ? 'window ended' : 'released early' });
  /* freed ground hands off in the same beat — the line moves */
  gsPromoteAll(now);
  return true;
}
/* the public board — live and future holds, display-safe */
function gsHoldList(nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  return GS_HOLDS.filter(h => h.endMin > now).map(h => ({
    id: h.id, res: h.res, label: gsHoldLabel(h.res),
    startMin: h.startMin, endMin: h.endMin,
    start: gsBookHHMM(h.startMin), until: gsBookHHMM(h.endMin),
    reason: (typeof gsWireRedact === 'function')
      ? gsWireRedact(h.reason) : h.reason,
    bumped: (h.bumped || []).length,
    live: h.startMin <= now,
  }));
}
/* the bus beat: expired holds lift themselves (and say so) */
function gsCivicTick(now){
  for(const h of GS_HOLDS.slice())
    if(h.endMin <= now) gsLiftHold(h.id, now, 'expire');
}

/* ---- the clerk's answers ----
   An honest outlook for any request: queue position + the earliest the
   blockers and holds could clear, booked windows, review TTLs. */
function gsReqOutlook(id, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const r = (typeof gsRequestById === 'function') ? gsRequestById(id) : null;
  if(!r) return null;
  const o = { id: r.id, kind: r.kind, player: r.playerId,
              status: r.status };
  if(r.status === 'queued'){
    o.pos = gsQueuePosition(id);
    o.on = gsLiveClashes(r).map(gsClaimLabel);
    const ends = gsFindBlockers(r).map(b => gsReqWindow(b, now)[1]);
    const holds = gsLiveHolds(r, now);
    const all = ends.concat(holds.map(h => h.endMin));
    o.notBeforeMin = all.length ? Math.max.apply(null, all) : null;
    o.notBefore = o.notBeforeMin != null
      ? gsBookHHMM(o.notBeforeMin) : null;
    o.held = holds.length ? holds.map(h => h.id) : null;
  } else if(r.status === 'booked'){
    o.startMin = r.bookedStart; o.start = gsBookHHMM(r.bookedStart);
    o.day = gsBookClock(r.bookedStart).day;
    o.firesInMin = +(r.bookedStart - now).toFixed(1);
  } else if(r.status === 'active'){
    o.endsAtMin = r.endMin; o.remainingMin = +(r.endMin - now).toFixed(1);
  } else if(r.status === 'in_review'){
    o.reviewCode = r.screen || null;
    o.reviewExpiresInMin = r.reviewExpireMin != null
      ? +(r.reviewExpireMin - now).toFixed(1) : null;
  } else {
    o.note = r.status + (r.reason || r.failReason
      ? ': ' + (r.reason || r.failReason) : '');
  }
  return o;
}
/* a denied or waiting filing's next legal slots — the clerk never says
   'no' without saying when. Bookable kinds scan the grid; the answer
   is honest because gsBookSlotFree already knows every law. */
function gsCivicAlts(r, now, count){
  if(!GS_BOOKABLE[r.kind]) return [];
  const out = [];
  const lim = now + GS_BOOK_CFG.horizonMin;
  for(let s = gsBookSnap(now); s <= lim && out.length < (count || 3);
      s += GS_BOOK_CFG.slotMin)
    if(gsBookSlotFree(r, s, now))
      out.push({ startMin: s, start: gsBookHHMM(s),
                 day: gsBookClock(s).day });
  return out;
}

/* ---- persistence: holds ride the bus snapshot ---- */
function gsCivicSnapshot(){
  return { holds: GS_HOLDS, holdSeq: GS_HOLD_SEQ.n };
}
function gsCivicLoad(d){
  GS_HOLDS.length = 0;
  if(d && Array.isArray(d.holds))
    GS_HOLDS.push.apply(GS_HOLDS, d.holds);
  GS_HOLD_SEQ.n = (d && d.holdSeq) || 0;
}
function gsCivicReset(){
  GS_HOLDS.length = 0; GS_HOLD_SEQ.n = 0;
}
