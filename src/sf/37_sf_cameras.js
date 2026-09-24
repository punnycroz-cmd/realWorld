/* =====================================================================
   PART 37 — SF MULTI-CAMERA RIG (production-1)

   Camera state is PER VIEWER / PER VIEW: a view record holds its own
   framing (position, zoom, follow target, lens pose) — one spectator's
   camera never touches another's, and secondary views never disturb the
   main screen.

   renderWorld() draws through globals (ctx, cv, cam, SF_CAM, SF_VIEW,
   inspectedPawnIdx, dpr): sfCamRender swaps them in, renders one frame,
   restores. SF_CAM_FREE pins a free/preset framing so renderWorld's
   follow-lerp can't hijack it. Both modes work: 'top' (diorama — cam
   x/y/zoom in world px) and 'street' (Truman cam — SF_CAM in meters,
   director = free-fly, otherwise third-person follow of `follow`).

   view = { id, label, mode:'top'|'street', free:bool,
            follow:pawnIdx|null, cam:{x,y,zoom},
            sfCam:{director,x,y,h,yaw,pitch,fov,back}, dpr }
   ===================================================================== */

let SF_CAM_FREE = false;   // renderWorld reads this to skip follow-lerp

const SF_CAM_VIEWS = {};   // id -> live view record (persisted rig state)
let SF_CAM_SEQ = 0;

/* named presets — world coordinates: top-mode cam.x/y are world px
   (cells * CS), street sfCam.x/y are map meters. Dolores Park runs
   cy 131..297 (~262-594m); Haus Coffee sits at (1327, 1256)m. */
const SF_CAM_PRESETS = {
  /* v61: the overlook now frames the CITY park, not a meadow — centered
     on the park's true centroid (303,262) at zoom 0.24 so the perimeter
     streets, the palm allées, and two full rows of facades ring the
     lawn in every shot (art-feedback: "reads as wilderness") */
  dolores_overlook: { label: 'Dolores Park overlook',
    mode: 'top', free: true,
    cam: { x: 303 * CS, y: 262 * CS, zoom: 0.24 } },
  mission_street: { label: 'Street level — 18th & Guerrero',
    mode: 'street', free: true,
    // on the 18th St sidewalk, ~63m east of Haus Coffee's door (1332,1258),
    // looking west down the storefront row
    sfCam: { director: true, x: 1395, y: 1266, h: 1.7, yaw: -3.02,
             pitch: 0.02, fov: 1 } },
  rooftop_park: { label: 'Rooftop — over Dolores Park',
    mode: 'street', free: true,
    sfCam: { director: true, x: 615, y: 610, h: 22, yaw: -1.62,
             pitch: -0.30, fov: 1 } },
};

function sfCamPresets(){
  const out = {};
  for(const k in SF_CAM_PRESETS)
    out[k] = { label: SF_CAM_PRESETS[k].label, mode: SF_CAM_PRESETS[k].mode };
  return out;
}

/* resolve a follow target: pawn index, cast id, or display name */
function sfCamPawnIdx(ref){
  if(ref == null) return null;
  if(typeof ref === 'number') return (ref >= 0 && ref < VILLAGERS.length) ? ref : null;
  const v = sfPawnOf(ref);
  const i = v ? VILLAGERS.indexOf(v) : -1;
  return i >= 0 ? i : null;
}

/* create/register a view. spec: {id?, label?, preset?, mode, free,
   follow, cam:{x,y,zoom}, sfCam:{...}, dpr?} — preset merges first. */
function sfCamMake(spec){
  spec = spec || {};
  const base = spec.preset && SF_CAM_PRESETS[spec.preset]
    ? JSON.parse(JSON.stringify(SF_CAM_PRESETS[spec.preset])) : {};
  const view = {
    id: spec.id || ('view-' + (++SF_CAM_SEQ)),
    label: spec.label || base.label || spec.id || ('view ' + SF_CAM_SEQ),
    mode: spec.mode || base.mode || 'top',
    follow: spec.follow !== undefined ? sfCamPawnIdx(spec.follow) : null,
    cam: Object.assign({}, base.cam, spec.cam),
    sfCam: Object.assign({}, base.sfCam, spec.sfCam),
    dpr: spec.dpr || 1,
  };
  // a follow view defaults free:false so the lerp tracks the pawn; a
  // free/preset view defaults free:true so its framing stays put
  view.free = spec.free != null ? !!spec.free
    : (base.free != null ? !!base.free : view.follow == null);
  if(view.mode === 'street' && !view.sfCam.director && view.follow == null)
    view.follow = inspectedPawnIdx;   // street follow needs a subject
  SF_CAM_VIEWS[view.id] = view;
  return view;
}

/* patch an existing view — the spectator's own camera moves freely */
function sfCamSet(id, patch){
  const view = SF_CAM_VIEWS[id];
  if(!view) return null;
  if(patch.cam) Object.assign(view.cam, patch.cam);
  if(patch.sfCam) Object.assign(view.sfCam, patch.sfCam);
  if(patch.mode) view.mode = patch.mode;
  if(patch.free != null) view.free = !!patch.free;
  if(patch.follow !== undefined) view.follow = sfCamPawnIdx(patch.follow);
  if(patch.label) view.label = patch.label;
  return view;
}

function sfCamDrop(id){ const v = SF_CAM_VIEWS[id]; delete SF_CAM_VIEWS[id]; return v || null; }

function sfCamList(){
  return Object.keys(SF_CAM_VIEWS).map(id => {
    const v = SF_CAM_VIEWS[id];
    const f = v.follow != null ? VILLAGERS[v.follow] : null;
    return { id: v.id, label: v.label, mode: v.mode, free: v.free,
             follow: f ? (f._castId || f.name) : null };
  });
}

/* Render one view into a 2d context (or a canvas element). Swaps the
   global render surface + camera state, renders, restores everything —
   the main viewer's frame is untouched. The view record persists the
   smoothed rig (_sx/_syaw/etc.) so follow-cam shots stay continuous
   across calls. Returns false when the world isn't up. */
function sfCamRender(id, target){
  const view = typeof id === 'string' ? SF_CAM_VIEWS[id] : id;
  if(!view || typeof renderWorld !== 'function') return false;
  const tctx = target && target.getContext ? target.getContext('2d')
             : (target && typeof target.fillRect === 'function' ? target : null);
  const tcv  = target && target.canvas ? target.canvas : target;
  if(!tctx || !tcv) return false;

  /* ---- save main globals ---- */
  const svCtx = ctx, svCv = cv, svDpr = dpr;
  const svView = SF_VIEW, svIdx = inspectedPawnIdx, svFree = SF_CAM_FREE;
  const svCam = { x: cam.x, y: cam.y, zoom: cam.zoom,
                  targetX: cam.targetX, targetY: cam.targetY };
  const svSf = {};
  for(const k in SF_CAM) svSf[k] = SF_CAM[k];
  const svKeys = (typeof keysDown !== 'undefined')
    ? Object.keys(keysDown).filter(k => keysDown[k]) : null;

  try{
    ctx = tctx; cv = tcv; dpr = view.dpr || 1;
    SF_VIEW = view.mode === 'street' ? 'street' : 'top';
    if(view.follow != null) inspectedPawnIdx = view.follow;
    Object.assign(cam, view.cam);
    Object.assign(SF_CAM, view.sfCam);
    if(view.mode === 'street') SF_CAM.director = !!view.sfCam.director;
    SF_CAM_FREE = !!view.free;
    if(!view._rigged){ SF_CAM._snap = true; view._rigged = true; }
    // a spectator's keys never steer a parked feed
    if(svKeys) for(const k of svKeys) keysDown[k] = false;
    renderWorld();
    /* persist rig state back into the view — follow-cam smoothing and
       director position stay continuous between renders */
    view.cam = { x: cam.x, y: cam.y, zoom: cam.zoom,
                 targetX: cam.targetX, targetY: cam.targetY };
    const keep = {};
    for(const k in SF_CAM) keep[k] = SF_CAM[k];
    view.sfCam = keep;
  } finally {
    ctx = svCtx; cv = svCv; dpr = svDpr;
    SF_VIEW = svView; inspectedPawnIdx = svIdx; SF_CAM_FREE = svFree;
    Object.assign(cam, svCam);
    for(const k in SF_CAM) delete SF_CAM[k];
    Object.assign(SF_CAM, svSf);
    if(svKeys) for(const k of svKeys) keysDown[k] = true;
  }
  return true;
}

/* tune the MAIN screen into a view — the spectator's own camera is the
   globals, so this copies framing in (per-viewer by construction). */
function sfCamWatch(id){
  const view = SF_CAM_VIEWS[id];
  if(!view) return null;
  if(view.mode === 'street'){
    SF_VIEW = 'street';
    Object.assign(SF_CAM, view.sfCam);
    SF_CAM.director = !!view.sfCam.director;
    if(view.follow != null) inspectedPawnIdx = view.follow;
    sfCamSnap();
  } else {
    SF_VIEW = 'top';
    if(view.follow != null){ inspectedPawnIdx = view.follow; SF_CAM_FREE = false; }
    else { Object.assign(cam, view.cam); SF_CAM_FREE = true; }
  }
  return { watching: view.id, label: view.label };
}

/* bridge surface for the production shell + playtest driver */
if(typeof window !== 'undefined'){
  window.__aiBridge = window.__aiBridge || {};
  window.__aiBridge.sfCamPresets = sfCamPresets;
  window.__aiBridge.sfCamMake = sfCamMake;
  window.__aiBridge.sfCamSet = sfCamSet;
  window.__aiBridge.sfCamDrop = sfCamDrop;
  window.__aiBridge.sfCamList = sfCamList;
  window.__aiBridge.sfCamRender = sfCamRender;
  window.__aiBridge.sfCamWatch = sfCamWatch;
}
