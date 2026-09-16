/* =====================================================================
   PART 26 AUTOTEST — Phase 6C: Deep Psychology & Autobiographical Identity
   ("Tâm lý sâu & Căn tính")
   Automated verification of:
     26.1 (C2 Tier 1 Conflicting Motivations): Alden fatigue 70% + sick person
          needing care -> duty beats sleep, suppression stress + emotion tag
          ('tired-but-proud') recorded into memory.
     26.2 (C2 Tier 2 Biology Override): Alden fatigue 95% -> forced microsleep
          despite duty (biology overrides poetry 100%).
     26.3 (C1 Survival Guard & Anti-Oscillation): Death-threshold trigger ->
          no oscillation: after re-decide lock, action stable >= N ticks (anti eat<->flee loop).
     26.4 (C5 Autobiographical Identity): Extreme-salience event -> new identity
          tag forms -> tag measurably affects attention (e.g. Pip's mother cry salience x5)
          and drops oldest when exceeding 5 tags.
     26.5 (C4 Body-Factor Chain): Untreated wound -> infection -> work factor drops ->
          villager picks lighter work than an unimpaired control.
     26.6 (C3 Emotion Derivation): Emotions derived from body/needs + decay:
          hungry->anxious, pain->suffering, stable->content.
     26.7 (C1 Defect 1 Fix - Blood Guard Steer): Probe blood=0.5 triggers rest_or_tend
          guard boost (>=8000) and villager picks rest/tend over work.
     26.8 (C5 Defect 2 Fix - Real Identity Crystallization): All 7/7 identity tags
          crystallize via real gameplay paths (0 manual formIdentityTag calls).
     26.9 (Cleanup): Verify all test entities cleaned up cleanly.
   ===================================================================== */

function mkTestV26(name, wx, wy, extra){
  const v = mkTestV25(name, wx, wy, extra);
  ensureBody(v);
  ensureEpistemic(v);
  return v;
}

const __runAutoTest26 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest26();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: Boolean(ok), title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const madeNames = [];
  function mk(name, wx, wy, extra){
    const v = mkTestV26(name, wx, wy, extra);
    madeNames.push(name);
    return v;
  }
  function cleanup(){
    for(const n of madeNames){
      const i = VILLAGERS.findIndex(o => o && o.name === n);
      if(i >= 0) VILLAGERS.splice(i, 1);
    }
    madeNames.length = 0;
  }

  // -------------------------------------------------------------------
  // 26.1 (C2 Tier 1): Duty beats sleep below ~80% deficit + emotional trace
  // Alden at fatigue 70% + sick person needing care -> duty beats sleep ->
  // record suppression stress + emotion tag ('tired-but-proud') into memory.
  // -------------------------------------------------------------------
  const tSick1 = mk('T26_Sick_Barnaby', 2, -8, { role: 'Villager' });
  tSick1.body.illness = 0.45;
  tSick1.body.wounds = [{ loc: 'arm', sev: 0.5, open: true, bleed: 0.05, dressed: false, t: 1 }];

  const tAlden1 = mk('T26_Alden_Duty', 0, -10, { role: 'Village Mayor' });
  tAlden1.body.fatigue = 0.70; // 70% fatigue deficit (Tier 1)
  tAlden1.body.stress = 0.05;
  tAlden1.body.hydration = 0.90;
  tAlden1.body.satiety = 0.90;

  const eval1 = evaluateVillagerUtility(tAlden1);
  const best1 = eval1.bestAction;
  const sleepCandidate1 = eval1.candidates.find(c => c.id === 'sleep');

  const dutyWon = best1 && best1.category === 'duty' && best1.id.startsWith('duty_care');
  const dutyOutscoredSleep = sleepCandidate1 && best1 && best1.score > sleepCandidate1.score;

  // Execute the chosen duty action to leave the emotional trace
  const initialStress = tAlden1.body.stress;
  executeUtilityAction(tAlden1, best1);

  const suppressionStressRecorded = tAlden1.body.stress > initialStress;
  const emotionTagRecorded = tAlden1.emotions && tAlden1.emotions.some(e => e.tag === 'tired-but-proud');
  const memoryRecorded = tAlden1.epistemic.memories && tAlden1.epistemic.memories.some(m =>
    m.topic === 'duty_tradeoff' && m.content && m.content.emotion === 'tired-but-proud'
  );

  const ok26_1 = dutyWon && dutyOutscoredSleep && suppressionStressRecorded && emotionTagRecorded && memoryRecorded;
  log(ok26_1, 'conflict26: Tier 1 duty beats sleep at 70% fatigue, recording suppression stress and tired-but-proud emotion',
    `winner=${best1 && best1.id} (score=${best1 && best1.score.toFixed(1)}) vs sleepScore=${sleepCandidate1 ? sleepCandidate1.score.toFixed(1) : 'none'} stress=${tAlden1.body.stress.toFixed(2)} emotion=${emotionTagRecorded} mem=${memoryRecorded}`);

  // -------------------------------------------------------------------
  // 26.2 (C2 Tier 2): Biology overrides poetry 100% at fatigue 95%
  // Alden at fatigue 95% -> forced microsleep despite duty
  // -------------------------------------------------------------------
  const tAlden2 = mk('T26_Alden_Exhausted', 0, -10, { role: 'Village Mayor' });
  tAlden2.body.fatigue = 0.95; // 95% fatigue deficit (Tier 2 biological override)
  tAlden2.body.hydration = 0.90;
  tAlden2.body.satiety = 0.90;

  const eval2 = evaluateVillagerUtility(tAlden2);
  const best2 = eval2.bestAction;

  const microsleepTriggered = best2 && (best2.id === 'microsleep' || (best2.plan && best2.plan[0] && best2.plan[0].microsleep));
  const dutyDenied = best2 && best2.category !== 'duty';

  const ok26_2 = microsleepTriggered && dutyDenied;
  log(ok26_2, 'conflict26: Tier 2 biology overrides poetry 100% at 95% fatigue (forced microsleep)',
    `winner=${best2 && best2.id} category=${best2 && best2.category} score=${best2 && best2.score} reason=${best2 && best2.reason}`);

  // -------------------------------------------------------------------
  // 26.3 (C1): Survival Guard & Anti-Oscillation on Live Wrapper Chain
  // Real {verb:'work'} step on LIVE wrapper chain interrupted by Survival Guard (blood=0.55 -> rest/tend with guard:true)
  // Stable >= 8 ticks after trigger (no blind re-cancel / oscillation)
  // Both live planTick wrapper chain and production brainThink choke point verified
  // -------------------------------------------------------------------
  const tGuard = mk('T26_Guard_Villager', 5, 5, { role: 'Village Farmer' });
  tGuard.body.hydration = 0.90;
  tGuard.body.satiety = 0.90;
  tGuard.body.coreTemp = 37.0;
  tGuard.body.blood = 0.50; // Low blood deficit (blood=0.5 triggers rest_or_tend survival guard)

  // Start with a REAL work action on the live wrapper chain (the common swallowed verb)
  tGuard.plan = [{ verb: 'work', hours: 3 }];
  tGuard.currentAction = { id: 'work_farming', category: 'work' };

  // Step 1: planTick runs on LIVE wrapper chain and triggers survival guard interrupt
  planTick(tGuard, 0.05);

  const interruptTriggered = tGuard.interrupted === true && tGuard.guardLock > 0;
  const initialGuardedAction = tGuard.plan && tGuard.plan.length ? tGuard.plan[0] : null;
  const planIsRestOrTend = initialGuardedAction &&
    (initialGuardedAction.verb === 'rest' || initialGuardedAction.verb === 'tend') &&
    initialGuardedAction.guard === true;

  // Step 2: verify stability for N ticks (N = 8) under continued low-blood pressure
  const N_TICKS = 8;
  let stayStable = true;
  for(let i = 0; i < N_TICKS; i++){
    planTick(tGuard, 0.02);
    // Action must remain the guarded survival action and not wipe or oscillate
    const cur = tGuard.plan && tGuard.plan.length ? tGuard.plan[0] : null;
    if(!cur || (cur.verb !== 'rest' && cur.verb !== 'tend') || !cur.guard){
      stayStable = false;
      break;
    }
  }

  // Also verify production brainThink choke point (Observe -> Think -> Learn per-tick decision)
  const tGuardBT = mk('T26_Guard_BrainThink', 5, 5, { role: 'Village Farmer' });
  tGuardBT.body.hydration = 0.90;
  tGuardBT.body.satiety = 0.90;
  tGuardBT.body.coreTemp = 37.0;
  tGuardBT.body.blood = 0.50;
  tGuardBT.plan = [{ verb: 'work', hours: 3 }];
  tGuardBT.currentAction = { id: 'work_farming', category: 'work' };

  brainThink(tGuardBT, 0.05);
  const btInterrupted = tGuardBT.interrupted === true && tGuardBT.guardLock > 0;
  const btAction = tGuardBT.plan && tGuardBT.plan.length ? tGuardBT.plan[0] : null;
  const btIsRestOrTend = btAction &&
    (btAction.verb === 'rest' || btAction.verb === 'tend') &&
    btAction.guard === true;
  let btStable = true;
  for(let i = 0; i < N_TICKS; i++){
    brainThink(tGuardBT, 0.02);
    const cur = tGuardBT.plan && tGuardBT.plan.length ? tGuardBT.plan[0] : null;
    if(!cur || (cur.verb !== 'rest' && cur.verb !== 'tend') || !cur.guard){
      btStable = false;
      break;
    }
  }

  const ok26_3 = interruptTriggered && planIsRestOrTend && stayStable && btInterrupted && btIsRestOrTend && btStable;
  log(ok26_3, 'guard26: survival guard interrupts real work step on live chain -> rest/tend guard:true, stable >=8 ticks (both planTick & brainThink)',
    `planTick(interrupted=${interruptTriggered} lock=${tGuard.guardLock} verb=${initialGuardedAction && initialGuardedAction.verb} guard=${initialGuardedAction && initialGuardedAction.guard} stableFor${N_TICKS}=${stayStable}) brainThink(interrupted=${btInterrupted} lock=${tGuardBT.guardLock} verb=${btAction && btAction.verb} guard=${btAction && btAction.guard} stableFor${N_TICKS}=${btStable})`);

  // -------------------------------------------------------------------
  // 26.4 (C5): Autobiographical Identity crystallization & attention multiplier
  // Extreme-salience event -> identity tag forms -> tag measurably affects attention
  // -------------------------------------------------------------------
  const tMarta = mk('T26_Marta_Identity', 0, 0, { role: 'Village Farmer' });
  tMarta.identity = [];

  // Extreme-salience event (salience >= 0.90) forms identity tag
  observe(tMarta, { event: 'pips_mother', who: 'Marta', child: 'Pip' }, {
    topic: 'pips_mother',
    salience: 0.95,
    source: 'direct'
  });

  const tagFormed = tMarta.identity.some(id => id.tag === 'pips_mother');

  // Measurable behavioral effect: Pip's cry salience x5 in attention
  const cryStimulus = { kind: 'cry', who: 'Pip', what: "Pip's distressed cry in the distance" };
  const cryDetails = { salience: 0.18, who: 'Pip' };

  // Control villager without identity tag on task
  const tStranger = mk('T26_Stranger_Task', 10, 10, { role: 'Woodcutter' });
  tStranger.plan = [{ verb: 'fell' }]; // Task focus
  tStranger.identity = [];

  const strangerAttention = filterAttention(tStranger, cryStimulus, cryDetails);
  const martaAttention = filterAttention(tMarta, cryStimulus, cryDetails);

  // Stranger filters out low-salience cry due to task focus (attended: false)
  // Marta with 'pips_mother' tag has salience multiplied by 5 (0.18 x 5 = 0.90 >= 0.80), piercing gate 3!
  const attentionDiverged = strangerAttention.attended === false && martaAttention.attended === true;
  const multiplierApplied = martaAttention.idMult >= 5.0 || (martaAttention.effectiveSalience && martaAttention.effectiveSalience >= 0.85);

  // Verify tag cap: maximum 5 tags, oldest/lowest-salience drops
  formIdentityTag(tMarta, 'tag_alpha', { salience: 0.50 });
  formIdentityTag(tMarta, 'tag_beta', { salience: 0.55 });
  formIdentityTag(tMarta, 'tag_gamma', { salience: 0.60 });
  formIdentityTag(tMarta, 'tag_delta', { salience: 0.65 });
  // Adding 6th tag must drop lowest salience (tag_alpha at 0.50)
  formIdentityTag(tMarta, 'tag_omega', { salience: 0.99 });
  const maxTagsEnforced = tMarta.identity.length === 5;
  const droppedLowest = !tMarta.identity.some(id => id.tag === 'tag_alpha');

  const ok26_4 = tagFormed && attentionDiverged && multiplierApplied && maxTagsEnforced && droppedLowest;
  log(ok26_4, 'identity26: extreme salience crystallizes identity tag with 5x cry attention multiplier and 5-tag cap',
    `tagFormed=${tagFormed} strangerAtt=${strangerAttention.attended} martaAtt=${martaAttention.attended} mult=${martaAttention.idMult} tagsCount=${tMarta.identity.length} droppedAlpha=${droppedLowest}`);

  // -------------------------------------------------------------------
  // 26.5 (C4): Body-factor chain
  // Untreated wound -> infection -> work factor drops -> villager picks lighter work
  // -------------------------------------------------------------------
  const tControl = mk('T26_Work_Control', 0, 0, { role: 'Village Farmer' });
  tControl.body.hydration = 0.9;
  tControl.body.satiety = 0.9;
  tControl.body.fatigue = 0.1;
  calcBodyFactors(tControl);

  const tImpaired = mk('T26_Work_Impaired', 0, 0, { role: 'Village Farmer' });
  tImpaired.body.hydration = 0.9;
  tImpaired.body.satiety = 0.9;
  tImpaired.body.fatigue = 0.1;

  // Untreated wound develops infection
  if(typeof addWound === 'function'){
    addWound(tImpaired, 'arm', 0.6, { open: true, bleed: 0.15, fracture: false });
  } else {
    tImpaired.body.wounds = [{ loc: 'arm', sev: 0.6, open: true, bleed: 0.15, inf: 0.4, dressed: false, t: 5 }];
  }
  tImpaired.body.wounds[0].inf = 0.45; // Untreated infection
  tImpaired.body.blood = 0.80;        // Blood loss
  calcBodyFactors(tImpaired);

  const controlWF = tControl.bodyWorkFactor != null ? tControl.bodyWorkFactor : 1.0;
  const impairedWF = tImpaired.bodyWorkFactor != null ? tImpaired.bodyWorkFactor : 1.0;
  const workFactorDropped = impairedWF < 0.70 && impairedWF < controlWF;

  // Set up ripe crop (heavy farm work) and recipe workbench/spot (light work)
  const heavyAction = { id: 'work_farm', category: 'work', workType: 'farming', ripe: true, tx: tControl.x + 10, ty: tControl.y + 10 };
  const lightAction = { id: 'work_recipe_basket', category: 'work', workType: 'crafting', recipeId: 'basket', name: 'Weave basket', tx: tControl.x + 10, ty: tControl.y + 10 };

  const controlHeavyScore = scoreCandidateAction(tControl, heavyAction);
  const controlLightScore = scoreCandidateAction(tControl, lightAction);

  const impairedHeavyScore = scoreCandidateAction(tImpaired, heavyAction);
  const impairedLightScore = scoreCandidateAction(tImpaired, lightAction);

  // Control prefers heavy farm work (higher base + role bonus)
  const controlPrefersHeavy = controlHeavyScore > controlLightScore;
  // Impaired villager prefers lighter work due to heavy labor penalty from low workFactor
  const impairedPrefersLight = impairedLightScore > impairedHeavyScore;

  const ok26_5 = workFactorDropped && controlPrefersHeavy && impairedPrefersLight;
  log(ok26_5, 'bodyFactor26: untreated wound and infection drops workFactor causing autonomous preference for lighter work',
    `controlWF=${controlWF.toFixed(2)} impairedWF=${impairedWF.toFixed(2)} control(heavy=${controlHeavyScore.toFixed(1)} light=${controlLightScore.toFixed(1)}) impaired(heavy=${impairedHeavyScore.toFixed(1)} light=${impairedLightScore.toFixed(1)})`);

  // -------------------------------------------------------------------
  // 26.6 (C3): Emotion derivation layer (body/needs -> emotions + decay)
  // Hungry -> anxious, pain -> suffering, stable -> content
  // -------------------------------------------------------------------
  const tEmote = mk('T26_Emote_Villager', 0, 0, { role: 'Villager' });
  tEmote.body.hydration = 0.9;
  tEmote.body.satiety = 0.20; // hungry
  tEmote.body.fatigue = 0.2;
  updateDerivedEmotions(tEmote, 0.5);

  const derivedAnxious = tEmote.emotions && tEmote.emotions.some(e => e.tag === 'anxious');

  // Inflict pain/injury
  tEmote.body.injury = 0.6;
  updateDerivedEmotions(tEmote, 0.5);
  const derivedSuffering = tEmote.emotions && tEmote.emotions.some(e => e.tag === 'suffering');

  // Stabilize needs
  tEmote.body.satiety = 0.85;
  tEmote.body.injury = 0.0;
  tEmote.body.wounds = [];
  tEmote.body.illness = 0.0;
  updateDerivedEmotions(tEmote, 0.5);
  const derivedContent = tEmote.emotions && tEmote.emotions.some(e => e.tag === 'content');

  const ok26_6 = derivedAnxious && derivedSuffering && derivedContent;
  log(ok26_6, 'emotions26: derived emotions layer correctly maps body states to anxious, suffering, and content',
    `anxious=${derivedAnxious} suffering=${derivedSuffering} content=${derivedContent}`);

  // -------------------------------------------------------------------
  // 26.7 (C1 Defect 1): Blood guard trigger boosts rest/tend and villager picks it over work
  // probe blood=0.5 -> rest/tend candidate gets guard boost (>=8000) and villager
  // actually picks it instead of work candidates.
  // -------------------------------------------------------------------
  const tBleed = mk('T26_Bleed_Villager', 0, 0, { role: 'Village Farmer' });
  tBleed.body.hydration = 0.90;
  tBleed.body.satiety = 0.90;
  tBleed.body.fatigue = 0.10;
  tBleed.body.coreTemp = 37.0;
  tBleed.body.blood = 0.50; // Low blood deficit (triggers blood survival guard)

  // Ensure ripe crop exists for farming candidate
  let addedCrop = false;
  if(typeof CROPS !== 'undefined' && Array.isArray(CROPS) && CROPS.length === 0){
    CROPS.push({ wx: 2, wy: 2, stage: 2, plant: 'wheat' });
    addedCrop = true;
  }

  const bleedTrigs = getSurvivalGuardTriggers(tBleed);
  const bloodTrig = bleedTrigs.find(tr => tr.type === 'blood' && tr.need === 'rest_or_tend');

  const evalBleed = evaluateVillagerUtility(tBleed);
  const bestBleed = evalBleed.bestAction;
  const restCandidate = evalBleed.candidates.find(c => c.id === 'rest');
  const workCandidate = evalBleed.candidates.find(c => c.category === 'work' || c.id.startsWith('work_'));

  const guardBoostApplied = restCandidate && restCandidate.score >= 8000;
  const restPickedOverWork = bestBleed && (bestBleed.id === 'rest' || bestBleed.id === 'self_tend') &&
    (!workCandidate || bestBleed.score > workCandidate.score);

  // Apply action and verify plan is set to guarded rest/tend
  tBleed.brainControlled = false;
  evaluateAndApplyUtilityAction(tBleed);
  const planIsGuarded = tBleed.plan && tBleed.plan.length > 0 &&
    (tBleed.plan[0].verb === 'rest' || tBleed.plan[0].verb === 'tend') &&
    tBleed.plan[0].guard === true;

  if(addedCrop && typeof CROPS !== 'undefined' && Array.isArray(CROPS)){
    CROPS.pop();
  }

  const ok26_7 = Boolean(bloodTrig) && guardBoostApplied && restPickedOverWork && planIsGuarded;
  log(ok26_7, 'bloodGuard26: blood=0.5 triggers rest_or_tend guard boost (>=8000) and villager picks rest over work',
    `trig=${Boolean(bloodTrig)} restScore=${restCandidate ? restCandidate.score.toFixed(1) : 'none'} workScore=${workCandidate ? workCandidate.score.toFixed(1) : 'none'} winner=${bestBleed && bestBleed.id} planVerb=${tBleed.plan && tBleed.plan[0] && tBleed.plan[0].verb}`);

  // -------------------------------------------------------------------
  // 26.8 (C5 Defect 2): Real gameplay paths crystallize all 7/7 identity tags
  // No manual formIdentityTag calls — all 7 tags in IDENTITY_TAGS must form via
  // real gameplay emitters:
  // 1. pips_mother: birth observation with child 'Pip'
  // 2. betrayed: theft victim in doStealStep
  // 3. fire_savior: douse wildfire in doDouseStep
  // 4. near_drowning_survivor: escape deep water after drown_panic in updateBody
  // 5. master_craftsman: gainXP building skill reaching level >= 7
  // 6. master_farmer: gainXP farming skill reaching level >= 7
  // 7. village_protector: killAnimal repelling hostile wolf
  // -------------------------------------------------------------------

  // 1. pips_mother
  const tMarta2 = mk('T26_Marta_Birth', 0, 0, { role: 'Village Farmer' });
  tMarta2.identity = [];
  observe(tMarta2, { event: 'birth', child: 'Pip' }, {
    topic: 'birth_Pip',
    salience: 0.95,
    source: 'direct'
  });
  const tagPipsMother = tMarta2.identity.some(id => id.tag === IDENTITY_TAGS.PIPS_MOTHER);

  // 2. betrayed (theft victim in real doStealStep)
  const tThief = mk('T26_Thief', 5, 5, { role: 'Villager' });
  const tVictim = mk('T26_Victim', 5.2, 5, { role: 'Villager' });
  tVictim.identity = [];
  const stolenItem = (typeof mintIdentifiedItem === 'function')
    ? mintIdentifiedItem('plank', { creator: tVictim.name, holder: tVictim.name, x: tVictim.x, y: tVictim.y })
    : { id: 'test_stolen_plank', label: 'carved plank', currentHolder: tVictim.name, holderType: 'villager', status: 'held', actualOwner: tVictim.name };
  if(typeof ITEMS !== 'undefined') ITEMS[stolenItem.id] = stolenItem;
  doStealStep(tThief, { itemId: stolenItem.id, from: tVictim.name }, 0.1);
  const tagBetrayed = tVictim.identity.some(id => id.tag === IDENTITY_TAGS.BETRAYED);

  // 3. fire_savior (wildfire doused in real doDouseStep)
  const tFirefighter = mk('T26_Firefighter', 15, 15, { role: 'Villager' });
  tFirefighter.identity = [];
  tFirefighter.wetBucket = true;
  const burnCell = { wx: 15, wy: 15 };
  if(typeof BURNING !== 'undefined' && Array.isArray(BURNING)){
    BURNING.push(burnCell);
  }
  const dStep = { verb: 'douse', fire: burnCell, prog: 0.45 };
  doDouseStep(tFirefighter, dStep, 0.1); // prog reaches 0.55 >= 0.5 -> extinguished & observed
  const tagFireSavior = tFirefighter.identity.some(id => id.tag === IDENTITY_TAGS.FIRE_SAVIOR);

  // 4. near_drowning_survivor (escaping drown_panic in real updateBody)
  const tDrowner = mk('T26_Drowner', 0, 0, { role: 'Villager' });
  tDrowner.canSwim = false;
  tDrowner.state = 'drown_panic';
  tDrowner.body.oxygen = 0.3;
  tDrowner.identity = [];
  // Move to dry land tile (x: 0, y: 0) and run bodyTick -> transitions out of deep water and observes survival
  tDrowner.x = 0; tDrowner.y = 0;
  bodyTick(tDrowner, 0.05);
  const tagNearDrowning = tDrowner.identity.some(id => id.tag === IDENTITY_TAGS.NEAR_DROWNING_SURVIVOR);

  // 5. master_craftsman (building skill reaches Master level 7 via gainXP)
  const tCrafter = mk('T26_Crafter', 0, 0, { role: 'Villager' });
  tCrafter.identity = [];
  gainXP(tCrafter, 'building', 700);
  const tagMasterCraftsman = tCrafter.identity.some(id => id.tag === IDENTITY_TAGS.MASTER_CRAFTSMAN);

  // 6. master_farmer (farming skill reaches Master level 7 via gainXP)
  const tFarmer = mk('T26_Farmer', 0, 0, { role: 'Village Farmer' });
  tFarmer.identity = [];
  gainXP(tFarmer, 'farming', 700);
  const tagMasterFarmer = tFarmer.identity.some(id => id.tag === IDENTITY_TAGS.MASTER_FARMER);

  // 7. village_protector (repelling wolf threat via real killAnimal)
  const tProtector = mk('T26_Protector', 0, 0, { role: 'Villager' });
  tProtector.identity = [];
  const testWolf = { kind: 'wolf', x: 10, y: 10, hp: 10, maxhp: 10, dead: false };
  if(typeof ANIMALS !== 'undefined' && Array.isArray(ANIMALS)){
    ANIMALS.push(testWolf);
  }
  killAnimal(testWolf, tProtector);
  const tagVillageProtector = tProtector.identity.some(id => id.tag === IDENTITY_TAGS.VILLAGE_PROTECTOR);

  if(typeof ITEMS !== 'undefined' && stolenItem && stolenItem.id){
    delete ITEMS[stolenItem.id];
  }

  const all7TagsFormed = tagPipsMother && tagBetrayed && tagFireSavior && tagNearDrowning &&
                         tagMasterCraftsman && tagMasterFarmer && tagVillageProtector;

  log(all7TagsFormed, 'identityTags26: all 7/7 identity tags form end-to-end via real gameplay paths (zero manual formIdentityTag)',
    `mother=${tagPipsMother} betrayed=${tagBetrayed} fire=${tagFireSavior} drown=${tagNearDrowning} craft=${tagMasterCraftsman} farm=${tagMasterFarmer} protector=${tagVillageProtector}`);

  // -------------------------------------------------------------------
  // 26.9 (Cleanup): Verify no test entities leaked
  // -------------------------------------------------------------------
  cleanup();
  const leakedV = VILLAGERS.filter(v => v && v.name && v.name.startsWith('T26_'));
  const ok26_9 = leakedV.length === 0;
  log(ok26_9, 'cleanup26: part26 cleans up all test villagers cleanly', `leaked=${leakedV.length}`);

  el.textContent += `part26 done ==== ${res.filter(r => r.ok).length}/${res.length} passed ====\n`;
};
