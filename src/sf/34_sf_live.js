/* =====================================================================
   PART SF-5: LIVE WORLD — real SF weather + real SF clock.
   Open-Meteo (no key, CORS-open) for 37.7596,-122.4269 wired into
   W.temp/W.hum/W.rain/W.storm/W.windAng. Day/night synced to
   America/Los_Angeles. All failures degrade gracefully to a mild
   default; the sim never depends on the network.
   ===================================================================== */
const SF_LAT = 37.7596, SF_LON = -122.4269;
let sfLastFetch = 0;          // ms epoch of last weather fetch attempt
let sfClockT = 0;             // accumulator for clock re-sync

/* real wall-clock time in America/Los_Angeles -> W.tod/W.day/W.season */
function sfSyncClock(){
  try{
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour12: false,
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      month: 'numeric', day: 'numeric',
    }).formatToParts(new Date());
    const p = {};
    for(const q of parts) p[q.type] = q.value;
    W.tod = (+p.hour % 24) + (+p.minute) / 60 + (+p.second) / 3600;
    W.day = +p.day;
    const mo = +p.month;
    W.season = mo < 3 || mo === 12 ? 'Winter' : mo < 6 ? 'Spring'
             : mo < 9 ? 'Summer' : 'Autumn';
  }catch(e){ /* Intl/tz missing: leave sim clock alone */ }
}

async function sfFetchWeather(){
  try{
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + SF_LAT +
      '&longitude=' + SF_LON +
      '&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code';
    const res = await fetch(url);
    if(!res.ok) return;
    const j = await res.json();
    const c = j.current;
    if(!c) return;
    if(c.temperature_2m != null) W.temp = c.temperature_2m;
    if(c.relative_humidity_2m != null) W.hum = c.relative_humidity_2m / 100;
    if(c.precipitation != null) W.rain = clamp(c.precipitation / 4, 0, 1);
    if(c.cloud_cover != null) SF_WX.cover = c.cloud_cover / 100;
    if(c.weather_code != null)
      W.storm = (c.weather_code >= 95) ? 0.9 : (c.weather_code >= 80 ? 0.25 : 0);
    if(c.wind_direction_10m != null) W.windAng = c.wind_direction_10m * Math.PI / 180;
    if(c.wind_speed_10m != null) W.windSpd = clamp(c.wind_speed_10m / 10, 0.2, 4);
  }catch(e){ /* offline/file:// — keep defaults */ }
}

/* registered sim tick: throttle via real elapsed ms (sim-speed independent) */
let sfLastMs = 0;
function sfLiveTick(dtH){
  if(!SF_MODE) return;
  const now = Date.now();
  if(now - sfLastMs < 2000) return;
  sfLastMs = now;
  sfSyncClock();
  if(now - sfLastFetch > 10 * 60 * 1000){
    sfLastFetch = now;
    if(typeof fetch === 'function' &&
        (typeof navigator === 'undefined' || navigator.onLine !== false))
      sfFetchWeather();
  }
}
registerSimTick(sfLiveTick);
if(SF_MODE) sfSyncClock();
