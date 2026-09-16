/* =====================================================================
   PART 16A: DATA-DRIVEN RECIPE EXECUTOR (Phase 2A).
   A generic `recipe` verb that runs any entry in RECIPE_TABLE
   (src/data/recipes.js): checks inputs/tools/skill, walks to a
   workstation when one exists, consumes inputs over workTime, produces
   outputs with full provenance (creator/materials/quality/owner/day).
   The medical `craft` verb (14a) is untouched — different system.
   ===================================================================== */
VERBS.push('recipe');

/* workstation lookup: 'workbench' -> workshop building or bench object, 'firepit' -> kitchen or campfire.
   Returns {x,y} or null when no such station exists (then we work in place). */
function recipeStationNear(v, ws){
  if(ws === 'workbench'){
    const wb = VILLAGE_BUILDINGS.find(b => b.kind === 'workshop' || b.id === 'workshop' || b.id.startsWith('workshop'));
    if(wb) return { x: (wb.wx + Math.floor(wb.tw / 2)) * CS + 16, y: (wb.wy + wb.th) * CS + 20 };
    const b = VILLAGE_OBJECTS.find(o => o.kind === 'bench');
    return b ? { x: b.x, y: b.y } : null;
  }
  if(ws === 'firepit'){
    const k = VILLAGE_BUILDINGS.find(b => (b.kind === 'kitchen' || b.id === 'kitchen' || b.id.startsWith('kitchen')) && b.fireplaceLit);
    if(k) return { x: (k.wx + Math.floor(k.tw / 2)) * CS + 16, y: (k.wy + k.th) * CS + 20 };
    const f = FIRES.find(f => f.burnH > 0) || FIRES[0];
    return f ? { x: f.x, y: f.y } : null;
  }
  return null;
}

function doRecipeStep(v, step, dtH){
  const r = getRecipe(step.recipe);
  if(!r){ v.thoughts = [{ text: 'No such recipe: ' + step.recipe, val: -1 }]; return true; }
  if(r.skill && (r.minLevel || 0) > 0 && skillLvl(v, r.skill) < r.minLevel){
    v.thoughts = [{ text: 'Not skilled enough to ' + r.name.toLowerCase(), val: -2 }];
    return true;
  }
  for(const k in (r.inputs || {})){
    if((v.inv[k] || 0) < r.inputs[k]){
      v.thoughts = [{ text: 'Need ' + r.inputs[k] + ' ' + k + ' to ' + r.name.toLowerCase(), val: -2 }];
      return true;
    }
  }
  /* tools gate only on tools that exist as inventory items (none do yet —
     see recipes.js note); a required tool we don't have ends the step. */
  for(const t of (r.toolsRequired || [])){
    if(!(v.inv[t] > 0)){
      v.thoughts = [{ text: 'Need a ' + t + ' to ' + r.name.toLowerCase(), val: -2 }];
      return true;
    }
  }
  const ws = recipeStationNear(v, r.workstation);
  if(ws && Math.hypot(v.x - ws.x, v.y - ws.y) > CS * 2){
    const rr = planMoveToward(v, ws.x, ws.y, dtH);
    if(rr === 'stuck'){ // Phase 2A fix: never silently abandon — the villager notices
      v.thoughts = [{ text: "Can't reach the " + r.workstation, val: -2 }];
      return true;
    }
    return false;
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH * skillMult(v, r.skill || 'building') * occupationBonusFor(v, 'crafting');
  if(step.prog >= (r.workTime || 0.5)){
    // Phase 2F: consume identified inputs with lineage; legacy/test bulk counts
    // fall back to anonymous identified materials so counts stay honest.
    const consumedIds = [];
    const consumedRecs = [];
    for(const k in (r.inputs || {})){
      const need = r.inputs[k];
      v.inv[k] = Math.max(0, (v.inv[k] || 0) - need);
      const recs = stripItemProvenance(v, k, need);
      if(recs && recs.length) for(const rc of recs) consumedRecs.push(rc);
      if(typeof IDENTIFIED_KINDS !== 'undefined' && IDENTIFIED_KINDS[k] && typeof consumeIdentifiedInputs === 'function'){
        const ids = consumeIdentifiedInputs(v, k, need, r.id || 'goods');
        for(const id of ids) consumedIds.push(id);
      }
    }
    const q = calcSkillQuality(v, r.skill);
    const makesIdentified = !!r.identifiedOutputs && typeof IDENTIFIED_KINDS !== 'undefined' && typeof mintIdentifiedItem === 'function';
    for(const k in (r.outputs || {})){
      const n = r.outputs[k];
      if(makesIdentified && IDENTIFIED_KINDS[k]){
        // Phase 2F: material lineage — identified parents + their tree roots
        const treeIds = (typeof extractTreeIds === 'function') ? extractTreeIds(consumedRecs) : [];
        for(const pid of consumedIds){
          const pi = (typeof getItem === 'function') ? getItem(pid) : null;
          if(pi && pi.treeIds) for(const tid of pi.treeIds) if(treeIds.indexOf(tid) < 0) treeIds.push(tid);
        }
        for(let i = 0; i < n; i++){
          mintIdentifiedItem(k, { creator: v.name, quality: q, condition: 1.0,
            materials: Object.assign({}, r.inputs), parentIds: consumedIds, treeIds,
            holder: v.name, x: v.x, y: v.y, context: 'crafted via ' + (r.id || 'recipe') });
        }
        v.inv[k] = (v.inv[k] || 0) + n; // count mirror stays truthful alongside identity
      } else {
        addInv(v, k, n);
      }
      // Phase 2A legacy provenance mirror (kept for compatibility, even for identified kinds)
      const prov = createProvenance(v.name, r.inputs, q, v.name, W.day);
      recordUsage(prov, 'crafted', v.name);
      attachItemProvenance(v, k, n, prov);
    }
    gainXP(v, r.skill || 'building', 6);
    witnessEvent(v, 'Finished ' + r.name.toLowerCase());
    logEvent('craft', v.name + ' ' + r.name.toLowerCase());
    return true;
  }
  return false;
}

/* ---- wiring: planForVerb / planTick / intents (same wrap pattern as 14F/15F) ---- */
const __pfv16 = planForVerb;
planForVerb = function(v, action){
  const A = action || {};
  if(A.kind === 'recipe'){
    const r = getRecipe(A.recipe);
    if(!r) return { ok: false, reason: 'unknown recipe: ' + A.recipe };
    return { ok: true, steps: [{ verb: 'recipe', recipe: r.id }] };
  }
  return __pfv16(v, action);
};
const __pt16 = planTick;
planTick = function(v, dtH){
  if(v.dead) return;
  if(v.downed){ __pt16(v, dtH); return; }
  const step = v.plan && v.plan[0];
  if(step){
    if(step.verb === 'recipe'){
      const done = doRecipeStep(v, step, dtH);
      step.t = (step.t || 0) + dtH;
      if(done) v.plan.shift();
      return;
    }
    __pt16(v, dtH); return;
  }
  __pt16(v, dtH);
};
/* intent patterns take precedence — unshifted ahead of the older lists */
INTENT_PATTERNS.unshift(
  { re: /\b(saw|make)\b.{0,20}\bplanks?\b/,
    plan: () => [{ verb: 'recipe', recipe: 'plank' }] },
  { re: /\b(make|craft|build)\b.{0,20}\bfurniture\b/,
    plan: () => [{ verb: 'recipe', recipe: 'furniture' }] },
  { re: /\b(mill|grind)\b.{0,20}\bflour\b/,
    plan: () => [{ verb: 'recipe', recipe: 'flour' }] },
  { re: /\b(bake)\b.{0,20}\bbread\b/,
    plan: () => [{ verb: 'recipe', recipe: 'bread' }] }
);
