function boot(){
  setupCanvas();
  if(typeof SF_MODE !== 'undefined' && SF_MODE){
    // SF Mission scenario: real OSM world + the 28-member modern cast
    sfInitWorld();
    buildTerrain(); buildVeg(); buildProps(); buildFx();
    buildSfTerrain(); buildSfVeg();
    sfInitCast();
    G.villagers = VILLAGERS;
    G.inspectedVillager = VILLAGERS[inspectedPawnIdx];
    initControls();
    updateHUD();
    requestAnimationFrame(loop);
    const qp = new URLSearchParams(location.search);
    if(qp.get('view') === 'street') SF_VIEW = 'street';
    if(qp.has('inspect')){
      const target = qp.get('inspect').toLowerCase();
      const idx = VILLAGERS.findIndex(v => v.name.toLowerCase() === target);
      if(idx !== -1){ inspectedPawnIdx = idx; cam.x = VILLAGERS[idx].x; cam.y = VILLAGERS[idx].y; updateHUD(); }
    }
    if(qp.has('test') || qp.has('autotest')) runAutoTest();
    return;
  }
  initVillageSettlement();
  initVillagers();

  // Prerender Willowbrook art assets
  buildTerrain();
  buildVeg();
  buildProps();
  buildBuildingArt();
  if(PA.bld.store) PA.bld.shop = PA.bld.store;
  buildFx();

  // Connect G and compile characters + dynamic attached tools
  G.villagers = VILLAGERS;
  G.inspectedVillager = VILLAGERS[inspectedPawnIdx];
  buildChars();
  VILLAGERS.forEach((v, i) => { v._ci = i; });

  initControls();
  updateHUD();

  requestAnimationFrame(loop);

  // Check query params for testing or inspection
  const qp = new URLSearchParams(location.search);
  if(qp.has('inspect')){
    const target = qp.get('inspect').toLowerCase();
    const idx = VILLAGERS.findIndex(v => v.name.toLowerCase() === target);
    if(idx !== -1){
      inspectedPawnIdx = idx;
      cam.x = VILLAGERS[idx].x;
      cam.y = VILLAGERS[idx].y;
      updateHUD();
    }
  }
  if(qp.has('pos')){
    const [px, py] = qp.get('pos').split(',').map(Number);
    const p = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
    if(p && !isNaN(px) && !isNaN(py)){
      p.x = px * CS + 16;
      p.y = py * CS + 16;
      cam.x = p.x;
      cam.y = p.y;
      updateHUD();
    }
  }
  if(qp.has('test') || qp.has('autotest')){
    runAutoTest();
  }
}

async function runAutoTest(){
  const el = document.getElementById('autotest');
  el.style.display = 'block';
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok, title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };

  await new Promise(r => setTimeout(r, 400));
  log(VILLAGERS.length >= 10, 'boot: villagers spawned', `${VILLAGERS.length} pawns`);
  log(VILLAGE_BUILDINGS.length === 11, 'settlement: 11 village buildings placed', 'inn, smithy, farm, etc.');
  log(VILLAGE_OBJECTS.length >= 6, 'settlement: village props active', 'well, anvil, lamps');
  log(!!chunkAt(0,0), 'natura: procedural chunk system active', 'chunk (0,0) generated');
  log(systems.length === 5, 'meteorology: dynamic pressure fronts drifting');

  // Test biological metabolism
  const marta = VILLAGERS[0];
  const b = ensureBody(marta);
  log(b.hydration > 0 && b.satiety > 0 && b.coreTemp > 35, 'biometrics: biological human metabolism verified');

  // Test solid building wall & prop collision
  const innBld = VILLAGE_BUILDINGS.find(b => b.id === 'inn');
  const wallCheck = canMoveTo(innBld.wx * CS + 20, (innBld.wy + 2) * CS + 20, marta);
  log(!wallCheck.ok && wallCheck.reason === 'building_wall', 'collision: solid building walls block characters');

  const smithyBld = VILLAGE_BUILDINGS.find(b => b.id === 'smithy');
  const wallBodyCheck = canMoveTo(smithyBld.wx * CS + 16, (smithyBld.wy + 1) * CS + 16, marta);
  log(!wallBodyCheck.ok && wallBodyCheck.reason === 'building_wall', 'collision: building wall body strictly blocks movement');

  const wellCheck = canMoveTo(16, 16, marta);
  log(!wellCheck.ok && wellCheck.reason === 'well', 'collision: solid well blocks characters');

  const anvilCheck = canMoveTo(-9 * CS + 16, 8 * CS + 16, marta);
  log(!anvilCheck.ok && anvilCheck.reason === 'anvil', 'collision: blacksmith anvil blocks characters');

  // Test water depth & shallow/deep mechanics
  const deepLakeDepth = getWaterDepth(28, 7);
  log(deepLakeDepth > 0.05, 'hydrology: lake center has deep water depth (> 0.05)', `depth: ${deepLakeDepth.toFixed(3)}`);

  const shallowShoreDepth = getWaterDepth(22, 6);
  log(shallowShoreDepth <= 0.05 && shallowShoreDepth > 0, 'hydrology: lake shore has shallow wading depth (<= 0.05)', `depth: ${shallowShoreDepth.toFixed(3)}`);

  // Test wooden pier bridge traversal over water
  const pierDepth = getWaterDepth(22, 7);
  log(pierDepth === 0, 'hydrology: wooden fishing pier provides dry bridge deck over lake');

  // Test swimmer vs non-swimmer traits & AI pathing
  const finn = VILLAGERS.find(v => v.name === 'Finn');
  const gareth = VILLAGERS.find(v => v.name === 'Gareth');
  const bram = VILLAGERS.find(v => v.name === 'Bram');
  log(finn && finn.canSwim === true && finn.swimSkill === 1.0, 'swimming: Finn the Fisherman is master swimmer');
  log(gareth && gareth.canSwim === false && gareth.swimReason.includes('armor'), 'swimming: Gareth in plate armor cannot swim');
  log(bram && bram.canSwim === false, 'swimming: Bram the blacksmith cannot swim');

  const garethWaterCheck = canMoveTo(28 * CS + 16, 7 * CS + 16, gareth);
  log(!garethWaterCheck.ok && garethWaterCheck.reason === 'cannot_swim', 'swimming: autonomous AI non-swimmers safely avoid deep water');

  const finnWaterCheck = canMoveTo(28 * CS + 16, 7 * CS + 16, finn);
  log(finnWaterCheck.ok && finnWaterCheck.isDeep === true, 'swimming: swimmers permitted to enter deep lake water');

  // Test AI bridge
  const perc = window.__aiBridge.getPerception('Marta');
  log(!!perc && Array.isArray(perc.body) && perc.body.length > 0 && perc.gold != null, 'ai_bridge: perception JSON pipeline verified (honest words + gold)');

  // Test Direction A chibi character rendering
  const f0 = PA.chars[0][0].idle[0];
  log(!!f0 && f0.width === 48 && f0.height === 64, 'graphics: Direction A chibi 48x64 sprites with specular catchlights');

  // Test tool attachment
  log(!!PA.tools.lute && !!PA.tools.hammer && !!PA.tools.hoe, 'graphics: dynamic attached tools prerendered');

  const passed = res.filter(r => r.ok).length;
  el.textContent += `\n==== ${passed}/${res.length} passed ====\n`;
  document.title = `AUTOTEST ${passed}/${res.length}`;
}
