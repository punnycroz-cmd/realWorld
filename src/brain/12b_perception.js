/* =====================================================================
   PART 12B: HONEST PERCEPTION — replaces the leaky PART 10 getPerception.
   Natura directive: a villager knows only what its senses deliver.
   NEVER exact temperatures, coordinates, or another villager's stats.
   ===================================================================== */
function compassDir(dx, dy){
  const dirs = ['east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north', 'northeast'];
  return dirs[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
}
function distWords(cells){
  if(cells < 4) return 'a few meters away';
  if(cells < 10) return 'nearby';
  if(cells < 25) return 'some distance away';
  return 'far away';
}
function sightRange(){
  let r = 30;
  if(isNight()) r *= 0.45;
  if(W.rain > 0.3) r *= 0.7;
  if(W.storm > 0.4) r *= 0.55;
  return r;
}
function activityWords(v){
  if(v.dead) return 'lying still on the ground';
  switch(v.state){
    case 'sleep': return v.inBuilding ? 'sleeping indoors' : 'sleeping out in the open';
    case 'work': return 'working';
    case 'walk': case 'wade': return 'walking';
    case 'swim': return 'swimming';
    case 'drown_panic': return 'flailing in deep water, in trouble';
    case 'eat': return 'eating';
    case 'drink': return 'drinking';
    case 'chat': return 'chatting with someone';
    case 'rest': return 'resting';
    default: return 'standing around';
  }
}
function timeWords(){
  const h = W.tod;
  if(h < 5) return 'deep night';
  if(h < 6.5) return 'first light of dawn';
  if(h < 9) return 'morning light';
  if(h < 12) return 'late morning';
  if(h < 15) return 'midday sun';
  if(h < 17.5) return 'afternoon light';
  if(h < 19.5) return 'dusk';
  if(h < 21) return 'twilight';
  return 'night';
}
function weatherWords(){
  if(W.storm > 0.4) return 'a raging storm';
  if(W.rain > 0.5) return 'heavy rain';
  if(W.rain > 0.15) return 'light rain';
  if(W.temp > 30) return 'hot sun';
  if(W.temp < 5) return 'bitter cold';
  if(W.temp < 12) return 'chilly air';
  return 'mild and clear';
}
function pileWords(p){
  const parts = [];
  for(const k of Object.keys(p.items)){
    if(p.items[k] > 0) parts.push(p.items[k] + ' ' + k + (p.items[k] > 1 ? 's' : ''));
  }
  return parts.length ? parts.join(', ') : 'an empty pile';
}
function invWords(v){
  const out = [];
  for(const k of Object.keys(v.inv || {})){
    if(v.inv[k] > 0) out.push(v.inv[k] + ' ' + k + (v.inv[k] > 1 ? 's' : ''));
  }
  return out;
}
window.__aiBridge.getPerception = function(name){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return null;
  if(v.dead) return { name: v.name, dead: true, deathCause: v.deathCause };
  const range = sightRange();
  const see = [], hear = [], nearby = [];
  for(const o of VILLAGERS){
    if(o === v) continue;
    const dc = distCells(v, o);
    if(dc <= range){
      see.push({
        who: o.name + ', ' + o.role,
        doing: activityWords(o),
        where: compassDir(o.x - v.x, o.y - v.y),
        distance: distWords(dc)
      });
    } else if(dc <= 40 && (o.state === 'chat')){
      hear.push({ who: o.name, what: 'talking', where: compassDir(o.x - v.x, o.y - v.y) });
    }
  }
  const near2 = (x, y) => {
    const dc = Math.hypot((x - v.x) / CS, (y - v.y) / CS);
    return dc <= range ? { where: compassDir(x - v.x, y - v.y), distance: distWords(dc), _d: dc } : null;
  };
  const pushNear = (what, x, y) => {
    const n = near2(x, y);
    if(n) nearby.push({ what, where: n.where, distance: n.distance, _d: n._d });
  };
  for(const o of VILLAGE_OBJECTS){
    if(o.kind === 'well') pushNear('a stone well', o.x, o.y);
    else if(o.kind === 'firepit') pushNear('a campfire ring', o.x, o.y);
    else if(o.kind === 'anvil') pushNear('a blacksmith anvil', o.x, o.y);
    else if(o.kind === 'bench') pushNear('a wooden bench', o.x, o.y);
    else if(o.kind === 'lamp') pushNear('a street lamp', o.x, o.y);
  }
  for(const f of FIRES){
    if(f.burnH > 0) pushNear('a burning campfire', f.x, f.y);
  }
  for(const p of PILES) pushNear('a pile of ' + pileWords(p), p.x, p.y);
  for(const c of CROPS){
    if(c.stage >= 2) pushNear('crop rows, ready to harvest', c.wx * CS + 16, c.wy * CS + 16);
    else pushNear('young crop rows', c.wx * CS + 16, c.wy * CS + 16);
  }
  for(const c of CHICKENS) pushNear('a chicken', c.x, c.y);
  let trees = 0;
  for(const t of WILDTREES){
    if(trees >= 4) break;
    const n = near2(t.wx * CS + 16, t.wy * CS + 16);
    if(n){ nearby.push({ what: 'a tree', where: n.where, distance: n.distance, _d: n._d }); trees++; }
  }
  for(const b of BURNING) pushNear('wildfire flames', b.wx * CS + 16, b.wy * CS + 16);
  nearby.sort((a, b2) => a._d - b2._d);
  const nearOut = nearby.slice(0, 14).map(n => ({ what: n.what, where: n.where, distance: n.distance }));
  const bonds = [];
  for(const n of Object.keys(v.bonds || {})){
    const x = v.bonds[n];
    bonds.push({ name: n, closeness: x >= 0.75 ? 'close friend' : x >= 0.5 ? 'friend' : x >= 0.25 ? 'acquaintance' : 'stranger' });
  }
  return {
    name: v.name,
    role: v.role,
    time: timeWords(),
    season: W.season,
    weather: weatherWords(),
    body: bodyDrives(v).map(d => d.text),
    carrying: invWords(v),
    see, hear,
    nearby: nearOut,
    bonds,
    danger: (v.danger || []).slice(),
    events: (v.events || []).slice(-8)
  };
};
/* Quiet-mode event feed for brain memory consolidation. */
window.__aiBridge.getEvents = function(since){
  since = since || 0;
  return EVENTS.filter(e => e.seq > since);
};

/* =====================================================================
   PHASE 6A: SELECTIVE ATTENTION & PERCEPTION DTO (A1 & A3)
   3-Gate Attention Pipeline: sensation -> attention -> interpretation -> memory
   ===================================================================== */

class PerceptionDTO {
  constructor(data = {}) {
    this.timestamp = data.timestamp || (typeof W !== 'undefined' ? (W.day + (W.tod || 0)/24) : 0);
    this.villagerName = data.villagerName || '';
    this.threats = data.threats || [];
    this.urgentNeeds = data.urgentNeeds || [];
    this.attended = data.attended || [];
    this.ignored = data.ignored || [];
    this.interrupt = Boolean(data.interrupt);
    this.replanNeeded = Boolean(data.replanNeeded);
    this.see = data.see || [];
    this.hear = data.hear || [];
    this.nearby = data.nearby || [];
  }
}

function getUrgentNeeds(v){
  if(!v) return [];
  const b = typeof ensureBody === 'function' ? ensureBody(v) : (v.body || {});
  const urgent = [];
  const sat = b.satiety != null ? b.satiety : 1.0;
  const hyd = b.hydration != null ? b.hydration : 1.0;
  const fat = b.fatigue != null ? b.fatigue : 0.0;
  const temp = b.coreTemp != null ? b.coreTemp : 37.0;

  const satietyDeficit = clamp(1.0 - sat, 0, 1);
  const hydrationDeficit = clamp(1.0 - hyd, 0, 1);
  const fatigueDeficit = clamp(fat, 0, 1);
  const coldDeficit = temp < 35.0 ? 1.0 : clamp((36.5 - temp) / 3.0, 0, 1);

  if(satietyDeficit > 0.75) urgent.push('hunger');
  if(hydrationDeficit > 0.75) urgent.push('thirst');
  if(fatigueDeficit > 0.75) urgent.push('fatigue');
  if(coldDeficit > 0.75) urgent.push('cold');
  return urgent;
}

function isEdibleStimulus(stimulus){
  if(!stimulus) return false;
  if(typeof stimulus === 'string'){
    const s = stimulus.toLowerCase();
    const foodWords = ['bread', 'fish', 'egg', 'meal', 'cookedmeat', 'cookedfish', 'crop', 'berries', 'rawmeat', 'meat', 'food', 'cabbage', 'carrot', 'wheat'];
    return foodWords.some(w => s.includes(w));
  }
  if(typeof stimulus !== 'object') return false;
  if(stimulus.edible === true) return true;
  if(stimulus.foodKind) return true;
  if(stimulus.crop && stimulus.stage >= 2) return true;
  if(stimulus.kind === 'crop' && stimulus.stage >= 2) return true;
  const foodKinds = ['bread', 'fish', 'egg', 'meal', 'cookedFish', 'cookedMeat', 'crop', 'berries', 'rawMeat', 'meat', 'mealLavish', 'mealFine', 'mealPoor', 'cabbage', 'carrots', 'wheat'];
  if(stimulus.kind && foodKinds.map(f => f.toLowerCase()).includes(String(stimulus.kind).toLowerCase())) return true;
  if(stimulus.items && typeof stimulus.items === 'object'){
    return Object.keys(stimulus.items).some(k => (stimulus.items[k] || 0) > 0 && foodKinds.map(f => f.toLowerCase()).includes(k.toLowerCase()));
  }
  if(typeof FOOD_VAL !== 'undefined' && stimulus.kind && FOOD_VAL[stimulus.kind] > 0) return true;
  return false;
}

function isThirstStimulus(stimulus){
  if(!stimulus) return false;
  if(typeof stimulus === 'string'){
    const s = stimulus.toLowerCase();
    return s.includes('water') || s.includes('well') || s.includes('lake') || s.includes('drink') || s.includes('spring');
  }
  if(typeof stimulus !== 'object') return false;
  if(stimulus.water || stimulus.drink) return true;
  if(stimulus.kind === 'well' || stimulus.kind === 'lake' || stimulus.kind === 'spring') return true;
  if(stimulus.place === 'lake' || stimulus.place === 'well') return true;
  if(stimulus.what && /well|lake|water|drink|spring/i.test(stimulus.what)) return true;
  return false;
}

function isFatigueStimulus(stimulus){
  if(!stimulus) return false;
  if(typeof stimulus === 'string') return /bed|sleep|rest/i.test(stimulus);
  if(typeof stimulus !== 'object') return false;
  if(stimulus.sleep || stimulus.rest) return true;
  if(stimulus.kind === 'bed' || stimulus.kind === 'bench') return true;
  if(stimulus.place === 'inn' || stimulus.place === 'bed') return true;
  if(stimulus.what && /bed|bench|sleeping|rest/i.test(stimulus.what)) return true;
  return false;
}

function isColdStimulus(stimulus){
  if(!stimulus) return false;
  if(typeof stimulus === 'string') return /fire|campfire|warm|hearth/i.test(stimulus);
  if(typeof stimulus !== 'object') return false;
  if(stimulus.warm) return true;
  if(stimulus.kind === 'fire' || stimulus.kind === 'firepit' || stimulus.kind === 'campfire') return true;
  if(stimulus.place === 'inn' || stimulus.place === 'firepit') return true;
  if(stimulus.what && /fire|warmth|campfire/i.test(stimulus.what)) return true;
  return false;
}

function stimulusSolvesNeed(stimulus, need){
  if(need === 'hunger') return isEdibleStimulus(stimulus);
  if(need === 'thirst') return isThirstStimulus(stimulus);
  if(need === 'fatigue') return isFatigueStimulus(stimulus);
  if(need === 'cold') return isColdStimulus(stimulus);
  return false;
}

function isHostileBeastStimulus(stimulus){
  if(!stimulus || typeof stimulus !== 'object') return false;
  const isBeast = (stimulus.kind === 'wolf' || stimulus.kind === 'bear' || stimulus.threat === 'wolf' || stimulus.threat === 'bear');
  if(!isBeast) return false;
  if(stimulus.hostile === true) return true;
  const st = stimulus.state || (stimulus.ref && stimulus.ref.state);
  return (st === 'stalk' || st === 'attack' || st === 'hunt' || st === 'fight');
}

function isWildfireStimulus(stimulus){
  if(!stimulus) return false;
  if(typeof stimulus === 'string'){
    return /wildfire|raging fire|cháy/i.test(stimulus);
  }
  if(typeof stimulus !== 'object') return false;
  // Exclude normal controlled fires
  if(stimulus.campfire || stimulus.hearth || stimulus.kind === 'campfire' || stimulus.kind === 'firepit') return false;
  if(stimulus.kind === 'fire' && !stimulus.isWildfire && stimulus.threat !== 'wildfire') return false;

  if(stimulus.kind === 'wildfire' || stimulus.isWildfire === true || stimulus.threat === 'wildfire' || stimulus.danger === 'wildfire') return true;
  if(stimulus.isFire && stimulus.kind !== 'fire') return true;
  if(stimulus.what && /wildfire|raging fire|cháy/i.test(stimulus.what)) return true;
  return false;
}

function isScreamStimulus(stimulus){
  if(!stimulus) return false;
  if(typeof stimulus === 'string') return /scream|shriek|thét|hét/i.test(stimulus);
  if(typeof stimulus !== 'object') return false;
  if(stimulus.scream || stimulus.shout || stimulus.sound === 'scream' || stimulus.sound === 'shout' || stimulus.kind === 'scream') return true;
  if(stimulus.what && /scream|shriek|thét|hét/i.test(stimulus.what)) return true;
  return false;
}

function isGate1Threat(stimulus){
  if(!stimulus) return false;
  return isHostileBeastStimulus(stimulus) || isWildfireStimulus(stimulus) || isScreamStimulus(stimulus);
}

function isRelevantToCurrentGoal(v, stimulus, details = {}){
  if(!v || !v.plan || !v.plan.length){
    return true; // No active plan -> not blinded by task focus
  }
  const st = v.plan[0];
  if(!st) return true;

  // Highly salient observations (e.g. theft caught, major events)
  if(details && details.salience >= 0.8) return true;
  if(details && details.topic && (details.topic.startsWith('theft_') || details.topic.startsWith('event_') || details.topic.startsWith('ownership_'))) return true;

  // Stolen or targeted item match
  if(st.itemId && (stimulus.targetId === st.itemId || stimulus.itemId === st.itemId || stimulus.id === st.itemId || (details && details.topic && details.topic.includes(st.itemId)))) return true;
  if(stimulus.targetId || stimulus.action === 'steal' || stimulus.result === 'caught') return true;

  if(st.place && (stimulus.place === st.place || (stimulus.what && stimulus.what.includes(st.place)))) return true;
  if(st.person && (stimulus.who === st.person || stimulus.name === st.person || stimulus.target === st.person)) return true;
  if(st.target && (stimulus.target === st.target || stimulus.id === st.target || stimulus.topic === st.target || stimulus.what === st.target)) return true;
  if(st.what && (stimulus.what === st.what || stimulus.kind === st.what || stimulus.foodKind === st.what)) return true;
  if(st.targetKey && (stimulus.targetKey === st.targetKey || stimulus.topic === st.targetKey)) return true;

  if(st.verb === 'farm' && (stimulus.crop || stimulus.kind === 'crop' || (stimulus.what && stimulus.what.includes('crop')))) return true;
  if(st.verb === 'cook' && (stimulus.rawMeat || stimulus.fish || stimulus.kind === 'fire' || stimulus.place === 'firepit')) return true;
  if((st.verb === 'fell' || st.verb === 'chop') && (stimulus.kind === 'tree' || (stimulus.what && stimulus.what.includes('tree')))) return true;
  if(st.verb === 'eat' && isEdibleStimulus(stimulus)) return true;
  if(st.verb === 'drink' && isThirstStimulus(stimulus)) return true;
  if(st.verb === 'sleep' && isFatigueStimulus(stimulus)) return true;
  if(st.verb === 'douse' && (stimulus.kind === 'fire' || stimulus.kind === 'wildfire' || isThirstStimulus(stimulus))) return true;
  if((st.verb === 'buy' || st.verb === 'sell') && (stimulus.place === 'shop' || stimulus.place === 'inn' || stimulus.kind === 'shop')) return true;

  if(stimulus.event && (stimulus.who === v.name || stimulus.target === v.name || stimulus.participant === v.name || stimulus.child === v.name)) return true;

  return false;
}

function getIdentityAttentionMultiplier(v, stimulus, details = {}){
  if(!v || !v.identity || !v.identity.length) return 1.0;
  let mult = 1.0;
  for(const id of v.identity){
    if(id.tag === 'pips_mother'){
      const text = `${(stimulus && (stimulus.who || stimulus.person || stimulus.target || stimulus.name || stimulus.what || stimulus.kind || '')) || ''} ${(details && (details.who || details.topic || details.what || '')) || ''}`;
      const isPip = /pip/i.test(text);
      const isCry = /cry|khóc|weep|sob/i.test(text) || (stimulus && stimulus.kind === 'cry') || (details && details.kind === 'cry');
      if(isPip || isCry){
        mult = Math.max(mult, id.biasCoeff || 5.0);
      }
    } else if(id.tag === 'fire_savior'){
      if(isWildfireStimulus(stimulus) || isWildfireStimulus(details)){
        mult = Math.max(mult, id.biasCoeff || 2.5);
      }
    } else if(id.tag === 'near_drowning_survivor'){
      const text = `${(stimulus && stimulus.what) || ''} ${(details && details.topic) || ''}`;
      if(/water|lake|drown/i.test(text)){
        mult = Math.max(mult, id.biasCoeff || 2.0);
      }
    }
  }
  return mult;
}

function filterAttention(v, stimulus, details = {}){
  if(!v) return { attended: false, gate: 0, reason: 'no_villager' };

  if(details.bypassAttention === true) return { attended: true, gate: 0, reason: 'bypassed' };

  // Cổng 1 — Cảm giác đột biến: lửa mất kiểm soát (wildfire), tiếng thét, sói/gấu hostile
  // -> preemptive interrupt, cướp quyền chú ý ngay lập tức, đặt flag để utility re-plan.
  // Exception: Douse plans are not wiped by the fire being fought.
  if(isGate1Threat(stimulus) || isGate1Threat(details)){
    const isFire = isWildfireStimulus(stimulus) || isWildfireStimulus(details);
    const isDousing = v.plan && v.plan.length && (v.plan[0].verb === 'douse' || v.plan[0].douse);
    if(isFire && isDousing){
      // Villager is actively fighting fire; the fire does not wipe their douse plan
      return { attended: true, gate: 1, preemptive: false, reason: 'dousing_active' };
    }

    v.interrupted = true;
    v.replanNeeded = true;
    v.replanTriggered = true;
    if(v.plan && v.plan.length && !v.plan[0].flee && !v.plan[0].guard){
      v.plan = [];
      v.currentAction = null;
    }
    return { attended: true, gate: 1, preemptive: true, reason: 'sudden_threat' };
  }

  // Cổng 2 — Trạng thái khẩn cấp: need sinh học >75%
  // -> tunnel vision, lọc bỏ mọi vật thể không giải quyết cơn đói/khát/mệt/rét.
  const urgent = getUrgentNeeds(v);
  if(urgent.length > 0){
    const solves = urgent.some(need => stimulusSolvesNeed(stimulus, need));
    if(solves){
      return { attended: true, gate: 2, reason: 'solves_urgent_need', urgentNeeds: urgent };
    } else {
      // Irrelevant = background noise, KHÔNG ghi memory
      return { attended: false, gate: 2, reason: 'tunnel_vision_noise', urgentNeeds: urgent };
    }
  }

  // Phase 6C: Autobiographical identity bias on attention (C5)
  // E.g. 'Pip's mother' tag -> Pip's cry salience x5
  const idMult = getIdentityAttentionMultiplier(v, stimulus, details);
  const baseSal = details.salience != null ? details.salience : (stimulus && stimulus.salience != null ? stimulus.salience : 0.2);
  const effectiveSalience = baseSal * idMult;
  if(effectiveSalience >= 0.80){
    return { attended: true, gate: 3, reason: 'identity_high_salience', effectiveSalience, idMult };
  }

  // Cổng 3 — Mục tiêu hiện tại (top-down relevance):
  // Chỉ vật thể/sự kiện liên quan việc đang làm dở mới được vào interpretation + memory.
  if(!isRelevantToCurrentGoal(v, stimulus, details)){
    return { attended: false, gate: 3, reason: 'goal_irrelevant_noise', idMult };
  }

  return { attended: true, gate: 3, reason: 'relevant_or_general', idMult };
}

function perceiveSurroundings(v, seed = 0){
  if(!v || v.dead) return new PerceptionDTO({ villagerName: v ? v.name : '' });
  const range = sightRange();
  const attended = [];
  const ignored = [];
  const threats = [];
  const urgent = getUrgentNeeds(v);
  let interrupt = false;

  const rawStimuli = [];

  // 1. Animals
  if(typeof ANIMALS !== 'undefined' && Array.isArray(ANIMALS)){
    for(const a of ANIMALS){
      if(a.dead) continue;
      const d = Math.hypot(a.x - v.x, a.y - v.y) / CS;
      if(d <= range){
        // Only hostile beasts interrupt plans; a bear that's eating or
        // wandering is not an immediate threat. Interrupting for passive
        // animals traps villagers in a clear/decide loop where they never
        // complete survival actions (drink/eat) and die of needs.
        const isBeast = (a.kind === 'wolf' || a.kind === 'bear');
        const isHostile = isBeast && (a.state === 'stalk' || a.state === 'attack' || a.state === 'hunt' || a.state === 'fight');
        rawStimuli.push({
          kind: a.kind,
          state: a.state,
          threat: isHostile ? a.kind : null,
          hostile: isHostile,
          x: a.x, y: a.y, dist: d, ref: a,
          id: 'animal_' + a.kind + '_' + Math.round(a.x)
        });
      }
    }
  }

  // 2. Burning / Fires (uncontrolled wildfire in BURNING array)
  if(typeof BURNING !== 'undefined' && Array.isArray(BURNING)){
    for(const b of BURNING){
      const bx = b.wx * CS + 16, by = b.wy * CS + 16;
      const d = Math.hypot(bx - v.x, by - v.y) / CS;
      if(d <= range){
        rawStimuli.push({
          kind: 'wildfire', isWildfire: true, threat: 'wildfire',
          wx: b.wx, wy: b.wy, x: bx, y: by, dist: d, ref: b,
          id: 'wildfire_' + b.wx + '_' + b.wy
        });
      }
    }
  }
  // Controlled campfires / hearths (normal-use fires — NOT gate-1 threats)
  if(typeof FIRES !== 'undefined' && Array.isArray(FIRES)){
    for(const f of FIRES){
      if(f.burnH > 0){
        const d = Math.hypot(f.x - v.x, f.y - v.y) / CS;
        if(d <= range){
          rawStimuli.push({
            kind: 'fire', campfire: true,
            x: f.x, y: f.y, dist: d, ref: f,
            id: 'fire_' + Math.round(f.x) + '_' + Math.round(f.y)
          });
        }
      }
    }
  }

  // 3. Piles
  if(typeof PILES !== 'undefined' && Array.isArray(PILES)){
    for(const p of PILES){
      const d = Math.hypot(p.x - v.x, p.y - v.y) / CS;
      if(d <= range){
        rawStimuli.push({
          kind: 'pile', items: p.items,
          wx: p.wx, wy: p.wy, x: p.x, y: p.y, dist: d, ref: p,
          id: 'pile_' + p.wx + '_' + p.wy
        });
      }
    }
  }

  // 4. Crops
  if(typeof CROPS !== 'undefined' && Array.isArray(CROPS)){
    for(const c of CROPS){
      const cx = c.wx * CS + 16, cy = c.wy * CS + 16;
      const d = Math.hypot(cx - v.x, cy - v.y) / CS;
      if(d <= range){
        rawStimuli.push({
          kind: 'crop', stage: c.stage,
          wx: c.wx, wy: c.wy, x: cx, y: cy, dist: d, ref: c,
          id: 'crop_' + c.wx + '_' + c.wy
        });
      }
    }
  }

  // 5. Village objects
  if(typeof VILLAGE_OBJECTS !== 'undefined' && Array.isArray(VILLAGE_OBJECTS)){
    for(const o of VILLAGE_OBJECTS){
      const d = Math.hypot(o.x - v.x, o.y - v.y) / CS;
      if(d <= range){
        rawStimuli.push({
          kind: o.kind, x: o.x, y: o.y, dist: d, ref: o,
          id: 'obj_' + o.kind + '_' + Math.round(o.x)
        });
      }
    }
  }

  // Deterministic sorting with seeded tie breaking (strictly NO Math.random)
  const effSeed = (seed != null ? seed : (typeof SEED !== 'undefined' ? SEED : 1)) >>> 0;
  rawStimuli.sort((a, b) => {
    const thA = isGate1Threat(a) ? 1 : 0;
    const thB = isGate1Threat(b) ? 1 : 0;
    if(thA !== thB) return thB - thA;
    if(Math.abs(a.dist - b.dist) > 0.05) return a.dist - b.dist;
    const keyA = `${effSeed}:${v.name}:${a.id || a.kind}`;
    const keyB = `${effSeed}:${v.name}:${b.id || b.kind}`;
    const hA = hashString18(keyA);
    const hB = hashString18(keyB);
    if(hA !== hB) return hB - hA;
    return (a.id || '').localeCompare(b.id || '');
  });


  for(const stim of rawStimuli){
    const filter = filterAttention(v, stim);
    if(filter.attended){
      attended.push(stim);
      if(filter.preemptive){
        interrupt = true;
        threats.push(stim);
      }
    } else {
      ignored.push(stim);
    }
  }

  return new PerceptionDTO({
    timestamp: typeof W !== 'undefined' ? (W.day + (W.tod || 0)/24) : 0,
    villagerName: v.name,
    threats,
    urgentNeeds: urgent,
    attended,
    ignored,
    interrupt,
    replanNeeded: interrupt || Boolean(v.replanNeeded)
  });
}

function brainObserve(v, dtH){
  const seed = (typeof RNGS !== 'undefined' && RNGS.s != null) ? RNGS.s : (typeof SEED !== 'undefined' ? SEED : 0);
  return perceiveSurroundings(v, seed);
}

