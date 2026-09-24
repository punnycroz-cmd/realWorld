// v90 smoke — archive.html "the real archive seam" in headless chromium.
// Stubs __aiBridge with the game-v14 wire-archive shape (gsWireDays day
// keys + gsWireArchiveDay day-objects; entries {id,n,t,day,kind,text,
// venue,who,req,status,reason_code,attempt,mentions,attrs}) and checks
// the page reads them as the bus wrote them: id→day index for w- ids,
// person index from mentions, attempt on denied rows, honest kind
// growth, and the manual catch-up merge.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_archive_v90.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/archive.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.addInitScript(() => {
    /* live shape per 41_game_systems_feed: t = block-time minutes,
       day = PT date string, who = player handle, mentions = char ids */
    const DAYS = {
      '2026-09-22': [
        { id: 'd0922-0004', n: 4, t: 620, day: '2026-09-22', kind: 'housing',
          text: 'Listed — 9457 Guerrero St, Unit 2 (studio)', who: 'leaf' },
        { id: 'd0922-0009', n: 9, t: 730, day: '2026-09-22', kind: 'request',
          req: 'rq-70', who: 'ghostline', status: 'not approved',
          attempt: 'possess', reason_code: 'possession-scope',
          text: 'request not approved' }
      ],
      '2026-09-23': [
        { id: 'd0923-0012', n: 12, t: 660, day: '2026-09-23', kind: 'request',
          req: 'rq-80', who: 'dvh', status: 'queued',
          text: 'event — a birthday window at The 600 Club — in line (#1)',
          venue: 'club600', mentions: ['h01'], attrs: { credits: 178 } },
        { id: 'd0923-0013', n: 13, t: 660, day: '2026-09-23', kind: 'request',
          req: 'rq-80', who: 'dvh', status: 'running',
          text: 'event — a birthday window at The 600 Club',
          venue: 'club600', mentions: ['h01'] },
        { id: 'w-0017', n: 17, t: 700, day: '2026-09-23', kind: 'cast',
          text: 'a new face on the block — Nico joins the cast',
          who: 'juno_', mentions: ['h02'] },
        { id: 'd0923-0021', n: 21, t: 745, day: '2026-09-23', kind: 'request',
          req: 'rq-81', who: 'okfm', status: 'player session ended',
          text: 'Nico is back on their own two feet',
          mentions: ['h02'] }
      ]
    };
    window.__late = false;
    window.__aiBridge = {
      gsWireDays: () => Object.keys(DAYS),
      gsWireArchiveDay: (d) => {
        const evs = DAYS[d].slice();
        if (window.__late && d === '2026-09-23')
          evs.push({ id: 'd0923-0030', n: 30, t: 800, day: '2026-09-23',
            kind: 'quiet', venue: 'block',
            text: 'a quiet stretch on the block — the feed says so' });
        return { day: d, events: evs };
      }
    };
  });

  const dayRow = (frag) => pg.evaluate((f) => {
    const r = [...document.querySelectorAll('#daylist .drow')].find(x => x.textContent.includes(f));
    if (r) { r.click(); return true; } return false;
  }, frag);
  const clickRow = (frag) => pg.evaluate((f) => {
    const r = [...document.querySelectorAll('#evs li.ev')].find(x => x.textContent.includes(f));
    if (r) { r.click(); return true; } return false;
  }, frag);
  const body = () => pg.evaluate(() => document.getElementById('viewBody').textContent);
  const det = () => pg.evaluate(() => document.getElementById('detBody').textContent);

  await pg.goto(URL);
  await pg.waitForTimeout(400);

  ok('badge reads live archive (demo never impersonates live)', await pg.evaluate(() =>
    document.getElementById('srcBadge').textContent === 'live archive'));

  ok('live days on record, not the demo week', await pg.evaluate(() =>
    document.getElementById('daylist').textContent.includes('09-23') &&
    !document.getElementById('daylist').textContent.includes('09-17')));

  ok('today flagged and capped (still being written)', (await body()).includes('still being written'));

  ok('same-minute rows keep bus order via n tiebreak (queued then running)', await pg.evaluate(() => {
    const rows = [...document.querySelectorAll('#evs li.ev')];
    const i1 = rows.findIndex(r => r.textContent.includes('in line'));
    const i2 = rows.findIndex(r => r.textContent.includes('birthday window') && !r.textContent.includes('in line'));
    return i1 >= 0 && i2 === i1 + 1;
  }));

  ok('player session ended renders as a canonical status', await pg.evaluate(() =>
    document.querySelector('#evs .st.player_session_ended') !== null &&
    document.getElementById('viewBody').textContent.includes('player session ended')));

  await dayRow('09-22');
  ok('denied row shows attempt class, never screened text', (await body()).includes('asked for — possess') &&
    (await body()).includes('request not approved'));

  await clickRow('not approved');
  ok('denied record detail: attempt + why-class, no authored text', (await det()).includes('asked for —') &&
    (await det()).includes('possession-scope') && (await det()).includes('player:'));

  await dayRow('09-23');
  await clickRow('new face');
  ok('w- id (no day prefix) resolves through the id→day index', (await det()).includes('a new face on the block') &&
    (await det()).includes('w-0017') && (await det()).includes('09/23'));

  ok('person index picks up mentions-only live ids (h01, h02)', await pg.evaluate(() => {
    const opts = [...document.getElementById('pickWho').options].map(o => o.value);
    return opts.includes('h01') && opts.includes('h02') && opts.includes('C1');
  }));

  ok('player handles stay out of the person index', await pg.evaluate(() =>
    ![...document.getElementById('pickWho').options].some(o => o.value === 'ghostline' || o.value === 'dvh')));

  ok('person trail works for a live id (h02: 2 sightings)', await pg.evaluate(() => {
    document.querySelector('.vchip[data-v="person"]').click();
    const sel = document.getElementById('pickWho');
    sel.value = 'h02'; sel.onchange();
    return document.getElementById('viewBody').textContent.includes('2 sightings');
  }));

  ok('live-only kind earns its own chip (cast — counted, not interpreted)', await pg.evaluate(() => {
    document.querySelector('.vchip[data-v="day"]').click();
    const c = [...document.querySelectorAll('#kinds .chip')].find(x => x.dataset.k === 'cast');
    return c && /counted, not interpreted/.test(c.title);
  }));

  ok('cast chip filters honestly (1 cast row, rest hidden)', await pg.evaluate(() => {
    [...document.querySelectorAll('#kinds .chip')].find(x => x.dataset.k === 'cast').click();
    const rows = [...document.querySelectorAll('#evs li.ev')];
    return rows.length === 1 && rows[0].textContent.includes('new face');
  }));

  await pg.evaluate(() =>
    [...document.querySelectorAll('#kinds .chip')].find(x => x.dataset.k === 'all').click());
  await clickRow('in line');
  ok('request lifecycle trail groups by req across statuses', await pg.evaluate(() => {
    const d = document.getElementById('detBody');
    if (!d.textContent.includes('this request')) return false;
    /* the req trail lists this request's own status rows (queued + running);
       'around that time' shares the .trail class, so match on content */
    const items = [...d.querySelectorAll('.trail li')].map(li => li.textContent);
    return items.some(t => t.includes('queued')) && items.some(t => t.includes('running'));
  }));

  ok('catch up button exists on today, live only', await pg.evaluate(() =>
    document.getElementById('catchup') !== null));

  ok('catch up merges new rows by id and reports the count', await pg.evaluate(async () => {
    window.__late = true;
    document.getElementById('catchup').click();
    await new Promise(r => setTimeout(r, 60));
    return document.getElementById('toast').textContent.includes('1 new line') &&
      document.getElementById('viewBody').textContent.includes('a quiet stretch on the block');
  }));

  ok('second catch up is honest about being current', await pg.evaluate(async () => {
    document.getElementById('catchup').click();
    await new Promise(r => setTimeout(r, 60));
    return document.getElementById('toast').textContent.includes('already current');
  }));

  /* ---- bare page: demo fallback untouched ---- */
  const pg2 = await br.newPage({ viewport: { width: 1400, height: 900 } });
  await pg2.goto(URL);
  await pg2.waitForTimeout(400);
  ok('bare page: demo badge + demo week intact', await pg2.evaluate(() =>
    document.getElementById('srcBadge').textContent === 'demo archive' &&
    document.getElementById('daylist').textContent.includes('09-17')));
  ok('bare page: no catch-up button in demo mode', await pg2.evaluate(() =>
    document.getElementById('catchup') === null));

  const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.reload(); await pg.waitForTimeout(400);
  ok('no page errors on live load', errs.length === 0);

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAIL` : '\nall green');
  process.exit(fails.length ? 1 : 0);
})();
