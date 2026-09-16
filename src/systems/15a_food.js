/* =====================================================================
/* =====================================================================
   PART 15: FOOD REALISM + HUSBANDRY + CARAVANS + SOCIAL FRICTION + FIREFIGHTING
   Non-AI systems only: meal quality/spoilage/poisoning, taming/breeding,
   seasonal merchants, insult/rivalry/brawl mechanics, autonomous firefighting.
   ===================================================================== */
/* =====================================================================
   PART 15A: MEAL QUALITY + FOOD SAFETY — poor/fine/lavish meals from
   cooking skill + ingredient variety; spoilage over days (faster in
   heat); food poisoning from raw meat / tainted meals; smoking & salting
   preservation at the firepit. Physical satisfaction only — the thought
   system belongs to the future AI brain.
   ===================================================================== */
const FOOD_SPOIL = { fish:2, rawMeat:2, egg:5, berries:3, bread:6, crop:8,
  cookedFish:3, cookedMeat:3, mealPoor:2, mealFine:3, mealLavish:4,
  smokedMeat:25, smokedFish:20, saltedMeat:45 };
Object.assign(FOOD_VAL, { mealPoor:0.40, mealFine:0.55, mealLavish:0.75,
  smokedMeat:0.45, smokedFish:0.40, saltedMeat:0.45, rawMeat:0.22 });
const __firstFood15 = firstFood;
firstFood = function(v){
  for(const f of ['mealLavish','mealFine','cookedMeat','cookedFish','mealPoor',
      'smokedMeat','smokedFish','bread','egg','berries','crop','fish'])
    if((v.inv[f] || 0) > 0) return f;
  const f2 = __firstFood15(v);
  if(f2) return f2;
  if((v.inv.rawMeat || 0) > 0) return 'rawMeat'; // desperation only
  return null;
};
function computeMealQuality(v, variety){
  return clamp(0.25 + 0.06 * skillLvl(v, 'cooking') + 0.12 * variety + 0.08, 0, 1);
}
function mealTier(q){ return q >= 0.8 ? 'mealLavish' : q >= 0.5 ? 'mealFine' : 'mealPoor'; }
function mealTaintChance(v){ return skillLvl(v, 'cooking') < 2 ? 0.15 : 0; }
function doMealStep(v, step, dtH){
  let fire = null;
  const kit = VILLAGE_BUILDINGS.find(b => (b.kind === 'kitchen' || b.id === 'kitchen' || b.id.startsWith('kitchen')) && b.fireplaceLit);
  const nearKit = kit && Math.hypot(v.x - ((kit.wx + kit.tw/2)*CS), v.y - ((kit.wy + kit.th)*CS)) < CS * 3.5;
  if(nearKit) fire = { x: v.x, y: v.y, burnH: 99, isKitchen: kit };
  if(!fire){
    for(const f of FIRES){
      if(f.burnH > 0 && Math.hypot(v.x - f.x, v.y - f.y) < CS * 3){ fire = f; break; }
    }
  }
  if(!fire){
    const p = kit ? { x: (kit.wx + kit.tw/2)*CS, y: (kit.wy + kit.th)*CS + 20 } : placePos('firepit');
    if(p){ const r = planMoveToward(v, p.x, p.y, dtH); if(r !== true) return r === 'stuck'; }
    if(kit && Math.hypot(v.x - ((kit.wx + kit.tw/2)*CS), v.y - ((kit.wy + kit.th)*CS)) < CS * 3.5){
      fire = { x: v.x, y: v.y, burnH: 99, isKitchen: kit };
    } else {
      fire = FIRES.find(f => f.burnH > 0);
    }
    if(!fire){ v.thoughts = [{ text: 'The fire is out; cannot cook', val: -2 }]; return true; }
  }
  const protein = (v.inv.rawMeat || 0) > 0 ? 'rawMeat' : ((v.inv.fish || 0) > 0 ? 'fish' : null);
  if(!protein){ v.thoughts = [{ text: 'Nothing raw to cook a meal with', val: -1 }]; return true; }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog >= 0.7){
    step.prog = 0;
    const sides = [];
    for(const s of ['crop', 'berries', 'egg'])
      if((v.inv[s] || 0) > 0 && sides.length < 2) sides.push(s);
    v.inv[protein]--; stripItemProvenance(v, protein, 1);
    for(const s of sides){ v.inv[s]--; stripItemProvenance(v, s, 1); }
    let q = computeMealQuality(v, sides.length);
    if(fire.isKitchen){
      fire.isKitchen.cleanliness = Math.max(0, (fire.isKitchen.cleanliness || 1) - 0.04);
      if(fire.isKitchen.cleanliness > 0.5) q = Math.min(1.0, q + 0.1);
    }
    const tier = mealTier(q);
    addInv(v, tier, 1);
    const taintRisk = (fire.isKitchen && fire.isKitchen.cleanliness > 0.5) ? 0 : mealTaintChance(v);
    if(srand() < taintRisk){
      v.taintedMeals = v.taintedMeals || {};
      v.taintedMeals[tier] = (v.taintedMeals[tier] || 0) + 1;
    }
    gainXP(v, 'cooking', 4);
    witnessEvent(v, 'Cooked a ' + tier.replace('meal', '').toLowerCase() + ' meal' + (fire.isKitchen ? ' in the kitchen' : ''));
    logEvent('cook', v.name + ' cooked a ' + tier.replace('meal', '').toLowerCase() + ' meal');
  }
  if(((v.inv.fish || 0) <= 0 && (v.inv.rawMeat || 0) <= 0) || step.t > 4) return true;
  return false;
}
const __cook15 = doCookStep;
doCookStep = function(v, step, dtH){
  const hasProtein = (v.inv.fish || 0) > 0 || (v.inv.rawMeat || 0) > 0;
  const hasSide = (v.inv.crop || 0) > 0 || (v.inv.berries || 0) > 0 || (v.inv.egg || 0) > 0;
  if(step.meal || (hasProtein && hasSide)) return doMealStep(v, step, dtH);
  return __cook15(v, step, dtH);
};
/* eating: raw-meat gut-rot risk, tainted meals, physical satisfaction */
const __eat15 = doEatStep;
doEatStep = function(v, step, dtH){
  if(!step.ateHook){
    const f = firstFood(v);
    if(f){
      step.ateHook = true;
      const b = ensureBody(v);
      if(f === 'rawMeat'){
        if(srand() < 0.35){
          b.poison = clamp((b.poison || 0) + 0.5, 0, 1);
          witnessEvent(v, 'Ate raw meat — a risky gamble');
        }
      }
      if(f.indexOf('meal') === 0){
        if(v.taintedMeals && (v.taintedMeals[f] || 0) > 0){
          v.taintedMeals[f]--;
          if(srand() < 0.5){
            b.poison = clamp((b.poison || 0) + 0.4, 0, 1);
            witnessEvent(v, 'That meal tasted off...');
          }
        }
        const feel = f === 'mealLavish' ? ['Ate a lavish feast; deeply satisfied', 6]
          : f === 'mealFine' ? ['Ate a fine, hearty meal', 4]
          : ['Ate a poor, plain meal', 1];
        b.mealFeel = { text: feel[0], val: feel[1], t: 3 };
      }
    }
  }
  return __eat15(v, step, dtH);
};
/* preservation: smoking at the firepit, salting if salt is on hand */
function doPreserveStep(v, step, dtH){
  let fire = null;
  for(const f of FIRES){
    if(f.burnH > 0 && Math.hypot(v.x - f.x, v.y - f.y) < CS * 3){ fire = f; break; }
  }
  if(!fire){
    const p = placePos('firepit');
    if(p){ const r = planMoveToward(v, p.x, p.y, dtH); if(r !== true) return r === 'stuck'; }
    fire = FIRES.find(f => f.burnH > 0);
    if(!fire){ v.thoughts = [{ text: 'Need a fire to smoke meat', val: -2 }]; return true; }
  }
  const src = (v.inv.rawMeat || 0) > 0 ? 'rawMeat' : ((v.inv.fish || 0) > 0 ? 'fish' : null);
  if(!src){ v.thoughts = [{ text: 'Nothing to preserve', val: -1 }]; return true; }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog >= 1.0){
    step.prog = 0; v.inv[src]--; stripItemProvenance(v, src, 1);
    const useSalt = (v.inv.salt || 0) > 0;
    if(useSalt){ v.inv.salt--; stripItemProvenance(v, 'salt', 1); }
    const out = src === 'rawMeat' ? (useSalt ? 'saltedMeat' : 'smokedMeat') : 'smokedFish';
    addInv(v, out, 1);
    gainXP(v, 'cooking', 3);
    witnessEvent(v, 'Preserved ' + src + (useSalt ? ' with salt' : ' by smoking'));
  }
  if(((v.inv.rawMeat || 0) <= 0 && (v.inv.fish || 0) <= 0) || step.t > 4) return true;
  return false;
}
/* spoilage: freshness tracked per villager + per pile; heat accelerates */
const __addInv15 = addInv;
addInv = function(v, what, n){
  const r = __addInv15(v, what, n);
  if(FOOD_SPOIL[what]){ if(!v.invAge) v.invAge = {}; v.invAge[what] = 0; }
  return r;
};
function spoilTick(){
  const heat = W.temp > 25 ? 1.6 : 1;
  for(const v of VILLAGERS){
    if(v.dead) continue;
    if(!v.invAge) v.invAge = {};
    for(const k of Object.keys(v.inv || {})){
      if(!FOOD_SPOIL[k] || (v.inv[k] || 0) <= 0) continue;
      v.invAge[k] = (v.invAge[k] || 0) + heat;
      if(v.invAge[k] > FOOD_SPOIL[k]){
        const n = v.inv[k]; v.inv[k] = 0;
        v.inv.rot = (v.inv.rot || 0) + n; // inedible
        v.invAge[k] = 0;
        witnessEvent(v, 'Some ' + k + ' spoiled and had to be thrown out');
      }
    }
  }
  for(const p of PILES){
    if(!p.age) p.age = {};
    for(const k of Object.keys(p.items || {})){
      if(!FOOD_SPOIL[k] || (p.items[k] || 0) <= 0) continue;
      p.age[k] = (p.age[k] || 0) + heat;
      if(p.age[k] > FOOD_SPOIL[k] * 1.5){ p.items[k] = 0; p.age[k] = 0; }
    }
    cleanPile(p);
  }
}
/* poison metabolism + meal-feel decay, chained onto the body tick */
const __bt15 = bodyTick;
bodyTick = function(v, dtH){
  __bt15(v, dtH);
  if(v.dead) return;
  const b = v.body; if(!b) return;
  if((b.poison || 0) > 0.25){
    b.satiety = clamp(b.satiety - dtH * 0.35, 0, 1); // vomiting
    b.illness = clamp((b.illness || 0) + dtH * 0.03, 0, 1);
  }
  b.poison = Math.max(0, (b.poison || 0) - dtH * 0.05);
  if(b.mealFeel){ b.mealFeel.t -= dtH; if(b.mealFeel.t <= 0) b.mealFeel = null; }
};
const __bd15 = bodyDrives;
bodyDrives = function(v){
  const out = __bd15(v);
  const b = v.body || {};
  if((b.poison || 0) > 0.25) out.push({ text: 'Stomach churning with nausea; retching', val: -6 });
  else if((b.poison || 0) > 0.05) out.push({ text: 'Stomach uneasy after bad food', val: -2 });
  if(b.mealFeel) out.push({ text: b.mealFeel.text, val: b.mealFeel.val });
  return out;
};
