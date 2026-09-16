/* =====================================================================
   PART 14A: ERA-APPROPRIATE MEDICAL — herbalism, not surgery.
   Wounds are granular: {loc, sev, bleed, inf, open, fracture, dressed,
   splint, t}. Blood is a real resource. Remedies are craftable:
   poultice (herbs), splint (wood+cloth), fever tea (herbs+fire).
   `tend` verb applies them; quality scales with medicine skill.
   ===================================================================== */
function syncWounds(v){
  const b = ensureBody(v);
  if(!b.wounds) b.wounds = [];
  if(b.blood == null) b.blood = 1;
  let mx = 0;
  for(const w of b.wounds) mx = Math.max(mx, w.sev);
  b.injury = mx; // backward-compatible aggregate for older code paths
  return b.wounds;
}
function addWound(v, loc, sev, opts){
  opts = opts || {};
  const b = ensureBody(v); syncWounds(v);
  const w = {
    loc: loc, sev: clamp(sev, 0, 1),
    bleed: opts.bleed != null ? opts.bleed : sev * 0.55,
    inf: 0, open: opts.open !== false,
    fracture: !!(opts.fracture || (sev > 0.7 && (loc === 'arm' || loc === 'leg'))),
    dressed: false, splint: false, t: 0
  };
  b.wounds.push(w);
  b.injury = Math.max(b.injury || 0, w.sev);
  witnessEvent(v, 'Wounded in the ' + loc + ' (' + Math.round(w.sev * 100) + '%)');
  if(w.fracture && loc === 'leg') setDowned(v, 'leg', 'broken leg');
  else if(loc === 'head' && w.sev > 0.75 && srand() < 0.6) setDowned(v, 'unconscious', 'head wound');
  else if(b.blood < 0.4) setDowned(v, 'bleeding', 'blood loss');
  return w;
}
function hasFracture(v, loc){
  const b = v.body || {};
  return (b.wounds || []).some(w => w.fracture && w.sev > 0.12 && (!loc || w.loc === loc));
}
/* "Actively bleeding" — at least one open, undressed wound still seeping.
   Shared by woundTick (blood-loss down trigger) and downedTick (wake
   trigger) so the two can never disagree. A villager whose wounds have
   clotted (open=false) but whose blood is still low is anemic, not in
   acute crisis: they stay conscious and must eat to rebuild blood.
   (Phase 4 fix: the old woundTick downed on blood<0.38 alone while
   downedTick woke on bleed<=0.05, so a clotted-but-anemic villager was
   re-downed EVERY tick; setDowned wipes v.plan, so their drink/eat/sleep
   plan never got past its first step and they died of thirst/exhaustion
   standing next to the well.) */
function isActivelyBleeding(v){
  const b = v.body || {};
  return (b.wounds || []).some(w => w.open && !w.dressed && w.bleed > 0);
}
function woundTick(v, dtH){
  if(v.dead) return;
  const b = ensureBody(v); syncWounds(v);
  const resting = v.state === 'sleep' || v.state === 'rest';
  const fed = b.satiety > 0.3;
  let bleedNow = 0;
  for(const w of b.wounds){
    w.t += dtH;
    if(w.open && !w.dressed && w.bleed > 0){
      b.blood = clamp(b.blood - w.bleed * dtH * 0.12, 0, 1);
      bleedNow += w.bleed;
      w.bleed = Math.max(0, w.bleed - dtH * 0.015 * (1 - w.sev * 0.6)); // severe wounds clot slowly
      if(w.bleed <= 0.02) w.open = false;
    }
    if(!w.dressed){
      const dirt = 0.4 + (b.wetness || 0) * 0.6 + (v.state === 'work' ? 0.35 : 0);
      w.inf = clamp(w.inf + dtH * (w.open ? 0.028 : 0.016) * dirt, 0, 1);
    } else {
      w.inf = Math.max(0, w.inf - dtH * 0.06);
    }
    if(w.fracture){
      if(w.splint && resting && fed) w.sev = Math.max(0, w.sev - dtH * 0.018); // ~2 days of rest
    } else if(w.dressed && resting && fed){
      w.sev = Math.max(0, w.sev - dtH * 0.05);
    } else if(w.dressed && fed){
      w.sev = Math.max(0, w.sev - dtH * 0.015);
    }
  }
  b.wounds = b.wounds.filter(w => w.sev > 0.02 || w.bleed > 0.04 || w.inf > 0.05);
  // Phase 4 balance: 0.008->0.014/h — a fed survivor rebuilds blood in ~1 day,
  // not ~2. Eating well to recover from blood loss is the intended loop.
  if(bleedNow < 0.02 && b.satiety > 0.4 && b.blood < 1) b.blood = clamp(b.blood + dtH * 0.014, 0, 1);
  let maxInf = 0;
  for(const w of b.wounds) maxInf = Math.max(maxInf, w.inf);
  b.fever = maxInf > 0.5;
  if(b.fever){
    b.coreTemp += (39.3 - b.coreTemp) * Math.min(1, 0.35 * dtH);
    b.illness = clamp((b.illness || 0) + dtH * 0.02, 0, 1);
  }
  if(b.blood < 0.38 && !v.downed && isActivelyBleeding(v)) setDowned(v, 'bleeding', 'blood loss');
  if(b.blood <= 0.04) killVillager(v, 'bled out');
  syncWounds(v);
}
/* ---- remedies & garments ---- */
const RECIPES = {
  poultice: { needs: { herb: 2 }, skill: 'medicine' },
  splint:   { needs: { log: 1, cloth: 1 }, skill: 'medicine' },
  feverTea: { needs: { herb: 2 }, skill: 'medicine', fire: true },
  cloth:    { needs: { fiber: 3 }, skill: 'tailoring' },
  tunic:    { needs: { cloth: 2 }, skill: 'tailoring', garment: 'tunic' },
  cloak:    { needs: { cloth: 3 }, skill: 'tailoring', garment: 'cloak' },
  boots:    { needs: { leather: 2 }, skill: 'tailoring', garment: 'boots' },
  coat:     { needs: { leather: 3, cloth: 2 }, skill: 'tailoring', garment: 'coat' }
};
const GARMENTS = {
  tunic: { slot: 'base', insul: 0.30 },
  cloak: { slot: 'outer', insul: 0.55 },
  coat:  { slot: 'outer', insul: 0.95 },
  boots: { slot: 'feet', insul: 0.25 }
};
function equipGarment(v, g){
  if(!v.clothes) v.clothes = { base: null, outer: null, feet: null };
  const slot = GARMENTS[g.type].slot;
  const old = v.clothes[slot];
  v.clothes[slot] = g;
  if(old) addInv(v, old.type, 1);
}
function clothingInsul(v){
  let s = 0;
  if(v.clothes) for(const slot of ['base', 'outer', 'feet']){
    const g = v.clothes[slot];
    if(g && GARMENTS[g.type]) s += GARMENTS[g.type].insul * clamp(g.dur == null ? 1 : g.dur, 0, 1);
  }
  if(v.body && (v.body.wetness || 0) > 0.4) s *= 0.4; // soaked cloth insulates poorly
  return s;
}
function clothingTick(v, dtH){
  const b = v.body; if(!b) return;
  const ins = clothingInsul(v);
  if(ins > 0 && b.coreTemp < 36.8){
    b.coreTemp += ins * dtH * 0.25 * (36.8 - b.coreTemp); // insulation retains heat
  }
  if(v.clothes) for(const slot of ['base', 'outer', 'feet']){
    const g = v.clothes[slot];
    if(g && g.dur != null){
      g.dur = Math.max(0, g.dur - dtH * 0.0015 * (v.state === 'work' ? 2.5 : 1));
      if(g.dur <= 0.01 && !g.tattered){ g.tattered = true; witnessEvent(v, 'My ' + g.type + ' is falling apart'); }
    }
  }
}
function doCraftStep(v, step, dtH){
  const r = RECIPES[step.what];
  if(!r){ v.thoughts = [{ text: 'No knowledge of crafting ' + step.what, val: -1 }]; return true; }
  for(const k in r.needs){
    if((v.inv[k] || 0) < r.needs[k]){
      v.thoughts = [{ text: 'Need ' + r.needs[k] + ' ' + k + ' to craft ' + step.what, val: -2 }];
      return true;
    }
  }
  if(r.fire){
    let near = false;
    for(const f of FIRES) if(f.burnH > 0 && Math.hypot(v.x - f.x, v.y - f.y) < CS * 3){ near = true; break; }
    if(!near){
      const p = placePos('firepit');
      if(p){ const rr = planMoveToward(v, p.x, p.y, dtH); if(rr !== true) return rr === 'stuck'; }
      else { v.thoughts = [{ text: 'Need a lit fire', val: -2 }]; return true; }
      return false;
    }
  }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH * skillMult(v, r.skill);
  if(step.prog >= 1){
    for(const k in r.needs){ v.inv[k] -= r.needs[k]; stripItemProvenance(v, k, r.needs[k]); }
    if(r.garment){
      equipGarment(v, { type: r.garment, dur: clamp(0.65 + skillLvl(v, 'tailoring') * 0.05, 0, 1) });
      witnessEvent(v, 'Crafted a ' + r.garment);
    } else {
      addInv(v, step.what, 1);
      witnessEvent(v, 'Crafted ' + step.what);
    }
    gainXP(v, r.skill, 8);
    return true;
  }
  return false;
}
function doMendStep(v, step, dtH){
  if(!v.clothes){ v.thoughts = [{ text: 'Nothing to mend', val: -1 }]; return true; }
  let worst = null;
  for(const slot of ['base', 'outer', 'feet']){
    const g = v.clothes[slot];
    if(g && (g.dur == null || g.dur < 0.9) && (!worst || (g.dur || 0) < (worst.dur || 0))) worst = g;
  }
  if(!worst){ v.thoughts = [{ text: 'Clothes are in good repair', val: 1 }]; return true; }
  const mat = (v.inv.cloth || 0) > 0 ? 'cloth' : ((v.inv.leather || 0) > 0 ? 'leather' : null);
  if(!mat){ v.thoughts = [{ text: 'Need cloth or leather to mend', val: -2 }]; return true; }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH * skillMult(v, 'tailoring');
  if(step.prog >= 0.6){
    v.inv[mat]--; stripItemProvenance(v, mat, 1); worst.dur = clamp((worst.dur || 0) + 0.5, 0, 1); worst.tattered = false;
    gainXP(v, 'tailoring', 5);
    witnessEvent(v, 'Mended ' + worst.type);
    return true;
  }
  return false;
}
function nearestWounded(v){
  let best = null, bd = 1e9;
  for(const o of VILLAGERS){
    if(o.dead) continue;
    const b = o.body;
    if(!b || (!(b.wounds && b.wounds.length) && !b.fever)) continue;
    const d = Math.hypot(o.x - v.x, o.y - v.y);
    if(d < bd){ bd = d; best = o; }
  }
  return best;
}
function doTendStep(v, step, dtH){
  let t = step.person ? findPerson(step.person) : null;
  if(!t) t = nearestWounded(v) || v;
  if(!t || t.dead) return true;
  const b = ensureBody(t); syncWounds(t);
  if(!b.wounds.length && !b.fever) return true;
  if(t !== v && Math.hypot(v.x - t.x, v.y - t.y) > CS * 1.6){
    const r = planMoveToward(v, t.x, t.y, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'work'; v.moving = false;
  const med = skillLvl(v, 'medicine');
  const self = (t === v);
  step.prog = (step.prog || 0) + dtH * (0.6 + med * 0.12) * (self ? 0.6 : 1);
  if(step.prog >= 1){
    let used = null;
    const bleedW = b.wounds.find(w => w.bleed > 0.04 && w.open);
    const fracW = b.wounds.find(w => w.fracture && !w.splint);
    if(bleedW && (v.inv.poultice || 0) > 0){
      v.inv.poultice--; bleedW.dressed = true; bleedW.bleed = 0; bleedW.open = false; used = 'poultice';
    } else if(fracW && (v.inv.splint || 0) > 0){
      v.inv.splint--; fracW.splint = true; fracW.dressed = true; used = 'splint';
    } else if(b.fever && (v.inv.feverTea || 0) > 0){
      v.inv.feverTea--; b.illness = Math.max(0, (b.illness || 0) - 0.45); b.fever = false; used = 'fever tea';
    } else {
      for(const w of b.wounds){
        w.bleed = Math.max(0, w.bleed - (0.15 + med * 0.06));
        if(w.bleed <= 0.03) w.open = false;
        if(!w.dressed) w.dressed = true; // cleaned and bandaged
      }
      used = 'basic care';
    }
    gainXP(v, 'medicine', 7);
    witnessEvent(v, 'Tended ' + (self ? 'own wounds' : t.name) + ' (' + used + ')');
    if(t !== v) witnessEvent(t, 'Tended by ' + v.name + ' (' + used + ')');
    return true;
  }
  return false;
}
