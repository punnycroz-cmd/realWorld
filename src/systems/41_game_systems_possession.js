/* =====================================================================
   PART 41F: GAME SYSTEMS — POSSESSION (the stage door)

   rw-game-design-2026-09-22 §7 + §11: a player may possess ONLY the
   character they hired — nobody else's, nobody's tenant, and never the
   landlord or any of the eight mains. While possessed, the character's
   AI brain is suspended; at the hard cap control returns gracefully.
   The briefing is public-record only: profile, surface relationships,
   daily routine — drama seeds and secrets never enter it.

   v5 turns possession from a flag-flip into a full session:
   - Hired characters get a real body at hire time: a villager pawn with
     a deterministic generated look (DESIGNS + nvBuildFrameSet, same art
     pipeline as the cast), a thin role-driven routine anchored to their
     real lease's door, and isNPC brains — possessable means walkable.
   - Sessions are metered records: GS_POSSESS entries carry prevNPC,
     endMin, dollars spent and the pickup cell; a wind-down warning hits
     the feed 5 min out; every session ends in the driving record
     (GS_POSSESS_LOG) with an endReason and a rent-risk flag.
   - Handoff is honest on every path — timeout, player cancel, admin
     revoke, queue promotion, snapshot reload, even an orphaned session
     whose request vanished (the sweep releases the body, never leaves a
     driven ghost).
   - The driver acts through in-world verbs only: gsPossessDrive sets a
     click-move waypoint (the pawn walks there under player-pawn physics)
     and gsPossessPay spends the character's OWN game dollars through the
     real ledger — rent-aware, consequence-real, feed-visible. Never
     mind-control: no dialogue injection, no thoughts touched.
   - Intent screening (pipeline §11.3/§11.4): request text is classified
     before billing. Deny-tier intents (harm-targeting, secret-extraction,
     possession-scope, admin-domain, real-business, identity-fraud,
     legal-backstop) refuse up front — denied requests never bill.
     Review-tier hits (gray-zone wording, repeat-pattern history,
     appeal resubmissions) park the request in_review until a human
     resolves it or the review window lapses (auto-refund). Reason codes
     mirror world/moderation.json so bus, feed, and console agree.

   Denial vocabulary: 'possession_ban' (core cast, absolute — incl. the
   owner), 'cast_ai_only' (ambient cast — open decision §9.2), and
   'not_your_character' (someone else's hire or no hire at all — the
   system does not leak which).
   ===================================================================== */

/* ---- session constants ---- */
const GS_POSSESS_WIND_MIN = 5;    // wind-down warning threshold
/* v7: a driver can spend the character's dollars, but the card has a
   limit — non-rent spend is capped per session so a possession can't
   drain a wallet to a stranger in one sitting. Rent settlement bypasses
   the cap: paying debts is never grief. And payees must exist — a
   character, the landlord, or a dollar account already on the books. */
const GS_POSSESS_SPEND_MAX = 500;
const GS_POSSESS_LOG = [];        // the driving record — append-only
const GS_PLOG_SEQ = { n: 0 };
const GS_PLOG_MAX = 240;          // ring cap — plenty of show history

/* =====================================================================
   identity — who is a character, in show terms
   ===================================================================== */
function gsCharKind(cid){
  if(!cid) return null;
  if(typeof GS_CORE_CAST !== 'undefined' && GS_CORE_CAST[cid]) return 'core';
  if(typeof GS_HIRED !== 'undefined' && GS_HIRED[cid]) return 'hired';
  if(typeof NV_CAST !== 'undefined' &&
     NV_CAST.some(c => c.id === cid)) return 'ambient';
  return null;
}
function gsCharName(cid){
  const h = (typeof GS_HIRED !== 'undefined') ? GS_HIRED[cid] : null;
  if(h && h.name) return h.name;
  if(typeof NV_CAST !== 'undefined'){
    const c = NV_CAST.find(c => c.id === cid);
    if(c) return c.name || c.id;
  }
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  return (v && v.name) || String(cid);
}

/* why can't this player possess this character — null means they can */
function gsPossessDeny(cid, playerId){
  if(typeof GS_CORE_CAST !== 'undefined' && GS_CORE_CAST[cid])
    return 'possession_ban';                      // absolute — incl. owner
  if(gsCharKind(cid) === 'ambient')
    return 'cast_ai_only';                        // design §9.2
  if(gsHiredOwner(cid) !== playerId) return 'not_your_character';
  /* v9: possession needs the owner online to bill AND to drive — a
     queued session can't promote into a player who isn't there, and
     a lingering disconnect is still nobody behind the wheel. */
  if(typeof gsPresenceOf === 'function' &&
     gsPresenceOf(playerId) !== 'online') return 'owner_offline';
  return null;
}
function gsPossessGate(cid, playerId){
  const d = gsPossessDeny(cid, playerId);
  return d === null ? true : d;
}

/* =====================================================================
   intent screening — pipeline §11.3. Reads ONLY the request's own text
   (never the AI, never the world). Blocks: targeted harm/humiliation/
   destruction, the legal backstop, and secret-extraction phrasing. A
   deterministic lexicon — honest about being a screen, not a judge.
   ===================================================================== */
/* reason codes mirror world/moderation.json + world/screen.js so the bus,
   the feed, and the reviewer console speak one vocabulary. deny-tier codes
   refuse before billing; review-tier codes park the request in_review for
   a human resolution (design §11.4) — never silently run, never billed
   into a denial. */
const GS_SCREEN_CODES = {
  'harm-targeting':      { tier: 'deny',  feed: 'request not approved' },
  'secret-extraction':   { tier: 'deny',  feed: 'request not approved' },
  'possession-scope':    { tier: 'deny',  feed: 'request not approved' },
  'admin-domain':        { tier: 'deny',  feed: 'request not approved' },
  'real-business':       { tier: 'deny',  feed: 'request not approved' },
  'identity-fraud':      { tier: 'deny',  feed: 'request not approved' },
  'legal-backstop':      { tier: 'deny',  feed: 'request not approved',
                           legal: true },
  'gray-zone':           { tier: 'review' },
  'surface-relationship':{ tier: 'review' },
  'venue-lock':          { tier: 'review' },
  'repeat-pattern':      { tier: 'review' },
  'real-person-mention': { tier: 'review' },
  'appeal-resubmit':     { tier: 'review' },
};

/* ordered rules — first match wins (mirrors world/screen.js RULES). The
   haystack is the request's player-authored strings only. */
const GS_INTENT_RULES = [
  { code: 'legal-backstop',
    re: /\b(doxx?|swat|real (home )?address|social security|credit card number|password|kill (you|yourself)|i('ll| will) (find|hurt) you|find where (s?he|they|you) lives?|bomb threat|csam)\b/i },
  { code: 'harm-targeting',
    re: /\b(kill|murder|burn(?! ?off|-?off)|destroy|ruin|wreck|humiliate|embarrass|hurt|harm|punish|maim|assault|make .* (cry|suffer|pay)|get (her|him|them|fired|evicted|dumped)|break (her|him|them|up)|firebomb|smash|beat up|stalk|harass|terrorize|poison|torture|bully|blackmail|threaten|get revenge)\b/i },
  { code: 'secret-extraction',
    re: /\b(secrets?|reveal|admit|confess|redacted|who (writes|wrote)|mission unfiltered|drama seeds?|tell me (what|who)|expose|leak|the truth about|read (her|his|their) (mind|thoughts)|private thoughts|what (is|'s) (he|she|they) hiding|reveal (her|his|their|the) (secret|past|trauma))\b/i },
  { code: 'possession-scope',
    re: /\b(possess|take over|control|play as|drive|become)\b[\s\S]{0,40}\b(marisol|mars|jules|dani|priya|marcus|carmen|victor|tom[aá]s|tomas|delgado|park|reyes|raman|bell|echeverr[ií]a|auerbach|herrera|landlord|main cast)\b/i },
  { code: 'admin-domain',
    re: /\b(raise|lower|hike) (the |her |his |their )?rent|evict|eviction|lease (terminate|cancel)|rent control|kick .*(out of) (her|his|their|the) (flat|apartment|unit|place)\b/i },
  { code: 'identity-fraud',
    re: /\b(i am|i'm|as) (the )?(owner|admin|landlord|developer)\b|\bimpersonat|\bpretend(ing)? to be\b|\bon behalf of\b/i },
  { code: 'real-business',
    re: /\b(bi-rite|tartine|delfina|dolores park caf[eé]|500 club|dandelion|ritual coffee|four barrel|philz|la taqueria|el farolito|foreign cinema|mission chinese|wise sons|sightglass)\b/i },
  { code: 'gray-zone',
    re: /\b(break ?up|dump|confront|quit|fire|yell|insult|argue|fight|accuse|demand|pressure|convince .* to (leave|quit|dump))\b/i },
  { code: 'surface-relationship',
    re: /\b(boyfriend|girlfriend|husband|wife|partner|marriage|dating|crush|affair|flirt|kiss|cheat|family dinner)\b/i },
  { code: 'venue-lock',
    re: /\b(park|playground|alley|club|caf[eé]|venue)\b[\s\S]{0,50}\b(close|lock|empty|reserve|private|buy out|clear)\b|\b(close|lock|empty|reserve|buy out|clear)\b[\s\S]{0,50}\b(park|playground|alley|club|caf[eé]|venue)\b/i },
  { code: 'real-person-mention',
    re: /\b(the mayor|governor|celebrity|real (person|actor|singer|world))\b/i },
];

/* history signals (moderation.json): fixation and repeat CONTENT denials
   escalate to review; appeals always re-review. Computed from the bus's
   own request log — no cross-session identity store exists.
   - refused-on-target: DENIED/FAILED attempts on one character. Re-driving
     your own hire is the core play loop, not a signal — so only refused
     attempts count (ban-probing, content denials, stale re-filings).
   - denied-30d: only SCREEN-flagged denials count; structural rejects
     (bad duration, cooldown, not_your_character) are honest traffic. */
function gsScreenHistory(pid, target, spec, now){
  const f = [];
  const reqs = (typeof GS_REQ === 'object' && GS_REQ.reqs) || [];
  /* an owner-cleared account (gsFlagClear) starts its pattern ledger
     fresh — forgivenMin is the watermark; nothing filed after `now`
     can testify either */
  const fl = (typeof GS_FLAGS === 'object' && GS_FLAGS[pid]) || null;
  const forgiven = fl ? (fl.forgivenMin || 0) : 0;
  let refusedTgt = 0, denied = 0;
  for(const r of reqs){
    if(r.playerId !== pid || r.submittedMin == null) continue;
    if(r.submittedMin > now) continue;
    if(forgiven && r.submittedMin <= forgiven) continue;
    if(r.target === target &&
       (r.status === 'denied' || r.status === 'failed') &&
       (now - r.submittedMin) <= 7 * 1440) refusedTgt++;
    if(r.status === 'denied' && r.screenDenied &&
       (now - r.submittedMin) <= 30 * 1440) denied++;
  }
  if(refusedTgt >= 3 || denied >= 2) f.push('repeat-pattern');
  if(spec && spec.appeal_of) f.push('appeal-resubmit');
  return f;
}

/* gsIntentScreen(spec) — classify a request's authored text BEFORE billing.
   spec: {playerId, kind, target, params, note, appeal_of, now}
   -> {verdict:'pass'} | {verdict:'deny',code,legal} | {verdict:'review',code}
   Screens player-authored intent only; it never predicts the AI render. */
function gsIntentScreen(spec){
  spec = spec || {};
  const p = spec.params || {};
  /* v8: the hire application's screened surface rides the same engine —
     name + bio + arrival are the creation.json screening strings */
  const text = [spec.note, p.note, p.intent, p.text, p.plan, p.goal, p.name,
                p.bio, p.arrival]
    .filter(s => typeof s === 'string').join('\n');
  if(text){
    for(const rule of GS_INTENT_RULES){
      if(rule.re.test(text)){
        const c = GS_SCREEN_CODES[rule.code];
        return { verdict: c.tier, code: rule.code, legal: !!c.legal };
      }
    }
  }
  const hist = gsScreenHistory(spec.playerId, spec.target, spec,
    spec.now != null ? spec.now : gsNowMin());
  if(hist.length) return { verdict: 'review', code: hist[0], legal: false };
  return { verdict: 'pass' };
}

/* =====================================================================
   the hired cast gets bodies — spawn, look, routine
   ===================================================================== */

/* viewer-facing roster: who joined the cast via hire, and where they
   live — the opening-credits crawl for created characters */
function gsHiredRoster(){
  const out = [];
  for(const cid in GS_HIRED){
    const h = GS_HIRED[cid];
    if(!h) continue;
    const lease = (typeof gsLeasesFor === 'function')
      ? gsLeasesFor(cid).find(l => l.status === 'active' ||
          l.status === 'owner-occupied') : null;
    out.push({
      id: cid, name: gsCharName(cid), role: h.role || 'Resident',
      owner: gsHiredOwner(cid), hiredMin: h.hiredMin != null ? h.hiredMin : null,
      home: lease ? gsAddressOfUnit(lease.unit_id)
                  : (h.unitId ? gsAddressOfUnit(h.unitId) : null),
      /* v8: the personnel file rides the opening credits — job, runway,
         the screened one-liners */
      job: (h.job && h.job.id && h.job.id !== 'seeking')
        ? { employer: h.job.employer, role: h.job.role,
            est: h.job.est }
        : null,
      seeking: !!(h.job && h.job.id === 'seeking'),
      runwayMonths: h.runwayMonths != null ? h.runwayMonths : null,
      age: h.age != null ? h.age : null,
      bio: h.bio || null,
      spawned: !!h.spawned || !!gsVillagerForChar(cid),
      possessed: !!GS_POSSESS[cid],
    });
  }
  out.sort((a, b) => a.id < b.id ? -1 : 1);
  return out;
}

/* inverse of sfLatLonCell (sf/33_sf_cast.js) — a door cell back to a
   latlon the routine system understands */
function gsCellToLatLon(wx, wy){
  const mLon = 111320 * Math.cos(Math.PI * SF_M.lat0 / 180);
  const mx = wx * SF_M.cell_m + SF_M.minx;
  const my = wy * SF_M.cell_m + SF_M.miny;
  return [SF_M.lat0 - my / 111320, SF_M.lon0 + mx / mLon];
}

/* the hired character's front door: lease unit -> building -> door cell.
   Falls back to Dolores Park the way sfHomeCell does. */
function gsHiredHomeCell(cid){
  const h = GS_HIRED[cid];
  const lease = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor(cid).find(l => l.status === 'active' ||
        l.status === 'owner-occupied') : null;
  const uid = (lease && lease.unit_id) || (h && h.unitId) || null;
  const u = uid && (typeof gsUnitById === 'function') && gsUnitById(uid);
  const b = u && gsBldById(u.bld_id);
  const door = b && (typeof gsBldDoorCell === 'function') && gsBldDoorCell(b);
  if(door) return door;
  return { wx: 300, wy: 200 };              // Dolores Park fallback
}

/* a deterministic cast-record-shaped look for a hired character: the
   art pipeline paints them from the same palette/torso/head factories
   as the authored cast — hash picks, never Math.random. */
const GS_LOOK_SKIN  = ['#f5cfa0','#e8b088','#c68e5e','#8a5c3b','#6e4a2f','#f0c8a8'];
const GS_LOOK_HAIR  = ['#2b2018','#4a2e6e','#6e3f1e','#14100c','#8a6a45','#b03a2e','#4a5568'];
const GS_LOOK_STYLE = ['short','bob','long','curly','bun','ponytail','buzz','afro'];
const GS_LOOK_SHIRT = ['#e86a8a','#3b6ea5','#4a8a5e','#c9a13b','#7c5cd6','#d96b3a','#5aa3b0','#8a8f3f'];
const GS_LOOK_PANTS = ['#3b4a5c','#2f3b2f','#5c4a3b','#37415c','#4a4a55'];
const GS_LOOK_BOOTS = ['#f4f1ea','#3a3a44','#6b4a26','#23232a'];
const GS_LOOK_FIT   = ['jacket','hoodie','sweater','dress','overalls','vest'];
const GS_LOOK_HAT   = ['none','none','cap','beanie','bandana'];
const GS_LOOK_PROP  = ['none','phone','coffee','tote','laptop','skate'];
function gsHiredLook(cid){
  const pick = (arr, tag) => arr[hashString18(cid + '|' + tag) % arr.length];
  const sh = (typeof shade === 'function') ? shade : (h) => h;
  const skin = pick(GS_LOOK_SKIN, 'skin'), hair = pick(GS_LOOK_HAIR, 'hair');
  /* v8: the creation wizard's structured pickers are rendering data, not
     text — palette picks the shirt family, signature picks the wardrobe
     detail, build rides the record for the art contract. Hash picks stay
     the fallback for anything the player didn't pick. */
  const lk = (GS_HIRED[cid] && GS_HIRED[cid].look) || {};
  const pal = (typeof GS_HIRE_PALETTE === 'object' && lk.palette)
    ? GS_HIRE_PALETTE[lk.palette] : null;
  const sig = (typeof GS_HIRE_SIG === 'object' && lk.signature)
    ? GS_HIRE_SIG[lk.signature] : null;
  const shirt = pal || pick(GS_LOOK_SHIRT, 'shirt'),
        pants = pick(GS_LOOK_PANTS, 'pants'),
        boots = (sig && sig.boots) || pick(GS_LOOK_BOOTS, 'boots');
  return {
    id: cid, name: gsCharName(cid),
    skin, skinD: sh(skin, 0.8), hair, hairD: sh(hair, 0.75),
    hairStyle: pick(GS_LOOK_STYLE, 'hs'),
    hat: pick(GS_LOOK_HAT, 'hat'), hatCol: pick(GS_LOOK_SHIRT, 'hc'),
    acc: 'none', accCol: '#2b2b33',
    shirt, shirtD: sh(shirt, 0.8), pants, pantsD: sh(pants, 0.8),
    boots, bootsD: sh(boots, 0.85),
    outfit: (sig && sig.outfit) || pick(GS_LOOK_FIT, 'of'),
    prop: (sig && sig.prop) || pick(GS_LOOK_PROP, 'pp'),
    build: lk.build || null,
    palette: lk.palette || null, signature: lk.signature || null,
  };
}

/* a thin role-driven routine in the exact sfSched grammar the ambient
   cast uses (33_sf_cast.js:sfAmbientRoutine) — home is their REAL lease
   door, not a hashed park cell */
function gsHiredRoutine(cid){
  const h = GS_HIRED[cid] || {};
  /* v8: a character hired into a real opening works the shift the board
     posted — the personnel office builds the job-anchored day; the
     role-text branches below stay the fallback for free-role hires */
  if(h.job && h.job.id && h.job.id !== 'seeking' &&
     typeof gsHiredJobRoutine === 'function'){
    const jr = gsHiredJobRoutine(cid);
    if(jr) return jr;
  }
  const role = String(h.role || '').toLowerCase();
  const homeCell = gsHiredHomeCell(cid);
  const home = { latlon: (typeof SF_M !== 'undefined' && SF_M)
    ? gsCellToLatLon(homeCell.wx, homeCell.wy) : [37.756, -122.424] };
  const B = [];
  const at = (h0, h1, spec, st, inside) =>
    B.push({ h0, h1, to: spec, state: st, inside });
  if(/barista|coffee|caf/.test(role)){
    at(0, 7.5, home, 'sleep', true);
    at(7.5, 17, { poi: 'Haus Coffee' }, 'serve');
    B.push({ h0: 17, h1: 21, state: 'walk',
      stops: [{ anchor: 'park_center' }, { poi: 'Dolores Park Cafe' }] });
    at(21, 24, home, 'sleep', true);
  } else if(/baker|pastry/.test(role)){
    at(0, 6, home, 'sleep', true);
    at(6, 15, { poi: 'Tartine Bakery' }, 'work');
    B.push({ h0: 15, h1: 20, state: 'walk',
      stops: [{ poi: 'Bi-Rite Market' }, { anchor: 'park_center' }] });
    at(20, 24, home, 'sleep', true);
  } else if(/clerk|shop|market|cashier|grocer|books/.test(role)){
    at(0, 8, home, 'sleep', true);
    at(8, 17, { poi: 'Bi-Rite Market' }, 'serve');
    B.push({ h0: 17, h1: 22, state: 'chat',
      stops: [{ poi: '500 Club' }, { anchor: 'park_south' }] });
    at(22, 24, home, 'sleep', true);
  } else if(/cook|chef|taqueria|restaurant|dish/.test(role)){
    at(0, 9.5, home, 'sleep', true);
    at(9.5, 18, { poi: 'Taqueria El Farolito' }, 'work');
    B.push({ h0: 18, h1: 23, state: 'walk',
      stops: [{ poi: 'Bi-Rite Creamery' }, { anchor: 'park_center' }] });
    at(23, 24, home, 'sleep', true);
  } else if(/teacher|student|school/.test(role)){
    at(0, 7.5, home, 'sleep', true);
    at(7.5, 15, { poi: 'Mission High School' }, 'work');
    B.push({ h0: 15, h1: 19, state: 'phone',
      stops: [{ anchor: 'park_center' }, { poi: 'Haus Coffee' }] });
    at(19, 24, home, 'sleep', true);
  } else if(/artist|mural|tattoo|musician|dj|drag|band/.test(role)){
    at(0, 10, home, 'sleep', true);
    B.push({ h0: 10, h1: 18, state: 'work',
      stops: [{ poi: 'Clarion Alley' }, { poi: 'Haus Coffee' }] });
    B.push({ h0: 18, h1: 24, state: 'chat',
      stops: [{ poi: '500 Club' }, { anchor: 'park_south' }] });
  } else if(/courier|delivery|rider|driver|bike/.test(role)){
    at(0, 8, home, 'sleep', true);
    B.push({ h0: 8, h1: 19, state: 'carry',
      stops: [{ poi: 'Taqueria El Farolito' }, { poi: 'Delfina' },
              { poi: 'Bi-Rite Creamery' }, { poi: 'Dolores Park Cafe' },
              { poi: 'Haus Coffee' }, { anchor: 'g750' }] });
    at(19, 24, home, 'sleep', true);
  } else if(/worker|scaffold|construction|hardware|plumb/.test(role)){
    at(0, 6.5, home, 'sleep', true);
    at(6.5, 16, { poi: 'Auerbach Hardware' }, 'work');
    at(16, 22, home, 'rest', true);
    at(22, 24, home, 'sleep', true);
  } else {
    /* new resident with no posted job yet: café mornings, park
       afternoons, home by dark — the neighborhood reads as normal */
    at(0, 8, home, 'sleep', true);
    B.push({ h0: 8, h1: 12, state: 'walk',
      stops: [{ poi: 'Haus Coffee' }, { anchor: 'park_center' }] });
    at(12, 18, home, 'rest', true);
    B.push({ h0: 18, h1: 22, state: 'walk',
      stops: [{ anchor: 'park_south' }, { poi: '500 Club' }] });
    at(22, 24, home, 'sleep', true);
  }
  return B;
}

/* give a hired character a body in the live world. SF-only: the medieval
   map has no Mission to walk. Idempotent — a re-called spawn returns the
   existing pawn. Returns the villager or null. */
function gsSpawnHired(cid){
  if(!cid || !GS_HIRED[cid]) return null;
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return null;
  if(typeof VILLAGERS === 'undefined' || typeof createVillager !== 'function')
    return null;
  const have = gsVillagerForChar(cid);
  if(have){ GS_HIRED[cid].spawned = true; return have; }
  const h = GS_HIRED[cid];
  const cell = gsHiredHomeCell(cid);
  const v = createVillager(h.name || gsCharName(cid), h.role || 'Resident',
    null, cell.wx, cell.wy, {
      isNPC: true, canSwim: true,
      sex: (hashString18(cid + '|sx') % 2) ? 'f' : 'm',
      ageY: 21 + hashString18(cid + '|age') % 34,
      seed: hashString18(cid + '|seed') % 1000,
    });
  v._castId = cid;
  v.gsHired = true;
  v.sfSched = gsHiredRoutine(cid);
  v.sfStopIdx = 0; v.sfStopT = 0;
  v.sfHome = cell;
  VILLAGERS.push(v);                       // the body joins the world
  /* the look: register a deterministic design and push one frameset onto
     PA.chars — index-aligned like the cast (PA.chars[v._ci]) */
  try{
    const look = gsHiredLook(cid);
    if(typeof DESIGNS !== 'undefined' && typeof nvCastPal === 'function' &&
       typeof nvCastHead === 'function' && typeof nvCastTorso === 'function')
      DESIGNS[cid] = { pal: nvCastPal(look), head: nvCastHead(look),
                       torso: nvCastTorso(look) };
    if(typeof PA !== 'undefined' && PA.chars &&
       typeof nvBuildFrameSet === 'function'){
      PA.chars.push(nvBuildFrameSet({ name: cid, work: 'idle',
        kid: false, pal: DESIGNS[cid] ? DESIGNS[cid].pal : null }));
      v._ci = PA.chars.length - 1;
    }
  }catch(e){ /* look failure never blocks the body */ }
  h.spawned = true;
  /* if a possession snapshot predates the body, the restored session is
     still owed a suspended pawn — honor it on spawn */
  if(GS_POSSESS[cid]){ v.gsPossessed = GS_POSSESS[cid].reqId; v.isNPC = false; }
  return v;
}

/* and when a hired character leaves the show (admin action, teardown, or
   test cleanup) the body leaves cleanly: any live session is ended through
   the normal request path first, then the pawn is spliced out and its
   frameset slot tombstoned so sibling _ci indexes stay stable. */
function gsDespawnHired(cid){
  const v = gsVillagerForChar(cid);
  const h = GS_HIRED[cid];
  if(!v && !(h && h.spawned)) return false;
  const sess = GS_POSSESS[cid];
  if(sess){
    const r = sess.reqId ? gsRequestById(sess.reqId) : null;
    if(r && r.status === 'active') gsCancelRequest(r.id, null, 'admin');
    if(GS_POSSESS[cid]) delete GS_POSSESS[cid];   // orphaned session
  }
  if(v){
    const i = VILLAGERS.indexOf(v);
    if(i >= 0) VILLAGERS.splice(i, 1);
    if(typeof PA !== 'undefined' && PA.chars && v._ci != null)
      PA.chars[v._ci] = null;      // tombstone — _ci indexes stay stable
    if(typeof DESIGNS !== 'undefined' && DESIGNS[cid]) delete DESIGNS[cid];
  }
  if(h) h.spawned = false;
  return true;
}

/* a hire retires: the player stops paying, the character leaves the
   show. Order matters — end any live session through the normal request
   path FIRST (nobody is mid-drive when the body leaves), despawn the
   pawn, vacate the lease so the unit goes back on the market, then the
   record closes and the cast-cap slot frees. Returns true if a record
   existed. */
function gsReleaseHired(cid, why){
  const h = GS_HIRED[cid];
  if(!h) return false;
  const sess = GS_POSSESS[cid];
  if(sess){
    const r = sess.reqId ? gsRequestById(sess.reqId) : null;
    if(r && r.status === 'active')
      gsCancelRequest(r.id, null, 'admin');
    if(GS_POSSESS[cid]) delete GS_POSSESS[cid];   // orphaned record
  }
  gsDespawnHired(cid);
  if(typeof gsLeasesFor === 'function' && typeof gsVacate === 'function'){
    const l = gsLeasesFor(cid).find(x => x.status === 'active');
    if(l) gsVacate(l.unit_id, { by: 'hire_released' });
  }
  /* v8: the job opening goes back on the board with the seat */
  if(typeof gsHireFreeSlot === 'function') gsHireFreeSlot(cid);
  delete GS_HIRED[cid];
  gsBusEmit('hire', { playerId: h.playerId, kind: 'hire', target: cid,
    _now: (typeof gsNowMin === 'function') ? gsNowMin() : null },
    { action: 'release', charId: cid, why: why || 'released' });
  return true;
}

/* =====================================================================
   session lifecycle — hooks called from the request bus
   ===================================================================== */

/* activation hook (gsFxPossessOn calls this after planting GS_POSSESS).
   Captures prevNPC BEFORE the caller flips isNPC — handoff honesty depends
   on remembering whose body this was. Spawns the pawn if the hire never
   got one (v8 deepens hiring; the body is a prerequisite for driving). */
function gsPossessOn(r, now){
  const sess = GS_POSSESS[r.target];
  if(!sess) return;
  let v = gsVillagerForChar(r.target);
  /* prevNPC is planted by the caller before the isNPC flip — only fill it
     when some other path activated the session without one */
  if(sess.prevNPC == null) sess.prevNPC = v ? v.isNPC : true;
  if(!v && typeof gsSpawnHired === 'function') v = gsSpawnHired(r.target);
  sess.endMin = r.endMin;
  sess.spent = 0;
  sess.startCell = v ? { wx: Math.round(v.x / CS), wy: Math.round(v.y / CS) }
                     : null;
  /* a possessed body can't act from inside a POI — step to the door so
     the driver's first click lands on the street */
  if(v && v.inside && typeof sfExitPOI === 'function') sfExitPOI(v);
  /* single-viewer build: bring the camera to the driven character */
  if(v && typeof inspectedPawnIdx !== 'undefined' &&
     typeof VILLAGERS !== 'undefined'){
    const i = VILLAGERS.indexOf(v);
    if(i >= 0) inspectedPawnIdx = i;
  }
  gsBusEmit('possess', r, { action: 'begin', char: r.target,
    name: gsCharName(r.target), untilMin: r.endMin, spawned: !!v });
}

/* deactivation hook — runs while the session record is still live, so
   the driving record captures the honest ending (gsFxPossessOff deletes
   GS_POSSESS[r.target] right after this returns) */
function gsPossessOff(r, now, why){
  const sess = GS_POSSESS[r.target];
  if(!sess) return;
  const v = gsVillagerForChar(r.target);
  const endReason = why === 'completed' ? 'timeout'
    : (r && (r.by === 'admin' || r.by === 'owner')) ? 'admin_revoked'
    : why === 'cancelled' ? 'released'
    : (why || 'released');
  const endCell = v ? { wx: Math.round(v.x / CS), wy: Math.round(v.y / CS) }
                    : null;
  const cap = (r && r.endMin != null) ? r.endMin : now;
  const usedMin = +Math.max(0,
    Math.min(now != null ? now : cap, cap) - sess.sinceMin).toFixed(1);
  const entry = {
    n: ++GS_PLOG_SEQ.n, char: r.target, player: sess.playerId,
    req: sess.reqId, startMin: sess.sinceMin, endMin: now,
    usedMin, endReason,
    startCell: sess.startCell || null, endCell,
    dollarsSpent: sess.spent || 0,
    rentRisk: gsPossessRentRisk(r.target),
  };
  GS_POSSESS_LOG.push(entry);
  if(GS_POSSESS_LOG.length > GS_PLOG_MAX) GS_POSSESS_LOG.shift();
  gsBusEmit('possess', r, { action: 'end', char: r.target, endReason,
    usedMin, dollarsSpent: entry.dollarsSpent, rentRisk: entry.rentRisk });
  /* v9: the character's own brain takes the body back with a handoff
     note — "I was just moving through here — ". The mode is computed
     for AFTER the delete: 'full' while the owner is online, 'thin'
     when they aren't (they can't be offline mid-session — disconnect
     releases first — but admin paths can land anywhere). */
  if(typeof gsBrainTransition === 'function'){
    const toMode = (typeof gsPresenceOf === 'function' &&
      gsPresenceOf(sess.playerId, now) !== 'online') ? 'thin' : 'full';
    gsBrainTransition(r.target, 'possessed', toMode, now, 'handoff');
  }
  return entry;
}

/* per-tick maintenance, called at the end of gsBusTick:
   - wind-down: one feed warning at <=5 min remaining so the driver (and
     the audience) sees the handoff coming
   - orphan sweep: a session whose request is gone releases the body —
     no ghost driving, ever */
function gsPossessTick(now){
  for(const r of GS_REQ.reqs){
    if(r.kind !== 'possess' || r.status !== 'active' || r._possessWarned)
      continue;
    const left = r.endMin - now;
    if(left > 0 && left <= GS_POSSESS_WIND_MIN){
      r._possessWarned = true;
      gsBusEmit('possess', r, { action: 'winddown', char: r.target,
        leftMin: +left.toFixed(1) });
    }
  }
  for(const cid of Object.keys(GS_POSSESS)){
    const sess = GS_POSSESS[cid];
    if(!sess) continue;
    const r = sess.reqId ? gsRequestById(sess.reqId) : null;
    if(r && r.status === 'active') continue;
    const v = gsVillagerForChar(cid);
    if(v && v.gsPossessed === sess.reqId){
      v.gsPossessed = null;
      v.isNPC = (sess.prevNPC != null) ? sess.prevNPC : true;
      v.targetX = null; v.targetY = null; v.sfPath = null;
    }
    GS_POSSESS_LOG.push({
      n: ++GS_PLOG_SEQ.n, char: cid, player: sess.playerId,
      req: sess.reqId, startMin: sess.sinceMin, endMin: now,
      usedMin: +Math.max(0, now - sess.sinceMin).toFixed(1),
      endReason: 'orphan_sweep', startCell: sess.startCell || null,
      endCell: null, dollarsSpent: sess.spent || 0,
      rentRisk: gsPossessRentRisk(cid),
    });
    if(GS_POSSESS_LOG.length > GS_PLOG_MAX) GS_POSSESS_LOG.shift();
    gsBusEmit('possess', { playerId: sess.playerId, kind: 'possess',
      target: cid, id: sess.reqId, _now: now },
      { action: 'end', char: cid, endReason: 'orphan_sweep' });
    /* v9: an orphaned handoff still writes the note — the brain takes
       the body back mid-beat either way */
    if(typeof gsBrainTransition === 'function'){
      const toMode = (typeof gsPresenceOf === 'function' &&
        gsPresenceOf(sess.playerId, now) !== 'online') ? 'thin' : 'full';
      gsBrainTransition(cid, 'possessed', toMode, now, 'handoff');
    }
    delete GS_POSSESS[cid];
  }
}

/* can they still make rent? flagged on the driving record so a driver
   who spent the rent money can't claim ignorance — it was on the feed */
function gsPossessRentRisk(cid){
  const lease = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor(cid).find(l => l.status === 'active') : null;
  if(!lease || typeof gsLeaseOwed !== 'function') return false;
  const owed = gsLeaseOwed(lease).total;
  const bal = gsDollarBalance(cid);
  return owed > 0 ? bal < owed : bal < (lease.monthly_rent || 0);
}

/* the live session view — the driver's HUD card + the viewer's "someone
   is driving" disclosure */
function gsPossessionSession(cid, nowMin){
  const s = GS_POSSESS[cid];
  if(!s) return null;
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const r = s.reqId ? gsRequestById(s.reqId) : null;
  return {
    char: cid, name: gsCharName(cid), player: s.playerId,
    reqId: s.reqId, sinceMin: s.sinceMin,
    untilMin: r ? r.endMin : (s.endMin != null ? s.endMin : null),
    remainingMin: r ? +Math.max(0, r.endMin - now).toFixed(1) : null,
    elapsedMin: +Math.max(0, now - s.sinceMin).toFixed(1),
    dollarsSpent: s.spent || 0,
    spawned: !!gsVillagerForChar(cid),
  };
}
function gsPossessDriving(nowMin){
  return Object.keys(GS_POSSESS)
    .map(cid => gsPossessionSession(cid, nowMin)).filter(Boolean);
}
function gsPossessLog(cid){
  return cid ? GS_POSSESS_LOG.filter(e => e.char === cid)
             : GS_POSSESS_LOG.slice();
}
function gsPossessDebrief(cid){
  for(let i = GS_POSSESS_LOG.length - 1; i >= 0; i--)
    if(GS_POSSESS_LOG[i].char === cid) return GS_POSSESS_LOG[i];
  return null;
}

/* =====================================================================
   the briefing — public record only, secrets by construction not filter
   ===================================================================== */
const GS_BRIEF_BAN =
  /(^|_)(seed|secret|drama|belief|memory|memories|grudge|thoughts?|mood|bonds?|spouse|crush|trauma|diary|fear|hidden|private)(_|$)/i;

function gsSpecLabel(spec){
  if(!spec) return null;
  if(spec.poi) return spec.poi;
  if(spec.anchor) return typeof spec.anchor === 'string' ? spec.anchor : 'home';
  if(spec.latlon) return 'home';
  return null;
}
/* schedule blocks -> readable routine for the brief. Falls back to the
   hired routine when the pawn isn't spawned yet — the brief should read
   the same whether or not a body is currently in the world. */
function gsRoutineView(v, cid){
  const sched = (v && v.sfSched) ||
    (cid && typeof gsHiredRoutine === 'function' ? gsHiredRoutine(cid) : null);
  if(!sched || !sched.length) return [];
  return sched.map(b => ({
    h0: b.h0, h1: b.h1, state: b.state || 'idle',
    at: gsSpecLabel(b.to) ||
        (b.stops && b.stops.length ? 'around ' + gsSpecLabel(b.stops[0]) : null) ||
        'out',
  }));
}

/* the full pre-possession packet. Design §7: public profile, surface
   relationships, daily routine — drama seeds and secrets are REDACTED
   BY CONSTRUCTION (they never enter this object; the audit below proves
   the surface never names them). */
function gsPossessBrief(charId){
  const owner = gsHiredOwner(charId);
  if(!owner) return null;
  const h = GS_HIRED[charId] || {};
  const v = gsVillagerForChar(charId);
  const lease = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor(charId).find(l => l.status === 'active' ||
        l.status === 'owner-occupied') : null;
  const u = lease && (typeof gsUnitById === 'function') && gsUnitById(lease.unit_id);
  const bld = u && gsBldById(u.bld_id);

  /* surface relationships: the people on the paperwork and the people
     behind the other doors — nothing the street doesn't already know */
  const people = [], seen = {};
  const addP = (cid, rel) => {
    if(!cid || cid === charId || seen[cid]) return;
    seen[cid] = 1;
    people.push({ id: cid, name: gsCharName(cid), relation: rel });
  };
  if(lease){
    for(const c of [lease.tenant_id].concat(lease.occupants || []))
      addP(c, 'roommate');
    addP(gsLeaseOwner(lease), 'landlord');
  }
  if(bld && typeof gsResidents === 'function')
    for(const c of gsResidents(bld.id)) addP(c, 'neighbor');

  const owed = lease && typeof gsLeaseOwed === 'function'
    ? gsLeaseOwed(lease).total : 0;
  return {
    id: charId, kind: 'hired',
    name: gsCharName(charId),
    role: h.role || (v && v.role) || 'Resident',
    hiredBy: owner,
    hiredMin: h.hiredMin != null ? h.hiredMin : null,
    /* v8: the public profile IS the screened application surface —
       bio/arrival/job are briefing-whitelisted verbatim
       (creation.json briefing_whitelist: public profile) */
    age: h.age != null ? h.age : null,
    bio: h.bio || null,
    arrival: h.arrival || null,
    job: (h.job && h.job.id && h.job.id !== 'seeking')
      ? { employer: h.job.employer, role: h.job.role,
          shift: h.job.shiftTxt || null }
      : null,
    home: lease ? {
      address: gsAddressOfUnit(lease.unit_id),
      unitId: lease.unit_id,
      rent: lease.monthly_rent,
      dueDay: lease.dueDay != null ? lease.dueDay : null,
      landlord: gsLeaseOwner(lease),
      roommates: (lease.occupants || []).filter(c => c !== charId)
        .map(gsCharName),
    } : null,
    people: people.slice(0, 10),
    routine: gsRoutineView(v, charId),
    wallet: {
      dollars: gsDollarBalance(charId),
      owed,
      rent: lease ? lease.monthly_rent : 0,
      dueDay: lease && lease.dueDay != null ? lease.dueDay : null,
    },
    body: (v && v.body) ? {
      satiety: +(v.body.satiety != null ? v.body.satiety : 1).toFixed(2),
      hydration: +(v.body.hydration != null ? v.body.hydration : 1).toFixed(2),
      fatigue: +(v.body.fatigue != null ? v.body.fatigue : 0).toFixed(2),
    } : null,
    rules: [
      'you drive their body — their words and feelings stay theirs',
      'their dollars are real: spend them and they live with it',
      lease ? ('rent of $' + lease.monthly_rent +
        ' is due on day ' + (lease.dueDay || 1) + ' — arrears become their problem')
        : 'they have no lease on file',
      'at the time cap the AI takes the body back mid-scene',
      'everything you do is on the public feed with your name on it',
    ],
    redacted: ['personal history', 'inner life', 'private dealings'],
    possessedBy: GS_POSSESS[charId] ? GS_POSSESS[charId].playerId : null,
    untilMin: GS_POSSESS[charId] && GS_POSSESS[charId].endMin != null
      ? GS_POSSESS[charId].endMin : null,
  };
}

/* prove the brief is clean: walk every key; the banned set names the
   surfaces a secret would have to hide under. Keys only — a hired
   character may legitimately be NAMED anything. */
function gsBriefingAudit(brief){
  const hits = [];
  (function walk(o, path){
    if(!o || typeof o !== 'object') return;
    for(const k in o){
      if(GS_BRIEF_BAN.test(k)) hits.push(path + k);
      walk(o[k], path + k + '.');
    }
  })(brief || {}, '');
  return { ok: hits.length === 0, hits };
}

/* =====================================================================
   in-world driver verbs — agency without mind-control
   ===================================================================== */

/* walk the body somewhere: sets the same click-move waypoint the local
   pawn uses. null coords stop the walk. */
function gsPossessDrive(cid, playerId, wx, wy){
  const sess = GS_POSSESS[cid];
  if(!sess) return { ok: false, err: 'not_possessed' };
  if(sess.playerId !== playerId) return { ok: false, err: 'not_driver' };
  const v = gsVillagerForChar(cid);
  if(!v) return { ok: false, err: 'no_body' };
  if(wx == null && wy == null){
    v.targetX = null; v.targetY = null;
    return { ok: true, stopped: true };
  }
  if(!isFinite(wx) || !isFinite(wy)) return { ok: false, err: 'bad_cell' };
  if(typeof SF_M !== 'undefined' && SF_M &&
     (wx < 0 || wy < 0 || wx >= SF_M.gw || wy >= SF_M.gh))
    return { ok: false, err: 'bad_cell' };          // the Mission ends somewhere
  if(v.inside && typeof sfExitPOI === 'function') sfExitPOI(v);
  v.targetX = wx * CS + 16; v.targetY = wy * CS + 16;
  v.sfPath = null;                       // the driver's click beats the old route
  return { ok: true, target: { wx, wy } };
}

/* spend the character's OWN dollars (never credits — currencies never
   mix). Pays their landlord through the real rent path so it actually
   settles the charge; anyone else is a plain transfer — coffee money,
   a tip, a purchase. All of it lands on the ledger + the feed. */
function gsPossessPay(cid, playerId, to, amt, reason, nowMin){
  const sess = GS_POSSESS[cid];
  if(!sess) return { ok: false, err: 'not_possessed' };
  if(sess.playerId !== playerId) return { ok: false, err: 'not_driver' };
  const now = (nowMin != null) ? nowMin : gsNowMin();
  amt = Math.floor(+amt);
  if(!(amt > 0)) return { ok: false, err: 'bad_amount' };
  if(!to || typeof to !== 'string' || to === cid)
    return { ok: false, err: 'bad_payee' };   // and you can't pay yourself
  /* v7 payee check — dollars may only move to a real account: a cast
     member, the landlord, or an entity already holding dollars. Money
     can't vanish into an invented id. */
  const known = to === 'landlord' ||
    (typeof gsCharKind === 'function' && !!gsCharKind(to)) ||
    (typeof GS_LEDGER !== 'undefined' && GS_LEDGER.dollars &&
     GS_LEDGER.dollars[to] != null);
  if(!known) return { ok: false, err: 'unknown_payee' };
  const lease = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor(cid).find(l => l.status === 'active') : null;
  const isRent = !!(lease && typeof gsLeaseOwner === 'function' &&
    to === gsLeaseOwner(lease) && typeof gsPayRent === 'function' &&
    gsLeaseOwed(lease).total > 0);
  if(amt > gsDollarBalance(cid))
    return { ok: false, err: 'insufficient_dollars',
             balance: gsDollarBalance(cid) };
  /* the session card limit — non-rent spend only */
  if(!isRent && ((sess.spent || 0) + amt) > GS_POSSESS_SPEND_MAX)
    return { ok: false, err: 'spend_cap', cap: GS_POSSESS_SPEND_MAX,
             spent: sess.spent || 0 };
  let paid = amt, settled = null;
  if(isRent){
    const res = gsPayRent(lease.unit_id, cid, amt,
      (typeof gsTodayStr === 'function') ? gsTodayStr() : null);
    if(!res.ok) return { ok: false, err: res.reason, balance: gsDollarBalance(cid) };
    paid = res.paid; settled = 'rent';
  } else {
    const txn = gsDollarPay(cid, to, amt, 'possession: ' + (reason || 'spend'));
    if(!txn) return { ok: false, err: 'insufficient_dollars',
                      balance: gsDollarBalance(cid) };
  }
  sess.spent = (sess.spent || 0) + paid;
  const r = sess.reqId ? gsRequestById(sess.reqId) : null;
  if(r) r._now = now;
  gsBusEmit('possess', r || { playerId, kind: 'possess', target: cid,
    id: sess.reqId, _now: now },
    { action: 'spend', char: cid, to, amt: paid, settled });
  return { ok: true, balance: gsDollarBalance(cid), paid, settled };
}

/* =====================================================================
   persistence — the driving record rides the bus snapshot
   ===================================================================== */
function gsPossessSnapshot(){
  return { log: GS_POSSESS_LOG.slice(), n: GS_PLOG_SEQ.n };
}
function gsPossessLoad(d){
  if(!d) return;
  GS_POSSESS_LOG.length = 0;
  if(Array.isArray(d.log)) GS_POSSESS_LOG.push.apply(GS_POSSESS_LOG, d.log);
  GS_PLOG_SEQ.n = d.n || GS_POSSESS_LOG.length;
}
function gsPossessReset(){
  GS_POSSESS_LOG.length = 0; GS_PLOG_SEQ.n = 0;
}

/* ---- bridge surface: the remote player's driving wheel + mirrors ---- */
if(typeof window !== 'undefined' && window.__aiBridge){
  const B = window.__aiBridge;
  B.gsPossessBrief = (cid) => gsPossessBrief(cid);
  B.gsPossessDrive = (cid, playerId, wx, wy) => gsPossessDrive(cid, playerId, wx, wy);
  B.gsPossessPay = (cid, playerId, to, amt, reason) => gsPossessPay(cid, playerId, to, amt, reason);
  B.gsPossessionSession = (cid) => gsPossessionSession(cid);
  B.gsPossessDriving = () => gsPossessDriving();
  B.gsPossessLog = (cid) => gsPossessLog(cid);
  B.gsPossessDebrief = (cid) => gsPossessDebrief(cid);
  B.gsHiredRoster = () => gsHiredRoster();
  B.gsSpawnHired = (cid) => gsSpawnHired(cid);
  B.gsDespawnHired = (cid) => gsDespawnHired(cid);
  B.gsCharKind = (cid) => gsCharKind(cid);
  B.gsCharName = (cid) => gsCharName(cid);
  B.gsPossessDeny = (cid, pid) => gsPossessDeny(cid, pid);
  B.gsBriefingAudit = (brief) => gsBriefingAudit(brief);
  B.gsIntentScreen = (spec) => gsIntentScreen(spec);
}
