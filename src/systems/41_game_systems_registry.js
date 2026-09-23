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
}

/* Register a building on a street. The generated number is deterministic
   given registration order; collisions on the same street bump the index
   until a free number is found (spec §3 collision rule). Returns the
   building record. */
function gsRegisterBuilding(spec){
  const street = spec.street;
  if(!street) return null;
  const used = GS_REG_USED.get(street) || new Set();
  let idx = GS_REG.buildings.filter(b => b.street === street).length;
  let hn = gsAddrNumber(street, idx);
  while(used.has(hn)){ idx++; hn = gsAddrNumber(street, idx); }
  const b = {
    id: 'bld-' + (++GS_REG.seq.bld),
    hn,
    street,
    address: gsFmtAddr(hn, street),
    style: spec.style || 'residential',
    units: [],
    owner_id: spec.owner_id || 'landlord',
    bld_idx: (spec.bldIdx != null ? spec.bldIdx : null),
    status: 'standing',
  };
  GS_REG.buildings.push(b);
  GS_REG_BLD.set(b.id, b);
  if(!GS_REG_USED.has(street)) GS_REG_USED.set(street, used);
  used.add(hn);
  return b;
}

function gsRegisterUnit(bldId, spec){
  const b = GS_REG_BLD.get(bldId);
  if(!b) return null;
  const code = spec && spec.unit_code != null ? String(spec.unit_code) : null;
  const u = {
    id: bldId + '-' + (code || ('u' + (++GS_REG.seq.unit))),
    bld_id: bldId,
    unit_code: code,
    bedrooms: spec && spec.bedrooms != null ? spec.bedrooms : 1,
    base_rent: spec && spec.base_rent != null ? spec.base_rent : 2000,
    rent_controlled: !!(spec && spec.rent_controlled),
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

/* spec §6 — landlord-as-clerk minting. The ONLY legal way to create an
   address at runtime: generate per §3, register before anyone is told,
   never reuse retired numbers, log the event for the world timeline. */
function gsMintAddress(street, reason, opts){
  const b = gsRegisterBuilding(Object.assign({ street }, opts || {}));
  if(!b) return null;
  GS_REG.mintLog.push({ stamp: gsStamp(), reason: reason || 'minted',
                        address: b.address, bld_id: b.id });
  return b;
}
/* Retire a building (demolition/merge): the number is never reused because
   GS_REG_USED keeps it forever. */
function gsRetireBuilding(bldId, reason){
  const b = GS_REG_BLD.get(bldId);
  if(!b || b.status === 'retired') return false;
  b.status = 'retired';
  GS_REG.retired.push(bldId);
  GS_REG.mintLog.push({ stamp: gsStamp(), reason: 'retired: ' + (reason || ''),
                        address: b.address, bld_id: bldId });
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

function gsSeedSF(){
  if(typeof SF_MAP === 'undefined' || !SF_MAP || !SF_MAP.buildings) return 0;
  const doneIdx = new Set(GS_REG.buildings.map(b => b.bld_idx));
  let n = 0;
  // generic residential stock
  SF_MAP.buildings.forEach((b, i) => {
    if(!b.st || !GS_RES_KINDS[b.kind] || doneIdx.has(i)) return;
    const rb = gsRegisterBuilding({
      street: b.st, bldIdx: i, owner_id: 'landlord',
      style: b.kind === 'apartments' ? 'apartment building' : 'residential',
    });
    if(!rb) return;
    doneIdx.add(i); n++;
    if(b.kind === 'apartments'){
      for(const code of ['A', 'B', 'C', 'D'])
        gsRegisterUnit(rb.id, { unit_code: code, bedrooms: 1 + (hashString18(rb.id + code) % 3),
          base_rent: 2200 + (hashString18(rb.id + code) % 1600),
          rent_controlled: (hashString18(rb.id + code) % 10) < 7 });
    } else {
      gsRegisterUnit(rb.id, { bedrooms: 2 + (hashString18(rb.id) % 3),
        base_rent: 2400 + (hashString18(rb.id) % 1800),
        rent_controlled: (hashString18(rb.id) % 10) < 7 });
    }
  });
  // cast homes — canonical per the cast bible (Victor = C7 owns both
  // Guerrero buildings; Jules is deliberately NOT on the 744 lease)
  const al = SF_MAP.anchors || {};
  const seedCastHome = (anchorKey, street, style, units) => {
    const a = al[anchorKey];
    const bldIdx = a ? a.bld : null;
    if(bldIdx != null && doneIdx.has(bldIdx))
      return GS_REG.buildings.find(x => x.bld_idx === bldIdx);
    const rb = gsRegisterBuilding({ street, bldIdx, owner_id: 'C7', style });
    if(bldIdx != null) doneIdx.add(bldIdx);
    if(rb) for(const u of units) gsRegisterUnit(rb.id, u.spec);
    return rb;
  };
  const pickResOn = (street, seed) => {
    const cand = GS_REG.buildings.filter(b => b.street === street &&
      GS_RES_KINDS[(SF_MAP.buildings[b.bld_idx] || {}).kind]);
    return cand.length ? cand[hashString18(seed) % cand.length] : null;
  };
  const leaseOn = (bld, unitCode, tenantId, spec) => {
    if(!bld) return;
    const u = gsUnitsOf(bld.id).find(x => x.unit_code === unitCode) || gsUnitsOf(bld.id)[0];
    if(u) gsSignLease(u.id, tenantId, spec);
  };

  const b744 = seedCastHome('g744', 'Guerrero Street', 'Victorian', [
    { spec: { unit_code: 'A', bedrooms: 2, base_rent: 1400, rent_controlled: true } },
    { spec: { unit_code: 'B', bedrooms: 2, base_rent: 2400, rent_controlled: true } },
  ]);
  leaseOn(b744, 'A', 'C6', { start: '1989-03-15', monthly_rent: 1400, occupants: ['C6'] });

  const b750 = seedCastHome('g750', 'Guerrero Street', 'Victorian', [
    { spec: { unit_code: 'A', bedrooms: 1, base_rent: 1800, rent_controlled: true } },
    { spec: { unit_code: 'B', bedrooms: 2, base_rent: 2600, rent_controlled: true } },
  ]);
  leaseOn(b750, 'B', 'C4', { start: '2022-06-01', monthly_rent: 2600, occupants: ['C4', 'C5'] });

  const bAuer = seedCastHome('auerbach', 'Mission Street', 'mixed-use', [
    { spec: { unit_code: 'A', bedrooms: 1, base_rent: 0, rent_controlled: false } },
  ]);
  leaseOn(bAuer, 'A', 'C7', { start: '1998-01-01', monthly_rent: 0,
                              occupants: ['C7'], status: 'owner-occupied' });

  leaseOn(pickResOn('Capp Street', 'C1'), 'A', 'C1',
          { start: '2019-09-01', monthly_rent: 1850, occupants: ['C1'] });
  leaseOn(pickResOn('24th Street', 'C3'), 'A', 'C3',
          { start: '2023-02-01', monthly_rent: 1100, occupants: ['C3'] });
  leaseOn(pickResOn('Mission Street', 'C8'), 'A', 'C8',
          { start: '2018-05-01', monthly_rent: 2100, occupants: ['C8'] });
  return n;
}

if(typeof SF_MODE !== 'undefined' && SF_MODE) gsSeedSF();
