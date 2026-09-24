/* =====================================================================
   PART 41I: GAME SYSTEMS — THE QUIET HOURS (offline-mode, v9)

   Roadmap v9: "Player-owned character offline behavior: drop to thin AI
   when the player is offline (cheap ambient schedule), wake to full brain
   on return; possession sessions survive reconnect rules." Built to
   world/thinai.json (the world-builder thin-AI contract, inbox v13/v27)
   — the brain-mode layer this side owns ("game systems owns real
   brain-mode plumbing"):

   - PRESENCE: players are online until they aren't. gsPlayerOffline ends
     live driving FIRST (a disconnect can never leave a driven ghost),
     then starts the contract's 90s linger — blips and refreshes never
     drop a brain. gsPlayerOnline wakes their hires back to full.
   - BRAIN MODES (thinai.json): 'full' (core cast + hires with owner
     online), 'thin' (ambient cast + hires with owner offline — the cheap
     ambient schedule keeps walking), 'possessed' (session — brain
     suspended, the player IS the compute), 'degraded' (service-capacity
     ladder, mains only). The mode is DERIVED, never stored: possession
     state, char kind, owner presence, the degrade set.
   - HANDOFF NOTES: every mode swap writes the contract's one-paragraph
     handoff {char, from, to, at_min, place, doing, pending, near,
     mood_hint}. Read once by the receiving brain; stale after 24h.
     The possession release carries the "I was just moving through
     here — " lead verbatim.
   - SEAM RULE: transitions land between micro-beats — a pawn mid-stride
     finishes its step (<=90s) before the mode flips.
   - DEGRADE LADDER: capacity <60% degrades mains lowest scene-salience
     first; <30% all degrade. Recovery restores the watched end first.
   - NEEDS MODEL: thin brains track hunger/rest. Hungry -> detour to a
     routine food stop; depleted rest -> the evening cell cuts short.
     Reflexes never override a schedule obligation (the shift stands).
   - PHRASE KIT: thin pawns may bubble <=3 generic lines/hr — never
     char-voice, never an inner life.
   - CO-STAR MODE: the 'costar' request summons a thin pawn (ambient or
     offline-hired) as scene support — bounded compliance check at
     activation (role-card fit + reflex vetoes), time-boxed, releases
     mid-beat-clean. A decline refunds half and reads 'resolved ·
     declined' on the wire. Possession of someone else's pawn stays
     impossible — co-star is the only way to touch one.
   - COMPUTE LEDGER: GS_COMPUTE counts brain-minutes per mode — the
     honest "thin is cheap" accounting (thin/possessed/degraded never
     tick the LLM meter; that's the whole point of the rate card).
   - OBLIGATIONS: rent/wages/jobs are ledger state, not brain state —
     they survive every mode drop untouched (gsObligations is the
     read-only ledger view).

   Transitions are seam-internal — they NEVER hit the public feed (a
   spectator can't tell a brain dropped). Presence + modes are
   owner/console surfaces only. Deterministic throughout: no Math.random.
   ===================================================================== */

/* ---------------- presence ---------------- */
/* the contract's 90s linger, in bus-minutes (the bus runs on wall-clock
   minutes — 1.5 min covers a refresh or a network blip) */
const GS_LINGER_MIN = 1.5;
const GS_SEAM_MAX_MIN = 1.5;       // a transition waits one beat, max
const GS_PRESENCE = {};            /* pid -> {sinceMin, lastMin, offMin,
                                      lingerUntil} */

function gsPresenceSeen(pid, now){
  if(!pid) return;
  const p = GS_PRESENCE[pid] || (GS_PRESENCE[pid] = { sinceMin: now });
  p.lastMin = now;
  /* filing is an interactive act — a player at the door is online. A
     marked-offline player who files simply came back: wake them the
     same way an explicit reconnect does. */
  if(p.offMin != null) gsPlayerOnline(pid, now);
}
function gsPresenceOf(pid, nowMin){
  const p = GS_PRESENCE[pid];
  if(!p || p.offMin == null) return 'online';
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  if(p.lingerUntil != null && now < p.lingerUntil) return 'lingering';
  return 'offline';
}
/* the player logged off. Presence is marked FIRST — 'lingering' already
   fails gsPossessDeny, so nothing new can start driving in the same
   breath. Then live sessions end through the ordinary early-release path
   (cap semantics — unused minutes refund, the wire reads 'player session
   ended'). A queued possess that promotes inside the release is caught
   on the next pass: the loop only stops when this player holds no
   sessions. A player who goes offline is never left mid-drive. */
function gsPlayerOffline(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const p = GS_PRESENCE[pid] || (GS_PRESENCE[pid] = { sinceMin: now });
  p.lastMin = now; p.offMin = now;
  p.lingerUntil = now + GS_LINGER_MIN;
  const ended = [];
  let guard = 0;
  const possessKeys = () => (typeof GS_POSSESS === 'object')
    ? Object.keys(GS_POSSESS) : [];
  while(guard++ < 8){
    const cid = possessKeys()
      .find(c => GS_POSSESS[c].playerId === pid);
    if(cid == null) break;
    let sess = GS_POSSESS[cid];
    const r = sess.reqId && (typeof gsRequestById === 'function')
      ? gsRequestById(sess.reqId) : null;
    if(r && r.status === 'active') gsCancelRequest(r.id, now, 'player');
    sess = GS_POSSESS[cid];
    if(!sess){ ended.push(cid); continue; }          // released cleanly
    /* a NEW session landed in the same breath (a queued possess
       promoted during the release, presence already read as
       non-online so this should be rare) — cancel it too */
    const r2 = sess.reqId && (typeof gsRequestById === 'function')
      ? gsRequestById(sess.reqId) : null;
    if(r2 && r2.status === 'active'){
      gsCancelRequest(r2.id, now, 'player');
      if(!GS_POSSESS[cid]){ ended.push(cid); continue; }
    }
    /* truly orphaned record — free the pawn flags like the sweep */
    const v = (typeof gsVillagerForChar === 'function')
      ? gsVillagerForChar(cid) : null;
    if(v && v.gsPossessed === sess.reqId){
      v.gsPossessed = null;
      v.isNPC = (sess.prevNPC != null) ? sess.prevNPC : true;
      v.targetX = null; v.targetY = null; v.sfPath = null;
    }
    delete GS_POSSESS[cid];
    ended.push(cid);
  }
  /* queued / in-review possess filings can never run now — there's no
     driver when they fire. Released honestly (never ran → full refund),
     instead of activating into an empty chair. Other kinds keep their
     seats — paperwork doesn't need the player watching. */
  for(const r of (typeof GS_REQ === 'object' && GS_REQ.reqs
                  ? GS_REQ.reqs.slice() : [])){
    if(r.playerId === pid && r.kind === 'possess' &&
       (r.status === 'queued' || r.status === 'in_review'))
      gsCancelRequest(r.id, now, 'player');
  }
  return { ok: true, presence: 'lingering',
           lingerUntil: p.lingerUntil, endedSessions: ended };
}
function gsPlayerOnline(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const p = GS_PRESENCE[pid] || (GS_PRESENCE[pid] = { sinceMin: now });
  const wasOff = p.offMin != null;
  /* dropped = the linger actually expired — the brains are already
     'thin' by derivation. A wake inside the linger (blip) finds them
     still 'full': nothing to hand back, no note to write. */
  const dropped = wasOff &&
    (p.lingerUntil == null || now >= p.lingerUntil);
  p.lastMin = now; p.offMin = null; p.lingerUntil = null;
  const woke = [];
  if(dropped && typeof GS_HIRED === 'object')
    for(const cid in GS_HIRED)
      if(gsHiredOwner(cid) === pid){
        gsBrainTransition(cid, 'thin', 'full', now, 'wake');
        woke.push(cid);
      }
  return { ok: true, presence: 'online', woke };
}

/* ---------------- brain modes ---------------- */
const GS_DEGRADED = {};            /* core cid -> sinceMin (service
                                      ladder — mains only)           */
const GS_SEAM = {};                /* cid -> {to, tid, atMin,
                                      deadlineMin} pending transition */

/* the mode is DERIVED every read — never stored. possession beats
   everything; kind + owner presence + the degrade set do the rest. */
function gsBrainMode(cid, nowMin){
  if(typeof GS_POSSESS === 'object' && GS_POSSESS[cid]) return 'possessed';
  const kind = (typeof gsCharKind === 'function') ? gsCharKind(cid)
    : ((typeof GS_CORE_CAST === 'object' && GS_CORE_CAST[cid]) ? 'core'
       : ((typeof GS_HIRED === 'object' && GS_HIRED[cid]) ? 'hired' : null));
  if(kind === 'ambient') return 'thin';
  if(kind === 'core') return GS_DEGRADED[cid] ? 'degraded' : 'full';
  if(kind === 'hired'){
    const owner = (typeof gsHiredOwner === 'function')
      ? gsHiredOwner(cid) : null;
    return (owner && gsPresenceOf(owner, nowMin) === 'offline')
      ? 'thin' : 'full';
  }
  return 'full';
}
function gsBrainModes(nowMin){
  const out = {};
  if(typeof GS_CORE_CAST === 'object')
    for(const cid in GS_CORE_CAST) out[cid] = gsBrainMode(cid, nowMin);
  if(typeof NV_CAST !== 'undefined')
    for(const c of NV_CAST) if(c.tier === 'ambient') out[c.id] = 'thin';
  if(typeof GS_HIRED === 'object')
    for(const cid in GS_HIRED) out[cid] = gsBrainMode(cid, nowMin);
  return out;
}
function gsAllCharIds(){
  const ids = [];
  if(typeof GS_CORE_CAST === 'object') for(const c in GS_CORE_CAST) ids.push(c);
  if(typeof NV_CAST !== 'undefined')
    for(const c of NV_CAST) if(c.tier === 'ambient') ids.push(c.id);
  if(typeof GS_HIRED === 'object')
    for(const cid in GS_HIRED) ids.push(cid);
  return ids;
}

/* ---------------- the seam rule ----------------
   a mode swap lands between micro-beats: a pawn mid-stride finishes its
   step first (<=GS_SEAM_MAX_MIN, then it swaps anyway). Unspawned chars
   have no beat to finish — they swap on the spot. */
function gsSeamReady(cid){
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  return !v || !v.moving;
}
function gsBrainTransition(cid, from, to, atMin, tid, opts){
  opts = opts || {};
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  if(!opts.force && v && !gsSeamReady(cid)){
    /* mid-beat — queue it; the tick drains at the seam or the deadline.
       v18: the caller's doing/errands context rides the queue so a
       deferred handoff still writes the real story */
    GS_SEAM[cid] = { to: to, tid: tid, atMin: atMin, from: from,
                     deadlineMin: atMin + GS_SEAM_MAX_MIN,
                     doing: opts.doing || null,
                     errands: opts.errands || null };
    return { ok: true, queued: true };
  }
  gsBrainApply(cid, to, tid, atMin,
    { from: from, doing: opts.doing, errands: opts.errands });
  return { ok: true, queued: false };
}
function gsBrainApply(cid, to, tid, atMin, o){
  o = o || {};
  if(to === 'degraded') GS_DEGRADED[cid] = atMin;
  if(tid === 'recover' && GS_DEGRADED[cid]) delete GS_DEGRADED[cid];
  /* 'thin'/'full'/'possessed' are derived — applying them is just the
     handoff note; the mode was already correct the moment presence or
     possession changed. */
  gsHandoffWrite(cid, o.from || null, to, atMin, tid, o);
}

/* ---------------- handoff notes ----------------
   one live note per char — the receiving brain's first page. Never
   spectator-visible; the bridge console and the owner report read it. */
const GS_NOTES = {};               // cid -> note
const GS_NOTES_ARCH = [];          // read/stale notes, capped
const GS_NOTES_ARCH_CAP = 200;
const GS_NOTE_STALE_MIN = 1440;    // 24h

function gsHandoffWrite(cid, from, to, atMin, tid, opts){
  opts = opts || {};
  const clock = (typeof gsWireClock === 'function')
    ? gsWireClock(atMin) : { t: null, day: null };
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  /* place + doing from the live pawn when there is one; otherwise the
     routine block at this hour, otherwise their front door */
  const blk = gsThinBlock(cid, clock.t != null ? clock.t / 60 : null);
  let place = null;
  if(v && v.inside) place = v.inside;
  else if(blk && blk.to) place = gsSpecLabelSafe(blk.to) || 'home';
  else if(blk && blk.stops && blk.stops.length)
    place = 'around ' + (gsSpecLabelSafe(blk.stops[0]) || 'the block');
  else place = 'out';
  const near = [];
  if(v && typeof VILLAGERS !== 'undefined')
    for(const o of VILLAGERS){
      if(o === v || !o._castId) continue;
      if(Math.hypot(o.x - v.x, o.y - v.y) < 4 * ((typeof CS !== 'undefined') ? CS : 32))
        near.push(o._castId);
    }
  /* one open thread, honest sources only: rent owed, then the shift
     card, then nothing */
  let pending = null;
  const ob = gsObligations(cid);
  if(ob && ob.home && ob.home.owed > 0)
    pending = 'rent owed — due day ' + (ob.home.dueDay || 1);
  else if(ob && ob.job)
    pending = 'on shift — ' + ob.job.employer +
      (ob.job.shiftTxt ? ' (' + ob.job.shiftTxt + ')' : '');
  const needs = gsThinNeeds(cid);
  const note = {
    char: cid, from: from || 'full', to: to,
    at_min: clock.t, at_day: clock.day || null,
    place: place,
    doing: opts.doing || (v && v.state) || (blk && blk.state) ||
           'their day',
    pending: pending,
    /* v18: a released session's errand tail — public beats only, the
       receiving brain's honest "what just happened" */
    errands: Array.isArray(opts.errands) ? opts.errands.slice(0, 6)
                                         : null,
    near: near.slice(0, 6),
    mood_hint: needs && needs.rest < 0.15 ? 'tired'
             : needs && needs.hunger > 0.75 ? 'hungry' : 'fine',
    transition: tid || 'handoff',
    /* the contract's handoff lead — the released pawn's own voice,
       generic enough to be true anywhere */
    lead: tid === 'handoff' ? 'I was just moving through here — ' : null,
    writtenMin: atMin, readBy: null, stale: false,
  };
  if(GS_NOTES[cid]) gsNoteArchive(cid);        // superseded notes keep
  GS_NOTES[cid] = note;                        // the archive honest
  return note;
}
function gsNoteArchive(cid){
  const n = GS_NOTES[cid];
  if(!n) return;
  n.stale = true;
  GS_NOTES_ARCH.push(n);
  if(GS_NOTES_ARCH.length > GS_NOTES_ARCH_CAP)
    GS_NOTES_ARCH.splice(0, GS_NOTES_ARCH.length - GS_NOTES_ARCH_CAP);
  delete GS_NOTES[cid];
}
function gsHandoffNote(cid){ return GS_NOTES[cid] || null; }
/* the receiving brain reads it once — readBy records which mode took
   the page ('full' wakes, 'thin' takes the handoff); a second read gets
   nothing — the note stays on file via gsHandoffNote but the brain
   already has it */
function gsHandoffRead(cid, mode){
  const n = GS_NOTES[cid];
  if(!n || n.readBy) return null;
  n.readBy = mode || 'brain';
  return n;
}
function gsSpecLabelSafe(spec){
  return (typeof gsSpecLabel === 'function') ? gsSpecLabel(spec) : null;
}

/* ---------------- the degrade ladder ----------------
   service capacity is an honest throttle, not a mood: <60% degrades
   mains lowest scene-salience first, <30% all of them. Recovery re-derives
   the same sorted ladder each pass — as capacity returns, the watched
   end of the ladder gets its brain back first. */
const GS_SERVICE = { cap: 100 };
function gsServiceSet(pct){
  GS_SERVICE.cap = Math.max(0, Math.min(100, Math.floor(+pct || 0)));
  return GS_SERVICE.cap;
}
function gsServiceGet(){ return GS_SERVICE.cap; }
/* scene salience — deterministic: who's near a live session or the
   camera, who's on stage at a venue, who's asleep at home. No pawn
   (medieval) still sorts — a stable hash spread keeps the ladder
   deterministic. */
function gsSalience(cid){
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  if(!v) return 20 + (hashString18(cid + '|sal') % 30);
  let s = 50;
  if(v.state === 'sleep' || v.state === 'rest') s -= 20;
  if(v.inBuilding) s -= 8;
  if(v.inside) s += 12;                       // on stage at a venue
  if(v.state === 'serve' || v.state === 'work' ||
     v.state === 'chat' || v.state === 'teach' ||
     v.state === 'argue') s += 6;
  const cell = (typeof CS !== 'undefined') ? CS : 32;
  if(typeof VILLAGERS !== 'undefined' &&
     typeof inspectedPawnIdx !== 'undefined'){
    const insp = VILLAGERS[inspectedPawnIdx];
    if(insp && insp !== v &&
       Math.hypot(insp.x - v.x, insp.y - v.y) < 8 * cell) s += 25;
  }
  if(typeof GS_POSSESS === 'object')
    for(const oc in GS_POSSESS){
      const pv = gsVillagerForChar(oc);
      if(pv && pv !== v &&
         Math.hypot(pv.x - v.x, pv.y - v.y) < 8 * cell) s += 25;
    }
  return s;
}
function gsServiceEval(nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  if(typeof GS_CORE_CAST !== 'object') return;
  const cap = GS_SERVICE.cap;
  const K = cap >= 60 ? 0
    : (cap < 30 ? Object.keys(GS_CORE_CAST).length
                : Math.ceil(Object.keys(GS_CORE_CAST).length *
                            (60 - cap) / 60));
  const ladder = Object.keys(GS_CORE_CAST)
    .map(cid => ({ cid: cid, s: gsSalience(cid) }))
    .sort((a, b) => a.s - b.s || (a.cid < b.cid ? -1 : 1));
  const want = {};
  for(let i = 0; i < K && i < ladder.length; i++) want[ladder[i].cid] = 1;
  for(const row of ladder){
    const cid = row.cid;
    if(want[cid] && !GS_DEGRADED[cid])
      gsBrainTransition(cid, 'full', 'degraded', now, 'degrade');
    else if(!want[cid] && GS_DEGRADED[cid])
      gsBrainTransition(cid, 'degraded', 'full', now, 'recover');
  }
  return ladder;
}

/* ---------------- the needs model (thin brains) ----------------
   homeostatic posture on top of the routine — hunger rises awake
   (faster on the shift), resets at meal windows; rest depletes awake,
   restores on sleep cells. A full brain manages itself; only thin
   chars tick. */
const GS_NEEDS = {};               // cid -> {hunger, rest}
function gsThinNeeds(cid){
  return GS_NEEDS[cid] || (GS_NEEDS[cid] = { hunger: 0.35, rest: 0.25 });
}
/* the routine block at hour tod — the pawn's live schedule, the hired
   routine builder, or nothing (unspawned ambient: no card to read) */
function gsThinRoutine(cid){
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  if(v && v.sfSched && v.sfSched.length) return v.sfSched;
  if(typeof GS_HIRED === 'object' && GS_HIRED[cid] &&
     typeof gsHiredRoutine === 'function')
    return gsHiredRoutine(cid);
  return null;
}
function gsThinBlock(cid, tod){
  const sched = gsThinRoutine(cid);
  if(!sched || !sched.length || tod == null) return null;
  return sched.find(b => tod >= b.h0 && tod < b.h1) ||
         sched[sched.length - 1];
}
function gsNeedsTick(cid, dtMin, tod){
  const n = gsThinNeeds(cid);
  const blk = gsThinBlock(cid, tod);
  const st = blk && blk.state;
  const work = st === 'work' || st === 'serve' || st === 'carry';
  const asleep = st === 'sleep' ||
    (blk && blk.inside && st === 'rest' && tod != null && tod < 6);
  const meal = st === 'eat' || st === 'meal' ||
    (!work && !asleep && tod != null &&
     ((tod >= 7.5 && tod < 8.5) || (tod >= 12.5 && tod < 13.5) ||
      (tod >= 19 && tod < 20.5)));
  if(meal) n.hunger = Math.max(0, n.hunger - dtMin / 30);
  else n.hunger = Math.min(1, n.hunger + dtMin * (work ? 1.5 : 1) / 720);
  n.rest = asleep ? Math.min(1, n.rest + dtMin / 480)
                  : Math.max(0, n.rest - dtMin / (work ? 720 : 960));
  return n;
}
const GS_FOOD_POIS = ['Haus Coffee', 'Taqueria El Farolito',
  'Bi-Rite Market', 'Dolores Park Cafe', '500 Club',
  'Bi-Rite Creamery', 'Delfina'];
function gsThinFoodPoi(cid){
  const sched = gsThinRoutine(cid) || [];
  const spots = [];
  for(const b of sched){
    if(b.to) spots.push(b.to);
    if(b.stops) for(const s of b.stops) spots.push(s);
  }
  for(const f of GS_FOOD_POIS)
    if(spots.some(s => s && s.poi === f)) return f;
  return 'Haus Coffee';
}
/* the schedule as the thin brain reads it RIGHT NOW — the routine never
   mutates; needs and co-star stints apply as a view on top. Reflexes
   never override a schedule obligation: work/sleep cells stand. */
function gsThinScheduleView(cid, tod){
  const n = gsThinNeeds(cid);
  const cs = GS_COSTAR[cid];
  if(cs) return { state: gsCoStarState(cs.task), task: cs.task,
    to: null, inside: false, source: 'costar', block: null };
  const blk = gsThinBlock(cid, tod);
  if(!blk) return { state: 'idle', to: null, inside: false,
                    source: 'routine', block: null };
  const st = blk.state || 'idle';
  const obligation = st === 'work' || st === 'serve' || st === 'carry' ||
                     st === 'sleep';
  /* worn out: the evening cell cuts short — non-obligation blocks after
     19h fold home early when rest is depleted */
  if(n.rest < 0.15 && !obligation && tod != null && tod >= 19)
    return { state: 'sleep', to: blk.to && blk.to.latlon ? blk.to : null,
      inside: true, source: 'needs', note: 'called it a night early',
      block: blk };
  /* hungry: a non-obligation window detours to the routine's food stop —
     the shift itself is never skipped for a snack */
  if(n.hunger > 0.75 && !obligation)
    return { state: 'eat', to: { poi: gsThinFoodPoi(cid) },
      inside: false, source: 'needs', note: 'grabbed a bite first',
      block: blk };
  return { state: st, to: blk.to || null, stops: blk.stops || null,
           inside: !!blk.inside, source: 'routine', block: blk };
}

/* ---------------- the phrase kit ----------------
   generic street filler only — the kit is shared by every thin pawn, so
   nothing can sound like a character's inner voice. <=3 lines/hr, rolling
   window, deterministic pick. */
const GS_THIN_PHRASES = [
  "fog's finally burning off", 'long day — coffee first',
  'the line was around the corner', 'same shift tomorrow',
  'nice light this evening', "rent's due soon, isn't it",
  "the park's full today", 'almost Friday',
  'that wind came out of nowhere', 'home soon',
];
const GS_PHRASE_CAP = 3;           // per hour, per char
const GS_PHRASE_LOG = {};          // cid -> [mins]
function gsThinSay(cid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const log = (GS_PHRASE_LOG[cid] =
    (GS_PHRASE_LOG[cid] || []).filter(m => now - m < 60));
  if(log.length >= GS_PHRASE_CAP) return null;
  const i = hashString18(cid + '|say|' + Math.floor(now / 60) + '|' +
                         log.length) % GS_THIN_PHRASES.length;
  log.push(now);
  return { char: cid, line: GS_THIN_PHRASES[i],
           used: log.length, cap: GS_PHRASE_CAP };
}

/* ---------------- co-star mode ----------------
   the contract's "NPC nudge": a screened request may summon a THIN pawn
   (ambient cast, or a hire whose owner is offline) for a bounded stint.
   Compliance is checked at activation — role-card fit + reflex vetoes;
   a pawn can always say no, and a no is a real outcome: half back,
   'resolved · declined' on the wire. */
const GS_COSTAR = {};              // cid -> {reqId, task, sinceMin, untilMin, by}
const GS_COSTAR_TASKS = {
  greet:       { generic: 1, state: 'greet' },
  hold_spot:   { generic: 1, state: 'idle' },
  walk_with:   { generic: 1, state: 'walk' },
  join_event:  { generic: 1, state: 'chat', needsEvent: 1 },
  cover_shift: { state: 'serve', work: 1 },
};
function gsCoStarState(task){
  return (GS_COSTAR_TASKS[task] || {}).state || 'idle';
}
function gsCoStarAllow(r, now){
  const cid = r.target;
  const kind = (typeof gsCharKind === 'function') ? gsCharKind(cid) : null;
  if(!kind) return 'unknown_character';
  if(gsBrainMode(cid, now) !== 'thin')
    return 'not_thin';        // mains are awake; hired pawns with their
                              // owner online answer to the owner, not us
  const task = (r.params || {}).task;
  if(!GS_COSTAR_TASKS[task]) return 'unknown_task';
  return true;
}
/* the bounded compliance check — deterministic, honest, testable.
   Returns {ok:true} or {ok:false, reason:<decline code>}. `tod` (hour of
   day) may be passed explicitly for tests. */
function gsCoStarCheck(cid, task, nowMin, durMin, tod){
  const meta = GS_COSTAR_TASKS[task];
  if(!meta) return { ok: false, reason: 'unknown_task' };
  if(tod == null){
    const c = (typeof gsWireClock === 'function')
      ? gsWireClock(nowMin) : { t: null };
    tod = c.t != null ? c.t / 60 : 12;
  }
  const h = (typeof GS_HIRED === 'object') ? GS_HIRED[cid] : null;
  /* role-card fit: a task must fit the day card. Generic asks fit
     anyone; 'cover_shift' needs a post to actually cover. */
  if(meta.work){
    const hasJob = !!(h && h.job && h.job.id && h.job.id !== 'seeking');
    const role = String((h && h.job && h.job.role) ||
      (h && h.role) ||
      ((typeof NV_CAST !== 'undefined' &&
        (NV_CAST.find(c => c.id === cid) || {}).role)) || '').toLowerCase();
    const venue = /barista|coffee|caf|clerk|shop|market|serve|cook|counter|cashier|books|deli|bodega|hardware|baker|librar/.test(role);
    if(!hasJob && !venue) return { ok: false, reason: 'no_post' };
  }
  if(meta.needsEvent &&
     !(typeof GS_EVENTS === 'object' && GS_EVENTS.length))
    return { ok: false, reason: 'no_event' };
  /* reflex vetoes — the pawn reads its own routine and politely says
     no when the ask collides with real life */
  const blk = gsThinBlock(cid, tod);
  if(blk){
    const st = blk.state || 'idle';
    if(st === 'sleep' || (blk.inside && st === 'rest' && tod < 6))
      return { ok: false, reason: 'resting' };
    if((st === 'work' || st === 'serve' || st === 'carry') && !meta.work)
      return { ok: false, reason: 'on_shift' };
    if(meta.work && !(st === 'work' || st === 'serve' || st === 'carry'))
      return { ok: false, reason: 'off_shift' };
  }
  const n = gsThinNeeds(cid);
  if(n.hunger > 0.85) return { ok: false, reason: 'needs_first' };
  if(n.rest < 0.10) return { ok: false, reason: 'worn_out' };
  return { ok: true };
}
function gsCoStarActivate(r, now){
  const cid = r.target;
  if(gsBrainMode(cid, now) !== 'thin')
    return { ok: false, reason: 'not_thin' };
  const task = (r.params || {}).task;
  const chk = gsCoStarCheck(cid, task, now, r.durationMin);
  if(!chk.ok)
    /* the pawn said no — a real outcome, not an error: the request
       resolves declined, half the bill comes back (the bus handles it) */
    return { ok: true, declined: chk.reason };
  GS_COSTAR[cid] = { reqId: r.id, task: task, sinceMin: now,
                     untilMin: r.endMin, by: r.playerId };
  return true;
}
function gsCoStarOff(r){
  const cs = GS_COSTAR[r.target];
  if(cs && cs.reqId === r.id) delete GS_COSTAR[r.target];
}
function gsCoStarBoard(){
  const out = {};
  for(const cid in GS_COSTAR)
    out[cid] = { task: GS_COSTAR[cid].task, by: GS_COSTAR[cid].by,
                 untilMin: GS_COSTAR[cid].untilMin };
  return out;
}
/* the bus action — registered here like every other catalogue entry.
   2cr/min: a thin pawn's stint is cheap agency, priced like one. */
if(typeof gsDefineAction === 'function')
  gsDefineAction('costar', {
    scope: 'target', exclusive: true, ratePerMin: 2,
    minMin: 5, maxMin: 60, ttlMin: 30,
    effect: 'maintained',
    allow: (r, now) => gsCoStarAllow(r, now),
    activate: (r, now) => gsCoStarActivate(r, now),
    deactivate: (r, now, why) => gsCoStarOff(r, now, why),
    claims: (r) => [{ cls: 'char', res: 'char:' + r.target }],
  });

/* ---------------- the compute ledger ----------------
   honest brain-minute accounting — what the rate card prices. 'full'
   ticks the LLM meter; thin/possessed/degraded never do (a suspended
   brain, a schedule, and a degraded schedule all cost nothing per
   minute). */
const GS_COMPUTE = { llmMin: 0, llmCalls: 0, thinMin: 0,
                     possessedMin: 0, degradedMin: 0 };
function gsComputeTick(dtMin, nowMin){
  for(const cid of gsAllCharIds()){
    const m = gsBrainMode(cid, nowMin);
    if(m === 'full'){ GS_COMPUTE.llmMin += dtMin;
                     GS_COMPUTE.llmCalls += dtMin; }
    else if(m === 'thin') GS_COMPUTE.thinMin += dtMin;
    else if(m === 'possessed') GS_COMPUTE.possessedMin += dtMin;
    else if(m === 'degraded') GS_COMPUTE.degradedMin += dtMin;
  }
}
function gsComputeStats(){
  return { llmMin: +GS_COMPUTE.llmMin.toFixed(2),
           llmCalls: +GS_COMPUTE.llmCalls.toFixed(2),
           thinMin: +GS_COMPUTE.thinMin.toFixed(2),
           possessedMin: +GS_COMPUTE.possessedMin.toFixed(2),
           degradedMin: +GS_COMPUTE.degradedMin.toFixed(2) };
}

/* ---------------- the obligations ledger ----------------
   rent/wages/jobs are ledger state, not brain state — the read-only
   view that proves they survive every mode drop untouched. */
function gsObligations(cid){
  const lease = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor(cid).find(l => l.status === 'active' ||
        l.status === 'owner-occupied') : null;
  const h = (typeof GS_HIRED === 'object') ? GS_HIRED[cid] : null;
  return {
    char: cid,
    home: lease ? {
      unit: lease.unit_id,
      address: (typeof gsAddressOfUnit === 'function')
        ? gsAddressOfUnit(lease.unit_id) : null,
      rent: lease.monthly_rent,
      dueDay: lease.dueDay != null ? lease.dueDay : null,
      owed: (typeof gsLeaseOwed === 'function')
        ? gsLeaseOwed(lease).total : 0,
    } : null,
    job: (h && h.job && h.job.id && h.job.id !== 'seeking') ? {
      id: h.job.id, employer: h.job.employer, role: h.job.role,
      shift: h.job.shiftTxt || null, pay: h.job.pay || null,
      weeklyWage: h.job.weeklyWage || null,
    } : null,
    seeking: !!(h && h.job && h.job.id === 'seeking'),
    lastPayday: (h && h.lastPayday) || null,
    wagesEarned: (h && h.wagesEarned) || 0,
  };
}

/* ---------------- the owner-facing report ----------------
   a player's own dashboard: presence, their chars' modes, live notes,
   needs, obligations. Console/owner surface — brain modes never reach
   gsViewerState (a spectator can't tell a brain dropped). */
function gsOfflineReport(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const chars = [];
  if(typeof GS_HIRED === 'object')
    for(const cid in GS_HIRED)
      if(gsHiredOwner(cid) === pid)
        chars.push({ id: cid, name: (typeof gsCharName === 'function')
          ? gsCharName(cid) : cid,
          mode: gsBrainMode(cid, now),
          needs: Object.assign({}, gsThinNeeds(cid)),
          obligations: gsObligations(cid),
          note: GS_NOTES[cid] || null,
          possessed: typeof GS_POSSESS === 'object'
            ? !!GS_POSSESS[cid] : false });
  return { player: pid, presence: gsPresenceOf(pid, now), chars: chars };
}

/* ---------------- the tick ----------------
   everything rides one beat: linger expiries drop brains, the seam
   queue drains, the ladder re-evaluates, needs + compute accrue, stale
   notes archive. Live wiring runs on wall-clock minutes; tests drive
   gsOffTick directly with an explicit now. */
const GS_OFF = { lastTickMin: null };
function gsOffTick(nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const dt = GS_OFF.lastTickMin != null
    ? Math.max(0, now - GS_OFF.lastTickMin) : 0;
  GS_OFF.lastTickMin = now;
  /* linger expiry: the grace ends, brains drop with their notes */
  for(const pid in GS_PRESENCE){
    const p = GS_PRESENCE[pid];
    if(p.offMin != null && p.lingerUntil != null &&
       now >= p.lingerUntil){
      p.lingerUntil = null;                 // fully offline now
      /* every hire this owner holds was 'full' through the linger and
         is 'thin' now — the drop note records the landing (a possessed
         body can't be here: disconnect ends sessions first) */
      if(typeof GS_HIRED === 'object')
        for(const cid in GS_HIRED)
          if(gsHiredOwner(cid) === pid &&
             !(typeof GS_POSSESS === 'object' && GS_POSSESS[cid]))
            gsBrainTransition(cid, 'full', 'thin', now, 'offline_drop');
    }
  }
  /* seam drain — pending transitions land at the beat boundary or the
     90s deadline, whichever comes first */
  for(const cid of Object.keys(GS_SEAM)){
    const s = GS_SEAM[cid];
    if(now >= s.deadlineMin || gsSeamReady(cid)){
      delete GS_SEAM[cid];
      gsBrainApply(cid, s.to, s.tid, now,
        { from: s.from, doing: s.doing, errands: s.errands });
    }
  }
  /* the ladder re-derives — capacity moves get answered the same pass */
  gsServiceEval(now);
  /* orphaned co-star stints (a request that vanished without
     deactivating) release the pawn — same rule as the possess sweep */
  for(const cid of Object.keys(GS_COSTAR)){
    const cs = GS_COSTAR[cid];
    const r = cs.reqId && (typeof gsRequestById === 'function')
      ? gsRequestById(cs.reqId) : null;
    if(!r || r.status !== 'active') delete GS_COSTAR[cid];
  }
  if(dt > 0){
    const c = (typeof gsWireClock === 'function')
      ? gsWireClock(now) : { t: null };
    const tod = c.t != null ? c.t / 60 : 12;
    for(const cid of gsAllCharIds())
      if(gsBrainMode(cid, now) === 'thin') gsNeedsTick(cid, dt, tod);
    gsComputeTick(dt, now);
  }
  /* stale handoffs archive — yesterday's page is history, not state */
  for(const cid of Object.keys(GS_NOTES))
    if(now - GS_NOTES[cid].writtenMin > GS_NOTE_STALE_MIN)
      gsNoteArchive(cid);
}
/* live wiring: the tick rides the bus beat — gsBusTick calls gsOffTick
   at the end of every pass (same wall-clock minutes, same beat as the
   possess sweep and the wire). Tests drive gsOffTick (or gsBusTick)
   directly with an explicit now. */

/* ---------------- persistence — rides the bus snapshot ---------------- */
function gsOffSnapshot(){
  return { presence: GS_PRESENCE, degraded: GS_DEGRADED,
    seam: GS_SEAM, notes: GS_NOTES, arch: GS_NOTES_ARCH,
    needs: GS_NEEDS, compute: GS_COMPUTE, costar: GS_COSTAR,
    phrases: GS_PHRASE_LOG, service: GS_SERVICE.cap,
    lastTickMin: GS_OFF.lastTickMin };
}
function gsOffLoad(d){
  if(!d) return;
  for(const k in GS_PRESENCE) delete GS_PRESENCE[k];
  if(d.presence) Object.assign(GS_PRESENCE, d.presence);
  for(const k in GS_DEGRADED) delete GS_DEGRADED[k];
  if(d.degraded) Object.assign(GS_DEGRADED, d.degraded);
  for(const k in GS_SEAM) delete GS_SEAM[k];
  if(d.seam) Object.assign(GS_SEAM, d.seam);
  for(const k in GS_NOTES) delete GS_NOTES[k];
  if(d.notes) Object.assign(GS_NOTES, d.notes);
  GS_NOTES_ARCH.length = 0;
  if(Array.isArray(d.arch)) GS_NOTES_ARCH.push.apply(GS_NOTES_ARCH, d.arch);
  for(const k in GS_NEEDS) delete GS_NEEDS[k];
  if(d.needs) Object.assign(GS_NEEDS, d.needs);
  if(d.compute) Object.assign(GS_COMPUTE, d.compute);
  for(const k in GS_COSTAR) delete GS_COSTAR[k];
  if(d.costar) Object.assign(GS_COSTAR, d.costar);
  for(const k in GS_PHRASE_LOG) delete GS_PHRASE_LOG[k];
  if(d.phrases) Object.assign(GS_PHRASE_LOG, d.phrases);
  GS_SERVICE.cap = (d.service != null) ? d.service : 100;
  GS_OFF.lastTickMin = (d.lastTickMin != null) ? d.lastTickMin : null;
}
function gsOffReset(){
  for(const k in GS_PRESENCE) delete GS_PRESENCE[k];
  for(const k in GS_DEGRADED) delete GS_DEGRADED[k];
  for(const k in GS_SEAM) delete GS_SEAM[k];
  for(const k in GS_NOTES) delete GS_NOTES[k];
  GS_NOTES_ARCH.length = 0;
  for(const k in GS_NEEDS) delete GS_NEEDS[k];
  GS_COMPUTE.llmMin = 0; GS_COMPUTE.llmCalls = 0;
  GS_COMPUTE.thinMin = 0; GS_COMPUTE.possessedMin = 0;
  GS_COMPUTE.degradedMin = 0;
  for(const k in GS_COSTAR) delete GS_COSTAR[k];
  for(const k in GS_PHRASE_LOG) delete GS_PHRASE_LOG[k];
  GS_SERVICE.cap = 100;
  GS_OFF.lastTickMin = null;
}

/* ---------------- bridge surface ----------------
   presence, modes, notes, needs, obligations, the compute ledger and
   the service knob — console + owner surfaces, never the wire. */
if(typeof window !== 'undefined' && window.__aiBridge){
  const B = window.__aiBridge;
  B.gsPlayerOnline = (pid, nowMin) => gsPlayerOnline(pid, nowMin);
  B.gsPlayerOffline = (pid, nowMin) => gsPlayerOffline(pid, nowMin);
  B.gsPresenceOf = (pid, nowMin) => gsPresenceOf(pid, nowMin);
  B.gsBrainMode = (cid, nowMin) => gsBrainMode(cid, nowMin);
  B.gsBrainModes = (nowMin) => gsBrainModes(nowMin);
  B.gsHandoffNote = (cid) => gsHandoffNote(cid);
  B.gsHandoffRead = (cid, mode) => gsHandoffRead(cid, mode);
  B.gsOfflineReport = (pid, nowMin) => gsOfflineReport(pid, nowMin);
  B.gsComputeStats = () => gsComputeStats();
  B.gsServiceSet = (pct) => gsServiceSet(pct);
  B.gsServiceGet = () => gsServiceGet();
  B.gsThinSay = (cid, nowMin) => gsThinSay(cid, nowMin);
  B.gsThinNeeds = (cid) => gsThinNeeds(cid);
  B.gsThinScheduleView = (cid, tod) => gsThinScheduleView(cid, tod);
  B.gsObligations = (cid) => gsObligations(cid);
  B.gsCoStarCheck = (cid, task, nowMin, durMin, tod) =>
    gsCoStarCheck(cid, task, nowMin, durMin, tod);
  B.gsCoStarBoard = () => gsCoStarBoard();
}
