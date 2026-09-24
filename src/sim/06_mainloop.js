/* ---------------------------------------------------------------------
   PART 7: MAIN LOOP & SIMULATION UPDATE
   --------------------------------------------------------------------- */
let lastTime = 0;
function loop(timestamp){
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (timestamp - lastTime) / 1000 || 0.016);
  lastTime = timestamp;
  G.frame++;
  G.inspectedVillager = VILLAGERS[inspectedPawnIdx];

  if(!W.paused){
    const dtH = (dt * W.speed * 2.5) / 60; // Simulation hours per frame
    simTick(dtH);
  }

  renderWorld();
  updateHUD();
}

function soulTick(v, dtH){
  bodyTick(v, dtH);
  /* v13: a parked agent order (or the driven flag it leaves behind)
     ticks through the NPC brain even on the audience-surrogate pawn —
     the order channel isn't possession, and a driven main must not
     freeze mid-order just because her slot anchors the camera */
  if(v.isNPC || v.sfAgent || v.sfAgentDriven) updateVillagerAI(v, dtH);
  else updatePlayerPawn(v, dtH);
}

function simTick(dtH){
  W.tod += dtH;
  if(W.tod >= 24){
    W.tod -= 24;
    W.day += 1;
    onDayPass();
  }

  // Wind vectors
  W.windAng += (fbm(W.day*0.3, 3.7, SEED+400, 2) - 0.5) * 0.5 * dtH;
  W.windSpd = clamp(W.windSpd + (hash2(Math.floor(W.day*10),7,SEED+401)-0.5)*0.3*dtH, 0.3, 3.0);

  // Weather systems drift
  const wxVX = Math.cos(W.windAng)*W.windSpd*40, wxVY = Math.sin(W.windAng)*W.windSpd*40;
  for(const s of systems){
    s.x += wxVX * dtH;
    s.y += wxVY * dtH;
    const R = 3000;
    if(s.x < -R) s.x += R*2; if(s.x > R) s.x -= R*2;
    if(s.y < -R) s.y += R*2; if(s.y > R) s.y -= R*2;
  }

  // Active weather front over the village center (0, 0)
  let villageLift = 0;
  for(const s of systems){
    const d2 = s.x*s.x + s.y*s.y, r2 = s.r*s.r;
    if(d2 < r2 * 4) villageLift += s.inten * Math.exp(-d2/r2);
  }

  W.rain = clamp(villageLift > 0.25 ? (villageLift - 0.25) * 1.4 : 0, 0, 1);
  W.storm = clamp(villageLift > 0.65 ? (villageLift - 0.65) * 2.0 : 0, 0, 1);

  // Diurnal temperature cycle
  const diurnal = Math.sin(((W.tod - 9)/24) * Math.PI*2);
  W.temp = 20.0 + diurnal * 6.5 - (W.rain * 3.5);

  // Villager biological ticks & autonomous schedules
  for(const v of VILLAGERS){
    soulTick(v, dtH);
  }

  for(const fn of SIM_TICKS) fn(dtH);
}

function onDayPass(){
  showToast(`✦ Day ${W.day} dawns over Willowbrook!`);
  // Season cycle: a 120-day year, 4 x 30-day seasons, cycling forever.
  // (Phase 4 fix: the old code pinned W.day >= 90 to permanent Winter,
  // which stopped crops forever and invalidated every multi-year test.)
  const YEAR_LEN = 120;
  if(!W.year || W.year < 1) W.year = Math.floor((W.day - 1) / YEAR_LEN) + 1;
  const doy = (W.day - 1) % YEAR_LEN; // 0-based day of the current year
  if(doy < 30) W.season = 'Spring';
  else if(doy < 60) W.season = 'Summer';
  else if(doy < 90) W.season = 'Autumn';
  else W.season = 'Winter';
  const yr = Math.floor((W.day - 1) / YEAR_LEN) + 1;
  if(yr !== W.year){
    W.year = yr;
    if(typeof logEvent === 'function') logEvent('year', 'Year ' + yr + ' begins in Willowbrook.');
  }
}
