'use strict';
// Examiner's independent Node harness for willowbrook_natura ?test suite.
// Stubs the DOM/canvas/window surface the page needs, loads the bundled page
// JS, fires DOMContentLoaded, and reports the autotest results.
const fs = require('fs');
const path = '/home/hatch/workspace/world-sim/willowbrook_natura_test.html';
const html = fs.readFileSync(path, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }
const pageJS = m[1];

// ---- canvas 2d context stub: absorbs everything, returns plausible values ----
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

// ---- globals ----
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
global.location = { search: '?test' };
global.requestAnimationFrame = () => 0;   // do not run the render loop
try { global.navigator = { userAgent: 'node' }; } catch (e) {}

// ---- load page JS ----
try {
  eval(pageJS);
} catch (e) {
  console.error('PAGE LOAD FAILED:', e.message);
  console.error(e.stack.split('\n').slice(0, 6).join('\n'));
  process.exit(2);
}
if (typeof domReadyCb !== 'function') { console.error('NO DOMContentLoaded HANDLER'); process.exit(2); }

// ---- fire boot (?test path runs runAutoTest) ----
(async () => {
  try { await domReadyCb(); } catch (e) {
    console.error('BOOT FAILED:', e.message);
    console.error(e.stack.split('\n').slice(0, 8).join('\n'));
    process.exit(2);
  }
  // runAutoTest is async with internal setTimeout; wait for completion
  await new Promise(r => setTimeout(r, 3000));
  const out = autotestEl.textContent;
  const lines = out.split('\n').filter(l => l.trim());
  const fails = lines.filter(l => l.startsWith('FAIL'));
  const summaries = lines.filter(l => l.includes('passed ===='));
  console.log('--- summaries ---');
  summaries.forEach(s => console.log(s.trim()));
  console.log('--- totals ---');
  console.log('total lines:', lines.length, '| FAIL lines:', fails.length);
  fails.slice(0, 20).forEach(f => console.log(f));
  process.exit(fails.length ? 1 : 0);
})();
