// v89 smoke — wire.html "the real wire seam" in headless chromium.
// Stubs __aiBridge with the game-v14 wire shape (gsWireTail entries:
// top-level mentions, n/day, attempt, booked status) plus gsWireSince /
// gsWirePage / gsWireStats / gsCoSessions / gsResourceBoard /
// gsExplainRequest and checks the page reads them as the bus wrote them.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_wire_v89.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/wire.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.addInitScript(() => {
    window.__calls = { since: [], page: [], follow: [] };
    const WIRE = [
      { id: 'w-0007', n: 7, t: 700, day: '2026-09-23', kind: 'weather',
        text: 'Rain over the Mission — called by tide_9', who: 'tide_9' },
      { id: 'w-0008', n: 8, t: 720, day: '2026-09-23', kind: 'request',
        req: 'rq-77', who: 'leaf', status: 'queued',
        text: 'event — a park cleanup at Dolores Park — in line (#2)',
        venue: 'park', mentions: ['C5'], attrs: { credits: 178, discount: 0.15 } },
      { id: 'w-0009', n: 9, t: 730, day: '2026-09-22', kind: 'request',
        req: 'rq-70', who: 'ghostline', status: 'not approved',
        attempt: 'possess', reason_code: 'possession-scope',
        text: 'request not approved' },
      { id: 'w-0010', n: 10, t: 740, day: '2026-09-23', kind: 'request',
        req: 'rq-80', who: 'dvh', status: 'booked',
        text: 'event — a birthday window at The 600 Club — on the book',
        venue: 'club600', attrs: { credits: 90 } },
      { id: 'w-0011', n: 11, t: 745, day: '2026-09-23', kind: 'request',
        text: 'two players, one scene — okfm + juno_ sharing the block',
        who: 'okfm', mentions: ['h01', 'h02'] }
    ];
    window.__aiBridge = {
      gsViewerState: () => ({
        feed: WIRE,
        sessions: [{ a: { char: 'h01', player: 'okfm' }, b: { char: 'h02', player: 'juno_' } }],
        board: {
          'venue:club600': { res: 'venue:club600', state: 'locked', leftMin: 22, by: 'dvh' },
          'openair': { res: 'openair', state: 'queued', depth: 2,
                       booked: [{ start: '22:00', who: 'leaf' }] }
        },
        weather: { wx: 'rain', untilMin: Date.now() / 60000 + 40, sponsors: 2 },
        calendar: [{ claim: 'sky', start_min: 1260, min: 60, who: 'leaf', what: 'late fog' }]
      }),
      gsWireSince: (n) => { window.__calls.since.push(n); return []; },
      gsWirePage: (o) => {
        window.__calls.page.push(o);
        return o.before > 3 ? { entries: [
            { id: 'w-0002', n: 2, t: 300, day: '2026-09-22', kind: 'move',
              who: 'C2', venue: 'park', text: 'Jules out for the morning run' }
          ], next: 2, oldest: true } : { entries: [], next: null, oldest: true };
      },
      gsWireStats: () => ({ total: 40, suppressed: 6, displayFilter: 'A',
        byKind: { request: 20, weather: 4 }, follows: [] }),
      gsCoSessions: () => [{ a: { char: 'h01', player: 'okfm' }, b: { char: 'h02', player: 'juno_' } }],
      gsExplainRequest: (id) => id === 'rq-77' ? {
        id: id, kind: 'street_event', player: 'leaf', status: 'queued',
        queuePos: 2, blockedBy: ['rq-60'], behind: ['rq-55'],
        on: ['the open air (event permit)'],
        note: 'waiting for rq-60 to finish (the open air (event permit))'
      } : null,
      gsWireFollow: (k, on) => { window.__calls.follow.push([k, on]); return true; }
    };
  });

  await pg.goto(URL);
  await pg.waitForSelector('#wire .ev', { timeout: 10000 });

  ok('badge flips to live on the stub bridge', await pg.evaluate(() =>
    document.getElementById('srcBadge').textContent.includes('live')));

  ok('bus entries ingest — top-level mentions fold in (C5/Marcus row follows)', await pg.evaluate(() =>
    FEED.some(e => e.id === 'w-0008' && e.attrs && e.attrs.mentions &&
      e.attrs.mentions.indexOf('C5') >= 0 && e.seq === 8)));

  ok('booked status renders a booked chip + counts as open on the live strip', await pg.evaluate(() =>
    !!document.querySelector('#wire .st.booked') &&
    document.getElementById('livenow').textContent.includes('booked')));

  ok('co-session card rides reaching-in-now (okfm + juno_ · one scene)', await pg.evaluate(() =>
    document.getElementById('livenow').textContent.includes('okfm + juno_')));

  ok('permit board renders bus claim states (club600 locked 22, openair queued 2)', await pg.evaluate(() =>
    document.getElementById('pboardPanel').style.display !== 'none' &&
    document.getElementById('pboard').textContent.includes('locked') &&
    document.getElementById('pboard').textContent.includes('2 queued')));

  ok('day separators come from entry.day (sep 22 shows its own divider)', await pg.evaluate(() =>
    document.getElementById('wire').textContent.includes('sep 22')));

  ok('player-called sky line carries sponsor count', await pg.evaluate(() =>
    document.getElementById('wx').textContent.includes('player-called sky') &&
    document.getElementById('wx').textContent.includes('2 sponsors')));

  ok('denied line shows attempt class + reason, never text', await pg.evaluate(() => {
    const li = document.querySelector('#wire .ev[data-id="w-0009"]');
    li.click();
    const d = document.getElementById('detBody').textContent;
    return d.includes('asked for — possess') && d.includes('possession-scope') &&
      !d.includes('ghostline\'s');
  }));

  ok('gsExplainRequest real shape renders note + queuePos + waiting-on claims', await pg.evaluate(() => {
    const li = document.querySelector('#wire .ev[data-id="w-0008"]');
    li.click();
    const d = document.getElementById('detBody').textContent;
    return d.includes('waiting for rq-60 to finish') && d.includes('#2 in line') &&
      d.includes('the open air (event permit)') && d.includes('blocked by');
  }));

  ok('queued discount line renders (filed queued −15%)', await pg.evaluate(() =>
    document.getElementById('detBody').textContent.includes('−15%')));

  ok('gsWireSince drives incremental polls (cursor = max n seen)', await pg.evaluate(() => {
    livePoll();   /* first poll took the join tail; now the cursor exists */
    return window.__calls.since.length > 0 && window.__calls.since.every(n => n === 11);
  }));

  ok('load older pages the bus via gsWirePage, exhausts honestly', await pg.evaluate(() => {
    document.getElementById('older').click();
    return window.__calls.page.length === 1 && window.__calls.page[0].before === 7 &&
      FEED.some(e => e.id === 'w-0002') && liveExhausted === true &&
      document.getElementById('foot').textContent.includes('top of the record');
  }));

  ok('follow pin writes through to gsWireFollow with m: bus key', await pg.evaluate(() => {
    toggleFollow('c:C5');
    return window.__calls.follow.some(f => f[0] === 'm:C5' && f[1] === true);
  }));

  ok('withheld count lands in the day card (privacy, not downtime)', await pg.evaluate(() => {
    if (!dayOpen) toggleDay();
    return document.getElementById('daycard').textContent.includes('privacy screens, not downtime');
  }));

  ok('viewer counter hidden — bus reported no audience number', await pg.evaluate(() =>
    document.querySelector('.viewers').style.display === 'none'));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAIL` : '\nall green');
  process.exit(fails.length ? 1 : 0);
})();
