/* =====================================================================
   PART 41 AUTOTEST — game-systems v0 skeleton (registry / ledger / bus).
   Mode-agnostic: runs in medieval ?test AND ?sf&test. Mutating tests run
   on reset state and the prior contents are restored afterwards, so the
   SF-seeded registry survives the suite untouched.
   ===================================================================== */

const __runAutoTest41 = runAutoTest;
runAutoTest = async function(){
  let baseErr = null;
  try { await __runAutoTest41(); } catch(e){ baseErr = e; }
  const out = document.getElementById('autotest');
  if(out) out.style.display = 'block';
  const res = [];
  function log(ok, name, detail){
    res.push({ ok, name });
    const line = (ok ? 'PASS: ' : 'FAIL: ') + name + (detail ? ' — ' + detail : '');
    try { console.log(line); } catch(e){}
    if(out) out.textContent += line + '\n';
  }
  if(baseErr) log(false, 'gs: inner autotest threw', String(baseErr && baseErr.message || baseErr));

  /* ---------- SF-mode: assert the live seeded registry (read-only) ---------- */
  if(typeof SF_MODE !== 'undefined' && SF_MODE){
    const nB = GS_REG.buildings.length;
    log(nB > 200, 'gs: SF seed minted residential buildings', nB + ' buildings');
    log(GS_REG.buildings.every(b => b.hn >= 9000 && b.hn < 9900),
        'gs: every seeded number is 9xxx (above real block maxima)');
    const perStreet = {};
    for(const b of GS_REG.buildings) perStreet[b.street] = (perStreet[b.street] || 0) + 1;
    let conform = true, unique = true;
    const seen = new Set();
    for(const b of GS_REG.buildings){
      const key = b.street + '|' + b.hn;
      if(seen.has(key)) unique = false;
      seen.add(key);
      let hit = false;
      for(let i = 0; i <= perStreet[b.street] + 2 && !hit; i++)
        if(gsAddrNumber(b.street, i) === b.hn) hit = true;
      if(!hit) conform = false;
    }
    log(conform, 'gs: every seeded number satisfies 9000 + hash(street|idx) % 900');
    log(unique, 'gs: no two buildings share a number on one street');
    const c6 = gsLeasesFor('C6').find(l => l.status === 'active');
    const c6b = c6 && gsBldById(gsUnitById(c6.unit_id).bld_id);
    log(!!c6b && c6b.street === 'Guerrero Street',
        'gs: Carmen (C6) holds a Guerrero St lease', c6b ? c6b.address : 'none');
    log(gsLeasesFor('C2').length === 0,
        'gs: Jules (C2) has NO lease — unpermitted tenancy per cast bible');
    log(gsLeasesFor('C7').some(l => l.status === 'owner-occupied'),
        'gs: Victor (C7) owner-occupies above the shop');
    const c4 = gsLeasesFor('C4').find(l => l.status === 'active');
    log(!!c4 && c4.occupants.indexOf('C5') >= 0,
        'gs: 750 Guerrero flat lists Priya + Marcus as occupants');
    const b744 = GS_REG.buildings.find(b => b.bld_idx === (SF_MAP.anchors.g744 || {}).bld);
    log(!!b744 && b744.owner_id === 'C7', 'gs: 744 Guerrero anchor is owned by C7');
  }

  /* ---------- isolated unit tests on reset state ---------- */
  const regSnap = gsRegSnapshot(), ledSnap = gsLedgerSnapshot(), busSnap = gsBusSnapshot();
  try{
    gsRegistryReset(); gsLedgerReset(); gsBusReset();

    // ---- registry: spec §3 number generation ----
    const f = (s, i) => 9000 + (hashString18(s + '|' + i) % 900);
    log(gsAddrNumber('Guerrero Street', 0) === f('Guerrero Street', 0) &&
        gsAddrNumber('Dolores Street', 7) === f('Dolores Street', 7),
        'gs: gsAddrNumber implements the spec formula exactly');
    let inRange = true, det = true;
    for(const s of ['Guerrero Street', 'Dolores Street', '24th Street', 'Capp Street'])
      for(let i = 0; i < 40; i++){
        const n = gsAddrNumber(s, i);
        if(!(n >= 9000 && n < 9900)) inRange = false;
        if(gsAddrNumber(s, i) !== n) det = false;
      }
    log(inRange, 'gs: generated numbers always land in [9000, 9900)');
    log(det, 'gs: number generation is deterministic (same input, same number)');

    // ---- registry: buildings / units / address format ----
    const b1 = gsRegisterBuilding({ street: 'Guerrero Street', style: 'Victorian' });
    log(!!b1 && /^9\d{3} Guerrero Street, San Francisco, CA$/.test(b1.address),
        'gs: minted address matches spec format', b1 && b1.address);
    const u1 = gsRegisterUnit(b1.id, { unit_code: 'A', bedrooms: 2, base_rent: 1400 });
    log(gsAddressOfUnit(u1.id) === b1.address + ' Unit A',
        'gs: unit address appends " Unit A"', gsAddressOfUnit(u1.id));
    const nums = new Set();
    for(let i = 0; i < 30; i++) nums.add(gsRegisterBuilding({ street: 'Test Street' }).hn);
    log(nums.size === 30, 'gs: 30 registrations on one street, zero number collisions');

    // ---- registry: lease lifecycle + address immutability across turnover ----
    const l1 = gsSignLease(u1.id, 'C6', { start: '1989-03-15', monthly_rent: 1400 });
    log(!!l1 && gsActiveLease(u1.id).tenant_id === 'C6', 'gs: lease signs and activates');
    const addrBefore = gsAddressOfUnit(u1.id);
    const l2 = gsSignLease(u1.id, 'H1', { start: '2026-09-22', monthly_rent: 2400 });
    log(l1.status === 'ended' && gsActiveLease(u1.id) === l2 &&
        gsAddressOfUnit(u1.id) === addrBefore,
        'gs: tenant turnover ends prior lease, address unchanged');
    log(gsEvictLease(u1.id, { day: 1 }, 'nonpayment') &&
        gsActiveLease(u1.id) === null && l2.status === 'evicted',
        'gs: eviction frees the unit with a distinct status');

    // ---- registry: clerk minting + retired numbers never reused ----
    const minted = gsMintAddress('Test Street', 'garage conversion');
    const mLog = GS_REG.mintLog[GS_REG.mintLog.length - 1];
    log(!!minted && mLog && mLog.bld_id === minted.id && /garage/.test(mLog.reason),
        'gs: gsMintAddress registers + logs the mint event');
    const dead = gsRegisterBuilding({ street: 'Dead Street' });
    const deadHn = dead.hn;
    gsRetireBuilding(dead.id, 'demolished');
    for(let i = 0; i < 25; i++) gsRegisterBuilding({ street: 'Dead Street' });
    const reused = GS_REG.buildings.some(b => b.street === 'Dead Street' &&
      b.hn === deadHn && b.id !== dead.id);
    log(dead.status === 'retired' && !reused &&
        GS_REG_USED.get('Dead Street').has(deadHn),
        'gs: retired number is permanently withdrawn from circulation');

    // ---- registry: JSON snapshot round-trip ----
    const snap = gsRegSnapshot();
    const nBld = GS_REG.buildings.length, nLease = GS_REG.leases.length;
    gsRegistryReset();
    const emptyOk = GS_REG.buildings.length === 0;
    log(emptyOk && gsRegLoad(snap) && GS_REG.buildings.length === nBld &&
        GS_REG.leases.length === nLease && !!gsBldById(b1.id) &&
        gsActiveLease(u1.id) === null,
        'gs: registry snapshot/load round-trips buildings, units, leases');

    // ---- ledger: credits ----
    gsCreditGrant('pA', 100, 'test grant');
    log(gsCreditBalance('pA') === 100, 'gs: credit grant posts');
    gsCreditSpend('pA', 40, 'test spend');
    const spendFail = gsCreditSpend('pA', 1000, 'overdraw');
    log(gsCreditBalance('pA') === 60 && spendFail === null,
        'gs: credit spend debits; overdraw is an atomic no-op');
    gsCreditRefund('pA', 15, 'test refund');
    log(gsCreditBalance('pA') === 75 && gsLowCredit('pA') === false &&
        gsLowCredit('pB') === true,
        'gs: refund posts; low-credit warning threshold works');

    // ---- ledger: dollars, conservation, rent through the registry ----
    gsDollarGrant('T1', 3000, 'move-in fund');
    const rb = gsRegisterBuilding({ street: 'Rent Street', owner_id: 'landlord' });
    const ru = gsRegisterUnit(rb.id, { unit_code: 'A', base_rent: 2000 });
    gsSignLease(ru.id, 'T1', { monthly_rent: 2000 });
    const before = gsLedgerTotal('dollars');
    const rc = gsCollectRent(ru.id, { period: '2026-10' });
    log(rc.ok && gsDollarBalance('T1') === 1000 && gsDollarBalance('landlord') === 2000,
        'gs: rent collection moves dollars tenant -> owner');
    log(gsLedgerTotal('dollars') === before,
        'gs: dollars are conserved across payments (no source/sink leak)');
    const rc2 = gsCollectRent(ru.id, { period: '2026-11' });
    log(!rc2.ok && rc2.reason === 'insufficient_dollars' && gsDollarBalance('T1') === 1000,
        'gs: rent fails honestly when tenant cannot pay');
    const nTxn = GS_LEDGER.txns.length;
    log(GS_LEDGER.txns.every((t, i) => t.n === i + 1) && GS_LEDGER.txns.length === nTxn,
        'gs: txn log is append-only with monotonic sequence');
    const lSnap = gsLedgerSnapshot();
    gsLedgerReset();
    log(gsLedgerLoad(lSnap) && gsCreditBalance('pA') === 75,
        'gs: ledger snapshot/load round-trips balances + txn log');

    // ---- bus: possession ban is absolute (denied before billing) ----
    gsCreditGrant('pA', 10000, 'stake'); gsCreditGrant('pB', 10000, 'stake');
    const pAStake = gsCreditBalance('pA');
    let allBanned = true;
    for(const c of ['C1','C2','C3','C4','C5','C6','C7','C8']){
      const r = gsSubmitRequest({ playerId: 'pA', kind: 'possess', target: c,
                                  durationMin: 10 }, 0);
      if(!(r.status === 'denied' && r.reason === 'possession_ban')) allBanned = false;
    }
    const ownerTry = gsSubmitRequest({ playerId: 'owner', kind: 'possess',
                                     target: 'C7', durationMin: 10 }, 0);
    log(allBanned && ownerTry.status === 'denied' &&
        gsCreditBalance('pA') === pAStake,
        'gs: possess denied for all C1-C8 (incl. owner) before billing');

    // ---- bus: only your own hired character is possessable ----
    const notYours = gsSubmitRequest({ playerId: 'pA', kind: 'possess',
                                     target: 'H1', durationMin: 10 }, 0);
    gsMarkHired('H1', 'pA'); gsMarkHired('H2', 'pA'); gsMarkHired('H3', 'pB');
    const okReq = gsSubmitRequest({ playerId: 'pA', kind: 'possess',
                                  target: 'H1', durationMin: 30 }, 0);
    log(notYours.reason === 'not_your_character' &&
        okReq.status === 'active' && okReq.price === 60 &&
        gsCreditBalance('pA') === pAStake - 60,
        'gs: hired character possess activates, billed rate x duration upfront');

    // ---- bus: duration bounds + unknowns denied ----
    const dLo = gsSubmitRequest({ playerId: 'pA', kind: 'possess', target: 'H2', durationMin: 1 }, 0);
    const dHi = gsSubmitRequest({ playerId: 'pA', kind: 'possess', target: 'H2', durationMin: 999 }, 0);
    const dUn = gsSubmitRequest({ playerId: 'pA', kind: 'fly', durationMin: 10 }, 0);
    const dNo = gsSubmitRequest({ playerId: 'pA', kind: 'possess', durationMin: 10 }, 0);
    log(dLo.reason === 'bad_duration' && dHi.reason === 'bad_duration' &&
        dUn.reason === 'unknown_action' && dNo.reason === 'missing_target',
        'gs: duration bounds + unknown action + missing target all denied');

    // ---- bus: conflict classes — exclusive queues, compatible co-runs ----
    const q1 = gsSubmitRequest({ playerId: 'pA', kind: 'possess',
                               target: 'H1', durationMin: 10 }, 1);
    const co = gsSubmitRequest({ playerId: 'pA', kind: 'possess',
                               target: 'H2', durationMin: 10 }, 1);
    log(q1.status === 'queued' && co.status === 'active' &&
        gsActiveOn('t:possess:H1').length === 1 && gsActiveOn('t:possess:H2').length === 1,
        'gs: same-target possess queues (exclusive); different-target runs (compatible)');
    const wx = gsSubmitRequest({ playerId: 'pB', kind: 'weather', durationMin: 60 }, 1);
    const ev = gsSubmitRequest({ playerId: 'pB', kind: 'street_event', durationMin: 30 }, 1);
    log(wx.status === 'active' && ev.status === 'active',
        'gs: non-exclusive street_event co-runs with active weather');

    // ---- bus: FCFS promotion (same submit minute -> filing order holds) ----
    gsMarkHired('H4', 'pB');
    const fA = gsSubmitRequest({ playerId: 'pB', kind: 'possess', target: 'H4', durationMin: 10 }, 5);
    const fB = gsSubmitRequest({ playerId: 'pB', kind: 'possess', target: 'H4', durationMin: 10 }, 5);
    const fC = gsSubmitRequest({ playerId: 'pB', kind: 'possess', target: 'H4', durationMin: 10 }, 5);
    gsBusTick(16);
    const order1 = fA.status === 'completed' && fB.status === 'active' && fC.status === 'queued';
    gsBusTick(27);
    const order2 = fB.status === 'completed' && fC.status === 'active';
    log(order1 && order2, 'gs: queue promotes strictly first-come-first-served');

    // ---- bus: queued expiry auto-refunds in full ----
    // (active runs 60min so the queued req's 30min TTL lapses before the slot frees)
    gsMarkHired('H5', 'pB');
    const eA = gsSubmitRequest({ playerId: 'pB', kind: 'possess', target: 'H5', durationMin: 60 }, 100);
    const balBefore = gsCreditBalance('pB');
    const eQ = gsSubmitRequest({ playerId: 'pB', kind: 'possess', target: 'H5', durationMin: 10 }, 100);
    gsBusTick(100 + 30 + 1);
    log(eA.status === 'active' && eQ.status === 'expired' &&
        gsCreditBalance('pB') === balBefore,
        'gs: queued request that expires before activation is auto-refunded');

    // ---- bus: cooldowns gate refiling ----
    gsMarkHired('H6', 'pB');
    const cA = gsSubmitRequest({ playerId: 'pB', kind: 'possess', target: 'H6', durationMin: 5 }, 200);
    gsBusTick(206);
    const cdTry = gsSubmitRequest({ playerId: 'pB', kind: 'possess', target: 'H6', durationMin: 5 }, 207);
    log(cA.status === 'completed' && cdTry.status === 'denied' && cdTry.reason === 'cooldown',
        'gs: per-player cooldown blocks refiling after completion');
    const wA = gsSubmitRequest({ playerId: 'pA', kind: 'weather', durationMin: 10 }, 300);
    gsBusTick(311);
    const wOther = gsSubmitRequest({ playerId: 'pB', kind: 'weather', durationMin: 10 }, 312);
    log(wA.status === 'completed' && wOther.reason === 'global_cooldown',
        'gs: global cooldown applies to every player');

    // ---- bus: cancel refunds; admin revoke compensates in full ----
    gsMarkHired('H7', 'pA');
    const kA = gsSubmitRequest({ playerId: 'pA', kind: 'possess', target: 'H7', durationMin: 10 }, 400);
    const kQ = gsSubmitRequest({ playerId: 'pA', kind: 'possess', target: 'H7', durationMin: 10 }, 400);
    const balK = gsCreditBalance('pA');
    gsCancelRequest(kQ.id, 401, 'player');
    gsCancelRequest(kA.id, 401, 'admin');
    log(kQ.status === 'cancelled' && kA.status === 'cancelled' && kA.by === 'admin' &&
        gsCreditBalance('pA') === balK + kQ.price + kA.price,
        'gs: cancel + admin revoke refund the full upfront price');

    // ---- bus: feed is append-only with monotonic sequence + event kinds ----
    const kinds = new Set(GS_FEED.map(e => e.type));
    let mono = true;
    for(let i = 1; i < GS_FEED.length; i++) if(GS_FEED[i].n <= GS_FEED[i - 1].n) mono = false;
    log(mono && kinds.has('deny') && kinds.has('approve') && kinds.has('queue') &&
        kinds.has('expire') && kinds.has('complete') && kinds.has('cancel'),
        'gs: public feed logs every lifecycle event, monotonic order');

    // ---- bus: snapshot round-trip ----
    const bSnap = gsBusSnapshot();
    const nReqs = GS_REQ.reqs.length;
    gsBusReset();
    log(gsBusLoad(bSnap) && GS_REQ.reqs.length === nReqs &&
        GS_HIRED.H1 === 'pA' && gsRequestById(fC.id).status === 'completed' &&
        GS_FEED.length > 0,
        'gs: bus snapshot/load round-trips requests, cooldowns, hired roster');
  }catch(e){
    log(false, 'gs: suite threw', String(e && e.message || e));
  }finally{
    gsRegLoad(regSnap); gsLedgerLoad(ledSnap); gsBusLoad(busSnap);
  }

  const passed = res.filter(r => r.ok).length;
  if(out) out.textContent += '\n==== GS ' + passed + '/' + res.length + ' passed ====\n';
};
