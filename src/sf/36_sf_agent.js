/* =====================================================================
   PART 36 — SF AGENT ACTIONS (production-1 playtest bridge)

   External minds (the 8-agent visual playtest, dev tools) act through
   sfAgentAct(cid, action) — real sim calls (sfGoTo/sfFollowPath/
   sfEnterPOI), never direct motor writes. An agent order parks on
   v.sfAgent and sfNpcTick honors it until done/expired, then the
   brain's own standing directive (v.sfDirective) promotes — or the
   pawn stands in a visible intention_gap. A driven main NEVER resumes
   the code-authored schedule. This is the character's brain, not
   player possession: the production UI exposes no control of the
   8 mains.

   Verbs: move <poi> | talk <castId|name> <text> | work | rest | idle |
          request <kind> <note>   (request files through the REAL bus as
          spectator 'agent-<cid>' — screen → review → ledger)

   sfAgentState(cid) returns ONLY what a passerby could observe:
   senses, felt time, place, nearby cast, needs bars, recent public
   Wire lines, and the character's own public routine — no secrets, no
   private state, and no pushed clock (exact time is pulled via
   opts.glance — see 41_game_systems_timepiece.js).
   ===================================================================== */

function sfPawnOf(cid){
  return VILLAGERS.find(v => v._castId === cid) ||
         VILLAGERS.find(v => v.name && v.name.toLowerCase() === String(cid).toLowerCase());
}

function sfSay(v, text){
  v.sayText = String(text).slice(0, 90);
  v.sayUntil = W.tod + 0.35;              // ~21 sim-minutes on screen
  v.sayAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
}

/* per-tick driver for an active agent order */
function sfAgentTick(v, a, dtH){
  if(a.verb === 'move'){
    const cell = a.cell;
    if(a.poi && v.inside === a.poi){ v.state = 'idle'; a.done = true; return; }
    const tx = cell.wx * CS + 16, ty = cell.wy * CS + 16;
    if(Math.hypot(v.x - tx, v.y - ty) < CS * 1.2){
      v.sfPath = null; v.moving = false;
      if(a.poi){ const p = sfFindPOI(a.poi); if(p) sfEnterPOI(v, p.name); }
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
    // leave whatever venue we're in — unless the target is inside it too
    if((v.inside || v.inBuilding) && !(t.inBuilding && v.inside === t.inside))
      sfExitPOI(v);
    const d = Math.hypot(v.x - t.x, v.y - t.y);
    if(d > CS * 2){
      if(!v.sfPath || !v.sfPath.length)
        sfGoTo(v, Math.floor(t.x / CS), Math.floor(t.y / CS));
      if(v.sfPath && v.sfPath.length) sfFollowPath(v, dtH);
    } else {
      // at their door: if they're indoors, step into the venue so the
      // exchange happens in the same rendered space (interior pass shows
      // both occupants + the bubble)
      if(t.inBuilding && t.inside && v.inside !== t.inside)
        sfEnterPOI(v, t.inside);
      v.sfPath = null; v.moving = false; v.state = 'idle';
      v.faceTo = { x: t.x, y: t.y };
      if(!a.said){
        a.said = true;
        sfSay(v, a.text || 'hey');
        // real memory hooks: both parties record the exchange
        if(typeof observe === 'function'){
          observe(v, 'spoke with ' + (t.name || a.to), { topic: 'talk_' + t._castId,
            source: 'direct', confidence: 0.95, salience: 0.7, bypassAttention: true });
          observe(t, (v.name || 'someone') + ' said: "' + (a.text || 'hey') + '"',
            { topic: 'talk_' + v._castId, source: 'direct', confidence: 0.9,
              salience: 0.7, bypassAttention: true });
        }
      }
    }
    return;
  }
  /* v13 timepiece: rest/sleep shelter phase — walk to the door first,
     then go inside and actually rest. Outdoors in the rain never gets
     this far (sfAgentAct refuses it). */
  if((a.verb === 'rest' || a.verb === 'sleep') && a.shelter &&
     !v.inBuilding){
    const c = a.shelter.cell;
    const tx = c.wx * CS + 16, ty = c.wy * CS + 16;
    if(Math.hypot(v.x - tx, v.y - ty) < CS * 1.2){
      v.sfPath = null; v.moving = false;
      if(a.shelter.poi){
        const p = sfFindPOI(a.shelter.poi);
        if(p) sfEnterPOI(v, p.name);
      }
      if(!v.inBuilding){
        v.inBuilding = true;
        v.inside = a.shelter.inside || a.shelter.poi || 'home';
      }
      v.state = 'rest';
      return;
    }
    if(!v.sfPath || !v.sfPath.length) sfGoTo(v, c.wx, c.wy);
    if(v.sfPath && v.sfPath.length){ sfFollowPath(v, dtH); return; }
    a.shelter = null;      // unreachable door — rest where you stand
  }
  // work | rest | idle — presence states, renderer shows them in place
  v.sfPath = null; v.moving = false;
  v.state = (a.verb === 'rest' || a.verb === 'sleep') ? 'rest'
    : (a.verb === 'work' ? 'work' : 'idle');
}

/* ---------------- survival reflex (spec §5.3 — code, always wins) ----
   SF's reflex set is deliberately thin today: a pawn the schedule left
   asleep indoors cannot act (a fresh order arriving wakes it — see
   sfAgentAct). The needs-floor top-ups in sfNpcTick are bookkeeping,
   not reflexes — they never displace an order. Fire/flood/lightning
   handlers land here the day SF grows them. */
function sfReflexNow(v){
  if(v && v.state === 'sleep' && v.inBuilding) return 'asleep';
  return null;
}

/* the verb registry — orders and directives share it, except that a
   directive may not hold 'request': a will that auto-refiles public
   requests is a pay-per-action spam loop, not a behavior */
const SF_AGENT_VERBS = ['move', 'talk', 'work', 'rest', 'idle', 'sleep',
                        'request'];

/* absolute sim-hour clock — orders and wills must not un-lapse when
   tod wraps past midnight */
function sfAbsNow(){ return W.day * 24 + W.tod; }

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
   verb is named at filing, not discovered mid-gap */
function sfAgentDirCheck(d){
  let cur = d, depth = 0;
  while(cur && typeof cur === 'object' && depth++ < 8){
    const dv = String(cur.verb || '').toLowerCase();
    if(SF_AGENT_VERBS.indexOf(dv) < 0)
      return 'unknown directive verb ' + dv;
    if(dv === 'request')
      return 'a directive cannot file requests — standing wills do ' +
             'not spend';
    if(['rest', 'sleep', 'idle'].indexOf(dv) >= 0 &&
       !String(cur.why || '').trim())
      return 'rest/idle directive needs a "why" (fatigue, night, ' +
             'rain — what justifies it)';
    cur = cur.then;
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
    /* resolve: POI name -> anchor key (g744, park_center...) ->
       street address ("744 Guerrero") via the registry */
    let cell = null, label = null;
    const p = sfFindPOI(act.to);
    if(p){ cell = sfHomeCell({ poi: p.name }); label = p.name; }
    else{
      cell = sfAnchorCell(act.to);
      if(!cell && typeof gsParseAddress === 'function'){
        const pa = gsParseAddress(act.to);
        if(pa && pa.bld && pa.bld.bld_idx != null &&
           SF_DOOR_OF.has(pa.bld.bld_idx)){
          cell = SF_DOOR_OF.get(pa.bld.bld_idx);
          label = pa.address;
        }
      } else if(cell) label = String(act.to);
    }
    if(!cell) return { ok: false, err: 'unknown place: ' + act.to };
    return { ok: true, going: label,
             order: { verb: 'move', poi: label, cell,
                      until: sfAbsNow() + holdH } };
  }
  if(verb === 'talk'){
    const t = sfPawnOf(act.to);
    if(!t) return { ok: false, err: 'unknown person: ' + act.to };
    if(t === v) return { ok: false, err: 'cannot talk to self' };
    return { ok: true, talking: t.name,
             order: { verb: 'talk', to: act.to, text: act.text || 'hey',
                      until: sfAbsNow() + Math.min(holdH, 0.5) } };
  }
  if(verb === 'work' || verb === 'rest' || verb === 'idle' ||
     verb === 'sleep'){
    /* v13 timepiece: rest is a sheltered act. Outdoors it routes home
       (or the nearest interior) first; in rain it's refused outright
       with a suggestion — nobody naps on a wet sidewalk. */
    const napping = (verb === 'rest' || verb === 'sleep');
    if(napping && !v.inBuilding && typeof gsTimeShelter === 'function'){
      const shel = gsTimeShelter(v);
      if((W.rain || 0) > 0.05)
        return { ok: false,
          err: 'resting outdoors in the rain — ' +
            (shel ? 'head for ' + shel.label + ' first'
                  : 'find a roof first'),
          suggest: shel ? shel.label : 'indoors' };
      if(shel){
        return { ok: true, state: 'rest', sheltering: shel.label,
                 order: { verb: 'rest', until: sfAbsNow() + holdH,
                          shelter: shel } };
      }
    }
    return { ok: true, state: napping ? 'rest' : verb,
             order: { verb: napping ? 'rest' : verb,
                      until: sfAbsNow() + holdH } };
  }
  if(verb === 'request'){
    /* the agent steps out of the fiction and files as a spectator —
       the real bus: screen → lane → bill → review. Public-good kinds
       only: no possess (mains are banned), no hire/buy/listing. */
    if(typeof gsSubmitRequest !== 'function')
      return { ok: false, err: 'request bus unavailable' };
    const kind = (act.kind === 'weather') ? 'weather' : 'street_event';
    const spec = { playerId: 'agent-' + v._castId, kind,
                   durationMin: Math.min(180, Math.max(15, +(act.durationMin || 30))),
                   params: { note: act.note || undefined } };
    if(kind === 'weather') spec.params.wx = act.wx || 'clear';
    else { spec.params.event = act.event || 'block_party';
           if(act.at) spec.params.at = act.at; }
    const r = gsSubmitRequest(spec);
    return { ok: true, request: r };
  }
  return { ok: false, err: 'unknown verb ' + verb };
}

/* one action from an external mind. The POST may carry a STANDING
   DIRECTIVE (spec §5.2 — the brain's durable last will for the gap
   between its turns): `directive` as a sibling field (driver), or
   `act.directive` / `act.then` (spellings accepted). Code executes it
   at order end, never invents it (user decision 2026-09-23). */
function sfAgentAct(cid, act, meta){
  const v = sfPawnOf(cid);
  if(!v) return { ok: false, err: 'no character ' + cid };
  act = act || {}; meta = meta || {};
  /* stale-order guard (pitfall §5.7.8): a late turn must not stomp a
     newer filing — seq is the driver's monotonic turn id */
  const seq = (meta.seq != null) ? meta.seq
            : (act.seq != null ? act.seq : null);
  if(seq != null && v._agentSeq != null && seq < v._agentSeq)
    return { ok: false, err: 'stale order — turn ' + seq +
           ' already superseded by turn ' + v._agentSeq };
  const r = sfAgentIssue(v, act);
  if(r.ok){
    if(seq != null) v._agentSeq = seq;
    /* the standing will is processed on ANY accepted filing — a
       request-only act may still restate (or intentionally lapse) it */
    const d = meta.directive || act.directive || act.then;
    if(d && typeof d === 'object'){
      const bad = sfAgentDirCheck(d);
      if(bad){ r.thenDropped = bad; v.sfDirective = null; }
      else{
        /* three identical standing wills in a row = the brain coasting
           — flagged on the reply + the record, never vetoed (§5.6) */
        const sig = String(d.verb || '').toLowerCase() + '|' +
                    String(d.to || '');
        v._dirStreak = (v._dirSig === sig) ? (v._dirStreak || 0) + 1 : 1;
        v._dirSig = sig;
        v.sfDirective = sfAgentDirNorm(d, null);
        if(v._dirStreak >= 3)
          r.dirFlag = 'directive_repeat x' + v._dirStreak;
      }
    } else {
      /* §5.5 — no silent carry-over: a turn that doesn't restate the
         will lets it lapse. The gap state makes the lapse visible. */
      v.sfDirective = null;
      v._dirStreak = 0; v._dirSig = null;
    }
    if(r.order){
      /* a live order replaced mid-flight ends 'interrupted' — the
         brain reads the outcome next turn (interruption ≠ expiry) */
      if(v.sfAgent && !v.sfAgent.done && sfAbsNow() <= v.sfAgent.until)
        v.sfAgentResult = { verb: v.sfAgent.verb, status: 'interrupted',
          interruptedBy: 'new_order', at: W.tod, day: W.day };
      r.order.why = act.why || meta.reason || null;  // why travels
      v.sfAgent = r.order;
      v.sfAgentDriven = true;
      v.sfGap = false;
      /* a fresh order is the brain deciding to wake — honest exit */
      if(v.state === 'sleep') v.state = 'idle';
    }
  }
  return r;
}

/* order end → the standing directive becomes the new order. It re-
   issues through the SAME interpreter, so a stale 'move' resolves
   against the live world and a rainy-day 'rest' fails honest (the pawn
   then stands in the honest gap — never a code-invented behavior).
   Freshness + repeat budget gate promotion; a chained directive
   inherits the root's horizon. */
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
   v13: no pushed clock. `senses` + `felt` are generated per-pawn;
   exact time is pulled via opts.glance ('phone'|'wallclock'|'ask'). */
function sfAgentState(cid, opts){
  const v = sfPawnOf(cid);
  if(!v) return null;
  opts = opts || {};
  const poi = v.inside ? sfFindPOI(v.inside) : null;
  const here = v.inside ? ('inside ' + v.inside)
    : (function(){
        let best = null, bd = 60;
        for(const p of SF_POIS){
          const c = sfHomeCell({ poi: p.name });
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
    // a passerby sees only their own space: street sees street, venue
    // sees venue
    const sameSpace = v.inBuilding ? (o.inBuilding && o.inside === v.inside)
                                   : !o.inBuilding;
    if(!sameSpace) continue;
    near.push({ id: o._castId, name: o.name, dist: Math.round(d / CS * 2) + 'm',
                doing: o.state, says: (o.sayUntil > W.tod ? o.sayText : null) });
  }
  /* wire lines keep their text but drop the '[HH:MM]' stamp — a
     bystander hears the neighborhood, not a clock face */
  const wire = (typeof GS_WIRE !== 'undefined' ? GS_WIRE : []).slice(-6)
    .map(e => (e.who ? e.who + ': ' : '') + e.text);
  const b = v.body || {};
  const st = {
    /* spec §3: the "now" sentence goes FIRST — LLMs weight early tokens */
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
                         target: v.sfAgent.poi || v.sfAgent.to || null,
                         status: 'active',
                         untilH: +((v.sfAgent.until - sfAbsNow()).toFixed(2)),
                         why: v.sfAgent.why || null } : null,
    /* §5.4 — outcome reporting: the brain reads lastOrder every turn;
       a live gap means "your will ran out, we did not invent one" */
    lastOrder: v.sfAgentResult || null,
    /* the brain can see its own standing will persisted (§5.2) */
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
    /* numeric hours, never 'HH:MM' — the spec's clock-regex stays clean */
    routine: (v.sfSched || []).map(s => ({ start: s.h0, end: s.h1,
      at: (s.to && s.to.poi ? s.to.poi : (s.to && s.to.anchor) || 'around') })),
  };
  if(opts.glance && typeof gsTimeGlance === 'function')
    st.glance = gsTimeGlance(v, opts.glance, opts);
  return st;
}

/* bridge surface for tools and the driver */
if(typeof window !== 'undefined'){
  window.__aiBridge = window.__aiBridge || {};
  window.__aiBridge.sfAgentState = sfAgentState;
  window.__aiBridge.sfAgentAct = sfAgentAct;
}
