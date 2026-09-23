/* ---------------------------------------------------------------------
   PART 6: RENDER PIPELINE (WILLOWBROOK CONVERTED ART ON NATURA WORLD)
   --------------------------------------------------------------------- */
const cam = { x: 0, y: 0, zoom: 1.0, targetX: 0, targetY: 0 };
let cv, ctx, dpr = 1;

function setupCanvas(){
  cv = document.getElementById('cv');
  ctx = cv.getContext('2d');
  function resize(){
    dpr = window.devicePixelRatio || 1;
    cv.width = window.innerWidth * dpr;
    cv.height = (window.innerHeight - 44) * dpr;
  }
  window.addEventListener('resize', resize);
  resize();

  // Interactive Canvas Pointer: Select Villager / Click-to-Move
  cv.addEventListener('pointerdown', (e) => {
    const rect = cv.getBoundingClientRect();
    const clickX = (e.clientX - rect.left);
    const clickY = (e.clientY - rect.top);
    const cw = cv.width / dpr, ch = cv.height / dpr;
    const worldX = (clickX - cw / 2) / cam.zoom + cam.x;
    const worldY = (clickY - ch / 2) / cam.zoom + cam.y;

    // Check if clicked near a villager
    let clickedV = null, clickedDist = 36;
    VILLAGERS.forEach((v, idx) => {
      const d = Math.hypot(v.x - worldX, v.y - worldY);
      if(d < clickedDist){
        clickedDist = d;
        clickedV = v;
        inspectedPawnIdx = idx;
      }
    });

    if(clickedV){
      updateHUD();
      showToast(`✦ Inspected ${clickedV.name} the ${clickedV.role}`);
    } else {
      const ctrlPawn = VILLAGERS[controlledPawnIdx];
      if(ctrlPawn){
        const testMove = canMoveTo(worldX, worldY, ctrlPawn);
        if(testMove.ok){
          ctrlPawn.targetX = worldX;
          ctrlPawn.targetY = worldY;
          showToast(`✦ Command: Walking towards destination`);
        } else {
          showToast(`⚠️ Blocked by ${testMove.reason}`);
        }
      }
    }
  });
}

function renderWorld(){
  if(!ctx) return;
  const cw = cv.width / dpr, ch = cv.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, cw, ch);

  // Camera smooth follow
  const targetPawn = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
  if(targetPawn){
    cam.x += (targetPawn.x - cam.x) * 0.1;
    cam.y += (targetPawn.y - cam.y) * 0.1;
  }

  const cs = CS * cam.zoom;
  const wx0 = Math.floor((cam.x - cw/2/cam.zoom) / CS) - 1;
  const wx1 = Math.floor((cam.x + cw/2/cam.zoom) / CS) + 1;
  const wy0 = Math.floor((cam.y - ch/2/cam.zoom) / CS) - 1;
  const wy1 = Math.floor((cam.y + ch/2/cam.zoom) / CS) + 1;

  ctx.imageSmoothingEnabled = false;

  function getCvs(spr){
    if(!spr) return null;
    if(spr.c) return spr.c;
    if(spr instanceof HTMLCanvasElement || spr instanceof ImageBitmap) return spr;
    return null;
  }

  // 1. Terrain Layer (Willowbrook Pixel Art Tiles)
  const waterSpr = (PA.terrain.water && PA.terrain.water[Math.floor(W.tod*4)%4]) || null;
  const grassSpr = (PA.terrain.grass && PA.terrain.grass[0]) || null;
  const pathSpr = (PA.terrain.path && PA.terrain.path[0]) || null;
  const stoneSpr = PA.terrain.stone || null;
  const fieldSpr = (PA.terrain.tilled && PA.terrain.tilled[0]) || null;

  for(let wy = wy0; wy <= wy1; wy++){
    for(let wx = wx0; wx <= wx1; wx++){
      const {c, i} = cellChunk(wx, wy);
      const sx = Math.round((wx * CS - cam.x) * cam.zoom + cw / 2);
      const sy = Math.round((wy * CS - cam.y) * cam.zoom + ch / 2);
      const tt = c.tileType[i];

      let spr = null;
      if(tt === 2 || tt === 6) spr = waterSpr;
      else if(tt === 1) spr = pathSpr;
      else if(tt === 3) spr = stoneSpr;
      else if(tt === 4) spr = fieldSpr;
      else if(grassSpr){
        const varIdx = Math.abs(hash2(wx, wy, SEED+11)*4)|0;
        spr = (PA.terrain.grass && PA.terrain.grass[varIdx]) || grassSpr;
      }

      const tCvs = getCvs(spr);
      if(tCvs){
        ctx.drawImage(tCvs, sx, sy, cs, cs);
      } else {
        ctx.fillStyle = '#3f7338';
        ctx.fillRect(sx, sy, cs, cs);
      }

      // Shallow Water overlay & shore shimmer (tt === 6)
      if(tt === 6){
        ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
        ctx.fillRect(sx, sy, cs, cs);
        ctx.fillStyle = 'rgba(217, 180, 130, 0.26)';
        ctx.fillRect(sx, sy + cs*0.7, cs, cs*0.3);
        const rip = Math.sin(W.tod * 35 + wx*2 + wy*3) * 0.5 + 0.5;
        if(rip > 0.65){
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(sx + 3*cam.zoom, sy + 5*cam.zoom, cs - 6*cam.zoom, 2*cam.zoom);
        }
      }

      // Wooden Fishing Pier / Bridge (tt === 5)
      if(tt === 5){
        ctx.fillStyle = '#5c3a21'; // dark foundation timber
        ctx.fillRect(sx, sy, cs, cs);
        ctx.fillStyle = '#8b5a2b'; // upper timber planks
        ctx.fillRect(sx + 1, sy + 2, cs - 2, cs - 4);
        ctx.fillStyle = '#3e2716';
        ctx.fillRect(sx, sy + Math.floor(cs*0.33), cs, 1);
        ctx.fillRect(sx, sy + Math.floor(cs*0.66), cs, 1);
        ctx.fillStyle = '#1e1b18';
        ctx.fillRect(sx + 2, sy + 3, 2, 2);
        ctx.fillRect(sx + cs - 4, sy + 3, 2, 2);
        ctx.fillRect(sx + 2, sy + cs - 5, 2, 2);
        ctx.fillRect(sx + cs - 4, sy + cs - 5, 2, 2);
      }

      // Berry Bushes
      if(c.bush[i] > 0.5 && PA.veg.bush && PA.veg.bush[0]){
        const bCvs = getCvs(PA.veg.bush[0]);
        if(bCvs) ctx.drawImage(bCvs, sx, sy - 8*cam.zoom, cs, cs);
      }

      // Procedural Trees scaled to Natura's tStage
      if(c.tStage[i] >= 1.5 && PA.veg.tree){
        const treeArr = (c.treeType[i] === 1 && PA.veg.pine) ? PA.veg.pine : PA.veg.tree;
        const treeSpr = treeArr[Math.abs(hash2(wx, wy, SEED+33)) % treeArr.length];
        const trCvs = getCvs(treeSpr);
        if(trCvs){
          const tw = trCvs.width * cam.zoom;
          const th = trCvs.height * cam.zoom;
          ctx.drawImage(trCvs, sx + cs/2 - tw/2, sy + cs - th, tw, th);
        }
      }
    }
  }

  // 2. Y-Sorted World Entities Pass (Buildings, Props, Living Chibi Characters)
  // True 2.5D depth sorting ensures characters behind buildings/roofs are realistically occluded
  const dark = isNight() ? 0.75 : 0;
  const drawables = [];
  for(const bld of VILLAGE_BUILDINGS){
    drawables.push({ kind: 'building', y: (bld.wy + bld.th) * CS, bld });
  }
  for(const obj of VILLAGE_OBJECTS){
    drawables.push({ kind: 'prop', y: obj.y, obj });
  }
  for(const v of VILLAGERS){
    drawables.push({ kind: 'pawn', y: v.y, v });
  }
  drawables.sort((a, b) => {
    if(a.y !== b.y) return a.y - b.y;
    if(a.kind === 'building' && b.kind === 'pawn') return -1;
    if(a.kind === 'pawn' && b.kind === 'building') return 1;
    return 0;
  });

  for(const d of drawables){
    if(d.kind === 'building'){
      const bld = d.bld;
      const bArt = PA.bld && (PA.bld[bld.sprKey] || PA.bld[bld.id]);
      if(bArt && bArt.day){
        const dayCvs = getCvs(bArt.day);
        const sx = Math.round((bld.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round((bld.y - cam.y) * cam.zoom + ch / 2);
        if(dayCvs){
          const bw = dayCvs.width * cam.zoom;
          const bh = dayCvs.height * cam.zoom;
          const ox = (bArt.ox != null ? bArt.ox : -16) * cam.zoom;
          const oy = (bArt.oy != null ? bArt.oy : -60) * cam.zoom;
          ctx.drawImage(dayCvs, sx + ox, sy + oy, bw, bh);
          if(dark > 0.05 && bArt.night){
            const nightCvs = getCvs(bArt.night);
            if(nightCvs){
              ctx.save();
              ctx.globalAlpha = dark;
              ctx.drawImage(nightCvs, sx + ox, sy + oy, bw, bh);
              ctx.restore();
            }
          }
        }

        // Building name label
        if(cam.zoom >= 0.75){
          ctx.fillStyle = 'rgba(15,23,42,0.85)';
          const tw = ctx.measureText(bld.name).width;
          const ly = Math.round(sy - 22 * cam.zoom);
          ctx.fillRect(sx + (bld.tw*cs)/2 - tw/2 - 4, ly, tw + 8, 16);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(bld.name, sx + (bld.tw*cs)/2 - tw/2, ly + 12);
        }
      }
    } else if(d.kind === 'prop'){
      const obj = d.obj;
      const sx = Math.round((obj.x - cam.x) * cam.zoom + cw / 2);
      const sy = Math.round((obj.y - cam.y) * cam.zoom + ch / 2);
      let spr = null;
      if(obj.kind === 'well') spr = PA.props.well && PA.props.well.spr;
      else if(obj.kind === 'anvil') spr = PA.props.anvil && PA.props.anvil.spr;
      else if(obj.kind === 'bench') spr = PA.props.bench && PA.props.bench.spr;
      else if(obj.kind === 'lamp') spr = PA.props.lamp && (isNight() ? PA.props.lamp.on : PA.props.lamp.off);

      const pCvs = getCvs(spr);
      if(pCvs){
        const pw = pCvs.width * cam.zoom;
        const ph = pCvs.height * cam.zoom;
        ctx.drawImage(pCvs, sx - pw/2, sy - ph/2, pw, ph);
      }
    } else if(d.kind === 'pawn'){
      if(!d.v.inBuilding || d.v === VILLAGERS[controlledPawnIdx]){
        renderChibiPawn(d.v, cw, ch);
      }
    }
  }

  // 5. Particles & Weather Atmosphere
  renderWeatherAtmosphere(cw, ch);
}

function isNight(){
  return W.tod < 5.5 || W.tod > 20.0;
}

/* Top-level sprite->canvas resolver. The render-local getCvs() inside
   renderWorld() is NOT in scope for drawCorpse/drawChildPawn — use this. */
function resolveSprCvs(spr){
  if(!spr) return null;
  if(spr.c) return spr.c;
  if(spr instanceof HTMLCanvasElement || spr instanceof ImageBitmap) return spr;
  return null;
}

function renderChibiPawn(v, cw, ch){
  const sx = Math.round((v.x - cam.x) * cam.zoom + cw / 2);
  const sy = Math.round((v.y - cam.y) * cam.zoom + ch / 2);

  // Water depth at character feet
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeepWater = depth > 0.05;
  const isShallowWater = depth > 0 && depth <= 0.05;

  // Selection ring
  if(v === VILLAGERS[controlledPawnIdx]){
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 16*cam.zoom, 7*cam.zoom, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  } else if(v === VILLAGERS[inspectedPawnIdx]){
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 15*cam.zoom, 6.5*cam.zoom, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  // Ground Shadow (only when on land or wading; when swimming in deep water, foam replaces shadow)
  if(!isDeepWater){
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 11*cam.zoom, 4.5*cam.zoom, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // Wading Foot Ripples in shallow water
  if(isShallowWater || v.state === 'wade'){
    ctx.save();
    const ripR = (13 + Math.sin(W.tod * 45 + v.seed) * 3) * cam.zoom;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, ripR, ripR * 0.45, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  // Deep Water Swimming Foam Ring & Swirls
  if(isDeepWater && v.canSwim){
    ctx.save();
    const foamR = (16 + Math.sin(W.tod * 40 + v.seed) * 3) * cam.zoom;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 6*cam.zoom, foamR, foamR * 0.45, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 6*cam.zoom, foamR * 1.35, foamR * 0.6, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  // Character Sprite
  const F = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  let fr = null;
  const dir = v.face === 1 ? 1 : ((v.face === 2 || v.face === 3) ? 2 : 0);

  if(F && F[dir]){
    const A = (typeof paStateAnim === 'function') ? paStateAnim(v.state)
      : {act:(v.state === 'walk' || v.state === 'wade' || v.state === 'swim') ? 'walk' : (v.state === 'work' ? 'work' : 'idle'), wp:v.state==='walk'||v.state==='wade'||v.state==='swim', wpm:4};
    const arr = F[dir][A.act] || F[dir].idle;
    const fi = A.wp ? Math.floor(v.walkPhase * (A.wpm || 4)) % arr.length
                    : (A.tick ? Math.floor(G.frame / A.tick) % arr.length : 0);
    fr = arr[fi % arr.length];
  }

  if(fr){
    const pw = 48 * cam.zoom;
    const ph = 64 * cam.zoom;
    let bounce = v.triumphT > 0 ? -Math.sin(v.triumphT * Math.PI) * 5 * cam.zoom : 0;

    let yOffset = 0;
    let flailX = 0, flailY = 0;

    if(isDeepWater && v.canSwim){
      yOffset = 18 * cam.zoom; // Chest submerged!
      bounce += Math.sin(W.tod * 50 + v.seed) * 2 * cam.zoom; // Swimming bob
    } else if(v.state === 'drown_panic'){
      flailX = (Math.sin(G.frame * 0.9 + v.seed) * 4) * cam.zoom;
      flailY = (Math.cos(G.frame * 0.7 + v.seed) * 4 + 14) * cam.zoom;
    } else if(isShallowWater){
      yOffset = 4 * cam.zoom; // Shins submerged
    }

    ctx.save();
    if(isDeepWater && v.canSwim){
      // Clip lower body beneath the water surface
      ctx.beginPath();
      ctx.rect(sx - pw, sy - ph*1.5, pw*2, ph*1.5 - 6*cam.zoom);
      ctx.clip();
    }

    const drawX = sx + flailX;
    const drawY = sy - ph + bounce + yOffset + flailY;

    if(v.face === 3){
      ctx.translate(drawX, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(fr, -pw/2, drawY, pw, ph);
    } else {
      ctx.drawImage(fr, drawX - pw/2, drawY, pw, ph);
    }
    ctx.restore();

    // Drowning Splash Particles & Emotes
    if(v.state === 'drown_panic'){
      ctx.save();
      for(let d=0; d<6; d++){
        const dropX = sx + (Math.sin(G.frame*0.4 + d*1.2) * 16) * cam.zoom;
        const dropY = sy - 14*cam.zoom - (Math.abs(Math.cos(G.frame*0.5 + d*1.5)) * 14) * cam.zoom;
        ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
        ctx.beginPath();
        ctx.arc(dropX, dropY, (2 + (d%2)) * cam.zoom, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('💦😱 CANNOT SWIM!', sx - 44*cam.zoom, sy - 84*cam.zoom);
      ctx.restore();
    }
  }

  // Dynamic Attached Tool (tucked away while swimming or drowning)
  const toolSpr = PA.tools && PA.tools[v.equippedTool.kind];
  if(toolSpr && v.state !== 'sleep' && v.state !== 'swim' && v.state !== 'drown_panic'){
    const tx = sx + (v.face === 3 ? 8 : -8) * cam.zoom;
    const ty = sy - 20 * cam.zoom;
    let angle = 0;
    if(v.triumphT > 0) angle = -1.2;
    else if(v.state === 'work'){
      if(v.equippedTool.kind === 'hammer') angle = Math.sin(W.tod * 40) * 1.1;
      else if(v.equippedTool.kind === 'hoe') angle = Math.sin(W.tod * 30) * 0.8;
      else if(v.equippedTool.kind === 'lute') angle = -0.3 + Math.sin(W.tod * 35) * 0.2;
      else angle = Math.sin(W.tod * 25) * 0.4;
    }

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle);
    const tw = 28 * cam.zoom;
    const th = 28 * cam.zoom;
    ctx.drawImage(toolSpr, -tw/2, -th/2, tw, th);
    ctx.restore();
  }

  // Mini Work Progress Bar
  if(v.state === 'work' && v.workProgress > 0){
    const bw = 24 * cam.zoom, bh = 4 * cam.zoom;
    const bx = sx - bw/2, by = sy - 70 * cam.zoom;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = v.workProgress > 0.8 ? '#4ade80' : '#38bdf8';
    ctx.fillRect(bx, by, bw * clamp(v.workProgress, 0, 1), bh);
  }

  // Name tag
  if(cam.zoom >= 0.8){
    ctx.font = 'bold 11px system-ui, sans-serif';
    const tag = v.name + (v === VILLAGERS[controlledPawnIdx] ? ' ★' : '');
    const tw = ctx.measureText(tag).width;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(sx - tw/2 - 4, sy - 78 * cam.zoom, tw + 8, 15);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(tag, sx - tw/2, sy - 66 * cam.zoom);
  }
}

function renderWeatherAtmosphere(cw, ch){
  // Darkness Overlay
  let darkness = 0;
  if(W.tod < 5) darkness = 0.85;
  else if(W.tod < 6.5) darkness = 0.85 * (1 - (W.tod - 5) / 1.5);
  else if(W.tod > 21) darkness = 0.85;
  else if(W.tod > 19) darkness = 0.85 * ((W.tod - 19) / 2.0);

  // Storm gloom
  darkness = Math.min(0.9, darkness + W.storm * 0.45);

  if(darkness > 0.05){
    ctx.save();
    ctx.fillStyle = `rgba(8, 14, 28, ${darkness.toFixed(2)})`;
    ctx.fillRect(0, 0, cw, ch);

    // Warm radial cutouts for lanterns and tavern windows
    ctx.globalCompositeOperation = 'destination-out';
    for(const obj of VILLAGE_OBJECTS){
      if(obj.kind === 'lamp' && isNight()){
        const sx = Math.round((obj.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round((obj.y - cam.y) * cam.zoom + ch / 2);
        const rad = 75 * cam.zoom;
        const grad = ctx.createRadialGradient(sx, sy, 5, sx, sy, rad);
        grad.addColorStop(0, 'rgba(255, 230, 150, 0.9)');
        grad.addColorStop(1, 'rgba(255, 230, 150, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Rain Streaks
  if(W.rain > 0.1){
    ctx.save();
    ctx.strokeStyle = `rgba(186, 230, 253, ${clamp(W.rain * 0.65, 0, 0.75)})`;
    ctx.lineWidth = 1;
    const dropCount = Math.floor(W.rain * 120);
    for(let i=0; i<dropCount; i++){
      const rx = (hash2(i, Math.floor(W.tod*100), SEED+88) * cw);
      const ry = (hash2(i, Math.floor(W.tod*100)+1, SEED+89) * ch);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 14);
      ctx.stroke();
    }
    ctx.restore();
  }
}
