/* ---------------------------------------------------------------------
   PART 4: LIVING BODIES & CHARACTER BIOMETRICS (NATURA ENGINE)
   --------------------------------------------------------------------- */
const VILLAGERS = [];
const G = {
  villagers: VILLAGERS,
  frame: 0,
  particles: [],
  inspectedVillager: null
};
let controlledPawnIdx = 0;
let inspectedPawnIdx = 0;

function ensureBody(v){
  if(v.body){
    if(v.body.hygiene == null) v.body.hygiene = 0.95;
    if(v.body.workFactor == null) v.body.workFactor = 1.0;
    if(v.body.speedFactor == null) v.body.speedFactor = 1.0;
    v.bodyWorkFactor = v.body.workFactor;
    v.bodySpeedFactor = v.body.speedFactor;
    if(!v.emotions) v.emotions = [];
    if(!v.identity) v.identity = [];
    v.hygiene = v.body.hygiene;
    return v.body;
  }
  v.body = {
    hydration: 0.90 + srand()*0.08,
    satiety: 0.88 + srand()*0.10,
    fatigue: 0.10 + srand()*0.08,
    sleepDebt: 0.0,
    coreTemp: 37.0,
    stress: 0.05,
    thermal: 0.0,
    tissue: 1.0,
    wetness: 0.0,
    oxygen: 1.0,
    hygiene: 0.95,
    lastMeal: 2.0,
    lastDrink: 1.0,
    workFactor: 1.0,
    speedFactor: 1.0
  };
  v.bodyWorkFactor = 1.0;
  v.bodySpeedFactor = 1.0;
  if(!v.emotions) v.emotions = [];
  if(!v.identity) v.identity = [];
  v.hygiene = v.body.hygiene;
  return v.body;
}

function bodyDrives(v){
  const b = ensureBody(v), out = [];
  if(v.state === 'drown_panic') out.push({ text: 'CANNOT SWIM! Choking on deep water! 💦😱', val: -15 });
  else if(v.state === 'swim') out.push({ text: 'Gliding smoothly through cool lake water 🏊', val: 6 });
  else if(v.state === 'wade') out.push({ text: 'Wading through refreshing shallow ripples 🌊', val: 4 });

  if(b.hydration < 0.15) out.push({ text: 'Mouth parched; desperately needs water', val: -6 });
  else if(b.hydration < 0.35) out.push({ text: 'Feeling thirsty; craving cool water', val: -3 });
  if(b.satiety < 0.15) out.push({ text: 'Hollow with hunger; needs food immediately', val: -6 });
  else if(b.satiety < 0.35) out.push({ text: 'Stomach rumbling; needs a meal soon', val: -3 });
  if(b.fatigue > 0.80) out.push({ text: 'Body heavy with exhaustion; needs sleep', val: -5 });
  else if(b.fatigue > 0.60) out.push({ text: 'Muscles weary from daily labor', val: -2 });

  if(b.hygiene < 0.25) out.push({ text: 'Covered in grime and dirt; desperately needs a bath', val: -5 });
  else if(b.hygiene < 0.50) out.push({ text: 'Feeling grimy from honest physical labor', val: -2 });

  if(b.wetness > 0.5 && b.coreTemp < 36.4) out.push({ text: 'Soaked clothes clinging, shivering in cold breeze', val: -5 });
  else if(b.coreTemp < 36.2) out.push({ text: 'Chilled to the bone from cold wind/rain', val: -4 });
  else if(b.wetness > 0.3 && b.coreTemp > 37.2) out.push({ text: 'Cool lake water feels wonderfully soothing', val: 5 });
  else if(b.coreTemp > 37.8) out.push({ text: 'Overheated and sweating under the sun', val: -2 });

  if(v.state === 'work') out.push({ text: 'Engaged in productive honest labor', val: 4 });
  if(out.length === 0) out.push({ text: 'Body feels steady, strong and capable', val: 5 });
  return out;
}

function bodyTick(v, dtH){
  const b = ensureBody(v);
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const {c, i} = cellChunk(wx, wy);

  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;
  const isShallow = depth > 0 && depth <= 0.05;

  // Environmental exposure
  const isRainWet = c.rain[i] > 0.15 && !v.inBuilding;
  let isNearFire = v.inBuilding;
  if(!isNearFire && typeof FIRES !== 'undefined'){
    for(const f of FIRES){
      if(f.burnH > 0 && Math.hypot(v.x - f.x, v.y - f.y) < CS * 3){ isNearFire = true; break; }
    }
  }
  const envTemp = c.temp[i];

  // Wetness dynamics
  if(isDeep) b.wetness = 1.0;
  else if(isShallow) b.wetness = Math.min(1.0, b.wetness + dtH * 15);
  else if(isRainWet) b.wetness = Math.min(1.0, b.wetness + dtH * 2.5);
  else b.wetness = Math.max(0, b.wetness - dtH * (envTemp > 24 ? 2.5 : 1.2)); // dries off

  // Water / Swimming / Drowning mechanics
  let exert = (v.state === 'work' ? 1.8 : (v.moving ? 0.7 : 0.15));
  if(isDeep){
    if(v.canSwim){
      v.state = 'swim';
      exert = 2.4; // swimming is a vigorous whole-body cardio workout
      b.oxygen = Math.min(1.0, b.oxygen + dtH * 5);
      // Lake water cooling effect
      b.coreTemp = Math.max(35.5, b.coreTemp - 0.4 * dtH);
    } else {
      v.state = 'drown_panic';
      exert = 3.5; // frantic flailing
      b.oxygen = Math.max(0, b.oxygen - dtH * 35);
      b.stress = Math.min(1.0, b.stress + dtH * 25);
      b.hydration = Math.min(1.0, b.hydration + dtH * 1.5); // swallowing water
    }
  } else if(isShallow){
    if(v.state === 'drown_panic'){
      if(typeof observe === 'function'){
        observe(v, { event: 'survived near-drowning', what: 'escaped deep water after near drowning' }, {
          topic: 'near_drowning_survivor',
          salience: 0.95,
          source: 'direct',
          bypassAttention: true
        });
      }
    }
    if(v.state === 'walk' || v.state === 'wade' || v.state === 'drown_panic') v.state = 'wade';
    exert = (v.moving ? 1.4 : 0.2); // wading drag
    b.oxygen = Math.min(1.0, b.oxygen + dtH * 20);
    if(envTemp > 24) b.stress = Math.max(0, b.stress - dtH * 0.5); // refreshing summer dip
  } else {
    if(v.state === 'drown_panic'){
      if(typeof observe === 'function'){
        observe(v, { event: 'survived near-drowning', what: 'escaped deep water after near drowning' }, {
          topic: 'near_drowning_survivor',
          salience: 0.95,
          source: 'direct',
          bypassAttention: true
        });
      }
      v.state = 'idle';
    }
    b.oxygen = Math.min(1.0, b.oxygen + dtH * 20);
  }

  // Water depletion (accelerates with heat & exertion)
  const waterLoss = (0.015 + 0.008*exert + (envTemp > 25 ? 0.012 : 0)) * dtH;
  b.hydration = clamp(b.hydration - waterLoss, 0, 1);

  // Calorie burn (elders burn slightly less)
  let calLoss = (0.014 + 0.010*exert) * dtH;
  const isElder = (v.stage === 'elder' || (v.ageY != null && v.ageY >= 60));
  if(isElder) calLoss *= 0.85;
  b.satiety = clamp(b.satiety - calLoss, 0, 1);

  // Rest / Stamina (elders tire faster)
  const fatigueRate = isElder ? 1.35 : 1.0;
  if(v.state === 'sleep'){
    b.fatigue = clamp(b.fatigue - dtH / 4.5, 0, 1);
    b.sleepDebt = Math.max(0, b.sleepDebt - dtH * 1.5);
  } else if(v.state === 'sit'){
    b.fatigue = clamp(b.fatigue - dtH / 12, 0, 1);
  } else {
    b.fatigue = clamp(b.fatigue + (0.01 + 0.02*exert) * dtH * fatigueRate, 0, 1);
    b.sleepDebt = Math.min(18, b.sleepDebt + dtH * 0.03);
  }

  // Hygiene depletion (dirt accumulates from work and travel)
  if(b.hygiene == null) b.hygiene = 1.0;
  const hygieneLoss = (v.state === 'work' ? 0.025 : (v.moving ? 0.015 : 0.008)) * dtH;
  b.hygiene = clamp(b.hygiene - hygieneLoss, 0, 1);
  v.hygiene = b.hygiene;

  // Thermoregulation (core body temperature)
  // Wet clothes cause evaporative cooling; cold rain lowers temp
  const targetTemp = 37.0 + (envTemp - 20)*0.04 + (isNearFire ? 0.7 : 0) - (b.wetness * (envTemp < 22 ? 1.6 : 0.6));
  b.coreTemp += (targetTemp - b.coreTemp) * Math.min(1, 0.3 * dtH);

  // Stress & Mood
  const deficits = (1 - b.hydration)*0.9 + (1 - b.satiety)*0.8 + b.fatigue*0.6 + Math.abs(b.coreTemp - 37.0)*1.2 + (1 - b.oxygen)*4.0;
  b.stress = clamp(b.stress + (deficits*0.15 - b.stress*0.05)*dtH, 0, 1);

  // Mood synthesis
  v.mood = clamp(1.0 - b.stress * 0.85, 0.05, 1.0);
  v.hunger = b.satiety;
  v.energy = clamp(1.0 - b.fatigue, 0, 1);
  v.hydration = b.hydration;
  v.coreTemp = b.coreTemp;

  // Sensation drives
  v.thoughts = bodyDrives(v);

  // Phase 6C: Body-factor chain (C4)
  calcBodyFactors(v);

  // Phase 6C: Emotion derivation layer (C3)
  updateDerivedEmotions(v, dtH);

  for(const fn of BODY_TICKS) fn(v, dtH);
}

/* ---- Phase 6C: Body-factor chain (C4) ----
   Untreated wounds -> infection; every condition multiplies work factor /
   speed factor by severity; pain + blood loss stack. */
function calcBodyFactors(v){
  const b = ensureBody(v);
  if(typeof syncWounds === 'function') syncWounds(v);
  let pain = (b.injury || 0) * 0.5;
  let woundInf = 0;
  if(b.wounds && b.wounds.length){
    for(const w of b.wounds){
      pain += (w.sev || 0) * (w.dressed ? 0.4 : 1.0);
      woundInf = Math.max(woundInf, w.inf || 0);
    }
  }
  pain = clamp(pain, 0, 1);
  const blood = b.blood != null ? b.blood : 1.0;
  const bloodLoss = clamp(1.0 - blood, 0, 1);
  const infection = clamp(Math.max(woundInf, b.illness || 0), 0, 1);

  // Multiplicative degradation across conditions (pain + blood loss stack)
  let wf = 1.0;
  let sf = 1.0;
  if(pain > 0.05){
    wf *= Math.max(0.1, 1.0 - pain * 0.45);
    sf *= Math.max(0.1, 1.0 - pain * 0.35);
  }
  if(bloodLoss > 0.05){
    wf *= Math.max(0.1, 1.0 - bloodLoss * 0.50);
    sf *= Math.max(0.1, 1.0 - bloodLoss * 0.40);
  }
  if(infection > 0.05){
    wf *= Math.max(0.1, 1.0 - infection * 0.40);
    sf *= Math.max(0.1, 1.0 - infection * 0.30);
  }
  if(typeof hasFracture === 'function' && hasFracture(v, 'leg')){
    wf *= 0.3;
    sf *= 0.2;
  }
  // Phase 6E 3B (ADR-003): stressResidue reduces workFactor slightly (~10% at max 0.35 ceiling)
  if(v.stressResidue && v.stressResidue > 0.02){
    wf *= Math.max(0.85, 1.0 - v.stressResidue * 0.25);
  }
  b.workFactor = +clamp(wf, 0.05, 1.0).toFixed(3);
  b.speedFactor = +clamp(sf, 0.05, 1.0).toFixed(3);
  v.bodyWorkFactor = b.workFactor;
  v.bodySpeedFactor = b.speedFactor;
  return { workFactor: b.workFactor, speedFactor: b.speedFactor, pain, bloodLoss, infection };
}

/* ---- Phase 6C: Emotion derivation layer (C3) ----
   Emotions derived from body/needs + decay: hungry->anxious,
   pain->suffering, stable->content. */
function recordOrUpdateEmotion(v, tag, intensity, subject){
  if(!v.emotions) v.emotions = [];
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0)/24) : 1;
  const existing = v.emotions.find(e => e.tag === tag && (!subject || e.subject === subject));
  if(existing){
    existing.intensity = Math.max(existing.intensity || 0, intensity);
    existing.when = now;
  } else {
    v.emotions.push({ tag, intensity, when: now, subject: subject || null });
    if(v.emotions.length > 20) v.emotions.shift();
  }
}

function updateDerivedEmotions(v, dtH){
  const b = ensureBody(v);
  if(!v.emotions) v.emotions = [];
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0)/24) : 1;
  const dt = dtH != null ? dtH : 0.5;

  // 1. Emotion decay over time
  for(let i = v.emotions.length - 1; i >= 0; i--){
    const e = v.emotions[i];
    if(e.decay !== false){
      e.intensity = Math.max(0, +(e.intensity - dt * 0.15).toFixed(4));
      if(e.intensity <= 0.01 && e.tag !== 'content'){
        v.emotions.splice(i, 1);
      }
    }
  }

  // 2. Derive: hungry -> anxious
  if(b.satiety < 0.35){
    const anxiousIntensity = +clamp((0.35 - b.satiety) / 0.35, 0.1, 1.0).toFixed(2);
    recordOrUpdateEmotion(v, 'anxious', anxiousIntensity);
  }

  // 3. Derive: pain/damage -> suffering
  const pain = (b.injury || 0) * 0.5 + ((b.wounds || []).reduce((s, w) => s + (w.sev || 0), 0));
  const bloodLoss = clamp(1.0 - (b.blood != null ? b.blood : 1.0), 0, 1);
  const infection = Math.max((b.wounds || []).reduce((mx, w) => Math.max(mx, w.inf || 0), 0), b.illness || 0);
  const totalSuffering = Math.max(pain, bloodLoss, infection);
  if(totalSuffering > 0.15){
    const sufferingIntensity = +clamp(totalSuffering, 0.1, 1.0).toFixed(2);
    recordOrUpdateEmotion(v, 'suffering', sufferingIntensity);
  }

  // 4. Derive: stable -> content
  if(b.satiety >= 0.55 && b.hydration >= 0.55 && b.fatigue <= 0.45 && totalSuffering < 0.15){
    recordOrUpdateEmotion(v, 'content', 0.6);
  }

  // 5. Phase 6E: FeelingSubstrate & D1 decay accumulators update
  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.update === 'function'){
    FeelingSubstrate.update(v, dt);
  }
}
