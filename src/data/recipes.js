/* =====================================================================
   PHASE 2A: RECIPE TABLE & ITEM PROVENANCE
   Data-driven production definitions and lifecycle provenance tracking.
   All modules share one script scope: top-level names are unique.
   ===================================================================== */

/* ---- Recipe Table ---- */
const RECIPE_TABLE = {
  // WOOD CHAIN
  // NOTE (Phase 2A): tools are descriptive metadata only. This game has no
  // tool *items* in villager inventories (no axe/saw/hammer item exists), so
  // toolsRequired is [] — the executor enforces a required tool only when it
  // names a real inventory item. When tool items are added (Phase 2E), fill
  // these in and the executor will gate on them automatically.
  fell_tree: {
    id: 'fell_tree',
    name: 'Fell Tree',
    inputs: {},
    outputs: { log: 3 },
    tools: ['axe'],
    toolsRequired: [],
    skill: 'foraging',
    minLevel: 0,
    workTime: 1.2,
    workstation: 'none'
  },
  plank: {
    id: 'plank',
    name: 'Saw Planks',
    inputs: { log: 1 },
    outputs: { plank: 2 },
    tools: ['saw'],
    toolsRequired: [],
    skill: 'building',
    minLevel: 0,
    workTime: 0.5,
    workstation: 'workbench',
    identifiedOutputs: true // Phase 2F: planks get stable identity + material lineage
  },
  furniture: {
    id: 'furniture',
    name: 'Craft Furniture',
    inputs: { plank: 2 },
    outputs: { furniture: 1 },
    tools: ['hammer'],
    toolsRequired: [],
    skill: 'building',
    minLevel: 1,
    workTime: 1.0,
    workstation: 'workbench',
    identifiedOutputs: true // Phase 2F: furniture gets stable identity + parent linkage
  },

  // GRAIN CHAIN
  harvest_crop: {
    id: 'harvest_crop',
    name: 'Harvest Crop',
    inputs: {},
    outputs: { crop: 2 },
    tools: ['hoe'],
    toolsRequired: [],
    skill: 'farming',
    minLevel: 0,
    workTime: 0.4,
    workstation: 'none'
  },
  flour: {
    id: 'flour',
    name: 'Mill Flour',
    inputs: { crop: 1 },
    outputs: { flour: 1 },
    tools: [],
    toolsRequired: [],
    skill: 'farming',
    minLevel: 0,
    workTime: 0.5,
    workstation: 'none'
  },
  bread: {
    id: 'bread',
    name: 'Bake Bread',
    inputs: { flour: 1 },
    outputs: { bread: 1 },
    tools: ['rollingpin'],
    toolsRequired: [],
    skill: 'cooking',
    minLevel: 0,
    workTime: 0.6,
    workstation: 'firepit'
  }
};

// Convenient aliases for recipe lookup
RECIPE_TABLE.saw_plank = RECIPE_TABLE.plank;
RECIPE_TABLE.craft_furniture = RECIPE_TABLE.furniture;
RECIPE_TABLE.table = RECIPE_TABLE.furniture;
RECIPE_TABLE.harvest_grain = RECIPE_TABLE.harvest_crop;
RECIPE_TABLE.grain = RECIPE_TABLE.harvest_crop;
RECIPE_TABLE.mill_flour = RECIPE_TABLE.flour;
RECIPE_TABLE.bake_bread = RECIPE_TABLE.bread;
RECIPE_TABLE.wood = RECIPE_TABLE.fell_tree;
RECIPE_TABLE.log = RECIPE_TABLE.fell_tree;

/* ---- Recipe Lookup Helpers ---- */
function getRecipe(id){
  if(!id) return null;
  if(RECIPE_TABLE[id]) return RECIPE_TABLE[id];
  const s = String(id).toLowerCase();
  for(const k in RECIPE_TABLE){
    if(k.toLowerCase() === s) return RECIPE_TABLE[k];
    if(RECIPE_TABLE[k].id && RECIPE_TABLE[k].id.toLowerCase() === s) return RECIPE_TABLE[k];
    if(RECIPE_TABLE[k].outputs && RECIPE_TABLE[k].outputs[id]) return RECIPE_TABLE[k];
  }
  return null;
}
const findRecipe = getRecipe;

/* ---- Provenance System ---- */
function createProvenance(creator, materials, quality, owner, createdAt){
  const day = (createdAt != null) ? createdAt : ((typeof W !== 'undefined' && W.day != null) ? W.day : 1);
  let q = (quality != null) ? quality : 0.5;
  q = clamp(Number(q) || 0.5, 0.05, 1.0);
  return {
    creator: creator || 'Unknown',
    materials: materials ? Object.assign({}, materials) : {},
    quality: q,
    condition: 1.0,
    owner: owner || creator || 'Village',
    createdAt: day,
    history: []
  };
}

function calcSkillQuality(v, skillName){
  const lvl = (typeof skillLvl === 'function' && v) ? skillLvl(v, skillName) : 1;
  // Level 1 -> ~0.37, Level 5 -> ~0.65, Level 10 -> 1.0. Always > 0 and <= 1.0.
  return clamp(0.3 + (lvl / 10) * 0.7, 0.05, 1.0);
}

function recordUsage(prov, action, by){
  if(!prov) return;
  prov.history = prov.history || [];
  prov.history.push({
    action: action || 'used',
    by: by || 'someone',
    day: (typeof W !== 'undefined' && W.day != null) ? W.day : 1
  });
}

/* ---- Inventory Provenance Attachment & Retrieval ---- */
function attachItemProvenance(v, what, qty, prov){
  if(!v) return;
  v.itemProv = v.itemProv || {};
  v.invProv = v.itemProv; // alias
  v.invStacks = v.invStacks || {};
  const list = v.itemProv[what] = v.itemProv[what] || [];
  if(prov){
    for(let i = 0; i < qty; i++){
      list.push(Object.assign({}, prov, { history: (prov.history || []).slice() }));
    }
  }
  v.invStacks[what] = {
    kind: what,
    get qty(){ return (v.inv && v.inv[what]) || 0; },
    get prov(){ return (list && list[list.length - 1]) || null; },
    get provenance(){ return (list && list[list.length - 1]) || null; }
  };
}

function getItemProvenance(v, what){
  if(!v) return null;
  if(v.itemProv && v.itemProv[what] && v.itemProv[what].length){
    return v.itemProv[what][v.itemProv[what].length - 1];
  }
  if(v.invProv && v.invProv[what] && v.invProv[what].length){
    return v.invProv[what][v.invProv[what].length - 1];
  }
  if(v.invStacks && v.invStacks[what]){
    return v.invStacks[what].prov || v.invStacks[what].provenance;
  }
  return null;
}

/* ---- Provenance transfer (Phase 2A fix): records ride with the items ----
   Villager store: v.itemProv[what] = [records] (existing).
   Pile store:     p.prov[what]    = [records] (new, parallel to p.items).
   Counts (v.inv / p.items) and record lists can legitimately disagree
   (items from trade, the inn, or older saves carry no records) — every
   transfer below moves min(n, available) and never invents records. */

/* Remove up to n provenance records for `what` from a villager's store.
   Call whenever items leave the inventory (drop/give/trade/consume) so no
   ghost records survive for items no longer held. Returns removed records,
   oldest first. */
function stripItemProvenance(v, what, n){
  const list = v && v.itemProv && v.itemProv[what];
  if(!list || !list.length) return [];
  const k = (n == null) ? list.length : Math.min(n, list.length);
  return list.splice(0, k);
}

/* Append provenance records to a villager's store. */
function addItemProvenance(v, what, recs){
  if(!v || !recs || !recs.length) return;
  v.itemProv = v.itemProv || {};
  const list = v.itemProv[what] = v.itemProv[what] || [];
  for(const r of recs) list.push(r);
}

/* Pile-side provenance list, created on demand. */
function pileProvList(p, what){
  p.prov = p.prov || {};
  return p.prov[what] = p.prov[what] || [];
}

/* Move up to n provenance records for `what` from pile p to villager v.
   Returns the number of records moved. */
function movePileProvenance(p, v, what, n){
  const src = p && p.prov && p.prov[what];
  if(!src || !src.length) return 0;
  const recs = src.splice(0, Math.min(n, src.length));
  addItemProvenance(v, what, recs);
  return recs.length;
}
