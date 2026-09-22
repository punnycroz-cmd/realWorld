'use strict';
// 2E fix verification: 72h live trace at 1-hour steps.
// Appends a trace driver INSIDE page scope (eval), so it can see VILLAGERS/simTick.
const fs = require('fs');
const path = '/home/hatch/workspace/world-sim/willowbrook_natura_test.html';
const html = fs.readFileSync(path, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }

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

let domReadyCb = null;
const autotestEl = makeEl('autotest');
global.window = {
  addEventListener(ev, cb) { if (ev === 'DOMContentLoaded') domReadyCb = cb; },
  removeEventListener(){},
  __aiBridge: undefined,
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
};
global.document = {
  getElementById(id) { if (id === 'autotest') return autotestEl; return elements[id] || (elements[id] = makeEl(id)); },
  createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
  title: '',
  addEventListener(){}, body: makeEl('body'),
};
global.location = { search: '' };  // normal boot, NOT the test path
global.requestAnimationFrame = () => 0;
try { global.navigator = { userAgent: 'node' }; } catch (e) {}

const traceDriver = `
;(function(){
  window.__runTrace72 = function(){
    const lines = [];
    const log = (ok, title, desc) => {
      lines.push((ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : ''));
    };
    try {
      const startCount = VILLAGERS.length;
      const seenDead = {};
      for (const v of VILLAGERS) if (v.dead) seenDead[v.name] = 1;
      let nanTicks = 0;
      const nanVillagers = [];
      const deaths = [];
      for (let h = 0; h < 72; h++) {
        simTick(1);
        for (const v of VILLAGERS) {
          if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) {
            nanTicks++;
            if (nanVillagers.indexOf(v.name) < 0) nanVillagers.push(v.name);
          }
          if (v.dead && !seenDead[v.name]) {
            seenDead[v.name] = 1;
            deaths.push({ name: v.name, cause: v.deathCause || 'unknown', day: W.day });
          }
        }
      }
      log(nanTicks === 0, 'trace72: zero NaN positions across 72 one-hour ticks',
        'nanTicks=' + nanTicks + ' villagers=[' + nanVillagers.join(',') + ']');
      const dehy = deaths.filter(d => d.cause === 'dehydration');
      const exh = deaths.filter(d => d.cause === 'collapse from exhaustion');
      log(dehy.length === 0, 'trace72: zero dehydration deaths', 'dehydration=' + dehy.length);
      log(exh.length === 0, 'trace72: zero collapse-from-exhaustion deaths', 'exhaustion=' + exh.length);
      const byCause = {};
      for (const d of deaths) byCause[d.cause] = (byCause[d.cause] || 0) + 1;
      lines.push('INFO | deaths by cause over 72h: ' + JSON.stringify(byCause) +
        ' (started ' + startCount + ' villagers, ended ' + VILLAGERS.filter(v => !v.dead).length + ' alive)');
      const passed = lines.filter(l => l.indexOf('PASS') === 0).length;
      lines.push('==== trace72 ' + passed + '/3 passed ====');
    } catch (e) {
      lines.push('FAIL | trace72: driver error — ' + String(e && e.message));
    }
    return lines.join('\\n');
  };
})();
`;

try {
  eval(m[1] + traceDriver);
} catch (e) {
  console.error('PAGE LOAD FAILED:', e.message);
  process.exit(2);
}

(async () => {
  await domReadyCb();           // boot the live world first
  const txt = global.window.__runTrace72();  // then run the 72h trace
  console.log(txt);
  const fails = txt.split('\n').filter(l => l.startsWith('FAIL')).length;
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error('TRACE FAILED:', e.message); process.exit(2); });
