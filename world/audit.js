#!/usr/bin/env node
/* world/audit.js — RW boundary audit (world v26).

   Turns the playtest harness's manual consistency sweep (PT7) into an
   executable gate. Run:

       node world/audit.js            human-readable report
       node world/audit.js --json     machine report (attach to commits)

   Exit code: 1 if any gate FAILs, 0 otherwise. REVIEW hits are listed for
   a human to eyeball — they are contexts a regex can't adjudicate
   (e.g. a doc that legitimately cites the parody mapping), not verdicts.

   Gates:
     corpus    — screen.js run against screen-corpus.json (50/50 contract)
     names     — no real SF business names outside mapping contexts
     addresses — residential streets carry 9xxx numbers only
     prices    — credit amounts/rates match the monetization PROPOSAL set;
                 in-world surfaces carry zero credit figures
     copy      — banned feed/deny phrasing never appears player-facing
     internal  — internal-tier surfaces carry an internal/never-ship marker
     mirror    — playtest.html inline data == playtest.json (hand-sync gate)
     coverage  — every declared surface file exists; no orphan demos
     drama     — drama.json structural invariants (state enum, fuse ids,
                 knowledge-matrix disjointness); seed vocabulary never
                 leaks into spectator contracts; drama files never public
     onboard   — onboarding.json ↔ onboarding.html agreement; honesty
                 strings present; dark-pattern vocabulary absent
     lease     — leases.json ↔ lease.html agreement; licensed-landlord
                 caps (file-only eviction); neutral feed wording only

   Under audit: the locked boundaries only. NOT under test here or anywhere
   in this harness: LLM behavior (sim STOPPED), real payments, concurrency,
   game-track plumbing. file://-safe project; this script is node-only,
   reads the repo, writes nothing.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const W = __dirname;
const rd = f => fs.readFileSync(path.join(W, f), 'utf8');
const JSONF = f => JSON.parse(rd(f));

const out = { gates: [], fails: 0, reviews: 0, passes: 0 };
function gate(id, name) {
  const g = { id, name, status: 'pass', hits: [] };
  out.gates.push(g); return g;
}
const add = (g, sev, file, line, msg) => {
  g.hits.push({ sev, file, line, msg });
  if (sev === 'fail') g.status = 'fail';
  else if (sev === 'review' && g.status === 'pass') g.status = 'review';
};

/* ---------- shared file sets ---------- */
function walk(dir) {
  let r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) r = r.concat(walk(p));
    else r.push(p);
  }
  return r;
}
const ALL = walk(W).map(p => path.relative(W, p))
  .filter(f => /\.(html|json|md)$/.test(f) && f !== 'audit.js');

/* Files allowed to name real businesses — the parody mapping layer itself. */
const NAME_EXEMPT = new Set([
  'parody-names.json', 'businesses.md', 'businesses.json',
  'screen.js', 'screen-corpus.json'
]);
/* Mapping-context markers: a real name on a line with one of these is a
   documented code-key/parody citation, not world content. */
const MAP_CTX = /code.?key|parody of|in-fiction|real.name|aka\b|not the real/i;

const PT = JSONF('playtest.json');
const PUB = Object.values(PT.surfaces)
  .filter(s => s.tier !== 'internal')
  .map(s => s.file);

/* ============ G1 corpus ============ */
{
  const g = gate('corpus', 'screening corpus conformance (screen.js × screen-corpus.json)');
  try {
    const window = {};
    eval(rd('screen.js'));
    const RS = window.RWScreen;
    const corpus = JSONF('screen-corpus.json');
    let bad = 0; const cover = {};
    for (const c of corpus.cases) {
      const got = RS.screenRequest(c.in);
      const ok = got.verdict === c.expect.verdict && got.code === c.expect.code;
      if (!ok) { bad++; add(g, 'fail', 'screen-corpus.json', null,
        `${c.id}: expected ${c.expect.verdict}/${c.expect.code}, got ${got.verdict}/${got.code}`); }
      const k = c.expect.code;
      cover[k] = cover[k] || { n: 0, nm: false };
      cover[k].n++;
    }
    /* near-miss credit goes to the code the input must NOT trip, named in the
       note after "near-miss for" — match the flattened code id first, else its
       first segment ("harm" → harm-targeting, "legal" → legal-backstop). The
       segment shortcut skips ambiguous segments ('real' names two codes). */
    for (const c of corpus.cases) {
      const nm = c.note.match(/near-?miss for ([^.;—]+)/i);
      if (!nm) continue;
      const flat = nm[1].toLowerCase().replace(/[^a-z]/g, '');
      for (const code of Object.keys(cover)) {
        if (code === 'pass') continue;
        const cf = code.replace(/-/g, ''), seg = code.split('-')[0];
        if (flat.includes(cf) || (seg !== 'real' && seg.length >= 4 && flat.includes(seg)))
          cover[code].nm = true;
      }
    }
    for (const [code, v] of Object.entries(cover)) {
      if (code !== 'pass' && v.n < 3) add(g, 'fail', 'screen-corpus.json', null,
        `code ${code} has ${v.n} cases (coverage rule: ≥3)`);
      if (code !== 'pass' && !v.nm) add(g, 'review', 'screen-corpus.json', null,
        `code ${code} has no near-miss case`);
    }
    g.detail = `engine ${RS.VERSION} · ${corpus.cases.length} cases · ${bad} mismatch`;
  } catch (e) { add(g, 'fail', 'screen.js', null, 'engine failed to load/run: ' + e.message); }
}

/* ============ G2 names ============ */
{
  const g = gate('names', 'parody-name sweep (no real SF business names in world content)');
  const real = Object.keys(JSONF('parody-names.json').parody_names);
  for (const f of ALL) {
    if (NAME_EXEMPT.has(f)) continue;
    const lines = rd(f).split('\n');
    lines.forEach((ln, i) => {
      for (const r of real) {
        if (!ln.includes(r)) continue;
        if (MAP_CTX.test(ln)) continue; // documented mapping citation
        add(g, f.endsWith('.md') ? 'review' : 'fail', f, i + 1,
          `real name "${r}": ${ln.trim().slice(0, 110)}`);
      }
    });
  }
  g.detail = `${real.length} real names swept over ${ALL.length - NAME_EXEMPT.size} files`;
}

/* ============ G3 addresses ============ */
{
  const g = gate('addresses', 'residential address sweep (9xxx only on scenario streets)');
  const STREETS = '(Guerrero|Dolores|Capp|Mission|Valencia|Folsom|Geneva|Church|Sanchez|Shotwell|South Van Ness)';
  const re = new RegExp('\\b(\\d{3,4})\\s+' + STREETS + '\\b', 'g');
  for (const f of ALL) {
    if (NAME_EXEMPT.has(f)) continue;
    const lines = rd(f).split('\n');
    lines.forEach((ln, i) => {
      let m; re.lastIndex = 0;
      while ((m = re.exec(ln))) {
        const n = +m[1];
        if (n < 9000)
          add(g, f.endsWith('.md') ? 'review' : 'fail', f, i + 1,
            `sub-9000 house number "${m[0]}" — residential numbers must be 9xxx`);
      }
    });
  }
  g.detail = 'all residential hits must be ≥9000 (rw-address-system-spec §3)';
}

/* ============ G4 prices ============ */
{
  const g = gate('prices', 'credit pricing sweep (plan §2 PROPOSAL set; currency wall)');
  /* Canonical credit figures — monetization plan §2 + derived session math.
     Everything else is listed for a human eyeball. */
  const OK_CR = new Set(['1.5', '6', '6.0', '10', '20', '22', '22.5', '30', '40', '45', '50',
    '60', '70', '90', '100', '120', '150', '200', '240', '250', '300', '360', '400',
    '500', '550', '600', '750', '800', '900', '1000', '1150', '1200', '1240', '1500',
    '2000', '2500', '3500', '5000', '6750', '14000']); // '20' = 50% decline-refund on a 40 cr nudge (requests.json)
  const OK_RATE = new Set(['1.5', '6', '6.0', '1.275', '5.1']);
  /* in-world surfaces: game dollars only — a bare "N cr" figure is a wall breach */
  const INWORLD = new Set(['board.html', 'lease.html', 'timeclock.html',
    'directory.html', 'businesses.json', 'housing.json', 'jobs.json',
    'shifts.json', 'budgets.json']);
  for (const f of ALL) {
    const inworld = INWORLD.has(f) || f.startsWith('businesses/') || f.startsWith('jobs/') || f.startsWith('housing/');
    const lines = rd(f).split('\n');
    lines.forEach((ln, i) => {
      for (const m of ln.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*cr\b/g)) {
        const v = m[1].replace(/,/g, '');
        /* deed fees are the plan-§2.4 exception: purchase metadata bills credits
           even on in-world surfaces — {1000,2000,3500,5000} are legal here */
        const DEED = new Set(['1000', '2000', '3500', '5000']);
        if (inworld && !DEED.has(v))
          add(g, 'fail', f, i + 1, `credit figure "${m[0]}" on an in-world surface (game dollars only)`);
        else if (!inworld && !OK_CR.has(v))
          add(g, 'review', f, i + 1, `credit figure "${m[0]}" not in the canonical set`);
      }
      for (const m of ln.matchAll(/(\d+(?:\.\d+)?)\s*cr\s*\/\s*min/g)) {
        if (!OK_RATE.has(m[1])) add(g, 'fail', f, i + 1,
          `rate "${m[0]}/min" — only 1.5 / 6 (and queued −15% derivations) exist`);
      }
      if (inworld && /credit|top.?up|\bcr\b/i.test(ln)
          && !/never credits|credits never|no credits|currency wall|deed|fee|rent credit|store credit|tab credit|credit line|credit card|top.?up|hooks/i.test(ln))
        add(g, 'review', f, i + 1, `credit vocabulary on an in-world surface: ${ln.trim().slice(0, 100)}`);
    });
  }
  g.detail = 'in-world files: ' + [...INWORLD].join(', ') + ' + card dirs';
}

/* ============ G5 copy ============ */
{
  const g = gate('copy', 'player-facing phrasing (deny wording, dark-pattern terms)');
  const HARD = [/\brequest (was )?(denied|rejected)\b/i, /\bloot ?box/i,
    /\bpay[- ]to[- ]win\b/i, /\breal money\b/i, /\bpurchase power\b/i];
  const SOFT = [/\bbanned\b/i, /\bcensored\b/i, /\bpunish/i];
  for (const f of PUB) {
    if (!fs.existsSync(path.join(W, f))) continue;
    rd(f).split('\n').forEach((ln, i) => {
      for (const re of HARD) if (re.test(ln))
        add(g, 'fail', f, i + 1, `banned phrasing ${re}: ${ln.trim().slice(0, 100)}`);
      for (const re of SOFT) if (re.test(ln))
        add(g, 'review', f, i + 1, `watch-word ${re}: ${ln.trim().slice(0, 100)}`);
    });
  }
  g.detail = 'denies must read "request not approved"; no gambling/P2W vocabulary';
}

/* ============ G6 internal markers ============ */
{
  const g = gate('internal', 'internal-tier surfaces carry an internal/never-ship marker');
  const INTERNAL_FILES = Object.values(PT.surfaces)
    .filter(s => s.tier === 'internal').map(s => s.file)
    .concat(['drama.html', 'drama.json', 'drama-notes.md', 'budgets.json', 'budgets.md']);
  for (const f of new Set(INTERNAL_FILES)) {
    const p = path.join(W, f);
    if (!fs.existsSync(p)) { add(g, 'review', f, null, 'listed internal file missing'); continue; }
    if (!/internal|never.?ship|not a (player|spectator)/i.test(rd(f)))
      add(g, 'fail', f, null, 'no internal/never-ship marker found');
  }
  g.detail = 'marker regex: /internal|never-ship|not a player|not a spectator/i';
}

/* ============ G7 mirror ============ */
{
  const g = gate('mirror', 'playtest.html inline data == playtest.json (hand-sync gate)');
  try {
    const html = rd('playtest.html');
    const ms = html.match(/const SURF=(\{[\s\S]*?\});/);
    const mp = html.match(/const PTS=(\[[\s\S]*?\]);\s*\n/);
    if (!ms || !mp) throw new Error('inline SURF/PTS blocks not found');
    const SURF = eval('(' + ms[1] + ')');
    const PTS = eval(mp[1]);
    const jSurfs = PT.surfaces, jPts = PT.scenarios;
    for (const k of Object.keys(jSurfs)) {
      const s = SURF[k];
      if (!s) { add(g, 'fail', 'playtest.html', null, `surface "${k}" missing from inline SURF`); continue; }
      if (s.file !== jSurfs[k].file) add(g, 'fail', 'playtest.html', null, `SURF.${k}.file "${s.file}" != "${jSurfs[k].file}"`);
      if (s.name !== jSurfs[k].name) add(g, 'fail', 'playtest.html', null, `SURF.${k}.name "${s.name}" != "${jSurfs[k].name}"`);
    }
    for (const k of Object.keys(SURF))
      if (!jSurfs[k]) add(g, 'fail', 'playtest.html', null, `inline surface "${k}" absent from playtest.json`);
    const jById = Object.fromEntries(jPts.map(s => [s.id, s]));
    for (const p of PTS) {
      const j = jById[p.id];
      if (!j) { add(g, 'fail', 'playtest.html', null, `scenario ${p.id} absent from playtest.json`); continue; }
      const diffs = [];
      if (p.title !== j.title) diffs.push('title');
      if (p.min !== j.minutes) diffs.push('minutes');
      if (p.persona !== j.persona) diffs.push('persona');
      if (p.goal !== j.goal) diffs.push('goal');
      if (JSON.stringify(p.surfaces) !== JSON.stringify(j.surfaces)) diffs.push('surfaces');
      if (p.steps.length !== j.steps.length) diffs.push('steps.length');
      else p.steps.forEach((st, i) => {
        const js = j.steps[i];
        if (st.do !== js.do) diffs.push(`step${i}.do`);
        if (st.exp !== js.expect) diffs.push(`step${i}.expect`);
        if (JSON.stringify(st.ck) !== JSON.stringify(js.checkpoints)) diffs.push(`step${i}.checkpoints`);
      });
      if (diffs.length) add(g, 'fail', 'playtest.html', null, `${p.id} drifted: ${diffs.join(', ')}`);
    }
    for (const s of jPts) if (!PTS.find(p => p.id === s.id))
      add(g, 'fail', 'playtest.json', null, `scenario ${s.id} absent from inline PTS`);
    g.detail = `${PTS.length} inline scenarios vs ${jPts.length} contract scenarios`;
  } catch (e) { add(g, 'fail', 'playtest.html', null, 'mirror eval failed: ' + e.message); }
}

/* ============ G8 coverage ============ */
{
  const g = gate('coverage', 'surface files exist; no untracked demo pages');
  const EXEMPT_HTML = new Set(['drama.html']); // never-ship board, deliberately unlisted
  const listed = new Set(Object.values(PT.surfaces).map(s => s.file));
  for (const [k, s] of Object.entries(PT.surfaces))
    if (!fs.existsSync(path.join(W, s.file)))
      add(g, 'fail', s.file, null, `surface "${k}" file missing`);
  for (const f of ALL.filter(f => f.endsWith('.html')))
    if (!listed.has(f) && !EXEMPT_HTML.has(f))
      add(g, 'review', f, null, 'demo page not listed in playtest.json surfaces — untested by definition');
  g.detail = 'exempt (internal-only, unlisted): ' + [...EXEMPT_HTML].join(', ');
}

/* ============ G9 drama ============ */
{
  const g = gate('drama', 'drama registry invariants (states, fuses, knowledge disjointness, internal-only)');
  try {
    const D = JSONF('drama.json');
    const states = new Set(D.seed_states);
    const fuses = new Set(D.fuse_ids || []);
    const CID = /^C[1-8]$/;
    for (const s of D.seeds || []) {
      if (!states.has(s.state)) add(g, 'fail', 'drama.json', null, `${s.id}: state "${s.state}" not in seed_states`);
      if (!fuses.has(s.fuse)) add(g, 'fail', 'drama.json', null, `${s.id}: fuse "${s.fuse}" not in fuse_ids`);
      for (const field of ['holders', 'suspects', 'must_not_know'])
        for (const c of s[field] || [])
          if (!CID.test(c)) add(g, 'fail', 'drama.json', null, `${s.id}.${field}: "${c}" is not a main id`);
      const H = new Set(s.holders), SU = new Set(s.suspects), M = new Set(s.must_not_know);
      for (const c of H) if (SU.has(c) || M.has(c)) add(g, 'fail', 'drama.json', null, `${s.id}: ${c} both holds and suspects/must-not-know`);
      for (const c of SU) if (M.has(c)) add(g, 'fail', 'drama.json', null, `${s.id}: ${c} both suspects and must-not-know`);
    }
    /* fuses referenced in tension_edges + pressure catalog must exist */
    for (const e of D.tension_edges || [])
      for (const f of String(e.fuse).split('/'))
        if (!fuses.has(f)) add(g, 'fail', 'drama.json', null, `tension_edge ${e.pair}: unknown fuse ${f}`);
    for (const p of D.pressure_catalog || [])
      for (const f of p.feeds || [])
        if (!fuses.has(f) && f !== 'all' && !/^S\d+$/.test(f))
          add(g, 'review', 'drama.json', null, `${p.id}: feeds entry "${f}" is neither a fuse nor a seed`);
    /* internal-only: drama files must never appear as a public playtest surface */
    for (const f of ['drama.html', 'drama.json', 'drama-notes.md'])
      if (PUB.includes(f)) add(g, 'fail', f, null, 'internal drama file listed as a public surface');
    /* seeds must never be reachable from spectator contracts */
    for (const f of ['feed.json', 'history.json', 'requests.json', 'moderation.json', 'creation.json'])
      if (rd(f).includes('S1') || /must_not_know|pressure_routes|reveal_vectors/.test(rd(f)))
        add(g, 'fail', f, null, 'seed-registry vocabulary leaking into a spectator contract');
    g.detail = `${(D.seeds || []).length} seeds · ${(D.pressure_catalog || []).length} pressure rows · schema ${D.schema_version}`;
  } catch (e) { add(g, 'fail', 'drama.json', null, 'parse/schema failure: ' + e.message); }
}

/* ============ G10 onboarding ============ */
{
  const g = gate('onboard', 'onboarding contract (json↔html mirror, honesty strings, dark-pattern sweep)');
  try {
    const OB = JSONF('onboarding.json');
    const html = rd('onboarding.html');
    /* storage key agreement */
    if (!html.includes(OB.storage_key))
      add(g, 'fail', 'onboarding.html', null, `storage_key "${OB.storage_key}" not found in onboarding.html`);
    /* every tour-beat anchor must resolve to a real element id in the demo
       (ids may be emitted literally or generated — match the quoted anchor
       string either way) */
    for (const b of OB.tour_beats || []) {
      if (!new RegExp(`["']${b.anchor}["']`).test(html))
        add(g, 'fail', 'onboarding.html', null, `tour beat ${b.n} anchor "${b.anchor}" not found in page source`);
    }
    /* honesty strings the page MUST carry (locked promises made visible) */
    const MUST = [
      [/never convert/i, 'currency wall sentence ("never convert")'],
      [/may decline/i, 'nudge honesty ("the character may decline")'],
      [/\+50%/, 'first-purchase bonus disclosure (+50%)'],
      [/unpossessable/i, 'possession ban stated out loud ("unpossessable")'],
      [/free/i, 'free-tier statement']
    ];
    for (const [re, label] of MUST)
      if (!re.test(html)) add(g, 'fail', 'onboarding.html', null, `missing required honesty copy: ${label}`);
    /* dark-pattern vocabulary must never appear on the onboarding surface.
       Searched on the player-facing html only — the .md/.json legitimately
       name the banned behaviors in the never-list. */
    const DARK = [
      /\bcountdown\b/i, /limited[- ]time/i, /\bexpires?\b/i, /\bstreak/i,
      /only \d+ left/i, /\bhurry\b/i, /act now/i, /don'?t miss/i, /\bfomo\b/i,
      /\boffer ends\b/i, /\bclaim your\b/i, /\bfree credits\b/i
    ];
    html.split('\n').forEach((ln, i) => {
      for (const re of DARK)
        if (re.test(ln)) add(g, 'fail', 'onboarding.html', i + 1,
          `dark-pattern vocabulary ${re}: ${ln.trim().slice(0, 100)}`);
      if (/\breward\b/i.test(ln) && !/no .{0,20}reward|grants no|never a reward|nothing is granted/i.test(ln))
        add(g, 'review', 'onboarding.html', i + 1, `"reward" language — confirm it's a denial of rewards: ${ln.trim().slice(0, 90)}`);
    });
    /* persona fork + exit states exist in both files */
    for (const k of ['watch', 'play'])
      if (!new RegExp(`fork\\(\\\\?["']${k}`).test(html))
        add(g, 'fail', 'onboarding.html', null, `persona fork option '${k}' has no handler`);
    for (const st of ['dismissed', 'parked', 'returning'])
      if (!html.includes(st)) add(g, 'fail', 'onboarding.html', null, `exit state "${st}" not implemented`);
    g.detail = `schema v${OB.version} · ${(OB.tour_beats || []).length} beats · key ${OB.storage_key}`;
  } catch (e) { add(g, 'fail', 'onboarding.json', null, 'parse failure: ' + e.message); }
}

/* ============ G11 lease ============ */
{
  const g = gate('lease', 'lease contract (leases.json ↔ lease.html, power boundaries, feed wording)');
  try {
    const LJ = JSONF('leases.json');
    const html = rd('lease.html');
    /* storage key agreement */
    if (!html.includes(LJ.demo_seed.storage_key))
      add(g, 'fail', 'lease.html', null, `storage_key "${LJ.demo_seed.storage_key}" not found in lease.html`);
    /* state machine: demo STEPS array ⊆ declared states */
    const declared = new Set(LJ.states.map(s => s.id));
    const ms = html.match(/var STEPS=\[([^\]]+)\]/);
    if (!ms) add(g, 'fail', 'lease.html', null, 'STEPS array not found');
    else for (const m of ms[1].matchAll(/'([^']+)'/g))
      if (!declared.has(m[1])) add(g, 'fail', 'lease.html', null, `demo state "${m[1]}" not in leases.json states`);
    /* honesty strings the page MUST carry */
    const MUST = [
      [/game dollars/i, 'currency wall ("game dollars")'],
      [/admin-only/i, 'admin-domain statement ("admin-only")'],
      [/human decides|never auto/i, 'eviction is a human decision'],
      [/spectator/i, 'spectator depth-gating copy'],
      [/no request can touch a lease/i, 'request-pipeline exclusion']
    ];
    for (const [re, label] of MUST)
      if (!re.test(html)) add(g, 'fail', 'lease.html', null, `missing required copy: ${label}`);
    /* feed wording: every wire push uses a neutral template from the table */
    const allowed = ['Listing filled —', 'Listed —', 'housing notice posted —',
      'rent-board filing —', 'rent-board ruling —', 'Unit turning over —',
      'Sold —', 'admin action — tenancy ended at'];
    html.split('\n').forEach((ln, i) => {
      for (const m of ln.matchAll(/tx:'([^']+)'/g)) {
        const tx = m[1];
        if (!allowed.some(p => tx.startsWith(p) || tx.includes("'+" + "l.addr")))
          add(g, 'fail', 'lease.html', i + 1, `feed text off-template: "${tx.slice(0, 80)}"`);
        if (/\$\d|bal|amount|reason|late fee/i.test(tx.replace(/l\.addr/, '')))
          add(g, 'fail', 'lease.html', i + 1, `feed text may leak an amount/reason: "${tx.slice(0, 80)}"`);
      }
    });
    /* licensed-landlord caps: h02 mode exists; evictConfirm gated to admin;
       landlord path can only FILE (evictFile), never confirm */
    if (!html.includes('data-m="landlord"')) add(g, 'fail', 'lease.html', null, 'licensed-landlord mode missing');
    if (!/evictFile/.test(html)) add(g, 'fail', 'lease.html', null, 'licensed-landlord eviction path missing (file-only)');
    const ec = html.match(/window\.evictConfirm=function[\s\S]*?^\};/m);
    if (!ec || /isLand|ownedBy/.test(ec[0]))
      add(g, 'fail', 'lease.html', null, 'evictConfirm reachable from licensed-landlord mode — eviction must stay admin-only');
    /* rent-run numbers agree: fee cap, notice days, income multiple, band */
    const rr = LJ.rent_run;
    for (const [want, label] of [
      ['cap $50', 'late-fee cap'], ['the 10th', 'formal-notice day'],
      ['14 days', 'cure window'], ['2.5', 'income multiple'], ['4', 'raise band %']
    ]) if (!html.includes(want)) add(g, 'fail', 'lease.html', null, `rent-run figure "${label}" (${want}) absent from page`);
    if (rr.late_fee.cap !== 50 || rr.formal_notice_day !== 10 || rr.cure_window_d !== 14)
      add(g, 'fail', 'leases.json', null, 'rent-run numbers drifted from the locked ladder (50/10/14)');
    g.detail = `schema v${LJ.version} · ${declared.size} states · key ${LJ.demo_seed.storage_key}`;
  } catch (e) { add(g, 'fail', 'leases.json', null, 'parse/check failure: ' + e.message); }
}

/* ---------- report ---------- */
for (const g of out.gates) {
  if (g.status === 'fail') out.fails++;
  else if (g.status === 'review') out.reviews++;
  else out.passes++;
}
out.build = 'world v26 local';
out.generated = new Date().toISOString();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(out, null, 2));
} else {
  const MARK = { pass: ' PASS ', review: 'REVIEW', fail: ' FAIL ' };
  console.log(`\nRW boundary audit — ${out.build}`);
  console.log('sim STOPPED · boundaries only · exit 1 on any FAIL\n');
  for (const g of out.gates) {
    console.log(`[${MARK[g.status]}] ${g.id.padEnd(9)} ${g.name}`);
    if (g.detail) console.log(`          ${g.detail}`);
    for (const h of g.hits)
      console.log(`          ${h.sev.toUpperCase().padEnd(6)} ${h.file}${h.line ? ':' + h.line : ''}  ${h.msg}`);
  }
  console.log(`\n${out.passes} pass · ${out.reviews} review · ${out.fails} fail\n`);
}
process.exit(out.fails ? 1 : 0);
