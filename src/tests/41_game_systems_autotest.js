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

    /* ---- v10: the deed office seed — the live board + the drama ----
       housing.json listings_live verbatim: three public rent cards, and
       Victor's two Guerrero buildings quietly shopped — pocket listings
       that exist for the deal flow but never reach the board or wire. */
    if(typeof gsListingsBoard === 'function'){
      const brd = gsListingsBoard();
      log(brd.length === 3 &&
          brd.some(c => /9418 Guerrero Street/.test(c.address) &&
              c.kind === 'rent' && c.ask === 2100) &&
          brd.some(c => /9457 Guerrero Street/.test(c.address) &&
              c.kind === 'rent' && c.ask === 1350) &&
          brd.some(c => /9127 Capp Street/.test(c.address) &&
              c.kind === 'rent' && c.ask === 1300),
          'gs: v10 the seed board carries the world\'s three live cards');
      const b9418 = GS_REG.buildings.find(b => b.canon === 'home-c6');
      const b9457s = GS_REG.buildings.find(b => b.canon === 'home-c4c5');
      log(b9418 && b9457s &&
          gsQuietListings().indexOf(b9418.id) >= 0 &&
          gsQuietListings().indexOf(b9457s.id) >= 0 &&
          gsListingsPublic()[b9418.id] === undefined &&
          gsViewerState().listings[b9457s.id] === undefined &&
          gsListingCard(b9418.id) === null &&
          gsListingCard(b9418.id, { internal: true }) !== null &&
          gsListingCard(b9418.id, { internal: true }).carriesNote === true,
          'gs: v10 Victor\'s two buildings are pocket listings — ' +
          'invisible publicly, real internally');
      log(!gsWire({ limit: 300 }).some(e =>
            /9418 Guerrero|9457 Guerrero|9127 Capp/.test(e.text) &&
            /Listed|Sold/.test(e.text)),
          'gs: v10 seed stock never posts a wire line');
      log(gsListingAudit().ok === true,
          'gs: v10 the listing audit is clean on the live seed',
          gsListingAudit().issues.slice(0, 3).join('; ') || 'clean');
    }

    /* ---- v11: the block's memory on the live seed — Victor's open
       dispute is journaled public record; knowledge stays bounded ---- */
    if(typeof gsCharRepCard === 'function'){
      const dspEv = GS_CREP.events.find(e => e.kind === 'dispute_filed');
      const c7card = gsCharRepCard('C7', '2025-09-24');
      log(!!dspEv && dspEv.landlord === 'C7' && dspEv.pub === true &&
          dspEv.day === '2025-08-01' &&
          c7card.landlord.disputesOpen === 1 &&
          c7card.landlord.evictions === 0,
          'gs: v11 the contested 9457 raise is journaled as public ' +
          'record on Victor\'s card');
      log(gsCharRepKnows('C4', dspEv.id, '2025-08-01') === true &&
          gsCharRepKnows('C7', dspEv.id, '2025-08-01') === true,
          'gs: v11 filer and landlord know their dispute on day zero');
      log(gsCharRepKnows('C8', dspEv.id, '2025-08-02') === false &&
          gsCharRepKnows('C8', dspEv.id, '2025-08-09') === true,
          'gs: v11 an off-street cast member hears the filing days ' +
          'later — bounded gossip, no omniscience');
      const resp7 = gsCharRepResponse('C7', '2025-09-24');
      log(resp7.organized === false && resp7.complaints === 1,
          'gs: v11 one open dispute is not yet an organized block — ' +
          'honest zero');
      log(Array.isArray(gsViewerState().reputation),
          'gs: v11 the viewer board exposes card-shaped reputation');
      log(gsCharRepAudit().ok === true,
          'gs: v11 the reputation audit is clean on the live seed',
          gsCharRepAudit().issues.slice(0, 3).join('; ') || 'clean');
    }
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

    // ==================== v9: THE QUIET HOURS (offline-mode) ====================
    /* presence → linger → drop → wake; handoff notes; the seam; the
       degrade ladder; needs; the phrase kit; co-star asks; the compute
       ledger; obligations; snapshot. H70/H71 are plain marked hires —
       the default resident routine needs no pawn, so every reflex below
       reads identically in medieval and SF mode. */
    gsCreditGrant('p9', 40000, 'v9 stake');
    gsCreditGrant('p9b', 40000, 'v9 stake');
    gsMarkHired('H70', 'p9', { name: 'Quiet Quinn' });
    gsMarkHired('H71', 'p9', { name: 'Second Self' });
    gsMarkHired('H72', 'p9b', { name: 'Other Owner' });

    /* presence + derived modes */
    log(gsPresenceOf('p9') === 'online' && gsPresenceOf('p9b') === 'online',
        'gs: v9 presence defaults to online');
    log(gsBrainMode('H70', 80000) === 'full' &&
        gsBrainMode('C1', 80000) === 'full' &&
        gsBrainMode('A01', 80000) === 'thin',
        'gs: v9 modes derive — hires + mains full, ambient thin');

    /* the linger: a disconnect holds 'full' for the contract's 90s,
       then the brain drops */
    gsPlayerOffline('p9', 80010);
    log(gsPresenceOf('p9', 80010) === 'lingering' &&
        gsBrainMode('H70', 80010) === 'full' &&
        gsBrainMode('H71', 80010) === 'full' &&
        gsBrainMode('H72', 80010) === 'full',
        'gs: v9 the 90s linger keeps brains up through a blip window');
    gsOffTick(80012);
    log(gsPresenceOf('p9', 80012) === 'offline' &&
        gsBrainMode('H70', 80012) === 'thin' &&
        gsBrainMode('H71', 80012) === 'thin' &&
        gsBrainMode('H72', 80012) === 'full',
        'gs: v9 linger expiry drops only the offline owner\'s hires');

    /* the drop wrote the contract's handoff note; the receiving brain
       reads it exactly once */
    const nd9 = gsHandoffNote('H70');
    log(!!nd9 && nd9.transition === 'offline_drop' &&
        nd9.from === 'full' && nd9.to === 'thin' &&
        nd9.char === 'H70' && nd9.at_min != null &&
        'place' in nd9 && 'pending' in nd9 && Array.isArray(nd9.near) &&
        'mood_hint' in nd9 && nd9.readBy === null,
        'gs: v9 the drop writes the contract handoff note');
    log(!!nd9 && gsHandoffRead('H70', 'thin') === nd9 &&
        nd9.readBy === 'thin' &&
        gsHandoffRead('H70', 'thin') === null,
        'gs: v9 a handoff note is read once by the receiving brain');

    /* reconnect: thin wakes to full, and the wake leaves its own note */
    gsPlayerOnline('p9', 80020);
    log(gsPresenceOf('p9', 80020) === 'online' &&
        gsBrainMode('H70', 80020) === 'full' &&
        gsHandoffNote('H70') && gsHandoffNote('H70').transition === 'wake' &&
        gsHandoffNote('H70').from === 'thin' &&
        GS_NOTES_ARCH.some(n => n.char === 'H70' &&
          n.transition === 'offline_drop'),
        'gs: v9 reconnect wakes hires to full — wake note, drop archived');

    /* a blip inside the linger never drops anything */
    gsPlayerOffline('p9', 80030);
    gsPlayerOnline('p9', 80031);
    log(gsPresenceOf('p9', 80031) === 'online' &&
        gsBrainMode('H70', 80031) === 'full' &&
        gsHandoffNote('H70').transition === 'wake',
        'gs: v9 a reconnect inside the linger never drops the brain');

    /* disconnect mid-drive: the session ends FIRST (cap semantics —
       unused minutes refund), then the linger starts */
    const poss9 = gsSubmitRequest({ playerId: 'p9', kind: 'possess',
        target: 'H70', durationMin: 30 }, 80100);
    const p9BalPre = gsCreditBalance('p9');
    log(poss9.status === 'active' && !!GS_POSSESS['H70'] &&
        gsBrainMode('H70', 80100) === 'possessed',
        'gs: v9 an owned hire drives while the owner is online');
    gsPlayerOffline('p9', 80110);
    const plog9 = GS_POSSESS_LOG[GS_POSSESS_LOG.length - 1];
    log(!GS_POSSESS['H70'] && poss9.status === 'cancelled' &&
        poss9.refunded === 80 &&           /* 30min@4cr − 10 used */
        gsCreditBalance('p9') === p9BalPre + 80 &&
        plog9 && plog9.char === 'H70' && plog9.endReason === 'released' &&
        GS_WIRE.some(e => e.status === 'player session ended' &&
          e.mentions && e.mentions.indexOf('H70') >= 0),
        'gs: v9 disconnect ends the drive first — refund, record, wire');
    if(typeof SF_MODE !== 'undefined' && SF_MODE){
      const vOff = gsVillagerForChar('H70');
      log(!!vOff && vOff.isNPC === true && !vOff.gsPossessed,
          'gs: v9 the released pawn is back on its own schedule');
    }
    gsOffTick(80112);                       // linger ends -> the drop
    log(gsHandoffNote('H70') && gsHandoffNote('H70').transition === 'offline_drop' &&
        GS_NOTES_ARCH.some(n => n.char === 'H70' &&
          n.transition === 'handoff' && n.from === 'possessed' &&
          n.to === 'thin' && n.lead === 'I was just moving through here — '),
        'gs: v9 the release handoff note carries the contract\'s lead');

    /* the deny vocabulary: offline owner can't drive, main cast still
       absolute, someone else's pawn still refused before billing */
    const p9bBal = gsCreditBalance('p9b');
    const wrong9 = gsSubmitRequest({ playerId: 'p9b', kind: 'possess',
        target: 'H70', durationMin: 5 }, 80120);
    log(gsPossessDeny('H70', 'p9') === 'owner_offline' &&
        gsPossessDeny('C1', 'p9') === 'possession_ban' &&
        wrong9.reason === 'not_your_character' &&
        gsCreditBalance('p9b') === p9bBal,
        'gs: v9 owner_offline joins the deny vocabulary — bans hold');

    /* a queued possess can't promote into a player who isn't there —
       and a live drive still ends on disconnect */
    gsPlayerOnline('p9', 80200);
    const pos9a = gsSubmitRequest({ playerId: 'p9', kind: 'possess',
        target: 'H71', durationMin: 30 }, 80200);
    const pos9b = gsSubmitRequest({ playerId: 'p9', kind: 'possess',
        target: 'H71', durationMin: 10 }, 80200);
    log(pos9a.status === 'active' && pos9b.status === 'queued' &&
        gsQueuePosition(pos9b.id) === 1,
        'gs: v9 a second possess on the same body queues behind it');
    gsPlayerOffline('p9', 80210);
    log(!GS_POSSESS['H71'] && pos9a.status === 'cancelled' &&
        pos9b.status === 'failed' &&
        pos9b.failReason === 'owner_offline' &&
        pos9b.refunded === pos9b.billed,
        'gs: v9 disconnect — drive ends; the queued drive fails ' +
        'honestly with a full refund');
    gsOffTick(80212);

    /* paperwork doesn't need the player watching: a non-possess filing
       runs to completion while the owner is offline */
    const bLst9 = gsRegisterBuilding({ street: 'Quiet Street',
                                     owner_id: 'landlord' });
    const uLst9 = gsRegisterUnit(bLst9.id,
        { unit_code: 'A', base_rent: 1500 });
    uLst9.owner_id = 'p9';                  // title sits with the player
    gsPlayerOnline('p9', 80220);
    const lstV9 = gsSubmitRequest({ playerId: 'p9', kind: 'listing',
        target: uLst9.id, durationMin: 60,
        params: { ask: 300000 } }, 80220);
    gsPlayerOffline('p9', 80240);
    gsOffTick(80242);
    log(lstV9.status === 'active' && !!GS_LISTINGS[uLst9.id] &&
        gsBrainMode('H70', 80250) === 'thin',
        'gs: v9 a live filing keeps running while the owner is offline');
    gsBusTick(80290);
    log(lstV9.status === 'completed' && !GS_LISTINGS[uLst9.id],
        'gs: v9 the listing resolves on schedule — request state held');

    /* the compute ledger: brain-minutes bill by mode — thin, possessed
       and degraded never tick the LLM meter */
    gsOffTick(80300);                       // pin the dt baseline
    const c9a = gsComputeStats();
    const modes9 = gsBrainModes(80360);
    const nFull9 = Object.keys(modes9)
      .filter(c => modes9[c] === 'full').length;
    const nThin9 = Object.keys(modes9)
      .filter(c => modes9[c] === 'thin').length;
    gsOffTick(80360);
    const c9b = gsComputeStats();
    log(Math.abs((c9b.llmCalls - c9a.llmCalls) - 60 * nFull9) < 0.01 &&
        Math.abs((c9b.thinMin - c9a.thinMin) - 60 * nThin9) < 0.01 &&
        Math.abs((c9b.llmMin - c9a.llmMin) - 60 * nFull9) < 0.01,
        'gs: v9 brain-minutes accrue by mode — thin never bills the ' +
        'LLM meter');

    /* obligations are ledger state, not brain state: Seeker Sage's
       lease + job + wages read identically across the drop, and payday
       still posts while the owner is away */
    const sageC = hSeek8.charId;
    const obB4 = JSON.stringify(gsObligations(sageC));
    gsPlayerOffline('hQ', 81000);
    gsOffTick(81100);
    /* compare BEFORE payday runs — the ledger view honestly carries
       lastPayday/wagesEarned, which a wage post is supposed to move */
    const obSame = JSON.stringify(gsObligations(sageC)) === obB4 &&
        gsObligations(sageC).job &&
        gsObligations(sageC).job.id === 'delfino-line';
    const due9 = (typeof gsBiweeklyDue === 'function')
      ? gsBiweeklyDue(sageC, '2026-10-09') : null;
    const wagB4 = GS_HIRED[sageC].wagesEarned;
    const fri9c = gsJobTick('2026-10-09');
    const gotPay9 = fri9c.paid.find(x => x.cid === sageC);
    log(gsBrainMode(sageC, 81100) === 'thin' && obSame &&
        (due9 ? (!!gotPay9 && GS_HIRED[sageC].wagesEarned > wagB4)
              : (!gotPay9 && GS_HIRED[sageC].wagesEarned === wagB4)),
        'gs: v9 obligations survive the drop — rent, job and payday ' +
        'post on schedule');
    gsPlayerOnline('hQ', 81200);
    log(gsBrainMode(sageC, 81200) === 'full',
        'gs: v9 the owner\'s return restores the full brain');

    /* the needs model: reflexes read the routine, never mutate it, and
       never override an obligation */
    const n70 = gsThinNeeds('H70');
    n70.hunger = 0.3; n70.rest = 0.5;
    log(gsThinScheduleView('H70', 10).state === 'walk' &&
        gsThinScheduleView('H70', 10).source === 'routine',
        'gs: v9 a settled thin brain just walks the schedule');
    n70.hunger = 0.9;
    const vwHung = gsThinScheduleView('H70', 10);
    log(vwHung.state === 'eat' && vwHung.source === 'needs' &&
        vwHung.to && vwHung.to.poi === 'Haus Coffee',
        'gs: v9 hunger detours a free block to a routine food stop');
    n70.hunger = 0.3; n70.rest = 0.05;
    const vwTired = gsThinScheduleView('H70', 20);
    log(vwTired.state === 'sleep' && vwTired.source === 'needs',
        'gs: v9 worn out cuts the evening short');
    n70.rest = 0.5;
    const nSage = gsThinNeeds(sageC); nSage.hunger = 0.9;
    const vwShift = gsThinScheduleView(sageC, 17);
    log(vwShift.state === 'work' && vwShift.source === 'routine',
        'gs: v9 the shift stands — reflexes never override obligations');
    nSage.hunger = 0.3;
    const hunB4 = n70.hunger;
    gsNeedsTick('H70', 60, 10);             // awake, no meal window
    log(n70.hunger > hunB4, 'gs: v9 hunger rises through a waking hour');
    gsNeedsTick('H70', 60, 13);             // the lunch window
    log(n70.hunger < 0.1, 'gs: v9 a meal window feeds the hunger back down');
    n70.rest = 0.5;
    gsNeedsTick('H70', 60, 2);              // the sleep block
    log(n70.rest > 0.5, 'gs: v9 the sleep block restores rest');

    /* the phrase kit: <=3 generic lines/hr, shared across chars, never
       a character's voice */
    const say1 = gsThinSay('H70', 82000);
    gsThinSay('H70', 82001); gsThinSay('H70', 82002);
    log(!!say1 && GS_THIN_PHRASES.indexOf(say1.line) >= 0 &&
        gsThinSay('H70', 82003) === null &&
        !!gsThinSay('H70', 82061),
        'gs: v9 thin pawns bubble <=3 generic lines an hour');
    const sayB = gsThinSay('H71', 82000);
    log(!!sayB && GS_THIN_PHRASES.indexOf(sayB.line) >= 0,
        'gs: v9 the kit is shared — no char voice, no inner life');

    /* the degrade ladder: capacity <60% degrades mains lowest-salience
       first; <30% all of them; recovery hands brains back */
    gsServiceSet(45);
    const lad9 = gsServiceEval(82100);
    const want9 = [lad9[0].cid, lad9[1].cid];
    log(Object.keys(GS_DEGRADED).sort().join() === want9.slice().sort().join() &&
        gsBrainMode(want9[0], 82100) === 'degraded' &&
        gsBrainMode(lad9[2].cid, 82100) === 'full' &&
        gsHandoffNote(want9[0]) &&
        gsHandoffNote(want9[0]).transition === 'degrade',
        'gs: v9 partial capacity degrades the least-watched mains first');
    gsServiceSet(25); gsServiceEval(82101);
    const degAll9 = Object.keys(GS_DEGRADED);
    log(degAll9.length === 8 &&
        degAll9.every(c => /^C\d$/.test(c)) &&
        gsBrainMode('C1', 82101) === 'degraded',
        'gs: v9 deep capacity loss degrades every main');
    gsOffTick(82102);                       // pin the dt baseline
    const c9c = gsComputeStats();
    gsOffTick(82162);
    const c9d = gsComputeStats();
    const modes9b = gsBrainModes(82162);
    const nFull9b = Object.keys(modes9b)
      .filter(c => modes9b[c] === 'full').length;
    log(Math.abs((c9d.llmCalls - c9c.llmCalls) - 60 * nFull9b) < 0.01 &&
        Math.abs((c9d.degradedMin - c9c.degradedMin) - 60 * 8) < 0.01,
        'gs: v9 degraded brains stop billing the LLM meter too');
    gsServiceSet(100); gsServiceEval(82163);
    log(Object.keys(GS_DEGRADED).length === 0 &&
        gsBrainMode('C1', 82163) === 'full' &&
        gsHandoffNote('C1') && gsHandoffNote('C1').transition === 'recover',
        'gs: v9 capacity returning hands the brains back (recover)');

    /* the seam: a transition waits for the pawn's beat to finish —
       unspawned chars swap on the spot */
    const seam9 = gsBrainTransition('H71', 'possessed', 'full', 82200,
                                    'handoff');
    log(seam9.queued === false && gsHandoffNote('H71') &&
        gsHandoffNote('H71').transition === 'handoff',
        'gs: v9 a pawn-less transition lands immediately');
    if(typeof SF_MODE !== 'undefined' && SF_MODE){
      const vA01 = gsVillagerForChar('A01');
      vA01.moving = true;
      const q9 = gsBrainTransition('A01', 'thin', 'thin', 82210, 'handoff');
      const queued9 = q9.queued === true && !!GS_SEAM['A01'];
      vA01.moving = false;
      gsOffTick(82210);
      log(queued9 && !GS_SEAM['A01'] && gsHandoffNote('A01') &&
          gsHandoffNote('A01').transition === 'handoff',
          'gs: v9 a mid-stride transition waits for the seam, then lands');
      vA01.moving = true;
      gsBrainTransition('A01', 'thin', 'thin', 82220, 'wake');
      gsOffTick(82220 + GS_SEAM_MAX_MIN + 0.1);
      log(!GS_SEAM['A01'] && gsHandoffNote('A01').transition === 'wake',
          'gs: v9 the seam deadline lands the transition anyway');
      vA01.moving = false;
    }

    /* co-star asks — the bounded favor lane. H70's owner is offline,
       so the pawn is thin and summonable; mains and online-owned hires
       refuse at the door. */
    const n70b = gsThinNeeds('H70'); n70b.hunger = 0.3; n70b.rest = 0.5;
    const csMain = gsSubmitRequest({ playerId: 'p9b', kind: 'costar',
        target: 'C1', durationMin: 20,
        params: { task: 'greet' } }, 87000);
    const csFull = gsSubmitRequest({ playerId: 'p9b', kind: 'costar',
        target: 'H72', durationMin: 20,
        params: { task: 'greet' } }, 87000);
    const csBad = gsSubmitRequest({ playerId: 'p9b', kind: 'costar',
        target: 'H70', durationMin: 20,
        params: { task: 'roast_someone' } }, 87000);
    log(csMain.reason === 'not_thin' && csFull.reason === 'not_thin' &&
        csBad.reason === 'unknown_task',
        'gs: v9 co-star refuses mains, online-owned hires + bogus tasks');

    /* the pawn reads its own routine and can say no — asleep at 2am PT */
    const p9bBal2 = gsCreditBalance('p9b');
    const csDec = gsSubmitRequest({ playerId: 'p9b', kind: 'costar',
        target: 'H70', durationMin: 20,
        params: { task: 'greet', note: 'just a hello' } }, 87000);
    const decWire = gsWire({ who: 'p9b' })
      .filter(e => /declined/.test(e.text));
    log(csDec.status === 'completed' && csDec.declined === 'resting' &&
        csDec.refunded === Math.floor(csDec.billed * 0.5) &&
        gsCreditBalance('p9b') === p9bBal2 - csDec.billed + csDec.refunded &&
        decWire.length && decWire[decWire.length - 1].status === 'resolved' &&
        /resolved · declined/.test(decWire[decWire.length - 1].text) &&
        !GS_COSTAR['H70'],
        'gs: v9 a co-star decline resolves — half back, wire reads ' +
        'resolved · declined, no stint held');

    /* ...and yes when the ask fits the day — a bounded stint, then it
       releases on schedule */
    const csOk = gsSubmitRequest({ playerId: 'p9b', kind: 'costar',
        target: 'H70', durationMin: 20,
        params: { task: 'walk_with', note: 'walk the block' } }, 87700);
    log(csOk.status === 'active' && !!GS_COSTAR['H70'] &&
        GS_COSTAR['H70'].task === 'walk_with' &&
        gsBrainMode('H70', 87700) === 'thin' &&
        gsThinScheduleView('H70', 13).source === 'costar' &&
        gsWire({ who: 'p9b' }).some(e => /co-star — walk along/.test(e.text)),
        'gs: v9 a fitting ask runs — thin pawn on a bounded stint');
    gsBusTick(87721);
    log(csOk.status === 'completed' && !GS_COSTAR['H70'],
        'gs: v9 the stint releases mid-beat-clean at its end');

    /* reflex vetoes are honest and role-aware */
    const evSave9 = GS_EVENTS.splice(0);
    const noPost = gsCoStarCheck('A02', 'cover_shift', 87800, 20, 15);
    const noEv = gsCoStarCheck('A01', 'join_event', 87800, 20, 12);
    GS_EVENTS.push.apply(GS_EVENTS, evSave9);
    const onSh = gsCoStarCheck(sageC, 'greet', 87800, 20, 18);
    const resting = gsCoStarCheck('H70', 'greet', 87800, 20, 2);
    n70.hunger = 0.9; const needsFirst = gsCoStarCheck('H70', 'greet',
      87800, 20, 10);
    n70.hunger = 0.3; n70.rest = 0.05;
    const wornOut = gsCoStarCheck('H70', 'greet', 87800, 20, 10);
    n70.rest = 0.5;
    log(noPost.reason === 'no_post' && noEv.reason === 'no_event' &&
        onSh.reason === 'on_shift' && resting.reason === 'resting' &&
        needsFirst.reason === 'needs_first' &&
        wornOut.reason === 'worn_out',
        'gs: v9 the reflex vetoes read the day card honestly');

    /* transitions never hit the feed — a spectator can't tell a brain
       dropped */
    const feedLen9 = GS_FEED.length;
    gsPlayerOffline('p9', 88000);
    gsOffTick(88002);
    gsPlayerOnline('p9', 88010);
    log(GS_FEED.length === feedLen9 &&
        !gsWire({ limit: 200 }).some(e => /brain|thin ai|offline/i.test(e.text)),
        'gs: v9 mode transitions are invisible on the wire');

    /* the owner-facing report: presence + per-char mode + obligations */
    gsPlayerOffline('p9', 88100);
    gsOffTick(88102);
    const rep9 = gsOfflineReport('p9', 88110);
    const rep70 = rep9.chars.find(c => c.id === 'H70');
    log(rep9.presence === 'offline' && rep9.chars.length === 2 &&
        rep70 && rep70.mode === 'thin' && rep70.needs &&
        rep70.obligations && !rep70.possessed,
        'gs: v9 the owner report carries presence, modes, obligations');

    /* snapshot/load: presence, notes, needs, co-star + compute all ride */
    const snap9 = gsBusSnapshot();
    gsBusReset();
    const loadOk9 = gsBusLoad(snap9);
    log(loadOk9 === true && gsPresenceOf('p9', 88110) === 'offline' &&
        gsBrainMode('H70', 88110) === 'thin' &&
        gsBrainMode('H72', 88110) === 'full' &&
        !!gsHandoffNote('H70'),
        'gs: v9 presence + brain state survive the bus snapshot');
    const rep9b = gsOfflineReport('p9', 88110);
    log(rep9b.presence === 'offline' &&
        rep9b.chars.length === 2 &&
        typeof gsComputeStats().thinMin === 'number',
        'gs: v9 the report + compute ledger reload honest');
    gsPlayerOnline('p9', 88200);
    gsPlayerOnline('hQ', 88200);
    gsOffTick(88200);

    /* ==================== v10: THE DEED OFFICE ====================
       listings, escrow, deeds, obligations, license — the
       tenant->owner arc end to end on fresh stock. Bare block keeps
       v10 names out of the shared suite scope. */
    {
      gsCreditGrant('p10', 90000, 'v10 stake');
      gsCreditGrant('p11', 90000, 'v10 stake');
      gsCreditGrant('p12', 30000, 'v10 stake');
      gsCreditGrant('p13', 100, 'v10 lean stake');
      gsMarkHired('H80', 'p10'); gsMarkHired('H82', 'p10');
      gsMarkHired('H81', 'p11'); gsMarkHired('H83', 'p11');
      gsMarkHired('H84', 'p12'); gsMarkHired('H85', 'p13');
      const bA = gsRegisterBuilding({ street: 'Escrow Street',
        owner_id: 'landlord' });
      const bN = gsRegisterBuilding({ street: 'Note Street',
        owner_id: 'landlord' });
      const bW = gsRegisterBuilding({ street: 'Wholesale Street',
        owner_id: 'landlord' });
      const uA = gsRegisterUnit(bA.id, { unit_code: 'A', bedrooms: 1,
        base_rent: 1500 });
      const uB = gsRegisterUnit(bA.id, { unit_code: 'B', bedrooms: 2,
        base_rent: 2100 });
      const uC = gsRegisterUnit(bA.id, { unit_code: 'C', bedrooms: 0,
        base_rent: 1200 });
      const uD = gsRegisterUnit(bN.id, { unit_code: 'D', bedrooms: 1,
        base_rent: 1600 });
      const uN = gsRegisterUnit(bN.id, { unit_code: 'N', bedrooms: 3,
        base_rent: 3200 });
      const uF = gsRegisterUnit(bN.id, { unit_code: 'F', bedrooms: 1,
        base_rent: 1500 });
      const uG = gsRegisterUnit(bN.id, { unit_code: 'G', bedrooms: 0,
        base_rent: 1100 });
      const uH = gsRegisterUnit(bN.id, { unit_code: 'H', bedrooms: 1,
        base_rent: 1300 });
      const wA = gsRegisterUnit(bW.id, { unit_code: '1', bedrooms: 1,
        base_rent: 1400 });
      const wB = gsRegisterUnit(bW.id, { unit_code: '2', bedrooms: 1,
        base_rent: 1400 });
      const wC = gsRegisterUnit(bW.id, { unit_code: '3', bedrooms: 0,
        base_rent: 1100 });

      /* -- the vacancy wheel: a move-out posts the card, a signature
            fills it -- */
      gsSignLease(uA.id, 'T-A', { start: '2020-01-01', monthly_rent: 1500 });
      log(!GS_LISTINGS[uA.id],
          'gs: v10 an occupied unit carries no card');
      gsVacate(uA.id, { date: '2026-09-01' });
      const cardA = GS_LISTINGS[uA.id];
      log(cardA && cardA.kind === 'rent' && cardA.auto === true &&
          !cardA.quiet && cardA.address === gsAddressOfUnit(uA.id) &&
          cardA.ask === 1500 &&
          gsListingsBoard().some(c => c.id === uA.id) &&
          gsListingCard(uA.id).rent === 1500,
          'gs: v10 a move-out posts the unit\'s rent card itself');
      gsSignLease(uA.id, 'T-B', { start: '2026-10-01', monthly_rent: 1500 });
      log(!GS_LISTINGS[uA.id] &&
          gsWire({ limit: 60 }).some(e =>
            /comes off the board/.test(e.text)),
          'gs: v10 a new signature fills the card — board + wire update');

      /* -- listing filings: ownership, structure, one card per door -- */
      const lNoOwn = gsSubmitRequest({ playerId: 'p10', kind: 'listing',
        target: uB.id, durationMin: 60,
        params: { kind: 'sale', ask: 300000 } }, 90000);
      const lOcc = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
        target: uA.id, durationMin: 60,
        params: { kind: 'rent', ask: 1500 } }, 90000);
      const lBad = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
        target: 'unit-nope', durationMin: 60, params: { ask: 1 } }, 90000);
      log(lNoOwn.reason === 'not_owner' && lOcc.reason === 'unit_occupied' &&
          lBad.reason === 'unknown_unit',
          'gs: v10 listing checks ownership, vacancy, and a real door');
      const lSale = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
        target: uB.id, durationMin: 60,
        params: { kind: 'sale', ask: 300000,
                  note: 'Seller motivated — bring your inspector.' } },
        90001);
      const lDup = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
        target: uB.id, durationMin: 60,
        params: { kind: 'sale', ask: 300000 } }, 90002);
      const cardB = gsListingCard(uB.id);
      log(lSale.status === 'active' && lDup.reason === 'already_listed' &&
          cardB && cardB.kind === 'sale' && cardB.ask === 300000 &&
          cardB.sellerLine === 'Seller motivated — bring your inspector.' &&
          cardB.deedFeeCr === 3500 &&
          /Honest flaw:/.test(cardB.copy) &&
          !/hash|addr_idx|9000\s*\+|%\s*900|generation rule|generated by|formula|deterministic/i
            .test(cardB.copy),
          'gs: v10 a sale card posts with seller line + honest copy — ' +
          'the mint rule is never text');

      /* -- the buy gauntlet: asking only, hired buyer, real money --
         (denials are spread across targets + players so no pair trips
         the v7 repeat-pattern review lane before the real buy) */
      gsListUnit(uC.id, { kind: 'rent', ask: 1200, by: 'landlord' });
      const buyRent = gsSubmitRequest({ playerId: 'p10', kind: 'buy',
        target: uC.id, durationMin: 1, params: { buyerId: 'H80' } }, 90010);
      const buyGhost = gsSubmitRequest({ playerId: 'p10', kind: 'buy',
        target: 'unit-nope', durationMin: 1,
        params: { buyerId: 'H80' } }, 90010);
      const buyStranger = gsSubmitRequest({ playerId: 'p11', kind: 'buy',
        target: uB.id, durationMin: 1, params: { buyerId: 'H80' } }, 90010);
      const buyLow = gsSubmitRequest({ playerId: 'p13', kind: 'buy',
        target: uB.id, durationMin: 1,
        params: { buyerId: 'H85', offer: 299999 } }, 90010);
      const buyFin0 = gsSubmitRequest({ playerId: 'p11', kind: 'buy',
        target: uB.id, durationMin: 1,
        params: { buyerId: 'H81', finance: { downPct: 20 } } }, 90010);
      const buyBroke = gsSubmitRequest({ playerId: 'p10', kind: 'buy',
        target: uB.id, durationMin: 1, params: { buyerId: 'H80' } }, 90010);
      gsDollarGrant('H85', 500000, 'v10 savings');
      const buyPoorCr = gsSubmitRequest({ playerId: 'p13', kind: 'buy',
        target: uB.id, durationMin: 1, params: { buyerId: 'H85' } }, 90010);
      log(buyRent.reason === 'not_for_sale' &&
          buyGhost.reason === 'not_listed' &&
          buyStranger.reason === 'buyer_not_hired' &&
          buyLow.reason === 'at_asking_only' &&
          buyFin0.reason === 'cash_only' &&
          buyBroke.reason === 'insufficient_dollars' &&
          buyPoorCr.reason === 'insufficient_credits',
          'gs: v10 the buy lane refuses everything but asking price, a ' +
          'hired buyer, real dollars, and the deed fee in credits');

      /* -- a cash buy: dollars to the seller, fee in credits, title -- */
      gsDollarGrant('H80', 300000, 'v10 savings');
      const landB4 = gsDollarBalance('landlord');
      const crB4 = gsCreditBalance('p10');
      const buyB = gsSubmitRequest({ playerId: 'p10', kind: 'buy',
        target: uB.id, durationMin: 1,
        params: { buyerId: 'H80', date: '2019-01-01' } }, 90011);
      const deedB = gsDeedOf(uB.id);
      log(buyB.status === 'active' && buyB.billed === 25 &&
          gsUnitById(uB.id).owner_id === 'H80' &&
          gsDollarBalance('H80') === 0 &&
          gsDollarBalance('landlord') === landB4 + 300000 &&
          gsCreditBalance('p10') === crB4 - 25 - 3500 &&
          !GS_LISTINGS[uB.id] &&
          deedB && deedB.scope === 'unit' && deedB.owner === 'H80' &&
          deedB.seller === 'landlord' && deedB.mortgage === null &&
          deedB.taxMo === Math.round(300000 * 0.0118 / 12) &&
          deedB.hoaMo === 480 &&
          gsActiveLease(uB.id) === null &&
          gsDeedLog().some(e => e.id === uB.id && e.to === 'H80' &&
            e.from === 'landlord' && e.price === 300000),
          'gs: v10 a cash buy moves dollars, bills credits once, writes ' +
          'owner_id + a deed — never a lease',
          JSON.stringify({ st: buyB.status, rsn: buyB.reason,
            frsn: buyB.failReason, billed: buyB.billed,
            own: gsUnitById(uB.id).owner_id,
            h80: gsDollarBalance('H80'), cr: gsCreditBalance('p10'),
            crB4: crB4, deed: !!deedB,
            lst: !!GS_LISTINGS[uB.id] }));
      log(gsWire({ limit: 40 }).some(e =>
            /Sold — .*Escrow Street.*changes hands/.test(e.text)) &&
          !gsWire({ limit: 40 }).some(e =>
            /Sold/.test(e.text) && /300,?000/.test(e.text)),
          'gs: v10 the sale line prints the address, never the price');
      log(gsRequestById(lSale.id).status === 'completed',
          'gs: v10 the seller\'s filing wraps when the deal closes');

      /* -- seller-carried financing: real amortization, real rules -- */
      const mm = gsMortgageMath(400000, 20, 30);
      const mmExp = Math.round(320000 * (0.068 / 12) *
        Math.pow(1 + 0.068 / 12, 360) / (Math.pow(1 + 0.068 / 12, 360) - 1));
      log(mm.down === 80000 && mm.principal === 320000 &&
          mm.monthly === mmExp && mm.rate === 0.068 && mm.termM === 360,
          'gs: v10 gsMortgageMath is the real amortization formula');
      gsQuietShop(uN.id, { ask: 800000, by: 'landlord' });
      const cardN = gsListingCard(uN.id, { internal: true });
      log(gsListingCard(uN.id) === null &&
          gsQuietListings().indexOf(uN.id) >= 0 &&
          gsListingsPublic()[uN.id] === undefined &&
          gsViewerState().listings[uN.id] === undefined &&
          cardN && cardN.quiet === true && cardN.carriesNote === true &&
          cardN.financePreview.down === 160000 &&
          cardN.financePreview.rate === 0.068,
          'gs: v10 a pocket listing is invisible everywhere but the ' +
          'deal — with the financing spelled out for the buyer');
      const finLow = gsSubmitRequest({ playerId: 'p10', kind: 'buy',
        target: uN.id, durationMin: 1,
        params: { buyerId: 'H82', finance: { downPct: 10 } } }, 90020);
      const finTerm = gsSubmitRequest({ playerId: 'p10', kind: 'buy',
        target: uN.id, durationMin: 1,
        params: { buyerId: 'H82', finance: { downPct: 20, years: 40 } } },
        90020);
      log(finLow.reason === 'low_down' && finTerm.reason === 'bad_term',
          'gs: v10 the note demands 20% down inside a 5–30 year term');
      gsDollarGrant('H82', 200000, 'v10 savings');
      const finN = gsMortgageMath(800000, 25, 20);
      const landB5 = gsDollarBalance('landlord');
      const buyN = gsSubmitRequest({ playerId: 'p10', kind: 'buy',
        target: uN.id, durationMin: 1,
        params: { buyerId: 'H82', finance: { downPct: 25, years: 20 },
                  date: '2026-09-20' } }, 90021);
      const deedN = gsDeedOf(uN.id);
      log(buyN.status === 'active' &&
          gsUnitById(uN.id).owner_id === 'H82' &&
          gsDollarBalance('H82') === 0 &&
          gsDollarBalance('landlord') === landB5 + finN.down &&
          deedN.mortgage && deedN.mortgage.holder === 'landlord' &&
          deedN.mortgage.remaining === finN.principal &&
          deedN.mortgage.monthly === finN.monthly &&
          deedN.mortgage.paidN === 0,
          'gs: v10 seller-carried escrow — the down payment lands, the ' +
          'note rides the deed at 6.8%');
      log(!GS_LISTINGS[uN.id] &&
          gsWire({ limit: 40 }).some(e =>
            /Sold — .*Note Street.*changes hands/.test(e.text)),
          'gs: v10 the quiet sale surfaces the day it closes');
      /* the closed buy's claim rests at its endMin — tick the bus so the
         next escrow on the same door isn't stuck behind it */
      gsBusTick(90030);

      /* -- escrow honesty: the seller's own note settles first -- */
      const reList = gsSubmitRequest({ playerId: 'p10', kind: 'listing',
        target: uN.id, durationMin: 60,
        params: { kind: 'sale', ask: 550000 } }, 90040);
      log(reList.status === 'active',
          'gs: v10 the new owner can re-list — p10 holds H82\'s deed');
      gsDollarGrant('H81', 600000, 'v10 savings');
      const under = gsSubmitRequest({ playerId: 'p11', kind: 'buy',
        target: uN.id, durationMin: 1, params: { buyerId: 'H81' } }, 90041);
      log(under.status === 'failed' &&
          under.failReason === 'seller_underwater',
          'gs: v10 an underwater sale cannot close — the carried note ' +
          'outlives the asking price');
      gsDelist(uN.id);
      gsListUnit(uN.id, { kind: 'sale', ask: 900000, by: 'H82' });
      gsDollarGrant('H81', 300000, 'v10 savings');
      const landB6 = gsDollarBalance('landlord');
      const buyRe = gsSubmitRequest({ playerId: 'p11', kind: 'buy',
        target: uN.id, durationMin: 1,
        params: { buyerId: 'H81', date: '2026-09-20' } }, 90042);
      log(buyRe.status === 'active' &&
          gsUnitById(uN.id).owner_id === 'H81' &&
          gsDollarBalance('H81') === 0 &&
          gsDollarBalance('landlord') === landB6 + 600000 &&
          gsDollarBalance('H82') === 300000 &&
          deedN.status === 'sold' && deedN.mortgage.status === 'closed' &&
          gsDeedOf(uN.id).owner === 'H81' && !gsDeedOf(uN.id).mortgage &&
          gsDeedLog().some(e => e.id === uN.id && e.to === 'H81' &&
            e.price === 900000),
          'gs: v10 escrow pays the carried note out of proceeds, the ' +
          'seller keeps the rest, the deed moves');

      /* -- the tenant->owner turn: buying your own door stops the rent -- */
      gsSignLease(uD.id, 'H83', { start: '2025-01-01', monthly_rent: 1600 });
      gsListUnit(uD.id, { kind: 'sale', ask: 220000, by: 'landlord' });
      gsDollarGrant('H83', 250000, 'v10 savings');
      const buyOcc = gsSubmitRequest({ playerId: 'p11', kind: 'buy',
        target: uD.id, durationMin: 1,
        params: { buyerId: 'H83', date: '2026-09-20' } }, 90050);
      const leaseOcc = gsActiveLease(uD.id);
      log(buyOcc.status === 'active' &&
          gsUnitById(uD.id).owner_id === 'H83' &&
          leaseOcc && leaseOcc.status === 'owner-occupied' &&
          leaseOcc.monthly_rent === 0 && leaseOcc.wasRent === 1600 &&
          gsDeedOf(uD.id).owner === 'H83',
          'gs: v10 the buying tenant becomes owner-occupant — the lease ' +
          'keeps its history, rent stops');
      log(gsCollectRent(uD.id, {}).ok === false,
          'gs: v10 no rent run can bill an owner-occupied door');

      /* -- the whole-deed sale: Victor's move, in miniature -- */
      gsSignLease(wA.id, 'T-W', { start: '2021-03-01', monthly_rent: 1400 });
      gsListUnit(wB.id, { kind: 'rent', ask: 1400, by: 'landlord' });
      gsListUnit(wC.id, { kind: 'sale', ask: 150000, by: 'landlord' });
      const bldBlocked = gsQuietShop(bW.id, { ask: 400000 });
      log(bldBlocked.reason === 'unit_listed',
          'gs: v10 a unit\'s sale card blocks the whole-deed filing');
      gsDelist(wC.id);
      const wN = gsWire({ limit: 999 }).length;
      gsQuietShop(bW.id, { ask: 400000, by: 'landlord' });
      log(GS_BLD_LISTINGS[bW.id] &&
          gsQuietListings().indexOf(bW.id) >= 0 &&
          gsListingsBoard().every(c => c.id !== bW.id) &&
          gsViewerState().listings[bW.id] === undefined &&
          gsWire({ limit: 999 }).length === wN &&
          gsListingsBoard().some(c => c.id === wB.id),
          'gs: v10 a pocket building listing is invisible — the ' +
          'members\' rent cards stay public');
      const unitSaleBlocked = gsListUnit(wC.id,
        { kind: 'sale', ask: 150000 });
      const unitRentOk = gsListUnit(wC.id,
        { kind: 'rent', ask: 1100, by: 'landlord' });
      log(unitSaleBlocked.reason === 'bld_listed' && unitRentOk.ok === true,
          'gs: v10 a shopped building blocks member sale cards but not ' +
          'rent cards');
      gsDollarGrant('H81', 450000, 'v10 savings');
      const buyBld = gsSubmitRequest({ playerId: 'p11', kind: 'buy',
        target: bW.id, durationMin: 1,
        params: { buyerId: 'H81', date: '2026-09-14' } }, 90060);
      const deedW = gsDeedOf(bW.id);
      log(buyBld.status === 'active' &&
          gsBldById(bW.id).owner_id === 'H81' &&
          !GS_BLD_LISTINGS[bW.id] &&
          !GS_LISTINGS[wB.id] && !GS_LISTINGS[wC.id] &&
          deedW && deedW.scope === 'building' && deedW.hoaMo === 0 &&
          deedW.owner === 'H81' &&
          gsActiveLease(wA.id).tenant_id === 'T-W',
          'gs: v10 a building sale writes the deed, pulls every member ' +
          'card, and leaves the tenants alone');
      log(gsWire({ limit: 40 }).some(e =>
            /Sold — .*Wholesale Street.*changes hands/.test(e.text)),
          'gs: v10 the pocket listing\'s sale is the day the block ' +
          'finds out');

      /* -- the monthly book: mortgage, county, association -- */
      gsListUnit(uF.id, { kind: 'sale', ask: 100000, by: 'landlord',
                          carriesNote: true });
      const moF = gsMortgageMath(100000, 20, 30);
      const taxF = Math.round(100000 * 0.0118 / 12);
      const buyF = gsSubmitRequest({ playerId: 'p11', kind: 'buy',
        target: uF.id, durationMin: 1,
        params: { buyerId: 'H83', finance: { downPct: 20, years: 30 },
                  date: '2026-09-01' } }, 90070);
      /* leave exactly 300 on the books — a short month on purpose */
      gsDollarPay('H83', 'landlord', gsDollarBalance('H83') - 300, 'v10');
      const tick1 = gsDeedTick('2026-10-01');
      const ob1 = gsObligationsOf(uF.id);
      log(buyF.status === 'active' && tick1 &&
          tick1.due.indexOf(uF.id) >= 0 &&
          ob1.owed.mortgage === moF.monthly - 300 &&
          ob1.owed.tax === taxF && ob1.owed.hoa === 320 &&
          ob1.missedN === 1 && ob1.mortgage.remaining === 80000 &&
          gsDollarBalance('H83') === 0,
          'gs: v10 a short month pays what it can — arrears land in ' +
          'the right buckets, principal untouched under the interest');
      const arrearsF = moF.monthly - 300 + taxF + 320;
      gsDollarGrant('H83', 2000, 'v10 cure');
      const cure = gsPayDeed(uF.id, 2000, '2026-10-02');
      log(cure.ok === true && cure.remaining === 0 &&
          cure.paid.mortgage === moF.monthly - 300 &&
          cure.paid.tax === taxF && cure.paid.hoa === 320 &&
          gsObligationsOf(uF.id).missedN === 0 &&
          gsDollarBalance('H83') === 2000 - arrearsF,
          'gs: v10 arrears pay down in book order — a full cure resets ' +
          'the miss clock');

      /* -- two missed months: foreclosable, then the admin transfer -- */
      gsListUnit(uG.id, { kind: 'sale', ask: 60000, by: 'landlord' });
      gsDollarGrant('H83', 70000, 'v10 savings');
      const buyG = gsSubmitRequest({ playerId: 'p11', kind: 'buy',
        target: uG.id, durationMin: 1,
        params: { buyerId: 'H83', date: '2026-09-01' } }, 90080);
      gsDollarPay('H83', 'landlord', gsDollarBalance('H83'), 'v10 drain');
      gsDeedTick('2026-11-01');
      const tick3 = gsDeedTick('2026-12-01');
      const obG = gsObligationsOf(uG.id);
      const fcNo = gsAdminForeclose(uD.id);   // clean deed — refused
      const fc = gsAdminForeclose(uG.id);
      log(buyG.status === 'active' && obG.missedN >= 2 &&
          tick3.foreclosable.indexOf(uG.id) >= 0 &&
          fcNo.reason === 'not_delinquent' &&
          fc.ok === true && fc.to === 'landlord' &&
          gsUnitById(uG.id).owner_id === 'landlord' &&
          gsDeedOf(uG.id).status === 'foreclosed' &&
          gsWire({ limit: 60 }).some(e =>
            /title transferred/.test(e.text) && /Note Street/.test(e.text)),
          'gs: v10 two missed months make a deed foreclosable — the ' +
          'admin reverts title to the note holder, on the record');

      /* -- the landlord license: earned, scoped, capped -- */
      const licNoDeed = gsSubmitRequest({ playerId: 'p13', kind: 'license',
        durationMin: 1 }, 90090);
      gsListUnit(uH.id, { kind: 'sale', ask: 80000, by: 'landlord' });
      gsDollarGrant('H84', 80000, 'v10 savings');
      const buyH = gsSubmitRequest({ playerId: 'p12', kind: 'buy',
        target: uH.id, durationMin: 1,
        params: { buyerId: 'H84' } }, 90091);   // no date -> deed today
      const licEarly = gsSubmitRequest({ playerId: 'p12', kind: 'license',
        durationMin: 1 }, 90092);
      const licOk = gsSubmitRequest({ playerId: 'p10', kind: 'license',
        durationMin: 1 }, 90093);
      const licDup = gsSubmitRequest({ playerId: 'p10', kind: 'license',
        durationMin: 1 }, 90094);
      log(licNoDeed.reason === 'no_deed' && buyH.status === 'active' &&
          licEarly.reason === 'own_30_days' &&
          licOk.status === 'active' && licOk.billed === 2000 &&
          gsLicensed('p10') === true &&
          licDup.reason === 'already_licensed' &&
          gsWire({ limit: 60 }).some(e =>
            /landlord license was issued/.test(e.text)),
          'gs: v10 the license is earned — 30 days of deed, a clean ' +
          'record, 2000cr, once');
      gsSignLease(uB.id, 'T-L', { start: '2020-01-01', monthly_rent: 2000 });
      const stNo = gsLandlordStatement('p11', uB.id);
      const stOwn = gsLandlordStatement('p10', uA.id);
      const stOk = gsLandlordStatement('p10', uB.id);
      log(gsLandlordUnits('p10').indexOf(uB.id) >= 0 &&
          gsLandlordUnits('p10').indexOf(uA.id) < 0 &&
          stNo.reason === 'not_licensed' &&
          stOwn.reason === 'not_your_unit' &&
          stOk.ok === true && stOk.statement.tenant === 'T-L',
          'gs: v10 the toolbox sees only the player\'s own doors');
      const rOver = gsLandlordRaise('p10', uB.id, 2500,
        { date: '2026-09-15' });
      const rOk = gsLandlordRaise('p10', uB.id, 2140,
        { date: '2026-09-15' });
      const nBad = gsLandlordNotice('p10', uB.id, 'pay_or_quit',
        { date: '2026-09-15' });
      /* the license never issues no-fault paper — the 30-day
         termination stays an owner instrument (power_map.never) */
      const nNoFault = gsLandlordNotice('p10', uB.id, 'termination',
        { date: '2026-09-15' });
      gsRecordViolation(uB.id, { kind: 'unpermitted_occupant',
        who: 'T-L-sub', since: '2026-09-01', discovered: true });
      const nOk = gsLandlordNotice('p10', uB.id, 'cure_or_quit',
        { date: '2026-09-15' });
      const evF = gsLandlordEvictFile('p10', uB.id, { date: '2026-09-15' });
      log(rOver.reason === 'raise_over_cap' && rOk.ok === true &&
          rOk.effectiveOn === '2026-10-15' &&
          nBad.reason === 'nothing_owed' &&
          nNoFault.reason === 'admin_only' && nOk.ok === true &&
          evF.ok === true && gsActiveLease(uB.id).evictFiled &&
          gsWire({ limit: 60 }).some(e =>
            /eviction filing/.test(e.text)),
          'gs: v10 notices follow the real ladder — for-cause paper ' +
          'only, the review still evicts');

      /* -- demolition pulls every card and refunds the filing -- */
      const bX = gsRegisterBuilding({ street: 'Condemned Alley',
        owner_id: 'landlord' });
      const uX = gsRegisterUnit(bX.id, { unit_code: 'A', bedrooms: 1,
        base_rent: 1400 });
      const lReq = gsSubmitRequest({ playerId: 'owner', kind: 'listing',
        target: uX.id, durationMin: 60,
        params: { kind: 'rent', ask: 1400 } }, 90100);
      log(lReq.status === 'active' && !!GS_LISTINGS[uX.id],
          'gs: v10 a request-posted card rides the request record');
      gsRetireBuilding(bX.id, { reason: 'seismic work' });
      log(!GS_LISTINGS[uX.id] &&
          gsRequestById(lReq.id).status === 'cancelled' &&
          gsWire({ limit: 60 }).some(e =>
            /Delisted — .*Condemned Alley/.test(e.text)),
          'gs: v10 demolition pulls the card and refunds the filing');

      /* -- the office rides the bus snapshot -- */
      const snap10 = gsBusSnapshot();
      const nDeeds10 = Object.keys(GS_DEEDS).length;
      const nLog10 = gsDeedLog().length;
      gsBusReset();
      const wiped = Object.keys(GS_DEEDS).length === 0 &&
                    gsQuietListings().length === 0 &&
                    !gsLicensed('p10') &&
                    Object.keys(GS_LISTINGS).length === 0;
      gsBusLoad(snap10);
      log(wiped && Object.keys(GS_DEEDS).length === nDeeds10 &&
          gsDeedLog().length === nLog10 &&
          (gsDeedOf(uF.id) || {}).owner === 'H83' &&
          (gsDeedOf(uG.id) || {}).status === 'foreclosed' &&
          (gsDeedOf(bW.id) || {}).scope === 'building' &&
          gsLicensed('p10') === true &&
          !!GS_LISTINGS[uC.id],
          'gs: v10 deeds, cards, the transfer book, and licenses ' +
          'survive the bus snapshot');
      log(gsListingAudit().ok === true,
          'gs: v10 the audit is clean after the whole arc',
          gsListingAudit().issues.slice(0, 3).join('; ') || 'clean');
    }

    /* ==================== v11 — THE BLOCK'S MEMORY ====================
       Reputation as a journal: eviction verdicts weighted honestly,
       bounded knowledge (parties / hallway / street / gossip, private
       paper never leaves the building), public-but-fair band cards,
       and behavior that follows from what a character KNOWS — they
       stop applying, they give notice, the block compares notes. */
    if(typeof gsCharRepScore === 'function'){
      /* -- the stage: one bad landlord, two buildings on a row ------- */
      const repB  = gsRegisterBuilding({ street: 'Reputation Row',
        owner_id: 'L-BAD' });
      const repB2 = gsRegisterBuilding({ street: 'Reputation Row',
        owner_id: 'L-BAD' });
      const farB  = gsRegisterBuilding({ street: 'Faraway Street',
        owner_id: 'landlord' });
      const ruNB = gsRegisterUnit(repB.id, { unit_code: 'A', base_rent: 900 });
      const ruGD = gsRegisterUnit(repB.id, { unit_code: 'B', base_rent: 1000 });
      const ruV1 = gsRegisterUnit(repB.id, { unit_code: 'C', base_rent: 900 });
      const ruV2 = gsRegisterUnit(repB.id, { unit_code: 'D', base_rent: 900 });
      const ruLT = gsRegisterUnit(repB.id, { unit_code: 'E', base_rent: 800 });
      const ruC8 = gsRegisterUnit(repB.id, { unit_code: 'F', base_rent: 1000 });
      const ruC5 = gsRegisterUnit(repB.id, { unit_code: 'G', base_rent: 1000 });
      const ruST = gsRegisterUnit(repB2.id, { unit_code: 'A', base_rent: 900 });
      const ruJ  = gsRegisterUnit(repB2.id, { unit_code: 'B', base_rent: 900 });
      const ruFA = gsRegisterUnit(farB.id, { unit_code: 'A', base_rent: 900 });
      gsSignLease(ruNB.id, 'T-NB',   { start: '2025-11-01', monthly_rent: 900 });
      gsSignLease(ruGD.id, 'T-GOOD', { start: '2026-01-05', monthly_rent: 1000 });
      gsSignLease(ruV1.id, 'T-VIC',  { start: '2026-01-20', monthly_rent: 900 });
      gsSignLease(ruV2.id, 'T-VIC2', { start: '2026-01-22', monthly_rent: 900 });
      gsSignLease(ruLT.id, 'T-LATE', { start: '2025-11-01', monthly_rent: 800 });
      gsSignLease(ruC8.id, 'C8', { start: '2025-11-01', monthly_rent: 1000,
                                   term: 'fixed', endOn: '2026-03-01' });
      gsSignLease(ruC5.id, 'C5', { start: '2025-11-01', monthly_rent: 1000 });
      gsSignLease(ruST.id, 'T-ST',  { start: '2025-11-01', monthly_rent: 900 });
      gsSignLease(ruFA.id, 'T-FAR', { start: '2025-11-01', monthly_rent: 900 });
      for(const cid of ['T-NB','T-ST','T-FAR','C5','C8'])
        gsDollarGrant(cid, 99999, 'savings');

      /* -- the record: arrears + a private late, one honest eviction,
         two wrongful ones (a pattern), then the rent board --------- */
      gsRentTick('2026-01-10');      // T-GOOD's arrears post; T-LATE goes late
      gsServeNotice(ruGD.id, 'pay_or_quit', { date: '2026-01-10' });
      gsAdminEvict(ruGD.id, { date: '2026-01-15', reason: 'nonpayment' });
      gsAdminEvict(ruV1.id, { override: true, date: '2026-02-01',
        reason: 'owner move-in' });
      gsAdminEvict(ruV2.id, { override: true, date: '2026-02-10',
        reason: 'owner move-in' });
      const dsp = gsFileDispute(ruNB.id, 'habitability', 'T-NB',
        { date: '2026-02-15' });
      gsResolveDispute(ruNB.id, dsp.dispute.id, 'upheld_tenant',
        { date: '2026-03-01' });

      const evLegit  = GS_CREP.events.find(e => e.kind === 'evict' &&
        e.tenant === 'T-GOOD');
      const evWrong1 = GS_CREP.events.find(e => e.kind === 'evict' &&
        e.tenant === 'T-VIC');
      const evWrong2 = GS_CREP.events.find(e => e.kind === 'evict' &&
        e.tenant === 'T-VIC2');
      const lateEvt  = GS_CREP.events.find(e => e.kind === 'rent_late' &&
        e.tenant === 'T-LATE');
      const DAY = '2026-03-05';

      /* -- verdicts: cause vs no-paper, weighted for both sides ------ */
      log(!!evLegit && evLegit.verdict === 'for_cause' &&
          evLegit.wL === -3 && evLegit.wT === -14 &&
          !!evWrong1 && evWrong1.verdict === 'wrongful' &&
          evWrong1.wL === -16 && evWrong1.wT === 0,
          'gs: v11 a legitimate eviction bruises the tenant; a paperless ' +
          'one lands on the landlord');
      log(!!evWrong2 && evWrong2.wL === -23 && evWrong2.mult > 1,
          'gs: v11 the second wrongful eviction lands heavier — ' +
          'a pattern, not an accident', evWrong2 && evWrong2.mult);
      const scBad = gsCharRepScore('L-BAD', DAY);
      log(scBad.score === -60 && scBad.band === 'pariah',
          'gs: v11 the record sums to a band, not a bar — ' +
          'pariah at -60', scBad.score + ' ' + scBad.band);
      log(gsCharRepScore('T-VIC', DAY).score === 0 &&
          gsCharRepScore('T-GOOD', DAY).score === -13,
          'gs: v11 the wrongfully-evicted tenant keeps a clean record; ' +
          'the for-cause one carries -13');

      /* -- bounded knowledge: who knew what, when -------------------- */
      log(gsCharRepKnows('T-VIC', evWrong1.id, '2026-02-01') === true &&
          gsCharRepKnows('T-NB', evWrong1.id, '2026-02-01') === true,
          'gs: v11 the displaced and the hallway know on day zero');
      log(gsCharRepKnows('T-ST', evWrong1.id, '2026-02-01') === false &&
          gsCharRepKnows('T-ST', evWrong1.id, '2026-02-02') === true,
          'gs: v11 the same street hears a day later');
      log(gsCharRepKnows('T-FAR', evWrong1.id, '2026-02-01') === false &&
          gsCharRepKnows('T-FAR', evWrong1.id, '2026-02-08') === true &&
          gsCharRepKnows('C6', evWrong1.id, '2026-02-01') === false,
          'gs: v11 farther neighbors learn by gossip over days — ' +
          'never instantly');
      log(gsCharRepKnows('T-FAR', lateEvt.id, '2030-01-01') === false &&
          gsCharRepKnows('C6', lateEvt.id, '2030-01-01') === false &&
          gsCharRepKnows('T-NB', lateEvt.id, '2026-01-10') === true,
          'gs: v11 private money history never leaves the building — ' +
          'no omniscience leak');
      const told = gsCharRepTell('T-NB', 'T-FAR', lateEvt.id, '2026-02-20');
      log(told.ok === true &&
          gsCharRepKnows('T-FAR', lateEvt.id, '2026-02-20') === true,
          'gs: v11 gossip is a verb — a neighbor who knows can tell');

      /* -- stance: opinion from what THEY know, personal stake 1.5x -- */
      const stVic = gsCharRepStance('T-VIC', 'L-BAD', '2026-02-05');
      const stNb  = gsCharRepStance('T-NB', 'L-BAD', '2026-02-05');
      log(stVic.score < stNb.score,
          'gs: v11 the displaced feel it half again — ' +
          stVic.score + ' vs ' + stNb.score);
      log(gsCharRepStance('T-FAR', 'L-BAD', '2026-01-16').score === 0 &&
          gsCharRepScore('L-BAD', '2026-01-16').score === -3,
          'gs: v11 characters act on what they know — the record ' +
          'exists before the gossip lands');
      log(gsCharRepStance('C8', 'L-BAD', DAY).score === -60,
          'gs: v11 a building-mate\'s stance tracks the full record');

      /* -- the measurable social response ---------------------------- */
      const resp = gsCharRepResponse('L-BAD', DAY);
      log(resp.knowers.length >= 20 && resp.cold.length >= 3 &&
          resp.organized === true && resp.complaints === 2,
          'gs: v11 wrongful patterns produce a measurable response — ' +
          resp.knowers.length + ' know, ' + resp.cold.length +
          ' are cold, the block organizes');
      log(gsWire({ limit: 900 }).some(e =>
            /neighbors comparing notes — 9\d{3} Reputation Row/
              .test(e.text)),
          'gs: v11 the wire prints the block\'s own beat once the ' +
          'pattern is real');

      /* -- the paper path in: reputation gates applications ---------- */
      const appBurned = gsApplyForLease(ruJ.id, 'T-VIC',
        { date: '2026-03-10' });
      const appCold = gsApplyForLease(ruJ.id, 'C6',
        { date: '2026-03-10' });
      const appEarly = gsApplyForLease(ruJ.id, 'C4',
        { date: '2026-01-16' });
      const appStranger = gsApplyForLease(ruJ.id, 'T-NEW',
        { date: '2026-03-10' });
      log(!appBurned.ok && appBurned.reason === 'declined_reputation' &&
          appBurned.detail === 'burned_before',
          'gs: v11 once burned — the displaced never apply to the ' +
          'same landlord again');
      log(!appCold.ok && appCold.detail === 'landlord_reputation' &&
          appEarly.status === 'pending' &&
          appStranger.status === 'pending',
          'gs: v11 a knowing character declines to apply; before the ' +
          'gossip (and for record-less strangers) the door is open');

      /* -- bodies move: term-roll + month-to-month notice ------------ */
      const tick11 = gsRentTick('2026-03-11');
      const lC8 = GS_REG.leases.find(l => l.unit_id === ruC8.id);
      const lC5 = GS_REG.leases.find(l => l.unit_id === ruC5.id);
      log(tick11.left && tick11.left.indexOf(ruC8.id) >= 0 &&
          tick11.left.indexOf(ruC5.id) >= 0 &&
          lC8.status === 'ended' && lC8.vacatedBy === 'C8' &&
          lC5.status === 'ended' && lC5.vacatedBy === 'C5' &&
          gsActiveLease(ruST.id) !== null,
          'gs: v11 cold tenants give notice — fixed-term at the roll, ' +
          'month-to-month on the run; non-characters stay put');
      log(gsWire({ limit: 900 }).filter(e =>
            /a tenant gave notice — 9\d{3} Reputation Row/.test(e.text))
            .length >= 2,
          'gs: v11 tenant notice prints as public paper, not a name');

      /* -- the public card: counts and a band, never a float --------- */
      const cardBad = gsCharRepCard('L-BAD', DAY);
      log(cardBad.landlord.evictions === 3 &&
          cardBad.landlord.forCause === 1 &&
          cardBad.landlord.wrongful === 2 &&
          cardBad.landlord.disputesOpen === 0 &&
          cardBad.landlord.disputesLost === 1 &&
          cardBad.band === 'pariah' &&
          /tenancies ended/.test(cardBad.line),
          'gs: v11 the landlord card reads like a tenant-union ' +
          'bulletin', cardBad.line);
      const cardGood = gsCharRepCard('T-GOOD', DAY);
      const cardLate = gsCharRepCard('T-LATE', DAY);
      log(cardGood.tenant.evicted === 1 && cardGood.tenant.forCause === 1 &&
          cardLate.score === 0 &&
          gsCharRepScore('T-LATE', DAY).score === -1,
          'gs: v11 the public card is fair — private lateness never ' +
          'prints, evictions count honestly');
      const board11 = gsCharRepBoard(DAY);
      log(board11.some(r => r.who === 'L-BAD' && r.band === 'pariah' &&
          r.wrongful === 2) &&
          board11.every(r => typeof r.score === 'number' &&
            typeof r.band === 'string'),
          'gs: v11 the spectator board is card-shaped — band + counts, ' +
          'worst standing first');
      const wire11 = gsWire({ limit: 900 });
      log(wire11.some(e => /a housing dispute filed — 9\d{3} Reputation Row/
              .test(e.text)) &&
          wire11.some(e => /a housing dispute resolved — 9\d{3} Reputation Row/
              .test(e.text)) &&
          !wire11.some(e => /habitability|T-GOOD|T-VIC|wrongful/i.test(e.text)),
          'gs: v11 rent-board paper prints the door, never the ' +
          'allegations or names');

      /* -- decay: the block forgives, on a clock --------------------- */
      const scLater = gsCharRepScore('L-BAD', '2027-03-05');
      const scOld   = gsCharRepScore('L-BAD', '2031-06-01');
      log(Math.abs(scLater.score) < Math.abs(scBad.score) &&
          scLater.score < 0 && scOld.score === 0 && scOld.band === 'okay',
          'gs: v11 reputation decays on a half-life; five years and ' +
          'the block forgives', scLater.score + ' -> ' + scOld.score);

      /* -- persistence: journal + knowledge ride the bus ------------- */
      const snap11 = gsBusSnapshot();
      const nEv11 = GS_CREP.events.length;
      gsBusReset();
      const wiped11 = GS_CREP.events.length === 0 &&
                      Object.keys(GS_CREP.known).length === 0;
      gsBusLoad(snap11);
      log(wiped11 && GS_CREP.events.length === nEv11 &&
          gsCharRepScore('L-BAD', DAY).score === -60 &&
          gsCharRepKnows('T-NB', evWrong1.id, '2026-02-01') === true &&
          gsCharRepKnows('C8', evWrong1.id, '2026-02-01') === true,
          'gs: v11 the journal, the knowledge map, and scores survive ' +
          'the bus snapshot');

      /* -- invariants: audit clean, money untouched, ban intact ------ */
      const ledBefore = gsLedgerTotal('dollars');
      const d2 = gsFileDispute(ruST.id, 'rent_raise', 'T-ST',
        { date: '2026-03-20' });
      gsResolveDispute(ruST.id, d2.dispute.id, 'settled',
        { date: '2026-03-25' });
      log(d2.ok && gsLedgerTotal('dollars') === ledBefore,
          'gs: v11 reputation and disputes move no money — ' +
          'the currencies never mix');
      log(gsCharRepAudit().ok === true,
          'gs: v11 the reputation audit is clean after the whole arc',
          gsCharRepAudit().issues.slice(0, 3).join('; ') || 'clean');
      log(typeof gsPossessDeny === 'function' &&
          gsPossessDeny('C7', 'owner') === 'possession_ban',
          'gs: v11 the possession ban still holds — reputation ' +
          'moves opinions, never bodies');

      /* -- the office exception + the honest un-homing --------------- */
      const appAgent = gsApplyForLease(ruV1.id, 'T-VIC',
        { date: '2026-03-26', by: 'agent' });
      log(!!appAgent && appAgent.status === 'pending',
          'gs: v11 an office-filed application is the owner\'s call — ' +
          'a burned hire can still be re-doored (their stance runs ' +
          'the stay-or-go checks instead)');
      gsMarkHired('H-REP', 'pRep', { name: 'Rep Hire' });
      gsSignLease(ruC8.id, 'H-REP', { start: '2026-03-12',
        monthly_rent: 1000 });
      GS_HIRED['H-REP'].unitId = ruC8.id;
      gsVacate(ruC8.id, { by: 'H-REP', date: '2026-03-26' });
      log(GS_HIRED['H-REP'].unitId === null,
          'gs: v11 a hire who gives notice is honestly un-homed');
    }

    /* ==================== v12 — THE WELCOME WAGON ====================
       the viewer→player path end-to-end through the real bus: free
       observe, persona fork, tour, handle, wallet, the camera first
       ask, the honest "no" lessons, the hire walkthrough, the first-
       day card — and the never-list audit proving nothing leaked. */
    if(typeof gsOnbState === 'function'){
      /* the suite's earlier arcs leave live requests + a full hired
         roster behind — sweep the bus past every leftover TTL so the
         sky is honestly clear, and free a cast seat the public way */
      gsBusTick(99999);
      const T0 = 100000;
      /* -- free observe: a fresh id is a viewer, not a record -------- */
      const st0 = gsOnbState('pOnb', T0);
      log(st0.fresh === true && st0.stage === 'S0_watch' &&
          GS_ONB.players['pOnb'] === undefined &&
          gsCreditBalance('pOnb') === 0,
          'gs: v12 a fresh id watches free — no record, no credits, ' +
          'no gate');
      log(gsOnbDeepLink('pNoLink', '?utm=x').ok === false &&
          GS_ONB.players['pNoLink'] === undefined,
          'gs: v12 a plain visit creates no journey record');

      /* -- persona fork + the seven-beat tour ------------------------ */
      const card0 = gsOnbStart('pOnb', T0);
      log(!!card0 && card0.kind === 'welcome' && card0.equalWeight === true &&
          card0.fork.length === 2,
          'gs: v12 the welcome card forks watch/play at equal weight');
      log(gsOnbFork('pOnb', 'bogus', T0).ok === false &&
          gsOnbFork('pOnb', 'play', T0).stage === 'S1_orient',
          'gs: v12 the persona fork validates + lands on the tour offer');
      const anchors = [];
      let b = gsOnbTourStart('pOnb', T0);
      while(b && b.ok && !b.done){ anchors.push(b.anchor);
                                    b = gsOnbTourBeat('pOnb', T0); }
      const stAftTour = gsOnbState('pOnb', T0);
      log(anchors.length === 7 && anchors[6] === 'feed-archive' &&
          b.done === true && stAftTour.stage === 'S2_name' &&
          GS_ONB.players['pOnb'].signals.archiveSeen === true,
          'gs: v12 the tour runs exactly seven beats, anchored, ending ' +
          'on the Archive');
      /* -- skip-anywhere: every optional step yields to a click ------ */
      gsOnbStart('pSkip', T0); gsOnbFork('pSkip', 'play', T0);
      gsOnbTourStart('pSkip', T0);
      const sk1 = gsOnbSkip('pSkip', T0);          // mid-tour skip
      const sk2 = gsOnbSkip('pSkip', T0);          // handle
      const sk3 = gsOnbSkip('pSkip', T0);          // wallet
      const sk4 = gsOnbSkip('pSkip', T0);          // first ask
      const sk5 = gsOnbSkip('pSkip', T0);          // nothing left
      log(sk1.ok && sk2.ok && sk3.ok && sk4.ok && sk5.ok === false &&
          gsOnbState('pSkip', T0).stage === 'S5_resident',
          'gs: v12 skipping is free at every step; at the fork there ' +
          'is nothing left to skip');
      /* -- the watch persona path lands, not funnels ----------------- */
      gsOnbStart('pWatch', T0); gsOnbFork('pWatch', 'watch', T0);
      gsOnbSkip('pWatch', T0);                     // tour offer skipped
      const stWatch = gsOnbState('pWatch', T0);
      const settleW = gsOnbSettle('pWatch', 'watch', T0);
      log(stWatch.stage === 'S1w_watch_done' && settleW.exit === 'completed' &&
          gsOnbCard('pWatch', T0) === null,
          'gs: v12 the watch path ends on a landing, then settles ' +
          'with nothing granted');

      /* -- handles: format, reservation, taken, attribution ---------- */
      const hcBad = gsHandleCheck('1x'), hcCast = gsHandleCheck('Victor'),
            hcAmb = gsHandleCheck('Reyes'), hcSys = gsHandleCheck('admin');
      log(!hcBad.ok && hcBad.reason === 'handle_format' &&
          !hcCast.ok && hcCast.reason === 'handle_reserved' &&
          !hcAmb.ok && hcAmb.reason === 'handle_reserved' &&
          hcCast.suggest.length > 0 &&
          !hcSys.ok && hcSys.reason === 'handle_reserved',
          'gs: v12 handles reject bad format, cast names, ambient ' +
          'names, and system words — with inline suggestions');
      const hSet = gsSetHandle('pOnb', 'OnbWatcher', T0);
      const hDup = gsSetHandle('pSkip', 'OnbWatcher', T0);
      log(hSet.ok === true && gsHandleOf('pOnb') === 'OnbWatcher' &&
          gsPlayerOfHandle('onbwatcher') === 'pOnb' &&
          !hDup.ok && hDup.reason === 'handle_taken' &&
          hDup.suggest.length > 0,
          'gs: v12 a handle reserves, attributes, and offers variants ' +
          'when taken');

      /* -- the wallet: ladder verbatim, first-buy bonus, spend cap --- */
      const w0 = gsWallet('pOnb', T0);
      log(w0.packs.length === 6 && w0.packs[0].id === 'pocket' &&
          w0.packs[5].id === 'mogul' && w0.bonusLeft === 0.5 &&
          w0.capUsd === 200 && /never convert/.test(w0.honesty),
          'gs: v12 the wallet shows the six-pack ladder, the +50% ' +
          'first-buy bonus, the $200 day cap, and the two-currency ' +
          'rule');
      const bp1 = gsBuyPack('pOnb', 'starter', T0);
      log(bp1.ok && bp1.credits === 825 && bp1.bonusCr === 275 &&
          gsCreditBalance('pOnb') === 825 &&
          gsBuyPack('pOnb', 'nonesuch', T0).reason === 'unknown_pack',
          'gs: v12 the first pack credits +50% once, disclosed — ' +
          'starter lands 825 for $4.99');
      gsBuyPack('pOnb', 'mogul', T0); gsBuyPack('pOnb', 'pro', T0);
      gsBuyPack('pOnb', 'plus', T0);  gsBuyPack('pOnb', 'regular', T0);
      const capHit = gsBuyPack('pOnb', 'plus', T0);
      log(capHit.ok === false && capHit.reason === 'spend_cap' &&
          Math.abs(gsWallet('pOnb', T0).spentTodayUsd - 184.95) < 0.01,
          'gs: v12 the disclosed $200/day spend cap bites honestly',
          capHit.spentTodayUsd);
      const ad1 = gsWatchAd('pOnb', T0);
      const led = gsWalletLedger('pOnb');
      log(ad1.ok && ad1.credits === 2 &&
          led.some(t => /pack:starter.*\+50%/.test(t.reason)) &&
          led.some(t => t.reason === 'ad view'),
          'gs: v12 ads remain the non-purchase mint and the ledger ' +
          'itemizes every credit');

      /* -- S4: the camera pass — a real request, claims nothing ------ */
      const camQ = gsPriceQuote({ playerId: 'pOnb', kind: 'camera',
                                durationMin: 30 }, T0);
      const fa = gsOnbFirstAsk('pOnb', T0);
      const camR = fa.req && gsRequestById(fa.req);
      log(fa.ok && camR && camR.kind === 'camera' && camR.status === 'active' &&
          camR.billed === 10 && camQ.total === 10 &&
          gsCameraSessions(T0).some(s => s.req === fa.req) &&
          GS_REQ.actions.camera.claims(camR).length === 0,
          'gs: v12 the camera pass files through the bus — 10 cr / ' +
          '30 min, active, claiming no in-world resource');
      const wireCam = gsWire({ limit: 400 }).filter(e =>
        e.req === fa.req || /camera — a directed view/.test(e.text));
      log(wireCam.some(e => e.who === 'OnbWatcher' &&
          e.status === 'running'),
          'gs: v12 the wire attributes the ask to the handle, not ' +
          'the id');
      /* -- the low-balance lesson: opt-in, reads the meter only ------ */
      const balLB = gsCreditBalance('pOnb');
      const lb = gsOnbLowBal('pOnb', fa.req, T0 + 5);
      log(lb.ok && lb.simulated === true && lb.debt === false &&
          lb.fundedMinLeft > 0 &&
          gsCreditBalance('pOnb') === balLB &&
          gsOnbLowBal('pOnb', 'no-such', T0).reason === 'no_live_session' &&
          gsOnbLowBal('pSkip', fa.req, T0).reason === 'no_live_session',
          'gs: v12 the low-balance preview is opt-in, moves nothing, ' +
          'and refuses anyone else\'s session');
      /* -- the hand-back: an early release refunds whole minutes ----- */
      const endAsk = gsOnbEndAsk('pOnb', fa.req, T0 + 10);
      log(endAsk.ok === true && endAsk.refunded === 6 &&
          camR.status === 'cancelled' &&
          gsCameraSessions(T0 + 10).length === 0 &&
          gsOnbEndAsk('pSkip', fa.req, T0).reason === 'not_your_ask',
          'gs: v12 handing the camera back early refunds the unused ' +
          'minutes — 6 cr home',
          'refunded ' + (endAsk.refunded != null ? endAsk.refunded : '?'));

      /* -- the honest "no"s: decline / review / queue ---------------- */
      let ambId = null;
      if(typeof NV_CAST !== 'undefined'){
        const amb = NV_CAST.find(c => c.tier === 'ambient');
        if(amb) ambId = amb.id;
      }
      let decMin = null;
      if(ambId && typeof gsCoStarCheck === 'function')
        for(let m = T0; m < T0 + 2880 && decMin == null; m += 15)
          if(!gsCoStarCheck(ambId, 'greet', m, 5).ok) decMin = m;
      const dl = ambId && decMin != null
        ? gsOnbLesson('pOnb', 'decline', decMin) : null;
      const dlR = dl && dl.req && gsRequestById(dl.req);
      const dlL = GS_ONB.players['pOnb'].lessons.decline;
      const dlHalf = dlR && dlR.billed - Math.ceil(dlR.billed * 0.5);
      log(!!dl && dl.ok === true && dlR && dlR.status === 'completed' &&
          dlR.declined && dlR.refunded === dlHalf &&
          dlL && dlL.outcome === 'declined' && dlL.refund === dlR.refunded,
          'gs: v12 the decline lesson files a real co-star ask — the ' +
          'pawn says no and half the bill comes home',
          dl && dlR ? dlR.status + ' ' + dlR.refunded : 'no thin window');
      const rv = gsOnbLesson('pOnb', 'review', T0 + 3000);
      const rvR = rv.req && gsRequestById(rv.req);
      const rvParked = rvR.status === 'in_review' && rvR.billed > 0;
      const rvBal = gsCreditBalance('pOnb');
      gsReviewResolve(rv.req, false, { nowMin: T0 + 3001 });
      const rvL = GS_ONB.players['pOnb'].lessons.review;
      log(rv.ok === true && rvParked && rvR.status === 'denied' &&
          rvR.refunded === rvR.billed &&
          gsCreditBalance('pOnb') === rvBal + rvR.billed &&
          rvL.outcome === 'not approved',
          'gs: v12 a "not approved" parks billed, then refunds every ' +
          'credit on the human\'s word',
          rvR ? rvR.status + ' billed ' + rvR.billed : 'no req');
      /* the queue lesson needs a real sky hold — a second player's
         approved weather call supplies it honestly */
      gsCreditGrant('pBlock', 5000, 'test stake');
      const blk = gsSubmitRequest({ playerId: 'pBlock', kind: 'weather',
        durationMin: 120, params: { wx: 'rain' } }, T0 + 3010);
      gsReviewResolve(blk.id, true, { nowMin: T0 + 3010 });
      const qy = gsOnbLesson('pOnb', 'queue', T0 + 3011);
      const qyR = qy.req && gsRequestById(qy.req);
      const qyBal = gsCreditBalance('pOnb');
      gsBusTick(T0 + 3011 + 61);                  // past the queued TTL
      const qyL = GS_ONB.players['pOnb'].lessons.queue;
      log(blk.status === 'active' && qy.ok === true &&
          qyR.status === 'expired' && qyR.discount === 0.15 &&
          qyR.refunded === qyR.billed &&
          gsCreditBalance('pOnb') === qyBal + qyR.billed &&
          qyL.outcome === 'lapsed',
          'gs: v12 the queue lesson holds at −15% behind a real sky ' +
          'and a lapsed slot refunds in full',
          qyR ? ('status ' + qyR.status + ' disc ' + qyR.discount)
              : (qy && qy.reason));
      log(gsOnbLesson('pOnb', 'bogus', T0).reason === 'unknown_lesson' &&
          gsOnbLesson('pLeak2', 'decline', decMin || T0)
            .reason === 'insufficient_credits',
          'gs: v12 lessons validate kind and file nothing the wallet ' +
          'can\'t cover');
      /* the sky-free refusal is honest, not a faked queue — tick past
         the blocker's end so its claim releases first */
      gsBusTick(T0 + 3200);
      const sf = gsOnbLesson('pOnb', 'queue', T0 + 6000);
      log(sf.ok === false && sf.reason === 'sky_free',
          'gs: v12 with the sky clear the queue lesson says so — ' +
          'it never fakes a line');

      /* -- S5/S6: the hire walkthrough rides the real hire lane ------ */
      const obB = gsRegisterBuilding({ street: 'Welcome Lane' });
      const obU = gsRegisterUnit(obB.id, { unit_code: 'A', bedrooms: 1,
                                           base_rent: 900 });
      /* earlier arcs filled the hired roster — release enough seats the
         public way so the walkthrough can file a real application */
      while(Object.keys(GS_HIRED).length >= GS_MAX_HIRED_TOTAL)
        gsReleaseHired(Object.keys(GS_HIRED)[0], 'v12 seat check');
      const hp = gsOnbHirePath('pOnb', T0 + 7000);
      log(hp.fee === 500 && /after screening/.test(hp.billing) &&
          hp.jobs.some(j => j.id === 'seeking') &&
          hp.vacancies.some(v => v.id === obU.id) &&
          hp.truth.length === 4,
          'gs: v12 the hire card quotes the real lane — 500 cr after ' +
          'screening, live jobs, live vacancies');
      const balH = gsCreditBalance('pOnb');
      const hr = gsSubmitRequest({ playerId: 'pOnb', kind: 'hire',
        target: obU.id, durationMin: 5,
        params: { name: 'Onboard Walker', age: 34, pronouns: 'they/them',
          bio: 'new to the block', arrival: 'came for the light',
          look: { build: 'compact', palette: 'moss',
                  signature: 'cardigans and a paperback' },
          job: 'seeking', moveInDate: '2026-09-23' } }, T0 + 7001);
      const newHires = () => Object.keys(GS_HIRED).filter(id =>
        GS_HIRED[id].playerId === 'pOnb');
      log(hr.status === 'in_review' && hr.billed === 0 &&
          gsCreditBalance('pOnb') === balH,
          'gs: v12 a hire parks for human review and bills nothing ' +
          'while it waits');
      gsReviewResolve(hr.id, true, { nowMin: T0 + 7002 });
      const hiredId = newHires()[0];
      const hLease = hiredId && gsLeasesFor(hiredId)
        .find(l => l.status === 'active');
      log(!!hiredId && gsCreditBalance('pOnb') === balH - 500 &&
          !!hLease && hLease.unit_id === obU.id &&
          hLease.hirePackage === true &&
          GS_ONB.players['pOnb'].hires.indexOf(hiredId) >= 0,
          'gs: v12 approval bills 500 and walks a real hire into a ' +
          'real lease — no step bypassed the bus');
      const fdc = gsOnbHiredReturn('pOnb', hiredId, T0 + 7003);
      const fdcBrief = fdc.briefing || {};
      log(fdc.ok === true && fdc.kind === 'first_day' &&
          fdc.char === hiredId && fdcBrief.redacted != null &&
          fdc.costs.rent && fdc.costs.rent.currency === 'game dollars' &&
          /never ownership|a visit/.test(fdc.costs.possess) &&
          /own brain|thinner/.test(fdc.offline) &&
          /no "miss you"/.test(fdc.offline),
          'gs: v12 the first-day card is the redacted briefing — ' +
          'rent in dollars, possession a visit, thin AI a fact');
      log(gsOnbState('pOnb', T0 + 7004).hires.length === 1 &&
          gsOnbDeepLink('pOnb', '?hired=1').card.ok === true &&
          gsOnbDeepLink('pOnb', '?returning=1').link === 'returning',
          'gs: v12 the two deep links land — ?hired=1 raises the ' +
          'first-day card, ?returning=1 the quiet hello');

      /* -- checklist truth + exits ------------------------------------ */
      gsOnbSignal('pOnb', 'watch_min', T0);
      gsOnbSignal('pOnb', 'feed_scroll', T0);
      gsOnbSettle('pOnb', 'watch', T0 + 8000);
      const cl = gsOnbChecklist('pOnb', T0 + 8001);
      log(cl.items.length === 6 && cl.pct === 100 && cl.done === true &&
          cl.items[0].done === true && cl.items[4].done === true,
          'gs: v12 the checklist tells the truth — six items, ' +
          'percent counts only chosen steps');
      const clWatch = gsOnbChecklist('pWatch', T0);
      log(clWatch.items.filter(i => i.optional)
            .every(i => i.label === 'only if you ever want to act'),
          'gs: v12 the watch path relabels optional steps honestly');
      log(gsOnbDismiss('pDis', T0).exit === 'dismissed' &&
          gsOnbCard('pDis', T0) === null &&
          gsOnbReopen('pDis', T0).ok === true &&
          gsOnbPark('pPark', T0).exit === 'parked' &&
          gsOnbCard('pPark', T0) === null,
          'gs: v12 dismiss and park collapse to the footer link; ' +
          'reopen forgives');

      /* -- no free agency: a broke id files nothing ------------------- */
      const leakCam = gsOnbFirstAsk('pLeak', T0);
      const leakAny = GS_REQ.reqs.some(r => r.playerId === 'pLeak' &&
        r.status !== 'denied');
      log(leakCam.ok === false && leakCam.reason === 'insufficient_credits' &&
          !leakAny && gsCreditBalance('pLeak') === 0,
          'gs: v12 no free agency — a zero wallet files nothing and ' +
          'nothing reaches the feed');

      /* -- analytics: the whitelist holds ----------------------------- */
      const evs = gsOnbEvents('pOnb');
      const hooks = new Set(evs.map(e => e.hook));
      log(hooks.has('watch_start') && hooks.has('persona_chosen') &&
          hooks.has('tour_started') && hooks.has('archive_beat_seen') &&
          hooks.has('handle_set') && hooks.has('wallet_explained') &&
          hooks.has('topup_shown') && hooks.has('request_submitted') &&
          hooks.has('first_request_filed') &&
          hooks.has('review_outcome_seen') &&
          hooks.has('queue_outcome_seen') &&
          hooks.has('low_balance_simulated') &&
          hooks.has('character_created') && hooks.has('hired_return') &&
          evs.every(e => GS_ONB_HOOKS[e.hook]),
          'gs: v12 the analytics ledger carries only whitelisted ' +
          'hooks — every contract beat fired');

      /* -- persistence: journeys ride the bus snapshot ---------------- */
      const snap12 = gsBusSnapshot();
      gsBusReset();
      const wiped12 = Object.keys(GS_ONB.players).length === 0 &&
                      gsHandleOf('pOnb') === null;
      gsBusLoad(snap12);
      const stBack = gsOnbState('pOnb', T0 + 9000);
      log(wiped12 && stBack.fresh === false &&
          gsHandleOf('pOnb') === 'OnbWatcher' &&
          gsOnbEvents('pOnb').length === evs.length &&
          stBack.hires.length === 1,
          'gs: v12 journeys, handles, and the analytics ledger ' +
          'survive the bus snapshot');

      /* -- the never-list audit --------------------------------------- */
      const onbAud = gsOnbAudit();
      log(onbAud.ok === true,
          'gs: v12 the onboarding audit is clean after the whole ' +
          'journey', onbAud.issues.slice(0, 3).join('; ') || 'clean');
      log(typeof gsPossessDeny === 'function' &&
          gsPossessDeny('C1', 'pOnb') === 'possession_ban' &&
          gsPossessDeny('C8', 'owner') === 'possession_ban',
          'gs: v12 the ban holds through onboarding — the welcome ' +
          'never offers the mains');
    }

    /* ==================== v13 — THE FRIDAY PAYROLL ====================
       canonical payroll off the jobs.json held_by layer, the informal
       flows, the weekly nut drain, and the owner's back office. The
       same module set ships the timepiece + standing directive (the
       three game-feedback fixes). */
    if(typeof gsEconTick === 'function' && typeof gsEconAudit ===
       'function'){
      gsEconReset();                 // the suite owns this stretch of books
      const FRI = '2026-10-02', SAT = '2026-10-10', NOV = '2026-11-02';
      gsDollarGrant('C2', 5000, 'v13 stake');
      gsDollarGrant('C3', 5000, 'v13 stake');
      gsMarkHired('H90', 'p13', { name: 'Econ Hire' });
      gsDollarGrant('H90', 50, 'v13 nearly broke');

      /* -- payroll: weekly Friday, variable jitter bounded ---------- */
      const earn0 = (GS_ECON.rec['C2'] || { earned: 0 }).earned;
      gsEconTick(FRI);
      const c2i = GS_ECON_WORK.findIndex(w => w.cid === 'C2');
      const r2 = gsEconRec('C2');
      const wkC2 = Math.round(2800 * 12 / 52);
      const dC2 = r2.earned - earn0;
      log(r2.marks['w' + c2i] === FRI && dC2 >= wkC2 * 0.9 - 1 &&
          dC2 <= wkC2 * 1.1 + 1,
          'gs: v13 Friday pays Jules her barista week — gig jitter ' +
          'bounded ±10%', 'got ' + dC2 + ' want ~' + wkC2);
      const c1i = GS_ECON_WORK.findIndex(w => w.cid === 'C1');
      log((gsEconRec('C1').marks['w' + c1i] === FRI) ===
          gsBiweeklyDue('C1', FRI),
          'gs: v13 the biweekly band pays only on its own Friday');
      const c6m = GS_ECON_WORK.findIndex(w => w.cid === 'C6' &&
        w.cadence === 'monthly');
      log(gsEconRec('C6').marks['w' + c6m] === '2026-10',
          'gs: v13 the pension posts once a month, marked by month');

      /* -- informal flows move real dollars, silently ---------------- */
      const shareTxn = GS_LEDGER.txns.find(t => t.from === 'C2' &&
        t.to === 'C6' && t.amt === 700 && /room share/.test(t.reason));
      log(!!shareTxn &&
          !GS_FEED.some(e => e.type === 'econ' &&
            (e.cid || e.from || e.to)),
          'gs: v13 the cash room share moves real dollars and never ' +
          'names anyone on the feed');

      /* -- the nut: weekly drain, partial-pay, honest shortfall ------ */
      gsEconTick(SAT);               // Saturday closes every nutDay
      const h90 = gsEconRec('H90');
      log(GS_LEDGER.dollars['H90'] === 0 && h90.nutShort > 0 &&
          h90.spentNut === 50,
          'gs: v13 the nut partial-pays food-first and records the ' +
          'shortfall — never an overdraft');

      /* -- idempotent + honest catch-up across a month boundary ------ */
      log(gsEconTick(FRI).days === 0,
          'gs: v13 re-ticking a covered day is a no-op');
      const snapE = gsEconSnapshot();
      gsEconReset();
      const wipedE = GS_ECON.log.length === 0;
      gsEconLoad(snapE);
      const novDays = gsEconTick(NOV).days;
      log(wipedE && novDays > 0 && gsEconTick(NOV).days === 0 &&
          GS_LEDGER.txns.some(t => t.cur === 'dollars' &&
            /· 2026-11/.test(t.reason)),
          'gs: v13 payroll survives the snapshot and the books reopen ' +
          'into November without double-paying October');

      /* -- the owner's back office ----------------------------------- */
      const aud = gsEconAudit();
      log(aud.ok === true,
          'gs: v13 audit — replayed log equals live balances, both ' +
          'currencies conserved', aud.bad.slice(0, 2).join('; ') || 'clean');
      const bk = gsEconBooks('2026-10');
      log(bk.payroll.paid > 0 && bk.payroll.headcount >= 20 &&
          bk.payroll.byEmployer['biz:mudhaus'] &&
          bk.payroll.byEmployer['biz:mudhaus'].headcount >= 2 &&
          bk.flows.sharesOut === 1400 && bk.nut.groceries > 0,
          'gs: v13 the monthly statement — payroll by employer, cash ' +
          'shares, the nut',
          'paid ' + bk.payroll.paid + ' heads ' + bk.payroll.headcount);
      const pr13 = gsEconPayroll('2026-10');
      log(Array.isArray(pr13) && pr13.some(e => e.account === 'biz:mudhaus' &&
          e.out > 0 && e.float > 0),
          'gs: v13 the payroll audit names employers, outflow, and the ' +
          'labeled float');
      const stb = gsEconStub('C5');
      log(stb.income === 2600 && stb.nut === 520 && stb.bank >= 0 &&
          typeof stb.runwayMonths === 'number' && stb.earned > 0,
          'gs: v13 the money stub reads Marcus — courier income vs ' +
          'his nut vs his runway');
      log(Array.isArray(gsEconArrears('2026-10-10')),
          'gs: v13 the collection queue reads the lease book');

      /* -- wire privacy: Friday is a beat, never a balance ----------- */
      const pd = gsWireFormat({ n: 900001, type: 'econ',
                               action: 'payday', count: 12, amt: 99999 });
      const sh = gsWireFormat({ n: 900002, type: 'econ',
                               action: 'share_short' });
      log(pd.length === 1 && /payday/.test(pd[0].text) &&
          !/\d/.test(pd[0].text) && sh.length === 0,
          'gs: v13 the wire feels Friday but never prints money');
      log(GS_FEED.some(e => e.type === 'econ' && e.action === 'payday' &&
          e.count > 0),
          'gs: v13 the feed logged the Friday beat');
    }

    /* ==================== v14 — THE BOOK ====================
       scheduled exclusives (world/bookings.json): weather + event
       requests may declare a start window inside the next 24 h on the
       half-hour grid; approval lands them on the public calendar; they
       fire when the window arrives; cancel-before-start refunds in
       full; the book never skips cooldowns and never auctions. All
       times are explicit epoch minutes — the bus never reads the wall
       clock when nowMin is passed. */
    if(typeof gsBookableSlots === 'function' &&
       typeof gsBookCalendar === 'function'){
      gsBusReset();
      const B0 = 200040;                    // half-hour aligned base
      gsCreditGrant('pBk1', 8000, 'v14 stake');
      gsCreditGrant('pBk2', 8000, 'v14 stake');

      /* -- the door: who may book, and what a legal window is -------- */
      /* denied filings go on pBkD's ledger — a player who keeps filing
         refused paperwork earns the review lane (repeat-pattern), and
         the booking tests below need pBk1's record clean */
      const dKind = gsSubmitRequest({ playerId: 'pBkD', kind: 'possess',
        target: 'H1', durationMin: 10, startMin: B0 + 60 }, B0);
      log(dKind.status === 'denied' && dKind.reason === 'not_bookable',
          'gs: v14 sessions are not bookable — the book is weather ' +
          'and events only');
      const dFar = gsSubmitRequest({ playerId: 'pBkD', kind: 'weather',
        durationMin: 60, params: { wx: 'fog' }, startMin: B0 + 2000 }, B0);
      log(dFar.status === 'denied' && dFar.reason === 'beyond_horizon',
          'gs: v14 the book is the next 24 h — beyond that is a queue\'s job');
      const dBad = gsSubmitRequest({ playerId: 'pBkD', kind: 'weather',
        durationMin: 60, params: { wx: 'fog' }, startMin: 'soon' }, B0);
      log(dBad.status === 'denied' && dBad.reason === 'bad_window',
          'gs: v14 a malformed window is refused before billing');
      const dPast = gsSubmitRequest({ playerId: 'pBkD', kind: 'weather',
        durationMin: 60, params: { wx: 'fog' }, startMin: B0 - 60 }, B0);
      log(dPast.status === 'denied' && dPast.reason === 'bad_window',
          'gs: v14 the past is not a window');
      log(gsCreditBalance('pBkD') === 0 &&
          gsCreditBalance('pBk1') === 8000,
          'gs: v14 structural denies never move a credit');

      /* -- lifecycle: file → review → booked → fire → complete -------
         bkA runs B0+120..180; its 4h sky rest makes B0+420 the next
         legal weather slot — bkB books exactly it (tail-boundary ok) */
      const bkA = gsSubmitRequest({ playerId: 'owner', kind: 'weather',
        durationMin: 60, params: { wx: 'fog' }, startMin: B0 + 120 }, B0);
      log(bkA.status === 'booked' && bkA.bookedStart === B0 + 120,
          'gs: v14 an admin booking lands on the calendar — no review, ' +
          'no billing');
      const bkB = gsSubmitRequest({ playerId: 'pBk1', kind: 'weather',
        durationMin: 60, params: { wx: 'rain' },
        startMin: B0 + 420 }, B0 + 10);
      log(bkB.status === 'in_review',
          'gs: v14 a player booking still takes the exclusive review ' +
          'lane at filing');
      gsReviewResolve(bkB.id, true, { nowMin: B0 + 20 });
      log(bkB.status === 'booked' && bkB.bookedStart === B0 + 420,
          'gs: v14 approval lands on the calendar — the window is the ' +
          'promise, not the run');
      const cal = gsViewerState(B0 + 30).calendar;
      const calA = cal.find(e => e.req === bkA.id);
      const calB = cal.find(e => e.req === bkB.id);
      log(!!calA && !!calB && calA.claim === 'sky' &&
          calA.start_min === B0 + 120 && calB.start_min === B0 + 420 &&
          calA.min === 60 && calA.who === 'owner',
          'gs: v14 gsViewerState().calendar is the public strip — ' +
          'claim, window, holder');
      /* a live ask whose window would overlap the booked span queues —
         the calendar promise is a real claim, not a suggestion */
      const preBusy = gsCreditBalance('pBk1');
      const busy = gsSubmitRequest({ playerId: 'pBk1', kind: 'weather',
        durationMin: 120, params: { wx: 'clear' } }, B0 + 40);
      const busyQ = busy.status === 'queued' ||
        (busy.status === 'in_review' && !!busy.holdsLine);
      gsCancelRequest(busy.id, B0 + 41, 'player');
      log(busyQ && gsCreditBalance('pBk1') === preBusy,
          'gs: v14 an overlapping ask queues behind the booked span — ' +
          'and a cancelled queue refunds every credit');
      /* the book never skips cooldowns: bkA's window ends at +180, the
         sky rests to +420 — a window opening inside that tail is
         refused at the door, no money moved */
      const dTail = gsSubmitRequest({ playerId: 'pBk2', kind: 'weather',
        durationMin: 60, params: { wx: 'clear' },
        startMin: B0 + 300 }, B0 + 50);
      log(dTail.status === 'denied' && dTail.reason === 'cooldown_tail',
          'gs: v14 a slot inside a cooldown tail cannot be booked');
      gsBusTick(B0 + 90);
      log(bkA.status === 'booked' && !GS_WX_OVR.wx,
          'gs: v14 the calendar waits — a booked sky does not fire early');
      gsBusTick(B0 + 120);
      log(bkA.status === 'active' && GS_WX_OVR.wx === 'fog',
          'gs: v14 the window arrives — the booking fires on the beat');
      gsBusTick(B0 + 180);
      log(bkA.status === 'completed' && !GS_WX_OVR.wx,
          'gs: v14 the window ends — the sky is handed back to nature');
      /* bkB booked [420,480) while bkA's rest ran — the booked slot is
         legal on arrival: it fires on time */
      gsBusTick(B0 + 420);
      log(bkB.status === 'active' && GS_WX_OVR.wx === 'rain',
          'gs: v14 the second booking fires the moment its window ' +
          'opens — tail-boundary slots are honored');
      gsBusTick(B0 + 480);
      log(bkB.status === 'completed',
          'gs: v14 the second window completes at its own edge');

      /* -- clip rule: a queued ask whose only blocker is a booked span
         runs clipped to the window's edge, un-run minutes refunded ---
         venue claims keep this on events (the sky's 4h rest would gate
         any weather-vs-weather clip) */
      const evA = gsSubmitRequest({ playerId: 'owner',
        kind: 'street_event', durationMin: 60,
        params: { event: 'block_party', at: 'Dolores Park' },
        startMin: B0 + 900 }, B0 + 800);
      log(evA.status === 'booked' && evA.bookedStart === B0 + 900,
          'gs: v14 a venue event books its window on the calendar');
      const clipE = gsSubmitRequest({ playerId: 'pBk1',
        kind: 'street_event', durationMin: 120,
        params: { event: 'park_cleanup', at: 'Dolores Park' } }, B0 + 810);
      log(clipE.status === 'queued',
          'gs: v14 an overlapping same-venue ask queues behind the ' +
          'booked window');
      gsBusTick(B0 + 811);
      if(clipE.status === 'in_review')
        gsReviewResolve(clipE.id, true, { nowMin: B0 + 812 });
      gsBusTick(B0 + 813);
      log(clipE.status === 'active' && clipE.endMin === B0 + 900 &&
          clipE.clippedBy === evA.id,
          'gs: v14 the clip rule — the queued cleanup runs until the ' +
          'booked party, not past it');
      gsBusTick(B0 + 900);
      const clipBack = clipE.refunded || 0;
      log(clipE.status === 'completed' && clipE.usedMin ===
          B0 + 900 - B0 - 813 && clipBack > 0,
          'gs: v14 the clipped run refunds its un-run minutes',
          'refunded ' + clipBack + ' of ' + clipE.billed);
      log(evA.status === 'active',
          'gs: v14 the booked event fires on time behind the clipped run');
      gsBusTick(B0 + 960);
      log(evA.status === 'completed',
          'gs: v14 the booked window completes at its own edge');

      /* -- pre-window cancel: the whole bill comes back -------------- */
      const bkD = gsSubmitRequest({ playerId: 'pBk2', kind: 'street_event',
        durationMin: 60,
        params: { event: 'farmers_market', at: 'Mudhaus Coffee' },
        startMin: B0 + 1200 }, B0 + 1000);
      gsReviewResolve(bkD.id, true, { nowMin: B0 + 1005 });
      const dBal = gsCreditBalance('pBk2');
      const dBill = bkD.billed;
      const dCal = gsViewerState(B0 + 1006).calendar
        .some(e => e.req === bkD.id);
      gsCancelRequest(bkD.id, B0 + 1010, 'player');
      log(bkD.status === 'cancelled' && dCal &&
          gsCreditBalance('pBk2') === dBal + dBill &&
          !gsViewerState(B0 + 1011).calendar.some(e => e.req === bkD.id),
          'gs: v14 cancel before the window — full refund, off the book');

      /* -- FCFS sliding, never an auction: saturate the sky's horizon,
         then an overlapping booking queues, finds no legal slot in
         24 h, and misses with a full refund ------------------------- */
      /* sky state at B0+1020: last weather completed at +480 → global
         rest long past. Booked 60-min RAIN windows at +1050,+1350,
         +1650,+1950,+2250 plus their 4h rest tails cover every slot
         through the +2460 horizon (identical forecasts co-sponsor —
         the saturating spans must clash with the probe's forecast) */
      for(const s of [B0 + 1050, B0 + 1350, B0 + 1650, B0 + 1950,
                      B0 + 2250]){
        const ob = gsSubmitRequest({ playerId: 'owner', kind: 'weather',
          durationMin: 60, params: { wx: 'rain' }, startMin: s },
          B0 + 1020);
        if(ob.status === 'in_review')
          gsReviewResolve(ob.id, true, { nowMin: B0 + 1021 });
      }
      const p1bal = gsCreditBalance('pBk1');
      const bkMiss = gsSubmitRequest({ playerId: 'pBk1', kind: 'weather',
        durationMin: 60, params: { wx: 'storm' },
        startMin: B0 + 1080 }, B0 + 1025);
      gsBusTick(B0 + 1026);
      if(bkMiss.status === 'in_review')
        gsReviewResolve(bkMiss.id, true, { nowMin: B0 + 1027 });
      gsBusTick(B0 + 1028);
      log(bkMiss.status === 'expired' &&
          bkMiss.reason === 'window_missed' &&
          gsCreditBalance('pBk1') === p1bal,
          'gs: v14 a booking with no legal window in 24 h misses — ' +
          'queued, slid, refunded in full');
      const slotsBk = gsBookableSlots({ playerId: 'pBk1',
        kind: 'weather', durationMin: 60, params: { wx: 'fog' },
        startMin: B0 + 1030 }, B0 + 1030);
      log(slotsBk.ok === true && slotsBk.slots.length === 0,
          'gs: v14 the picker shows no weather slot while the sky\'s ' +
          'booked spans + rest tails saturate the horizon');

      /* -- the receipt discloses the window before payment ----------- */
      /* pBk1's event cooldown (from the +813..900 clipped run) has
         lapsed by B0+1200; mural_tour is roving — its openair claim
         never clashes, so the quote reads clean */
      const q = gsPriceQuote({ playerId: 'pBk1', kind: 'street_event',
        durationMin: 60, params: { event: 'mural_tour' },
        startMin: B0 + 2410 }, B0 + 1200);
      log(q.ok === true && q.wouldBook === true &&
          q.booked && q.booked.startMin === B0 + 2430 &&
          q.queueDiscount === 0 && q.wouldReview === true,
          'gs: v14 the quote names the snapped window, keeps the flat ' +
          'price, never offers a queue discount on a booking');
      /* surge keys off the window's hour: find a primetime slot on the
         PT clock — 18:00–23:00 costs the cover charge. Scans start at
         the first legal slot after the quote minute (the past is not
         a window) */
      let ptMin = B0 + 1230;
      while(!gsBusPrimetime(ptMin) && ptMin < B0 + 2600) ptMin += 30;
      let offMin = B0 + 1230;
      while(gsBusPrimetime(offMin) && offMin < B0 + 2600) offMin += 30;
      const qPT = gsPriceQuote({ playerId: 'pBk1', kind: 'street_event',
        durationMin: 60, params: { event: 'mural_tour' },
        startMin: ptMin }, B0 + 1201);
      const qOff = gsPriceQuote({ playerId: 'pBk1', kind: 'street_event',
        durationMin: 60, params: { event: 'mural_tour' },
        startMin: offMin }, B0 + 1201);
      log(qPT.ok && qPT.surge > 1 && qPT.total > qPT.base &&
          qOff.ok && qOff.surge === 1,
          'gs: v14 primetime pricing follows the window, not the filing');

      /* -- wire vocabulary: the book speaks in contract lines -------- */
      const fmt = (t, id) => {
        const e = GS_FEED.find(x => x.type === t && x.req === id);
        return e ? gsWireFormat(e).map(x => x.text).join(' | ') : null;
      };
      log(/booked for/.test(fmt('approve', evA.id) || ''),
          'gs: v14 feed: "approved · booked for HH:MM"');
      log(/booked window arrived/.test(fmt('fire', evA.id) || ''),
          'gs: v14 feed: "booked window arrived — <action> fired"');
      log(/before the window/.test(fmt('cancel', bkD.id) || ''),
          'gs: v14 feed: "cancelled before the window · refunded"');
      log(/window missed/.test(fmt('expire', bkMiss.id) || ''),
          'gs: v14 feed: a missed window reads as what it was');

      /* -- persistence: the calendar rides the bus snapshot ---------- */
      /* owner's event cooldown (the +900 party) lapses at +1200 — a
         roving tour books past the saturation window honestly */
      const bkE = gsSubmitRequest({ playerId: 'owner',
        kind: 'street_event', durationMin: 60,
        params: { event: 'mural_tour' }, startMin: B0 + 2300 },
        B0 + 1300);
      log(bkE.status === 'booked',
          'gs: v14 a roving event books even while the sky is saturated');
      const snap14 = gsBusSnapshot();
      gsBusReset();
      const wiped14 = gsBookCalendar(B0 + 1301).length === 0;
      gsBusLoad(snap14);
      const calBack = gsBookCalendar(B0 + 1301);
      log(wiped14 && calBack.some(e => e.req === bkE.id &&
          e.start_min === B0 + 2310),
          'gs: v14 booked windows survive the bus snapshot — ' +
          'the calendar reloads verbatim');
    }

    /* ==================== v15 — THE MUNICIPAL CODE ====================
       conflicts, second pass (41_game_systems_civic.js): venue ZONES
       ('venue:<place>@<zone>' — the permit names an area), the NOISE
       ORDINANCE (amplified kinds claim 'noise:<place>' + rest
       22:00-06:00 PT), CITY HOLDS (admin closures that beat every
       claim — sweep live ones compensated, deny filings 'city_hold',
       park the line until they lift), CO-HOSTING (identical events on
       touching ground at overlapping times are one party, two permits),
       and the clerk's answers (gsReqOutlook, gsPriceQuote 'alts' +
       estimates). */
    if(typeof gsAdminHold === 'function' &&
       typeof gsVenueZoneParse === 'function' &&
       typeof gsQuietOverlap === 'function'){
      gsBusReset();
      const C0 = 200040;                      // half-hour aligned base
      gsCreditGrant('pCv1', 8000, 'v15 stake');
      gsCreditGrant('pCv2', 8000, 'v15 stake');

      /* -- the zone map: named areas on subdividable venues ---------- */
      const zones = gsVenueZoneList('Dolores Park');
      log(Array.isArray(zones) && zones.indexOf('north lawn') >= 0 &&
          zones.length >= 4,
          'gs: v15 Dolores Park subdivides — the zone table is real');
      log(gsVenueZoneList('Mudhaus Coffee') === null,
          'gs: v15 a shop does not subdivide — zones are venue facts');

      /* zone grammar: parens suffix, bare suffix, params.zone, denials */
      const zPar = gsVenueZoneParse({ params:
        { event: 'park_cleanup', at: 'Dolores Park (north lawn)' } });
      log(zPar.place === 'dolores park' && zPar.zone === 'north lawn' &&
          !zPar.err,
          'gs: v15 "place (zone)" parses to its real ground');
      const zSfx = gsVenueZoneParse({ params:
        { event: 'park_cleanup', at: 'dolores park south lawn' } });
      log(zSfx.zone === 'south lawn' && !zSfx.err,
          'gs: v15 a bare trailing zone name parses too');
      const zPrm = gsVenueZoneParse({ params:
        { event: 'fitness_class', at: 'Dolores Park', zone: 'playground' } });
      log(zPrm.zone === 'playground' && !zPrm.err,
          'gs: v15 params.zone names the area explicitly');
      const zBad = gsSubmitRequest({ playerId: 'pCvD', kind: 'street_event',
        durationMin: 30, params: { event: 'park_cleanup',
        at: 'Dolores Park (the moon)' } }, C0);
      log(zBad.status === 'denied' && zBad.reason === 'bad_zone',
          'gs: v15 a zone the venue does not have is refused unbilled');
      const zWhole = gsSubmitRequest({ playerId: 'pCvD', kind: 'street_event',
        durationMin: 30, params: { event: 'block_party',
        at: 'Dolores Park (north lawn)' } }, C0);
      log(zWhole.status === 'denied' && zWhole.reason === 'bad_zone',
          'gs: v15 a whole-venue kind cannot take an area');

      /* -- the zone matrix: same ground clashes, apart shares -------- */
      const evN = gsSubmitRequest({ playerId: 'owner', kind: 'street_event',
        durationMin: 60, params: { event: 'park_cleanup',
        at: 'Dolores Park (north lawn)' } }, C0 + 1);
      log(evN.status === 'active' &&
          gsClaimsOf(evN).some(c => c.res === 'venue:dolores park@north lawn'),
          'gs: v15 a zoned permit claims its named area — venue:P@Z');
      const evS = gsSubmitRequest({ playerId: 'pCv1', kind: 'street_event',
        durationMin: 60, params: { event: 'fitness_class',
        at: 'Dolores Park (south lawn)' } }, C0 + 2);
      gsReviewResolve(evS.id, true, { nowMin: C0 + 3 });
      log(evS.status === 'active',
          'gs: v15 two zones of one park hold two permits at once');
      const evN2 = gsSubmitRequest({ playerId: 'pCv2', kind: 'street_event',
        durationMin: 60, params: { event: 'fitness_class',
        at: 'Dolores Park (north lawn)' } }, C0 + 4);
      log(evN2.status === 'denied' && evN2.reason === 'venue_rest',
          'gs: v15 a permitted lawn rests — a different kind on it is ' +
          'refused at the door');
      const evW = gsSubmitRequest({ playerId: 'pCv2', kind: 'street_event',
        durationMin: 60, params: { event: 'park_cleanup',
        at: 'Dolores Park' } }, C0 + 6);
      log(evW.status === 'queued',
          'gs: v15 the whole place touches every zone — it queues behind ' +
          'the far lawn\'s class');

      /* -- the noise floor: amplified fills the airspace ------------- */
      const evAmp = gsSubmitRequest({ playerId: 'owner', kind: 'street_event',
        durationMin: 60, params: { event: 'movie_night',
        at: 'Precita Park (the lawn)' } }, C0 + 8);
      log(evAmp.status === 'active' &&
          gsClaimsOf(evAmp).some(c => c.res === 'noise:precita park'),
          'gs: v15 an amplified permit claims the place\'s airspace too');
      const evQuiet = gsSubmitRequest({ playerId: 'pCv1', kind: 'street_event',
        durationMin: 30, params: { event: 'fitness_class',
        at: 'Precita Park (the plaza)' } }, C0 + 9);
      log(evQuiet.status === 'queued' &&
          (gsExplainRequest(evQuiet.id).blockedBy || [])
            .indexOf(evAmp.id) >= 0,
          'gs: v15 a loud movie reaches the far plaza — a quiet class ' +
          'queues behind it');
      const expAmp = gsExplainRequest(evQuiet.id);
      log(expAmp && (expAmp.on || []).join(' ').indexOf('amplified') >= 0,
          'gs: v15 the explanation names the airspace it waits on');
      const evRov = gsSubmitRequest({ playerId: 'pCv2', kind: 'street_event',
        durationMin: 30, params: { event: 'mural_tour',
        at: 'Precita Park' } }, C0 + 11);
      gsReviewResolve(evRov.id, true, { nowMin: C0 + 12 });
      log(evRov.status === 'active',
          'gs: v15 a roving tour walks through a loud night — openair shares');

      /* -- the noise ordinance: amplified rests 22:00-06:00 PT ------- */
      let qm = C0; while(!gsQuietMin(gsBusPtMin(qm))) qm += 30;
      const evLoud = gsSubmitRequest({ playerId: 'owner', kind: 'street_event',
        durationMin: 60, params: { event: 'block_party',
        at: 'Valencia Street' }, startMin: qm }, C0 + 20);
      log(evLoud.status === 'denied' && evLoud.reason === 'quiet_hours',
          'gs: v15 amplified sound rests 22:00-06:00 PT — the door says so');
      const q0 = (() => { let m = C0;
        while(!gsQuietMin(gsBusPtMin(m))) m += 1; return m; })();
      log(gsQuietOverlap(q0 - 60, q0) === false &&
          gsQuietOverlap(q0 - 60, q0 + 1) === true,
          'gs: v15 the ordinance counts minutes — ending at 22:00 is ' +
          'clean, one past is not');
      const evCalm = gsSubmitRequest({ playerId: 'owner',
        kind: 'street_event', durationMin: 60,
        params: { event: 'park_cleanup',
        at: 'Dolores Park (church street edge)' },
        startMin: qm + 30 }, C0 + 21);
      log(evCalm.status === 'booked',
          'gs: v15 a quiet permit may book inside quiet hours — the law ' +
          'is about sound');
      const slotsQ = gsBookableSlots({ playerId: 'owner',
        kind: 'street_event', durationMin: 60,
        params: { event: 'block_party', at: 'Valencia Street' } }, qm + 5);
      log(slotsQ.ok === true && slotsQ.slots.length > 0 &&
          slotsQ.slots.every(s => !gsQuietOverlap(s.startMin,
            s.startMin + 60)),
          'gs: v15 the picker never offers an amplified slot inside ' +
          'quiet hours');

      /* -- co-hosting: identical events on touching ground share ------
         filed before any pCv* street_event completes (cooldowns are
         stamped at completion) — pCv3 is a fresh hand for the join */
      gsCreditGrant('pCv3', 8000, 'v15 stake');
      const evP1 = gsSubmitRequest({ playerId: 'owner', kind: 'street_event',
        durationMin: 60, params: { event: 'block_party',
        at: '18th Street' } }, C0 + 40);
      log(evP1.status === 'active',
          'gs: v15 the first permit runs — the party is on');
      const evCount0 = GS_EVENTS.length;
      const evP2 = gsSubmitRequest({ playerId: 'pCv3', kind: 'street_event',
        durationMin: 60, params: { event: 'block_party',
        at: '18th Street' } }, C0 + 45);
      gsReviewResolve(evP2.id, true, { nowMin: C0 + 46 });
      const host = GS_EVENTS.find(e => e.at === '18th Street');
      log(evP2.status === 'active' && GS_EVENTS.length === evCount0 &&
          !!host && host.co === 2 &&
          Object.keys(host.sponsors || {}).length === 2,
          'gs: v15 a second identical permit joins — one party, two ' +
          'names on the paper');
      const coFeed = GS_FEED.filter(e => e.type === 'cohost').pop();
      log(!!coFeed && coFeed.req === evP2.id &&
          /one party, 2 permits/.test(
            (gsWireFormat(coFeed)[0] || {}).text || ''),
          'gs: v15 the wire prints the join — "one party, 2 permits"');
      const evDiff = gsSubmitRequest({ playerId: 'owner',
        kind: 'street_event', durationMin: 30,
        params: { event: 'street_fair', at: '18th Street' } }, C0 + 47);
      log(evDiff.status === 'denied' && evDiff.reason === 'venue_rest',
          'gs: v15 a DIFFERENT event on the same ground is refused — ' +
          'co-hosting is same-party only, and the grass rests');

      /* -- the city's hand: holds beat every claim ------------------- */
      const hold = gsAdminHold({ by: 'owner', res: 'venue:dolores park',
        startMin: C0 + 15, durationMin: 120, reason: 'tree work' }, C0 + 15);
      log(hold.ok === true && hold.hold && Array.isArray(hold.bumped) &&
          hold.bumped.length >= 2,
          'gs: v15 the city may close a venue — the sweep names every ' +
          'bumped claim');
      log(evN.status === 'cancelled' && evS.status === 'cancelled' &&
          evW.status === 'failed' && evW.refunded >= evW.billed,
          'gs: v15 running claims bump with money back; the queued ' +
          'whole-park ask dies honestly on the rest it could never out-wait');
      const holdFeed = GS_FEED.filter(e => e.type === 'admin' &&
        e.action === 'hold').pop();
      log(!!holdFeed && (holdFeed.bumped || 0) >= 2 &&
          holdFeed.compensated_cr != null,
          'gs: v15 the closure posts a public admin line with the count');
      const dHold = gsSubmitRequest({ playerId: 'pCvD', kind: 'street_event',
        durationMin: 30, params: { event: 'fitness_class',
        at: 'Dolores Park (playground)' } }, C0 + 22);
      log(dHold.status === 'denied' && dHold.reason === 'city_hold',
          'gs: v15 a filing into a live closure is refused at the door');
      const qHold = gsPriceQuote({ playerId: 'pCvD', kind: 'street_event',
        durationMin: 30, params: { event: 'fitness_class',
        at: 'Dolores Park (tennis courts)' } }, C0 + 22);
      log(qHold.ok === false && qHold.deny === 'city_hold' &&
          Array.isArray(qHold.alts) && qHold.alts.length > 0,
          'gs: v15 the receipt says when — a denied quote carries the ' +
          'soonest legal slots');

      /* a zone hold covers its area, not the park: evAmp is rooted on
         'the lawn' at Precita — closing the lawn bumps it; the roving
         tour keeps walking, and the plaza class's blocker bumping hands
         it to the reviewer (exclusive kinds review at activation) */
      const hZone = gsAdminHold({ by: 'owner',
        res: 'venue:precita park@the lawn', startMin: C0 + 16,
        durationMin: 90, reason: 'sprinklers' }, C0 + 23);
      log(hZone.ok === true && evAmp.status === 'cancelled' &&
          evRov.status === 'active',
          'gs: v15 a zone closure bumps the permit rooted there, not ' +
          'the walker');
      log(evQuiet.status === 'in_review',
          'gs: v15 the bumped blocker frees the line — the plaza class ' +
          'reaches the reviewer on ground the closure never touched');
      gsReviewResolve(evQuiet.id, true, { nowMin: C0 + 24 });
      log(evQuiet.status === 'active',
          'gs: v15 approved, it runs — the lawn rests, the plaza does not');

      /* -- the held line: a queued filing waits out a hold ------------
         wxA fog runs [C0+30,C0+60]; wxQ clear queues behind it; the
         sky hold [C0+62,C0+88] is declared while wxQ's short window
         [35,55] sits clear of it — so it survives the sweep but parks
         when the line reaches it; at lift it promotes. (fog: a severe
         sky would fence the outdoor permits too) */
      const wxA = gsSubmitRequest({ playerId: 'owner', kind: 'weather',
        durationMin: 30, params: { wx: 'fog' } }, C0 + 30);
      log(wxA.status === 'active' && GS_WX_OVR.wx === 'fog',
          'gs: v15 a live sky claim runs before the hold test');
      const wxQ = gsSubmitRequest({ playerId: 'pCv1', kind: 'weather',
        durationMin: 20, params: { wx: 'clear' } }, C0 + 32);
      log(wxQ.status === 'queued',
          'gs: v15 a contrary forecast queues behind the running sky');
      const hSky = gsAdminHold({ by: 'owner', res: 'sky',
        startMin: C0 + 62, durationMin: 26, reason: 'airshow' }, C0 + 35);
      log(hSky.ok === true && wxQ.status === 'queued',
          'gs: v15 a future closure leaves the short queue window ' +
          'standing');
      const dSky = gsSubmitRequest({ playerId: 'pCvD', kind: 'weather',
        durationMin: 20, params: { wx: 'heatwave' } }, C0 + 50);
      log(dSky.status === 'denied' && dSky.reason === 'city_hold',
          'gs: v15 a filing whose window reaches the closure is refused ' +
          'at the door');
      gsBusTick(C0 + 60);
      const outQ = gsReqOutlook(wxQ.id, C0 + 61);
      log(wxQ.status === 'queued' && outQ && Array.isArray(outQ.held) &&
          outQ.held.indexOf(hSky.hold.id) >= 0 &&
          outQ.notBeforeMin === C0 + 88,
          'gs: v15 the clerk names the hold and the minute it lifts');
      gsBusTick(C0 + 89);
      log(wxQ.status === 'in_review',
          'gs: v15 the parked filing reaches the front the tick after ' +
          'the hold lifts — never into it');
      gsReviewResolve(wxQ.id, true, { nowMin: C0 + 90 });
      log(wxQ.status === 'active' && GS_WX_OVR.wx === 'clear',
          'gs: v15 approved, the waited-out forecast finally runs');
      const liftFeed = GS_FEED.filter(e => e.type === 'admin' &&
        e.action === 'hold_lift').pop();
      log(!!liftFeed,
          'gs: v15 the lift is a public beat too — the closure says when ' +
          'it ends');
      /* a fresh hold still sweeps the running claim it covers */
      const hLift = gsAdminHold({ by: 'owner', res: 'sky',
        startMin: C0 + 90, durationMin: 60, reason: 'drill' }, C0 + 90);
      log(hLift.ok === true && wxQ.status === 'cancelled' &&
          wxQ.refunded >= wxQ.billed,
          'gs: v15 a fresh hold still sweeps what its window covers');
      log(gsLiftHold(hLift.hold.id, C0 + 91) === true &&
          !gsHoldList(C0 + 92).some(h => h.id === hLift.hold.id),
          'gs: v15 the city can lift a closure early — the board clears');

      /* -- the party outlives its permits (ticks land after the holds) */
      gsBusTick(C0 + 100);
      const hostMid = GS_EVENTS.find(e => e.at === '18th Street');
      log(evP1.status === 'completed' && !!hostMid && hostMid.co === 1 &&
          hostMid.untilMin === C0 + 106,
          'gs: v15 the party outlives its first sponsor — the second ' +
          'permit carries it');
      gsBusTick(C0 + 106);
      log(evP2.status === 'completed' &&
          !GS_EVENTS.some(e => e.at === '18th Street'),
          'gs: v15 the last sponsor\'s end closes the event');

      /* -- the clerk's answers + persistence ------------------------- */
      const holdSnap = gsAdminHold({ by: 'owner',
        res: 'venue:dolores park@tennis courts',
        startMin: C0 + 200, durationMin: 60, reason: 'resurfacing' },
        C0 + 150);
      const snap15 = gsBusSnapshot();
      gsBusReset();
      const wiped15 = gsHoldList(C0 + 151).length === 0;
      gsBusLoad(snap15);
      const holdsBack = gsHoldList(C0 + 151);
      log(wiped15 && holdsBack.length === 1 &&
          holdsBack[0].res === 'venue:dolores park@tennis courts' &&
          holdsBack[0].live === false,
          'gs: v15 declared holds ride the bus snapshot — the closure ' +
          'reloads verbatim');
      const vs15 = gsViewerState(C0 + 151);
      log(Array.isArray(vs15.holds) && vs15.holds.length === 1 &&
          /tennis/.test(vs15.holds[0].label),
          'gs: v15 the public board posts the closure — viewers see the ' +
          'closure, not the paperwork');
      /* admin gate + validation */
      log(gsAdminHold({ by: 'pCv1', res: 'sky', durationMin: 30 },
            C0 + 152).err === 'admin_only' &&
          gsAdminHold({ by: 'owner', res: 'venue:dolores park@the moon',
            durationMin: 30 }, C0 + 152).err === 'bad_claim' &&
          gsAdminHold({ by: 'owner', res: 'sky', durationMin: 5 },
            C0 + 152).err === 'bad_duration',
          'gs: v15 holds are admin-only, claim-shaped, and duration-bound');
      log((gsConflictRules().join(' ').indexOf('noise') >= 0) &&
          (gsConflictRules().join(' ').indexOf('co-hosting') >= 0) &&
          (gsConflictRules().join(' ').indexOf('city holds') >= 0),
          'gs: v15 the rule sheet explains zones, sound, and the city\'s hand');
    }

    /* ---- v13 the timepiece + standing directive (SF-only) -----------
       pull-based clocks (rw-time-perception-spec) and the brain's own
       last will filling the gap between turns. */
    if(typeof SF_MODE !== 'undefined' && SF_MODE &&
       typeof gsTimeGlance === 'function' &&
       typeof sfAgentState === 'function'){
      const pv = VILLAGERS.find(v => v._castId === 'C2') || VILLAGERS[0];
      const cid = pv._castId || pv.name;
      const keepTod = W.tod, keepRain = W.rain, keepStorm = W.storm;
      const keepX = pv.x, keepY = pv.y, keepInB = pv.inBuilding,
            keepIns = pv.inside, keepAg = pv.sfAgent,
            keepState = pv.state;
      /* the v13 driven-pawn fields all restore — a dirty flag here
         would gap-lock the pawn for every later test */
      const keepDrv = pv.sfAgentDriven, keepDir = pv.sfDirective,
            keepGap = pv.sfGap, keepRes = pv.sfAgentResult,
            keepRfx = pv.sfReflex, keepSeq = pv._agentSeq,
            keepDS = pv._dirStreak, keepDg = pv._dirSig;
      const keepLC = new Map();
      VILLAGERS.forEach(o => keepLC.set(o, o.lastClockCheck));
      /* v16 fields ride along — a dirty mind/convo/dispatch here would
         poison the v16 suite that runs after */
      const keepV16 = {
        convo: pv.sfConvo, lastConvo: pv.sfLastConvo,
        intents: pv.sfIntents, obs: pv.sfObligations,
        mood: pv.sfMood, concerns: pv.sfConcerns,
        why: pv.sfLastWhy, disp: pv.sfDisp, mind: pv.sfMind,
        fat: pv.body ? pv.body.fatigue : null };
      try{
        W.tod = 15.8; W.rain = 0; W.storm = 0;
        pv.lastClockCheck = null; pv.sfAgent = null;
        pv.sfAgentDriven = false; pv.sfDirective = null;
        pv.sfGap = false; pv.sfAgentResult = null; pv.sfReflex = null;
        pv._agentSeq = null; pv._dirStreak = 0; pv._dirSig = null;
        pv.sfConvo = null; pv.sfLastConvo = null; pv.sfIntents = [];
        pv.sfObligations = []; pv.sfMood = null; pv.sfConcerns = null;
        pv.sfLastWhy = null; pv.sfDisp = null;
        const s0 = sfAgentState(cid, { turn: 1 });
        log(!('time' in s0) &&
            !JSON.stringify(s0).includes('15:48'),
            'gs: v13 the state payload pushes no clock — pull, not push');
        log(/haven't checked/.test(s0.felt),
            'gs: v13 a fresh pawn hasn\'t checked the time yet');
        const s1 = sfAgentState(cid, { turn: 2, glance: 'phone' });
        log(s1.glance && s1.glance.ok === true && s1.glance.said === '15:48' &&
            pv.lastClockCheck && pv.lastClockCheck.source === 'phone' &&
            pv.lastClockCheck.turn === 2,
            'gs: v13 a phone glance pulls exact sim time and anchors it');
        const sFelt = sfAgentState(cid, { turn: 6 });
        log(/it said 15:48/.test(sFelt.felt) && /turns? ago/.test(sFelt.felt),
            'gs: v13 felt quotes the last check coarsely — never the now');

        /* wallclock: needs a wall, and the room's clock may lie */
        pv.inBuilding = false; pv.inside = null;
        const gOut = sfAgentState(cid, { glance: 'wallclock' }).glance;
        pv.inBuilding = true; pv.inside = 'Mudhaus Coffee';
        const gIn = sfAgentState(cid, { glance: 'wallclock' }).glance;
        log(gOut.ok === false && gIn.ok === true && gIn.said === '15:58',
            'gs: v13 wall clocks need a wall — Mudhaus runs +10 fast',
            JSON.stringify(gIn));
        /* ask: the nearest neighbor quotes THEIR last check — skew
           propagates socially */
        pv.inBuilding = false; pv.inside = null;
        VILLAGERS.forEach(o => { if(o !== pv) o.lastClockCheck =
          { said: 15.9, at: 15.7, day: W.day, source: 'phone', turn: 1 }; });
        let nearest = null, nd = 1e9;
        for(const o of VILLAGERS){
          if(o === pv || o.inBuilding) continue;
          const dd = Math.hypot(o.x - pv.x, o.y - pv.y);
          if(dd < nd){ nd = dd; nearest = o; }
        }
        const gAsk = sfAgentState(cid, { glance: 'ask' }).glance;
        log(gAsk.ok === true && nearest && gAsk.via === nearest.name &&
            gAsk.quoted === true && pv.lastClockCheck.source === 'ask',
            'gs: v13 asking the time quotes the neighbor\'s own clock',
            JSON.stringify(gAsk));

        /* senses read the world, never state a clock */
        W.tod = 23.4; W.rain = 0;
        const seN = gsTimeSenses(pv);
        W.tod = 15.0; W.rain = 0.5;
        const seR = gsTimeSenses(pv);
        W.rain = 0; W.tod = 15.8;
        log(/dark/.test(seN) && /rain|grey/.test(seR) &&
            !/\d{1,2}:\d{2}/.test(seR) &&
            gsPoiOpenNow('Haus Coffee', 12) === true &&
            gsPoiOpenNow('Haus Coffee', 23.5) === false,
            'gs: v13 senses read light and weather and venue hours — ' +
            'never a clock');

        /* v16: the rain veto is gone — environment is a trigger class,
           never code-authored behavior. Rest in the rain files and
           executes; consequences belong to the body. */
        W.rain = 0.6;
        const rr = sfAgentAct(cid, { verb: 'rest', holdH: 0.25,
                                     why: 'bone tired' });
        log(rr.ok === true && pv.sfAgent && pv.sfAgent.verb === 'rest',
            'gs: v16 no weather veto — rest in the rain files and runs');
        sfNpcTick(pv, 0.016);
        log(pv.state === 'rest' && pv.inBuilding === false,
            'gs: v16 the rest executes outdoors — the body keeps score');
        W.rain = 0; pv.sfAgent = null; pv.sfAgentResult = null;
        /* presence verbs ground "at <to>, do <verb>": rest at home
           navigates to her own door and goes inside */
        const rs = sfAgentAct(cid, { verb: 'rest', to: 'home',
                                     holdH: 0.5, why: 'off feet' });
        log(rs.ok === true && pv.sfAgent && pv.sfAgent.cell &&
            pv.sfAgent.enter === 'home',
            'gs: v16 rest at "home" resolves to the pawn\'s own door');
        if(pv.sfAgent && pv.sfAgent.cell){
          const c = pv.sfAgent.cell;
          pv.x = c.wx * CS + 16; pv.y = c.wy * CS + 16; pv.sfPath = null;
          sfNpcTick(pv, 0.016); sfNpcTick(pv, 0.016);
          log(pv.inBuilding === true && pv.state === 'rest',
              'gs: v16 she goes inside her own place and rests');
        }
        pv.inBuilding = false; pv.inside = null; pv.sfAgent = null;

        /* standing directive: the brain's durable last will fills the
           gap — filed as `directive` (sibling), `act.directive`, or the
           legacy `act.then` spelling, all landing on v.sfDirective */
        const ra = sfAgentAct(cid, { verb: 'idle', holdH: 0.25,
                                     why: 'catching a breath' },
          { directive: { verb: 'work', untilH: 6,
                         then: { verb: 'idle', why: 'between shifts' },
                         why: 'shift at the café' } });
        log(ra.ok === true && pv.sfDirective &&
            pv.sfDirective.verb === 'work' &&
            pv.sfDirective.why === 'shift at the café' &&
            pv.sfAgentDriven === true,
            'gs: v13 a filed act stores the standing directive as the ' +
            'pawn\'s durable will');
        W.tod += 0.5;
        sfNpcTick(pv, 0.016);
        log(pv.sfAgent && pv.sfAgent.verb === 'work' &&
            pv.sfAgent.fromDirective === true &&
            pv.sfAgent.then && pv.sfAgent.then.verb === 'idle' &&
            pv.sfAgentResult && pv.sfAgentResult.verb === 'idle' &&
            pv.sfAgentResult.status === 'expired',
            'gs: v13 order end reports its outcome and promotes the ' +
            'directive same-tick — chains carry');
        const stSt = sfAgentState(cid, {});
        log(stSt.directive && stSt.directive.verb === 'idle' &&
            stSt.order && stSt.order.verb === 'work' &&
            stSt.lastOrder && stSt.lastOrder.status === 'expired' &&
            stSt.gap === false,
            'gs: v13 the state shows the brain its order, outcome, ' +
            'will, and gap');
        /* the will's horizon bounds every link: after it lapses the
           pawn stands in the honest gap — never the authored sched */
        W.tod += 5;   // the work order (holdH ≤2) is long expired
        sfNpcTick(pv, 0.016);
        log(pv.sfAgent && pv.sfAgent.verb === 'idle' &&
            pv.sfDirective && pv.sfDirective.verb === 'idle',
            'gs: v13 the chain\'s last link promotes and holds until ' +
            'the will lapses');
        W.tod += 3;   // past the 6h horizon now — the will is stale
        sfNpcTick(pv, 0.016); sfNpcTick(pv, 0.016);
        log(pv.sfAgent === null && pv.sfGap === true &&
            pv.state === 'idle',
            'gs: v13 a lapsed will leaves the intention gap — never ' +
            'the code-authored schedule');
        const stGap = sfAgentState(cid, {});
        log(stGap.gap === true && stGap.order === null &&
            stGap.directive === null,
            'gs: v13 the gap is visible on the state, not hidden');
        /* outcome: interrupted — a fresh filing replaces the live
           order and says so */
        sfAgentAct(cid, { verb: 'idle', holdH: 1, why: 'waiting' },
          { directive: { verb: 'work', untilH: 2,
                         why: 'shift at the café' } });
        sfAgentAct(cid, { verb: 'move', to: 'Haus Coffee',
                          holdH: 1, why: 'coffee first' });
        log(pv.sfAgentResult && pv.sfAgentResult.status === 'interrupted'
            && pv.sfAgentResult.interruptedBy === 'new_order' &&
            pv.sfAgent && pv.sfAgent.verb === 'move',
            'gs: v13 a mid-flight replacement ends the old order ' +
            '"interrupted"');
        /* seq guard: a stale turn cannot stomp the newer filing */
        pv.sfAgent = null; pv.sfAgentDriven = true;
        const sNew = sfAgentAct(cid, { verb: 'idle', holdH: 0.25,
                                     why: 'waiting' }, { seq: 40 });
        const sOld = sfAgentAct(cid, { verb: 'work', holdH: 0.25,
                                     why: 'clock in' }, { seq: 39 });
        log(sNew.ok === true && sOld.ok === false &&
            /stale/.test(sOld.err || '') &&
            pv.sfAgent && pv.sfAgent.verb === 'idle',
            'gs: v13 a late stale-seq filing is rejected, not applied');
        /* v16: a why-less ACT never reaches the directive check at
           all — why is required on every filing */
        const noWhy = sfAgentAct(cid, { verb: 'idle' });
        log(noWhy.ok === false && /why/.test(noWhy.err || ''),
            'gs: v16 every act needs a why — none filed, none run');
        /* bad directives are named at filing — unknown verb, missing
           why, and requests (standing wills never spend, speak, or
           leave) */
        const bad = sfAgentAct(cid, { verb: 'idle', why: 'x' },
          { directive: { verb: 'fly', why: 'x' } });
        const badWhy = sfAgentAct(cid, { verb: 'idle', why: 'x' },
          { directive: { verb: 'rest' } });
        const badSay = sfAgentAct(cid, { verb: 'idle', why: 'x' },
          { directive: { verb: 'say', text: 'hi', why: 'x' } });
        const badReq = sfAgentAct(cid, { verb: 'idle', why: 'x' },
          { directive: { verb: 'request', kind: 'weather', why: 'x' } });
        log(!!bad.thenDropped && /verb/.test(bad.thenDropped || '') &&
            /why/.test(badWhy.thenDropped || '') &&
            /say/.test(badSay.thenDropped || '') &&
            /request/.test(badReq.thenDropped || ''),
            'gs: v16 nonsense, why-less, speech, and spending ' +
            'directives are named at filing');
        /* repeat:false — the will fires exactly once */
        pv.sfAgent = null; pv.sfDirective = null;
        sfAgentAct(cid, { verb: 'idle', holdH: 0.25, why: 'waiting' },
          { directive: { verb: 'work', holdH: 0.25, repeat: false,
                         why: 'cover the rush' } });
        W.tod += 0.5; sfNpcTick(pv, 0.016);
        const firedOnce = pv.sfAgent && pv.sfAgent.verb === 'work';
        W.tod += 0.5; sfNpcTick(pv, 0.016);
        log(firedOnce && pv.sfAgent === null && pv.sfGap === true,
            'gs: v13 a repeat:false directive fires once, then gaps');
        /* survival reflex preempts the live order — and reports it.
           v16's reflex set is the lethal band only: collapse, never
           sleep-as-emergency. The drift is honest — edge-bound, never
           a top-up — and it releases; the next move is the brain's. */
        pv.sfAgent = { verb: 'work', until: sfAbsNow() + 1, done: false };
        if(pv.body) pv.body.fatigue = 0.99;
        sfNpcTick(pv, 0.016);
        log(pv.sfReflex && /collapse/.test(pv.sfReflex.kind) &&
            pv.sfAgent === null && pv.sfAgentResult &&
            pv.sfAgentResult.status === 'interrupted' &&
            /survival/.test(pv.sfAgentResult.interruptedBy || '') &&
            pv.state === 'downed',
            'gs: v16 a collapse reflex preempts the order and says why');
        for(let i = 0; i < 240 && pv.sfReflex; i++) sfNpcTick(pv, 0.016);
        log(pv.sfReflex === null && pv.state === 'idle' &&
            pv.sfGap === true,
            'gs: v16 the reflex releases at the band edge into the gap');
        if(pv.body) pv.body.fatigue = 0.3;
        /* a fresh act while the pawn is asleep wakes it honestly */
        pv.state = 'sleep';
        const woke = sfAgentAct(cid, { verb: 'idle', holdH: 0.25,
                                       why: 'up early' });
        log(woke.ok === true && pv.state === 'idle' &&
            pv.sfAgent && pv.sfAgent.verb === 'idle',
            'gs: v13 a new order is the brain deciding to wake');
      }finally{
        W.tod = keepTod; W.rain = keepRain; W.storm = keepStorm;
        pv.x = keepX; pv.y = keepY; pv.inBuilding = keepInB;
        pv.inside = keepIns; pv.sfAgent = keepAg; pv.state = keepState;
        pv.sfAgentDriven = keepDrv; pv.sfDirective = keepDir;
        pv.sfGap = keepGap; pv.sfAgentResult = keepRes;
        pv.sfReflex = keepRfx; pv._agentSeq = keepSeq;
        pv._dirStreak = keepDS; pv._dirSig = keepDg;
        pv.sfConvo = keepV16.convo; pv.sfLastConvo = keepV16.lastConvo;
        pv.sfIntents = keepV16.intents; pv.sfObligations = keepV16.obs;
        pv.sfMood = keepV16.mood; pv.sfConcerns = keepV16.concerns;
        pv.sfLastWhy = keepV16.why; pv.sfDisp = keepV16.disp;
        pv.sfMind = keepV16.mind;
        if(pv.body && keepV16.fat != null) pv.body.fatigue = keepV16.fat;
        pv.sfPath = null; pv.moving = false;
        keepLC.forEach((lc, o) => { o.lastClockCheck = lc; });
      }
    }

    /* ==================== v17: THE COUNTY RECORDER ====================
       parcels + Prop-13 roll + the secured tax calendar + the Rent
       Board fee + the public record. Runs on reset state — every
       building here is minted by the suite, so nothing leans on the
       live SF seed. Bare block keeps names scoped. */
    if(typeof gsParcelOf === 'function'){
      /* -- parcels + APNs -------------------------------------------- */
      const cb = gsRegisterBuilding({ street: 'Parcel Lane',
        owner_id: 'landlord' });
      const cu1 = gsRegisterUnit(cb.id, { unit_code: 'A', bedrooms: 1,
        base_rent: 1800, rent_controlled: true });
      const cu2 = gsRegisterUnit(cb.id, { unit_code: 'B', bedrooms: 1,
        base_rent: 2000, rent_controlled: false });
      const cp = gsParcelOf(cb.id);
      log(cp && cp.kind === 'building' && /^9\d{3}-\d{3}$/.test(cp.apn) &&
          cp.bld_id === cb.id && cp.unit_id === null &&
          cp.status === 'active',
          'gs: v17 a building enrols as a parcel with a 9xxx-lot APN');
      log(gsParcelOf(cb.id) === cp && GS_PARC.apnUsed[cp.apn] === true,
          'gs: v17 parcel minting is idempotent — same key, same record');
      log(gsParcelOf(cu1.id) === null && gsParcelOf(cu2.id) === null,
          'gs: v17 an unsold door has no condo parcel — it rides the ' +
          'building roll');

      /* -- Prop 13: factored base under market, deterministic -------- */
      const mkt = gsParcelMarket(cb.id);
      const a26 = gsAssessedValue(cp, 2026), a20 = gsAssessedValue(cp, 2020);
      log(mkt === 545000 && a26 === gsAssessedValue(cp, 2026) &&
          a26 < mkt && a26 > a20,
          'gs: v17 assessed rides the factored base — under market, ' +
          'growing 2%/yr, deterministic');
      const condo0 = gsAssessSale(cu2.id, 450000, '2026-08-15');
      log(condo0 && condo0.kind === 'condo' && condo0.unit_id === cu2.id &&
          condo0.apn !== cp.apn && condo0.basis.length === 1 &&
          condo0.basis[0].yr === 2026 && condo0.basis[0].amt === 450000 &&
          gsAssessedValue(condo0, 2026) === 300000,
          'gs: v17 a sale carves a condo parcel rebased at the price — ' +
          'assessed stays capped at market (the Prop-8 floor rule)');
      log(gsParcelMarket(cb.id) === 260000 &&
          gsParcelOf(cu2.id) === condo0,
          'gs: v17 the building roll stops counting the sold door');
      const asBefore = gsAssessedValue(cp, 2026);
      const adu = gsConvertGarage(cb.id, { bedrooms: 0, base_rent: 900 });
      log(adu && cp.basis.length === 2 &&
          cp.basis[1].amt === GS_CNT_CFG.aduCost &&
          gsAssessedValue(cp, 2026) === asBefore + GS_CNT_CFG.aduCost,
          'gs: v17 a garage conversion adds a base-year segment — the ' +
          'old basis keeps its factor');

      /* -- a real escrow buy drives the hook ------------------------- */
      const hb = gsRegisterBuilding({ street: 'Escrow Lane',
        owner_id: 'landlord' });
      const hu = gsRegisterUnit(hb.id, { unit_code: 'A', bedrooms: 1,
        base_rent: 1500 });
      gsMarkHired('H90', 'p17');
      gsCreditGrant('p17', 60000, 'v17 stake');
      gsDollarGrant('H90', 300000, 'v17 savings');
      gsListUnit(hu.id, { kind: 'sale', ask: 250000, by: 'landlord' });
      const buy17 = gsSubmitRequest({ playerId: 'p17', kind: 'buy',
        target: hu.id, durationMin: 1,
        params: { buyerId: 'H90', date: '2026-08-20' } }, 96000);
      const condoB = GS_PARC.parcels[hu.id];
      log(buy17.status === 'active' && condoB && condoB.kind === 'condo' &&
          condoB.basis.length === 1 && condoB.basis[0].amt === 250000 &&
          gsParcelImpounded(condoB) === true,
          'gs: v17 escrow close rebases the carved condo — and its deed ' +
          'book takes it off the installment plan');
      /* an addition after the sale lands as its own segment — the roll
         values it (and the deed book's monthly impound follows) */
      gsAssessImprove(hu.id, 80000, '2026-09-01');
      log(condoB.basis.length === 2 && condoB.basis[1].amt === 80000 &&
          gsAssessedValue(condoB) === 225000,
          'gs: v17 new construction on a sold door segments its own ' +
          'parcel — market still caps the assessed line');

      /* -- the secured roll: real CA calendar ------------------------ */
      /* a penniless owner — the auto-collect can't settle, so the bill
         walks the real delinquency path. (The suite's landlord account
         is flush from earlier blocks.) */
      const tb = gsRegisterBuilding({ street: 'Levy Street',
        owner_id: 'broke_owner' });
      const tu = gsRegisterUnit(tb.id, { unit_code: 'A', bedrooms: 1,
        base_rent: 2000, rent_controlled: true });
      const tp = gsParcelOf(tb.id);
      const levy27 = Math.round(gsAssessedValue(tp, 2026) *
        GS_CNT_CFG.rate);
      /* the flush landlord settles its own roll on posting; the broke
         owner is the delinquency story */
      gsDollarGrant('landlord', 5000000, 'v17 roll float');
      gsAssessorTick('2026-11-01');
      const b1 = GS_PARC.bills.find(x => x.key === tb.id && x.inst === 1);
      log(b1 && b1.fy === 2027 && b1.posted === '2026-11-01' &&
          b1.dueBy === '2026-12-10' && b1.fee === 59 &&
          b1.amt === Math.ceil(levy27 / 2) + 59 &&
          b1.assessed === gsAssessedValue(tp, 2026) &&
          !GS_PARC.bills.some(x => x.key === hu.id),
          'gs: v17 installment 1 posts Nov 1 with the Rent Board fee ' +
          'in full — impounded deeds get no bill');
      gsAssessorTick('2027-02-01');
      const b2 = GS_PARC.bills.find(x => x.key === tb.id && x.inst === 2);
      log(b2 && b2.fy === 2027 && b2.dueBy === '2027-04-10' &&
          b2.fee === 0 && b2.amt === levy27 - Math.ceil(levy27 / 2),
          'gs: v17 installment 2 posts Feb 1 — same assessment, no fee');
      /* no double posting on a repeat day */
      gsAssessorTick('2027-02-01');
      log(GS_PARC.bills.filter(x => x.key === tb.id).length === 2,
          'gs: v17 the roll never posts the same installment twice');

      /* -- delinquency, default, redemption --------------------------- */
      gsAssessorTick('2026-12-10');
      log(b1.status === 'delinquent' &&
          b1.penalty === Math.round(b1.amt * GS_CNT_CFG.latePct) &&
          gsWire({ limit: 600 }).some(e =>
            /tax bill went past due/.test(e.text) &&
            e.text.indexOf('$') < 0 &&
            /Parcel Lane|Levy Street|Escrow Lane|Notice Avenue/.test(e.text)),
          'gs: v17 a missed installment goes delinquent at Dec 10 — a ' +
          'published address, never an amount');
      gsDollarGrant('broke_owner', 100, 'v17 float');
      const part = gsPayTaxBill(b1.id, 100);
      log(part.ok && part.paid === 100 && b1.paid === 100 &&
          b1.status === 'delinquent',
          'gs: v17 a partial payment is a real partial payment');
      gsAssessorTick('2027-04-10');
      gsAssessorTick('2027-07-01');
      log(b1.status === 'defaulted' && b2.status === 'defaulted' &&
          tp.defaulted === true &&
          gsWire({ limit: 800 }).some(e =>
            /tax default/.test(e.text)),
          'gs: v17 the year-end sweep defaults the open book — publicly');
      gsDollarGrant('broke_owner', 5000000, 'v17 redemption float');
      gsPayTaxBill(b1.id);                       // pays bill+penalty
      log(b1.status === 'paid' && tp.defaulted === true,
          'gs: v17 paying one defaulted bill leaves the flag while ' +
          'another stands');
      gsPayTaxBill(b2.id);
      log(b2.status === 'paid' && tp.defaulted === false &&
          gsWire({ limit: 900 }).some(e => /tax default cleared/.test(e.text)),
          'gs: v17 redemption clears the flag when the last default pays');

      /* -- the Rent Board gate ---------------------------------------- */
      const nb = gsRegisterBuilding({ street: 'Notice Avenue',
        owner_id: 'landlord' });
      const nu = gsRegisterUnit(nb.id, { unit_code: 'A', bedrooms: 1,
        base_rent: 1000, rent_controlled: true });
      gsSignLease(nu.id, 'T17', { start: '2020-01-01',
        monthly_rent: 1000 });
      const np = gsParcelOf(nb.id);
      const deniedRB = gsRaiseRent(nu.id, 1070, { date: '2028-03-01' });
      log(!deniedRB.ok && deniedRB.reason === 'rentboard_unregistered' &&
          np.rbThrough < 2028,
          'gs: v17 an unregistered controlled unit cannot take an ' +
          'increase');
      gsAssessorTick('2027-11-01');    // FY2028 inst1 posts + auto-pays
      const nb1 = GS_PARC.bills.find(x => x.key === nb.id &&
        x.inst === 1 && x.fy === 2028);
      const raiseOk = gsRaiseRent(nu.id, 1070, { date: '2028-03-01' });
      log(nb1 && nb1.status === 'paid' && np.rbThrough === 2028 &&
          raiseOk.ok === true,
          'gs: v17 the paid fee registers the parcel — the allowance ' +
          'banks normally');
      const deedB17 = gsDeedOf(hu.id);
      log(deedB17 && deedB17.taxMo ===
          Math.round(gsAssessedValue(condoB) * GS_CNT_CFG.rate / 12) &&
          deedB17.taxMo !== Math.round(250000 * 0.0118 / 12),
          'gs: v17 the deed book\'s monthly impound re-syncs off the ' +
          'roll — the county\'s number reached the monthly book');

      /* -- retirement: the map keeps the number ---------------------- */
      const condoApn = condoB.apn;
      gsRetireUnit(hu.id);
      log(condoB.status === 'retired' &&
          GS_PARC.apnUsed[condoApn] === true &&
          gsParcelOf(hu.id) === condoB,
          'gs: v17 a retired condo keeps its APN — the record stays, ' +
          'the number never reissues');
      const cbApn = cp.apn;
      gsRetireBuilding(cb.id);
      const cbBillN = GS_PARC.bills.filter(x =>
        x.key === cb.id || x.key === cu2.id).length;
      gsAssessorTick('2028-02-01');
      log(cp.status === 'retired' && condo0.status === 'retired' &&
          GS_PARC.apnUsed[cbApn] === true &&
          GS_PARC.bills.filter(x =>
            x.key === cb.id || x.key === cu2.id).length === cbBillN,
          'gs: v17 retiring a building retires its parcel book — the ' +
          'roll posts nothing more to it');

      /* -- the public record + snapshot ------------------------------- */
      const rec = gsParcelView(gsAddressOf(tb.id));
      log(rec && rec.apn === tp.apn && rec.owner === 'broke_owner' &&
          typeof rec.assessed === 'number' &&
          gsParcelByApn(tp.apn).apn === tp.apn &&
          gsTaxRoll().some(r => r.key === tb.id),
          'gs: v17 the assessor card reads by address or APN — public ' +
          'record shape');
      const snap17 = gsBusSnapshot();
      gsBusReset();
      log(Object.keys(GS_PARC.parcels).length === 0 &&
          gsBusLoad(snap17) &&
          GS_PARC.parcels[tb.id].apn === tp.apn &&
          GS_PARC.bills.length > 0 &&
          GS_PARC.apnUsed[condoApn] === true,
          'gs: v17 the roll rides the bus snapshot — parcels, APNs, ' +
          'bills verbatim');
      const vs17 = gsViewerState();
      const stats = gsCountyStats();
      const audit17 = gsAssessorAudit();
      log(vs17.county && vs17.county.parcels === stats.parcels &&
          stats.assessed > 0 && audit17.ok === true,
          'gs: v17 county stats surface on the viewer card and the ' +
          'assessor audit runs clean',
          audit17.issues.slice(0, 3).join('; ') || 'clean');
    }
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
