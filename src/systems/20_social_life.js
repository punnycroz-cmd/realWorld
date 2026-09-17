/* =====================================================================
   PART 20 / 2E: SOCIAL LIFE — LIFE STAGES, MARRIAGE, HOUSEHOLDS,
   GENERATIONS, ORDINARY ACTIVITIES & DYNAMIC BUSINESSES
   Willowbrook Natura — Phase 2E

   SCOPE & DESIGN:
   1. Life Stages: child (0-12) -> youth (13-17) -> adult (18-59) -> elder (60+).
      Real effects: children cannot do heavy verbs (fell, construct, demolish),
      weaker carry capacity (6 max), learn faster from teaching (+15% bonus);
      elders move slower (0.75x speed), tire faster (1.35x fatigue), eat slightly
      less (0.85x calorie burn), cannot do heaviest work (fell, demolish, expand).
   2. Marriage: 2 adults, neither married, mutual bond >= 0.7, proximity <= 4 cells,
      both conscious. Records spouseId both ways, wedding memories in 2D knowledge
      system, witnesses record relationship beliefs. Death honestly clears spouseId.
   3. Households: married couple (+ children) sharing a home building. Children belong
      to parents' household. Members preferentially eat at home storage.
   4. Generations: married adults have children with sim-time pregnancy and cooldown;
      birth creates child with motherId/fatherId, household membership, parent/witness
      birth memories, initialized via the standard villager factory.
   5. Ordinary Activities: bathe (raises hygiene, cold/dirt risks), visit (builds bond),
      play (children: lowers stress, boosts mood, builds bond), childcare (adult feeds
      and hydrates children in need), clean (tidies living space).
   6. Relationships: bond decay without contact (~0.01/day after 3 days), insult verb.
   7. Dynamic Businesses: productive activity tracking (farming, crafting, cooking,
      fishing, trading); dominant activity produces occupation label with efficiency bonus;
      market stall entity for goods exchange.
   8. Utility AI Integration: life-stage and household-aware scoring.
   9. 2D Integration: wedding, birth, death, and occupation memories recorded.
   ===================================================================== */

/* ---- Register new verbs in VERBS ---- */
if(typeof VERBS !== 'undefined'){
  for(const vb of ['bathe', 'visit', 'play', 'childcare', 'marry', 'insult']){
    if(VERBS.indexOf(vb) === -1) VERBS.push(vb);
  }
}

/* ---- Life Stages & Sim-Time Aging ---- */
const STAGE_BOUNDARIES = {
  child: 12,
  youth: 17,
  adult: 59,
  elder: 60
};

const SIM_DAYS_PER_YEAR = 120; // 4 seasons * 30 days = 120 days per sim-year
const MARRIAGE_BOND_THRESHOLD = 0.7;
const HOUSEHOLDS = [];

function getLifeStage(v){
  if(!v) return 'adult';
  const age = v.ageY != null ? v.ageY : 25;
  if(age <= STAGE_BOUNDARIES.child) return 'child';
  if(age <= STAGE_BOUNDARIES.youth) return 'youth';
  if(age <= STAGE_BOUNDARIES.adult) return 'adult';
  return 'elder';
}

function updateLifeStage(v){
  if(!v) return null;
  const stage = getLifeStage(v);
  v.stage = stage;
  v.adult = (stage === 'adult' || stage === 'elder');
  if(stage === 'child'){
    v.childScale = clamp(0.55 + (v.ageY || 0) * 0.035, 0.55, 0.95);
  } else {
    v.childScale = 1.0;
  }
  return stage;
}

function ensureSocialFields(v){
  if(!v) return;
  if(typeof ensureReputationFields === 'function') ensureReputationFields(v);
  if(v.ageY == null){
    if(v.name === 'Pip') v.ageY = 9;
    else if(v.name === 'Alden') v.ageY = 68;
    else v.ageY = 28;
  }
  updateLifeStage(v);
  if(!v.bonds) v.bonds = {};
  if(!v.bondMile) v.bondMile = {};
  if(v.spouseId === undefined) v.spouseId = null;
  if(v.householdId === undefined) v.householdId = null;
  if(v.motherId === undefined) v.motherId = null;
  if(v.fatherId === undefined) v.fatherId = null;
  if(!v.lastContact) v.lastContact = {};
  if(!v.activityCounts) v.activityCounts = { farming: 0, crafting: 0, cooking: 0, fishing: 0, trading: 0 };
  if(v.occupation === undefined) v.occupation = null;
  if(typeof ensureBody === 'function'){
    const b = ensureBody(v);
    if(b && b.hygiene == null) b.hygiene = 1.0;
    v.hygiene = b ? b.hygiene : 1.0;
  }
}

function ageVillagers(dtD){
  for(const v of VILLAGERS){
    if(v.dead) continue;
    if(v.ageY == null) v.ageY = 25;
    v.ageY += dtD / SIM_DAYS_PER_YEAR;
    const oldStage = v.stage;
    updateLifeStage(v);
    if(oldStage && v.stage !== oldStage){
      logEvent('growth', v.name + ' entered life stage: ' + v.stage + ' (age ' + Math.floor(v.ageY) + ')');
      showToast('🌟 ' + v.name + ' is now a ' + v.stage + '!');
    }
  }
}

/* ---- Households ---- */
function createHousehold(a, b, homeId){
  const id = 'hh_' + a.name + '_' + b.name;
  let hh = HOUSEHOLDS.find(h => h.id === id);
  if(!hh){
    hh = {
      id: id,
      homeId: homeId,
      parents: [a.name, b.name],
      members: [a.name, b.name],
      createdAtDay: (typeof W !== 'undefined' && W.day != null) ? W.day : 1
    };
    HOUSEHOLDS.push(hh);
  }
  a.householdId = id;
  b.householdId = id;
  a.homeId = homeId;
  b.homeId = homeId;
  if(typeof VILLAGE_BUILDINGS !== 'undefined'){
    const bld = VILLAGE_BUILDINGS.find(x => x.id === homeId);
    if(bld){
      if(!bld.residents) bld.residents = [];
      if(!bld.residents.includes(a.name)) bld.residents.push(a.name);
      if(!bld.residents.includes(b.name)) bld.residents.push(b.name);
      if(!bld.owner) bld.owner = a.name;
    }
  }
  return hh;
}

function getHousehold(id){
  return HOUSEHOLDS.find(h => h.id === id) || null;
}

function getHouseholdForVillager(v){
  if(!v || !v.householdId) return null;
  return getHousehold(v.householdId);
}

/* ---- Marriage Mechanics ---- */
function marryVillagers(a, b){
  if(!a || !b || a === b || a.dead || b.dead){
    return { ok: false, reason: 'invalid participants' };
  }
  if(a.stage == null) updateLifeStage(a);
  if(b.stage == null) updateLifeStage(b);
  if(a.stage !== 'adult' && a.stage !== 'elder'){
    return { ok: false, reason: 'must be adults' };
  }
  if(b.stage !== 'adult' && b.stage !== 'elder'){
    return { ok: false, reason: 'must be adults' };
  }
  if(a.spouseId || b.spouseId){
    return { ok: false, reason: 'already married' };
  }
  const bondAB = (a.bonds && a.bonds[b.name]) || 0;
  const bondBA = (b.bonds && b.bonds[a.name]) || 0;
  if(bondAB < MARRIAGE_BOND_THRESHOLD || bondBA < MARRIAGE_BOND_THRESHOLD){
    return { ok: false, reason: 'insufficient bond' };
  }
  if(typeof isConscious === 'function' && (!isConscious(a) || !isConscious(b))){
    return { ok: false, reason: 'unconscious' };
  }
  if(typeof distCells === 'function' && a.x != null && b.x != null){
    if(distCells(a, b) > 4){
      return { ok: false, reason: 'too far' };
    }
  }

  // Record spouse links
  a.spouseId = b.name;
  b.spouseId = a.name;

  // Form or merge household
  let homeId = a.homeId || b.homeId || 'house1';
  if(a.homeId && typeof VILLAGE_BUILDINGS !== 'undefined'){
    const bldA = VILLAGE_BUILDINGS.find(x => x.id === a.homeId);
    if(bldA && bldA.owner === a.name) homeId = a.homeId;
    else if(b.homeId){
      const bldB = VILLAGE_BUILDINGS.find(x => x.id === b.homeId);
      if(bldB && bldB.owner === b.name) homeId = b.homeId;
    }
  }
  const hh = createHousehold(a, b, homeId);

  // Wedding memories in 2D knowledge system
  if(typeof observe === 'function'){
    observe(a, { event: 'wedding', spouse: b.name }, {
      topic: 'marriage_' + b.name,
      source: 'direct',
      confidence: 1.0,
      salience: 0.95,
      evidence: ['Married ' + b.name]
    });
    observe(b, { event: 'wedding', spouse: a.name }, {
      topic: 'marriage_' + a.name,
      source: 'direct',
      confidence: 1.0,
      salience: 0.95,
      evidence: ['Married ' + a.name]
    });

    // Witnesses form memories & relationship beliefs
    for(const w of VILLAGERS){
      if(w === a || w === b || w.dead) continue;
      if(typeof distCells === 'function' && distCells(w, a) < 12){
        if(typeof isConscious === 'function' && !isConscious(w)) continue;
        if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
          FeelingSubstrate.receiveSignal(w, FeelingSubstrate.normalizeEvent('marriage', null, { couple: [a.name, b.name], witness: true }));
        }
        observe(w, { spouseA: a.name, spouseB: b.name, status: 'married' }, {
          topic: 'rel_' + a.name + '_' + b.name,
          source: 'direct',
          confidence: 0.95,
          salience: 0.7,
          evidence: ['Witnessed wedding of ' + a.name + ' and ' + b.name]
        });
      }
    }
  }

  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
    FeelingSubstrate.receiveSignal(a, FeelingSubstrate.normalizeEvent('marriage', null, { spouse: b.name }));
    FeelingSubstrate.receiveSignal(b, FeelingSubstrate.normalizeEvent('marriage', null, { spouse: a.name }));
  }

  logEvent('marriage', a.name + ' and ' + b.name + ' are now married!');
  showToast('💍 ' + a.name + ' and ' + b.name + ' were married!');
  return { ok: true, spouseA: a.name, spouseB: b.name, householdId: hh.id };
}

/* ---- Ordinary Activities Executors ---- */
function nearestWaterPlace(v){
  const spots = ['well', 'river', 'lake'].map(p => ({ place: p, pos: placePos(p) })).filter(s => s.pos);
  let best = null, bd = 1e9;
  for(const s of spots){
    const d = Math.hypot(s.pos.x - v.x, s.pos.y - v.y);
    if(d < bd){ bd = d; best = s; }
  }
  return best;
}

function doBatheStep(v, step, dtH){
  step.t = (step.t || 0) + dtH;
  v.state = 'bathe';
  v.moving = false;
  const b = ensureBody(v);
  b.hygiene = 1.0;
  v.hygiene = 1.0;

  // Cold water risk
  if(typeof W !== 'undefined' && W.temp < 15 && step.place !== 'well'){
    b.coreTemp = Math.max(35.5, b.coreTemp - 0.2 * dtH);
    if(!v.thoughts) v.thoughts = [];
    v.thoughts = [{ text: 'Water is freezing cold while bathing!', val: -2 }];
  } else {
    v.thoughts = [{ text: 'Bathed in refreshing water; clean and refreshed', val: 4 }];
  }

  if(step.t >= (step.hours || 0.4)){
    v.state = 'idle';
    witnessEvent(v, 'Finished bathing');
    logEvent('bathe', v.name + ' took a bath');
    return true;
  }
  return false;
}

function doVisitStep(v, step, dtH){
  step.t = (step.t || 0) + dtH;
  const target = VILLAGERS.find(x => x.name === step.target && !x.dead);
  if(!target){
    v.state = 'idle';
    return true;
  }
  v.state = 'chat';
  v.moving = false;
  if(typeof addBond === 'function') addBond(v, target, 0.05 * (dtH / 0.5));
  v.lastContact = v.lastContact || {};
  target.lastContact = target.lastContact || {};
  const now = (typeof W !== 'undefined' && W.day != null) ? W.day : 1;
  v.lastContact[target.name] = now;
  target.lastContact[v.name] = now;

  if(step.t >= (step.hours || 0.5)){
    witnessEvent(v, 'Visited ' + target.name + ' at their home');
    witnessEvent(target, v.name + ' visited me');
    logEvent('visit', v.name + ' visited ' + target.name);
    v.state = 'idle';
    return true;
  }
  return false;
}

function doPlayStep(v, step, dtH){
  step.t = (step.t || 0) + dtH;
  v.state = 'play';
  v.moving = false;
  const b = ensureBody(v);
  b.stress = Math.max(0, b.stress - 0.25 * dtH);
  v.mood = Math.min(1.0, v.mood + 0.2 * dtH);

  // Playmates nearby
  for(const o of VILLAGERS){
    if(o === v || o.dead || o.stage !== 'child') continue;
    if(typeof distCells === 'function' && distCells(v, o) < 4){
      if(typeof addBond === 'function') addBond(v, o, 0.04 * dtH);
    }
  }

  if(step.t >= (step.hours || 0.5)){
    v.thoughts = [{ text: 'Had a wonderful time playing games!', val: 5 }];
    witnessEvent(v, 'Played happily');
    v.state = 'idle';
    return true;
  }
  return false;
}

// 2E fix: feed a child from pooled household food stock (caregiver + household
// members in the same building or nearby). Returns the satiety actually
// provided. Conservation: every unit of satiety comes from a real inventory
// item — nothing is created from nothing.
function feedChildFromHousehold(v, child, needSatiety){
  if(!(needSatiety > 0)) return 0;
  const donors = [v];
  const hh = (typeof getHouseholdForVillager === 'function') ? getHouseholdForVillager(v) : null;
  if(hh && Array.isArray(hh.members)){
    for(const nm of hh.members){
      if(!nm || nm === v.name) continue;
      const m = VILLAGERS.find(x => x.name === nm && !x.dead);
      if(m && (m.inBuilding === v.inBuilding ||
               (typeof distCells === 'function' && distCells(m, v) < 6))){
        donors.push(m);
      }
    }
  }
  let need = needSatiety;
  const order = ['bread', 'cookedFish', 'berries', 'crop', 'egg', 'fish'];
  for(const d of donors){
    if(need <= 0) break;
    d.inv = d.inv || {};
    for(const f of order){
      if(need <= 0) break;
      const val = (typeof FOOD_VAL !== 'undefined' && FOOD_VAL[f]) || 0;
      if(val <= 0) continue;
      while(need > 0 && (d.inv[f] || 0) > 0){
        d.inv[f]--;
        if(typeof stripItemProvenance === 'function') stripItemProvenance(d, f, 1);
        need -= val;
        if(d.inv[f] <= 0) delete d.inv[f];
      }
    }
  }
  return needSatiety - Math.max(0, need);
}

function doChildcareStep(v, step, dtH){
  step.t = (step.t || 0) + dtH;
  const child = VILLAGERS.find(x => x.name === step.child && !x.dead);
  if(!child){
    v.state = 'idle';
    return true;
  }
  v.state = 'work';
  v.moving = false;
  const cb = ensureBody(child);
  // 2E fix: food comes from real pooled household stock, never from nothing.
  const need = 0.45 * dtH;
  const fed = feedChildFromHousehold(v, child, need);
  cb.satiety = clamp(cb.satiety + fed, 0, 1);
  // Hydration only from a real water source (wells/rivers are not depleted by drinking).
  const well = (typeof VILLAGE_OBJECTS !== 'undefined') ? VILLAGE_OBJECTS.find(o => o.kind === 'well') : null;
  const nearWell = well && Math.hypot(v.x - well.x, v.y - well.y) < CS * 2.5;
  const nearWater = (typeof getWaterDepth === 'function' && getWaterDepth(Math.floor(v.x / CS), Math.floor(v.y / CS)) > 0) ||
                    (typeof nearWater3 === 'function' && nearWater3(v));
  if(nearWell || nearWater){
    cb.hydration = clamp(cb.hydration + 0.45 * dtH, 0, 1);
  }
  cb.stress = Math.max(0, cb.stress - 0.3 * dtH);
  child.hunger = cb.satiety;
  child.hydration = cb.hydration;

  if(typeof addBond === 'function') addBond(v, child, 0.05 * dtH);
  v.lastContact = v.lastContact || {};
  child.lastContact = child.lastContact || {};
  const now = (typeof W !== 'undefined' && W.day != null) ? W.day : 1;
  v.lastContact[child.name] = now;
  child.lastContact[v.name] = now;

  // 2E fix: honest failure — nothing to feed and the child is still hungry.
  if(fed <= 0 && cb.satiety < 0.5 && step.t >= 0.1){
    v.thoughts = [{ text: 'No food to feed young ' + child.name, val: -3 }];
    v.state = 'idle';
    logEvent('childcare', v.name + ' could not feed ' + child.name + ' (no food in household stores)');
    return true;
  }

  if(step.t >= (step.hours || 0.5)){
    v.thoughts = [{ text: 'Looked after young ' + child.name, val: 4 }];
    witnessEvent(v, 'Tended and cared for ' + child.name);
    witnessEvent(child, v.name + ' took gentle care of me');
    logEvent('childcare', v.name + ' cared for ' + child.name);
    v.state = 'idle';
    return true;
  }
  return false;
}

function doInsultStep(v, step, dtH){
  const target = VILLAGERS.find(x => x.name === step.target && !x.dead);
  if(target && typeof doInsult === 'function'){
    doInsult(v, target);
  }
  v.state = 'idle';
  return true;
}

/* ---- Relationships & Bond Decay ---- */
function decayBonds(dtD){
  const now = (typeof W !== 'undefined' && W.day != null) ? W.day : 1;
  for(const v of VILLAGERS){
    if(v.dead || !v.bonds) continue;
    v.lastContact = v.lastContact || {};
    for(const otherName of Object.keys(v.bonds)){
      const last = v.lastContact[otherName];
      if(last == null){
        v.lastContact[otherName] = now;
        continue;
      }
      const daysApart = now - last;
      if(daysApart > 3 && v.bonds[otherName] > 0){
        v.bonds[otherName] = Math.max(0, +(v.bonds[otherName] - 0.01 * dtD).toFixed(4));
      }
    }
  }
}

/* ---- Dynamic Businesses & Market Stall ---- */
function recordProductiveActivity(v, actType, count){
  if(!v) return;
  v.activityCounts = v.activityCounts || { farming: 0, crafting: 0, cooking: 0, fishing: 0, trading: 0 };
  v.activityCounts[actType] = (v.activityCounts[actType] || 0) + (count || 1);
  checkOccupationEmergence(v);
}

function checkOccupationEmergence(v){
  if(!v || (v.stage !== 'adult' && v.stage !== 'elder')) return null;
  const acts = v.activityCounts || {};
  let total = 0, bestAct = null, bestCount = 0;
  for(const k of ['farming', 'crafting', 'cooking', 'fishing', 'trading']){
    const c = acts[k] || 0;
    total += c;
    if(c > bestCount){ bestCount = c; bestAct = k; }
  }
  // Dominant: total >= 15 and bestCount >= 50% of total
  if(total >= 15 && bestCount >= total * 0.5){
    const OCC_MAP = {
      farming: 'farmer',
      crafting: 'carpenter',
      cooking: 'cook',
      fishing: 'fisher',
      trading: 'trader'
    };
    const occLabel = OCC_MAP[bestAct];
    if(occLabel && (!v.occupation || v.occupation.type !== occLabel)){
      const now = (typeof W !== 'undefined' && W.day != null) ? W.day : 1;
      v.occupation = {
        type: occLabel,
        activity: bestAct,
        startedDay: now
      };
      logEvent('occupation', v.name + ' has become a village ' + occLabel + '!');
      showToast('🛠️ ' + v.name + ' is now recognized as a ' + occLabel + '!');
      if(typeof observe === 'function'){
        observe(v, { event: 'occupation', occupation: occLabel }, {
          topic: 'occupation_' + v.name,
          source: 'direct',
          confidence: 1.0,
          salience: 0.85,
          evidence: ['Became a recognized village ' + occLabel]
        });
      }
      return v.occupation;
    }
  }
  return v.occupation || null;
}

function getOccupationBonus(v, actType){
  if(v && v.occupation && (v.occupation.activity === actType || v.occupation.type === actType)){
    return 1.25;
  }
  return 1.0;
}

function ensureMarketStall(){
  if(typeof VILLAGE_OBJECTS === 'undefined') return null;
  let stall = VILLAGE_OBJECTS.find(b => b.kind === 'market_stall' || b.id === 'market_stall');
  if(!stall){
    stall = {
      id: 'market_stall',
      kind: 'market_stall',
      name: 'Village Market Stall',
      wx: 1, wy: -3,
      x: 1 * CS + 16, y: -3 * CS + 16,
      owner: null,
      stock: { crop: 8, bread: 4, fish: 4, plank: 4 },
      prices: { crop: 2, bread: 3, fish: 4, plank: 5 }
    };
    VILLAGE_OBJECTS.push(stall);
  }
  return stall;
}

function stockMarketStall(v, what, count){
  const stall = ensureMarketStall();
  if(!stall) return false;
  const n = Math.min((v.inv && v.inv[what]) || 0, count || 1);
  if(n <= 0) return false;
  v.inv[what] -= n;
  stall.stock[what] = (stall.stock[what] || 0) + n;
  stall.owner = v.name;
  return true;
}

/* ---- Location Resolution Hook ---- */
const __placePosSocial20 = placePos;
placePos = function(place){
  if(place === 'stall' || place === 'market_stall'){
    const s = ensureMarketStall();
    return s ? { x: s.x, y: s.y } : null;
  }
  return __placePosSocial20(place);
};

/* ---- Plan Compiler Wrapper (Action Validation & Heavy Labor Gating) ---- */
const __pfvSocial20 = planForVerb;
planForVerb = function(v, action){
  const A = action || {};
  if(v){
    updateLifeStage(v);
    // Children cannot do heavy labor
    if(v.stage === 'child'){
      if(A.kind === 'fell' || A.kind === 'build' || A.kind === 'demolish' || A.kind === 'expand'){
        return { ok: false, reason: 'children cannot do heavy labor' };
      }
    }
    // Elders cannot do heaviest work
    if(v.stage === 'elder'){
      if(A.kind === 'fell' || A.kind === 'demolish' || A.kind === 'expand'){
        return { ok: false, reason: 'elders cannot do heavy labor' };
      }
    }
  }

  // Handle new 2E verbs
  if(A.kind === 'bathe'){
    const spot = nearestWaterPlace(v);
    if(!spot) return { ok: false, reason: 'no water nearby to bathe' };
    return {
      ok: true,
      steps: [
        { verb: 'go', place: spot.place, tx: spot.pos.x, ty: spot.pos.y },
        { verb: 'bathe', place: spot.place, hours: A.hours || 0.4 }
      ]
    };
  }

  if(A.kind === 'visit'){
    const t = VILLAGERS.find(o => o.name === A.target && !o.dead);
    if(!t) return { ok: false, reason: 'no such person to visit' };
    let tx = t.x, ty = t.y;
    if(t.homeId && typeof VILLAGE_BUILDINGS !== 'undefined'){
      const hb = VILLAGE_BUILDINGS.find(b => b.id === t.homeId);
      if(hb){
        tx = (hb.wx + Math.floor(hb.tw / 2)) * CS + 16;
        ty = (hb.wy + hb.th) * CS + 16;
      }
    }
    return {
      ok: true,
      steps: [
        { verb: 'go', person: t.name, tx: tx, ty: ty },
        { verb: 'visit', target: t.name, hours: A.hours || 0.5 }
      ]
    };
  }

  if(A.kind === 'play'){
    return {
      ok: true,
      steps: [
        { verb: 'play', hours: A.hours || 0.5 }
      ]
    };
  }

  if(A.kind === 'childcare'){
    const c = VILLAGERS.find(o => o.name === A.child && !o.dead);
    if(!c) return { ok: false, reason: 'no child to care for' };
    return {
      ok: true,
      steps: [
        { verb: 'go', person: c.name, tx: c.x, ty: c.y },
        { verb: 'childcare', child: c.name, hours: A.hours || 0.5 }
      ]
    };
  }

  if(A.kind === 'marry'){
    const t = VILLAGERS.find(o => o.name === A.target && !o.dead);
    if(!t) return { ok: false, reason: 'no such person to marry' };
    return {
      ok: true,
      steps: [
        { verb: 'go', person: t.name, tx: t.x, ty: t.y },
        { verb: 'marry', target: t.name }
      ]
    };
  }

  if(A.kind === 'insult'){
    const t = VILLAGERS.find(o => o.name === A.target && !o.dead);
    if(!t) return { ok: false, reason: 'no such person to insult' };
    return {
      ok: true,
      steps: [
        { verb: 'go', person: t.name, tx: t.x, ty: t.y },
        { verb: 'insult', target: t.name }
      ]
    };
  }

  return __pfvSocial20(v, action);
};

/* ---- Plan Executor Wrapper ---- */
const __ptSocial20 = planTick;
planTick = function(v, dtH){
  if(!v.plan || !v.plan.length) return;
  const step = v.plan[0];

  switch(step.verb){
    case 'bathe': {
      const done = doBatheStep(v, step, dtH);
      if(done) v.plan.shift();
      return;
    }
    case 'visit': {
      const done = doVisitStep(v, step, dtH);
      if(done) v.plan.shift();
      return;
    }
    case 'play': {
      const done = doPlayStep(v, step, dtH);
      if(done) v.plan.shift();
      return;
    }
    case 'childcare': {
      const done = doChildcareStep(v, step, dtH);
      if(done) v.plan.shift();
      return;
    }
    case 'marry': {
      const target = VILLAGERS.find(x => x.name === step.target && !x.dead);
      // 2E fix: a failed marriage plan must leave a trace, never vanish silently.
      let res = { ok: false, reason: 'no such person to marry' };
      if(target) res = marryVillagers(v, target);
      if(!res.ok){
        v.thoughts = [{ text: 'Could not marry ' + (step.target || 'them') + ': ' + res.reason, val: -3 }];
        if(typeof observe === 'function'){
          observe(v, { event: 'marriage_failed', target: step.target, reason: res.reason }, {
            topic: 'marriage_' + (step.target || 'unknown'),
            source: 'direct', confidence: 0.9, salience: 0.5,
            evidence: ['Marriage attempt failed: ' + res.reason]
          });
        }
      }
      v.plan.shift();
      return;
    }
    case 'insult': {
      doInsultStep(v, step, dtH);
      v.plan.shift();
      return;
    }
  }

  // Base planTick execution
  __ptSocial20(v, dtH);

  // Track productive activities on step progress
  if(v.state === 'work'){
    if(step.verb === 'farm') recordProductiveActivity(v, 'farming', dtH);
    else if(step.verb === 'cook') recordProductiveActivity(v, 'cooking', dtH);
    else if(step.verb === 'fish') recordProductiveActivity(v, 'fishing', dtH);
    else if(step.verb === 'recipe') recordProductiveActivity(v, 'crafting', dtH);
  }
};

/* ---- Economy Stall Purchase Hook ---- */
const __doBuyStepSocial20 = doBuyStep;
doBuyStep = function(v, step, dtH){
  if(step.from === 'stall' || step.place === 'stall' || step.place === 'market_stall'){
    const stall = ensureMarketStall();
    if(!stall){
      v.thoughts = [{ text: 'No market stall in the village', val: -2 }];
      return true;
    }
    const sx = stall.x, sy = stall.y;
    if(Math.hypot(v.x - sx, v.y - sy) > CS * 2.5){
      const r = planMoveToward(v, sx, sy, dtH);
      return r === 'stuck' ? true : false;
    }
    if(typeof isOstracized === 'function' && isOstracized(v.name)){
      v.thoughts = [{ text: 'The merchant refused to trade with an outcast', val: -3 }];
      return true;
    }
    const what = step.what || Object.keys(stall.stock || {})[0] || 'crop';
    const basePrice = (stall.prices && stall.prices[what]) || 2;
    // 2E: traders haggle better — the +25% occupation efficiency expressed as a price cut.
    const price = Math.max(1, Math.round(basePrice / getOccupationBonus(v, 'trading')));
    if((stall.stock[what] || 0) <= 0){
      v.thoughts = [{ text: 'The stall is out of ' + what, val: -2 }];
      return true;
    }
    if((v.gold || 0) < price){
      v.thoughts = [{ text: 'Not enough gold for ' + what, val: -2 }];
      return true;
    }
    v.gold -= price;
    if(stall.owner){
      const o = VILLAGERS.find(x => x.name === stall.owner);
      if(o) o.gold = (o.gold || 0) + price;
    }
    stall.stock[what]--;
    addInv(v, what, 1);
    v.state = 'idle';
    witnessEvent(v, 'Bought ' + what + ' at the market stall for ' + price + ' gold');
    logEvent('trade', v.name + ' bought ' + what + ' at market stall (' + price + 'g)');
    recordProductiveActivity(v, 'trading', 1);
    return true;
  }
  return __doBuyStepSocial20(v, step, dtH);
};

/* ---- Mortality Hook (Spouse Cleanup on Death) ---- */
const __killVillagerSocial20 = killVillager;
killVillager = function(v, cause){
  if(v && !v.dead && v.spouseId){
    const sp = VILLAGERS.find(x => x.name === v.spouseId);
    if(sp && sp.spouseId === v.name){
      sp.spouseId = null;
      sp.widowed = true;
      if(typeof observe === 'function'){
        observe(sp, { event: 'death', deceased: v.name, spouse: true }, {
          topic: 'death_' + v.name,
          source: 'direct',
          confidence: 1.0,
          salience: 0.95,
          evidence: ['My spouse ' + v.name + ' passed away (' + cause + ')']
        });
      }
    }
    v.spouseId = null;
  }
  if(v && v.householdId){
    const hh = getHousehold(v.householdId);
    if(hh){
      const mi = hh.members.indexOf(v.name);
      if(mi >= 0) hh.members.splice(mi, 1);
    }
  }
  __killVillagerSocial20(v, cause);
};

/* ---- Social Tick Hook (Bond Decay) ---- */
const __socialTick20 = socialTick;
socialTick = function(h){
  __socialTick20(h);
  decayBonds(h / 24);
};

/* ---- Init Hook ---- */
const __initVillagersSocial20 = initVillagers;
initVillagers = function(){
  __initVillagersSocial20();
  for(const v of VILLAGERS){
    ensureSocialFields(v);
  }
  ensureMarketStall();
};

/* ---- Utility AI Integration ---- */
const __enumerateCandidates20 = enumerateCandidateActions;
enumerateCandidateActions = function(v){
  const candidates = __enumerateCandidates20(v);
  ensureSocialFields(v);
  const b = ensureBody(v);

  // 1. Bathe candidate
  if(b.hygiene < 0.85){
    const spot = nearestWaterPlace(v);
    if(spot){
      candidates.push({
        id: 'bathe',
        category: 'hygiene',
        name: 'Bathe in ' + spot.place,
        targetKey: 'bathe_' + spot.place,
        tx: spot.pos.x, ty: spot.pos.y,
        place: spot.place,
        plan: [{ verb: 'bathe' }]
      });
    }
  }

  // 2. Play candidate (children only)
  if(v.stage === 'child'){
    candidates.push({
      id: 'play',
      category: 'leisure',
      name: 'Play games',
      targetKey: 'play_self',
      tx: v.x, ty: v.y,
      plan: [{ verb: 'play', hours: 1 }]
    });
  }

  // 3. Childcare candidate (adults/elders with hungry/thirsty children)
  if(v.stage === 'adult' || v.stage === 'elder'){
    for(const c of VILLAGERS){
      if(c === v || c.dead || c.stage !== 'child') continue;
      const cb = ensureBody(c);
      if(cb.satiety < 0.6 || cb.hydration < 0.6){
        const d = distCells(v, c);
        if(d < 18){
          candidates.push({
            id: 'childcare_' + c.name,
            category: 'social',
            name: 'Care for child ' + c.name,
            targetKey: 'childcare_' + c.name,
            childName: c.name,
            childSatiety: cb.satiety,
            tx: c.x, ty: c.y,
            plan: [{ verb: 'childcare', child: c.name }]
          });
        }
      }
    }
  }

  // 4. Visit candidate (bonded acquaintances)
  if(v.stage !== 'child' && v.bonds){
    for(const name of Object.keys(v.bonds)){
      if(typeof isOstracized === 'function' && isOstracized(name, v)) continue;
      const val = (typeof calculateTrust === 'function') ? calculateTrust(v, name) : v.bonds[name];
      if(val >= 0.4){
        const target = VILLAGERS.find(x => x.name === name && !x.dead);
        if(target && distCells(v, target) > 4 && distCells(v, target) < 30){
          candidates.push({
            id: 'visit_' + name,
            category: 'social',
            name: 'Visit ' + name,
            targetKey: 'visit_' + name,
            targetName: name,
            bondVal: val,
            tx: target.x, ty: target.y,
            plan: [{ verb: 'visit', target: name }]
          });
        }
      }
    }
  }

  // 5. Market stall candidate
  const stall = ensureMarketStall();
  if(stall && Object.keys(stall.stock || {}).some(k => stall.stock[k] > 0)){
    if(!(typeof isOstracized === 'function' && isOstracized(v.name))){
      candidates.push({
        id: 'trade_stall',
        category: 'trade',
        name: 'Trade at market stall',
        targetKey: 'market_stall',
        tx: stall.x,
        ty: stall.y,
        plan: [{ verb: 'buy', place: 'stall' }]
      });
    }
  }

  return candidates;
};

const __scoreCandidateSocial20 = scoreCandidateAction;
scoreCandidateAction = function(v, c){
  let score = __scoreCandidateSocial20(v, c);
  ensureSocialFields(v);
  const b = ensureBody(v);
  const p = ensurePersonality(v);
  const distCells = c.tx != null && c.ty != null ? Math.hypot(c.tx - v.x, c.ty - v.y) / CS : 0;
  const distCost = distCells * 0.8;

  // 1. Life Stage: Child
  if(v.stage === 'child'){
    // Heavy work is blocked
    if(c.category === 'work' && (c.workType === 'fell' || c.workType === 'building' || c.id.startsWith('fell') || c.id.startsWith('build'))){
      return -Infinity;
    }
    // Play scored high
    if(c.id === 'play'){
      score = 65;
      if(p.traits && p.traits.includes('lazy')) score += 15;
      return score;
    }
    // Socialize scored higher
    if(c.id.startsWith('socialize_')){
      score += 25;
    }
  }

  // 2. Life Stage: Elder
  if(v.stage === 'elder'){
    // Heaviest work blocked
    if(c.category === 'work' && (c.workType === 'fell' || c.id.startsWith('fell') || c.id.startsWith('demolish') || c.id.startsWith('expand'))){
      return -Infinity;
    }
    // Tired elders score rest higher
    if((c.id === 'rest' || c.id === 'sleep') && b.fatigue > 0.4){
      score += 35;
    }
  }

  // 3. Bathe (Hygiene Deficit)
  if(c.id === 'bathe'){
    const hygieneDeficit = clamp(1.0 - (b.hygiene != null ? b.hygiene : 1.0), 0, 1);
    score = (hygieneDeficit ** 2) * 95 - distCost;
    return score;
  }

  // 4. Childcare
  if(c.id.startsWith('childcare_')){
    const childDeficit = clamp(1.0 - (c.childSatiety || 0.5), 0, 1);
    score = childDeficit * 80 - distCost;
    return score;
  }

  // 5. Visit
  if(c.id.startsWith('visit_')){
    score = (c.bondVal || 0.5) * 45 - distCost;
    return score;
  }

  // 6. Market stall trade
  if(c.id === 'trade_stall'){
    score = 40 - distCost * 0.5;
    return score;
  }

  // 7. Occupation work bonus
  if(v.occupation && c.category === 'work'){
    if(c.workType === v.occupation.activity || c.workType === v.occupation.type){
      score += 20; // +20 occupation bonus
    }
  }

  // 8. Household food preference bonus
  if(c.category === 'survival' && c.id.startsWith('eat') && v.householdId){
    const hh = getHousehold(v.householdId);
    if(hh && hh.homeId && c.pile && typeof VILLAGE_BUILDINGS !== 'undefined'){
      const hb = VILLAGE_BUILDINGS.find(x => x.id === hh.homeId);
      if(hb && c.pile.wx >= hb.wx && c.pile.wx < hb.wx + hb.tw && c.pile.wy >= hb.wy && c.pile.wy < hb.wy + hb.th){
        score += 20; // prefer home storage food
      }
    }
  }

  return score;
};

/* ---- Unshift Natural Language Intent Patterns ---- */
if(typeof INTENT_PATTERNS !== 'undefined'){
  INTENT_PATTERNS.unshift(
    { re: /\b(bathe|take a bath|cleanse)\b/,
      plan: () => [{ verb: 'bathe' }] },
    { re: /\bvisit\s+(\w+)/,
      plan: (m) => [{ verb: 'visit', target: capName(m[1]) }] },
    { re: /\bplay\b/,
      plan: () => [{ verb: 'play' }] },
    { re: /\b(childcare|watch child|care for child|tend child|look after child|watch baby|care for baby|look after baby)\b(?:\s+(\w+))?/,
      plan: (m) => [{ verb: 'childcare', child: capName(m[2] || 'Pip') }] },
    { re: /\bmarry\s+(\w+)/,
      plan: (m) => [{ verb: 'marry', target: capName(m[1]) }] },
    { re: /\binsult\s+(\w+)/,
      plan: (m) => [{ verb: 'insult', target: capName(m[1]) }] },
    { re: /\b(sweep|tidy)\b/,
      plan: () => [{ verb: 'clean', target: 'house' }] },
    { re: /\bbuy\b.{0,25}\bfrom\s+(?:the\s+)?stall\b/,
      plan: () => [{ verb: 'buy', place: 'stall' }] }
  );
}

/* ---- AI Bridge Extensions ---- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.getLifeStage = (name) => {
    const v = VILLAGERS.find(p => p.name === name);
    return v ? (v.stage || getLifeStage(v)) : null;
  };
  window.__aiBridge.getHousehold = (name) => {
    const v = VILLAGERS.find(p => p.name === name);
    return v && v.householdId ? getHousehold(v.householdId) : null;
  };
  window.__aiBridge.getRelationships = (name) => {
    const v = VILLAGERS.find(p => p.name === name);
    return v ? { bonds: v.bonds, spouseId: v.spouseId, householdId: v.householdId } : null;
  };
  window.__aiBridge.getOccupation = (name) => {
    const v = VILLAGERS.find(p => p.name === name);
    return v ? v.occupation : null;
  };
  window.__aiBridge.marry = (nameA, nameB) => {
    const a = VILLAGERS.find(p => p.name === nameA);
    const b = VILLAGERS.find(p => p.name === nameB);
    return marryVillagers(a, b);
  };
}
