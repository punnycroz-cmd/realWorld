/* ---- social: bonds, autonomous chats ---- */
function addBond(a, b, amt){
  if(!a || !b || a === b || a.dead || b.dead) return;
  const na = a.bonds[b.name] || 0;
  a.bonds[b.name] = clamp(na + amt, 0, 1);
  b.bonds[a.name] = clamp((b.bonds[a.name] || 0) + amt, 0, 1);
  const mA = a.bondMile;
  for(const th of [0.3, 0.6, 0.9]){
    const key = b.name + '_' + th;
    if(na < th && a.bonds[b.name] >= th && !mA[key]){
      mA[key] = 1;
      const label = th >= 0.9 ? 'close friends' : th >= 0.6 ? 'friends' : 'acquaintances';
      logEvent('bond', a.name + ' and ' + b.name + ' are now ' + label);
    }
  }
}
function socialTick(h){
  const awake = VILLAGERS.filter(v => !v.dead && !v.brainControlled &&
    (v.state === 'idle' || v.state === 'walk' || v.state === 'rest'));
  for(let i = 0; i < awake.length; i++) for(let j = i + 1; j < awake.length; j++){
    const a = awake[i], b = awake[j];
    if(distCells(a, b) < 6 && srand() < 0.12 * h){
      addBond(a, b, 0.03);
      a.mood = clamp(a.mood + 0.02, 0, 1); b.mood = clamp(b.mood + 0.02, 0, 1);
      a.state = 'chat'; b.state = 'chat'; a.chatT = 0.2; b.chatT = 0.2;
      const line = CHAT_LINES[Math.floor(srand() * CHAT_LINES.length)];
      witnessEvent(a, 'Chatted with ' + b.name + ': "' + line + '"');
      witnessEvent(b, 'Chatted with ' + a.name);
    }
  }
  for(const v of VILLAGERS){
    if(v.chatT > 0){ v.chatT -= h; if(v.chatT <= 0 && v.state === 'chat') v.state = 'idle'; }
  }
}