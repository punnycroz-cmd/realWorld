/* =====================================================================
   PART 15F: WIRING — verb registration, planTick/planForVerb cases,
   intent patterns, daily hooks, tick chains, bridge + perception,
   villager field init.
   ===================================================================== */
VERBS.push('tame', 'preserve', 'trade', 'douse');
const __pfv15 = planForVerb;
planForVerb = function(v, action){
  const A = action || {};
  switch(A.kind){
    case 'tame': return { ok: true, steps: [{ verb: 'tame', what: A.what || 'chicken' }] };
    case 'preserve': return { ok: true, steps: [{ verb: 'preserve' }] };
    case 'trade':
      if(!CARAVAN.active) return { ok: false, reason: 'no caravan in the village' };
      return { ok: true, steps: [{ verb: 'trade', what: A.what || 'spice', buy: A.buy !== false }] };
    case 'douse': return { ok: true, steps: [{ verb: 'douse' }] };
    case 'cook': {
      const p = placePos('firepit');
      if(!p) return { ok: false, reason: 'unknown place: firepit' };
      return { ok: true, steps: [{ verb: 'go', place: 'firepit', tx: p.x, ty: p.y }, { verb: 'cook', meal: !!A.meal }] };
    }
    case 'speak':
      if(A.apologize){
        const t = A.to ? findPerson(A.to) : null;
        if(!t) return { ok: false, reason: 'no such person' };
        return { ok: true, steps: [{ verb: 'go', person: t.name }, { verb: 'speak', to: t.name, apologize: true, text: 'I am sorry.' }] };
      }
      return __pfv15(v, action);
    default: return __pfv15(v, action);
  }
};
const __pt15 = planTick;
planTick = function(v, dtH){
  if(v.dead) return;
  if(v.downed){ __pt15(v, dtH); return; }
  const step = v.plan && v.plan[0];
  if(step){
    let done = false;
    switch(step.verb){
      case 'tame': done = doTameStep(v, step, dtH); break;
      case 'preserve': done = doPreserveStep(v, step, dtH); break;
      case 'trade': done = doTradeStep(v, step, dtH); break;
      case 'douse': done = doDouseStep(v, step, dtH); break;
      default: __pt15(v, dtH); return;
    }
    step.t = (step.t || 0) + dtH;
    if(done) v.plan.shift();
    return;
  }
  __pt15(v, dtH);
};
/* intent patterns take precedence — unshifted ahead of the old list */
INTENT_PATTERNS.unshift(
  { re: /\bcook\b.{0,30}\b(fine|lavish|great|hearty|good)\b.{0,15}\bmeal\b|\b(fine|lavish|great|hearty|good)\b.{0,15}\bmeal\b/,
    plan: () => [{ verb: 'go', place: 'firepit' }, { verb: 'cook', meal: true }] },
  { re: /\bsmoke\b.{0,20}\b(meat|fish)\b|\bpreserve\b.{0,15}\b(meat|fish|food)\b/,
    plan: () => [{ verb: 'preserve' }] },
  { re: /\btrade\b.{0,25}\bcaravan\b|\bvisit\b.{0,15}\btraders?\b/,
    plan: () => [{ verb: 'trade', what: 'spice', buy: true }] },
  { re: /\bbuy\b.{0,15}\b(spice|cloth|salt|knife)\b.{0,25}\b(caravan|trader)/,
    plan: (m) => [{ verb: 'trade', what: m[1], buy: true }] },
  { re: /\bsell\b.{0,15}\b(hide|smokedmeat|egg|rawmeat|berries)\b.{0,25}\b(caravan|trader)/,
    plan: (m) => [{ verb: 'trade', what: m[1], buy: false }] },
  { re: /\btame\b.{0,20}\b(chicken|piglet|boar)\b/,
    plan: (m) => [{ verb: 'tame', what: m[1] === 'chicken' ? 'chicken' : 'boar' }] },
  { re: /\b(put out|fight|douse)\b.{0,20}\b(fire|flames|blaze)\b|\bsave\b.{0,15}\b(barn|house|hut|village)\b/,
    plan: () => [{ verb: 'douse' }] },
  { re: /\bapologize to (\w+)\b|\bsay sorry to (\w+)\b/,
    plan: (m) => {
      const t = findPerson(m[1] || m[2]);
      if(!t) return null;
      return [{ verb: 'go', person: t.name }, { verb: 'speak', to: t.name, apologize: true, text: 'I am sorry.' }];
    } }
);
/* daily hooks: spoilage, grudge decay, seasonal caravan arrival */
const __odp15 = onDayPass;
onDayPass = function(){
  const s0 = W.season;
  __odp15();
  spoilTick();
  decayGrudges();
  if(W.season !== s0) arriveCaravan();
};
/* tick chains */
const __st15 = simTick;
simTick = function(dtH){
  __st15(dtH);
  caravanTick(dtH);
  fightTick(dtH);
};
const __uv15 = updateVillagerAI;
updateVillagerAI = function(v, dtH){
  __uv15(v, dtH);
  if(v.dead || v.downed || v.brainControlled || v.outsider ||
     v.sfAgentDriven) return;   // v16: no code-authored fire duty on mains
  if(v.plan && v.plan.length) return;
  // daytime 'work' state included: routine labor yields to a threatening fire
  if(bestFireTarget(v)){
    v.plan = [{ verb: 'douse' }];
    witnessEvent(v, 'Running to fight the fire!');
  }
};
/* villager field init */
const __iv15 = initVillagers;
initVillagers = function(){
  __iv15();
  for(const v of VILLAGERS){
    v.grudges = v.grudges || {};
    v.rivals = v.rivals || {};
    v.invAge = v.invAge || {};
    v.taintedMeals = v.taintedMeals || {};
  }
};
/* perception: rivals and grievances are known to self */
const __perc15 = window.__aiBridge.getPerception;
window.__aiBridge.getPerception = function(name){
  const p = __perc15(name);
  if(!p || p.dead) return p;
  const v = VILLAGERS.find(x => x.name === name);
  p.rivals = Object.keys((v && v.rivals) || {});
  p.grievances = Object.keys((v && v.grudges) || {}).filter(k => (v.grudges[k] || 0) > 0.5);
  return p;
};
