/* =====================================================================
   PART 13B: ECONOMY — gold, Sella's shop, buy/sell verbs.
   Gold is conserved: buyer pays, seller receives, stock is real.
   Phase 6D (D1): Scarcity pricing, demand signal API, expectation
   violation purchase cancel / substitution, absolute material conservation.
   ===================================================================== */
const SHOP = {
  stock: { bread:20, fish:8, egg:12, meal:6, cookedFish:6, cookedMeat:6, salt:10 },
  floorPrice: { bread:3, fish:5, egg:2, meal:9, cookedFish:7, cookedMeat:8, salt:3 },
  sellPrice: { bread:2, fish:3, egg:1, meal:6, cookedFish:4, cookedMeat:5, crop:1, berries:1, log:1, stone:1, salt:2 },
  priceOverrides: {}
};
FOOD_VAL.rawMeat = 0.12; FOOD_VAL.cookedMeat = 0.55; FOOD_VAL.meal = 0.7;
const __firstFood12 = firstFood;
firstFood = function(v){
  for(const f of ['meal', 'cookedMeat', 'cookedFish', 'bread', 'fish', 'crop', 'egg', 'berries', 'rawMeat'])
    if((v.inv[f] || 0) > 0) return f;
  return null;
};
function shopkeeper(){ return VILLAGERS.find(v => v.name === 'Sella' && !v.dead) || null; }
function innkeeper(){ return VILLAGERS.find(v => v.name === 'Tobin' && !v.dead) || null; }
const INN = {
  stock: { meal:10, cookedMeat:8, cookedFish:8, bread:12, ale:15 },
  floorPrice: { meal:8, cookedMeat:7, cookedFish:6, bread:3, ale:2, room:2 },
  sellPrice: {},
  priceOverrides: {}
};

/* ---- Phase 6D (D1): Scarcity Pricing & Demand-Signal Engine ----
   NO magic constants: weeklyConsumption is grounded in village population
   and physiological daily caloric burn (calLoss ~0.48 satiety/day in bodyTick,
   meaning ~1 food unit per villager per day -> 7 units/week per capita).
   Scarcity = max(0, 1 - stock / weeklyConsumption).
   Price = floorPrice * (1 + scarcity) * seasonMult. */

const WEEKLY_PER_CAPITA_DEMAND = {
  bread: 1.5,       // Primary grain staple (~1.5 loaves/week per capita)
  egg: 1.0,         // Poultry produce (~1 egg/week per capita)
  fish: 0.7,        // River/pond catch (~0.7 fish/week per capita)
  cookedFish: 0.5,  // Prepared fish
  cookedMeat: 0.5,  // Prepared butcher meat
  meal: 0.5,        // Hearty prepared meal
  salt: 0.8,        // Preservation & curing requirement (~0.8 salt/week per capita)
  crop: 1.2,        // Farm produce
  berries: 0.8,     // Foraged fruit
  rawMeat: 0.6,     // Butchered meat
  spice: 0.2,       // Luxury caravan import
  cloth: 0.3,       // Garment repair
  knife: 0.1        // Durable tool
};

const ITEM_SUBSTITUTES = {
  salt: 'fish',         // Fresh food instead of preserving / salting
  saltedMeat: 'fish',   // Fresh food instead of cured meat
  smokedMeat: 'fish',   // Fresh food instead of smoked meat
  cookedMeat: 'fish',
  meal: 'cookedFish'
};

const Economy = {
  demands: {},
  demandLog: [],
  trackedWeeklyConsumption: {},
  recentTransactions: [],

  /* Demand-signal API for caravan (Task 2) and market systems */
  recordDemand(itemId, qtyUnmet){
    const qty = (qtyUnmet != null && !isNaN(qtyUnmet)) ? Number(qtyUnmet) : 1;
    if(!itemId || qty <= 0) return;
    this.demands[itemId] = (this.demands[itemId] || 0) + qty;
    const now = (typeof W !== 'undefined' && W && W.day != null) ? (W.day + (W.tod || 0)/24) : 0;
    this.demandLog.push({ itemId, qty, time: now });
    if(this.demandLog.length > 200) this.demandLog.shift();
    logEvent('trade', 'Demand signal: unmet demand for ' + itemId + ' (+' + qty + ', total: ' + this.demands[itemId] + ')');
  },

  getDemand(itemId){
    return this.demands[itemId] || 0;
  },

  getAllDemands(){
    return Object.assign({}, this.demands);
  },

  consumeDemands(){
    const snapshot = Object.assign({}, this.demands);
    this.demands = {};
    return snapshot;
  },

  resetDemand(itemId){
    if(itemId) delete this.demands[itemId];
    else this.demands = {};
  },

  /* Population-based weekly consumption — zero magic numbers */
  getWeeklyConsumption(itemId){
    if(this.trackedWeeklyConsumption && (this.trackedWeeklyConsumption[itemId] || 0) > 0){
      return this.trackedWeeklyConsumption[itemId];
    }
    let pop = 8;
    if(typeof VILLAGERS !== 'undefined' && Array.isArray(VILLAGERS) && VILLAGERS.length > 0){
      const residents = VILLAGERS.filter(v => !v.dead && !v.outsider && v.role !== 'Test' && (!v.name || (!v.name.startsWith('Test') && !v.name.startsWith('T24_') && !v.name.startsWith('T20_') && !v.name.startsWith('T25_') && !v.name.startsWith('T26_'))));
      if(residents.length > 0){
        let count = 0;
        for(const v of residents){
          if(v.stage === 'child' || (v.ageY != null && v.ageY <= 12)) count += 0.5;
          else if(v.stage === 'elder' || (v.ageY != null && v.ageY >= 60)) count += 0.85;
          else count += 1.0;
        }
        pop = Math.max(1, count);
      }
    }
    const perCapita = WEEKLY_PER_CAPITA_DEMAND[itemId] || 1.0;
    return Math.max(1, Math.round(pop * perCapita));
  },

  /* Scarcity = max(0, 1 - stock / weeklyConsumption) */
  getScarcity(itemId, stock){
    const wc = this.getWeeklyConsumption(itemId);
    if(wc <= 0) return 0;
    const s = (stock != null) ? stock : (SHOP.stock[itemId] || 0);
    return Math.max(0, 1 - s / wc);
  },

  /* Season multiplier: food is pricier in winter, 1.0 otherwise */
  getSeasonMult(itemId){
    const season = (typeof W !== 'undefined' && W && W.season) ? W.season : 'Spring';
    const isFood = Boolean(
      (typeof FOOD_VAL !== 'undefined' && FOOD_VAL[itemId] != null) ||
      (typeof FOOD_SPOIL !== 'undefined' && FOOD_SPOIL[itemId] != null) ||
      ['bread', 'fish', 'egg', 'meal', 'cookedFish', 'cookedMeat', 'crop', 'berries', 'rawMeat', 'saltedMeat', 'smokedMeat', 'smokedFish'].includes(itemId)
    );
    if(!isFood) return 1.0;
    if(season === 'Winter') return 1.4;
    return 1.0;
  },

  /* Price formula: floorPrice * (1 + scarcity) * seasonMult */
  getPrice(itemId, place){
    const targetPlace = place || 'shop';
    const store = (targetPlace === 'inn') ? INN : SHOP;
    if(store && store.priceOverrides && store.priceOverrides[itemId] != null){
      return store.priceOverrides[itemId];
    }
    const floor = (store && store.floorPrice && store.floorPrice[itemId] != null)
      ? store.floorPrice[itemId]
      : ((SHOP.floorPrice && SHOP.floorPrice[itemId] != null) ? SHOP.floorPrice[itemId] : 3);
    if(itemId === 'room') return floor;

    const currentStock = (store && store.stock && store.stock[itemId] != null) ? store.stock[itemId] : 0;
    const scarcity = this.getScarcity(itemId, currentStock);
    const seasonMult = this.getSeasonMult(itemId);
    return Math.max(1, Math.round(floor * (1 + scarcity) * seasonMult));
  },

  getSubstitute(itemId){
    return ITEM_SUBSTITUTES[itemId] || null;
  },

  setSubstitute(itemId, subId){
    ITEM_SUBSTITUTES[itemId] = subId;
  },

  recordTransaction(itemId, qty, price){
    const q = qty || 1;
    const now = (typeof W !== 'undefined' && W && W.day != null) ? (W.day + (W.tod || 0)/24) : 0;
    this.recentTransactions.push({ itemId, qty: q, price, time: now });
    while(this.recentTransactions.length > 0 && (now - this.recentTransactions[0].time) > 7){
      const old = this.recentTransactions.shift();
      if(this.trackedWeeklyConsumption[old.itemId]){
        this.trackedWeeklyConsumption[old.itemId] = Math.max(0, this.trackedWeeklyConsumption[old.itemId] - old.qty);
      }
    }
    this.trackedWeeklyConsumption[itemId] = (this.trackedWeeklyConsumption[itemId] || 0) + q;
  }
};

/* Transparent Price Proxy for backward compatibility with SHOP.buyPrice[...] and overrides */
function createPriceProxy(store, place){
  return new Proxy(store.floorPrice, {
    get(target, prop){
      if(typeof prop !== 'string') return target[prop];
      if(store.priceOverrides && store.priceOverrides[prop] != null){
        return store.priceOverrides[prop];
      }
      if(prop in target){
        return Economy.getPrice(prop, place);
      }
      return target[prop];
    },
    set(target, prop, value){
      if(!store.priceOverrides) store.priceOverrides = {};
      if(value === target[prop]){
        delete store.priceOverrides[prop];
      } else {
        store.priceOverrides[prop] = value;
      }
      return true;
    },
    has(target, prop){
      return prop in target || (store.priceOverrides && prop in store.priceOverrides);
    },
    ownKeys(target){
      const keys = new Set([...Reflect.ownKeys(target), ...Object.keys(store.priceOverrides || {})]);
      return Array.from(keys);
    },
    getOwnPropertyDescriptor(target, prop){
      return {
        value: this.get(target, prop),
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
  });
}

SHOP.buyPrice = createPriceProxy(SHOP, 'shop');
INN.buyPrice = createPriceProxy(INN, 'inn');

if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.getEconomy = function(){ return Economy; };
}

function doBuyStep(v, step, dtH){
  const what = step.what || 'bread';
  const fromInn = (step.from === 'inn' || step.place === 'inn');
  const targetPlace = fromInn ? 'inn' : 'shop';
  const p = placePos(targetPlace);
  if(p && Math.hypot(v.x - p.x, v.y - p.y) > CS * 2.5){
    const r = planMoveToward(v, p.x, p.y, dtH);
    return r === 'stuck' ? true : false;
  }
  const store = fromInn ? INN : SHOP;
  const seller = fromInn ? innkeeper() : shopkeeper();
  if(!seller){
    v.thoughts = [{ text: (fromInn ? 'The inn is closed; Tobin is away' : 'The shop is closed'), val: -2 }];
    return true;
  }
  const price = fromInn ? (INN.buyPrice[what] || SHOP.buyPrice[what]) : SHOP.buyPrice[what];
  if(price == null){
    v.thoughts = [{ text: (fromInn ? 'The inn does not serve that' : 'The shop does not sell that'), val: -2 }];
    return true;
  }

  // Check out of stock -> record unmet demand and attempt substitution if permitted
  if(what !== 'room' && store.stock[what] != null && store.stock[what] <= 0){
    Economy.recordDemand(what, step.n || step.qty || 1);
    const canSub = (step.allowSubstitute !== false);
    const sub = canSub ? Economy.getSubstitute(what) : null;
    const subPrice = sub ? (fromInn ? (INN.buyPrice[sub] || SHOP.buyPrice[sub]) : SHOP.buyPrice[sub]) : null;
    if(sub && (store.stock[sub] || 0) > 0 && subPrice != null && (v.gold || 0) >= subPrice){
      v.thoughts = [{ text: what + ' is out of stock; switching to ' + sub, val: -1 }];
      witnessEvent(v, 'Found ' + what + ' out of stock; bought ' + sub + ' instead');
      step.originalWhat = step.originalWhat || what;
      step.what = sub;
      step.switchedToSubstitute = true;
      v.switchedToSubstitute = sub;
      return doBuyStep(v, step, dtH);
    }
    v.thoughts = [{ text: (fromInn ? 'The inn is out of ' : 'The shop is out of ') + what, val: -2 }];
    return true;
  }

  // 6A Expectation tuple check: price shock triggers expectation violation
  if(typeof checkPriceExpectation === 'function'){
    const expRes = checkPriceExpectation(v, what, price);
    if(expRes && !expRes.match && expRes.replan){
      // Record unmet demand signal for what the villager originally came to buy
      Economy.recordDemand(what, step.n || step.qty || 1);
      const canSub = (step.allowSubstitute !== false);
      const sub = canSub ? Economy.getSubstitute(what) : null;
      const subPrice = sub ? (fromInn ? (INN.buyPrice[sub] || SHOP.buyPrice[sub]) : SHOP.buyPrice[sub]) : null;
      if(sub && (store.stock[sub] || 0) > 0 && subPrice != null && (v.gold || 0) >= subPrice){
        v.thoughts = [{ text: 'Price shock: ' + what + ' costs ' + price + 'g; switching to ' + sub, val: -1 }];
        witnessEvent(v, 'Decided ' + what + ' was too dear at ' + price + 'g; bought ' + sub + ' instead');
        step.originalWhat = step.originalWhat || what;
        step.what = sub;
        step.switchedToSubstitute = true;
        v.switchedToSubstitute = sub;
        return doBuyStep(v, step, dtH);
      }
      v.thoughts = [{ text: 'Price shock: ' + what + ' costs ' + price + 'g (expected ' + expRes.predictedValue + 'g)', val: -3 }];
      v.replanNeeded = true;
      v.interrupted = true;
      v.purchaseCancelled = true;
      return true;
    }
  }

  // Check gold affordability
  if((v.gold || 0) < price){
    Economy.recordDemand(what, step.n || step.qty || 1);
    v.thoughts = [{ text: (fromInn ? 'Not enough gold for ' + what : 'Not enough gold'), val: -2 }];
    return true;
  }

  // Execute purchase
  v.gold -= price;
  seller.gold = (seller.gold || 0) + price;
  if(what !== 'room'){
    if(store.stock[what]) store.stock[what]--;
    addInv(v, what, 1);
  } else {
    v.innLodgingPaid = true;
  }
  Economy.recordTransaction(what, 1, price);
  v.state = 'idle';
  const sellerName = fromInn ? 'Tobin at the inn' : 'Sella';
  witnessEvent(v, (fromInn ? 'Purchased ' + what + ' at the inn for ' + price + ' gold' : 'Bought ' + what + ' for ' + price + ' gold'));
  logEvent('trade', v.name + ' bought ' + what + (fromInn ? ' from ' + sellerName : ' from Sella') + ' (' + price + 'g)');
  return true;
}

function doSellStep(v, step, dtH){
  const what = step.what || 'fish';
  const p = placePos('shop');
  if(p && Math.hypot(v.x - p.x, v.y - p.y) > CS * 2.5){
    const r = planMoveToward(v, p.x, p.y, dtH);
    return r === 'stuck' ? true : false;
  }
  const sella = shopkeeper();
  if(!sella){ v.thoughts = [{ text:'The shop is closed', val:-2 }]; return true; }
  const price = SHOP.sellPrice[what];
  if(price == null || (v.inv[what] || 0) <= 0){ v.thoughts = [{ text:'Nothing to sell', val:-1 }]; return true; }
  const n = Math.min(v.inv[what], step.n || v.inv[what]);
  if((sella.gold || 0) < price * n){ v.thoughts = [{ text:'Sella cannot afford that', val:-2 }]; return true; }
  v.inv[what] -= n; stripItemProvenance(v, what, n); sella.gold -= price * n; v.gold = (v.gold || 0) + price * n;
  SHOP.stock[what] = (SHOP.stock[what] || 0) + n;
  v.state = 'idle';
  witnessEvent(v, 'Sold ' + n + ' ' + what + ' for ' + (price * n) + ' gold');
  logEvent('trade', v.name + ' sold ' + n + ' ' + what + ' to Sella (' + (price * n) + 'g)');
  return true;
}
VERBS.push('buy', 'sell', 'butcher', 'bury');
const __planForVerb12 = planForVerb;
planForVerb = function(v, action){
  const A = action || {};
  if(A.kind === 'buy' || A.kind === 'sell'){
    const p = placePos('shop');
    if(!p) return { ok:false, reason:'no shop' };
    const steps = [{ verb:'go', place:'shop', tx:p.x, ty:p.y },
                   { verb:A.kind, what:A.what || (A.kind === 'buy' ? 'bread' : 'fish') }];
    if(A.kind === 'sell' && A.n) steps[1].n = A.n;
    return { ok:true, steps };
  }
  if(A.kind === 'butcher') return { ok:true, steps:[{ verb:'butcher' }] };
  if(A.kind === 'bury') return { ok:true, steps:[{ verb:'bury', name:A.name || null }] };
  return __planForVerb12(v, action);
};
const __planTick12 = planTick;
planTick = function(v, dtH){
  if(v.plan && v.plan.length){
    const st = v.plan[0];
    if(st.verb === 'buy' || st.verb === 'sell' || st.verb === 'butcher' || st.verb === 'bury'){
      st.t = (st.t || 0) + dtH;
      let done = false;
      if(st.verb === 'buy') done = doBuyStep(v, st, dtH);
      else if(st.verb === 'sell') done = doSellStep(v, st, dtH);
      else if(st.verb === 'butcher') done = doButcherStep(v, st, dtH);
      else if(st.verb === 'bury') done = doBuryStep(v, st, dtH);
      if(done) v.plan.shift();
      return;
    }
  }
  __planTick12(v, dtH);
};
/* cook: raw meat alongside fish. Replaces the fish-only 12C version. */
doCookStep = function(v, step, dtH){
  let fire = null;
  for(const f of FIRES){
    if(f.burnH > 0 && Math.hypot(v.x - f.x, v.y - f.y) < CS * 3){ fire = f; break; }
  }
  if(!fire){
    const p = placePos('firepit');
    if(p){ const r = planMoveToward(v, p.x, p.y, dtH); if(r !== true) return r === 'stuck'; }
    fire = FIRES.find(f => f.burnH > 0);
    if(!fire){ v.thoughts = [{ text:'The fire is out; cannot cook', val:-2 }]; return true; }
  }
  const hasFish = (v.inv.fish || 0) > 0, hasMeat = (v.inv.rawMeat || 0) > 0;
  if(!hasFish && !hasMeat){ v.thoughts = [{ text:'Nothing raw to cook', val:-1 }]; return true; }
  v.state = 'work'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog >= 0.5){
    step.prog = 0;
    if(hasMeat){ v.inv.rawMeat--; addInv(v, 'cookedMeat', 1); witnessEvent(v, 'Cooked meat over the fire'); }
    else { v.inv.fish--; addInv(v, 'cookedFish', 1); witnessEvent(v, 'Cooked a fish over the fire'); }
  }
  if(((v.inv.fish || 0) <= 0 && (v.inv.rawMeat || 0) <= 0) || step.t > 3) return true;
  return false;
};
/* chicken-coop place for the egg intent */
const __placePos13 = placePos;
placePos = function(place){
  if(place === 'coop'){
    const c = CHICKENS[0];
    return c ? { x:c.x, y:c.y } : null;
  }
  return __placePos13(place);
};
/* gold init, chained after the 12A initVillagers wrapper */
const __initVillagers13 = initVillagers;
initVillagers = function(){
  __initVillagers13();
  for(const v of VILLAGERS){ if(v.gold == null) v.gold = (v.name === 'Sella') ? 150 : 25; }
};
const __birthChild13 = birthChild;
birthChild = function(m){
  const before = VILLAGERS.length;
  __birthChild13(m);
  if(VILLAGERS.length === before + 1) VILLAGERS[VILLAGERS.length - 1].gold = 0;
};
/* HUD: gold shown in the inspector role line */
const __updateHUD13 = updateHUD;
updateHUD = function(){
  __updateHUD13();
  try{
    const v = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
    const roleEl = document.getElementById('pi-role');
    if(v && roleEl) roleEl.textContent = v.role + ' · 🪙' + (v.gold || 0);
  }catch(e){}
};
