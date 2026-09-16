/* =====================================================================
   PART 17 AUTOTEST — Phase 2B: Building entities, new locations & river.
   ===================================================================== */
const __runAutoTest17 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest17();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const runPlan = (v, maxIter) => {
    for(let i = 0; i < (maxIter || 400) && v.plan && v.plan.length; i++) planTick(v, 0.1);
  };

  // 17.1 Building entity model: properties exist on buildings
  const fh = VILLAGE_BUILDINGS.find(b => b.id === 'farmhouse');
  const innBld = VILLAGE_BUILDINGS.find(b => b.id === 'inn');
  const propsOk = !!fh && !!innBld &&
    typeof fh.indoorTemp === 'number' &&
    typeof fh.cleanliness === 'number' &&
    typeof fh.capacity === 'number' &&
    typeof fh.daysUnoccupied === 'number' &&
    fh.owner === 'Marta' &&
    innBld.hasFire === true && innBld.fireplaceLit === true;
  log(propsOk, 'building17: building entity properties exist',
    fh ? ('farmhouse owner=' + fh.owner + ' cap=' + fh.capacity + ' temp=' + fh.indoorTemp) : 'missing');

  // 17.2 Indoor temperature dynamics: fire warms, unlit cools
  const testBldWarm = {
    id: 'test_warm_bld', name: 'Warm Cottage',
    wx: -30, wy: -30, tw: 4, th: 4, x: -30*CS, y: -30*CS,
    indoorTemp: 10.0, cleanliness: 1.0, capacity: 4,
    hasFire: true, fireplaceLit: true, daysUnoccupied: 0, residents: []
  };
  const testBldCold = {
    id: 'test_cold_bld', name: 'Cold Cottage',
    wx: -35, wy: -35, tw: 4, th: 4, x: -35*CS, y: -35*CS,
    indoorTemp: 22.0, cleanliness: 1.0, capacity: 4,
    hasFire: false, fireplaceLit: false, daysUnoccupied: 0, residents: []
  };
  VILLAGE_BUILDINGS.push(testBldWarm, testBldCold);
  const oldTemp = W.temp;
  W.temp = 0.0; // winter freezing outdoor temp
  for(let step = 0; step < 20; step++) buildingTick(0.5); // 10 sim hours
  const warmRose = testBldWarm.indoorTemp > 18.0;
  const coldDropped = testBldCold.indoorTemp < 15.0;
  W.temp = oldTemp;
  // Cleanup test buildings
  const idxW = VILLAGE_BUILDINGS.indexOf(testBldWarm);
  if(idxW >= 0) VILLAGE_BUILDINGS.splice(idxW, 1);
  const idxC = VILLAGE_BUILDINGS.indexOf(testBldCold);
  if(idxC >= 0) VILLAGE_BUILDINGS.splice(idxC, 1);
  log(warmRose && coldDropped, 'building17: indoor temperature dynamics (fire warms, winter cools)',
    'warmBldTemp=' + testBldWarm.indoorTemp.toFixed(1) + ' coldBldTemp=' + testBldCold.indoorTemp.toFixed(1));

  // 17.3 Capacity & Overcrowding penalties
  const testCrowd = {
    id: 'test_crowd_bld', name: 'Tiny Hut',
    wx: 10, wy: 10, tw: 4, th: 4, x: 10*CS, y: 10*CS,
    indoorTemp: 20.0, cleanliness: 1.0, capacity: 1,
    hasFire: false, fireplaceLit: false, daysUnoccupied: 0, residents: []
  };
  VILLAGE_BUILDINGS.push(testCrowd);
  const p1 = mkTestV15('TCrowd1', 10, 10);
  const p2 = mkTestV15('TCrowd2', 10, 10);
  p1.state = 'sleep'; p1.inBuilding = true;
  p2.state = 'sleep'; p2.inBuilding = true;
  p1.mood = 0.8; p2.mood = 0.8;
  for(let step = 0; step < 10; step++) buildingTick(0.2); // 2 hours
  const overcrowded = testCrowd.overcrowded === true;
  const hasPenalty = (p1.thoughts.some(th => /overcrowd/i.test(th.text)) || p2.thoughts.some(th => /overcrowd/i.test(th.text))) &&
                     (p1.mood < 0.8 || p2.mood < 0.8);
  const idxCr = VILLAGE_BUILDINGS.indexOf(testCrowd);
  if(idxCr >= 0) VILLAGE_BUILDINGS.splice(idxCr, 1);
  rmTestV13(p1); rmTestV13(p2);
  log(overcrowded && hasPenalty, 'building17: capacity and overcrowding mood penalty verified',
    'overcrowded=' + overcrowded + ' penalty=' + hasPenalty);

  // 17.4 Ownership tracking
  const sm = VILLAGE_BUILDINGS.find(b => b.id === 'smithy');
  const smithOwner = getBuildingOwner(sm);
  setBuildingOwner(sm, 'Bram');
  const ownerOk = smithOwner === 'Bram' && sm.residents && sm.residents.includes('Bram');
  log(ownerOk, 'building17: ownership tracked honestly and queries work',
    'owner=' + smithOwner + ' residents=' + JSON.stringify(sm ? sm.residents : []));

  // 17.5 Expansion costs materials and increases capacity
  const testExpBld = {
    id: 'test_exp_bld', name: 'Expandable Cottage',
    wx: 12, wy: 12, tw: 4, th: 4, x: 12*CS, y: 12*CS,
    door: { wx: 14, wy: 16 },
    indoorTemp: 20.0, cleanliness: 1.0, capacity: 2,
    hasFire: false, fireplaceLit: false, daysUnoccupied: 0, residents: []
  };
  VILLAGE_BUILDINGS.push(testExpBld);
  const pExp = mkTestV15('TExp', 14, 16);
  pExp.inv.log = 6;
  pExp.inv.stone = 4;
  pExp.plan = [{ verb: 'expand', building: 'test_exp_bld' }];
  runPlan(pExp, 100);
  const expOk = testExpBld.capacity === 4 && (pExp.inv.log || 0) === 0 && (pExp.inv.stone || 0) === 0;
  const idxExp = VILLAGE_BUILDINGS.indexOf(testExpBld);
  if(idxExp >= 0) VILLAGE_BUILDINGS.splice(idxExp, 1);
  rmTestV13(pExp);
  log(expOk, 'building17: expansion costs wood/stone and adds capacity',
    'newCap=' + testExpBld.capacity + ' logs=' + (pExp.inv.log || 0) + ' stone=' + (pExp.inv.stone || 0));

  // 17.6 Abandonment decay: fast cleanliness decay + structural integrity loss
  const testAbBld = {
    id: 'test_ab_bld', name: 'Deserted Hut',
    wx: 50, wy: 50, tw: 4, th: 4, x: 50*CS, y: 50*CS,
    indoorTemp: 20.0, cleanliness: 1.0, capacity: 2, integrity: 1.0, maxInteg: 1.0,
    hasFire: false, fireplaceLit: false, daysUnoccupied: 3.5, residents: []
  };
  VILLAGE_BUILDINGS.push(testAbBld);
  for(let step = 0; step < 24; step++) buildingTick(1.0); // 24 sim hours (1 day)
  const abOk = testAbBld.abandoned === true && testAbBld.cleanliness < 0.6 && testAbBld.integrity < 1.0;
  const idxAb = VILLAGE_BUILDINGS.indexOf(testAbBld);
  if(idxAb >= 0) VILLAGE_BUILDINGS.splice(idxAb, 1);
  log(abOk, 'building17: abandonment causes fast cleanliness decay and structural decay',
    'cleanliness=' + testAbBld.cleanliness.toFixed(2) + ' integrity=' + testAbBld.integrity.toFixed(3));

  // 17.7 Demolition reclaims fraction of materials
  const testDemBld = {
    id: 'test_dem_bld', name: 'Old Shack',
    wx: 16, wy: 16, tw: 4, th: 4, x: 16*CS, y: 16*CS,
    door: { wx: 18, wy: 20 },
    indoorTemp: 20.0, cleanliness: 1.0, capacity: 2, integrity: 0.5, maxInteg: 1.0,
    hasFire: false, fireplaceLit: false, daysUnoccupied: 0, residents: [],
    materials: { log: 12, stone: 8 }
  };
  VILLAGE_BUILDINGS.push(testDemBld);
  const pDem = mkTestV15('TDem', 18, 20);
  pDem.inv.log = 0;
  pDem.inv.stone = 0;
  pDem.plan = [{ verb: 'demolish', building: 'test_dem_bld' }];
  runPlan(pDem, 100);
  const demRemoved = !VILLAGE_BUILDINGS.some(b => b.id === 'test_dem_bld');
  const demReclaimed = (pDem.inv.log || 0) === 6 && (pDem.inv.stone || 0) === 4;
  rmTestV13(pDem);
  log(demRemoved && demReclaimed, 'building17: demolition removes building and reclaims 50% materials',
    'removed=' + demRemoved + ' logs=' + (pDem.inv.log || 0) + ' stone=' + (pDem.inv.stone || 0));

  // 17.8 River: deterministic worldgen, bridge traversability, drinkable & fishable
  const rc1 = getRiverCenter(-8);
  const rc2 = getRiverCenter(-8);
  const riverCenter = Math.round(rc1);
  const riverCell = cellChunk(riverCenter, -12); // unbridged row
  const riverWater = riverCell.c.tileType[riverCell.i] === 2 || riverCell.c.tileType[riverCell.i] === 6;

  // Bridge check at wy = -8: non-swimmer can traverse from west to east bank
  const garethPawn = VILLAGERS.find(v => v.name === 'Gareth') || { isNPC: true, canSwim: false };
  let bridgeTraversable = true;
  for(let bx = riverCenter - 2; bx <= riverCenter + 2; bx++){
    const bridgeCell = cellChunk(bx, -8);
    const depth = getWaterDepth(bx, -8);
    const move = canMoveTo(bx * CS + 16, -8 * CS + 16, garethPawn);
    if(bridgeCell.c.tileType[bridgeCell.i] !== 5 || depth !== 0 || !move.ok){
      bridgeTraversable = false;
      break;
    }
  }

  // Drink test at river bridge
  const pDrink = mkTestV15('TDrinkRiver', riverCenter, -8);
  pDrink.body.hydration = 0.3;
  const drank = doDrinkStep(pDrink, { t: 0 }, 0.5);
  const hydrated = pDrink.body.hydration > 0.5;

  // Fish test at river bridge
  const pFish = mkTestV15('TFishRiver', riverCenter, -8);
  pFish.inv.fish = 0;
  let caughtFish = false;
  for(let cast = 0; cast < 20; cast++){
    doFishStep(pFish, { t: 0, cast: 0.6, hours: 4, place: 'river' }, 0.6);
    if((pFish.inv.fish || 0) > 0){ caughtFish = true; break; }
  }
  rmTestV13(pDrink); rmTestV13(pFish);

  log(rc1 === rc2 && riverWater && bridgeTraversable && hydrated && caughtFish,
    'building17: river is deterministic, bridge traversable, drinkable and fishable',
    'rc=' + rc1.toFixed(2) + ' riverWater=' + riverWater + ' bridgeOk=' + bridgeTraversable + ' drink=' + hydrated + ' fish=' + caughtFish);

  // 17.9 New functional buildings: barn, workshop, kitchen, inn verified
  const hasBarn = CONSTRUCT.barn && CONSTRUCT.barn.needs && CONSTRUCT.barn.capacity === 8;
  const hasWorkshop = CONSTRUCT.workshop && CONSTRUCT.workshop.needs;
  const hasKitchen = CONSTRUCT.kitchen && CONSTRUCT.kitchen.hasFire;
  const innActive = VILLAGE_BUILDINGS.some(b => b.id === 'inn' && b.capacity >= 6);

  // Test workshop acts as workbench station for plank recipe
  const testWs = placeVillageBuilding('workshop', -38, -38, { id: 'test_ws_bld' });
  const station = recipeStationNear(VILLAGERS[0], 'workbench');
  const wsWorks = !!station && Math.hypot(station.x - (testWs.wx + 2)*CS, station.y - (testWs.wy + 4)*CS) < 30;
  const idxWs = VILLAGE_BUILDINGS.indexOf(testWs);
  if(idxWs >= 0) VILLAGE_BUILDINGS.splice(idxWs, 1);

  // Test inn serves meal and pays gold to Tobin
  const tobin = VILLAGERS.find(v => v.name === 'Tobin');
  const oldTobinGold = tobin ? (tobin.gold || 0) : 0;
  const pGuest = mkTestV15('TGuest', 4, 4);
  pGuest.gold = 10;
  pGuest.x = (innBld.wx + 2) * CS; pGuest.y = (innBld.wy + 5) * CS + 20;
  doBuyStep(pGuest, { from: 'inn', what: 'meal' }, 0.1);
  const boughtMeal = (pGuest.inv.meal || 0) === 1 && pGuest.gold === 2;
  const tobinPaid = tobin && (tobin.gold === oldTobinGold + 8);
  rmTestV13(pGuest);

  log(hasBarn && hasWorkshop && hasKitchen && innActive && wsWorks && boughtMeal && tobinPaid,
    'building17: functional buildings (barn, workshop, kitchen, inn) integrated with systems',
    'barn=' + hasBarn + ' ws=' + wsWorks + ' kit=' + hasKitchen + ' innTrade=' + (boughtMeal && tobinPaid));

  // 17.10 Intent parser compiles new verbs
  const pInt = mkTestV15('TIntent17', 0, 0);
  const intentTests = [
    ['clean the house', 'clean'],
    ['expand the barn', 'expand'],
    ['demolish the old hut', 'demolish'],
    ['repair the roof', 'repair']
  ];
  let intentsOk = true;
  for(const [text, verb] of intentTests){
    const parsed = parseIntent(pInt, text);
    if(!parsed.ok || !parsed.steps || !parsed.steps.some(st => st.verb === verb)){
      intentsOk = false;
      break;
    }
  }
  rmTestV13(pInt);
  log(intentsOk, 'building17: intent planner parses clean, expand, demolish, repair verbs',
    'intentsOk=' + intentsOk);

  // 17.11 Ghost-target safety: explicit unmatched target fails honestly, materials unspent
  const bldCountBefore = VILLAGE_BUILDINGS.length;
  const innExistsBefore = VILLAGE_BUILDINGS.some(b => b.id === 'inn');
  const pGhost = mkTestV15('TGhost', 0, 0);
  pGhost.inv.log = 6; pGhost.inv.stone = 4;
  const ghostDem = planForVerb(pGhost, { kind: 'demolish', target: 'hut' });
  const ghostDemOk = ghostDem && ghostDem.ok === false && /no building/i.test(ghostDem.reason || '');
  const ghostExp = planForVerb(pGhost, { kind: 'expand', target: 'barn' });
  const ghostExpOk = ghostExp && ghostExp.ok === false && /no building/i.test(ghostExp.reason || '');
  const ghostClean = planForVerb(pGhost, { kind: 'clean', target: 'old mill' });
  const ghostCleanOk = ghostClean && ghostClean.ok === false;
  const matsUnspent = (pGhost.inv.log || 0) === 6 && (pGhost.inv.stone || 0) === 4;
  const countSame = VILLAGE_BUILDINGS.length === bldCountBefore;
  const innUnharmed = VILLAGE_BUILDINGS.some(b => b.id === 'inn') === innExistsBefore;
  // Generic 'house'/'home' fallback still resolves to a real building
  const pGen = mkTestV15('TGeneric', 0, 0);
  const genPlan = planForVerb(pGen, { kind: 'clean', target: 'house' });
  const genHome = planForVerb(pGen, { kind: 'clean', target: 'home' });
  const genOk = genPlan && genPlan.ok === true && genPlan.steps && genPlan.steps.length > 0 &&
                genHome && genHome.ok === true;
  rmTestV13(pGhost); rmTestV13(pGen);
  log(ghostDemOk && ghostExpOk && ghostCleanOk && matsUnspent && countSame && innUnharmed && genOk,
    'building17: explicit unmatched building target fails honestly; generic house/home fallback works',
    'demOk=' + ghostDemOk + ' expOk=' + ghostExpOk + ' mats=' + (pGhost.inv.log || 0) + '/' + (pGhost.inv.stone || 0) + ' gen=' + genOk);

  const passed = res.filter(r => r.ok).length;
  el.textContent += '\n==== part17 ' + passed + '/' + res.length + ' passed ====\n';
  document.title = 'AUTOTEST ' + passed + '/' + res.length;
};
