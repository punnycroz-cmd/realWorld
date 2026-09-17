/* =====================================================================
   PART 14D: REALISTIC SKILLS + WORK ASSIGNMENT.
   Levels 0-10, XP by doing, talents per role, diminishing returns.
   Work priorities per villager; assignWork/getWork on the bridge.
   ===================================================================== */
const SKILLS = ['farming', 'cooking', 'building', 'medicine', 'hunting', 'fishing', 'foraging', 'tailoring'];
function ensureSkills(v){
  if(v.skills) return v.skills;
  v.skills = {};
  for(const s of SKILLS) v.skills[s] = { lvl: 1, xp: 0 };
  return v.skills;
}
function skillLvl(v, s){ ensureSkills(v); return v.skills[s] ? v.skills[s].lvl : 1; }
function skillMult(v, s){ return 1 + skillLvl(v, s) * 0.08; }
function gainXP(v, s, amt){
  ensureSkills(v);
  const sk = v.skills[s]; if(!sk) return;
  const weak = v.talents && v.talents.weak && v.talents.weak.indexOf(s) >= 0;
  const strong = v.talents && v.talents.strong && v.talents.strong.indexOf(s) >= 0;
  let a = amt * (weak ? 0.5 : (strong ? 1.6 : 1));
  if(typeof getGuildApprenticeshipBonus === 'function'){
    a *= getGuildApprenticeshipBonus(v, s);
  }
  a *= Math.max(0.25, 1 - sk.lvl / 12);
  const oldLvl = sk.lvl;
  sk.xp += a;
  while(sk.xp >= 100 && sk.lvl < 10){ sk.xp -= 100; sk.lvl += 1; }
  if(sk.lvl >= 10) sk.xp = Math.min(sk.xp, 99);
  if(oldLvl < 7 && sk.lvl >= 7){
    const masterKind = (s === 'farming') ? 'farmer' : (s === 'building' || s === 'crafting' || s === 'tailoring') ? 'craftsman' : s;
    if(typeof observe === 'function'){
      observe(v, { event: 'mastery_achieved', skill: masterKind, what: 'Reached master rank in ' + s }, {
        topic: 'master_' + masterKind,
        salience: 0.90,
        source: 'direct',
        bypassAttention: true
      });
    }
  }
}
function skillWords(v){
  ensureSkills(v);
  let best = { s: 'farming', l: 0 };
  for(const s of SKILLS){ const l = v.skills[s].lvl; if(l > best.l) best = { s: s, l: l }; }
  const w = best.l >= 7 ? 'masterful' : best.l >= 5 ? 'skilled' : best.l >= 3 ? 'capable' : best.l >= 1.5 ? 'learning' : 'unskilled';
  return w + ' ' + best.s;
}
function withSkillRate(origFn, skill, xpAmt){
  return function(v, step, dtH){
    const before = step.prog || 0;
    const r = origFn(v, step, dtH);
    if(step.prog > before) step.prog = before + (step.prog - before) * skillMult(v, skill);
    if(r === true && xpAmt) gainXP(v, skill, xpAmt);
    return r;
  };
}
