/* =====================================================================
   PART 17B / 2D: INDIVIDUAL KNOWLEDGE, BELIEFS, MEMORY & OWNERSHIP — Phase 2D
   Implements the core Natura epistemic separation:
   REALITY vs PERCEPTION vs MEMORY vs KNOWLEDGE vs BELIEF vs CLAIM vs EVIDENCE vs UNCERTAINTY.
   Villagers know only what their senses, memory, and teaching provide.
   World truth pointers are NEVER stored as known facts.
   ===================================================================== */

let _nextEpistemicId = 0;
function nextEpistemicId(prefix){
  return (prefix || 'mem') + '_' + (++_nextEpistemicId);
}

function isConscious(p){
  return Boolean(p && !p.dead && !p.downed && p.state !== 'sleep');
}

function getMemoryTrait(v){
  if(!v) return 'average';
  if(v.memoryTrait) return v.memoryTrait;
  if(v.traits && Array.isArray(v.traits)){
    if(v.traits.includes('sharp')) return 'sharp';
    if(v.traits.includes('forgetful')) return 'forgetful';
  }
  return 'average';
}

function contentValuesEqual(a, b){
  if(a === b) return true;
  if(typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch(e){
    return false;
  }
}

function isContentConflicting(oldContent, newContent){
  if(oldContent === newContent) return false;
  if(typeof oldContent !== 'object' || typeof newContent !== 'object' || !oldContent || !newContent){
    return oldContent !== newContent;
  }
  // Any shared key with a different value is a conflict -> supersede path.
  // Keys present on only one side (or undefined on either side) are enrichment, not conflict.
  for(const k of Object.keys(oldContent)){
    if(oldContent[k] === undefined || newContent[k] === undefined) continue;
    if(!contentValuesEqual(oldContent[k], newContent[k])) return true;
  }
  return false;
}

/* Deep-clone helpers: a belief stored separately from its memory entry must
   never share the evidence array or content object with that entry, or later
   reinforcement would silently rewrite history. */
function cloneEvidence(ev){
  return Array.isArray(ev) ? ev.slice() : [];
}
function cloneContent(content){
  if(content === null || content === undefined) return content;
  if(typeof content !== 'object') return content;
  try { return JSON.parse(JSON.stringify(content)); } catch(e){ return content; }
}
function beliefFromMemory(mem){
  const b = { ...mem };
  b.kind = 'belief';
  b.evidence = cloneEvidence(mem.evidence);
  b.content = cloneContent(mem.content);
  return b;
}

/* Find a recent equivalent memory for dedupe: same topic + source, equal
   content, not superseded, recorded within windowH sim-hours. */
function findRecentEquivalentMemory(v, topic, source, content, now, windowH){
  const mems = v.epistemic.memories;
  const windowDays = windowH / 24;
  for(let i = mems.length - 1; i >= 0; i--){
    const m = mems[i];
    if(m.superseded) continue;
    if(m.topic !== topic || m.source !== source) continue;
    if((now - m.when) > windowDays) break; // memories are chronological
    if(contentValuesEqual(m.content, content)) return m;
  }
  return null;
}

function getOrCreateOwnershipRecord(v, targetId){
  ensureEpistemic(v);
  if(!v.epistemic.ownership[targetId]){
    v.epistemic.ownership[targetId] = {
      targetId: targetId,
      knownOwner: null,
      suspectedOwner: null,
      confidence: 0,
      evidence: [],
      claims: []
    };
  }
  return v.epistemic.ownership[targetId];
}

function initDefaultEpistemic(v){
  if(!v || !v.epistemic) return;
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;

  // Default village food knowledge
  v.epistemic.beliefs['food_inn'] = {
    id: nextEpistemicId('mem'),
    kind: 'belief',
    topic: 'food_inn',
    content: { place: 'inn', foodKind: 'bread' },
    who: 'Tobin',
    where: { place: 'inn' },
    when: now,
    confidence: 0.9,
    salience: 0.8,
    evidence: ['Village inn common knowledge'],
    source: 'memory',
    createdAt: now,
    lastReinforced: now,
    superseded: false,
    supersededBy: null
  };
  v.epistemic.beliefs['food_kitchen'] = {
    id: nextEpistemicId('mem'),
    kind: 'belief',
    topic: 'food_kitchen',
    content: { place: 'kitchen', foodKind: 'bread' },
    who: null,
    where: { place: 'kitchen' },
    when: now,
    confidence: 0.85,
    salience: 0.7,
    evidence: ['Village kitchen common knowledge'],
    source: 'memory',
    createdAt: now,
    lastReinforced: now,
    superseded: false,
    supersededBy: null
  };

  // Village settlement building knowledge
  if(typeof VILLAGE_BUILDINGS !== 'undefined' && Array.isArray(VILLAGE_BUILDINGS)){
    for(const b of VILLAGE_BUILDINGS){
      if(b.owner){
        v.epistemic.ownership[b.id] = {
          targetId: b.id,
          knownOwner: b.owner,
          suspectedOwner: b.owner,
          confidence: 0.85,
          evidence: ['Village resident knowledge'],
          claims: []
        };
      }
    }
  }
}

function ensureEpistemic(v){
  if(!v) return null;
  if(!v.identity) v.identity = [];
  if(!v.epistemic){
    v.epistemic = {
      memories: [],
      beliefs: {},
      ownership: {},
      expectations: {},
      lastDecayDay: (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0
    };
    initDefaultEpistemic(v);
  }
  if(!v.epistemic.expectations){
    v.epistemic.expectations = {};
  }
  return v.epistemic;
}

/* =====================================================================
   PHASE 6C: AUTOBIOGRAPHICAL IDENTITY (C5)
   v.identity: at most 3-5 self-beliefs, NEVER hand-configured — they
   crystallize when events hit EXTREME salience. Every tag measurably
   changes attention (6A) and goal selection.
   ===================================================================== */
const IDENTITY_TAGS = {
  PIPS_MOTHER: 'pips_mother',
  NEAR_DROWNING_SURVIVOR: 'near_drowning_survivor',
  FIRE_SAVIOR: 'fire_savior',
  BETRAYED: 'betrayed',
  MASTER_CRAFTSMAN: 'master_craftsman',
  MASTER_FARMER: 'master_farmer',
  VILLAGE_PROTECTOR: 'village_protector'
};

function formIdentityTag(v, tag, details = {}){
  if(!v) return null;
  if(!v.identity) v.identity = [];
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0)/24) : 1.0;
  const salience = details.salience != null ? details.salience : 1.0;
  const biasCoeff = details.biasCoeff || (tag === 'pips_mother' ? 5.0 : 2.5);

  const existing = v.identity.find(id => id.tag === tag);
  if(existing){
    existing.salience = Math.max(existing.salience, salience);
    existing.formedAt = now;
    existing.biasCoeff = biasCoeff;
    return existing;
  }

  // Max 5 identity tags: old tags drop when newer upheavals shake them
  if(v.identity.length >= 5){
    v.identity.sort((a, b) => {
      if(Math.abs(a.salience - b.salience) > 1e-4) return a.salience - b.salience;
      return a.formedAt - b.formedAt;
    });
    const dropped = v.identity.shift();
    if(v.thoughts) v.thoughts.push({ text: `Old identity shed: ${dropped.tag}`, val: 0 });
  }

  const entry = {
    tag,
    salience,
    formedAt: now,
    source: details.source || 'crystallized_experience',
    biasCoeff
  };
  v.identity.push(entry);
  if(v.thoughts) v.thoughts.push({ text: `Deep identity crystallized: ${tag}`, val: 4 });
  return entry;
}

/* ---- Core Epistemic APIs ---- */

function observe(v, content, details){
  if(!v) return null;
  ensureEpistemic(v);
  details = details || {};

  // Selective Attention filter (A1) — background noise does NOT become memory
  if(details.bypassAttention !== true){
    const att = (typeof filterAttention === 'function') ? filterAttention(v, content, details) : { attended: true };
    if(!att.attended){
      return null;
    }
  }

  const topic = details.topic || (typeof content === 'string' ? content : (content && content.topic) || 'general');
  const source = details.source || 'direct';

  let defaultConf = 0.95;
  if(source === 'memory') defaultConf = 0.65;
  else if(source === 'hearsay'){
    defaultConf = 0.45;
    /* production-1: memory-model wiring — misinfo_suscept (spec range
       0.05–0.70, archetype-C baseline 0.30) scales how strongly
       heard-but-unverified accounts land for this character. */
    if(v.memProfile && v.memProfile.misinfo_suscept != null)
      defaultConf = Math.max(0.1, Math.min(0.9,
        0.45 * (v.memProfile.misinfo_suscept / 0.30)));
  }
  else if(source === 'claim') defaultConf = 0.30;

  const conf = details.confidence != null ? details.confidence : defaultConf;
  let salience = details.salience != null ? details.salience : 0.5;

  // Phase 6C: Identity-driven attention multiplier on salience (C5)
  if(typeof getIdentityAttentionMultiplier === 'function'){
    const idMult = getIdentityAttentionMultiplier(v, content, details);
    if(idMult > 1.0){
      salience = Math.min(1.0, +(salience * idMult).toFixed(4));
    }
  }

  // Phase 6C: Crystallize Autobiographical Identity from extreme salience events (C5)
  if(details.salience >= 0.90 || salience >= 0.90){
    let evtStr = '';
    if(typeof content === 'string') evtStr = content;
    else if(content && typeof content === 'object'){
      evtStr = Object.values(content).filter(x => typeof x === 'string').join(' ');
    }
    evtStr += ` ${details.topic || ''} ${details.event || ''}`;
    if(/drown/i.test(evtStr) || details.topic === 'near_drowning_survivor' || v.state === 'drown_panic'){
      formIdentityTag(v, 'near_drowning_survivor', { salience, source: 'near_drowning' });
    } else if((/fire|wildfire|cháy/i.test(evtStr) && /save|hero|douse/i.test(evtStr)) || details.topic === 'fire_savior'){
      formIdentityTag(v, 'fire_savior', { salience, source: 'saving_village_from_fire' });
    } else if(/betray|betrayal|theft_from_friend/i.test(evtStr) || details.topic === 'betrayed'){
      formIdentityTag(v, 'betrayed', { salience, source: 'betrayal' });
    } else if(/master/i.test(evtStr) || (details && details.topic && details.topic.startsWith('master_'))){
      let sk = (content && content.skill) || (details && details.skill) || '';
      if(!sk){
        if(/farmer|farming/i.test(evtStr)) sk = 'farmer';
        else if(/craftsman|building|crafting|tailor/i.test(evtStr)) sk = 'craftsman';
        else sk = 'craftsman';
      }
      if(sk === 'farming') sk = 'farmer';
      if(sk === 'building' || sk === 'crafting' || sk === 'tailoring') sk = 'craftsman';
      formIdentityTag(v, 'master_' + sk, { salience, source: 'master_' + sk });
    } else if(/pip/i.test(evtStr) && (/mother|parent|birth|protect/i.test(evtStr) || details.topic === 'pips_mother')){
      formIdentityTag(v, 'pips_mother', { salience, source: 'pips_mother', biasCoeff: 5.0 });
    } else if(/protector|repel|defend|village_protect|repelled_wolf|rescued_villager/i.test(evtStr) || details.topic === 'village_protector'){
      formIdentityTag(v, 'village_protector', { salience, source: 'defending_village' });
    }
  }
  const now = details.when != null ? details.when : ((typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0);
  const where = details.where || ((v.x != null && v.y != null) ? { x: Math.round(v.x), y: Math.round(v.y) } : null);
  const who = details.who || null;
  const ev = details.evidence ? (Array.isArray(details.evidence) ? details.evidence.slice() : [details.evidence])
                             : (source === 'direct' ? ['Direct observation'] : []);

  const mem = {
    id: nextEpistemicId('mem'),
    kind: details.kind || 'observation',
    topic: topic,
    content: cloneContent(content),
    who: who,
    where: where,
    when: now,
    confidence: +conf.toFixed(4),
    salience: +salience.toFixed(4),
    evidence: ev,
    source: source,
    createdAt: now,
    lastReinforced: now,
    superseded: false,
    supersededBy: null
  };

  // Dedupe (opt-in via details.dedupeWindowH): an equivalent observation
  // recorded recently reinforces the belief without pushing a new memory entry.
  // Skipped for explicit conflict requests (details.conflicts === true).
  let dedupeHit = null;
  const dedupeH = details.dedupeWindowH != null ? +details.dedupeWindowH : 0;
  if(dedupeH > 0 && details.conflicts !== true){
    dedupeHit = findRecentEquivalentMemory(v, topic, source, mem.content, now, dedupeH);
  }
  if(!dedupeHit){
    v.epistemic.memories.push(mem);
    if(v.epistemic.memories.length > 120){
      v.epistemic.memories.shift();
    }
  }

  // Active belief update / supersede
  const oldBelief = v.epistemic.beliefs[topic];
  if(oldBelief && !oldBelief.superseded){
    const hasConflict = details.conflicts === true || isContentConflicting(oldBelief.content, mem.content);
    if(hasConflict){
      oldBelief.superseded = true;
      oldBelief.supersededBy = mem.id;
      const oldMem = v.epistemic.memories.find(m => m.id === oldBelief.id);
      if(oldMem){
        oldMem.superseded = true;
        oldMem.supersededBy = mem.id;
      }
      v.epistemic.beliefs[topic] = beliefFromMemory(mem);
    } else {
      oldBelief.confidence = Math.min(1.0, +(oldBelief.confidence + 0.1).toFixed(4));
      oldBelief.lastReinforced = now;
      if(ev.length) oldBelief.evidence.push(...ev);
      if(typeof mem.content === 'object' && mem.content !== null && typeof oldBelief.content === 'object' && oldBelief.content !== null){
        oldBelief.content = Object.assign(cloneContent(oldBelief.content) || {}, cloneContent(mem.content));
      }
    }
  } else {
    v.epistemic.beliefs[topic] = beliefFromMemory(mem);
  }

  // Ownership observation sync
  if(topic.startsWith('ownership_') || details.targetId || (content && content.owner)){
    const tId = details.targetId || topic.replace(/^ownership_/, '') || (content && content.targetId);
    if(tId){
      const own = getOrCreateOwnershipRecord(v, tId);
      const newOwner = (content && content.owner) || who;
      if(newOwner){
        if(conf >= 0.7){
          own.knownOwner = newOwner;
          own.suspectedOwner = newOwner;
          own.confidence = conf;
        } else {
          own.suspectedOwner = newOwner;
          own.confidence = conf;
        }
        if(ev.length) own.evidence.push(...ev);
      }
    }
  }

  // Phase 6A: Stash/Location observation anchors expectation
  if(topic && (topic.startsWith('stash_') || topic.startsWith('pile_') || (content && (content.kind === 'stash' || content.kind === 'pile')))){
    if(content && (content.wx != null || (where && where.x != null)) && !content.empty && content.status !== 'missing'){
      const wx = content.wx != null ? content.wx : Math.floor(where.x / CS);
      const wy = content.wy != null ? content.wy : Math.floor(where.y / CS);
      const subj = (topic.startsWith('stash_') || topic.startsWith('pile_')) ? topic : `stash_${wx}_${wy}`;
      setExpectation(v, {
        subject: subj,
        attribute: 'location',
        predictedValue: { wx, wy },
        confidence: mem.confidence,
        learnedTick: now,
        source: source
      });
    }
  }

  return mem;
}

function observeStash(v, stashKey, pos, details = {}){
  const topic = stashKey.startsWith('stash_') ? stashKey : `stash_${stashKey}`;
  const wx = pos.wx != null ? pos.wx : Math.floor((pos.x || 0) / CS);
  const wy = pos.wy != null ? pos.wy : Math.floor((pos.y || 0) / CS);
  const mem = observe(v, { kind: 'stash', wx, wy, items: pos.items }, Object.assign({ topic }, details));
  if(mem){
    setExpectation(v, {
      subject: topic,
      attribute: 'location',
      predictedValue: { wx, wy },
      confidence: mem.confidence,
      learnedTick: mem.when,
      source: details.source || 'direct'
    });
  }
  return mem;
}

function getBelief(v, topic){
  if(!v || !topic) return null;
  ensureEpistemic(v);
  const b = v.epistemic.beliefs[topic];
  if(!b || b.superseded) return null;
  if(b.confidence <= 0.05) return null;
  return b;
}

function knowsAbout(v, topic){
  const b = getBelief(v, topic);
  return Boolean(b && b.confidence >= 0.1 && !b.superseded);
}

function getOwnershipBelief(v, targetId){
  if(!v || !targetId) return null;
  ensureEpistemic(v);
  return v.epistemic.ownership[targetId] || null;
}

function recordOwnershipBelief(v, targetId, details){
  if(!v || !targetId) return null;
  ensureEpistemic(v);
  details = details || {};
  let record = v.epistemic.ownership[targetId];
  if(!record){
    record = {
      targetId: targetId,
      knownOwner: null,
      suspectedOwner: null,
      confidence: 0,
      evidence: [],
      claims: []
    };
    v.epistemic.ownership[targetId] = record;
  }
  if(details.knownOwner !== undefined) record.knownOwner = details.knownOwner;
  if(details.suspectedOwner !== undefined) record.suspectedOwner = details.suspectedOwner;
  if(details.confidence !== undefined) record.confidence = details.confidence;
  if(Array.isArray(details.evidence)) record.evidence.push(...details.evidence);
  if(Array.isArray(details.claims)) record.claims.push(...details.claims);

  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  const mem = {
    id: nextEpistemicId('mem'),
    kind: 'belief',
    topic: 'ownership_' + targetId,
    content: { targetId, knownOwner: record.knownOwner, suspectedOwner: record.suspectedOwner },
    who: record.knownOwner || record.suspectedOwner,
    where: null,
    when: now,
    confidence: record.confidence,
    salience: 0.7,
    evidence: (record.evidence || []).slice(),
    source: details.source || 'memory',
    createdAt: now,
    lastReinforced: now,
    superseded: false,
    supersededBy: null
  };
  v.epistemic.memories.push(mem);
  v.epistemic.beliefs['ownership_' + targetId] = beliefFromMemory(mem);
  return record;
}

/* =====================================================================
   PHASE 6A: EXPECTATION ENGINE (A2)
   Record: { subject, attribute, predictedValue, confidence, learnedTick, source }
   Rules:
     - match predictedValue: +confidence, 0 processing overhead
     - mismatch beyond threshold: SURPRISE = |actual - predicted| * confidence
       -> emotion tag -> update Epistemic Store -> call re-plan
   Strictly bounded to 3 groups (HARD STOP):
     (1) price: shop / inn prices
     (2) location: household furniture / stash location
     (3) presence: presence of family member / relative
   ===================================================================== */

const VALID_EXPECTATION_ATTRIBUTES = ['price', 'location', 'presence'];
const EXPECTATION_TTL_DAYS = 7; // Phase 6A B2: Expectations expire after 7 sim days

function setExpectation(v, exp){
  if(!v || !exp || !exp.subject || !exp.attribute) return null;
  // Hard stop: strictly 3 groups only
  if(!VALID_EXPECTATION_ATTRIBUTES.includes(exp.attribute)) return null;
  ensureEpistemic(v);
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0)/24) : 1.0;
  const record = {
    subject: exp.subject,
    attribute: exp.attribute,
    predictedValue: exp.predictedValue,
    confidence: exp.confidence != null ? +Number(exp.confidence).toFixed(4) : 0.8,
    learnedTick: exp.learnedTick != null ? exp.learnedTick : now,
    source: exp.source || 'direct'
  };
  const key = `${exp.subject}:${exp.attribute}`;
  v.epistemic.expectations[key] = record;
  return record;
}

function getExpectation(v, subject, attribute){
  if(!v || !subject || !attribute) return null;
  ensureEpistemic(v);
  const key = `${subject}:${attribute}`;
  if(v.epistemic.expectations[key]) return v.epistemic.expectations[key];
  if(attribute === 'location'){
    const stripped = subject.replace(/^stash_/, '');
    if(v.epistemic.expectations[`${stripped}:${attribute}`]) return v.epistemic.expectations[`${stripped}:${attribute}`];
    if(v.epistemic.expectations[`stash_${stripped}:${attribute}`]) return v.epistemic.expectations[`stash_${stripped}:${attribute}`];
  }
  return null;
}

function checkExpectation(v, subject, attribute, actualValue, context = {}){
  if(!v || !subject || !attribute) return { match: true, surprise: 0 };
  if(!VALID_EXPECTATION_ATTRIBUTES.includes(attribute)) return { match: true, surprise: 0 };
  ensureEpistemic(v);
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0)/24) : 1.0;
  let exp = getExpectation(v, subject, attribute);

  if(!exp){
    // Initial expectation anchor
    exp = setExpectation(v, {
      subject,
      attribute,
      predictedValue: actualValue,
      confidence: 0.8,
      learnedTick: now,
      source: context.source || 'direct'
    });
    return { match: true, surprise: 0, confidence: exp.confidence };
  }

  // 1. Group 1: Price (links systems/13b_economy.js)
  if(attribute === 'price'){
    const predPrice = Number(exp.predictedValue);
    const actPrice = Number(actualValue);
    const diff = Math.abs(actPrice - predPrice);
    // Shock threshold: deviation > 1 gold AND > 30% of predicted price, or diff >= 5
    const isShock = (diff > 1 && diff >= predPrice * 0.3) || diff >= 5;

    if(!isShock){
      // Perception matches prediction -> +confidence, costs 0 processing
      exp.confidence = Math.min(1.0, +(exp.confidence + 0.05).toFixed(4));
      return { match: true, surprise: 0, confidence: exp.confidence };
    }

    // Over threshold -> SURPRISE event = |actual − predicted| × confidence
    const surprise = +(diff * exp.confidence).toFixed(2);
    const emotionTag = actPrice > predPrice ? 'disappointed' : 'pleased';

    if(!v.emotions) v.emotions = [];
    v.emotions.push({ tag: emotionTag, intensity: surprise, when: now, subject });
    if(v.emotions.length > 20) v.emotions.shift();

    v.thoughts = v.thoughts || [];
    v.thoughts.push({
      text: actPrice > predPrice
        ? `Shocked by ${subject} price: wanted ${predPrice}g, seller demands ${actPrice}g!`
        : `Delighted! ${subject} is cheaper than expected: was ${predPrice}g, now ${actPrice}g!`,
      val: actPrice > predPrice ? -3 : 2
    });

    // Force-update Epistemic Store
    observe(v, { subject, attribute, oldPrice: predPrice, newPrice: actPrice, surprise, emotion: emotionTag }, {
      topic: `price_${subject}`,
      source: 'direct',
      confidence: 0.95,
      salience: Math.min(1.0, 0.5 + surprise * 0.1),
      conflicts: true,
      bypassAttention: true
    });

    exp.predictedValue = actPrice;
    exp.learnedTick = now;

    // Trigger re-plan
    v.replanNeeded = true;
    v.interrupted = true;
    v.lastSurprise = { subject, attribute, surprise, emotion: emotionTag, diff, when: now };

    return {
      match: false,
      surprise,
      emotion: emotionTag,
      diff,
      replan: true,
      predictedValue: predPrice,
      actualValue: actPrice
    };
  }

  // 2. Group 2: Location / Stash
  if(attribute === 'location'){
    const isMissing = actualValue == null || actualValue === false || (typeof actualValue === 'object' && (actualValue.empty || actualValue.status === 'missing'));
    if(!isMissing){
      exp.confidence = Math.min(1.0, +(exp.confidence + 0.05).toFixed(4));
      return { match: true, surprise: 0, confidence: exp.confidence };
    }

    // Stale stash expectation violation
    const surprise = +(1.0 * exp.confidence).toFixed(2);
    const emotionTag = 'confused';

    if(!v.emotions) v.emotions = [];
    v.emotions.push({ tag: emotionTag, intensity: surprise, when: now, subject });
    if(v.emotions.length > 20) v.emotions.shift();

    v.thoughts = v.thoughts || [];
    v.thoughts.push({ text: `Where is the ${subject}? It was supposed to be here!`, val: -3 });

    // Update epistemic store: supersede old belief keeping a history trace
    const topic = context.topic || `stash_${subject}`;
    const oldBelief = v.epistemic.beliefs[topic];
    const newMem = observe(v, { subject, attribute, status: 'missing', empty: true, surprise }, {
      topic,
      source: 'direct',
      confidence: 0.95,
      salience: 0.8,
      conflicts: true,
      bypassAttention: true
    });

    exp.predictedValue = null;
    exp.learnedTick = now;

    v.replanNeeded = true;
    v.interrupted = true;
    v.lastSurprise = {
      subject,
      attribute,
      surprise,
      emotion: emotionTag,
      when: now,
      supersededBeliefId: oldBelief ? oldBelief.id : null
    };

    return { match: false, surprise, emotion: emotionTag, replan: true, newMemory: newMem };
  }

  // 3. Group 3: Presence (presence of kin)
  if(attribute === 'presence'){
    const predPresence = Boolean(exp.predictedValue);
    const actPresence = Boolean(actualValue);

    if(predPresence === actPresence){
      exp.confidence = Math.min(1.0, +(exp.confidence + 0.05).toFixed(4));
      return { match: true, surprise: 0, confidence: exp.confidence };
    }

    const surprise = +(1.0 * exp.confidence).toFixed(2);
    const emotionTag = (!actPresence && predPresence) ? 'worried' : 'surprised';

    if(!v.emotions) v.emotions = [];
    v.emotions.push({ tag: emotionTag, intensity: surprise, when: now, subject });
    if(v.emotions.length > 20) v.emotions.shift();

    v.thoughts = v.thoughts || [];
    v.thoughts.push({
      text: (!actPresence && predPresence) ? `Where is ${subject}? Expected them to be here!` : `Surprised to see ${subject}!`,
      val: (!actPresence && predPresence) ? -2 : 1
    });

    observe(v, { subject, attribute, expected: predPresence, actual: actPresence, surprise, emotion: emotionTag }, {
      topic: `presence_${subject}`,
      source: 'direct',
      confidence: 0.9,
      salience: 0.7,
      conflicts: true,
      bypassAttention: true
    });

    exp.predictedValue = actPresence;
    exp.learnedTick = now;

    v.replanNeeded = true;
    v.lastSurprise = { subject, attribute, surprise, emotion: emotionTag, when: now };

    return { match: false, surprise, emotion: emotionTag, replan: true };
  }

  return { match: true, surprise: 0 };
}

function checkPriceExpectation(v, itemKind, actualPrice){
  return checkExpectation(v, itemKind, 'price', actualPrice);
}

function checkStashExpectation(v, topicOrSubject, actualValue){
  const topic = topicOrSubject ? (topicOrSubject.startsWith('stash_') ? topicOrSubject : `stash_${topicOrSubject}`) : '';
  let exp = getExpectation(v, topicOrSubject, 'location');
  if(!exp && topic) exp = getExpectation(v, topic, 'location');
  if(!exp && v && v.epistemic && v.epistemic.expectations){
    const vx = Math.floor((v.x || 0) / CS), vy = Math.floor((v.y || 0) / CS);
    for(const k of Object.keys(v.epistemic.expectations)){
      const candidate = v.epistemic.expectations[k];
      if(candidate && candidate.attribute === 'location' && candidate.predictedValue){
        const pv = candidate.predictedValue;
        if(Math.abs(pv.wx - vx) <= 1 && Math.abs(pv.wy - vy) <= 1){
          exp = candidate;
          break;
        }
      }
    }
  }
  const subj = exp ? exp.subject : (topicOrSubject || 'stash');
  return checkExpectation(v, subj, 'location', actualValue, { topic: subj });
}

function checkPresenceExpectation(v, personName, actualPresence){
  return checkExpectation(v, personName, 'presence', actualPresence);
}

/* ---- Forgetting / Epistemic Decay ---- */

function decayEpistemic(v, dtDays){
  if(!v || dtDays <= 0) return;
  ensureEpistemic(v);
  const trait = getMemoryTrait(v);
  let traitMult = 1.0;
  if(trait === 'sharp') traitMult = 0.4;
  else if(trait === 'forgetful') traitMult = 2.5;
  /* production-1: memory-model wiring — a compiled per-character profile
     (sf/35_sf_memory.js, from memory/cast-profiles.md) refines the coarse
     trait: beta_episodic is the episodic decay rate, normed so archetype C
     (0.42) ~= 1.0, and forget_thresh replaces the flat 0.05 prune floor
     on memory records. */
  let memPrune = 0.05;
  if(v.memProfile){
    if(v.memProfile.beta_episodic != null)
      traitMult = v.memProfile.beta_episodic / 0.42;
    if(v.memProfile.forget_thresh != null)
      memPrune = v.memProfile.forget_thresh;
  }

  const baseDecay = 0.08 * dtDays;

  // 1. Decay memories
  const prunedMemories = [];
  for(const m of v.epistemic.memories){
    if(m.superseded){
      m.confidence = Math.max(0, +(m.confidence - baseDecay * traitMult * 1.5).toFixed(4));
      m.salience = Math.max(0, +(m.salience - baseDecay * 1.5).toFixed(4));
    } else {
      const salienceFactor = Math.max(0.2, 1.2 - (m.salience || 0.5));
      m.confidence = Math.max(0, +(m.confidence - baseDecay * traitMult * salienceFactor).toFixed(4));
      m.salience = Math.max(0, +(m.salience - baseDecay * 0.5).toFixed(4));
    }
    if(m.confidence > memPrune || m.salience > 0.05){
      prunedMemories.push(m);
    }
  }
  v.epistemic.memories = prunedMemories;

  // 2. Decay active beliefs
  for(const topic of Object.keys(v.epistemic.beliefs)){
    const b = v.epistemic.beliefs[topic];
    if(b.superseded){
      delete v.epistemic.beliefs[topic];
      continue;
    }
    const salienceFactor = Math.max(0.2, 1.2 - (b.salience || 0.5));
    b.confidence = Math.max(0, +(b.confidence - baseDecay * traitMult * salienceFactor).toFixed(4));
    b.salience = Math.max(0, +(b.salience - baseDecay * 0.5).toFixed(4));
    if(b.confidence <= 0.05){
      delete v.epistemic.beliefs[topic];
    }
  }

  // 3. Decay ownership beliefs
  for(const targetId of Object.keys(v.epistemic.ownership)){
    const o = v.epistemic.ownership[targetId];
    o.confidence = Math.max(0, +(o.confidence - baseDecay * traitMult).toFixed(4));
    if(o.confidence <= 0.05 && (!o.claims || o.claims.length === 0)){
      o.knownOwner = null;
    }
  }

  // 4. Decay and expire expectations (Phase 6A B2)
  if(v.epistemic.expectations){
    const nowDays = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0)/24) : 0;
    for(const key of Object.keys(v.epistemic.expectations)){
      const exp = v.epistemic.expectations[key];
      if(!exp) continue;
      let expired = false;
      if(exp.learnedTick != null){
        const ageDays = nowDays - exp.learnedTick;
        if(ageDays >= EXPECTATION_TTL_DAYS){
          expired = true;
        }
      }
      if(dtDays > 0){
        exp.ageDays = (exp.ageDays || 0) + dtDays;
        if(exp.ageDays >= EXPECTATION_TTL_DAYS){
          expired = true;
        }
        if(!expired){
          const decayAmount = (dtDays / EXPECTATION_TTL_DAYS) * traitMult;
          exp.confidence = Math.max(0, +(exp.confidence - decayAmount).toFixed(4));
          if(exp.confidence <= 0.05){
            expired = true;
          }
        }
      }
      if(expired){
        exp.confidence = 0;
        exp.expired = true;
        delete v.epistemic.expectations[key];
      }
    }
  }
}

function epistemicTick(v, dtH){
  if(!v || v.dead) return;
  const dtDays = dtH / 24;
  decayEpistemic(v, dtDays);
}

/* ---- Teaching Mechanics ---- */

function teach(teacher, student, topic){
  if(!teacher || !student) return { ok: false, reason: 'missing participants' };
  if(!isConscious(teacher) || !isConscious(student)){
    return { ok: false, reason: 'unconscious' };
  }

  if(typeof distCells === 'function' && teacher.x != null && student.x != null){
    const dc = distCells(teacher, student);
    if(dc > 4) return { ok: false, reason: 'too far' };
  }

  ensureEpistemic(teacher);
  ensureEpistemic(student);

  let tBelief = getBelief(teacher, topic);
  if(!tBelief){
    const m = teacher.epistemic.memories.find(x => x.topic === topic && !x.superseded);
    if(m) tBelief = m;
  }
  if(!tBelief || tBelief.confidence <= 0.1){
    return { ok: false, reason: 'teacher does not know topic' };
  }

  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  const learnBonus = (student && (student.stage === 'child' || student.stage === 'youth')) ? 1.15 : 1.0;
  const studentConf = +Math.min(0.95, tBelief.confidence * 0.75 * learnBonus).toFixed(4);
  const studentSalience = +Math.min(1.0, tBelief.salience * 0.85 * learnBonus).toFixed(4);

  const mem = {
    id: nextEpistemicId('mem'),
    kind: 'taught',
    topic: topic,
    content: cloneContent(tBelief.content),
    who: teacher.name,
    where: (student.x != null && student.y != null) ? { x: Math.round(student.x), y: Math.round(student.y) } : null,
    when: now,
    confidence: studentConf,
    salience: studentSalience,
    evidence: ['Taught by ' + teacher.name, ...(tBelief.evidence || [])],
    source: 'hearsay',
    createdAt: now,
    lastReinforced: now,
    superseded: false,
    supersededBy: null
  };

  const oldBelief = student.epistemic.beliefs[topic];
  if(oldBelief && !oldBelief.superseded){
    if(isContentConflicting(oldBelief.content, tBelief.content)){
      oldBelief.superseded = true;
      oldBelief.supersededBy = mem.id;
      const oldMem = student.epistemic.memories.find(m => m.id === oldBelief.id);
      if(oldMem){
        oldMem.superseded = true;
        oldMem.supersededBy = mem.id;
      }
    }
  }

  student.epistemic.memories.push(mem);
  student.epistemic.beliefs[topic] = beliefFromMemory(mem);

  // If topic is ownership, record belief in student's ownership structure
  if(topic.startsWith('ownership_')){
    const targetId = topic.replace(/^ownership_/, '');
    if(targetId){
      const own = getOrCreateOwnershipRecord(student, targetId);
      const taughtOwner = tBelief.content && (tBelief.content.owner || tBelief.content.knownOwner || tBelief.who);
      if(taughtOwner){
        own.suspectedOwner = taughtOwner;
        own.confidence = Math.min(0.6, studentConf);
        own.evidence.push('Taught by ' + teacher.name);
      }
    }
  }

  if(typeof addBond === 'function') addBond(teacher, student, 0.04);
  if(typeof witnessEvent === 'function'){
    witnessEvent(student, teacher.name + ' taught about ' + topic);
    witnessEvent(teacher, 'Taught ' + student.name + ' about ' + topic);
  }

  return { ok: true, memory: mem };
}

function doTeachStep(v, step, dtH){
  if(v.dead || v.downed || v.state === 'sleep') return true;
  const student = typeof findPerson === 'function' ? findPerson(step.target || step.to) : null;
  if(!student){
    v.thoughts = [{ text: "Can't find who to teach", val: -1 }];
    return true;
  }
  if(!isConscious(student)){
    v.thoughts = [{ text: student.name + " is asleep or unconscious", val: -1 }];
    return true;
  }
  const dc = distCells(v, student);
  if(dc > 4){
    const r = planMoveToward(v, student.x, student.y, dtH);
    if(r === 'stuck'){
      v.thoughts = [{ text: "Can't reach " + student.name, val: -1 }];
      return true;
    }
    return false;
  }
  v.state = 'chat';
  v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog < 0.2) return false;

  const res = teach(v, student, step.topic);
  if(res.ok){
    v.thoughts = [{ text: "Taught " + student.name + " about " + step.topic, val: 2 }];
  } else {
    v.thoughts = [{ text: "Could not teach " + student.name + ": " + res.reason, val: -1 }];
  }
  v.state = 'idle';
  return true;
}

/* ---- Ownership Claims Mechanics ---- */

function claimOwnership(claimant, targetId, details){
  if(!claimant || !targetId) return { ok: false, reason: 'missing claimant or target' };
  ensureEpistemic(claimant);
  details = details || {};
  const now = (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;

  // NOTE: Building.owner from 2B stays WORLD TRUTH (actualOwner).
  // Claiming does NOT alter actualOwner!
  const cMem = {
    id: nextEpistemicId('claim'),
    kind: 'claim',
    topic: 'ownership_' + targetId,
    content: { targetId: targetId, claimant: claimant.name, text: details.text || ('Claimed ' + targetId) },
    who: claimant.name,
    where: (claimant.x != null && claimant.y != null) ? { x: Math.round(claimant.x), y: Math.round(claimant.y) } : null,
    when: now,
    confidence: 1.0,
    salience: 0.9,
    evidence: [details.text || ('Self-declared ownership claim for ' + targetId)],
    source: 'claim',
    createdAt: now,
    lastReinforced: now,
    superseded: false,
    supersededBy: null
  };
  claimant.epistemic.memories.push(cMem);
  claimant.epistemic.beliefs['ownership_' + targetId] = beliefFromMemory(cMem);

  const cOwn = getOrCreateOwnershipRecord(claimant, targetId);
  cOwn.claims.push({ claimant: claimant.name, when: now, text: details.text || 'Self claim' });
  cOwn.suspectedOwner = claimant.name;
  cOwn.knownOwner = claimant.name;
  cOwn.confidence = 0.95;
  cOwn.evidence.push('Claimed ' + targetId);

  // Witnessing by nearby conscious villagers
  if(typeof VILLAGERS !== 'undefined' && Array.isArray(VILLAGERS)){
    for(const o of VILLAGERS){
      if(o === claimant || o.dead || o.downed || o.state === 'sleep') continue;
      let inRange = true;
      if(typeof distCells === 'function' && claimant.x != null && o.x != null){
        inRange = distCells(o, claimant) <= 12;
      }
      if(inRange){
        ensureEpistemic(o);
        const wMem = {
          id: nextEpistemicId('claim'),
          kind: 'claim',
          topic: 'ownership_' + targetId,
          content: { targetId: targetId, claimant: claimant.name, text: details.text || ('Claimed ' + targetId) },
          who: claimant.name,
          where: (claimant.x != null && claimant.y != null) ? { x: Math.round(claimant.x), y: Math.round(claimant.y) } : null,
          when: now,
          confidence: 0.4,
          salience: 0.6,
          evidence: ['Heard ' + claimant.name + ' claim ' + targetId],
          source: 'hearsay',
          createdAt: now,
          lastReinforced: now,
          superseded: false,
          supersededBy: null
        };
        o.epistemic.memories.push(wMem);
        const oOwn = getOrCreateOwnershipRecord(o, targetId);
        oOwn.claims.push({ claimant: claimant.name, when: now, text: details.text || ('Claim by ' + claimant.name) });
        oOwn.evidence.push('Witnessed claim by ' + claimant.name);
        if(!oOwn.knownOwner){
          oOwn.suspectedOwner = claimant.name;
          oOwn.confidence = 0.35;
        }
        if(typeof witnessEvent === 'function'){
          witnessEvent(o, claimant.name + ' claimed ' + targetId);
        }
      }
    }
  }

  if(typeof witnessEvent === 'function'){
    witnessEvent(claimant, 'Claimed ' + targetId);
  }

  return { ok: true, claim: cMem };
}

function doClaimStep(v, step, dtH){
  if(v.dead || v.downed) return true;
  v.state = 'chat';
  v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog < 0.1) return false;

  const target = step.target || step.what || 'property';
  claimOwnership(v, target, { text: step.text || ('I claim ' + target) });
  v.thoughts = [{ text: "Claimed " + target, val: 2 }];
  v.state = 'idle';
  return true;
}

/* ---- Registration & Wiring ---- */

if(typeof VERBS !== 'undefined'){
  if(VERBS.indexOf('teach') === -1) VERBS.push('teach');
  if(VERBS.indexOf('claim') === -1) VERBS.push('claim');
}

const __pfvKnowledge = planForVerb;
planForVerb = function(v, action){
  const A = action || {};
  if(A.kind === 'teach'){
    const target = typeof findPerson === 'function' ? findPerson(A.target || A.to) : null;
    if(!target) return { ok: false, reason: 'person not found' };
    const topic = A.topic;
    if(!topic || !knowsAbout(v, topic)){
      return { ok: false, reason: 'unknown topic' };
    }
    return {
      ok: true,
      steps: [
        { verb: 'go', person: target.name, targetKey: 'person_' + target.name },
        { verb: 'teach', target: target.name, topic: topic }
      ]
    };
  }
  if(A.kind === 'claim'){
    const target = A.target || A.what;
    if(!target) return { ok: false, reason: 'no target to claim' };
    return {
      ok: true,
      steps: [
        { verb: 'claim', target: target, text: A.text }
      ]
    };
  }
  return __pfvKnowledge(v, action);
};

const __ptKnowledge = planTick;
planTick = function(v, dtH){
  const step = v.plan && v.plan[0];
  if(step){
    if(step.verb === 'teach'){
      const done = doTeachStep(v, step, dtH);
      step.t = (step.t || 0) + dtH;
      if(done) v.plan.shift();
      return;
    }
    if(step.verb === 'claim'){
      const done = doClaimStep(v, step, dtH);
      step.t = (step.t || 0) + dtH;
      if(done) v.plan.shift();
      return;
    }
    __ptKnowledge(v, dtH);
    return;
  }
  __ptKnowledge(v, dtH);
};

if(typeof INTENT_PATTERNS !== 'undefined' && Array.isArray(INTENT_PATTERNS)){
  INTENT_PATTERNS.unshift(
    { re: /\bteach\s+(\w+)\s+about\s+(.+)/i,
      plan: (m) => {
        const person = capName(m[1]);
        const topic = m[2].trim();
        return [{ verb: 'go', person: person }, { verb: 'teach', target: person, topic: topic }];
      }
    },
    { re: /\btell\s+(\w+)\s+about\s+(.+)/i,
      plan: (m) => {
        const person = capName(m[1]);
        const topic = m[2].trim();
        return [{ verb: 'go', person: person }, { verb: 'teach', target: person, topic: topic }];
      }
    },
    { re: /\bclaim\s+(?:the\s+)?(.+)/i,
      plan: (m) => [{ verb: 'claim', target: m[1].trim() }]
    }
  );
}

/* Hook initVillagers */
const __baseInitVillagersKnowledge = initVillagers;
initVillagers = function(){
  __baseInitVillagersKnowledge();
  for(const v of VILLAGERS){
    ensureEpistemic(v);
  }
};

/* Hook bodyTick */
const __baseBodyTickKnowledge = bodyTick;
bodyTick = function(v, dtH){
  __baseBodyTickKnowledge(v, dtH);
  if(v && !v.dead){
    epistemicTick(v, dtH);
  }
};

/* Hook witnessEvent */
const __baseWitnessEventKnowledge = witnessEvent;
witnessEvent = function(v, text){
  __baseWitnessEventKnowledge(v, text);
  if(v && !v.dead && typeof observe === 'function'){
    observe(v, text, {
      topic: 'event_' + ((v.events && v.events.length) || 0),
      source: 'direct',
      confidence: 0.9,
      salience: 0.6,
      bypassAttention: true
    });
  }
};

/* __aiBridge inspection helpers */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.getBeliefs = function(name){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? (v.epistemic ? v.epistemic.beliefs : {}) : null;
  };
  window.__aiBridge.getOwnershipBeliefs = function(name){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? (v.epistemic ? v.epistemic.ownership : {}) : null;
  };
  window.__aiBridge.getMemories = function(name){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? (v.epistemic ? v.epistemic.memories : []) : null;
  };
  window.__aiBridge.observe = function(name, content, details){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? observe(v, content, details) : null;
  };
  window.__aiBridge.teach = function(teacherName, studentName, topic){
    const t = VILLAGERS.find(p => p.name === teacherName);
    const s = VILLAGERS.find(p => p.name === studentName);
    return teach(t, s, topic);
  };
  window.__aiBridge.claim = function(claimantName, targetId, text){
    const c = VILLAGERS.find(p => p.name === claimantName);
    return c ? claimOwnership(c, targetId, { text }) : null;
  };
  window.__aiBridge.getExpectations = function(name){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? (v.epistemic ? v.epistemic.expectations : {}) : null;
  };
  window.__aiBridge.setExpectation = function(name, exp){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? setExpectation(v, exp) : null;
  };
  window.__aiBridge.checkExpectation = function(name, subject, attribute, actualValue){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? checkExpectation(v, subject, attribute, actualValue) : null;
  };
  window.__aiBridge.checkStashExpectation = function(name, topicOrSubject, actualValue){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? checkStashExpectation(v, topicOrSubject, actualValue) : null;
  };
  window.__aiBridge.observeStash = function(name, stashKey, pos){
    const v = VILLAGERS.find(p => p.name === name);
    return v ? observeStash(v, stashKey, pos) : null;
  };
}
