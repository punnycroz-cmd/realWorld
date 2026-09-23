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
  director: false,
  x: 0, y: 0,        // director position, meters
  _lastPawn: -1,
};
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
    }
  }
  if(e.code === 'KeyC' && SF_VIEW === 'street'){
    SF_CAM.director = !SF_CAM.director;
    if(SF_CAM.director){
      const v = VILLAGERS[inspectedPawnIdx];
      SF_CAM.x = v ? v.x / SF_PXM : 600;
      SF_CAM.y = v ? v.y / SF_PXM : 400;
      if(typeof showToast === 'function') showToast('🎬 DIRECTOR camera — WASD fly · R/F up/down · drag look');
    } else if(typeof showToast === 'function') showToast('Follow-cam');
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
    SF_CAM.h = clamp(SF_CAM.h * (e.deltaY > 0 ? 1.12 : 0.89), 0.5, 30);
    e.preventDefault();
  }, { passive: false });
}
if(SF_MODE && typeof document !== 'undefined'){
  const hb = document.getElementById('help-bar');
  if(hb) hb.innerHTML =
    '<span><kbd>V</kbd> Top/Street</span>' +
    '<span><kbd>Drag</kbd> Look</span>' +
    '<span><kbd>Q</kbd>/<kbd>E</kbd> Rotate</span>' +
    '<span><kbd>Scroll</kbd> Height</span>' +
    '<span><kbd>C</kbd> Director</span>' +
    '<span><kbd>WASD</kbd> Fly</span>' +
    '<span><kbd>R</kbd>/<kbd>F</kbd> Up/Down</span>';
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
  const cs = CS * cam.zoom;
  const wx0 = Math.floor((cam.x - cw / 2 / cam.zoom) / CS) - 1;
  const wx1 = Math.floor((cam.x + cw / 2 / cam.zoom) / CS) + 1;
  const wy0 = Math.floor((cam.y - ch / 2 / cam.zoom) / CS) - 1;
  const wy1 = Math.floor((cam.y + ch / 2 / cam.zoom) / CS) + 1;

  // 1. terrain
  for(let wy = wy0; wy <= wy1; wy++){
    for(let wx = wx0; wx <= wx1; wx++){
      const { c, i } = cellChunk(wx, wy);
      const spr = sfTerrainTile(wx, wy, c.tileType[i]);
      const sx = Math.round((wx * CS - cam.x) * cam.zoom + cw / 2);
      const sy = Math.round((wy * CS - cam.y) * cam.zoom + ch / 2);
      if(spr && spr.c) ctx.drawImage(spr.c, sx, sy, cs, cs);
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
        if(b.by1 - b.hPx < cam.y - ch / 2 / cam.zoom - 220 || b.by0 > cam.y + ch / 2 / cam.zoom + 64) continue;
        drawables.push({ kind: 'bld', y: b.by1, b });
      }
    }
  }
  for(const o of VILLAGE_OBJECTS){
    if(o.x < cam.x - cw / 2 / cam.zoom - 64 || o.x > cam.x + cw / 2 / cam.zoom + 64) continue;
    if(o.y < cam.y - ch / 2 / cam.zoom - 128 || o.y > cam.y + ch / 2 / cam.zoom + 32) continue;
    drawables.push({ kind: 'prop', y: o.y, o });
  }
  for(const v of VILLAGERS){
    if(v.inBuilding && v !== VILLAGERS[controlledPawnIdx]) continue;
    drawables.push({ kind: 'pawn', y: v.y, v });
  }
  drawables.sort((a, b) => a.y - b.y);

  for(const d of drawables){
    if(d.kind === 'bld'){
      const b = d.b;
      const art = getSfBldArt(b.i);
      const sx = Math.round((b.bx0 - cam.x) * cam.zoom + cw / 2 - art.ox * cam.zoom);
      const sy = Math.round((b.by0 - cam.y) * cam.zoom + ch / 2 - art.oy * cam.zoom);
      ctx.drawImage(art.c, sx, sy, art.c.width * cam.zoom, art.c.height * cam.zoom);
      if(cam.zoom >= 0.9 && b.name){
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const lx = Math.round((b.x - cam.x) * cam.zoom + cw / 2);
        const ly = Math.round((b.by0 - b.hPx - cam.y) * cam.zoom + ch / 2 - 8);
        const tw = ctx.measureText(b.name).width;
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.fillRect(lx - tw / 2 - 4, ly - 11, tw + 8, 14);
        ctx.fillStyle = '#fef08a';
        ctx.fillText(b.name, lx, ly);
      }
    } else if(d.kind === 'prop'){
      const o = d.o, V = PA.sfVeg;
      let spr = null;
      if(o.kind === 'sfTree') spr = V.tree[Math.abs(hash2(o.wx, o.wy, 7) * 3) | 0];
      else if(o.kind === 'sfPalm') spr = V.palm[Math.abs(hash2(o.wx, o.wy, 8) * 2) | 0];
      else if(o.kind === 'sfBench') spr = V.bench;
      else if(o.kind === 'sfLamp') spr = isNight() ? V.lampOn : V.lampOff;
      const sprC = spr && (spr.c || spr);
      if(sprC){
        const sx = Math.round((o.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round((o.y - cam.y) * cam.zoom + ch / 2);
        const pw = sprC.width * cam.zoom, ph = sprC.height * cam.zoom;
        ctx.drawImage(sprC, sx - pw / 2, sy - ph + 4 * cam.zoom, pw, ph);
      }
    } else {
      renderChibiPawn(d.v, cw, ch);
    }
  }

  // 3. street name labels along road midpoints
  if(cam.zoom >= 0.85){
    ctx.textAlign = 'center';
    for(const r of SF_MAP.roads){
      const px = r.x * SF_PXM, py = r.y * SF_PXM;
      if(px < cam.x - cw / 2 / cam.zoom || px > cam.x + cw / 2 / cam.zoom) continue;
      if(py < cam.y - ch / 2 / cam.zoom || py > cam.y + ch / 2 / cam.zoom) continue;
      const sx = Math.round((px - cam.x) * cam.zoom + cw / 2);
      const sy = Math.round((py - cam.y) * cam.zoom + ch / 2);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(r.angle * Math.PI / 180);
      ctx.font = '600 9px sans-serif';
      ctx.strokeStyle = 'rgba(20,20,24,0.8)'; ctx.lineWidth = 3;
      ctx.strokeText(r.name, 0, 0);
      ctx.fillStyle = 'rgba(240,238,230,0.92)';
      ctx.fillText(r.name, 0, 0);
      ctx.restore();
    }
  }
}

/* ---------------- street-level "Truman camera" ---------------- */
function sfRenderStreet(cw, ch){
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
      // pawn switched while in street view: recenter yaw on the new subject
      SF_CAM.yaw = sfCamYawOf(v); SF_CAM._lastPawn = inspectedPawnIdx;
    }
  }

  const camX = SF_CAM.director ? SF_CAM.x : (v ? v.x / SF_PXM : 600);
  const camY = SF_CAM.director ? SF_CAM.y : (v ? v.y / SF_PXM : 400);
  const camH = SF_CAM.h;
  const DX = Math.cos(SF_CAM.yaw), DY = Math.sin(SF_CAM.yaw);
  const F = Math.max(400, ch * 1.1);
  const horizon = ch * 0.42 + Math.tan(SF_CAM.pitch) * F;
  const pr = (x, y, z) => {
    const dx = x - camX, dy = y - camY;
    const fwd = dx * DX + dy * DY;
    const side = dx * DY - dy * DX;
    if(fwd < 0.5) return null;
    return [cw / 2 + side * F / fwd, horizon + (camH - z) * F / fwd, fwd];
  };

  // sky + light by tod/weather
  const night = isNight();
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  if(night){ sky.addColorStop(0, '#101626'); sky.addColorStop(1, '#2a3350'); }
  else if(W.rain > 0.2){ sky.addColorStop(0, '#6a7688'); sky.addColorStop(1, '#a8b2bc'); }
  else { sky.addColorStop(0, '#5b8fc9'); sky.addColorStop(1, '#cfe3f2'); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, cw, horizon);
  ctx.fillStyle = night ? '#2e2a28' : '#7d8a70';
  ctx.fillRect(0, horizon, cw, ch - horizon);

  // ground tiles far -> near
  const COLS = { 10: '#50555e', 11: '#bdb7ac', 12: '#7a7268', 13: '#6cae52',
                 14: '#bdb7ac', 15: '#d0b78e', 16: '#8a8f98', 0: '#a8977a' };
  const cells = [];
  for(let gy = 0; gy < SF_M.gh; gy++){
    for(let gx = 0; gx < SF_M.gw; gx++){
      const t = SF_GRID[gy * SF_M.gw + gx];
      if(!t) continue;
      const wxm = gx * cm, wym = gy * cm;
      const ddx = wxm - camX, ddy = wym - camY;
      const fwd = ddx * DX + ddy * DY;
      if(fwd < 0.5 || fwd > 240) continue;
      if(Math.abs(ddx * DY - ddy * DX) > fwd * 1.3 + 30) continue;
      cells.push([wxm, wym, fwd, t]);
    }
  }
  cells.sort((a, b) => b[2] - a[2]);
  for(const [wxm, wym, , t] of cells){
    const c = cm;
    const p1 = pr(wxm, wym, 0), p2 = pr(wxm + c, wym, 0),
          p3 = pr(wxm + c, wym + c, 0), p4 = pr(wxm, wym + c, 0);
    if(!p1 || !p2 || !p3 || !p4) continue;
    ctx.fillStyle = COLS[t] || '#a8977a';
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]);
    ctx.closePath(); ctx.fill();
    if(t === 16){ // zebra hint in perspective
      ctx.fillStyle = 'rgba(232,230,223,0.55)';
      ctx.beginPath();
      ctx.moveTo((p1[0] + p2[0]) / 2, p1[1]); ctx.lineTo((p3[0] + p4[0]) / 2, p3[1]);
      ctx.lineTo(p4[0], p4[1]); ctx.lineTo(p1[0], p1[1]); ctx.fill();
    }
  }

  // drawables: buildings, props, pawns — far -> near
  const ds = [];
  for(const b of SF_BLD){
    const bxm = b.x / SF_PXM, bym = b.y / SF_PXM;
    const ddx = bxm - camX, ddy = bym - camY;
    const fwd = ddx * DX + ddy * DY, side = Math.abs(ddx * DY - ddy * DX);
    if(fwd > 0.3 && fwd < 260 && side < fwd * 1.6 + 60) ds.push({ k: 'b', fwd, b });
  }
  for(const o of VILLAGE_OBJECTS){
    const ox = o.x / SF_PXM, oy = o.y / SF_PXM;
    const ddx = ox - camX, ddy = oy - camY;
    const fwd = ddx * DX + ddy * DY, side = Math.abs(ddx * DY - ddy * DX);
    if(fwd > 0.5 && fwd < 120 && side < fwd * 1.4 + 20) ds.push({ k: 'p', fwd, o });
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
      const i = b.i;
      const wallBase = SF_WALL_COLS[Math.floor(phash(i, 7, 1300) * SF_WALL_COLS.length)];
      const TRIM = SF_TRIM_COLS[Math.floor(phash(i, 9, 1301) * SF_TRIM_COLS.length)];
      const h = b.hPx / SF_PXM * (SF_PXM / 4.2) / SF_PXM; // meters: hPx/4.2
      const hm = b.hPx / 4.2;
      const n = b.px.length;
      const P = b.px.map(q => [q[0] / SF_PXM, q[1] / SF_PXM]);
      let area = 0;
      for(let e = 0; e < n; e++){
        const [x1, y1] = P[e], [x2, y2] = P[(e + 1) % n];
        area += (x2 - x1) * (y2 + y1);
      }
      const ccw = area > 0;
      for(let e = 0; e < n; e++){
        const [x1, y1] = P[e], [x2, y2] = P[(e + 1) % n];
        const ex = x2 - x1, ey = y2 - y1, L = Math.hypot(ex, ey) || 1;
        let nx = ey / L, ny = -ex / L;
        if(ccw){ nx = -nx; ny = -ny; }
        const facingCam = (nx * -DX + ny * -DY) > 0.05; // wall faces camera
        if(!facingCam) continue;
        const g1 = pr(x1, y1, 0), g2 = pr(x2, y2, 0),
              t1 = pr(x1, y1, hm), t2 = pr(x2, y2, hm);
        if(!g1 || !g2 || !t1 || !t2) continue;
        const lit = 0.55 + 0.45 * Math.max(0, nx * -0.5 + ny * -0.85);
        const wallC = shade(wallBase, lit * (night ? 0.4 : 1));
        ctx.fillStyle = wallC;
        ctx.beginPath();
        ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
        ctx.lineTo(t2[0], t2[1]); ctx.lineTo(t1[0], t1[1]);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(20,16,12,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        // cornice line at top
        ctx.strokeStyle = TRIM; ctx.lineWidth = Math.max(1, F * 0.02 / g1[2]);
        ctx.beginPath(); ctx.moveTo(t1[0], t1[1]); ctx.lineTo(t2[0], t2[1]); ctx.stroke();
        // windows: spaced along the wall, per floor
        const floors = Math.max(1, Math.round(hm / 3));
        const bays = Math.max(1, Math.floor(L / 2.6));
        for(let f = 0; f < floors; f++){
          const z = hm * (f + 0.62) / (floors + 0.3);
          for(let k = 0; k < bays; k++){
            const tt = (k + 0.5) / bays;
            const wxm = x1 + ex * tt, wym = y1 + ey * tt;
            const pb = pr(wxm, wym, z - 0.6), pt = pr(wxm, wym, z + 0.9);
            if(!pb || !pt) continue;
            const wh = pb[1] - pt[1], ww = wh * 0.55;
            if(ww < 1.5) continue;
            ctx.fillStyle = night && phash(k, f, i) < 0.5 ? '#ffd98a' : '#6a8494';
            // capsule window
            ctx.beginPath();
            const r = ww / 2;
            ctx.moveTo(pb[0] - r, pb[1]);
            ctx.lineTo(pb[0] - r, pt[1] + r);
            ctx.arc(pb[0], pt[1] + r, r, Math.PI, 0, true);
            ctx.lineTo(pb[0] + r, pb[1]);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = TRIM; ctx.lineWidth = Math.max(0.5, ww * 0.12);
            ctx.stroke();
          }
        }
        // door + awning on ground floor of named shops
        if(b.name){
          const mt = 0.5;
          const dxm = x1 + ex * mt, dym = y1 + ey * mt;
          const db = pr(dxm, dym, 0), dt = pr(dxm, dym, 2.4);
          if(db && dt){
            const dw = (db[1] - dt[1]) * 0.45;
            ctx.fillStyle = '#3a2a20';
            ctx.fillRect(db[0] - dw / 2, dt[1], dw, db[1] - dt[1]);
            const ab = pr(dxm, dym, 2.6);
            if(ab){
              ctx.fillStyle = '#c9483c';
              ctx.beginPath();
              ctx.moveTo(ab[0] - dw, ab[1]); ctx.lineTo(ab[0] + dw, ab[1]);
              ctx.lineTo(ab[0] + dw * 1.15, ab[1] + dw * 0.3);
              ctx.lineTo(ab[0] - dw * 1.15, ab[1] + dw * 0.3);
              ctx.closePath(); ctx.fill();
              ctx.fillStyle = '#f8f4e8';
              ctx.font = `bold ${Math.max(7, dw * 0.32)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText(b.name.slice(0, 20), ab[0], ab[1] - 2);
            }
          }
        }
      }
      // roof cap
      ctx.fillStyle = night ? '#2a2624' : '#5d5850';
      ctx.beginPath();
      let started = false;
      for(const [x, y] of P){
        const p = pr(x, y, hm);
        if(p){ started ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); started = true; }
      }
      if(started){ ctx.closePath(); ctx.fill(); }
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
      let spr = null, hm = 5;
      if(o.kind === 'sfTree'){ spr = V.tree[Math.abs(hash2(o.wx, o.wy, 7) * 3) | 0]; hm = 4.4; }
      else if(o.kind === 'sfPalm'){ spr = V.palm[Math.abs(hash2(o.wx, o.wy, 8) * 2) | 0]; hm = 6.4; }
      else if(o.kind === 'sfBench'){ spr = V.bench; hm = 0.9; }
      else if(o.kind === 'sfLamp'){ spr = night ? V.lampOn : V.lampOff; hm = 4.5; }
      const sprC = spr && (spr.c || spr);
      if(sprC){
        const ph = hm * sc, pw = ph * (sprC.width / sprC.height);
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

  // DIRECTOR badge while free-fly camera is active
  if(SF_CAM.director){
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    const label = '◉ DIRECTOR';
    const bw = ctx.measureText(label).width + 22;
    ctx.fillStyle = 'rgba(120,20,20,0.85)';
    ctx.fillRect(cw / 2 - bw / 2, 12, bw, 22);
    ctx.strokeStyle = 'rgba(255,180,120,0.8)'; ctx.lineWidth = 1;
    ctx.strokeRect(cw / 2 - bw / 2, 12, bw, 22);
    ctx.fillStyle = '#ffe9c9';
    ctx.fillText(label, cw / 2, 27);
  }
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
