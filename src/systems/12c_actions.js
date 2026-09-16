/* =====================================================================
   PART 12C: ACTION QUEUE — postAction accepts verbs, queues multi-step
   plans executed over ticks. Unknown verbs are rejected, never squashed.
   v.brainControlled: skip scripted schedule; run plans + guard + body.
   ===================================================================== */
const VERBS = ['go', 'take', 'drop', 'use', 'speak', 'eat', 'drink', 'sleep', 'rest', 'wait', 'fell', 'forage', 'fish', 'farm', 'build', 'cook'];
const FOOD_VAL = { bread: 0.35, cookedFish: 0.5, berries: 0.15, crop: 0.2, egg: 0.18, fish: 0.25 };
// 2E: occupation efficiency bonus hook. getOccupationBonus is declared in
// 20_social_life.js (loaded later in the bundle) — function declarations are
// hoisted across the concatenated script, so guard with typeof for safety.
function occupationBonusFor(v, actType){
  return (typeof getOccupationBonus === 'function') ? getOccupationBonus(v, actType) : 1;
}
function addInv(v, what, n){
  const maxCap = (v && v.stage === 'child') ? 6 : 20;
  v.inv[what] = Math.min(maxCap, (v.inv[what] || 0) + n);
  return v.inv[what];
}
function firstFood(v){
  for(const f of ['bread', 'cookedFish', 'berries', 'crop', 'egg', 'fish'])
    if((v.inv[f] || 0) > 0) return f;
  return null;
}
function dropPileAt(x, y, what, n){
  for(const p of PILES){
    if(Math.hypot(p.x - x, p.y - y) < CS * 1.5){ p.items[what] = (p.items[what] || 0) + n; return p; }
  }
  const p = { x, y, wx: Math.floor(x / CS), wy: Math.floor(y / CS), items: {} };
  p.items[what] = n;
  PILES.push(p);
  return p;
}
function cleanPile(p){
  let total = 0;
  for(const k of Object.keys(p.items)) total += p.items[k];
  if(total <= 0){ const i = PILES.indexOf(p); if(i >= 0) PILES.splice(i, 1); }
}
function nearestPileWith(v, what){
  let best = null, bd = 1e9;
  for(const p of PILES){
    if((p.items[what] || 0) <= 0) continue;
    const d = Math.hypot(p.x - v.x, p.y - v.y);
    if(d < bd){ bd = d; best = p; }
  }
  return best;
}
function nearestTree(v){
  let best = null, bd = 1e9;
  for(const t of WILDTREES){
    if(t.stage <= 0) continue;
    const d = Math.hypot(t.wx * CS + 16 - v.x, t.wy * CS + 16 - v.y);
    if(d < bd){ bd = d; best = t; }
  }
  return best;
}
function findForageSpot(v){
  // Phase 4: scan the per-chunk bush/shore registries instead of probing
  // ~2800 cells one by one. Same search rectangle as before (wx -25..30,
  // wy -25..25, i.e. chunk cx/cy in [-2, 1]) and same nearest-wins rule.
  let best = null, bd = 1e9;
  for(const [k, c] of chunks){
    if(c.cx < -2 || c.cx > 1 || c.cy < -2 || c.cy > 1) continue;
    const bc = c.bushCells;
    if(!bc || !bc.length) continue;
    const bx = c.cx * CHN, by = c.cy * CHN;
    for(let n = 0; n < bc.length; n++){
      const i = bc[n];
      const wx = bx + (i % CHN), wy = by + (((i / CHN) | 0));
      const x = wx * CS + 16, y = wy * CS + 16;
      const d = Math.hypot(x - v.x, y - v.y);
      if(d < bd){ bd = d; best = { kind: 'bush', wx, wy, x, y }; }
    }
  }
  if(best && bd < CS * 40) return best;
  // shore stones fallback: shallow-shore cells are static terrain, so use
  // the per-chunk registry built at chunk generation. Entries stale since
  // gen (pier laid over shore, landfilled by construction) are skipped with
  // the same predicate getWaterDepth uses, so results match the old scan.
  for(const [k, c] of chunks){
    if(c.cx < -2 || c.cx > 1 || c.cy < -2 || c.cy > 1) continue;
    const sc = c.shoreCells;
    if(!sc || !sc.length) continue;
    const bx = c.cx * CHN, by = c.cy * CHN;
    for(let n = 0; n < sc.length; n++){
      const i = sc[n];
      if(c.tileType[i] === 5) continue; // pier/bridge laid over shore after gen
      const hh = c.h[i];
      if(hh >= SEA) continue;           // landfilled by construction after gen
      if(SEA - hh > 0.05) continue;     // paranoia: registry only holds <= 0.05
      const wx = bx + (i % CHN), wy = by + (((i / CHN) | 0));
      const x = wx * CS + 16, y = wy * CS + 16;
      const d = Math.hypot(x - v.x, y - v.y);
      if(d < bd){ bd = d; best = { kind: 'shore', wx, wy, x, y }; }
    }
  }
  return best;
}
/* Stepped movement with sliding collision. Returns true=arrived, false=moving, 'stuck'. */
function planMoveToward(v, tx, ty, dtH){
  // Hardened (2E fix): never corrupt a villager's position with non-finite
  // targets. Callers treat 'stuck' by shifting the plan + a thought.
  if(!Number.isFinite(tx) || !Number.isFinite(ty)) return 'stuck';
  if(!Number.isFinite(v.x) || !Number.isFinite(v.y)) return 'stuck';
  const dx = tx - v.x, dy = ty - v.y;
  const dist = Math.hypot(dx, dy);
  if(dist < CS * 1.2){ v.stuckT = 0; v._wf = null; return true; }
  const moveDtH = Math.min(dtH, 0.03);
  let spd = 85 * (moveDtH * 60);
  if(v.body && (v.body.injury || 0) > 0) spd *= 1 - 0.4 * Math.min(1, v.body.injury);
  if(v.stage === 'elder') spd *= 0.75;
  spd = Math.min(spd, dist); // never overshoot the target (avoids orbit at coarse dtH)
  const ux = dx / dist, uy = dy / dist;
  // Bug-2 wall following: straight-line steering alone traps villagers against
  // wide obstacles (e.g. a building wall between them and the well) — they push
  // forever and die of thirst within sight of water. When the straight path is
  // blocked we follow the obstacle boundary (keeping the wall on one side)
  // until the straight line is clear again AND we are closer to the target
  // than where we first hit the wall. State persists on v._wf across ticks.
  let wf = v._wf;
  if(wf && wf.active){
    // Close enough that the arrival check (dist < CS*1.2) is imminent: drop
    // wall-following and head straight. (The destination cell itself is often
    // unwalkable — e.g. the well object — so probes toward it never clear.)
    if(dist < CS * 2){ v._wf = null; wf = null; }
  }
  if(wf && wf.active){
    // Leave condition: probe the straight line; if clear and progress made,
    // drop wall-following and head straight.
    // (Phase 4 fix: a blocker within CS*1.5 of the TARGET doesn't count as a
    // blocked path — the target cell itself is often unwalkable (e.g. the
    // well object), so probes aimed at the exact center never clear and
    // villagers orbit the well forever, dying of thirst within sight of
    // water. We only need the path clear up to the arrival radius.)
    const blockedAhead = (maxPd) => {
      for(let pd = CS; pd <= maxPd; pd += CS){
        const px = v.x + ux * pd, py = v.y + uy * pd;
        if(!canMoveTo(px, py, v).ok && Math.hypot(px - tx, py - ty) > CS * 1.5) return true;
      }
      return false;
    };
    let probeOk = dist < wf.hitDist - CS * 0.5 && !blockedAhead(CS * 3);
    // Long clear run: straight path open far ahead — leave even if we took
    // the long way around (dist may exceed hitDist).
    if(!probeOk) probeOk = !blockedAhead(CS * 6);
    if(probeOk){ v._wf = null; wf = null; }
    else {
      wf.t = (wf.t || 0) + 1;
      // Loop guard: back near the hit point after real travel -> reverse side.
      if(wf.t > 12 && Math.hypot(v.x - wf.hx, v.y - wf.hy) < CS * 1.5){
        wf.side = -wf.side; wf.t = 0;
      }
      if(wf.t > 600){ v._wf = null; wf = null; } // sanity timeout
    }
  }
  // Direction of travel: straight, or tangent-while-hugging while wall-following.
  // The tangent is biased toward the target so we slide ALONG the obstacle
  // boundary instead of wandering off in a straight tangent line.
  let mx = ux, my = uy;
  if(wf && wf.active){
    mx = -uy * wf.side * 0.85 + ux * 0.55;
    my = ux * wf.side * 0.85 + uy * 0.55;
    const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
  }
  // Walk in small sub-steps so a blocked DESTINATION cell can't freeze us:
  // the old single-jump tried to land exactly on the target in one leap, and
  // when that cell was unwalkable (e.g. the well object itself) the zero-length
  // axis fallback "succeeded" without moving — an infinite treadmill that
  // starved/dehydrated villagers en route to water. Now we advance as far as
  // walkable and report honestly when no progress is possible.
  let moved = 0, px = v.x, py = v.y;
  const stepLen = 8;
  const walkDir = (dx2, dy2) => {
    let mv = 0, rem = spd, qx = v.x, qy = v.y;
    while(rem > 0.01){
      const st = Math.min(stepLen, rem);
      const nx = qx + dx2 * st, ny = qy + dy2 * st;
      if(canMoveTo(nx, ny, v).ok){ qx = nx; qy = ny; mv += st; rem -= st; }
      else {
        const rxOk = Math.abs(dx2) > 0.01 && canMoveTo(qx + dx2 * st, qy, v).ok;
        const ryOk = Math.abs(dy2) > 0.01 && canMoveTo(qx, qy + dy2 * st, v).ok;
        if(rxOk){ qx += dx2 * st; mv += st; rem -= st; }
        else if(ryOk){ qy += dy2 * st; mv += st; rem -= st; }
        else break;
      }
    }
    return { moved: mv, px: qx, py: qy };
  };
  let wres = walkDir(mx, my);
  moved = wres.moved; px = wres.px; py = wres.py;
  if(moved <= 0.01 && wf && wf.active){
    // Tangent blocked too (concave corner): try the mirrored tangent once.
    wf.side = -wf.side;
    wres = walkDir(-uy * wf.side, ux * wf.side);
    if(wres.moved > 0.01){ moved = wres.moved; px = wres.px; py = wres.py; }
  }
  if(moved <= 0.01 && !(wf && wf.active)){
    // Straight path blocked: activate wall-following. Pick the side whose
    // tangent step is walkable (deterministic: try left first).
    let side = 1;
    if(!canMoveTo(v.x + (-uy) * stepLen * 2, v.y + ux * stepLen * 2, v).ok &&
        canMoveTo(v.x + uy * stepLen * 2, v.y + (-ux) * stepLen * 2, v).ok) side = -1;
    v._wf = { active: true, hx: v.x, hy: v.y, hitDist: dist, side: side, t: 0 };
  }
  if(moved <= 0.01){
    // Last resort: the classic single leap. Covers starting embedded inside a
    // prop's exclusion radius (e.g. spawned on the well): sub-steps can never
    // leave, but one clean jump out is walkable. Only when nothing moved, so
    // we never tunnel through walls mid-path.
    const jx = v.x + ux * spd, jy = v.y + uy * spd;
    if(canMoveTo(jx, jy, v).ok){ px = jx; py = jy; moved = spd; }
    else {
      // Embedded and the target direction is blocked too: probe the 8 compass
      // directions for ANY walkable exit ("step out of the furniture") rather
      // than freezing forever inside a prop's exclusion circle.
      for(let a = 0; a < 8 && moved <= 0.01; a++){
        const ang = a * Math.PI / 4;
        const ex = v.x + Math.cos(ang) * stepLen * 2, ey = v.y + Math.sin(ang) * stepLen * 2;
        if(canMoveTo(ex, ey, v).ok){ px = ex; py = ey; moved = stepLen * 2; }
      }
    }
  }
  if(moved > 0.01){
    v.x = px; v.y = py; v.stuckT = 0;
    v.state = 'walk'; v.moving = true;
    v.walkPhase = (v.walkPhase || 0) + dtH * 2;
    v.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 2) : (dy > 0 ? 0 : 1);
    if(Math.hypot(tx - v.x, ty - v.y) < CS * 1.2){ v.stuckT = 0; return true; }
    return false;
  }
  v.stuckT = (v.stuckT || 0) + dtH;
  if(v.stuckT > 2){ v.stuckT = 0; return 'stuck'; }
  v.state = 'walk'; v.moving = false;
  return false;
}
/* ---- verb step executors: each returns true when the step is done ---- */
function doDrinkStep(v, step, dtH){
  const well = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  const nearWell = well && Math.hypot(v.x - well.x, v.y - well.y) < CS * 2.5;
  const nearWater = getWaterDepth(Math.floor(v.x / CS), Math.floor(v.y / CS)) > 0 || nearWater3(v);
  if(!nearWell && !nearWater){
    if(well){ const r = planMoveToward(v, well.x, well.y, dtH); return r === 'stuck'; }
    return true;
  }
  v.state = 'drink'; v.moving = false;
  const b = ensureBody(v);
  b.hydration = clamp(b.hydration + dtH * 1.5, 0, 1);
  b.lastDrink = 0;
  // Don't give up on a timeout — keep drinking until actually hydrated.
  // (The old step.t > 1.5 timeout could abandon a severely dehydrated villager
  // before they'd recovered, leading to death spirals.)
  if(b.hydration >= 0.92){ witnessEvent(v, 'Drank water'); return true; }
  return false;
}
function doEatStep(v, step, dtH){
  const f = firstFood(v);
  if(f){
    v.inv[f]--; stripItemProvenance(v, f, 1); v.state = 'eat'; v.moving = false;
    const b = ensureBody(v);
    b.satiety = clamp(b.satiety + FOOD_VAL[f] * dtH * 4, 0, 1);
    b.lastMeal = 0; step.eatT = (step.eatT || 0) + dtH;
    if(step.eatT > 0.3 || b.satiety >= 0.95){ witnessEvent(v, 'Ate ' + f); return true; }
    return false;
  }
  if(!step.foraged){
    step.foraged = true;
    const innHasBread = typeof FOOD_STOCK !== 'undefined' && (FOOD_STOCK.inn || 0) > 0;
    // Only detour to the inn if there's bread to take AND we haven't already
    // tried (prevents an infinite go/take/eat loop on an empty inn — the plan
    // must fail honestly so the utility AI can try forage/fish/buy instead).
    if(innHasBread && !step.innTried){
      v.plan.splice(0, 1,
        { verb: 'go', place: 'inn', guard: step.guard },
        { verb: 'take', what: 'bread', from: 'inn', guard: step.guard },
        { verb: 'eat', guard: step.guard, innTried: true });
      return false;
    }
  }
  v.thoughts = [{ text: 'No food to be found', val: -3 }];
  return true;
}
function doTakeStep(v, step, dtH){
  const what = step.what || 'log';
  if(step.from === 'inn' || step.from === 'shop'){
    const p = placePos(step.from);
    if(!p) return true;
    const r = planMoveToward(v, p.x, p.y, dtH);
    if(r !== true) return r === 'stuck';
    if(what === 'bread' && FOOD_STOCK[step.from] > 0){
      FOOD_STOCK[step.from]--; addInv(v, 'bread', 1);
      witnessEvent(v, 'Took bread from the ' + step.from);
    } else v.thoughts = [{ text: 'Nothing to take here', val: -2 }];
    return true;
  }
  if(!step.pile){
    step.pile = nearestPileWith(v, what);
    if(!step.pile){ v.thoughts = [{ text: 'No ' + what + ' to take', val: -1 }]; return true; }
  }
  const p = step.pile;
  if(Math.hypot(v.x - p.x, v.y - p.y) > CS * 1.6){
    const r = planMoveToward(v, p.x, p.y, dtH);
    return r === 'stuck' ? true : false;
  }
  const n = Math.min(p.items[what] || 0, 3);
  if(n <= 0){ step.pile = null; return false; }
  p.items[what] -= n; addInv(v, what, n); cleanPile(p);
  // Phase 2A+: provenance rides with the items. Prefer real pile records;
  // fall back to the legacy felledBy tag (hand-tagged log piles, e.g. tests).
  if(!movePileProvenance(p, v, what, n) && what === 'log' && p.felledBy){
    const prov = createProvenance(p.felledBy, {}, 0.5, v.name, p.felledDay);
    recordUsage(prov, 'felled', p.felledBy);
    attachItemProvenance(v, 'log', n, prov);
  }
  if((p.items[what] || 0) <= 0 && p.prov) delete p.prov[what]; // no stale pile records
  witnessEvent(v, 'Took ' + n + ' ' + what);
  return true;
}
function doDropStep(v, step, dtH){
  const what = step.what || 'log', n = Math.min(step.n || 1, v.inv[what] || 0);
  if(n <= 0){ v.thoughts = [{ text: 'Nothing to drop', val: -1 }]; return true; }
  v.inv[what] -= n;
  const recs = stripItemProvenance(v, what, n); // records leave with the items
  const dp = dropPileAt(v.x, v.y, what, n);
  if(recs.length){ const pl = pileProvList(dp, what); for(const r of recs) pl.push(r); }
  v.state = 'idle';
  return true;
}
function doUseStep(v, step, dtH){
  const what = step.what || 'log', on = step.on || 'firepit';
  const f = FIRES[0];
  if(!f) return true;
  if(Math.hypot(v.x - f.x, v.y - f.y) > CS * 2.5){
    const r = planMoveToward(v, f.x, f.y + 24, dtH);
    return r === 'stuck' ? true : false;
  }
  if((v.inv[what] || 0) <= 0){ v.thoughts = [{ text: 'No ' + what + ' to burn', val: -1 }]; return true; }
  v.inv[what]--; stripItemProvenance(v, what, 1); f.burnH += 2.5;
  v.state = 'work';
  witnessEvent(v, 'Fed the campfire');
  logEvent('fire', v.name + ' stoked the campfire');
  return true;
}
function doSpeakStep(v, step, dtH){
  v.state = 'chat'; v.moving = false;
  if(!step.said){
    step.said = true;
    const text = step.text || '...';
    for(const o of VILLAGERS){
      if(o === v || o.dead) continue;
      if(distCells(v, o) <= 12){
        witnessEvent(o, v.name + ' said: "' + text + '"');
        addBond(v, o, 0.03);
      }
    }
    witnessEvent(v, 'Said to ' + (step.to || 'everyone') + ': "' + text + '"');
  }
  if(step.t > 0.15){ v.state = 'idle'; return true; }
  return false;
}
function doFellStep(v, step, dtH){
  if(!step.tree || step.tree.stage <= 0 || WILDTREES.indexOf(step.tree) === -1){
    step.tree = nearestTree(v);
    if(!step.tree){ v.thoughts = [{ text: 'No trees left to fell', val: -1 }]; return true; }
    step.tx = step.tree.wx * CS + 16; step.ty = step.tree.wy * CS + 16;
  }
  const t = step.tree;
  if(Math.hypot(v.x - step.tx, v.y - step.ty) > CS * 1.6){
    const r = planMoveToward(v, step.tx, step.ty, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  const rate = dtH * (1 - (ensureBody(v).injury || 0) * 0.5);
  step.prog = (step.prog || 0) + rate;
  if(step.prog >= 1.2){
    t.stage--; step.prog = 0;
    if(t.stage <= 0){
      const cc = cellChunk(t.wx, t.wy); if(cc.c.tStage){ cc.c.tStage[cc.i] = 0; markChunkDirty(cc.c); }
      const ti = WILDTREES.indexOf(t); if(ti >= 0) WILDTREES.splice(ti, 1);
      const fellPile = dropPileAt(step.tx, step.ty, 'log', 3);
      fellPile.felledBy = v.name; fellPile.felledDay = W.day; // Phase 2A provenance
      const treeId = (typeof ensureTreeId === 'function') ? ensureTreeId(t) : null; // Phase 2F: stable tree identity
      if(treeId && typeof recordFelledTree === 'function') recordFelledTree(t, v.name);
      const fprov = createProvenance(v.name, {}, 0.5, v.name, W.day);
      if(treeId) fprov.treeId = treeId; // Phase 2F: material lineage root
      recordUsage(fprov, 'felled', v.name);
      const fpl = pileProvList(fellPile, 'log');
      for(let i = 0; i < 3; i++) fpl.push(Object.assign({}, fprov, { history: fprov.history.slice() }));
      witnessEvent(v, 'Felled a tree');
      step.tree = null;
      return true;
    }
  }
  return false;
}
function doForageStep(v, step, dtH){
  if(!step.spot){ step.spot = findForageSpot(v); if(!step.spot){ v.thoughts = [{ text: 'Nothing to forage', val: -1 }]; return true; } }
  const s = step.spot;
  if(Math.hypot(v.x - s.x, v.y - s.y) > CS * 1.6){
    const r = planMoveToward(v, s.x, s.y, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog >= 0.5){
    if(s.kind === 'bush'){
      const cc = cellChunk(s.wx, s.wy);
      if(cc.c){
        // Foraged bushes regrow after 4 days (negative value = regrow day).
        // This keeps foraging sustainable; without it the finite bushes run
        // out and the village starves once the inn bread is gone.
        cc.c.bush[cc.i] = -(W.day + 4);
        const bc = cc.c.bushCells;
        if(bc){ const k = bc.indexOf(cc.i); if(k >= 0) bc.splice(k, 1); }
        markChunkDirty(cc.c);
      }
      addInv(v, 'berries', 2 + Math.floor(srand() * 3));
    } else addInv(v, 'stone', 1 + Math.floor(srand() * 2));
    witnessEvent(v, 'Foraged ' + s.kind);
    return true;
  }
  return false;
}
function nearWater3(v){
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++)
    if(getWaterDepth(wx + dx, wy + dy) > 0) return true;
  return false;
}
function doFishStep(v, step, dtH){
  if(!nearWater3(v)){
    const p = placePos(step.place || 'lake');
    if(!p) return true;
    const r = planMoveToward(v, p.x, p.y, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH * occupationBonusFor(v, 'fishing');
  step.cast = (step.cast || 0) + dtH * occupationBonusFor(v, 'fishing');
  if(step.cast >= 0.5){
    step.cast = 0;
    let ch = 0.35;
    if(W.rain > 0.2 && W.rain < 0.7) ch += 0.15;
    if(W.tod > 6 && W.tod < 10) ch += 0.1;
    if(srand() < ch){ addInv(v, 'fish', 1); witnessEvent(v, 'Caught a fish!'); }
  }
  if(step.prog >= (step.hours || 2)) return true;
  return false;
}
function doFarmStep(v, step, dtH){
  if(!step.crop){
    let best = null, bd = 1e9;
    for(const c of CROPS){
      if(c.stage < 3) continue;
      const d = Math.hypot(c.wx * CS + 16 - v.x, c.wy * CS + 16 - v.y);
      if(d < bd){ bd = d; best = c; }
    }
    step.crop = best;
    if(!best){ v.thoughts = [{ text: 'No ripe crops', val: -1 }]; return true; }
  }
  const c = step.crop;
  const cx = c.wx * CS + 16, cy = c.wy * CS + 16;
  if(Math.hypot(v.x - cx, v.y - cy) > CS * 1.6){
    const r = planMoveToward(v, cx, cy, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH * occupationBonusFor(v, 'farming');
  if(step.prog >= 0.4){
    addInv(v, 'crop', 2); c.stage = 0; c.grow = 0;
    witnessEvent(v, 'Harvested crops');
    return true;
  }
  return false;
}
function doBuildStep(v, step, dtH){
  const what = step.what || 'campfire';
  if(what === 'campfire'){
    if((v.inv.log || 0) < 3){
      if(!step.fetched){
        step.fetched = true;
        v.plan.splice(0, 1,
          { verb: 'take', what: 'log', from: 'pile', guard: step.guard },
          { verb: 'build', what: 'campfire', guard: step.guard, fetched: true });
        return false;
      }
      v.thoughts = [{ text: 'Need logs to build a campfire', val: -2 }];
      return true;
    }
    v.inv.log -= 3;
    const fx = v.x, fy = v.y + 20;
    VILLAGE_OBJECTS.push({ kind: 'firepit', wx: Math.floor(fx / CS), wy: Math.floor(fy / CS), x: fx, y: fy });
    FIRES.push({ wx: Math.floor(fx / CS), wy: Math.floor(fy / CS), x: fx, y: fy, burnH: 1 });
    v.state = 'work';
    logEvent('fire', v.name + ' built a campfire');
    witnessEvent(v, 'Built a campfire');
    return true;
  }
  v.thoughts = [{ text: 'Cannot build ' + what, val: -1 }];
  return true;
}
function doCookStep(v, step, dtH){
  let fire = null;
  for(const f of FIRES){
    if(f.burnH > 0 && Math.hypot(v.x - f.x, v.y - f.y) < CS * 3){ fire = f; break; }
  }
  if(!fire){
    const p = placePos('firepit');
    if(p){ const r = planMoveToward(v, p.x, p.y, dtH); if(r !== true) return r === 'stuck'; }
    fire = FIRES.find(f => f.burnH > 0);
    if(!fire){ v.thoughts = [{ text: 'The fire is out; cannot cook', val: -2 }]; return true; }
  }
  if((v.inv.fish || 0) <= 0){ v.thoughts = [{ text: 'No raw fish to cook', val: -1 }]; return true; }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH * occupationBonusFor(v, 'cooking');
  if(step.prog >= 0.5){
    step.prog = 0; v.inv.fish--;
    addInv(v, 'cookedFish', 1);
    witnessEvent(v, 'Cooked a fish over the fire');
  }
  if((v.inv.fish || 0) <= 0 || step.t > 3) return true;
  return false;
}
/* ---- plan compiler: verbs -> steps. Unknown verbs rejected. ---- */
function planForVerb(v, action){
  const A = action || {}, steps = [];
  const goPlace = (place) => {
    const p = placePos(place);
    if(!p) return { ok: false, reason: 'unknown place: ' + place };
    steps.push({ verb: 'go', place, tx: p.x, ty: p.y });
    return { ok: true };
  };
  switch(A.kind){
    case 'go':
      if(A.wx != null && A.wy != null) steps.push({ verb: 'go', tx: A.wx * CS + 16, ty: A.wy * CS + 16 });
      else if(A.place){ const r = goPlace(A.place); if(!r.ok) return r; }
      else if(A.person){
        const t = VILLAGERS.find(o => o.name === A.person && !o.dead);
        if(!t) return { ok: false, reason: 'no such person' };
        steps.push({ verb: 'go', person: A.person, tx: t.x, ty: t.y, follow: true });
      }
      else return { ok: false, reason: 'go needs place, person, or wx/wy' };
      break;
    case 'drink': { const r = goPlace('well'); if(!r.ok) return r; steps.push({ verb: 'drink' }); break; }
    case 'eat': steps.push({ verb: 'eat' }); break;
    case 'sleep': steps.push({ verb: 'sleep', hours: A.hours || 8 }); break;
    case 'rest': steps.push({ verb: 'rest', hours: A.hours || 1 }); break;
    case 'wait': steps.push({ verb: 'wait', hours: A.hours || 0.5 }); break;
    case 'take': steps.push({ verb: 'take', what: A.what || 'log', from: A.from || 'pile' }); break;
    case 'drop': steps.push({ verb: 'drop', what: A.what || 'log', n: A.n || 1 }); break;
    case 'use': steps.push({ verb: 'use', what: A.what || 'log', on: A.on || 'firepit' }); break;
    case 'speak': steps.push({ verb: 'speak', to: A.to || null, text: A.text || '...' }); break;
    case 'fell': steps.push({ verb: 'fell' }); break;
    case 'forage': steps.push({ verb: 'forage' }); break;
    case 'fish': { const r = goPlace('lake'); if(!r.ok) return r; steps.push({ verb: 'fish', hours: A.hours || 2 }); break; }
    case 'farm': steps.push({ verb: 'farm' }); break;
    case 'build': steps.push({ verb: 'build', what: A.what || 'campfire' }); break;
    case 'cook': { const r = goPlace('firepit'); if(!r.ok) return r; steps.push({ verb: 'cook' }); break; }
    default: return { ok: false, reason: 'unknown verb' };
  }
  return { ok: true, steps };
}
/* ---- plan executor: one step at a time, interruptible by survivalGuard ---- */
function planTick(v, dtH){
  if(!v.plan || !v.plan.length) return;
  const step = v.plan[0];
  step.t = (step.t || 0) + dtH;
  let done = false;
  switch(step.verb){
    case 'go': {
      if(step.place && step.tx == null){
        const p = placePos(step.place);
        if(!p){ v.plan.shift(); return; }
        step.tx = p.x; step.ty = p.y;
      }
      // 2E fix: steps that name a person but carry no coords (socialize_X,
      // teach/tell intents) resolve person->coords instead of walking into NaN.
      if(step.person && (step.tx == null || step._personFollow)){
        const t = VILLAGERS.find(o => o.name === step.person && !o.dead);
        if(t && Number.isFinite(t.x) && Number.isFinite(t.y)){
          step.tx = t.x; step.ty = t.y; step._personFollow = true;
        } else {
          v.plan.shift();
          v.thoughts = [{ text: 'Cannot reach ' + step.person + ' — giving up the trip', val: -2 }];
          return;
        }
      }
      if(step.follow){
        const t = VILLAGERS.find(o => o.name === step.person && !o.dead);
        if(t){ step.tx = t.x; step.ty = t.y; } else { v.plan.shift(); return; }
      }
      // 2E fix: non-finite destination can never be walked to — abandon honestly.
      if(!Number.isFinite(step.tx) || !Number.isFinite(step.ty)){
        v.plan.shift();
        v.thoughts = [{ text: 'Nowhere clear to go — abandoning the trip', val: -2 }];
        return;
      }
      const r = planMoveToward(v, step.tx, step.ty, dtH);
      if(r === true) done = true;
      else if(r === 'stuck'){ v.plan.shift(); v.thoughts = [{ text: 'Could not reach destination', val: -2 }]; return; }
      break;
    }
    case 'wait': v.state = 'idle'; v.moving = false; if(step.t > (step.hours || 0.5)) done = true; break;
    case 'rest': v.state = 'rest'; v.moving = false; if(step.t > (step.hours || 1)) done = true; break;
    case 'sleep':
      v.state = 'sleep'; v.moving = false;
      if(step.indoors !== false) v.inBuilding = true;
      if(ensureBody(v).fatigue < 0.12 || step.t > (step.hours || 9)){ v.inBuilding = false; done = true; }
      break;
    case 'drink': done = doDrinkStep(v, step, dtH); break;
    case 'eat': {
      const r = doEatStep(v, step, dtH);
      if(r === true) done = true;
      else if(r === false && v.plan[0] !== step) return; // step replaced itself
      break;
    }
    case 'take': done = doTakeStep(v, step, dtH); break;
    case 'drop': done = doDropStep(v, step, dtH); break;
    case 'use': done = doUseStep(v, step, dtH); break;
    case 'speak': done = doSpeakStep(v, step, dtH); break;
    case 'fell': done = doFellStep(v, step, dtH); break;
    case 'forage': done = doForageStep(v, step, dtH); break;
    case 'fish': done = doFishStep(v, step, dtH); break;
    case 'farm': done = doFarmStep(v, step, dtH); break;
    case 'build': done = doBuildStep(v, step, dtH); break;
    case 'cook': done = doCookStep(v, step, dtH); break;
    default: v.plan.shift(); return;
  }
  if(done) v.plan.shift();
}
/* ---- rewritten bridge: verbs queue plans; nothing teleports. ---- */
window.__aiBridge.postAction = function(name, action){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return { ok: false, reason: 'no such villager' };
  if(v.dead) return { ok: false, reason: 'villager is dead' };
  if(!action || VERBS.indexOf(action.kind) === -1) return { ok: false, reason: 'unknown verb' };
  const r = planForVerb(v, action);
  if(!r.ok) return r;
  for(const s of r.steps){ if(action.guard) s.guard = true; }
  v.plan = v.plan.concat(r.steps);
  v.brainControlled = true;
  return { ok: true, queued: r.steps.length };
};
window.__aiBridge.setBrainControlled = function(name, on){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return false;
  v.brainControlled = !!on;
  if(!on) v.plan = [];
  return true;
};
