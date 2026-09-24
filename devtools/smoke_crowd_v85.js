// v85 smoke — crowd.html "the company & the courtesy layer" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_crowd_v85.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/crowd.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.goto(URL);
  await pg.waitForSelector('#zones .zone', { timeout: 10000 });

  // company layer mirrors + resolution
  ok('GMIX mirrors group_profile shape', await pg.evaluate(() =>
    GMIX.kind && GMIX.dp && GMIX.fam && Object.keys(GMIX.kind).length === 7 && Object.keys(GMIX.dp).length === 9));
  ok('groupMix normalizes to 1', await pg.evaluate(() => {
    const m = groupMix('open_air', 'afternoon');
    return Math.abs(m.lone + m.duo + m.cluster - 1) < 1e-9;
  }));
  ok('overnight is lone-only', await pg.evaluate(() =>
    groupMix('bar', 'overnight').lone === 1 && groupMix('cafe', 'predawn').cluster === 0));
  ok('daypart shifts the mix', await pg.evaluate(() =>
    groupMix('open_air', 'commute').lone > groupMix('open_air', 'evening').lone));

  // company panel renders for selected zone
  ok('company panel shows resolved mix', await pg.evaluate(() =>
    /lone \d+% · duo \d+% · cluster \d+%/.test(document.getElementById('company').innerHTML)));
  ok('company panel states the unit rule', await pg.evaluate(() =>
    /units \(/.test(document.getElementById('company').innerHTML) &&
    /never reports/.test(document.getElementById('company').innerHTML)));

  // family safeguards render in the panel
  const famLine = await pg.evaluate(() => {
    S.sel = 'park'; S.h = 16; render();
    const park = document.getElementById('company').innerHTML;
    S.sel = 'club600'; S.h = 22; render();
    const bar = document.getElementById('company').innerHTML;
    return park.includes('family share') && bar.includes('family clusters not legal here');
  });
  ok('family share gated on kind + daypart', famLine);

  // courtesies mirror + conditions
  ok('17 courtesy beats mirrored', await pg.evaluate(() => COURTESY.length === 17));
  ok('no minor staffs a beat', await pg.evaluate(() =>
    COURTESY.every(c => c.amb !== 'A04' && c.amb !== 'A20')));
  ok('courtesies panel renders all beats', await pg.evaluate(() =>
    document.getElementById('courtesies').querySelectorAll('.scene').length === 17));
  ok('courtesy conditions resolve', await pg.evaluate(() => {
    S.h = 8.5; S.wx = 'clear'; S.ev = 'none'; S.shade = 'none'; S.annual = 'none'; S.day = 'weekday'; render();
    const live = COURTESY.filter(c => courtesyState(c)[0] !== 'off');
    return live.length > 0 && live.some(c => c.id === 'ctr-cup');
  }));
  ok('venue lock suppresses mudhaus beats', await pg.evaluate(() => {
    S.h = 9; S.ev = 'lock';
    const r = ['ctr-cup', 'ctr-outlet', 'ctr-door'].map(id =>
      courtesyState(COURTESY.find(c => c.id === id)));
    S.ev = 'none'; render();
    return r[0][0] === 'off' && r[1][0] === 'off';
  }));
  ok('off beats explain themselves', await pg.evaluate(() => {
    const html = document.getElementById('courtesies').innerHTML;
    return /ctr-/.test(html) && document.getElementById('courtesies').querySelectorAll('.why').length === 17;
  }));

  // rules list carries the new bounds
  ok('rules list states the company + courtesy bounds', await pg.evaluate(() => {
    const t = document.body.innerText;
    return /Extras arrive with company/.test(t) && /Courtesies are conditions/.test(t) &&
      /never lone, never bars, never overnight/.test(t);
  }));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAIL` : '\nall pass');
  process.exit(fails.length ? 1 : 0);
})();
