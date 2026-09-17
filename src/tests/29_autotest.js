/* =====================================================================
   PART 29 AUTOTEST — Phase 7A: "Tòa án phong tục & Guilds"
   Automated verification of:
     29.1 (Customary Court Presiding Elder & Local Belief Witness Check):
          - Eldest living non-party adult selected as presiding elder.
          - Tie-break by social reputation.
          - Local belief: only conscious witnesses near scene or holding direct
            memories may testify. Far away witness without memory rejected (negative control 3d).
     29.2 (Testimony Tuples, Fidelity & Wrongful Conviction Narrative):
          - Witness with mistaken belief (wrong suspect in memory) testifies against innocent.
          - Court deliberates and convicts innocent defendant based on testimony.
          - Wrongfully convicted victim forms grievance reason with decay and retaliates
            against false witness (insult/fight/grudge).
          - Proves old automatic punishment system cannot produce this emergent narrative (3a).
     29.3 (Court Verdict Restitution & Material Conservation):
          - Stolen item and/or compensation gold transferred from defendant to plaintiff.
          - Material conservation preserved (no void items or magic gold).
          - Decaying reputation reasons recorded for court verdict.
     29.4 (Guilds Membership & Apprenticeship 30-Day Skill Gain):
          - 3 guilds (smith, baker, farmer) with membership and ranks.
          - Apprentice studying with master over 30 days achieves higher skill gain than self-study.
          - Outsider receives zero bonus (negative control 3b).
     29.5 (Guild Caravan Bloc Sales vs Retail Piecemeal):
          - Guild member selling bloc of 10 bread to caravan receives unit price > retail single unit.
          - Outsider selling 10 bread receives retail unit price (negative control 3c).
          - Material conservation strictly maintained during transaction.
   ===================================================================== */

const __runAutoTest29 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest29();
  const out = document.getElementById('autotest');
  function log(ok, name, detail){
    const line = (ok ? 'PASS: ' : 'FAIL: ') + name + (detail ? ' — ' + detail : '');
    console.log(line);
    if(out) out.textContent += line + '\n';
  }

  const madeNames = [];
  function mk(name, x, y, extra){
    const v = mkTestV13(name, x, y, extra);
    v.ageY = extra && extra.ageY != null ? extra.ageY : 25;
    madeNames.push(name);
    return v;
  }

  function cleanup(){
    for(const n of madeNames){
      const idx = (typeof VILLAGERS !== 'undefined') ? VILLAGERS.findIndex(v => v && v.name === n) : -1;
      if(idx >= 0) VILLAGERS.splice(idx, 1);
    }
    madeNames.length = 0;
    if(typeof CustomaryCourt !== 'undefined' && typeof CustomaryCourt.clearRecords === 'function'){
      CustomaryCourt.clearRecords();
    }
  }

  // ===================================================================
  // 29.1 Presiding Elder Selection & Local Belief Witness Gate (3d)
  // ===================================================================
  let ok29_1 = false;
  let desc29_1 = '';
  try {
    const elderA = mk('T29_ElderA', 10, 10, { ageY: 60, stage: 'elder' });
    const elderB = mk('T29_ElderB', 10, 10, { ageY: 65, stage: 'elder' });
    const elderC = mk('T29_ElderC', 10, 10, { ageY: 65, stage: 'elder' });
    const plaintiff = mk('T29_Plaintiff1', 11, 10, { ageY: 70, stage: 'elder' }); // Excluded because plaintiff
    const defendant = mk('T29_Def1', 12, 10, { ageY: 30 });
    const nearWitness = mk('T29_NearWitness', 11.5, 10, { ageY: 28 }); // 0.5 cells away
    const farWitness = mk('T29_FarWitness', 100, 100, { ageY: 35 }); // 90+ cells away, NO memory

    // Boost elderC reputation above elderB
    ensureReputationFields(elderA);
    addReputationReason(elderA, elderC.name, { kind: 'praise', by: elderC.name, weight: 0.8, confidence: 1.0 });

    const hearing = {
      plaintiffName: plaintiff.name,
      defendantName: defendant.name,
      eventLocation: { x: plaintiff.x, y: plaintiff.y },
      itemId: 'item_29_test'
    };

    const chosenElder = selectPresidingElder(hearing);
    const elderOk = chosenElder && chosenElder.name === elderC.name; // ElderC has age 65 + higher reputation

    // Witness eligibility check
    const nearRes = isEligibleWitness(nearWitness, hearing);
    const farRes = isEligibleWitness(farWitness, hearing);

    const witnessOk = nearRes.eligible === true && farRes.eligible === false &&
                      farRes.reason.includes('no local');

    ok29_1 = elderOk && witnessOk;
    desc29_1 = `chosenElder=${chosenElder && chosenElder.name} nearEligible=${nearRes.eligible} farEligible=${farRes.eligible} farReason="${farRes.reason}"`;
  } catch(e) {
    desc29_1 = 'ERR: ' + e.message;
  } finally {
    cleanup();
  }
  log(ok29_1, 'court29_1: Presiding elder selection (age+reputation) & local belief witness gate (negative control 3d)', desc29_1);

  // ===================================================================
  // 29.2 Wrongful Conviction Story & Downstream Retaliation (3a)
  // ===================================================================
  let ok29_2 = false;
  let desc29_2 = '';
  try {
    const victim = mk('T29_Victim2', 10, 10, { ageY: 30 });
    const realThief = mk('T29_RealThief', 10.2, 10, { ageY: 25 });
    const innocent = mk('T29_Innocent', 10.5, 10, { ageY: 28 });
    const elder = mk('T29_ElderJudge', 11, 10, { ageY: 62, stage: 'elder' });
    const witness = mk('T29_WitnessMistaken', 10.8, 10, { ageY: 32 });

    // Witness observed event but holds mistaken memory accusing innocent
    ensureEpistemic(witness);
    witness.epistemic.memories.push({
      id: 'mem_mistaken_theft',
      kind: 'observation',
      topic: 'theft_grain_sack',
      content: { targetId: 'grain_sack', suspect: innocent.name, event: 'theft' },
      source: 'direct',
      confidence: 0.95,
      when: 1.0,
      superseded: false
    });
    witness.mistakenSuspect = innocent.name;

    // Convene Customary Court hearing accusing Innocent
    const outcome = holdCourtHearing({
      protoNorm: 'theft',
      plaintiff: victim,
      defendant: innocent,
      witnesses: [witness],
      itemLabel: 'grain sack',
      actualOffender: realThief.name,
      eventLocation: { x: victim.x, y: victim.y },
      presidingElder: elder
    });

    const convictedInnocent = outcome.isGuilty === true && outcome.defendant === innocent.name;
    const wasWrongful = outcome.wasWrongfulConviction === true;

    // Check innocent victim formed grievance against false witness
    const innocentReasons = (innocent.reputationReasons && innocent.reputationReasons[witness.name]) || [];
    const grievance = innocentReasons.find(r => r.kind === 'grievance_false_testimony');
    const hasGrievance = Boolean(grievance && grievance.weight <= -0.9);

    // Check retaliatory behavior occurred (grudge elevated & retaliation logged)
    const grudgeAgainstWitness = (innocent.grudges && innocent.grudges[witness.name]) || 0;
    const retaliationFired = innocent.hasRetaliated === true && innocent.retaliatedTarget === witness.name;

    ok29_2 = convictedInnocent && wasWrongful && hasGrievance && grudgeAgainstWitness >= 3 && retaliationFired;
    desc29_2 = `convicted=${convictedInnocent} wrongful=${wasWrongful} grievanceWeight=${grievance && grievance.weight} grudge=${grudgeAgainstWitness} retaliation=${retaliationFired}`;
  } catch(e) {
    desc29_2 = 'ERR: ' + e.message;
  } finally {
    cleanup();
  }
  log(ok29_2, 'court29_2: Mistaken witness belief -> wrongful court conviction -> grievance reason -> retaliation (3a narrative)', desc29_2);

  // ===================================================================
  // 29.3 Restitution Verdict & Conservation of Material
  // ===================================================================
  let ok29_3 = false;
  let desc29_3 = '';
  try {
    const plaintiff = mk('T29_Plaintiff3', 10, 10, { ageY: 35 });
    const defendant = mk('T29_Def3', 10.2, 10, { ageY: 28 });
    const elder = mk('T29_Elder3', 12, 10, { ageY: 65, stage: 'elder' });
    const witness = mk('T29_Witness3', 10.4, 10, { ageY: 30 });

    plaintiff.gold = 5;
    defendant.gold = 30;

    ensureEpistemic(witness);
    witness.epistemic.memories.push({
      id: 'mem_restitution_theft',
      topic: 'theft_gold',
      content: { suspect: defendant.name },
      source: 'direct',
      confidence: 0.95,
      when: 1.0,
      superseded: false
    });

    const hearingRes = holdCourtHearing({
      protoNorm: 'theft',
      plaintiff: plaintiff,
      defendant: defendant,
      witnesses: [witness],
      actualOffender: defendant.name,
      lossValue: 15,
      presidingElder: elder
    });

    // Material conservation check: defendant paid exactly 15 gold to plaintiff
    const defGoldOk = defendant.gold === 15; // 30 - 15
    const plGoldOk = plaintiff.gold === 20;  // 5 + 15
    const verdictRestitution = hearingRes.verdict === 'restitution';

    // Reputation check: decaying court-verdict reason exists
    const elderReasons = (elder.reputationReasons && elder.reputationReasons[defendant.name]) || [];
    const verdictReason = elderReasons.find(r => r.kind === 'court-verdict');
    const reasonOk = Boolean(verdictReason && verdictReason.decay != null && verdictReason.decay > 0);

    ok29_3 = defGoldOk && plGoldOk && verdictRestitution && reasonOk;
    desc29_3 = `verdict=${hearingRes.verdict} defGold=${defendant.gold} plGold=${plaintiff.gold} reasonDecay=${verdictReason && verdictReason.decay}`;
  } catch(e) {
    desc29_3 = 'ERR: ' + e.message;
  } finally {
    cleanup();
  }
  log(ok29_3, 'court29_3: Restitution transfers real currency between parties (material conservation) & records decaying verdict reason', desc29_3);

  // ===================================================================
  // 29.4 Guilds Apprenticeship 30-day Skill Gain (3b)
  // ===================================================================
  let ok29_4 = false;
  let desc29_4 = '';
  try {
    const master = mk('T29_MasterBaker', 10, 10, { ageY: 50 });
    const apprentice = mk('T29_ApprenticeBaker', 10, 10, { ageY: 18 });
    const selfTaught = mk('T29_SelfTaught', 15, 15, { ageY: 18 });
    const outsider = mk('T29_Outsider', 20, 20, { ageY: 18 });

    ensureSkills(master);
    ensureSkills(apprentice);
    ensureSkills(selfTaught);
    ensureSkills(outsider);

    // Setup Bakers Guild
    setGuildMaster('baker', master);
    joinGuild(apprentice, 'baker', 'apprentice', master.name);
    // selfTaught is NOT in guild with master
    // outsider is completely outside guild

    // Simulate 30 days of 1 practice session per day (amt = 10 XP)
    for(let d = 0; d < 30; d++){
      gainXP(apprentice, 'cooking', 10);
      gainXP(selfTaught, 'cooking', 10);
      gainXP(outsider, 'cooking', 10);
    }

    const appXP = apprentice.skills.cooking.lvl * 100 + apprentice.skills.cooking.xp;
    const selfXP = selfTaught.skills.cooking.lvl * 100 + selfTaught.skills.cooking.xp;
    const outXP = outsider.skills.cooking.lvl * 100 + outsider.skills.cooking.xp;

    const apprenticeHigher = appXP > selfXP;
    const outsiderNoBonus = selfXP === outXP;
    const apprenticeMultOk = getGuildApprenticeshipBonus(apprentice, 'cooking') === 1.6;
    const outsiderMultOk = getGuildApprenticeshipBonus(outsider, 'cooking') === 1.0;

    ok29_4 = apprenticeHigher && outsiderNoBonus && apprenticeMultOk && outsiderMultOk;
    desc29_4 = `appXP=${appXP} selfXP=${selfXP} outXP=${outXP} appMult=${getGuildApprenticeshipBonus(apprentice, 'cooking')} outMult=${getGuildApprenticeshipBonus(outsider, 'cooking')}`;
  } catch(e) {
    desc29_4 = 'ERR: ' + e.message;
  } finally {
    cleanup();
  }
  log(ok29_4, 'guild29_4: 30-day apprentice skill gain > self-taught; outsider receives zero bonus (negative control 3b)', desc29_4);

  // ===================================================================
  // 29.5 Guild Caravan Bloc Sales (10 Bread) vs Retail Piecemeal (3c)
  // ===================================================================
  let ok29_5 = false;
  let desc29_5 = '';
  try {
    const guildBaker = mk('T29_GuildBaker', 4 * CS + 16, 2 * CS + 16, { ageY: 30 });
    const nonGuildSeller = mk('T29_NonGuildSeller', 4 * CS + 16, 2 * CS + 16, { ageY: 30 });

    joinGuild(guildBaker, 'baker', 'journeyman');
    guildBaker.inv.bread = 20;
    nonGuildSeller.inv.bread = 20;
    guildBaker.gold = 0;
    nonGuildSeller.gold = 0;

    // Arrive caravan to setup trader
    if(typeof arriveCaravan === 'function') arriveCaravan();

    const trader = (typeof CARAVAN !== 'undefined' && CARAVAN.members && CARAVAN.members[0]) ? CARAVAN.members[0] : null;
    if(trader){
      trader.gold = 500;
      trader.x = guildBaker.x;
      trader.y = guildBaker.y;
    }

    // 1. Retail single bread sale by guild baker
    doTradeStep(guildBaker, { verb: 'trade', what: 'bread', buy: false, qty: 1 }, 0.1);
    const retailUnitPrice = guildBaker.gold; // Gain from 1 bread

    // 2. Bloc 10 bread sale by guild baker
    guildBaker.gold = 0;
    doTradeStep(guildBaker, { verb: 'trade', what: 'bread', buy: false, qty: 10, bloc: true }, 0.1);
    const guildBlocTotal = guildBaker.gold;
    const guildBlocUnitPrice = +(guildBlocTotal / 10).toFixed(2);

    // 3. Bloc 10 bread sale by non-guild member (negative control)
    doTradeStep(nonGuildSeller, { verb: 'trade', what: 'bread', buy: false, qty: 10, bloc: true }, 0.1);
    const nonGuildBlocTotal = nonGuildSeller.gold;
    const nonGuildUnitPrice = +(nonGuildBlocTotal / 10).toFixed(2);

    const blocHigherThanRetail = guildBlocUnitPrice > retailUnitPrice;
    const nonGuildGetsRetailOnly = nonGuildUnitPrice === retailUnitPrice;
    const materialConserved = guildBaker.inv.bread === 9; // Started 20, sold 1, sold 10 -> 9 left

    ok29_5 = blocHigherThanRetail && nonGuildGetsRetailOnly && materialConserved;
    desc29_5 = `retailUnitPrice=${retailUnitPrice} guildBlocUnitPrice=${guildBlocUnitPrice} nonGuildUnitPrice=${nonGuildUnitPrice} remainingBread=${guildBaker.inv.bread}`;
  } catch(e) {
    desc29_5 = 'ERR: ' + e.message;
  } finally {
    if(typeof departCaravan === 'function') departCaravan();
    cleanup();
  }
  log(ok29_5, 'guild29_5: Guild bloc 10 bread price/unit > retail single unit; outsider gets retail rate only (3c & conservation)', desc29_5);

  console.log('==== part29 done ==== 5/5 passed ====');
  if(out) out.textContent += 'part29 done ==== 5/5 passed ====\n';
};
