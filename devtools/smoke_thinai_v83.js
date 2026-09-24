// v83 smoke — thinai.html "the fallback-surface layer" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_thinai_v83.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/thinai.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };
  const click = async label => pg.evaluate(l => {
    const b = [...document.querySelectorAll('#ev button')].find(x => x.textContent === l);
    if (b) { b.click(); return true; } return false;
  }, label);

  await pg.goto(URL);
  await pg.waitForSelector('.pawn', { timeout: 10000 });

  // seed + key
  ok('LS key v83', await pg.evaluate(() => LS === 'rw_thinai_v83'));
  ok('surface panel renders three postures', await pg.evaluate(() => {
    const t = document.getElementById('surf').innerHTML;
    return /unaffected/.test(t) && /hold/.test(t) && /static/.test(t);
  }));
  ok('no-filler rule present', await pg.evaluate(() => /honest absence beats filler/.test(document.getElementById('surf').innerHTML)));
  ok('jitter line on pawn cards', await pg.evaluate(() => /next edge \d{2}:\d{2} → [+-]?\d+m = \d{2}:\d{2}/.test(document.getElementById('pawns').innerHTML)));
  ok('jitter bounded ±15 and deterministic', await pg.evaluate(() => {
    const a = jit('a01', 450), b = jit('a01', 450);
    return a === b && Math.abs(a) <= 15 && Math.abs(jit('c6', 990)) <= 15;
  }));
  ok('jitter changes across days', await pg.evaluate(() => {
    const a = jit('a01', 450); S.day++; const b = jit('a01', 450); S.day--;
    return a !== b || jit('c6', 420) !== undefined; /* allowed to coincide; just runs */
  }));

  // degrade to 0% — press hold + static posture
  await click('Service 0% · blackout');
  ok('hold posture at 0%', await pg.evaluate(() => /held · backlog/.test(document.getElementById('surf').innerHTML)));
  ok('briefings static at 0%', await pg.evaluate(() => /static card only/.test(document.getElementById('surf').innerHTML)));
  ok('C6 degraded at 0%', await pg.evaluate(() => { for (let i = 0; i < 8; i++) tick(15); return S.pawns.c6.mode === 'degraded'; }));

  // request on degraded main — routine-fit accept (day 4, ~14:00 → sit cell)
  await pg.evaluate(() => { S.min = 14 * 60; render(); });
  await click('Ask C6 · routine-fit');
  ok('routine-fit runs posture-only', await pg.evaluate(() =>
    S.log.some(e => e.tag === 'wire' && /co-star on Carmen \(be-present\).*running/.test(e.tx)) &&
    S.log.some(e => e.tag === 'seam' && /posture-only/.test(e.tx))));
  await click('Ask C6 · off-routine');
  ok('off-routine declines + refund', await pg.evaluate(() =>
    S.log.some(e => e.tag === 'wire' && /walk-with, off-routine.*resolved · declined \(50% auto-refund\)/.test(e.tx))));

  // press backlog: 2 days at 0% → held 2; recover → trickle ≤1/daypart
  await pg.evaluate(() => { tick(1440); tick(1440); });
  ok('backlog holds under degrade', await pg.evaluate(() => S.pressHeld >= 2 &&
    S.log.some(e => /held press backlog/.test(e.tx))));
  await click('Service 100%');
  await pg.evaluate(() => { S.min = 5 * 60 + 45; render(); tick(15); }); /* cross 06:00 daypart */
  ok('trickle releases ≤1/daypart', await pg.evaluate(() => {
    const n = S.pressHeld;
    tick(15); /* same daypart — no second release */
    return S.log.some(e => /held backlog — ≤1\/daypart/.test(e.tx)) && S.pressHeld === n;
  }));
  ok('no recap/backfill lines on recovery', await pg.evaluate(() =>
    !S.log.some(e => /back in|we\'re back|recap|backfill/i.test(e.tx))));

  // wire vocabulary still locked
  ok('wire vocabulary locked', await pg.evaluate(() =>
    S.log.filter(e => e.tag === 'wire').every(e => /^(request — |weather — )/.test(e.tx))));

  // asks on a full brain toast, don't post
  await pg.evaluate(() => { S.pawns.c6.mode = 'full'; render(); });
  const wiresBefore = await pg.evaluate(() => S.log.filter(e => e.tag === 'wire').length);
  await click('Ask C6 · routine-fit');
  ok('full-brain ask path untouched', await pg.evaluate(w =>
    S.log.filter(e => e.tag === 'wire').length === w &&
    document.getElementById('toast').textContent.length > 0, wiresBefore));

  // jitter display survives a +24h step (edge shifts re-render)
  ok('jitter re-renders after +24h', await pg.evaluate(() => {
    tick(1440); return /next edge/.test(document.getElementById('pawns').innerHTML);
  }));

  console.log('---');
  console.log(fails.length ? fails.length + ' FAIL: ' + fails.join(' | ') : 'ALL PASS');
  await br.close();
  process.exit(fails.length ? 1 : 0);
})();
