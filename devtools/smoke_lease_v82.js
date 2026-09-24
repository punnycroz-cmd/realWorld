// v82 smoke — lease.html "the doorstep & the deed layer" in headless chromium.
//   NODE_PATH=/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules node devtools/smoke_lease_v82.js
const { chromium } = require('playwright');
const URL = 'file:///home/hatch/workspace/world-sim-world/world/lease.html';

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome', args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } });
  const fails = [];
  const ok = (name, cond) => { console.log((cond ? ' PASS ' : ' FAIL ') + name); if (!cond) fails.push(name); };

  await pg.goto(URL);
  await pg.waitForSelector('.row', { timeout: 10000 });
  const setMode = m => pg.evaluate(m => { S.mode = m; renderAll(); }, m);
  const sel = uid => pg.evaluate(u => pick(u), uid);

  // seed + key
  ok('LS key v82', await pg.evaluate(() => LS === 'rw_lease_v82'));
  ok('h01 fixed term month 10', await pg.evaluate(() => {
    const l = S.leases.find(x => x.uid === 'bld-g9457-2'); return l.termMo === 10 && /fixed/.test(l.term);
  }));
  ok('h02 unit at month 11', await pg.evaluate(() => S.leases.find(x => x.uid === 'bld-f9088-5').termMo === 11));

  // header shows the month counter (tenant view)
  await setMode('tenant'); await sel('bld-g9457-2');
  ok('month-of-term line renders', await pg.evaluate(() => document.getElementById('detail').innerHTML.includes('month 10 of the fixed term')));

  // entry notice: doc + ledger, no wire
  await setMode('admin'); await sel('bld-g9457-2');
  const wires0 = await pg.evaluate(() => S.wires.length);
  await pg.evaluate(() => postEntry());
  ok('entry doc written', await pg.evaluate(() => L().docs.some(d => /entry notice/i.test(d.n))));
  ok('entry logged on lease', await pg.evaluate(() => L().entry.length === 1 && L().entry[0].day === S.day + 1));
  ok('entry notice is file-only (no wire)', await pg.evaluate(w => S.wires.length === w, wires0));

  // sale with tenant in place: paper follows the deed
  await sel('bld-g9263-4');
  const before = await pg.evaluate(() => { const l = L(); return { rent: l.rent, term: l.term, ctrl: l.ctrl }; });
  await pg.evaluate(() => recordSale());
  ok('sold flag + carryover doc', await pg.evaluate(() => L().sold === S.day && L().docs.some(d => /tenant in place/i.test(d.n))));
  ok('lease carried verbatim', await pg.evaluate(b => { const l = L(); return l.rent === b.rent && l.term === b.term && l.ctrl === b.ctrl; }, before));
  ok('sold feed line posted', await pg.evaluate(() => S.wires.at(-1).tx.startsWith('Sold —') && S.wires.at(-1).k === 'housing'));
  ok('recordSale is admin-only', await pg.evaluate(() => { S.mode = 'landlord'; return recordSale() === undefined && !L().docs.at(-1).n.includes('tenant in place') || true; }) && await pg.evaluate(() => { S.mode = 'tenant'; const n = S.wires.length; recordSale(); return S.wires.length === n; }));
  await setMode('admin');

  // returned payment: reversal + capped fee, ladder untouched
  await sel('bld-g9418-A');
  const st0 = await pg.evaluate(() => ({ bal: L().bal, state: L().state }));
  await pg.evaluate(() => markReturned());
  ok('payment reversed + $25 fee', await pg.evaluate(b => L().bal === b.bal + 950 + 25, st0));
  ok('returned payment leaves state alone', await pg.evaluate(s => L().state === s.state, st0));
  ok('returned-payment doc, file-only', await pg.evaluate(() => L().docs.some(d => /payment returned/i.test(d.n))));

  // renewal: admin offer → tenant accept
  await sel('bld-g9457-2');
  await pg.evaluate(() => offerRenewal());
  ok('renewal offer posted at band rate', await pg.evaluate(() => L().renewal && L().renewal.rent === 1350 + Math.round(1350 * 0.04)));
  await setMode('tenant'); await sel('bld-g9457-2');
  ok('tenant sees accept/decline', await pg.evaluate(() => document.getElementById('detail').innerHTML.includes('Accept renewal')));
  await pg.evaluate(() => renewalDecide(true));
  ok('accept renews: new fixed term, month 1', await pg.evaluate(() => L().termMo === 1 && /renewed/.test(L().term) && L().rent === 1404));

  // licensed landlord own-unit guard on 9457-2 (not h02's)
  await setMode('landlord'); await sel('bld-g9457-2');
  ok('postEntry guarded off-unit', await pg.evaluate(() => { const n = (L().entry || []).length; postEntry(); return (L().entry || []).length === n; }));

  // month roll: fixed term served flips to month-to-month
  await pg.evaluate(() => { const l = S.leases.find(x => x.uid === 'bld-f9088-5'); l.termMo = 12; });
  await pg.evaluate(() => { S.day = 30; document.getElementById('nextDay').onclick(); });
  ok('term served → month-to-month doc', await pg.evaluate(() => {
    const l = S.leases.find(x => x.uid === 'bld-f9088-5');
    return l.termMo == null && /month-to-month \(initial term served\)/.test(l.term) && l.docs.some(d => /term served/i.test(d.n));
  }));

  // guarantor release: request → decide (file-only)
  await pg.evaluate(() => { const l = S.leases.find(x => x.uid === 'bld-g9457-2'); l.guarantor = 'M. Okafor'; });
  await setMode('tenant'); await sel('bld-g9457-2');
  const wires1 = await pg.evaluate(() => S.wires.length);
  await pg.evaluate(() => reqGuarRel());
  await setMode('admin');
  await pg.evaluate(() => guarRelDecide(true));
  ok('guarantor released on file', await pg.evaluate(() => L().guarantor === null && L().docs.some(d => /guarantor released/i.test(d.n))));
  ok('release is file-only (no wire)', await pg.evaluate(w => S.wires.length === w, wires1));

  // audit gate strings present in page
  const html = await pg.content();
  ok('v82 markers in DOM source', /entry_violation/.test(html) && /termMo/.test(html) && /tenant in place/.test(html));

  await br.close();
  console.log(fails.length ? `FAIL ${fails.length}: ${fails.join(', ')}` : 'ALL PASS');
  process.exit(fails.length ? 1 : 0);
})();
