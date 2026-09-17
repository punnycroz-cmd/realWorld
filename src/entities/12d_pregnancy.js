/* ---- pregnancy & birth ---- */
// 2E fix: all birth randomness is seeded (hashString18 + SEED), never Math.random.
function seededBirthHash(tag, m, dayKey){
  if(typeof hashString18 === 'function' && typeof SEED !== 'undefined')
    return hashString18(SEED + ':' + tag + ':' + m.name + ':' + dayKey);
  return 0;
}
function birthChild(m){
  const dayKey = (typeof W !== 'undefined' && W.day != null) ? Math.floor(W.day) : 1;
  const hName = seededBirthHash('birthname', m, dayKey);
  const base = BABY_NAMES[hName % BABY_NAMES.length];
  const name = base + '_' + (10 + (hName % 90));
  const hSex = seededBirthHash('birthsex', m, dayKey);
  const babySex = (hSex % 2 === 0) ? 'f' : 'm';
  const fatherName = (m.pregnant && m.pregnant.father) || m.spouseId || null;
  const wx = Math.floor(m.x / CS), wy = Math.floor(m.y / CS);
  const v = (typeof createVillager === 'function')
    ? createVillager(name, 'Child', m.homeId, wx, wy, {
        sex: babySex,
        ageY: 0,
        stage: 'child',
        adult: false,
        childScale: 0.55,
        motherId: m.name,
        fatherId: fatherName,
        householdId: m.householdId || null
      })
    : {
        name, role: 'Child', homeId: m.homeId,
        x: m.x + 10, y: m.y + 10, targetX: null, targetY: null,
        face: 0, state: 'idle', moving: false, walkPhase: 0, seed: (seededBirthHash('birthseed', m, dayKey) % 100),
        isNPC: true, inBuilding: false, canSwim: true, swimSkill: 0.5, swimReason: '',
        workProgress: 0, triumphT: 0,
        equippedTool: { kind: 'none', name: '', icon: '', desc: '' },
        mood: 0.9, hunger: 0.9, energy: 0.9, hydration: 0.9, coreTemp: 37.0, thoughts: [],
        sex: babySex, ageY: 0, adult: false, stage: 'child', childScale: 0.55,
        inv: {}, bonds: {}, bondMile: {}, danger: [], events: [], plan: [],
        brainControlled: false, pregnant: null, chatT: 0, _ci: 7,
        motherId: m.name, fatherId: fatherName, householdId: m.householdId || null
      };
  v.motherId = m.name;
  v.fatherId = fatherName;
  v.householdId = m.householdId || null;
  v.homeId = m.homeId;
  v.stage = 'child';
  v.adult = false;
  v.bonds[m.name] = 0.9; m.bonds[v.name] = 0.9;
  if(fatherName){
    const f = VILLAGERS.find(x => x.name === fatherName && !x.dead);
    if(f){ v.bonds[f.name] = 0.9; f.bonds[v.name] = 0.9; }
  }
  ensureBody(v); v.body.injury = 0; v.body.illness = 0;
  if(typeof ensureEpistemic === 'function') ensureEpistemic(v);
  if(typeof ensurePersonality === 'function') ensurePersonality(v);

  // Household addition
  if(m.householdId && typeof getHousehold === 'function'){
    const hh = getHousehold(m.householdId);
    if(hh && !hh.members.includes(name)){
      hh.members.push(name);
    }
  }

  VILLAGERS.push(v);
  m.pregnant = null;
  m.lastBirthDay = (typeof W !== 'undefined' && W.day != null) ? W.day : 1;
  logEvent('birth', m.name + ' gave birth to ' + name + ' (day ' + W.day + ')');
  showToast('👶 ' + m.name + ' gave birth to ' + name + '!');

  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
    FeelingSubstrate.receiveSignal(m, FeelingSubstrate.normalizeEvent('birth', null, { mother: m.name, child: name }));
    if(fatherName){
      const f = VILLAGERS.find(x => x.name === fatherName && !x.dead);
      if(f) FeelingSubstrate.receiveSignal(f, FeelingSubstrate.normalizeEvent('birth', null, { mother: m.name, child: name, father: true }));
    }
  }

  // 2D Birth memories
  if(typeof observe === 'function'){
    observe(m, { event: 'birth', child: name }, {
      topic: 'birth_' + name, source: 'direct', confidence: 1.0, salience: 0.95,
      evidence: ['Gave birth to ' + name]
    });
    if(fatherName){
      const f = VILLAGERS.find(x => x.name === fatherName && !x.dead);
      if(f){
        observe(f, { event: 'birth', child: name, mother: m.name }, {
          topic: 'birth_' + name, source: 'direct', confidence: 1.0, salience: 0.95,
          evidence: ['My child ' + name + ' was born to ' + m.name]
        });
      }
    }
    for(const o of VILLAGERS){
      if(o === v || o === m || o.dead) continue;
      if(distCells(o, m) < 16){
        witnessEvent(o, m.name + ' gave birth');
        if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
          FeelingSubstrate.receiveSignal(o, FeelingSubstrate.normalizeEvent('birth', null, { mother: m.name, child: name, witness: true }));
        }
        observe(o, { event: 'birth', mother: m.name, child: name }, {
          topic: 'birth_' + name, source: 'direct', confidence: 0.95, salience: 0.65,
          evidence: ['Witnessed ' + m.name + ' give birth to ' + name]
        });
      }
    }
  } else {
    for(const o of VILLAGERS){
      if(o === v || o === m || o.dead) continue;
      if(distCells(o, m) < 16){
        witnessEvent(o, m.name + ' gave birth');
        if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
          FeelingSubstrate.receiveSignal(o, FeelingSubstrate.normalizeEvent('birth', null, { mother: m.name, child: name, witness: true }));
        }
      }
    }
  }
  if(typeof updateHUD === 'function') updateHUD();
}
function pregnancyTick(dtD){
  for(const v of VILLAGERS.slice()){
    if(v.dead || v.sex !== 'f' || v.pregnant) continue;
    // 2E fix: conception only for adult-STAGE (not elder), conscious, non-starving
    // married women. v.adult is true for elders too, so check the stage directly.
    if(typeof updateLifeStage === 'function') updateLifeStage(v);
    if(v.stage !== 'adult') continue;
    if(typeof isConscious === 'function' && !isConscious(v)) continue;
    if(ensureBody(v).satiety < 0.12) continue; // starving women do not conceive
    if(v.lastBirthDay && (W.day - v.lastBirthDay < 30)) continue; // cooldown
    // 2E fix: married-only. The husband is the father; no unmarried fallback.
    let partner = null;
    if(v.spouseId){
      partner = VILLAGERS.find(m => m.name === v.spouseId && !m.dead && m.adult);
    }
    if(!partner) continue;
    // 2E fix: seeded conception draw, never Math.random.
    const dayKey = (typeof W !== 'undefined' && W.day != null) ? Math.floor(W.day) : 1;
    const draw = (typeof hashString18 === 'function' && typeof SEED !== 'undefined')
      ? (hashString18(SEED + ':conceive:' + v.name + ':' + dayKey + ':' + partner.name) % 10000) / 10000
      : 1;
    if(distCells(v, partner) < 12 && draw < 0.03 * dtD)
      v.pregnant = { days: 0, father: partner.name, announced: false };
  }
  for(const v of VILLAGERS.slice()){
    if(v.dead || !v.pregnant) continue;
    v.pregnant.days += dtD;
    if(!v.pregnant.announced && v.pregnant.days >= 8){
      v.pregnant.announced = true;
      logEvent('pregnancy', v.name + ' is expecting a child');
      showToast('🤰 ' + v.name + ' is expecting!');
      for(const o of VILLAGERS){
        if(o !== v && !o.dead && distCells(o, v) < 16)
          witnessEvent(o, v.name + ' is expecting a child');
      }
    }
    if(v.pregnant.days >= 20) birthChild(v);
  }
  if(typeof ageVillagers === 'function'){
    ageVillagers(dtD);
  } else {
    for(const v of VILLAGERS){
      if(v.dead || v.adult || v.ageY >= 16) continue;
      v.ageY += dtD / 365;
      if(v.ageY >= 16){ v.adult = true; v.childScale = 1; logEvent('growth', v.name + ' has grown up'); }
      else v.childScale = clamp(0.55 + v.ageY * 0.035, 0.55, 1);
    }
  }
  for(const c of VILLAGERS){
    if(c.dead || c.adult) continue;
    const b = ensureBody(c);
    if(b.satiety < 0.35){
      for(const a of VILLAGERS){
        if(a.dead || !a.adult || distCells(a, c) >= 12) continue;
        const f = firstFood(a);
        if(f){ a.inv[f]--; b.satiety = clamp(b.satiety + FOOD_VAL[f], 0, 1); witnessEvent(c, a.name + ' shared food'); break; }
      }
    }
  }
}