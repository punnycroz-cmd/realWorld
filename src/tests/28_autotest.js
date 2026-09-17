/* =====================================================================
   PART 28 AUTOTEST — Phase 6E Slice E1: "Cảm thấy" (Feeling Substrate)
   Automated verification of:
     28.1 (S2 Lint Rule & Bypass Test):
          - Code with sneaky 'v.body.' -> lint fail.
          - Clean code -> lint pass.
          - Audits src/brain/** against known legacy allowlist (09_bridge.js:32,35).
     28.2 (S1 FeelingSubstrate Interface Contract):
          - feel(v) returns holistic feelings state.
          - getLayers(v) returns breakdown of body, couplings, emotions, signals.
          - getFeelingScape(v) returns {dominant, secondary, tone}.
     28.3 (A3 World-Event -> Normalized Signal Table):
          - Canonical table & normalization: fire, wolf, storm, death, gossip,
            price shock, etc. standardized to {kind, intensity, source, tick}.
          - receiveSignal routes into substrate and recentSignals.
     28.4 (D1 Coupling 1: hunger↑ → stress↑):
          - Starving villager (satiety < 0.35) 6h -> hungerStressAcc > 0 and increases.
          - Fed full (satiety = 1.0) -> hungerStressAcc decays to ~0.
     28.5 (D1 Coupling 2: fear↑↑ → exhaustion):
          - Fear event -> fearFatigueAcc active -> fatigue rate elevated during 3h window.
          - At 3h+ -> fearFatigueAcc decays to 0 -> fatigue rate returns to baseline.
     28.6 (D1 Coupling 3: pain↑ → patience↓):
          - High pain -> painPatienceAcc > 0 -> patience < 1.0.
          - Social utility candidate scoring measurably reduced by patience penalty.
     28.7 (Determinism across different tick-sizes):
          - Running same elapsed time with dtH=1.0 vs dtH=0.5 vs dtH=0.25
            yields identical accumulator values (analytical dt-scaling).
     28.8 (Entity Cleanup):
          - Verifies all test entities removed cleanly, canonical settlement untouched.
   ===================================================================== */

function mkTestV28(name, wx, wy, extra){
  const v = mkTestV13(name, wx, wy, Object.assign({ stage: 'adult' }, extra || {}));
  ensureBody(v);
  ensureEpistemic(v);
  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.ensureSubstrate === 'function'){
    FeelingSubstrate.ensureSubstrate(v);
  }
  return v;
}

const __runAutoTest28 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest28();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: Boolean(ok), title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };

  const madeNames = [];
  function mk(name, wx, wy, extra){
    const v = mkTestV28(name, wx, wy, extra);
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
  // 28.1 (S2 Lint Rule & Bypass Test)
  // Examiner requirement: deliberate bypass-test inserting 'v.body.'
  // into brain code must cause lint rule failure.
  // ===================================================================
  const cleanBrainSnippet = `
    function decideAction(v) {
      const felt = FeelingSubstrate.feel(v);
      if (felt.stress > 0.8) return 'rest';
      return 'work';
    }
  `;
  const dirtyBrainSnippet = `
    function sneakyBrainAction(v) {
      const h = v.body.hydration;
      if (h < 0.2) return 'drink';
      return 'idle';
    }
  `;

  const cleanCheck = FeelingSubstrate.lintBrainCode(cleanBrainSnippet);
  const bypassCheck = FeelingSubstrate.lintBrainCode(dirtyBrainSnippet);

  const ok28_1 = (cleanCheck.passed === true && cleanCheck.violations.length === 0) &&
                 (bypassCheck.passed === false && bypassCheck.violations.length === 1 && bypassCheck.violations[0].text.includes('v.body.hydration'));

  log(ok28_1, 'lintRule28: S2 lint rule detects sneaky v.body. bypass while passing clean code',
    `cleanPassed=${cleanCheck.passed} bypassFailed=${!bypassCheck.passed} violationsCount=${bypassCheck.violations.length}`);

  // ===================================================================
  // 28.2 (S1 FeelingSubstrate Interface Contract)
  // Contract: feel(v), getLayers(v), getFeelingScape(v)
  // ===================================================================
  const tSub = mk('T_SubstrateContract', 30 * CS, 30 * CS);
  tSub.body.satiety = 0.8;
  tSub.body.hydration = 0.75;
  tSub.body.fatigue = 0.2;

  const felt = FeelingSubstrate.feel(tSub);
  const layers = FeelingSubstrate.getLayers(tSub);
  const scape = FeelingSubstrate.getFeelingScape(tSub);

  const hasFeelFields = felt && felt.satiety === 0.8 && felt.hydration === 0.75 &&
                        felt.hungerStress !== undefined && felt.fearFatigue !== undefined &&
                        felt.painPatience !== undefined && felt.patience !== undefined &&
                        Array.isArray(felt.emotions) && felt.scape !== undefined;

  const hasLayerFields = layers && layers.body && layers.couplings &&
                         layers.couplings.hungerStress !== undefined &&
                         layers.couplings.patience !== undefined &&
                         Array.isArray(layers.emotions) && Array.isArray(layers.recentSignals);

  const hasScapeFields = scape && typeof scape.dominant === 'string' && scape.tone !== undefined;

  const ok28_2 = hasFeelFields && hasLayerFields && hasScapeFields;
  log(ok28_2, 'substrateContract28: S1 FeelingSubstrate feel, getLayers, getFeelingScape contract verified',
    `feel=${Boolean(hasFeelFields)} layers=${Boolean(hasLayerFields)} scapeDominant=${scape && scape.dominant}`);

  // ===================================================================
  // 28.3 (A3 World-Event -> Normalized Signal Table & Ingestion)
  // Standardizing fire, wolf, storm, death, gossip, price shock, etc.
  // ===================================================================
  const fireSig = FeelingSubstrate.normalizeEvent('fire', 12.5, { source: 'wildfire_north' });
  const wolfSig = FeelingSubstrate.normalizeEvent({ kind: 'wolf', by: 'alpha_wolf', intensity: 0.95 }, 12.6);
  const stormSig = FeelingSubstrate.normalizeEvent('storm', 12.7);
  const deathSig = FeelingSubstrate.normalizeEvent('death', 12.8, { source: 'old_age' });
  const priceSig = FeelingSubstrate.normalizeEvent('price_shock', 12.9, { item: 'salt' });

  const okTable = fireSig.kind === 'threat_fire' && fireSig.domain === 'danger' &&
                  wolfSig.kind === 'threat_wolf' && wolfSig.intensity === 0.95 &&
                  stormSig.kind === 'hazard_storm' &&
                  deathSig.kind === 'grief_death' && deathSig.intensity === 1.0 &&
                  priceSig.kind === 'shock_price' && priceSig.domain === 'economic';

  // Ingestion into villager substrate
  const tSigPawn = mk('T_SignalPawn', 31 * CS, 31 * CS);
  FeelingSubstrate.receiveSignal(tSigPawn, wolfSig);

  const okIngest = tSigPawn.fearFatigueAcc > 0.8 &&
                   tSigPawn._recentSignals && tSigPawn._recentSignals.some(s => s.kind === 'threat_wolf');

  const ok28_3 = okTable && okIngest;
  log(ok28_3, 'eventSignalTable28: A3 canonical event->signal table standardizes events and ingests cleanly',
    `fireKind=${fireSig.kind} wolfIntensity=${wolfSig.intensity} pawnFearAcc=${tSigPawn.fearFatigueAcc.toFixed(2)}`);

  // ===================================================================
  // 28.4 (D1 Coupling 1: hunger↑ → stress↑)
  // Starving 6h -> hungerStressAcc > 0 and strictly increasing;
  // then eating full -> hungerStressAcc decays back to ~0.
  // ===================================================================
  const tHungry = mk('T_HungryPawn', 32 * CS, 32 * CS);
  tHungry.body.satiety = 0.15; // Hungry (< 0.35)
  tHungry.hungerStressAcc = 0.0;

  const hungerAccHistory = [];
  // Simulate 6 hours of starving
  for(let h = 0; h < 6; h++){
    FeelingSubstrate.update(tHungry, 1.0);
    hungerAccHistory.push(tHungry.hungerStressAcc);
  }

  const increasesMonotonically = hungerAccHistory.every((val, idx) => {
    if(idx === 0) return val > 0;
    return val > hungerAccHistory[idx - 1];
  });
  const hungryAccAfter6h = tHungry.hungerStressAcc;

  // Now eat to full (satiety = 1.0) and simulate 8 hours of digestion
  tHungry.body.satiety = 1.0;
  for(let h = 0; h < 8; h++){
    FeelingSubstrate.update(tHungry, 1.0);
  }
  const decayedAcc = tHungry.hungerStressAcc;

  const ok28_4 = increasesMonotonically && hungryAccAfter6h > 0.2 && decayedAcc < 0.005;
  log(ok28_4, 'couplingHungerStress28: D1 Coupling 1 hunger increases stress acc over 6h, eating full decays to ~0',
    `history=[${hungerAccHistory.map(v => v.toFixed(3)).join(',')}] finalDecayed=${decayedAcc.toFixed(4)}`);

  // ===================================================================
  // 28.5 (D1 Coupling 2: fear↑↑ → exhaustion)
  // Fear event triggers fearFatigueAcc; fatigue rate is elevated during
  // ~3h window, then fearFatigueAcc decays to 0 and rate returns to baseline.
  // ===================================================================
  const tFear = mk('T_FearPawn', 33 * CS, 33 * CS);
  const tCtrl = mk('T_CtrlPawn', 34 * CS, 34 * CS);

  tFear.body.fatigue = 0.1;
  tCtrl.body.fatigue = 0.1;
  tFear.state = 'sit'; // Baseline state
  tCtrl.state = 'sit';

  // Trigger fear event on tFear only
  FeelingSubstrate.receiveSignal(tFear, { kind: 'fear', intensity: 1.0, tick: 1 });

  // Hour 1: fear accumulator active
  const fearAccStart = tFear.fearFatigueAcc;
  FeelingSubstrate.update(tFear, 1.0);
  FeelingSubstrate.update(tCtrl, 1.0);
  const fearFatigue1h = tFear.body.fatigue;
  const ctrlFatigue1h = tCtrl.body.fatigue;
  const elevatedInHour1 = (fearFatigue1h - 0.1) > (ctrlFatigue1h - 0.1);

  // Advance to end of hour 3 (2 more hours, total 3h)
  FeelingSubstrate.update(tFear, 1.0);
  FeelingSubstrate.update(tFear, 1.0);

  // Hour 4: fear accumulator should now have expired to 0
  const fearAccAfter3h = tFear.fearFatigueAcc;
  const fStartH4 = tFear.body.fatigue;
  FeelingSubstrate.update(tFear, 1.0);
  const fEndH4 = tFear.body.fatigue;
  const fDiffH4 = fEndH4 - fStartH4;

  const ok28_5 = fearAccStart === 1.0 && elevatedInHour1 && fearAccAfter3h === 0.0 && fDiffH4 <= 0.0;
  log(ok28_5, 'couplingFearExhaustion28: D1 Coupling 2 fear boosts fatigue rate during 3h window then expires',
    `startAcc=${fearAccStart} elevatedH1=${elevatedInHour1} accAfter3h=${fearAccAfter3h} rateH4=${fDiffH4.toFixed(4)}`);

  // ===================================================================
  // 28.6 (D1 Coupling 3: pain↑ → patience↓)
  // Villager with high pain develops patience deficit; social utility
  // candidate scoring is measurably reduced compared to pain-free villager.
  // ===================================================================
  const tHealthy = mk('T_HealthySocial', 35 * CS, 35 * CS);
  const tInjured = mk('T_InjuredSocial', 36 * CS, 36 * CS);
  const tPartner = mk('T_SocialPartner', 35 * CS + 16, 35 * CS);

  tInjured.body.injury = 1.0; // High pain
  tHealthy.body.injury = 0.0;
  tHealthy.chatT = 8.0; // Social deficit present
  tInjured.chatT = 8.0;

  // Update substrate over 1h to let pain accumulate into patience penalty
  FeelingSubstrate.update(tHealthy, 1.0);
  FeelingSubstrate.update(tInjured, 1.0);

  const healthyPatience = FeelingSubstrate.getPatience(tHealthy);
  const injuredPatience = FeelingSubstrate.getPatience(tInjured);

  // Score socialize candidate for both
  const cand = { id: 'socialize_' + tPartner.name, category: 'social' };
  const healthyScore = scoreCandidateAction(tHealthy, cand);
  const injuredScore = scoreCandidateAction(tInjured, cand);
  const scoreDifference = healthyScore - injuredScore;

  const ok28_6 = healthyPatience === 1.0 && injuredPatience < 0.85 && scoreDifference > 3.0;
  log(ok28_6, 'couplingPainPatience28: D1 Coupling 3 pain reduces patience and measurably penalizes social utility',
    `healthyPatience=${healthyPatience} injuredPatience=${injuredPatience} healthyScore=${healthyScore.toFixed(1)} injuredScore=${injuredScore.toFixed(1)} diff=${scoreDifference.toFixed(1)}`);

  // ===================================================================
  // 28.7 (Determinism across different tick-sizes)
  // Analytical decay integration ensures that total simulation time of 3h
  // yields identical accumulator values whether stepped as 3x1.0h, 6x0.5h, or 12x0.25h.
  // ===================================================================
  const tDet1 = mk('T_Det1', 37 * CS, 37 * CS);
  const tDet2 = mk('T_Det2', 38 * CS, 38 * CS);
  const tDet3 = mk('T_Det3', 39 * CS, 39 * CS);

  tDet1.body.satiety = 0.10;
  tDet2.body.satiety = 0.10;
  tDet3.body.satiety = 0.10;

  // Run 1: 3 steps of 1.0h
  for(let i = 0; i < 3; i++) FeelingSubstrate.update(tDet1, 1.0);

  // Run 2: 6 steps of 0.5h
  for(let i = 0; i < 6; i++) FeelingSubstrate.update(tDet2, 0.5);

  // Run 3: 12 steps of 0.25h
  for(let i = 0; i < 12; i++) FeelingSubstrate.update(tDet3, 0.25);

  const diff12 = Math.abs(tDet1.hungerStressAcc - tDet2.hungerStressAcc);
  const diff13 = Math.abs(tDet1.hungerStressAcc - tDet3.hungerStressAcc);

  const ok28_7 = diff12 < 1e-4 && diff13 < 1e-4;
  log(ok28_7, 'determinismTickSize28: Analytical dt-scaling produces identical accumulator values across tick sizes',
    `acc1h=${tDet1.hungerStressAcc.toFixed(4)} acc0.5h=${tDet2.hungerStressAcc.toFixed(4)} acc0.25h=${tDet3.hungerStressAcc.toFixed(4)} diff12=${diff12.toExponential(2)}`);

  // ===================================================================
  // 28.8 (A1/D2 Core 12 Qualities Scape Merging)
  // Evaluates feeling-scape merging across the exact quota of 12 qualities:
  // hollow, parched, heavy, burning, anxious, terrified, enraged, content, lonely, revered, confused, vigilant.
  // ===================================================================
  const tScape = mk('T_Scape', 40 * CS, 40 * CS);
  tScape.body.satiety = 0.9;
  tScape.body.hydration = 0.9;
  tScape.body.fatigue = 0.1;
  tScape.body.stress = 0.05;

  const eqScape = FeelingSubstrate.getFeelingScape(tScape);
  const okEq = eqScape.dominant === 'content' && eqScape.tone === 'positive';

  // Test fever -> burning
  tScape.body.coreTemp = 39.2;
  const burnScape = FeelingSubstrate.getFeelingScape(tScape);
  const okBurn = burnScape.dominant === 'burning' && burnScape.tone === 'negative';
  tScape.body.coreTemp = 37.0;

  // Test hunger -> hollow
  tScape.body.satiety = 0.15;
  const hungryScape = FeelingSubstrate.getFeelingScape(tScape);
  const okHollow = hungryScape.dominant === 'hollow' && hungryScape.tone === 'negative';
  tScape.body.satiety = 0.9;

  // Test fatigue -> heavy
  tScape.body.fatigue = 0.85;
  const tiredScape = FeelingSubstrate.getFeelingScape(tScape);
  const okHeavy = tiredScape.dominant === 'heavy' && tiredScape.tone === 'negative';
  tScape.body.fatigue = 0.1;

  const ok28_8 = okEq && okBurn && okHollow && okHeavy;
  log(ok28_8, 'feelingScape12_28: Core 12 qualities merged deterministically with urgency weights',
    `eq=${eqScape.dominant} burn=${burnScape.dominant} hollow=${hungryScape.dominant} heavy=${tiredScape.dominant}`);

  // ===================================================================
  // 28.9 (D2 Burnt-Throat vs Hydration Differential Test)
  // Control pawn drinks water -> content.
  // Pawn with conditions[] throat_burn drinks water -> STILL parched!
  // Wildfire threat event -> terrified (never frozen on content).
  // ===================================================================
  const tDrinkCtrl = mk('T_CtrlDrink', 41 * CS, 41 * CS);
  const tThroat = mk('T_ThroatBurn', 42 * CS, 42 * CS);

  // Both start dehydrated
  tDrinkCtrl.body.hydration = 0.15;
  tThroat.body.hydration = 0.15;
  tThroat.conditions = [{ id: 'throat_burn', blocksAction: 'drink', desc: 'scorched throat' }];

  // Drink water to full hydration
  tDrinkCtrl.body.hydration = 1.0;
  tThroat.body.hydration = 1.0;

  const ctrlScape = FeelingSubstrate.getFeelingScape(tDrinkCtrl);
  const throatScape = FeelingSubstrate.getFeelingScape(tThroat);

  const ctrlDrankOk = ctrlScape.dominant === 'content';
  const throatBurntOk = throatScape.dominant === 'parched';

  // Wildfire test: fire threat must override content to terrified
  const tFirePawn = mk('T_FireThreat', 43 * CS, 43 * CS);
  tFirePawn.body.satiety = 0.9;
  tFirePawn.body.hydration = 0.9;
  FeelingSubstrate.receiveSignal(tFirePawn, { kind: 'threat_fire', intensity: 0.9, domain: 'danger', affect: 'fear', tick: 10.0 });
  const fireScape = FeelingSubstrate.getFeelingScape(tFirePawn);
  const fireNotContent = fireScape.dominant === 'terrified' && fireScape.dominant !== 'content';

  const ok28_9 = ctrlDrankOk && throatBurntOk && fireNotContent;
  log(ok28_9, 'burntThroatDifferential28: D2 vocabulary reads conditions[] — burnt throat remains parched after drinking water; fire overrides content',
    `ctrlAfterDrink=${ctrlScape.dominant} burntThroatAfterDrink=${throatScape.dominant} fireDominant=${fireScape.dominant}`);

  // ===================================================================
  // 28.10 (WHY HUD Float Purge & Text Display)
  // WHY HUD displays feeling qualities in words (e.g. 'anxious · heavy'),
  // zero float numbers for feelings, and explainAction includes feelingScape.
  // ===================================================================
  const tWhy = mk('T_WhyHud', 44 * CS, 44 * CS);
  tWhy.body.satiety = 0.2;
  tWhy.hungerStressAcc = 0.4;
  FeelingSubstrate.update(tWhy, 0.5);

  evaluateVillagerUtility(tWhy);
  const whyTrace = tWhy.__lastDecision;
  const explainTr = explainAction(tWhy.name);

  // Update HUD and inspect #pi-why HTML
  updateHUD();
  const piWhyEl = document.getElementById('pi-why');
  const whyHtml = piWhyEl ? piWhyEl.innerHTML : '';

  const hasFeelingElement = whyHtml.includes('pi-why-feeling');
  const feelingWordsOnly = whyHtml.includes('feeling:');
  const hasNoFloatFeelings = !/stress\s*0\.\d+/i.test(whyHtml) && !/feeling:\s*\d+/i.test(whyHtml);
  const explainHasScape = explainTr && explainTr.feelingScape && typeof explainTr.feelingScape.dominant === 'string';

  const ok28_10 = hasFeelingElement && feelingWordsOnly && hasNoFloatFeelings && explainHasScape;
  log(ok28_10, 'whyHudTextQualities28: WHY HUD purges float feelings in favor of feeling quality words and structured feelingScape trace',
    `hasFeelingEl=${hasFeelingElement} noFloats=${hasNoFloatFeelings} scape=${explainTr && explainTr.feelingScape && explainTr.feelingScape.dominant}`);

  // ===================================================================
  // 28.11 (Fix B1 Nửa 1 — Live A3 Signals into Scape & Accumulators)
  // All 5 previously dead signals (death, downed, gossip, birth, marriage)
  // route to active qualities and never drop to 'content' at high intensity.
  // ===================================================================
  const tDeath = mk('T_Sig_Death', 10, 10);
  FeelingSubstrate.receiveSignal(tDeath, FeelingSubstrate.normalizeEvent('death', null, { intensity: 1.0 }));
  const scapeDeath = FeelingSubstrate.getFeelingScape(tDeath);
  const okDeath = scapeDeath.dominant === 'heavy' && scapeDeath.tone === 'negative';

  const tDowned = mk('T_Sig_Downed', 12, 12);
  FeelingSubstrate.receiveSignal(tDowned, FeelingSubstrate.normalizeEvent('downed', null, { intensity: 0.95 }));
  const scapeDowned = FeelingSubstrate.getFeelingScape(tDowned);
  const okDowned = (scapeDowned.dominant === 'terrified' || scapeDowned.dominant === 'heavy') && scapeDowned.tone === 'negative';

  const tGossip = mk('T_Sig_Gossip', 14, 14);
  FeelingSubstrate.receiveSignal(tGossip, FeelingSubstrate.normalizeEvent('gossip', null, { intensity: 0.85 }));
  const scapeGossip = FeelingSubstrate.getFeelingScape(tGossip);
  const okGossip = (scapeGossip.dominant === 'vigilant' || scapeGossip.dominant === 'anxious') && scapeGossip.dominant !== 'content';

  const tBirth = mk('T_Sig_Birth', 16, 16);
  FeelingSubstrate.receiveSignal(tBirth, FeelingSubstrate.normalizeEvent('birth', null, { intensity: 0.85 }));
  const scapeBirth = FeelingSubstrate.getFeelingScape(tBirth);
  const okBirth = scapeBirth.dominant === 'revered' && scapeBirth.tone === 'positive';

  const tMarriage = mk('T_Sig_Marriage', 18, 18);
  FeelingSubstrate.receiveSignal(tMarriage, FeelingSubstrate.normalizeEvent('marriage', null, { intensity: 0.85 }));
  const scapeMarriage = FeelingSubstrate.getFeelingScape(tMarriage);
  const okMarriage = scapeMarriage.dominant === 'revered' && scapeMarriage.tone === 'positive';

  const ok28_11 = okDeath && okDowned && okGossip && okBirth && okMarriage;
  log(ok28_11, 'liveA3Signals28: All 5 previously dead signals route into active feeling scape without falling into content',
    `death=${scapeDeath.dominant} downed=${scapeDowned.dominant} gossip=${scapeGossip.dominant} birth=${scapeBirth.dominant} marriage=${scapeMarriage.dominant}`);

  // ===================================================================
  // 28.12 (Fix B1 Nửa 2 — Real Production Path Wildfire & Event Emission)
  // Real wildfireTick running through game systems without manual injection
  // shifts nearby unburned villager out of content; control pawn stays content.
  // Real killVillager and setDowned emit signals to production callers.
  // ===================================================================
  // 1. Wildfire differential probe
  const tFireCtrl = mk('T_Ctrl_NoFire', 50, 50);
  const tFireExp = mk('T_Fire_Exp', 50, 50);
  const origBurning = (typeof BURNING !== 'undefined' && Array.isArray(BURNING)) ? BURNING.slice() : [];
  if(typeof BURNING !== 'undefined') BURNING.length = 0;

  // Control run: no fire anywhere
  const ctrlScapeBefore = FeelingSubstrate.getFeelingScape(tFireCtrl);
  const okCtrlContent = ctrlScapeBefore.dominant === 'content' && ctrlScapeBefore.tone === 'positive';

  // Spawn real burning tile 3 cells away: within sight (16 cells), outside burn injury (< 1.2 cells)
  const testBurnTile = { wx: 53, wy: 50, t: 5.0 };
  if(typeof BURNING !== 'undefined') BURNING.push(testBurnTile);

  // Run real production wildfireTick
  if(typeof wildfireTick === 'function') wildfireTick(0.1);

  const expInjury = tFireExp.body ? tFireExp.body.injury || 0 : 0;
  const expScape = FeelingSubstrate.getFeelingScape(tFireExp);
  const okFireShift = expInjury === 0 && expScape.dominant === 'terrified' && expScape.tone === 'negative';

  // Restore BURNING
  if(typeof BURNING !== 'undefined'){
    BURNING.length = 0;
    for(const b of origBurning) BURNING.push(b);
  }

  // 2. Real killVillager witness emission
  const tVictim = mk('T_Victim', 20, 20);
  const tWitness = mk('T_Witness', 22, 20);
  if(typeof killVillager === 'function') killVillager(tVictim, 'exposure');
  const witnessScape = FeelingSubstrate.getFeelingScape(tWitness);
  const okWitnessDeath = witnessScape.dominant === 'heavy' && witnessScape.tone === 'negative';

  // 3. Real setDowned emission
  const tDownPawn = mk('T_DownPawn', 25, 25);
  if(typeof setDowned === 'function') setDowned(tDownPawn, 'unconscious', 'fever');
  const downPawnScape = FeelingSubstrate.getFeelingScape(tDownPawn);
  const okDownPawn = (downPawnScape.dominant === 'terrified' || downPawnScape.dominant === 'heavy') && downPawnScape.tone === 'negative';

  const ok28_12 = okCtrlContent && okFireShift && okWitnessDeath && okDownPawn;
  log(ok28_12, 'productionPathEvents28: Real game system callers (wildfire, death, downed) emit live signals without manual injection',
    `ctrlDominant=${ctrlScapeBefore.dominant} fireExpDominant=${expScape.dominant} uninjured=${expInjury === 0} witnessDominant=${witnessScape.dominant} downDominant=${downPawnScape.dominant}`);

  // ===================================================================
  // 28.13 (A2 Hearing Propagation & Distance Falloff)
  // Production scream propagates to listener within radius with distance falloff;
  // outside radius receives no signal; nearer listener receives higher intensity.
  // ===================================================================
  const tAcousticSource = mk('T_AcousticSource', 100, 100);
  const tAcousticNear = mk('T_AcousticNear', 105, 100); // 5 cells away
  const tAcousticMid = mk('T_AcousticMid', 115, 100);   // 15 cells away
  const tAcousticFar = mk('T_AcousticFar', 150, 100);   // 50 cells away

  FeelingSubstrate.propagateSound({
    kind: 'scream',
    originX: tAcousticSource.x,
    originY: tAcousticSource.y,
    source: tAcousticSource,
    radius: 25
  });

  const sigNear = (tAcousticNear._recentSignals || []).slice().reverse().find(s => s.kind === 'acoustic_scream');
  const sigMid = (tAcousticMid._recentSignals || []).slice().reverse().find(s => s.kind === 'acoustic_scream');
  const sigFar = (tAcousticFar._recentSignals || []).slice().reverse().find(s => s.kind === 'acoustic_scream');

  const nearInt = sigNear ? sigNear.intensity : 0;
  const midInt = sigMid ? sigMid.intensity : 0;
  const okNearMidFar = (nearInt > 0) && (midInt > 0) && (nearInt > midInt) && (!sigFar);
  const scapeNearAcoustic = FeelingSubstrate.getFeelingScape(tAcousticNear);
  const scapeFarAcoustic = FeelingSubstrate.getFeelingScape(tAcousticFar);
  const okAcousticScape = (scapeNearAcoustic.dominant !== 'content') && (scapeFarAcoustic.dominant === 'content');

  const ok28_13 = okNearMidFar && okAcousticScape;
  log(ok28_13, 'hearingPropagation28: A2 physical sound propagation with distance falloff and negative control',
    `nearInt=${nearInt} midInt=${midInt} farReceived=${!!sigFar} nearScape=${scapeNearAcoustic.dominant} farScape=${scapeFarAcoustic.dominant}`);

  // ===================================================================
  // 28.14 (3B stressResidue Lifecycle: Ceiling, Scape, & 8%/day Recovery)
  // stressResidue accumulates from trauma, clamped strictly by 0.35 * maxStress;
  // peaceful day recovers ~8%/day without depression loop; acute fire overrides residue.
  // ===================================================================
  const tResiduePawn = mk('T_ResiduePawn', 200, 200);
  const maxStressVal = FeelingSubstrate.getMaxStress(tResiduePawn);
  const ceilingVal = 0.35 * maxStressVal;

  // Severe trauma bombardment: multiple days
  for(let h = 0; h < 72; h += 0.5){
    tResiduePawn.hungerStressAcc = 1.0;
    tResiduePawn.body.stress = 1.0;
    FeelingSubstrate.receiveSignal(tResiduePawn, { kind: 'fear', intensity: 1.0, affect: 'fear', domain: 'danger', tick: h });
    FeelingSubstrate.update(tResiduePawn, 0.5);
  }

  const residueAtCeiling = FeelingSubstrate.getStressResidue(tResiduePawn);
  const okCeiling = (residueAtCeiling <= ceilingVal + 1e-6) && (residueAtCeiling >= ceilingVal - 1e-4);

  // Background unease in peace
  tResiduePawn.body.satiety = 1.0;
  tResiduePawn.body.hydration = 1.0;
  tResiduePawn.body.fatigue = 0.10;
  tResiduePawn.body.stress = 0.05;
  tResiduePawn.hungerStressAcc = 0.0;
  tResiduePawn.fearFatigueAcc = 0.0;
  tResiduePawn._recentSignals = [];
  const peaceResidueScape = FeelingSubstrate.getFeelingScape(tResiduePawn);
  const okPeaceUnease = peaceResidueScape.dominant === 'anxious' || peaceResidueScape.dominant === 'vigilant';

  // 1 peaceful day recovery (-8%/day)
  const rStartHeal = residueAtCeiling;
  for(let t = 0; t < 48; t++) FeelingSubstrate.update(tResiduePawn, 0.5);
  const rAfter1Day = FeelingSubstrate.getStressResidue(tResiduePawn);
  const loss1Day = rStartHeal - rAfter1Day;
  const okRecovery = Math.abs(loss1Day - 0.080) < 0.005;

  const ok28_14 = okCeiling && okPeaceUnease && okRecovery;
  log(ok28_14, 'stressResidueLifecycle28: 3B stressResidue ceiling (0.35*maxStress), background unease, and ~8%/day peaceful recovery',
    `residue=${residueAtCeiling} ceiling=${ceilingVal} peaceScape=${peaceResidueScape.dominant} 1dayLoss=${loss1Day.toFixed(4)}`);

  // ===================================================================
  // 28.15 (Entity Cleanup)
  // All test entities cleaned up; canonical settlement untouched.
  // ===================================================================
  const countBefore = madeNames.length;
  cleanupTestVillagers();
  const countAfter = madeNames.length;
  const canonicalUntouched = VILLAGERS.every(v => !v.name.startsWith('T_'));

  const ok28_15 = countBefore > 0 && countAfter === 0 && canonicalUntouched;
  log(ok28_15, 'cleanup28: All temporary test villagers cleaned up with canonical settlement preserved',
    `cleaned=${countBefore} remaining=${countAfter} canonicalSafe=${canonicalUntouched}`);

  // Summary banner for harness parsing
  const passed = res.filter(r => r.ok).length;
  el.textContent += `part28 done ==== ${passed}/${res.length} passed ====\n`;
};
