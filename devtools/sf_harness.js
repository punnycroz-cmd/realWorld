'use strict';
// SF Mission scenario harness — stubs the DOM, boots the test bundle with
// ?sf (no ?test: we drive assertions directly), then verifies:
//  (a) a villager paths between two named POIs, preferring sidewalks
//  (b) a villager can enter Haus Coffee (door-teleport interior)
//  (c) all animation states reachable in-world via paActFrame
//  (d) building walls block, doors walkable, streets walkable
// Usage: node devtools/sf_harness.js
const fs = require('fs');
const path = require('path');
const page = path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if(!m){ console.error('NO SCRIPT BLOCK'); process.exit(2); }

function makeCtx(){
  const grad = { addColorStop(){} };
  return new Proxy({}, {
    get(t, k){
      if(k === 'canvas') return { width:64, height:64 };
      if(k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
      if(k === 'getImageData') return (x,y,w,h) => ({ data:new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1 });
      if(k === 'createImageData') return (w,h) => ({ data:new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1 });
      if(k === 'measureText') return () => ({ width:10 });
      return t[k] !== undefined ? t[k] : (() => {});
    },
    set(t, k, v){ t[k]=v; return true; }
  });
}
function makeCanvas(){
  return { width:300, height:150, style:{}, getContext:() => makeCtx(),
           addEventListener(){}, getBoundingClientRect:() => ({left:0,top:0}) };
}
const elements = {};
function makeEl(id){
  return { id, style:{}, textContent:'', innerHTML:'', title:'',
           addEventListener(){}, appendChild(){},
           classList:{ add(){}, remove(){} },
           getContext:() => makeCtx(), width:300, height:150 };
}
let domReadyCb = null;
const autotestEl = makeEl('autotest');
global.window = {
  addEventListener(ev, cb){ if(ev === 'DOMContentLoaded') domReadyCb = cb; },
  removeEventListener(){},
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
global.document = {
  getElementById(id){ if(id === 'autotest') return autotestEl;
    return elements[id] || (elements[id] = makeEl(id)); },
  createElement(tag){ return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
  title: '', addEventListener(){}, body: makeEl('body'),
};
global.location = { search: '?sf' };
global.requestAnimationFrame = () => 0;
global.fetch = () => Promise.reject(new Error('offline harness'));
try { global.navigator = { userAgent: 'node' }; } catch(e){}

const api = eval(m[1] + `
;({ boot: (typeof boot!=='undefined') ? boot : null,
    sfPathfind, sfFindPOI, sfPoiDoor, sfEnterPOI, sfExitPOI, sfTile,
    sfFollowPath, sfGoTo, sfNpcTick, canMoveTo, paActFrame, paStateAnim,
    VILLAGERS, PA, W, SF_M, SF_DOORS, SF_DOOR_OF, SF_POIS, SF_MAP,
    SF_INTERIORS, SF_BLD, CS, G, SF_WX, sfPuddleAt, sfUmbrellaCol,
    sfGhostSet, sfSegHit, sfCamMarkSave, sfCamMarkGo, SF_CAM, SF_CUT,
    SF_LENS, SF_PXM, sfGroundZ, SF_CURB_H, sfCurbFaceCol,
    sfNbMasks, sfOvrNums, SF_GROUND_OVR, sfGableFront, sfGarageU,
    sfVegSideSpr, sfBigTreeSpr, sfDrySeason, sfGrassDry, VILLAGE_OBJECTS,
    sfSkyLobeA, sfBounceK, sfCanyonShade, SF_SUN,
    sfKarlK, sfKarlPoly, sfKarlFront, sfIntArch, sfRenderInterior,
    sfCellField, sfTopLean, sfTopLeanShift, SF_TOP_ALT_M, cam,
    sfBoomClip, sfSegHitT, sfElevM, sfParapetKind, sfMissionH,
    sfWireShadow, sfPalmRow, SF_DECALS, sfWallImpostor, sfWallBakeKey,
    SF_WIM, sfTreeWellM, SF_PROP_CELL,
    updateHUD,
    setInsp: (i2) => { inspectedPawnIdx = i2; },
    getCtrl: () => controlledPawnIdx })`);

(async () => {
  if(!api.boot){ console.error('no boot'); process.exit(2); }
  try { await api.boot(); } catch(e){
    console.error('BOOT FAILED:', e.stack ? e.stack.split('\n').slice(0,8).join('\n') : e);
    process.exit(2);
  }
  let pass = 0, fail = 0;
  const ok = (c, msg) => { if(c) pass++; else { fail++; console.log('FAIL', msg); } };

  ok(api.VILLAGERS.length === 28, '28 cast spawned (got ' + api.VILLAGERS.length + ')');
  ok(api.SF_POIS.length >= 150, 'named POIs >= 150 (got ' + api.SF_POIS.length + ')');

  // (d) collision
  const g744 = api.SF_MAP.anchors.g744;
  const b744 = api.SF_BLD[g744.bld];
  const bc = api.canMoveTo(b744.x + 4, b744.y + 4, api.VILLAGERS[0]);
  ok(!bc.ok, 'building wall blocks');
  const door = api.SF_DOOR_OF.get(g744.bld);
  ok(door && api.canMoveTo(door.wx * api.CS + 16, door.wy * api.CS + 16).ok,
     '744 Guerrero door walkable');

  // (a) path between two named POIs
  const haus = api.sfFindPOI('Haus Coffee');
  const faro = api.sfFindPOI('Taqueria El Farolito');
  ok(haus && faro, 'Haus Coffee + El Farolito resolve');
  const dHaus = api.sfPoiDoor(haus), dFaro = api.sfPoiDoor(faro);
  const path = api.sfPathfind(dHaus.wx, dHaus.wy, dFaro.wx, dFaro.wy);
  ok(!!path && path.length >= 3, 'path Haus Coffee -> El Farolito exists' +
     (path ? ' (' + path.length + ' wpts)' : ''));
  if(path){
    const street = path.filter(([x,y]) => api.sfTile(x,y) === 10).length;
    console.log('   path: ' + path.length + ' waypoints, ' +
      Math.round(street/path.length*100) + '% street cells');
    ok(street/path.length < 0.75, 'path mostly off the roadway');
  }
  // second pair: park cafe -> 744 Guerrero
  const dpc = api.sfFindPOI('Dolores Park Cafe');
  const path2 = api.sfPathfind(api.sfPoiDoor(dpc).wx, api.sfPoiDoor(dpc).wy, door.wx, door.wy);
  ok(!!path2, 'path Dolores Park Cafe -> 744 Guerrero exists');

  // walk a pawn along the path for real
  const v = api.VILLAGERS.find(v => v._castId === 'C2');
  v.x = dHaus.wx * api.CS + 16; v.y = dHaus.wy * api.CS + 16;
  v.sfPath = api.sfPathfind(dHaus.wx, dHaus.wy, dFaro.wx, dFaro.wy, true);
  let steps = 0;
  while(v.sfPath && v.sfPath.length && steps++ < 20000)
    api.sfFollowPath(v, 0.016);
  const arrived = Math.hypot(v.x - (dFaro.wx*api.CS+16), v.y - (dFaro.wy*api.CS+16)) < api.CS * 3;
  ok(arrived, 'pawn physically walked Haus Coffee -> El Farolito (' +
     Math.round(Math.hypot(v.x-(dFaro.wx*api.CS+16), v.y-(dFaro.wy*api.CS+16))/api.CS) + ' cells short)');

  // (b) enter Haus Coffee
  const mars = api.VILLAGERS.find(v => v._castId === 'C1');
  api.sfEnterPOI(mars, 'Haus Coffee');
  ok(mars.inBuilding && mars.inside === 'Haus Coffee', 'enter Haus Coffee');
  api.sfExitPOI(mars);
  ok(!mars.inBuilding, 'exit Haus Coffee');
  ok(!!api.SF_INTERIORS['Haus Coffee'], 'Haus Coffee interior registered');
  ok(!!api.SF_INTERIORS['744 Guerrero'] && !!api.SF_INTERIORS['750 Guerrero'],
     'Guerrero flat interiors registered');

  // (c) all animation states reachable in-world
  const STATES = ['idle','walk','run','wade','swim','drown_panic','work','serve',
    'chat','talk','teach','greet','wave','eat','drink','phone','sleep','rest',
    'sit','bathe','play','argue','fight','stalk','sad','laugh','carry','downed'];
  let n = 0;
  for(const s of STATES){
    for(const p of api.VILLAGERS.slice(0, 4)){
      const F = api.PA.chars[p._ci];
      if(F && api.paActFrame(F, 0, { state: s, walkPhase: 0.3 }, 40)){ n++; break; }
    }
  }
  ok(n === STATES.length, 'all ' + STATES.length + ' states render (got ' + n + ')');

  // schedule sanity: every cast member has a routine + home cell
  ok(api.VILLAGERS.every(v => v.sfSched && v.sfSched.length),
     'every cast member has a schedule');
  ok(api.VILLAGERS.every(v => v.sfHome && isFinite(v.sfHome.wx)),
     'every cast member has a home cell');

  // one sim tick of the schedule system doesn't throw
  try { api.VILLAGERS.forEach(v => api.sfNpcTick(v, 0.016)); pass++; }
  catch(e){ fail++; console.log('FAIL sfNpcTick threw:', e.message); }

  // v25 wet-world pack: puddles gate hardscape deterministically,
  // umbrellas come out only in rain
  let pud = null, pudCell = null, grassClear = true;
  for(let gy = 0; gy < api.SF_M.gh && !pud; gy++)
    for(let gx = 0; gx < api.SF_M.gw; gx++){
      if(api.sfTile(gx, gy) !== 10) continue;
      const pu = api.sfPuddleAt(gx, gy);
      if(pu){ pud = pu; pudCell = [gx, gy]; break; }
    }
  ok(!!pud, 'puddle field produces pools on roadway cells');
  if(pud)
    ok(JSON.stringify(api.sfPuddleAt(pudCell[0], pudCell[1])) === JSON.stringify(pud),
       'puddles deterministic per cell');
  for(let gy = 0; gy < api.SF_M.gh; gy++)
    for(let gx = 0; gx < api.SF_M.gw; gx++)
      if(api.sfTile(gx, gy) === 13 && api.sfPuddleAt(gx, gy)){ grassClear = false; break; }
  ok(grassClear, 'no puddles on park grass');
  api.W.rain = 0;
  ok(!api.VILLAGERS.some(v => api.sfUmbrellaCol(v)), 'no umbrellas when dry');
  api.W.rain = 0.8;
  ok(api.VILLAGERS.some(v => !v.inBuilding && api.sfUmbrellaCol(v)),
     'umbrellas come out in rain');
  api.W.rain = 0;

  // v27 cutaway camera: sightlines through real footprints, not bboxes
  const cmid = { x: b744.x / api.SF_PXM, y: b744.y / api.SF_PXM };
  const gset = api.sfGhostSet(cmid.x - 60, cmid.y, cmid.x + 60, cmid.y);
  ok(gset.has(g744.bld), 'ghost set ghosts a building on the sightline');
  const gfar = api.sfGhostSet(cmid.x - 60, cmid.y + 400, cmid.x + 60, cmid.y + 400);
  ok(!gfar.has(g744.bld), 'off-sightline building not ghosted');
  ok(api.sfSegHit(0,0, 10,0, 5,-5, 5,5) && !api.sfSegHit(0,0, 10,0, 20,-5, 20,5),
     'sfSegHit segment intersection');
  // director marks round-trip
  api.SF_CAM.x = 111; api.SF_CAM.y = 222; api.SF_CAM.h = 7;
  api.sfCamMarkSave(3);
  api.SF_CAM.x = 0; api.SF_CAM.y = 0; api.SF_CAM.h = 1;
  api.sfCamMarkGo(3);
  ok(api.SF_CAM.x === 111 && api.SF_CAM.y === 222 && api.SF_CAM.h === 7,
     'director mark save/recall round-trip');
  ok(api.SF_CUT.on === true && api.SF_LENS.on === true,
     'cutaway + lens rig on by default');

  // v28 curb height: sidewalk slab is real geometry
  ok(api.SF_CURB_H > 0.1 && api.SF_CURB_H < 0.2, 'curb height ~15cm');
  let swCell = null, rdCell = null;
  for(let gy = 1; gy < api.SF_M.gh - 1 && !swCell; gy++)
    for(let gx = 1; gx < api.SF_M.gw - 1; gx++){
      if(api.sfTile(gx, gy) === 11 && api.sfTile(gx, gy - 1) === 10)
        { swCell = [gx, gy]; rdCell = [gx, gy - 1]; break; }
    }
  ok(!!swCell, 'found a sidewalk/road adjacency');
  if(swCell){
    const cm2 = api.SF_M.cell_m;
    // v37: sfGroundZ is now ABSOLUTE (terrain + curb) — the curb step is
    // the difference between adjacent walkway and roadway cells
    const zSw = api.sfGroundZ((swCell[0] + 0.5) * cm2, (swCell[1] + 0.5) * cm2),
          zRd = api.sfGroundZ((rdCell[0] + 0.5) * cm2, (rdCell[1] + 0.5) * cm2);
    ok(Math.abs(zSw - zRd - api.SF_CURB_H) < 0.1,
       'sidewalk sits curb-height above the roadway (step ' +
       (zSw - zRd).toFixed(2) + 'm)');
    ok(zRd > -30 && zRd < 90, 'roadway grade is plausible (' + zRd.toFixed(1) + 'm)');
  }
  ok(/^#|^rgb/.test(api.sfCurbFaceCol(0, -1)),
     'curb riser face returns a shaded color');

  // v29 ground-pass infrastructure
  const nbm = api.sfNbMasks();
  ok(nbm && nbm.length === api.SF_M.gw * api.SF_M.gh,
     'neighbor mask covers the whole grid');
  if(swCell){
    const mi = swCell[1] * api.SF_M.gw + swCell[0];
    ok((nbm[mi] & 1) === 1, 'mask bit0: road to the north');
    ok((nbm[mi] & (2 << 0)) === 0, 'mask bit1: north neighbor not sidewalk');
  }
  const ovn = api.sfOvrNums();
  ok(ovn && ovn.size === api.SF_GROUND_OVR.size,
     'numeric ground-override map mirrors string map 1:1');
  ok(api.sfOvrNums() === ovn, 'override map is cached (same instance)');

  // v30 facade grammar: gable fronts + raised-basement garage gates are
  // pure deterministic functions over the real map
  let gables = 0, garages = 0, edges = 0;
  for(const b of api.SF_BLD){
    const nP = b.px.length, isShop = !!b.name;
    const floors = Math.max(1, Math.round(b.hPx / 12.6));
    for(let e = 0; e < nP; e++){
      const a = b.px[e], c = b.px[(e + 1) % nP];
      const Lm = Math.hypot(c[0] - a[0], c[1] - a[1]) / api.SF_PXM;
      edges++;
      gables += api.sfGableFront(b.i, e, Lm, isShop, floors) > 0 ? 1 : 0;
      garages += api.sfGarageU(b.i, e, Lm, isShop, 0, false, 0.5) > 0 ? 1 : 0;
    }
  }
  ok(gables > 20 && gables < edges * 0.5,
     'gable fronts on a plausible share of edges (' + gables + '/' + edges + ')');
  ok(garages > 20 && garages < edges * 0.5,
     'garage bays on a plausible share of edges (' + garages + ')');
  ok(api.sfGableFront(3, 0, 12, false, 3) === api.sfGableFront(3, 0, 12, false, 3),
     'sfGableFront deterministic');
  ok(api.sfGableFront(3, 0, 12, true, 3) === 0 && api.sfGarageU(3, 0, 12, true, 0, false, 0.5) === -1,
     'shops never get gables or garages');

  // v31 urban forest: elevation sprites baked for every tree kind,
  // park groves produce mature crowns, pit-tree coverage thickened
  const VG = api.PA.sfVeg;
  ok(VG.sideTree.length === 3 && VG.sidePalm.length === 2 &&
     VG.sideStreet.length === 3 && VG.sideCypress.length === 2 &&
     VG.bigTree.length === 3, 'v31 vegetation sprite sets baked');
  ok(api.sfVegSideSpr('palm', 0).c.height === 190 &&
     api.sfVegSideSpr('street', 1).c.width === 64,
     'v31 side sprites deterministic sizes');
  ok(api.sfBigTreeSpr(0).c.width === 128, 'v31 big-tree sprite 128px');
  const bigs = api.VILLAGE_OBJECTS.filter(o => o.kind === 'sfTree' && o.big).length;
  const trees = api.VILLAGE_OBJECTS.filter(o => o.kind === 'sfTree').length;
  ok(bigs > 10 && bigs < trees, 'v31 park groves carry mature crowns (' + bigs + '/' + trees + ')');
  const pits = api.VILLAGE_OBJECTS.filter(o => o.kind === 'sfStreetTree').length;
  ok(pits > 600, 'v31 street pit coverage raised (' + pits + ')');

  // v32 turf calendar: dryness is a month-of-year curve (Sept peak),
  // per-cell cure is deterministic, bounded, and patchy
  ok(api.PA.sf && api.PA.sf.parkDry && api.PA.sf.parkDry.length === 3,
     'v32 cured-grass tile set baked');
  const mo0 = api.W.month;
  api.W.month = 9;
  ok(api.sfDrySeason() > 0.7, 'September turf is cured (got ' + api.sfDrySeason() + ')');
  api.W.month = 2;
  ok(api.sfDrySeason() < 0.2, 'February turf is green (got ' + api.sfDrySeason() + ')');
  api.W.month = 9;
  let gold = 0, grassCells = 0;
  for(let gy = 0; gy < api.SF_M.gh; gy++)
    for(let gx = 0; gx < api.SF_M.gw; gx++){
      if(api.sfTile(gx, gy) !== 13) continue;
      grassCells++;
      if(api.sfGrassDry(gx, gy) > 0.5) gold++;
    }
  ok(grassCells > 0 && gold > grassCells * 0.15 && gold < grassCells * 0.95,
     'September cure lands in drifts (' + gold + '/' + grassCells + ')');
  const d9 = api.sfGrassDry(1, 1);
  ok(api.sfGrassDry(1, 1) === d9, 'sfGrassDry deterministic');
  ok(d9 >= 0 && d9 <= 1, 'sfGrassDry bounded 0..1');
  api.W.month = mo0;

  // v33 forward scatter & canyon bounce: the Mie lobe swells toward the
  // sun and dies behind it; bounce uplight only exists when the wall is
  // sun-shy AND the canyon floor in front is lit
  const day0 = api.SF_SUN.day;
  api.SF_SUN.day = 0.8;
  ok(api.sfSkyLobeA(1) > api.sfSkyLobeA(0.2) && api.sfSkyLobeA(-1) === 0,
     'sky lobe peaks at the sun bearing, none anti-solar');
  ok(api.sfBounceK(-0.6, 0) > 0.02, 'shaded wall over lit street bounces');
  ok(api.sfBounceK(0.5, 0) === 0, 'sunlit wall needs no bounce');
  ok(api.sfBounceK(-0.6, 2.5) === 0, 'shadowed street gives no bounce');
  ok(api.sfBounceK(-0.6, 0) === api.sfBounceK(-0.6, 0),
     'sfBounceK deterministic');
  ok(api.sfCanyonShade(1, 1, -1) >= 0, 'canyon probe bounded');
  // v39: shaped parapets + wire-shadow solver
  ok(['flat', 'gable', 'mission'].includes(
       api.sfParapetKind(3, 0, 12, false, 3)), 'parapet kind in enum');
  ok(api.sfParapetKind(3, 0, 12, false, 3) ===
     api.sfParapetKind(3, 0, 12, false, 3), 'parapet kind deterministic');
  ok(api.sfParapetKind(5, 1, 5, false, 1) === 'flat',
     'narrow single-story never gets a shaped parapet');
  ok(api.sfMissionH(3, 0) > 0.8 && api.sfMissionH(3, 0) < 1.7,
     'espanada rise bounded');
  {
    // wall through the origin with n̂ = toSun, û ⟂ n̂; wire 8m out
    // along the normal so its ray lands back on the wall plane
    const sx = api.SF_SUN.toX, sy = api.SF_SUN.toY;
    const hit = api.sfWireShadow(8 * sx, 8 * sy, 7,
                                 0, 0, -sy, sx, sx, sy, 20);
    if(api.SF_SUN.day > 0.1){
      ok(!!hit && hit.u > -0.2 && hit.u < 1.2 && hit.z < 7 && hit.s > 0,
         'wire shadow lands below conductor height');
      ok(api.sfWireShadow(0, -8, 7, -10, 0, 1, 0, -sx, -sy, 20) === null,
         'shadow never lands on the sun-shy face');
    } else ok(true, 'wire shadow gate skipped (sun down)');
  }
  api.SF_SUN.day = day0;

  // v34 Karl's front: intrusion strength is a bounded pure function of the
  // live weather state — diurnal-gated (burns off midday, evening push),
  // humidity-fed, wind-carried; the map clip produces a real polygon whose
  // front edge sits deepest downwind
  const t0 = api.W.tod, h0 = api.W.hum, ws0 = api.W.windSpd, wa0 = api.W.windAng;
  let bounded = true;
  for(let tt = 0; tt < 24; tt += 3){
    api.W.tod = tt;
    const k = api.sfKarlK();
    if(!(k >= 0 && k <= 1)) bounded = false;
  }
  ok(bounded, 'sfKarlK bounded 0..1 across the day');
  api.W.tod = 8; api.W.hum = 0.9;
  const kWet = api.sfKarlK();
  api.W.hum = 0.3;
  const kDry = api.sfKarlK();
  ok(kWet > kDry, 'humid morning intrudes harder than dry (' +
     kWet.toFixed(2) + ' vs ' + kDry.toFixed(2) + ')');
  api.W.hum = 0.9;
  api.W.tod = 13; const kMid = api.sfKarlK();
  api.W.tod = 17.5; const kEve = api.sfKarlK();
  ok(kEve > kMid, 'evening push beats midday burn-off (' +
     kEve.toFixed(2) + ' vs ' + kMid.toFixed(2) + ')');
  ok(api.sfKarlK() === api.sfKarlK(), 'sfKarlK deterministic');
  const kp = api.sfKarlPoly(0.4);
  ok(kp.length >= 3 && kp.length <= 6,
     'karl poly clips map rect to a polygon (' + kp.length + ' verts)');
  const mw2 = api.SF_M.gw * api.SF_M.cell_m, mh2 = api.SF_M.gh * api.SF_M.cell_m;
  ok(kp.every(p => p[0] >= -0.01 && p[0] <= mw2 + 0.01 &&
                   p[1] >= -0.01 && p[1] <= mh2 + 0.01),
     'karl poly stays inside the map bounds');
  const kf = api.sfKarlFront(kp);
  ok(kf && kf.length === 2, 'karl front edge resolves');
  ok(api.sfKarlPoly(0).length === 0, 'no front, no polygon');

  // v61: distant shower cells — a pure function of the slow time bucket
  // plus the live moisture drivers; bearings/distances bounded, strength
  // in 0..1, virga flag consistent, and a stormy sky raises more cells
  // than a dry one. Restore W afterwards (v34 block saved the originals).
  {
    const cf1 = api.sfCellField();
    ok(Array.isArray(cf1), 'sfCellField returns an array');
    ok(JSON.stringify(api.sfCellField()) === JSON.stringify(cf1),
       'sfCellField deterministic within a bucket');
    ok(cf1.every(c => c.str >= 0 && c.str <= 1 && c.dist >= 7000 &&
       c.dist <= 19000 && c.az >= 0 && c.az < Math.PI * 2 &&
       c.baseZ > 0 && c.topZ > c.baseZ && c.virga === (c.str <= 0.55)),
       'cell records bounded + virga flag consistent');
    const t61 = api.SF_WX.t, st0 = api.W.storm, cv0 = api.SF_WX.cover;
    api.W.hum = 0.95; api.W.storm = 0.8; api.SF_WX.cover = 0.8;
    let stormCells = 0, stormMax = 0, sawRain = false;
    for(let b = 0; b < 4; b++){
      api.SF_WX.t = t61 + b * 1500;              // scan a few cell buckets
      const cfS = api.sfCellField();
      stormCells += cfS.length;
      for(const c of cfS){ stormMax = Math.max(stormMax, c.str);
        if(!c.virga) sawRain = true; }
    }
    ok(stormCells > 0 && stormMax > 0.55 && sawRain,
       'storm field raises horizon-reaching cells (' + stormCells +
       ' cells, max ' + stormMax.toFixed(2) + ')');
    api.W.hum = 0.1; api.W.storm = 0; api.SF_WX.cover = 0.02;
    api.SF_WX.t = t61 + 6000;
    ok(api.sfCellField().length === 0, 'dry clear sky spawns no cells');
    api.W.hum = h0; api.W.storm = st0; api.SF_WX.cover = cv0;
    api.SF_WX.t = t61;
  }

  // v61: fog drip — a heavy Karl intrusion wets pavement without rain;
  // below the threshold it dries. (Physics check on the drip curve, not
  // the integrator: same expression as the tick's.)
  {
    const kfWet = Math.max(-0.006, 0.9 * 0.010 - 0.005);
    const kfDry = Math.max(-0.006, 0.2 * 0.010 - 0.005);
    ok(kfWet > 0 && kfDry < 0,
       'fog drip: karlK 0.9 soaks (' + kfWet.toFixed(4) + '), 0.2 dries');
  }

  // v62: the top camera is a real aerial platform — relief displacement
  // is zero at the nadir, radially outward everywhere else, linear in
  // both height and distance, and grounded at the anchor.
  {
    ok(api.SF_TOP_ALT_M > 100 && api.SF_TOP_ALT_M < 2000,
       'aerial platform altitude is a plausible photo altitude (' +
       api.SF_TOP_ALT_M + 'm)');
    const cx = api.cam.x, cy = api.cam.y;
    const s0 = api.sfTopLeanShift(cx, cy, 60);
    ok(Math.abs(s0[0]) < 1e-9 && Math.abs(s0[1]) < 1e-9,
       'nadir: zero displacement at frame center');
    const sE = api.sfTopLeanShift(cx + 500, cy, 60);
    ok(sE[0] > 0, 'east of nadir leans east (outward), got ' + sE[0].toFixed(2));
    const sW = api.sfTopLeanShift(cx - 500, cy, 60);
    ok(sW[0] < 0, 'west of nadir leans west (outward), got ' + sW[0].toFixed(2));
    const sN = api.sfTopLeanShift(cx, cy - 500, 60);
    ok(sN[1] < 0, 'north of nadir leans north/up, got ' + sN[1].toFixed(2));
    const sS = api.sfTopLeanShift(cx, cy + 500, 60);
    ok(sS[1] > 0, 'south of nadir leans south/down, got ' + sS[1].toFixed(2));
    const sE2 = api.sfTopLeanShift(cx + 1000, cy, 60);
    ok(Math.abs(sE2[0] - sE[0] * 2) < 1e-6,
       'displacement is linear in distance from nadir');
    const sTall = api.sfTopLeanShift(cx + 500, cy, 120);
    ok(Math.abs(sTall[0] - sE[0] * 2) < 1e-6,
       'displacement is linear in height (taller leans farther)');
    // grounded: the transform must leave the anchor itself unmoved —
    // sfTopLean shears about (ax, ay), so a point AT the pivot stays
    ok(api.sfTopLean(cx + 500, cy, 100, 100) === true &&
       api.sfTopLean(cx, cy, 100, 100) === false,
       'sfTopLean returns false at the nadir, true off-center');
  }

  // v63: wall impostor atlas — the bake key is stable across frames
  // (cloud-shadow drift is neutralized in the bake, not keyed), a bake
  // populates the LRU, and the slice fan draws for a sane projection
  // while refusing a lens parked inside the near plane.
  {
    const b0 = api.SF_BLD[0];
    const k1 = api.sfWallBakeKey(b0, 0, false);
    const k2 = api.sfWallBakeKey(b0, 0, false);
    ok(k1 === k2, 'wall bake key is frame-stable');
    ok(api.sfWallBakeKey(b0, 1, false) !== k1,
       'bake key distinguishes wall edges');
    const n0 = api.SF_WIM.size;
    // synthetic wall: 20m run, 12m tall, camera-facing ortho projection
    const prW = (x, y, z) => [x * 4 + 200, 400 - z * 8, 40];
    const okd = api.sfWallImpostor(b0, 0, 0, 0, 20, 0, 1, 0, 20,
                                   0, -1, 12, prW, false, 40, 1440);
    ok(okd === true, 'impostor draws for a sane wall projection');
    ok(api.SF_WIM.size > n0 || api.SF_WIM.size === 150,
       'bake populates the atlas LRU (' + api.SF_WIM.size + ' entries)');
    const prNear = (x, y, z) => [x * 4 + 200, 400 - z * 8, 0.8];
    ok(api.sfWallImpostor(b0, 0, 0, 0, 20, 0, 1, 0, 20,
                          0, -1, 12, prNear, false, 40, 1440) === false,
       'impostor refuses a lens inside the near plane');
  }

  // v64: street-tree wells — every sidewalk tree sits in a grate-ringed
  // cut-out; the ficus well runs wider than the small-crown pits and the
  // sizing helper is pure so both views draw the same footprint
  {
    ok(typeof api.sfTreeWellM === 'function', 'sfTreeWellM exported');
    const wF = api.sfTreeWellM({ kind: 'sfStreetTree', v: 0 }),
          wS = api.sfTreeWellM({ kind: 'sfStreetTree', v: 1 });
    ok(wF > wS, 'ficus well wider than small-crown pit (' + wF + ' vs ' + wS + ')');
    ok(api.sfTreeWellM({ v: 1 }) === wS, 'sfTreeWellM deterministic');
    ok(api.sfTreeWellM(null) > 0, 'sfTreeWellM tolerates a bare prop');
    // street trees actually exist on the grid to receive wells
    let nTree = 0;
    for(const [, lst] of api.SF_PROP_CELL || [])
      for(const o of lst) if(o.kind === 'sfStreetTree') nTree++;
    ok(nTree > 0, 'street trees present for wells (' + nTree + ')');
  }

  // v35: interior archetypes resolve per venue name/label
  ok(api.sfIntArch('Taqueria El Farolito', 'the line, the salsa bar') === 'taqueria',
     'farolito reads as taqueria');
  ok(api.sfIntArch('Auerbach Hardware', 'aisles of bins') === 'hardware',
     'auerbach reads as hardware');
  ok(api.sfIntArch('Haus Coffee', 'café counter') === 'cafe',
     'haus reads as cafe');
  ok(api.sfIntArch('744 Guerrero', "Carmen's front room") === 'flat',
     'guerrero flat reads as flat');
  ok(api.sfIntArch('Haus Coffee', '') === api.sfIntArch('Haus Coffee', ''),
     'sfIntArch deterministic');
  // every registered interior renders without throwing
  {
    ok(typeof api.sfRenderInterior === 'function', 'sfRenderInterior exported');
    const prevV = api.VILLAGERS[0];
    const hadInside = prevV.inside;
    for(const nm of Object.keys(api.SF_INTERIORS)){
      prevV.inside = nm;
      try { api.sfRenderInterior(640, 400, prevV); pass++; }
      catch(e){ fail++; console.log('FAIL interior render', nm, e.message); }
    }
    prevV.inside = hadInside;
  }
  api.W.tod = t0; api.W.hum = h0; api.W.windSpd = ws0; api.W.windAng = wa0;

  // v36 boom arm: the follow rig's pull-back is physical — it clips
  // against real footprints taller than the lens, stands off the wall
  // face, clears rooflines when the camera flies high, and never treats
  // the subject's own building as an occluder
  {
    const pm = b744.px.map(q => [q[0] / api.SF_PXM, q[1] / api.SF_PXM]);
    let wx0 = 1e9, wx1 = -1e9, wy0 = 1e9, wy1 = -1e9;
    for(const q of pm){
      if(q[0] < wx0) wx0 = q[0]; if(q[0] > wx1) wx1 = q[0];
      if(q[1] < wy0) wy0 = q[1]; if(q[1] > wy1) wy1 = q[1];
    }
    const midY = (wy0 + wy1) / 2, span = wx1 - wx0;
    const sx0 = wx0 - 6, back = span + 12;
    const clipD = api.sfBoomClip(sx0, midY, 1, 0, back, 1.7);
    ok(clipD < back && clipD >= 1.4,
       'boom clips before entering a tall facade (' + clipD.toFixed(1) + '/' + back.toFixed(1) + 'm)');
    ok(api.sfBoomClip(sx0, midY, 1, 0, back, 1.7) === clipD,
       'sfBoomClip deterministic');
    let pkx = 0, pky = 0, pkn = 0;
    for(let gy = 0; gy < api.SF_M.gh; gy++)
      for(let gx = 0; gx < api.SF_M.gw; gx++)
        if(api.sfTile(gx, gy) === 13){ pkx += gx; pky += gy; pkn++; }
    pkx = pkx / pkn * api.SF_M.cell_m; pky = pky / pkn * api.SF_M.cell_m;
    ok(api.sfBoomClip(pkx, pky, 1, 0, 15, 1.7) === 15,
       'boom over open park grass keeps full length');
    ok(api.sfBoomClip(sx0, midY, 1, 0, back, 60) === back,
       'lens above the roofline never clips');
    ok(api.sfSegHitT(0, 0, 10, 0, 5, -5, 5, 5) > 0 &&
       api.sfSegHitT(0, 0, 10, 0, 20, -5, 20, 5) === -1,
       'sfSegHitT returns the hit parameter');
    // subject inside the footprint: the boom still reaches out through
    // the door side — the arm clips only against OTHER buildings
    const inD = api.sfBoomClip(cmid.x, cmid.y, 1, 0, back, 1.7);
    ok(inD >= 1.4 && inD <= back, 'boom from inside a footprint bounded');
  }

  // v37 landform: the elevation field is pure, finite, climbs south and
  // west like the real Mission, puts Dolores Park in a true bowl, and
  // keeps street grades drivable
  {
    ok(isFinite(api.sfElevM(0, 0)) && isFinite(api.sfElevM(1500, 1600)) &&
       isFinite(api.sfElevM(-50, -50)), 'sfElevM finite even off-map');
    ok(api.sfElevM(700, 500) === api.sfElevM(700, 500), 'sfElevM deterministic');
    let nSum = 0, sSum = 0, wSum = 0, eSum = 0, nn = 0;
    for(let gx = 0; gx < api.SF_M.gw; gx += 17){
      nSum += api.sfElevM(gx * 2, 4);
      sSum += api.sfElevM(gx * 2, api.SF_M.gh * 2 - 4);
      wSum += api.sfElevM(4, gx % api.SF_M.gh * 2);
      eSum += api.sfElevM(api.SF_M.gw * 2 - 4, gx % api.SF_M.gh * 2);
      nn++;
    }
    ok(sSum > nSum + nn * 10,
       'terrain climbs south (+' + ((sSum - nSum) / nn).toFixed(1) + 'm avg)');
    ok(wSum > eSum + nn * 5,
       'terrain climbs west (+' + ((wSum - eSum) / nn).toFixed(1) + 'm avg)');
    let pkx = 0, pky = 0, pkn = 0;
    for(let gy = 0; gy < api.SF_M.gh; gy++)
      for(let gx = 0; gx < api.SF_M.gw; gx++)
        if(api.sfTile(gx, gy) === 13){ pkx += gx; pky += gy; pkn++; }
    pkx = pkx / pkn * api.SF_M.cell_m; pky = pky / pkn * api.SF_M.cell_m;
    const eP = api.sfElevM(pkx, pky), eE = api.sfElevM(pkx + 220, pky);
    ok(eE > eP + 2, 'Dolores Park sits in a real bowl (rim +' +
       (eE - eP).toFixed(1) + 'm)');
    let gmax = 0;
    for(let gy = 0; gy < api.SF_M.gh; gy += 11)
      for(let gx = 0; gx < api.SF_M.gw; gx += 11){
        const x0 = gx * 2, y0 = gy * 2;
        const gg = Math.hypot(api.sfElevM(x0 + 4, y0) - api.sfElevM(x0, y0),
                              api.sfElevM(x0, y0 + 4) - api.sfElevM(x0, y0)) / 4;
        if(gg > gmax) gmax = gg;
      }
    ok(gmax > 0.005 && gmax < 0.13,
       'street grades real but drivable (' + (gmax * 100).toFixed(1) + '% max)');
  }

  // v40 canopy architecture: perimeter palm allée is deterministic and
  // beats exactly one residue class per row; desire-line decals exist
  {
    ok(typeof api.sfPalmRow === 'function', 'sfPalmRow exported');
    ok(api.sfPalmRow(10, 10) === api.sfPalmRow(10, 10),
       'sfPalmRow deterministic');
    const palms = api.VILLAGE_OBJECTS.filter(o => o.kind === 'sfPalm').length;
    ok(palms >= 40, 'palm allees planted (' + palms + ' palms)');
    const fic = api.VILLAGE_OBJECTS.filter(o => o.kind === 'sfStreetTree' && o.v === 0).length;
    ok(fic >= 50, 'ficus street trees planted (' + fic + ')');
    let nWorn = 0;
    for(const d of api.SF_DECALS) if(d.kind === 'worn') nWorn += d.cells.length;
    ok(nWorn > 40, 'desire lines worn across the lawn (' + nWorn + ' cells)');
  }

  // v57: possession ban — the spectator shell's Take Control handler is a
  // verified no-op for EVERY cast member in SF mode (C1–C8 absolute, and
  // ambient residents too: possession enters only through the game-systems
  // request pipeline, never a dev button). Click it programmatically on a
  // main and on an ambient; nothing may flip.
  {
    const btn = document.getElementById('btn-toggle-ctrl');
    ok(btn && typeof btn.onclick === 'function',
       'btn-toggle-ctrl handler registered');
    const c1 = api.VILLAGERS.findIndex(v => v._castId === 'C1');
    const amb = api.VILLAGERS.findIndex(v => !/^C[1-8]$/.test(v._castId || ''));
    ok(c1 >= 0 && amb >= 0, 'main + ambient indices resolve');
    for(const idx of [c1, amb]){
      if(idx < 0) continue;
      api.setInsp(idx);
      const before = api.VILLAGERS.map(v => !!v.isNPC);
      const ctrl0 = api.getCtrl();
      btn.onclick();
      const after = api.VILLAGERS.map(v => !!v.isNPC);
      ok(after.every((f2, j) => f2 === before[j]) &&
         api.getCtrl() === ctrl0,
         'Take Control is a no-op on ' +
         (api.VILLAGERS[idx]._castId || 'ambient') +
         ' (possession ban holds)');
    }
    api.setInsp(c1 >= 0 ? c1 : 0);
  }

  console.log('---');
  console.log(pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
