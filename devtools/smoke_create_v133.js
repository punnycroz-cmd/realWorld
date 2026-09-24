// v133 smoke — create.html "the carried-in layer" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_create_v133.js
// Drives the wizard to step 5: the HOURS row must render the picked job's
// honest time cost, the HOPES pick must write the no-promise honesty note,
// and after the demo hire resolves the "Carried in"/"CARRIED IN" lines
// must land on the quote, keys card, and registry entry.
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/create.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };
  const pg = await br.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto(URL);
  await pg.waitForSelector('#wizard h2', { timeout: 10000 });

  /* steps 1–4 — a real pick set (Mudhaus barista, 30–38 h/wk) */
  await pg.fill('#cname', 'Rio Takemura');
  await pg.fill('#carr', 'off the bus with a duffel and a folder of resumes');
  await pg.click('#next');
  await pg.fill('#cbio', 'quiet, stubborn, laughs at the wrong moments');
  await pg.click('#pbuild .pick[data-v="tall"]');
  await pg.click('.sw[data-v="mission mural"]');
  await pg.click('.pick[data-v="denim jacket, pins on the collar"]');
  await pg.click('#next');
  await pg.click('.opt[data-job="mudhaus-barista"]');
  await pg.click('#next');
  await pg.click('.opt[data-home="treat-room"]');
  await pg.click('#next');

  /* step 5 — the carried-in layer */
  await pg.waitForSelector('#phope');
  const week = await pg.$eval('#wizard .week', e => e.textContent);
  ok('HOURS row present', /HOURS/.test(week));
  ok('hours honest for a 30–38 card', /30–38 h of the week|30-38 h of the week/.test(week) && /thin ones, but theirs/.test(week));
  ok('hope picker defaults to arrives open', await pg.$eval('#phope .pick[data-h=""]', e => e.classList.contains('sel')));
  ok('open-arrival note honest', await pg.$eval('#wizard', e => /Arrives open — most people do/.test(e.textContent)));
  await pg.click('#phope .pick[data-h="crew"]');
  await pg.waitForSelector('#phope .pick[data-h="crew"].sel');
  const note = await pg.$eval('#wizard', e => e.textContent);
  ok('hope line renders', /a crew — the drum circle/.test(note));
  ok('no-promise honesty', /initial condition, not a promise/.test(note) && /nothing tracks the difference/.test(note));
  ok('named-face no-obligation honesty', /nobody was asked/.test(note));
  await pg.click('#phope .pick[data-h="good"]');
  const note2 = await pg.$eval('#wizard', e => e.textContent);
  ok('job-grounded hope has no named-face line', /good at the work/.test(note2) && !/nobody was asked/.test(note2.split('A hope is an initial')[1] || note2));
  await pg.click('#phope .pick[data-h="crew"]'); /* settle on crew for the tail */
  await pg.click('#next');

  /* step 6 — the quote carries it */
  const quote = await pg.$eval('#wizard', e => e.textContent);
  ok('quote carries "Carried in"', /Carried in/.test(quote) && /a crew — the drum circle/.test(quote));

  /* sign → demo approve → keys + record */
  await pg.click('#next');
  await pg.waitForSelector('#keys h3', { timeout: 30000 });
  const keys = await pg.$eval('#keys', e => e.textContent);
  const rec = await pg.$eval('#record', e => e.textContent);
  ok('keys card CARRIED IN line', /CARRIED IN/.test(keys) && /the block was never asked to deliver it/.test(keys));
  ok('registry carried-in row', /carried in/.test(rec) && /never a tracked goal/.test(rec));

  console.log(fails.length ? `FAILURES: ${fails.join(', ')}` : 'ALL PASS');
  await br.close();
  process.exit(fails.length ? 1 : 0);
})();
