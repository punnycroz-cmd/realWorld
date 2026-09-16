/* =====================================================================
   PART 17A: BUILDING ENTITIES & WORKSTATIONS — Phase 2B.
   Buildings as living simulation entities: indoor temperature dynamics,
   cleanliness decay & cleaning, capacity & overcrowding penalties,
   ownership tracking (household entities arrive in Phase 2E), expansion,
   abandonment decay, and demolition material reclamation.
   Functional buildings: barn, workshop, kitchen, inn.
   ===================================================================== */

/* ---- Building queries and helpers ---- */
function getBuildingAt(x, y){
  const wx = Math.floor(x / CS), wy = Math.floor(y / CS);
  for(const b of VILLAGE_BUILDINGS){
    if(wx >= b.wx && wx < b.wx + b.tw && wy >= b.wy && wy < b.wy + b.th){
      return b;
    }
  }
  return null;
}

function getBuildingForVillager(v){
  if(!v) return null;
  const bAt = getBuildingAt(v.x, v.y);
  if(bAt) return bAt;
  if(v.inBuilding){
    if(v.homeId){
      const hb = VILLAGE_BUILDINGS.find(b => b.id === v.homeId);
      if(hb) return hb;
    }
    // Find closest building door
    let best = null, bd = 1e9;
    for(const b of VILLAGE_BUILDINGS){
      const dx = (b.wx + Math.floor(b.tw / 2)) * CS + 16 - v.x;
      const dy = (b.wy + b.th) * CS - v.y;
      const d = Math.hypot(dx, dy);
      if(d < bd){ bd = d; best = b; }
    }
    if(best && bd < CS * 3) return best;
  }
  return null;
}

function getBuildingOwner(bld){
  return (bld && bld.owner) ? bld.owner : null;
}

function setBuildingOwner(bld, name){
  // NOTE: household entities arrive in Phase 2E; ownership will become actualOwner in Phase 2F.
  if(!bld) return;
  bld.owner = name || null;
  if(name && (!bld.residents || !bld.residents.includes(name))){
    if(!bld.residents) bld.residents = [];
    bld.residents.push(name);
  }
}

function findBuildingTarget(targetName, v){
  if(!targetName || targetName === 'house' || targetName === 'home' || targetName === 'nearest'){
    if(v && v.homeId){
      const hb = VILLAGE_BUILDINGS.find(b => b.id === v.homeId);
      if(hb) return hb;
    }
    let best = null, bd = 1e9;
    for(const b of VILLAGE_BUILDINGS){
      const d = Math.hypot((b.wx + b.tw/2) * CS - (v ? v.x : 0), (b.wy + b.th) * CS - (v ? v.y : 0));
      if(d < bd){ bd = d; best = b; }
    }
    return best || VILLAGE_BUILDINGS[0] || null;
  }
  const norm = String(targetName).toLowerCase().trim();
  let bld = VILLAGE_BUILDINGS.find(b => b.id.toLowerCase() === norm || (b.kind && b.kind.toLowerCase() === norm));
  if(!bld){
    bld = VILLAGE_BUILDINGS.find(b => b.name.toLowerCase().includes(norm));
  }
  if(!bld){
    // Explicit name/kind matched nothing: fail honestly (return null) so
    // planForVerb yields {ok:false, reason:'no building to X'} and the step
    // executors record 'No building to X' thoughts. The nearest-building
    // fallback is reserved for generic requests ('house', 'home', 'nearest',
    // empty) handled in the branch above. Never silently act on the wrong
    // building (e.g. demolishing the inn when asked to demolish a hut).
    return null;
  }
  return bld;
}

function placeVillageBuilding(kind, wx, wy, options){
  const opt = options || {};
  const tw = opt.tw || (kind === 'barn' || kind === 'workshop' || kind === 'inn' ? 5 : 4);
  const th = opt.th || 4;
  const id = opt.id || (kind + '_' + Math.floor(srand() * 100000));
  const sprKey = opt.sprKey || kind;
  const name = opt.name || ('Village ' + kind.charAt(0).toUpperCase() + kind.slice(1));
  const cap = opt.capacity || (kind === 'barn' ? 8 : (kind === 'inn' ? 6 : (kind === 'workshop' || kind === 'kitchen' ? 4 : 2)));
  const hasFire = (opt.hasFire != null) ? !!opt.hasFire : (kind === 'kitchen' || kind === 'inn' || kind === 'smithy');

  const bObj = {
    id: id,
    kind: kind,
    name: name,
    wx: wx, wy: wy,
    x: wx * CS, y: wy * CS,
    tw: tw, th: th,
    sprKey: sprKey,
    door: { wx: wx + Math.floor(tw / 2), wy: wy + th },
    indoorTemp: 20.0,
    cleanliness: 1.0,
    capacity: cap,
    owner: opt.owner || null, // NOTE: household entities arrive in Phase 2E; ownership will become actualOwner in Phase 2F
    integrity: 1.0,
    maxInteg: 1.0,
    hasFire: hasFire,
    fireplaceLit: hasFire,
    daysUnoccupied: 0,
    residents: opt.owner ? [opt.owner] : [],
    materials: opt.materials || (CONSTRUCT[kind] ? Object.assign({}, CONSTRUCT[kind].needs) : { log: 10, stone: 6, thatch: 2 })
  };

  VILLAGE_BUILDINGS.push(bObj);

  // Clear and sanitize foundation
  for(let dy = 0; dy < th; dy++) for(let dx = 0; dx < tw; dx++){
    const {c, i} = cellChunk(wx + dx, wy + dy);
    c.h[i] = SEA + 0.15;
    c.tileType[i] = 0;
    c.tStage[i] = 0;
    c.treeType[i] = 0;
    clearBushCell(c, i);
  }
  return bObj;
}

/* ---- Building Simulation Dynamics ---- */
function buildingTick(dtH){
  const outdoorTemp = (typeof W !== 'undefined' && W.temp != null) ? W.temp : 20.0;

  for(const b of VILLAGE_BUILDINGS){
    // Ensure required properties exist on legacy or dynamically placed structures
    if(b.indoorTemp == null) b.indoorTemp = 20.0;
    if(b.cleanliness == null) b.cleanliness = 1.0;
    if(b.capacity == null) b.capacity = 2;
    if(b.daysUnoccupied == null) b.daysUnoccupied = 0;
    if(b.integrity == null) b.integrity = 1.0;
    if(b.maxInteg == null) b.maxInteg = 1.0;
    if(!b.residents) b.residents = b.owner ? [b.owner] : [];

    // 1. Indoor Temperature Dynamics
    if(b.fireplaceLit){
      // Lit fire warms the building towards comfortable target
      const warmTarget = Math.max(22.0, outdoorTemp + 14.0);
      b.indoorTemp += (warmTarget - b.indoorTemp) * Math.min(1.0, dtH * 0.35);
    } else {
      // Unlit building drifts toward outdoor temperature with insulation moderation
      b.indoorTemp += (outdoorTemp - b.indoorTemp) * Math.min(1.0, dtH * 0.15);
    }

    // 2. Occupants and Sleepers
    const occupants = [];
    const sleepers = [];
    for(const v of VILLAGERS){
      if(v.dead) continue;
      const isInside = (v.inBuilding && (getBuildingAt(v.x, v.y) === b || v.homeId === b.id)) ||
                       getBuildingAt(v.x, v.y) === b;
      if(isInside){
        occupants.push(v);
        if(v.state === 'sleep') sleepers.push(v);
      }
    }

    // 3. Cleanliness decay from occupancy and animals
    let decayRate = occupants.length * 0.015;
    if(b.kind === 'barn' || b.id.startsWith('barn')){
      // Animal housing decays cleanliness
      let animalCount = (b.animalsHoused || 0);
      if(typeof CHICKENS !== 'undefined'){
        for(const c of CHICKENS){
          if(c.tamed && c.pen && Math.hypot(c.x - b.x, c.y - b.y) < CS * 5) animalCount++;
        }
      }
      if(typeof ANIMALS !== 'undefined'){
        for(const a of ANIMALS){
          if(a.tamed && !a.dead && a.pen && Math.hypot(a.x - b.x, a.y - b.y) < CS * 5) animalCount++;
        }
      }
      decayRate += animalCount * 0.02;
    }
    if(b.daysUnoccupied >= 3){
      // Abandoned buildings decay rapidly in cleanliness (dust, grime, spiderwebs)
      decayRate += 0.04;
    }
    b.cleanliness = Math.max(0, b.cleanliness - dtH * decayRate);

    // 4. Abandonment Tracking & Structural Decay
    if(occupants.length === 0 && b.residents.length === 0){
      b.daysUnoccupied += dtH / 24;
      if(b.daysUnoccupied >= 3){
        b.abandoned = true;
        // Slow structural integrity decay
        b.integrity = Math.max(0.1, b.integrity - (dtH / 24) * 0.03);
      }
    } else {
      b.daysUnoccupied = 0;
      b.abandoned = false;
    }

    // 5. Capacity & Overcrowding penalties
    if(sleepers.length > b.capacity){
      b.overcrowded = true;
      const excess = sleepers.length - b.capacity;
      for(const s of sleepers){
        if(!s.thoughts) s.thoughts = [];
        if(!s.thoughts.some(th => /overcrowd/i.test(th.text || ''))){
          s.thoughts.push({ text: 'Cramped and overcrowded quarters', val: -3 });
        }
        s.mood = Math.max(0.05, (s.mood || 0.8) - dtH * 0.06 * excess);
      }
    } else {
      b.overcrowded = false;
    }
  }
}

/* ---- Biometric & Needs Integration ---- */
const __bt17 = bodyTick;
bodyTick = function(v, dtH){
  const b = getBuildingForVillager(v);
  let savedTemp = null, cellRef = null;

  if(v.inBuilding && b){
    const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
    cellRef = cellChunk(wx, wy);
    savedTemp = cellRef.c.temp[cellRef.i];
    cellRef.c.temp[cellRef.i] = b.indoorTemp;
  }

  __bt17(v, dtH);

  if(savedTemp !== null && cellRef){
    cellRef.c.temp[cellRef.i] = savedTemp;
  }

  // Sensations and reactions to building environment
  if(v.inBuilding && b && !v.dead){
    if(!v.thoughts) v.thoughts = [];
    if(b.cleanliness < 0.25 && !v.thoughts.some(th => /grime|filth/i.test(th.text || ''))){
      v.thoughts.push({ text: 'Disgusted by grime and filthy floors', val: -3 });
    }
    if(b.indoorTemp < 12.0 && !b.fireplaceLit && !v.thoughts.some(th => /shivering|drafty/i.test(th.text || ''))){
      v.thoughts.push({ text: 'Shivering inside a cold, drafty room', val: -3 });
    }
    if(b.indoorTemp >= 19.0 && b.indoorTemp <= 25.0 && !v.thoughts.some(th => /cozy|comfortable/i.test(th.text || ''))){
      v.thoughts.push({ text: 'Comfortable indoor warmth', val: 3 });
    }
  }
};

/* ---- Building Action Step Executors ---- */
function doCleanStep(v, step, dtH){
  const b = step.building ? VILLAGE_BUILDINGS.find(x => x.id === step.building) : getBuildingForVillager(v);
  if(!b){ v.thoughts = [{ text: 'No building to clean', val: -1 }]; return true; }
  const doorX = (b.wx + Math.floor(b.tw / 2)) * CS + 16;
  const doorY = (b.wy + b.th) * CS + 16;
  if(Math.hypot(v.x - doorX, v.y - doorY) > CS * 2.5){
    const r = planMoveToward(v, doorX, doorY, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.workH = (step.workH || 0) + dtH;
  b.cleanliness = Math.min(1.0, (b.cleanliness || 0) + dtH * 0.8);
  if(b.cleanliness >= 0.99 || step.workH >= 1.5){
    b.cleanliness = 1.0;
    if(!v.thoughts) v.thoughts = [];
    v.thoughts.push({ text: 'Tidied up the living space', val: 3 });
    witnessEvent(v, 'Cleaned ' + b.name);
    logEvent('clean', v.name + ' cleaned ' + b.name);
    return true;
  }
  return false;
}

function doExpandStep(v, step, dtH){
  const b = step.building ? VILLAGE_BUILDINGS.find(x => x.id === step.building) : getBuildingForVillager(v);
  if(!b){ v.thoughts = [{ text: 'No building to expand', val: -1 }]; return true; }
  const doorX = (b.wx + Math.floor(b.tw / 2)) * CS + 16;
  const doorY = (b.wy + b.th) * CS + 20;

  if(!step.paid){
    if((v.inv.log || 0) < 6 || (v.inv.stone || 0) < 4){
      v.thoughts = [{ text: 'Need 6 wood and 4 stone to expand building', val: -2 }];
      return true;
    }
    v.inv.log -= 6; stripItemProvenance(v, 'log', 6);
    v.inv.stone -= 4; stripItemProvenance(v, 'stone', 4);
    step.paid = true;
  }

  if(Math.hypot(v.x - doorX, v.y - doorY) > CS * 2.5){
    const r = planMoveToward(v, doorX, doorY, dtH);
    return r === 'stuck' ? true : false;
  }

  v.state = 'work'; v.moving = false;
  step.workH = (step.workH || 0) + dtH * (typeof skillMult === 'function' ? skillMult(v, 'building') : 1.0);
  if(step.workH >= 3.0){
    b.capacity = (b.capacity || 2) + 2;
    b.expanded = (b.expanded || 0) + 1;
    if(typeof gainXP === 'function') gainXP(v, 'building', 12);
    witnessEvent(v, 'Expanded ' + b.name + ' (capacity: ' + b.capacity + ')');
    logEvent('build', v.name + ' expanded ' + b.name);
    return true;
  }
  return false;
}

function doDemolishStep(v, step, dtH){
  const b = step.building ? VILLAGE_BUILDINGS.find(x => x.id === step.building) : getBuildingForVillager(v);
  if(!b){ v.thoughts = [{ text: 'No building to demolish', val: -1 }]; return true; }
  const doorX = (b.wx + Math.floor(b.tw / 2)) * CS + 16;
  const doorY = (b.wy + b.th) * CS + 20;

  if(Math.hypot(v.x - doorX, v.y - doorY) > CS * 2.5){
    const r = planMoveToward(v, doorX, doorY, dtH);
    return r === 'stuck' ? true : false;
  }

  v.state = 'work'; v.moving = false;
  step.workH = (step.workH || 0) + dtH * (typeof skillMult === 'function' ? skillMult(v, 'building') : 1.0);
  if(step.workH >= 3.0){
    // Reclaim 50% fraction of construction materials
    const matLog = (b.materials && b.materials.log) ? b.materials.log : 10;
    const matStone = (b.materials && b.materials.stone) ? b.materials.stone : 6;
    const recLog = Math.max(1, Math.floor(matLog * 0.5));
    const recStone = Math.max(1, Math.floor(matStone * 0.5));

    addInv(v, 'log', recLog);
    addInv(v, 'stone', recStone);

    // Remove from VILLAGE_BUILDINGS
    const idx = VILLAGE_BUILDINGS.indexOf(b);
    if(idx !== -1) VILLAGE_BUILDINGS.splice(idx, 1);

    // Clear dangling homeId references to the demolished building
    if(typeof VILLAGERS !== 'undefined'){
      for(const u of VILLAGERS){
        if(u.homeId === b.id) u.homeId = null;
      }
    }

    witnessEvent(v, 'Demolished ' + b.name + ' and reclaimed ' + recLog + ' wood, ' + recStone + ' stone');
    logEvent('demolish', v.name + ' demolished ' + b.name);
    return true;
  }
  return false;
}

/* ---- Verbs, Planning & Intent Wiring ---- */
VERBS.push('clean', 'expand', 'demolish');

const __planForVerb17 = planForVerb;
planForVerb = function(v, action){
  const A = action || {};
  if(A.kind === 'clean'){
    const bld = findBuildingTarget(A.target || A.building, v);
    if(!bld) return { ok: false, reason: 'no building to clean' };
    const door = bld.door || { wx: bld.wx + Math.floor(bld.tw / 2), wy: bld.wy + bld.th };
    return { ok: true, steps: [
      { verb: 'go', tx: door.wx * CS + 16, ty: door.wy * CS + 16 },
      { verb: 'clean', building: bld.id }
    ]};
  }
  if(A.kind === 'expand'){
    const bld = findBuildingTarget(A.target || A.building, v);
    if(!bld) return { ok: false, reason: 'no building to expand' };
    const door = bld.door || { wx: bld.wx + Math.floor(bld.tw / 2), wy: bld.wy + bld.th };
    return { ok: true, steps: [
      { verb: 'go', tx: door.wx * CS + 16, ty: door.wy * CS + 16 },
      { verb: 'expand', building: bld.id }
    ]};
  }
  if(A.kind === 'demolish'){
    const bld = findBuildingTarget(A.target || A.building, v);
    if(!bld) return { ok: false, reason: 'no building to demolish' };
    const door = bld.door || { wx: bld.wx + Math.floor(bld.tw / 2), wy: bld.wy + bld.th };
    return { ok: true, steps: [
      { verb: 'go', tx: door.wx * CS + 16, ty: door.wy * CS + 16 },
      { verb: 'demolish', building: bld.id }
    ]};
  }
  return __planForVerb17(v, action);
};

const __pt17 = planTick;
planTick = function(v, dtH){
  const step = v.plan && v.plan[0];
  if(step){
    if(step.verb === 'clean'){
      const done = doCleanStep(v, step, dtH);
      step.t = (step.t || 0) + dtH;
      if(done) v.plan.shift();
      return;
    }
    if(step.verb === 'expand'){
      const done = doExpandStep(v, step, dtH);
      step.t = (step.t || 0) + dtH;
      if(done) v.plan.shift();
      return;
    }
    if(step.verb === 'demolish'){
      const done = doDemolishStep(v, step, dtH);
      step.t = (step.t || 0) + dtH;
      if(done) v.plan.shift();
      return;
    }
    __pt17(v, dtH); return;
  }
  __pt17(v, dtH);
};

/* Intent patterns wired into natural language planner */
INTENT_PATTERNS.unshift(
  { re: /\bclean\b.{0,20}\b(house|home|cottage|barn|room|floor|hut|shop|inn)\b|\bsweep\b/,
    plan: (m) => [{ verb: 'clean', target: m[1] || 'house' }] },
  { re: /\bexpand\b.{0,20}\b(barn|house|home|cottage|hut|inn|workshop|kitchen)\b/,
    plan: (m) => [{ verb: 'expand', target: m[1] }] },
  { re: /\b(demolish|tear down|knock down)\b.{0,20}\b(old\s+)?(hut|house|barn|cottage|workshop|kitchen|building)\b/,
    plan: (m) => [{ verb: 'demolish', target: m[3] || m[2] }] },
  { re: /\brepair\b.{0,20}\b(roof|house|barn|hut|cottage|building)\b/,
    plan: (m) => [{ verb: 'repair', building: m[1] }] },
  { re: /\b(fish|fishing)\b.{0,15}\b(river|creek)\b|\b(river|creek)\b.{0,15}\b(fish|fishing)\b/,
    plan: () => [{ verb: 'go', place: 'river' }, { verb: 'fish', hours: 2, place: 'river' }] },
  { re: /\bdrink\b.{0,15}\b(river|creek)\b/,
    plan: () => [{ verb: 'go', place: 'river' }, { verb: 'drink' }] }
);

/* Main simulation tick hook */
const __st17 = simTick;
simTick = function(dtH){
  __st17(dtH);
  buildingTick(dtH);
};

/* ---- Procedural Pixel-Art Generation for New Buildings ---- */
function buildCustomBuildingsArt(){
  if(typeof PA === 'undefined' || !PA.bld || typeof composeBuilding !== 'function') return;

  // 1. Barn: warm timber barn with hayloft and double doors
  if(!PA.bld.barn){
    PA.bld.barn = composeBuilding({
      tw: 5, th: 4, key: 130,
      base: { wall: '#964433', roof: '#e0b95e', trim: '#f2e4c2' },
      roofStyle: 'thatch', wallKind: 'wood', timber: true, doorW: 15, lantern: true,
      winOff: [{ off: -22, shut: '#5a2d20' }, { off: 22, shut: '#5a2d20' }],
      extras(g, pal, c){
        // Loft door in gable
        paBlob(g, c.apexX, c.apexY + 20, 10, V7_LINE);
        paBlob(g, c.apexX, c.apexY + 20, 8, pal.trim);
        v7R(g, c.apexX - 6, c.apexY + 12, 12, 16, pal.wood[2]);
        v7R(g, c.apexX - 6, c.apexY + 12, 12, 2, pal.wood[4]);
        // Haybale outside by the wall
        if(typeof v7Haybale === 'function') v7Haybale(g, c.ox + 16, c.wallB);
      }
    });
  }

  // 2. Workshop: stone & sturdy wood masonry with slate roof & workbench
  if(!PA.bld.workshop){
    PA.bld.workshop = composeBuilding({
      tw: 5, th: 4, key: 131,
      base: { wall: '#9a8a78', roof: '#5d6b7d', trim: '#f2e4c2' },
      roofStyle: 'slate', wallKind: 'stone', timber: true, doorW: 11, lantern: true,
      chimneyX: 20,
      winOff: [{ off: -20, shut: '#455061' }, { off: 20, shut: '#455061' }],
      extras(g, pal, c){
        // Carpenter workbench outside wall
        const wx = c.ox + 12, wy = c.wallB - 16;
        v7R(g, wx, wy, 28, 6, pal.wood[3]);
        v7R(g, wx, wy, 28, 2, pal.wood[5]);
        v7R(g, wx + 4, wy + 6, 4, 10, pal.wood[1]);
        v7R(g, wx + 20, wy + 6, 4, 10, pal.wood[1]);
      }
    });
  }

  // 3. Kitchen: warm plaster with terracotta tile roof and smoking chimney
  if(!PA.bld.kitchen){
    PA.bld.kitchen = composeBuilding({
      tw: 4, th: 4, key: 132,
      base: { wall: '#f0e2c4', roof: '#b8543e', trim: '#fff6e0' },
      roofStyle: 'tile', wallKind: 'plaster', timber: true, doorW: 10, litDoor: true, lantern: true,
      chimneyX: 44,
      winOff: [{ off: -16, shut: '#b8452e' }, { off: 16, shut: '#b8452e' }],
      extras(g, pal, c){
        // Hanging herb braids flanking the door
        v7R(g, c.ox + c.W / 2 - 20, c.wallY + 16, 4, 12, MAT.leaf[2]);
        v7R(g, c.ox + c.W / 2 + 18, c.wallY + 16, 4, 12, MAT.leaf[2]);
      }
    });
  }
}

// Hook custom building pixel art into buildBuildingArt pipeline
if(typeof buildBuildingArt === 'function'){
  const __baseBuildArt17 = buildBuildingArt;
  buildBuildingArt = function(){
    __baseBuildArt17();
    buildCustomBuildingsArt();
  };
}
buildCustomBuildingsArt();
