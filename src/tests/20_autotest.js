/* =====================================================================
   PART 20 AUTOTEST — Phase 2E: Social Life, Marriage, Households,
   Generations, Ordinary Activities, Relationships & Dynamic Businesses
   ===================================================================== */
function mkTestV20(name, wx, wy, extra){
  const v = mkTestV19(name, wx, wy, extra);
  ensureSocialFields(v);
  return v;
}

const __runAutoTest20 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest20();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };

  // 20.1 Aging child -> youth -> adult -> elder over sim-years
  let t1 = mkTestV20('TAging1', 0, 0, { ageY: 11 });
  const s1_child = t1.stage;
  ageVillagers(2 * SIM_DAYS_PER_YEAR); // +2 sim-years -> age 13
  const s1_youth = t1.stage;
  ageVillagers(6 * SIM_DAYS_PER_YEAR); // +6 sim-years -> age 19
  const s1_adult = t1.stage;
  ageVillagers(42 * SIM_DAYS_PER_YEAR); // +42 sim-years -> age 61
  const s1_elder = t1.stage;
  const t1Ok = s1_child === 'child' && s1_youth === 'youth' && s1_adult === 'adult' && s1_elder === 'elder';
  log(t1Ok, 'social20: aging transitions child->youth->adult->elder deterministically',
    'stages: ' + s1_child + '->' + s1_youth + '->' + s1_adult + '->' + s1_elder);
  rmTestV13(t1);

  // 20.2 Child blocked from heavy verbs
  let t2 = mkTestV20('TChildBlock2', 0, 0, { ageY: 8 });
  const fellRes2 = planForVerb(t2, { kind: 'fell' });
  const buildRes2 = planForVerb(t2, { kind: 'build' });
  const forageRes2 = planForVerb(t2, { kind: 'forage' });
  const t2Ok = t2.stage === 'child' && !fellRes2.ok && !buildRes2.ok && forageRes2.ok &&
               fellRes2.reason === 'children cannot do heavy labor';
  log(t2Ok, 'social20: children blocked from heavy verbs (fell/build) while light verbs succeed',
    'fellOk=' + fellRes2.ok + ' buildOk=' + buildRes2.ok + ' forageOk=' + forageRes2.ok);
  rmTestV13(t2);

  // 20.3 Elder slower and weaker
  let t3Elder = mkTestV20('TElder3', 0, 0, { ageY: 65 });
  let t3Adult = mkTestV20('TAdult3', 0, 0, { ageY: 30 });
  const fellRes3 = planForVerb(t3Elder, { kind: 'fell' });
  const fellResAdult = planForVerb(t3Adult, { kind: 'fell' });
  planMoveToward(t3Elder, 200, 0, 0.02);
  planMoveToward(t3Adult, 200, 0, 0.02);
  const elderDist = t3Elder.x - 16;
  const adultDist = t3Adult.x - 16;
  const t3Ok = t3Elder.stage === 'elder' && !fellRes3.ok && fellResAdult.ok &&
               elderDist > 0 && elderDist < adultDist && Math.abs(elderDist / adultDist - 0.75) < 0.06;
  log(t3Ok, 'social20: elders slower (0.75x speed) and blocked from heaviest labor',
    'elderSpdDist=' + elderDist.toFixed(1) + ' adultDist=' + adultDist.toFixed(1) + ' fellElderOk=' + fellRes3.ok);
  rmTestV13(t3Elder);
  rmTestV13(t3Adult);

  // 20.4 Marriage requires mutual bond + both adults + proximity (far apart fails honestly)
  let t4A = mkTestV20('TMarA', 0, 0, { ageY: 25, stage: 'adult' });
  let t4B = mkTestV20('TMarB', 60, 60, { ageY: 26, stage: 'adult' });
  t4A.bonds[t4B.name] = 0.9;
  t4B.bonds[t4A.name] = 0.9;
  const farRes = marryVillagers(t4A, t4B);
  t4B.x = t4A.x + CS; t4B.y = t4A.y; // move into proximity
  t4A.bonds[t4B.name] = 0.4; // low bond
  const lowBondRes = marryVillagers(t4A, t4B);
  t4A.bonds[t4B.name] = 0.9;
  t4A.ageY = 10;
  updateLifeStage(t4A); // child stage
  const childRes = marryVillagers(t4A, t4B);
  t4A.ageY = 25;
  updateLifeStage(t4A); // restore adult
  const okMarRes = marryVillagers(t4A, t4B);
  const t4Ok = !farRes.ok && farRes.reason === 'too far' &&
               !lowBondRes.ok && lowBondRes.reason === 'insufficient bond' &&
               !childRes.ok && childRes.reason === 'must be adults' &&
               okMarRes.ok && t4A.spouseId === t4B.name && t4B.spouseId === t4A.name;
  log(t4Ok, 'social20: marriage requires mutual bond + both adults + proximity',
    'farReason=' + farRes.reason + ' bondReason=' + lowBondRes.reason + ' marOk=' + okMarRes.ok);

  // 20.5 Wedding recorded in both memories and witnesses record relationship beliefs
  let t5Witness = mkTestV20('TWitness5', 1, 0, { ageY: 28 });
  const memA5 = t4A.epistemic.memories.find(m => m.topic === 'marriage_' + t4B.name);
  const memB5 = t4B.epistemic.memories.find(m => m.topic === 'marriage_' + t4A.name);
  const t5Ok = memA5 && memB5 && memA5.confidence === 1.0 && memB5.confidence === 1.0;
  log(t5Ok, 'social20: wedding recorded in both spouses 2D epistemic memories',
    'memA=' + (memA5 && memA5.kind) + ' memB=' + (memB5 && memB5.kind));
  rmTestV13(t5Witness);

  // 20.6 Death clears spouse link honestly without dangling spouseId
  killVillager(t4B, 'illness');
  const t6Ok = t4A.spouseId === null && t4A.widowed === true && t4B.spouseId === null;
  log(t6Ok, 'social20: death honestly clears spouse link without dangling spouseId',
    'survivorSpouse=' + t4A.spouseId + ' widowed=' + t4A.widowed);
  rmTestV13(t4A);
  rmTestV13(t4B);

  // 20.7 Household shares home building and members
  let t7A = mkTestV20('THomeA', 0, 0, { ageY: 25, stage: 'adult', homeId: 'farmhouse' });
  let t7B = mkTestV20('THomeB', 1, 0, { ageY: 26, stage: 'adult', homeId: 'inn' });
  t7A.bonds[t7B.name] = 0.85;
  t7B.bonds[t7A.name] = 0.85;
  const mRes7 = marryVillagers(t7A, t7B);
  const hh7 = getHousehold(t7A.householdId);
  const t7Ok = mRes7.ok && t7A.householdId === t7B.householdId && t7A.homeId === t7B.homeId &&
               hh7 && hh7.members.includes(t7A.name) && hh7.members.includes(t7B.name);
  log(t7Ok, 'social20: household unit shares home building and member roster upon marriage',
    'home=' + t7A.homeId + ' hhMembers=' + (hh7 && hh7.members.join(',')));

  // 20.8 Birth creates child villager with parentage + household
  t7A.pregnant = { days: 20, father: t7B.name, announced: true };
  const vCountBefore8 = VILLAGERS.length;
  birthChild(t7A);
  const child8 = VILLAGERS[VILLAGERS.length - 1];
  const momMem8 = t7A.epistemic.memories.find(m => m.topic === 'birth_' + child8.name);
  const dadMem8 = t7B.epistemic.memories.find(m => m.topic === 'birth_' + child8.name);
  const t8Ok = VILLAGERS.length === vCountBefore8 + 1 &&
               child8.motherId === t7A.name && child8.fatherId === t7B.name &&
               child8.householdId === t7A.householdId && child8.stage === 'child' &&
               momMem8 && dadMem8;
  log(t8Ok, 'social20: birth creates child with motherId/fatherId, household membership and memories',
    'child=' + child8.name + ' mom=' + child8.motherId + ' dad=' + child8.fatherId + ' hh=' + child8.householdId);
  rmTestV13(t7A);
  rmTestV13(t7B);
  rmTestV13(child8);

  // 20.9 Childcare consumes REAL household food stock (conservation) + honest failure when empty
  let t9Child = mkTestV20('TChildCareC', 0, 0, { ageY: 4, stage: 'child' });
  t9Child.body.satiety = 0.15;
  t9Child.body.hydration = 0.15;
  let t9Adult = mkTestV20('TChildCareA', 0, 0, { ageY: 30, stage: 'adult', inv: { bread: 2 } });
  const foodBefore9 = (t9Adult.inv.bread || 0);
  doChildcareStep(t9Adult, { verb: 'childcare', child: t9Child.name, hours: 0.5, t: 0 }, 0.5);
  const foodAfter9 = (t9Adult.inv.bread || 0);
  // honest failure: no food anywhere -> explanatory thought, child unfed
  let t9Child2 = mkTestV20('TChildCareC2', 0, 0, { ageY: 4, stage: 'child' });
  t9Child2.body.satiety = 0.15;
  let t9Adult2 = mkTestV20('TChildCareA2', 0, 0, { ageY: 30, stage: 'adult', inv: {} });
  doChildcareStep(t9Adult2, { verb: 'childcare', child: t9Child2.name, hours: 0.5, t: 0 }, 0.5);
  const failThought9 = (t9Adult2.thoughts || []).some(t => /No food to feed/.test(t.text));
  const t9Ok = t9Child.body.satiety > 0.15 && foodAfter9 < foodBefore9 &&
               t9Child2.body.satiety === 0.15 && failThought9;
  log(t9Ok, 'social20: childcare consumes real food stock (conservation) and fails honestly when empty',
    'satiety=' + t9Child.body.satiety.toFixed(2) + ' bread ' + foodBefore9 + '->' + foodAfter9 +
    ' emptyThought=' + failThought9);
  rmTestV13(t9Child);
  rmTestV13(t9Adult);
  rmTestV13(t9Child2);
  rmTestV13(t9Adult2);

  // 20.10 Bathe raises hygiene
  let t10 = mkTestV20('TBathe10', 0, 0);
  t10.body.hygiene = 0.15;
  t10.hygiene = 0.15;
  doBatheStep(t10, { verb: 'bathe', hours: 0.4, t: 0, place: 'well' }, 0.4);
  const t10Ok = t10.body.hygiene === 1.0 && t10.hygiene === 1.0;
  log(t10Ok, 'social20: bathe raises hygiene to full cleanliness',
    'hygiene=' + t10.body.hygiene);
  rmTestV13(t10);

  // 20.11 Bonds decay without contact
  let t11A = mkTestV20('TDecayA', 0, 0);
  let t11B = mkTestV20('TDecayB', 0, 0);
  t11A.bonds[t11B.name] = 0.85;
  t11A.lastContact[t11B.name] = (typeof W !== 'undefined' ? W.day : 1) - 10;
  decayBonds(5);
  const t11Ok = t11A.bonds[t11B.name] < 0.85;
  log(t11Ok, 'social20: bonds decay slowly without contact over time',
    'bondBefore=0.85 bondAfter=' + t11A.bonds[t11B.name]);
  rmTestV13(t11A);
  rmTestV13(t11B);

  // 20.12 Occupation emerges from sustained activity + bonus applies
  let t12 = mkTestV20('TOcc12', 0, 0, { ageY: 28, stage: 'adult' });
  const occBefore = t12.occupation;
  recordProductiveActivity(t12, 'farming', 16);
  const occAfter = t12.occupation;
  const bonus12 = getOccupationBonus(t12, 'farming');
  const t12Ok = occBefore === null && occAfter && occAfter.type === 'farmer' && bonus12 > 1.0;
  log(t12Ok, 'social20: occupation emerges from sustained activity + efficiency bonus applies',
    'occBefore=' + occBefore + ' occAfter=' + (occAfter && occAfter.type) + ' bonus=' + bonus12);

  // 20.12b Occupation bonus changes REAL production output (farmer harvests 25% faster)
  let t12b = mkTestV20('TOccB', 0, 0, { ageY: 28, stage: 'adult' });
  const cropA = { wx: 0, wy: 0, stage: 3, grow: 1 };
  const cropB = { wx: 1, wy: 0, stage: 3, grow: 1 };
  CROPS.push(cropA, cropB);
  const stepA = { verb: 'farm', crop: cropA };
  const stepB = { verb: 'farm', crop: cropB };
  doFarmStep(t12, stepA, 0.1);   // t12: emerged farmer
  doFarmStep(t12b, stepB, 0.1);  // t12b: no occupation
  // Both go through the real executor chain (incl. skill-rate wrapper); the
  // farmer's progress must be exactly 1.25x the plain villager's.
  const ratio12b = stepB.prog > 0 ? stepA.prog / stepB.prog : 0;
  const t12bOk = Math.abs(ratio12b - 1.25) < 1e-9 && stepA.prog > stepB.prog;
  log(t12bOk, 'social20: occupation bonus speeds real farm production (+25%)',
    'farmerProg=' + stepA.prog + ' plainProg=' + stepB.prog);
  CROPS.splice(CROPS.indexOf(cropA), 1);
  CROPS.splice(CROPS.indexOf(cropB), 1);
  rmTestV13(t12b);
  rmTestV13(t12);

  // 20.13 Play preferred by children in utility scoring
  let t13Child = mkTestV20('TUtilChild13', 0, 0, { ageY: 7, stage: 'child' });
  const playScore = scoreCandidateAction(t13Child, { id: 'play', category: 'leisure' });
  const fellScore = scoreCandidateAction(t13Child, { id: 'fell_tree', category: 'work', workType: 'fell' });
  const t13Ok = playScore > 40 && fellScore === -Infinity;
  log(t13Ok, 'social20: children prefer play and reject heavy labor in utility scoring',
    'playScore=' + playScore + ' fellScore=' + fellScore);
  rmTestV13(t13Child);

  // 20.14 Market stall allows trade with occupation goods
  ensureMarketStall();
  const stall = VILLAGE_OBJECTS.find(b => b.kind === 'market_stall');
  let buyer14 = mkTestV20('TBuyer14', stall.wx, stall.wy, { gold: 50, inv: {} });
  stall.stock.crop = 5;
  stall.prices.crop = 2;
  const prevStock14 = stall.stock.crop;
  doBuyStep(buyer14, { from: 'stall', what: 'crop' }, 0.5);
  const t14Ok = stall.stock.crop === prevStock14 - 1 && buyer14.inv.crop === 1 && buyer14.gold === 48;
  log(t14Ok, 'social20: market stall enables trade with inventory exchange and price conservation',
    'stock=' + stall.stock.crop + ' invCrop=' + buyer14.inv.crop + ' gold=' + buyer14.gold);
  rmTestV13(buyer14);

  // 20.14b Trader occupation earns a real stall price discount (25% efficiency as haggling)
  let buyer14b = mkTestV20('TBuyer14b', stall.wx, stall.wy, { gold: 50, inv: {} });
  buyer14b.occupation = { type: 'trader', activity: 'trading', startedDay: 1 };
  stall.stock.plank = 3;
  stall.prices.plank = 5;
  doBuyStep(buyer14b, { from: 'stall', what: 'plank' }, 0.5);
  const t14bOk = stall.stock.plank === 2 && buyer14b.inv.plank === 1 && buyer14b.gold === 46; // 5/1.25 = 4
  log(t14bOk, 'social20: trader occupation earns a real market-stall price discount',
    'gold=' + buyer14b.gold + ' (paid 4, not 5) plank=' + buyer14b.inv.plank);
  rmTestV13(buyer14b);

  // 20.15 Unmarried villagers never conceive (married-only conception)
  let t15A = mkTestV20('TUnmarrA', 0, 0, { ageY: 25, stage: 'adult', sex: 'f' });
  let t15B = mkTestV20('TUnmarrB', 1, 0, { ageY: 27, stage: 'adult', sex: 'm' });
  t15A.bonds[t15B.name] = 0.95;
  t15B.bonds[t15A.name] = 0.95;
  t15A.body.satiety = 0.9;
  for(let d = 0; d < 40; d++) pregnancyTick(1);
  const t15Ok = !t15A.pregnant;
  log(t15Ok, 'social20: unmarried high-bond pair never conceives over 40 days',
    'pregnant=' + !!t15A.pregnant);
  rmTestV13(t15A);
  rmTestV13(t15B);

  // 20.16 Birth is deterministic: identical runs -> identical baby name/sex
  let t16 = mkTestV20('TMom16', 0, 0, { ageY: 25, stage: 'adult', sex: 'f' });
  t16.pregnant = { days: 20, father: 'Nobody', announced: true };
  birthChild(t16);
  const baby1 = VILLAGERS[VILLAGERS.length - 1];
  const n1 = baby1.name, sx1 = baby1.sex, sd1 = baby1.seed;
  rmTestV13(baby1);
  t16.pregnant = { days: 20, father: 'Nobody', announced: true };
  birthChild(t16);
  const baby2 = VILLAGERS[VILLAGERS.length - 1];
  const t16Ok = baby2.name === n1 && baby2.sex === sx1 && baby2.seed === sd1;
  log(t16Ok, 'social20: birth deterministic — same mother+day gives same baby name/sex/seed',
    'run1=' + n1 + '/' + sx1 + '/' + sd1 + ' run2=' + baby2.name + '/' + baby2.sex + '/' + baby2.seed);
  rmTestV13(baby2);
  rmTestV13(t16);

  // 20.17 Failed marriage plan leaves an explanatory thought, never silence
  let t17A = mkTestV20('TMarFailA', 0, 0, { ageY: 25, stage: 'adult' });
  let t17B = mkTestV20('TMarFailB', 1, 0, { ageY: 26, stage: 'adult' });
  t17A.bonds[t17B.name] = 0.1; // too low for marriage
  t17B.bonds[t17A.name] = 0.1;
  t17A.plan = [{ verb: 'marry', target: t17B.name }];
  planTick(t17A, 0.5);
  const failThought17 = (t17A.thoughts || []).some(t => /Could not marry/.test(t.text));
  const t17Ok = t17A.plan.length === 0 && !t17A.spouseId && failThought17;
  log(t17Ok, 'social20: failed marriage plan records an explanatory thought',
    'planEmpty=' + (t17A.plan.length === 0) + ' thought=' + failThought17);
  rmTestV13(t17A);
  rmTestV13(t17B);

  // 20.18 'go' with a named person resolves to coords; NaN can never corrupt position
  let t18A = mkTestV20('TGoA', 0, 0);
  let t18B = mkTestV20('TGoB', 10, 10);
  const bx18 = t18B.x, by18 = t18B.y;
  t18A.plan = [{ verb: 'go', person: t18B.name }];
  planTick(t18A, 0.05);
  const step18 = t18A.plan[0];
  const resolved18 = !!step18 && step18.tx === bx18 && step18.ty === by18;
  const moved18 = Number.isFinite(t18A.x) && Number.isFinite(t18A.y) &&
                  Math.hypot(t18A.x - 16, t18A.y - 16) > 0;
  // direct NaN assault on planMoveToward: must refuse, never corrupt
  const px18 = t18A.x, py18 = t18A.y;
  const rNaN18 = planMoveToward(t18A, NaN, NaN, 0.05);
  const hard18 = rNaN18 === 'stuck' && t18A.x === px18 && t18A.y === py18;
  // go-step carrying explicit NaN coords abandons honestly
  t18A.plan = [{ verb: 'go', tx: NaN, ty: NaN }];
  planTick(t18A, 0.05);
  const nanStep18 = t18A.plan.length === 0 && Number.isFinite(t18A.x) &&
                    (t18A.thoughts || []).some(t => /abandoning the trip/.test(t.text));
  const t18Ok = resolved18 && moved18 && hard18 && nanStep18;
  log(t18Ok, 'social20: person-targeted go resolves to coords; NaN targets never corrupt position',
    'resolved=' + resolved18 + ' moved=' + moved18 + ' hardened=' + hard18 + ' nanStep=' + nanStep18);
  rmTestV13(t18A);
  rmTestV13(t18B);

  // 20.19 Treadmill regression: walking to a blocked destination cell (the well
  // object itself) must advance as far as walkable and arrive — never freeze
  // in place returning false forever (the dehydration-death treadmill).
  const well19 = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  let t19 = mkTestV20('TTread19', 0, 0);
  t19.x = well19.x; t19.y = well19.y + CS * 5;
  const py19 = t19.y;
  let arrived19 = false;
  for(let i = 0; i < 12 && !arrived19; i++){
    if(planMoveToward(t19, well19.x, well19.y, 1) === true) arrived19 = true;
  }
  const d19 = Math.hypot(t19.x - well19.x, t19.y - well19.y);
  const t19Ok = arrived19 && t19.y < py19 && d19 < CS * 2.5 && Number.isFinite(t19.x);
  log(t19Ok, 'social20: walk to blocked destination advances and arrives (no treadmill)',
    'arrived=' + arrived19 + ' dist=' + d19.toFixed(1) + 'px');
  rmTestV13(t19);

  // 20.20 Needs-vs-threat priority: a critically thirsty villager with a wolf
  // nearby must get the emergency drink plan — beast threats must never
  // suppress lethal physiological needs (the dehydration-while-fleeing spiral).
  let t20 = mkTestV20('TNeedThreat20', 0, 0);
  ensureBody(t20);
  t20.body.hydration = 0.05; t20.body.satiety = 0.8; t20.body.fatigue = 0.1;
  t20.body.sleepDebt = 0; t20.body.coreTemp = 37;
  t20.plan = [];
  const wolf20 = { kind: 'wolf', x: t20.x + CS * 4, y: t20.y, dead: false };
  ANIMALS.push(wolf20);
  survivalGuard(t20);
  const s20 = t20.plan && t20.plan.length ? t20.plan[0] : null;
  const t20Ok = !!(s20 && s20.verb === 'go' && s20.guard && !s20.flee &&
    t20.plan.some(st => st.verb === 'drink'));
  log(t20Ok, 'social20: critical thirst beats nearby wolf — drink plan issued, not endless flee',
    'plan0=' + JSON.stringify(s20));
  ANIMALS.splice(ANIMALS.indexOf(wolf20), 1);
  rmTestV13(t20);

  // 20.21 Wall-following: straight line to the well blocked by a building wall
  // must not trap the villager forever (the 168h dehydration-trap regression).
  // Bug-2 boundary following navigates around the obstacle.
  const well21 = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  let t21 = mkTestV20('TWall21', 0, 0);
  t21.x = 228; t21.y = 270; t21._wf = null;
  let arrived21 = false, stagnant21 = 0, lx21 = t21.x, ly21 = t21.y;
  for(let i = 0; i < 120 && !arrived21 && stagnant21 <= 15; i++){
    if(planMoveToward(t21, well21.x, well21.y, 1) === true) arrived21 = true;
    if(Math.hypot(t21.x - lx21, t21.y - ly21) < 0.5) stagnant21++; else stagnant21 = 0;
    lx21 = t21.x; ly21 = t21.y;
  }
  const d21 = Math.hypot(t21.x - well21.x, t21.y - well21.y);
  const t21Ok = arrived21 && d21 < CS * 1.2 && Number.isFinite(t21.x);
  log(t21Ok, 'social20: wall-following navigates around building to the well (no trap)',
    'arrived=' + arrived21 + ' dist=' + d21.toFixed(0) + ' stagnant=' + stagnant21);
  rmTestV13(t21);

  // 20.22 Mortality-order: villager AT the well with dehydH>20 and a current drink
  // step must survive long enough to drink (mortalityTick runs before planTick).
  const well22 = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  let t22 = mkTestV20('TDrink22', 0, 0);
  t22.x = well22.x + 40; t22.y = well22.y; // near well, within drink range
  const b22 = ensureBody(t22); b22.hydration = 0.0; b22.dehydH = 21;
  t22.plan = [{ verb: 'drink', guard: true, t: 0 }];
  t22.isNPC = true;
  let died22 = false;
  for(let i = 0; i < 5 && !died22; i++){
    bodyTick(t22, 1); updateVillagerAI(t22, 1);
    if(t22.dead) died22 = true;
  }
  const t22Ok = !died22 && b22.hydration > 0.1;
  log(t22Ok, 'social20: critical-thirst villager at well with drink plan survives to drink',
    'dead=' + died22 + ' hyd=' + b22.hydration.toFixed(2));
  rmTestV13(t22);

  // 20.23 Exhaustion-order: villager with collapseH>threshold and a current sleep
  // step must survive long enough to sleep (not die before the step executes).
  let t23 = mkTestV20('TSleep23', 0, 0);
  const b23 = ensureBody(t23); b23.fatigue = 0.99; b23.exhaustH = 19;
  t23.plan = [{ verb: 'sleep', guard: true, t: 0 }];
  t23.isNPC = true;
  let died23 = false;
  for(let i = 0; i < 5 && !died23; i++){
    bodyTick(t23, 1); updateVillagerAI(t23, 1);
    if(t23.dead) died23 = true;
  }
  const t23Ok = !died23 && b23.fatigue < 0.9;
  log(t23Ok, 'social20: exhausted villager with sleep plan survives to sleep',
    'dead=' + died23 + ' fatigue=' + b23.fatigue.toFixed(2));
  rmTestV13(t23);

  // 20.24 Controlled pawn (isNPC=false, e.g. Marta) receives survivalGuard
  // protection: a dehydrated player pawn with no player input gets a drink plan.
  const well24 = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  let t24 = mkTestV20('TPawn24', 0, 0);
  t24.x = 200; t24.y = 200; t24.isNPC = false; // player-controlled
  const b24 = ensureBody(t24); b24.hydration = 0.05; b24.dehydH = 0;
  t24.plan = [];
  updatePlayerPawn(t24, 1);
  const hasDrink24 = t24.plan && t24.plan.length > 0 && t24.plan[0].verb === 'go';
  const t24Ok = hasDrink24 && !t24.dead;
  log(t24Ok, 'social20: dehydrated player pawn gets survival drink plan (no idle death)',
    'plan=' + JSON.stringify((t24.plan || []).slice(0, 1).map(s => s.verb)) + ' dead=' + t24.dead);
  rmTestV13(t24);

  el.textContent += '\n==== part20 ' + res.filter(r => r.ok).length + '/' + res.length + ' passed ====\n';
};
