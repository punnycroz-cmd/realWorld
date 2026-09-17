/* =====================================================================
   PART 29A: CUSTOMARY COURT (TÒA ÁN PHONG TỤC) — SPEC Phase 7A
   Institutional customary court replacing automatic proto-norm punishments.
   
   Principles:
   - Belief ≠ truth: Testimonies are belief tuples {claim, suspect, source, confidence}
     governed by fidelity traits and memory, NOT omniscient ground truth.
   - Local belief: ONLY villagers who actually perceived the event via senses
     (proximity / consciousness) or hold direct epistemic memories can testify.
   - Material conservation: Restitution transfers real physical goods / currency.
   - Presiding Elder: Eldest living adult non-party, tie-broken by social reputation.
   - Verdicts: Restitution (primary), public labor (fallback/debt), exile (severe/recidivism).
   - Reputation pipeline integration: Verdicts recorded as decaying reputation reasons.
   - Emergent narrative: Wrongful convictions produce real grievances and retaliations.
   ===================================================================== */

const COURT_RECORDS = [];
const COURT_VERDICT_DECAY = 0.95;

function getVillagerReputation(v){
  if(!v) return 0.5;
  const name = typeof v === 'object' ? v.name : v;
  let totalTrust = 0;
  let count = 0;
  if(typeof VILLAGERS !== 'undefined' && Array.isArray(VILLAGERS)){
    for(const other of VILLAGERS){
      if(other.dead || other.name === name) continue;
      if(typeof calculateTrust === 'function'){
        totalTrust += calculateTrust(other, name);
        count++;
      }
    }
  }
  return count > 0 ? +(totalTrust / count).toFixed(4) : 0.5;
}

function hasPriorTheftOrVerdict(targetName){
  if(!targetName) return false;
  const tName = typeof targetName === 'object' ? targetName.name : targetName;
  if(typeof VILLAGERS !== 'undefined' && Array.isArray(VILLAGERS)){
    for(const vill of VILLAGERS){
      if(!vill || !vill.reputationReasons) continue;
      const reasons = vill.reputationReasons[tName];
      if(Array.isArray(reasons)){
        for(const r of reasons){
          if(!r) continue;
          if(r.kind === 'court-verdict' || r.kind === 'theft-witnessed' || r.kind === 'theft' || (r.protoNorm === 'theft' && r.kind !== 'court-acquittal')){
            return true;
          }
        }
      }
    }
  }
  return false;
}

function selectPresidingElder(hearing){
  const excludeNames = new Set();
  if(hearing.plaintiffName) excludeNames.add(hearing.plaintiffName);
  if(hearing.defendantName) excludeNames.add(hearing.defendantName);
  if(hearing.witnessNames && Array.isArray(hearing.witnessNames)){
    for(const wn of hearing.witnessNames) excludeNames.add(wn);
  }

  let eligible = [];
  if(typeof VILLAGERS !== 'undefined' && Array.isArray(VILLAGERS)){
    eligible = VILLAGERS.filter(v => {
      if(!v || v.dead || v.downed || v.outsider) return false;
      if(excludeNames.has(v.name)) return false;
      const isAdult = v.adult || v.stage === 'elder' || (v.ageY != null && v.ageY >= 18) || (!v.stage || v.stage === 'adult');
      return Boolean(isAdult);
    });
  }

  // Fallback if all adults were witnesses: elder can judge witnesses, but never parties
  if(!eligible.length && typeof VILLAGERS !== 'undefined' && Array.isArray(VILLAGERS)){
    eligible = VILLAGERS.filter(v => {
      if(!v || v.dead || v.downed || v.outsider) return false;
      if(v.name === hearing.plaintiffName || v.name === hearing.defendantName) return false;
      const isAdult = v.adult || v.stage === 'elder' || (v.ageY != null && v.ageY >= 18) || (!v.stage || v.stage === 'adult');
      return Boolean(isAdult);
    });
  }

  if(!eligible.length) return null;

  // Sort by: 1) age descending, 2) social reputation descending, 3) deterministic name
  eligible.sort((a, b) => {
    const ageA = a.ageY || (a.stage === 'elder' ? 65 : 30);
    const ageB = b.ageY || (b.stage === 'elder' ? 65 : 30);
    if(ageB !== ageA) return ageB - ageA;

    const repA = getVillagerReputation(a);
    const repB = getVillagerReputation(b);
    if(Math.abs(repB - repA) > 1e-5) return repB - repA;

    return (a.name || '').localeCompare(b.name || '');
  });

  return eligible[0];
}

function isEligibleWitness(villager, hearing){
  if(!villager || villager.dead || villager.downed){
    return { eligible: false, reason: 'unconscious or dead' };
  }
  if(villager.name === hearing.plaintiffName || villager.name === hearing.defendantName){
    return { eligible: false, reason: 'party to case' };
  }
  if(typeof isConscious === 'function' && !isConscious(villager)){
    return { eligible: false, reason: 'unconscious' };
  }

  // 1. Local sensory check: was witness physically near event location when it occurred?
  let wasPhysicallyPresent = false;
  if(hearing.eventLocation && villager.x != null && villager.y != null){
    const cs = (typeof CS !== 'undefined') ? CS : 32;
    const dist = Math.hypot(villager.x - hearing.eventLocation.x, villager.y - hearing.eventLocation.y) / cs;
    if(dist <= 12){
      wasPhysicallyPresent = true;
    }
  }

  // 2. Epistemic memory check: does witness have an active direct memory of this event?
  let relevantMemory = null;
  if(villager.epistemic && Array.isArray(villager.epistemic.memories)){
    for(let i = villager.epistemic.memories.length - 1; i >= 0; i--){
      const m = villager.epistemic.memories[i];
      if(m.superseded) continue;
      const matchItem = hearing.itemId && (m.topic === 'theft_' + hearing.itemId || (m.content && m.content.targetId === hearing.itemId));
      const matchNorm = hearing.protoNorm && (m.topic === 'norm_' + hearing.protoNorm || (m.content && m.content.event === hearing.protoNorm) || (m.topic && m.topic.startsWith(hearing.protoNorm)));
      const matchTopic = hearing.topic && m.topic === hearing.topic;
      if(matchItem || matchNorm || matchTopic){
        if(m.source === 'direct' || m.source === 'memory'){
          relevantMemory = m;
          break;
        }
      }
    }
  }

  // Negative control (SPEC 3d): A witness without local perception or memory CANNOT testify
  if(!wasPhysicallyPresent && !relevantMemory){
    return { eligible: false, reason: 'no local sensory perception or memory of event' };
  }

  return { eligible: true, memory: relevantMemory, wasPhysicallyPresent };
}

function gatherCourtWitnesses(hearing){
  const eligibleWitnesses = [];
  if(typeof VILLAGERS !== 'undefined' && Array.isArray(VILLAGERS)){
    for(const v of VILLAGERS){
      const res = isEligibleWitness(v, hearing);
      if(res.eligible){
        eligibleWitnesses.push({ villager: v, memory: res.memory, wasPresent: res.wasPhysicallyPresent });
      }
    }
  }
  return eligibleWitnesses;
}

function produceTestimony(witness, hearing, witnessRecord){
  const mem = witnessRecord && witnessRecord.memory;
  let accused = hearing.defendantName;
  let claim = hearing.protoNorm || 'theft';
  let source = (mem && mem.source) || 'direct';
  let conf = (mem && mem.confidence != null) ? mem.confidence : 0.95;
  const fidelity = (witness.fidelity != null) ? witness.fidelity : 1.0;

  // If memory has explicit content regarding who committed it
  if(mem && mem.content){
    if(mem.content.mistakenWho) accused = mem.content.mistakenWho;
    else if(mem.content.suspect) accused = mem.content.suspect;
    else if(mem.content.thief) accused = mem.content.thief;
  }

  // Witness mistaken identity property (fidelity trait / memory distortion)
  if(witness.mistakenSuspect){
    accused = witness.mistakenSuspect;
  }

  // Tuple representation: { claim, suspect, source, confidence, fidelity }
  return {
    witnessName: witness.name,
    claim: claim,
    accused: accused,
    source: source,
    confidence: +conf.toFixed(3),
    fidelity: +fidelity.toFixed(3),
    testimonyText: `I saw ${accused} commit ${claim}`
  };
}

function holdCourtHearing(params){
  params = params || {};
  const plaintiff = typeof params.plaintiff === 'object' ? params.plaintiff : (typeof findPersonSafe === 'function' ? findPersonSafe(params.plaintiff) : null);
  const defendant = typeof params.defendant === 'object' ? params.defendant : (typeof findPersonSafe === 'function' ? findPersonSafe(params.defendant) : null);
  
  if(!plaintiff || !defendant){
    return { ok: false, reason: 'missing plaintiff or defendant' };
  }

  const now = (typeof W !== 'undefined' && W && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  const hearingId = 'court_' + Math.floor(now) + '_' + plaintiff.name + '_' + defendant.name;

  const hearingContext = {
    id: hearingId,
    protoNorm: params.protoNorm || 'theft',
    plaintiffName: plaintiff.name,
    defendantName: defendant.name,
    itemId: params.itemId || (params.item && params.item.id) || null,
    itemLabel: params.itemLabel || (params.item && params.item.label) || 'goods',
    lossValue: params.lossValue || 10,
    topic: params.topic || (params.itemId ? 'theft_' + params.itemId : 'norm_' + (params.protoNorm || 'theft')),
    eventLocation: params.eventLocation || { x: plaintiff.x, y: plaintiff.y },
    actualOffender: params.actualOffender || null,
    stolenItem: params.item || null
  };

  // 1. Select presiding elder
  let elder = params.presidingElder || selectPresidingElder(hearingContext);
  if(!elder){
    elder = plaintiff; // absolute edge fallback if village has no other inhabitants
  }

  // 2. Gather eligible witnesses via local belief check
  const candidateWitnesses = (params.witnesses && Array.isArray(params.witnesses))
    ? params.witnesses.map(w => {
        const v = typeof w === 'object' ? w : (typeof findPersonSafe === 'function' ? findPersonSafe(w) : null);
        const el = isEligibleWitness(v, hearingContext);
        return el.eligible ? { villager: v, memory: el.memory, wasPresent: el.wasPhysicallyPresent } : null;
      }).filter(Boolean)
    : gatherCourtWitnesses(hearingContext);

  // 3. Hear testimonies
  const testimonies = [];
  let prosecutionWeight = 0;
  let falseWitnesses = [];

  for(const cw of candidateWitnesses){
    const t = produceTestimony(cw.villager, hearingContext, cw);
    if(!t) continue;
    testimonies.push(t);

    const witnessRep = getVillagerReputation(cw.villager);
    const credibility = (t.source === 'direct' ? 1.0 : 0.6) * t.confidence * t.fidelity * (0.5 + witnessRep * 0.5);

    if(t.accused === defendant.name){
      prosecutionWeight += credibility;
      // If defendant is innocent, record this witness as testifying falsely
      if(hearingContext.actualOffender && hearingContext.actualOffender !== defendant.name){
        falseWitnesses.push(cw.villager);
      }
    }
  }

  // Defense plea
  const defensePlea = params.defendantPlea || (hearingContext.actualOffender === defendant.name ? 'admission' : 'denial');
  // 4. Elder deliberation
  // Direct eyewitness testimony outweighs bare uncorroborated denial
  const convictionThreshold = (defensePlea === 'admission') ? 0.3
                            : (defensePlea === 'denial') ? 0.6
                            : 0.5;
  const isGuilty = prosecutionWeight >= convictionThreshold;
  let verdictType = 'acquittal';
  let sentence = null;

  if(isGuilty){
    // Determine appropriate customary sanction:
    // Restitution (if material recompense possible) -> Public Labor -> Exile
    const hasItem = Boolean(hearingContext.stolenItem && hearingContext.stolenItem.currentHolder === defendant.name);
    const defendantGold = defendant.gold || 0;
    const preferExile = (params.preferExile != null) ? Boolean(params.preferExile) : hasPriorTheftOrVerdict(defendant.name);

    if(hasItem || defendantGold >= hearingContext.lossValue){
      verdictType = 'restitution';
      sentence = { type: 'restitution', gold: Math.min(defendantGold, hearingContext.lossValue), returnItem: hasItem };
    } else if(preferExile || prosecutionWeight >= 2.0){
      verdictType = 'exile';
      sentence = { type: 'exile', durationDays: 7 };
    } else {
      verdictType = 'public_labor';
      sentence = { type: 'public_labor', durationDays: 3 };
    }
  }

  const outcome = {
    hearingId: hearingId,
    day: Math.floor(now),
    elder: elder.name,
    plaintiff: plaintiff.name,
    defendant: defendant.name,
    protoNorm: hearingContext.protoNorm,
    testimonies: testimonies,
    prosecutionWeight: +prosecutionWeight.toFixed(3),
    defensePlea: defensePlea,
    verdict: verdictType,
    sentence: sentence,
    isGuilty: isGuilty,
    wasWrongfulConviction: Boolean(isGuilty && hearingContext.actualOffender && hearingContext.actualOffender !== defendant.name)
  };

  // 5. Execute verdict and reputation consequences
  executeCourtVerdict(hearingContext, elder, plaintiff, defendant, outcome, falseWitnesses);

  COURT_RECORDS.push(outcome);
  return outcome;
}

function executeCourtVerdict(hearing, elder, plaintiff, defendant, outcome, falseWitnesses){
  const now = (typeof W !== 'undefined' && W && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;

  if(outcome.isGuilty){
    // A. Material Restitution (conservation of matter: real transfer, no void spawning)
    if(outcome.verdict === 'restitution' && outcome.sentence){
      if(outcome.sentence.returnItem && hearing.stolenItem){
        if(typeof recordTransfer === 'function'){
          recordTransfer(hearing.stolenItem.id, 'recover', {
            from: defendant.name,
            to: plaintiff.name,
            by: elder.name,
            context: 'court restitution ordered by ' + elder.name
          });
        }
        hearing.stolenItem.currentHolder = plaintiff.name;
        hearing.stolenItem.holderType = 'villager';
      }
      if(outcome.sentence.gold > 0){
        const pay = Math.min(defendant.gold || 0, outcome.sentence.gold);
        defendant.gold = (defendant.gold || 0) - pay;
        plaintiff.gold = (plaintiff.gold || 0) + pay;
      }
    } else if(outcome.verdict === 'exile'){
      if(typeof setOstracism === 'function'){
        setOstracism(defendant.name, outcome.sentence.durationDays || 7, elder);
      }
    } else if(outcome.verdict === 'public_labor'){
      defendant.courtSentence = {
        type: 'public_labor',
        daysRemaining: outcome.sentence.durationDays || 3,
        assignedBy: elder.name
      };
    }

    // B. Record verdict into reputation reasons with decay
    if(typeof addReputationReason === 'function'){
      // Elder records court-verdict
      addReputationReason(elder, defendant.name, {
        kind: 'court-verdict',
        by: defendant.name,
        day: Math.floor(now),
        weight: -0.85,
        source: 'court',
        confidence: 0.95,
        decay: COURT_VERDICT_DECAY,
        verdict: outcome.verdict,
        protoNorm: hearing.protoNorm
      });

      // Plaintiff records satisfaction / verdict
      addReputationReason(plaintiff, defendant.name, {
        kind: 'court-verdict',
        by: defendant.name,
        day: Math.floor(now),
        weight: -0.90,
        source: 'court',
        confidence: 1.0,
        decay: COURT_VERDICT_DECAY,
        verdict: outcome.verdict
      });

      // Attendees also record decaying reason
      for(const t of outcome.testimonies){
        const wit = typeof findPersonSafe === 'function' ? findPersonSafe(t.witnessName) : null;
        if(wit && wit !== defendant){
          addReputationReason(wit, defendant.name, {
            kind: 'court-verdict',
            by: defendant.name,
            day: Math.floor(now),
            weight: -0.75,
            source: 'court',
            confidence: 0.90,
            decay: COURT_VERDICT_DECAY
          });
        }
      }
    }

    // C. Bond and thought impact
    if(typeof addBond === 'function'){
      addBond(plaintiff, defendant, -0.35);
      addBond(elder, defendant, -0.15);
    }
    defendant.thoughts = [{ text: `Sentenced by customary court to ${outcome.verdict}!`, val: -4 }];

    // D. WRONGFUL CONVICTION: If innocent defendant was convicted due to false testimony,
    // generate long-lasting grievance reason with decay and downstream retaliation!
    if(outcome.wasWrongfulConviction && falseWitnesses && falseWitnesses.length > 0){
      for(const fw of falseWitnesses){
        triggerWrongfulConvictionGrievance(defendant, fw, hearing, outcome);
      }
    }
  } else {
    // Acquittal
    if(typeof addReputationReason === 'function'){
      addReputationReason(elder, defendant.name, {
        kind: 'court-acquittal',
        by: defendant.name,
        day: Math.floor(now),
        weight: 0.15,
        source: 'court',
        confidence: 0.9,
        decay: COURT_VERDICT_DECAY
      });
    }
    defendant.thoughts = [{ text: 'Acquitted by customary court!', val: 3 }];
  }

  if(typeof logEvent === 'function'){
    logEvent('court', `Customary court presided by ${elder.name}: ${defendant.name} ${outcome.isGuilty ? 'convicted (' + outcome.verdict + ')' : 'acquitted'}`);
  }
}

function triggerWrongfulConvictionGrievance(innocentVictim, falseWitness, hearing, outcome){
  if(!innocentVictim || !falseWitness || innocentVictim === falseWitness) return;
  const now = (typeof W !== 'undefined' && W && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;

  // 1. Long-decay grievance reputation reason against false witness
  if(typeof addReputationReason === 'function'){
    addReputationReason(innocentVictim, falseWitness.name, {
      kind: 'grievance_false_testimony',
      by: falseWitness.name,
      day: Math.floor(now),
      weight: -1.0,
      source: 'direct',
      confidence: 1.0,
      decay: 0.98, // Long-lasting burning grievance
      hearingId: outcome.hearingId,
      details: `Wrongfully sentenced to ${outcome.verdict} due to false testimony`
    });
  }

  // 2. Bond collapsed
  if(innocentVictim.bonds){
    innocentVictim.bonds[falseWitness.name] = 0.0;
  }

  // 3. Social friction: Grudge & Rivalry
  if(typeof addGrudge === 'function'){
    addGrudge(innocentVictim, falseWitness, 4);
  }
  if(typeof checkRivalry === 'function'){
    checkRivalry(innocentVictim, falseWitness);
  }

  // 4. Memory & Thought of injustice
  innocentVictim.thoughts = [{
    text: `Wrongfully convicted because of ${falseWitness.name}'s lies! I will have my revenge!`,
    val: -5
  }];

  if(typeof observe === 'function'){
    observe(innocentVictim, {
      event: 'wrongful_conviction',
      falseWitness: falseWitness.name,
      verdict: outcome.verdict
    }, {
      topic: 'grievance_' + falseWitness.name,
      source: 'direct',
      confidence: 1.0,
      salience: 0.98,
      evidence: [`Falsely accused and sentenced in court due to ${falseWitness.name}`]
    });
  }

  // 5. Trigger retaliatory action (insult or fight)
  retaliateAgainstWitness(innocentVictim, falseWitness);
}

function retaliateAgainstWitness(aggressor, target){
  if(!aggressor || !target || aggressor.dead || target.dead) return;
  
  // Choose retaliation mode: confrontation/insult or physical brawl
  if(typeof doInsult === 'function'){
    doInsult(aggressor, target);
  }
  if(typeof startFight === 'function' && !aggressor.fight && !target.fight){
    startFight(aggressor, target, 'retaliation for false court testimony');
  }

  aggressor.hasRetaliated = true;
  aggressor.retaliatedTarget = target.name;
  if(typeof logEvent === 'function'){
    logEvent('court_retaliation', `${aggressor.name} retaliated against ${target.name} for false court testimony`);
  }
}

const CustomaryCourt = {
  selectPresidingElder: selectPresidingElder,
  isEligibleWitness: isEligibleWitness,
  gatherCourtWitnesses: gatherCourtWitnesses,
  produceTestimony: produceTestimony,
  holdCourtHearing: holdCourtHearing,
  executeCourtVerdict: executeCourtVerdict,
  triggerWrongfulConvictionGrievance: triggerWrongfulConvictionGrievance,
  retaliate: retaliateAgainstWitness,
  getVillagerReputation: getVillagerReputation,
  hasPriorTheftOrVerdict: hasPriorTheftOrVerdict,
  getRecords: function(){ return COURT_RECORDS.slice(); },
  clearRecords: function(){ COURT_RECORDS.length = 0; }
};

if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.CustomaryCourt = CustomaryCourt;
  window.__aiBridge.holdCourtHearing = function(params){ return holdCourtHearing(params); };
  window.__aiBridge.getPresidingElder = function(hearing){ return selectPresidingElder(hearing); };
  window.__aiBridge.getCourtRecords = function(){ return CustomaryCourt.getRecords(); };
  window.__aiBridge.hasPriorTheftOrVerdict = function(t){ return hasPriorTheftOrVerdict(t); };
}
