/* =====================================================================
   PART 41 AUTOTEST — game-systems v0 registry/ledger/bus + v1 request
   lifecycle (real catalogue, effect dispatch, per-minute billing) +
   v2 conflicts (pairwise claims matrix, shared skies, venue permits,
   paperwork serialization, promotion ordering + handoff) +
   v3 lease lifecycle (rent run, shares/habits, arrears, violations,
   notices, eviction, raises, applications, all-28-cast housed).
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
      /* v4: the index used is stored on the record (sequential or a
         designer pin's searched index); legacy records fall back to
         scanning plausible indices */
      if(b.addr_idx != null){
        hit = gsAddrNumber(b.street, b.addr_idx) === b.hn;
      } else {
        for(let i = 0; i <= perStreet[b.street] + 16 && !hit; i++)
          if(gsAddrNumber(b.street, i) === b.hn) hit = true;
      }
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
        'gs: 9457 Guerrero flat lists Priya + Marcus as occupants');
    const b744 = GS_REG.buildings.find(b => b.bld_idx === (SF_MAP.anchors.g744 || {}).bld);
    log(!!b744 && b744.owner_id === 'C7', 'gs: 9418 Guerrero anchor is owned by C7');

    // ---- v4 canonical reconciliation (world/jobs-housing.md §3): the
    //      eight mains live at the AUTHORED addresses — pinned through
    //      the §3 formula itself, not around it ----
    const canon = [
      ['C1', '9127 Capp Street, San Francisco, CA Unit C'],
      ['C2', '9418 Guerrero Street, San Francisco, CA Unit A'],
      ['C3', '9263 Geneva Avenue, San Francisco, CA Unit 4'],
      ['C4', '9457 Guerrero Street, San Francisco, CA Unit 3'],
      ['C5', '9457 Guerrero Street, San Francisco, CA Unit 3'],
      ['C6', '9418 Guerrero Street, San Francisco, CA Unit A'],
      ['C7', '9102 Mission Street, San Francisco, CA Unit 2'],
      ['C8', '9344 Folsom Street, San Francisco, CA Unit 1'],
    ];
    let canonOk = true;
    for(const [cid, want] of canon){
      const h = gsHomeOf(cid);
      if(!h || h.address !== want) canonOk = false;
    }
    log(canonOk, 'gs: v4 all 8 mains resolve to canonical world-content addresses');
    const pinned = GS_REG.buildings.filter(b => b.canon);
    log(pinned.length === 6 &&
        pinned.every(b => b.addr_idx != null &&
          gsAddrNumber(b.street, b.addr_idx) === b.hn),
        'gs: v4 canonical pins satisfy the §3 formula at their stored index');
    log(GS_REG.buildings.filter(b => b.offmap).length === 2 &&
        !!GS_REG.buildings.find(b => b.street === 'Geneva Avenue') &&
        !!GS_REG.buildings.find(b => b.street === 'Folsom Street'),
        'gs: v4 off-map canonical homes (Geneva, Folsom) are real registry places');
    const lG = gsLeasesFor('reyes-cousins').find(l => l.status === 'active');
    log(!!lG && gsHomeOf('C3').via === 'unpermitted' &&
        gsHomeOf('C3').unit_id === lG.unit_id &&
        gsDollarBalance('reyes-cousins') > 0,
        'gs: v4 Dani resolves through the cousins\' lease — off-paperwork room share');
    const c4l0 = gsLeasesFor('C4').find(l => l.status === 'active');
    log(!!c4l0 && c4l0.monthly_rent === 3200 &&
        c4l0.raiseHist.some(r => r.from === 2600 && r.to === 3200) &&
        (c4l0.disputes || []).some(d => d.kind === 'rent_raise' &&
          d.status === 'open'),
        'gs: v4 the contested 2600→3200 raise is on the books, still open');
    const b9457 = GS_REG.buildings.find(b => b.canon === 'home-c4c5');
    const u9457_1 = b9457 &&
      gsUnitsOf(b9457.id).find(u => u.unit_code === '1');
    const lAmb = u9457_1 && gsActiveLease(u9457_1.id);
    log(!!lAmb && /^A\d\d$/.test(lAmb.tenant_id),
        'gs: v4 an ambient household holds 9457-1 (canonical detail)');

    // ---- v3: the whole cast is housed through the lease system ----
    const housed = gsCastHousing();
    log(housed.total === 28 && housed.housed === 28 && housed.missing.length === 0,
        'gs: v3 all 28 cast members resolve to a registry unit',
        housed.missing.join(',') || 'none missing');
    log(housed.map['C2'] && housed.map['C2'].via === 'unpermitted' &&
        housed.map['C2'].unit_id === c6.unit_id,
        'gs: v3 Jules resolves to 744 through the unpermitted-occupant record');
    log(housed.map['C7'] && housed.map['C7'].via === 'owner',
        'gs: v3 Victor resolves as owner-occupied above the shop');
    const ambOk = NV_CAST.filter(c => c.tier === 'ambient').every(c => {
      const h = housed.map[c.id];
      return h && h.via === 'lease' && /^9\d{3} /.test(h.address || '');
    });
    log(ambOk, 'gs: v3 all 20 ambient cast hold real 9xxx leases on map buildings');
    const c4l = gsLeasesFor('C4').find(l => l.status === 'active');
    log(!!c4l && c4l.shares && c4l.shares.C5 && c4l.shares.C5.lateEvery === 3 &&
        c4l.shares.C5.amt + c4l.shares.C4.amt === c4l.monthly_rent,
        'gs: v3 the 750 flat splits shares; Marcus is late every third month');
    const jvio = c6 && (c6.violations || []).find(v => v.who === 'C2');
    log(!!jvio && jvio.status === 'open' && jvio.discovered === false,
        'gs: v3 Jules\'s violation is recorded, open, and undiscovered');
    const enriched = GS_REG.leases.filter(l => l.gsV3);
    log(enriched.length === GS_REG.leases.length && enriched.length >= 26,
        'gs: v3 every seeded lease carries lifecycle fields',
        enriched.length + ' leases');
    log(gsDollarBalance('C6') > 0 && gsDollarBalance('A01') > 0 &&
        gsDollarBalance('A20') > 0,
        'gs: v3 cast bank balances seeded — the rent run moves real dollars');

    // ---- v4: the live seed survives its own audit ----
    const audSF = gsRegistryAudit();
    log(audSF.ok === true,
        'gs: v4 audit passes on the live SF seed',
        audSF.issues.slice(0, 3).join('; ') || 'clean');
    const stSF = gsRegistryStats();
    log(stSF.buildings === GS_REG.buildings.length &&
        stSF.units === GS_REG.units.length &&
        stSF.units > stSF.buildings &&      // multi-unit stock is real now
        stSF.withdrawn === 0,
        'gs: v4 registry stats — more units than buildings, none withdrawn',
        stSF.units + ' units / ' + stSF.buildings + ' buildings');

    // ---- v4: real unit counts — a real "a;b;c" address list means real
    //      doors; the seed must mint exactly that many units ----
    let multiOk = true, multiChecked = 0;
    for(const b of GS_REG.buildings){
      if(b.bld_idx == null) continue;
      if(b.canon) continue;             // canonical homes carry authored
                                       // units — content, not derivation
      const mb = SF_MAP.buildings[b.bld_idx];
      /* only generically-seeded stock is derivable — cast homes carry
         authored units by design (kind 'yes' is never auto-seeded) */
      if(!mb || !GS_RES_KINDS[mb.kind]) continue;
      if(!mb.hn || !mb.hn.includes(';')) continue;
      const want = Math.min(
        mb.hn.split(';').filter(s => s.trim()).length, 12);
      multiChecked++;
      if(gsUnitsOf(b.id).filter(u => (u.status || 'active') === 'active')
          .length !== want) multiOk = false;
    }
    log(multiChecked > 20 && multiOk,
        'gs: v4 real address counts drive real unit counts',
        multiChecked + ' multi-address buildings checked');

    // ---- v4: spec §8 executed — every bible HOUSEHOLD resolves to its
    //      CANONICAL address (world/jobs-housing.md §3 verbatim) ----
    const book = gsCastAddressBook();
    log(book.length === 28 &&
        book.every(r => r.address && /^9\d{3} /.test(r.address)) &&
        book.filter(r => r.bibleRef).length === 8 &&
        book.filter(r => r.offmap).length === 2 &&
        book.filter(r => r.offmap).every(r => r.cid === 'C3' ||
          r.cid === 'C8'),
        'gs: v4 cast address book — all 28 on 9xxx, 8 canonical refs, 2 off-map');
    const mig = gsBibleMigrationReport();
    log(mig.ok === true &&
        mig.rows.every(r => r.status === 'ok') &&
        mig.rows.find(r => r.cid === 'C2').via === 'unpermitted' &&
        mig.rows.find(r => r.cid === 'C3').via === 'unpermitted',
        'gs: v4 bible migration — every HOUSEHOLD matches its canonical address');
  }

  /* ---------- isolated unit tests on reset state ---------- */
  const regSnap = gsRegSnapshot(), ledSnap = gsLedgerSnapshot(),
        busSnap = gsBusSnapshot(), leaseSnap = gsLeaseSnapshot();
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
    /* v7: weather + street_event are the contract's exclusive class —
       they park in_review for a human before they ever touch the world */
    log(wx.status === 'in_review' && ev.status === 'in_review' &&
        wx.lane === 'exclusive' && ev.lane === 'exclusive',
        'gs: v7 exclusive-class filings park in human review on sight');
    gsReviewResolve(wx.id, true, { nowMin: 1 });
    gsReviewResolve(ev.id, true, { nowMin: 1 });
    log(wx.status === 'active' && ev.status === 'active',
        'gs: benign weather + outdoor event co-run once cleared (v2: compatible classes)');

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
                                 params: { wx: 'clear' } }, 380);
    gsReviewResolve(wA.id, true, { nowMin: 380 });   // v7: exclusive lane
    gsBusTick(391);   /* the sky rests 4h after any weather call — the v7
                       contract cooldown (requests.json exclusive class) */
    const wOther = gsSubmitRequest({ playerId: 'pB', kind: 'weather', durationMin: 10,
                                     params: { wx: 'rain' } }, 392);
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
        gsCreditBalance('pA') === balK + kQ.billed + kA.billed,
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
    gsReviewResolve(wxR.id, true, { nowMin: 3000 }); // v7: review clears it
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
    gsReviewResolve(ev1.id, true, { nowMin: 9000 }); // v7: exclusive lane
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
                                   params: { name: 'Newcomer Nan',
                                     job: 'farolote-line',
                                     moveInDate: '2026-09-22' } }, 4000);
    /* v7: player-authored naming strings always route through the naming
       lane — a human reads 'Newcomer Nan' before the character exists.
       v8: the flat 500 is deferred to that approval — screening first,
       money second, and a denied application never bills at all. */
    const hireParked = hire.status === 'in_review' && hire.billed === 0 &&
                       hire.deferred === true;
    gsReviewResolve(hire.id, true, { nowMin: 4000 });
    const hiredId = Object.keys(GS_HIRED).find(k =>
      GS_HIRED[k] && GS_HIRED[k].unitId === hu.id);
    const hire2 = gsSubmitRequest({ playerId: 'pD', kind: 'hire', target: hu.id,
                                    durationMin: 5 }, 4001);
    log(hireParked && hire.status === 'active' && hire.billed === 500 &&
        hiredId && /^h\d\d$/.test(hiredId) &&
        gsHiredOwner(hiredId) === 'pD' &&
        gsActiveLease(hu.id) && gsActiveLease(hu.id).tenant_id === hiredId &&
        gsActiveLease(hu.id).deposit === 0 &&
        gsActiveLease(hu.id).hirePackage === true &&
        gsDollarBalance(hiredId) === 1600 - 600 &&  // bank - pro-rated 9 days
        GS_JOBS.find(j => j.id === 'farolote-line').openings === 0 &&
        hire2.reason === 'unit_occupied',
        'gs: v8 hire — deferred 500 on approval, h## id, hire-package ' +
        'lease, arrival bank minus pro-rated first month, opening consumed');
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
    log(br && br.name === 'Newcomer Nan' &&
        /Hire Street/.test((br.home && br.home.address) || br.home || '') &&
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
        sq2.refunded === sq2.billed &&
        gsCreditBalance('pD') === sq2Bal + sq2.billed &&
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
    /* v7: every sky filing lands in_review first — the exclusive lane
       reviews BEFORE the world sees anything; approvals re-enter the
       line at approval-time with a fresh sequence */
    log(wxA.status === 'in_review' && wxC.status === 'in_review' &&
        wxB.status === 'in_review',
        'gs: v7 all weather filings park in_review (exclusive lane)');
    gsReviewResolve(wxA.id, true, { nowMin: 20000, by: 'mod-a' });
    gsReviewResolve(wxC.id, true, { nowMin: 20001, by: 'mod-a' });
    gsReviewResolve(wxB.id, true, { nowMin: 20002, by: 'mod-a' });
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
    /* v7: wxB was already human-reviewed at filing — it activates straight
       off the queue. evM/evT were never reviewed, so they park AT
       ACTIVATION (requests.json: 'review happens on activation') holding
       their FCFS slots — wxD stays queued behind wxB's running sky */
    log(wxC.status === 'completed' &&
        wxB.status === 'active' &&
        evM.status === 'in_review' && evM.holdsLine === true &&
        evT.status === 'in_review' && evT.holdsLine === true &&
        wxD.status === 'queued' &&
        gsFindBlockers(wxD).some(b => b.id === wxB.id),
        'gs: v7 promoted exclusives review at activation, still holding the line');
    gsReviewResolve(evM.id, true, { nowMin: 20052, by: 'mod-a' });
    gsReviewResolve(evT.id, true, { nowMin: 20052, by: 'mod-a' });
    const approv = GS_FEED.filter(e => e.type === 'approve' &&
                                       e.min === 20052);
    log(GS_WX_OVR.wx === 'heatwave' &&
        wxB.status === 'active' && evM.status === 'active' &&
        evT.status === 'active' && wxD.status === 'queued' &&
        approv.length === 3 &&
        approv[0].req === wxB.id && approv[1].req === evM.id &&
        approv[2].req === evT.id,
        'gs: v2 cascade promotes heatwave + market + tour in strict FCFS order');
    log(allQueuedBlocked(), 'gs: v2 invariant holds after the cascade');
    gsBusTick(20083);   // heatwave + mural tour end at 20082
    log(wxD.status === 'expired' && wxD.refunded === wxD.billed,
        'gs: v2 queued request that never unblocks before TTL refunds in full');

    // ---- v2/v7: venue permits — one event per location, then the venue
    //      RESTS 24h (requests.json: one event per resource per day).
    //      The rest is stamped at activation; a filing into a resting
    //      venue is refused honestly ('venue_rest'), not queued.
    const evP = gsSubmitRequest({ playerId: 'qA', kind: 'street_event',
        durationMin: 40, params: { event: 'parade', at: 'Valencia Street' } }, 20100);
    gsReviewResolve(evP.id, true, { nowMin: 20100, by: 'mod-a' });
    const evB = gsSubmitRequest({ playerId: 'qB', kind: 'street_event',
        durationMin: 30, params: { event: 'block_party',
                                   at: '  VALENCIA   Street ' } }, 20101);
    const evF = gsSubmitRequest({ playerId: 'qC', kind: 'street_event',
        durationMin: 30, params: { event: 'street_fair', at: 'Mission Street' } }, 20102);
    const evR = gsSubmitRequest({ playerId: 'qF', kind: 'street_event',
        durationMin: 20, params: { event: 'mural_tour', at: 'Valencia Street' } }, 20103);
    gsReviewResolve(evF.id, true, { nowMin: 20102, by: 'mod-a' });
    gsReviewResolve(evR.id, true, { nowMin: 20103, by: 'mod-a' });
    log(evP.status === 'active' &&
        evB.status === 'denied' && evB.reason === 'venue_rest' &&
        evF.status === 'active' && evR.status === 'active' &&
        gsNormVenue('  VALENCIA   Street ') === 'valencia street' &&
        gsResourceBoard(20105)['venue:valencia street'].state === 'locked',
        'gs: v7 one permit per venue per 24h — rest is denied, not queued');
    /* the venue stays off-limits for the whole 24h rest — later same-
       venue filings are refused outright, not parked or queued */
    const evP2 = gsSubmitRequest({ playerId: 'qD', kind: 'street_event',
        durationMin: 30, params: { event: 'street_fair', at: 'Valencia Street' } }, 20110);
    log(evP2.status === 'denied' && evP2.reason === 'venue_rest',
        'gs: v7 the venue stays off-limits for the whole rest window');
    /* severe weather may not be summoned over a running event either —
       the sky rests 4h after the last weather call (contract cooldown_h),
       so this probe runs on a fresh venue once the global cooldown frees */
    const evX = gsSubmitRequest({ playerId: 'qD', kind: 'street_event',
        durationMin: 40, params: { event: 'street_fair',
                                   at: 'Precita Park' } }, 20330);
    gsReviewResolve(evX.id, true, { nowMin: 20330, by: 'mod-a' });
    const stQ = gsSubmitRequest({ playerId: 'qE', kind: 'weather', durationMin: 10,
                                params: { wx: 'storm' } }, 20331);
    log(evX.status === 'active' && stQ.status === 'queued' &&
        gsFindBlockers(stQ).some(b => b.id === evX.id),
        'gs: v2 you cannot summon a storm over a permitted outdoor event');
    gsBusTick(20371);   // street fair ends 20370 -> storm reaches its slot...
    log(evX.status === 'completed' && stQ.status === 'in_review' &&
        stQ.holdsLine === true,
        'gs: v7 the promoted storm parks at activation for its human read');
    gsReviewResolve(stQ.id, true, { nowMin: 20371, by: 'mod-a' });
    log(stQ.status === 'active' && GS_WX_OVR.wx === 'storm' &&
        gsResourceBoard(20372)['venue:valencia street'].state === 'cool' &&
        gsResourceBoard(20372)['venue:valencia street'].leftMin > 1000,
        'gs: v2+v7 the storm runs once cleared — and the used venue ' +
        'rests on the board for its full 24h');
    gsBusTick(20390);   // storm ends 20381 -> the sky goes quiet

    // ---- v2: registry paperwork serializes — a buy waits behind a hire
    const pb = gsRegisterBuilding({ street: 'Escrow Street', owner_id: 'landlord' });
    const pu = gsRegisterUnit(pb.id, { unit_code: 'A', base_rent: 2200 });
    gsSubmitRequest({ playerId: 'owner', kind: 'listing', target: pu.id,
                      durationMin: 60, params: { ask: 300000 } }, 20200);
    const hr = gsSubmitRequest({ playerId: 'qA', kind: 'hire', target: pu.id,
                               durationMin: 5, params: { name: 'Tenant Tess' } }, 20201);
    gsReviewResolve(hr.id, true, { nowMin: 20201, by: 'mod-a' }); // naming lane
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
    gsReviewResolve(sA.id, true, { nowMin: 30000, by: 'mod-a' });  // exclusive lane
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

    // ================= v3: THE LEASE LIFECYCLE =================
    // the rent run: charges post on the due day, shares auto-pay,
    // pro-rated first months, late fees after grace, arrears accrue.

    // ---- v3: signing enriches the lease + pro-rated first month ----
    const vb = gsRegisterBuilding({ street: 'Vida Street', owner_id: 'll-vida' });
    const vu = gsRegisterUnit(vb.id, { unit_code: 'A', base_rent: 2000,
                                       rent_controlled: true });
    gsDollarGrant('T7', 9000, 'savings'); gsDollarGrant('T8', 4000, 'savings');
    gsSignLease(vu.id, 'T7', { start: '2026-09-10', monthly_rent: 2000,
      occupants: ['T7', 'T8'],
      shares: { T7: { amt: 1200 }, T8: { amt: 800, lateEvery: 3, lateDays: 8 } } });
    const lv = gsActiveLease(vu.id);
    log(!!lv && lv.gsV3 === 1 && lv.dueDay === 10 && lv.deposit === 2000 &&
        Array.isArray(lv.charges) && Array.isArray(lv.notices) &&
        Array.isArray(lv.violations) && lv.term === 'month-to-month',
        'gs: v3 signing enriches the lease with lifecycle fields');
    gsRentTick('2026-09-10');   // move-in day — pro-rated Sep charge
    const ch0 = lv.charges[0];
    log(!!ch0 && ch0.kind === 'rent' && ch0.amt === 1400 &&
        ch0.status === 'paid' && gsDollarBalance('T7') === 8160 &&
        gsDollarBalance('T8') === 3440 && gsLeaseOwner(lv) === 'll-vida' &&
        gsDollarBalance('ll-vida') === 1400 &&
        GS_FEED.some(e => e.type === 'lease' && e.action === 'rent_paid' &&
                          e.unit === vu.id),
        'gs: v3 mid-month move-in posts a pro-rated charge, shares auto-pay');
    gsRentTick('2026-10-05');   // before the 10th — nothing posts yet
    log(lv.charges.length === 1,
        'gs: v3 no charge lands before the due day');
    gsRentTick('2026-10-10');   // Oct charge: seq 2 — T8 still on time
    log(lv.charges.length === 2 && lv.charges[1].amt === 2000 &&
        lv.charges[1].status === 'paid' &&
        gsDollarBalance('T7') === 6960 && gsDollarBalance('T8') === 2640,
        'gs: v3 monthly charge posts on the due day, split by shares');
    gsRentTick('2026-11-10');   // Nov charge: seq 3 — T8's habit defers
    gsRentTick('2026-11-16');   // grace lapsed -> late fee lands on T8 only
    const owedLv = gsLeaseOwed(lv);
    log(lv.charges[2].late === true && lv.charges[2].lateFee === 40 &&
        owedLv.total === 840 && owedLv.by.T8 === 840 && !owedLv.by.T7 &&
        gsDollarBalance('T7') === 5760,
        'gs: v3 the habitual-late share defers, earns its own late fee');
    gsRentTick('2026-11-18');   // catch-up day — T8 pays rent + fee
    log(lv.charges[2].status === 'paid' && gsDollarBalance('T8') === 1800 &&
        gsLeaseOwed(lv).total === 0,
        'gs: v3 the scheduled catch-up clears rent + fee honestly');

    // ---- v3: arrears across missed months -> pay-or-quit -> eviction ----
    const eb = gsRegisterBuilding({ street: 'Eviction Street', owner_id: 'landlord' });
    const eu = gsRegisterUnit(eb.id, { unit_code: 'A', base_rent: 1500 });
    gsDollarGrant('T9', 100, 'nearly broke');
    gsSignLease(eu.id, 'T9', { start: '2026-08-01', monthly_rent: 1500 });
    const el = gsActiveLease(eu.id);
    const euAddr = gsAddressOfUnit(eu.id);
    gsRentTick('2026-08-01');   // Aug charge: T9 pays only the 100 they have
    log(gsLeaseOwed(el).total === 1400,
        'gs: v3 partial payment leaves the shortfall as arrears');
    gsRentTick('2026-08-07');   // past grace -> 5% late fee
    gsRentTick('2026-10-02');   // Sep + Oct post late (books ran behind)
    const owedEl = gsLeaseOwed(el);
    log(owedEl.total === 4545 && owedEl.by.T9 === 4545 &&
        el.charges.filter(c => c.late).length === 2,
        'gs: v3 arrears + capped late fees accumulate across missed months');
    const noNotice = gsAdminEvict(eu.id, { date: '2026-10-02' });
    log(!noNotice.ok && noNotice.reason === 'no_executable_notice',
        'gs: v3 eviction refused without an executable notice');
    const nt = gsServeNotice(eu.id, 'pay_or_quit', { date: '2026-10-02' });
    log(nt.ok && nt.notice.deadline === '2026-10-05' &&
        nt.notice.status === 'open',
        'gs: v3 pay-or-quit needs arrears and carries a 3-day window');
    gsRentTick('2026-10-06');   // deadline passed, still owed
    log(nt.notice.status === 'executable' &&
        GS_FEED.some(e => e.type === 'lease' &&
                          e.action === 'notice_executable' && e.unit === eu.id),
        'gs: v3 an unpaid pay-or-quit becomes executable');
    const evRes = gsAdminEvict(eu.id, { date: '2026-10-07', reason: 'nonpayment' });
    const rel = gsSignLease(eu.id, 'T10', { start: '2026-10-15',
                                          monthly_rent: 1500 });
    log(evRes.ok && !evRes.noFault && el.status === 'evicted' &&
        !gsActiveLease(eu.id) === false && nt.notice.status === 'executed' &&
        gsActiveLease(eu.id) === rel &&
        gsAddressOfUnit(eu.id) === euAddr &&
        GS_FEED.some(e => e.type === 'lease' && e.action === 'evict' &&
                          e.unit === eu.id && e.noFault === false),
        'gs: v3 eviction ends the lease, frees the unit, keeps the address');

    // ---- v3: curing a pay-or-quit inside the window stops the eviction ----
    const cb2 = gsRegisterBuilding({ street: 'Cure Street', owner_id: 'landlord' });
    const cu2 = gsRegisterUnit(cb2.id, { unit_code: 'A', base_rent: 1000 });
    gsDollarGrant('T11', 400, 'light savings');
    gsSignLease(cu2.id, 'T11', { start: '2026-09-01', monthly_rent: 1000 });
    const cl = gsActiveLease(cu2.id);
    gsRentTick('2026-09-01');   // pays 400 of 1000
    gsRentTick('2026-09-07');   // late fee 30 -> owed 630
    const cn0 = gsServeNotice(cu2.id, 'pay_or_quit', { date: '2026-09-08' });
    gsDollarGrant('T11', 5000, 'paycheck');
    const paidUp = gsPayRent(cu2.id, 'T11', 5000, '2026-09-09');
    gsRentTick('2026-09-10');   // inside the 3-day window, owed == 0
    const evDeny = gsAdminEvict(cu2.id, { date: '2026-09-12' });
    log(cn0.ok && paidUp.ok && paidUp.paid === 630 &&
        cn0.notice.status === 'cured' && gsLeaseOwed(cl).total === 0 &&
        !evDeny.ok && gsActiveLease(cu2.id) === cl,
        'gs: v3 paying arrears inside the window cures the notice');

    // ---- v3: the Jules arc — violation -> inspect -> cure-or-quit -> cure
    const jb = gsRegisterBuilding({ street: 'Junit Street', owner_id: 'landlord' });
    const ju = gsRegisterUnit(jb.id, { unit_code: 'A', base_rent: 1400,
                                       rent_controlled: true });
    gsSignLease(ju.id, 'TH', { start: '2020-01-01', monthly_rent: 1400,
                               occupants: ['TH'] });
    const jl = gsActiveLease(ju.id);
    const vio = gsRecordViolation(ju.id, { kind: 'unpermitted_occupant',
      who: 'TJ', since: '2026-01-01' });
    log(!!vio && vio.discovered === false &&
        gsHomeOf('TJ').via === 'unpermitted' &&
        gsHomeOf('TJ').unit_id === ju.id &&
        gsResidentsOf(ju.id).indexOf('TJ') >= 0 &&
        !GS_FEED.some(e => e.type === 'lease' && e.action === 'violation' &&
                           e.unit === ju.id),
        'gs: v3 unpermitted occupant resolves as resident; stays off the feed');
    const tooSoon = gsServeNotice(ju.id, 'cure_or_quit', { date: '2026-10-01' });
    log(!tooSoon.ok && tooSoon.reason === 'no_discovered_violation',
        'gs: v3 no cure notice on a violation the landlord cannot know');
    gsInspectUnit(ju.id, { date: '2026-10-02' });
    log(vio.discovered === true &&
        GS_FEED.some(e => e.type === 'lease' && e.action === 'violation' &&
                          e.violId === vio.id && e.via === 'inspection'),
        'gs: v3 inspection surfaces the violation to the public record');
    const cn2 = gsServeNotice(ju.id, 'cure_or_quit', { date: '2026-10-02' });
    gsCureViolation(ju.id, vio.id, { how: 'added_to_lease', date: '2026-10-03' });
    gsRentTick('2026-10-06');   // past the deadline, but cured in time
    log(cn2.ok && cn2.notice.status === 'cured' &&
        jl.occupants.indexOf('TJ') >= 0 && jl.shares.TJ && jl.shares.TJ.amt === 0,
        'gs: v3 cure-or-quit cured by putting the occupant on the lease');
    const vio2 = gsRecordViolation(ju.id, { kind: 'unpermitted_occupant',
      who: 'TJ2', since: '2026-10-01', discovered: true });
    gsCureViolation(ju.id, vio2.id, { how: 'departed', date: '2026-10-04' });
    log(vio2.status === 'cured' && gsHomeOf('TJ2') === null,
        'gs: v3 a departed occupant stops resolving to the unit');

    // ---- v3: rent raises respect the ordinance ----
    const rb2 = gsRegisterBuilding({ street: 'Raise Street', owner_id: 'landlord' });
    const ru2 = gsRegisterUnit(rb2.id, { unit_code: 'A', base_rent: 2000,
                                         rent_controlled: true });
    const ruM = gsRegisterUnit(rb2.id, { unit_code: 'B', base_rent: 2000,
                                         rent_controlled: false });
    gsDollarGrant('T12', 40000, 'savings');
    gsSignLease(ru2.id, 'T12', { start: '2020-01-01', monthly_rent: 2000 });
    const rl = gsActiveLease(ru2.id);
    const over = gsRaiseRent(ru2.id, 2300, { date: '2026-10-01' });
    const okRaise = gsRaiseRent(ru2.id, 2140, { date: '2026-10-01' });
    log(!over.ok && over.reason === 'raise_over_cap' && over.max === 2140 &&
        okRaise.ok && okRaise.effectiveOn === '2026-10-31',
        'gs: v3 controlled-unit raises cap at 7% with 30-day notice');
    gsRentTick('2026-10-15');
    const rentMid = rl.monthly_rent;
    gsRentTick('2026-11-01');   // raise effective -> Nov charge bills new rent
    const novCh = rl.charges.find(c => c.period === '2026-11');
    log(rentMid === 2000 && rl.monthly_rent === 2140 &&
        rl.raiseHist.length === 1 && rl.pendingRaise === null &&
        novCh && novCh.amt === 2140,
        'gs: v3 the raise takes effect on its date; November bills it');
    const again = gsRaiseRent(ru2.id, 2200, { date: '2026-11-15' });
    const fresh = gsRaiseRent(ruM.id, 9999, { date: '2026-10-02' });
    log(!again.ok && again.reason === 'raise_too_soon' &&
        fresh && !fresh.ok && fresh.reason === 'no_active_lease',
        'gs: v3 one raise per 12 months; vacant units cannot be raised');

    // ---- v3: fixed terms roll to month-to-month; tenants can vacate ----
    const fb = gsRegisterBuilding({ street: 'Fixed Street', owner_id: 'landlord' });
    const fu = gsRegisterUnit(fb.id, { unit_code: 'A', base_rent: 1800 });
    gsDollarGrant('T13', 20000, 'savings');
    gsSignLease(fu.id, 'T13', { start: '2025-10-01', monthly_rent: 1800,
                                term: 'fixed', endOn: '2026-09-30' });
    const fl = gsActiveLease(fu.id);
    const roll = gsRentTick('2026-10-02');
    log(fl.term === 'month-to-month' && fl.endOn === null &&
        roll.rolled.indexOf(fu.id) >= 0,
        'gs: v3 a lapsed fixed term rolls to month-to-month (CA default)');
    const vac = gsVacate(fu.id, { date: '2026-10-20' });
    log(vac.ok && fl.status === 'ended' && !gsActiveLease(fu.id) &&
        gsHomeOf('T13') === null,
        'gs: v3 tenant vacate ends the lease and un-homes them');

    // ---- v3: applications — apply -> approve -> signed + deposit ----
    const ab = gsRegisterBuilding({ street: 'Apply Street', owner_id: 'landlord' });
    const au = gsRegisterUnit(ab.id, { unit_code: 'A', base_rent: 1600 });
    gsDollarGrant('T14', 10000, 'savings');
    const app = gsApplyForLease(au.id, 'T14', { date: '2026-10-01' });
    const dupApp = gsApplyForLease(au.id, 'T14', { date: '2026-10-01' });
    const apOk = gsApproveApplication(app.id, { date: '2026-10-05' });
    const stApp = gsLeaseStatement(au.id);
    log(app.status === 'approved' && apOk.ok &&
        stApp.tenant === 'T14' &&
        stApp.charges.some(c => c.kind === 'deposit' && c.amt === 1600 &&
                                c.status === 'paid') &&
        gsDollarBalance('T14') === 8400 &&
        (!dupApp.ok && dupApp.reason === 'already_applied'),
        'gs: v3 application approves into a signed lease + paid deposit');
    const app2 = gsApplyForLease(au.id, 'T15', { date: '2026-10-06' });
    const apOcc = gsApproveApplication(app2.id, { date: '2026-10-07' });
    gsDenyApplication(app2.id, { date: '2026-10-08', reason: 'waitlist' });
    log(!apOcc.ok && apOcc.reason === 'unit_occupied' &&
        app2.status === 'denied',
        'gs: v3 occupied units cannot be signed into; denials record honestly');

    // ---- v3: evicting a hired character un-homes it; overrides post noFault
    const hb3 = gsRegisterBuilding({ street: 'Hired Street', owner_id: 'landlord' });
    const hu3 = gsRegisterUnit(hb3.id, { unit_code: 'A', base_rent: 1000 });
    gsMarkHired('H40', 'qA', { unitId: hu3.id });
    gsSignLease(hu3.id, 'H40', { start: '2026-09-01', monthly_rent: 1000,
                                 occupants: ['H40'] });
    gsRentTick('2026-09-01');   // H40 has no dollars -> full arrears
    gsServeNotice(hu3.id, 'pay_or_quit', { date: '2026-09-02' });
    gsRentTick('2026-09-06');   // deadline lapsed -> executable
    const evH = gsAdminEvict(hu3.id, { date: '2026-09-07' });
    log(evH.ok && GS_HIRED.H40 && GS_HIRED.H40.unitId === null &&
        gsHomeOf('H40') === null,
        'gs: v3 evicting a hired character strips its registered home');
    const hb4 = gsRegisterBuilding({ street: 'Owner Street', owner_id: 'landlord' });
    const hu4 = gsRegisterUnit(hb4.id, { unit_code: 'A', base_rent: 1200 });
    gsDollarGrant('T20', 9999, 'savings');
    gsSignLease(hu4.id, 'T20', { start: '2026-09-01', monthly_rent: 1200 });
    const evNoFault = gsAdminEvict(hu4.id, { date: '2026-09-10',
      override: true, reason: 'owner move-in' });
    log(evNoFault.ok && evNoFault.noFault === true &&
        GS_FEED.some(e => e.type === 'lease' && e.action === 'evict' &&
                          e.unit === hu4.id && e.noFault === true),
        'gs: v3 owner override evicts without notice — publicly flagged noFault');

    // ---- v3: admin views + snapshot round-trip of lifecycle state ----
    const book = gsLeaseBook();
    const bookRow = book.find(r => r.unit === vu.id);
    log(Array.isArray(book) && bookRow && bookRow.rent === 2000 &&
        book.every(r => /^9\d{3} /.test(r.address)),
        'gs: v3 the landlord rent roll reads real addresses + balances');
    const stV = gsLeaseStatement(vu.id);
    log(stV && stV.tenant === 'T7' && stV.charges.length === 3 &&
        stV.owed.total === 0 && stV.residents.indexOf('T8') >= 0,
        'gs: v3 per-unit statement shows charges, shares, residents');
    const lSnap2 = gsRegSnapshot(), sSnap2 = gsLeaseSnapshot();
    gsRegistryReset();
    const reLoaded = gsRegLoad(lSnap2) && gsLeaseLoad(sSnap2);
    const reEl = GS_REG.leases.find(l => l.unit_id === eu.id);
    const reLv = gsActiveLease(vu.id);
    log(reLoaded && reEl && reEl.status === 'evicted' &&
        reEl.noFault === false && reEl.charges.length === 3 &&
        reLv && reLv.shares.T8.lateEvery === 3 &&
        GS_LEASE.apps.length > 0,
        'gs: v3 lifecycle state survives registry+lease snapshot/load');

    // ================= v4: ADDRESS REGISTRY HARDENING =================
    // spec §2 unit codes, livability gates, the §6 clerk ops (subdivide /
    // garage conversion / merge / retire), parse+lookup APIs, the audit,
    // and the bible migration cross-check.

    // ---- v4: unit codes are spec-format, unique per building, auto ----
    const cb1 = gsRegisterBuilding({ street: 'Code Street' });
    const cU = gsRegisterUnit(cb1.id, { unit_code: 'A' });
    const dupC = gsRegisterUnit(cb1.id, { unit_code: 'A' });
    const badC = gsRegisterUnit(cb1.id, { unit_code: 'TOO LONG!' });
    const autoC = gsRegisterUnit(cb1.id, { autoCode: true });
    log(!!cU && dupC === null && badC === null &&
        autoC && autoC.unit_code === 'B' && autoC.status === 'active' &&
        autoC.origin === 'seed',
        'gs: v4 unit codes — spec format enforced, dupes refused, auto assigns next');

    // ---- v4: subdivision mints new codes under an UNCHANGED address ----
    const sb = gsRegisterBuilding({ street: 'Split Street', owner_id: 'landlord' });
    const su = gsRegisterUnit(sb.id, { unit_code: 'A', bedrooms: 4,
                                       base_rent: 3200, rent_controlled: true });
    const sAddr = sb.address;
    const parts = gsSubdivideUnit(su.id, { n: 2 });
    const splitOk = parts && parts.length === 2 && su.status === 'split' &&
      parts[0].unit_code === 'A1' && parts[1].unit_code === 'A2' &&
      parts[0].bedrooms === 2 && parts[1].bedrooms === 2 &&
      parts[0].base_rent + parts[1].base_rent === 3200 &&
      parts.every(u => u.rent_controlled && u.origin === 'subdivide') &&
      sb.address === sAddr &&
      gsAddressOfUnit(parts[0].id) === sAddr + ' Unit A1';
    log(!!splitOk,
        'gs: v4 subdivide retires the flat, mints A1/A2, same address');
    log(gsSignLease(su.id, 'T40', { start: '2026-01-01' }) === null &&
        !gsUnitLivable(su) && !gsActiveLease(su.id),
        'gs: v4 a split unit can never be leased again');
    const hb50 = gsRegisterBuilding({ street: 'Hold Street' });
    const hu50 = gsRegisterUnit(hb50.id, { unit_code: 'A', bedrooms: 3 });
    gsSignLease(hu50.id, 'T30', { start: '2026-01-01', monthly_rent: 2000 });
    const studio = gsRegisterUnit(hb50.id, { unit_code: 'B', bedrooms: 1 });
    gsMarkHired('H50', 'qA', { unitId: studio.id });
    const studio2b = gsRegisterBuilding({ street: 'Tiny Street' });
    const stu = gsRegisterUnit(studio2b.id, { unit_code: 'A', bedrooms: 1 });
    log(gsSubdivideUnit(hu50.id) === null && hu50.status === 'active' &&
        gsSubdivideUnit(studio.id) === null &&
        gsSubdivideUnit(stu.id) === null && stu.status === 'active',
        'gs: v4 leased/hired/studio units refuse subdivision honestly');

    // ---- v4: garage conversion — one ADU per lot, same address ----
    const gb = gsRegisterBuilding({ street: 'Garage Street' });
    const gu = gsRegisterUnit(gb.id, { unit_code: 'A', bedrooms: 3 });
    const adu = gsConvertGarage(gb.id, { base_rent: 1500 });
    const adu2 = gsConvertGarage(gb.id);
    log(!!adu && adu.unit_code === 'G' && adu.origin === 'garage_conversion' &&
        adu.rent_controlled === false && gb.units.length === 2 &&
        gsAddressOfUnit(adu.id) === gb.address + ' Unit G' && adu2 === null,
        'gs: v4 garage conversion mints Unit G once under the same address');
    const aduLease = gsSignLease(adu.id, 'T41', { start: '2026-10-01',
                                                  monthly_rent: 1500 });
    log(!!aduLease && gsHomeOf('T41').unit_id === adu.id,
        'gs: v4 the ADU is a real leasable home');

    // ---- v4: merge two vacant units; codes retire, never recycle ----
    const mb2 = gsRegisterBuilding({ street: 'Merge Street' });
    const mA = gsRegisterUnit(mb2.id, { unit_code: 'A', bedrooms: 1,
                                        base_rent: 1200, rent_controlled: true });
    const mB = gsRegisterUnit(mb2.id, { unit_code: 'B', bedrooms: 1,
                                        base_rent: 1300, rent_controlled: true });
    const mNew = gsMergeUnits(mA.id, mB.id);
    const mAuto = gsRegisterUnit(mb2.id, { autoCode: true });
    log(!!mNew && mNew.unit_code === 'C' && mNew.bedrooms === 2 &&
        mNew.base_rent === 2500 && mNew.rent_controlled === true &&
        mA.status === 'merged' && mB.status === 'merged' &&
        mA.mergedInto === mNew.id && mAuto.unit_code === 'D',
        'gs: v4 merge withdraws both flats; merged codes stay retired');

    // ---- v4: retire a unit — code never recycles; leased units refuse ----
    const rb3 = gsRegisterBuilding({ street: 'Rewind Street' });
    const rA = gsRegisterUnit(rb3.id, { unit_code: 'A' });
    const rB = gsRegisterUnit(rb3.id, { unit_code: 'B' });
    gsSignLease(rB.id, 'T42', { start: '2026-09-01', monthly_rent: 1400 });
    const retNo = gsRetireUnit(rB.id, 'occupied');
    const retOk = gsRetireUnit(rA.id, 'converted to storage');
    const rAuto = gsRegisterUnit(rb3.id, { autoCode: true });
    log(retNo === false && retOk === true && rA.status === 'retired' &&
        rAuto.unit_code === 'C' &&
        gsSignLease(rA.id, 'T43', { start: '2026-10-01' }) === null,
        'gs: v4 retired units keep their code forever and stop leasing');

    // ---- v4: retiring a building refuses while occupied (honest demo) ----
    const ob = gsRegisterBuilding({ street: 'Doomed Street' });
    const ou = gsRegisterUnit(ob.id, { unit_code: 'A' });
    gsSignLease(ou.id, 'T44', { start: '2026-09-01', monthly_rent: 1800 });
    const refuse = gsRetireBuilding(ob.id, { reason: 'condo conversion' });
    const forced = gsRetireBuilding(ob.id, { reason: 'condo conversion',
      force: true, date: '2026-10-01' });
    const ob2 = gsRegisterBuilding({ street: 'Gone Street' });
    gsRegisterUnit(ob2.id, { unit_code: 'A' });
    const goneOk = gsRetireBuilding(ob2.id, 'demolished');
    log(refuse === false && forced === true && ob.status === 'retired' &&
        gsActiveLease(ou.id) === null && goneOk === true &&
        GS_REG.retired.indexOf(ob.id) >= 0,
        'gs: v4 demolition needs vacant homes or an honest forced ending');

    // ---- v4: every clerk op hits the mint log AND the public feed ----
    log(GS_REG.mintLog.some(e => /subdivide/.test(e.reason)) &&
        GS_REG.mintLog.some(e => /garage conversion/.test(e.reason)) &&
        GS_REG.mintLog.some(e => /merge/.test(e.reason)) &&
        GS_REG.mintLog.some(e => /retired unit/.test(e.reason)) &&
        GS_REG.mintLog.every(e => e.address && e.bld_id) &&
        GS_FEED.some(e => e.type === 'admin' && e.action === 'subdivide') &&
        GS_FEED.some(e => e.type === 'admin' && e.action === 'convert'),
        'gs: v4 clerk ops are logged + publicly fed (register first, tell after)');

    // ---- v4: parse + lookup — how an AI turns words into records ----
    const pb2 = gsRegisterBuilding({ street: 'Parse Street' });
    const pA = gsRegisterUnit(pb2.id, { unit_code: '3B' });
    const pa1 = gsParseAddress(gsAddressOfUnit(pA.id));
    const pa2 = gsParseAddress(pb2.address);
    const pa3 = gsParseAddress(pb2.hn + ' Parse St. Unit 3B');
    const pa4 = gsParseAddress('1234 Nowhere Boulevard');
    const pa5 = gsParseAddress('the pink Victorian');
    log(pa1 && pa1.bld === pb2 && pa1.unit === pA &&
        pa2 && pa2.bld === pb2 && pa2.unit === null &&
        pa3 && pa3.bld === pb2 && pa3.unit === pA &&
        pa4 && pa4.bld === null && pa5 === null,
        'gs: v4 gsParseAddress round-trips formats; unknowns parse honestly');
    const lp = gsLookupPlace(pA.id);
    const lpB = gsLookupPlace(pb2.address);
    log(lp && lp.unit === pA && lp.building === pb2 && lp.livable === true &&
        lpB && lpB.building === pb2 && lpB.occupancy.units.length === 1,
        'gs: v4 gsLookupPlace resolves ids and address strings alike');
    gsSignLease(pA.id, 'T45', { start: '2026-09-01', monthly_rent: 1600,
                                occupants: ['T45', 'T46'] });
    log(gsAddressOf(pA.id) === gsAddressOfUnit(pA.id) &&
        gsAddressOf(pb2.id) === pb2.address &&
        gsResidents(pA.id).indexOf('T46') >= 0 &&
        gsResidents(pb2.id).indexOf('T45') >= 0,
        'gs: v4 polymorphic gsAddressOf/gsResidents resolve unit and building');
    const occ = gsOccupancyOf(pb2.id);
    log(occ && occ.units[0].residents.length === 2 &&
        occ.units[0].lease.tenant === 'T45',
        'gs: v4 occupancy view shows the landlord the per-unit truth');

    // ---- v4: vacancy stock excludes leased/retired/split ----
    const vacM = gsVacantUnits({ street: 'Merge Street' });
    const vacGG = gsVacantUnits({ street: 'Garage Street' });
    log(vacM.length === 2 && vacM.every(v => v.unit.status === 'active') &&
        vacM.some(v => v.unit.id === mNew.id) &&
        !vacM.some(v => v.unit.id === mA.id) &&
        vacGG.length === 1 && vacGG[0].unit.id === gu.id,
        'gs: v4 gsVacantUnits surfaces only livable, unleased stock');

    // ---- v4: livability gates the request bus too (hire/listing) ----
    gsCreditGrant('pZ', 2000, 'stake');
    const rqH = gsSubmitRequest({ playerId: 'pZ', kind: 'hire',
      target: rA.id, durationMin: 5, params: { name: 'Nobody' } }, 40000);
    const rqL = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
      target: rA.id, durationMin: 60, params: { ask: 100000 } }, 40000);
    log(rqH.reason === 'unit_not_livable' &&
        rqL.reason === 'unit_not_livable',
        'gs: v4 hire/listing refuse retired units before billing');

    // ---- v4: designer pins — canonical numbers through the §3 formula ----
    const pin1 = gsRegisterBuilding({ street: 'Pin Street', hnPin: 9418 });
    log(!!pin1 && pin1.hn === 9418 && pin1.addr_idx != null &&
        gsAddrNumber('Pin Street', pin1.addr_idx) === 9418 &&
        pin1.address === '9418 Pin Street, San Francisco, CA',
        'gs: v4 a designer pin lands the authored number formula-legally');
    log(gsRegisterBuilding({ street: 'Pin Street', hnPin: 9418 }) === null &&
        gsRegisterBuilding({ street: 'Pin Street', hnPin: 744 }) === null &&
        gsRegisterBuilding({ street: 'Pin Street', hnPin: 12345 }) === null,
        'gs: v4 pins refuse taken numbers and non-9xxx values');
    const pinSameOther = gsRegisterBuilding({ street: 'Other Street',
      hnPin: 9418 });
    log(!!pinSameOther && pinSameOther.hn === 9418 &&
        pinSameOther.id !== pin1.id,
        'gs: v4 the same number on a different street is a legal address');
    const mintNoPin = gsMintAddress('Pin Street', 'clerk test',
      { hnPin: 9418 });
    log(!!mintNoPin && mintNoPin.hn !== 9418 && mintNoPin.hn >= 9000,
        'gs: v4 the clerk generates — hnPin is stripped, never honored');

    // ---- v4: off-map buildings — real places, not rentable in-game ----
    const ob9 = gsRegisterBuilding({ street: 'Faraway Avenue', hnPin: 9300,
      offmap: true, canon: 'test-far' });
    const ou9 = gsRegisterUnit(ob9.id, { unit_code: 'A', base_rent: 1500 });
    const offLease = gsSignLease(ou9.id, 'T47', { start: '2026-01-01',
      monthly_rent: 1500 });
    log(!!ob9 && ob9.offmap === true && ob9.bld_idx === null &&
        !!ou9 && !!offLease,
        'gs: v4 off-map buildings are real registry places (leasable)');
    const ob10 = gsRegisterBuilding({ street: 'Farther Street',
      offmap: true });
    const ou10 = gsRegisterUnit(ob10.id, { unit_code: 'A' });
    log(gsVacantUnits().every(v => !v.building.offmap) &&
        gsVacantUnits({ offmap: true }).some(v => v.unit === ou10),
        'gs: v4 vacant stock hides off-map units unless asked');
    const rqOff = gsSubmitRequest({ playerId: 'pZ', kind: 'hire',
      target: ou10.id, durationMin: 5, params: { name: 'Away' } }, 40001);
    const rqOffL = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
      target: ou10.id, durationMin: 60, params: { ask: 90000 } }, 40001);
    log(rqOff.reason === 'unit_offmap' && rqOffL.reason === 'unit_offmap',
        'gs: v4 hire/listing refuse off-map units — the cast lives on-screen');
    /* re-seed idempotency: canon tag returns the existing record */
    const rePin = gsRegisterBuilding({ street: 'Faraway Avenue',
      canon: 'test-far' });
    log(rePin === ob9,
        'gs: v4 canon-tagged registration is idempotent under re-seed');

    // ---- v4: the audit verifies the invariants — and catches breaches ----
    const aud0 = gsRegistryAudit();
    log(aud0.ok === true,
        'gs: v4 registry audit passes on a clean registry',
        aud0.issues.slice(0, 2).join('; ') || 'clean');
    const corrupt = gsRegisterBuilding({ street: 'Bad Street' });
    const corruptHn = corrupt.hn;
    corrupt.hn = 1234;                      // a REAL-range number — spec §7 breach
    const aud1 = gsRegistryAudit();
    corrupt.hn = corruptHn;                 // restore — the audit must clear
    const aud2 = gsRegistryAudit();
    log(aud1.ok === false &&
        aud1.issues.some(s => /privacy rule breach/.test(s)) &&
        aud2.ok === true,
        'gs: v4 audit flags a real-range number, then clears clean');
    const stats = gsRegistryStats();
    log(stats.buildings === GS_REG.buildings.length &&
        stats.units === GS_REG.units.length &&
        stats.vacant >= 0 && stats.livable + stats.withdrawn === stats.units,
        'gs: v4 registry stats tally the stock honestly');

    // ---- v4: snapshot/load preserves withdrawal state + code freeze ----
    const v4snap = gsRegSnapshot();
    gsRegistryReset();
    const v4ok = gsRegLoad(v4snap) &&
      gsUnitById(su.id).status === 'split' &&
      gsUnitById(mA.id).status === 'merged' &&
      gsUnitById(rA.id).status === 'retired' &&
      gsBldById(ob.id).status === 'retired' &&
      gsUnitCodeTaken(gsBldById(mb2.id), 'A') &&
      gsNextUnitCode(gsBldById(mb2.id)) === 'E' &&
      gsParseAddress(gsAddressOfUnit(pA.id)).unit.id === pA.id;
    log(v4ok, 'gs: v4 withdrawn units, retired codes, parses survive load');

    // ================= v5: POSSESSION — THE STAGE DOOR =================
    // The full session system: identity vocabulary, pre-billing intent
    // screening, the public-record briefing + audit, wind-down warnings,
    // honest endings in the driving record, in-world driver verbs
    // (walk/spend — character dollars only), the orphan sweep, and the
    // hired spawn (SF mode only).

    // ---- v5: character kinds + the honest denial vocabulary ----
    gsCreditGrant('sA', 5000, 'v5 stake'); gsCreditGrant('sB', 5000, 'v5 stake');
    gsMarkHired('H60', 'sA', { name: 'Casey Rivera', role: 'barista' });
    gsMarkHired('H61', 'sB', { name: 'Other Hire' });
    log(gsCharKind('C1') === 'core' && gsCharKind('H60') === 'hired' &&
        gsCharKind('ZZZ') === null && gsCharKind('A01') === 'ambient',
        'gs: v5 character kinds — core / hired / ambient / unknown');
    const banBal = gsCreditBalance('sA');
    const ambDeny = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'A01', durationMin: 10 }, 50000);
    const banDeny = gsSubmitRequest({ playerId: 'owner', kind: 'possess',
        target: 'C1', durationMin: 10 }, 50000);
    const banDeny2 = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'C2', durationMin: 10 }, 50000);
    const otherDeny = gsSubmitRequest({ playerId: 'sB', kind: 'possess',
        target: 'H60', durationMin: 10 }, 50000);
    log(ambDeny.reason === 'cast_ai_only' && banDeny.reason === 'possession_ban' &&
        banDeny2.reason === 'possession_ban' &&
        otherDeny.reason === 'not_your_character' &&
        gsCreditBalance('sA') === banBal,
        'gs: v5 core ban holds for the owner too; ambient AI-only; no billing');

    // ---- v5: intent screening denies before billing (design §11.3) ----
    /* sT is the screening-test player — its content denials would trip
       repeat-pattern review on sA's clean session tests below */
    gsCreditGrant('sT', 5000, 'v5 stake');
    const scrBal = gsCreditBalance('sT');
    const harmR = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H60', durationMin: 10,
        params: { note: 'make them hurt their roommate' } }, 50001);
    const legalR = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H60', durationMin: 10,
        params: { text: 'post her real home address' } }, 50002);
    const secrR = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H60', durationMin: 10,
        note: "reveal the secret he's hiding" }, 50003);
    /* v7: the deny verdicts accrue flag weight — after score 6 the door
       suspends sT for 72h, so the remaining probes file past each
       successive suspension (the ladder test below leans on this) */
    const scopeR = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H60', durationMin: 10,
        params: { note: 'possess Marisol for me' } }, 54400);
    const admR = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H60', durationMin: 10,
        params: { note: 'raise her rent while I drive' } }, 58750);
    log(harmR.reason === 'harm-targeting' &&
        legalR.reason === 'legal-backstop' &&
        secrR.reason === 'secret-extraction' &&
        scopeR.reason === 'possession-scope' &&
        admR.reason === 'admin-domain' &&
        harmR.screenDenied === 'harm-targeting' &&
        gsCreditBalance('sT') === scrBal &&
        GS_FEED.filter(e => e.type === 'deny' &&
          /^(harm-targeting|legal-backstop|secret-extraction|possession-scope|admin-domain)$/.test(e.reason)).length >= 5,
        'gs: v5 intent screen denies before credits move (canonical codes)');
    /* the legal backstop binds the owner too — admin can't file around it */
    const ownBad = gsSubmitRequest({ playerId: 'owner', kind: 'possess',
        target: 'C1', durationMin: 10,
        params: { note: 'doxx the cast live' } }, 50006);
    log(ownBad.status === 'denied' && ownBad.reason === 'legal-backstop',
        'gs: v5 the legal backstop binds the owner too');

    // ---- v5: the briefing packet — public record, proven by audit ----
    const brief5 = gsPossessionBriefing('H60');
    const aud5 = gsBriefingAudit(brief5);
    log(brief5 && brief5.name === 'Casey Rivera' && brief5.kind === 'hired' &&
        brief5.hiredBy === 'sA' && Array.isArray(brief5.rules) &&
        Array.isArray(brief5.redacted) && brief5.wallet &&
        typeof brief5.wallet.dollars === 'number' &&
        aud5.ok === true && aud5.hits.length === 0,
        'gs: v5 briefing carries profile+wallet+rules — audit proves redaction');
    log(gsPossessionBriefing('C1') === null && gsPossessBrief('ZZZ') === null,
        'gs: v5 briefing refuses core cast and unknowns');
    const dirty = gsBriefingAudit({ name: 'x',
        inner: { secret_seed: 1, thoughts: [], memories: {} } });
    log(!dirty.ok && dirty.hits.length === 3,
        'gs: v5 the audit catches a contaminated brief');

    // ---- v5: a live session — brain suspended/restored, feed-visible ----
    const vh60 = { _castId: 'H60', gsHired: true, isNPC: true,
                   name: 'Casey Rivera', role: 'barista', x: 320, y: 640,
                   sfSched: gsHiredRoutine('H60'),
                   sfPath: [{ wx: 1, wy: 1 }], targetX: 999, targetY: 999 };
    VILLAGERS.push(vh60);
    const sess5 = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'H60', durationMin: 30 }, 50010);
    /* the world ticks forward: sessions whose endMin passed since the last
       tick (earlier blocks filed possesses at ~20431 that were never
       ticked past their cap) complete and leave the driving set */
    gsBusTick(50010);
    const schedBefore = vh60.sfSched;
    log(sess5.status === 'active' && sess5.price === 120 &&
        GS_POSSESS.H60 && GS_POSSESS.H60.prevNPC === true &&
        vh60.isNPC === false && vh60.gsPossessed === sess5.id &&
        vh60.sfPath === null && vh60.targetX === null &&
        GS_FEED.some(e => e.type === 'possess' && e.action === 'begin' &&
                          e.target === 'H60'),
        'gs: v5 activation suspends the brain, clears the route, feeds begin');
    const view5 = gsPossessionSession('H60', 50020);
    log(view5 && view5.untilMin === 50040 && view5.remainingMin === 20 &&
        view5.elapsedMin === 10 && view5.spawned === true &&
        gsPossessDriving(50020).some(d => d.char === 'H60' &&
          d.player === 'sA' && d.reqId === sess5.id),
        'gs: v5 live session view meters the drive for driver + audience');

    // wind-down fires once inside the last 5 minutes; timeout ends honestly
    gsBusTick(50036); gsBusTick(50037);       // a second tick must NOT re-post
    const warns = GS_FEED.filter(e => e.type === 'possess' &&
      e.action === 'winddown' && e.req === sess5.id);
    log(sess5._possessWarned === true && warns.length === 1 &&
        warns[0].leftMin <= 5 && warns[0].leftMin > 0,
        'gs: v5 wind-down warning posts once, five minutes before handoff');
    gsBusTick(50041);
    const deb5 = gsPossessDebrief('H60');
    log(sess5.status === 'completed' && !GS_POSSESS.H60 &&
        vh60.isNPC === true && vh60.gsPossessed === null &&
        vh60.sfSched === schedBefore &&
        deb5 && deb5.endReason === 'timeout' && deb5.usedMin === 30 &&
        deb5.player === 'sA' && deb5.req === sess5.id &&
        deb5.startCell && deb5.startCell.wx === 10 &&
        GS_FEED.some(e => e.type === 'possess' && e.action === 'end' &&
                          e.endReason === 'timeout'),
        'gs: v5 timeout hands the body back — schedule intact, record written');

    // ---- v5: cancel -> 'released'; admin revoke -> 'admin_revoked' ----
    const sess5b = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'H60', durationMin: 20 }, 50100);
    gsCancelRequest(sess5b.id, 50110, 'player');
    const deb5b = gsPossessDebrief('H60');
    log(sess5b.status === 'cancelled' && deb5b && deb5b.req === sess5b.id &&
        deb5b.endReason === 'released' && deb5b.usedMin === 10 &&
        vh60.isNPC === true,
        'gs: v5 player release logs an honest ending');
    const sess5c = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'H60', durationMin: 20 }, 50200);
    gsAdminRevoke(sess5c.id, 'contested', 50205);
    const deb5c = gsPossessDebrief('H60');
    log(sess5c.status === 'cancelled' && sess5c.by === 'admin' &&
        deb5c && deb5c.req === sess5c.id && deb5c.endReason === 'admin_revoked' &&
        vh60.isNPC === true,
        'gs: v5 admin revoke logs admin_revoked + compensates');

    // ---- v5: the orphan sweep — a session whose request vanished still
    //      releases the body (no driven ghosts, ever) ----
    GS_POSSESS.H60 = { playerId: 'sA', reqId: 'req-vanished',
                       sinceMin: 50300, prevNPC: true };
    vh60.gsPossessed = 'req-vanished'; vh60.isNPC = false;
    gsBusTick(50310);
    const debOrph = gsPossessDebrief('H60');
    log(!GS_POSSESS.H60 && vh60.isNPC === true && vh60.gsPossessed === null &&
        debOrph && debOrph.endReason === 'orphan_sweep' &&
        GS_FEED.some(e => e.endReason === 'orphan_sweep'),
        'gs: v5 orphan sweep releases a body whose request is gone');

    // ---- v5: driver verbs — walk + spend, dollars only, feed-visible ----
    const sess5d = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'H60', durationMin: 20 }, 50400);
    log(gsPossessDrive('H60', 'sB', 10, 10).err === 'not_driver' &&
        gsPossessDrive('ZZZ', 'sA', 10, 10).err === 'not_possessed' &&
        gsPossessDrive('H60', 'sA', NaN, 5).err === 'bad_cell' &&
        gsPossessDrive('H60', 'sA', 12, 34).ok === true &&
        vh60.targetX === 12 * CS + 16 && vh60.targetY === 34 * CS + 16 &&
        gsPossessDrive('H60', 'sA', null, null).stopped === true &&
        vh60.targetX === null,
        'gs: v5 drive verb is driver-only, waypointed, stoppable');
    gsDollarGrant('H60', 500, 'wages');
    const sAcred = gsCreditBalance('sA');
    const a02bal = gsDollarBalance('A02');
    const paySelf = gsPossessPay('H60', 'sA', 'H60', 10, 'x', 50401);
    const payNeg = gsPossessPay('H60', 'sA', 'A02', -5, 'x', 50401);
    const payPoor = gsPossessPay('H60', 'sA', 'A02', 99999, 'x', 50401);
    const payOk = gsPossessPay('H60', 'sA', 'A02', 40, 'coffee', 50401);
    log(paySelf.err === 'bad_payee' && payNeg.err === 'bad_amount' &&
        payPoor.err === 'insufficient_dollars' &&
        payOk.ok === true && payOk.paid === 40 &&
        gsDollarBalance('H60') === 460 &&
        gsDollarBalance('A02') === a02bal + 40 &&
        GS_POSSESS.H60.spent === 40 && gsCreditBalance('sA') === sAcred &&
        GS_FEED.some(e => e.type === 'possess' && e.action === 'spend' &&
                          e.amt === 40 && e.to === 'A02'),
        'gs: v5 spending uses the character\'s own dollars — ledger + feed');

    // ---- v5: paying the landlord settles real rent through the lease ----
    const lb5 = gsRegisterBuilding({ street: 'Tender Street',
                                     owner_id: 'landlord' });
    const lu5 = gsRegisterUnit(lb5.id, { unit_code: 'A', base_rent: 1000 });
    gsMarkHired('H62', 'sA', { unitId: lu5.id });
    gsSignLease(lu5.id, 'H62', { start: '2026-09-01', monthly_rent: 1000 });
    gsDollarGrant('H62', 400, 'wages');
    gsRentTick('2026-09-01');                 // posts 1000, autopay takes 400
    gsDollarGrant('H62', 500, 'tips');        // the driver has cash to spend
    const l62 = gsActiveLease(lu5.id);
    const owedBefore = gsLeaseOwed(l62).total;
    const landBal = gsDollarBalance('landlord');
    const sess5e = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'H62', durationMin: 10 }, 50500);
    const rentPay = gsPossessPay('H62', 'sA', 'landlord', 300, 'rent', 50501);
    log(owedBefore === 600 && rentPay.ok && rentPay.settled === 'rent' &&
        rentPay.paid === 300 && gsLeaseOwed(l62).total === 300 &&
        gsDollarBalance('landlord') === landBal + 300,
        'gs: v5 paying the landlord settles real rent debt');
    gsBusTick(50511);                         // ends sess5d + sess5e
    const deb5e = gsPossessDebrief('H62');
    log(sess5e.status === 'completed' && sess5d.status === 'completed' &&
        deb5e && deb5e.dollarsSpent === 300 && deb5e.rentRisk === true,
        'gs: v5 the driving record counts spend + flags rent risk');

    // ---- v5: same-owner queue — promotion re-binds the session record ----
    const sess5f = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'H60', durationMin: 10 }, 50600);
    const sess5g = gsSubmitRequest({ playerId: 'sA', kind: 'possess',
        target: 'H60', durationMin: 10 }, 50601);
    log(sess5f.status === 'active' && sess5g.status === 'queued' &&
        sess5g.queuedBehind.indexOf(sess5f.id) >= 0,
        'gs: v5 one driver per body — the second filing waits its turn');
    gsBusTick(50611);
    log(sess5f.status === 'completed' && sess5g.status === 'active' &&
        GS_POSSESS.H60.reqId === sess5g.id && vh60.isNPC === false &&
        gsPossessDebrief('H60').req === sess5f.id,
        'gs: v5 promotion re-binds the session to the next request');
    gsBusTick(50622);
    log(sess5g.status === 'completed' && !GS_POSSESS.H60 &&
        vh60.isNPC === true,
        'gs: v5 the promoted session also hands back cleanly');

    // ---- v5: the review lane (design §11.4) — gray-zone intent parks
    //      for a human; approval enters the line fresh, denial refunds
    //      in full, a lapsed window auto-refunds, cancel/revoke reach in ----
    gsCreditGrant('sR', 5000, 'v5 stake');
    gsMarkHired('H63', 'sR', { name: 'Review Rue', role: 'clerk' });
    const grayR = gsSubmitRequest({ playerId: 'sR', kind: 'possess',
        target: 'H63', durationMin: 10,
        params: { note: 'confront the landlord about the noise' } }, 50750);
    log(grayR.status === 'in_review' && grayR.screen === 'gray-zone' &&
        grayR.billed === grayR.price && grayR.price === 40 &&
        gsReviewQueue().some(r => r.id === grayR.id) && !GS_POSSESS.H63,
        'gs: v5 gray-zone intent parks in_review — billed, not running');
    const accR = gsReviewResolve(grayR.id, true, { nowMin: 50751 });
    log(accR === grayR && grayR.status === 'active' && !!GS_POSSESS.H63 &&
        GS_POSSESS.H63.reqId === grayR.id && grayR.reviewedMin === 50751 &&
        GS_FEED.some(e => e.type === 'review' && e.action === 'approved' &&
                          e.req === grayR.id),
        'gs: v5 review approval activates the request honestly');
    gsCancelRequest(grayR.id, 50752, 'player');
    log(!GS_POSSESS.H63 && gsPossessDebrief('H63').endReason === 'released',
        'gs: v5 a reviewed session ends like any other — honest handoff');
    const sRbal = gsCreditBalance('sR');
    const relR = gsSubmitRequest({ playerId: 'sR', kind: 'possess',
        target: 'H63', durationMin: 10,
        params: { note: 'flirt with her crush at the cafe' } }, 50760);
    const relWas = relR.status === 'in_review' &&
                   relR.screen === 'surface-relationship';
    gsReviewResolve(relR.id, false,
                    { code: 'surface-relationship', nowMin: 50761 });
    log(relWas && relR.status === 'denied' && relR.screenDenied &&
        relR.refunded === relR.billed && relR.billed > 0 &&
        gsCreditBalance('sR') === sRbal && !GS_POSSESS.H63 &&
        GS_FEED.some(e => e.type === 'deny' && e.via === 'review'),
        'gs: v5 review denial refunds in full — the request never ran');
    const lapseR = gsSubmitRequest({ playerId: 'sR', kind: 'possess',
        target: 'H63', durationMin: 10,
        params: { note: 'demand she quit her job' } }, 50770);
    gsBusTick(50770 + GS_REVIEW_TTL_MIN + 1);
    log(lapseR.status === 'expired' && lapseR.reason === 'review_lapsed' &&
        lapseR.refunded === lapseR.billed &&
        GS_FEED.some(e => e.type === 'expire' && e.via === 'review' &&
                          e.req === lapseR.id),
        'gs: v5 review lapse auto-refunds — a parked request never hangs');
    const laneR = gsSubmitRequest({ playerId: 'sR', kind: 'possess',
        target: 'H63', durationMin: 10,
        params: { note: 'argue with the neighbors' } }, 50780);
    log(gsCancelRequest(laneR.id, 50781, 'player') === true &&
        laneR.status === 'cancelled' && laneR.refunded === laneR.billed,
        'gs: v5 cancelling a parked request refunds it like a queued one');
    const laneR2 = gsSubmitRequest({ playerId: 'sR', kind: 'possess',
        target: 'H63', durationMin: 10,
        params: { note: 'yell at the delivery guy' } }, 50790);
    log(gsAdminRevoke(laneR2.id, 'lane sweep', 50791) === true &&
        laneR2.status === 'cancelled' && laneR2.by === 'admin' &&
        laneR2.refunded === laneR2.billed,
        'gs: v5 admin revoke reaches the review lane, fully compensated');
    /* fixation signal: refused attempts on one target escalate clean
       requests into review. v7: sU probes her own hire with real-business
       asks — denied outright but flag-weight 0, so the account can still
       file the fourth one (that IS the point of a weight-0 verdict) */
    gsMarkHired('H64', 'sT', { name: 'Pattern Pat' });
    gsCreditGrant('sU', 5000, 'v7 stake'); gsMarkHired('H65', 'sU');
    for(let i = 0; i < 3; i++)
      gsSubmitRequest({ playerId: 'sU', kind: 'possess', target: 'H65',
        durationMin: 10, params: { note: 'meet me at Bi-Rite' } }, 50800 + i);
    const patR = gsSubmitRequest({ playerId: 'sU', kind: 'possess',
        target: 'H65', durationMin: 10,
        params: { note: 'a walk in the park' } }, 50803);
    log(patR.status === 'in_review' && patR.screen === 'repeat-pattern' &&
        gsExplainRequest(patR.id).note.indexOf('review') >= 0,
        'gs: v5 repeated refused attempts on one target escalate to review');
    const appR = gsSubmitRequest({ playerId: 'sR', kind: 'possess',
        target: 'H63', durationMin: 10, appeal_of: relR.id,
        params: { note: 'a quieter version' } }, 50810);
    log(appR.status === 'in_review' && appR.screen === 'appeal-resubmit',
        'gs: v5 appeal resubmissions always route to a reviewer');
    gsReviewResolve(patR.id, false, { nowMin: 50811 });
    gsReviewResolve(appR.id, false, { nowMin: 50811 });

    // ---- v5: the driving record rides the bus snapshot ----
    const plogLen = GS_POSSESS_LOG.length;
    const snap5 = gsBusSnapshot();
    gsBusReset();
    log(GS_POSSESS_LOG.length === 0 && gsBusLoad(snap5) &&
        GS_POSSESS_LOG.length === plogLen &&
        gsPossessLog('H60').length >= 4,
        'gs: v5 the driving record survives snapshot/load');

    // ---- v5: hired look + routine are deterministic and schedule-shaped ----
    const look5a = gsHiredLook('H60'), look5b = gsHiredLook('H60');
    log(JSON.stringify(look5a) === JSON.stringify(look5b) &&
        /^#[0-9a-f]{6}$/i.test(look5a.skin) && look5a.id === 'H60' &&
        GS_LOOK_STYLE.indexOf(look5a.hairStyle) >= 0,
        'gs: v5 hired looks are deterministic cast-grade designs');
    const rt5 = gsHiredRoutine('H60');
    log(Array.isArray(rt5) && rt5.length >= 3 && rt5[0].h0 === 0 &&
        rt5[rt5.length - 1].h1 === 24 &&
        rt5.every(b => b.h0 < b.h1 && b.h0 >= 0 && b.h1 <= 24) &&
        rt5.some(b => b.inside),
        'gs: v5 hired routine is a full valid day in sfSched grammar');

    // ---- v5: a real hire walks on stage (SF) / stays abstract (medieval) ----
    /* the suite filled the 24-seat cast cap — the hire is denied honestly,
       then retiring hires frees seats (release = end session, despawn,
       vacate the lease, close the record) */
    const hb5 = gsRegisterBuilding({ street: 'Spawn Street',
                                     owner_id: 'landlord' });
    const hu5 = gsRegisterUnit(hb5.id, { unit_code: 'A', base_rent: 1400 });
    const capTry5 = gsSubmitRequest({ playerId: 'sB', kind: 'hire',
        target: hu5.id, durationMin: 5,
        params: { name: 'Spawn Sam', role: 'baker' } }, 50699);
    const hiredBefore = Object.keys(GS_HIRED).length;
    for(const cid of ['H60', 'H61', 'H62', 'H63', 'H64', 'H65'])
      gsReleaseHired(cid, 'suite done');
    log(capTry5.status === 'denied' && capTry5.reason === 'cast_cap' &&
        Object.keys(GS_HIRED).length === hiredBefore - 6 &&
        !gsLeasesFor('H62').some(l => l.status === 'active') &&
        GS_FEED.some(e => e.type === 'hire' && e.action === 'release'),
        'gs: v5 cast cap denies honestly; released seats open again');
    const hire5 = gsSubmitRequest({ playerId: 'sB', kind: 'hire',
        target: hu5.id, durationMin: 5,
        params: { name: 'Spawn Sam', role: 'baker' } }, 50700);
    gsReviewResolve(hire5.id, true, { nowMin: 50700 });   // v7: naming lane
    const h5id = Object.keys(GS_HIRED).find(k =>
        GS_HIRED[k] && GS_HIRED[k].unitId === hu5.id);
    if(typeof SF_MODE !== 'undefined' && SF_MODE){
      const pawn = h5id && gsVillagerForChar(h5id);
      log(hire5.status === 'active' && !!pawn && pawn.gsHired === true &&
          pawn.isNPC === true && pawn._ci != null && !!PA.chars[pawn._ci] &&
          !!DESIGNS[h5id] && Array.isArray(pawn.sfSched) &&
          pawn.sfSched.length >= 3 && VILLAGERS.indexOf(pawn) >= 0,
          'gs: v5 a hire walks on stage — pawn, frameset, design, routine');
      const ros5 = gsHiredRoster().find(r => r.id === h5id);
      log(!!ros5 && ros5.spawned === true && ros5.owner === 'sB' &&
          /Spawn Street/.test(ros5.home || ''),
          'gs: v5 the hired roster reads like opening credits');
      /* a body spawned under a live possession stays suspended */
      const sess5h = gsSubmitRequest({ playerId: 'sB', kind: 'possess',
          target: h5id, durationMin: 5 }, 50701);
      const snap5b = gsBusSnapshot();
      gsBusReset();                    // wipes session + hired map
      gsDespawnHired(h5id);            // the body leaves with the state
      gsBusLoad(snap5b);               // -> re-spawn + re-assert suspension
      const pawn2 = gsVillagerForChar(h5id);
      log(sess5h.status === 'active' && pawn2 && pawn2.isNPC === false &&
          pawn2.gsPossessed === sess5h.id && GS_POSSESS[h5id] &&
          GS_POSSESS[h5id].playerId === 'sB',
          'gs: v5 reload re-spawns the hired body and re-asserts the drive');
      gsCancelRequest(sess5h.id, 50710, 'admin');
    } else {
      log(hire5.status === 'active' && h5id &&
          gsSpawnHired(h5id) === null && gsVillagerForChar(h5id) === null &&
          GS_HIRED[h5id].spawned === false,
          'gs: v5 hire works in medieval mode but spawns no Mission pawn');
    }

    // ================= v6: THE WIRE (public spectator feed) =================
    /* every lifecycle event so far should have landed as a formatted,
       display-safe wire line — the bus kept running under us. */
    gsCreditGrant('pW', 5000, 'wire stake'); gsMarkHired('H90', 'pW',
      { name: 'Wire Wendy' });
    const wReq = gsSubmitRequest({ playerId: 'pW', kind: 'possess',
      target: 'H90', durationMin: 10 }, 60000);
    log(wReq.status === 'active' &&
        GS_WIRE.some(e => e.req === wReq.id && e.kind === 'request' &&
          e.status === 'running' && /possess — Wire Wendy/.test(e.text) &&
          e.mentions && e.mentions.indexOf('H90') >= 0 &&
          /^[dw][\w-]*-\d/.test(e.id) && e.t != null && e.day != null),
        'gs: v6 a running request posts a canonical wire line');
    log(GS_WIRE.some(e => e.req === wReq.id && /takes the wheel/.test(e.text)),
        'gs: v6 possession begin is its own attributed beat');
    gsBusTick(60070);                        // past endMin — session wraps
    log(GS_WIRE.some(e => e.req === wReq.id &&
          e.status === 'player session ended' &&
          /back on their own two feet/.test(e.text)) &&
        GS_WIRE.some(e => e.req === wReq.id && e.status === 'resolved'),
        'gs: v6 session end lands as "player session ended" + resolved');

    /* ---- weather: attributed sky lines, queue -> refund ---- */
    gsCreditGrant('pQ', 500, 'wire stake');
    const wWx = gsSubmitRequest({ playerId: 'pQ', kind: 'weather',
      durationMin: 20, params: { wx: 'rain' } }, 60080);
    gsReviewResolve(wWx.id, true, { nowMin: 60080 });    // v7: exclusive lane
    const wWx2 = gsSubmitRequest({ playerId: 'pW', kind: 'weather',
      durationMin: 20, params: { wx: 'clear' } }, 60081);
    log(wWx.status === 'active' && wWx2.status === 'queued' &&
        GS_WIRE.some(e => e.req === wWx2.id && e.status === 'queued' &&
          /weather — clear/.test(e.text)) &&
        GS_WIRE.some(e => e.kind === 'weather' &&
          /Rain over the Mission — called by pQ/.test(e.text)),
        'gs: v6 queue posts queued; the sky change is attributed weather');
    gsBusTick(60142);                        // wx done @60100, wx2 TTL lapses
    log(wWx2.status === 'expired' && wWx2.refunded === wWx2.billed &&
        GS_WIRE.some(e => e.req === wWx2.id && e.status === 'refunded' &&
          /lapsed/.test(e.text)) &&
        GS_WIRE.some(e => e.kind === 'weather' && /sky drifts back/.test(e.text)),
        'gs: v6 expiry is a refunded line; the sky returning is weather');

    /* ---- denials: verbatim contract text, codes, never the note ---- */
    const wDeny = gsSubmitRequest({ playerId: 'pQ', kind: 'possess',
      target: 'C1', durationMin: 10,
      params: { note: 'take over Mars at the counter' } }, 60200);
    log(wDeny.status === 'denied' &&
        GS_WIRE.some(e => e.req === wDeny.id && e.status === 'not approved' &&
          e.text === 'request not approved' &&
          e.reason_code === 'possession-scope') &&
        !GS_WIRE.some(e => /take over Mars/.test(e.text)),
        'gs: v6 denied requests print the class, never the ask');
    const wHarm = gsSubmitRequest({ playerId: 'pQ', kind: 'possess',
      target: 'H90', durationMin: 10,
      params: { note: 'make them cry on stream' } }, 60201);
    log(wHarm.status === 'denied' && wHarm.reason === 'harm-targeting' &&
        GS_WIRE.some(e => e.req === wHarm.id &&
          e.reason_code === 'harm-targeting' && e.attempt === 'possess') &&
        !GS_WIRE.some(e => /make them cry/.test(e.text)),
        'gs: v6 moderation codes publish as reason_code, never the note');

    /* ---- the review lane is a public arc: in_review -> approved ->
       running, note quarantined until the request actually runs ---- */
    gsMarkHired('H91', 'pQ', { name: 'Queue Quinn' });
    const wRev = gsSubmitRequest({ playerId: 'pQ', kind: 'possess',
      target: 'H91', durationMin: 10,
      params: { note: 'confront the noisy neighbors' } }, 60210);
    const revInReview = GS_WIRE.find(e => e.req === wRev.id &&
      e.status === 'in_review');
    log(wRev.status === 'in_review' && !!revInReview &&
        /in human review/.test(revInReview.text) &&
        revInReview.text.indexOf('confront') < 0,
        'gs: v6 parked requests post in_review with the note quarantined');
    gsReviewResolve(wRev.id, true, { nowMin: 60211 });
    const revOK = GS_WIRE.find(e => e.req === wRev.id &&
      e.status === 'approved');
    const revRun = GS_WIRE.find(e => e.req === wRev.id &&
      e.status === 'running');
    /* the 'cleared review' beat keeps the note quarantined; it debuts on
       the running line, once the request is actually live */
    log(wRev.status === 'active' && !!revOK &&
        /cleared review/.test(revOK.text) &&
        revOK.text.indexOf('confront') < 0 && !!revRun &&
        revRun.text.indexOf('confront the noisy neighbors') >= 0,
        'gs: v6 review approval publishes cleared review -> running');
    gsCancelRequest(wRev.id, 60212, 'player');

    /* ---- admin overrides are attributed AND compensated on the wire -- */
    const wAdm = gsSubmitRequest({ playerId: 'pW', kind: 'possess',
      target: 'H90', durationMin: 30 }, 60220);
    gsAdminRevoke(wAdm.id, 'wire test sweep', 60221);
    log(GS_WIRE.some(e => e.kind === 'admin' &&
          /running request was ended/.test(e.text) &&
          e.who === 'admin' && e.attrs &&
          e.attrs.compensated_cr === wAdm.billed) &&
        GS_WIRE.some(e => e.req === wAdm.id && e.status === 'refunded' &&
          /player compensated/.test(e.text) &&
          e.attrs.compensated_cr === wAdm.billed),
        'gs: v6 admin overrides post public lines with compensation in attrs');

    /* ---- lease privacy: the never-list is structural ---- */
    const wBld = gsRegisterBuilding({ street: 'Wire Lane',
      owner_id: 'landlord' });
    const wUnit = gsRegisterUnit(wBld.id, { unit_code: 'A',
      base_rent: 1500 });
    const wLeaseAddr = gsAddressOfUnit(wUnit.id);
    gsDollarGrant('T20', 6000, 'wire stake');   // tenant can actually pay
    const wApp = gsApplyForLease(wUnit.id, 'T20',
      { date: '2026-09-01' });
    gsApproveApplication(wApp.id, { date: '2026-09-01' });
    gsRentTick('2026-09-01');        // first-month charge + any payments
    const wSign = GS_WIRE.filter(e => e.kind === 'housing' &&
      /new tenancy/.test(e.text)).pop();
    log(!!wSign && wSign.text.indexOf(wLeaseAddr) >= 0 &&
        !/\$|\d{3,}/.test(wSign.text.replace(/\d{4} Wire Lane/, '')),
        'gs: v6 a signed lease posts a housing line with no money detail');
    log(!GS_WIRE.some(e => /rent_paid|deposit_paid|\$1500/.test(e.text)) &&
        GS_WIRE_SUP.n > 0 && GS_WIRE_SUP.by['lease:rent_paid'] >= 0,
        'gs: v6 individual rent payments are withheld by policy, counted');
    /* cure-or-quit is the one feed-visible notice rung */
    gsRecordViolation(wUnit.id, { kind: 'unpermitted_occupant', who: 'T21',
      discovered: true });
    gsServeNotice(wUnit.id, 'cure_or_quit', { date: '2026-09-10' });
    log(GS_WIRE.some(e => e.kind === 'housing' &&
          e.text === 'housing notice posted — ' + wLeaseAddr) &&
        !GS_WIRE.some(e => /unpermitted_occupant|T21/.test(e.text)),
        'gs: v6 a posted notice is neutral — address only, no violator');
    gsAdminEvict(wUnit.id, { override: true, reason: 'owner move-in',
      date: '2026-09-20' });
    const wEv = GS_WIRE.filter(e => e.kind === 'admin' &&
      /tenancy ended/.test(e.text)).pop();
    log(!!wEv && wEv.text === 'admin action — tenancy ended at ' +
        wLeaseAddr && !/owner move-in|reason|\$/.test(wEv.text),
        'gs: v6 eviction wording is verbatim contract — never the reason');
    /* ---- reads: filters, cursors, follow pins, archive ---- */
    const wOnlyReq = gsWire({ kind: 'request' });
    log(wOnlyReq.length > 0 && wOnlyReq.every(e => e.kind === 'request') &&
        gsWire({ status: 'not approved' }).every(e =>
          e.status === 'not approved') &&
        gsWireSince(wReq.n - 1).some(e => e.req === wReq.id),
        'gs: v6 filtered reads + since-cursors work');
    gsWireFollow('m:H90', true);
    const wFollowed = gsWire({ followedOnly: true });
    log(wFollowed.length > 0 &&
        wFollowed.every(e => (e.mentions || []).indexOf('H90') >= 0 ||
          e.who === 'H90'),
        'gs: v6 follow pins filter the wire by character');
    gsWireFollow('m:H90', false);
    const wPage = gsWirePage({ before: 999999, limit: 5 });
    log(wPage.entries.length === 5 && wPage.next != null &&
        gsWirePage({ before: wPage.next, limit: 5 }).entries.every(e =>
          e.n < wPage.entries[0].n),
        'gs: v6 paged history walks backward without repeating');
    const wDay = gsWireDays()[0];
    const wArch = gsWireArchiveDay(wDay);
    log(wArch.day === wDay && wArch.events.length > 0 &&
        wArch.events.every(e => e.day === wDay && e.id),
        'gs: v6 the archive materializes day-objects with stable ids');
    /* ---- display filter modes + parody names ---- */
    log(gsWireRedact('meet me at Bi-Rite then Dolores Park Cafe') ===
        'meet me at Buy-Rite then Dolores Perk',
        'gs: v6 player text renders parody-first');
    gsWireSetFilter('B');
    const wQuietNote = gsSubmitRequest({ playerId: 'pW', kind: 'possess',
      target: 'H90', durationMin: 5,
      params: { note: 'wave at the camera' } }, 60300);
    const wQLine = GS_WIRE.filter(e => e.req === wQuietNote.id).pop();
    gsWireSetFilter('A');
    log(!!wQLine && wQLine.text.indexOf('wave at the camera') < 0 &&
        gsWireSetFilter('C') === true && gsWireSetFilter('A') === true &&
        gsWireSetFilter('Z') === false,
        'gs: v6 display filter B withholds notes; modes are owner-set');
    gsCancelRequest(wQuietNote.id, 60301, 'player');
    /* ---- the quiet marker is honest and deduped per stretch ----
       (lease events above carry no bus minute, so pin the quiet clock
       rather than let wall time in) */
    const wQn0 = GS_WIRE.filter(e => e.kind === 'quiet').length;
    GS_WIRE_META.lastMin = 60300;
    gsBusTick(60300 + GS_WIRE_CFG.quietMin + 1);
    const wQn1 = GS_WIRE.filter(e => e.kind === 'quiet').length;
    gsBusTick(60300 + GS_WIRE_CFG.quietMin + 500);
    const wQn2 = GS_WIRE.filter(e => e.kind === 'quiet').length;
    log(wQn1 === wQn0 + 1 && wQn2 === wQn1 &&
        GS_WIRE.filter(e => e.kind === 'quiet').pop().text
          .indexOf('quiet') >= 0,
        'gs: v6 dead air posts one honest quiet marker per stretch');
    /* ---- the audit is green on a fully-lived wire ---- */
    const wAudit = gsWireAudit();
    log(wAudit.ok, 'gs: v6 wire audit — ' +
        (wAudit.ok ? 'schema, ordering, privacy all clean'
                   : wAudit.issues.slice(0, 3).join(' | ')));
    log(gsWireVocabulary().statuses.indexOf('player session ended') >= 0 &&
        gsWireVocabulary().reasonCodes.indexOf('legal-backstop') >= 0 &&
        gsWireStats().byKind.request > 0 &&
        gsWireStats().suppressed > 0,
        'gs: v6 vocabulary + stats mirror the world contracts');
    /* ---- the wire rides the bus snapshot ---- */
    const wSnap = gsBusSnapshot();
    const wIds = GS_WIRE.map(e => e.id);
    gsBusReset();
    log(GS_WIRE.length === 0 && gsBusLoad(wSnap) &&
        GS_WIRE.length === wIds.length &&
        GS_WIRE.every((e, i) => e.id === wIds[i]),
        'gs: v6 the wire survives snapshot/load with identical ids');
    /* ---- gsViewerState exposes the formatted feed, not raw rows ---- */
    const wVS = gsViewerState(60400);
    log(Array.isArray(wVS.feed) && Array.isArray(wVS.feedRaw) &&
        wVS.feed.every(e => typeof e.text === 'string' && e.kind) &&
        wVS.feedRaw.every(e => e.type && e.n != null),
        'gs: v6 viewerState.feed is the display-safe wire; feedRaw is raw');

    /* ================= v7: THE DOOR POLICY (anti-grief) =================
       every venue has a door policy: who gets in, how often, what it
       costs tonight, and who the door remembers. Account flags, rate
       caps, surge + patience pricing, the appeal lane, the legal kill
       switch, the ad trickle, the rep notebook, the resource board —
       all enforced before a credit moves wrongly. */

    // ---- v7: the pre-payment receipt is the door's own math ----
    gsMarkHired('H70', 'pV');
    const qt0 = gsPriceQuote({ playerId: 'pV', kind: 'possess',
      target: 'H70', durationMin: 10 }, 62000);
    log(qt0.ok && qt0.base === 40 && qt0.total === 40 && qt0.surge === 1 &&
        qt0.wouldQueue === false && qt0.wouldReview === false &&
        qt0.ratePerMin === 4 && qt0.refundNote.length > 0,
        'gs: v7 gsPriceQuote — the honest receipt before a credit moves');
    const qtW = gsPriceQuote({ playerId: 'pV', kind: 'weather',
      durationMin: 10, params: { wx: 'fog' } }, 62000);
    log(qtW.ok && qtW.wouldReview === true && qtW.lane === 'exclusive' &&
        qtW.queueDiscount === 0,
        'gs: v7 the receipt names the review lane honestly');
    log(gsPriceQuote({ playerId: 'pV', kind: 'possess',
        target: 'C1', durationMin: 10 }, 62000).deny === 'possession_ban',
        'gs: v7 the receipt refuses what the door would refuse');

    // ---- v7: surge — pressure on a shared resource raises the cover ----
    gsCreditGrant('gA', 5000, 'stake'); gsCreditGrant('gB', 5000, 'stake');
    gsCreditGrant('gC', 5000, 'stake'); gsCreditGrant('gD', 5000, 'stake');
    gsCreditGrant('gE', 5000, 'stake');
    const gW1 = gsSubmitRequest({ playerId: 'gA', kind: 'weather',
      durationMin: 10, params: { wx: 'fog' } }, 62000);
    const gW2 = gsSubmitRequest({ playerId: 'gB', kind: 'weather',
      durationMin: 10, params: { wx: 'heatwave' } }, 62001);
    const gW3 = gsSubmitRequest({ playerId: 'gC', kind: 'weather',
      durationMin: 10, params: { wx: 'fog' } }, 62002);
    log(gW1.status === 'in_review' && gW1.billed === 60 && gW1.surge === 1 &&
        gW2.status === 'in_review' && gW2.billed === 90 &&
        gW2.surge === 1.5 &&
        gW3.status === 'in_review' && gW3.billed === 105 &&
        gW3.surge === 1.75,
        'gs: v7 surge — pressure on the sky raises the cover charge');
    const qtS = gsPriceQuote({ playerId: 'gW9', kind: 'weather',
      durationMin: 10, params: { wx: 'fog' } }, 62003);
    log(qtS.ok && qtS.surge === 2 && qtS.surgePressure === 3 &&
        qtS.total === 120 && qtS.wouldReview === true,
        'gs: v7 the receipt shows surge + lane before payment');
    gsReviewResolve(gW1.id, true,  { nowMin: 62004 });   // fog runs
    gsReviewResolve(gW3.id, false, { code: 'gray-zone', nowMin: 62005 });
    gsReviewResolve(gW2.id, true,  { nowMin: 62006 });   // contradicts: queues
    log(gW1.status === 'active' && gW3.status === 'denied' &&
        gW2.status === 'queued' && gW2.discount === 0.15 &&
        gW2.billed === 77 && gW2.refunded === 13,
        'gs: v7 review->queue reconciles the patience discount');
    const gW4 = gsSubmitRequest({ playerId: 'gD', kind: 'weather',
      durationMin: 10, params: { wx: 'storm' } }, 62007);
    /* pressure = 2 live sky filings (gW1 active, gW2 parked; gW3's denial
       doesn't count) -> surge 1.75 -> 105 list -> -15% patience = 90 */
    log(gW4.status === 'queued' && gW4.billed === 90 &&
        gW4.surge === 1.75 && gW4.discount === 0.15,
        'gs: v7 surge + patience discount compose on a queued filing');
    /* cancelling the running sky promotes the queue in FCFS order —
       gW2 was already reviewed (activates); gW4 reviews AT activation
       and holds its slot while a human reads (no leapfrog). The board
       reads 'queued' — never 'free' — while the line is held. */
    gsCancelRequest(gW1.id, 62010, 'player');
    gsCancelRequest(gW2.id, 62013, 'admin');
    const gW5 = gsSubmitRequest({ playerId: 'gE', kind: 'weather',
      durationMin: 10, params: { wx: 'clear' } }, 62013);
    const boardV = gsResourceBoard(62014);
    log(gW2.status === 'cancelled' && gW4.status === 'in_review' &&
        gW4.holdsLine === true && gW5.status === 'queued' &&
        boardV['sky'] && boardV['sky'].state === 'queued' &&
        boardV['sky'].depth === 1,
        'gs: v7 review-at-activation holds the FCFS slot; board reads queued');
    gsReviewResolve(gW4.id, false, { code: 'gray-zone', nowMin: 62015 });
    log(gW5.status === 'in_review' && gW5.holdsLine === true,
        'gs: v7 the next in line reviews at activation, not while waiting');
    gsReviewResolve(gW5.id, true, { nowMin: 62016 });
    log(gW5.status === 'active',
        'gs: v7 the cleared sky runs on approval');
    gsCancelRequest(gW5.id, 62020, 'player');
    /* primetime (18:00-23:00 PT) adds one surge step to world-scale
       asks — find a primetime minute on this clock and prove the bump */
    let pm = null;
    for(let m = 63000; m < 63000 + 2880 && pm == null; m += 60)
      if(gsBusPrimetime(m)) pm = m;
    gsCreditGrant('gPT', 5000, 'stake');
    const wPT = gsSubmitRequest({ playerId: 'gPT', kind: 'weather',
      durationMin: 10, params: { wx: 'clear' } }, pm);
    log(pm != null && wPT.status === 'in_review' &&
        wPT.surge === 1.5 && wPT.billed === 90,
        'gs: v7 primetime adds a surge step to world-scale asks');
    gsReviewResolve(wPT.id, false, { code: 'gray-zone', nowMin: pm + 1 });

    // ---- v7: the door opens only so often — rate caps, pre-billing ----
    gsCreditGrant('rT', 5000, 'stake');
    let lastR = null;
    for(let i = 0; i < 20; i++)
      lastR = gsSubmitRequest({ playerId: 'rT', kind: 'possess',
        target: 'H' + (220 + i), durationMin: 10 }, 62100);
    const r21 = gsSubmitRequest({ playerId: 'rT', kind: 'possess',
        target: 'H240', durationMin: 10 }, 62100);
    log(lastR.status === 'denied' && lastR.reason === 'not_your_character' &&
        r21.status === 'denied' && r21.reason === 'rate_limited' &&
        gsCreditBalance('rT') === 5000,     // refused filings never billed
        'gs: v7 20 filings/hour per player — the 21st is refused free');
    /* eight live seats per player — the ninth waits outside */
    gsCreditGrant('rV', 5000, 'stake');
    const liveReqs = [];
    for(let i = 0; i < 8; i++){
      gsMarkHired('H3' + (10 + i), 'rV');
      liveReqs.push(gsSubmitRequest({ playerId: 'rV', kind: 'possess',
        target: 'H3' + (10 + i), durationMin: 60 }, 62200));
    }
    gsMarkHired('H318', 'rV');
    const ninth = gsSubmitRequest({ playerId: 'rV', kind: 'possess',
        target: 'H318', durationMin: 60 }, 62200);
    log(liveReqs.every(r => r.status === 'active') &&
        ninth.status === 'denied' && ninth.reason === 'too_many_live',
        'gs: v7 flood-of-queue cap — 8 live requests max, rest refused');
    for(const r of liveReqs) gsCancelRequest(r.id, 62201, 'player');

    // ---- v7: the account flag ladder — the door remembers verdicts ----
    /* sT's earlier content denials (harm +2, legal +3, secrets +1, scope
       +1, admin +1 = 8) still ride the account: suspended til ~63070,
       flagged for review til ~68830. Pattern Pat was released with the
       v5 seat cleanup — sT hires them back for the ladder walk. */
    gsMarkHired('H64', 'sT', { name: 'Pattern Pat' });
    const suspTry = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H64', durationMin: 10 }, 51000);
    log(suspTry.status === 'denied' &&
        suspTry.reason === 'account_suspended',
        'gs: v7 flag score 6+ suspends request privileges for 72h');
    const flagR = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H64', durationMin: 10 }, 63200);
    /* past suspension but still flagged: a clean filing still parks — the
       fixation history (5 screen denials in 30d) is the more specific lane */
    log(flagR.status === 'in_review' && flagR.screen === 'repeat-pattern' &&
        gsFlagStatus('sT', 63200).score === 8,
        'gs: v7 flag score 3+ routes every filing through human review');
    gsReviewResolve(flagR.id, false, { code: 'gray-zone', nowMin: 63201 });
    gsFlagBump('sT', 3, 'legal-backstop', 62300);   // a legal verdict lands
    const holdTry = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H64', durationMin: 10 }, 62301);
    log(gsFlagStatus('sT', 62301).ownerHold === true &&
        gsFlagStatus('sT', 62301).score === 11 &&
        holdTry.status === 'denied' && holdTry.reason === 'account_review',
        'gs: v7 owner-hold at 9 — only the owner reopens the door');
    log(gsFlagScore('sT', 62300 + 31 * 1440) === 10,
        'gs: v7 the flag score decays one point per clean 30 days');
    gsFlagClear('sT', 'owner', 62302);
    const freeTry = gsSubmitRequest({ playerId: 'sT', kind: 'possess',
        target: 'H64', durationMin: 10 }, 62302);
    log(gsFlagStatus('sT', 62302).score === 0 &&
        freeTry.status === 'active',
        'gs: v7 gsFlagClear is the owner tool — the account walks again');
    gsCancelRequest(freeTry.id, 62303, 'player');

    // ---- v7: the appeal lane — once, free, different reviewer, final ----
    gsCreditGrant('aP', 5000, 'stake'); gsMarkHired('H71', 'aP');
    const aP0 = gsCreditBalance('aP');
    const den1 = gsSubmitRequest({ playerId: 'aP', kind: 'possess',
        target: 'H71', durationMin: 10,
        params: { note: 'confront the neighbors about the fence' } }, 62400);
    log(den1.status === 'in_review' && den1.billed === 40,
        'gs: v7 appealable requests park first (gray-zone here)');
    gsReviewResolve(den1.id, false, { code: 'gray-zone', by: 'mod1',
                                      nowMin: 62401 });
    log(den1.status === 'denied' && gsCreditBalance('aP') === aP0,
        'gs: v7 the denied request refunds before the appeal window opens');
    const ap1 = gsAppealRequest(den1.id, { playerId: 'aP', nowMin: 62402 });
    log(ap1.ok && ap1.request.status === 'in_review' &&
        ap1.request.appealOf === den1.id && ap1.request.billed === 0 &&
        gsCreditBalance('aP') === aP0,
        'gs: v7 appeals file free — the run re-bills only on approval');
    const sameMod = gsReviewResolve(ap1.request.id, true,
                                    { by: 'mod1', nowMin: 62403 });
    log(sameMod && sameMod.error === 'same_reviewer' &&
        ap1.request.status === 'in_review',
        'gs: v7 appeals refuse the original reviewer');
    gsReviewResolve(ap1.request.id, true, { by: 'mod2', nowMin: 62404 });
    log(ap1.request.status === 'active' &&
        gsCreditBalance('aP') === aP0 - 40 &&
        !GS_WIRE.some(e => /confront the neighbors/.test(e.text)),
        'gs: v7 an overturned appeal re-bills once — and the once-denied ' +
        'text still never airs');
    gsCancelRequest(ap1.request.id, 62410, 'player');
    const den2 = gsSubmitRequest({ playerId: 'aP', kind: 'possess',
        target: 'H71', durationMin: 10,
        params: { note: 'confront the noisy upstairs flat' } }, 62500);
    gsReviewResolve(den2.id, false, { code: 'gray-zone', by: 'mod1',
                                      nowMin: 62501 });
    const ap2 = gsAppealRequest(den2.id, { playerId: 'aP', nowMin: 62502 });
    gsReviewResolve(ap2.request.id, false, { code: 'gray-zone', by: 'mod2',
                                             nowMin: 62503 });
    const refile = gsSubmitRequest({ playerId: 'aP', kind: 'possess',
        target: 'H71', durationMin: 10,
        params: { note: 'confront the noisy upstairs flat' } }, 62504);
    const reword = gsSubmitRequest({ playerId: 'aP', kind: 'possess',
        target: 'H71', durationMin: 10,
        params: { note: 'check in on the neighbors' } }, 62505);
    log(ap2.ok && ap2.request.status === 'denied' &&
        refile.status === 'denied' && refile.reason === 'appeal_final' &&
        gsAppealRequest(den2.id, { playerId: 'aP', nowMin: 62505 })
          .err === 'already_appealed' &&
        reword.status === 'in_review' && reword.screen === 'repeat-pattern',
        'gs: v7 second denial is final — refiling refused, a reworded ' +
        'ask is new (and the fixation history still routes it to review)');
    gsReviewResolve(reword.id, true, { nowMin: 62506 });
    gsCancelRequest(reword.id, 62507, 'player');
    log(gsAppealRequest(reword.id, { playerId: 'aP', nowMin: 62510 })
          .err === 'not_denied' &&
        gsAppealRequest(den1.id, { playerId: 'OTHER', nowMin: 62510 })
          .err === 'not_your_request',
        'gs: v7 appeal eligibility is enforced — owner + denied only');

    // ---- v7: the legal kill switch — full refund, ordinary wording ----
    gsCreditGrant('lT', 5000, 'stake'); gsMarkHired('H72', 'lT');
    const lQ = gsSubmitRequest({ playerId: 'lT', kind: 'possess',
        target: 'H72', durationMin: 30 }, 62600);
    const lBal = gsCreditBalance('lT');
    log(gsEscalateLegal(lQ.id, 62610) === true &&
        lQ.status === 'denied' && lQ.reason === 'legal-backstop' &&
        lQ.refunded === lQ.billed &&
        gsCreditBalance('lT') === lBal + lQ.billed &&
        GS_WIRE.some(e => e.req === lQ.id &&
          e.text === 'request not approved' &&
          e.reason_code === 'legal-backstop') &&
        !GS_WIRE.some(e => /legal kill|lawsuit|attorney/i.test(e.text)),
        'gs: v7 legal kills mid-flight — full refund, ordinary deny wording');
    const lFlags = gsFlagStatus('lT', 62611);
    log(lFlags.score === 3 && lFlags.reviewUntil > 62611,
        'gs: v7 the legal verdict lands the +3 flag — a week of review');
    const lNext = gsSubmitRequest({ playerId: 'lT', kind: 'possess',
        target: 'H72', durationMin: 10 }, 62612);
    log(lNext.status === 'in_review' && lNext.lane === 'flagged',
        'gs: v7 a flagged account files through human review for a week');
    gsReviewResolve(lNext.id, false, { code: 'gray-zone', nowMin: 62613 });

    // ---- v7: the ad trickle — the only free mint, honestly capped ----
    const adP = 'aViewer';
    const ad0 = gsCreditBalance(adP);
    let adOk = 0, adCap = null;
    for(let i = 0; i < 6; i++){
      const w = gsWatchAd(adP, 62700);
      if(w && w.ok) adOk++; else adCap = w;
    }
    log(adOk === 5 && adCap && adCap.capHit === true &&
        gsCreditBalance(adP) === ad0 + 10 &&
        gsAdStatus(adP, 62700).capLeft === 0,
        'gs: v7 ads mint 2cr/view, capped at 5 per PT day — never a flood');
    log(gsWatchAd(adP, 62700 + 1440).ok === true,
        'gs: v7 the ad cap resets with the Pacific day');

    // ---- v7: the resource board — free / cool / locked / queued ----
    gsMarkHired('H73', 'bP'); gsCreditGrant('bP', 5000, 'stake');
    const bA = gsSubmitRequest({ playerId: 'bP', kind: 'possess',
        target: 'H73', durationMin: 30 }, 62800);
    const bQ = gsSubmitRequest({ playerId: 'bP', kind: 'possess',
        target: 'H73', durationMin: 10 }, 62801);
    const bEv = gsSubmitRequest({ playerId: 'bP', kind: 'street_event',
        durationMin: 20,
        params: { event: 'park_cleanup', at: 'Boardwalk Plaza' } }, 62803);
    gsReviewResolve(bEv.id, true, { nowMin: 62803, by: 'mod-b' });
    const board2 = gsResourceBoard(62804);
    log(bA.status === 'active' && bQ.status === 'queued' &&
        bQ.billed === 34 &&                     // ceil(40 * 0.85)
        bEv.status === 'active' &&
        board2['char:H73'].state === 'locked' &&
        board2['char:H73'].depth === 1 &&
        board2['char:H73'].holder === bA.id,
        'gs: v7 the board shows the lock holder + queue depth honestly');
    gsCancelRequest(bQ.id, 62805, 'player');
    gsCancelRequest(bA.id, 62806, 'player');
    gsCancelRequest(bEv.id, 62810, 'player');
    const board3 = gsResourceBoard(62811);
    log(board3['venue:boardwalk plaza'] &&
        board3['venue:boardwalk plaza'].state === 'cool' &&
        board3['venue:boardwalk plaza'].leftMin > 1400 &&
        board3['char:H73'] === undefined,       // freed seats leave the board
        'gs: v7 the board reads cool on a resting venue, frees closed seats');

    // ---- v7: the driven wallet — card limit + real payees only ----
    gsMarkHired('H74', 'wP'); gsCreditGrant('wP', 5000, 'stake');
    gsDollarGrant('H74', 2000, 'savings');
    const wS = gsSubmitRequest({ playerId: 'wP', kind: 'possess',
        target: 'H74', durationMin: 30 }, 62900);
    const payGhost = gsPossessPay('H74', 'wP', 'GHOST-99', 10, 'x', 62901);
    const pay600 = gsPossessPay('H74', 'wP', 'A02', 600, 'big', 62902);
    const pay499 = gsPossessPay('H74', 'wP', 'A02', 499, 'ok', 62903);
    const payMore = gsPossessPay('H74', 'wP', 'A02', 10, 'over', 62904);
    log(wS.status === 'active' &&
        payGhost.err === 'unknown_payee' &&
        pay600.err === 'spend_cap' &&
        pay499.ok === true &&
        payMore.err === 'spend_cap' &&
        gsDollarBalance('H74') === 2000 - 499,
        'gs: v7 the driven card caps at $500/session + real payees only');
    gsCancelRequest(wS.id, 62910, 'admin');

    // ---- v7: the owner dashboard + the reputation notebook ----
    const mm = gsModMetrics(62920);
    log(mm && mm.reviewDepth >= 0 && mm.medianDecisionMin != null &&
        mm.denialsByCode['legal-backstop'] >= 1 &&
        mm.denialsByCode['rate_limited'] >= 1 &&
        mm.appeals.filed >= 2 && mm.appeals.overturned >= 1 &&
        mm.appeals.denied >= 1 && mm.appeals.refused >= 1,
        'gs: v7 the owner dashboard reads denials, appeals, wait times');
    log(gsRepLedger('sT').some(e => e.kind === 'flag' && e.w === 3) &&
        gsRepLedger('sT').some(e => e.kind === 'cleared') &&
        gsRepLedger('rT').some(e => e.kind === 'rate') &&
        gsRepLedger('owner').some(e => e.kind === 'legal_kill'),
        'gs: v7 the rep notebook records flags, floods, legal kills, clears');
    log(!GS_WIRE.some(e => /flag|suspend|account|appeal/i.test(e.text)),
        'gs: v7 account state never reaches the public wire');

    // ---- v7: the door policy survives snapshot/load ----
    const gSnap = gsBusSnapshot();
    gsBusReset();
    log(gsBusLoad(gSnap) &&
        gsFlagStatus('lT', 62930).reviewUntil > 0 &&
        gsAdStatus(adP, 62700 + 1440).viewsToday === 1 &&
        gsRepLedger('sT').length > 0,
        'gs: v7 flags, ads + the notebook ride the bus snapshot');
    const refile2 = gsSubmitRequest({ playerId: 'aP', kind: 'possess',
        target: 'H71', durationMin: 10,
        params: { note: 'confront the noisy upstairs flat' } }, 62930);
    log(refile2.status === 'denied' && refile2.reason === 'appeal_final',
        'gs: v7 appeal finality survives snapshot/load');

    /* ================= v8: THE PERSONNEL OFFICE (hiring) ============
       the hire is a real application now — file, screen, approve, sign,
       move in, work. The suite's marked hires retire to open seats
       under the 24-cap; real hires below keep the cast ledger-sized. */
    for(const cid of ['H310','H311','H312','H313','H314','H315','H316',
                      'H317','H318','H70','H40','H50','H90','H91',
                      'H71','H72','H73','H74','H20','H21','H22','H23',
                      'H24','H25'])
      gsReleaseHired(cid, 'v8 needs seats');
    gsCreditGrant('hP', 5000, 'v8 stake');
    gsCreditGrant('hQ', 5000, 'v8 stake');
    gsCreditGrant('hB', 300, 'v8 short stake');
    const h8b = gsRegisterBuilding({ street: 'Personnel Street',
                                     owner_id: 'landlord' });
    const uStd  = gsRegisterUnit(h8b.id, { unit_code: 'A', base_rent: 1400 });
    const uBig  = gsRegisterUnit(h8b.id, { unit_code: 'B', base_rent: 2000 });
    const uRich = gsRegisterUnit(h8b.id, { unit_code: 'C', base_rent: 2100 });
    const uLo   = gsRegisterUnit(h8b.id, { unit_code: 'D', base_rent: 700 });
    const uMid  = gsRegisterUnit(h8b.id, { unit_code: 'E', base_rent: 1200 });

    /* the board is a live mirror of the canonical openings */
    const board8 = gsJobBoard();
    log(board8.length >= 13 &&
        board8.some(j => j.id === 'mudhaus-barista' && j.openings === 1) &&
        board8.some(j => j.id === 'seeking' && j.accepting) &&
        board8.find(j => j.id === 'farolote-line').openings === 0 &&
        board8.every(j => j.est >= 0 && j.role),
        'gs: v8 the job board mirrors the canonical openings');
    /* the availability check is the create-form gate, live */
    const nc8 = gsHireNameCheck('Marisol Delgado');
    log(nc8.ok === false && nc8.reason === 'name_collision' &&
        gsHireNameCheck('a landlord clone').reason === 'name_collision' &&
        gsHireNameCheck('x').reason === 'name_too_short' &&
        gsHireNameCheck('Newcomer Nan').reason === 'name_collision' &&
        gsHireNameCheck('Peregrine Booth').ok === true,
        'gs: v8 name availability — taken names, role words, born hires');
    /* structural denials refuse before money — the filing gets a real
       refusal back and nothing ever bills */
    const hBal8 = gsCreditBalance('hP');
    /* (all on the pricey door — denied filings accuse THAT door's
       repeat-pattern; the clean application below lands on another) */
    const dName8 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uRich.id, durationMin: 5,
        params: { job: 'muleit-rider', moveInDate: '2026-09-22' } }, 70000);
    const dAge8 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uRich.id, durationMin: 5,
        params: { name: 'Kid Kim', age: 16, job: 'muleit-rider',
                  moveInDate: '2026-09-22' } }, 70001);
    const dLook8 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uRich.id, durationMin: 5,
        params: { name: 'Look Lou', look: { build: 'enormous' },
                  job: 'muleit-rider', moveInDate: '2026-09-22' } }, 70002);
    const dJob8 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uRich.id, durationMin: 5,
        params: { name: 'Job Jo', job: 'astronaut',
                  moveInDate: '2026-09-22' } }, 70003);
    const dTaken8 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uRich.id, durationMin: 5,
        params: { name: 'Marisol Delgado', job: 'muleit-rider',
                  moveInDate: '2026-09-22' } }, 70004);
    const dFill8 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uRich.id, durationMin: 5,
        params: { name: 'Late Lana', job: 'farolote-line',
                  moveInDate: '2026-09-22' } }, 70005);
    const dReach8 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uRich.id, durationMin: 5,
        params: { name: 'Reach Rae', job: 'bloom-saturday',
                  moveInDate: '2026-09-22' } }, 70006);
    log(dName8.reason === 'needs_name' && dAge8.reason === 'underage' &&
        dLook8.reason === 'bad_look' && dJob8.reason === 'unknown_job' &&
        dTaken8.reason === 'name_collision' &&
        dFill8.reason === 'job_filled' && dReach8.reason === 'out_of_reach',
        'gs: v8 application denials — name, age, look, job, filled, ceiling');
    log(gsCreditBalance('hP') === hBal8 &&
        dName8.status === 'denied' && dReach8.status === 'denied',
        'gs: v8 structural denials never bill — not one credit moved');

    /* the complete application parks in the naming lane, nothing billed */
    const hApp8 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uStd.id, durationMin: 5,
        params: { name: 'Peregrine Booth', age: 34,
                  job: 'buyrite-clerk', moveInDate: '2026-09-22',
                  bio: 'line cook learning the block',
                  arrival: 'off the 48 with a duffel',
                  look: { build: 'compact', palette: 'ochre',
                          signature: 'windbreaker, always' } } }, 70010);
    log(hApp8.status === 'in_review' && hApp8.lane === 'naming' &&
        hApp8.billed === 0 && hApp8.deferred === true &&
        gsCreditBalance('hP') === hBal8,
        'gs: v8 a complete application parks with nothing billed');
    gsReviewResolve(hApp8.id, false, { code: 'review_denied',
                                       nowMin: 70011, by: 'mod-b' });
    log(hApp8.status === 'denied' && hApp8.billed === 0 &&
        (hApp8.refunded || 0) === 0 &&
        gsCreditBalance('hP') === hBal8,
        'gs: v8 review denial — zero billed, zero refunded, zero moved');

    /* approval with empty pockets fails honestly — nothing was ever
       charged, so there is nothing to refund and nobody moves in */
    const hShort8 = gsSubmitRequest({ playerId: 'hB', kind: 'hire',
        target: uLo.id, durationMin: 5,
        params: { name: 'Broke Brit', job: 'muleit-rider',
                  moveInDate: '2026-09-22' } }, 70020);
    gsReviewResolve(hShort8.id, true, { nowMin: 70021 });
    log(hShort8.status === 'failed' &&
        hShort8.failReason === 'insufficient_credits' &&
        gsCreditBalance('hB') === 300 && !gsActiveLease(uLo.id) &&
        GS_JOBS.find(j => j.id === 'muleit-rider').openings === -1,
        'gs: v8 approval with empty pockets fails — no charge, no char');

    /* approval: the charge lands once, the file opens, the package
       signs through the ordinary application path */
    const hApp9 = gsSubmitRequest({ playerId: 'hP', kind: 'hire',
        target: uStd.id, durationMin: 5,
        params: { name: 'Peregrine Booth', age: 34,
                  job: 'buyrite-clerk', moveInDate: '2026-09-22',
                  bio: 'line cook learning the block',
                  arrival: 'off the 48 with a duffel',
                  look: { build: 'compact', palette: 'ochre',
                          signature: 'windbreaker, always' } } }, 70030);
    gsReviewResolve(hApp9.id, true, { nowMin: 70031, by: 'mod-a' });
    const cid8 = hApp9.charId;
    const h8 = cid8 && GS_HIRED[cid8];
    const lease8 = cid8 && gsActiveLease(uStd.id);
    log(hApp9.status === 'active' && hApp9.billed === 500 &&
        gsCreditBalance('hP') === hBal8 - 500 &&
        /^h\d\d$/.test(cid8 || '') && h8 &&
        h8.name === 'Peregrine Booth' && h8.age === 34 &&
        h8.bio === 'line cook learning the block' &&
        h8.arrival === 'off the 48 with a duffel' &&
        h8.job && h8.job.id === 'buyrite-clerk' &&
        h8.job.weeklyWage === 600,
        'gs: v8 approval bills 500 once — the file opens whole');
    log(lease8 && lease8.tenant_id === cid8 && lease8.deposit === 0 &&
        lease8.hirePackage === true &&
        GS_LEASE.apps.some(a => a.applicant_id === cid8 &&
                                a.status === 'approved') &&
        gsDollarBalance(cid8) === 1600 - 420,
        'gs: v8 the hire package signs like any tenant — deposit ' +
        'waived, pro-rated first month paid out of the arrival bank');
    log(GS_JOBS.find(j => j.id === 'buyrite-clerk').openings === 0 &&
        GS_WIRE.some(e => e.kind === 'cast' &&
          /Peregrine Booth/.test(e.text) && /joins the cast/.test(e.text)) &&
        !/\b500\b|\$\d|credits?/i.test(GS_WIRE.filter(e =>
          /Peregrine/.test(e.text)).map(e => e.text).join(' ')),
        'gs: v8 the opening is consumed; the wire tells the block, ' +
        'never the fee');

    /* the routine is the posted shift; the look is the picked look */
    const rt8 = gsHiredRoutine(cid8);
    const wk8 = rt8.find(b => b.to && b.to.poi === 'Bi-Rite Market');
    log(!!wk8 && wk8.h0 === 8 && wk8.h1 === 16.5 &&
        wk8.state === 'serve' &&
        rt8[0].h0 === 0 && rt8[rt8.length - 1].h1 === 24 &&
        rt8.every(b => b.h0 < b.h1),
        'gs: v8 the routine walks the real shift at the real employer');
    const lk8 = gsHiredLook(cid8);
    log(lk8.shirt === GS_HIRE_PALETTE['ochre'] &&
        lk8.outfit === 'jacket' && lk8.build === 'compact' &&
        lk8.palette === 'ochre' &&
        lk8.signature === 'windbreaker, always',
        'gs: v8 structured look picks paint the character');

    /* Friday payroll: employer -> character through the same ledger */
    const fri8 = gsJobTick('2026-09-25');
    const pay8 = fri8.paid.find(x => x.cid === cid8);
    const due8 = gsBiweeklyDue(hiredId, '2026-09-25');
    log(!!pay8 && pay8.amt === 600 && pay8.bonus === 0 &&
        pay8.employer === 'Buy-Rite Market' &&
        gsDollarBalance(cid8) === 1180 + 600 &&
        h8.lastPayday === '2026-09-25' &&
        gsJobTick('2026-09-25').paid.length === 0 &&
        (fri8.paid.some(x => x.cid === hiredId)) === due8 &&
        (!due8 ||
          fri8.paid.find(x => x.cid === hiredId).amt === 1800),
        'gs: v8 weekly wages post Friday; biweekly bands alternate');

    /* a possessed shift earns the same wage + the session bonus */
    const poss8 = gsSubmitRequest({ playerId: 'hP', kind: 'possess',
        target: cid8, durationMin: 30 }, 70040);
    const fri9 = gsJobTick('2026-10-02');
    const payB8 = fri9.paid.find(x => x.cid === cid8);
    log(poss8.status === 'active' && !!payB8 &&
        payB8.bonus === 90 && payB8.amt === 690 &&
        h8.wagesEarned === 600 + 690,
        'gs: v8 driving on payday earns wage + the small session bonus');
    gsCancelRequest(poss8.id, 70045, 'admin');

    /* rent comes out of earned wages through the same ledger */
    const balPreRent = gsDollarBalance(cid8);
    const rr8 = gsRentTick('2026-10-22');
    log(rr8.paid.some(p => p.cid === cid8 && p.unit === uStd.id) &&
        gsDollarBalance(cid8) < balPreRent,
        'gs: v8 wages pay the rent — one economy, both directions');

    /* 'seeking' stays legal — the runway number replaces a locked door */
    const hSeek8 = gsSubmitRequest({ playerId: 'hQ', kind: 'hire',
        target: uBig.id, durationMin: 5,
        params: { name: 'Seeker Sage', age: 41, job: 'seeking',
                  moveInDate: '2026-09-22' } }, 70050);
    gsReviewResolve(hSeek8.id, true, { nowMin: 70051 });
    const seek8 = hSeek8.charId && GS_HIRED[hSeek8.charId];
    log(hSeek8.status === 'active' && !!seek8 &&
        seek8.job.id === 'seeking' && seek8.runwayMonths === 0.8 &&
        gsDollarBalance(hSeek8.charId) === 1000,
        'gs: v8 a seeking hire arrives — runway on file, bank - first month');
    const qSeek8 = gsHireQuote({ playerId: 'hQ', target: uBig.id,
        params: { name: 'Another Seeker', job: 'seeking',
                  moveInDate: '2026-09-22' } });
    log(qSeek8.ok && qSeek8.runwayMonths === 0.8 &&
        /runs dry/.test(qSeek8.runwayNote) &&
        qSeek8.fee === 500 && qSeek8.deposit === 0 &&
        !qSeek8.outOfReach,
        'gs: v8 the disclosure card shows fee, runway, waived deposit');

    /* taking real work later: the ceiling binds, the slot is consumed,
       the routine re-anchors, the block hears about it */
    const tk8 = gsHiredTakeJob(hSeek8.charId, 'sfgh-cna');
    log(tk8.ok === false && tk8.reason === 'out_of_reach' &&
        GS_JOBS.find(j => j.id === 'sfgh-cna').openings === 2,
        'gs: v8 an unreachable job is refused before the slot moves');
    const tk9 = gsHiredTakeJob(hSeek8.charId, 'delfino-line');
    const rt9 = gsHiredRoutine(hSeek8.charId);
    log(tk9.ok && GS_HIRED[hSeek8.charId].job.id === 'delfino-line' &&
        GS_JOBS.find(j => j.id === 'delfino-line').openings === 0 &&
        GS_HIRED[hSeek8.charId].runwayMonths === null &&
        rt9.some(b => b.to && b.to.poi === 'Delfina' &&
                      b.h0 === 16.5 && b.h1 === 23) &&
        GS_FEED.some(e => e.type === 'hire' &&
          e.action === 'job_start' && e.charId === hSeek8.charId),
        'gs: v8 taking work consumes the opening, re-anchors the day');

    /* eviction happens — arrears are real. The humane end is a second
       apartment hunt: rehouse signs a normal lease, deposit and all */
    const rehNo8 = gsSubmitRequest({ playerId: 'hP', kind: 'rehouse',
        target: uLo.id, durationMin: 5,
        params: { charId: hSeek8.charId } }, 70060);
    gsAdminEvict(uBig.id, { date: '2026-09-24', override: true,
                            reason: 'no-fault' });
    log(rehNo8.reason === 'not_your_character' &&
        GS_HIRED[hSeek8.charId].unitId === null &&
        !gsActiveLease(uBig.id),
        'gs: v8 only your own hire re-houses; eviction leaves them hired');
    const reh8 = gsSubmitRequest({ playerId: 'hQ', kind: 'rehouse',
        target: uLo.id, durationMin: 5,
        params: { charId: hSeek8.charId,
                  moveInDate: '2026-09-24' } }, 70061);
    log(reh8.status === 'active' &&
        GS_HIRED[hSeek8.charId].unitId === uLo.id &&
        gsActiveLease(uLo.id) && gsActiveLease(uLo.id).deposit === 700 &&
        !gsActiveLease(uLo.id).hirePackage &&
        gsDollarBalance(hSeek8.charId) === 1000 - 700 - 163 &&
        GS_FEED.some(e => e.type === 'hire' && e.action === 'rehouse'),
        'gs: v8 rehouse is a real second lease — deposit owed');

    /* the public file: roster + briefing carry the whitelisted profile */
    const ros8 = gsHiredRoster().find(r => r.id === cid8);
    const brf8 = gsPossessionBriefing(cid8);
    log(!!ros8 && ros8.owner === 'hP' && ros8.age === 34 &&
        ros8.job && ros8.job.employer === 'Buy-Rite Market' &&
        /Personnel Street/.test(ros8.home || '') &&
        ros8.bio === 'line cook learning the block' &&
        ros8.spawned === (typeof SF_MODE !== 'undefined' && !!SF_MODE) &&
        !/seed|secret|screen|flag|appeal|suspend|wagesEarned|account/i
          .test(JSON.stringify(ros8)),
        'gs: v8 the roster reads like a public file — internals never');
    log(!!brf8 && brf8.age === 34 &&
        brf8.bio === 'line cook learning the block' &&
        brf8.arrival === 'off the 48 with a duffel' &&
        brf8.job && brf8.job.employer === 'Buy-Rite Market' &&
        brf8.home && /Personnel Street/.test(brf8.home.address || '') &&
        gsBriefingAudit(brf8).ok === true,
        'gs: v8 the briefing carries the whitelisted profile, audit clean');

    /* a reviewed hire that still has to queue pays the patience rate —
       the escrow's paperwork blocks the lease's, FCFS as always */
    gsDollarGrant(hiredId, 5000, 'escrow float');
    const lst9 = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
        target: uMid.id, durationMin: 60,
        params: { ask: 400 } }, 70070);
    const buy9 = gsSubmitRequest({ playerId: 'pD', kind: 'buy',
        target: uMid.id, durationMin: 1,
        params: { buyerId: hiredId } }, 70071);
    const hQ8 = gsSubmitRequest({ playerId: 'hQ', kind: 'hire',
        target: uMid.id, durationMin: 5,
        params: { name: 'Queued Quinn', job: 'perk-counter',
                  moveInDate: '2026-09-22' } }, 70072);
    /* (the instant sale closes the listing request — the escrow's
       own paper claim is what the hire queues behind) */
    log(lst9.status === 'completed' && buy9.status === 'active' &&
        hQ8.status === 'in_review',
        'gs: v8 escrow holds the unit\'s paperwork while the app reads');
    gsReviewResolve(hQ8.id, true, { nowMin: 70072 });
    log(hQ8.status === 'queued' &&
        hQ8.billed === Math.ceil(hQ8.price * (1 - GS_QUEUE_DISCOUNT)) &&
        hQ8.discount === GS_QUEUE_DISCOUNT,
        'gs: v8 an approved hire behind escrow queues at -15%');
    gsBusTick(70073);
    const qq8 = hQ8.charId;
    log(hQ8.status === 'active' && !!qq8 &&
        gsActiveLease(uMid.id) &&
        gsActiveLease(uMid.id).tenant_id === qq8,
        'gs: v8 the queued hire signs when the paperwork clears');

    /* snapshot/load: records, openings + the h## counter all ride */
    const snap8 = gsBusSnapshot();
    gsBusReset();
    log(Object.keys(GS_HIRED).length === 0 &&
        GS_JOBS.find(j => j.id === 'buyrite-clerk').openings === 1 &&
        GS_JOBS.find(j => j.id === 'farolote-line').openings === 1 &&
        GS_HIRE_SEQ.n === 0,
        'gs: v8 reset returns the board and counter to open');
    log(gsBusLoad(snap8) === true &&
        GS_HIRED[cid8] && GS_HIRED[cid8].name === 'Peregrine Booth' &&
        GS_HIRED[hSeek8.charId] &&
        GS_JOBS.find(j => j.id === 'buyrite-clerk').openings === 0 &&
        GS_JOBS.find(j => j.id === 'delfino-line').openings === 0 &&
        GS_HIRE_SEQ.n >= 1,
        'gs: v8 hired records, openings + the counter ride the snapshot');
    if(typeof SF_MODE !== 'undefined' && SF_MODE){
      const pw8 = gsVillagerForChar(cid8);
      log(!!pw8 && pw8.gsHired === true &&
          gsHiredLook(cid8).signature === 'windbreaker, always',
          'gs: v8 the hired body + picked look walk back on after load');
    } else {
      log(GS_HIRED[cid8].spawned === false &&
          gsSpawnHired(cid8) === null,
          'gs: v8 load restores the file — no Mission pawn in medieval');
    }

    /* release is the whole cleanup: body, lease, record — and the
       opening goes back on the board */
    const openBefore8 = GS_JOBS.find(j => j.id === 'buyrite-clerk').openings;
    gsReleaseHired(cid8, 'v8 done');
    log(GS_HIRED[cid8] == null && !gsActiveLease(uStd.id) &&
        GS_JOBS.find(j => j.id === 'buyrite-clerk').openings ===
          openBefore8 + 1 && !gsVillagerForChar(cid8),
        'gs: v8 release — record, lease, pawn gone; the opening returns');
  }catch(e){
    log(false, 'gs: suite threw', String(e && e.message || e));
  }finally{
    gsRegLoad(regSnap); gsLedgerLoad(ledSnap); gsBusLoad(busSnap);
    gsLeaseLoad(leaseSnap);
    /* v5: hired bodies spawned during the suite leave the stage too —
       the world returns to exactly the cast it started with */
    if(typeof gsDespawnHired === 'function' && typeof VILLAGERS !== 'undefined')
      for(const v of VILLAGERS.slice())
        if(v.gsHired) gsDespawnHired(v._castId);
  }

  const passed = res.filter(r => r.ok).length;
  if(out) out.textContent += '\n==== GS ' + passed + '/' + res.length + ' passed ====\n';
};
