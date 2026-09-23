#!/usr/bin/env node
/* world/audit.js — RW boundary audit (world v37).

   Turns the playtest harness's manual consistency sweep (PT7) into an
   executable gate. Run:

       node world/audit.js            human-readable report
       node world/audit.js --json     machine report (attach to commits)

   Exit code: 1 if any gate FAILs, 0 otherwise. REVIEW hits are listed for
   a human to eyeball — they are contexts a regex can't adjudicate
   (e.g. a doc that legitimately cites the parody mapping), not verdicts.

   Gates:
     corpus    — screen.js run against screen-corpus.json (80/80 contract)
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
     thinai    — thinai.json ↔ thinai.html agreement; locked feed
                 vocabulary only on the wire; handoff note forbidden
                 fields absent by construction; mode-allowance matrix
     bible     — characters/*.md carry the fixed 14-section order with
                 SECRETS last; characters.json mirrors roleplay/briefing
                 fields + v28 backstory/room/strangers; cast.html CAST
                 ids and card fields agree
    crowd     — crowd.json ↔ crowd.html mirror (zones, budgets, shades,
                flows, micros, greets, scenes); extras carry no identity;
                minors greet in packs; overnight allow_deserted protected
    biz       — businesses.json ↔ directory.html mirror (BIZ/WEB blocks);
                cards exist and none orphaned; tier/affordance/hours/staff
                sanity; web edges resolve to real venues, loan edges are
                secret-flagged, reserved entries stay empty
    market    — market.json ↔ market.html deep mirror; every churn row
                resolves to a live jobs.json opening; channels declared;
                ladders resolve to real employers; vacancy/move-in tiers
                and rents match housing.json ladder; no credit figures
    request   — requests.json ↔ request.html mirror; pack ladder + rates +
                ad caps verbatim from the plan PROPOSAL; appeal rules honor
                the not-appealable list; co-sponsor is same-price compatible;
                dark-pattern vocabulary absent
    wire      — feed.json ↔ wire.html: every event kind/status has a chip
                style; honesty strings + live seam + v33 affordances present;
                demo seeds mirrored; NO button offers a world-touching verb
    archive   — history.json ↔ archive.html deep mirror (DEMO_DAYS/THREADS
                eval'd and field-compared); thread registry ↔ event tags
                agree; kinds/statuses in-vocabulary; rumors never person-
                sourced; honesty strings + v34 affordances present; no
                world-mutation call on the surface
    creation  — creation.json ↔ create.html mirror: JOBS/HOMES/LOOK eval'd
                and field-compared to jobs.json/housing.json/record_schema;
                move-in math (deposit + payment plan), payday cadence,
                bill-on-approval, live-seam reads present and no mutation
                call on the surface; draft key + deny codes agree
    mod       — moderation tooling: taxonomy agreement between
                moderation.json and screen.js REASON_CODES; corpus↔lab
                content mirror case-for-case; console CHARS whitelist;
                flag-ledger/shift-report/calibration affordances; no
                mutation calls on internal surfaces
    harness   — playtest harness self-contract: storage key + build tag
                agree with playtest.json; required affordance marks
                present; scenario integrity (unique PT ids, declared
                surfaces, ≥1 checkpoint per step, every surface touched);
                finding-surface dropdown ⊆ declared surfaces

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

/* ============ G12 thin-ai ============ */
{
  const g = gate('thinai', 'thin-AI contract (thinai.json ↔ thinai.html, seam vocabulary, mode matrix)');
  try {
    const TJ = JSONF('thinai.json');
    const html = rd('thinai.html');
    /* storage key agreement */
    if (!html.includes(TJ.demo.storage_key))
      add(g, 'fail', 'thinai.html', null, `storage_key "${TJ.demo.storage_key}" not found in thinai.html`);
    /* mode-allowance matrix: inline MODES == json demo pawn modes */
    const mm = html.match(/var MODES=(\{[\s\S]*?\});/);
    if (!mm) add(g, 'fail', 'thinai.html', null, 'MODES block not found');
    else {
      const MODES = eval('(' + mm[1] + ')');
      for (const p of TJ.demo.pawns) {
        const id = p.id.toLowerCase(), want = JSON.stringify(p.modes);
        if (!MODES[id]) add(g, 'fail', 'thinai.html', null, `pawn ${p.id} missing from inline MODES`);
        else if (JSON.stringify(MODES[id]) !== want)
          add(g, 'fail', 'thinai.html', null, `MODES.${id} ${JSON.stringify(MODES[id])} != ${want}`);
      }
    }
    /* every wire() push uses locked feed vocabulary only */
    html.split('\n').forEach((ln, i) => {
      for (const m of ln.matchAll(/wire\('([^']+)'/g)) {
        const tx = m[1];
        if (!/^(request — |weather — )/.test(tx))
          add(g, 'fail', 'thinai.html', i + 1, `wire line off-vocabulary: "${tx.slice(0, 80)}"`);
      }
    });
    /* handoff note: forbidden fields absent by construction — the writer
       must not carry secrets/seeds/relationship_deltas keys */
    const wn = html.match(/function writeNote[\s\S]*?\n\}/);
    if (!wn) add(g, 'fail', 'thinai.html', null, 'writeNote not found');
    else for (const f of TJ.handoff_note_schema.forbidden_fields)
      if (wn[0].includes(f))
        add(g, 'fail', 'thinai.html', null, `handoff note carries forbidden field "${f}"`);
    /* honesty strings the page MUST carry */
    const MUST = [
      [/seam is invisible|stays invisible/i, 'seam-invisibility statement'],
      [/50% auto-refund/, 'declined-ask refund (50% auto-refund)'],
      [/no seed access/i, 'degraded posture: no seed access'],
      [/90 ?s/i, 'linger/beat budget figure (90 s)'],
      [/never-ship|internal/i, 'internal/never-ship marker'],
      [/baseline/i, 'baseline-rate wage statement']
    ];
    for (const [re, label] of MUST)
      if (!re.test(html)) add(g, 'fail', 'thinai.html', null, `missing required copy: ${label}`);
    /* ambients never possessable, degrade is mains-only: no code path may
       assign those modes to the wrong pawn */
    if (/pawns\.a01[\s\S]{0,80}mode='(possessed|degraded|full)'/.test(html))
      add(g, 'fail', 'thinai.html', null, 'a01 can leave thin — ambients are always thin');
    if (/pawns\.c2[\s\S]{0,80}mode='possessed'/.test(html))
      add(g, 'fail', 'thinai.html', null, 'c2 possessable — mains are never possessable');
    if (/pawns\.(a01|h01)[\s\S]{0,80}mode='degraded'/.test(html))
      add(g, 'fail', 'thinai.html', null, 'non-main pawn degraded — degrade is mains-only');
    /* linger grace figure agrees */
    if (TJ.transitions.find(t => t.id === 'offline_drop').grace_s !== 90)
      add(g, 'fail', 'thinai.json', null, 'linger grace drifted from 90 s');
    g.detail = `schema v${TJ.version} · ${TJ.demo.pawns.length} pawns · key ${TJ.demo.storage_key}`;
  } catch (e) { add(g, 'fail', 'thinai.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G13 bible ============ */
{
  const g = gate('bible', 'character-bible contract (characters/*.md sections ↔ characters.json ↔ cast.html)');
  try {
    const CJ = JSONF('characters.json');
    const html = rd('cast.html');
    /* the fixed section list, in fixed order (index file §"field order") */
    const SECTIONS = ['## Look', '## Personality', '## Voice', '## Mannerisms',
      '## Under pressure', '## Notices / misses', "## Won't do",
      '## Backstory (five beats)', '## The room', '## With strangers',
      '## Public profile', '## Surface relationships', '## Daily routine',
      '## SECRETS & SEEDS'];
    const IDS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];
    const byId = {};
    for (const c of CJ.cast || []) byId[c.id] = c;
    for (const id of IDS) {
      const c = byId[id];
      if (!c) { add(g, 'fail', 'characters.json', null, `${id} missing from cast`); continue; }
      /* json mirror completeness */
      for (const k of CJ.conventions.roleplay_fields)
        if (c[k] === undefined) add(g, 'fail', 'characters.json', null, `${id}: roleplay field "${k}" missing`);
      for (const k of CJ.conventions.briefing_safe_fields)
        if (!(c.briefing_safe || {})[k]) add(g, 'fail', 'characters.json', null, `${id}: briefing_safe.${k} missing`);
      if (c.seed_lock !== true) add(g, 'fail', 'characters.json', null, `${id}: seed_lock not true`);
      /* bible file exists + section order + secrets last */
      if (!fs.existsSync(path.join(W, c.bible))) {
        add(g, 'fail', c.bible, null, `${id}: bible file missing`);
      } else {
        const md = rd(c.bible);
        let pos = -1;
        for (const s of SECTIONS) {
          const i = md.indexOf(s);
          if (i < 0) add(g, 'fail', c.bible, null, `${id}: section "${s}" missing`);
          else if (i < pos) add(g, 'fail', c.bible, null, `${id}: section "${s}" out of order`);
          else pos = i;
        }
        const sec = md.indexOf('## SECRETS & SEEDS');
        if (sec >= 0 && /(^|\n)## /.test(md.slice(sec + 1)))
          add(g, 'fail', c.bible, null, `${id}: a ## section follows SECRETS & SEEDS — secrets must be last`);
        /* five beats actually five */
        const bs = md.slice(md.indexOf('## Backstory'), md.indexOf('## The room'));
        const beats = (bs.match(/^- \*\*\d/gm) || []).length;
        if (beats < 5) add(g, 'fail', c.bible, null, `${id}: backstory has ${beats} dated beats (<5)`);
        /* home address in the bible header agrees with the json */
        if (!md.includes(c.home.split(',')[0]))
          add(g, 'fail', c.bible, null, `${id}: json home "${c.home}" not found in bible`);
      }
      /* new v28 fields stay observable-safe: no seed vocabulary */
      for (const k of ['backstory_brief', 'room', 'strangers'])
        if (c[k] && /secret|seed|briefing|never tell/i.test(c[k]))
          add(g, 'fail', 'characters.json', null, `${id}.${k}: meta/seed vocabulary in an observable field`);
    }
    /* cast.html CAST ids and new fields agree with characters.json */
    const cm = html.match(/const CAST=(\[[\s\S]*?\n\]);/);
    if (!cm) add(g, 'fail', 'cast.html', null, 'inline CAST block not found');
    else {
      const CAST = eval(cm[1]);
      const htmlIds = CAST.map(c => c.id).sort().join(',');
      if (htmlIds !== IDS.join(','))
        add(g, 'fail', 'cast.html', null, `CAST ids ${htmlIds} != ${IDS.join(',')}`);
      for (const c of CAST)
        for (const k of ['back', 'room', 'strg', 'prof', 'ties', 'rout'])
          if (!c[k]) add(g, 'fail', 'cast.html', null, `${c.id}: field "${k}" missing from card`);
    }
    g.detail = `schema v${CJ.version} · ${(CJ.cast || []).length} mains · ${SECTIONS.length} required sections`;
  } catch (e) { add(g, 'fail', 'characters.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G14 crowd ============ */
{
  const g = gate('crowd', 'crowd contract (crowd.json ↔ crowd.html mirror; extras carry no identity; greeting/pairing bounds)');
  try {
    const CJ = JSONF('crowd.json');
    const html = rd('crowd.html');
    const AMB = JSONF('ambients.json');
    const ambIds = new Set(AMB.ambients.map(a => a.id));
    const mainIds = new Set(['C1','C2','C3','C4','C5','C6','C7','C8']);
    /* pull an inline `const NAME=<literal>;` block and eval it */
    const pull = (name, close) => {
      const m = html.match(new RegExp('const ' + name + '=(\\' + close[0] + '[\\s\\S]*?\\' + close[1] + ');'));
      if (!m) throw new Error('inline ' + name + ' not found');
      return eval('(' + m[1] + ')');
    };
    const DP = pull('DAYPARTS', '[]'), ZN = pull('ZONES', '{}'), WXm = pull('WX', '{}'),
      BD = pull('BANDS', '[]'), SH = pull('SHADES', '{}'), FL = pull('FLOWS', '[]'),
      MI = pull('MICROS', '[]'), GR = pull('GREETS', '[]'), SC = pull('SCENES', '[]');
    /* dayparts: id/h0/h1 order + allow_deserted flag */
    if (DP.length !== CJ.dayparts.length)
      add(g, 'fail', 'crowd.html', null, `DAYPARTS length ${DP.length} != ${CJ.dayparts.length}`);
    CJ.dayparts.forEach((d, i) => {
      const h = DP[i];
      if (!h || h[0] !== d.id || h[1] !== d.h0 || h[2] !== d.h1)
        add(g, 'fail', 'crowd.html', null, `daypart ${i} drifted: ${JSON.stringify(h)} vs ${d.id}`);
      if (d.id === 'overnight' && d.allow_deserted !== true)
        add(g, 'fail', 'crowd.json', null, 'overnight lost allow_deserted — the honest hour is protected');
      if (d.id !== 'overnight' && d.allow_deserted)
        add(g, 'fail', 'crowd.json', null, `${d.id} declares allow_deserted — only 00–04 may read empty`);
    });
    /* zones: label/kind/open/closed_days/budget rows deep-equal */
    const jz = Object.keys(CJ.zones).sort(), hz = Object.keys(ZN).sort();
    if (jz.join(',') !== hz.join(','))
      add(g, 'fail', 'crowd.html', null, `zone keys drifted: ${hz.join(',')} != ${jz.join(',')}`);
    for (const z of jz) {
      const J = CJ.zones[z], H = ZN[z] || {};
      for (const k of ['label', 'kind'])
        if (J[k] !== H[k]) add(g, 'fail', 'crowd.html', null, `zone ${z}.${k}: "${H[k]}" != "${J[k]}"`);
      if (JSON.stringify(J.open || null) !== JSON.stringify(H.open || null))
        add(g, 'fail', 'crowd.html', null, `zone ${z}.open drifted`);
      if (JSON.stringify(J.closed_days || null) !== JSON.stringify(H.closed_days || null))
        add(g, 'fail', 'crowd.html', null, `zone ${z}.closed_days drifted`);
      for (const d of ['weekday', 'weekend']) {
        /* html omits zero rows — compare non-zero budgets key-by-key */
        const nz = o => Object.fromEntries(Object.entries(o || {}).filter(([, b]) => b[0] || b[1]));
        if (JSON.stringify(nz(J[d])) !== JSON.stringify(nz(H[d])))
          add(g, 'fail', 'crowd.html', null, `zone ${z}.${d} budgets drifted`);
      }
      /* budget sanity: [lo,hi], lo<=hi, ints */
      for (const d of ['weekday', 'weekend'])
        for (const [dp, b] of Object.entries(J[d] || {}))
          if (!Array.isArray(b) || b.length !== 2 || b[0] > b[1] || b[0] < 0)
            add(g, 'fail', 'crowd.json', null, `zone ${z}.${d}.${dp}: bad budget ${JSON.stringify(b)}`);
    }
    /* weather multipliers + band thresholds */
    if (JSON.stringify(WXm) !== JSON.stringify(CJ.weather_multipliers))
      add(g, 'fail', 'crowd.html', null, 'WX block != weather_multipliers');
    const jBands = Object.values(CJ.conventions.bands).map(b => b[0]);
    if (JSON.stringify(BD.map(b => b[0])) !== JSON.stringify(jBands))
      add(g, 'fail', 'crowd.html', null, `BANDS thresholds ${BD.map(b => b[0])} != ${jBands}`);
    /* scenes: ids/labels match; named refs exist; zone refs exist */
    const jSc = CJ.scenes.map(s => s.id).sort(), hSc = SC.map(s => s.id).sort();
    if (jSc.join(',') !== hSc.join(','))
      add(g, 'fail', 'crowd.html', null, `scene ids drifted: ${hSc.join(',')} != ${jSc.join(',')}`);
    for (const s of CJ.scenes) {
      const H = SC.find(x => x.id === s.id);
      if (H && H.label !== s.label) add(g, 'fail', 'crowd.html', null, `scene ${s.id} label drifted`);
      for (const n of s.when.named || [])
        if (!ambIds.has(n) && !mainIds.has(n))
          add(g, 'fail', 'crowd.json', null, `scene ${s.id}: named "${n}" is not an ambient or main`);
      if (s.when.zone && !CJ.zones[s.when.zone])
        add(g, 'fail', 'crowd.json', null, `scene ${s.id}: unknown zone "${s.when.zone}"`);
    }
    /* v29 blocks: shades/flows/micros/greets mirror + integrity */
    const jSh = CJ.day_shades.shades.map(s => s.id).sort();
    if (JSON.stringify(Object.keys(SH).sort()) !== JSON.stringify(jSh))
      add(g, 'fail', 'crowd.html', null, `SHADES keys != day_shades ids (${jSh.join(',')})`);
    for (const s of CJ.day_shades.shades) {
      for (const z of Object.keys(s.zone_mult || {}))
        if (!CJ.zones[z]) add(g, 'fail', 'crowd.json', null, `shade ${s.id}: unknown zone ${z}`);
      for (const k of Object.keys(s.kind_mult || {}))
        if (!Object.values(CJ.zones).some(zz => zz.kind === k))
          add(g, 'fail', 'crowd.json', null, `shade ${s.id}: kind_mult "${k}" matches no zone kind`);
      for (const [dp, mm] of Object.entries(s.daypart_zone_mult || {})) {
        if (!CJ.dayparts.some(d => d.id === dp)) add(g, 'fail', 'crowd.json', null, `shade ${s.id}: unknown daypart ${dp}`);
        for (const z of Object.keys(mm)) if (!CJ.zones[z]) add(g, 'fail', 'crowd.json', null, `shade ${s.id}.${dp}: unknown zone ${z}`);
      }
      for (const sid of Object.keys(s.scene_weight || {}))
        if (!jSc.includes(sid)) add(g, 'fail', 'crowd.json', null, `shade ${s.id}: scene_weight "${sid}" is not a scene`);
    }
    const jFl = CJ.flow_edges.edges.map(e => e.id).sort();
    if (JSON.stringify(FL.map(f => f.id).sort()) !== JSON.stringify(jFl))
      add(g, 'fail', 'crowd.html', null, 'FLOWS ids != flow_edges ids');
    const flEndpoints = new Set([...Object.keys(CJ.zones), 'edge']);
    for (const e of CJ.flow_edges.edges) {
      for (const ep of [e.a, e.b])
        if (!flEndpoints.has(ep)) add(g, 'fail', 'crowd.json', null, `edge ${e.id}: endpoint "${ep}" is not a zone or 'edge'`);
      for (const dp of e.dayparts || [])
        if (!CJ.dayparts.some(d => d.id === dp)) add(g, 'fail', 'crowd.json', null, `edge ${e.id}: unknown daypart ${dp}`);
      for (const [d, r] of Object.entries(e.flow || {}))
        if (r[0] > r[1]) add(g, 'fail', 'crowd.json', null, `edge ${e.id}.${d}: bad flow range`);
    }
    const jMi = CJ.micro_events.events.map(e => e.id).sort();
    if (JSON.stringify(MI.map(m => m.id).sort()) !== JSON.stringify(jMi))
      add(g, 'fail', 'crowd.html', null, 'MICROS ids != micro_events ids');
    const flIds = new Set(jFl);
    for (const e of CJ.micro_events.events) {
      if (!e.when) add(g, 'fail', 'crowd.json', null, `micro ${e.id}: no condition block`);
      for (const k of Object.keys(e.edge_mult || {}))
        if (!flIds.has(k)) add(g, 'fail', 'crowd.json', null, `micro ${e.id}: edge_mult "${k}" is not a flow edge`);
      for (const z of Object.keys(e.zone_mult || {}))
        if (!CJ.zones[z]) add(g, 'fail', 'crowd.json', null, `micro ${e.id}: unknown zone ${z}`);
    }
    /* greeting matrix: ids are ambients or mains, weights legal, minors packed */
    const jGr = CJ.greeting_matrix.pairs;
    const hKey = GR.map(x => [x.a, x.b].join(':')).sort(), jKey = jGr.map(x => [x.a, x.b].join(':')).sort();
    if (JSON.stringify(hKey) !== JSON.stringify(jKey))
      add(g, 'fail', 'crowd.html', null, 'GREETS pairs != greeting_matrix pairs');
    const wOk = new Set(['hi', 'lo', 'none']);
    for (const p of jGr) {
      for (const x of [p.a, p.b])
        if (!ambIds.has(x) && !mainIds.has(x))
          add(g, 'fail', 'crowd.json', null, `greet ${p.a}↔${p.b}: "${x}" is not a cast id`);
      if (!wOk.has(p.weight)) add(g, 'fail', 'crowd.json', null, `greet ${p.a}↔${p.b}: weight "${p.weight}" not in hi/lo/none`);
      const minor = id => (AMB.ambients.find(a => a.id === id) || {}).minor;
      if ((minor(p.a) || minor(p.b)) && !p.minor_pack)
        add(g, 'fail', 'crowd.json', null, `greet ${p.a}↔${p.b}: minor pair without minor_pack — minors greet in packs only`);
      if ((ambIds.has(p.a) && ambIds.has(p.b)) === false && !p.main_crossing)
        add(g, 'fail', 'crowd.json', null, `greet ${p.a}↔${p.b}: a main pair without main_crossing flag`);
      /* observable-safe: form text carries no seed/meta vocabulary */
      if (/secret|seed|briefing|must_not_know/i.test(p.form || ''))
        add(g, 'fail', 'crowd.json', null, `greet ${p.a}↔${p.b}: meta vocabulary in form text`);
    }
    /* extras boundary: no identity-shaped fields anywhere in the extra layer */
    const extraBlocks = [CJ.flow_edges, CJ.micro_events, CJ.persistence, CJ.appearance_palette, CJ.spawner];
    const exJson = JSON.stringify(extraBlocks);
    if (/"name"\s*:|"fullName"\s*:|tenant_id|"lease"/.test(exJson))
      add(g, 'fail', 'crowd.json', null, 'identity/ledger field detected in an extras-layer block');
    if (!CJ.feed_wording || !CJ.feed_wording.venue_band_event)
      add(g, 'fail', 'crowd.json', null, 'feed_wording.venue_band_event missing — the wire vocabulary is the boundary');
    g.detail = `schema v${CJ.version} · ${jz.length} zones · ${jFl.length} edges · ${jGr.length} pairs`;
  } catch (e) { add(g, 'fail', 'crowd.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G15 biz ============ */
{
  const g = gate('biz', 'business registry contract (businesses.json ↔ directory.html; web edge integrity)');
  try {
    const BJ = JSONF('businesses.json');
    const html = rd('directory.html');
    const pull = (name, close) => {
      const m = html.match(new RegExp('const ' + name + '\\s*=\\s*(\\' + close[0] + '[\\s\\S]*?\\' + close[1] + ');'));
      if (!m) throw new Error('inline ' + name + ' not found');
      return eval('(' + m[1] + ')');
    };
    const BIZ = pull('BIZ', '[]'), WEB = pull('WEB', '[]');
    const tiers = new Set(Object.keys(BJ.tiers));
    const affKeys = new Set(Object.keys(BJ.affordance_keys));
    const ids = new Set(BJ.businesses.map(b => b.id));
    const names = new Set();
    const CASTID = /^[cC]([1-8])$|^[aA](0[1-9]|1[0-9]|20)$/;
    const cardFiles = new Set(BJ.businesses.map(b => b.card).filter(Boolean));
    for (const b of BJ.businesses) {
      if (!tiers.has(b.tier)) add(g, 'fail', 'businesses.json', null, `${b.id}: tier "${b.tier}" not in tiers`);
      if (names.has(b.name)) add(g, 'fail', 'businesses.json', null, `${b.id}: duplicate name "${b.name}"`);
      names.add(b.name);
      for (const k of Object.keys(b.affordances || {}))
        if (!affKeys.has(k)) add(g, 'fail', 'businesses.json', null, `${b.id}: affordance "${k}" not in affordance_keys`);
      for (const s of b.staff || []) {
        const tok = String(s).match(/^([a-zA-Z]\d+)/);
        if (!tok || !CASTID.test(tok[1])) add(g, 'fail', 'businesses.json', null, `${b.id}: staff "${s}" is not a cast id`);
      }
      for (const d of ['weekday', 'weekend']) {
        const h = (b.hours || {})[d];
        if (h !== undefined && h !== null && (!Array.isArray(h) || h.length !== 2 || h[0] < 0 || h[1] > 26.5 || h[0] >= h[1]))
          add(g, 'fail', 'businesses.json', null, `${b.id}: bad ${d} hours ${JSON.stringify(h)}`);
      }
      for (const d of (b.hours || {}).days || [])
        if (!['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(d))
          add(g, 'fail', 'businesses.json', null, `${b.id}: hours.days "${d}" not a day abbreviation`);
      if (b.tier === 'reserved' && ((b.staff || []).length || b.hours || b.job_card))
        add(g, 'fail', 'businesses.json', null, `${b.id}: reserved tier carries staff/hours/job_card — reserved stays empty`);
      if (b.card && !fs.existsSync(path.join(W, b.card.replace(/^world\//, ''))))
        add(g, 'fail', b.card, null, `${b.id}: card file missing`);
      /* inline mirror: html BIZ row exists with same name/tier */
      const hb = BIZ.find(x => x.id === b.id);
      if (!hb) add(g, 'fail', 'directory.html', null, `BIZ missing "${b.id}"`);
      else {
        const norm = s => String(s).replace(/[\u2018\u2019]/g, "'");
        if (norm(hb.name) !== norm(b.name)) add(g, 'fail', 'directory.html', null, `BIZ ${b.id} name drifted: "${hb.name}" != "${b.name}"`);
        if (hb.tier !== b.tier) add(g, 'fail', 'directory.html', null, `BIZ ${b.id} tier drifted`);
        /* secret-marked staffers are withheld from the inline card at any
           clearance — compare only the public staff count */
        const jc = (b.staff || []).filter(s => !/secret/i.test(String(s))).length,
          hc = (hb.staff || []).length;
        if (jc !== hc) add(g, 'fail', 'directory.html', null, `BIZ ${b.id} staff count ${hc} != ${jc}`);
        if ((hb.card || '') !== b.card) add(g, 'fail', 'directory.html', null, `BIZ ${b.id} card path drifted`);
      }
    }
    for (const hb of BIZ)
      if (!ids.has(hb.id)) add(g, 'fail', 'directory.html', null, `inline BIZ "${hb.id}" absent from businesses.json`);
    /* orphan cards: every businesses/*.md must be referenced */
    for (const f of fs.readdirSync(path.join(W, 'businesses')).filter(f => f.endsWith('.md')))
      if (!cardFiles.has('world/businesses/' + f))
        add(g, 'fail', 'businesses/' + f, null, 'orphan card — no registry entry references it');
    /* web edges: endpoints real, kinds declared, loan always secret,
       secret flag mirrored in inline WEB */
    const kinds = new Set(Object.keys(BJ.web.kinds));
    const jEdges = new Set(), hEdges = new Set();
    for (const e of BJ.web.edges) {
      for (const ep of [e.a, e.b])
        if (!ids.has(ep)) add(g, 'fail', 'businesses.json', null, `web edge ${e.a}→${e.b}: "${ep}" is not a business`);
      if (!kinds.has(e.kind)) add(g, 'fail', 'businesses.json', null, `web edge ${e.a}→${e.b}: kind "${e.kind}" not declared`);
      if (e.kind === 'loan' && e.secret !== true)
        add(g, 'fail', 'businesses.json', null, `web edge ${e.a}→${e.b}: loan without secret flag`);
      jEdges.add([e.a, e.b, e.kind, !!e.secret].join('|'));
    }
    for (const e of WEB) hEdges.add([e.a, e.b, e.kind, !!e.secret].join('|'));
    for (const k of jEdges) if (!hEdges.has(k)) add(g, 'fail', 'directory.html', null, `WEB missing edge ${k}`);
    for (const k of hEdges) if (!jEdges.has(k)) add(g, 'fail', 'directory.html', null, `inline WEB edge ${k} absent from businesses.json`);
    /* public-clearance redaction path must exist for secret edges */
    if (!/e\.secret&&state\.clr!=='internal'/.test(html))
      add(g, 'fail', 'directory.html', null, 'secret web edges have no public-clearance redaction path');
    g.detail = `schema v${BJ.version} · ${ids.size} businesses · ${BJ.web.edges.length} web edges · ${cardFiles.size} cards`;
  } catch (e) { add(g, 'fail', 'businesses.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G16 market ============ */
{
  const g = gate('market', 'market layer contract (market.json ↔ market.html; churn resolves to live openings; no credit figures)');
  try {
    const MJ = JSONF('market.json');
    const JJ = JSONF('jobs.json');
    const HJ = JSONF('housing.json');
    const html = rd('market.html');
    const m = html.match(/const MARKET\s*=\s*(\{[\s\S]*?\});\s*\n/);
    if (!m) throw new Error('inline MARKET block not found');
    const INL = eval('(' + m[1] + ')');
    if (JSON.stringify(INL) !== JSON.stringify(MJ))
      add(g, 'fail', 'market.html', null, 'inline MARKET != market.json (hand-sync drift)');
    if (MJ.schema !== 'market-v1')
      add(g, 'fail', 'market.json', null, `schema "${MJ.schema}" != market-v1`);
    /* no credit figures anywhere in this layer */
    const mtxt = rd('market.json');
    for (const mm of mtxt.matchAll(/\b\d[\d,]*\s*cr\b/gi))
      add(g, 'fail', 'market.json', null, `credit figure in market layer: "${mm[0]}"`);
    /* channels + lifecycle states declared */
    const chans = new Set(Object.keys(MJ.channels));
    for (const s of MJ.opening_lifecycle.states)
      if (!/^[a-z_]+$/.test(s)) add(g, 'fail', 'market.json', null, `bad lifecycle state "${s}"`);
    /* every churn row resolves to a jobs.json entry with openings != 0 */
    const openJobs = JJ.jobs.filter(j => j.openings !== 0);
    const seen = new Set();
    for (const c of MJ.churn) {
      const key = c.employer + '|' + c.role;
      if (seen.has(key)) add(g, 'fail', 'market.json', null, `duplicate churn row ${key}`);
      seen.add(key);
      if (!chans.has(c.channel))
        add(g, 'fail', 'market.json', null, `${key}: channel "${c.channel}" not declared`);
      const job = openJobs.find(j => j.employer === c.employer && j.role === c.role);
      if (!job) add(g, 'fail', 'market.json', null, `churn row ${key} has no live jobs.json opening`);
      const tok = String(c.decider).match(/^([a-zA-Z])(\d+)/);
      if (tok) {
        const cid = tok[1].toLowerCase() + tok[2];
        if (!/^c[1-8]$|^a(0[1-9]|1[0-9]|20)$/.test(cid))
          add(g, 'fail', 'market.json', null, `${key}: decider "${c.decider}" is not a cast id`);
      }
      if (c.seasonal === true) {
        const sj = openJobs.find(j => j.employer === c.employer && j.role === c.role && j.seasonal);
        if (!sj) add(g, 'fail', 'market.json', null, `${key}: seasonal churn row but jobs.json opening is not seasonal`);
      }
    }
    /* live openings with no churn row are drift the other way
       (informal/always-hiring rows may legitimately skip — flag review) */
    for (const j of openJobs)
      if (!MJ.churn.find(c => c.employer === j.employer && c.role === j.role))
        add(g, 'review', 'jobs.json', null, `live opening ${j.employer} — ${j.role} has no churn row`);
    /* ladders resolve to real employers */
    const employers = new Set(JJ.jobs.map(j => j.employer));
    for (const l of MJ.ladders)
      for (const part of l.at.split(' / '))
        if (!employers.has(part) && ![...employers].some(e => e.startsWith(part) || part.startsWith(e)))
          add(g, 'fail', 'market.json', null, `ladder ${l.from}→${l.to}: employer "${part}" unknown`);
    /* seasonal months sane, ids unique */
    const sids = new Set();
    for (const s of MJ.seasonal) {
      if (sids.has(s.id)) add(g, 'fail', 'market.json', null, `duplicate seasonal id "${s.id}"`);
      sids.add(s.id);
      for (const mo of s.months)
        if (mo < 1 || mo > 12) add(g, 'fail', 'market.json', null, `seasonal ${s.id}: month ${mo} out of range`);
    }
    /* vacancy + move-in tiers match housing ladder; move-in first == rent */
    const tiers = new Map(HJ.listings_ladder.map(t => [t.tier, t.rent]));
    for (const t of MJ.vacancy_lifecycle.tiers)
      if (!tiers.has(t.tier)) add(g, 'fail', 'market.json', null, `vacancy tier "${t.tier}" not in housing ladder`);
    for (const t of MJ.move_in_math) {
      if (!tiers.has(t.tier)) { add(g, 'fail', 'market.json', null, `move-in tier "${t.tier}" not in housing ladder`); continue; }
      if (t.first !== tiers.get(t.tier))
        add(g, 'fail', 'market.json', null, `move-in ${t.tier}: first ${t.first} != ladder rent ${tiers.get(t.tier)}`);
      if (t.total !== t.first + t.deposit)
        add(g, 'fail', 'market.json', null, `move-in ${t.tier}: total ${t.total} != first+deposit`);
    }
    /* room deposit is the one sub-month deposit — assert the norm held */
    const room = MJ.move_in_math.find(t => t.tier === 'room');
    if (room && room.deposit >= room.first)
      add(g, 'fail', 'market.json', null, 'room deposit should be sub-month (share norm)');
    g.detail = `schema ${MJ.schema} · ${MJ.churn.length} churn rows · ${MJ.ladders.length} ladders · ${MJ.seasonal.length} seasonal notes · ${MJ.vacancy_lifecycle.tiers.length} vacancy tiers`;
  } catch (e) { add(g, 'fail', 'market.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G17 request ============ */
{
  const g = gate('request', 'request contract (requests.json ↔ request.html; plan-verbatim pricing; appeal/co-sponsor/extend rules)');
  try {
    const RJ = JSONF('requests.json');
    const html = rd('request.html');
    /* action catalog: every json action id + rate appears in the demo */
    for (const a of RJ.actions) {
      if (a.spec) {   /* actions owned by another surface (e.g. hire → creation-ui.md) */
        try { rd(a.spec.replace(/^world\//, '')); }
        catch { add(g, 'fail', a.spec, null, `spec for action "${a.id}" not found`); }
        continue;
      }
      if (!html.includes(`id:'${a.id}'`) && !html.includes(`id:"${a.id}"`))
        add(g, 'fail', 'request.html', null, `action "${a.id}" missing from demo ACTIONS`);
    }
    for (const [cls, c] of Object.entries(RJ.classes)) {
      if (c.rate_cr_per_min && !new RegExp(`${cls}: ?${c.rate_cr_per_min}`).test(html))
        add(g, 'fail', 'request.html', null, `rate for ${cls} (${c.rate_cr_per_min} cr/min) not in demo`);
    }
    if (RJ.classes.queued.discount !== 0.15 || !html.includes('QUEUE_DISCOUNT = 0.15'))
      add(g, 'fail', 'requests.json', null, 'queue discount drifted from −15%');
    /* wallet ladder verbatim from plan §2.1 */
    const WANT = [[0.99,100],[4.99,550],[9.99,1150],[19.99,2500],[49.99,6750],[99.99,14000]];
    RJ.wallet.packs.forEach((p, i) => {
      if (p.usd !== WANT[i][0] || p.cr !== WANT[i][1])
        add(g, 'fail', 'requests.json', null, `pack ${p.id} ${p.usd}/${p.cr} != plan ${WANT[i]}`);
      if (!html.includes(`usd:${p.usd}`) || !html.includes(`cr:${p.cr}`))
        add(g, 'fail', 'request.html', null, `pack ${p.id} (${p.usd}/${p.cr}) not in demo PACKS`);
    });
    if (RJ.wallet.first_purchase_bonus.mult !== 0.5 || !html.includes('+50%'))
      add(g, 'fail', 'requests.json', null, 'first-purchase +50% missing or drifted');
    if (RJ.wallet.daily_spend_cap_usd !== 200 || !html.includes('$200'))
      add(g, 'fail', 'requests.json', null, 'daily spend cap must be $200 and shown');
    const ra = RJ.wallet.rewarded_ads;
    if (ra.cr_per_view !== 2 || ra.per_day !== 5 || ra.per_week !== 25)
      add(g, 'fail', 'requests.json', null, 'rewarded-ad numbers drifted (2/5/25)');
    for (const s of ['+2 cr','never pre-roll','never mid-session'])
      if (!html.includes(s)) add(g, 'fail', 'request.html', null, `ad placement copy missing "${s}"`);
    /* appeals: window, different-reviewer rule, not-appealable honored */
    if (RJ.appeals.window_h !== 72 || !html.includes('72'))
      add(g, 'fail', 'requests.json', null, 'appeal window must be 72 h');
    if (!/different reviewer/.test(html))
      add(g, 'fail', 'request.html', null, 'different-reviewer appeal copy missing');
    for (const code of RJ.appeals.not_appealable)
      if (!html.includes(`'${code}'`)) add(g, 'fail', 'request.html', null,
        `not-appealable code "${code}" absent from NONAPPEAL`);
    if (!/never appear on the public feed|not.*spectacle/i.test(html))
      add(g, 'fail', 'request.html', null, 'appeal privacy copy missing (aggregate-only feed visibility)');
    /* co-sponsor: same price, compatible, capped, attributed */
    const co = RJ.co_sponsor;
    if (co.cap !== 4 || !/compatible/.test(co.class) || !/same flat block price|same world event/.test(co.pricing + co.class))
      add(g, 'fail', 'requests.json', null, 'co_sponsor contract drifted (cap 4 / compatible / same-price)');
    for (const s of ['co-sponsor','not a discount','Co-sponsor'])
      if (!html.includes(s)) add(g, 'fail', 'request.html', null, `co-sponsor copy "${s}" missing`);
    /* locked honesty strings */
    const MUST = [
      [/not redacted: absent/i, 'briefing secrets bar'],
      [/unpossessable/i, 'possession ban'],
      [/hard cap/i, 'upfront hard cap'],
      [/never mind-control|never mind.control/i, 'opportunity-not-mind-control'],
      [/request not approved/i, 'neutral deny wording'],
      [/auto-refund/i, 'queued expiry refund']
    ];
    for (const [re, label] of MUST)
      if (!re.test(html)) add(g, 'fail', 'request.html', null, `missing required copy: ${label}`);
    /* dark-pattern vocabulary — tailored (queue/expire words are legitimate here) */
    const DARK = [
      /limited[- ]time offer/i, /\bstreak\b/i, /only \d+ left/i, /\bhurry\b/i,
      /act now/i, /don'?t miss/i, /\bfomo\b/i, /offer ends/i, /claim your/i,
      /skip (the )?(queue|cooldown)/i, /buy (a |the )?cooldown/i, /loot box/i, /\bodds\b/i
    ];
    html.split('\n').forEach((ln, i) => {
      for (const re of DARK)
        if (re.test(ln)) add(g, 'fail', 'request.html', i + 1,
          `dark-pattern vocabulary ${re}: ${ln.trim().slice(0, 100)}`);
    });
    /* screening is the shared engine, never a stub */
    if (!html.includes('screen.js') || !html.includes('RWScreen.screenRequest'))
      add(g, 'fail', 'request.html', null, 'demo must screen through world/screen.js, not a stub');
    g.detail = `${RJ.actions.length} actions · ${RJ.wallet.packs.length} packs · appeal ${RJ.appeals.window_h} h · co-sponsor cap ${co.cap}`;
  } catch (e) { add(g, 'fail', 'requests.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G18 wire ============ */
{
  const g = gate('wire', 'spectator feed contract (feed.json ↔ wire.html; view-layer-only affordances; seed mirror)');
  try {
    const FJ = JSONF('feed.json');
    const html = rd('wire.html');
    /* every event kind has a chip style */
    const kinds = FJ.event_kinds.filter((v, i) => i % 2 === 0);
    for (const k of kinds)
      if (!new RegExp('\\.k\\.' + k + '\\b').test(html))
        add(g, 'fail', 'wire.html', null, `event kind "${k}" has no .k.${k} chip style`);
    /* every request status has a chip style (stKey transform mirrors the page) */
    const stKey = s => s.replace(/[ ()]/g, '_').toLowerCase();
    for (const s of FJ.request_status)
      if (!new RegExp('\\.st\\.' + stKey(s) + '\\b').test(html))
        add(g, 'fail', 'wire.html', null, `status "${s}" has no .st.${stKey(s)} style`);
    /* honesty strings + merge seam must exist on the surface */
    const MUST = [
      [/demo stream/, 'demo badge'],
      [/request not approved/i, 'neutral deny wording'],
      [/UNPOSSESSABLE/, 'possession-ban badge'],
      [/compensated/i, 'admin compensation line'],
      [/gsViewerState/, 'live bridge seam'],
      [/The Archive/i, 'archive pointer'],
      [/load older/, 'pagination affordance'],
      [/role="log"/, 'a11y log role'],
      [/jump to top/, 'new-events pill'],
      [/didn(\\u2019|')t pause/i, 'hold honesty copy'],
      [/reaching in now/, 'live-request strip label'],
      [/same world event, not a discount/, 'co-sponsor attribution copy']
    ];
    for (const [re, label] of MUST)
      if (!re.test(html)) add(g, 'fail', 'wire.html', null, `missing required copy: ${label}`);
    /* v33 affordances + contract keys */
    for (const s of ['id="livenow"', 'id="holdbar"', 'id="hold"', 'id="zen"',
      'id="keypop"', 'id="dens"', 'id="keys"', '#r=', 'rw_wire_density',
      'keydown', 'prefers-reduced-motion'])
      if (!html.includes(s)) add(g, 'fail', 'wire.html', null, `v33 affordance "${s}" absent`);
    const V33 = (FJ.spectator_ui || {}).spectator_ui_v33 || {};
    for (const k of ['zen', 'hold', 'reaching_in_now', 'keyboard',
      'request_permalink', 'mentions_ui', 'density', 'reduced_motion'])
      if (!V33[k]) add(g, 'fail', 'feed.json', null, `spectator_ui_v33.${k} missing`);
    /* demo seed mirror: every feed.json seed renders in the demo (text match) */
    for (const e of FJ.demo_seeds || []) {
      const norm = s => s
        .replace(/[\u2018\u2019']/g, '\\u2019')
        .replace(/\u201c/g, '\\u201c').replace(/\u201d/g, '\\u201d');
      if (!html.includes(e.text) && !html.includes(norm(e.text)))
        add(g, 'fail', 'wire.html', null, `demo seed t${e.t} text not mirrored: "${e.text.slice(0, 70)}"`);
      if (e.req && !html.includes(e.req))
        add(g, 'fail', 'wire.html', null, `demo seed req "${e.req}" not mirrored`);
    }
    /* NO button may offer a world-touching verb. The wire is view-layer:
       pins filter, copy-link copies, preview toasts — nothing else. */
    html.split('\n').forEach((ln, i) => {
      for (const m of ln.matchAll(/<button[^>]*>([^<]*)<\/button>/g)) {
        const t = m[1].replace(/<[^>]+>/g, '');
        if (/\b(possess|nudge|tip|evict|hire|buy|pay|report|send)\b/i.test(t))
          add(g, 'fail', 'wire.html', i + 1, `button offers a world-touching verb: "${t.trim()}"`);
      }
      /* onclick handlers may only ever open view-layer actions — spot the
         wire for fetch/XHR verbs that would imply a real mutation */
      if (/\bXMLHttpRequest\b|\.post\(|gsRequest[A-Z]|gsPossess|gsAdmin/i.test(ln))
        add(g, 'fail', 'wire.html', i + 1, `world-mutation call on a spectator surface: ${ln.trim().slice(0, 100)}`);
    });
    g.detail = `${kinds.length} kinds · ${FJ.request_status.length} statuses · ` +
      `${(FJ.demo_seeds || []).length} seeds mirrored · v33 keys: ${Object.keys(V33).join(',') || 'none'}`;
  } catch (e) { add(g, 'fail', 'feed.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G19 archive ============ */
{
  const g = gate('archive', 'history contract (history.json ↔ archive.html mirror; thread registry; rumor honesty; view-layer only)');
  try {
    const HJ = JSONF('history.json');
    const FJ = JSONF('feed.json');
    const html = rd('archive.html');
    /* DEMO_DAYS deep mirror: eval the page's object literal and compare
       field-for-field against history.json days */
    const dm = /var DEMO_DAYS = (\{[\s\S]*?\n\});/.exec(html);
    if (!dm) add(g, 'fail', 'archive.html', null, 'DEMO_DAYS block not found');
    const DEMO = dm ? eval('(' + dm[1].replace(/;$/, '') + ')') : {};
    let evCount = 0;
    for (const d of Object.keys(HJ.days)) {
      const a = HJ.days[d], b = DEMO[d];
      if (!b) { add(g, 'fail', 'archive.html', null, `demo missing day ${d}`); continue; }
      if (a.length !== b.length)
        add(g, 'fail', 'archive.html', null, `day ${d}: ${a.length} events in json vs ${b.length} in demo`);
      for (let i = 0; i < a.length; i++) {
        evCount++;
        if (!b[i]) continue;
        for (const k of ['id', 't', 'kind', 'text', 'status', 'req', 'venue', 'who'])
          if (String(a[i][k]) !== String(b[i][k]))
            add(g, 'fail', 'archive.html', null,
              `event ${a[i].id}: field "${k}" differs (json "${a[i][k]}" / demo "${b[i][k]}")`);
        if (JSON.stringify(a[i].thread || null) !== JSON.stringify(b[i].thread || null))
          add(g, 'fail', 'archive.html', null, `event ${a[i].id}: thread tag not mirrored`);
      }
    }
    /* kind/status vocabulary stays inside feed.json (+ rumor kind) */
    const kinds = new Set(FJ.event_kinds.filter((v, i) => i % 2 === 0).concat(['rumor']));
    const stats = new Set(FJ.request_status);
    for (const d of Object.keys(HJ.days))
      for (const e of HJ.days[d]) {
        if (!kinds.has(e.kind)) add(g, 'fail', 'history.json', null, `event ${e.id}: unknown kind "${e.kind}"`);
        if (e.status && !stats.has(e.status))
          add(g, 'fail', 'history.json', null, `event ${e.id}: unknown status "${e.status}"`);
        /* rumors are place-sourced talk — never person-sourced */
        if (e.kind === 'rumor') {
          if (e.who) add(g, 'fail', 'history.json', null, `rumor ${e.id} carries a person source (who)`);
          if (!e.src) add(g, 'fail', 'history.json', null, `rumor ${e.id} has no place source`);
          if (e.outcome && !/^(debunked|faded|stood)$/.test(e.outcome.state))
            add(g, 'fail', 'history.json', null, `rumor ${e.id}: bad outcome state "${e.outcome.state}"`);
        }
        if (e.id && !/^d\d{4}-\d{2}$/.test(e.id))
          add(g, 'fail', 'history.json', null, `event id "${e.id}" breaks the d<MMDD>-NN permalink contract`);
      }
    /* THREADS registry mirror + tag agreement */
    const tm = /var THREADS = (\{[\s\S]*?\});/.exec(html);
    if (!tm) add(g, 'fail', 'archive.html', null, 'THREADS block not found');
    const TH = tm ? eval('(' + tm[1].replace(/;$/, '') + ')') : {};
    if (JSON.stringify(Object.keys(TH)) !== JSON.stringify(Object.keys(HJ.threads || {})))
      add(g, 'fail', 'archive.html', null, 'THREADS keys differ from history.json threads');
    const tagUse = {};
    for (const d of Object.keys(HJ.days))
      for (const e of HJ.days[d])
        for (const tid of e.thread || []) {
          if (!(HJ.threads || {})[tid])
            add(g, 'fail', 'history.json', null, `event ${e.id} tagged with unregistered thread "${tid}"`);
          tagUse[tid] = (tagUse[tid] || 0) + 1;
        }
    for (const tid of Object.keys(HJ.threads || {})) {
      const th = HJ.threads[tid];
      if (!th.label || !th.blurb)
        add(g, 'fail', 'history.json', null, `thread "${tid}" needs label + blurb`);
      if ((tagUse[tid] || 0) < 2)
        add(g, 'fail', 'history.json', null, `thread "${tid}" has ${tagUse[tid] || 0} member events — a thread needs ≥2`);
    }
    /* honesty strings + v34 affordances */
    const MUST = [
      [/demo archive/, 'demo badge'],
      [/live archive/, 'live badge'],
      [/unconfirmed/, 'rumor marking'],
      [/never sourced to a person/, 'rumor place-source copy'],
      [/public whereabouts only/, 'person-scope chip'],
      [/still being written/, 'today honesty marker'],
      [/off the feed/, 'honest gaps'],
      [/sanitize/i, 'ledger honesty copy'],
      [/whole record/, 'whole-record search affordance'],
      [/copy transcript/, 'transcript affordance'],
      [/arrangement only/, 'thread-scope chip'],
      [/data-v="threads"/, 'threads view switch'],
      [/id="scopetgl"/, 'search scope chip'],
      [/id="txbtn"/, 'transcript control'],
      [/gsWireDays/, 'live seam (gsWireDays)'],
      [/gsWireArchiveDay/, 'live seam (gsWireArchiveDay)'],
      [/archive\.html#e=/, 'permalink format']
    ];
    for (const [re, label] of MUST)
      if (!re.test(html)) add(g, 'fail', 'archive.html', null, `missing required copy/affordance: ${label}`);
    /* no world-mutation call on the surface */
    html.split('\n').forEach((ln, i) => {
      for (const m of ln.matchAll(/<button[^>]*>([^<]*)<\/button>/g)) {
        const t = m[1].replace(/<[^>]+>/g, '');
        if (/\b(possess|nudge|tip|evict|hire|buy|pay|report|send)\b/i.test(t))
          add(g, 'fail', 'archive.html', i + 1, `button offers a world-touching verb: "${t.trim()}"`);
      }
      if (/\bXMLHttpRequest\b|\.post\(|gsRequest[A-Z]|gsPossess|gsAdmin/i.test(ln))
        add(g, 'fail', 'archive.html', i + 1, `world-mutation call on a spectator surface: ${ln.trim().slice(0, 100)}`);
    });
    g.detail = `${Object.keys(HJ.days).length} days · ${evCount} events mirrored · ` +
      `${Object.keys(HJ.threads || {}).length} threads · schema archive-v3`;
  } catch (e) { add(g, 'fail', 'history.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G20 creation ============ */
{
  const g = gate('creation', 'character-creation contract (creation.json ↔ create.html; jobs/housing/look mirrors; move-in math; bill-on-approval; read-only seam)');
  try {
    const CJ = JSONF('creation.json');
    const JJ = JSONF('jobs.json');
    const HJ = JSONF('housing.json');
    const FJ = JSONF('feed.json');
    const html = rd('create.html');
    /* contract blocks the v35 surface depends on */
    for (const k of ['move_in_math', 'payday', 'job_board', 'live_seam', 'screening', 'briefing_whitelist'])
      if (CJ[k] === undefined) add(g, 'fail', 'creation.json', null, `contract block "${k}" missing`);
    if (CJ.price.hire_cr !== 500) add(g, 'fail', 'creation.json', null, 'hire price drifted from 500 cr');
    if (!/approval/.test(CJ.price.billing)) add(g, 'fail', 'creation.json', null, 'billing must be on-approval (billOnApproval)');
    if (!/payment plan/.test(CJ.move_in_math.shortfall_rule))
      add(g, 'fail', 'creation.json', null, 'deposit shortfall must ride a stated payment plan');
    if (!(CJ.screening.deny_codes || []).includes('name-collision'))
      add(g, 'fail', 'creation.json', null, 'name-collision deny code missing');
    /* JOBS mirror eval + field compare against jobs.json */
    const jm = /var JOBS = (\[[\s\S]*?\]);/.exec(html);
    if (!jm) add(g, 'fail', 'create.html', null, 'JOBS block not found');
    const DJOBS = jm ? eval(jm[1]) : [];
    const jjRow = (e, r) => JJ.jobs.find(x => x.employer === e && x.role === r);
    let seek = 0;
    for (const j of DJOBS) {
      if (j.id === 'seeking') { seek++; continue; }
      const row = jjRow(j.employer, j.role);
      if (!row) { add(g, 'fail', 'create.html', null, `demo job "${j.employer} — ${j.role}" not in jobs.json`); continue; }
      if (+row.wage !== +j.wage) add(g, 'fail', 'create.html', null, `${j.id}: wage ${j.wage} != jobs.json ${row.wage}`);
      if (+row.openings !== +j.openings) add(g, 'fail', 'create.html', null,
        `${j.id}: openings ${j.openings} != jobs.json ${row.openings}`);
      if (!(j.pay === 'weekly' || j.pay === 'biweekly')) add(g, 'fail', 'create.html', null, `${j.id}: bad pay cadence "${j.pay}"`);
    }
    if (seek !== 1 || DJOBS[DJOBS.length - 1].id !== 'seeking')
      add(g, 'fail', 'create.html', null, '"seeking" must appear exactly once, last on the board');
    /* filled rows must stay unselectable (rendered with .dis) */
    if (!/foldFilled|filledBox/.test(html))
      add(g, 'fail', 'create.html', null, 'filled-posts fold absent — board must show filled rows');
    /* HOMES mirror */
    const hm = /var HOMES = (\[[\s\S]*?\]);/.exec(html);
    const DHOMES = hm ? eval(hm[1]) : [];
    const liveAddrs = new Set(HJ.listings_live.map(l => l.address));
    const ladderAddrs = new Set(HJ.listings_ladder.map(l => l.address.replace(' (room)', '')));
    for (const h2 of DHOMES) {
      const a = h2.address.replace(' (room)', '');
      if (!liveAddrs.has(a) && !ladderAddrs.has(a))
        add(g, 'fail', 'create.html', null, `demo home "${h2.address}" not in housing.json listings`);
      const live = HJ.listings_live.find(l => l.address === a);
      const lad = HJ.listings_ladder.find(l => l.address.replace(' (room)', '') === a);
      const rent = (live || lad || {}).rent;
      if (rent != null && +rent !== +h2.rent)
        add(g, 'fail', 'create.html', null, `${h2.id}: rent ${h2.rent} != housing.json ${rent}`);
    }
    /* LOOK pickers == record_schema.look */
    const lm = /var LOOK = (\{[\s\S]*?\});/.exec(html);
    const DLOOK = lm ? eval('(' + lm[1] + ')') : {};
    const SL = CJ.record_schema.look;
    if (JSON.stringify(DLOOK.build) !== JSON.stringify(SL.build))
      add(g, 'fail', 'create.html', null, 'look.build drifted from record_schema');
    if (JSON.stringify((DLOOK.palette || []).map(p => p.n.trim())) !== JSON.stringify(SL.palette))
      add(g, 'fail', 'create.html', null, 'look.palette drifted from record_schema');
    if (JSON.stringify(DLOOK.signature) !== JSON.stringify(SL.signature))
      add(g, 'fail', 'create.html', null, 'look.signature drifted from record_schema');
    /* draft key + deposit rule agreement */
    const dk = (CJ.draft.storage.match(/rw_create_draft_v\d+/) || [])[0];
    if (!dk || !html.includes(dk)) add(g, 'fail', 'create.html', null, `draft key "${dk}" not in page`);
    if (!/depFor/.test(html) || !/0\.5/.test(html))
      add(g, 'fail', 'create.html', null, 'deposit rule (1× flat / 0.5× room share) not implemented');
    const roomRow = DHOMES.find(h2 => h2.room);
    if (!roomRow) add(g, 'fail', 'create.html', null, 'no room-share home flagged for the 0.5× deposit rule');
    /* honesty strings the surface MUST carry */
    const MUST = [
      [/charged on approval/i, 'bill-on-approval wording'],
      [/denied applications never bill/i, 'deny-never-bills promise'],
      [/available on the block/, 'name-check ok copy'],
      [/taken — the block already has one/, 'name-check taken copy'],
      [/first month \+ deposit/, 'move-in math copy'],
      [/payment plan/, 'deposit-shortfall honesty'],
      [/stated plan, not a waived one/, 'no-waived-deposit honesty'],
      [/out of reach on that income/, '55% ceiling state'],
      [/not a script/, 'emergence honesty'],
      [/18 minimum/, 'adults-only line'],
      [/different reviewer/, 'resubmit routing'],
      [/unpossessable/i, 'possession-ban line'],
      [/thin AI/, 'thin-AI honesty'],
      [/pays weekly — Friday, end of day/, 'weekly payday copy'],
      [/every other Friday/, 'biweekly payday copy'],
      [/word of mouth — never a posted card/, 'wom channel label'],
      [/always hiring/, 'churn-gig label'],
      [/filled/, 'filled-state label'],
      [/demo board|live board/, 'source badge'],
      [/screen\.js/, 'shared engine script tag'],
      [/RWScreen\.screenRequest/, 'shared engine call'],
      [/gsJobBoard/, 'live seam: job board'],
      [/gsHireNameCheck/, 'live seam: name check'],
      [/gsHireQuote/, 'live seam: quote'],
      [/gsHireSlots/, 'live seam: slots'],
      [/TAKEN/, 'local name registry']
    ];
    for (const [re, label] of MUST)
      if (!re.test(html)) add(g, 'fail', 'create.html', null, `missing required copy/seam: ${label}`);
    /* briefing whitelist — only profile/relationships/routine rendered */
    for (const k of CJ.briefing_whitelist)
      if (!new RegExp(k.replace(/ /g, '\\s*'), 'i').test(html))
        add(g, 'fail', 'create.html', null, `briefing whitelist line "${k}" absent`);
    /* feed vocabulary: the page's request-feed lines use request-action
       names + public wire kinds only — nothing invented */
    const feedKinds = new Set(FJ.event_kinds.filter((v, i) => i % 2 === 0)
      .concat(['hire', 'possess', 'nudge', 'event', 'queued']));
    for (const m of html.matchAll(/feedAdd\('you','(\w+) —/g))
      if (!feedKinds.has(m[1])) add(g, 'fail', 'create.html', null, `feed kind "${m[1]}" outside request-feed vocabulary`);
    /* read-only seam: no world-mutation call may appear on the page.
       gsJobBoard/gsHireNameCheck/gsHireQuote/gsHireSlots are reads; the
       submit pipeline is simulated locally — never a real endpoint. */
    html.split('\n').forEach((ln, i) => {
      if (/\bXMLHttpRequest\b|\bfetch\(|\.post\(|gsRequest(Submit|Approve|Deny|Resolve)|gsHire(Submit|Activate|Allow)|gsHiredTakeJob|gsApplyForLease|gsSignLease/i.test(ln))
        add(g, 'fail', 'create.html', i + 1, `world-mutation call on the creation surface: ${ln.trim().slice(0, 100)}`);
    });
    g.detail = `${DJOBS.length} board rows (${DJOBS.filter(j=>j.openings===0).length} filled) · ` +
      `${DHOMES.length} homes · schema v${CJ.version} · draft ${dk}`;
  } catch (e) { add(g, 'fail', 'creation.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G21 mod ============ */
{
  const g = gate('mod', 'moderation tooling (taxonomy agreement, corpus↔lab mirror, console whitelist, v36 affordances)');
  try {
    const MJ = JSONF('moderation.json');
    const window = {};
    eval(rd('screen.js'));
    const RS = window.RWScreen;
    /* 1. taxonomy agreement: every moderation.json code exists in the engine
          and vice versa (minus 'pass') */
    const mjCodes = new Set(
      MJ.reason_codes.deny_tier.concat(MJ.reason_codes.review_tier).map(c => c.code));
    const engCodes = new Set(Object.keys(RS.REASON_CODES).filter(k => k !== 'pass'));
    for (const c of mjCodes) if (!engCodes.has(c))
      add(g, 'fail', 'screen.js', null, `moderation.json code "${c}" missing from REASON_CODES`);
    for (const c of engCodes) if (!mjCodes.has(c))
      add(g, 'fail', 'moderation.json', null, `engine code "${c}" missing from the taxonomy`);
    /* flag_w agreement per code */
    for (const c of MJ.reason_codes.deny_tier.concat(MJ.reason_codes.review_tier))
      if (engCodes.has(c.code) && RS.REASON_CODES[c.code].flag_w !== c.flag_w)
        add(g, 'fail', 'moderation.json', null, `${c.code}: flag_w ${c.flag_w} != engine ${RS.REASON_CODES[c.code].flag_w}`);
    /* 2. corpus ↔ lab content mirror (the old hand-sync drift hole) */
    const lab = rd('screen-lab.html');
    const cm = /var CORPUS = (\[[\s\S]*?\]);/.exec(lab);
    if (!cm) add(g, 'fail', 'screen-lab.html', null, 'inline CORPUS block not found');
    const LC = cm ? JSON.parse(cm[1]) : [];
    const JC = JSONF('screen-corpus.json').cases;
    if (LC.length !== JC.length)
      add(g, 'fail', 'screen-lab.html', null, `inline corpus ${LC.length} cases != json ${JC.length}`);
    const jBy = Object.fromEntries(JC.map(c => [c.id, c]));
    for (const c of LC) {
      const j = jBy[c.id];
      if (!j) { add(g, 'fail', 'screen-lab.html', null, `inline case ${c.id} absent from screen-corpus.json`); continue; }
      if (JSON.stringify(c.in) !== JSON.stringify(j.in) || JSON.stringify(c.expect) !== JSON.stringify(j.expect))
        add(g, 'fail', 'screen-lab.html', null, `case ${c.id} content drifted between lab and json`);
    }
    /* 3. engine version agreement */
    if (RS.VERSION !== 'v36' || !(MJ.testing.engine_version || '').includes('v36'))
      add(g, 'fail', 'screen.js', null, `engine version drift: screen.js ${RS.VERSION} vs moderation.json "${MJ.testing.engine_version}"`);
    /* 4. mod-console: honesty strings + CHARS whitelist + v36 affordances */
    const mc = rd('mod-console.html');
    const MUST = [
      [/request not approved/i, 'neutral deny wording'],
      [/Not redacted — absent|not redacted — absent/i, 'whitelist absent-not-redacted note'],
      [/must not be them|different reviewer/i, 'different-reviewer appeal copy'],
      [/aggregate only/i, 'shift-report aggregate-only rule'],
      [/flag_score/, 'flag ledger fields'],
      [/bumpFlag/, 'flag ledger mechanism'],
      [/shiftStats/, 'shift report mechanism'],
      [/obfuscation-attempt/, 'v36 code present in seeds/copy'],
      [/screen\.js/, 'shared engine script tag'],
      [/RWScreen\.screenRequest/, 'shared engine call']
    ];
    for (const [re, label] of MUST)
      if (!re.test(mc)) add(g, 'fail', 'mod-console.html', null, `missing required copy/affordance: ${label}`);
    const chm = /var CHARS = (\{[\s\S]*?\n\});/.exec(mc);
    if (!chm) add(g, 'fail', 'mod-console.html', null, 'CHARS block not found');
    const CHARS = chm ? eval('(' + chm[1].replace(/;$/, '') + ')') : {};
    const WL = new Set(['name', 'age', 'job', 'home', 'profile', 'surface', 'routine']);
    for (const [id, ch] of Object.entries(CHARS))
      for (const k of Object.keys(ch))
        if (!WL.has(k)) add(g, 'fail', 'mod-console.html', null,
          `CHARS.${id}.${k} outside the reviewer whitelist (${[...WL].join('/')}) — secrets must be absent, not renamed`);
    /* 5. screen-lab v36 affordances */
    const LMUST = [
      [/Reviewer calibration/, 'calibration section'],
      [/startCal/, 'calibration run'],
      [/id="calC"/, 'verdict+code inputs'],
      [/scorecard|agreement/i, 'agreement scoring copy'],
      [/show normalized input|normalized:/, 'normalized-input view intact']
    ];
    for (const [re, label] of LMUST)
      if (!re.test(lab)) add(g, 'fail', 'screen-lab.html', null, `missing required affordance: ${label}`);
    /* 6. internal surfaces make no world-mutation calls */
    for (const [f, src] of [['mod-console.html', mc], ['screen-lab.html', lab]])
      src.split('\n').forEach((ln, i) => {
        if (/\bXMLHttpRequest\b|\bfetch\(|\.post\(|gsRequest[A-Z]|gsPossess|gsAdmin|gsHire(Submit|Activate)/i.test(ln))
          add(g, 'fail', f, i + 1, `world-mutation call on an internal surface: ${ln.trim().slice(0, 100)}`);
      });
    g.detail = `${mjCodes.size} taxonomy codes · ${LC.length} mirrored cases · ` +
      `engine ${RS.VERSION} · ${Object.keys(CHARS).length} whitelist cards`;
  } catch (e) { add(g, 'fail', 'moderation.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G22 harness ============ */
{
  const g = gate('harness', 'playtest harness self-contract (v37 marks, LS/build agreement, scenario integrity, surface coverage)');
  try {
    const html = rd('playtest.html');
    const H = PT.harness_ui_v37 || {};
    /* 1. storage key + build tag agreement */
    if (H.storage_key && !html.includes(`"${H.storage_key}"`))
      add(g, 'fail', 'playtest.html', null, `storage key "${H.storage_key}" not found in the harness`);
    const lsM = html.match(/const LS="rw_playtest_v(\d+)"/);
    if (!lsM) add(g, 'fail', 'playtest.html', null, 'const LS key not found');
    else if (+lsM[1] !== PT.version)
      add(g, 'fail', 'playtest.html', null, `LS v${lsM[1]} != playtest.json version ${PT.version}`);
    if (H.build_tag_prefix && !html.includes(`"${H.build_tag_prefix}"`))
      add(g, 'fail', 'playtest.html', null, `build tag "${H.build_tag_prefix}" not found (report build)`);
    /* 2. required affordance marks */
    for (const m of H.required_marks || [])
      if (!html.includes(m))
        add(g, 'fail', 'playtest.html', null, `required v37 mark missing: ${m}`);
    /* 3. scenario integrity: unique PT ids, declared surfaces, ≥1 ck/step */
    const ids = new Set();
    const touched = new Set();
    let ckTotal = 0;
    for (const s of PT.scenarios) {
      if (!/^PT\d+$/.test(s.id)) add(g, 'fail', 'playtest.json', null, `scenario id "${s.id}" off the PT# pattern`);
      if (ids.has(s.id)) add(g, 'fail', 'playtest.json', null, `duplicate scenario id ${s.id}`);
      ids.add(s.id);
      if (!s.minutes || s.minutes <= 0) add(g, 'fail', 'playtest.json', null, `${s.id}: no minutes estimate`);
      if (!s.steps.length) add(g, 'fail', 'playtest.json', null, `${s.id}: zero steps`);
      s.steps.forEach((st, i) => {
        if (!st.checkpoints.length) add(g, 'fail', 'playtest.json', null, `${s.id} step ${i + 1}: zero checkpoints`);
        st.checkpoints.forEach((c, ci) => {
          ckTotal++;
          if (!c.trim()) add(g, 'fail', 'playtest.json', null, `${s.id} step ${i + 1} ck ${ci + 1}: empty checkpoint`);
        });
      });
      for (const sf of s.surfaces) {
        if (!PT.surfaces[sf]) add(g, 'fail', 'playtest.json', null, `${s.id}: undeclared surface "${sf}"`);
        else touched.add(sf);
      }
    }
    /* 4. every declared surface is touched by ≥1 scenario (untested = finding) */
    for (const k of Object.keys(PT.surfaces))
      if (!touched.has(k)) add(g, 'fail', 'playtest.json', null,
        `surface "${k}" is declared but no scenario touches it — untested by definition`);
    /* 5. finding-surface dropdown ⊆ declared surfaces */
    const dm = html.match(/<select id="fSurf"[^>]*>([\s\S]*?)<\/select>/);
    if (!dm) add(g, 'fail', 'playtest.html', null, 'fSurf dropdown not found');
    else for (const om of dm[1].matchAll(/<option>([^<]+)<\/option>/g))
      if (!PT.surfaces[om[1]]) add(g, 'fail', 'playtest.html', null,
        `fSurf option "${om[1]}" not a declared surface — findings would cite a phantom`);
    g.detail = `${ids.size} scenarios · ${ckTotal} checkpoints · ` +
      `${touched.size}/${Object.keys(PT.surfaces).length} surfaces touched · key ${H.storage_key}`;
  } catch (e) { add(g, 'fail', 'playtest.html', null, 'harness gate failure: ' + e.message); }
}

/* ---------- report ---------- */
for (const g of out.gates) {
  if (g.status === 'fail') out.fails++;
  else if (g.status === 'review') out.reviews++;
  else out.passes++;
}
out.build = 'world v37 local';
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
