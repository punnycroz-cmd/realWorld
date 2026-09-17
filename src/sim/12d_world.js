/* ---- world: crops, chickens, campfires, lightning, wildfire, regrow ---- */
function cropTick(h){
  if(W.season === 'Winter') return; // Winter growth is 0
  const seasonMult = (W.season === 'Summer') ? 1.2 : ((W.season === 'Spring') ? 1.0 : 0.7);
  for(const c of CROPS){
    if(c.stage >= 3) continue;
    c.grow += (h / 24) * seasonMult;
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
  if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.propagateSound === 'function'){
    FeelingSubstrate.propagateSound({
      kind: 'thunder',
      originX: sx,
      originY: sy,
      radius: 60,
      metadata: { wx: wx, wy: wy }
    });
  }
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

/* =====================================================================
   PHASE 6B: WEATHER -> FIRE CAUSAL CHAIN (B3)
   - dryDays counter -> dryness
   - fire spread = f(fuel by terrain/tree/house, wind direction, dryness)
   - rain/snow extinguishes fire
   - tile burned -> scorched + ash pile with provenance 'burned'
   ===================================================================== */
function getDryness(){
  if(typeof W === 'undefined') return 0.5;
  if((W.rain || 0) > 0.25) return 0; // Active rain drenches terrain
  const dryDays = W.dryDays || 0;
  const tempBoost = Math.max(0, ((W.temp || 20) - 20) * 0.02);
  const rainPenalty = (W.rain || 0) * 2.0;
  return clamp((dryDays / 10) + tempBoost - rainPenalty, 0, 1);
}

function getCellFuel(wx, wy){
  if(typeof getWaterDepth === 'function' && getWaterDepth(wx, wy) > 0) return 0;
  const cc = cellChunk(wx, wy);
  if(!cc || !cc.c) return 0;
  const tt = cc.c.tileType ? cc.c.tileType[cc.i] : 0;
  if(tt === 2 || tt === 3) return 0; // water, stone
  if(tt === 5) return 0.8;           // wooden bridge / pier
  if(typeof WILDTREES !== 'undefined'){
    const t = WILDTREES.find(tr => tr.wx === wx && tr.wy === wy && tr.stage > 0);
    if(t) return 2.0 * (t.stage / 3);
  }
  if(cc.c.bush && cc.c.bush[cc.i] > 0){
    return 1.2 * cc.c.bush[cc.i];
  }
  if(typeof VILLAGE_BUILDINGS !== 'undefined'){
    const bld = VILLAGE_BUILDINGS.find(b =>
      wx >= b.wx && wx < b.wx + (b.tw || 4) &&
      wy >= b.wy && wy < b.wy + (b.th || 4)
    );
    if(bld) return 1.5;
  }
  if(tt === 0 || tt === 4) return 0.5; // grass / field
  return 0.2;
}

function onTileBurned(wx, wy){
  const cc = cellChunk(wx, wy);
  if(cc.c){
    if(!cc.c.scorched) cc.c.scorched = new Uint8Array(cc.c.tileType.length);
    cc.c.scorched[cc.i] = 1;

    const ti = WILDTREES.findIndex(t => t.wx === wx && t.wy === wy);
    if(ti >= 0){
      if(cc.c.tStage) cc.c.tStage[cc.i] = 0;
      WILDTREES.splice(ti, 1);
    }
    if(cc.c.bush && cc.c.bush[cc.i] > 0){
      cc.c.bush[cc.i] = 0;
      if(cc.c.bushCells){
        const bi = cc.c.bushCells.indexOf(cc.i);
        if(bi >= 0) cc.c.bushCells.splice(bi, 1);
      }
    }
    markChunkDirty(cc.c);
  }

  // Scorch building if present
  if(typeof VILLAGE_BUILDINGS !== 'undefined'){
    for(const bd of VILLAGE_BUILDINGS){
      if(wx >= bd.wx && wx < bd.wx + (bd.tw || 4) && wy >= bd.wy && wy < bd.wy + (bd.th || 4)){
        bd.scorch = (bd.scorch || 0) + 1.5;
        if(bd.scorch > 6 && !bd.ruined){
          bd.ruined = true;
          logEvent('fire', bd.name + ' was ruined by fire!');
        }
      }
    }
  }

  // Create ash pile with provenance 'burned' (Principle 4)
  const ax = wx * CS + 16, ay = wy * CS + 16;
  const ashPile = dropPileAt(ax, ay, 'ash', 1);
  if(ashPile){
    ashPile.provenance = 'burned';
    if(typeof createProvenance === 'function'){
      const prov = createProvenance('wildfire', {}, 0.5, 'nature', W.day);
      prov.provenance = 'burned';
      prov.source = 'burned';
      if(typeof pileProvList === 'function'){
        pileProvList(ashPile).push({ item: 'ash', prov: prov });
      }
    }
  }
  logEvent('fire', `Tile (${wx}, ${wy}) burned to ash`);
}

function wildfireTick(h){
  if(!BURNING.length) return;
  const dryness = getDryness();
  W.dryness = dryness;
  const isRaining = (W.rain || 0) > 0.25;
  const isSnowing = W.season === 'Winter' && (W.temp || 0) < 2 && (W.rain || 0) > 0.05;

  for(const b of BURNING.slice()){
    // Rain and snow extinguish fire!
    if(isRaining){
      b.t -= h * (2.0 + (W.rain - 0.25) * 8.0);
    } else if(isSnowing){
      b.t -= h * 4.0;
    } else {
      b.t -= h;
    }

    // Villager burn damage & feeling substrate acute threat signal
    for(const v of VILLAGERS){
      if(v.dead) continue;
      const dCells = Math.hypot(v.x - (b.wx * CS + 16), v.y - (b.wy * CS + 16)) / CS;
      if(dCells < 1.2){
        const bd = ensureBody(v);
        bd.injury = clamp((bd.injury || 0) + h * 1.5, 0, 1);
        learnDanger(v, 'wildfire');
        witnessEvent(v, 'Burned by wildfire!');
        if(bd.injury >= 1) killVillager(v, 'burned in wildfire');
      }
      if(dCells <= 16){
        if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.receiveSignal === 'function'){
          const intensity = +clamp(1.0 - (dCells / 16) * 0.4, 0.60, 0.95).toFixed(3);
          FeelingSubstrate.receiveSignal(v, FeelingSubstrate.normalizeEvent('wildfire', null, {
            source: 'wildfire',
            intensity: intensity,
            dist: +dCells.toFixed(1)
          }));
        }
      }
    }

    // Phase 6E E3: Acoustic fire roar propagation with physical distance falloff (radius 16)
    if(typeof FeelingSubstrate !== 'undefined' && typeof FeelingSubstrate.propagateSound === 'function'){
      FeelingSubstrate.propagateSound({
        kind: 'fire_roar',
        originX: b.wx * CS + 16,
        originY: b.wy * CS + 16,
        radius: 16,
        sourceName: 'wildfire',
        metadata: { wx: b.wx, wy: b.wy }
      });
    }

    // Fire spread f(fuel, wind direction, dryness)
    if(!isRaining && !isSnowing && dryness > 0.05){
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      const windAngle = W.windAng || 0;
      const windSpd = W.windSpd || 1.0;
      const wx = Math.cos(windAngle), wy = Math.sin(windAngle);

      for(const [dx, dy] of dirs){
        const nx = b.wx + dx, ny = b.wy + dy;
        if(BURNING.some(existing => existing.wx === nx && existing.wy === ny)) continue;
        const fuel = getCellFuel(nx, ny);
        if(fuel <= 0) continue;

        const dist = Math.hypot(dx, dy);
        const windAlignment = (dx * wx + dy * wy) / dist; // -1 to 1
        const windFactor = clamp(1.0 + windAlignment * 0.7 * (windSpd / 1.5), 0.2, 2.5);
        const spreadProb = (0.08 + 0.35 * dryness) * fuel * windFactor * (h / dist);

        if(srand() < spreadProb){
          ignite(nx, ny);
          break;
        }
      }
    }

    if(b.t <= 0){
      const bi = BURNING.indexOf(b);
      if(bi >= 0) BURNING.splice(bi, 1);
      onTileBurned(b.wx, b.wy);
    }
  }
}

function treeRegrowTick(h){
  if(W.season === 'Winter') return; // Winter regen is 0!
  const seasonRate = (W.season === 'Spring') ? 0.03 : ((W.season === 'Summer') ? 0.025 : 0.015);
  if(srand() >= seasonRate * h) return;
  const t = WILDTREES[Math.floor(srand() * WILDTREES.length)];
  if(t && t.stage < 3){
    t.stage++;
    const cc = cellChunk(t.wx, t.wy); if(cc.c.tStage){ cc.c.tStage[cc.i] = t.stage; markChunkDirty(cc.c); }
  }
}

/* Bushes foraged for berries regrow after days set by season.
   In WINTER, regen is 0 — bushes do not regrow until Spring. */
let bushRegrowLastDay = -1;
function bushRegrowTick(h){
  if(W.day === bushRegrowLastDay) return;
  bushRegrowLastDay = W.day;
  // B2 Carrying capacity: winter regen is 0!
  if(W.season === 'Winter') return;
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

    // Weather dryness update
    if(W.rain < 0.15 && !(W.season === 'Winter' && (W.temp || 20) < 0)){
      W.dryDays = (W.dryDays || 0) + (h / 24);
    } else if(W.rain > 0.3){
      W.dryDays = Math.max(0, (W.dryDays || 0) - (h / 24) * 3);
    }
    W.dryness = getDryness();
  }
}
const __baseSimTick = simTick;
simTick = function(dtH){
  __baseSimTick(dtH);
  parityWorldTick(dtH);
};

if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.getDryness = function(){ return getDryness(); };
  window.__aiBridge.getDryDays = function(){ return (typeof W !== 'undefined') ? (W.dryDays || 0) : 0; };
}