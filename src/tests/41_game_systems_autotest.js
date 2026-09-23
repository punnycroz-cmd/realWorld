/* =====================================================================
   PART 41 AUTOTEST — game-systems v0 registry/ledger/bus + v1 request
   lifecycle (real catalogue, effect dispatch, per-minute billing) +
   v2 conflicts (pairwise claims matrix, shared skies, venue permits,
   paperwork serialization, promotion ordering + handoff).
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
        okReq.status === 'active' && okReq.price === 120 &&
        gsCreditBalance('pA') === pAStake - 120,
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
    const wx = gsSubmitRequest({ playerId: 'pB', kind: 'weather', durationMin: 60,
                                 params: { wx: 'clear' } }, 1);
    const ev = gsSubmitRequest({ playerId: 'pB', kind: 'street_event', durationMin: 30,
                                 params: { event: 'block_party' } }, 1);
    log(wx.status === 'active' && ev.status === 'active',
        'gs: benign weather + outdoor event co-run (v2: compatible classes)');

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
    const wA = gsSubmitRequest({ playerId: 'pA', kind: 'weather', durationMin: 10,
                                 params: { wx: 'clear' } }, 300);
    gsBusTick(311);
    const wOther = gsSubmitRequest({ playerId: 'pB', kind: 'weather', durationMin: 10,
                                     params: { wx: 'rain' } }, 312);
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

    // ================= v1: the request lifecycle made real =================

    // ---- v1: catalogue validates params + per-kind duration bounds ----
    gsCreditGrant('pC', 20000, 'stake'); gsCreditGrant('pD', 20000, 'stake');
    const bdBad = gsSubmitRequest({ playerId: 'pC', kind: 'weather', durationMin: 60,
                                    params: { wx: 'tornado' } }, 0);
    const evBad = gsSubmitRequest({ playerId: 'pC', kind: 'street_event', durationMin: 30,
                                    params: { event: 'riot' } }, 0);
    const hMiss = gsSubmitRequest({ playerId: 'pC', kind: 'hire', durationMin: 5 }, 0);
    const hDur  = gsSubmitRequest({ playerId: 'pC', kind: 'hire', target: 'x',
                                    durationMin: 6 }, 0);
    const bDur  = gsSubmitRequest({ playerId: 'pC', kind: 'buy', target: 'x',
                                    durationMin: 5 }, 0);
    log(bdBad.reason === 'bad_weather' && evBad.reason === 'bad_event' &&
        hMiss.reason === 'missing_target' && hDur.reason === 'bad_duration' &&
        bDur.reason === 'bad_duration',
        'gs: v1 catalogue validates params + per-kind duration bounds');

    // ---- v1: possess end-to-end — brain suspended, forced handoff at end ----
    gsMarkHired('H9', 'pC', { name: 'Test Nine' });
    const stubV = { _castId: 'H9', isNPC: true, name: 'Test Nine', role: 'Resident' };
    VILLAGERS.push(stubV);
    const pStart = gsCreditBalance('pC');
    const pos = gsSubmitRequest({ playerId: 'pC', kind: 'possess', target: 'H9',
                                  durationMin: 30 }, 1000);
    const possOn = pos.status === 'active' && pos.price === 120 &&
                   GS_POSSESS.H9 && GS_POSSESS.H9.playerId === 'pC' &&
                   stubV.isNPC === false && gsIsBrainSuspended('H9');
    gsBusTick(1030);                               // duration end -> handoff
    const possOff = pos.status === 'completed' && !GS_POSSESS.H9 &&
                    stubV.isNPC === true && !gsIsBrainSuspended('H9');
    VILLAGERS.splice(VILLAGERS.indexOf(stubV), 1);
    log(possOn && possOff && gsCreditBalance('pC') === pStart - 120,
        'gs: v1 possess suspends the AI, force-hands-off at end, bills 4/min');

    // ---- v1: player cancel pro-rates unused minutes; admin pays full ----
    gsMarkHired('H10', 'pC'); gsMarkHired('H11', 'pC');
    const pr = gsSubmitRequest({ playerId: 'pC', kind: 'possess', target: 'H10',
                                 durationMin: 30 }, 2000);
    const prBal = gsCreditBalance('pC');
    gsCancelRequest(pr.id, 2010, 'player');        // 20 whole min unused -> 80
    log(pr.status === 'cancelled' && pr.refunded === 80 &&
        gsCreditBalance('pC') === prBal + 80 && pr.usedMin === 10,
        'gs: v1 player cancel refunds whole unused minutes (per-minute billing)');
    const ar = gsSubmitRequest({ playerId: 'pC', kind: 'possess', target: 'H11',
                                 durationMin: 30 }, 2100);
    const arBal = gsCreditBalance('pC');
    gsAdminRevoke(ar.id, 'contested', 2105);
    log(ar.status === 'cancelled' && ar.by === 'admin' && ar.refunded === 120 &&
        gsCreditBalance('pC') === arBal + 120 &&
        GS_FEED.some(e => e.type === 'admin' && e.action === 'revoke' &&
                          e.target === ar.id),
        'gs: v1 admin revoke compensates in full + posts to the public feed');

    // ---- v1: weather request actually overrides the sky, then releases ----
    W.hum = 0.5; W.temp = 20;
    const wxR = gsSubmitRequest({ playerId: 'pD', kind: 'weather', durationMin: 30,
                                  params: { wx: 'rain' } }, 3000);
    gsApplyWxOverride();                           // one frame's application
    const rainOn = wxR.status === 'active' && GS_WX_OVR.wx === 'rain' &&
                   W.rain === 0.75 && W.storm === 0.10 &&
                   Math.abs(W.hum - 0.7) < 1e-9 && Math.abs(W.temp - 18) < 1e-9 &&
                   (typeof SF_WX === 'undefined' || SF_WX.cover === 0.90);
    gsBusTick(3031);
    const rainOff = wxR.status === 'completed' && GS_WX_OVR.wx === null &&
                    Math.abs(W.hum - 0.5) < 1e-9;
    log(rainOn && rainOff,
        'gs: v1 weather request drives the sky, releases cleanly at end');

    // ---- v1: street_event registers a live civic event, clears at end ----
    const ev1 = gsSubmitRequest({ playerId: 'pD', kind: 'street_event',
                                  durationMin: 30,
                                  params: { event: 'mural_tour',
                                            at: 'Clarion Alley' } }, 9000);
    const evOn = ev1.status === 'active' &&
      GS_EVENTS.some(e => e.event === 'mural_tour' && e.at === 'Clarion Alley' &&
                          e.reqId === ev1.id);
    gsBusTick(9031);
    log(evOn && ev1.status === 'completed' &&
        !GS_EVENTS.some(e => e.reqId === ev1.id),
        'gs: v1 street_event goes live for its window, then clears');

    // ---- v1: hire — housing required, creates character + lease + stake ----
    const hb = gsRegisterBuilding({ street: 'Hire Street', owner_id: 'landlord' });
    const hu = gsRegisterUnit(hb.id, { unit_code: 'A', base_rent: 2000 });
    const hire = gsSubmitRequest({ playerId: 'pD', kind: 'hire', target: hu.id,
                                   durationMin: 5,
                                   params: { name: 'Newcomer Nan' } }, 4000);
    const hiredId = Object.keys(GS_HIRED).find(k =>
      GS_HIRED[k] && GS_HIRED[k].unitId === hu.id);
    const hire2 = gsSubmitRequest({ playerId: 'pD', kind: 'hire', target: hu.id,
                                    durationMin: 5 }, 4001);
    log(hire.status === 'active' && hiredId && gsHiredOwner(hiredId) === 'pD' &&
        gsActiveLease(hu.id) && gsActiveLease(hu.id).tenant_id === hiredId &&
        gsDollarBalance(hiredId) === 2000 * 2 + 1200 &&
        hire2.reason === 'unit_occupied',
        'gs: v1 hire creates character, signs the lease, pays move-in stake');
    const possNew = gsSubmitRequest({ playerId: 'pD', kind: 'possess',
                                      target: hiredId, durationMin: 5 }, 4010);
    const possWrong = gsSubmitRequest({ playerId: 'pC', kind: 'possess',
                                        target: hiredId, durationMin: 5 }, 4010);
    log(possNew.status === 'active' && possWrong.reason === 'not_your_character',
        'gs: v1 freshly hired character is possessable by its owner only');
    gsBusTick(4016);
    // hire cap: pC already owns H9/H10/H11 -> the per-player cap is 3
    const hub2 = gsRegisterUnit(hb.id, { unit_code: 'B', base_rent: 1800 });
    const capTry = gsSubmitRequest({ playerId: 'pC', kind: 'hire',
                                     target: hub2.id, durationMin: 5 }, 4100);
    log(capTry.reason === 'hire_cap',
        'gs: v1 per-player hire cap enforced (compute budget)');

    // ---- v1: possession briefing is public-fields-only ----
    const br = gsPossessionBriefing(hiredId);
    log(br && br.name === 'Newcomer Nan' && /Hire Street/.test(br.home || '') &&
        !/secret|drama|seed|memory|belief/i.test(JSON.stringify(br)) &&
        gsPossessionBriefing('C1') === null,
        'gs: v1 briefing carries public profile only — secrets redacted');

    // ---- v1: listing -> buy moves real dollars + unit title ----
    const lb = gsRegisterBuilding({ street: 'Sale Street', owner_id: 'landlord' });
    const lu = gsRegisterUnit(lb.id, { unit_code: 'A', base_rent: 2500 });
    const lstNo = gsSubmitRequest({ playerId: 'pC', kind: 'listing',
                                    target: lu.id, durationMin: 60 }, 5000);
    const lstOk = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
                                    target: lu.id, durationMin: 60,
                                    params: { ask: 400000 } }, 5000);
    const lstOk2 = lstOk.status === 'active' && GS_LISTINGS[lu.id] &&
                   GS_LISTINGS[lu.id].ask === 400000;
    const lstDup = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
                                     target: lu.id, durationMin: 60 }, 5001);
    log(lstNo.reason === 'not_owner' && lstOk2 &&
        lstDup.reason === 'already_listed',
        'gs: v1 listing requires ownership + one live listing per unit');
    const buyNoChar = gsSubmitRequest({ playerId: 'pD', kind: 'buy',
                                        target: lu.id, durationMin: 1,
                                        params: { buyerId: 'H10' } }, 5001);
    const buyPoor = gsSubmitRequest({ playerId: 'pC', kind: 'buy',
                                      target: lu.id, durationMin: 1,
                                      params: { buyerId: 'H10' } }, 5001);
    gsDollarGrant('H10', 500000, 'windfall');
    const landBefore = gsDollarBalance('landlord');
    const buyOk = gsSubmitRequest({ playerId: 'pC', kind: 'buy',
                                    target: lu.id, durationMin: 1,
                                    params: { buyerId: 'H10' } }, 5002);
    log(buyNoChar.reason === 'buyer_not_hired' &&
        buyPoor.reason === 'insufficient_dollars' &&
        buyOk.status === 'active' && gsUnitById(lu.id).owner_id === 'H10' &&
        gsDollarBalance('H10') === 100000 &&
        gsDollarBalance('landlord') === landBefore + 400000 &&
        !GS_LISTINGS[lu.id] && lstOk.status === 'completed' &&
        GS_FEED.some(e => e.type === 'sale' && e.req === buyOk.id),
        'gs: v1 buy moves dollars buyer->seller, transfers title, delists');

    // ---- v1: stale queued request fails honestly with full refund ----
    // (a queued possess whose character is re-homed while it waits: allow()
    // passed at filing, fails at promotion -> fail + full refund)
    gsMarkHired('H15', 'pD');
    const sq1 = gsSubmitRequest({ playerId: 'pD', kind: 'possess', target: 'H15',
                                  durationMin: 30 }, 6000);
    const sq2 = gsSubmitRequest({ playerId: 'pD', kind: 'possess', target: 'H15',
                                  durationMin: 10 }, 6000);
    const sq2Bal = gsCreditBalance('pD');
    gsMarkHired('H15', 'pE');                    // world changes under the queue
    gsBusTick(6030);   // sq1 ends + slot frees the same tick sq2's TTL lapses:
                      // expiry needs now > expireMin, so sq2 is still live and
                      // hits the stale revalidation path instead            
    log(sq1.status === 'completed' && sq2.status === 'failed' &&
        sq2.refunded === 40 && gsCreditBalance('pD') === sq2Bal + 40 &&
        GS_FEED.some(e => e.type === 'fail' && e.req === sq2.id && e.stale),
        'gs: v1 queued request gone stale fails + full refund at promotion');

    // ---- v1: queue positions + live meters + viewer state ----
    gsMarkHired('H13', 'pD');
    const vp1 = gsSubmitRequest({ playerId: 'pD', kind: 'possess', target: 'H13',
                                  durationMin: 30 }, 7000);
    const vq1 = gsSubmitRequest({ playerId: 'pD', kind: 'possess', target: 'H13',
                                  durationMin: 10 }, 7000);
    const vq2 = gsSubmitRequest({ playerId: 'pD', kind: 'possess', target: 'H13',
                                  durationMin: 10 }, 7000);
    log(gsQueuePosition(vq1.id) === 1 && gsQueuePosition(vq2.id) === 2 &&
        gsQueuePosition(vp1.id) === 0,
        'gs: v1 queue positions are exposed to viewers');
    const meter = gsRequestMeter(vp1.id, 7010);
    log(meter && meter.elapsedMin === 10 && meter.remainingMin === 20 &&
        meter.spentSoFar === 40,
        'gs: v1 live meter reports per-minute spend against the hard cap');
    const vs = gsViewerState(7000);
    log(vs.queues['t:possess:H13'] && vs.queues['t:possess:H13'].length === 2 &&
        vs.active.some(a => a.id === vp1.id) &&
        GS_FEED.every((e, i) => i === 0 || e.n > GS_FEED[i - 1].n),
        'gs: v1 viewer state exposes queues, active sessions, ordered feed');

    // ---- v1: low-balance warning posts to the feed at activation ----
    gsCreditGrant('pG', 130, 'stake'); gsMarkHired('H14', 'pG');
    const lw = gsSubmitRequest({ playerId: 'pG', kind: 'possess', target: 'H14',
                                 durationMin: 30 }, 8000);
    log(lw.status === 'active' && gsCreditBalance('pG') === 10 &&
        GS_FEED.some(e => e.type === 'warn' && e.req === lw.id && e.low_credits),
        'gs: v1 low-balance warning fires on the public feed');

    // ---- v1: feed now spans the whole lifecycle vocabulary ----
    const vKinds = new Set(GS_FEED.map(e => e.type));
    log(vKinds.has('fail') && vKinds.has('admin') && vKinds.has('sale') &&
        vKinds.has('hire') && vKinds.has('warn'),
        'gs: v1 feed covers fail/admin/sale/hire/warn events');

    // ================= v2: THE PAIRWISE CONFLICT MATRIX =================
    // fresh players + hired chars; all times >= 20000 so nothing from the
    // v1 block is still live (its actives end by ~8030; its queued TTL-
    // expired requests simply get swept by the first v2 tick).
    for(const p of ['qA','qB','qC','qD','qE','qF','qG','qS'])
      gsCreditGrant(p, 20000, 'v2 stake');
    gsMarkHired('H20','qA'); gsMarkHired('H21','qB'); gsMarkHired('H22','qC');
    gsMarkHired('H23','qD'); gsMarkHired('H24','qE'); gsMarkHired('H25','qB');
    const allQueuedBlocked = () =>
      GS_REQ.reqs.filter(r => r.status === 'queued')
                 .every(r => gsFindBlockers(r).length > 0);

    // ---- v2: contradictory weather queues on the sky; identical co-sponsors
    const wxA = gsSubmitRequest({ playerId: 'qA', kind: 'weather', durationMin: 20,
                                params: { wx: 'rain' } }, 20000);      // severe
    const wxC = gsSubmitRequest({ playerId: 'qC', kind: 'weather', durationMin: 50,
                                params: { wx: 'rain' } }, 20001);      // identical
    const wxB = gsSubmitRequest({ playerId: 'qB', kind: 'weather', durationMin: 30,
                                params: { wx: 'heatwave' } }, 20002);  // contradictory
    log(wxA.status === 'active' && wxB.status === 'queued' &&
        wxB.queuedBehind.indexOf(wxA.id) >= 0 &&
        wxB.queuedBehind.indexOf(wxC.id) >= 0 &&
        GS_FEED.some(e => e.type === 'queue' && e.req === wxB.id &&
                          e.on.indexOf('sky') >= 0),
        'gs: v2 contradictory weather queues on the sky; feed names the blockers');
    log(wxC.status === 'active' && GS_WX_OVR.wx === 'rain' &&
        GS_WX_OVR.sponsors[wxA.id] === 20020 &&
        GS_WX_OVR.sponsors[wxC.id] === 20051 && GS_WX_OVR.untilMin === 20051,
        'gs: v2 identical forecasts co-sponsor the same sky (design §5)');

    // ---- v2: severe weather blocks outdoor event permits (anti-grief)
    const evM = gsSubmitRequest({ playerId: 'qD', kind: 'street_event',
        durationMin: 40, params: { event: 'farmers_market', at: '24th Street' } }, 20003);
    const evT = gsSubmitRequest({ playerId: 'qE', kind: 'street_event',
        durationMin: 30, params: { event: 'mural_tour', at: 'Clarion Alley' } }, 20004);
    log(evM.status === 'queued' && evT.status === 'queued' &&
        gsFindBlockers(evM).some(b => b.id === wxA.id || b.id === wxC.id),
        'gs: v2 no outdoor permits issued into a storm hold (severe sky)');

    // ---- v2: non-conflicting filings leapfrog the queue — no head-of-line
    //      blocking; two players steering two characters = a feed session
    const pB1 = gsSubmitRequest({ playerId: 'qB', kind: 'possess', target: 'H21',
                                durationMin: 15 }, 20005);
    const pC1 = gsSubmitRequest({ playerId: 'qC', kind: 'possess', target: 'H22',
                                durationMin: 25 }, 20006);
    const pB2 = gsSubmitRequest({ playerId: 'qB', kind: 'possess', target: 'H21',
                                durationMin: 10 }, 20007);
    log(pB1.status === 'active' && pC1.status === 'active' &&
        pB2.status === 'queued' && gsQueuePosition(pB2.id) === 1 &&
        GS_FEED.some(e => e.type === 'session' &&
                          e.players.indexOf('qB') >= 0 && e.players.indexOf('qC') >= 0 &&
                          e.chars.indexOf('H21') >= 0 && e.chars.indexOf('H22') >= 0) &&
        gsCoSessions().some(pr =>
          (pr.a.player === 'qB' && pr.b.player === 'qC') ||
          (pr.a.player === 'qC' && pr.b.player === 'qB')),
        'gs: v2 compatible multiplayer — two players steer two characters; feed reports the session');

    // ---- v2: a later filing cannot leapfrog an earlier QUEUED clash
    const wxD = gsSubmitRequest({ playerId: 'qA', kind: 'weather', durationMin: 10,
                                params: { wx: 'clear' } }, 20008);
    log(wxD.status === 'queued' &&
        gsFindBlockers(wxD).some(b => b.id === wxB.id && b.status === 'queued'),
        'gs: v2 later requests cannot leapfrog a queued clash (FCFS holds)');
    log(allQueuedBlocked(), 'gs: v2 invariant — every queued request has a live blocker');

    // ---- v2: promotion cascade — one freed sky unblocks the line in order
    gsBusTick(20021);   // wxA rain + pB1 possess end at 20020
    log(wxA.status === 'completed' && GS_WX_OVR.wx === 'rain' &&
        wxB.status === 'queued' && evM.status === 'queued' &&
        pB2.status === 'active' &&
        GS_POSSESS.H21 && GS_POSSESS.H21.playerId === 'qB',
        'gs: v2 sky holds while a co-sponsor remains; next possess promotes');
    gsBusTick(20052);   // wxC rain ends at 20051 — the sky releases
    const approv = GS_FEED.filter(e => e.type === 'approve' && e.promoted &&
                                       e.min === 20052);
    log(wxC.status === 'completed' && GS_WX_OVR.wx === 'heatwave' &&
        wxB.status === 'active' && evM.status === 'active' &&
        evT.status === 'active' && wxD.status === 'queued' &&
        approv.length === 3 &&
        approv[0].req === wxB.id && approv[1].req === evM.id &&
        approv[2].req === evT.id,
        'gs: v2 cascade promotes heatwave + market + tour in strict FCFS order');
    log(allQueuedBlocked(), 'gs: v2 invariant holds after the cascade');
    gsBusTick(20083);   // heatwave + mural tour end at 20082
    log(wxD.status === 'expired' && wxD.refunded === wxD.price,
        'gs: v2 queued request that never unblocks before TTL refunds in full');

    // ---- v2: venue permits — one event per location; roving passes through
    const evP = gsSubmitRequest({ playerId: 'qA', kind: 'street_event',
        durationMin: 40, params: { event: 'parade', at: 'Valencia Street' } }, 20100);
    const evB = gsSubmitRequest({ playerId: 'qB', kind: 'street_event',
        durationMin: 30, params: { event: 'block_party',
                                   at: '  VALENCIA   Street ' } }, 20101);
    const evF = gsSubmitRequest({ playerId: 'qC', kind: 'street_event',
        durationMin: 30, params: { event: 'street_fair', at: 'Mission Street' } }, 20102);
    const evR = gsSubmitRequest({ playerId: 'qF', kind: 'street_event',
        durationMin: 20, params: { event: 'mural_tour', at: 'Valencia Street' } }, 20103);
    log(evP.status === 'active' && evB.status === 'queued' &&
        gsQueuePosition(evB.id) === 1 &&
        evF.status === 'active' && evR.status === 'active' &&
        gsNormVenue('  VALENCIA   Street ') === 'valencia street' &&
        gsViewerState(20101).queues['g:street_event']
          .some(q => q.id === evB.id && q.blockedBy.indexOf(evP.id) >= 0),
        'gs: v2 one permit per venue (normalized); other venues + roving tours co-run');
    gsBusTick(20141);   // parade ends 20140 -> block_party takes the venue
    log(evP.status === 'completed' && evB.status === 'active' &&
        GS_EVENTS.some(e => e.event === 'block_party'),
        'gs: v2 queued permit activates the moment the venue frees up');
    // severe weather may not be summoned over the running event either
    const stQ = gsSubmitRequest({ playerId: 'qE', kind: 'weather', durationMin: 10,
                                params: { wx: 'storm' } }, 20150);
    log(stQ.status === 'queued' &&
        gsFindBlockers(stQ).some(b => b.id === evB.id),
        'gs: v2 you cannot summon a storm over a permitted outdoor event');
    gsBusTick(20172);   // block_party ends 20171 -> storm promotes
    log(evB.status === 'completed' && stQ.status === 'active' &&
        GS_WX_OVR.wx === 'storm',
        'gs: v2 held storm request runs once the last outdoor event clears');

    // ---- v2: registry paperwork serializes — a buy waits behind a hire
    const pb = gsRegisterBuilding({ street: 'Escrow Street', owner_id: 'landlord' });
    const pu = gsRegisterUnit(pb.id, { unit_code: 'A', base_rent: 2200 });
    gsSubmitRequest({ playerId: 'owner', kind: 'listing', target: pu.id,
                      durationMin: 60, params: { ask: 300000 } }, 20200);
    const hr = gsSubmitRequest({ playerId: 'qA', kind: 'hire', target: pu.id,
                               durationMin: 5, params: { name: 'Tenant Tess' } }, 20201);
    gsDollarGrant('H25', 400000, 'v2 purse');
    const by = gsSubmitRequest({ playerId: 'qB', kind: 'buy', target: pu.id,
                               durationMin: 1, params: { buyerId: 'H25' } }, 20202);
    log(hr.status === 'active' && by.status === 'queued' &&
        gsFindBlockers(by).some(b => b.id === hr.id),
        'gs: v2 hire and buy on one unit serialize (paperwork conflict)');
    gsBusTick(20207);   // hire completes 20206 -> escrow activates + closes
    log(hr.status === 'completed' && by.status === 'active' &&
        gsUnitById(pu.id).owner_id === 'H25' &&
        gsDollarBalance('H25') === 100000 && !GS_LISTINGS[pu.id],
        'gs: v2 queued buy promotes after the hire and closes the sale honestly');
    const by2 = gsSubmitRequest({ playerId: 'qC', kind: 'buy', target: pu.id,
                                durationMin: 1, params: { buyerId: 'H22' } }, 20210);
    log(by2.status === 'denied' && by2.reason === 'not_listed',
        'gs: v2 a consumed listing is a standing-state denial, not a queue');

    // ---- v2: cancel now promotes — instant possession handoff (v1 hole)
    const hA = gsSubmitRequest({ playerId: 'qD', kind: 'possess', target: 'H23',
                               durationMin: 30 }, 20300);
    const hB = gsSubmitRequest({ playerId: 'qD', kind: 'possess', target: 'H23',
                               durationMin: 20 }, 20301);
    gsCancelRequest(hA.id, 20310, 'player');
    log(hA.status === 'cancelled' && hA.refunded === 80 &&
        hB.status === 'active' &&
        GS_POSSESS.H23 && GS_POSSESS.H23.reqId === hB.id,
        'gs: v2 cancelling an active request hands the resource to the line instantly');

    // ---- v2: positions + explain + the readable rule table
    const pos1 = gsSubmitRequest({ playerId: 'qE', kind: 'possess', target: 'H24',
                                 durationMin: 30 }, 20400);
    const pos2 = gsSubmitRequest({ playerId: 'qE', kind: 'possess', target: 'H24',
                                 durationMin: 30 }, 20401);
    const pos3 = gsSubmitRequest({ playerId: 'qE', kind: 'possess', target: 'H24',
                                 durationMin: 30 }, 20402);
    const pos4 = gsSubmitRequest({ playerId: 'qE', kind: 'possess', target: 'H24',
                                 durationMin: 30 }, 20403);
    const ex3 = gsExplainRequest(pos3.id);
    log(pos1.status === 'active' && gsQueuePosition(pos2.id) === 1 &&
        gsQueuePosition(pos3.id) === 2 && gsQueuePosition(pos4.id) === 3 &&
        ex3 && ex3.queuePos === 2 && ex3.blockedBy.indexOf(pos1.id) >= 0 &&
        ex3.behind.indexOf(pos2.id) >= 0 && /waiting for/.test(ex3.note),
        'gs: v2 queue positions + gsExplainRequest tell viewers exactly why');
    gsBusTick(20431);   // pos1 ends 20430 -> pos2 activates
    log(pos2.status === 'active' && gsQueuePosition(pos3.id) === 1 &&
        gsQueuePosition(pos4.id) === 2,
        'gs: v2 queue position only ever shrinks — monotonic under contention');
    log(gsConflictRules().length >= 5 &&
        gsConflictRules().every(s => typeof s === 'string' && s.length > 10),
        'gs: v2 conflict rule table is readable');

    // ---- v2: sponsored sky survives snapshot/load
    const sA = gsSubmitRequest({ playerId: 'qS', kind: 'weather', durationMin: 20,
                               params: { wx: 'fog' } }, 30000);
    const sB = gsSubmitRequest({ playerId: 'owner', kind: 'weather', durationMin: 40,
                               params: { wx: 'fog' } }, 30001);
    const snap2 = gsBusSnapshot();
    gsBusReset();
    log(gsBusLoad(snap2) && GS_WX_OVR.wx === 'fog' &&
        !!GS_WX_OVR.sponsors[sA.id] && !!GS_WX_OVR.sponsors[sB.id] &&
        gsRequestById(pos2.id).status === 'active',
        'gs: v2 sky sponsors + queues survive snapshot/load');

    // ---- bus: snapshot round-trip (v1: includes live effect state) ----
    const bSnap = gsBusSnapshot();
    const nReqs = GS_REQ.reqs.length;
    gsBusReset();
    log(gsBusLoad(bSnap) && GS_REQ.reqs.length === nReqs &&
        gsHiredOwner('H1') === 'pA' &&
        gsHiredOwner(hiredId) === 'pD' &&
        gsRequestById(fC.id).status === 'completed' &&
        GS_POSSESS.H24 && GS_POSSESS.H24.playerId === 'qE' &&   // v2: the
        gsUnitById(lu.id).owner_id === 'H10' &&   // registry is separate —
        GS_FEED.length > 0,                        // assert bus-owned state
        'gs: bus snapshot/load round-trips requests, cooldowns, hired + fx state');
  }catch(e){
    log(false, 'gs: suite threw', String(e && e.message || e));
  }finally{
    gsRegLoad(regSnap); gsLedgerLoad(ledSnap); gsBusLoad(busSnap);
  }

  const passed = res.filter(r => r.ok).length;
  if(out) out.textContent += '\n==== GS ' + passed + '/' + res.length + ' passed ====\n';
};
