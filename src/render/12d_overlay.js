/* ---- overlay: piles, campfires, crops, chickens, wildfire ---- */
function drawParityOverlay(){
  if(!ctx) return;
  const z = cam.zoom;
  for(const p of PILES){
    const s = w2s(p.x, p.y);
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath(); ctx.ellipse(s[0], s[1], 10 * z, 5 * z, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f8fafc'; ctx.font = Math.max(9, 10 * z) + 'px system-ui, sans-serif';
    ctx.fillText(pileWords(p), s[0] - 8 * z, s[1] - 10 * z);
  }
  for(const f of FIRES){
    const s = w2s(f.x, f.y);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(s[0], s[1], 14 * z, 7 * z, 0, 0, 7); ctx.stroke();
    if(f.burnH > 0){
      const fl = (6 + Math.sin(W.tod * 40 + f.wx) * 2) * z;
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.ellipse(s[0], s[1] - fl, 7 * z, fl, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.ellipse(s[0], s[1] - fl * 0.7, 3.5 * z, fl * 0.6, 0, 0, 7); ctx.fill();
    }
  }
  const cropCols = ['#57534e', '#4d7c0f', '#65a30d', '#a3e635'];
  for(const c of CROPS){
    const s = w2s(c.wx * CS + 16, c.wy * CS + 16);
    ctx.fillStyle = cropCols[c.stage] || '#57534e';
    const q = (4 + c.stage * 3) * z;
    ctx.fillRect(s[0] - q / 2, s[1] - q / 2, q, q);
  }
  for(const c of CHICKENS){
    const s = w2s(c.x, c.y);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.ellipse(s[0], s[1], 5 * z, 4 * z, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(s[0] + 3 * z, s[1] - 1, 3 * z, 2 * z);
  }
  for(const b of BURNING){
    const s = w2s(b.wx * CS + 16, b.wy * CS + 16);
    const fl = (8 + Math.random() * 6) * z;
    ctx.fillStyle = 'rgba(249,115,22,0.85)';
    ctx.beginPath(); ctx.ellipse(s[0], s[1] - 6 * z, 9 * z, fl, 0, 0, 7); ctx.fill();
  }
}