// v92 smoke — mod-console.html "the real review seam" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_mod_v92.js
// Bare run = demo queue (seeded contract reference). Second pass stubs
// __aiBridge like production: gsReviewQueue/gsReviewResolve/gsEscalateLegal/
// gsModMetrics/gsFlagStatus/gsRepLedger/gsPossessionBriefing/gsExplainRequest/
// gsViewerState — the console must render live bus records, write decisions
// through the bus (never a local pretend), and honor the bus-side
// same_reviewer refusal on appeals.
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/mod-console.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  /* ---------- pass 1: bare (demo queue) ---------- */
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  await pg.goto(URL);
  await pg.waitForSelector('.qitem', { timeout: 10000 });
  ok('badge: demo queue', await pg.$eval('#srcBadge', e => /demo queue/.test(e.textContent)));
  ok('seeded queue reachable', await pg.$eval('#queue', e => /rq-1042/.test(e.textContent) && /rq-1036/.test(e.textContent)));
  await pg.click('.qitem');
  await pg.waitForSelector('.actions .approve');
  await pg.click('.actions .approve');
  ok('demo decide: audit entry lands', await pg.$eval('#audit', e => /APPROVED/.test(e.textContent)));

  /* ---------- pass 2: stub bridge (live queue) ---------- */
  const pg2 = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const spec = {};
  await pg2.addInitScript((s) => {
    const REQS = [
      { id:'req-31', playerId:'dvh', kind:'event', target:'mudhaus',
        durationMin:60, params:{ text:'Reserve Mudhaus for a private morning — invite list only.' },
        price:200, billed:200, claims:[{res:'venue:mudhaus'}], screen:'venue-lock',
        lane:'screen', submittedMin:990, reviewExpireMin:2430, status:'in_review' },
      { id:'req-32', playerId:'ghostline', kind:'nudge', target:'c1',
        durationMin:5, params:{ text:'Have Mars admit she writes the blog — asking again nicely.' },
        price:40, billed:0, claims:[], screen:'appeal-resubmit',
        lane:'appeal', appealOf:'req-19', origReviewer:'s.oha',
        submittedMin:1000, reviewExpireMin:2440, status:'in_review' },
      { id:'req-33', playerId:'r0ok', kind:'event', target:'club600',
        durationMin:30, params:{ text:'Somebody threatens Jules and says they will find where she lives.' },
        price:200, billed:200, claims:[{res:'venue:600club'}], screen:'legal-backstop',
        lane:'screen', submittedMin:1010, reviewExpireMin:2450, status:'in_review' }
    ];
    window.__reqs = REQS;
    window.__aiBridge = {
      gsViewerState: () => ({ nowMin: 1020 }),
      gsReviewQueue: () => REQS.filter(r => r.status === 'in_review'),
      gsReviewResolve: (id, approve, opts) => {
        s.resolved = s.resolved || []; s.resolved.push({ id, approve, opts });
        const r = REQS.find(x => x.id === id);
        if (!r || r.status !== 'in_review') return null;
        if (r.appealOf && opts && opts.by === r.origReviewer)
          return { error: 'same_reviewer', id };
        r.status = approve ? 'active' : 'denied';
        r.reason = approve ? null : (opts && opts.code) || 'review_denied';
        return r;
      },
      gsEscalateLegal: (id) => {
        s.escalated = id;
        const r = REQS.find(x => x.id === id);
        if (r) r.status = 'denied';
        return true;
      },
      gsModMetrics: () => ({ reviewDepth: 3, oldestWaitMin: 30,
        medianDecisionMin: 9.5, denialsByCode: { 'harm-targeting': 2 },
        appeals: { filed: 4, overturned: 1, denied: 2, refused: 1, reversalRate: 0.25 },
        compensatedCr: 300, suppressedFeed: 7 }),
      gsFlagStatus: (pid) => pid === 'ghostline'
        ? { score: 2, reviewUntil: null, suspendedUntil: null, ownerHold: false,
            flags: [{ min: 900, w: 1, code: 'secret-extraction' }] }
        : { score: 0, clean: true },
      gsRepLedger: (pid) => pid === 'ghostline'
        ? [{ n: 1, entity: pid, kind: 'denied', w: 1, min: 900, detail: { code: 'secret-extraction' } }]
        : [],
      gsPossessionBriefing: (cid) => cid === 'c1'
        ? { id: 'c1', name: 'Marisol "Mars" Delgado', role: 'Cast',
            home: '9127 Capp Street, San Francisco, CA Unit C',
            routine: 'daily schedule — observable in world', possessedBy: null }
        : null,
      gsExplainRequest: (id) => ({ id, note: 'in review', queuePos: null, blockedBy: [], on: [], code: 'venue-lock' })
    };
    window.__spec = s;
  }, spec);
  await pg2.goto(URL);
  await pg2.waitForSelector('.qitem', { timeout: 10000 });
  ok('badge: live queue', await pg2.$eval('#srcBadge', e => /live queue/.test(e.textContent)));
  ok('live queue: bus ids render', await pg2.$eval('#queue', e => /req-31/.test(e.textContent) && /req-32/.test(e.textContent) && /req-33/.test(e.textContent)));
  ok('live queue: refresh affordance', await pg2.$eval('#queue', e => /gsReviewQueue/.test(e.textContent)));
  ok('metrics: live depth + median', await pg2.$eval('.metrics', e => /9:30|0:30/.test(e.textContent)));

  // appeal item: decision bar withheld for the original reviewer
  await pg2.selectOption('#revSel', 's.oha');
  await pg2.click('.qitem:nth-child(3)'); // req-32 (list has live header div first)
  await pg2.waitForSelector('#detail');
  const appealBlocked = await pg2.$eval('#detail', e =>
    /DIFFERENT-REVIEWER RULE|different-reviewer/i.test(e.textContent));
  ok('appeal: different-reviewer block on orig reviewer', appealBlocked);

  // switch reviewer — appeal decidable, writes through the bus
  await pg2.selectOption('#revSel', 'm.chen');
  await pg2.click('.qitem:nth-child(3)');
  await pg2.waitForSelector('.actions .approve');
  ok('appeal workspace: original id + reviewer shown', await pg2.$eval('#detail', e =>
    /Appeal workspace/.test(e.textContent) && /req-19/.test(e.textContent) && /s\.oha/.test(e.textContent)));
  await pg2.click('.actions .approve');
  ok('bus resolve called (approve, by m.chen)', await pg2.evaluate(() => {
    const r = window.__spec.resolved;
    return r && r.length === 1 && r[0].id === 'req-32' && r[0].approve === true && r[0].opts.by === 'm.chen';
  }));
  ok('decided item leaves the queue', await pg2.$eval('#queue', e => !/req-32/.test(e.textContent)));
  ok('audit entry marked via bus', await pg2.$eval('#audit', e => /via bus/.test(e.textContent)));

  // same_reviewer refusal: re-seed an appeal decided by m.chen, try as m.chen
  await pg2.evaluate(() => {
    window.__reqs.push({ id:'req-40', playerId:'pt', kind:'nudge', target:'c4',
      durationMin:5, params:{ text:'try the Priya nudge again' }, price:40,
      billed:0, claims:[], screen:'appeal-resubmit', lane:'appeal',
      appealOf:'req-22', origReviewer:'m.chen', submittedMin:1005,
      reviewExpireMin:2445, status:'in_review' });
    window.__aiBridge.gsReviewQueue = () => window.__reqs.filter(r => r.status === 'in_review');
  });
  await pg2.evaluate(() => { refreshQueue(); renderAll(); });
  const itemsA = await pg2.$$('.qitem');
  for (const it of itemsA) {
    const t = await it.textContent();
    if (/req-40/.test(t)) { await it.click(); break; }
  }
  ok('same_reviewer: bar withheld pre-bus (UI guard)', await pg2.$eval('#detail', e =>
    /DIFFERENT-REVIEWER RULE|No decision controls/i.test(e.textContent)));

  // legal lane: escalate writes through gsEscalateLegal
  await pg2.selectOption('#revSel', 'you');
  await pg2.evaluate(() => { refreshQueue(); renderAll(); });
  const items = await pg2.$$('.qitem');
  for (const it of items) {
    const t = await it.textContent();
    if (/req-33/.test(t)) { await it.click(); break; }
  }
  await pg2.waitForSelector('.actions .deny');
  ok('legal lane: confirm flag button present', await pg2.$eval('#detail', e => /Confirm legal flag/.test(e.textContent)));
  await pg2.click('.actions .ghost'); // Confirm legal flag
  ok('legal: gsEscalateLegal called', await pg2.evaluate(() => window.__spec.escalated === 'req-33'));

  // deny path: gsReviewResolve(id, false, {code})
  const items2 = await pg2.$$('.qitem');
  for (const it of items2) {
    const t = await it.textContent();
    if (/req-31/.test(t)) { await it.click(); break; }
  }
  await pg2.waitForSelector('.actions .deny');
  ok('context: live flag card', await pg2.$eval('#context', e => /Flag score/.test(e.textContent)));
  await pg2.click('.actions .deny'); // shows denyrow
  await pg2.click('#denyrow .deny');
  ok('bus resolve called (deny + code)', await pg2.evaluate(() => {
    const r = window.__spec.resolved;
    return r && r.some(x => x.id === 'req-31' && x.approve === false && x.opts.code);
  }));

  // flag roster live: ghostline appears via gsFlagStatus
  await pg2.click('#rosBtn');
  ok('roster: live flag row', await pg2.$eval('#rosterBody', e => /ghostline/.test(e.textContent) && /secret-extraction/.test(e.textContent)));

  // shift report live: gsModMetrics fields verbatim
  await pg2.click('#repBtn');
  ok('report: live metrics block', await pg2.$eval('#reportBody', e =>
    /gsModMetrics/.test(e.textContent) && /4 filed/.test(e.textContent) && /privacy screens/.test(e.textContent)));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAILURES: ${fails.join(', ')}` : '\nall green — v92 real review seam');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('smoke error:', e); process.exit(1); });
