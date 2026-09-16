/* =====================================================================
   PART 12B: HONEST PERCEPTION — replaces the leaky PART 10 getPerception.
   Natura directive: a villager knows only what its senses deliver.
   NEVER exact temperatures, coordinates, or another villager's stats.
   ===================================================================== */
function compassDir(dx, dy){
  const dirs = ['east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north', 'northeast'];
  return dirs[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
}
function distWords(cells){
  if(cells < 4) return 'a few meters away';
  if(cells < 10) return 'nearby';
  if(cells < 25) return 'some distance away';
  return 'far away';
}
function sightRange(){
  let r = 30;
  if(isNight()) r *= 0.45;
  if(W.rain > 0.3) r *= 0.7;
  if(W.storm > 0.4) r *= 0.55;
  return r;
}
function activityWords(v){
  if(v.dead) return 'lying still on the ground';
  switch(v.state){
    case 'sleep': return v.inBuilding ? 'sleeping indoors' : 'sleeping out in the open';
    case 'work': return 'working';
    case 'walk': case 'wade': return 'walking';
    case 'swim': return 'swimming';
    case 'drown_panic': return 'flailing in deep water, in trouble';
    case 'eat': return 'eating';
    case 'drink': return 'drinking';
    case 'chat': return 'chatting with someone';
    case 'rest': return 'resting';
    default: return 'standing around';
  }
}
function timeWords(){
  const h = W.tod;
  if(h < 5) return 'deep night';
  if(h < 6.5) return 'first light of dawn';
  if(h < 9) return 'morning light';
  if(h < 12) return 'late morning';
  if(h < 15) return 'midday sun';
  if(h < 17.5) return 'afternoon light';
  if(h < 19.5) return 'dusk';
  if(h < 21) return 'twilight';
  return 'night';
}
function weatherWords(){
  if(W.storm > 0.4) return 'a raging storm';
  if(W.rain > 0.5) return 'heavy rain';
  if(W.rain > 0.15) return 'light rain';
  if(W.temp > 30) return 'hot sun';
  if(W.temp < 5) return 'bitter cold';
  if(W.temp < 12) return 'chilly air';
  return 'mild and clear';
}
function pileWords(p){
  const parts = [];
  for(const k of Object.keys(p.items)){
    if(p.items[k] > 0) parts.push(p.items[k] + ' ' + k + (p.items[k] > 1 ? 's' : ''));
  }
  return parts.length ? parts.join(', ') : 'an empty pile';
}
function invWords(v){
  const out = [];
  for(const k of Object.keys(v.inv || {})){
    if(v.inv[k] > 0) out.push(v.inv[k] + ' ' + k + (v.inv[k] > 1 ? 's' : ''));
  }
  return out;
}
window.__aiBridge.getPerception = function(name){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return null;
  if(v.dead) return { name: v.name, dead: true, deathCause: v.deathCause };
  const range = sightRange();
  const see = [], hear = [], nearby = [];
  for(const o of VILLAGERS){
    if(o === v) continue;
    const dc = distCells(v, o);
    if(dc <= range){
      see.push({
        who: o.name + ', ' + o.role,
        doing: activityWords(o),
        where: compassDir(o.x - v.x, o.y - v.y),
        distance: distWords(dc)
      });
    } else if(dc <= 40 && (o.state === 'chat')){
      hear.push({ who: o.name, what: 'talking', where: compassDir(o.x - v.x, o.y - v.y) });
    }
  }
  const near2 = (x, y) => {
    const dc = Math.hypot((x - v.x) / CS, (y - v.y) / CS);
    return dc <= range ? { where: compassDir(x - v.x, y - v.y), distance: distWords(dc), _d: dc } : null;
  };
  const pushNear = (what, x, y) => {
    const n = near2(x, y);
    if(n) nearby.push({ what, where: n.where, distance: n.distance, _d: n._d });
  };
  for(const o of VILLAGE_OBJECTS){
    if(o.kind === 'well') pushNear('a stone well', o.x, o.y);
    else if(o.kind === 'firepit') pushNear('a campfire ring', o.x, o.y);
    else if(o.kind === 'anvil') pushNear('a blacksmith anvil', o.x, o.y);
    else if(o.kind === 'bench') pushNear('a wooden bench', o.x, o.y);
    else if(o.kind === 'lamp') pushNear('a street lamp', o.x, o.y);
  }
  for(const f of FIRES){
    if(f.burnH > 0) pushNear('a burning campfire', f.x, f.y);
  }
  for(const p of PILES) pushNear('a pile of ' + pileWords(p), p.x, p.y);
  for(const c of CROPS){
    if(c.stage >= 2) pushNear('crop rows, ready to harvest', c.wx * CS + 16, c.wy * CS + 16);
    else pushNear('young crop rows', c.wx * CS + 16, c.wy * CS + 16);
  }
  for(const c of CHICKENS) pushNear('a chicken', c.x, c.y);
  let trees = 0;
  for(const t of WILDTREES){
    if(trees >= 4) break;
    const n = near2(t.wx * CS + 16, t.wy * CS + 16);
    if(n){ nearby.push({ what: 'a tree', where: n.where, distance: n.distance, _d: n._d }); trees++; }
  }
  for(const b of BURNING) pushNear('wildfire flames', b.wx * CS + 16, b.wy * CS + 16);
  nearby.sort((a, b2) => a._d - b2._d);
  const nearOut = nearby.slice(0, 14).map(n => ({ what: n.what, where: n.where, distance: n.distance }));
  const bonds = [];
  for(const n of Object.keys(v.bonds || {})){
    const x = v.bonds[n];
    bonds.push({ name: n, closeness: x >= 0.75 ? 'close friend' : x >= 0.5 ? 'friend' : x >= 0.25 ? 'acquaintance' : 'stranger' });
  }
  return {
    name: v.name,
    role: v.role,
    time: timeWords(),
    season: W.season,
    weather: weatherWords(),
    body: bodyDrives(v).map(d => d.text),
    carrying: invWords(v),
    see, hear,
    nearby: nearOut,
    bonds,
    danger: (v.danger || []).slice(),
    events: (v.events || []).slice(-8)
  };
};
/* Quiet-mode event feed for brain memory consolidation. */
window.__aiBridge.getEvents = function(since){
  since = since || 0;
  return EVENTS.filter(e => e.seq > since);
};
