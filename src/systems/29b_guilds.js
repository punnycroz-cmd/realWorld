/* =====================================================================
   PART 29B: GUILDS & APPRENTICESHIP — SPEC Phase 7A
   Institutional trade guilds for craftsmen, bakers, and farmers.
   
   Principles:
   - 3 canonical guilds: smith (crafting/building), baker (cooking/food), farmer (farming).
   - Structured membership list with ranks: apprentice, journeyman, master.
   - Apprenticeship: learning with a guild master confers a deterministic,
     measurable skill gain multiplier (1.6x) over self-study (1.0x).
   - Outsiders receive zero apprenticeship bonus (strict negative control).
   - Guild bloc trade: selling bulk lots (>= 10 units) to traveling caravans
     fetches a higher unit price than retail sales via guild bulk contracts.
   ===================================================================== */

const GUILD_SKILL_MAP = {
  smith: 'building',
  baker: 'cooking',
  farmer: 'farming'
};

const GUILD_COMMODITIES = {
  smith: ['knife', 'sword', 'chair', 'plank', 'cloth'],
  baker: ['bread', 'meal', 'cookedFish', 'cookedMeat'],
  farmer: ['crop', 'berries', 'egg', 'rawMeat', 'wheat']
};

const GUILD_BLOC_THRESHOLD = 10;
const GUILD_APPRENTICE_MULT = 1.60;
const GUILD_BLOC_PREMIUM_RATE = 0.35;

const GUILDS = {
  smith: {
    id: 'smith',
    name: 'Blacksmiths Guild',
    skill: 'building',
    master: null,
    members: {}
  },
  baker: {
    id: 'baker',
    name: 'Bakers Guild',
    skill: 'cooking',
    master: null,
    members: {}
  },
  farmer: {
    id: 'farmer',
    name: 'Farmers Guild',
    skill: 'farming',
    master: null,
    members: {}
  }
};

function getGuild(guildId){
  return GUILDS[guildId] || null;
}

function getGuildForSkill(skill){
  for(const gid in GUILD_SKILL_MAP){
    if(GUILD_SKILL_MAP[gid] === skill) return gid;
  }
  return null;
}

function getGuildForCommodity(item){
  for(const gid in GUILD_COMMODITIES){
    if(GUILD_COMMODITIES[gid].includes(item)) return gid;
  }
  return null;
}

function joinGuild(villager, guildId, rank, masterName){
  const g = GUILDS[guildId];
  if(!g || !villager) return false;
  const vName = typeof villager === 'object' ? villager.name : villager;
  const v = typeof villager === 'object' ? villager : (typeof findPersonSafe === 'function' ? findPersonSafe(villager) : null);

  // One guild per villager: leaving a prior guild keeps both the member map
  // and v.guild consistent instead of silently orphaning the old entry.
  if(v && v.guild && v.guild.guildId && v.guild.guildId !== guildId){
    leaveGuild(v, v.guild.guildId);
  }

  const now = (typeof W !== 'undefined' && W && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
  const memberRecord = {
    name: vName,
    guildId: guildId,
    rank: rank || 'apprentice',
    masterName: masterName || null,
    joinedDay: Math.floor(now)
  };

  g.members[vName] = memberRecord;
  if(rank === 'master'){
    g.master = vName;
  }

  if(v){
    v.guild = memberRecord;
  }

  if(typeof logEvent === 'function'){
    logEvent('guild', `${vName} joined ${g.name} as ${memberRecord.rank}`);
  }
  return true;
}

function leaveGuild(villager, guildId){
  const g = GUILDS[guildId];
  if(!g || !villager) return false;
  const vName = typeof villager === 'object' ? villager.name : villager;
  const v = typeof villager === 'object' ? villager : (typeof findPersonSafe === 'function' ? findPersonSafe(villager) : null);

  delete g.members[vName];
  if(g.master === vName){
    g.master = null;
  }
  if(v && v.guild && v.guild.guildId === guildId){
    delete v.guild;
  }
  return true;
}

function isGuildMember(villager, guildId){
  if(!villager) return false;
  const vName = typeof villager === 'object' ? villager.name : villager;
  if(guildId){
    const g = GUILDS[guildId];
    return Boolean(g && g.members[vName]);
  }
  for(const gid in GUILDS){
    if(GUILDS[gid].members[vName]) return true;
  }
  return false;
}

function getGuildRank(villager, guildId){
  if(!villager) return null;
  const vName = typeof villager === 'object' ? villager.name : villager;
  if(guildId){
    const g = GUILDS[guildId];
    return (g && g.members[vName]) ? g.members[vName].rank : null;
  }
  for(const gid in GUILDS){
    if(GUILDS[gid].members[vName]) return GUILDS[gid].members[vName].rank;
  }
  return null;
}

function getGuildMembers(guildId){
  const g = GUILDS[guildId];
  if(!g) return [];
  return Object.values(g.members);
}

function setGuildMaster(guildId, masterVillager){
  const g = GUILDS[guildId];
  if(!g || !masterVillager) return false;
  const mName = typeof masterVillager === 'object' ? masterVillager.name : masterVillager;
  joinGuild(masterVillager, guildId, 'master');
  g.master = mName;
  return true;
}

/* Apprenticeship Skill Multiplier Hook
   Used in gainXP to give guild apprentices learning under a master a measurable bonus. */
function getGuildApprenticeshipBonus(villager, skill){
  if(!villager) return 1.0;
  const targetGuildId = getGuildForSkill(skill);
  if(!targetGuildId) return 1.0;

  const g = GUILDS[targetGuildId];
  if(!g) return 1.0;

  const vName = typeof villager === 'object' ? villager.name : villager;
  const mem = g.members[vName];
  if(!mem) return 1.0; // Outsider negative control: zero bonus

  if(mem.rank === 'apprentice'){
    // Must have a designated master in the guild
    const masterName = mem.masterName || g.master;
    if(masterName){
      const master = (typeof findPersonSafe === 'function') ? findPersonSafe(masterName) : null;
      if(master && !master.dead){
        return GUILD_APPRENTICE_MULT; // 1.60x bonus — requires a real, living master
      }
    }
  }

  return 1.0;
}

/* Guild Bloc Pricing for Caravan Sales
   Calculates price per unit and total price for selling goods to caravan.
   Guild members selling in bulk batches (>= 10 units) get unit price > retail. */
function getCaravanGuildSellPrice(what, seller, qty, baseBuyPrice, famBonus){
  qty = (qty != null && qty > 0) ? Math.floor(qty) : 1;
  const baseP = baseBuyPrice != null ? baseBuyPrice : 3;
  const fam = famBonus || 0;

  // Single unit retail gain formula from 15c_caravan.js
  const retailUnitPrice = Math.max(1, Math.floor(baseP * (1 + fam * 0.5)));

  const guildId = getGuildForCommodity(what);
  const isMember = guildId ? isGuildMember(seller, guildId) : false;
  const isBloc = qty >= GUILD_BLOC_THRESHOLD;

  if(isBloc && isMember){
    // Guild bloc pricing premium: negotiated bulk rate > piecemeal retail
    const blocUnitPrice = Math.max(retailUnitPrice + 1, Math.round(baseP * (1 + fam * 0.5 + GUILD_BLOC_PREMIUM_RATE)));
    return {
      unitPrice: blocUnitPrice,
      totalPrice: blocUnitPrice * qty,
      isBloc: true,
      guildBonus: true,
      guildId: guildId,
      retailUnitPrice: retailUnitPrice
    };
  }

  // Non-guild or non-bloc sales receive standard retail unit price
  return {
    unitPrice: retailUnitPrice,
    totalPrice: retailUnitPrice * qty,
    isBloc: isBloc,
    guildBonus: false,
    guildId: guildId,
    retailUnitPrice: retailUnitPrice
  };
}

const Guilds = {
  GUILDS: GUILDS,
  getGuild: getGuild,
  joinGuild: joinGuild,
  leaveGuild: leaveGuild,
  isGuildMember: isGuildMember,
  getGuildRank: getGuildRank,
  getGuildMembers: getGuildMembers,
  setGuildMaster: setGuildMaster,
  getGuildApprenticeshipBonus: getGuildApprenticeshipBonus,
  getCaravanGuildSellPrice: getCaravanGuildSellPrice,
  getGuildForSkill: getGuildForSkill,
  getGuildForCommodity: getGuildForCommodity
};

if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.Guilds = Guilds;
  window.__aiBridge.joinGuild = function(v, gid, r, m){ return joinGuild(v, gid, r, m); };
  window.__aiBridge.getGuild = function(gid){ return getGuild(gid); };
  window.__aiBridge.getGuildApprenticeshipBonus = function(v, s){ return getGuildApprenticeshipBonus(v, s); };
  window.__aiBridge.getCaravanGuildSellPrice = function(w, s, q, b, f){ return getCaravanGuildSellPrice(w, s, q, b, f); };
  window.__aiBridge.seedGuilds = function(){ return seedGuilds(); };
}

/* Cultural priors (SPEC Phase 7 principle #8 — "gieo trước, không đẻ sau"):
   guilds exist from world start with named masters, so the guild machinery
   (apprenticeship, bloc pricing) can actually activate in a real game.
   Without this, joinGuild/setGuildMaster have zero production callers and the
   whole system is dead gameplay ("test xanh, gameplay chết").
   Idempotent: resets guild state first, safe to call on world re-init. */
function seedGuilds(){
  if(typeof GUILDS === 'undefined') return false;
  const FOUNDING_MASTERS = { smith: 'Bram', baker: 'Sella', farmer: 'Marta' };
  for(const gid of Object.keys(GUILDS)){
    GUILDS[gid].master = null;
    GUILDS[gid].members = {};
  }
  let seeded = 0;
  for(const gid of Object.keys(FOUNDING_MASTERS)){
    if(!GUILDS[gid]) continue;
    const mv = (typeof findPersonSafe === 'function') ? findPersonSafe(FOUNDING_MASTERS[gid]) : null;
    if(mv && typeof setGuildMaster === 'function' && setGuildMaster(gid, mv)){
      seeded++;
    }
  }
  if(typeof logEvent === 'function' && seeded > 0){
    logEvent('guild', 'Guilds seeded from cultural priors: ' +
      Object.keys(FOUNDING_MASTERS).map(g => g + '→' + FOUNDING_MASTERS[g]).join(', '));
  }
  return seeded;
}
