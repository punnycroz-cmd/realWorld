/* ---------------------------------------------------------------------
   PART 5: VILLAGER ROSTER INITIALIZATION
   --------------------------------------------------------------------- */
function createVillager(name, role, homeId, wx, wy, options){
  const opt = options || {};
  const v = {
    name, role: role || 'Villager', homeId: homeId || null,
    x: wx * CS + 16, y: wy * CS + 16,
    targetX: wx * CS + 16, targetY: wy * CS + 16,
    workWx: wx, workWy: wy,
    face: opt.face || 0, state: 'idle', moving: false, walkPhase: 0,
    seed: (opt.seed != null ? opt.seed : 1),
    isNPC: (opt.isNPC !== false), inBuilding: false,
    canSwim: (opt.canSwim !== false),
    swimSkill: (opt.swimSkill != null ? opt.swimSkill : 0.6),
    swimReason: opt.swimReason || '',
    workProgress: 0, triumphT: 0,
    equippedTool: opt.equippedTool || { kind: opt.toolKind || 'none', name: opt.toolName || '', icon: opt.toolIcon || '', desc: opt.toolDesc || '' },
    mood: 0.95, hunger: 0.9, energy: 0.9, hydration: 0.9, coreTemp: 37.0,
    thoughts: opt.thoughts || [],
    sex: opt.sex || 'm',
    ageY: opt.ageY != null ? opt.ageY : 25,
    stage: opt.stage || null,
    adult: (opt.adult != null ? opt.adult : true),
    childScale: opt.childScale || 1.0,
    inv: opt.inv || {},
    bonds: opt.bonds || {},
    bondMile: opt.bondMile || {},
    danger: [], events: [], plan: [],
    brainControlled: !!opt.brainControlled,
    // Construction-time control is an explicit hold (caravan outsiders, test
    // pawns): it does not auto-release when the plan drains.
    brainControlledHold: !!opt.brainControlled,
    pregnant: null, chatT: 0,
    motherId: opt.motherId || null,
    fatherId: opt.fatherId || null,
    spouseId: opt.spouseId || null,
    householdId: opt.householdId || null,
    lastContact: opt.lastContact || {},
    activityCounts: opt.activityCounts || { farming: 0, crafting: 0, cooking: 0, fishing: 0, trading: 0 },
    occupation: opt.occupation || null
  };
  ensureBody(v);
  if(v.body.hygiene == null) v.body.hygiene = 1.0;
  if(typeof updateLifeStage === 'function') updateLifeStage(v);
  else {
    v.stage = (v.ageY <= 12 ? 'child' : (v.ageY <= 17 ? 'youth' : (v.ageY >= 60 ? 'elder' : 'adult')));
    v.adult = (v.stage === 'adult' || v.stage === 'elder');
    if(v.stage === 'child') v.childScale = clamp(0.55 + v.ageY * 0.035, 0.55, 0.95);
  }
  if(typeof ensurePersonality === 'function') ensurePersonality(v);
  if(typeof ensureEpistemic === 'function') ensureEpistemic(v);
  if(typeof ensureSkills === 'function') ensureSkills(v);
  return v;
}

/* Generic spawn-a-villager factory (production). Used by the caravan system
   (15c_caravan.js) for outsider traders — previously it called the test-only
   mkTestV13, which made shipped production code depend on a test module.
   Test factories (mkTestV13 et al.) are thin wrappers over this. */
function mkVillager(name, wx, wy, extra){
  const v = Object.assign({
    name, role:'Villager', homeId:'inn',
    x:wx * CS + 16, y:wy * CS + 16, targetX:null, targetY:null,
    face:0, state:'idle', moving:false, walkPhase:0, seed:1,
    isNPC:true, inBuilding:false, canSwim:true, swimSkill:0.5, swimReason:'',
    workProgress:0, triumphT:0,
    equippedTool:{ kind:'none', name:'', icon:'', desc:'' },
    mood:0.9, hunger:0.9, energy:0.9, hydration:0.9, coreTemp:37.0, thoughts:[],
    sex:'m', ageY:30, adult:true, childScale:1, gold:25, dreams:[],
    inv:{}, bonds:{}, bondMile:{}, danger:[], events:[], plan:[],
    brainControlled:false, pregnant:null, chatT:0
  }, extra || {});
  ensureBody(v); v.body.injury = 0; v.body.illness = 0;
  VILLAGERS.push(v);
  return v;
}

/* Trait-based courage check — replaces the `v.name === 'Gareth'` hacks.
   Bravery is a roster/traits fact, not a name: it survives renames, births
   and new characters (the E4 Gareth regression proved the hazard). */
function isBrave(v){
  return !!(v && ((v.traits && v.traits.indexOf('brave') >= 0) ||
    (v.personality && v.personality.brave != null && v.personality.brave > 1.2)));
}

function initVillagers(){
  VILLAGERS.length = 0;
  function makeV(name, role, homeId, wx, wy, toolKind, toolName, toolIcon, toolDesc, thoughts, canSwim, swimSkill, swimReason){
    const v = createVillager(name, role, homeId, wx, wy, {
      toolKind, toolName, toolIcon, toolDesc, thoughts, canSwim, swimSkill, swimReason
    });
    VILLAGERS.push(v);
    return v;
  }

  makeV('Marta', 'Village Farmer', 'farmhouse', -12, -3, 'hoe', 'Sturdy Farming Hoe', '🌾',
    'Hand-forged hoe blade, ash wood handle.', [{text:'The soil is rich and generous today', val:5}],
    true, 0.6, 'Strong farm swimmer');

  makeV('Bram', 'Master Blacksmith', 'smithy', -10, 8, 'hammer', 'Smithing Hammer', '⚒️',
    'Dense cast steel hammer for anvil shaping.', [{text:'Good steel takes patience and heat', val:5}],
    false, 0.0, 'Dense blacksmith physique');
  const bramObj = VILLAGERS.find(v => v.name === 'Bram');
  if(bramObj) bramObj.face = 3;

  makeV('Sella', 'Baker & Shopkeeper', 'shop', 10, -9, 'rollingpin', 'Maple Rolling Pin', '🥖',
    'Smooth carved maple pin for sourdough loaves.', [{text:'Fresh bread aroma fills the street', val:5}],
    false, 0.0, 'Never learned to swim');

  makeV('Tobin', 'Innkeeper', 'inn', 7, 9, 'mug', 'Cellar Ale Tankard', '🍺',
    'Oak tankard with cellar-chilled brew.', [{text:'The tavern fireplace is roaring and warm', val:5}],
    true, 0.5, 'Casual river swimmer');

  makeV('Wren', 'Herbalist & Apothecary', 'herbhut', 16, -1, 'broom', 'Herbalist Broom', '🌿',
    'Lavender-scented broom for herb bundling.', [{text:'Sage and thyme harvested in peak bloom', val:4}],
    true, 0.6, 'Practiced stream bather');

  makeV('Finn', 'Pond Fisherman', 'fishhut', 16, 8, 'rod', 'Willow Fishing Rod', '🎣',
    'Bending willow pole with silken line.', [{text:'Quiet morning ripples by the water', val:4}],
    true, 1.0, 'Master fisherman & diver');

  makeV('Alden', 'Village Mayor', 'townhall', 0, -10, 'scroll', 'Mayor’s Walking Cane', '📜',
    'Polished walnut cane with brass pommel.', [{text:'Order and prosperity in the valley', val:4}],
    false, 0.0, 'Elderly mayor with cane');

  makeV('Pip', 'Village Kid', 'house1', 1, -1, 'ball', 'Oak Slingshot', '🎯',
    'Forked oak branch with leather pouch.', [{text:'Playing games under the morning sun!', val:6}],
    true, 0.8, 'Nimble kid & lake diver');

  // Wandering Visitors
  makeV('Rowan', 'Traveling Bard', 'inn', 3, 2, 'lute', 'Carved Pine Lute', '🎵',
    'Resonant lute crafted from ancient pines.', [{text:'Ballads sound lovely in this cozy valley', val:5}],
    true, 0.5, 'Traveling river swimmer');

  makeV('Clara', 'Silk Merchant', 'inn', -1, 0, 'basket', 'Silk Merchant Basket', '🧺',
    'Woven basket overflowing with exotic fabrics.', [{text:'Fine trade and friendly villagers', val:4}],
    true, 0.5, 'Silk merchant river bather');

  makeV('Gareth', 'Wandering Knight', 'inn', 0, 11, 'sword', 'Silver Longsword', '⚔️',
    'Gleaming castle-forged blade inscribed with vows.', [{text:'A peaceful haven away from royal intrigue', val:6}],
    false, 0.0, 'Heavy iron armor (35kg)');
  // A knight is brave by vocation — the trait, not the name, drives
  // wolf-deterrence / stand-ground / rescue-willingness checks.
  const garethObj = VILLAGERS.find(v => v.name === 'Gareth');
  if(garethObj){
    garethObj.traits = ['brave'];
    garethObj.personality = Object.assign({}, garethObj.personality, { brave: 1.5 });
  }

  // Player controls Marta initially
  VILLAGERS[0].isNPC = false;
  controlledPawnIdx = 0;
  inspectedPawnIdx = 0;

  // 7A: seed guilds from cultural priors so the guild system is alive in a
  // real game (masters: Bram→smith, Sella→baker, Marta→farmer).
  if(typeof seedGuilds === 'function') seedGuilds();
}
