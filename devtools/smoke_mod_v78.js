// v78 smoke — mod-console.html "the second-eyes layer" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_mod_v78.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/mod-console.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.goto(URL);
  await pg.waitForSelector('#queue .qitem', { timeout: 10000 });

  // reviewer switcher present
  ok('reviewer picker', await pg.$eval('#revSel', e => /s\.oha/.test(e.innerHTML) && /m\.chen/.test(e.innerHTML)));

  // claimed item: decision bar withheld for non-claimer
  await pg.click('.qitem:has-text("rq-1041")');
  ok('lock copy', await pg.$eval('#detail', e => /Claimed by m\.chen — one reviewer per request/.test(e.textContent)));
  ok('no decision buttons on foreign claim', !(await pg.$('#detail button.approve')));
  ok('note composer still open on foreign claim', !!(await pg.$('#notetext')));

  // claim → release → auto-claim on decide
  await pg.click('.qitem:has-text("rq-1035")');
  await pg.click('#claimBtn');
  ok('claim lands', await pg.$eval('#detail', e => /claimed by you \(you\)/.test(e.textContent)));
  await pg.click('#relBtn');
  ok('release returns to unclaimed', await pg.$eval('#detail', e => /unclaimed —/.test(e.textContent)));
  await pg.click('#detail button.approve');
  ok('auto-claim on decide', await pg.$eval('#audit', e => /rq-1035/.test(e.textContent) && /— you/.test(e.textContent)));

  // appeal different-reviewer enforcement
  await pg.selectOption('#revSel', 's.oha');
  await pg.click('.qitem:has-text("rq-1038")');
  ok('appeal workspace card', await pg.$eval('#detail', e => /Appeal workspace — original decision/.test(e.textContent) && /secret-extraction · s\.oha/.test(e.textContent)));
  ok('different-reviewer block', await pg.$eval('#detail', e => /DIFFERENT-REVIEWER RULE/.test(e.textContent)));
  ok('no controls while appeal-blocked', !(await pg.$('#detail .actions button')));
  await pg.selectOption('#revSel', 'you');
  await pg.click('.qitem:has-text("rq-1038")');
  ok('controls restored for other reviewer', !!(await pg.$('#detail button.approve')));

  // handoff notes
  await pg.click('.qitem:has-text("rq-1040")');
  ok('seeded note visible', await pg.$eval('#detail', e => /Handoff notes — internal only/.test(e.textContent) && /s\.oha/.test(e.textContent)));
  await pg.fill('#notetext', 'watch the repeat-pattern count before approving');
  await pg.click('#detail >> text=leave note');
  ok('note attributed', await pg.$eval('#detail', e => /— you|· you/.test(e.textContent) && /watch the repeat-pattern/.test(e.textContent)));

  // ledger export carries no notes
  await pg.click('text=export ledger records');
  const led = await pg.$eval('#ledgerOut', e => e.value);
  ok('ledger has mod_decision records', /mod_decision/.test(led) && /rq-1035/.test(led));
  ok('ledger has zero note content', !/watch the repeat-pattern|Handoff/.test(led));

  // shift report per-reviewer counts
  await pg.click('#repBtn');
  ok('by-reviewer line', await pg.$eval('#reportBody', e => /Decisions this session, by reviewer/.test(e.textContent) && /you: 1/.test(e.textContent)));
  ok('engine unchanged v50', await pg.$eval('#reportBody', e => /engine v50/.test(e.textContent)));

  await br.close();
  if (fails.length) { console.log('FAILURES:', fails.join(', ')); process.exit(1); }
  console.log('ALL PASS');
})().catch(e => { console.error(e); process.exit(1); });
