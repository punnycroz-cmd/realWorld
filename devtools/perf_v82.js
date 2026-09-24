'use strict';
// v82 perf attribution probe: like perf_node.js but wraps the street-pass
// functions and reports canvas-op + JS-ms cost per wrapped callee.
// Usage: node devtools/perf_v82.js [extra fn names...]
const fs = require('fs');
const path = require('path');
const page = path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if(!m){ console.error('NO SCRIPT BLOCK'); process.exit(2); }

let COUNT = false;
let OPS = 0;
function count(){ if(!COUNT) return; OPS++; }
function makeCtx(){
  const grad = { addColorStop(){ count(); } };
  return new Proxy({}, {
    get(t, k){
      if(k === 'canvas') return { width: 64, height: 64 };
      if(k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern')
        return () => { count(); return grad; };
      if(k === 'getImageData') return (x,y,w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1 });
      if(k === 'createImageData') return (w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1 });
      if(k === 'measureText') return () => ({ width: 10 });
      if(t[k] !== undefined) return t[k];
      return (...a) => { count(); };
    },
    set(t, k, v){ t[k] = v; return true; }
  });
}
function makeCanvas(){
  return { width: 300, height: 150, style: {}, getContext: () => makeCtx(),
           addEventListener(){}, getBoundingClientRect: () => ({left:0,top:0}) };
}
const elements = {};
function makeEl(id){
  return { id, style:{}, textContent:'', innerHTML:'', title:'',
           addEventListener(){}, appendChild(){},
           classList:{ add(){}, remove(){} },
           getContext:() => makeCtx(), width:300, height:150 };
}
let domReadyCb = null;
global.window = {
  addEventListener(ev, cb){ if(ev === 'DOMContentLoaded') domReadyCb = cb; },
  removeEventListener(){},
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
global.document = {
  getElementById(id){ if(id === 'autotest') return makeEl(id);
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
    EV: (code) => eval(code),
    setCtx: (c) => { ctx = c; },
    sfRenderWorld, sfRenderStreet, sfFindPOI, SF_MAP, SF_BLD, SF_PXM,
    VILLAGERS, W })`);

const STAT = {};
global.__ops = () => OPS;
global.__wrapStat = (name, fn, t0, o0) => {
  const s = STAT[name] || (STAT[name] = { calls: 0, ms: 0, ops: 0 });
  s.calls++;
  s.ms += Number(process.hrtime.bigint() - t0) / 1e6;
  s.ops += OPS - o0;
  return fn;
};

(async () => {
  await api.boot();
  api.EV(`W.paused = true; W.tod = 12.5; W.rain = 0; W.storm = 0; W.temp = 21;
          sfSyncClock = function(){}; sfLiveTick = function(){};
          sfStillHit = function(){ return false; };`);
  api.setCtx(makeCtx());

  // wrap candidates
  const NAMES = [
    'sfStreetWall','sfWallImpostor','sfWallLiveOver','sfCarStreet',
    'sfParkletStreet','sfBinsStreet','sfCorniceDrips','sfWashDay',
    'sfPropVis','sfSkyVis','sfElevM','sfGroundZ','sfCanyonShade','sfHazeA',
    'sfSunGapK','sfCloudShadow','sfKarlShade','sfShadowBlobs','sfGapBlobs',
    'sfSoftEllipse','sfDapple','sfGroundFogStreet','sfRainOverlay',
    'sfClouds','sfKarlFront','sfKarlFrontField','sfFogField',
    'sfWireShadow','sfLeafGapK','sfCrownSpec','sfBoomClip','sfBldMPoly',
    'sfCurbFaceCol','sfSegHit','sfSegHitT','sfPicnicFill','sfLampPool',
    'sfUmbra','sfMowBand','sfGrassDry','sfTreeTurns','sfCloudSprite',
    'sfCloudShadowSprite','sfParrotAt','sfRenderInterior','sfKarlPoly',
    'sfKarlDepthAt','sfCloudPos','sfTreeWellM','sfBounceK','sfVisKm',
    'sfKarlK','sfMissionH','sfTurretU','sfMuralWall','sfBldAtM',
    'sfGhostSet','sfFogPos','sfFogPuffA','sfCanyonShadeB','sfLeaves',
    'sfParrotTrees','sfCloudCover','sfFlashOverlay','sfLampsLit',
    'sfPicnicOn','sfElevGrid','sfTerrChunk','getSfBldArt','sfSegDist',
  ].concat(process.argv.slice(2));
  for(const n of NAMES){
    try {
      api.EV(`if(typeof ${n} === 'function'){
        ${n} = (function(orig){
          return function(...a){
            const t0 = process.hrtime.bigint(), o0 = __ops();
            const r = orig.apply(this, a);
            __wrapStat(${JSON.stringify(n)}, 0, t0, o0);
            return r;
          };
        })(${n});
      }`);
    } catch(e){ /* name not in scope */ }
  }
  COUNT = true;

  api.EV(`(() => {
    SF_VIEW='street'; SF_CAM.director=true;
    const g = SF_MAP.anchors.g744; const b = SF_BLD[g.bld];
    const bx = b.x / SF_PXM, by = b.y / SF_PXM;
    SF_CAM.x = bx - 26; SF_CAM.y = by + 34; SF_CAM.h = 9;
    SF_CAM.yaw = Math.atan2(by - SF_CAM.y - 18, bx - SF_CAM.x + 30);
    SF_CAM.pitch = 0.12; SF_CAM._snap = true;
    const v = VILLAGERS[0]; v.inBuilding = false;
  })()`);
  api.sfRenderStreet(1440, 900);
  const FR = 40;
  OPS = 0; for(const k in STAT) delete STAT[k];
  const t0 = process.hrtime.bigint();
  for(let i = 0; i < FR; i++) api.sfRenderStreet(1440, 900);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / FR;
  console.log(`STREET ${ms.toFixed(2)} ms/js-frame  ${Math.round(OPS / FR)} ops/frame`);
  const rows = Object.entries(STAT).map(([n, s]) =>
    [n, s.calls / FR, s.ms / FR, s.ops / FR]);
  rows.sort((a, b) => b[3] - a[3]);
  console.log('fn                         calls/f      ms/f     ops/f');
  for(const [n, c, m2, o] of rows.slice(0, 30))
    console.log(n.padEnd(26), c.toFixed(1).padStart(7), m2.toFixed(2).padStart(9), Math.round(o).toString().padStart(9));
})();
