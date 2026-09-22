'use strict';
/* Focused trace for the 3 deterministic needs-deaths: Sella (dehydration d9),
   Alden (exhaustion d11), Clara (dehydration d18).
   Boots the built page headless, advances 1h steps, and records per-target:
   needs, plan, state, pos, survivalGuard triggers, utility winners, thoughts.
   Usage: node devtools/trace_deaths.js
*/
const fs = require('fs');

function buildStubs() {
  function makeCtx() {
    const grad = { addColorStop(){} };
    return new Proxy({}, {
      get(t, k) {
        if (k === 'canvas') return { width: 64, height: 64 };
        if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
        if (k === 'getImageData') return (x,y,w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
        if (k === 'createImageData') return (w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
        if (k === 'measureText') return () => ({ width: 10 });
        return t[k] !== undefined ? t[k] : (() => {});
      },
      set(t, k, v) { t[k] = v; return true; }
    });
  }
  function makeCanvas() {
    return { width: 300, height: 150, style: {}, getContext: () => makeCtx(),
             addEventListener(){}, getBoundingClientRect: () => ({left:0,top:0}) };
  }
  const elements = {};
  function makeEl(id) {
    return { id, style: {}, textContent: '', innerHTML: '', title: '',
             addEventListener(){}, appendChild(){}, classList: { add(){}, remove(){} },
             getContext: () => makeCtx(), width: 300, height: 150 };
  }
  global.window = { addEventListener(){}, removeEventListener(){}, __aiBridge: undefined,
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1 };
  global.document = {
    getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
    createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
    title: '', addEventListener(){}, body: makeEl('body'),
  };
  global.location = { search: '' };
  global.requestAnimationFrame = () => 0;
  try { global.navigator = { userAgent: 'node' }; } catch (e) {}
}

const TARGETS = ['Sella', 'Alden', 'Clara'];

function driverJS() {
  return `;(function(){
  var out = { events: {}, hourly: {}, deaths: [], error: null };
  var ring = {};
  TARGETS.forEach(function(n){ ring[n] = []; out.events[n] = []; out.hourly[n] = []; });
  function ev(name, msg){
    ring[name].push('d' + W.day + ' h' + Math.floor(W.tod) + ' ' + msg);
    if (ring[name].length > 120) ring[name].shift();
  }
  function isTarget(v){ return v && TARGETS.indexOf(v.name) >= 0; }
  function snap(v){
    var b = v.body || {};
    return 'hyd=' + (+b.hydration).toFixed(2) + ' sat=' + (+b.satiety).toFixed(2) + ' fat=' + (+b.fatigue).toFixed(2) +
      ' blood=' + (+b.blood).toFixed(2) + ' wounds=' + ((b.wounds||[]).length) +
      ' dehydH=' + (+(b.dehydH||0)).toFixed(1) + ' exhH=' + (+(b.exhH||0)).toFixed(1) + ' starveH=' + (+(b.starveH||0)).toFixed(1) +
      ' state=' + v.state + ' downed=' + (v.downed ? v.downed.kind + '/' + Math.round(v.downed.t*10)/10 + 'h' : 'null') +
      ' carriedBy=' + (v.carriedBy ? v.carriedBy.name : 'null') +
      ' plan=[' + (v.plan||[]).map(function(s){return s.verb;}).join(',') + ']' +
      ' pos=(' + Math.round(v.x) + ',' + Math.round(v.y) + ')' +
      (v.dead ? ' DEAD' : '');
  }
  try {
    boot();
    // wrap killVillager to capture death + ring buffer
    var __kv = killVillager;
    killVillager = function(v, cause){
      if (isTarget(v) && !v.dead){
        out.deaths.push({ name: v.name, cause: cause, day: W.day, tod: W.tod,
          final: snap(v), ring: ring[v.name].slice() });
      }
      return __kv.apply(null, arguments);
    };
    // wrap survivalGuard to log triggers for targets
    var __sg = survivalGuard;
    survivalGuard = function(v){
      var before = (v.plan||[]).map(function(s){return s.verb;}).join(',');
      __sg(v);
      if (isTarget(v)){
        var after = (v.plan||[]).map(function(s){return s.verb;}).join(',');
        if (before !== after) ev(v.name, 'GUARD plan [' + before + '] -> [' + after + ']');
      }
    };
    // wrap utility decision to log winners for targets
    var __eua = evaluateAndApplyUtilityAction;
    evaluateAndApplyUtilityAction = function(v){
      var r = __eua(v);
      if (isTarget(v) && r) ev(v.name, 'UTIL winner=' + (r.id || r.verb || '?') + ' score=' + (r.score|0));
      return r;
    };
    // wrap planTick completion/failure: log thought changes for targets
    var __pt = planTick;
    planTick = function(v, dtH){
      var thBefore = v.thoughts && v.thoughts.length ? v.thoughts[0].text : '';
      __pt(v, dtH);
      if (isTarget(v)){
        var thAfter = v.thoughts && v.thoughts.length ? v.thoughts[0].text : '';
        if (thAfter !== thBefore && thAfter) ev(v.name, 'THOUGHT: ' + thAfter.slice(0, 90));
      }
    };
    var d, h, i, v;
    for (d = 0; d < 30; d++){
      for (h = 0; h < 24; h++){
        simTick(1);
        for (i = 0; i < VILLAGERS.length; i++){
          v = VILLAGERS[i];
          if (isTarget(v) && !v.dead){
            out.hourly[v.name].push('d' + W.day + ' h' + Math.floor(W.tod) + ' ' + snap(v));
          }
        }
        // stop early once all three targets are dead
        var allDead = true;
        for (i = 0; i < VILLAGERS.length; i++){
          v = VILLAGERS[i];
          if (isTarget(v) && !v.dead) allDead = false;
        }
        if (allDead) break;
      }
      var allDead2 = true;
      for (i = 0; i < VILLAGERS.length; i++){ v = VILLAGERS[i]; if (isTarget(v) && !v.dead) allDead2 = false; }
      if (allDead2) break;
    }
    // flush ring buffers into out.events
    TARGETS.forEach(function(n){ out.events[n] = ring[n].slice(); });
  } catch (e){
    out.error = (e && e.message) + '\\n' + ((e && e.stack) || '').split('\\n').slice(0,6).join('\\n');
  }
  globalThis.__traceResult = JSON.stringify(out);
})();`;
}

buildStubs();
const html = fs.readFileSync('/home/hatch/workspace/world-sim/willowbrook_natura_test.html', 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }
const driver = driverJS().replace(/TARGETS/g, JSON.stringify(TARGETS));
try {
  eval(m[1] + driver);
} catch (e) {
  console.error('EVAL FAILED:', e.message);
  process.exit(2);
}
const out = JSON.parse(global.__traceResult);
if (out.error) { console.error('ERROR:\n' + out.error); process.exit(1); }
for (const d of out.deaths) {
  console.log('=== DEATH: ' + d.name + ' cause=' + d.cause + ' day=' + d.day + ' tod=' + d.tod);
  console.log('  final: ' + d.final);
  console.log('  --- last 120 events ---');
  d.ring.forEach(e => console.log('  ' + e));
}
fs.writeFileSync('/tmp/trace_hourly.json', JSON.stringify(out.hourly, null, 1));
console.log('hourly snapshots -> /tmp/trace_hourly.json');
