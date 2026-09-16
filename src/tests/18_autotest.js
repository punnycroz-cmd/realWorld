/* =====================================================================
   PART 18 AUTOTEST — Phase 2C: Utility AI
   Automated verification of utility scoring, need deficits, personality
   weights, distance costs, risk modifiers, opportunity bonuses,
   deterministic tie-breaking, failure-to-thought-to-reevaluation chain,
   and __aiBridge interface integrity.
   ===================================================================== */
function mkTestV18(name, wx, wy, extra){
  const v = mkTestV15(name, wx, wy, extra);
  v.personality = {};
  v.traits = [];
  v.unreachable = {};
  return v;
}

const __runAutoTest18 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest18();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };

  // 18.1 Starving villager scores eat above work
  let t1 = mkTestV18('TStarve', 0, 0);
  ensureBody(t1).satiety = 0.05; // starving
  ensureBody(t1).fatigue = 0.2;
  ensureBody(t1).hydration = 0.9;
  t1.personality = { industrious: 1.5 }; // even for industrious villager
  const ch1 = evaluateVillagerUtility(t1);
  const eatCandidate = ch1.candidates.find(c => c.id.startsWith('eat'));
  const workCandidate = ch1.candidates.find(c => c.category === 'work');
  const eatAboveWork = eatCandidate && workCandidate && eatCandidate.score > workCandidate.score;
  const bestIsEat = ch1.bestAction && ch1.bestAction.id.startsWith('eat');
  log(eatAboveWork && bestIsEat,
    'utility18: starving villager scores eat above work',
    'eatScore=' + (eatCandidate && eatCandidate.score.toFixed(1)) + ' workScore=' + (workCandidate && workCandidate.score.toFixed(1)));
  rmTestV13(t1);

  // 18.2 Exhausted villager chooses sleep
  let t2 = mkTestV18('TExhaust', 0, 0);
  ensureBody(t2).satiety = 0.85;
  ensureBody(t2).hydration = 0.85;
  ensureBody(t2).fatigue = 0.95; // exhausted
  const ch2 = evaluateVillagerUtility(t2);
  const bestIsSleep = ch2.bestAction && ch2.bestAction.id === 'sleep';
  log(bestIsSleep,
    'utility18: exhausted villager chooses sleep',
    'best=' + (ch2.bestAction && ch2.bestAction.id) + ' score=' + (ch2.bestAction && ch2.bestAction.score.toFixed(1)));
  rmTestV13(t2);

  // 18.3 Beast nearby makes flee outscore foraging
  let t3 = mkTestV18('TFlee', 5, 5);
  const wolf = spawnAnimal('wolf', 7 * CS + 16, 5 * CS + 16); // 2 cells away
  wolf.state = 'hunt'; // hostile state triggers flee (passive wander/eat does not)
  const ch3 = evaluateVillagerUtility(t3);
  const fleeCand = ch3.candidates.find(c => c.id === 'flee');
  const forageCand = ch3.candidates.find(c => c.id === 'work_forage');
  const fleeWins = fleeCand && forageCand && fleeCand.score > forageCand.score;
  const bestIsFlee = ch3.bestAction && ch3.bestAction.id === 'flee';
  { const idx = ANIMALS.indexOf(wolf); if(idx >= 0) ANIMALS.splice(idx, 1); }
  log(fleeWins && bestIsFlee,
    'utility18: beast nearby makes flee outscore foraging',
    'fleeScore=' + (fleeCand && fleeCand.score.toFixed(1)) + ' forageScore=' + (forageCand && forageCand.score.toFixed(1)));
  rmTestV13(t3);

  // 18.4 Personality (industrious vs lazy) changes work/leisure ranking for identical needs
  let tInd = mkTestV18('TInd', 0, 0);
  let tLazy = mkTestV18('TLazy', 0, 0);
  // Identical needs
  ensureBody(tInd).satiety = 0.8; ensureBody(tInd).hydration = 0.8; ensureBody(tInd).fatigue = 0.2;
  ensureBody(tLazy).satiety = 0.8; ensureBody(tLazy).hydration = 0.8; ensureBody(tLazy).fatigue = 0.2;
  tInd.traits = ['industrious']; tInd.personality = { industrious: 2.0 };
  tLazy.traits = ['lazy']; tLazy.personality = { lazy: 2.0 };
  const oldTod = W.tod;
  W.tod = 11.0; // midday
  const chInd = evaluateVillagerUtility(tInd);
  const chLazy = evaluateVillagerUtility(tLazy);
  W.tod = oldTod;
  const indWork = chInd.candidates.find(c => c.category === 'work');
  const indLeis = chInd.candidates.find(c => c.id === 'leisure' || c.id === 'rest');
  const lazyWork = chLazy.candidates.find(c => c.category === 'work');
  const lazyLeis = chLazy.candidates.find(c => c.id === 'leisure' || c.id === 'rest');
  const indPrefersWork = indWork && indLeis && indWork.score > indLeis.score;
  const lazyPrefersLeis = lazyWork && lazyLeis && lazyLeis.score > lazyWork.score;
  log(indPrefersWork && lazyPrefersLeis,
    'utility18: personality (industrious vs lazy) changes work/leisure ranking for identical needs',
    'ind(work=' + (indWork && indWork.score.toFixed(1)) + ', leis=' + (indLeis && indLeis.score.toFixed(1)) + ') ' +
    'lazy(work=' + (lazyWork && lazyWork.score.toFixed(1)) + ', leis=' + (lazyLeis && lazyLeis.score.toFixed(1)) + ')');
  rmTestV13(tInd); rmTestV13(tLazy);

  // 18.5 Unreachable food target -> thought recorded + re-evaluation picks alternative
  let t5 = mkTestV18('TUnreach', 0, 0);
  t5.brainControlled = false;
  ensureBody(t5).satiety = 0.05; // hungry
  const oldInnFood5 = FOOD_STOCK.inn;
  FOOD_STOCK.inn = 0; // ensure ground targets are evaluated
  const pClose = { x: 2 * CS + 16, y: 0 * CS + 16, wx: 2, wy: 0, items: { bread: 2 } };
  const pFar = { x: 5 * CS + 16, y: 0 * CS + 16, wx: 5, wy: 0, items: { bread: 2 } };
  PILES.push(pClose, pFar);
  const ch5_1 = evaluateVillagerUtility(t5);
  executeUtilityAction(t5, ch5_1.bestAction);
  const target1Key = ch5_1.bestAction ? ch5_1.bestAction.targetKey : null;
  // Simulate failure reaching target 1
  handleActionFailure(t5, ch5_1.bestAction, 'path blocked', target1Key);
  const hasThought = t5.thoughts && t5.thoughts.some(th => /reach|path|blocked/i.test(th.text));
  const hasKnowledge = t5.unreachable && !!t5.unreachable[target1Key];
  const ch5_2 = evaluateVillagerUtility(t5);
  const pickedFar = ch5_2.bestAction && ch5_2.bestAction.targetKey === ('pile_' + pFar.wx + '_' + pFar.wy);
  FOOD_STOCK.inn = oldInnFood5;
  {
    const i1 = PILES.indexOf(pClose); if(i1 >= 0) PILES.splice(i1, 1);
    const i2 = PILES.indexOf(pFar); if(i2 >= 0) PILES.splice(i2, 1);
  }
  log(hasThought && hasKnowledge && pickedFar,
    'utility18: unreachable food target -> thought recorded + re-evaluation picks alternative',
    'thought=' + (t5.thoughts[0] && t5.thoughts[0].text) + ' altTarget=' + (ch5_2.bestAction && ch5_2.bestAction.targetKey));
  rmTestV13(t5);

  // 18.6 Determinism: same seed + same state -> same choice twice
  let t6a = mkTestV18('TDetA', 1, 1);
  let t6b = mkTestV18('TDetB', 1, 1);
  t6b.name = t6a.name; // match name so hash is identical
  ensureBody(t6a).satiety = 0.4; ensureBody(t6a).hydration = 0.4; ensureBody(t6a).fatigue = 0.4;
  ensureBody(t6b).satiety = 0.4; ensureBody(t6b).hydration = 0.4; ensureBody(t6b).fatigue = 0.4;
  const eval1 = evaluateVillagerUtility(t6a);
  const eval2 = evaluateVillagerUtility(t6b);
  const sameBest = eval1.bestAction && eval2.bestAction && eval1.bestAction.id === eval2.bestAction.id &&
                   eval1.bestAction.score.toFixed(4) === eval2.bestAction.score.toFixed(4);
  const sameCount = eval1.candidates.length === eval2.candidates.length;
  let allMatch = sameBest && sameCount;
  if(allMatch){
    for(let i = 0; i < eval1.candidates.length; i++){
      if(eval1.candidates[i].id !== eval2.candidates[i].id ||
         eval1.candidates[i].score.toFixed(4) !== eval2.candidates[i].score.toFixed(4)){
        allMatch = false; break;
      }
    }
  }
  log(allMatch, 'utility18: determinism — same seed + same state -> same choice twice',
    'winner=' + (eval1.bestAction && eval1.bestAction.id) + ' score=' + (eval1.bestAction && eval1.bestAction.score.toFixed(3)));
  rmTestV13(t6a); rmTestV13(t6b);

  // 18.7 __aiBridge contract stays intact
  const brList = window.__aiBridge.listVillagers();
  const brPerc = window.__aiBridge.getPerception('Marta');
  const brGaps = window.__aiBridge.getCapabilityGaps();
  const brScores = typeof window.__aiBridge.getUtilityScores === 'function' ? window.__aiBridge.getUtilityScores('Marta') : null;
  const bridgeOk = Array.isArray(brList) && brList.length > 0 &&
                   brPerc && typeof brPerc.name === 'string' &&
                   Array.isArray(brGaps) &&
                   Array.isArray(brScores) && brScores.length > 0;
  log(bridgeOk, 'utility18: __aiBridge contract stays intact with utility inspection',
    'villagers=' + brList.length + ' perception=' + (brPerc && brPerc.name) + ' scores=' + (brScores && brScores.length));

  // 18.8 survivalGuard still fires when utility misses a critical need
  let t8 = mkTestV18('TSGGuard', 0, 0);
  ensureBody(t8).hydration = 0.08; // Critical dehydration below guard threshold (0.12)
  survivalGuard(t8);
  const sgFired = t8.plan.length > 0 && t8.plan[0].guard === true &&
                  t8.plan[0].verb === 'go' && t8.plan[0].place === 'well';
  log(sgFired, 'utility18: survivalGuard still fires when utility somehow misses a critical need',
    'guardPlan=' + (t8.plan[0] && t8.plan[0].verb) + ' guard=' + (t8.plan[0] && t8.plan[0].guard));
  rmTestV13(t8);

  // 18.9 Opportunity bonus: caravan in town elevates trade utility; inn meal elevates eat at inn
  let t9 = mkTestV18('TOpp', 2, 2);
  const oldInTown = typeof CARAVAN !== 'undefined' && CARAVAN ? CARAVAN.inTown : false;
  if(typeof CARAVAN !== 'undefined' && CARAVAN) CARAVAN.inTown = true;
  const ch9Caravan = evaluateVillagerUtility(t9);
  const tradeCand = ch9Caravan.candidates.find(c => c.id === 'trade_caravan');
  if(typeof CARAVAN !== 'undefined' && CARAVAN) CARAVAN.inTown = false;
  const ch9NoCaravan = evaluateVillagerUtility(t9);
  const tradeCandNo = ch9NoCaravan.candidates.find(c => c.id === 'trade_caravan');
  if(typeof CARAVAN !== 'undefined' && CARAVAN) CARAVAN.inTown = oldInTown;
  const caravanBonusOk = tradeCand && tradeCand.score > 20 && !tradeCandNo;
  // Inn meal opportunity
  ensureBody(t9).satiety = 0.4;
  const oldInnFood = FOOD_STOCK.inn;
  FOOD_STOCK.inn = 5;
  const ch9Inn = evaluateVillagerUtility(t9);
  const eatInnCand = ch9Inn.candidates.find(c => c.id === 'eat_inn');
  FOOD_STOCK.inn = 0;
  const ch9NoInn = evaluateVillagerUtility(t9);
  const eatNoInnCand = ch9NoInn.candidates.find(c => c.id === 'eat_inn');
  FOOD_STOCK.inn = oldInnFood;
  const innBonusOk = eatInnCand && !eatNoInnCand;
  log(caravanBonusOk && innBonusOk,
    'utility18: opportunity bonus elevates trade when caravan in town, inn eating when meal available',
    'tradeScore=' + (tradeCand && tradeCand.score.toFixed(1)) + ' innEat=' + !!eatInnCand);
  rmTestV13(t9);

  // 18.10 Distance / proximity cost: closer food target scores higher than distant target
  let t10 = mkTestV18('TProx', 0, 0);
  ensureBody(t10).satiety = 0.3;
  const pNear = { x: 3 * CS + 16, y: 0 * CS + 16, wx: 3, wy: 0, items: { bread: 2 } };
  const pDistant = { x: 25 * CS + 16, y: 0 * CS + 16, wx: 25, wy: 0, items: { bread: 2 } };
  PILES.push(pNear, pDistant);
  const ch10 = evaluateVillagerUtility(t10);
  const cNear = ch10.candidates.find(c => c.id === ('eat_pile_' + pNear.wx + '_' + pNear.wy));
  const cDistant = ch10.candidates.find(c => c.id === ('eat_pile_' + pDistant.wx + '_' + pDistant.wy));
  const proxOk = cNear && cDistant && cNear.score > cDistant.score;
  {
    const i1 = PILES.indexOf(pNear); if(i1 >= 0) PILES.splice(i1, 1);
    const i2 = PILES.indexOf(pDistant); if(i2 >= 0) PILES.splice(i2, 1);
  }
  log(proxOk, 'utility18: proximity cost — closer food target outscores distant food target',
    'nearScore=' + (cNear && cNear.score.toFixed(1)) + ' distantScore=' + (cDistant && cDistant.score.toFixed(1)));
  rmTestV13(t10);

  // 18.11 Cleanliness deficit: dirty building triggers clean candidate action
  let t11 = mkTestV18('TClean', 7, 9);
  const innForClean = VILLAGE_BUILDINGS.find(b => b.id === 'inn');
  const oldClean = innForClean ? innForClean.cleanliness : 1.0;
  if(innForClean) innForClean.cleanliness = 0.4;
  t11.traits = ['industrious']; t11.personality = { industrious: 1.5 };
  const ch11Dirty = evaluateVillagerUtility(t11);
  const cleanCand = ch11Dirty.candidates.find(c => c.id === 'clean_inn');
  if(innForClean) innForClean.cleanliness = 1.0;
  const ch11Clean = evaluateVillagerUtility(t11);
  const cleanCandClean = ch11Clean.candidates.find(c => c.id === 'clean_inn');
  if(innForClean) innForClean.cleanliness = oldClean;
  const cleanOk = cleanCand && cleanCand.score > 15 && !cleanCandClean;
  log(cleanOk, 'utility18: cleanliness deficit triggers clean action; clean building does not',
    'dirtyCleanScore=' + (cleanCand && cleanCand.score.toFixed(1)) + ' cleanPresent=' + !!cleanCandClean);
  rmTestV13(t11);

  // 18.12 Social deficit: isolated villager generates elevated chat utility
  let t12a = mkTestV18('TSocA', 1, 1);
  let t12b = mkTestV18('TSocB', 2, 1);
  t12a.chatT = 20.0; // isolated for 20 hours
  const ch12Isolated = evaluateVillagerUtility(t12a);
  const socCandIso = ch12Isolated.candidates.find(c => c.id === 'socialize_TSocB');
  t12a.chatT = 0.0; // just chatted
  const ch12Fresh = evaluateVillagerUtility(t12a);
  const socCandFresh = ch12Fresh.candidates.find(c => c.id === 'socialize_TSocB');
  const socOk = socCandIso && socCandFresh && socCandIso.score > socCandFresh.score;
  log(socOk, 'utility18: social deficit elevates chat utility when isolated',
    'isolatedScore=' + (socCandIso && socCandIso.score.toFixed(1)) + ' freshScore=' + (socCandFresh && socCandFresh.score.toFixed(1)));
  rmTestV13(t12a); rmTestV13(t12b);

  // 18.13 REGRESSION (2C stale-thought ghost churn): a STALE failure thought from an
  // earlier, already-handled failure must NOT re-trigger failure handling on a fresh
  // valid plan. (Old wrapper read v.thoughts[0] unconditionally -> blacklisted the
  // current valid target and churned the plan every tick, forever, from one failure.)
  let t13 = mkTestV18('TStale', 0, 0);
  t13.brainControlled = true; // isolate planTick: no utility re-evaluation noise
  t13.unreachable = {};
  t13.thoughts = [{ text: 'Could not reach pile_2_0', val: -2 }]; // stale, already handled
  t13.plan = [{ verb: 'rest', hours: 2, targetKey: 'rest_spot' }]; // fresh valid plan
  const planRef13 = t13.plan;
  for(let i = 0; i < 5; i++) planTick(t13, 0.1);
  const noGhostBlacklist = !t13.unreachable['rest_spot'] && !t13.unreachable['pile_2_0'];
  const planSurvived = t13.plan === planRef13 && t13.plan.length === 1;
  const stepAdvanced = planSurvived && (t13.plan[0].t || 0) >= 0.49;
  log(noGhostBlacklist && planSurvived && stepAdvanced,
    'utility18: stale failure thought does not re-trigger failure handling (no ghost churn)',
    'planSurvived=' + planSurvived + ' blacklistedKeys=' + Object.keys(t13.unreachable).join(',') + ' stepT=' + (t13.plan[0] && (t13.plan[0].t || 0).toFixed(2)));
  rmTestV13(t13);

  const passed = res.filter(r => r.ok).length;
  el.textContent += '\n==== part18 ' + passed + '/' + res.length + ' passed ====\n';
  document.title = 'AUTOTEST ' + passed + '/' + res.length;
};
