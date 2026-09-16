/* =====================================================================
   PART 19 AUTOTEST — Phase 2D: Individual Knowledge, Beliefs, Memory & Ownership
   Automated verification of epistemic store, direct observations,
   teaching mechanics with proximity & consciousness gating,
   sim-time forgetting & personality fidelity presets, false/superseded beliefs,
   ownership beliefs/claims separated from world truth, and utility AI integration.
   ===================================================================== */
function mkTestV19(name, wx, wy, extra){
  const v = mkTestV18(name, wx, wy, extra);
  ensureEpistemic(v);
  return v;
}

const __runAutoTest19 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest19();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };

  // 19.1 Direct observation records high confidence memory & belief
  let t1 = mkTestV19('TObsDirect', 0, 0);
  const obs1 = observe(t1, { crop: 'wheat', stage: 2 }, {
    topic: 'crop_plot_1',
    source: 'direct',
    confidence: 0.95,
    salience: 0.8,
    evidence: ['Saw ripe wheat stalks in morning light']
  });
  const bel1 = getBelief(t1, 'crop_plot_1');
  const t1Ok = obs1 && obs1.kind === 'observation' && obs1.source === 'direct' &&
               obs1.confidence >= 0.9 && knowsAbout(t1, 'crop_plot_1') &&
               bel1 && bel1.content && bel1.content.crop === 'wheat';
  log(t1Ok, 'epistemic19: direct observation yields high confidence belief',
    'kind=' + (obs1 && obs1.kind) + ' conf=' + (obs1 && obs1.confidence) + ' crop=' + (bel1 && bel1.content && bel1.content.crop));
  rmTestV13(t1);

  // 19.2 Teaching transmits knowledge with reduced confidence and hearsay source
  let t2A = mkTestV19('TTeachA', 0, 0);
  let t2B = mkTestV19('TTeachB', 1, 0); // 1 cell apart (proximity)
  observe(t2A, { soil: 'rich loam', yield: 'high' }, {
    topic: 'north_field',
    source: 'direct',
    confidence: 0.88,
    salience: 0.7,
    evidence: ['Surveyed the soil quality']
  });
  const teachRes = teach(t2A, t2B, 'north_field');
  const t2Bel = getBelief(t2B, 'north_field');
  const t2Ok = teachRes.ok && teachRes.memory &&
               teachRes.memory.kind === 'taught' &&
               teachRes.memory.source === 'hearsay' &&
               teachRes.memory.confidence < 0.88 &&
               teachRes.memory.confidence > 0.5 &&
               t2Bel && t2Bel.content && t2Bel.content.soil === 'rich loam';
  log(t2Ok, 'epistemic19: student taught by teacher gains hearsay knowledge with reduced confidence',
    'resOk=' + teachRes.ok + ' teacherConf=0.88 studentConf=' + (teachRes.memory && teachRes.memory.confidence) + ' src=' + (teachRes.memory && teachRes.memory.source));
  rmTestV13(t2A); rmTestV13(t2B);

  // 19.3 Forgetting: confidence decays over sim days, sharp forgets slower than forgetful
  let tSharp = mkTestV19('TSharp', 0, 0);
  tSharp.memoryTrait = 'sharp';
  let tForget = mkTestV19('TForget', 0, 0);
  tForget.memoryTrait = 'forgetful';
  observe(tSharp, 'hidden_spring', { topic: 'hidden_spring', confidence: 0.80, salience: 0.5 });
  observe(tForget, 'hidden_spring', { topic: 'hidden_spring', confidence: 0.80, salience: 0.5 });
  // Simulate 2 days passing
  decayEpistemic(tSharp, 2.0);
  decayEpistemic(tForget, 2.0);
  const confSharp = getBelief(tSharp, 'hidden_spring') ? getBelief(tSharp, 'hidden_spring').confidence : 0;
  const confForget = getBelief(tForget, 'hidden_spring') ? getBelief(tForget, 'hidden_spring').confidence : 0;
  const t3Ok = confSharp > 0 && confForget > 0 && confSharp > confForget && confSharp < 0.80 && confForget < 0.80;
  log(t3Ok, 'epistemic19: confidence decays over sim days; sharp personality forgets slower than forgetful',
    'sharpConf=' + confSharp.toFixed(3) + ' forgetfulConf=' + confForget.toFixed(3));
  rmTestV13(tSharp); rmTestV13(tForget);

  // 19.4 High salience memories persist longer than low salience memories
  let t4 = mkTestV19('TSalience', 0, 0);
  observe(t4, 'dragon_sighting', { topic: 'dragon_sighting', confidence: 0.80, salience: 0.95 });
  observe(t4, 'pebble_color', { topic: 'pebble_color', confidence: 0.80, salience: 0.10 });
  decayEpistemic(t4, 2.5);
  const confHigh = getBelief(t4, 'dragon_sighting') ? getBelief(t4, 'dragon_sighting').confidence : 0;
  const confLow = getBelief(t4, 'pebble_color') ? getBelief(t4, 'pebble_color').confidence : 0;
  const t4Ok = confHigh > confLow;
  log(t4Ok, 'epistemic19: high salience memories decay slower and persist longer',
    'highSalienceConf=' + confHigh.toFixed(3) + ' lowSalienceConf=' + confLow.toFixed(3));
  rmTestV13(t4);

  // 19.5 False belief possible: contradicts world truth, both coexist peacefully
  let t5 = mkTestV19('TFalseBelief', 0, 0);
  const innBld = typeof VILLAGE_BUILDINGS !== 'undefined' ? VILLAGE_BUILDINGS.find(b => b.id === 'inn') : null;
  const actualInnOwner = innBld ? getBuildingOwner(innBld) : 'Tobin';
  recordOwnershipBelief(t5, 'inn', {
    knownOwner: 'Bram',
    suspectedOwner: 'Bram',
    confidence: 0.85,
    evidence: ['Heard rumor that Bram bought the tavern']
  });
  const t5OwnBelief = getOwnershipBelief(t5, 'inn');
  const actualOwnerNow = innBld ? getBuildingOwner(innBld) : null;
  const t5Ok = actualOwnerNow === 'Tobin' &&
               t5OwnBelief && t5OwnBelief.knownOwner === 'Bram' &&
               t5OwnBelief.confidence === 0.85;
  log(t5Ok, 'epistemic19: false belief contradicts world truth without error; both coexist',
    'worldTruthOwner=' + actualOwnerNow + ' villagerBelievedOwner=' + (t5OwnBelief && t5OwnBelief.knownOwner));
  rmTestV13(t5);

  // 19.6 New direct observation supersedes old belief; old marked superseded and kept in history
  let t6 = mkTestV19('TSupersede', 0, 0);
  const memOld = observe(t6, { crop: 'cabbage' }, {
    topic: 'garden_plot',
    source: 'memory',
    confidence: 0.6,
    salience: 0.5
  });
  const memNew = observe(t6, { crop: 'carrots' }, {
    topic: 'garden_plot',
    source: 'direct',
    confidence: 0.95,
    salience: 0.7,
    conflicts: true
  });
  const activeBelief = getBelief(t6, 'garden_plot');
  const oldEntryInMem = t6.epistemic.memories.find(m => m.id === memOld.id);
  const newEntryInMem = t6.epistemic.memories.find(m => m.id === memNew.id);
  const t6Ok = activeBelief && activeBelief.content.crop === 'carrots' &&
               oldEntryInMem && oldEntryInMem.superseded === true &&
               oldEntryInMem.supersededBy === memNew.id &&
               newEntryInMem && newEntryInMem.superseded === false &&
               t6.epistemic.memories.length >= 2;
  log(t6Ok, 'epistemic19: new direct observation supersedes old belief; old marked superseded and kept in history',
    'active=' + (activeBelief && activeBelief.content.crop) + ' oldSuperseded=' + (oldEntryInMem && oldEntryInMem.superseded) + ' historyLen=' + t6.epistemic.memories.length);
  rmTestV13(t6);

  // 19.7 Ownership belief data structure: knownOwner, suspectedOwner, confidence, evidence[], claims[]
  let t7 = mkTestV19('TOwnStruct', 0, 0);
  recordOwnershipBelief(t7, 'iron_axe', {
    knownOwner: 'Bram',
    suspectedOwner: 'Bram',
    confidence: 0.9,
    evidence: ['Bram crafted it with his initials'],
    claims: [{ claimant: 'Finn', when: 1.0, text: 'Finn says he found it' }]
  });
  const oRec = getOwnershipBelief(t7, 'iron_axe');
  const t7Ok = oRec && oRec.targetId === 'iron_axe' &&
               oRec.knownOwner === 'Bram' &&
               oRec.suspectedOwner === 'Bram' &&
               oRec.confidence === 0.9 &&
               Array.isArray(oRec.evidence) && oRec.evidence.length === 1 &&
               Array.isArray(oRec.claims) && oRec.claims.length === 1 &&
               oRec.claims[0].claimant === 'Finn';
  log(t7Ok, 'epistemic19: ownership belief data structure contains all required fields',
    'target=' + (oRec && oRec.targetId) + ' knownOwner=' + (oRec && oRec.knownOwner) + ' claimsCount=' + (oRec && oRec.claims.length));
  rmTestV13(t7);

  // 19.8 Claim recorded as claim, actualOwner unchanged
  let tClaimant = mkTestV19('TGarethClaim', 0, 0);
  const actualBefore = innBld ? getBuildingOwner(innBld) : 'Tobin';
  claimOwnership(tClaimant, 'inn', { text: 'I Gareth claim this inn!' });
  const actualAfter = innBld ? getBuildingOwner(innBld) : null;
  const claimantOwn = getOwnershipBelief(tClaimant, 'inn');
  const claimantClaimMem = tClaimant.epistemic.memories.find(m => m.kind === 'claim' && m.topic === 'ownership_inn');
  const t8Ok = actualBefore === 'Tobin' && actualAfter === 'Tobin' &&
               claimantClaimMem && claimantClaimMem.kind === 'claim' &&
               claimantOwn && claimantOwn.claims && claimantOwn.claims.some(c => c.claimant === 'TGarethClaim');
  log(t8Ok, 'epistemic19: ownership claim recorded as claim; world actualOwner is unchanged',
    'actualBefore=' + actualBefore + ' actualAfter=' + actualAfter + ' claimantMemKind=' + (claimantClaimMem && claimantClaimMem.kind));
  rmTestV13(tClaimant);

  // 19.9 Claim witnessed by third villager -> third forms belief about the claim
  let tClaimer = mkTestV19('TClaimer', 2, 2);
  let tWitness = mkTestV19('TWitness', 3, 2); // 1 cell apart
  claimOwnership(tClaimer, 'smithy', { text: 'Smithy is mine!' });
  const wMem = tWitness.epistemic.memories.find(m => m.kind === 'claim' && m.topic === 'ownership_smithy');
  const wOwn = getOwnershipBelief(tWitness, 'smithy');
  const t9Ok = wMem && wMem.source === 'hearsay' && wMem.who === 'TClaimer' &&
               wOwn && wOwn.claims && wOwn.claims.some(c => c.claimant === 'TClaimer') &&
               wOwn.evidence && wOwn.evidence.some(e => e.includes('TClaimer'));
  log(t9Ok, 'epistemic19: nearby third villager witnesses claim and records claim belief and evidence',
    'witnessMemKind=' + (wMem && wMem.kind) + ' src=' + (wMem && wMem.source) + ' who=' + (wMem && wMem.who));
  rmTestV13(tClaimer); rmTestV13(tWitness);

  // 19.10 Teaching requires proximity: far apart fails honestly
  let tFarA = mkTestV19('TFarA', 0, 0);
  let tFarB = mkTestV19('TFarB', 25, 25); // ~35 cells apart
  observe(tFarA, 'ancient_ruins', { topic: 'ancient_ruins', confidence: 0.9 });
  const farRes = teach(tFarA, tFarB, 'ancient_ruins');
  const farBel = getBelief(tFarB, 'ancient_ruins');
  const t10Ok = farRes.ok === false && farRes.reason === 'too far' && farBel === null;
  log(t10Ok, 'epistemic19: teaching fails honestly when participants are far apart',
    'ok=' + farRes.ok + ' reason=' + farRes.reason + ' studentLearned=' + (farBel !== null));
  rmTestV13(tFarA); rmTestV13(tFarB);

  // 19.11 Teaching requires consciousness: sleeping or downed fails honestly
  let tSleepA = mkTestV19('TSleepA', 0, 0);
  let tSleepB = mkTestV19('TSleepB', 1, 0);
  observe(tSleepA, 'secret_recipe', { topic: 'secret_recipe', confidence: 0.9 });
  tSleepB.state = 'sleep'; // student asleep
  const sleepRes = teach(tSleepA, tSleepB, 'secret_recipe');
  const sleepBel = getBelief(tSleepB, 'secret_recipe');
  const t11Ok = sleepRes.ok === false && sleepRes.reason === 'unconscious' && sleepBel === null;
  log(t11Ok, 'epistemic19: teaching fails honestly when participant is asleep or unconscious',
    'ok=' + sleepRes.ok + ' reason=' + sleepRes.reason + ' studentLearned=' + (sleepBel !== null));
  rmTestV13(tSleepA); rmTestV13(tSleepB);

  // 19.12 getBelief returns null / knowsAbout returns false for unknown topics
  let t12 = mkTestV19('TUnknown', 0, 0);
  const unkBel = getBelief(t12, 'mythical_unicorn_glen');
  const knowsUnk = knowsAbout(t12, 'mythical_unicorn_glen');
  const t12Ok = unkBel === null && knowsUnk === false;
  log(t12Ok, 'epistemic19: getBelief returns null and knowsAbout returns false for unknown topics',
    'unkBel=' + unkBel + ' knows=' + knowsUnk);
  rmTestV13(t12);

  // 19.13 Utility AI consults food belief instead of omniscience
  let t13 = mkTestV19('TEpistemicUtil', 80, 80); // Outside village sight range
  ensureBody(t13).satiety = 0.05; // starving
  // Clear all default food beliefs so villager has no idea where food is
  t13.epistemic.beliefs = {};
  t13.epistemic.ownership = {};
  // Place a distant food pile 31 cells away (strictly beyond sight range of 30)
  const farPile = dropPileAt(111 * CS + 16, 80 * CS + 16, 'bread', 5);
  const ch13NoBelief = evaluateVillagerUtility(t13);
  const hasOmniscientPile = ch13NoBelief.candidates.some(c => c.id === 'eat_pile_' + farPile.wx + '_' + farPile.wy);
  const hasExploreAction = ch13NoBelief.bestAction && ch13NoBelief.bestAction.id === 'explore_food';

  // Now teach or let villager observe/believe that the pile exists
  observe(t13, { foodKind: 'bread', wx: farPile.wx, wy: farPile.wy }, {
    topic: 'pile_' + farPile.wx + '_' + farPile.wy,
    source: 'hearsay',
    confidence: 0.9
  });
  const ch13WithBelief = evaluateVillagerUtility(t13);
  const hasBelievedPile = ch13WithBelief.candidates.some(c => c.id === 'eat_pile_' + farPile.wx + '_' + farPile.wy);
  const bestIsBelievedPile = ch13WithBelief.bestAction && ch13WithBelief.bestAction.id === 'eat_pile_' + farPile.wx + '_' + farPile.wy;

  const t13Ok = !hasOmniscientPile && hasExploreAction && hasBelievedPile && bestIsBelievedPile;
  log(t13Ok, 'epistemic19: utility AI explores when food unknown; targets believed food location once known',
    'noBeliefOmniscient=' + hasOmniscientPile + ' noBeliefBest=' + (ch13NoBelief.bestAction && ch13NoBelief.bestAction.id) +
    ' withBeliefBest=' + (ch13WithBelief.bestAction && ch13WithBelief.bestAction.id));
  const fpi = PILES.indexOf(farPile);
  if(fpi >= 0) PILES.splice(fpi, 1);
  rmTestV13(t13);

  // 19.14 REGRESSION (defect 1): conflict on a non-hardcoded content key must
  // supersede the old belief, not silently merge it away.
  let t14 = mkTestV19('TConflict14', 0, 0);
  const mem14a = observe(t14, { place: 'north' }, {
    topic: 'cache_spot', source: 'direct', confidence: 0.9, salience: 0.6
  });
  const mem14b = observe(t14, { place: 'south' }, {
    topic: 'cache_spot', source: 'direct', confidence: 0.9, salience: 0.6
  });
  const bel14 = getBelief(t14, 'cache_spot');
  const old14 = t14.epistemic.memories.find(m => m.id === mem14a.id);
  const t14Ok = bel14 && bel14.content && bel14.content.place === 'south' &&
                old14 && old14.superseded === true && old14.supersededBy === mem14b.id &&
                t14.epistemic.memories.some(m => m.id === mem14a.id);
  log(t14Ok, 'epistemic19: non-hardcoded key conflict supersedes old belief instead of silently merging',
    'active=' + (bel14 && bel14.content && bel14.content.place) + ' oldSuperseded=' + (old14 && old14.superseded));
  rmTestV13(t14);

  // 19.15 REGRESSION (defect 2): reinforcing a belief must not mutate the
  // historical memory entry's evidence array (no shared references).
  let t15 = mkTestV19('TEvidence15', 0, 0);
  const mem15a = observe(t15, { color: 'red' }, {
    topic: 'banner_color', source: 'direct', confidence: 0.8, salience: 0.6,
    evidence: ['saw deed']
  });
  observe(t15, { color: 'red' }, {
    topic: 'banner_color', source: 'direct', confidence: 0.85, salience: 0.6,
    evidence: ['saw again']
  });
  const hist15 = t15.epistemic.memories.find(m => m.id === mem15a.id);
  const bel15 = getBelief(t15, 'banner_color');
  const t15Ok = hist15 && hist15.evidence.length === 1 && hist15.evidence[0] === 'saw deed' &&
                !hist15.superseded &&
                bel15 && bel15.evidence !== hist15.evidence &&
                bel15.evidence.includes('saw deed') && bel15.evidence.includes('saw again');
  log(t15Ok, 'epistemic19: belief reinforcement does not mutate historical memory evidence array',
    'histEv=' + JSON.stringify(hist15 && hist15.evidence) + ' aliased=' + (bel15 && hist15 && bel15.evidence === hist15.evidence));
  rmTestV13(t15);

  el.textContent += '\n==== part19 ' + res.filter(r => r.ok).length + '/' + res.length + ' passed ====\n';
};
