/* =====================================================================
   PART 14C: DANGEROUS WILDLIFE — wolves (pack hunters), boars
   (territorial chargers), bears (rare, food-driven, very dangerous).
   Villagers flee, fight back when cornered/brave, shout for help.
   `hunt` verb + carcasses extend the existing butcher pipeline.
   ===================================================================== */
const ANIMALS = [], CARCASSES = [], FENCES = [], COOPS = [];
const ANIMAL_DEFS = {
  wolf: { hp: 10, spd: 100, dmg: 0.28 },
  boar: { hp: 16, spd: 72, dmg: 0.38 },
  bear: { hp: 40, spd: 82, dmg: 0.75 }
};
function spawnAnimal(kind, x, y, pack){
  const d = ANIMAL_DEFS[kind];
  const a = {
    kind: kind, x: x, y: y, state: 'wander', t: srand() * 2,
    hp: d.hp, maxhp: d.hp, hunger: 0.4 + srand() * 0.3,
    pack: pack || null, tx: x, ty: y, atkCd: 0, dead: false
  };
  ANIMALS.push(a);
  return a;
}
function initWildlife(){
  ANIMALS.length = 0; CARCASSES.length = 0;
  spawnAnimal('boar', -20 * CS + 16, -14 * CS + 16);
  spawnAnimal('boar', 24 * CS + 16, -16 * CS + 16);
}
function fenceNear(x, y, cells){
  for(const f of FENCES) if(Math.hypot(f.x - x, f.y - y) < (cells || 4) * CS) return true;
  return false;
}
function moveAnimal(a, tx, ty, dtH, scale){
  const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
  if(d < 6) return true;
  const def = ANIMAL_DEFS[a.kind];
  let sp = def.spd * (Math.min(dtH, 0.03) * 60) * (scale || 1);
  sp = Math.min(sp, d);
  const nx = a.x + dx / d * sp, ny = a.y + dy / d * sp;
  const r = canMoveTo(nx, ny, null);
  if(r.ok){ a.x = nx; a.y = ny; }
  else a.t = 0;
  return false;
}
function toolPower(v){
  const k = v.equippedTool && v.equippedTool.kind;
  const P = { sword: 4, axe: 3, hammer: 2.5, hoe: 1.6, knife: 2, rod: 0.5, mug: 0.4, ball: 0.3, scroll: 0.2, broom: 0.6, rollingpin: 0.8, lute: 0.5, basket: 0.4, pitchfork: 2 };
  return P[k] || 0.8;
}
function killAnimal(a, by){
  if(a.dead) return;
  a.dead = true;
  const i = ANIMALS.indexOf(a); if(i >= 0) ANIMALS.splice(i, 1);
  CARCASSES.push({
    kind: a.kind, x: a.x, y: a.y,
    meat: a.kind === 'bear' ? 6 : (a.kind === 'boar' ? 4 : 3),
    hide: a.kind === 'bear' ? 3 : (a.kind === 'boar' ? 2 : 1)
  });
  logEvent('hunt', (by ? by.name + ' ' : '') + 'killed a ' + a.kind);
  if(by){
    witnessEvent(by, 'Killed a ' + a.kind);
    gainXP(by, 'hunting', 8);
    if(typeof observe === 'function'){
      observe(by, { event: 'repelled_wolf', what: 'defended village against ' + a.kind }, {
        topic: 'village_protector',
        salience: 0.92,
        source: 'direct',
        bypassAttention: true
      });
    }
  }
  for(const o of ANIMALS){
    if(o.pack && o.pack === a.pack && !o.dead){ o.state = 'flee'; o.hp = Math.min(o.hp, o.maxhp * 0.5); }
  }
}
function fightBack(v, a){
  if(v.dead || v.downed || a.dead) return;
  const cornered = v.inBuilding;
  const brave = skillLvl(v, 'hunting') >= 3 || v.name === 'Gareth';
  if(!cornered && !brave) return; // others rely on fleeing
  const pow = toolPower(v) + skillLvl(v, 'hunting') * 0.35;
  a.hp -= pow;
  v.state = 'fight';
  gainXP(v, 'hunting', 5);
  witnessEvent(v, 'Fighting off a ' + a.kind + '!');
  if(a.hp <= 0) killAnimal(a, v);
}
function shoutForHelp(victim, threat){
  showToast('🆘 ' + victim.name + ' shouts for help!');
  witnessEvent(victim, 'Shouted for help!');
  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
    FeelingSubstrate.receiveSignal(victim, FeelingSubstrate.normalizeEvent(threat && threat.kind ? threat.kind : 'wolf', null, {
      source: 'attacked',
      threat: threat && threat.kind
    }));
  }
  // Phase 6E E3: Physical acoustic sound propagation with distance falloff
  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.propagateSound === 'function'){
    FeelingSubstrate.propagateSound({
      kind: 'scream',
      originX: victim.x,
      originY: victim.y,
      source: victim,
      radius: 25,
      metadata: { victim: victim.name, threat: threat && threat.kind }
    });
  }
  for(const o of VILLAGERS){
    if(o === victim || o.dead || o.downed || o.brainControlled) continue;
    if(Math.hypot(o.x - victim.x, o.y - victim.y) > CS * 14) continue;
    if(o.plan && o.plan.length) continue;
    const bond = (o.bonds && o.bonds[victim.name]) || 0;
    const brave = skillLvl(o, 'hunting') >= 2 || o.name === 'Gareth';
    if(bond > 0.35 || brave){
      o.plan = [{ verb: 'go', tx: victim.x, ty: victim.y }, { verb: 'hunt', kind: threat.kind, targetAnimal: threat }];
      witnessEvent(o, 'Running to help ' + victim.name + '!');
    }
  }
}
function wolfBrain(a, dtH){
  const px = a.x, py = a.y;
  const fireNear = FIRES.some(f => f.burnH > 0 && Math.hypot(f.x - px, f.y - py) < CS * 5);
  const villsNear = VILLAGERS.filter(v => !v.dead && !v.downed && Math.hypot(v.x - px, v.y - py) < CS * 7);
  const torchNear = (typeof TORCHES !== 'undefined' && TORCHES.some(t => Math.hypot(t.x - px, t.y - py) < CS * 5)) ||
                    (typeof VILLAGE_OBJECTS !== 'undefined' && VILLAGE_OBJECTS.some(o => (o.kind === 'torch' || o.torch) && Math.hypot(o.x - px, o.y - py) < CS * 5)) ||
                    villsNear.some(v => v.hasTorch || v.torch || (v.inv && v.inv.torch > 0) || (v.equippedTool && (v.equippedTool === 'torch' || v.equippedTool.kind === 'torch')));

  const isStarving = Boolean(a.starving || a.extremeHunger || (a.hunger != null && a.hunger >= 0.8));
  const crowdDeterred = villsNear.length >= 3 || villsNear.some(v => v.name === 'Gareth');
  const fireDeterred = fireNear || torchNear;

  // 2-state wolf: normally deterred by fire/torch/crowd; EXTREME hunger overrides fear!
  if((fireDeterred || crowdDeterred) && !isStarving){
    const ang = Math.atan2(py, px);
    moveAnimal(a, px + Math.cos(ang) * CS * 10, py + Math.sin(ang) * CS * 10, dtH, 1.2);
    a.state = 'flee'; return;
  }
  let target = null, tKind = null, bd = 1e9;
  for(const v of VILLAGERS){
    if(v.dead || v.downed || v.inBuilding) continue;
    const d = Math.hypot(v.x - px, v.y - py);
    if(d > CS * 26) continue;
    let companions = 0;
    for(const o of VILLAGERS){
      if(o === v || o.dead) continue;
      if(Math.hypot(o.x - v.x, o.y - v.y) < CS * 8) companions++;
    }
    const targetHasTorch = v.hasTorch || v.torch || (v.inv && v.inv.torch > 0) || (v.equippedTool && (v.equippedTool === 'torch' || v.equippedTool.kind === 'torch'));
    if(targetHasTorch && !isStarving) continue;
    if(companions >= 2 && !isStarving) continue;
    if(fenceNear(v.x, v.y, 6) && !isStarving) continue;
    if(d < bd){ bd = d; target = v; tKind = 'villager'; }
  }
  for(const c of CHICKENS){
    const d = Math.hypot(c.x - px, c.y - py);
    if(d < CS * 20 && d < bd){ bd = d; target = c; tKind = 'chicken'; }
  }
  if(!target || a.hunger < 0.35){
    a.t -= dtH;
    if(a.t <= 0){
      a.t = 2 + srand() * 3;
      const an = srand() * Math.PI * 2;
      a.tx = px + Math.cos(an) * CS * 8; a.ty = py + Math.sin(an) * CS * 8;
    }
    moveAnimal(a, a.tx, a.ty, dtH, 0.4);
    a.state = 'wander'; return;
  }
  const td = Math.hypot(target.x - px, target.y - py);
  if(td > CS * 1.8){
    moveAnimal(a, target.x, target.y, dtH, 1.0);
    a.state = 'stalk';
  } else if(a.atkCd <= 0){
    a.state = 'attack';
    // Phase 4 balance: slightly slower wolf attack cadence (0.4->0.55h) so a
    // lone victim's flee has a chance and wounds don't stack quite as fast.
    // A bite stays dangerous (dmg unchanged).
    a.atkCd = 0.55;
    if(tKind === 'chicken'){
      const i = CHICKENS.indexOf(target); if(i >= 0) CHICKENS.splice(i, 1);
      a.hunger = Math.max(0, a.hunger - 0.5);
      logEvent('wildlife', 'A wolf took a chicken');
    } else {
      const loc = ['arm', 'leg', 'torso'][Math.floor(srand() * 3)];
      addWound(target, loc, ANIMAL_DEFS.wolf.dmg * (0.8 + srand() * 0.4));
      learnDanger(target, 'wolf attack');
      if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.propagateSound === 'function'){
        FeelingSubstrate.propagateSound({
          kind: 'wolf_growl',
          originX: a.x,
          originY: a.y,
          source: a,
          radius: 20,
          metadata: { animal: 'wolf', target: target.name }
        });
      }
      shoutForHelp(target, a);
      fightBack(target, a);
      // Phase 4 balance: a solid bite satiates (0.2->0.35) — a wolf bites
      // once or twice then leaves, instead of mauling one victim endlessly.
      // Packs are still dangerous (multiple wolves = multiple bites).
      a.hunger = Math.max(0, a.hunger - 0.35);
    }
  }
}
function boarBrain(a, dtH){
  let vd = null, vbd = 1e9;
  for(const v of VILLAGERS){
    if(v.dead || v.downed) continue;
    const d = Math.hypot(v.x - a.x, v.y - a.y);
    if(d < vbd){ vbd = d; vd = v; }
  }
  if(vd && vbd < CS * 3.5 && a.atkCd <= 0 && a.hunger > 0.25){
    a.atkCd = 1.2;
    const loc = ['leg', 'torso'][Math.floor(srand() * 2)];
    addWound(vd, loc, ANIMAL_DEFS.boar.dmg * (0.8 + srand() * 0.4));
    learnDanger(vd, 'boar charge');
    witnessEvent(vd, 'Charged by a wild boar!');
    fightBack(vd, a);
    return;
  }
  a.t -= dtH;
  if(a.t <= 0){
    a.t = 2 + srand() * 3;
    const an = srand() * Math.PI * 2;
    a.tx = a.x + Math.cos(an) * CS * 6; a.ty = a.y + Math.sin(an) * CS * 6;
  }
  moveAnimal(a, a.tx, a.ty, dtH, 0.3);
  a.state = 'wander';
}
function bearBrain(a, dtH){
  const fireNear = FIRES.some(f => f.burnH > 0 && Math.hypot(f.x - a.x, f.y - a.y) < CS * 6);
  let tx = null, ty = null, bd = 1e9, pile = null;
  for(const p of PILES){
    const food = (p.items.bread || 0) + (p.items.fish || 0) + (p.items.rawMeat || 0) +
                 (p.items.egg || 0) + (p.items.berries || 0) + (p.items.cookedFish || 0) + (p.items.cookedMeat || 0);
    if(food <= 0) continue;
    const d = Math.hypot(p.x - a.x, p.y - a.y);
    if(d < bd){ bd = d; tx = p.x; ty = p.y; pile = p; }
  }
  for(const v of VILLAGERS){
    if(v.dead && !v.buried){
      const d = Math.hypot(v.x - a.x, v.y - a.y);
      if(d < bd){ bd = d; tx = v.x; ty = v.y; pile = null; }
    }
  }
  if(tx != null && !fireNear && bd < CS * 40 && bd > CS * 1.5){
    moveAnimal(a, tx, ty, dtH, 0.8);
    a.state = 'stalk'; return;
  }
  if(tx != null && bd <= CS * 1.5 && !fireNear){
    a.state = 'eat';
    if(pile){
      for(const k of Object.keys(pile.items)){
        if(pile.items[k] > 0){ pile.items[k]--; break; }
      }
      cleanPile(pile);
    }
    a.hunger = Math.max(0, a.hunger - 0.15);
    return;
  }
  let vd = null, vbd = 1e9;
  for(const v of VILLAGERS){
    if(v.dead || v.downed) continue;
    const d = Math.hypot(v.x - a.x, v.y - a.y);
    if(d < vbd){ vbd = d; vd = v; }
  }
  if(vd && vbd < CS * 3 && a.atkCd <= 0){
    a.atkCd = 0.6;
    addWound(vd, ['torso', 'arm', 'head'][Math.floor(srand() * 3)], ANIMAL_DEFS.bear.dmg * (0.8 + srand() * 0.4));
    learnDanger(vd, 'bear attack');
    shoutForHelp(vd, a);
    fightBack(vd, a);
    return;
  }
  a.t -= dtH;
  if(a.t <= 0){
    a.t = 3 + srand() * 4;
    const an = srand() * Math.PI * 2;
    a.tx = a.x + Math.cos(an) * CS * 10; a.ty = a.y + Math.sin(an) * CS * 10;
  }
  moveAnimal(a, a.tx, a.ty, dtH, 0.35);
  a.state = 'wander';
}
function animalBrain(a, dtH){
  if(a.dead) return;
  if(a.hp < a.maxhp * 0.35 && a.kind !== 'bear'){
    let bv = null, bd = 1e9;
    for(const v of VILLAGERS){
      if(v.dead) continue;
      const d = Math.hypot(v.x - a.x, v.y - a.y);
      if(d < bd){ bd = d; bv = v; }
    }
    if(bv && bd < CS * 20){
      const ang = Math.atan2(a.y - bv.y, a.x - bv.x);
      moveAnimal(a, a.x + Math.cos(ang) * CS * 12, a.y + Math.sin(ang) * CS * 12, dtH, 1.25);
      a.state = 'flee'; return;
    }
  }
  if(a.kind === 'wolf') wolfBrain(a, dtH);
  else if(a.kind === 'boar') boarBrain(a, dtH);
  else bearBrain(a, dtH);
}
let animSlowAcc = 0;
function animalFrameTick(dtH){
  const step = Math.min(dtH, 0.03);
  const wolfRate = (typeof W !== 'undefined' && W.season === 'Winter') ? 0.022 : 0.012;
  for(const a of ANIMALS.slice()){
    if(a.dead) continue;
    // Phase 4 balance + 6B season: wolves hunt more aggressively in winter
    a.hunger = clamp((a.hunger || 0) + dtH * (a.kind === 'wolf' ? wolfRate : 0.012), 0, 1);
    a.atkCd = Math.max(0, (a.atkCd || 0) - dtH);
    animalBrain(a, step);
    if(a.hp <= 0) killAnimal(a, null);
  }
  animSlowAcc += dtH;
  if(animSlowAcc >= 2){ const h = animSlowAcc; animSlowAcc = 0; worldSlowTick(h); }
}
function worldSlowTick(h){
  if(isNight()){
    const wolves = ANIMALS.filter(a => a.kind === 'wolf' && !a.dead).length;
    // Phase 4 balance: nightly wolf pressure was a siege (packs of up to 4,
    // ~70%/2h spawn). Fewer, smaller packs: still dangerous, not extinction.
    if(wolves < 3 && srand() < 0.22 * h){
      const pack = 'p' + W.day + '_' + Math.floor(srand() * 9999);
      const n = 2 + (srand() < 0.5 ? 1 : 0);
      const ang = srand() * Math.PI * 2;
      for(let i = 0; i < n; i++)
        spawnAnimal('wolf', Math.cos(ang) * (26 + i * 2) * CS + 16, Math.sin(ang) * (22 + i * 2) * CS + 16, pack);
      logEvent('wildlife', 'Wolves howl in the dark beyond the village');
      showToast('🐺 Wolves prowl near the village...');
    }
  } else {
    for(const a of ANIMALS.slice()){
      if(a.kind === 'wolf' && a.hunger < 0.55){
        const i = ANIMALS.indexOf(a); if(i >= 0) ANIMALS.splice(i, 1);
      }
    }
  }
  // 6B: 4 seasons affect huntable game — bears hibernate during winter!
  if((typeof W === 'undefined' || W.season !== 'Winter') && srand() < 0.02 * h && !ANIMALS.some(a => a.kind === 'bear' && !a.dead)){
    const ang = srand() * Math.PI * 2;
    spawnAnimal('bear', Math.cos(ang) * 30 * CS + 16, Math.sin(ang) * 26 * CS + 16);
    logEvent('wildlife', 'A bear has been sighted in the wilds');
  }
  if(W.storm > 0.7){
    for(const b of VILLAGE_BUILDINGS){
      bInteg(b);
      if(b.integrity > 0.2 && srand() < 0.3 * h) b.integrity = Math.max(0.2, b.integrity - 0.06);
    }
  }
  for(let i = CARCASSES.length - 1; i >= 0; i--){
    const c = CARCASSES[i];
    c.age = (c.age || 0) + h;
    if(c.age > 48) CARCASSES.splice(i, 1); // unbutchered carcasses rot away after 2 days
  }
}
function doHuntStep(v, step, dtH){
  let a = step.targetAnimal;
  if(!a || a.dead || ANIMALS.indexOf(a) === -1){
    a = null; let bd = 1e9;
    for(const o of ANIMALS){
      if(o.dead) continue;
      if(step.kind && step.kind !== 'any' && o.kind !== step.kind) continue;
      const d = Math.hypot(o.x - v.x, o.y - v.y);
      if(d < bd){ bd = d; a = o; }
    }
    if(!a){ v.thoughts = [{ text: 'No game to be found', val: -1 }]; return true; }
    step.targetAnimal = a;
  }
  const d = Math.hypot(a.x - v.x, a.y - v.y);
  if(d > CS * 1.8){
    const r = planMoveToward(v, a.x, a.y, dtH);
    v.state = 'hunt'; v.moving = true;
    return r === 'stuck' ? true : false;
  }
  v.state = 'fight'; v.moving = false;
  step.atkT = (step.atkT || 0) + dtH;
  if(step.atkT >= 0.35){
    step.atkT = 0;
    const pow = (toolPower(v) + skillLvl(v, 'hunting') * 0.4) * (hasFracture(v, 'arm') ? 0.5 : 1);
    a.hp -= pow;
    gainXP(v, 'hunting', 2);
    witnessEvent(v, 'Struck the ' + a.kind);
    if(!a.dead && a.hp > 0 && (a.kind === 'boar' || a.kind === 'bear') && srand() < 0.5){
      const loc = ['leg', 'torso', 'arm'][Math.floor(srand() * 3)];
      addWound(v, loc, ANIMAL_DEFS[a.kind].dmg * 0.7);
      learnDanger(v, a.kind + ' fight');
    }
    if(a.hp <= 0){ killAnimal(a, v); return true; }
  }
  return false;
}
