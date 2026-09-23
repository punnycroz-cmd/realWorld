/* =====================================================================
   PART 36 — SF AGENT ACTIONS (production-1 playtest bridge)

   External minds (the 8-agent visual playtest, dev tools) act through
   sfAgentAct(cid, action) — real sim calls (sfGoTo/sfFollowPath/
   sfEnterPOI), never direct motor writes. An agent order parks on
   v.sfAgent and sfNpcTick honors it until done/expired, then the
   schedule brain resumes. This is the character's brain, not player
   possession: the production UI exposes no control of the 8 mains.

   Verbs: move <poi> | talk <castId|name> <text> | work | rest | idle |
          request <kind> <note>   (request files through the REAL bus as
          spectator 'agent-<cid>' — screen → review → ledger)

   sfAgentState(cid) returns ONLY what a passerby could observe:
   location, clock, nearby cast, needs bars, recent public Wire lines,
   and the character's own public routine — no secrets, no private state.
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
    else { v.state = 'idle'; a.done = true; }   // unreachable — fail honest
    return;
  }
  if(a.verb === 'talk'){
    const t = sfPawnOf(a.to);
    if(!t){ a.done = true; return; }
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
  // work | rest | idle — presence states, renderer shows them in place
  v.sfPath = null; v.moving = false;
  v.state = a.verb === 'rest' ? 'rest' : (a.verb === 'work' ? 'work' : 'idle');
}

/* one action. Returns {ok, ...} — never throws at the caller. */
function sfAgentAct(cid, act){
  const v = sfPawnOf(cid);
  if(!v) return { ok: false, err: 'no character ' + cid };
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
    v.sfAgent = { verb: 'move', poi: label, cell, until: W.tod + holdH };
    return { ok: true, going: label };
  }
  if(verb === 'talk'){
    const t = sfPawnOf(act.to);
    if(!t) return { ok: false, err: 'unknown person: ' + act.to };
    if(t === v) return { ok: false, err: 'cannot talk to self' };
    v.sfAgent = { verb: 'talk', to: act.to, text: act.text || 'hey',
                  until: W.tod + Math.min(holdH, 0.5) };
    return { ok: true, talking: t.name };
  }
  if(verb === 'work' || verb === 'rest' || verb === 'idle'){
    v.sfAgent = { verb, until: W.tod + holdH };
    return { ok: true, state: verb };
  }
  if(verb === 'request'){
    /* the agent steps out of the fiction and files as a spectator —
       the real bus: screen → lane → bill → review. Public-good kinds
       only: no possess (mains are banned), no hire/buy/listing. */
    if(typeof gsSubmitRequest !== 'function')
      return { ok: false, err: 'request bus unavailable' };
    const kind = (act.kind === 'weather') ? 'weather' : 'street_event';
    const spec = { playerId: 'agent-' + cid, kind,
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

/* observable state only — the playtest briefing rule */
function sfAgentState(cid){
  const v = sfPawnOf(cid);
  if(!v) return null;
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
  const fmtT = t => (t == null) ? '--:--'
    : ('0' + Math.floor(t / 60) % 24).slice(-2) + ':' + ('0' + (t % 60)).slice(-2);
  const wire = (typeof GS_WIRE !== 'undefined' ? GS_WIRE : []).slice(-6)
    .map(e => '[' + fmtT(e.t) + '] ' + (e.who ? e.who + ': ' : '') + e.text);
  const b = v.body || {};
  return {
    you: { id: v._castId, name: v.name, role: v.role },
    time: 'day ' + W.day + ' ' + ('0' + (W.tod | 0)).slice(-2) + ':' +
          ('0' + Math.round((W.tod % 1) * 60)).slice(-2),
    place: here, state: v.state,
    needs: { satiety: +(b.satiety || 0).toFixed(2),
             hydration: +(b.hydration || 0).toFixed(2),
             fatigue: +(b.fatigue || 0).toFixed(2) },
    nearby: near, wire,
    order: v.sfAgent ? (v.sfAgent.verb + ' ' + (v.sfAgent.poi || v.sfAgent.to || '')) : null,
    routine: (v.sfSched || []).map(s => s.h0 + ':00-' + s.h1 + ':00 ' +
      (s.to && s.to.poi ? s.to.poi : (s.to && s.to.anchor) || 'around')),
  };
}

/* bridge surface for tools and the driver */
if(typeof window !== 'undefined'){
  window.__aiBridge = window.__aiBridge || {};
  window.__aiBridge.sfAgentState = sfAgentState;
  window.__aiBridge.sfAgentAct = sfAgentAct;
}
