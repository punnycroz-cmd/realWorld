/* ---------------------------------------------------------------------
   PART 9: HUD & RIMWORLD PAWN INSPECTOR UI
   --------------------------------------------------------------------- */
function updateHUD(){
  // Clock & Weather pills
  const hourInt = Math.floor(W.tod);
  const minInt = Math.floor((W.tod - hourInt)*60);
  const timeStr = `${String(hourInt).padStart(2,'0')}:${String(minInt).padStart(2,'0')}`;
  document.getElementById('ui-clock').textContent = `Day ${W.day} · ${W.season} · ${timeStr}`;

  let wxText = '⛅ Fair';
  if(W.storm > 0.2) wxText = '⛈️ Thunderstorm';
  else if(W.rain > 0.1) wxText = '🌧️ Rain';
  else if(W.temp > 26) wxText = '☀️ Warm & Sunny';
  // v47: the SF chip reports real conditions — wind (meteorological
  // FROM-direction in compass + knots off the Open-Meteo km/h feed),
  // live cloud cover, and Karl when the intrusion front is on the move
  if(typeof SF_MODE !== 'undefined' && SF_MODE){
    const wd = ['N','NE','E','SE','S','SW','W','NW'];
    const from = (((W.windAng || 0) * 180 / Math.PI) + 540) % 360;
    const kt = Math.round((W.windSpd || 0) * 10 / 1.852);
    const cov = Math.round((typeof sfCloudCover === 'function'
      ? sfCloudCover() : 0) * 100);
    wxText += ` · ${wd[Math.round(from / 45) % 8]} ${kt}kt · ${cov}%`;
    if(typeof sfKarlK === 'function' && sfKarlK() > 0.3) wxText += ' · Karl';
  }
  document.getElementById('ui-weather').textContent = wxText;
  document.getElementById('ui-temp').textContent = `${W.temp.toFixed(1)}°C`;

  // Pawn Inspector
  const v = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
  if(!v) return;

  document.getElementById('pi-name').textContent = v.name;
  document.getElementById('pi-role').textContent = v.role;

  const isCtrl = (v === VILLAGERS[controlledPawnIdx]);
  const badge = document.getElementById('pi-badge');
  const SF_UI = typeof SF_MODE !== 'undefined' && SF_MODE;
  if(SF_UI){
    // v54: spectator vocabulary — cast status, never "Controlled"
    const isMain = /^C[1-8]$/.test(v._castId || '');
    badge.textContent = isMain ? '🔒 MAIN CAST' : 'RESIDENT';
    badge.className = isMain ? 'pi-badge controlled' : 'pi-badge';
    badge.title = 'AI-driven — nobody can possess this character';
  } else {
    badge.textContent = isCtrl ? 'Controlled' : 'Autonomous AI';
    badge.className = isCtrl ? 'pi-badge controlled' : 'pi-badge';
    badge.title = '';
  }
  const tglBtn = document.getElementById('btn-toggle-ctrl');
  if(SF_UI){ if(tglBtn) tglBtn.style.display = 'none'; }
  else if(tglBtn) tglBtn.textContent = isCtrl ? 'Release to AI' : 'Take Control';

  // Swimming trait badge
  const sBadge = document.getElementById('pi-swim-badge');
  if(sBadge){
    if(v.canSwim){
      sBadge.className = 'pi-trait-badge pi-trait-swimmer';
      sBadge.textContent = `🏊 Swimmer (${Math.round((v.swimSkill||0.6)*100)}%)`;
    } else {
      sBadge.className = 'pi-trait-badge pi-trait-nonswimmer';
      sBadge.textContent = `🚫 Non-Swimmer (${v.swimReason || 'Cannot swim'})`;
    }
  }

  // Live status label
  let actStr = 'Resting peacefully';
  if(SF_UI){
    /* v54: honest labels — the old default called every unlisted state
       "Resting peacefully", so a barista mid-conversation read as asleep.
       In the Mission shell every state gets its own line and the
       fallback implies nothing. */
    const SF_ACT = {
      idle: 'Between things', rest: 'Taking a breather',
      talk: 'In conversation', sit: 'Sitting', serve: 'Serving customers',
      carry: 'Carrying supplies', eat: 'Eating', drink: 'Getting a drink',
      phone: 'On the phone', move: 'On the move',
      walk: 'Walking the block',
      work: `Working a shift (${(v.workProgress*100).toFixed(0)}%)`,
      sleep: 'Asleep',
      swim: 'Swimming', wade: 'Wading',
      drown_panic: '🚨 DROWNING! Panicking in deep water - cannot swim!',
    };
    actStr = SF_ACT[v.state] ||
      (v.body && v.body.hydration < 0.25 ? 'Looking for water' : 'Out and about');
  } else {
    if(v.state === 'drown_panic') actStr = '🚨 DROWNING! Panicking in deep water - cannot swim!';
    else if(v.state === 'swim') actStr = 'Swimming gracefully across deep lake';
    else if(v.state === 'wade') actStr = 'Wading in refreshing lake shallows';
    else if(v.state === 'work') actStr = `Working diligently (${(v.workProgress*100).toFixed(0)}%)`;
    else if(v.state === 'walk') actStr = 'Walking down village path';
    else if(v.state === 'sleep') actStr = 'Sleeping soundly in bed';
    else if(v.body && v.body.hydration < 0.25) actStr = 'Looking for water to drink';
  }
  document.getElementById('pi-act-label').textContent = actStr;

  // Real-time biological meters
  const b = ensureBody(v);
  document.getElementById('pi-val-food').textContent = `${(b.satiety*100).toFixed(0)}%`;
  document.getElementById('pi-fill-food').style.width = `${(b.satiety*100).toFixed(0)}%`;

  document.getElementById('pi-val-hydro').textContent = `${(b.hydration*100).toFixed(0)}%`;
  document.getElementById('pi-fill-hydro').style.width = `${(b.hydration*100).toFixed(0)}%`;

  document.getElementById('pi-val-rest').textContent = `${((1 - b.fatigue)*100).toFixed(0)}%`;
  document.getElementById('pi-fill-rest').style.width = `${((1 - b.fatigue)*100).toFixed(0)}%`;

  document.getElementById('pi-val-temp').textContent = `${b.coreTemp.toFixed(1)}°C`;
  const tempRatio = clamp((b.coreTemp - 35.0) / 4.0, 0, 1);
  document.getElementById('pi-fill-temp').style.width = `${(tempRatio*100).toFixed(0)}%`;

  document.getElementById('pi-val-mood').textContent = `${(v.mood*100).toFixed(0)}%`;
  document.getElementById('pi-fill-mood').style.width = `${(v.mood*100).toFixed(0)}%`;

  // Equipped Tool
  document.getElementById('pi-gear-icon').textContent = v.equippedTool.icon;
  document.getElementById('pi-gear-name').textContent = v.equippedTool.name;
  document.getElementById('pi-gear-desc').textContent = v.equippedTool.desc;

  // Thoughts
  const thList = document.getElementById('pi-th-list');
  thList.innerHTML = '';
  const thoughts = (v.thoughts && v.thoughts.length ? v.thoughts : bodyDrives(v)).slice(0, 4);
  for(const th of thoughts){
    const item = document.createElement('div');
    const isPos = (th.val >= 0);
    item.className = 'pi-thought-item ' + (isPos ? 'pi-thought-pos' : 'pi-thought-neg');
    item.innerHTML = `<span>${th.text}</span><span>${isPos?'+':''}${th.val||0}</span>`;
    thList.appendChild(item);
  }

  // Draw avatar portrait to inspector canvas
  drawInspectorAvatar(v);
}

function drawInspectorAvatar(v){
  const acv = document.getElementById('pi-avatar');
  const actx = acv.getContext('2d');
  actx.clearRect(0, 0, 44, 52);
  const F = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  if(F && F[0] && F[0].idle && F[0].idle[0]){
    actx.imageSmoothingEnabled = false;
    actx.drawImage(F[0].idle[0], -2, -6, 48, 64);
  }
}

function showToast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}
