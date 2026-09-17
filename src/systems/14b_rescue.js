/* =====================================================================
   PART 14B: REALISTIC DOWNED / RESCUE.
   Downed states: unconscious, bleeding out, broken leg. Rescue carries
   the downed to shelter. survivalGuard gains threat-flee + rescue instinct.
   ===================================================================== */
function setDowned(v, kind, cause){
  if(v.dead || v.downed) return;
  if(v.carrying){ v.carrying.carriedBy = null; v.carrying = null; } // drop what you carry
  v.downed = { kind: kind, t: 0, cause: cause };
  v.state = 'downed'; v.moving = false; v.plan = [];
  logEvent('downed', v.name + ' is down (' + cause + ')');
  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
    FeelingSubstrate.receiveSignal(v, FeelingSubstrate.normalizeEvent('downed', null, {
      kind: kind,
      cause: cause
    }));
  }
  // Phase 6E E3: Acoustic scream / agony sound propagation with distance falloff
  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.propagateSound === 'function'){
    FeelingSubstrate.propagateSound({
      kind: 'scream',
      originX: v.x,
      originY: v.y,
      source: v,
      radius: 25,
      metadata: { victim: v.name, cause: cause }
    });
  }
  for(const o of VILLAGERS){
    if(o === v || o.dead) continue;
    if(distCells(o, v) < 14){
      witnessEvent(o, 'Saw ' + v.name + ' go down (' + cause + ')');
      if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
        FeelingSubstrate.receiveSignal(o, FeelingSubstrate.normalizeEvent('fear_event', null, {
          source: 'witness_downed',
          who: v.name,
          cause: cause
        }));
      }
    }
  }
}
function downedTick(v, dtH){
  const d = v.downed; if(!d) return;
  d.t += dtH;
  const b = ensureBody(v);
  if(d.kind === 'unconscious'){
    const headOk = !b.wounds.some(w => w.loc === 'head' && w.sev > 0.4 && !w.dressed);
    if(b.fatigue < 0.7 && b.coreTemp > 35.5 && b.coreTemp < 39 && headOk && d.t > 1){
      v.downed = null; v.state = 'rest';
      witnessEvent(v, 'Regained consciousness');
    }
  } else if(d.kind === 'bleeding'){
    // Phase 4 fix: use the same "actively bleeding" predicate as woundTick's
    // down trigger, so a clotted-but-anemic villager can't oscillate
    // downed<->awake every tick (which wiped their plan hourly).
    if(!isActivelyBleeding(v)){
      v.downed = null; v.state = 'rest';
      witnessEvent(v, 'Bleeding stopped; faint but alive');
    }
  } else if(d.kind === 'leg'){
    const legOk = !b.wounds.some(w => w.loc === 'leg' && w.fracture && w.sev > 0.15);
    if(legOk){
      v.downed = null; v.state = 'rest';
      witnessEvent(v, 'Leg mended enough to stand');
    }
  }
}
function nearestBuildingPos(v){
  let best = null, bd = 1e9;
  for(const b of VILLAGE_BUILDINGS){
    const bx = b.door ? (b.door.wx * CS + 16) : (b.wx + (b.tw || 4) / 2) * CS;
    const by = b.door ? (b.door.wy * CS + 26) : (b.wy + (b.th || 4)) * CS + 20;
    const d = Math.hypot(bx - v.x, by - v.y);
    if(d < bd){ bd = d; best = { x: bx, y: by, id: b.id }; }
  }
  return best;
}
function nearestDowned(v){
  let best = null, bd = 1e9;
  for(const o of VILLAGERS){
    if(o === v || !o.downed || o.dead) continue;
    const d = Math.hypot(o.x - v.x, o.y - v.y);
    if(d < bd){ bd = d; best = o; }
  }
  return best;
}
function doRescueStep(v, step, dtH){
  const t = step.person ? findPerson(step.person) : null;
  if(!t || !t.downed || t.dead){ v.carrying = null; return true; }
  if(v.carrying !== t){
    if(Math.hypot(v.x - t.x, v.y - t.y) > CS * 1.6){
      const r = planMoveToward(v, t.x, t.y, dtH);
      return r === 'stuck' ? true : false;
    }
    v.carrying = t; t.carriedBy = v;
    witnessEvent(v, 'Lifted ' + t.name + ' to carry to shelter');
    logEvent('rescue', v.name + ' is carrying ' + t.name + ' to shelter');
    return false;
  }
  const bp = nearestBuildingPos(v);
  if(!bp){ v.carrying = null; t.carriedBy = null; return true; }
  if(Math.hypot(v.x - bp.x, v.y - bp.y) > CS * 2.5){
    const r = planMoveToward(v, bp.x, bp.y, dtH);
    if(r === 'stuck'){
      // blocked: lay them down gently where we stand so they can be tended
      v.carrying = null; t.carriedBy = null;
      t.x = v.x; t.y = v.y; t.state = 'rest';
      witnessEvent(v, 'Could not reach shelter; laid ' + t.name + ' down to rest');
      witnessEvent(t, 'Laid down to rest by ' + v.name);
      return true;
    }
    return false;
  }
  v.carrying = null; t.carriedBy = null;
  t.x = bp.x; t.y = bp.y; t.inBuilding = true; t.state = 'rest';
  witnessEvent(v, 'Laid ' + t.name + ' down inside');
  witnessEvent(t, 'Carried to shelter by ' + v.name);
  gainXP(v, 'medicine', 4);
  if(t.downReason === 'drowning' || (t.body && t.body.drownH > 0)){
    if(typeof observe === 'function'){
      observe(t, { event: 'rescued from drowning', what: 'rescued from deep water by ' + v.name }, {
        topic: 'near_drowning_survivor',
        salience: 0.95,
        source: 'direct',
        bypassAttention: true
      });
    }
  }
  if(typeof observe === 'function'){
    observe(v, { event: 'rescued_villager', what: 'rescued ' + t.name + ' and brought them to shelter' }, {
      topic: 'village_protector',
      salience: 0.92,
      source: 'direct',
      bypassAttention: true
    });
  }
  return true;
}
function nearestThreat(v){
  let best = null, bd = 1e9;
  for(const a of ANIMALS){
    if(a.dead) continue;
    const d = Math.hypot(a.x - v.x, a.y - v.y) / CS;
    if(d < 12 && d < bd){ bd = d; best = { kind: a.kind, x: a.x, y: a.y }; }
  }
  for(const b of BURNING){
    const d = Math.hypot(b.wx * CS + 16 - v.x, b.wy * CS + 16 - v.y) / CS;
    if(d < 3 && d < bd){ bd = d; best = { kind: 'wildfire', x: b.wx * CS + 16, y: b.wy * CS + 16 }; }
  }
  return best;
}
function countNearbyVillagers(v, cells){
  let n = 0;
  for(const o of VILLAGERS){
    if(o === v || o.dead || o.downed) continue;
    if(Math.hypot(o.x - v.x, o.y - v.y) < cells * CS) n++;
  }
  return n;
}
function rescueInstinct(v, dtH){
  if(v.brainControlled || v.dead || v.downed) return;
  if(v.plan && v.plan.length) return;
  for(const o of VILLAGERS){
    if(o === v || !o.downed || o.dead) continue;
    if(Math.hypot(o.x - v.x, o.y - v.y) > CS * 22) continue;
    if(nearestThreat(v)) continue; // not safe yet
    const bond = (v.bonds && v.bonds[o.name]) || 0;
    if(bond > 0.4 || skillLvl(v, 'medicine') >= 3 || v.name === 'Gareth'){
      v.plan = [{ verb: 'rescue', person: o.name }];
      witnessEvent(v, 'Going to rescue ' + o.name);
      return;
    }
  }
}
function herbalistDuty(v, dtH){
  if(v.brainControlled || v.dead || v.downed) return;
  if(v.name !== 'Wren') return;
  if(v.plan && v.plan.length) return;
  if(W.tod < 8 || W.tod > 16) return;
  const stock = (v.inv.poultice || 0) + (v.inv.feverTea || 0);
  if(stock >= 3) return;
  if((v.inv.herb || 0) >= 2){
    v.plan = [{ verb: 'craft', what: (v.inv.poultice || 0) <= (v.inv.feverTea || 0) ? 'poultice' : 'feverTea' }];
  } else {
    v.plan = [{ verb: 'forage' }];
  }
}
