/* =====================================================================
   PART SF-2: SAN FRANCISCO ART PIPELINE
   Same pa-* native-pixel language as Willowbrook: ramps, dithering, blobs,
   ellipses, capsules — no flat rectangles, no placeholder fills.
   buildSfTerrain() / buildSfVeg() run at boot; building facades are
   compiled lazily per visible building into PA.sfBld.
   ===================================================================== */

/* ---------------- terrain tiles (32x32) ---------------- */
const SF_ASPH = null; // populated by rampOf at build time (avoids dup name)

function sfAsphaltTile(v){
  const s = paMk(32, 32), g = s.g;
  const A = rampOf('#565a63');
  paR(g, 0, 0, 32, 32, A[3]);
  paDithBayer(g, 0, 0, 32, 32, A[3], A[2], 0.25);
  paNoise(g, 0, 0, 32, 32, [A[2], A[4], A[1]], 0.20, 900 + v);
  // tar-snake cracks + repair patches
  for(let i = 0; i < 2; i++){
    const x0 = 3 + Math.floor(phash(i, v, 910) * 20), y0 = 3 + Math.floor(phash(v, i, 911) * 20);
    paLine(g, x0, y0, x0 + 6, y0 + 4, A[1]);
    paLine(g, x0 + 6, y0 + 4, x0 + 9, y0 + 2, A[1]);
  }
  if(v === 1){ // patched rectangle softened into a blobby repair
    paEllipse(g, 20, 18, 6, 4, A[2]);
    paEllipse(g, 20, 17, 5, 3, shade(A[2], 1.1));
  }
  if(v === 2){ // manhole: ring + inner disc + slots
    paEllipse(g, 16, 16, 5, 5, A[1]);
    paEllipse(g, 16, 16, 4, 4, A[2]);
    paEllipse(g, 16, 15, 3, 3, A[3]);
    paLine(g, 13, 15, 19, 15, A[1]); paLine(g, 13, 17, 19, 17, A[1]);
  }
  for(let i = 0; i < 6; i++) // oil specks
    paPX(g, Math.floor(phash(i, v, 920) * 30), Math.floor(phash(v, i, 921) * 30), A[0]);
  return s;
}
function sfLaneDashTile(vert){
  // asphalt base with a dashed center line
  const s = sfAsphaltTile(0), g = s.g;
  const paint = '#e8c95a', worn = '#b8a24a';
  if(vert){
    for(let y = 2; y < 30; y += 8){
      paR(g, 15, y, 2, 5, paint);
      if(phash(y, 3, 930) < 0.3) paR(g, 15, y + 3, 2, 2, worn); // worn paint
    }
  } else {
    for(let x = 2; x < 30; x += 8){
      paR(g, x, 15, 5, 2, paint);
      if(phash(x, 4, 931) < 0.3) paR(g, x + 3, 15, 2, 2, worn);
    }
  }
  return s;
}
function sfCrosswalkTile(vert){
  // zebra stripes: white capsule bars across the walking direction
  const s = sfAsphaltTile(0), g = s.g;
  const W = '#e8e6df', WD = '#c8c5ba';
  if(vert){ // walking north-south: bars are horizontal stripes
    for(let y = 2; y < 30; y += 6){
      paR(g, 3, y, 26, 3, W);
      paR(g, 3, y + 2, 26, 1, WD);
    }
  } else {
    for(let x = 2; x < 30; x += 6){
      paR(g, x, 3, 3, 26, W);
      paR(g, x + 2, 3, 1, 26, WD);
    }
  }
  paNoise(g, 0, 0, 32, 32, [WD], 0.04, 940);
  return s;
}
/* sidewalk: warm concrete, expansion seams, curb on street-adjacent sides.
   mask bits: 1=N 2=S 4=W 8=E neighbor IS street (curb drawn there) */
function sfSidewalkTile(m){
  const s = paMk(32, 32), g = s.g;
  const C = rampOf('#bdb7ac');
  paR(g, 0, 0, 32, 32, C[3]);
  paDithBayer(g, 0, 0, 32, 32, C[3], C[4], 0.18);
  paNoise(g, 0, 0, 32, 32, [C[2], C[4], C[1]], 0.14, 950 + m);
  // expansion seams
  paLine(g, 0, 15, 32, 15, C[2]); paLine(g, 15, 0, 15, 32, C[2]);
  paLine(g, 0, 16, 32, 16, C[4]); paLine(g, 16, 0, 16, 32, C[4]);
  // gum spots + stains
  for(let i = 0; i < 5; i++){
    const gx = 2 + Math.floor(phash(i, m, 960) * 28), gy = 2 + Math.floor(phash(m, i, 961) * 28);
    paPX(g, gx, gy, C[1]); if(phash(i, m, 962) < 0.4) paPX(g, gx + 1, gy, C[2]);
  }
  const curb = (x, y, w, h, key) => {
    paR(g, x, y, w, h, C[5]);                       // curb top light
    paR(g, x + (w === 32 ? 0 : (x === 0 ? 2 : 0)),
          y + (h === 32 ? 0 : (y === 0 ? 2 : 0)),
          w === 32 ? w : 2, h === 32 ? h : 2, C[1]); // gutter shadow line
    paNoise(g, x, y, w, h, [C[2]], 0.2, key);
  };
  if(m & 1) curb(0, 0, 32, 3, 970 + m);
  if(m & 2) curb(0, 29, 32, 3, 980 + m);
  if(m & 4) curb(0, 0, 3, 32, 990 + m);
  if(m & 8) curb(29, 0, 3, 32, 1000 + m);
  return s;
}
function sfParkGrassTile(v){
  const s = paMk(32, 32), g = s.g;
  const G = rampOf('#6cae52'); // lusher watered-park green
  paR(g, 0, 0, 32, 32, G[3]);
  // mowing stripes
  paDithBayer(g, 0, v % 2 ? 0 : 8, 32, 8, G[3], G[4], 0.30);
  paNoise(g, 0, 0, 32, 32, [G[2], G[4], G[1]], 0.16, 1010 + v);
  tBlades(g, 12, 1020 + v, [G[4], G[5], G[3]]);
  if(v === 1){ // clover patch
    for(let i = 0; i < 4; i++){
      const cx = 4 + Math.floor(phash(i, v, 1030) * 24), cy = 4 + Math.floor(phash(v, i, 1031) * 24);
      paBlob(g, cx, cy, 1.6, G[2]); paPX(g, cx, cy - 1, G[5]);
    }
  }
  if(v === 2){ // worn picnic patch
    paDithBayer(g, 8, 10, 14, 10, G[3], rampOf('#a89a5a')[3], 0.35);
  }
  return s;
}
function sfParkPathTile(m){
  const s = paMk(32, 32), g = s.g;
  const T = rampOf('#d0b78e'); // decomposed granite tan
  paR(g, 0, 0, 32, 32, T[3]);
  paDithBayer(g, 3, 3, 26, 26, T[3], T[4], 0.3);
  paNoise(g, 0, 0, 32, 32, [T[2], T[4], T[1]], 0.18, 1040 + m);
  tPebbles(g, 3, 1050 + m, MAT.stoneWarm);
  // grass creep on non-path sides (same mask convention as tPathTile)
  const gr = MAT.grass;
  const rim = (x, y, w, h, key) => {
    paDithBayer(g, x, y, w, h, T[3], T[2], 0.55);
    paNoise(g, x, y, w, h, [gr[2]], 0.30, key);
  };
  if(!(m & 1)) rim(0, 0, 32, 4, 1060 + m);
  if(!(m & 2)) rim(0, 28, 32, 4, 1070 + m);
  if(!(m & 4)) rim(0, 0, 4, 32, 1080 + m);
  if(!(m & 8)) rim(28, 0, 4, 32, 1090 + m);
  return s;
}
function sfLotTile(v){
  // vacant/open ground: weedy dirt — for tileType 0 inside the city
  const s = paMk(32, 32), g = s.g;
  const D = rampOf('#a8977a');
  paR(g, 0, 0, 32, 32, D[3]);
  paDithBayer(g, 0, 0, 32, 32, D[3], MAT.grass[3], 0.30);
  paNoise(g, 0, 0, 32, 32, [D[2], MAT.grass[2], MAT.grass[4]], 0.22, 1100 + v);
  tBlades(g, 8, 1110 + v, [MAT.grass[3], MAT.grass[2]]);
  tPebbles(g, 3, 1120 + v, MAT.stone);
  return s;
}
function sfPoiTile(){
  // POI marker cell: sidewalk base + painted brass dot
  const s = sfSidewalkTile(0), g = s.g;
  paEllipse(g, 16, 16, 4, 4, '#8a6a20');
  paEllipse(g, 16, 15, 3, 3, '#e8c95a');
  paPX(g, 15, 14, '#fff0b8');
  return s;
}

function buildSfTerrain(){
  const T = PA.sf = PA.sf || {};
  T.street = [sfAsphaltTile(0), sfAsphaltTile(1), sfAsphaltTile(2)];
  T.laneV = sfLaneDashTile(true);
  T.laneH = sfLaneDashTile(false);
  T.crossV = sfCrosswalkTile(true);
  T.crossH = sfCrosswalkTile(false);
  T.sidewalk = [];
  for(let m = 0; m < 16; m++) T.sidewalk.push(sfSidewalkTile(m));
  T.park = [sfParkGrassTile(0), sfParkGrassTile(1), sfParkGrassTile(2)];
  T.parkpath = [];
  for(let m = 0; m < 16; m++) T.parkpath.push(sfParkPathTile(m));
  T.lot = [sfLotTile(0), sfLotTile(1)];
  T.poi = sfPoiTile();
}

/* ---------------- vegetation & street furniture ---------------- */
function sfLeafyTree(v){
  // broad blob-canopy park tree: layered ellipses over a forked trunk
  const s = paMk(56, 64), g = s.g;
  const tr = MAT.trunk, lf = MAT.leaf, ld = MAT.leafDeep;
  paLine(g, 27, 60, 27, 40, tr[2]);
  paLine(g, 28, 60, 28, 40, tr[3]);
  paLine(g, 27, 44, 20, 36, tr[2]); paLine(g, 28, 44, 36, 34, tr[2]);
  paLine(g, 27, 48, 22, 42, tr[3]); paLine(g, 28, 48, 33, 42, tr[3]);
  const blobs = v === 0
    ? [[28, 26, 17, 12], [16, 33, 10, 8], [40, 32, 10, 8], [28, 16, 11, 8], [22, 22, 9, 7], [34, 21, 8, 6]]
    : v === 1
    ? [[28, 28, 15, 11], [15, 32, 9, 7], [41, 33, 9, 7], [26, 17, 10, 8], [35, 20, 8, 6]]
    : [[28, 24, 18, 13], [14, 31, 9, 8], [42, 30, 9, 8], [28, 13, 10, 7]];
  for(const [bx, by, rx, ry] of blobs) paEllipse(g, bx, by, rx, ry, ld[2]);
  for(const [bx, by, rx, ry] of blobs) paEllipse(g, bx, by - 1, rx - 1, ry - 1, lf[3]);
  for(const [bx, by, rx, ry] of blobs)
    paEllipse(g, bx - rx * 0.25, by - ry * 0.45, rx * 0.55, ry * 0.45, lf[4]);
  paNoise(g, 8, 4, 40, 40, [lf[5], lf[2]], 0.10, 1200 + v);
  paEllipse(g, 20, 12, 5, 3, lf[5]); // key light catch
  return s;
}
function sfPalmTree(v){
  // Mission palm: curved trunk + radiating drooping fronds
  const s = paMk(56, 72), g = s.g;
  const tr = rampOf('#9a7a4e'), lf = rampOf('#4e9a44'), ld = rampOf('#357030');
  const lean = v === 0 ? 3 : -3;
  for(let y = 0; y < 40; y++){
    const x = 28 + Math.round(lean * (y / 40) * (y / 40)) - lean;
    paPX(g, x, 68 - y, tr[3]); paPX(g, x + 1, 68 - y, tr[2]);
    if(y % 5 === 0) paPX(g, x, 68 - y, tr[4]);
  }
  const tx = 28 + Math.round(lean * 0.8) - lean, ty = 28;
  paEllipse(g, tx, ty + 2, 3, 3, tr[2]); // crown nut cluster
  paBlob(g, tx - 2, ty + 4, 1.6, '#6b4a26'); paBlob(g, tx + 2, ty + 4, 1.6, '#6b4a26');
  for(let f = 0; f < 9; f++){
    const ang = -Math.PI * 0.05 - f * (Math.PI * 0.9 / 8);
    const fx = Math.cos(ang), fy = Math.sin(ang);
    const len = 15 + (f % 3) * 3;
    const col = f % 2 ? lf[3] : lf[2];
    for(let k = 1; k <= len; k++){
      const px = Math.round(tx + fx * k), py = Math.round(ty + fy * k + k * k * 0.045);
      paPX(g, px, py, col);
      if(k % 3 === 0) paPX(g, px, py + 1, ld[2]);
    }
    // frond tip highlight
    const px = Math.round(tx + fx * len), py = Math.round(ty + fy * len + len * len * 0.045);
    paPX(g, px, py, lf[5]);
  }
  return s;
}
function sfBenchSpr(){
  const s = paMk(36, 22), g = s.g;
  const wd = MAT.wood, ir = MAT.ironDark;
  paEllipse(g, 18, 19, 15, 2.5, 'rgba(24,18,10,0.3)'); // shadow
  for(const lx of [6, 29]){ // iron legs (rounded)
    paR(g, lx, 12, 3, 8, ir[2]); paEllipse(g, lx + 1, 20, 3, 1.5, ir[3]);
  }
  for(let i = 0; i < 3; i++){ // seat slats
    paR(g, 3, 9 + i * 3, 30, 2, wd[3]);
    paR(g, 3, 9 + i * 3, 30, 1, wd[4]);
  }
  for(let i = 0; i < 3; i++){ // back slats
    paR(g, 3, 1 + i * 3, 30, 2, wd[3]);
    paR(g, 3, 1 + i * 3, 30, 1, wd[5]);
  }
  paR(g, 3, 0, 2, 12, ir[3]); paR(g, 31, 0, 2, 12, ir[3]); // armrest posts
  paEllipse(g, 4, 1, 2, 2, ir[4]); paEllipse(g, 32, 1, 2, 2, ir[4]);
  return s;
}
function sfLampSpr(on){
  const s = paMk(18, 58), g = s.g;
  const ir = MAT.ironDark;
  paEllipse(g, 9, 56, 7, 2, 'rgba(24,18,10,0.3)');
  paEllipse(g, 9, 54, 4, 2, ir[3]);
  paR(g, 8, 14, 2, 40, ir[3]);
  paR(g, 8, 14, 1, 40, ir[4]);
  paR(g, 6, 30, 6, 2, ir[2]); // ladder bar
  // acorn globe
  paEllipse(g, 9, 11, 5, 6, on ? MAT.glowCore : '#d8dcd2');
  paEllipse(g, 9, 12, 4, 4, on ? MAT.glow : '#c0c4ba');
  paR(g, 5, 5, 8, 2, ir[3]); paEllipse(g, 9, 5, 4, 2, ir[2]);
  paPX(g, 7, 8, on ? '#ffffff' : '#eef0e8');
  if(on){ paBlob(g, 9, 11, 8, 'rgba(255,217,138,0.18)'); }
  return s;
}
function buildSfVeg(){
  const V = PA.sfVeg = PA.sfVeg || {};
  V.tree = [sfLeafyTree(0), sfLeafyTree(1), sfLeafyTree(2)];
  V.palm = [sfPalmTree(0), sfPalmTree(1)];
  V.bench = sfBenchSpr();
  V.lampOff = sfLampSpr(false);
  V.lampOn = sfLampSpr(true);
}

/* ---------------- Victorian facade compiler ----------------
   One offscreen canvas per building (lazy). Canvas space: origin at the
   footprint's (bx0, by0) base corner; walls drawn below their roof line,
   roof polygon drawn at top (shifted -hPx). Anchored so that blitting at
   (bx0 - ox, by0 - hPx - oy) lands the base exactly on the footprint. */
const SF_WALL_COLS = [
  '#e8b4b8', '#b8d4e8', '#f2e0b8', '#c8e0c0', '#e0c8e8', '#f4ede0',
  '#d4a94a', '#e8907a', '#9ab8c8', '#c8b8a8', '#a8c8b0', '#d8a8b8',
  '#e8d8c0', '#b0c8e0', '#dcc8a0', '#c0a890', '#90a8b8', '#e0b890',
];
const SF_TRIM_COLS = ['#f8f4e8', '#4a3a30', '#2e4a5a', '#7a3a30', '#f0e0c0'];
const SF_ROOF_COLS = ['#6b6560', '#7a7268', '#5d5a55', '#84786a',
                      '#8a6a52', '#74584a', '#5f6e62', '#707a84'];

function sfBldCanvas(b){
  const pad = 16;
  const wPx = Math.ceil(b.bx1 - b.bx0) + pad * 2;
  const hBase = Math.ceil(b.by1 - b.by0);
  const hPx = Math.ceil(b.hPx);
  const cH = hBase + hPx + pad * 2;
  const S = paMk(wPx, cH), g = S.g;
  const key = b.key || 1;
  const wallBase = SF_WALL_COLS[Math.floor(phash(b.i, 7, 1300) * SF_WALL_COLS.length)];
  const W = rampOf(wallBase);
  const TRIM = SF_TRIM_COLS[Math.floor(phash(b.i, 9, 1301) * SF_TRIM_COLS.length)];
  const ROOF = rampOf(SF_ROOF_COLS[Math.floor(phash(b.i, 11, 1302) * SF_ROOF_COLS.length)]);
  const isShop = !!(b.name) || phash(b.i, 5, 1303) < 0.12;
  const nFloors = Math.max(1, Math.round(b.hPx / 16));
  // local coords: poly px relative to bx0/by0, then +pad; base bottom at
  // canvas y = pad + hPx + (py - by0)
  const P = b.px.map(q => [q[0] - b.bx0 + pad, q[1] - b.by0 + pad + hPx]);
  const n = P.length;
  // signed area for winding
  let area = 0;
  for(let i = 0; i < n; i++){
    const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % n];
    area += (x2 - x1) * (y2 + y1);
  }
  const ccw = area > 0; // y-down coords: ccw>0 means outward normal flips
  function edgeOutward(x1, y1, x2, y2){
    const ex = x2 - x1, ey = y2 - y1, L = Math.hypot(ex, ey) || 1;
    // edge direction (ex,ey); two normals: (ey,-ex) and (-ey,ex)
    let nx = ey / L, ny = -ex / L;
    if(ccw) { nx = -nx; ny = -ny; }
    return [nx, ny];
  }
  const wallAt = (x1, y1, x2, y2, t, f) =>
    [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t - hPx * f];

  // pass 0: cast shadow on the pavement — footprint pushed away from the sun
  const shx = hPx * 0.20, shy = hPx * 0.12;
  for(const [mul, al] of [[1.6, 0.10], [1.0, 0.18]]){
    g.fillStyle = `rgba(26,19,10,${al})`;
    g.beginPath();
    P.forEach(([x, y], i2) => i2
      ? g.lineTo(x + shx * mul, y + shy * mul)
      : g.moveTo(x + shx * mul, y + shy * mul));
    g.closePath(); g.fill();
  }

  // pass 1: walls (south + side), far(north) walls skipped
  const wallFaces = [];
  for(let i = 0; i < n; i++){
    const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % n];
    const [nx, ny] = edgeOutward(x1, y1, x2, y2);
    const facing = ny > 0.35 ? 'front' : (ny > -0.35 ? 'side' : 'back');
    if(facing === 'back') continue;
    wallFaces.push({ i, x1, y1, x2, y2, facing, len: Math.hypot(x2 - x1, y2 - y1) });
  }
  for(const w of wallFaces){
    const shadeF = w.facing === 'front' ? 1.0 : 0.82;
    const wr = W.map(c => shade(c, shadeF));
    g.fillStyle = wr[3];
    g.beginPath();
    g.moveTo(w.x1, w.y1); g.lineTo(w.x2, w.y2);
    g.lineTo(w.x2, w.y2 - hPx); g.lineTo(w.x1, w.y1 - hPx);
    g.closePath(); g.fill();
    // subtle plaster mottling clipped to the wall
    g.save();
    g.beginPath();
    g.moveTo(w.x1, w.y1); g.lineTo(w.x2, w.y2);
    g.lineTo(w.x2, w.y2 - hPx); g.lineTo(w.x1, w.y1 - hPx);
    g.closePath(); g.clip();
    paNoise(g, Math.min(w.x1, w.x2), Math.min(w.y1, w.y2) - hPx,
            Math.abs(w.x2 - w.x1) + 1, hPx + Math.abs(w.y2 - w.y1) + 1,
            [wr[2], wr[4]], 0.07, 1310 + w.i);
    // cornice: bright trim band + dentil bumps along the top
    const steps = Math.max(1, Math.floor(w.len / 7));
    for(let k = 0; k <= steps; k++){
      const [cx, cy] = wallAt(w.x1, w.y1, w.x2, w.y2, k / steps, 1);
      paEllipse(g, cx, cy + 1, 2, 2, TRIM);
    }
    g.strokeStyle = TRIM; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w.x1, w.y1 - hPx); g.lineTo(w.x2, w.y2 - hPx); g.stroke();
    // second trim band under cornice
    g.strokeStyle = shade(TRIM, 0.85); g.lineWidth = 1;
    g.beginPath();
    g.moveTo(w.x1, w.y1 - hPx + 4); g.lineTo(w.x2, w.y2 - hPx + 4); g.stroke();
    // windows per floor: capsule sashes with arched tops + sills
    const bays = Math.max(1, Math.floor(w.len / 22));
    for(let f = 0; f < nFloors; f++){
      const fv = 1 - (f + 0.72) / (nFloors + 0.4); // vertical band for floor f
      for(let k = 0; k < bays; k++){
        const t = (k + 0.5) / bays;
        const [wx, wy] = wallAt(w.x1, w.y1, w.x2, w.y2, t, fv);
        const frameC = TRIM, glassC = '#7a94a8', glassHi = '#c8d8e4';
        // sill
        paR(g, wx - 5, wy + 5, 10, 2, frameC);
        // capsule window: rounded top arch + body
        paEllipse(g, wx, wy - 4, 4, 4, frameC);
        paR(g, wx - 4, wy - 4, 8, 9, frameC);
        paEllipse(g, wx, wy - 4, 3, 3, glassC);
        paR(g, wx - 3, wy - 4, 6, 8, glassC);
        paLine(g, wx, wy - 7, wx, wy + 4, frameC);        // muntin
        paLine(g, wx - 3, wy - 1, wx + 3, wy - 1, frameC);
        paPX(g, wx - 2, wy - 5, glassHi); paPX(g, wx - 1, wy - 6, glassHi); // glint
        paR(g, wx - 5, wy - 9, 10, 1, shade(TRIM, 0.8));  // lintel
      }
    }
    // Victorian bay window bump on tall fronts
    if(w.facing === 'front' && nFloors >= 2 && w.len > 46 && phash(b.i, w.i, 1330) < 0.8){
      const t = 0.3 + phash(b.i, w.i, 1331) * 0.4;
      const [bx, by] = wallAt(w.x1, w.y1, w.x2, w.y2, t, 0.5);
      paEllipse(g, bx, by, 7, Math.min(11, hPx * 0.4), wr[2]);
      paEllipse(g, bx, by - 1, 6, Math.min(10, hPx * 0.4 - 1), wr[3]);
      for(let f = 0; f < nFloors; f++){
        const wy2 = by - (f - (nFloors - 1) / 2) * 15;
        paEllipse(g, bx, wy2 - 3, 3, 3, TRIM);
        paR(g, bx - 3, wy2 - 3, 6, 6, TRIM);
        paEllipse(g, bx, wy2 - 3, 2, 2, '#7a94a8');
        paR(g, bx - 2, wy2 - 3, 4, 5, '#7a94a8');
      }
      paEllipse(g, bx, by - Math.min(11, hPx * 0.4) - 1, 7, 3, TRIM); // bay cornice
    }
    // ground floor: door + stoop (and awning for shops) on front faces
    if(w.facing === 'front' && w.len > 20){
      const t = 0.5;
      const [dx2, dy2] = wallAt(w.x1, w.y1, w.x2, w.y2, t, 0);
      // stoop steps
      paEllipse(g, dx2, dy2 - 1, 7, 2.5, shade(TRIM, 0.7));
      paEllipse(g, dx2, dy2 - 3, 5.5, 2, shade(TRIM, 0.85));
      // arched door
      paEllipse(g, dx2, dy2 - 12, 4.5, 4.5, frameDoorCol(isShop, TRIM));
      paR(g, dx2 - 4.5, dy2 - 12, 9, 12, frameDoorCol(isShop, TRIM));
      paEllipse(g, dx2, dy2 - 11, 3.5, 3.5, isShop ? '#3a5a6a' : '#5a3a28');
      paR(g, dx2 - 3.5, dy2 - 11, 7, 11, isShop ? '#3a5a6a' : '#5a3a28');
      paPX(g, dx2 + 2, dy2 - 6, '#e8c95a'); // knob
      if(isShop){
        // scalloped awning over the storefront: band + semicircle edge
        const ax = dx2, aw = Math.min(26, w.len * 0.6);
        const awn = rampOf(['#c9483c', '#3a7a5a', '#3a5a8a', '#c98a2e'][Math.floor(phash(b.i, 3, 1340) * 4)]);
        paR(g, ax - aw / 2, dy2 - 22, aw, 4, awn[3]);
        for(let k = 0; k <= Math.floor(aw / 5); k++)
          paEllipse(g, ax - aw / 2 + k * 5, dy2 - 18, 2.5, 2.5, awn[4]);
        paR(g, ax - aw / 2, dy2 - 23, aw, 1, awn[5]);
        // painted sign on the fascia
        if(b.name){
          g.fillStyle = '#f8f4e8';
          g.font = 'bold 5px sans-serif';
          g.textAlign = 'center';
          g.fillText(b.name.slice(0, 22), ax, dy2 - 19.5);
        }
      }
    }
    g.restore();
  }

  // pass 2: roof polygon at -hPx — tar-and-gravel texture, not flat grey
  g.beginPath();
  P.forEach(([x, y], i) => i ? g.lineTo(x, y - hPx) : g.moveTo(x, y - hPx));
  g.closePath();
  g.fillStyle = ROOF[3]; g.fill();
  g.save(); g.clip();
  // dithered shading + gravel speckle so the roof reads as a surface
  paDithBayer(g, pad, pad, wPx - pad * 2, hBase + pad, ROOF[3], ROOF[4], 0.22);
  paNoise(g, pad, pad, wPx - pad * 2, hBase + pad * 2, [ROOF[2], ROOF[4], ROOF[1]], 0.30, 1350 + b.i);
  // tar-paper seams: soft vertical strips across the roof span
  for(let sx2 = pad + 6; sx2 < wPx - pad; sx2 += 11)
    paLine(g, sx2, pad, sx2, pad + hBase, shade(ROOF[3], phash(sx2, b.i, 1366) < 0.5 ? 0.92 : 1.08));
  // skylight ellipses
  const roofArea = Math.abs(area);
  const nSky = Math.min(3, Math.floor(roofArea / 2200));
  for(let k = 0; k < nSky; k++){
    const cx = pad + (wPx - pad * 2) * phash(b.i, k, 1367);
    const cy = pad + hBase * (0.2 + 0.6 * phash(k, b.i, 1368));
    paEllipse(g, cx, cy, 4, 2.6, ROOF[1]);
    paEllipse(g, cx, cy - 0.5, 3, 1.8, '#9ab4c4');
    paEllipse(g, cx - 1, cy - 1, 1.2, 0.8, '#d8e8f0');
  }
  g.restore();
  // parapet cornice: bright trim along every outward roof edge
  for(let i = 0; i < n; i++){
    const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % n];
    const [nx, ny] = edgeOutward(x1, y1, x2, y2);
    if(ny <= 0.05) continue;
    g.strokeStyle = TRIM; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x1, y1 - hPx); g.lineTo(x2, y2 - hPx); g.stroke();
    g.strokeStyle = shade(TRIM, 0.7); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x1, y1 - hPx + 2); g.lineTo(x2, y2 - hPx + 2); g.stroke();
    // parapet shadow just inside the roof edge
    g.strokeStyle = shade(ROOF[1], 0.8); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x1, y1 - hPx + 4); g.lineTo(x2, y2 - hPx + 4); g.stroke();
  }
  // roof furniture on big roofs: vent capsules + AC blobs + pipe stacks
  if(roofArea > 900){
    for(let k = 0; k < Math.min(6, roofArea / 1300); k++){
      const t1 = phash(b.i, k, 1360), t2 = phash(k, b.i, 1361);
      const cx = pad + (wPx - pad * 2) * t1, cy = pad + hBase * t2;
      const kind = Math.floor(phash(b.i, k, 1369) * 4);
      if(kind === 0){ // mushroom vent
        paEllipse(g, cx, cy, 3, 2, ROOF[1]);
        paEllipse(g, cx, cy - 1.5, 2, 1.4, ROOF[5]);
      } else if(kind === 1){ // AC unit blob
        paBlob(g, cx, cy, 3.2, shade(ROOF[3], 1.15));
        paBlob(g, cx, cy - 1, 2.4, ROOF[5]);
        paPX(g, cx, cy - 1, ROOF[1]);
      } else if(kind === 2){ // pipe stack
        paR(g, cx - 1, cy - 4, 2, 5, ROOF[1]);
        paEllipse(g, cx, cy - 4, 1.6, 1, ROOF[5]);
      } else { // brick chimney + cap + drip shadow
        paR(g, cx - 2, cy - 7, 5, 8, '#8a5a48');
        paR(g, cx - 2, cy - 7, 5, 1, '#c89078');
        paR(g, cx - 3, cy - 9, 7, 2, '#6a4034');
        paR(g, cx + 2, cy + 1, 4, 2, 'rgba(20,14,8,0.3)');
      }
    }
  }
  return { c: S.c, ox: pad, oy: pad + hPx };
}
function frameDoorCol(isShop, trim){ return isShop ? '#3a3a40' : trim; }

const SF_BLD_CACHE = new Map();
function getSfBldArt(i){
  let a = SF_BLD_CACHE.get(i);
  if(!a){ a = sfBldCanvas(SF_BLD[i]); SF_BLD_CACHE.set(i, a); }
  return a;
}
