/* =====================================================================
   PART SF-4: THE CAST — 28 Mission residents, homes, routines.
   Core 8 per cast-bible-2026-09-22.md (LOOKS live in NV_CAST in
   pa-chars.js). 20 ambients get role-driven thin schedules.
   ===================================================================== */

/* latlon -> map cell helper for off-OSM fictional homes */
function sfLatLonCell(lat, lon){
  const mLon = 111320 * Math.cos(Math.PI * SF_M.lat0 / 180);
  const mx = (lon - SF_M.lon0) * mLon - SF_M.minx;
  const my = -(lat - SF_M.lat0) * 111320 - SF_M.miny;
  return { wx: Math.round(mx / SF_M.cell_m), wy: Math.round(my / SF_M.cell_m) };
}
/* nearest building's door cell to a given cell */
function sfNearestBldDoor(wx, wy, maxR){
  let best = null, bd = 1e9;
  for(const [bi, d] of SF_DOOR_OF){
    const b = SF_BLD[bi];
    const bx = Math.round(b.x / CS), by = Math.round(b.y / CS);
    const dd = Math.hypot(bx - wx, by - wy);
    if(dd < (maxR || 40) && dd < bd){ bd = dd; best = d; }
  }
  return best;
}
function sfHomeCell(spec){
  if(spec.anchor){
    const c = sfAnchorCell(spec.anchor);
    if(c){
      // if anchor resolved to a building centroid, prefer its door
      const al = SF_MAP.anchors[spec.anchor];
      if(al && al.bld >= 0 && SF_DOOR_OF.has(al.bld)) return SF_DOOR_OF.get(al.bld);
      return c;
    }
  }
  if(spec.latlon){
    const c = sfLatLonCell(spec.latlon[0], spec.latlon[1]);
    return sfNearestBldDoor(c.wx, c.wy, 80) || c;
  }
  if(spec.poi){
    const p = sfFindPOI(spec.poi);
    if(p) return sfPoiDoor(p);
  }
  return { wx: 300, wy: 200 }; // Dolores Park fallback
}

/* v16 — the becoming brain: the 8 mains are driven pawns from spawn.
   There is NO code-authored routine for them — SF_CORE_ROUTINES is gone.
   The bibles' "Daily routine" prose lives in each brain's BRIEF as life
   context (circumstances, never a schedule the engine runs). What the
   engine keeps is only the home cell: where the body sleeps is a fact of
   the world, not an intention. */
const SF_CORE_HOMES = {
  C1: { latlon: [37.7540, -122.4186] },   // Mars — 9127 Capp St studio
  C2: { anchor: 'g744' },                 // Jules — 9418 Guerrero, Unit A
  C3: { latlon: [37.7495, -122.4200] },   // Dani — 9263 Geneva Ave
  C4: { anchor: 'g750' },                 // Priya — 9457 Guerrero, Unit 3
  C5: { anchor: 'g750' },                 // Marcus — same flat as Priya
  C6: { anchor: 'g744' },                 // Carmen — 9418 Guerrero, Unit A
  C7: { poi: 'Auerbach Hardware' },       // Victor — 9102 Mission, over the store
  C8: { latlon: [37.7570, -122.4165] },   // Tomás — 9344 Folsom studio
};

/* ambient role -> routine template */
function sfAmbientHome(id){
  return { poi: null, latlon: [37.7560 + (hashString18(id) % 40) / 2000,
                               -122.4240 + (hashString18(id + 'x') % 60) / 3000] };
}
/* per-ambient routines — world/ambients.json + world/ambients/ are the
   readable spec; canonical venue names resolve via SF_WORLD_POIS
   (30_sf_world.js). Falls back to the role template when absent. */
const SF_AMBIENT_ROUTINES = {
  A01: c => { const home = sfAmbientHome(c.id); return [ // Reyes: Mudhaus espresso shifts
    { h0: 0, h1: 7.5, to: home, state: 'sleep', inside: true },
    { h0: 7.5, h1: 18, to: { poi: 'Mudhaus Coffee' }, state: 'serve' },
    { h0: 18, h1: 22, to: home, state: 'idle', inside: true },
    { h0: 22, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A03: c => { const home = sfAmbientHome(c.id); return [ // Malik: counter at his own corner store
    { h0: 0, h1: 7.5, to: home, state: 'sleep', inside: true },
    { h0: 7.5, h1: 18, to: { poi: "Malik's Mini Mart" }, state: 'serve' },
    { h0: 18, h1: 22, to: home, state: 'idle', inside: true },
    { h0: 22, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A05: c => { const home = sfAmbientHome(c.id); return [ // Esther: stoop, park, Dolores Perk
    { h0: 0, h1: 8, to: home, state: 'sleep', inside: true },
    { h0: 8, h1: 12, state: 'sit', stops: [{ anchor: 'park_center' }, { poi: 'Dolores Perk' }] },
    { h0: 12, h1: 18, to: { anchor: 'park_south' }, state: 'sit' },
    { h0: 18, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A06: c => { const home = sfAmbientHome(c.id); return [ // Kofe: MuleIt hot-box loop
    { h0: 0, h1: 8, to: home, state: 'sleep', inside: true },
    { h0: 8, h1: 19, state: 'carry',
      stops: [{ poi: 'Taqueria El Farolote' }, { poi: 'Il Delfino' },
              { poi: 'Buy-Rite Creamery' }, { poi: 'Dolores Perk' },
              { poi: 'Mudhaus Coffee' }, { anchor: 'g750' }] },
    { h0: 19, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A07: c => { const home = sfAmbientHome(c.id); return [ // Luz: fruit stand, Dolores at 19th
    { h0: 0, h1: 7, to: home, state: 'sleep', inside: true },
    { h0: 7, h1: 18, to: { poi: 'Frutería Las Palmas' }, state: 'serve' },
    { h0: 18, h1: 21, to: home, state: 'idle', inside: true },
    { h0: 21, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A08: c => { const home = sfAmbientHome(c.id); return [ // Sam: corner sets, 600 Club nights
    { h0: 0, h1: 10, to: home, state: 'sleep', inside: true },
    { h0: 10, h1: 18, state: 'work', stops: [{ anchor: 'park_north' }, { anchor: 'park_south' }] },
    { h0: 18, h1: 24, state: 'chat', stops: [{ poi: 'The 600 Club' }, { anchor: 'park_south' }] } ]; },
  A09: c => { const home = sfAmbientHome(c.id); return [ // Asha: SF General shifts
    { h0: 0, h1: 8, to: home, state: 'sleep', inside: true },
    { h0: 8, h1: 19.5, to: { poi: 'SF General' }, state: 'work' },
    { h0: 19.5, h1: 21, state: 'walk', stops: [{ poi: 'Mudhaus Coffee' }] },
    { h0: 21, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A10: c => { const home = sfAmbientHome(c.id); return [ // Gus: Folsom Auto & Sons
    { h0: 0, h1: 6.5, to: home, state: 'sleep', inside: true },
    { h0: 6.5, h1: 16, to: { poi: 'Folsom Auto & Sons' }, state: 'work' },
    { h0: 16, h1: 22, to: home, state: 'rest', inside: true },
    { h0: 22, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A11: c => { const home = sfAmbientHome(c.id); return [ // Vera: Mission Branch Library
    { h0: 0, h1: 7.5, to: home, state: 'sleep', inside: true },
    { h0: 7.5, h1: 17.5, to: { poi: 'Mission Branch Library' }, state: 'work' },
    { h0: 17.5, h1: 20, state: 'sit', stops: [{ anchor: 'park_center' }, { poi: 'Dolores Perk' }] },
    { h0: 20, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A12: c => { const home = sfAmbientHome(c.id); return [ // Tom: park laps bookending an office day
    { h0: 0, h1: 6, to: home, state: 'sleep', inside: true },
    { h0: 6, h1: 8, state: 'run', stops: [{ anchor: 'park_north' }, { anchor: 'park_south' }] },
    { h0: 8, h1: 17, to: home, state: 'rest', inside: true },
    { h0: 17, h1: 19, state: 'run', stops: [{ anchor: 'park_south' }, { anchor: 'park_center' }] },
    { h0: 19, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A14: c => { const home = sfAmbientHome(c.id); return [ // Bex: Needlepointe + Clarion wanders
    { h0: 0, h1: 10, to: home, state: 'sleep', inside: true },
    { h0: 10, h1: 18, state: 'work', stops: [{ poi: 'Needlepointe Tattoo' }, { poi: 'Clarion Alley' }] },
    { h0: 18, h1: 24, state: 'chat', stops: [{ poi: 'The 600 Club' }, { anchor: 'park_south' }] } ]; },
  A15: c => { const home = sfAmbientHome(c.id); return [ // Omar: Flying Pannier paper runs
    { h0: 0, h1: 8, to: home, state: 'sleep', inside: true },
    { h0: 8, h1: 19, state: 'carry',
      stops: [{ poi: 'Auerbach Hardware' }, { poi: 'Mission Branch Library' },
              { poi: 'Dolores Perk' }, { poi: 'Mudhaus Coffee' }, { anchor: 'g744' }] },
    { h0: 19, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A16: c => { const home = sfAmbientHome(c.id); return [ // Hana: the 4am bake at Baguette About It
    { h0: 0, h1: 4, to: home, state: 'sleep', inside: true },
    { h0: 4, h1: 13, to: { poi: 'Baguette About It Bakery' }, state: 'serve' },
    { h0: 13, h1: 17, state: 'walk', stops: [{ anchor: 'park_center' }, { poi: 'Buy-Rite Market' }] },
    { h0: 17, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A17: c => { const home = sfAmbientHome(c.id); return [ // Cole: site work by Auerbach Hardware
    { h0: 0, h1: 6.5, to: home, state: 'sleep', inside: true },
    { h0: 6.5, h1: 16, to: { poi: 'Auerbach Hardware' }, state: 'work' },
    { h0: 16, h1: 22, to: home, state: 'rest', inside: true },
    { h0: 22, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A18: c => { const home = sfAmbientHome(c.id); return [ // Ida: Bloom & Doom counter
    { h0: 0, h1: 7.5, to: home, state: 'sleep', inside: true },
    { h0: 7.5, h1: 18, to: { poi: 'Bloom & Doom Flowers' }, state: 'serve' },
    { h0: 18, h1: 22, to: home, state: 'idle', inside: true },
    { h0: 22, h1: 24, to: home, state: 'sleep', inside: true } ]; },
  A19: c => { const home = sfAmbientHome(c.id); return [ // Ray: bench + pigeon rounds
    { h0: 0, h1: 8, to: home, state: 'sleep', inside: true },
    { h0: 8, h1: 12, state: 'sit', stops: [{ anchor: 'park_center' }, { poi: 'Dolores Perk' }] },
    { h0: 12, h1: 18, state: 'sit', stops: [{ anchor: 'park_south' }, { anchor: 'park_center' }] },
    { h0: 18, h1: 24, to: home, state: 'sleep', inside: true } ]; },
};
function sfAmbientRoutine(c){
  if(SF_AMBIENT_ROUTINES[c.id]) return SF_AMBIENT_ROUTINES[c.id](c);
  const role = (c.role || '').toLowerCase();
  const home = sfAmbientHome(c.id);
  const B = [];
  const at = (h0, h1, spec, st, inside) => B.push({ h0, h1, to: spec, state: st, inside });
  if(/barista|baker|shop|keeper|florist|grocer/.test(role)){
    const work = /barista/.test(role) ? { poi: 'Haus Coffee' }
               : /baker/.test(role) ? { poi: 'Tartine Bakery' }
               : { poi: 'Bi-Rite Market' };
    at(0, 7.5, home, 'sleep', true);
    at(7.5, 18, work, 'serve');
    at(18, 22, home, 'idle', true);
    at(22, 24, home, 'sleep', true);
  } else if(/dog|walker/.test(role)){
    at(0, 7, home, 'sleep', true);
    B.push({ h0: 7, h1: 11, state: 'walk', stops: [{ anchor: 'park_north' }, { anchor: 'park_center' }, { anchor: 'park_south' }] });
    B.push({ h0: 11, h1: 16, to: home, state: 'rest', inside: true });
    B.push({ h0: 16, h1: 20, state: 'walk', stops: [{ anchor: 'park_south' }, { anchor: 'park_center' }] });
    at(20, 24, home, 'sleep', true);
  } else if(/student|teen/.test(role)){
    at(0, 7.5, home, 'sleep', true);
    at(7.5, 15, { poi: 'Mission High School' }, 'work');
    B.push({ h0: 15, h1: 19, state: 'phone', stops: [{ anchor: 'park_center' }, { poi: 'Haus Coffee' }] });
    at(19, 24, home, 'sleep', true);
  } else if(/retir|longshore/.test(role)){
    at(0, 8, home, 'sleep', true);
    B.push({ h0: 8, h1: 12, state: 'sit', stops: [{ anchor: 'park_center' }, { poi: 'Dolores Park Cafe' }] });
    B.push({ h0: 12, h1: 18, state: 'sit', stops: [{ anchor: 'park_south' }, { anchor: 'park_center' }] });
    at(18, 24, home, 'sleep', true);
  } else if(/courier|delivery|rider/.test(role)){
    at(0, 8, home, 'sleep', true);
    B.push({ h0: 8, h1: 19, state: 'carry',
      stops: [{ poi: 'Taqueria El Farolito' }, { poi: 'Delfina' },
              { poi: 'Bi-Rite Creamery' }, { poi: 'Dolores Park Cafe' },
              { poi: 'Haus Coffee' }, { anchor: 'g750' }] });
    at(19, 24, home, 'sleep', true);
  } else if(/tech|laptop|doom/.test(role)){
    at(0, 9, home, 'sleep', true);
    at(9, 17, { poi: 'Haus Coffee' }, 'phone');
    at(17, 22, home, 'phone', true);
    at(22, 24, home, 'sleep', true);
  } else if(/artist|tattoo|musician|dj|drag/.test(role)){
    at(0, 10, home, 'sleep', true);
    B.push({ h0: 10, h1: 18, state: 'work', stops: [{ poi: 'Clarion Alley' }, { poi: 'Haus Coffee' }] });
    B.push({ h0: 18, h1: 24, state: 'chat', stops: [{ poi: '500 Club' }, { anchor: 'park_south' }] });
  } else if(/worker|scaffold|construction/.test(role)){
    at(0, 6.5, home, 'sleep', true);
    at(6.5, 16, { poi: 'Auerbach Hardware' }, 'work');
    at(16, 22, home, 'rest', true);
    at(22, 24, home, 'sleep', true);
  } else {
    at(0, 8, home, 'sleep', true);
    B.push({ h0: 8, h1: 12, state: 'walk', stops: [{ poi: 'Haus Coffee' }, { anchor: 'park_center' }] });
    at(12, 18, home, 'rest', true);
    B.push({ h0: 18, h1: 22, state: 'walk', stops: [{ anchor: 'park_south' }, { poi: '500 Club' }] });
    at(22, 24, home, 'sleep', true);
  }
  return B;
}

function sfInitCast(){
  VILLAGERS.length = 0;
  const cast = buildCastChars();           // id -> frameset
  PA.chars = NV_CAST.map(c => cast[c.id]); // index-aligned with NV_CAST
  NV_CAST.forEach((c, i) => {
    const isMain = c.tier === 'core';
    const sched = isMain ? null : sfAmbientRoutine(c);
    /* home cell: mains keep only WHERE they sleep (a world fact, from
       the bible's Home line); ambients derive it from block.inside as
       before. No schedule is ever built or stored for a main. */
    const homeSpec = isMain
      ? SF_CORE_HOMES[c.id]
      : (function(){ const b = (sched || []).find(b => b.inside) || (sched || [])[0];
          return b && (b.to || (b.stops && b.stops[0])); })();
    const hc = sfHomeCell(homeSpec || null);
    const v = createVillager(c.name || c.id, c.role || 'Resident', null,
                             hc.wx, hc.wy, {
      sex: /C2/.test(c.id) ? 'nb' : (['C1','C3','C4','C6'].includes(c.id) ? 'f' : 'm'),
      ageY: { C1: 29, C2: 26, C3: 24, C4: 31, C5: 34, C6: 74, C7: 58, C8: 36 }[c.id] || 30,
      isNPC: true, canSwim: true,
    });
    v._ci = i;
    v._castId = c.id;
    // production-1: compiled memory profile (35_sf_memory.js) — wired into
    // decayEpistemic/observe where the sim has a real mechanism
    if(typeof sfMemProfileFor === 'function') v.memProfile = sfMemProfileFor(c.id);
    if(isMain){
      /* v16 becoming brain: a main is AI-driven from birth. It owns every
         intention; the engine owns the body. It wakes into the
         intention_gap and waits for its brain's first filing — there is
         no sfSched to fall back to, ever, and no possession carve-out. */
      v.sfAgentDriven = true;
      v.sfGap = true;
      v.sfMind = null;             // populated by sfMindScan on first state read
      v.sfConvo = null;
      v.sfLastConvo = null;
      v.sfIntents = [];
      v.sfDisp = null;             // dispatch ledger (38_sf_brain.js)
    } else {
      v.sfSched = sched || [];
      v.sfStopIdx = 0;
      v.sfStopT = 0;
    }
    v.sfHome = hc;
    v.equippedTool = { kind: workFor(c.id) !== 'idle' ? workFor(c.id) : 'none',
                       name: '', icon: '', desc: '' };
    if(v.body){ v.body.satiety = 0.9; v.body.hydration = 0.9; v.body.fatigue = 0.1; }
    VILLAGERS.push(v);
  });
  /* possession ban on mains is absolute (v16): no audience surrogate, no
     controlled pawn. The camera inspects Jules's patch at boot purely so
     the opening frame lands on a familiar corner — it does NOT control
     the pawn and the pawn stays isNPC/sfAgentDriven. */
  const j = VILLAGERS.findIndex(v => v._castId === 'C2');
  inspectedPawnIdx = j >= 0 ? j : 0;
  controlledPawnIdx = -1;
  if(VILLAGERS[inspectedPawnIdx])
    cam.x = VILLAGERS[inspectedPawnIdx].x, cam.y = VILLAGERS[inspectedPawnIdx].y;
}

/* ---- driven ladder (mains) + thin-AI schedule follower (ambients) ---- */
function sfNpcTick(v, dtH){
  if(v.state === 'sleep' && v.inBuilding){ v.moving = false; }
  /* v16: silent needs top-ups are gone for DRIVEN pawns — a main's body
     decays honestly and its brain decides what to do about it; the only
     code override is the bounded collapse reflex below. Ambients keep
     the Truman assumption (offscreen meals & rest) — they are furniture,
     and starving furniture would be a broken set, not a broken fiction. */
  if(v.body && !v.sfAgentDriven){
    if(v.body.satiety < 0.35) v.body.satiety = 0.6;
    if(v.body.hydration < 0.35) v.body.hydration = 0.6;
    if(v.body.fatigue > 0.85 && !v.inBuilding) v.body.fatigue = 0.6;
  }
  // v16 ladder (design §5): a driven main NEVER reaches sfSched.
  //   collapse reflex → live order → brain-authored directive → gap.
  // The gap is a first-class visible state: the pawn stands, its
  // sfGap flag is true, and sfAgentState reports it to the brain.
  if(v.sfAgentDriven || v.sfAgent){
    /* genuine survival reflex: a collapse is a body event, not an
       intention. It interrupts the order, is written as 'interrupted'
       with the reflex named, and leaves the pawn downed until the
       body recovers or a brain filing takes over. */
    const rf = (typeof sfReflexNow === 'function') ? sfReflexNow(v) : null;
    if(rf){
      if(v.sfAgent && !v.sfAgent.done)
        v.sfAgentResult = { verb: v.sfAgent.verb, status: 'interrupted',
          interruptedBy: 'survival:' + rf, at: W.tod, day: W.day };
      v.sfAgent = null;
      if(!v.sfReflex || v.sfReflex.kind !== rf)
        v.sfReflex = { kind: rf, at: W.tod, day: W.day };
      /* bounded, honest: the body drifts back to the band EDGE (never
         topped up) — "someone got them upright"; the next move is the
         brain's */
      if(typeof sfReflexDrift === 'function') sfReflexDrift(v, dtH);
      v.sfPath = null; v.moving = false; v.state = 'downed';
      return;
    }
    v.sfReflex = null;
    if(v.sfAgent){
      const a = v.sfAgent;
      if(a.done || sfAbsNow() > a.until){
        /* every order ends with a reported outcome the brain reads next
           turn: completed | expired | failed (interrupted is written
           where the interruption happens) — §5.4 outcome contract */
        v.sfAgentResult = { verb: a.verb,
          status: a.fail ? 'failed'
                : a.interrupted ? 'interrupted'
                : (a.done ? 'completed' : 'expired'),
          err: a.fail || (a.waitingOutside ? 'waiting_outside' : null),
          interruptedBy: a.interrupted || null,
          seq: a.seq != null ? a.seq : null,
          at: W.tod, day: W.day };
        /* a promoted directive starts the same tick — no gap frame */
        v.sfAgent = (typeof sfAgentNext === 'function')
          ? sfAgentNext(v) : null;
        if(v.sfAgent && typeof sfAgentTick === 'function'){
          v.sfGap = false;
          sfAgentTick(v, v.sfAgent, dtH);
          return;
        }
      }
      else if(typeof sfAgentTick === 'function'){ sfAgentTick(v, a, dtH); return; }
      else v.sfAgent = null;
    }
    /* no live order: the standing will gets one shot (it may have
       lapsed mid-order or after a collapse). Else the intention gap
       stands — empty, visible, honest. */
    const nxt = (typeof sfAgentNext === 'function') ? sfAgentNext(v) : null;
    if(nxt){
      v.sfAgent = nxt; v.sfGap = false;
      if(typeof sfAgentTick === 'function') sfAgentTick(v, nxt, dtH);
      return;
    }
    v.sfGap = true;
    v.sfPath = null; v.moving = false; v.state = 'idle';
    return;
  }
  const sched = v.sfSched;
  if(!sched || !sched.length){ v.state = v.moving ? v.state : 'idle'; return; }
  const h = W.tod;
  const blk = sched.find(b => h >= b.h0 && h < b.h1) || sched[sched.length - 1];

  // resolve current target: fixed 'to' or roaming stops (rotate ~45min)
  let spec = blk.to;
  if(blk.stops && blk.stops.length){
    v.sfStopT += dtH;
    if(v.sfStopT > 0.75){ v.sfStopT = 0; v.sfStopIdx = (v.sfStopIdx + 1) % blk.stops.length; }
    spec = blk.stops[v.sfStopIdx % blk.stops.length];
  }
  const cell = sfHomeCell(spec || {});
  const dist = Math.hypot(v.x - (cell.wx * CS + 16), v.y - (cell.wy * CS + 16));

  if(v.inside && (!blk.inside || v.inside !== specInside(spec))){
    sfExitPOI(v); // leave before walking
  }
  if(dist > CS * 1.2){
    v.inBuilding = false;
    if(!v.sfPath || !v.sfPath.length){
      // repath cooldown keys on the sim clock, not G.frame — headless
      // drivers call simTick() without loop(), so a frame-keyed cooldown
      // would freeze the pawn forever after one failed sfGoTo.
      const simNow = W.day * 24 + W.tod;
      if(v._sfRepathT == null || (simNow - v._sfRepathT) > 0.05){
        v._sfRepathT = simNow;
        sfGoTo(v, cell.wx, cell.wy);
      }
      if(!v.sfPath){ v.state = 'idle'; v.moving = false; return; }
    }
    sfFollowPath(v, dtH);
  } else {
    v.sfPath = null;
    v.moving = false;
    v.state = blk.state || 'idle';
    if(blk.inside && spec && spec.poi){
      const p = sfFindPOI(spec.poi);
      if(p) sfEnterPOI(v, p.name);
    } else if(blk.inside && spec && spec.anchor){
      v.inBuilding = true; v.inside = spec.anchor;
    }
  }
}
function specInside(spec){ return spec && spec.poi ? spec.poi : (spec && spec.anchor); }
