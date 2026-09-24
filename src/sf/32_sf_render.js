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
  marks: {},         // v27: saved director shots — Shift+1..9 sets, 1..9 recalls
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

/* v62: the top view is a REAL aerial camera now, not an orthographic map.
   A virtual platform flies SF_TOP_ALT_M meters over the map nadir at
   screen center. Height above the ground plane displaces a point
   radially outward from the nadir by r·h/H — true relief displacement,
   the same optics that make rooftops lean away from the center of an
   aerial photograph. Buildings lean more toward the frame edges, taller
   masses lean farther, and zooming out widens the view so the lean
   grows — a real camera, not a stylistic tilt.
   sfTopLean returns the affine [shearX, scaleYdelta] for
   ctx.transform(1, 0, a, 1+b, 0, 0) about an object's ground anchor;
   sfTopLeanShift returns the screen-px displacement of a point hPx
   (world px) above ground at (wx, wy) — for labels and crown furniture. */
const SF_TOP_ALT_M = 240;
function sfTopLean(wx, wy, ax, ay){
  const H = SF_TOP_ALT_M * SF_PXM;
  // clamp the slope: at extreme wide views the far edge would otherwise
  // shear past the physical silhouette the bake can support
  const a = clamp(-(wx - cam.x) / H, -0.32, 0.32);
  const b = clamp(-(wy - cam.y) * SF_TILT / H, -0.32, 0.32);
  if(Math.abs(a) < 0.002 && Math.abs(b) < 0.002) return false;
  ctx.translate(ax, ay);
  ctx.transform(1, 0, a, 1 + b, 0, 0);
  ctx.translate(-ax, -ay);
  return true;
}
function sfTopLeanShift(wx, wy, hPx){
  const H = SF_TOP_ALT_M * SF_PXM;
  return [clamp((wx - cam.x) / H, -0.32, 0.32) * hPx * cam.zoom,
          clamp((wy - cam.y) * SF_TILT / H, -0.32, 0.32) * hPx * cam.zoom];
}
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
  if(e.code === 'KeyL'){
    SF_LENS.on = !SF_LENS.on;
    if(typeof showToast === 'function')
      showToast(SF_LENS.on ? '◎ LENS rig — tilt-shift / depth of field'
                           : 'Lens rig off — raw render');
  }
  // v27: G = cutaway (ghost whatever blocks the lens from the subject),
  //      T = track (director aims at the inspected pawn),
  //      Shift+1..9 stores a shot mark, 1..9 recalls it
  if(e.code === 'KeyG' && SF_VIEW === 'street'){
    SF_CUT.on = !SF_CUT.on;
    if(typeof showToast === 'function')
      showToast(SF_CUT.on ? '◈ CUTAWAY — occluding walls ghost out'
                          : 'Cutaway off — solid walls');
  }
  if(e.code === 'KeyT' && SF_VIEW === 'street' && SF_CAM.director){
    const vt = VILLAGERS[inspectedPawnIdx];
    if(vt){
      const txm = vt.x / SF_PXM, tym = vt.y / SF_PXM;
      const dxm = txm - SF_CAM.x, dym = tym - SF_CAM.y;
      SF_CAM.yaw = Math.atan2(dym, dxm);
      SF_CAM.pitch = clamp(-Math.atan2(Math.max(0.4, SF_CAM.h - 1.4),
                          Math.max(2, Math.hypot(dxm, dym))), -0.9, 0.9);
      sfCamSnap();
      if(typeof showToast === 'function') showToast('◎ TRACK — lens on subject');
    }
  }
  if(/^Digit[1-9]$/.test(e.code) && SF_VIEW === 'street'){
    const n = +e.code.slice(5);
    if(e.shiftKey) sfCamMarkSave(n); else sfCamMarkGo(n);
  }
  // v68: P = picture-in-picture — cycles the parked rig feeds
  //      (rooftop cam -> overlook cam -> street cam -> off)
  if(e.code === 'KeyP' && typeof sfCamPipCycle === 'function'){
    const st = sfCamPipCycle();
    if(typeof showToast === 'function')
      showToast(st ? `▣ ${st}` : 'Picture-in-picture off');
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
    '<span><kbd>WASD</kbd> Fly camera</span>' +
    '<span><kbd>R</kbd>/<kbd>F</kbd> Up/Down</span>' +
    '<span><kbd>L</kbd> Lens</span>' +
    '<span><kbd>G</kbd> Cutaway</span>' +
    '<span><kbd>T</kbd> Track</span>' +
    '<span><kbd>1-9</kbd> Marks</span>';
  /* v54: spectator UI realignment — this is a broadcast console, never a
     game HUD. No element may imply the viewer can BE someone in the
     world: the title is the show's name, Take Control is gone entirely
     (the C1–C8 possession ban is absolute), and the only action channel
     offered is a request into the REQUESTS tab. */
  if(typeof document.querySelector === 'function'){
    const ttl = document.querySelector('#top .title');
    if(ttl) ttl.textContent = 'REAL WORLD · THE MISSION';
  }
  const tgl = document.getElementById('btn-toggle-ctrl');
  if(tgl) tgl.style.display = 'none';
  const acts = typeof document.querySelector === 'function' &&
             document.querySelector('.pi-actions');
  if(acts && !document.getElementById('btn-make-req')){
    acts.insertAdjacentHTML('beforeend',
      '<button class="btn" id="btn-make-req" title="Send a request into the world">✉ Request</button>');
    document.getElementById('btn-make-req').onclick = () => {
      const tb = document.querySelector('#rwTabs button[data-t="req"]');
      if(tb) tb.click();
    };
  }
}

/* ---------------- v26: LENS — camera post-processing rig -------------
   The SF views no longer paint straight to the screen: the scene renders
   into an offscreen frame, then finishes through a physical lens model.

   v67: the rig is re-founded on air, not glass. The fake camera-artifact
   stack (lateral chromatic aberration, scanline DOF/tilt-shift blur,
   film grain) is RETIRED — in the real world it is the atmosphere that
   softens a scene, and the sim already scatters light physically
   (sfHazeA aerial perspective on far geometry, Karl's tongue/wall,
   rain veils). What remains are effects whose cause exists in the sim:

   · sun ghosts + anamorphic streak — only while the true sun disc is
     actually in the gate (SF_LENS.sunOn/sunK, published by the sky pass)
   · veiling glare — a blurred plate screen-composited back only when
     the sun is in frame (built on demand)
   · rain droplets — bead on the front element while W.rain is falling
   · split-tone grade keyed to the real solar warmth + a soft vignette
   · dutch roll while the camera pans

   L toggles the rig. The still-frame cache still works — it now caches
   the pre-lens frame, and the lens pass itself is ~3 canvas blits. */
const SF_LENS = { on: true, mode: 'flat', horizon: 0, camHF: 1, foc: 24,
                  frame: null, fg: null, blur: null, bg: null,
                  noise: null, pat: null, saveCtx: null };
/* v51: world-space lens position, published once per street frame so any
   painter can answer view-dependent light questions (specular glass) —
   a glint is a property of the eye, not of the wall. */
const SF_EYE = { x: 0, y: 0, h: 1.7 };
/* Redirect the global ctx at the SF frame. All sf painters draw through
   `ctx`, so the whole pipeline — including the still-frame cache, which
   snapshots ctx.canvas — works unchanged inside the frame. */
function sfLensBegin(cw, ch){
  SF_LENS.mode = 'flat';      // renderers upgrade this while they paint
  SF_LENS.sunOn = false;      // v27: street renderer re-publishes each frame
  if(!SF_LENS.on || typeof document === 'undefined' || !ctx) return false;
  const W = Math.max(2, Math.round(cw * dpr)), H = Math.max(2, Math.round(ch * dpr));
  if(!SF_LENS.frame){
    SF_LENS.frame = document.createElement('canvas');
    SF_LENS.fg = SF_LENS.frame.getContext('2d');
    SF_LENS.blur = document.createElement('canvas');
    SF_LENS.bg = SF_LENS.blur.getContext('2d');
  }
  if(SF_LENS.frame.width !== W || SF_LENS.frame.height !== H){
    SF_LENS.frame.width = W; SF_LENS.frame.height = H;
    SF_LENS.blur.width = W; SF_LENS.blur.height = H;
    SF_LENS.pat = null;
  }
  SF_LENS.saveCtx = ctx;
  ctx = SF_LENS.fg;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}
function sfLensEnd(cw, ch){
  const g = SF_LENS.fg;
  ctx = SF_LENS.saveCtx;                 // back to the real canvas
  if(!g || !ctx) return;
  const F = SF_LENS.frame, B = SF_LENS.blur, bg = SF_LENS.bg;
  const W = F.width, H = F.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);    // device pixels
  ctx.imageSmoothingEnabled = true;
  // v36: dutch roll — pan-rate cants the gate a fraction of a degree;
  // settled cameras roll to zero so locked shots stay level
  if(SF_LENS.roll && Math.abs(SF_LENS.roll) > 0.0004){
    ctx.translate(W / 2, H / 2); ctx.rotate(SF_LENS.roll);
    ctx.drawImage(F, -W / 2, -H / 2);
    ctx.rotate(-SF_LENS.roll); ctx.translate(-W / 2, -H / 2);
  } else {
    /* v67: the plate lands clean — the camera-artifact stack (chromatic
       aberration, scanline DOF/tilt-shift, film grain) is gone. In a real
       atmosphere it is the AIR that softens a scene, not the glass:
       humidity, the marine layer and rain already scatter light in-world
       (sfHazeA on every far facade, Karl's tongue and wall, the horizon
       band). The frame now stays optically honest so those physically-
       driven effects are the only softening the eye ever sees. */
    ctx.drawImage(F, 0, 0);
  }
  /* v27: lens ghosts — internal element reflections of the sun disc.
     Real ghosts mirror about the optical center: each ghost sits on the
     sun→center axis at growing t, alternating aperture shapes (filled
     disc / hexagon ring) and warm/cool tints. The anamorphic streak is
     the horizontal smear a cylindrical element throws across the gate.
     Everything scales with sunK — no sun in frame, no flare. */
  if(SF_LENS.mode === 'street' && SF_LENS.sunOn && SF_LENS.sunK > 0.05){
    const sx = SF_LENS.sunX * dpr, sy = SF_LENS.sunY * dpr;
    const cxp = W / 2, cyp = H * 0.46, k = SF_LENS.sunK;
    const st = ctx.createLinearGradient(sx - W * 0.42, 0, sx + W * 0.42, 0);
    st.addColorStop(0, 'rgba(130,185,255,0)');
    st.addColorStop(0.5, `rgba(170,205,255,${0.11 * k})`);
    st.addColorStop(1, 'rgba(130,185,255,0)');
    ctx.fillStyle = st;
    ctx.fillRect(sx - W * 0.42, sy - 1.6 * dpr, W * 0.84, 3.2 * dpr);
    const hues = ['255,196,120', '150,205,255', '205,170,255',
                  '255,160,140', '170,235,205'];
    for(let i = 0; i < 5; i++){
      const t = 0.38 + i * 0.42;
      const gx = cxp + (cxp - sx) * t, gy = cyp + (cyp - sy) * t;
      const gr = (7 + i * 9 + (i === 2 ? 14 : 0)) * dpr;
      const ga = (0.13 - i * 0.016) * k;
      if(i % 2){
        ctx.strokeStyle = `rgba(${hues[i]},${ga})`;
        ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath();
        for(let a2 = 0; a2 < 6; a2++){
          const an = a2 * Math.PI / 3 + 0.4;
          const hx = gx + Math.cos(an) * gr, hy = gy + Math.sin(an) * gr;
          a2 ? ctx.lineTo(hx, hy) : ctx.moveTo(hx, hy);
        }
        ctx.closePath(); ctx.stroke();
      } else {
        const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        gg.addColorStop(0, `rgba(${hues[i]},${ga})`);
        gg.addColorStop(1, `rgba(${hues[i]},0)`);
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.fill();
      }
    }
    /* v36: veiling glare — a strong source near the axis fogs the whole
       frame. The blurred plate screen-composited back over itself lifts
       the blacks and blooms the highlights; strength follows sunK, so
       the glare fades exactly as the disc leaves the gate.
       v67: the plate is built on demand — it only exists while the sun
       is in the gate, so clear off-axis frames pay nothing. */
    if(B && typeof bg.filter !== 'undefined'){
      const R = Math.max(3, Math.round(H * 0.007));
      bg.setTransform(1, 0, 0, 1, 0, 0);
      bg.clearRect(0, 0, W, H);
      bg.filter = `blur(${R}px)`;
      bg.drawImage(F, 0, 0);
      bg.filter = 'none';
      ctx.globalCompositeOperation = 'screen';
      // v56: glare falls off quadratically — a dry clear afternoon stays
      // crisp off-axis instead of the whole frame milking over
      ctx.globalAlpha = 0.02 + 0.11 * SF_LENS.sunK * SF_LENS.sunK;
      ctx.drawImage(B, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }
  /* v36: rain on the front element — droplets bead on the outer glass,
     so they sit in FIXED screen space (on the lens, not in the world),
     bead-shadowed with a caustic glint toward the sun's side, and creep
     downward at droplet speeds while it's actually raining. */
  {
    const rainK = (SF_LENS.mode === 'street' && typeof W !== 'undefined')
      ? clamp(W.rain, 0, 1) : 0;
    if(rainK > 0.12){
      const nD = Math.floor(6 + rainK * 14);
      for(let i = 0; i < nD; i++){
        const rx = phash(i, 1, 3890) * W;
        const slide = (2 + phash(i, 5, 3894) * 9) * dpr;
        const ry = (phash(i, 2, 3891) * H + SF_WX.t * slide) % (H + 40 * dpr) - 20 * dpr;
        const rr = (3 + phash(i, 3, 3892) * 10) * dpr;
        const a = (0.10 + 0.14 * phash(i, 4, 3893)) * rainK;
        const g2 = ctx.createRadialGradient(rx, ry, rr * 0.2, rx, ry, rr);
        g2.addColorStop(0, `rgba(200,215,230,${a * 0.7})`);
        g2.addColorStop(0.75, `rgba(30,40,55,${a * 0.35})`);
        g2.addColorStop(1, 'rgba(30,40,55,0)');
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.fill();
        const sunS = SF_LENS.sunOn ? Math.sign(SF_LENS.sunX * dpr - rx) : 0.4;
        ctx.fillStyle = `rgba(255,250,235,${Math.min(0.5, a * 1.4)})`;
        ctx.beginPath();
        ctx.arc(rx + sunS * rr * 0.35, ry - rr * 0.3, rr * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  /* v27: split-tone film grade — cool multiply lift in the shadows,
     warm screen bloom in the highlights, deepened as the real sun drops
     toward the horizon (SF_SUN.warm). The physical cause is the same
     solar vector every shadow already obeys. */
  {
    const warmK = typeof SF_SUN !== 'undefined' ? SF_SUN.warm : 0;
    const nK = typeof isNight === 'function' && isNight();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = nK ? 'rgba(215,225,255,0.16)' : 'rgba(233,240,255,0.09)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255,182,110,${nK ? 0.02 : 0.05 + warmK * 0.09})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
  // lens vignette — light falls off toward the corners of the frame.
  // v67: eased back now that the plate is clean — a gentle natural-
  // light falloff, not a murk layer hiding grain.
  const vr = Math.hypot(W, H) * 0.62;
  const vg = ctx.createRadialGradient(W / 2, H / 2, vr * 0.52,
                                      W / 2, H / 2, vr);
  vg.addColorStop(0, 'rgba(8,6,4,0)');
  vg.addColorStop(1, 'rgba(8,6,4,0.20)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
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
    return mix(shade(base, lit), '#ffdd9e', SF_SUN.warm * 0.58 * Math.min(1, k));
  return mix(shade(base, lit), '#7183a4', 0.22 * (1 - Math.max(0, k) * SF_SUN.day));
}
/* ---------------- v32: the Mediterranean turf calendar ----------------
   The Mission gets ~0mm of rain from June to October — lawn turf cures
   to gold through the dry season and greens again with the winter
   storms. sfDrySeason is a pure function of the simulated month; the
   cure lands patchy (sfGrassDry hashes per cell) and the irrigated
   fringe along paths and park-edge sidewalks stays green longest. */
function sfDrySeason(){
  const mo = (typeof W !== 'undefined' && W.month) ||
             ({ Winter: 1, Spring: 4, Summer: 7, Autumn: 10 })[W.season] || 9;
  return clamp(1 - Math.abs(mo - 9) / 3.4, 0, 1);   // peaks ~September
}
function sfGrassDry(wx, wy){
  const d = sfDrySeason();
  if(d <= 0.02) return 0;
  const irrig = (sfTile(wx, wy - 1) === 15 || sfTile(wx, wy + 1) === 15 ||
                 sfTile(wx - 1, wy) === 15 || sfTile(wx + 1, wy) === 15 ||
                 sfTile(wx, wy - 1) === 11 || sfTile(wx, wy + 1) === 11 ||
                 sfTile(wx - 1, wy) === 11 || sfTile(wx + 1, wy) === 11)
                ? 0.55 : 1;
  return d * irrig * (0.35 + 0.65 * phash(wx, wy, 3820));
}
/* ---------------- v55: THE TURNING — the leaf-fall calendar ------------
   SF autumn is real but patchy: the ginkgos and liquidambars on the
   streets go gold while the park's evergreen mass stays green, and the
   exposed crowns on the open lawn turn first (radiation chill + wind
   stress). sfFallTurn is pure in the sim month (peak ~late Oct);
   sfTreeTurns decides per-prop whether THIS crown went — deterministic
   so sprites, shadows, litter and both cameras all agree. Palms and
   cypress are evergreen and never turn. */
function sfFallTurn(){
  const mo = (typeof W !== 'undefined' && W.month) ||
             ({ Winter: 1, Spring: 4, Summer: 7, Autumn: 10 })[W.season] || 9;
  return clamp(1 - Math.abs(mo - 10.5) / 3.0, 0, 1);
}
function sfTreeTurns(o){
  return phash(o.wx, o.wy, 5520) < sfFallTurn() * (o.big ? 0.62 : 0.45);
}
/* mow-stripe band: the ride-on mower follows the slope, so passes run
   along elevation contours — alternating light/dark bands ~2.5m tall */
function sfMowBand(wx, wy){
  return Math.floor(sfElevM((wx + 0.5) * SF_M.cell_m,
                            (wy + 0.5) * SF_M.cell_m) / 1.25) & 1;
}
/* ---------------- v23: street-canyon sun occlusion ----------------
   The Mission's signature light: a low sun fires down the street grid,
   so the row on the sunward side throws the whole canyon into shade
   while the facades opposite still catch gold. sfBldAtM resolves the
   building under a meter-space point via the chunk index + even-odd
   polygon test; sfCanyonShade marches a ray from a surface point toward
   the sun and returns the height (m) up to which a neighboring mass
   shadows it — 0 means open sky. */
function sfBldAtM(xm, ym){
  const cm = SF_M.cell_m;
  const lst = SF_BLD_GRID.get(Math.floor(xm / (CHN * cm)) + ',' +
                              Math.floor(ym / (CHN * cm)));
  if(!lst) return -1;
  const px = xm * SF_PXM, py = ym * SF_PXM;
  for(const bi of lst){
    const b = SF_BLD[bi];
    if(px < b.bx0 || px > b.bx1 || py < b.by0 || py > b.by1) continue;
    if(sfPtInPoly(b.px, px, py)) return bi;
  }
  return -1;
}
function sfCanyonShade(xm, ym, selfI){
  if(SF_SUN.day < 0.08) return 0;
  const tanEl = Math.tan(Math.max(0.02, SF_SUN.el));
  const maxD = Math.min(80, 30 / tanEl);   // a 30m mass caps the reach
  // v39: occluder tops are ABSOLUTE heights — a mass sitting uphill on
  // the landform throws a taller shadow over a downhill probe, and a
  // downhill mass throws less. Same physics the landform pass claims.
  const zProbe = sfElevM(xm, ym);
  let zs = 0;
  for(let s = 3; s < maxD; s += 3){
    const ox = xm + SF_SUN.toX * s, oy = ym + SF_SUN.toY * s;
    const bi = sfBldAtM(ox, oy);
    if(bi < 0 || bi === selfI) continue;
    const z = SF_BLD[bi].hPx / 4.2 + (sfElevM(ox, oy) - zProbe) - s * tanEl;
    if(z > zs){ zs = z; if(zs > 26) break; }
  }
  return zs;
}
/* v39: wire -> facade shadow solver. A conductor point W at height wz
   (the v20 catenary spans ride ~7m) casts along the sun ray; where that
   ray lands on a wall plane — segment A + u·û over L meters, outward
   normal n̂ — it leaves the thin line every Mission facade wears under
   the pole runs. Returns {u, z, s} (wall param, shadow height, throw)
   or null when the ray misses the wall or the wall faces away. */
function sfWireShadow(wx, wy, wz, x1, y1, ux, uy, nx, ny, L){
  const dn = -(SF_SUN.toX * nx + SF_SUN.toY * ny);
  if(dn > -0.02) return null;               // wall faces away from sun
  const s = ((x1 - wx) * nx + (y1 - wy) * ny) / dn;
  if(s < 0.3 || s > 60) return null;        // wall sits on the lit side
  const hx = wx - SF_SUN.toX * s, hy = wy - SF_SUN.toY * s;
  const u = ((hx - x1) * ux + (hy - y1) * uy) / L;
  const z = wz - s * Math.tan(Math.max(0.02, SF_SUN.el));
  return { u, z, s };
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
  // v42: a cast shadow is not darkness — it is the skylight alone. On a
  // clear afternoon the umbra fills with cool blue airlight; only at
  // night or under a closed deck does it fall back to neutral dark.
  const sky = isNight() ? 0 : SF_SUN.day;
  const sr = Math.round(18 + (24 - 18) * sky),
        sg2 = Math.round(15 + (34 - 15) * sky),
        sb = Math.round(8 + (62 - 8) * sky);
  g2.addColorStop(0, `rgba(${sr},${sg2},${sb},${a})`);
  g2.addColorStop(1, `rgba(${sr},${sg2},${sb},0)`);
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
/* v53: Dolores lawn occupancy — how much of the picnic-blanket pool is
   in use right now. A warm clear afternoon packs the slope (the real
   park fills to the paths on a sunny Saturday); rain, wet grass, Karl
   cover, early morning, and night thin it out. Pure in the sim state —
   same answer from every camera and every frame. */
function sfPicnicFill(){
  if(isNight()) return 0;
  const warm = clamp((W.temp - 9) / 16, 0, 1);             // cold lawn empties
  const sunF = clamp(SF_SUN.day * 1.9 + 0.1, 0, 1);        // overcast keeps some
  const hourF = W.tod < 9 ? 0.05 : W.tod < 11 ? 0.45 :
                W.tod < 19 ? 1 : W.tod < 20.5 ? 0.5 : 0.08;
  const wetF = 1 - Math.min(1, W.rain * 1.6 + (SF_WX.wet > 0.55 ? 0.65 : 0) +
                            (SF_WX.cover || 0) * 0.12);
  return clamp(0.9 * warm * (0.45 + 0.55 * sunF) * hourF * wetF, 0, 0.92);
}
function sfPicnicOn(o){
  return phash(o.wx, o.wy, 5340) < sfPicnicFill();
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
/* ---------------- v69: canopy dapple --------------------------------
   Foliage is a sieve, not a slab. Each leaf gap acts as a pinhole and
   projects a soft disc of UNFILTERED sun inside the shade pool; the disc
   rides the same throw vector as the shadow and stretches the same way
   (a round gap images the sun elongated by cot(el) on the ground plane).
   Flecks skate as the crown sways on the gust envelope. No direct beam —
   a cloud overhead or the pool inside a building's canyon shade — means
   no dapple: skylight alone is diffuse and draws no flecks. */
function sfLeafGapK(kind, o){   // canopy transmittance by species
  if(kind === 'sfTree') return o && o.big ? 1.0 : 0.85;
  if(kind === 'sfStreetTree') return o && o.v === 0 ? 0.9 : 0.7;
  if(kind === 'sfPalm') return 0.55;    // fronds sieve hard
  if(kind === 'sfCypress') return 0.3;  // dense hedge foliage
  return 0;
}
function sfDapple(cx, cy, rx, ry, rot, seed, a){
  if(a <= 0.015 || rx < 3 || ry < 1.5) return;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(rot || 0);
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
  const n = Math.max(4, Math.min(14, Math.round(rx * ry / 150)));
  ctx.globalCompositeOperation = 'lighter';   // flecks ADD light, not paint
  const wG = Math.round(234 - 34 * SF_SUN.warm),
        wB = Math.round(186 - 70 * SF_SUN.warm);
  for(let i = 0; i < n; i++){
    const h1 = hash2(seed + i * 13, i * 7 + 1, 6901),
          h2 = hash2(seed - i * 17, i * 11 + 3, 6902),
          h3 = hash2(seed + i * 29, i * 5 + 2, 6903);
    const fx = (h1 * 2 - 1) * rx * 0.82, fy = (h2 * 2 - 1) * ry * 0.82;
    if(fx * fx / (rx * rx) + fy * fy / (ry * ry) > 0.9) continue;
    // gust jitter — the crown sways and every fleck skates with it
    const jx = (Math.sin(SF_WX.t * 1.4 + seed + i * 1.7) * 0.9 +
                Math.sin(SF_WX.t * 4.3 + i * 2.3) * 0.35) *
               SF_WX.gust * Math.min(6, rx * 0.06);
    const fr = Math.max(1.3, (0.12 + h3 * 0.2) * Math.min(rx, ry * 2.5) *
               (0.8 + SF_WX.gust * 0.25));
    const fa = a * (0.45 + h3 * 0.55);
    const g2 = ctx.createRadialGradient(fx + jx, fy + jx * 0.35, 0,
                                        fx + jx, fy + jx * 0.35, fr);
    g2.addColorStop(0, `rgba(255,${wG},${wB},${fa})`);
    g2.addColorStop(1, `rgba(255,${wG},${wB},0)`);
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.ellipse(fx + jx, fy + jx * 0.35, fr, fr * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
/* v64: street-tree well half-width in meters — the sidewalk cut-out a
   street tree stands in, ringed by a cast-iron grate. Ficus wells run
   larger than the gingko/trumpet pits. Shared by both views so the
   top-down grate and the street-level pit agree on the footprint. */
function sfTreeWellM(o){ return o && o.v === 0 ? 1.05 : 0.8; }
/* v46: crown-true shadows — look up the baked crown lobe set for a prop
   (declared in SF_CROWN beside the sprites in 31_sf_art.js) so the plan
   view can cast the tree's real outline. Same variant hashes as the
   sprite pickers below. Returns {w,h,lobes}|null. */
function sfCrownSpec(kind, o){
  const C = typeof SF_CROWN !== 'undefined' ? SF_CROWN : null;
  if(!C) return null;
  if(kind === 'sfTree'){
    /* v66: the genetic canopy — the shade pass re-reads the SAME
       generated lobe skeleton the sprite was baked from, mirrored on
       the instance flip bit, so ground shade stays crown-true. */
    const V = PA.sfVeg;
    if(V && V.crown){
      const vi = Math.abs(hash2(o.wx, o.wy, 7) * (V.crownN || 16)) | 0;
      const e = V.crown[o.big ? 'big' : 'tree'][sfTreeTurns(o) ? 1 : 0]
                 [Math.min(vi, (V.crownN || 16) - 1)];
      if(e) return { w: e.spec.w, h: e.spec.h, lobes: e.spec.lobes,
                     flip: (Math.abs(hash2(o.wx, o.wy, 6007) * 2) | 0) === 1 };
    }
    return (o.big ? C.big : C.tree)[Math.abs(hash2(o.wx, o.wy, 7) * 3) | 0];
  }
  if(kind === 'sfStreetTree') return C.street[o.v != null ? o.v : 0];
  if(kind === 'sfCypress')
    return C.cypress[Math.abs(hash2(o.wx, o.wy, 9) * C.cypress.length) | 0];
  return null;
}

/* ---------------- v33: FORWARD SCATTER & CANYON BOUNCE ----------------
   Two missing pieces of real daylight, both driven by the same SF_SUN:
   sfSkyLobeA — the air-light Mie lobe. Sky luminance is NOT uniform
   around the compass: looking toward the sun the atmosphere blooms warm
   and bright; the anti-solar point is the deepest, coolest blue in the
   dome. sunFwd = cos(view bearing, sun bearing) -> lobe strength.
   sfBounceK — street-canyon bounce. When the pavement out front of a
   sun-shy wall is lit (asphalt + painted facades reflect ~15%), the
   street throws warm uplight onto the wall's lowest meters. sunK is the
   wall's n·L, occlM the shadow height sfCanyonShade measures at the
   street point (0 = open sun). */
function sfSkyLobeA(sunFwd){
  return clamp(0.05 + 0.17 * SF_SUN.day, 0, 0.22) * clamp(sunFwd, 0, 1);
}
function sfBounceK(sunK, occlM){
  if(sunK > 0.12 || occlM > 1.2) return 0;
  return 0.16 * SF_SUN.day * clamp(1 - occlM / 1.2, 0, 1) *
         clamp((0.12 - sunK) / 0.3, 0, 1) * (0.55 + 0.45 * SF_SUN.warm);
}

/* ---------------- v28: CURB HEIGHT — the sidewalk is a place, not a color
   Real SF curbs are ~15cm of granite-faced concrete. Until now every
   ground quad sat on the z=0 plane and the "curb" was a painted stripe;
   pawns crossing from asphalt to sidewalk never stepped up. Now sidewalk
   cells project at z=SF_CURB_H, a sun-shaded riser face closes the gap
   on every non-sidewalk edge (dropping to a flush ramp at crosswalks),
   and sfGroundZ lifts whatever stands on the pavement — pawns, street
   trees, poles, lamps — so feet rest on the walkway, not inside it. */
/* ---------------- v37: LANDFORM — the Mission is not flat --------------
   The neighborhood sits on real terrain: the floor climbs south into the
   hills and west toward the Buena Vista / Dolores Heights rise, drains
   northeast toward the old Mission Bay marsh, and Dolores Park itself
   occupies a genuine bowl — a former creek hollow — with Liberty Hill
   shouldering its east rim. sfElevM is the pure elevation field in
   meters (planar grade + Lorentzian landforms, no exp calls — it runs
   inside the projection hot loop). Every ground quad in the street pass
   projects its four corners at their own heights, facade bases shear to
   follow the slope, pawns/props/trees ground through sfGroundZ, and the
   lens rides the land. */
/* v38: elevation memo — sfElevM is pure in (xm,ym) (the landform never
   moves) yet the street pass asked it ~130k times/frame: each grid
   vertex is solved once per adjacent cell (4x), the three shadow-sweep
   layers re-solve the same displaced corners, wall bases and prop feet
   repeat lot datums. Quantized to 1/16m — sub-millimeter height error
   on these slopes — and LRU-bounded; the map persists across frames so
   steady-state frames run lookup-only. */
const SF_ELEV_MEMO = new Map();
function sfElevM(xm, ym){
  const k = Math.round(xm * 16) * 1e6 + Math.round(ym * 16);
  let z = SF_ELEV_MEMO.get(k);
  if(z !== undefined) return z;
  const mw = SF_M.gw * SF_M.cell_m, mh = SF_M.gh * SF_M.cell_m;
  const pc = sfParkCenterM();
  z = 9 + (ym / mh) * 31 + (1 - xm / mw) * 19;
  const bx = xm - pc[0], by = ym - pc[1];
  const bq = (bx * bx + by * by) / (130 * 130);
  z -= 7.5 / ((1 + bq) * (1 + bq));              // the Dolores bowl
  const lx = xm - (pc[0] + 160), ly = ym - (pc[1] - 40);
  z += 6.0 / (1 + (lx * lx + ly * ly) / (160 * 160));   // Liberty Hill
  const hx = xm - (pc[0] - 280), hy = ym - (pc[1] + 90);
  z += 9.0 / (1 + (hx * hx + hy * hy) / (240 * 240));   // Dolores Heights
  z += 0.9 * Math.sin(xm * 0.011 + 1.3) * Math.sin(ym * 0.009 + 0.4)
     + 0.4 * Math.sin((xm - ym) * 0.0055);       // dunes under the grid
  if(SF_ELEV_MEMO.size > 400000) SF_ELEV_MEMO.clear();
  SF_ELEV_MEMO.set(k, z);
  return z;
}
const SF_CURB_H = 0.15;
function sfGroundZ(wxm, wym){
  const cm = SF_M.cell_m;
  return sfElevM(wxm, wym) +
    (sfTile(Math.floor(wxm / cm), Math.floor(wym / cm)) === 11
      ? SF_CURB_H : 0);
}
/* riser concrete under the same sun as the walls: warm-lit when the face
   turns sunward, cool sky-fill in shade — quantized so fill buckets stay
   few */
function sfCurbFaceCol(nx, ny){
  const k = sfSunFaceK(nx, ny);
  const lit = Math.round(clamp(0.34 + 0.30 * Math.max(0, k) * SF_SUN.day +
                    0.10 * SF_SUN.day, 0.3, 0.72) * 8) / 8;
  const c = shade('#6b655c', lit);
  const cool = Math.round(0.18 * (1 - Math.max(0, k) * SF_SUN.day) * 8) / 8;
  return mix(c, '#5a6a8c', cool);
}

/* ---------------- v27: CUTAWAY — occluder ghosting ----------------
   A lens pointed at a subject must never lose them behind a row of
   Victorians. sfGhostSet finds every building footprint the
   camera→subject sightline actually passes through (true
   segment∩polygon, no bbox guessing); those masses render translucent
   with a cool rim, so a wall reads as "the camera sees through it" —
   never as a hole. Trees and poles inside a 2.3m corridor ghost too.
   The segment stops 1.4m short of the subject so the facade they stand
   against keeps its solidity. G toggles the pass; top view gets the
   same treatment: a building sprite covering the inspected pawn fades
   to glass and a locator ring marks the pawn underneath. */
const SF_CUT = { on: true };
let SF_GHOST = null, SF_GHOST_P = null, SF_TOPMARK = null;
function sfSegHit(x1, y1, x2, y2, x3, y3, x4, y4){
  const rx = x2 - x1, ry = y2 - y1, sx = x4 - x3, sy = y4 - y3;
  const den = rx * sy - ry * sx;
  if(!den) return false;
  const t = ((x3 - x1) * sy - (y3 - y1) * sx) / den;
  const u = ((x3 - x1) * ry - (y3 - y1) * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
function sfSegDist(px, py, x1, y1, x2, y2){
  const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1e-9;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / L2, 0, 1);
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}
/* meter-space footprint + bbox, cached (shares b._pm with the street
   renderer's lazy init — either side may compute it first) */
function sfBldMPoly(b){
  if(!b._pm){
    const P2 = b.px.map(q => [q[0] / SF_PXM, q[1] / SF_PXM]);
    let ar = 0;
    for(let e = 0; e < P2.length; e++){
      const [x1, y1] = P2[e], [x2, y2] = P2[(e + 1) % P2.length];
      ar += (x2 - x1) * (y2 + y1);
    }
    b._pm = P2; b._ccw = ar > 0; b._area = Math.abs(ar);
  }
  if(!b._pbb){
    let xA = 1e9, yA = 1e9, xB = -1e9, yB = -1e9;
    for(const [x, y] of b._pm){
      if(x < xA) xA = x; if(x > xB) xB = x;
      if(y < yA) yA = y; if(y > yB) yB = y;
    }
    b._pbb = [xA, yA, xB, yB];
  }
  return b._pm;
}
function sfGhostSet(cx, cy, tx, ty){
  const out = new Set();
  const dx = tx - cx, dy = ty - cy, L = Math.hypot(dx, dy);
  if(L < 4) return out;
  const ex = cx + dx * (1 - 1.4 / L), ey = cy + dy * (1 - 1.4 / L);
  for(const b of SF_BLD){
    const P = sfBldMPoly(b), bb = b._pbb;
    if(Math.min(cx, ex) > bb[2] || Math.max(cx, ex) < bb[0] ||
       Math.min(cy, ey) > bb[3] || Math.max(cy, ey) < bb[1]) continue;
    let hit = sfPtInPoly(P, cx, cy) || sfPtInPoly(P, ex, ey);
    for(let e = 0; e < P.length && !hit; e++){
      const a = P[e], c2 = P[(e + 1) % P.length];
      hit = sfSegHit(cx, cy, ex, ey, a[0], a[1], c2[0], c2[1]);
    }
    if(hit) out.add(b.i);
  }
  return out;
}
/* ---------------- v36: BOOM — collision-aware follow arm -------------
   The third-person rig rides `back` meters behind the subject, and that
   arm is physical: it cannot sink through a facade taller than the
   lens. sfSegHitT returns the segment parameter of a real edge hit;
   sfBoomClip marches the boom (subject→camera) against the same
   meter-space footprints the cutaway pass uses and returns the last
   free distance, standing the lens off the wall face. Buildings the
   lens clears entirely (camH above the roofline) never clip, and the
   footprint the subject stands inside is not an occluder. */
function sfSegHitT(x1, y1, x2, y2, x3, y3, x4, y4){
  const rx = x2 - x1, ry = y2 - y1, sx = x4 - x3, sy = y4 - y3;
  const den = rx * sy - ry * sx;
  if(!den) return -1;
  const t = ((x3 - x1) * sy - (y3 - y1) * sx) / den;
  const u = ((x3 - x1) * ry - (y3 - y1) * rx) / den;
  return (t > 0 && t <= 1 && u >= 0 && u <= 1) ? t : -1;
}
function sfBoomClip(px, py, dx, dy, backM, camHM){
  if(backM <= 1.4) return backM;
  const ex = px + dx * backM, ey = py + dy * backM;
  const bx0 = Math.min(px, ex), bx1 = Math.max(px, ex);
  const by0 = Math.min(py, ey), by1 = Math.max(py, ey);
  let hitT = 1;
  for(const b of SF_BLD){
    if(camHM >= b.hPx / 4.2) continue;          // lens clears the roofline
    sfBldMPoly(b);
    const bb = b._pbb;
    if(bx0 > bb[2] || bx1 < bb[0] || by0 > bb[3] || by1 < bb[1]) continue;
    if(sfPtInPoly(b._pm, px, py)) continue;     // subject's own building
    for(let e = 0; e < b._pm.length; e++){
      const a = b._pm[e], c = b._pm[(e + 1) % b._pm.length];
      const t = sfSegHitT(px, py, ex, ey, a[0], a[1], c[0], c[1]);
      if(t >= 0 && t < hitT) hitT = t;
    }
  }
  if(hitT >= 1) return backM;
  return Math.max(1.4, hitT * backM - 0.9);     // stand off the wall face
}
/* director shot marks — Shift+Digit stores, Digit recalls */
function sfCamMarkSave(n){
  SF_CAM.marks[n] = { x: SF_CAM.x, y: SF_CAM.y, h: SF_CAM.h,
    yaw: SF_CAM.yaw, pitch: SF_CAM.pitch, fov: SF_CAM.fov,
    back: SF_CAM.back, director: SF_CAM.director };
  if(typeof showToast === 'function') showToast(`Mark ${n} set`);
}
function sfCamMarkGo(n){
  const m = SF_CAM.marks[n];
  if(!m) return;
  Object.assign(SF_CAM, m);
  sfCamSnap();
  if(typeof showToast === 'function') showToast(`Mark ${n}`);
}

function sfWxTick(){
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const dt = SF_WX.lastMs ? Math.min(0.5, (now - SF_WX.lastMs) / 1000) : 0;
  SF_WX.dt = dt; SF_WX.t += dt; SF_WX.lastMs = now;
  sfSunUpdate(); // v14: real solar position drives every light below
  // v7: wetness memory — pavement soaks while it rains, dries over minutes.
  // The street stays glossy long after the last drop: classic SF morning.
  // v61: fog drip — under a heavy marine intrusion the city wets itself
  // with zero rain (condensation off leaves, wires and awnings is why
  // Mission sidewalks run dark at 8am after a foggy night). Karl past
  // ~0.5 tips the balance from drying to soaking; below that, dry wins.
  const drip = W.rain > 0.1 ? W.rain * 0.05
    : Math.max(-0.006, sfKarlK() * 0.010 - 0.005);
  SF_WX.wet = clamp(SF_WX.wet + drip * dt, 0, 1);
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
  const cm = SF_M.cell_m;
  SF_WX.wrapX = SF_M.gw * cm + 700;
  SF_WX.wrapY = SF_M.gh * cm + 700;
  if(!SF_WX.clouds){
    SF_WX.clouds = [];
    for(let k = 0; k < 46; k++){
      const hero = k < 14;
      SF_WX.clouds.push({
        x: 0, y: 0, hero,
        r: hero ? 55 + phash(k, 8, 1608) * 60
                : 26 + phash(k, 3, 1602) * 60,
        a: 0.55 + phash(k, 4, 1603) * 0.45,
        s: 0.55 + phash(k, 5, 1604) * 0.9,
      });
    }
    SF_WX.cloudAng = 1e9;
  }
  /* v41: cloud streets — fair-weather cumulus over SF organizes into
     parallel "streets" aligned with the boundary-layer wind (real
     convective organization), not uniform scatter. The field is laid
     out in wind coordinates — lane index picks the cross-wind slot, a
     clumped cell walk picks the along-wind position — and re-laid when
     the wind veers more than ~29°. Shape params stay hashed per index
     so the baked sprites survive every reseed. */
  let dA = W.windAng - SF_WX.cloudAng;
  dA = Math.abs(((dA + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
  if(dA > 0.5){
    SF_WX.cloudAng = W.windAng;
    const mw = SF_M.gw * cm, mh = SF_M.gh * cm;
    const wxv = Math.cos(W.windAng), wyv = Math.sin(W.windAng);
    const nxv = -wyv, nyv = wxv;                       // street normal
    const cxx = mw / 2, cyy = mh / 2;
    const span = Math.hypot(mw, mh);
    const laneSp = 265;                              // ~265m between streets
    const nLanes = Math.max(3, Math.round(span / laneSp));
    const cellL = 230, nCells = Math.ceil(span / cellL);
    // v24 anchor points kept: towers still work the cafe blocks + park
    let hausM = null;
    try{
      const hp = sfFindPOI('Haus Coffee');
      if(hp) hausM = [hp.x / SF_PXM, hp.y / SF_PXM];
    }catch(e){}
    const parkM = sfParkCenterM();
    for(let k = 0; k < 46; k++){
      const c = SF_WX.clouds[k];
      if(k < 2 && hausM){
        c.x = hausM[0] + (k - 0.5) * 190 + (phash(k, 6, 1606) - 0.5) * 80;
        c.y = hausM[1] + (phash(k, 7, 1607) - 0.5) * 160;
      } else if(k < 4){
        c.x = parkM[0] + (k - 2.5) * 210 + (phash(k, 6, 1606) - 0.5) * 90;
        c.y = parkM[1] + (phash(k, 7, 1607) - 0.5) * 200;
      } else {
        const lane = Math.floor(phash(k, 31, 3960) * nLanes);
        const cell = Math.floor(phash(k, 32, 3961) * nCells);
        const along = (cell - nCells / 2 + phash(k, 33, 3962) * 0.9) * cellL;
        const perp = (lane - nLanes / 2 + 0.5) * laneSp +
                     (phash(k, 34, 3963) - 0.5) * laneSp * 0.30;
        c.x = cxx + wxv * along + nxv * perp;
        c.y = cyy + wyv * along + nyv * perp;
      }
    }
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
/* ---------------- v47: sunbreaks --------------------------------------
   The cloud field only ever SUBTRACTED light — shadow lanes slid over
   the streets while the gaps between cloud streets stayed at a flat
   neutral exposure. But the same field that occludes also admits: the
   lane halfway between two cloud streets is a corridor of FULL sun.
   sfGapBlobs mirrors sfShadowBlobs with each cloud's ground spot pushed
   half a street-spacing across the wind, so a warm pool sits exactly in
   the lane between two shade lanes; sfSunGapK is the per-point scalar
   (walls + cells + diorama all sample the same light field). Everything
   drifts on the same wind, projects along the same sun vector, and dies
   out as the deck closes (cover -> 1 leaves no gaps to shine through). */
const SF_GAP_SHIFT = 132;                    // ~half the 265m street spacing
function sfGapBlobs(){
  const cs = sfClouds(), n = Math.ceil(cs.length * (0.25 + 0.75 * sfCloudCover()));
  const nxv = -Math.sin(W.windAng), nyv = Math.cos(W.windAng);
  const out = [];
  for(let i = 0; i < n; i++){
    const c = cs[i];
    const [cx, cy] = sfCloudPos(c);
    out.push([cx + nxv * SF_GAP_SHIFT - SF_SUN.x * SF_CLOUD_ALT,
              cy + nyv * SF_GAP_SHIFT - SF_SUN.y * SF_CLOUD_ALT,
              c.r * c.r * 1.35, c.a]);
  }
  return out;
}
function sfSunGapK(mx, my){
  const cs = sfClouds(), n = Math.ceil(cs.length * (0.25 + 0.75 * sfCloudCover()));
  const nxv = -Math.sin(W.windAng), nyv = Math.cos(W.windAng);
  let k = 0;
  for(let i = 0; i < n; i++){
    const c = cs[i];
    const [cx, cy] = sfCloudPos(c);
    const gx = cx + nxv * SF_GAP_SHIFT - SF_SUN.x * SF_CLOUD_ALT,
          gy = cy + nyv * SF_GAP_SHIFT - SF_SUN.y * SF_CLOUD_ALT;
    const dx = mx - gx, dy = my - gy, d2 = dx * dx + dy * dy, r2 = c.r * c.r * 1.35;
    if(d2 < r2 * 4) k += c.a * Math.exp(-d2 / r2);
  }
  return Math.min(1, k);
}
/* ---------------- v24: cumulus bodies -------------------------------
   The cloud field used to exist only as sliding ground shadows and flat
   sky ellipses — from the diorama the sky was empty while shadows swept
   the streets. Now every cloud is a baked multi-lobe cumulus sprite:
   domes rising off a shared flat grey base, lobe brightness driven by
   the REAL solar bearing (sunQ octant) and warmed at golden hour. The
   same field instance still casts the ground shadows, so body and shade
   stay physically paired. Cache key = cloud idx * 16 + octant * 2 +
   warm bucket (bake is ~10 gradients, one-time per sun octant). */
const SF_CLOUD_SPR = new Map();
/* '#rrggbb' -> {r,g,b} (bundle has mix/shade but no hex parser) */
function sfHX(h){
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16),
           b: parseInt(h.slice(5, 7), 16) };
}
function sfCloudSprite(i, q, warmQ){
  const key = i * 16 + q * 2 + warmQ;
  const hit = SF_CLOUD_SPR.get(key);
  if(hit) return hit;
  if(typeof document === 'undefined') return null;
  const c = sfClouds()[i];
  const W2 = Math.ceil(c.r * 2.7), H2 = Math.ceil(c.r * 1.6);
  const cvv = document.createElement('canvas');
  cvv.width = W2; cvv.height = H2;
  const g = cvv.getContext('2d');
  const cx = W2 / 2, cy = H2 * 0.68;
  const ang = q * Math.PI / 4;                 // screen-space sun bearing
  const ux = Math.cos(ang), uy = Math.sin(ang); // (uy < 0 = sun overhead)
  const np = 7 + Math.floor(phash(i, 61, 1760) * 4);
  for(let k = 0; k < np; k++){
    const fx = (phash(i, k, 1761) - 0.5) * 2;              // -1..1 across base
    const domeK = 1 - fx * fx * 0.72;                      // tallest mid-cloud
    const px = cx + fx * W2 * 0.34 + (phash(k, i, 1764) - 0.5) * c.r * 0.22;
    const py = cy - (0.10 + phash(k, i, 1762) * 0.62) * H2 * domeK;
    const rr = c.r * (0.30 + phash(i, k, 1763) * 0.34) * (0.55 + domeK * 0.45);
    // lobe lit by its offset along the sun bearing + dome height
    const lit = clamp(0.45 + ((px - cx) / W2) * ux * 1.6 +
                    ((py - cy) / H2) * uy * 1.4 - (py - cy) / H2 * 0.35, 0, 1);
    let hi = mix('#dfe6ef', '#ffffff', lit);
    let lo = mix('#7e8ca4', '#bcc8d8', lit);
    if(warmQ){ hi = mix(hi, '#ffe9c2', 0.5); lo = mix(lo, '#a394a8', 0.45); }
    const hc = sfHX(hi), lc = sfHX(lo);
    const g2 = g.createRadialGradient(px - rr * 0.22 * ux, py - rr * 0.25, rr * 0.08,
                                      px, py, rr);
    g2.addColorStop(0, `rgba(${hc.r},${hc.g},${hc.b},1)`);
    g2.addColorStop(0.62, `rgba(${lc.r},${lc.g},${lc.b},0.8)`);
    g2.addColorStop(1, `rgba(${lc.r},${lc.g},${lc.b},0)`);
    g.fillStyle = g2;
    g.beginPath(); g.arc(px, py, rr, 0, Math.PI * 2); g.fill();
  }
  // flat shaded base — cumulus bottoms are grey, level and sharp-edged
  const bg = g.createLinearGradient(0, cy - H2 * 0.18, 0, cy + H2 * 0.1);
  bg.addColorStop(0, 'rgba(140,150,172,0)');
  bg.addColorStop(1, `rgba(${warmQ ? '150,126,128' : '118,130,154'},0.5)`);
  g.fillStyle = bg;
  g.beginPath();
  g.ellipse(cx, cy - H2 * 0.04, W2 * 0.36, H2 * 0.14, 0, 0, Math.PI * 2);
  g.fill();
  SF_CLOUD_SPR.set(key, cvv);
  if(SF_CLOUD_SPR.size > 120)
    SF_CLOUD_SPR.delete(SF_CLOUD_SPR.keys().next().value);
  return cvv;
}
/* ---------------- v56: cloud-shaped shadows ---------------------------
   The top-view shadow pass used to stamp a smooth radial blob per cloud,
   so the streets read as generic smears unrelated to the lumpy cumulus
   overhead. Now the SAME lobe layout the sky sprite bakes is re-rendered
   as a dark silhouette plate — same phash salts, same domes, denser core
   with a soft penumbra fringe — so the ground shadow looks like the
   cloud that casts it. Drawn smeared along the boundary-layer wind, the
   same axis the streets are organized on. */
const SF_CLOUD_SH = new Map();
function sfCloudShadowSprite(i){
  const hit = SF_CLOUD_SH.get(i);
  if(hit) return hit;
  if(typeof document === 'undefined') return null;
  const c = sfClouds()[i];
  const W2 = Math.ceil(c.r * 2.7), H2 = Math.ceil(c.r * 1.6);
  const cvv = document.createElement('canvas');
  cvv.width = W2; cvv.height = H2;
  const g = cvv.getContext('2d');
  const cx = W2 / 2, cy = H2 * 0.68;
  const np = 7 + Math.floor(phash(i, 61, 1760) * 4);
  for(let k = 0; k < np; k++){
    const fx = (phash(i, k, 1761) - 0.5) * 2;
    const domeK = 1 - fx * fx * 0.72;
    const px = cx + fx * W2 * 0.34 + (phash(k, i, 1764) - 0.5) * c.r * 0.22;
    const py = cy - (0.10 + phash(k, i, 1762) * 0.62) * H2 * domeK;
    const rr = c.r * (0.30 + phash(i, k, 1763) * 0.34) * (0.55 + domeK * 0.45);
    const g2 = g.createRadialGradient(px, py, rr * 0.2, px, py, rr * 1.3);
    g2.addColorStop(0, 'rgba(22,30,52,0.9)');
    g2.addColorStop(0.55, 'rgba(24,32,54,0.5)');
    g2.addColorStop(1, 'rgba(24,32,54,0)');
    g.fillStyle = g2;
    g.beginPath(); g.arc(px, py, rr * 1.3, 0, Math.PI * 2); g.fill();
  }
  SF_CLOUD_SH.set(i, cvv);
  if(SF_CLOUD_SH.size > 64)
    SF_CLOUD_SH.delete(SF_CLOUD_SH.keys().next().value);
  return cvv;
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
/* ---- v49: THE WILD PARROTS — the Mission's feral red-masked parakeets.
   A real SF institution: a noisy green flock roosts in the neighborhood's
   palms and cypresses and commutes between crowns in strung-out strings.
   Fully deterministic on SF_WX.t (zero mutable state — harness-safe):
   sfParrotAt resolves bird i's world-meter position, altitude, heading
   and mode from the sim clock. SF_PARROT_FLY "commuter" birds are always
   mid-hop so the flock reads at any instant; the rest perch on crown
   rims and reshuffle hosts every ~46s. Rain grounds the whole flock —
   nobody flies in a storm. */
const SF_PARROT_N = 11, SF_PARROT_FLY = 3;
let SF_PARROT_TREES = null;
function sfParrotTrees(){
  if(SF_PARROT_TREES) return SF_PARROT_TREES;
  const T = [];
  if(typeof SF_PROP_DRAW !== 'undefined')
    for(const lst of SF_PROP_DRAW.values())
      for(const o of lst)
        if(o.kind === 'sfTree' || o.kind === 'sfPalm' || o.kind === 'sfCypress')
          T.push(o);
  SF_PARROT_TREES = T;
  return T;
}
function sfParrotHost(i, c, T){
  return T[Math.abs(hash2(c * 13 + i * 3, i * 7 + c, 5101) * T.length) | 0];
}
function sfParrotAt(i, t){
  const T = sfParrotTrees();
  if(!T.length) return null;
  const out = { x: 0, y: 0, z: 0, fly: 0, hdg: 0, flap: 0 };
  if(i < SF_PARROT_FLY && W.rain <= 0.25){
    // commuter: hop tree->tree on a bowed, weaving path (parrots never
    // fly the straight line), lap time staggered per bird
    const L = 10 + i * 3.5, u = t / L + i * 0.37;
    const lap = Math.floor(u), s = u - lap;
    const A = sfParrotHost(i, lap, T), B = sfParrotHost(i, lap + 1, T);
    const ax = A.x / SF_PXM, ay = A.y / SF_PXM,
          bx = B.x / SF_PXM, by = B.y / SF_PXM;
    const dx = bx - ax, dy = by - ay, dl = Math.hypot(dx, dy);
    if(dl < 4){ // same crown — treat as perched there
      const ang = hash2(i, lap, 5104) * Math.PI * 2;
      out.x = ax + Math.cos(ang) * 1.4; out.y = ay + Math.sin(ang) * 1.4;
      out.z = 7.5; out.hdg = ang;
      return out;
    }
    const se = s * s * (3 - 2 * s);
    const nx = -dy / dl, ny = dx / dl;
    const bow = Math.sin(Math.PI * s) * (6 + i * 2),
          wob = Math.sin(s * 19 + i * 4) * 1.2;
    out.x = ax + dx * se + nx * (bow * 0.4 + wob);
    out.y = ay + dy * se + ny * (bow * 0.4 + wob);
    out.z = 6.5 + Math.sin(Math.PI * s) * (4.5 + i) +
            Math.sin(t * 9 + i) * 0.3;
    out.hdg = Math.atan2(dy + ny * bow * 0.3, dx + nx * bow * 0.3);
    out.fly = 1;
    out.flap = Math.sin(t * 13 + i * 2.1);
    return out;
  }
  // perched: reshuffle host crown every ~46s, staggered per bird.
  // Real flocks bunch up — the rim angle is quantized to a few shared
  // anchor spots so birds clump into visible knots instead of spacing
  // out evenly around the crown.
  const c = Math.floor((t + i * 13) / 46);
  const A = sfParrotHost(i, c, T);
  const spot = Math.floor(hash2(c, i >> 1, 5102) * 3),
        ang = spot * 2.1 + hash2(i, c, 5105) * 0.5;
  const rim = (A.big ? 3.2 : A.kind === 'sfPalm' ? 1.1 : 1.7) *
              (0.7 + hash2(c, i, 5103) * 0.35);
  out.x = A.x / SF_PXM + Math.cos(ang) * rim;
  out.y = A.y / SF_PXM + Math.sin(ang) * rim;
  out.z = (A.big ? 7.4 : A.kind === 'sfPalm' ? 9.6 :
           A.kind === 'sfCypress' ? 9.0 : 6.2) +
          Math.sin(t * 2.2 + i * 1.7) * 0.06;
  out.hdg = ang;
  return out;
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

/* ---------------- v34: Karl's leading edge --------------------------
   The marine layer used to be an omnidirectional horizon band that grew
   only with humidity — real SF fog is an ENTITY: it piles up against the
   coastal hills all day, then the afternoon sea breeze shoves a ragged
   wall of it over the ridge and down into the Mission. sfKarlK() scores
   intrusion strength 0..1 from the live drivers: humidity feeds it, the
   diurnal cycle gates it (burns off midday, returns on the evening push),
   cloud cover thickens it, and it only advances when the wind has fetch
   to carry it. sfKarlPoly() clips the map rect to the half-plane behind
   the fog front — the upwind edge where Karl pours in. Both views draw
   the SAME front. */
function sfKarlK(){
  const t = W.tod;
  const diur = clamp(0.12 + 0.85 * Math.max(
    Math.exp(-Math.pow((t - 7.5) / 4.2, 2)),      // overnight/morning deck
    clamp((t - 14.6) / 2.6, 0, 1)), 0, 1);         // evening push
  const hum = clamp((W.hum - 0.35) / 0.5, 0, 1);
  const fetch = clamp(W.windSpd / 2.4, 0, 1);
  return clamp(diur * 0.5 + hum * 0.4 + sfCloudCover() * 0.2 +
               fetch * 0.15 - 0.24, 0, 1);
}
/* v67: meteorological visibility — a Koschmieder-style daylight visual
   range in km, derived from the same drivers every other weather system
   reads. A dry Mission afternoon holds ~20km+; humidity haze, stratus,
   rain and Karl's own intrusion each cut it toward the real few-
   hundred-meter wall. One number now backs every "how far can the eye
   see" decision: facade airlight (SF_WX.hazeK), the horizon marine band,
   the skyline veil and the Karl wall. The render no longer fakes depth
   with a lens — the air itself reports how far it lets light travel. */
function sfVisKm(){
  let vis = 24 - clamp(W.hum - 0.40, 0, 0.6) * 20 - sfCloudCover() * 4;
  vis -= clamp(W.rain, 0, 1) * 16;
  vis -= sfKarlK() * 18;
  return clamp(vis, 0.4, 24);
}
/* fog region in world meters: the map rect clipped to the half-plane
   upwind of the intrusion front. front 0..1 = fraction of map covered. */
function sfKarlPoly(front){
  if(front <= 0.01) return [];
  const mw = SF_M.gw * SF_M.cell_m, mh = SF_M.gh * SF_M.cell_m;
  const wx = Math.cos(W.windAng), wy = Math.sin(W.windAng);
  const rect = [[0, 0], [mw, 0], [mw, mh], [0, mh]];
  let lo = Infinity, hi = -Infinity;
  for(const c of rect){
    const p = c[0] * wx + c[1] * wy;
    if(p < lo) lo = p; if(p > hi) hi = p;
  }
  const lim = lo + front * (hi - lo);
  const out = [];
  for(let e = 0; e < 4; e++){
    const a = rect[e], b = rect[(e + 1) % 4];
    const pa = a[0] * wx + a[1] * wy, pb = b[0] * wx + b[1] * wy;
    if(pa <= lim) out.push(a);
    if((pa <= lim) !== (pb <= lim)){
      const s = (lim - pa) / (pb - pa);
      out.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]);
    }
  }
  return out;
}
/* the two fog-poly vertices lying deepest downwind = the front line */
function sfKarlFront(poly){
  if(poly.length < 3) return null;
  const wx = Math.cos(W.windAng), wy = Math.sin(W.windAng);
  let i0 = -1, i1 = -1, p0 = -Infinity, p1 = -Infinity;
  for(let i = 0; i < poly.length; i++){
    const p = poly[i][0] * wx + poly[i][1] * wy;
    if(p > p0){ p1 = p0; i1 = i0; p0 = p; i0 = i; }
    else if(p > p1){ p1 = p; i1 = i; }
  }
  return [poly[i0], poly[i1]];
}

/* ---------------- v50: the canyon front ------------------------------
   Karl's leading edge used to be a STRAIGHT half-plane line with soft
   blobs sprinkled on it — fog that ignores the city it's invading. Real
   Mission fog does no such thing: the afternoon push pours through the
   street grid, running 100+ m farther down the avenues than over the
   solid block faces between them, so the front arrives as a row of
   fingers aligned with the streets, not a wall. sfKarlFrontField()
   samples the REAL map: for each cross-wind column it marches downwind
   through SF_GRID and counts street/plaza cells — corridors that line
   up with the wind vent the fog deeper (canyon bonus), solid blocks
   stall it (recessed fingers). The profile is cached per wind bearing;
   karlK only slides the whole front bodily downwind. One field feeds
   the tongue silhouette, the pavement/facade shade scalar and the
   tendril leaks — every consumer agrees on where the fog edge is. */
let SF_KARL_FIELD = null;
function sfKarlFrontField(){
  const aB = Math.round(W.windAng * 60) + (SEED & 0);   // re-lay on veer
  if(SF_KARL_FIELD && SF_KARL_FIELD.aB === aB) return SF_KARL_FIELD;
  const wxv = Math.cos(W.windAng), wyv = Math.sin(W.windAng);
  const nxv = -wyv, nyv = wxv;
  const mw = SF_M.gw * SF_M.cell_m, mh = SF_M.gh * SF_M.cell_m;
  const rp = [[0, 0], [mw, 0], [mw, mh], [0, mh]];
  let lo = Infinity, hi = -Infinity, vLo = Infinity, vHi = -Infinity;
  for(const c of rp){
    const u = c[0] * wxv + c[1] * wyv, v = c[0] * nxv + c[1] * nyv;
    if(u < lo) lo = u; if(u > hi) hi = u;
    if(v < vLo) vLo = v; if(v > vHi) vHi = v;
  }
  const N = 34, marg = (vHi - vLo) * 0.16;
  const vs = new Float32Array(N + 1), dv = new Float32Array(N + 1),
        cf = new Float32Array(N + 1);
  const cm = SF_M.cell_m, lim0 = lo + 0.45 * (hi - lo);   // probe depth
  for(let i = 0; i <= N; i++){
    const v = vLo - marg + (vHi - vLo + 2 * marg) * i / N;
    vs[i] = v;
    let hits = 0, tot = 0;
    for(let s = 0; s < 230; s += cm){
      const gx = Math.floor((wxv * (lim0 + s) + nxv * v) / cm),
            gy = Math.floor((wyv * (lim0 + s) + nyv * v) / cm);
      if(gx < 0 || gy < 0 || gx >= SF_M.gw || gy >= SF_M.gh) break;
      const t = SF_GRID[gy * SF_M.gw + gx];
      if(t === 10 || t === 11 || t === 14 || t === 16) hits++;
      tot++;
    }
    const f = tot ? hits / tot : 0;
    cf[i] = f;
    /* finger shape = slow multi-sine + per-column jitter + canyon bonus
       (squared so genuine street corridors pop against courtyard noise) */
    dv[i] = Math.sin(v * 0.021 + 1.7) * 58 + Math.sin(v * 0.0081 + 0.4) * 84 +
            (phash(i, 91, 5201) - 0.5) * 110 + f * f * 300 - f * 60;
  }
  SF_KARL_FIELD = { aB, vLo: vLo - marg, vHi: vHi + marg,
                    vs, dv, cf, N, lo, hi, wxv, wyv, nxv, nyv };
  return SF_KARL_FIELD;
}
/* along-wind depth (m) of the modulated front at cross-wind coord v */
function sfKarlDepthAt(v){
  const F = sfKarlFrontField(), kk = sfKarlK();
  const lim = F.lo + kk * 0.9 * (F.hi - F.lo);
  const x = clamp((v - F.vLo) / (F.vHi - F.vLo), 0, 1) * F.N;
  const i = Math.min(F.N - 1, Math.floor(x)), fx = x - i;
  const mod = F.dv[i] + (F.dv[i + 1] - F.dv[i]) * fx;
  // fingertips breathe on a slow ~minute-scale cycle
  return lim + mod + Math.sin(SF_WX.t * 0.10 + v * 0.013) * 9;
}
/* world-meter polyline of the modulated front edge (cross-wind order) */
function sfKarlFrontPts(){
  const F = sfKarlFrontField(), out = [], N2 = F.N * 2;
  for(let i = 0; i <= N2; i++){
    const v = F.vLo + (F.vHi - F.vLo) * i / N2;
    const u = Math.min(sfKarlDepthAt(v), F.hi + 60);
    out.push([F.wxv * u + F.nxv * v, F.wyv * u + F.nyv * v]);
  }
  return out;
}
/* v41+v50: fog shade — Karl's intrusion sheet is an OCCLUDER, not just a
   whitening layer: inside it the sun is gone, and its shadow bleeds
   ~110m past the ragged front where the thinning edge still filters
   direct light. v50: the occlusion boundary is the canyon-channelled
   front (sfKarlDepthAt), so a facade dimmed by the sheet is dimmed by
   the SAME finger the top view draws pouring down its street. */
function sfKarlShade(mx, my){
  const kk = sfKarlK();
  if(kk <= 0.03 || isNight()) return 0;
  const F = sfKarlFrontField();
  const u = mx * F.wxv + my * F.wyv, v = mx * F.nxv + my * F.nyv;
  if(v < F.vLo || v > F.vHi) return 0;
  return clamp(kk * 1.25 * (1 - (u - sfKarlDepthAt(v)) / 110), 0, 1);
}

/* ---------------- v60: KARL AT STREET LEVEL ---------------------------
   Fog used to be a pair of unrelated costumes: a silhouette tongue in the
   top view and screen-space mist bands in the street view — neither knew
   where the fog actually WAS. Now ground fog is a world body: a field of
   puffs in world meters, spawned inside the canyon-channelled front
   (real street corridors vent deeper — the same kf.cf probe that shapes
   the front picks the puff nurseries), pooled in the Dolores basin
   (radiation fog drains downhill — the park is the neighborhood's cold
   sump), advected on the real wind at ground speed (roughly a third of
   the cloud-level flow — surface friction), and wrapped on the map.
   Both views draw the SAME puffs: a wisp crossing Guerrero from above
   is the wisp the street camera is about to drive through. Density at a
   puff is the front-shade field itself, so wisps thin out exactly where
   the sun comes back. */
let SF_FOG_FIELD = null;
function sfGroundFogK(){
  const kk = sfKarlK();
  return clamp(kk * 1.25 + clamp((W.hum - 0.62) * 2.2, 0, 1) * 0.6 -
               W.rain * 0.55, 0, 1);
}
function sfFogField(){
  const aB = Math.round(W.windAng * 60);
  if(SF_FOG_FIELD && SF_FOG_FIELD.aB === aB) return SF_FOG_FIELD;
  const wxv = Math.cos(W.windAng), wyv = Math.sin(W.windAng);
  const nxv = -wyv, nyv = wxv;
  const kf = sfKarlFrontField();
  const puffs = [];
  /* corridor nurseries: puffs born inside the venting street columns,
     staggered in depth behind (and a little ahead of) the front */
  let made = 0;
  for(let i = 0; i <= kf.N && made < 20; i++){
    if(kf.cf[i] < 0.30 && phash(i, 97, 5301) < 0.55) continue;
    const nHere = 1 + Math.floor(phash(i, 98, 5302) * 2);
    for(let j = 0; j < nHere && made < 20; j++){
      const v = kf.vs[i] + (phash(i, j, 5303) - 0.5) * 70;
      const u0 = (phash(i, j, 5304) - 0.35) * 260;   // relative to front
      puffs.push({ v, u0, r: 38 + phash(i, j, 5305) * 84,
                   a: 0.55 + phash(i, j, 5306) * 0.45,
                   z: 2 + phash(i, j, 5307) * 9,
                   ph: phash(i, j, 5308) * 6.28,
                   s: 0.55 + phash(i, j, 5309) * 0.7 });
      made++;
    }
  }
  /* basin puffs: Dolores Park sits in the Mission's natural bowl — cold
     air pools there first and burns off last, so a dedicated knot of
     fog always loiters over the lawn while the front is anywhere near */
  const [pcx, pcy] = sfParkCenterM();
  for(let k = 0; k < 8; k++){
    const ang = phash(k, 41, 5311) * 6.28,
          rad = phash(k, 42, 5312) * 130;
    const mx = pcx + Math.cos(ang) * rad, my = pcy + Math.sin(ang) * rad * 0.7;
    puffs.push({ basin: 1, mx, my,
                 r: 46 + phash(k, 43, 5313) * 90,
                 a: 0.45 + phash(k, 44, 5314) * 0.55,
                 z: 1.5 + phash(k, 45, 5315) * 5,
                 ph: phash(k, 46, 5316) * 6.28,
                 s: 0.35 + phash(k, 47, 5317) * 0.4 });
  }
  SF_FOG_FIELD = { aB, wxv, wyv, nxv, nyv, kf, puffs,
                   wx2: SF_M.gw * SF_M.cell_m + 500,
                   wy2: SF_M.gh * SF_M.cell_m + 500 };
  return SF_FOG_FIELD;
}
/* world-meter position of puff i right now — advected on the wind at
   ground speed, wrapped on the padded map rect (same scheme as clouds) */
function sfFogPos(p){
  const F = SF_FOG_FIELD;
  if(p.basin){
    // basin fog barely travels — it sloshes inside the bowl instead
    return [p.mx + Math.sin(SF_WX.t * 0.07 * p.s + p.ph) * 22,
            p.my + Math.cos(SF_WX.t * 0.05 * p.s + p.ph * 1.3) * 14];
  }
  const sp = W.windSpd * 3.8 * p.s;                   // ~1/3 cloud speed
  const front = sfKarlDepthAt(p.v);                   // rides the breathing edge
  let x = (F.wxv * (front + p.u0) + F.nxv * p.v + F.wxv * sp * SF_WX.t) % F.wx2;
  let y = (F.wyv * (front + p.u0) + F.nyv * p.v + F.wyv * sp * SF_WX.t) % F.wy2;
  if(x < 0) x += F.wx2; if(y < 0) y += F.wy2;
  return [x - 250, y - 250];
}
/* local density of puff i — the shade field sets how thick the air is
   where the puff currently sits (basin puffs read a mild ambient term) */
function sfFogPuffA(p, x, y, gk){
  const loc = p.basin ? 0.45 : clamp(0.10 + sfKarlShade(x, y) * 1.3, 0, 1);
  return p.a * loc * gk;
}
/* TOP VIEW: draw the puff field — wind-elongated sheets hugging the
   ground, sun-side rims warmed at golden hour like the front billows */
function sfGroundFogTop(cw, ch){
  const gk = sfGroundFogK();
  if(gk < 0.05) return;
  const F = sfFogField();
  const wrot = Math.atan2(Math.sin(W.windAng) * SF_TILT, Math.cos(W.windAng));
  for(const p of F.puffs){
    const [mx, my] = sfFogPos(p);
    const sx = (mx * SF_PXM - cam.x) * cam.zoom + cw / 2,
          sy = sfSY(my * SF_PXM, ch);
    const rr = p.r * SF_PXM * cam.zoom;
    if(sx + rr * 1.6 < 0 || sx - rr * 1.6 > cw ||
       sy + rr < 0 || sy - rr > ch) continue;
    const a = sfFogPuffA(p, mx, my, gk);
    if(a < 0.02) continue;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rr * 1.5);
    g.addColorStop(0, `rgba(233,238,244,${0.46 * a})`);
    g.addColorStop(0.55, `rgba(228,234,241,${0.22 * a})`);
    g.addColorStop(1, 'rgba(228,234,241,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rr * 2.1, rr * 0.42 * SF_TILT, wrot, 0, Math.PI * 2);
    ctx.fill();
    if(SF_SUN.day > 0.2){
      const hx = sx - SF_SUN.toX * rr * 0.55,
            hy = sy - SF_SUN.toY * rr * 0.4 * SF_TILT;
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, rr * 0.7);
      hg.addColorStop(0, `rgba(255,240,214,${a * (0.10 + 0.22 * SF_SUN.warm)})`);
      hg.addColorStop(1, 'rgba(255,240,214,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.ellipse(hx, hy, rr * 0.7, rr * 0.3 * SF_TILT, wrot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
/* STREET VIEW: the same puffs, projected at their real depth — wide flat
   veils riding at rooftop-and-below height, denser with distance so the
   street dissolves into the fog rather than the fog floating on top */
function sfGroundFogStreet(pr, F, horizon, cw, ch, night){
  const gk = sfGroundFogK();
  if(gk < 0.05 || W.rain > 0.5) return;
  const FF = sfFogField();
  const puffs = [];
  for(const p of FF.puffs){
    const [mx, my] = sfFogPos(p);
    const a = sfFogPuffA(p, mx, my, gk) * (night ? 0.6 : 1);
    if(a < 0.02) continue;
    const pp = pr(mx, my, sfGroundZ(mx, my) + p.z);
    if(!pp || pp[2] > 420) continue;
    puffs.push([pp[2], pp[0], pp[1], p, a]);
  }
  puffs.sort((q, r) => r[0] - q[0]);               // far first
  for(const [fwd, sx, sy, p, a] of puffs){
    const rx = p.r * 2.6 * F / fwd, ry = p.r * 0.55 * F / fwd;
    if(sx + rx < 0 || sx - rx > cw) continue;
    // near-field wisps read thin — you see through what you're inside
    const near = clamp(fwd / 55, 0.15, 1);
    const al = a * near * (0.42 + 0.18 * phash(p.ph * 91 | 0, fwd | 0, 5320));
    if(al < 0.01) continue;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rx);
    g.addColorStop(0, `rgba(${night ? '150,158,180' : '228,234,241'},${al})`);
    g.addColorStop(1, `rgba(${night ? '150,158,180' : '228,234,241'},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    /* fog-top lit edge — low sun catches the upper surface of each bank
       while the street beneath sits in its own shadow */
    if(!night && SF_SUN.day > 0.25){
      const sF = SF_SUN.toX * Math.cos(SF_CAM.yaw) +
                 SF_SUN.toY * Math.sin(SF_CAM.yaw);
      if(sF < -0.05){                      // looking toward the sunlit side
        const hg = ctx.createRadialGradient(sx, sy - ry * 0.9, 0,
                                            sx, sy - ry * 0.9, rx * 0.8);
        hg.addColorStop(0, `rgba(255,236,200,${al * 0.55 * SF_SUN.warm})`);
        hg.addColorStop(1, 'rgba(255,236,200,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.ellipse(sx, sy - ry * 0.9, rx * 0.8, ry * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/* ---------------- v44: SKYLINE — the city doesn't end at the map edge
   The street camera's horizon used to be bare gradient + fog. Now it
   carries a real skyline: an azimuth-consistent silhouette band (each
   screen column maps to a true compass bearing, so the roofline stays
   put as the camera pans), the downtown tower cluster to the NE, and
   the Twin Peaks ridge + Sutro Tower tripod to the WSW. Depth cueing
   uses the same aerial-perspective alpha as the building pass, and the
   marine layer drawn afterwards still veils all of it. */
const SF_SKY_AZ = { dt: -0.96, tp: 2.93 };   // downtown NE, Twin Peaks WSW
function sfSkyline(cw, horizon, F, yaw, cover, wK, fogA){
  const hazeK = clamp(fogA * 0.8 + cover * 0.3, 0, 0.9);
  const baseA = clamp(0.62 - hazeK * 0.5, 0.06, 0.62);
  if(baseA < 0.05) return;
  const warm = Math.round(wK * 40);
  // generic roofline: 22 bearing buckets around the compass, heights in
  // meters resolved through real perspective at ~650m — parapet rhythm
  // with an occasional taller stack, like the endless Mission rows
  const dist = 650, step = Math.max(14, cw / 90);
  ctx.fillStyle = `rgba(${58 + warm},${68 + warm * 0.4},${96 - warm * 0.3},${baseA})`;
  ctx.beginPath();
  for(let sx = -step; sx <= cw + step; sx += step){
    const az = yaw - Math.atan((sx - cw / 2) / F);
    const bq = Math.floor(az / (Math.PI * 2) * 22);
    let hm = 7 + phash(bq, 0, 1790) * 13;
    if(phash(bq, 1, 1791) > 0.86) hm *= 1.9;          // a church, a stack
    const hh = hm * F / dist;
    ctx.rect(sx, horizon - hh, step + 1, hh + 2);
  }
  ctx.fill();
  // cornice texture: parapet ticks on the band top
  ctx.fillStyle = `rgba(${44 + warm},${54 + warm * 0.4},${80 - warm * 0.3},${baseA * 0.9})`;
  for(let sx = -step; sx <= cw + step; sx += step){
    const az = yaw - Math.atan((sx - cw / 2) / F);
    const bq = Math.floor(az / (Math.PI * 2) * 22);
    let hm = 7 + phash(bq, 0, 1790) * 13;
    if(phash(bq, 1, 1791) > 0.86) hm *= 1.9;
    const hh = hm * F / dist;
    for(let k = 0; k < 3; k++)
      if(phash(bq * 3 + k, 2, 1792) > 0.5)
        ctx.fillRect(sx + k * step / 3 + 2, horizon - hh, 2.5, 3);
  }
  const azToX = (a) => {
    const dA = Math.atan2(Math.sin(a - yaw), Math.cos(a - yaw));
    return [cw / 2 - F * Math.tan(dA), Math.cos(dA)];
  };
  // downtown cluster NE (~4km): hazier, taller, one tapered supertall
  {
    const [dx0, cA] = azToX(SF_SKY_AZ.dt);
    if(cA > 0.2 && dx0 > -F * 0.9 && dx0 < cw + F * 0.9){
      const a2 = baseA * 0.72;
      ctx.fillStyle = `rgba(${64 + warm},${76 + warm * 0.4},${104 - warm * 0.3},${a2})`;
      const dD = 4000, spread = F * 0.28;
      for(let k = -3; k <= 3; k++){
        const tx = dx0 + k * spread * (0.24 + phash(k, 3, 1793) * 0.14);
        const th = (46 + phash(k, 4, 1794) * 120) * F / dD;
        const tw = Math.max(4, (26 + phash(k, 5, 1795) * 30) * F / dD);
        ctx.fillRect(tx - tw / 2, horizon - th, tw, th + 2);
      }
      // the tapered supertall on the cluster's west shoulder
      const stH = 296 * F / dD, stW = 34 * F / dD, sx2 = dx0 - spread * 0.42;
      ctx.beginPath();
      ctx.moveTo(sx2 - stW / 2, horizon);
      ctx.lineTo(sx2 - stW * 0.18, horizon - stH);
      ctx.lineTo(sx2 + stW * 0.18, horizon - stH);
      ctx.lineTo(sx2 + stW / 2, horizon);
      ctx.closePath(); ctx.fill();
      ctx.fillRect(sx2 - 0.8, horizon - stH - 8 * F / dD, 1.6, 8 * F / dD);
    }
  }
  // Twin Peaks ridge + Sutro Tower WSW (~2.3km): the ridge humps over
  // the roofline, the tripod mast prongs off the summit — the single
  // most recognizable thing on the Mission's sky
  {
    const [tx0, cA] = azToX(SF_SKY_AZ.tp);
    if(cA > 0.2 && tx0 > -F * 0.9 && tx0 < cw + F * 0.9){
      const dT = 2300, a2 = baseA * 0.9;
      const ridgeW = 700 * F / dT, ridgeH = 272 * F / dT * 0.9;
      ctx.fillStyle = `rgba(${56 + warm},${70 + warm * 0.4},${92 - warm * 0.3},${a2})`;
      ctx.beginPath();
      ctx.moveTo(tx0 - ridgeW / 2, horizon + 1);
      ctx.quadraticCurveTo(tx0 - ridgeW * 0.22, horizon - ridgeH, tx0, horizon - ridgeH);
      ctx.quadraticCurveTo(tx0 + ridgeW * 0.18, horizon - ridgeH * 0.86,
                           tx0 + ridgeW / 2, horizon + 1);
      ctx.closePath(); ctx.fill();
      // Sutro: three legs, two crossbars, mast tip — ~300m AGL total
      const topY = horizon - ridgeH - 98 * F / dT,
            baseY = horizon - ridgeH + 4, legS = 22 * F / dT;
      ctx.strokeStyle = `rgba(${44 + warm},${54 + warm * 0.4},${76 - warm * 0.3},${a2 + 0.08})`;
      ctx.lineWidth = Math.max(1, 2.2 * F / dT);
      ctx.beginPath();
      for(const lx of [-legS, 0, legS]){
        ctx.moveTo(tx0 + lx, baseY);
        ctx.lineTo(tx0 + lx * 0.14, topY);
      }
      ctx.stroke();
      ctx.lineWidth = Math.max(0.7, 1.4 * F / dT);
      for(const fy of [0.36, 0.62, 0.86]){
        const yy = baseY - (baseY - topY) * fy, ww = legS * (1 - fy * 0.86);
        ctx.beginPath(); ctx.moveTo(tx0 - ww, yy); ctx.lineTo(tx0 + ww, yy); ctx.stroke();
      }
    }
  }
}

/* ---------------- v61: WEATHER AT A DISTANCE --------------------------
   The sky used to end at the skyline: precipitation existed only HERE,
   over the Mission. Real days aren't like that — from Dolores Park you
   watch whole shower cells working the East Bay hills and the Peninsula
   while the Mission stays bone dry. sfCellField() is a pure function of
   a slow (~25 min) bucket of sim time plus the live drivers: humidity,
   cloud cover and storm feed the instability score, rain damps the
   contrast (when it's raining here the far field reads as one grey
   wash, not separate cells). Each cell rides a FIXED compass bearing at
   6-15 km — the skyline and marine haze drawn after it do the veiling,
   exactly the way real distance grays a storm over the Diablo range.
   A weak cell trails virga — the shaft hooks downwind and evaporates
   before the ground; a strong one plants rain on the horizon. The shaft
   leans by a drop's real fall-drift (base height / ~5.5 m/s terminal
   speed x wind speed), physically the same wind that slants the local
   streaks, and the anvil cap streams downwind off the summit. */
function sfCellField(){
  const bkt = Math.floor(SF_WX.t / 1500);          // ~25 min cell life
  const mField = clamp(sfCloudCover() * 0.9 + W.hum * 0.45 +
                       W.storm * 0.9 - W.rain * 0.5 - 0.28, 0, 1);
  if(mField <= 0.03) return SF_WX._cells = [];
  const out = [];
  for(let k = 0; k < 6; k++){
    const a0 = phash(k, bkt, 5601);
    if(a0 < 0.5) continue;                         // slot asleep this cycle
    const str = clamp((a0 - 0.5) * 2 * (0.35 + mField), 0, 1);
    if(str < 0.05) continue;
    out.push({
      az: phash(k, bkt, 5602) * Math.PI * 2,       // compass bearing
      dist: 8000 + phash(k, bkt, 5603) * 10000,    // m — beyond the skyline
      str,                                         // 0..1 cell strength
      virga: str <= 0.55,                          // shaft dies aloft
      baseZ: 550 + phash(k, bkt, 5604) * 350,      // cloud base, m
      topZ: 1600 + phash(k, bkt, 5605) * 1400,     // towering top, m
      wM: 900 + phash(k, bkt, 5606) * 1700,        // shaft width, m
      sd: Math.floor(phash(k, bkt, 5607) * 997),   // lobe hash seed
    });
  }
  return SF_WX._cells = out;
}

/* ---------------- v25: the wet-world pack -------------------------
   Rain used to be a screen-space streak overlay over dry geometry — the
   world itself never got wet beyond a dark tint. Now water has a body:
   a deterministic puddle field on hardscape (each pool mirrors the sky
   color, catches a sun glint on the sunward rim, and rings with live
   raindrop ripples), every drop lands as an expanding splash, cornices
   weep drip-lines down the facades, wet asphalt throws the sun and the
   streetlamps back at the camera as smeared reflections, and pawns
   caught outside put up hashed-color umbrellas tilted into the wind.
   Everything keys on the same state — W.rain for what's falling,
   SF_WX.wet (the soaking memory) for what stays wet after it stops. */
/* deterministic puddle on a hardscape cell -> [mx, my, rMeters] | null */
function sfPuddleAt(gx, gy){
  const t = sfTile(gx, gy);
  if(t !== 10 && t !== 11 && t !== 14 && t !== 16) return null;
  if(hash2(gx, gy, SEED + 1850) > 0.085) return null;
  const cm = SF_M.cell_m;
  return [(gx + 0.2 + hash2(gx, gy, SEED + 1851) * 0.6) * cm,
          (gy + 0.2 + hash2(gy, gx, SEED + 1852) * 0.6) * cm,
          0.7 + hash2(gx, gy, SEED + 1853) * 1.9];
}
/* umbrella canopy color for a pawn caught in the rain — ~72% of the cast
   carries one (SF: the rest just get wet), color hashed per character */
const SF_UMB_COLS = ['#c9483c', '#2e5a9a', '#3a7a4a', '#e0a832',
                     '#7a4a8a', '#20242c', '#d8642a', '#3a8a8a'];
function sfUmbrellaCol(v){
  if(W.rain < 0.15 || !v || v.inBuilding) return null;
  const ci = v._ci != null ? v._ci : 0;
  if(hash2(ci, 5, SEED + 1871) > 0.72) return null;
  return SF_UMB_COLS[Math.floor(hash2(ci, 6, SEED + 1872) * SF_UMB_COLS.length)];
}
/* expanding impact rings where drops land — screen-space, bounded to a
   ground band so street view splashes stay on the pavement */
function sfSplashOverlay(cw, yTop, yBot){
  const n = Math.floor(30 + W.rain * 90);
  const bucket = Math.floor(SF_WX.t * 9);
  const rainK = Math.min(1, W.rain * 2);
  ctx.lineWidth = 1;
  for(let i = 0; i < n; i++){
    const ph = hash2(i, bucket, SEED + 1860);          // ring phase 0..1
    const sx = hash2(i, bucket + 131, SEED + 1861) * cw;
    const sy = yTop + hash2(i, bucket + 77, SEED + 1862) * (yBot - yTop);
    const depth = (sy - yTop) / Math.max(1, yBot - yTop); // near = bigger
    const rr = (2 + ph * 9) * (0.4 + 0.6 * depth) * (0.6 + W.rain);
    ctx.strokeStyle = `rgba(210,228,246,${(1 - ph) * 0.4 * rainK})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rr, rr * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    if(ph < 0.25){ // the crown: a bright tick right at impact
      ctx.fillStyle = `rgba(230,242,255,${(0.25 - ph) * 2 * rainK})`;
      ctx.fillRect(sx - 0.5, sy - 2.5 * (0.4 + depth), 1, 2.5 * (0.4 + depth));
    }
  }
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
        /* v64: utility lids — Mission sidewalks are paved over services:
           round water-meter covers and rectangular utility vault panels
           sit flush in the concrete, one per block-face at most, kept
           off the curb band so the painted edge still reads. */
        const uh = phash(wx, wy, 5810);
        if(uh < 0.10){
          const ux = sx + 5 + phash(wx, wy, 5811) * (csz - 14),
                uy = sy + 5 + phash(wy, wx, 5812) * (sh - 14);
          if(uh < 0.05){
            // round water-meter lid: iron disc, rim ring, off-center
            // sweep highlight where the sun catches the casting
            const lr = Math.max(2, csz * 0.11);
            g.fillStyle = '#4e5258';
            g.beginPath();
            g.ellipse(ux + lr, uy + lr, lr, Math.max(1.5, lr * SF_TILT),
                      0, 0, Math.PI * 2);
            g.fill();
            g.strokeStyle = '#3a3e44'; g.lineWidth = 1;
            g.stroke();
            g.fillStyle = 'rgba(200,204,210,0.3)';
            g.fillRect(ux + lr * 0.6, uy + lr * 0.4, Math.max(1, lr * 0.5), 1);
          } else {
            // rectangular vault panel: lid plate + two seam scores
            const pw2 = Math.max(4, csz * 0.34),
                  ph2 = Math.max(2.5, pw2 * 0.55 * SF_TILT + 2);
            g.fillStyle = '#6a675e';
            g.fillRect(ux, uy, pw2, ph2);
            g.strokeStyle = '#45423c'; g.lineWidth = 1;
            g.strokeRect(ux + 0.5, uy + 0.5, pw2 - 1, ph2 - 1);
            g.beginPath();
            g.moveTo(ux + pw2 / 3, uy + 1); g.lineTo(ux + pw2 / 3, uy + ph2 - 1);
            g.moveTo(ux + pw2 * 2 / 3, uy + 1); g.lineTo(ux + pw2 * 2 / 3, uy + ph2 - 1);
            g.stroke();
          }
        }
      } else if(t === 10){
        /* v44: arterial dressing off the road-width map (built once in
           sfInitWorld). Mission/Guerrero-class streets (7-9 cells) carry
           the real SF red transit carpet on the curb lanes plus a
           double-yellow centerline; Dolores-class boulevards (>=10) get
           a planted median with amber edge lines; every crosswalk
           approach gets a white stop bar; sparse manholes dot midblock.
           Drawn under the gutter/windrow bands so curb detail still
           wins at the edges. */
        if(SF_ROADW){
          const ri = wy * SF_M.gw + wx;
          const rw2 = SF_ROADW[ri], rax = SF_ROADAX[ri], roff = SF_ROADOFF[ri];
          const nearX = sfTile(wx - 1, wy) === 16 || sfTile(wx + 1, wy) === 16 ||
                        sfTile(wx, wy - 1) === 16 || sfTile(wx, wy + 1) === 16;
          if(!nearX){
            if(rw2 >= 10 && Math.abs(roff) <= 1){      // |off| <= 0.5 cell
              // planted median — turf band with a pale stone lip and an
              // amber edge line on the traffic side of each lip cell
              g.fillStyle = '#5d7f56';
              g.fillRect(sx, sy, csz + 0.5, sh + 0.5);
              if(phash(wx, wy, 1775) < 0.3){
                g.fillStyle = 'rgba(96,140,80,0.6)';
                g.fillRect(sx + phash(wx, wy, 1776) * csz * 0.7,
                           sy + phash(wy, wx, 1777) * sh * 0.7, 3, 3);
              }
              if(Math.abs(roff) === 1){
                const lip = 'rgba(212,206,190,0.85)',
                      amb = 'rgba(214,164,52,0.8)';
                if(rax === 1){ // N-S street: lip on the off-side edge
                  const lx = roff > 0 ? sx + csz - 3 : sx;
                  g.fillStyle = lip; g.fillRect(lx, sy, 3, sh);
                  g.fillStyle = amb; g.fillRect(roff > 0 ? lx + 3 : lx - 2, sy, 2, sh);
                } else {
                  const ly = roff > 0 ? sy + sh - 3 : sy;
                  g.fillStyle = lip; g.fillRect(sx, ly, csz, 3);
                  g.fillStyle = amb; g.fillRect(sx, roff > 0 ? ly + 3 : ly - 2, csz, 2);
                }
              }
            } else if(rw2 >= 7 && rw2 <= 9){
              // red transit carpet on the curb lanes — SF's real red
              // paint on Mission/Guerrero sits on the outer lane only
              const curbSide = (rax === 0)
                ? (sfTile(wx, wy - 1) === 11 || sfTile(wx, wy + 1) === 11)
                : (sfTile(wx - 1, wy) === 11 || sfTile(wx + 1, wy) === 11);
              if(curbSide){
                g.fillStyle = 'rgba(166,56,42,0.55)';
                g.fillRect(sx, sy, csz + 0.5, sh + 0.5);
                g.fillStyle = 'rgba(120,36,26,0.3)';
                if(rax === 0) g.fillRect(sx, sy + sh * 0.46, csz, Math.max(1.5, sh * 0.08));
                else g.fillRect(sx + csz * 0.46, sy, Math.max(1.5, csz * 0.08), sh);
              }
              // double-yellow centerline — solid pair on the axis
              // cells; roff is in half-cells so even-width streets land
              // the pair on the exact seam between the two center cells
              if(Math.abs(roff) <= 1){
                g.fillStyle = 'rgba(216,170,54,0.85)';
                if(rax === 1){
                  const cxp = sx + csz * (0.5 - roff / 2);
                  g.fillRect(cxp - 2.4, sy, 1.6, sh);
                  g.fillRect(cxp + 0.8, sy, 1.6, sh);
                } else {
                  const cyp = sy + sh * (0.5 - roff / 2);
                  g.fillRect(sx, cyp - 2.4, csz, 1.6);
                  g.fillRect(sx, cyp + 0.8, csz, 1.6);
                }
              }
            }
            // manhole covers — sparse, mid-lane, ring + lid + highlight
            if(phash(wx, wy, 1771) < 0.045){
              g.fillStyle = '#33373e';
              g.beginPath();
              g.ellipse(sx + csz * 0.5, sy + sh * 0.55, csz * 0.2,
                        csz * 0.2 * SF_TILT, 0, 0, Math.PI * 2);
              g.fill();
              g.strokeStyle = '#4b5058'; g.lineWidth = 1;
              g.stroke();
              g.fillStyle = 'rgba(190,196,204,0.35)';
              g.beginPath();
              g.ellipse(sx + csz * 0.47, sy + sh * 0.5, csz * 0.09,
                        csz * 0.05 * SF_TILT, 0, 0, Math.PI * 2);
              g.fill();
            }
          }
          // stop bar — white transverse band on the pavement edge that
          // meets a crosswalk (every approach, both directions)
          const bar = 'rgba(234,234,224,0.8)';
          const bw2 = Math.max(3, 5 * SF_TILT);
          if(sfTile(wx, wy - 1) === 16) g.fillStyle = bar, g.fillRect(sx, sy, csz, bw2);
          if(sfTile(wx, wy + 1) === 16) g.fillStyle = bar, g.fillRect(sx, sy + sh - bw2, csz, bw2);
          if(sfTile(wx - 1, wy) === 16) g.fillStyle = bar, g.fillRect(sx, sy, 4, sh);
          if(sfTile(wx + 1, wy) === 16) g.fillStyle = bar, g.fillRect(sx + csz - 4, sy, 4, sh);
        }
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
        // v28: gutter windrow — wind rows litter/leaves against the curb;
        // a ragged dark seam on the roadway just off the curb face, with
        // leaf dabs where the row runs heavy
        const windrow = (edge) => {
          const h = phash(wx, wy, 1901 + 'nsew'.indexOf(edge));
          if(h < 0.3) return;
          const in2 = Math.max(2, 4.5 * SF_TILT), bw = Math.max(1.5, 2.4 * SF_TILT);
          g.fillStyle = `rgba(56,46,32,${(0.10 + 0.14 * h).toFixed(3)})`;
          if(edge === 'n') g.fillRect(sx, sy + in2, csz, bw);
          if(edge === 's') g.fillRect(sx, sy + sh - in2 - bw, csz, bw);
          if(edge === 'w') g.fillRect(sx + in2, sy, Math.max(1.5, 2.4), sh);
          if(edge === 'e') g.fillRect(sx + csz - in2 - Math.max(1.5, 2.4), sy, Math.max(1.5, 2.4), sh);
          if(h > 0.62){
            g.fillStyle = 'rgba(140,104,50,0.5)';
            const u1 = phash(wx, wy, 1921 + 'nsew'.indexOf(edge)) * (csz - 6),
                  u2 = phash(wx, wy, 1931 + 'nsew'.indexOf(edge)) * (csz - 6);
            if(edge === 'n' || edge === 's'){
              const yy = edge === 'n' ? sy + in2 : sy + sh - in2 - bw + 1;
              g.fillRect(sx + u1, yy, 3, 2); g.fillRect(sx + u2, yy + 1, 2, 2);
            } else {
              const xx = edge === 'w' ? sx + in2 : sx + csz - in2 - 3;
              g.fillRect(xx, sy + u1, 2, 3); g.fillRect(xx + 1, sy + u2, 2, 2);
            }
          }
        };
        if(sfTile(wx, wy - 1) === 11) windrow('n');
        if(sfTile(wx, wy + 1) === 11) windrow('s');
        if(sfTile(wx - 1, wy) === 11) windrow('w');
        if(sfTile(wx + 1, wy) === 11) windrow('e');
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
    } else if(d.kind === 'worn'){
      // v40: desire lines — patchy bare-earth cells where foot traffic
      // beats the lawn; wear weight w fades toward each line's fringe
      for(const [wx, wy, w] of d.cells){
        const X = wx * csz - ox, Y = wy * csz - oy;
        if(X > CHN * csz + 4 || X < -csz - 4 || Y > CHN * csz + 4 || Y < -csz - 4)
          continue;
        g.fillStyle = `rgba(158,140,88,${0.36 + w * 0.5})`;
        g.fillRect(X, Y, csz + 0.5, csz + 0.5);
        if(w > 0.45){
          g.fillStyle = `rgba(118,100,60,${(w - 0.45) * 0.95})`;
          g.fillRect(X + csz * 0.16, Y + csz * 0.16, csz * 0.68, csz * 0.68);
        }
        // kicked-up bare speckles + a surviving grass tuft here and there
        g.fillStyle = 'rgba(96,82,50,0.4)';
        for(let s2 = 0; s2 < 3; s2++){
          const hx = phash(wx, wy * 7 + s2, 1741), hy = phash(wy, wx * 5 + s2, 1742);
          g.fillRect(X + hx * csz, Y + hy * csz, 2, 2);
        }
        if(phash(wx, wy, 1743) < 0.25){
          g.fillStyle = 'rgba(110,150,80,0.5)';
          g.fillRect(X + phash(wx, wy, 1744) * csz * 0.7,
                     Y + phash(wy, wx, 1745) * csz * 0.7, 3, 2);
        }
      }
    }
  }
  g.restore();
}
function sfTerrChunk(cx, cy, wetQ){
  const key = cx + ',' + cy + ',' + wetQ + ',' +
              Math.round(sfDrySeason() * 4) + ',' + SF_SUN.q;
  const hit = SF_TERR.cache.get(key);
  if(hit){ // LRU touch
    SF_TERR.cache.delete(key); SF_TERR.cache.set(key, hit); return hit;
  }
  // v42: warm sunlit-ground wash — constant for the whole chunk (the key
  // already carries SF_SUN.q, so each sun sector rebakes its own tint)
  SF_TERR.litA = +(0.11 * SF_SUN.day *
    clamp(Math.sin(Math.max(0, SF_SUN.el)) * 1.5, 0, 1) *
    (0.45 + 0.55 * SF_SUN.warm)).toFixed(3);
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
      // v55: the mowed lawn — Dolores' grass is cut in contour-following
      // passes, not random meadow. Alternating light/dark bands along
      // elevation contours (albedo change, drawn under the light passes
      // so hillshade + sun key still modulate it), plus autumn leaf-fall
      // speckle that thickens with the turn.
      if(tt === 13){
        if(sfMowBand(wx, wy)){
          g.fillStyle = 'rgba(20,44,30,0.11)';
          g.fillRect(sx, sy, csz + 0.5, sh + 0.5);
        } else {
          g.fillStyle = 'rgba(255,246,206,0.09)';
          g.fillRect(sx, sy, csz + 0.5, sh + 0.5);
        }
        if(phash(wx, wy, 5570) < sfFallTurn() * 0.5){
          const LC2 = ['#c8983a', '#a4582c', '#8a5c22'];
          for(let k2 = 0; k2 < 3; k2++){
            g.fillStyle = LC2[(wx + wy + k2) % 3];
            g.fillRect(sx + phash(wx, wy * 3 + k2, 5571) * (csz - 3),
                       sy + phash(wy, wx * 5 + k2, 5572) * (sh - 2),
                       2.5, 1.6);
          }
        }
      }
      // v37: hillshade — the landform reads under the real sun: slopes
      // angled at it catch warm light, shying slopes take cool fill
      {
        const cm2 = SF_M.cell_m, ax = wx * cm2, ay = wy * cm2;
        const e00 = sfElevM(ax, ay), e10 = sfElevM(ax + cm2, ay),
              e01 = sfElevM(ax, ay + cm2), e11 = sfElevM(ax + cm2, ay + cm2);
        const sk = -((e10 + e11 - e00 - e01) / (2 * cm2) * SF_SUN.toX +
                     (e01 + e11 - e00 - e10) / (2 * cm2) * SF_SUN.toY) *
                   (0.35 + 0.65 * SF_SUN.day);
        const aa = clamp(sk * 4.5, -0.22, 0.26);
        if(aa > 0.02){
          g.fillStyle = `rgba(255,246,220,${aa.toFixed(3)})`;
          g.fillRect(sx, sy, csz + 0.5, sh + 0.5);
        } else if(aa < -0.02){
          g.fillStyle = `rgba(30,40,66,${(-aa).toFixed(3)})`;
          g.fillRect(sx, sy, csz + 0.5, sh + 0.5);
        }
      }
      // v42: the warm key — open ground is sun-struck, not just unshadowed.
      // A faint gold wash (scaled by elevation + golden-hour warmth) sits
      // under every cast-shadow sprite, so lit pavement reads warm against
      // the cool skylight-only shade the buildings throw over it.
      if(SF_TERR.litA > 0.004){
        g.fillStyle = `rgba(255,210,142,${SF_TERR.litA})`;
        g.fillRect(sx, sy, csz + 0.5, sh + 0.5);
      }
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
/* production-1: speech bubbles — sayText/sayUntil/sayAt are set by the
   agent bridge's sfSay and by the speak verb (doSpeakStep). One draw
   helper serves all three pawn passes (top, street, interior). The
   still-key folds the live speech state into the frame signature so a
   new utterance busts the temporal cache instead of never appearing. */
function sfSaySig(v){
  if(!v.sayText || !(v.sayUntil > W.tod)) return 0;
  let h = 5381;
  const s = String(v.sayText);
  for(let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return h;
}
function sfSayBubble(v, sx, sy, k){
  if(!v || !v.sayText || !(v.sayUntil > W.tod)) return;
  k = k || 1;
  const fpx = Math.max(9, Math.round(11 * k));
  ctx.font = fpx + 'px system-ui, sans-serif';
  const words = String(v.sayText).split(/\s+/);
  const lines = [];
  let cur = '';
  for(const w of words){
    const nxt = cur ? cur + ' ' + w : w;
    if(nxt.length > 26 && cur){ lines.push(cur); cur = w; }
    else cur = nxt;
  }
  if(cur) lines.push(cur);
  if(lines.length > 3){ lines.length = 3; lines[2] = lines[2].slice(0, 24) + '…'; }
  let bw = 0;
  for(const ln of lines) bw = Math.max(bw, ctx.measureText(ln).width);
  bw += 16 * k;
  const lh = fpx + 3 * k, bh = lines.length * lh + 9 * k;
  // pop-in over the first ~250ms of screen life, scaling from the tail
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const age = (now - (v.sayAt || now)) / 1000;
  const pop = age < 0.25 ? 0.55 + 0.45 * (age / 0.25) : 1;
  const bx = sx - bw / 2, by = sy - bh - 9 * k;
  ctx.save();
  ctx.translate(sx, sy); ctx.scale(pop, pop); ctx.translate(-sx, -sy);
  const r = 7 * k;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
  ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
  ctx.arcTo(bx, by + bh, bx, by, r);
  ctx.arcTo(bx, by, bx + bw, by, r);
  ctx.closePath();
  ctx.fillStyle = 'rgba(248,244,232,0.96)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,16,12,0.85)';
  ctx.lineWidth = Math.max(1, 1.2 * k);
  ctx.stroke();
  ctx.beginPath();   // tail
  ctx.moveTo(sx - 5 * k, by + bh - 1);
  ctx.lineTo(sx + 5 * k, by + bh - 1);
  ctx.lineTo(sx, by + bh + 8 * k);
  ctx.closePath();
  ctx.fillStyle = 'rgba(248,244,232,0.96)';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1a1410';
  ctx.textAlign = 'center';
  for(let i = 0; i < lines.length; i++)
    ctx.fillText(lines[i], sx, by + 5 * k + fpx + i * lh);
  ctx.restore();
}
function sfStillKey(cw, ch, view, pose){
  let sig = 0;
  for(const v of VILLAGERS)
    sig += Math.round(v.x) + Math.round(v.y) + (v.face || 0) * 13 +
           (v.inBuilding ? 7919 : 0) + sfSaySig(v);
  return [view, cw, ch, Math.round(SF_WX.t * 2), isNight() ? 1 : 0,
          Math.round(W.tod * 24), SF_SUN.q, Math.round(W.rain * 8),
          Math.round(SF_WX.wet * 8), Math.round(sfCloudCover() * 8),
          Math.round(SF_WX.gust * 4), Math.round(sig), inspectedPawnIdx,
          Math.round(sfDrySeason() * 4)]
          .concat(pose).join(',');
}
function sfStillHit(key){
  if(SF_STILL.skip || SF_STILL.key !== key || !SF_STILL.c) return false;
  ctx.drawImage(SF_STILL.c, 0, 0);
  return true;
}
function sfStillStore(cw, ch, key){
  if(SF_STILL.skip || typeof document === 'undefined' || !ctx.canvas) return;
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

/* ---------------- v29: street ground-pass infrastructure ---------------
   The ground pass walks ~18k visible cells per frame; everything below
   exists to keep that loop allocation-free and projection-lean. */
const SF_CB = { f: new Float64Array(3 * 24576), t: new Uint8Array(24576),
                i: new Uint32Array(24576) };  // flat cell buffer + sort index
function sfCellGrow(){
  const n = SF_CB.t.length * 2;
  const f = new Float64Array(3 * n), t = new Uint8Array(n),
        ix = new Uint32Array(n);
  f.set(SF_CB.f); t.set(SF_CB.t); ix.set(SF_CB.i);
  SF_CB.f = f; SF_CB.t = t; SF_CB.i = ix;
}
const SF_QP = new Float64Array(16);   // projected quad scratch (z0 + slab top)
const SF_FILLS = new Map();           // pooled style -> flat coord buckets
const SF_POST = [];                   // pooled sparse-shape list
/* static per-cell neighbor mask — SF_GRID never changes after world gen,
   so the four-neighbor tile test every cell used to pay for per frame
   becomes one Uint16 lookup. Per direction (n,s,w,e at bits d*4..d*4+3):
   bit0 neighbor==road(10), bit1 ==sidewalk(11), bit2 ==crosswalk(16),
   bit3 out-of-bounds(-1). */
let SF_NB = null, SF_NB_G = null;
function sfNbMasks(){
  if(SF_NB && SF_NB_G === SF_GRID) return SF_NB;
  SF_NB_G = SF_GRID;
  const gw = SF_M.gw, gh = SF_M.gh;
  SF_NB = new Uint16Array(gw * gh);
  for(let y = 0; y < gh; y++){
    for(let x = 0; x < gw; x++){
      let m = 0;
      for(let d = 0; d < 4; d++){
        const tt = sfTile(x + (d === 2 ? -1 : d === 3 ? 1 : 0),
                          y + (d === 0 ? -1 : d === 1 ? 1 : 0));
        if(tt === 10) m |= 1 << (d * 4);
        else if(tt === 11) m |= 2 << (d * 4);
        else if(tt === 16) m |= 4 << (d * 4);
        else if(tt < 0) m |= 8 << (d * 4);
      }
      SF_NB[y * gw + x] = m;
    }
  }
  return SF_NB;
}
/* numeric-keyed copy of SF_GROUND_OVR ("wx,wy" strings -> cell index) so
   the emit loop does a Map<int> get instead of building a string per cell.
   Rebuilt only when the override set changes size. */
let SF_OVRN = null, SF_OVRN_SZ = -1, SF_OVRN_G = null;
function sfOvrNums(){
  if(SF_OVRN && SF_OVRN_SZ === SF_GROUND_OVR.size && SF_OVRN_G === SF_GRID)
    return SF_OVRN;
  SF_OVRN = new Map(); SF_OVRN_SZ = SF_GROUND_OVR.size; SF_OVRN_G = SF_GRID;
  for(const [k, v] of SF_GROUND_OVR){
    const c = k.indexOf(',');
    SF_OVRN.set(+k.slice(c + 1) * SF_M.gw + (+k.slice(0, c)), v);
  }
  return SF_OVRN;
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
      // v32: cured dry-season cells flip to the gold tile set
      if(sfGrassDry(wx, wy) > 0.5)
        return T.parkDry[Math.abs(hash2(wx, wy, SEED + 64) * 3) | 0];
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
  SF_LENS.mode = 'top';   // v26: tilt-shift bands in the lens pass
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

  // 1b. v25: live puddle field — pools on hardscape mirror the sky, grow
  //     with the wetness memory, glint sunward, and ring with raindrop
  //     ripples while it's actually raining. Drawn over the terrain
  //     chunks so buildings/pawns still occlude them correctly.
  if(SF_WX.wet > 0.08){
    const wv = SF_WX.wet;
    const rip = W.rain > 0.08 ? Math.min(1, W.rain * 2) : 0;
    for(let wy = wy0; wy <= wy1; wy++){
      for(let wx = wx0; wx <= wx1; wx++){
        const pu = sfPuddleAt(wx, wy);
        if(!pu) continue;
        const sx = (pu[0] * SF_PXM - cam.x) * cam.zoom + cw / 2;
        const sy = sfSY(pu[1] * SF_PXM, ch);
        const rr = pu[2] * SF_PXM * cam.zoom;
        if(sx + rr < 0 || sx - rr > cw || sy + rr < 0 || sy - rr > ch) continue;
        const R = rr * clamp((wv - 0.08) / 0.5, 0.15, 1); // pools fill slowly
        ctx.fillStyle = `rgba(${SF_WX.hazeRGB},${0.28 + wv * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(sx, sy, R, R * 0.6 * SF_TILT + 1, 0, 0, Math.PI * 2);
        ctx.fill();
        // sunward glint — the water throws the sun back at the camera
        if(!isNight() && SF_SUN.day > 0.15){
          ctx.fillStyle = `rgba(255,250,235,${0.35 * SF_SUN.day * wv})`;
          ctx.beginPath();
          ctx.ellipse(sx + SF_SUN.toX * R * 0.4, sy + SF_SUN.toY * R * 0.4 * SF_TILT,
                      Math.max(1, R * 0.16), Math.max(0.8, R * 0.09),
                      0, 0, Math.PI * 2);
          ctx.fill();
        }
        if(rip && R > 3){
          for(let k = 0; k < 2; k++){
            const ph = (SF_WX.t * (0.9 + k * 0.4) +
                        hash2(wx, wy, SEED + 1854 + k)) % 1;
            const rr2 = R * (0.15 + ph * 0.8);
            ctx.strokeStyle = `rgba(220,235,250,${(1 - ph) * 0.5 * rip})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(sx, sy, rr2, rr2 * 0.6 * SF_TILT + 0.5,
                        0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }
  }

  /* v71: BLOCK SHADOWS — the top view used to leave every building
     shadowless: rooftops floated on uniformly lit pavement while pawns,
     trees and props all threw real sun shadows. Now each footprint is
     swept along the true solar throw (height · cot(el) through
     SF_SUN.x/y, the same vector the street view's canyon pass and every
     prop shadow obeys) and pooled on the ground in three penumbra
     layers — one shared path per layer so overlapping sweeps never
     double-darken. Drawn under the drawable pass, so a shadow crossing
     a neighbor's lot is correctly occluded by that building's sprite,
     and so pawns/props standing in the shade still layer their own
     (physically separate) shadows on top. */
  const _bldShade = !isNight() && SF_SUN.day > 0.08;
  if(_bldShade){
    const coverK = sfCloudCover();
    const shA = 0.52 * Math.min(1, SF_SUN.day + 0.2) * (1 - coverK * 0.55);
    if(shA > 0.03){
      const z2 = cam.zoom,
            vx0 = cam.x - cw / 2 / z2, vx1 = cam.x + cw / 2 / z2,
            vy0 = cam.y - ch / 2 / z2 / SF_TILT,
            vy1 = cam.y + ch / 2 / z2 / SF_TILT;
      // throw can reach far — admit buildings whose SHADOW enters the
      // frame even when their footprint lies outside it
      const maxThrow = 2.6 * 26 * SF_PXM;   // cot cap × tallest massing
      const list = [];
      for(const b of SF_BLD){
        if(Math.max(b.bx1, b.bx1 + Math.abs(SF_SUN.x) * maxThrow) < vx0 - 40 ||
           Math.min(b.bx0, b.bx0 - Math.abs(SF_SUN.x) * maxThrow) > vx1 + 40 ||
           Math.max(b.by1, b.by1 + Math.abs(SF_SUN.y) * maxThrow) < vy0 - 40 ||
           Math.min(b.by0, b.by0 - Math.abs(SF_SUN.y) * maxThrow) > vy1 + 40)
          continue;
        list.push(b);
      }
      const sxp = (x) => (x - cam.x) * z2 + cw / 2;
      const syp = (y) => sfSY(y, ch);
      // contact skirt — a thin ambient-occlusion rim hugging the base on
      // all sides, so walls read seated into the pavement even where the
      // cast shadow points away
      ctx.beginPath();
      for(const b of list){
        const P = b.px;
        ctx.moveTo(sxp(P[0][0]), syp(P[0][1]));
        for(let e = 1; e < P.length; e++)
          ctx.lineTo(sxp(P[e][0]), syp(P[e][1]));
        ctx.closePath();
      }
      ctx.strokeStyle = 'rgba(18,24,40,0.20)';
      ctx.lineWidth = Math.max(1, 3.2 * z2);
      ctx.lineJoin = 'round';
      ctx.stroke();
      // swept cast shadow — penumbra ring, full throw, umbra core
      for(const [mul, al] of [[1.18, shA * 0.32], [1.0, shA * 0.62],
                              [0.62, shA]]){
        ctx.beginPath();
        for(const b of list){
          const P = b.px, nP = P.length,
                ox = SF_SUN.x * (b.hPx / 4.2) * mul * SF_PXM,
                oy = SF_SUN.y * (b.hPx / 4.2) * mul * SF_PXM;
          // displaced roofprint — guarantees the far tip is solid shade
          ctx.moveTo(sxp(P[0][0] + ox), syp(P[0][1] + oy));
          for(let e = 1; e < nP; e++)
            ctx.lineTo(sxp(P[e][0] + ox), syp(P[e][1] + oy));
          ctx.closePath();
          // edge quads — the sweep between wall base and roof shadow
          for(let e = 0; e < nP; e++){
            const a = P[e], c = P[(e + 1) % nP];
            ctx.moveTo(sxp(a[0]), syp(a[1]));
            ctx.lineTo(sxp(c[0]), syp(c[1]));
            ctx.lineTo(sxp(c[0] + ox), syp(c[1] + oy));
            ctx.lineTo(sxp(a[0] + ox), syp(a[1] + oy));
            ctx.closePath();
          }
        }
        ctx.fillStyle = `rgba(24,30,52,${al.toFixed(3)})`;
        ctx.fill();
      }
    }
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
    // v70: everyone inside the dollhouse room is drawn in the plan —
    // including the controlled/inspected pawn (whose world x,y is stale)
    const _sv70 = VILLAGERS[inspectedPawnIdx];
    if(v.inBuilding && (v !== VILLAGERS[controlledPawnIdx] ||
        (_sv70 && _sv70.inBuilding && v.inside === _sv70.inside))) continue;
    drawables.push({ kind: 'pawn', y: v.y, v });
  }
  drawables.sort((a, b) => a.y - b.y);
  SF_TOPMARK = null; // v27: set when a sprite ghosts over the subject

  for(const d of drawables){
    if(d.kind === 'bld'){
      const b = d.b;
      const art = getSfBldArt(b.i, SF_WX.wet > 0.45 ? 1 : 0); // v12: wet bake
      const sx = Math.round((b.bx0 - cam.x) * cam.zoom + cw / 2 - art.ox * cam.zoom);
      // v8 diorama: anchor the sprite's SOUTH footprint edge to the tilted
      // ground so facades stand on the correct pavement line; the roof plane
      // visually deepens toward the tilted north edge.
      const sy = Math.round(sfSY(b.by1, ch) - (art.oy + (b.by1 - b.by0)) * cam.zoom);
      // v27: cutaway — if the inspected pawn is hidden behind this
      // sprite's opaque mass (pawn drawn earlier in the y-sort), the
      // building fades to glass and a locator ring marks the subject.
      const sv = VILLAGERS[inspectedPawnIdx];
      let cover = false;
      if(SF_CUT.on && sv && !sv.inBuilding && sv.y < b.by1){
        const psx = (sv.x - cam.x) * cam.zoom + cw / 2,
              psy = sfSY(sv.y, ch),
              dw = art.c.width * cam.zoom, dh = art.c.height * cam.zoom;
        if(psx > sx + 2 && psx < sx + dw - 2 && psy > sy + 2 && psy < sy + dh){
          cover = true; SF_TOPMARK = [psx, psy];
        }
      }
      // v62: aerial relief displacement — the sprite leans radially
      // outward from the frame nadir, pivoting on its south footprint
      // line so the base stays glued to the pavement
      ctx.save();
      sfTopLean(b.x, b.by1, (b.x - cam.x) * cam.zoom + cw / 2,
                sfSY(b.by1, ch));
      // v70: dollhouse — the inspected pawn's own building lifts its
      // roof; the plan is drawn over the ghosted sprite below
      const doll = sv && sv.inBuilding && b.i === sfInsideBldIdx(sv.inside);
      ctx.globalAlpha = cover ? 0.45 : (doll ? 0.22 : 1);
      ctx.drawImage(art.c, sx, sy, art.c.width * cam.zoom, art.c.height * cam.zoom);
      ctx.globalAlpha = 1;
      // v33: parapet sun-rim — the coping lip on every footprint edge
      // whose outward normal faces the solar bearing catches a thin warm
      // line at roof height; the baked sprite can't carry it (the sprite
      // is quantized to 8 sun sectors, the rim follows the real vector).
      if(!cover && !isNight() && SF_SUN.day > 0.22 && cam.zoom >= 0.5){
        const P = b.px, nP = P.length, hOff = b.hPx * cam.zoom;
        ctx.lineWidth = Math.max(1, 1.5 * cam.zoom);
        for(let e = 0; e < nP; e++){
          const a = P[e], c2 = P[(e + 1) % nP];
          const ex2 = c2[0] - a[0], ey2 = c2[1] - a[1];
          const el2 = Math.hypot(ex2, ey2) || 1;
          let nx2 = -ey2 / el2, ny2 = ex2 / el2;
          if(nx2 * ((a[0] + c2[0]) / 2 - b.x) +
             ny2 * ((a[1] + c2[1]) / 2 - b.y) < 0){ nx2 = -nx2; ny2 = -ny2; }
          const rk = nx2 * SF_SUN.toX + ny2 * SF_SUN.toY;
          if(rk < 0.35) continue;
          ctx.strokeStyle = `rgba(255,222,160,${(0.10 + 0.20 * rk) * SF_SUN.day})`;
          ctx.beginPath();
          ctx.moveTo((a[0] - cam.x) * cam.zoom + cw / 2,
                     sfSY(a[1], ch) - hOff);
          ctx.lineTo((c2[0] - cam.x) * cam.zoom + cw / 2,
                     sfSY(c2[1], ch) - hOff);
          ctx.stroke();
        }
      }
      if(cover){
        ctx.strokeStyle = 'rgba(150,215,255,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(sx, sy, art.c.width * cam.zoom, art.c.height * cam.zoom);
        ctx.setLineDash([]);
      }
      ctx.restore();
      if(doll) sfDollhouse(b, sv.inside, cw, ch);
      // production-1: label routed through canonical parody display name
      const dn = sfSignName(b);
      if(cam.zoom >= 0.9 && dn){
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        // v62: the label rides the displaced roof, not the ground plan
        const lsh = sfTopLeanShift(b.x, b.y, b.hPx);
        const lx = Math.round((b.x - cam.x) * cam.zoom + cw / 2 + lsh[0]);
        const ly = Math.round(sfSY(b.by0, ch) - b.hPx * cam.zoom - 8 + lsh[1]);
        const tw = ctx.measureText(dn).width;
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.fillRect(lx - tw / 2 - 4, ly - 11, tw + 8, 14);
        ctx.fillStyle = '#fef08a';
        ctx.fillText(dn, lx, ly);
      }
    } else if(d.kind === 'prop'){
      const o = d.o, V = PA.sfVeg;
      // v19: propM = real height in meters (drives sun throw), footM =
      // ground-contact radius in meters (drives the always-on AO disc)
      let spr = null, shadeR = 0, propM = 0, footM = 0;
      if(o.kind === 'sfTree'){
        const ar = sfTreeTurns(o);   // v55: this crown turned for autumn
        // v66: genetic canopy — a unique genome per tree (16 baked per
        // size x turn state); falls back to the v55 clone sets
        const ti = Math.abs(hash2(o.wx, o.wy, 7) * (V.crownN || 3)) | 0;
        const ge = V.crown &&
          V.crown[o.big ? 'big' : 'tree'][ar ? 1 : 0]
           [Math.min(ti, (V.crownN || 16) - 1)];
        spr = ge ? ge.spr
                 : (o.big ? (ar ? V.bigTreeA : V.bigTree)
                          : (ar ? V.treeA : V.tree))
                   [Math.abs(hash2(o.wx, o.wy, 7) * 3) | 0];
        shadeR = o.big ? 26 : 15; footM = o.big ? 0.8 : 0.55; }
      else if(o.kind === 'sfPalm'){ spr = V.palm[Math.abs(hash2(o.wx, o.wy, 8) * V.palm.length) | 0]; shadeR = 9; footM = 0.4; }
      else if(o.kind === 'sfStreetTree'){ spr = V.streetTree[o.v != null ? o.v : 0];
        // v40: the ficus (v0) throws a real canopy-sized shade pool
        shadeR = o.v === 0 ? 30 : 11; footM = o.v === 0 ? 0.7 : 0.45; }
      else if(o.kind === 'sfCypress'){ spr = V.cypress[Math.abs(hash2(o.wx, o.wy, 9) * V.cypress.length) | 0]; shadeR = 8; footM = 0.5; }
      else if(o.kind === 'sfBench'){ spr = V.bench; propM = 0.9; footM = 0.8; }
      else if(o.kind === 'sfLamp'){ spr = sfLampsLit() ? V.lampOn : V.lampOff; propM = 4.5; footM = 0.4; } // v15: civil dusk
      else if(o.kind === 'sfShrub'){ spr = V.shrub[Math.abs(hash2(o.wx, o.wy, 10) * V.shrub.length) | 0]; propM = 0.8; footM = 0.7; }
      else if(o.kind === 'sfFlowerBed'){ spr = V.flowerbed[Math.abs(hash2(o.wx, o.wy, 11) * V.flowerbed.length) | 0]; propM = 0.35; footM = 0.9; }
      else if(o.kind === 'sfPlanter'){ spr = V.planter; propM = 0.7; footM = 0.6; }
      // v59: Mission garden palette — agave rosettes + echium towers
      else if(o.kind === 'sfAgave' && V.agave){ spr = V.agave[o.v || 0]; propM = 0.7; footM = 0.7; }
      else if(o.kind === 'sfEchium' && V.echium){ spr = V.echium[o.v || 0]; propM = 1.2; footM = 0.6; }
      else if(o.kind === 'sfCar' && V.car) spr = V.car[o.v * 2 + o.dir];
      else if(o.kind === 'sfParklet' && V.parklet) spr = V.parklet[o.dir || 0][o.v || 0];
      else if(o.kind === 'sfPole' && V.pole){ spr = V.pole[o.dir || 0]; footM = 0.3; }
      // v53: the furniture layer — low objects, real heights for the
      // sun throw, footprint discs so none of them float
      else if(o.kind === 'sfHydrant' && V.hydrant){ spr = V.hydrant[o.v || 0]; propM = 0.6; footM = 0.3; }
      else if(o.kind === 'sfTrashCan' && V.trashCan){ spr = V.trashCan; propM = 0.85; footM = 0.4; }
      else if(o.kind === 'sfNewsBox' && V.newsBox){ spr = V.newsBox[o.v || 0]; propM = 1.1; footM = 0.6; }
      else if(o.kind === 'sfBikeRack' && V.bikeRack){ spr = V.bikeRack[o.v || 0]; propM = 0.9; footM = 0.9; }
      else if(o.kind === 'sfBins' && V.bins){ spr = V.bins[o.dir || 0]; propM = 0.95; footM = 0.8; }
      else if(o.kind === 'sfPicnic' && V.blanket){
        // weather- and hour-gated lawn life: empty spots don't draw
        if(!sfPicnicOn(o)) continue;
        const sx = Math.round((o.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round(sfSY(o.y, ch));
        const sprB = V.blanket[o.v || 0];
        const bw = sprB.c.width * cam.zoom, bh = sprB.c.height * cam.zoom;
        // cloth lies ON the ground: no cast streak, just the baked
        // under-shadow plus a stub of sun-throw for the people/cooler
        if(!isNight() && SF_SUN.day > 0.08){
          const hmPx = 0.35 * SF_PXM * cam.zoom;
          sfSoftEllipse(sx + SF_SUN.x * hmPx * 0.5, sy + SF_SUN.y * hmPx * 0.5 * SF_TILT,
                        bw * 0.4, bh * 0.3, Math.atan2(SF_SUN.y * SF_TILT, SF_SUN.x),
                        0.18 * Math.min(1, SF_SUN.day + 0.3), 0.5);
        }
        ctx.drawImage(sprB.c, sx - bw / 2, sy - bh / 2, bw, bh);
        continue;
      }
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
        /* v51: parked sheet metal — the sunward rim of the roof/hood
           throws a short bright arc back when the sun is up (the same
           bearing that throws the car's shadow, flipped). */
        if(!isNight() && SF_SUN.day > 0.3){
          const sa = Math.atan2(-SF_SUN.y * SF_TILT, -SF_SUN.x);
          ctx.strokeStyle = `rgba(255,244,214,${(0.30 * SF_SUN.day *
                             (0.4 + 0.6 * SF_SUN.warm)).toFixed(3)})`;
          ctx.lineWidth = Math.max(1, 1.1 * cam.zoom);
          ctx.beginPath();
          ctx.ellipse(sx, sy - chh * 0.06, cw2 * 0.34, chh * 0.34, 0,
                      sa - 0.55, sa + 0.55);
          ctx.stroke();
        }
        continue;
      }
      if(o.kind === 'sfParklet' && sprC){
        /* v65: curb-lane parklet — a low deck (0.16m) with a 1.05m
           perimeter rail. Plan-view deck sprite over a contact pad plus
           the rail's short sun-throw on the asphalt; umbrella variants
           add their own canopy streak. */
        const sx = Math.round((o.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round(sfSY(o.y, ch));
        const cw2 = sprC.width * cam.zoom, chh = sprC.height * cam.zoom;
        ctx.fillStyle = 'rgba(16,13,9,0.3)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + cam.zoom, cw2 * 0.5, chh * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        if(!isNight() && SF_SUN.day > 0.08){
          const hmPx = 1.05 * SF_PXM * cam.zoom;
          const shx = SF_SUN.x * hmPx * 0.5, shy = SF_SUN.y * hmPx * 0.5 * SF_TILT;
          sfSoftEllipse(sx + shx, sy + shy,
                        cw2 * 0.52 + Math.hypot(shx, shy) * 0.4,
                        chh * 0.5, Math.atan2(shy, shx),
                        0.2 * Math.min(1, SF_SUN.day + 0.3),
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
          const hmPx = (o.kind === 'sfTree' ? (o.big ? 7.2 : 4.4) : o.kind === 'sfPalm' ? 6.4 :
                        o.kind === 'sfCypress' ? 6.0 :
                        o.kind === 'sfStreetTree' && o.v === 0 ? 4.8 : 3.6) * SF_PXM * cam.zoom;
          const shx = SF_SUN.x * hmPx * 0.5, shy = SF_SUN.y * hmPx * 0.5 * SF_TILT;
          const stretch = 1 + Math.hypot(SF_SUN.x, SF_SUN.y) * 0.55;
          const rot = Math.atan2(shy, shx);
          // v15: penumbral canopy shadow — umbra core, soft falloff edge;
          // the longer the throw, the wider the penumbra spreads
          const aS = 0.26 * Math.min(1, SF_SUN.day + 0.3),
                um = sfUmbra(Math.hypot(shx, shy));
          if(o.kind === 'sfPalm'){
            // v46: a palm crown is a rosette — its shadow is a star of
            // narrow frond streaks radiating from the crown-nut shadow,
            // plus the thin trunk streak back to the root
            sfSoftEllipse(sx + shx * 0.5, sy + shy * 0.5,
                          Math.hypot(shx, shy) * 0.5 + 1.5 * cam.zoom,
                          Math.max(1.2, 1.6 * cam.zoom), rot, aS * 0.8, um);
            for(let f = 0; f < 8; f++){
              const fa = f * (Math.PI * 2 / 8) + 0.45;
              const fl = (11 + (f % 3) * 2.5) * cam.zoom * (0.75 + stretch * 0.3);
              sfSoftEllipse(sx + shx + Math.cos(fa) * fl * 0.55,
                            sy + shy + Math.sin(fa) * fl * 0.55,
                            fl * 0.55, Math.max(1.1, 1.5 * cam.zoom), fa,
                            aS * 0.55, 0.45);
            }
          } else {
            const spec = sfCrownSpec(o.kind, o);
            if(spec){
              // v46: crown-true shade — each baked crown lobe re-stamped
              // on the ground along the sun throw; overlapping lobes build
              // the umbra, gaps between lobes stay lit (dappled edge)
              for(let li = 0; li < spec.lobes.length; li++){
                const lb = spec.lobes[li];
                const rr = Math.max(lb[2], lb[3]);
                sfSoftEllipse(
                  sx + ((spec.flip ? spec.w - lb[0] : lb[0]) - spec.w / 2) * cam.zoom + shx,
                  sy + (lb[1] - spec.h + 4) * cam.zoom + shy,
                  rr * cam.zoom * stretch,
                  Math.max(1.4 * cam.zoom, rr * 0.5 * cam.zoom * Math.max(0.45, SF_TILT)),
                  rot, aS * 0.55, um * 0.8);
              }
            } else {
              sfSoftEllipse(sx + shx, sy + shy,
                            shadeR * cam.zoom * stretch,
                            shadeR * 0.42 * cam.zoom * Math.max(0.4, SF_TILT), rot,
                            aS, um);
            }
            /* v69: leaf-gap sun flecks inside the pool — the canopy
               transmits, so its shade is a mosaic. A cloud overhead or a
               building's shade over the pool kills the beam -> no dapple. */
            const tr = sfLeafGapK(o.kind, o);
            if(tr){
              const lm = hmPx * 0.5 / (SF_PXM * cam.zoom),
                    lmx = o.x / SF_PXM + SF_SUN.x * lm,
                    lmy = o.y / SF_PXM + SF_SUN.y * lm,
                    dk = tr * SF_SUN.day *
                         (1 - Math.min(1, sfCloudShadow(lmx, lmy))) *
                         clamp(1 - sfCanyonShade(lmx, lmy, -1), 0, 1);
              if(dk > 0.02)
                sfDapple(sx + shx, sy + shy,
                         shadeR * cam.zoom * stretch * 0.9,
                         shadeR * 0.42 * cam.zoom * Math.max(0.4, SF_TILT) * 0.9,
                         rot, (o.wx * 31 + o.wy * 57) | 0, 0.3 * dk);
            }
          }
        }
        /* v64: the street tree stands in a sidewalk well — a cast-iron
           grate frame over a bare soil slot, flush with the paving
           (SFDPW standard cut-out; park trees keep their mulch collar).
           Drawn before the AO disc so the trunk's contact shade sits
           inside the pit. */
        if(o.kind === 'sfStreetTree' && cam.zoom >= 0.3){
          const wr = sfTreeWellM(o) * SF_PXM * cam.zoom,
                wyc = sy + cam.zoom,
                wl = Math.round(sx - wr),
                wt = Math.round(wyc - wr * SF_TILT),
                ww = Math.max(2, Math.round(wr * 2)),
                wh = Math.max(1, Math.round(wr * 2 * SF_TILT));
          ctx.fillStyle = isNight() ? '#1c1e22' : '#32363b';
          ctx.fillRect(wl, wt, ww, wh);
          const ir = wr * 0.62,
                il = Math.round(sx - ir),
                it = Math.round(wyc - ir * SF_TILT),
                iw = Math.max(1, Math.round(ir * 2)),
                ih = Math.max(1, Math.round(ir * 2 * SF_TILT));
          ctx.fillStyle = isNight() ? '#221a12' : '#4a3524';
          ctx.fillRect(il, it, iw, ih);
          // grate bars across the slot
          ctx.fillStyle = isNight() ? 'rgba(12,13,16,0.85)'
                                  : 'rgba(20,23,27,0.8)';
          const bw = Math.max(1, 0.9 * cam.zoom);
          for(let gi = -1; gi <= 1; gi++)
            ctx.fillRect(Math.round(sx + gi * wr * 0.45 - bw / 2), wt, bw, wh);
          // sun-side rim glint — the iron lip catches the same sun that
          // throws the crown shadow, on the edge facing it
          if(!isNight() && SF_SUN.day > 0.15){
            ctx.fillStyle = `rgba(226,212,180,${(0.4 * SF_SUN.day).toFixed(3)})`;
            if(Math.abs(SF_SUN.x) > Math.abs(SF_SUN.y)){
              const gx2 = SF_SUN.x < 0 ? wl : wl + ww - bw;
              ctx.fillRect(gx2, wt, bw, wh);
            } else {
              const gy3 = SF_SUN.y < 0 ? wt : wt + wh - bw;
              ctx.fillRect(wl, gy3, ww, bw);
            }
          }
        }
        // v19: grounding pass — every prop sits in a tight ambient-occlusion
        // disc at its footprint (also the only shade under overcast/night),
        // and low street furniture throws a short real-sun shadow scaled by
        // its true height (benches/lamps/planters used to float shadowless)
        if(footM){
          const fr = footM * SF_PXM * cam.zoom;
          ctx.fillStyle = `rgba(16,13,9,${isNight() ? 0.3 : 0.19})`;
          ctx.beginPath();
          ctx.ellipse(sx, sy + 1 * cam.zoom, fr, Math.max(1.5, fr * SF_TILT), 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if(propM && !isNight() && SF_SUN.day > 0.08){
          const hmPx = propM * SF_PXM * cam.zoom;
          const shx = SF_SUN.x * hmPx * 0.5, shy = SF_SUN.y * hmPx * 0.5 * SF_TILT;
          const len = Math.hypot(shx, shy);
          sfSoftEllipse(sx + shx, sy + shy,
                        footM * SF_PXM * cam.zoom + len * 0.45,
                        Math.max(2 * cam.zoom, footM * SF_PXM * cam.zoom * 0.7),
                        Math.atan2(shy, shx),
                        0.24 * Math.min(1, SF_SUN.day + 0.3), sfUmbra(len));
        }
        const pw = sprC.width * cam.zoom, ph = sprC.height * cam.zoom;
        const vegK = o.kind === 'sfTree' || o.kind === 'sfStreetTree' ||
                     o.kind === 'sfPalm' || o.kind === 'sfCypress';
        // v59: mulch ring — park trees stand in a kept dirt collar at the
        // dripline, not bare grass (SF Rec & Park beds the bases)
        if(o.kind === 'sfTree' && cam.zoom >= 0.35){
          const mr = (o.big ? 1.3 : 0.9) * SF_PXM * cam.zoom;
          ctx.fillStyle = '#4a3826';
          ctx.beginPath();
          ctx.ellipse(sx, sy + cam.zoom, mr, Math.max(1.5, mr * SF_TILT), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#5c4830';
          ctx.beginPath();
          ctx.ellipse(sx - mr * 0.18, sy + cam.zoom - mr * 0.1, mr * 0.72,
                      Math.max(1.2, mr * SF_TILT * 0.72), 0, 0, Math.PI * 2);
          ctx.fill();
          // a few bark chips + a light crescent where the sun catches
          ctx.fillStyle = '#6b5638';
          for(let mi = 0; mi < 5; mi++){
            const ma = phash(mi, o.wx + o.wy, 5730) * Math.PI * 2,
                  md = phash(mi, o.wy, 5731) * mr * 0.8;
            ctx.fillRect(Math.round(sx + Math.cos(ma) * md),
                         Math.round(sy + cam.zoom + Math.sin(ma) * md * SF_TILT),
                         Math.max(1, 1.2 * cam.zoom), Math.max(1, 0.9 * cam.zoom));
          }
        }
        // v31: leaf litter — wind-combed leaf/petal fall drifted leeward
        // of each crown (pink trumpet petals, ginkgo gold, plain leaf).
        // Deterministic per prop; denser under the big park crowns.
        if(vegK && cam.zoom >= 0.55 && !isNight()){
          const turnL = o.kind === 'sfTree' && sfTreeTurns(o);
          const LC = turnL ? ['#c8983a','#a4582c','#8a5c22','#e0bc50']
            : o.kind === 'sfStreetTree'
            ? (o.v === 1 ? ['#f0b8d0','#e0a0bc','#f8dce8'] :
               o.v === 2 ? ['#d8a84a','#c09038','#e8c86a'] :
                           ['#5a7a3a','#6b8a44','#48682e'])
            : ['#5a7a3a','#718c46','#486830'];
          // v55: turned crowns shed a real carpet, not a sprinkle
          const nL = turnL ? (o.big ? 42 : 24)
                   : o.big ? 22 : (o.kind === 'sfStreetTree' ? (o.v === 0 ? 15 : 9) : 12);
          const wdx = Math.cos(W.windAng || 0), wdy = Math.sin(W.windAng || 0);
          const lee = shadeR * 0.4 * (0.4 + SF_WX.gust * 0.8);
          for(let li = 0; li < nL; li++){
            const a = phash(li, o.wx * 7 + o.wy, 3460) * Math.PI * 2;
            const rr = (0.45 + phash(li, o.wy * 5 + o.wx, 3461) * 0.85) * shadeR * cam.zoom;
            ctx.fillStyle = LC[li % 3];
            ctx.fillRect(Math.round(sx + Math.cos(a) * rr + wdx * lee * cam.zoom),
                         Math.round(sy + Math.sin(a) * rr * SF_TILT + wdy * lee * SF_TILT * cam.zoom),
                         Math.max(1, 1.6 * cam.zoom), Math.max(1, 1.1 * cam.zoom));
          }
        }
        // v55: leaf-fall drizzle — on gusts, turned crowns shed: each
        // leaf cycles crown->ground on its own clock, fluttering sideways
        // on the wind vector. Same deterministic hash grammar as litter.
        if(o.kind === 'sfTree' && sfTreeTurns(o) && !isNight() &&
           SF_WX.gust > 0.12 && cam.zoom >= 0.45){
          const wdx2 = Math.cos(W.windAng || 0), wdy2 = Math.sin(W.windAng || 0);
          const nF = (o.big ? 7 : 4);
          const LCf = ['#d8a83e', '#b5622e', '#b0483e'];
          // v62: falling leaves leave from the leaned crown, not the
          // trunk — half the top-of-crown aerial displacement
          const dsh = sfTopLeanShift(o.x, o.y, ph * 0.5 / cam.zoom);
          for(let fi = 0; fi < nF; fi++){
            const ph2 = (SF_WX.t * (0.22 + phash(fi, o.wx, 5530) * 0.2) +
                         phash(fi, o.wy, 5531)) % 1;
            const fx = sx + dsh[0] + (phash(fi, o.wx + o.wy, 5532) - 0.5) * pw * 0.7 +
                       wdx2 * ph2 * 30 * cam.zoom +
                       Math.sin(ph2 * 11 + fi * 2.3) * 3.5 * cam.zoom;
            const fy = sy + dsh[1] - ph * 0.55 + ph2 * (ph * 0.5 + 8 * cam.zoom) +
                       wdy2 * ph2 * 12 * cam.zoom;
            ctx.fillStyle = LCf[fi % 3];
            ctx.globalAlpha = ph2 < 0.85 ? 1 : (1 - ph2) / 0.15;
            ctx.fillRect(Math.round(fx), Math.round(fy),
                         Math.max(1, 2 * cam.zoom), Math.max(1, 1.4 * cam.zoom));
          }
          ctx.globalAlpha = 1;
        }
        // v55: fallen fronds — real Mission palms drop brown fronds that
        // lie where they fall, rachis arcs combed downwind
        if(o.kind === 'sfPalm' && cam.zoom >= 0.55 &&
           phash(o.wx, o.wy, 5560) < 0.6){
          const wdx3 = Math.cos(W.windAng || 0), wdy3 = Math.sin(W.windAng || 0);
          const nFr = 1 + (phash(o.wx, o.wy, 5561) < 0.4 ? 1 : 0);
          for(let fi = 0; fi < nFr; fi++){
            const fa = phash(fi, o.wx, 5562) * Math.PI * 2,
                  fd = (4 + phash(fi, o.wy, 5563) * 7) * cam.zoom;
            const fx = sx + Math.cos(fa) * fd + wdx3 * 3 * cam.zoom,
                  fy = sy + Math.sin(fa) * fd * SF_TILT + wdy3 * 2 * cam.zoom;
            const hang = Math.atan2(wdy3 * SF_TILT, wdx3) +
                         (phash(fi, o.wy, 5564) - 0.5) * 0.7;
            ctx.strokeStyle = fi ? '#7a5a30' : '#8a6a38';
            ctx.lineWidth = Math.max(1, 1.3 * cam.zoom);
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.quadraticCurveTo(fx + Math.cos(hang) * 6 * cam.zoom,
                                 fy + Math.sin(hang) * 6 * cam.zoom - 2 * cam.zoom,
                                 fx + Math.cos(hang) * 11 * cam.zoom,
                                 fy + Math.sin(hang) * 11 * cam.zoom);
            ctx.stroke();
          }
        }
        // v49: queen-palm fruit trusses — heavy orange bunches hanging
        // just under the crown nut (real Mission palms carry them most
        // of the year; the parrots work them over)
        if(o.kind === 'sfPalm' && !isNight()){
          const nF = 6 + (Math.abs(hash2(o.wx, o.wy, 5120) * 5) | 0);
          // v62: the truss hangs at crown height, so it leans with the
          // crown — offset by the aerial displacement at 0.44·ph
          const tsh = sfTopLeanShift(o.x, o.y, ph * 0.44 / cam.zoom);
          const fcx = sx + tsh[0], fcy = sy + tsh[1] - ph * 0.44;
          for(let fi = 0; fi < nF; fi++){
            const fa = phash(fi, o.wx, 5121) * Math.PI * 2,
                  fr2 = phash(fi, o.wy, 5122) * 3.4 * cam.zoom;
            ctx.fillStyle = fi % 3 ? '#e08828' : '#c96e1e';
            ctx.fillRect(Math.round(fcx + Math.cos(fa) * fr2 - 1.5 * cam.zoom),
                         Math.round(fcy + Math.sin(fa) * fr2 * 0.5 +
                                    fi * 0.9 * cam.zoom),
                         Math.max(1, 2.2 * cam.zoom), Math.max(1, 1.7 * cam.zoom));
          }
        }
        // v6: canopy sway on the wind (trees only; storms rock harder)
        // v7: modulated by the gust envelope — canopies breathe in waves
        // v32: second-harmonic leaf shiver on gusts + the crown center
        // drifts downwind (foliage streams, trunk stays planted)
        const sway = vegK
          ? (Math.sin(SF_WX.t * 1.7 + o.x * 0.05 + o.y * 0.03) * 0.022 +
             Math.sin(SF_WX.t * 4.6 + o.x * 0.13 + o.y * 0.07) *
             0.010 * SF_WX.gust) *
            (0.3 + SF_WX.gust * 0.9 + W.storm * 1.4)
          : 0;
        // v62: aerial relief displacement — the crown leans radially
        // outward from the nadir, pivoting at the root so the trunk and
        // its ground shadow stay planted
        // v66: per-instance mirror — the tree's own hash flips its
        // genome crown, doubling the silhouettes (shade pass mirrors
        // the same lobes in sfCrownSpec)
        const flipC = o.kind === 'sfTree' &&
                      (Math.abs(hash2(o.wx, o.wy, 6007) * 2) | 0) === 1;
        ctx.save();
        sfTopLean(o.x, o.y, sx, sy);
        ctx.translate(sx, sy);
        if(sway) ctx.rotate(sway);
        if(flipC) ctx.scale(-1, 1);
        const wlx = sway ? Math.cos(W.windAng || 0) * sway * ph * 0.5 : 0,
              wly = sway ? Math.sin(W.windAng || 0) * sway * ph * 0.5 * SF_TILT : 0;
        ctx.drawImage(sprC, -pw / 2 + wlx, -ph + 4 * cam.zoom + wly, pw, ph);
        ctx.restore();
        // v31: crowns answer the REAL sun — a warm wash on the sunward
        // flank of the crown, cool sky-fill lee, and light-dapple
        // speckles where sun leaks through onto the shadowed ground
        if(vegK && !isNight() && SF_SUN.day > 0.2){
          const crx = pw * 0.42, cy2 = sy - ph * 0.58;
          const sux = SF_SUN.toX, suy = SF_SUN.toY * SF_TILT;
          const sl2 = Math.hypot(sux, suy) || 1;
          const hg = ctx.createRadialGradient(
            sx + sux / sl2 * crx * 0.4, cy2 + suy / sl2 * crx * 0.3, 1,
            sx + sux / sl2 * crx * 0.4, cy2 + suy / sl2 * crx * 0.3, crx);
          hg.addColorStop(0, `rgba(255,232,160,${0.20 * SF_SUN.day})`);
          hg.addColorStop(1, 'rgba(255,232,160,0)');
          ctx.fillStyle = hg;
          ctx.beginPath(); ctx.ellipse(sx, cy2, crx, crx * 0.72, 0, 0, Math.PI * 2); ctx.fill();
          const cg = ctx.createRadialGradient(
            sx - sux / sl2 * crx * 0.4, cy2 - suy / sl2 * crx * 0.3, 1,
            sx - sux / sl2 * crx * 0.4, cy2 - suy / sl2 * crx * 0.3, crx);
          cg.addColorStop(0, `rgba(70,90,130,${0.13 * SF_SUN.day})`);
          cg.addColorStop(1, 'rgba(70,90,130,0)');
          ctx.fillStyle = cg;
          ctx.beginPath(); ctx.ellipse(sx, cy2, crx, crx * 0.72, 0, 0, Math.PI * 2); ctx.fill();
          // dapple: bright pinpoints scattered inside the cast shadow
          const nD = o.big ? 14 : 7;
          const dcx = sx + SF_SUN.x * (o.big ? 7.2 : 4.4) * SF_PXM * cam.zoom * 0.5,
                dcy = sy + SF_SUN.y * (o.big ? 7.2 : 4.4) * SF_PXM * cam.zoom * 0.5 * SF_TILT;
          ctx.fillStyle = `rgba(255,240,190,${0.30 * SF_SUN.day})`;
          for(let di = 0; di < nD; di++){
            const a = phash(di, o.wx * 3 + o.wy, 3462) * Math.PI * 2;
            const rr = Math.sqrt(phash(di, o.wy * 11 + o.wx, 3463)) * shadeR * cam.zoom;
            ctx.fillRect(Math.round(dcx + Math.cos(a) * rr),
                         Math.round(dcy + Math.sin(a) * rr * 0.5), 1.6, 1.2);
          }
        }
        // v59: wet foliage — rain-soaked crowns darken (wet cuticle
        // absorbs light) and glint a cool sky sheen on the sun-facing
        // flank; the same SF_WX.wet that wets the walls and roofs
        if(vegK && SF_WX.wet > 0.25){
          const wetA = Math.min(0.9, SF_WX.wet);
          ctx.fillStyle = `rgba(14,24,18,${0.14 * wetA})`;
          ctx.beginPath();
          ctx.ellipse(sx, sy - ph * 0.55, pw * 0.46, ph * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          if(!isNight() && SF_SUN.day > 0.05){
            const sux2 = SF_SUN.toX, suy2 = SF_SUN.toY * SF_TILT;
            const sl3 = Math.hypot(sux2, suy2) || 1;
            ctx.strokeStyle = `rgba(200,220,235,${(0.22 * wetA *
                               Math.max(0.25, SF_SUN.day)).toFixed(3)})`;
            ctx.lineWidth = Math.max(1, 1.2 * cam.zoom);
            ctx.beginPath();
            ctx.ellipse(sx + sux2 / sl3 * pw * 0.14,
                        sy - ph * 0.58 + suy2 / sl3 * pw * 0.1,
                        pw * 0.34, ph * 0.3,
                        Math.atan2(suy2, sux2), -0.9, 0.9);
            ctx.stroke();
          }
        }
        // v15: lit lamp spills a warm sodium pool on the pavement
        if(o.kind === 'sfLamp' && sfLampsLit())
          sfLampPool(sx, sy, 3.4 * SF_PXM * cam.zoom);
      }
    } else {
      // v19: pawns ground like everything else — a tight contact core at
      // the feet plus a penumbral shadow thrown along the real sun vector
      // (1.6m occluder; length shortens/lengthens with solar elevation)
      const v = d.v;
      const sx = Math.round((v.x - cam.x) * cam.zoom + cw / 2);
      const sy = Math.round((v.y - cam.y) * cam.zoom * SF_TILT + ch / 2);
      ctx.fillStyle = `rgba(16,13,9,${isNight() ? 0.3 : 0.24})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2 * cam.zoom, 9 * cam.zoom, 4 * cam.zoom, 0, 0, Math.PI * 2);
      ctx.fill();
      if(!isNight() && SF_SUN.day > 0.08){
        const hmPx = 1.6 * SF_PXM * cam.zoom;
        const shx = SF_SUN.x * hmPx * 0.5, shy = SF_SUN.y * hmPx * 0.5 * SF_TILT;
        const len = Math.hypot(shx, shy);
        sfSoftEllipse(sx + shx, sy + shy,
                      9 * cam.zoom + len * 0.5,
                      Math.max(3 * cam.zoom, 4.5 * cam.zoom + len * 0.12),
                      Math.atan2(shy, shx),
                      0.28 * Math.min(1, SF_SUN.day + 0.3), sfUmbra(len));
      }
      // v62: pawns lean like every other upright mass — 1.6m is small,
      // but at the frame edges the aerial displacement is real
      ctx.save();
      sfTopLean(v.x, v.y, sx, sy);
      renderChibiPawn(d.v, cw, ch);
      // v25: umbrella — seen from above the canopy IS what you see;
      // it hides the pawn, tilts into the wind, seams + lee-side shade
      const uc = sfUmbrellaCol(v);
      if(uc){
        const ur = 10 * cam.zoom;
        const wdx = Math.cos(W.windAng), wdy = Math.sin(W.windAng);
        const tilt = Math.min(4, 1 + SF_WX.gust * 3) * cam.zoom;
        const ux2 = sx + wdx * tilt, uy2 = sy + wdy * tilt * SF_TILT - 5 * cam.zoom;
        ctx.fillStyle = uc;
        ctx.beginPath();
        ctx.ellipse(ux2, uy2, ur, ur * SF_TILT, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let k = 0; k < 4; k++){
          const a = k * Math.PI / 2 + 0.4;
          ctx.moveTo(ux2, uy2);
          ctx.lineTo(ux2 + Math.cos(a) * ur, uy2 + Math.sin(a) * ur * SF_TILT);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        ctx.beginPath();
        ctx.ellipse(ux2 - wdx * ur * 0.45, uy2 - wdy * ur * 0.45 * SF_TILT,
                    ur * 0.62, ur * 0.62 * SF_TILT, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // v27: locator ring — the subject ping under a ghosted building
  if(SF_TOPMARK){
    const [mx, my] = SF_TOPMARK;
    ctx.strokeStyle = 'rgba(150,215,255,0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(mx, my - 10 * cam.zoom, 7 * cam.zoom, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx, my - 22 * cam.zoom); ctx.lineTo(mx - 4 * cam.zoom, my - 28 * cam.zoom);
    ctx.moveTo(mx, my - 22 * cam.zoom); ctx.lineTo(mx + 4 * cam.zoom, my - 28 * cam.zoom);
    ctx.stroke();
  }

  // v20: pole-line wires overhead — catenary spans between utility poles
  // drape across the street canyons at their true 7m height (raised on
  // screen by the same vertical scale the building sprites use)
  if(SF_WIRES.length && cam.zoom > 0.5){
    ctx.strokeStyle = isNight() ? 'rgba(10,10,12,0.55)' : 'rgba(30,26,20,0.55)';
    ctx.lineWidth = Math.max(0.8, 1.1 * cam.zoom);
    const zpx = 7.0 * SF_PXM * cam.zoom,
          sag = 0.55 * SF_PXM * cam.zoom;
    for(const wg of SF_WIRES){
      const x1s = (wg.x1 - cam.x) * cam.zoom + cw / 2,
            y1s = sfSY(wg.y1, ch) - zpx,
            x2s = (wg.x2 - cam.x) * cam.zoom + cw / 2,
            y2s = sfSY(wg.y2, ch) - zpx;
      if((x1s < -40 && x2s < -40) || (x1s > cw + 40 && x2s > cw + 40) ||
         (y1s < -60 && y2s < -60) || (y1s > ch + 60 && y2s > ch + 60)) continue;
      ctx.beginPath();
      ctx.moveTo(x1s, y1s);
      ctx.quadraticCurveTo((x1s + x2s) / 2, (y1s + y2s) / 2 + sag * 2,
                           x2s, y2s);
      ctx.stroke();
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
      const a = Math.min(0.5, 0.55 * c.a * (0.3 + 0.7 * cover));
      // v56: the shadow IS the cloud — its own lobe silhouette plate
      // dropped along the sun vector, smeared along the boundary-layer
      // wind (the v41 street axis) so shade lanes keep their direction
      const sh = sfCloudShadowSprite(i);
      if(!sh) continue;
      const sc = (rr * 2) / sh.width;
      const wrot = Math.atan2(Math.sin(W.windAng) * SF_TILT, Math.cos(W.windAng));
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(wrot);
      ctx.scale(1.3, 0.6 * SF_TILT);
      ctx.globalAlpha = Math.min(1, a * 1.35);
      ctx.drawImage(sh, -sh.width * sc / 2, -sh.height * sc * 0.62,
                    sh.width * sc, sh.height * sc);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // 2b3. v47: sunbreaks — the lanes BETWEEN the shade streets are full
    // sun: warm pools pushed half a street-spacing across the wind from
    // each shadow, same lane-shaped smear, same drift. The diorama reads
    // as alternating shade/sun streets sweeping the neighborhood instead
    // of blobs over a flat-lit plate.
    if(SF_SUN.day > 0.12){
      const gb = sfGapBlobs();
      for(const gp of gb){
        const sx = (gp[0] * SF_PXM - cam.x) * cam.zoom + cw / 2;
        const sy = sfSY(gp[1] * SF_PXM, ch);
        const rr = Math.sqrt(gp[2]) * SF_PXM * cam.zoom * 1.15;
        if(sx + rr < 0 || sx - rr > cw || sy + rr < 0 || sy - rr > ch) continue;
        const a = Math.min(0.30, (0.11 + 0.14 * SF_SUN.warm) * gp[3] *
                  SF_SUN.day * (1 - cover * 0.55));
        if(a < 0.015) continue;
        const g = ctx.createRadialGradient(sx, sy, rr * 0.1, sx, sy, rr);
        g.addColorStop(0, `rgba(255,224,158,${a})`);
        g.addColorStop(0.65, `rgba(255,214,140,${a * 0.5})`);
        g.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        const wrot2 = Math.atan2(Math.sin(W.windAng) * SF_TILT, Math.cos(W.windAng));
        ctx.ellipse(sx, sy, rr * 1.6, rr * 0.5 * SF_TILT, wrot2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // 2b2. v24: the clouds THEMSELVES — the same cumulus field that throws
  // the shadows above drifts over the diorama as visible bodies: sun-lit
  // lobes baked for the current solar octant, lifted off the ground plane
  // like every tall thing in this view, translucent enough to read the
  // streets through their fringes. Shadow = same cloud pushed along the
  // sun vector; the pair stays causally linked.
  if(!isNight() && cover > 0.03){
    const cs2b = sfClouds(), nC2 = Math.ceil(cs2b.length * (0.25 + 0.75 * cover));
    const liftPx = 34 * 4.2 * cam.zoom;   // stylized diorama altitude
    const sunA = Math.atan2(SF_SUN.toY * SF_TILT, SF_SUN.toX);
    const sq = ((Math.round(sunA / (Math.PI / 4)) % 8) + 8) % 8;
    const warmQ = SF_SUN.warm > 0.45 ? 1 : 0;
    /* v41: body size tracks cover — fair-weather days get small discrete
       Cu humilis so the streets read as lanes with blue gaps; an overcast
       sky grows the same field into deck-sized masses. The shadow stays
       at full r: the lit core is denser than its cast penumbra. */
    const bodyS = 0.45 + cover * 0.85;
    for(let i = 0; i < nC2; i++){
      const spr = sfCloudSprite(i, sq, warmQ);
      if(!spr) break;
      const c = cs2b[i];
      const [cxm, cym] = sfCloudPos(c);
      const sx = (cxm * SF_PXM - cam.x) * cam.zoom + cw / 2;
      const sy = sfSY(cym * SF_PXM, ch) - liftPx;
      const w = spr.width * SF_PXM * cam.zoom * bodyS,
            h = spr.height * SF_PXM * cam.zoom * bodyS;
      if(sx + w / 2 < 0 || sx - w / 2 > cw ||
         sy + h / 2 < 0 || sy - h / 2 > ch) continue;
      ctx.globalAlpha = clamp(0.55 + cover * 1.25, 0, 0.9) * (0.6 + 0.4 * c.a);
      ctx.drawImage(spr, sx - w / 2, sy - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
  }

  // 2c. v6: rain streaks + gloom over the neighborhood
  //     v25: + impact rings where the streaks land
  if(W.rain > 0.08){
    sfRainOverlay(cw, ch, Math.sin(W.windAng) * 0.6);
    sfSplashOverlay(cw, 0, ch);
  }

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

  // 2d1b. v49: the wild parrot flock — red-masked parakeets commuting
  //   between the Mission's roost crowns. Airborne birds drop a true sun
  //   shadow on the ground via their altitude; perched birds speckle the
  //   crown rims green+red. Rain/night grounds the whole flock.
  if(!isNight()){
    for(let i = 0; i < SF_PARROT_N; i++){
      const b = sfParrotAt(i, SF_WX.t);
      if(!b) break;
      const gx = (b.x * SF_PXM - cam.x) * cam.zoom + cw / 2,
            gy = sfSY(b.y * SF_PXM, ch);
      const by2 = gy - b.z * 4.2 * cam.zoom;         // altitude lift, same 4.2px/m as buildings
      if(gx < -12 || gx > cw + 12 || by2 < -12 || gy > ch + 12) continue;
      if(b.fly){
        // altitude shadow: a flying bird still throws its (small) shade
        if(SF_SUN.day > 0.08)
          sfSoftEllipse(gx + SF_SUN.x * b.z * 4.2 * cam.zoom,
                        gy + SF_SUN.y * b.z * 4.2 * cam.zoom,
                        2.8 * cam.zoom, 1.5 * cam.zoom, 0,
                        0.17 * SF_SUN.day, 0.5);
        const sc2 = cam.zoom;
        ctx.save(); ctx.translate(gx, by2);
        ctx.rotate(Math.atan2(Math.sin(b.hdg) * SF_TILT, Math.cos(b.hdg)));
        const fl = b.flap;
        // long tail + pointed swept wings — the parakeet silhouette
        ctx.strokeStyle = '#2c7a34';
        ctx.lineWidth = Math.max(1, 1.3 * sc2);
        ctx.beginPath();
        ctx.moveTo(-1.6 * sc2, 0); ctx.lineTo(-4.8 * sc2, 0.4 * sc2);
        ctx.moveTo(-0.4 * sc2, 0);
        ctx.lineTo(-2.6 * sc2, (-3.4 + fl * 1.6) * sc2);
        ctx.moveTo(-0.4 * sc2, 0);
        ctx.lineTo(-2.6 * sc2, (3.4 - fl * 1.6) * sc2);
        ctx.stroke();
        ctx.fillStyle = '#3fae4e';
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.3 * sc2, 1.15 * sc2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d8382c';                  // red mask
        ctx.fillRect(1.4 * sc2, -0.7 * sc2, 1.6 * sc2, 1.4 * sc2);
        ctx.restore();
      } else if(cam.zoom >= 0.55){
        // roost whitewash — an occupied crown marks the ground below
        // with droppings (real parrot roosts whitewash the pavement)
        ctx.fillStyle = 'rgba(228,226,214,0.16)';
        ctx.beginPath();
        ctx.ellipse(gx, gy, 4.5 * cam.zoom, 2.6 * cam.zoom * SF_TILT,
                    0, 0, Math.PI * 2);
        ctx.fill();
        // perched speck on the crown rim — green body under a red mask
        ctx.fillStyle = '#379a44';
        ctx.fillRect(gx - 1.8 * cam.zoom, by2 - 1.8 * cam.zoom,
                     3.6 * cam.zoom, 3.6 * cam.zoom);
        ctx.fillStyle = '#d8382c';
        ctx.fillRect(gx - 1.2 * cam.zoom, by2 - 2.8 * cam.zoom,
                     2.4 * cam.zoom, 1.6 * cam.zoom);
      }
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

  // 2e. v7: fog fingers — low mist drifting through Dolores Park on humid
  //   days (v34: they also ride in ahead of Karl's front)
  const karlK = sfKarlK();
  if(!isNight() && (W.hum > 0.6 || karlK > 0.2)){
    const fogF = Math.max(clamp((W.hum - 0.6) * 2.2, 0, 0.8),
                          clamp(karlK * 0.55, 0, 0.5));
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

  // 2e2. v34+v50: Karl's tongue — the marine layer pouring over the
  //   upwind (ocean-side) edge of the map on the afternoon push. v50:
  //   the edge is the canyon-channelled front (sfKarlFrontPts) — a row
  //   of fingers aligned with the real streets — instead of a clipped
  //   half-plane. The same field drives sfKarlShade, so the shade under
  //   each finger lands exactly where the finger is drawn.
  if(karlK > 0.04 && !isNight()){
    const kf = sfKarlFrontField(), fpts = sfKarlFrontPts();
    if(fpts.length >= 3){
      const toS = p => [ (p[0] * SF_PXM - cam.x) * cam.zoom + cw / 2,
                         sfSY(p[1] * SF_PXM, ch) ];
      const pts = fpts.map(toS);
      // deep-fog anchor: a point well upwind of the whole front
      const up = [ pts[0][0] - kf.wxv * 900 * SF_PXM * cam.zoom,
                   pts[0][1] - kf.wyv * 900 * SF_PXM * cam.zoom * SF_TILT ];
      // front midpoint for the gradient aim
      const fm = pts[Math.floor(pts.length / 2)];
      // fog band polygon: modulated front + closure pushed far upwind
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        const pe = pts[pts.length - 1];
        ctx.lineTo(pe[0] - kf.wxv * 4000, pe[1] - kf.wyv * 4000);
        ctx.lineTo(pts[0][0] - kf.wxv * 4000, pts[0][1] - kf.wyv * 4000);
        ctx.closePath();
      };
      // the tongue's own cast shade on the ground beneath
      const sg2 = ctx.createLinearGradient(up[0], up[1], fm[0], fm[1]);
      sg2.addColorStop(0, `rgba(52,66,90,${0.18 + karlK * 0.46})`);
      sg2.addColorStop(0.8, `rgba(52,66,90,${0.09 + karlK * 0.22})`);
      sg2.addColorStop(1, 'rgba(52,66,90,0)');
      ctx.fillStyle = sg2; path(); ctx.fill();
      // the fog body: dense milky deck upwind, thinning at the fingers
      const kg = ctx.createLinearGradient(up[0], up[1],
                                          fm[0] + (fm[0] - up[0]) * 0.25,
                                          fm[1] + (fm[1] - up[1]) * 0.25);
      kg.addColorStop(0, `rgba(230,236,243,${0.34 + karlK * 0.55})`);
      kg.addColorStop(0.75, `rgba(228,234,240,${0.16 + karlK * 0.34})`);
      kg.addColorStop(1, 'rgba(228,234,240,0)');
      ctx.fillStyle = kg; path(); ctx.fill();
      /* billow lobes ON the polyline: each fingertip of the canyon front
         gets its own soft dome — the fog reads as separate pouring
         fingers, not one smeared wall. Lobes ride the breathing front. */
      const step = Math.max(2, Math.floor(pts.length / 14));
      for(let k = 0; k < pts.length; k += step){
        const bx = pts[k][0], by = pts[k][1];
        const rr = (52 + phash(k, 74, 3863) * 70) * (0.6 + cam.zoom);
        const rg = ctx.createRadialGradient(bx, by, 0, bx, by, rr);
        rg.addColorStop(0, `rgba(232,238,244,${karlK * 0.5})`);
        rg.addColorStop(0.62, `rgba(230,236,242,${karlK * 0.3})`);
        rg.addColorStop(1, 'rgba(230,236,242,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(bx, by, rr, 0, Math.PI * 2); ctx.fill();
        // sunlit crown on the sunward shoulder of each billow
        const hx = bx - SF_SUN.toX * rr * 0.4,
              hy = by - SF_SUN.toY * rr * 0.4 * SF_TILT;
        const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, rr * 0.6);
        hg.addColorStop(0, `rgba(255,240,214,${karlK * (0.14 + 0.3 * SF_SUN.warm)})`);
        hg.addColorStop(1, 'rgba(255,240,214,0)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(hx, hy, rr * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      const wrot0 = Math.atan2(Math.sin(W.windAng) * SF_TILT, Math.cos(W.windAng));
      /* deck veins: the sheet's interior isn't uniform — gravity
         currents hugging the same street corridors carve slightly
         clearer lanes just behind the front, so the fog reads as
         FLOWING down the grid, not parked on it */
      for(let i = 1; i < kf.N; i += 2){
        const v = kf.vs[i], u0 = sfKarlDepthAt(v) - 85;
        const bx = (kf.wxv * u0 + kf.nxv * v) * SF_PXM,
              by = (kf.wyv * u0 + kf.nyv * v) * SF_PXM;
        const sx = (bx - cam.x) * cam.zoom + cw / 2, sy = sfSY(by, ch);
        const len = (90 + phash(i, 95, 5204) * 140) * SF_PXM * cam.zoom;
        if(sx + len < 0 || sx - len > cw || sy + len < 0 || sy - len > ch) continue;
        const vg = ctx.createRadialGradient(sx, sy, 0, sx, sy, len);
        vg.addColorStop(0, `rgba(196,206,220,${karlK * 0.26})`);
        vg.addColorStop(1, 'rgba(196,206,220,0)');
        ctx.fillStyle = vg;
        ctx.beginPath();
        ctx.ellipse(sx, sy, len, len * 0.13 * SF_TILT + 3, wrot0, 0, Math.PI * 2);
        ctx.fill();
      }
      /* tendril leaks: where the canyon probe found a real street, thin
         streamers of fog run ahead of the front down the corridor —
         the first wisps a Mission resident actually sees coming */
      let leaks = 0;
      for(let i = 0; i <= kf.N && leaks < 9; i++){
        if(kf.cf[i] < 0.42 || phash(i, 93, 5202) < 0.30) continue;
        leaks++;
        const v = kf.vs[i], u0 = sfKarlDepthAt(v);
        const drift = (SF_WX.gust * 30 + Math.sin(SF_WX.t * 0.4 + i) * 8);
        const bx = (kf.wxv * (u0 + 60 + drift) + kf.nxv * v) * SF_PXM,
              by = (kf.wyv * (u0 + 60 + drift) + kf.nyv * v) * SF_PXM;
        const sx = (bx - cam.x) * cam.zoom + cw / 2, sy = sfSY(by, ch);
        const len = (70 + phash(i, 94, 5203) * 120) * SF_PXM * cam.zoom;
        if(sx + len < 0 || sx - len > cw || sy + len < 0 || sy - len > ch) continue;
        const tg = ctx.createRadialGradient(sx, sy, 0, sx, sy, len);
        tg.addColorStop(0, `rgba(228,234,241,${karlK * 0.30})`);
        tg.addColorStop(1, 'rgba(228,234,241,0)');
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.ellipse(sx, sy, len, len * 0.16 * SF_TILT + 4, wrot0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2e3. v60: ground-fog puffs — the world-anchored field, drawn over the
  //   roofs so the fog reads as a body lying ON the neighborhood
  sfGroundFogTop(cw, ch);

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
    const wa = 0.15 * SF_SUN.day * (0.5 + SF_SUN.warm * 0.8);
    lg.addColorStop(0, `rgba(70,88,130,${0.13 * SF_SUN.day})`);
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

/* v30: two pure facade gates shared between the street pass and the
   baked top-down sprite, so the skyline agrees in both views.
   sfGableFront -> false-front gable rise in meters (0 = flat cornice).
   Mission rows alternate flat cornices with triangular parapet gables —
   the gable lives IN the wall plane (a false front), so it never adds
   footprint and stays invisible to collision/shadow footprint logic.
   sfGarageU -> center u of a ground-floor garage opening (-1 = none).
   The raised-basement + garage + up-stoop front is THE San Francisco
   residential grammar: cars at grade, door up a flight. */
function sfGableFront(i, ei, L, isShop, floors){
  if(isShop || floors < 2 || L < 8 || phash(i, ei, 3300) >= 0.34) return 0;
  return 1.3 + phash(i, ei, 3301) * 0.8;
}
function sfGarageU(i, ei, L, isShop, style, mural, doorT){
  if(isShop || mural || style === 2 || L < 8.5 ||
     phash(i, ei, 3302) >= 0.5) return -1;
  return doorT + (phash(i, ei, 3303) < 0.5 ? -0.30 : 0.30);
}
/* v39: shaped parapet tops. 'gable' is the v30 triangular false front;
   'mission' is the curved Mission-Revival espanada pediment the
   commercial rows around Dolores wear over their signboards — a smooth
   arched crown centered on the front, sometimes with a round medallion.
   Like the gable it stands IN the wall plane (false front): zero
   footprint, invisible to collision and cast-shadow math. */
function sfParapetKind(i, ei, L, isShop, floors){
  if(sfGableFront(i, ei, L, isShop, floors) > 0) return 'gable';
  if(isShop && L > 9 && phash(i, ei, 3900) < 0.26) return 'mission';
  if(!isShop && floors >= 2 && L > 10 && phash(i, ei, 3901) < 0.07)
    return 'mission';
  return 'flat';
}
function sfMissionH(i, ei){ return 0.9 + phash(i, ei, 3902) * 0.7; }
/* v45: Queen Anne corner turret — the Mission's grandest facade gesture.
   A faceted drum swells off one end of a tall residential front, rises
   past the parapet, and wears a conical witch's hat. Returns the wall-u
   where the drum anchors (kept off the door and the garage bay) or -1.
   The same gate drives the baked top-down sprite so the roofline agrees
   in every camera. */
function sfTurretU(i, ei, L, isShop, floors){
  if(isShop || floors < 2 || L < 9.5 || phash(i, ei, 4400) >= 0.34) return -1;
  return phash(i, ei, 4401) < 0.5 ? 0.16 : 0.84;
}

function sfStreetWall(b, ei, x1, y1, x2, y2, ex, ey, L, nx, ny, hm, pr, F, night, fwd){
  const i = b.i;
  const wallBase = SF_WALL_COLS[Math.floor(phash(i, 7, 1300) * SF_WALL_COLS.length)];
  const TRIM = SF_TRIM_COLS[Math.floor(phash(i, 9, 1301) * SF_TRIM_COLS.length)];
  const isShop = !!b.name || phash(i, 5, 1303) < 0.12;
  const style = Math.floor(phash(i, 13, 1405) * 3); // 0 italianate 1 stick 2 marina
  // v18: Painted-Lady accent color + Clarion-style mural gate (same
  // hash keys drive the baked top-down sprite in sfBldCanvas)
  const ACC = sfAccentOf(i, TRIM, isShop);
  const mural = sfMuralWall(i, ei, L, isShop);
  const muralZ1 = mural ? Math.min(hm - 0.9,
    Math.max(2.8, hm * 2 / Math.max(1, Math.round(hm / 3)) - 0.2)) : 0;
  // v10: distance-tiered detail — 2 near / 1 mid / 0 silhouette. Micro-trim
  // (dentils, brackets, ivy, flower boxes) only resolves where the lens
  // can see it; mid keeps windows + bays; past ~160m a wall is massing
  // and parapet under marine haze — the detail pass is skipped entirely.
  const det = fwd < 85 ? 2 : (fwd < 160 ? 1 : 0);
  // v6: passing cloud dims the whole wall
  // v41: + the marine layer itself — facades inside Karl's sheet sit in
  // flat shadowless light, dimmed by the same front the top view draws
  const dim = (night ? 0.4 : 1) *
              (1 - 0.45 * sfCloudShadow(b.x / SF_PXM, b.y / SF_PXM)) *
              (1 - 0.5 * sfKarlShade(b.x / SF_PXM, b.y / SF_PXM));
  // v14: real sun exposure — n·L against the live solar bearing; sunward
  // faces warm up (golden when the sun is low), shaded faces take cool
  // sky fill. Shared formula with the baked sprites via sfSunWallCol.
  // v47: a facade standing in a lane-gap between cloud streets catches
  // unobstructed sun — the same sunbreak field the ground cells sample
  // lifts its key and warms the paint (shade lanes still win via dim)
  const sunK = sfSunFaceK(nx, ny);
  const gapK = night ? 0 : sfSunGapK(b.x / SF_PXM, b.y / SF_PXM) * SF_SUN.day;
  const lit = (0.55 + 0.5 * Math.max(0, sunK) * SF_SUN.day +
               0.05 * Math.max(0, sunK)) * dim * (1 + 0.30 * gapK);
  /* v57: wet facades — rain wets the walls it actually strikes. The
     soaking memory SF_WX.wet darkens every facade a little (damp paint),
     but the face looking INTO the wind takes the driven rain and soaks
     nearly twice as deep; Karl's sheet wets everything it swallows.
     Same wetness memory as the pavement, so wall and street dry together. */
  const wvx = Math.cos(W.windAng || 0), wvy = Math.sin(W.windAng || 0);
  const wetW = clamp(
      SF_WX.wet * (0.45 + 0.55 * Math.max(0, -(nx * wvx + ny * wvy))) +
      0.2 * sfKarlK(), 0, 1);
  const wallCol = (wetW > 0.03 ? shade(
      gapK > 0.3 ? mix(sfSunWallCol(wallBase, sunK), '#ffe0a8',
                       Math.min(0.3, gapK * 0.3))
                 : sfSunWallCol(wallBase, sunK),
      1 - 0.22 * wetW)
    : (gapK > 0.3 ? mix(sfSunWallCol(wallBase, sunK), '#ffe0a8',
                       Math.min(0.3, gapK * 0.3))
                  : sfSunWallCol(wallBase, sunK)));
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

  // v37: the lot sits on the landform — the base edge follows the true
  // elevation at each end (facades shear down the hill like real SF
  // rows). pr arrives already riding the lot datum (zb at the building
  // centroid), so ground-contact points subtract it back off.
  const zb = sfElevM(b.x / SF_PXM, b.y / SF_PXM);
  const eA = sfElevM(x1, y1) - zb, eB = sfElevM(x2, y2) - zb;
  const g1 = pr(x1, y1, eA), g2 = pr(x2, y2, eB),
        t1 = pr(x1, y1, hm), t2 = pr(x2, y2, hm),
        p1 = pr(x1, y1, hm + para), p2 = pr(x2, y2, hm + para);
  if(!g1 || !g2 || !t1 || !t2 || !p1 || !p2) return;

  /* v38: micro-LOD — a facade whose whole massing resolves under ~9px of
     gate height carries no resolvable Victorian detail (windows already
     cull below 2.5px). The far tier used to pay the full dressing pass —
     cornice box, gable, courses, stoop — for shapes no pixel can show.
     Now it draws only what survives at that scale: the cast shadow (the
     mass still shades real pavement), one sun-keyed flat fill, and the
     marine haze it dissolves into. Same silhouette, same physics. */
  if(det === 0 &&
     Math.max(g1[1], g2[1]) - Math.min(p1[1], p2[1], t1[1], t2[1]) < 9){
    quad([[x1, y1, eA + 0.02], [x2, y2, eB + 0.02],
          [x2 + SF_SUN.x * hm, y2 + SF_SUN.y * hm,
           sfElevM(x2 + SF_SUN.x * hm, y2 + SF_SUN.y * hm) - zb + 0.02],
          [x1 + SF_SUN.x * hm, y1 + SF_SUN.y * hm,
           sfElevM(x1 + SF_SUN.x * hm, y1 + SF_SUN.y * hm) - zb + 0.02]],
         `rgba(24,34,60,${0.06 + 0.14 * SF_SUN.day})`);
    ctx.fillStyle = wallCol;
    ctx.beginPath();
    ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
    ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p1[0], p1[1]);
    ctx.closePath(); ctx.fill();
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

  // v14: cast shadow — base edge extruded on the ground along the real
  // sun vector (direction + length = hm·cot(elevation)); v37: it lies
  // on the terrain it actually falls across, not the lot datum
  quad([[x1, y1, eA + 0.02], [x2, y2, eB + 0.02],
        [x2 + SF_SUN.x * hm, y2 + SF_SUN.y * hm,
         sfElevM(x2 + SF_SUN.x * hm, y2 + SF_SUN.y * hm) - zb + 0.02],
        [x1 + SF_SUN.x * hm, y1 + SF_SUN.y * hm,
         sfElevM(x1 + SF_SUN.x * hm, y1 + SF_SUN.y * hm) - zb + 0.02]],
       `rgba(24,34,60,${0.06 + 0.14 * SF_SUN.day})`);

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
  /* v42: coping flash — the parapet cap is a HORIZONTAL face: it takes
     direct sun even when the wall below faces away, so every roofline
     carries a thin warm line under a real sun. The canyon-shade pass
     (drawn after) cuts it wherever the opposite row actually shadows
     the crown — cause and effect stay in order. */
  if(!night && SF_SUN.day > 0.2){
    const ca = 0.26 * SF_SUN.day * (0.35 + 0.65 * SF_SUN.warm);
    ctx.strokeStyle = `rgba(255,228,172,${ca.toFixed(3)})`;
    ctx.lineWidth = Math.max(1, F * 0.12 / Math.max(1, (p1[2] + p2[2]) / 2));
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  }

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
    // crown, deepest when high sun strikes the facade head-on.
    // v51: the band is now SHEARED — the fascia stands ~0.55m off the
    // wall plane, so its shade slides along the wall on the sun's bearing
    // component and drops by tan(elevation), the same displacement law
    // the bay projections use. An oblique afternoon sun rakes the band
    // diagonally instead of pinning it straight under the roofline.
    const ea = night ? 0 : 0.3 * SF_SUN.day * Math.max(0, sunK);
    if(ea > 0.02){
      const snW = SF_SUN.x * nx + SF_SUN.y * ny;
      let duE = 0, dzE = 0;
      if(snW < -0.04){
        const tR = 0.55 / -snW;
        duE = (SF_SUN.x * ux + SF_SUN.y * uy) * tR;
        dzE = Math.tan(Math.max(0, SF_SUN.el)) * tR;
      }
      const eA = pr(x1 + ux * duE + nx * 0.02, y1 + uy * duE + ny * 0.02,
                    hm - 0.45 - dzE),
            eB = pr(x2 + ux * duE + nx * 0.02, y2 + uy * duE + ny * 0.02,
                    hm - 0.45 - dzE),
            eC = pr(x1 + ux * duE + nx * 0.02, y1 + uy * duE + ny * 0.02,
                    hm - 1.6 - dzE),
            eD = pr(x2 + ux * duE + nx * 0.02, y2 + uy * duE + ny * 0.02,
                    hm - 1.6 - dzE);
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

  // v33: canyon bounce — the pavement in front of a sun-shy wall is often
  // still in full sun (the shadow comes from this side of the street).
  // Asphalt + opposite facades throw ~15% of that light back as warm
  // uplight on the wall's lowest meters. Probed by the same canyon
  // ray-march that lays the street shadows, so cause and effect agree.
  if(!night && det > 0 && sunK < 0.12){
    const bk = sfBounceK(sunK,
      sfCanyonShade((x1 + x2) / 2 + nx * 5.5, (y1 + y2) / 2 + ny * 5.5, i));
    if(bk > 0.012){
      const bz = Math.min(2.4, hm * 0.4);
      const u1 = pr(x1, y1, 0), u2 = pr(x2, y2, 0),
            u3 = pr(x2, y2, bz), u4 = pr(x1, y1, bz);
      if(u1 && u2 && u3 && u4){
        const ug = ctx.createLinearGradient(0, Math.min(u3[1], u4[1]),
                                            0, Math.max(u1[1], u2[1]));
        ug.addColorStop(0, 'rgba(255,196,130,0)');
        ug.addColorStop(1, `rgba(255,196,130,${bk})`);
        ctx.fillStyle = ug;
        ctx.beginPath();
        ctx.moveTo(u1[0], u1[1]); ctx.lineTo(u2[0], u2[1]);
        ctx.lineTo(u3[0], u3[1]); ctx.lineTo(u4[0], u4[1]);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  /* v57: wet sheen — a soaked facade is a slick surface: the film of
     water returns the sky. The cool band strengthens up-wall where the
     film runs uninterrupted and fades to dry paint at the pavement
     splash zone (which reads darker, via the AO band above). */
  if(wetW > 0.06){
    const sT = Math.min(t1[1], t2[1]), sB = Math.max(g1[1], g2[1]);
    const sg2 = ctx.createLinearGradient(0, sT, 0, sB);
    sg2.addColorStop(0, `rgba(198,216,238,${(0.11 * wetW).toFixed(3)})`);
    sg2.addColorStop(0.55, `rgba(198,216,238,${(0.05 * wetW).toFixed(3)})`);
    sg2.addColorStop(0.92, 'rgba(198,216,238,0)');
    sg2.addColorStop(1, 'rgba(198,216,238,0)');
    ctx.fillStyle = sg2;
    ctx.beginPath();
    ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
    ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p1[0], p1[1]);
    ctx.closePath(); ctx.fill();
  }

  // v20: wood siding courses + rain-weathering on near walls. Real Mission
  // cladding is horizontal boards — faint courses read as texture, and
  // soot/water streaks bleeding down from sills and the cornice sell age.
  if(det === 2 && style !== 2){
    ctx.strokeStyle = 'rgba(30,24,18,0.11)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for(let z = 0.35; z < hm - 0.8; z += 0.34){
      if(mural && z < muralZ1 + 0.2) continue;
      const lA = pr(x1, y1, z), lB = pr(x2, y2, z);
      if(!lA || !lB) continue;
      ctx.moveTo(lA[0], lA[1]); ctx.lineTo(lB[0], lB[1]);
    }
    ctx.stroke();
    for(let k = 0; k < 3; k++){
      const su = 0.1 + phash(i, k + ei * 3, 1772) * 0.8,
            sz = hm * (0.45 + phash(k, i + ei, 1773) * 0.45),
            sl = 1.5 + phash(k, i + ei * 7, 1774) * 3.5;
      if(mural && sz - sl < muralZ1) continue;
      const sA = pr(x1 + ex * su, y1 + ey * su, sz),
            sB = pr(x1 + ex * su, y1 + ey * su, Math.max(0.35, sz - sl));
      if(!sA || !sB) continue;
      ctx.fillStyle = `rgba(40,32,22,${0.08 * dim})`;
      const wpx = Math.max(1.5, F * 0.05 / sA[2]);
      ctx.fillRect(sA[0] - wpx / 2, sA[1], wpx, sB[1] - sA[1]);
    }
  }

  // parapet coping + bracketed cornice
  ctx.strokeStyle = shade(TRIM, 1.05);
  ctx.lineWidth = Math.max(1, F * 0.022 / g1[2]);
  ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  // v20: the cornice is a real projecting box, not a paint line — a fascia
  // board stands ~0.5m off the wall face over a shaded soffit. The ACC
  // band/dentils on the wall plane behind read as its backing rail.
  {
    const cd = 0.5, cz0 = hm - 0.78, cz1 = hm + para * 0.8;
    // soffit underside — always in shade (sky never reaches under a cornice)
    quad([[x1, y1, cz0], [x2, y2, cz0],
          [x2 + nx * cd, y2 + ny * cd, cz0], [x1 + nx * cd, y1 + ny * cd, cz0]],
         shade(ACC, 0.6));
    // fascia face — same sun rule as the wall behind it
    quad([[x1 + nx * cd, y1 + ny * cd, cz0], [x2 + nx * cd, y2 + ny * cd, cz0],
          [x2 + nx * cd, y2 + ny * cd, cz1], [x1 + nx * cd, y1 + ny * cd, cz1]],
         shade(sfSunWallCol(ACC, sunK), Math.min(1.22, 1.04)));
    const fA = pr(x1 + nx * cd, y1 + ny * cd, cz1),
          fB = pr(x2 + nx * cd, y2 + ny * cd, cz1);
    if(fA && fB){
      ctx.strokeStyle = shade(ACC, 1.18);
      ctx.lineWidth = Math.max(1, F * 0.02 / g1[2]);
      ctx.beginPath(); ctx.moveTo(fA[0], fA[1]); ctx.lineTo(fB[0], fB[1]); ctx.stroke();
    }
  }
  const cA = pr(x1, y1, hm - 0.45), cB = pr(x2, y2, hm - 0.45);
  if(cA && cB){
    ctx.strokeStyle = ACC;
    ctx.lineWidth = Math.max(1.5, F * 0.05 / g1[2]);
    ctx.beginPath(); ctx.moveTo(cA[0], cA[1]); ctx.lineTo(cB[0], cB[1]); ctx.stroke();
    // dentil row under the cornice band
    const dA = pr(x1, y1, hm - 0.72), dB = pr(x2, y2, hm - 0.72);
    if(dA && dB && det === 2){
      const nD = Math.max(2, Math.floor(Math.hypot(cB[0] - cA[0], cB[1] - cA[1]) / 7));
      ctx.fillStyle = shade(ACC, 0.8);
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
      ctx.fillStyle = ACC;
      ctx.fillRect(pb2[0] - 1.6, pt2[1], 3.2, pb2[1] - pt2[1]);
      ctx.fillRect(pb2[0] - 2.6, pt2[1], 5.2, Math.max(1.5, (pb2[1] - pt2[1]) * 0.25));
    }
  }

  /* v30: false-front gable — a triangular parapet pediment rises over the
     cornice on a third of tall residential fronts. It stands in the wall
     plane (a real false front: the roof hides behind it), gets the same
     sun key as the wall, fish-scale shingles + rake trim when the lens is
     near, and a finial rod at the apex. Drawn before the det-0 return so
     the far skyline keeps its sawtooth. */
  const gableH = sfGableFront(i, ei, L, isShop, Math.max(1, Math.round(hm / 3)));
  if(gableH > 0){
    const gz0 = hm + para * 0.55, gz1 = hm + para + gableH,
          gmx = x1 + ex * 0.5, gmy = y1 + ey * 0.5;
    const ga = pr(x1, y1, gz0), gb = pr(x2, y2, gz0), gm = pr(gmx, gmy, gz1);
    if(ga && gb && gm){
      // pediment face — sun-keyed like the wall, a shade darker
      const gcol = sfSunWallCol(shade(wallBase, 0.88), sunK);
      ctx.fillStyle = gcol;
      ctx.beginPath();
      ctx.moveTo(ga[0], ga[1]); ctx.lineTo(gb[0], gb[1]);
      ctx.lineTo(gm[0], gm[1]); ctx.closePath(); ctx.fill();
      // fish-scale shingles: scallop arcs row over row, clipped to the
      // pediment — the signature texture of a Queen Anne gable end
      if(det === 2){
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ga[0], ga[1]); ctx.lineTo(gb[0], gb[1]);
        ctx.lineTo(gm[0], gm[1]); ctx.closePath(); ctx.clip();
        ctx.strokeStyle = 'rgba(24,18,12,0.30)'; ctx.lineWidth = 1;
        const rows = Math.max(2, Math.floor(gableH / 0.28));
        for(let r = 0; r < rows; r++){
          const u = (r + 1) / (rows + 1);
          const rx = ga[0] + (gm[0] - ga[0]) * u, ry = ga[1] + (gm[1] - ga[1]) * u;
          const lx = gb[0] + (gm[0] - gb[0]) * u, ly = gb[1] + (gm[1] - gb[1]) * u;
          const wpx = lx - rx, nSc = Math.max(1, Math.floor(Math.abs(wpx) / 9));
          for(let k = 0; k < nSc; k++){
            const sx = rx + wpx * (k + 0.5) / nSc;
            ctx.beginPath();
            ctx.arc(sx, ry, Math.abs(wpx) / nSc * 0.55, Math.PI, 0, false);
            ctx.stroke();
          }
        }
        // round attic vent centered in the gable
        const vc = pr(gmx, gmy, gz0 + gableH * 0.42);
        if(vc){
          const vr = Math.max(2, F * 0.18 / vc[2]);
          ctx.fillStyle = shade(gcol, 0.7);
          ctx.beginPath(); ctx.arc(vc[0], vc[1], vr, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = shade(ACC, 1.05);
          ctx.beginPath(); ctx.arc(vc[0], vc[1], vr, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
      }
      // rake trim — bright accent lines on both sloped edges
      ctx.strokeStyle = shade(ACC, 1.08); ctx.lineWidth = Math.max(1.2, F * 0.03 / ga[2]);
      ctx.beginPath();
      ctx.moveTo(ga[0], ga[1]); ctx.lineTo(gm[0], gm[1]);
      ctx.lineTo(gb[0], gb[1]);
      ctx.stroke();
      // apex finial: short rod + ball
      const fm = pr(gmx, gmy, gz1 + 0.32);
      if(fm && det >= 1){
        ctx.strokeStyle = shade(ACC, 0.75); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(gm[0], gm[1]); ctx.lineTo(fm[0], fm[1]); ctx.stroke();
        ctx.fillStyle = shade(ACC, 1.1);
        ctx.beginPath(); ctx.arc(fm[0], fm[1], Math.max(1.4, F * 0.06 / fm[2]), 0, Math.PI * 2); ctx.fill();
      }
      // the gable throws a sliver of shade onto the fascia below when the
      // sun strikes this face
      const snW2 = SF_SUN.x * nx + SF_SUN.y * ny;
      if(!night && snW2 < -0.1 && SF_SUN.day > 0.2){
        const shp = Math.min(0.5, 0.6 / -snW2 * Math.tan(Math.max(0, SF_SUN.el)) * 0.3);
        quad([[x1, y1, gz0 - shp], [x2, y2, gz0 - shp],
              [x2, y2, gz0 + 0.02], [x1, y1, gz0 + 0.02]],
             `rgba(20,14,8,${0.22 * SF_SUN.day})`);
      }
      // the gable fades into the same marine haze as the wall under it
      const ghz = sfHazeA(fwd);
      if(ghz > 0.02){
        ctx.globalAlpha = ghz; ctx.fillStyle = `rgb(${SF_WX.hazeRGB})`;
        ctx.beginPath();
        ctx.moveTo(ga[0], ga[1]); ctx.lineTo(gb[0], gb[1]);
        ctx.lineTo(gm[0], gm[1]); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  /* v39: Mission-Revival espanada — a smooth arched pediment rises over
     the parapet on a quarter of wide storefronts (the grammar the old
     Mission theaters and churches wear). Same false-front physics as
     the gable: it stands in the wall plane, sun-keyed, with a stepped
     shoulder at each side and a round medallion under the crown when
     the lens is near. Drawn before the det-0 return so the far skyline
     keeps its arches. */
  if(gableH <= 0 && sfParapetKind(i, ei, L, isShop, Math.max(1, Math.round(hm / 3))) === 'mission'){
    const mh = sfMissionH(i, ei),
          gz0 = hm + para * 0.5, gz1 = hm + para + mh,
          uA = 0.24, uB = 0.76, uM = 0.5;
    // the crown curve samples a smooth arch in wall space; the pediment
    // face is the fan between that curve and the parapet base line
    const NARC = 8, arc = [], base = [];
    let ok2 = true;
    for(let k = 0; k <= NARC; k++){
      const u = uA + (uB - uA) * k / NARC;
      const zc = gz0 + mh * Math.sin(Math.PI * k / NARC); // 0->1->0 arch
      const pq = pr(x1 + ex * u, y1 + ey * u, Math.min(zc, gz1));
      const bq = pr(x1 + ex * u, y1 + ey * u, gz0);
      if(!pq || !bq){ ok2 = false; break; }
      arc.push(pq); base.push(bq);
    }
    if(ok2){
      const mcol = sfSunWallCol(shade(wallBase, 0.92), sunK);
      // stepped shoulders: small squared ears where the arch springs
      quad([[x1 + ex * (uA - 0.03), y1 + ey * (uA - 0.03), gz0],
            [x1 + ex * uA, y1 + ey * uA, gz0],
            [x1 + ex * uA, y1 + ey * uA, gz0 + mh * 0.28],
            [x1 + ex * (uA - 0.03), y1 + ey * (uA - 0.03), gz0 + mh * 0.28]],
           shade(mcol, 0.96));
      quad([[x1 + ex * uB, y1 + ey * uB, gz0],
            [x1 + ex * (uB + 0.03), y1 + ey * (uB + 0.03), gz0],
            [x1 + ex * (uB + 0.03), y1 + ey * (uB + 0.03), gz0 + mh * 0.28],
            [x1 + ex * uB, y1 + ey * uB, gz0 + mh * 0.28]],
           shade(mcol, 0.96));
      ctx.fillStyle = mcol;
      ctx.beginPath();
      ctx.moveTo(base[0][0], base[0][1]);
      for(let k = 0; k <= NARC; k++) ctx.lineTo(arc[k][0], arc[k][1]);
      ctx.lineTo(base[NARC][0], base[NARC][1]);
      ctx.closePath(); ctx.fill();
      // crown trim follows the arch; a short coping band caps the peak
      ctx.strokeStyle = shade(ACC, 1.08);
      ctx.lineWidth = Math.max(1.2, F * 0.03 / arc[0][2]);
      ctx.beginPath();
      ctx.moveTo(arc[0][0], arc[0][1]);
      for(let k = 1; k <= NARC; k++) ctx.lineTo(arc[k][0], arc[k][1]);
      ctx.stroke();
      if(det === 2){
        // round medallion under the crown — the espanada's bullseye
        const vc = pr(x1 + ex * uM, y1 + ey * uM, gz0 + mh * 0.55);
        if(vc){
          const vr = Math.max(1.6, F * 0.13 / vc[2]);
          ctx.fillStyle = shade(ACC, 0.85);
          ctx.beginPath(); ctx.arc(vc[0], vc[1], vr, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = shade(ACC, 1.12); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(vc[0], vc[1], vr, 0, Math.PI * 2); ctx.stroke();
        }
      }
      // marine haze on the pediment, same as the gable's
      const mhz2 = sfHazeA(fwd);
      if(mhz2 > 0.02){
        ctx.globalAlpha = mhz2; ctx.fillStyle = `rgb(${SF_WX.hazeRGB})`;
        ctx.beginPath();
        ctx.moveTo(base[0][0], base[0][1]);
        for(let k = 0; k <= NARC; k++) ctx.lineTo(arc[k][0], arc[k][1]);
        ctx.lineTo(base[NARC][0], base[NARC][1]);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
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
    ctx.strokeStyle = shade(ACC, 1.05);
    ctx.lineWidth = Math.max(0.6, F * 0.012 / g1[2]);
    ctx.beginPath(); ctx.moveTo(sA[0], sA[1]); ctx.lineTo(sB[0], sB[1]); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // capsule window: trim frame + sky-reflection glass + sill + lintel.
  // v51: pnx/pny let a caller hand the pane's OWN outward normal (bay
  // cheeks sit at 45° to the wall) so the specular pass keys each facet.
  const drawWin = (wx, wy, zB, zT, wm, pnx, pny) => {
    const pb = pr(wx, wy, zB), pt = pr(wx, wy, zT);
    if(!pb || !pt) return;
    const wh = pb[1] - pt[1], ww = wm * F / pb[2];
    if(ww < 2 || wh < 2.5) return;
    const r = ww / 2;
    // v20: real window reveals — sashes sit ~13cm deep in the wall. The
    // side jambs take sun independently (the jamb facing the solar
    // bearing lights up, the other falls dark) and the header reveal is
    // always shadow — every opening gets honest depth instead of a decal.
    if(det === 2){
      const rw = wm / 2, ins = 0.18;
      const jx = wx - ux * rw, jy = wy - uy * rw,
            kx = wx + ux * rw, ky = wy + uy * rw;
      const kL = sfSunFaceK(ux, uy), kR = sfSunFaceK(-ux, -uy);
      quad([[jx, jy, zB], [jx - nx * ins, jy - ny * ins, zB],
            [jx - nx * ins, jy - ny * ins, zT], [jx, jy, zT]],
           shade(wallCol, 0.5 + 0.35 * Math.max(0, kL)));
      quad([[kx, ky, zB], [kx, ky, zT],
            [kx - nx * ins, ky - ny * ins, zT], [kx - nx * ins, ky - ny * ins, zB]],
           shade(wallCol, 0.5 + 0.35 * Math.max(0, kR)));
      quad([[jx, jy, zT], [kx, ky, zT],
            [kx - nx * ins, ky - ny * ins, zT], [jx - nx * ins, jy - ny * ins, zT]],
           shade(wallCol, 0.42));
    }
    ctx.fillStyle = ACC;
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
      /* v51: the pane is a vertical mirror of the street scene, not a
         flat blue card — upper glass returns the bright sky band near
         the horizon (warming as the sun drops), mid-glass the open sky,
         lower glass the shaded facades/pavement across the street. */
      const skyHi = SF_SUN.day > 0.15
        ? mix('#9db8cc', '#f2c89a', SF_SUN.warm * 0.6) : '#8ea8bc';
      gg.addColorStop(0, skyHi);
      gg.addColorStop(0.45, '#7c9cb4');
      gg.addColorStop(1, '#57646e');
    }
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(pb[0] - r, pb[1]); ctx.lineTo(pb[0] - r, pt[1] + r);
    ctx.arc(pb[0], pt[1] + r, r, Math.PI, 0, true);
    ctx.lineTo(pb[0] + r, pb[1]); ctx.closePath(); ctx.fill();
    // v43: what's inside is a real miniature room now — floor line, a
    // furnishing silhouette, and often a warm lamp or an occupant. The
    // room reads darker toward the top (ceiling) like the door-teleport
    // interiors do; the glass still catches the sky on top of it all.
    if(seeIn && ww > 6){
      const roomSeed = (i * 131 + Math.round(wx * 31) * 7 + Math.round(zB * 17)) >>> 0;
      const occ = phash(roomSeed, 0, 4321);       // furnishing variant
      const lamOn = phash(roomSeed, 1, 4322) < 0.34; // lamp left on by day
      // floor line: warm boards in the bottom fifth of the opening
      ctx.fillStyle = 'rgba(122,88,52,0.9)';
      ctx.fillRect(pb[0] - r, pb[1] - wh * 0.20, ww, wh * 0.20);
      ctx.strokeStyle = 'rgba(24,16,10,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pb[0] - r, pb[1] - wh * 0.20);
      ctx.lineTo(pb[0] + r, pb[1] - wh * 0.20); ctx.stroke();
      if(occ < 0.14){              // venetian blinds, half down
        ctx.fillStyle = 'rgba(214,204,180,0.85)';
        ctx.fillRect(pb[0] - r, pt[1] + wh * 0.06, ww, wh * 0.42);
        ctx.strokeStyle = 'rgba(80,66,48,0.8)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let k = 1; k < 5; k++){
          const yy = pt[1] + wh * 0.06 + wh * 0.42 * k / 5;
          ctx.moveTo(pb[0] - r, yy); ctx.lineTo(pb[0] + r, yy);
        }
        ctx.stroke();
      } else if(occ < 0.30){       // gathered side curtains, room behind
        ctx.fillStyle = 'rgba(188,168,140,0.9)';
        ctx.fillRect(pb[0] - r, pt[1], ww * 0.22, wh);
        ctx.fillRect(pb[0] + r - ww * 0.22, pt[1], ww * 0.22, wh);
        ctx.fillStyle = 'rgba(168,148,120,0.9)';   // tie-back folds
        ctx.fillRect(pb[0] - r, pt[1] + wh * 0.5, ww * 0.22, wh * 0.06);
        ctx.fillRect(pb[0] + r - ww * 0.22, pt[1] + wh * 0.5, ww * 0.22, wh * 0.06);
      } else if(occ < 0.40){       // plant on the sill
        ctx.fillStyle = 'rgba(46,90,40,0.9)';
        ctx.beginPath();
        ctx.arc(pb[0], pb[1] - wh * 0.28, r * 0.42, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(pb[0] - r * 0.3, pb[1] - wh * 0.22, r * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(90,52,30,0.9)';
        ctx.fillRect(pb[0] - r * 0.22, pb[1] - wh * 0.18, r * 0.44, wh * 0.12);
      } else if(occ < 0.52){       // bookshelf wall: two shelf rows of spines
        for(let s = 0; s < 2; s++){
          const sy = pt[1] + wh * (0.42 + s * 0.26);
          ctx.fillStyle = 'rgba(30,20,12,0.9)';
          ctx.fillRect(pb[0] - r + 1, sy + wh * 0.16, ww - 2, 1.5);
          const nb = Math.max(3, Math.floor(ww / 4));
          for(let k = 0; k < nb; k++){
            const bh2 = wh * (0.09 + phash(k, roomSeed, 4323) * 0.07);
            ctx.fillStyle = ['rgba(138,74,58,0.95)', 'rgba(58,90,122,0.95)',
                             'rgba(122,138,74,0.95)', 'rgba(176,144,90,0.95)'][Math.floor(phash(k, roomSeed, 4324) * 4)];
            ctx.fillRect(pb[0] - r + 2 + k * (ww - 4) / nb, sy + wh * 0.16 - bh2,
                         (ww - 4) / nb - 1, bh2);
          }
        }
      } else if(occ < 0.64){       // someone home: shoulders at a table edge
        const px2 = pb[0] + (phash(roomSeed, 2, 4325) - 0.5) * ww * 0.4;
        const fh = wh * 0.34;
        ctx.fillStyle = 'rgba(26,16,10,0.9)';
        ctx.fillRect(px2 - ww * 0.16, pb[1] - wh * 0.20 - 2, ww * 0.32, 3); // table top
        ctx.beginPath();
        ctx.arc(px2, pb[1] - wh * 0.20 - fh * 0.9, ww * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(px2 - ww * 0.13, pb[1] - wh * 0.20 - fh * 0.72, ww * 0.26, fh * 0.55);
      } else if(occ < 0.76){       // hanging pendant, cone glow down
        const px2 = pb[0];
        ctx.strokeStyle = 'rgba(14,10,6,0.9)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px2, pt[1]); ctx.lineTo(px2, pt[1] + wh * 0.3); ctx.stroke();
        ctx.fillStyle = 'rgba(38,56,46,0.95)';
        ctx.beginPath();
        ctx.moveTo(px2 - ww * 0.13, pt[1] + wh * 0.3);
        ctx.lineTo(px2 + ww * 0.13, pt[1] + wh * 0.3);
        ctx.lineTo(px2 + ww * 0.08, pt[1] + wh * 0.22);
        ctx.lineTo(px2 - ww * 0.08, pt[1] + wh * 0.22);
        ctx.closePath(); ctx.fill();
        const lg = ctx.createRadialGradient(px2, pt[1] + wh * 0.32, 1,
                                            px2, pt[1] + wh * 0.32, ww * 0.5);
        lg.addColorStop(0, 'rgba(255,206,120,0.5)');
        lg.addColorStop(1, 'rgba(255,206,120,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(px2 - ww * 0.5, pt[1] + wh * 0.1, ww, wh * 0.6);
      } else if(occ < 0.88){       // framed print + radiator under the sill
        ctx.fillStyle = 'rgba(40,28,18,0.9)';
        ctx.fillRect(pb[0] - ww * 0.14, pt[1] + wh * 0.14, ww * 0.28, wh * 0.2);
        ctx.fillStyle = 'rgba(140,160,180,0.8)';
        ctx.fillRect(pb[0] - ww * 0.11, pt[1] + wh * 0.17, ww * 0.22, wh * 0.14);
        ctx.fillStyle = 'rgba(200,196,186,0.55)';
        for(let k = 0; k < 4; k++)
          ctx.fillRect(pb[0] - r + 2 + k * ww * 0.22, pb[1] - wh * 0.18, ww * 0.1, wh * 0.14);
      }
      // a lit table lamp warms the whole reveal — day or dusk
      if(lamOn || litWin){
        const lx2 = pb[0] + ww * 0.28, ly2 = pb[1] - wh * 0.22;
        const lg = ctx.createRadialGradient(lx2, ly2, 1, lx2, ly2, ww * 0.45);
        lg.addColorStop(0, 'rgba(255,196,110,0.55)');
        lg.addColorStop(1, 'rgba(255,196,110,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(lx2 - ww * 0.45, ly2 - ww * 0.45, ww * 0.9, ww * 0.9);
        ctx.fillStyle = 'rgba(255,226,160,0.9)';
        ctx.fillRect(lx2 - 1.5, ly2 - 4, 3, 4);
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
    /* v51: true specular glint — the pane throws the sun back at the
       lens only when the eye sits near the reflected ray. R·S computed
       in 3D (solar elevation counts: an upstairs pane mirrors a high sun
       DOWN toward street level, so looking up at glass is exactly when
       it blazes) against the pane's own normal, so the 45° cheeks of a
       canted bay flash on a different heading than the flat wall. Sash
       tilt varies pane to pane — a per-window jitter keeps the row from
       igniting in lockstep. Off-axis sun-facing glass keeps a faint
       warm sheen instead of the old full-strength blaze. */
    if(!night && SF_SUN.day > 0.15){
      const gnx = pnx === undefined ? nx : pnx,
            gny = pny === undefined ? ny : pny;
      const vdx = SF_EYE.x - wx, vdy = SF_EYE.y - wy,
            vdz = SF_EYE.h - (zB + zT) / 2;
      const vd = Math.hypot(vdx, vdy, vdz) || 1;
      const vx = vdx / vd, vy = vdy / vd, vz = vdz / vd;
      const cE = Math.cos(Math.max(0, SF_SUN.el)),
            sE = Math.sin(Math.max(0, SF_SUN.el));
      const nV = gnx * vx + gny * vy;
      const spec = (2 * nV * gnx - vx) * SF_SUN.toX * cE +
                   (2 * nV * gny - vy) * SF_SUN.toY * cE - vz * sE;
      const jitter = 0.4 + 0.6 * phash(Math.round(wx * 13),
                                       Math.round(zB * 7), i + 3320);
      const glint = Math.pow(Math.max(0, spec), 2.5) * SF_SUN.day * jitter;
      if(glint > 0.05){
        ctx.fillStyle = `rgba(255,246,214,${Math.min(0.8, glint * 0.72)})`;
        ctx.fillRect(pb[0] - r * 0.75, pt[1] + wh * 0.08, r * 1.1,
                     Math.max(1.5, wh * 0.36));
      } else if(SF_SUN.day > 0.3 && sfSunFaceK(gnx, gny) > 0.35){
        ctx.fillStyle =
          `rgba(255,242,205,${0.10 * SF_SUN.day * sfSunFaceK(gnx, gny)})`;
        ctx.fillRect(pb[0] - r * 0.7, pt[1] + wh * 0.12, r * 0.95,
                     Math.max(1.5, wh * 0.3));
      }
    }
    ctx.strokeStyle = shade(ACC, 0.9); ctx.lineWidth = Math.max(0.5, ww * 0.06);
    ctx.beginPath();
    ctx.moveTo(pb[0] - r, pt[1] + wh * 0.45); ctx.lineTo(pb[0] + r, pt[1] + wh * 0.45);
    ctx.stroke();
    // v30: lived-in dressing — some sashes sit half-open (the lower sash
    // raised shows a room-dark gap at the meeting rail), a few sills
    // carry a window AC unit, a few upper windows get a Juliette rail
    if(det === 2 && !litWin && !night){
      if(ww > 5 && phash(Math.round(wx * 19), Math.round(zB * 23), i + 3310) < 0.11){
        ctx.fillStyle = 'rgba(18,14,10,0.72)';
        ctx.fillRect(pb[0] - r, pt[1] + wh * 0.42, ww, wh * 0.30);
        ctx.fillStyle = 'rgba(230,222,200,0.7)';
        ctx.fillRect(pb[0] - r, pt[1] + wh * 0.40, ww, Math.max(1, wh * 0.03));
      }
      if(ww > 5 && phash(Math.round(wx * 23), Math.round(zB * 29), i + 3311) < 0.07){
        const aw = ww * 0.55, ah = Math.max(2, wh * 0.22);
        ctx.fillStyle = '#b8b4a8';
        ctx.fillRect(pb[0] - aw / 2, pb[1] + 1, aw, ah);
        ctx.fillStyle = '#8a867c';
        ctx.fillRect(pb[0] - aw / 2 + 1, pb[1] + 2, aw - 2, ah * 0.4);
      }
      if(zB > 2.5 && ww > 5 &&
         phash(Math.round(wx * 29), Math.round(zB * 31), i + 3312) < 0.10){
        ctx.strokeStyle = 'rgba(24,20,16,0.85)'; ctx.lineWidth = 1;
        ctx.beginPath();
        const railB = pb[1] + 2, railT = pb[1] - wh * 0.30;
        ctx.moveTo(pb[0] - r - 1, railT); ctx.lineTo(pb[0] + r + 1, railT);
        for(let k = 0; k <= 4; k++){
          const rx = pb[0] - r - 1 + (ww + 2) * k / 4;
          ctx.moveTo(rx, railT); ctx.lineTo(rx, railB);
        }
        ctx.stroke();
      }
    }
    ctx.fillStyle = shade(ACC, 1.05);
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
    /* v51: lamplit spill — a lit sash throws a warm wedge across the
       pavement in front of the facade and washes the wall around the
       frame. The wedge runs along the pane's own outward normal (a bay
       cheek spills at 45° to the sidewalk, not straight out), widening
       and fading with distance like a real source. */
    if(litWin && pb[2] < 60){
      const gnx2 = pnx === undefined ? nx : pnx,
            gny2 = pny === undefined ? ny : pny;
      const gN = pr(wx + gnx2 * 0.35, wy + gny2 * 0.35, 0),
            gF = pr(wx + gnx2 * 2.6, wy + gny2 * 2.6, 0);
      const wg = ctx.createRadialGradient(pb[0], (pt[1] + pb[1]) / 2, 1,
                                          pb[0], (pt[1] + pb[1]) / 2,
                                          ww * 1.7);
      wg.addColorStop(0, 'rgba(255,205,120,0.20)');
      wg.addColorStop(1, 'rgba(255,205,120,0)');
      ctx.fillStyle = wg;
      ctx.fillRect(pb[0] - ww * 1.7, pt[1] - ww * 0.8,
                   ww * 3.4, wh + ww * 1.6);
      if(gN && gF && gF[1] > gN[1] + 1){
        const tG = ctx.createLinearGradient(0, gN[1], 0, gF[1]);
        tG.addColorStop(0, 'rgba(255,214,140,0.30)');
        tG.addColorStop(0.55, 'rgba(255,190,100,0.12)');
        tG.addColorStop(1, 'rgba(255,180,90,0)');
        ctx.fillStyle = tG;
        ctx.beginPath();
        ctx.moveTo(pb[0] - ww * 0.55, gN[1]);
        ctx.lineTo(pb[0] + ww * 0.55, gN[1]);
        ctx.lineTo(gF[0] + ww * 1.5, gF[1]);
        ctx.lineTo(gF[0] - ww * 1.5, gF[1]);
        ctx.closePath(); ctx.fill();
      }
    }
  };

  /* v18: Clarion-Alley mural — a painted panel over the lower wall of
     some residential fronts: gradient sky, a rayed sun, rolling hills,
     bird chevrons and a flower row. Windows and bays in the painted
     band are suppressed — the mural owns that wall. */
  if(mural){
    const mP = (u, z) => pr(x1 + ex * u, y1 + ey * u, z);
    const cA = mP(0.03, 0.05), cB = mP(0.97, 0.05),
          cC = mP(0.97, muralZ1), cD = mP(0.03, muralZ1);
    if(cA && cB && cC && cD){
      const mdim = Math.max(0.4, dim);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cA[0], cA[1]); ctx.lineTo(cB[0], cB[1]);
      ctx.lineTo(cC[0], cC[1]); ctx.lineTo(cD[0], cD[1]);
      ctx.closePath(); ctx.clip();
      const bx0 = Math.min(cA[0], cB[0], cC[0], cD[0]) - 2,
            bx1 = Math.max(cA[0], cB[0], cC[0], cD[0]) + 2,
            by0 = Math.min(cA[1], cB[1], cC[1], cD[1]) - 2,
            by1 = Math.max(cA[1], cB[1], cC[1], cD[1]) + 2;
      const mk = SF_MURAL_SKY[Math.floor(phash(i, ei, 1756) * SF_MURAL_SKY.length)];
      const mg = ctx.createLinearGradient(0, by0, 0, by1);
      mg.addColorStop(0, shade(mk[0], mdim));
      mg.addColorStop(1, shade(mk[1], mdim));
      ctx.fillStyle = mg; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
      // rayed sun, upper-right — the Mission-mural staple
      const sp0 = mP(0.72, muralZ1 * 0.74);
      if(sp0){
        const sr = Math.max(4, Math.abs(cB[0] - cA[0]) * 0.075);
        ctx.strokeStyle = shade(mk[2], mdim);
        ctx.lineWidth = Math.max(1, sr * 0.13);
        for(let r = 0; r < 8; r++){
          const a = r / 8 * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(sp0[0] + Math.cos(a) * sr * 1.3, sp0[1] + Math.sin(a) * sr * 1.3);
          ctx.lineTo(sp0[0] + Math.cos(a) * sr * 1.75, sp0[1] + Math.sin(a) * sr * 1.75);
          ctx.stroke();
        }
        ctx.fillStyle = shade(mk[2], mdim);
        ctx.beginPath(); ctx.arc(sp0[0], sp0[1], sr, 0, Math.PI * 2); ctx.fill();
      }
      // rolling hills — two sine-crested fills down to the base line
      for(const [hi, salt] of [[0.45, 1757], [0.24, 1758]]){
        ctx.fillStyle = shade(SF_MURAL_HILL[Math.floor(phash(i, ei, salt) * 5)], mdim);
        ctx.beginPath();
        let first = true;
        for(let k = 0; k <= 14; k++){
          const p = mP(0.03 + 0.94 * k / 14,
                       muralZ1 * (hi + 0.05 * Math.sin(k * 1.25 + i)));
          if(!p) continue;
          first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
          first = false;
        }
        const h1 = mP(0.97, 0), h0 = mP(0.03, 0);
        if(h1 && h0){ ctx.lineTo(h1[0], h1[1]); ctx.lineTo(h0[0], h0[1]); }
        ctx.closePath(); ctx.fill();
      }
      // bird chevrons in the sky
      ctx.strokeStyle = shade('#1c1410', mdim); ctx.lineWidth = 1.4;
      for(let k = 0; k < 3; k++){
        const p = mP(0.14 + 0.17 * k + phash(k, i, 1759) * 0.08,
                     muralZ1 * (0.72 + 0.14 * phash(k, i, 1760)));
        if(!p) continue;
        const s = Math.max(2, Math.abs(cB[0] - cA[0]) * 0.022);
        ctx.beginPath();
        ctx.moveTo(p[0] - s, p[1]);
        ctx.quadraticCurveTo(p[0] - s * 0.4, p[1] - s * 0.9, p[0], p[1]);
        ctx.quadraticCurveTo(p[0] + s * 0.4, p[1] - s * 0.9, p[0] + s, p[1]);
        ctx.stroke();
      }
      // flower row along the base — stem + petal dot
      const flc = ['#e85a5a', '#f0d040', '#e88ab8'];
      for(let k = 0; k < 7; k++){
        const u = 0.08 + 0.84 * k / 6;
        const fp = mP(u, muralZ1 * 0.08), ft = mP(u, muralZ1 * 0.08 + 0.55);
        if(!fp || !ft) continue;
        ctx.strokeStyle = shade('#1e5a2a', mdim); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(fp[0], fp[1]); ctx.lineTo(ft[0], ft[1]); ctx.stroke();
        ctx.fillStyle = shade(flc[k % 3], mdim);
        ctx.beginPath();
        ctx.arc(ft[0], ft[1], Math.max(1.5, Math.abs(cB[0] - cA[0]) * 0.015), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      // painted cap rail along the mural's top edge
      quad([[x1 + ex * 0.03, y1 + ey * 0.03, muralZ1],
            [x1 + ex * 0.97, y1 + ey * 0.97, muralZ1],
            [x1 + ex * 0.97, y1 + ey * 0.97, muralZ1 + 0.14],
            [x1 + ex * 0.03, y1 + ey * 0.03, muralZ1 + 0.14]],
           shade('#241c14', Math.max(0.4, dim)));
    }
  }

  // upper-floor window grid
  const bays = Math.max(1, Math.floor(L / 3.2));
  const doorT = style === 2 ? 0.68 : 0.5;
  // v30: ground-floor garage opening beside the entry (SF soft-story
  // rhythm: garage door at grade + door up the stoop)
  const garU = sfGarageU(i, ei, L, isShop, style, mural, doorT);
  for(let f = isShop ? 1 : 0; f < floors; f++){
    const zB = hm * f / floors + 0.55, zT = hm * (f + 1) / floors - 0.5;
    if(mural && zB < muralZ1) continue;
    /* v57: belt course — a thin stringcourse crowns each floor line on
       italianate/stick fronts, the horizontal rule real Mission rows
       carry between stories. It projects ~9cm: a sun-lit top lip, a
       trim-colored face, and a hairline shadow thrown onto the floor
       below by the same sun vector that slides the eave band. */
    if(det >= 1 && style !== 2 && f > 0){
      const zc = hm * f / floors + 0.02;
      quad([[x1, y1, zc - 0.26], [x2, y2, zc - 0.26],
            [x2, y2, zc - 0.16], [x1, y1, zc - 0.16]],
           `rgba(20,14,9,${0.20 * Math.min(1, dim + 0.3)})`);   // cast line below
      quad([[x1, y1, zc - 0.16], [x2, y2, zc - 0.16],
            [x2, y2, zc + 0.02], [x1, y1, zc + 0.02]],
           shade(ACC, Math.min(1.1, 0.8 * lit + 0.25)));        // face
      quad([[x1, y1, zc + 0.02], [x2, y2, zc + 0.02],
            [x2 + nx * 0.09, y2 + ny * 0.09, zc + 0.02],
            [x1 + nx * 0.09, y1 + ny * 0.09, zc + 0.02]],
           shade(ACC, Math.min(1.35, 0.9 + 0.45 * Math.max(0, sunK) *
               SF_SUN.day)));                                   // top lip
    }
    for(let k = 0; k < bays; k++){
      const t = (k + 0.5) / bays;
      if(f === 0 && Math.abs(t - doorT) < 0.14) continue;
      if(f === 0 && garU > 0 && Math.abs(t - garU) < 0.13) continue;
      drawWin(x1 + ex * t, y1 + ey * t, zB, zT, 1.15);
      /* v54: lived-in exteriors — what hangs OFF the glass, not just what
         sits behind it. Per-window deterministic states: iron window
         boxes spilling geraniums, sleeve AC units staining the stucco
         below, Juliet rails on the tall parlor openings. Each is a real
         projection that takes sun on its own face. */
      if(det === 2 && !mural){
        const dr = phash(i * 7 + k, f * 13 + ei, 5401);
        const wx2 = x1 + ex * t, wy2 = y1 + ey * t;
        if(dr < 0.15){
          // window box: ledge board proud of the wall, soil, leaf clumps
          const bw = 0.78, bx0 = wx2 - ux * bw, by0 = wy2 - uy * bw,
                bx1 = wx2 + ux * bw, by1 = wy2 + uy * bw;
          quad([[bx0 + nx * 0.16, by0 + ny * 0.16, zB - 0.30],
                [bx1 + nx * 0.16, by1 + ny * 0.16, zB - 0.30],
                [bx1 + nx * 0.16, by1 + ny * 0.16, zB - 0.02],
                [bx0 + nx * 0.16, by0 + ny * 0.16, zB - 0.02]],
               shade('#7a4a30', Math.min(1.2, lit + 0.1)));
          quad([[bx0, by0, zB - 0.02], [bx1, by1, zB - 0.02],
                [bx1 + nx * 0.16, by1 + ny * 0.16, zB - 0.02],
                [bx0 + nx * 0.16, by0 + ny * 0.16, zB - 0.02]],
               'rgba(30,22,14,0.85)');
          const nb2 = 3;
          for(let m = 0; m < nb2; m++){
            const uu = (m + 0.5) / nb2,
                  mx = bx0 + (bx1 - bx0) * uu + nx * 0.10,
                  my = by0 + (by1 - by0) * uu + ny * 0.10;
            quad([[mx - ux * 0.14, my - uy * 0.14, zB - 0.02],
                  [mx + ux * 0.14, my + uy * 0.14, zB - 0.02],
                  [mx + ux * 0.14, my + uy * 0.14, zB + 0.26],
                  [mx - ux * 0.14, my - uy * 0.14, zB + 0.26]],
                 shade('#3e6a34', Math.min(1.25, lit + 0.15)));
            const fl = phash(m, i * 31 + k, 5409) < 0.7;
            if(fl){
              const fp = pr(mx, my + 0, zB + 0.30);
              if(fp){
                ctx.fillStyle = ['#d8506a', '#e8a83c', '#e8e0e0'][m % 3];
                ctx.fillRect(fp[0] - 1.6, fp[1] - 1.6, 3.2, 3.2);
              }
            }
          }
        } else if(dr < 0.24){
          // sleeve AC unit under the sill + the rust stain it weeps
          const aw = 0.55, ax0 = wx2 - ux * aw, ay0 = wy2 - uy * aw,
                ax1 = wx2 + ux * aw, ay1 = wy2 + uy * aw;
          quad([[ax0 + nx * 0.34, ay0 + ny * 0.34, zB - 0.52],
                [ax1 + nx * 0.34, ay1 + ny * 0.34, zB - 0.52],
                [ax1 + nx * 0.34, ay1 + ny * 0.34, zB - 0.10],
                [ax0 + nx * 0.34, ay0 + ny * 0.34, zB - 0.10]],
               shade('#b8b4a8', Math.min(1.15, lit)));
          quad([[ax0, ay0, zB - 0.10], [ax1, ay1, zB - 0.10],
                [ax1 + nx * 0.34, ay1 + ny * 0.34, zB - 0.10],
                [ax0 + nx * 0.34, ay0 + ny * 0.34, zB - 0.10]],
               shade('#d8d4c8', Math.min(1.15, lit)));
          const gA2 = pr(ax0 + nx * 0.35, ay0 + ny * 0.35, zB - 0.16),
                gB2 = pr(ax1 + nx * 0.35, ay1 + ny * 0.35, zB - 0.16),
                gA3 = pr(ax0 + nx * 0.35, ay0 + ny * 0.35, zB - 0.26),
                gB3 = pr(ax1 + nx * 0.35, ay1 + ny * 0.35, zB - 0.26);
          if(gA2 && gB2 && gA3 && gB3){
            ctx.strokeStyle = 'rgba(40,38,32,0.6)'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gA2[0], gA2[1]); ctx.lineTo(gB2[0], gB2[1]);
            ctx.moveTo(gA3[0], gA3[1]); ctx.lineTo(gB3[0], gB3[1]);
            ctx.stroke();
          }
          quad([[wx2 - ux * 0.10, wy2 - uy * 0.10, zB - 0.52],
                [wx2 + ux * 0.10, wy2 + uy * 0.10, zB - 0.52],
                [wx2 + ux * 0.10, wy2 + uy * 0.10, zB - 1.1],
                [wx2 - ux * 0.10, wy2 - uy * 0.10, zB - 1.1]],
               'rgba(96,72,44,0.28)');
        } else if(dr < 0.34 && f === 0 && zT - zB > 1.4){
          // Juliet rail: the tall parlor sash gets an iron guard
          const jw = 0.85, j0 = pr(wx2 - ux * jw + nx * 0.12, wy2 - uy * jw + ny * 0.12, zB + 0.05),
                j1 = pr(wx2 + ux * jw + nx * 0.12, wy2 + uy * jw + ny * 0.12, zB + 0.05),
                j0t = pr(wx2 - ux * jw + nx * 0.12, wy2 - uy * jw + ny * 0.12, zB + 0.85),
                j1t = pr(wx2 + ux * jw + nx * 0.12, wy2 + uy * jw + ny * 0.12, zB + 0.85);
          if(j0 && j1 && j0t && j1t){
            ctx.strokeStyle = 'rgba(26,22,18,0.85)'; ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(j0t[0], j0t[1]); ctx.lineTo(j1t[0], j1t[1]);
            ctx.moveTo(j0[0], j0[1]); ctx.lineTo(j1[0], j1[1]);
            const nb3 = 5;
            for(let m = 0; m <= nb3; m++){
              const uu = m / nb3;
              ctx.moveTo(j0[0] + (j1[0] - j0[0]) * uu, j0[1] + (j1[1] - j0[1]) * uu);
              ctx.lineTo(j0t[0] + (j1t[0] - j0t[0]) * uu, j0t[1] + (j1t[1] - j0t[1]) * uu);
            }
            ctx.stroke();
          }
        }
      }
    }
  }

  // projecting Victorian bay windows on tall street-facing fronts
  if(!mural && floors >= 2 && L > 7.5 && ny > 0.2 && style !== 2 && phash(i, ei, 1410) < 0.85){
    const nBay = L > 13 ? 2 : 1;
    const zLo = 2.6, zHi = hm - 0.9;
    for(let k = 0; k < nBay; k++){
      const tb = nBay === 1 ? 0.5 : 0.28 + 0.44 * k;
      const hw = Math.min(1.7, L * 0.16), pd = 0.95,
            cf = Math.min(pd * 0.95, hw * 0.55);  // v45 chamfer inset
      const ax = x1 + ex * tb - ux * hw, ay = y1 + ey * tb - uy * hw;
      const bx = x1 + ex * tb + ux * hw, by = y1 + ey * tb + uy * hw;
      /* v45: the bay is CANTED now — the flat slab front became a real
         chamfered trapezoid: two 45° cheeks carry the wall out to a
         narrower front face, the way real Mission bays are built. Each
         plane is sun-keyed off its own normal, so the faceting reads as
         carved volume instead of a painted bump. */
      const f1x = ax + ux * cf + nx * pd, f1y = ay + uy * cf + ny * pd,
            f2x = bx - ux * cf + nx * pd, f2y = by - uy * cf + ny * pd;
      // cheek outward normals (flip to the street side if winding differs)
      let nLx = (f1y - ay), nLy = -(f1x - ax),
          nRx = (by - f2y), nRy = -(bx - f2x);
      const lL = Math.hypot(nLx, nLy) || 1, lR = Math.hypot(nRx, nRy) || 1;
      nLx /= lL; nLy /= lL; nRx /= lR; nRy /= lR;
      if(nLx * nx + nLy * ny < 0){ nLx = -nLx; nLy = -nLy; }
      if(nRx * nx + nRy * ny < 0){ nRx = -nRx; nRy = -nRy; }
      // v20: the bay is a real projection, so it throws its own shadow on
      // the wall behind — slid along the sun's bearing and dropped by
      // tan(elevation) over the pd setback. Only when light hits this face.
      const snW = SF_SUN.x * nx + SF_SUN.y * ny;
      if(!night && snW < -0.06 && SF_SUN.day > 0.12){
        const tR = pd / -snW,
              du = (SF_SUN.x * ux + SF_SUN.y * uy) * tR,
              dz = Math.tan(Math.max(0, SF_SUN.el)) * tR;
        quad([[ax + ux * du + nx * 0.02, ay + uy * du + ny * 0.02, zLo - dz],
              [bx + ux * du + nx * 0.02, by + uy * du + ny * 0.02, zLo - dz],
              [bx + ux * du + nx * 0.02, by + uy * du + ny * 0.02, zHi - dz],
              [ax + ux * du + nx * 0.02, ay + uy * du + ny * 0.02, zHi - dz]],
             `rgba(24,34,60,${0.16 * SF_SUN.day * Math.min(1, -snW * 2.5)})`);
      }
      // cheeks keyed off their own normals, front face off the wall's
      quad([[ax, ay, zLo], [ax, ay, zHi], [f1x, f1y, zHi], [f1x, f1y, zLo]],
           shade(sfSunWallCol(wallBase, sfSunFaceK(nLx, nLy)), 0.94));
      quad([[bx, by, zLo], [bx, by, zHi], [f2x, f2y, zHi], [f2x, f2y, zLo]],
           shade(sfSunWallCol(wallBase, sfSunFaceK(nRx, nRy)), 0.94));
      quad([[f1x, f1y, zLo], [f2x, f2y, zLo], [f2x, f2y, zHi], [f1x, f1y, zHi]],
           shade(sfSunWallCol(wallBase, Math.min(1, sunK + 0.25)), Math.min(1.25, 1.06)));
      // corbel course under the bay — the molded band the projection
      // springs from, catching the same sun as the fascia above
      for(const [q0x, q0y, q1x, q1y] of [[ax, ay, f1x, f1y], [f1x, f1y, f2x, f2y], [f2x, f2y, bx, by]])
        quad([[q0x, q0y, zLo - 0.02], [q1x, q1y, zLo - 0.02],
              [q1x, q1y, zLo - 0.22], [q0x, q0y, zLo - 0.22]], shade(ACC, 0.85));
      const bayFl = floors - 1;
      for(let f = 0; f < bayFl; f++){
        const zz = zLo + (zHi - zLo) * (f + 0.5) / bayFl;
        for(const uu of [0.3, 0.7]){
          const wx = f1x + (f2x - f1x) * uu, wy = f1y + (f2y - f1y) * uu;
          drawWin(wx, wy, zz - 0.55, zz + 0.55, 0.6);
        }
        // one narrow sash on each cheek — the angled glass is what makes
        // a canted bay glitter differently from the flat wall
        if(det === 2){
          drawWin((ax + f1x) / 2 + nLx * 0.03, (ay + f1y) / 2 + nLy * 0.03,
                  zz - 0.45, zz + 0.45, 0.34, nLx, nLy);
          drawWin((bx + f2x) / 2 + nRx * 0.03, (by + f2y) / 2 + nRy * 0.03,
                  zz - 0.45, zz + 0.45, 0.34, nRx, nRy);
        }
      }
      // bay cornice + hipped cap: front ridge plus two cheek slopes
      const hA = pr(f1x, f1y, zHi), hB = pr(f2x, f2y, zHi),
            hM = pr((f1x + f2x) / 2, (f1y + f2y) / 2, zHi + 0.55),
            hL = pr(ax, ay, zHi), hR = pr(bx, by, zHi);
      if(hA && hB && hM){
        ctx.fillStyle = shade(ACC, 0.9);
        ctx.beginPath();
        ctx.moveTo(hA[0], hA[1]); ctx.lineTo(hB[0], hB[1]); ctx.lineTo(hM[0], hM[1]);
        ctx.closePath(); ctx.fill();
        if(hL && hR){
          ctx.fillStyle = shade(ACC, 0.72);
          ctx.beginPath();
          ctx.moveTo(hL[0], hL[1]); ctx.lineTo(hA[0], hA[1]); ctx.lineTo(hM[0], hM[1]);
          ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(hB[0], hB[1]); ctx.lineTo(hR[0], hR[1]); ctx.lineTo(hM[0], hM[1]);
          ctx.closePath(); ctx.fill();
        }
      }
    }
  }

  /* v18: cast-iron fire escapes — grated platforms bolted across each
     upper floor, alternating zigzag stair flights between them, and a
     drop ladder from the lowest landing to the sidewalk. Bolted ~0.95m
     off the wall face; the sun throws a matching thin shade line under
     each platform. */
  if(det >= 1 && !isShop && floors >= 2 && L > 9 && ny > 0.15 &&
     !mural && phash(i, ei, 1762) < 0.5){
    const fe0 = 0.14 + phash(i, ei, 1763) * 0.45;
    const fe1 = fe0 + Math.min(3.4, L * 0.34) / L;
    const iron = night ? 'rgba(18,14,12,0.92)' : 'rgba(38,32,28,0.92)';
    const fpt = (u, z) => pr(x1 + ex * u + nx * 0.95, y1 + ey * u + ny * 0.95, z);
    for(let f = 1; f < floors; f++){
      const z = hm * f / floors + 0.15;
      // shade line on the wall just under the slab
      quad([[x1 + ex * fe0, y1 + ey * fe0, z - 0.12],
            [x1 + ex * fe1, y1 + ey * fe1, z - 0.12],
            [x1 + ex * fe1, y1 + ey * fe1, z],
            [x1 + ex * fe0, y1 + ey * fe0, z]], 'rgba(20,16,12,0.35)');
      // platform slab projecting off the face
      quad([[x1 + ex * fe0, y1 + ey * fe0, z], [x1 + ex * fe1, y1 + ey * fe1, z],
            [x1 + ex * fe1 + nx * 0.95, y1 + ey * fe1 + ny * 0.95, z],
            [x1 + ex * fe0 + nx * 0.95, y1 + ey * fe0 + ny * 0.95, z]], iron);
      // railing at the outer edge: top rail + balusters
      const ra = fpt(fe0, z), rb = fpt(fe1, z),
            raT = fpt(fe0, z + 0.95), rbT = fpt(fe1, z + 0.95);
      if(ra && rb && raT && rbT){
        ctx.strokeStyle = iron; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(raT[0], raT[1]); ctx.lineTo(rbT[0], rbT[1]);
        const nb = Math.max(3, Math.floor(Math.abs(rb[0] - ra[0]) / 4));
        for(let k = 0; k <= nb; k++){
          const u = k / nb;
          ctx.moveTo(ra[0] + (rb[0] - ra[0]) * u, ra[1] + (rb[1] - ra[1]) * u);
          ctx.lineTo(raT[0] + (rbT[0] - raT[0]) * u, raT[1] + (rbT[1] - raT[1]) * u);
        }
        ctx.stroke();
      }
      if(f < floors - 1){
        // stair flight up to the next platform, alternating direction
        const zN = hm * (f + 1) / floors + 0.15;
        const sA = f % 2 ? fe0 : fe1, sB = f % 2 ? fe1 : fe0;
        const p0 = pr(x1 + ex * sA + nx * 0.5, y1 + ey * sA + ny * 0.5, z),
              p1 = pr(x1 + ex * sB + nx * 0.5, y1 + ey * sB + ny * 0.5, zN);
        if(p0 && p1){
          ctx.strokeStyle = iron; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
          ctx.lineWidth = 1;
          for(let k = 1; k < 6; k++){
            const u = k / 6, tx = p0[0] + (p1[0] - p0[0]) * u,
                  ty = p0[1] + (p1[1] - p0[1]) * u;
            ctx.beginPath(); ctx.moveTo(tx - 2.5, ty); ctx.lineTo(tx + 2.5, ty); ctx.stroke();
          }
        }
      } else {
        // drop ladder from the lowest landing toward the sidewalk
        const lA = fpt(fe1, z), lB = fpt(fe1, 0.5);
        if(lA && lB){
          ctx.strokeStyle = iron; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lA[0] - 2, lA[1]); ctx.lineTo(lB[0] - 2, lB[1]);
          ctx.moveTo(lA[0] + 2, lA[1]); ctx.lineTo(lB[0] + 2, lB[1]);
          const nr = Math.max(2, Math.floor(Math.abs(lA[1] - lB[1]) / 5));
          for(let k = 1; k < nr; k++){
            const u = k / nr, ry = lA[1] + (lB[1] - lA[1]) * u,
                  rx = lA[0] + (lB[0] - lA[0]) * u;
            ctx.moveTo(rx - 2, ry); ctx.lineTo(rx + 2, ry);
          }
          ctx.stroke();
        }
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
      // v43: the box is a real room — checker floor converging on the
      // back wall, a menu board beside the shelf line, a seated patron
      // at a window table, and a neon OPEN sign wired in the corner.
      { // checker tile floor, foreshortened toward the back
        for(let r2 = 0; r2 < 2; r2++){
          const d0 = 0.06 + r2 * 0.16, d1 = 0.06 + (r2 + 1) * 0.16;
          const nt = 8;
          for(let k = 0; k < nt; k++){
            if((k + r2) % 2) continue;
            const q0 = sp(0.05 + 0.9 * k / nt, 0.02, d0),
                  q1 = sp(0.05 + 0.9 * (k + 1) / nt, 0.02, d0),
                  q2 = sp(0.05 + 0.9 * (k + 1) / nt, 0.02, d1),
                  q3 = sp(0.05 + 0.9 * k / nt, 0.02, d1);
            ctx.fillStyle = 'rgba(190,178,152,0.28)';
            ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]);
            ctx.lineTo(q2[0], q2[1]); ctx.lineTo(q3[0], q3[1]);
            ctx.closePath(); ctx.fill();
          }
        }
        // menu board on the back wall
        const m0 = sp(0.68, 0.72, 1), m1 = sp(0.88, 0.34, 1);
        ctx.fillStyle = '#241f18';
        ctx.fillRect(m0[0], m0[1], m1[0] - m0[0], Math.abs(m1[1] - m0[1]));
        ctx.strokeStyle = 'rgba(216,203,168,0.8)'; ctx.lineWidth = 1;
        ctx.strokeRect(m0[0], m0[1], m1[0] - m0[0], Math.abs(m1[1] - m0[1]));
        ctx.strokeStyle = 'rgba(230,220,190,0.6)';
        const nln = 3;
        for(let k = 0; k < nln; k++){
          const yy = m0[1] + Math.abs(m1[1] - m0[1]) * (k + 1) / (nln + 1);
          ctx.beginPath(); ctx.moveTo(m0[0] + 2, yy);
          ctx.lineTo(m1[0] - 2 - phash(k, i, 4330) * (m1[0] - m0[0]) * 0.3, yy);
          ctx.stroke();
        }
        // seated patron at a window table, mid-depth
        const tp = sp(0.30 + phash(i, ei, 4331) * 0.2, 0.10, 0.30);
        const ts = Math.abs(gA[1] - tA[1]) / 46;
        ctx.fillStyle = 'rgba(14,9,5,0.85)';
        ctx.beginPath();                       // table
        ctx.ellipse(tp[0] + 14 * ts, tp[1] - 6 * ts, 12 * ts, 4 * ts, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(tp[0] - 7 * ts, tp[1] - 26 * ts, 14 * ts, 22 * ts); // torso
        ctx.beginPath();
        ctx.arc(tp[0], tp[1] - 31 * ts, 4.6 * ts, 0, Math.PI * 2); ctx.fill(); // head
        // neon OPEN hung in the glass near one edge — lit dusk onward
        if(phash(i, ei, 4332) < 0.5){
          const np = sp(0.86, 0.62, 0.06);
          const nw2 = 16 * ts, nh2 = 7 * ts;
          const on = night || sfLampsLit();
          if(on){
            const ng = ctx.createRadialGradient(np[0], np[1], 1, np[0], np[1], nw2);
            ng.addColorStop(0, 'rgba(255,80,60,0.5)');
            ng.addColorStop(1, 'rgba(255,80,60,0)');
            ctx.fillStyle = ng;
            ctx.fillRect(np[0] - nw2, np[1] - nw2, nw2 * 2, nw2 * 2);
          }
          ctx.strokeStyle = on ? '#ff5a48' : 'rgba(150,70,60,0.8)';
          ctx.lineWidth = Math.max(1, 1.4 * ts);
          ctx.strokeRect(np[0] - nw2 / 2, np[1] - nh2 / 2, nw2, nh2);
          ctx.fillStyle = on ? '#ffd8cc' : 'rgba(200,120,110,0.8)';
          ctx.font = `${Math.max(4, 5.5 * ts)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('OPEN', np[0], np[1]);
          ctx.textBaseline = 'alphabetic';
        }
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
    // v18: tiled bulkhead under the glass — Mission storefronts sit on a
    // checker of glazed tile (teal/cream, maroon/bone, ...)
    const tl = SF_TILE_COLS[Math.floor(phash(i, 37, 1765) * SF_TILE_COLS.length)];
    const nTile = Math.max(3, Math.floor((s1 - s0) * L / 0.5));
    for(let k = 0; k < nTile; k++){
      const tu0 = s0 + (s1 - s0) * k / nTile, tu1 = s0 + (s1 - s0) * (k + 1) / nTile;
      for(let r2 = 0; r2 < 2; r2++){
        quad([[x1 + ex * tu0, y1 + ey * tu0, 0.05 + r2 * 0.25],
              [x1 + ex * tu1, y1 + ey * tu1, 0.05 + r2 * 0.25],
              [x1 + ex * tu1, y1 + ey * tu1, 0.05 + (r2 + 1) * 0.25],
              [x1 + ex * tu0, y1 + ey * tu0, 0.05 + (r2 + 1) * 0.25]],
             shade(tl[(k + r2) % 2], Math.max(0.45, dim)));
      }
    }
    // v18: painted signboard fascia — deep enamel color, accent rule,
    // parody display name in cream capitals (never a real business name)
    const signC = SF_SIGN_COLS[Math.floor(phash(i, 31, 1764) * SF_SIGN_COLS.length)];
    quad([[sx0, sy0, 2.6], [sx1, sy1, 2.6], [sx1, sy1, 3.4], [sx0, sy0, 3.4]],
         shade(signC, Math.max(0.5, dim)));
    quad([[sx0, sy0, 3.28], [sx1, sy1, 3.28], [sx1, sy1, 3.4], [sx0, sy0, 3.4]],
         shade(ACC, Math.max(0.5, dim)));
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
    const sg = sfSignName(b);
    if(sg){
      const smA = pr(x1 + ex * 0.5, y1 + ey * 0.5, 2.66),
            smB = pr(x1 + ex * 0.5, y1 + ey * 0.5, 3.26);
      if(smA && smB){
        const sh = Math.abs(smB[1] - smA[1]);
        ctx.font = `bold ${Math.max(6, sh * 0.68)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = night ? '#ffe9b0' : '#f8f4e0';
        ctx.fillText(sg.slice(0, 22),
                     (smA[0] + smB[0]) / 2, (smA[1] + smB[1]) / 2);
        ctx.textBaseline = 'alphabetic';
      }
    }
    // blade sign: bracketed panel perpendicular to the wall at the shop edge
    {
      const blx = x1 + ex * 0.9, bly = y1 + ey * 0.9;
      quad([[blx, bly, 3.9], [blx + nx * 0.6, bly + ny * 0.6, 3.9],
            [blx + nx * 0.6, bly + ny * 0.6, 4.9], [blx, bly, 4.9]],
           shade(signC, Math.max(0.5, dim) * 1.15));
      const bk = pr(blx + nx * 0.6, bly + ny * 0.6, 4.9),
            bk2 = pr(blx, bly, 5.15);
      if(bk && bk2){
        ctx.strokeStyle = '#1c1814'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bk[0], bk[1]); ctx.lineTo(bk2[0], bk2[1]); ctx.stroke();
      }
    }
    /* v57: dusk signage — when the streetlights come on the shop signs
       light too: a warm backlit halo washes the wall behind the fascia,
       and the blade sign picks up a neon edge on its street face.
       Cause is sfLampsLit() — the same civil-dusk switch as the lamps. */
    if(sfLampsLit() && gA && gB){
      const hb0 = pr(sx0, sy0, 3.4), hb1 = pr(sx1, sy1, 3.4);
      if(hb0 && hb1){
        const hg = ctx.createLinearGradient(0, Math.min(hb0[1], hb1[1]),
                                            0, Math.max(gA[1], gB[1]));
        hg.addColorStop(0, 'rgba(255,214,140,0.20)');
        hg.addColorStop(0.35, 'rgba(255,190,110,0.07)');
        hg.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = hg;
        ctx.fillRect(Math.min(hb0[0], hb1[0]) - 4, Math.min(hb0[1], hb1[1]),
                     Math.abs(hb1[0] - hb0[0]) + 8,
                     Math.max(gA[1], gB[1]) - Math.min(hb0[1], hb1[1]));
      }
      const bn = pr(blx + nx * 0.6, bly + ny * 0.6, 4.4),
            bw2 = pr(blx, bly, 4.4);
      if(bn && bw2){
        ctx.strokeStyle = 'rgba(255,120,90,0.85)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(bw2[0], bw2[1]); ctx.lineTo(bn[0], bn[1]); ctx.stroke();
        const bg = ctx.createRadialGradient(bn[0], bn[1], 0.5,
                                            bn[0], bn[1], 14);
        bg.addColorStop(0, 'rgba(255,140,100,0.30)');
        bg.addColorStop(1, 'rgba(255,140,100,0)');
        ctx.fillStyle = bg;
        ctx.fillRect(bn[0] - 14, bn[1] - 14, 28, 28);
      }
    }
    /* v54: sidewalk A-board — the chalked sandwich board every Mission
       cafe kicks out onto the pavement each morning. Two legs splayed
       toward the street, chalk panel facing foot traffic. */
    if(det >= 1){
      const abx = x1 + ex * (s1 + 0.06) + nx * 1.55,
            aby = y1 + ey * (s1 + 0.06) + ny * 1.55;
      const awx = ux * 0.42, awy = uy * 0.42;   // half-width along curb
      const splay = 0.30;
      // street face (chalk board) + back leg — the hinge rides z 0.95
      quad([[abx - awx + nx * splay, aby - awy + ny * splay, 0.02],
            [abx + awx + nx * splay, aby + awy + ny * splay, 0.02],
            [abx + awx, aby + awy, 0.95],
            [abx - awx, aby - awy, 0.95]],
           shade('#2a2620', Math.min(1.15, lit)));
      quad([[abx - awx - nx * splay, aby - awy - ny * splay, 0.02],
            [abx + awx - nx * splay, aby + awy - ny * splay, 0.02],
            [abx + awx, aby + awy, 0.95],
            [abx - awx, aby - awy, 0.95]],
           shade('#4a3f30', Math.min(1.1, lit)));
      // chalk scribbles on the street face — menu lines, not text
      const c0 = pr(abx - awx * 0.62 + nx * splay * 0.6, aby - awy * 0.62 + ny * splay * 0.6, 0.62),
            c1 = pr(abx + awx * 0.62 + nx * splay * 0.6, aby + awy * 0.62 + ny * splay * 0.6, 0.62),
            c2 = pr(abx - awx * 0.62 + nx * splay * 0.8, aby - awy * 0.62 + ny * splay * 0.8, 0.34),
            c3 = pr(abx + awx * 0.35 + nx * splay * 0.8, aby + awy * 0.35 + ny * splay * 0.8, 0.34);
      if(c0 && c1 && c2 && c3){
        ctx.strokeStyle = 'rgba(232,226,204,0.75)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]);
        ctx.moveTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]);
        ctx.stroke();
      }
    }
  } else if(L > 5){
    // residential ground floor. v30: raised-basement grammar — italianate
    // and stick fronts lift the parlor floor ~1.15m: garage (or a garden
    // flat window) at grade, the door up a real run of steps with cheek
    // walls and a handrail. Marina rows keep their grade-level garage.
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
    const rD = style === 2 ? 0 : 1.15;  // raised-entry landing height
    // water table: the garden level reads as a separate, darker band of
    // concrete/stucco under a projecting ledge course
    if(rD){
      quad([[x1, y1, 0.02], [x2, y2, 0.02], [x2, y2, 1.06], [x1, y1, 1.06]],
           'rgba(22,18,12,0.14)');
      quad([[x1, y1, 1.02], [x2, y2, 1.02],
            [x2 + nx * 0.09, y2 + ny * 0.09, 1.02],
            [x1 + nx * 0.09, y1 + ny * 0.09, 1.02]],
           shade(ACC, 0.85));
      // garden flat: either a garage bay or a low casement window
      if(garU > 0){
        const gx = x1 + ex * garU, gy = y1 + ey * garU;
        const gh2 = 1.3; // garage half-width (2.6m opening)
        // recessed dark opening, then the door leaf inside it
        quad([[gx - ux * gh2, gy - uy * gh2, 0.04], [gx + ux * gh2, gy + uy * gh2, 0.04],
              [gx + ux * gh2, gy + uy * gh2, 2.15], [gx - ux * gh2, gy - uy * gh2, 2.15]],
             'rgba(16,12,9,0.9)');
        const gdz = 0.10;
        quad([[gx - ux * gh2 + ux * 0.12 - nx * gdz, gy - uy * gh2 + uy * 0.12 - ny * gdz, 0.04],
              [gx + ux * gh2 - ux * 0.12 - nx * gdz, gy + uy * gh2 - uy * 0.12 - ny * gdz, 0.04],
              [gx + ux * gh2 - ux * 0.12 - nx * gdz, gy + uy * gh2 - uy * 0.12 - ny * gdz, 2.0],
              [gx - ux * gh2 + ux * 0.12 - nx * gdz, gy - uy * gh2 + uy * 0.12 - ny * gdz, 2.0]],
             shade(wallBase, 0.92));
        // panel ribs — horizontal bands the door folds on
        for(let s = 1; s <= 3; s++){
          const z = s * 0.5;
          const lA = pr(gx - ux * (gh2 - 0.14) - nx * gdz, gy - uy * (gh2 - 0.14) - ny * gdz, z),
                lB = pr(gx + ux * (gh2 - 0.14) - nx * gdz, gy + uy * (gh2 - 0.14) - ny * gdz, z);
          if(!lA || !lB) continue;
          ctx.strokeStyle = 'rgba(20,16,12,0.55)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(lA[0], lA[1]); ctx.lineTo(lB[0], lB[1]); ctx.stroke();
        }
        // header trim over the opening
        quad([[gx - ux * (gh2 + 0.15), gy - uy * (gh2 + 0.15), 2.15],
              [gx + ux * (gh2 + 0.15), gy + uy * (gh2 + 0.15), 2.15],
              [gx + ux * (gh2 + 0.15), gy + uy * (gh2 + 0.15), 2.38],
              [gx - ux * (gh2 + 0.15), gy - uy * (gh2 + 0.15), 2.38]],
             shade(ACC, 0.95));
      } else {
        // low casement in the basement band beside the entry
        const wx = x1 + ex * (doorT + (phash(i, ei, 3304) < 0.5 ? 0.28 : -0.28)),
              wy = y1 + ey * (doorT + (phash(i, ei, 3304) < 0.5 ? 0.28 : -0.28));
        drawWin(wx, wy, 0.4, 0.95, 0.8);
      }
    }
    // v20: recessed entry alcove — Mission Victorian doors sit deep in a
    // porch, not flush on the facade. Cheek walls lit independently by the
    // sun, a shaded ceiling soffit, and a lintel face frame the opening;
    // the door itself is drawn on the back wall ~0.8m inside.
    const alcDep = 0.85, alcHw = 0.78, alcZ = 0.05 + rD, alcT = 3.5;
    {
      const p0x = dx - ux * alcHw, p0y = dy - uy * alcHw,
            p1x = dx + ux * alcHw, p1y = dy + uy * alcHw;
      quad([[p0x, p0y, alcZ], [p0x - nx * alcDep, p0y - ny * alcDep, alcZ],
            [p0x - nx * alcDep, p0y - ny * alcDep, alcT], [p0x, p0y, alcT]],
           shade(wallCol, 0.5 + 0.35 * Math.max(0, sfSunFaceK(ux, uy))));
      quad([[p1x, p1y, alcZ], [p1x, p1y, alcT],
            [p1x - nx * alcDep, p1y - ny * alcDep, alcT],
            [p1x - nx * alcDep, p1y - ny * alcDep, alcZ]],
           shade(wallCol, 0.5 + 0.35 * Math.max(0, sfSunFaceK(-ux, -uy))));
      quad([[p0x, p0y, alcT], [p1x, p1y, alcT],
            [p1x - nx * alcDep, p1y - ny * alcDep, alcT],
            [p0x - nx * alcDep, p0y - ny * alcDep, alcT]],
           shade(wallCol, 0.42));
      // lintel face over the alcove mouth
      quad([[p0x, p0y, alcT - 0.35], [p1x, p1y, alcT - 0.35],
            [p1x, p1y, alcT], [p0x, p0y, alcT]],
           shade(ACC, 0.9));
    }
    // v30: the stoop is a real stair — six treads run from the raised
    // landing down to the pavement between sloped cheek walls, with a
    // handrail on the open side. Marina entries stay at grade.
    if(rD){
      const sHw = 0.92, run = 1.62, nSt = 6;
      for(let s = 0; s < nSt; s++){
        const zt = rD - s * (rD - 0.08) / nSt,
              zb = zt - (rD - 0.08) / nSt,
              o0 = s * run / nSt, o1 = (s + 1) * run / nSt;
        quad([[dx - ux * sHw + nx * o0, dy - uy * sHw + ny * o0, zt],
              [dx + ux * sHw + nx * o0, dy + uy * sHw + ny * o0, zt],
              [dx + ux * sHw + nx * o1, dy + uy * sHw + ny * o1, zt],
              [dx - ux * sHw + nx * o1, dy - uy * sHw + ny * o1, zt]],
             shade('#a39c8e', lit));
        quad([[dx - ux * sHw + nx * o1, dy - uy * sHw + ny * o1, zb],
              [dx + ux * sHw + nx * o1, dy + uy * sHw + ny * o1, zb],
              [dx + ux * sHw + nx * o1, dy + uy * sHw + ny * o1, zt],
              [dx - ux * sHw + nx * o1, dy - uy * sHw + ny * o1, zt]],
             shade('#6e675c', lit));
      }
      // cheek walls flanking the flight, tops sloping down with it
      for(const sgn of [-1, 1]){
        const cx0 = dx + ux * sgn * sHw, cy0 = dy + uy * sgn * sHw;
        quad([[cx0, cy0, 0.02], [cx0, cy0, rD + 0.06],
              [cx0 + nx * run, cy0 + ny * run, 0.10],
              [cx0 + nx * run, cy0 + ny * run, 0.02]],
             shade('#8a8478', lit * (0.5 + 0.35 * Math.max(0, sfSunFaceK(sgn * ux, sgn * uy)) + 0.4)));
      }
      // handrail: posts at top and bottom of the flight + a sloped rail
      const rTop = pr(dx + ux * sHw, dy + uy * sHw, rD + 0.85),
            rBot = pr(dx + ux * sHw + nx * run, dy + uy * sHw + ny * run, 0.85),
            rP0 = pr(dx + ux * sHw, dy + uy * sHw, rD),
            rP1 = pr(dx + ux * sHw + nx * run, dy + uy * sHw + ny * run, 0.02);
      if(rTop && rBot && rP0 && rP1){
        ctx.strokeStyle = 'rgba(30,24,18,0.9)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(rP0[0], rP0[1]); ctx.lineTo(rTop[0], rTop[1]);
        ctx.moveTo(rP1[0], rP1[1]); ctx.lineTo(rBot[0], rBot[1]);
        ctx.moveTo(rTop[0], rTop[1]); ctx.lineTo(rBot[0], rBot[1]);
        ctx.stroke();
      }
    } else {
      // at-grade pad stoop (marina rows)
      quad([[dx - ux * 1.1, dy - uy * 1.1, 0.03], [dx + ux * 1.1, dy + uy * 1.1, 0.03],
            [dx + ux * 1.1 + nx * 1.2, dy + uy * 1.1 + ny * 1.2, 0.03],
            [dx - ux * 1.1 + nx * 1.2, dy - uy * 1.1 + ny * 1.2, 0.03]],
           shade('#8a8478', lit));
      quad([[dx - ux * 0.9, dy - uy * 0.9, 0.05], [dx + ux * 0.9, dy + uy * 0.9, 0.05],
            [dx + ux * 0.9 + nx * 0.7, dy + uy * 0.9 + ny * 0.7, 0.35],
            [dx - ux * 0.9 + nx * 0.7, dy - uy * 0.9 + ny * 0.7, 0.35]],
           shade('#a39c8e', lit));
    }
    // arched door + pediment (raised: the door leaf rides the landing)
    const db = pr(dx - nx * (alcDep - 0.05), dy - ny * (alcDep - 0.05), 0.07 + rD),
          dt = pr(dx - nx * (alcDep - 0.05), dy - ny * (alcDep - 0.05), 2.5 + rD * 0.75);
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
        const pm = pr(dx, dy, 2.9 + rD * 0.75);
        if(pm){
          ctx.fillStyle = shade(TRIM, 0.95);
          ctx.beginPath();
          ctx.moveTo(dt[0] - dw - 2, dt[1]); ctx.lineTo(dt[0] + dw + 2, dt[1]);
          ctx.lineTo(pm[0], pm[1]); ctx.closePath(); ctx.fill();
        }
      }
    }

  /* v54: entry dressing — the things that make a doorway an ADDRESS.
     A brass number plaque on the wall beside the door (the building's
     real house number), a mailbox row under it, and potted plants
     flanking the foot of the stoop — the Mission's universal stoop
     grammar. Each pot reads sun on its own face. */
  if(det >= 1 && !isShop){
    const pz = 1.55 + rD;
    // house number plate at eye level, hinge side of the alcove
    const nx0 = dx + ux * (alcHw + 0.30), ny0 = dy + uy * (alcHw + 0.30);
    const pN = pr(nx0 + nx * 0.02, ny0 + ny * 0.02, pz + 0.24),
          pN2 = pr(nx0 + nx * 0.02, ny0 + ny * 0.02, pz - 0.10);
    if(pN && pN2 && b.hn){
      const ph = Math.abs(pN[1] - pN2[1]);
      if(ph > 3){
        const pw = Math.max(ph * 1.9, 7);
        ctx.fillStyle = shade(ACC, Math.max(0.5, dim));
        ctx.fillRect(pN[0] - pw / 2, pN[1], pw, ph);
        ctx.fillStyle = '#f4ead0';
        ctx.font = `bold ${Math.max(4, ph * 0.62)}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(b.hn).slice(0, 5), pN[0], pN[1] + ph / 2);
        ctx.textBaseline = 'alphabetic';
      }
    }
    // mailbox row just inside the alcove's sunny cheek
    const mb0 = pr(dx - ux * (alcHw + 0.28) + nx * 0.05, dy - uy * (alcHw + 0.28) + ny * 0.05, 1.05 + rD),
          mb1 = pr(dx - ux * (alcHw + 0.28) + nx * 0.05, dy - uy * (alcHw + 0.28) + ny * 0.05, 0.72 + rD);
    if(mb0 && mb1 && Math.abs(mb0[1] - mb1[1]) > 3){
      const mw = Math.abs(mb0[1] - mb1[1]) * 2.1;
      ctx.fillStyle = shade('#4a4438', Math.min(1.1, lit));
      ctx.fillRect(mb1[0] - mw / 2, mb0[1], mw, mb1[1] - mb0[1]);
      ctx.strokeStyle = 'rgba(220,205,170,0.5)'; ctx.lineWidth = 1;
      const nm2 = 2;
      for(let m = 0; m < nm2; m++){
        const yy = mb0[1] + (mb1[1] - mb0[1]) * (m + 0.5) / nm2;
        ctx.beginPath(); ctx.moveTo(mb1[0] - mw / 2 + 1, yy);
        ctx.lineTo(mb1[0] + mw / 2 - 1, yy); ctx.stroke();
      }
    }
    // potted plants flanking the stoop foot — half the row has them
    if(phash(i, ei, 5418) < 0.5){
      for(const sgn of [-1, 1]){
        if(phash(i * 3 + sgn, ei, 5419) < 0.3) continue;
        const px2 = dx + ux * sgn * 1.45 + nx * (rD ? 1.75 : 1.15),
              py2 = dy + uy * sgn * 1.45 + ny * (rD ? 1.75 : 1.15);
        // terracotta pot: two stacked quads, rim lip
        quad([[px2 - ux * 0.16, py2 - uy * 0.16, 0.02],
              [px2 + ux * 0.16, py2 + uy * 0.16, 0.02],
              [px2 + ux * 0.14 + nx * 0.03, py2 + uy * 0.14 + ny * 0.03, 0.38],
              [px2 - ux * 0.14 + nx * 0.03, py2 - uy * 0.14 + ny * 0.03, 0.38]],
             shade('#a05a38', Math.min(1.2, lit)));
        quad([[px2 - ux * 0.19, py2 - uy * 0.19, 0.38],
              [px2 + ux * 0.19, py2 + uy * 0.19, 0.38],
              [px2 + ux * 0.19, py2 + uy * 0.19, 0.46],
              [px2 - ux * 0.19, py2 - uy * 0.19, 0.46]],
             shade('#8a4c2e', Math.min(1.2, lit)));
        // foliage tuft — three blobs, taller on the sunward edge
        const tall = 0.55 + 0.45 * Math.max(0, sfSunFaceK(nx, ny));
        quad([[px2 - ux * 0.20, py2 - uy * 0.20, 0.44],
              [px2 + ux * 0.20, py2 + uy * 0.20, 0.44],
              [px2 + ux * 0.20, py2 + uy * 0.20, 0.44 + tall],
              [px2 - ux * 0.20, py2 - uy * 0.20, 0.44 + tall]],
             shade('#3a6630', Math.min(1.2, lit + 0.05)));
        const tp2 = pr(px2, py2, 0.44 + tall);
        if(tp2){
          ctx.fillStyle = shade('#4a7a3a', Math.min(1.25, lit + 0.15));
          ctx.beginPath(); ctx.arc(tp2[0], tp2[1], Math.max(1.5, 0.16 * F / (tp2[2] || 1)), 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }
  }

  /* v30: corner boards + downspouts — real SF wood fronts end in a wide
     trim pilaster at each edge, italianate walls swap it for staggered
     quoin blocks, and a downspout pipe drops from the cornice soffit at
     one end carrying roof water to a sidewalk boot. */
  if(det === 2){
    const cbCol = style === 0 ? shade(wallCol, 1.06) : ACC;
    for(const uu of [0.012, 0.988]){
      const cx = x1 + ex * uu, cy = y1 + ey * uu;
      quad([[cx - ux * 0.14, cy - uy * 0.14, 0.04], [cx + ux * 0.14, cy + uy * 0.14, 0.04],
            [cx + ux * 0.14, cy + uy * 0.14, hm - 0.55], [cx - ux * 0.14, cy - uy * 0.14, hm - 0.55]],
           shade(cbCol, 0.98));
      // quoins: alternating blocks proud of the corner (italianate only)
      if(style === 0){
        for(let k = 0; k < Math.floor(hm / 1.1); k++){
          if(k % 2) continue;
          const z = 0.5 + k * 1.1;
          quad([[cx - ux * 0.22, cy - uy * 0.22, z], [cx + ux * 0.22, cy + uy * 0.22, z],
                [cx + ux * 0.22, cy + uy * 0.22, z + 0.5],
                [cx - ux * 0.22, cy - uy * 0.22, z + 0.5]],
               shade(cbCol, 1.1));
        }
      }
    }
    // downspout at the end that sees less sun, hugging the corner board
    const du = sfSunFaceK(ux, uy) > 0 ? 0.045 : 0.955;
    const dxx = x1 + ex * du + nx * 0.12, dyy = y1 + ey * du + ny * 0.12;
    const dT = pr(dxx, dyy, hm - 0.8), dB = pr(dxx, dyy, 0.12);
    if(dT && dB){
      ctx.strokeStyle = shade(cbCol, 0.62); ctx.lineWidth = Math.max(1.2, F * 0.025 / dT[2]);
      ctx.beginPath(); ctx.moveTo(dT[0], dT[1]); ctx.lineTo(dB[0], dB[1]); ctx.stroke();
      // strap bands + the elbow boot kicking out at the curb
      ctx.strokeStyle = 'rgba(20,16,12,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for(let k = 1; k <= 3; k++){
        const yv = dT[1] + (dB[1] - dT[1]) * k / 4;
        ctx.moveTo(dT[0] - 2, yv); ctx.lineTo(dT[0] + 2, yv);
      }
      const bt = pr(dxx + nx * 0.3, dyy + ny * 0.3, 0.05);
      if(bt){ ctx.moveTo(dB[0], dB[1]); ctx.lineTo(bt[0], bt[1]); }
      ctx.stroke();
    }
  }

  /* v45: Queen Anne corner turret — the Mission's grandest facade move.
     A faceted drum swells off one end of a tall residential front, rises
     past the parapet, and wears a conical witch's hat with a finial.
     Every drum facet and cone gore is sun-keyed off its own normal, and
     the drum throws a real shade wedge across the wall behind it (same
     bearing/elevation solver as the canted bays). Painted late so the
     drum reads in front of cornice, windows and ground-floor dressing. */
  const tU = sfTurretU(i, ei, L, isShop, floors);
  if(tU > 0 && det >= 1){
    const R = Math.min(1.5, L * 0.10 + 0.5);
    const cxT = x1 + ex * tU + nx * R * 0.28,
          cyT = y1 + ey * tU + ny * R * 0.28;
    const zLo = Math.min(2.4, hm * 0.3), zTop = hm + para + 0.55,
          coneH = R * 2.4;
    // half the hats wear the facade's accent color, half plain slate
    const coneC = phash(i, ei, 4402) < 0.5 ? ACC : '#565a64';
    const NF = 10, nAng = Math.atan2(ny, nx);
    // drum shadow on the wall behind (sun striking the facade)
    const snW3 = SF_SUN.x * nx + SF_SUN.y * ny;
    if(!night && snW3 < -0.06 && SF_SUN.day > 0.12){
      const tR = R * 1.1 / -snW3,
            du = (SF_SUN.x * ux + SF_SUN.y * uy) * tR,
            dz = Math.tan(Math.max(0, SF_SUN.el)) * tR;
      quad([[cxT + ux * (du - R) + nx * 0.02, cyT + uy * (du - R) + ny * 0.02, zLo - dz],
            [cxT + ux * (du + R) + nx * 0.02, cyT + uy * (du + R) + ny * 0.02, zLo - dz],
            [cxT + ux * (du + R) + nx * 0.02, cyT + uy * (du + R) + ny * 0.02, zTop - dz],
            [cxT + ux * (du - R) + nx * 0.02, cyT + uy * (du - R) + ny * 0.02, zTop - dz]],
           `rgba(24,34,60,${0.14 * SF_SUN.day * Math.min(1, -snW3 * 2.5)})`);
    }
    for(let k = 0; k < NF; k++){
      const a0 = nAng + (k - NF / 2) * (Math.PI * 2 / NF),
            a1 = a0 + Math.PI * 2 / NF,
            mid = (a0 + a1) / 2,
            mnx = Math.cos(mid), mny = Math.sin(mid),
            mDot = mnx * nx + mny * ny;
      if(mDot < -0.12) continue;      // back half is inside the house
      const vx0 = cxT + Math.cos(a0) * R, vy0 = cyT + Math.sin(a0) * R,
            vx1 = cxT + Math.cos(a1) * R, vy1 = cyT + Math.sin(a1) * R;
      const fK = sfSunFaceK(mnx, mny);
      quad([[vx0, vy0, zLo], [vx1, vy1, zLo],
            [vx1, vy1, zTop], [vx0, vy0, zTop]],
           shade(sfSunWallCol(wallBase, fK), 0.98));
      // molded base ring + eave band under the cone
      quad([[vx0, vy0, zLo], [vx1, vy1, zLo],
            [vx1, vy1, zLo + 0.16], [vx0, vy0, zLo + 0.16]], shade(ACC, 0.85));
      quad([[vx0, vy0, zTop - 0.16], [vx1, vy1, zTop - 0.16],
            [vx1, vy1, zTop], [vx0, vy0, zTop]], shade(ACC, 0.62));
      // one narrow sash per floor on the frontal facets
      if(mDot > 0.25){
        for(let f = 1; f < floors; f++){
          const zB = hm * f / floors + 0.55, zT = hm * (f + 1) / floors - 0.5;
          if(zB < zLo + 0.25 || zT > zTop - 0.4) continue;
          drawWin((vx0 + vx1) / 2, (vy0 + vy1) / 2, zB, zT, 0.5);
        }
      }
      // cone gore: rim chord -> apex, slate or accent lit/shade by sun,
      // with a standing seam along each gore edge (real cone flashing)
      const goreLit = sfSunFaceK(mnx, mny) > 0.05;
      quad([[vx0, vy0, zTop], [vx1, vy1, zTop],
            [cxT, cyT, zTop + coneH], [cxT, cyT, zTop + coneH]],
           shade(coneC, goreLit ? Math.min(1.2, 0.9 + fK * 0.4) : 0.58));
      if(det === 2){
        const rA = pr(vx0, vy0, zTop), rB = pr(vx1, vy1, zTop),
              ap = pr(cxT, cyT, zTop + coneH);
        if(rA && rB && ap){
          ctx.strokeStyle = shade(coneC, 0.66); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(rA[0], rA[1]); ctx.lineTo(rB[0], rB[1]);
          ctx.moveTo(rA[0], rA[1]); ctx.lineTo(ap[0], ap[1]); ctx.stroke();
        }
      }
    }
    // finial rod + ball at the apex
    const fB = pr(cxT, cyT, zTop + coneH), fT = pr(cxT, cyT, zTop + coneH + 0.7);
    if(fB && fT){
      ctx.strokeStyle = shade(ACC, 0.8); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(fB[0], fB[1]); ctx.lineTo(fT[0], fT[1]); ctx.stroke();
      ctx.fillStyle = shade(ACC, 1.15);
      ctx.beginPath(); ctx.arc(fT[0], fT[1], Math.max(1.3, F * 0.05 / fT[2]), 0, Math.PI * 2); ctx.fill();
    }
  }

  // v5/v32: climbing vines on some residential walls — ivy OR
  // bougainvillea, the Mission's signature facade drape. Bougainvillea
  // runs a second wandering strand and sets papery magenta bracts only
  // where the wall actually catches sun (sfSunFaceK on the wall normal)
  // and only on the upper growth — shade and night keep it green.
  if(det === 2 && !isShop && !mural && phash(i, ei, 1705) < 0.32){
    const boug = phash(i, ei, 3810) < 0.5;
    const u0 = 0.12 + phash(i, ei, 1706) * 0.6;
    const climb = hm * (0.3 + phash(i, ei, 1707) * 0.45);
    const nV = Math.max(6, Math.round(climb * (boug ? 3.4 : 2.4)));
    const sunK = night ? 0 : Math.max(0, sfSunFaceK(nx, ny));
    const strands = boug ? 2 : 1;
    for(let s2 = 0; s2 < strands; s2++){
      const so = s2 ? (phash(i, ei, 3811) - 0.5) * 0.2 : 0;
      for(let k = 0; k < nV; k++){
        const z = (k / nV) * climb * (s2 ? 0.8 : 1);
        const u = u0 + so + Math.sin(k * 1.9 + s2 * 2.3) * 0.02 + (z / hm) * 0.06;
        const p = pr(x1 + ex * u, y1 + ey * u, z);
        if(!p) continue;
        const rr = Math.max(1.2, (boug ? 0.38 : 0.3) * F / p[2] *
                            (1 - z / climb * 0.4));
        ctx.fillStyle = night ? '#1c2a16' : (k % 3 ? '#3e7a34' : '#2e5a24');
        ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, Math.PI * 2); ctx.fill();
        if(!night && k % 4 === 0){
          ctx.fillStyle = '#5a9a48';
          ctx.fillRect(p[0] - rr * 0.4, p[1] - rr * 0.6, 1.5, 1.5);
        }
        if(boug && z > climb * 0.4 &&
           phash(k, i + s2 * 11, 3812) < 0.16 + sunK * 0.55){
          ctx.fillStyle = night ? '#3c1a30'
            : ['#d6387f', '#b02868', '#e85a9a', '#8e2058'][(k + s2) % 4];
          ctx.beginPath();
          ctx.arc(p[0] + (phash(k, s2, 3813) - 0.5) * rr * 2,
                  p[1] - rr * (0.6 + phash(k, s2, 3814)),
                  rr * (0.7 + phash(k, s2, 3815) * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  /* ---------------- v48: the lived-in ground line ----------------
     Curbside Mission: sunken areaway lightwells railed in iron under the
     raised entries, the black/blue/green toter row tucked against the
     garden wall, tag-and-buff graffiti on garage doors and blank stucco,
     and pigeons holding down the parapet coping. Everything hashed per
     (building, edge) so the street remembers itself frame to frame;
     shadows and pit light ride the same SF_SUN vector as the walls. */

  // areaway lightwell — a sunken basement pit beside the stoop, fenced
  // off the sidewalk by a wrought-iron railing, with a barred half-window
  // in the wall behind it (raised-basement fronts only, never on shops)
  if(det >= 1 && !isShop && L > 10 && style !== 2 && !mural &&
     phash(i, ei, 4800) < 0.55){
    let aU = doorT + (phash(i, ei, 4801) < 0.5 ? -0.42 : 0.42);
    if(garU > 0 && Math.abs(aU - garU) < 0.20) aU = doorT + (aU < doorT ? 0.42 : -0.42);
    aU = clamp(aU, 0.16, 0.84);
    if(Math.abs(aU - doorT) > 0.14 && (garU < 0 || Math.abs(aU - garU) > 0.16)){
      const aHw = Math.min(0.95, L * 0.10), aDep = 0.85;
      const ax0 = x1 + ex * (aU - aHw / L), ay0 = y1 + ey * (aU - aHw / L),
            ax1 = x1 + ex * (aU + aHw / L), ay1 = y1 + ey * (aU + aHw / L);
      // pit floor: concrete sunk below the pavement, always dimmer than
      // the sidewalk — it only catches light when the sun is high enough
      // to see over the railing AND strikes this face (n·L gate)
      const pitLit = night ? 0.30
        : 0.30 + 0.55 * Math.max(0, sunK) *
                 clamp((Math.sin(Math.max(0, SF_SUN.el)) - 0.35) * 2.4, 0, 1);
      quad([[ax0, ay0, 0.04], [ax1, ay1, 0.04],
            [ax1 + nx * aDep, ay1 + ny * aDep, 0.04],
            [ax0 + nx * aDep, ay0 + ny * aDep, 0.04]],
           shade('#5a564c', pitLit));
      // pit rim: the sidewalk edge drops into the well — a dark reveal
      // line along the wall and the two side cheeks
      quad([[ax0, ay0, 0.04], [ax1, ay1, 0.04],
            [ax1, ay1, 0.55], [ax0, ay0, 0.55]], 'rgba(14,11,8,0.42)');
      for(const [sx0, sy0] of [[ax0, ay0], [ax1, ay1]])
        quad([[sx0, sy0, 0.04], [sx0 + nx * aDep, sy0 + ny * aDep, 0.04],
              [sx0 + nx * aDep, sy0 + ny * aDep, 0.92], [sx0, sy0, 0.92]],
             shade('#6a655a', pitLit * 0.8 + 0.15));
      // barred basement half-window inside the well
      const wu = aU, wx = x1 + ex * wu, wy = y1 + ey * wu;
      quad([[wx - ux * 0.34, wy - uy * 0.34, 0.10], [wx + ux * 0.34, wy + uy * 0.34, 0.10],
            [wx + ux * 0.34, wy + uy * 0.34, 0.72], [wx - ux * 0.34, wy - uy * 0.34, 0.72]],
           'rgba(10,9,8,0.9)');
      if(det === 2){
        ctx.strokeStyle = 'rgba(190,185,170,0.55)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let b2 = -1; b2 <= 1; b2++){
          const bA = pr(wx + ux * 0.34 * b2 / 1.6 - nx * 0.02,
                        wy + uy * 0.34 * b2 / 1.6 - ny * 0.02, 0.12),
                bB = pr(wx + ux * 0.34 * b2 / 1.6 - nx * 0.02,
                        wy + uy * 0.34 * b2 / 1.6 - ny * 0.02, 0.70);
          if(bA && bB){ ctx.moveTo(bA[0], bA[1]); ctx.lineTo(bB[0], bB[1]); }
        }
        ctx.stroke();
      }
      // iron railing: top rail + balusters on the outer edge, returns to
      // the wall at both ends — the fence that keeps you out of the pit
      const r0 = pr(ax0 + nx * aDep, ay0 + ny * aDep, 0.94),
            r1 = pr(ax1 + nx * aDep, ay1 + ny * aDep, 0.94);
      if(r0 && r1){
        const iron2 = night ? 'rgba(16,13,11,0.95)' : 'rgba(34,29,25,0.95)';
        ctx.strokeStyle = iron2; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(r0[0], r0[1]); ctx.lineTo(r1[0], r1[1]);
        const nb2 = Math.max(3, Math.floor(Math.abs(r1[0] - r0[0]) / 4));
        for(let k = 0; k <= nb2; k++){
          const u = k / nb2;
          const pA = pr(ax0 + nx * aDep + ex * (aHw * 2 / L) * u,
                        ay0 + ny * aDep + ey * (aHw * 2 / L) * u, 0.05);
          if(!pA) continue;
          ctx.moveTo(pA[0], pA[1]);
          ctx.lineTo(r0[0] + (r1[0] - r0[0]) * u, r0[1] + (r1[1] - r0[1]) * u);
        }
        ctx.stroke();
        // side returns + their posts
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const rEnds = [[ax0, ay0, r0], [ax1, ay1, r1]];
        for(const [sx0, sy0, rE] of rEnds){
          const sT = pr(sx0, sy0, 0.94);
          if(sT){ ctx.moveTo(sT[0], sT[1]); ctx.lineTo(rE[0], rE[1]); }
          const sB = pr(sx0, sy0, 0.05);
          if(sT && sB){ ctx.moveTo(sT[0], sT[1]); ctx.lineTo(sB[0], sB[1]); }
        }
        ctx.stroke();
      }
    }
  }

  // the three-toter row — landfill black, recycling blue, compost green —
  // tucked against the garden wall, each with its own sun-cast smear
  if(det >= 1 && !mural && phash(i, ei, 4810) < (isShop ? 0.22 : 0.42)){
    const nBin = 1 + Math.floor(phash(i, ei, 4811) * 3);
    const bCols = ['#26262a', '#2456a8', '#2e6b34'];
    const start = phash(i, ei, 4812);
    for(let k = 0; k < nBin; k++){
      const bu = clamp(0.07 + ((start + k * 0.9 / Math.max(1, L)) % 0.86), 0.05, 0.93);
      const bx = x1 + ex * bu + nx * 0.95, by = y1 + ey * bu + ny * 0.95;
      const col = bCols[(k + Math.floor(start * 3)) % 3];
      // shadow smear on the pavement — h·cot(el) along the same vector
      // every other prop uses; dies with the sun and under cloud cover
      if(!night && SF_SUN.day > 0.15){
        quad([[bx - ux * 0.30, by - uy * 0.30, 0.02], [bx + ux * 0.30, by + uy * 0.30, 0.02],
              [bx + ux * 0.30 + SF_SUN.x * 1.0, by + uy * 0.30 + SF_SUN.y * 1.0, 0.02],
              [bx - ux * 0.30 + SF_SUN.x * 1.0, by - uy * 0.30 + SF_SUN.y * 1.0, 0.02]],
             `rgba(16,22,40,${0.20 * SF_SUN.day * dim})`);
      }
      // body + slightly proud lid, sun-keyed off the wall normal like a
      // vertical face (toters are matte plastic — cooler than paint)
      quad([[bx - ux * 0.28, by - uy * 0.28, 0.05], [bx + ux * 0.28, by + uy * 0.28, 0.05],
            [bx + ux * 0.28, by + uy * 0.28, 1.02], [bx - ux * 0.28, by - uy * 0.28, 1.02]],
           shade(col, 0.5 + 0.5 * Math.max(0, sunK) * SF_SUN.day + (night ? 0 : 0.1)));
      quad([[bx - ux * 0.31 - nx * 0.06, by - uy * 0.31 - ny * 0.06, 1.02],
            [bx + ux * 0.31 - nx * 0.06, by + uy * 0.31 - ny * 0.06, 1.02],
            [bx + ux * 0.31, by + uy * 0.31, 1.10],
            [bx - ux * 0.31, by - uy * 0.31, 1.10]],
           shade(col, 1.25));
      // lid grab-bar
      const hA = pr(bx - ux * 0.12, by - uy * 0.12, 1.11),
            hB = pr(bx + ux * 0.12, by + uy * 0.12, 1.11);
      if(hA && hB){
        ctx.strokeStyle = 'rgba(12,12,14,0.7)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(hA[0], hA[1]); ctx.lineTo(hB[0], hB[1]); ctx.stroke();
      }
    }
  }

  // tag & buff — Mission ground truth: aerosol throwies on the garage
  // leaf, paint-roller patches on blank garden walls where last month's
  // tag got covered (the patch never quite matches the paint)
  if(det === 2 && !isShop){
    const aer = ['#8e3a9e', '#3a6ea8', '#c8c8cc', '#b8452e', '#2a2a2e'];
    if(garU > 0 && phash(i, ei, 4820) < 0.5){
      // throwie across the door leaf: two hashed zigzag strokes + a
      // flourish underline, drawn proud of the recessed panel
      const gx = x1 + ex * garU - nx * 0.11, gy = y1 + ey * garU - ny * 0.11;
      const tagC = aer[Math.floor(phash(i, ei, 4821) * aer.length)];
      ctx.strokeStyle = tagC; ctx.globalAlpha = 0.85;
      ctx.lineWidth = Math.max(1.2, F * 0.05 / 40);
      ctx.beginPath();
      for(let s2 = 0; s2 < 2; s2++){
        let started = false;
        for(let k = 0; k <= 5; k++){
          const u = (k / 5 - 0.5) * 1.9 + (s2 - 0.5) * 0.5,
                z = 0.45 + s2 * 0.55 + Math.sin(k * 2.6 + phash(i, s2, 4822) * 6) * 0.32;
          const p = pr(gx + ux * u, gy + uy * u, z);
          if(!p){ started = false; continue; }
          started ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
          started = true;
        }
      }
      const uA = pr(gx - ux * 1.0, gy - uy * 1.0, 0.22),
            uB = pr(gx + ux * 1.0, gy + uy * 1.0, 0.30);
      if(uA && uB){ ctx.moveTo(uA[0], uA[1]); ctx.lineTo(uB[0], uB[1]); }
      ctx.stroke(); ctx.globalAlpha = 1;
    } else if(garU < 0 && !mural && phash(i, ei, 4823) < 0.3){
      // buff patch over the water table: a roller rectangle in paint
      // that's always a half-shade off, the old tag ghosting through
      const pu = 0.18 + phash(i, ei, 4824) * 0.6, pw = 0.14 + phash(i, ei, 4825) * 0.12;
      const px0 = x1 + ex * (pu - pw / 2), py0 = y1 + ey * (pu - pw / 2),
            px1 = x1 + ex * (pu + pw / 2), py1 = y1 + ey * (pu + pw / 2);
      // ghost first — the buffed tag bleeding through the new coat
      ctx.strokeStyle = 'rgba(30,26,30,0.16)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for(let k = 0; k <= 4; k++){
        const p = pr(px0 + (px1 - px0) * k / 4, py0 + (py1 - py0) * k / 4,
                     0.5 + Math.sin(k * 2.2 + i) * 0.22);
        if(!p) continue;
        k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      }
      ctx.stroke();
      quad([[px0, py0, 0.12], [px1, py1, 0.12], [px1, py1, 0.98], [px0, py0, 0.98]],
           shade(wallBase, 0.86 + phash(i, ei, 4826) * 0.26));
    }
  }

  // parapet pigeons — the cornice ledge is pigeon country. Dark little
  // bodies riding the coping line, each with a pin-shadow on the ledge
  if(det >= 1 && phash(i, ei, 4830) < 0.5){
    const nPg = 1 + Math.floor(phash(i, ei, 4831) * 3);
    for(let k = 0; k < nPg; k++){
      const pu = 0.15 + phash(i * 3 + k, ei, 4832) * 0.7;
      const pP = pr(x1 + ex * pu + nx * 0.05, y1 + ey * pu + ny * 0.05, hm + para + 0.02);
      if(!pP) continue;
      const bs = Math.max(0.9, F * 0.16 / pP[2]);
      ctx.fillStyle = 'rgba(10,10,14,0.3)';
      ctx.beginPath(); ctx.ellipse(pP[0], pP[1] + bs * 0.4, bs * 1.15, bs * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      const facing = phash(k, i + ei, 4833) < 0.5 ? -1 : 1;
      ctx.fillStyle = night ? '#23232a' : (k % 3 ? '#45454e' : '#5a5a62');
      ctx.beginPath(); ctx.ellipse(pP[0], pP[1] - bs * 0.5, bs * 1.0, bs * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pP[0] + facing * bs * 0.8, pP[1] - bs * 1.25, bs * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e2e36';
      ctx.beginPath();
      ctx.moveTo(pP[0] - facing * bs * 0.9, pP[1] - bs * 0.55);
      ctx.lineTo(pP[0] - facing * bs * 1.7, pP[1] - bs * 0.9);
      ctx.lineTo(pP[0] - facing * bs * 0.9, pP[1] - bs * 0.1);
      ctx.closePath(); ctx.fill();
    }
  }

  // v25: rain weeps off the cornice — drops fall from the parapet edge,
  // accelerating as they go, and burst on the sidewalk. Only near
  // facades resolve drips; beyond ~90m the rain field itself carries it.
  if(W.rain > 0.1 && fwd < 90 && !SF_WALL_BAKE){
    const nD = Math.min(4, Math.max(1, Math.floor(L / 6)));
    for(let k = 0; k < nD; k++){
      const u = 0.15 + phash(i, ei * 7 + k, 1880) * 0.7;
      const dxx = x1 + ex * u, dyy = y1 + ey * u;
      const phase = (SF_WX.t * (1.2 + phash(k, i, 1881) * 0.9) +
                     phash(i, k, 1882)) % 1;
      const z = (hm - 0.1) * (1 - phase * phase);   // accelerating fall
      const dp = pr(dxx, dyy, z), db = pr(dxx, dyy, 0.02);
      if(!dp || !db) continue;
      const streak = Math.max(2, 0.5 * F / dp[2]);
      ctx.strokeStyle = `rgba(200,220,240,${clamp(W.rain, 0, 0.5)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dp[0], dp[1] - streak); ctx.lineTo(dp[0], dp[1]);
      ctx.stroke();
      if(phase > 0.92){ // splash star as the drop lands
        ctx.fillStyle = `rgba(220,235,250,${(phase - 0.92) * 6})`;
        ctx.beginPath();
        ctx.arc(db[0], db[1], Math.max(1, 0.25 * F / db[2]), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* v65: facade garnish — Calle 24 papel-picado strings and porch
     bracket flags. Both stand ~0.3m proud of the wall on real sag
     curves and answer the same wind field the trees lean to: pennants
     cant along-wall downwind, flag cloth streams off the pole tip and
     wraps along the face when the wind blows into it. The impostor
     bake key already folds in windAng + rain, so baked walls stay
     honest to the gust they were baked under. */
  if(det >= 1 && !mural && ny > 0.05 && hm > 5.2 && W.windSpd != null){
    const wAlong = wvx * ux + wvy * uy;
    if(phash(i, ei, 5930) < (isShop ? 0.6 : 0.16)){
      // the garland rides at the mid-facade band — over the shop awning,
      // across the parlor windows — and never above the parapet
      const pz = Math.min(isShop ? 4.3 : 3.45, hm + para - 1.6);
      const pu0 = 0.07, pu1 = 0.93, sag = clamp(L * 0.055, 0.22, 0.6);
      const off = 0.3;
      const PP = ['#d8402e', '#e89820', '#28a0b0', '#d0488a', '#58a038', '#7848c8'];
      const nF = Math.max(4, Math.floor(L * (pu1 - pu0) / 0.52));
      const cord = t => pr(x1 + ex * (pu0 + (pu1 - pu0) * t) + nx * off,
                           y1 + ey * (pu0 + (pu1 - pu0) * t) + ny * off,
                           pz - sag * Math.sin(Math.PI * t));
      ctx.strokeStyle = 'rgba(30,24,18,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath();
      let cs = false;
      for(let k = 0; k <= 8; k++){
        const c = cord(k / 8); if(!c){ cs = false; continue; }
        cs ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]); cs = true;
      }
      ctx.stroke();
      const cant = clamp(wAlong * (W.windSpd || 0), -1, 1) * 0.28;
      const shift = Math.floor(phash(i, ei, 5932) * 6);
      for(let k = 0; k < nF; k++){
        const t0 = pu0 + (pu1 - pu0) * (k + 0.12) / nF,
              t1 = pu0 + (pu1 - pu0) * (k + 0.88) / nF;
        const a = cord((t0 - pu0) / (pu1 - pu0)),
              bq = cord((t1 - pu0) / (pu1 - pu0));
        if(!a || !bq) continue;
        const kick = cant * (0.7 + 0.6 * phash(i, k, 5931));
        const c1 = pr(x1 + ex * t1 + nx * off + ux * kick,
                      y1 + ey * t1 + ny * off + uy * kick,
                      pz - sag * Math.sin(Math.PI * (t1 - pu0) / (pu1 - pu0)) - 0.62);
        const c0 = pr(x1 + ex * t0 + nx * off + ux * kick,
                      y1 + ey * t0 + ny * off + uy * kick,
                      pz - sag * Math.sin(Math.PI * (t0 - pu0) / (pu1 - pu0)) -
                      0.62 * (1 - 0.12 * Math.sin(k * 2.1)));
        if(!c0 || !c1) continue;
        ctx.fillStyle = shade(PP[(k + shift) % 6],
                              Math.max(0.5, Math.min(1.15, lit)));
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]); ctx.lineTo(bq[0], bq[1]);
        ctx.lineTo(c1[0], c1[1]); ctx.lineTo(c0[0], c0[1]);
        ctx.closePath(); ctx.fill();
      }
    }
    // porch flag on a wall bracket — cloth streams downwind off the tip
    if(phash(i, ei, 5940) < (isShop ? 0.34 : 0.2)){
      const fu = 0.08 + phash(i, ei, 5941) * 0.16;
      const fz = Math.min(isShop ? 4.9 : 4.1, hm + para - 1.35);
      const fx = x1 + ex * fu, fy = y1 + ey * fu;
      const b0 = pr(fx + nx * 0.06, fy + ny * 0.06, fz - 0.5),
            tip = pr(fx + nx * 1.05, fy + ny * 1.05, fz + 0.85);
      if(b0 && tip){
        ctx.strokeStyle = night ? '#141008' : '#2c241c';
        ctx.lineWidth = Math.max(1.2, F * 0.02 / tip[2]);
        ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
        let dxw = wvx, dyw = wvy;
        const into = dxw * nx + dyw * ny;
        if(into < -0.2){ dxw -= nx * into; dyw -= ny * into; }
        const wl = Math.hypot(dxw, dyw) || 1; dxw /= wl; dyw /= wl;
        const FL = 1.0, FH = 0.6,
              flut = 0.06 * Math.min(1.5, W.windSpd || 0);
        const stripe = phash(i, ei, 5942) < 0.45
          ? ['#d8402e', '#e89820', '#4a9a5a']
          : [['#28457a'], ['#a03838'], ['#3a7a5a'], ['#d8d0c0']][Math.floor(phash(i, ei, 5943) * 4)];
        for(let s2 = 0; s2 < stripe.length; s2++){
          ctx.fillStyle = shade(stripe[s2], Math.max(0.5, Math.min(1.1, lit)));
          ctx.beginPath();
          let started = false;
          for(let k = 0; k <= 3; k++){
            const t = k / 3,
                  wave = Math.sin(t * 4.4 + i * 1.7 + s2) * flut * t;
            const q = pr(fx + nx * 1.05 + dxw * FL * t - dyw * wave,
                         fy + ny * 1.05 + dyw * FL * t + dxw * wave,
                         fz + 0.85 - FH * s2 / stripe.length - 0.05 * t);
            if(!q){ started = false; continue; }
            started ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            started = true;
          }
          for(let k = 3; k >= 0; k--){
            const t = k / 3,
                  wave = Math.sin(t * 4.4 + i * 1.7 + s2) * flut * t;
            const q = pr(fx + nx * 1.05 + dxw * FL * t - dyw * wave,
                         fy + ny * 1.05 + dyw * FL * t + dxw * wave,
                         fz + 0.85 - FH * (s2 + 1) / stripe.length - 0.05 * t);
            if(q) ctx.lineTo(q[0], q[1]);
          }
          ctx.closePath(); ctx.fill();
        }
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
  const oz = sfElevM(mx, my);      // v37: tires on the roadway's crown
  const prA = pr;
  pr = (x, y, z) => prA(x, y, z + oz);
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
/* v65: curb-lane parklet in the street view — a raised cedar deck with
   a waist-high rail, planter boxes at the ends, and the same furniture
   variants the top-down sprite bakes (tables / umbrella / bench). The
   deck stands in the parking lane a car's hash skipped. */
function sfParkletStreet(o, pr, F, night){
  const mx = o.x / SF_PXM, my = o.y / SF_PXM;
  const oz = sfGroundZ(mx, my);
  const p = pr(mx, my, oz); if(!p) return;
  const sc = F / p[2];
  const ax = o.dir === 0 ? 1 : 0, ay = o.dir === 0 ? 0 : 1,
        bx = ay, by = ax;
  const hl = 2.6, hw = 0.95, dz = 0.16, rail = 1.05;
  const pt = (a, b2, z) => pr(mx + ax * a + bx * b2, my + ay * a + by * b2, oz + z);
  const shadeO = night ? 0.45 : 1;
  // contact shade + the rail's short sun streak on the asphalt
  ctx.fillStyle = 'rgba(14,11,8,0.4)';
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], hl * sc, hw * sc * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  if(!night && SF_SUN.day > 0.08){
    const tp = pr(mx + SF_SUN.x * rail, my + SF_SUN.y * rail,
                  sfGroundZ(mx + SF_SUN.x * rail, my + SF_SUN.y * rail));
    if(tp) sfSoftEllipse((p[0] + tp[0]) / 2, (p[1] + tp[1]) / 2,
                         hl * sc + Math.hypot(tp[0] - p[0], tp[1] - p[1]) / 2,
                         hw * sc * 0.45,
                         Math.atan2(tp[1] - p[1], tp[0] - p[0]),
                         0.22 * Math.min(1, SF_SUN.day + 0.3),
                         sfUmbra(Math.hypot(tp[0] - p[0], tp[1] - p[1])));
  }
  // deck slab: side skirt + board top
  const quadP = (pts, fill) => {
    ctx.fillStyle = fill; ctx.beginPath();
    let st = false;
    for(const q of pts){ if(!q) return; st ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); st = true; }
    ctx.closePath(); ctx.fill();
  };
  quadP([pt(-hl, -hw, 0), pt(hl, -hw, 0), pt(hl, -hw, dz), pt(-hl, -hw, dz)],
        shade('#7a5f3c', 0.72 * shadeO));
  quadP([pt(-hl, hw, 0), pt(hl, hw, 0), pt(hl, hw, dz), pt(-hl, hw, dz)],
        shade('#7a5f3c', 0.6 * shadeO));
  quadP([pt(-hl, -hw, dz), pt(hl, -hw, dz), pt(hl, hw, dz), pt(-hl, hw, dz)],
        shade('#9a7a50', (0.85 + 0.3 * Math.max(0, sfSunFaceK(0, -1))) * shadeO));
  // board seams across the short axis
  ctx.strokeStyle = 'rgba(40,30,18,0.5)'; ctx.lineWidth = 1;
  for(let k = -hl + 0.65; k < hl - 0.3; k += 0.65){
    const s0 = pt(k, -hw, dz + 0.01), s1 = pt(k, hw, dz + 0.01);
    if(!s0 || !s1) continue;
    ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
  }
  // perimeter rail: posts on the long edges + ends, two rail runs
  const iron = night ? '#14100c' : '#34383c';
  ctx.strokeStyle = iron;
  for(let k = -hl; k <= hl + 0.01; k += 1.3){
    for(const e2 of [-hw, hw]){
      const b0 = pt(Math.min(k, hl), e2, dz), t0 = pt(Math.min(k, hl), e2, rail);
      if(!b0 || !t0) continue;
      ctx.lineWidth = Math.max(1, 0.09 * sc);
      ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(t0[0], t0[1]); ctx.stroke();
    }
  }
  for(const e2 of [-hw, hw]){
    const r0 = pt(-hl, e2, rail), r1 = pt(hl, e2, rail),
          m0 = pt(-hl, e2, rail * 0.55), m1 = pt(hl, e2, rail * 0.55);
    if(r0 && r1){
      ctx.lineWidth = Math.max(1.2, 0.12 * sc);
      ctx.beginPath(); ctx.moveTo(r0[0], r0[1]); ctx.lineTo(r1[0], r1[1]); ctx.stroke();
    }
    if(m0 && m1){
      ctx.lineWidth = Math.max(1, 0.07 * sc);
      ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.lineTo(m1[0], m1[1]); ctx.stroke();
    }
  }
  // planter boxes anchoring the ends — soil + leaf tufts over the rail
  for(const e of [-1, 1]){
    const cxa = e * (hl - 0.35);
    quadP([pt(cxa - 0.3, -hw + 0.1, dz), pt(cxa + 0.3, -hw + 0.1, dz),
           pt(cxa + 0.3, hw - 0.1, dz), pt(cxa - 0.3, hw - 0.1, dz)],
          shade('#5a4a34', shadeO));
    for(let m = 0; m < 5; m++){
      const gq = pt(cxa - 0.24 + (m % 3) * 0.24,
                    -hw + 0.3 + m * 0.32, dz + 0.28 + (m % 2) * 0.12);
      if(!gq) continue;
      ctx.fillStyle = m % 2 ? '#4a7a3a' : '#5a8a42';
      ctx.beginPath(); ctx.arc(gq[0], gq[1], Math.max(1.4, 0.14 * sc), 0, Math.PI * 2); ctx.fill();
    }
  }
  // furniture by variant (mirrors sfParkletSpr)
  const furn = night ? '#1c1812' : '#2c241c';
  if(o.v === 1){
    const pl = pt(0, 0, dz), tp2 = pt(0, 0, 2.1);
    if(pl && tp2){
      ctx.strokeStyle = furn; ctx.lineWidth = Math.max(1, 0.07 * sc);
      ctx.beginPath(); ctx.moveTo(pl[0], pl[1]); ctx.lineTo(tp2[0], tp2[1]); ctx.stroke();
      ctx.fillStyle = '#b8542e';
      ctx.beginPath();
      ctx.ellipse(tp2[0], tp2[1], 1.35 * sc, Math.max(1.5, 0.45 * sc), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,235,200,0.35)';
      ctx.beginPath();
      ctx.ellipse(tp2[0] - 0.3 * sc, tp2[1] - 0.1 * sc, 0.7 * sc, 0.2 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for(const e of (o.v === 2 ? [0] : [-0.9, 0.9])){
      const tb = pt(e, 0, 0.72), lg = pt(e, 0, dz);
      if(!tb || !lg) continue;
      ctx.strokeStyle = furn; ctx.lineWidth = Math.max(1, 0.06 * sc);
      ctx.beginPath(); ctx.moveTo(lg[0], lg[1]); ctx.lineTo(tb[0], tb[1]); ctx.stroke();
      ctx.fillStyle = '#8a8074';
      ctx.beginPath();
      ctx.ellipse(tb[0], tb[1], (o.v === 2 ? 1.1 : 0.42) * sc,
                  Math.max(1.2, 0.16 * sc), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
/* v65: the Recology three-cart row in street view — blue/green/black
   cuboids along the curb axis, lids shut, wheels to the street. */
function sfBinsStreet(o, pr, F, night){
  const mx = o.x / SF_PXM, my = o.y / SF_PXM;
  const oz = sfGroundZ(mx, my);
  const p = pr(mx, my, oz); if(!p) return;
  const sc = F / p[2];
  const ax = o.dir === 0 ? 1 : 0, ay = o.dir === 0 ? 0 : 1,
        bx = ay, by = ax;
  const cols = ['#3a68b0', '#4e7a3a', '#2e2c28'];
  ctx.fillStyle = 'rgba(14,11,8,0.35)';
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], 1.1 * sc, Math.max(1.2, 0.3 * sc), 0, 0, Math.PI * 2); ctx.fill();
  for(let k = -1; k <= 1; k++){
    const col = shade(cols[k + 1], night ? 0.45 : 1);
    const hw2 = 0.26, hd = 0.3, h = 1.02;
    const cq = (a, b2, z) => pr(mx + ax * (k * 0.62 + a) + bx * b2,
                                my + ay * (k * 0.62 + a) + by * b2, oz + z);
    // front + top + sun-side faces of a small cuboid
    const F2 = (pts, fill) => {
      const pp = pts.map(q => cq(q[0], q[1], q[2]));
      if(pp.some(q => !q)) return;
      ctx.fillStyle = fill; ctx.beginPath();
      ctx.moveTo(pp[0][0], pp[0][1]);
      for(let q = 1; q < pp.length; q++) ctx.lineTo(pp[q][0], pp[q][1]);
      ctx.closePath(); ctx.fill();
    };
    F2([[-hw2, -hd, 0], [hw2, -hd, 0], [hw2, -hd, h], [-hw2, -hd, h]], col);
    F2([[-hw2, hd, 0], [hw2, hd, 0], [hw2, hd, h], [-hw2, hd, h]], shade(col, 0.8));
    F2([[-hw2, -hd, h], [hw2, -hd, h], [hw2, hd, h], [-hw2, hd, h]], shade(col, 1.18));
  }
}
/* ---------------- v63: WALL IMPOSTOR ATLAS ----------------
   The street pass used to re-trace every cornice bracket, bay sash and
   string course of every facing facade on every frame (~13k canvas ops
   of the ~31k frame). But a wall's APPEARANCE is camera-independent —
   sun sector, wetness and cloud-dim move far slower than the lens. So
   each facing wall is rendered ONCE into a wall-space sprite: the very
   same sfStreetWall pass, driven by a canonical orthographic pr() that
   maps (u along wall, z height) to bake pixels at a fixed 30m focal
   distance. Per frame the sprite is re-projected as a fan of vertical
   drawImage slices — perspective-exact at slice edges, affine inside —
   while haze, canyon shade and pole-wire shadows still composite
   per-frame on top. Rain (animated facade streaks) or a lens inside the
   near plane falls back to the full vector pass. */
const SF_WIM = new Map();          // key -> {c,wpx,hpx,uPad,S,zTopL,zBotL}
const SF_WIM_MAX = 150;
const SF_WIM_S = 11;               // bake px per meter
let SF_WALL_BAKE = false;          // gates camera-ephemeral detail in the bake
function sfWallBakeKey(b, ei, night){
  return [b.i, ei, SF_SUN.q, night ? 1 : 0, Math.round(SF_WX.wet * 8),
          Math.round(W.rain * 4), Math.round((W.windAng || 0) * 8),
          Math.round(sfKarlK() * 6)].join(':');
}
function sfWallImpostor(b, ei, x1, y1, x2, y2, ux, uy, L, nx, ny, hm,
                        pr, night, fwd, cw){
  const zTopL = hm + 6.2, zBotL = -1.0;   // local z span (turret hat headroom)
  const key = sfWallBakeKey(b, ei, night);
  let bk = SF_WIM.get(key);
  if(bk){ SF_WIM.delete(key); SF_WIM.set(key, bk); }       // LRU touch
  else {
    const S = SF_WIM_S, uPad = 2.2;
    const wpx = Math.ceil((L + uPad * 2) * S),
          hpx = Math.ceil((zTopL - zBotL) * S);
    if(wpx > 1100 || hpx > 420 || wpx < 4) return false;
    const c = document.createElement('canvas');
    c.width = wpx; c.height = hpx;
    const g = c.getContext('2d');
    const saveCtx = ctx; ctx = g;
    // canonical lens: u along the wall -> bake x, local z -> bake y,
    // fixed 30m depth so internal thresholds resolve at full detail
    const prB = (qx, qy, qz) =>
      [((qx - x1) * ux + (qy - y1) * uy + uPad) * S,
       (zTopL - qz) * S, 30];
    /* cloud shadow / Karl shade / sunbreak drift continuously — keying
       them would thrash the atlas, so the bake renders them NEUTRAL and
       the draw below composites the same dim/gap math as an overlay */
    const csF = sfCloudShadow, ksF = sfKarlShade, gkF = sfSunGapK;
    sfCloudShadow = () => 0; sfKarlShade = () => 0; sfSunGapK = () => 0;
    SF_WALL_BAKE = true;
    try {
      sfStreetWall(b, ei, x1, y1, x2, y2, x2 - x1, y2 - y1, L,
                   nx, ny, hm, prB, 30 * S, night, 20);
    } finally {
      SF_WALL_BAKE = false; ctx = saveCtx;
      sfCloudShadow = csF; sfKarlShade = ksF; sfSunGapK = gkF;
    }
    bk = { c, wpx, hpx, uPad, S, zTopL, zBotL };
    if(SF_WIM.size >= SF_WIM_MAX)
      SF_WIM.delete(SF_WIM.keys().next().value);
    SF_WIM.set(key, bk);
  }
  // slice fan: u sweeps a padded span so cornice returns survive
  const uLo = -bk.uPad, uHi = L + bk.uPad;
  const b0 = pr(x1 + ux * uLo, y1 + uy * uLo, bk.zBotL),
        b1 = pr(x1 + ux * uHi, y1 + uy * uHi, bk.zBotL);
  if(!b0 || !b1) return false;
  const wScr = b1[0] - b0[0];
  if(Math.abs(wScr) < 3 || Math.abs(wScr) > cw * 2.6) return false;
  if(Math.min(b0[2], b1[2]) < 1.6) return false;   // lens in the wall
  const N = clamp(Math.round(Math.abs(wScr) / 42), 5, 26);
  const flip = wScr < 0;
  for(let k = 0; k < N; k++){
    const ta = k / N, tb = (k + 1) / N;
    const wa = x1 + ux * (uLo + (uHi - uLo) * ta),
          ya = y1 + uy * (uLo + (uHi - uLo) * ta),
          wb = x1 + ux * (uLo + (uHi - uLo) * tb),
          yb = y1 + uy * (uLo + (uHi - uLo) * tb);
    const pa = pr(wa, ya, bk.zBotL), qa = pr(wa, ya, bk.zTopL),
          pb = pr(wb, yb, bk.zBotL), qb = pr(wb, yb, bk.zTopL);
    if(!pa || !qa || !pb || !qb) continue;
    const dx = Math.min(pa[0], pb[0]) - 0.3,
          dw = Math.abs(pb[0] - pa[0]) + 0.6,
          dy = Math.min(qa[1], qb[1]),
          dh = Math.max(pa[1], pb[1]) - dy;
    if(dw <= 0 || dh <= 0) continue;
    const sa = flip ? 1 - tb : ta, sb = flip ? 1 - ta : tb;
    ctx.drawImage(bk.c, sa * bk.wpx, 0, (sb - sa) * bk.wpx, bk.hpx,
                  dx, dy, dw, dh);
  }
  // per-frame overlays: cloud/Karl dim + sunbreak warmth (neutralized in
  // the bake) + aerial haze — same math sfStreetWall folds into colors
  const t0 = pr(x1 + ux * uLo, y1 + uy * uLo, bk.zTopL),
        t1 = pr(x1 + ux * uHi, y1 + uy * uHi, bk.zTopL);
  if(t0 && t1){
    const cx = b.x / SF_PXM, cy = b.y / SF_PXM;
    const dimF = (1 - 0.45 * sfCloudShadow(cx, cy)) *
                 (1 - 0.5 * sfKarlShade(cx, cy));
    const gapK = sfSunGapK(cx, cy) * SF_SUN.day;
    const hz = sfHazeA(fwd);
    const quadF = () => {
      ctx.beginPath();
      ctx.moveTo(b0[0], b0[1]); ctx.lineTo(b1[0], b1[1]);
      ctx.lineTo(t1[0], t1[1]); ctx.lineTo(t0[0], t0[1]);
      ctx.closePath(); ctx.fill();
    };
    if(dimF < 0.985){
      ctx.globalAlpha = Math.min(0.62, 1 - dimF);
      ctx.fillStyle = '#0c1220';
      quadF();
    }
    if(gapK > 0.12){
      ctx.globalAlpha = Math.min(0.26, gapK * 0.26);
      ctx.fillStyle = '#ffe0a8';
      quadF();
    }
    if(hz > 0.01){
      ctx.globalAlpha = hz;
      ctx.fillStyle = `rgb(${SF_WX.hazeRGB})`;
      quadF();
    }
    ctx.globalAlpha = 1;
  }
  return true;
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
    // v36: the boom is physical — clip it against real footprints so the
    // arm never sinks into a facade; pull-in is fast (never clip through
    // a wall), the return is slow (no snap-back pop).
    const clip = sfBoomClip(px, py, -TDX, -TDY, SF_CAM.back, SF_CAM.h);
    if(SF_CAM._backE == null || SF_CAM._snap) SF_CAM._backE = clip;
    const kB = Math.min(1, dtC * (clip < SF_CAM._backE ? 10 : 2.6));
    SF_CAM._backE += (clip - SF_CAM._backE) * kB;
    const backUse = Math.max(1.4, SF_CAM._backE);
    SF_CAM._backUse = backUse;
    tX = px + SF_CAM._leadX - TDX * backUse;
    tY = py + SF_CAM._leadY - TDY * backUse;
    tPitch = SF_CAM.pitch - Math.atan2(Math.max(0, SF_CAM.h - 1.05), Math.max(2, backUse)) * 0.85;
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
    // v36: shake is angular — a long lens magnifies operator tremor, so
    // the breath scales with focal length like real footage
    const hh = 0.55 + 0.45 * SF_CAM.fov;
    useYaw += (Math.sin(SF_WX.t * 0.6) * 0.004 + Math.sin(SF_WX.t * 1.7) * 0.0015) * hh;
    usePitch += Math.sin(SF_WX.t * 0.83 + 1.2) * 0.003 * hh;
  }
  // v36: dutch roll — the operator's wrist lags a pan, so a fast yaw
  // cants the gate a fraction of a degree and settles back to level.
  const yawRate = (useYaw - (SF_CAM._yaw0 == null ? useYaw : SF_CAM._yaw0)) / dtC;
  SF_CAM._yaw0 = useYaw;
  const rollT = clamp(-yawRate * 0.045, -0.02, 0.02) * (SF_CAM.director ? 1 : 0.6);
  SF_CAM._roll = (SF_CAM._roll || 0) + (rollT - (SF_CAM._roll || 0)) * Math.min(1, dtC * 5);
  SF_LENS.roll = SF_CAM._roll;
  const DX = Math.cos(useYaw), DY = Math.sin(useYaw);
  const camX = SF_CAM._sx, camY = SF_CAM._sy;
  // v27: operator bob — the follow lens rides the subject's gait, a ~5cm
  // shoulder sway at step frequency; the director rig stays crane-smooth
  let camH = SF_CAM._sh;
  if(!SF_CAM.director && v && v.moving)
    camH += Math.sin(v.walkPhase || 0) * 0.05;
  camH += sfElevM(camX, camY);     // v37: the lens rides the landform
  SF_EYE.x = camX; SF_EYE.y = camY; SF_EYE.h = camH;   // v51
  const F = Math.max(400, ch * 1.1) * SF_CAM.fov;
  const horizon = ch * 0.42 + Math.tan(usePitch) * F;
  const pr = (x, y, z) => {
    const dx = x - camX, dy = y - camY;
    const fwd = dx * DX + dy * DY;
    const side = dx * DY - dy * DX;
    if(fwd < 0.5) return null;
    return [cw / 2 + side * F / fwd, horizon + (camH - z) * F / fwd, fwd];
  };
  const prFlat = pr;   // v37: terrain-free projection for datum wraps

  // v26: publish the lens focal plane — follow mode focuses on the
  // subject's true distance; director mode focuses where frame-center
  // meets the ground (60m when the lens points at the sky)
  SF_LENS.mode = 'street';
  SF_LENS.horizon = horizon;
  SF_LENS.camHF = camH * F;
  // v27: rack focus — the lens breathes toward its target like a real
  // follow-focus pull instead of snapping to it every frame
  let focT = null;
  if(!SF_CAM.director && v){
    const fp = pr(px, py, sfElevM(px, py));
    if(fp) focT = fp[2];
  } else {
    const yMid = ch * 0.58;
    focT = yMid > horizon + 1
      ? clamp((camH * F) / (yMid - horizon), 4, 400) : 60;
  }
  if(focT != null)
    SF_LENS.foc += (focT - SF_LENS.foc) * Math.min(1, dtC * 7);

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
  // v33: azimuthal forward scatter — the sky dome is not uniformly lit.
  // A wide warm Mie lobe swells around the sun's projected bearing and
  // sinks toward the horizon; turn the camera away from the sun and the
  // sky ahead cools and deepens (the anti-solar veil, with a faint rose
  // belt at real dusk). Drawn under the clouds so bodies still occlude it.
  if(!night && W.rain < 0.3 && SF_SUN.day > 0.08){
    const sF3 = SF_SUN.toX * DX + SF_SUN.toY * DY;
    const sS3 = SF_SUN.toX * DY - SF_SUN.toY * DX;
    if(sF3 > 0.05){
      const lx = cw / 2 + (sS3 / Math.max(0.4, sF3)) * F * 0.9;
      const la = sfSkyLobeA(sF3) * (1 - cover * 0.6);
      const lG = 240 - Math.round(66 * wK), lB = 214 - Math.round(120 * wK);
      const lobe = ctx.createRadialGradient(lx, horizon, 20,
                                            lx, horizon, cw * 0.92);
      lobe.addColorStop(0, `rgba(255,${lG},${lB},${la})`);
      lobe.addColorStop(0.55, `rgba(255,${lG},${lB},${la * 0.4})`);
      lobe.addColorStop(1, `rgba(255,${lG},${lB},0)`);
      ctx.fillStyle = lobe; ctx.fillRect(0, 0, cw, horizon);
    } else {
      const aS = cw / 2 + (-sS3 / Math.max(0.4, -sF3)) * F * 0.9;
      const av = ctx.createRadialGradient(aS, horizon, 30,
                                          aS, horizon, cw * 0.85);
      av.addColorStop(0, `rgba(66,90,138,${0.11 * SF_SUN.day})`);
      av.addColorStop(1, 'rgba(66,90,138,0)');
      ctx.fillStyle = av; ctx.fillRect(0, 0, cw, horizon);
      if(wK > 0.55 && cover < 0.6){
        const bv = ctx.createLinearGradient(0, horizon - 56, 0, horizon);
        bv.addColorStop(0, 'rgba(234,150,140,0)');
        bv.addColorStop(1, `rgba(234,150,140,${0.22 * (wK - 0.55)})`);
        ctx.fillStyle = bv; ctx.fillRect(0, horizon - 56, cw, 56);
      }
    }
  }
  // v9+v67: aerial perspective strength for this frame — now read
  // straight off meteorological visibility (sfVisKm) instead of a
  // humidity-only blend. Clear dry air keeps mid-field facades crisp;
  // a fog intrusion reports single-digit km and every far wall, the
  // skyline and the marine band melt together by the same physics.
  const visKm = night ? 4 : sfVisKm();
  SF_WX.visKm = visKm;
  const fogAFrame = night ? 0.3 : clamp(0.08 + (1 - visKm / 22) * 0.85 +
                                      W.rain * 0.25, 0.08, 0.9);
  SF_WX.hazeK = night ? 0.16 : clamp(3.6 / visKm - 0.07, 0.06, 0.85);
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
      // v27: publish the sun's screen position for the lens-flare pass —
      // ghosts only exist when the disc is actually in/near frame
      SF_LENS.sunX = sx2; SF_LENS.sunY = sy2;
      SF_LENS.sunOn = sx2 > -cw * 0.25 && sx2 < cw * 1.25 &&
                      sy2 > -ch * 0.3 && sy2 < horizon + ch * 0.2;
      SF_LENS.sunK = clamp(1.35 - Math.abs(sx2 - cw / 2) / (cw * 0.95), 0.2, 1) *
                     clamp(sunFwd, 0, 1) * (1 - cover * 0.55);
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
    // v25: 22° halo — thin cirrus (the cirrus streaks below exist on
    // exactly these days) refracts a faint ring around the sun, warm on
    // the inner edge, cool outside. Radius = tan(22°) of view focal.
    if(sunFwd > 0.15 && W.rain < 0.2 && cover > 0.14 && cover < 0.72){
      const sxh = cw / 2 + (sunSide / Math.max(0.4, sunFwd)) * F * 0.9;
      const syh = horizon - sunUp * F * 0.72;
      const hr = Math.tan(22 * Math.PI / 180) * F * 0.9;
      const ha = 0.12 * (1 - cover) * (0.4 + 0.6 * SF_SUN.day);
      if(ha > 0.02){
        ctx.strokeStyle = `rgba(255,228,205,${ha})`;
        ctx.lineWidth = Math.max(2, hr * 0.035);
        ctx.beginPath(); ctx.arc(sxh, syh, hr, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(190,210,255,${ha * 0.7})`;
        ctx.beginPath(); ctx.arc(sxh, syh, hr * 1.05, 0, Math.PI * 2); ctx.stroke();
      }
    }
    // v24+v56: the SAME cloud field, projected at 130m altitude — baked
    // cumulus sprites, lumpy domes lit along the sun's screen bearing,
    // grey level bases, hazed out with distance. The draw now resolves to
    // a screen-rect list FIRST: the crepuscular pass needs the silhouette
    // gaps before any pixel lands, and the rays draw UNDER the bodies so
    // the deck occludes its own light.
    const cs2 = sfClouds(), nC = Math.ceil(cs2.length * (0.25 + 0.75 * cover));
    const sSA = Math.atan2(-0.85, sunSide >= 0 ? 0.55 : -0.55);
    const sq2 = ((Math.round(sSA / (Math.PI / 4)) % 8) + 8) % 8;
    const warmQ2 = wK > 0.45 ? 1 : 0;
    const clL = [];        // [cx, topY, w, h, alpha, sprite]
    for(let i = 0; i < nC; i++){
      const c = cs2[i];
      const [cx2, cy2] = sfCloudPos(c);
      const p = pr(cx2, cy2, SF_CLOUD_ALT);
      if(!p || p[2] > 750) continue;
      const spr = sfCloudSprite(i, sq2, warmQ2);
      if(!spr) break;
      const sc2 = F / p[2] * (0.45 + cover * 0.85);  // v41: same cover-size law as the diorama
      const w = spr.width * sc2 * 0.8, h = spr.height * sc2 * 0.8;
      if(w < 8 || w > cw * 1.8) continue;
      clL.push([p[0], p[1] - h * 0.6, w, h,
                clamp(0.95 - p[2] / 850, 0.22, 0.9) *
                (0.55 + 0.45 * cover) * c.a, spr]);
    }
    /* v56: crepuscular rays born of real gaps — replaces v50's seven fixed
       decorative lanes (art-feedback: causeless rays read as glitch). A
       beam exists only where two deck silhouettes leave a lit slot near
       the sun's bearing — or where the disc itself sits eclipsed behind a
       body and vents past its edges. Every beam fans outward from the sun
       through its gap and dies with distance; all boundaries are gradient
       falloffs, nothing here can draw a hard-edged wedge. */
    if(sunFwd > 0.15 && W.rain < 0.4 && cover > 0.06 && cover < 0.85){
      const sx3 = cw / 2 + (sunSide / Math.max(0.4, sunFwd)) * F * 0.9;
      const sy3 = horizon - sunUp * F * 0.72;
      const iv = [];
      for(const c2 of clL)
        iv.push([c2[0] - c2[2] * 0.42, c2[0] + c2[2] * 0.42,
                 c2[1] + c2[3] * 0.38]);   // silhouette [l, r, midY]
      iv.sort((a, b) => a[0] - b[0]);
      const gaps = [];                     // [anchorX, anchorY, width]
      for(let k = 0; k + 1 < iv.length; k++){
        const gw = iv[k + 1][0] - iv[k][1];
        if(gw < F * 0.03 || gw > F * 0.9) continue;
        const ay = Math.min(iv[k][2], iv[k + 1][2]);
        if(ay > horizon + 10) continue;
        gaps.push([(iv[k + 1][0] + iv[k][1]) / 2, ay, gw]);
      }
      for(const c2 of iv)
        if(sx3 > c2[0] && sx3 < c2[1]){
          gaps.push([c2[0], c2[2], F * 0.10], [c2[1], c2[2], F * 0.10]);
        }
      gaps.sort((a, b) => b[2] - a[2]);
      const beamA = 0.4 * cover * (1 - cover * 0.45) * SF_SUN.day;
      for(let k = 0; k < Math.min(6, gaps.length); k++){
        const ax = gaps[k][0], ay = gaps[k][1], gw = gaps[k][2];
        if(Math.abs(ax - sx3) > F * 1.7) continue;
        let dx = ax - sx3, dy = ay - sy3;
        const dl = Math.hypot(dx, dy);
        if(dl < F * 0.06) continue;
        dx /= dl; dy /= dl;
        if(dy < 0.15){                    // light falls, it does not skim
          dy = 0.15;
          const dl2 = Math.hypot(dx, dy); dx /= dl2; dy /= dl2;
        }
        const L = F * (0.55 + 0.45 * phash(k, 96, 5301));
        const laneA = beamA * clamp(gw / (F * 0.22), 0.2, 1) *
                      (0.6 + phash(k, 97, 5302) * 0.4);
        for(let s = 0; s < 7; s++){
          const t = s / 6;
          const bx = ax + dx * L * t, by = ay + dy * L * t;
          if(by > horizon + 60) break;
          const rad = (0.016 + t * 0.07) * F *
                      (0.7 + phash(k * 7 + s, 98, 5303) * 0.5);
          const a = laneA * (1 - t * 0.75) * 0.5;
          if(a < 0.004 || rad < 3) continue;
          const g = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
          g.addColorStop(0, `rgba(255,238,196,${a})`);
          g.addColorStop(0.55, `rgba(255,234,186,${a * 0.5})`);
          g.addColorStop(1, 'rgba(255,232,180,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(bx, by, rad, rad * 0.42, Math.atan2(dy, dx),
                      0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    for(const c2 of clL){
      ctx.globalAlpha = c2[4];
      ctx.drawImage(c2[5], c2[0] - c2[2] / 2, c2[1], c2[2], c2[3]);
    }
    ctx.globalAlpha = 1;
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
    /* v56: the far field — a compass ring of distant cumulus holding at
       2.4-4km on fixed bearings, so the sky has depth on EVERY heading,
       not only where the local deck happens to drift. They draw small and
       faint above the horizon; the skyline silhouette and the marine haze
       band that render after them do the veiling, the way real distance
       grays a cloud over the East Bay hills. */
    if(cover < 0.75 && W.rain < 0.5){
      const nF = Math.floor(7 + cover * 18);
      for(let k = 0; k < nF; k++){
        const bAng = phash(k, 71, 5560) * Math.PI * 2;
        const dist = 2100 + phash(k, 72, 5561) * 1700;
        const p = pr(camX + Math.cos(bAng) * dist,
                     camY + Math.sin(bAng) * dist,
                     380 + phash(k, 73, 5562) * 420);
        if(!p) continue;
        const spr = sfCloudSprite(k % 8, sq2, warmQ2);
        if(!spr) continue;
        const sc3 = F / p[2] * (0.6 + cover * 0.6);
        const w = spr.width * sc3 * 2.4, h = spr.height * sc3 * 2.4;
        if(w < 16) continue;
        ctx.globalAlpha = (0.58 - cover * 0.12) *
                          clamp(1 - (p[2] - 2100) / 2600, 0.45, 1);
        ctx.drawImage(spr, p[0] - w / 2, p[1] - h * 0.55, w, h);
      }
      ctx.globalAlpha = 1;
    }
    /* v61: distant shower cells — the sfCellField() towers, drawn BEFORE
       the skyline so the towers/marine band veil them. Each cell is a
       dark cumulonimbus column with a sun-warmed crown and a downwind
       anvil; under the base a rain shaft leans along the wind by a
       drop's real fall-drift and either reaches the hills (str > 0.55)
       or hooks and evaporates into virga. */
    if(!night && W.rain < 0.8){
      const cells = sfCellField(), wvx2 = Math.cos(W.windAng),
            wvy2 = Math.sin(W.windAng);
      for(const cell of cells){
        // bearing gate: only cells inside the view cone project sanely —
        // a cell behind the camera can return a tiny forward distance and
        // blow up to fill the sky (the v61-D saucer bug)
        const dAz = Math.atan2(Math.sin(cell.az - useYaw),
                               Math.cos(cell.az - useYaw));
        if(Math.abs(dAz) > 1.05) continue;
        const wx2 = camX + Math.cos(cell.az) * cell.dist,
              wy2 = camY + Math.sin(cell.az) * cell.dist;
        const pB = pr(wx2, wy2, cell.baseZ), pT = pr(wx2, wy2, cell.topZ);
        if(!pB || !pT || pB[2] < 4000) continue;
        const sc4 = F / pB[2], cx3 = pB[0], baseY = pB[1], topY2 = pT[1];
        const wM = cell.wM * sc4;                // shaft half-width, px
        if(wM < 6 || topY2 >= baseY - 6 || baseY < -ch) continue;
        // shaft: curtain from cloud base toward the ground, bottom end
        // displaced downwind by drift = windSpd x fall time (x0.6 —
        // drops shrink and slow as they fall). Virga dies part-way and
        // the streak hooks as the remnant lags even farther downwind.
        const drift = W.windSpd * (cell.baseZ / 5.5) * 0.6;
        const pG = pr(wx2 + wvx2 * drift, wy2 + wvy2 * drift, 0);
        const gx3 = pG ? pG[0] : cx3, gy3 = horizon + 6;
        const reach = cell.virga ? 0.4 + cell.str * 0.5 : 1;
        const endY = baseY + (gy3 - baseY) * reach;
        const endX = cx3 + (gx3 - cx3) * (0.6 + reach * 0.55);
        const wT = wM * 0.62, wB = wT * (0.5 + reach * 0.3);
        const sA = (0.10 + cell.str * 0.22) * (0.5 + cover * 0.5);
        const midY = (baseY + endY) / 2, bend = (endX - cx3) * 0.55;
        const shG = ctx.createLinearGradient(0, baseY, 0, endY);
        shG.addColorStop(0, `rgba(96,104,124,${sA})`);
        shG.addColorStop(0.7, `rgba(110,118,140,${sA * (cell.virga ? 0.55 : 0.85)})`);
        shG.addColorStop(1, `rgba(120,128,148,${cell.virga ? 0 : sA * 0.8})`);
        ctx.fillStyle = shG;
        ctx.beginPath();
        ctx.moveTo(cx3 - wT, baseY);
        ctx.quadraticCurveTo(cx3 - wT + bend, midY, endX - wB, endY);
        ctx.lineTo(endX + wB, endY);
        ctx.quadraticCurveTo(cx3 + wT + bend, midY, cx3 + wT, baseY);
        ctx.closePath(); ctx.fill();
        if(wM > 14){                             // fallstreak texture
          ctx.strokeStyle = `rgba(150,160,184,${sA * 0.5})`;
          ctx.lineWidth = 1;
          const nv = Math.min(7, Math.floor(wM / 9));
          for(let vI = 0; vI < nv; vI++){
            const t3 = (vI + 0.5) / nv;
            ctx.beginPath();
            ctx.moveTo(cx3 - wT + t3 * wT * 2, baseY);
            ctx.quadraticCurveTo(cx3 - wT + t3 * wT * 2 + bend, midY,
                                 endX - wB + t3 * wB * 2, endY);
            ctx.stroke();
          }
        }
        // the cell mass — at 6-15km aerial perspective owns the palette:
        // a dark flat under-base, a haze-mixed tower column, small pale
        // crown lobes catching the low sun, and the anvil — a thin cap
        // streaking DOWNWIND at altitude, projected through pr() so its
        // lean is the real upper wind, not a screen-space cheat.
        const cH = baseY - topY2, hz = SF_WX.hazeRGB;
        ctx.fillStyle = `rgba(70,78,98,${0.24 + cell.str * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(cx3, baseY - cH * 0.04, wM * 0.9,
                    Math.max(2.5, cH * 0.10), 0, 0, Math.PI * 2);
        ctx.fill();
        const bdG = ctx.createLinearGradient(0, topY2, 0, baseY);
        bdG.addColorStop(0, `rgba(${hz},${0.26 + cell.str * 0.2})`);
        bdG.addColorStop(0.45, `rgba(148,156,176,${0.28 + cell.str * 0.28})`);
        bdG.addColorStop(1, `rgba(86,94,114,${0.30 + cell.str * 0.32})`);
        ctx.fillStyle = bdG;
        // slightly lumpy column edge — two side bulges instead of a stack
        // of pale balloons; at 8km+ the tower is a silhouette, not detail
        ctx.beginPath();
        ctx.ellipse(cx3, baseY - cH * 0.42, wM * 0.62, cH * 0.44,
                    0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx3 + (phash(0, cell.sd, 5609) - 0.5) * wM * 0.4,
                    topY2 + cH * 0.22, wM * 0.45, cH * 0.24,
                    0, 0, Math.PI * 2);
        ctx.fill();
        const pA = pr(wx2 + wvx2 * drift * 3.2, wy2 + wvy2 * drift * 3.2,
                      cell.topZ);
        const ax3 = pA ? pA[0] : cx3 + wM * 0.35;
        ctx.strokeStyle = `rgba(${hz},${0.28 + cell.str * 0.2})`;
        ctx.lineWidth = Math.max(1.5, cH * 0.035);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx3 - wM * 0.3, topY2 + cH * 0.05);
        ctx.quadraticCurveTo(cx3, topY2, ax3, topY2 + cH * 0.03);
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
    }
    // v7: stratus deck — when the marine layer wins, the whole sky greys out
    if(cover > 0.55){
      const oa = (cover - 0.55) * 1.5;
      const og = ctx.createLinearGradient(0, 0, 0, horizon);
      og.addColorStop(0, `rgba(96,104,120,${oa})`);
      og.addColorStop(1, `rgba(150,158,172,${oa * 0.5})`);
      ctx.fillStyle = og; ctx.fillRect(0, 0, cw, horizon);
    }
    // v44: the horizon is real geography — skyline silhouettes on true
    // compass bearings (roofline band, downtown NE, Twin Peaks + Sutro
    // WSW), drawn before Karl so the marine layer veils them correctly
    sfSkyline(cw, horizon, F, useYaw, cover, wK, fogAFrame);
    // v6: marine layer — Karl the Fog shouldering over the horizon.
    // v67: strength = the same visibility-derived band as the skyline
    // veil above, so the wall and the veiling agree by construction.
    const fogA = fogAFrame;
    const fh = horizon * (0.08 + fogA * 0.45);
    const fg = ctx.createLinearGradient(0, horizon - fh, 0, horizon + 40);
    fg.addColorStop(0, 'rgba(214,224,232,0)');
    fg.addColorStop(0.72, `rgba(216,226,233,${fogA})`);
    fg.addColorStop(1, `rgba(206,216,226,${fogA * 0.75})`);
    ctx.fillStyle = fg; ctx.fillRect(0, horizon - fh, cw, fh + 40);
    // v34: Karl's wall — the same intrusion front as the top-view tongue,
    // seen edge-on. It only towers on the OCEAN side: strength scales with
    // how squarely the camera looks upwind into the fetch. Ragged cellular
    // top like a real fog bank rolling over the ridge; crowns catch warm
    // sun at golden hour.
    {
      const kwx = Math.cos(W.windAng), kwy = Math.sin(W.windAng);
      const upFace = clamp(-(DX * kwx + DY * kwy), 0, 1);
      const karlA = sfKarlK() * (0.35 + 0.8 * upFace);
      if(karlA > 0.04 && W.rain < 0.7){
        const wallH = fh * (0.6 + karlA * 3.0) + 8;
        const kg2 = ctx.createLinearGradient(0, horizon - wallH, 0, horizon + 34);
        kg2.addColorStop(0, `rgba(232,236,242,${0.55 * karlA})`);
        kg2.addColorStop(0.8, `rgba(208,218,230,${0.95 * karlA})`);
        kg2.addColorStop(1, `rgba(198,210,222,${0.6 * karlA})`);
        ctx.fillStyle = kg2;
        ctx.beginPath();
        ctx.moveTo(-4, horizon + 34);
        const nd = 9;
        ctx.moveTo(0, horizon);
        for(let k = 0; k <= nd; k++){
          const bx = (k / nd) * cw;
          const bh = wallH * (0.5 + phash(k, 71, 3860) * 0.62) *
                     (0.85 + 0.15 * Math.sin(SF_WX.t * 0.11 + k * 1.7));
          ctx.quadraticCurveTo(bx - cw / nd / 2, horizon - bh * 1.5,
                               bx, horizon - bh);
        }
        // sun-warmed fog crowns at golden hour — the top edge glows while
        // the streets below are already in the fog's own shadow
        if(wK > 0.35 && sunFwd > 0.1){
          ctx.save();
          ctx.strokeStyle = `rgba(255,${222 - Math.round(wK * 40)},` +
            `${186 - Math.round(wK * 60)},${0.3 * karlA * wK})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        ctx.lineTo(cw + 4, horizon + 34);
        ctx.lineTo(-4, horizon + 34);
        ctx.closePath(); ctx.fill();
      }
    }
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
                 14: '#bdb7ac', 15: '#d0b78e', 16: '#8a8f98', 0: '#a8977a',
                 23: '#b3a05e' };   // v32: pseudo-tile — cured grass far LOD
  // v32: turf cure ramp — 7 pooled styles from watered green to dry gold,
  // picked per cell by sfGrassDry so the park dries in real drifts
  const grassSt = [];
  {
    const gcA = sfHX('#6cae52'), gcB = sfHX('#c4a862');
    for(let q = 0; q <= 6; q++)
      grassSt[q] = `rgb(${Math.round(gcA.r + (gcB.r - gcA.r) * q / 6)},` +
                   `${Math.round(gcA.g + (gcB.g - gcA.g) * q / 6)},` +
                   `${Math.round(gcA.b + (gcB.b - gcA.b) * q / 6)})`;
  }
  /* v29: the ground pass used to allocate ~18k small arrays per frame and
     re-project shared edges up to 5x (base quad + 4 risers) — the single
     biggest JS+GC cost in street view. Now: persistent typed cell buffers
     sorted by a reusable index, ONE z=0 projection per corner (slab-top
     corners derived arithmetically — pr() is linear in z), riser faces
     reusing those same points (zero extra projections), a precomputed
     static neighbor bitmask replacing ~12 sfTile calls per cell, pooled
     fill buckets/post list (no per-frame Map/array churn), per-frame
     quantized style tables (no per-cell string building), and a far-LOD
     tier: past 130m a cell is subpixel detail under >25% haze, so haze is
     composited INTO the base color and emitted as a single quad with no
     overlay stack. Physics unchanged — same sun, same haze law, same
     curb geometry; only the draw calls merged. */
  let cb = SF_CB.f, ct = SF_CB.t, ord = SF_CB.i, nc = 0;
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
      if(nc >= ct.length){ sfCellGrow(); cb = SF_CB.f; ct = SF_CB.t; ord = SF_CB.i; }
      cb[nc * 3] = gx; cb[nc * 3 + 1] = gy; cb[nc * 3 + 2] = fwd;
      ct[nc] = t; ord[nc] = nc; nc++;
    }
  }
  ord.subarray(0, nc).sort((a, b) => cb[b * 3 + 2] - cb[a * 3 + 2]);
  /* v11: batched ground fills — bucketed by style, flushed ~48 quads per
     path. v29: buckets + post list are pooled across frames. */
  const fills = SF_FILLS, post = SF_POST; post.length = 0;
  const shBlobs = night ? null : sfShadowBlobs();
  if(shBlobs) for(const sc of shBlobs){
    const r2 = 2 * Math.sqrt(sc[2]);   // bbox for cheap cloud-shadow reject
    sc[4] = sc[0] - r2; sc[5] = sc[0] + r2; sc[6] = sc[1] - r2; sc[7] = sc[1] + r2;
  }
  // v47: sunbreak pools — same walk as the shade blobs, offset half a
  // street-spacing across the wind; cells inside a gap get their warm
  // key boosted so the pavement reads alternating shade/sun lanes
  const gapBlobs = night ? null : sfGapBlobs();
  if(gapBlobs) for(const sc of gapBlobs){
    const r2 = 2 * Math.sqrt(sc[2]);
    sc[4] = sc[0] - r2; sc[5] = sc[0] + r2; sc[6] = sc[1] - r2; sc[7] = sc[1] + r2;
  }
  // per-frame style tables — one string per quantized level, not per cell
  const hzSt = [], shSt = [], slpW = [], slpC = [], litSt = [];
  for(let q = 0; q <= 24; q++) hzSt[q] = `rgba(${SF_WX.hazeRGB},${q / 24})`;
  for(let q = 0; q <= 8; q++){
    shSt[q] = `rgba(28,36,60,${q / 24})`;
    slpW[q] = `rgba(255,240,205,${q / 24})`;   // sun-facing slope
    slpC[q] = `rgba(38,50,78,${q / 24})`;      // shying slope
  }
  /* v42: the warm key — pavement in open sun is NOT neutral ground minus
     shade, it is sun-struck: ~5500K direct light over cool skylight. Lit
     cells get a gold kiss scaled by solar elevation (low sun spreads
     thinner) and golden-hour warmth, so the street reads two-tone —
     warm where the sun lands, cool where only the sky lights it. */
  const litK = (night ? 0 : SF_SUN.day) *
             clamp(Math.sin(Math.max(0, SF_SUN.el)) * 1.5, 0, 1) *
             (0.45 + 0.55 * SF_SUN.warm);
  for(let q = 0; q <= 8; q++)
    litSt[q] = `rgba(255,208,138,${(q / 24 * 0.55).toFixed(3)})`;
  const hzRGBv = SF_WX.hazeRGB.split(',');
  const hzR = +hzRGBv[0], hzG = +hzRGBv[1], hzB = +hzRGBv[2];
  const wetV = SF_WX.wet, wetSt = `rgba(26,34,52,${wetV * 0.2})`;
  const farSt = new Map();   // tile*32+hazeStep -> composited rgb() far LOD
  const farCol = (t2, qb) => {
    const k = t2 * 32 + qb; let s = farSt.get(k);
    if(s === undefined){
      const cc = sfHX(COLS[t2] || '#a8977a'), a = qb / 24;
      s = `rgb(${Math.round(cc.r + (hzR - cc.r) * a)},` +
          `${Math.round(cc.g + (hzG - cc.g) * a)},` +
          `${Math.round(cc.b + (hzB - cc.b) * a)})`;
      farSt.set(k, s);
    }
    return s;
  };
  const curbC = [sfCurbFaceCol(0, -1), sfCurbFaceCol(0, 1),
                 sfCurbFaceCol(-1, 0), sfCurbFaceCol(1, 0)]; // n s w e
  const nb = sfNbMasks(), ovrN = sfOvrNums();
  const P = SF_QP;           // 4 z=0 corners (0-7) + 4 slab-top (8-15)
  const qE = (style, a, bq, cq, dq) => {
    let s = fills.get(style);
    if(!s){ s = []; fills.set(style, s); }
    s.push(P[a], P[a + 1], P[bq], P[bq + 1], P[cq], P[cq + 1], P[dq], P[dq + 1]);
  };
  const qP = (style, p1, p2, p3, p4) => {
    let s = fills.get(style);
    if(!s){ s = []; fills.set(style, s); }
    // v50: same horizon/guard clamps as the base quad — a curb lip or
    // riser crossing the near plane or riding above the horizon shears
    // into the same sky wedge otherwise
    const XLQ = Math.max(cw, ch) * 6;
    for(const p of [p1, p2, p3, p4]){
      if(p[1] < horizon) p[1] = horizon;
      if(p[0] > XLQ) p[0] = XLQ; else if(p[0] < -XLQ) p[0] = -XLQ;
      if(p[1] > XLQ) p[1] = XLQ;
    }
    s.push(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]);
  };
  const FAR_D = 130;
  for(let oi = 0; oi < nc; oi++){
    const bi = ord[oi], c = cm;
    const gx = cb[bi * 3], gy = cb[bi * 3 + 1], cfwd = cb[bi * 3 + 2], t = ct[bi];
    const wxm = gx * c, wym = gy * c;
    const gz = (t === 11) ? SF_CURB_H : 0;
    // v37: each corner rides the landform — tiles shear into real slopes
    const e1 = sfElevM(wxm, wym), e2 = sfElevM(wxm + c, wym),
          e3 = sfElevM(wxm + c, wym + c), e4 = sfElevM(wxm, wym + c);
    const p1 = pr(wxm, wym, e1), p2 = pr(wxm + c, wym, e2),
          p3 = pr(wxm + c, wym + c, e3), p4 = pr(wxm, wym + c, e4);
    if(!p1 || !p2 || !p3 || !p4) continue;
    /* v50: near-field gate — a cell whose nearest corner sits within the
       hidden under-lens distance (closer than the ground the frame's own
       bottom edge can resolve) projects that corner to tens of thousands
       of px and the quad shears into a giant wedge smeared across the
       SKY (art-feedback v49-D; worst in director mode, where near cells
       on the uphill side rise above the horizon line). Dropping it loses
       nothing the lens could have shown. */
    {
      const fN = camH * F / Math.max(1, ch - horizon) * 0.55;
      if(Math.min(p1[2], p2[2], p3[2], p4[2]) < Math.max(1.2, fN))
        continue;
    }
    P[0] = p1[0]; P[1] = p1[1]; P[2] = p2[0]; P[3] = p2[1];
    P[4] = p3[0]; P[5] = p3[1]; P[6] = p4[0]; P[7] = p4[1];
    // slab top: pr() is linear in z — top corner = z0 corner lifted by gz*F/fwd
    let T0 = 0;
    if(gz){
      T0 = 8;
      P[8] = P[0];  P[9]  = P[1] - gz * F / p1[2];
      P[10] = P[2]; P[11] = P[3] - gz * F / p2[2];
      P[12] = P[4]; P[13] = P[5] - gz * F / p3[2];
      P[14] = P[6]; P[15] = P[7] - gz * F / p4[2];
    }
    /* v50: horizon guard — the diorama has no terrain mesh, so a ground
       cell on a hill higher than the lens (or straddling the near plane)
       projects ABOVE the horizon line as a hard slate wedge fanned over
       the sky (art-feedback v49-D). The skyline pass owns everything
       above the horizon: pin the quad's top edge to it, which reads as
       a clean ridge silhouette instead of floating triangles. Corners
       also clamp to a guard box so a near-plane blowup can't smear a
       100k-px triangle across the frame. */
    {
      const XLQ = Math.max(cw, ch) * 6;
      for(let qi = 0; qi < (gz ? 16 : 8); qi++){
        if(qi & 1){ if(P[qi] < horizon) P[qi] = horizon; }
        if(P[qi] > XLQ) P[qi] = XLQ; else if(P[qi] < -XLQ) P[qi] = -XLQ;
      }
    }
    const ovr = ovrN.get(gy * SF_M.gw + gx);
    const qb = Math.round(sfHazeA(cfwd) * 24);
    if(cfwd > FAR_D && ovr === undefined){
      // far LOD: haze folded into the tile color, one quad total
      qE(farCol(t === 13 && sfGrassDry(gx, gy) > 0.5 ? 23 : t, qb),
         T0, T0 + 2, T0 + 4, T0 + 6);
      continue;
    }
    qE(ovr !== undefined ? ovr
       : t === 13 ? grassSt[Math.min(6, Math.floor(sfGrassDry(gx, gy) * 7))]
       : (COLS[t] || '#a8977a'), T0, T0 + 2, T0 + 4, T0 + 6);
    // v37: slope lighting — faces angled at the sun catch warm light,
    // shying faces take cool fill, scaled by the live sun
    {
      const sk = -((e2 + e3 - e1 - e4) / (2 * c) * SF_SUN.toX +
                   (e3 + e4 - e1 - e2) / (2 * c) * SF_SUN.toY) *
                 5 * (0.3 + 0.7 * SF_SUN.day);
      if(sk > 0.04) qE(slpW[Math.min(8, Math.round(sk * 24))],
                       T0, T0 + 2, T0 + 4, T0 + 6);
      else if(sk < -0.04) qE(slpC[Math.min(8, Math.round(-sk * 24))],
                             T0, T0 + 2, T0 + 4, T0 + 6);
    }
    const nm = nb[gy * SF_M.gw + gx];   // 4 bits/dir (n,s,w,e): 10|11|16|oob
    const subQ = (x0, y0, x1, y1, style, z) => {
      // v37: z is height ABOVE LOCAL terrain — each corner gets its own
      const q1 = pr(wxm + x0, wym + y0, z + sfElevM(wxm + x0, wym + y0)),
            q2 = pr(wxm + x1, wym + y0, z + sfElevM(wxm + x1, wym + y0)),
            q3 = pr(wxm + x1, wym + y1, z + sfElevM(wxm + x1, wym + y1)),
            q4 = pr(wxm + x0, wym + y1, z + sfElevM(wxm + x0, wym + y1));
      if(q1 && q2 && q3 && q4) qP(style, q1, q2, q3, q4);
    };
    if(t === 11){
      if(cfwd < FAR_D){
        if(cfwd < 90){
          subQ(0, cm / 2 - 0.03, cm, cm / 2 + 0.03, 'rgba(40,36,28,0.30)', gz);
          subQ(cm / 2 - 0.03, 0, cm / 2 + 0.03, cm, 'rgba(40,36,28,0.30)', gz);
        }
        const rv = 'rgba(226,222,210,0.55)';
        if(nm & (1 << 0))  subQ(0, 0, cm, 0.16, rv, gz);
        if(nm & (1 << 4))  subQ(0, cm - 0.16, cm, cm, rv, gz);
        if(nm & (1 << 8))  subQ(0, 0, 0.16, cm, rv, gz);
        if(nm & (1 << 12)) subQ(cm - 0.16, 0, cm, cm, rv, gz);
        // riser faces reuse the base quad's projected edges — no new pr()
        for(let d = 0; d < 4; d++){
          const sh = d * 4;
          if(nm & (10 << sh)) continue;            // sidewalk or void neighbor
          if(nm & (4 << sh)){                      // crosswalk -> sloped apron
            const rp = d === 0 ? [[0, 0, gz], [c, 0, gz], [c, -0.7, 0], [0, -0.7, 0]]
                     : d === 1 ? [[0, c, gz], [c, c, gz], [c, c + 0.7, 0], [0, c + 0.7, 0]]
                     : d === 2 ? [[0, 0, gz], [0, c, gz], [-0.7, c, 0], [-0.7, 0, 0]]
                     :           [[c, 0, gz], [c, c, gz], [c + 0.7, c, 0], [c + 0.7, 0, 0]];
            const pts = rp.map(([dx, dy, z]) =>
              pr(wxm + dx, wym + dy, z + sfElevM(wxm + dx, wym + dy)));
            if(pts.every(Boolean))
              post.push([2, pts[0][0], pts[0][1], pts[1][0], pts[1][1],
                            pts[2][0], pts[2][1], pts[3][0], pts[3][1]]);
            continue;
          }
          // quad(z0 edge -> slab-top edge), order n,s,w,e
          const [a, bq, cq, dq] = d === 0 ? [0, 2, 10, 8]
                                : d === 1 ? [6, 4, 12, 14]
                                : d === 2 ? [0, 6, 14, 8]
                                :           [2, 4, 12, 10];
          qE(curbC[d], a, bq, cq, dq);
        }
      }
    } else if(t === 10 && cfwd < 90){
      const gb = 'rgba(16,18,24,0.30)';
      if(nm & (2 << 0))  subQ(0, 0, cm, 0.5, gb, 0);
      if(nm & (2 << 4))  subQ(0, cm - 0.5, cm, cm, gb, 0);
      if(nm & (2 << 8))  subQ(0, 0, 0.5, cm, gb, 0);
      if(nm & (2 << 12)) subQ(cm - 0.5, 0, cm, cm, gb, 0);
      // v28: gutter windrow — wind and slope row litter against the curb
      if(cfwd < 70){
        const row = (e) => {
          const h = phash(gx, gy, 1901 + 'nsew'.indexOf(e));
          if(h < 0.3) return;
          const a = Math.min(0.34, 0.10 + 0.16 * h +
                                 0.10 * Math.min(1, SF_WX.gust || 0));
          const col = `rgba(56,46,32,${a.toFixed(3)})`,
                leaf = `rgba(146,110,52,${(a + 0.08).toFixed(3)})`;
          const u1 = cm * (0.12 + 0.7 * phash(gx, gy, 1921 + 'nsew'.indexOf(e))),
                u2 = cm * (0.12 + 0.7 * phash(gx, gy, 1931 + 'nsew'.indexOf(e))),
                spk = h > 0.62 && cfwd < 45;
          if(e === 'n' || e === 's'){
            const y0 = e === 'n' ? 0.10 : cm - 0.36;
            subQ(0, y0, cm, y0 + 0.26, col, 0);
            if(spk){ subQ(u1, y0 + 0.04, u1 + 0.22, y0 + 0.14, leaf, 0);
                     subQ(u2, y0 + 0.12, u2 + 0.18, y0 + 0.22, leaf, 0); }
          } else {
            const x0 = e === 'w' ? 0.10 : cm - 0.36;
            subQ(x0, 0, x0 + 0.26, cm, col, 0);
            if(spk){ subQ(x0 + 0.04, u1, x0 + 0.14, u1 + 0.22, leaf, 0);
                     subQ(x0 + 0.12, u2, x0 + 0.22, u2 + 0.18, leaf, 0); }
          }
        };
        if(nm & (2 << 0))  row('n');
        if(nm & (2 << 4))  row('s');
        if(nm & (2 << 8))  row('w');
        if(nm & (2 << 12)) row('e');
      }
      // asphalt wear: darker wheel-track bands along the travel axis
      if(cfwd < 60){
        const v2 = (nm & (1 << 0)) && (nm & (1 << 4));
        const h2 = (nm & (1 << 8)) && (nm & (1 << 12));
        if(v2 && !h2){ subQ(cm * 0.18, 0, cm * 0.32, cm, 'rgba(20,22,28,0.16)');
                       subQ(cm * 0.68, 0, cm * 0.82, cm, 'rgba(20,22,28,0.16)'); }
        else if(h2 && !v2){ subQ(0, cm * 0.18, cm, cm * 0.32, 'rgba(20,22,28,0.16)');
                            subQ(0, cm * 0.68, cm, cm * 0.82, 'rgba(20,22,28,0.16)'); }
      }
      /* v44: same arterial dressing as the baked atlas — red transit
         carpet on curb lanes, double-yellow centerline, stop bars at
         crosswalks, sparse manholes. Median cells already come in green
         through SF_GROUND_OVR. */
      if(SF_ROADW && cfwd < 100){
        const ri = gy * SF_M.gw + gx;
        const rw2 = SF_ROADW[ri], rax = SF_ROADAX[ri], roff = SF_ROADOFF[ri];
        const nearX = (nm & 4) || (nm & (4 << 4)) || (nm & (4 << 8)) ||
                      (nm & (4 << 12));
        if(rw2 >= 7 && rw2 <= 9 && !nearX){
          const curbSide = rax === 0
            ? ((nm & (2 << 0)) || (nm & (2 << 4)))
            : ((nm & (2 << 8)) || (nm & (2 << 12)));
          if(curbSide) subQ(0, 0, cm, cm, 'rgba(166,56,42,0.45)', 0);
          if(Math.abs(roff) <= 1){
            const yl = 'rgba(216,170,54,0.75)';
            if(rax === 1){
              const cxp = cm * (0.5 - roff / 2);
              subQ(cxp - 0.09, 0, cxp - 0.03, cm, yl, 0);
              subQ(cxp + 0.03, 0, cxp + 0.09, cm, yl, 0);
            } else {
              const cyp = cm * (0.5 - roff / 2);
              subQ(0, cyp - 0.09, cm, cyp - 0.03, yl, 0);
              subQ(0, cyp + 0.03, cm, cyp + 0.09, yl, 0);
            }
          }
        }
        if(rw2 >= 10 && Math.abs(roff) <= 2 && cfwd < 70){
          // median lip: pale stone + amber edge line on the outer edge
          if(Math.abs(roff) === 2){
            if(rax === 1){
              const lx = roff > 0 ? cm - 0.22 : 0;
              subQ(lx, 0, lx + 0.22, cm, 'rgba(212,206,190,0.7)', 0);
              subQ(roff > 0 ? cm - 0.02 : -0.16, 0,
                   roff > 0 ? cm + 0.14 : 0.06, cm, 'rgba(214,164,52,0.7)', 0);
            } else {
              const ly = roff > 0 ? cm - 0.22 : 0;
              subQ(0, ly, cm, ly + 0.22, 'rgba(212,206,190,0.7)', 0);
              subQ(0, roff > 0 ? cm - 0.02 : -0.16,
                   cm, roff > 0 ? cm + 0.14 : 0.06, 'rgba(214,164,52,0.7)', 0);
            }
          }
        }
        if(cfwd < 70){
          const bar = 'rgba(234,234,224,0.7)';
          if(nm & (4 << 0))  subQ(0, 0, cm, 0.32, bar, 0);
          if(nm & (4 << 4))  subQ(0, cm - 0.32, cm, cm, bar, 0);
          if(nm & (4 << 8))  subQ(0, 0, 0.32, cm, bar, 0);
          if(nm & (4 << 12)) subQ(cm - 0.32, 0, cm, cm, bar, 0);
          if(!nearX && phash(gx, gy, 1771) < 0.045 && cfwd < 50)
            subQ(cm * 0.32, cm * 0.36, cm * 0.68, cm * 0.64,
                 'rgba(38,42,50,0.8)', 0);
        }
      }
    }
    // v9: aerial perspective — far pavement dissolves into the marine layer
    if(qb > 0) qE(hzSt[qb], T0, T0 + 2, T0 + 4, T0 + 6);
    // v6: cloud shadow sliding over the pavement (v29: bbox reject first)
    let csh = 0;
    if(shBlobs){
      const mx2 = wxm + cm / 2, my2 = wym + cm / 2;
      for(const sc of shBlobs){
        if(mx2 < sc[4] || mx2 > sc[5] || my2 < sc[6] || my2 > sc[7]) continue;
        const dx2 = mx2 - sc[0], dy2 = my2 - sc[1];
        const d2 = dx2 * dx2 + dy2 * dy2;
        if(d2 < sc[2] * 4) csh += sc[3] * Math.exp(-d2 / sc[2]);
      }
      csh = Math.min(1, csh * (0.4 + 0.6 * cover));
    }
    // v41: the fog sheet shadows pavement too — Karl dims the street
    // under itself exactly where the wall dim above does
    csh = Math.min(1, Math.max(csh, sfKarlShade(wxm + cm / 2, wym + cm / 2) * 0.85));
    if(csh > 0.04){
      const qa = Math.round(csh * 0.34 * 24);
      if(qa > 0) qE(shSt[Math.min(8, qa)], T0, T0 + 2, T0 + 4, T0 + 6);
    }
    // v47: sunbreak scalar — a cell standing in a lane-gap between cloud
    // streets catches unobstructed sun (boosted warm key); a cell inside
    // a shade lane does not (gap and shade are mutually exclusive spots)
    let gk = 0;
    if(gapBlobs && csh < 0.35){
      const mx2 = wxm + cm / 2, my2 = wym + cm / 2;
      for(const sc of gapBlobs){
        if(mx2 < sc[4] || mx2 > sc[5] || my2 < sc[6] || my2 > sc[7]) continue;
        const dx2 = mx2 - sc[0], dy2 = my2 - sc[1];
        const d2 = dx2 * dx2 + dy2 * dy2;
        if(d2 < sc[2] * 4) gk += sc[3] * Math.exp(-d2 / sc[2]);
      }
      gk = Math.min(1, gk * (1 - cover * 0.5));
    }
    // v42: the sun's warm key on whatever the shade leaves lit — grass,
    // asphalt, sidewalk all read gold in open sun, cool where cloud,
    // canyon or Karl already claimed the cell (lit ∝ 1 - csh)
    if(litK > 0.04 && csh < 0.9){
      const ql = Math.min(8, Math.round(litK * (1 - csh) * (1 + 0.85 * gk) * 8));
      if(ql > 0) qE(litSt[ql], T0, T0 + 2, T0 + 4, T0 + 6);
    }
    // v7: wetness memory — hardscape darkens, puddles mirror the sky
    if(wetV > 0.05 && (t === 10 || t === 11 || t === 14 || t === 16)){
      qE(wetSt, T0, T0 + 2, T0 + 4, T0 + 6);
      if(wetV > 0.3 && hash2(wxm | 0, wym | 0, SEED + 1820) < wetV * 0.45)
        post.push([1, P[T0], P[T0 + 1], P[T0 + 2], P[T0 + 3],
                      P[T0 + 4], P[T0 + 5], P[T0 + 6], P[T0 + 7], wetV]);
    }
    if(t === 16 && cfwd < FAR_D)
      post.push([0, P[T0], P[T0 + 1], P[T0 + 2], P[T0 + 3],
                    P[T0 + 4], P[T0 + 5], P[T0 + 6], P[T0 + 7]]);
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
    a.length = 0;            // pooled — keep the bucket, drop the coords
  }
  if(fills.size > 480) fills.clear();   // bound stale style keys
  for(const q of post){
    if(q[0] === 2){
      // v28: curb-ramp apron — sloped concrete quad, gutter-dark at the
      // street edge fading to walkway pale at the sidewalk lip
      ctx.fillStyle = '#a29c90';
      ctx.beginPath();
      ctx.moveTo(q[1], q[2]); ctx.lineTo(q[3], q[4]);
      ctx.lineTo(q[5], q[6]); ctx.lineTo(q[7], q[8]);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(40,36,30,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(q[5], q[6]); ctx.lineTo(q[7], q[8]); ctx.stroke();
      continue;
    }
    if(q[0] === 0){
      ctx.fillStyle = 'rgba(232,230,223,0.55)';
      ctx.beginPath();
      ctx.moveTo((q[1] + q[3]) / 2, q[2]); ctx.lineTo((q[5] + q[7]) / 2, q[6]);
      ctx.lineTo(q[7], q[8]); ctx.lineTo(q[1], q[2]); ctx.fill();
    } else {
      const wv = q[9];
      const cxp = (q[1] + q[3] + q[5] + q[7]) / 4,
            cyp = (q[2] + q[4] + q[6] + q[8]) / 4;
      const prw = Math.max(2, Math.hypot(q[3] - q[1], q[4] - q[2]) * 0.28);
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
  post.length = 0;
  SF_PERF.info = nc + 'cl/' + fills.size + 'fl';

  /* v25: wet-mirror sun glare — wet asphalt is a horizontal mirror, so
     when the sun hangs ahead of the camera the roadway throws a bright
     smeared column back at the viewer, widening toward the lens.
     v51: the lane isn't rain-only — crushed aggregate and polished
     bitumen return a weak forward-scatter sheen at grazing angles too,
     so a dry street keeps a faint hot column down-sun. */
  if(!night && SF_SUN.day > 0.2){
    const sunFwd2 = SF_SUN.toX * DX + SF_SUN.toY * DY;
    if(sunFwd2 > 0.1){
      const sunSide2 = SF_SUN.toX * DY - SF_SUN.toY * DX;
      const sxr = cw / 2 + (sunSide2 / Math.max(0.4, sunFwd2)) * F * 0.9;
      if(sxr > -100 && sxr < cw + 100){
        const wv2 = SF_WX.wet > 0.12 ? SF_WX.wet : 0.16;
        const cap = SF_WX.wet > 0.12 ? 0.3 : 0.075;
        const gg = ctx.createLinearGradient(0, horizon, 0, ch);
        gg.addColorStop(0, `rgba(255,240,205,${clamp(0.22 * wv2 * SF_SUN.day * (0.55 + 0.45 * sunFwd2), 0, cap)})`);
        gg.addColorStop(1, 'rgba(255,240,205,0)');
        ctx.fillStyle = gg;
        const hw2 = F * 0.10 * (0.6 + wv2);
        ctx.beginPath();
        ctx.moveTo(sxr - hw2 * 0.35, horizon);
        ctx.lineTo(sxr + hw2 * 0.35, horizon);
        ctx.lineTo(sxr + hw2, ch); ctx.lineTo(sxr - hw2, ch);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  /* v23: street-canyon cast shadows — each building's footprint swept
     along the real sun vector pools across the pavement as one mass of
     sky-lit shade (wide penumbra + umbra core, both in a single path so
     overlapping sweeps never double-darken). Before this pass only a
     thin ribbon hugged each wall base, so the street read flat-lit even
     when the sun was scraping the cornice line. */
  if(!night && SF_SUN.day > 0.08){
    const shA = 0.46 * Math.min(1, SF_SUN.day + 0.25) * (1 - cover * 0.55);
    if(shA > 0.03){
      /* v38: the sweep used to re-project every footprint edge three
         times (once per penumbra layer) through px-space coords — ~30k
         redundant projections a frame. Now the pass is two-phase: ONE
         walk over visible footprints projects each base edge + caches
         the meter poly (sfBldMPoly, shared with the wall pass), then
         each layer only re-projects the displaced rim (the part that
         actually differs between layers). Same shapes, same order —
         the pixels are identical. */
      const shGeo = [];   // flat: per building [edges flat8..., caps per layer]
      for(const b of SF_BLD){
        const bxm = b.x / SF_PXM, bym = b.y / SF_PXM;
        const ddx = bxm - camX, ddy = bym - camY;
        const fwdS = ddx * DX + ddy * DY;
        if(fwdS < -80 || fwdS > 200) continue;
        if(Math.abs(ddx * DY - ddy * DX) > Math.max(50, fwdS * 1.6 + 70))
          continue;
        const P2 = sfBldMPoly(b), nP = P2.length, hm2 = b.hPx / 4.2;
        const base = [];
        for(let e = 0; e < nP; e++){
          const a1 = P2[e], a2 = P2[(e + 1) % nP],
                q1 = pr(a1[0], a1[1], 0.02 + sfElevM(a1[0], a1[1])),
                q2 = pr(a2[0], a2[1], 0.02 + sfElevM(a2[0], a2[1]));
          base.push(a1[0], a1[1], a2[0], a2[1], q1 && q1[0], q1 && q1[1],
                    q2 && q2[0], q2 && q2[1]);
        }
        shGeo.push(base, P2, hm2);
      }
      for(const [mul, al] of [[1.15, shA * 0.35], [1.0, shA * 0.7],
                              [0.6, shA]]){
        ctx.beginPath();
        for(let gi = 0; gi < shGeo.length; gi += 3){
          const base = shGeo[gi], P2 = shGeo[gi + 1],
                ox = SF_SUN.x * shGeo[gi + 2] * mul,
                oy = SF_SUN.y * shGeo[gi + 2] * mul;
          for(let e = 0; e < base.length; e += 8){
            const ax = base[e], ay = base[e + 1],
                  bx2 = base[e + 2], by2 = base[e + 3],
                  q3 = pr(bx2 + ox, by2 + oy,
                          0.02 + sfElevM(bx2 + ox, by2 + oy)),
                  q4 = pr(ax + ox, ay + oy,
                          0.02 + sfElevM(ax + ox, ay + oy));
            if(base[e + 4] === false || base[e + 6] === false ||
               !q3 || !q4) continue;
            /* v50: horizon/guard clamp — a displaced shadow tip that
               lands near the camera film plane projects to tens of
               thousands of px, turning one quad into a giant dark wedge
               smeared across the sky (art-feedback v49-D). Shadow
               sweeps lie ON the ground, so the same rule as the ground
               pass applies: nothing below the skyline — pin stray
               vertices to the horizon and bound them to a guard box. */
            const XL = Math.max(cw, ch) * 5;
            const gc = (p, bi) => {
              if(p[1] < horizon) p[1] = horizon;
              if(p[0] > XL) p[0] = XL; else if(p[0] < -XL) p[0] = -XL;
              if(p[1] > XL) p[1] = XL;
              if(bi !== undefined){ base[bi] = p[0]; base[bi + 1] = p[1]; }
            };
            const b1 = [base[e + 4], base[e + 5]],
                  b2 = [base[e + 6], base[e + 7]];
            gc(b1, e + 4); gc(b2, e + 6); gc(q3); gc(q4);
            ctx.moveTo(b1[0], b1[1]);
            ctx.lineTo(b2[0], b2[1]);
            ctx.lineTo(q3[0], q3[1]); ctx.lineTo(q4[0], q4[1]);
            ctx.closePath();
          }
          // displaced cap fills the silhouette interior past the far edge
          let st = false;
          const XL2 = Math.max(cw, ch) * 5, capPts = [];
          for(const q of P2){
            const qx = q[0] + ox, qy = q[1] + oy;
            const p = pr(qx, qy, 0.02 + sfElevM(qx, qy));
            if(!p){ capPts.push(null); continue; }
            if(p[1] < horizon) p[1] = horizon;
            if(p[0] > XL2) p[0] = XL2; else if(p[0] < -XL2) p[0] = -XL2;
            if(p[1] > XL2) p[1] = XL2;
            capPts.push(p);
          }
          for(const p of capPts){
            if(!p){ st = false; continue; }
            st ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
            st = true;
          }
          if(st) ctx.closePath();
        }
        ctx.fillStyle = `rgba(30,38,64,${al})`;
        ctx.fill();
      }
    }
  }

  // drawables: buildings, props, pawns — far -> near
  /* v38: the gather cone used to run side < 1.6*fwd+60 — more than twice
     the widest gate the lens can produce (fov 0.55 -> side/fwd ~1.3 at
     16:9). Walls a full 60° off-axis were projected, dressed and filled
     for zero pixels. The cone now tracks the real frustum
     (side < 1.45*fwd) plus a building half-extent margin. */
  const ds = [];
  for(const b of SF_BLD){
    const bxm = b.x / SF_PXM, bym = b.y / SF_PXM;
    const ddx = bxm - camX, ddy = bym - camY;
    const fwd = ddx * DX + ddy * DY, side = Math.abs(ddx * DY - ddy * DX);
    if(fwd > 0.3 && fwd < 260 && side < fwd * 1.45 + 30)
      ds.push({ k: 'b', fwd, b });
  }
  // v11: props via the chunk index — walk only the chunks under the view
  // cone's bounding box (reach 120m, lateral 1.45*fwd+12, plus a cell of
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
          if(fwd > 0.5 && fwd < 120 && side < fwd * 1.45 + 12)
            ds.push({ k: 'p', fwd, o });
        }
      }
    }
  }
  for(const pv of VILLAGERS){
    if(pv.inBuilding) continue;
    const vx = pv.x / SF_PXM, vy = pv.y / SF_PXM;
    const ddx = vx - camX, ddy = vy - camY;
    const fwd = ddx * DX + ddy * DY, side = Math.abs(ddx * DY - ddy * DX);
    if(fwd > 0.3 && fwd < 160 && side < fwd * 1.45 + 15)
      ds.push({ k: 'v', fwd, pv });
  }
  ds.sort((a, b) => b.fwd - a.fwd);

  /* v27: cutaway — everything sitting on the camera→subject sightline
     ghosts out so the follow lens never loses its subject. Buildings
     are tested as real segment∩polygon; props inside a 2.3m corridor. */
  SF_GHOST = null; SF_GHOST_P = null;
  if(SF_CUT.on && !SF_CAM.director && v && !v.inBuilding){
    SF_GHOST = sfGhostSet(camX, camY, px, py);
    const subjFwd = (px - camX) * DX + (py - camY) * DY;
    for(const d of ds){
      if(d.k !== 'p' || d.o.kind === 'sfCar' || d.fwd > subjFwd - 1) continue;
      const o = d.o;
      if(sfSegDist(o.x / SF_PXM, o.y / SF_PXM, camX, camY, px, py) < 2.3){
        if(!SF_GHOST_P) SF_GHOST_P = new Set();
        SF_GHOST_P.add(o);
      }
    }
  }

  for(const d of ds){
    ctx.globalAlpha = 1;
    if(d.k === 'b'){
      const b = d.b;
      const gh = SF_GHOST && SF_GHOST.has(b.i);
      if(gh) ctx.globalAlpha = 0.30;
      /* v68: near-plane dissolve — a footprint the lens sits inside of,
         or that straddles the near plane, can't be photographed whole:
         its roof used to hang in the gate as a floating wedge while the
         near wall culled behind the camera. It ghosts like a cutaway
         occluder instead, so the mass reads as x-ray, not artifact. */
      let nearGh = false;
      if(!gh && d.fwd < 90){
        const Pn = sfBldMPoly(b), bb = b._pbb;
        let bh = false, fr = false;
        for(const [qx, qy] of Pn){
          if((qx - camX) * DX + (qy - camY) * DY < 0.7) bh = true;
          else fr = true;
          if(bh && fr) break;
        }
        nearGh = (bh && fr) ||
          (camX > bb[0] - 1.5 && camX < bb[2] + 1.5 &&
           camY > bb[1] - 1.5 && camY < bb[3] + 1.5 &&
           sfPtInPoly(Pn, camX, camY));
        if(nearGh) ctx.globalAlpha = 0.24;
      }
      const hm = b.hPx / 4.2; // meters
      // v37: the whole massing rides the lot datum — walls, roofs and
      // trim all project from the terrain at the building centroid
      const zb3 = sfElevM(b.x / SF_PXM, b.y / SF_PXM);
      const pr = (qx, qy, qz) => prFlat(qx, qy, qz + zb3);
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
      /* v38: whole-building gate reject — the centroid cone keeps some
         masses whose footprints sit entirely outside the gate; those
         used to run the full roofscape pass (clips, dormers, chimneys,
         railings) for zero pixels. If EVERY roof-ring corner projects
         (none behind the lens) and all land beyond the same screen edge,
         the massing can contribute nothing — walls and roof skip
         together. Buildings partially behind the camera can span the
         whole frame, so any null corner keeps the building. */
      {
        let allIn = true, minX = 1e9, maxX = -1e9;
        for(const [rx, ry] of P){
          const rp = pr(rx, ry, hm);
          if(!rp){ allIn = false; break; }
          if(rp[0] < minX) minX = rp[0];
          if(rp[0] > maxX) maxX = rp[0];
        }
        if(allIn && (maxX < -60 || minX > cw + 60)) continue;
      }
      for(let e = 0; e < n; e++){
        const [x1, y1] = P[e], [x2, y2] = P[(e + 1) % n];
        const ex = x2 - x1, ey = y2 - y1, L = Math.hypot(ex, ey) || 1;
        let nx = ey / L, ny = -ex / L;
        if(ccw){ nx = -nx; ny = -ny; }
        const facingCam = (nx * -DX + ny * -DY) > 0.05; // wall faces camera
        if(!facingCam) continue;
        /* v38: per-edge gate reject — the centroid cone keeps buildings
           whose far edges still sit outside the gate. A wall only needs
           drawing if at least one endpoint lands inside the horizontal
           gate (±side < own fwd scaled to the lens, with a 10m margin
           for its cornice projection and screen edge bleed). */
        {
          const f1 = (x1 - camX) * DX + (y1 - camY) * DY,
                f2 = (x2 - camX) * DX + (y2 - camY) * DY,
                s1 = (x1 - camX) * DY - (y1 - camY) * DX,
                s2 = (x2 - camX) * DY - (y2 - camY) * DX,
                lat1 = f1 * 1.45 + 10, lat2 = f2 * 1.45 + 10;
          if((s1 > lat1 && s2 > lat2) || (s1 < -lat1 && s2 < -lat2))
            continue;
        }
        // v63: impostor atlas — the baked wall sprite re-projects as a
        // slice fan; rain streaks + extreme near-plane stay on vectors
        if(W.rain > 0.1 ||
           !sfWallImpostor(b, e, x1, y1, x2, y2, ex / L, ey / L, L,
                           nx, ny, hm, pr, night, d.fwd, cw))
          sfStreetWall(b, e, x1, y1, x2, y2, ex, ey, L, nx, ny, hm, pr, F, night, d.fwd);
        /* v23/v39: canyon shade band — the row across the street steals
           the low sun. v39: the shade line is now PROBED, not guessed —
           sfCanyonShade marches the sun ray at N points along the wall,
           so the light that pours through gaps between opposite masses
           (street crossings, narrow lots, a low shopfront between tall
           flats) lands on the facade as real gold stripes instead of a
           single diagonal. Occluder heights are absolute (terrain-aware),
           and a 0.55m penumbra skirt feathers the edge — the sun's disc
           is ~0.5°, so a hard line is the lie. */
        const ux2 = ex / L, uy2 = ey / L;
        let zsA = null;
        if(!night && SF_SUN.day > 0.08 &&
           nx * SF_SUN.toX + ny * SF_SUN.toY > 0.04){
          const NS = d.fwd > 140 ? 3 : 8;
          zsA = new Array(NS + 1); let zMax = 0;
          for(let k = 0; k <= NS; k++){
            const u = k / NS;
            zsA[k] = Math.min(hm, sfCanyonShade(
              x1 + ex * u + nx * 0.5, y1 + ey * u + ny * 0.5, b.i));
            if(zsA[k] > zMax) zMax = zsA[k];
          }
          if(zMax > 0.3){
            // project base + umbra edge + penumbra edge once
            const qB = [], qT = [], qP = [];
            let ok3 = true;
            for(let k = 0; k <= NS; k++){
              const u = k / NS;
              qB.push(pr(x1 + ex * u, y1 + ey * u, 0));
              qT.push(pr(x1 + ex * u, y1 + ey * u, zsA[k]));
              qP.push(pr(x1 + ex * u, y1 + ey * u,
                        Math.min(hm, zsA[k] + 0.55)));
              if(!qB[k] || !qT[k] || !qP[k]){ ok3 = false; break; }
            }
            if(ok3){
              const a0 = (0.52 + 0.12 * SF_SUN.warm) *
                         Math.min(1, SF_SUN.day + 0.2) * (1 - cover * 0.5);
              const shadePoly = (tops, alpha) => {
                ctx.fillStyle = `rgba(24,30,52,${alpha})`;
                ctx.beginPath();
                ctx.moveTo(qB[0][0], qB[0][1]);
                for(let k = 1; k <= NS; k++)
                  ctx.lineTo(qB[k][0], qB[k][1]);
                for(let k = NS; k >= 0; k--)
                  ctx.lineTo(tops[k][0], tops[k][1]);
                ctx.closePath(); ctx.fill();
              };
              shadePoly(qP, a0 * 0.35);   // penumbra skirt above the line
              shadePoly(qT, a0);          // umbra core below it
              // warm bounce: the lit facade opposite kicks a whisper of
              // reflected gold back into the shade near the pavement
              const zm1 = zsA[0], zm2 = zsA[NS];
              const bA = pr(x1, y1, Math.min(1.4, zm1)),
                    bB = pr(x2, y2, Math.min(1.4, zm2)),
                    q1 = qB[0], q2 = qB[NS];
              if(bA && bB){
                const bg = ctx.createLinearGradient(0, Math.min(bA[1], bB[1]),
                                                    0, Math.max(q1[1], q2[1]));
                bg.addColorStop(0, 'rgba(255,190,120,0)');
                bg.addColorStop(1, `rgba(255,190,120,${0.12 * SF_SUN.warm})`);
                ctx.fillStyle = bg;
                ctx.beginPath();
                ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]);
                ctx.lineTo(bB[0], bB[1]); ctx.lineTo(bA[0], bA[1]);
                ctx.closePath(); ctx.fill();
              }
            }
          }
        }
        /* v39: pole-wire shadows — the v20 catenary spans hang ~7m up in
           front of these facades; their sun rays land on the wall as the
           thin wandering lines every Mission block carries. Solved per
           conductor (two heights, same drops as the wire pass), clipped
           to the wall quad, skipped where the canyon umbra already owns
           the pixel — a shadow inside a shadow casts nothing. */
        if(!night && SF_SUN.day > 0.12 && d.fwd < 150 &&
           nx * SF_SUN.toX + ny * SF_SUN.toY > 0.15 && SF_WIRES.length){
          const c0 = pr(x1, y1, 0), c1 = pr(x2, y2, 0),
                c2 = pr(x2, y2, hm + 1.2), c3 = pr(x1, y1, hm + 1.2);
          if(c0 && c1 && c2 && c3){
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]);
            ctx.lineTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]);
            ctx.closePath(); ctx.clip();
            ctx.strokeStyle = `rgba(22,28,48,${(0.10 + 0.09 * SF_SUN.day) * (1 - cover * 0.6)})`;
            for(const wg of SF_WIRES){
              const wmx = (wg.x1 + wg.x2) / 2 / SF_PXM,
                    wmy = (wg.y1 + wg.y2) / 2 / SF_PXM;
              // cheap reject: midpoint must throw toward this wall
              const tM = sfWireShadow(wmx, wmy, 7, x1, y1, ux2, uy2, nx, ny, L);
              if(!tM || tM.u < -0.7 || tM.u > 1.7 || tM.z < -2 || tM.z > hm + 3)
                continue;
              for(const [wz, drop] of [[7.15, 0.55], [6.8, 0.8]]){
                const h0 = sfWireShadow(wg.x1 / SF_PXM, wg.y1 / SF_PXM, wz,
                                        x1, y1, ux2, uy2, nx, ny, L),
                      h1 = sfWireShadow(wg.x2 / SF_PXM, wg.y2 / SF_PXM, wz,
                                        x1, y1, ux2, uy2, nx, ny, L),
                      hM = sfWireShadow(wmx, wmy, wz - drop,
                                        x1, y1, ux2, uy2, nx, ny, L);
                if(!h0 || !h1 || !hM) continue;
                if((h0.u < -0.15 || h0.u > 1.15) &&
                   (h1.u < -0.15 || h1.u > 1.15) &&
                   (hM.u < -0.15 || hM.u > 1.15)) continue;
                // the umbra swallows thin shadows — skip buried segments
                if(zsA && hM.u >= 0 && hM.u <= 1){
                  const zi = Math.round(hM.u * (zsA.length - 1));
                  if(hM.z < zsA[zi] - 0.15) continue;
                }
                const q0 = pr(wg.x1 / SF_PXM - SF_SUN.toX * h0.s,
                              wg.y1 / SF_PXM - SF_SUN.toY * h0.s, h0.z),
                      q1 = pr(wg.x2 / SF_PXM - SF_SUN.toX * h1.s,
                              wg.y2 / SF_PXM - SF_SUN.toY * h1.s, h1.z),
                      qM = pr(wmx - SF_SUN.toX * hM.s,
                              wmy - SF_SUN.toY * hM.s, hM.z);
                if(!q0 || !q1 || !qM) continue;
                ctx.lineWidth = Math.max(0.7, 0.05 * F / Math.max(1, qM[2]));
                ctx.beginPath();
                ctx.moveTo(q0[0], q0[1]);
                // quadratic through the true midpoint shadow
                ctx.quadraticCurveTo(
                  2 * qM[0] - (q0[0] + q1[0]) / 2,
                  2 * qM[1] - (q0[1] + q1[1]) / 2,
                  q1[0], q1[1]);
                ctx.stroke();
              }
            }
            ctx.restore();
          }
        }
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
        // v38: past 140m a dormer resolves to ~8px under marine haze —
        // the slope fill + haze already carries it, so the detail pass
        // is skipped (silhouette unchanged).
        if(rk === 'gable' && d.fwd < 140){
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
        /* v58: wet tar mirrors the sky — after rain the membrane takes a
           sky-colored glaze that strengthens toward the far parapet line
           (grazing-angle reflection). Same physics as the ponding bake. */
        if(!night && SF_WX.wet > 0.35){
          const sg = ctx.createLinearGradient(0, yMin, 0, yMax);
          sg.addColorStop(0, `rgba(186,212,238,${0.20 * SF_WX.wet})`);
          sg.addColorStop(1, `rgba(186,212,238,${0.05 * SF_WX.wet})`);
          ctx.fillStyle = sg; ctx.fill();
        }
        // v9: aerial perspective — far roofs sink into the marine layer
        const rHz = sfHazeA(d.fwd);
        if(rHz > 0.02){
          ctx.fillStyle = `rgba(${SF_WX.hazeRGB},${rHz})`;
          ctx.fill();
        }
        // faint tar-paper seams across the roof plane
        // (v38: subpixel past ~90m — clipped strokes cost more than they show)
        if(!night && d.fwd < 90 && rpts.length >= 3){
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
          : Math.floor(phash(b.i, k, 1507) * 9); // v22: +bulkhead, +planters
        const base = pr(fx, fy, hm + zR);
        // v38: 200m -> 150m cutoff — past that a tank/dish is <10px of
        // haze-filtered silhouette the roof cap already implies
        if(!base || base[2] > 150) continue;
        const sc = F / base[2];
        ctx.strokeStyle = night ? '#1c1a18' : '#4a4540';
        ctx.fillStyle = night ? '#262220' : '#6a5f52';
        if(pitched && kind === 5){ // v12 brick chimney + terracotta pot on the ridge
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
          // (v22: reachable again — the chimney branch is pitched-only now)
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
        } else if(kind === 7){ // v22 stair bulkhead: the box housing the
          // roof stairs — slab sides, lit cap, dark door on the shade side
          const bw2 = Math.max(3.5, 1.3 * sc), bh2 = Math.max(4, 1.6 * sc);
          ctx.fillStyle = night ? '#262220' : shade(ROOF[3], 1.1);
          ctx.fillRect(base[0] - bw2 / 2, base[1] - bh2, bw2, bh2);
          ctx.fillStyle = night ? '#2e2a27' : shade(ROOF[5], 0.9);
          ctx.fillRect(base[0] - bw2 / 2, base[1] - bh2, bw2, Math.max(1, bh2 * 0.12));
          ctx.fillStyle = night ? '#181614' : '#3a342e';
          const dox = SF_SUN.x > 0 ? -1 : 1; // door on the shade side
          ctx.fillRect(base[0] + dox * bw2 * 0.22 - bw2 * 0.1,
                       base[1] - bh2 * 0.55, bw2 * 0.2, bh2 * 0.55);
        } else if(kind === 8){ // v22 container garden: pots along the
          // parapet edge — greenery peeking over the roofline
          const nPt = 3 + Math.floor(phash(b.i, k, 3212) * 3);
          for(let p3 = 0; p3 < nPt; p3++){
            const q = pr(fx + (p3 - nPt / 2) * 0.45, fy, hm + zR);
            if(!q) continue;
            ctx.fillStyle = night ? '#241f1c' : '#a05a38';
            ctx.fillRect(q[0] - Math.max(1, 0.16 * sc), q[1] - Math.max(1, 0.2 * sc),
                         Math.max(2, 0.32 * sc), Math.max(1.5, 0.2 * sc));
            ctx.fillStyle = night ? '#1e2818' : '#4e7a44';
            ctx.beginPath();
            ctx.arc(q[0], q[1] - Math.max(1.5, 0.3 * sc), Math.max(1.2, 0.24 * sc), 0, Math.PI * 2);
            ctx.fill();
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
      /* v22: roof-deck railing over the parapet — same gates as the baked
         sprite (shop deck salts 1370 / residential deck salts 3200), so the
         rail you see from the street belongs to the deck you see from
         above. Posts + a top rail stand on the roof plane (z = hm). */
      const roofPx2 = roofAreaM * SF_PXM * SF_PXM;
      const deckGate = !pitched && rpts.length > 2 &&
        ((isShopR && roofPx2 > 2400 && phash(b.i, 2, 1370) < 0.6) ||
         (!isShopR && roofPx2 > 1900 && phash(b.i, 12, 3200) < 0.5));
      if(deckGate){
        for(let e2 = 0; e2 < n; e2++){
          const a = P[e2], bq = P[(e2 + 1) % n];
          const ex2 = bq[0] - a[0], ey2 = bq[1] - a[1];
          const L2 = Math.hypot(ex2, ey2) || 1;
          let nx2 = ey2 / L2, ny2 = -ex2 / L2;
          if(b._ccw){ nx2 = -nx2; ny2 = -ny2; }
          if(nx2 * -DX + ny2 * -DY <= 0.05) continue; // only rails we can see
          const mx0 = a[0] + ex2 * 0.15, my0 = a[1] + ey2 * 0.15;
          const mx1 = a[0] + ex2 * 0.85, my1 = a[1] + ey2 * 0.85;
          const r0 = pr(mx0, my0, hm + 0.95), r1 = pr(mx1, my1, hm + 0.95);
          const b0 = pr(mx0, my0, hm + 0.12), b1 = pr(mx1, my1, hm + 0.12);
          if(!r0 || !r1 || !b0 || !b1) continue;
          const sc2 = F / r0[2];
          ctx.strokeStyle = night ? '#2a2725' : '#5a4c3e';
          ctx.lineWidth = Math.max(0.8, 0.07 * sc2);
          ctx.beginPath(); ctx.moveTo(r0[0], r0[1]); ctx.lineTo(r1[0], r1[1]); ctx.stroke();
          ctx.lineWidth = Math.max(0.6, 0.05 * sc2);
          const nPost = Math.max(2, Math.floor(L2 * 0.7 / 1.2));
          for(let p3 = 0; p3 <= nPost; p3++){
            const t2 = p3 / nPost;
            ctx.beginPath();
            ctx.moveTo(b0[0] + (b1[0] - b0[0]) * t2, b0[1] + (b1[1] - b0[1]) * t2);
            ctx.lineTo(r0[0] + (r1[0] - r0[0]) * t2, r0[1] + (r1[1] - r0[1]) * t2);
            ctx.stroke();
          }
          /* v58: festoon string lights clipped along this deck rail — a
             single sagging wire under the top rail carrying warm bulbs.
             The bulbs glow once the streetlights come on (sfLampsLit) —
             same physical trigger as the sodium pools on the street. */
          const litB = sfLampsLit(), sagA = sc2 * 0.18;
          ctx.strokeStyle = night ? '#1a1816' : '#3a352e';
          ctx.lineWidth = Math.max(0.5, 0.04 * sc2);
          ctx.beginPath();
          for(let s2 = 0; s2 <= 16; s2++){
            const t2 = s2 / 16;
            const xw = r0[0] + (r1[0] - r0[0]) * t2;
            const yw = r0[1] + (r1[1] - r0[1]) * t2 + Math.sin(t2 * Math.PI) * sagA;
            s2 ? ctx.lineTo(xw, yw) : ctx.moveTo(xw, yw);
          }
          ctx.stroke();
          for(let s2 = 1; s2 < 8; s2++){
            const t2 = s2 / 8;
            const bx5 = r0[0] + (r1[0] - r0[0]) * t2;
            const by5 = r0[1] + (r1[1] - r0[1]) * t2 +
                        Math.sin(t2 * Math.PI) * sagA + Math.max(1, sc2 * 0.05);
            if(litB){
              ctx.fillStyle = 'rgba(255,190,110,0.25)';
              ctx.beginPath();
              ctx.arc(bx5, by5, Math.max(2, sc2 * 0.1), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = litB ? '#ffd894' : (night ? '#3a3630' : '#c8b070');
            ctx.beginPath();
            ctx.arc(bx5, by5, Math.max(0.8, sc2 * 0.04), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      /* v58: parapet pigeons — the Mission's roofline residents. Perched
         birds dot the camera-facing parapet caps of flat roofs (the same
         edge-facing test as the rail pass); each is a two-blob silhouette
         standing on the cap, tinted like the rest of the skyline. */
      if(!pitched && rpts.length > 2 && d.fwd < 130){
        for(let e2 = 0; e2 < n; e2++){
          const a = P[e2], bq = P[(e2 + 1) % n];
          const ex2 = bq[0] - a[0], ey2 = bq[1] - a[1];
          const L2 = Math.hypot(ex2, ey2) || 1;
          let nx2 = ey2 / L2, ny2 = -ex2 / L2;
          if(b._ccw){ nx2 = -nx2; ny2 = -ny2; }
          if(nx2 * -DX + ny2 * -DY <= 0.05) continue;
          const nBird = Math.floor(phash(b.i, e2, 3400) * 4);
          for(let b3 = 0; b3 < nBird; b3++){
            const t2 = 0.12 + phash(e2, b3 + b.i, 3401) * 0.76;
            const q = pr(a[0] + ex2 * t2, a[1] + ey2 * t2, hm + 0.42);
            if(!q) continue;
            const bs = Math.max(0.9, 0.13 * F / q[2]);
            ctx.fillStyle = night ? '#26241f'
              : (phash(b3, e2, 3402) < 0.25 ? '#8a8a86' : '#4c4c54');
            ctx.beginPath();
            ctx.ellipse(q[0], q[1] - bs * 0.5, bs * 1.1, bs * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(q[0] - bs * 0.9, q[1] - bs * 1.3, bs * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      // production-1: label routed through canonical parody display name
      const dn = sfSignName(b);
      if(dn){
        const p = pr(b.x / SF_PXM, b.y / SF_PXM, hm + 1.5);
        if(p){
          ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
          ctx.strokeText(dn, p[0], p[1]);
          ctx.fillStyle = '#fff'; ctx.fillText(dn, p[0], p[1]);
        }
      }
      if(gh || nearGh){
        /* v27: the ghosted mass keeps a cool wire rim — parapet loop +
           ground loop + corner drops, so the cutaway reads as camera
           x-ray rather than a rendering hole */
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(150,215,255,0.55)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 4]);
        for(const z of [0, hm]){
          ctx.beginPath();
          let st = false;
          for(const [qx, qy] of P){
            const q = pr(qx, qy, z);
            if(!q){ st = false; continue; }
            st ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            st = true;
          }
          ctx.closePath(); ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    } else if(d.k === 'p'){
      const o = d.o;
      if(o.kind === 'sfCar'){ sfCarStreet(o, pr, F, night); continue; }
      if(o.kind === 'sfParklet'){ sfParkletStreet(o, pr, F, night); continue; }
      if(o.kind === 'sfBins'){ sfBinsStreet(o, pr, F, night); continue; }
      // v28: props stand on the surface under them — a pole planted on
      // the sidewalk starts at curb height, not inside the slab
      const oz = sfGroundZ(o.x / SF_PXM, o.y / SF_PXM);
      const p = pr(o.x / SF_PXM, o.y / SF_PXM, oz);
      if(!p) continue;
      if(SF_GHOST_P && SF_GHOST_P.has(o)) ctx.globalAlpha = 0.35;
      const sc = F / p[2];
      if(o.kind === 'sfPole'){
        // v20: projected wood utility pole — tapered post, crossarm with
        // insulator nubs, occasional transformer can, thin sun-shadow
        // streak on the pavement. Wires are drawn globally after the
        // drawables so they span cleanly over the street canyon.
        const mx = o.x / SF_PXM, my = o.y / SF_PXM;
        const top = pr(mx, my, oz + 7.2), arm = pr(mx, my, oz + 6.75);
        if(!top) continue;
        ctx.fillStyle = `rgba(14,12,8,${night ? 0.3 : 0.2})`;
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 0.35 * sc, Math.max(1.2, 0.11 * sc),
                    0, 0, Math.PI * 2);
        ctx.fill();
        if(!night && SF_SUN.day > 0.08){
          const tpx = mx + SF_SUN.x * 7.2, tpy = my + SF_SUN.y * 7.2;
          const tp = pr(tpx, tpy, sfGroundZ(tpx, tpy));
          if(tp){
            ctx.strokeStyle = `rgba(24,34,60,${0.3 * Math.min(1, SF_SUN.day + 0.3)})`;
            ctx.lineWidth = Math.max(1, 0.12 * sc);
            ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(tp[0], tp[1]); ctx.stroke();
          }
        }
        ctx.strokeStyle = night ? '#16100c' : '#3a2e22';
        ctx.lineWidth = Math.max(1.5, 0.2 * sc);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
        if(arm){
          const a1 = o.dir === 0 ? pr(mx, my - 0.65, oz + 6.75) : pr(mx - 0.65, my, oz + 6.75),
                a2 = o.dir === 0 ? pr(mx, my + 0.65, oz + 6.75) : pr(mx + 0.65, my, oz + 6.75);
          if(a1 && a2){
            ctx.lineWidth = Math.max(1, 0.11 * sc);
            ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke();
            ctx.fillStyle = night ? '#0e0c0a' : '#2a211a';
            ctx.fillRect(a1[0] - 1, a1[1] - 1, 2, 2);
            ctx.fillRect(a2[0] - 1, a2[1] - 1, 2, 2);
          }
        }
        if(phash(o.wx, o.wy, 1694) < 0.33){ // transformer can
          const tc = pr(mx, my, oz + 5.6);
          if(tc){
            ctx.fillStyle = night ? '#14100d' : '#241d16';
            ctx.fillRect(tc[0] - 0.28 * sc, tc[1] - 0.3 * sc,
                         0.56 * sc, 1.05 * sc);
          }
        }
        continue;
      }
      if(o.kind === 'sfPicnic'){
        /* v53: a picnic blanket lies IN the ground plane — project its
           four cloth corners through sfGroundZ so it drapes the slope,
           then sit the sunbathers/cooler on it as low lumps. Occupancy
           is weather- and hour-gated by sfPicnicFill. */
        if(!sfPicnicOn(o)) continue;
        const mx = o.x / SF_PXM, my = o.y / SF_PXM;
        const hw = 1.1, hh = 1.4;  // half-extents in meters
        const qA = pr(mx - hw, my - hh, sfGroundZ(mx - hw, my - hh) + 0.02),
              qB = pr(mx + hw, my - hh, sfGroundZ(mx + hw, my - hh) + 0.02),
              qC = pr(mx + hw, my + hh, sfGroundZ(mx + hw, my + hh) + 0.02),
              qD = pr(mx - hw, my + hh, sfGroundZ(mx - hw, my + hh) + 0.02);
        if(!qA || !qB || !qC || !qD) continue;
        const BC = SF_BLANKET_COLS[(o.v || 0) % SF_BLANKET_COLS.length];
        const ramp = rampOf(BC.base);
        // cloth shadow first — the blanket presses a soft pad on the grass
        ctx.fillStyle = `rgba(14,16,8,${night ? 0.26 : 0.16})`;
        ctx.beginPath();
        ctx.moveTo(qA[0], qA[1]); ctx.lineTo(qB[0], qB[1]);
        ctx.lineTo(qC[0], qC[1] + 0.06 * sc); ctx.lineTo(qD[0], qD[1] + 0.06 * sc);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = night ? ramp[1] : ramp[3];
        ctx.beginPath();
        ctx.moveTo(qA[0], qA[1]); ctx.lineTo(qB[0], qB[1]);
        ctx.lineTo(qC[0], qC[1]); ctx.lineTo(qD[0], qD[1]);
        ctx.closePath(); ctx.fill();
        // pattern: gingham/stripe stripes along the quad's own axes
        ctx.save(); ctx.clip();
        ctx.strokeStyle = ramp[2]; ctx.lineWidth = Math.max(0.7, 0.05 * sc);
        for(let k = 1; k < 4; k++){
          const t = k / 4;
          ctx.beginPath();
          ctx.moveTo(qA[0] + (qB[0] - qA[0]) * t, qA[1] + (qB[1] - qA[1]) * t);
          ctx.lineTo(qD[0] + (qC[0] - qD[0]) * t, qD[1] + (qC[1] - qD[1]) * t);
          ctx.stroke();
          if(BC.pat !== 'stripe'){
            ctx.beginPath();
            ctx.moveTo(qA[0] + (qD[0] - qA[0]) * t, qA[1] + (qD[1] - qA[1]) * t);
            ctx.lineTo(qB[0] + (qC[0] - qB[0]) * t, qB[1] + (qC[1] - qB[1]) * t);
            ctx.stroke();
          }
        }
        ctx.restore();
        // sun stub thrown off the people/cooler — low occluder, short throw
        if(!night && SF_SUN.day > 0.08){
          const tx2 = mx + SF_SUN.x * 0.45, ty2 = my + SF_SUN.y * 0.45;
          const tp2 = pr(tx2, ty2, sfGroundZ(tx2, ty2));
          if(tp2) sfSoftEllipse((p[0] + tp2[0]) / 2, (p[1] + tp2[1]) / 2,
                               Math.hypot(tp2[0] - p[0], tp2[1] - p[1]) / 2 + 0.4 * sc,
                               0.3 * sc, Math.atan2(tp2[1] - p[1], tp2[0] - p[0]),
                               0.16 * Math.min(1, SF_SUN.day + 0.3), 0.5);
        }
        // occupants: low skin/shirt mounds lying on the cloth, foreshortened
        const nP2 = phash(o.v, 3, 5310) < 0.3 ? 0 :
                    (phash(o.v, 5, 5311) < 0.55 ? 1 : 2);
        for(let pi = 0; pi < nP2; pi++){
          const fx2 = (pi - (nP2 - 1) / 2) * 0.5 + (phash(o.v, pi, 5312) - 0.5) * 0.3;
          const fy2 = (phash(pi, o.v, 5313) - 0.5) * 0.8;
          const bp = pr(mx + fx2, my + fy2,
                        sfGroundZ(mx + fx2, my + fy2) + 0.03);
          if(!bp) continue;
          const skin = rampOf(SF_SKIN[(o.v + pi) % SF_SKIN.length]);
          const shirt = rampOf(SF_SHIRT[(o.v + pi * 2) % SF_SHIRT.length]);
          const prone = phash(o.v, pi, 5314) < 0.5;
          ctx.fillStyle = prone ? skin[2] : shirt[2];
          ctx.beginPath();
          ctx.ellipse(bp[0], bp[1] - 0.06 * sc, 0.5 * sc, 0.14 * sc,
                      0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = skin[3];
          ctx.beginPath();
          ctx.arc(bp[0] - 0.42 * sc, bp[1] - 0.14 * sc, 0.11 * sc,
                  0, Math.PI * 2); ctx.fill();
        }
        // cooler box on the cloth edge — a real cuboid, lid catches sun
        const cb = pr(mx + 0.8, my + 1.0, sfGroundZ(mx + 0.8, my + 1.0));
        if(cb){
          const cw3 = 0.35 * sc, chh3 = 0.3 * sc;
          ctx.fillStyle = '#b8b8c4';
          ctx.fillRect(cb[0] - cw3 / 2, cb[1] - chh3, cw3, chh3);
          ctx.fillStyle = '#e8e8f0';
          ctx.fillRect(cb[0] - cw3 / 2, cb[1] - chh3, cw3, chh3 * 0.3);
        }
        continue;
      }
      const V = PA.sfVeg;
      let spr = null, hm = 5, shadowR = 0;
      // v31: vegetation draws in ELEVATION — real trunk-to-crown
      // silhouettes at their true heights, not the plan-view crown blit
      if(o.kind === 'sfTree'){ const ti = Math.abs(hash2(o.wx, o.wy, 7) * V.sideTree.length) | 0;
        spr = (sfTreeTurns(o) ? V.sideTreeA : V.sideTree)[ti];   // v55 autumn
        hm = o.big ? 8.6 : 7.0; shadowR = 1.9; }
      else if(o.kind === 'sfPalm'){ spr = V.sidePalm[Math.abs(hash2(o.wx, o.wy, 8) * V.sidePalm.length) | 0]; hm = 10.5; shadowR = 1.1; }
      else if(o.kind === 'sfStreetTree'){ spr = V.sideStreet[o.v != null ? o.v : 0];
        // v40: ficus stands taller with a crown that spans the curb lane
        hm = o.v === 0 ? 6.4 : 4.4; shadowR = o.v === 0 ? 2.0 : 1.3; }
      else if(o.kind === 'sfCypress'){ spr = V.sideCypress[Math.abs(hash2(o.wx, o.wy, 9) * V.sideCypress.length) | 0]; hm = 11.5; shadowR = 1.0; }
      else if(o.kind === 'sfBench'){ spr = V.bench; hm = 0.9; shadowR = 0.55; }
      else if(o.kind === 'sfLamp'){ spr = sfLampsLit() ? V.lampOn : V.lampOff; hm = 4.5; shadowR = 0.3; }
      else if(o.kind === 'sfShrub'){ spr = V.shrub[Math.abs(hash2(o.wx, o.wy, 10) * V.shrub.length) | 0]; hm = 0.9; shadowR = 0.7; }
      else if(o.kind === 'sfFlowerBed'){ spr = V.flowerbed[Math.abs(hash2(o.wx, o.wy, 11) * V.flowerbed.length) | 0]; hm = 0.5; shadowR = 0.6; }
      else if(o.kind === 'sfPlanter'){ spr = V.planter; hm = 0.7; shadowR = 0.45; }
      // v59: Mission garden palette in elevation
      else if(o.kind === 'sfAgave' && V.sideAgave){ spr = V.sideAgave[o.v || 0]; hm = 0.8; shadowR = 0.6; }
      else if(o.kind === 'sfEchium' && V.sideEchium){ spr = V.sideEchium[o.v || 0]; hm = 1.7; shadowR = 0.5; }
      // v53 furniture — real meter heights, knee-to-waist occluders
      else if(o.kind === 'sfHydrant'){ spr = V.hydrant[o.v || 0]; hm = 0.62; shadowR = 0.28; }
      else if(o.kind === 'sfTrashCan'){ spr = V.trashCan; hm = 0.85; shadowR = 0.35; }
      else if(o.kind === 'sfNewsBox'){ spr = V.newsBox[o.v || 0]; hm = 1.05; shadowR = 0.5; }
      else if(o.kind === 'sfBikeRack'){ spr = V.bikeRack[o.v || 0]; hm = 0.85; shadowR = 0.7; }
      const sprC = spr && (spr.c || spr);
      if(sprC){
        const ph = hm * sc, pw = ph * (sprC.width / sprC.height);
        /* v64: street-tree well — the trunk rises from a sidewalk cut-out
           ringed by cast iron, not poured concrete. The pit's four
           corners project through sfGroundZ so it shears with the slope
           and foreshortens with distance exactly like the pavement
           around it; the trunk's contact shade lands inside the pit. */
        if(o.kind === 'sfStreetTree' && p[2] < 110){
          const mx = o.x / SF_PXM, my = o.y / SF_PXM,
                wr = sfTreeWellM(o), ir = wr * 0.62;
          const gq = (dx, dy) =>
            pr(mx + dx, my + dy, sfGroundZ(mx + dx, my + dy) + 0.012);
          const A = gq(-wr, -wr), B = gq(wr, -wr),
                C = gq(wr, wr), D = gq(-wr, wr);
          if(A && B && C && D){
            ctx.fillStyle = night ? '#181a1d' : '#2e3236';
            ctx.beginPath();
            ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
            ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]);
            ctx.closePath(); ctx.fill();
            const a2 = gq(-ir, -ir), b2 = gq(ir, -ir),
                  c2 = gq(ir, ir), d2 = gq(-ir, ir);
            if(a2 && b2 && c2 && d2){
              ctx.fillStyle = night ? '#241a10' : '#4a3524';
              ctx.beginPath();
              ctx.moveTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]);
              ctx.lineTo(c2[0], c2[1]); ctx.lineTo(d2[0], d2[1]);
              ctx.closePath(); ctx.fill();
              // grate bars spanning the slot along the well's x axis
              ctx.strokeStyle = 'rgba(16,18,22,0.8)';
              ctx.lineWidth = Math.max(1, 0.03 * sc);
              for(const tt of [-0.34, 0.34]){
                const lx0 = a2[0] + (d2[0] - a2[0]) * (tt + 0.5),
                      ly0 = a2[1] + (d2[1] - a2[1]) * (tt + 0.5),
                      lx1 = b2[0] + (c2[0] - b2[0]) * (tt + 0.5),
                      ly1 = b2[1] + (c2[1] - b2[1]) * (tt + 0.5);
                ctx.beginPath(); ctx.moveTo(lx0, ly0); ctx.lineTo(lx1, ly1);
                ctx.stroke();
              }
            }
            // sun-side lip glint: the frame edge facing the sun catches
            // a warm line — same sun that throws the crown streak
            if(!night && SF_SUN.day > 0.15){
              const sdx = -SF_SUN.x, sdy = -SF_SUN.y;
              const edges = [[A, B, 0, -wr], [D, C, 0, wr],
                             [A, D, -wr, 0], [B, C, wr, 0]];
              let best = null, bs = -1e9;
              for(const e of edges){
                const s = e[2] * sdx + e[3] * sdy;
                if(s > bs){ bs = s; best = e; }
              }
              if(best){
                ctx.strokeStyle =
                  `rgba(226,212,180,${(0.45 * SF_SUN.day).toFixed(3)})`;
                ctx.lineWidth = Math.max(1, 0.045 * sc);
                ctx.beginPath();
                ctx.moveTo(best[0][0], best[0][1]);
                ctx.lineTo(best[1][0], best[1][1]);
                ctx.stroke();
              }
            }
          }
        }
        // v19: contact AO — every prop presses a tight dark disc into the
        // pavement at its feet, so nothing floats when the sun is buried
        const fr = (shadowR || Math.max(0.3, hm * 0.3)) * sc;
        ctx.fillStyle = `rgba(14,12,8,${night ? 0.3 : 0.2})`;
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], fr, Math.max(1.2, fr * 0.32), 0, 0, Math.PI * 2);
        ctx.fill();
        const vegK = o.kind === 'sfTree' || o.kind === 'sfPalm' ||
                     o.kind === 'sfStreetTree' || o.kind === 'sfCypress';
        // v14: shadow thrown along the true sun vector — tip projected
        // through pr so length/direction track the solar elevation
        if(shadowR && !night && SF_SUN.day > 0.08){
          const txm = o.x / SF_PXM + SF_SUN.x * hm * 0.6,
                tym = o.y / SF_PXM + SF_SUN.y * hm * 0.6;
          const tip = pr(txm, tym, sfGroundZ(txm, tym));
          const tx = tip ? tip[0] : p[0], ty = tip ? tip[1] : p[1];
          const ang = Math.atan2(ty - p[1], tx - p[0]);
          const len = Math.hypot(tx - p[0], ty - p[1]);
          // v15: penumbral prop shadow — soft falloff grows with throw
          // v46: a tree crown is WIDE — its ground streak is a mottled
          // band of lobe shadows fanned across the throw direction,
          // not one clean cigar (props keep the single streak)
          const nSt = vegK ? 3 : 1;
          for(let sI = 0; sI < nSt; sI++){
            const off = vegK ? (sI - 1) : 0;
            const mxx = (p[0] + tx) / 2 - Math.sin(ang) * off * (shadowR * sc * 0.9),
                  myy = (p[1] + ty) / 2 + Math.cos(ang) * off * (shadowR * sc * 0.9);
            sfSoftEllipse(mxx, myy,
                          shadowR * sc * (vegK ? 0.8 : 1) + len / 2,
                          shadowR * 0.3 * sc, ang + off * 0.16,
                          (vegK ? 0.19 : 0.32) * Math.min(1, SF_SUN.day + 0.3),
                          sfUmbra(len));
          }
          /* v69: same sieve in elevation — flecks skate inside the crown's
             ground band; building shade or cloud over the pool kills them */
          if(vegK){
            const dk2 = sfLeafGapK(o.kind, o) * SF_SUN.day *
                        (1 - Math.min(1, sfCloudShadow(txm, tym))) *
                        clamp(1 - sfCanyonShade(txm, tym, -1), 0, 1);
            if(dk2 > 0.02)
              sfDapple((p[0] + tx) / 2, (p[1] + ty) / 2,
                       shadowR * sc * 0.9 + len / 2,
                       shadowR * 0.34 * sc, ang,
                       (o.x * 31 + o.y * 57) | 0, 0.26 * dk2);
          }
        }
        if(vegK){
          // v31: crowns lean on the wind — a horizontal shear pivoted at
          // the root, so trunks stay planted while foliage streams
          // v32: a faster leaf-shiver harmonic rides the gust envelope
          const lean = (Math.sin(SF_WX.t * 1.4 + o.x * 0.04 + o.y * 0.03) *
                        (0.015 + SF_WX.gust * 0.05 + W.storm * 0.08) +
                        Math.sin(SF_WX.t * 4.3 + o.x * 0.09 + o.y * 0.05) *
                        0.012 * SF_WX.gust) *
                       Math.cos(W.windAng - SF_CAM.yaw);
          ctx.save(); ctx.translate(p[0], p[1]);
          ctx.transform(1, 0, lean, 1, 0, 0);
          // v66: street view mirrors the same instance flip as the
          // crown genome overhead — silhouettes agree between cameras
          if(o.kind === 'sfTree' &&
             (Math.abs(hash2(o.wx, o.wy, 6007) * 2) | 0) === 1)
            ctx.scale(-1, 1);
          ctx.drawImage(sprC, -pw / 2, -ph, pw, ph);
          ctx.restore();
          // v31: crown answers the real sun bearing — warm wash on the
          // flank turned toward the sun, cool sky-fill on the lee side,
          // bright rim when backlit; canyon-shaded crowns stay flat
          if(!night && SF_SUN.day > 0.15){
            const shadeTop = p[2] < 130
              ? sfCanyonShade(o.x / SF_PXM, o.y / SF_PXM, -1) : 0;
            const crownZ = o.kind === 'sfPalm' ? hm * 0.9 : hm * 0.66;
            if(shadeTop < crownZ - 1){
              const sunSide = SF_SUN.toX * DY - SF_SUN.toY * DX; // + = screen right
              const sunFront = -(SF_SUN.toX * DX + SF_SUN.toY * DY); // + = sun behind cam
              const crx = pw * 0.5, cry = p[1] - ph * (o.kind === 'sfPalm' ? 0.85 : 0.62);
              const wA = 0.22 * SF_SUN.day * (0.4 + 0.6 * Math.max(0, sunFront));
              const gxp = p[0] + sunSide * crx * 0.45;
              const wg = ctx.createRadialGradient(gxp, cry, 1, gxp, cry, crx * 0.9);
              wg.addColorStop(0, `rgba(255,226,150,${wA})`);
              wg.addColorStop(1, 'rgba(255,226,150,0)');
              ctx.fillStyle = wg;
              ctx.beginPath(); ctx.ellipse(gxp, cry, crx * 0.85, ph * 0.3, 0, 0, Math.PI * 2); ctx.fill();
              const gxn = p[0] - sunSide * crx * 0.45;
              const cg = ctx.createRadialGradient(gxn, cry, 1, gxn, cry, crx * 0.9);
              cg.addColorStop(0, `rgba(80,100,140,${0.15 * SF_SUN.day * (1 - Math.max(0, sunFront) * 0.5)})`);
              cg.addColorStop(1, 'rgba(80,100,140,0)');
              ctx.fillStyle = cg;
              ctx.beginPath(); ctx.ellipse(gxn, cry, crx * 0.85, ph * 0.3, 0, 0, Math.PI * 2); ctx.fill();
              if(sunFront < -0.3){ // lens into the sun: bright crown rim
                ctx.strokeStyle = `rgba(255,240,190,${0.5 * SF_SUN.day})`;
                ctx.lineWidth = Math.max(1, 0.05 * sc);
                ctx.beginPath();
                ctx.ellipse(p[0], cry, crx * 0.82, ph * 0.3, 0,
                            Math.PI * 1.05, Math.PI * 1.95);
                ctx.stroke();
              }
            }
          }
          // marine haze settles on distant crowns like it does the rows
          const hzA = sfHazeA(p[2]);
          if(hzA > 0.02){
            ctx.fillStyle = `rgba(196,206,220,${hzA * 0.55})`;
            ctx.beginPath();
            ctx.ellipse(p[0], p[1] - ph * 0.6, pw * 0.5, ph * 0.34, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else ctx.drawImage(sprC, p[0] - pw / 2, p[1] - ph, pw, ph);
        // v15: lit lamp — halo around the acorn globe + sodium pool below
        if(o.kind === 'sfLamp' && sfLampsLit()){
          const gp = pr(o.x / SF_PXM, o.y / SF_PXM,
                        4.15 + sfGroundZ(o.x / SF_PXM, o.y / SF_PXM));
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
          // v25: wet asphalt mirrors the lamp — a sodium streak smeared
          // straight down toward the camera (mirror images stretch along
          // the view axis, never sideways)
          if(SF_WX.wet > 0.15){
            const sl = 2.8 * sc * (0.4 + SF_WX.wet);
            const sg3 = ctx.createLinearGradient(0, p[1], 0, p[1] + sl);
            sg3.addColorStop(0, `rgba(255,200,120,${0.24 * SF_WX.wet})`);
            sg3.addColorStop(1, 'rgba(255,200,120,0)');
            ctx.fillStyle = sg3;
            ctx.fillRect(p[0] - 0.3 * sc, p[1], 0.6 * sc, sl);
          }
        }
      }
    } else {
      const pv = d.pv;
      // v28: feet rest on the walkway slab — stepping off the curb is a
      // real 15cm drop, not a palette swap
      const p = pr(pv.x / SF_PXM, pv.y / SF_PXM,
                   sfGroundZ(pv.x / SF_PXM, pv.y / SF_PXM));
      if(!p) continue;
      const F2 = PA.chars && PA.chars[pv._ci != null ? pv._ci : 0];
      const dir = pv.face === 1 ? 1 : ((pv.face === 2 || pv.face === 3) ? 2 : 0);
      let fr = null;
      if(F2 && F2[dir]) fr = paActFrame(F2, dir, pv, G.frame);
      if(fr){
        const ph = 1.7 * F / p[2], pw = ph * 0.75;
        // v19: contact core under the feet — persists through dusk/overcast
        // when the cast shadow fades, so the pawn never floats
        ctx.fillStyle = `rgba(14,12,8,${night ? 0.34 : 0.22})`;
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], pw * 0.32, pw * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // v23: a pawn standing in canyon shade cannot throw a sun shadow
        // and its sprite takes the same cool sky fill as the pavement
        const pvShade = (!night && SF_SUN.day > 0.08 && p[2] < 110)
          ? sfCanyonShade(pv.x / SF_PXM, pv.y / SF_PXM, -1) : 0;
        // v14: ground shadow cast along the real sun vector
        const vtx = pv.x / SF_PXM + SF_SUN.x * 1.7,
              vty = pv.y / SF_PXM + SF_SUN.y * 1.7;
        const vtip = (pvShade < 1.2 && !night && SF_SUN.day > 0.08)
          ? pr(vtx, vty, sfGroundZ(vtx, vty))
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
        /* v54: face=3 (world +x) mirrors the profile-left sprite as one
           unit — the sprite AND its source-atop key/fill passes flip
           together, exactly like the legacy paCharDraw mirror. The
           ground shadows stay OUTSIDE: they follow the sun vector, not
           the pawn's facing. Without this every eastbound pawn moonwalks. */
        const mir54 = pv.face === 3 && pv.state !== 'sit';
        if(mir54){
          ctx.save();
          ctx.translate(p[0] * 2, 0); ctx.scale(-1, 1);
        }
        ctx.drawImage(fr, p[0] - pw / 2, p[1] - ph, pw, ph);
        /* v42: key & fill — the same two sources that light the street
           light the person. Sun in front of the camera = warm key on the
           sunward flank + cool skylight fill lee; sun behind = warm rim
           on both shoulders (a backlit figure reads as contour, not
           detail). Canyon-shaded pawns get neither — they stand in
           skylight only, which the cool veil below already says. */
        if(!night && SF_SUN.day > 0.2){
          const litP = clamp(1 - pvShade / 1.4, 0, 1);
          if(litP > 0.05){
            const sF = SF_SUN.toX * DX + SF_SUN.toY * DY;
            const sS = SF_SUN.toX * DY - SF_SUN.toY * DX;   // >0 sun right
            const key = 0.30 * SF_SUN.day * (0.4 + 0.6 * SF_SUN.warm) * litP;
            ctx.globalCompositeOperation = 'source-atop';
            let lg;
            if(sF > 0.25){
              const sgn = sS >= 0 ? 1 : -1;
              lg = ctx.createLinearGradient(p[0] - sgn * pw * 0.5, 0,
                                            p[0] + sgn * pw * 0.5, 0);
              lg.addColorStop(0, `rgba(64,84,132,${(key * 0.5).toFixed(3)})`);
              lg.addColorStop(0.55, 'rgba(0,0,0,0)');
              lg.addColorStop(1, `rgba(255,212,148,${key.toFixed(3)})`);
            } else {
              lg = ctx.createLinearGradient(p[0] - pw * 0.5, 0,
                                            p[0] + pw * 0.5, 0);
              lg.addColorStop(0, `rgba(255,206,140,${(key * 0.85).toFixed(3)})`);
              lg.addColorStop(0.28, 'rgba(0,0,0,0)');
              lg.addColorStop(0.72, 'rgba(0,0,0,0)');
              lg.addColorStop(1, `rgba(255,206,140,${(key * 0.85).toFixed(3)})`);
            }
            ctx.fillStyle = lg;
            ctx.fillRect(p[0] - pw / 2, p[1] - ph, pw, ph);
            // top light — head and shoulders catch the sun's elevation
            const tk = 0.16 * SF_SUN.day *
                       clamp(Math.sin(Math.max(0, SF_SUN.el)) * 1.4, 0, 1) * litP;
            const tg = ctx.createLinearGradient(0, p[1] - ph, 0, p[1] - ph * 0.45);
            tg.addColorStop(0, `rgba(255,226,170,${tk.toFixed(3)})`);
            tg.addColorStop(1, 'rgba(255,226,170,0)');
            ctx.fillStyle = tg;
            ctx.fillRect(p[0] - pw / 2, p[1] - ph, pw, ph * 0.55);
            ctx.globalCompositeOperation = 'source-over';
          }
        }
        if(mir54) ctx.restore();
        // v25: umbrella over rain-caught pawns — canopy arc tilted into
        // the wind's lateral component, shaft down to the hand
        const uc2 = sfUmbrellaCol(pv);
        if(uc2){
          const ur = pw * 0.85;
          const tl2 = clamp(Math.sin(W.windAng - SF_CAM.yaw), -1, 1) *
                      SF_WX.gust * ur * 0.35;
          const uy3 = p[1] - ph * 1.04;
          ctx.strokeStyle = 'rgba(30,28,24,0.85)'; ctx.lineWidth = Math.max(1, ur * 0.05);
          ctx.beginPath(); ctx.moveTo(p[0] + tl2 * 0.4, uy3);
          ctx.lineTo(p[0] + pw * 0.1, p[1] - ph * 0.42); ctx.stroke();
          ctx.fillStyle = uc2;
          ctx.beginPath();
          ctx.moveTo(p[0] - ur + tl2, uy3);
          ctx.quadraticCurveTo(p[0] + tl2, uy3 - ur * 0.9, p[0] + ur + tl2, uy3);
          ctx.quadraticCurveTo(p[0] + ur * 0.5 + tl2, uy3 + ur * 0.14,
                               p[0] + tl2, uy3);
          ctx.quadraticCurveTo(p[0] - ur * 0.5 + tl2, uy3 + ur * 0.14,
                               p[0] - ur + tl2, uy3);
          ctx.closePath(); ctx.fill();
          // canopy ribs from the ferrule to the scalloped rim
          ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
          ctx.beginPath();
          for(const fr2 of [-0.5, 0, 0.5]){
            ctx.moveTo(p[0] + tl2, uy3 - ur * 0.78);
            ctx.quadraticCurveTo(p[0] + tl2 + fr2 * ur, uy3 - ur * 0.3,
                                 p[0] + tl2 + fr2 * ur * 1.8, uy3 + ur * 0.05);
          }
          ctx.stroke();
        }
        if(pvShade > 1.2){
          ctx.fillStyle = `rgba(28,36,62,${0.3 * Math.min(1, pvShade / 4)})`;
          ctx.fillRect(p[0] - pw / 2, p[1] - ph, pw, ph);
        }
        if(p[2] < 40){
          ctx.font = `bold ${Math.max(8, 24 / p[2] * 4)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
          ctx.strokeText(pv.name, p[0], p[1] - ph - 4);
          ctx.fillStyle = '#fff'; ctx.fillText(pv.name, p[0], p[1] - ph - 4);
          // production-1: speech bubble above the name plate
          sfSayBubble(pv, p[0], p[1] - ph - 14,
                      Math.max(8, 24 / p[2] * 4) / 11);
        }
      }
    }
  }

  // v20: overhead pole-line wires — catenary spans at ~7m drawn across
  // the street canyon in front of the facades they serve; two conductor
  // heights per span like the real duplex runs on Mission pole lines
  {
    const wCol = night ? 'rgba(8,8,10,0.85)' : 'rgba(26,22,18,0.8)';
    for(const wg of SF_WIRES){
      const ax1 = wg.x1 / SF_PXM, ay1 = wg.y1 / SF_PXM,
            ax2 = wg.x2 / SF_PXM, ay2 = wg.y2 / SF_PXM;
      const mxx = (ax1 + ax2) / 2 - camX, myy = (ay1 + ay2) / 2 - camY;
      const wf = mxx * DX + myy * DY, ws = Math.abs(mxx * DY - myy * DX);
      if(wf < -12 || wf > 150 || ws > wf * 1.7 + 30) continue;
      for(const [wz, drop] of [[7.15, 0.55], [6.8, 0.8]]){
        const pA = pr(ax1, ay1, wz + sfGroundZ(ax1, ay1)),
              pB = pr(ax2, ay2, wz + sfGroundZ(ax2, ay2));
        if(!pA || !pB) continue;
        const mid = (pA[2] + pB[2]) / 2 || 1,
              sagPx = drop * F / mid;
        ctx.strokeStyle = wCol;
        ctx.lineWidth = Math.max(0.7, 0.045 * F / mid);
        ctx.beginPath();
        ctx.moveTo(pA[0], pA[1]);
        ctx.quadraticCurveTo((pA[0] + pB[0]) / 2,
                             (pA[1] + pB[1]) / 2 + sagPx * 2,
                             pB[0], pB[1]);
        ctx.stroke();
      }
    }
  }

  // v49: the wild parrot flock, seen from the street — the same
  // deterministic birds, projected through pr() at true altitude.
  // Commuters streak overhead as swept-wing green darts with red masks;
  // perched birds dot the crown tops. Grounded by rain/night like
  // everything else in this sky.
  if(!night){
    for(let i = 0; i < SF_PARROT_N; i++){
      const b = sfParrotAt(i, SF_WX.t);
      if(!b) break;
      const gz = sfGroundZ(b.x, b.y);
      const pp = pr(b.x, b.y, gz + b.z);
      // depth cap: birds drawn after the facades would overdraw a wall
      // they sit behind — keeping them near-field keeps the lie rare
      if(!pp || pp[2] > (b.fly ? 130 : 90)) continue;
      if(b.fly){
        // screen heading: project a point just ahead on the flight path
        const hdx = Math.cos(b.hdg), hdy = Math.sin(b.hdg);
        const pq = pr(b.x + hdx * 0.9, b.y + hdy * 0.9, gz + b.z);
        let hx = 1, hy = 0;
        if(pq){
          const vx = pq[0] - pp[0], vy = pq[1] - pp[1],
                vl = Math.hypot(vx, vy) || 1;
          hx = vx / vl; hy = vy / vl;
        }
        const nx2 = -hy, ny2 = hx, wsp = 0.62 * F / pp[2]; // ~0.6m wingspan
        const fl = b.flap;
        ctx.strokeStyle = 'rgba(26,58,32,0.92)';
        ctx.lineWidth = Math.max(1, wsp * 0.09);
        ctx.beginPath();
        // swept pointed wings, flap driving the tips up/down
        ctx.moveTo(pp[0] - hx * wsp * 0.06, pp[1] - hy * wsp * 0.06);
        ctx.lineTo(pp[0] + nx2 * wsp * 0.5 - hx * wsp * 0.3,
                   pp[1] + ny2 * wsp * 0.5 - hy * wsp * 0.3 - fl * wsp * 0.22);
        ctx.moveTo(pp[0] - hx * wsp * 0.06, pp[1] - hy * wsp * 0.06);
        ctx.lineTo(pp[0] - nx2 * wsp * 0.5 - hx * wsp * 0.3,
                   pp[1] - ny2 * wsp * 0.5 - hy * wsp * 0.3 - fl * wsp * 0.22);
        ctx.stroke();
        ctx.fillStyle = '#3fae4e';
        ctx.beginPath();
        ctx.ellipse(pp[0], pp[1], wsp * 0.16, wsp * 0.09,
                    Math.atan2(hy, hx), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d8382c';
        ctx.fillRect(pp[0] + hx * wsp * 0.15 - 1, pp[1] + hy * wsp * 0.15 - 1,
                     Math.max(1.5, wsp * 0.07), Math.max(1.5, wsp * 0.07));
      } else {
        // perched on the crown rim — a green speck under a red mask
        const bs = Math.max(1.4, 0.3 * F / pp[2]);
        ctx.fillStyle = '#379a44';
        ctx.fillRect(pp[0] - bs / 2, pp[1] - bs / 2, bs, bs);
        ctx.fillStyle = '#d8382c';
        ctx.fillRect(pp[0] - bs * 0.32, pp[1] - bs * 0.78, bs * 0.64, bs * 0.42);
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
  // v25: + impact rings on the ground band where the streaks land
  if(W.rain > 0.08){
    sfRainOverlay(cw, ch, Math.sin(W.windAng - SF_CAM.yaw) * 0.9);
    sfSplashOverlay(cw, horizon + 8, ch);
    const wg = ctx.createLinearGradient(0, horizon, 0, ch);
    wg.addColorStop(0, 'rgba(120,140,165,0)');
    wg.addColorStop(1, `rgba(140,160,185,${W.rain * 0.22})`);
    ctx.fillStyle = wg; ctx.fillRect(0, horizon, cw, ch - horizon);
  }

  // v41: fog sheets — Karl doesn't stay politely on the horizon: torn
  // streamers of marine air blow THROUGH the street. Three parallax
  // bands of advected mist slide across the frame on the cross-wind,
  // thicker the deeper the front has pushed inland and the closer the
  // band rides to the camera.
  {
    const kk2 = sfKarlK();
    // v60: the world-anchored puff field now carries the fog body — these
    // screen-space bands stay only as fine grain between the real banks,
    // so they're demoted from "the fog" to texture (was kk2 * 1.3)
    const mist = Math.max(kk2 * 0.55, clamp((W.hum - 0.62) * 2.4, 0, 1) * 0.6);
    if(!night && mist > 0.05 && W.rain < 0.5){
      const lat = Math.sin(W.windAng - SF_CAM.yaw);
      const latA = Math.abs(lat) > 0.12 ? lat : Math.sign(lat || 1) * 0.12;
      for(let band = 0; band < 3; band++){
        const depthK = 0.35 + band * 0.325;          // near band rides lower+faster
        const by = horizon + (ch - horizon) * (0.05 + band * 0.17);
        const n = 4 + band * 2;
        for(let k = 0; k < n; k++){
          const drift = latA * (55 + band * 60) * W.windSpd * SF_WX.t;
          const sx = sfWrapDrift(phash(k, band, 3965), drift, cw, 280);
          const rr = (110 + phash(k, band + 9, 3966) * 170) * (0.7 + depthK);
          const a = mist * (0.17 + phash(k, band + 17, 3967) * 0.20) * depthK;
          if(a < 0.01) continue;
          const fg3 = ctx.createRadialGradient(sx, by, 0, sx, by, rr);
          fg3.addColorStop(0, `rgba(224,230,238,${a})`);
          fg3.addColorStop(1, 'rgba(224,230,238,0)');
          ctx.fillStyle = fg3;
          ctx.beginPath();
          ctx.ellipse(sx, by, rr * 1.9, rr * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // v60: world-anchored ground fog — the same puff field the top view
  // draws, projected at depth so wisps occlude facades correctly
  sfGroundFogStreet(pr, F, horizon, cw, ch, night);

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
    const lab = `◉ ${mode}  ${mm}mm  ƒ2.0 · ${Math.round(SF_LENS.foc)}m`;
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

  // v27: AF reticle — focus brackets ride the subject in follow mode,
  // like a real viewfinder lock confirmation
  if(!SF_CAM.director && v && !v.inBuilding){
    const rp = pr(px, py, 1.0);
    if(rp){
      const s = 14, t = 6;
      ctx.strokeStyle = 'rgba(160,230,255,0.8)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for(const [sx3, sy3] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){
        ctx.moveTo(rp[0] + sx3 * s, rp[1] + sy3 * s - sy3 * t);
        ctx.lineTo(rp[0] + sx3 * s, rp[1] + sy3 * s);
        ctx.lineTo(rp[0] + sx3 * s - sx3 * t, rp[1] + sy3 * s);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(160,230,255,0.9)';
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
      ctx.fillText('AF', rp[0] + s + 4, rp[1] - s + 4);
    }
  }

  // v10: stash this frame for the temporal cache, then profiler chip
  sfStillStore(cw, ch, stillKey);
  sfPerfHud(cw, ch);
}

/* ---------------- v70: dollhouse interiors ----------------
   Top view used to swallow everyone who walked indoors — the roof
   sprite covered them and the map just stopped telling the story. Now
   the inspected subject's building lifts its roof: the baked sprite
   ghosts to a quarter alpha and the REAL floor plan draws inside the
   footprint, oriented so the door edge is the room's front. The plan
   shares sfRenderInterior's metric layout — same 7m room width, same
   RM_D depth hash, same counter/table/rug coordinates — so the
   dollhouse and the walk-in view are the same room seen two ways.
   The floor sun-patch comes through whichever wall faces the real
   solar bearing; lamp pools follow sfLampsLit(). */
function sfInsideBldIdx(name){
  const rec = SF_INTERIORS[name];
  if(!rec) return -1;
  if(rec.poi && rec.poi.bld != null) return rec.poi.bld;
  return rec.bld != null ? rec.bld : -1;
}
function sfDollhouse(b, name, cw, ch){
  const rec = SF_INTERIORS[name] || {};
  const lab = rec.label || '';
  const seed = sfIntSeed(name);
  const shop = rec.poi ? true :
    /caf|coffee|counter|aisle|salsa|park-edge|bins/i.test(lab + ' ' + name);
  const arch = shop ? sfIntArch(name, lab) : 'flat';
  const night = isNight(), lamps = sfLampsLit();
  const karlK = sfKarlK();

  /* room frame: the door edge is the front. The inward axis runs from
     the door cell toward the centroid; the lateral axis is its
     perpendicular. Room meters map into the footprint's (u,w) extents
     with a wall-thickness inset. */
  const dCell = rec.poi ? sfPoiDoor(rec.poi) : (rec.door || null);
  let dxp = b.x, dyp = b.by1 + 8;
  if(dCell){ dxp = dCell.wx * CS + 16; dyp = dCell.wy * CS + 16; }
  const wL = Math.hypot(b.x - dxp, b.y - dyp) || 1;
  const wvx = (b.x - dxp) / wL, wvy = (b.y - dyp) / wL;
  const uvx = -wvy, uvy = wvx;
  let uMin = 1e9, uMax = -1e9, wMin = 1e9, wMax = -1e9;
  for(const [qx, qy] of b.px){
    const du = (qx - b.x) * uvx + (qy - b.y) * uvy;
    const dw = (qx - b.x) * wvx + (qy - b.y) * wvy;
    if(du < uMin) uMin = du; if(du > uMax) uMax = du;
    if(dw < wMin) wMin = dw; if(dw > wMax) wMax = dw;
  }
  const wallPx = Math.max(3, 0.45 * SF_PXM);
  const RM_D = 8.4 + phash(seed, 0, 5200) * 1.6;
  // uniform scale — a room is square-metered; a wide storefront building
  // reads as the cafe hall with service wings left as plain floor
  const su = Math.max(0.4, Math.min((uMax - uMin - wallPx * 2) / 7,
                                  (wMax - wMin - wallPx * 2) / RM_D));
  const sw = su;
  // the unit sits on its door, clamped inside the footprint
  const duDoor = (dxp - b.x) * uvx + (dyp - b.y) * uvy;
  const uMid = clamp(duDoor,
    uMin + wallPx + 3.5 * su, uMax - wallPx - 3.5 * su);
  const rmP = (x, z) => {
    const du = uMid + x * su, dw = wMin + wallPx + z * sw;
    const gx = b.x + uvx * du + wvx * dw, gy = b.y + uvy * du + wvy * dw;
    return [(gx - cam.x) * cam.zoom + cw / 2, sfSY(gy, ch)];
  };
  const rmQ = pts => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  };
  const rmRect = (x0, z0, x1, z1, f) => {
    ctx.fillStyle = f;
    rmQ([rmP(x0, z0), rmP(x1, z0), rmP(x1, z1), rmP(x0, z1)]); ctx.fill();
  };
  const rmDisc = (x, z, r, f) => {
    const p = rmP(x, z);
    ctx.fillStyle = f;
    ctx.beginPath();
    ctx.ellipse(p[0], p[1], r * su * cam.zoom, r * su * cam.zoom * SF_TILT,
                0, 0, Math.PI * 2);
    ctx.fill();
  };

  /* floor plate: the footprint pulled one wall-thickness inward */
  const fl = b.px.map(([qx, qy]) => {
    const t = wallPx / Math.max(10, Math.hypot(qx - b.x, qy - b.y));
    return [(qx + (b.x - qx) * t - cam.x) * cam.zoom + cw / 2,
            sfSY(qy + (b.y - qy) * t, ch)];
  });
  ctx.fillStyle = night ? shade(SF_INT_FLOOR[arch][1], 0.7)
                        : SF_INT_FLOOR[arch][0];
  rmQ(fl); ctx.fill();
  ctx.save(); rmQ(fl); ctx.clip();
  // floor texture: taqueria checker tile, else plank seams across the
  // room — both follow the room frame, not the screen
  if(arch === 'taqueria'){
    ctx.fillStyle = 'rgba(196,182,158,0.30)';
    for(let zi = 0; zi < Math.ceil(RM_D); zi++)
      for(let xi = -4; xi < 4; xi++){
        if((xi + zi) % 2) continue;
        rmQ([rmP(xi + 0.5, zi), rmP(xi + 1.5, zi),
             rmP(xi + 1.5, zi + 1), rmP(xi + 0.5, zi + 1)]); ctx.fill();
      }
  } else {
    ctx.strokeStyle = arch === 'hardware' ? 'rgba(30,32,34,0.4)'
                                          : 'rgba(52,34,18,0.4)';
    ctx.lineWidth = Math.max(0.6, cam.zoom);
    ctx.beginPath();
    for(let z = 0.8; z < RM_D; z += 0.8){
      const a = rmP(-3.6, z), c2 = rmP(3.6, z);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(c2[0], c2[1]);
    }
    for(let x = -3; x <= 3; x++){
      const a = rmP(x, 0), c2 = rmP(x, RM_D);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(c2[0], c2[1]);
    }
    ctx.stroke();
  }
  // party walls — in a footprint wider than the room (a whole row of
  // shops shares one building record) the venue is one unit; walls at
  // x=±3.5 keep it readable instead of a hall the size of the block
  if(uMax - uMin > 7 * su * 1.35){
    ctx.strokeStyle = 'rgba(30,22,14,0.55)';
    ctx.lineWidth = wallPx * cam.zoom * 0.6;
    ctx.beginPath();
    for(const xs of [-3.5, 3.5]){
      const a = rmP(xs, 0), c2 = rmP(xs, RM_D);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(c2[0], c2[1]);
    }
    ctx.stroke();
  }
  /* sun patch: the wall whose outward normal faces the solar bearing
     admits a bright parallelogram thrown along the real sun vector —
     the same physics as the shafts in the walk-in view */
  const sunK = SF_SUN.day * (1 - karlK * 0.75);
  const sunIn = !night && sunK > 0.22;
  if(sunIn){
    const sdl = Math.hypot(SF_SUN.x, SF_SUN.y) || 1;
    const sdx = SF_SUN.x / sdl, sdy = SF_SUN.y / sdl;
    const throwPx = Math.min(2.4 * SF_PXM, (wMax - wMin) * 0.45);
    ctx.fillStyle = `rgba(255,238,190,${(0.30 * sunK).toFixed(3)})`;
    const nP = b.px.length;
    for(let e = 0; e < nP; e++){
      const a = b.px[e], c2 = b.px[(e + 1) % nP];
      const ex = c2[0] - a[0], ey = c2[1] - a[1];
      const el = Math.hypot(ex, ey) || 1;
      let nx = -ey / el, ny = ex / el;
      if(nx * ((a[0] + c2[0]) / 2 - b.x) + ny * ((a[1] + c2[1]) / 2 - b.y) < 0){
        nx = -nx; ny = -ny;
      }
      if(nx * sdx + ny * sdy > -0.35) continue;
      const q = [a, c2,
        [c2[0] + sdx * throwPx, c2[1] + sdy * throwPx],
        [a[0] + sdx * throwPx, a[1] + sdy * throwPx]]
        .map(([qx, qy]) => [(qx - cam.x) * cam.zoom + cw / 2, sfSY(qy, ch)]);
      rmQ(q); ctx.fill();
    }
  }
  /* furniture — the same meter coordinates the walk-in room uses */
  const fur = '#4a3626', furT = '#5a4530';
  if(shop){
    rmRect(0.9, 4.2, 3.3, 5.3, '#5a3a22');            // counter
    rmRect(0.9, 4.2, 3.3, 4.45, '#c8b490');           // stone top edge
    rmRect(1.05, 4.35, 1.7, 5.05, '#2c2c30');         // espresso machine
    rmRect(2.5, 4.35, 3.15, 5.0, '#7a4a26');          // pastry case
    rmRect(-3.5, 5.9, -3.15, 7.6, '#4a3626');         // back-bar shelves
    if(arch === 'taqueria')
      rmRect(-3.3, 4.8, -2.3, 6.0, '#8a2f24');        // salsa bar
    if(arch === 'hardware')
      rmRect(-3.3, 4.2, -2.0, 7.4, '#3c4048');        // aisle shelf
    if(arch !== 'hardware'){
      for(const [tx, tz] of [[-1.7, 4.7], [-0.3, 6.2], [-2.5, 6.9]]){
        if(tz > RM_D - 0.9) continue;
        rmDisc(tx, tz, 0.5, '#d8cba8');
        rmRect(tx - 0.98, tz - 0.2, tx - 0.58, tz + 0.2, fur);
        rmRect(tx + 0.58, tz - 0.2, tx + 0.98, tz + 0.2, fur);
      }
    }
    if(arch === 'taqueria'){                          // papel picado rows
      ctx.strokeStyle = 'rgba(40,30,20,0.7)';
      ctx.lineWidth = Math.max(0.6, cam.zoom);
      for(const z of [2.2, 3.6]){
        const a = rmP(-3.2, z), c2 = rmP(3.2, z);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c2[0], c2[1]);
        ctx.stroke();
        for(let k = 0; k < 7; k++){
          const p = rmP(-2.7 + k * 0.9, z);
          ctx.fillStyle = ['#e04030', '#f0a020', '#30a0b0', '#d84a90',
                           '#60a030'][k % 5];
          ctx.fillRect(p[0] - 2 * cam.zoom, p[1],
                       Math.max(1.5, 4 * cam.zoom), Math.max(1.5, 3 * cam.zoom));
        }
      }
    }
  } else {
    rmDisc(0, 5.6, 1.35, '#8a4a42');                  // rug
    rmDisc(0, 5.6, 0.95, '#7c443c');
    rmRect(-3.4, 4.4, -2.35, 6.6, '#5a6a58');         // sofa
    rmRect(-3.32, 4.95, -2.45, 5.7, '#c9a86a');
    rmRect(-3.32, 5.75, -2.45, 6.5, '#a85a5a');
    rmRect(2.55, 5.7, 3.42, Math.min(8.2, RM_D - 0.4), fur); // bookshelf
    rmDisc(-1.2, 5.2, 0.16, '#2c241c');               // floor lamp
    rmRect(-3.2, 7.4, -2.75, 7.85, '#8a5a3a');        // potted plant
    rmDisc(-2.97, 7.6, 0.28, '#3e7a34');
    rmRect(-3.5, 6.9, -3.35, 7.7, '#3a2c1c');         // wall art
    rmRect(-3.5, 7.9, -3.35, 8.5, '#3a2c1c');
    // sewing table by the window (Carmen's flat) / desk for the others
    if(phash(seed, 2, 7100) < 0.5) rmRect(0.8, 7.6, 1.9, 8.2, furT);
  }
  // furniture mass shade — a soft block thrown away from the window sun
  if(sunIn){
    ctx.fillStyle = `rgba(24,16,9,${(0.16 * sunK).toFixed(3)})`;
    const sdl = Math.hypot(SF_SUN.x, SF_SUN.y) || 1;
    const sux = SF_SUN.x / sdl, suy = SF_SUN.y / sdl;
    const bk = 0.35;                                  // ~counter height throw
    for(const [x0, z0, x1, z1] of shop
        ? [[0.9, 4.2, 3.3, 5.3]]
        : [[-3.4, 4.4, -2.35, 6.6], [2.55, 5.7, 3.42, 7.6]]){
      const sh = [rmP(x0, z0), rmP(x1, z0), rmP(x1, z1), rmP(x0, z1)]
        .map(p => [p[0] + sux * bk * su * cam.zoom,
                   p[1] + suy * bk * su * cam.zoom * SF_TILT]);
      rmQ(sh); ctx.fill();
    }
  }
  /* lamp pools — the same pendant positions the walk-in view hangs */
  if(lamps || night){
    for(const [lx, lz] of shop ? [[-1.5, 4.0], [0.2, 5.6], [1.8, 4.8]]
                               : [[0, 5.2], [-1.2, 5.2]]){
      const p = rmP(lx, lz), gr = 0.9 * su * cam.zoom;
      const lg = ctx.createRadialGradient(p[0], p[1], 1,
                                          p[0], p[1], Math.max(3, gr));
      lg.addColorStop(0, 'rgba(255,208,130,0.35)');
      lg.addColorStop(1, 'rgba(255,208,130,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(p[0] - gr, p[1] - gr, gr * 2, gr * 2);
    }
  }
  ctx.restore();                                      // unclip floor

  /* wall band + door notch — the door gap reads as the threshold the
     pawn actually stepped through */
  ctx.lineWidth = wallPx * cam.zoom;
  ctx.strokeStyle = shade(SF_INT_WALL[arch][0], 0.55);
  rmQ(b.px.map(([qx, qy]) => [(qx - cam.x) * cam.zoom + cw / 2, sfSY(qy, ch)]));
  ctx.stroke();
  if(dCell){
    const dxu = (dxp - b.x) * uvx + (dyp - b.y) * uvy;
    const xd = clamp((dxu - uMid) / su, -3.0, 3.0);
    rmRect(xd - 0.55, -0.35, xd + 0.55, 0.5,
           night ? shade(SF_INT_FLOOR[arch][1], 0.7) : SF_INT_FLOOR[arch][0]);
    // entry mat just inside the threshold
    rmRect(xd - 0.5, 0.5, xd + 0.5, 1.0, 'rgba(60,50,40,0.8)');
  }
  // dashed x-ray rim so the lifted room reads as a cutaway, not a decal
  ctx.strokeStyle = 'rgba(150,215,255,0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  rmQ(b.px.map(([qx, qy]) => [(qx - cam.x) * cam.zoom + cw / 2, sfSY(qy, ch)]));
  ctx.stroke();
  ctx.setLineDash([]);

  /* occupants — the pawns inside this room, at their real room seats,
     drawn with the same chibi sprites the street uses */
  const occ = [];
  {
    let k = 0;
    for(const o of VILLAGERS){
      if(!(o.inBuilding && o.inside === name)) continue;
      occ.push({ o,
        x: o === VILLAGERS[inspectedPawnIdx] ? 0.4
           : (phash(k, seed, 1920) * 2 - 1) * 2.3,
        z: o === VILLAGERS[inspectedPawnIdx] ? 3.2
           : 4.0 + phash(k, seed, 1921) * Math.max(1.5, RM_D - 5.2) });
      k++;
    }
    occ.sort((a, b2) => a.z - b2.z);
  }
  for(const m of occ.slice(0, 6)){
    const p = rmP(m.x, m.z);
    ctx.fillStyle = 'rgba(16,10,6,0.35)';
    ctx.beginPath();
    ctx.ellipse(p[0], p[1] + 2 * cam.zoom, 8 * cam.zoom, 3.5 * cam.zoom,
                0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(p[0] - ((m.o.x - cam.x) * cam.zoom + cw / 2),
                  p[1] - sfSY(m.o.y, ch));
    renderChibiPawn(m.o, cw, ch);
    ctx.restore();
    sfSayBubble(m.o, p[0], p[1] - 26 * cam.zoom, Math.min(1, cam.zoom));
  }
  // room caption — name + parody display label over the lifted roof
  const dn2 = (typeof sfDisplayName === 'function' && sfDisplayName(name)) || name;
  if(cam.zoom >= 0.4){
    const cx2 = (b.x - cam.x) * cam.zoom + cw / 2,
          cy2 = sfSY(b.by0, ch) - b.hPx * cam.zoom - 26 * cam.zoom;
    ctx.font = `bold ${Math.max(10, 11 * cam.zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    const tw = ctx.measureText(dn2).width;
    ctx.fillStyle = 'rgba(12,10,8,0.72)';
    ctx.fillRect(cx2 - tw / 2 - 8, cy2 - 12, tw + 16, 18);
    ctx.strokeStyle = 'rgba(230,210,170,0.5)'; ctx.lineWidth = 1;
    ctx.strokeRect(cx2 - tw / 2 - 8, cy2 - 12, tw + 16, 18);
    ctx.fillStyle = '#f8f4e8';
    ctx.fillText(dn2, cx2, cy2 + 1);
  }
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
/* v35: venue archetype drives the room's palette, floor and signature
   fixtures. Pure name/label lookup — no world state, safe to export. */
function sfIntArch(name, lab){
  const s = (name + ' ' + (lab || '')).toLowerCase();
  if(/taqueria|salsa|farolito/.test(s)) return 'taqueria';
  if(/hardware|aisle|bins|auerbach/.test(s)) return 'hardware';
  if(/caf|coffee|counter|park-edge/.test(s)) return 'cafe';
  return 'flat';
}
const SF_INT_WALL = {
  cafe:     ['#6d5a44', '#8a7458'],
  taqueria: ['#7c4630', '#a4643e'],
  hardware: ['#565a52', '#74796e'],
  flat:     ['#7a6a58', '#9a8874'],
};
const SF_INT_FLOOR = {
  cafe:     ['#9a7448', '#6b4a2c'],
  taqueria: ['#8a6a50', '#5e4530'],
  hardware: ['#7a7c78', '#54565a'],
  flat:     ['#9a7448', '#6b4a2c'],
};
function sfRenderInterior(cw, ch, v){
  const name = v.inside || 'inside';
  const rec = SF_INTERIORS[name];
  const lab = (rec && rec.label) || '';
  const seed = sfIntSeed(name);
  // venue interiors are registered POIs; flats are anchor rooms (poi:null)
  const shop = rec ? !!rec.poi : /caf|coffee|counter|aisle|salsa|park-edge|bins/i.test(lab + ' ' + name);
  const arch = shop ? sfIntArch(name, lab) : 'flat';
  const night = isNight();
  const lamps = sfLampsLit();
  const karlK = sfKarlK();

  /* --- room shell: one vanishing point centered on the back wall --- */
  const vpx = cw * 0.5, vpy = ch * 0.40;
  const bL = cw * 0.24, bR = cw * 0.76, bT = ch * 0.15, bB = ch * 0.60;
  const wallB = SF_INT_WALL[arch][0];
  const wallT = SF_INT_WALL[arch][1];
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
  // denser with depth (perspective foreshortening). v35: taqueria gets
  // checkerboard tile, hardware gets sealed concrete.
  const fg = ctx.createLinearGradient(0, bB, 0, ch);
  fg.addColorStop(0, SF_INT_FLOOR[arch][0]); fg.addColorStop(1, SF_INT_FLOOR[arch][1]);
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(bL, bB); ctx.lineTo(bR, bB); ctx.lineTo(cw, ch); ctx.lineTo(0, ch);
  ctx.closePath(); ctx.fill();
  if(arch === 'taqueria'){
    // checkerboard rows on the same foreshortened spacing as the seams
    for(let k = 0; k < 6; k++){
      const t0 = Math.pow(k / 6, 1.55), t1 = Math.pow((k + 1) / 6, 1.55);
      const y0 = bB + (ch - bB) * t0, y1 = bB + (ch - bB) * t1;
      const xl = bL + (0 - bL) * (t0 + t1) / 2, xr = bR + (cw - bR) * (t0 + t1) / 2;
      const n2 = 12;
      for(let c = 0; c < n2; c++){
        if((c + k) % 2) continue;
        ctx.fillStyle = 'rgba(196,182,158,0.30)';
        ctx.fillRect(xl + (xr - xl) * c / n2, y0, (xr - xl) / n2 + 1, y1 - y0);
      }
    }
  } else {
    ctx.strokeStyle = arch === 'hardware' ? 'rgba(30,32,34,0.45)' : 'rgba(52,34,18,0.5)';
    ctx.lineWidth = 1;
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
  }
  // baseboards + crown molding
  ctx.strokeStyle = shade('#e8dcc8', 0.85); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(bL, bB); ctx.lineTo(bR, bB); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bL, bT); ctx.lineTo(bR, bT); ctx.stroke();
  // v43: Edwardian shell dressing — a wallpaper frieze band between the
  // picture rail and the crown, and pressed-tin ceiling squares in the
  // shop venues (the Mission's old storefronts kept their tin ceilings)
  ctx.fillStyle = shade(wallT, 1.10);
  ctx.fillRect(bL, bT, bR - bL, (bB - bT) * 0.14);
  ctx.strokeStyle = 'rgba(60,44,26,0.30)'; ctx.lineWidth = 1;
  for(let k = 0; k <= 18; k++){
    const fx2 = bL + (bR - bL) * k / 18;
    ctx.beginPath(); ctx.moveTo(fx2, bT + 2);
    ctx.lineTo(fx2, bT + (bB - bT) * 0.14 - 2); ctx.stroke();
  }
  if(shop){
    ctx.strokeStyle = 'rgba(20,14,8,0.22)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for(let k = 0; k <= 8; k++){
      const t = k / 8;
      ctx.moveTo(cw * t, 0); ctx.lineTo(bL + (bR - bL) * t, bT);
    }
    for(let k = 1; k <= 3; k++){
      const t = Math.pow(k / 3, 1.4);
      const y = bT * t, xl = bL * t, xr = bR + (cw - bR) * t;
      ctx.moveTo(xl, y); ctx.lineTo(xr, y);
    }
    ctx.stroke();
  }
  // v35: corner ambient occlusion — the room's deepest corners hold the
  // least bounced light, so each wall junction gets a soft dark lobe
  for(const [ax, ay, ar] of [[bL, bT, 130], [bR, bT, 130], [bL, bB, 150], [bR, bB, 150],
                             [0, 0, 170], [cw, 0, 170], [0, ch, 200], [cw, ch, 200]]){
    const ao = ctx.createRadialGradient(ax, ay, ar * 0.15, ax, ay, ar);
    ao.addColorStop(0, 'rgba(16,10,6,0.34)');
    ao.addColorStop(1, 'rgba(16,10,6,0)');
    ctx.fillStyle = ao;
    ctx.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);
  }

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
  // outside (east sun pushes the beam toward the room's west side).
  // v35: Karl's marine layer eats direct sun — same physics as outside.
  const sunK = SF_SUN.day * (1 - karlK * 0.75);
  const sunIn = !night && sunK > 0.22;
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
    // v35: weather on the pane — Karl's marine layer milks the whole view,
    // rain beads streak down the outside of the glass with the wind slant
    if(karlK > 0.12 && !night){
      ctx.fillStyle = `rgba(206,214,216,${karlK * 0.55})`;
      ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    }
    if(W.rain > 0.15 && !night){
      ctx.strokeStyle = `rgba(220,232,240,${0.35 + W.rain * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const wdrift = clamp(Math.cos(W.windAng) * W.windSpd * 0.4, -1, 1) * 6;
      for(let k = 0; k < 14; k++){
        const rx = wx0 + phash(k, seed, 3870) * (wx1 - wx0);
        const ry = wy0 + ((phash(k, seed, 3871) + SF_WX.t * (0.05 + phash(k, seed, 3872) * 0.08)) % 1) * (wy1 - wy0);
        ctx.moveTo(rx, ry); ctx.lineTo(rx + wdrift, ry + 7 + phash(k, seed, 3873) * 9);
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
      sg.addColorStop(0, `rgba(255,238,190,${0.42 * sunK})`);
      sg.addColorStop(1, 'rgba(255,238,190,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(wx0, wy1); ctx.lineTo(wx1, wy1);
      ctx.lineTo(wx1 + slant, wy1 + drop); ctx.lineTo(wx0 + slant, wy1 + drop);
      ctx.closePath(); ctx.fill();
      // v35: the frame shadows the beam — dark slats where mullions block
      // the sun, so the shaft reads as light THROUGH a window, not a glow
      const nSlat = shop ? 3 : 1;
      ctx.fillStyle = `rgba(52,36,20,${0.30 * sunK})`;
      for(let k = 1; k <= nSlat; k++){
        const mx = wx0 + (wx1 - wx0) * k / (nSlat + 1);
        ctx.beginPath();
        ctx.moveTo(mx - 1.5, wy1); ctx.lineTo(mx + 1.5, wy1);
        ctx.lineTo(mx + slant + 3, wy1 + drop); ctx.lineTo(mx + slant - 3, wy1 + drop);
        ctx.closePath(); ctx.fill();
      }
      // the beam lands as a bright pool on the floorboards
      const pool = ctx.createRadialGradient((wx0 + wx1) / 2 + slant, wy1 + drop, 4,
                                            (wx0 + wx1) / 2 + slant, wy1 + drop, (wx1 - wx0) * 0.7);
      pool.addColorStop(0, `rgba(255,240,200,${0.30 * sunK})`);
      pool.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse((wx0 + wx1) / 2 + slant, wy1 + drop * 0.92,
                  (wx1 - wx0) * 0.62, drop * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      // and bounces a soft warm band onto the ceiling above the window
      const cb = ctx.createLinearGradient(0, wy0, 0, Math.max(0, wy0 - (wy1 - wy0) * 0.5));
      cb.addColorStop(0, `rgba(255,230,170,${0.16 * sunK})`);
      cb.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = cb;
      ctx.fillRect(wx0, Math.max(0, wy0 - (wy1 - wy0) * 0.5), wx1 - wx0, (wy1 - wy0) * 0.5);
      // dust motes hanging in the beam
      ctx.fillStyle = `rgba(255,244,210,${0.5 * sunK})`;
      const bucket = Math.floor(SF_WX.t * 6);
      for(let k = 0; k < 10; k++){
        const mx = wx0 + hash2(k, bucket, seed + 1905) * (wx1 - wx0) +
                   slant * hash2(k, 3, seed + 1906) * 0.6;
        const my = wy1 + hash2(k, bucket + 41, seed + 1907) * drop;
        ctx.fillRect(mx, my, 1.6, 1.6);
      }
    }
  }

  /* --- v52: the room is metric now ------------------------------
     The shell has always been one-point perspective; this pass finally
     treats it as a real room. A pinhole camera stands in the doorway at
     eye height and the vanishing point becomes a projection: props are
     placed in meters (x lateral from room center, z depth from the door,
     h height) and projected through it. Furniture is true cuboids with
     separately lit top/front/side faces, pendant lamps shrink with
     depth, pictures hang ON the receding side walls, occupants scale by
     1/z, and every prop casts its shadow along the real sun vector that
     enters through the windows. */
  const RM_W = 7;                                        // room width (m)
  const eyeH = (bB - vpy) * RM_W / (bR - bL);            // doorway eye height
  const roomH = eyeH + (vpy - bT) * RM_W / (bR - bL);    // ceiling height
  const RM_D = 8.4 + phash(seed, 0, 5200) * 1.6;         // back-wall depth (m)
  const RM_F = (bR - bL) * RM_D / RM_W;                  // focal length, px·m
  const RM = (x, z, h) => {
    const zz = Math.max(1.1, z);
    return { x: vpx + x * RM_F / zz, y: vpy + (eyeH - h) * RM_F / zz, s: RM_F / zz };
  };
  const zNear = eyeH * RM_F / (ch - vpy);                // closest visible depth
  // the sun enters through the back-wall windows and travels toward the
  // door: floor shadows run toward the camera, sideways with toX, and
  // stretch with cot(el) exactly like the shadows outside
  const cotEl = clamp(1 / Math.tan(Math.max(0.08, SF_SUN.el || 0.6)), 0.4, 2.6);
  const shX = -SF_SUN.toX * cotEl * 0.8, shZ = -0.7 * cotEl;
  function rmPoly(pts, fill){
    ctx.fillStyle = fill; ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath(); ctx.fill();
  }
  // soft floor shadow: the footprint extruded along the sun's floor vector
  function rmShadow(x0, z0, x1, z1, h, a){
    const dx = shX * h, dz = shZ * h;
    rmPoly([RM(x0, z0, 0), RM(x1, z0, 0), RM(x1 + dx, z0 + dz, 0),
            RM(x1 + dx, z1 + dz, 0), RM(x0 + dx, z1 + dz, 0), RM(x0 + dx, z0 + dz, 0)],
           `rgba(24,16,9,${a})`);
  }
  // cuboid: near face + top (when below eye level) + the side that faces
  // the room center. Top faces catch the window sun; sides sit in shade.
  function rmBox(x0, z0, x1, z1, h0, h1, col){
    const xc = (x0 + x1) / 2;
    if(Math.abs(xc) > (x1 - x0) / 2 - 0.01){
      const xs = xc > 0 ? x0 : x1;
      rmPoly([RM(xs, z1, h0), RM(xs, z1, h1), RM(xs, z0, h1), RM(xs, z0, h0)],
             shade(col, 0.64));
    }
    rmPoly([RM(x0, z0, h0), RM(x1, z0, h0), RM(x1, z0, h1), RM(x0, z0, h1)], col);
    if(h1 < eyeH * 1.02)
      rmPoly([RM(x0, z0, h1), RM(x1, z0, h1), RM(x1, z1, h1), RM(x0, z1, h1)],
             sunIn ? mix(shade(col, 1.22), '#ffe4b0', 0.30 * sunK) : shade(col, 1.18));
  }
  // horizontal disc (table tops, rugs, lamp pools) — foreshortened for eye height
  function rmDisc(x, z, r, h, fill){
    const p = RM(x, z, h);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * p.s, r * p.s * Math.max(0.10, (eyeH - h) / z), 0, 0, Math.PI * 2);
    ctx.fill();
    return p;
  }
  // quad hanging on a side wall plane (sgn -1 left / +1 right)
  function rmWallQuad(sgn, z0, z1, h0, h1, fill){
    const x = sgn * RM_W / 2;
    rmPoly([RM(x, z0, h0), RM(x, z1, h0), RM(x, z1, h1), RM(x, z0, h1)], fill);
  }
  // quad on an interior partition face x=const between z0..z1
  function rmFaceX(x, z0, z1, h0, h1, fill){
    rmPoly([RM(x, z0, h0), RM(x, z1, h0), RM(x, z1, h1), RM(x, z0, h1)], fill);
  }

  // wall clock on the left wall reads the real sim clock — compressed by
  // the receding wall exactly like every other depth feature
  {
    const zc = 5.0, p = RM(-RM_W / 2, zc, 2.05),
          kr = 0.22 * p.s, krx = kr * (RM_W / 2) / zc;
    ctx.fillStyle = '#e8e0cc';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, krx, kr, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2c2418'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 1;
    ctx.beginPath();
    for(let k = 0; k < 12; k++){
      const a = k / 12 * Math.PI * 2;
      ctx.moveTo(p.x + Math.cos(a) * krx * 0.82, p.y + Math.sin(a) * kr * 0.82);
      ctx.lineTo(p.x + Math.cos(a) * krx * 0.94, p.y + Math.sin(a) * kr * 0.94);
    }
    const hr = ((W.tod || 12) % 12) / 12 * Math.PI * 2 - Math.PI / 2,
          mn = ((W.tod || 0) % 1) * Math.PI * 2 - Math.PI / 2;
    ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(hr) * krx * 0.5, p.y + Math.sin(hr) * kr * 0.5);
    ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(mn) * krx * 0.78, p.y + Math.sin(mn) * kr * 0.78);
    ctx.stroke();
  }
  // hall door on the right wall — a real projected opening, not a decal
  {
    const lit = lamps || night;
    rmWallQuad(1, 4.1, 5.1, 0, 2.1, '#241a10');
    rmWallQuad(1, 4.25, 4.95, 0.14, 1.95, '#31241a');   // recessed panel
    ctx.strokeStyle = shade('#e8dcc8', 0.8); ctx.lineWidth = 3;
    const dPts = [RM(RM_W / 2, 4.1, 0), RM(RM_W / 2, 5.1, 0),
                  RM(RM_W / 2, 5.1, 2.1), RM(RM_W / 2, 4.1, 2.1)];
    ctx.beginPath(); ctx.moveTo(dPts[0].x, dPts[0].y);
    for(let i = 1; i < 4; i++) ctx.lineTo(dPts[i].x, dPts[i].y);
    ctx.closePath(); ctx.stroke();
    rmWallQuad(1, 4.2, 5.0, 2.16, 2.46,                 // lit transom
               lit ? 'rgba(255,206,120,0.55)' : 'rgba(160,150,130,0.3)');
    const knob = RM(RM_W / 2, 4.35, 1.0);
    ctx.fillStyle = '#c8a44a';
    ctx.beginPath(); ctx.arc(knob.x, knob.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  /* --- furniture, per archetype — all in meters --- */
  const lampGlow = lamps || night;
  if(shop){
    // back-bar shelves moved to the LEFT wall (they were floating inside
    // the storefront glass before) — two projected boards with cups
    for(let s = 0; s < 2; s++){
      const sh = 1.45 + s * 0.42;
      rmWallQuad(-1, 5.9, 7.6, sh, sh + 0.06, '#4a3626');
      for(let k = 0; k < 6; k++){
        const cz = 6.05 + k * 0.24 + phash(k, s, seed + 1912) * 0.06;
        rmWallQuad(-1, cz, cz + 0.13, sh + 0.06, sh + 0.24,
                   ['#c9b89a', '#8a5a3a', '#5a7a8a', '#d8d0c0'][(k + s) % 4]);
      }
    }
    // menu board stays on the back wall (it IS the back wall)
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
    // v52: taqueria — papel picado overhead (ceiling, screen-space ok)
    if(arch === 'taqueria'){
      for(const [y0, sag] of [[ch * 0.06, 26], [ch * 0.13, 20]]){
        ctx.strokeStyle = 'rgba(40,30,20,0.8)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cw * 0.10, y0);
        ctx.quadraticCurveTo(cw * 0.5, y0 + sag * 2, cw * 0.90, y0); ctx.stroke();
        for(let k = 0; k < 9; k++){
          const t = k / 8, px2 = cw * (0.10 + t * 0.80);
          const py2 = y0 + sag * 2 * (1 - Math.pow(2 * t - 1, 2)) - sag * 0.4;
          ctx.fillStyle = ['#e04030', '#f0a020', '#30a0b0', '#d84a90', '#60a030'][k % 5];
          ctx.beginPath(); ctx.moveTo(px2 - 7, py2); ctx.lineTo(px2 + 7, py2);
          ctx.lineTo(px2 + 5, py2 + 12); ctx.lineTo(px2 - 5, py2 + 12);
          ctx.closePath(); ctx.fill();
        }
      }
      // salsa bar along the left wall — a projected counter now
      rmShadow(-3.3, 4.8, -2.3, 6.0, 1.0, sunIn ? 0.26 * sunK + 0.08 : 0.15);
      rmBox(-3.3, 4.8, -2.3, 6.0, 0, 1.0, '#8a2f24');
      rmBox(-3.36, 4.74, -2.24, 6.06, 1.0, 1.07, '#c8b490');
      for(let k = 0; k < 3; k++)  // roja, verde, crema
        rmDisc(-2.8, 5.0 + k * 0.5, 0.09, 1.07, ['#b03020', '#4a7a2e', '#e8d8b0'][k]);
    }
    // v52: hardware — tall aisle shelf as a real cuboid with goods on the
    // face that looks into the room
    if(arch === 'hardware'){
      rmShadow(-3.3, 4.2, -2.0, 7.4, 2.2, sunIn ? 0.26 * sunK + 0.08 : 0.16);
      rmBox(-3.3, 4.2, -2.0, 7.4, 0, 2.2, '#3c4048');
      for(let s = 0; s < 5; s++){
        const sh = 0.35 + s * 0.42;
        rmFaceX(-2.0, 4.25, 7.35, sh, sh + 0.035, '#5a6068');
        for(let k = 0; k < 6; k++){
          const gz = 4.35 + k * 0.5 + phash(k, s, seed + 3880) * 0.12;
          rmFaceX(-2.0, gz, gz + 0.3, sh + 0.035, sh + 0.035 + 0.16 + phash(k, s, seed + 3884) * 0.14,
                  ['#b8542e', '#c8a030', '#6a7a8a', '#8a8a80', '#4a6a4a'][Math.floor(phash(k, s, seed + 3885) * 5)]);
        }
      }
      // pegboard on the back wall with hung tool silhouettes
      const pgx = bL + (bR - bL) * 0.06, pgy = bT + (bB - bT) * 0.12;
      const pgw = (bR - bL) * 0.22, pgh = (bB - bT) * 0.30;
      ctx.fillStyle = '#8a7a5a'; ctx.fillRect(pgx, pgy, pgw, pgh);
      ctx.fillStyle = 'rgba(40,30,18,0.5)';
      for(let k = 0; k < 8; k++)
        ctx.fillRect(pgx + 6 + phash(k, seed, 3881) * (pgw - 18),
                     pgy + 6 + phash(k, seed, 3882) * (pgh - 18), 4, 10 + phash(k, seed, 3883) * 8);
    }
    // cafe tables + chairs, placed in the room and shrinking with depth
    const tbls = arch === 'hardware' ? [] : [[-1.7, 4.7], [-0.3, 6.2], [-2.5, 6.9]];
    for(const [tx, tz] of tbls){
      if(tz > RM_D - 0.9) continue;
      rmShadow(tx - 0.5, tz - 0.4, tx + 0.5, tz + 0.4, 0.75, sunIn ? 0.26 * sunK + 0.06 : 0.13);
      for(const cs of [-1, 1]){  // chairs: small cuboids flanking the table
        const chx = tx + cs * 0.78;
        rmBox(chx - 0.2, tz - 0.2, chx + 0.2, tz + 0.2, 0, 0.45, '#4a3626');
        rmBox(chx + (cs > 0 ? 0.08 : -0.28), tz - 0.2, chx + (cs > 0 ? 0.28 : -0.08), tz + 0.2, 0.45, 0.92, '#4a3626');
      }
      { // pedestal + disc top
        const pb = RM(tx, tz, 0), pt = RM(tx, tz, 0.72);
        ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = Math.max(2, 0.05 * pb.s);
        ctx.beginPath(); ctx.moveTo(pb.x, pb.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
        rmDisc(tx, tz, 0.5, 0.74, '#d8cba8');
        const p = RM(tx, tz, 0.74);
        ctx.strokeStyle = '#8a6a45'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 0.5 * p.s, 0.5 * p.s * Math.max(0.10, (eyeH - 0.74) / tz), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // the counter: a real box you could lean on, stone top overhang
    rmShadow(0.9, 4.2, 3.3, 5.3, 1.05, sunIn ? 0.30 * sunK + 0.08 : 0.16);
    rmBox(0.9, 4.2, 3.3, 5.3, 0, 1.05, '#5a3a22');
    rmBox(0.82, 4.12, 3.38, 5.34, 1.05, 1.12, '#c8b490');
    // espresso machine + pastry case ride the counter top
    rmBox(1.05, 4.35, 1.7, 5.05, 1.12, 1.62, '#2c2c30');
    rmBox(1.12, 4.33, 1.63, 4.52, 1.50, 1.56, '#b8bcc4');
    {
      const p = RM(1.32, 4.32, 1.30);
      ctx.fillStyle = '#d8a44a'; ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      // steam while the café is open
      if(arch === 'cafe' && !night){
        ctx.strokeStyle = 'rgba(240,240,235,0.4)'; ctx.lineWidth = 2;
        ctx.beginPath();
        const ph = Math.floor(SF_WX.t * 2), st = RM(1.35, 4.5, 1.62);
        for(let k = 0; k < 3; k++){
          const sx2 = st.x - 12 + k * 9, sy2 = st.y;
          const w = Math.sin(ph + k * 2.1) * 5;
          ctx.moveTo(sx2, sy2);
          ctx.quadraticCurveTo(sx2 + w, sy2 - 12, sx2 + w * 0.4, sy2 - 24);
        }
        ctx.stroke();
      }
    }
    rmBox(2.5, 4.35, 3.15, 5.0, 1.12, 1.42, '#7a4a26');
    { // glass dome over the pastry case, warm crumb inside
      const p = RM(2.82, 4.33, 1.42), gw = 0.34 * p.s, gh = 0.22 * p.s;
      ctx.fillStyle = '#e0b060';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + gh * 0.4, gw * 0.7, gh * 0.4, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(210,228,240,0.45)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, gw * 0.5, gh * 0.55, 0, Math.PI, 0); ctx.fill();
    }
  } else {
    // flat: rug, sofa, bookshelf, floor lamp, framed art, sill plant
    rmDisc(0, 5.6, 1.35, 0.01, '#8a4a42');
    rmDisc(0, 5.6, 0.95, 0.012, '#7c443c');
    // sofa against the left wall: seat + back + arms + cushions
    rmShadow(-3.4, 4.4, -2.35, 6.6, 0.95, sunIn ? 0.26 * sunK + 0.08 : 0.15);
    rmBox(-3.4, 4.4, -2.35, 6.6, 0, 0.45, '#5a6a58');
    rmBox(-3.42, 4.4, -2.95, 6.6, 0.45, 0.95, '#4a5848');
    rmBox(-3.4, 4.4, -2.35, 4.85, 0.45, 0.72, '#52624f');
    rmBox(-3.4, 6.15, -2.35, 6.6, 0.45, 0.72, '#52624f');
    rmBox(-3.32, 4.95, -2.45, 5.7, 0.45, 0.58, '#c9a86a');
    rmBox(-3.32, 5.75, -2.45, 6.5, 0.45, 0.58, '#a85a5a');
    // bookshelf on the right wall, deep enough to clear the hall door —
    // books on the face toward the room
    const bsZ1 = Math.min(8.2, RM_D - 0.4);
    rmShadow(2.55, 5.7, 3.42, bsZ1, 2.15, sunIn ? 0.26 * sunK + 0.08 : 0.16);
    rmBox(2.55, 5.7, 3.42, bsZ1, 0, 2.15, '#4a3423');
    for(let s = 0; s < 4; s++){
      const sh = 0.42 + s * 0.45;
      rmFaceX(2.55, 5.75, bsZ1 - 0.05, sh, sh + 0.035, '#3a281a');
      for(let k = 0; k < 8; k++){
        const bz = 5.85 + k * ((bsZ1 - 6.15) / 8) + phash(k, s, seed + 1915) * 0.06;
        rmFaceX(2.55, bz, bz + 0.19, sh + 0.035, sh + 0.035 + 0.16 + phash(k, s, seed + 1916) * 0.12,
                ['#8a4a3a', '#3a5a7a', '#7a8a4a', '#b0905a', '#5a4a7a'][Math.floor(phash(k, s, seed + 1917) * 5)]);
      }
    }
    // framed art hangs ON the side walls now — it recedes with the room
    rmWallQuad(-1, 6.9, 7.7, 1.5, 2.25, '#3a2c1c');
    rmWallQuad(-1, 6.98, 7.62, 1.57, 2.18, '#7a9ab0');
    rmWallQuad(-1, 7.9, 8.5, 1.45, 2.1, '#3a2c1c');
    rmWallQuad(-1, 7.98, 8.42, 1.52, 2.03, '#b0785a');
    // snapshot cluster between the back-wall windows
    for(let k = 0; k < 3; k++){
      const fx = bL + (bR - bL) * (0.50 + phash(k, seed, 4350) * 0.05),
            fy = bT + (bB - bT) * (0.15 + k * 0.13);
      ctx.fillStyle = '#4a3a28'; ctx.fillRect(fx, fy, 16, 20);
      ctx.fillStyle = ['#c9b89a', '#8aa0b0', '#b0905a'][k];
      ctx.fillRect(fx + 2, fy + 2, 12, 16);
    }
    // steam radiator under each window — the SF flat staple (back wall)
    let wi = 0;
    for(const [wx0, wy0, wx1, wy1] of winRects){
      const rx0 = wx0 + 4, rx1 = wx1 - 4, ry = bB - 6, rh = 26;
      ctx.fillStyle = 'rgba(16,10,6,0.3)';
      ctx.beginPath(); ctx.ellipse((rx0 + rx1) / 2, ry + 2, (rx1 - rx0) * 0.6, 5, 0, 0, Math.PI * 2); ctx.fill();
      for(let k = 0; k < 6; k++){
        const fx2 = rx0 + (rx1 - rx0) * k / 5;
        ctx.fillStyle = '#b8b0a0';
        ctx.beginPath(); ctx.ellipse(fx2, ry - rh / 2, (rx1 - rx0) / 12, rh / 2, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(60,50,40,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rx0, ry); ctx.lineTo(rx1, ry); ctx.stroke();
      // the house cat asleep on the sill, when the seed says so
      if(phash(seed, wi++, 4351) < 0.5){
        const cx2 = (wx0 + wx1) / 2 + (phash(seed, 7, 4352) - 0.5) * (wx1 - wx0) * 0.4,
              cy2 = wy1 + 4;
        ctx.fillStyle = '#3a3230';
        ctx.beginPath(); ctx.ellipse(cx2, cy2 - 5, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx2 - 12, cy2 - 8, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();                          // ear + tail curl
        ctx.moveTo(cx2 - 15, cy2 - 12); ctx.lineTo(cx2 - 13, cy2 - 16); ctx.lineTo(cx2 - 10, cy2 - 12);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#3a3230'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx2 + 12, cy2 - 4);
        ctx.quadraticCurveTo(cx2 + 18, cy2 - 2, cx2 + 16, cy2 + 3); ctx.stroke();
      }
    }
    // floor lamp: pole + shade at a meter position, glow + floor pool at dusk
    {
      const lx = -1.2, lz = 5.2;
      const pb = RM(lx, lz, 0), pt = RM(lx, lz, 1.7);
      rmShadow(lx - 0.16, lz - 0.16, lx + 0.16, lz + 0.16, 1.6, sunIn ? 0.22 * sunK + 0.05 : 0.10);
      ctx.strokeStyle = '#2c241c'; ctx.lineWidth = Math.max(2, 0.035 * pb.s);
      ctx.beginPath(); ctx.moveTo(pb.x, pb.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
      const s0 = RM(lx, lz, 1.45), s1 = RM(lx, lz, 1.75);
      rmPoly([{x: s0.x - 0.20 * s0.s, y: s0.y}, {x: s0.x + 0.20 * s0.s, y: s0.y},
              {x: s1.x + 0.11 * s1.s, y: s1.y}, {x: s1.x - 0.11 * s1.s, y: s1.y}],
             lampGlow ? '#f0d8a0' : '#c8b890');
      if(lampGlow){
        const g = RM(lx, lz, 1.5), gr = 0.9 * g.s;
        const lg = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, gr);
        lg.addColorStop(0, 'rgba(255,214,140,0.4)');
        lg.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = lg; ctx.fillRect(g.x - gr, g.y - gr, gr * 2, gr * 2);
        rmDisc(lx, lz, 1.0, 0.01, 'rgba(255,208,130,0.14)');
      }
    }
    // potted plant on the floor by the window
    rmBox(-3.2, 7.4, -2.75, 7.85, 0, 0.32, '#8a5a3a');
    for(let k = 0; k < 5; k++){
      const fp = RM(-2.97 + Math.cos(k * 1.3) * 0.10, 7.6, 0.40 + k * 0.16);
      paBlob(ctx, fp.x, fp.y, 0.11 * fp.s, k % 2 ? '#3e7a34' : '#2e5a24');
    }
  }
  // pendant lamps: real cords from the ceiling plane, shades that shrink
  // with depth, warm pools on the floor when lit
  const nPend = shop ? 3 : 1;
  for(let k = 0; k < nPend; k++){
    const lx = nPend === 1 ? 0 : [-1.5, 0.2, 1.8][k],
          lz = nPend === 1 ? 5.2 : [4.0, 5.6, 4.8][k];
    const pc = RM(lx, lz, roomH), ph2 = RM(lx, lz, 2.42), pt = RM(lx, lz, 2.62);
    ctx.strokeStyle = '#241c14'; ctx.lineWidth = Math.max(1.5, 0.015 * pc.s);
    ctx.beginPath(); ctx.moveTo(pc.x, pc.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
    rmPoly([{x: ph2.x - 0.20 * ph2.s, y: ph2.y}, {x: ph2.x + 0.20 * ph2.s, y: ph2.y},
            {x: pt.x + 0.11 * pt.s, y: pt.y}, {x: pt.x - 0.11 * pt.s, y: pt.y}],
           shop ? '#3a5a4a' : '#7a6a58');
    if(lampGlow || shop){
      const a = lampGlow ? 0.5 : 0.18, g = RM(lx, lz, 2.35), gr = 0.55 * g.s;
      const lg = ctx.createRadialGradient(g.x, g.y, 2, g.x, g.y, gr);
      lg.addColorStop(0, `rgba(255,208,130,${a})`);
      lg.addColorStop(1, 'rgba(255,208,130,0)');
      ctx.fillStyle = lg; ctx.fillRect(g.x - gr, g.y - gr, gr * 2, gr * 2);
      ctx.fillStyle = `rgba(255,230,170,${a + 0.2})`;
      ctx.beginPath(); ctx.arc(g.x, g.y, Math.max(2, 0.035 * g.s), 0, Math.PI * 2); ctx.fill();
      if(lampGlow) rmDisc(lx, lz, 0.9, 0.01, 'rgba(255,208,130,0.14)');
    }
  }

  /* --- occupants: placed in the room, scaled by 1/z, far first --- */
  const inside = [];
  {
    let k = 0;
    for(const o of VILLAGERS){
      if(!(o.inBuilding && o.inside === name && o !== v)) continue;
      inside.push({ o,
        x: (phash(k, seed, 1920) * 2 - 1) * 2.3,
        z: 4.0 + phash(k, seed, 1921) * Math.max(1.5, RM_D - 5.2) });
      k++;
    }
    inside.sort((a, b) => b.z - a.z);
  }
  for(const m of inside.slice(0, 4)){
    const p = RM(m.x, m.z, 0), ph2 = 1.68 * p.s, pw = ph2 * 0.75;
    const F3 = PA.chars && PA.chars[m.o._ci != null ? m.o._ci : 0];
    const fr = F3 && F3[0] && (paActFrame(F3, 0, m.o, G.frame) || F3[0].idle[0]);
    if(fr){
      if(sunIn) rmShadow(m.x - 0.28, m.z - 0.2, m.x + 0.28, m.z + 0.2, 1.6, 0.20 * sunK);
      ctx.fillStyle = 'rgba(16,10,6,0.4)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, pw * 0.42, pw * 0.13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.imageSmoothingEnabled = false;   // pixel sprites stay crisp at room scale
      ctx.drawImage(fr, p.x - pw / 2, p.y - ph2, pw, ph2);
      ctx.imageSmoothingEnabled = true;
      sfSayBubble(m.o, p.x, p.y - ph2 - 6, 0.85);   // production-1: occupants speak
    }
  }
  // the followed pawn, just inside the door, grounded on the floorboards
  const F2 = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  if(F2 && F2[0]){
    const fr = paActFrame(F2, 0, v, G.frame) || F2[0].idle[0];
    if(fr){
      const p = RM(0, Math.max(zNear + 0.6, 3.4), 0), ph2 = 1.68 * p.s, pw = ph2 * 0.75;
      ctx.fillStyle = 'rgba(16,10,6,0.45)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, pw * 0.42, pw * 0.13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(fr, p.x - pw / 2, p.y - ph2, pw, ph2);
      ctx.imageSmoothingEnabled = true;
      sfSayBubble(v, p.x, p.y - ph2 - 8, 1);  // production-1: subject speaks
    }
  }
  // location card — canonical parody display name (production-1)
  const dispName = (typeof sfDisplayName === 'function' && sfDisplayName(name)) || name;
  ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
  const tw = Math.max(ctx.measureText(dispName).width, ctx.measureText(lab).width);
  ctx.fillStyle = 'rgba(12,10,8,0.72)';
  ctx.fillRect(cw / 2 - tw / 2 - 14, ch * 0.045, tw + 28, 44);
  ctx.strokeStyle = 'rgba(230,210,170,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(cw / 2 - tw / 2 - 14, ch * 0.045, tw + 28, 44);
  ctx.fillStyle = '#f8f4e8';
  ctx.fillText(dispName, cw / 2, ch * 0.045 + 18);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#d8c8b0';
  ctx.fillText(lab, cw / 2, ch * 0.045 + 34);
}
