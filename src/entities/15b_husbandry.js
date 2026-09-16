/* =====================================================================
   PART 15B: ANIMAL HUSBANDRY — tame wild chickens / boar piglets with
   offered food (foraging aptitude); tamed stock lives in pens & coops,
   must be fed or it sickens and goes wild; fed hens lay more; tamed
   boars grow and breed slowly. Wolves fear fenced ground and cannot
   pick off penned stock.
   ===================================================================== */
function doTameStep(v, step, dtH){
  const wantBoar = step.what === 'boar';
  let target = null, bd = 1e9;
  if(!wantBoar){
    for(const c of CHICKENS){
      if(c.tamed) continue;
      const d = Math.hypot(c.x - v.x, c.y - v.y);
      if(d < bd){ bd = d; target = c; }
    }
  } else {
    for(const a of ANIMALS){
      if(a.kind !== 'boar' || !a.young || a.tamed || a.dead) continue;
      const d = Math.hypot(a.x - v.x, a.y - v.y);
      if(d < bd){ bd = d; target = a; }
    }
  }
  if(!target){ v.thoughts = [{ text: 'No wild ' + (wantBoar ? 'piglet' : 'chicken') + ' to tame', val: -1 }]; return true; }
  const food = (v.inv.berries || 0) > 0 ? 'berries' : ((v.inv.crop || 0) > 0 ? 'crop' : null);
  if(!food){ v.thoughts = [{ text: 'Need food to offer for taming', val: -2 }]; return true; }
  if(Math.hypot(v.x - target.x, v.y - target.y) > CS * 1.6){
    const r = planMoveToward(v, target.x, target.y, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog >= 0.8){
    step.prog = 0; v.inv[food]--; stripItemProvenance(v, food, 1); step.tries = (step.tries || 0) + 1;
    const chance = 0.25 + 0.07 * skillLvl(v, 'foraging');
    if(srand() < chance){
      target.tamed = true; target.neglect = 0; target.fed = 1;
      let pen = null, pd = 1e9;
      for(const b of VILLAGE_BUILDINGS){
        if(b.kind === 'barn' || b.id === 'barn' || b.id.startsWith('barn')){
          const d = Math.hypot((b.wx + b.tw/2)*CS - v.x, (b.wy + b.th)*CS - v.y);
          if(d < pd){ pd = d; pen = { x: (b.wx + b.tw/2)*CS, y: (b.wy + b.th)*CS, building: b.id }; }
        }
      }
      for(const cp of COOPS){
        const d = Math.hypot(cp.x - v.x, cp.y - v.y);
        if(d < pd){ pd = d; pen = { x: cp.x, y: cp.y }; }
      }
      if(!pen && FENCES.length){ const f = FENCES[0]; pen = { x: f.x, y: f.y }; }
      target.pen = pen || { x: v.x, y: v.y };
      gainXP(v, 'foraging', 6);
      witnessEvent(v, 'Tamed a ' + (wantBoar ? 'piglet' : 'chicken') + '!');
      logEvent('tame', v.name + ' tamed a ' + (wantBoar ? 'piglet' : 'chicken'));
      return true;
    }
    witnessEvent(v, 'The ' + (wantBoar ? 'piglet' : 'chicken') + ' shies away...');
    if(step.tries >= 3) return true;
  }
  return false;
}
/* tamed chickens: pen fidelity, feeding, neglect, bonus laying */
const __chickenTick15 = chickenTick;
chickenTick = function(h){
  __chickenTick15(h);
  for(const c of CHICKENS){
    if(!c.tamed) continue;
    if(c.pen){
      const d = Math.hypot(c.x - c.pen.x, c.y - c.pen.y);
      if(d > CS * 4){
        c.x = c.pen.x + (srand() - 0.5) * CS * 4;
        c.y = c.pen.y + (srand() - 0.5) * CS * 4;
      }
    }
    c.feedT = (c.feedT || 0) + h;
    if(c.feedT >= 6){
      c.feedT = 0;
      let fed = false;
      const px = c.pen ? c.pen.x : c.x, py = c.pen ? c.pen.y : c.y;
      for(const p of PILES){
        if((p.items.crop || 0) > 0 || (p.items.berries || 0) > 0){
          if(Math.hypot(p.x - px, p.y - py) < CS * 4){
            if(p.items.crop > 0) p.items.crop--; else p.items.berries--;
            cleanPile(p); fed = true; break;
          }
        }
      }
      if(fed){ c.fed = 1; c.neglect = 0; c.eggT -= 4; }
      else {
        c.neglect = (c.neglect || 0) + 1;
        if(c.neglect >= 3){
          c.tamed = false; c.pen = null;
          logEvent('neglect', 'A tamed chicken went wild from neglect');
        }
      }
    }
  }
};
/* tamed boars: growth, pen fidelity, slow breeding — chained onto the animal tick */
const __animalFrameTick15 = animalFrameTick;
animalFrameTick = function(dtH){
  __animalFrameTick15(dtH);
  const pens = {};
  for(const a of ANIMALS){
    if(a.kind !== 'boar' || !a.tamed || a.dead) continue;
    if(a.young){
      a.ageT = (a.ageT || 0) + dtH;
      if(a.ageT > 240){ a.young = false; a.hp = a.maxhp = ANIMAL_DEFS.boar.hp; logEvent('grow', 'A tamed piglet grew into a boar'); }
    }
    if(a.pen){
      const d = Math.hypot(a.x - a.pen.x, a.y - a.pen.y);
      if(d > CS * 6) moveAnimal(a, a.pen.x, a.pen.y, dtH, 0.8);
      const key = Math.round(a.pen.x / CS) + '_' + Math.round(a.pen.y / CS);
      (pens[key] = pens[key] || []).push(a);
    }
  }
  for(const k of Object.keys(pens)){
    const herd = pens[k].filter(a => !a.young);
    if(herd.length >= 2 && srand() < 0.02 * dtH){
      const p = pens[k][0].pen;
      const pig = spawnAnimal('boar', p.x + (srand() - 0.5) * CS * 2, p.y + (srand() - 0.5) * CS * 2);
      pig.young = true; pig.hp = pig.maxhp = 6; pig.tamed = true; pig.pen = { x: p.x, y: p.y };
      logEvent('birth', 'A piglet was born in the pen');
    }
  }
};
/* piglets in the wild + wolves fear fences and cannot take penned stock */
const __initWildlife15 = initWildlife;
initWildlife = function(){
  __initWildlife15();
  for(let i = 0; i < 2; i++){
    const p = spawnAnimal('boar', (-30 + i * 6) * CS + 16, (-20 + i * 3) * CS + 16);
    p.young = true; p.hp = p.maxhp = 6;
  }
};
const __wolfBrain15 = wolfBrain;
wolfBrain = function(a, dtH){
  if(a.kind === 'wolf' && fenceNear(a.x, a.y, 6)){
    const ang = Math.atan2(a.y, a.x);
    moveAnimal(a, a.x + Math.cos(ang) * CS * 10, a.y + Math.sin(ang) * CS * 10, dtH, 1.2);
    a.state = 'flee'; return;
  }
  const hidden = [];
  for(let i = CHICKENS.length - 1; i >= 0; i--){
    const c = CHICKENS[i];
    if(c.tamed && c.pen && fenceNear(c.pen.x, c.pen.y, 6)){ hidden.push([i, c]); CHICKENS.splice(i, 1); }
  }
  try { return __wolfBrain15(a, dtH); }
  finally { for(const [i, c] of hidden) CHICKENS.splice(Math.min(i, CHICKENS.length), 0, c); }
};
