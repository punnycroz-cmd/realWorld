/* =====================================================================
   PART 41A: GAME SYSTEMS — ADDRESS / BUILDING / UNIT / LEASE REGISTRY
   Implements rw-address-system-spec.md for "The Mission" scenario.

   - Real street names, system-generated 9xxx house numbers placed above
     every real block maximum (spec §3): gen = 9000 + hash(street|idx) % 900.
   - Address encodes PLACE only: buildings/units are immutable across tenant
     turnover; tenants/dates/rents live in `leases` (spec §4/§5).
   - The landlord AI may MINT new addresses only through gsMintAddress
     (clerk role, spec §6): generate-don't-invent, register before telling
     anyone, never reuse a retired number, log the event.
   - In-memory + JSON-loadable (gsRegSnapshot/gsRegLoad). Deterministic:
     no Math.random anywhere in this module.

   v4 hardening (roadmap v4):
   - Unit codes follow spec §2 (1–4 alnum/'#' chars), are unique per
     building FOREVER (a retired unit keeps its code — codes like numbers
     are never recycled), and can be auto-assigned (A..Z then A1..Z9).
   - Livability: a unit is leasable only while 'active' on a 'standing'
     building (gsUnitLivable); signing/leasing/hiring refuse otherwise.
   - Clerk world-change paths (spec §6, landlord-as-clerk): subdivide a
     vacant unit into new codes under the SAME building address, convert
     a garage into an ADU (one per lot), merge two vacant units, retire
     a unit or a whole building. Every clerk op registers first, then
     logs to mintLog AND the public feed (admin transparency, design §3).
   - Retired buildings refuse to die while occupied unless forced (the
     honest version of "you cannot demolish homes out from under people").
   - SF seed uses REAL unit counts: the count of a building's real
     house-number list (a fact, never the numbers themselves) or, when
     absent, a footprint-area estimate.

   This module is world-model only — it never touches the renderer. It is
   active data in BOTH scenarios (the registry exists even when SF_MODE is
   off; only the SF_MAP auto-seed is gated).
   ===================================================================== */

const GS_REG = {
  buildings: [],   // {id, address, street, hn, style, units:[unitId], owner_id, bld_idx, status}
  units: [],       // {id, bld_id, unit_code, bedrooms, base_rent, rent_controlled}
  leases: [],      // {unit_id, tenant_id, start, monthly_rent, occupants, status, end}
  mintLog: [],     // {stamp, reason, address, bld_id}
  retired: [],     // bld ids whose numbers are permanently withdrawn
  seq: { bld: 0, unit: 0 },
};
/* derived indexes — rebuilt by gsRegIndex(), never serialized */
const GS_REG_BLD = new Map();    // id -> building
const GS_REG_UNIT = new Map();   // id -> unit
const GS_REG_USED = new Map();   // street -> Set(used house numbers)

function gsStamp(){
  return (typeof W !== 'undefined') ? { day: W.day, tod: +W.tod.toFixed(2) } : null;
}

/* spec §3: deterministic number above any real block maximum */
function gsAddrNumber(street, idx){
  return 9000 + (hashString18(street + '|' + idx) % 900);
}

/* spec §2 address format: "9431 Guerrero Street, San Francisco, CA[ Unit 3B]" */
function gsFmtAddr(hn, street, unitCode){
  let a = hn + ' ' + street + ', San Francisco, CA';
  if(unitCode) a += ' Unit ' + unitCode;
  return a;
}

function gsRegIndex(){
  GS_REG_BLD.clear(); GS_REG_UNIT.clear(); GS_REG_USED.clear();
  for(const b of GS_REG.buildings){
    GS_REG_BLD.set(b.id, b);
    if(!GS_REG_USED.has(b.street)) GS_REG_USED.set(b.street, new Set());
    GS_REG_USED.get(b.street).add(b.hn);
  }
  for(const u of GS_REG.units) GS_REG_UNIT.set(u.id, u);
}

function gsRegistryReset(){
  GS_REG.buildings.length = 0; GS_REG.units.length = 0;
  GS_REG.leases.length = 0; GS_REG.mintLog.length = 0;
  GS_REG.retired.length = 0; GS_REG.seq.bld = 0; GS_REG.seq.unit = 0;
  gsRegIndex();
  /* lease-lifecycle sidecar (applications, sequences) resets with the
     registry it annotates */
  if(typeof gsLeaseReset === 'function') gsLeaseReset();
}

/* Register a building on a street. The generated number is deterministic
   given registration order; collisions on the same street bump the index
   until a free number is found (spec §3 collision rule). A spec.bldIdx or
   spec.canon tag already on file returns the EXISTING record — one row per
   physical place, idempotent under re-seeding.

   spec.hnPin is a DESIGNER-only pin (world-content seed): the pinned
   number must still satisfy the §3 formula, so we search for the index
   that produces it and store it as b.addr_idx. The runtime clerk
   (gsMintAddress) strips hnPin — it generates, it never picks numbers.
   spec.offmap marks a real-world building the map doesn't cover (Dani's
   Geneva Ave flat): it exists in the registry, carries no bld_idx, and
   never enters the on-map leasable stock. Returns the building record. */
function gsRegisterBuilding(spec){
  const street = spec.street;
  if(!street) return null;
  if(spec.bldIdx != null || spec.canon != null){
    const ex = GS_REG.buildings.find(b =>
      (spec.bldIdx != null && b.bld_idx === spec.bldIdx) ||
      (spec.canon != null && b.canon === spec.canon));
    if(ex) return ex;
  }
  const used = GS_REG_USED.get(street) || new Set();
  let idx, hn;
  if(spec.hnPin != null){
    hn = spec.hnPin | 0;
    if(!(hn >= 9000 && hn < 9900)) return null;   // pins stay 9xxx too
    if(used.has(hn)) return null;                 // can't double-book a door
    idx = -1;
    for(let i = 0; i < 8192; i++)
      if(gsAddrNumber(street, i) === hn){ idx = i; break; }
    if(idx < 0) return null;                      // unreachable by §3 — refuse
  } else {
    idx = GS_REG.buildings.filter(b => b.street === street).length;
    hn = gsAddrNumber(street, idx);
    while(used.has(hn)){ idx++; hn = gsAddrNumber(street, idx); }
  }
  const b = {
    id: 'bld-' + (++GS_REG.seq.bld),
    hn,
    street,
    address: gsFmtAddr(hn, street),
    addr_idx: idx,
    style: spec.style || 'residential',
    units: [],
    owner_id: spec.owner_id || 'landlord',
    bld_idx: (spec.bldIdx != null ? spec.bldIdx : null),
    canon: (spec.canon != null ? spec.canon : null),
    offmap: !!spec.offmap,
    status: 'standing',
  };
  GS_REG.buildings.push(b);
  GS_REG_BLD.set(b.id, b);
  if(!GS_REG_USED.has(street)) GS_REG_USED.set(street, used);
  used.add(hn);
  return b;
}

/* unit codes: spec §2 — alphanumeric, 1–4 chars ('A', '3B', '#EIS').
   Codes are unique per building and NEVER recycled: a retired unit keeps
   its code forever (gsUnitCodeTaken counts every status), the same rule
   §6 applies to house numbers. */
const GS_UNIT_CODE_RE = /^[#A-Za-z0-9]{1,4}$/;
/* deterministic code sequence for auto-assignment: A..Z then A1..Z9 */
function gsUnitCodeAt(i){
  if(i < 26) return String.fromCharCode(65 + i);
  const q = Math.floor((i - 26) / 9), d = (i - 26) % 9 + 1;
  return String.fromCharCode(65 + (q % 26)) + d;
}
function gsUnitCodeTaken(b, code){
  if(GS_REG_UNIT.has(b.id + '-' + code)) return true; // implicit-id units
  return b.units.some(uid => {
    const u = GS_REG_UNIT.get(uid);
    return u && u.unit_code === code;
  });
}
function gsNextUnitCode(b){
  for(let i = 0; i <= 260; i++){
    const c = gsUnitCodeAt(i);
    if(!gsUnitCodeTaken(b, c)) return c;
  }
  return null;                                   // the building is full
}
/* pick a fresh code: try caller-preferred candidates first, then the
   sequence. `taken` additionally excludes codes claimed mid-operation. */
function gsFreshUnitCode(b, prefer, taken){
  for(const c of (prefer || []))
    if(GS_UNIT_CODE_RE.test(c) && !gsUnitCodeTaken(b, c) &&
       (taken || []).indexOf(c) < 0) return c;
  for(let i = 0; i <= 260; i++){
    const c = gsUnitCodeAt(i);
    if(!gsUnitCodeTaken(b, c) && (taken || []).indexOf(c) < 0) return c;
  }
  return null;
}
/* livable = the unit exists, is active, and its building still stands.
   Everything that puts a person in a unit (sign/approve/hire/subdivide
   guards) goes through this — the honest "you can't lease a demolished
   flat" rule. */
function gsUnitLivable(u){
  if(!u || (u.status || 'active') !== 'active') return false;
  const b = GS_REG_BLD.get(u.bld_id);
  return !!b && b.status === 'standing';
}
function gsUnitVacant(u){
  return gsUnitLivable(u) && !gsActiveLease(u.id);
}

function gsRegisterUnit(bldId, spec){
  const b = GS_REG_BLD.get(bldId);
  if(!b) return null;
  let code = spec && spec.unit_code != null ? String(spec.unit_code) : null;
  if(code){
    if(!GS_UNIT_CODE_RE.test(code)) return null;          // spec §2 format
    if(gsUnitCodeTaken(b, code)){
      if(!(spec && spec.autoCode)) return null;           // dupes refused
      code = gsNextUnitCode(b);                           // or next free
      if(!code) return null;
    }
  } else if(spec && spec.autoCode){
    code = gsNextUnitCode(b);
    if(!code) return null;
  }
  let id;
  if(code) id = bldId + '-' + code;
  else do { id = bldId + '-u' + (++GS_REG.seq.unit); }
       while(GS_REG_UNIT.has(id));                 // seq can't clobber codes
  const u = {
    id,
    bld_id: bldId,
    unit_code: code,
    bedrooms: spec && spec.bedrooms != null ? spec.bedrooms : 1,
    base_rent: spec && spec.base_rent != null ? spec.base_rent : 2000,
    rent_controlled: !!(spec && spec.rent_controlled),
    status: 'active',                 // split|merged|retired when withdrawn
    origin: (spec && spec.origin) || 'seed',
  };
  GS_REG.units.push(u);
  GS_REG_UNIT.set(u.id, u);
  b.units.push(u.id);
  return u;
}

/* Full display address for a unit: building address + " Unit X" if coded */
function gsAddressOfUnit(unitId){
  const u = GS_REG_UNIT.get(unitId);
  if(!u) return null;
  const b = GS_REG_BLD.get(u.bld_id);
  return b ? gsFmtAddr(b.hn, b.street, u.unit_code) : null;
}

function gsBldById(id){ return GS_REG_BLD.get(id) || null; }
function gsUnitById(id){ return GS_REG_UNIT.get(id) || null; }
function gsUnitsOf(bldId){
  const b = GS_REG_BLD.get(bldId);
  return b ? b.units.map(id => GS_REG_UNIT.get(id)) : [];
}
function gsFindBuildingByAddr(addr){
  return GS_REG.buildings.find(b => b.address === addr) || null;
}

/* ---- leases (spec §4: tenant names/dates/rents live HERE, never in the
   address). Signing a new lease on a unit honestly ends the prior one. ---- */
function gsActiveLease(unitId){
  return GS_REG.leases.find(l => l.unit_id === unitId &&
    (l.status === 'active' || l.status === 'owner-occupied')) || null;
}
function gsLeasesFor(tenantId){
  return GS_REG.leases.filter(l => l.tenant_id === tenantId);
}
function gsSignLease(unitId, tenantId, spec){
  const u = GS_REG_UNIT.get(unitId);
  if(!u) return null;
  if(!gsUnitLivable(u)) return null;   // no leases on split/merged/retired
                                     // units or demolished buildings
  const prior = gsActiveLease(unitId);
  if(prior){ prior.status = 'ended'; prior.end = (spec && spec.start) || null; }
  const l = {
    unit_id: unitId,
    tenant_id: tenantId,
    start: (spec && spec.start) || null,
    monthly_rent: (spec && spec.monthly_rent != null ? spec.monthly_rent : u.base_rent),
    occupants: (spec && spec.occupants) || [tenantId],
    status: (spec && spec.status) || 'active',
    end: null,
  };
  GS_REG.leases.push(l);
  /* lifecycle enrichment lives in 41_game_systems_leases.js (loads later);
     the typeof guard keeps signing legal before it exists */
  if(typeof gsLeaseInit === 'function') gsLeaseInit(l, spec);
  return l;
}
function gsEndLease(unitId, endStamp){
  const l = gsActiveLease(unitId);
  if(!l) return false;
  l.status = 'ended'; l.end = endStamp || null;
  return true;
}
/* admin-only eviction path — distinct status so reputation (v11) can tell
   a contested eviction from a clean move-out */
function gsEvictLease(unitId, endStamp, reason){
  const l = gsActiveLease(unitId);
  if(!l) return false;
  l.status = 'evicted'; l.end = endStamp || null; l.reason = reason || 'eviction';
  return true;
}

/* spec §6 — landlord-as-clerk minting. The ONLY legal ways the address
   stock can change at runtime:
     gsMintAddress     — a new building on a street (new 9xxx number)
     gsSubdivideUnit   — one vacant unit becomes several (same address)
     gsConvertGarage   — a garage becomes an ADU unit (same address)
     gsMergeUnits      — two vacant units become one (same address)
     gsRetireUnit      — a unit is withdrawn (code never reused)
     gsRetireBuilding  — a building is withdrawn (number never reused)
   Every op registers the change FIRST, then logs it to mintLog (the
   world timeline) and posts it to the public feed when the request bus
   is loaded (design §3 transparency — admin acts in the open). */
function gsMintLogAdd(reason, b, extra){
  const e = { stamp: gsStamp(), reason,
              address: b ? b.address : null, bld_id: b ? b.id : null };
  if(extra) for(const k in extra) if(k !== 'action') e[k] = extra[k];
  GS_REG.mintLog.push(e);
  if(typeof gsBusEmit === 'function')
    gsBusEmit('admin', { playerId: 'owner', kind: 'admin', id: null,
                         _now: null },
      Object.assign({ action: (extra && extra.action) || 'registry',
        address: e.address, bld: e.bld_id },
        extra, { action: (extra && extra.action) || 'registry' }));
  return e;
}
function gsMintAddress(street, reason, opts){
  const o = Object.assign({ street }, opts || {});
  /* the clerk GENERATES — spec §6 forbids inventing a number, so a
     designer pin (hnPin) is seed-only and silently stripped here */
  delete o.hnPin; delete o.canon; delete o.offmap;
  const b = gsRegisterBuilding(o);
  if(!b) return null;
  gsMintLogAdd(reason || 'minted', b, { action: 'mint' });
  return b;
}
/* a tenant's home cannot be split, merged, or demolished out from under
   them — every destructive clerk op requires a vacant unit. A hired
   character's registered home counts as occupied even mid-paperwork. */
function gsUnitClaimed(u){
  if(gsActiveLease(u.id)) return true;
  if(typeof GS_HIRED !== 'undefined')
    for(const cid in GS_HIRED)
      if(GS_HIRED[cid] && GS_HIRED[cid].unitId === u.id) return true;
  return false;
}
/* split a vacant unit into n flats under the SAME building address.
   Codes prefer the parent suffix (Unit A -> A1, A2 — real subdivision
   style); bedrooms and base rent divide pro-rata (last flat takes the
   rounding cent). The parent unit is withdrawn (status 'split'). */
function gsSubdivideUnit(unitId, opts){
  const u = GS_REG_UNIT.get(unitId);
  const b = u && GS_REG_BLD.get(u.bld_id);
  if(!u || !b || !gsUnitLivable(u)) return null;
  if(gsUnitClaimed(u)) return null;
  const n = Math.max(2, Math.min(4, (opts && opts.n) || 2));
  if((u.bedrooms || 1) < n) return null;          // a studio can't split
  const base = u.unit_code || 'u';
  const prefer = []; for(let i = 1; i <= n; i++) prefer.push(base + i);
  const codes = [];
  for(let i = 0; i < n; i++){
    const c = gsFreshUnitCode(b, prefer, codes);
    if(!c) return null;
    codes.push(c);
  }
  const out = [];
  let remBd = u.bedrooms, remRent = u.base_rent;
  for(let i = 0; i < n; i++){
    const last = i === n - 1;
    const bd = last ? remBd : Math.max(1, Math.floor(u.bedrooms / n));
    remBd -= bd;
    const rent = last ? remRent
      : Math.round(u.base_rent * bd / u.bedrooms);
    remRent -= rent;
    out.push(gsRegisterUnit(b.id, {
      unit_code: codes[i], bedrooms: bd, base_rent: rent,
      rent_controlled: u.rent_controlled,         // split inherits tenure
      origin: 'subdivide',
    }));
  }
  u.status = 'split'; u.splitInto = out.map(x => x.id);
  gsMintLogAdd('subdivide: ' + (u.unit_code || u.id) + ' -> ' +
    codes.join(','), b, { action: 'subdivide', units: out.map(x => x.id) });
  return out;
}
/* garage conversion (spec §6's own example): one ADU per lot — the real
   planning rule. New construction isn't rent-controlled (Costa-Hawkins
   style). Same building address; the unit gets a fresh code ('G' reads
   like a real garage-flat listing). */
function gsConvertGarage(bldId, opts){
  const b = GS_REG_BLD.get(bldId);
  if(!b || b.status !== 'standing') return null;
  if(b.units.some(uid => {
    const u = GS_REG_UNIT.get(uid);
    return u && u.origin === 'garage_conversion' &&
           (u.status || 'active') === 'active';
  })) return null;                                 // the garage is done
  const code = gsFreshUnitCode(b, ['G', 'ADU'], null);
  if(!code) return null;
  const u = gsRegisterUnit(bldId, {
    unit_code: code,
    bedrooms: (opts && opts.bedrooms != null) ? opts.bedrooms : 1,
    base_rent: (opts && opts.base_rent != null) ? opts.base_rent : 1500,
    rent_controlled: false,
    origin: 'garage_conversion',
  });
  if(!u) return null;
  gsMintLogAdd('garage conversion: Unit ' + code, b,
             { action: 'convert', unit: u.id });
  return u;
}
/* merge two vacant units in one building into a new flat (the other
   classic SF move — a landlord recombining split flats). Both parents
   withdraw (status 'merged'); the new unit takes the next free code. */
function gsMergeUnits(unitIdA, unitIdB, opts){
  const ua = GS_REG_UNIT.get(unitIdA), ub = GS_REG_UNIT.get(unitIdB);
  if(!ua || !ub || ua === ub || ua.bld_id !== ub.bld_id) return null;
  const b = GS_REG_BLD.get(ua.bld_id);
  if(!b || b.status !== 'standing') return null;
  if(!gsUnitLivable(ua) || !gsUnitLivable(ub)) return null;
  if(gsUnitClaimed(ua) || gsUnitClaimed(ub)) return null;
  const nu = gsRegisterUnit(b.id, {
    unit_code: gsNextUnitCode(b),
    bedrooms: (ua.bedrooms || 1) + (ub.bedrooms || 1),
    base_rent: (ua.base_rent || 0) + (ub.base_rent || 0),
    rent_controlled: ua.rent_controlled && ub.rent_controlled,
    origin: 'merge',
  });
  if(!nu) return null;
  ua.status = 'merged'; ua.mergedInto = nu.id;
  ub.status = 'merged'; ub.mergedInto = nu.id;
  gsMintLogAdd('merge: ' + (ua.unit_code || ua.id) + '+' +
    (ub.unit_code || ub.id) + ' -> ' + (nu.unit_code || nu.id), b,
    { action: 'merge', unit: nu.id });
  return nu;
}
/* withdraw a single unit (converted to storage, condemned, merged out
   of the rental stock). Its code is never reusable — the record stays. */
function gsRetireUnit(unitId, reason){
  const u = GS_REG_UNIT.get(unitId);
  if(!u || (u.status || 'active') !== 'active') return false;
  if(gsUnitClaimed(u)) return false;
  u.status = 'retired';
  gsMintLogAdd('retired unit: ' + (u.unit_code || u.id) +
    (reason ? ' — ' + reason : ''), GS_REG_BLD.get(u.bld_id),
    { action: 'retire_unit', unit: unitId });
  return true;
}
/* Retire a building (demolition): the number is never reused because
   GS_REG_USED keeps it forever. Refuses while occupied — you cannot
   demolish homes out from under people — unless opts.force, which ends
   the leases honestly (status 'ended', reason 'demolished'). Accepts the
   legacy (bldId, reason-string) call shape too. */
function gsRetireBuilding(bldId, opts){
  if(typeof opts === 'string') opts = { reason: opts };
  opts = opts || {};
  const b = GS_REG_BLD.get(bldId);
  if(!b || b.status === 'retired') return false;
  const occupied = b.units.some(uid => gsActiveLease(uid));
  if(occupied && !opts.force) return false;
  for(const uid of b.units){
    if(gsActiveLease(uid)) gsEndLease(uid, opts.date || null);
    const u = GS_REG_UNIT.get(uid);
    if(u && (u.status || 'active') === 'active'){
      u.status = 'retired';
      if(occupied) u.retireReason = 'demolished';
    }
  }
  b.status = 'retired';
  GS_REG.retired.push(bldId);
  gsMintLogAdd('retired: ' + (opts.reason || ''), b, { action: 'retire' });
  return true;
}

/* ---- JSON persistence ---- */
function gsRegSnapshot(){
  return JSON.stringify({
    buildings: GS_REG.buildings, units: GS_REG.units, leases: GS_REG.leases,
    mintLog: GS_REG.mintLog, retired: GS_REG.retired, seq: GS_REG.seq,
  });
}
function gsRegLoad(json){
  try{
    const d = JSON.parse(json);
    if(!d || !Array.isArray(d.buildings) || !Array.isArray(d.units) ||
       !Array.isArray(d.leases)) return false;
    GS_REG.buildings = d.buildings; GS_REG.units = d.units;
    GS_REG.leases = d.leases;
    GS_REG.mintLog = d.mintLog || []; GS_REG.retired = d.retired || [];
    GS_REG.seq = d.seq || { bld: GS_REG.buildings.length, unit: GS_REG.units.length };
    gsRegIndex();
    return true;
  }catch(e){ return false; }
}

/* ---- SF seed: mint registry addresses for every residential building in
   SF_MAP plus the cast's canonical homes (cast-bible-2026-09-22). Runs at
   load under SF_MODE; also callable from tests after gsRegistryReset(). ---- */
const GS_RES_KINDS = { apartments: 1, residential: 1, house: 1,
                       detached: 1, semidetached_house: 1 };

/* honest unit counts for the seed (v4). An OSM building's real house-
   number list — "760;762;764" — tells us how many front doors the place
   really has; we use the COUNT only (the numbers themselves never enter
   the registry — spec §7). Without a list, a footprint-area estimate
   decides: Mission apartment buildings run 2–8 flats over ~65 m² each. */
function gsPolyAreaM2(poly){
  let a = 0;
  if(!poly) return 0;
  for(let i = 0; i < poly.length; i++){
    const q = poly[(i + 1) % poly.length];
    a += poly[i][0] * q[1] - q[0] * poly[i][1];
  }
  return Math.abs(a / 2);
}
function gsSeedUnitCount(mb){
  const hnN = (mb.hn || '').split(';').filter(s => s.trim()).length;
  if(hnN >= 2) return Math.min(hnN, 12);          // real address count
  if(mb.kind === 'apartments')
    return Math.max(2, Math.min(8,
      Math.round(gsPolyAreaM2(mb.poly) / 65)));   // footprint estimate
  return 1;
}

/* ---- canonical cast homes (spec §8 migration, executed) -------------
   world/jobs-housing.md §3 is the canonical housing content: the eight
   mains' addresses, unit codes, and rents are authored there. The seed
   PINs those authored numbers — every pin still satisfies the §3
   formula (the index that produces it is found and stored), so
   "generate, don't invent" holds even for designer-chosen addresses.
   Geneva Ave / Folsom St sit off the map; their buildings are real
   registry entries (offmap:true, no bld_idx) because the fiction's
   addresses are true regardless of camera coverage. */
const GS_CANON_HOMES = [
  { canon: 'home-c6',    anchor: 'g744',  street: 'Guerrero Street',
    hn: 9418, owner: 'C7', style: 'Victorian duplex', units: [
      { unit_code: 'A', bedrooms: 2, base_rent: 950,  rent_controlled: true },
      { unit_code: 'B', bedrooms: 1, base_rent: 2100, rent_controlled: true } ] },
  { canon: 'home-c4c5',  anchor: 'g750',  street: 'Guerrero Street',
    hn: 9457, owner: 'C7', style: 'Victorian 3-flat', units: [
      { unit_code: '1', bedrooms: 1, base_rent: 1950, rent_controlled: true },
      { unit_code: '2', bedrooms: 0, base_rent: 1350, rent_controlled: true },
      { unit_code: '3', bedrooms: 2, base_rent: 3200, rent_controlled: true } ] },
  { canon: 'home-c7',    anchor: 'auerbach', street: 'Mission Street',
    hn: 9102, owner: 'C7', style: 'mixed-use storefront + flat', units: [
      { unit_code: '2', bedrooms: 1, base_rent: 0, rent_controlled: false } ] },
  { canon: 'home-c1',    pickOn: 'Capp Street', street: 'Capp Street',
    hn: 9127, owner: 'landlord', style: 'Edwardian flats', units: [
      { unit_code: 'A', bedrooms: 0, base_rent: 1300, rent_controlled: false },
      { unit_code: 'B', bedrooms: 0, base_rent: 1250, rent_controlled: true },
      { unit_code: 'C', bedrooms: 0, base_rent: 1150, rent_controlled: true },
      { unit_code: 'D', bedrooms: 0, base_rent: 1200, rent_controlled: true } ] },
  { canon: 'home-c3',    street: 'Geneva Avenue', hn: 9263,
    owner: 'landlord', style: 'flat', offmap: true, units: [
      { unit_code: '4', bedrooms: 2, base_rent: 2100, rent_controlled: true } ] },
  { canon: 'home-c8',    street: 'Folsom Street', hn: 9344,
    owner: 'landlord', style: 'studios', offmap: true, units: [
      { unit_code: '1', bedrooms: 0, base_rent: 1275, rent_controlled: true } ] },
];

function gsSeedSF(){
  if(typeof SF_MAP === 'undefined' || !SF_MAP || !SF_MAP.buildings) return 0;
  const doneIdx = new Set(GS_REG.buildings.map(b => b.bld_idx));
  const al = SF_MAP.anchors || {};
  let n = 0;

  /* phase 1 — canonical cast homes, pinned BEFORE generic stock so the
     authored numbers can't be taken by a random door first */
  const pickResIdx = (street, seed) => {
    const cand = [];
    SF_MAP.buildings.forEach((b, i) => {
      if(b.st === street && GS_RES_KINDS[b.kind] && !doneIdx.has(i))
        cand.push(i);
    });
    return cand.length ? cand[hashString18(seed) % cand.length] : null;
  };
  for(const ch of GS_CANON_HOMES){
    if(GS_REG.buildings.some(b => b.canon === ch.canon)) continue;
    const bldIdx = ch.anchor ? ((al[ch.anchor] || {}).bld ?? null)
      : ch.pickOn ? pickResIdx(ch.pickOn, ch.canon) : null;
    const rb = gsRegisterBuilding({ street: ch.street, bldIdx,
      hnPin: ch.hn, owner_id: ch.owner, style: ch.style,
      canon: ch.canon, offmap: !!ch.offmap });
    if(!rb) continue;
    if(bldIdx != null) doneIdx.add(bldIdx);
    n++;
    for(const u of ch.units) gsRegisterUnit(rb.id, u);
  }
  const canonBld = (key) =>
    GS_REG.buildings.find(b => b.canon === key) || null;
  const leaseOn = (bld, unitCode, tenantId, spec) => {
    const u = bld &&
      gsUnitsOf(bld.id).find(x => x.unit_code === unitCode);
    if(u) gsSignLease(u.id, tenantId, spec);
    return u || null;
  };
  /* the canonical tenancies — Victor (C7) owns the two Guerrero
     Victorians and his own Mission St building; Jules is deliberately
     NOT on Carmen's lease (her violation record lands in leases.js) */
  leaseOn(canonBld('home-c6'), 'A', 'C6', { start: '1989-03-01',
    monthly_rent: 950, occupants: ['C6'] });
  leaseOn(canonBld('home-c4c5'), '3', 'C4', { start: '2022-06-01',
    monthly_rent: 3200, occupants: ['C4', 'C5'],
    /* Marcus's half is late about every third month (jobs-housing §4:
       the flat itself is the pressure cooker) — a real pay habit, not
       a scripted anecdote */
    shares: { C4: { amt: 1600 },
              C5: { amt: 1600, lateEvery: 3, lateDays: 10 } } });
  leaseOn(canonBld('home-c7'), '2', 'C7', { start: '1998-01-01',
    monthly_rent: 0, occupants: ['C7'], status: 'owner-occupied' });
  leaseOn(canonBld('home-c1'), 'C', 'C1', { start: '2018-11-01',
    monthly_rent: 1150, occupants: ['C1'] });
  /* the Geneva flat is the cousins' lease — Dani pays a $700 informal
     room share and is not on the paperwork (violation in leases.js) */
  leaseOn(canonBld('home-c3'), '4', 'reyes-cousins', { start: '2021-02-01',
    monthly_rent: 2100, occupants: ['reyes-cousins'] });
  leaseOn(canonBld('home-c8'), '1', 'C8', { start: '2020-04-01',
    monthly_rent: 1275, occupants: ['C8'] });

  /* phase 2 — generic residential stock */
  SF_MAP.buildings.forEach((b, i) => {
    if(!b.st || !GS_RES_KINDS[b.kind] || doneIdx.has(i)) return;
    const rb = gsRegisterBuilding({
      street: b.st, bldIdx: i, owner_id: 'landlord',
      style: b.kind === 'apartments' ? 'apartment building' : 'residential',
    });
    if(!rb) return;
    doneIdx.add(i); n++;
    const nUnits = gsSeedUnitCount(b);
    if(nUnits > 1){
      for(let u = 0; u < nUnits; u++){
        const code = gsUnitCodeAt(u);             // A, B, C, ... deterministic
        gsRegisterUnit(rb.id, { unit_code: code,
          bedrooms: 1 + (hashString18(rb.id + code) % 3),
          base_rent: 2200 + (hashString18(rb.id + code) % 1600),
          rent_controlled: (hashString18(rb.id + code) % 10) < 7 });
      }
    } else {
      gsRegisterUnit(rb.id, { bedrooms: 2 + (hashString18(rb.id) % 3),
        base_rent: 2400 + (hashString18(rb.id) % 1800),
        rent_controlled: (hashString18(rb.id) % 10) < 7 });
    }
  });
  /* lease lifecycle seed (ambient homes, Jules's + Dani's off-lease
     records, the contested 9457 raise, bank balances) lives in
     41_game_systems_leases.js and auto-runs at that module's load — it
     can't be hooked here: gsSeedSF runs during this module's own
     evaluation, before GS_LEASE exists (TDZ). */
  return n;
}

if(typeof SF_MODE !== 'undefined' && SF_MODE) gsSeedSF();
