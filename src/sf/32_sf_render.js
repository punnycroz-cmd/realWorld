/* =====================================================================
   PART SF-3: SAN FRANCISCO RENDERER
   sfRenderWorld(cw,ch) — top-down 2.5D view (terrain tiles + extruded
   cartoon facades + y-sorted pawns/props + labels).
   sfRenderStreet(cw,ch) — low-angle "Truman camera" perspective view,
   toggled with the V key or ?view=street.
   ===================================================================== */
let SF_VIEW = 'top';   // 'top' | 'street'

/* Street camera state (v2 "director camera"):
   follow mode  = camera anchored to inspected pawn, free yaw/pitch/height
   director mode (C) = detached free-fly camera clamped to map bounds */
const SF_CAM = {
  yaw: Math.PI / 2,  // radians; 0 = +x, PI/2 = +y (matches face->DV mapping)
  pitch: 0,          // + looks up, - looks down
  h: 1.7,            // camera height, meters (0.5 - 30)
  back: 6.5,         // v8: third-person pull-back, meters behind the subject
  fov: 1,            // v9: lens multiplier — 1 = 50mm, 0.55 wide, 2.4 tele
  orbit: false,      // v9: slow auto-orbit around the subject
  director: false,
  x: 0, y: 0,        // director position, meters
  _lastPawn: -1,
  _snap: true,       // v9: jump smoothed rig to targets next frame
};
/* v9: smoothed rig state lives outside the target fields so every source
   of input (keys, drag, script) stays instantaneous and the spring does
   the easing. _sx/_sy world meters, _syaw/_spitch radians, _sh meters. */
function sfAngLerp(a, b, k){
  let d = b - a;
  while(d > Math.PI) d -= Math.PI * 2;
  while(d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
function sfCamSnap(){ SF_CAM._snap = true; }

/* v8: DIORAMA camera — the top view is a tilted axonometric projection.
   The ground plane is squashed by SF_TILT around screen-center while
   buildings, trees and pawns keep their full vertical sprites: the city
   reads as a miniature model with real facades instead of a flat map.
   sfSY() is the one projection every ground point passes through. */
const SF_TILT = 0.62;
function sfSY(wyPx, ch){ return (wyPx - cam.y) * cam.zoom * SF_TILT + ch / 2; }
function sfCamYawOf(v){
  const DV = [[0, 1], [0, -1], [-1, 0], [1, 0]][v ? v.face : 0] || [0, 1];
  return Math.atan2(DV[1], DV[0]);
}
window.addEventListener('keydown', e => {
  if(!SF_MODE) return;
  if(e.code === 'KeyV'){
    SF_VIEW = SF_VIEW === 'top' ? 'street' : 'top';
    if(SF_VIEW === 'street'){
      const v = VILLAGERS[inspectedPawnIdx];
      SF_CAM.yaw = sfCamYawOf(v); SF_CAM.pitch = 0; SF_CAM.h = 1.7;
      SF_CAM._lastPawn = inspectedPawnIdx;
      sfCamSnap();
    }
  }
  if(e.code === 'KeyC' && SF_VIEW === 'street'){
    SF_CAM.director = !SF_CAM.director;
    if(SF_CAM.director){
      const v = VILLAGERS[inspectedPawnIdx];
      SF_CAM.x = v ? v.x / SF_PXM : 600;
      SF_CAM.y = v ? v.y / SF_PXM : 400;
      sfCamSnap();
      if(typeof showToast === 'function') showToast('🎬 DIRECTOR camera — WASD fly · R/F up/down · drag look');
    } else { sfCamSnap(); if(typeof showToast === 'function') showToast('Follow-cam'); }
  }
  // v9: O = slow orbit around the subject; Z/X = lens (wider / longer)
  if(e.code === 'KeyO' && SF_VIEW === 'street' && !SF_CAM.director){
    SF_CAM.orbit = !SF_CAM.orbit;
    if(typeof showToast === 'function')
      showToast(SF_CAM.orbit ? '◌ ORBIT — circling the subject' : 'Orbit off');
  }
  if((e.code === 'KeyZ' || e.code === 'KeyX') && SF_VIEW === 'street'){
    SF_CAM.fov = clamp(SF_CAM.fov * (e.code === 'KeyZ' ? 1.12 : 0.89), 0.55, 2.4);
    if(typeof showToast === 'function')
      showToast(`Lens ${Math.round(50 * SF_CAM.fov)}mm`);
  }
});
if(SF_MODE && typeof window !== 'undefined'){
  let sfDrag = null;
  window.addEventListener('pointerdown', e => {
    if(SF_VIEW !== 'street' || !cv || e.target !== cv) return;
    sfDrag = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointermove', e => {
    if(!sfDrag) return;
    SF_CAM.yaw += (e.clientX - sfDrag.x) * 0.006;
    SF_CAM.pitch = clamp(SF_CAM.pitch - (e.clientY - sfDrag.y) * 0.004, -0.9, 0.9);
    sfDrag = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', () => { sfDrag = null; });
  window.addEventListener('wheel', e => {
    if(SF_VIEW !== 'street') return;
    // v8: scroll dollies the rig — lens height in director mode,
    // follow distance in third-person mode; v9: Shift+scroll zooms the lens
    if(e.shiftKey)
      SF_CAM.fov = clamp(SF_CAM.fov * (e.deltaY > 0 ? 0.9 : 1.11), 0.55, 2.4);
    else if(SF_CAM.director)
      SF_CAM.h = clamp(SF_CAM.h * (e.deltaY > 0 ? 1.12 : 0.89), 0.5, 30);
    else
      SF_CAM.back = clamp(SF_CAM.back * (e.deltaY > 0 ? 1.12 : 0.89), 2.5, 24);
    e.preventDefault();
  }, { passive: false });
}
if(SF_MODE && typeof document !== 'undefined'){
  const hb = document.getElementById('help-bar');
  if(hb) hb.innerHTML =
    '<span><kbd>V</kbd> Top/Street</span>' +
    '<span><kbd>Drag</kbd> Look</span>' +
    '<span><kbd>Q</kbd>/<kbd>E</kbd> Rotate</span>' +
    '<span><kbd>C</kbd> Director</span>' +
    '<span><kbd>O</kbd> Orbit</span>' +
    '<span><kbd>Z</kbd>/<kbd>X</kbd> Lens</span>' +
    '<span><kbd>Scroll</kbd> Dolly</span>' +
    '<span><kbd>WASD</kbd> Fly</span>' +
    '<span><kbd>R</kbd>/<kbd>F</kbd> Up/Down</span>';
}

/* ---------------- v6: "Karl" — living sky & cloud-shadow system -------
   A persistent field of cumulus clouds drifts over the neighborhood on
   the real wind vector (W.windAng/W.windSpd). The SAME clouds are drawn
   in the street-view sky, parallax-projected at altitude, and cast soft
   moving shadows on the ground in BOTH views. Coverage follows
   Open-Meteo cloud_cover (SF_WX.cover), boosted by rain/storm. Rain now
   renders in SF views too: wind-slanted streaks + wet-pavement gloom.
   A marine fog bank hugs the horizon whenever humidity is high. */
const SF_WX = {
  clouds: null, wrapX: 0, wrapY: 0,
  cover: 0.38,   // fetched cloud fraction; mild SF default
  t: 0, lastMs: 0, dt: 0,
  wet: 0,              // v7: pavement wetness memory 0..1 (soaks in rain, dries slowly)
  gust: 0.5,           // v7: wind gust envelope — trees breathe, debris surges
  flash: 0, nextFlash: 5, // v7: lightning driver
  leaves: null,        // v7: wind-blown leaf/litter particle field
  hazeK: 0.3,          // v9: aerial-perspective strength (humidity + cover)
  hazeRGB: '188,212,230', // v9: haze tint — matches horizon sky, day/night
};
/* v9: shared aerial-perspective falloff — light scattered by the marine
   layer washes distant geometry toward the horizon color. */
function sfHazeA(fwd){
  return Math.min(0.62, Math.max(0, (fwd - 45) / 240) * SF_WX.hazeK);
}
const SF_SUN = { x: 0.26, y: 0.16 }; // ground shadow dir per meter of height
const SF_CLOUD_ALT = 130;            // meters

function sfWxTick(){
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const dt = SF_WX.lastMs ? Math.min(0.5, (now - SF_WX.lastMs) / 1000) : 0;
  SF_WX.dt = dt; SF_WX.t += dt; SF_WX.lastMs = now;
  // v7: wetness memory — pavement soaks while it rains, dries over minutes.
  // The street stays glossy long after the last drop: classic SF morning.
  SF_WX.wet = clamp(SF_WX.wet + (W.rain > 0.1 ? W.rain * 0.05 : -0.006) * dt, 0, 1);
  // v7: gust envelope — slow multi-sine "breathing" of the wind field
  const g = 0.5 + 0.3 * Math.sin(SF_WX.t * 0.9) + 0.2 * Math.sin(SF_WX.t * 0.37 + 1.7);
  SF_WX.gust = clamp(g, 0, 1) * clamp(W.windSpd, 0.2, 3);
  // v7: lightning driver — random strikes while storming
  if(W.storm > 0.35){
    SF_WX.nextFlash -= dt * (0.4 + W.storm);
    if(SF_WX.nextFlash <= 0){
      SF_WX.flash = 1;
      SF_WX.nextFlash = 1.5 + hash2(SF_WX.t | 0, 7, SEED + 1800) * 9;
    }
  }
  SF_WX.flash = Math.max(0, SF_WX.flash - dt * 3.0);
}
function sfClouds(){
  if(SF_WX.clouds) return SF_WX.clouds;
  const cm = SF_M.cell_m;
  SF_WX.wrapX = SF_M.gw * cm + 700;
  SF_WX.wrapY = SF_M.gh * cm + 700;
  SF_WX.clouds = [];
  for(let k = 0; k < 46; k++){
    SF_WX.clouds.push({
      x: phash(k, 1, 1600) * SF_WX.wrapX,
      y: phash(k, 2, 1601) * SF_WX.wrapY,
      r: 22 + phash(k, 3, 1602) * 52,
      a: 0.55 + phash(k, 4, 1603) * 0.45,
      s: 0.55 + phash(k, 5, 1604) * 0.9,
    });
  }
  return SF_WX.clouds;
}
function sfCloudCover(){
  return clamp(SF_WX.cover + W.rain * 0.9 + W.storm * 0.6, 0, 1);
}
/* cloud position in world meters, drifting + wrapping on the wind */
function sfCloudPos(c){
  const vx = Math.cos(W.windAng) * W.windSpd * 11 * c.s;
  const vy = Math.sin(W.windAng) * W.windSpd * 11 * c.s;
  let x = (c.x + vx * SF_WX.t) % SF_WX.wrapX; if(x < 0) x += SF_WX.wrapX;
  let y = (c.y + vy * SF_WX.t) % SF_WX.wrapY; if(y < 0) y += SF_WX.wrapY;
  return [x - 350, y - 350];
}
/* 0..1 soft cloud occlusion over a world point (meters) — sun dimmer */
function sfCloudShadow(mx, my){
  const cs = sfClouds(), n = Math.ceil(cs.length * (0.25 + 0.75 * sfCloudCover()));
  let sh = 0;
  for(let i = 0; i < n; i++){
    const c = cs[i];
    const [cx, cy] = sfCloudPos(c);
    const gx = cx - SF_SUN.x * SF_CLOUD_ALT, gy = cy - SF_SUN.y * SF_CLOUD_ALT;
    const dx = mx - gx, dy = my - gy;
    const d2 = dx * dx + dy * dy, r2 = c.r * c.r;
    if(d2 < r2 * 4) sh += c.a * Math.exp(-d2 / r2);
  }
  return Math.min(1, sh * (0.4 + 0.6 * sfCloudCover()));
}
/* v11: ground-projected cloud blobs resolved ONCE per frame — the street
   ground pass used to re-run sfCloudPos (wrap/mod math) for every cell x
   every cloud. Same shadow field, a fraction of the arithmetic. */
function sfShadowBlobs(){
  const cs = sfClouds(), n = Math.ceil(cs.length * (0.25 + 0.75 * sfCloudCover()));
  const out = [];
  for(let i = 0; i < n; i++){
    const c = cs[i];
    const [cx, cy] = sfCloudPos(c);
    out.push([cx - SF_SUN.x * SF_CLOUD_ALT, cy - SF_SUN.y * SF_CLOUD_ALT,
              c.r * c.r, c.a]);
  }
  return out;
}
/* screen-space rain shared by both SF views */
function sfRainOverlay(cw, ch, slant){
  ctx.fillStyle = `rgba(60,72,96,${W.rain * 0.14})`;
  ctx.fillRect(0, 0, cw, ch);
  ctx.strokeStyle = `rgba(190,215,240,${clamp(W.rain * 0.5, 0, 0.6)})`;
  ctx.lineWidth = 1;
  const drops = Math.floor(70 + W.rain * 190);
  const bucket = Math.floor(SF_WX.t * 15);
  ctx.beginPath();
  for(let i = 0; i < drops; i++){
    const rx = hash2(i, bucket, SEED + 91) * (cw + 80) - 40;
    const ry = hash2(i, bucket + 977, SEED + 92) * (ch + 60) - 30;
    const len = 8 + hash2(i, 7, SEED + 95) * 12;
    ctx.moveTo(rx, ry); ctx.lineTo(rx + slant * len, ry + len);
  }
  ctx.stroke();
}

/* ---- v7: wind-blown leaves & litter riding the gust envelope ----
   Screen-space particles drifting on the wind vector, rendered as
   fluttering specks in both views. Density follows gusts/storms. */
function sfLeaves(){
  if(SF_WX.leaves) return SF_WX.leaves;
  SF_WX.leaves = [];
  const cols = ['#7aa03c', '#c8a03a', '#96602e', '#e6e2d4'];
  for(let k = 0; k < 70; k++){
    SF_WX.leaves.push({
      bx: phash(k, 11, 1711),  // screen-space home fractions
      by: phash(k, 12, 1712),
      ph: phash(k, 14, 1714) * 6.28,        // flutter phase
      s: 0.5 + phash(k, 15, 1715),
      c: cols[k % 4],
    });
  }
  return SF_WX.leaves;
}
/* wrap a drifting screen coordinate into [-m, dim+m] */
function sfWrapDrift(home, drift, dim, m){
  const D = dim + m * 2;
  let p = (home * D + drift) % D; if(p < 0) p += D;
  return p - m;
}
/* v7: lightning flash — pale violet wash over the whole frame */
function sfFlashOverlay(cw, ch){
  if(SF_WX.flash <= 0) return;
  const f = SF_WX.flash;
  ctx.fillStyle = `rgba(210,225,255,${f * f * 0.4})`;
  ctx.fillRect(0, 0, cw, ch);
}
/* v7: lazily-cached Dolores Park centroid, in meters — fog-finger anchor */
let SF_PARK_C = null;
function sfParkCenterM(){
  if(SF_PARK_C) return SF_PARK_C;
  let sx = 0, sy = 0, n = 0;
  for(let y = 0; y < SF_M.gh; y++) for(let x = 0; x < SF_M.gw; x++)
    if(SF_GRID[y * SF_M.gw + x] === 13){ sx += x; sy += y; n++; }
  SF_PARK_C = n ? [sx / n * SF_M.cell_m, sy / n * SF_M.cell_m]
                : [SF_M.gw * SF_M.cell_m / 2, SF_M.gh * SF_M.cell_m / 2];
  return SF_PARK_C;
}

/* ---------------- v10: renderer performance pass ----------------
   Four real architectural changes (SF views only — medieval untouched):
   1. SF_TERR — the top-view terrain layer (up to ~13k tiles/frame) is
      baked into a viewport-sized offscreen canvas, re-rendered ONLY when
      the pixel-quantized camera rect, zoom or wetness bucket changes.
      A stationary camera costs one drawImage instead of thousands of
      tile draws + per-tile noise.
   2. SF_DAPPLE — the drifting cloud-shadow dapple is a pre-rendered
      seamless 512px blob texture scrolled on the wind vector, replacing
      a 2-octave fbm() evaluation per tile per frame.
   3. sfRowBounds() — the street-view ground pass no longer scans all
      771x813 cells (~627k) every frame; per-row nonzero spans plus an
      analytic forward-range clamp reduce it to the visible cone only.
      The emitted cell set is identical — same painter's order, same art.
   4. SF_PERF — a live profiler chip (fps + render ms, EMA-smoothed)
      drawn in both views, and facade micro-detail (dentils, brackets,
      ivy, flower boxes) is distance-tiered so far walls cost far less.
   Physically: same sun, same wind, same wet streets — just cheaper. */
const SF_PERF = { ms: 0, fps: 60, t0: 0, last: 0, info: '' };
function sfPerfBegin(){
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if(SF_PERF.last) SF_PERF.fps += (1000 / Math.max(1, now - SF_PERF.last) - SF_PERF.fps) * 0.06;
  SF_PERF.last = now; SF_PERF.t0 = now; SF_PERF.info = '';
}
function sfPerfHud(cw, ch){
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  SF_PERF.ms += (now - SF_PERF.t0 - SF_PERF.ms) * 0.1;
  const ms = SF_PERF.ms, fps = Math.min(240, SF_PERF.fps);
  const lab = `PERF ${fps.toFixed(0)}fps ${ms.toFixed(1)}ms` +
              (SF_PERF.info ? ' ' + SF_PERF.info : '');
  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
  const tw = ctx.measureText(lab).width;
  const x = cw - tw - 30, y = ch - 14;
  ctx.fillStyle = 'rgba(6,10,14,0.62)';
  ctx.fillRect(x - 8, y - 15, tw + 16, 20);
  ctx.strokeStyle = 'rgba(140,220,170,0.45)'; ctx.lineWidth = 1;
  ctx.strokeRect(x - 8, y - 15, tw + 16, 20);
  ctx.fillStyle = ms < 16.7 ? '#8fe6a0' : (ms < 33 ? '#f0d060' : '#f08a6a');
  ctx.fillText(lab, x, y);
}
/* ---------------- v11: chunked terrain atlas ----------------
   The v10 viewport bake re-rendered the whole visible tile field (~13k
   tile ops) every time the pixel-quantized camera moved — i.e. on every
   frame of a pan. v11 instead bakes each 16x16-cell chunk (512x512px of
   world) ONCE into a persistent offscreen canvas at canonical scale and
   keeps it in an LRU map keyed by chunk + wetness bucket. A camera pan
   is then ~40 canvas blits and ZERO tile re-renders; only a wetness
   bucket crossing re-renders the visible chunks. Row/column spans use
   round-to-round extents so chunks abut seamlessly at any zoom. */
const SF_TERR = { cache: new Map(), max: 96 };
function sfTerrChunk(cx, cy, wetQ){
  const key = cx + ',' + cy + ',' + wetQ;
  const hit = SF_TERR.cache.get(key);
  if(hit){ // LRU touch
    SF_TERR.cache.delete(key); SF_TERR.cache.set(key, hit); return hit;
  }
  if(typeof document === 'undefined') return null;
  const csz = CS, cszT = CS * SF_TILT;   // canonical scale = zoom 1
  const c = document.createElement('canvas');
  c.width = CHN * csz;
  c.height = Math.round(CHN * cszT);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  for(let iy = 0; iy < CHN; iy++){
    const sy = Math.round(iy * cszT), sh = Math.round((iy + 1) * cszT) - sy;
    for(let ix = 0; ix < CHN; ix++){
      const wx = cx * CHN + ix, wy = cy * CHN + iy;
      const tt = sfTile(wx, wy);
      const spr = sfTerrainTile(wx, wy, tt);
      const sx = ix * csz;
      if(spr && spr.c) g.drawImage(spr.c, sx, sy, csz, sh);
      // v7: wetness memory — soaked hardscape darkens, puddles glint
      if(SF_WX.wet > 0.05 && (tt === 10 || tt === 11 || tt === 14 || tt === 16)){
        const wv = SF_WX.wet;
        g.fillStyle = `rgba(24,32,48,${wv * 0.2})`;
        g.fillRect(sx, sy, csz, sh);
        if(wv > 0.25 && hash2(wx, wy, SEED + 1810) < wv * 0.5){
          const pw = csz * (0.16 + hash2(wx, wy, SEED + 1811) * 0.2);
          g.fillStyle = `rgba(170,200,230,${wv * 0.34})`;
          g.beginPath();
          g.ellipse(sx + csz * 0.5, sy + cszT * 0.56, pw, pw * 0.6 * SF_TILT, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }
  SF_TERR.cache.set(key, c);
  while(SF_TERR.cache.size > SF_TERR.max)
    SF_TERR.cache.delete(SF_TERR.cache.keys().next().value);
  return c;
}
/* v10: temporal frame cache — a frozen camera + static scene redraws
   identical output 60x a second. We hash everything that can change the
   picture (rig pose, pawn positions, weather buckets, 2Hz wind clock)
   and blit the last frame when it matches: stale by <0.5s at worst,
   ~1 drawImage instead of the full painter's pass. */
const SF_STILL = { c: null, g: null, key: '' };
function sfStillKey(cw, ch, view, pose){
  let sig = 0;
  for(const v of VILLAGERS)
    sig += Math.round(v.x) + Math.round(v.y) + (v.face || 0) * 13 +
           (v.inBuilding ? 7919 : 0);
  return [view, cw, ch, Math.round(SF_WX.t * 2), isNight() ? 1 : 0,
          Math.round(W.tod * 24), Math.round(W.rain * 8),
          Math.round(SF_WX.wet * 8), Math.round(sfCloudCover() * 8),
          Math.round(SF_WX.gust * 4), Math.round(sig), inspectedPawnIdx]
          .concat(pose).join(',');
}
function sfStillHit(key){
  if(SF_STILL.key !== key || !SF_STILL.c) return false;
  ctx.drawImage(SF_STILL.c, 0, 0);
  return true;
}
function sfStillStore(cw, ch, key){
  if(typeof document === 'undefined' || !ctx.canvas) return;
  if(!SF_STILL.c){
    SF_STILL.c = document.createElement('canvas');
    SF_STILL.g = SF_STILL.c.getContext('2d');
  }
  if(SF_STILL.c.width !== cw || SF_STILL.c.height !== ch){
    SF_STILL.c.width = cw; SF_STILL.c.height = ch;
  }
  SF_STILL.g.drawImage(ctx.canvas, 0, 0, cw, ch);
  SF_STILL.key = key;
}
/* seamless cloud-dapple texture: blobs drawn 9-way wrapped so the tile
   repeats without seams as it scrolls on the wind */
let SF_DAPPLE = null;
function sfDappleTex(){
  if(SF_DAPPLE) return SF_DAPPLE;
  const S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  for(let k = 0; k < 30; k++){
    const x = phash(k, 61, 1801) * S, y = phash(k, 62, 1802) * S;
    const r = 46 + phash(k, 63, 1803) * 95;
    const a = 0.2 + phash(k, 64, 1804) * 0.26;
    for(const ox of [-S, 0, S]) for(const oy of [-S, 0, S]){
      const gr = g.createRadialGradient(x + ox, y + oy, r * 0.2,
                                        x + ox, y + oy, r);
      gr.addColorStop(0, `rgba(30,38,62,${a})`);
      gr.addColorStop(1, 'rgba(30,38,62,0)');
      g.fillStyle = gr;
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  SF_DAPPLE = c; return c;
}
/* per-row [minX,maxX] nonzero cell span for the street-view cone scan */
let SF_ROWB = null;
function sfRowBounds(){
  if(SF_ROWB) return SF_ROWB;
  SF_ROWB = new Array(SF_M.gh);
  for(let y = 0; y < SF_M.gh; y++){
    let lo = -1, hi = -1;
    const row = y * SF_M.gw;
    for(let x = 0; x < SF_M.gw; x++)
      if(SF_GRID[row + x]){ if(lo < 0) lo = x; hi = x; }
    SF_ROWB[y] = lo < 0 ? null : [lo, hi];
  }
  return SF_ROWB;
}

function sfTerrainTile(wx, wy, tt){
  const T = PA.sf;
  switch(tt){
    case 10: {
      const deco = SF_DECO.get(wx + ',' + wy) || 0;
      if(deco & 1) return T.laneV;
      if(deco & 2) return T.laneH;
      return T.street[Math.abs(hash2(wx, wy, SEED + 61) * 3) | 0];
    }
    case 16: {
      const roadEW = sfTile(wx - 1, wy) === 10 || sfTile(wx + 1, wy) === 10;
      return roadEW ? T.crossV : T.crossH;
    }
    case 11: case 14: {
      if(tt === 14) return T.poi;
      let m = 0;
      if(sfTile(wx, wy - 1) === 10 || sfTile(wx, wy - 1) === 16) m |= 1;
      if(sfTile(wx, wy + 1) === 10 || sfTile(wx, wy + 1) === 16) m |= 2;
      if(sfTile(wx - 1, wy) === 10 || sfTile(wx - 1, wy) === 16) m |= 4;
      if(sfTile(wx + 1, wy) === 10 || sfTile(wx + 1, wy) === 16) m |= 8;
      return T.sidewalk[m];
    }
    case 15: {
      let m = 0;
      if(sfTile(wx, wy - 1) === 15 || sfTile(wx, wy - 1) === 11) m |= 1;
      if(sfTile(wx, wy + 1) === 15 || sfTile(wx, wy + 1) === 11) m |= 2;
      if(sfTile(wx - 1, wy) === 15 || sfTile(wx - 1, wy) === 11) m |= 4;
      if(sfTile(wx + 1, wy) === 15 || sfTile(wx + 1, wy) === 11) m |= 8;
      return T.parkpath[m];
    }
    case 13:
      return T.park[Math.abs(hash2(wx, wy, SEED + 62) * 3) | 0];
    case 12:
      return T.sidewalk[0]; // concrete pad beneath buildings
    default:
      return T.lot[Math.abs(hash2(wx, wy, SEED + 63) * 2) | 0];
  }
}

function sfRenderWorld(cw, ch){
  sfPerfBegin();
  sfWxTick();
  // v10: temporal frame cache — blit the last frame when nothing moved
  const stillKey = sfStillKey(cw, ch, 'top',
    [Math.round(cam.x), Math.round(cam.y), Math.round(cam.zoom * 1000)]);
  if(sfStillHit(stillKey)){ sfPerfHud(cw, ch); return; }
  const sfDappleOn = !isNight();
  const cs = CS * cam.zoom;
  const csT = cs * SF_TILT;   // v8: squashed ground-plane cell height

  const wx0 = Math.floor((cam.x - cw / 2 / cam.zoom) / CS) - 1;
  const wx1 = Math.floor((cam.x + cw / 2 / cam.zoom) / CS) + 1;
  const wy0 = Math.floor((cam.y - ch / 2 / cam.zoom / SF_TILT) / CS) - 1;
  const wy1 = Math.floor((cam.y + ch / 2 / cam.zoom / SF_TILT) / CS) + 1;

  // 1. terrain — v11: chunked atlas. Each visible 16x16-cell chunk is one
  //    persistent canvas blit; camera pans never re-render tiles. Wetness
  //    is part of the chunk key (it changes over many seconds). A 0.75px
  //    draw overlap hides hairline seams at fractional zooms.
  const wetQ = Math.round(SF_WX.wet * 8);
  let nChunks = 0;
  for(let cy = Math.floor(wy0 / CHN); cy <= Math.floor(wy1 / CHN); cy++){
    for(let cx = Math.floor(wx0 / CHN); cx <= Math.floor(wx1 / CHN); cx++){
      const tc = sfTerrChunk(cx, cy, wetQ);
      if(!tc) continue;
      nChunks++;
      ctx.drawImage(tc,
        (cx * CHN * CS - cam.x) * cam.zoom + cw / 2,
        (cy * CHN * CS - cam.y) * cam.zoom * SF_TILT + ch / 2,
        CHN * CS * cam.zoom + 0.75, CHN * CS * cam.zoom * SF_TILT + 0.75);
    }
  }
  SF_PERF.info = nChunks + 'chk';

  // v10: dappled cloud light — one seamless blob texture scrolled on the
  // wind vector instead of per-tile fbm; same cause (drifting cumulus),
  // a fraction of the cost, and it slides smoothly every frame.
  if(sfDappleOn && typeof document !== 'undefined'){
    const tex = sfDappleTex(), S = 512;
    const wdx = Math.cos(W.windAng), wdy = Math.sin(W.windAng);
    let ox = (wdx * W.windSpd * 22 * SF_WX.t) % S; if(ox > 0) ox -= S;
    let oy = (wdy * W.windSpd * 22 * SF_WX.t) % S; if(oy > 0) oy -= S;
    ctx.globalAlpha = clamp(0.45 + 0.5 * sfCloudCover(), 0, 0.85);
    for(let ty = oy; ty < ch; ty += S)
      for(let tx = ox; tx < cw; tx += S)
        ctx.drawImage(tex, tx, ty);
    ctx.globalAlpha = 1;
  }

  // 2. collect drawables: buildings in view + props + pawns, y-sorted
  const drawables = [];
  const seen = new Set();
  for(let cy = Math.floor(wy0 / CHN); cy <= Math.floor(wy1 / CHN); cy++){
    for(let cx = Math.floor(wx0 / CHN); cx <= Math.floor(wx1 / CHN); cx++){
      const lst = SF_BLD_GRID.get(cx + ',' + cy);
      if(!lst) continue;
      for(const bi of lst){
        if(seen.has(bi)) continue;
        seen.add(bi);
        const b = SF_BLD[bi];
        if(b.bx1 < cam.x - cw / 2 / cam.zoom - 64 || b.bx0 > cam.x + cw / 2 / cam.zoom + 64) continue;
        if(b.by1 - b.hPx / SF_TILT < cam.y - ch / 2 / cam.zoom / SF_TILT - 220 ||
           b.by0 > cam.y + ch / 2 / cam.zoom / SF_TILT + 64) continue;
        drawables.push({ kind: 'bld', y: b.by1, b });
      }
    }
  }
  // v11: props come from the chunk index — only chunks overlapping the
  // view rect (padded by the same pixel margins the per-prop test uses,
  // plus one cell of sub-cell jitter) are walked. The emitted set is
  // identical to the old full-map scan.
  const px0 = Math.floor((cam.x - cw / 2 / cam.zoom - 64 - CS) / CS);
  const px1 = Math.floor((cam.x + cw / 2 / cam.zoom + 64 + CS) / CS);
  const py0 = Math.floor((cam.y - ch / 2 / cam.zoom / SF_TILT - 200 - CS) / CS);
  const py1 = Math.floor((cam.y + ch / 2 / cam.zoom / SF_TILT + 32 + CS) / CS);
  for(let cy = Math.floor(py0 / CHN); cy <= Math.floor(py1 / CHN); cy++){
    for(let cx = Math.floor(px0 / CHN); cx <= Math.floor(px1 / CHN); cx++){
      const lst = SF_PROP_DRAW.get(cx + ',' + cy);
      if(!lst) continue;
      for(const o of lst){
        if(o.x < cam.x - cw / 2 / cam.zoom - 64 || o.x > cam.x + cw / 2 / cam.zoom + 64) continue;
        if(o.y < cam.y - ch / 2 / cam.zoom / SF_TILT - 200 || o.y > cam.y + ch / 2 / cam.zoom / SF_TILT + 32) continue;
        drawables.push({ kind: 'prop', y: o.y, o });
      }
    }
  }
  for(const v of VILLAGERS){
    if(v.inBuilding && v !== VILLAGERS[controlledPawnIdx]) continue;
    drawables.push({ kind: 'pawn', y: v.y, v });
  }
  drawables.sort((a, b) => a.y - b.y);

  for(const d of drawables){
    if(d.kind === 'bld'){
      const b = d.b;
      const art = getSfBldArt(b.i, SF_WX.wet > 0.45 ? 1 : 0); // v12: wet bake
      const sx = Math.round((b.bx0 - cam.x) * cam.zoom + cw / 2 - art.ox * cam.zoom);
      // v8 diorama: anchor the sprite's SOUTH footprint edge to the tilted
      // ground so facades stand on the correct pavement line; the roof plane
      // visually deepens toward the tilted north edge.
      const sy = Math.round(sfSY(b.by1, ch) - (art.oy + (b.by1 - b.by0)) * cam.zoom);
      ctx.drawImage(art.c, sx, sy, art.c.width * cam.zoom, art.c.height * cam.zoom);
      if(cam.zoom >= 0.9 && b.name){
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const lx = Math.round((b.x - cam.x) * cam.zoom + cw / 2);
        const ly = Math.round(sfSY(b.by0, ch) - b.hPx * cam.zoom - 8);
        const tw = ctx.measureText(b.name).width;
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.fillRect(lx - tw / 2 - 4, ly - 11, tw + 8, 14);
        ctx.fillStyle = '#fef08a';
        ctx.fillText(b.name, lx, ly);
      }
    } else if(d.kind === 'prop'){
      const o = d.o, V = PA.sfVeg;
      let spr = null, shadeR = 0;
      if(o.kind === 'sfTree'){ spr = V.tree[Math.abs(hash2(o.wx, o.wy, 7) * V.tree.length) | 0]; shadeR = 15; }
      else if(o.kind === 'sfPalm'){ spr = V.palm[Math.abs(hash2(o.wx, o.wy, 8) * V.palm.length) | 0]; shadeR = 9; }
      else if(o.kind === 'sfStreetTree'){ spr = V.streetTree[o.v != null ? o.v : 0]; shadeR = 11; }
      else if(o.kind === 'sfCypress'){ spr = V.cypress[Math.abs(hash2(o.wx, o.wy, 9) * V.cypress.length) | 0]; shadeR = 8; }
      else if(o.kind === 'sfBench') spr = V.bench;
      else if(o.kind === 'sfLamp') spr = isNight() ? V.lampOn : V.lampOff;
      else if(o.kind === 'sfShrub') spr = V.shrub[Math.abs(hash2(o.wx, o.wy, 10) * V.shrub.length) | 0];
      else if(o.kind === 'sfFlowerBed') spr = V.flowerbed[Math.abs(hash2(o.wx, o.wy, 11) * V.flowerbed.length) | 0];
      else if(o.kind === 'sfPlanter') spr = V.planter;
      const sprC = spr && (spr.c || spr);
      if(sprC){
        const sx = Math.round((o.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round(sfSY(o.y, ch));
        // v5: canopy cast shadow pushed down-right like the building sun
        if(shadeR && !isNight()){
          ctx.fillStyle = 'rgba(20,26,12,0.22)';
          ctx.beginPath();
          ctx.ellipse(sx + shadeR * 0.5 * cam.zoom, sy + shadeR * 0.28 * cam.zoom * SF_TILT,
                      shadeR * cam.zoom, shadeR * 0.42 * cam.zoom * SF_TILT, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        const pw = sprC.width * cam.zoom, ph = sprC.height * cam.zoom;
        // v6: canopy sway on the wind (trees only; storms rock harder)
        // v7: modulated by the gust envelope — canopies breathe in waves
        const sway = (o.kind === 'sfTree' || o.kind === 'sfStreetTree' ||
                      o.kind === 'sfPalm' || o.kind === 'sfCypress')
          ? Math.sin(SF_WX.t * 1.7 + o.x * 0.05 + o.y * 0.03) *
            0.022 * (0.3 + SF_WX.gust * 0.9 + W.storm * 1.4)
          : 0;
        if(sway){
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(sway);
          ctx.drawImage(sprC, -pw / 2, -ph + 4 * cam.zoom, pw, ph);
          ctx.restore();
        } else ctx.drawImage(sprC, sx - pw / 2, sy - ph + 4 * cam.zoom, pw, ph);
      }
    } else {
      renderChibiPawn(d.v, cw, ch);
    }
  }

  // 2b. v6: drifting cloud shadows — soft blobs sliding over the whole map
  const cover = sfCloudCover();
  if(!isNight() && cover > 0.05){
    const cs2 = sfClouds(), n = Math.ceil(cs2.length * (0.25 + 0.75 * cover));
    for(let i = 0; i < n; i++){
      const c = cs2[i];
      const [cxm, cym] = sfCloudPos(c);
      const gx = (cxm - SF_SUN.x * SF_CLOUD_ALT) * SF_PXM;
      const gy = (cym - SF_SUN.y * SF_CLOUD_ALT) * SF_PXM;
      const sx = (gx - cam.x) * cam.zoom + cw / 2;
      const sy = sfSY(gy, ch);
      const rr = c.r * SF_PXM * cam.zoom * 1.5;
      if(sx + rr < 0 || sx - rr > cw || sy + rr < 0 || sy - rr > ch) continue;
      const a = Math.min(0.4, 0.42 * c.a * (0.35 + 0.65 * cover));
      const g = ctx.createRadialGradient(sx, sy, rr * 0.15, sx, sy, rr);
      g.addColorStop(0, `rgba(28,36,58,${a})`);
      g.addColorStop(1, 'rgba(28,36,58,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy, rr, rr * 0.72 * SF_TILT, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 2c. v6: rain streaks + gloom over the neighborhood
  if(W.rain > 0.08) sfRainOverlay(cw, ch, Math.sin(W.windAng) * 0.6);

  // 2d. v7: wind-blown leaves & litter skittering across the map —
  // screen-space drift along the wind vector so gusts are always felt
  if(W.windSpd > 0.35){
    const lv = sfLeaves();
    const nL = Math.ceil(lv.length * clamp(0.4 + SF_WX.gust * 0.6 + W.storm * 0.5, 0, 1));
    const dx = Math.cos(W.windAng), dy = Math.sin(W.windAng);
    for(let i = 0; i < nL; i++){
      const l = lv[i];
      const sp = (60 + l.s * 160) * W.windSpd * (0.4 + SF_WX.gust);
      const sx = sfWrapDrift(l.bx, dx * sp * SF_WX.t, cw, 130);
      const sy = sfWrapDrift(l.by, dy * sp * SF_WX.t, ch, 130);
      const sz = (2.2 + l.s * 1.8) * Math.max(0.6, cam.zoom);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(l.ph + SF_WX.t * (4 + l.s * 3));
      ctx.fillStyle = l.c;
      ctx.fillRect(-sz, -sz * 0.5, sz * 2, sz);
      ctx.restore();
    }
  }

  // 2d2. v7: gust streaks — translucent wind lines sweeping the map
  const gstr = clamp(0.2 + SF_WX.gust * 0.6 + W.storm * 0.5, 0, 1);
  if(gstr > 0.15){
    const wxv = Math.cos(W.windAng), wyv = Math.sin(W.windAng);
    ctx.strokeStyle = `rgba(255,255,255,${0.3 * gstr})`;
    ctx.lineWidth = Math.max(1.5, 2.5 * cam.zoom);
    ctx.lineCap = 'round';
    for(let k = 0; k < 10; k++){
      const ox = (phash(k, 52, 1751) * (cw + 500) + SF_WX.t * W.windSpd * 150) % (cw + 500) - 250;
      const oy = phash(k, 53, 1752) * ch;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + wxv * 150, oy + wyv * 150);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  // 2e. v7: fog fingers — low mist drifting through Dolores Park on humid days
  if(!isNight() && W.hum > 0.6){
    const fogF = clamp((W.hum - 0.6) * 2.2, 0, 0.8);
    if(fogF > 0.04){
      const [pcx, pcy] = sfParkCenterM();
      for(let k = 0; k < 9; k++){
        let ox = phash(k, 21, 1720) * 320 + Math.cos(W.windAng) * SF_WX.t * W.windSpd * 6;
        let oy = phash(k, 22, 1721) * 240 + Math.sin(W.windAng) * SF_WX.t * W.windSpd * 6;
        ox = ((ox % 320) + 320) % 320 - 160;
        oy = ((oy % 240) + 240) % 240 - 120;
        const sx = ((pcx + ox) * SF_PXM - cam.x) * cam.zoom + cw / 2;
        const sy = sfSY((pcy + oy) * SF_PXM, ch);
        const rr = (10 + phash(k, 23, 1722) * 16) * SF_PXM * cam.zoom;
        if(sx + rr < 0 || sx - rr > cw || sy + rr < 0 || sy - rr > ch) continue;
        const fg2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, rr);
        fg2.addColorStop(0, `rgba(226,232,238,${fogF * 0.3})`);
        fg2.addColorStop(1, 'rgba(226,232,238,0)');
        ctx.fillStyle = fg2;
        ctx.beginPath();
        ctx.ellipse(sx, sy, rr, rr * 0.4 * SF_TILT, W.windAng * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2f. v7: lightning wash
  sfFlashOverlay(cw, ch);

  // 3. street name labels along road midpoints
  if(cam.zoom >= 0.85){
    ctx.textAlign = 'center';
    for(const r of SF_MAP.roads){
      const px = r.x * SF_PXM, py = r.y * SF_PXM;
      if(px < cam.x - cw / 2 / cam.zoom || px > cam.x + cw / 2 / cam.zoom) continue;
      if(py < cam.y - ch / 2 / cam.zoom / SF_TILT || py > cam.y + ch / 2 / cam.zoom / SF_TILT) continue;
      const sx = Math.round((px - cam.x) * cam.zoom + cw / 2);
      const sy = Math.round(sfSY(py, ch));
      ctx.save();
      ctx.translate(sx, sy);
      // v8: road angle re-projected through the tilted ground plane
      const ra = r.angle * Math.PI / 180;
      ctx.rotate(Math.atan2(Math.sin(ra) * SF_TILT, Math.cos(ra)));
      ctx.font = '600 9px sans-serif';
      ctx.strokeStyle = 'rgba(20,20,24,0.8)'; ctx.lineWidth = 3;
      ctx.strokeText(r.name, 0, 0);
      ctx.fillStyle = 'rgba(240,238,230,0.92)';
      ctx.fillText(r.name, 0, 0);
      ctx.restore();
    }
  }

  // v10: stash this frame for the temporal cache, then profiler chip
  sfStillStore(cw, ch, stillKey);
  sfPerfHud(cw, ch);
}

/* ---------------- v3 facade detail pass ----------------
   sfStreetWall() renders one camera-facing wall edge with full Victorian
   dressing: gradient wall, parapet + coping, bracketed cornice, string
   courses, hooded capsule windows, projecting bay windows, and a styled
   ground floor (storefront / stoop / garage). All in world-space meters,
   projected through pr(). */
function sfStreetWall(b, ei, x1, y1, x2, y2, ex, ey, L, nx, ny, hm, pr, F, night, fwd){
  const i = b.i;
  const wallBase = SF_WALL_COLS[Math.floor(phash(i, 7, 1300) * SF_WALL_COLS.length)];
  const TRIM = SF_TRIM_COLS[Math.floor(phash(i, 9, 1301) * SF_TRIM_COLS.length)];
  const isShop = !!b.name || phash(i, 5, 1303) < 0.12;
  const style = Math.floor(phash(i, 13, 1405) * 3); // 0 italianate 1 stick 2 marina
  // v10: distance-tiered detail — 2 near / 1 mid / 0 silhouette. Micro-trim
  // (dentils, brackets, ivy, flower boxes) only resolves where the lens
  // can see it; mid keeps windows + bays; past ~160m a wall is massing
  // and parapet under marine haze — the detail pass is skipped entirely.
  const det = fwd < 85 ? 2 : (fwd < 160 ? 1 : 0);
  // v6: passing cloud dims the whole wall
  const dim = (night ? 0.4 : 1) *
              (1 - 0.45 * sfCloudShadow(b.x / SF_PXM, b.y / SF_PXM));
  const lit = (0.55 + 0.45 * Math.max(0, nx * -0.5 + ny * -0.85)) * dim;
  const para = 0.5 + phash(i, 17, 1406) * 0.35;
  const ux = ex / L, uy = ey / L;
  const quad = (pts, fill) => {
    let started = false;
    ctx.beginPath();
    for(const [qx, qy, qz] of pts){
      const p = pr(qx, qy, qz);
      if(!p) return null;
      started ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      started = true;
    }
    ctx.closePath();
    if(fill){ ctx.fillStyle = fill; ctx.fill(); }
    return true;
  };

  const g1 = pr(x1, y1, 0), g2 = pr(x2, y2, 0),
        t1 = pr(x1, y1, hm), t2 = pr(x2, y2, hm),
        p1 = pr(x1, y1, hm + para), p2 = pr(x2, y2, hm + para);
  if(!g1 || !g2 || !t1 || !t2 || !p1 || !p2) return;

  // cast shadow: base edge extruded on the ground away from the sun
  quad([[x1, y1, 0.02], [x2, y2, 0.02],
        [x2 - hm * 0.26, y2 - hm * 0.16, 0.02],
        [x1 - hm * 0.26, y1 - hm * 0.16, 0.02]], 'rgba(15,12,8,0.18)');

  // wall face: vertical gradient — sky-lit top, AO near the pavement
  const wgr = ctx.createLinearGradient(0, Math.min(p1[1], p2[1]), 0, Math.max(g1[1], g2[1]));
  wgr.addColorStop(0, shade(wallBase, Math.min(1.3, lit * 1.14)));
  wgr.addColorStop(0.7, shade(wallBase, lit));
  wgr.addColorStop(1, shade(wallBase, lit * 0.68));
  ctx.fillStyle = wgr;
  ctx.beginPath();
  ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
  ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p1[0], p1[1]);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,16,12,0.4)'; ctx.lineWidth = 1; ctx.stroke();

  // parapet coping + bracketed cornice
  ctx.strokeStyle = shade(TRIM, 1.05);
  ctx.lineWidth = Math.max(1, F * 0.022 / g1[2]);
  ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  const cA = pr(x1, y1, hm - 0.45), cB = pr(x2, y2, hm - 0.45);
  if(cA && cB){
    ctx.strokeStyle = TRIM;
    ctx.lineWidth = Math.max(1.5, F * 0.05 / g1[2]);
    ctx.beginPath(); ctx.moveTo(cA[0], cA[1]); ctx.lineTo(cB[0], cB[1]); ctx.stroke();
    // dentil row under the cornice band
    const dA = pr(x1, y1, hm - 0.72), dB = pr(x2, y2, hm - 0.72);
    if(dA && dB && det === 2){
      const nD = Math.max(2, Math.floor(Math.hypot(cB[0] - cA[0], cB[1] - cA[1]) / 7));
      ctx.fillStyle = shade(TRIM, 0.8);
      for(let k = 0; k <= nD; k++){
        const u = k / nD;
        ctx.fillRect(dA[0] + (dB[0] - dA[0]) * u - 1.2,
                     dA[1] + (dB[1] - dA[1]) * u, 2.4,
                     Math.max(2, Math.abs(cA[1] - dA[1]) * 0.8));
      }
    }
    // scrolled brackets every ~3m
    const nB = det === 2 ? Math.max(1, Math.floor(L / 3)) : 0;
    for(let k = 0; k < nB; k++){
      const u = (k + 0.5) / nB;
      const pb2 = pr(x1 + ex * u, y1 + ey * u, hm - 1.2),
            pt2 = pr(x1 + ex * u, y1 + ey * u, hm - 0.42);
      if(!pb2 || !pt2) continue;
      ctx.fillStyle = TRIM;
      ctx.fillRect(pb2[0] - 1.6, pt2[1], 3.2, pb2[1] - pt2[1]);
      ctx.fillRect(pb2[0] - 2.6, pt2[1], 5.2, Math.max(1.5, (pb2[1] - pt2[1]) * 0.25));
    }
  }

  // v10 silhouette tier: >160m — face + parapet + marine haze, done.
  if(det === 0){
    const hz0 = sfHazeA(fwd);
    if(hz0 > 0.02){
      ctx.globalAlpha = hz0; ctx.fillStyle = `rgb(${SF_WX.hazeRGB})`;
      ctx.beginPath();
      ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
      ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p1[0], p1[1]);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    return;
  }

  const floors = Math.max(1, Math.round(hm / 3));
  // string courses between floors
  for(let f = det >= 1 ? 1 : floors; f < floors; f++){
    const sA = pr(x1, y1, hm * f / floors), sB = pr(x2, y2, hm * f / floors);
    if(!sA || !sB) continue;
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = shade(TRIM, 1.05);
    ctx.lineWidth = Math.max(0.6, F * 0.012 / g1[2]);
    ctx.beginPath(); ctx.moveTo(sA[0], sA[1]); ctx.lineTo(sB[0], sB[1]); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // capsule window: trim frame + sky-reflection glass + sill + lintel
  const drawWin = (wx, wy, zB, zT, wm) => {
    const pb = pr(wx, wy, zB), pt = pr(wx, wy, zT);
    if(!pb || !pt) return;
    const wh = pb[1] - pt[1], ww = wm * F / pb[2];
    if(ww < 2 || wh < 2.5) return;
    const r = ww / 2;
    ctx.fillStyle = TRIM;
    ctx.beginPath();
    ctx.moveTo(pb[0] - r - 1, pb[1]); ctx.lineTo(pb[0] - r - 1, pt[1] + r + 1);
    ctx.arc(pb[0], pt[1] + r + 1, r + 1, Math.PI, 0, true);
    ctx.lineTo(pb[0] + r + 1, pb[1]); ctx.closePath(); ctx.fill();
    const gg = ctx.createLinearGradient(0, pt[1], 0, pb[1]);
    if(night && phash(wx * 7 | 0, zB * 13 | 0, i) < 0.5){
      gg.addColorStop(0, '#ffe9b0'); gg.addColorStop(1, '#c9862e');
    } else {
      gg.addColorStop(0, '#5d7d92'); gg.addColorStop(0.55, '#8fb0c6');
      gg.addColorStop(1, '#a9c6da');
    }
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(pb[0] - r, pb[1]); ctx.lineTo(pb[0] - r, pt[1] + r);
    ctx.arc(pb[0], pt[1] + r, r, Math.PI, 0, true);
    ctx.lineTo(pb[0] + r, pb[1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(TRIM, 0.9); ctx.lineWidth = Math.max(0.5, ww * 0.06);
    ctx.beginPath();
    ctx.moveTo(pb[0] - r, pt[1] + wh * 0.45); ctx.lineTo(pb[0] + r, pt[1] + wh * 0.45);
    ctx.stroke();
    ctx.fillStyle = shade(TRIM, 1.05);
    ctx.fillRect(pb[0] - r - 2, pb[1], ww + 4, Math.max(1.5, wh * 0.08));
    // v5: window flower box on some residential sills
    if(det === 2 && !isShop && phash(Math.round(wx * 13), Math.round(zB * 29), i + 1700) < 0.15){
      const bh = Math.max(1.5, wh * 0.1);
      ctx.fillStyle = night ? '#2a2018' : '#7a4a2e';
      ctx.fillRect(pb[0] - r - 1, pb[1] + bh * 0.8, ww + 2, bh);
      ctx.fillStyle = night ? '#1c2a16' : '#3e7a34';
      ctx.fillRect(pb[0] - r - 1, pb[1] + bh * 0.2, ww + 2, bh * 0.8);
      if(!night){
        const cols = ['#e05a5a', '#f0d05a', '#f0a8c8'];
        for(let k = 0; k < 3; k++){
          ctx.fillStyle = cols[Math.floor(phash(k, Math.round(wx * 7), 1701) * 3)];
          ctx.fillRect(pb[0] - r + ww * (0.2 + k * 0.3), pb[1], 2, 2);
        }
      }
    }
    if(style === 0 && det >= 1){ // italianate hood moulding + keystone
      ctx.fillRect(pb[0] - r - 2, pt[1] - 1, ww + 4, Math.max(1, wh * 0.05));
      ctx.fillRect(pb[0] - 1, pt[1] - wh * 0.06, 2, wh * 0.08);
    }
  };

  // upper-floor window grid
  const bays = Math.max(1, Math.floor(L / 3.2));
  const doorT = style === 2 ? 0.68 : 0.5;
  for(let f = isShop ? 1 : 0; f < floors; f++){
    const zB = hm * f / floors + 0.55, zT = hm * (f + 1) / floors - 0.5;
    for(let k = 0; k < bays; k++){
      const t = (k + 0.5) / bays;
      if(f === 0 && Math.abs(t - doorT) < 0.14) continue;
      drawWin(x1 + ex * t, y1 + ey * t, zB, zT, 1.15);
    }
  }

  // projecting Victorian bay windows on tall street-facing fronts
  if(floors >= 2 && L > 7.5 && ny > 0.2 && style !== 2 && phash(i, ei, 1410) < 0.85){
    const nBay = L > 13 ? 2 : 1;
    const zLo = 2.6, zHi = hm - 0.9;
    for(let k = 0; k < nBay; k++){
      const tb = nBay === 1 ? 0.5 : 0.28 + 0.44 * k;
      const hw = Math.min(1.7, L * 0.16), pd = 0.8;
      const ax = x1 + ex * tb - ux * hw, ay = y1 + ey * tb - uy * hw;
      const bx = x1 + ex * tb + ux * hw, by = y1 + ey * tb + uy * hw;
      const a2x = ax + nx * pd, a2y = ay + ny * pd;
      const b2x = bx + nx * pd, b2y = by + ny * pd;
      quad([[ax, ay, zLo], [ax, ay, zHi], [a2x, a2y, zHi], [a2x, a2y, zLo]],
           shade(wallBase, lit * 0.78));
      quad([[b2x, b2y, zLo], [b2x, b2y, zHi], [bx, by, zHi], [bx, by, zLo]],
           shade(wallBase, lit * 0.78));
      quad([[a2x, a2y, zLo], [b2x, b2y, zLo], [b2x, b2y, zHi], [a2x, a2y, zHi]],
           shade(wallBase, Math.min(1.25, lit * 1.06)));
      const bayFl = floors - 1;
      for(let f = 0; f < bayFl; f++){
        const zz = zLo + (zHi - zLo) * (f + 0.5) / bayFl;
        for(const uu of [0.3, 0.7]){
          const wx = a2x + (b2x - a2x) * uu, wy = a2y + (b2y - a2y) * uu;
          drawWin(wx, wy, zz - 0.55, zz + 0.55, 0.6);
        }
      }
      // bay cornice + hipped cap
      const hA = pr(a2x, a2y, zHi), hB = pr(b2x, b2y, zHi),
            hM = pr((a2x + b2x) / 2, (a2y + b2y) / 2, zHi + 0.55);
      if(hA && hB && hM){
        ctx.fillStyle = shade(TRIM, 0.9);
        ctx.beginPath();
        ctx.moveTo(hA[0], hA[1]); ctx.lineTo(hB[0], hB[1]); ctx.lineTo(hM[0], hM[1]);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  // ---- ground floor ----
  if(isShop && L > 6){
    const s0 = 0.16, s1 = 0.84;
    const sx0 = x1 + ex * s0, sy0 = y1 + ey * s0;
    const sx1 = x1 + ex * s1, sy1 = y1 + ey * s1;
    // recessed plate-glass storefront + mullions + bulkhead + fascia
    quad([[sx0, sy0, 0.55], [sx1, sy1, 0.55], [sx1, sy1, 2.6], [sx0, sy0, 2.6]],
         night ? '#4a3a20' : '#2e3a44');
    for(let k = 0; k <= 3; k++){
      const u = s0 + (s1 - s0) * k / 3;
      const pb = pr(x1 + ex * u, y1 + ey * u, 0.55),
            pt = pr(x1 + ex * u, y1 + ey * u, 2.6);
      if(!pb || !pt) continue;
      ctx.strokeStyle = '#1c242c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pb[0], pb[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
    }
    quad([[sx0, sy0, 0], [sx1, sy1, 0], [sx1, sy1, 0.55], [sx0, sy0, 0.55]],
         shade(wallBase, lit * 0.55));
    quad([[sx0, sy0, 2.6], [sx1, sy1, 2.6], [sx1, sy1, 3.4], [sx0, sy0, 3.4]],
         shade(TRIM, 0.9));
    // striped awning: sloped band from wall (z 3.9) to lip (+n*1.0, z 3.05)
    const awn = rampOf(['#c9483c', '#3a7a5a', '#3a5a8a', '#c98a2e'][Math.floor(phash(i, 3, 1340) * 4)]);
    const nStripe = det >= 1 ? Math.max(3, Math.floor((s1 - s0) * L / 1.1)) : 1;
    for(let k = 0; k < nStripe; k++){
      const u0 = s0 - 0.04 + (s1 - s0 + 0.08) * k / nStripe;
      const u1 = s0 - 0.04 + (s1 - s0 + 0.08) * (k + 1) / nStripe;
      quad([[x1 + ex * u0, y1 + ey * u0, 3.9], [x1 + ex * u1, y1 + ey * u1, 3.9],
            [x1 + ex * u1 + nx, y1 + ey * u1 + ny, 3.05],
            [x1 + ex * u0 + nx, y1 + ey * u0 + ny, 3.05]],
           awn[k % 2 ? 4 : 3]);
    }
    if(b.name){
      const mp = pr(x1 + ex * 0.5, y1 + ey * 0.5, 3.0);
      if(mp){
        ctx.font = `bold ${Math.max(8, 0.55 * F / mp[2])}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8f4e8';
        ctx.fillText(b.name.slice(0, 20), mp[0], mp[1]);
      }
    }
  } else if(L > 5){
    // residential ground floor: stoop + arched door (+ garage on marina rows)
    if(style === 2){
      const gx = x1 + ex * 0.3, gy = y1 + ey * 0.3;
      quad([[gx - ux * 1.4, gy - uy * 1.4, 0.05], [gx + ux * 1.4, gy + uy * 1.4, 0.05],
            [gx + ux * 1.4, gy + uy * 1.4, 2.3], [gx - ux * 1.4, gy - uy * 1.4, 2.3]],
           shade('#9a9088', lit));
      for(let s = 0; s < 4; s++){
        const z = 0.5 + s * 0.55;
        const lA = pr(gx - ux * 1.4, gy - uy * 1.4, z),
              lB = pr(gx + ux * 1.4, gy + uy * 1.4, z);
        if(!lA || !lB) continue;
        ctx.strokeStyle = 'rgba(30,26,22,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(lA[0], lA[1]); ctx.lineTo(lB[0], lB[1]); ctx.stroke();
      }
    }
    const dx = x1 + ex * doorT, dy = y1 + ey * doorT;
    // stoop steps projecting onto the pavement
    quad([[dx - ux * 1.1, dy - uy * 1.1, 0.03], [dx + ux * 1.1, dy + uy * 1.1, 0.03],
          [dx + ux * 1.1 + nx * 1.2, dy + uy * 1.1 + ny * 1.2, 0.03],
          [dx - ux * 1.1 + nx * 1.2, dy - uy * 1.1 + ny * 1.2, 0.03]],
         shade('#8a8478', lit));
    quad([[dx - ux * 0.9, dy - uy * 0.9, 0.05], [dx + ux * 0.9, dy + uy * 0.9, 0.05],
          [dx + ux * 0.9 + nx * 0.7, dy + uy * 0.9 + ny * 0.7, 0.35],
          [dx - ux * 0.9 + nx * 0.7, dy - uy * 0.9 + ny * 0.7, 0.35]],
         shade('#a39c8e', lit));
    // arched door + pediment
    const db = pr(dx + nx * 0.15, dy + ny * 0.15, 0.35),
          dt = pr(dx + nx * 0.15, dy + ny * 0.15, 2.5);
    if(db && dt){
      const dw = 0.55 * F / db[2], dh = db[1] - dt[1];
      if(dw > 2){
        ctx.fillStyle = TRIM;
        ctx.beginPath();
        ctx.moveTo(db[0] - dw - 1, db[1]); ctx.lineTo(db[0] - dw - 1, dt[1] + dw);
        ctx.arc(db[0], dt[1] + dw, dw + 1, Math.PI, 0, true);
        ctx.lineTo(db[0] + dw + 1, db[1]); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a3a28';
        ctx.beginPath();
        ctx.moveTo(db[0] - dw, db[1]); ctx.lineTo(db[0] - dw, dt[1] + dw);
        ctx.arc(db[0], dt[1] + dw, dw, Math.PI, 0, true);
        ctx.lineTo(db[0] + dw, db[1]); ctx.closePath(); ctx.fill();
        const pm = pr(dx, dy, 2.9);
        if(pm){
          ctx.fillStyle = shade(TRIM, 0.95);
          ctx.beginPath();
          ctx.moveTo(dt[0] - dw - 2, dt[1]); ctx.lineTo(dt[0] + dw + 2, dt[1]);
          ctx.lineTo(pm[0], pm[1]); ctx.closePath(); ctx.fill();
        }
      }
    }
  }

  // v5: climbing ivy on some residential walls — leaf blobs winding up
  if(det === 2 && !isShop && phash(i, ei, 1705) < 0.32){
    const u0 = 0.12 + phash(i, ei, 1706) * 0.6;
    const climb = hm * (0.3 + phash(i, ei, 1707) * 0.45);
    const nV = Math.max(6, Math.round(climb * 2.4));
    for(let k = 0; k < nV; k++){
      const z = (k / nV) * climb;
      const u = u0 + Math.sin(k * 1.9) * 0.02 + (z / hm) * 0.06;
      const p = pr(x1 + ex * u, y1 + ey * u, z);
      if(!p) continue;
      const rr = Math.max(1.2, 0.3 * F / p[2] * (1 - z / climb * 0.4));
      ctx.fillStyle = night ? '#1c2a16' : (k % 3 ? '#3e7a34' : '#2e5a24');
      ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, Math.PI * 2); ctx.fill();
      if(!night && k % 4 === 0){
        ctx.fillStyle = '#5a9a48';
        ctx.fillRect(p[0] - rr * 0.4, p[1] - rr * 0.6, 1.5, 1.5);
      }
    }
  }

  // v9: distance haze toward the horizon color, driven by live humidity
  const hz = sfHazeA(fwd);
  if(hz > 0.02){
    ctx.globalAlpha = hz; ctx.fillStyle = `rgb(${SF_WX.hazeRGB})`;
    ctx.beginPath();
    ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
    ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p1[0], p1[1]);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/* ---------------- street-level "Truman camera" ---------------- */
function sfRenderStreet(cw, ch){
  sfPerfBegin();
  sfWxTick();
  const v = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
  if(v && v.inBuilding && !SF_CAM.director){ sfRenderInterior(cw, ch, v); return; }
  const cm = SF_M.cell_m;

  // v2 camera input: Q/E yaw fallback, director WASD/arrows + R/F/PgUp/PgDn
  if(typeof keysDown !== 'undefined'){
    if(keysDown['KeyQ']) SF_CAM.yaw += 0.03;
    if(keysDown['KeyE']) SF_CAM.yaw -= 0.03;
    if(SF_CAM.director){
      const spd = 0.4 + SF_CAM.h * 0.18;
      const c = Math.cos(SF_CAM.yaw), s = Math.sin(SF_CAM.yaw);
      let mx = 0, my = 0;
      if(keysDown['KeyW'] || keysDown['ArrowUp']){ mx += c; my += s; }
      if(keysDown['KeyS'] || keysDown['ArrowDown']){ mx -= c; my -= s; }
      if(keysDown['KeyA'] || keysDown['ArrowLeft']){ mx += s; my -= c; }
      if(keysDown['KeyD'] || keysDown['ArrowRight']){ mx -= s; my += c; }
      const L = Math.hypot(mx, my);
      if(L > 0){
        SF_CAM.x += mx / L * spd; SF_CAM.y += my / L * spd;
        SF_CAM.x = clamp(SF_CAM.x, 0, SF_M.gw * cm);
        SF_CAM.y = clamp(SF_CAM.y, 0, SF_M.gh * cm);
      }
      if(keysDown['KeyR'] || keysDown['PageUp']) SF_CAM.h = clamp(SF_CAM.h + 0.35, 0.5, 30);
      if(keysDown['KeyF'] || keysDown['PageDown']) SF_CAM.h = clamp(SF_CAM.h - 0.35, 0.5, 30);
    } else if(inspectedPawnIdx !== SF_CAM._lastPawn){
      // v9: pawn switched — glide to the new subject instead of cutting
      SF_CAM.yaw = sfCamYawOf(v); SF_CAM._lastPawn = inspectedPawnIdx;
    }
  }
  // v9: O-orbit — the lens circles the subject on its own
  if(SF_CAM.orbit && !SF_CAM.director) SF_CAM.yaw += SF_WX.dt * 0.26;

  // v9: velocity lead — the lens frames where the subject is GOING,
  // not where they stand. Pawn velocity is estimated from position delta.
  const px = v ? v.x / SF_PXM : 600, py = v ? v.y / SF_PXM : 400;
  const dtC = Math.max(0.008, Math.min(0.2, SF_WX.dt || 0.016));
  if(SF_CAM._pvx == null){ SF_CAM._pvx = px; SF_CAM._pvy = py; SF_CAM._leadX = 0; SF_CAM._leadY = 0; }
  let lvx = (px - SF_CAM._pvx) / dtC, lvy = (py - SF_CAM._pvy) / dtC;
  const vl = Math.hypot(lvx, lvy);
  if(vl > 9){ lvx = lvx / vl * 9; lvy = lvy / vl * 9; }
  if(!v || !v.moving){ lvx = 0; lvy = 0; }
  SF_CAM._pvx = px; SF_CAM._pvy = py;
  const kLead = Math.min(1, dtC * 3);
  SF_CAM._leadX += (lvx * 0.45 - SF_CAM._leadX) * kLead;
  SF_CAM._leadY += (lvy * 0.45 - SF_CAM._leadY) * kLead;

  // v8: third-person follow rig — the camera rides SF_CAM.back meters
  // BEHIND the subject instead of sitting inside their head, and the lens
  // auto-pitches to keep the pawn framed on the lower third line.
  // v9: all of it is now the TARGET for a spring-damped rig.
  const TDX = Math.cos(SF_CAM.yaw), TDY = Math.sin(SF_CAM.yaw);
  let tX, tY, tPitch = SF_CAM.pitch;
  if(SF_CAM.director){
    tX = SF_CAM.x; tY = SF_CAM.y;
  } else {
    tX = px + SF_CAM._leadX - TDX * SF_CAM.back;
    tY = py + SF_CAM._leadY - TDY * SF_CAM.back;
    tPitch = SF_CAM.pitch - Math.atan2(Math.max(0, SF_CAM.h - 1.05), Math.max(2, SF_CAM.back)) * 0.85;
  }
  if(SF_CAM._snap || SF_CAM._sx == null){
    SF_CAM._sx = tX; SF_CAM._sy = tY; SF_CAM._syaw = SF_CAM.yaw;
    SF_CAM._spitch = tPitch; SF_CAM._sh = SF_CAM.h; SF_CAM._snap = false;
  }
  const kRig = 1 - Math.exp(-dtC * 6.5);
  SF_CAM._sx += (tX - SF_CAM._sx) * kRig;
  SF_CAM._sy += (tY - SF_CAM._sy) * kRig;
  SF_CAM._syaw = sfAngLerp(SF_CAM._syaw, SF_CAM.yaw, kRig);
  SF_CAM._spitch += (tPitch - SF_CAM._spitch) * kRig;
  SF_CAM._sh += (SF_CAM.h - SF_CAM._sh) * kRig;
  // v9: handheld breath — a whisper of operator movement while flying
  // the director rig (invisible in stills, alive in motion)
  let useYaw = SF_CAM._syaw, usePitch = SF_CAM._spitch;
  if(SF_CAM.director){
    useYaw += Math.sin(SF_WX.t * 0.6) * 0.004 + Math.sin(SF_WX.t * 1.7) * 0.0015;
    usePitch += Math.sin(SF_WX.t * 0.83 + 1.2) * 0.003;
  }
  const DX = Math.cos(useYaw), DY = Math.sin(useYaw);
  const camX = SF_CAM._sx, camY = SF_CAM._sy, camH = SF_CAM._sh;
  const F = Math.max(400, ch * 1.1) * SF_CAM.fov;
  const horizon = ch * 0.42 + Math.tan(usePitch) * F;
  const pr = (x, y, z) => {
    const dx = x - camX, dy = y - camY;
    const fwd = dx * DX + dy * DY;
    const side = dx * DY - dy * DX;
    if(fwd < 0.5) return null;
    return [cw / 2 + side * F / fwd, horizon + (camH - z) * F / fwd, fwd];
  };

  // v10: temporal frame cache — skip the entire painter's pass when the
  // smoothed rig, pawn positions and weather buckets match the last frame
  const stillKey = sfStillKey(cw, ch, 'street',
    [Math.round(camX * 50), Math.round(camY * 50), Math.round(useYaw * 500),
     Math.round(usePitch * 500), Math.round(camH * 50), Math.round(F),
     SF_CAM.director ? 1 : 0]);
  if(sfStillHit(stillKey)){ sfPerfHud(cw, ch); return; }

  // sky + light by tod/weather
  const night = isNight();
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  if(night){ sky.addColorStop(0, '#101626'); sky.addColorStop(1, '#2a3350'); }
  else if(W.rain > 0.2){ sky.addColorStop(0, '#6a7688'); sky.addColorStop(1, '#a8b2bc'); }
  else { sky.addColorStop(0, '#5b8fc9'); sky.addColorStop(1, '#cfe3f2'); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, cw, horizon);
  const cover = sfCloudCover();
  // v9: aerial perspective strength for this frame — the marine layer's
  // moisture scatters light, so distant blocks melt toward the horizon
  // color. Driven by the same humidity/cloud physics as Karl himself.
  const fogAFrame = night ? 0.3 : clamp(0.16 + (W.hum - 0.55) * 1.7 + W.rain * 0.5, 0.1, 0.9);
  SF_WX.hazeK = clamp((night ? 0.10 : 0.15) + fogAFrame * 0.55 + cover * 0.15, 0.1, 0.8);
  SF_WX.hazeRGB = night ? '52,62,92' : '188,212,230';
  if(!night){
    // v6: sun disc at the real tod azimuth, halo + glare
    const az = Math.PI * (W.tod - 6) / 12;
    const sunFwd = Math.cos(az) * DX + Math.sin(az) * DY;
    const sunSide = Math.cos(az) * DY - Math.sin(az) * DX;
    if(sunFwd > 0.15 && W.rain < 0.4){
      const sx2 = cw / 2 + (sunSide / Math.max(0.4, sunFwd)) * F * 0.9;
      const sy2 = horizon - F * 0.33;
      if(sx2 > -200 && sx2 < cw + 200){
        const sg = ctx.createRadialGradient(sx2, sy2, 2, sx2, sy2, F * 0.55);
        sg.addColorStop(0, 'rgba(255,252,232,0.85)');
        sg.addColorStop(0.07, 'rgba(255,246,200,0.5)');
        sg.addColorStop(1, 'rgba(255,246,200,0)');
        ctx.fillStyle = sg; ctx.fillRect(0, 0, cw, horizon + 40);
      }
    }
    // v6: the SAME cloud field, projected at 130m altitude — parallax sky
    const cs2 = sfClouds(), nC = Math.ceil(cs2.length * (0.25 + 0.75 * cover));
    for(let i = 0; i < nC; i++){
      const c = cs2[i];
      const [cx2, cy2] = sfCloudPos(c);
      const p = pr(cx2, cy2, SF_CLOUD_ALT);
      if(!p || p[2] > 750) continue;
      const sc2 = F / p[2], rw = c.r * sc2;
      if(rw < 5 || rw > cw * 1.5) continue;
      const a = clamp(0.9 - p[2] / 900, 0.12, 0.85) * (0.45 + 0.55 * cover);
      const rh = rw * 0.34;
      ctx.fillStyle = `rgba(146,156,178,${a * 0.85})`;
      ctx.beginPath();
      ctx.ellipse(p[0], p[1] + rh * 0.3, rw, rh * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(252,252,250,${a})`;
      for(const [ox, oy, ss] of [[-0.45, 0.05, 0.6], [0, -0.18, 0.95],
                                 [0.48, 0.02, 0.65], [0.12, -0.3, 0.55]]){
        ctx.beginPath();
        ctx.ellipse(p[0] + ox * rw, p[1] + oy * rh, rw * ss, rh * ss, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // v7: high cirrus — wind-sheared ice streaks on clear days
    if(cover < 0.55 && W.rain < 0.15){
      ctx.lineCap = 'round';
      for(let k = 0; k < 7; k++){
        const cy = horizon * (0.08 + k * 0.115);
        const off = (SF_WX.t * W.windSpd * 9 + phash(k, 31, 1730) * cw) % (cw + 600) - 300;
        ctx.strokeStyle = `rgba(255,255,255,${0.13 + phash(k, 32, 1731) * 0.14})`;
        ctx.lineWidth = 2 + phash(k, 33, 1732) * 3;
        ctx.beginPath();
        ctx.moveTo(off - cw * 0.38, cy + 18);
        ctx.quadraticCurveTo(off, cy - 14, off + cw * 0.38, cy + 8);
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
    // v7: crepuscular sun shafts — translucent light wedges fanning down
    // from the sun disc whenever it hangs in front of the camera
    if(sunFwd > 0.15 && W.rain < 0.4 && cover < 0.8){
      const sx3 = cw / 2 + (sunSide / Math.max(0.4, sunFwd)) * F * 0.9;
      const sy3 = horizon - F * 0.33;
      const shaftA = 0.055 * (1 - cover * 0.55);
      ctx.save();
      ctx.translate(sx3, sy3);
      ctx.fillStyle = `rgba(255,246,214,${shaftA})`;
      for(let k = 0; k < 5; k++){
        const ang = 0.5 + k * 0.27 + Math.sin(SF_WX.t * 0.2 + k) * 0.02;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, F * 1.1, ang, ang + 0.09);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // v7: stratus deck — when the marine layer wins, the whole sky greys out
    if(cover > 0.55){
      const oa = (cover - 0.55) * 1.5;
      const og = ctx.createLinearGradient(0, 0, 0, horizon);
      og.addColorStop(0, `rgba(96,104,120,${oa})`);
      og.addColorStop(1, `rgba(150,158,172,${oa * 0.5})`);
      ctx.fillStyle = og; ctx.fillRect(0, 0, cw, horizon);
    }
    // v6: marine layer — Karl the Fog shouldering over the horizon,
    // growing with humidity; the Mission's signature wall of gray.
    const fogA = clamp(0.16 + (W.hum - 0.55) * 1.7 + W.rain * 0.5, 0.1, 0.9);
    const fh = horizon * (0.08 + fogA * 0.45);
    const fg = ctx.createLinearGradient(0, horizon - fh, 0, horizon + 40);
    fg.addColorStop(0, 'rgba(214,224,232,0)');
    fg.addColorStop(0.72, `rgba(216,226,233,${fogA})`);
    fg.addColorStop(1, `rgba(206,216,226,${fogA * 0.75})`);
    ctx.fillStyle = fg; ctx.fillRect(0, horizon - fh, cw, fh + 40);
    // v7: rainbow — a faint arc at the anti-solar point while a shower clears
    if(SF_WX.wet > 0.12 && W.rain < 0.3 && cover < 0.8 && sunFwd < -0.1){
      const aSide = -sunSide;
      const bx2 = cw / 2 + (aSide / Math.max(0.4, -sunFwd)) * F * 0.6;
      const R = F * 0.62, band = R * 0.055;
      const rbA = clamp(0.1 + SF_WX.wet * 0.2 - cover * 0.1, 0, 0.28);
      if(rbA > 0.03){
        const hues = ['255,60,60', '255,160,40', '255,230,60',
                      '80,200,90', '70,140,255', '150,90,230'];
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, cw, horizon + 60); ctx.clip();
        for(let k = 0; k < hues.length; k++){
          ctx.strokeStyle = `rgba(${hues[k]},${rbA})`;
          ctx.lineWidth = band;
          ctx.beginPath();
          ctx.arc(bx2, horizon + R * 0.22, R - k * band, Math.PI, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    // v7: lightning bolt — jagged strike from deck to ground while flashing
    if(SF_WX.flash > 0.45){
      const seedT = Math.floor(SF_WX.t * 4);
      const bx = cw * (0.2 + phash(seedT, 41, 1740) * 0.6);
      ctx.strokeStyle = `rgba(240,246,255,${SF_WX.flash})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(bx, 0);
      let yy = 0, xx = bx;
      while(yy < horizon * 0.9){
        yy += horizon * 0.11 + phash(yy | 0, 42, 1741) * 14;
        xx += (phash(yy | 0, 43, 1742) - 0.5) * 46;
        ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
  } else {
    // v6 night: faint moon glow + starfield when the sky is clear
    if(cover < 0.55){
      ctx.fillStyle = 'rgba(240,244,255,0.8)';
      for(let k = 0; k < 40; k++){
        const sx2 = phash(k, 1, 1605) * cw, sy2 = phash(k, 2, 1606) * horizon * 0.85;
        ctx.fillRect(sx2, sy2, 1.4, 1.4);
      }
      const mg = ctx.createRadialGradient(cw * 0.3, horizon * 0.2, 4,
                                          cw * 0.3, horizon * 0.2, cw * 0.2);
      mg.addColorStop(0, 'rgba(230,236,250,0.35)');
      mg.addColorStop(1, 'rgba(230,236,250,0)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, cw, horizon);
    }
  }
  ctx.fillStyle = night ? '#2e2a28' : '#7d8a70';
  ctx.fillRect(0, horizon, cw, ch - horizon);

  // ground tiles far -> near
  const COLS = { 10: '#50555e', 11: '#bdb7ac', 12: '#7a7268', 13: '#6cae52',
                 14: '#bdb7ac', 15: '#d0b78e', 16: '#8a8f98', 0: '#a8977a' };
  const cells = [];
  // v10: walk only the rows/columns the view cone can reach. Per-row
  // nonzero spans plus an analytic clamp of the forward range replace a
  // 771x813 blind scan (~627k iterations) with the visible wedge —
  // identical cell set, identical draw order.
  const rows = sfRowBounds();
  for(let gy = 0; gy < SF_M.gh; gy++){
    const rb = rows[gy];
    if(!rb) continue;
    const wym = gy * cm, ddy = wym - camY;
    // forward range of this row's occupied span: fwd is linear in x
    const fa = cm * DX, fb = ddy * DY - camX * DX;   // fwd = fa*gx + fb
    const f0 = fa * rb[0] + fb, f1 = fa * rb[1] + fb;
    if(Math.max(f0, f1) < 0.5 || Math.min(f0, f1) > 240) continue;
    let lo = rb[0], hi = rb[1];
    if(Math.abs(fa) > 1e-9){
      const uA = (0.5 - fb) / fa, uB = (240 - fb) / fa;
      lo = Math.max(lo, Math.ceil(Math.min(uA, uB) - 1e-6));
      hi = Math.min(hi, Math.floor(Math.max(uA, uB) + 1e-6));
      if(lo > hi) continue;
    }
    // lateral cone: |side| < fwd*1.3 + 30 is linear too — solve for gx.
    // side = sa*gx + sb; the two half-planes are side <= C and -side <= C
    // with C = 1.3*fwd + 30, i.e. (sa ∓ 1.3*fa)*gx <= 1.3*fb + 30 ∓ sb.
    const sa = cm * DY, sb = -ddy * DX - camX * DY;
    for(const [ka, kb] of [[sa - 1.3 * fa, 1.3 * fb + 30 - sb],
                           [-sa - 1.3 * fa, 1.3 * fb + 30 + sb]]){
      if(Math.abs(ka) < 1e-9){ if(kb < 0){ lo = hi + 1; break; } continue; }
      const xb = kb / ka;
      if(ka > 0) hi = Math.min(hi, Math.floor(xb + 1e-6));
      else lo = Math.max(lo, Math.ceil(xb - 1e-6));
    }
    if(lo > hi) continue;
    for(let gx = lo; gx <= hi; gx++){
      const t = SF_GRID[gy * SF_M.gw + gx];
      if(!t) continue;
      const wxm = gx * cm;
      const ddx = wxm - camX;
      const fwd = ddx * DX + ddy * DY;
      if(fwd < 0.5 || fwd > 240) continue;
      if(Math.abs(ddx * DY - ddy * DX) > fwd * 1.3 + 30) continue;
      cells.push([wxm, wym, fwd, t]);
    }
  }
  cells.sort((a, b) => b[2] - a[2]);
  /* v11: batched ground fills. The old pass issued up to 4 beginPath/fill
     pairs per cell (base + haze + cloud shadow + wet film) — thousands of
     canvas state changes per frame. Ground quads tile the plane without
     overlapping, so they are bucketed by fill style into flat coordinate
     arrays and flushed as paths of ~48 quads each (measured sweet spot:
     big enough to amortize fill dispatch, small enough for fast
     rasterization). Overlay alphas are quantized to 1/24 — an invisible
     step — so they share buckets. Sparse extras (zebra hints, puddle
     glints) keep their own shapes in a post list. */
  const fills = new Map();   // style -> [x1,y1,x2,y2,x3,y3,x4,y4, ...]
  const post = [];           // [0 zebra|1 puddle, p1,p2,p3,p4, wv?]
  const shBlobs = night ? null : sfShadowBlobs();
  const qEmit = (style, p1, p2, p3, p4) => {
    let a = fills.get(style);
    if(!a){ a = []; fills.set(style, a); }
    a.push(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]);
  };
  for(const [wxm, wym, cfwd, t] of cells){
    const c = cm;
    const p1 = pr(wxm, wym, 0), p2 = pr(wxm + c, wym, 0),
          p3 = pr(wxm + c, wym + c, 0), p4 = pr(wxm, wym + c, 0);
    if(!p1 || !p2 || !p3 || !p4) continue;
    qEmit(COLS[t] || '#a8977a', p1, p2, p3, p4);
    // v9: aerial perspective — far pavement dissolves into the marine layer
    const cHz = sfHazeA(cfwd);
    if(cHz > 0.02){
      const qb = Math.round(cHz * 24);
      if(qb > 0) qEmit(`rgba(${SF_WX.hazeRGB},${qb / 24})`, p1, p2, p3, p4);
    }
    // v6: cloud shadow sliding over the pavement (v11: blobs hoisted)
    let csh = 0;
    if(shBlobs){
      const mx2 = wxm + cm / 2, my2 = wym + cm / 2;
      for(const sc of shBlobs){
        const dx2 = mx2 - sc[0], dy2 = my2 - sc[1];
        const d2 = dx2 * dx2 + dy2 * dy2;
        if(d2 < sc[2] * 4) csh += sc[3] * Math.exp(-d2 / sc[2]);
      }
      csh = Math.min(1, csh * (0.4 + 0.6 * cover));
    }
    if(csh > 0.04){
      const qa = Math.round(csh * 0.34 * 24);
      if(qa > 0) qEmit(`rgba(28,36,60,${qa / 24})`, p1, p2, p3, p4);
    }
    // v7: wetness memory — hardscape darkens, puddles mirror the sky
    if(SF_WX.wet > 0.05 && (t === 10 || t === 11 || t === 14 || t === 16)){
      const wv = SF_WX.wet;
      qEmit(`rgba(26,34,52,${wv * 0.2})`, p1, p2, p3, p4);
      if(wv > 0.3 && hash2(wxm | 0, wym | 0, SEED + 1820) < wv * 0.45)
        post.push([1, p1, p2, p3, p4, wv]);
    }
    if(t === 16) post.push([0, p1, p2, p3, p4]); // zebra hint in perspective
  }
  const QUAD_BATCH = 48 * 8;   // coords per fill() — ~48 quads per path
  for(const [style, a] of fills){
    ctx.fillStyle = style;
    for(let base = 0; base < a.length; base += QUAD_BATCH){
      const end = Math.min(base + QUAD_BATCH, a.length);
      ctx.beginPath();
      for(let i = base; i < end; i += 8){
        ctx.moveTo(a[i], a[i + 1]); ctx.lineTo(a[i + 2], a[i + 3]);
        ctx.lineTo(a[i + 4], a[i + 5]); ctx.lineTo(a[i + 6], a[i + 7]);
        ctx.closePath();
      }
      ctx.fill();
    }
  }
  for(const q of post){
    const p1 = q[1], p2 = q[2], p3 = q[3], p4 = q[4];
    if(q[0] === 0){
      ctx.fillStyle = 'rgba(232,230,223,0.55)';
      ctx.beginPath();
      ctx.moveTo((p1[0] + p2[0]) / 2, p1[1]); ctx.lineTo((p3[0] + p4[0]) / 2, p3[1]);
      ctx.lineTo(p4[0], p4[1]); ctx.lineTo(p1[0], p1[1]); ctx.fill();
    } else {
      const wv = q[5];
      const cxp = (p1[0] + p2[0] + p3[0] + p4[0]) / 4,
            cyp = (p1[1] + p2[1] + p3[1] + p4[1]) / 4;
      const prw = Math.max(2, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 0.28);
      ctx.fillStyle = `rgba(172,202,232,${wv * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(cxp, cyp, prw * 1.5, prw * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(230,240,252,${wv * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(cxp - prw * 0.3, cyp - prw * 0.1, prw * 0.6, prw * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  SF_PERF.info = cells.length + 'cl/' + fills.size + 'fl';

  // drawables: buildings, props, pawns — far -> near
  const ds = [];
  for(const b of SF_BLD){
    const bxm = b.x / SF_PXM, bym = b.y / SF_PXM;
    const ddx = bxm - camX, ddy = bym - camY;
    const fwd = ddx * DX + ddy * DY, side = Math.abs(ddx * DY - ddy * DX);
    if(fwd > 0.3 && fwd < 260 && side < fwd * 1.6 + 60) ds.push({ k: 'b', fwd, b });
  }
  // v11: props via the chunk index — walk only the chunks under the view
  // cone's bounding box (reach 120m, lateral 1.4*fwd+20, plus a cell of
  // sub-cell jitter) instead of every prop on the map. Same cone test,
  // same emitted set.
  {
    const reach = 120, lat = reach * 1.4 + 20 + cm;
    const fxm = camX + DX * reach, fym = camY + DY * reach;
    const xA = Math.min(camX, fxm) - lat, xB = Math.max(camX, fxm) + lat;
    const yA = Math.min(camY, fym) - lat, yB = Math.max(camY, fym) + lat;
    const cmCh = CHN * cm;
    for(let cy = Math.floor(yA / cmCh); cy <= Math.floor(yB / cmCh); cy++){
      for(let cx = Math.floor(xA / cmCh); cx <= Math.floor(xB / cmCh); cx++){
        const lst = SF_PROP_DRAW.get(cx + ',' + cy);
        if(!lst) continue;
        for(const o of lst){
          const ox = o.x / SF_PXM, oy = o.y / SF_PXM;
          const ddx = ox - camX, ddy = oy - camY;
          const fwd = ddx * DX + ddy * DY, side = Math.abs(ddx * DY - ddy * DX);
          if(fwd > 0.5 && fwd < 120 && side < fwd * 1.4 + 20) ds.push({ k: 'p', fwd, o });
        }
      }
    }
  }
  for(const pv of VILLAGERS){
    if(pv.inBuilding) continue;
    const vx = pv.x / SF_PXM, vy = pv.y / SF_PXM;
    const ddx = vx - camX, ddy = vy - camY;
    const fwd = ddx * DX + ddy * DY, side = Math.abs(ddx * DY - ddy * DX);
    if(fwd > 0.3 && fwd < 160 && side < fwd * 1.5 + 20) ds.push({ k: 'v', fwd, pv });
  }
  ds.sort((a, b) => b.fwd - a.fwd);

  for(const d of ds){
    if(d.k === 'b'){
      const b = d.b;
      const hm = b.hPx / 4.2; // meters
      // v10: meter-space polygon + signed area are static — compute once
      if(!b._pm){
        const P2 = b.px.map(q => [q[0] / SF_PXM, q[1] / SF_PXM]);
        let ar = 0;
        for(let e = 0; e < P2.length; e++){
          const [x1, y1] = P2[e], [x2, y2] = P2[(e + 1) % P2.length];
          ar += (x2 - x1) * (y2 + y1);
        }
        b._pm = P2; b._ccw = ar > 0; b._area = Math.abs(ar);
      }
      const P = b._pm, ccw = b._ccw, area = b._ccw ? b._area : -b._area;
      const n = P.length;
      for(let e = 0; e < n; e++){
        const [x1, y1] = P[e], [x2, y2] = P[(e + 1) % n];
        const ex = x2 - x1, ey = y2 - y1, L = Math.hypot(ex, ey) || 1;
        let nx = ey / L, ny = -ex / L;
        if(ccw){ nx = -nx; ny = -ny; }
        const facingCam = (nx * -DX + ny * -DY) > 0.05; // wall faces camera
        if(!facingCam) continue;
        sfStreetWall(b, e, x1, y1, x2, y2, ex, ey, L, nx, ny, hm, pr, F, night, d.fwd);
      }
      // v12: roofscape — same deterministic typology as the baked sprite
      // (flat | gable | mansard | hip), so the silhouette you see from the
      // street is the one you saw from above.
      const isShopR = !!b.name || phash(b.i, 5, 1303) < 0.12;
      const rk = sfRoofKind(b, isShopR, b._area * SF_PXM * SF_PXM);
      const RFm = sfRoofFrame(P);
      const riseM = rk === 'mansard'
        ? Math.min(2.6, Math.max(1.2, RFm.wMax * 0.4))
        : Math.min(3.4, Math.max(1.6, RFm.wMax * 0.52));
      const liftM = (x, y) => sfRoofLift(RFm, rk === 'hip' ? 'hip' : 'gable', x, y);
      const PColR = rampOf(SF_PITCH_COLS[Math.floor(phash(b.i, 23, 1391) * SF_PITCH_COLS.length)]);
      const shingR = rk === 'mansard' ? MAT.slate : PColR;
      const fillProj = (pts, fill) => { // pts: [x,y,z] meters; null-safe
        let started = false;
        ctx.beginPath();
        for(const [qx, qy, qz] of pts){
          const p = pr(qx, qy, qz);
          if(!p) return;
          started ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
          started = true;
        }
        ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
      };
      const edgeLitM = (a, bq) => { // outward normal of edge a->b (meter space)
        let ex2 = bq[0] - a[0], ey2 = bq[1] - a[1];
        const L2 = Math.hypot(ex2, ey2) || 1;
        let nx2 = ey2 / L2, ny2 = -ex2 / L2;
        if(b._ccw){ nx2 = -nx2; ny2 = -ny2; }
        return sfRoofFaceLit(nx2, ny2);
      };
      // roof cap: per-building tar color + subtle sun shading + parapet lip
      const ROOF = rampOf(SF_ROOF_COLS[Math.floor(phash(b.i, 11, 1302) * SF_ROOF_COLS.length)]);
      const rpts = [];
      for(const [x, y] of P){
        const p = pr(x, y, hm);
        if(p) rpts.push(p);
      }
      if(rk !== 'flat' && RFm.wMax >= 1){
        // ---- pitched roofscape: gable / mansard / hip over the parapet ----
        const wetG = SF_WX.wet > 0.45;
        const dimR = night ? 0.3 : 1;
        const colAt = (lit) => night
          ? (lit ? '#3a3430' : '#241f1c')
          : shade(lit ? shingR[4] : shingR[1], wetG ? 0.78 : 1);
        // gable rake walls / frieze under lifted edges (hip eaves stay flat)
        if(rk === 'gable'){
          for(let e2 = 0; e2 < n; e2++){
            const a = P[e2], bq = P[(e2 + 1) % n];
            const la = liftM(a[0], a[1]) * riseM, lb = liftM(bq[0], bq[1]) * riseM;
            if(la < 0.1 && lb < 0.1) continue;
            fillProj([[a[0], a[1], hm], [bq[0], bq[1], hm],
                      [bq[0], bq[1], hm + lb], [a[0], a[1], hm + la]],
                     shade('#8a8478', dimR * (edgeLitM(a, bq) ? 1.0 : 0.72)));
          }
        }
        if(rk === 'gable'){
          for(const keepPos of [false, true]){
            const half = sfClipHalf(P, RFm, keepPos);
            if(half.length < 3) continue;
            const lit = !keepPos; // w<0 side faces up/left = sunward
            fillProj(half.map(p => [p[0], p[1], hm + liftM(p[0], p[1]) * riseM]),
                     colAt(lit));
          }
          // ridge cap
          let rA = 1e9, rB = -1e9;
          for(const keepPos of [false, true]) for(const p of sfClipHalf(P, RFm, keepPos)){
            const w = RFm.alongX ? p[1] - RFm.cy : p[0] - RFm.cx;
            if(Math.abs(w) < 0.1){
              const u = RFm.alongX ? p[0] : p[1];
              if(u < rA) rA = u; if(u > rB) rB = u;
            }
          }
          if(rB > rA){
            const pa2 = RFm.alongX ? pr(rA, RFm.cy, hm + riseM) : pr(RFm.cx, rA, hm + riseM);
            const pb2 = RFm.alongX ? pr(rB, RFm.cy, hm + riseM) : pr(RFm.cx, rB, hm + riseM);
            if(pa2 && pb2){
              ctx.strokeStyle = night ? '#3a3430' : shingR[5];
              ctx.lineWidth = Math.max(1, 0.14 * F / pa2[2]);
              ctx.beginPath(); ctx.moveTo(pa2[0], pa2[1]); ctx.lineTo(pb2[0], pb2[1]); ctx.stroke();
            }
          }
        } else if(rk === 'mansard'){
          const k = 0.36;
          const inset = P.map(p => [RFm.cx + (p[0] - RFm.cx) * (1 - k),
                                    RFm.cy + (p[1] - RFm.cy) * (1 - k)]);
          for(let e2 = 0; e2 < n; e2++){
            const a = P[e2], bq = P[(e2 + 1) % n];
            const ia = inset[e2], ib = inset[(e2 + 1) % n];
            fillProj([[a[0], a[1], hm], [bq[0], bq[1], hm],
                      [ib[0], ib[1], hm + riseM], [ia[0], ia[1], hm + riseM]],
                     colAt(edgeLitM(a, bq)));
          }
          fillProj(inset.map(p => [p[0], p[1], hm + riseM]),
                   night ? '#221f1d' : shade(ROOF[3], wetG ? 0.78 : 1));
        } else { // hip: triangle fan to the ridge point over the centroid
          for(let e2 = 0; e2 < n; e2++){
            const a = P[e2], bq = P[(e2 + 1) % n];
            fillProj([[a[0], a[1], hm], [bq[0], bq[1], hm],
                      [RFm.cx, RFm.cy, hm + riseM]],
                     colAt(edgeLitM(a, bq)));
          }
        }
        // wet sheen + aerial haze over the pitched silhouette
        const rHz = sfHazeA(d.fwd);
        if(rHz > 0.02 && rpts.length > 2){
          ctx.fillStyle = `rgba(${SF_WX.hazeRGB},${rHz})`;
          ctx.beginPath();
          rpts.forEach((p, i2) => i2 ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
          ctx.closePath(); ctx.fill();
        }
      } else if(rpts.length > 2){
        let yMin = Infinity, yMax = -Infinity;
        for(const p of rpts){ yMin = Math.min(yMin, p[1]); yMax = Math.max(yMax, p[1]); }
        const rg = ctx.createLinearGradient(0, yMin, 0, yMax);
        if(night){ rg.addColorStop(0, '#221f1d'); rg.addColorStop(1, '#2e2a27'); }
        else { rg.addColorStop(0, shade(ROOF[4], 1.06)); rg.addColorStop(1, shade(ROOF[2], 0.94)); }
        ctx.fillStyle = rg;
        ctx.beginPath();
        rpts.forEach((p, i2) => i2 ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = night ? '#1a1816' : shade(ROOF[1], 0.85);
        ctx.lineWidth = 1; ctx.stroke();
        // v9: aerial perspective — far roofs sink into the marine layer
        const rHz = sfHazeA(d.fwd);
        if(rHz > 0.02){
          ctx.fillStyle = `rgba(${SF_WX.hazeRGB},${rHz})`;
          ctx.fill();
        }
        // faint tar-paper seams across the roof plane
        if(!night && rpts.length >= 3){
          ctx.save(); ctx.clip();
          ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
          const xMin = Math.min(...rpts.map(p => p[0])),
                xMax = Math.max(...rpts.map(p => p[0]));
          for(let sx = xMin + 14; sx < xMax; sx += 26){
            ctx.beginPath(); ctx.moveTo(sx, yMin); ctx.lineTo(sx, yMax); ctx.stroke();
          }
          ctx.restore();
        }
      }
      // v4: rooftop furniture silhouettes — water tanks, pipes, antennas,
      // dishes rising above the parapet, scattered inside the footprint.
      // v12: pitched roofs get ridge-line chimneys/antennas grounded on the
      // lifted surface instead of flat-roof clutter.
      const roofAreaM = b._area; // P is in meters -> m² (v10: cached)
      const pitched = rk !== 'flat' && RFm.wMax >= 1;
      const nRoof = pitched
        ? Math.min(2, Math.floor(roofAreaM / 90) + 1)
        : Math.min(5, Math.floor(roofAreaM / 55));
      let cxm = 0, cym = 0;
      for(const [x, y] of P){ cxm += x; cym += y; }
      cxm /= P.length; cym /= P.length;
      const axU = RFm.alongX ? [1, 0] : [0, 1];
      for(let k = 0; k < nRoof; k++){
        const e2 = P[Math.floor(phash(b.i, k, 1505) * P.length)];
        const t = 0.25 + phash(k, b.i, 1506) * 0.5;
        let fx = cxm + (e2[0] - cxm) * t, fy = cym + (e2[1] - cym) * t;
        if(pitched && rk !== 'mansard'){
          // hug the ridge line / apex
          const off = (phash(b.i, k, 1510) - 0.5) * 2 * (RFm.alongX ? 1 : 1) * 2.4;
          fx = cxm + axU[0] * off; fy = cym + axU[1] * off;
        }
        const zR = pitched
          ? (rk === 'mansard' ? riseM : liftM(fx, fy) * riseM)
          : 0;
        const kind = pitched
          ? (phash(b.i, k, 1511) < 0.7 ? 5 : 2)
          : Math.floor(phash(b.i, k, 1507) * 5);
        const base = pr(fx, fy, hm + zR);
        if(!base || base[2] > 200) continue;
        const sc = F / base[2];
        ctx.strokeStyle = night ? '#1c1a18' : '#4a4540';
        ctx.fillStyle = night ? '#262220' : '#6a5f52';
        if(kind === 5){ // v12 brick chimney + terracotta pot on the ridge
          const bw2 = Math.max(3, 0.8 * sc), bh2 = Math.max(4, 1.4 * sc);
          ctx.fillStyle = night ? '#241d1a' : '#8a5a48';
          ctx.fillRect(base[0] - bw2 / 2, base[1] - bh2, bw2, bh2);
          ctx.fillStyle = night ? '#2e2622' : '#c89078';
          ctx.fillRect(base[0] - bw2 / 2, base[1] - bh2, bw2, Math.max(1, bh2 * 0.14));
          ctx.fillStyle = night ? '#1c1815' : '#6a4034';
          ctx.fillRect(base[0] - bw2 / 2 - 1, base[1] - bh2 - 2, bw2 + 2, 2.5);
          ctx.beginPath();
          ctx.ellipse(base[0], base[1] - bh2 - 4, Math.max(1.2, bw2 * 0.16), Math.max(1.6, bw2 * 0.22), 0, 0, Math.PI * 2);
          ctx.fill();
        } else if(kind === 0 && roofAreaM > 110){
          // water tank: legs + banded barrel + cone cap
          const lb = pr(fx, fy, hm + zR), lt = pr(fx, fy, hm + zR + 1.4),
                tb = pr(fx, fy, hm + zR + 1.4), tt = pr(fx, fy, hm + zR + 3.4),
                tp = pr(fx, fy, hm + zR + 4.2);
          if(!lb || !lt || !tb || !tt || !tp) continue;
          const rw = Math.max(3, 1.6 * sc);
          ctx.lineWidth = Math.max(1, 0.12 * sc);
          for(const off of [-0.7, 0.7]){
            const pl = pr(fx + off, fy, hm + zR), pt2 = pr(fx + off * 0.6, fy, hm + zR + 1.4);
            if(pl && pt2){ ctx.beginPath(); ctx.moveTo(pl[0], pl[1]); ctx.lineTo(pt2[0], pt2[1]); ctx.stroke(); }
          }
          ctx.fillRect(tb[0] - rw, tt[1], rw * 2, tb[1] - tt[1]);
          ctx.fillStyle = night ? '#1e1c1a' : '#54483c';
          ctx.fillRect(tb[0] - rw, tb[1] - (tb[1] - tt[1]) * 0.45, rw * 2, Math.max(1, (tb[1] - tt[1]) * 0.08));
          ctx.fillStyle = night ? '#262220' : '#7a6a58';
          ctx.beginPath();
          ctx.moveTo(tb[0] - rw, tt[1]); ctx.lineTo(tb[0] + rw, tt[1]);
          ctx.lineTo(tp[0], tp[1]); ctx.closePath(); ctx.fill();
        } else if(kind === 1){ // vent pipe with cap
          const pt2 = pr(fx, fy, hm + zR + 0.9 + phash(k, b.i, 1508));
          if(!pt2) continue;
          ctx.lineWidth = Math.max(1.2, 0.14 * sc);
          ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(pt2[0], pt2[1]); ctx.stroke();
          ctx.fillStyle = night ? '#2a2725' : '#8a8478';
          ctx.beginPath(); ctx.ellipse(pt2[0], pt2[1], Math.max(1.5, 0.25 * sc), Math.max(0.8, 0.1 * sc), 0, 0, Math.PI * 2); ctx.fill();
        } else if(kind === 2){ // antenna mast + crossbars
          const pt2 = pr(fx, fy, hm + zR + 3 + phash(k, b.i, 1509) * 2);
          if(!pt2) continue;
          ctx.lineWidth = Math.max(0.8, 0.06 * sc);
          ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(pt2[0], pt2[1]); ctx.stroke();
          const bw2 = Math.max(2, 0.8 * sc);
          for(const zz of [0.75, 0.9]){
            const py = base[1] + (pt2[1] - base[1]) * zz;
            ctx.beginPath(); ctx.moveTo(pt2[0] - bw2 * (1 - zz * 0.4), py);
            ctx.lineTo(pt2[0] + bw2 * (1 - zz * 0.4), py); ctx.stroke();
          }
        } else if(kind === 3){ // AC box humping the parapet line
          const bw2 = Math.max(3, 1.1 * sc), bh2 = Math.max(2, 0.5 * sc);
          ctx.fillStyle = night ? '#242120' : shade(ROOF[3], 1.15);
          ctx.fillRect(base[0] - bw2 / 2, base[1] - bh2, bw2, bh2);
          ctx.fillStyle = night ? '#1c1a18' : shade(ROOF[1], 0.9);
          ctx.beginPath(); ctx.ellipse(base[0], base[1] - bh2 / 2, bw2 * 0.28, bh2 * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        } else { // satellite dish
          const pt2 = pr(fx, fy, hm + zR + 1.2);
          if(!pt2) continue;
          ctx.lineWidth = Math.max(1, 0.08 * sc);
          ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(pt2[0], pt2[1]); ctx.stroke();
          ctx.fillStyle = night ? '#2e2b29' : '#c8c8c0';
          ctx.beginPath();
          ctx.ellipse(pt2[0], pt2[1], Math.max(2, 0.55 * sc), Math.max(1.2, 0.3 * sc), -0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if(b.name){
        const p = pr(b.x / SF_PXM, b.y / SF_PXM, hm + 1.5);
        if(p){
          ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
          ctx.strokeText(b.name, p[0], p[1]);
          ctx.fillStyle = '#fff'; ctx.fillText(b.name, p[0], p[1]);
        }
      }
    } else if(d.k === 'p'){
      const o = d.o;
      const p = pr(o.x / SF_PXM, o.y / SF_PXM, 0);
      if(!p) continue;
      const sc = F / p[2];
      const V = PA.sfVeg;
      let spr = null, hm = 5, shadowR = 0;
      if(o.kind === 'sfTree'){ spr = V.tree[Math.abs(hash2(o.wx, o.wy, 7) * V.tree.length) | 0]; hm = 4.4; shadowR = 1.6; }
      else if(o.kind === 'sfPalm'){ spr = V.palm[Math.abs(hash2(o.wx, o.wy, 8) * V.palm.length) | 0]; hm = 6.4; shadowR = 1.1; }
      else if(o.kind === 'sfStreetTree'){ spr = V.streetTree[o.v != null ? o.v : 0]; hm = 3.6; shadowR = 1.2; }
      else if(o.kind === 'sfCypress'){ spr = V.cypress[Math.abs(hash2(o.wx, o.wy, 9) * V.cypress.length) | 0]; hm = 6.0; shadowR = 0.9; }
      else if(o.kind === 'sfBench'){ spr = V.bench; hm = 0.9; }
      else if(o.kind === 'sfLamp'){ spr = night ? V.lampOn : V.lampOff; hm = 4.5; }
      else if(o.kind === 'sfShrub'){ spr = V.shrub[Math.abs(hash2(o.wx, o.wy, 10) * V.shrub.length) | 0]; hm = 0.9; shadowR = 0.7; }
      else if(o.kind === 'sfFlowerBed'){ spr = V.flowerbed[Math.abs(hash2(o.wx, o.wy, 11) * V.flowerbed.length) | 0]; hm = 0.5; }
      else if(o.kind === 'sfPlanter'){ spr = V.planter; hm = 0.7; }
      const sprC = spr && (spr.c || spr);
      if(sprC){
        const ph = hm * sc, pw = ph * (sprC.width / sprC.height);
        if(shadowR && !night){
          ctx.fillStyle = 'rgba(15,20,10,0.28)';
          ctx.beginPath();
          ctx.ellipse(p[0] + shadowR * 0.45 * sc, p[1], shadowR * sc,
                      shadowR * 0.3 * sc, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.drawImage(sprC, p[0] - pw / 2, p[1] - ph, pw, ph);
      }
    } else {
      const pv = d.pv;
      const p = pr(pv.x / SF_PXM, pv.y / SF_PXM, 0);
      if(!p) continue;
      const F2 = PA.chars && PA.chars[pv._ci != null ? pv._ci : 0];
      const dir = pv.face === 1 ? 1 : ((pv.face === 2 || pv.face === 3) ? 2 : 0);
      let fr = null;
      if(F2 && F2[dir]) fr = paActFrame(F2, dir, pv, G.frame);
      if(fr){
        const ph = 1.7 * F / p[2], pw = ph * 0.75;
        // ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], pw * 0.4, pw * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(fr, p[0] - pw / 2, p[1] - ph, pw, ph);
        if(p[2] < 40){
          ctx.font = `bold ${Math.max(8, 24 / p[2] * 4)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
          ctx.strokeText(pv.name, p[0], p[1] - ph - 4);
          ctx.fillStyle = '#fff'; ctx.fillText(pv.name, p[0], p[1] - ph - 4);
        }
      }
    }
  }

  // v7: wind-blown leaves fluttering past the camera — lateral drift set
  // by the wind's component across the view axis, bobbing as they fly
  if(W.windSpd > 0.35){
    const lv = sfLeaves();
    const nL = Math.ceil(lv.length * clamp(0.4 + SF_WX.gust * 0.6 + W.storm * 0.5, 0, 1));
    const lat = Math.sin(W.windAng - SF_CAM.yaw) || 0.4;
    for(let i = 0; i < nL; i++){
      const l = lv[i];
      const sp = (140 + l.s * 240) * W.windSpd * (0.4 + SF_WX.gust) * Math.abs(lat);
      const sx = sfWrapDrift(l.bx, lat * sp * SF_WX.t, cw, 150);
      const sy = horizon * 0.25 + l.by * ch * 0.75 + Math.sin(SF_WX.t * 3 + l.ph) * 14;
      if(sy < -10 || sy > ch + 10) continue;
      const sz = 2.4 + l.s * 2.2;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(l.ph + SF_WX.t * (4 + l.s * 3));
      ctx.fillStyle = l.c;
      ctx.fillRect(-sz, -sz * 0.5, sz * 2, sz);
      ctx.restore();
    }
  }

  // v6: rain — wind-slanted streaks + wet sheen rising from the pavement
  if(W.rain > 0.08){
    sfRainOverlay(cw, ch, Math.sin(W.windAng - SF_CAM.yaw) * 0.9);
    const wg = ctx.createLinearGradient(0, horizon, 0, ch);
    wg.addColorStop(0, 'rgba(120,140,165,0)');
    wg.addColorStop(1, `rgba(140,160,185,${W.rain * 0.22})`);
    ctx.fillStyle = wg; ctx.fillRect(0, horizon, cw, ch - horizon);
  }

  // v7: lightning wash over everything
  sfFlashOverlay(cw, ch);

  // v8: lens grade — vignette + faint grain on every street-view frame,
  // full anamorphic letterbox bars while the director camera is live.
  {
    const vg = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.42,
                                        cw / 2, ch / 2, ch * 0.95);
    vg.addColorStop(0, 'rgba(10,8,14,0)');
    vg.addColorStop(1, `rgba(10,8,14,${night ? 0.5 : 0.34})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    const bucket = Math.floor(SF_WX.t * 12);
    for(let k = 0; k < 60; k++){
      const gx = hash2(k, bucket, SEED + 1900) * cw;
      const gy = hash2(k, bucket + 31, SEED + 1901) * ch;
      ctx.fillRect(gx, gy, 1.4, 1.4);
    }
    if(SF_CAM.director){
      const bar = Math.round(ch * 0.085);
      ctx.fillStyle = '#06070c';
      ctx.fillRect(0, 0, cw, bar);
      ctx.fillRect(0, ch - bar, cw, bar);
      // record-dot + timecode burn-in, like a live camera feed
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
      ctx.fillStyle = `rgba(255,70,60,${0.6 + 0.4 * Math.sin(SF_WX.t * 4)})`;
      ctx.beginPath(); ctx.arc(cw * 0.04, bar * 0.5, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(240,240,235,0.85)';
      ctx.fillText('REC', cw * 0.04 + 10, bar * 0.5 + 4);
      const hh = String(Math.floor(W.tod)).padStart(2, '0');
      const mm = String(Math.floor((W.tod % 1) * 60)).padStart(2, '0');
      ctx.textAlign = 'right';
      ctx.fillText(`DOLORES CAM ${hh}:${mm}`, cw * 0.96, ch - bar * 0.4);
    }
  }

  // v9: rig readout — mode + focal length, bottom-left, like a viewfinder
  {
    const mm = Math.round(50 * SF_CAM.fov);
    const mode = SF_CAM.director ? 'DIRECTOR' : (SF_CAM.orbit ? 'ORBIT' : 'FOLLOW');
    const lab = `◉ ${mode}  ${mm}mm`;
    ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
    const tw2 = ctx.measureText(lab).width;
    const barH = SF_CAM.director ? Math.round(ch * 0.085) : 0;
    const ly = ch - barH - 12;
    ctx.fillStyle = 'rgba(8,10,16,0.55)';
    ctx.fillRect(10, ly - 15, tw2 + 18, 20);
    ctx.strokeStyle = 'rgba(200,220,240,0.25)'; ctx.lineWidth = 1;
    ctx.strokeRect(10, ly - 15, tw2 + 18, 20);
    ctx.fillStyle = 'rgba(225,235,245,0.9)';
    ctx.fillText(lab, 19, ly);
  }

  // DIRECTOR badge while free-fly camera is active
  if(SF_CAM.director){
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    const label = '◉ DIRECTOR';
    const bw = ctx.measureText(label).width + 22;
    const by = Math.round(ch * 0.085) + 8;
    ctx.fillStyle = 'rgba(120,20,20,0.85)';
    ctx.fillRect(cw / 2 - bw / 2, by, bw, 22);
    ctx.strokeStyle = 'rgba(255,180,120,0.8)'; ctx.lineWidth = 1;
    ctx.strokeRect(cw / 2 - bw / 2, by, bw, 22);
    ctx.fillStyle = '#ffe9c9';
    ctx.fillText(label, cw / 2, by + 15);
  }

  // v10: stash this frame for the temporal cache, then profiler chip
  sfStillStore(cw, ch, stillKey);
  sfPerfHud(cw, ch);
}

/* minimal generated interior backdrop for door-teleported pawns */
function sfRenderInterior(cw, ch, v){
  const name = v.inside || 'inside';
  ctx.fillStyle = '#241c16'; ctx.fillRect(0, 0, cw, ch);
  const wallG = ctx.createLinearGradient(0, 0, 0, ch * 0.6);
  wallG.addColorStop(0, '#4a3a2c'); wallG.addColorStop(1, '#6b5340');
  ctx.fillStyle = wallG; ctx.fillRect(0, 0, cw, ch * 0.6);
  ctx.fillStyle = '#8a6a45'; ctx.fillRect(0, ch * 0.6, cw, ch * 0.4);
  // floorboards
  ctx.strokeStyle = 'rgba(60,40,20,0.5)';
  for(let y = ch * 0.62; y < ch; y += 14){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
  // counter blob + shelves
  paBlob(ctx, cw / 2, ch * 0.62, Math.min(140, cw * 0.18), '#5a3a22');
  paBlob(ctx, cw / 2, ch * 0.60, Math.min(130, cw * 0.17), '#8a6a45');
  for(let i = 0; i < 3; i++)
    paEllipse(ctx, cw * 0.25 + i * cw * 0.25, ch * 0.3, 60, 10, '#4a3423');
  ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#f8f4e8';
  ctx.fillText('— ' + name + ' —', cw / 2, ch * 0.18);
  const lab = (SF_INTERIORS[name] && SF_INTERIORS[name].label) || '';
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#d8c8b0';
  ctx.fillText(lab, cw / 2, ch * 0.22);
  // the pawn standing inside
  const F2 = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  if(F2 && F2[0]){
    const fr = paActFrame(F2, 0, v, G.frame) || F2[0].idle[0];
    if(fr) ctx.drawImage(fr, cw / 2 - 36, ch * 0.62 - 96, 72, 96);
  }
}
