/* ---- world: crops, chickens, campfires, lightning, wildfire, regrow ---- */
function cropTick(h){
  if(W.season === 'Winter') return;
  for(const c of CROPS){
    if(c.stage >= 3) continue;
    c.grow += h / 24;
    if(c.grow >= 2){ c.grow = 0; c.stage++; }
  }
}
function chickenTick(h){
  for(const c of CHICKENS){
    c.t -= h; c.eggT -= h;
    if(c.t <= 0){
      c.t = 1 + srand() * 3;
      const a = srand() * Math.PI * 2;
      const nx = c.x + Math.cos(a) * 40, ny = c.y + Math.sin(a) * 40;
      if(canMoveTo(nx, ny, null).ok){ c.x = nx; c.y = ny; }
      c.state = srand() < 0.5 ? 'peck' : 'walk';
    }
    if(c.eggT <= 0){ c.eggT = 18 + srand() * 10; dropPileAt(c.x, c.y, 'egg', 1); }
  }
}
function fireTick(h){
  for(const f of FIRES) if(f.burnH > 0) f.burnH = Math.max(0, f.burnH - h);
}
function ignite(wx, wy){
  if(BURNING.length > 60) return;
  for(const b of BURNING) if(b.wx === wx && b.wy === wy) return;
  BURNING.push({ wx, wy, t: 0.6 });
  logEvent('fire', 'Wildfire ignited near the village');
}
function lightningTick(h){
  if(W.storm < 0.5) return;
  if(srand() >= 0.10 * h) return;
  const wx = Math.round((srand() - 0.5) * 50), wy = Math.round((srand() - 0.5) * 44);
  const sx = wx * CS + 16, sy = wy * CS + 16;
  logEvent('lightning', 'Lightning struck ' + compassDir(wx, wy) + ' of the village');
  showToast('⛈ Lightning strikes!');
  for(const v of VILLAGERS){
    if(v.dead) continue;
    const d = Math.hypot(v.x - sx, v.y - sy) / CS;
    if(d < 1.2){
      const b = ensureBody(v);
      b.injury = clamp((b.injury || 0) + 0.7, 0, 1);
      learnDanger(v, 'lightning strike');
      witnessEvent(v, 'Struck by lightning!');
      if(d < 0.6 && srand() < 0.5) killVillager(v, 'struck by lightning');
    } else if(d < 14){
      learnDanger(v, 'lightning storm');
      witnessEvent(v, 'Saw lightning strike ' + distWords(d) + ' to the ' + compassDir(sx - v.x, sy - v.y));
    }
  }
  for(const t of WILDTREES){
    if(Math.hypot(t.wx - wx, t.wy - wy) < 2.5){ ignite(t.wx, t.wy); break; }
  }
}
function wildfireTick(h){
  if(!BURNING.length) return;
  const dry = W.rain < 0.25;
  for(const b of BURNING.slice()){
    b.t -= h;
    for(const v of VILLAGERS){
      if(v.dead) continue;
      if(Math.hypot(v.x - (b.wx * CS + 16), v.y - (b.wy * CS + 16)) < CS * 1.2){
        const bd = ensureBody(v);
        bd.injury = clamp((bd.injury || 0) + h * 1.5, 0, 1);
        learnDanger(v, 'wildfire');
        witnessEvent(v, 'Burned by wildfire!');
        if(bd.injury >= 1) killVillager(v, 'burned in wildfire');
      }
    }
    if(dry && srand() < (0.25 + W.windSpd * 0.1) * h){
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const d = dirs[Math.floor(srand() * 4)];
      const tree = WILDTREES.find(t => t.wx === b.wx + d[0] && t.wy === b.wy + d[1] && t.stage > 0);
      if(tree) ignite(tree.wx, tree.wy);
    }
    if(b.t <= 0){
      const bi = BURNING.indexOf(b); if(bi >= 0) BURNING.splice(bi, 1);
      const ti = WILDTREES.findIndex(t => t.wx === b.wx && t.wy === b.wy);
      if(ti >= 0){
        const cc = cellChunk(b.wx, b.wy); if(cc.c.tStage){ cc.c.tStage[cc.i] = 0; markChunkDirty(cc.c); }
        WILDTREES.splice(ti, 1);
      }
    }
  }
}
function treeRegrowTick(h){
  if(srand() >= 0.02 * h) return;
  const t = WILDTREES[Math.floor(srand() * WILDTREES.length)];
  if(t && t.stage < 3){
    t.stage++;
    const cc = cellChunk(t.wx, t.wy); if(cc.c.tStage){ cc.c.tStage[cc.i] = t.stage; markChunkDirty(cc.c); }
  }
}
/* Bushes foraged for berries regrow after 4 days (c.bush[i] < 0 means the
   absolute value is the day it regrows). Without this, foraging is a finite
   resource and the village starves once the inn's bread runs out. */
let bushRegrowLastDay = -1;
function bushRegrowTick(h){
  // Check once per day, not every 0.5h tick.
  if(W.day === bushRegrowLastDay) return;
  bushRegrowLastDay = W.day;
  for(const c of chunks.values()){
    if(!c.bush) continue;
    let regrew = false;
    for(let i = 0; i < c.bush.length; i++){
      const bv = c.bush[i];
      if(bv < 0 && W.day >= -bv){
        c.bush[i] = 1.0;
        if(c.bushCells && c.bushCells.indexOf(i) < 0) c.bushCells.push(i);
        regrew = true;
      }
    }
    if(regrew) markChunkDirty(c);
  }
}
let parityAcc = 0;
function parityWorldTick(dtH){
  parityAcc += dtH;
  if(parityAcc >= 0.5){
    const h = parityAcc; parityAcc = 0;
    cropTick(h); chickenTick(h); fireTick(h);
    lightningTick(h); wildfireTick(h);
    socialTick(h); pregnancyTick(h / 24); treeRegrowTick(h); bushRegrowTick(h);
  }
}
const __baseSimTick = simTick;
simTick = function(dtH){
  __baseSimTick(dtH);
  parityWorldTick(dtH);
};