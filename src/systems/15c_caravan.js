/* =====================================================================
   PART 15C: TRAVELING MERCHANT CARAVAN — each season change a small
   group of outsider traders camps near the village for a day: exotic
   stock (spice, cloth, knives, salt), wants hides/smoked meat/eggs.
   Fixed prices with familiarity haggling (mechanical, no dialogue —
   words belong to the AI brain). Guards count as a group vs wolves.
   Phase 6D (D2): Genuinely demand-driven stock via Economy.consumeDemands(),
   exclusive salt restocking for Sella's shop, capacity-capped supply.
   ===================================================================== */
const CARAVAN_BASE_STOCK = { spice: 6, cloth: 8, knife: 2, salt: 10 };
const CARAVAN_CAPACITY = {
  spice: 25, cloth: 30, knife: 10, salt: 40,
  bread: 30, fish: 20, egg: 25, meal: 15, cookedFish: 15, cookedMeat: 15
};
const CARAVAN_DEFAULT_CAP = 30;
const CARAVAN_DEMAND_K = 1.0;

const CARAVAN = {
  active: false,
  inTown: false,
  campT: 0,
  members: [],
  stock: {},
  manifest: {},
  lastDemands: {},
  sellP: {},
  buyP: {}
};
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
  CARAVAN.active = true;
  CARAVAN.inTown = true;
  CARAVAN.campT = 14;
  CARAVAN.members = [];

  // 1. Demand-signal interface: snapshot + clear accumulated unmet demands
  const demands = (typeof Economy !== 'undefined' && typeof Economy.consumeDemands === 'function')
    ? Economy.consumeDemands()
    : {};
  CARAVAN.lastDemands = Object.assign({}, demands);

  // 2. Genuinely demand-driven stock calculation: baseQty + k * demandQty, capped by capacity (zero RNG).
  // Provenance (SPEC 7E.4): the caravan's stock represents goods bought at
  // its origin — salt is mined in the eastern region (see 'arrived from the
  // east') and traded in; it is produced THERE, never spawned inside the
  // village boundary. Goods villagers sell to the caravan are added to
  // stock in doTradeStep, so village-side conservation holds exactly.
  CARAVAN.stock = {};
  CARAVAN.sellP = { spice: 12, cloth: 8, knife: 25, salt: 3 };
  CARAVAN.buyP = { hide: 6, smokedMeat: 5, egg: 2, rawMeat: 3, berries: 1, bread: 4 };

  for(const item of Object.keys(CARAVAN_BASE_STOCK)){
    const base = CARAVAN_BASE_STOCK[item];
    const d = demands[item] || 0;
    const cap = CARAVAN_CAPACITY[item] || CARAVAN_DEFAULT_CAP;
    CARAVAN.stock[item] = Math.min(cap, Math.max(0, Math.round(base + CARAVAN_DEMAND_K * d)));
  }

  for(const item of Object.keys(demands)){
    if(CARAVAN.stock[item] != null) continue;
    const d = demands[item];
    if(d > 0){
      const cap = CARAVAN_CAPACITY[item] || CARAVAN_DEFAULT_CAP;
      CARAVAN.stock[item] = Math.min(cap, Math.max(0, Math.round(CARAVAN_DEMAND_K * d)));
      if(CARAVAN.sellP[item] == null){
        CARAVAN.sellP[item] = (typeof Economy !== 'undefined' && Economy.getPrice)
          ? Economy.getPrice(item, 'shop')
          : ((typeof SHOP !== 'undefined' && SHOP.floorPrice && SHOP.floorPrice[item]) || 5);
      }
    }
  }

  CARAVAN.manifest = Object.assign({}, CARAVAN.stock);

  // 3. Restock Sella's shop: caravan is the ONLY source of salt for the village.
  // Demanded shop commodities are also delivered into SHOP.stock.
  if(typeof SHOP !== 'undefined' && SHOP.stock){
    // Salt is exclusively restocked via the traveling caravan
    const saltBrought = CARAVAN.stock.salt || 0;
    SHOP.stock.salt = (SHOP.stock.salt || 0) + saltBrought;

    // Restock any other shop goods that recorded unmet demand signals
    for(const item of Object.keys(demands)){
      if(item === 'salt') continue;
      if(SHOP.stock[item] != null && (CARAVAN.stock[item] || 0) > 0){
        SHOP.stock[item] = (SHOP.stock[item] || 0) + CARAVAN.stock[item];
      }
    }
  }

  const cx = 4 * CS + 16, cy = 2 * CS + 16;
  CARAVAN.x = cx;
  CARAVAN.y = cy;
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
  CARAVAN.members = [];
  CARAVAN.active = false;
  CARAVAN.inTown = false;
  CARAVAN.stock = {};
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
    if((CARAVAN.stock[what] || 0) <= 0){
      if(typeof Economy !== 'undefined' && typeof Economy.recordDemand === 'function'){
        Economy.recordDemand(what, 1);
      }
      v.thoughts = [{ text: 'The caravan is out of ' + what, val: -1 }];
      return true;
    }
    const cost = Math.max(1, Math.ceil(price * (1 - disc)));
    if((v.gold || 0) < cost){ v.thoughts = [{ text: 'Cannot afford ' + what, val: -2 }]; return true; }
    v.gold -= cost; m.gold = (m.gold || 0) + cost; CARAVAN.stock[what]--;
    addInv(v, what, 1); m.memory[v.name] = fam + 1;
    witnessEvent(v, 'Bought ' + what + ' from the caravan for ' + cost + ' gold');
    logEvent('trade', v.name + ' bought ' + what + ' (' + cost + 'g)');
  } else {
    let price = CARAVAN.buyP[what];
    if(price == null && what === 'bread'){
      price = 4;
      CARAVAN.buyP.bread = 4;
    }
    if(price == null){ v.thoughts = [{ text: 'The traders do not want ' + what, val: -1 }]; return true; }
    const qty = (step.qty != null && step.qty > 0) ? Math.floor(step.qty) : 1;
    if((v.inv[what] || 0) < qty){ v.thoughts = [{ text: 'Nothing to sell', val: -1 }]; return true; }

    let gain = 0, unitPrice = 0;
    if(typeof getCaravanGuildSellPrice === 'function'){
      const sellInfo = getCaravanGuildSellPrice(what, v, qty, price, disc);
      gain = sellInfo.totalPrice;
      unitPrice = sellInfo.unitPrice;
    } else {
      unitPrice = Math.max(1, Math.floor(price * (1 + disc * 0.5)));
      gain = unitPrice * qty;
    }

    if((m.gold || 0) < gain){ v.thoughts = [{ text: 'The trader cannot afford it', val: -1 }]; return true; }
    v.inv[what] -= qty;
    stripItemProvenance(v, what, qty);
    m.gold -= gain;
    v.gold = (v.gold || 0) + gain;
    CARAVAN.stock[what] = (CARAVAN.stock[what] || 0) + qty;
    m.memory[v.name] = fam + 1;
    witnessEvent(v, 'Sold ' + qty + ' ' + what + ' to the caravan for ' + gain + ' gold' + (qty > 1 ? ' (' + unitPrice + 'g/ea)' : ''));
    logEvent('trade', v.name + ' sold ' + qty + ' ' + what + ' (' + gain + 'g' + (qty > 1 ? ', ' + unitPrice + 'g/ea' : '') + ')');
  }
  return true;
}
window.__aiBridge.getCaravan = function(){
  if(!CARAVAN.active) return null;
  return {
    active: CARAVAN.active,
    inTown: CARAVAN.inTown,
    stock: Object.assign({}, CARAVAN.stock),
    manifest: Object.assign({}, CARAVAN.manifest || CARAVAN.stock),
    lastDemands: Object.assign({}, CARAVAN.lastDemands || {}),
    sellP: Object.assign({}, CARAVAN.sellP),
    buyP: Object.assign({}, CARAVAN.buyP)
  };
};
