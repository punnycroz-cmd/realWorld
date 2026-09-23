'use strict';
// v7 debugging probe — wraps bus entry points BEFORE the suite runs and
// records a call trace, then dumps the relevant slices at the end.
const fs = require('fs');
const path = require('path');
const page = process.env.GS_TEST_HTML ||
  path.join(__dirname, '..', 'willowbrook_natura_test.html');
const html = fs.readFileSync(page, 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
const pageJS = m[1];

const PROBE = `
;globalThis.__trace = [];
(function(){
  const T = globalThis.__trace;
  const _sub = gsSubmitRequest;
  gsSubmitRequest = function(spec, nowMin){
    const r = _sub(spec, nowMin);
    T.push({ fn:'submit', pid: spec && spec.playerId, kind: spec && spec.kind,
      target: spec && spec.target, note: (spec && (spec.note || (spec.params||{}).note || (spec.params||{}).name)) || '',
      now: nowMin, status: r && r.status, reason: r && r.reason,
      screen: r && r.screen, lane: r && r.lane, id: r && r.id,
      hired: Object.keys(GS_HIRED).length,
      billed: r && r.billed });
    return r;
  };
  const _res = gsReviewResolve;
  gsReviewResolve = function(id, approve, opts){
    const r = _res(id, approve, opts);
    T.push({ fn:'resolve', id: id, approve: approve, by: opts && opts.by,
      now: opts && opts.nowMin, status: r && r.status, reason: r && r.reason,
      error: r && r.error });
    return r;
  };
  const _bump = gsFlagBump;
  gsFlagBump = function(pid, w, code, now){
    const r = _bump(pid, w, code, now);
    T.push({ fn:'flag', pid: pid, w: w, code: code, now: now,
      score: GS_FLAGS[pid] && GS_FLAGS[pid].score });
    return r;
  };
  const _mark = gsMarkHired;
  gsMarkHired = function(cid, pid, o){
    const r = _mark(cid, pid, o);
    T.push({ fn:'mark', cid: cid, pid: pid, hired: Object.keys(GS_HIRED).length });
    return r;
  };
  const _rel = gsReleaseHired;
  gsReleaseHired = function(cid, why){
    const r = _rel(cid, why);
    T.push({ fn:'release', cid: cid, ok: r, hired: Object.keys(GS_HIRED).length });
    return r;
  };
})();
globalThis.__probe = function(){
  const T = globalThis.__trace;
  const out = [];
  const p = (...a) => out.push(a.join(' '));
  p('== sT trace slice ==');
  for (const t of T) if (t.pid === 'sT' || t.cid === 'H64' || t.cid === 'H65') p(JSON.stringify(t));
  p('== sB trace slice (50600..50800) ==');
  for (const t of T) if (t.now >= 50600 && t.now <= 50800) p(JSON.stringify(t));
  p('== mark/release tail (hired count) ==');
  for (const t of T) if ((t.fn === 'mark' || t.fn === 'release')) p(JSON.stringify(t));
  p('== resolve calls 62300..63300 ==');
  for (const t of T) if (t.fn !== 'submit' && t.now >= 62300 && t.now <= 63300) p(JSON.stringify(t));
  p('== flag bumps ==');
  for (const t of T) if (t.fn === 'flag') p(JSON.stringify(t));
  return out.join('\\n');
};`;

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
global.location = { search: process.env.GS_TEST_QUERY || '?test' };
global.requestAnimationFrame = () => 0;
try { global.navigator = { userAgent: 'node' }; } catch (e) {}
eval(pageJS + PROBE);
(async () => {
  try { await domReadyCb(); } catch (e) { console.error('BOOT FAILED', e); process.exit(2); }
  await new Promise(r => setTimeout(r, 3000));
  console.log(globalThis.__probe());
  process.exit(0);
})();
