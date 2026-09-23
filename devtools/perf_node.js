'use strict';
// v10 perf harness: boots the SF test bundle in Node (same DOM stubs as
// sf_harness), then swaps in an op-counting canvas ctx and measures JS
// cost + canvas op count per frame for both SF views.
// Usage: node devtools/perf_node.js
const fs = require('fs');
const path = require('path');
const page = path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if(!m){ console.error('NO SCRIPT BLOCK'); process.exit(2); }

let COUNT = false;
let OPS = 0;
const BYNAME = {};
function count(name){ if(!COUNT) return; OPS++; BYNAME[name] = (BYNAME[name] || 0) + 1; }
function makeCtx(){
  const grad = { addColorStop(){ count('addColorStop'); } };
  return new Proxy({}, {
    get(t, k){
      if(k === 'canvas') return { width: 64, height: 64 };
      if(k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern')
        return () => { count(String(k)); return grad; };
      if(k === 'getImageData') return (x,y,w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1 });
      if(k === 'createImageData') return (w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1 });
      if(k === 'measureText') return () => ({ width: 10 });
      if(t[k] !== undefined) return t[k];
      return (...a) => { count(String(k)); };
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
    EV: (code) => eval(code),
    setCtx: (c) => { ctx = c; },
    sfRenderWorld, sfRenderStreet, sfFindPOI, SF_MAP, SF_BLD, SF_PXM,
    VILLAGERS, W })`);

function bench(fn, frames){
  OPS = 0; for(const k in BYNAME) delete BYNAME[k];
  const t0 = process.hrtime.bigint();
  for(let i = 0; i < frames; i++) fn();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { ms: ms / frames, ops: OPS / frames };
}

(async () => {
  await api.boot();
  api.EV(`W.paused = true; W.tod = 12.5; W.rain = 0; W.storm = 0; W.temp = 21;
          sfSyncClock = function(){}; sfLiveTick = function(){};`);
  // swap in counting ctx post-boot (sprite gen happens during boot)
  api.setCtx(makeCtx());
  // v29: PERF_NOSTILL=1 disables the temporal frame cache so the bench
  // measures full render cost, not the 0.5s still-blit (which now hits
  // whenever the measured frame is fast enough to stay in one bucket)
  if(process.env.PERF_NOSTILL) api.EV('sfStillHit = function(){ return false; }');
  COUNT = true;

  api.EV(`(() => {
    SF_VIEW='top'; SF_CAM.director=false;
    const p = sfFindPOI('Haus Coffee'); const b = SF_BLD[p.bld];
    cam.x = b.x; cam.y = b.y; cam.zoom = 0.85;
    const v = VILLAGERS[0]; v.x = p.x; v.y = p.y; v.inBuilding = false;
  })()`);
  api.sfRenderWorld(1440, 900); // warm (bakes caches)
  const top = bench(() => api.sfRenderWorld(1440, 900), 40);
  const topOps = Object.assign({}, BYNAME);

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
  const st = bench(() => api.sfRenderStreet(1440, 900), 40);
  const stOps = Object.assign({}, BYNAME);

  console.log(`TOP    ${top.ms.toFixed(2)} ms/js-frame   ${Math.round(top.ops)} canvas-ops/frame`);
  console.log(`STREET ${st.ms.toFixed(2)} ms/js-frame   ${Math.round(st.ops)} canvas-ops/frame`);
  const short = o => JSON.stringify(Object.fromEntries(
    Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8)));
  console.log('TOP top-ops:', short(topOps));
  console.log('STREET top-ops:', short(stOps));
})();
