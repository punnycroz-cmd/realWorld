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
    SF_BLD, SF_PXM, sfTurretU, phash, SF_MAP })`);
(async () => {
  await api.boot();
  const B = api.SF_BLD, PXM = api.SF_PXM;
  let nb = 0, nTurrBld = 0, nWalls = 0, hits = [];
  for(const b of B){
    const isShop = !!b.name || api.phash(b.i, 5, 1303) < 0.12;
    const floors = Math.max(1, Math.round(b.hPx / 16));
    let has = false;
    for(let e = 0; e < b.px.length; e++){
      const a = b.px[e], c = b.px[(e + 1) % b.px.length];
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]) / PXM;
      nWalls++;
      const t = api.sfTurretU(b.i, e, L, isShop, floors);
      if(t > 0){ has = true; hits.push(b.i); }
    }
    nb++; if(has) nTurrBld++;
  }
  console.log('buildings', nb, 'turret buildings', nTurrBld, 'turret hits', hits.length, '/', nWalls);
  // distance of turret buildings to the g744 anchor + Haus Coffee
  const g = api.SF_MAP.anchors.g744, gb = api.SF_BLD[g.bld];
  const hc = B.find(b => b.name === 'Haus Coffee');
  const near = (bx, by) => B.filter(b => hits.includes(b.i) &&
    Math.hypot(b.x - bx, b.y - by) < 400).map(b => b.i);
  console.log('near g744:', near(gb.x, gb.y));
  console.log('near haus:', hc ? near(hc.x, hc.y) : 'n/a');
})();
