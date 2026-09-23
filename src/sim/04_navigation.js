/* ---------------------------------------------------------------------
   PART 5B: NAVIGATION, WATER DEPTH & COLLISION ENGINE
   --------------------------------------------------------------------- */
function getWaterDepth(wx, wy){
  const {c, i} = cellChunk(wx, wy);
  if(c.tileType[i] === 5) return 0; // Wooden bridge / pier is above water
  if(c.h[i] >= SEA) return 0;       // Dry land
  return SEA - c.h[i];              // Water depth: <= 0.05 shallow, > 0.05 deep
}

function getShallowEscapeVector(px, py){
  const curWx = Math.floor(px / CS), curWy = Math.floor(py / CS);
  let bestDist = 9999, bestWx = curWx, bestWy = curWy;
  for(let dy=-5; dy<=5; dy++){
    for(let dx=-5; dx<=5; dx++){
      const wx = curWx + dx, wy = curWy + dy;
      const depth = getWaterDepth(wx, wy);
      if(depth <= 0.05){
        const d = Math.hypot(dx, dy);
        if(d < bestDist){
          bestDist = d;
          bestWx = wx;
          bestWy = wy;
        }
      }
    }
  }
  const tx = bestWx * CS + 16, ty = bestWy * CS + 16;
  const len = Math.hypot(tx - px, ty - py) || 1;
  return { dx: (tx - px)/len, dy: (ty - py)/len };
}

function canMoveTo(x, y, v){
  if(typeof SF_MODE !== 'undefined' && SF_MODE) return sfCanMoveTo(x, y, v);
  const r = 8; // character collision radius
  const wx = Math.floor(x / CS), wy = Math.floor(y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;
  const isWater = depth > 0;

  // 1. Building Solid Walls & Doorways
  for(const b of VILLAGE_BUILDINGS){
    const bx0 = b.wx * CS;
    const by0 = (b.wy + 1) * CS; // Wall body starts at row wy+1; row wy behind the roof remains walkable with Y-depth sorting
    const bx1 = (b.wx + b.tw) * CS;
    const by1 = (b.wy + b.th) * CS - 6;

    if(x + r > bx0 && x - r < bx1 && y + r > by0 && y - r < by1){
      // Doorway entrance threshold check:
      const doorX = (b.wx + Math.floor(b.tw/2)) * CS + 16;
      const doorY = (b.wy + b.th) * CS;
      if(Math.hypot(x - doorX, y - (doorY - 6)) < 18){
        continue; // Permitted on doorway doorstep threshold
      }
      return { ok: false, reason: 'building_wall', bld: b.name };
    }
  }

  // 2. Solid Props (Well, Anvil, Streetlamps, Benches)
  for(const obj of VILLAGE_OBJECTS){
    if(obj.kind === 'well'){
      if(Math.hypot(x - obj.x, y - obj.y) < 22) return { ok: false, reason: 'well' };
    } else if(obj.kind === 'anvil'){
      if(Math.hypot(x - obj.x, y - obj.y) < 16) return { ok: false, reason: 'anvil' };
    } else if(obj.kind === 'bench'){
      if(Math.hypot(x - obj.x, y - obj.y) < 14) return { ok: false, reason: 'bench' };
    } else if(obj.kind === 'lamp'){
      if(Math.hypot(x - obj.x, y - obj.y) < 10) return { ok: false, reason: 'lamp' };
    }
  }

  // 3. Autonomous AI avoidance for deep water
  if(isDeep && v && !v.canSwim && v.isNPC){
    return { ok: false, reason: 'cannot_swim' };
  }

  return { ok: true, depth, isWater, isDeep };
}
