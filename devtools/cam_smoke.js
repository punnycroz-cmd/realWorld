'use strict';
const fs = require('fs'), path = require('path');
const page = path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
let drawOps = 0;
function makeCtx(){ const grad={addColorStop(){}}; return new Proxy({},{get(t,k){ if(k==='canvas')return cvProxy; if(k==='createLinearGradient'||k==='createRadialGradient'||k==='createPattern')return()=>grad; if(k==='getImageData')return(x,y,w,h)=>({data:new Uint8ClampedArray((w||1)*(h||1)*4),width:w||1,height:h||1}); if(k==='createImageData')return(w,h)=>({data:new Uint8ClampedArray((w||1)*(h||1)*4),width:w||1,height:h||1}); if(k==='measureText')return()=>({width:10}); return t[k]!==undefined?t[k]:(()=>{drawOps++;});},set(t,k,v){t[k]=v;return true;}});}
const cvProxy = { width:640, height:360, style:{}, getContext:()=>makeCtx(), addEventListener(){}, getBoundingClientRect:()=>({left:0,top:0}) };
function makeCanvas(w,h){return{width:w||640,height:h||360,style:{},getContext:()=>makeCtx(),addEventListener(){},getBoundingClientRect:()=>({left:0,top:0})};}
const elements={};
function makeEl(id){return{id,style:{},textContent:'',innerHTML:'',title:'',addEventListener(){},appendChild(){},classList:{add(){},remove(){}},getContext:()=>makeCtx(),width:300,height:150};}
global.window={addEventListener(){},removeEventListener(){},innerWidth:1280,innerHeight:800,devicePixelRatio:1};
global.document={getElementById(id){return elements[id]||(elements[id]=makeEl(id));},createElement(t){return t==='canvas'?makeCanvas():makeEl(t);},title:'',addEventListener(){},body:makeEl('body')};
global.location={search:'?sf'};
global.requestAnimationFrame=()=>0;
global.fetch=()=>Promise.reject(new Error('offline'));
try{global.navigator={userAgent:'node'};}catch(e){}
const api = eval(m[1] + `;({ boot: typeof boot!=='undefined'?boot:null, VILLAGERS, renderWorld, getCam:()=>cam, getCV:()=>cv, getView:()=>SF_VIEW, getIdx:()=>inspectedPawnIdx })`);
(async()=>{
  await api.boot();
  const B = global.window.__aiBridge;
  let pass=0, fail=0;
  const ok=(c,msg)=>{ if(c)pass++; else{fail++; console.log('FAIL',msg);} };
  ok(typeof B.sfCamMake==='function' && typeof B.sfCamRender==='function', 'cam rig bridged');
  const presets = B.sfCamPresets();
  ok(presets.dolores_overlook && presets.mission_street && presets.rooftop_park, '3 named presets');
  // main view state before
  const cam0 = api.getCam(), idx0 = api.getIdx(), view0 = api.getView(), cv0 = api.getCV();
  const v1 = B.sfCamMake({preset:'dolores_overlook', id:'A'});
  const v2 = B.sfCamMake({mode:'street', sfCam:{director:true,x:1300,y:1230,h:1.7,yaw:0.77,pitch:0,fov:1}, id:'B'});
  const v3 = B.sfCamMake({mode:'top', follow:'C1', id:'C'});
  ok(v1 && v1.cam && Math.abs(v1.cam.x - 303*32) < 1, 'preset A cam placed');
  ok(v3.follow === api.VILLAGERS.findIndex(v=>v._castId==='C1'), 'follow resolves cast id -> pawn idx');
  // render views into offscreen canvases
  const cA = makeCanvas(640,360), cB = makeCanvas(640,360), cC = makeCanvas(640,360);
  drawOps = 0;
  ok(B.sfCamRender('A', cA) === true, 'render preset A (top overlook)');
  ok(drawOps > 1000, 'view A actually painted ops (' + drawOps + ')');
  drawOps = 0;
  ok(B.sfCamRender('B', cB) === true, 'render preset B (street)');
  ok(drawOps > 100, 'street view painted ops (' + drawOps + ')');
  drawOps = 0;
  ok(B.sfCamRender('C', cC) === true, 'render follow C1');
  ok(drawOps > 1000, 'follow view painted ops (' + drawOps + ')');
  // main globals restored?
  const cam1 = api.getCam();
  ok(cam1.x === cam0.x && cam1.y === cam0.y && cam1.zoom === cam0.zoom, 'main cam restored');
  ok(api.getIdx() === idx0, 'main inspected idx restored');
  ok(api.getView() === view0, 'main view mode restored');
  ok(api.getCV() === cv0, 'main cv restored');
  // per-viewer isolation: patch view A, others unchanged
  B.sfCamSet('A', {cam:{x:1,y:2,zoom:0.9}});
  ok(SF_CAM_VIEWS_CHECK(), 'view A patched');
  function SF_CAM_VIEWS_CHECK(){ const l=B.sfCamList(); const a=l.find(x=>x.id==='A'); return a && a.mode==='top'; }
  ok(B.sfCamList().length === 3, 'three views listed');
  ok(B.sfCamWatch('A') && api.getView() === 'top', 'watch A on main');
  console.log('===== CAM RIG: ' + pass + ' passed, ' + fail + ' failed =====');
  process.exit(fail?1:0);
})().catch(e=>{console.error('THREW:', e.stack||e); process.exit(2);});
