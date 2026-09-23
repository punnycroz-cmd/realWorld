/* =====================================================================
   PART 41 — game systems v6: THE WIRE (the public spectator feed)

   GS_FEED is the request bus's append-only lifecycle log — raw, internal,
   one row per event. THE WIRE is what the world contract
   (world/feed.json + world/history.json) calls the spectator surface: a
   FORMATTED projection of that log into display-safe entries. Raw stays
   raw for the console/debug; the wire is what a camera on the street
   could verify — surface-level only, stable ids, canonical kinds and
   request statuses.

   Laws this module enforces (feed.json display_rules + leases.json
   feed_wording.never + moderation.json feed wording):
   - denied request text is NEVER displayed: the line reads exactly
     "request not approved" (+ reason_code when the denial carried a
     moderation code). The authored note never reaches a wire entry.
   - lease money is private: individual payments, rent amounts, arrears
     balances, and notice/eviction reason text never appear. Suppressed
     events are still counted (audited) — privacy is a policy decision,
     not a dropped packet.
   - admin actions are always attributed and always carry the
     compensation amount (attrs.compensated_cr) when a player was made
     whole.
   - business names render parody-first: canonical feed venues get their
     contract display names; anything else routes through sfDisplayName
     (art/world branch) when present.
   - ids are stable live -> archive: an entry's id never changes, so
     today's wire line is tomorrow's history.json row verbatim.

   State is rebuilt, never trusted: GS_WIRE formats from GS_FEED behind a
   cursor, so a snapshot restore or a missed hook just re-formats.
   ===================================================================== */

/* canonical vocabulary (world/feed.json) — the wire emits a subset;
   move/scene/press/rumor belong to other layers and stay legal kinds. */
const GS_WIRE_KINDS = ['move', 'scene', 'venue', 'weather', 'request',
                       'admin', 'press', 'housing', 'cast', 'quiet'];
const GS_WIRE_STATUS = ['requested', 'in_review', 'approved',
  'approved (modified)', 'running', 'queued', 'resolved', 'refunded',
  'not approved', 'player session ended'];
/* moderation.json reason codes the wire may publish verbatim; the three
   possess-scope structural denials map onto 'possession-scope' so the
   public sees one vocabulary (the class, never the detail). */
const GS_WIRE_REASON = {
  'harm-targeting': 1, 'secret-extraction': 1, 'possession-scope': 1,
  'admin-domain': 1, 'real-business': 1, 'identity-fraud': 1,
  'legal-backstop': 1,
  'gray-zone': 1, 'surface-relationship': 1, 'venue-lock': 1,
  'repeat-pattern': 1, 'real-person-mention': 1, 'appeal-resubmit': 1,
  'first-time-exclusive': 1,
  'possession_ban': 'possession-scope', 'cast_ai_only': 'possession-scope',
  'not_your_character': 'possession-scope',
};
const GS_WIRE_DENY_TEXT = 'request not approved';   // moderation.json, verbatim

/* feed.json venues — internal scene/POI names -> canonical venue ids, and
   the parody display names the contract fixes. Anything unmapped keeps a
   null venue and renders through sfDisplayName when the world/name layer
   is present. */
const GS_WIRE_VENUE_ID = {
  'haus coffee': 'mudhaus', 'mudhaus coffee': 'mudhaus',
  'cafe la boheme': 'mudhaus',
  'taqueria el farolito': 'farolote', 'taqueria el farolote': 'farolote',
  'el farolito bar': 'farolote', 'el farolote bar': 'farolote',
  '500 club': 'club600', 'the 600 club': 'club600', '600 club': 'club600',
  'auerbach hardware': 'auerbach',
  'dolores park cafe': 'perk', 'dolores perk': 'perk',
  'dolores park': 'park', 'park': 'park',
  'clarion alley': 'clarion',
  'mission branch library': 'library', 'library': 'library',
  "malik's mini mart": 'maliks', 'maliks': 'maliks',
  'guerrero market & deli': 'maliks',
  'bi-rite market': 'buyrite', 'buy-rite market': 'buyrite',
  'bi-rite creamery': 'buyrite', 'buy-rite creamery': 'buyrite',
  'the block': 'block', 'block': 'block',
};
const GS_WIRE_VENUE_DISP = {
  mudhaus: 'Mudhaus Coffee', park: 'Dolores Park',
  farolote: 'Taqueria El Farolote', club600: 'The 600 Club',
  auerbach: 'Auerbach Hardware', perk: 'Dolores Perk',
  maliks: "Malik's Mini Mart", clarion: 'Clarion Alley',
  library: 'Mission Branch Library', buyrite: 'Buy-Rite Market',
  block: 'the block',
};

/* lease lifecycle -> wire disposition (leases.json feed_wording):
   'drop' is the never-list — individual payments, amounts, arrears,
   reason text, internal escalations. Everything public uses neutral
   municipal wording; the eviction line is verbatim contract. */
const GS_WIRE_LEASE = {
  apply: 'drop', deny_app: 'drop',
  rent_paid: 'drop', deposit_paid: 'drop', latefee_paid: 'drop',
  fee_paid: 'drop', rent_late: 'drop', rent_raised: 'drop',
  notice_executable: 'drop',
  sign: 'signed', vacate: 'turnover', term_rolled: 'rolled',
  rent_raise_served: 'rent_notice', notice: 'notice',
  notice_cured: 'resolved', inspection: 'inspection',
  violation: 'violation', violation_cured: 'cleared', evict: 'eviction',
};

const GS_WIRE_EVENT_LABEL = {
  block_party: 'a block party', street_fair: 'a street fair',
  farmers_market: 'a farmers market', parade: 'a parade',
  movie_night: 'a movie night', park_cleanup: 'a park cleanup',
  mural_tour: 'a mural tour',
};
const GS_WIRE_WX_LABEL = {
  rain: 'Rain', storm: 'A storm', clear: 'Clear skies',
  fog: 'Fog', heatwave: 'A heatwave',
};
const GS_WIRE_ADMIN_LABEL = {
  revoke: 'a running request was ended',
  mint: 'an address was minted',
  subdivide: 'a unit was subdivided',
  convert: 'a garage conversion was filed',
  merge: 'units were merged',
  retire_unit: 'a unit was retired',
  retire_bld: 'a building was retired',
  registry: 'registry paperwork moved',
};

/* player-authored text may name a real business; on the wire those names
   render parody (the same substitutions the request screen suggests). */
const GS_WIRE_PARODY = [
  [/bi-rite creamery/ig, 'Buy-Rite Creamery'],
  [/bi-rite/ig, 'Buy-Rite'],
  [/tartine/ig, 'Baguette About It'],
  [/delfina/ig, 'Il Delfino'],
  [/dolores park caf[eé]/ig, 'Dolores Perk'],
  [/500 club/ig, 'the 600 Club'],
  [/dandelion/ig, 'Dandy Lion'],
  [/el farolito/ig, 'El Farolote'],
  [/la taqueria/ig, 'La Taquerote'],
  [/foreign cinema/ig, 'Foreign Reels'],
  [/ritual coffee/ig, 'Mission Ritual'],
  [/four barrel/ig, 'Four Barrel Roll'],
  [/philz/ig, "Phil'z"],
  [/mission chinese/ig, 'Mission Chinese-ish'],
  [/wise sons/ig, 'Wise Guys'],
  [/sightglass/ig, 'Sightglass-half-full'],
];
/* keys a secret would have to hide under — mirrors GS_BRIEF_BAN so the
   audit can prove the wire schema never grew a place to put one. */
const GS_WIRE_BAN =
  /(^|_)(seed|secret|drama|belief|memory|memories|grudge|thoughts?|mood|bonds?|spouse|crush|trauma|diary|fear|hidden|private|note)(_|$)/i;

/* ---------------- state ---------------- */
const GS_WIRE = [];                 // formatted public entries, append-only
const GS_WIRE_SEQ = { n: 0 };       // quiet id counter
const GS_WIRE_CURSOR = { n: 0 };    // highest GS_FEED n already formatted
const GS_WIRE_CAP = 480;            // ring cap — deep but bounded history
const GS_WIRE_SUP = { n: 0, by: {} };      // privacy suppressions, audited
const GS_WIRE_FOLLOWS = {};         // 'v:<venue>'|'w:<who>'|'m:<char>' -> 1
const GS_WIRE_META = { lastMin: null };    // wall-min of the last published line
const GS_WIRE_CFG = {
  displayFilter: 'A',   // A redact spans | B withhold notes | C quarantine
  quietMin: 240,        // dead-air threshold for the honest 'quiet' marker
  panel: null,          // panel visibility (null = decide at boot)
};
const GS_WIRE_DOM = { el: null };

function gsWireP2(x){ return (x < 10 ? '0' : '') + x; }
function gsWireP4(n){
  const s = String(n);
  return s.length >= 4 ? s : '0000'.slice(s.length) + s;
}

/* the show runs on SF wall time (the lease layer's convention): t is
   block-time minutes since midnight PT; day is the PT date. Synthetic
   bus minutes still convert deterministically — epoch min 0 lands in
   Dec-1969 PT and nobody is harmed. */
function gsWireClock(min){
  if(min == null || !isFinite(min)) return { t: null, day: null };
  try{
    const p = {};
    for(const q of new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour12: false,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric',
    }).formatToParts(new Date(min * 60000))) p[q.type] = q.value;
    const hh = (+p.hour) % 24;
    return { t: hh * 60 + (+p.minute),
             day: p.year + '-' + gsWireP2(+p.month) + '-' +
                  gsWireP2(+p.day) };
  }catch(e){
    return { t: Math.floor(((min % 1440) + 1440) % 1440), day: null };
  }
}
function gsWireId(n, clock, sub){
  let base;
  if(clock && clock.day){
    const m = clock.day.match(/\d{4}-(\d{2})-(\d{2})/);
    base = m ? 'd' + m[1] + m[2] + '-' + gsWireP4(n) : 'w-' + gsWireP4(n);
  } else base = 'w-' + gsWireP4(n);
  return sub ? base + '-' + sub : base;
}

function gsWireVenueId(name){
  if(!name) return null;
  return GS_WIRE_VENUE_ID[String(name).trim().toLowerCase()] || null;
}
function gsWireDispName(name){
  if(!name) return null;
  const vid = gsWireVenueId(name);
  if(vid) return GS_WIRE_VENUE_DISP[vid] || String(name);
  if(typeof sfDisplayName === 'function'){
    try{ const d = sfDisplayName(name); if(d) return d; }catch(e){}
  }
  return String(name);
}
function gsWireWho(pid){ return pid || 'a player'; }
function gsWireReason(code){
  if(!code) return null;
  const m = GS_WIRE_REASON[code];
  return m === 1 ? code : (typeof m === 'string' ? m : null);
}
function gsWireCharLabel(cid){
  if(!cid) return 'a character';
  return (typeof gsCharName === 'function') ? gsCharName(cid) : String(cid);
}

/* ---------------- the display filter (moderation.json display_filter)
   Player-authored request text reaches the wire only when the request is
   past screening AND the mode allows it:
     A (default): verbatim, deny-tier spans masked, real business names
                  swapped for their parody twins
     B: withheld — the summary line stands alone
     C: quarantine — notes appear only once the request resolves
   Denied/failed/expired requests never display text under any mode. -- */
function gsWireRedact(note){
  let s = String(note);
  for(const pr of GS_WIRE_PARODY) s = s.replace(pr[0], pr[1]);
  if(typeof GS_INTENT_RULES !== 'undefined'){
    for(const rule of GS_INTENT_RULES){
      const c = (typeof GS_SCREEN_CODES !== 'undefined')
        ? GS_SCREEN_CODES[rule.code] : null;
      if(c && c.tier === 'deny') s = s.replace(rule.re, '░░░');
    }
  }
  return s;
}
function gsWireNoteOf(r, status){
  if(!r || !r.params) return null;
  const raw = r.params.note || r.params.intent || r.params.text ||
              r.params.plan || r.params.goal;
  if(typeof raw !== 'string' || !raw.trim()) return null;
  /* the never-display set: anything that did not actually run. */
  if(status === 'not approved' || status === 'refunded') return null;
  if(r.status === 'denied' || r.status === 'failed' ||
     r.status === 'expired') return null;
  if(status === 'in_review' || r.status === 'in_review') return null;
  /* once-denied text stays off the wire even when an appeal overturns
     the run — the action may air; the ask that needed two reads does not */
  if(r.appealOf) return null;
  if(GS_WIRE_CFG.displayFilter === 'B') return null;
  if(GS_WIRE_CFG.displayFilter === 'C' && status !== 'resolved')
    return null;
  return gsWireRedact(raw.trim());
}
function gsWireNoteSuffix(r, status){
  const n = gsWireNoteOf(r, status);
  return n ? ' — "' + n + '"' : '';
}

/* ---------------- summaries — the camera-readable label per request -- */
function gsWireReqSummary(evt, r){
  const p = (r && r.params) || {};
  const dur = (r && r.durationMin != null) ? r.durationMin : null;
  const dTxt = dur != null ? ', ' + dur + ' min' : '';
  switch(evt.kind){
    case 'possess': {
      const cid = evt.target || (r && r.target);
      const nm = (typeof gsCharName === 'function' && cid)
        ? gsCharName(cid) : (cid || 'a hire');
      return 'possess — ' + nm + dTxt;
    }
    case 'weather':
      return 'weather — ' + (p.wx || 'a sky change') + dTxt;
    case 'street_event': {
      const lbl = GS_WIRE_EVENT_LABEL[p.event] || (p.event || 'an event');
      const at = p.at ? ' at ' + gsWireDispName(p.at) : '';
      return 'event — ' + lbl + at + dTxt;
    }
    case 'hire': return 'hire — a new face joins the block';
    case 'listing': {
      const ad = (r && typeof gsAddressOfUnit === 'function')
        ? gsAddressOfUnit(r.target) : null;
      return 'listing — ' + (ad || 'a unit on the board');
    }
    case 'buy': {
      const ad = (r && typeof gsAddressOfUnit === 'function')
        ? gsAddressOfUnit(r.target) : null;
      return 'purchase — ' + (ad || 'a unit');
    }
    default:
      return (evt.kind || 'request') + dTxt;
  }
}
function gsWireReqVenue(evt, r){
  const p = (r && r.params) || {};
  return gsWireVenueId(p.at) || null;
}
function gsWireReqMentions(evt, r){
  if(evt.kind === 'possess' && (evt.target || (r && r.target)))
    return [evt.target || r.target];
  return null;
}

/* ---------------- lease wording (contract lines, neutral) ----------- */
function gsWireLeaseLines(evt, mk){
  const pol = GS_WIRE_LEASE[evt.action];
  const addr = evt.address || 'a Mission address';
  const tenant = evt.tenant || null;
  switch(pol){
    case 'signed': {
      /* a move-in names the tenant only when they're cast — a new face
         carrying boxes is camera-visible; paperwork ids are not. */
      const named = tenant && typeof gsCharKind === 'function' &&
                    !!gsCharKind(tenant);
      return [mk('housing', named
        ? 'new tenancy — ' + gsWireCharLabel(tenant) + ' at ' + addr
        : 'new tenancy — ' + addr,
        { who: tenant, mentions: named ? [tenant] : null })];
    }
    case 'turnover':
      return [mk('housing', 'unit turning over — ' + addr +
        ' back on the board', { who: tenant })];
    case 'rolled':
      return [mk('housing', 'tenancy rolls month-to-month — ' + addr)];
    case 'rent_notice':
      return [mk('housing', 'rent notice served — ' + addr)];
    case 'notice':
      /* only the cure-or-quit rung is feed-visible (leases.json notice
         ladder); the notice kind arrives as evt.kind via the emit's
         extra fields — earlier rungs stay in the tenant file. */
      if(evt.kind !== 'cure_or_quit') return [];
      return [mk('housing', 'housing notice posted — ' + addr)];
    case 'resolved':
      return [mk('housing', 'housing notice resolved — ' + addr)];
    case 'inspection':
      return [mk('housing', 'an inspection visit — ' + addr)];
    case 'violation':
      /* a DISCOVERED violation is municipal record; the violator's name
         and the violation kind stay off the public line. */
      return [mk('housing', 'a housing inspector logged a note — ' + addr)];
    case 'cleared':
      return [mk('housing', 'a housing note cleared — ' + addr)];
    case 'eviction':
      /* verbatim contract — never the debt, never the reason text */
      return [mk('admin', 'admin action — tenancy ended at ' + addr,
        { who: 'admin' })];
    default:
      return [];                       // 'drop' + unmapped: fail closed
  }
}

/* ---------------- the formatter: one bus event -> 0..n wire lines ----
   PURE: no side effects. The caller (gsWireOnEvent / gsWireAudit) counts
   zero-line events as suppressions so "the feed saw it and the privacy
   policy withheld it" stays an auditable fact, not a dropped packet. */
function gsWireFormat(evt){
  if(!evt || evt.n == null) return [];
  const r = evt.req
    ? ((typeof gsRequestById === 'function') ? gsRequestById(evt.req) : null)
    : null;
  const clock = gsWireClock(evt.min != null ? evt.min
    : ((typeof gsNowMin === 'function') ? gsNowMin() : null));
  let sub = 0;
  const mk = (kind, text, o) => {
    o = o || {};
    const e = {
      id: gsWireId(evt.n, clock, sub || 0),
      n: evt.n, t: clock.t, day: clock.day,
      kind: kind, text: text,
      venue: o.venue || null,
      who: o.who != null ? o.who : null,
    };
    sub++;
    if(evt.req) e.req = evt.req;   // request correlation (internal id)
    if(o.status) e.status = o.status;
    if(o.reason) e.reason_code = o.reason;
    if(o.attempt) e.attempt = o.attempt;
    if(o.mentions && o.mentions.length) e.mentions = o.mentions;
    const attrs = {};
    if(o.credits != null) attrs.credits = o.credits;
    if(o.compensated != null) attrs.compensated_cr = o.compensated;
    if(o.surge != null) attrs.surge = o.surge;
    if(o.discount != null) attrs.discount = o.discount;
    if(Object.keys(attrs).length) e.attrs = attrs;
    return e;
  };
  const sum = () => gsWireReqSummary(evt, r);

  switch(evt.type){

    case 'approve': {
      const out = [mk('request', sum() + gsWireNoteSuffix(r, 'running'),
        { status: 'running', who: evt.player, credits: evt.price,
          surge: evt.surge, discount: evt.discount,
          venue: gsWireReqVenue(evt, r),
          mentions: gsWireReqMentions(evt, r) })];
      /* player-called sky: the weather change itself is a feed kind,
         always attributed (feed.json event_kinds). */
      if(evt.kind === 'weather' && r && r.params && r.params.wx){
        const wl = GS_WIRE_WX_LABEL[r.params.wx] || 'New skies';
        out.push(mk('weather', wl + ' over the Mission — called by ' +
          gsWireWho(evt.player), { who: evt.player }));
      }
      /* a listing going live is a housing beat, contract wording */
      if(evt.kind === 'listing' && r &&
         typeof gsAddressOfUnit === 'function'){
        const ad = gsAddressOfUnit(r.target);
        if(ad) out.push(mk('housing', 'Listed — ' + ad,
          { who: evt.player }));
      }
      return out;
    }

    case 'queue':
      return [mk('request', sum() + gsWireNoteSuffix(r, 'queued') +
        ' — in line (#' + (evt.pos || '?') + ')',
        { status: 'queued', who: evt.player, credits: evt.price,
          surge: evt.surge, discount: evt.discount,
          venue: gsWireReqVenue(evt, r),
          mentions: gsWireReqMentions(evt, r) })];

    case 'deny':
      /* verbatim contract wording — never the note, never the detail.
         reason_code is the moderation class when there is one. */
      return [mk('request', GS_WIRE_DENY_TEXT,
        { status: 'not approved', who: evt.player,
          reason: gsWireReason(evt.reason),
          attempt: evt.kind })];

    case 'expire':
      return [mk('request', sum() + ' — lapsed, fully refunded',
        { status: 'refunded', who: evt.player, credits: evt.refund })];

    case 'fail':
      return [mk('request', sum() + ' — could not run, refunded',
        { status: 'refunded', who: evt.player, credits: evt.refund })];

    case 'complete': {
      const out = [mk('request', sum() + gsWireNoteSuffix(r, 'resolved') +
        ' — wrapped', { status: 'resolved', who: evt.player,
          venue: gsWireReqVenue(evt, r),
          mentions: gsWireReqMentions(evt, r) })];
      /* the sky returns to nature when a weather call ends */
      if(evt.kind === 'weather' && r && r.params && r.params.wx)
        out.push(mk('weather', 'the sky drifts back — ' +
          gsWireWho(evt.player) + "'s " + (r.params.wx || 'weather') +
          ' call wrapped', { who: evt.player }));
      return out;
    }

    case 'cancel': {
      const admin = (evt.by === 'admin' || evt.by === 'owner');
      return [mk('request', sum() + (admin
          ? ' — ended by admin, player compensated'
          : ' — cancelled, refunded'),
        { status: 'refunded', who: evt.player,
          credits: evt.refund,
          compensated: admin ? evt.refund : null })];
    }

    case 'review':
      if(evt.action === 'in_review')
        return [mk('request', sum() + ' — in human review',
          { status: 'in_review', who: evt.player,
            reason: gsWireReason(evt.code) })];
      if(evt.action === 'approved')
        return [mk('request', sum() + gsWireNoteSuffix(r, 'approved') +
          ' — cleared review',
          { status: 'approved', who: evt.player })];
      /* v7: a reviewer may approve with narrowed scope — the wire's own
         status vocabulary already has the words for it */
      if(evt.action === 'approved_modified')
        return [mk('request', sum() + gsWireNoteSuffix(r, 'approved') +
          ' — cleared review, trimmed',
          { status: 'approved (modified)', who: evt.player })];
      return [];                      // 'denied' is covered by the deny line

    case 'warn':
      /* low-credit beats stay qualitative — the balance is the player's
         business, the wrap-up warning is the audience's */
      return [mk('request', sum() + ' — low on credits, may wrap early',
        { who: evt.player,
          mentions: (r && r.kind === 'possess' && evt.target)
            ? [evt.target] : null })];

    case 'session':
      return [mk('request', 'two players, one scene — ' +
        (evt.players || []).join(' + ') + ' sharing the block',
        { who: (evt.players || [])[0] || null,
          mentions: evt.chars || null })];

    case 'hire':
      if(evt.action === 'release')
        return [mk('cast', gsWireCharLabel(evt.charId || evt.target) +
          ' left the block',
          { who: evt.player,
            mentions: (evt.charId || evt.target)
              ? [evt.charId || evt.target] : null })];
      /* v8: the personnel beats — a job start and a re-door are cast
         news the same way an arrival is */
      if(evt.action === 'job_start')
        return [mk('cast', gsWireCharLabel(evt.charId) +
          ' starts a new job — ' + (evt.detail || 'on the block'),
          { who: evt.player,
            mentions: evt.charId ? [evt.charId] : null })];
      if(evt.action === 'rehouse')
        return [mk('cast', gsWireCharLabel(evt.charId) +
          ' finds a new door' + (evt.detail ? ' — ' + evt.detail : ''),
          { who: evt.player,
            mentions: evt.charId ? [evt.charId] : null })];
      return [mk('cast', 'a new face on the block — ' +
        gsWireCharLabel(evt.charId) + ' joins the cast' +
        (evt.detail ? ' — ' + evt.detail : ''),
        { who: evt.player,
          mentions: evt.charId ? [evt.charId] : null })];

    case 'sale':
      /* contract wording — the price never prints */
      return [mk('housing', 'Sold — ' + (evt.address || 'a Mission place') +
        ' changes hands',
        { who: evt.player,
          mentions: evt.buyer ? [evt.buyer] : null })];

    case 'possess':
      if(evt.action === 'begin')
        return [mk('request', gsWireWho(evt.player) +
          ' takes the wheel — ' + gsWireCharLabel(evt.char),
          { status: 'running', who: evt.player,
            mentions: evt.char ? [evt.char] : null })];
      if(evt.action === 'end')
        return [mk('request', gsWireCharLabel(evt.char) +
          ' is back on their own two feet' +
          (evt.endReason === 'admin_revoked' ? ' (admin handoff)' : ''),
          { status: 'player session ended', who: evt.player,
            mentions: evt.char ? [evt.char] : null })];
      if(evt.action === 'winddown')
        return [mk('request', 'handoff soon — ' + gsWireCharLabel(evt.char) +
          ' back to themselves in ~' + Math.ceil(evt.leftMin || 5) + ' min',
          { who: evt.player, mentions: evt.char ? [evt.char] : null })];
      if(evt.action === 'spend')
        /* the character's own dollars moving IS camera-visible (the
           briefing promises "everything you do is on the public feed") —
           but a rent settlement prints no amount: lease money stays
           private even when a driver pays it. */
        return [mk('request', evt.settled === 'rent'
          ? gsWireCharLabel(evt.char) + ' paid the landlord — the rent book moved'
          : gsWireCharLabel(evt.char) + ' paid out $' + (evt.amt || 0),
          { who: evt.player, mentions: evt.char ? [evt.char] : null })];
      return [];

    case 'lease':
      return gsWireLeaseLines(evt, mk);

    case 'admin': {
      const lbl = GS_WIRE_ADMIN_LABEL[evt.action] ||
        String(evt.action || 'paperwork').replace(/_/g, ' ');
      let text = 'admin action — ' + lbl;
      if(evt.address) text += ' at ' + evt.address;
      if(evt.compensated_cr != null) text += ' — player compensated';
      return [mk('admin', text, { who: 'admin',
        compensated: evt.compensated_cr })];
    }

    default:
      return [];    // unknown event type — fail closed, audit counts it
  }
}

/* ---------------- ingestion ---------------- */
function gsWirePush(e){
  GS_WIRE.push(e);
  if(GS_WIRE.length > GS_WIRE_CAP)
    GS_WIRE.splice(0, GS_WIRE.length - GS_WIRE_CAP);
  if(GS_WIRE_DOM.el) gsWirePanelSync();
}
function gsWireOnEvent(evt){
  if(!evt || evt.n == null) return;
  if(evt.n <= GS_WIRE_CURSOR.n) return;
  const lines = gsWireFormat(evt);
  if(lines.length){
    for(const e of lines) gsWirePush(e);
    GS_WIRE_META.lastMin = (evt.min != null) ? evt.min
      : ((typeof gsNowMin === 'function') ? gsNowMin() : null);
  } else {
    /* considered, withheld — the audit can reconcile every feed row */
    GS_WIRE_SUP.n++;
    const k = evt.type + ':' + (evt.action || evt.kind || '');
    GS_WIRE_SUP.by[k] = (GS_WIRE_SUP.by[k] || 0) + 1;
  }
  GS_WIRE_CURSOR.n = evt.n;
}
if(typeof gsBusOnEvent === 'function') gsBusOnEvent(gsWireOnEvent);

/* catch-up: format any feed rows the hook missed (post-load rebuilds,
   pre-module emits). The wire is a pure projection — replaying is safe. */
function gsWireSync(){
  const feed = (typeof GS_FEED !== 'undefined') ? GS_FEED : [];
  if(!feed.length) return;
  if(feed[feed.length - 1].n <= GS_WIRE_CURSOR.n) return;
  for(const evt of feed)
    if(evt.n > GS_WIRE_CURSOR.n) gsWireOnEvent(evt);
}

/* quiet — the honest-empty marker (feed.json: the feed may go quiet and
   says so). One per silent stretch; never the first-ever line. */
function gsWireTick(now){
  if(!GS_WIRE.length || now == null) return;
  const last = GS_WIRE[GS_WIRE.length - 1];
  if(last.kind === 'quiet') return;          // one marker per stretch
  const refMin = (GS_WIRE_META.lastMin != null) ? GS_WIRE_META.lastMin : now;
  if((now - refMin) < GS_WIRE_CFG.quietMin) return;
  const clock = gsWireClock(now);
  gsWirePush({
    id: 'w-q' + (++GS_WIRE_SEQ.n), n: GS_WIRE_CURSOR.n + 0.5,
    t: clock.t, day: clock.day, kind: 'quiet',
    venue: null, who: null,
    text: 'a quiet stretch on the block — the feed says so',
  });
  GS_WIRE_META.lastMin = now;
}

/* ---------------- reads ---------------- */
function gsWireFollowed(e){
  const F = GS_WIRE_FOLLOWS;
  if(e.venue && F['v:' + e.venue]) return true;
  if(e.who && F['w:' + e.who]) return true;
  if(e.mentions) for(const m of e.mentions) if(F['m:' + m]) return true;
  return false;
}
function gsWire(opts){
  gsWireSync();
  opts = opts || {};
  let a = GS_WIRE;
  if(opts.kind)     a = a.filter(e => e.kind === opts.kind);
  if(opts.status)   a = a.filter(e => e.status === opts.status);
  if(opts.venue)    a = a.filter(e => e.venue === opts.venue);
  if(opts.who)      a = a.filter(e => e.who === opts.who);
  if(opts.day)      a = a.filter(e => e.day === opts.day);
  if(opts.mention)  a = a.filter(e => e.mentions &&
                                     e.mentions.indexOf(opts.mention) >= 0);
  if(opts.attempt)  a = a.filter(e => e.attempt === opts.attempt);
  if(opts.reason)   a = a.filter(e => e.reason_code === opts.reason);
  if(opts.followedOnly) a = a.filter(gsWireFollowed);
  if(opts.since != null)  a = a.filter(e => e.n > opts.since);
  if(opts.before != null) a = a.filter(e => e.n < opts.before);
  const limit = (opts.limit != null) ? opts.limit : a.length;
  return a.slice(-limit);
}
function gsWireTail(n){ gsWireSync(); return GS_WIRE.slice(-(n || 30)); }
function gsWireSince(n){ return gsWire({ since: n }); }
/* history-style paging: entries older than a cursor, newest-first */
function gsWirePage(opts){
  opts = opts || {};
  const lim = opts.limit || 30;
  const a = gsWire({ before: opts.before, kind: opts.kind,
                     venue: opts.venue, day: opts.day });
  const page = a.slice(-lim);
  return { entries: page,
           next: page.length ? page[0].n : null,
           oldest: a.length <= page.length };
}
function gsWireText(e){
  const hh = (e.t != null)
    ? gsWireP2(Math.floor(e.t / 60)) + ':' + gsWireP2(e.t % 60)
    : '--:--';
  /* the contract's denied line already reads 'request not approved' —
     no need to stamp the status twice */
  const st = (e.status && e.text.indexOf(e.status) < 0)
    ? ' (' + e.status + ')' : '';
  return hh + ' ' + e.kind + ' — ' + e.text + st;
}

/* spectator follow pins — free forever, just a filter on the wire */
function gsWireFollow(key, on){
  if(!key) return false;
  if(on === false) delete GS_WIRE_FOLLOWS[key];
  else GS_WIRE_FOLLOWS[key] = 1;
  return true;
}
function gsWireFollows(){ return Object.keys(GS_WIRE_FOLLOWS); }

/* ---------------- stats / vocabulary / audit ---------------- */
function gsWireStats(){
  gsWireSync();
  const byKind = {}, byStatus = {}, byReason = {};
  for(const e of GS_WIRE){
    byKind[e.kind] = (byKind[e.kind] || 0) + 1;
    if(e.status) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    if(e.reason_code)
      byReason[e.reason_code] = (byReason[e.reason_code] || 0) + 1;
  }
  return {
    total: GS_WIRE.length, cursor: GS_WIRE_CURSOR.n,
    suppressed: GS_WIRE_SUP.n,
    suppressedBy: Object.assign({}, GS_WIRE_SUP.by),
    byKind: byKind, byStatus: byStatus, byReason: byReason,
    follows: gsWireFollows(), displayFilter: GS_WIRE_CFG.displayFilter,
  };
}
function gsWireVocabulary(){
  return { kinds: GS_WIRE_KINDS.slice(), statuses: GS_WIRE_STATUS.slice(),
    reasonCodes: Object.keys(GS_WIRE_REASON)
      .map(k => GS_WIRE_REASON[k] === 1 ? k : GS_WIRE_REASON[k]),
    denyText: GS_WIRE_DENY_TEXT,
    venues: Object.assign({}, GS_WIRE_VENUE_DISP),
    leasePolicy: Object.assign({}, GS_WIRE_LEASE) };
}
function gsWireSetFilter(mode){
  if(mode !== 'A' && mode !== 'B' && mode !== 'C') return false;
  GS_WIRE_CFG.displayFilter = mode;
  return true;
}

/* prove the wire is clean: schema, ordering, privacy. Returns
   {ok, issues[]} — issues are strings for the autotest/console. */
function gsWireAudit(){
  gsWireSync();
  const issues = [];
  const ids = {};
  let prevN = -Infinity;
  /* denied request text must never appear on the wire — collect the
     authored strings of every DENIED request and grep. (Expired/failed
     ones showed their note while queued — that display was legal; only
     denials are never-display.) */
  const deniedNotes = [];
  if(typeof GS_REQ !== 'undefined' && GS_REQ.reqs){
    for(const r of GS_REQ.reqs){
      if(r.status !== 'denied') continue;
      const p = r.params || {};
      for(const k of ['note', 'intent', 'text', 'plan', 'goal']){
        const v = p[k];
        if(typeof v === 'string' && v.trim().length >= 4)
          deniedNotes.push(v.trim());
      }
    }
  }
  for(const e of GS_WIRE){
    if(!e.id || ids[e.id]) issues.push('bad-or-dup id ' + e.id);
    ids[e.id] = 1;
    if(e.n < prevN) issues.push('non-monotonic n at ' + e.id);
    prevN = e.n;
    if(GS_WIRE_KINDS.indexOf(e.kind) < 0)
      issues.push('bad kind ' + e.kind);
    if(typeof e.text !== 'string' || !e.text)
      issues.push('empty text at ' + e.id);
    if(e.status && GS_WIRE_STATUS.indexOf(e.status) < 0)
      issues.push('bad status ' + e.status);
    if(e.reason_code && gsWireReason(e.reason_code) !== e.reason_code)
      issues.push('bad reason_code ' + e.reason_code);
    for(const k in e)
      if(GS_WIRE_BAN.test(k)) issues.push('banned key ' + k + ' at ' + e.id);
    /* money never prints on housing/admin lines (leases.json never-list)
       — amounts live in attrs.credits/compensated_cr only */
    if((e.kind === 'housing' || e.kind === 'admin') &&
       /[$]\s*\d|\b\d+\s?(cr|credits|dollars|bucks)\b/i.test(e.text))
      issues.push('money in text at ' + e.id);
    for(const dn of deniedNotes)
      if(e.text && e.text.indexOf(dn) >= 0)
        issues.push('denied text leaked at ' + e.id);
  }
  /* every bus event was considered: suppression count must equal the
     number of feed rows the formatter returns nothing for */
  if(typeof GS_FEED !== 'undefined'){
    let want = 0;
    for(const evt of GS_FEED)
      if(!gsWireFormat(evt).length) want++;
    if(want !== GS_WIRE_SUP.n)
      issues.push('suppression drift: ' + want + ' want vs ' +
                  GS_WIRE_SUP.n + ' counted');
  }
  return { ok: issues.length === 0, issues: issues,
           total: GS_WIRE.length, suppressed: GS_WIRE_SUP.n };
}

/* ---------------- archive (world/history.json shape) ----------------
   Day objects reuse the live ids verbatim — the archive is the wire
   replayed, so a line a spectator saw live cites identically forever. */
function gsWireDays(){
  gsWireSync();
  const seen = {}, out = [];
  for(const e of GS_WIRE)
    if(e.day && !seen[e.day]){ seen[e.day] = 1; out.push(e.day); }
  return out;
}
function gsWireArchiveDay(day){
  return { day: day,
    events: gsWire({ day: day }).map(e => Object.assign({}, e)) };
}
function gsWireArchive(){
  return gsWireDays().map(gsWireArchiveDay);
}

/* ---------------- the DOM panel (read-only viewer surface) ----------
   Plain, self-built, art-branch-friendly: a translucent text column the
   renderer can restyle or replace. No canvas, no renderer edits. Auto-
   shows on the live SF build only — never under ?test, never medieval
   unless asked (?wire=1); ?wire=0 forces off. */
function gsWirePanelEl(){
  if(GS_WIRE_DOM.el) return GS_WIRE_DOM.el;
  if(typeof document === 'undefined' || !document.createElement)
    return null;
  try{
    const el = document.createElement('div');
    el.id = 'gs-wire';
    el.style.cssText =
      'position:fixed;right:10px;top:10px;width:308px;max-height:46vh;' +
      'overflow:hidden;z-index:60;pointer-events:none;' +
      'font:11px/1.55 ui-monospace,Menlo,Consolas,monospace;' +
      'color:#cfe3d0;background:rgba(7,11,15,.62);' +
      'border-left:2px solid #5a8f6a;padding:6px 9px;white-space:pre-wrap;';
    (document.body || document.documentElement).appendChild(el);
    GS_WIRE_DOM.el = el;
    return el;
  }catch(e){ return null; }
}
function gsWirePanelSync(){
  const el = GS_WIRE_DOM.el;
  if(!el) return;
  const lines = gsWireTail(22).map(gsWireText);
  el.textContent = '— THE WIRE —\n' +
    (lines.length ? lines.join('\n') : 'a quiet block');
}
function gsWireShow(on){
  GS_WIRE_CFG.panel = on !== false;
  const el = gsWirePanelEl();
  if(el){ el.style.display = GS_WIRE_CFG.panel ? 'block' : 'none';
          if(GS_WIRE_CFG.panel) gsWirePanelSync(); }
  return GS_WIRE_CFG.panel;
}
if(typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('DOMContentLoaded', function(){
    try{
      const q = (typeof location !== 'undefined' && location.search) || '';
      if(/[?&]wire=0\b/.test(q)) return;
      const sf = (typeof SF_MODE !== 'undefined') && SF_MODE;
      if((sf && !/[?&]test\b/.test(q)) || /[?&]wire=1\b/.test(q))
        gsWireShow(true);
    }catch(e){}
  });
}

/* ---------------- persistence ---------------- */
function gsWireSnapshot(){
  return { entries: GS_WIRE.slice(), cursor: GS_WIRE_CURSOR.n,
    seq: GS_WIRE_SEQ.n, follows: Object.assign({}, GS_WIRE_FOLLOWS),
    filter: GS_WIRE_CFG.displayFilter,
    sup: { n: GS_WIRE_SUP.n, by: Object.assign({}, GS_WIRE_SUP.by) },
    quietMin: GS_WIRE_CFG.quietMin };
}
function gsWireLoad(d){
  GS_WIRE.length = 0;
  for(const k in GS_WIRE_FOLLOWS) delete GS_WIRE_FOLLOWS[k];
  GS_WIRE_SUP.n = 0; GS_WIRE_SUP.by = {};
  GS_WIRE_CURSOR.n = 0; GS_WIRE_META.lastMin = null;
  if(d && Array.isArray(d.entries)){
    GS_WIRE.push.apply(GS_WIRE, d.entries);
    GS_WIRE_CURSOR.n = d.cursor || (d.entries.length
      ? Math.floor(d.entries[d.entries.length - 1].n) : 0);
    GS_WIRE_SEQ.n = d.seq || 0;
    if(d.follows) Object.assign(GS_WIRE_FOLLOWS, d.follows);
    if(d.filter) GS_WIRE_CFG.displayFilter = d.filter;
    if(d.sup){ GS_WIRE_SUP.n = d.sup.n || 0;
               GS_WIRE_SUP.by = d.sup.by || {}; }
    if(d.quietMin) GS_WIRE_CFG.quietMin = d.quietMin;
  }
  /* no wire data in the snapshot (pre-v6 saves): cursor stays 0 and the
     next gsWireSync rebuilds the whole wire from the loaded feed */
}
function gsWireReset(){
  GS_WIRE.length = 0; GS_WIRE_CURSOR.n = 0; GS_WIRE_SEQ.n = 0;
  GS_WIRE_SUP.n = 0; GS_WIRE_SUP.by = {}; GS_WIRE_META.lastMin = null;
  for(const k in GS_WIRE_FOLLOWS) delete GS_WIRE_FOLLOWS[k];
}

/* ---------------- bridge surface (the spectator endpoint) ----------- */
if(typeof window !== 'undefined' && window.__aiBridge){
  const B = window.__aiBridge;
  B.gsWire = (o) => gsWire(o);
  B.gsWireTail = (n) => gsWireTail(n);
  B.gsWireSince = (n) => gsWireSince(n);
  B.gsWirePage = (o) => gsWirePage(o);
  B.gsWireText = (e) => gsWireText(e);
  B.gsWireFollow = (k, on) => gsWireFollow(k, on);
  B.gsWireFollows = () => gsWireFollows();
  B.gsWireShow = (on) => gsWireShow(on);
  B.gsWireSetFilter = (m) => gsWireSetFilter(m);
  B.gsWireStats = () => gsWireStats();
  B.gsWireAudit = () => gsWireAudit();
  B.gsWireVocabulary = () => gsWireVocabulary();
  B.gsWireDays = () => gsWireDays();
  B.gsWireArchiveDay = (d) => gsWireArchiveDay(d);
}
