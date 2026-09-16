/* =====================================================================
   PART 25 AUTOTEST — Phase 6B: Adaptation & Ecology ("Thích ứng & Sinh thái")
   Automated verification of:
     25.1 (B1 Candidates): Dynamic candidate generation on blocked action
                           (<= 3 candidates from templates + beliefs + habit,
                           all have reason strings, deterministic tie-breaking)
     25.2 (B1 WHY): WHY inspector transparent reason integration (explainAction,
                    decision.winner.reason, candidate reasons, #pi-why HUD)
     25.2b (B1 Stash): Dynamic candidate reason/name uses exact food kind from belief
                       (berry stash produces "berries" not "bread")
     25.3 (B2 Depletion): Carrying capacity & bush depletion (1st harvest -> 0.4,
                          2nd harvest -> <= 0; winter regen = 0; spring regrows)
     25.4 (B2 Seasons): 4 seasons ecology (crops paused in winter vs 1.2x in summer;
                        bear hibernation in winter; tree regen paused in winter)
     25.5 (B2 Wolves): 2-state wolf AI (normal wolf deterred by torch/crowd;
                       starving wolf hunger >= 0.8 overrides fear and attacks)
     25.6 (B3 Weather): Weather-fire causal chain (dryDays -> dryness, rain/snow
                        extinguishes fires, fuel calculation by terrain/structures)
     25.7 (B3 Burn/Ash): Burned tile marked scorched, vegetation cleared, ash pile
                         spawned with provenance 'burned'
     25.8 (B3 Firefight): Firefighting system selects threatened fires, douses and
                          clears burning tiles safely before destruction
     25.9 (Probe): Performance sanity probe measuring avg ms/tick for soulTick
                   across 20 villagers over 3 game days (144 ticks)
     25.10 (Cleanup): No test entities or villagers leaked
   ===================================================================== */
function mkTestV25(name, wx, wy, extra){
  const v = mkTestV24(name, wx, wy, extra);
  return v;
}

const __runAutoTest25 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest25();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: Boolean(ok), title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const madeNames = [];
  function mk(name, wx, wy, extra){
    const v = mkTestV25(name, wx, wy, extra);
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
  // 25.1 (B1 Candidates): Dynamic Candidate Generation
  // When an action is blocked: queries beliefs, habit, and goal templates.
  // Returns AT MOST 3 candidates, all have transparent reason strings, deterministic.
  // -------------------------------------------------------------------
  const t1 = mk('T25_Dyn_Bram', -10, 8, { habit: 'blacksmith', role: 'Master Blacksmith' });
  t1.canSwim = false;
  // Seed a belief about food at inn
  observe(t1, { kind: 'bread', name: 'fresh loaf', targetKey: 'inn' }, { source: 'direct', topic: 'inn_bread' });

  const blockedAct = { id: 'cross_bridge', name: 'Cross river bridge', targetKey: 'river_bridge' };
  markTargetUnreachable(t1, 'river_bridge');

  const cands1 = generateDynamicCandidates(t1, blockedAct, 'river_bridge blocked');
  const maxThree = cands1.length <= 3 && cands1.length > 0;
  const allHaveReason = cands1.every(c => typeof c.reason === 'string' && c.reason.length > 0);
  const blockedOmitted = !cands1.some(c => c.targetKey === 'river_bridge');
  const sourcesValid = cands1.every(c => c.source === 'habit' || c.source === 'template' || c.source === 'belief');
  const hasBelief = cands1.some(c => c.source === 'belief');

  // Determinism check: identical seed and state produce identical candidates
  const cands2 = generateDynamicCandidates(t1, blockedAct, 'river_bridge blocked');
  const deterministic = (cands1.length === cands2.length) &&
    cands1.every((c, i) => c.id === cands2[i].id && Math.abs(c.score - cands2[i].score) < 1e-6 && c.reason === cands2[i].reason);

  const candSummary = cands1.map(c => `${c.id}(${c.source})`).join(',');
  const ok25_1 = maxThree && allHaveReason && blockedOmitted && sourcesValid && hasBelief && deterministic;
  log(ok25_1, 'dynamicCandidates25: generate at most 3 candidates from beliefs+habit+templates with reasons and determinism',
    `count=${cands1.length} hasBelief=${hasBelief} cands=[${candSummary}] allHaveReason=${allHaveReason} blockedOmitted=${blockedOmitted} det=${deterministic}`);
  cleanup();

  // -------------------------------------------------------------------
  // 25.2 (B1 WHY): WHY Inspector Integration
  // explainAction includes currentAction.reason, winner.reason, and candidate reasons.
  // -------------------------------------------------------------------
  const t2 = mk('T25_Why_Inspect', 0, 0);
  const evalRes = evaluateVillagerUtility(t2);
  const explain = explainAction(t2.name);

  const hasDecision = explain && explain.decision != null;
  const winnerHasReason = hasDecision && explain.decision.winner && typeof explain.decision.winner.reason === 'string';
  const topHaveReasons = hasDecision && Array.isArray(explain.decision.top) &&
    explain.decision.top.every(c => c.reason == null || typeof c.reason === 'string');

  // Also verify currentAction reason if action is active
  if(t2.currentAction){
    t2.currentAction.reason = 'Testing action transparent justification';
  }
  const explainActive = explainAction(t2.name);
  const currentHasReason = !t2.currentAction || (explainActive.currentAction && explainActive.currentAction.reason === 'Testing action transparent justification');

  const ok25_2 = hasDecision && winnerHasReason && topHaveReasons && currentHasReason;
  log(ok25_2, 'whyInspector25: explainAction and decision trace include transparent reasons',
    `winnerReason="${explain.decision && explain.decision.winner && explain.decision.winner.reason}" topCount=${explain.decision ? explain.decision.top.length : 0}`);
  cleanup();

  // -------------------------------------------------------------------
  // 25.2b (B1 Reason / Food Kind): Dynamic Candidate Food Kind from Belief
  // Villager with a berry-stash belief (topic stash_*, content {kind:'berries', name:'berry cache', place:'north_woods'})
  // generateDynamicCandidates -> assert at least one candidate reason/name contains 'berries' (case-insensitive) and does NOT contain 'bread'.
  // -------------------------------------------------------------------
  const tBerry = mk('T25_Berry_Believer', 0, 0);
  observe(tBerry, { kind: 'berries', name: 'berry cache', place: 'north_woods' }, { topic: 'stash_berries' });
  const berryCands = generateDynamicCandidates(tBerry, null);
  const berryCand = berryCands.find(c => {
    const text = ((c.name || '') + ' ' + (c.reason || '')).toLowerCase();
    return text.includes('berries');
  });
  const hasBerriesNoBread = Boolean(berryCand && !(((berryCand.name || '') + ' ' + (berryCand.reason || '')).toLowerCase().includes('bread')));
  const ok25_2b = hasBerriesNoBread;
  log(ok25_2b, 'beliefFoodKind25: villager with berry-stash belief generates candidate with "berries" and not "bread"',
    `cands=${berryCands.length} matchName="${berryCand ? berryCand.name : 'none'}" matchReason="${berryCand ? berryCand.reason : 'none'}" hasBerriesNoBread=${hasBerriesNoBread}`);
  cleanup();

  // -------------------------------------------------------------------
  // 25.3 (B2 Depletion): Carrying Capacity & Bush Depletion
  // 1st harvest: drops capacity from 1.0 to 0.4.
  // 2nd harvest: completely depletes bush (<= 0), schedules regen day.
  // Winter: regen is 0 (does not regrow). Spring: regrows to 1.0.
  // -------------------------------------------------------------------
  const bwx = 150, bwy = 150;
  const bcc = cellChunk(bwx, bwy);
  if(!bcc.c.bush) bcc.c.bush = new Float32Array(bcc.c.tileType.length);
  if(!bcc.c.bushCells) bcc.c.bushCells = [];
  bcc.c.bush[bcc.i] = 1.0;
  if(bcc.c.bushCells.indexOf(bcc.i) < 0) bcc.c.bushCells.push(bcc.i);

  const t3 = mk('T25_Harvester', bwx, bwy);
  const origSeason = W.season;
  const origDay = W.day;
  W.season = 'Summer';
  W.day = 10;

  const spot = { kind: 'bush', wx: bwx, wy: bwy, x: bwx * CS + 16, y: bwy * CS + 16 };
  t3.x = spot.x; t3.y = spot.y;

  // First harvest -> capacity drops to 0.4
  doForageStep(t3, { verb: 'forage', spot: spot, prog: 0.5 }, 0.1);
  const capAfter1st = bcc.c.bush[bcc.i];
  const stillInCells = bcc.c.bushCells.indexOf(bcc.i) >= 0;

  // Second harvest -> depleted (<= 0) and removed from bushCells
  doForageStep(t3, { verb: 'forage', spot: spot, prog: 0.5 }, 0.1);
  const capAfter2nd = bcc.c.bush[bcc.i];
  const removedFromCells = bcc.c.bushCells.indexOf(bcc.i) < 0;

  // Winter zero-regen: advance 10 days in Winter, calling bushRegrowTick
  W.season = 'Winter';
  for(let d = 0; d < 10; d++){
    W.day++;
    bushRegrowTick(0.5);
  }
  const winterRegenZero = bcc.c.bush[bcc.i] <= 0;

  // Spring resumption: switch to Spring, advance to regrow day
  W.season = 'Spring';
  W.day = Math.abs(capAfter2nd) + 1;
  bushRegrowTick(0.5);
  const springRegrew = bcc.c.bush[bcc.i] === 1.0 && bcc.c.bushCells.indexOf(bcc.i) >= 0;

  // Restore world state
  W.season = origSeason;
  W.day = origDay;

  const ok25_3 = (Math.abs(capAfter1st - 0.4) < 1e-4) && stillInCells &&
                 (capAfter2nd <= 0) && removedFromCells && winterRegenZero && springRegrew;
  log(ok25_3, 'carryingCapacity25: bush harvesting depletes tile (1.0->0.4->depleted), 0 winter regen, spring recovery',
    `h1=${capAfter1st} h2=${capAfter2nd} winter=${winterRegenZero} springRegrew=${springRegrew}`);
  cleanup();

  // -------------------------------------------------------------------
  // 25.4 (B2 Seasons): 4 Seasons Ecology - Crops, Hibernation & Trees
  // Winter halts crop growth (mult 0x), Summer accelerates (mult 1.2x).
  // Bears hibernate during Winter (spawn rate 0). Winter halts tree regrowth.
  // -------------------------------------------------------------------
  const origSeason4 = W.season;
  const testCrop = { wx: 250, wy: 250, stage: 1, grow: 0, kind: 'wheat' };
  CROPS.push(testCrop);

  // Winter crop test
  W.season = 'Winter';
  cropTick(12);
  const winterCropGrowth = testCrop.grow; // Should be 0

  // Summer crop test
  W.season = 'Summer';
  cropTick(12);
  const summerCropGrowth = testCrop.grow; // (12 / 24) * 1.2 = 0.6

  // Bear hibernation test
  W.season = 'Winter';
  // Remove existing bears
  const bearsBefore = ANIMALS.filter(a => a.kind === 'bear');
  for(const b of bearsBefore) b.dead = true;
  for(let i = 0; i < 25; i++) worldSlowTick(24);
  const winterBearsSpawned = ANIMALS.some(a => a.kind === 'bear' && !a.dead);

  // Tree regrowth in Winter
  const testTree = { wx: 251, wy: 251, stage: 1 };
  WILDTREES.push(testTree);
  for(let i = 0; i < 20; i++) treeRegrowTick(1.0);
  const winterTreePaused = testTree.stage === 1;

  // Cleanup
  const cIdx = CROPS.indexOf(testCrop);
  if(cIdx >= 0) CROPS.splice(cIdx, 1);
  const tIdx = WILDTREES.indexOf(testTree);
  if(tIdx >= 0) WILDTREES.splice(tIdx, 1);
  W.season = origSeason4;

  const ok25_4 = (winterCropGrowth === 0) && (Math.abs(summerCropGrowth - 0.6) < 1e-4) &&
                 (!winterBearsSpawned) && winterTreePaused;
  log(ok25_4, 'seasonsEcology25: winter pauses crop growth, bear spawns (hibernation), and tree regrowth',
    `winterCrop=${winterCropGrowth} summerCrop=${summerCropGrowth} winterBear=${winterBearsSpawned} treePaused=${winterTreePaused}`);

  // -------------------------------------------------------------------
  // 25.5 (B2 Wolves): 2-State Wolf AI
  // Sated wolf (hunger < 0.8) flees from torch.
  // Starving wolf (hunger >= 0.8) has extreme hunger override fear and stalks/attacks.
  // -------------------------------------------------------------------
  const origAnimals = ANIMALS.slice();
  ANIMALS.length = 0;

  const tv1 = mk('T25_TorchBearer', 100, 100);
  tv1.hasTorch = true;
  tv1.torch = true;

  // 1. Sated wolf with torch nearby -> flees
  const satedWolf = {
    id: 991, kind: 'wolf', x: (100 * CS + 16) + CS * 2, y: 100 * CS + 16,
    hunger: 0.4, state: 'idle', dead: false, downed: false, hp: 50, maxHp: 50
  };
  ANIMALS.push(satedWolf);
  wolfBrain(satedWolf, 0.05);
  const satedFlees = satedWolf.state === 'flee';

  // 2. Starving wolf (hunger = 0.88 >= 0.8) with torch nearby -> hunger overrides fear
  const starvingWolf = {
    id: 992, kind: 'wolf', x: (100 * CS + 16) + CS * 2, y: 100 * CS + 16,
    hunger: 0.88, state: 'idle', dead: false, downed: false, hp: 50, maxHp: 50
  };
  ANIMALS.push(starvingWolf);
  wolfBrain(starvingWolf, 0.05);
  const starvingDoesNotFlee = starvingWolf.state !== 'flee';

  // Restore animals
  ANIMALS.length = 0;
  for(const a of origAnimals) ANIMALS.push(a);

  const ok25_5 = satedFlees && starvingDoesNotFlee;
  log(ok25_5, 'wolvesTwoState25: sated wolf flees torch; extreme hunger >= 0.8 overrides fear',
    `satedFlee=${satedFlees} starvingFlee=${starvingWolf.state === 'flee'}`);
  cleanup();

  // -------------------------------------------------------------------
  // 25.6 (B3 Weather): Weather-Fire Causal Chain
  // dryDays accumulation -> dryness factor (0..1). Rain resets dryness.
  // Rain/snow accelerates fire extinguishment.
  // -------------------------------------------------------------------
  const origDryDays = W.dryDays;
  const origRain = W.rain;
  const origBurning = BURNING.slice();
  BURNING.length = 0;

  // Dryness calculation check
  W.dryDays = 0; W.rain = 0;
  const dryZero = getDryness() === 0;

  W.dryDays = 15; W.rain = 0;
  const dryHigh = getDryness() >= 0.75;

  W.dryDays = 15; W.rain = 0.5; // Rain suppresses dryness
  const dryRainSuppressed = getDryness() === 0;

  // Fire extinguishment under rain vs dry
  const fireDry = { wx: 400, wy: 400, t: 10.0 };
  const fireRain = { wx: 401, wy: 401, t: 10.0 };

  // 1 tick of dry weather
  BURNING.push(fireDry);
  W.rain = 0.0; W.dryDays = 10;
  wildfireTick(1.0);
  const dryLoss = 10.0 - fireDry.t;

  // 1 tick of wet weather
  BURNING.length = 0;
  BURNING.push(fireRain);
  W.rain = 0.8;
  wildfireTick(1.0);
  const rainLoss = 10.0 - fireRain.t;

  const rainExtinguishesFaster = rainLoss > dryLoss * 3;

  // Fuel calculation checks
  const waterFuel = getCellFuel(28, 7); // lake / deep water tile
  const bridgeFuel = getCellFuel(13, -8); // wooden bridge

  // Restore weather state
  BURNING.length = 0;
  for(const b of origBurning) BURNING.push(b);
  W.dryDays = origDryDays;
  W.rain = origRain;

  const ok25_6 = dryZero && dryHigh && dryRainSuppressed && rainExtinguishesFaster && (waterFuel === 0);
  log(ok25_6, 'weatherFireChain25: dryDays creates dryness; rain extinguishes fires rapidly; water has 0 fuel',
    `dryZero=${dryZero} dryHigh=${dryHigh} rainLoss=${rainLoss.toFixed(1)} dryLoss=${dryLoss.toFixed(1)} waterFuel=${waterFuel}`);

  // -------------------------------------------------------------------
  // 25.7 (B3 Burn/Ash): Burned Tile -> Scorched Chunk & Ash Pile with Provenance
  // When burning tile expires, marks chunk scorched and drops ash pile with provenance 'burned'.
  // -------------------------------------------------------------------
  const burnWx = 500, burnWy = 500;
  const bChunk = cellChunk(burnWx, burnWy);
  const fireTile = { wx: burnWx, wy: burnWy, t: 0.1 };
  BURNING.push(fireTile);

  // Tick until fire burns out
  W.rain = 0; W.dryDays = 5;
  wildfireTick(0.2); // b.t <= 0 -> onTileBurned called

  const tileBurnedOut = !BURNING.some(b => b.wx === burnWx && b.wy === burnWy);
  const chunkScorched = bChunk.c && bChunk.c.scorched && bChunk.c.scorched[bChunk.i] === 1;

  // Check ash pile created at coords
  const ashAx = burnWx * CS + 16, ashAy = burnWy * CS + 16;
  const ashPile = PILES.find(p => p.items && p.items.ash > 0 && Math.hypot(p.x - ashAx, p.y - ashAy) < CS);
  const ashProvBurned = ashPile && ashPile.provenance === 'burned';

  // Clean up
  if(ashPile){
    const pi = PILES.indexOf(ashPile);
    if(pi >= 0) PILES.splice(pi, 1);
  }
  if(bChunk.c && bChunk.c.scorched) bChunk.c.scorched[bChunk.i] = 0;

  const ok25_7 = tileBurnedOut && chunkScorched && ashProvBurned;
  log(ok25_7, 'tileBurnedAsh25: burned tile marks chunk scorched and drops ash pile with provenance "burned"',
    `burnedOut=${tileBurnedOut} scorched=${Boolean(chunkScorched)} ashProv=${ashPile && ashPile.provenance}`);

  // -------------------------------------------------------------------
  // 25.8 (B3 Firefight): Firefighting System Integration
  // Fire near building receives elevated firePriority; firefighter douses it.
  // -------------------------------------------------------------------
  const bld = VILLAGE_BUILDINGS[0] || { wx: 0, wy: 0, tw: 4, th: 4, name: 'Townhall' };
  const threatFire = { wx: bld.wx + 1, wy: bld.wy + 1, t: 8.0 };
  BURNING.push(threatFire);

  const prio = firePriority(threatFire);
  const prioElevated = prio > 5;

  const firefighter = mk('T25_Firefighter', bld.wx + 2, bld.wy + 2);
  firefighter.wetBucket = true; // bucket loaded

  // Execute douse step
  const douseStep = { verb: 'douse', fire: threatFire, prog: 0.4 };
  doDouseStep(firefighter, douseStep, 0.2); // prog reaches 0.6 >= 0.5 -> extinguished

  const fireExtinguished = !BURNING.some(b => b === threatFire);
  if(!fireExtinguished){
    const fIdx = BURNING.indexOf(threatFire);
    if(fIdx >= 0) BURNING.splice(fIdx, 1);
  }

  const ok25_8 = prioElevated && fireExtinguished;
  log(ok25_8, 'firefighting25: threat fire receives elevated priority and is safely doused by villager',
    `prio=${prio.toFixed(1)} extinguished=${fireExtinguished}`);
  cleanup();

  // -------------------------------------------------------------------
  // 25.9 (Probe): Performance Sanity Probe
  // Measure avg ms/tick (soulTick across all villagers) on a populated village
  // (20 villagers, 3 game days = 72 hours = 144 ticks at 0.5h/tick).
  // -------------------------------------------------------------------
  const initialVillagersCount = VILLAGERS.length;
  const extraNeeded = Math.max(0, 20 - initialVillagersCount);
  const extraVills = [];
  for(let i = 0; i < extraNeeded; i++){
    const ev = mk(`T25_PerfV_${i}`, -5 + (i % 4) * 2, -5 + Math.floor(i / 4) * 2, {
      role: 'Villager',
      isNPC: true
    });
    extraVills.push(ev);
  }

  const totalVillagers = VILLAGERS.length;
  const simHours = 72; // 3 game days
  const stepH = 0.5;
  const totalTicks = Math.round(simHours / stepH); // 144 ticks

  const tStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  for(let tick = 0; tick < totalTicks; tick++){
    for(const v of VILLAGERS){
      if(!v.dead){
        soulTick(v, stepH);
      }
    }
  }
  const tEnd = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const elapsedMs = tEnd - tStart;
  const avgMsPerTick = elapsedMs / totalTicks;
  const avgMsPerVillagerTick = avgMsPerTick / totalVillagers;

  // Clean up extra villagers
  cleanup();

  // Performance criterion: avg ms per tick should be reasonable (e.g. < 25ms in Node.js)
  const ok25_9 = avgMsPerTick < 25.0 && totalVillagers >= 20;
  log(ok25_9, 'perfProbe25: soulTick performance probe on populated village (20 villagers, 3 game days)',
    `totalTime=${elapsedMs.toFixed(1)}ms ticks=${totalTicks} avgMs/tick=${avgMsPerTick.toFixed(4)}ms avgMs/villager/tick=${avgMsPerVillagerTick.toFixed(4)}ms`);

  // -------------------------------------------------------------------
  // 25.10 (Cleanup): Verify No Leaked Test Entities
  // -------------------------------------------------------------------
  cleanup();
  const leakedV = VILLAGERS.filter(v => v && v.name && v.name.startsWith('T25_'));
  const leakedCrops = CROPS.filter(c => c && c.wx >= 250);
  const leakedFires = BURNING.filter(b => b && b.wx >= 400);

  const ok25_10 = leakedV.length === 0 && leakedCrops.length === 0 && leakedFires.length === 0;
  log(ok25_10, 'cleanup25: part25 cleans up all test entities without leaking',
    `leakedVillagers=${leakedV.length} leakedCrops=${leakedCrops.length} leakedFires=${leakedFires.length}`);

  el.textContent += `part25 done ==== ${res.filter(r => r.ok).length}/${res.length} passed ====\n`;
};
