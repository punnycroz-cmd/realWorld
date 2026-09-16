/* =====================================================================
   PART 13B: ECONOMY — gold, Sella's shop, buy/sell verbs.
   Gold is conserved: buyer pays, seller receives, stock is real.
   ===================================================================== */
const SHOP = {
  stock: { bread:20, fish:8, egg:12, meal:6, cookedFish:6, cookedMeat:6 },
  buyPrice:  { bread:3, fish:5, egg:2, meal:9, cookedFish:7, cookedMeat:8 },
  sellPrice: { bread:2, fish:3, egg:1, meal:6, cookedFish:4, cookedMeat:5, crop:1, berries:1, log:1, stone:1 }
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
  buyPrice: { meal:8, cookedMeat:7, cookedFish:6, bread:3, ale:2, room:2 }
};
function doBuyStep(v, step, dtH){
  const what = step.what || 'bread';
  const fromInn = (step.from === 'inn' || step.place === 'inn');
  const targetPlace = fromInn ? 'inn' : 'shop';
  const p = placePos(targetPlace);
  if(p && Math.hypot(v.x - p.x, v.y - p.y) > CS * 2.5){
    const r = planMoveToward(v, p.x, p.y, dtH);
    return r === 'stuck' ? true : false;
  }
  if(fromInn){
    const tobin = innkeeper();
    if(!tobin){ v.thoughts = [{ text:'The inn is closed; Tobin is away', val:-2 }]; return true; }
    const price = INN.buyPrice[what] || SHOP.buyPrice[what];
    if(price == null){ v.thoughts = [{ text:'The inn does not serve that', val:-2 }]; return true; }
    if(what !== 'room' && INN.stock[what] != null && INN.stock[what] <= 0){
      v.thoughts = [{ text:'The inn is out of ' + what, val:-2 }]; return true;
    }
    if((v.gold || 0) < price){ v.thoughts = [{ text:'Not enough gold for ' + what, val:-2 }]; return true; }
    v.gold -= price; tobin.gold = (tobin.gold || 0) + price;
    if(what !== 'room'){
      if(INN.stock[what]) INN.stock[what]--;
      addInv(v, what, 1);
    } else {
      v.innLodgingPaid = true;
    }
    v.state = 'idle';
    witnessEvent(v, 'Purchased ' + what + ' at the inn for ' + price + ' gold');
    logEvent('trade', v.name + ' bought ' + what + ' from Tobin at the inn (' + price + 'g)');
    return true;
  }
  const sella = shopkeeper();
  if(!sella){ v.thoughts = [{ text:'The shop is closed', val:-2 }]; return true; }
  const price = SHOP.buyPrice[what];
  if(price == null){ v.thoughts = [{ text:'The shop does not sell that', val:-2 }]; return true; }
  if((SHOP.stock[what] || 0) <= 0){ v.thoughts = [{ text:'The shop is out of ' + what, val:-2 }]; return true; }
  if((v.gold || 0) < price){ v.thoughts = [{ text:'Not enough gold', val:-2 }]; return true; }
  v.gold -= price; sella.gold = (sella.gold || 0) + price;
  SHOP.stock[what]--;
  addInv(v, what, 1);
  v.state = 'idle';
  witnessEvent(v, 'Bought ' + what + ' for ' + price + ' gold');
  logEvent('trade', v.name + ' bought ' + what + ' from Sella (' + price + 'g)');
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
