/* =====================================================================
   PART 27 AUTOTEST — Phase 6D: "Con người không hoàn hảo"
   Automated verification of:
     27.1 (T1 Salt Closed Loop, Multi-Trip):
          Salt stock 0 -> price high -> doBuyStep out-of-stock records demand
          -> arriveCaravan brings MORE salt proportional to demand -> stock
          restored -> price falls -> second arrival with zero demand brings
          base only.
     27.2 (T2 Thief Caught Red-Handed):
          Real doStealStep with conscious witness within 12 cells ->
          calculateTrust(witness, thief) <= 0.05 -> isOstracized(thief) true
          -> fillRoleVacancy('guard', {candidates:[thief, honest]}) elects the
          HONEST one (winner === honest.name, thief score -1 disqualified).
     27.3 (T3 False Rumor Distortion):
          NO real theft -> spreadGossip(speaker, listener, {kind:'theft-witnessed',
          by:innocent.name, weight:-1.0, confidence:0.9}) -> listener holds
          'theft-rumor' gossip reason about innocent with non-direct source ->
          calculateTrust(listener, innocent) <= 0.05 without real crime.
   ===================================================================== */

function mkTestV27(name, wx, wy, extra){
  const v = mkTestV13(name, wx, wy, Object.assign({ stage: 'adult' }, extra || {}));
  ensureBody(v);
  ensureEpistemic(v);
  if(typeof ensureReputationFields === 'function') ensureReputationFields(v);
  return v;
}

const __runAutoTest27 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest27();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: Boolean(ok), title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };

  const madeNames = [];
  function mk(name, wx, wy, extra){
    const v = mkTestV27(name, wx, wy, extra);
    madeNames.push(name);
    return v;
  }
  function cleanupTestVillagers(){
    for(const n of madeNames){
      const i = VILLAGERS.findIndex(o => o && o.name === n);
      if(i >= 0) VILLAGERS.splice(i, 1);
    }
    madeNames.length = 0;
  }

  // ===================================================================
  // 27.1 (T1 Salt Closed Loop, Multi-Trip)
  // Salt stock 0 -> price high -> doBuyStep out-of-stock records demand
  // -> arriveCaravan brings MORE salt proportional to demand -> stock
  // restored -> price falls -> second arrival with zero demand brings base only.
  // ===================================================================
  const savedSaltStock = (typeof SHOP !== 'undefined' && SHOP.stock) ? SHOP.stock.salt : 10;
  const savedFishStock = (typeof SHOP !== 'undefined' && SHOP.stock) ? SHOP.stock.fish : 8;
  const savedSaltOverride = (typeof SHOP !== 'undefined' && SHOP.priceOverrides) ? SHOP.priceOverrides.salt : undefined;
  const savedDemands = (typeof Economy !== 'undefined' && typeof Economy.getAllDemands === 'function')
    ? Economy.getAllDemands()
    : {};
  const wasCaravanActive = (typeof CARAVAN !== 'undefined') ? CARAVAN.active : false;

  const sella = (typeof VILLAGERS !== 'undefined') ? VILLAGERS.find(v => v && v.name === 'Sella') : null;
  const savedSellaDead = sella ? sella.dead : false;

  let ok27_1 = false;
  let t1Desc = '';

  try {
    if(sella) sella.dead = false;
    if(typeof CARAVAN !== 'undefined' && CARAVAN.active && typeof departCaravan === 'function'){
      departCaravan();
    }
    if(typeof Economy !== 'undefined' && typeof Economy.resetDemand === 'function'){
      Economy.resetDemand();
    }

    // Step 1: Deplete salt to 0
    SHOP.stock.salt = 0;
    const floorPrice = (SHOP.floorPrice && SHOP.floorPrice.salt) || 3;
    const highPrice = (typeof Economy !== 'undefined' && typeof Economy.getPrice === 'function')
      ? Economy.getPrice('salt', 'shop')
      : ((SHOP.buyPrice && SHOP.buyPrice.salt) || 6);
    const priceIsHigh = highPrice > floorPrice;

    // Step 2: Buyer attempts to buy out-of-stock salt via real doBuyStep
    const pShop = (typeof placePos === 'function' ? placePos('shop') : null) || { x: 0, y: 0 };
    const tBuyer = mk('T27_Salt_Buyer', 0, 0, { gold: 30, stage: 'adult', role: 'Test' });
    tBuyer.x = pShop.x;
    tBuyer.y = pShop.y;

    const buyStep = { verb: 'buy', what: 'salt', qty: 5 };
    doBuyStep(tBuyer, buyStep, 0.1);

    const recordedDemand = (typeof Economy !== 'undefined' && typeof Economy.getDemand === 'function')
      ? Economy.getDemand('salt')
      : 0;
    const demandRecorded = recordedDemand >= 5;

    // Step 3: First caravan arrival (unmet demand active)
    arriveCaravan();
    const trip1Salt = (typeof CARAVAN !== 'undefined' && CARAVAN.stock) ? CARAVAN.stock.salt : 0;
    const baseSalt = (typeof CARAVAN_BASE_STOCK !== 'undefined' && CARAVAN_BASE_STOCK.salt) || 10;
    const trip1BroughtMoreThanBase = trip1Salt > baseSalt; // 10 base + 5 demand = 15
    const shopSaltRestored = (SHOP.stock.salt || 0) >= trip1Salt;

    const restockedPrice = (typeof Economy !== 'undefined' && typeof Economy.getPrice === 'function')
      ? Economy.getPrice('salt', 'shop')
      : ((SHOP.buyPrice && SHOP.buyPrice.salt) || 3);
    const priceFell = restockedPrice < highPrice;

    // Step 4: Depart first caravan
    departCaravan();

    // Step 5: Second caravan arrival with zero unmet demand
    const demandBeforeTrip2 = (typeof Economy !== 'undefined' && typeof Economy.getDemand === 'function')
      ? Economy.getDemand('salt')
      : 0;
    arriveCaravan();
    const trip2Salt = (typeof CARAVAN !== 'undefined' && CARAVAN.stock) ? CARAVAN.stock.salt : 0;
    const trip2BringsBaseOnly = (trip2Salt === baseSalt);
    const trip2LessThanTrip1 = (trip2Salt < trip1Salt);

    departCaravan();

    ok27_1 = priceIsHigh && demandRecorded && trip1BroughtMoreThanBase &&
             shopSaltRestored && priceFell && (demandBeforeTrip2 === 0) &&
             trip2BringsBaseOnly && trip2LessThanTrip1;

    t1Desc = `priceHigh=${highPrice}g (floor=${floorPrice}g) demand=${recordedDemand} trip1Brought=${trip1Salt} (base=${baseSalt}) restoredStock=${SHOP.stock.salt} priceFell=${restockedPrice}g trip2Demand=${demandBeforeTrip2} trip2Brought=${trip2Salt}`;
  } finally {
    if(sella) sella.dead = savedSellaDead;
    if(typeof CARAVAN !== 'undefined' && CARAVAN.active && typeof departCaravan === 'function'){
      departCaravan();
    }
    if(wasCaravanActive && typeof arriveCaravan === 'function'){
      arriveCaravan();
    }
    if(typeof SHOP !== 'undefined' && SHOP.stock){
      SHOP.stock.salt = savedSaltStock;
      SHOP.stock.fish = savedFishStock;
      if(savedSaltOverride !== undefined && SHOP.priceOverrides){
        SHOP.priceOverrides.salt = savedSaltOverride;
      } else if(SHOP.priceOverrides){
        delete SHOP.priceOverrides.salt;
      }
    }
    if(typeof Economy !== 'undefined' && typeof Economy.resetDemand === 'function'){
      Economy.resetDemand();
      for(const k of Object.keys(savedDemands)){
        Economy.recordDemand(k, savedDemands[k]);
      }
    }
    const bIdx = VILLAGERS.findIndex(v => v && v.name === 'T27_Salt_Buyer');
    if(bIdx >= 0) VILLAGERS.splice(bIdx, 1);
    const mIdx = madeNames.indexOf('T27_Salt_Buyer');
    if(mIdx >= 0) madeNames.splice(mIdx, 1);
  }

  log(ok27_1, 'demandCaravan27: T1 salt closed loop (out-of-stock buy -> demand -> caravan brings demand-driven cargo -> stock restored -> price falls -> zero-demand brings base only)', t1Desc);

  // ===================================================================
  // 27.2 (T2 Thief Caught Red-Handed)
  // Real doStealStep with a conscious witness within 12 cells ->
  // calculateTrust(witness, thief) <= 0.05 -> isOstracized(thief) true ->
  // fillRoleVacancy('guard', {candidates:[thief(max hunting lvl 5), honest(lvl 3)]})
  // elects the HONEST one (winner === honest.name, thief score -1 disqualified).
  // ===================================================================
  let ok27_2 = false;
  let t2Desc = '';
  let lootItem = null;

  try {
    const tThief = mk('T27_Thief', 10, 10, { stage: 'adult', role: 'Villager' });
    ensureSkills(tThief);
    tThief.skills.hunting = { lvl: 5, xp: 0 };
    tThief.personality = Object.assign({}, tThief.personality, { brave: 1.2 });

    const tVictim = mk('T27_Victim', 10.2, 10, { stage: 'adult', role: 'Villager' });
    ensureSkills(tVictim);

    const tWitness = mk('T27_Witness', 11, 10, { stage: 'adult', role: 'Villager' });
    ensureSkills(tWitness);

    const tHonest = mk('T27_Honest', 12, 12, { stage: 'adult', role: 'Villager' });
    ensureSkills(tHonest);
    tHonest.skills.hunting = { lvl: 3, xp: 0 };
    tHonest.personality = Object.assign({}, tHonest.personality, { brave: 1.0 });

    // Mint loot held by victim
    lootItem = (typeof mintIdentifiedItem === 'function')
      ? mintIdentifiedItem('plank', { creator: tVictim.name, holder: tVictim.name, x: tVictim.x, y: tVictim.y })
      : { id: 'test_t27_plank', label: 'plank #27', currentHolder: tVictim.name, holderType: 'villager', status: 'held', actualOwner: tVictim.name };
    if(typeof ITEMS !== 'undefined') ITEMS[lootItem.id] = lootItem;

    // Thief within 1.6 cells of victim, conscious witness within 12 cells
    const stealStep = { verb: 'steal', itemId: lootItem.id, from: tVictim.name };
    doStealStep(tThief, stealStep, 0.1);

    // Assert witness trust and ostracism
    const witnessTrust = calculateTrust(tWitness, tThief);
    const thiefOstracized = isOstracized(tThief.name);

    // Election for guard role with candidates [thief, honest]
    const vacRes = fillRoleVacancy('guard', { candidates: [tThief, tHonest] });
    const winnerHonest = vacRes.ok === true && vacRes.winner === tHonest.name;
    const thiefEntry = vacRes.candidates && vacRes.candidates.find(c => c.name === tThief.name);
    const thiefDisqualified = Boolean(thiefEntry && thiefEntry.score === -1.0 && thiefEntry.disqualified === true);

    ok27_2 = (witnessTrust <= 0.05) && (thiefOstracized === true) && winnerHonest && thiefDisqualified;
    t2Desc = `witnessTrust=${witnessTrust} thiefOstracized=${thiefOstracized} vacOk=${vacRes.ok} winner=${vacRes.winner} thiefScore=${thiefEntry && thiefEntry.score} thiefDisq=${thiefEntry && thiefEntry.disqualified}`;
  } finally {
    if(typeof ITEMS !== 'undefined' && lootItem && lootItem.id){
      delete ITEMS[lootItem.id];
    }
    for(const n of ['T27_Thief', 'T27_Victim', 'T27_Witness', 'T27_Honest']){
      const idx = VILLAGERS.findIndex(v => v && v.name === n);
      if(idx >= 0) VILLAGERS.splice(idx, 1);
      const mIdx = madeNames.indexOf(n);
      if(mIdx >= 0) madeNames.splice(mIdx, 1);
    }
  }

  log(ok27_2, 'normVacancy27: T2 caught thief has trust<=0.05 and ostracized -> guard role vacancy elects honest candidate (thief score -1 disqualified)', t2Desc);

  // ===================================================================
  // 27.3 (T3 False Rumor Distortion)
  // NO real theft -> spreadGossip(speaker, listener, {kind:'theft-witnessed',
  // by:innocent.name, weight:-1.0, confidence:0.9}) -> listener holds
  // 'theft-rumor' gossip reason about innocent -> calculateTrust <= 0.05.
  // Assert the reason's source is NOT 'direct'.
  // ===================================================================
  let ok27_3 = false;
  let t3Desc = '';

  try {
    const tSpeaker = mk('T27_Gossip_Speaker', 0, 0, { stage: 'adult', role: 'Villager' });
    const tListener = mk('T27_Gossip_Listener', 0, 0, { stage: 'adult', role: 'Villager' });
    const tInnocent = mk('T27_Innocent', 0, 0, { stage: 'adult', role: 'Villager' });

    // Staging false rumor — zero real crime/theft performed
    const rumorPayload = {
      kind: 'theft-witnessed',
      by: tInnocent.name,
      weight: -1.0,
      confidence: 0.9
    };
    spreadGossip(tSpeaker, tListener, rumorPayload);

    const listenerReasons = (typeof getReputationReasons === 'function')
      ? getReputationReasons(tListener, tInnocent.name)
      : ((tListener.reputationReasons && tListener.reputationReasons[tInnocent.name]) || []);

    const rumorReason = listenerReasons.find(r => r.kind === 'theft-rumor' && r.by === tInnocent.name);
    const hasTheftRumor = Boolean(rumorReason);
    const sourceNotDirect = Boolean(rumorReason && rumorReason.source !== 'direct');
    const listenerTrust = calculateTrust(tListener, tInnocent);
    const trustCollapsed = listenerTrust <= 0.05;

    ok27_3 = hasTheftRumor && sourceNotDirect && trustCollapsed;
    t3Desc = `hasTheftRumor=${hasTheftRumor} source=${rumorReason && rumorReason.source} teller=${rumorReason && rumorReason.teller} listenerTrust=${listenerTrust}`;
  } finally {
    for(const n of ['T27_Gossip_Speaker', 'T27_Gossip_Listener', 'T27_Innocent']){
      const idx = VILLAGERS.findIndex(v => v && v.name === n);
      if(idx >= 0) VILLAGERS.splice(idx, 1);
      const mIdx = madeNames.indexOf(n);
      if(mIdx >= 0) madeNames.splice(mIdx, 1);
    }
  }

  log(ok27_3, 'falseRumor27: T3 false rumor via spreadGossip creates non-direct theft-rumor reason and collapses trust<=0.05 with zero real theft', t3Desc);

  // Final cleanup safeguard
  cleanupTestVillagers();

  el.textContent += `part27 done ==== ${res.filter(r => r.ok).length}/${res.length} passed ====\n`;
};
