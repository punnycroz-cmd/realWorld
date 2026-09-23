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
        const sy = Math.round((o.y - cam.y) * cam.zoom + ch / 2);
        // v5: canopy cast shadow pushed down-right like the building sun
        if(shadeR && !isNight()){
          ctx.fillStyle = 'rgba(20,26,12,0.22)';
          ctx.beginPath();
          ctx.ellipse(sx + shadeR * 0.5 * cam.zoom, sy + shadeR * 0.28 * cam.zoom,
                      shadeR * cam.zoom, shadeR * 0.42 * cam.zoom, 0, 0, Math.PI * 2);
          ctx.fill();
        }
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
  const dim = night ? 0.4 : 1;
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
    if(dA && dB){
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
    const nB = Math.max(1, Math.floor(L / 3));
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

  const floors = Math.max(1, Math.round(hm / 3));
  // string courses between floors
  for(let f = 1; f < floors; f++){
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
    if(!isShop && phash(Math.round(wx * 13), Math.round(zB * 29), i + 1700) < 0.15){
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
    if(style === 0){ // italianate hood moulding + keystone
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
    const nStripe = Math.max(3, Math.floor((s1 - s0) * L / 1.1));
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
  if(!isShop && phash(i, ei, 1705) < 0.32){
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

  // distance haze toward the sky color
  const hz = night ? 0 : Math.min(0.4, Math.max(0, (fwd - 70) / 300));
  if(hz > 0.02){
    ctx.globalAlpha = hz; ctx.fillStyle = '#bcd4e6';
    ctx.beginPath();
    ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
    ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p1[0], p1[1]);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
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
  // v3: sun glow + drifting cumulus on clear days
  if(!night && W.rain <= 0.2){
    const sg = ctx.createRadialGradient(cw * 0.72, horizon * 0.18, 4,
                                        cw * 0.72, horizon * 0.18, cw * 0.3);
    sg.addColorStop(0, 'rgba(255,248,220,0.5)');
    sg.addColorStop(1, 'rgba(255,248,220,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, cw, horizon);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for(let k = 0; k < 4; k++){
      let cx = (phash(k, 3, 1500) * cw * 1.4 - SF_CAM.yaw * 160) % (cw * 1.2);
      if(cx < -120) cx += cw * 1.2;
      const cy = horizon * (0.10 + phash(k, 5, 1501) * 0.4);
      const cw2 = 40 + phash(k, 7, 1502) * 70;
      for(const [ox, oy, s] of [[0, 0, 1], [-0.5, 0.15, 0.7], [0.55, 0.1, 0.75], [0.15, -0.3, 0.6]]){
        ctx.beginPath();
        ctx.ellipse(cx + ox * cw2, cy + oy * cw2 * 0.35, cw2 * s, cw2 * s * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
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
      const hm = b.hPx / 4.2; // meters
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
        sfStreetWall(b, e, x1, y1, x2, y2, ex, ey, L, nx, ny, hm, pr, F, night, d.fwd);
      }
      // roof cap: per-building tar color + subtle sun shading + parapet lip
      const ROOF = rampOf(SF_ROOF_COLS[Math.floor(phash(b.i, 11, 1302) * SF_ROOF_COLS.length)]);
      const rpts = [];
      for(const [x, y] of P){
        const p = pr(x, y, hm);
        if(p) rpts.push(p);
      }
      if(rpts.length > 2){
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
      const roofAreaM = Math.abs(area); // P is in meters -> m²
      const nRoof = Math.min(5, Math.floor(roofAreaM / 55));
      let cxm = 0, cym = 0;
      for(const [x, y] of P){ cxm += x; cym += y; }
      cxm /= P.length; cym /= P.length;
      for(let k = 0; k < nRoof; k++){
        const e2 = P[Math.floor(phash(b.i, k, 1505) * P.length)];
        const t = 0.25 + phash(k, b.i, 1506) * 0.5;
        const fx = cxm + (e2[0] - cxm) * t, fy = cym + (e2[1] - cym) * t;
        const kind = Math.floor(phash(b.i, k, 1507) * 5);
        const base = pr(fx, fy, hm);
        if(!base || base[2] > 200) continue;
        const sc = F / base[2];
        ctx.strokeStyle = night ? '#1c1a18' : '#4a4540';
        ctx.fillStyle = night ? '#262220' : '#6a5f52';
        if(kind === 0 && roofAreaM > 110){
          // water tank: legs + banded barrel + cone cap
          const lb = pr(fx, fy, hm), lt = pr(fx, fy, hm + 1.4),
                tb = pr(fx, fy, hm + 1.4), tt = pr(fx, fy, hm + 3.4),
                tp = pr(fx, fy, hm + 4.2);
          if(!lb || !lt || !tb || !tt || !tp) continue;
          const rw = Math.max(3, 1.6 * sc);
          ctx.lineWidth = Math.max(1, 0.12 * sc);
          for(const off of [-0.7, 0.7]){
            const pl = pr(fx + off, fy, hm), pt2 = pr(fx + off * 0.6, fy, hm + 1.4);
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
          const pt2 = pr(fx, fy, hm + 0.9 + phash(k, b.i, 1508));
          if(!pt2) continue;
          ctx.lineWidth = Math.max(1.2, 0.14 * sc);
          ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(pt2[0], pt2[1]); ctx.stroke();
          ctx.fillStyle = night ? '#2a2725' : '#8a8478';
          ctx.beginPath(); ctx.ellipse(pt2[0], pt2[1], Math.max(1.5, 0.25 * sc), Math.max(0.8, 0.1 * sc), 0, 0, Math.PI * 2); ctx.fill();
        } else if(kind === 2){ // antenna mast + crossbars
          const pt2 = pr(fx, fy, hm + 3 + phash(k, b.i, 1509) * 2);
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
          const pt2 = pr(fx, fy, hm + 1.2);
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
