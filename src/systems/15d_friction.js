/* =====================================================================
   PART 15D: SOCIAL FRICTION — mechanics only. Insults, grudges,
   rivalries, brawls with PART-14 injuries (never murder), bystander
   intervention, apologies, slow grudge decay. Verbal CONTENT is
   deferred to the AI brain; this is the machinery underneath.
   ===================================================================== */
function addGrudge(a, b, amt){
  if(!a || !b || a === b || a.dead || b.dead) return;
  a.grudges = a.grudges || {}; b.grudges = b.grudges || {};
  a.grudges[b.name] = (a.grudges[b.name] || 0) + amt;
  b.grudges[a.name] = (b.grudges[a.name] || 0) + amt * 0.5;
  checkRivalry(a, b);
}
function grudgeTotal(a, b){
  return ((a.grudges && a.grudges[b.name]) || 0) + ((b.grudges && b.grudges[a.name]) || 0);
}
function checkRivalry(a, b){
  if(((a.bonds[b.name] || 0) < 0.1) && ((b.bonds[a.name] || 0) < 0.1) && grudgeTotal(a, b) >= 3){
    a.rivals = a.rivals || {}; b.rivals = b.rivals || {};
    if(!a.rivals[b.name]){
      a.rivals[b.name] = true; b.rivals[a.name] = true;
      logEvent('rivalry', a.name + ' and ' + b.name + ' are now rivals');
      showToast('😠 ' + a.name + ' and ' + b.name + ' are rivals!');
    }
  }
}
function doInsult(a, b){
  addBond(a, b, -0.08);
  addGrudge(a, b, 1);
  for(const o of VILLAGERS){
    if(o !== a && o !== b && !o.dead && distCells(o, a) < 10)
      witnessEvent(o, 'Saw ' + a.name + ' insult ' + b.name);
  }
  witnessEvent(b, 'Insulted by ' + a.name);
  logEvent('insult', a.name + ' insulted ' + b.name);
}
function startFight(a, b, cause){
  if(!a || !b || a.dead || b.dead || a.downed || b.downed || a.fight || b.fight) return;
  a.fight = { with: b.name, t: 0, rounds: 0 };
  b.fight = { with: a.name, t: 0, rounds: 0 };
  a.state = 'fight'; b.state = 'fight'; a.moving = b.moving = false;
  logEvent('fight', a.name + ' and ' + b.name + ' are brawling (' + cause + ')');
  showToast('👊 ' + a.name + ' vs ' + b.name + '!');
  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.propagateSound === 'function'){
    FeelingSubstrate.propagateSound({
      kind: 'brawl_noise',
      originX: a.x,
      originY: a.y,
      source: a,
      radius: 20,
      metadata: { fighterA: a.name, fighterB: b.name, cause: cause }
    });
  }
  for(const o of VILLAGERS){
    if(o !== a && o !== b && !o.dead && distCells(o, a) < 10)
      witnessEvent(o, 'A fight broke out between ' + a.name + ' and ' + b.name);
  }
  // Child-harm proto-norm (production caller for recordNormViolation): an
  // adult brawling a child is witnessed by everyone nearby — each witness
  // records a 'child-harm' reason against the adult (belief-scoped).
  const childParty = (a.stage === 'child') ? a : (b.stage === 'child' ? b : null);
  if(childParty && typeof recordNormViolation === 'function' && typeof isConscious === 'function'){
    const offender = (childParty === a) ? b : a;
    if(offender.stage !== 'child'){
      for(const w of VILLAGERS){
        if(w === a || w === b || w.dead || w.downed || w.outsider) continue;
        if(!isConscious(w) || w.stage === 'child') continue;
        if(distCells(w, a) > 10) continue;
        recordNormViolation(w, offender.name, 'child-harm', { child: childParty.name, weight: -1.0 });
      }
    }
  }
}
function endFight(a, b, how){
  if(a){ a.fight = null; if(a.state === 'fight') a.state = 'idle'; }
  if(b){ b.fight = null; if(b.state === 'fight') b.state = 'idle'; }
  if(how) logEvent('fight', how);
}
function fightTick(dtH){
  for(const v of VILLAGERS){
    if(v.dead || !v.fight) continue;
    const o = VILLAGERS.find(x => x.name === v.fight.with && !x.dead);
    if(!o || !o.fight){ endFight(v, o, null); continue; }
    if(v.name > o.name) continue; // handle each pair once
    const F = v.fight; F.t += dtH;
    if(F.t < 0.25) continue;
    F.t = 0; F.rounds++; o.fight.rounds = F.rounds;
    for(const pair of [[v, o], [o, v]]){
      const att = pair[0], def = pair[1];
      const sev = 0.06 + srand() * 0.12;
      const locs = ['arm', 'torso', 'arm', 'torso', 'head'];
      addWound(def, locs[Math.floor(srand() * locs.length)], sev,
        { bleed: 0.03 + srand() * 0.04 });
      gainXP(att, 'hunting', 1);
    }
    witnessEvent(v, 'Trading blows with ' + o.name);
    let broken = false;
    for(const w of VILLAGERS){
      if(w === v || w === o || w.dead || w.downed || w.fight) continue;
      if(distCells(w, v) > 8) continue;
      const bond = Math.max((w.bonds && w.bonds[v.name]) || 0, (w.bonds && w.bonds[o.name]) || 0);
      if(bond > 0.5 && srand() < 0.5){
        witnessEvent(w, 'Broke up the fight between ' + v.name + ' and ' + o.name);
        addGrudge(v, o, 0.5);
        endFight(v, o, 'Broke up: ' + v.name + ' vs ' + o.name + ' (' + w.name + ' intervened)');
        broken = true; break;
      }
    }
    if(broken) continue;
    if(F.rounds >= 6 || (v.body && v.body.blood < 0.55) || (o.body && o.body.blood < 0.55)){
      const loser = (v.body && o.body && v.body.blood <= o.body.blood) ? v : o;
      setDowned(loser, 'beaten', 'lost a brawl');
      addGrudge(v, o, 1);
      endFight(v, o, loser.name + ' lost the brawl');
    }
  }
}
/* 'beaten' recovery — bruises fade with a couple hours of rest */
const __downedTick15 = downedTick;
downedTick = function(v, dtH){
  __downedTick15(v, dtH);
  const d = v.downed;
  if(d && d.kind === 'beaten' && d.t > 2){
    v.downed = null; v.state = 'rest';
    witnessEvent(v, 'Got back up, bruised and sore');
  }
};
/* friction woven into the autonomous social pass */
const __socialTick15 = socialTick;
socialTick = function(h){
  __socialTick15(h);
  /* v16: driven mains are excluded — code-authored insults/fights on a
     main are banned (design §6.4); friction between ambients stays */
  const awake = VILLAGERS.filter(v => !v.dead && !v.brainControlled && !v.outsider &&
    !v.sfAgentDriven &&
    (v.state === 'idle' || v.state === 'walk' || v.state === 'rest'));
  for(let i = 0; i < awake.length; i++) for(let j = i + 1; j < awake.length; j++){
    const a = awake[i], b = awake[j];
    if(distCells(a, b) > 6) continue;
    if((a.bonds[b.name] || 0) < 0.15 && srand() < 0.06 * h) doInsult(a, b);
    else if(a.rivals && a.rivals[b.name] && srand() < 0.05 * h) startFight(a, b, 'rivalry');
  }
};
/* apologies repair grudges; rivals can make peace */
const __speak15 = doSpeakStep;
doSpeakStep = function(v, step, dtH){
  if(step.apologize && step.to && !step.said){
    const t = VILLAGERS.find(o => o.name === step.to && !o.dead);
    if(t){
      if(v.grudges && v.grudges[t.name]) v.grudges[t.name] *= 0.3;
      if(t.grudges && t.grudges[v.name]) t.grudges[v.name] *= 0.3;
      addBond(v, t, 0.06);
      if(v.rivals && v.rivals[t.name] && grudgeTotal(v, t) < 1.5){
        delete v.rivals[t.name]; delete t.rivals[v.name];
        logEvent('reconcile', v.name + ' and ' + t.name + ' made peace');
      }
      witnessEvent(t, v.name + ' apologized');
    }
  }
  return __speak15(v, step, dtH);
};
/* rivals refuse to tend or rescue each other */
const __tend15 = doTendStep;
doTendStep = function(v, step, dtH){
  const t = step.person && findPerson(step.person);
  if(t && v.rivals && v.rivals[t.name]){
    v.thoughts = [{ text: 'Refuse to help a rival', val: -2 }];
    return true;
  }
  return __tend15(v, step, dtH);
};
const __ri15 = rescueInstinct;
rescueInstinct = function(v, dtH){
  if(v.rivals){
    const blocked = VILLAGERS.some(o => o.downed && !o.dead && v.rivals[o.name] &&
      Math.hypot(o.x - v.x, o.y - v.y) <= CS * 22);
    if(blocked){
      // rescue everyone except the rival
      const keep = [];
      for(const o of VILLAGERS){
        if(o.downed && !o.dead && !(v.rivals[o.name]) &&
          Math.hypot(o.x - v.x, o.y - v.y) <= CS * 22 && !nearestThreat(v)){
          const bond = (v.bonds && v.bonds[o.name]) || 0;
          if(bond > 0.4 || skillLvl(v, 'medicine') >= 3 || isBrave(v)){
            v.plan = [{ verb: 'rescue', person: o.name }];
            witnessEvent(v, 'Going to rescue ' + o.name);
            return;
          }
        }
      }
      return;
    }
  }
  __ri15(v, dtH);
};
function decayGrudges(){
  for(const v of VILLAGERS){
    if(!v.grudges) continue;
    for(const k of Object.keys(v.grudges)){
      v.grudges[k] *= 0.95;
      if(v.grudges[k] < 0.05) delete v.grudges[k];
    }
  }
}
