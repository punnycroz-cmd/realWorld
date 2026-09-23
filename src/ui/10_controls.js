/* ---------------------------------------------------------------------
   PART 11: INITIALIZATION & AUTOTEST
   --------------------------------------------------------------------- */
function initControls(){
  document.getElementById('btn-pause').onclick = () => {
    W.paused = !W.paused;
    document.getElementById('btn-pause').textContent = W.paused ? '▶' : '⏸';
  };
  const speeds = [1, 2, 4, 16];
  speeds.forEach(s => {
    const btn = document.getElementById('btn-speed-' + s);
    btn.onclick = () => {
      W.speed = s;
      speeds.forEach(other => {
        document.getElementById('btn-speed-' + other).classList.toggle('active', other === s);
      });
    };
  });

  document.getElementById('btn-toggle-ctrl').onclick = () => {
    // v54: in the spectator shell possession is off the table entirely —
    // the button is hidden and the path is a verified no-op even if
    // invoked programmatically (protects C1–C8 absolutely).
    if(typeof SF_MODE !== 'undefined' && SF_MODE) return;
    const v = VILLAGERS[inspectedPawnIdx];
    if(v === VILLAGERS[controlledPawnIdx]){
      v.isNPC = true;
      controlledPawnIdx = -1;
    } else {
      VILLAGERS.forEach(p => p.isNPC = true);
      v.isNPC = false;
      controlledPawnIdx = inspectedPawnIdx;
    }
    updateHUD();
  };

  document.getElementById('btn-prev-pawn').onclick = () => cyclePawn(-1);
  document.getElementById('btn-next-pawn').onclick = () => cyclePawn(1);

  document.getElementById('btn-spawn-visitor').onclick = () => {
    const visitors = ['Rowan', 'Clara', 'Gareth'];
    const pick = visitors[Math.floor(Math.random()*visitors.length)];
    const v = VILLAGERS.find(p => p.name === pick);
    if(v){
      inspectedPawnIdx = VILLAGERS.indexOf(v);
      showToast(`✦ Visiting traveler: ${v.name} the ${v.role}!`);
      updateHUD();
    }
  };
}
