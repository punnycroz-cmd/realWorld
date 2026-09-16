/* =====================================================================
   PART 12A: NATURA V9 PARITY — EVENT LOG, MORTALITY, SURVIVAL GUARD
   (deterministic sim systems; no LLM. Wraps PART 2/4/5/6/8 functions.)
   ===================================================================== */
const EVENTS = [];
let EVENT_SEQ = 0;
function logEvent(kind, text){
  EVENTS.push({ seq: ++EVENT_SEQ, day: W.day, tod: +W.tod.toFixed(2), kind, text });
  if(EVENTS.length > 500) EVENTS.shift();
}
function witnessEvent(v, text){
  if(!v.events) v.events = [];
  v.events.push({ day: W.day, text });
  if(v.events.length > 20) v.events.shift();
}
function learnDanger(v, text){
  if(!v.danger) v.danger = [];
  if(v.danger.indexOf(text) === -1){
    v.danger.push(text);
    logEvent('danger', v.name + ' learned danger: ' + text);
  }
}
function distCells(a, b){
  return Math.hypot((a.x - b.x) / CS, (a.y - b.y) / CS);
}
function placePos(place){
  if(place === 'well'){
    const o = VILLAGE_OBJECTS.find(o => o.kind === 'well');
    return o ? { x: o.x, y: o.y } : null;
  }
  if(place === 'firepit'){
    const f = FIRES.find(f => f.burnH > 0) || FIRES[0];
    return f ? { x: f.x, y: f.y + 24 } : null;
  }
  if(place === 'lake') return { x: 20 * CS + 16, y: 7 * CS + 16 };
  if(place === 'river') return { x: Math.round(getRiverCenter(-8)) * CS + 16, y: -8 * CS + 16 };
  const b = VILLAGE_BUILDINGS.find(b => b.id === place);
  return b ? { x: (b.wx + b.tw / 2) * CS, y: (b.wy + b.th) * CS + 20 } : null;
}

/* ---- Mortality: villagers can die. Called every tick per villager. ---- */
function mortalityTick(v, dtH){
  if(v.dead) return;
  // Downed villagers are already in crisis; the rescue/downed system handles
  // their fate. Killing them from needs while they can't act is double jeopardy
  // (and the AI is disabled while downed, so they can't drink/eat/sleep).
  if(v.downed) return;
  const b = ensureBody(v);
  b.starveH = (b.satiety <= 0.02) ? (b.starveH || 0) + dtH : 0;
  b.dehydH  = (b.hydration <= 0.02) ? (b.dehydH || 0) + dtH : 0;
  b.freezeH = (b.coreTemp < 32) ? (b.freezeH || 0) + dtH : 0;
  b.heatH   = (b.coreTemp > 41) ? (b.heatH || 0) + dtH : 0;
  b.exhH    = (b.fatigue >= 0.999) ? (b.exhH || 0) + dtH : 0;
  // 2E fix: mortality runs before planTick, so a villager who just arrived at
  // the well (drink step queued) would otherwise die before drinking. Don't kill
  // for a need the current step is actively satisfying this tick.
  const curVerb = v.plan && v.plan.length ? v.plan[0].verb : null;
  if(b.starveH > 30 && curVerb !== 'eat') return killVillager(v, 'starvation');
  if(b.dehydH > 20 && curVerb !== 'drink') return killVillager(v, 'dehydration');
  if(v.state === 'drown_panic' && b.oxygen <= 0.05){
    b.drownH = (b.drownH || 0) + dtH;
    if(b.drownH > 0.6) return killVillager(v, 'drowned');
  } else b.drownH = 0;
  if(b.freezeH > 4) return killVillager(v, 'froze to death');
  if(b.heatH > 3)   return killVillager(v, 'heatstroke');
  if(b.exhH > 14 && curVerb !== 'sleep') return killVillager(v, 'collapse from exhaustion');
}
function killVillager(v, cause){
  if(v.dead) return;
  v.dead = true; v.deathCause = cause; v.state = 'dead';
  v.moving = false; v.plan = [];
  logEvent('death', v.name + ' died of ' + cause + ' (day ' + W.day + ')');
  showToast('☠ ' + v.name + ' has died (' + cause + ')');
  for(const o of VILLAGERS){
    if(o === v || o.dead) continue;
    if(distCells(o, v) < 16){
      witnessEvent(o, 'Witnessed ' + v.name + ' die (' + cause + ')');
      learnDanger(o, 'death of ' + v.name);
    }
  }
  if(v === VILLAGERS[controlledPawnIdx]){
    v.isNPC = true; controlledPawnIdx = -1;
    showToast('You have died. Control released.');
  }
  if(typeof updateHUD === 'function') updateHUD();
}

/* ---- survivalGuard: deterministic safety net, runs before any AI. ---- */
function guardPlanFor(v, need){
  if(need === 'drink') return [{ verb: 'go', place: 'well', guard: true }, { verb: 'drink', guard: true }];
  if(need === 'eat')   return [{ verb: 'eat', guard: true }];
  if(need === 'sleep') return [{ verb: 'sleep', hours: 8, guard: true }];
  if(need === 'warm'){
    const f = FIRES.find(f => f.burnH > 0);
    return f ? [{ verb: 'go', place: 'firepit', guard: true }, { verb: 'rest', hours: 2, guard: true }]
             : [{ verb: 'go', place: 'inn', guard: true }, { verb: 'rest', hours: 2, guard: true }];
  }
  if(need === 'cool') return [{ verb: 'go', place: 'lake', guard: true }, { verb: 'rest', hours: 1, guard: true }];
  if(need === 'flee_water'){
    const esc = getShallowEscapeVector(v.x, v.y);
    return [{ verb: 'go', tx: v.x + esc.dx * CS * 4, ty: v.y + esc.dy * CS * 4, guard: true }];
  }
  return [];
}
/* Does the current plan already work toward satisfying a survival need?
   Used so the guard doesn't trample a smart utility-AI plan (or its own
   follow-up steps). Without this, the guard's bare [{verb:'eat'}] would wipe
   a forage/fish/buy plan every tick and trap the villager in a futile loop. */
function planAddressesNeed(plan, need){
  if(!plan || !plan.length) return false;
  for(const s of plan){
    const vb = s.verb;
    if(need === 'eat' && (vb === 'eat' || vb === 'take' || vb === 'forage' ||
        vb === 'fish' || vb === 'farm' || vb === 'cook' || vb === 'buy' ||
        vb === 'trade' || vb === 'recipe')) return true;
    if(need === 'drink' && vb === 'drink') return true;
    if(need === 'sleep' && (vb === 'sleep' || vb === 'rest')) return true;
    if((need === 'warm' || need === 'cool') && (vb === 'rest' || vb === 'sleep')) return true;
    if(need === 'flee_water' && vb === 'go') return true;
  }
  return false;
}
function survivalGuard(v){
  if(v.dead) return;
  const b = ensureBody(v);
  let need = null;
  // Phase 4 fix: lethal triage. If multiple needs are actively killing
  // (counters accumulating), address the most imminent first (smallest
  // hours-to-death: exhaustion 14h, dehydration 20h, starvation 30h).
  // A fixed drink>eat>sleep order lets a villager die of exhaustion while
  // stuck en route to water, because planAddressesNeed sees [go,drink] as
  // "addressing" the drink need and never reconsiders.
  const lethal = [];
  if(b.fatigue >= 0.999) lethal.push(['sleep', 14 - (b.exhH || 0)]);
  if(b.hydration <= 0.02) lethal.push(['drink', 20 - (b.dehydH || 0)]);
  if(b.satiety <= 0.02) lethal.push(['eat', 30 - (b.starveH || 0)]);
  if(lethal.length){
    lethal.sort((a, b2) => a[1] - b2[1]);
    need = lethal[0][0];
  } else if(b.hydration < 0.12) need = 'drink';
  else if(b.satiety < 0.10) need = 'eat';
  else if(b.fatigue > 0.96) need = 'sleep';
  else if(b.coreTemp < 35.0) need = 'warm';
  else if(b.coreTemp > 39.5) need = 'cool';
  else if(v.state === 'drown_panic' && b.oxygen < 0.3) need = 'flee_water';
  if(!need) return;
  // Already working on this need (utility-AI food run, guard's own plan, etc.):
  // don't trample it. Never interrupt a flee — escaping wolves/fire takes
  // precedence; clearing the flee plan every tick traps the villager in place
  // (they neither escape nor eat). They'll address hunger once safe.
  const cur = v.plan && v.plan.length ? v.plan[0] : null;
  if(cur && cur.flee) return;
  if(planAddressesNeed(v.plan, need)) return;
  // For hunger, the guard's bare [{verb:'eat'}] only helps if food is actually
  // at hand. If not, set a forage-then-eat plan directly (don't rely on the
  // utility AI to pick it — it might choose something else or get interrupted).
  if(need === 'eat'){
    const hasFood = (typeof firstFood === 'function' && firstFood(v)) ||
        (typeof FOOD_STOCK !== 'undefined' && (FOOD_STOCK.inn || 0) > 0);
    if(!hasFood){
      v.plan = [{ verb: 'forage', guard: true }, { verb: 'eat', guard: true }];
      v.thoughts = [{ text: 'Survival instinct takes over', val: -2 }];
      return;
    }
  }
  v.plan = guardPlanFor(v, need);
  v.thoughts = [{ text: 'Survival instinct takes over', val: -2 }];
}
/* Routine self-care so the scripted village sustains itself between bells. */
function routineNeeds(v){
  if(v.dead || v.brainControlled || (v.plan && v.plan.length)) return;
  const b = ensureBody(v);
  if(b.hydration < 0.45) v.plan = [{ verb: 'go', place: 'well' }, { verb: 'drink' }];
  else if(b.satiety < 0.40) v.plan = [{ verb: 'eat' }];
  else if(b.fatigue > 0.88 && (W.tod >= 21 || W.tod < 6)) v.plan = [{ verb: 'sleep', hours: 8 }];
  else if(b.fatigue > 0.94) v.plan = [{ verb: 'rest', hours: 2 }];
}

/* ---- Wrappers: install parity behavior without editing PARTs 2-8. ---- */
const __baseBodyTick = bodyTick;
bodyTick = function(v, dtH){
  if(v.dead) return;
  __baseBodyTick(v, dtH);
  // Warmth & drying near a burning campfire (extends base isNearFire)
  const b = v.body;
  let nearFire = false;
  for(const f of FIRES){
    if(f.burnH > 0 && Math.hypot(v.x - f.x, v.y - f.y) < CS * 3){ nearFire = true; break; }
  }
  if(nearFire){
    b.coreTemp += (38.5 - b.coreTemp) * Math.min(1, 0.5 * dtH);
    b.wetness = Math.max(0, b.wetness - dtH * 3);
  }
};
const __baseUpdateVillagerAI = updateVillagerAI;
updateVillagerAI = function(v, dtH){
  if(v.dead) return;
  survivalGuard(v);
  mortalityTick(v, dtH);
  illnessInjuryTick(v, dtH);
  if(v.dead) return;
  if(v.brainControlled){ planTick(v, dtH); return; }
  routineNeeds(v);
  if(v.plan && v.plan.length){ planTick(v, dtH); if(v.plan && v.plan.length) return; }
  __baseUpdateVillagerAI(v, dtH);
};
const __baseUpdatePlayerPawn = updatePlayerPawn;
updatePlayerPawn = function(v, dtH){
  if(v.dead) return;
  survivalGuard(v); // player pawn keeps survival instincts; idle player does not doom the pawn
  mortalityTick(v, dtH);
  illnessInjuryTick(v, dtH);
  if(v.dead) return;
  if(v.plan && v.plan.length){ planTick(v, dtH); }
  __baseUpdatePlayerPawn(v, dtH);
};
const __baseInitVillagers = initVillagers;
initVillagers = function(){
  __baseInitVillagers();
  const META = { Marta: ['f', 26], Bram: ['m', 34], Sella: ['f', 29], Tobin: ['m', 45],
    Wren: ['f', 24], Finn: ['m', 31], Alden: ['m', 68], Pip: ['m', 9],
    Rowan: ['m', 27], Clara: ['f', 30], Gareth: ['m', 35] };
  for(const v of VILLAGERS){
    const m = META[v.name] || ['m', 30];
    v.sex = m[0]; v.ageY = m[1]; v.adult = m[1] >= 16;
    v.childScale = m[1] < 16 ? 0.62 : 1;
    v.inv = {}; v.bonds = {}; v.bondMile = {};
    v.danger = []; v.events = []; v.plan = [];
    v.brainControlled = false; v.pregnant = null; v.chatT = 0;
    const b = ensureBody(v); b.injury = 0; b.illness = 0;
  }
  initParityWorld();
};
const __baseBodyDrives = bodyDrives;
bodyDrives = function(v){
  const out = __baseBodyDrives(v);
  if(v.dead){ out.push({ text: 'Dead', val: -99 }); return out; }
  const b = v.body || {};
  if((b.injury || 0) > 0.6) out.push({ text: 'Sharp pain shoots through an injured limb', val: -6 });
  else if((b.injury || 0) > 0.25) out.push({ text: 'An old injury aches dully', val: -3 });
  if((b.illness || 0) > 0.6) out.push({ text: 'Feverish and weak; illness grips the body', val: -6 });
  else if((b.illness || 0) > 0.25) out.push({ text: 'Sniffling and feverish; coming down with something', val: -3 });
  if(v.pregnant && v.pregnant.days >= 8) out.push({ text: 'A new life stirs within', val: 4 });
  return out;
};
/* Corpse rendering + child scaling, layered over the base pawn renderer. */
function drawCorpse(v){
  const cw = cv.width / dpr, ch = cv.height / dpr;
  const sx = Math.round((v.x - cam.x) * cam.zoom + cw / 2);
  const sy = Math.round((v.y - cam.y) * cam.zoom + ch / 2);
  const F = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  const fr = F && F[0] && F[0].idle && F[0].idle[0];
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.translate(sx, sy); ctx.rotate(Math.PI / 2.3);
  if(fr){
    const pCvs = resolveSprCvs(fr);
    if(pCvs) ctx.drawImage(pCvs, -24 * cam.zoom, -32 * cam.zoom, 48 * cam.zoom, 64 * cam.zoom);
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText('☠ ' + v.name, sx - 24, sy - 42 * cam.zoom);
}
const __baseRenderChibiPawn = renderChibiPawn;
renderChibiPawn = function(v, cw, ch){
  if(v.dead){ drawCorpse(v); return; }
  const s = v.childScale || 1;
  if(s !== 1){
    const sx = Math.round((v.x - cam.x) * cam.zoom + cw / 2);
    const sy = Math.round((v.y - cam.y) * cam.zoom + ch / 2);
    ctx.save(); ctx.translate(sx, sy); ctx.scale(s, s); ctx.translate(-sx, -sy);
    __baseRenderChibiPawn(v, cw, ch);
    ctx.restore();
    return;
  }
  __baseRenderChibiPawn(v, cw, ch);
};
const __baseRenderWorld = renderWorld;
renderWorld = function(){
  __baseRenderWorld();
  drawParityOverlay();
};
function w2s(x, y){
  const cw = cv.width / dpr, ch = cv.height / dpr;
  return [Math.round((x - cam.x) * cam.zoom + cw / 2), Math.round((y - cam.y) * cam.zoom + ch / 2)];
}
