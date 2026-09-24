// v87 smoke — commute.html "The Getting There" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_commute_v87.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/commute.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.goto(URL);
  await pg.waitForSelector('#routes .card', { timeout: 10000 });

  // mirror + counts
  ok('COM mirrors commute-v87', await pg.evaluate(() =>
    COM.version === 87 && COM.schema === 'commute-v1' && COM.routes.length === 22 && COM.overlaps.length === 10));
  ok('22 route cards render', await pg.evaluate(() =>
    document.querySelectorAll('#routes .card').length === 22));

  // wednesday dawn: Hana already at work before anyone else leaves
  ok('wednesday 05:00 — hana at work, nobody else on the road yet', await pg.evaluate(() => {
    S.day = 'wed'; S.h = 5; render();
    const cards = [...document.querySelectorAll('#routes .card')];
    const hana = cards.find(c => c.querySelector('b').textContent === 'a16-hana');
    return hana && hana.querySelector('.st').textContent.includes('at work')
      && cards.filter(c => c.classList.contains('road')).length === 0;
  }));
  ok('victor commutes by stairs', await pg.evaluate(() =>
    COM.routes.find(r => r.who === 'c7-victor').mode === 'stairs'));

  // overlap windows open only on shared days inside the window
  ok('monday — barista overlap open at 07:15, hospital pair at 06:45', await pg.evaluate(() => {
    const grab = () => [...document.querySelectorAll('#ovls .ov.open')].map(x => x.textContent).join('|');
    S.day = 'mon'; S.h = 7.25; render();
    const a = grab();
    S.h = 6.5; render();
    const b = grab();
    return a.includes('c2-jules') && !a.includes('a09-asha') && b.includes('c4-priya');
  }));
  ok('tuesday — priya×asha overlap stays shut (asha off)', await pg.evaluate(() => {
    S.day = 'tue'; S.h = 6.5; render();
    const open = [...document.querySelectorAll('#ovls .ov.open')].map(x => x.textContent).join('|');
    return !open.includes('a09-asha');
  }));
  ok('overlaps declare permission-not-event', await pg.evaluate(() =>
    document.getElementById('ovls').innerHTML.includes('a permission, not an event')));

  // weather deltas surface per route
  ok('rain toggle shows priya\u2019s 48 swap', await pg.evaluate(() => {
    S.day = 'mon'; S.h = 6.5; S.w = 'rain'; render();
    const c = [...document.querySelectorAll('#routes .card')].find(x => x.querySelector('b').textContent === 'c4-priya');
    return c && c.querySelector('.wx').textContent.includes('48');
  }));
  ok('wind toggle shows sam\u2019s lighter repertoire', await pg.evaluate(() => {
    S.w = 'wind'; S.day = 'sat'; render();
    const c = [...document.querySelectorAll('#routes .card')].find(x => x.querySelector('b').textContent === 'a08-sam');
    return c && c.querySelector('.wx') && c.querySelector('.wx').textContent.includes('repertoire');
  }));

  // off days dim; sunday drops reyes
  ok('sunday — reyes card reads off day', await pg.evaluate(() => {
    S.day = 'sun'; S.w = 'clear'; render();
    const c = [...document.querySelectorAll('#routes .card')].find(x => x.querySelector('b').textContent === 'a01-reyes');
    return c && c.classList.contains('offday');
  }));

  // minors never routed; non-commuters declared
  ok('no june/zee route cards (minors unrouted)', await pg.evaluate(() =>
    !COM.routes.some(r => /a04|a20/.test(r.who)) && COM.non_commuters.length === 4));
  ok('building pulse: 9102 Mission never empties', await pg.evaluate(() =>
    document.getElementById('pulse').textContent.includes('bld-m9102 · never empties')));

  // texture anonymity + rules contracts rendered
  ok('street texture is anonymous (no cast tokens)', await pg.evaluate(() =>
    !/\b[ca]\d{1,2}-[a-z]+\b/i.test(document.getElementById('tex').textContent)));
  ok('rules state conditions-not-scripts + no prices', await pg.evaluate(() => {
    const t = document.getElementById('rules').textContent;
    return /never scripts/i.test(t) && /no prices/i.test(t);
  }));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAIL` : '\nALL PASS');
  process.exit(fails.length ? 1 : 0);
})();
