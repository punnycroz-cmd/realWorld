/* =====================================================================
   PART 14E: REALISTIC BUILDING — materials matter, integrity per
   structure, repair verb, fences (wolf deterrent), coops, multi-day huts.
   ===================================================================== */
function bInteg(b){ if(b.integrity == null){ b.integrity = 1; b.maxInteg = 1; } return b; }
const CONSTRUCT = {
  fence:    { needs: { log: 4 }, hours: 4, skill: 'building' },
  coop:     { needs: { log: 6 }, hours: 10, skill: 'building' },
  hut:      { needs: { log: 12, stone: 8, thatch: 4 }, hours: 30, skill: 'building', capacity: 2 },
  barn:     { needs: { log: 10, stone: 6, thatch: 4 }, hours: 25, skill: 'building', capacity: 8 },
  workshop: { needs: { log: 12, stone: 8, thatch: 2 }, hours: 30, skill: 'building', capacity: 4 },
  kitchen:  { needs: { log: 8, stone: 10, thatch: 2 }, hours: 28, skill: 'building', capacity: 4, hasFire: true }
};
function doConstructStep(v, step, dtH){
  const what = step.what;
  const spec = CONSTRUCT[what];
  if(!spec){ v.thoughts = [{ text: 'Cannot construct ' + what, val: -1 }]; return true; }
  if(step.sx == null){ step.sx = v.x; step.sy = v.y + 30; }
  if(!step.paid){
    for(const k in spec.needs){
      if((v.inv[k] || 0) < spec.needs[k]){
        v.thoughts = [{ text: 'Need ' + spec.needs[k] + ' ' + k + ' to build ' + what, val: -2 }];
        return true;
      }
    }
    for(const k in spec.needs){ v.inv[k] -= spec.needs[k]; stripItemProvenance(v, k, spec.needs[k]); }
    step.paid = true;
  }
  if(Math.hypot(v.x - step.sx, v.y - step.sy) > CS * 2){
    const r = planMoveToward(v, step.sx, step.sy, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.workH = (step.workH || 0) + dtH * skillMult(v, 'building') * (hasFracture(v, 'arm') ? 0.5 : 1);
  if(step.workH >= spec.hours){
    const shoddy = skillLvl(v, 'building') < 2 && srand() < 0.25;
    if(what === 'fence') FENCES.push({ x: step.sx, y: step.sy, integrity: shoddy ? 0.7 : 1 });
    else if(what === 'coop') COOPS.push({ x: step.sx, y: step.sy, integrity: shoddy ? 0.7 : 1 });
    else {
      const bwx = Math.floor(step.sx / CS), bwy = Math.floor(step.sy / CS);
      const tw = (what === 'barn' || what === 'workshop') ? 5 : 4;
      const th = 4;
      const id = what + '_' + Math.floor(srand() * 100000);
      const cap = spec.capacity || 2;
      const sprKey = (what === 'barn' ? 'barn' : (what === 'workshop' ? 'workshop' : (what === 'kitchen' ? 'kitchen' : 'house1')));
      const bldName = v.name + '’s ' + what.charAt(0).toUpperCase() + what.slice(1);
      const hasFire = !!spec.hasFire;
      const bObj = {
        id: id, kind: what, name: bldName,
        wx: bwx, wy: bwy,
        x: bwx * CS, y: bwy * CS, tw: tw, th: th,
        sprKey: sprKey,
        door: { wx: bwx + Math.floor(tw / 2), wy: bwy + th },
        indoorTemp: 20.0,
        cleanliness: 1.0,
        capacity: cap,
        owner: v.name, // NOTE: household entities arrive in Phase 2E; ownership will become actualOwner in Phase 2F
        integrity: shoddy ? 0.7 : 1, maxInteg: 1,
        hasFire: hasFire,
        fireplaceLit: hasFire,
        daysUnoccupied: 0,
        residents: [v.name],
        materials: Object.assign({}, spec.needs)
      };
      VILLAGE_BUILDINGS.push(bObj);
      for(let dy=0; dy<th; dy++) for(let dx=0; dx<tw; dx++){
        const {c, i} = cellChunk(bwx + dx, bwy + dy);
        c.h[i] = SEA + 0.15;
        c.tileType[i] = 0;
        c.tStage[i] = 0;
        c.treeType[i] = 0;
        clearBushCell(c, i);
      }
    }
    gainXP(v, 'building', 10);
    witnessEvent(v, 'Built a ' + what + (shoddy ? ' (shoddy workmanship)' : ''));
    logEvent('build', v.name + ' built a ' + what);
    return true;
  }
  return false;
}
function doRepairStep(v, step, dtH){
  let b = null;
  if(step.building && step.building !== 'nearest' && step.building !== 'roof'){
    b = VILLAGE_BUILDINGS.find(x => x.id === step.building || x.kind === step.building || x.name.toLowerCase().includes(step.building.toLowerCase()));
  }
  if(!b){
    let bd = 1e9;
    for(const x of VILLAGE_BUILDINGS){
      bInteg(x);
      if(x.integrity < x.maxInteg - 0.01){
        const d = Math.hypot((x.wx + x.tw / 2) * CS - v.x, (x.wy + x.th) * CS - v.y);
        if(d < bd){ bd = d; b = x; }
      }
    }
  }
  if(!b){ v.thoughts = [{ text: 'Nothing needs repair', val: 1 }]; return true; }
  bInteg(b);
  const bx = (b.wx + b.tw / 2) * CS, by = (b.wy + b.th) * CS + 20;
  if(!step.paid){
    if((v.inv.log || 0) < 2 && (v.inv.stone || 0) < 2){
      v.thoughts = [{ text: 'Need wood or stone to repair', val: -2 }];
      return true;
    }
    if((v.inv.log || 0) >= 2) v.inv.log -= 2; else v.inv.stone -= 2;
    step.paid = true;
  }
  if(Math.hypot(v.x - bx, v.y - by) > CS * 2.5){
    const r = planMoveToward(v, bx, by, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.workH = (step.workH || 0) + dtH * skillMult(v, 'building');
  if(step.workH >= 3){
    b.integrity = clamp(b.integrity + 0.5, 0, b.maxInteg);
    gainXP(v, 'building', 6);
    witnessEvent(v, 'Repaired ' + b.name);
    logEvent('repair', v.name + ' repaired ' + b.name);
    return true;
  }
  return false;
}
