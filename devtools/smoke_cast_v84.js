// v84 smoke — cast.html "the listening / day-off / repairs layer" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_cast_v84.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/cast.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.goto(URL);
  await pg.waitForSelector('.who', { timeout: 10000 });

  // CAST carries the v84 fields on all 8 cards
  ok('8 cards', await pg.evaluate(() => CAST.length === 8));
  ok('v84 fields present on every card', await pg.evaluate(() =>
    CAST.every(c => c.lst && c.offd && c.rpr)));
  ok('v84 fields carry no seed/meta vocabulary', await pg.evaluate(() =>
    CAST.every(c => !/secret|seed|briefing|never tell/i.test(c.lst + c.offd + c.rpr))));

  // card 1 renders the new rows
  ok('How they listen row', await pg.evaluate(() => /How they listen/.test(document.getElementById('card').innerHTML)));
  ok('The day off row', await pg.evaluate(() => /The day off/.test(document.getElementById('card').innerHTML)));
  ok('Repairs row', await pg.evaluate(() => /How they say sorry/.test(document.getElementById('card').innerHTML)));
  ok('C1 listen text renders', await pg.evaluate(() => /stopped rag/.test(document.getElementById('card').innerHTML)));

  // walk the rail — every card renders its three new fields
  const railOk = await pg.evaluate(async () => {
    for (const c of CAST) {
      render(c);
      const h = document.getElementById('card').innerHTML;
      if (!h.includes(c.lst.slice(0, 20))) return 'lst ' + c.id;
      if (!h.includes(c.offd.slice(0, 20))) return 'offd ' + c.id;
      if (!h.includes(c.rpr.slice(0, 20))) return 'rpr ' + c.id;
    }
    return true;
  });
  ok('all 8 cards render lst/offd/rpr', railOk === true || console.log('   (' + railOk + ')'));

  // locked panel still last — no secret text on any card
  ok('locked panel present', await pg.evaluate(() => /The rest is theirs/.test(document.getElementById('card').innerHTML)));
  ok('no seed words on cards', await pg.evaluate(() =>
    CAST.every(c => !/detonating|money bomb|La Esperanza|unfiltered/i.test(JSON.stringify(c)))));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAIL` : '\nall pass');
  process.exit(fails.length ? 1 : 0);
})();
