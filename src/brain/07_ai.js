/* ---------------------------------------------------------------------
   PART 8: VILLAGER AI & PAWN CONTROLS
   --------------------------------------------------------------------- */
function updateVillagerAI(v, dtH){
  // Clamp dtH for movement similar to player pawn to avoid jitter at high speeds
  const moveDtH = Math.min(dtH, 0.03);
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;

  // If a non-swimmer somehow ends up in deep water, panic and struggle towards shore
  if(isDeep && !v.canSwim){
    v.state = 'drown_panic';
    v.moving = true;
    const esc = getShallowEscapeVector(v.x, v.y);
    const struggleSpd = 30 * (dtH * 60);
    v.x += esc.dx * struggleSpd;
    v.y += esc.dy * struggleSpd;
    return;
  }

  // Daily schedule
  const hour = W.tod;
  if(hour >= 21 || hour < 6){
    // Night: sleep indoors
    v.state = 'sleep';
    v.inBuilding = true;
  } else if(hour >= 8 && hour < 17){
    // Daytime work & seasonal activities
    v.inBuilding = false;

    // On hot summer afternoons, swimmers (Finn, Pip, Wren) might wander to lake shore/pier
    if(hour >= 12 && hour <= 15 && W.temp > 23 && v.canSwim && (v.name === 'Finn' || v.name === 'Pip')){
      const pierX = 20 * CS + 16, pierY = 7 * CS + 16;
      const d = Math.hypot(v.x - pierX, v.y - pierY);
      if(d > 20){
        const mx = ((pierX - v.x)/d) * 45 * (dtH * 60);
        const my = ((pierY - v.y)/d) * 45 * (dtH * 60);
        if(canMoveTo(v.x + mx, v.y + my, v).ok){
          v.x += mx; v.y += my;
          v.state = 'walk';
          v.moving = true;
        }
      } else {
        v.state = 'swim';
        v.moving = false;
      }
    } else {
      v.state = 'work';
      v.workProgress = (v.workProgress || 0) + dtH * 0.8;
      if(v.workProgress >= 1.0){
        v.workProgress = 0;
        v.triumphT = 1.0;
        if(v === VILLAGERS[controlledPawnIdx]){
          showToast(`✨ ${v.name} completed their task!`);
        }
      }
    }
  } else {
    // Evening / Morning leisure
    v.state = 'idle';
    v.inBuilding = false;
  }

  if(v.triumphT > 0){
    v.triumphT = Math.max(0, v.triumphT - dtH * 15);
  }
}

const keysDown = {};
const touchMove = { dx: 0, dy: 0 };
window.addEventListener('keydown', e => {
  keysDown[e.code] = true;
  if(e.code === 'Tab'){
    e.preventDefault();
    cyclePawn(1);
  } else if(e.code === 'KeyE'){
    interactKey();
  }
});
window.addEventListener('keyup', e => { keysDown[e.code] = false; });

function updatePlayerPawn(v, dtH){
  // Clamp dtH for movement to avoid excessive displacement at high simulation speeds
  const moveDtH = Math.min(dtH, 0.03); // limit to ~30ms equivalent per frame
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;
  const isWater = depth > 0;

  // Non-swimmer in deep water: violent struggle flailing towards shore
  if(isDeep && !v.canSwim){
    v.state = 'drown_panic';
    v.moving = true;
    const esc = getShallowEscapeVector(v.x, v.y);
    const struggleSpd = 32 * (dtH * 60);
    v.x += esc.dx * struggleSpd;
    v.y += esc.dy * struggleSpd;
    return;
  }

  let dx = 0, dy = 0;
  if(keysDown['KeyW'] || keysDown['ArrowUp']) dy -= 1;
  if(keysDown['KeyS'] || keysDown['ArrowDown']) dy += 1;
  if(keysDown['KeyA'] || keysDown['ArrowLeft']) dx -= 1;
  if(keysDown['KeyD'] || keysDown['ArrowRight']) dx += 1;
  if(dx === 0 && dy === 0 && (touchMove.dx !== 0 || touchMove.dy !== 0)){
    dx = touchMove.dx; dy = touchMove.dy;
    v.targetX = null; v.targetY = null;
  }

  // Also support click-to-move destination
  if(dx === 0 && dy === 0 && v.targetX != null && v.targetY != null){
    const dist = Math.hypot(v.targetX - v.x, v.targetY - v.y);
    if(dist > 6){
      dx = (v.targetX - v.x);
      dy = (v.targetY - v.y);
    } else {
      v.targetX = null;
      v.targetY = null;
    }
  }

  if(dx !== 0 || dy !== 0){
    let baseSpd = (v.energy < 0.25 ? 60 : 90);
    if(isDeep && v.canSwim){
      baseSpd = 48 * (0.6 + (v.swimSkill || 0.5) * 0.7); // swimming speed based on skill
      v.state = 'swim';
    } else if(isWater){
      baseSpd = (v.energy < 0.25 ? 32 : 46); // wading speed penalty (~45% slower)
      v.state = 'wade';
    } else {
      v.state = 'walk';
    }

    const spd = baseSpd * (dtH * 60);
    const len = Math.hypot(dx, dy);
    const mx = (dx / len) * spd;
    const my = (dy / len) * spd;

    // Decoupled sliding collision:
    const targetX = v.x + mx;
    const targetY = v.y + my;
    const testBoth = canMoveTo(targetX, targetY, v);

    if(testBoth.ok){
      v.x = targetX;
      v.y = targetY;
    } else {
      // Test sliding horizontally along X
      const testX = canMoveTo(targetX, v.y, v);
      if(testX.ok) v.x = targetX;
      // Test sliding vertically along Y
      const testY = canMoveTo(v.x, targetY, v);
      if(testY.ok) v.y = targetY;
    }

    v.walkPhase += dtH * (isDeep ? 8 : (isWater ? 10 : 13));
    v.moving = true;
    if(dx > 0) v.face = 3;
    else if(dx < 0) v.face = 2;
    else if(dy < 0) v.face = 1;
    else v.face = 0;
  } else {
    if(isDeep && v.canSwim) v.state = 'swim';
    else if(isWater) v.state = 'wade';
    else if(v.state === 'walk' || v.state === 'wade' || v.state === 'swim'){
      v.state = 'idle';
    }
    v.moving = false;
  }
}

function cyclePawn(dir){
  inspectedPawnIdx = (inspectedPawnIdx + dir + VILLAGERS.length) % VILLAGERS.length;
  updateHUD();
}

function interactKey(){
  const v = VILLAGERS[inspectedPawnIdx];
  if(!v) return;

  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);

  // 1. Drink at village well
  const well = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  if(well && Math.hypot(v.x - well.x, v.y - well.y) < 55){
    const b = ensureBody(v);
    b.hydration = 1.0;
    showToast(`💧 ${v.name} drank fresh, cold well water!`);
    updateHUD();
    return;
  }

  // 2. Drink at lake shallows / shore
  if(depth > 0 || Math.hypot(v.x - (25*CS+16), v.y - (7*CS+16)) < 90){
    const b = ensureBody(v);
    b.hydration = 1.0;
    showToast(`💧 ${v.name} scooped and drank cool, pristine lake water!`);
    updateHUD();
    return;
  }

  // 3. Work at blacksmith anvil
  const anvil = VILLAGE_OBJECTS.find(o => o.kind === 'anvil');
  if(anvil && Math.hypot(v.x - anvil.x, v.y - anvil.y) < 45){
    showToast(`⚒️ ${v.name} forged red-hot steel at Bram's anvil!`);
    return;
  }

  showToast(`✦ ${v.name} interacted with village environment`);
}
