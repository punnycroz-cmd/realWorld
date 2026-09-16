/* =====================================================================
   PART 18: UTILITY AI — SCORING ENGINE & AUTONOMOUS ACTION SELECTION
   Willowbrook Natura — Phase 2C
   
   ARCHITECTURE & CONTRACT:
   Replaces the legacy hard-coded routines and daily schedules with a dynamic
   Utility AI system where each villager independently evaluates candidate
   actions (eat, drink, sleep, work, cook, craft, clean, socialize, flee...)
   and selects the highest-utility action each decision tick.

   CRITICAL INTERFACE CONTRACT:
   The window.__aiBridge interface stays 100% INTACT with all existing
   methods (listVillagers, getPerception, postAction, postIntent, assignWork,
   getWork, getDreams, getCapabilityGaps, getEvents, etc.) remaining
   unchanged. This Utility AI is the current-brain implementation behind it;
   the future AI brain will plug into the same bridge interface later without
   disrupting the simulation.
   
   THOUGHT/MOOD DIRECTIVE:
   Thought and mood engines are RESERVED for the future AI brain per project
   directive. The Utility AI implements mathematical scoring only, with honest
   observation thoughts recorded on action failure.

   NO SILENT FAILURES:
   When a chosen action fails (e.g. unreachable target, missing workstation,
   missing materials), the villager records an observation thought explaining
   why, records the target in their knowledge/memory (v.unreachable), and
   triggers immediate re-evaluation to select an alternative.
   ===================================================================== */

/* ---- Register generic 'work' verb in the action system ---- */
if(typeof VERBS !== 'undefined' && VERBS.indexOf('work') === -1){
  VERBS.push('work');
}

const __pfvUtility18 = planForVerb;
planForVerb = function(v, action){
  if(action && action.kind === 'work'){
    return { ok: true, steps: [{ verb: 'work', hours: action.hours || 2 }] };
  }
  return __pfvUtility18(v, action);
};

/* ---- Deterministic String/Seeded Hashing (NO Math.random) ---- */
function hashString18(str){
  let h = 0x811c9dc5;
  for(let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function deterministicTieBreak18(v, a, b){
  const hA = hashString18(`${SEED}:${v.name}:${a.id}`);
  const hB = hashString18(`${SEED}:${v.name}:${b.id}`);
  if(hA !== hB) return hB - hA;
  return a.id.localeCompare(b.id);
}

/* ---- Personality Initializer & Trait Sync ---- */
function ensurePersonality(v){
  if(!v.personality) v.personality = {};
  if(!v.traits) v.traits = [];

  // Trait to weight synchronization
  if(v.traits.includes('industrious') && v.personality.industrious == null) v.personality.industrious = 1.5;
  if(v.traits.includes('lazy') && v.personality.lazy == null) v.personality.lazy = 1.5;
  if(v.traits.includes('sociable') && v.personality.sociable == null) v.personality.sociable = 1.5;
  if(v.traits.includes('solitary') && v.personality.solitary == null) v.personality.solitary = 1.5;
  if(v.traits.includes('cautious') && v.personality.cautious == null) v.personality.cautious = 1.5;
  if(v.traits.includes('brave') && v.personality.brave == null) v.personality.brave = 1.5;
  if(v.traits.includes('gluttonous') && v.personality.gluttonous == null) v.personality.gluttonous = 1.5;

  // Weight to trait synchronization
  if(v.personality.industrious > 1.2 && !v.traits.includes('industrious')) v.traits.push('industrious');
  if(v.personality.lazy > 1.2 && !v.traits.includes('lazy')) v.traits.push('lazy');
  if(v.personality.sociable > 1.2 && !v.traits.includes('sociable')) v.traits.push('sociable');
  if(v.personality.solitary > 1.2 && !v.traits.includes('solitary')) v.traits.push('solitary');
  if(v.personality.cautious > 1.2 && !v.traits.includes('cautious')) v.traits.push('cautious');
  if(v.personality.brave > 1.2 && !v.traits.includes('brave')) v.traits.push('brave');
  if(v.personality.gluttonous > 1.2 && !v.traits.includes('gluttonous')) v.traits.push('gluttonous');

  // Fallback defaults by founding villager role
  if(!v.traits.length){
    const ROSTER_TRAITS = {
      Marta: ['industrious', 'sociable'],
      Bram: ['industrious', 'solitary'],
      Sella: ['industrious', 'sociable'],
      Tobin: ['sociable'],
      Wren: ['cautious', 'solitary'],
      Finn: ['solitary'],
      Alden: ['cautious'],
      Pip: ['lazy', 'sociable'],
      Rowan: ['sociable'],
      Clara: ['sociable', 'industrious'],
      Gareth: ['brave', 'industrious']
    };
    const def = ROSTER_TRAITS[v.name] || ['industrious'];
    for(const t of def){
      v.traits.push(t);
      v.personality[t] = 1.4;
    }
  }
  v.personality.traits = v.traits;
  return v.personality;
}

/* Hook initVillagers to initialize personalities */
const __baseInitVillagersUtility = initVillagers;
initVillagers = function(){
  __baseInitVillagersUtility();
  for(const v of VILLAGERS){
    ensurePersonality(v);
  }
};

/* ---- Candidate Action Enumeration ---- */
function enumerateCandidateActions(v){
  const candidates = [];
  const b = ensureBody(v);
  const now = W.day + W.tod / 24;

  const isTargetUnreachable = (key) => {
    if(!key || !v.unreachable) return false;
    const rec = v.unreachable[key];
    if(!rec) return false;
    if(rec.until > now) return true;
    delete v.unreachable[key];
    return false;
  };

  // 1. FLEE (Danger & safety override)
  let bestThreat = null, bestThreatDist = 1e9;
  if(typeof ANIMALS !== 'undefined' && Array.isArray(ANIMALS)){
    for(const a of ANIMALS){
      if(a.dead || (a.kind !== 'wolf' && a.kind !== 'bear')) continue;
      // Only hostile animals (stalking, attacking, hunting) trigger flee.
      // A bear that's eating or wandering is not an immediate threat; fleeing
      // from it permanently would starve the village.
      if(a.state !== 'stalk' && a.state !== 'attack' && a.state !== 'hunt' && a.state !== 'fight') continue;
      const d = Math.hypot(a.x - v.x, a.y - v.y) / CS;
      if(d < 16 && d < bestThreatDist){
        bestThreatDist = d;
        bestThreat = a;
      }
    }
  }
  let nearFire = null, nearFireDist = 1e9;
  if(typeof BURNING !== 'undefined' && Array.isArray(BURNING)){
    for(const f of BURNING){
      const d = Math.hypot((f.wx * CS + 16) - v.x, (f.wy * CS + 16) - v.y) / CS;
      if(d < 8 && d < nearFireDist){
        nearFireDist = d;
        nearFire = f;
      }
    }
  }
  if(bestThreat || nearFire){
    let safePos = null;
    if(typeof nearestBuildingPos === 'function'){
      safePos = nearestBuildingPos(v);
    }
    if(!safePos){
      const thX = bestThreat ? bestThreat.x : (nearFire.wx * CS + 16);
      const thY = bestThreat ? bestThreat.y : (nearFire.wy * CS + 16);
      const dx = v.x - thX, dy = v.y - thY;
      const len = Math.hypot(dx, dy) || 1;
      safePos = { x: v.x + (dx / len) * CS * 8, y: v.y + (dy / len) * CS * 8 };
    }
    candidates.push({
      id: 'flee',
      category: 'safety',
      name: 'Flee to shelter',
      targetKey: 'safe_shelter',
      tx: safePos.x, ty: safePos.y,
      threatDist: bestThreatDist < nearFireDist ? bestThreatDist : nearFireDist,
      isFire: !bestThreat,
      plan: [{ verb: 'go', tx: safePos.x, ty: safePos.y, flee: true }]
    });
  }

  // 2. DOUSE (Firefighting duty)
  if(typeof bestFireTarget === 'function'){
    const ft = bestFireTarget(v);
    if(ft){
      candidates.push({
        id: 'douse',
        category: 'safety',
        name: 'Fight threatening fire',
        targetKey: 'fire_' + ft.wx + '_' + ft.wy,
        tx: ft.wx * CS + 16, ty: ft.wy * CS + 16,
        plan: [{ verb: 'douse' }]
      });
    }
  }

  // 3. EAT (Hunger deficit)
  // Inventory food
  const fInv = typeof firstFood === 'function' ? firstFood(v) : null;
  if(fInv){
    candidates.push({
      id: 'eat_inv',
      category: 'survival',
      name: 'Eat ' + fInv,
      targetKey: 'inv_' + fInv,
      tx: v.x, ty: v.y,
      source: 'inv',
      plan: [{ verb: 'eat' }]
    });
  }
  // Ground piles with food
  if(typeof PILES !== 'undefined' && Array.isArray(PILES)){
    for(const p of PILES){
      if(!p.items) continue;
      for(const k of ['bread', 'cookedFish', 'meal', 'mealLavish', 'mealFine', 'mealPoor', 'crop', 'berries', 'egg', 'fish', 'meat']){
        if((p.items[k] || 0) > 0){
          const key = 'pile_' + p.wx + '_' + p.wy;
          if(!isTargetUnreachable(key)){
            let canPerceive = false;
            let beliefConf = 1.0;
            if(typeof distCells === 'function' && typeof sightRange === 'function'){
              if(distCells(v, p) <= sightRange()){
                canPerceive = true;
                if(typeof observe === 'function'){
                  // Dedupe: re-seeing the same pile within 6 sim-hours reinforces
                  // the belief without pushing a duplicate memory entry (2D fix).
                  observe(v, { foodKind: k, wx: p.wx, wy: p.wy }, { topic: key, source: 'direct', confidence: 0.95, dedupeWindowH: 6 });
                }
              }
            } else {
              canPerceive = true;
            }
            if(!canPerceive && typeof getBelief === 'function'){
              const bel = getBelief(v, key);
              if(bel && bel.confidence > 0.1){
                canPerceive = true;
                beliefConf = bel.confidence;
              }
            }
            if(canPerceive){
              candidates.push({
                id: 'eat_pile_' + p.wx + '_' + p.wy,
                category: 'survival',
                name: 'Eat ' + k + ' from pile',
                targetKey: key,
                tx: p.x, ty: p.y,
                foodKind: k,
                source: 'pile',
                pile: p,
                beliefConfidence: beliefConf,
                plan: [
                  { verb: 'go', tx: p.x, ty: p.y, targetKey: key },
                  { verb: 'take', what: k, pile: p },
                  { verb: 'eat' }
                ]
              });
            }
            break;
          }
        }
      }
    }
  }
  // Inn meals
  if(typeof FOOD_STOCK !== 'undefined' && (FOOD_STOCK.inn || 0) > 0){
    const innPos = placePos('inn');
    if(innPos && !isTargetUnreachable('inn')){
      const innBelief = typeof getBelief === 'function' ? getBelief(v, 'food_inn') : null;
      const knowsInn = (typeof getBelief !== 'function') || (innBelief && innBelief.confidence > 0.1);
      if(knowsInn){
        candidates.push({
          id: 'eat_inn',
          category: 'survival',
          name: 'Eat meal at inn',
          targetKey: 'inn',
          tx: innPos.x, ty: innPos.y,
          source: 'inn',
          opportunity: true,
          beliefConfidence: innBelief ? innBelief.confidence : 0.9,
          plan: [
            { verb: 'go', place: 'inn', targetKey: 'inn' },
            { verb: 'take', what: 'bread', from: 'inn' },
            { verb: 'eat' }
          ]
        });
      }
    }
  }
  // Kitchen fresh bread
  const kitchenBld = typeof VILLAGE_BUILDINGS !== 'undefined' ? VILLAGE_BUILDINGS.find(b => b.id === 'kitchen') : null;
  if(kitchenBld && !isTargetUnreachable('kitchen')){
    const kPos = placePos('kitchen');
    if(kPos){
      // NOTE: the 'take bread' step below draws from the inn's shared stock pool
      // (doTakeStep only supports 'inn'/'shop' pools), so availability must be
      // checked against FOOD_STOCK.inn — not a nonexistent FOOD_STOCK.kitchen.
      const hasBread = typeof FOOD_STOCK !== 'undefined' && (FOOD_STOCK.inn || 0) > 0;
      const kBelief = typeof getBelief === 'function' ? getBelief(v, 'food_kitchen') : null;
      const knowsKitchen = (typeof getBelief !== 'function') || (kBelief && kBelief.confidence > 0.1);
      // Only offer the kitchen when bread is actually available: a breadless
      // kitchen candidate would count as "known food" and block the forage
      // fallback while its take step can never succeed.
      if(knowsKitchen && hasBread){
        candidates.push({
          id: 'eat_kitchen',
          category: 'survival',
          name: 'Eat bread in kitchen',
          targetKey: 'kitchen',
          tx: kPos.x, ty: kPos.y,
          source: 'kitchen',
          hasBread: hasBread,
          beliefConfidence: kBelief ? kBelief.confidence : 0.85,
          plan: [
            { verb: 'go', place: 'kitchen', targetKey: 'kitchen' },
            // 'inn' here is the STOCK POOL, not the walk target (doTakeStep only
            // knows 'inn'/'shop' pools); the villager walks to the kitchen and
            // eats there. Do not change to from:'kitchen' — it would fall through
            // to the pile branch and fail.
            { verb: 'take', what: 'bread', from: 'inn' },
            { verb: 'eat' }
          ]
        });
      }
    }
  }

  // Epistemic explore fallback: if hungry but has no known/believed food targets
  const hasKnownEat = candidates.some(c => c.category === 'survival' && c.id.startsWith('eat'));
  if(!hasKnownEat && b.satiety < 0.65){
    candidates.push({
      id: 'explore_food',
      category: 'survival',
      name: 'Search for food',
      targetKey: 'explore_food',
      tx: v.x, ty: v.y,
      plan: [{ verb: 'forage' }]
    });
  }

  // 4. DRINK (Thirst deficit)
  const wellPos = placePos('well');
  if(wellPos && !isTargetUnreachable('well')){
    candidates.push({
      id: 'drink_well',
      category: 'survival',
      name: 'Drink fresh well water',
      targetKey: 'well',
      tx: wellPos.x, ty: wellPos.y,
      cleanBonus: 5,
      plan: [{ verb: 'go', place: 'well', targetKey: 'well' }, { verb: 'drink' }]
    });
  }
  const riverPos = placePos('river');
  if(riverPos && !isTargetUnreachable('river')){
    candidates.push({
      id: 'drink_river',
      category: 'survival',
      name: 'Drink from river',
      targetKey: 'river',
      tx: riverPos.x, ty: riverPos.y,
      plan: [{ verb: 'go', place: 'river', targetKey: 'river' }, { verb: 'drink' }]
    });
  }
  const lakePos = placePos('lake');
  if(lakePos && !isTargetUnreachable('lake')){
    candidates.push({
      id: 'drink_lake',
      category: 'survival',
      name: 'Drink from lake',
      targetKey: 'lake',
      tx: lakePos.x, ty: lakePos.y,
      plan: [{ verb: 'go', place: 'lake', targetKey: 'lake' }, { verb: 'drink' }]
    });
  }

  // 5. SLEEP (Energy deficit)
  const homeBld = v.homeId ? (typeof VILLAGE_BUILDINGS !== 'undefined' ? VILLAGE_BUILDINGS.find(b => b.id === v.homeId) : null) : null;
  const sleepPlace = homeBld ? homeBld.id : 'inn';
  const sleepPos = placePos(sleepPlace);
  candidates.push({
    id: 'sleep',
    category: 'survival',
    name: 'Sleep in bed',
    targetKey: sleepPlace,
    tx: sleepPos ? sleepPos.x : v.x, ty: sleepPos ? sleepPos.y : v.y,
    plan: sleepPos ? [{ verb: 'go', place: sleepPlace, targetKey: sleepPlace }, { verb: 'sleep', hours: 8 }] : [{ verb: 'sleep', hours: 8 }]
  });

  // 6. REST (Recovery / Fatigue)
  candidates.push({
    id: 'rest',
    category: 'leisure',
    name: 'Rest and recover',
    targetKey: 'rest_spot',
    tx: v.x, ty: v.y,
    plan: [{ verb: 'rest', hours: 1 }]
  });

  // 7. WARMTH (Cold temperature deficit)
  const fireWarm = typeof FIRES !== 'undefined' ? FIRES.find(f => f.burnH > 0) : null;
  if(fireWarm || (typeof VILLAGE_BUILDINGS !== 'undefined' && VILLAGE_BUILDINGS.find(b => b.id === 'inn'))){
    const warmPlace = fireWarm ? 'firepit' : 'inn';
    const warmPos = placePos(warmPlace);
    if(warmPos && !isTargetUnreachable(warmPlace)){
      candidates.push({
        id: 'warm',
        category: 'survival',
        name: 'Warm up by fire',
        targetKey: warmPlace,
        tx: warmPos.x, ty: warmPos.y,
        plan: [{ verb: 'go', place: warmPlace, targetKey: warmPlace }, { verb: 'rest', hours: 1 }]
      });
    }
  }

  // 8. WORK: FARMING
  const hasCrops = typeof CROPS !== 'undefined' && CROPS.length > 0;
  if(hasCrops){
    const ripeCrop = CROPS.find(c => c.stage >= 2);
    const targetCrop = ripeCrop || CROPS[0];
    candidates.push({
      id: 'work_farm',
      category: 'work',
      workType: 'farming',
      name: 'Tend crops in field',
      targetKey: 'crops',
      tx: targetCrop.wx * CS + 16, ty: targetCrop.wy * CS + 16,
      ripe: !!ripeCrop,
      plan: [{ verb: 'farm' }]
    });
  }

  // 9. WORK: FISHING
  const fishPos = placePos('lake');
  if(fishPos && !isTargetUnreachable('lake')){
    candidates.push({
      id: 'work_fish',
      category: 'work',
      workType: 'fishing',
      name: 'Fish by the water',
      targetKey: 'lake',
      tx: fishPos.x, ty: fishPos.y,
      plan: [{ verb: 'go', place: 'lake', targetKey: 'lake' }, { verb: 'fish', hours: 2 }]
    });
  }

  // 10. WORK: FORAGING
  if(typeof findForageSpot === 'function'){
    const fSpot = findForageSpot(v);
    if(fSpot && !isTargetUnreachable('forage_' + fSpot.wx + '_' + fSpot.wy)){
      candidates.push({
        id: 'work_forage',
        category: 'work',
        workType: 'foraging',
        name: 'Forage for wild food',
        targetKey: 'forage_' + fSpot.wx + '_' + fSpot.wy,
        tx: fSpot.x, ty: fSpot.y,
        plan: [{ verb: 'forage' }]
      });
    }
  }

  // 11. WORK: FELL TREES
  if(typeof nearestTree === 'function'){
    const tTree = nearestTree(v);
    if(tTree && !isTargetUnreachable('tree_' + tTree.wx + '_' + tTree.wy)){
      candidates.push({
        id: 'work_fell',
        category: 'work',
        workType: 'foraging',
        name: 'Fell timber tree',
        targetKey: 'tree_' + tTree.wx + '_' + tTree.wy,
        tx: tTree.wx * CS + 16, ty: tTree.wy * CS + 16,
        plan: [{ verb: 'fell' }]
      });
    }
  }

  // 12. WORK: RECIPE / CRAFTING
  if(typeof RECIPE_TABLE !== 'undefined' && Array.isArray(RECIPE_TABLE)){
    for(const r of RECIPE_TABLE){
      let hasInputs = true;
      for(const ik in (r.inputs || {})){
        const needed = r.inputs[ik];
        const haveInv = v.inv[ik] || 0;
        let havePiles = 0;
        if(typeof PILES !== 'undefined'){
          for(const p of PILES) havePiles += (p.items && p.items[ik]) || 0;
        }
        if(haveInv + havePiles < needed){ hasInputs = false; break; }
      }
      if(hasInputs){
        candidates.push({
          id: 'work_recipe_' + r.id,
          category: 'work',
          workType: r.skill || 'building',
          name: 'Craft ' + r.name,
          recipeId: r.id,
          targetKey: 'recipe_' + r.id,
          tx: v.x, ty: v.y,
          plan: [{ verb: 'recipe', recipe: r.id }]
        });
      }
    }
  }

  // 13. WORK: CLEANING
  if(typeof VILLAGE_BUILDINGS !== 'undefined' && Array.isArray(VILLAGE_BUILDINGS)){
    for(const bld of VILLAGE_BUILDINGS){
      if(bld.cleanliness != null && bld.cleanliness < 0.85){
        const bPos = placePos(bld.id);
        candidates.push({
          id: 'clean_' + bld.id,
          category: 'work',
          workType: 'building',
          name: 'Clean ' + bld.name,
          targetKey: 'bld_' + bld.id,
          building: bld,
          cleanliness: bld.cleanliness,
          tx: bPos ? bPos.x : v.x, ty: bPos ? bPos.y : v.y,
          plan: [{ verb: 'clean', target: bld.name }]
        });
      }
    }
  }

  // 14. COOKING
  const fCook = typeof FIRES !== 'undefined' ? FIRES.find(f => f.burnH > 0) : null;
  if(fCook || kitchenBld){
    const cookPlace = fCook ? 'firepit' : 'kitchen';
    const cookPos = placePos(cookPlace);
    if(cookPos && !isTargetUnreachable(cookPlace)){
      candidates.push({
        id: 'cook',
        category: 'work',
        workType: 'cooking',
        name: 'Cook wholesome food',
        targetKey: cookPlace,
        tx: cookPos.x, ty: cookPos.y,
        plan: [{ verb: 'cook' }]
      });
    }
  }

  // 15. SOCIALIZE
  if(typeof VILLAGERS !== 'undefined' && Array.isArray(VILLAGERS)){
    for(const other of VILLAGERS){
      if(other === v || other.dead || other.state === 'sleep' || other.state === 'drown_panic') continue;
      const d = Math.hypot(other.x - v.x, other.y - v.y) / CS;
      if(d <= 20){
        candidates.push({
          id: 'socialize_' + other.name,
          category: 'social',
          name: 'Chat with ' + other.name,
          targetKey: 'person_' + other.name,
          otherPerson: other,
          tx: other.x, ty: other.y,
          plan: [
            { verb: 'go', person: other.name, targetKey: 'person_' + other.name },
            { verb: 'speak', to: other.name, text: 'Good day, ' + other.name + '!' }
          ]
        });
      }
    }
  }

  // 16. TRADE (Caravan opportunity)
  if(typeof CARAVAN !== 'undefined' && CARAVAN && CARAVAN.inTown){
    candidates.push({
      id: 'trade_caravan',
      category: 'opportunity',
      name: 'Trade with merchant caravan',
      targetKey: 'caravan',
      tx: CARAVAN.x || 0, ty: CARAVAN.y || 0,
      plan: [{ verb: 'trade' }]
    });
  }

  // 17. LEISURE / IDLE
  candidates.push({
    id: 'leisure',
    category: 'leisure',
    name: 'Village leisure',
    targetKey: 'leisure_stroll',
    tx: v.x, ty: v.y,
    plan: [{ verb: 'wait', hours: 0.5 }]
  });

  // 18. GENERIC WORK
  candidates.push({
    id: 'work_generic',
    category: 'work',
    name: 'General labor',
    targetKey: 'work_anvil',
    tx: v.x, ty: v.y,
    plan: [{ verb: 'work', hours: 1 }]
  });

  return candidates;
}

/* ---- Scorer for Candidate Actions ---- */
function scoreCandidateAction(v, c){
  const b = ensureBody(v);
  const p = ensurePersonality(v);
  let score = 0;

  // Need deficits (0..1)
  const satietyDeficit = clamp(1.0 - b.satiety, 0, 1);
  const hydrationDeficit = clamp(1.0 - b.hydration, 0, 1);
  const fatigueDeficit = clamp(b.fatigue, 0, 1);
  const injuryDeficit = clamp(b.injury || 0, 0, 1);
  const coldDeficit = clamp((36.5 - b.coreTemp) / 3.0, 0, 1);
  const socialDeficit = clamp((v.chatT || 0) / 10.0, 0, 1);

  // Proximity cost
  const distCells = c.tx != null && c.ty != null ? Math.hypot(c.tx - v.x, c.ty - v.y) / CS : 0;
  const distCost = distCells * 0.8;

  // Check known unreachable target
  if(c.targetKey && v.unreachable && v.unreachable[c.targetKey]){
    const now = W.day + W.tod / 24;
    if(v.unreachable[c.targetKey].until > now){
      return -Infinity;
    }
  }

  // Environmental risks
  const hour = W.tod;
  const isNight = hour >= 21 || hour < 6;
  const isMidday = hour >= 10 && hour <= 16;

  switch(c.id){
    case 'flee': {
      if(c.threatDist != null && c.threatDist < 16){
        score = 120 + (16 - c.threatDist) * 5;
        if(p.traits.includes('cautious') || p.cautious > 1.2) score += 25;
        if(p.traits.includes('brave') || p.brave > 1.2) score -= 30;
      } else {
        score = -Infinity;
      }
      return score;
    }

    case 'douse': {
      score = 80 - distCost;
      if(p.traits.includes('brave') || p.brave > 1.2) score += 25;
      if(p.traits.includes('cautious') || p.cautious > 1.2) score -= 25;
      return score;
    }

    case 'sleep': {
      score = (fatigueDeficit ** 2) * 85 - distCost * 0.4;
      if(isNight) score += 35;
      else if(isMidday && fatigueDeficit < 0.7) score -= 40;
      return score;
    }

    case 'rest': {
      score = fatigueDeficit * 40 + injuryDeficit * 35;
      if(p.traits.includes('lazy') || p.lazy > 1.2) score += 25 * (p.lazy || 1.5);
      if(p.traits.includes('industrious') || p.industrious > 1.2) score -= 20 * (p.industrious || 1.5);
      return score;
    }

    case 'warm': {
      score = coldDeficit * 85 - distCost * 0.5;
      if(W.temp < 10) score += (10 - W.temp) * 3;
      return score;
    }

    case 'trade_caravan': {
      score = 55 - distCost * 0.5;
      return score;
    }

    case 'leisure': {
      score = 15;
      if(p.traits.includes('lazy') || p.lazy > 1.2) score += 20 * (p.lazy || 1.5);
      if(p.traits.includes('industrious') || p.industrious > 1.2) score -= 20 * (p.industrious || 1.5);
      if(W.temp > 23 && hour >= 12 && hour <= 15 && v.canSwim) score += 35;
      return score;
    }
  }

  // EAT actions
  if(c.category === 'survival' && c.id.startsWith('eat')){
    if(satietyDeficit < 0.15) return 0;
    const hungerScore = (satietyDeficit ** 2) * 95;
    score = hungerScore - distCost;
    if(c.source === 'inv') score += 10;
    if(c.opportunity || c.hasBread) score += 18;
    if(c.beliefConfidence != null) score += (c.beliefConfidence - 0.9) * 10;
    if(p.traits.includes('gluttonous') || p.gluttonous > 1.2) score += 15;
    return score;
  }

  // EXPLORE FOR FOOD (when character has no food beliefs)
  if(c.id === 'explore_food'){
    if(satietyDeficit < 0.15) return 0;
    score = (satietyDeficit ** 2) * 85;
    if(p.traits.includes('industrious') || p.industrious > 1.2) score += 10;
    return score;
  }

  // DRINK actions
  if(c.category === 'survival' && c.id.startsWith('drink')){
    if(hydrationDeficit < 0.15) return 0;
    const thirstScore = (hydrationDeficit ** 2) * 100;
    score = thirstScore - distCost + (c.cleanBonus || 0);
    return score;
  }

  // CLEAN actions
  if(c.id.startsWith('clean_')){
    const cleanDeficit = clamp(1.0 - (c.cleanliness || 0.5), 0, 1);
    score = cleanDeficit * 50 - distCost;
    if(p.traits.includes('industrious') || p.industrious > 1.2) score += 15;
    if(p.traits.includes('lazy') || p.lazy > 1.2) score -= 20;
    return score;
  }

  // SOCIALIZE actions
  if(c.id.startsWith('socialize_')){
    score = socialDeficit * 35 - distCost;
    if(p.traits.includes('sociable') || p.sociable > 1.2) score += 20 * (p.sociable || 1.5);
    if(p.traits.includes('solitary') || p.solitary > 1.2) score -= 20 * (p.solitary || 1.5);
    if(hour >= 17 && hour < 21) score += 15;
    return score;
  }

  // WORK actions
  if(c.category === 'work'){
    score = 25 - distCost * 0.5;

    // Personality weights
    if(p.traits.includes('industrious') || p.industrious > 1.2) score += 25 * (p.industrious || 1.5);
    if(p.traits.includes('lazy') || p.lazy > 1.2) score -= 25 * (p.lazy || 1.5);

    // Role / Work assignment bonus
    const workType = c.workType;
    if(workType && v.workPrio && v.workPrio[workType] != null){
      score += (v.workPrio[workType] - 5) * 5;
    } else if(workType){
      if(v.role === 'Village Farmer' && workType === 'farming') score += 25;
      else if(v.role === 'Pond Fisherman' && workType === 'fishing') score += 25;
      else if(v.role === 'Master Blacksmith' && (workType === 'building' || c.id === 'work_generic')) score += 25;
      else if(v.role === 'Herbalist & Apothecary' && workType === 'foraging') score += 25;
      else if(v.role === 'Baker & Shopkeeper' && (workType === 'cooking' || c.recipeId === 'bread' || c.recipeId === 'flour')) score += 25;
    }

    if(c.ripe) score += 20;
    if(isNight) score -= 35;

    // Threat risk near outdoor tasks
    let threatDistMin = 1e9;
    if(typeof ANIMALS !== 'undefined' && Array.isArray(ANIMALS)){
      for(const a of ANIMALS){
        if(a.dead || (a.kind !== 'wolf' && a.kind !== 'bear')) continue;
        const d = Math.hypot(a.x - v.x, a.y - v.y) / CS;
        if(d < threatDistMin) threatDistMin = d;
      }
    }
    if(threatDistMin < 14){
      score -= 90;
    }

    return score;
  }

  return score;
}

/* ---- Transparent Reason Derivation for Candidates ---- */
function getCandidateReason(v, c){
  if(c.reason) return c.reason;
  if(c.id === 'flee') return 'Threat nearby: flee to safe shelter';
  if(c.id === 'douse') return 'Wildfire threatens settlement structures or villagers';
  if(c.id === 'eat_inv') return 'Hunger deficit: eat food from inventory';
  if(c.id && c.id.startsWith('eat_pile')) return 'Belief: eat ' + (c.foodKind || 'food') + ' from ground pile';
  if(c.id === 'eat_inn') return 'Belief: meal available at village inn';
  if(c.id === 'eat_kitchen') return 'Belief: fresh bread available in kitchen';
  if(c.id === 'explore_food') return 'Hunger deficit: search for wild food';
  if(c.id === 'drink_well') return 'Thirst deficit: fresh water from village well';
  if(c.id === 'drink_river') return 'Thirst deficit: drink from river';
  if(c.id === 'drink_lake') return 'Thirst deficit: drink from lake';
  if(c.id === 'sleep') return 'Fatigue deficit: sleep in bed';
  if(c.id === 'rest') return 'Fatigue/injury: rest and recover';
  if(c.id === 'warm') return 'Cold deficit: warm up by fire';
  if(c.id === 'work_farm') return 'Farming: tend crops in field';
  if(c.id === 'work_fish') return 'Fishing: fish by the lake';
  if(c.id === 'work_forage') return 'Foraging: forage for wild food';
  if(c.id === 'work_fell') return 'Logging: fell timber tree';
  if(c.id && c.id.startsWith('work_recipe')) return 'Crafting: craft ' + (c.name || 'item');
  if(c.id && c.id.startsWith('clean_')) return 'Sanitation: clean building';
  if(c.id === 'cook') return 'Cooking: cook wholesome food';
  if(c.id && c.id.startsWith('socialize')) return 'Social need: converse with companion';
  if(c.id === 'trade_caravan') return 'Commerce: trade with merchant caravan';
  if(c.id === 'leisure') return 'Leisure: stroll around village';
  if(c.id === 'work_generic') return 'Labor: general village labor';
  return 'Utility action: ' + (c.name || c.id);
}

/* ---- Utility Evaluator & Decision Selector ---- */
function evaluateVillagerUtility(v){
  ensurePersonality(v);
  if(typeof ensureEpistemic === 'function') ensureEpistemic(v);
  const candidates = enumerateCandidateActions(v);
  for(const c of candidates){
    if(!c.reason) c.reason = getCandidateReason(v, c);
    c.score = scoreCandidateAction(v, c);
  }
  // Deterministic sorting: highest score wins, ties broken via seeded hash
  candidates.sort((a, b) => {
    if(Math.abs(a.score - b.score) > 1e-6){
      return b.score - a.score;
    }
    return deterministicTieBreak18(v, a, b);
  });
  const bestAction = candidates.length && candidates[0].score > -Infinity ? candidates[0] : null;
  return { bestAction, candidates };
}

function executeUtilityAction(v, action){
  if(!action) return false;
  v.currentAction = action;
  if(action.plan && action.plan.length){
    v.plan = action.plan.map(s => Object.assign({}, s));
  } else if(action.verb){
    const r = planForVerb(v, { kind: action.verb, ...(action.args || {}) });
    if(r.ok && r.steps){
      v.plan = r.steps;
    } else {
      handleActionFailure(v, action, r.reason || 'plan failed');
      return false;
    }
  }
  return true;
}

function evaluateAndApplyUtilityAction(v){
  if(v.dead || v.brainControlled) return null;
  const { bestAction } = evaluateVillagerUtility(v);
  if(bestAction){
    executeUtilityAction(v, bestAction);
  }
  return bestAction;
}

/* =====================================================================
   PHASE 6B: DYNAMIC CANDIDATE GENERATION (B1)
   When an action is blocked or fails, queries Epistemic Beliefs to generate
   AT MOST 3 candidates from goal templates + beliefs + habit.
   Replaces the static fallback ladder A -> B -> C.
   Deterministic tie-breaking ensures identical candidates for identical seeds.
   ===================================================================== */
function generateDynamicCandidates(v, blockedAction, context){
  if(!v) return [];
  ensurePersonality(v);
  if(typeof ensureEpistemic === 'function') ensureEpistemic(v);

  const blockedKey = blockedAction ? (blockedAction.targetKey || (blockedAction.args && blockedAction.args.targetKey) || blockedAction.place || blockedAction.id) : null;
  const blockedCat = blockedAction ? (blockedAction.category || blockedAction.kind || blockedAction.verb) : 'work';

  const candidates = [];
  const b = ensureBody(v);
  const p = ensurePersonality(v);
  const beliefs = (v.epistemic && v.epistemic.beliefs) || {};
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1;

  const isTargetUnreach = (key) => {
    if(!key || !v.unreachable) return false;
    const rec = v.unreachable[key];
    if(!rec) return false;
    if(rec.until > now) return true;
    delete v.unreachable[key];
    return false;
  };

  // 1. Epistemic Beliefs
  for(const k of Object.keys(beliefs)){
    const bel = beliefs[k];
    if(!bel || bel.superseded || (bel.confidence != null && bel.confidence < 0.15)) continue;
    if(blockedKey && (k === blockedKey || (bel.content && (bel.content.place === blockedKey || bel.content.targetKey === blockedKey)))) continue;
    if(isTargetUnreach(k)) continue;

    if(bel.topic && (bel.topic.startsWith('food_') || bel.topic.startsWith('stash_') || bel.topic.startsWith('pile_'))){
      const place = bel.content && bel.content.place;
      const fKind = (bel.content && (bel.content.foodKind || bel.content.what || bel.content.kind || bel.content.name)) || 'food';
      const pos = (place && typeof placePos === 'function' ? placePos(place) : null) ||
                  (bel.content && bel.content.wx != null ? { x: bel.content.wx * CS + 16, y: bel.content.wy * CS + 16 } : null) ||
                  (bel.where && bel.where.x != null ? { x: bel.where.x, y: bel.where.y } : null) ||
                  (v ? { x: v.x, y: v.y } : { x: 0, y: 0 });
      if(pos && (!blockedKey || place !== blockedKey)){
        const conf = bel.confidence != null ? bel.confidence : 0.9;
        candidates.push({
          id: 'belief_' + k,
          name: 'Seek ' + fKind + ' at ' + (place || 'stash'),
          category: 'survival',
          targetKey: k,
          source: 'belief',
          beliefConfidence: conf,
          reason: `Belief: ${fKind} at ${place || 'stash'} (confidence ${conf.toFixed(2)})`,
          tx: pos.x, ty: pos.y,
          plan: [{ verb: 'go', tx: pos.x, ty: pos.y, targetKey: k }, { verb: 'eat' }]
        });
      }
    } else if(bel.topic && (bel.topic.startsWith('bld_') || bel.topic.startsWith('workshop') || bel.topic.startsWith('smithy'))){
      const bldId = (bel.content && bel.content.bldId) || bel.topic.replace('bld_', '');
      const bPos = (typeof placePos === 'function') ? placePos(bldId) : null;
      if(bPos && bldId !== blockedKey && !isTargetUnreach(bldId)){
        const conf = bel.confidence != null ? bel.confidence : 0.85;
        candidates.push({
          id: 'belief_work_' + bldId,
          name: 'Work at ' + bldId,
          category: 'work',
          targetKey: bldId,
          source: 'belief',
          beliefConfidence: conf,
          reason: `Belief: accessible workshop at ${bldId} (confidence ${conf.toFixed(2)})`,
          tx: bPos.x, ty: bPos.y,
          plan: [{ verb: 'go', tx: bPos.x, ty: bPos.y, targetKey: bldId }, { verb: 'work', hours: 1 }]
        });
      }
    } else if(bel.topic === 'well' || bel.topic === 'water_well'){
      const wPos = (typeof placePos === 'function') ? placePos('well') : null;
      if(wPos && 'well' !== blockedKey && !isTargetUnreach('well')){
        const conf = bel.confidence != null ? bel.confidence : 0.95;
        candidates.push({
          id: 'belief_well',
          name: 'Drink from well',
          category: 'survival',
          targetKey: 'well',
          source: 'belief',
          beliefConfidence: conf,
          reason: `Belief: fresh water at well (confidence ${conf.toFixed(2)})`,
          tx: wPos.x, ty: wPos.y,
          plan: [{ verb: 'go', place: 'well', targetKey: 'well' }, { verb: 'drink' }]
        });
      }
    }
  }

  // 2. Habits
  const habits = (Array.isArray(v.habits) && v.habits.length) ? v.habits : (
    (v.role === 'Master Blacksmith') ? ['smithing', 'rest_smithy'] :
    (v.role === 'Village Farmer') ? ['farming', 'rest_home'] :
    (v.role === 'Herbalist & Apothecary') ? ['foraging', 'herbalism'] :
    (v.role === 'Innkeeper' || v.role === 'Baker & Shopkeeper') ? ['cooking', 'rest_inn'] :
    ['work_generic', 'rest']
  );

  for(const h of habits){
    if(h === 'smithing'){
      const sPos = (typeof placePos === 'function') ? placePos('smithy') : null;
      if(sPos && 'smithy' !== blockedKey && !isTargetUnreach('smithy')){
        candidates.push({
          id: 'habit_smithing',
          name: 'Forge iron at Bram\'s anvil',
          category: 'work',
          targetKey: 'smithy',
          source: 'habit',
          habitScore: 25,
          reason: 'Habit: skilled iron forging at smithy anvil',
          tx: sPos.x, ty: sPos.y,
          plan: [{ verb: 'go', place: 'smithy', targetKey: 'smithy' }, { verb: 'work', hours: 1 }]
        });
      }
    } else if(h === 'farming'){
      if('crops' !== blockedKey && !isTargetUnreach('crops') && typeof CROPS !== 'undefined' && CROPS.length > 0){
        const c = CROPS[0];
        candidates.push({
          id: 'habit_farming',
          name: 'Tend crops in field',
          category: 'work',
          targetKey: 'crops',
          source: 'habit',
          habitScore: 20,
          reason: 'Habit: routine crop maintenance in field',
          tx: c.wx * CS + 16, ty: c.wy * CS + 16,
          plan: [{ verb: 'farm' }]
        });
      }
    } else if(h === 'foraging'){
      if(typeof findForageSpot === 'function'){
        const fs = findForageSpot(v);
        if(fs && ('forage_' + fs.wx + '_' + fs.wy) !== blockedKey && !isTargetUnreach('forage_' + fs.wx + '_' + fs.wy)){
          candidates.push({
            id: 'habit_forage',
            name: 'Forage nearby vegetation',
            category: 'work',
            targetKey: 'forage_' + fs.wx + '_' + fs.wy,
            source: 'habit',
            habitScore: 20,
            reason: 'Habit: gather familiar local plants',
            tx: fs.x, ty: fs.y,
            plan: [{ verb: 'forage' }]
          });
        }
      }
    } else if(h === 'rest_smithy' || h === 'rest_home' || h === 'rest' || h === 'rest_inn'){
      const bldId = (h === 'rest_smithy') ? 'smithy' : (h === 'rest_inn' ? 'inn' : (v.homeId || 'inn'));
      const hPos = (typeof placePos === 'function') ? placePos(bldId) : null;
      candidates.push({
        id: 'habit_rest',
        name: 'Rest and recover',
        category: 'leisure',
        targetKey: bldId,
        source: 'habit',
        habitScore: 15,
        reason: 'Habit: rest and recover energy',
        tx: hPos ? hPos.x : v.x, ty: hPos ? hPos.y : v.y,
        plan: [{ verb: 'rest', hours: 0.5 }]
      });
    } else if(h === 'work_generic'){
      candidates.push({
        id: 'habit_labor',
        name: 'General settlement labor',
        category: 'work',
        targetKey: 'work_local',
        source: 'habit',
        habitScore: 10,
        reason: 'Habit: general manual labor around village',
        tx: v.x, ty: v.y,
        plan: [{ verb: 'work', hours: 1 }]
      });
    }
  }

  // 3. Goal templates
  if(typeof GOAL_TEMPLATES !== 'undefined' && Array.isArray(GOAL_TEMPLATES)){
    for(const gt of GOAL_TEMPLATES){
      const gen = gt.generate(v, blockedAction);
      if(gen && (!blockedKey || gen.targetKey !== blockedKey) && !isTargetUnreach(gen.targetKey)){
        candidates.push(gen);
      }
    }
  }

  // Deduplicate
  const unique = [];
  const seen = new Set();
  for(const c of candidates){
    const k = (c.id || '') + ':' + (c.targetKey || '');
    if(!seen.has(k)){
      seen.add(k);
      unique.push(c);
    }
  }

  // Score
  for(const c of unique){
    let sc = scoreCandidateAction(v, c);
    if(c.habitScore) sc += c.habitScore;
    if(c.beliefConfidence != null) sc += (c.beliefConfidence - 0.5) * 12;
    c.score = sc;
  }

  // Filter out unreachable
  const viable = unique.filter(c => c.score > -Infinity);

  // Partition candidates into beliefSourced (source==='belief') and others
  const beliefSourced = [];
  const others = [];
  for(const c of viable){
    if(c.source === 'belief') beliefSourced.push(c);
    else others.push(c);
  }

  // Sort each partition deterministically (keep existing tie-break)
  const sortPartition = (arr) => {
    arr.sort((a, b) => {
      if(Math.abs(a.score - b.score) > 1e-6) return b.score - a.score;
      return deterministicTieBreak18(v, a, b);
    });
  };

  sortPartition(beliefSourced);
  sortPartition(others);

  // Final list = beliefSourced first, then fill remaining slots (total <= 3) from others by score
  const finalCands = beliefSourced.slice(0, 3);
  if(finalCands.length < 3){
    finalCands.push(...others.slice(0, 3 - finalCands.length));
  }
  return finalCands;
}

function markTargetUnreachable(v, key, reason, hours){
  if(!v || !key) return;
  if(!v.unreachable) v.unreachable = {};
  const duration = (hours != null) ? hours : 0.1;
  const now = (typeof W !== 'undefined') ? (W.day + (W.tod || 0) / 24) : 0;
  v.unreachable[key] = { until: now + duration, reason: reason || 'unreachable' };
}

/* ---- Failure Handling: Observation -> Interpretation -> Knowledge -> Dynamic Re-evaluation ---- */
function handleActionFailure(v, action, reason, targetKey){
  if(!v) return;
  const reasonText = reason || 'action failed';
  const actName = action ? (action.name || action.kind || action.verb || 'action') : 'action';

  // 1. OBSERVATION: Thought recorded explaining WHY.
  v.thoughts = [{ text: `Can't reach ${actName}: ${reasonText}`, val: -2 }];

  // 2. INTERPRETATION & NEW KNOWLEDGE:
  if(targetKey){
    markTargetUnreachable(v, targetKey, reasonText, 0.1);
  }

  // 3. Clear failed plan
  v.plan = [];
  v.currentAction = null;

  // 4. DYNAMIC CANDIDATE GENERATION (B1: max 3 from goal templates + beliefs + habit)
  if(!v.brainControlled){
    const cands = generateDynamicCandidates(v, action, reasonText);
    v.__lastCandidates = cands;
    if(cands && cands.length && cands[0].score > -Infinity){
      executeUtilityAction(v, cands[0]);
    } else {
      evaluateAndApplyUtilityAction(v);
    }
  }
}

/* ---- Wrapped planTick: catch pathing stuck & step failure without silent discard ---- */
const __basePlanTick18 = planTick;
planTick = function(v, dtH){
  if(!v.plan || !v.plan.length) return;
  const step = v.plan[0];
  if(step.verb === 'work'){
    step.t = (step.t || 0) + dtH;
    v.state = 'work';
    v.moving = false;
    v.workProgress = (v.workProgress || 0) + dtH * 0.8;
    if(v.workProgress >= 1.0){
      v.workProgress = 0;
      v.triumphT = 1.0;
    }
    if(step.t >= (step.hours || 1)){
      v.plan.shift();
    }
    return;
  }
  const stepBefore = v.plan[0];
  // Identity snapshot BEFORE the base tick: genuine step-failure thoughts are posted
  // by REPLACING v.thoughts (never by push), so a change in array identity during
  // THIS tick reliably signals a NEW failure. Stale thoughts from earlier,
  // already-handled failures persist on the same array and must NOT re-trigger.
  const thoughtsBefore = v.thoughts;
  __basePlanTick18(v, dtH);
  // Detect step failure / obstruction — only when a NEW negative failure thought
  // was posted during this tick.
  if(v.thoughts !== thoughtsBefore && v.thoughts && v.thoughts.length && v.thoughts[0].val < 0){
    const txt = v.thoughts[0].text;
    if(txt.includes('Could not reach') || txt.includes("Can't reach") || txt.includes('No building to')){
      const targetKey = stepBefore ? (stepBefore.targetKey || stepBefore.place || (stepBefore.tx != null ? Math.round(stepBefore.tx/CS) + '_' + Math.round(stepBefore.ty/CS) : 'unknown')) : 'target';
      handleActionFailure(v, v.currentAction || stepBefore, 'unreachable', targetKey);
    }
  }
};

/* ---- Replace legacy routineNeeds with Utility AI ---- */
routineNeeds = function(v){
  if(v.dead || v.brainControlled || (v.plan && v.plan.length)) return;
  evaluateAndApplyUtilityAction(v);
};

/* ---- Autonomous Villager AI loop: Observe -> Think -> Learn (A3 Pattern) ---- */

function brainThink(v, dtH, perception){
  if(perception && (perception.interrupt || perception.replanNeeded)){
    v.replanNeeded = true;
    v.interrupted = true;
  }
  if(v.replanNeeded || v.interrupted){
    if(v.plan && v.plan.length && !v.plan[0].flee && !v.plan[0].guard && v.plan[0].verb !== 'douse' && !v.plan[0].douse){
      v.plan = [];
      v.currentAction = null;
    }
    v.replanNeeded = false;
    v.interrupted = false;
  }

  // Utility Action Selection: if no plan, score all candidates and pick best!
  if(!v.plan || !v.plan.length){
    evaluateAndApplyUtilityAction(v);
  }

  // Execute current plan step
  if(v.plan && v.plan.length){
    planTick(v, dtH);
  }

  return { plan: v.plan, currentAction: v.currentAction };
}

function brainLearn(v, dtH, outcome){
  // Triumph timer decay
  if(v.triumphT > 0){
    v.triumphT = Math.max(0, v.triumphT - dtH * 15);
  }
  return { learned: true };
}

function updateVillagerBrain(v, dtH){
  if(v.dead) return;
  if(v.downed) downedTick(v, dtH);
  if(v.downed && v.downed.kind !== 'leg') return;

  // 1. survivalGuard is hard safety override (prevents death spirals)
  survivalGuard(v);
  mortalityTick(v, dtH);
  illnessInjuryTick(v, dtH);
  if(v.dead || v.downed) return;

  // 2. Brain controlled (player or external bridge interface) -> run plan without utility overriding
  if(v.brainControlled){
    planTick(v, dtH);
    return;
  }

  // 3. Water struggle for non-swimmers
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  if(depth > 0.05 && !v.canSwim){
    v.state = 'drown_panic';
    v.moving = true;
    const esc = getShallowEscapeVector(v.x, v.y);
    const struggleSpd = 30 * (dtH * 60);
    v.x += esc.dx * struggleSpd;
    v.y += esc.dy * struggleSpd;
    return;
  }

  // 4. Rescue and herbalist duties
  if(typeof rescueInstinct === 'function') rescueInstinct(v, dtH);
  if(typeof herbalistDuty === 'function') herbalistDuty(v, dtH);
  if(v.dead || v.downed) return;

  // 5. Threat interrupt for autonomous plans: if beast nearby and currently not fleeing, interrupt
  if(v.plan && v.plan.length && !v.plan[0].guard){
    let beastNear = false;
    if(typeof ANIMALS !== 'undefined' && Array.isArray(ANIMALS)){
      for(const a of ANIMALS){
        if(a.dead || (a.kind !== 'wolf' && a.kind !== 'bear')) continue;
        // Only hostile beasts interrupt plans; a bear that's eating or
        // wandering is not an immediate threat. Interrupting for passive
        // animals traps villagers in a clear/decide loop where they never
        // complete survival actions (drink/eat) and die of needs.
        if(a.state !== 'stalk' && a.state !== 'attack' && a.state !== 'hunt' && a.state !== 'fight') continue;
        if(Math.hypot(a.x - v.x, a.y - v.y) / CS < 12){ beastNear = true; break; }
      }
    }
    if(beastNear && !v.plan[0].flee){
      v.plan = [];
      v.currentAction = null;
      v.interrupted = true;
      v.replanNeeded = true;
    }
  }

  // 6. OBSERVE (Attention filter A1) -> 7. THINK (Decision & execution) -> 8. LEARN (Memory consolidation)
  const perception = (typeof brainObserve === 'function') ? brainObserve(v, dtH) : null;
  const outcome = brainThink(v, dtH, perception);
  brainLearn(v, dtH, outcome);
}

const __uvUtilityBase = updateVillagerAI;
updateVillagerAI = updateVillagerBrain;

/* ---- Extend window.__aiBridge with utility inspection helpers ---- */
window.__aiBridge.evaluateUtility = function(name){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return null;
  return evaluateVillagerUtility(v);
};

window.__aiBridge.getUtilityScores = function(name){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return null;
  const { candidates } = evaluateVillagerUtility(v);
  return candidates.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    score: +c.score.toFixed(2),
    reason: c.reason || null
  }));
};

window.__aiBridge.generateDynamicCandidates = function(name, blockedAction){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return [];
  return generateDynamicCandidates(v, blockedAction);
};
