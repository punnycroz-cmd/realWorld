// v79 smoke — playtest.html "the relay & regression layer" (harness v76) in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_pt_v79.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/playtest.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  // capture clipboard writes (file:// has no real clipboard)
  await pg.addInitScript(() => {
    window.__clips = [];
    navigator.clipboard.writeText = t => { window.__clips.push(t); return Promise.resolve(); };
  });
  await pg.goto(URL);
  await pg.waitForSelector('.pt', { timeout: 10000 });

  // build + storage key
  ok('LS key v76 + build tag', await pg.evaluate(() => LS === 'rw_playtest_v76' && BUILD === 'world v76 local'));

  // revisit flag: toggle without picking, persist across reload
  const firstId = await pg.$eval('.pt', e => e.querySelector('b').textContent.split(' ')[0]);
  await pg.click('.pt .flag');
  ok('flag toggles without picking', await pg.evaluate(() => S.cur === null && Object.keys(S.flags).length === 1));
  ok('flag persisted to LS', await pg.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('rw_playtest_v76')).flags).length === 1));
  await pg.reload(); await pg.waitForSelector('.pt');
  ok('flag survives reload', await pg.evaluate(() => Object.keys(S.flags).length === 1));

  // handoff carries flagged ids
  await pg.click('#exHandoff');
  ok('handoff lists flagged for revisit', await pg.evaluate(() => window.__clips.at(-1).includes('flagged for revisit')));

  // run sheet: header + checkbox lines, honors smoke filter
  await pg.click('#exSheet');
  let sheet = await pg.evaluate(() => window.__clips.at(-1));
  ok('run sheet block', /## \[world-playtest-runsheet/.test(sheet) && sheet.includes('world v76 local'));
  ok('run sheet has checkbox lines', sheet.includes('- [ ] step 1:') && (sheet.match(/^  - \[ \]/gm) || []).length > 800);
  ok('run sheet covers all 72', (sheet.match(/^### PT/gm) || []).length === 72);
  await pg.click('#smk');
  await pg.click('#exSheet');
  sheet = await pg.evaluate(() => window.__clips.at(-1));
  ok('run sheet narrows to smoke set', (sheet.match(/^### PT/gm) || []).length === 4 && sheet.includes('PT1 — '));
  ok('run sheet carries no verdicts', !/- \[(?! \])/.test(sheet));
  await pg.click('#smk'); // uncheck

  // regression view: imported pass + current fail => regressed
  await pg.evaluate(() => {
    pick('PT1');
    setCk('PT1-0-0', 'fail');
    S.cohort.push({ session: { tester: 'prior', role: 'player' }, results: [{ ref: 'PT1-0-0', verdict: 'pass' }], findings: [] });
    renderCohort();
  });
  ok('regressed ref listed', await pg.$eval('#regr', e => /PT1-0-0/.test(e.textContent) && /regressed/.test(e.textContent) && /was pass, now fail/.test(e.textContent)));
  // flip to pass with an imported fail verdict => recovered
  await pg.evaluate(() => {
    S.cohort.push({ session: { tester: 'older', role: 'player' }, results: [{ ref: 'PT1-0-0', verdict: 'fail' }], findings: [] });
    setCk('PT1-0-0', 'pass'); // fail -> pass (toggle clears, then sets)
    if (S.ck['PT1-0-0'].v !== 'pass') setCk('PT1-0-0', 'pass');
    renderCohort();
  });
  ok('recovered ref listed', await pg.$eval('#regr', e => /PT1-0-0/.test(e.textContent) && /recovered/.test(e.textContent) && /was fail, now pass/.test(e.textContent)));
  // markdown cohort carries the split
  await pg.click('#exMd');
  ok('md export carries recovered line', await pg.evaluate(() => window.__clips.at(-1).includes('recovered (was fail, now pass): PT1-0-0')));

  // walk honors hide-finished: verdict every checkpoint of PT1, then walk from PT1
  await pg.evaluate(() => { ckKeys(PTS.find(p => p.id === 'PT1')).forEach(k => { S.ck[k] = { v: 'pass' }; }); S.hideDone = true; save(); renderList(); });
  ok('PT1 hidden when finished+filtered', await pg.evaluate(() => ![...document.querySelectorAll('#ptList .pt b')].some(b => /^PT1 —/.test(b.textContent))));
  await pg.evaluate(() => pick('PT2'));
  await pg.keyboard.press(']');
  ok('walk skips finished PT1', await pg.evaluate(() => S.cur === 'PT3' && location.hash === '#pt=PT3'));

  // reset restores flags clean
  pg.on('dialog', d => d.accept());
  await pg.click('#reset');
  await pg.waitForSelector('.pt');
  ok('reset clears flags', await pg.evaluate(() => Object.keys(S.flags).length === 0));

  await br.close();
  if (fails.length) { console.log('FAILURES:', fails.join(', ')); process.exit(1); }
  console.log('ALL PASS');
})().catch(e => { console.error(e); process.exit(1); });
