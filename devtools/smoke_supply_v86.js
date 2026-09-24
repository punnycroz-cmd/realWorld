// v86 smoke — supply.html "The Back Door" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_supply_v86.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/supply.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.goto(URL);
  await pg.waitForSelector('#suppliers .scard', { timeout: 10000 });

  // mirror + counts
  ok('SUP mirrors supply-v86', await pg.evaluate(() =>
    SUP.version === 86 && Object.keys(SUP.suppliers).length === 19 && SUP.runs.length === 44));
  ok('19 supplier cards render', await pg.evaluate(() =>
    document.querySelectorAll('#suppliers .scard').length === 19));

  // door coverage: 19 fed + 1 exempt, 0 bare
  ok('coverage: 19 fed / 1 exempt / 0 bare', await pg.evaluate(() => {
    const d = [...document.querySelectorAll('#cov .door')];
    return d.filter(x => x.classList.contains('fed')).length === 19
      && d.filter(x => x.classList.contains('exempt')).length === 1
      && d.filter(x => x.classList.contains('bare')).length === 0;
  }));
  ok('valencia-growers is the exempt door', await pg.evaluate(() =>
    document.querySelector('#cov .door.exempt').textContent.includes('valencia-growers')));

  // Thursday is the busy day — keg drop + flyer circuit
  ok('thursday: keg drop + flyer circuit present', await pg.evaluate(() => {
    S.day = 'thu'; S.h = 15; render();
    const t = document.getElementById('runs').innerHTML;
    return t.includes('Fogline') && t.includes('The 600 Club') && t.includes('flyer circuit');
  }));
  ok('flyer circuit carries five stops', await pg.evaluate(() =>
    SUP.runs.find(r => r.supplier === 'hot-off-press' && r.to.length === 5).days.includes('thu')));

  // live state tracks the scrubbed clock
  ok('runs light OUT NOW inside their window', await pg.evaluate(() => {
    S.day = 'thu'; S.h = 15; render();
    return document.querySelectorAll('#runs .run.live').length > 0;
  }));
  ok('nothing runs on sunday for weekday-only venues', await pg.evaluate(() => {
    S.day = 'sun'; S.h = 8; render();
    return !document.getElementById('runs').innerHTML.includes('Folsom Auto');
  }));

  // window rule: every run lands inside [open-3h, close] on listed days
  ok('all runs satisfy the [open-3h, close] rule', await pg.evaluate(() =>
    SUP.runs.every(r => r.to.every(id => r.days.every(d => {
      const v = DOORS[id];
      const h = (v.hours || {})[['sat', 'sun'].includes(d) ? 'weekend' : 'weekday'];
      if (!h) return false;
      const dd = (v.hours || {}).days;
      if (dd && !dd.includes(d)) return false;
      return r.hours[1] >= h[0] - 3 && r.hours[0] <= h[1];
    })))));

  // feed shapes stay inside venue vocabulary
  ok('feed shapes are kind venue with {venue} tokens', await pg.evaluate(() =>
    SUP.feed_shapes.kind === 'venue' && SUP.feed_shapes.lines.every(l => l.includes('{venue}'))));

  // no cast ids, no prices anywhere in the layer
  ok('no cast ids or prices in supply copy', await pg.evaluate(() => {
    const t = JSON.stringify({ s: SUP.suppliers, r: SUP.runs });
    return !/\b[ca](?:[1-8]|0[1-9]|1[0-9]|20)\b/i.test(t) && !/\$\s?\d|\bcredit|\bUSD\b/i.test(t);
  }));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAIL` : '\nALL PASS');
  process.exit(fails.length ? 1 : 0);
})();
