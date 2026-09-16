/* =====================================================================
   PART 24 AUTOTEST — Phase 6A: Senses & Expectations ("Con người không hoàn hảo")
   Automated verification of:
     24.1 (Gate 2): Biological emergency (hunger >75%) creates tunnel vision:
                    non-food objects ignored (no memory created)
     24.2 (Gate 1): Sudden threat (hostile-only beast/wildfire) preemptive interrupt
                    and douse plan protection (docile wolf causes 0 wipes across 40 ticks)
     24.3 (Expectation): Bread price expectation violated by price shock
                         -> surprise event + disappointment emotion + re-plan flag
     24.4 (Stale Stash): Stash belief from 5 days ago found empty
                         -> surprise + superseded belief with preserved history
     24.5 (Determinism): Same seed & environment yields bit-identical attended set
     24.6 (Gate 3): Goal relevance: focused villager ignores task-irrelevant background stimuli
     24.7 (Boundary): Clean observe -> think -> learn pipeline with typed PerceptionDTO
     24.8 (Expectation Match): Matching price expectation reinforces confidence with zero overhead
     24.9 (B2 Expiry): Expectation from 10 sim days ago expires after tick (TTL=7d)
     24.10 (B3 Live Loop): Real gameplay take step at emptied stash triggers surprise on arrival without bypassAttention cheat
     24.11 (O4 Reorder): Failed purchases (out of stock) do not anchor expectations
     24.12 (Cleanup): No test villagers leaked
   ===================================================================== */
function mkTestV24(name, wx, wy, extra){
  const v = mkTestV22(name, wx, wy, extra);
  ensureEpistemic(v);
  return v;
}

const __runAutoTest24 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest24();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: Boolean(ok), title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const madeNames = [];
  function mk(name, wx, wy, extra){
    const v = mkTestV24(name, wx, wy, extra);
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
  // 24.1 (Cổng 2): villager đói 80% + vật thể không ăn được trong tầm nhìn -> KHÔNG ghi memory
  // -------------------------------------------------------------------
  const t1 = mk('T24_Gate2_Starve', 10, 10);
  const b1 = ensureBody(t1);
  b1.satiety = 0.20; // 80% hunger (>75% emergency threshold)

  // Non-edible stimulus (wooden chair) while starving
  const nonFoodMem = observe(t1, { kind: 'chair', name: 'carved oak chair' }, { source: 'direct', topic: 'chair_spot' });
  const hasChairMem = t1.epistemic.memories.some(m => m.topic === 'chair_spot' || (m.content && m.content.kind === 'chair'));

  // Edible stimulus (bread) under the same 80% hunger -> solves hunger, passes gate 2
  const foodMem = observe(t1, { kind: 'bread', foodKind: 'bread', name: 'warm bread' }, { source: 'direct', topic: 'bread_spot' });
  const hasBreadMem = t1.epistemic.memories.some(m => m.topic === 'bread_spot');

  // Discrimination: verify normal hunger (10%) DOES record the chair
  b1.satiety = 0.90;
  const normalMem = observe(t1, { kind: 'chair', name: 'carved oak chair' }, { source: 'direct', topic: 'chair_normal' });
  const hasNormalChairMem = t1.epistemic.memories.some(m => m.topic === 'chair_normal');

  const ok24_1 = (nonFoodMem === null) && (!hasChairMem) && (foodMem !== null) && hasBreadMem && (normalMem !== null) && hasNormalChairMem;
  log(ok24_1, 'attention24: gate 2 tunnel vision blocks non-food memory when hunger >75%',
    `nonFoodMem=${nonFoodMem == null ? 'null' : 'recorded'} foodMem=${foodMem ? 'recorded' : 'null'} normalMem=${normalMem ? 'recorded' : 'null'}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.2 (Cổng 1): lửa/sói hostile -> interrupt flag được đặt, re-plan trigger
  // Probe-style check: docile wolf causes NO wipe/interrupt across 40 ticks,
  // travel matches control; hostile wolf interrupts; douse plan preserved.
  // -------------------------------------------------------------------
  const t2 = mk('T24_Gate1_Threat', 10, 10);
  t2.plan = [{ verb: 'farm', tx: 200, ty: 200 }];
  t2.interrupted = false;
  t2.replanNeeded = false;

  // Hostile wolf appears -> triggers Gate 1
  const threatResult = filterAttention(t2, { kind: 'wolf', threat: 'wolf', hostile: true });
  const interruptFlagSet = t2.interrupted === true && t2.replanNeeded === true;
  const planPreempted = t2.plan.length === 0;

  // Wildfire appearance also triggers Gate 1
  const t2Fire = mk('T24_Gate1_Fire', 12, 10);
  t2Fire.plan = [{ verb: 'cook', tx: 200, ty: 200 }];
  filterAttention(t2Fire, { kind: 'wildfire', isFire: true });
  const fireInterrupted = t2Fire.interrupted === true && t2Fire.plan.length === 0;

  // Probe: docile wolf in view causes no wipe/interrupt across 40 ticks,
  // travel matches control; hostile wolf interrupts; douse plan preserved.
  const wy = 0;
  const y = wy * CS + 16;
  const startX = 2 * CS + 16;
  const targetX = 14 * CS + 16;
  const dtWalk = 8 / (85 * 60);

  // Control: villager walks with no animal nearby along open boulevard
  const vCtrl = mk('T24_Ctrl_Walk', 2, wy);
  vCtrl.x = startX; vCtrl.y = y;
  vCtrl.plan = [{ verb: 'go', tx: targetX, ty: y }];
  let ctrlWipes = 0;
  for(let i = 0; i < 40; i++){
    updateVillagerAI(vCtrl, dtWalk);
    if(!vCtrl.plan || vCtrl.plan.length === 0) ctrlWipes++;
  }
  const ctrlDist = (vCtrl.x - startX) / CS;

  // Test: villager walks with docile wandering wolf in view (11 tiles away, sightRange=14, > survivalGuard 10)
  const vWolf = mk('T24_Docile_Walk', 2, wy);
  vWolf.x = startX; vWolf.y = y;
  vWolf.plan = [{ verb: 'go', tx: targetX, ty: y }];
  const docileWolf = { kind: 'wolf', state: 'wander', x: startX, y: y + 11 * CS, dead: false };
  ANIMALS.push(docileWolf);

  let docileWipes = 0;
  let docileInterrupts = 0;
  for(let i = 0; i < 40; i++){
    docileWolf.x = vWolf.x;
    docileWolf.y = vWolf.y + 11 * CS;
    updateVillagerAI(vWolf, dtWalk);
    if(vWolf.interrupted) docileInterrupts++;
    if(!vWolf.plan || vWolf.plan.length === 0) docileWipes++;
  }
  const wolfDist = (vWolf.x - startX) / CS;

  // Hostile wolf switch: wolf turns hostile and approaches (8 tiles away)
  docileWolf.state = 'attack';
  docileWolf.x = vWolf.x + 8 * CS;
  docileWolf.y = vWolf.y;
  vWolf.interrupted = false;
  vWolf.replanNeeded = false;
  vWolf.replanTriggered = false;
  vWolf.plan = [{ verb: 'farm', tx: vWolf.x + 10, ty: vWolf.y }];
  updateVillagerAI(vWolf, dtWalk);
  const hostileWolfInterrupted = (vWolf.replanTriggered === true || vWolf.interrupted === true || vWolf.replanNeeded === true ||
    (vWolf.plan && vWolf.plan.length > 0 && vWolf.plan[0].flee === true) ||
    (vWolf.thoughts && vWolf.thoughts.some(t => t.text.includes('Fleeing'))));

  // Campfire check: normal campfire does not trigger Gate 1 interrupt
  const vCamp = mk('T24_Campfire_Check', 10, 10);
  vCamp.plan = [{ verb: 'farm', tx: 500, ty: 500 }];
  vCamp.interrupted = false;
  const campAtt = filterAttention(vCamp, { kind: 'fire', campfire: true });
  const campfireNoInterrupt = campAtt.preemptive !== true && vCamp.plan.length > 0;

  // Firefighter douse plan check: active douse plan is not wiped by wildfire
  const vDouse = mk('T24_Douse_Check', 10, 10);
  vDouse.plan = [{ verb: 'douse', tx: 300, ty: 300 }];
  vDouse.interrupted = false;
  const douseAtt = filterAttention(vDouse, { kind: 'wildfire', isFire: true });
  const dousePlanPreserved = vDouse.plan.length > 0 && vDouse.plan[0].verb === 'douse' && !vDouse.interrupted;

  // Clean up added animal
  const wIdx = ANIMALS.indexOf(docileWolf);
  if(wIdx >= 0) ANIMALS.splice(wIdx, 1);

  const probeDocileOk = (docileWipes === 0) && (docileInterrupts === 0) && (Math.abs(wolfDist - ctrlDist) < 0.05);
  const ok24_2 = threatResult.attended && threatResult.preemptive && interruptFlagSet && planPreempted && fireInterrupted &&
                 probeDocileOk && hostileWolfInterrupted && campfireNoInterrupt && dousePlanPreserved;
  log(ok24_2, 'attention24: gate 1 hostile-only beast and wildfire threat (docile wolf 0/40 wipes, travel matches control, hostile interrupts, douse preserved)',
    `wolfInterrupt=${interruptFlagSet} fireInterrupt=${fireInterrupted} docileWipes=${docileWipes}/40 distRatio=${(wolfDist/ctrlDist).toFixed(2)} hostile=${hostileWolfInterrupted} douseOk=${dousePlanPreserved}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.3 (Expectation): đặt expectation giá bánh mì -> tăng giá sốc -> surprise event + emotion + re-plan flag
  // -------------------------------------------------------------------
  const t3 = mk('T24_Expect_Price', 10, 10);
  t3.gold = 50;
  const shopPos = placePos('shop') || { x: 10 * CS, y: 10 * CS };
  t3.x = shopPos.x; t3.y = shopPos.y;

  setExpectation(t3, { subject: 'bread', attribute: 'price', predictedValue: 3, confidence: 0.9, source: 'habit' });
  const origShopPrice = SHOP.buyPrice.bread;
  SHOP.buyPrice.bread = 15; // Price shock: from 3g to 15g

  const buyStep = { verb: 'buy', what: 'bread' };
  doBuyStep(t3, buyStep, 0.1);

  const surpriseRecorded = t3.lastSurprise && t3.lastSurprise.surprise > 0;
  const expectedSurprise = +(Math.abs(15 - 3) * 0.9).toFixed(2); // 10.8
  const surpriseValueOk = surpriseRecorded && Math.abs(t3.lastSurprise.surprise - expectedSurprise) < 0.05;
  const emotionRecorded = t3.emotions && t3.emotions.some(e => e.tag === 'disappointed');
  const replanFlagSet = t3.replanNeeded === true;
  const purchaseCanceled = t3.gold === 50 && (t3.inv.bread || 0) === 0;

  SHOP.buyPrice.bread = origShopPrice; // Restore shop price

  const ok24_3 = surpriseRecorded && surpriseValueOk && emotionRecorded && replanFlagSet && purchaseCanceled;
  log(ok24_3, 'expectation24: bread price shock triggers surprise event, disappointment emotion, and replan flag',
    `surprise=${t3.lastSurprise && t3.lastSurprise.surprise} (want ${expectedSurprise}) emotion=${emotionRecorded} replan=${replanFlagSet} goldPreserved=${purchaseCanceled}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.4 (Stale Stash): belief vị trí đồ 5 ngày trước -> đến nơi trống -> surprise + belief superseded có lịch sử
  // -------------------------------------------------------------------
  const t4 = mk('T24_Stale_Stash', 10, 10);
  const nowDay = (typeof W !== 'undefined' && W.day != null) ? W.day : 10;
  const learnedDay = nowDay - 5;

  const oldMem = observe(t4, { kind: 'stash', wx: 25, wy: 15, items: { bread: 3 } }, {
    topic: 'stash_hidden_grove',
    when: learnedDay,
    confidence: 0.85,
    source: 'direct',
    bypassAttention: true
  });
  setExpectation(t4, {
    subject: 'stash_hidden_grove',
    attribute: 'location',
    predictedValue: { wx: 25, wy: 15 },
    confidence: 0.85,
    learnedTick: learnedDay,
    source: 'direct'
  });

  const bBefore = getBelief(t4, 'stash_hidden_grove');
  const initialBeliefValid = bBefore && !bBefore.superseded;

  // Stash is checked at location and found empty/missing
  const stashRes = checkStashExpectation(t4, 'stash_hidden_grove', null);

  const bAfter = getBelief(t4, 'stash_hidden_grove');
  const oldMemInHistory = t4.epistemic.memories.find(m => m.id === oldMem.id);
  const oldBeliefSuperseded = oldMemInHistory && oldMemInHistory.superseded === true && oldMemInHistory.supersededBy != null;
  const newBeliefActive = bAfter && bAfter.content && (bAfter.content.status === 'missing' || bAfter.content.empty === true);
  const stashSurpriseOk = stashRes && !stashRes.match && stashRes.surprise > 0;
  const emotionOk = stashRes && (stashRes.emotion === 'confused' || stashRes.emotion === 'disappointed');

  const ok24_4 = initialBeliefValid && stashSurpriseOk && emotionOk && oldBeliefSuperseded && newBeliefActive;
  log(ok24_4, 'expectation24: stale stash belief 5 days ago found empty triggers surprise and supersedes with history',
    `initialOk=${initialBeliefValid} surprise=${stashRes && stashRes.surprise} superseded=${oldBeliefSuperseded} histMemId=${oldMemInHistory && oldMemInHistory.supersededBy}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.5 (Determinism): cùng seed -> cùng attended set
  // -------------------------------------------------------------------
  const t5A = mk('T24_DetA', 10, 10);
  const t5B = mk('T24_DetB', 10, 10);

  t5A.x = 160; t5A.y = 160;
  t5B.x = 160; t5B.y = 160;
  ensureBody(t5A).satiety = 0.8; ensureBody(t5B).satiety = 0.8;

  const scanA1 = perceiveSurroundings(t5A, 777);
  const scanA2 = perceiveSurroundings(t5A, 777);
  const scanB = perceiveSurroundings(t5B, 777);

  const listA1 = scanA1.attended.map(s => s.id || s.kind).join(',');
  const listA2 = scanA2.attended.map(s => s.id || s.kind).join(',');
  const listB = scanB.attended.map(s => s.id || s.kind).join(',');

  const selfDetOk = (listA1 === listA2);
  const crossDetOk = (listA1 === listB);

  const ok24_5 = selfDetOk && crossDetOk;
  log(ok24_5, 'attention24: deterministic attention set: same seed yields bit-identical attended stimuli',
    `count=${scanA1.attended.length} match=${selfDetOk && crossDetOk}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.6 (Cổng 3): Goal relevance — villager on task only attends relevant objects
  // -------------------------------------------------------------------
  const t6 = mk('T24_Gate3_Goal', 10, 10);
  t6.plan = [{ verb: 'fell', target: 'tree', what: 'tree' }];

  const treeAtt = filterAttention(t6, { kind: 'tree', what: 'tree' });
  const benchAtt = filterAttention(t6, { kind: 'bench', what: 'wooden bench' });

  // When idle, bench IS attended
  t6.plan = [];
  const benchIdleAtt = filterAttention(t6, { kind: 'bench', what: 'wooden bench' });

  const ok24_6 = treeAtt.attended === true && benchAtt.attended === false && benchIdleAtt.attended === true;
  log(ok24_6, 'attention24: gate 3 top-down relevance filters task-irrelevant background stimuli during active plan',
    `tree=${treeAtt.attended} benchInTask=${benchAtt.attended} benchIdle=${benchIdleAtt.attended}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.7 (Boundary): Clean observe -> think -> learn pipeline with typed PerceptionDTO
  // -------------------------------------------------------------------
  const t7 = mk('T24_Boundary', 10, 10);
  const pDto = brainObserve(t7, 0.1);
  const isDtoInstance = pDto instanceof PerceptionDTO;
  const dtoHasKeys = Array.isArray(pDto.attended) && Array.isArray(pDto.ignored) && Array.isArray(pDto.threats);
  const thinkRes = brainThink(t7, 0.1, pDto);
  const learnRes = brainLearn(t7, 0.1, thinkRes);

  const ok24_7 = isDtoInstance && dtoHasKeys && thinkRes != null && learnRes != null;
  log(ok24_7, 'boundary24: brain boundary observe -> think -> learn produces typed PerceptionDTO',
    `isDTO=${isDtoInstance} attended=${pDto.attended.length} ignored=${pDto.ignored.length}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.8 (Expectation Match): matching expectation increases confidence with 0 overhead
  // -------------------------------------------------------------------
  const t8 = mk('T24_Expect_Match', 10, 10);
  setExpectation(t8, { subject: 'bread', attribute: 'price', predictedValue: 3, confidence: 0.8 });
  const matchRes = checkPriceExpectation(t8, 'bread', 3);
  const expAfter = getExpectation(t8, 'bread', 'price');
  const confIncreased = expAfter && expAfter.confidence > 0.8;
  const zeroSurprise = matchRes.match === true && matchRes.surprise === 0;

  const ok24_8 = zeroSurprise && confIncreased && !t8.replanNeeded;
  log(ok24_8, 'expectation24: matching perception increases confidence with 0 overhead and no replan',
    `match=${matchRes.match} newConf=${expAfter && expAfter.confidence} replan=${t8.replanNeeded}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.9 (B2 Expiry): Stale expectation from 10 sim days ago expires after tick (TTL=7d)
  // -------------------------------------------------------------------
  const t9 = mk('T24_Expect_Expiry', 10, 10);
  const curDay = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0)/24) : 10;

  // Stale expectation from 10 sim days ago (> EXPECTATION_TTL_DAYS)
  setExpectation(t9, {
    subject: 'bread',
    attribute: 'price',
    predictedValue: 3,
    confidence: 0.8,
    learnedTick: curDay - 10,
    source: 'habit'
  });

  // Fresh expectation from 1 sim day ago (< EXPECTATION_TTL_DAYS)
  setExpectation(t9, {
    subject: 'ale',
    attribute: 'price',
    predictedValue: 2,
    confidence: 0.8,
    learnedTick: curDay - 1,
    source: 'habit'
  });

  // Run epistemic tick
  epistemicTick(t9, 1.0);

  const staleExp = getExpectation(t9, 'bread', 'price');
  const freshExp = getExpectation(t9, 'ale', 'price');

  const staleExpired = staleExp === null || staleExp.confidence === 0 || staleExp.expired === true;
  const freshRetained = freshExp !== null && freshExp.confidence > 0.5;

  const ok24_9 = staleExpired && freshRetained;
  log(ok24_9, 'expectation24: expectation with learnedTick 10 days ago expires after tick (TTL=7d)',
    `staleExpired=${staleExpired} freshRetained=${freshRetained}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.10 (B3 Live Loop): Real gameplay take step at emptied stash triggers surprise on arrival without bypassAttention
  // -------------------------------------------------------------------
  const t10 = mk('T24_Stash_LiveLoop', 10, 10);
  t10.x = 10 * CS; t10.y = 10 * CS;
  t10.plan = []; // Idle -> passes Gate 3 top-down relevance without bypassAttention cheat!

  // 1. Stash exists with bread
  const stashX = 11 * CS + 16, stashY = 10 * CS + 16;
  const testPile = dropPileAt(stashX, stashY, 'bread', 3);

  // 2. Villager observes stash normally (NO bypassAttention: true)
  const stashObs = observe(t10, {
    kind: 'stash',
    wx: 11, wy: 10,
    items: { bread: 3 }
  }, {
    topic: 'stash_apple_grove',
    source: 'direct'
    // NO bypassAttention: true — passes through attention filter!
  });

  const observedOk = stashObs !== null;
  const expBefore = getExpectation(t10, 'stash_apple_grove', 'location');
  const expAnchored = expBefore !== null && expBefore.confidence > 0;

  // 3. Stash empties while villager is away
  testPile.items.bread = 0;
  cleanPile(testPile);

  // 4. Villager executes take step at remembered stash location
  t10.x = stashX; t10.y = stashY; // Villager arrives at the stash location
  const takeStep = { verb: 'take', what: 'bread', pile: testPile, stashKey: 'stash_apple_grove' };
  t10.plan = [takeStep];
  doTakeStep(t10, takeStep, 0.1);

  // 5. Expectation check on arrival must record surprise
  const surpriseFired = t10.lastSurprise != null && t10.lastSurprise.surprise > 0;
  const emotionFired = t10.emotions && t10.emotions.some(e => e.tag === 'confused');
  const replanFired = t10.replanNeeded === true;
  const beliefSuperseded = t10.epistemic.memories.some(m => m.topic === 'stash_apple_grove' && m.superseded === true);

  // Clean up pile if any remains
  const pIdx = PILES.indexOf(testPile);
  if(pIdx >= 0) PILES.splice(pIdx, 1);

  const ok24_10 = observedOk && expAnchored && surpriseFired && emotionFired && replanFired && beliefSuperseded;
  log(ok24_10, 'expectation24: real gameplay take step at emptied stash triggers surprise and replan without bypassAttention',
    `observed=${observedOk} expAnchored=${expAnchored} surprise=${t10.lastSurprise && t10.lastSurprise.surprise} emotion=${emotionFired} replan=${replanFired}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.11 (O4 Reorder): Failed purchases (out of stock) do not anchor expectations
  // -------------------------------------------------------------------
  const t11 = mk('T24_O4_Stock', 10, 10);
  t11.gold = 50;
  const shopPosO4 = placePos('shop') || { x: 10 * CS, y: 10 * CS };
  t11.x = shopPosO4.x; t11.y = shopPosO4.y;
  const origBreadStock = SHOP.stock.bread;
  SHOP.stock.bread = 0; // Out of stock
  doBuyStep(t11, { verb: 'buy', what: 'bread' }, 0.1);
  const breadExp = getExpectation(t11, 'bread', 'price');
  SHOP.stock.bread = origBreadStock;
  const ok24_11 = (breadExp === null) && t11.thoughts && t11.thoughts.some(th => th.text.includes('out of bread'));
  log(ok24_11, 'expectation24: failed purchase on out-of-stock item does not anchor expectation or overwrite thought',
    `breadExp=${breadExp == null ? 'null' : 'anchored'} thought=${t11.thoughts && t11.thoughts[0] && t11.thoughts[0].text}`);
  cleanup();

  // -------------------------------------------------------------------
  // 24.12 Cleanup check: no test villagers leaked
  // -------------------------------------------------------------------
  cleanup();
  const leaked24 = VILLAGERS.filter(o => o && o.name && o.name.startsWith('T24_'));
  const ok24_12 = leaked24.length === 0;
  log(ok24_12, 'cleanup24: part24 cleans up all test villagers without leaking',
    leaked24.length === 0 ? '0 leaked' : leaked24.map(o => o.name).join(','));

  el.textContent += `part24 done ==== ${res.filter(r => r.ok).length}/${res.length} passed ====\n`;
};
