/* =====================================================================
   PART 14F: WIRING — verb registration, planTick cases, wrappers,
   intent patterns, bridge additions, perception, inspector, render.
   ===================================================================== */
VERBS.push('tend', 'rescue', 'hunt', 'craft', 'mend', 'repair');
const __pfv14 = planForVerb;
planForVerb = function(v, action){
  const A = action || {};
  switch(A.kind){
    case 'tend': return { ok: true, steps: [{ verb: 'tend', person: A.person || null }] };
    case 'rescue': {
      const t = A.person ? findPerson(A.person) : nearestDowned(v);
      if(!t) return { ok: false, reason: 'no one down to rescue' };
      return { ok: true, steps: [{ verb: 'rescue', person: t.name }] };
    }
    case 'hunt': return { ok: true, steps: [{ verb: 'hunt', kind: A.kind2 || A.animal || 'any' }] };
    case 'craft': return RECIPES[A.what] ? { ok: true, steps: [{ verb: 'craft', what: A.what }] } : { ok: false, reason: 'unknown recipe: ' + A.what };
    case 'mend': return { ok: true, steps: [{ verb: 'mend' }] };
    case 'repair': return { ok: true, steps: [{ verb: 'repair', building: A.building || 'nearest' }] };
    case 'build':
      if(A.what === 'fence' || A.what === 'hut' || A.what === 'coop')
        return { ok: true, steps: [{ verb: 'build', what: A.what }] };
      return __pfv14(v, action);
    default: return __pfv14(v, action);
  }
};
const __pt14 = planTick;
planTick = function(v, dtH){
  if(v.dead) return;
  if(v.downed){
    downedTick(v, dtH);
    if(v.downed && v.downed.kind !== 'leg') return; // unconscious / bleeding out: incapacitated
  }
  const step = v.plan && v.plan[0];
  if(step){
    let done = false;
    switch(step.verb){
      case 'tend': done = doTendStep(v, step, dtH); break;
      case 'rescue': done = doRescueStep(v, step, dtH); break;
      case 'hunt': done = doHuntStep(v, step, dtH); break;
      case 'craft': done = doCraftStep(v, step, dtH); break;
      case 'mend': done = doMendStep(v, step, dtH); break;
      case 'repair': done = doRepairStep(v, step, dtH); break;
      default:
        step.t = (step.t || 0) + dtH;
        __pt14(v, dtH);
        return;
    }
    step.t = (step.t || 0) + dtH;
    if(done) v.plan.shift();
    return;
  }
  __pt14(v, dtH);
};
const __pm14 = planMoveToward;
planMoveToward = function(v, tx, ty, dtH){
  if(v.dead) return 'stuck';
  if(v.downed && v.downed.kind !== 'leg') return 'stuck';
  let scale = 1;
  if(v.carrying) scale *= 0.45;
  if(hasFracture(v, 'leg')) scale *= 0.18; // crawl
  return __pm14(v, tx, ty, dtH * scale);
};
const __sg14 = survivalGuard;
survivalGuard = function(v){
  if(v.dead || v.downed) return;
  // Lethal physiological needs are evaluated FIRST and are never suppressed by
  // beast threats: previously a wolf within 10 cells made this function return
  // early, so a villager harassed for hours never drank/slept/ate and died of
  // dehydration or exhaustion while fleeing. (Close-range wildfire flight keeps
  // absolute priority via the 13c fleeFire guard, which needs never override.)
  __sg14(v);
  const cur = v.plan && v.plan.length ? v.plan[0] : null;
  if(cur && cur.guard && !cur.flee) return; // needs plan or fire flight active
  const th = nearestThreat(v);
  if(th){
    const d = Math.hypot(th.x - v.x, th.y - v.y) / CS;
    if(d < 12){
      if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
        const sigKind = (th.kind === 'wildfire' || th.kind === 'fire') ? 'wildfire' : (th.kind || 'wolf');
        const intensity = +clamp(1.0 - (d / 12) * 0.35, 0.65, 0.95).toFixed(3);
        FeelingSubstrate.receiveSignal(v, FeelingSubstrate.normalizeEvent(sigKind, null, {
          source: 'threat_guard',
          intensity: intensity,
          dist: +d.toFixed(1)
        }));
      }
    }
    if(!(cur && cur.guard) && d < 10){
      const brave = skillLvl(v, 'hunting') >= 4 || v.name === 'Gareth';
      if(!(brave && countNearbyVillagers(v, 8) >= 2 && th.kind === 'wolf')){
        const bp = nearestBuildingPos(v);
        if(bp){
          // Wildfire flight keeps absolute priority (fleeFire: never overridden
          // by needs); beast flight yields to critical physiological needs.
          const isFire = th.kind === 'wildfire';
          const fleeStep = { verb: 'go', tx: bp.x, ty: bp.y, guard: true };
          if(isFire) fleeStep.fleeFire = true; else fleeStep.flee = true;
          v.plan = [fleeStep];
          v.thoughts = [{ text: 'Fleeing from danger!', val: -6 }];
          learnDanger(v, th.kind === 'wildfire' ? 'wildfire' : th.kind + ' nearby');
        }
      }
    }
  }
};
const __bt14 = bodyTick;
bodyTick = function(v, dtH){
  if(v.dead) return;
  __bt14(v, dtH);
  if(v.dead) return;
  woundTick(v, dtH);
  clothingTick(v, dtH);
};
const __st14 = simTick;
simTick = function(dtH){
  __st14(dtH);
  animalFrameTick(dtH);
};
const __uv14 = updateVillagerAI;
updateVillagerAI = function(v, dtH){
  if(v.dead) return;
  if(v.downed) downedTick(v, dtH);
  if(v.downed && v.downed.kind !== 'leg') return; // unconscious / bleeding out: no actions
  __uv14(v, dtH);
  if(v.dead || v.downed) return;
  rescueInstinct(v, dtH);
  herbalistDuty(v, dtH);
};
const __upp14 = updatePlayerPawn;
updatePlayerPawn = function(v, dtH){
  if(v.dead) return;
  if(v.downed){
    downedTick(v, dtH);
    if(v.downed && v.downed.kind !== 'leg') return; // incapacitated: no keyboard movement
  }
  __upp14(v, dtH);
};
/* skill-scaled work rates on the classic verbs */
doFellStep = withSkillRate(doFellStep, 'foraging', 5);
doFarmStep = withSkillRate(doFarmStep, 'farming', 4);
doFishStep = withSkillRate(doFishStep, 'fishing', 4);
doCookStep = withSkillRate(doCookStep, 'cooking', 4);
doForageStep = withSkillRate(doForageStep, 'foraging', 4);
doForageStep = (function(prev){
  return function(v, step, dtH){
    const r = prev(v, step, dtH);
    if(r === true && step && !step.herbBonus){
      step.herbBonus = true;
      const med = v.talents && v.talents.strong && v.talents.strong.indexOf('medicine') >= 0;
      if(step.spot && step.spot.kind === 'bush' && (med || srand() < 0.45)) addInv(v, 'herb', med ? 2 : 1);
      if(step.spot && step.spot.kind === 'shore'){ addInv(v, 'fiber', 2); if(srand() < 0.5) addInv(v, 'thatch', 1); }
    }
    return r;
  };
})(doForageStep);
const __build14b = doBuildStep;
doBuildStep = withSkillRate(doBuildStep, 'building', 4);
doBuildStep = (function(prev){
  return function(v, step, dtH){
    if(step.what === 'fence' || step.what === 'hut' || step.what === 'coop') return doConstructStep(v, step, dtH);
    return prev(v, step, dtH);
  };
})(doBuildStep);
/* butcher: carcasses (hunted game) join the pipeline */
const __butcher14 = doButcherStep;
doButcherStep = function(v, step, dtH){
  if(!step.chicken){
    let best = null, bd = 1e9, isCarc = false;
    for(const c of CARCASSES){ const d = Math.hypot(c.x - v.x, c.y - v.y); if(d < bd){ bd = d; best = c; isCarc = true; } }
    for(const c of CHICKENS){ const d = Math.hypot(c.x - v.x, c.y - v.y); if(d < bd){ bd = d; best = c; isCarc = false; } }
    if(best && isCarc){
      if(Math.hypot(v.x - best.x, v.y - best.y) > CS * 1.6){
        const r = planMoveToward(v, best.x, best.y, dtH);
        return r === 'stuck' ? true : false;
      }
      v.state = 'work'; v.moving = false;
      step.prog = (step.prog || 0) + dtH * skillMult(v, 'hunting');
      if(step.prog >= 1.2){
        const i = CARCASSES.indexOf(best); if(i >= 0) CARCASSES.splice(i, 1);
        addInv(v, 'rawMeat', best.meat); addInv(v, 'hide', best.hide);
        gainXP(v, 'hunting', 6);
        witnessEvent(v, 'Butchered a ' + best.kind + ' (' + best.meat + ' meat, ' + best.hide + ' hide)');
        logEvent('butcher', v.name + ' butchered a ' + best.kind);
        return true;
      }
      return false;
    }
  }
  return __butcher14(v, step, dtH);
};
/* cook: raw meat becomes cookedMeat; desperate villagers eat raw meat and risk sickness */
const __cook14 = doCookStep;
doCookStep = function(v, step, dtH){
  if((v.inv.fish || 0) <= 0 && (v.inv.rawMeat || 0) > 0){
    let fire = null;
    for(const f of FIRES) if(f.burnH > 0 && Math.hypot(v.x - f.x, v.y - f.y) < CS * 3){ fire = f; break; }
    if(!fire){
      const p = placePos('firepit');
      if(p){ const r = planMoveToward(v, p.x, p.y, dtH); if(r !== true) return r === 'stuck'; }
      fire = FIRES.find(f => f.burnH > 0);
      if(!fire){ v.thoughts = [{ text: 'The fire is out; cannot cook', val: -2 }]; return true; }
    }
    v.state = 'work'; v.moving = false;
    step.prog = (step.prog || 0) + dtH * skillMult(v, 'cooking');
    if(step.prog >= 0.6){
      step.prog = 0; v.inv.rawMeat--;
      addInv(v, 'cookedMeat', 1); gainXP(v, 'cooking', 3);
      witnessEvent(v, 'Cooked meat over the fire');
    }
    if((v.inv.rawMeat || 0) <= 0 || step.t > 3) return true;
    return false;
  }
  return __cook14(v, step, dtH);
};
FOOD_VAL.cookedMeat = 0.55;
const __ff14 = firstFood;
firstFood = function(v){
  for(const f of ['cookedMeat', 'bread', 'cookedFish', 'berries', 'crop', 'egg', 'fish'])
    if((v.inv[f] || 0) > 0) return f;
  if((v.inv.rawMeat || 0) > 0) return 'rawMeat'; // desperation only
  return __ff14(v);
};
const __eat14 = doEatStep;
doEatStep = function(v, step, dtH){
  if(firstFood(v) === 'rawMeat'){
    v.inv.rawMeat--; v.state = 'eat'; v.moving = false;
    const b = ensureBody(v);
    b.satiety = clamp(b.satiety + 0.25 * dtH * 4, 0, 1);
    b.lastMeal = 0; step.eatT = (step.eatT || 0) + dtH;
    if(step.eatT > 0.3){
      if(srand() < 0.3){
        b.illness = clamp((b.illness || 0) + 0.3, 0, 1);
        witnessEvent(v, 'Ate raw meat and feels sick');
      } else witnessEvent(v, 'Ate raw meat (desperate)');
      return true;
    }
    return false;
  }
  return __eat14(v, step, dtH);
};
/* init: talents, skills, work priorities, baseline clothing, wildlife */
const __iv14 = initVillagers;
initVillagers = function(){
  __iv14();
  const TALENTS = {
    Marta: { strong: ['farming'], weak: ['hunting'] },
    Bram: { strong: ['building'], weak: ['fishing'] },
    Sella: { strong: ['cooking'], weak: ['hunting'] },
    Tobin: { strong: ['cooking'], weak: ['farming'] },
    Wren: { strong: ['medicine', 'foraging'], weak: ['building'] },
    Finn: { strong: ['fishing'], weak: ['farming'] },
    Alden: { strong: [], weak: ['hunting'] },
    Pip: { strong: ['foraging'], weak: ['cooking'] },
    Rowan: { strong: [], weak: [] },
    Clara: { strong: ['cooking'], weak: ['hunting'] },
    Gareth: { strong: ['hunting'], weak: ['farming'] }
  };
  for(const v of VILLAGERS){
    ensureSkills(v);
    const t = TALENTS[v.name] || { strong: [], weak: [] };
    v.talents = t;
    for(const s of t.strong) v.skills[s].lvl = 3;
    v.workPrio = { farm: 5, cook: 5, build: 5, tend: 5, forage: 5, hunt: 3, fish: 5, tailor: 3, haul: 4, rest: 5 };
    v.clothes = { base: null, outer: null, feet: null };
    v.clothes.base = { type: 'tunic', dur: 0.7 + srand() * 0.3 };
  }
  initWildlife();
};
/* intent patterns for the new verbs */
function normAnimal14(s){
  s = String(s || '').toLowerCase();
  if(s === 'wolves' || s === 'wolfs') return 'wolf';
  if(s === 'boars') return 'boar';
  if(s === 'bears') return 'bear';
  if(s === 'game' || s === 'deer') return 'any';
  return s;
}
INTENT_PATTERNS.unshift(
  { re: /\bhunt\b.{0,20}\b(wolfs?|wolves|boars?|bears?|game|deer)\b/,
    plan: (m) => [{ verb: 'hunt', kind: normAnimal14(m[1]) }] },
  { re: /\brescue\b(?:\s+(\w+))?/,
    plan: (m) => [{ verb: 'rescue', person: m[1] ? capName(m[1]) : null }] },
  { re: /\btend to (\w+)/,
    plan: (m) => [{ verb: 'tend', person: capName(m[1]) }] },
  { re: /\b(make|craft|brew|prepare)\b.{0,20}\b(poultice|splint|fever ?tea)\b/,
    plan: (m) => [{ verb: 'craft', what: m[2].toLowerCase().replace(/\s+/g, '') === 'fevertee' ? 'feverTea' : m[2].toLowerCase() }] },
  { re: /\b(make|craft|sew|tailor)\b.{0,20}\b(tunic|cloak|boots|coat|cloth)\b/,
    plan: (m) => [{ verb: 'craft', what: m[2].toLowerCase() }] },
  { re: /\bmend\b.{0,15}\b(clothes|clothing|garments?|tunic|cloak|boots|coat)\b/,
    plan: () => [{ verb: 'mend' }] },
  { re: /\bbuild\b.{0,20}\b(fence|hut|coop|chicken ?coop)\b/,
    plan: (m) => [{ verb: 'build', what: m[1].replace(/chicken ?/, '') }] },
  { re: /\brepair\b/,
    plan: () => [{ verb: 'repair' }] }
);
/* bridge: work assignment */
window.__aiBridge.assignWork = function(name, job, prio){
  const v = findPerson(name);
  if(!v) return { ok: false, reason: 'no such villager' };
  if(!v.workPrio) v.workPrio = {};
  v.workPrio[job] = (prio == null ? 5 : prio);
  return { ok: true, job: job, priority: v.workPrio[job] };
};
window.__aiBridge.getWork = function(name){
  const v = findPerson(name);
  return v ? Object.assign({}, v.workPrio || {}) : null;
};
/* perception: own skills, wounds, clothing, downed — in words, never numbers of others */
const __getP14 = window.__aiBridge.getPerception;
window.__aiBridge.getPerception = function(name){
  const p = __getP14(name);
  if(!p) return p;
  const v = VILLAGERS.find(x => x.name === name);
  if(!v || v.dead) return p;
  p.skills = skillWords(v);
  const b = v.body || {};
  const ww = [];
  for(const w of (b.wounds || [])){
    ww.push((w.dressed ? 'a bandaged ' : 'an open ') + w.loc +
      (w.fracture ? (w.splint ? ' (splinted)' : ' (broken)') : '') +
      (w.bleed > 0.05 ? ', still bleeding' : '') +
      (w.inf > 0.5 ? ', feverish' : ''));
  }
  if(ww.length) p.wounds = ww;
  if(v.downed) p.downed = 'down (' + v.downed.cause + ')';
  if(v.clothes){
    const bits = [];
    for(const slot of ['base', 'outer', 'feet']){
      const g = v.clothes[slot];
      if(g) bits.push(g.type + ((g.dur || 1) < 0.3 ? ' (tattered)' : ''));
    }
    p.clothing = bits.length ? 'wearing ' + bits.join(', ') : 'wearing only rags';
  }
  return p;
};
/* inspector: skills + gear rows */
const __boot14 = boot;
boot = function(){
  __boot14();
  const box = document.getElementById('pi-act-box');
  if(box && !document.getElementById('pi-skills')){
    box.insertAdjacentHTML('afterend',
      '<div class="pi-need-row" id="pi-skills" style="font-size:12px;color:#cbd5e1;padding:4px 0;"></div>' +
      '<div class="pi-need-row" id="pi-gear" style="font-size:12px;color:#cbd5e1;padding:2px 0;"></div>');
  }
};
const __hud14 = updateHUD;
updateHUD = function(){
  __hud14();
  const v = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
  const se = document.getElementById('pi-skills');
  if(v && se){
    ensureSkills(v);
    const top = SKILLS.map(s => ({ s: s, l: v.skills[s].lvl })).sort((a, b) => b.l - a.l).slice(0, 3);
    se.textContent = '🛠 ' + top.map(t => t.s + ' ' + t.l.toFixed(1)).join(' · ');
  }
  const ge = document.getElementById('pi-gear');
  if(v && ge){
    const bits = [];
    if(v.clothes) for(const slot of ['base', 'outer', 'feet']){
      const g = v.clothes[slot];
      if(g) bits.push(g.type + ((g.dur || 1) < 0.3 ? '✂' : ''));
    }
    const w = (v.body && v.body.wounds || []).length;
    ge.textContent = (bits.length ? '👕 ' + bits.join(', ') : '👕 ragged') +
      (w ? ' · 🤕 ' + w + ' wound(s)' : '') + (v.downed ? ' · DOWN (' + v.downed.cause + ')' : '');
  }
};
/* render: animals, carcasses, fences */
const __dpo14 = drawParityOverlay;
drawParityOverlay = function(){
  __dpo14();
  if(typeof ctx === 'undefined' || !ctx) return;
  const z = cam.zoom;
  for(const a of ANIMALS){
    const s = w2s(a.x, a.y);
    if(a.kind === 'wolf'){
      ctx.fillStyle = '#6b7280';
      ctx.beginPath(); ctx.ellipse(s[0], s[1], 9 * z, 5 * z, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#4b5563';
      ctx.beginPath(); ctx.ellipse(s[0] + 8 * z, s[1] - 2 * z, 4 * z, 3.5 * z, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 2 * z;
      ctx.beginPath(); ctx.moveTo(s[0] - 9 * z, s[1]); ctx.lineTo(s[0] - 14 * z, s[1] - 4 * z); ctx.stroke();
    } else if(a.kind === 'boar'){
      ctx.fillStyle = '#7c4a2d';
      ctx.beginPath(); ctx.ellipse(s[0], s[1], 8 * z, 5.5 * z, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#a0714f';
      ctx.beginPath(); ctx.ellipse(s[0] + 7 * z, s[1] + 1 * z, 3 * z, 2.5 * z, 0, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = '#4a3525';
      ctx.beginPath(); ctx.ellipse(s[0], s[1], 12 * z, 8 * z, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#5d4630';
      ctx.beginPath(); ctx.ellipse(s[0] + 10 * z, s[1] - 3 * z, 5 * z, 4.5 * z, 0, 0, 7); ctx.fill();
    }
    if(a.state === 'stalk' || a.state === 'attack'){
      ctx.fillStyle = '#ef4444';
      ctx.font = Math.max(9, 11 * z) + 'px system-ui, sans-serif';
      ctx.fillText('!', s[0] - 3 * z, s[1] - 10 * z);
    }
  }
  for(const c of CARCASSES){
    const s = w2s(c.x, c.y);
    ctx.fillStyle = '#991b1b';
    ctx.beginPath(); ctx.ellipse(s[0], s[1], 8 * z, 4 * z, 0, 0, 7); ctx.fill();
  }
  for(const f of FENCES){
    const s = w2s(f.x, f.y);
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3 * z;
    ctx.beginPath(); ctx.moveTo(s[0] - 12 * z, s[1]); ctx.lineTo(s[0] + 12 * z, s[1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s[0] - 12 * z, s[1] - 8 * z); ctx.lineTo(s[0] - 12 * z, s[1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s[0] + 12 * z, s[1] - 8 * z); ctx.lineTo(s[0] + 12 * z, s[1]); ctx.stroke();
  }
  for(const c of COOPS){
    const s = w2s(c.x, c.y);
    ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2 * z;
    ctx.strokeRect(s[0] - 14 * z, s[1] - 10 * z, 28 * z, 14 * z);
  }
};
