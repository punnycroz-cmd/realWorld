/* =====================================================================
   PART 41K — THE BLOCK'S MEMORY (v11 reputation)

   Persistent reputation consequences for the tenant/landlord layer
   (roadmap v11, rw-game-design §3/§6, world lease-ui power map):

   - THE JOURNAL: GS_CREP.events is the canonical, append-only social
     record — evictions (for-cause / no-fault / wrongful-override),
     dispute filings and rent-board outcomes, violations, move-outs,
     foreclosure, late rent. Every row carries BOTH sides' signed
     weights (wL for the landlord, wT for the tenant) and a `pub` flag:
     street-visible or public-record events propagate to the block;
     paper events stay inside the building.
   - SCORING is public-but-fair: a bounded decayed sum, a word band
     (good/okay/watch/cold/pariah), and event counts — never a float
     bar. The public card counts PUBLIC events only; private money
     history (late rent) never prints.
   - KNOWLEDGE: characters act on what they know, not world truth.
     Parties learn on the day; building neighbors the next day; public
     events spread through the block over 2–6 days (deterministic
     gossip); paper events travel only if told (gsCharRepTell). A
     character on another street cannot know a private filing — there
     is no omniscience leak.
   - RESPONSE is measurable: gsCharRepResponse reports knowers / cold /
     organized for a landlord, and the record feeds behavior — a
     knowing tenant declines to apply (gsApplyForLease gate), gives
     notice at term end / month-to-month (gsRentTick hooks), and the
     block prints "neighbors comparing notes" once a pattern is real.
   - Disputes get real verbs: gsFileDispute / gsResolveDispute write
     onto the lease's dispute history (the seeded 9457 contested raise
     rides the same record) and through the public feed.

   Deterministic: no Math.random; all entry points take explicit
   'YYYY-MM-DD' days. Decay half-life 540 days; events older than five
   years are forgotten. Two currencies never mix — reputation moves no
   money at all.
   ===================================================================== */

const GS_CREP = {
  seq: 0,
  events: [],        // {id,key,day,kind,verdict,unit,bld,street,address,
                     //  landlord,tenant,parties,wL,wT,mult,pub}
  known: {},         // cid -> {evtId -> learnedDay}   (explicit/told only)
  talk: {},          // landlordId -> last 'tenants_talk' beat day
  cursor: 0,         // highest GS_FEED n ingested
};

/* ---------------- tuning ---------------- */
const GS_CREP_HALFLIFE = 540;   // days to half weight (~18 months)
const GS_CREP_FORGET   = 1825;  // five years and the block forgives
const GS_CREP_PATTERN  = 365;   // trailing window for pattern escalation
const GS_CREP_PAT_STEP = 0.45;  // each repeat offense lands heavier
const GS_CREP_PAT_MAX  = 2.4;
const GS_CREP_DECLINE  = -45;   // stance: won't apply to this landlord
const GS_CREP_TALK     = -30;   // stance: counts as 'cold' for the block
const GS_CREP_LEAVE    = -60;   // stance: gives notice, no dice needed
const GS_CREP_LEAVE_P  = 45;    // %/month hash-gated notice when cold
const GS_CREP_TALK_N   = 3;     // cold knowers needed for 'organized'
const GS_CREP_TALK_GAP = 90;    // days between 'tenants talking' beats

/* weight table: wL = landlord record, wT = tenant record.
   A legitimate eviction is legal but still noticed (-3); a no-fault
   termination is lawful and cold (-8); an override with no paper is
   the wrongful kind (-16) — and repeats escalate via `mult`. */
const GS_CREP_W = {
  evict: {
    for_cause: { wL: -3,  wT: -14 },
    no_fault:  { wL: -8,  wT: -2  },
    wrongful:  { wL: -16, wT: 0   },
  },
  dispute_filed:      { wL: -1,  wT: 0  },   // tenant filed — pending
  dispute_filed_ll:   { wL: 0,   wT: -1 },   // landlord filed — pending
  dispute_resolved: {
    upheld_tenant:   { wL: -10, wT: 6  },
    upheld_landlord: { wL: 3,   wT: -3 },
    settled:         { wL: 2,   wT: 2  },
  },
  violation:       { wL: 0, wT: -6 },   // discovered violation on tenant
  violation_cured: { wL: 1, wT: 3  },   // +2 wL when added_to_lease
  notice_cured:    { wL: 0, wT: 1  },   // paid/cured inside the window
  vacate:          { wL: 0, wT: 1  },   // clean move-out
  rent_late:       { wL: 0, wT: -1 },   // private money record
  evict_filed:     { wL: -2, wT: 0  },  // licensed filing, pending review
  foreclose:       { wL: 0, wT: -6 },   // public financial record
};
/* `pub` on each event = "public record a camera or the rent board could
   verify" — propagates to the street over days. Private paper (late
   rent, cure notes) never leaves the building. */

/* ---------------- small helpers ---------------- */
function gsCrepToday(){
  return (typeof gsTodayStr === 'function') ? gsTodayStr() : null;
}
/* the landlord of record for a unit: unit title, else building, else
   the owner account itself */
function gsCrepOwnerOf(unitId){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(unitId) : null;
  const b = u && (typeof gsBldById === 'function') ? gsBldById(u.bld_id) : null;
  return (u && u.owner_id) || (b && b.owner_id) || 'landlord';
}
/* the reputation SUBJECT for a unit: a named owner (cast, player,
   scripted id like 'L-BAD') carries one record across every door they
   own — that is the point of the system. Generic 'landlord' stock is
   not one person; each building keeps its own book ('landlord@<bld>')
   so one bad generic door can't poison the whole rental stock. */
function gsCrepSubjectOf(unitId){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(unitId) : null;
  const b = u && (typeof gsBldById === 'function') ? gsBldById(u.bld_id) : null;
  const named = (u && u.owner_id) || (b && b.owner_id);
  if(named && named !== 'landlord') return named;
  return 'landlord@' + (u ? u.bld_id : (unitId || 'unknown'));
}
function gsCrepBldOf(unitId){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(unitId) : null;
  return u ? u.bld_id : unitId;      // tolerate a building id directly
}
function gsCrepStreetOf(unitId){
  const b = (typeof gsBldById === 'function') ? gsBldById(gsCrepBldOf(unitId)) : null;
  return b ? b.street : null;
}
function gsCrepCharIds(){
  if(typeof gsAllCharIds === 'function') return gsAllCharIds();
  const ids = [];
  if(typeof GS_CORE_CAST === 'object') for(const c in GS_CORE_CAST) ids.push(c);
  if(typeof NV_CAST !== 'undefined')
    for(const c of NV_CAST) if(c.tier === 'ambient') ids.push(c.id);
  if(typeof GS_HIRED === 'object')
    for(const cid in GS_HIRED) ids.push(cid);
  return ids;
}
/* home building + street for a character (lease/occupant/unpermitted —
   gsHomeOf resolves all three ways a person can live somewhere) */
function gsCrepHome(cid){
  const h = (typeof gsHomeOf === 'function') ? gsHomeOf(cid) : null;
  if(!h) return null;
  return { unit: h.unit_id, bld: gsCrepBldOf(h.unit_id),
           street: gsCrepStreetOf(h.unit_id) };
}
function gsCrepDecay(evtDay, day){
  if(!evtDay || !day) return 1;                    // undated: full weight
  const age = (typeof gsDateDiff === 'function')
    ? gsDateDiff(day, evtDay) : NaN;
  if(!isFinite(age) || age < 0) return 0;
  if(age > GS_CREP_FORGET) return 0;
  return Math.pow(0.5, age / GS_CREP_HALFLIFE);
}
function gsCrepBand(s){
  return s >= 15 ? 'good' : s >= -8 ? 'okay' :
         s >= -30 ? 'watch' : s >= -55 ? 'cold' : 'pariah';
}

/* ---------------- the journal ---------------- */
/* pattern multiplier: a landlord's repeat negatives land harder —
   the SECOND wrongful eviction is a pattern, not an accident */
function gsCrepPattern(landlord, day){
  if(!landlord || !day) return 1;
  let n = 0;
  for(const e of GS_CREP.events){
    if(e.landlord !== landlord || !(e.wL <= -8)) continue;
    const age = (typeof gsDateDiff === 'function')
      ? gsDateDiff(day, e.day) : NaN;
    if(isFinite(age) && age >= 0 && age <= GS_CREP_PATTERN) n++;
  }
  return Math.min(GS_CREP_PAT_MAX, 1 + GS_CREP_PAT_STEP * n);
}
function gsCrepLearn(e){
  const base = e.day || gsCrepToday() || '1970-01-01';
  for(const cid of gsCrepCharIds()){
    let learned = null;
    if(cid === e.landlord || cid === e.tenant ||
       (e.parties || []).indexOf(cid) >= 0){
      learned = base;                                    // lived it
    } else {
      const h = gsCrepHome(cid);
      if(h && h.bld === e.bld)
        learned = base;                                  // hallway talk
      else if(e.pub && h && e.street && h.street === e.street &&
              typeof gsDateAdd === 'function')
        learned = gsDateAdd(base, 1);                    // the street hears
      else if(e.pub && typeof gsDateAdd === 'function')
        learned = gsDateAdd(base,
          2 + hashString18(cid + '|' + e.id) % 5);       // board gossip
    }
    if(learned) gsCrepTeach(cid, e.id, learned);
  }
}
function gsCrepTeach(cid, evtId, day){
  const k = (GS_CREP.known[cid] = GS_CREP.known[cid] || {});
  if(k[evtId] == null || (day && k[evtId] > day)) k[evtId] = day;
}
function gsCrepPush(spec){
  if(spec.key && GS_CREP.events.some(e => e.key === spec.key)) return null;
  const e = {
    id: 'rep-' + (++GS_CREP.seq),
    key: spec.key || null,
    day: spec.day || null,
    kind: spec.kind,
    verdict: spec.verdict || null,
    unit: spec.unit || null,
    bld: spec.bld || (spec.unit ? gsCrepBldOf(spec.unit) : null),
    street: spec.street ||
      (spec.unit ? gsCrepStreetOf(spec.unit) : null),
    address: spec.address || null,
    landlord: spec.landlord || null,
    tenant: spec.tenant || null,
    parties: (spec.parties || []).slice(),
    pub: !!spec.pub,
    wL: spec.wL || 0,
    wT: spec.wT || 0,
    mult: 1,
  };
  /* negative landlord events escalate on repeats */
  if(e.wL <= -8){
    e.mult = gsCrepPattern(e.landlord, e.day);
    e.wL = Math.round(e.wL * e.mult);
  }
  GS_CREP.events.push(e);
  gsCrepLearn(e);
  gsCrepTalkCheck(e);
  return e;
}
/* the measurable beat: enough cold knowers and the block starts
   comparing notes — one feed line per landlord per quiet spell */
function gsCrepTalkCheck(e){
  if(!e.landlord || !e.day) return;
  const r = gsCharRepResponse(e.landlord, e.day);
  if(!r.organized) return;
  const last = GS_CREP.talk[e.landlord];
  if(last && typeof gsDateDiff === 'function' &&
     Math.abs(gsDateDiff(e.day, last)) <= GS_CREP_TALK_GAP) return;
  GS_CREP.talk[e.landlord] = e.day;
  gsCrepFeed('tenants_talk', {
    unit: e.unit, bld: e.bld, address: e.address,
    landlord: e.landlord, day: e.day });
}
function gsCrepFeed(action, extra){
  if(typeof gsBusEmit !== 'function') return null;
  extra = extra || {};
  if(!extra.address && extra.unit &&
     typeof gsAddressOfUnit === 'function')
    extra.address = gsAddressOfUnit(extra.unit);
  return gsBusEmit('lease', { playerId: 'owner', kind: 'lease', id: null,
    target: extra.unit || null, _now: null },
    Object.assign({ action }, extra));
}

/* ---------------- ingestion: feed events -> journal ----------------
   mirrors the wire's posture — a cursor over GS_FEED, replayable, so
   seed-time and snapshot events both land exactly once (key-deduped). */
function gsCrepOnEvent(evt){
  if(!evt || evt.n == null) return;
  if(evt.n > GS_CREP.cursor) GS_CREP.cursor = evt.n;
  if(evt.type === 'lease'){
    const day = evt.day || null;
    const unit = evt.unit || null;
    const landlord = unit ? gsCrepSubjectOf(unit) : null;
    const ownerId = unit ? gsCrepOwnerOf(unit) : null;
    switch(evt.action){
      case 'evict': {
        /* verdict: an executed pay/cure notice is for-cause; an executed
           30-day termination is lawful no-fault; no executable paper at
           all (owner override) is the wrongful kind */
        let verdict = 'wrongful';
        if(!evt.noFault && evt.notice){
          const l = (typeof GS_REG !== 'undefined')
            ? GS_REG.leases.find(x => x.unit_id === unit &&
                x.status === 'evicted' &&
                (x.notices || []).some(n => n.id === evt.notice))
            : null;
          const n = l && l.notices.find(x => x.id === evt.notice);
          verdict = (n && n.kind === 'termination') ? 'no_fault' : 'for_cause';
        }
        const w = GS_CREP_W.evict[verdict];
        gsCrepPush({
          key: 'evict|' + unit + '|' + evt.tenant + '|' + day,
          day, kind: 'evict', verdict, unit,
          address: evt.address || null,
          landlord, tenant: evt.tenant || null,
          parties: (evt.displaced || []).slice(),
          wL: w.wL, wT: w.wT, pub: true });
        break;
      }
      case 'vacate':
        gsCrepPush({
          key: 'vacate|' + unit + '|' + evt.tenant + '|' + day,
          day, kind: 'vacate', unit, address: evt.address || null,
          landlord, tenant: evt.tenant || null,
          parties: [evt.by || evt.tenant],
          wL: GS_CREP_W.vacate.wL, wT: GS_CREP_W.vacate.wT, pub: true });
        break;
      case 'rent_late':
        gsCrepPush({
          key: 'late|' + unit + '|' + (evt.period || day),
          day, kind: 'rent_late', unit, address: evt.address || null,
          landlord, tenant: evt.tenant || null,
          parties: (evt.debtors || [evt.tenant]).filter(Boolean),
          wL: GS_CREP_W.rent_late.wL, wT: GS_CREP_W.rent_late.wT,
          pub: false });                       // money stays private
        break;
      case 'violation':
        gsCrepPush({
          key: 'vio|' + (evt.violId || (unit + '|' + day)),
          day, kind: 'violation', unit, address: evt.address || null,
          landlord, tenant: evt.tenant || null,
          parties: [evt.who || evt.tenant].filter(Boolean),
          wL: GS_CREP_W.violation.wL, wT: GS_CREP_W.violation.wT,
          pub: true });                        // the inspector was seen
        break;
      case 'violation_cured':
        gsCrepPush({
          key: 'vcure|' + (evt.violId || (unit + '|' + day)),
          day, kind: 'violation_cured', unit, address: evt.address || null,
          landlord, tenant: evt.tenant || null,
          parties: [evt.who || evt.tenant].filter(Boolean),
          wL: evt.how === 'added_to_lease'
            ? GS_CREP_W.violation_cured.wL + 1 : GS_CREP_W.violation_cured.wL,
          wT: GS_CREP_W.violation_cured.wT, pub: false });
        break;
      case 'notice_cured':
        gsCrepPush({
          key: 'ncure|' + (evt.noticeId || (unit + '|' + day)),
          day, kind: 'notice_cured', unit, address: evt.address || null,
          landlord, tenant: evt.tenant || null,
          parties: [evt.tenant].filter(Boolean),
          wL: GS_CREP_W.notice_cured.wL, wT: GS_CREP_W.notice_cured.wT,
          pub: false });
        break;
      case 'dispute_filed': {
        const byLL = evt.by && (evt.by === landlord ||
          evt.by === ownerId || evt.by === 'owner');
        const w = byLL ? GS_CREP_W.dispute_filed_ll : GS_CREP_W.dispute_filed;
        gsCrepPush({
          key: 'dsp|' + unit + '|' + (evt.dispId || (evt.kind + '|' + day)),
          day, kind: 'dispute_filed', verdict: evt.kind || null, unit,
          address: evt.address || null,
          landlord, tenant: evt.tenant || null,
          parties: [evt.by, evt.tenant].filter(Boolean),
          wL: w.wL, wT: w.wT, pub: true });    // filings are public record
        break;
      }
      case 'dispute_resolved': {
        const w = GS_CREP_W.dispute_resolved[evt.outcome] ||
                  GS_CREP_W.dispute_resolved.settled;
        gsCrepPush({
          key: 'dres|' + (evt.dispId || (unit + '|' + day)),
          day, kind: 'dispute_resolved', verdict: evt.outcome || 'settled',
          unit, address: evt.address || null,
          landlord, tenant: evt.tenant || null,
          parties: [evt.by, evt.tenant].filter(Boolean),
          wL: w.wL, wT: w.wT, pub: true });    // decisions are published
        break;
      }
      case 'evict_filed':
        /* a licensed landlord brings the paper — attach to the FILER,
           not the owner account (they own the deed, they wear it) */
        gsCrepPush({
          key: 'efile|' + unit + '|' + (evt.player || '') + '|' + day,
          day, kind: 'evict_filed', unit, address: evt.address || null,
          landlord: evt.player || landlord, tenant: evt.tenant || null,
          parties: [evt.player, evt.tenant].filter(Boolean),
          wL: GS_CREP_W.evict_filed.wL, wT: GS_CREP_W.evict_filed.wT,
          pub: true });
        break;
    }
    return;
  }
  if(evt.type === 'admin' && evt.action === 'foreclose'){
    /* foreclosure is public record — it lands on the foreclosed owner's
       card, not the note holder's */
    gsCrepPush({
      key: 'fc|' + (evt.unit || evt.bld || '') + '|' + (evt.owner || '') +
           '|' + gsCrepToday(),
      day: gsCrepToday(), kind: 'foreclose',
      unit: evt.unit || null, bld: evt.bld || null,
      address: evt.address || null,
      landlord: null, tenant: evt.owner || null,
      parties: [evt.owner].filter(Boolean),
      wL: 0, wT: GS_CREP_W.foreclose.wT, pub: true });
  }
}
if(typeof gsBusOnEvent === 'function') gsBusOnEvent(gsCrepOnEvent);
/* catch-up replay (wire posture): anything the hook missed — seed-time
   emits, snapshot-restored feed rows — formats once, in order */
function gsCrepSync(){
  /* re-entrancy: a push during replay fires the response check, which
     itself syncs — the guard keeps that inner pass from ingesting feed
     rows the outer loop hasn't reached yet (beats stay causal) */
  if(GS_CREP.syncing) return;
  GS_CREP.syncing = true;
  try{
    const feed = (typeof GS_FEED !== 'undefined') ? GS_FEED : [];
    for(const evt of feed)
      if(evt.n > GS_CREP.cursor){ GS_CREP.cursor = evt.n; gsCrepOnEvent(evt); }
  }finally{ GS_CREP.syncing = false; }
}

/* ---------------- disputes (real verbs on the lease record) -------- */
function gsFileDispute(unitId, kind, by, opts){
  const l = (typeof gsActiveLease === 'function')
    ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  if(typeof gsLeaseEnsure === 'function') gsLeaseEnsure(l);
  opts = opts || {};
  const ownerId = gsCrepOwnerOf(unitId);
  const parties = [l.tenant_id].concat(l.occupants || []);
  if(by !== ownerId && by !== 'owner' && parties.indexOf(by) < 0)
    return { ok: false, reason: 'not_a_party' };
  const d = { id: 'dsp-' + (++GS_LEASE.nSeq),
    kind: kind || 'general', by: by,
    since: opts.date || gsCrepToday(), note: opts.note || null,
    status: 'open' };
  l.disputes.push(d);
  if(typeof gsLeaseFeed === 'function')
    gsLeaseFeed('dispute_filed', l, { dispId: d.id, by: by, kind: d.kind,
      day: d.since });
  return { ok: true, dispute: d };
}
function gsResolveDispute(unitId, dispId, outcome, opts){
  const l = (typeof gsActiveLease === 'function')
    ? gsActiveLease(unitId) :
      ((typeof GS_REG !== 'undefined')
        ? GS_REG.leases.find(x => x.unit_id === unitId &&
            (x.disputes || []).some(d => d.id === dispId)) : null);
  if(!l) return { ok: false, reason: 'no_lease' };
  if(typeof gsLeaseEnsure === 'function') gsLeaseEnsure(l);
  const d = (l.disputes || []).find(x => x.id === dispId);
  if(!d || d.status !== 'open') return { ok: false, reason: 'no_open_dispute' };
  if(['upheld_tenant', 'upheld_landlord', 'settled'].indexOf(outcome) < 0)
    return { ok: false, reason: 'bad_outcome' };
  opts = opts || {};
  d.status = 'resolved'; d.outcome = outcome;
  d.resolvedOn = opts.date || gsCrepToday();
  d.resolvedBy = opts.by || 'owner';
  if(typeof gsLeaseFeed === 'function')
    gsLeaseFeed('dispute_resolved', l, { dispId: d.id, by: d.by,
      kind: d.kind, outcome: outcome, day: d.resolvedOn });
  return { ok: true, dispute: d };
}

/* ---------------- canonical reads ---------------- */
function gsCharRepEvents(subjId){
  gsCrepSync();
  return GS_CREP.events.filter(e =>
    e.landlord === subjId || e.tenant === subjId ||
    (e.parties || []).indexOf(subjId) >= 0);
}
/* a subject's own record — canonical truth (admin/console view).
   Occupants of a lease share a third of the tenant weight: they were
   on the paperwork, but the leaseholder carries the record. */
function gsCharRepScore(subjId, day){
  gsCrepSync();
  day = day || gsCrepToday();          /* undated = as of now */
  let s = 0;
  for(const e of GS_CREP.events){
    const f = gsCrepDecay(e.day, day);
    if(f <= 0) continue;
    if(e.landlord === subjId) s += e.wL * f;
    else if(e.tenant === subjId) s += e.wT * f;
    else if((e.parties || []).indexOf(subjId) >= 0) s += e.wT * 0.3 * f;
  }
  s = Math.max(-100, Math.min(100, Math.round(s)));
  return { score: s, band: gsCrepBand(s),
           events: gsCharRepEvents(subjId).length };
}
/* the PUBLIC card — what a tenant-union bulletin could honestly print:
   counts of public-record events only, band from the public score.
   Private money history (late rent) is never on this card. */
function gsCharRepCard(cid, day){
  gsCrepSync();
  day = day || gsCrepToday();          /* the card is as of now */
  const pub = GS_CREP.events.filter(e => e.pub &&
    (e.landlord === cid || e.tenant === cid ||
     (e.parties || []).indexOf(cid) >= 0));
  let s = 0;
  const card = {
    who: cid,
    name: /^landlord@/.test(cid) ? 'the landlord'
        : (typeof gsCharName === 'function') ? gsCharName(cid) : cid,
    asOf: day || gsCrepToday(),
    landlord: { evictions: 0, forCause: 0, noFault: 0, wrongful: 0,
      disputesOpen: 0, disputesLost: 0, filings: 0 },
    tenant: { evicted: 0, forCause: 0, violations: 0, cleanExits: 0,
      disputesWon: 0, disputesOpen: 0 },
  };
  for(const e of pub){
    const f = gsCrepDecay(e.day, day);
    if(f <= 0) continue;
    if(e.landlord === cid) s += e.wL * f;
    else if(e.tenant === cid) s += e.wT * f;
    else s += e.wT * 0.3 * f;
    if(e.kind === 'evict' && e.landlord === cid){
      card.landlord.evictions++;
      if(e.verdict === 'for_cause') card.landlord.forCause++;
      else if(e.verdict === 'no_fault') card.landlord.noFault++;
      else card.landlord.wrongful++;
    }
    if(e.kind === 'evict' && (e.tenant === cid ||
        (e.parties || []).indexOf(cid) >= 0)){
      card.tenant.evicted++;
      if(e.verdict === 'for_cause') card.tenant.forCause++;
    }
    if(e.kind === 'evict_filed' && e.landlord === cid)
      card.landlord.filings++;
    if(e.kind === 'dispute_filed' && e.landlord === cid)
      card.landlord.disputesOpen++;
    if(e.kind === 'dispute_resolved' && e.landlord === cid &&
       e.verdict === 'upheld_tenant')
      { card.landlord.disputesLost++; card.landlord.disputesOpen--; }
    if(e.kind === 'dispute_resolved' && e.tenant === cid &&
       e.verdict === 'upheld_tenant')
      card.tenant.disputesWon++;
    if(e.kind === 'dispute_filed' && e.tenant === cid)
      card.tenant.disputesOpen++;
    if(e.kind === 'dispute_resolved' && e.tenant === cid)
      card.tenant.disputesOpen--;
    if(e.kind === 'violation' &&
        (e.tenant === cid || (e.parties || []).indexOf(cid) >= 0))
      card.tenant.violations++;
    if(e.kind === 'vacate' && e.tenant === cid) card.tenant.cleanExits++;
  }
  if(card.landlord.disputesOpen < 0) card.landlord.disputesOpen = 0;
  if(card.tenant.disputesOpen < 0) card.tenant.disputesOpen = 0;
  card.score = Math.max(-100, Math.min(100, Math.round(s)));
  card.band = gsCrepBand(card.score);
  card.line = gsCrepLine(card);
  return card;
}
function gsCrepLine(card){
  const L = card.landlord, T = card.tenant, bits = [];
  if(L.evictions){
    let t = L.evictions + (L.evictions === 1 ? ' tenancy ended'
                                           : ' tenancies ended');
    if(L.wrongful) t += ', ' + L.wrongful + ' without cause';
    else if(L.noFault) t += ', ' + L.noFault + ' no-fault';
    bits.push(t);
  }
  if(L.disputesLost) bits.push(L.disputesLost + ' dispute' +
    (L.disputesLost === 1 ? '' : 's') + ' lost at the board');
  if(L.disputesOpen) bits.push(L.disputesOpen + ' dispute' +
    (L.disputesOpen === 1 ? '' : 's') + ' open');
  if(T.evicted) bits.push('evicted ' + T.evicted + 'x' +
    (T.forCause ? ' (' + T.forCause + ' for cause)' : ''));
  if(T.disputesWon) bits.push('won ' + T.disputesWon + ' dispute' +
    (T.disputesWon === 1 ? '' : 's'));
  return bits.length ? bits.join(' · ') : 'a clean record';
}
/* the spectator board — every subject with public record, worst first */
function gsCharRepBoard(day){
  gsCrepSync();
  const subs = {};
  for(const e of GS_CREP.events){
    if(!e.pub) continue;
    for(const s of [e.landlord, e.tenant])
      if(s) subs[s] = 1;
  }
  return Object.keys(subs).map(cid => {
    const c = gsCharRepCard(cid, day);
    return { who: cid, name: c.name, band: c.band, score: c.score,
      evictions: c.landlord.evictions, wrongful: c.landlord.wrongful,
      disputesOpen: c.landlord.disputesOpen,
      disputesLost: c.landlord.disputesLost, line: c.line };
  }).sort((a, b) => a.score - b.score);
}

/* ---------------- knowledge + stance (no omniscience) ------------- */
function gsCrepLearnedOn(cid, e){
  const told = GS_CREP.known[cid] && GS_CREP.known[cid][e.id];
  if(told != null) return told;
  const base = e.day || gsCrepToday() || '1970-01-01';
  if(cid === e.landlord || cid === e.tenant ||
     (e.parties || []).indexOf(cid) >= 0) return base;
  const h = gsCrepHome(cid);
  if(h && e.bld && h.bld === e.bld) return base;
  if(e.pub && h && e.street && h.street === e.street &&
     typeof gsDateAdd === 'function') return gsDateAdd(base, 1);
  if(e.pub && typeof gsDateAdd === 'function')
    return gsDateAdd(base, 2 + hashString18(cid + '|' + e.id) % 5);
  return null;
}
function gsCharRepKnows(cid, evtId, day){
  gsCrepSync();
  day = day || gsCrepToday();          /* undated = as of now — gossip
                                          not yet arrived stays unknown */
  const e = GS_CREP.events.find(x => x.id === evtId);
  if(!e) return false;
  const learned = gsCrepLearnedOn(cid, e);
  return learned != null && (!day || !learned || learned <= day);
}
function gsCharRepLearned(cid, day){
  gsCrepSync();
  day = day || gsCrepToday();
  const out = {};
  for(const e of GS_CREP.events){
    const learned = gsCrepLearnedOn(cid, e);
    if(learned != null && (!day || !learned || learned <= day))
      out[e.id] = learned;
  }
  return out;
}
/* gossip is a verb: a character who KNOWS an event can tell another */
function gsCharRepTell(fromId, toId, evtId, day){
  gsCrepSync();
  const e = GS_CREP.events.find(x => x.id === evtId);
  if(!e) return { ok: false, reason: 'no_event' };
  if(!gsCharRepKnows(fromId, evtId, day)) return { ok: false, reason: 'does_not_know' };
  gsCrepTeach(toId, evtId, day || gsCrepToday());
  return { ok: true, learnedOn: GS_CREP.known[toId][evtId] };
}
/* how cid feels about subjId — ONLY from events cid has learned.
   A displaced party feels it half again (personal stake). */
function gsCharRepStance(cid, subjId, day){
  gsCrepSync();
  day = day || gsCrepToday();          /* opinions exist as of a day */
  let s = 0; const knows = [];
  for(const e of GS_CREP.events){
    const w = (e.landlord === subjId) ? e.wL
            : (e.tenant === subjId) ? e.wT : null;
    if(w == null) continue;
    const learned = gsCrepLearnedOn(cid, e);
    if(learned == null || (day && learned > day)) continue;
    const f = gsCrepDecay(e.day, day);
    if(f <= 0) continue;
    const personal = (e.parties || []).indexOf(cid) >= 0 &&
                     cid !== subjId ? 1.5 : 1;
    s += w * f * personal;
    knows.push(e.id);
  }
  s = Math.max(-100, Math.min(100, Math.round(s)));
  return { score: s, band: gsCrepBand(s), knows: knows };
}

/* ---------------- the measurable social response ------------------ */
function gsCharRepResponse(landlordId, day){
  gsCrepSync();
  day = day || gsCrepToday();
  const knowers = [], cold = [];
  for(const cid of gsCrepCharIds()){
    if(cid === landlordId) continue;      // the landlord isn't a neighbor
    const st = gsCharRepStance(cid, landlordId, day);
    if(!st.knows.length) continue;
    if(st.score < 0) knowers.push(cid);
    if(st.score <= GS_CREP_TALK) cold.push(cid);
  }
  const complaints = GS_CREP.events.filter(e =>
    e.landlord === landlordId &&
    (e.kind === 'dispute_filed' ||
     (e.kind === 'dispute_resolved' && e.verdict === 'upheld_tenant'))).length;
  return { landlord: landlordId, knowers: knowers, cold: cold,
    complaints: complaints,
    organized: cold.length >= GS_CREP_TALK_N };
}

/* ---------------- behavior hooks (reputation feeds utility) ------- */
/* the paper path in: a character who knows the landlord's record may
   not file at all. Anyone who has ever been displaced by this landlord
   is once-burned — they don't come back. Non-characters with no record
   sail through untouched. */
function gsRepApplyCheck(cid, unitId, day){
  gsCrepSync();
  day = day || gsCrepToday();
  const kind = (typeof gsCharKind === 'function') ? gsCharKind(cid) : null;
  const landlord = gsCrepSubjectOf(unitId);
  const st = gsCharRepStance(cid, landlord, day);
  const hasRecord = GS_CREP.events.some(e =>
    e.tenant === cid || (e.parties || []).indexOf(cid) >= 0);
  if(!kind && !hasRecord) return { willing: true, factor: 1 };
  for(const e of GS_CREP.events){
    if(e.kind !== 'evict' || e.landlord !== landlord) continue;
    if((e.parties || []).indexOf(cid) >= 0 || e.tenant === cid){
      const learned = gsCrepLearnedOn(cid, e);
      if(learned != null && (!day || learned <= day))
        return { willing: false, factor: 0, reason: 'burned_before',
                 stance: st.score };
    }
  }
  const factor = Math.max(0, Math.min(1, 1 + st.score / 50));
  return { willing: st.score > GS_CREP_DECLINE, factor: factor,
           stance: st.score,
           reason: st.score <= GS_CREP_DECLINE ? 'landlord_reputation' : null };
}
/* term-roll + month-to-month: a cold tenant gives notice instead of
   staying. Certain below GS_CREP_LEAVE; hash-gated between TALK and
   LEAVE so the drain is real but not mechanical. Returns true when the
   lease was ended by the tenant. */
function gsRepTermCheck(l, dateStr){
  gsCrepSync();
  const cid = l.tenant_id;
  if((typeof gsCharKind !== 'function') || !gsCharKind(cid)) return false;
  const landlord = gsCrepSubjectOf(l.unit_id);
  const st = gsCharRepStance(cid, landlord, dateStr);
  if(st.score > GS_CREP_TALK) return false;
  const certain = st.score <= GS_CREP_LEAVE;
  const gate = hashString18(cid + '|' + l.unit_id + '|' +
    ((typeof gsPeriodOf === 'function' && dateStr)
      ? gsPeriodOf(dateStr) : (dateStr || ''))) % 100;
  if(!certain && gate >= GS_CREP_LEAVE_P) return false;
  gsCrepFeed('tenant_notice', { unit: l.unit_id,
    address: (typeof gsAddressOfUnit === 'function')
      ? gsAddressOfUnit(l.unit_id) : null,
    tenant: cid, day: dateStr });
  if(typeof gsVacate === 'function') gsVacate(l.unit_id, { by: cid, date: dateStr });
  return true;
}
function gsRepMonthCheck(l, dateStr){
  /* month-to-month tenants use the same decision, just gated harder —
     cold tenants leave within a couple of months, not overnight */
  return gsRepTermCheck(l, dateStr);
}

/* ---------------- SF seed: history already on the books ------------
   The seeded world has paper — the 9457 contested raise, any evicted
   leases, licensed filings — that never went through the feed. Journal
   it with its real dates so decay and knowledge land honestly. */
function gsRepSeedSF(){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return 0;
  if(typeof GS_REG === 'undefined') return 0;
  gsCrepSync();
  let n = 0;
  for(const l of GS_REG.leases){
    if(typeof gsLeaseEnsure === 'function') gsLeaseEnsure(l);
    const landlord = gsCrepSubjectOf(l.unit_id);
    const ownerId = gsCrepOwnerOf(l.unit_id);
    for(const d of l.disputes || []){
      const byLL = d.by === landlord || d.by === ownerId || d.by === 'owner';
      const w = byLL ? GS_CREP_W.dispute_filed_ll : GS_CREP_W.dispute_filed;
      if(gsCrepPush({
        key: 'dsp|' + l.unit_id + '|' + (d.id || (d.kind + '|' + d.since)),
        day: d.since || null, kind: 'dispute_filed', verdict: d.kind || null,
        unit: l.unit_id, landlord, tenant: l.tenant_id,
        parties: [d.by, l.tenant_id].filter(Boolean),
        wL: w.wL, wT: w.wT, pub: true })) n++;
      if(d.status === 'resolved' && d.outcome){
        const rw = GS_CREP_W.dispute_resolved[d.outcome] ||
                   GS_CREP_W.dispute_resolved.settled;
        if(gsCrepPush({
          key: 'dres|' + (d.id || (l.unit_id + '|' + d.kind)),
          day: d.resolvedOn || d.since || null, kind: 'dispute_resolved',
          verdict: d.outcome, unit: l.unit_id, landlord,
          tenant: l.tenant_id, parties: [d.by, l.tenant_id].filter(Boolean),
          wL: rw.wL, wT: rw.wT, pub: true })) n++;
      }
    }
    if(l.status === 'evicted'){
      const exec = (l.notices || []).find(x => x.status === 'executed');
      const verdict = l.noFault ? 'wrongful'
        : (exec && exec.kind === 'termination') ? 'no_fault' : 'for_cause';
      const w = GS_CREP_W.evict[verdict];
      const displaced = [l.tenant_id].concat(l.occupants || []);
      for(const v of l.violations || [])
        if(v.status === 'open' && v.who && displaced.indexOf(v.who) < 0)
          displaced.push(v.who);
      if(gsCrepPush({
        key: 'evict|' + l.unit_id + '|' + l.tenant_id + '|' + (l.end || ''),
        day: l.end || null, kind: 'evict', verdict, unit: l.unit_id,
        landlord, tenant: l.tenant_id, parties: displaced,
        wL: w.wL, wT: w.wT, pub: true })) n++;
    }
    if(l.evictFiled && gsCrepPush({
      key: 'efile|' + l.unit_id + '|' + l.evictFiled.by + '|' + l.evictFiled.on,
      day: l.evictFiled.on || null, kind: 'evict_filed', unit: l.unit_id,
      landlord: l.evictFiled.by, tenant: l.tenant_id,
      parties: [l.evictFiled.by, l.tenant_id].filter(Boolean),
      wL: GS_CREP_W.evict_filed.wL, wT: GS_CREP_W.evict_filed.wT,
      pub: true })) n++;
  }
  return n;
}
if(typeof SF_MODE !== 'undefined' && SF_MODE) gsRepSeedSF();

/* ---------------- audit ---------------- */
function gsCharRepAudit(){
  gsCrepSync();
  const issues = [];
  const ids = {}, keys = {};
  for(const e of GS_CREP.events){
    if(!e.id || ids[e.id]) issues.push('bad/dup id ' + e.id);
    ids[e.id] = 1;
    if(e.key){ if(keys[e.key]) issues.push('dup key ' + e.key);
               keys[e.key] = 1; }
    if(!e.kind) issues.push('no kind ' + e.id);
    if(e.kind === 'evict' &&
       ['for_cause', 'no_fault', 'wrongful'].indexOf(e.verdict) < 0)
      issues.push('bad verdict ' + e.id);
  }
  for(const cid in GS_CREP.known)
    for(const id in GS_CREP.known[cid])
      if(!ids[id]) issues.push('known ghost ' + id);
  /* the public card schema must never grow a place for inner life —
     same ban list the wire enforces */
  if(typeof GS_WIRE_BAN !== 'undefined'){
    const probe = gsCharRepCard('__audit__', null);
    for(const k in probe)
      if(GS_WIRE_BAN.test(k)) issues.push('banned card key ' + k);
  }
  return { ok: issues.length === 0, issues: issues,
           events: GS_CREP.events.length };
}

/* ---------------- persistence ---------------- */
function gsCrepSnapshot(){
  return JSON.stringify({ seq: GS_CREP.seq, events: GS_CREP.events,
    known: GS_CREP.known, talk: GS_CREP.talk, cursor: GS_CREP.cursor });
}
function gsCrepLoad(json){
  try{
    const d = JSON.parse(json);
    if(!d || !Array.isArray(d.events)) return false;
    GS_CREP.seq = d.seq || 0;
    GS_CREP.events.length = 0;
    GS_CREP.events.push.apply(GS_CREP.events, d.events);
    GS_CREP.known = d.known || {};
    GS_CREP.talk = d.talk || {};
    GS_CREP.cursor = d.cursor || 0;
    return true;
  }catch(e){ return false; }
}
function gsCrepReset(){
  GS_CREP.seq = 0; GS_CREP.events.length = 0;
  GS_CREP.known = {}; GS_CREP.talk = {}; GS_CREP.cursor = 0;
}

/* ---------------- bridge surface ---------------- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.gsCharRepCard = (cid, day) => gsCharRepCard(cid, day);
  window.__aiBridge.gsCharRepScore = (cid, day) => gsCharRepScore(cid, day);
  window.__aiBridge.gsCharRepStance = (cid, subj, day) =>
    gsCharRepStance(cid, subj, day);
  window.__aiBridge.gsCharRepResponse = (ll, day) =>
    gsCharRepResponse(ll, day);
  window.__aiBridge.gsCharRepBoard = (day) => gsCharRepBoard(day);
  window.__aiBridge.gsCharRepEvents = (cid) => gsCharRepEvents(cid);
  window.__aiBridge.gsCharRepLearned = (cid, day) =>
    gsCharRepLearned(cid, day);
  window.__aiBridge.gsCharRepKnows = (cid, id, day) =>
    gsCharRepKnows(cid, id, day);
  window.__aiBridge.gsCharRepTell = (a, b, id, day) =>
    gsCharRepTell(a, b, id, day);
  window.__aiBridge.gsFileDispute = (u, k, by, o) =>
    gsFileDispute(u, k, by, o);
  window.__aiBridge.gsResolveDispute = (u, id, oc, o) =>
    gsResolveDispute(u, id, oc, o);
  window.__aiBridge.gsCharRepAudit = () => gsCharRepAudit();
}
