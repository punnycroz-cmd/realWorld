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
    SF_LENS, SF_PXM })`);

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

  console.log('---');
  console.log(pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
