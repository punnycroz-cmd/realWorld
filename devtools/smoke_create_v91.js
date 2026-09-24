// v91 smoke — create.html "the real hire seam" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_create_v91.js
// Bare run = demo board (mirrors, simulated pipeline). Second pass stubs
// __aiBridge like production: gsJobBoard/gsVacantUnits/gsHireNameCheck/
// gsHireQuote/gsHireSlots/gsHiredRoster/gsExplainRequest/gsSubmitRequest/
// gsCancelRequest — the page must file the real bus shape, show the live
// record id, and never fake an approval.
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/create.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  /* ---------- pass 1: bare (demo board) ---------- */
  const pg = await br.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto(URL);
  await pg.waitForSelector('#wizard h2', { timeout: 10000 });
  ok('badge: demo board', await pg.$eval('#srcBadge', e => /demo board/.test(e.textContent)));
  ok('seats: production cap 24', await pg.$eval('#seatLine', e => /of 24 hired faces/.test(e.textContent)));

  await pg.fill('#cname', 'Rio Takemura');
  await pg.fill('#carr', 'off the bus with a duffel and a folder of resumes');
  await pg.click('#next');
  await pg.fill('#cbio', 'quiet, stubborn, laughs at the wrong moments');
  await pg.click('#pbuild .pick[data-v="tall"]');
  await pg.waitForSelector('#psig');
  await pg.click('.sw[data-v="mission mural"]');
  await pg.click('.pick[data-v="denim jacket, pins on the collar"]');
  await pg.click('#next');
  await pg.click('.opt[data-job="mudhaus-barista"]');
  await pg.click('#next');

  // step 4 — hire-package honesty on the door board
  ok('step4: deposit waived copy', await pg.$eval('#wizard', e => /deposit is waived — the hire package covers the hunt/i.test(e.textContent)));
  ok('step4: pro-rated home row', await pg.$eval('.opt[data-home="c9127-A"]', e => /deposit waived · first month \$\d+ pro-rated/.test(e.textContent)));
  await pg.click('.opt[data-home="c9127-A"]');
  ok('move-in card: $0 deposit', await pg.$eval('.movein', e => /\$0 — waived · the hire package covers the hunt/.test(e.textContent)));
  ok('move-in card: pro-rated line', await pg.$eval('.movein', e => /first month — pro-rated from \d{4}-\d{2}-\d{2}/.test(e.textContent)));
  ok('move-in card: re-house honesty', await pg.$eval('.movein', e => /re-house later is a normal second lease/.test(e.textContent)));
  await pg.click('#next');
  await pg.click('#next');

  // step 6 — quote + cooldown + sign
  ok('review: pro-rated move-in line', await pg.$eval('.quote', e => /first month \$\d+ pro-rated · deposit \$0 — waived \(the hire package\)/.test(e.textContent)));
  ok('review: one-a-day cooldown', await pg.$eval('#wizard', e => /one hire filing per account per day/.test(e.textContent)));
  ok('no payment-plan remnant', await pg.$eval('#wizard', e => !/payment plan/i.test(e.textContent)));
  await pg.click('#next');

  // demo pipeline → briefing → h0N registry entry
  await pg.waitForSelector('#briefing', { state: 'visible', timeout: 15000 });
  ok('pipeline: hire-package lease stage', await pg.$eval('#pipe', e => /deposit waived — the hire package/.test(e.textContent)));
  ok('registry: h0N id format', await pg.$eval('#record', e => /Registry entry — h0\d/.test(e.textContent)));

  /* ---------- pass 2: stub bridge (live board) ---------- */
  const pg2 = await br.newPage({ viewport: { width: 1280, height: 900 } });
  const spec = {};
  await pg2.addInitScript((s) => {
    window.__aiBridge = {
      gsJobBoard: () => ([
        { id:'mudhaus-barista', employer:'Mudhaus Coffee', role:'Barista', wage:19,
          hrs:'30-38 h/wk', est:2400, tips:false, pay:'weekly', openings:1,
          accepting:true, shift:'mornings', poi:'Haus Coffee' },
        { id:'seeking', employer:null, role:'Arrives without work', wage:0,
          hrs:'--', est:0, openings:-1, accepting:true, shift:'job hunting', poi:null }
      ]),
      gsVacantUnits: () => ([
        { unit:{ id:'u-bld-04-A', unit_code:'A', bedrooms:0, base_rent:1300, rent_controlled:false, bld_id:'bld-04' },
          building:{ id:'bld-04', street:'Capp Street' }, address:'9127 Capp Street, San Francisco, CA Unit A' },
        { unit:{ id:'u-bld-02-2', unit_code:'2', bedrooms:0, base_rent:1350, rent_controlled:true, bld_id:'bld-02' },
          building:{ id:'bld-02', street:'Guerrero Street' }, address:'9457 Guerrero Street, San Francisco, CA Unit 2' }
      ]),
      gsHireNameCheck: (n) => /^(mars|reyes)\b/i.test(n||'') ? { ok:false, reason:'name_collision' } : { ok:true, name:n },
      gsHireSlots: (pid) => ({ cap:3, used:1, left:2 }),
      gsHiredRoster: () => ([{ id:'h01', name:'Dana Okafor' }]),
      gsHireQuote: (sp) => {
        s.quoteSpec = sp;
        return { ok:true, fee:500, arrivalBank:1600, deposit:0,
          depositNote:'waived — the hire package covers the hunt',
          unit:{ id:sp.target, rent:1300 }, job:{ id:sp.params.job, est:2400 },
          rent:1300, affordPct:54, ceilingPct:55, outOfReach:false,
          runwayMonths:null, moveIn:sp.params.moveInDate, firstMonth:1100,
          bankAfterFirstMonth:500, name:{available:true},
          slots:{cap:3,used:1,left:2}, warnings:[] };
      },
      gsExplainRequest: (id) => ({ id, status:'in_review', lane:'naming' }),
      gsSubmitRequest: (sp) => { s.lastSpec = sp;
        if (sp.params && /^mars/i.test(sp.params.name||''))
          return { id:'req-9', kind:'hire', status:'denied', reason:'name_collision' };
        return { id:'req-7', kind:'hire', status:'in_review', lane:'naming', deferred:true }; },
      gsCancelRequest: (id) => { s.cancelled = id; return { ok:true }; }
    };
    window.__spec = s;
  }, spec);
  await pg2.goto(URL);
  await pg2.waitForSelector('#wizard h2', { timeout: 10000 });
  ok('badge: live board', await pg2.$eval('#srcBadge', e => /live board/.test(e.textContent)));
  await pg2.fill('#cname', 'Rio Takemura');
  await pg2.fill('#carr', 'new in town, looking for the counter shift');
  await pg2.click('#next');
  await pg2.fill('#cbio', 'quiet, stubborn, laughs at the wrong moments');
  await pg2.click('#pbuild .pick[data-v="compact"]');
  await pg2.click('.sw[data-v="moss"]');
  await pg2.click('.pick[data-v="windbreaker, always"]');
  await pg2.click('#next');
  await pg2.click('.opt[data-job="mudhaus-barista"]');
  await pg2.click('#next');
  ok('live doors: registry unit on the board', await pg2.$eval('#wizard', e => /9127 Capp Street, San Francisco, CA Unit A/.test(e.textContent)));
  ok('live doors: studio kind from bedrooms 0', await pg2.$eval('#wizard', e => /studio/.test(e.textContent)));
  await pg2.click('.opt[data-home="u-bld-04-A"]');
  await pg2.click('#next');
  await pg2.click('#next');
  ok('live quote card: personnel office', await pg2.$eval('#wizard', e => /live — the personnel office/.test(e.textContent)));
  ok('live quote: deposit note verbatim', await pg2.$eval('#wizard', e => /waived — the hire package covers the hunt/.test(e.textContent)));
  ok('live quote: rent-to-income', await pg2.$eval('#wizard', e => /54% of a 55% ceiling/.test(e.textContent)));

  // sign → files the real bus shape, parks in the naming lane
  await pg2.click('#next');
  await pg2.waitForSelector('.queue', { timeout: 10000 });
  ok('bus spec: kind hire + target unit', await pg2.evaluate(() => {
    const s = window.__spec.lastSpec;
    return s && s.kind === 'hire' && s.target === 'u-bld-04-A' && s.durationMin === 5;
  }));
  ok('bus spec: params carry the application', await pg2.evaluate(() => {
    const p = window.__spec.lastSpec.params;
    return p.name === 'Rio Takemura' && p.job === 'mudhaus-barista' &&
      p.look && p.look.build === 'compact' && /^\d{4}-\d{2}-\d{2}$/.test(p.moveInDate);
  }));
  ok('queue card: live bus record id', await pg2.$eval('.queue', e => /req-7/.test(e.textContent) && /in_review/.test(e.textContent)));
  ok('queue card: naming lane honesty', await pg2.$eval('.queue', e => /naming lane/.test(e.textContent)));
  ok('no fake approval on live filing', await pg2.evaluate(() => !document.querySelector('#briefing') ||
      document.querySelector('#briefing').style.display !== 'block'));

  // withdraw goes through gsCancelRequest
  await pg2.click('#withdraw');
  ok('live withdraw: gsCancelRequest called', await pg2.evaluate(() => window.__spec.cancelled === 'req-7'));

  // denied filing → real reason code, no charge (fresh page, taken name)
  const pg3 = await br.newPage({ viewport: { width: 1280, height: 900 } });
  await pg3.addInitScript((s) => {
    window.__aiBridge = {
      gsJobBoard: () => ([
        { id:'mudhaus-barista', employer:'Mudhaus Coffee', role:'Barista', wage:19,
          hrs:'30-38 h/wk', est:2400, tips:false, pay:'weekly', openings:1,
          accepting:true, shift:'mornings', poi:'Haus Coffee' }
      ]),
      gsVacantUnits: () => ([
        { unit:{ id:'u-bld-04-A', unit_code:'A', bedrooms:0, base_rent:1300, rent_controlled:false, bld_id:'bld-04' },
          building:{ id:'bld-04', street:'Capp Street' }, address:'9127 Capp Street, San Francisco, CA Unit A' }
      ]),
      gsHireNameCheck: (n) => /^(mars|reyes)\b/i.test(n||'') ? { ok:false, reason:'name_collision' } : { ok:true, name:n },
      gsHireSlots: () => ({ cap:3, used:1, left:2 }),
      gsHiredRoster: () => ([{ id:'h01', name:'Dana Okafor' }]),
      gsHireQuote: () => ({ ok:true, warnings:[] }),
      gsSubmitRequest: (sp) => { s.lastSpec = sp;
        if (sp.params && /^mars/i.test(sp.params.name||''))
          return { id:'req-9', kind:'hire', status:'denied', reason:'name_collision' };
        return { id:'req-7', kind:'hire', status:'in_review', lane:'naming' }; },
      gsCancelRequest: (id) => ({ ok:true })
    };
    window.__spec = s;
  }, spec);
  await pg3.goto(URL);
  await pg3.waitForSelector('#wizard h2', { timeout: 10000 });
  await pg3.fill('#cname', 'Mars Delgado');
  await pg3.fill('#carr', 'a name the block already answers to');
  // name collides live — the Continue gate refuses; test the bus deny by
  // forcing the click anyway (validate() guards the button, so submit
  // via the real name the office rejects at allow(): unit occupied)
  const canNext = await pg3.$eval('#next', e => e.disabled);
  ok('live name check: taken refuses the gate', canNext === true &&
     await pg3.$eval('#namecheck', e => /taken|name_collision|already has one/i.test(e.textContent)));
  await pg3.fill('#cname', 'Rio Takemura');
  await pg3.click('#next');
  await pg3.fill('#cbio', 'quiet, stubborn, laughs at the wrong moments');
  await pg3.click('#pbuild .pick[data-v="compact"]');
  await pg3.click('.sw[data-v="moss"]');
  await pg3.click('.pick[data-v="windbreaker, always"]');
  await pg3.click('#next');
  await pg3.click('.opt[data-job="mudhaus-barista"]');
  await pg3.click('#next');
  await pg3.click('.opt[data-home="u-bld-04-A"]');
  await pg3.click('#next');
  await pg3.click('#next');
  // stub denies only 'mars' names — force the collision param through the bus
  await pg3.evaluate(() => { f.name = 'Mars Delgado'; });
  await pg3.click('#next');
  await pg3.waitForSelector('#denybox', { state: 'visible', timeout: 10000 });
  ok('bus deny: real reason code', await pg3.$eval('#denybox', e => /name_collision/.test(e.textContent)));
  ok('bus deny: nothing billed', await pg3.$eval('#denybox', e => /Nothing was charged/.test(e.textContent)));

  await br.close();
  console.log(fails.length ? `\n${fails.length} FAILURES: ${fails.join(', ')}` : '\nall green — v91 real hire seam');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('smoke error:', e); process.exit(1); });
