/* =====================================================================
   PART SF-1: SAN FRANCISCO "MISSION" SCENARIO — WORLD CORE
   Additive scenario: active only with ?sf=1 (or ?scenario=sf). The medieval
   Willowbrook village is untouched when SF_MODE is false.

   World model: the real Mission District around Dolores Park, from OSM
   (scripts/convert_sf_osm.py -> data/sf_map.js). Grid cell = 2m = 32px.
   Tile codes: 0 open 10 street 11 sidewalk 12 building 13 park
               14 poi 15 park path 16 crosswalk
   ===================================================================== */
const SF_MODE = (typeof location !== 'undefined' && location &&
    /[?&](sf|scenario=sf)\b/.test(location.search || '')) ||
    (typeof window !== 'undefined' && !!window.SF_FORCE);

const SF_M = (typeof SF_MAP !== 'undefined') ? SF_MAP.meta : null;
const SF_PXM = CS / (SF_M ? SF_M.cell_m : 2);   // px per meter (16)

/* ---- decoded grid + derived registries (lazy, built once) ---- */
let SF_GRID = null;          // Uint8Array gw*gh
const SF_DOORS = new Set();  // "wx,wy" cell keys that are legal door thresholds
const SF_DOOR_OF = new Map();// bldIdx -> {wx,wy}
const SF_DECO = new Map();   // "wx,wy" -> deco bits (1 laneV, 2 laneH, 4 gutterN 8 gutterS 16 gutterW 32 gutterE)
const SF_POIS = [];          // {name, kind, wx, wy, x, y, bld}
const SF_POI_BY_NAME = new Map();
const SF_INTERIORS = {};     // name -> {label, door:{wx,wy}}
const SF_BLD = [];           // buildings in world coords {poly(px rel), hPx, x,y,bx0..}
const SF_BLD_GRID = new Map();// "cx,cy" chunk -> [bldIdx]

function sfDecodeGrid(){
  if(SF_GRID) return SF_GRID;
  const gw = SF_M.gw, gh = SF_M.gh;
  SF_GRID = new Uint8Array(gw * gh);
  for(let y = 0; y < gh; y++){
    const row = SF_MAP.tilesR[y];
    let x = 0;
    for(const tok of row.split(',')){
      const xi = tok.indexOf('x');
      if(xi < 0){ SF_GRID[y * gw + x++] = +tok; }
      else {
        const v = +tok.slice(0, xi), n = +tok.slice(xi + 1);
        SF_GRID.fill(v, y * gw + x, y * gw + x + n);
        x += n;
      }
    }
  }
  return SF_GRID;
}

/* tile at world cell coords (map cells ARE world cells; origin = 0,0) */
function sfTile(wx, wy){
  if(!SF_GRID || wx < 0 || wy < 0 || wx >= SF_M.gw || wy >= SF_M.gh) return -1;
  return SF_GRID[wy * SF_M.gw + wx];
}
function sfWalkableCell(wx, wy){
  const t = sfTile(wx, wy);
  if(t < 0) return false;
  if(t === 12) return SF_DOORS.has(wx + ',' + wy);
  return true;
}
/* movement cost: sidewalks/park paths cheapest, open ground ok, street last */
function sfCellCost(wx, wy){
  const t = sfTile(wx, wy);
  if(t === 11 || t === 15 || t === 14) return 1.0;
  if(t === 16) return 1.1;
  if(t === 13) return 1.15;
  if(t === 10) return 1.55;
  return 1.7;
}

/* ---- chunk generation from the real map ---- */
function sfGenChunk(cx, cy){
  const N = CHN, n = N * N;
  const ch = {
    cx, cy,
    h: new Float32Array(n), moist: new Float32Array(n), fert: new Float32Array(n),
    grass: new Float32Array(n), tStage: new Float32Array(n),
    treeType: new Uint8Array(n), snag: new Float32Array(n),
    bush: new Float32Array(n), temp: new Float32Array(n), hum: new Float32Array(n),
    cloud: new Float32Array(n), rain: new Float32Array(n), storm: new Float32Array(n),
    burn: new Float32Array(n), tileType: new Uint8Array(n),
    bushCells: [], shoreCells: [], dirty: false,
  };
  for(let iy = 0; iy < N; iy++) for(let ix = 0; ix < N; ix++){
    const wx = cx * N + ix, wy = cy * N + iy, i = iy * N + ix;
    ch.h[i] = SEA + 0.15;               // dry urban ground everywhere
    ch.moist[i] = 0.35; ch.fert[i] = 0.3;
    ch.temp[i] = 18.0; ch.hum[i] = 0.6;
    ch.grass[i] = 0.3 + hash2(wx, wy, SEED + 5) * 0.5;
    const t = sfTile(wx, wy);
    ch.tileType[i] = (t < 0) ? 0 : t;
  }
  chunks.set(cx + ',' + cy, ch);
  return ch;
}

/* ---- collision: buildings block, door thresholds pass ---- */
const SF_PROP_CELL = new Map(); // "wx,wy" -> [objs] spatial index (v5)
const SF_WIRES = []; // v20: [{x1,y1,x2,y2}] pole-top wire spans (world px)
/* v44: street classification — real curb-to-curb width per road cell.
   SF_ROADW = perpendicular run length (cells), SF_ROADAX = travel axis
   (0 = E-W, 1 = N-S), SF_ROADOFF = signed cell offset from the axis
   centerline. Drives the red transit carpet, centerlines, the Dolores
   palm median, stop bars and manholes in both ground passes. */
let SF_ROADW = null, SF_ROADAX = null, SF_ROADOFF = null;
const SF_PROP_DRAW = new Map(); // v11: "cx,cy" chunk -> [objs] render index
const SF_PROP_RAD = { sfLamp: 8, sfBench: 12, sfTree: 9, sfPalm: 9,
                      sfStreetTree: 8, sfCypress: 7, sfPlanter: 5,
                      sfCar: 15, sfPole: 5,
                      // v53: small enough that a pawn detours around, not
                      // into — and sfPicnic is intentionally absent (a
                      // blanket is ground, you can cross it)
                      sfHydrant: 5, sfTrashCan: 5, sfNewsBox: 7,
                      sfBikeRack: 8, sfAgave: 4, sfEchium: 4 };
const SF_PICNIC = []; // v53: Dolores lawn blanket sites (render-gated)
/* v17 ground decals: world-cell rects baked into the terrain atlas —
   Dolores Park courts/playground/worn grass + per-curb paint. */
const SF_DECALS = [];
const SF_GROUND_OVR = new Map(); // "wx,wy" -> street-view fill color
/* v40: perimeter palm allée — a park-edge grass cell carries a palm
   every ~7 cells (~14m) along the edge axis, phase-offset per row, the
   way Dolores Park's palms actually ring the lawn. Pure + deterministic.
   v54: spacing tightened to every ~4 cells (~8m) — at diorama zoom the
   old cadence scattered into isolated blobs; a real allée reads as a
   ROW, and the row is what tells the eye "city park, not field". */
function sfPalmRow(wx, wy){
  const horiz = sfTile(wx, wy - 1) === 11 || sfTile(wx, wy + 1) === 11;
  const u = horiz ? wx : wy, per = horiz ? wy : wx;
  const off = Math.floor(phash(per, 13, horiz ? 1674 : 1675) * 4);
  return ((u + off) % 4) === 0;
}
function sfPropIndex(o){
  const k = o.wx + ',' + o.wy;
  if(!SF_PROP_CELL.has(k)) SF_PROP_CELL.set(k, []);
  SF_PROP_CELL.get(k).push(o);
  const ck = Math.floor(o.wx / CHN) + ',' + Math.floor(o.wy / CHN);
  if(!SF_PROP_DRAW.has(ck)) SF_PROP_DRAW.set(ck, []);
  SF_PROP_DRAW.get(ck).push(o);
}
function sfCanMoveTo(x, y, v){
  const r = 8;
  if(v && v.inBuilding) return { ok: true, depth: 0, isWater: false, isDeep: false };
  // check center + 4 edge points against building cells
  for(const [px, py] of [[x, y], [x + r, y], [x - r, y], [x, y + r], [x, y - r]]){
    const wx = Math.floor(px / CS), wy = Math.floor(py / CS);
    const t = sfTile(wx, wy);
    if(t === 12 && !SF_DOORS.has(wx + ',' + wy))
      return { ok: false, reason: 'building_wall' };
    if(t < 0)
      return { ok: false, reason: 'city_edge' };
  }
  // street furniture — spatial index, 3x3 cell neighborhood covers all radii
  const cx = Math.floor(x / CS), cy = Math.floor(y / CS);
  for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
    const lst = SF_PROP_CELL.get((cx + dx) + ',' + (cy + dy));
    if(!lst) continue;
    for(const obj of lst){
      const rad = SF_PROP_RAD[obj.kind];
      if(rad && Math.hypot(x - obj.x, y - obj.y) < rad)
        return { ok: false, reason: obj.kind.slice(2).toLowerCase() };
    }
  }
  return { ok: true, depth: 0, isWater: false, isDeep: false };
}

/* ---- A* over the tile grid, sidewalk-preferring ---- */
function sfPathfind(sx, sy, tx, ty, raw){
  sfDecodeGrid();
  const gw = SF_M.gw, gh = SF_M.gh;
  if(!sfWalkableCell(tx, ty)){
    // snap target to nearest walkable ring
    let found = null;
    for(let rr = 1; rr <= 8 && !found; rr++)
      for(let dy = -rr; dy <= rr && !found; dy++)
        for(let dx = -rr; dx <= rr && !found; dx++)
          if(sfWalkableCell(tx + dx, ty + dy)) { tx += dx; ty += dy; found = true; }
    if(!found) return null;
  }
  if(!sfWalkableCell(sx, sy)) return null;
  const start = sy * gw + sx, goal = ty * gw + tx;
  const gScore = new Float32Array(gw * gh).fill(Infinity);
  const from = new Int32Array(gw * gh).fill(-1);
  const open = new MinHeap();
  const closed = new Uint8Array(gw * gh);
  gScore[start] = 0;
  open.push(start, Math.abs(tx - sx) + Math.abs(ty - sy));
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  let iter = 0;
  while(open.size){
    const cur = open.pop();
    if(cur === goal) break;
    if(closed[cur]) continue;
    closed[cur] = 1;
    if(++iter > 3000000) break;
    const cx = cur % gw, cy = (cur / gw) | 0;
    for(const [dx, dy] of DIRS){
      const nx = cx + dx, ny = cy + dy;
      if(nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
      if(!sfWalkableCell(nx, ny)) continue;
      if(dx && dy && (!sfWalkableCell(cx + dx, cy) || !sfWalkableCell(cx, cy + dy)))
        continue; // no corner cutting
      const ni = ny * gw + nx;
      const ng = gScore[cur] + sfCellCost(nx, ny) * Math.hypot(dx, dy);
      if(ng < gScore[ni]){
        gScore[ni] = ng; from[ni] = cur;
        open.push(ni, ng + Math.hypot(tx - nx, ty - ny));
      }
    }
  }
  if(from[goal] === -1 && goal !== start) return null;
  const path = [];
  for(let c = goal; c !== -1; c = from[c]) path.push([c % gw, (c / gw) | 0]);
  path.reverse();
  return raw ? path : sfSmoothPath(path);
}
function MinHeap(){
  const k = [], pr = [];
  return {
    get size(){ return k.length; },
    push(key, p){
      k.push(key); pr.push(p);
      let i = k.length - 1;
      while(i > 0){
        const par = (i - 1) >> 1;
        if(pr[par] <= pr[i]) break;
        [k[par], k[i]] = [k[i], k[par]]; [pr[par], pr[i]] = [pr[i], pr[par]];
        i = par;
      }
    },
    pop(){
      const top = k[0], lk = k.pop(), lp = pr.pop();
      if(k.length){
        k[0] = lk; pr[0] = lp;
        let i = 0;
        for(;;){
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if(l < k.length && pr[l] < pr[m]) m = l;
          if(r < k.length && pr[r] < pr[m]) m = r;
          if(m === i) break;
          [k[m], k[i]] = [k[i], k[m]]; [pr[m], pr[i]] = [pr[i], pr[m]];
          i = m;
        }
      }
      return top;
    },
  };
}
/* supercover line-of-sight walkability + waypoint smoothing */
function sfLineWalkable(x0, y0, x1, y1){
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  let x = x0, y = y0;
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, n = 0;
  while(n++ < 4000){
    if(!sfWalkableCell(x, y)) return false;
    if(x === x1 && y === y1) return true;
    const e2 = 2 * err;
    if(e2 > -dy){
      err -= dy; x += sx;
      if(!sfWalkableCell(x, y)) return false; // orthogonal step must be clear too
    }
    if(e2 < dx){
      err += dx; y += sy;
      if(!sfWalkableCell(x, y)) return false;
    }
  }
  return false;
}
function sfSmoothPath(path){
  if(path.length < 3) return path;
  const out = [path[0]];
  let anchor = 0;
  for(let i = 2; i < path.length; i++){
    if(!sfLineWalkable(path[anchor][0], path[anchor][1], path[i][0], path[i][1])){
      out.push(path[i - 1]);
      anchor = i - 1;
    }
  }
  out.push(path[path.length - 1]);
  return out;
}
/* px-space path following; returns true when destination reached */
function sfFollowPath(v, dtH){
  if(!v.sfPath || !v.sfPath.length){ v.moving = false; return true; }
  /* v13: clamp the step like every other mover does — at W.speed 4x the
     unclamped stride (~15px/frame) tunneled into corners, refired the
     repath every frame, and flickered v.face 2<->3 */
  const dt = Math.min(dtH, 0.03);
  v._repathCd = Math.max(0, (v._repathCd || 0) - dt);
  const [wx, wy] = v.sfPath[0];
  const tx = wx * CS + 16, ty = wy * CS + 16;
  const dx = tx - v.x, dy = ty - v.y;
  const d = Math.hypot(dx, dy);
  const spd = 88 * (dt * 60);
  if(d < Math.max(7, spd)){
    /* v13: stride phase is distance-driven — the walk cycle AND the
       follow-cam bob scale with ground actually covered, so 4x fast-
       forward reads as brisk walking, not vibration (jitter item 3) */
    v.walkPhase += Math.min(d, spd) * 0.0025;
    v.x = tx; v.y = ty; v.sfPath.shift(); return sfFollowPath(v, dt);
  }
  const mx = (dx / d) * spd, my = (dy / d) * spd;
  const test = sfCanMoveTo(v.x + mx, v.y + my, v);
  let stepped = 0;
  if(test.ok){ v.x += mx; v.y += my; stepped = spd; }
  else {
    const tx2 = sfCanMoveTo(v.x + mx, v.y, v);
    const ty2 = sfCanMoveTo(v.x, v.y + my, v);
    if(tx2.ok){ v.x += mx; stepped = Math.abs(mx); }
    else if(ty2.ok){ v.y += my; stepped = Math.abs(my); }
    else {
      // body radius clipped a corner: repath — but not every frame.
      // A wedged pawn that just repathed stands down a beat instead of
      // refiring (the refire is what made the facing oscillate).
      if(v._repathCd > 0){ v.moving = false; return false; }
      const g = v.sfPath[v.sfPath.length - 1];
      const p2 = sfPathfind(Math.floor(v.x / CS), Math.floor(v.y / CS), g[0], g[1], true);
      v.sfPath = p2 || null;
      v._repathCd = 0.06;
      return !p2;
    }
  }
  v.walkPhase += stepped * 0.0025;
  v.moving = true;
  v.state = 'walk';
  /* face hysteresis: near-diagonal slides keep the current facing —
     a pawn grazing a wall no longer flips left/right each frame */
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if(ax > ay * 1.25) v.face = dx > 0 ? 3 : 2;
  else if(ay > ax * 1.25) v.face = dy < 0 ? 1 : 0;
  return false;
}
function sfGoTo(v, wx, wy){
  const sx = Math.floor(v.x / CS), sy = Math.floor(v.y / CS);
  if(sx === wx && sy === wy){ v.sfPath = null; return true; }
  v.sfPath = sfPathfind(sx, sy, wx, wy, true);
  return v.sfPath === null ? false : false;
}

/* ---- POIs / doors / interiors ---- */
function sfFindPOI(name){
  if(SF_POI_BY_NAME.has(name)) return SF_POI_BY_NAME.get(name);
  const lower = String(name).toLowerCase();
  for(const p of SF_POIS)
    if(p.name.toLowerCase() === lower){ SF_POI_BY_NAME.set(name, p); return p; }
  for(const p of SF_POIS)
    if(p.name.toLowerCase().includes(lower)){ SF_POI_BY_NAME.set(name, p); return p; }
  return null;
}
function sfPoiDoor(p){
  if(!p) return null;
  if(p.bld >= 0 && SF_DOOR_OF.has(p.bld)) return SF_DOOR_OF.get(p.bld);
  // node POI without a building: snap to the nearest walkable cell
  let wx = p.wx, wy = p.wy;
  if(!sfWalkableCell(wx, wy)){
    outer:
    for(let r = 1; r <= 10; r++)
      for(let dy = -r; dy <= r; dy++)
        for(let dx = -r; dx <= r; dx++)
          if(sfWalkableCell(wx + dx, wy + dy)){ wx += dx; wy += dy; break outer; }
  }
  return { wx, wy };
}
function sfEnterPOI(v, poiName){
  v.inBuilding = true;
  v.inside = poiName;
  v.moving = false;
  v.sfPath = null;
}
function sfExitPOI(v){
  const p = sfFindPOI(v.inside);
  const d = sfPoiDoor(p);
  if(d){ v.x = d.wx * CS + 16; v.y = d.wy * CS + 16; }
  v.inBuilding = false;
  v.inside = null;
}

/* ---- build registries from SF_MAP (called once at boot) ---- */
function sfInitWorld(){
  sfDecodeGrid();
  const cm = SF_M.cell_m;
  // doors
  SF_MAP.buildings.forEach((b, i) => {
    if(b.door){
      SF_DOORS.add(b.door.cx + ',' + b.door.cy);
      SF_DOOR_OF.set(i, { wx: b.door.cx, wy: b.door.cy });
    }
  });
  // pois -> world space
  for(const p of SF_MAP.pois){
    const wx = Math.round(p.x / cm), wy = Math.round(p.y / cm);
    SF_POIS.push({ name: p.name, kind: p.kind, wx, wy,
                   x: wx * CS + 16, y: wy * CS + 16, bld: p.bld });
  }
  // fictional aliases -> real spots
  const al = SF_MAP.anchors || {};
  if(al.haus) SF_POIS.push({ name: 'Haus Coffee', kind: 'cafe',
    wx: Math.round(al.haus.x / cm), wy: Math.round(al.haus.y / cm),
    x: Math.round(al.haus.x / cm) * CS + 16, y: Math.round(al.haus.y / cm) * CS + 16,
    bld: al.haus.bld });
  if(al.auerbach) SF_POIS.push({ name: 'Auerbach Hardware', kind: 'hardware',
    wx: Math.round(al.auerbach.x / cm), wy: Math.round(al.auerbach.y / cm),
    x: Math.round(al.auerbach.x / cm) * CS + 16, y: Math.round(al.auerbach.y / cm) * CS + 16,
    bld: al.auerbach.bld });
  // world-content venues: canonical parody names -> real map spots.
  // src:<name> clones a real/synthetic POI's coords; at:[x,y] is map meters.
  // (world/businesses.md is the naming authority; routines may key on either name)
  const SF_WORLD_POIS = [
    { name: 'Mudhaus Coffee', kind: 'cafe', src: 'Haus Coffee' },
    { name: 'Taqueria El Farolote', kind: 'restaurant', src: 'Taqueria El Farolito' },
    { name: 'Buy-Rite Market', kind: 'supermarket', src: 'Bi-Rite Market' },
    { name: 'Buy-Rite Creamery', kind: 'ice_cream', src: 'Bi-Rite Creamery' },
    { name: 'Il Delfino', kind: 'restaurant', src: 'Delfina' },
    { name: 'Dolores Perk', kind: 'cafe', src: 'Dolores Park Cafe' },
    { name: 'Baguette About It Bakery', kind: 'bakery', src: 'Tartine Bakery' },
    { name: 'The 600 Club', kind: 'bar', src: '500 Club' },
    { name: 'Dandy Lion Chocolate Co.', kind: 'chocolate', src: 'Dandelion Chocolate' },
    { name: 'Valencia Growers Market', kind: 'marketplace', src: 'Valencia Farmers Market' },
    { name: 'Needlepointe Tattoo', kind: 'tattoo', src: '13 Bats Tattoo and Piercing' },
    { name: 'Folsom Auto & Sons', kind: 'car_repair', src: 'F. Lofrano and Son, Inc.' },
    { name: "Malik's Mini Mart", kind: 'convenience', src: 'Guerrero Market & Deli' },
    { name: 'Bloom & Doom Flowers', kind: 'florist', src: 'Diosa Blooms' },
    { name: 'Mission Branch Library', kind: 'library',
      src: 'Mission Temporary Branch, San Francisco Public Library' },
    { name: 'Frutería Las Palmas', kind: 'greengrocer', at: [669.4, 545.5] }, // Dolores at 19th
    { name: 'Mission High School', kind: 'school', at: [616.1, 256.0] },     // 18th & Church
    { name: 'Clarion Alley', kind: 'artwork', at: [1020.9, 111.3] },          // 17th/18th, Mission-Valencia
    { name: 'SF General', kind: 'clinic', at: [1531.3, 1424.9] },             // E edge — commute off toward Potrero
  ];
  for(const w of SF_WORLD_POIS){
    let rec;
    if(w.src){
      const p = sfFindPOI(w.src);
      if(!p) continue;
      rec = { wx: p.wx, wy: p.wy, x: p.x, y: p.y, bld: p.bld };
    } else {
      const wx = Math.round(w.at[0] / cm), wy = Math.round(w.at[1] / cm);
      rec = { wx, wy, x: wx * CS + 16, y: wy * CS + 16, bld: -1 };
    }
    rec.name = w.name; rec.kind = w.kind;
    SF_POIS.push(rec);
  }
  // building world-space records + chunk bucket
  SF_MAP.buildings.forEach((b, i) => {
    const px = b.poly.map(q => [q[0] * SF_PXM, q[1] * SF_PXM]);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for(const q of px){
      if(q[0] < bx0) bx0 = q[0]; if(q[0] > bx1) bx1 = q[0];
      if(q[1] < by0) by0 = q[1]; if(q[1] > by1) by1 = q[1];
    }
    const rec = { i, px, hPx: Math.max(14, b.h * 4.2), x: b.cx * SF_PXM,
                  y: b.cy * SF_PXM, bx0, by0, bx1, by1,
                  name: b.name, hn: b.hn, st: b.st, kind: b.kind,
                  key: 1 + (i % 997) };
    SF_BLD.push(rec);
    for(let cy = Math.floor(by0 / CS / CHN); cy <= Math.floor(by1 / CS / CHN); cy++)
      for(let cx = Math.floor(bx0 / CS / CHN); cx <= Math.floor(bx1 / CS / CHN); cx++){
        const k = cx + ',' + cy;
        if(!SF_BLD_GRID.has(k)) SF_BLD_GRID.set(k, []);
        SF_BLD_GRID.get(k).push(i);
      }
  });
  // street deco: lane dashes where the road's neighbors at +/-3 are non-street
  for(let wy = 0; wy < SF_M.gh; wy++){
    for(let wx = 0; wx < SF_M.gw; wx++){
      const t = sfTile(wx, wy);
      if(t !== 10) continue;
      const v = sfTile(wx, wy - 1) === 10 && sfTile(wx, wy + 1) === 10;
      const h = sfTile(wx - 1, wy) === 10 && sfTile(wx + 1, wy) === 10;
      let bits = 0;
      if(v && sfTile(wx - 3, wy) !== 10 && sfTile(wx + 3, wy) !== 10) bits |= 1;
      if(h && sfTile(wx, wy - 3) !== 10 && sfTile(wx, wy + 3) !== 10) bits |= 2;
      if(v && h) bits = 0; // intersection
      if(bits) SF_DECO.set(wx + ',' + wy, bits);
    }
  }
  // street furniture props
  VILLAGE_OBJECTS.length = 0;
  SF_PROP_CELL.clear();
  SF_PROP_DRAW.clear();
  SF_PICNIC.length = 0;
  const occ = new Set(); // occupied cells (any prop) for spacing checks
  for(const p of SF_MAP.props){
    const kind = p.k === 'tree' ? 'sfTree' : p.k === 'palm' ? 'sfPalm'
               : p.k === 'bench' ? 'sfBench' : 'sfLamp';
    const o = { kind, x: p.x * SF_PXM, y: p.y * SF_PXM,
                wx: Math.round(p.x / cm), wy: Math.round(p.y / cm) };
    VILLAGE_OBJECTS.push(o); sfPropIndex(o); occ.add(o.wx + ',' + o.wy);
  }
  /* ---- v5 procedural vegetation ----
     Street pit trees along sidewalk edges, park undergrowth (shrubs,
     flowerbeds, cypress clusters, path palms), and barrel planters at
     shop doors. Deterministic hashes; spacing via the occ grid. */
  const occNear = (wx, wy, r) => {
    for(let dy = -r; dy <= r; dy++) for(let dx = -r; dx <= r; dx++)
      if(occ.has((wx + dx) + ',' + (wy + dy))) return true;
    return false;
  };
  const doorNear = (wx, wy, r) => {
    for(let dy = -r; dy <= r; dy++) for(let dx = -r; dx <= r; dx++)
      if(SF_DOORS.has((wx + dx) + ',' + (wy + dy))) return true;
    return false;
  };
  const addVeg = (kind, wx, wy, fx, fy) => {
    const o = { kind, x: wx * CS + 16 + (fx || 0), y: wy * CS + 16 + (fy || 0), wx, wy };
    VILLAGE_OBJECTS.push(o); sfPropIndex(o); occ.add(wx + ',' + wy);
    return o;
  };
  let nStreetTree = 0, nParkVeg = 0, nPathPalm = 0;
  for(let wy = 1; wy < SF_M.gh - 1; wy++){
    for(let wx = 1; wx < SF_M.gw - 1; wx++){
      const t = sfTile(wx, wy);
      if(t === 11 && nStreetTree < 1500){
        // sidewalk cell with a street edge: curb-side pit tree
        let fx = 0, fy = 0;
        if(sfTile(wx, wy - 1) === 10) fy = -11;
        else if(sfTile(wx, wy + 1) === 10) fy = 11;
        else if(sfTile(wx - 1, wy) === 10) fx = -11;
        else if(sfTile(wx + 1, wy) === 10) fx = 11;
        else continue;
        // skip corners, crosswalk approaches, door thresholds, POI cells
        if(sfTile(wx, wy - 1) === 16 || sfTile(wx, wy + 1) === 16 ||
           sfTile(wx - 1, wy) === 16 || sfTile(wx + 1, wy) === 16) continue;
        if(doorNear(wx, wy, 2)) continue;
        // v21: real Mission streets carry a pit tree every ~8-10m —
        // v31: coverage raised again toward the real ~70% of eligible pits
        if(phash(wx, wy, 1650) > 0.68) continue;
        if(occNear(wx, wy, 2)) continue;
        const v = phash(wx, wy, 1651) < 0.22 ? 1 : (phash(wx, wy, 1652) < 0.18 ? 2 : 0);
        const o = addVeg('sfStreetTree', wx, wy, fx, fy);
        o.v = v; nStreetTree++;
      } else if(t === 13 && nParkVeg < 1600){
        // park grass: shrubs + flowerbeds; denser near paths, sparse inside
        const nearPath = sfTile(wx, wy - 1) === 15 || sfTile(wx, wy + 1) === 15 ||
                         sfTile(wx - 1, wy) === 15 || sfTile(wx + 1, wy) === 15;
        const nearWalk = sfTile(wx, wy - 1) === 11 || sfTile(wx, wy + 1) === 11 ||
                         sfTile(wx - 1, wy) === 11 || sfTile(wx + 1, wy) === 11;
        const h1 = phash(wx, wy, 1660);
        // v21: Dolores Park is TREE-dotted, not bare lawn — big leafy
        // canopy trees inside the grass, palms ringing the park edge,
        // cypress in clustered stands (they grow in groves, not alone)
        // v31: park canopy upgraded to real cover — denser gate, half the
        // trees mature ~8m crowns (o.big), and trees clump into groves
        // the way Dolores Park's plantings actually mass on the slopes
        // v40: denser still — most park trees are now mature crowns
        if(h1 > 0.955 && !occNear(wx, wy, 3) && !nearPath){
          const o = addVeg('sfTree', wx, wy,
                 (phash(wx, wy, 1667) - 0.5) * 10, (phash(wy, wx, 1668) - 0.5) * 10);
          o.big = phash(wx, wy, 3450) < 0.7 ? 1 : 0;
          nParkVeg++;
          if(phash(wx, wy, 3451) < 0.55 && nParkVeg < 1600){
            const cx2 = wx + Math.floor(phash(wx, wy, 3452) * 5) - 2;
            const cy2 = wy + Math.floor(phash(wy, wx, 3453) * 5) - 2;
            const np2 = sfTile(cx2, cy2 - 1) === 15 || sfTile(cx2, cy2 + 1) === 15 ||
                        sfTile(cx2 - 1, cy2) === 15 || sfTile(cx2 + 1, cy2) === 15;
            if(sfTile(cx2, cy2) === 13 && !occNear(cx2, cy2, 1) && !np2){
              const o2 = addVeg('sfTree', cx2, cy2,
                     (phash(cx2, cy2, 3454) - 0.5) * 10, (phash(cy2, cx2, 3455) - 0.5) * 10);
              o2.big = phash(cx2, cy2, 3450) < 0.4 ? 1 : 0;
              nParkVeg++;
            }
          }
        } else if(nearWalk && sfPalmRow(wx, wy) && !occNear(wx, wy, 3)){
          // v40: perimeter palm allée — a tall palm every ~4 cells along
          // the park edge, the row Dolores Park actually wears
          addVeg('sfPalm', wx, wy,
                 (phash(wx, wy, 1669) - 0.5) * 8, (phash(wy, wx, 1676) - 0.5) * 8);
          nParkVeg++;
          // v59: agaves ring the palm root — the real Dolores beds tuck
          // century-plant rosettes under the allée trunks
          for(const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
            const gx = wx + ax, gy = wy + ay;
            if(sfTile(gx, gy) !== 13 || occNear(gx, gy, 1) ||
               phash(gx, gy, 5701) > 0.42 || nParkVeg >= 1600) continue;
            addVeg('sfAgave', gx, gy,
                   (phash(gx, gy, 5702) - 0.5) * 10,
                   (phash(gy, gx, 5703) - 0.5) * 10).v =
                   phash(gx, gy, 5704) < 0.3 ? 1 : 0;
            nParkVeg++;
          }
        } else if(nearWalk && !occNear(wx, wy, 1) &&
                  phash(wx, wy, 5700) < 0.55){
          // v59: the bedded edge — park cells that face the sidewalk and
          // didn't take a palm carry a maintained border band: echium
          // towers, agave rosettes, clipped shrubs, flowerbeds in a
          // deterministic mix. A continuous planted margin is what makes
          // the lawn read "kept city park" instead of open field.
          const eb = phash(wx, wy, 5705);
          addVeg(eb < 0.30 ? 'sfEchium' : eb < 0.52 ? 'sfAgave'
               : eb < 0.80 ? 'sfShrub' : 'sfFlowerBed', wx, wy,
                 (phash(wx, wy, 5706) - 0.5) * 10,
                 (phash(wy, wx, 5707) - 0.5) * 10).v =
                 phash(wx, wy, 5708) < 0.35 ? 1 : 0;
          nParkVeg++;
        } else if(nearPath && h1 < 0.045 && !occNear(wx, wy, 1)){
          addVeg('sfFlowerBed', wx, wy,
                 (phash(wx, wy, 1661) - 0.5) * 14, (phash(wy, wx, 1662) - 0.5) * 14);
          nParkVeg++;
        } else if(h1 < (nearPath ? 0.05 : 0.018) && !occNear(wx, wy, 1)){
          addVeg('sfShrub', wx, wy,
                 (phash(wx, wy, 1663) - 0.5) * 16, (phash(wy, wx, 1664) - 0.5) * 16);
          nParkVeg++;
        } else if(h1 > 0.99 && !occNear(wx, wy, 3) && !doorNear(wx, wy, 2)){
          // grove: up to 3 cypresses clustered around the seed cell
          const nCl = 1 + Math.floor(phash(wx, wy, 1675) * 3);
          for(let ci = 0; ci < nCl; ci++){
            const cx2 = wx + Math.floor(phash(wx, wy, 1677 + ci) * 3) - 1;
            const cy2 = wy + Math.floor(phash(wy, wx, 1681 + ci) * 3) - 1;
            if(sfTile(cx2, cy2) !== 13 || occNear(cx2, cy2, 1)) continue;
            addVeg('sfCypress', cx2, cy2,
                   (phash(cx2, cy2, 1665) - 0.5) * 10, (phash(cy2, cx2, 1666) - 0.5) * 10);
            nParkVeg++;
          }
        }
      } else if(t === 15 && nPathPalm < 400){
        // v40: path allée — palms march down the path edges every ~6
        // cells (~12m) on a per-row phase, the way the real park palms
        // line its walks, instead of the old random scatter
        let fx = 0, fy = 0, u = 0, per = 0, horiz = true;
        if(sfTile(wx, wy - 1) === 13){ fy = -13; u = wx; per = wy; }
        else if(sfTile(wx, wy + 1) === 13){ fy = 13; u = wx; per = wy; }
        else if(sfTile(wx - 1, wy) === 13){ fx = -13; u = wy; per = wx; horiz = false; }
        else if(sfTile(wx + 1, wy) === 13){ fx = 13; u = wy; per = wx; horiz = false; }
        else continue;
        const off = Math.floor(phash(per, 9, horiz ? 1671 : 1670) * 6);
        if(((u + off) % 6) !== 0 || occNear(wx, wy, 4)) continue;
        addVeg('sfPalm', wx, wy,
               fx + (phash(wx, wy, 1672) - 0.5) * 5,
               fy + (phash(wy, wx, 1673) - 0.5) * 5);
        nPathPalm++;
      }
    }
  }
  // barrel planters flanking shop/POI doors
  let nPlanter = 0;
  for(const p of SF_POIS){
    if(nPlanter >= 70) break;
    if(p.bld == null || p.bld < 0) continue;
    const d = SF_DOOR_OF.get(p.bld);
    if(!d) continue;
    for(const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [3, 0], [-3, 0]]){
      const wx = d.wx + dx, wy = d.wy + dy;
      if(sfTile(wx, wy) !== 11 || occNear(wx, wy, 1)) continue;
      addVeg('sfPlanter', wx, wy, (phash(wx, wy, 1680) - 0.5) * 8, 0);
      nPlanter++;
      break; // one planter per shopfront
    }
  }
  /* ---- v17 streetscape: parked cars lining the curb lanes ----
     Every street cell touching a sidewalk is a curb lane. Cars sit in
     ~6m slots along the street axis, offset toward the curb, skipping
     crosswalk approaches, intersections, and deterministic gaps. */
  SF_DECALS.length = 0; SF_GROUND_OVR.clear();
  let nCars = 0;
  const nearCross = (wx, wy, ax, ay) => {
    for(let k = -3; k <= 3; k++)
      if(sfTile(wx + ax * k, wy + ay * k) === 16) return true;
    return false;
  };
  for(let wy = 1; wy < SF_M.gh - 1 && nCars < 5000; wy++){
    for(let wx = 1; wx < SF_M.gw - 1 && nCars < 5000; wx++){
      if(sfTile(wx, wy) !== 10) continue;
      // curb side: exactly which neighbor is sidewalk decides orientation
      let dir = -1, ox = 0, oy = 0;
      if(sfTile(wx, wy - 1) === 11){ dir = 0; oy = -1; }        // car runs E-W, curb N
      else if(sfTile(wx, wy + 1) === 11){ dir = 0; oy = 1; }    // curb S
      else if(sfTile(wx - 1, wy) === 11){ dir = 1; ox = -1; }   // car runs N-S, curb W
      else if(sfTile(wx + 1, wy) === 11){ dir = 1; ox = 1; }    // curb E
      else continue;
      const ax = dir === 0 ? 1 : 0, ay = dir === 0 ? 0 : 1;
      // street must continue along the axis on both sides (no intersections)
      if(sfTile(wx - ax, wy - ay) !== 10 || sfTile(wx + ax, wy + ay) !== 10) continue;
      if(nearCross(wx, wy, ax, ay)) continue;
      // ~1 car per 6 slots along the street; keyed on the axis coordinate
      const slot = dir === 0 ? wx : wy;
      if(phash(slot, dir === 0 ? wy : wx, 1690) > 0.17) continue;
      // jitter along the slot, hug the curb
      const jx = (phash(wx, wy, 1691) - 0.5) * 10;
      const o = { kind: 'sfCar',
        x: wx * CS + 16 + ox * 9 + ax * jx,
        y: wy * CS + 16 + oy * 9 + ay * jx,
        wx, wy, dir, v: Math.floor(phash(wx, wy, 1692) * 8) };
      VILLAGE_OBJECTS.push(o); sfPropIndex(o); nCars++;
    }
  }
  /* ---- v65 streetrooms: parklets + collection-day curb bins ----
     SF invented the parklet: a cafe's frontage spills into the curb lane
     on a raised deck — rail, planters, tables — exactly where a parked
     car would sit. One deterministic deck per POI shopfront whose curb
     lane is free of parked cars and crosswalk approaches; the deck
     claims the slot a car's hash skipped. Residential frontage gets the
     Recology three-cart row (recycle/compost/landfill) at the curb on
     the block's hash-assigned pickup morning. */
  let nParklet = 0;
  for(const p of SF_POIS){
    if(nParklet >= 80) break;
    if(p.bld == null || p.bld < 0) continue;
    const d = SF_DOOR_OF.get(p.bld);
    if(!d) continue;
    // the sidewalk cell at the door tells which side the curb lane is on
    let sAx = 0, sAy = 0, sOx = 0, sOy = 0;
    for(const [ox2, oy2] of [[0, -1], [0, 1], [-1, 0], [1, 0]]){
      const sx = d.wx + ox2, sy = d.wy + oy2;
      if(sfTile(sx, sy) !== 11) continue;
      if(sfTile(sx, sy - 1) === 10){ sAx = 1; sOy = -1; }
      else if(sfTile(sx, sy + 1) === 10){ sAx = 1; sOy = 1; }
      else if(sfTile(sx - 1, sy) === 10){ sAy = 1; sOx = -1; }
      else if(sfTile(sx + 1, sy) === 10){ sAy = 1; sOx = 1; }
      else continue;
      break;
    }
    if(!sAx && !sAy) continue;
    let best = null, bestH = 2;
    for(let k = -5; k <= 5; k++){
      const px2 = d.wx + sOx + sAx * k, py2 = d.wy + sOy + sAy * k;
      if(sfTile(px2, py2) !== 10) continue;
      // still on the same curb run — sidewalk on the curb side, street
      // continuing along the axis on both deck ends
      if(sfTile(px2 - sOx, py2 - sOy) !== 11) continue;
      if(sfTile(px2 + sAx, py2 + sAy) !== 10 ||
         sfTile(px2 - sAx, py2 - sAy) !== 10) continue;
      if(nearCross(px2, py2, sAx, sAy)) continue;
      // the deck footprint straddles ~1.5 slots; no parked car may stand
      // in any of them (same gate the car pass uses, salt 1690)
      const slot = sAx ? px2 : py2, cross = sAx ? py2 : px2;
      if(phash(slot, cross, 1690) <= 0.17 ||
         phash(slot + 1, cross, 1690) <= 0.17 ||
         phash(slot - 1, cross, 1690) <= 0.17) continue;
      const h = phash(px2, py2, 5910) + Math.abs(k) * 0.05;
      if(h < bestH){ bestH = h; best = { px: px2, py: py2 }; }
    }
    if(!best) continue;
    const o = { kind: 'sfParklet',
      x: best.px * CS + 16 + sOx * 9, y: best.py * CS + 16 + sOy * 9,
      wx: best.px, wy: best.py, dir: sAx ? 0 : 1,
      v: Math.floor(phash(best.px, best.py, 5911) * 3) };
    VILLAGE_OBJECTS.push(o); sfPropIndex(o); nParklet++;
  }
  /* Recology curb rows — on a block's pickup morning the three carts
     line the curb in front of the houses. A frontage cell is sidewalk
     pinned between a building face (12) and the street (10); ~1 in 6
     fronts have theirs out, and never across a door threshold. */
  let nBins = 0;
  for(let wy = 1; wy < SF_M.gh - 1 && nBins < 900; wy++){
    for(let wx = 1; wx < SF_M.gw - 1 && nBins < 900; wx++){
      if(sfTile(wx, wy) !== 11) continue;
      let bx2 = 0, by2 = 0;
      if(sfTile(wx, wy - 1) === 12 && sfTile(wx, wy + 1) === 10) by2 = 1;
      else if(sfTile(wx, wy + 1) === 12 && sfTile(wx, wy - 1) === 10) by2 = -1;
      else if(sfTile(wx - 1, wy) === 12 && sfTile(wx + 1, wy) === 10) bx2 = 1;
      else if(sfTile(wx + 1, wy) === 12 && sfTile(wx - 1, wy) === 10) bx2 = -1;
      else continue;
      if(phash(wx, wy, 5920) > 0.16) continue;
      if(doorNear(wx, wy, 1) || occNear(wx, wy, 0)) continue;
      const o = addVeg('sfBins', wx, wy, bx2 * 10, by2 * 10);
      o.dir = bx2 ? 1 : 0;   // carts line up ALONG the street axis
      nBins++;
    }
  }

  /* ---- v20: utility poles + overhead wire runs ----
     Mission streets carry pole lines along the sidewalk edge — a pole
     every ~9 cells, then catenary spans to the next pole up the run.
     SF_WIRES stores world-px segments (pole-top to pole-top); both
     renderers drape them with real sag. */
  const poleLanes = new Map(); // "dir,lane,side" -> [{slot, o}]
  let nPoles = 0;
  for(let wy = 1; wy < SF_M.gh - 1 && nPoles < 700; wy++){
    for(let wx = 1; wx < SF_M.gw - 1 && nPoles < 700; wx++){
      if(sfTile(wx, wy) !== 11) continue;
      let ax = 0, ay = 0, ox = 0, oy = 0;
      if(sfTile(wx, wy - 1) === 10){ ax = 1; oy = -11; }
      else if(sfTile(wx, wy + 1) === 10){ ax = 1; oy = 11; }
      else if(sfTile(wx - 1, wy) === 10){ ay = 1; ox = -11; }
      else if(sfTile(wx + 1, wy) === 10){ ay = 1; ox = 11; }
      else continue;
      const slot = ax ? wx : wy;
      if(slot % 9 !== (ax ? 2 : 5)) continue;      // ~9m cadence
      if(phash(wx, wy, 1693) > 0.8) continue;      // occasional gaps
      if(sfTile(wx + ax, wy + ay) !== 11 ||
         sfTile(wx - ax, wy - ay) !== 11) continue; // not at intersections
      if(doorNear(wx, wy, 2) || occNear(wx, wy, 1)) continue;
      const o = addVeg('sfPole', wx, wy, ox, oy);
      o.dir = ax ? 0 : 1; // wire run axis: 0 = E-W street
      const lk = o.dir + ',' + (ax ? wy : wx) + ',' + Math.sign(ax ? oy : ox);
      if(!poleLanes.has(lk)) poleLanes.set(lk, []);
      poleLanes.get(lk).push({ slot, o });
      nPoles++;
    }
  }
  SF_WIRES.length = 0;
  for(const lst of poleLanes.values()){
    lst.sort((a, b2) => a.slot - b2.slot);
    for(let k = 1; k < lst.length; k++){
      if(lst[k].slot - lst[k - 1].slot > 16) continue;
      SF_WIRES.push({ x1: lst[k - 1].o.x, y1: lst[k - 1].o.y,
                      x2: lst[k].o.x, y2: lst[k].o.y });
    }
  }

  /* ---- v53: the furniture layer — the small grounded objects a real
     Mission sidewalk carries. Fire hydrants ride the curb edge (a rare
     gold one honors the repainted hydrant at 20th & Church), dark green
     litter drums and chained news boxes hold the crosswalk corners,
     bike racks with locked bikes cluster near shop doors, and the
     Dolores lawn seeds picnic-blanket spots whose occupancy the weather
     and the hour decide at render time (sfPicnicFill). All placements
     are pure hashes of (wx, wy) — the set never depends on load order. */
  let nHydr = 0, nCan = 0, nBox = 0, nRack = 0;
  const doorCells = [...SF_DOORS.keys()].map(k => k.split(',').map(Number));
  for(let wy = 1; wy < SF_M.gh - 1; wy++){
    for(let wx = 1; wx < SF_M.gw - 1; wx++){
      const t = sfTile(wx, wy);
      if(t === 11){
        // curb-side cell? which side faces the street, and which axis
        let ax = 0, ay = 0, ox = 0, oy = 0;
        if(sfTile(wx, wy - 1) === 10){ ax = 1; oy = -12; }
        else if(sfTile(wx, wy + 1) === 10){ ax = 1; oy = 12; }
        else if(sfTile(wx - 1, wy) === 10){ ay = 1; ox = -12; }
        else if(sfTile(wx + 1, wy) === 10){ ay = 1; ox = 12; }
        else continue;
        const cornerish = sfTile(wx + ax * 2, wy + ay * 2) === 16 ||
                          sfTile(wx - ax * 2, wy - ay * 2) === 16 ||
                          sfTile(wx + ax * 3, wy + ay * 3) === 16 ||
                          sfTile(wx - ax * 3, wy - ay * 3) === 16 ||
                          sfTile(wx + ax, wy + ay) === 16 ||
                          sfTile(wx - ax, wy - ay) === 16;
        if(occNear(wx, wy, 0)) continue;
        const slot = ax ? wx : wy;
        if(cornerish){
          // corner curb cell: litter drum or a news-box row most often,
          // a hydrant sometimes — real corners carry all three
          const r = phash(wx, wy, 5320);
          if(r < 0.30 && nCan < 900){
            addVeg('sfTrashCan', wx, wy, ox * 0.7 + (ax ? (phash(wx, wy, 5321) - 0.5) * 12 : 0),
                                      oy * 0.7 + (ay ? (phash(wx, wy, 5321) - 0.5) * 12 : 0));
            nCan++;
          } else if(r < 0.55 && nBox < 500){
            addVeg('sfNewsBox', wx, wy,
                   ox * 0.6 + (ax ? (phash(wx, wy, 5322) - 0.5) * 8 : -ox * 0.15),
                   oy * 0.6 + (ay ? (phash(wx, wy, 5322) - 0.5) * 8 : -oy * 0.15))
              .v = Math.floor(phash(wx, wy, 5323) * 5);
            nBox++;
          } else if(r < 0.72 && nHydr < 800){
            const o = addVeg('sfHydrant', wx, wy, ox, oy);
            // golden hydrant: rare, and only on cells ringing the park
            o.v = (phash(wx, wy, 5324) < 0.04 &&
                   Math.abs(wx - 300) < 60 && Math.abs(wy - 200) < 120) ? 1 : 0;
            nHydr++;
          }
        } else {
          // mid-block curb cell: hydrants on an ~11m cadence, drums and
          // racks thinner — and never inside a door threshold
          if(slot % 11 === (ax ? 4 : 7) && nHydr < 800 &&
             phash(wx, wy, 5325) < 0.8 && !doorNear(wx, wy, 1)){
            addVeg('sfHydrant', wx, wy, ox, oy).v = 0;
            nHydr++;
          } else if(slot % 17 === (ax ? 9 : 3) && nCan < 900 &&
                    phash(wx, wy, 5326) < 0.5 && !doorNear(wx, wy, 1)){
            addVeg('sfTrashCan', wx, wy, ox * 0.7, oy * 0.7);
            nCan++;
          }
          // bike racks cluster within 4 cells of a shop door — coffee
          // and taqueria frontage is where SF actually staples them
          if(nRack < 350 && phash(wx, wy, 5327) < 0.30 && !doorNear(wx, wy, 1)){
            let nearDoor = false;
            for(const [dx, dy] of doorCells)
              if(Math.abs(dx - wx) <= 4 && Math.abs(dy - wy) <= 4){ nearDoor = true; break; }
            if(nearDoor){
              addVeg('sfBikeRack', wx, wy, ox * 0.8, oy * 0.8)
                .v = Math.floor(phash(wx, wy, 5328) * 3);
              nRack++;
            }
          }
        }
      } else if(t === 13){
        /* Dolores lawn picnic spots — a fixed pool of blanket sites on
           open grass (kept clear of tree trunks and off the paths).
           sfPicnicFill() at render decides which are occupied: a warm
           clear afternoon fills the slope, rain or night empties it.
           Blankets arrive in GROUPS — real Dolores lawns are patchworks
           of abutting spreads, so a seeded site tries to pull in a
           neighbor blanket 40% of the time. */
        if(SF_PICNIC.length >= 1500) continue;
        if(phash(wx, wy, 5330) > 0.115) continue;
        if(occNear(wx, wy, 0)) continue;
        const nearPath = sfTile(wx, wy - 1) === 15 || sfTile(wx, wy + 1) === 15 ||
                         sfTile(wx - 1, wy) === 15 || sfTile(wx + 1, wy) === 15;
        if(nearPath && phash(wx, wy, 5331) < 0.55) continue; // sparse on the walk edge
        const o = addVeg('sfPicnic', wx, wy,
                         (phash(wx, wy, 5332) - 0.5) * 14,
                         (phash(wy, wx, 5333) - 0.5) * 14);
        o.v = Math.floor(phash(wx, wy, 5334) * 6);
        SF_PICNIC.push(o);
        if(phash(wx, wy, 5335) < 0.45 && SF_PICNIC.length < 1500){
          // a friend blanket one cell over — shares the same sunny patch
          const bx = wx + (phash(wx, wy, 5336) < 0.5 ? 1 : -1),
                by = wy + (phash(wx, wy, 5337) < 0.5 ? 1 : -1);
          if(sfTile(bx, by) === 13 && !occNear(bx, by, 0)){
            const o2 = addVeg('sfPicnic', bx, by,
                              (phash(bx, by, 5332) - 0.5) * 14,
                              (phash(by, bx, 5333) - 0.5) * 14);
            o2.v = Math.floor(phash(bx, by, 5334) * 6);
            SF_PICNIC.push(o2);
          }
        }
      }
    }
  }

  /* ---- v44: street classification from real run geometry ----
     For every road cell the contiguous (street|crosswalk) run in each
     axis is measured once: the SHORTER run is curb-to-curb width, the
     LONGER is the travel axis. Mission/Guerrero resolve to 7-9 cells,
     residential streets to 5-6, Dolores to 12-15 (it really is a
     boulevard with a planted median). Intersection cells (both runs
     long, or crosswalk tile) get width but no centerline dressing. */
  {
    const gw = SF_M.gw, gh = SF_M.gh, n = gw * gh;
    const isRd = (t) => t === 10 || t === 16;
    const hL = new Int16Array(n), hLen = new Uint16Array(n),
          vL = new Int16Array(n), vLen = new Uint16Array(n);
    for(let y = 0; y < gh; y++){
      let x = 0;
      while(x < gw){
        if(!isRd(SF_GRID[y * gw + x])){ x++; continue; }
        let x2 = x;
        while(x2 + 1 < gw && isRd(SF_GRID[y * gw + x2 + 1])) x2++;
        for(let k = x; k <= x2; k++){ const i = y * gw + k; hL[i] = x; hLen[i] = x2 - x + 1; }
        x = x2 + 1;
      }
    }
    for(let x = 0; x < gw; x++){
      let y = 0;
      while(y < gh){
        if(!isRd(SF_GRID[y * gw + x])){ y++; continue; }
        let y2 = y;
        while(y2 + 1 < gh && isRd(SF_GRID[(y2 + 1) * gw + x])) y2++;
        for(let k = y; k <= y2; k++){ const i = k * gw + x; vL[i] = y; vLen[i] = y2 - y + 1; }
        y = y2 + 1;
      }
    }
    SF_ROADW = new Uint8Array(n); SF_ROADAX = new Uint8Array(n);
    SF_ROADOFF = new Int8Array(n);
    for(let i = 0; i < n; i++){
      if(!hLen[i]) continue;
      const ax = hLen[i] > vLen[i] ? 0 : 1;
      const w = Math.min(hLen[i], vLen[i]);
      SF_ROADAX[i] = ax;
      SF_ROADW[i] = Math.min(255, w);
      const x = i % gw, y = (i / gw) | 0;
      // signed offset from the perpendicular run's center, clamped
      const off = ax === 0 ? y - (vL[i] + (vLen[i] - 1) / 2)
                           : x - (hL[i] + (hLen[i] - 1) / 2);
      SF_ROADOFF[i] = Math.max(-24, Math.min(24, Math.round(off * 2))); // half-cells
    }
    /* The Dolores Street median: real Dolores carries a planted palm
       median down its centerline beside the park. Median cells (the
       center two on any boulevard >= 10 cells wide) bake green in the
       terrain pass, mirror green to the street camera, and take a palm
       every ~6 cells along the axis. */
    let nMed = 0;
    for(let wy = 1; wy < gh - 1; wy++){
      for(let wx = 1; wx < gw - 1; wx++){
        const i = wy * gw + wx;
        if(SF_GRID[i] !== 10 || SF_ROADW[i] < 10) continue;
        if(Math.abs(SF_ROADOFF[i]) > 2) continue;   // |off| <= 1 cell
        SF_GROUND_OVR.set(wx + ',' + wy, '#5d7f56');
        const u = SF_ROADAX[i] ? wy : wx;
        // palms on the consistent center cell: off 0 (odd widths) or the
        // +0.5-cell side (even widths), every ~6 cells along the axis
        if((SF_ROADOFF[i] === 0 || SF_ROADOFF[i] === 1) && u % 6 === 2 &&
           sfTile(wx - 1, wy) === 10 && sfTile(wx + 1, wy) === 10 &&
           sfTile(wx, wy - 1) === 10 && sfTile(wx, wy + 1) === 10 &&
           !occNear(wx, wy, 1)){
          addVeg('sfPalm', wx, wy, 0, 0);
          nMed++;
        }
      }
    }
  }

  /* ---- v17 Dolores Park ground decals (verified all-grass rects) ----
     Two N-S tennis courts on the south lawn, a basketball half-court on
     the east edge, the NE playground pad, and the worn dirt of the
     west-side picnic hill. Rendered into the terrain atlas by
     sfDecalDraw(); SF_GROUND_OVR gives the street camera the same surfaces. */
  SF_DECALS.push(
    { kind: 'tennis', x0: 288, y0: 283, x1: 316, y1: 295 },
    { kind: 'bball',  x0: 330, y0: 190, x1: 340, y1: 202 },
    { kind: 'play',   x0: 318, y0: 130, x1: 338, y1: 144 },
    { kind: 'dirt',   x0: 264, y0: 196, x1: 288, y1: 214,
      cx: 276, cy: 205, rx: 11, ry: 9 },
  );
  const OVR_COL = { tennis: '#577f60', bball: '#6d7d88', play: '#c2a06c',
                    dirt: '#a89868' };
  for(const d of SF_DECALS){
    for(let wy = d.y0; wy < d.y1; wy++)
      for(let wx = d.x0; wx < d.x1; wx++){
        if(sfTile(wx, wy) !== 13) continue;
        if(d.kind === 'dirt'){
          const ex = (wx + 0.5 - d.cx) / d.rx, ey = (wy + 0.5 - d.cy) / d.ry;
          if(ex * ex + ey * ey > 1) continue;
        }
        SF_GROUND_OVR.set(wx + ',' + wy, OVR_COL[d.kind]);
      }
  }

  /* ---- v40: Dolores desire lines — the worn footpaths feet actually
     cut across the lawn: two long corner-to-corner diagonals and a
     terrace-cross mid link, wear fading toward each fringe. Cells bake
     into the terrain atlas via a 'worn' decal and mirror to
     SF_GROUND_OVR for the street camera. */
  let pbx0 = 1e9, pby0 = 1e9, pbx1 = -1, pby1 = -1;
  for(let wy = 0; wy < SF_M.gh; wy++)
    for(let wx = 0; wx < SF_M.gw; wx++){
      if(sfTile(wx, wy) !== 13) continue;
      if(wx < pbx0) pbx0 = wx; if(wx > pbx1) pbx1 = wx;
      if(wy < pby0) pby0 = wy; if(wy > pby1) pby1 = wy;
    }
  if(pbx1 > pbx0){
    const pcx = (pbx0 + pbx1) / 2, pcy = (pby0 + pby1) / 2;
    const lines = [
      [[pbx0 + 2, pby1 - 3], [pcx - 6, pcy + 2], [pbx1 - 3, pby0 + 3]],
      [[pbx0 + 2, pby0 + 4], [pcx + 5, pcy - 3], [pbx1 - 2, pby1 - 4]],
      [[pbx0 + 2, pcy],      [pcx, pcy + 1],    [pbx1 - 2, pcy - 2]],
    ];
    const segD = (px, py, ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      let tt = ((px - ax) * dx + (py - ay) * dy) / l2;
      tt = Math.max(0, Math.min(1, tt));
      return Math.hypot(px - (ax + dx * tt), py - (ay + dy * tt));
    };
    const wornCells = [];
    for(let wy = pby0; wy <= pby1; wy++)
      for(let wx = pbx0; wx <= pbx1; wx++){
        if(sfTile(wx, wy) !== 13) continue;
        let dmin = 1e9;
        for(const L of lines)
          for(let s2 = 0; s2 + 1 < L.length; s2++){
            const dd = segD(wx + 0.5, wy + 0.5,
                            L[s2][0], L[s2][1], L[s2 + 1][0], L[s2 + 1][1]);
            if(dd < dmin) dmin = dd;
          }
        if(dmin > 1.3) continue;
        const w = 1 - dmin / 1.3;
        // patchy: wear breaks up on a per-cell hash at the fringe
        if(phash(wx, wy, 1690) > 0.35 + w * 0.75) continue;
        wornCells.push([wx, wy, w]);
        SF_GROUND_OVR.set(wx + ',' + wy, w > 0.55 ? '#96855a' : '#a08e60');
      }
    if(wornCells.length)
      SF_DECALS.push({ kind: 'worn', cells: wornCells,
                       x0: pbx0, y0: pby0, x1: pbx1 + 1, y1: pby1 + 1 });

    /* ---- v75: wildflower drifts — the Dolores lawn isn't a uniform
       carpet: California poppies and lupine seed in loose drifts along
       the open slopes where the maintenance mower skips (real Mission
       parks carry orange drifts through spring and reseed every year).
       Blobs spawn on hashed grass cells, grow irregular ellipses, and
       refuse cells the decals/wear layer already owns. */
    const meadowCells = [];
    for(let wy = pby0; wy <= pby1; wy++)
      for(let wx = pbx0; wx <= pbx1; wx++){
        if(sfTile(wx, wy) !== 13) continue;
        if(SF_GROUND_OVR.has(wx + ',' + wy)) continue;   // courts/wear/dirt own it
        if(phash(wx, wy, 6200) > 0.012) continue;        // ~1.2% seed cells
        const cx = wx + 0.5, cy = wy + 0.5,
              rx = 2 + phash(wx, wy, 6201) * 4,
              ry = 1.5 + phash(wx, wy, 6202) * 3,
              kind = phash(wx, wy, 6203) < 0.72 ? 0 : 1; // 0 poppy 1 lupine
        const x0 = Math.max(pbx0, Math.floor(cx - rx)),
              x1 = Math.min(pbx1, Math.ceil(cx + rx)),
              y0 = Math.max(pby0, Math.floor(cy - ry)),
              y1 = Math.min(pby1, Math.ceil(cy + ry));
        for(let my = y0; my <= y1; my++)
          for(let mx = x0; mx <= x1; mx++){
            if(sfTile(mx, my) !== 13) continue;
            if(SF_GROUND_OVR.has(mx + ',' + my)) continue;
            const ex = (mx + 0.5 - cx) / rx, ey = (my + 0.5 - cy) / ry,
                  r2 = ex * ex + ey * ey;
            if(r2 > 1) continue;
            // ragged drift edge — blooms thin out, not clip
            if(phash(mx, my, 6204) > 0.25 + (1 - r2) * 0.9) continue;
            meadowCells.push([mx, my, 1 - r2, kind]);
            SF_GROUND_OVR.set(mx + ',' + my,
                              kind ? '#6a8448' : '#86994a');
          }
      }
    if(meadowCells.length)
      SF_DECALS.push({ kind: 'meadow', cells: meadowCells,
                       x0: pbx0, y0: pby0, x1: pbx1 + 1, y1: pby1 + 1 });
  }

  // interiors for the key locations (door-teleport model)
  const INTERIOR_NAMES = {
    'Haus Coffee': 'café counter & window seats',
    'Taqueria El Farolito': 'the line, the salsa bar, the late-night counter',
    'Auerbach Hardware': 'aisles of bins and the counter Victor stands behind',
    'Dolores Park Cafe': 'park-edge café tables',
  };
  for(const nm of Object.keys(INTERIOR_NAMES)){
    const p = sfFindPOI(nm);
    if(p) SF_INTERIORS[nm] = { label: INTERIOR_NAMES[nm], poi: p };
  }
  if(al.g744 != null){
    const d = SF_DOOR_OF.get(al.g744.bld);
    SF_INTERIORS['744 Guerrero'] = { label: "Carmen's front room, sewing table by the window",
      poi: null, door: d, bld: al.g744.bld };
  }
  if(al.g750 != null){
    const d = SF_DOOR_OF.get(al.g750.bld);
    SF_INTERIORS['750 Guerrero'] = { label: 'the top-floor flat Priya and Marcus share',
      poi: null, door: d, bld: al.g750.bld };
  }
}

/* world-cell position of a named anchor: poi name, anchor key, or {wx,wy} */
function sfAnchorCell(ref){
  if(!ref) return null;
  if(ref.wx != null) return { wx: ref.wx, wy: ref.wy };
  if(typeof ref === 'string'){
    const al = SF_MAP.anchors || {};
    if(al[ref]){
      const a = al[ref];
      if(a.cx != null) return { wx: a.cx, wy: a.cy };
      if(a.bld >= 0 && SF_DOOR_OF.has(a.bld)) return SF_DOOR_OF.get(a.bld);
      if(a.x != null)
        return { wx: Math.round(a.x / SF_M.cell_m), wy: Math.round(a.y / SF_M.cell_m) };
    }
    const p = sfFindPOI(ref);
    if(p){
      const d = sfPoiDoor(p);
      if(d) return d;
      return { wx: p.wx, wy: p.wy };
    }
  }
  return null;
}
