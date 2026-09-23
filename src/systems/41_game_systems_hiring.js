/* =====================================================================
   PART 41H: GAME SYSTEMS — THE PERSONNEL OFFICE (v8 hiring)

   The hire request is the only door INTO the world (design §6 — the mains
   are unpossessable, so in-world agency is a character you hire). v1 hired
   a name onto a lease; v8 hires a PERSON with a file:

   - Flat 500cr, billed AFTER screening passes (creation.json price:
     "flat, one-time, charged upfront after screening passes"; "denied
     applications never bill"). The bus parks every named hire in the
     naming lane (moderation §4 — a human reads it) and the charge lands
     at approval, not at filing. A post-approval failure refunds in full.
   - A structured application, not a note: name / age / pronouns / bio /
     arrival / look{build,palette,signature} / job_id / unit_id —
     creation.json record_schema verbatim. Screened strings ride the same
     intent screen as every other request (name + bio + arrival are in
     its haystack); name-collision is a registry check on top, exactly
     like creation-ui.md's live availability gate.
   - A real job board (world/jobs.json + shifts.json 'open' grid slots):
     openings are finite and consumed atomically at activation. 'seeking'
     stays legal — the character arrives without work and the runway
     months are computed honestly, never hidden.
   - The 55% rent-to-income ceiling (creation.json
     economics_shown_before_signing): with a job, a unit above the
     ceiling is an out_of_reach denial at pick time — "never a surprise
     denial after payment". With no job every door stays open and the
     months-until-broke number is written on the record.
   - The currency wall is load-bearing: the hire fee is credits; the
     arrival bank ($1,600), deposit, first month, wages, and rent are
     game dollars on the same ledger as everyone on the block.
   - The apartment hunt is part of the package: the lease signs through
     the ordinary application path with the deposit waived (a real
     move-in special, recorded as hirePackage on the lease); the first
     month is pro-rated and paid out of the arrival bank on day one.
   - Jobs pay: thin-AI auto-shifts post baseline wages employer ->
     character every Friday (entry/informal weekly; mid/top bands
     biweekly — shifts.json payday), all through the ledger. A
     possession running during payday earns the same wage + a small
     session bonus — never pay-to-earn-better.
   - h## ids, monotonic, disjoint from C1-C8 and A01-A20 forever.
   - 'rehouse' is the humane end of the eviction loop: a hire who loses
     their home can be re-doored through the same paperwork path — a
     normal second lease, deposit and all.
   ===================================================================== */

const GS_HIRE = {
  feeCr: 500,                // flat — requests.json hire.billing 'flat'
  arrivalBank: 1600,         // creation.json economics — game dollars
  incomeCeiling: 0.55,       // rent_to_income_ceiling_pct
  sessionBonus: 0.15,        // small, never pay-to-earn-better
  nameMin: 2, nameMax: 40,
  ageMin: 18, ageMax: 99,    // player-possessable characters are adults
  employerFloat: 200000,     // a business's operating float (admin faucet)
  rehouseFee: 150,           // 30cr x 5min — a second apartment hunt
  look: {
    build: ['slight', 'compact', 'tall', 'broad', 'angular'],
    palette: ['fog grey', 'mission mural', 'moss', 'midnight',
              'ochre', 'plum'],
    signature: ['windbreaker, always', 'paint-flecked work boots',
                'loud prints, louder laugh', 'cardigans and a paperback',
                'running gear at dawn', 'denim jacket, pins on the collar'],
  },
};
/* palette name -> the shirt a designer would hand them (create.html LOOK) */
const GS_HIRE_PALETTE = {
  'fog grey': '#8b95a1', 'mission mural': '#c46a4e', 'moss': '#5f7a5a',
  'midnight': '#3d4d6b', 'ochre': '#c99a3c', 'plum': '#7d5a7a',
};
/* signature -> wardrobe detail the structured pickers carry */
const GS_HIRE_SIG = {
  'windbreaker, always':              { outfit: 'jacket' },
  'paint-flecked work boots':         { boots: '#c99a3c', outfit: 'overalls' },
  'loud prints, louder laugh':        { outfit: 'vest' },
  'cardigans and a paperback':        { outfit: 'sweater', prop: 'tote' },
  'running gear at dawn':             { outfit: 'hoodie', prop: 'none' },
  'denim jacket, pins on the collar': { outfit: 'jacket' },
};
/* the names the block already answers to — create.html TAKEN verbatim
   (cast + ambients + the role words), plus every hired name as it's born.
   A word-boundary match: 'Reyes' collides, 'Reyes-Carpenter' doesn't. */
const GS_HIRE_TAKEN =
  /\b(marisol|mars delgado|jules park|dani reyes|priya raman|marcus bell|carmen echeverr|victor auerbach|tom[aá]s herrera|reyes ortega|doro|malik|june|esther|kofe|luz|asha|gus|vera|nadia|bex|omar|hana|cole|ida|zee|landlord|admin|owner)\b/i;

/* ---------------- the job board ----------------
   machine mirror of world/jobs.json openings + shifts.json 'open' grid
   slots + create.html's displayed economics. est = the monthly income
   the creation UI shows; weeklyWage derives from it so the ledger and
   the display tell the same story. pay: 'weekly' (entry/informal —
   every Friday) or 'biweekly' (mid/top band — alternate Fridays,
   anchored per-character so the block's payrolls don't all land at
   once). openings: finite count, -1 = always hiring (churn gig).
   'seeking' is a real row — arrives without work is a legal pick. */
const GS_JOBS = [
  { id: 'mudhaus-barista',  employer: 'Mudhaus Coffee',
    employerId: 'mudhaus',  role: 'Barista', wage: 19,
    hrs: '30-38 h/wk', est: 2400, pay: 'weekly', openings: 1,
    poi: 'Haus Coffee',
    shift: { h0: 14, h1: 19.5, state: 'serve' },
    shiftTxt: 'mornings, some weekends' },
  { id: 'farolote-line',  employer: 'Taqueria El Farolote',
    employerId: 'farolote', role: 'Line cook', wage: 26,
    hrs: '35 h/wk', est: 3900, pay: 'biweekly', openings: 1,
    poi: 'Taqueria El Farolito',
    shift: { h0: 11, h1: 18.5 },
    shiftTxt: 'dinners, late Fridays' },
  { id: 'farolote-counter', employer: 'Taqueria El Farolote',
    employerId: 'farolote', role: 'Counter/closer', wage: 18,
    hrs: '30 h/wk', est: 2300, pay: 'weekly', openings: 1,
    poi: 'Taqueria El Farolito',
    shift: { h0: 17, h1: 24, state: 'serve' },
    shiftTxt: 'evenings' },
  { id: 'muleit-rider',   employer: 'MuleIt', employerId: 'muleit',
    role: 'Delivery rider', wage: 17, hrs: 'variable', est: 1800,
    pay: 'weekly', openings: -1, poi: null,
    shift: { kind: 'roam' }, shiftTxt: 'whenever they log in' },
  { id: 'buyrite-clerk',  employer: 'Buy-Rite Market',
    employerId: 'buyrite', role: 'Grocery clerk', wage: 19,
    hrs: '32 h/wk', est: 2600, pay: 'weekly', openings: 1,
    poi: 'Bi-Rite Market',
    shift: { h0: 8, h1: 16.5, state: 'serve' },
    shiftTxt: 'weekday days' },
  { id: 'creamery-scooper', employer: 'Buy-Rite Creamery',
    employerId: 'buyrite', role: 'Scooper', wage: 17,
    hrs: '24 h/wk', est: 1800, pay: 'weekly', openings: 1,
    poi: 'Bi-Rite Creamery',
    shift: { h0: 15, h1: 21, state: 'serve' },
    shiftTxt: 'afternoons' },
  { id: 'perk-counter',   employer: 'Dolores Perk', employerId: 'perk',
    role: 'Counter', wage: 18, hrs: '30 h/wk', est: 2300,
    pay: 'weekly', openings: 1, poi: 'Dolores Park Cafe',
    shift: { h0: 6.5, h1: 14, state: 'serve' },
    shiftTxt: 'early mornings' },
  { id: 'bai-counter',    employer: 'Baguette About It Bakery',
    employerId: 'bai', role: 'Counter, afternoons', wage: 18,
    hrs: '25 h/wk', est: 1950, pay: 'weekly', openings: 1,
    poi: 'Tartine Bakery',
    shift: { h0: 12, h1: 17, state: 'serve' },
    shiftTxt: 'after the lunch rush' },
  { id: 'delfino-line',   employer: 'Il Delfino', employerId: 'delfino',
    role: 'Line cook', wage: 27, hrs: '35 h/wk', est: 4100,
    pay: 'biweekly', openings: 1, poi: 'Delfina',
    shift: { h0: 16.5, h1: 23 },
    shiftTxt: 'dinners' },
  { id: 'delfino-server', employer: 'Il Delfino', employerId: 'delfino',
    role: 'Server', wage: 18, hrs: '30 h/wk + tips', est: 2600,
    tips: true, pay: 'weekly', openings: 2, poi: 'Delfina',
    shift: { h0: 17, h1: 23, state: 'serve' },
    shiftTxt: 'evenings' },
  { id: 'auerbach-clerk', employer: 'Auerbach Hardware',
    employerId: 'auerbach', role: 'Counter clerk', wage: 21,
    hrs: '30 h/wk', est: 2700, pay: 'weekly', openings: 1,
    poi: 'Auerbach Hardware',
    shift: { h0: 10, h1: 16.5, state: 'serve' },
    shiftTxt: 'daytime, keys at close' },
  { id: 'bloom-saturday', employer: 'Bloom & Doom Flowers',
    employerId: 'bloom', role: 'Saturday counter help', wage: 18,
    hrs: '8 h/wk', est: 620, pay: 'weekly', openings: 1,
    poi: 'Diosa Blooms',
    shift: { h0: 10, h1: 15, state: 'serve' },
    shiftTxt: 'Saturdays' },
  { id: 'sfgh-cna',       employer: 'SF General', employerId: 'sfgh',
    role: 'CNA/tech', wage: 22, hrs: '36 h/wk', est: 3400,
    pay: 'weekly', openings: 2, poi: null, offstage: 'SF General',
    shift: { h0: 7, h1: 19.5, to: { poi: 'SF General' }, altNight: true },
    shiftTxt: 'rotating, incl. nights' },
  /* 'seeking' is always on the board — arrival money buys time while
     the real postings churn; runway honesty replaces a locked door */
  { id: 'seeking', employer: null, role: 'Arrives without work',
    wage: 0, hrs: '--', est: 0, openings: -1, shift: null },
];
const GS_JOBS_OPEN0 = {};   // id -> openings at reset (immutable board copy)
GS_JOBS.forEach(j => { GS_JOBS_OPEN0[j.id] = j.openings; });
const GS_HIRE_SEQ = { n: 0 };
/* biweekly anchor: paydays alternate Fridays keyed on the character so
   two biweekly hires don't share a payday by construction */
const GS_PAY_EPOCH = '2026-01-02';   // a Friday

function gsHireJobOf(id){
  return GS_JOBS.find(j => j.id === (id || 'seeking')) || null;
}
function gsJobWeekly(j){
  return Math.round((j.est || 0) * 12 / 52);
}
function gsHireEmployer(j){
  return 'biz:' + (j.employerId || 'unknown');
}
/* the honest runway number (create.html runwayMonths): burn = rent -
   income; arrival bank / burn = months until broke. null = sustainable. */
function gsHireRunway(est, rent){
  const burn = (rent || 0) - (est || 0);
  return burn > 0 ? +((GS_HIRE.arrivalBank / burn).toFixed(1)) : null;
}
function gsHireAllocId(){
  /* monotonic h## — never reused even after a release, so a ledger line
     always names the same person */
  for(let i = 1; i <= 999; i++){
    if(i <= GS_HIRE_SEQ.n) continue;
    const cid = 'h' + (i < 10 ? '0' : '') + i;
    if(!GS_HIRED[cid]){ GS_HIRE_SEQ.n = i; return cid; }
  }
  return null;
}
function gsHireSeqFromHired(){
  /* older snapshots hired h## without carrying the counter — rebuild it
     from the ids present so allocation never collides */
  for(const cid in GS_HIRED){
    const m = /^h(\d+)$/.exec(cid);
    if(m && +m[1] > GS_HIRE_SEQ.n) GS_HIRE_SEQ.n = +m[1];
  }
}

/* ---------------- the application ----------------
   the live availability check — the creation form runs this on every
   keystroke; the request bus runs it before any money moves */
function gsHireNameCheck(name){
  if(typeof name !== 'string' || !name.trim())
    return { ok: false, reason: 'needs_name' };
  const n = name.trim();
  if(n.length < GS_HIRE.nameMin) return { ok: false, reason: 'name_too_short' };
  if(n.length > GS_HIRE.nameMax) return { ok: false, reason: 'name_too_long' };
  if(GS_HIRE_TAKEN.test(n))      return { ok: false, reason: 'name_collision' };
  for(const cid in GS_HIRED){
    const hn = GS_HIRED[cid] && GS_HIRED[cid].name;
    if(hn && hn.toLowerCase() === n.toLowerCase())
      return { ok: false, reason: 'name_collision' };
  }
  return { ok: true, name: n };
}
/* structural validation of the whole application — screens WHAT THE
   PLAYER WROTE (the intent screen already read name/bio/arrival; this
   is the registry-and-shape layer): name free, adult, structured look,
   known job. Age omitted is fine — a hire defaults to an adult; age
   ASSERTED under 18 is the contract's 'underage' denial. */
function gsHireAppCheck(p){
  const nc = gsHireNameCheck(p.name);
  if(!nc.ok) return { deny: nc.reason };
  if(p.age != null){
    if(typeof p.age !== 'number' || !isFinite(p.age)) return { deny: 'bad_age' };
    if(p.age < GS_HIRE.ageMin) return { deny: 'underage' };
    if(p.age > GS_HIRE.ageMax) return { deny: 'bad_age' };
  }
  if(p.look != null){
    const l = p.look;
    if(!l || typeof l !== 'object') return { deny: 'bad_look' };
    if(l.build != null && GS_HIRE.look.build.indexOf(l.build) < 0)
      return { deny: 'bad_look' };
    if(l.palette != null && GS_HIRE.look.palette.indexOf(l.palette) < 0)
      return { deny: 'bad_look' };
    if(l.signature != null && GS_HIRE.look.signature.indexOf(l.signature) < 0)
      return { deny: 'bad_look' };
  }
  return { ok: true };
}
/* allow() for the 'hire' action — standing validity. Order matters:
   the door (housing + caps) reads before the paperwork, so an over-cap
   or un-housed filing reports the structural refusal it actually is. */
function gsHireAllow(r, now){
  if(!r.target) return 'needs_housing';
  const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
  if(!u) return 'unknown_unit';
  if(!gsUnitLivable(u)) return 'unit_not_livable';
  const hb = gsBldById(u.bld_id);
  if(hb && hb.offmap) return 'unit_offmap';       // the cast lives on-map
  if(gsActiveLease(u.id)) return 'unit_occupied';
  if(gsHiredCount(r.playerId) >= GS_MAX_HIRED_PER_PLAYER) return 'hire_cap';
  if(Object.keys(GS_HIRED).length >= GS_MAX_HIRED_TOTAL) return 'cast_cap';
  if(gsIsAdmin(r.playerId)) return true;          // the owner IS the reviewer
  const p = r.params || {};
  const app = gsHireAppCheck(p);
  if(app.deny) return app.deny;
  const job = gsHireJobOf(p.job);
  if(!job) return 'unknown_job';
  if(job.openings === 0) return 'job_filled';
  /* the out-of-reach gate — with income, a unit above the 55% ceiling is
     unselectable at pick time; with 'seeking' the door stays open and the
     runway number carries the honesty */
  const rent = u.base_rent || 0;
  if(job.est > 0 && rent > 0 &&
     rent / job.est > GS_HIRE.incomeCeiling) return 'out_of_reach';
  return true;
}

/* ---------------- the move-in ----------------
   shared by hire and rehouse: application -> approval -> signed lease.
   The hire package waives the deposit (recorded as hirePackage on the
   lease); a re-home is a normal second lease — deposit owed like anyone
   else's. The first month posts pro-rated and auto-pays on arrival. */
function gsHireMoveIn(u, cid, startDate, opts){
  opts = opts || {};
  const app = gsApplyForLease(u.id, cid, {
    occupants: [cid], date: startDate,
    deposit: opts.deposit != null ? opts.deposit : null,
    note: opts.note || 'move-in',
    by: 'agent',   /* v11: the office files for them — the character's
                      own willingness gate (reputation) doesn't veto a
                      player's placement; their stance still decides
                      whether they stay */
  });
  if(!app || app.ok === false)
    return { ok: false, reason: (app && app.reason) || 'application_failed' };
  const ap = gsApproveApplication(app.id, { date: startDate });
  if(!ap.ok) return { ok: false, reason: ap.reason || 'lease_failed' };
  const l = ap.lease;
  if(opts.hirePackage) l.hirePackage = true;
  /* first month, pro-rated for a mid-month door — same math the rent
     run uses, posted once at signing so day one is already honest */
  const sd = gsDateParse(startDate);
  if(l.monthly_rent > 0 && sd){
    const period = gsPeriodOf(startDate);
    const pd = gsDateParse(period + '-01');
    const amt = sd.d > 1
      ? Math.round(l.monthly_rent * (gsDim(pd.y, pd.m) - sd.d + 1) /
                   gsDim(pd.y, pd.m))
      : l.monthly_rent;
    const ch = gsPostCharge(l, { kind: 'rent', period, dueOn: startDate, amt });
    l.chargeSeq++;
    gsLeaseAutopay(l, ch, startDate, null);
  }
  return { ok: true, lease: l, app };
}
function gsHireMoveInDate(p){
  if(p && typeof p.moveInDate === 'string' && gsDateParse(p.moveInDate))
    return p.moveInDate;
  return (typeof gsTodayStr === 'function' && gsTodayStr()) || '1970-01-01';
}

/* ---------------- activation ----------------
   the office's one stamp: allocate the h##, open the file, sign the
   lease, hand over the arrival bank, consume the job opening, walk them
   onto the stage, tell the block. A failure anywhere upstream was
   already caught by allow(); a failure HERE refunds in full through
   the bus's activation-failed path. */
function gsHireActivate(r, now){
  const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
  if(!u) return { ok: false, reason: 'unknown_unit' };
  if(!gsUnitLivable(u)) return { ok: false, reason: 'unit_not_livable' };
  const hb = gsBldById(u.bld_id);
  if(hb && hb.offmap) return { ok: false, reason: 'unit_offmap' };
  if(gsActiveLease(u.id)) return { ok: false, reason: 'unit_occupied' };
  const p = r.params || {};
  const job = gsHireJobOf(p.job);
  if(!job) return { ok: false, reason: 'unknown_job' };
  if(job.openings === 0) return { ok: false, reason: 'job_filled' };
  if(!gsIsAdmin(r.playerId)){
    const app = gsHireAppCheck(p);
    if(app.deny) return { ok: false, reason: app.deny };
    if(job.est > 0 && (u.base_rent || 0) / job.est > GS_HIRE.incomeCeiling)
      return { ok: false, reason: 'out_of_reach' };
  }
  const cid = gsHireAllocId();
  if(!cid) return { ok: false, reason: 'id_exhausted' };
  const name = (typeof p.name === 'string' && p.name.trim())
    ? p.name.trim() : 'Resident ' + cid;
  const age = (typeof p.age === 'number' && isFinite(p.age) && p.age >= 18)
    ? Math.floor(p.age)
    : 21 + hashString18(cid + '|age') % 34;
  const startDate = gsHireMoveInDate(p);
  const jobSnap = job.id === 'seeking' ? { id: 'seeking' } : {
    id: job.id, employer: job.employer, employerId: job.employerId,
    role: job.role, wage: job.wage, est: job.est, pay: job.pay,
    weeklyWage: gsJobWeekly(job), tips: !!job.tips,
    poi: job.poi || job.offstage || null,
    shift: job.shift ? Object.assign({}, job.shift) : null,
    shiftTxt: job.shiftTxt,
  };
  gsMarkHired(cid, r.playerId, {
    name, role: (typeof p.role === 'string' && p.role.trim())
      ? p.role.trim() : (jobSnap.role || 'Resident'),
    hiredMin: now, unitId: u.id, spawned: false,
    age,
    pronouns: (typeof p.pronouns === 'string' && p.pronouns.trim())
      ? p.pronouns.trim() : null,
    bio: (typeof p.bio === 'string' && p.bio.trim()) ? p.bio.trim() : null,
    arrival: (typeof p.arrival === 'string' && p.arrival.trim())
      ? p.arrival.trim() : null,
    look: (p.look && typeof p.look === 'object') ? p.look : null,
    job: jobSnap,
    moveIn: startDate,
    runwayMonths: gsHireRunway(job.est, u.base_rent),
    resubmitN: (p.resubmit_n | 0) || 0,
    wagesEarned: 0, lastPayday: null,
  });
  /* the arrival bank lands BEFORE the paperwork — move-in money is the
     first thing in their pocket, and the first-month charge pays out
     of it as the lease signs (a shortfall stays honestly owed) */
  gsDollarGrant(cid, GS_HIRE.arrivalBank, 'arrival bank');
  const move = gsHireMoveIn(u, cid, startDate, {
    deposit: 0, hirePackage: true, note: 'hire package' });
  if(!move.ok){
    delete GS_HIRED[cid];
    return { ok: false, reason: move.reason || 'lease_failed' };
  }
  if(job.openings > 0) job.openings--;
  if(typeof gsSpawnHired === 'function') gsSpawnHired(cid);
  r.charId = cid;
  gsBusEmit('hire', r, { charId: cid, unit: u.id, name,
    detail: job.id !== 'seeking' ? (job.role + ' at ' + job.employer)
                                 : 'arrives without work' });
  return true;
}

/* ---------------- the rehouse request ----------------
   a hire who lost their home (eviction happens — arrears are real) can
   be re-doored: the player files 'rehouse' on a vacant unit naming the
   character. Same paperwork path, a normal second lease — the deposit
   is owed like anyone else's second deposit. Flat 150cr. */
gsDefineAction('rehouse', {
  scope: 'target', exclusive: true, ratePerMin: 30,
  minMin: 5, maxMin: 5, ttlMin: 30,
  effect: 'once',
  allow: (r) => gsRehouseAllow(r),
  activate: (r, now) => gsRehouseActivate(r, now),
  claims: (r) => [{ cls: 'paper', res: 'paper:' + r.target }],
});
function gsRehouseChar(r){
  const cid = r.params && r.params.charId;
  return (cid && GS_HIRED[cid]) ? cid : null;
}
function gsRehouseAllow(r){
  if(!r.target) return 'needs_housing';
  const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
  if(!u) return 'unknown_unit';
  if(!gsUnitLivable(u)) return 'unit_not_livable';
  const hb = gsBldById(u.bld_id);
  if(hb && hb.offmap) return 'unit_offmap';
  if(gsActiveLease(u.id)) return 'unit_occupied';
  const cid = gsRehouseChar(r);
  if(!cid) return 'char_not_hired';
  if(!gsIsAdmin(r.playerId) && gsHiredOwner(cid) !== r.playerId)
    return 'not_your_character';
  if(GS_HIRED[cid].unitId) return 'already_housed';
  return true;
}
function gsRehouseActivate(r, now){
  const u = (typeof gsUnitById === 'function') && gsUnitById(r.target);
  if(!u) return { ok: false, reason: 'unknown_unit' };
  if(!gsUnitLivable(u)) return { ok: false, reason: 'unit_not_livable' };
  if(gsActiveLease(u.id)) return { ok: false, reason: 'unit_occupied' };
  const cid = gsRehouseChar(r);
  if(!cid) return { ok: false, reason: 'char_not_hired' };
  const h = GS_HIRED[cid];
  const startDate = gsHireMoveInDate(r.params);
  const move = gsHireMoveIn(u, cid, startDate, { note: 're-house' });
  if(!move.ok) return { ok: false, reason: move.reason || 'lease_failed' };
  h.unitId = u.id;
  h.moveIn = startDate;
  h.runwayMonths = gsHireRunway((h.job && h.job.est) || 0, u.base_rent);
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  if(v){
    v.sfHome = gsHiredHomeCell(cid);
    v.sfSched = gsHiredRoutine(cid);
  }
  gsBusEmit('hire', r, { action: 'rehouse', charId: cid, unit: u.id,
    name: h.name, detail: gsAddressOfUnit(u.id) });
  return true;
}

/* ---------------- paydays ----------------
   thin-AI auto-shifts post baseline wages employer -> character through
   the same ledger as rent — shifts.json payday: entry/informal weekly
   Friday; mid/top bands biweekly Friday. A character whose owner is
   driving during the run earns the same wage + a small session bonus —
   the contract's exact words. Employer accounts carry an operating
   float (the admin faucet, labeled honestly) so payroll never bounces. */
function gsIsFriday(dateStr){
  const d = gsDateParse(dateStr);
  return d ? new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay() === 5
           : false;
}
function gsBiweeklyDue(cid, dateStr){
  const weeks = Math.floor(gsDateDiff(dateStr, GS_PAY_EPOCH) / 7);
  const parity = ((weeks % 2) + 2) % 2;
  return parity === (hashString18(cid + '|pay') % 2);
}
function gsJobTick(dateStr){
  const res = { day: dateStr, paid: [], skipped: [] };
  if(!gsIsFriday(dateStr)) return res;
  for(const cid in GS_HIRED){
    const h = GS_HIRED[cid];
    if(!h || !h.job || h.job.id === 'seeking' || !h.job.employerId)
      continue;
    const j = h.job;
    if(j.pay === 'biweekly' && !gsBiweeklyDue(cid, dateStr)) continue;
    if(h.lastPayday === dateStr) continue;
    const weekly = j.weeklyWage || gsJobWeekly(j);
    const base = j.pay === 'biweekly' ? weekly * 2 : weekly;
    if(!(base > 0)) continue;
    const acct = gsHireEmployer(j);
    if((GS_LEDGER.dollars[acct] || 0) < base)
      gsDollarGrant(acct, GS_HIRE.employerFloat,
                    'employer float — ' + j.employer);
    const bonus = GS_POSSESS[cid]
      ? Math.round(base * GS_HIRE.sessionBonus) : 0;
    const amt = base + bonus;
    const t = gsDollarPay(acct, cid, amt,
      'wages — ' + j.role + (bonus ? ' (+ session bonus)' : ''));
    if(!t){ res.skipped.push(cid); continue; }
    h.lastPayday = dateStr;
    h.wagesEarned = (h.wagesEarned || 0) + amt;
    res.paid.push({ cid, amt, bonus, employer: j.employer });
  }
  return res;
}
/* later hires into work — a 'seeking' arrival takes a real opening (or
   changes jobs): opening consumed atomically, ceiling still honest,
   routine re-anchored, the block hears about it */
function gsHiredTakeJob(cid, jobId){
  const h = GS_HIRED[cid];
  if(!h) return { ok: false, reason: 'not_hired' };
  const job = gsHireJobOf(jobId);
  if(!job || job.id === 'seeking') return { ok: false, reason: 'unknown_job' };
  if(job.openings === 0) return { ok: false, reason: 'job_filled' };
  const lease = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor(cid).find(l => l.status === 'active' ||
        l.status === 'owner-occupied') : null;
  const rent = lease ? lease.monthly_rent : 0;
  if(rent > 0 && job.est > 0 &&
     rent / job.est > GS_HIRE.incomeCeiling)
    return { ok: false, reason: 'out_of_reach', rent, est: job.est };
  gsHireFreeSlot(cid);                          // the old opening frees
  if(job.openings > 0) job.openings--;
  h.job = { id: job.id, employer: job.employer, employerId: job.employerId,
    role: job.role, wage: job.wage, est: job.est, pay: job.pay,
    weeklyWage: gsJobWeekly(job), tips: !!job.tips,
    poi: job.poi || job.offstage || null,
    shift: job.shift ? Object.assign({}, job.shift) : null,
    shiftTxt: job.shiftTxt };
  h.runwayMonths = gsHireRunway(job.est, rent);
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  if(v && v.sfSched) v.sfSched = gsHiredRoutine(cid);
  gsBusEmit('hire', { playerId: h.playerId, kind: 'hire', target: cid,
    id: null, _now: (typeof gsNowMin === 'function') ? gsNowMin() : null },
    { action: 'job_start', charId: cid,
      detail: job.role + ' at ' + job.employer });
  return { ok: true, job: h.job };
}
/* release frees the opening back to the board (called by gsReleaseHired) */
function gsHireFreeSlot(cid){
  const h = GS_HIRED[cid];
  if(!h || !h.job || !h.job.id) return;
  const row = GS_JOBS.find(j => j.id === h.job.id);
  if(row && row.openings >= 0) row.openings++;
}

/* ---------------- the routine, work-anchored ----------------
   a hired character's day is built from the shift they were hired into —
   the grid slot becomes a daily thin-AI rhythm (the sfSched grammar the
   ambient cast already speaks; day-of-week detail collapses to the
   representative day like every other ambient routine). */
function gsHiredJobRoutine(cid){
  const h = GS_HIRED[cid] || {};
  const j = h.job;
  if(!j || !j.shift) return null;
  const homeCell = gsHiredHomeCell(cid);
  const home = { latlon: (typeof SF_M !== 'undefined' && SF_M)
    ? gsCellToLatLon(homeCell.wx, homeCell.wy) : [37.756, -122.424] };
  const s = j.shift;
  const B = [];
  const at = (h0, h1, to, st, inside) =>
    B.push({ h0, h1, to, state: st, inside });
  const runner = h.look && h.look.signature === 'running gear at dawn';
  if(s.kind === 'roam'){
    /* gig rider — the MuleIt queue: pickup/dropoff rounds all day */
    at(0, 8, home, 'sleep', true);
    B.push({ h0: 8, h1: 19, state: 'carry',
      stops: [{ poi: 'Taqueria El Farolito' }, { poi: 'Delfina' },
              { poi: 'Bi-Rite Creamery' }, { poi: 'Dolores Park Cafe' },
              { poi: 'Haus Coffee' }, { anchor: 'g750' }] });
    at(19, 24, home, 'sleep', true);
    return B;
  }
  if(s.altNight && (hashString18(cid + '|shift') % 2)){
    /* the night half of a rotating hospital grid: sleep late, errands
       in the afternoon, on the ward by 19:30 */
    at(0, 11.5, home, 'sleep', true);
    B.push({ h0: 12, h1: 17, state: 'walk',
      stops: [{ poi: 'Bi-Rite Market' }, { anchor: 'park_center' }] });
    at(17, 19, home, 'rest', true);
    at(19.5, 24, { poi: 'SF General' }, 'work');
    return B;
  }
  const wk = Math.max(5, Math.min(s.h0 - 1, 9));
  at(0, wk, home, 'sleep', true);
  if(runner && s.h0 > 8){
    /* signature 'running gear at dawn' — the 6am lap before the shift */
    B.push({ h0: 6, h1: Math.min(7.5, s.h0 - 0.5), state: 'walk',
      stops: [{ anchor: 'park_center' }, { anchor: 'park_south' }] });
    if(s.h0 - 7.5 > 1) at(Math.min(7.5, s.h0 - 0.5), s.h0, home, 'rest', true);
  } else if(s.h0 - wk > 1.5){
    B.push({ h0: wk, h1: s.h0 - 0.5, state: 'walk',
      stops: [{ poi: 'Haus Coffee' }, { anchor: 'park_center' }] });
  }
  at(s.h0, s.h1, s.to || (j.poi ? { poi: j.poi } : home),
     s.state || 'work', !!s.to || !!j.poi);
  if(s.h1 <= 20.5){
    B.push({ h0: s.h1, h1: Math.min(23, s.h1 + 3.5), state: 'chat',
      stops: [{ anchor: 'park_south' }, { poi: '500 Club' }] });
    at(Math.min(23, s.h1 + 3.5), 24, home, 'sleep', true);
  } else if(s.h1 < 24){
    at(s.h1, 24, home, 'sleep', true);
  }
  return B;
}

/* ---------------- the disclosure card ----------------
   gsHireQuote mirrors the creation wizard's step-4 honesty BEFORE a
   credit moves: the fee, the unit, the income, the ceiling, the runway,
   and what the arrival bank looks like after the first month. */
function gsHireQuote(spec, nowMin){
  spec = spec || {};
  const out = { ok: true, fee: GS_HIRE.feeCr,
    billing: 'flat — charged once, after screening passes',
    arrivalBank: GS_HIRE.arrivalBank,
    deposit: 0, depositNote: 'waived — the hire package covers the hunt',
    warnings: [] };
  const u = spec.target &&
    (typeof gsUnitById === 'function') && gsUnitById(spec.target);
  if(u){
    const b = gsBldById(u.bld_id);
    out.unit = { id: u.id, address: gsAddressOfUnit(u.id),
      rent: u.base_rent, livable: !!gsUnitLivable(u),
      offmap: !!(b && b.offmap),
      occupied: !!(typeof gsActiveLease === 'function' &&
        gsActiveLease(u.id)) };
    if(!out.unit.livable) out.warnings.push('unit_not_livable');
    if(out.unit.offmap) out.warnings.push('unit_offmap');
    if(out.unit.occupied) out.warnings.push('unit_occupied');
  } else if(spec.target){
    out.ok = false; out.deny = 'unknown_unit'; return out;
  }
  const p = spec.params || {};
  const job = gsHireJobOf(p.job);
  if(!job){ out.ok = false; out.deny = 'unknown_job'; return out; }
  out.job = job.id === 'seeking' ? { id: 'seeking', est: 0 }
    : { id: job.id, employer: job.employer, role: job.role,
        wage: job.wage, hrs: job.hrs, est: job.est, tips: !!job.tips,
        openings: job.openings, shift: job.shiftTxt };
  if(job.id !== 'seeking' && job.openings === 0)
    out.warnings.push('job_filled');
  if(u){
    const rent = u.base_rent || 0;
    out.rent = rent;
    if(job.est > 0){
      out.affordPct = Math.round(rent / job.est * 100);
      out.ceilingPct = GS_HIRE.incomeCeiling * 100;
      out.outOfReach = out.affordPct > out.ceilingPct;
      if(out.outOfReach) out.warnings.push('out_of_reach');
    }
    const rw = gsHireRunway(job.est, rent);
    out.runwayMonths = rw;                        // null = sustainable
    if(rw != null) out.runwayNote =
      'runs dry in ~' + Math.floor(rw) + ' month' +
      (Math.floor(rw) === 1 ? '' : 's') + ' on arrival money' +
      (job.est > 0 ? ' + wages' : ' alone');
    const start = gsHireMoveInDate(p);
    const sd = gsDateParse(start);
    const first = sd && sd.d > 1 && rent > 0
      ? Math.round(rent * (gsDim(gsDateParse(gsPeriodOf(start) + '-01').y,
                             gsDateParse(gsPeriodOf(start) + '-01').m) -
                           sd.d + 1) /
                   gsDim(gsDateParse(gsPeriodOf(start) + '-01').y,
                         gsDateParse(gsPeriodOf(start) + '-01').m))
      : rent;
    out.moveIn = start;
    out.firstMonth = first;
    out.bankAfterFirstMonth = GS_HIRE.arrivalBank - first;
    if(out.bankAfterFirstMonth < 0)
      out.warnings.push('first_month_exceeds_bank');
  }
  const nc = (typeof spec.params === 'object' && spec.params)
    ? gsHireNameCheck(spec.params.name) : { ok: false, reason: 'needs_name' };
  out.name = nc.ok ? { available: true }
    : { available: false, reason: nc.reason };
  if(spec.playerId && typeof gsHiredCount === 'function'){
    out.slots = { cap: GS_MAX_HIRED_PER_PLAYER,
      used: gsHiredCount(spec.playerId),
      left: Math.max(0, GS_MAX_HIRED_PER_PLAYER -
        gsHiredCount(spec.playerId)) };
    if(out.slots.left <= 0) out.warnings.push('hire_cap');
  }
  /* the bus's own receipt still speaks for the credit side — price,
     surge, lane — this card is the DOLLAR side, which is where the
     honesty matters */
  if(typeof gsPriceQuote === 'function')
    out.request = gsPriceQuote({ playerId: spec.playerId, kind: 'hire',
      target: spec.target, durationMin: 5, params: spec.params }, nowMin);
  return out;
}
/* the board as the creation UI reads it */
function gsJobBoard(){
  return GS_JOBS.filter(j => j.id !== 'seeking').map(j => ({
    id: j.id, employer: j.employer, role: j.role, wage: j.wage,
    hrs: j.hrs, est: j.est, tips: !!j.tips, pay: j.pay,
    openings: j.openings, accepting: j.openings !== 0,
    shift: j.shiftTxt, poi: j.poi || null,
  })).concat([{ id: 'seeking', employer: null, role: 'Arrives without work',
    wage: 0, hrs: '--', est: 0, tips: false, pay: null,
    openings: -1, accepting: true, shift: 'job hunting', poi: null }]);
}
function gsHireSlots(pid){
  return { cap: GS_MAX_HIRED_PER_PLAYER,
    used: (typeof gsHiredCount === 'function') ? gsHiredCount(pid) : 0,
    left: Math.max(0, GS_MAX_HIRED_PER_PLAYER -
      ((typeof gsHiredCount === 'function') ? gsHiredCount(pid) : 0)) };
}

/* ---------------- live wiring + persistence ----------------
   payday rides the sim clock once a real SF day like the rent run;
   gsJobTick is also directly testable with an explicit date. */
let gsHireLastMs = 0;
function gsHireSysTick(dtH){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return;
  const ms = Date.now();
  if(ms - gsHireLastMs < 30000) return;
  gsHireLastMs = ms;
  const today = (typeof gsTodayStr === 'function') && gsTodayStr();
  if(today && today !== GS_HIRE.lastTickDay){
    GS_HIRE.lastTickDay = today;
    gsJobTick(today);
  }
}
if(typeof registerSimTick === 'function') registerSimTick(gsHireSysTick);

function gsHireSnapshot(){
  return { seq: GS_HIRE_SEQ.n,
    jobs: GS_JOBS.map(j => ({ id: j.id, openings: j.openings })),
    lastTickDay: GS_HIRE.lastTickDay || null };
}
function gsHireLoad(d){
  if(!d){ gsHireSeqFromHired(); return; }   // legacy snapshot — counter only
  GS_HIRE_SEQ.n = d.seq || 0;
  if(Array.isArray(d.jobs))
    for(const s of d.jobs){
      const j = GS_JOBS.find(x => x.id === s.id);
      if(j) j.openings = s.openings;
    }
  GS_HIRE.lastTickDay = d.lastTickDay || null;
  gsHireSeqFromHired();          // older snapshots: derive the counter
}
function gsHireReset(){
  GS_HIRE_SEQ.n = 0;
  for(const id in GS_JOBS_OPEN0) {
    const j = GS_JOBS.find(x => x.id === id);
    if(j) j.openings = GS_JOBS_OPEN0[id];
  }
  GS_HIRE.lastTickDay = null;
}

/* ---------------- bridge surface ---------------- */
if(typeof window !== 'undefined' && window.__aiBridge){
  const B = window.__aiBridge;
  B.gsJobBoard = () => gsJobBoard();
  B.gsHireQuote = (spec) => gsHireQuote(spec);
  B.gsHireSlots = (pid) => gsHireSlots(pid);
  B.gsHireNameCheck = (name) => gsHireNameCheck(name);
  B.gsHiredTakeJob = (cid, jobId) => gsHiredTakeJob(cid, jobId);
  B.gsJobTick = (d) => gsJobTick(d);
}
