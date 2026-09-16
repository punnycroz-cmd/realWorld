/* =====================================================================
   PHASE 3B — WHY-ACTION INSPECTOR
   Answers "why is this villager doing that?" without building a second
   brain: it records the decision the utility AI ALREADY made.

   - Wraps evaluateVillagerUtility: after the real scoring + deterministic
     sort, stores v.__lastDecision = { winner, top candidates with scores,
     the need/personality/distance inputs that fed the scores }. Only the
     LAST decision per villager is kept (bounded, overwritten each decision).
   - window.__aiBridge.explainAction(name) returns the structured trace:
     current plan, the recorded decision, the beliefs the villager acted on
     (belief-scoped — actualOwner is NEVER exposed), and the last failure ->
     observation -> re-evaluation entry.
   - The pawn inspector gains a "WHY" section, refreshed inside updateHUD.
   ===================================================================== */

/* ---- Decision trace recording (wrap, do not touch the scorer) ---- */
const __evalUtil22why = evaluateVillagerUtility;
evaluateVillagerUtility = function(v){
  const r = __evalUtil22why(v);
  try{
    const b = (v && v.body) || {};
    const p = (v && v.personality) || {};
    const cands = (r && r.candidates) || [];
    const top = [];
    for(let i = 0; i < cands.length && top.length < 6; i++){
      const c = cands[i];
      let dist = null;
      try{ dist = (c.tx != null && c.ty != null && typeof distCells === 'function') ? +distCells(v, { x: c.tx, y: c.ty }).toFixed(1) : null; }
      catch(e){ dist = null; }
      top.push({
        id: c.id || null,
        name: c.name || c.id || 'action',
        category: c.category || null,
        score: (c.score === -Infinity) ? 'ruled-out' : +(+c.score).toFixed(2),
        distCells: dist,
        source: c.source || null,
        opportunity: !!c.opportunity,
        beliefConfidence: (c.beliefConfidence != null) ? +(+c.beliefConfidence).toFixed(2) : null
      });
    }
    v.__lastDecision = {
      day: W.day,
      tod: +W.tod.toFixed(2),
      nCandidates: cands.length,
      winner: r.bestAction ? {
        id: r.bestAction.id || null,
        name: r.bestAction.name || r.bestAction.id || 'action',
        category: r.bestAction.category || null,
        score: +(+(r.bestAction.score)).toFixed(2)
      } : null,
      // The inputs that fed the scores (need deficits, personality, time).
      // These are the "because": hungry + close + brave -> chose this.
      inputs: {
        satietyDeficit: +clamp(1 - (b.satiety || 0), 0, 1).toFixed(3),
        hydrationDeficit: +clamp(1 - (b.hydration || 0), 0, 1).toFixed(3),
        fatigueDeficit: +clamp(b.fatigue || 0, 0, 1).toFixed(3),
        injuryDeficit: +clamp(b.injury || 0, 0, 1).toFixed(3),
        coldDeficit: +clamp((36.5 - (b.coreTemp || 37)) / 3.0, 0, 1).toFixed(3),
        socialDeficit: +clamp((v.chatT || 0) / 10.0, 0, 1).toFixed(3),
        isNight: (W.tod >= 21 || W.tod < 6),
        brave: (p.brave != null) ? +(+p.brave).toFixed(2) : null,
        cautious: (p.cautious != null) ? +(+p.cautious).toFixed(2) : null,
        industrious: (p.industrious != null) ? +(+p.industrious).toFixed(2) : null,
        lazy: (p.lazy != null) ? +(+p.lazy).toFixed(2) : null
      },
      top: top
    };
  }catch(e){ /* tracing must never break the decision */ }
  return r;
};

/* ---- Structured explanation for one villager (belief-scoped) ---- */
function explainAction(name){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return null;
  const d = v.__lastDecision || null;
  // Beliefs this villager actually holds about items it might act on.
  // Ownership beliefs only — actualOwner is world truth and never exposed.
  const beliefs = [];
  try{
    const own = (v.epistemic && v.epistemic.ownership) || {};
    for(const k of Object.keys(own)){
      const bo = own[k] || {};
      beliefs.push({
        item: k,
        knownOwner: bo.knownOwner || null,
        suspectedOwner: bo.suspectedOwner || null,
        confidence: (bo.confidence != null) ? +(+bo.confidence).toFixed(2) : null
      });
      if(beliefs.length >= 8) break;
    }
  }catch(e){}
  const plan = [];
  try{
    for(const s of (v.plan || [])){
      plan.push({ verb: s.verb || null, what: s.what || null, kind: s.kind || null,
                  itemId: s.itemId || null, x: (s.x != null ? Math.round(s.x) : (s.tx != null ? Math.round(s.tx) : null)),
                  y: (s.y != null ? Math.round(s.y) : (s.ty != null ? Math.round(s.ty) : null)) });
      if(plan.length >= 6) break;
    }
  }catch(e){}
  return {
    name: v.name,
    role: v.role || null,
    state: v.state || null,
    plan: plan,
    currentAction: v.currentAction ? { id: v.currentAction.id || null, name: v.currentAction.name || v.currentAction.id || null } : null,
    decision: d,
    beliefsActedOn: beliefs,
    // Last failure -> observation -> re-evaluation entry (never silent).
    lastFailure: (v.thoughts && v.thoughts.length) ? { text: v.thoughts[0].text || '', val: v.thoughts[0].val || 0 } : null
  };
}
window.__aiBridge.explainAction = function(name){ return explainAction(name); };

/* ---- Pawn-inspector WHY section (refreshed inside updateHUD) ---- */
const __updateHUD22why = updateHUD;
updateHUD = function(){
  __updateHUD22why();
  try{
    const box = document.getElementById('pi-why');
    if(!box) return;
    const v = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
    if(!v || !v.__lastDecision){ box.textContent = 'No decision recorded yet.'; return; }
    const d = v.__lastDecision;
    const inp = d.inputs || {};
    const needBits = [];
    if(inp.satietyDeficit > 0.25) needBits.push('hungry ' + Math.round(inp.satietyDeficit * 100) + '%');
    if(inp.hydrationDeficit > 0.25) needBits.push('thirsty ' + Math.round(inp.hydrationDeficit * 100) + '%');
    if(inp.fatigueDeficit > 0.5) needBits.push('tired ' + Math.round(inp.fatigueDeficit * 100) + '%');
    if(inp.injuryDeficit > 0.1) needBits.push('hurt');
    if(inp.coldDeficit > 0.2) needBits.push('cold');
    const w = d.winner;
    let html = '<div class="pi-why-winner">▶ ' + escapeHtml(w ? w.name : '(idle)') +
      (w ? ' <span class="pi-why-score">' + w.score + '</span>' : '') + '</div>';
    html += '<div class="pi-why-why">because: ' + escapeHtml(needBits.length ? needBits.join(', ') : 'no pressing need') +
      (inp.isNight ? ' · night' : '') + '</div>';
    html += '<div class="pi-why-top">';
    for(const c of (d.top || []).slice(0, 4)){
      const mark = (w && c.id === w.id) ? '● ' : '○ ';
      html += '<div>' + mark + escapeHtml(c.name) + ' <span class="pi-why-score">' + c.score + '</span></div>';
    }
    html += '</div>';
    if(v.thoughts && v.thoughts.length && (v.thoughts[0].val || 0) < 0)
      html += '<div class="pi-why-fail">⚠ ' + escapeHtml(v.thoughts[0].text) + '</div>';
    box.innerHTML = html;
  }catch(e){ /* inspector extras must never break the HUD */ }
};
function escapeHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
