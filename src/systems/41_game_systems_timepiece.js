/* =====================================================================
   PART 41O — THE TIMEPIECE (v13 time perception)
   rw-time-perception-spec.md — the game-feedback fix.

   The bridge used to PUSH exact time on every read, and agents
   hallucinated on it (one glanced at a wall clock and believed it was
   midnight). This module makes time PERCEPTUAL:

   - sfAgentState no longer carries `time`. In its place: `senses`
     (light/weather/street-life — generated, never a template) and
     `felt` (a coarse estimate anchored on the pawn's last real clock
     check, per-pawn `lastClockCheck` = {said, at, day, source, turn}).
   - Exact time is PULLED: `?glance=phone|wallclock|ask`.
       phone     → exact sim time.
       wallclock → sim time + that venue's skew; only indoors, only
                   where a wall clock plausibly hangs.
       ask       → a neighbor quotes THEIR last check (skew propagates)
                   or guesses a band when they haven't looked.
   - `rest`/`sleep` route to shelter first: home, else the nearest
     enclosed POI. In rain, outdoor rest is REFUSED with a suggestion —
     the Jules-in-the-rain incident.
   ===================================================================== */

/* ---- wall clocks (businesses.json venues, skew in minutes) ----
   One room = one clock: Mudhaus Coffee IS Haus Coffee's parody twin —
   same room, same clock, same +10 minutes fast. */
const GS_CLOCK_SKEW = {
  'Haus Coffee': 10, 'Mudhaus Coffee': 10,
};
const GS_CLOCK_PLACES = {
  /* which enclosed venues actually hang a wall clock */
  'Haus Coffee': 1, 'Mudhaus Coffee': 1,
  'Auerbach Hardware': 1, 'Folsom Auto & Sons': 1,
  'Mission Branch Library': 1, 'Guerrero Market & Deli': 1,
  "Malik's Mini Mart": 1, 'Buy-Rite Market': 1, 'Bi-Rite Market': 1,
  'Baguette About It Bakery': 1, 'Tartine Bakery': 1,
  'Golden Hour Laundromat': 1,
};

/* ---- posted hours (world/businesses.json, keyed by BOTH the real and
   the parody name — same room keeps the same hours). wd = weekday
   [open,close] in sim hours, we = weekend; days limits to given dows
   (0=Sun). null we = closed weekends. Missing = can't tell. ---- */
const GS_POI_HOURS = {
  'Haus Coffee': { wd: [6.5, 19], we: [7, 20] },
  'Mudhaus Coffee': { wd: [6.5, 19], we: [7, 20] },
  'Cafe La Boheme': { wd: [6.5, 19], we: [7, 20] },
  'Taqueria El Farolito': { wd: [10, 25.5], we: [10, 26.5] },
  'Taqueria El Farolote': { wd: [10, 25.5], we: [10, 26.5] },
  'El Farolito Bar': { wd: [10, 25.5], we: [10, 26.5] },
  'Dolores Park Cafe': { wd: [7, 17], we: [7, 18] },
  'Dolores Perk': { wd: [7, 17], we: [7, 18] },
  'Bi-Rite Market': { wd: [8, 21], we: [8, 21] },
  'Buy-Rite Market': { wd: [8, 21], we: [8, 21] },
  'Bi-Rite Creamery': { wd: [11, 22], we: [11, 23] },
  'Buy-Rite Creamery': { wd: [11, 22], we: [11, 23] },
  'Delfina': { wd: [17.5, 22.5], we: [17.5, 23] },
  'Il Delfino': { wd: [17.5, 22.5], we: [17.5, 23] },
  'Tartine Bakery': { wd: [7, 15], we: [7, 16] },
  'Baguette About It Bakery': { wd: [7, 15], we: [7, 16] },
  '500 Club': { wd: [16, 26], we: [14, 26] },
  'The 600 Club': { wd: [16, 26], we: [14, 26] },
  'Dandelion Chocolate': { wd: [10, 19], we: [10, 20] },
  'Dandy Lion Chocolate Co.': { wd: [10, 19], we: [10, 20] },
  'Valencia Farmers Market': { days: [6], we: [8, 14] },
  'Valencia Growers Market': { days: [6], we: [8, 14] },
  '13 Bats Tattoo and Piercing': { wd: [12, 20], we: [12, 20] },
  'Needlepointe Tattoo': { wd: [12, 20], we: [12, 20] },
  'F. Lofrano and Son, Inc.': { wd: [8, 17.5], we: null },
  'Folsom Auto & Sons': { wd: [8, 17.5], we: null },
  'Guerrero Market & Deli': { wd: [7, 23], we: [8, 24] },
  'Guerrero Market': { wd: [7, 23], we: [8, 24] },
  "Malik's Mini Mart": { wd: [7, 23], we: [8, 24] },
  'Diosa Blooms': { wd: [9, 18], we: [10, 16] },
  'Bloom & Doom Flowers': { wd: [9, 18], we: [10, 16] },
  'Dog Eared Books': { wd: [11, 19], we: [10, 20] },
  'The Dusty Spine': { wd: [11, 19], we: [10, 20] },
  'Stranded Records': { wd: [11, 19], we: [11, 20] },
  'Marooned Records': { wd: [11, 19], we: [11, 20] },
  'Beretta': { wd: [17, 23], we: [15, 24] },
  'The Musket': { wd: [17, 23], we: [15, 24] },
  'Auerbach Hardware': { wd: [8, 18], we: [9, 17] },
  'Mission Branch Library': { wd: [10, 18], we: [10, 17] },
  'Golden Hour Laundromat': { wd: [7, 23], we: [7, 23] },
  'Frutería Las Palmas': { wd: [8, 18], we: [8, 18] },
  'SF General': { wd: [0, 24], we: [0, 24] },
};

/* ---------------- tiny time helpers ---------------- */
function gsTimeFmt(t){
  /* round to whole minutes FIRST — normalizing t then flooring the
     minute part loses an ulp at half-hour boundaries (15.8 -> 15:47) */
  const tot = Math.round((((t % 24) + 24) % 24) * 60) % (24 * 60);
  const h = Math.floor(tot / 60), m = tot % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}
function gsTimeDow(){
  /* the show runs on real PT dates (gsTodayStr) — dow from that */
  const s = (typeof gsTodayStr === 'function') ? gsTodayStr() : null;
  const d = s && gsDateParse(s);
  return d ? new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay()
           : ((typeof W !== 'undefined') ? (W.day + 4) % 7 : 0);
}
function gsPoiHours(name){ return GS_POI_HOURS[name] || null; }
function gsPoiOpenNow(name, tod){
  const h = gsPoiHours(name);
  if(!h) return null;                       // can't tell
  const dow = gsTimeDow();
  if(h.days && h.days.indexOf(dow) < 0) return false;
  const wknd = (dow === 0 || dow === 6);
  const span = wknd ? (h.we || h.wd) : (h.wd || h.we);
  if(!span) return false;
  const t = (tod != null) ? tod : ((typeof W !== 'undefined') ? W.tod : 12);
  return t >= span[0] && t < span[1];       // 25.5 = 1:30 next day —
}                                         // handled by caller wrap
function gsTimeAnchorDist(v){
  /* distance (cells) to the pawn's own home anchor, or Infinity */
  return (v && v.sfHome) ? Math.hypot(v.x - (v.sfHome.wx * CS + 16),
                                      v.y - (v.sfHome.wy * CS + 16)) / CS
                         : Infinity;
}

/* ---------------- senses — the default perception line ----------------
   Generated from light + weather + the street itself. No clock words:
   "you can tell the hour by the light, not by a number." */
function gsTimeSenses(v){
  const tod = (typeof W !== 'undefined' && W) ? W.tod : 12;
  const parts = [];
  /* light */
  const rain = (typeof W !== 'undefined' && W) ? (W.rain || 0) : 0;
  const storm = (typeof W !== 'undefined' && W) ? W.storm : 0;
  if(tod < 5 || tod >= 21.5)
    parts.push(rain > 0.05
      ? 'dark out, streetlights in the wet' : 'dark out');
  else if(tod < 6.5)
    parts.push('first light, the sky just starting to lift');
  else if(tod < 9)
    parts.push(rain > 0.05 ? 'a grey morning' : 'morning light');
  else if(tod < 12)
    parts.push(rain > 0.05 ? 'flat midday grey' : 'morning into midday');
  else if(tod < 15.5)
    parts.push(rain > 0.05 ? 'a grey afternoon' : 'afternoon light');
  else if(tod < 18)
    parts.push(rain > 0.05
      ? 'late-afternoon grey' : 'long afternoon shadows');
  else if(tod < 20)
    parts.push('evening — the sun going down');
  else
    parts.push(rain > 0.05 ? 'dusk in the rain' : 'dusk fading');
  /* weather */
  if(storm) parts.push('a real storm coming down');
  else if(rain > 0.05)
    parts.push(rain > 0.4 ? 'hard rain, gutters running' : 'light rain');
  /* street life — who's out, what's lit */
  if(v){
    let near = 0;
    for(const o of VILLAGERS)
      if(o !== v && !o.inBuilding &&
         Math.abs(o.x - v.x) < CS * 6 && Math.abs(o.y - v.y) < CS * 6)
        near++;
    if(!v.inBuilding){
      if(near === 0) parts.push('the block is quiet');
      else if(near < 4) parts.push('a few people out');
      else parts.push('the sidewalk is busy');
      /* nearest lit venue: a glow after dark, a door by day */
      let best = null, bd = 1e9;
      for(const p of SF_POIS){
        const d = Math.hypot(p.wx * CS + 16 - v.x, p.wy * CS + 16 - v.y);
        if(d < bd){ bd = d; best = p; }
      }
      if(best && bd < CS * 10){
        const open = gsPoiOpenNow(best.name, tod);
        const disp = (typeof sfDisplayName === 'function')
          ? sfDisplayName(best.name) : best.name;
        if(open === true)
          parts.push(tod >= 20 || tod < 6.5
            ? disp + ' is lit and open' : disp + ' is open');
        else if(open === false)
          parts.push(disp + ' is dark and shut');
      }
    } else {
      parts.push('inside ' + (v.inside ? ((typeof sfDisplayName ===
        'function') ? sfDisplayName(v.inside) : v.inside) : 'a building'));
    }
  }
  return parts.join('; ');
}

/* ---------------- felt — the coarse anchor line ----------------
   What the pawn THINKS the time is — anchored on their last check, not
   on the truth. If their last check was a skewed clock, their felt
   estimate drifts with it (that is the spec's whole point). */
function gsTimeFelt(v, opts){
  if(!v || !v.lastClockCheck)
    return "You haven't checked the time yet today.";
  const lc = v.lastClockCheck;
  const nowTod = (typeof W !== 'undefined') ? W.tod : 12;
  const sameDay = lc.day === ((typeof W !== 'undefined') ? W.day : 0);
  let ago;
  if(opts && opts.turn != null && lc.turn != null){
    const d = opts.turn - lc.turn;
    ago = d <= 0 ? 'just now' : (d === 1 ? 'a turn ago' : d + ' turns ago');
  } else {
    const el = sameDay ? Math.max(0, nowTod - lc.at) * 60 : 999;
    ago = el < 3 ? 'a moment ago' : el < 15 ? 'a few minutes ago'
      : el < 45 ? 'about half an hour ago' : el < 90 ? 'about an hour ago'
      : el < 240 ? 'a couple of hours ago' : 'hours ago';
  }
  const src = { phone: 'your phone', wallclock: 'the wall clock',
                ask: 'asking around' }[lc.source] || 'a clock';
  return 'You last checked ' + src + ' ' + ago + ' — it said ' +
    gsTimeFmt(lc.said) + '.';
}

/* ---------------- glance — the pulled clock check ----------------
   Returns {ok, said:'HH:MM', source} or {ok:false, err}. Records
   lastClockCheck either way a real check happened — the SAID time is
   what gets anchored (skew and all). */
function gsTimeGlance(v, src, opts){
  src = String(src || '').toLowerCase();
  const tod = (typeof W !== 'undefined') ? W.tod : 12;
  const mark = (said, source) => {
    v.lastClockCheck = { said, at: tod, source,
      day: (typeof W !== 'undefined') ? W.day : 0,
      turn: opts && opts.turn != null ? opts.turn : null };
    return { ok: true, said: gsTimeFmt(said), source };
  };
  if(src === 'phone' || src === 'phone_clock')
    return mark(tod, 'phone');
  if(src === 'wallclock' || src === 'clock' || src === 'wall'){
    if(!v.inBuilding)
      return { ok: false, err: 'no wall clock out here' };
    const name = v.inside;
    if(!GS_CLOCK_PLACES[name])
      return { ok: false, err: 'no clock on these walls' };
    return mark(tod + (GS_CLOCK_SKEW[name] || 0) / 60, 'wallclock');
  }
  if(src === 'ask' || src.indexOf('ask') === 0){
    /* nearest other pawn in the same space — they quote THEIR last
       check if it's fresh (<45 sim-min), else they guess a band */
    let best = null, bd = 1e9;
    for(const o of VILLAGERS){
      if(o === v || o.inBuilding !== v.inBuilding) continue;
      if(v.inBuilding && o.inside !== v.inside) continue;
      const d = Math.hypot(o.x - v.x, o.y - v.y);
      if(d < bd){ bd = d; best = o; }
    }
    if(!best || bd > CS * 4)
      return { ok: false, err: 'no one close enough to ask' };
    const lc = best.lastClockCheck;
    const fresh = lc && lc.day === ((typeof W !== 'undefined')
      ? W.day : 0) && (tod - lc.at) < 0.75;
    if(fresh){
      /* the neighbor quotes what THEIR clock said — skew propagates */
      const est = lc.said + (tod - lc.at);
      const jitter = ((hashString18(best.name + '|ask|' +
        Math.floor(tod * 4)) % 5) - 2) / 60;   // ±2 min human fuzz
      v._askedWho = best.name;
      const r = mark(est + jitter, 'ask');
      r.via = best.name; r.quoted = true;
      return r;
    }
    /* a guess — a band boundary ± 20-40 min of error, deterministic */
    const guess = Math.round(tod * 2) / 2 +
      ((hashString18(best.name + '|guess|' + tod.toFixed(0)) % 5) - 2) * 0.17;
    const r = mark(guess, 'ask');
    r.via = best.name; r.quoted = false;
    return r;
  }
  return { ok: false, err: 'unknown time source "' + src + '"' };
}

/* ---------------- shelter — where rest is legal ----------------
   Home first (the pawn's own door), else the nearest venue with a real
   interior (bld >= 0). Returns {label, cell:{wx,wy}, poi?, inside?}. */
function gsTimeShelter(v){
  if(!v) return null;
  /* home anchor: the pawn's own inside-block (anchor name survives the
     schedule's exit check) */
  if(v.sfSched){
    const hb = v.sfSched.find(b => b.inside);
    if(hb && hb.to && v.sfHome){
      /* a poi home reports its venue name (the clock may hang there);
         an anchor/latlon home is just 'home' — no fiction on the door */
      const inside = hb.to.poi ||
        ((typeof specInside === 'function' && hb.to.poi)
          ? specInside(hb.to) : null) || 'home';
      return { label: 'home', cell: v.sfHome,
               poi: hb.to.poi || null, inside };
    }
  }
  if(v.sfHome)
    return { label: 'home', cell: v.sfHome, inside: 'home' };
  /* nearest enclosed venue */
  let best = null, bd = 1e9;
  for(const p of SF_POIS){
    if(p.bld == null || p.bld < 0) continue;
    const d = Math.hypot(p.x - v.x, p.y - v.y);
    if(d < bd){ bd = d; best = p; }
  }
  if(!best) return null;
  const door = (typeof sfPoiDoor === 'function')
    ? sfPoiDoor(best) : null;
  return { label: (typeof sfDisplayName === 'function')
      ? sfDisplayName(best.name) : best.name,
    cell: door || { wx: best.wx, wy: best.wy },
    poi: best.name };
}
