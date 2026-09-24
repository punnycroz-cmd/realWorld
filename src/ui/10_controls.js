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

  initMobileUI();

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

/* ---- Mobile / touch UI: joystick, interact button, inspector sheet, fullscreen ---- */
function isTouchDevice(){
  try{
    if(typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
    if(typeof window.matchMedia === 'function') return window.matchMedia('(pointer: coarse)').matches;
  }catch(e){}
  return false;
}

function initMobileUI(){
  const $ = (id) => document.getElementById(id);
  const inspector = $('pawn-inspector');

  const fs = $('btn-fullscreen');
  if(fs){
    fs.onclick = () => {
      try{
        const doc = document;
        const root = doc.documentElement || doc.body;
        if(!doc.fullscreenElement && root && root.requestFullscreen) root.requestFullscreen().catch(() => {});
        else if(doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
      }catch(e){}
    };
  }

  const collapse = $('pi-collapse');
  if(collapse && inspector){
    collapse.onclick = () => {
      const collapsed = inspector.classList.toggle('collapsed');
      collapse.textContent = collapsed ? '▴' : '▾';
    };
  }

  const touch = isTouchDevice();
  if(!touch) return;
  document.body.classList.add('touch');
  if(inspector) inspector.classList.add('collapsed');
  if(collapse) collapse.textContent = '▴';

  const toggleInsp = $('btn-inspector');
  if(toggleInsp && inspector){
    toggleInsp.onclick = () => {
      inspector.classList.toggle('hidden-mobile');
    };
  }

  const interact = $('btn-interact');
  if(interact){
    interact.addEventListener('pointerdown', (e) => { e.preventDefault(); interactKey(); });
  }

  // Virtual joystick: normalised direction written into touchMove (read by updatePlayerPawn)
  const stick = $('joystick'), knob = $('joystick-knob');
  if(stick && knob){
    const RADIUS = 60, DEAD = 8, KNOB_MAX = 34;
    let activeId = null, cx = 0, cy = 0;
    const reset = () => {
      activeId = null;
      touchMove.dx = 0; touchMove.dy = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    };
    const update = (e) => {
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if(len < DEAD){ touchMove.dx = 0; touchMove.dy = 0; knob.style.transform = 'translate(-50%, -50%)'; return; }
      const k = Math.min(len, RADIUS) / len;
      dx *= k; dy *= k;
      const n = Math.hypot(dx, dy) || 1;
      touchMove.dx = dx / n; touchMove.dy = dy / n;
      const kx = dx / RADIUS * KNOB_MAX, ky = dy / RADIUS * KNOB_MAX;
      knob.style.transform = `translate(calc(-50% + ${kx.toFixed(1)}px), calc(-50% + ${ky.toFixed(1)}px))`;
    };
    stick.addEventListener('pointerdown', (e) => {
      if(activeId !== null) return;
      e.preventDefault();
      activeId = e.pointerId;
      const r = stick.getBoundingClientRect();
      cx = r.left + (r.width || 120) / 2; cy = r.top + (r.height || 120) / 2;
      if(stick.setPointerCapture) stick.setPointerCapture(e.pointerId);
      if(controlledPawnIdx < 0 && VILLAGERS[inspectedPawnIdx]){
        // Steering an autonomous pawn takes control of it, like the Take Control button.
        VILLAGERS.forEach(p => p.isNPC = true);
        VILLAGERS[inspectedPawnIdx].isNPC = false;
        controlledPawnIdx = inspectedPawnIdx;
        updateHUD();
      }
      update(e);
    });
    stick.addEventListener('pointermove', (e) => { if(e.pointerId === activeId) update(e); });
    stick.addEventListener('pointerup', (e) => { if(e.pointerId === activeId) reset(); });
    stick.addEventListener('pointercancel', (e) => { if(e.pointerId === activeId) reset(); });
  }
}
