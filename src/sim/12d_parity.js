/* =====================================================================
   PART 12D: SOCIAL, PREGNANCY, WORLD INTERACTION, DISASTERS, OVERLAY,
   PARITY WORLD TICK, EXTENDED AUTOTEST
   ===================================================================== */
const PILES = [], FIRES = [], CROPS = [], CHICKENS = [], BURNING = [];
let WILDTREES = [];
const FOOD_STOCK = { inn: 30, shop: 30 };
const CHAT_LINES = [
  'Lovely weather we are having.',
  'How is the harvest coming along?',
  'Did you hear the thunder last night?',
  'The lake looks calm today.',
  'My back aches from the fields.',
  'Have you tried Sella\'s new bread?',
  'The children grow so fast.',
  'I hope the rains come soon.'
];
const BABY_NAMES = ['Ash', 'Birch', 'Clover', 'Reed', 'Poppy', 'Alder', 'Moss', 'Wren'];
function initParityWorld(){
  PILES.length = 0; FIRES.length = 0; CROPS.length = 0; CHICKENS.length = 0; BURNING.length = 0;
  FOOD_STOCK.inn = 30; FOOD_STOCK.shop = 30;
  VILLAGE_OBJECTS.push({ kind: 'firepit', wx: 2, wy: 5, x: 2 * CS + 16, y: 5 * CS + 16 });
  FIRES.push({ wx: 2, wy: 5, x: 2 * CS + 16, y: 5 * CS + 16, burnH: 0 });
  WILDTREES = [];
  for(let wy = -45; wy <= 35; wy++) for(let wx = -45; wx <= 45; wx++){
    const cc = cellChunk(wx, wy);
    if(cc.c.tStage && cc.c.tStage[cc.i] > 0) WILDTREES.push({ wx, wy, stage: cc.c.tStage[cc.i] });
  }
  for(let wy = -5; wy <= -3; wy++) for(let wx = -11; wx <= -9; wx++)
    CROPS.push({ wx, wy, stage: Math.floor(srand() * 2), grow: 0 });
  const CN = ['Pippa', 'Cluck', 'Nugget', 'Henrietta'];
  for(let k = 0; k < 4; k++)
    CHICKENS.push({ name: CN[k], x: (-13 + k) * CS + 16, y: -2 * CS + 16, state: 'peck', t: srand() * 2, eggT: 8 + srand() * 10 });
}