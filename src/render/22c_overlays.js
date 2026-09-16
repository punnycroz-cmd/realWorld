/* =====================================================================
   PHASE 3C — DEBUG OVERLAYS (toggleable, off by default)
   Canvas overlays + event feed for developers and the future AI brain.
   Each overlay is independently toggleable; when all are off,
   drawDebugOverlays() returns immediately and costs nothing.

   Overlays:
   - needs:     hunger / energy / health bars above every villager
   - ownership: identified items labeled with holder (+ the INSPECTED
                villager's believed owner — belief-scoped, never actualOwner)
   - beliefs:   for the inspected villager, nearby items/people color-coded
                by what THEY believe (known / suspected / unknown)
   - zones:     building footprints, farm plots, home assignments
   - feed:      scrolling DOM feed of the last transfer/social events
   ===================================================================== */
const DEBUG_OVERLAYS = { needs: false, ownership: false, beliefs: false, zones: false, feed: false };
let __dbgDrawCalls = 0; // test hook: increments only when an overlay actually draws

function __dbgBar(sx, sy, w, frac, color, z){
  if(!ctx) return;
  const bw = w * z, bh = Math.max(2, 3 * z);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(sx - bw / 2, sy, bw, bh);
  ctx.fillStyle = color;
  ctx.fillRect(sx - bw / 2, sy, bw * clamp(frac || 0, 0, 1), bh);
}

function drawDebugOverlays(){
  // The DOM event feed is independent of canvas work: sync it on every call
  // (cheap: cached element + visibility/signature checks), so the feed toggle
  // works standalone and the panel hides promptly when toggled off.
  try{ updateDebugFeed(); }catch(e){}
  const any = DEBUG_OVERLAYS.needs || DEBUG_OVERLAYS.ownership || DEBUG_OVERLAYS.beliefs || DEBUG_OVERLAYS.zones;
  if(!any || !ctx || typeof w2s !== 'function') return;
  const z = (typeof cam !== 'undefined' && cam) ? cam.zoom : 1;

  if(DEBUG_OVERLAYS.needs){
    __dbgDrawCalls++;
    for(const v of VILLAGERS){
      if(v.dead) continue;
      const b = v.body || {};
      const s = w2s(v.x, v.y - 26);
      __dbgBar(s[0], s[1] - 8, 34, b.satiety, '#f59e0b', z);          // hunger (satiety)
      __dbgBar(s[0], s[1] - 4, 34, 1 - (b.fatigue || 0), '#38bdf8', z); // energy
      const hp = 1 - clamp((b.injury || 0) + (b.illness || 0), 0, 1);
      __dbgBar(s[0], s[1], 34, hp, '#4ade80', z);                     // health
    }
  }

  if(DEBUG_OVERLAYS.ownership){
    __dbgDrawCalls++;
    const insp = VILLAGERS[inspectedPawnIdx] || null;
    ctx.font = Math.max(9, 10 * z) + 'px system-ui, sans-serif';
    for(const id of Object.keys(ITEMS)){
      const it = ITEMS[id];
      let px = it.x, py = it.y;
      if(it.currentHolder && insp && it.currentHolder === insp.name){ px = insp.x; py = insp.y; }
      else if(it.currentHolder){
        const hv = VILLAGERS.find(p => p.name === it.currentHolder);
        if(hv){ px = hv.x; py = hv.y; }
      }
      if(px == null || py == null) continue;
      const s = w2s(px, py - 14);
      let label = (it.label || id) + ' ◇ ' + (it.currentHolder || 'ground');
      // Belief-scoped: what the INSPECTED villager believes — never actualOwner.
      if(insp && typeof getOwnershipBelief === 'function'){
        try{
          const bo = getOwnershipBelief(insp, id);
          if(bo && (bo.knownOwner || bo.suspectedOwner))
            label += ' (believes: ' + (bo.knownOwner || ('~' + bo.suspectedOwner)) + ')';
        }catch(e){}
      }
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const tw = ctx.measureText ? ctx.measureText(label).width : label.length * 6;
      ctx.fillRect(s[0] - tw / 2 - 3, s[1] - 11, tw + 6, 15);
      ctx.fillStyle = '#fde68a';
      ctx.fillText(label, s[0] - tw / 2, s[1]);
    }
  }

  if(DEBUG_OVERLAYS.beliefs){
    __dbgDrawCalls++;
    const insp = VILLAGERS[inspectedPawnIdx] || null;
    if(insp && typeof getOwnershipBelief === 'function'){
      for(const id of Object.keys(ITEMS)){
        const it = ITEMS[id];
        let px = it.x, py = it.y;
        const hv = it.currentHolder ? VILLAGERS.find(p => p.name === it.currentHolder) : null;
        if(hv){ px = hv.x; py = hv.y; }
        if(px == null || Math.hypot(px - insp.x, py - insp.y) > CS * 14) continue;
        let col = '#9ca3af', tag = '?'; // unknown
        try{
          const bo = getOwnershipBelief(insp, id);
          if(bo && bo.knownOwner){ col = '#4ade80'; tag = 'K'; }
          else if(bo && bo.suspectedOwner){ col = '#fbbf24'; tag = 'S'; }
        }catch(e){}
        const s = w2s(px, py - 30);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(s[0], s[1], 7 * z, 0, 7); ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.font = 'bold ' + Math.max(8, 9 * z) + 'px system-ui, sans-serif';
        ctx.fillText(tag, s[0] - 3 * z, s[1] + 3 * z);
      }
    }
  }

  if(DEBUG_OVERLAYS.zones){
    __dbgDrawCalls++;
    for(const b of VILLAGE_BUILDINGS){
      if(b.wx == null) continue;
      const s = w2s(b.wx * CS, b.wy * CS);
      const w = (b.tw || 4) * CS * z, h = (b.th || 3) * CS * z;
      ctx.strokeStyle = 'rgba(56,189,248,0.8)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s[0], s[1], w, h);
      ctx.fillStyle = 'rgba(56,189,248,0.9)';
      ctx.font = Math.max(9, 10 * z) + 'px system-ui, sans-serif';
      const nm = (b.name || b.id || 'bldg') + ((b.residents && b.residents.length) ? ' [' + b.residents.length + ']' : '');
      ctx.fillText(nm, s[0] + 3, s[1] + 12);
    }
    // Farm plots from crops
    ctx.fillStyle = 'rgba(74,222,128,0.25)';
    for(const c of CROPS){
      const s = w2s(c.wx * CS, c.wy * CS);
      ctx.fillRect(s[0], s[1], CS * z, CS * z);
    }
  }
}

/* ---- Event feed (DOM) ---- */
let __lastFeedSig = '';
let __feedEl = null; // cached: the feed div is static page furniture
function __getFeedEl(){
  if(!__feedEl){ try{ __feedEl = document.getElementById('debug-feed'); }catch(e){ __feedEl = null; } }
  return __feedEl;
}
function updateDebugFeed(){
  try{
    const el = __getFeedEl();
    if(!el) return;
    if(!DEBUG_OVERLAYS.feed){ if(el.style.display !== 'none'){ el.style.display = 'none'; } return; }
    el.style.display = 'block';
    const items = EVENTS.slice(-12);
    const sig = items.length ? (items[items.length - 1].seq + ':' + items.length) : 'empty';
    if(sig === __lastFeedSig) return;
    __lastFeedSig = sig;
    el.innerHTML = '<div class="dbg-feed-title">📜 event feed</div>' + items.map(e =>
      '<div class="dbg-feed-row"><span class="dbg-feed-day">d' + e.day + '</span> ' +
      escapeHtml22(e.kind) + ': ' + escapeHtml22(e.text) + '</div>'
    ).join('');
  }catch(e){}
}
function escapeHtml22(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---- Hook into the render chain (same wrap convention as other systems) ---- */
const __dpo22dbg = drawParityOverlay;
drawParityOverlay = function(){
  __dpo22dbg();
  try{ drawDebugOverlays(); }catch(e){ /* overlays must never break render */ }
};

/* ---- Bridge ---- */
window.__aiBridge.debugOverlays = function(){ return Object.assign({}, DEBUG_OVERLAYS); };
window.__aiBridge.setDebugOverlay = function(key, on){
  if(key in DEBUG_OVERLAYS){ DEBUG_OVERLAYS[key] = !!on; return true; }
  return false;
};

/* ---- Browser UI: debug toggle button + panel ---- */
(function wireDebugUI(){
  try{
    if(typeof document === 'undefined' || !document.getElementById) return;
    const btn = document.getElementById('btn-debug');
    const panel = document.getElementById('debug-panel');
    if(btn && panel && !btn.__wnWired){
      btn.__wnWired = true;
      btn.onclick = () => {
        const show = panel.style.display === 'none' || !panel.style.display;
        panel.style.display = show ? 'block' : 'none';
        btn.classList.toggle('active', show);
      };
      const boxes = panel.querySelectorAll ? panel.querySelectorAll('input[data-overlay]') : [];
      for(const cb of boxes){
        cb.onchange = () => { DEBUG_OVERLAYS[cb.getAttribute('data-overlay')] = cb.checked; };
      }
    }
  }catch(e){}
})();
