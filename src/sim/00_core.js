
/* =====================================================================
   PART 2: NATURA CAUSAL METEOROLOGICAL & BIOLOGICAL SIMULATION CORE
   FUSED WITH WILLOWBROOK VILLAGE SETTLEMENT & CHIBI RENDERER
   ===================================================================== */

const CS = 32;          // 1 Natura cell = 32x32 px (1-to-1 match with Willowbrook tiles!)
const CHN = 16;         // 16 cells per chunk = 512x512 px
const SEA = 0.32;       // sea level
let SEED = 20260912;

/* ---- Phase 3: seeded RNG. ALL simulation-logic randomness flows through srand().
   Math.random() is reserved for cosmetic render/UI jitter only (never sim state).
   RNGS.s is serialized by the save system, so save -> load continues the exact
   same random stream: a reloaded world is bit-identical to an uninterrupted one. */
var RNGS = { s: (SEED ^ 0x9e3779b9) >>> 0 };
function srand(){
  // mulberry32 — small, fast, fully serializable 32-bit state
  let t = RNGS.s = (RNGS.s + 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function srandInt(n){ return Math.floor(srand() * n); }
function srandPick(arr){ return arr.length ? arr[srandInt(arr.length)] : undefined; }

/* ---- World Clock & Weather State ---- */
const W = {
  day: 1,
  year: 1,               // Game year; a year is 120 days (4 x 30-day seasons)
  tod: 8.0,            // Time of day: 0.0 .. 24.0
  speed: 1,            // Simulation multiplier
  paused: false,
  windAng: 0.8,
  windSpd: 1.2,
  season: 'Spring',
  temp: 21.0,          // Ambient village temperature (°C)
  hum: 0.55,           // Ambient humidity
  rain: 0.0,           // Precipitation level 0..1
  storm: 0.0,          // Thunderstorm gloom 0..1
};

/* Noise & Math Helpers */
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const lerp = (a,b,t) => a+(b-a)*t;
// Configuration for curve enhancements
const CURVE_UI_RADIUS = 12; // px, can be adjusted in CSS as well
const SPRITE_SCALE_FACTOR = 3; // 2, 3, or 4 – higher values give smoother curves

function paBlob(g,cx,cy,r,col){
  if(col==null) return;
  g.fillStyle=col;
  const rr=Math.ceil(r);
  for(let j=-rr;j<=rr;j++) for(let i=-rr;i<=rr;i++)
    if(i*i+j*j<=r*r+0.4) g.fillRect(Math.round(cx+i),Math.round(cy+j),1,1);
}

// Draw a rectangle with rounded corners on a given 2D context
function drawRoundedRect(g, x, y, w, h, r, col) {
  if(col==null) return;
  g.fillStyle = col;
  const radius = Math.min(r, w/2, h/2);
  g.beginPath();
  g.moveTo(x + radius, y);
  g.lineTo(x + w - radius, y);
  g.arcTo(x + w, y, x + w, y + radius, radius);
  g.lineTo(x + w, y + h - radius);
  g.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  g.lineTo(x + radius, y + h);
  g.arcTo(x, y + h, x, y + h - radius, radius);
  g.lineTo(x, y + radius);
  g.arcTo(x, y, x + radius, y, radius);
  g.closePath();
  g.fill();
}

// Helper to render at higher resolution then downscale without smoothing
function highResRender(drawFn, scale) {
  const s = paMk(32 * scale, 32 * scale); // base size * scale (adjust as needed)
  const g = s.g;
  // Run the drawing function on the high‑res context
  drawFn(g);
  // Downscale back to original size
  const final = paMk(32, 32);
  const fg = final.g;
  fg.imageSmoothingEnabled = false;
  fg.drawImage(s.c, 0, 0, 32, 32);
  return final;
}

/* (duplicate paBlob declaration removed 2026-09-16 — the identical
   declaration above at line ~34 is the canonical one) */

function hash2(x,y,s){
  let h = Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,2246822519);
  h = Math.imul(h^(h>>>13),1274126177); h^=h>>>16;
  return (h>>>0)/4294967295;
}
function vnoise(x,y,s){
  const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi,s), b=hash2(xi+1,yi,s), c=hash2(xi,yi+1,s), d=hash2(xi+1,yi+1,s);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function fbm(x,y,s,oct=3){
  let t=0,amp=0.5,f=1,n=0;
  for(let i=0;i<oct;i++){ t+=amp*vnoise(x*f,y*f,s+i*131); n+=amp; amp*=0.5; f*=2.02; }
  return t/n;
}

/* ---- Deterministic String/Seeded Hashing (FNV-1a 32-bit, NO Math.random) ---- */
function hashString18(str){
  let h = 0x811c9dc5;
  for(let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* ---- Meteorological Systems (Migratory Low-Pressure Fronts) ---- */
const systems = [];
function initSystems(){
  systems.length=0;
  for(let k=0;k<5;k++){
    systems.push({
      x: (hash2(k,1,SEED+900)-0.5)*3600,
      y: (hash2(k,2,SEED+900)-0.5)*3600,
      r: 600 + hash2(k,3,SEED+900)*400,
      inten: 0.4 + hash2(k,4,SEED+900)*0.6,
      ph: hash2(k,5,SEED+900)*10
    });
  }
}
initSystems();

function getRiverCenter(wy){
  return 28 + Math.sin(wy * 0.08) * 3.0 + (vnoise(wy * 0.05, 1.5, SEED + 88) - 0.5) * 3.0;
}

/* ---- Procedural Infinite Chunks ---- */
const chunks = new Map();
function genChunk(cx,cy){
  const N = CHN, n = N*N;
  const ch = {
    cx, cy,
    h: new Float32Array(n),
    moist: new Float32Array(n),
    fert: new Float32Array(n),
    grass: new Float32Array(n),
    tStage: new Float32Array(n),
    treeType: new Uint8Array(n), // 0: Oak, 1: Pine, 2: Apple
    snag: new Float32Array(n),
    bush: new Float32Array(n),
    temp: new Float32Array(n),
    hum: new Float32Array(n),
    cloud: new Float32Array(n),
    rain: new Float32Array(n),
    storm: new Float32Array(n),
    burn: new Float32Array(n),
    tileType: new Uint8Array(n),  // 0: grass, 1: path, 2: water, 3: stone, 4: field
    bushCells: [],  // Phase 4: world-cell indices holding a berry bush (perf registry)
    shoreCells: [], // Phase 4: world-cell indices of shallow shore (static terrain)
    dirty: false,   // Phase 4: true once runtime code mutates this chunk (saves skip pristine chunks)
  };

  const isVillageCenter = (cx === 0 && cy === 0);

  for(let iy=0;iy<N;iy++)for(let ix=0;ix<N;ix++){
    const wx = cx*N + ix, wy = cy*N + iy, i = iy*N + ix;
    let h = fbm(wx*0.035, wy*0.035, SEED, 3);
    h = Math.pow(h, 1.2);

    // Elevated dry meadow foundation across entire village settlement (no water near buildings)
    if(wx >= -22 && wx <= 20 && wy >= -22 && wy <= 22){
      h = Math.max(SEA + 0.15, h);
    }

    // Lake / Freshwater Creek on the eastern side of village (wx: 28, wy: 7)
    const pondDist = Math.hypot(wx - 28, wy - 7);
    if(pondDist < 7.5){
      if(pondDist < 4.0){
        // Deep lake center (> 1.8m depth, requires swimming)
        h = SEA - 0.14;
      } else {
        // Lake perimeter: shallow water (~0.4m depth, wading)
        h = SEA - 0.038 * (1 - (pondDist - 4.0)/3.5);
      }
    } else {
      // Deterministic flowing river band across the world (seeded worldgen)
      const riverCenter = getRiverCenter(wy);
      const rDist = Math.abs(wx - riverCenter);
      if(rDist < 2.2){
        if(rDist < 1.1){
          h = SEA - 0.12; // deep flowing river channel
        } else {
          h = SEA - 0.035 * (1 - (rDist - 1.1) / 1.1); // shallow river shore/wading
        }
      } else if(rDist < 6.0 || (wx >= 20 && wx <= 36)){
        // River banks corridor: ensure dry land banks flanking the river channel
        h = Math.max(SEA + 0.06, h);
      }
    }

    ch.h[i] = h;
    const land = h >= SEA;
    ch.moist[i] = land ? 0.5 + fbm(wx*0.03+900, wy*0.03+900, SEED+31, 2)*0.4 : 1.0;
    ch.fert[i] = 0.35 + fbm(wx*0.05+300, wy*0.05+300, SEED+77, 2)*0.55;
    ch.grass[i] = land ? 0.35 + hash2(wx,wy,SEED+5)*0.5 : 0;
    ch.temp[i] = 21.0;
    ch.hum[i] = 0.55;

    // Default tile typing:
    // 0: grass, 1: path, 2: deep water, 3: stone, 4: field, 5: bridge/pier, 6: shallow water
    if(!land){
      ch.tileType[i] = (h < SEA - 0.05) ? 2 : 6;
    } else {
      ch.tileType[i] = 0; // grass
    }

    // River wooden bridge crossing at wy = -8
    if(wy === -8){
      const rc = getRiverCenter(wy);
      if(Math.abs(wx - rc) <= 2.8){
        ch.tileType[i] = 5; // bridge
        ch.h[i] = SEA + 0.08;
        ch.tStage[i] = 0;
        ch.bush[i] = 0;
      }
    }

    // Vegetation
    if(land && h < 0.75 && !(isVillageCenter && Math.hypot(wx-3, wy-3) < 12)){
      const f = fbm(wx*0.06+700, wy*0.06+700, SEED+55, 2);
      if(f > 0.58 && hash2(wx,wy,SEED+6) > 0.35){
        ch.tStage[i] = 3.0 + hash2(wx,wy,SEED+8)*1.5; // mature tree
        ch.treeType[i] = Math.floor(hash2(wx,wy,SEED+12)*3); // 0: Oak, 1: Pine, 2: Apple
      } else if(hash2(wx,wy,SEED+20) > 0.93){
        ch.bush[i] = 1.0; // berry bush
      }
    }
  }

  // Phase 4: build the perf registries once, after all clearing passes above.
  for(let i = 0; i < n; i++){
    if(ch.bush[i] > 0) ch.bushCells.push(i);
    // Same shallow-shore test as findForageSpot's fallback (getWaterDepth),
    // computed from raw height so no chunk lookups are needed later.
    if(ch.tileType[i] !== 5){
      const d0 = ch.h[i] >= SEA ? 0 : SEA - ch.h[i];
      if(d0 > 0 && d0 <= 0.05) ch.shoreCells.push(i);
    }
  }

  chunks.set(cx+','+cy, ch);
  return ch;
}

/* Phase 4: chunk dirty-tracking + bush registry maintenance.
   Chunks are a pure function of (cx, cy, SEED), so saves only need the
   chunks that runtime code actually mutated. Every chunk-cell write must
   call markChunkDirty; every bush removal must go through clearBushCell. */
function markChunkDirty(c){ if(c) c.dirty = true; }
function clearBushCell(c, i){
  if(!c) return;
  if(c.bush) c.bush[i] = 0;
  const bc = c.bushCells;
  if(bc){ const k = bc.indexOf(i); if(k >= 0) bc.splice(k, 1); }
  markChunkDirty(c);
}

function chunkAt(cx,cy){
  const k = cx+','+cy;
  let c = chunks.get(k);
  if(!c) c = genChunk(cx,cy);
  return c;
}

function cellChunk(wx,wy){
  const cx = Math.floor(wx/CHN), cy = Math.floor(wy/CHN);
  const c = chunkAt(cx,cy);
  const i = (wy - cy*CHN)*CHN + (wx - cx*CHN);
  return {c, i, cx, cy};
}
