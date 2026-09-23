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
/* ---------------- v14: TRUE SUN — a real solar position drives every light
   The old constant shadow vector (sun frozen upper-left) is replaced by the
   actual sun over the Mission: azimuth + elevation computed from the sim
   clock (W.tod) and day-of-year at SF's latitude (37.76°N). One sun now
   feeds EVERY consumer — building/prop/pawn cast shadows (direction AND
   length = h·cot(elevation)), per-face facade lighting in both views, roof
   slope shading, cloud-shadow drift, the street-view sun disc and sky
   grade, and golden-hour color temperature. World axes: +x east, +y south.
   x/y keep their old meaning (ground shadow dir per meter of height). */
const SF_SUN = {
  x: 0.26, y: 0.16,   // shadow dir per meter of height (recomputed)
  toX: 0, toY: 1,     // unit vector TOWARD the sun, world xy
  el: 0.9, az: Math.PI, // elevation / compass bearing (rad)
  day: 1,             // 0..1 direct-sun strength (0 = night / overcast)
  warm: 0,            // 0..1 golden-hour warmth (low sun)
  q: 0,               // quantized sun sector — building bakes key on this
};
const SF_CLOUD_ALT = 130;            // meters
function sfSunUpdate(){
  const lat = 37.7596 * Math.PI / 180;
  const mo = (typeof W !== 'undefined' && W.month) ||
             ({ Winter: 1, Spring: 4, Summer: 7, Autumn: 10 })[W.season] || 9;
  const doy = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][mo - 1] +
              (W.day || 15);
  const dec = -23.44 * Math.PI / 180 * Math.cos(2 * Math.PI * (doy + 10) / 365);
  // solar noon ≈ 13:06 PDT at 122.43°W (PDT meridian 105°W + equation of time)
  const H = (W.tod - 13.1) * Math.PI / 12;
  const sinEl = Math.sin(lat) * Math.sin(dec) +
                Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  SF_SUN.el = Math.asin(clamp(sinEl, -1, 1));
  const azS = Math.atan2(Math.sin(H),
    Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  SF_SUN.az = Math.PI + azS;              // compass bearing from north
  SF_SUN.toX = Math.sin(SF_SUN.az);       // east component
  SF_SUN.toY = -Math.cos(SF_SUN.az);      // south component (+y = south)
  const up = SF_SUN.el > 0.01;
  // shadow length = height · cot(elevation); capped so a 2° sun doesn't
  // throw kilometer-long streaks
  const cot = Math.min(1 / Math.max(0.16, Math.tan(Math.max(0.01, SF_SUN.el))), 2.6);
  SF_SUN.x = -SF_SUN.toX * cot;
  SF_SUN.y = -SF_SUN.toY * cot;
  const clear = 1 - clamp(sfCloudCover() * 0.8 + W.rain * 0.7 + W.storm * 0.9, 0, 0.95);
  SF_SUN.day = up ? clear * clamp(Math.sin(SF_SUN.el) * 1.7, 0.08, 1) : 0;
  SF_SUN.warm = up ? clamp(1 - SF_SUN.el / 0.6, 0, 1) : 0;
  SF_SUN.q = !up ? -1
    : Math.round(SF_SUN.az / (Math.PI / 8)) +
      Math.round(SF_SUN.el / 0.22) * 32 + (SF_SUN.day < 0.25 ? 512 : 0);
}
/* scalar sun exposure of a face with outward normal (nx,ny) — shared by
   baked sprites and street-view walls so both views light identically */
function sfSunFaceK(nx, ny){
  return clamp(nx * SF_SUN.toX + ny * SF_SUN.toY, -1, 1);
}
/* face color under the current sun: warm-lit when sunward, sky-cool fill
   when shaded, ambient grey when the sun is down or buried in the deck */
function sfSunWallCol(base, k){
  const lit = 0.58 + 0.5 * Math.max(0, k) * SF_SUN.day + 0.05 * Math.max(0, k);
  if(SF_SUN.day > 0.22 && k > 0.18)
    return mix(shade(base, lit), '#ffdd9e', SF_SUN.warm * 0.42 * Math.min(1, k));
  return mix(shade(base, lit), '#7183a4', 0.22 * (1 - Math.max(0, k) * SF_SUN.day));
}
/* ---------------- v15: penumbra & twilight ----------------
   sfSoftEllipse — a contact shadow with a real umbra/penumbra profile:
   opaque core fading to nothing, drawn as a scaled radial gradient.
   `soft` is the umbra fraction (0..1): a long low-sun throw spreads the
   penumbra wider, so callers shrink `soft` as shadows lengthen.
   sfLampsLit — streetlights come on at civil dusk (sun within ~5° of the
   horizon), not just deep night: the real Mission glows before dark.
   sfLampPool — the warm sodium pool each lit lamp spills on pavement. */
function sfSoftEllipse(cx, cy, rx, ry, rot, a, soft){
  if(rx < 0.5 || ry < 0.5) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0); ctx.scale(rx, ry);
  const g2 = ctx.createRadialGradient(0, 0, clamp(soft, 0.05, 0.95), 0, 0, 1);
  g2.addColorStop(0, `rgba(18,15,8,${a})`);
  g2.addColorStop(1, 'rgba(18,15,8,0)');
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function sfLampsLit(){ return isNight() || SF_SUN.el < 0.09; }
function sfLampPool(cx, cy, r){
  const g2 = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
  g2.addColorStop(0, 'rgba(255,196,110,0.30)');
  g2.addColorStop(0.55, 'rgba(255,178,90,0.12)');
  g2.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * SF_TILT * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
}
/* umbra fraction for a cast shadow of horizontal throw `len` — the sun's
   ~0.5° disc makes the penumbra grow with distance from the occluder */
function sfUmbra(len){ return clamp(0.72 - len * 0.004, 0.3, 0.72); }

function sfWxTick(){
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const dt = SF_WX.lastMs ? Math.min(0.5, (now - SF_WX.lastMs) / 1000) : 0;
  SF_WX.dt = dt; SF_WX.t += dt; SF_WX.lastMs = now;
  sfSunUpdate(); // v14: real solar position drives every light below
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
/* ---------------- v17: ground truth pass ----------------
   Baked once per terrain chunk: SF curb paint (red at crosswalk
   approaches, rare blue accessible + yellow loading zones), storm
   drains and gutter shading on the roadway, and the Dolores Park
   surface decals — tennis courts, basketball court, playground pad,
   and the worn dirt of the picnic hill. All deterministic. */
function sfDecalChunk(g, cx, cy){
  if(typeof SF_GRID === 'undefined' || !SF_GRID) return;
  const csz = CS, cszT = CS * SF_TILT;
  const ox = cx * CHN * csz, oy = cy * CHN * csz;
  // -- curb paint / gutter / storm drains: per-cell edge work --
  for(let iy = 0; iy < CHN; iy++){
    const wy = cy * CHN + iy, sy = Math.round(iy * cszT);
    const sh = Math.round((iy + 1) * cszT) - sy;
    for(let ix = 0; ix < CHN; ix++){
      const wx = cx * CHN + ix, t = sfTile(wx, wy);
      const sx = ix * csz;
      if(t === 11){
        // curb paint on street-adjacent edges: red near crosswalks,
        // blue/yellow loading zones sprinkled elsewhere
        const near16 = (dx, dy, ax, ay) => {
          for(let k = -3; k <= 3; k++)
            if(sfTile(wx + ax * k + dx, wy + ay * k + dy) === 16) return true;
          return false;
        };
        const paint = (edge, col) => {
          g.fillStyle = col;
          if(edge === 'n') g.fillRect(sx, sy, csz, Math.max(2, 3 * SF_TILT));
          if(edge === 's') g.fillRect(sx, sy + sh - Math.max(2, 3 * SF_TILT), csz, Math.max(2, 3 * SF_TILT));
          if(edge === 'w') g.fillRect(sx, sy, 3, sh);
          if(edge === 'e') g.fillRect(sx + csz - 3, sy, 3, sh);
        };
        const edgeCol = (e, red) =>
          red ? '#b8392e'
              : phash(wx, wy, 1702 + 'nesw'.indexOf(e)) < 0.07 ? '#3a5f9e'
              : phash(wx, wy, 1706 + 'nesw'.indexOf(e)) < 0.05 ? '#c8a028' : null;
        if(sfTile(wx, wy - 1) === 10){ const c2 = edgeCol('n', near16(0, -1, 1, 0)); if(c2) paint('n', c2); }
        if(sfTile(wx, wy + 1) === 10){ const c2 = edgeCol('s', near16(0, 1, 1, 0)); if(c2) paint('s', c2); }
        if(sfTile(wx - 1, wy) === 10){ const c2 = edgeCol('w', near16(-1, 0, 0, 1)); if(c2) paint('w', c2); }
        if(sfTile(wx + 1, wy) === 10){ const c2 = edgeCol('e', near16(1, 0, 0, 1)); if(c2) paint('e', c2); }
      } else if(t === 10){
        // gutter shade band along the curb + storm drain grates near
        // crosswalk ends — the dark slot where rain leaves the street
        const gut = (edge) => {
          g.fillStyle = 'rgba(14,16,22,0.30)';
          if(edge === 'n') g.fillRect(sx, sy, csz, Math.max(2, 3.5 * SF_TILT));
          if(edge === 's') g.fillRect(sx, sy + sh - Math.max(2, 3.5 * SF_TILT), csz, Math.max(2, 3.5 * SF_TILT));
          if(edge === 'w') g.fillRect(sx, sy, 3, sh);
          if(edge === 'e') g.fillRect(sx + csz - 3, sy, 3, sh);
        };
        const drainN = (dx, dy, ax, ay) => {
          for(let k = -2; k <= 2; k++)
            if(sfTile(wx + ax * k + dx, wy + ay * k + dy) === 16) return true;
          return false;
        };
        if(sfTile(wx, wy - 1) === 11){ gut('n'); if(drainN(0, -1, 1, 0) && phash(wx, wy, 1710) < 0.5){ g.fillStyle = '#20242c'; const dw = csz * 0.4, dh = Math.max(2, 4 * SF_TILT); g.fillRect(sx + (csz - dw) / 2, sy, dw, dh); g.fillStyle = '#4a5058'; for(let s2 = 1; s2 < 4; s2++) g.fillRect(sx + (csz - dw) / 2 + s2 * dw / 4, sy, 1, dh); } }
        if(sfTile(wx, wy + 1) === 11){ gut('s'); if(drainN(0, 1, 1, 0) && phash(wx, wy, 1711) < 0.5){ g.fillStyle = '#20242c'; const dw = csz * 0.4, dh = Math.max(2, 4 * SF_TILT); g.fillRect(sx + (csz - dw) / 2, sy + sh - dh, dw, dh); g.fillStyle = '#4a5058'; for(let s2 = 1; s2 < 4; s2++) g.fillRect(sx + (csz - dw) / 2 + s2 * dw / 4, sy + sh - dh, 1, dh); } }
        if(sfTile(wx - 1, wy) === 11){ gut('w'); if(drainN(-1, 0, 0, 1) && phash(wx, wy, 1712) < 0.5){ g.fillStyle = '#20242c'; const dw = csz * 0.4, dh = 4; g.fillRect(sx, sy + sh / 2 - dw / 2, dh, dw); g.fillStyle = '#4a5058'; for(let s2 = 1; s2 < 4; s2++) g.fillRect(sx, sy + sh / 2 - dw / 2 + s2 * dw / 4, dh, 1); } }
        if(sfTile(wx + 1, wy) === 11){ gut('e'); if(drainN(1, 0, 0, 1) && phash(wx, wy, 1713) < 0.5){ g.fillStyle = '#20242c'; const dw = csz * 0.4, dh = 4; g.fillRect(sx + csz - dh, sy + sh / 2 - dw / 2, dh, dw); g.fillStyle = '#4a5058'; for(let s2 = 1; s2 < 4; s2++) g.fillRect(sx + csz - dh, sy + sh / 2 - dw / 2 + s2 * dw / 4, dh, 1); } }
      }
    }
  }
  // -- park decals in world px (drawn under a 1 x SF_TILT squash) --
  if(!SF_DECALS.length) return;
  const w0 = ox, w1 = ox + CHN * csz, u0 = oy, u1 = oy + CHN * csz;
  g.save();
  g.scale(1, SF_TILT);
  g.beginPath(); g.rect(0, 0, CHN * csz + 2, CHN * csz + 2); g.clip();
  for(const d of SF_DECALS){
    const dx0 = d.x0 * csz, dy0 = d.y0 * csz, dx1 = d.x1 * csz, dy1 = d.y1 * csz;
    if(dx1 < w0 - 4 || dx0 > w1 + 4 || dy1 < u0 - 4 || dy0 > u1 + 4) continue;
    const X = dx0 - ox, Y = dy0 - oy, Wd = dx1 - dx0, Ht = dy1 - dy0;
    if(d.kind === 'tennis'){
      // fenced surround, then two N-S courts with white lines + nets
      g.fillStyle = '#4d6b4e'; g.fillRect(X, Y, Wd, Ht);
      g.fillStyle = '#5d8a62'; g.fillRect(X + 8, Y + 8, Wd - 16, Ht - 16);
      const cw2 = (Wd - 24) / 2;             // one court width w/ 8px gap
      for(let k = 0; k < 2; k++){
        const cx0 = X + 8 + k * (cw2 + 8), cy0 = Y + 8, cx1 = cx0 + cw2, cy1 = Y + Ht - 8;
        g.fillStyle = '#3f7a58'; g.fillRect(cx0, cy0, cw2, cy1 - cy0);
        g.strokeStyle = '#eef0e4'; g.lineWidth = 2;
        g.strokeRect(cx0 + 4, cy0 + 4, cw2 - 8, cy1 - cy0 - 8);
        const my = (cy0 + cy1) / 2, sv = (cy1 - cy0) * 0.27;
        g.beginPath();
        g.moveTo(cx0 + 4, my - sv); g.lineTo(cx1 - 4, my - sv);
        g.moveTo(cx0 + 4, my + sv); g.lineTo(cx1 - 4, my + sv);
        g.moveTo((cx0 + cx1) / 2, my - sv); g.lineTo((cx0 + cx1) / 2, my + sv);
        g.stroke();
        // net: shadow + white tape
        g.fillStyle = 'rgba(20,24,18,0.5)'; g.fillRect(cx0 + 2, my + 1, cw2 - 4, 3);
        g.fillStyle = '#e8ece0'; g.fillRect(cx0 + 2, my - 1, cw2 - 4, 2);
      }
      // chain-link hint: dotted fence posts on the perimeter
      g.fillStyle = 'rgba(30,40,32,0.55)';
      for(let px2 = X + 4; px2 < X + Wd - 2; px2 += 12){
        g.fillRect(px2, Y + 1, 2, 2); g.fillRect(px2, Y + Ht - 3, 2, 2);
      }
    } else if(d.kind === 'bball'){
      g.fillStyle = '#5c6e78'; g.fillRect(X, Y, Wd, Ht);
      g.fillStyle = '#6d7d88'; g.fillRect(X + 6, Y + 6, Wd - 12, Ht - 12);
      g.strokeStyle = '#e8eae2'; g.lineWidth = 2;
      g.strokeRect(X + 10, Y + 10, Wd - 20, Ht - 20);
      const my = Y + Ht / 2;
      g.beginPath(); g.moveTo(X + 10, my); g.lineTo(X + Wd - 10, my); g.stroke();
      g.beginPath(); g.arc(X + Wd / 2, my, 24, 0, Math.PI * 2); g.stroke();
      // keys + free-throw circles at both ends
      g.strokeRect(X + Wd / 2 - 26, Y + 10, 52, 40);
      g.strokeRect(X + Wd / 2 - 26, Y + Ht - 50, 52, 40);
      g.beginPath(); g.arc(X + Wd / 2, Y + 50, 18, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(X + Wd / 2, Y + Ht - 50, 18, 0, Math.PI * 2); g.stroke();
      // hoops: post + rim at each baseline
      for(const hy of [Y + 12, Y + Ht - 12]){
        g.fillStyle = '#2c343c'; g.fillRect(X + Wd / 2 - 2, hy - 2, 4, 4);
        g.strokeStyle = '#d8dce0'; g.strokeRect(X + Wd / 2 - 8, hy + (hy < my ? 2 : -8), 16, 6);
        g.strokeStyle = '#e8eae2';
      }
    } else if(d.kind === 'play'){
      // rubberized tot-lot pad: tan base, poured-color blobs, border curb
      g.fillStyle = '#8a6a44'; g.fillRect(X, Y, Wd, Ht);
      g.fillStyle = '#c2a06c'; g.fillRect(X + 5, Y + 5, Wd - 10, Ht - 10);
      const blobs = [[0.28, 0.35, 0.16, '#4a9a94'], [0.66, 0.30, 0.13, '#c06a4a'],
                     [0.50, 0.66, 0.15, '#5a7ab0'], [0.80, 0.62, 0.10, '#7aa054']];
      for(const [fx, fy, fr, col] of blobs){
        g.fillStyle = col;
        g.beginPath();
        g.ellipse(X + fx * Wd, Y + fy * Ht, fr * Wd, fr * Ht * 0.9, 0, 0, Math.PI * 2);
        g.fill();
      }
      // play structures: post pads + a slide silhouette, sun-shadowed
      g.fillStyle = '#3c4a55';
      g.fillRect(X + Wd * 0.24, Y + Ht * 0.30, 10, 10);
      g.fillRect(X + Wd * 0.62, Y + Ht * 0.24, 8, 8);
      g.fillStyle = '#d8b03a';
      g.beginPath();
      g.moveTo(X + Wd * 0.26 + 5, Y + Ht * 0.30 + 10);
      g.lineTo(X + Wd * 0.26 + 22, Y + Ht * 0.30 + 26);
      g.lineTo(X + Wd * 0.26 + 5, Y + Ht * 0.30 + 26);
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(20,16,8,0.2)';
      g.fillRect(X + 5, Y + Ht - 9, Wd - 10, 4);
    } else if(d.kind === 'dirt'){
      // worn picnic hill: irregular bare-earth ellipse on grass cells only
      for(let wy = d.y0; wy < d.y1; wy++)
        for(let wx = d.x0; wx < d.x1; wx++){
          if(sfTile(wx, wy) !== 13) continue;
          const ex = (wx + 0.5 - d.cx) / d.rx, ey = (wy + 0.5 - d.cy) / d.ry;
          const r2 = ex * ex + ey * ey;
          if(r2 > 1) continue;
          const edge = clamp((1 - r2) * 4, 0, 1); // feathered rim
          g.fillStyle = `rgba(168,152,104,${0.35 + 0.5 * edge})`;
          g.fillRect(wx * csz - ox, wy * csz - oy, csz + 0.5, csz + 0.5);
          if(phash(wx, wy, 1720) < 0.3){
            g.fillStyle = 'rgba(120,104,70,0.5)';
            g.fillRect(wx * csz - ox + phash(wx, wy, 1721) * 20,
                       wy * csz - oy + phash(wy, wx, 1722) * 20, 6, 5);
          }
        }
    }
  }
  g.restore();
}
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
  sfDecalChunk(g, cx, cy);
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
          Math.round(W.tod * 24), SF_SUN.q, Math.round(W.rain * 8),
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
      else if(o.kind === 'sfLamp') spr = sfLampsLit() ? V.lampOn : V.lampOff; // v15: civil dusk
      else if(o.kind === 'sfShrub') spr = V.shrub[Math.abs(hash2(o.wx, o.wy, 10) * V.shrub.length) | 0];
      else if(o.kind === 'sfFlowerBed') spr = V.flowerbed[Math.abs(hash2(o.wx, o.wy, 11) * V.flowerbed.length) | 0];
      else if(o.kind === 'sfPlanter') spr = V.planter;
      else if(o.kind === 'sfCar' && V.car) spr = V.car[o.v * 2 + o.dir];
      const sprC = spr && (spr.c || spr);
      if(o.kind === 'sfCar' && sprC){
        // v17: parked car — low slab: hard contact shadow + a short
        // sun-thrown wash (1.4m tall occluder), sprite centered on the lane
        const sx = Math.round((o.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round(sfSY(o.y, ch));
        const cw2 = sprC.width * cam.zoom, chh = sprC.height * cam.zoom;
        ctx.fillStyle = 'rgba(16,13,9,0.34)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2 * cam.zoom, cw2 * 0.5, chh * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        if(!isNight() && SF_SUN.day > 0.08){
          const hmPx = 1.4 * SF_PXM * cam.zoom;
          const shx = SF_SUN.x * hmPx * 0.5, shy = SF_SUN.y * hmPx * 0.5 * SF_TILT;
          sfSoftEllipse(sx + shx, sy + shy,
                        cw2 * 0.52 + Math.hypot(shx, shy) * 0.4,
                        chh * 0.5, Math.atan2(shy, shx),
                        0.22 * Math.min(1, SF_SUN.day + 0.3),
                        sfUmbra(Math.hypot(shx, shy)));
        }
        ctx.drawImage(sprC, sx - cw2 / 2, sy - chh / 2, cw2, chh);
        continue;
      }
      if(sprC){
        const sx = Math.round((o.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round(sfSY(o.y, ch));
        // v14: canopy shadow thrown along the REAL sun vector — direction
        // and stretch both come from the solar elevation (long low-sun
        // streaks, compact noon pools), tilted with the ground plane
        if(shadeR && !isNight() && SF_SUN.day > 0.08){
          const hmPx = (o.kind === 'sfTree' ? 4.4 : o.kind === 'sfPalm' ? 6.4 :
                        o.kind === 'sfCypress' ? 6.0 : 3.6) * SF_PXM * cam.zoom;
          const shx = SF_SUN.x * hmPx * 0.5, shy = SF_SUN.y * hmPx * 0.5 * SF_TILT;
          const stretch = 1 + Math.hypot(SF_SUN.x, SF_SUN.y) * 0.55;
          const rot = Math.atan2(shy, shx);
          // v15: penumbral canopy shadow — umbra core, soft falloff edge;
          // the longer the throw, the wider the penumbra spreads
          sfSoftEllipse(sx + shx, sy + shy,
                        shadeR * cam.zoom * stretch,
                        shadeR * 0.42 * cam.zoom * Math.max(0.4, SF_TILT), rot,
                        0.26 * Math.min(1, SF_SUN.day + 0.3),
                        sfUmbra(Math.hypot(shx, shy)));
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
        // v15: lit lamp spills a warm sodium pool on the pavement
        if(o.kind === 'sfLamp' && sfLampsLit())
          sfLampPool(sx, sy, 3.4 * SF_PXM * cam.zoom);
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

  // 2g. v14: directional light grade — a warm wash falls from the sunward
  // side of the frame while the opposite corner sinks into cool sky fill;
  // strength and hue track the real solar elevation (golden near dusk)
  if(!isNight() && SF_SUN.day > 0.06){
    const gx0 = cw / 2 - SF_SUN.toX * cw * 0.65,
          gy0 = ch / 2 - SF_SUN.toY * ch * 0.65;
    const gx1 = cw / 2 + SF_SUN.toX * cw * 0.65,
          gy1 = ch / 2 + SF_SUN.toY * ch * 0.65;
    const lg = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    const wa = 0.10 * SF_SUN.day * (0.5 + SF_SUN.warm * 0.8);
    lg.addColorStop(0, `rgba(70,88,130,${0.09 * SF_SUN.day})`);
    lg.addColorStop(0.55, 'rgba(0,0,0,0)');
    lg.addColorStop(1, `rgba(255,214,150,${wa})`);
    ctx.fillStyle = lg; ctx.fillRect(0, 0, cw, ch);
  }

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
  // v14: real sun exposure — n·L against the live solar bearing; sunward
  // faces warm up (golden when the sun is low), shaded faces take cool
  // sky fill. Shared formula with the baked sprites via sfSunWallCol.
  const sunK = sfSunFaceK(nx, ny);
  const lit = (0.55 + 0.5 * Math.max(0, sunK) * SF_SUN.day +
               0.05 * Math.max(0, sunK)) * dim;
  const wallCol = sfSunWallCol(wallBase, sunK);
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

  // v14: cast shadow — base edge extruded on the ground along the real
  // sun vector (direction + length = hm·cot(elevation))
  quad([[x1, y1, 0.02], [x2, y2, 0.02],
        [x2 + SF_SUN.x * hm, y2 + SF_SUN.y * hm, 0.02],
        [x1 + SF_SUN.x * hm, y1 + SF_SUN.y * hm, 0.02]],
       `rgba(15,12,8,${0.06 + 0.14 * SF_SUN.day})`);

  // wall face: vertical gradient — sky-lit top, AO near the pavement
  const wgr = ctx.createLinearGradient(0, Math.min(p1[1], p2[1]), 0, Math.max(g1[1], g2[1]));
  wgr.addColorStop(0, shade(wallCol, Math.min(1.3, 1.14)));
  wgr.addColorStop(0.7, wallCol);
  wgr.addColorStop(1, shade(wallCol, 0.68));
  ctx.fillStyle = wgr;
  ctx.beginPath();
  ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
  ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p1[0], p1[1]);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,16,12,0.4)'; ctx.lineWidth = 1; ctx.stroke();

  // v15: wall-base ambient occlusion — the lowest meter of facade is
  // starved of skylight by its own mass; a soft band hugs the pavement
  {
    const b1 = pr(x1, y1, 0.95), b2 = pr(x2, y2, 0.95);
    if(b1 && b2){
      const aoG = ctx.createLinearGradient(0, Math.min(b1[1], b2[1]),
                                           0, Math.max(g1[1], g2[1]));
      aoG.addColorStop(0, 'rgba(16,12,8,0)');
      aoG.addColorStop(1, `rgba(16,12,8,${(night ? 0.2 : 0.28) * dim})`);
      ctx.fillStyle = aoG;
      ctx.beginPath();
      ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
      ctx.lineTo(b2[0], b2[1]); ctx.lineTo(b1[0], b1[1]);
      ctx.closePath(); ctx.fill();
    }
    // v15: eave shadow — the cornice throws a shade band across the wall
    // crown, deepest when high sun strikes the facade head-on
    const ea = night ? 0 : 0.3 * SF_SUN.day * Math.max(0, sunK);
    if(ea > 0.02){
      const eA = pr(x1, y1, hm - 0.45), eB = pr(x2, y2, hm - 0.45),
            eC = pr(x1, y1, hm - 1.6), eD = pr(x2, y2, hm - 1.6);
      if(eA && eB && eC && eD){
        const eG = ctx.createLinearGradient(0, Math.min(eA[1], eB[1]),
                                            0, Math.max(eC[1], eD[1]));
        eG.addColorStop(0, `rgba(20,14,8,${ea})`);
        eG.addColorStop(1, 'rgba(20,14,8,0)');
        ctx.fillStyle = eG;
        ctx.beginPath();
        ctx.moveTo(eA[0], eA[1]); ctx.lineTo(eB[0], eB[1]);
        ctx.lineTo(eD[0], eD[1]); ctx.lineTo(eC[0], eC[1]);
        ctx.closePath(); ctx.fill();
      }
    }
  }

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
    const litWin = sfLampsLit() && phash(wx * 7 | 0, zB * 13 | 0, i) < 0.5;
    // v16: ~40% of daylight windows show the room behind the glass —
    // dim interior + treatment — instead of a pure sky mirror
    const treat = phash(Math.round(wx * 31), Math.round(zB * 17), i + 1770);
    const seeIn = !night && !litWin && det === 2 && treat < 0.42;
    if(litWin){
      gg.addColorStop(0, '#ffe9b0'); gg.addColorStop(1, '#c9862e');
    } else if(seeIn){
      gg.addColorStop(0, '#241a12'); gg.addColorStop(1, '#43301f');
    } else {
      gg.addColorStop(0, '#5d7d92'); gg.addColorStop(0.55, '#8fb0c6');
      gg.addColorStop(1, '#a9c6da');
    }
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(pb[0] - r, pb[1]); ctx.lineTo(pb[0] - r, pt[1] + r);
    ctx.arc(pb[0], pt[1] + r, r, Math.PI, 0, true);
    ctx.lineTo(pb[0] + r, pb[1]); ctx.closePath(); ctx.fill();
    // v16: what's inside — blinds, curtains, or a sill plant silhouette
    if(seeIn && ww > 6){
      if(treat < 0.15){            // venetian blinds, half down
        ctx.fillStyle = 'rgba(214,204,180,0.85)';
        ctx.fillRect(pb[0] - r, pt[1] + wh * 0.06, ww, wh * 0.42);
        ctx.strokeStyle = 'rgba(80,66,48,0.8)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let k = 1; k < 5; k++){
          const yy = pt[1] + wh * 0.06 + wh * 0.42 * k / 5;
          ctx.moveTo(pb[0] - r, yy); ctx.lineTo(pb[0] + r, yy);
        }
        ctx.stroke();
      } else if(treat < 0.30){     // side curtains
        ctx.fillStyle = 'rgba(188,168,140,0.9)';
        ctx.fillRect(pb[0] - r, pt[1], ww * 0.3, wh);
        ctx.fillRect(pb[0] + r - ww * 0.3, pt[1], ww * 0.3, wh);
      } else {                     // plant on the sill
        ctx.fillStyle = 'rgba(46,90,40,0.9)';
        ctx.beginPath();
        ctx.arc(pb[0], pb[1] - wh * 0.16, r * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(90,52,30,0.9)';
        ctx.fillRect(pb[0] - r * 0.22, pb[1] - wh * 0.12, r * 0.44, wh * 0.12);
      }
      // glass still catches the sky — faint reflection over the room
      ctx.fillStyle = 'rgba(160,190,214,0.16)';
      ctx.fillRect(pb[0] - r, pt[1], ww, wh);
    } else if(litWin && phash(wx * 11 | 0, zB * 3 | 0, i + 1771) < 0.4){
      // lit window with a figure or lamp silhouette against the warmth
      ctx.fillStyle = 'rgba(70,44,20,0.75)';
      const fh = wh * 0.4;
      ctx.fillRect(pb[0] - ww * 0.12, pb[1] - fh, ww * 0.24, fh);
      ctx.beginPath(); ctx.arc(pb[0], pb[1] - fh - ww * 0.07, ww * 0.09, 0, Math.PI * 2); ctx.fill();
    }
    // v14: sun glint — glass flashes warm when the facade faces the sun
    if(!night && SF_SUN.day > 0.3 && sunK > 0.35){
      ctx.fillStyle = `rgba(255,242,205,${0.32 * SF_SUN.day * sunK})`;
      ctx.fillRect(pb[0] - r * 0.7, pt[1] + wh * 0.12, r * 0.95,
                   Math.max(1.5, wh * 0.3));
    }
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
           shade(wallCol, 0.78));
      quad([[b2x, b2y, zLo], [b2x, b2y, zHi], [bx, by, zHi], [bx, by, zLo]],
           shade(wallCol, 0.78));
      quad([[a2x, a2y, zLo], [b2x, b2y, zLo], [b2x, b2y, zHi], [a2x, a2y, zHi]],
           shade(sfSunWallCol(wallBase, Math.min(1, sunK + 0.25)), Math.min(1.25, 1.06)));
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
    // recessed plate-glass storefront — v16: you can see IN now. The
    // glass box shows the lit interior (back wall, shelves, counter,
    // pendant lamps, a figure behind the bar), then sky reflection +
    // mullions read it back as a window.
    const gA = pr(sx0, sy0, 0.55), gB = pr(sx1, sy1, 0.55),
          tA = pr(sx0, sy0, 2.6), tB = pr(sx1, sy1, 2.6);
    if(gA && gB && tA && tB && Math.abs(gB[0] - gA[0]) > 8){
      // screen-space point inside the glass quad: u along the front,
      // z 0..1 floor->transom, d depth into the room (0 glass, 1 back)
      const sp = (u, z, d) => {
        const lx = gA[0] + (tA[0] - gA[0]) * z, ly = gA[1] + (tA[1] - gA[1]) * z;
        const rx = gB[0] + (tB[0] - gB[0]) * z, ry = gB[1] + (tB[1] - gB[1]) * z;
        const uu = u + (0.5 - u) * d * 0.55;   // squeeze toward center w/ depth
        return [lx + (rx - lx) * uu, ly + (ry - ly) * uu + d * 0.12 * (tA[1] - gA[1])];
      };
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(gA[0], gA[1]); ctx.lineTo(gB[0], gB[1]);
      ctx.lineTo(tB[0], tB[1]); ctx.lineTo(tA[0], tA[1]);
      ctx.closePath(); ctx.clip();
      // interior volume: ceiling-dark down to floor-warm
      const ig = ctx.createLinearGradient(0, Math.min(tA[1], tB[1]),
                                        0, Math.max(gA[1], gB[1]));
      if(night){
        ig.addColorStop(0, '#3a2c18'); ig.addColorStop(1, '#6a4a26');
      } else {
        ig.addColorStop(0, '#33271c'); ig.addColorStop(0.55, '#54402c');
        ig.addColorStop(1, '#6e5638');
      }
      ctx.fillStyle = ig;
      ctx.fillRect(Math.min(gA[0], tA[0], gB[0], tB[0]) - 2,
                   Math.min(gA[1], tA[1], gB[1], tB[1]) - 2,
                   Math.abs(gB[0] - gA[0]) + 4,
                   Math.max(gA[1], gB[1]) - Math.min(tA[1], tB[1]) + 4);
      // back-wall shelf line with jars
      const sh0 = sp(0.12, 0.55, 1), sh1 = sp(0.62, 0.55, 1);
      ctx.strokeStyle = 'rgba(30,20,12,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sh0[0], sh0[1]); ctx.lineTo(sh1[0], sh1[1]); ctx.stroke();
      const nJar = Math.max(2, Math.floor(Math.hypot(sh1[0] - sh0[0], sh1[1] - sh0[1]) / 9));
      for(let k = 0; k < nJar; k++){
        const u = k / Math.max(1, nJar - 1);
        const jx = sh0[0] + (sh1[0] - sh0[0]) * u, jy = sh0[1] + (sh1[1] - sh0[1]) * u;
        ctx.fillStyle = ['#c9b89a', '#8a5a3a', '#5a7a8a', '#d8d0c0'][k % 4];
        ctx.fillRect(jx - 1.5, jy - 6, 3.4, 6);
      }
      // counter silhouette with a lit top edge
      const c0 = sp(0.16, 0.30, 0.45), c1 = sp(0.70, 0.30, 0.45),
            c2 = sp(0.70, 0.02, 0.45), c3 = sp(0.16, 0.02, 0.45);
      ctx.fillStyle = '#241a10';
      ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]);
      ctx.lineTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(230,200,140,0.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]); ctx.stroke();
      // barista silhouette behind the counter
      const fp = sp(0.44 + phash(i, ei, 1450) * 0.14, 0.30, 0.8);
      const fs = Math.abs(gA[1] - tA[1]) / 46;
      ctx.fillStyle = 'rgba(16,10,6,0.9)';
      ctx.fillRect(fp[0] - 5 * fs, fp[1] - 22 * fs, 10 * fs, 22 * fs);
      ctx.beginPath(); ctx.arc(fp[0], fp[1] - 26 * fs, 4.4 * fs, 0, Math.PI * 2); ctx.fill();
      // pendant lamps: cord + glowing cone (always on in a working shop)
      for(let k = 0; k < 3; k++){
        const lp = sp(0.2 + k * 0.22, 0.98, 0.6), lt = sp(0.2 + k * 0.22, 0.80, 0.6);
        ctx.strokeStyle = '#120e08'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(lp[0], lp[1]); ctx.lineTo(lt[0], lt[1]); ctx.stroke();
        ctx.fillStyle = '#26382e';
        ctx.beginPath(); ctx.moveTo(lt[0] - 5, lt[1]); ctx.lineTo(lt[0] + 5, lt[1]);
        ctx.lineTo(lt[0] + 3, lt[1] - 6); ctx.lineTo(lt[0] - 3, lt[1] - 6);
        ctx.closePath(); ctx.fill();
        const la = night || sfLampsLit() ? 0.75 : 0.4;
        const lg = ctx.createRadialGradient(lt[0], lt[1] + 3, 1, lt[0], lt[1] + 3, 16);
        lg.addColorStop(0, `rgba(255,206,120,${la})`);
        lg.addColorStop(1, 'rgba(255,206,120,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(lt[0] - 16, lt[1] - 10, 32, 34);
      }
      // glass over the room: sky reflection + a diagonal glare swipe
      ctx.fillStyle = night ? 'rgba(60,70,95,0.18)' : 'rgba(150,185,215,0.22)';
      ctx.beginPath();
      ctx.moveTo(gA[0], gA[1]); ctx.lineTo(gB[0], gB[1]);
      ctx.lineTo(tB[0], tB[1]); ctx.lineTo(tA[0], tA[1]);
      ctx.closePath(); ctx.fill();
      const glx = gA[0] + (gB[0] - gA[0]) * phash(i, ei, 1451);
      ctx.fillStyle = `rgba(235,244,252,${night ? 0.10 : 0.22})`;
      ctx.beginPath();
      ctx.moveTo(glx - 8, gA[1]); ctx.lineTo(glx + 14, gA[1]);
      ctx.lineTo(glx + 34, tA[1]); ctx.lineTo(glx + 12, tA[1]);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for(let k = 0; k <= 3; k++){
      const u = s0 + (s1 - s0) * k / 3;
      const pb = pr(x1 + ex * u, y1 + ey * u, 0.55),
            pt = pr(x1 + ex * u, y1 + ey * u, 2.6);
      if(!pb || !pt) continue;
      ctx.strokeStyle = '#1c242c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pb[0], pb[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
    }
    quad([[sx0, sy0, 0], [sx1, sy1, 0], [sx1, sy1, 0.55], [sx0, sy0, 0.55]],
         shade(wallCol, 0.55));
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
/* v17: a parked car drawn as a real projected box — lower body slab,
   glass greenhouse on top, wheels grounded at z=0. Faces are sorted
   far->near and lit by the same sfSunWallCol/sun vector the buildings
   use, so paint and shadow agree with the street around it. */
function sfCarStreet(o, pr, F, night){
  const mx = o.x / SF_PXM, my = o.y / SF_PXM;
  const p = pr(mx, my, 0);
  if(!p) return;
  const sc = F / p[2];
  const ax = o.dir === 0 ? 1 : 0, ay = o.dir === 0 ? 0 : 1; // along-street
  const bx = ay, by = ax;                                  // across-street
  const hl = 2.3, hw = 0.92, z0 = 0.22, z1 = 1.0, zc = 1.48;
  const base = SF_CAR_COLS[o.v % SF_CAR_COLS.length];
  const kTop = Math.sin(Math.max(0, SF_SUN.el));
  // cast shadow along the true sun vector + tight contact shade
  if(!night && SF_SUN.day > 0.08){
    const tip = pr(mx + SF_SUN.x * zc * 0.8, my + SF_SUN.y * zc * 0.8, 0);
    if(tip){
      const ang = Math.atan2(tip[1] - p[1], tip[0] - p[0]);
      const len = Math.hypot(tip[0] - p[0], tip[1] - p[1]);
      sfSoftEllipse((p[0] + tip[0]) / 2, (p[1] + tip[1]) / 2,
                    hl * sc + len / 2, hw * 0.55 * sc, ang,
                    0.30 * Math.min(1, SF_SUN.day + 0.3), sfUmbra(len));
    }
  }
  ctx.fillStyle = 'rgba(14,11,8,0.4)';
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], hl * sc * 0.96, hw * sc * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // wheels first — dark blobs grounded at the corners
  ctx.fillStyle = night ? '#141210' : '#1e1c1a';
  for(const sa of [-0.68, 0.68]) for(const sb of [-0.82, 0.82]){
    const wp = pr(mx + ax * sa * hl + bx * sb * hw,
                  my + ay * sa * hl + by * sb * hw, 0.18);
    if(wp){ ctx.beginPath();
      ctx.ellipse(wp[0], wp[1], Math.max(1.5, 0.34 * sc), Math.max(1.5, 0.3 * sc), 0, 0, Math.PI * 2);
      ctx.fill(); }
  }
  // box faces: [corners xyz..., outward normal, color, glass?]
  const corners = (a0, a1, b0, b1, zz0, zz1) => ({
    // 4 side quads + top
    quads: [
      { q: [[a0, b0, zz0], [a1, b0, zz0], [a1, b0, zz1], [a0, b0, zz1]], n: [-by, -bx] },
      { q: [[a0, b1, zz0], [a1, b1, zz0], [a1, b1, zz1], [a0, b1, zz1]], n: [by, bx] },
      { q: [[a0, b0, zz0], [a0, b1, zz0], [a0, b1, zz1], [a0, b0, zz1]], n: [-ax, -ay] },
      { q: [[a1, b0, zz0], [a1, b1, zz0], [a1, b1, zz1], [a1, b0, zz1]], n: [ax, ay] },
      { q: [[a0, b0, zz1], [a1, b0, zz1], [a1, b1, zz1], [a0, b1, zz1]], n: null },
    ],
  });
  const toXY = (a, b2) => [mx + ax * a + bx * b2, my + ay * a + by * b2];
  const body = corners(-hl, hl, -hw, hw, z0, z1);
  const cab = corners(-hl * 0.52, hl * 0.30, -hw * 0.88, hw * 0.88, z1, zc);
  const faces = [];
  const pushF = (box, col, isGlass) => {
    for(const f of box.quads){
      const pts = [];
      let ok = true, dd = 0;
      for(const [a, b2, z] of f.q){
        const [wxm, wym] = toXY(a, b2);
        const q = pr(wxm, wym, z);
        if(!q){ ok = false; break; }
        pts.push(q); dd += q[2];
      }
      if(ok) faces.push({ d: dd / 4, pts, n: f.n, col, isGlass });
    }
  };
  pushF(body, base, false);
  pushF(cab, '#6a8ea4', true);
  faces.sort((fa, fb) => fb.d - fa.d);
  for(const f of faces){
    const k = f.n ? sfSunFaceK(f.n[0], f.n[1]) : kTop;
    let col;
    if(f.isGlass){
      // glass: sky-cool base, bright glare when the face looks sunward
      col = f.n ? sfSunWallCol('#6a8ea4', k * 0.9 + 0.2)
                : sfSunWallCol('#7fa2b8', kTop);
      if(!night && SF_SUN.day > 0.4 && k > 0.55)
        col = mix(col, '#e8f4ff', (k - 0.55) * SF_SUN.day * 0.9);
    } else {
      col = f.n ? sfSunWallCol(base, k)
                : sfSunWallCol(shade(base, 1.12), kTop * 0.9 + 0.1);
      if(night) col = shade(col, 0.45);
    }
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for(let i2 = 1; i2 < 4; i2++) ctx.lineTo(f.pts[i2][0], f.pts[i2][1]);
    ctx.closePath(); ctx.fill();
  }
  // head/tail lamps on the end faces
  for(const e of [-1, 1]){
    const lamp = e > 0 ? '#f2ecc8' : '#a03838';
    for(const sb of [-0.6, 0.6]){
      const lp = pr(mx + ax * e * hl + bx * sb * hw * 0.8,
                    my + ay * e * hl + by * sb * hw * 0.8, 0.62);
      if(lp){
        ctx.fillStyle = lamp;
        ctx.fillRect(lp[0] - 0.1 * sc, lp[1] - 0.06 * sc, 0.2 * sc, 0.12 * sc);
      }
    }
  }
}
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

  // sky + light by tod/weather — v14: graded by real solar elevation
  const night = isNight();
  const wK = SF_SUN.warm; // 0 high sun -> 1 sun on the horizon
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  if(night){ sky.addColorStop(0, '#101626'); sky.addColorStop(1, '#2a3350'); }
  else if(W.rain > 0.2){ sky.addColorStop(0, '#6a7688'); sky.addColorStop(1, '#a8b2bc'); }
  else {
    sky.addColorStop(0, mix('#5b8fc9', '#5a6ea8', wK * 0.65));
    sky.addColorStop(1, mix('#cfe3f2', '#ffc98a', wK * 0.85));
  }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, cw, horizon);
  // v14: low-sun band — the warm veil that sits on the horizon whenever
  // the real solar elevation drops toward golden hour
  if(!night && wK > 0.03 && W.rain < 0.3){
    const hb = ctx.createLinearGradient(0, horizon - horizon * 0.5, 0, horizon);
    hb.addColorStop(0, 'rgba(255,170,90,0)');
    hb.addColorStop(1, `rgba(255,178,96,${0.34 * wK * (1 - sfCloudCover() * 0.5)})`);
    ctx.fillStyle = hb;
    ctx.fillRect(0, horizon - horizon * 0.5, cw, horizon * 0.5);
  }
  const cover = sfCloudCover();
  // v9: aerial perspective strength for this frame — the marine layer's
  // moisture scatters light, so distant blocks melt toward the horizon
  // color. Driven by the same humidity/cloud physics as Karl himself.
  const fogAFrame = night ? 0.3 : clamp(0.16 + (W.hum - 0.55) * 1.7 + W.rain * 0.5, 0.1, 0.9);
  SF_WX.hazeK = clamp((night ? 0.10 : 0.15) + fogAFrame * 0.55 + cover * 0.15, 0.1, 0.8);
  SF_WX.hazeRGB = night ? '52,62,92' : '188,212,230';
  if(!night){
    // v14: sun disc at the TRUE solar bearing/elevation — the same vector
    // that throws every shadow in both views. Elevation maps to height
    // above the horizon; the disc warms and swells as the sun drops.
    const sunFwd = SF_SUN.toX * DX + SF_SUN.toY * DY;
    const sunSide = SF_SUN.toX * DY - SF_SUN.toY * DX;
    const sunUp = Math.sin(Math.max(0, SF_SUN.el));
    if(sunFwd > 0.15 && W.rain < 0.4){
      const sx2 = cw / 2 + (sunSide / Math.max(0.4, sunFwd)) * F * 0.9;
      const sy2 = horizon - sunUp * F * 0.72;
      if(sx2 > -200 && sx2 < cw + 200){
        const sg = ctx.createRadialGradient(sx2, sy2, 2, sx2, sy2,
                                            F * (0.5 + wK * 0.3));
        const sgR = 255, sgG = Math.round(252 - wK * 72), sgB = Math.round(232 - wK * 138);
        sg.addColorStop(0, `rgba(${sgR},${sgG},${sgB},0.85)`);
        sg.addColorStop(0.07, `rgba(255,${236 - Math.round(wK * 70)},${190 - Math.round(wK * 100)},0.5)`);
        sg.addColorStop(1, 'rgba(255,210,140,0)');
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
      const sy3 = horizon - sunUp * F * 0.72;
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
    // v17: decal cells (park courts/playground/worn hill) override the
    // flat tile color so the street camera reads the same surfaces the
    // baked atlas shows from above
    const gx = Math.round(wxm / cm), gy = Math.round(wym / cm);
    qEmit(SF_GROUND_OVR.get(gx + ',' + gy) || COLS[t] || '#a8977a',
          p1, p2, p3, p4);
    // v17 grounding detail on the flat quad grid:
    //  - curb reveal: bright curb top on the sidewalk edge + gutter band
    //    on the roadway beside it (the 15cm step that grounds the street)
    //  - sidewalk expansion joints: thin saw-cut lines across each cell
    const subQ = (x0, y0, x1, y1, style) => {
      const q1 = pr(wxm + x0, wym + y0, 0), q2 = pr(wxm + x1, wym + y0, 0),
            q3 = pr(wxm + x1, wym + y1, 0), q4 = pr(wxm + x0, wym + y1, 0);
      if(q1 && q2 && q3 && q4) qEmit(style, q1, q2, q3, q4);
    };
    if(t === 11){
      if(cfwd < 90){
        subQ(0, cm / 2 - 0.03, cm, cm / 2 + 0.03, 'rgba(40,36,28,0.30)');
        subQ(cm / 2 - 0.03, 0, cm / 2 + 0.03, cm, 'rgba(40,36,28,0.30)');
      }
      if(sfTile(gx, gy - 1) === 10) subQ(0, 0, cm, 0.16, 'rgba(226,222,210,0.55)');
      if(sfTile(gx, gy + 1) === 10) subQ(0, cm - 0.16, cm, cm, 'rgba(226,222,210,0.55)');
      if(sfTile(gx - 1, gy) === 10) subQ(0, 0, 0.16, cm, 'rgba(226,222,210,0.55)');
      if(sfTile(gx + 1, gy) === 10) subQ(cm - 0.16, 0, cm, cm, 'rgba(226,222,210,0.55)');
    } else if(t === 10 && cfwd < 90){
      if(sfTile(gx, gy - 1) === 11) subQ(0, 0, cm, 0.5, 'rgba(16,18,24,0.30)');
      if(sfTile(gx, gy + 1) === 11) subQ(0, cm - 0.5, cm, cm, 'rgba(16,18,24,0.30)');
      if(sfTile(gx - 1, gy) === 11) subQ(0, 0, 0.5, cm, 'rgba(16,18,24,0.30)');
      if(sfTile(gx + 1, gy) === 11) subQ(cm - 0.5, 0, cm, cm, 'rgba(16,18,24,0.30)');
      // asphalt wear: darker wheel-track bands along the travel axis
      if(cfwd < 60){
        const v2 = sfTile(gx, gy - 1) === 10 && sfTile(gx, gy + 1) === 10;
        const h2 = sfTile(gx - 1, gy) === 10 && sfTile(gx + 1, gy) === 10;
        if(v2 && !h2){ subQ(cm * 0.18, 0, cm * 0.32, cm, 'rgba(20,22,28,0.16)');
                       subQ(cm * 0.68, 0, cm * 0.82, cm, 'rgba(20,22,28,0.16)'); }
        else if(h2 && !v2){ subQ(0, cm * 0.18, cm, cm * 0.32, 'rgba(20,22,28,0.16)');
                            subQ(0, cm * 0.68, cm, cm * 0.82, 'rgba(20,22,28,0.16)'); }
      }
    }
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
          const wU2 = RFm.alongX ? [0, 1] : [1, 0];
          for(const keepPos of [false, true]){
            const half = sfClipHalf(P, RFm, keepPos);
            if(half.length < 3) continue;
            // v14: this slope's outward normal vs the real sun vector
            const lit = sfRoofFaceLit(wU2[0] * (keepPos ? 1 : -1),
                                      wU2[1] * (keepPos ? 1 : -1));
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
        // v13: gable dormers on the camera-facing slope — same hash recipe
        // as the baked sprite, so top-down and street agree. Cheek wall
        // stands on the lifted surface, gable cap climbs toward the ridge.
        if(rk === 'gable'){
          const roofAreaPx2 = b._area * SF_PXM * SF_PXM;
          if(roofAreaPx2 > 1400){
            const nDor = Math.min(3, Math.floor(roofAreaPx2 / 2600) +
              (phash(b.i, 31, 1710) < 0.45 ? 1 : 0));
            const aU = RFm.alongX ? [1, 0] : [0, 1];   // ridge axis
            const wU = RFm.alongX ? [0, 1] : [1, 0];   // perpendicular
            let uLo = 1e9, uHi = -1e9;
            for(const p2 of P){
              const u2 = RFm.alongX ? p2[0] : p2[1];
              if(u2 < uLo) uLo = u2; if(u2 > uHi) uHi = u2;
            }
            for(const sgn of [-1, 1]){
              // this slope's outward normal: does it face the camera?
              const nwx = wU[0] * sgn, nwy = wU[1] * sgn;
              if(nwx * -DX + nwy * -DY <= 0.05) continue;
              const litD = sfRoofFaceLit(nwx, nwy); // v14: real sun side
              for(let d2 = 0; d2 < nDor; d2++){
                const u = (phash(b.i, d2 + (sgn > 0 ? 9 : 0), 1711) - 0.5) * (uHi - uLo) * 0.6;
                const w0 = sgn * RFm.wMax * (0.3 + phash(d2, b.i + sgn * 3, 1712) * 0.22);
                const dx5 = RFm.cx + aU[0] * u + wU[0] * w0;
                const dy5 = RFm.cy + aU[1] * u + wU[1] * w0;
                const zB = hm + liftM(dx5, dy5) * riseM;
                const hw = 0.7, dh = 1.5;
                const p1 = [dx5 - aU[0] * hw, dy5 - aU[1] * hw];
                const p2 = [dx5 + aU[0] * hw, dy5 + aU[1] * hw];
                fillProj([[p1[0], p1[1], zB], [p2[0], p2[1], zB],
                          [p2[0], p2[1], zB + dh], [p1[0], p1[1], zB + dh]],
                         night ? '#262220'
                           : shade(SF_WALL_COLS[Math.floor(phash(b.i, 7, 1300) * SF_WALL_COLS.length)],
                                   litD ? 1.02 : 0.7));
                // dormer gable cap: triangle peaking toward the main ridge
                fillProj([[p1[0], p1[1], zB + dh], [p2[0], p2[1], zB + dh],
                          [dx5 - wU[0] * sgn * 1.1, dy5 - wU[1] * sgn * 1.1, zB + dh + 0.8]],
                         night ? '#241f1c'
                           : shade(litD ? shingR[4] : shingR[2], wetG ? 0.78 : 1));
                // sash window on the cheek, kept proud of the wall plane
                const wo = 0.05 * sgn;
                fillProj([[dx5 - aU[0] * 0.3 - wU[0] * wo, dy5 - aU[1] * 0.3 - wU[1] * wo, zB + 0.45],
                          [dx5 + aU[0] * 0.3 - wU[0] * wo, dy5 + aU[1] * 0.3 - wU[1] * wo, zB + 0.45],
                          [dx5 + aU[0] * 0.3 - wU[0] * wo, dy5 + aU[1] * 0.3 - wU[1] * wo, zB + 1.15],
                          [dx5 - aU[0] * 0.3 - wU[0] * wo, dy5 - aU[1] * 0.3 - wU[1] * wo, zB + 1.15]],
                         night ? '#1c2a34' : '#7a94a8');
              }
            }
          }
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
          : Math.floor(phash(b.i, k, 1507) * 7); // v13: +solar, +roof garden
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
        } else if(kind === 5){ // v13 solar array: slab tilted toward the sun
          // sun sits toward (-SF_SUN.x,-SF_SUN.y); the high edge of each
          // panel points that way, so the glass flashes the sky
          const tx2 = -SF_SUN.x, ty2 = -SF_SUN.y;
          const tl = Math.hypot(tx2, ty2) || 1;
          const ax2 = tx2 / tl, ay2 = ty2 / tl;      // tilt axis (upslope)
          const px2 = -ay2, py2 = ax2;               // across the panel
          const c4 = [[-1.1, -0.8, 0.15], [1.1, -0.8, 0.15],
                      [1.1, 0.8, 0.6], [-1.1, 0.8, 0.6]];
          ctx.beginPath();
          let ok = true, st = false;
          for(const [e1, e2, dz] of c4){
            const q = pr(fx + px2 * e1 + ax2 * e2, fy + py2 * e1 + ay2 * e2, hm + zR + dz);
            if(!q){ ok = false; break; }
            st ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); st = true;
          }
          if(ok){
            ctx.closePath();
            ctx.fillStyle = night ? '#141c26' : '#1e3450'; ctx.fill();
            ctx.strokeStyle = night ? '#1e2c3c' : '#4a7ab0';
            ctx.lineWidth = Math.max(1, 0.06 * sc); ctx.stroke();
            // mid rail line
            const m1 = pr(fx + px2 * -1.1, fy + py2 * -1.1, hm + zR + 0.37),
                  m2 = pr(fx + px2 * 1.1, fy + py2 * 1.1, hm + zR + 0.37);
            if(m1 && m2){ ctx.beginPath(); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m2[0], m2[1]); ctx.stroke(); }
          }
        } else if(kind === 6){ // v13 roof garden bed: soil + leaf rows
          const gq = [[-0.9, -0.6], [0.9, -0.6], [0.9, 0.6], [-0.9, 0.6]];
          ctx.beginPath();
          let ok = true, st = false;
          for(const [e1, e2] of gq){
            const q = pr(fx + e1, fy + e2, hm + zR + 0.12);
            if(!q){ ok = false; break; }
            st ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); st = true;
          }
          if(ok){
            ctx.closePath();
            ctx.fillStyle = night ? '#1c2018' : '#5a4632'; ctx.fill();
            for(let g2 = -1; g2 <= 1; g2++){
              const q = pr(fx + g2 * 0.5, fy, hm + zR + 0.3);
              if(q){ ctx.fillStyle = night ? '#243020' : '#4e7a44';
                     ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(1, 0.22 * sc), 0, Math.PI * 2); ctx.fill(); }
            }
          }
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
      if(o.kind === 'sfCar'){ sfCarStreet(o, pr, F, night); continue; }
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
      else if(o.kind === 'sfLamp'){ spr = sfLampsLit() ? V.lampOn : V.lampOff; hm = 4.5; }
      else if(o.kind === 'sfShrub'){ spr = V.shrub[Math.abs(hash2(o.wx, o.wy, 10) * V.shrub.length) | 0]; hm = 0.9; shadowR = 0.7; }
      else if(o.kind === 'sfFlowerBed'){ spr = V.flowerbed[Math.abs(hash2(o.wx, o.wy, 11) * V.flowerbed.length) | 0]; hm = 0.5; }
      else if(o.kind === 'sfPlanter'){ spr = V.planter; hm = 0.7; }
      const sprC = spr && (spr.c || spr);
      if(sprC){
        const ph = hm * sc, pw = ph * (sprC.width / sprC.height);
        // v14: shadow thrown along the true sun vector — tip projected
        // through pr so length/direction track the solar elevation
        if(shadowR && !night && SF_SUN.day > 0.08){
          const tip = pr(o.x / SF_PXM + SF_SUN.x * hm * 0.6,
                         o.y / SF_PXM + SF_SUN.y * hm * 0.6, 0);
          const tx = tip ? tip[0] : p[0], ty = tip ? tip[1] : p[1];
          const ang = Math.atan2(ty - p[1], tx - p[0]);
          const len = Math.hypot(tx - p[0], ty - p[1]);
          // v15: penumbral prop shadow — soft falloff grows with throw
          sfSoftEllipse((p[0] + tx) / 2, (p[1] + ty) / 2,
                        shadowR * sc + len / 2, shadowR * 0.3 * sc, ang,
                        0.32 * Math.min(1, SF_SUN.day + 0.3), sfUmbra(len));
        }
        ctx.drawImage(sprC, p[0] - pw / 2, p[1] - ph, pw, ph);
        // v15: lit lamp — halo around the acorn globe + sodium pool below
        if(o.kind === 'sfLamp' && sfLampsLit()){
          const gp = pr(o.x / SF_PXM, o.y / SF_PXM, 4.15);
          if(gp){
            const hg = ctx.createRadialGradient(gp[0], gp[1], 1,
                                                gp[0], gp[1], 1.7 * sc);
            hg.addColorStop(0, 'rgba(255,224,150,0.5)');
            hg.addColorStop(1, 'rgba(255,190,100,0)');
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.arc(gp[0], gp[1], 1.7 * sc, 0, Math.PI * 2); ctx.fill();
          }
          const pg = ctx.createRadialGradient(p[0], p[1], 1,
                                              p[0], p[1], 3.1 * sc);
          pg.addColorStop(0, 'rgba(255,196,110,0.26)');
          pg.addColorStop(1, 'rgba(255,170,80,0)');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.ellipse(p[0], p[1], 3.1 * sc, 1.1 * sc, 0, 0, Math.PI * 2);
          ctx.fill();
        }
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
        // v14: ground shadow cast along the real sun vector
        const vtip = (!night && SF_SUN.day > 0.08)
          ? pr(pv.x / SF_PXM + SF_SUN.x * 1.7, pv.y / SF_PXM + SF_SUN.y * 1.7, 0)
          : null;
        if(vtip){
          const ang = Math.atan2(vtip[1] - p[1], vtip[0] - p[0]);
          const len = Math.hypot(vtip[0] - p[0], vtip[1] - p[1]);
          // v15: penumbral pawn shadow
          sfSoftEllipse((p[0] + vtip[0]) / 2, (p[1] + vtip[1]) / 2,
                        pw * 0.4 + len / 2, pw * 0.12, ang,
                        0.2 + 0.16 * SF_SUN.day, sfUmbra(len));
        } else {
          ctx.fillStyle = `rgba(0,0,0,${night ? 0.3 : 0.16 + 0.14 * SF_SUN.day})`;
          ctx.beginPath();
          ctx.ellipse(p[0], p[1], pw * 0.4, pw * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
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

/* ---------------- v16: real interiors ----------------
   Door-teleported pawns used to land on a flat brown backdrop. Now each
   interior is a one-point-perspective room, built per venue archetype:
   cafés/shops get a counter, espresso machine, pastry case, menu board,
   pendant lamps and window seats; flats get a sofa, rug, bookshelf,
   floor lamp and sash windows. Physically consistent light: the sky
   through the windows matches the outdoor grade, sun shafts pour in when
   the real solar vector says the facade is lit, lamps glow at civil dusk
   (sfLampsLit), and everyone inside casts a contact shadow. */
const SF_INT_SEED = {};
function sfIntSeed(name){
  if(SF_INT_SEED[name] == null){
    let h = 0;
    for(let k = 0; k < name.length; k++) h = (h * 31 + name.charCodeAt(k)) >>> 0;
    SF_INT_SEED[name] = h % 10000;
  }
  return SF_INT_SEED[name];
}
function sfRenderInterior(cw, ch, v){
  const name = v.inside || 'inside';
  const rec = SF_INTERIORS[name];
  const lab = (rec && rec.label) || '';
  const seed = sfIntSeed(name);
  // venue interiors are registered POIs; flats are anchor rooms (poi:null)
  const shop = rec ? !!rec.poi : /caf|coffee|counter|aisle|salsa|park-edge|bins/i.test(lab + ' ' + name);
  const night = isNight();
  const lamps = sfLampsLit();

  /* --- room shell: one vanishing point centered on the back wall --- */
  const vpx = cw * 0.5, vpy = ch * 0.40;
  const bL = cw * 0.24, bR = cw * 0.76, bT = ch * 0.15, bB = ch * 0.60;
  const wallB = shop ? '#6d5a44' : '#7a6a58';
  const wallT = shop ? '#8a7458' : '#9a8874';
  // ceiling
  const cg = ctx.createLinearGradient(0, 0, 0, bT);
  cg.addColorStop(0, shade(wallT, 0.5)); cg.addColorStop(1, shade(wallT, 0.78));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(cw, 0); ctx.lineTo(bR, bT); ctx.lineTo(bL, bT);
  ctx.closePath(); ctx.fill();
  // side walls (cooler, they face away from the window light)
  for(const sgn of [-1, 1]){
    const g2 = ctx.createLinearGradient(sgn < 0 ? 0 : cw, 0, vpx, 0);
    g2.addColorStop(0, shade(wallB, 0.62)); g2.addColorStop(1, shade(wallB, 0.95));
    ctx.fillStyle = g2;
    ctx.beginPath();
    if(sgn < 0){ ctx.moveTo(0, 0); ctx.lineTo(bL, bT); ctx.lineTo(bL, bB); ctx.lineTo(0, ch); }
    else { ctx.moveTo(cw, 0); ctx.lineTo(bR, bT); ctx.lineTo(bR, bB); ctx.lineTo(cw, ch); }
    ctx.closePath(); ctx.fill();
  }
  // back wall
  const wg = ctx.createLinearGradient(0, bT, 0, bB);
  wg.addColorStop(0, wallT); wg.addColorStop(1, wallB);
  ctx.fillStyle = wg; ctx.fillRect(bL, bT, bR - bL, bB - bT);
  // wainscot band + picture rail (Edwardian flat grammar even in shops)
  ctx.fillStyle = shade(wallB, 0.8);
  ctx.fillRect(bL, bB - (bB - bT) * 0.16, bR - bL, (bB - bT) * 0.16);
  ctx.strokeStyle = shade(wallT, 1.12); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bL, bB - (bB - bT) * 0.16);
  ctx.lineTo(bR, bB - (bB - bT) * 0.16); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,22,14,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bL, bT + (bB - bT) * 0.14);
  ctx.lineTo(bR, bT + (bB - bT) * 0.14); ctx.stroke();
  // floor — planks converge on the vanishing point, cross-seams get
  // denser with depth (perspective foreshortening)
  const fg = ctx.createLinearGradient(0, bB, 0, ch);
  fg.addColorStop(0, '#9a7448'); fg.addColorStop(1, '#6b4a2c');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(bL, bB); ctx.lineTo(bR, bB); ctx.lineTo(cw, ch); ctx.lineTo(0, ch);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(52,34,18,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for(let k = 0; k <= 14; k++){
    const x0 = bL + (bR - bL) * k / 14;
    const x1 = (x0 - vpx) * (ch / Math.max(1, bB - vpy)) + vpx;
    ctx.moveTo(x0, bB); ctx.lineTo(x1, ch);
  }
  for(let k = 1; k <= 6; k++){
    const t = Math.pow(k / 6, 1.55);
    const y = bB + (ch - bB) * t;
    const xl = bL + (0 - bL) * t, xr = bR + (cw - bR) * t;
    ctx.moveTo(xl, y); ctx.lineTo(xr, y);
  }
  ctx.stroke();
  // baseboards + crown molding
  ctx.strokeStyle = shade('#e8dcc8', 0.85); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(bL, bB); ctx.lineTo(bR, bB); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bL, bT); ctx.lineTo(bR, bT); ctx.stroke();

  /* --- windows on the back wall: real sky outside, real sun in --- */
  // sky grade mirrors sfRenderStreet's gradient, same tod/weather
  const wK = SF_SUN.warm;
  const skyAt = (y0, y1) => {
    const g2 = ctx.createLinearGradient(0, y0, 0, y1);
    if(night){ g2.addColorStop(0, '#101626'); g2.addColorStop(1, '#2a3350'); }
    else if(W.rain > 0.2){ g2.addColorStop(0, '#6a7688'); g2.addColorStop(1, '#a8b2bc'); }
    else {
      g2.addColorStop(0, mix('#5b8fc9', '#5a6ea8', wK * 0.65));
      g2.addColorStop(1, mix('#cfe3f2', '#ffc98a', wK * 0.85));
    }
    return g2;
  };
  // sun shafts pour in while direct sun is up; slant follows the sun's
  // world-space east/west bearing so it always agrees with the shadows
  // outside (east sun pushes the beam toward the room's west side)
  const sunIn = !night && SF_SUN.day > 0.22;
  const winRects = [];
  if(shop){
    // storefront glass: one wide front window — you're looking back out
    // at the street you walked in from
    const wx0 = bL + (bR - bL) * 0.08, wx1 = bR - (bR - bL) * 0.08;
    const wy0 = bT + (bB - bT) * 0.10, wy1 = bB - (bB - bT) * 0.24;
    winRects.push([wx0, wy0, wx1, wy1]);
  } else {
    // two double-hung sash windows
    for(const f of [0.14, 0.56]){
      const wx0 = bL + (bR - bL) * f, wx1 = wx0 + (bR - bL) * 0.30;
      const wy0 = bT + (bB - bT) * 0.10, wy1 = wy0 + (bB - bT) * 0.62;
      winRects.push([wx0, wy0, wx1, wy1]);
    }
  }
  for(const [wx0, wy0, wx1, wy1] of winRects){
    ctx.fillStyle = '#efe6d4';
    ctx.fillRect(wx0 - 5, wy0 - 5, wx1 - wx0 + 10, wy1 - wy0 + 10);
    ctx.fillStyle = skyAt(wy0, wy1);
    ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    // street across the way: sidewalk band + facing roofline silhouette
    ctx.fillStyle = night ? '#1c1a20' : 'rgba(60,56,52,0.85)';
    ctx.fillRect(wx0, wy1 - (wy1 - wy0) * 0.22, wx1 - wx0, (wy1 - wy0) * 0.22);
    ctx.fillStyle = night ? '#141220' : 'rgba(96,82,70,0.8)';
    for(let k = 0; k < 3; k++){
      const bx = wx0 + (wx1 - wx0) * phash(k, seed, 1901);
      const bw2 = (wx1 - wx0) * (0.14 + phash(k, seed, 1902) * 0.2);
      const bh = (wy1 - wy0) * (0.16 + phash(k, seed, 1903) * 0.14);
      ctx.fillRect(bx, wy1 - (wy1 - wy0) * 0.22 - bh, bw2, bh);
    }
    if(!shop){ // sash meeting rail + muntins
      ctx.strokeStyle = '#efe6d4'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(wx0, (wy0 + wy1) / 2);
      ctx.lineTo(wx1, (wy0 + wy1) / 2); ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo((wx0 + wx1) / 2, wy0);
      ctx.lineTo((wx0 + wx1) / 2, wy1); ctx.stroke();
    } else { // storefront mullions
      ctx.strokeStyle = 'rgba(28,36,44,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for(let k = 1; k < 4; k++){
        const mx = wx0 + (wx1 - wx0) * k / 4;
        ctx.moveTo(mx, wy0); ctx.lineTo(mx, wy1);
      }
      ctx.stroke();
    }
    // curtain panels on flat windows
    if(!shop){
      ctx.fillStyle = `rgba(226,214,190,${night ? 0.9 : 0.75})`;
      ctx.fillRect(wx0 - 2, wy0 - 2, (wx1 - wx0) * 0.16, wy1 - wy0 + 4);
      ctx.fillRect(wx1 - (wx1 - wx0) * 0.16 + 2, wy0 - 2, (wx1 - wx0) * 0.16, wy1 - wy0 + 4);
    }
    // sun shaft: the window throws a bright parallelogram onto the floor,
    // slanted by the sun's horizontal bearing, fading with distance
    if(sunIn){
      const slant = clamp(SF_SUN.toX, -1, 1) * (wx1 - wx0) * 0.9;
      const drop = (ch - wy1) * 0.6;
      const sg = ctx.createLinearGradient(0, wy1, 0, wy1 + drop);
      sg.addColorStop(0, `rgba(255,238,190,${0.42 * SF_SUN.day})`);
      sg.addColorStop(1, 'rgba(255,238,190,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(wx0, wy1); ctx.lineTo(wx1, wy1);
      ctx.lineTo(wx1 + slant, wy1 + drop); ctx.lineTo(wx0 + slant, wy1 + drop);
      ctx.closePath(); ctx.fill();
      // dust motes hanging in the beam
      ctx.fillStyle = `rgba(255,244,210,${0.5 * SF_SUN.day})`;
      const bucket = Math.floor(SF_WX.t * 6);
      for(let k = 0; k < 10; k++){
        const mx = wx0 + hash2(k, bucket, seed + 1905) * (wx1 - wx0) +
                   slant * hash2(k, 3, seed + 1906) * 0.6;
        const my = wy1 + hash2(k, bucket + 41, seed + 1907) * drop;
        ctx.fillRect(mx, my, 1.6, 1.6);
      }
    }
  }

  /* --- furniture, per archetype --- */
  const lampGlow = lamps || night;
  if(shop){
    // back-bar shelves with cups/jars
    for(let s = 0; s < 2; s++){
      const sy = bT + (bB - bT) * (0.16 + s * 0.12);
      const sx0 = bL + (bR - bL) * 0.10, sx1 = sx0 + (bR - bL) * 0.26;
      ctx.fillStyle = '#4a3626'; ctx.fillRect(sx0, sy, sx1 - sx0, 4);
      for(let k = 0; k < 6; k++){
        ctx.fillStyle = ['#c9b89a', '#8a5a3a', '#5a7a8a', '#d8d0c0'][k % 4];
        ctx.fillRect(sx0 + 4 + k * (sx1 - sx0 - 8) / 6, sy - 8, 6, 8);
      }
    }
    // menu board
    const mx0 = bR - (bR - bL) * 0.34, my0 = bT + (bB - bT) * 0.10;
    ctx.fillStyle = '#2a2620';
    ctx.fillRect(mx0, my0, (bR - bL) * 0.24, (bB - bT) * 0.34);
    ctx.strokeStyle = '#d8cba8'; ctx.lineWidth = 2;
    ctx.strokeRect(mx0, my0, (bR - bL) * 0.24, (bB - bT) * 0.34);
    ctx.strokeStyle = 'rgba(230,220,190,0.7)'; ctx.lineWidth = 1;
    for(let k = 0; k < 4; k++){
      ctx.beginPath();
      ctx.moveTo(mx0 + 8, my0 + 10 + k * 11);
      ctx.lineTo(mx0 + (bR - bL) * 0.24 - 8 - phash(k, seed, 1910) * 30, my0 + 10 + k * 11);
      ctx.stroke();
    }
    // the counter: front face + lighter top, espresso machine + pastry case
    const cx0 = cw * 0.52, cx1 = cw * 0.94, cy0 = ch * 0.62, cy1 = ch * 0.80;
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
    ctx.fillStyle = '#8a6a45'; ctx.fillRect(cx0 - 8, cy0 - 10, cx1 - cx0 + 16, 12);
    ctx.fillStyle = '#c8b490'; ctx.fillRect(cx0 - 8, cy0 - 10, cx1 - cx0 + 16, 3);
    // espresso machine silhouette
    ctx.fillStyle = '#2c2c30';
    ctx.fillRect(cx0 + 14, cy0 - 46, 54, 38);
    ctx.fillStyle = '#b8bcc4'; ctx.fillRect(cx0 + 20, cy0 - 40, 42, 8);
    ctx.fillStyle = '#d8a44a'; ctx.fillRect(cx0 + 24, cy0 - 24, 8, 10);
    // pastry case: glass dome over warm crumb
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(cx1 - 78, cy0 - 20, 60, 10);
    ctx.fillStyle = 'rgba(210,228,240,0.5)';
    ctx.beginPath(); ctx.ellipse(cx1 - 48, cy0 - 20, 30, 14, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e0b060';
    ctx.beginPath(); ctx.ellipse(cx1 - 48, cy0 - 22, 22, 8, 0, Math.PI, 0); ctx.fill();
    // cafe tables + chairs between camera and counter
    for(let k = 0; k < 2; k++){
      const tx = cw * (0.16 + k * 0.18), ty = ch * (0.78 + k * 0.06);
      const tr = cw * 0.055;
      ctx.fillStyle = 'rgba(20,14,8,0.35)';
      ctx.beginPath(); ctx.ellipse(tx, ty + tr * 0.5, tr * 1.1, tr * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(tx - 3, ty, 6, tr * 0.9);
      ctx.fillStyle = '#d8cba8';
      ctx.beginPath(); ctx.ellipse(tx, ty, tr, tr * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a45'; ctx.lineWidth = 2; ctx.stroke();
      for(const cs of [-1, 1]){ // chairs
        ctx.fillStyle = '#4a3626';
        ctx.fillRect(tx + cs * tr * 1.35 - 6, ty - 14, 12, 26);
      }
    }
  } else {
    // flat: rug, sofa, bookshelf, floor lamp, framed art, sill plant
    ctx.fillStyle = shop ? '#7a4a3a' : '#8a4a42';
    ctx.beginPath(); ctx.ellipse(vpx, ch * 0.82, cw * 0.16, ch * 0.075, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5e342e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(vpx, ch * 0.82, cw * 0.13, ch * 0.058, 0, 0, Math.PI * 2); ctx.stroke();
    // sofa against the left wall
    const sox = cw * 0.10, soy = ch * 0.66;
    ctx.fillStyle = 'rgba(20,14,8,0.35)';
    ctx.beginPath(); ctx.ellipse(sox + 60, soy + 66, 72, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a6a58';
    ctx.fillRect(sox, soy, 120, 56);
    ctx.fillStyle = '#6d7e6a'; ctx.fillRect(sox, soy - 22, 120, 26);
    ctx.fillStyle = '#4a5848';
    ctx.fillRect(sox, soy + 20, 12, 36); ctx.fillRect(sox + 108, soy + 20, 12, 36);
    ctx.fillStyle = '#c9a86a'; ctx.fillRect(sox + 16, soy - 14, 26, 18);
    ctx.fillStyle = '#a85a5a'; ctx.fillRect(sox + 76, soy - 14, 26, 18);
    // bookshelf right
    const bsx = cw * 0.80, bsy = ch * 0.42, bsw = cw * 0.14, bsh = ch * 0.34;
    ctx.fillStyle = '#4a3423'; ctx.fillRect(bsx, bsy, bsw, bsh);
    for(let s = 0; s < 4; s++){
      const sy = bsy + 12 + s * (bsh - 20) / 4;
      ctx.fillStyle = '#3a281a'; ctx.fillRect(bsx + 5, sy, bsw - 10, 3);
      for(let k = 0; k < 9; k++){
        const bh2 = 12 + phash(k, s, seed + 1915) * 10;
        ctx.fillStyle = ['#8a4a3a', '#3a5a7a', '#7a8a4a', '#b0905a', '#5a4a7a'][Math.floor(phash(k, s, seed + 1916) * 5)];
        ctx.fillRect(bsx + 8 + k * (bsw - 16) / 9, sy - bh2 + 2, (bsw - 16) / 11, bh2);
      }
    }
    // framed pictures on the back wall
    for(let k = 0; k < 2; k++){
      const fx = bL + (bR - bL) * (0.06 + k * 0.82), fy = bT + (bB - bT) * 0.16;
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(fx, fy, 44, 56);
      ctx.fillStyle = ['#7a9ab0', '#b0785a'][k];
      ctx.fillRect(fx + 4, fy + 4, 36, 48);
    }
    // floor lamp with a lit cone at dusk
    const lx = cw * 0.32, ly = ch * 0.60;
    ctx.fillStyle = '#2c241c'; ctx.fillRect(lx - 2, ly - 60, 4, 62);
    ctx.fillStyle = lampGlow ? '#f0d8a0' : '#c8b890';
    ctx.beginPath(); ctx.moveTo(lx - 16, ly - 58); ctx.lineTo(lx + 16, ly - 58);
    ctx.lineTo(lx + 10, ly - 78); ctx.lineTo(lx - 10, ly - 78); ctx.closePath(); ctx.fill();
    if(lampGlow){
      const lg = ctx.createRadialGradient(lx, ly - 62, 4, lx, ly - 62, 90);
      lg.addColorStop(0, 'rgba(255,214,140,0.4)');
      lg.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = lg; ctx.fillRect(lx - 90, ly - 150, 180, 180);
    }
    // plant on the floor by the window
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(bL + 14, bB - 4, 20, 16);
    ctx.fillStyle = '#3e7a34';
    for(let k = 0; k < 5; k++)
      paBlob(ctx, bL + 24 + Math.cos(k * 1.3) * 10, bB - 14 - k * 5, 7, k % 2 ? '#3e7a34' : '#2e5a24');
  }
  // pendant lamps: cord + shade + warm pool when lit (cafés keep them on
  // all day; flats light them at dusk)
  const nPend = shop ? 3 : 1;
  for(let k = 0; k < nPend; k++){
    const px = cw * (nPend === 1 ? 0.5 : 0.3 + k * 0.2);
    const py = ch * 0.30;
    ctx.strokeStyle = '#241c14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, py); ctx.stroke();
    ctx.fillStyle = shop ? '#3a5a4a' : '#7a6a58';
    ctx.beginPath(); ctx.moveTo(px - 12, py); ctx.lineTo(px + 12, py);
    ctx.lineTo(px + 7, py - 12); ctx.lineTo(px - 7, py - 12); ctx.closePath(); ctx.fill();
    if(lampGlow || shop){
      const a = lampGlow ? 0.5 : 0.18;
      const lg = ctx.createRadialGradient(px, py + 6, 2, px, py + 6, 60);
      lg.addColorStop(0, `rgba(255,208,130,${a})`);
      lg.addColorStop(1, 'rgba(255,208,130,0)');
      ctx.fillStyle = lg; ctx.fillRect(px - 60, py - 30, 120, 150);
      ctx.fillStyle = `rgba(255,230,170,${a + 0.2})`;
      ctx.beginPath(); ctx.arc(px, py + 3, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* --- occupants: other pawns inside the same venue, sorted by depth --- */
  const inside = [];
  for(const o of VILLAGERS)
    if(o.inBuilding && o.inside === name && o !== v) inside.push(o);
  let k = 0;
  for(const o of inside.slice(0, 4)){
    const u = 0.2 + phash(k, seed, 1920) * 0.6;
    const fy = ch * (0.60 + phash(k, seed, 1921) * 0.18);
    const fx = bL + (bR - bL) * u;
    const sc = 0.62 + (fy / ch - 0.6) * 1.6;  // deeper = smaller
    const F3 = PA.chars && PA.chars[o._ci != null ? o._ci : 0];
    const fr = F3 && F3[0] && (paActFrame(F3, 0, o, G.frame) || F3[0].idle[0]);
    if(fr){
      const pw = 72 * sc, ph2 = 96 * sc;
      ctx.fillStyle = 'rgba(16,10,6,0.4)';
      ctx.beginPath(); ctx.ellipse(fx, fy + 2, pw * 0.42, pw * 0.13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(fr, fx - pw / 2, fy - ph2, pw, ph2);
    }
    k++;
  }
  // the followed pawn, front and center, grounded on the floorboards
  const F2 = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  if(F2 && F2[0]){
    const fr = paActFrame(F2, 0, v, G.frame) || F2[0].idle[0];
    if(fr){
      const fy = ch * 0.86;
      ctx.fillStyle = 'rgba(16,10,6,0.45)';
      ctx.beginPath(); ctx.ellipse(cw / 2, fy + 2, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(fr, cw / 2 - 36, fy - 96, 72, 96);
    }
  }
  // location card
  ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
  const tw = Math.max(ctx.measureText(name).width, ctx.measureText(lab).width);
  ctx.fillStyle = 'rgba(12,10,8,0.72)';
  ctx.fillRect(cw / 2 - tw / 2 - 14, ch * 0.045, tw + 28, 44);
  ctx.strokeStyle = 'rgba(230,210,170,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(cw / 2 - tw / 2 - 14, ch * 0.045, tw + 28, 44);
  ctx.fillStyle = '#f8f4e8';
  ctx.fillText(name, cw / 2, ch * 0.045 + 18);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#d8c8b0';
  ctx.fillText(lab, cw / 2, ch * 0.045 + 34);
}
