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

/* schedule blocks: {h0,h1, to:spec, state, inside, stops:[specs]} */
const SF_CORE_ROUTINES = {
  C1: [ // Marisol: opens the café, afternoon rounds
    { h0: 0, h1: 5.5, to: { latlon: [37.7540, -122.4186] }, state: 'sleep', inside: true },
    { h0: 5.5, h1: 14, to: { poi: 'Haus Coffee' }, state: 'serve' },
    { h0: 14, h1: 18, state: 'walk',
      stops: [{ poi: 'Taqueria El Farolito' }, { anchor: 'g744' },
              { anchor: 'park_center' }, { poi: 'Bi-Rite Market' }] },
    { h0: 18, h1: 21.5, to: { poi: 'Haus Coffee' }, state: 'chat' },
    { h0: 21.5, h1: 24, to: { latlon: [37.7540, -122.4186] }, state: 'sleep', inside: true },
  ],
  C2: [ // Jules: morning run, café shift, evening sketching
    { h0: 0, h1: 6.5, to: { anchor: 'g744' }, state: 'sleep', inside: true },
    { h0: 6.5, h1: 8, state: 'run',
      stops: [{ anchor: 'park_north' }, { anchor: 'park_center' }] },
    { h0: 8, h1: 15, to: { poi: 'Haus Coffee' }, state: 'serve' },
    { h0: 15, h1: 19, state: 'sit',
      stops: [{ anchor: 'park_center' }, { anchor: 'g744' }] },
    { h0: 19, h1: 24, to: { anchor: 'g744' }, state: 'sleep', inside: true },
  ],
  C3: [ // Dani: café six days, nights she won't explain
    { h0: 0, h1: 8, to: { latlon: [37.7495, -122.4200] }, state: 'sleep', inside: true },
    { h0: 8, h1: 17, to: { poi: 'Haus Coffee' }, state: 'serve' },
    { h0: 17, h1: 21, state: 'walk',
      stops: [{ anchor: 'park_center' }, { anchor: 'g750' },
              { poi: 'Clarion Alley' }] },
    { h0: 21, h1: 24, to: { latlon: [37.7495, -122.4200] }, state: 'idle', inside: true },
  ],
  C4: [ // Priya: three 12s at SF General; café decompresses
    { h0: 0, h1: 6.5, to: { anchor: 'g750' }, state: 'sleep', inside: true },
    { h0: 6.5, h1: 19.5, state: 'work',
      stops: [{ poi: 'SF General' }, { poi: 'Haus Coffee' }] },
    { h0: 19.5, h1: 21, to: { poi: 'Haus Coffee' }, state: 'drink' },
    { h0: 21, h1: 24, to: { anchor: 'g750' }, state: 'sleep', inside: true },
  ],
  C5: [ // Marcus: courier loops; Thursday park jams
    { h0: 0, h1: 8, to: { anchor: 'g750' }, state: 'sleep', inside: true },
    { h0: 8, h1: 18, state: 'carry',
      stops: [{ poi: 'Bi-Rite Market' }, { poi: 'Dolores Park Cafe' },
              { poi: 'Tartine Bakery' }, { poi: '500 Club' },
              { poi: 'Dandelion Chocolate' }] },
    { h0: 18, h1: 21, to: { anchor: 'park_center' }, state: 'play' },
    { h0: 21, h1: 24, to: { anchor: 'g750' }, state: 'sleep', inside: true },
  ],
  C6: [ // Carmen: stoop cafecito, her palm in the park
    { h0: 0, h1: 7, to: { anchor: 'g744' }, state: 'sleep', inside: true },
    { h0: 7, h1: 10, to: { anchor: 'g744' }, state: 'sit' },
    { h0: 10, h1: 16.5, to: { anchor: 'park_center' }, state: 'sit' },
    { h0: 16.5, h1: 21, to: { anchor: 'g744' }, state: 'idle', inside: true },
    { h0: 21, h1: 24, to: { anchor: 'g744' }, state: 'sleep', inside: true },
  ],
  C7: [ // Victor: hardware counter 9-6; Tuesdays he fixes the buildings himself
    { h0: 0, h1: 8, to: { poi: 'Auerbach Hardware' }, state: 'sleep', inside: true },
    { h0: 8, h1: 18, state: 'work',
      stops: [{ poi: 'Auerbach Hardware' }, { anchor: 'g744' }, { anchor: 'g750' }] },
    { h0: 18, h1: 22, to: { poi: 'Auerbach Hardware' }, state: 'idle', inside: true },
    { h0: 22, h1: 24, to: { poi: 'Auerbach Hardware' }, state: 'sleep', inside: true },
  ],
  C8: [ // Tomás: supplier loop by day, El Farolito line by night, 3pm coffee
    { h0: 0, h1: 9, to: { latlon: [37.7570, -122.4165] }, state: 'sleep', inside: true },
    { h0: 9, h1: 14.5, state: 'walk',
      stops: [{ poi: 'Auerbach Hardware' }, { poi: 'Bi-Rite Market' },
              { poi: 'Valencia Farmers Market' }] },
    { h0: 14.5, h1: 16, to: { poi: 'Haus Coffee' }, state: 'drink' },
    { h0: 16, h1: 24, to: { poi: 'Taqueria El Farolito' }, state: 'work' },
  ],
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
    const sched = c.tier === 'core' ? SF_CORE_ROUTINES[c.id] : sfAmbientRoutine(c);
    const homeBlock = (sched || []).find(b => b.inside) || (sched || [])[0];
    const hc = sfHomeCell(homeBlock && homeBlock.to ? homeBlock.to
                         : (homeBlock && homeBlock.stops ? homeBlock.stops[0] : null));
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
    v.sfSched = sched || [];
    v.sfStopIdx = 0;
    v.sfStopT = 0;
    v.sfHome = hc;
    v.equippedTool = { kind: workFor(c.id) !== 'idle' ? workFor(c.id) : 'none',
                       name: '', icon: '', desc: '' };
    if(v.body){ v.body.satiety = 0.9; v.body.hydration = 0.9; v.body.fatigue = 0.1; }
    VILLAGERS.push(v);
  });
  // audience surrogate: Jules (the newcomer)
  const j = VILLAGERS.findIndex(v => v._castId === 'C2');
  controlledPawnIdx = j >= 0 ? j : 0;
  inspectedPawnIdx = controlledPawnIdx;
  VILLAGERS[controlledPawnIdx].isNPC = false;
  if(VILLAGERS[controlledPawnIdx])
    cam.x = VILLAGERS[controlledPawnIdx].x, cam.y = VILLAGERS[controlledPawnIdx].y;
}

/* ---- thin-AI schedule follower ---- */
function sfNpcTick(v, dtH){
  if(v.state === 'sleep' && v.inBuilding){ v.moving = false; }
  // keep the Truman cast alive: offscreen meals & rest are assumed
  if(v.body){
    if(v.body.satiety < 0.35) v.body.satiety = 0.6;
    if(v.body.hydration < 0.35) v.body.hydration = 0.6;
    if(v.body.fatigue > 0.85 && !v.inBuilding) v.body.fatigue = 0.6;
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
      if(v._sfRepathT == null || (G.frame - v._sfRepathT) > 90){
        v._sfRepathT = G.frame;
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
