// v77 smoke — create.html "the sketch & the seats" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_create_v77.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/create.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1280, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.goto(URL);
  await pg.waitForSelector('#wizard h2', { timeout: 10000 });
  ok('wizard renders', await pg.$eval('#wizard h2', e => /Who arrives/.test(e.textContent)));
  ok('seats line', await pg.$eval('#seatLine', e => /the card holds/.test(e.textContent) && /of 12 hired faces/.test(e.textContent)));

  // step 1 — fill name/age/arrival
  await pg.fill('#cname', 'Rio Takemura');
  await pg.fill('#carr', 'off the bus with a duffel and a folder of resumes');
  await pg.click('#next');

  // step 2 — bio + look picks + sketch
  await pg.waitForSelector('#sketch');
  ok('empty sketch caption', await pg.$eval('.sketchwrap .cap', e => /casting-office sketch/.test(e.textContent)));
  await pg.fill('#cbio', 'quiet, stubborn, laughs at the wrong moments');
  await pg.click('#pbuild .pick[data-v="tall"]');
  await pg.waitForSelector('#psig');
  await pg.click('.sw[data-v="mission mural"]');
  await pg.click('.pick[data-v="denim jacket, pins on the collar"]');
  const drawn = await pg.$eval('#sketch', cv => {
    const g = cv.getContext('2d'); const d = g.getImageData(0, 0, cv.width, cv.height).data;
    let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && (d[i] !== 0x2a || d[i + 1] !== 0x31)) n++;
    return n;
  });
  ok('sketch drawn (non-bg pixels)', drawn > 400);
  await pg.click('#next');

  // step 3 — job
  await pg.click('.opt[data-job="mudhaus-barista"]');
  await pg.click('#next');
  // step 4 — home
  await pg.click('.opt[data-home="c9127-A"]');
  await pg.click('#next');
  // step 5 — rhythm
  await pg.waitForSelector('.week');
  ok('first week renders', await pg.$eval('.week', e => /PAYDAY/.test(e.textContent)));
  await pg.click('#next');

  // step 6 — quote + sketch6 + seats remain
  await pg.waitForSelector('#sketch6');
  ok('review sketch canvas', !!(await pg.$('#sketch6')));
  ok('seats line on quote', await pg.$eval('.quote', e => /of 12 hired faces — seats remain/.test(e.textContent)));
  ok('other-hire honesty', await pg.$eval('#wizard', e => /stranger to/.test(e.textContent) && /meet on the block like anyone else/.test(e.textContent)));
  ok('sign CTA normal', await pg.$eval('#next', e => /Sign & hire — 500 cr/.test(e.textContent)));

  // fill the card -> waitlist path
  await pg.click('#seatdemo');
  await pg.waitForFunction(() => document.querySelector('#next').textContent.includes('waitlist'));
  ok('waitlist CTA when full', await pg.$eval('#next', e => /Join the seat waitlist — free/.test(e.textContent)));
  await pg.click('#next');
  await pg.waitForSelector('.queue h3', { timeout: 5000 });
  ok('wait card', await pg.$eval('.queue h3', e => /Seat waitlist — in line, not in review/.test(e.textContent)));
  ok('never bills while waiting', await pg.$eval('.queue', e => /never bills until you take it/.test(e.textContent) && /48 h/.test(e.textContent) && /no way to pay for a sooner seat/.test(e.textContent)));
  ok('wait persisted', await pg.evaluate(() => !!localStorage.getItem('rw_create_wait_v25')));

  // reload -> wait card restores
  await pg.reload();
  await pg.waitForSelector('.queue h3', { timeout: 5000 });
  ok('waitlist survives reload', await pg.$eval('.queue h3', e => /Seat waitlist/.test(e.textContent)));

  // leave -> feed line, draft back at step 6
  await pg.click('#leavewait');
  await pg.waitForSelector('#wizard h2', { timeout: 5000 });
  ok('leave posts feed', await pg.$eval('#feed', e => /left the seat waitlist/.test(e.textContent)));
  ok('wait key cleared', await pg.evaluate(() => !localStorage.getItem('rw_create_wait_v25')));

  // normal hire path — reload reset the demo toggle, card already has seats
  await pg.waitForFunction(() => /Sign & hire/.test(document.querySelector('#next').textContent));
  await pg.click('#next');
  await pg.waitForSelector('.briefing', { timeout: 30000, state: 'visible' });
  ok('briefing renders', await pg.$eval('#briefing', e => /Possession briefing/.test(e.textContent) && /a stranger, not a contact/.test(e.textContent)));
  ok('keys card', await pg.$eval('#keys', e => /Day one — the keys/.test(e.textContent)));
  ok('registry entry', await pg.$eval('#record', e => /Registry entry — h/.test(e.textContent)));
  ok('no secrets on file', await pg.$eval('#record', e => /no secret fields exist on it/i.test(e.textContent)));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAIL` : '\nALL PASS');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
