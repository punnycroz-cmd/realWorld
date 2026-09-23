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
    // v5: wildflower speckles scattered through the clover
    for(let i = 0; i < 6; i++){
      const cx = 3 + Math.floor(phash(i, v, 1032) * 26), cy = 3 + Math.floor(phash(v, i, 1033) * 26);
      paPX(g, cx, cy, ['#f0e8f8', '#f8d8e8', '#f0e05a'][i % 3]);
      if(phash(i, v, 1034) < 0.5) paPX(g, cx + 1, cy, '#e8f0d8');
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
/* v21: leaf-cluster canopy engine. Crowns are no longer stacked flat
   ellipses — each is hundreds of deterministic leaf clusters scattered
   through a dome volume. Per-cluster shading faces a baked key light
   (afternoon sun from the west = sprite upper-left): lit rim, mid tone,
   deep-shade core toward the lower-right, plus a sky-lit edge sparkle.
   o: {n density, shear (leeward wind shear, grows with -y), wRx leeward
   rx multiplier, bloom [petal colors], seed salt base} */
function sfLeafCanopy(g, cx, cy, rx, ry, seed, lf, ld, o){
  o = o || {};
  const n = o.n || Math.round(rx * ry * 2.6);
  const shear = o.shear || 0, wRx = o.wRx || 1;
  const salt = 1800 + (seed % 97) * 13;
  for(let i = 0; i < n; i++){
    const a = phash(i, seed, salt + 1) * Math.PI * 2;
    const rr = Math.sqrt(phash(seed, i, salt + 2));       // uniform dome fill
    let ex = Math.cos(a) * rr;
    const px = cx + (ex < 0 ? ex : ex * wRx) * rx +
               shear * (1 - (0.5 + Math.sin(a) * rr * 0.5)) +
               (phash(i, seed, salt + 3) - 0.5) * 2.5;
    const py = cy + Math.sin(a) * rr * ry + (phash(seed, i, salt + 4) - 0.5) * 2.5;
    const nx = (px - cx) / rx, ny = (py - cy) / ry;       // dome normal proxy
    const lit = nx * -0.62 + ny * -0.78;                // key light upper-left
    const h = phash(i, seed, salt + 5);
    const col = lit > 0.42 ? (h < 0.55 ? lf[5] : lf[4])
              : lit > -0.05 ? (h < 0.6 ? lf[3] : lf[4])
              : (h < 0.62 ? ld[2] : ld[1]);
    const sz = 1.3 + phash(i, seed, salt + 6) * 1.9;
    paEllipse(g, px, py, sz, sz * 0.62, col);
    if(h > 0.5) paEllipse(g, px - 0.6, py - 0.8, sz * 0.55, sz * 0.36,
                          lit > 0.1 ? lf[5] : lf[3]);   // leaf-top catch
  }
  if(o.bloom){ // blossom speckle scattered on the lit half
    const bn = Math.round(n * 0.16);
    for(let i = 0; i < bn; i++){
      const a = phash(i, seed, salt + 7) * Math.PI * 2;
      const rr = Math.sqrt(phash(seed, i, salt + 8));
      const px = cx + Math.cos(a) * rr * rx * 0.9, py = cy + Math.sin(a) * rr * ry * 0.9;
      if((px - cx) / rx * -0.62 + (py - cy) / ry * -0.78 < 0.1) continue;
      paPX(g, Math.round(px), Math.round(py), o.bloom[i % o.bloom.length]);
      if(phash(i, seed, salt + 9) < 0.4) paPX(g, Math.round(px) + 1, Math.round(py), o.bloom[(i + 1) % o.bloom.length]);
    }
  }
}
function sfLeafyTree(v){
  // broad park tree: forked trunk under a leaf-cluster crown
  const s = paMk(56, 64), g = s.g;
  const tr = MAT.trunk, lf = MAT.leaf, ld = MAT.leafDeep;
  // under-canopy occlusion mass (keeps the core deep)
  const blobs = v === 0
    ? [[28, 26, 17, 12], [16, 33, 10, 8], [40, 32, 10, 8], [28, 16, 11, 8], [22, 22, 9, 7], [34, 21, 8, 6]]
    : v === 1
    ? [[28, 28, 15, 11], [15, 32, 9, 7], [41, 33, 9, 7], [26, 17, 10, 8], [35, 20, 8, 6]]
    : [[28, 24, 18, 13], [14, 31, 9, 8], [42, 30, 9, 8], [28, 13, 10, 7]];
  for(const [bx, by, rx, ry] of blobs) paEllipse(g, bx, by + 1, rx, ry, ld[1]);
  paLine(g, 27, 60, 27, 40, tr[2]);
  paLine(g, 28, 60, 28, 40, tr[3]);
  paLine(g, 27, 44, 20, 36, tr[2]); paLine(g, 28, 44, 36, 34, tr[2]);
  paLine(g, 27, 48, 22, 42, tr[3]); paLine(g, 28, 48, 33, 42, tr[3]);
  for(let bi = 0; bi < blobs.length; bi++){
    const [bx, by, rx, ry] = blobs[bi];
    sfLeafCanopy(g, bx, by, rx, ry, 1200 + v * 31 + bi, lf, ld, { n: Math.round(rx * ry * 2.2) });
  }
  paEllipse(g, 19, 11, 4, 2, lf[5]); // key light catch
  return s;
}
function sfPalmTree(v){
  // Mission palm: curved trunk, dead-frond skirt, pinnate fronds —
  // each frond a rachis curve with leaflet pairs tapering to the tip
  const s = paMk(56, 72), g = s.g;
  const tr = rampOf('#9a7a4e'), lf = rampOf('#4e9a44'), ld = rampOf('#357030');
  const lean = v === 0 ? 3 : -3;
  for(let y = 0; y < 40; y++){
    const x = 28 + Math.round(lean * (y / 40) * (y / 40)) - lean;
    paPX(g, x, 68 - y, tr[3]); paPX(g, x + 1, 68 - y, tr[2]);
    if(y % 5 === 0) paPX(g, x, 68 - y, tr[4]);
  }
  const tx = 28 + Math.round(lean * 0.8) - lean, ty = 28;
  // dead-frond skirt under the crown (dry thatch, real Mission palms)
  const sk = rampOf('#8a6a38');
  for(let f = 0; f < 7; f++){
    const ang = Math.PI * 0.15 + f * (Math.PI * 0.7 / 6);
    const fx = Math.cos(ang), fy = Math.abs(Math.sin(ang));
    for(let k = 1; k <= 6; k++)
      paPX(g, Math.round(tx + fx * k * 1.2), Math.round(ty + 3 + fy * k * 1.4), sk[k < 4 ? 2 : 1]);
  }
  paEllipse(g, tx, ty + 2, 3, 3, tr[2]); // crown nut cluster
  paBlob(g, tx - 2, ty + 4, 1.6, '#6b4a26'); paBlob(g, tx + 2, ty + 4, 1.6, '#6b4a26');
  for(let f = 0; f < 10; f++){
    const ang = -Math.PI * 0.05 - f * (Math.PI * 0.95 / 9);
    const fx = Math.cos(ang), fy = Math.sin(ang);
    const len = 15 + (f % 3) * 3;
    for(let k = 1; k <= len; k++){
      const px = tx + fx * k, py = ty + fy * k + k * k * 0.045;
      paPX(g, Math.round(px), Math.round(py), k % 3 === 0 ? ld[2] : lf[3]); // rachis
      if(k > 2){ // leaflet pairs, longest mid-frond, sun-lit tops
        const lw = Math.max(1, 3.2 - k * 0.16);
        const lc = fy < -0.3 ? lf[4] : (k % 2 ? lf[3] : lf[2]);
        paLine(g, Math.round(px), Math.round(py),
               Math.round(px - fy * lw), Math.round(py + fx * lw + 1), lc);
      }
    }
    const px = Math.round(tx + fx * len), py = Math.round(ty + fy * len + len * len * 0.045);
    paPX(g, px, py, lf[5]); // frond tip catch
  }
  return s;
}
/* ---- v5 vegetation: street pit trees, blossom trees, cypress, shrubs,
   flowerbeds, barrel planters — all deterministic variants ---- */
function sfStreetTreeSpr(v){
  // sidewalk pit tree: iron grate, slim trunk, layered round canopy.
  // v: 0 green, 1 pink blossom (Mission trumpet trees), 2 autumn gold
  const s = paMk(44, 60), g = s.g;
  const tr = MAT.trunk, ir = MAT.ironDark;
  const lf = v === 0 ? MAT.leaf
           : v === 1 ? rampOf('#e8a0bc')
           : rampOf('#c9a04a');
  const ld = v === 0 ? MAT.leafDeep
           : v === 1 ? rampOf('#a8567a')
           : rampOf('#8a6c30');
  // tree grate: dark iron square with slit slots
  paR(g, 14, 52, 16, 6, ir[2]);
  paR(g, 14, 52, 16, 1, ir[4]);
  paR(g, 14, 57, 16, 1, ir[0]);
  for(let k = 0; k < 3; k++)
    paLine(g, 18 + k * 4, 53, 18 + k * 4, 56, ir[0]);
  paEllipse(g, 22, 54, 3, 2, MAT.dirt[2]); // soil in the grate center
  // slim trunk with a fork
  paR(g, 21, 36, 2, 17, tr[2]);
  paPX(g, 21, 37, tr[3]); paPX(g, 21, 44, tr[3]); paPX(g, 22, 50, tr[4]);
  paLine(g, 22, 38, 17, 32, tr[2]); paLine(g, 22, 39, 27, 31, tr[2]);
  // leaf-cluster crown over a dark occlusion core; v1 = blossom,
  // v2 = autumn gold (Mission trumpet trees / ginkgo street rows)
  const blobs = [[22, 26, 13, 10], [12, 31, 8, 6], [32, 30, 8, 6],
                 [22, 17, 9, 7], [16, 21, 6, 5], [29, 20, 6, 5]];
  for(const [bx, by, rx, ry] of blobs) paEllipse(g, bx, by + 1, rx, ry, ld[1]);
  for(let bi = 0; bi < blobs.length; bi++){
    const [bx, by, rx, ry] = blobs[bi];
    sfLeafCanopy(g, bx, by, rx, ry, 1600 + v * 41 + bi, lf, ld,
      { n: Math.round(rx * ry * 2.4),
        bloom: v === 1 ? ['#ffd8e8', '#f4c2d8', '#f8ecf2']
             : v === 2 ? ['#e8c86a', '#f0d888'] : null });
  }
  paEllipse(g, 16, 13, 3.5, 2, lf[5]); // key light catch
  return s;
}
function sfCypressSpr(v){
  // Monterey cypress FLAG FORM: Pacific westerlies shear the crown
  // leeward — tight windward face, foliage streamed east, ragged top.
  const s = paMk(48, 76), g = s.g;
  const tr = MAT.trunk, lf = rampOf(v === 0 ? '#3a6a34' : '#466e38'),
        ld = rampOf(v === 0 ? '#244a22' : '#2c4a26');
  // slight leeward trunk lean
  paLine(g, 18, 74, 20, 68, tr[2]); paLine(g, 19, 74, 21, 68, tr[1]);
  paPX(g, 18, 69, tr[3]);
  // stacked ragged tiers, widest low-mid, sheared progressively east
  for(let k = 0; k < 9; k++){
    const t = k / 8, y = 68 - k * 7;
    const r = 3.5 + Math.sin(t * Math.PI) * 8 + phash(k, v, 1610) * 2;
    paEllipse(g, 20 + t * 7 + (phash(k, v, 1611) - 0.5) * 3, y, r, 4.2, ld[1]);
  }
  for(let k = 0; k < 9; k++){
    const t = k / 8, y = 67 - k * 7;
    const r = 3 + Math.sin(t * Math.PI) * 7 + phash(k, v, 1612) * 1.6;
    sfLeafCanopy(g, 20 + t * 7, y, r, 4.0, 1614 + v * 17 + k, lf, ld,
                 { n: Math.round(r * 11), shear: t * 2.5, wRx: 1.35 });
  }
  paNoise(g, 8, 4, 34, 66, [lf[5], ld[0]], 0.06, 1618 + v);
  paPX(g, 27, 1, lf[4]); paPX(g, 26, 2, lf[3]); paPX(g, 28, 3, lf[3]); // streamed tip
  return s;
}
function sfShrubSpr(v){
  // clipped hedge — leaf-cluster texture, blossom speckles (v1 flowering)
  const s = paMk(30, 18), g = s.g;
  const lf = MAT.leaf, ld = MAT.leafDeep;
  paEllipse(g, 15, 11, 13, 5.5, ld[1]);
  sfLeafCanopy(g, 15, 10, 12, 5, 1620 + v, lf, ld, { n: 64 });
  if(v === 1)
    paNoise(g, 5, 4, 20, 9, ['#f0b8d0', '#f8e8f0', '#e8c05a'], 0.09, 1625);
  return s;
}
function sfFlowerBedSpr(v){
  // low soil strip with a row of bright blooms — park border / parklet
  const s = paMk(38, 14), g = s.g;
  const D = MAT.dirt;
  paEllipse(g, 19, 10, 17, 3.5, D[1]);
  paEllipse(g, 19, 9, 16, 3, D[2]);
  paNoise(g, 4, 6, 30, 6, [D[0], D[3]], 0.25, 1630 + v);
  const cols = v === 0 ? ['#e05a5a', '#f0d05a', '#f8f0e8']
                     : ['#c86ad0', '#f0a050', '#f8e8f0'];
  for(let k = 0; k < 8; k++){
    const bx = 5 + k * 4 + Math.floor(phash(k, v, 1631) * 2),
          by = 6 + Math.floor(phash(v, k, 1632) * 4);
    paPX(g, bx, by + 2, MAT.leaf[2]);           // stem
    paBlob(g, bx, by, 1.3, cols[k % 3]);        // bloom
    paPX(g, bx, by - 1, cols[(k + 1) % 3]);
  }
  for(const lx of [8, 15, 22, 29]) paBlob(g, lx, 10, 2.2, MAT.leaf[2]);
  return s;
}
function sfPlanterSpr(){
  // sidewalk barrel planter overflowing with greens + blooms
  const s = paMk(20, 24), g = s.g;
  const pot = rampOf('#a05a38');
  paEllipse(g, 10, 21, 8, 2.5, 'rgba(24,18,10,0.3)');
  paR(g, 4, 14, 12, 7, pot[2]);
  paEllipse(g, 10, 14, 6, 2.5, pot[3]);
  paR(g, 4, 17, 12, 1, pot[4]);                     // hoop band
  paEllipse(g, 10, 14, 5, 2, MAT.dirt[1]);          // soil
  for(const [bx, by, r] of [[6, 11, 3], [10, 9, 3.6], [14, 11, 3], [10, 13, 2.6]])
    paBlob(g, bx, by, r, MAT.leaf[3]);
  paBlob(g, 8, 10, 1.4, MAT.leaf[4]); paBlob(g, 12, 8, 1.4, MAT.leaf[4]);
  for(const [bx, by, c] of [[6, 9, '#e05a5a'], [10, 7, '#f0d05a'], [14, 10, '#f0a8c8'], [11, 12, '#f8f0e8']])
    paBlob(g, bx, by, 1.1, c);
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
/* ---- v17: parked cars. Top-view sedan sprite, 4.6m x 1.85m at 16px/m
   (~74x30px), drawn nose-east and rotated for N-S streets. Eight muted
   Mission paint jobs: silver, oxford maroon, navy, charcoal, ivory,
   fog green, taxi-ish ochre, plum. */
const SF_CAR_COLS = ['#b4b8c0', '#7e3038', '#33507a', '#3c4046',
                     '#d6d2c6', '#56705c', '#b0722e', '#5e4256'];
function sfCarSpr(v, vert){
  const W0 = 74, H0 = 30;
  const src = paMk(W0, H0), g = src.g;
  const C = rampOf(SF_CAR_COLS[v % SF_CAR_COLS.length]);
  const GL = rampOf('#7f9eb2');          // glass: sky-reflecting blue-grey
  // body silhouette: rounded ends, slab sides
  paR(g, 8, 4, 58, 22, C[3]);
  paEllipse(g, 9, 15, 5, 11, C[3]);
  paEllipse(g, 65, 15, 5, 11, C[3]);
  paR(g, 8, 4, 58, 3, C[4]);             // sunlit upper flank
  paR(g, 8, 23, 58, 3, C[2]);            // shadowed lower flank
  // bumpers
  paR(g, 2, 9, 3, 12, C[2]); paR(g, 69, 9, 3, 12, C[2]);
  // greenhouse: windshield rake, cabin, rear glass
  paR(g, 22, 7, 26, 16, C[2]);           // cabin frame
  paR(g, 24, 8, 22, 14, GL[3]);
  paR(g, 30, 8, 2, 14, C[3]);            // B-pillar
  paR(g, 18, 9, 4, 12, GL[2]);           // windshield (darker, raked)
  paR(g, 47, 9, 4, 12, GL[2]);           // rear glass
  paPX(g, 19, 9, GL[5]); paPX(g, 48, 9, GL[5]);
  paR(g, 26, 8, 16, 3, GL[4]);           // glass sky catch
  // wheels tucked in the arches
  for(const wx of [13, 57]){ paR(g, wx, 2, 7, 3, '#1c1a18'); paR(g, wx, 25, 7, 3, '#1c1a18'); }
  // lights: headlamps east, tail lamps west
  paR(g, 68, 7, 2, 3, '#f4ecc8'); paR(g, 68, 20, 2, 3, '#f4ecc8');
  paR(g, 3, 7, 2, 3, '#a03838'); paR(g, 3, 20, 2, 3, '#a03838');
  paNoise(g, 6, 5, 62, 20, [C[4], C[2]], 0.05, 1700 + v);
  if(!vert) return src;
  const r = paMk(H0, W0);
  r.g.save(); r.g.translate(H0 / 2, W0 / 2); r.g.rotate(Math.PI / 2);
  r.g.drawImage(src.c, -W0 / 2, -H0 / 2); r.g.restore();
  return r;
}
/* v20: utility pole top-view marker — a dark post dot with its crossarm
   tick perpendicular to the wire run (dir 0 = E-W street, arm runs N-S) */
function sfPoleSpr(dir){
  const s = paMk(14, 14), g = s.g;
  const wd = rampOf('#4a3a28');
  paEllipse(g, 7, 7, 3, 1.6, 'rgba(24,18,10,0.3)');
  paR(g, 6, 6, 2, 2, wd[1]);
  if(dir === 0){ paR(g, 6, 2, 2, 10, wd[2]); paPX(g, 6, 2, wd[0]); paPX(g, 6, 11, wd[0]); }
  else { paR(g, 2, 6, 10, 2, wd[2]); paPX(g, 2, 6, wd[0]); paPX(g, 11, 6, wd[0]); }
  return s;
}
function buildSfVeg(){
  const V = PA.sfVeg = PA.sfVeg || {};
  V.tree = [sfLeafyTree(0), sfLeafyTree(1), sfLeafyTree(2)];
  V.palm = [sfPalmTree(0), sfPalmTree(1)];
  V.bench = sfBenchSpr();
  V.lampOff = sfLampSpr(false);
  V.lampOn = sfLampSpr(true);
  // v5 vegetation set
  V.streetTree = [sfStreetTreeSpr(0), sfStreetTreeSpr(1), sfStreetTreeSpr(2)];
  V.cypress = [sfCypressSpr(0), sfCypressSpr(1)];
  V.shrub = [sfShrubSpr(0), sfShrubSpr(1)];
  V.flowerbed = [sfFlowerBedSpr(0), sfFlowerBedSpr(1)];
  V.planter = sfPlanterSpr();
  // v17: V.car[v*2 + dir] — dir 0 = E-W street (horizontal), 1 = N-S
  V.car = [];
  for(let cv = 0; cv < 8; cv++){
    V.car.push(sfCarSpr(cv, false));
    V.car.push(sfCarSpr(cv, true));
  }
  V.pole = [sfPoleSpr(0), sfPoleSpr(1)]; // v20
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
/* v12: pitched-roof material ramps — Mission shingle / slate / terracotta.
   Shared by the baked top-down sprite AND the street-view roof pass so a
   building keeps the same roof silhouette in every camera. */
const SF_PITCH_COLS = ['#8a4a3a', '#7a5c48', '#5d6b7d', '#6e5a4a',
                       '#94554a', '#4e5a68', '#7c6a58', '#8a6248'];

/* Deterministic roof typology. Real Mission rows mix flat tar roofs behind
   parapets (mostly commercial), gabled Victorian fronts, mansard caps, and
   shallow hip roofs. Returns 'flat' | 'gable' | 'mansard' | 'hip'.
   roofArea is in px² (m² * SF_PXM² works too). */
function sfRoofKind(b, isShop, roofArea){
  if(roofArea < 800) return 'flat';
  const r = phash(b.i, 21, 1390);
  if(isShop) return r < 0.58 ? 'flat' : (r < 0.78 ? 'mansard' : (r < 0.92 ? 'gable' : 'hip'));
  return r < 0.42 ? 'gable' : (r < 0.66 ? 'mansard' : (r < 0.86 ? 'hip' : 'flat'));
}

/* ---------------- v18 facade dressing ----------------
   Painted-Lady polychromy (a second saturated accent color on ~45% of
   residential facades), Clarion-Alley style ground-floor murals, and a
   parody-name signage layer. Shared by the baked top-down sprite and the
   street view so a building keeps its identity in every camera. */
const SF_ACCENT_COLS = ['#2e5a78', '#7a3040', '#3a6a44', '#8a5424',
                        '#5a3a68', '#2a6a60', '#a04a30', '#4a507a'];
const SF_SIGN_COLS = ['#28424e', '#5a2a30', '#2a4a34', '#4a3a24',
                      '#503a58', '#6e3a22', '#243a56'];
/* mural palettes: [sky top, sky low, sun] then layered hill colors */
const SF_MURAL_SKY = [['#2a88b8', '#f2c14a', '#e87830'],
                      ['#2456a0', '#e87830', '#f0d040'],
                      ['#5a3a8a', '#e8b040', '#e85a5a'],
                      ['#2a7a5a', '#f0d040', '#e87830']];
const SF_MURAL_HILL = ['#1e5a3a', '#c84838', '#284a78', '#7a3a28', '#d8a028'];
const SF_TILE_COLS = [['#2a6a6a', '#e8e0c8'], ['#7a2a30', '#e8d8b0'],
                      ['#2a4a6a', '#d8e0e0'], ['#4a5a2a', '#e8e0c0']];
/* user-locked rule: businesses on screen are GTA-style parodies, never
   real SF names. Code keys stay real for routines/lookups — this is the
   display layer (mirrors world/businesses.md on the sf/world branch). */
const SF_PARODY_NAMES = {
  'Haus Coffee': 'MUDHAUS COFFEE',
  'Taqueria El Farolito': 'TAQUERIA EL FAROLOTE',
  'Auerbach Hardware': 'AUERBACH HARDWARE',
  'Bi-Rite Market': 'BUY-RITE MARKET',
  'Bi-Rite Creamery': 'BUY-RITE CREAMERY',
  'Delfina': 'IL DELFINO',
  'Dolores Park Cafe': 'DOLORES PERK',
  'Tartine Bakery': 'BAGUETTE ABOUT IT',
  '500 Club': 'THE 600 CLUB',
  'Dandelion Chocolate': 'DANDY LION CHOCOLATE',
  'Valencia Farmers Market': 'VALENCIA GROWERS MKT',
};
const SF_GENERIC_SIGN = {
  restaurant: 'TAQUERIA', cafe: 'CAFÉ', bar: 'CANTINA', pub: 'PUB',
  fast_food: 'TAQUERIA', convenience: 'MINI MART', supermarket: 'MERCADO',
  clothes: 'VINTAGE', hairdresser: 'SALON', beauty: 'BOTANICA',
  bakery: 'PANADERÍA', laundry: 'LAVANDERÍA', dry_cleaning: 'CLEANERS',
  tattoo: 'TATTOO', books: 'LIBRERÍA', florist: 'FLORES',
  gallery: 'GALERÍA', gift: 'CURIOS', jewelry: 'JOYERÍA',
  shoes: 'ZAPATERÍA', hardware: 'FERRETERÍA', car_repair: 'AUTO SHOP',
  fitness_centre: 'GYM', bank: 'BANCO', ice_cream: 'HELADERÍA',
  variety_store: 'BODEGA', alcohol: 'LIQUOR', tobacco: 'SMOKE SHOP',
  mobile_phone: 'PHONES', houseware: 'HOUSEWARE', massage: 'SPA',
  dentist: 'DENTAL', hotel: 'HOTEL', money_transfer: 'ENVÍOS',
  kindergarten: 'DAYCARE', social_facility: 'CENTRO', poi: 'STORE',
};
function sfSignName(b){
  if(b.name && SF_PARODY_NAMES[b.name]) return SF_PARODY_NAMES[b.name];
  return SF_GENERIC_SIGN[b.kind] || (b.name ? null : 'STORE');
}
/* one mural per wall, deterministic — the same gate drives the street
   view and the baked sprite so the colorful band agrees in both */
function sfMuralWall(i, ei, L, isShop){
  return !isShop && L > 8 && phash(i, ei, 1750) < 0.34;
}
function sfAccentOf(i, TRIM, isShop){
  if(isShop || phash(i, 23, 1753) >= 0.45) return TRIM;
  return SF_ACCENT_COLS[Math.floor(phash(i, 19, 1752) * SF_ACCENT_COLS.length)];
}
/* Roof geometry frame: centroid + ridge axis (the footprint's longer bbox
   axis) + perpendicular half-extent + max radial extent. Coordinate-free —
   callers pass px or meter polygons. */
function sfRoofFrame(P){
  const n = P.length;
  let cx = 0, cy = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for(const p of P){
    cx += p[0]; cy += p[1];
    if(p[0] < x0) x0 = p[0]; if(p[0] > x1) x1 = p[0];
    if(p[1] < y0) y0 = p[1]; if(p[1] > y1) y1 = p[1];
  }
  cx /= n; cy /= n;
  const alongX = (x1 - x0) >= (y1 - y0); // ridge runs along x
  let wMax = 1, dMax = 1;
  for(const p of P){
    const w = Math.abs((alongX ? p[1] - cy : p[0] - cx));
    if(w > wMax) wMax = w;
    const d = Math.hypot(p[0] - cx, p[1] - cy);
    if(d > dMax) dMax = d;
  }
  return { cx, cy, alongX, wMax, dMax };
}
/* 0 at eaves -> 1 at ridge for gable/hip typologies */
function sfRoofLift(F, kind, x, y){
  if(kind === 'gable'){
    const w = F.alongX ? y - F.cy : x - F.cx;
    return Math.max(0, 1 - Math.abs(w) / F.wMax);
  }
  if(kind === 'hip')
    return Math.max(0, 1 - Math.hypot(x - F.cx, y - F.cy) / F.dMax);
  return 0;
}
/* Half-plane clip of a polygon at the ridge axis (w = 0). keepPos keeps
   the w>=0 side. Plain Sutherland–Hodgman on the perpendicular coord. */
function sfClipHalf(P, F, keepPos){
  const wOf = p => F.alongX ? p[1] - F.cy : p[0] - F.cx;
  const out = [], n = P.length;
  for(let i = 0; i < n; i++){
    const a = P[i], b2 = P[(i + 1) % n], wa = wOf(a), wb = wOf(b2);
    const ina = keepPos ? wa >= 0 : wa <= 0, inb = keepPos ? wb >= 0 : wb <= 0;
    if(ina) out.push(a);
    if(ina !== inb){
      const t = wa / (wa - wb);
      out.push([a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t]);
    }
  }
  return out;
}
/* sunlit? — v14: the TRUE sun vector (SF_SUN.toX/toY, set by the solar
   engine in 32_sf_render) decides which slope faces catch the light */
function sfRoofFaceLit(nx, ny){
  return (nx * SF_SUN.toX + ny * SF_SUN.toY) > 0.08;
}
/* v13: even-odd point-in-polygon test in the caller's coordinate space.
   Roof furniture uses it so nothing lands over a courtyard or lot-line
   notch in non-rectangular footprints. */
function sfPtInPoly(P, x, y){
  let c = false;
  for(let i = 0, j = P.length - 1; i < P.length; j = i++){
    const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1];
    if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/* v13/v14: sun-cast shadow blob for rooftop clutter. A prop h px tall
   slides its contact shadow along the live solar vector — same direction
   and length scale as the building's own footprint shadow. */
function sfPropShadow(g, x, y, h, r){
  paEllipse(g, x + h * SF_SUN.x + r * 0.4, y + h * SF_SUN.y, r * 1.5, r * 0.55,
            `rgba(20,14,8,${0.10 + 0.18 * SF_SUN.day})`);
}

function sfBldCanvas(b, wet){
  // v12: ridge + chimney headroom; v14: pad also swallows the longest cast
  // shadow the current sun can throw (hPx · cot(elevation) in any dir)
  const pad = Math.ceil(26 + b.hPx *
    Math.max(Math.abs(SF_SUN.x), Math.abs(SF_SUN.y)) * 1.1);
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
  // v18: Painted-Lady polychromy — 45% of homes get a saturated accent
  // color for frames/cornice instead of the neutral trim
  const ACC = sfAccentOf(b.i, TRIM, isShop);
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

  // pass 0: cast shadow on the pavement — footprint pushed along the REAL
  // sun vector; length = hPx · cot(elevation), direction = away from sun.
  // v15: three stacked passes give a true penumbra profile — a wide faint
  // halo, a mid falloff, then the umbra core — the same physics the sun's
  // ~0.5° disc produces on real streets.
  const shx = hPx * SF_SUN.x, shy = hPx * SF_SUN.y;
  const shA = 0.05 + 0.15 * SF_SUN.day; // fades to nothing under cloud/night
  for(const [mul, al] of [[1.7, shA * 0.18], [1.3, shA * 0.45], [1.0, shA]]){
    g.fillStyle = `rgba(26,19,10,${al})`;
    g.beginPath();
    P.forEach(([x, y], i2) => i2
      ? g.lineTo(x + shx * mul, y + shy * mul)
      : g.moveTo(x + shx * mul, y + shy * mul));
    g.closePath(); g.fill();
  }
  // v15: ground-level ambient occlusion — the pavement strip hugging a
  // wall is starved of skylight, so a soft dark band rings every outside
  // edge of the footprint (the inner half is covered by walls/roof above)
  for(const [lw, aa] of [[6, 0.08], [2.5, 0.15]]){
    g.strokeStyle = `rgba(20,16,9,${aa})`; g.lineWidth = lw;
    g.beginPath();
    P.forEach(([x, y], i2) => i2 ? g.lineTo(x, y) : g.moveTo(x, y));
    g.closePath(); g.stroke();
  }

  // pass 1: walls (south + side), far(north) walls skipped
  const wallFaces = [];
  for(let i = 0; i < n; i++){
    const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % n];
    const [nx, ny] = edgeOutward(x1, y1, x2, y2);
    const facing = ny > 0.35 ? 'front' : (ny > -0.35 ? 'side' : 'back');
    if(facing === 'back') continue;
    wallFaces.push({ i, x1, y1, x2, y2, nx, ny, facing,
                     len: Math.hypot(x2 - x1, y2 - y1) });
  }
  for(const w of wallFaces){
    // v14: real sun exposure per face — n·L against the solar bearing,
    // warm-lit sunward / cool sky-fill shaded (same rule as street view)
    const sunK = clamp(w.nx * SF_SUN.toX + w.ny * SF_SUN.toY, -1, 1);
    const wr = rampOf(sfSunWallCol(wallBase, sunK));
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
    // v20: horizontal siding courses — wood cladding reads as fine
    // banding even at top-down zoom — plus the shade band the projecting
    // cornice throws across the wall crown (same physics as street view)
    if(hPx > 14 && w.len > 10){
      g.strokeStyle = 'rgba(30,24,18,0.10)'; g.lineWidth = 1;
      g.beginPath();
      for(let zz = 3; zz < hPx - 5; zz += 3){
        g.moveTo(w.x1, w.y1 - zz); g.lineTo(w.x2, w.y2 - zz);
      }
      g.stroke();
      const eavA = 0.05 + 0.16 * SF_SUN.day * Math.max(0, sunK);
      g.strokeStyle = `rgba(20,14,8,${eavA})`; g.lineWidth = 4;
      g.beginPath();
      g.moveTo(w.x1, w.y1 - hPx + 3); g.lineTo(w.x2, w.y2 - hPx + 3); g.stroke();
    }
    // cornice: bright accent band + dentil bumps along the top
    const steps = Math.max(1, Math.floor(w.len / 7));
    for(let k = 0; k <= steps; k++){
      const [cx, cy] = wallAt(w.x1, w.y1, w.x2, w.y2, k / steps, 1);
      paEllipse(g, cx, cy + 1, 2, 2, ACC);
    }
    g.strokeStyle = ACC; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w.x1, w.y1 - hPx); g.lineTo(w.x2, w.y2 - hPx); g.stroke();
    // second trim band under cornice
    g.strokeStyle = shade(ACC, 0.85); g.lineWidth = 1;
    g.beginPath();
    g.moveTo(w.x1, w.y1 - hPx + 4); g.lineTo(w.x2, w.y2 - hPx + 4); g.stroke();
    // v18: Clarion-style mural band across the lower wall — a painted
    // sky field, sun disc and layered hill silhouettes baked into the
    // sprite so the top-down view shows the same splash of color
    const muralH = sfMuralWall(b.i, w.i, w.len, isShop)
      ? Math.min(hPx - 6, Math.max(10, hPx * 2 / nFloors)) : 0;
    if(muralH){
      const mk = SF_MURAL_SKY[Math.floor(phash(b.i, w.i, 1756) * SF_MURAL_SKY.length)];
      const mx0 = Math.min(w.x1, w.x2), mw = Math.abs(w.x2 - w.x1);
      paR(g, mx0, w.y1 - muralH, mw, muralH, mk[1]);
      paR(g, mx0, w.y1 - muralH, mw, muralH * 0.45, mk[0]);
      paEllipse(g, mx0 + mw * 0.72, w.y1 - muralH * 0.62,
                Math.max(3, mw * 0.07), muralH * 0.18, mk[2]);
      paR(g, mx0, w.y1 - muralH * 0.4, mw, muralH * 0.4,
          SF_MURAL_HILL[Math.floor(phash(b.i, w.i, 1757) * SF_MURAL_HILL.length)]);
      paR(g, mx0, w.y1 - muralH * 0.18, mw, muralH * 0.18,
          SF_MURAL_HILL[Math.floor(phash(b.i, w.i, 1758) * SF_MURAL_HILL.length)]);
    }
    // windows per floor: capsule sashes with arched tops + sills
    const bays = Math.max(1, Math.floor(w.len / 22));
    for(let f = 0; f < nFloors; f++){
      const fv = 1 - (f + 0.72) / (nFloors + 0.4); // vertical band for floor f
      if(muralH && hPx * fv < muralH) continue;
      for(let k = 0; k < bays; k++){
        const t = (k + 0.5) / bays;
        const [wx, wy] = wallAt(w.x1, w.y1, w.x2, w.y2, t, fv);
        const frameC = ACC,
              // v14: sunward glass catches the warm sky reflection
              glassC = (SF_SUN.day > 0.3 && sunK > 0.35)
                ? mix('#7a94a8', '#ffd9a0', 0.4 + SF_SUN.warm * 0.3)
                : '#7a94a8',
              glassHi = '#c8d8e4';
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
        paR(g, wx - 5, wy - 9, 10, 1, shade(ACC, 0.8));  // lintel
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
        paEllipse(g, bx, wy2 - 3, 3, 3, ACC);
        paR(g, bx - 3, wy2 - 3, 6, 6, ACC);
        paEllipse(g, bx, wy2 - 3, 2, 2, '#7a94a8');
        paR(g, bx - 2, wy2 - 3, 4, 5, '#7a94a8');
      }
      paEllipse(g, bx, by - Math.min(11, hPx * 0.4) - 1, 7, 3, ACC); // bay cornice
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
        // painted sign on the fascia — parody display name only
        const sg = sfSignName(b);
        if(sg){
          g.fillStyle = '#f8f4e8';
          g.font = 'bold 5px sans-serif';
          g.textAlign = 'center';
          g.fillText(sg.slice(0, 22), ax, dy2 - 19.5);
        }
      }
    }
    // v5: climbing ivy on some residential walls — leaf blobs along a
    // slanted vine from the base corner, denser near the ground
    if(!isShop && hPx > 20 && phash(b.i, w.i, 1640) < 0.34){
      const t0 = 0.1 + phash(b.i, w.i, 1641) * 0.5;
      const climb = 0.35 + phash(b.i, w.i, 1642) * 0.45; // fraction of height
      const iv = MAT.leaf, ivd = MAT.leafDeep;
      const nV = Math.round(6 + climb * 10);
      for(let k = 0; k < nV; k++){
        const f = (k / nV) * climb;
        const t = t0 + Math.sin(k * 1.7) * 0.03 + f * 0.08;
        const [vx, vy] = wallAt(w.x1, w.y1, w.x2, w.y2, t, f);
        const r = 2.4 - f * 1.4 + phash(k, b.i, 1643);
        paBlob(g, vx, vy, Math.max(0.8, r), k % 3 ? iv[2] : ivd[2]);
        if(phash(k, w.i, 1644) < 0.4) paPX(g, vx - 1, vy - 1, iv[4]);
      }
    }
    g.restore();
  }

  // pass 2: roof — v12 roofscape typology. Every building deterministically
  // gets flat tar | gable | mansard | hip (sfRoofKind, shared with the
  // street view so silhouettes agree). Pitched faces are lit consistently:
  // the sun sits upper-left (SF_SUN), so faces whose outward normal points
  // up/left are bright, faces pointing down/right fall dark.
  const roofArea = Math.abs(area);
  const rk = sfRoofKind(b, isShop, roofArea);
  const PC = rampOf(SF_PITCH_COLS[Math.floor(phash(b.i, 23, 1391) * SF_PITCH_COLS.length)]);
  const RF = sfRoofFrame(P);
  const wetF = wet ? 0.78 : 1; // soaked roofing darkens
  const rl = (x0, y0, x1, y1, col) =>
    paLine(g, Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), col);
  const polyFill = (pts, dy, fill) => {
    g.fillStyle = fill;
    g.beginPath();
    pts.forEach(([x, y], i2) => i2
      ? g.lineTo(x, y - hPx - (dy || 0))
      : g.moveTo(x, y - hPx - (dy || 0)));
    g.closePath(); g.fill();
  };
  if(rk === 'flat' || RF.wMax < 6){
  // flat tar-and-gravel roof, parapeted — the old pass 2, wet-aware
  g.beginPath();
  P.forEach(([x, y], i) => i ? g.lineTo(x, y - hPx) : g.moveTo(x, y - hPx));
  g.closePath();
  g.fillStyle = shade(ROOF[3], wetF); g.fill();
  g.save(); g.clip();
  // dithered shading + gravel speckle so the roof reads as a surface
  paDithBayer(g, pad, pad, wPx - pad * 2, hBase + pad, ROOF[3], ROOF[4], 0.22);
  paNoise(g, pad, pad, wPx - pad * 2, hBase + pad * 2, [ROOF[2], ROOF[4], ROOF[1]], 0.30, 1350 + b.i);
  // tar-paper seams: soft vertical strips across the roof span
  for(let sx2 = pad + 6; sx2 < wPx - pad; sx2 += 11)
    paLine(g, sx2, pad, sx2, pad + hBase, shade(ROOF[3], phash(sx2, b.i, 1366) < 0.5 ? 0.92 : 1.08));
  // skylight ellipses
  const nSky = Math.min(3, Math.floor(roofArea / 2200));
  for(let k = 0; k < nSky; k++){
    const cx = pad + (wPx - pad * 2) * phash(b.i, k, 1367);
    const cy = pad + hBase * (0.2 + 0.6 * phash(k, b.i, 1368));
    paEllipse(g, cx, cy, 4, 2.6, ROOF[1]);
    paEllipse(g, cx, cy - 0.5, 3, 1.8, '#9ab4c4');
    paEllipse(g, cx - 1, cy - 1, 1.2, 0.8, '#d8e8f0');
  }
  // wet sheet-water glints between the seams
  if(wet) for(let k = 0; k < 5; k++){
    const cx = pad + (wPx - pad * 2) * phash(b.i, k, 1901);
    const cy = pad + hBase * phash(k, b.i, 1902);
    paEllipse(g, cx, cy, 5, 2, 'rgba(180,205,230,0.35)');
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
  // roof furniture on big roofs — deterministic mix of SF rooftop clutter.
  // NOTE: paLine requires integer endpoints (Bresenham loop has no cap),
  // so every coordinate below is rounded before it reaches paLine.
  if(roofArea > 900){
    const rl = (x0, y0, x1, y1, col) =>
      paLine(g, Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), col);
    // shop roofs sometimes get a railed sun deck with planks + umbrella
    if(isShop && roofArea > 2400 && phash(b.i, 2, 1370) < 0.6){
      const dw = Math.round((wPx - pad * 2) * 0.4), dh = Math.round(hBase * 0.42);
      const dx0 = Math.round(pad + (wPx - pad * 2 - dw) * phash(b.i, 4, 1371));
      const dy0 = Math.round(pad + (hBase - dh) * phash(b.i, 6, 1372));
      // v13: deck must sit fully inside the footprint, not over a notch
      const deckIn = [[dx0, dy0], [dx0 + dw, dy0], [dx0, dy0 + dh], [dx0 + dw, dy0 + dh]]
        .every(([qx, qy]) => sfPtInPoly(P, qx, qy + hPx));
      if(deckIn){
      paR(g, dx0, dy0, dw, dh, shade(ROOF[3], 1.18));
      for(let px2 = dx0 + 3; px2 < dx0 + dw; px2 += 4)
        rl(px2, dy0 + 1, px2, dy0 + dh - 1, shade(ROOF[3], 1.02));
      g.strokeStyle = shade(TRIM, 0.9); g.lineWidth = 1;
      g.strokeRect(dx0, dy0, dw, dh);
      g.strokeStyle = shade(TRIM, 1.15);
      g.strokeRect(dx0 - 1, dy0 - 1, dw + 2, dh + 2);
      const ux2 = Math.round(dx0 + dw * 0.3), uy2 = Math.round(dy0 + dh * 0.35);
      paEllipse(g, ux2 + 2, uy2 + 2, 5, 2, 'rgba(20,14,8,0.25)');
      paEllipse(g, ux2, uy2, 5, 3.4, '#d8e8f0');
      paEllipse(g, ux2, uy2 - 0.5, 4, 2.6, '#e8f0f6');
      paPX(g, ux2, uy2, '#8a6a45');
      for(let k = 0; k < 3; k++){
        const tx2 = Math.round(dx0 + dw * (0.55 + 0.15 * k)), ty2 = Math.round(dy0 + dh * 0.6);
        paEllipse(g, tx2, ty2, 2.4, 1.6, '#7a5a3a');
        paEllipse(g, tx2, ty2 - 0.5, 1.8, 1.1, '#9a7a55');
      }
      }
    }
    const nItem = Math.min(9, Math.floor(roofArea / 950) + 1);
    for(let k = 0; k < nItem; k++){
      // v13: items must sit INSIDE the footprint — retry the hash a few
      // times, skip if the roof keeps refusing (narrow/L-shaped lots)
      let cx = 0, cy = 0, inside = false;
      for(let a2 = 0; a2 < 6 && !inside; a2++){
        cx = Math.round(pad + (wPx - pad * 2) * phash(b.i, k + a2 * 31, 1360));
        cy = Math.round(pad + hBase * phash(k + a2 * 31, b.i, 1361));
        inside = sfPtInPoly(P, cx, cy + hPx);
      }
      if(!inside) continue;
      const kind = Math.floor(phash(b.i, k, 1369) * 13);
      if(kind === 0){ // mushroom vent
        sfPropShadow(g, cx, cy, 2, 2.2);
        paEllipse(g, cx, cy, 3, 2, ROOF[1]);
        paEllipse(g, cx, cy - 1.5, 2, 1.4, ROOF[5]);
      } else if(kind === 1){ // AC unit: box + fan ring + grille
        sfPropShadow(g, cx, cy, 3, 3.4);
        paR(g, cx - 3, cy - 2, 7, 5, shade(ROOF[3], 1.15));
        paR(g, cx - 3, cy - 2, 7, 1, ROOF[5]);
        paEllipse(g, cx, cy, 2, 1.6, ROOF[1]);
        paEllipse(g, cx, cy - 0.5, 1.3, 1, ROOF[2]);
        paPX(g, cx, cy - 1, ROOF[5]);
      } else if(kind === 2){ // pipe stack
        sfPropShadow(g, cx, cy, 5, 1.6);
        paR(g, cx - 1, cy - 4, 2, 5, ROOF[1]);
        paEllipse(g, cx, cy - 4, 1.6, 1, ROOF[5]);
      } else if(kind === 3){ // brick chimney + cap + sun-cast shadow
        sfPropShadow(g, cx, cy, 9, 2.6);
        paR(g, cx - 2, cy - 7, 5, 8, '#8a5a48');
        paR(g, cx - 2, cy - 7, 5, 1, '#c89078');
        paR(g, cx - 3, cy - 9, 7, 2, '#6a4034');
      } else if(kind === 4){ // rooftop water tank — the SF skyline icon
        sfPropShadow(g, cx, cy, 8, 4.5);
        for(const lx of [-3, 3]) rl(cx + lx, cy + 2, cx + lx * 0.6, cy - 2, '#5a4a3a');
        paEllipse(g, cx, cy - 3, 4.5, 3, '#7a5f45');
        paR(g, cx - 4.5, cy - 6, 9, 4, '#8a6f52');
        paR(g, cx - 4.5, cy - 4, 9, 1, '#6a5440');
        paEllipse(g, cx, cy - 6.5, 4, 2, '#a88a68');
        paEllipse(g, cx, cy - 8, 2, 1.4, '#6a5440');
      } else if(kind === 5){ // solar panel array: tilted dark glass + grid
        const pw2 = 12, ph2 = 6;
        sfPropShadow(g, cx, cy + 1, 3, 5);
        paR(g, cx - pw2 / 2, cy - ph2 / 2, pw2, ph2, '#1e3450');
        paR(g, cx - pw2 / 2, cy - ph2 / 2, pw2, 1, '#4a7ab0');
        for(let gx2 = 1; gx2 < 3; gx2++)
          rl(cx - pw2 / 2 + gx2 * pw2 / 3, cy - ph2 / 2, cx - pw2 / 2 + gx2 * pw2 / 3, cy + ph2 / 2, '#3a5a80');
        rl(cx - pw2 / 2, cy, cx + pw2 / 2, cy, '#3a5a80');
        rl(cx - 3, cy + ph2 / 2, cx - 3, cy + ph2 / 2 + 2, '#5a5a55');
        rl(cx + 3, cy + ph2 / 2, cx + 3, cy + ph2 / 2 + 2, '#5a5a55');
      } else if(kind === 6){ // roof hatch box
        sfPropShadow(g, cx, cy, 4, 2.6);
        paR(g, cx - 2.5, cy - 3, 5, 4, shade(ROOF[3], 0.9));
        paR(g, cx - 2.5, cy - 3, 5, 1, ROOF[5]);
        paR(g, cx - 2, cy - 4, 4, 1, shade(ROOF[5], 0.9));
      } else if(kind === 7){ // antenna mast + crossbars
        sfPropShadow(g, cx, cy + 1, 9, 1.4);
        rl(cx, cy + 2, cx, cy - 9, '#4a4a48');
        rl(cx - 3, cy - 5, cx + 3, cy - 5, '#4a4a48');
        rl(cx - 2, cy - 7, cx + 2, cy - 7, '#4a4a48');
        paPX(g, cx, cy - 9, '#c94040');
      } else if(kind === 8){ // satellite dish on a stub pole
        sfPropShadow(g, cx, cy, 4, 1.8);
        rl(cx, cy + 1, cx, cy - 3, '#6a6a66');
        paEllipse(g, cx - 1.5, cy - 4, 3, 2, '#d8d8d0');
        paEllipse(g, cx - 1.5, cy - 4.5, 2, 1.2, '#f0f0e8');
        rl(cx - 1.5, cy - 4, cx + 2, cy - 5.5, '#6a6a66');
      } else if(kind === 9){ // pigeon flock pecking around a vent
        const nB = 3 + Math.floor(phash(b.i, k, 1701) * 3);
        for(let b2 = 0; b2 < nB; b2++){
          const bx3 = Math.round(cx + (phash(b2, k, 1702) - 0.5) * 12);
          const by3 = Math.round(cy + (phash(k, b2, 1703) - 0.5) * 8);
          paPX(g, bx3 + 1, by3 + 1, 'rgba(20,14,8,0.25)'); // micro shadow
          paPX(g, bx3, by3, phash(b2, k, 1704) < 0.2 ? '#c8c8c0' : '#4a4a52');
          if(phash(b2, k, 1705) < 0.5) paPX(g, bx3 + 1, by3, '#3a3a42'); // wing
        }
      } else if(kind === 10){ // clothesline: posts + sagging line + laundry
        const lx0 = cx - 7, lx1 = cx + 7, lyy = cy - 4;
        sfPropShadow(g, cx, cy, 5, 4);
        rl(lx0, cy, lx0, lyy - 2, '#6a6a66');
        rl(lx1, cy, lx1, lyy - 2, '#6a6a66');
        for(let s2 = 0; s2 <= 10; s2++){ // sag curve
          const t2 = s2 / 10, sx3 = lx0 + (lx1 - lx0) * t2;
          const sy3 = lyy - 2 + Math.round(Math.sin(t2 * Math.PI) * 1.6);
          paPX(g, Math.round(sx3), sy3, '#3a3a38');
        }
        const cloth = ['#e8e0d0', '#7a94b8', '#c86a6a', '#e8e8f0'];
        for(let c3 = 0; c3 < 3; c3++){
          const t2 = 0.22 + c3 * 0.28;
          const sx3 = Math.round(lx0 + (lx1 - lx0) * t2);
          const sy3 = lyy - 1 + Math.round(Math.sin(t2 * Math.PI) * 1.6);
          paR(g, sx3 - 1, sy3, 3, 3, cloth[Math.floor(phash(b.i, c3 + k, 1706) * 4)]);
          paPX(g, sx3 - 1, sy3, '#f8f8f0'); // pin
        }
      } else if(kind === 11){ // roof garden: soil beds + green rows
        const gw2 = Math.min(16, 8 + Math.floor(phash(b.i, k, 1707) * 8));
        sfPropShadow(g, cx, cy, 1.5, gw2 * 0.4);
        paR(g, cx - gw2 / 2, cy - 3, gw2, 7, '#6a5138');
        paR(g, cx - gw2 / 2, cy - 3, gw2, 1, '#8a6f52');
        for(let gx2 = 0; gx2 < Math.floor(gw2 / 4); gx2++){
          const px4 = cx - gw2 / 2 + 2 + gx2 * 4;
          paBlob(g, px4, cy - 1, 1.8, MAT.leaf[2]);
          paBlob(g, px4, cy - 2, 1.3, MAT.leaf[3]);
          if(phash(gx2, k, 1708) < 0.3) paPX(g, px4, cy - 3, '#d05040');
        }
      } else { // exhaust fan: curb + spinning dome + highlight
        sfPropShadow(g, cx, cy, 3, 2.4);
        paR(g, cx - 2, cy - 1, 5, 3, shade(ROOF[3], 1.1));
        paEllipse(g, cx, cy - 2, 2.6, 2, '#9aa0a4');
        paEllipse(g, cx - 0.5, cy - 2.5, 1.6, 1.2, '#c8ccd0');
        paPX(g, cx - 1, cy - 3, '#eef0f2');
      }
    }
  }
  } else {
    /* ---- v12: pitched roofscape (gable / mansard / hip) ----
       All heights are pixel lifts above the eave line (y - hPx - lift).
       Lit faces use PC[4..5], shaded faces PC[1..2] — v14: real sun. */
    const liftOf = p => sfRoofLift(RF, rk === 'hip' ? 'hip' : 'gable', p[0], p[1]);
    const rise = rk === 'mansard'
      ? Math.min(11, Math.max(5, RF.wMax * 0.4))
      : Math.min(15, Math.max(6, RF.wMax * 0.52));
    const shingle = rk === 'mansard' ? MAT.slate : PC;

    // 1. rake / frieze walls under lifted roof edges — gable ends read as
    //    triangles of wall between the flat eave line and the slope.
    //    (hip roofs have eaves all around: no rake walls)
    if(rk === 'gable'){
      for(let i = 0; i < n; i++){
        const a = P[i], bq = P[(i + 1) % n];
        const la = liftOf(a) * rise, lb = liftOf(bq) * rise;
        if(la < 0.4 && lb < 0.4) continue;
        g.fillStyle = shade(wallBase, 0.74);
        g.beginPath();
        g.moveTo(a[0], a[1] - hPx); g.lineTo(bq[0], bq[1] - hPx);
        g.lineTo(bq[0], bq[1] - hPx - lb); g.lineTo(a[0], a[1] - hPx - la);
        g.closePath(); g.fill();
        g.strokeStyle = 'rgba(20,16,12,0.35)'; g.lineWidth = 1; g.stroke();
        // gable-end trim board along the rake
        g.strokeStyle = TRIM; g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(a[0], a[1] - hPx - la); g.lineTo(bq[0], bq[1] - hPx - lb);
        g.stroke();
      }
    }

    if(rk === 'gable'){
      // 2. two slope faces split at the ridge axis, each vertex lifted by
      //    its perpendicular distance from the ridge
      const wU = RF.alongX ? [0, 1] : [1, 0];
      for(const keepPos of [false, true]){
        const half = sfClipHalf(P, RF, keepPos);
        if(half.length < 3) continue;
        // v14: slope outward normal vs the real sun — not a fixed side
        const lit = sfRoofFaceLit(wU[0] * (keepPos ? 1 : -1),
                                  wU[1] * (keepPos ? 1 : -1));
        const col = lit ? shingle[4] : shingle[2];
        g.fillStyle = shade(col, wetF);
        g.beginPath();
        for(let i = 0; i < half.length; i++){
          const p = half[i], ly = p[1] - hPx - liftOf(p) * rise;
          i ? g.lineTo(p[0], ly) : g.moveTo(p[0], ly);
        }
        g.closePath(); g.fill();
        // shingle courses: lines parallel to the ridge, clipped to the face
        g.save(); g.clip();
        let fX0 = 1e9, fX1 = -1e9, fY0 = 1e9, fY1 = -1e9;
        for(const p of half){
          const ly = p[1] - hPx - liftOf(p) * rise;
          if(p[0] < fX0) fX0 = p[0]; if(p[0] > fX1) fX1 = p[0];
          if(ly < fY0) fY0 = ly; if(ly > fY1) fY1 = ly;
        }
        for(let c2 = 0; c2 < 8; c2++){
          const q = 0.15 + c2 * 0.11;
          if(RF.alongX){
            const yy = (keepPos ? fY1 : fY0) + (keepPos ? -1 : 1) * q * rise;
            rl(fX0, yy, fX1, yy, c2 % 2 ? shade(col, 0.86) : shade(col, 1.1));
          } else {
            const xx = (keepPos ? fX1 : fX0) + (keepPos ? -1 : 1) * q * rise;
            rl(xx, fY0, xx, fY1, c2 % 2 ? shade(col, 0.86) : shade(col, 1.1));
          }
        }
        paNoise(g, fX0, fY0, fX1 - fX0 + 1, fY1 - fY0 + 1,
                [shingle[1], shingle[5]], 0.10, 1378 + b.i + (keepPos ? 7 : 0));
        if(wet && lit) // rain sheen on the sun-facing slope
          paDithBayer(g, fX0, fY0, fX1 - fX0 + 1, fY1 - fY0 + 1,
                      'rgba(190,214,238,0.30)', 'rgba(190,214,238,0)', 0.4);
        g.restore();
      }
      // ridge cap: bright line where the faces meet + vent nubs
      let rA = 1e9, rB = -1e9;
      for(const keepPos of [false, true]) for(const p of sfClipHalf(P, RF, keepPos)){
        const w = RF.alongX ? p[1] - RF.cy : p[0] - RF.cx;
        if(Math.abs(w) < 1){
          const u = RF.alongX ? p[0] : p[1];
          if(u < rA) rA = u; if(u > rB) rB = u;
        }
      }
      if(rB > rA){
        const ry = RF.alongX ? RF.cy - hPx - rise : 0;
        if(RF.alongX){
          rl(rA, ry + 1, rB, ry + 1, shade(shingle[1], 0.9));
          rl(rA, ry, rB, ry, shingle[5]);
        } else {
          const rx = RF.cx; // ridge line is vertical: x = RF.cx
          for(let yy = rA; yy <= rB; yy++) paPX(g, rx, yy - hPx - rise, shingle[5]);
          for(let yy = rA; yy <= rB; yy += 2) paPX(g, rx + 1, yy - hPx - rise + 1, shade(shingle[1], 0.9));
        }
      }
    } else if(rk === 'mansard'){
      // 2. mansard: steep shingle skirt rising to a setback flat deck
      const k = 0.36;
      const inset = P.map(p => [RF.cx + (p[0] - RF.cx) * (1 - k),
                                RF.cy + (p[1] - RF.cy) * (1 - k)]);
      for(let i = 0; i < n; i++){
        const a = P[i], bq = P[(i + 1) % n];
        const [nx, ny] = edgeOutward(a[0], a[1], bq[0], bq[1]);
        const litF = sfRoofFaceLit(nx, ny);
        const ia = inset[i], ib = inset[(i + 1) % n];
        g.fillStyle = litF ? shade(shingle[3], wetF) : shade(shingle[1], wetF);
        g.beginPath();
        g.moveTo(a[0], a[1] - hPx); g.lineTo(bq[0], bq[1] - hPx);
        g.lineTo(ib[0], ib[1] - hPx - rise); g.lineTo(ia[0], ia[1] - hPx - rise);
        g.closePath(); g.fill();
        // skirt shingle band
        g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
        const m1 = [(a[0] + ia[0]) / 2, (a[1] + ia[1]) / 2],
              m2 = [(bq[0] + ib[0]) / 2, (bq[1] + ib[1]) / 2];
        g.beginPath();
        g.moveTo(m1[0], m1[1] - hPx - rise / 2); g.lineTo(m2[0], m2[1] - hPx - rise / 2);
        g.stroke();
      }
      // deck: flat crown with parapet trim + quiet clutter
      polyFill(inset, rise, shade(ROOF[3], wetF));
      g.save();
      g.beginPath();
      inset.forEach(([x, y], i2) => i2
        ? g.lineTo(x, y - hPx - rise) : g.moveTo(x, y - hPx - rise));
      g.closePath(); g.clip();
      paDithBayer(g, pad, pad, wPx - pad * 2, hBase, ROOF[3], ROOF[4], 0.2);
      paNoise(g, pad, pad, wPx - pad * 2, hBase, [ROOF[2], ROOF[1]], 0.2, 1392 + b.i);
      g.restore();
      for(let i = 0; i < inset.length; i++){
        const a = inset[i], bq = inset[(i + 1) % inset.length];
        const [nx, ny] = edgeOutward(a[0], a[1], bq[0], bq[1]);
        if(ny <= 0.05) continue;
        g.strokeStyle = TRIM; g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(a[0], a[1] - hPx - rise); g.lineTo(bq[0], bq[1] - hPx - rise);
        g.stroke();
      }
      // 1-2 deck boxes / vent pipes, kept inside the inset
      const nD = Math.min(3, Math.floor(roofArea / 2600) + 1);
      for(let k2 = 0; k2 < nD; k2++){
        const dx = RF.cx + (phash(b.i, k2, 1393) - 0.5) * (wPx - pad * 2) * (1 - k * 2) * 0.7;
        const dy = RF.cy + (phash(k2, b.i, 1394) - 0.5) * hBase * (1 - k * 2) * 0.7;
        const ey = dy - hPx - rise;
        if(k2 % 2 === 0){
          paR(g, dx - 3, ey - 2, 6, 4, shade(ROOF[3], 1.12));
          paR(g, dx - 3, ey - 2, 6, 1, ROOF[5]);
          paEllipse(g, dx, ey, 1.6, 1.1, ROOF[1]);
        } else {
          paR(g, dx - 1, ey - 4, 2, 5, ROOF[1]);
          paEllipse(g, dx, ey - 4, 1.6, 1, ROOF[5]);
        }
      }
      // cornice line at the eave keeps the facade grammar
      for(let i = 0; i < n; i++){
        const a = P[i], bq = P[(i + 1) % n];
        const [nx, ny] = edgeOutward(a[0], a[1], bq[0], bq[1]);
        if(ny <= 0.05) continue;
        g.strokeStyle = TRIM; g.lineWidth = 2;
        g.beginPath(); g.moveTo(a[0], a[1] - hPx); g.lineTo(bq[0], bq[1] - hPx); g.stroke();
      }
    } else { // hip: triangle fan to a ridge point over the centroid
      const apex = [RF.cx, RF.cy - hPx - rise];
      for(let i = 0; i < n; i++){
        const a = P[i], bq = P[(i + 1) % n];
        const [nx, ny] = edgeOutward(a[0], a[1], bq[0], bq[1]);
        const lit = sfRoofFaceLit(nx, ny);
        g.fillStyle = shade(lit ? shingle[4] : shingle[2], wetF);
        g.beginPath();
        g.moveTo(a[0], a[1] - hPx); g.lineTo(bq[0], bq[1] - hPx);
        g.lineTo(apex[0], apex[1]); g.closePath(); g.fill();
        // hip rafter line from eave corner to apex
        g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1;
        g.beginPath();
        g.moveTo(a[0], a[1] - hPx); g.lineTo(apex[0], apex[1]); g.stroke();
      }
      paNoise(g, pad, pad, wPx - pad * 2, hBase + pad,
              [shingle[1], shingle[5]], 0.06, 1395 + b.i);
      paEllipse(g, apex[0], apex[1], 2.2, 1.4, shingle[5]); // cap
      if(wet) paEllipse(g, apex[0], apex[1], 3.5, 2, 'rgba(190,214,238,0.25)');
    }

    // eave gutter line: gable traces the lifted silhouette (rakes included),
    // hip traces the flat eave outline (mansard trims itself)
    if(rk !== 'mansard'){
      for(let i = 0; i < n; i++){
        const a = P[i], bq = P[(i + 1) % n];
        const la = rk === 'gable' ? liftOf(a) * rise : 0;
        const lb = rk === 'gable' ? liftOf(bq) * rise : 0;
        g.strokeStyle = shade(TRIM, 0.85); g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(a[0], a[1] - hPx - la); g.lineTo(bq[0], bq[1] - hPx - lb);
        g.stroke();
      }
    }

    // pitched-roof furniture: brick chimneys + ridge vents on the ridge,
    // grounded on the lifted surface — nothing floats
    const nCh = Math.min(3, Math.floor(roofArea / 2600) + 1);
    const axU = RF.alongX ? [1, 0] : [0, 1];
    const span = (RF.alongX ? wPx : hBase) * 0.28;
    for(let k2 = 0; k2 < nCh; k2++){
      const off = (phash(b.i, k2, 1396) - 0.5) * 2 * span * 0.8;
      const px3 = RF.cx + axU[0] * off, py3 = RF.cy + axU[1] * off;
      const ly3 = (rk === 'mansard')
        ? py3 - hPx - rise
        : py3 - hPx - sfRoofLift(RF, rk === 'hip' ? 'hip' : 'gable', px3, py3) * rise;
      if(rk === 'mansard'){ // chimneys pierce the deck edge
        paR(g, px3 - 2, ly3 - 8, 5, 9, shade('#8a5a48', wetF));
        paR(g, px3 - 2, ly3 - 8, 5, 1, '#c89078');
        paR(g, px3 - 3, ly3 - 10, 7, 2, '#6a4034');
      } else if(k2 % 3 === 2){ // low-profile ridge vent
        rl(px3 - 4, ly3, px3 + 4, ly3, shingle[1]);
        rl(px3 - 4, ly3 - 1, px3 + 4, ly3 - 1, shingle[2]);
      } else {
        paR(g, px3 - 2, ly3 - 8, 5, 9, shade('#8a5a48', wetF));
        paR(g, px3 - 2, ly3 - 8, 5, 1, '#c89078');
        paR(g, px3 - 3, ly3 - 10, 7, 2, '#6a4034');
        paR(g, px3 + 2, ly3 + 1, 5, 2, 'rgba(20,14,8,0.28)'); // drip shadow
      }
    }

    /* v13: gable dormers — little rooms punched through the slope. The
       cheek wall is grounded on the lifted surface at its front line and
       the mini gable cap climbs toward the main ridge; lit/shaded cheeks
       follow the same sun as the roof faces. */
    if(rk === 'gable' && roofArea > 1400){
      const nDor = Math.min(3, Math.floor(roofArea / 2600) +
        (phash(b.i, 31, 1710) < 0.45 ? 1 : 0));
      const spanU = (RF.alongX ? wPx - pad * 2 : hBase) * 0.6;
      for(const sgn of [-1, 1]){
        for(let d2 = 0; d2 < nDor; d2++){
          const u = (phash(b.i, d2 + (sgn > 0 ? 9 : 0), 1711) - 0.5) * spanU;
          const w0 = sgn * RF.wMax * (0.3 + phash(d2, b.i + sgn * 3, 1712) * 0.22);
          const dx5 = RF.alongX ? RF.cx + u : RF.cx + w0;
          const dy5 = RF.alongX ? RF.cy + w0 : RF.cy + u;
          if(!sfPtInPoly(P, dx5, dy5)) continue;
          const gy5 = dy5 - hPx - sfRoofLift(RF, 'gable', dx5, dy5) * rise;
          // v14: cheek lit by the real sun, not by a fixed side
          const lit5 = sfRoofFaceLit((RF.alongX ? 0 : sgn), (RF.alongX ? sgn : 0));
          const wc = shade(wallBase, lit5 ? 1.02 : 0.7);
          sfPropShadow(g, dx5, gy5, 6, 3.2);
          paR(g, dx5 - 3.5, gy5 - 5, 7, 6, wc);                    // cheek wall
          paR(g, dx5 - 3.5, gy5 - 5, 7, 1, TRIM);                 // cap flashing
          paEllipse(g, dx5, gy5 - 2.5, 1.8, 1.8, TRIM);           // arched sash
          paR(g, dx5 - 1.8, gy5 - 2.5, 3.6, 3, TRIM);
          paEllipse(g, dx5, gy5 - 2.5, 1.2, 1.2, '#7a94a8');
          paR(g, dx5 - 1.2, gy5 - 2.5, 2.4, 2.6, '#7a94a8');
          g.fillStyle = shade(lit5 ? shingle[4] : shingle[2], wetF);
          g.beginPath();                                         // dormer gable
          g.moveTo(dx5 - 4.5, gy5 - 5); g.lineTo(dx5 + 4.5, gy5 - 5);
          g.lineTo(dx5, gy5 - 8.5); g.closePath(); g.fill();
          rl(dx5 - 4.5, gy5 - 5, dx5, gy5 - 8.5, shingle[5]);
          rl(dx5 + 4.5, gy5 - 5, dx5, gy5 - 8.5, shingle[5]);
        }
      }
    }
    // v13: skylight glass flashing on the sunward slope of gable/hip roofs
    if(rk !== 'mansard'){
      const nSk = Math.min(3, Math.floor(roofArea / 2400));
      for(let s2 = 0; s2 < nSk; s2++){
        const sx5 = pad + (wPx - pad * 2) * phash(b.i, s2, 1720);
        const py5 = pad + hBase * phash(s2, b.i, 1721) + hPx; // P-space y
        if(!sfPtInPoly(P, sx5, py5)) continue;
        const w5 = RF.alongX ? py5 - RF.cy : sx5 - RF.cx;
        // v14: sunward slope only — whichever side the real sun strikes
        const slopeK = sfRoofFaceLit((RF.alongX ? 0 : Math.sign(w5)),
                                     (RF.alongX ? Math.sign(w5) : 0));
        if(rk === 'gable' && (!slopeK || Math.abs(w5) < 2)) continue;
        const gy5 = py5 - hPx - sfRoofLift(RF, rk === 'hip' ? 'hip' : 'gable', sx5, py5) * rise;
        sfPropShadow(g, sx5, gy5, 1, 2.4);
        paR(g, sx5 - 3, gy5 - 1, 6, 3.4, shade(shingle[1], 0.9)); // curb
        paR(g, sx5 - 2.4, gy5 - 0.6, 4.8, 2.2, '#9ab4c4');        // glass
        paPX(g, sx5 - 1, gy5, '#d8e8f0');                          // glint
      }
    }
  }
  return { c: S.c, ox: pad, oy: pad + hPx };
}
function frameDoorCol(isShop, trim){ return isShop ? '#3a3a40' : trim; }

const SF_BLD_CACHE = new Map();
/* v14: facade art is now a function of the sun — shadow throw, wall
   exposure and roof shading all move with the real solar position, so the
   cache key carries the quantized sun sector (SF_SUN.q). A panning day
   rebakes visible facades a few times; an LRU cap keeps memory flat. */
function getSfBldArt(i, wet, sunQ){
  const key = i + ':' + (wet ? 1 : 0) + ':' +
              (sunQ == null ? SF_SUN.q : sunQ);
  let a = SF_BLD_CACHE.get(key);
  if(a){ SF_BLD_CACHE.delete(key); SF_BLD_CACHE.set(key, a); return a; }
  a = sfBldCanvas(SF_BLD[i], wet);
  SF_BLD_CACHE.set(key, a);
  while(SF_BLD_CACHE.size > 160)
    SF_BLD_CACHE.delete(SF_BLD_CACHE.keys().next().value);
  return a;
}
