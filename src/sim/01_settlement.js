/* ---------------------------------------------------------------------
   PART 3: WILLOWBROOK VILLAGE SETTLEMENT IN NATURA
   --------------------------------------------------------------------- */
const VILLAGE_BUILDINGS = [];
const VILLAGE_OBJECTS = [];

function initVillageSettlement(){
  // Clear trees in village plaza
  for(let wy=-20; wy<=22; wy++) for(let wx=-20; wx<=26; wx++){
    const {c, i} = cellChunk(wx, wy);
    c.tStage[i] = 0;
    clearBushCell(c, i);
  }

  // 11 Buildings (extended as full entities in Phase 2B)
  VILLAGE_BUILDINGS.length = 0;
  const initialBuildingProps = {
    townhall:  { capacity: 6, owner: 'Alden', hasFire: true },
    house5:    { capacity: 2, owner: 'Pip',   hasFire: false },
    shop:      { capacity: 2, owner: 'Sella', hasFire: false },
    farmhouse: { capacity: 4, owner: 'Marta', hasFire: false },
    herbhut:   { capacity: 2, owner: 'Wren',  hasFire: false },
    inn:       { capacity: 6, owner: 'Tobin', hasFire: true },
    smithy:    { capacity: 2, owner: 'Bram',  hasFire: true },
    fishhut:   { capacity: 2, owner: 'Finn',  hasFire: false },
    house1:    { capacity: 2, owner: 'Rowan', hasFire: false },
    house2:    { capacity: 2, owner: 'Clara', hasFire: false },
    house4:    { capacity: 2, owner: 'Gareth', hasFire: false }
  };
  function addBld(id, name, wx, wy, tw, th, sprKey){
    const props = initialBuildingProps[id] || {};
    VILLAGE_BUILDINGS.push({
      id, name,
      wx, wy,
      x: wx * CS, y: wy * CS,
      tw, th,
      sprKey,
      door: { wx: wx + Math.floor(tw/2), wy: wy + th },
      indoorTemp: 20.0,
      cleanliness: 1.0,
      capacity: props.capacity || 2,
      owner: props.owner || null, // NOTE: household entities arrive in Phase 2E
      integrity: 1.0,
      maxInteg: 1.0,
      hasFire: !!props.hasFire,
      fireplaceLit: !!props.hasFire,
      daysUnoccupied: 0,
      residents: props.owner ? [props.owner] : []
    });
  }

  addBld('townhall', 'Alden’s Town Hall', -3, -16, 6, 5, 'townhall');
  addBld('house5', 'Rose Cottage', -14, -16, 4, 4, 'house5');
  addBld('shop', 'Sella’s General Store & Bakery', 8, -14, 5, 4, 'shop');
  addBld('farmhouse', 'Marta’s Farmhouse', -16, -6, 4, 4, 'farmhouse');
  addBld('herbhut', 'Wren’s Herbalist Cottage', 14, -6, 4, 4, 'herbhut');
  addBld('inn', 'The Sleepy Stag Inn', 4, 4, 6, 5, 'inn');
  addBld('smithy', 'Bram’s Smithy', -12, 4, 5, 4, 'smithy');
  addBld('fishhut', 'Finn’s Dockhouse', 14, 3, 4, 4, 'house3');
  addBld('house1', 'Stone Cottage', -14, 14, 4, 4, 'house1');
  addBld('house2', 'Timber Cabin', -4, 15, 4, 4, 'house2');
  addBld('house4', 'Slate Cottage', 6, 15, 4, 4, 'house4');

  // Stone Pathways (leading cleanly to doorsteps without cutting through buildings or crop fields)
  const pathCells = [
    // Central North-South Main Street
    [0,-11],[0,-10],[0,-9],[0,-8],[0,-7],[0,-6],[0,-5],[0,-4],[0,-3],[0,-2],[0,-1],[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],[0,13],[0,14],[0,15],[0,16],[0,17],[0,18],[0,19],
    // Central East-West Boulevard
    [-16,0],[-15,0],[-14,0],[-13,0],[-12,0],[-11,0],[-10,0],[-9,0],[-8,0],[-7,0],[-6,0],[-5,0],[-4,0],[-3,0],[-2,0],[-1,0],[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[15,0],[16,0],
    // Town Hall Plaza & Front Steps
    [-1,-11],[0,-11],[1,-11],
    // Sella's Bakery Walkway
    [1,-9],[2,-9],[3,-9],[4,-9],[5,-9],[6,-9],[7,-9],[8,-9],[9,-9],[10,-9],[10,-10],
    // Marta's Farm Lane (clean straight lane running along front of fields directly to doorstep [-14, -2])
    [-1,-2],[-2,-2],[-3,-2],[-4,-2],[-5,-2],[-6,-2],[-7,-2],[-8,-2],[-9,-2],[-10,-2],[-11,-2],[-12,-2],[-13,-2],[-14,-2],
    // Wren's Herbal Garden Walkway
    [1,-2],[2,-2],[3,-2],[4,-2],[5,-2],[6,-2],[7,-2],[8,-2],[9,-2],[10,-2],[11,-2],[12,-2],[13,-2],[14,-2],[15,-2],[16,-2],
    // Smithy Branch
    [-1,8],[-2,8],[-3,8],[-4,8],[-5,8],[-6,8],[-7,8],[-8,8],[-9,8],[-10,8],
    // Inn Promenade
    [1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9],
    // Fisher's Creek Pier approach (runs along py: 7 directly in front of Finn's door to the pier)
    [1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],
    // South Cottages Front Street (runs along py: 19 connecting doorsteps [-12, 19], [-2, 19], [8, 19])
    [-14,19],[-13,19],[-12,19],[-11,19],[-10,19],[-9,19],[-8,19],[-7,19],[-6,19],[-5,19],[-4,19],[-3,19],[-2,19],[-1,19],[0,19],[1,19],[2,19],[3,19],[4,19],[5,19],[6,19],[7,19],[8,19],
  ];
  for(const [px,py] of pathCells){
    const {c, i} = cellChunk(px, py);
    c.tileType[i] = 1; // path
    markChunkDirty(c);
  }

  // Marta's Fertile Crop Rows (placed cleanly east of farmhouse, matching farmhouse height wy: -6..-3)
  for(let fy=-6; fy<=-3; fy++) for(let fx=-11; fx<=-7; fx++){
    const {c, i} = cellChunk(fx, fy);
    c.tileType[i] = 4; // field
    c.moist[i] = 0.85;
    c.tStage[i] = 0;
    clearBushCell(c, i);
  }

  // Wooden Fishing Pier (Bridge tiles extending out over lake at py: 7)
  for(let px=18; px<=24; px++){
    const {c, i} = cellChunk(px, 7);
    c.tileType[i] = 5; // bridge / pier
    markChunkDirty(c);
  }

  // Props: Well, Anvil, Firepit, Benches, Streetlamps
  VILLAGE_OBJECTS.length = 0;
  VILLAGE_OBJECTS.push({ kind: 'well', wx: 0, wy: 0, x: 0*CS + 16, y: 0*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'anvil', wx: -9, wy: 8, x: -9*CS + 16, y: 8*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'bench', wx: 3, wy: 2, x: 3*CS + 16, y: 2*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'bench', wx: -2, wy: 2, x: -2*CS + 16, y: 2*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'lamp', wx: 0, wy: -6, x: 0*CS + 16, y: -6*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'lamp', wx: 0, wy: 6, x: 0*CS + 16, y: 6*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'lamp', wx: 6, wy: 1, x: 6*CS + 16, y: 1*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'lamp', wx: -6, wy: 1, x: -6*CS + 16, y: 1*CS + 16 });

  // STRICT SANITIZATION: Guarantee 100% dry foundation and zero stray tiles inside any building
  for(const b of VILLAGE_BUILDINGS){
    for(let dy=0; dy<b.th; dy++){
      for(let dx=0; dx<b.tw; dx++){
        const {c, i} = cellChunk(b.wx + dx, b.wy + dy);
        c.h[i] = SEA + 0.15; // elevated dry foundation
        c.tileType[i] = 0;   // clean solid grass/ground foundation
        c.tStage[i] = 0;     // remove trees
        c.treeType[i] = 0;
        clearBushCell(c, i);       // remove bushes
      }
    }
  }
}
