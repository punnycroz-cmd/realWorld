/* =====================================================================
   PART 15C: TRAVELING MERCHANT CARAVAN — each season change a small
   group of outsider traders camps near the village for a day: exotic
   stock (spice, cloth, knives, salt), wants hides/smoked meat/eggs.
   Fixed prices with familiarity haggling (mechanical, no dialogue —
   words belong to the AI brain). Guards count as a group vs wolves.
   ===================================================================== */
const CARAVAN = { active: false, campT: 0, members: [], stock: {}, sellP: {}, buyP: {} };
const TRADER_NAMES = ['Yusuf', 'Petra', 'Dain'];
function mkCaravanMember(name, role, wx, wy){
  const v = mkTestV13(name, wx, wy, { role: role, outsider: true, brainControlled: true });
  v.gold = 200; v.grudges = {}; v.rivals = {}; v.invAge = {}; v.taintedMeals = {};
  v.memory = {};
  ensureSkills(v);
  if(role === 'caravan guard'){
    v.skills.hunting = { lvl: 4, xp: 0 };
    v.equippedTool = { kind: 'sword', name: 'Sword', icon: '', desc: '' };
  }
  return v;
}
function arriveCaravan(){
  if(CARAVAN.active) return;
  CARAVAN.active = true; CARAVAN.campT = 14; CARAVAN.members = [];
  CARAVAN.stock = { spice: 6, cloth: 8, knife: 2, salt: 10 };
  CARAVAN.sellP = { spice: 12, cloth: 8, knife: 25, salt: 3 };
  CARAVAN.buyP = { hide: 6, smokedMeat: 5, egg: 2, rawMeat: 3, berries: 1 };
  const cx = 4 * CS + 16, cy = 2 * CS + 16;
  const roles = ['spice trader', 'caravan guard', 'caravan guard'];
  for(let i = 0; i < 3; i++){
    const m = mkCaravanMember(TRADER_NAMES[i], roles[i], 34 + i * 2, -20);
    m.plan = [{ verb: 'go', tx: cx + i * CS, ty: cy }, { verb: 'wait', hours: 10 }];
    CARAVAN.members.push(m);
  }
  logEvent('caravan', 'A traveling caravan arrived from the east!');
  showToast('🐪 A merchant caravan has arrived!');
  for(const v of VILLAGERS){
    if(!v.outsider && !v.dead) witnessEvent(v, 'A merchant caravan arrived!');
  }
}
function departCaravan(){
  for(const m of CARAVAN.members){
    const i = VILLAGERS.indexOf(m);
    if(i >= 0) VILLAGERS.splice(i, 1);
  }
  CARAVAN.members = []; CARAVAN.active = false; CARAVAN.stock = {};
  logEvent('caravan', 'The caravan packed up and departed.');
  showToast('🐪 The caravan departed.');
}
function caravanTick(dtH){
  if(!CARAVAN.active) return;
  CARAVAN.campT -= dtH;
  if(CARAVAN.campT <= 0) departCaravan();
}
function doTradeStep(v, step, dtH){
  if(!CARAVAN.active || !CARAVAN.members.length){ v.thoughts = [{ text: 'No caravan in the village', val: -1 }]; return true; }
  let m = null, bd = 1e9;
  for(const t of CARAVAN.members){
    if(t.dead) continue;
    const d = Math.hypot(t.x - v.x, t.y - v.y);
    if(d < bd){ bd = d; m = t; }
  }
  if(!m) return true;
  if(bd > CS * 2.5){
    const r = planMoveToward(v, m.x, m.y, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'chat'; v.moving = false;
  const what = step.what || 'spice', buy = step.buy !== false;
  m.memory = m.memory || {};
  const fam = m.memory[v.name] || 0;
  const disc = Math.min(0.15, 0.03 * fam);
  if(buy){
    const price = CARAVAN.sellP[what];
    if(price == null){ v.thoughts = [{ text: 'The traders do not sell ' + what, val: -1 }]; return true; }
    if((CARAVAN.stock[what] || 0) <= 0){ v.thoughts = [{ text: 'The caravan is out of ' + what, val: -1 }]; return true; }
    const cost = Math.max(1, Math.ceil(price * (1 - disc)));
    if((v.gold || 0) < cost){ v.thoughts = [{ text: 'Cannot afford ' + what, val: -2 }]; return true; }
    v.gold -= cost; m.gold = (m.gold || 0) + cost; CARAVAN.stock[what]--;
    addInv(v, what, 1); m.memory[v.name] = fam + 1;
    witnessEvent(v, 'Bought ' + what + ' from the caravan for ' + cost + ' gold');
    logEvent('trade', v.name + ' bought ' + what + ' (' + cost + 'g)');
  } else {
    const price = CARAVAN.buyP[what];
    if(price == null){ v.thoughts = [{ text: 'The traders do not want ' + what, val: -1 }]; return true; }
    if((v.inv[what] || 0) <= 0){ v.thoughts = [{ text: 'Nothing to sell', val: -1 }]; return true; }
    const gain = Math.max(1, Math.floor(price * (1 + disc * 0.5)));
    if((m.gold || 0) < gain){ v.thoughts = [{ text: 'The trader cannot afford it', val: -1 }]; return true; }
    v.inv[what]--; stripItemProvenance(v, what, 1); m.gold -= gain; v.gold = (v.gold || 0) + gain;
    CARAVAN.stock[what] = (CARAVAN.stock[what] || 0) + 1;
    m.memory[v.name] = fam + 1;
    witnessEvent(v, 'Sold ' + what + ' to the caravan for ' + gain + ' gold');
    logEvent('trade', v.name + ' sold ' + what + ' (' + gain + 'g)');
  }
  return true;
}
window.__aiBridge.getCaravan = function(){
  if(!CARAVAN.active) return null;
  return { stock: Object.assign({}, CARAVAN.stock),
    sellP: Object.assign({}, CARAVAN.sellP), buyP: Object.assign({}, CARAVAN.buyP) };
};
