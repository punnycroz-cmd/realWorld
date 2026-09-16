/* =====================================================================
   PART 15E: FIREFIGHTING — able-bodied villagers no longer just flee.
   They fetch water and douse fires threatening buildings, people and
   fields; distant wilderness burns. Smoke inhalation is a real risk.
   (Buckets are assumed wooden and ubiquitous — medieval simplification.)
   ===================================================================== */
function firePriority(b){
  let s = 1;
  for(const bd of VILLAGE_BUILDINGS){
    const bx = (bd.wx + (bd.tw || 4) / 2) * CS, by = (bd.wy + (bd.th || 4)) * CS;
    const d = Math.hypot(b.wx * CS + 16 - bx, b.wy * CS + 16 - by) / CS;
    if(d < 8) s += (8 - d) * 3;
  }
  for(const v of VILLAGERS){
    if(v.dead) continue;
    const d = Math.hypot(b.wx * CS + 16 - v.x, b.wy * CS + 16 - v.y) / CS;
    if(d < 6) s += (6 - d) * 2;
  }
  for(const c of CROPS){
    const d = Math.hypot(b.wx - c.wx, b.wy - c.wy);
    if(d < 5) s += (5 - d);
  }
  return s;
}
function bestFireTarget(v){
  let best = null, bs = 4; // only fires worth fighting
  for(const b of BURNING){
    const s = firePriority(b);
    if(s > bs && Math.hypot(b.wx * CS + 16 - v.x, b.wy * CS + 16 - v.y) / CS < 30){ bs = s; best = b; }
  }
  return best;
}
function doDouseStep(v, step, dtH){
  const b = (step.fire && BURNING.indexOf(step.fire) >= 0) ? step.fire : bestFireTarget(v);
  if(!b){ v.thoughts = [{ text: 'No fire worth fighting', val: 0 }]; return true; }
  step.fire = b;
  if(!v.wetBucket){
    const well = VILLAGE_OBJECTS.find(o => o.kind === 'well');
    const nearWell = well && Math.hypot(v.x - well.x, v.y - well.y) < CS * 2;
    const nearWater = getWaterDepth(Math.floor(v.x / CS), Math.floor(v.y / CS)) > 0;
    if(!nearWell && !nearWater){
      if(well){ const r = planMoveToward(v, well.x, well.y, dtH); return r === 'stuck'; }
      return true;
    }
    v.state = 'work'; v.moving = false;
    step.fillT = (step.fillT || 0) + dtH;
    if(step.fillT > 0.3){ v.wetBucket = true; step.fillT = 0; witnessEvent(v, 'Filled a bucket with water'); }
    return false;
  }
  const bx = b.wx * CS + 16, by = b.wy * CS + 16;
  if(Math.hypot(v.x - bx, v.y - by) > CS * 1.8){
    const r = planMoveToward(v, bx, by, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog >= 0.5){
    step.prog = 0; v.wetBucket = false;
    const bi = BURNING.indexOf(b);
    if(bi >= 0) BURNING.splice(bi, 1);
    for(const o of BURNING.slice()){
      if(Math.abs(o.wx - b.wx) + Math.abs(o.wy - b.wy) === 1 && srand() < 0.5){
        const oi = BURNING.indexOf(o);
        if(oi >= 0) BURNING.splice(oi, 1);
      }
    }
    const bd = ensureBody(v);
    bd.wetness = clamp((bd.wetness || 0) + 0.5, 0, 1);
    gainXP(v, 'building', 1);
    witnessEvent(v, 'Doused part of the wildfire');
    logEvent('douse', v.name + ' doused fire');
    if(typeof observe === 'function'){
      observe(v, { event: 'saved village from wildfire', what: 'doused wildfire' }, {
        topic: 'fire_savior',
        salience: 0.90,
        source: 'direct',
        bypassAttention: true
      });
    }
    step.fire = null;
  }
  let near = 0;
  for(const o of BURNING){
    if(Math.hypot(o.wx * CS + 16 - v.x, o.wy * CS + 16 - v.y) < CS * 2.5) near++;
  }
  if(near > 3){
    const bd2 = ensureBody(v);
    bd2.oxygen = clamp((bd2.oxygen || 1) - dtH * 0.8, 0, 1);
    if(srand() < dtH * 0.2) bd2.illness = clamp((bd2.illness || 0) + 0.1, 0, 1);
  }
  return false;
}
