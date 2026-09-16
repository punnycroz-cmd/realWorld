/* =====================================================================
   PART 13C: BUTCHER, CORPSE DECAY + BURIAL, WILDFIRE BUILDING DAMAGE,
   CHILD PROPORTIONS, BRIDGE ADDITIONS, EXTENDED AUTOTEST
   ===================================================================== */
function doButcherStep(v, step, dtH){
  if(!step.chicken || CHICKENS.indexOf(step.chicken) === -1){
    let best = null, bd = 1e9;
    for(const c of CHICKENS){
      const d = Math.hypot(c.x - v.x, c.y - v.y);
      if(d < bd){ bd = d; best = c; }
    }
    if(!best){ v.thoughts = [{ text:'No chickens to butcher', val:-2 }]; return true; }
    step.chicken = best;
  }
  const c = step.chicken;
  if(Math.hypot(v.x - c.x, v.y - c.y) > CS * 1.6){
    const r = planMoveToward(v, c.x, c.y, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog >= 0.8){
    const i = CHICKENS.indexOf(c); if(i >= 0) CHICKENS.splice(i, 1);
    addInv(v, 'rawMeat', 2);
    witnessEvent(v, 'Butchered a chicken');
    logEvent('butcher', v.name + ' butchered a chicken');
    return true;
  }
  return false;
}
/* ---- corpse decay: fresh -> decayed -> bones -> gone (~3 days) ---- */
const GRAVES = [];
function corpseTick(h){
  for(const v of VILLAGERS.slice()){
    if(!v.dead || v.buried) continue;
    v.corpseT = (v.corpseT || 0) + h;
    v.corpseStage = v.corpseT < 24 ? 0 : v.corpseT < 48 ? 1 : v.corpseT < 72 ? 2 : 3;
    if(v.corpseStage >= 1 && !v.decayNoted){
      v.decayNoted = true;
      for(const o of VILLAGERS){
        if(o === v || o.dead) continue;
        if(distCells(o, v) < 10){
          witnessEvent(o, 'The smell of decay hangs near ' + v.name + '\'s body');
          learnDanger(o, 'rotting corpse');
        }
      }
    }
    if(v.corpseStage >= 3){
      const i = VILLAGERS.indexOf(v); if(i >= 0) VILLAGERS.splice(i, 1);
      logEvent('decay', v.name + '\'s remains have returned to the earth');
    }
  }
}
function doBuryStep(v, step, dtH){
  if(!step.corpse || step.corpse.buried || VILLAGERS.indexOf(step.corpse) === -1){
    let best = null, bd = 1e9;
    for(const o of VILLAGERS){
      if(!o.dead || o.buried) continue;
      if(step.name && o.name !== step.name) continue;
      const d = Math.hypot(o.x - v.x, o.y - v.y);
      if(d < bd){ bd = d; best = o; }
    }
    if(!best){ v.thoughts = [{ text: step.name ? 'Cannot find ' + step.name : 'No one to bury', val:-1 }]; return true; }
    step.corpse = best;
  }
  const c = step.corpse;
  if(Math.hypot(v.x - c.x, v.y - c.y) > CS * 2){
    const r = planMoveToward(v, c.x, c.y, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog >= 1.0){
    c.buried = true;
    GRAVES.push({ x:c.x, y:c.y, name:c.name, day:W.day });
    const i = VILLAGERS.indexOf(c); if(i >= 0) VILLAGERS.splice(i, 1);
    logEvent('burial', v.name + ' buried ' + c.name);
    showToast('🪦 ' + v.name + ' laid ' + c.name + ' to rest');
    for(const o of VILLAGERS){
      if(o === v || o.dead) continue;
      if(distCells(o, v) < 16) witnessEvent(o, 'Attended ' + c.name + '\'s burial; a somber quiet fell');
    }
    return true;
  }
  return false;
}
/* ---- wildfire damages buildings: scorch -> ruined -> rubble ---- */
const RUINED = [];
function fireBuildingTick(h){
  for(const b of BURNING){
    const bx = b.wx * CS + 16, by = b.wy * CS + 16;
    for(const bd of VILLAGE_BUILDINGS.slice()){
      const cx = (bd.wx + bd.tw / 2) * CS, cy = (bd.wy + bd.th / 2) * CS;
      if(Math.abs(bx - cx) < (bd.tw / 2 + 1.5) * CS && Math.abs(by - cy) < (bd.th / 2 + 1.5) * CS){
        bd.scorch = (bd.scorch || 0) + h;
        if(bd.scorch > 6 && !bd.ruined){
          bd.ruined = true;
          RUINED.push({ id:bd.id, name:bd.name, wx:bd.wx, wy:bd.wy, tw:bd.tw, th:bd.th, sprKey:bd.sprKey });
          const bi = VILLAGE_BUILDINGS.indexOf(bd); if(bi >= 0) VILLAGE_BUILDINGS.splice(bi, 1);
          VILLAGE_OBJECTS.push({ kind:'rubble', wx:bd.wx, wy:bd.wy, x:cx, y:cy });
          logEvent('fire', bd.name + ' burned down!');
          showToast('🔥 ' + bd.name + ' has burned down!');
          for(const v of VILLAGERS){
            if(v.dead) continue;
            if(distCells(v, { x:cx, y:cy }) < 20){
              witnessEvent(v, 'Watched ' + bd.name + ' burn down');
              learnDanger(v, 'wildfire');
            }
          }
        } else if(bd.scorch > 2 && !bd.scorchNoted){
          bd.scorchNoted = true;
          logEvent('fire', bd.name + ' is scorched by wildfire');
        }
      }
    }
    for(const v of VILLAGERS){
      if(v.dead) continue;
      if(Math.hypot(v.x - bx, v.y - by) < CS * 2.2){
        learnDanger(v, 'wildfire');
        if(!v.plan || !v.plan.length || !v.plan[0].fleeFire){
          const dx = v.x - bx, dy = v.y - by, d = Math.hypot(dx, dy) || 1;
          v.plan = [{ verb:'go', tx:v.x + dx / d * CS * 6, ty:v.y + dy / d * CS * 6, guard:true, fleeFire:true }].concat(v.plan || []);
        }
      }
    }
  }
}
/* survivalGuard: flee active flames before anything else */
const __survivalGuard12 = survivalGuard;
survivalGuard = function(v){
  if(v.dead) return;
  let fx = null, fd = 1e9;
  for(const b of BURNING){
    const d = Math.hypot(v.x - (b.wx * CS + 16), v.y - (b.wy * CS + 16));
    if(d < fd){ fd = d; fx = b; }
  }
  if(fx && fd < CS * 2.5 && !(v.plan && v.plan.length && v.plan[0].guard)){
    const dx = v.x - (fx.wx * CS + 16), dy = v.y - (fx.wy * CS + 16), d = Math.hypot(dx, dy) || 1;
    v.plan = [{ verb:'go', tx:v.x + dx / d * CS * 7, ty:v.y + dy / d * CS * 7, guard:true, fleeFire:true }];
    v.thoughts = [{ text:'Fleeing the flames!', val:-4 }];
    learnDanger(v, 'wildfire');
    return;
  }
  __survivalGuard12(v);
};
const __parityWorldTick13 = parityWorldTick;
parityWorldTick = function(dtH){
  __parityWorldTick13(dtH);
  corpseTick(dtH);
  fireBuildingTick(dtH);
};
/* build: repair scorched buildings, rebuild ruins */
const __doBuildStep12 = doBuildStep;
doBuildStep = function(v, step, dtH){
  const what = step.what || 'campfire';
  if(what === 'repair' || what === 'rebuild'){
    if(what === 'repair'){
      let target = step.building;
      if(!target || target.ruined || VILLAGE_BUILDINGS.indexOf(target) === -1){
        let best = null, bd = 1e9;
        for(const b of VILLAGE_BUILDINGS){
          if(!(b.scorch > 0)) continue;
          const cx = (b.wx + b.tw / 2) * CS, cy = (b.wy + b.th / 2) * CS;
          const d = Math.hypot(v.x - cx, v.y - cy);
          if(d < bd){ bd = d; best = b; }
        }
        if(!best){ v.thoughts = [{ text:'Nothing needs repair', val:0 }]; return true; }
        step.building = best; target = best;
      }
      const cx = (target.wx + target.tw / 2) * CS, cy = (target.wy + target.th) * CS + 20;
      if(Math.hypot(v.x - cx, v.y - cy) > CS * 2.5){
        const r = planMoveToward(v, cx, cy, dtH);
        return r === 'stuck' ? true : false;
      }
      if((v.inv.log || 0) < 2){ v.thoughts = [{ text:'Need 2 logs to repair', val:-2 }]; return true; }
      v.inv.log -= 2;
      target.scorch = 0; target.scorchNoted = false;
      v.state = 'work';
      witnessEvent(v, 'Repaired ' + target.name);
      logEvent('build', v.name + ' repaired ' + target.name);
      return true;
    }
    let ruin = step.ruin;
    if(!ruin || RUINED.indexOf(ruin) === -1){
      ruin = RUINED[0];
      if(!ruin){ v.thoughts = [{ text:'Nothing to rebuild', val:0 }]; return true; }
      step.ruin = ruin;
    }
    const cx = (ruin.wx + ruin.tw / 2) * CS, cy = (ruin.wy + ruin.th) * CS + 20;
    if(Math.hypot(v.x - cx, v.y - cy) > CS * 2.5){
      const r = planMoveToward(v, cx, cy, dtH);
      return r === 'stuck' ? true : false;
    }
    if((v.inv.log || 0) < 6){ v.thoughts = [{ text:'Need 6 logs to rebuild', val:-2 }]; return true; }
    v.inv.log -= 6;
    const ri = RUINED.indexOf(ruin); if(ri >= 0) RUINED.splice(ri, 1);
    VILLAGE_BUILDINGS.push({ id:ruin.id, name:ruin.name, wx:ruin.wx, wy:ruin.wy,
      x:ruin.wx * CS, y:ruin.wy * CS, tw:ruin.tw, th:ruin.th, sprKey:ruin.sprKey, scorch:0,
      door:{ wx:ruin.wx + Math.floor(ruin.tw / 2), wy:ruin.wy + ruin.th } });
    for(let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--){
      const o = VILLAGE_OBJECTS[i];
      if(o.kind === 'rubble' && o.wx === ruin.wx && o.wy === ruin.wy) VILLAGE_OBJECTS.splice(i, 1);
    }
    v.state = 'work';
    witnessEvent(v, 'Rebuilt ' + ruin.name);
    logEvent('build', v.name + ' rebuilt ' + ruin.name);
    return true;
  }
  return __doBuildStep12(v, step, dtH);
};
/* corpse rendering with decay stages */
drawCorpse = function(v){
  const cw = cv.width / dpr, ch = cv.height / dpr;
  const sx = Math.round((v.x - cam.x) * cam.zoom + cw / 2);
  const sy = Math.round((v.y - cam.y) * cam.zoom + ch / 2);
  const F = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  const fr = F && F[0] && F[0].idle && F[0].idle[0];
  const stage = v.corpseStage || 0;
  ctx.save();
  ctx.globalAlpha = stage >= 2 ? 0.35 : 0.7;
  ctx.translate(sx, sy); ctx.rotate(Math.PI / 2.3);
  if(fr){
    const pCvs = resolveSprCvs(fr);
    if(pCvs) ctx.drawImage(pCvs, -24 * cam.zoom, -32 * cam.zoom, 48 * cam.zoom, 64 * cam.zoom);
  }
  ctx.restore();
  ctx.fillStyle = stage >= 1 ? 'rgba(100,116,139,0.9)' : 'rgba(15,23,42,0.85)';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText((stage >= 2 ? '🦴 ' : '☠ ') + v.name, sx - 24, sy - 42 * cam.zoom);
};
/* ---- child proportions: big head, short limbs — not a shrunken adult ---- */
function childScales(s){ return { head: s * 1.25, body: s * 0.85 }; }
function drawChildPawn(v, cw, ch){
  const sx = Math.round((v.x - cam.x) * cam.zoom + cw / 2);
  const sy = Math.round((v.y - cam.y) * cam.zoom + ch / 2);
  const z = cam.zoom;
  if(v === VILLAGERS[controlledPawnIdx]){
    ctx.save(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.ellipse(sx, sy + 2, 14 * z, 6 * z, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  } else if(v === VILLAGERS[inspectedPawnIdx]){
    ctx.save(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.ellipse(sx, sy + 2, 13 * z, 5.5 * z, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 2, 9 * z, 3.5 * z, 0, 0, Math.PI * 2); ctx.fill();
  const F = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  let fr = null;
  const dir = v.face === 1 ? 1 : ((v.face === 2 || v.face === 3) ? 2 : 0);
  if(F && F[dir]){
    const act = (v.state === 'walk' || v.state === 'wade' || v.state === 'swim') ? 'walk' : (v.state === 'work' ? 'work' : 'idle');
    const arr = F[dir][act] || F[dir].idle;
    const fi = (v.state === 'walk' || v.state === 'wade' || v.state === 'swim') ? Math.floor(v.walkPhase * 4) % arr.length : 0;
    fr = arr[fi % arr.length];
  }
  if(!fr) return;
  const cvs = resolveSprCvs(fr);
  if(!cvs) return;
  const s = v.childScale || 0.62;
  const sc = childScales(s);
  let bounce = v.triumphT > 0 ? -Math.sin(v.triumphT * Math.PI) * 5 * z : 0;
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  let yOffset = 0;
  if(depth > 0.05 && v.canSwim){ yOffset = 18 * z; bounce += Math.sin(W.tod * 40 + (v.seed || 0)) * 2 * z; }
  else if(depth > 0 && depth <= 0.05) yOffset = 4 * z;
  const headW = 48 * sc.head * z, headH = 26 * sc.head * z;
  const bodyW = 48 * sc.body * z, bodyH = 38 * sc.body * z;
  const feetY = sy + bounce + yOffset;
  const bodyTop = feetY - bodyH;
  const headTop = bodyTop + 4 * z - headH;
  ctx.save();
  if(v.face === 3){
    ctx.translate(sx, 0); ctx.scale(-1, 1);
    ctx.drawImage(cvs, 0, 26, 48, 38, -bodyW / 2, bodyTop, bodyW, bodyH);
    ctx.drawImage(cvs, 0, 0, 48, 26, -headW / 2, headTop, headW, headH);
  } else {
    ctx.drawImage(cvs, 0, 26, 48, 38, sx - bodyW / 2, bodyTop, bodyW, bodyH);
    ctx.drawImage(cvs, 0, 0, 48, 26, sx - headW / 2, headTop, headW, headH);
  }
  ctx.restore();
}
const __renderChibiPawn12 = renderChibiPawn;
renderChibiPawn = function(v, cw, ch){
  if(!v.dead && !v.adult && (v.childScale || 1) !== 1){ drawChildPawn(v, cw, ch); return; }
  __renderChibiPawn12(v, cw, ch);
};
/* overlay: graves, scorch tint, rubble piles */
const __drawParityOverlay12 = drawParityOverlay;
drawParityOverlay = function(){
  __drawParityOverlay12();
  if(!ctx) return;
  const z = cam.zoom;
  for(const g of GRAVES){
    const s = w2s(g.x, g.y);
    ctx.font = Math.max(10, 14 * z) + 'px system-ui, sans-serif';
    ctx.fillText('🪦', s[0] - 7 * z, s[1]);
  }
  for(const b of VILLAGE_BUILDINGS){
    if(b.scorch > 2 && !b.ruined){
      const s = w2s((b.wx + b.tw / 2) * CS, (b.wy + b.th / 2) * CS);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(s[0] - b.tw * CS * z / 2, s[1] - b.th * CS * z / 2, b.tw * CS * z, b.th * CS * z);
    }
  }
  for(const o of VILLAGE_OBJECTS){
    if(o.kind !== 'rubble') continue;
    const s = w2s(o.x, o.y);
    ctx.fillStyle = '#78716c';
    ctx.beginPath(); ctx.ellipse(s[0], s[1], 14 * z, 7 * z, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#57534e';
    ctx.beginPath(); ctx.ellipse(s[0] - 6 * z, s[1] - 3 * z, 6 * z, 4 * z, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s[0] + 7 * z, s[1] - 2 * z, 5 * z, 3 * z, 0, 0, Math.PI * 2); ctx.fill();
  }
};
/* perception: own gold + dream count + nearby graves (honest: self-known) */
const __getPerception12 = window.__aiBridge.getPerception;
window.__aiBridge.getPerception = function(name){
  const p = __getPerception12(name);
  if(!p || p.dead) return p;
  const v = VILLAGERS.find(x => x.name === name);
  if(v){
    p.gold = v.gold || 0;
    p.dreams = (v.dreams || []).length;
    const gs = [];
    for(const g of GRAVES){
      const dc = Math.hypot((g.x - v.x) / CS, (g.y - v.y) / CS);
      if(dc <= 30) gs.push({ what:'a grave marker for ' + g.name, where:compassDir(g.x - v.x, g.y - v.y), distance:distWords(dc) });
    }
    if(gs.length) p.nearby = (p.nearby || []).concat(gs.slice(0, 3));
  }
  return p;
};