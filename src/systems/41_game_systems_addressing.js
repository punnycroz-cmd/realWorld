/* =====================================================================
   PART 41E: GAME SYSTEMS — ADDRESSING (the clerk's front desk)

   Roadmap v4 second half: the registry (41A) stores the places; this
   module is how AIs, admin tooling, and the feed ASK about them.

   - gsAddressOf(id)        — polymorphic: unit id -> full address,
                              building id -> building address.
   - gsResidents(id)        — polymorphic: who lives at a unit/building
                              (delegates to the lease layer's resolution,
                              incl. unpermitted occupants).
   - gsOccupancyOf(bldId)   — per-unit status/residents of one building.
   - gsVacantUnits(opts)    — the leasable stock (hire flow, listings).
   - gsParseAddress(str)    — "9431 Guerrero Street, San Francisco, CA
                              Unit B" -> {bld, unit}. Street-name suffixes
                              normalize (St/Street, Ave/Avenue, ...).
   - gsLookupPlace(ref)     — one-call resolution: id or address string
                              -> {building, unit, address, lease, ...}.
   - gsRegistryAudit()      — integrity scan: the privacy rule (every
                              number >= 9000, spec §7), spec-formula
                              conformance, per-street uniqueness, address
                              immutability, orphan/dup checks, lease
                              coherence. Run in tests, callable live.
   - gsCastAddressBook() /  — the spec §8 migration executed: every cast
     gsBibleMigrationReport()  member's bible HOUSEHOLD cross-checked
                              against a real registry address.
   ===================================================================== */

/* ---- street-name normalization for parsing (loose but honest:
   'Guerrero St' == 'Guerrero Street' == 'guerrero street') ---- */
const GS_ADDR_STREET_FIX = {
  st: 'street', ave: 'avenue', av: 'avenue', blvd: 'boulevard',
  ln: 'lane', dr: 'drive', ter: 'terrace', pl: 'place',
  al: 'alley', aly: 'alley', wy: 'way', ct: 'court', rd: 'road',
  cir: 'circle', hwy: 'highway', sq: 'square', walk: 'walk',
};
function gsNormStreet(s){
  return String(s == null ? '' : s).trim().toLowerCase()
    .replace(/\./g, '').replace(/\s+/g, ' ')
    .split(' ').map(w => GS_ADDR_STREET_FIX[w] || w).join(' ');
}

/* polymorphic address: a unit id yields its full "… Unit X" address,
   a building id the building's own. Null on anything else. */
function gsAddressOf(id){
  const u = gsUnitById(id);
  if(u) return gsAddressOfUnit(u.id);
  const b = gsBldById(id);
  return b ? b.address : null;
}

/* polymorphic residents: unit id -> that unit's residents; building id
   -> everyone in the building. Includes unpermitted occupants when the
   lease layer knows about them (gsResidentsOf handles that). */
function gsResidents(id){
  const u = gsUnitById(id);
  if(u){
    if(typeof gsResidentsOf === 'function') return gsResidentsOf(id);
    const l = gsActiveLease(id);
    return l ? [l.tenant_id].concat(l.occupants || [])
               .filter((x, i, a) => x && a.indexOf(x) === i) : [];
  }
  const b = gsBldById(id);
  if(b){
    const out = [];
    for(const uid of b.units)
      for(const c of gsResidents(uid))
        if(out.indexOf(c) < 0) out.push(c);
    return out;
  }
  return [];
}

/* one building, per-unit truth: status, residents, live lease. The
   landlord's clipboard view of a property. */
function gsOccupancyOf(bldId){
  const b = gsBldById(bldId);
  if(!b) return null;
  return {
    id: b.id, address: b.address, street: b.street, hn: b.hn,
    style: b.style, status: b.status, owner: b.owner_id,
    units: gsUnitsOf(bldId).map(u => {
      const l = gsActiveLease(u.id);
      return { id: u.id, code: u.unit_code, status: u.status || 'active',
        bedrooms: u.bedrooms, base_rent: u.base_rent,
        rent_controlled: u.rent_controlled, origin: u.origin || 'seed',
        address: gsAddressOfUnit(u.id),
        residents: gsResidents(u.id),
        lease: l ? { tenant: l.tenant_id, rent: l.monthly_rent,
                     status: l.status } : null };
    }),
  };
}

/* the leasable stock — hire flow and listings both draw from this.
   Off-map buildings (canonical homes on streets the map doesn't cover)
   are real registry places but not rentable in-game — opts.offmap
   includes them for bookkeeping views. */
function gsVacantUnits(opts){
  opts = opts || {};
  const wantStreet = opts.street ? gsNormStreet(opts.street) : null;
  const out = [];
  for(const b of GS_REG.buildings){
    if(b.status !== 'standing') continue;
    if(b.offmap && !opts.offmap) continue;
    if(wantStreet && gsNormStreet(b.street) !== wantStreet) continue;
    for(const uid of b.units){
      const u = gsUnitById(uid);
      if(!gsUnitVacant(u)) continue;
      out.push({ unit: u, building: b, address: gsAddressOfUnit(uid) });
    }
  }
  return out;
}

/* "9431 Guerrero Street, San Francisco, CA Unit B" ->
   {hn, street, bld, unit}. Parses loose forms too ("…Guerrero St",
   "…#EIS", "… Apt 2"). A well-formed but unknown address returns
   {bld:null} — parsed, just not ours. */
function gsParseAddress(str){
  if(typeof str !== 'string') return null;
  let s = str.trim();
  if(!s) return null;
  let unitCode = null;
  const um = /(?:^|[\s,])(?:unit|apt|apartment|ste|suite|#)\s*([#a-z0-9]{1,4})\s*$/i
    .exec(s);
  if(um){ unitCode = um[1]; s = s.slice(0, um.index).trim(); }
  s = s.replace(/,?\s*san francisco,?\s*(ca|california)?\.?\s*$/i, '').trim();
  const m = /^(\d{4,5})\s+(.+)$/.exec(s);
  if(!m) return null;
  const hn = +m[1], street = gsNormStreet(m[2]);
  const b = GS_REG.buildings.find(x => x.hn === hn &&
    gsNormStreet(x.street) === street) || null;
  if(!b) return { hn, street, bld: null, unit: null };
  let u = null;
  if(unitCode){
    const want = unitCode.toUpperCase();
    u = gsUnitsOf(b.id).find(x => {
      const c = String(x.unit_code || '').toUpperCase();
      return c === want || c === '#' + want;
    }) || null;
  }
  return { hn, street: b.street, bld: b, unit: u,
           address: b.address };
}

/* one-call resolution for AIs: accepts a unit id, a building id, or an
   address string; returns the fully-resolved place record or null. */
function gsLookupPlace(ref){
  if(!ref) return null;
  let b = gsBldById(ref), u = gsUnitById(ref);
  if(!b && !u && typeof ref === 'string'){
    const p = gsParseAddress(ref);
    if(p && p.bld){ b = p.bld; u = p.unit; }
    else if(!p) return null;
    else return { building: null, unit: null, parsed: p };
  }
  if(u && !b) b = gsBldById(u.bld_id);
  if(!b) return null;
  const unit = u || null;
  return {
    building: b, unit,
    address: unit ? gsAddressOfUnit(unit.id) : b.address,
    residents: gsResidents(unit ? unit.id : b.id),
    lease: unit ? gsActiveLease(unit.id) : null,
    livable: unit ? gsUnitLivable(unit) : null,
    occupancy: u ? null : gsOccupancyOf(b.id),
  };
}

/* headline numbers for admin tooling / tests */
function gsRegistryStats(){
  let livable = 0, vacant = 0, withdrawn = 0;
  for(const u of GS_REG.units){
    if(!gsUnitLivable(u)) { withdrawn++; continue; }
    livable++;
    if(!gsActiveLease(u.id)) vacant++;
  }
  return { buildings: GS_REG.buildings.length,
    standing: GS_REG.buildings.filter(b => b.status === 'standing').length,
    units: GS_REG.units.length, livable, vacant, withdrawn,
    leases: GS_REG.leases.length,
    liveLeases: GS_REG.leases.filter(l => l.status === 'active' ||
      l.status === 'owner-occupied').length,
    retiredBuildings: GS_REG.retired.length,
    mintLogEntries: GS_REG.mintLog.length };
}

/* ---------------- integrity audit ----------------
   The registry is only trustworthy if its invariants actually hold —
   this is the verifier. Returns {ok, issues[], counts}; every check
   names a real rule from rw-address-system-spec.md. */
function gsRegistryAudit(){
  const issues = [];
  const perStreet = {};
  for(const b of GS_REG.buildings)
    perStreet[b.street] = (perStreet[b.street] || 0) + 1;
  const seenNum = {};
  for(const b of GS_REG.buildings){
    /* spec §7 privacy by construction: generated numbers are 9xxx, real
       block maxima are < 2000 — a real-range number in the registry is
       a breach, full stop */
    if(!(b.hn >= 9000 && b.hn < 9900))
      issues.push(b.id + ': house number out of generated range (' +
                  b.hn + ') — privacy rule breach');
    const key = b.street + '|' + b.hn;
    if(seenNum[key]) issues.push(b.id + ': number collision on ' + key);
    seenNum[key] = 1;
    /* spec §3: every number must be reachable by the formula. Buildings
       record the index used (b.addr_idx — sequential or a designer pin's
       searched index); legacy-loaded records without it get the scan. */
    let hit = false;
    if(b.addr_idx != null){
      hit = gsAddrNumber(b.street, b.addr_idx) === b.hn;
    } else {
      for(let i = 0; i <= perStreet[b.street] + 16 && !hit; i++)
        if(gsAddrNumber(b.street, i) === b.hn) hit = true;
    }
    if(!hit) issues.push(b.id + ': number fails the §3 formula');
    /* spec §2/§3: the stored address string must equal its number+street
       — address drift means someone edited a place record */
    if(b.address !== gsFmtAddr(b.hn, b.street))
      issues.push(b.id + ': address drifted from number/street');
    if(b.status !== 'standing' && b.status !== 'retired')
      issues.push(b.id + ': unknown status "' + b.status + '"');
    const codes = {};
    for(const uid of b.units){
      const u = gsUnitById(uid);
      if(!u){ issues.push(b.id + ': phantom unit ref ' + uid); continue; }
      if(u.bld_id !== b.id) issues.push(uid + ': bld_id mismatch');
      if(u.unit_code){
        if(!GS_UNIT_CODE_RE.test(u.unit_code))
          issues.push(uid + ': bad unit code "' + u.unit_code + '"');
        if(codes[u.unit_code]) issues.push(uid + ': dup code ' + u.unit_code);
        codes[u.unit_code] = 1;
      }
    }
  }
  for(const u of GS_REG.units){
    const b = gsBldById(u.bld_id);
    if(!b) issues.push(u.id + ': orphan unit');
    else if(b.units.indexOf(u.id) < 0)
      issues.push(u.id + ': not listed on its building');
  }
  const liveByUnit = {};
  for(const l of GS_REG.leases){
    const u = gsUnitById(l.unit_id);
    if(!u){ issues.push('lease on phantom unit ' + l.unit_id); continue; }
    if(l.status === 'active' || l.status === 'owner-occupied'){
      if(liveByUnit[l.unit_id])
        issues.push(l.unit_id + ': two live leases');
      liveByUnit[l.unit_id] = 1;
      if(!gsUnitLivable(u))
        issues.push(l.unit_id + ': live lease on a non-livable unit');
    }
  }
  for(const rid of GS_REG.retired){
    const b = gsBldById(rid);
    if(!b) issues.push('retired list names unknown ' + rid);
    else if(b.status !== 'retired')
      issues.push(rid + ': retired list/status mismatch');
  }
  for(const e of GS_REG.mintLog)
    if(!e.address || !e.bld_id)
      issues.push('mintLog entry missing address/bld_id');
  return { ok: issues.length === 0, issues, counts: gsRegistryStats() };
}

/* ---------------- spec §8: the cast-bible migration, executed ----------
   The bible's HOUSEHOLD fields were written with plausible-real numbers
   before the address spec existed; the world track (jobs-housing.md §3,
   characters/_index.md) then authored the canonical 9xxx addresses the
   fiction uses. The seed pins those exact numbers through the §3 formula,
   so this table is now a strict cross-check: every bible household must
   resolve to its CANONICAL address — number, street, and unit code. */
const GS_BIBLE_HOUSEHOLDS = {
  C1: { ref: 'rent-controlled studio on Capp St',
        want: '9127 Capp Street, San Francisco, CA Unit C' },
  C2: { ref: "Carmen's spare room at 9418 Guerrero (cash, off-lease)",
        want: '9418 Guerrero Street, San Francisco, CA Unit A' },
  C3: { ref: 'flat on Geneva Ave shared with cousins',
        want: '9263 Geneva Avenue, San Francisco, CA Unit 4' },
  C4: { ref: 'top-floor flat at 9457 Guerrero',
        want: '9457 Guerrero Street, San Francisco, CA Unit 3' },
  C5: { ref: 'shares the 9457 Guerrero flat',
        want: '9457 Guerrero Street, San Francisco, CA Unit 3' },
  C6: { ref: 'flat at 9418 Guerrero since 1989',
        want: '9418 Guerrero Street, San Francisco, CA Unit A' },
  C7: { ref: 'flat above Auerbach Hardware on Mission St',
        want: '9102 Mission Street, San Francisco, CA Unit 2' },
  C8: { ref: 'studio on Folsom St',
        want: '9344 Folsom Street, San Francisco, CA Unit 1' },
};
function gsCastAddressBook(){
  const cast = (typeof NV_CAST !== 'undefined') ? NV_CAST : [];
  return cast.map(c => {
    const h = (typeof gsHomeOf === 'function') ? gsHomeOf(c.id) : null;
    const bb = GS_BIBLE_HOUSEHOLDS[c.id];
    const b = h && h.unit_id &&
      (typeof gsUnitById === 'function') ? gsUnitById(h.unit_id) : null;
    const pb = b && (typeof gsBldById === 'function')
      ? gsBldById(b.bld_id) : null;
    return { cid: c.id, name: c.name || null, tier: c.tier || null,
      bibleRef: bb ? bb.ref : null, want: bb ? bb.want : null,
      unitId: h ? h.unit_id : null,
      address: h ? h.address : null,
      via: h ? h.via : null,
      offmap: !!(pb && pb.offmap) };
  });
}
/* compare a resolved registry address to the canonical want, tolerating
   suffix spelling (St/Street, Ave/Avenue) — the digits and unit code
   must match exactly. */
function gsAddrMatches(got, want){
  if(!got || !want) return false;
  const p = gsParseAddress(want);
  if(!p) return false;
  const q = gsParseAddress(got);
  if(!q || !q.bld) return false;
  if(q.hn !== p.hn || q.street !== p.street) return false;
  const wantUnit = /Unit\s+([#A-Za-z0-9]{1,4})\s*$/i.exec(want);
  const wCode = wantUnit ? wantUnit[1].toUpperCase() : null;
  const gCode = q.unit ? String(q.unit.unit_code || '').toUpperCase() : null;
  return wCode === gCode;
}
function gsBibleMigrationReport(){
  const rows = [];
  let ok = true;
  for(const cid of Object.keys(GS_BIBLE_HOUSEHOLDS)){
    const bb = GS_BIBLE_HOUSEHOLDS[cid];
    const h = (typeof gsHomeOf === 'function') ? gsHomeOf(cid) : null;
    const row = { cid, bible: bb.ref, want: bb.want,
      address: h ? h.address : null, via: h ? h.via : null };
    if(!h || !/^9\d{3} /.test(h.address || '')){
      row.status = 'unresolved'; ok = false;
    } else if(gsAddrMatches(h.address, bb.want)){
      row.status = 'ok';
    } else {
      row.status = 'moved'; ok = false;   // housed, but not at canon
    }
    rows.push(row);
  }
  return { ok, rows };
}

/* ---- bridge surface ---- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.gsAddressOf = (id) => gsAddressOf(id);
  window.__aiBridge.gsResidents = (id) => gsResidents(id);
  window.__aiBridge.gsOccupancyOf = (id) => gsOccupancyOf(id);
  window.__aiBridge.gsVacantUnits = (o) => gsVacantUnits(o);
  window.__aiBridge.gsParseAddress = (s) => gsParseAddress(s);
  window.__aiBridge.gsLookupPlace = (r) => gsLookupPlace(r);
  window.__aiBridge.gsRegistryStats = () => gsRegistryStats();
  window.__aiBridge.gsRegistryAudit = () => gsRegistryAudit();
  window.__aiBridge.gsCastAddressBook = () => gsCastAddressBook();
  window.__aiBridge.gsBibleMigrationReport = () => gsBibleMigrationReport();
}
