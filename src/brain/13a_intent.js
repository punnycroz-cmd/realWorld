/* =====================================================================
   PART 13A: PLAIN-WORD INTENT PLANNER (Natura v8 design)
   The brain speaks plain words ("stoke the fire"); a deterministic
   registry compiles them into real multi-step verb plans executed over
   ticks, interruptible by survivalGuard. Text that matches nothing is
   logged as a DREAM per villager and NEVER squashed to the nearest verb.
   The same undoable intent 3x -> flagged in the global capabilityGaps.
   ===================================================================== */
function findPerson(name){
  const n = String(name || '').toLowerCase();
  return VILLAGERS.find(o => !o.dead && o.name.toLowerCase() === n) || null;
}
function capName(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s; }
function normItem(s){
  s = String(s || '').toLowerCase();
  if(s === 'breads') return 'bread';
  if(s === 'eggs') return 'egg';
  if(s === 'meals') return 'meal';
  return s;
}
const INTENT_PATTERNS = [
  { re: /\b(stoke|tend|feed|keep|bank)\b.{0,20}\b(fire|campfire|flames|hearth)\b/,
    plan: () => [{ verb:'take', what:'log', from:'pile' }, { verb:'go', place:'firepit' }, { verb:'use', what:'log', on:'firepit' }] },
  { re: /\b(build|make)\b.{0,15}\b(campfire|fire ?pit|bonfire)\b/,
    plan: () => [{ verb:'build', what:'campfire' }] },
  { re: /\b(chop|gather|fetch|collect|cut)\b.{0,20}\b(wood|logs?|firewood|lumber|timber)\b/,
    plan: () => [{ verb:'fell' }, { verb:'take', what:'log', from:'pile' }] },
  { re: /\bcook\b.{0,20}\b(meal|dinner|supper|lunch|breakfast|food)\b/,
    plan: () => [{ verb:'go', place:'firepit' }, { verb:'cook' }] },
  { re: /\bcook\b.{0,15}\b(fish|meat)\b/,
    plan: () => [{ verb:'go', place:'firepit' }, { verb:'cook' }] },
  { re: /\bgo\b.{0,10}\bfishing\b|\bfishing\b|\bcatch\b.{0,15}\bfish\b/,
    plan: () => [{ verb:'go', place:'lake' }, { verb:'fish', hours:2 }] },
  { re: /\bharvest\b|\btend\b.{0,15}\bcrops?\b|\bwork\b.{0,15}\bfields?\b/,
    plan: () => [{ verb:'farm' }] },
  { re: /\b(collect|gather)\b.{0,15}\beggs?\b/,
    plan: () => [{ verb:'go', place:'coop' }, { verb:'take', what:'egg', from:'pile' }] },
  { re: /\bbutcher\b/,
    plan: () => [{ verb:'butcher' }] },
  { re: /\bbury\b(?:\s+(?:the\s+)?(\w+))?/,
    plan: (m) => {
      let nm = m[1] ? capName(m[1]) : null;
      if(nm === 'Dead' || nm === 'Them' || nm === 'Him' || nm === 'Her') nm = null;
      return [{ verb:'bury', name:nm }];
    } },
  { re: /\brepair\b/,
    plan: () => [{ verb:'build', what:'repair' }] },
  { re: /\brebuild\b/,
    plan: () => [{ verb:'build', what:'rebuild' }] },
  { re: /\bbuy\b.{0,25}\b(breads?|fish|eggs?|meals?|cookedfish|cookedmeat)\b/,
    plan: (m) => [{ verb:'buy', what:normItem(m[1]) }] },
  { re: /\bsell\b(?:\s+(?:my\s+|some\s+|the\s+)?(\w+))?/,
    plan: (m) => [{ verb:'sell', what:m[1] ? normItem(m[1]) : 'fish' }] },
  { re: /\btalk to (\w+)(.*)/,
    plan: (m, v, orig) => {
      const t = findPerson(m[1]);
      if(!t) return null;
      const om = String(orig || '').match(/\btalk to \w+(.*)/i);
      let about = om && om[1] ? om[1].replace(/^\s*about\s+/i, '').trim() : '';
      return [{ verb:'go', person:t.name },
              { verb:'speak', to:t.name, text: about ? ('About ' + about + '.') : ('Hello, ' + t.name + '.') }];
    } },
  { re: /\brest\b|\btake\b.{0,10}\bnap\b/,
    plan: () => [{ verb:'rest', hours:1 }] },
  { re: /\bsleep\b|\bgo to bed\b|\bturn in\b/,
    plan: () => [{ verb:'sleep', hours:8 }] },
  { re: /\bforage\b|\bgather\b.{0,15}\bberries\b|\bpick\b.{0,15}\bberries\b/,
    plan: () => [{ verb:'forage' }] },
  { re: /\beat\b|\bhave\b.{0,12}\b(lunch|dinner|breakfast|bite|meal|supper)\b/,
    plan: () => [{ verb:'eat' }] },
  { re: /\b(fetch|get|bring)\b.{0,15}\bwater\b|\bdrink\b/,
    plan: () => [{ verb:'go', place:'well' }, { verb:'drink' }] },
];
function parseIntent(v, text){
  const orig = String(text || '');
  const t = orig.toLowerCase();
  for(const p of INTENT_PATTERNS){
    const m = t.match(p.re);
    if(m){
      const steps = p.plan(m, v, orig);
      if(steps && steps.length) return { ok:true, steps };
      return { ok:false };
    }
  }
  return { ok:false };
}
const CAPABILITY_GAPS = [];
function logDream(v, text){
  if(!v.dreams) v.dreams = [];
  let d = v.dreams.find(x => x.text === text);
  if(!d){ d = { text:text, count:0, firstDay:W.day }; v.dreams.push(d); }
  d.count++; d.lastDay = W.day;
  if(d.count >= 3 && CAPABILITY_GAPS.indexOf(text) === -1){
    CAPABILITY_GAPS.push(text);
    logEvent('capability_gap', 'No villager knows how to: ' + text);
  }
  return d;
}
window.__aiBridge.postIntent = function(name, text){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return { ok:false, reason:'no such villager' };
  if(v.dead) return { ok:false, reason:'villager is dead' };
  text = String(text || '').trim();
  if(!text) return { ok:false, reason:'empty intent' };
  const r = parseIntent(v, text);
  if(!r.ok){
    const d = logDream(v, text);
    return { ok:false, reason:'not understood', dream:true, dreamCount:d.count };
  }
  v.plan = v.plan.concat(r.steps);
  v.brainControlled = true;
  witnessEvent(v, 'Decided to: ' + text);
  return { ok:true, queued:r.steps.length, intent:text };
};
window.__aiBridge.getDreams = function(name){
  const v = VILLAGERS.find(p => p.name === name);
  if(!v) return null;
  return (v.dreams || []).slice();
};
window.__aiBridge.getCapabilityGaps = function(){ return CAPABILITY_GAPS.slice(); };
