// v88 smoke — request.html "the real bus seam" in headless chromium.
// Stubs __aiBridge before load with the game-v14 surface and checks that
// the page files on gsSubmitRequest, renders the board/booked reads, and
// never runs the local pipeline for a bus-denied filing.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_request_v88.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/request.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.addInitScript(() => {
    window.__calls = { submit: [], quote: 0, slots: 0, deny: false };
    window.__aiBridge = {
      gsViewerState: () => ({
        feed: [
          { id: 'bus-f1', t: '20:00', who: 'marina_w', text: 'weather — fog burn-off, 1 h', status: 'booked' },
          { id: 'bus-f2', t: '19:30', who: 'leaf', text: 'event — park cleanup', status: 'queued' }
        ],
        sessions: [{ claim: 'venue:club600', left_min: 20, who: 'dvh' }],
        board: {
          'venue:mudhaus': { res: 'venue:mudhaus', state: 'cool', leftMin: 15 },
          'openair': { res: 'openair', state: 'queued', depth: 2,
                       booked: [{ start: '22:00', who: 'leaf' }] }
        },
        calendar: [{ claim: 'sky', start_min: 1260, min: 60, who: 'leaf', what: 'bus window' }]
      }),
      gsSubmitRequest: (spec) => {
        window.__calls.submit.push(spec);
        return window.__calls.deny
          ? { id: 'req-99', status: 'denied', reason: 'cooldown' }
          : { id: 'req-42', status: 'booked' };
      },
      gsBookCalendar: () => [{ claim: 'sky', start: '23:30', min: 60, who: 'okfm', what: 'late fog' }],
      gsBookableSlots: (spec, n) => { window.__calls.slots++; return [45]; },  /* minutes-from-now */
      gsPriceQuote: (spec) => { window.__calls.quote++; return { ok: true, total: 99, surge: 1.5, wouldQueue: false }; },
      gsExplainRequest: (id) => ({ id: id, status: 'booked' })
    };
  });

  await pg.goto(URL);
  await pg.waitForSelector('#feed li', { timeout: 10000 });

  ok('badge flips to live on the stub bridge', await pg.evaluate(() =>
    document.getElementById('srcBadge').textContent.includes('live')));

  await pg.evaluate(() => livePoll());

  ok('bus feed ingests — booked status renders a booked chip', await pg.evaluate(() =>
    !!document.querySelector('#feed .st.booked') &&
    document.getElementById('feed').textContent.includes('marina_w')));

  ok('board read: mudhaus cools at 15 min, openair queues at depth 2', await pg.evaluate(() =>
    CLAIMS['venue:mudhaus'].state === 'cool' && CLAIMS['venue:mudhaus'].left === 15 &&
    CLAIMS['openair'].qa === 2));

  ok('board booked[] markers render on the claim note', await pg.evaluate(() =>
    (CLAIMS['openair'].note || '').includes('22:00') && CLAIMS['openair'].note.includes('leaf')));

  ok('gsBookCalendar windows join the picker avoidance set (23:30 sky)', await pg.evaluate(() =>
    BOOKW.some(w => w.claim === 'sky' && w.start === '23:30')));

  ok('sessions still drive locks (club600 locked by dvh, 20 left)', await pg.evaluate(() =>
    CLAIMS['venue:club600'].state === 'locked' && CLAIMS['venue:club600'].left === 20 &&
    CLAIMS['venue:club600'].by === 'dvh'));

  /* weather action → When picker unions the bus slot (now+45) and the
     quote carries the live-check line */
  await pg.selectOption('#action', 'weather');
  await pg.evaluate(() => { document.getElementById('intent').value = 'fog burn-off for the morning crowd'; });
  ok('gsBookableSlots unions into the When picker', await pg.evaluate(() => {
    const want = bkNowMin() + 45;
    return [...document.getElementById('wsel').options].some(o => +o.value === want);
  }));
  ok('live quote check line renders the bus total', await pg.evaluate(() =>
    document.getElementById('quote').textContent.includes('99 cr') &&
    window.__calls.quote > 0));

  /* file a booked weather window through the bus */
  await pg.evaluate(() => {
    const wsel = document.getElementById('wsel');
    wsel.value = wsel.options[1].value;
    refreshQuote();
  });
  await pg.click('#go');
  await pg.waitForTimeout(200);
  ok('filing goes to gsSubmitRequest with bus spec keys + start_slot', await pg.evaluate(() => {
    const s = window.__calls.submit[0];
    return s && s.kind === 'weather' && s.playerId === 'you' &&
           typeof s.durationMin === 'number' && typeof s.start_slot === 'number' &&
           s.note.includes('fog burn-off');
  }));
  ok('returned record drives the card — booked, busId req-42', await pg.evaluate(() =>
    MYREQ[0].busId === 'req-42' && MYREQ[0].booked === true && MYREQ[0].st === 'approved'));
  ok('bus filing never runs the local charge path', await pg.evaluate(() =>
    !LEDGER.some(l => /upfront/.test(l.what))));

  /* a denied live filing short-circuits — no charge, neutral copy */
  await pg.evaluate(() => { window.__calls.deny = true;
    document.getElementById('wsel').value = '';
    document.getElementById('queueMe').checked = true;   /* sky is locked — queue to file */
    refreshQuote(); });
  await pg.click('#go');
  await pg.waitForTimeout(200);
  ok('denied bus filing shows not-approved + nothing billed', await pg.evaluate(() =>
    MYREQ[0].sub.includes('nothing billed') &&
    document.getElementById('pipe').textContent.includes('never bill')));
  ok('denied live filing still never touches the ledger', await pg.evaluate(() =>
    !LEDGER.some(l => /upfront|deny refund/.test(l.what))));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAIL` : '\nall green');
  process.exit(fails.length ? 1 : 0);
})();
