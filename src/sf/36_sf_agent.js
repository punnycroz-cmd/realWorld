/* =====================================================================
   PART 36 — SF AGENT ACTIONS (v16 "the becoming brain" contract)

   External minds act through sfAgentAct(cid, act, meta) — real sim calls
   (sfGoTo/sfFollowPath/sfEnterPOI), never direct motor writes. An order
   parks on v.sfAgent and sfNpcTick honors it until done/expired/failed,
   then the brain's standing directive (v.sfDirective) promotes — or the
   pawn stands in a visible intention_gap. A driven main NEVER resumes a
   code-authored schedule. This is the character's brain, not player
   possession: the production UI exposes no control of the 8 mains.

   VERBS (design §2.1):  move | talk | work | rest | idle | sleep |
                         say | leave | reflect | request
   Per-act fields: to · at · text · holdH(≤2) · lingerH(≤2) · why(REQ)
                   do · mood · intent · concerns · endSay · insights
   Standing will: meta.directive — same verbs minus request/say/leave/
                  reflect; why always required; untilH ≤ 6; restated
                  EVERY turn or it lapses.
   Outcomes: completed | expired | failed | interrupted (new_order /
             survival:* / target_left / convo_ended / no_answer).

   sfAgentState(cid, opts) returns ONLY what a passerby could observe:
   senses, felt time, place, nearby cast, needs bars, wire tail — plus
   the interiority surface (mind/convo/lastConvo) and, with
   opts.reflect, the reflection archive. No pushed clock (glance pulls),
   no routine field (the brain's BRIEF carries life context).
   ===================================================================== */

function sfPawnOf(cid){
  return VILLAGERS.find(v => v._castId === cid) ||
         VILLAGERS.find(v => v.name && v.name.toLowerCase() === String(cid).toLowerCase());
}

/* one-of-C1..C8 check — the possession-ban + injection-filter predicate.
   GS_CORE_CAST is the canonical set (systems/41_game_systems_requests.js);
   the regex fallback keeps the predicate true before that module loads. */
function sfIsMain(v){
  if(!v) return false;
  const cid = v._castId || '';
  if(typeof GS_CORE_CAST !== 'undefined' && GS_CORE_CAST[cid]) return true;
  return /^C[1-8]$/.test(cid);
}

function sfSay(v, text){
  v.sayText = String(text).slice(0, 90);
  v.sayUntil = W.tod + 0.35;              // ~21 sim-minutes on screen
  v.sayAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
}

/* absolute sim-hour clock — orders and wills must not un-lapse when
   tod wraps past midnight */
function sfAbsNow(){ return W.day * 24 + W.tod; }

/* ---- perception ----
   A pawn perceives another when they share a space (same venue, or both
   outdoors) within ~8 cells — the same bound sfAgentState uses for the
   `nearby` list. God-mode VILLAGERS scans are gone from the contract:
   talk resolves targets through this field or a brain-named `at`. */
function sfSameSpace(a, b){
  if(!a || !b) return false;
  if(a.inBuilding || b.inBuilding)
    return a.inBuilding && b.inBuilding && a.inside === b.inside;
  return true;
}
function sfPerceived(v, t){
  return sfSameSpace(v, t) && Math.hypot(v.x - t.x, v.y - t.y) <= CS * 8;
}

/* a venue is private (a home, a flat) when it isn't a registered public
   POI — SF_POIS only carries venues with a public kind. Private homes
   are never auto-entered: the seeker waits at the door. */
function sfIsPublicVenue(name){
  if(!name) return false;
  const p = sfFindPOI(name);
  return !!(p && p.bld != null && p.bld >= 0);
}

/* 'home' (and 'my home'/'my flat') resolves to the pawn's own home cell;
   returning there is the one interior a pawn may always enter. */
function sfResolvePlace(v, ref){
  if(!ref) return null;
  const s = String(ref).trim();
  if(/^my\s+(home|flat|place|stoop|room|bed)$/i.test(s) || /^home$/i.test(s)){
    return { label: 'home', cell: v.sfHome, home: true };
  }
  const p = sfFindPOI(s);
  if(p) return { label: p.name, cell: sfPoiDoor(p), poi: p.name,
                 public: true };
  const cell = sfAnchorCell(s);
  if(cell){
    /* an anchor that resolves to a building door is that building's
       interior if it has a name (e.g. g744 -> '744 Guerrero') */
    const al = (SF_MAP.anchors || {})[s];
    let inside = null, pub = false;
    if(al && al.bld >= 0){
      const b = SF_BLD[al.bld];
      if(b && b.name) inside = b.name;
      else if(SF_INTERIORS[s]) inside = s;
      pub = !!(inside && sfFindPOI(inside));
    }
    return { label: inside || s, cell, inside, public: pub };
  }
  if(typeof gsParseAddress === 'function'){
    const pa = gsParseAddress(s);
    if(pa && pa.bld && pa.bld.bld_idx != null &&
       SF_DOOR_OF.has(pa.bld.bld_idx)){
      const b = SF_BLD[pa.bld.bld_idx];
      return { label: pa.address, cell: SF_DOOR_OF.get(pa.bld.bld_idx),
               inside: (b && b.name) || null, public: !!(b && b.name &&
               sfFindPOI(b.name)) };
    }
  }
  return null;
}

/* the verb registry — orders and directives share it, except that a
   directive may not hold request/say/leave/reflect: a will that
   refiles public requests or speaks on its own is not a will */
const SF_AGENT_VERBS = ['move', 'talk', 'work', 'rest', 'idle', 'sleep',
                        'say', 'leave', 'reflect', 'request'];
const SF_DIR_VERBS   = ['move', 'talk', 'work', 'rest', 'idle', 'sleep'];

/* ---------------- survival reflex (design §2.4 — code, always wins) --
   Genuine emergencies only. SF's set is deliberately thin: the lethal-
   needs COLLAPSE band. Sleep is a state, not an emergency (removed);
   there is no weather veto anywhere in the contract (dissolved
   2026-09-23). The reflex saves the body — downed, needs drift back to
   the band EDGE (never topped up) — and releases; the next move is the
   brain's. */
function sfReflexNow(v){
  if(!v || v.dead) return null;
  const b = v.body;
  if(b){
    if((b.hydration != null ? b.hydration : 1) < 0.05)
      return 'collapse:hydration';
    if((b.satiety != null ? b.satiety : 1) < 0.05)
      return 'collapse:satiety';
    if((b.fatigue != null ? b.fatigue : 0) > 0.98)
      return 'collapse:fatigue';
  }
  return null;
}

/* while the collapse reflex holds, the body drifts back toward the band
   edge (the fiction: someone got them upright, water, a shaded step) —
   honest partial recovery, never a top-up */
function sfReflexDrift(v, dtH){
  const b = v.body;
  if(!b) return;
  if(b.satiety   != null && b.satiety   < 0.10) b.satiety   = Math.min(0.10, b.satiety   + 0.05 * dtH);
  if(b.hydration != null && b.hydration < 0.10) b.hydration = Math.min(0.10, b.hydration + 0.05 * dtH);
  if(b.fatigue   != null && b.fatigue   > 0.92) b.fatigue   = Math.max(0.92, b.fatigue   - 0.04 * dtH);
}

/* ---- presence-verb grounding: "at <to>, do <verb>" — navigate to the
   named place first, enter it when it's public (or the pawn's own
   home), then hold the verb until the order lapses. */
function sfGroundStep(v, a, dtH){
  const cell = a.cell;
  const tx = cell.wx * CS + 16, ty = cell.wy * CS + 16;
  if(Math.hypot(v.x - tx, v.y - ty) < CS * 1.2){
    v.sfPath = null; v.moving = false;
    if(a.enter && !v.inBuilding){
      if(a.enter === 'home'){
        v.inBuilding = true; v.inside = a.enterLabel || 'home';
      } else {
        const p = sfFindPOI(a.enter);
        if(p) sfEnterPOI(v, p.name);
        else { v.inBuilding = true; v.inside = a.enterLabel || a.enter; }
      }
    }
    a.phase = 'hold';
    return true;
  }
  if(v.inside || v.inBuilding) sfExitPOI(v);
  if(!v.sfPath || !v.sfPath.length) sfGoTo(v, cell.wx, cell.wy);
  if(v.sfPath && v.sfPath.length) sfFollowPath(v, dtH);
  else { a.phase = 'hold'; }  // unreachable door — hold where standing
  return false;
}

/* ---------------- per-tick driver for an active agent order -------- */
function sfAgentTick(v, a, dtH){
  if(a.verb === 'move'){
    const cell = a.cell;
    if(a.poi && v.inside === a.poi){ v.state = 'idle'; a.done = true; return; }
    const tx = cell.wx * CS + 16, ty = cell.wy * CS + 16;
    if(Math.hypot(v.x - tx, v.y - ty) < CS * 1.2){
      v.sfPath = null; v.moving = false;
      if(a.poi){
        const p = sfFindPOI(a.poi);
        if(p) sfEnterPOI(v, p.name);
        else if(a.enter){ v.inBuilding = true; v.inside = a.enter; }
        else if(a.home){ v.inBuilding = true; v.inside = 'home'; }
      }
      v.state = 'idle'; a.done = true;
      return;
    }
    if(v.inside || v.inBuilding) sfExitPOI(v);
    if(!v.sfPath || !v.sfPath.length) sfGoTo(v, cell.wx, cell.wy);
    if(v.sfPath && v.sfPath.length) sfFollowPath(v, dtH);
    else { v.state = 'idle'; a.fail = 'unreachable'; a.done = true; }
    return;
  }

  if(a.verb === 'talk'){
    const t = sfPawnOf(a.to);
    if(!t){ a.fail = 'gone'; a.done = true; return; }
    if(a.phase === 'linger'){
      /* contact made — hold the linger window; the convo itself lives on
         v.sfConvo and outlives the order */
      if(sfAbsNow() >= a.lingerUntil){ a.done = true; v.state = 'idle'; }
      else { v.state = 'chat'; v.faceTo = { x: t.x, y: t.y }; }
      return;
    }
    /* seek phase */
    const canSee = sfPerceived(v, t);
    if(!canSee && a.seenAt && !a.at){
      /* was perceived at filing, gone now — the target left the field;
         an interruption, not a failure */
      a.interrupted = 'target_left'; a.done = true;
      return;
    }
    let dest = null;
    if(canSee) dest = { wx: Math.floor(t.x / CS), wy: Math.floor(t.y / CS) };
    else if(a.atCell) dest = a.atCell;
    else if(t.inBuilding && sfIsPublicVenue(t.inside) && sfFindPOI(t.inside))
      dest = sfPoiDoor(sfFindPOI(t.inside));   // perceived inside a venue
    if(!dest){ a.fail = "can't find them"; a.done = true; return; }

    /* same-space + adjacent: the line lands */
    const near = sfSameSpace(v, t) &&
                 Math.hypot(v.x - t.x, v.y - t.y) <= CS * 2;
    if(near){ sfTalkContact(v, t, a); return; }

    /* target inside a PRIVATE home: never auto-enter — wait at the door;
       if they step out mid-wait the line still lands */
    if(t.inBuilding && t.inside && !sfIsPublicVenue(t.inside)){
      const door = a.atCell || dest;
      const dx = door.wx * CS + 16, dy = door.wy * CS + 16;
      if(Math.hypot(v.x - dx, v.y - dy) < CS * 1.5){
        v.sfPath = null; v.moving = false; v.state = 'idle';
        a.waitingOutside = true;
        v.faceTo = { x: dx, y: dy };
        return;   // holds until holdH lapses -> expired+waiting_outside
      }
    }
    /* leave our own venue unless the target shares it */
    if((v.inside || v.inBuilding) && !(t.inBuilding && v.inside === t.inside))
      sfExitPOI(v);
    if(!v.sfPath || !v.sfPath.length) sfGoTo(v, dest.wx, dest.wy);
    if(v.sfPath && v.sfPath.length) sfFollowPath(v, dtH);
    else { a.fail = 'unreachable'; a.done = true; }
    return;
  }

  /* say / leave / reflect — the act lands at filing; the order is
     already done and resolves 'completed' on the end-write */
  if(a.verb === 'say' || a.verb === 'leave' || a.verb === 'reflect'){
    v.sfPath = null; v.moving = false;
    v.state = 'idle'; a.done = true;
    return;
  }

  /* work | rest | idle | sleep — presence verbs; `to` grounds them:
     "there, doing this" */
  if(a.cell && a.phase !== 'hold'){
    sfGroundStep(v, a, dtH);
    return;
  }
  v.sfPath = null; v.moving = false;
  v.state = (a.verb === 'rest' || a.verb === 'sleep') ? a.verb
    : (a.verb === 'work' ? 'work' : 'idle');
}

/* contact! — the opener lands: bubble, mutual observe, convo opens.
   Speaker holds participating with the floor passed; target is
   invited. The talk order then lingers (lingerH window). */
function sfTalkContact(v, t, a){
  v.sfPath = null; v.moving = false; v.state = 'chat';
  v.faceTo = { x: t.x, y: t.y };
  if(!a.said){
    a.said = true;
    sfSay(v, a.text);
    if(typeof observe === 'function'){
      observe(v, 'spoke with ' + (t.name || a.to), { topic: 'talk_' + t._castId,
        source: 'direct', confidence: 0.95, salience: 0.7, bypassAttention: true });
      observe(t, (v.name || 'someone') + ' said: "' + a.text + '"',
        { topic: 'talk_' + v._castId, source: 'direct', confidence: 0.9,
          salience: 0.7, bypassAttention: true });
    }
    if(typeof sfConvoOpen === 'function') sfConvoOpen(v, t, a.text);
    if(typeof sfDispatchTrig === 'function')
      sfDispatchTrig(t, 'convo_invite', 'T1', { from: v._castId || v.name });
  }
  a.phase = 'linger';
  a.lingerUntil = sfAbsNow() + (a.lingerH || 0.5);
}

/* normalize a filed directive (or a chain entry) into the durable
   will shape. `until` inherits the root's horizon on chain hops. */
function sfAgentDirNorm(d, until){
  return { verb: String(d.verb || 'idle').toLowerCase(),
    to: d.to, text: d.text, why: d.why || null, holdH: d.holdH,
    until: (until != null) ? until
      : sfAbsNow() + Math.min(6, Math.max(0.5, +(d.untilH || 4))),
    repeat: d.repeat !== false, promotedN: 0,
    chain: (d.then && typeof d.then === 'object') ? d.then : null,
    day: W.day };
}

/* validate a directive filing — walks the whole .then chain so a bad
   verb is named at filing, not discovered mid-gap. why is required on
   every link now (design §2.1: every act carries an in-fiction reason). */
function sfAgentDirCheck(d){
  let cur = d, depth = 0;
  while(cur && typeof cur === 'object' && depth++ < 8){
    const dv = String(cur.verb || '').toLowerCase();
    if(SF_DIR_VERBS.indexOf(dv) < 0)
      return 'verb ' + (dv || '?') + ' cannot be a standing will ' +
             '(no request/say/leave/reflect)';
    if(!String(cur.why || '').trim())
      return 'directive needs a "why" — one in-fiction sentence';
    cur = cur.then;
  }
  return null;
}

/* validate a live act filing — syntax only, never semantics */
function sfAgentActCheck(v, act){
  const verb = String(act.verb || '').toLowerCase();
  if(SF_AGENT_VERBS.indexOf(verb) < 0)
    return 'unknown verb ' + (verb || '?');
  if(!String(act.why || '').trim())
    return 'every act needs a "why" — one in-fiction sentence a watcher ' +
           'could overhear';
  if(verb === 'move' && !act.to)
    return 'move needs "to" — a place name, an address, or "home"';
  if(verb === 'talk'){
    if(!act.to) return 'talk needs "to" — who';
    if(!String(act.text || '').trim())
      return 'talk needs "text" — there is no default hey';
    const t = sfPawnOf(act.to);
    if(t === v) return 'cannot talk to self';
  }
  if(verb === 'say'){
    if(!String(act.text || '').trim())
      return 'say needs "text" — code never invents a line';
    if(!v.sfConvo || v.sfConvo.state === 'ended' ||
       v.sfConvo.state === 'dropped')
      return 'no active conversation — say lives on the channel';
  }
  if(verb === 'leave'){
    if(!v.sfConvo || v.sfConvo.state === 'ended' ||
       v.sfConvo.state === 'dropped')
      return 'no active conversation to leave';
  }
  if(verb === 'reflect'){
    if(!Array.isArray(act.insights) || !act.insights.length ||
       !act.insights.every(s => String(s || '').trim()))
      return 'reflect needs insights[] — 1–3 first-person sentences';
  }
  if(verb === 'request'){
    if(act.kind !== 'weather' && act.kind !== 'street_event')
      return 'request needs kind: "weather" | "street_event"';
    if(act.kind === 'weather' && !act.wx)
      return 'weather request needs wx (e.g. "clear"|"rain")';
    if(act.kind === 'street_event' && !act.event)
      return 'street_event request needs event (e.g. "block_party")';
  }
  return null;
}

/* the verb interpreter — builds the parked order for a pawn.
   Returns {ok, order?, ...reply fields}; never throws at the caller.
   Shared by sfAgentAct (a brain's live filing) and sfAgentNext (the
   standing directive promoting at order end). */
function sfAgentIssue(v, act){
  act = act || {};
  const verb = String(act.verb || 'idle').toLowerCase();
  const holdH = Math.min(2, Math.max(0.25, +(act.holdH || 1.25))); // ≤2 sim-hrs

  if(verb === 'move'){
    const pl = sfResolvePlace(v, act.to);
    if(!pl || !pl.cell) return { ok: false, err: 'unknown place: ' + act.to };
    return { ok: true, going: pl.label,
             order: { verb: 'move', poi: pl.public ? pl.label : null,
                      enter: pl.inside || (pl.home ? 'home' : null),
                      home: !!pl.home, cell: pl.cell,
                      until: sfAbsNow() + holdH } };
  }

  if(verb === 'talk'){
    const t = sfPawnOf(act.to);
    if(!t) return { ok: false, err: 'unknown person: ' + act.to };
    /* perception gate (design §2.2): the target must be in the pawn's
       perceptual field, OR the brain names where to look ("at"). A bare
       unperceived target is still filed — the seek fails honestly at
       tick with "can't find them" rather than pretending knowledge. */
    const seen = sfPerceived(v, t);
    const atPl = act.at ? sfResolvePlace(v, act.at) : null;
    if(!seen && !atPl){
      /* nowhere to seek: honest fast-fail at filing, suggest if the
         pawn has a last-known spot for them */
      const sug = (t.inside && sfIsPublicVenue(t.inside)) ? t.inside : null;
      return { ok: true, order: { verb: 'talk', to: act.to, text: act.text,
        phase: 'seek', until: sfAbsNow() + Math.min(holdH, 0.75),
        lingerH: Math.min(2, Math.max(0.25, +(act.lingerH || 0.5))),
        prefail: "can't find them", suggest: sug } };
    }
    return { ok: true, talking: t.name,
             order: { verb: 'talk', to: act.to, text: act.text,
                      phase: 'seek', seenAt: seen ? { x: t.x, y: t.y } : null,
                      at: act.at || null,
                      atCell: atPl ? atPl.cell : null,
                      atLabel: atPl ? atPl.label : null,
                      until: sfAbsNow() + holdH,
                      lingerH: Math.min(2, Math.max(0.25, +(act.lingerH || 0.5))) } };
  }

  if(verb === 'say' || verb === 'leave' || verb === 'reflect'){
    /* the utterance/gesture resolves at filing — the parked order is a
       done marker that reports 'completed' on the next tick */
    return { ok: true,
             order: { verb, done: true,
                      until: sfAbsNow() + Math.min(holdH, 0.5) } };
  }

  if(verb === 'work' || verb === 'rest' || verb === 'idle' ||
     verb === 'sleep'){
    /* presence verbs: "at <to>, do <verb>". The old rain veto and auto-
       shelter are gone — outdoors executes, consequences are the body's. */
    let cell = null, enter = null, label = null;
    if(act.to){
      const pl = sfResolvePlace(v, act.to);
      if(!pl || !pl.cell)
        return { ok: false, err: 'unknown place: ' + act.to };
      cell = pl.cell; label = pl.label;
      if(pl.public) enter = pl.label;
      else if(pl.home) { enter = 'home'; }
      else if(pl.inside) enter = pl.inside;
    }
    return { ok: true, state: verb, going: label,
             order: { verb, cell, enter,
                      enterLabel: label,
                      phase: cell ? 'go' : 'hold',
                      until: sfAbsNow() + holdH } };
  }

  if(verb === 'request'){
    /* the agent steps out of the fiction and files as a spectator —
       the real bus: screen → lane → bill → review. Params are required
       (checked in sfAgentActCheck); standing wills may never carry it. */
    if(typeof gsSubmitRequest !== 'function')
      return { ok: false, err: 'request bus unavailable' };
    const spec = { playerId: 'agent-' + v._castId, kind: act.kind,
                   durationMin: Math.min(180, Math.max(15, +(act.durationMin || 30))),
                   params: { note: act.note || undefined } };
    if(act.kind === 'weather') spec.params.wx = act.wx;
    else { spec.params.event = act.event;
           if(act.at) spec.params.at = act.at; }
    const r = gsSubmitRequest(spec);
    return { ok: true, request: r };
  }
  return { ok: false, err: 'unknown verb ' + verb };
}

/* one action from an external mind. The POST carries an immediate
   `order` plus a STANDING DIRECTIVE (the brain's durable last will for
   the gap between turns) — `directive` as a sibling field (driver), or
   `act.directive` / `act.then` spellings accepted. Code executes it at
   order end, never invents it. */
function sfAgentAct(cid, act, meta){
  const v = sfPawnOf(cid);
  if(!v) return { ok: false, err: 'no character ' + cid };
  act = act || {}; meta = meta || {};
  /* stale-order guard: a late turn must not stomp a newer filing —
     seq is the driver's monotonic turn id */
  const seq = (meta.seq != null) ? meta.seq
            : (act.seq != null ? act.seq : null);
  if(seq != null && v._agentSeq != null && seq < v._agentSeq)
    return { ok: false, err: 'stale order — turn ' + seq +
           ' already superseded by turn ' + v._agentSeq };

  const bad = sfAgentActCheck(v, act);
  if(bad) return { ok: false, err: bad };

  const r = sfAgentIssue(v, act);
  if(r.ok){
    if(seq != null) v._agentSeq = seq;
    r.order && (r.order.seq = seq);
    /* ---- interiority fields ride every filing (design §2.1) ---- */
    if(act.mood != null && String(act.mood).trim())
      v.sfMood = { text: String(act.mood).slice(0, 60),
                   since: sfAbsNow(), day: W.day };
    if(Array.isArray(act.concerns) && act.concerns.length)
      v.sfConcerns = act.concerns.slice(0, 5).map(s => String(s).slice(0, 80));
    if(act.do && String(act.do).trim()){
      v.doText = String(act.do).slice(0, 60);   // ≤8-word gesture caption
      v.doUntil = W.tod + 0.3;
    }
    if(act.intent && typeof act.intent === 'object' &&
       typeof sfIntentArm === 'function')
      r.intentArmed = sfIntentArm(v, act.intent);
    if(act.endSay && String(act.endSay).trim() &&
       typeof observe === 'function')
      observe(v, String(act.endSay), { kind: 'convo', source: 'memory',
        topic: 'convo_' + ((v.sfLastConvo && v.sfLastConvo.with) || 'self'),
        confidence: 0.85, salience: 0.7, bypassAttention: true });
    if(Array.isArray(act.insights) && act.insights.length &&
       typeof observe === 'function'){
      for(const ins of act.insights.slice(0, 3))
        observe(v, String(ins), { kind: 'reflection', source: 'memory',
          topic: 'reflection', confidence: 0.9, salience: 0.8,
          bypassAttention: true });
      v.sfLastReflectAt = sfAbsNow();
    }
    v.sfLastWhy = act.why || meta.reason || null;

    /* ---- conversation verbs resolve at filing ---- */
    const verb = String(act.verb || '').toLowerCase();
    if(verb === 'say' && typeof sfConvoSay === 'function')
      sfConvoSay(v, act.text);
    if(verb === 'leave' && typeof sfConvoLeave === 'function')
      r.left = sfConvoLeave(v, 'left');
    /* a non-say brain turn while holding the floor still passes it —
       the pause IS the reply; a `do` gesture rides the tail */
    if(v.sfConvo && v.sfConvo.yourTurn && verb !== 'say' &&
       verb !== 'leave' && typeof sfConvoPass === 'function')
      sfConvoPass(v, act.do);

    /* the standing will is processed on ANY accepted filing — a
       request-only act may still restate (or intentionally lapse) it */
    const d = meta.directive || act.directive || act.then;
    if(d && typeof d === 'object'){
      const badD = sfAgentDirCheck(d);
      if(badD){ r.thenDropped = badD; v.sfDirective = null; }
      else{
        /* three identical standing wills in a row = the brain coasting
           — flagged on the reply + the record, never vetoed */
        const sig = String(d.verb || '').toLowerCase() + '|' +
                    String(d.to || '');
        v._dirStreak = (v._dirSig === sig) ? (v._dirStreak || 0) + 1 : 1;
        v._dirSig = sig;
        v.sfDirective = sfAgentDirNorm(d, null);
        if(v._dirStreak >= 3)
          r.dirFlag = 'directive_repeat x' + v._dirStreak;
      }
    } else {
      /* no silent carry-over: a turn that doesn't restate the will lets
         it lapse. The gap state makes the lapse visible. */
      v.sfDirective = null;
      v._dirStreak = 0; v._dirSig = null;
    }

    if(r.order && r.order.prefail){
      /* unlocatable talk: accepted, fails on the first tick into
         lastOrder — the brain reads "can't find them" next turn */
      r.order.fail = r.order.prefail; r.order.done = true;
      r.order.err = r.order.prefail;
      if(r.order.suggest) r.suggest = r.order.suggest;
      delete r.order.prefail;
    }
    if(r.order){
      /* a live order replaced mid-flight ends 'interrupted' — the
         brain reads the outcome next turn (interruption ≠ expiry) */
      if(v.sfAgent && !v.sfAgent.done && sfAbsNow() <= v.sfAgent.until)
        v.sfAgentResult = { verb: v.sfAgent.verb, status: 'interrupted',
          interruptedBy: 'new_order', seq: v.sfAgent.seq,
          at: W.tod, day: W.day };
      r.order.why = act.why || meta.reason || null;  // why travels
      v.sfAgent = r.order;
      v.sfAgentDriven = true;
      v.sfGap = false;
      /* a fresh order is the brain deciding to wake — honest exit */
      if(v.state === 'sleep' && verb !== 'sleep' && verb !== 'rest')
        v.state = 'idle';
    }
    /* the dispatch ledger: this filing IS the brain call — record it,
       clear the served triggers (38_sf_brain.js) */
    if(typeof sfDispatchServed === 'function') sfDispatchServed(v);
  }
  return r;
}

/* order end → the standing directive becomes the new order. It re-
   issues through the SAME interpreter, so a stale 'move' resolves
   against the live world and presence verbs ground "at <to>, do <verb>"
   through the same navigate-then-hold path. Freshness + repeat budget
   gate promotion; a chained directive inherits the root's horizon. */
function sfAgentNext(v){
  const d = v && v.sfDirective;
  if(!d || typeof d !== 'object') return null;
  if(!(d.promotedN === 0 || d.repeat)) return null;   // one-shot spent
  if(sfAbsNow() > d.until){ v.sfDirective = null; return null; }
  const r = sfAgentIssue(v, d);
  if(!r.ok || !r.order){
    if(v.sfAgentResult)
      v.sfAgentResult.dirErr = r.err || 'directive refused';
    v.sfDirective = null;
    return null;
  }
  d.promotedN++;
  r.order.fromDirective = true;
  r.order.why = d.why || null;
  const next = d.chain || (d.repeat ? d : null);
  if(next){
    v.sfDirective = sfAgentDirNorm(next, d.until);
    if(next === d) v.sfDirective.promotedN = d.promotedN;  // same will
  } else v.sfDirective = null;
  r.order.then = v.sfDirective;    // introspection — what fires next
  return r.order;
}

/* observable state only — the playtest briefing rule.
   No pushed clock (glance pulls), no routine field (the BRIEF carries
   life context — audit site 18). `mind` is the interiority surface;
   `convo`/`lastConvo` carry the channel; `archive` appears on
   ?reflect=1. */
function sfAgentState(cid, opts){
  const v = sfPawnOf(cid);
  if(!v) return null;
  opts = opts || {};
  const here = v.inside ? ('inside ' + v.inside)
    : (function(){
        let best = null, bd = 60;
        for(const p of SF_POIS){
          const c = sfPoiDoor(p);
          const d = Math.hypot(v.x - (c.wx * CS + 16), v.y - (c.wy * CS + 16));
          if(d < bd){ bd = d; best = p; }
        }
        return best ? 'near ' + best.name : 'on the block';
      })();
  const near = [];
  for(const o of VILLAGERS){
    if(o === v || !o._castId) continue;
    const d = Math.hypot(v.x - o.x, v.y - o.y);
    if(d >= CS * 8) continue;
    /* a passerby sees only their own space: street sees street, venue
       sees venue */
    const sameSpace = v.inBuilding ? (o.inBuilding && o.inside === v.inside)
                                   : !o.inBuilding;
    if(!sameSpace) continue;
    near.push({ id: o._castId, name: o.name,
                dist: Math.round(d / CS * 2) + 'm',
                doing: o.state,
                says: (o.sayUntil > W.tod ? o.sayText : null),
                do: (o.doUntil > W.tod ? o.doText : null) });
  }
  /* wire lines keep their text but drop the '[HH:MM]' stamp — a
     bystander hears the neighborhood, not a clock face */
  const wire = (typeof GS_WIRE !== 'undefined' ? GS_WIRE : []).slice(-6)
    .map(e => (e.who ? e.who + ': ' : '') + e.text);
  const b = v.body || {};
  const st = {
    /* the "now" sentence goes FIRST — LLMs weight early tokens */
    senses: (typeof gsTimeSenses === 'function')
      ? gsTimeSenses(v) : null,
    felt: (typeof gsTimeFelt === 'function')
      ? gsTimeFelt(v, opts) : null,
    you: { id: v._castId, name: v.name, role: v.role },
    place: here, state: v.state,
    needs: { satiety: +(b.satiety || 0).toFixed(2),
             hydration: +(b.hydration || 0).toFixed(2),
             fatigue: +(b.fatigue || 0).toFixed(2) },
    nearby: near, wire,
    order: v.sfAgent ? { verb: v.sfAgent.verb,
                         target: v.sfAgent.poi || v.sfAgent.to ||
                                 v.sfAgent.atLabel || null,
                         status: 'active',
                         phase: v.sfAgent.phase || null,
                         untilH: +((v.sfAgent.until - sfAbsNow()).toFixed(2)),
                         why: v.sfAgent.why || null } : null,
    /* outcome reporting: the brain reads lastOrder every turn; a live
       gap means "your will ran out, we did not invent one" */
    lastOrder: v.sfAgentResult || null,
    /* the brain can see its own standing will persisted */
    directive: v.sfDirective ? { verb: v.sfDirective.verb,
                                 to: v.sfDirective.to || null,
                                 why: v.sfDirective.why || null,
                                 untilH: +((v.sfDirective.until - sfAbsNow())
                                          .toFixed(2)),
                                 repeat: v.sfDirective.repeat,
                                 flag: (v._dirStreak >= 3)
                                   ? 'repeated_default' : null } : null,
    gap: !!v.sfGap,
    reflex: v.sfReflex || null,
    /* v16 interiority surface (design §4.2–4.3) — computed per read so
       what surfaces is always the pawn's CURRENT mind */
    mind: (typeof sfMindScan === 'function') ? sfMindScan(v) : null,
    convo: (typeof sfConvoState === 'function') ? sfConvoState(v) : null,
    lastConvo: (v.sfLastConvo &&
                sfAbsNow() - v.sfLastConvo.at < 1.0) ? v.sfLastConvo : null,
  };
  if(opts.glance && typeof gsTimeGlance === 'function')
    st.glance = gsTimeGlance(v, opts.glance, opts);
  if(opts.reflect && typeof sfReflectArchive === 'function')
    st.archive = sfReflectArchive(v);
  return st;
}

/* bridge surface for tools and the driver */
if(typeof window !== 'undefined'){
  window.__aiBridge = window.__aiBridge || {};
  window.__aiBridge.sfAgentState = sfAgentState;
  window.__aiBridge.sfAgentAct = sfAgentAct;
}
