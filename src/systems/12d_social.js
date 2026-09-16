/* ---- social: bonds, autonomous chats, reputation-opportunity pipeline & proto-norms ---- */

/* Constants for reputation, proto-norms & gossip */
const REPUTATION_DECAY_RATE = 0.95; // daily decay rate (multiply by decay^days)
const REPUTATION_EPSILON = 0.02;    // drop below epsilon
const OSTRACISM_DURATION_DAYS = 7;  // N days of ostracism for proto-norm violations

function ensureReputationFields(v){
  if(!v) return;
  if(!v.reputationReasons) v.reputationReasons = {};
  if(v.ostracizedUntil == null) v.ostracizedUntil = 0;
  if(!v.ostracizing) v.ostracizing = {};
  if(!v.bonds) v.bonds = {};
  if(!v.bondMile) v.bondMile = {};
}

function getReputationReasons(observer, targetName){
  if(!observer || !targetName) return [];
  ensureReputationFields(observer);
  const tName = typeof targetName === 'object' ? targetName.name : targetName;
  return observer.reputationReasons[tName] || [];
}

function addReputationReason(observer, targetName, reason){
  if(!observer || !targetName || !reason) return null;
  ensureReputationFields(observer);
  const tName = typeof targetName === 'object' ? targetName.name : targetName;
  if(observer.name === tName) return null; // self-opinions not tracked

  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  const day = reason.day != null ? reason.day : Math.floor(now);
  const weight = reason.weight != null ? +Number(reason.weight).toFixed(2) : 0;
  const decay = reason.decay != null ? reason.decay : REPUTATION_DECAY_RATE;
  const confidence = reason.confidence != null ? +Number(reason.confidence).toFixed(2) : 1.0;

  const entry = {
    kind: reason.kind || 'interaction',
    by: tName,
    day: day,
    weight: weight,
    decay: decay,
    confidence: confidence,
    source: reason.source || 'direct',
    teller: reason.teller || null,
    victim: reason.victim || null,
    distorted: !!reason.distorted
  };

  if(!observer.reputationReasons[tName]){
    observer.reputationReasons[tName] = [];
  }
  observer.reputationReasons[tName].push(entry);

  // If severe violation, sync bond to 0
  if(weight <= -0.5){
    observer.bonds[tName] = 0.0;
  } else if(weight > 0 && observer.bonds[tName] != null){
    observer.bonds[tName] = clamp(observer.bonds[tName] + weight * 0.1, 0, 1);
  }

  return entry;
}

function decayReputationReasons(v, dtDays){
  if(!v || !v.reputationReasons) return;
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  for(const targetName in v.reputationReasons){
    const list = v.reputationReasons[targetName];
    if(!Array.isArray(list)) continue;
    const kept = [];
    for(const r of list){
      const days = Math.max(0, now - (r.day || now));
      const decayFactor = Math.pow(r.decay || REPUTATION_DECAY_RATE, days);
      const effWeight = Math.abs(r.weight * decayFactor * (r.confidence != null ? r.confidence : 1.0));
      if(effWeight >= REPUTATION_EPSILON){
        kept.push(r);
      }
    }
    if(kept.length > 0){
      v.reputationReasons[targetName] = kept;
    } else {
      delete v.reputationReasons[targetName];
    }
  }
}

function calculateTrust(observer, target){
  if(!observer || !target) return 0.5;
  const oName = typeof observer === 'object' ? observer.name : observer;
  const tName = typeof target === 'object' ? target.name : target;
  if(oName === tName) return 1.0;

  const obs = typeof observer === 'object' ? observer : (typeof VILLAGERS !== 'undefined' ? VILLAGERS.find(x => x.name === oName) : null);
  if(!obs) return 0.5;
  ensureReputationFields(obs);

  const reasons = obs.reputationReasons[tName] || [];
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;

  // Base trust is 0.5, modulated by baseline bond if known
  let baseTrust = 0.5;
  if(obs.bonds && obs.bonds[tName] != null){
    baseTrust = obs.bonds[tName];
  }

  // Proto-norm active ostracism collapses trust to ~0
  if(isOstracized(tName, obs)){
    return 0.0;
  }

  if(reasons.length === 0){
    return clamp(baseTrust, 0.05, 0.95);
  }

  let netWeight = 0;
  let severeViolation = false;

  for(const r of reasons){
    const days = Math.max(0, now - (r.day || now));
    const decayFactor = Math.pow(r.decay || REPUTATION_DECAY_RATE, days);
    const effWeight = r.weight * decayFactor * (r.confidence != null ? r.confidence : 1.0);
    netWeight += effWeight;
    if(effWeight <= -0.4){
      severeViolation = true;
    }
  }

  // Proto-norm severe violation collapses trust to ~0
  if(severeViolation || netWeight <= -0.6){
    return Math.max(0.0, Math.min(0.05, +(0.05 + netWeight + 0.6).toFixed(4)));
  }

  const finalTrust = clamp(baseTrust + netWeight, 0.0, 1.0);
  return +finalTrust.toFixed(4);
}

function explainTrust(observer, target){
  const o = typeof observer === 'object' ? observer : (typeof VILLAGERS !== 'undefined' ? VILLAGERS.find(x => x.name === observer) : null);
  const tName = typeof target === 'object' ? target.name : target;
  if(!o) return { trust: 0.5, reasons: [] };
  ensureReputationFields(o);

  const reasons = (o.reputationReasons && o.reputationReasons[tName]) || [];
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  const explainedReasons = reasons.map(r => {
    const days = Math.max(0, now - (r.day || now));
    const decayFactor = Math.pow(r.decay || REPUTATION_DECAY_RATE, days);
    const effWeight = +(r.weight * decayFactor * (r.confidence != null ? r.confidence : 1.0)).toFixed(3);
    return Object.assign({}, r, { daysElapsed: +days.toFixed(1), effectiveWeight: effWeight });
  });

  return {
    observer: o.name,
    target: tName,
    trust: calculateTrust(o, tName),
    reasons: explainedReasons
  };
}

function getTrust(observer, target){
  return calculateTrust(observer, target);
}

function getCollectiveTrust(targetName){
  const tName = typeof targetName === 'object' ? targetName.name : targetName;
  if(typeof VILLAGERS === 'undefined') return 0.5;
  const electors = VILLAGERS.filter(v => !v.dead && !v.outsider && v.name !== tName);
  if(electors.length === 0) return 0.5;

  let total = 0;
  for(const e of electors){
    total += calculateTrust(e, tName);
  }
  return +(total / electors.length).toFixed(4);
}

/* Proto-Norms: Stealing, Protect Children, Fire Mutual Aid */

function setOstracism(villagerName, days, observer){
  const vName = typeof villagerName === 'object' ? villagerName.name : villagerName;
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  const until = now + (days || OSTRACISM_DURATION_DAYS);

  if(typeof VILLAGERS !== 'undefined'){
    const v = VILLAGERS.find(x => x.name === vName);
    if(v){
      v.ostracizedUntil = Math.max(v.ostracizedUntil || 0, until);
    }
  }

  if(observer){
    ensureReputationFields(observer);
    observer.ostracizing[vName] = Math.max(observer.ostracizing[vName] || 0, until);
  }
}

function isOstracized(villagerName, observer){
  const vName = typeof villagerName === 'object' ? villagerName.name : villagerName;
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;

  if(observer){
    ensureReputationFields(observer);
    if(observer.ostracizing && (observer.ostracizing[vName] || 0) > now){
      return true;
    }
  }

  if(typeof VILLAGERS !== 'undefined'){
    const v = VILLAGERS.find(x => x.name === vName);
    if(v && (v.ostracizedUntil || 0) > now){
      return true;
    }
  }
  return false;
}

function recordNormViolation(witness, offenderName, normKind, details){
  if(!witness || !offenderName) return null;
  ensureReputationFields(witness);
  details = details || {};

  const oName = typeof offenderName === 'object' ? offenderName.name : offenderName;
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;

  // 1. Reason entry with weight -1.0
  const reason = addReputationReason(witness, oName, {
    kind: normKind, // 'theft-witnessed', 'child-harm', 'child-neglect', 'fire-refusal'
    by: oName,
    day: Math.floor(now),
    weight: details.weight != null ? details.weight : -1.0,
    source: details.source || 'direct',
    confidence: details.confidence != null ? details.confidence : 1.0,
    victim: details.victim || details.child || null
  });

  // 2. Trust wiped to ~0 + bond wiped
  witness.bonds[oName] = 0.0;

  // 3. Ostracism for N days
  setOstracism(oName, details.days || OSTRACISM_DURATION_DAYS, witness);

  // 4. Memory & Thought
  const desc = details.item ? `Saw ${oName} steal ${details.item}`
             : details.child ? `Saw ${oName} harm/neglect child ${details.child}`
             : `Saw ${oName} violate village proto-norm (${normKind})`;
  if(!witness.thoughts || witness.thoughts.length === 0){
    witness.thoughts = [{ text: desc + ' — untrustworthy outcast!', val: -4 }];
  }
  if(typeof witnessEvent === 'function'){
    witnessEvent(witness, desc);
  }
  if(typeof logEvent === 'function'){
    logEvent('norm', `${witness.name} witnessed norm violation by ${oName} (${normKind})`);
  }

  return reason;
}

function recordProsocialDeed(doer, kind, details){
  if(!doer) return;
  details = details || {};
  const dName = typeof doer === 'object' ? doer.name : doer;
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  const weight = details.weight != null ? details.weight : 0.25;

  if(typeof VILLAGERS !== 'undefined'){
    for(const w of VILLAGERS){
      if(w.dead || w.name === dName) continue;
      if(typeof distCells === 'function' && doer.x != null && w.x != null){
        if(distCells(w, doer) > 14) continue;
      }
      addReputationReason(w, dName, {
        kind: kind, // 'fire-aid', etc.
        by: dName,
        day: Math.floor(now),
        weight: weight,
        source: 'direct',
        confidence: 0.95
      });
      if(typeof addBond === 'function') addBond(w, doer, weight * 0.2);
    }
  }
}

/* Gossip Pipeline */

function spreadGossip(speaker, listener, forcedRumor){
  if(!speaker || !listener || speaker === listener || speaker.dead || listener.dead) return null;
  ensureReputationFields(speaker);
  ensureReputationFields(listener);

  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  let rumor = forcedRumor;

  if(!rumor){
    // Pick highest impact social reason from speaker's beliefs
    let bestReason = null, bestImpact = 0;
    for(const targetName in speaker.reputationReasons){
      if(targetName === listener.name) continue;
      const list = speaker.reputationReasons[targetName];
      for(const r of list){
        const impact = Math.abs(r.weight || 0) * (r.confidence != null ? r.confidence : 1.0);
        if(impact > bestImpact){
          bestImpact = impact;
          bestReason = r;
        }
      }
    }
    if(!bestReason) return null;
    rumor = Object.assign({}, bestReason);
  }

  // 1-hop distortion:
  // - Details shift: who/what slightly altered, confidence lowered
  const originalConf = rumor.confidence != null ? rumor.confidence : 1.0;
  const distortedConf = +Math.max(0.2, originalConf * 0.75).toFixed(2);
  const distortedWeight = +(rumor.weight * 0.85).toFixed(2);

  let distortedKind = rumor.kind;
  if(distortedKind === 'theft-witnessed') distortedKind = 'theft-rumor';
  else if(distortedKind === 'child-harm') distortedKind = 'child-harm-rumor';
  else if(distortedKind === 'fire-refusal') distortedKind = 'fire-refusal-rumor';

  let targetPerson = rumor.by;
  if(rumor.mistakenWho){
    targetPerson = rumor.mistakenWho;
  }

  const gossipReason = {
    kind: distortedKind,
    by: targetPerson,
    day: Math.floor(now),
    weight: distortedWeight,
    source: 'gossip',
    teller: speaker.name,
    confidence: distortedConf,
    decay: rumor.decay || REPUTATION_DECAY_RATE,
    victim: rumor.victim || null,
    distorted: true
  };

  // Add reason to listener's opinion of targetPerson
  addReputationReason(listener, targetPerson, gossipReason);

  // If severe violation rumor, listener also ostracizes targetPerson
  if(distortedWeight <= -0.4){
    setOstracism(targetPerson, 5, listener);
    listener.bonds[targetPerson] = Math.min(listener.bonds[targetPerson] || 0.5, 0.05);
  }

  // Record hearsay memory/belief in listener's epistemic store
  if(typeof observe === 'function'){
    observe(listener, {
      event: 'gossip',
      about: targetPerson,
      kind: distortedKind,
      teller: speaker.name
    }, {
      topic: 'gossip_' + targetPerson,
      source: 'hearsay',
      confidence: distortedConf,
      salience: 0.75,
      evidence: ['Heard from ' + speaker.name + ' that ' + targetPerson + ' committed ' + distortedKind]
    });
  }

  if(typeof witnessEvent === 'function'){
    witnessEvent(speaker, 'Gossiped with ' + listener.name + ' about ' + targetPerson);
    witnessEvent(listener, 'Heard gossip from ' + speaker.name + ' about ' + targetPerson);
  }
  if(typeof logEvent === 'function'){
    logEvent('gossip', `${speaker.name} gossiped to ${listener.name} about ${targetPerson} (${distortedKind})`);
  }

  return gossipReason;
}

/* Role Vacancy Selection */

function fillRoleVacancy(role, options){
  options = options || {};
  let candidates = options.candidates;
  if(!candidates && typeof VILLAGERS !== 'undefined'){
    candidates = VILLAGERS.filter(v => !v.dead && !v.outsider && (v.stage === 'adult' || v.stage === 'elder'));
  } else if(Array.isArray(candidates)){
    candidates = candidates.map(c => typeof c === 'string' ? (VILLAGERS.find(v => v.name === c) || null) : c).filter(Boolean);
  } else {
    candidates = [];
  }

  if(!candidates.length){
    return { ok: false, role, reason: 'no candidates available' };
  }

  const livingElectors = (typeof VILLAGERS !== 'undefined')
    ? VILLAGERS.filter(v => !v.dead && !v.outsider && (v.stage === 'adult' || v.stage === 'elder'))
    : [];

  const scored = [];
  for(const c of candidates){
    const electors = livingElectors.filter(e => e.name !== c.name);
    let totalTrust = 0;
    for(const e of electors){
      totalTrust += calculateTrust(e, c);
    }
    const collectiveTrust = electors.length > 0 ? +(totalTrust / electors.length).toFixed(4) : 0.5;

    // Disqualification: if currently ostracized or collective trust is collapsed (< 0.2)
    const ostracized = isOstracized(c.name);
    const disqualified = ostracized || (collectiveTrust < 0.2);

    // Capability / suitability secondary bonus (breaks ties among honest candidates)
    let suitability = 0;
    const rLower = String(role).toLowerCase();
    if(rLower.includes('guard')){
      const huntLvl = (c.skills && c.skills.hunting && c.skills.hunting.lvl) || 0;
      const brave = (c.personality && c.personality.brave) || 1.0;
      suitability = (huntLvl * 0.05) + ((brave - 1.0) * 0.05);
    } else if(rLower.includes('healer') || rLower.includes('herbalist')){
      const medLvl = (c.skills && c.skills.medicine && c.skills.medicine.lvl) || 0;
      suitability = medLvl * 0.1;
    } else if(rLower.includes('head') || rLower.includes('mayor')){
      const age = c.ageY || 25;
      suitability = Math.min(0.1, (age - 18) * 0.002);
    }

    const finalScore = disqualified ? -1.0 : +(collectiveTrust + suitability).toFixed(4);
    scored.push({
      name: c.name,
      candidate: c,
      collectiveTrust,
      suitability: +suitability.toFixed(3),
      disqualified,
      ostracized,
      score: finalScore
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  if(!best || best.score < 0 || best.disqualified){
    return {
      ok: false,
      role,
      reason: 'all candidates disqualified or untrusted',
      candidates: scored
    };
  }

  const winner = best.candidate;
  const roleNameMap = {
    'guard': 'Village Guard',
    'village guard': 'Village Guard',
    'healer': 'Village Healer',
    'village healer': 'Village Healer',
    'herbalist': 'Herbalist & Apothecary',
    'village head': 'Village Head',
    'head': 'Village Head',
    'mayor': 'Village Mayor'
  };
  const finalRoleTitle = roleNameMap[role.toLowerCase()] || role;
  winner.role = finalRoleTitle;
  if(typeof logEvent === 'function'){
    logEvent('role', winner.name + ' was chosen as ' + finalRoleTitle + ' (collective trust: ' + best.collectiveTrust + ')');
  }

  return {
    ok: true,
    role: finalRoleTitle,
    winner: winner.name,
    candidate: winner,
    collectiveTrust: best.collectiveTrust,
    score: best.score,
    candidates: scored,
    reasoning: `${winner.name} chosen as ${finalRoleTitle} with collective trust ${best.collectiveTrust.toFixed(2)}`
  };
}

/* Original Social Systems: Bonds & Autonomous Chat */

function addBond(a, b, amt){
  if(!a || !b || a === b || a.dead || b.dead) return;
  ensureReputationFields(a);
  ensureReputationFields(b);
  const na = a.bonds[b.name] || 0;
  a.bonds[b.name] = clamp(na + amt, 0, 1);
  b.bonds[a.name] = clamp((b.bonds[a.name] || 0) + amt, 0, 1);
  const mA = a.bondMile;
  for(const th of [0.3, 0.6, 0.9]){
    const key = b.name + '_' + th;
    if(na < th && a.bonds[b.name] >= th && !mA[key]){
      mA[key] = 1;
      const label = th >= 0.9 ? 'close friends' : th >= 0.6 ? 'friends' : 'acquaintances';
      if(typeof logEvent === 'function') logEvent('bond', a.name + ' and ' + b.name + ' are now ' + label);
    }
  }
}

function socialTick(h){
  const awake = VILLAGERS.filter(v => !v.dead && !v.brainControlled &&
    (v.state === 'idle' || v.state === 'walk' || v.state === 'rest'));
  for(let i = 0; i < awake.length; i++) for(let j = i + 1; j < awake.length; j++){
    const a = awake[i], b = awake[j];
    if(distCells(a, b) < 6 && srand() < 0.12 * h){
      addBond(a, b, 0.03);
      a.mood = clamp(a.mood + 0.02, 0, 1); b.mood = clamp(b.mood + 0.02, 0, 1);
      a.state = 'chat'; b.state = 'chat'; a.chatT = 0.2; b.chatT = 0.2;
      const line = CHAT_LINES[Math.floor(srand() * CHAT_LINES.length)];
      witnessEvent(a, 'Chatted with ' + b.name + ': "' + line + '"');
      witnessEvent(b, 'Chatted with ' + a.name);
      // Autonomous gossip: deterministic chance based on villager coords
      const chatHash = Math.abs(Math.floor((a.x + b.x) * 11 + (a.y + b.y) * 7)) % 100;
      if(chatHash < 35){
        if(chatHash % 2 === 0) spreadGossip(a, b);
        else spreadGossip(b, a);
      }
    }
  }
  for(const v of VILLAGERS){
    if(v.chatT > 0){ v.chatT -= h; if(v.chatT <= 0 && v.state === 'chat') v.state = 'idle'; }
    decayReputationReasons(v, h / 24);
  }
}

/* AI Bridge Extensions */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.getTrust = (obs, target) => calculateTrust(obs, target);
  window.__aiBridge.explainTrust = (obs, target) => explainTrust(obs, target);
  window.__aiBridge.getReputationReasons = (obs, target) => getReputationReasons(obs, target);
  window.__aiBridge.getCollectiveTrust = (target) => getCollectiveTrust(target);
  window.__aiBridge.isOstracized = (name, obs) => isOstracized(name, obs);
  window.__aiBridge.spreadGossip = (spk, lst, rumor) => spreadGossip(spk, lst, rumor);
  window.__aiBridge.fillRoleVacancy = (role, opt) => fillRoleVacancy(role, opt);
  window.__aiBridge.recordNormViolation = (wit, off, kind, det) => recordNormViolation(wit, off, kind, det);
}