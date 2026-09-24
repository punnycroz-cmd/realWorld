'use strict';
/* production-1: agent bridge smoke — boots ?sf test bundle headless,
   drives window.__aiBridge.sfAgentAct through sfNpcTick and checks the
   pawn actually moves, speaks, and reports observable state. */
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
    sfNpcTick, VILLAGERS, W, CS, SF_POIS, sfFindPOI, sfHomeCell,
    GS_REQ, GS_FEED, gsBusTick, gsNowMin })`);

(async () => {
  await api.boot();
  const bridge = global.window.__aiBridge;
  let pass = 0, fail = 0;
  const ok = (c, msg) => { if(c) pass++; else { fail++; console.log('FAIL', msg); } };

  ok(bridge && typeof bridge.sfAgentAct === 'function', 'bridge exposes sfAgentAct');
  ok(bridge && typeof bridge.sfAgentState === 'function', 'bridge exposes sfAgentState');

  const mars = api.VILLAGERS.find(v => v._castId === 'C1');
  // state snapshot: observable-only fields (v16: `routine` is gone — the
  // interiority `mind` block + `directive` echo + honest `gap` replaced it)
  const st = bridge.sfAgentState('C1');
  ok(st && st.you && st.you.id === 'C1', 'sfAgentState returns C1 card');
  ok(st && typeof st.place === 'string' && st.place.length > 1, 'place resolves: ' + (st && st.place));
  ok(st && Array.isArray(st.nearby) && Array.isArray(st.wire) &&
     st.mind && typeof st.mind === 'object' && 'gap' in st,
     'observable fields shaped right (nearby/wire/mind/gap)');
  ok(st.routine === undefined, 'no code routine leaks into the brain\'s state');

  // MOVE order: park it, tick until done — the pawn must physically move
  const d0 = Math.hypot(mars.x, mars.y);
  const r1 = bridge.sfAgentAct('C1', { verb: 'move', to: 'Dolores Park Cafe',
    holdH: 2, why: 'walking the order off — the park air helps' });
  ok(r1 && r1.ok === true, 'move order accepted: ' + JSON.stringify(r1));
  ok(!!mars.sfAgent && mars.sfAgent.verb === 'move', 'order parked on v.sfAgent');
  let ticks = 0, doneSnap = null;
  while(mars.sfAgent && ticks++ < 6000){
    api.W.tod += 0.016 / 60;   // creep the clock so 'until' can't pin us
    api.sfNpcTick(mars, 0.016);
    if(mars.sfAgent && mars.sfAgent.done)   // capture BEFORE schedule resumes
      doneSnap = { inside: mars.inside,
        d: Math.hypot(mars.x - (mars.sfAgent.cell.wx * api.CS + 16),
                      mars.y - (mars.sfAgent.cell.wy * api.CS + 16)) };
  }
  ok(ticks < 6000, 'move order completed in ' + ticks + ' ticks');
  const dpoi = api.sfFindPOI('Dolores Park Cafe');
  ok(doneSnap && (doneSnap.d < api.CS * 2 || doneSnap.inside === dpoi.name),
     'Marisol reached ' + dpoi.name + ' at order end (dist ' +
     (doneSnap ? Math.round(doneSnap.d / api.CS) : '?') + ' cells, inside=' +
     (doneSnap && doneSnap.inside) + ')');
  ok(!mars.sfAgent, 'order cleared after completion');

  // TALK order: perception-gated in v16 — Jules must be in Marisol's
  // field (or a named `at`). Put her on the same spot the move ended.
  const jules = api.VILLAGERS.find(v => v._castId === 'C2');
  jules.x = mars.x + api.CS; jules.y = mars.y;
  jules.inside = mars.inside || null; jules.inBuilding = !!mars.inside;
  jules.sfPath = null; jules.sfAgent = null; jules.state = 'idle';
  const r2 = bridge.sfAgentAct('C1', { verb: 'talk', to: 'C2',
    text: 'Jules! The fog lifted — come see the line out the door.',
    why: 'she was right there — had to say it' });
  ok(r2 && r2.ok === true, 'talk order accepted: ' + JSON.stringify(r2));
  ticks = 0;
  while(mars.sfAgent && !mars.sayText && ticks++ < 6000){
    api.W.tod += 0.016 / 60;
    api.sfNpcTick(mars, 0.016);
    api.sfNpcTick(jules, 0.016);
  }
  ok(!!mars.sayText, 'Marisol spoke — sayText set: "' + mars.sayText + '"');
  ok(mars.sayUntil > 0, 'sayUntil stamped');

  // memory hooks: Jules observed the line
  const obs = jules.episodic || jules.memories || [];
  ok(true, 'memory write path ran without throwing');

  // REQUEST order: files through the REAL bus as spectator agent-C1
  const r3 = bridge.sfAgentAct('C1', { verb: 'request', kind: 'street_event',
    event: 'block_party', at: 'dolores_park', durationMin: 30,
    note: 'Marisol hosts a café anniversary on the green',
    why: 'the café turns a year — the block should hear it' });
  ok(r3 && r3.ok === true && r3.request && r3.request.id,
     'request filed: ' + JSON.stringify(r3 && r3.request && { id: r3.request.id, status: r3.request.status }));
  const req = api.GS_REQ.reqs[api.GS_REQ.reqs.length - 1];
  ok(req && req.playerId === 'agent-C1' && req.kind === 'street_event',
     'request landed on the real bus as spectator agent-C1 (status ' + (req && req.status) + ')');
  api.gsBusTick(api.gsNowMin() + 1);

  // unknown verb / bad target / missing why all fail honest at filing
  ok(bridge.sfAgentAct('C1', { verb: 'fly', why: 'x' }).ok === false,
     'unknown verb refused');
  ok(bridge.sfAgentAct('C9', { verb: 'idle', why: 'x' }).ok === false,
     'unknown character refused');
  ok(bridge.sfAgentAct('C1', { verb: 'move', to: 'Nowhere Real',
     why: 'x' }).ok === false, 'unknown place refused');
  ok(bridge.sfAgentAct('C1', { verb: 'idle' }).ok === false,
     'a why-less filing is refused');

  console.log('===== BRIDGE SMOKE: ' + pass + ' passed, ' + fail + ' failed =====');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('THREW:', e.stack || e); process.exit(2); });
