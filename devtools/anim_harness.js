'use strict';
// Harness for the animation state machine + 28-character cast.
// Stubs canvas, loads pa-core.js + pa-chars.js, and asserts:
//  (a) every sim activity state maps to a non-idle animation
//  (b) all 28 cast members have distinct parameter sets
//  (c) every character builds every animation clip in all 3 directions
// Usage: node devtools/anim_harness.js
const fs = require('fs');
const path = require('path');
const DEV = path.join(__dirname, '..', 'willowbrook', 'dev');

// ---- canvas 2d stub (same shape as devtools/node_harness.js) ----
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
  const c = { width:300, height:150, style:{}, getContext:() => makeCtx(), addEventListener(){} };
  return c;
}
global.document = { createElement: t => t === 'canvas' ? makeCanvas() : { style:{} } };
global.G = { villagers:[], frame:0 };

const src = fs.readFileSync(path.join(DEV,'pa-core.js'),'utf-8') + '\n' +
            fs.readFileSync(path.join(DEV,'pa-chars.js'),'utf-8');
const api = eval(src + `
;({ workFor, buildChars, paCharDraw, cR, cP, cBlob, cUp, cAutoOutline,
    paStateAnim, paActFrame, nvBuildFrameSet, buildCastChars,
    PA_STATE_ANIM, NV_ACTS, NV_CAST, DESIGNS, PA })`);
const { paStateAnim, paActFrame, buildCastChars, PA_STATE_ANIM, NV_ACTS, NV_CAST, DESIGNS, PA } = api;

let pass = 0, fail = 0;
const ok = (cond, msg) => { if(cond){ pass++; } else { fail++; console.log('FAIL', msg); } };

// ---- contract functions ----
for(const fn of ['workFor','buildChars','paCharDraw','cR','cP','cBlob','cUp','cAutoOutline',
                 'paStateAnim','paActFrame','nvBuildFrameSet','buildCastChars']){
  ok(typeof api[fn] === 'function', 'contract: ' + fn + ' is a function');
}

// ---- (a) every sim activity state -> non-idle animation ----
// enumerated from src/**/*.js: every literal `v.state = 'x'` assignment
const SIM_STATES = ['idle','walk','wander','run','flee','wade','swim','drown_panic',
  'work','serve','chat','talk','teach','claim','greet','wave','eat','drink','phone',
  'sleep','rest','sit','bathe','play','argue','fight','brawl','attack','hunt','stalk',
  'sad','cry','laugh','carry','downed','dead'];
for(const s of SIM_STATES){
  const A = paStateAnim(s);
  ok(A && typeof A.act === 'string', 'state ' + s + ' has a table entry');
  if(s === 'idle') ok(A.act === 'idle', 'idle state maps to idle clip');
  else ok(A.act !== 'idle', 'state ' + s + ' maps to non-idle clip (got ' + (A && A.act) + ')');
}
// every act referenced by the table is actually built
const builtActs = new Set(NV_ACTS.map(a => a[0]).concat(['sleep']));
for(const s of SIM_STATES){
  ok(builtActs.has(paStateAnim(s).act), 'state ' + s + ' act ' + paStateAnim(s).act + ' is built');
}

// ---- (b) 28 cast members, distinct parameter sets ----
ok(NV_CAST.length === 28, 'cast has 28 members (got ' + NV_CAST.length + ')');
ok(NV_CAST.filter(c => c.tier === 'core').length === 8, 'cast has 8 CORE');
ok(NV_CAST.filter(c => c.tier === 'ambient').length === 20, 'cast has 20 AMBIENT');
for(const c of NV_CAST){
  if(c.tier === 'ambient') ok(c.name && c.role, c.id + ' has name + role');
  else ok(/^C[1-8]$/.test(c.id), c.id + ' is a core placeholder id');
}
const sigs = new Set(NV_CAST.map(c => JSON.stringify(c)));
ok(sigs.size === 28, 'all 28 cast parameter sets are distinct (got ' + sigs.size + ')');
const ids = new Set(NV_CAST.map(c => c.id));
ok(ids.size === 28, 'all 28 cast ids are unique');

// ---- (c) every cast member renders every clip in every direction ----
const cast = buildCastChars();
ok(Object.keys(cast).length === 28, 'buildCastChars produced 28 frame sets');
for(const c of NV_CAST){
  const F = cast[c.id];
  ok(!!F, c.id + ' has a frame set');
  for(const dir of [0,1,2]){
    for(const [act,n] of NV_ACTS){
      ok(F[dir][act] && F[dir][act].length === n, c.id + ' dir' + dir + ' clip ' + act + ' has ' + n + ' frames');
    }
    ok(F[dir].sleep && F[dir].sleep.length === 2, c.id + ' dir' + dir + ' sleep clip');
  }
}
// spot-check paActFrame picks non-idle arrays
const vstub = { state:'fight', walkPhase:0.3 };
const fr = paActFrame(cast['C1'], 0, vstub, 24);
ok(!!fr && fr.width === 48 && fr.height === 64, 'paActFrame returns a 48x64 frame for fight');
vstub.state = 'phone';
ok(!!paActFrame(cast['A20'], 0, vstub, 80), 'paActFrame returns a frame for phone');
ok(api.workFor('C1') === 'coffee' && api.workFor('A01') === 'coffee' && api.workFor('Marta') === 'hoe',
   'workFor resolves cast props + legacy tools');

// visual distinctness: the resolved DESIGNS entries are distinct objects per id
ok(DESIGNS['C1'] !== DESIGNS['C2'] && DESIGNS['C1'].head !== DESIGNS['C2'].head,
   'cast designs are independently generated');

console.log('---');
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
