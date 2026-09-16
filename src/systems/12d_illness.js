/* ---- illness & injury ---- */
function illnessInjuryTick(v, dtH){
  if(v.dead) return;
  const b = ensureBody(v);
  b.injury = b.injury || 0; b.illness = b.illness || 0;
  if(b.wetness > 0.6 && b.coreTemp < 36){
    b.illT = (b.illT || 0) + dtH;
    if(b.illT > 3) b.illness = clamp(b.illness + dtH * 0.06, 0, 1);
  } else b.illT = 0;
  if(b.illness > 0.25) b.coreTemp += (38.6 - b.coreTemp) * Math.min(1, 0.4 * dtH);
  const resting = v.state === 'sleep' || v.state === 'rest';
  if(resting && b.satiety > 0.35){
    b.injury = Math.max(0, b.injury - dtH * 0.08);
    b.illness = Math.max(0, b.illness - dtH * 0.06);
  }

  // Phase 6C: Untreated wounds -> infection chain (C4)
  if(b.wounds && b.wounds.length){
    let maxInf = 0;
    for(const w of b.wounds){
      if(!w.dressed && w.inf > 0.15) maxInf = Math.max(maxInf, w.inf);
    }
    if(maxInf > 0.15){
      b.illness = clamp((b.illness || 0) + dtH * 0.03 * maxInf, 0, 1);
    }
  }

  // Update body work and speed factors
  if(typeof calcBodyFactors === 'function') calcBodyFactors(v);
}