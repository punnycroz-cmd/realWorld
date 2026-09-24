#!/usr/bin/env node
/* world/audit.js — RW boundary audit (world v63).

   Turns the playtest harness's manual consistency sweep (PT7) into an
   executable gate. Run:

       node world/audit.js            human-readable report
       node world/audit.js --json     machine report (attach to commits)

   Exit code: 1 if any gate FAILs, 0 otherwise. REVIEW hits are listed for
   a human to eyeball — they are contexts a regex can't adjudicate
   (e.g. a doc that legitimately cites the parody mapping), not verdicts.

   Gates:
     corpus    — screen.js run against screen-corpus.json (94/94 contract)
     names     — no real SF business names outside mapping contexts
     addresses — residential streets carry 9xxx numbers only
     prices    — credit amounts/rates match the monetization PROPOSAL set;
                 in-world surfaces carry zero credit figures
     copy      — banned feed/deny phrasing never appears player-facing
     internal  — internal-tier surfaces carry an internal/never-ship marker
     mirror    — playtest.html inline data == playtest.json (hand-sync gate)
     coverage  — every declared surface file exists; no orphan demos
     drama     — drama.json structural invariants (state enum, fuse ids,
                 knowledge-matrix disjointness); v38 blocks checked:
                 state_evidence transitions, drift_review write fence,
                 teller biases resolve to real ambients (minors
                 minor_safe), stall policy, aftermath arcs cover all
                 fuses, pressure rows carry producer+shadow+exhaustion,
                 drama.html mirror agreement; seed vocabulary never
                 leaks into spectator contracts; drama files never public
     onboard   — onboarding.json ↔ onboarding.html agreement; honesty
                 strings present; dark-pattern vocabulary absent
     lease     — leases.json ↔ lease.html agreement; licensed-landlord
                 caps (file-only eviction); neutral feed wording only
     thinai    — thinai.json ↔ thinai.html agreement; locked feed
                 vocabulary only on the wire; handoff note forbidden
                 fields absent by construction; mode-allowance matrix
     bible     — characters/*.md carry the fixed 25-section order with
                 SECRETS last; characters.json mirrors roleplay/briefing
                 fields + v28 backstory/room/strangers + v42 wants/
                 interior/truth + v84 listening/day_off/repairs;
                 cast.html CAST ids and card fields agree
    crowd     — crowd.json ↔ crowd.html mirror (zones, budgets, shades,
                flows, micros, greets, scenes, v43 resources + AMB/AMBX
                roster); extras carry no identity; minors greet in packs;
                overnight allow_deserted protected; ambients.json v43
                variant contract (signature/week/weather/personal)
    biz       — businesses.json ↔ directory.html mirror (BIZ/WEB blocks);
                cards exist and none orphaned; tier/affordance/hours/staff
                sanity; web edges resolve to real venues, loan edges are
                secret-flagged, reserved entries stay empty; v44 storefront
                layer: storefronts.json ↔ storefront.html STO mirror,
                doors-only coverage (anchor+street), when-key legality
    regs      — regulars.json ↔ regulars.html REG mirror; every door venue
                has ≥1 regular, offstage/reserved carry none; regulars are
                never own-venue staff; name_basis ⊆ staff; windows overlap
                posted hours; house_knows stays on the surface bar
    market    — market.json ↔ market.html deep mirror; every churn row
                resolves to a live jobs.json opening; channels declared;
                ladders resolve to real employers; vacancy/move-in tiers
                and rents match housing.json ladder; no credit figures
    request   — requests.json ↔ request.html mirror; pack ladder + rates +
                ad caps verbatim from the plan PROPOSAL; appeal rules honor
                the not-appealable list; co-sponsor is same-price compatible;
                v46: approve-modified offer (trim-only, decline = full refund),
                honest upfront charge, queue hold clock + expiry, scheduled
                events fire, hire routes to create.html, demo hooks;
                dark-pattern vocabulary absent; v60: live seam
                (__aiBridge detect, capability-guarded gsRequestSubmit),
                pre-flight check (free, never a gate), receipt drawer
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
                call on the surface; draft key + deny codes agree; v49
                people layer: PEOPLE rows re-verified against
                characters.json/ambients.json (w tokens → job/venue,
                b → cast home, owns → landlord field), TAKEN_NAMES ⊆
                TAKEN regex, landing pick + registry entry + roster-full
                honesty present
    mod       — moderation tooling: taxonomy agreement between
                moderation.json and screen.js REASON_CODES; corpus↔lab
                content mirror case-for-case; console CHARS whitelist;
                flag-ledger/shift-report/calibration affordances; no
                mutation calls on internal surfaces
    griev     — grievances.json ↔ grievance.html GRJ mirror; every jobs.json
                employer + housing.json building covered exactly once; venue/
                org/building refs resolve; live_rungs ⊆ 1–5; archetypes ⊆
                catalogs; ear cast ids valid; surface-bar sweep on all
                descriptive fields
    harness   — playtest harness self-contract: storage key + build tag
                agree with playtest.json; required affordance marks
                present; scenario integrity (unique PT ids, declared
                surfaces, ≥1 checkpoint per step, every surface touched);
                finding-surface dropdown ⊆ declared surfaces
    apply     — applications.json ↔ apply.html deep mirror (APPS eval'd);
                every job_app covers a live jobs.json opening (bidirectional)
                and its channel agrees with the market.json churn row;
                housing keys ⊆ live unit_ids ∪ ladder tiers; no credit
                figures; decline wording present; unpaid trials flagged

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
    'shifts.json', 'budgets.json', 'storefronts.json', 'storefront.html',
    'applications.json', 'apply.html', 'grievances.json', 'grievance.html',
    'exits.json', 'exit.html']);
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
    /* ---- v38+ blocks (schema drama-v3 or later) ---- */
    if (/^drama-v[3-9]\d*$/.test(D.schema_version || '')) {
      /* state_evidence: exactly the four transitions, each with both lists */
      const EV = D.state_evidence || {};
      for (const t of ['dormant_to_pressured', 'pressured_to_surfaced',
                       'surfaced_to_resolved', 'resolved_to_residue']) {
        const e = EV[t];
        if (!e || !(e.qualifying || []).length || !(e.not_evidence || []).length)
          add(g, 'fail', 'drama.json', null, `state_evidence.${t} missing or incomplete`);
      }
      for (const k of Object.keys(EV))
        if (k !== 'doc' && !/^(dormant_to_pressured|pressured_to_surfaced|surfaced_to_resolved|resolved_to_residue)$/.test(k))
          add(g, 'review', 'drama.json', null, `state_evidence: unexpected key "${k}"`);
      /* drift review: steps + write boundaries */
      const DR = D.drift_review || {};
      if (!(DR.steps || []).length) add(g, 'fail', 'drama.json', null, 'drift_review.steps empty');
      if (!(DR.never_writes || []).some(w => /world state|ledger|interiors/i.test(w)))
        add(g, 'fail', 'drama.json', null, 'drift_review.never_writes must fence off world state');
      /* hires live outside the seed architecture */
      if (!((D.hire_rules || {}).rules || []).length)
        add(g, 'fail', 'drama.json', null, 'hire_rules.rules empty');
      /* teller biases: real ambient ids; minors carry minor_safe */
      const AMB = new Set(JSONF('ambients.json').ambients.map(a => a.id));
      for (const t of D.teller_biases || []) {
        if (!AMB.has(t.id)) add(g, 'fail', 'drama.json', null, `teller_biases: "${t.id}" is not a registered ambient`);
        if (!t.bias || !t.never) add(g, 'fail', 'drama.json', null, `teller_biases ${t.id}: bias/never missing`);
        if (['A04', 'A20'].includes(t.id) && t.minor_safe !== true)
          add(g, 'fail', 'drama.json', null, `teller_biases ${t.id}: minor teller without minor_safe:true`);
      }
      /* stall policy must exist — waiting is the job */
      const SP = D.stall_policy || {};
      for (const k of ['definition', 'correct_response', 'never', 'season_boundary'])
        if (!SP[k]) add(g, 'fail', 'drama.json', null, `stall_policy.${k} missing`);
      /* aftermath arcs cover every fuse exactly once */
      const arcFuses = (D.aftermath_arcs || []).map(a => a.fuse).sort();
      if (JSON.stringify(arcFuses) !== JSON.stringify([...fuses].sort()))
        add(g, 'fail', 'drama.json', null, `aftermath_arcs fuses [${arcFuses}] != fuse_ids [${[...fuses].sort()}]`);
      /* note grammar + legality checklist shape */
      if (((D.note_grammar || {}).legal_forms || []).length !== 4)
        add(g, 'fail', 'drama.json', null, 'note_grammar.legal_forms must be exactly the four legal forms');
      if ((D.note_legality_checklist || []).length !== 6)
        add(g, 'fail', 'drama.json', null, 'note_legality_checklist must keep its six questions');
      /* pressure rows need producer + shadow + exhaustion (§30 rule) */
      const seenP = new Set();
      for (const p of D.pressure_catalog || []) {
        if (!/^P-\d+$/.test(p.id)) add(g, 'fail', 'drama.json', null, `pressure id "${p.id}" off-format`);
        if (seenP.has(p.id)) add(g, 'fail', 'drama.json', null, `duplicate pressure id ${p.id}`);
        seenP.add(p.id);
        for (const k of ['produced_by', 'legible_shadow', 'exhaustion'])
          if (!p[k]) add(g, 'fail', 'drama.json', null, `${p.id}: missing ${k} — a row without all three is a wish, not a pressure`);
      }
      /* request absorption rows must carry the watch field */
      for (const r of D.request_absorption || [])
        if (!r.watch) add(g, 'fail', 'drama.json', null, `request_absorption "${r.request_class}": missing watch`);
      /* v52: every seed carries a three-rung tell ladder (§28) */
      for (const s of D.seeds || []) {
        const TL = s.tell_ladder || {};
        for (const rung of ['whisper', 'pressure', 'brink'])
          if (!(TL[rung] || []).length)
            add(g, 'fail', 'drama.json', null, `${s.id}.tell_ladder.${rung} missing or empty — a rung without shadows is a leak risk, not a ceiling`);
      }
      const TLR = D.tell_ladder_rules || {};
      if (!TLR.rungs || !TLR.rungs.whisper || !TLR.rungs.pressure || !TLR.rungs.brink)
        add(g, 'fail', 'drama.json', null, 'tell_ladder_rules.rungs must define whisper/pressure/brink');
      if (!(TLR.rules || []).some(r => /never contains the fact|tops out/i.test(r)))
        add(g, 'fail', 'drama.json', null, 'tell_ladder_rules must fence the brink rung off the fact itself');
      /* v52: venue dramaturgy rows need venue + fuses + shadows + never (§29) */
      const seenV = new Set();
      for (const v of D.venue_dramaturgy || []) {
        if (!v.venue || seenV.has(v.venue)) add(g, 'fail', 'drama.json', null, `venue_dramaturgy: missing/duplicate venue "${v.venue}"`);
        seenV.add(v.venue);
        for (const k of ['shadows_land', 'never'])
          if (!v[k]) add(g, 'fail', 'drama.json', null, `venue "${v.venue}": missing ${k}`);
        for (const f of v.fuses || [])
          if (!fuses.has(f) && f !== 'all') add(g, 'fail', 'drama.json', null, `venue "${v.venue}": unknown fuse "${f}"`);
      }
      if (!seenV.size) add(g, 'fail', 'drama.json', null, 'venue_dramaturgy empty');
      /* drama.html mirror: new sections render, row counts agree */
      const H = rd('drama.html');
      for (const id of ['evid', 'drift', 'hires', 'tellers', 'stall', 'ladders', 'venues'])
        if (!H.includes(`id="${id}"`)) add(g, 'fail', 'drama.html', null, `missing #${id} section`);
      const grab = n => { const m = H.match(new RegExp('const ' + n + '=(\\[[\\s\\S]*?\\]);'));
                          return m ? eval(m[1]) : null; };
      const TL = grab('TELLERS'), HI = grab('HIRES'), DRF = grab('DRIFT'),
            EVI = grab('EVID'), STL = grab('STALL'), LAD = grab('LADDERS'),
            VEN = grab('VENUES');
      /* teller rows may combine pairs (Esther+Ray) — every json id must appear */
      if (!TL) add(g, 'fail', 'drama.html', null, 'TELLERS block not found');
      else {
        const names = TL.map(r => r[0]).join(' ');
        for (const t of D.teller_biases || [])
          if (!names.includes(t.id)) add(g, 'fail', 'drama.html', null, `TELLERS missing ${t.id}`);
      }
      if (!HI || HI.length !== ((D.hire_rules || {}).rules || []).length)
        add(g, 'fail', 'drama.html', null, 'HIRES count != hire_rules.rules');
      if (!DRF || DRF.length !== (DR.steps || []).length)
        add(g, 'fail', 'drama.html', null, 'DRIFT count != drift_review.steps');
      if (!EVI || EVI.length !== 4) add(g, 'fail', 'drama.html', null, 'EVID must mirror the four transitions');
      if (!STL || STL.length < 3) add(g, 'fail', 'drama.html', null, 'STALL missing stall/boundary rows');
      if (!LAD || LAD.length !== (D.seeds || []).length)
        add(g, 'fail', 'drama.html', null, 'LADDERS count != seeds — every seed mirrors its tell ladder');
      else for (const l of LAD)
        if (!l.w || !l.p || !l.b) add(g, 'fail', 'drama.html', null, `LADDERS ${l.id}: whisper/pressure/brink field empty`);
      if (!VEN || VEN.length !== (D.venue_dramaturgy || []).length)
        add(g, 'fail', 'drama.html', null, 'VENUES count != venue_dramaturgy rows');
      /* ---- v66+ blocks (schema drama-v4 or later) ---- */
      if (/^drama-v[4-9]\d*$/.test(D.schema_version || '')) {
        /* fuse_interference: all C(6,2)=15 pairs exactly once, relation in enum */
        const FI = D.fuse_interference || {};
        const RELS = new Set(FI.relations || []);
        for (const r of ['interlocked', 'adjacent', 'independent', 'masked'])
          if (!RELS.has(r)) add(g, 'fail', 'drama.json', null, `fuse_interference.relations missing "${r}"`);
        const seenP2 = new Set();
        for (const e of FI.pairs || []) {
          const key = (e.pair || []).slice().sort().join('·');
          if ((e.pair || []).length !== 2 || e.pair.some(f => !fuses.has(f)))
            add(g, 'fail', 'drama.json', null, `fuse_interference pair "${key}": must be two known fuse ids`);
          if (seenP2.has(key)) add(g, 'fail', 'drama.json', null, `fuse_interference: duplicate pair ${key}`);
          seenP2.add(key);
          if (!RELS.has(e.relation)) add(g, 'fail', 'drama.json', null, `fuse_interference ${key}: relation "${e.relation}" not in enum`);
          if (!e.note) add(g, 'fail', 'drama.json', null, `fuse_interference ${key}: missing note`);
        }
        const NPAIR = fuses.size * (fuses.size - 1) / 2;
        if (seenP2.size !== NPAIR)
          add(g, 'fail', 'drama.json', null, `fuse_interference covers ${seenP2.size}/${NPAIR} fuse pairs — every pair needs exactly one relation`);
        /* suspicion_calibration: every seed gets all three rung ceilings */
        const SC = (D.suspicion_calibration || {}).per_seed || {};
        for (const s of D.seeds || []) {
          const c = SC[s.id] || {};
          for (const rung of ['whisper', 'pressure', 'brink'])
            if (!c[rung]) add(g, 'fail', 'drama.json', null, `suspicion_calibration.${s.id}.${rung} missing — an uncalibrated rung is an unbounded leak`);
        }
        /* comedy_duty: every fuse carries carriers + never */
        const CD = (D.comedy_duty || {}).per_fuse || {};
        for (const f of fuses) {
          const c = CD[f] || {};
          if (!c.carriers || !c.never)
            add(g, 'fail', 'drama.json', null, `comedy_duty.${f}: carriers/never missing`);
        }
        if (!(D.comedy_duty || {}).drought_flag)
          add(g, 'fail', 'drama.json', null, 'comedy_duty.drought_flag missing — the drought flag is the only knob comedy gets');
        /* residue_nursery: rules + candidates with valid parent fuses */
        const RN = D.residue_nursery || {};
        if (!(RN.rules || []).length) add(g, 'fail', 'drama.json', null, 'residue_nursery.rules empty');
        for (const n of RN.candidates || []) {
          if (!fuses.has(n.from_fuse)) add(g, 'fail', 'drama.json', null, `nursery ${n.id}: from_fuse "${n.from_fuse}" not a fuse`);
          if (!n.tendency || !n.needs) add(g, 'fail', 'drama.json', null, `nursery ${n.id}: tendency/needs missing`);
        }
        /* drift review must carry the comedy-texture step */
        if (!(DR.steps || []).some(s => /comedy/i.test(s)))
          add(g, 'fail', 'drama.json', null, 'drift_review.steps missing the comedy_drought check (§33)');
        /* drama.html mirror: new sections render, row counts agree */
        for (const id of ['interf', 'susp', 'comedy', 'nursery'])
          if (!H.includes(`id="${id}"`)) add(g, 'fail', 'drama.html', null, `missing #${id} section`);
        const ITF = grab('INTERF'), SSP = grab('SUSP'), CMD = grab('COMEDY'), NUR = grab('NURSERY');
        if (!ITF || ITF.length !== (FI.pairs || []).length)
          add(g, 'fail', 'drama.html', null, 'INTERF count != fuse_interference.pairs');
        else for (const r of ITF)
          if (!RELS.has(r[1])) add(g, 'fail', 'drama.html', null, `INTERF ${r[0]}: relation "${r[1]}" off-enum`);
        if (!SSP || SSP.length !== (D.seeds || []).length)
          add(g, 'fail', 'drama.html', null, 'SUSP count != seeds — every seed mirrors its ceilings');
        if (!CMD || CMD.length !== fuses.size)
          add(g, 'fail', 'drama.html', null, 'COMEDY count != fuses');
        if (!NUR || NUR.length !== (RN.candidates || []).length)
          add(g, 'fail', 'drama.html', null, 'NURSERY count != residue_nursery.candidates');
      }
      /* ---- v80 blocks (schema drama-v5 or later) ---- */
      if (/^drama-v[5-9]\d*$/.test(D.schema_version || '')) {
        /* daypart_dramaturgy: rows need daypart + shadows + never; fuse refs valid */
        const DP = D.daypart_dramaturgy || {};
        const seenD = new Set();
        for (const r of DP.rows || []) {
          if (!r.daypart || seenD.has(r.daypart)) add(g, 'fail', 'drama.json', null, `daypart_dramaturgy: missing/duplicate daypart "${r.daypart}"`);
          seenD.add(r.daypart);
          for (const k of ['shadows', 'never'])
            if (!r[k]) add(g, 'fail', 'drama.json', null, `daypart "${r.daypart}": missing ${k}`);
          for (const f of r.fuses || [])
            if (!fuses.has(f) && f !== 'all' && f !== 'none' && !/^S\d+$/.test(f))
              add(g, 'fail', 'drama.json', null, `daypart "${r.daypart}": unknown fuse/seed "${f}"`);
        }
        if (!seenD.size) add(g, 'fail', 'drama.json', null, 'daypart_dramaturgy.rows empty');
        /* offscreen_doctrine: rules must fence viewership out of pressure */
        const OD = D.offscreen_doctrine || {};
        if (!(OD.rules || []).length) add(g, 'fail', 'drama.json', null, 'offscreen_doctrine.rules empty');
        if (!(OD.rules || []).some(r => /audience size is not pressure|viewership|spectator count/i.test(r)))
          add(g, 'fail', 'drama.json', null, 'offscreen_doctrine must fence viewership out of pressure inputs');
        /* surface_aftercare: every fuse exactly once, texture + protected */
        const SA = (D.surface_aftercare || {}).per_fuse || {};
        for (const f of fuses) {
          const c = SA[f] || {};
          if (!c.window_texture || !c.protected)
            add(g, 'fail', 'drama.json', null, `surface_aftercare.${f}: window_texture/protected missing`);
        }
        if (!(D.surface_aftercare || {}).rules || !(D.surface_aftercare.rules || []).some(r => /spends nothing|spend ban/i.test(r)))
          add(g, 'fail', 'drama.json', null, 'surface_aftercare.rules must carry the spend ban (§38)');
        /* drama.html mirror: new sections render, row counts agree */
        for (const id of ['dayparts', 'offscreen', 'aftercare'])
          if (!H.includes(`id="${id}"`)) add(g, 'fail', 'drama.html', null, `missing #${id} section`);
        const DPT = grab('DAYPARTS'), OFF = grab('OFFSCREEN'), AFC = grab('AFTERCARE');
        if (!DPT || DPT.length !== (DP.rows || []).length)
          add(g, 'fail', 'drama.html', null, 'DAYPARTS count != daypart_dramaturgy.rows');
        if (!OFF || OFF.length !== (OD.rules || []).length)
          add(g, 'fail', 'drama.html', null, 'OFFSCREEN count != offscreen_doctrine.rules');
        if (!AFC || AFC.length !== fuses.size)
          add(g, 'fail', 'drama.html', null, 'AFTERCARE count != fuses');
      }
    }
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
    /* ---- v39 blocks ---- */
    if (OB.version >= 39) {
      /* declared stages must be reachable in the demo */
      for (const s of OB.stages || []) {
        const sid = s.id.split('_')[0]; // 'S4c_review' → 'S4c'
        if (!/^S\d/.test(sid)) continue; // affordance entries aren't navigable stages
        if (!html.includes(`'${sid}'`))
          add(g, 'fail', 'onboarding.html', null, `stage "${s.id}" (${sid}) not reachable in page source`);
      }
      /* the two systemic "no"s must be taught with real feed vocabulary */
      const MUST39 = [
        [/not approved/i, 'neutral review wording ("not approved")'],
        [/in review/i, 'human-review status shown on the feed'],
        [/player session ended/i, 'graceful-handoff feed wording'],
        [/refunded|refund/i, 'auto-refund honesty'],
        [/hired=1/, 'post-hire return deep link']
      ];
      for (const [re, label] of MUST39)
        if (!re.test(html)) add(g, 'fail', 'onboarding.html', null, `missing v39 honesty copy: ${label}`);
      /* onboarding must never surface denial reasons or appeal mechanics */
      if (/\bappeal\b/i.test(html))
        add(g, 'fail', 'onboarding.html', null, 'appeal affordance on the onboarding surface — appeals live in request.html');
      if (/reason code|denial reason/i.test(html))
        add(g, 'fail', 'onboarding.html', null, 'denial-reason copy on the onboarding surface');
      /* storage key must have rolled with the version */
      if (OB.storage_key === 'rw_onboard_v25')
        add(g, 'fail', 'onboarding.json', null, 'v39 schema still on the v25 storage key');
    }
    /* ---- v53 blocks: the time layer ---- */
    if (OB.version >= 53) {
      const MUST53 = [
        [/queued/, 'queued feed status rendered'],
        [/queued request expired before activation/i, 'locked queue-expiry feed line'],
        [/first-come first-served|FCFS/i, 'queue fairness rule stated'],
        [/archive/i, 'Archive catch-up taught (tour beat / watch path)'],
        [/24 h|24 hours/i, 'queue slot hold window stated']
      ];
      for (const [re, label] of MUST53)
        if (!re.test(html)) add(g, 'fail', 'onboarding.html', null, `missing v53 honesty copy: ${label}`);
      /* the queue must never read as a purchasable position */
      if (/position auction|skip the queue|jump the queue|queue priority for sale/i.test(html))
        add(g, 'fail', 'onboarding.html', null, 'queue-position-for-sale framing on the onboarding surface');
      /* thin-AI offline honesty must carry the no-nag clause */
      if (/thin|thinner but present/i.test(html) && !/miss you/i.test(html))
        add(g, 'fail', 'onboarding.html', null, 'offline thin-AI copy without the no-"miss you" clause');
      if (['rw_onboard_v25', 'rw_onboard_v39'].includes(OB.storage_key))
        add(g, 'fail', 'onboarding.json', null, 'v53 schema still on an old storage key');
    }
    /* ---- v67 blocks: the eligibility layer ---- */
    if (OB.version >= 67) {
      const MUST67 = [
        [/under 13/i, 'under-13 band offered'],
        [/13\u201317|13-17/i, 'teen band offered'],
        [/18 or older/i, 'adult band offered'],
        [/rather not say/i, 'declined band offered'],
        [/watching account/i, 'under-13 spectator-only wording'],
        [/2 cr/, 'rewarded-ad rate verbatim (2 cr/view)'],
        [/opt-in/i, 'ads opt-in placement stated'],
        [/never in the stream/i, 'ads never inside the sim view'],
        [/spending limits/i, 'under-18 spend-limit disclosure'],
        [/wrong band\? fix it/i, 'band correction affordance']
      ];
      for (const [re, label] of MUST67)
        if (!re.test(html)) add(g, 'fail', 'onboarding.html', null, `missing v67 honesty copy: ${label}`);
      /* the ads affordance must be structurally gated on the adult band —
         not rendered for teen/na/u13, and adView() re-checks the guard */
      if (!/S\.band===?['"]adult['"]/.test(html))
        add(g, 'fail', 'onboarding.html', null, 'rewarded-ads affordance not gated on the adult band');
      if (!/adViews\s*>=?\s*5/.test(html))
        add(g, 'fail', 'onboarding.html', null, 'ads daily cap (5) not enforced in adView');
      /* the band fronts paid stages only — it must never gate the free ones */
      if (!html.includes('normalizeStage'))
        add(g, 'fail', 'onboarding.html', null, 'stage normalizer missing — paid stages unguarded');
      for (const s of ['u13', 'teen', 'adult', 'na'])
        if (!new RegExp(`band\\(\\\\?['"]${s}\\\\?['"]\\)`).test(html))
          add(g, 'fail', 'onboarding.html', null, `age-band option '${s}' has no handler`);
      if (!OB.age_band || !OB.rewarded_ads)
        add(g, 'fail', 'onboarding.json', null, 'v67 contract blocks (age_band / rewarded_ads) missing');
      else {
        if (OB.rewarded_ads.rate_cr !== 2 || OB.rewarded_ads.daily_cap !== 5)
          add(g, 'fail', 'onboarding.json', null, 'rewarded_ads drifts from plan §2.7 (2 cr, 5/day)');
      }
      if (['rw_onboard_v25', 'rw_onboard_v39', 'rw_onboard_v53'].includes(OB.storage_key))
        add(g, 'fail', 'onboarding.json', null, 'v67 schema still on an old storage key');
    }
    /* ---- v81 blocks: the house & the other hands ---- */
    if (OB.version >= 81) {
      const MUST81 = [
        [/admin action/i, 'admin transparency on the feed ("admin action")'],
        [/compensat/i, 'automatic compensation on admin actions stated'],
        [/nobody's hand is invisible|nobody\u2019s hand is invisible/i, 'beat-8 house-visibility copy'],
        [/surge/i, 'surge multiplier disclosure'],
        [/before.{0,12}you pay/i, 'surge shown before payment, never after'],
        [/×1\.5.{0,10}×2\.5|1\.5.{0,10}2\.5/, 'surge range verbatim (×1.5–×2.5)'],
        [/tenant.{0,30}owner.{0,30}landlord/i, 'ownership arc named at settle'],
        [/alongside/i, 'compatible coexistence taught'],
        [/deed fee/i, 'arc cost shape (game dollars + deed fee) stated']
      ];
      for (const [re, label] of MUST81)
        if (!re.test(html)) add(g, 'fail', 'onboarding.html', null, `missing v81 honesty copy: ${label}`);
      /* the admin beat needs a real anchor element */
      if (!/feed-admin/.test(html))
        add(g, 'fail', 'onboarding.html', null, 'feed-admin anchor missing — beat 8 has nothing to point at');
      /* S4f reachable + the scripted co-ask exists and is idempotent */
      if (!html.includes("'S4f'"))
        add(g, 'fail', 'onboarding.html', null, 'S4f stage not reachable in page source');
      if (!/window\.coAsk/.test(html) || !/S\.coask/.test(html))
        add(g, 'fail', 'onboarding.html', null, 'co-ask demo affordance missing or not state-guarded');
      /* surge must never read as a post-payment surprise or a specific invented figure */
      if (/surge.{0,40}(added|charged) (after|at checkout)/i.test(html))
        add(g, 'fail', 'onboarding.html', null, 'surge framed as post-payment — disclosure must be upfront');
      /* coexistence must never read as contention-for-sale */
      if (/outbid|buy.{0,10}(their|another player)/i.test(html))
        add(g, 'fail', 'onboarding.html', null, 'coexistence framed as contention you can buy out');
      /* contract blocks must exist in the mirror */
      for (const k of ['admin_beat', 'coask_lesson', 'surge_disclosure', 'ownership_arc'])
        if (!OB[k]) add(g, 'fail', 'onboarding.json', null, `v81 contract block '${k}' missing`);
      if (['rw_onboard_v25', 'rw_onboard_v39', 'rw_onboard_v53', 'rw_onboard_v67'].includes(OB.storage_key))
        add(g, 'fail', 'onboarding.json', null, 'v81 schema still on an old storage key');
    }
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
      'no-fault notice posted —', 'rent-board filing —', 'rent-board ruling —',
      'Unit turning over —', 'Sold —', 'admin action — tenancy ended at'];
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
    /* v40 additions — terms, move-in record, installment plans, frozen
       raises, no-fault path, sublets, file scars */
    if (LJ.version >= 40) {
      if (LJ.demo_seed.storage_key === 'rw_lease_v26')
        add(g, 'fail', 'leases.json', null, 'v40 schema still on the v26 storage key');
      for (const [re, label] of [
        [/month-to-month/i, 'lease term stated'],
        [/move-in record/i, 'move-in condition record surface'],
        [/pre-existing/i, 'move-in gate wording'],
        [/installment/i, 'installment plan mechanics'],
        [/relocation credit|NOFAULT/i, 'no-fault path'],
        [/sublet/i, 'sublet flow'],
        [/frozen/i, 'raise freeze on filing']
      ]) if (!re.test(html)) add(g, 'fail', 'lease.html', null, `v40 surface missing: ${label}`);
      if (!LJ.move_in_record || !LJ.sublets || !LJ.file_scars || !LJ.lease_terms)
        add(g, 'fail', 'leases.json', null, 'v40 blocks missing (move_in_record/sublets/file_scars/lease_terms)');
      if (!LJ.eviction.no_fault_path || LJ.eviction.no_fault_path.admin_only !== true)
        add(g, 'fail', 'leases.json', null, 'no-fault path must stay admin-only');
      if (LJ.eviction.no_fault_path && LJ.eviction.no_fault_path.distinct_ledger_code !== 'NOFAULT')
        add(g, 'fail', 'leases.json', null, 'no-fault ledger code drifted');
      /* licensed landlord must never reach no-fault */
      const nf = html.match(/window\.nofaultNotice=function[\s\S]*?^\};/m);
      if (!nf) add(g, 'fail', 'lease.html', null, 'nofaultNotice missing');
      else if (!/myUnit/.test(nf[0]))
        add(g, 'fail', 'lease.html', null, 'nofaultNotice lacks the own-unit guard');
    }
    /* v54 additions — the paper layer: proration, break fee, repair
       SLA clock, roommate amendments, 21-day deposit clock */
    if (LJ.version >= 54) {
      if (['rw_lease_v12', 'rw_lease_v26', 'rw_lease_v40'].includes(LJ.demo_seed.storage_key))
        add(g, 'fail', 'leases.json', null, 'v54+ schema on an old storage key');
      for (const [re, label] of [
        [/prorat/i, 'prorated first month'],
        [/break fee/i, 'fixed-term break fee'],
        [/habitability/i, 'habitability repair kind'],
        [/SLA breach/i, 'repair SLA breach line'],
        [/amendment/i, 'roommate amendment flow'],
        [/depPending|depDue/, 'deposit clock fields'],
        [/overdue/i, 'overdue deposit line']
      ]) if (!re.test(html)) add(g, 'fail', 'lease.html', null, `v54 surface missing: ${label}`);
      if (!LJ.screening.proration || !LJ.lease_terms.break_fee ||
          !LJ.deposits.return_clock || !LJ.amendments || !LJ.repairs.kinds)
        add(g, 'fail', 'leases.json', null, 'v54 blocks missing (proration/break_fee/return_clock/amendments/repairs.kinds)');
      /* licensed landlord may return deposits on own units only */
      const rd2 = html.match(/window\.returnDeposit=function[\s\S]*?^\};/m);
      if (!rd2) add(g, 'fail', 'lease.html', null, 'returnDeposit missing');
      else if (!/myUnit/.test(rd2[0]))
        add(g, 'fail', 'lease.html', null, 'returnDeposit lacks the own-unit guard');
    }
    /* v68 additions — the hand-off layer: guarantor path on near-miss
       screening, notice service records, move-out walkthrough, receipts */
    if (LJ.version >= 68) {
      const keyN = parseInt(((LJ.demo_seed.storage_key || '').match(/rw_lease_v(\d+)/) || [])[1] || '0', 10);
      if (keyN < 68)
        add(g, 'fail', 'leases.json', null, 'v68+ schema on an old storage key');
      for (const [re, label] of [
        [/guarantor/i, 'guarantor path'],
        [/near-miss|near_miss/i, 'near-miss screening band'],
        [/served|service/i, 'notice service record'],
        [/walkthrough/i, 'move-out walkthrough doc'],
        [/receipt/i, 'rent receipt']
      ]) if (!re.test(html)) add(g, 'fail', 'lease.html', null, `v68 surface missing: ${label}`);
      if (!LJ.screening.guarantor || !LJ.deposits.walkthrough || !LJ.receipts)
        add(g, 'fail', 'leases.json', null, 'v68 blocks missing (screening.guarantor/deposits.walkthrough/receipts)');
      const n2 = (LJ.notices || []).find(n => n.n === 2), n3 = (LJ.notices || []).find(n => n.n === 3);
      if (!n2 || !n2.service || !n3 || !n3.service)
        add(g, 'fail', 'leases.json', null, 'notices 2–3 lack service records');
      const ag = html.match(/window\.attachGuar=function[\s\S]*?^\};/m);
      if (!ag) add(g, 'fail', 'lease.html', null, 'attachGuar missing');
      else if (/wires\.push/.test(ag[0]))
        add(g, 'fail', 'lease.html', null, 'attachGuar posts to the feed — guarantors are never feed events');
      const sa = html.match(/window\.screenApp=function[\s\S]*?^\};/m);
      if (!sa || !/guar/.test(sa[0]))
        add(g, 'fail', 'lease.html', null, 'screenApp lacks the near-miss/guarantor branch');
    }
    /* v82 additions — the doorstep & the deed layer: entry notices,
       sale-with-tenant paper, renewal offers, returned payments,
       guarantor release */
    if (LJ.version >= 82) {
      if (LJ.demo_seed.storage_key !== 'rw_lease_v82')
        add(g, 'fail', 'leases.json', null, 'v82 schema on an old storage key');
      for (const [re, label] of [
        [/entry notice|notice of entry/i, 'notice of entry surface'],
        [/entry_violation/i, 'entry-violation dispute ground'],
        [/follows the deed|tenant in place/i, 'sale-with-tenant paper'],
        [/renewal/i, 'renewal offer flow'],
        [/termMo/i, 'fixed-term month counter'],
        [/returned.payment|payment returned/i, 'returned-payment handling'],
        [/guarantor release|release guarantor|guarRel/i, 'guarantor release flow']
      ]) if (!re.test(html)) add(g, 'fail', 'lease.html', null, `v82 surface missing: ${label}`);
      if (!LJ.entry_notices || !LJ.sale_occupied || !LJ.renewal || !LJ.returned_payments)
        add(g, 'fail', 'leases.json', null, 'v82 blocks missing (entry_notices/sale_occupied/renewal/returned_payments)');
      if (!LJ.screening.guarantor || !LJ.screening.guarantor.release)
        add(g, 'fail', 'leases.json', null, 'guarantor.release block missing');
      if (!(LJ.disputes.grounds || []).includes('entry_violation'))
        add(g, 'fail', 'leases.json', null, 'entry_violation missing from dispute grounds');
      if (LJ.sale_occupied && LJ.sale_occupied.admin_only !== true)
        add(g, 'fail', 'leases.json', null, 'sale-of-occupied recording must stay admin-only');
      if (!LJ.power_map.licensed_landlord.never.includes('record_sales'))
        add(g, 'fail', 'leases.json', null, 'licensed landlords must never record sales');
      /* own-unit guards on the new licensed tools; admin-only on sale */
      for (const fn of ['postEntry', 'markReturned', 'offerRenewal', 'guarRelDecide']) {
        const fb = html.match(new RegExp('window\\.' + fn + '=function[\\s\\S]*?^\\};', 'm'));
        if (!fb) add(g, 'fail', 'lease.html', null, `${fn} missing`);
        else if (!/myUnit/.test(fb[0]))
          add(g, 'fail', 'lease.html', null, `${fn} lacks the own-unit guard`);
      }
      const rs = html.match(/window\.recordSale=function[\s\S]*?^\};/m);
      if (!rs) add(g, 'fail', 'lease.html', null, 'recordSale missing');
      else if (!/mode!=='admin'|mode!=="admin"/.test(rs[0]))
        add(g, 'fail', 'lease.html', null, 'recordSale must be admin-only');
      /* file-only surfaces: entry / returned payment / renewal /
         guarantor release never reach the feed */
      for (const fn of ['postEntry', 'markReturned', 'offerRenewal', 'renewalDecide', 'reqGuarRel', 'guarRelDecide']) {
        const fb = html.match(new RegExp('window\\.' + fn + '=function[\\s\\S]*?^\\};', 'm'));
        if (fb && /wires\.push/.test(fb[0]))
          add(g, 'fail', 'lease.html', null, `${fn} posts to the feed — file-only by contract`);
      }
    }
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
    /* ---- v41 second pass ---- */
    for (const blk of ['presence', 'compute_ledger', 'owner_report', 'live_seam', 'reflex_registry'])
      if (!TJ[blk]) add(g, 'fail', 'thinai.json', null, `v41 block "${blk}" missing`);
    if (TJ.presence && TJ.presence.linger_s !== 90)
      add(g, 'fail', 'thinai.json', null, 'presence.linger_s drifted from 90');
    if (TJ.presence && !/owner_offline/.test(TJ.presence.billing_rule || ''))
      add(g, 'fail', 'thinai.json', null, 'presence.billing_rule lost the owner_offline deny code');
    const buckets = TJ.compute_ledger && TJ.compute_ledger.buckets || {};
    for (const b of ['llm_min', 'thin_min', 'player_min'])
      if (!buckets[b]) add(g, 'fail', 'thinai.json', null, `compute bucket "${b}" missing`);
    const LINES = TJ.phrase_kit && TJ.phrase_kit.lines || {};
    for (const cat of ['greeting', 'queue', 'weather', 'game', 'closing', 'deflect', 'silence'])
      if (!Array.isArray(LINES[cat]) || LINES[cat].length < 3)
        add(g, 'fail', 'thinai.json', null, `phrase_kit.lines.${cat} missing or <3 lines`);
    if ((TJ.reflex_registry?.shared || []).length < 4)
      add(g, 'fail', 'thinai.json', null, 'reflex_registry.shared has <4 entries');
    if (!/archive/.test(TJ.note_lifecycle?.stale || '') || !TJ.note_lifecycle.archive)
      add(g, 'fail', 'thinai.json', null, 'note_lifecycle lost the archive path');
    if (TJ.live_seam && (TJ.live_seam.never_calls || []).join(' ').indexOf('gsHandoffRead') < 0)
      add(g, 'fail', 'thinai.json', null, 'live_seam.never_calls must name gsHandoffRead');
    /* html mirror: v41 surfaces + no bridge mutation */
    const MUST41 = [
      [/owner_offline/, 'presence deny code owner_offline'],
      [/llm_min/, 'compute ledger buckets'],
      [/salience/i, 'degrade salience ordering'],
      [/archive/i, 'note archive surface'],
      [/gsHandoffRead/, 'handoff-read never-called note']
    ];
    for (const [re, label] of MUST41)
      if (!re.test(html)) add(g, 'fail', 'thinai.html', null, `missing v41 copy: ${label}`);
    if (/BRIDGE\.gs\w+\s*\(/.test(html))
      add(g, 'fail', 'thinai.html', null, 'demo calls a bridge function — mirror only, never a driver');
    /* ---- v55 coverage + flap-guard pass ---- */
    for (const blk of ['coverage', 'flap_guard', 'main_routines'])
      if (!TJ[blk]) add(g, 'fail', 'thinai.json', null, `v55 block "${blk}" missing`);
    if (TJ.coverage) {
      for (const cls of ['ambient', 'main', 'hired'])
        if (!(TJ.coverage.ladders || {})[cls])
          add(g, 'fail', 'thinai.json', null, `coverage.ladders.${cls} missing`);
      if (!/idle/.test((TJ.coverage.ladders?.main || []).join(' ')))
        add(g, 'fail', 'thinai.json', null, 'main ladder lost the home·idle floor');
    }
    if (TJ.flap_guard) {
      const d = TJ.flap_guard.deadband || {};
      if (d.degrade_below_pct !== 60 || d.recover_at_or_above_pct !== 70)
        add(g, 'fail', 'thinai.json', null, 'flap_guard deadband drifted from <60 / ≥70');
      if (TJ.flap_guard.min_dwell_min !== 30)
        add(g, 'fail', 'thinai.json', null, 'flap_guard.min_dwell_min drifted from 30');
    }
    /* mains registry: all 8 mains, each routine covering 0–24 contiguously */
    if (TJ.main_routines) {
      for (let n = 1; n <= 8; n++) {
        const cid = 'C' + n, m = TJ.main_routines[cid];
        if (!m) { add(g, 'fail', 'thinai.json', null, `main_routines.${cid} missing — a degraded main has no public routine`); continue; }
        const rows = m.rows || [];
        let t = 0, ok = rows.length > 0;
        for (const r of rows) { if (r.h0 !== t || !(r.h1 > r.h0)) { ok = false; break; } t = r.h1; }
        if (!ok || t !== 24)
          add(g, 'fail', 'thinai.json', null, `main_routines.${cid} does not cover 0–24 contiguously (coverage contract §25)`);
      }
    }
    /* ambient routines: same contiguous-coverage contract, incl. variants */
    try {
      const AJ = JSONF('ambients.json');
      const covRows = (rows, tag) => {
        let t = 0, ok = rows.length > 0;
        for (const r of rows) { if (r.h0 !== t || !(r.h1 > r.h0)) { ok = false; break; } t = r.h1; }
        if (!ok || t !== 24)
          add(g, 'fail', 'ambients.json', null, `${tag} does not cover 0–24 contiguously (thin coverage contract)`);
      };
      for (const a of AJ.ambients || []) {
        covRows(a.routine || [], `${a.id}.routine`);
        for (const [k, v] of Object.entries(a.week || {}))
          covRows(v.rows || [], `${a.id}.week.${k}`);
        for (const [k, v] of Object.entries(a.weather || {}))
          covRows(v.rows || [], `${a.id}.weather.${k}`);
        /* `personal` rows are condition flags, not 24h row sets — not swept */
      }
    } catch (e) { add(g, 'fail', 'ambients.json', null, 'coverage sweep failed: ' + e.message); }
    /* html mirror: v55 surfaces */
    const MUST55 = [
      [/deadband/i, 'flap-guard deadband copy'],
      [/dwell/i, '30-min degrade dwell copy'],
      [/never freeze|never freezes/i, 'coverage never-freeze statement'],
      [/home · idle|home · idle/i, 'home·idle floor copy'],
      [/ladderStep/, 'flap-guard ladder stepper'],
      [/c6src/, 'live coverage-rung drop (corrupt routine demo)']
    ];
    for (const [re, label] of MUST55)
      if (!re.test(html)) add(g, 'fail', 'thinai.html', null, `missing v55 copy: ${label}`);
    /* ---- v69 long-outage pass ---- */
    for (const blk of ['wake_parity', 'outage_rotation', 'scene_yield', 'blackout_floor'])
      if (!TJ[blk]) add(g, 'fail', 'thinai.json', null, `v69 block "${blk}" missing`);
    if (TJ.outage_rotation) {
      if (TJ.outage_rotation.tolerance !== 1)
        add(g, 'fail', 'thinai.json', null, 'outage_rotation.tolerance drifted from Δ≤1');
      if (!/not a recovery/.test(TJ.outage_rotation.swap_is_not_recovery || ''))
        add(g, 'fail', 'thinai.json', null, 'outage_rotation lost the swap-is-not-recovery rule');
      if (!/deg_min/.test(TJ.outage_rotation.credit || ''))
        add(g, 'fail', 'thinai.json', null, 'outage_rotation lost the deg_min credit ledger');
    }
    if (TJ.blackout_floor && TJ.blackout_floor.at_pct !== 0)
      add(g, 'fail', 'thinai.json', null, 'blackout_floor.at_pct drifted from 0');
    if (TJ.wake_parity && !/own (time|day)/.test(TJ.wake_parity.rule || ''))
      add(g, 'fail', 'thinai.json', null, 'wake_parity lost the thin-time-is-their-own-day rule');
    const CLS = TJ.co_star && TJ.co_star.ask_classes || {};
    for (const c of ['be-present', 'hold-space', 'walk-with', 'carry-item'])
      if (!CLS[c] || !CLS[c].bounds || !CLS[c].veto)
        add(g, 'fail', 'thinai.json', null, `co_star.ask_classes.${c} missing bounds/veto`);
    if (!/never improvises/.test(TJ.co_star?.closed_taxonomy || ''))
      add(g, 'fail', 'thinai.json', null, 'co_star closed-taxonomy rule missing');
    if (!TJ.phrase_kit?.repetition_guard)
      add(g, 'fail', 'thinai.json', null, 'phrase_kit.repetition_guard missing');
    for (const ev of ['service_0', 'scene_c6'])
      if (!(TJ.demo.events || []).includes(ev))
        add(g, 'fail', 'thinai.json', null, `demo.events missing "${ev}"`);
    /* html mirror: v69 surfaces */
    const MUST69 = [
      [/deg_min|degMin/, 'outage-credit ledger'],
      [/rotation swap/, 'rotation swap seam line'],
      [/scene-yield/, 'scene-yield posture chip'],
      [/blackout/, 'blackout floor copy'],
      [/first beat back|first beat/i, 'wake-parity first-beat copy'],
      [/repetition guard/i, 'phrase-kit repetition guard'],
      [/be-present|hold-space|walk-with|carry-item/, 'co-star ask classes']
    ];
    for (const [re, label] of MUST69)
      if (!re.test(html)) add(g, 'fail', 'thinai.html', null, `missing v69 copy: ${label}`);
    /* ---- v83 fallback-surface pass ---- */
    for (const blk of ['surface_fallback', 'requests_under_degrade', 'quiet_week', 'surface_recovery'])
      if (!TJ[blk]) add(g, 'fail', 'thinai.json', null, `v83 block "${blk}" missing`);
    if (TJ.surface_fallback) {
      const P = TJ.surface_fallback.postures || {};
      for (const k of ['unaffected', 'hold', 'static'])
        if (!Array.isArray(P[k]) || !P[k].length)
          add(g, 'fail', 'thinai.json', null, `surface_fallback.postures.${k} missing/empty`);
      if (!/never auto-write|never auto-generate/i.test((P.hold || []).join(' ')))
        add(g, 'fail', 'thinai.json', null, 'hold posture lost the no-auto-write rule');
    }
    if (TJ.requests_under_degrade) {
      const R = TJ.requests_under_degrade;
      if (!/routine-fit/.test(R.routine_fit || ''))
        add(g, 'fail', 'thinai.json', null, 'requests_under_degrade lost the routine-fit gate');
      if (!/declined/.test(R.decline || '') || !/50%/.test(R.decline || ''))
        add(g, 'fail', 'thinai.json', null, 'requests_under_degrade decline lost resolved·declined + 50% refund');
      if (!/unpossessable/.test(R.ban_unchanged || ''))
        add(g, 'fail', 'thinai.json', null, 'requests_under_degrade lost the possession ban');
    }
    if (TJ.quiet_week) {
      if (TJ.quiet_week.boundary_jitter_min !== 15)
        add(g, 'fail', 'thinai.json', null, 'quiet_week.boundary_jitter_min drifted from ±15');
      if (!/deterministic/.test(TJ.quiet_week.day_hash || ''))
        add(g, 'fail', 'thinai.json', null, 'quiet_week.day_hash lost the deterministic rule');
      if (!(TJ.quiet_week.never_jittered || []).join(' ').match(/obligation/))
        add(g, 'fail', 'thinai.json', null, 'quiet_week.never_jittered must protect obligation minutes');
    }
    if (TJ.surface_recovery && !/≤1 per daypart|≤1\/daypart/.test(TJ.surface_recovery.press_trickle || ''))
      add(g, 'fail', 'thinai.json', null, 'surface_recovery lost the ≤1/daypart press trickle');
    for (const ev of ['req_c6_fit', 'req_c6_off'])
      if (!(TJ.demo.events || []).includes(ev))
        add(g, 'fail', 'thinai.json', null, `demo.events missing "${ev}"`);
    /* html mirror: v83 surfaces */
    const MUST83 = [
      [/rw_thinai_v83/, 'v83 storage key'],
      [/Surface fallback/i, 'surface-fallback panel'],
      [/routine-fit/i, 'routine-fit request rule'],
      [/posture-only/i, 'posture-only accept copy'],
      [/jitter/i, 'quiet-week jitter copy'],
      [/pressHeld/, 'held press backlog counter'],
      [/honest absence beats filler/i, 'no-filler rule']
    ];
    for (const [re, label] of MUST83)
      if (!re.test(html)) add(g, 'fail', 'thinai.html', null, `missing v83 copy: ${label}`);
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
      '## Wants (three clocks)', '## The cast, privately',
      '## Truth and lies',
      '## Money', '## Alone', '## Edges',
      '## A good day / a bad day', '## Keepsakes',
      '## Listening', '## The day off', '## Repairs',
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
      /* v42 structure: wants = three clocks; interior = the other seven ids */
      const w = c.wants || {};
      for (const k of ['week', 'season', 'long'])
        if (!w[k]) add(g, 'fail', 'characters.json', null, `${id}: wants.${k} missing`);
      const others = IDS.filter(x => x !== id).sort().join(',');
      const iKeys = Object.keys(c.interior || {}).sort().join(',');
      if (iKeys !== others)
        add(g, 'fail', 'characters.json', null, `${id}: interior keys ${iKeys} != ${others}`);
      /* new v28/v42/v56 fields stay observable-safe: no seed vocabulary */
      for (const k of ['backstory_brief', 'room', 'strangers', 'truth', 'money', 'alone', 'edges', 'good_day', 'bad_day', 'keepsakes', 'listening', 'day_off', 'repairs'])
        if (c[k] && /secret|seed|briefing|never tell/i.test(c[k]))
          add(g, 'fail', 'characters.json', null, `${id}.${k}: meta/seed vocabulary in an observable field`);
      const extra = JSON.stringify([w, c.interior || {}]);
      if (/secret|seed|briefing|never tell/i.test(extra))
        add(g, 'fail', 'characters.json', null, `${id}: meta/seed vocabulary in wants/interior`);
    }
    /* cast.html CAST ids and new fields agree with characters.json */
    const cm = html.match(/const CAST=(\[[\s\S]*?\n\]);/);
    if (!cm) add(g, 'fail', 'cast.html', null, 'inline CAST block not found');
    else {
      const CAST = eval(cm[1]);
      const htmlIds = CAST.map(c => c.id).sort().join(',');
      if (htmlIds !== IDS.join(','))
        add(g, 'fail', 'cast.html', null, `CAST ids ${htmlIds} != ${IDS.join(',')}`);
      for (const c of CAST) {
        for (const k of ['back', 'room', 'strg', 'prof', 'ties', 'rout', 'want', 'priv', 'trth', 'mny', 'aln', 'edg', 'day', 'keep', 'lst', 'offd', 'rpr'])
          if (!c[k]) add(g, 'fail', 'cast.html', null, `${c.id}: field "${k}" missing from card`);
        if (c.want && c.want.length !== 3)
          add(g, 'fail', 'cast.html', null, `${c.id}: want has ${c.want.length} clocks (need 3)`);
        if (c.priv && c.priv.length !== 7)
          add(g, 'fail', 'cast.html', null, `${c.id}: priv has ${c.priv.length} entries (need 7)`);
        if (c.day && c.day.length !== 2)
          add(g, 'fail', 'cast.html', null, `${c.id}: day has ${c.day.length} entries (need 2: good/bad)`);
        if (c.keep && c.keep.length !== 3)
          add(g, 'fail', 'cast.html', null, `${c.id}: keep has ${c.keep.length} keepsakes (need 3)`);
      }
    }
    /* v70 — ensemble.md exists and covers all 8 ids, seed-free */
    const ens = 'characters/ensemble.md';
    if (!fs.existsSync(path.join(W, ens))) add(g, 'fail', ens, null, 'ensemble bible missing');
    else {
      const em = rd(ens);
      for (const id of IDS)
        if (!em.includes(id)) add(g, 'fail', ens, null, `ensemble.md: ${id} absent`);
      if (/SECRETS & SEEDS|detonating|money bomb|\$\d/i.test(em))
        add(g, 'fail', ens, null, 'ensemble.md carries seed vocabulary — it is observable-safe only');
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
    /* v43: claimable resources — mirror + integrity */
    const RES = pull('RESOURCES', '[]');
    const jRes = (CJ.ambient_resources || {}).resources || [];
    if (JSON.stringify(RES.map(r => r.id).sort()) !== JSON.stringify(jRes.map(r => r.id).sort()))
      add(g, 'fail', 'crowd.html', null, 'RESOURCES ids != ambient_resources ids');
    for (const r of jRes) {
      const H = RES.find(x => x.id === r.id);
      if (H && H.label !== r.label) add(g, 'fail', 'crowd.html', null, `resource ${r.id} label drifted`);
      if (!CJ.zones[r.zone]) add(g, 'fail', 'crowd.json', null, `resource ${r.id}: unknown zone "${r.zone}"`);
      if (!ambIds.has(r.staff)) add(g, 'fail', 'crowd.json', null, `resource ${r.id}: staff "${r.staff}" is not a registered ambient`);
      const st = AMB.ambients.find(a => a.id === r.staff);
      if (st && st.minor) add(g, 'fail', 'crowd.json', null, `resource ${r.id}: staffed by a minor — minors have no claimable resources`);
      if (!Array.isArray(r.window_min) || r.window_min[0] > r.window_min[1])
        add(g, 'fail', 'crowd.json', null, `resource ${r.id}: bad window_min`);
      if (/secret|seed|briefing|must_not_know/i.test(JSON.stringify(r)))
        add(g, 'fail', 'crowd.json', null, `resource ${r.id}: meta/seed vocabulary in resource block`);
    }
    /* v43: roster mirror — crowd.html AMB ids/names/minors == ambients.json */
    const AMBH = pull('AMB', '[]');
    const jA = AMB.ambients.map(a => a.id).sort(), hA = AMBH.map(a => a[0]).sort();
    if (JSON.stringify(hA) !== JSON.stringify(jA))
      add(g, 'fail', 'crowd.html', null, `AMB ids drifted: ${hA.join(',')} != ${jA.join(',')}`);
    for (const a of AMBH) {
      const J = AMB.ambients.find(x => x.id === a[0]);
      if (J && J.name !== a[1]) add(g, 'fail', 'crowd.html', null, `AMB ${a[0]} name drifted: "${a[1]}" != "${J.name}"`);
      if (J && !!J.minor !== !!((a[4] || {}).minor)) add(g, 'fail', 'crowd.html', null, `AMB ${a[0]} minor flag drifted`);
    }
    /* v43: AMBX covers every roster id */
    const AMBX = pull('AMBX', '{}');
    for (const id of jA) if (!AMBX[id] || !AMBX[id].sig || !AMBX[id].v)
      add(g, 'fail', 'crowd.html', null, `AMBX ${id}: missing signature/variant note — every ambient needs the one-glance read`);
    /* v43: ambients.json variant contract — signature on all 20; week/weather
       rows legal (states ⊆ declared; full 24h coverage; no seed vocab;
       minors' variants stay in public zones) */
    const LEGAL_ST = new Set(['sleep','idle','rest','serve','work','walk','sit','run','carry','phone','chat','play','drink']);
    for (const a of AMB.ambients) {
      const s = a.signature || {};
      for (const k of ['silhouette','gait','carry','tell'])
        if (!s[k] || typeof s[k] !== 'string')
          add(g, 'fail', 'ambients.json', null, `${a.id}.signature.${k} missing — the feed-legible read is required`);
      const rows24 = rows => {
        let cov = true, t = 0;
        for (const r of rows || []) {
          if (r.h0 !== t) cov = false;
          t = r.h1; if (t < r.h0) cov = false;
          if (!LEGAL_ST.has(r.state)) add(g, 'fail', 'ambients.json', null, `${a.id}: variant state "${r.state}" not in declared states`);
          const refs = (r.stops || []).concat(r.to && r.to !== 'home' ? [r.to] : []);
          for (const spec of refs) if (spec && spec.poi === 'The 600 Club' && a.minor)
            add(g, 'fail', 'ambients.json', null, `${a.id}: minor variant routes to a bar`);
        }
        if (rows && rows.length && (t !== 24 || !cov))
          add(g, 'fail', 'ambients.json', null, `${a.id}: variant row set doesn't tile 0–24 (ends at ${t})`);
      };
      for (const [d, w] of Object.entries(a.week || {})) {
        if (!/^(mon|tue|wed|thu|fri|sat|sun)$/.test(d)) add(g, 'fail', 'ambients.json', null, `${a.id}.week: bad day key "${d}"`);
        rows24(w.rows);
        if (/secret|seed|briefing/i.test(JSON.stringify(w))) add(g, 'fail', 'ambients.json', null, `${a.id}.week.${d}: meta vocabulary`);
      }
      for (const [c, w] of Object.entries(a.weather || {})) {
        if (!/^(rain|storm|heat|cold|wind|fog)$/.test(c)) add(g, 'fail', 'ambients.json', null, `${a.id}.weather: unknown condition "${c}"`);
        rows24(w.rows);
        if (/secret|seed|briefing/i.test(JSON.stringify(w))) add(g, 'fail', 'ambients.json', null, `${a.id}.weather.${c}: meta vocabulary`);
      }
      for (const pr of a.personal || [])
        if (!pr.id || !pr.when || /secret|seed|briefing/i.test(pr.note || ''))
          add(g, 'fail', 'ambients.json', null, `${a.id}.personal: entry missing id/when or carries meta vocabulary`);
    }
    /* v57: the marine layer — fog/wind weather rows, fog_model +
       season_shades mirror + integrity, every ambient answers fog */
    for (const c of ['fog', 'wind'])
      if (!CJ.weather_multipliers[c])
        add(g, 'fail', 'crowd.json', null, `weather_multipliers missing "${c}" — the shoulder conditions are contract`);
    const FOGM = CJ.fog_model || {};
    if (JSON.stringify(FOGM.stages || []) !== JSON.stringify(['deep', 'patchy', 'burned']))
      add(g, 'fail', 'crowd.json', null, 'fog_model.stages != deep/patchy/burned');
    if (!(FOGM.burn_hour > 6 && FOGM.burn_hour < 14))
      add(g, 'fail', 'crowd.json', null, 'fog_model.burn_hour out of sane range');
    const dpIds = CJ.dayparts.map(d => d.id);
    for (const [dp, st] of Object.entries(FOGM.day_profile || {})) {
      if (!dpIds.includes(dp)) add(g, 'fail', 'crowd.json', null, `fog_model.day_profile: unknown daypart "${dp}"`);
      if (!(FOGM.stages || []).includes(st)) add(g, 'fail', 'crowd.json', null, `fog_model.day_profile.${dp}: bad stage "${st}"`);
    }
    for (const dp of dpIds)
      if (FOGM.day_profile && !(dp in FOGM.day_profile))
        add(g, 'fail', 'crowd.json', null, `fog_model.day_profile missing daypart "${dp}"`);
    const FOG = pull('FOG', '{}'), SEA = pull('SEASONS', '{}');
    if (FOG.burn_hour !== FOGM.burn_hour)
      add(g, 'fail', 'crowd.html', null, `FOG.burn_hour ${FOG.burn_hour} != fog_model ${FOGM.burn_hour}`);
    for (const dp of dpIds)
      if (FOG.profile && FOG.profile[dp] !== (FOGM.day_profile || {})[dp])
        add(g, 'fail', 'crowd.html', null, `FOG.profile.${dp} drifted from fog_model.day_profile`);
    const jSea = ((CJ.season_shades || {}).shades || []);
    if (JSON.stringify(Object.keys(SEA).sort()) !== JSON.stringify(jSea.map(s => s.id).sort()))
      add(g, 'fail', 'crowd.html', null, 'SEASONS keys != season_shades ids');
    for (const s of jSea) {
      for (const m of (s.when || {}).months || [])
        if (!Number.isInteger(m) || m < 1 || m > 12)
          add(g, 'fail', 'crowd.json', null, `season ${s.id}: bad month ${m}`);
      for (const z of Object.keys(s.zone_mult || {}))
        if (!CJ.zones[z]) add(g, 'fail', 'crowd.json', null, `season ${s.id}: unknown zone ${z}`);
      for (const [dp, mm] of Object.entries(s.daypart_zone_mult || {})) {
        if (!dpIds.includes(dp)) add(g, 'fail', 'crowd.json', null, `season ${s.id}: unknown daypart ${dp}`);
        for (const z of Object.keys(mm)) if (!CJ.zones[z]) add(g, 'fail', 'crowd.json', null, `season ${s.id}.${dp}: unknown zone ${z}`);
      }
      const H = SEA[s.id];
      if (H && JSON.stringify(H.zone_mult || null) !== JSON.stringify(s.zone_mult || null))
        add(g, 'fail', 'crowd.html', null, `SEASONS.${s.id}.zone_mult drifted`);
    }
    for (const a of AMB.ambients)
      if (!(a.weather && a.weather.fog))
        add(g, 'fail', 'ambients.json', null, `${a.id}: no weather.fog answer — fog is the default SF condition, every card must respond`);
    /* v71: the civic year + posture palette — mirror + integrity */
    const ANN = pull('ANNUAL', '{}'), POS = pull('POSTURES', '[]'), PLB = pull('PLABELS', '{}');
    const jAnn = (CJ.annual_shades || {}).shades || [];
    if (JSON.stringify(Object.keys(ANN).sort()) !== JSON.stringify(jAnn.map(s => s.id).sort()))
      add(g, 'fail', 'crowd.html', null, 'ANNUAL keys != annual_shades ids');
    const annIds = new Set(jAnn.map(s => s.id)), silh = new Set((CJ.appearance_palette || {}).silhouettes || []);
    const DOWS = new Set(['mon','tue','wed','thu','fri','sat','sun']);
    const winCheck = (sid, w) => {
      for (const m of w.months || [])
        if (!Number.isInteger(m) || m < 1 || m > 12) add(g, 'fail', 'crowd.json', null, `annual ${sid}: bad month ${m}`);
      if (w.dom && !(Array.isArray(w.dom) && w.dom.length === 2 && w.dom[0] >= 1 && w.dom[1] <= 31 && w.dom[0] <= w.dom[1]))
        add(g, 'fail', 'crowd.json', null, `annual ${sid}: bad dom range`);
      for (const d of w.dow || [])
        if (!DOWS.has(d)) add(g, 'fail', 'crowd.json', null, `annual ${sid}: bad dow "${d}"`);
      if (w.nth != null && !w.dow) add(g, 'fail', 'crowd.json', null, `annual ${sid}: nth requires dow`);
      for (const dp of w.dayparts || [])
        if (!dpIds.includes(dp)) add(g, 'fail', 'crowd.json', null, `annual ${sid}: unknown daypart "${dp}"`);
    };
    for (const s of jAnn) {
      const wins = s.windows || (s.when ? [s.when] : []);
      if (!wins.length) add(g, 'fail', 'crowd.json', null, `annual ${s.id}: no window`);
      wins.forEach(w => winCheck(s.id, w));
      for (const z of Object.keys(s.zone_mult || {}))
        if (!CJ.zones[z]) add(g, 'fail', 'crowd.json', null, `annual ${s.id}: unknown zone ${z}`);
      for (const [dp, mm] of Object.entries(s.daypart_zone_mult || {})) {
        if (!dpIds.includes(dp)) add(g, 'fail', 'crowd.json', null, `annual ${s.id}: unknown daypart ${dp}`);
        for (const z of Object.keys(mm)) if (!CJ.zones[z]) add(g, 'fail', 'crowd.json', null, `annual ${s.id}.${dp}: unknown zone ${z}`);
      }
      for (const e of Object.keys(s.edge_mult || {}))
        if (!flIds.has(e)) add(g, 'fail', 'crowd.json', null, `annual ${s.id}: edge_mult "${e}" is not a flow edge`);
      for (const si of s.silhouette_hint || [])
        if (!silh.has(si)) add(g, 'fail', 'crowd.json', null, `annual ${s.id}: silhouette_hint "${si}" not in appearance_palette`);
      if (/secret|seed|briefing|must_not_know/i.test(JSON.stringify(s)))
        add(g, 'fail', 'crowd.json', null, `annual ${s.id}: meta vocabulary`);
      const H = ANN[s.id];
      if (H && JSON.stringify(H.zone_mult || null) !== JSON.stringify(s.zone_mult || null))
        add(g, 'fail', 'crowd.html', null, `ANNUAL.${s.id}.zone_mult drifted`);
    }
    for (const s of CJ.scenes)
      if (s.when && s.when.annual && !annIds.has(s.when.annual))
        add(g, 'fail', 'crowd.json', null, `scene ${s.id}: unknown annual "${s.when.annual}"`);
    for (const e of CJ.micro_events.events) {
      for (const m of (e.when || {}).months || [])
        if (!Number.isInteger(m) || m < 1 || m > 12) add(g, 'fail', 'crowd.json', null, `micro ${e.id}: bad month ${m}`);
      if (e.when && e.when.dom && !(e.when.dom[0] <= e.when.dom[1]))
        add(g, 'fail', 'crowd.json', null, `micro ${e.id}: bad dom range`);
    }
    /* posture palette: ids mirror, kinds legal, labels cover every state,
       pair postures flagged — honest idle vocabulary under audit */
    const jPos = (CJ.posture_palette || {}).postures || [];
    if (JSON.stringify(POS.map(p => p.id).sort()) !== JSON.stringify(jPos.map(p => p.id).sort()))
      add(g, 'fail', 'crowd.html', null, 'POSTURES ids != posture_palette ids');
    const kinds = new Set(Object.values(CJ.zones).map(z => z.kind));
    for (const p of jPos) {
      for (const k of p.kinds || [])
        if (!kinds.has(k)) add(g, 'fail', 'crowd.json', null, `posture ${p.id}: unknown zone kind "${k}"`);
      if (!p.id || !p.read) add(g, 'fail', 'crowd.json', null, `posture missing id/read`);
      if (/secret|seed|briefing|must_not_know/i.test(JSON.stringify(p)))
        add(g, 'fail', 'crowd.json', null, `posture ${p.id}: meta vocabulary`);
    }
    const jLbl = (CJ.posture_palette || {}).labels || {};
    for (const st of [...LEGAL_ST, 'talk', 'queue', 'transit'])
      if (!jLbl[st]) add(g, 'fail', 'crowd.json', null, `posture_palette.labels missing "${st}" — no state may fall back to a lie`);
    for (const st of Object.keys(jLbl)) if (!PLB[st])
      add(g, 'fail', 'crowd.html', null, `PLABELS missing "${st}"`);
    g.detail = `schema v${CJ.version} · ${jz.length} zones · ${jFl.length} edges · ${jGr.length} pairs · ${jRes.length} resources · ${jA.length} rostered · ${jAnn.length} annual · ${jPos.length} postures`;
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
    /* ---- v44 storefront layer: storefronts.json ↔ storefront.html ---- */
    const SFJ = JSONF('storefronts.json');
    const sHtml = rd('storefront.html');
    const STO = (() => {
      const m = sHtml.match(/const STO\s*=\s*(\{[\s\S]*?\});/);
      if (!m) throw new Error('inline STO not found in storefront.html');
      return eval('(' + m[1] + ')');
    })();
    const whenKeys = new Set(Object.keys(SFJ.when_keys || {}));
    const DOOR = new Set(['anchor', 'street']);
    const sfIds = new Set(Object.keys(SFJ.storefronts || {}));
    for (const b of BJ.businesses) {
      if (DOOR.has(b.tier) && !sfIds.has(b.id))
        add(g, 'fail', 'storefronts.json', null, `${b.id} (${b.tier}) has a door but no storefront`);
      if (!DOOR.has(b.tier) && sfIds.has(b.id))
        add(g, 'fail', 'storefronts.json', null, `${b.id} (${b.tier}) carries a storefront — doors only`);
    }
    for (const id of sfIds) {
      if (!ids.has(id)) { add(g, 'fail', 'storefronts.json', null, `storefront "${id}" is not a business`); continue; }
      const sf = SFJ.storefronts[id];
      if (!sf.fascia) add(g, 'fail', 'storefronts.json', null, `${id}: no fascia text`);
      for (const a of sf.aframe || [])
        if (a.when != null && !whenKeys.has(a.when))
          add(g, 'fail', 'storefronts.json', null, `${id}: aframe when "${a.when}" not in when_keys`);
    }
    /* deep mirror: STO.storefronts must field-match storefronts.json */
    if (STO.version !== SFJ.version)
      add(g, 'fail', 'storefront.html', null, `STO version ${STO.version} != ${SFJ.version}`);
    for (const k of ['fascia', 'window', 'board', 'aframe', 'flyers', 'neon', 'closed_note'])
      for (const id of sfIds) {
        const j = SFJ.storefronts[id], h = (STO.storefronts || {})[id];
        if (!h) { add(g, 'fail', 'storefront.html', null, `STO missing storefront "${id}"`); break; }
        if (JSON.stringify(j[k] ?? null) !== JSON.stringify(h[k] ?? null))
          add(g, 'fail', 'storefront.html', null, `STO ${id}.${k} drifted from storefronts.json`);
      }
    for (const id of Object.keys(STO.storefronts || {}))
      if (!sfIds.has(id)) add(g, 'fail', 'storefront.html', null, `inline STO "${id}" absent from storefronts.json`);
    /* hours map (HRS) may only key real door-tier businesses */
    const hrsM = sHtml.match(/const HRS = \{([\s\S]*?)\};/);
    if (!hrsM) add(g, 'fail', 'storefront.html', null, 'inline HRS map not found');
    else for (const hm of hrsM[1].matchAll(/'([\w-]+)':/g))
      if (!sfIds.has(hm[1])) add(g, 'fail', 'storefront.html', null, `HRS key "${hm[1]}" has no storefront`);
    g.detail = `schema v${BJ.version} · ${ids.size} businesses · ${BJ.web.edges.length} web edges · ${cardFiles.size} cards · ${sfIds.size} storefronts`;
  } catch (e) { add(g, 'fail', 'businesses.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G15b regs ============ */
{
  const g = gate('regs', 'regulars contract (regulars.json ↔ regulars.html; surface-knowledge bar; door tiers only)');
  try {
    const RJ = JSONF('regulars.json');
    const html = rd('regulars.html');
    const m = html.match(/const REG\s*=\s*(\{[\s\S]*?\});/);
    if (!m) throw new Error('inline REG not found in regulars.html');
    const REG = eval('(' + m[1] + ')');
    if (REG.version !== RJ.version)
      add(g, 'fail', 'regulars.html', null, `REG version ${REG.version} != regulars.json ${RJ.version}`);
    for (const k of ['window_keys', 'regulars'])
      if (JSON.stringify(REG[k] ?? null) !== JSON.stringify(RJ[k] ?? null))
        add(g, 'fail', 'regulars.html', null, `REG.${k} drifted from regulars.json`);
    const BJ = JSONF('businesses.json');
    const DOOR = new Set(['anchor', 'street']);
    const CASTID = /^[cC]([1-8])$|^[aA](0[1-9]|1[0-9]|20)$/;
    const DOWS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const BANNED = [/unfiltered/i, /secret/i, /\bseed/i, /possess/i, /\bcredit/i, /\bloan\b/i];
    const openRanges = (b, day) => {
      if ((b.hours || {}).days && !b.hours.days.includes(day)) return [];
      const wk = (day === 'sat' || day === 'sun') ? 'weekend' : 'weekday';
      const rng = (b.hours || {})[wk];
      return rng ? [rng] : [];
    };
    const rDays = w => w.days === 'daily' ? DOWS : w.days === 'weekday' ? DOWS.slice(0, 5) : w.days;
    let nReg = 0;
    for (const b of BJ.businesses) {
      const regs = RJ.regulars[b.id];
      if (DOOR.has(b.tier) && (!Array.isArray(regs) || !regs.length))
        add(g, 'fail', 'regulars.json', null, `${b.id} (${b.tier}) has a door but no regulars`);
      if (!DOOR.has(b.tier) && regs)
        add(g, 'fail', 'regulars.json', null, `${b.id} (${b.tier}) carries regulars — doors only`);
      if (!regs) continue;
      const staffIds = new Set((b.staff || []).map(s => String(s).match(/^([a-zA-Z]\d+)/)[1].toLowerCase()));
      for (const r of regs) {
        nReg++;
        const tag = `${b.id}:${r.who}`;
        if (!CASTID.test(r.who)) add(g, 'fail', 'regulars.json', null, `${tag}: not a cast id`);
        if (staffIds.has(String(r.who).toLowerCase()))
          add(g, 'fail', 'regulars.json', null, `${tag}: venue staff cannot be its own regular`);
        const w = r.window || {};
        const days = rDays(w);
        if (!Array.isArray(days) || !days.length || days.some(d => !DOWS.includes(d)))
          add(g, 'fail', 'regulars.json', null, `${tag}: bad window.days ${JSON.stringify(w.days)}`);
        if (!Array.isArray(w.hours) || w.hours.length !== 2 || w.hours[0] < 0 || w.hours[1] > 26.5 || w.hours[0] >= w.hours[1])
          add(g, 'fail', 'regulars.json', null, `${tag}: bad window.hours ${JSON.stringify(w.hours)}`);
        else if (Array.isArray(days) && days.every(d => DOWS.includes(d))) {
          const ok = days.some(day => openRanges(b, day).some(rng => w.hours[1] > rng[0] && w.hours[0] < rng[1]));
          if (!ok) add(g, 'fail', 'regulars.json', null, `${tag}: window never overlaps ${b.id} open hours`);
        }
        if (!r.order || !r.spot) add(g, 'fail', 'regulars.json', null, `${tag}: order and spot are required`);
        if (!Array.isArray(r.house_knows) || !r.house_knows.length)
          add(g, 'fail', 'regulars.json', null, `${tag}: house_knows empty — the layer is the knowledge`);
        for (const s of [r.order, r.spot, ...(r.house_knows || [])])
          for (const re of BANNED)
            if (re.test(String(s)))
              add(g, 'fail', 'regulars.json', null, `${tag}: "${s}" breaches the surface-knowledge bar (${re})`);
        for (const nb of r.name_basis || [])
          if (!staffIds.has(String(nb).toLowerCase()))
            add(g, 'fail', 'regulars.json', null, `${tag}: name_basis "${nb}" is not ${b.id} staff`);
        if (r.tab != null) {
          if (typeof r.tab.balance !== 'number' || r.tab.balance < 0)
            add(g, 'fail', 'regulars.json', null, `${tag}: tab.balance must be a game-dollar number ≥ 0`);
          if (!r.tab.rule) add(g, 'fail', 'regulars.json', null, `${tag}: tab needs a settlement rule`);
        }
      }
    }
    for (const id of Object.keys(RJ.regulars || {}))
      if (!BJ.businesses.some(b => b.id === id))
        add(g, 'fail', 'regulars.json', null, `regulars key "${id}" is not a business`);
    g.detail = `schema v${RJ.version} · ${Object.keys(RJ.regulars).length} venues · ${nReg} regulars`;
  } catch (e) { add(g, 'fail', 'regulars.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G15c menus ============ */
{
  const g = gate('menus', 'menu catalog contract (menus.json ↔ menus.html; doors only; board-price agreement; game dollars only)');
  try {
    const MNU = JSONF('menus.json');
    const html = rd('menus.html');
    const m = html.match(/const MENUS\s*=\s*(\{[\s\S]*?\});/);
    if (!m) throw new Error('inline MENUS not found in menus.html');
    const MI = eval('(' + m[1] + ')');
    if (MI.version !== MNU.version)
      add(g, 'fail', 'menus.html', null, `MENUS version ${MI.version} != menus.json ${MNU.version}`);
    for (const k of ['cat_keys', 'when_keys', 'names', 'menus'])
      if (JSON.stringify(MI[k] ?? null) !== JSON.stringify(MNU[k] ?? null))
        add(g, 'fail', 'menus.html', null, `MENUS.${k} drifted from menus.json`);
    const BJ = JSONF('businesses.json');
    const SFJ = JSONF('storefronts.json');
    const DOOR = new Set(['anchor', 'street']);
    const cats = new Set(Object.keys(MNU.cat_keys || {}));
    const whens = new Set(Object.keys(MNU.when_keys || {}));
    const BANNED = [/unfiltered/i, /secret/i, /\bseed/i, /possess/i, /\bcredit/i, /\bloan\b/i];
    const mIds = new Set(Object.keys(MNU.menus || {}));
    for (const b of BJ.businesses) {
      if (DOOR.has(b.tier) && !mIds.has(b.id))
        add(g, 'fail', 'menus.json', null, `${b.id} (${b.tier}) has a door but no menu`);
      if (!DOOR.has(b.tier) && mIds.has(b.id))
        add(g, 'fail', 'menus.json', null, `${b.id} (${b.tier}) carries a menu — doors only`);
      if ((MNU.names || {})[b.id] && MNU.names[b.id] !== b.name)
        add(g, 'fail', 'menus.json', null, `${b.id}: names "${MNU.names[b.id]}" != registry "${b.name}"`);
    }
    let nItems = 0;
    for (const id of mIds) {
      if (!BJ.businesses.some(b => b.id === id)) { add(g, 'fail', 'menus.json', null, `menu "${id}" is not a business`); continue; }
      if (!(MNU.names || {})[id]) add(g, 'fail', 'menus.json', null, `${id}: names map missing entry`);
      const items = ((MNU.menus[id] || {}).items) || [];
      nItems += items.length;
      if (items.length < 4) add(g, 'fail', 'menus.json', null, `${id}: ${items.length} items — minimum 4`);
      if (!items.some(i => i.sig)) add(g, 'fail', 'menus.json', null, `${id}: no signature item`);
      for (const it of items) {
        const tag = `${id}:${it.name}`;
        if (!it.name || typeof it.name !== 'string') add(g, 'fail', 'menus.json', null, `${id}: unnamed item`);
        if (!((typeof it.price === 'number' && it.price >= 0) || it.price === 'ask'))
          add(g, 'fail', 'menus.json', null, `${tag}: price must be a number ≥ 0 or "ask"`);
        if (!cats.has(it.cat)) add(g, 'fail', 'menus.json', null, `${tag}: cat "${it.cat}" not in cat_keys`);
        if (it.when != null && !whens.has(it.when))
          add(g, 'fail', 'menus.json', null, `${tag}: when "${it.when}" not in when_keys`);
        for (const s of [it.name, it.note])
          for (const re of BANNED)
            if (re.test(String(s))) add(g, 'fail', 'menus.json', null, `${tag}: "${s}" banned vocab (${re})`);
      }
    }
    for (const id of Object.keys(MNU.names || {}))
      if (!BJ.businesses.some(b => b.id === id)) add(g, 'fail', 'menus.json', null, `names key "${id}" is not a business`);
    /* board agreement: a menu item named on the storefront board carries the
       same price — the chalk and the ledger never disagree */
    for (const id of mIds) {
      const board = (((SFJ.storefronts || {})[id] || {}).board) || [];
      for (const line of board) {
        const mm = String(line).match(/^(.*?)\s+(?:≈\s*)?(\d+(?:\.\d+)?)\s*(?:\+|\/lb|$)/);
        if (!mm) continue;
        const lname = mm[1].replace(/\s*—.*$/, '').trim().toLowerCase();
        const lprice = +mm[2];
        for (const it of ((MNU.menus[id] || {}).items) || []) {
          if (String(it.name).toLowerCase() !== lname) continue;
          if (it.price === 'ask')
            add(g, 'fail', 'menus.json', null, `${id}: "${it.name}" priced ${lprice} on board but "ask" on menu`);
          else if (it.price !== lprice)
            add(g, 'fail', 'menus.json', null, `${id}: "${it.name}" menu ${it.price} != board ${lprice}`);
        }
      }
    }
    /* credit figures never appear in this layer */
    const mtxt = rd('menus.json');
    for (const mm of mtxt.matchAll(/\b\d[\d,]*\s*cr\b/gi))
      add(g, 'fail', 'menus.json', null, `credit figure in menu layer: "${mm[0]}"`);
    g.detail = `schema v${MNU.version} · ${mIds.size} menus · ${nItems} items`;
  } catch (e) { add(g, 'fail', 'menus.json', null, 'parse/check failure: ' + e.message); }
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
    /* v46 — the reviewed request */
    const am = RJ.approve_modified || {};
    if (!/never expanded/.test(am.rule || '') || am.feed_status !== 'approved (modified)')
      add(g, 'fail', 'requests.json', null, 'approve_modified contract drifted (trim-only / feed status)');
    if (!RJ.feed_vocabulary.includes('approved (modified)'))
      add(g, 'fail', 'requests.json', null, 'feed_vocabulary missing "approved (modified)"');
    for (const s of ['approved (modified)', 'never expanded', 'full refund',
                     'accept the trimmed version', 'approve-modified'])
      if (!html.includes(s)) add(g, 'fail', 'request.html', null, `approve-modified surface missing "${s}"`);
    /* honest upfront charge — declare-time debit, real deny refund */
    if (!/\(upfront\)/.test(html) || !/deny refund/.test(html))
      add(g, 'fail', 'request.html', null, 'upfront charge / real deny refund missing');
    /* queue hold clock + expiry */
    if (!/holdMin/.test(html) || !/left of 24 h|of 24 h/.test(html))
      add(g, 'fail', 'request.html', null, 'queued hold clock missing');
    if (!RJ.queue_hold || !/auto-refund/.test(RJ.queue_hold.expiry || ''))
      add(g, 'fail', 'requests.json', null, 'queue_hold expiry contract missing');
    /* scheduled events fire; hire routes to The Registry; demo hooks */
    if (!/fired/.test(html)) add(g, 'fail', 'request.html', null, 'scheduled events never fire');
    if (!/per:'route'/.test(html) || !html.includes("location.href='create.html'"))
      add(g, 'fail', 'request.html', null, 'hire must route to create.html, not file a request');
    if (!html.includes('RW_DEMO_EVENTS'))
      add(g, 'fail', 'request.html', null, 'demo event hooks (RW_DEMO_EVENTS) missing');
    /* v60 — live seam: the page is bridged when __aiBridge is present */
    const LS = RJ.live_seam || {};
    if (!LS.write || !/gsRequestSubmit/.test(LS.write))
      add(g, 'fail', 'requests.json', null, 'live_seam.write must name gsRequestSubmit as the merge contract');
    for (const s of ['__aiBridge', 'gsViewerState', 'srcBadge',
                     'mirror — local pipeline', 'live · __aiBridge',
                     'gsRequestSubmit', 'gsExplainRequest', 'gsCoSessions', 'livePoll'])
      if (!html.includes(s)) add(g, 'fail', 'request.html', null, `live-seam surface missing "${s}"`);
    /* the write path must be capability-guarded — never an unconditional call */
    if (!/LIVE && BRIDGE\.gsRequestSubmit/.test(html))
      add(g, 'fail', 'request.html', null, 'gsRequestSubmit must be capability-checked (LIVE && BRIDGE.) before filing');
    /* v60 — pre-flight check: same engine, before money moves, never a gate */
    const PF = RJ.preflight_check || {};
    if (!/never blocks filing|does not gate/.test((PF.not_a_shadow_ban || '')))
      add(g, 'fail', 'requests.json', null, 'preflight_check must carry the not-a-shadow-ban rule');
    if (!(RJ.demo_hooks.emitted || []).includes('preflight_check'))
      add(g, 'fail', 'requests.json', null, 'demo_hooks.emitted missing preflight_check');
    for (const s of ['pfbtn', 'check wording first', 'Screening is free',
                     'screens clean', 'preflight_check', 'gray-zone'])
      if (!html.includes(s)) add(g, 'fail', 'request.html', null, `pre-flight surface missing "${s}"`);
    /* v60 — receipt drawer: declared terms + charge + claim + trail */
    const RC = RJ.receipt || {};
    if (!RC.ref || !/rq-/.test(RC.ref))
      add(g, 'fail', 'requests.json', null, 'receipt contract must carry the rq-<id> ref');
    for (const s of ['data-rc', 'rtrail', 'trail(', 'receipt', 'rq-'])
      if (!html.includes(s)) add(g, 'fail', 'request.html', null, `receipt surface missing "${s}"`);
    g.detail = `${RJ.actions.length} actions · ${RJ.wallet.packs.length} packs · appeal ${RJ.appeals.window_h} h · co-sponsor cap ${co.cap} · approve-modified ${am.feed_status || 'MISSING'} · seam ${LS.write ? 'wired' : 'MISSING'}`;
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
      [/same world event, not a discount/, 'co-sponsor attribution copy'],
      [/the day so far/, 'v47 day recap bar'],
      [/earlier today/, 'v47 missed-bar label'],
      [/paid upfront, hard cap/, 'v47 declared-cost disclosure'],
      [/no editorial pick/, 'v47 no-ranking honesty note']
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
    /* v47 affordances + contract keys (the recap layer) */
    for (const s of ['id="missedbar"', 'id="daybar"', 'id="daycard"',
      'catch me up', 'joinSeq', 'applyWx', 'renderDayBar', "'d'"])
      if (!html.includes(s)) add(g, 'fail', 'wire.html', null, `v47 affordance "${s}" absent`);
    const V47 = (FJ.spectator_ui || {}).spectator_ui_v47 || {};
    for (const k of ['day_so_far', 'missed_bar', 'declared_costs',
      'wx_follows_feed', 'keyboard'])
      if (!V47[k]) add(g, 'fail', 'feed.json', null, `spectator_ui_v47.${k} missing`);
    /* v61 affordances + contract keys (the Director's rail) */
    for (const s of ['id="dirbar"', 'id="camps"', 'id="fcamsel"', 'id="scrub"',
      'id="replay"', 'renderDirector', 'renderReplay', 'camMatch', 'rw_wire_cam',
      '#dir=1', 'gsExplainRequest', 'gsOccupancy', 'public whereabouts only',
      'filed at', 'the world itself kept running'])
      if (!html.includes(s)) add(g, 'fail', 'wire.html', null, `v61 affordance "${s}" absent`);
    const V61 = (FJ.spectator_ui || {}).spectator_ui_v61 || {};
    for (const k of ['director_bar', 'cam_presets', 'follow_cam',
      'replay_scrub', 'live_receipt', 'live_occupancy', 'pass_pointer',
      'keyboard'])
      if (!V61[k]) add(g, 'fail', 'feed.json', null, `spectator_ui_v61.${k} missing`);
    /* v75 affordances + contract keys (the schedule + person layer) */
    for (const s of ['id="bookbar"', 'id="cday"', 'id="mutelist"', 'id="qcount"',
      'BOOKW', 'renderBook', 'renderCharDay', 'openCharDay', 'toggleMute',
      'rw_wire_mute', 'rw_wire_book', 'on the book', 'their wire today',
      'muted on your screen', "'b'"])
      if (!html.includes(s)) add(g, 'fail', 'wire.html', null, `v75 affordance "${s}" absent`);
    const V75 = (FJ.spectator_ui || {}).spectator_ui_v75 || {};
    for (const k of ['book_strip', 'char_day', 'thread_mute',
      'search_count', 'keyboard'])
      if (!V75[k]) add(g, 'fail', 'feed.json', null, `spectator_ui_v75.${k} missing`);
    /* wire BOOKW mirrors bookings.json windows — same five-field key as
       request.html's own BOOKW check in the book gate */
    {
      const wm = html.match(/var BOOKW = (\[[\s\S]*?\]);/);
      if (!wm) add(g, 'fail', 'wire.html', null, 'wire BOOKW block not found');
      else {
        const BJ = JSONF('bookings.json');
        const W = eval('(' + wm[1] + ')');
        const key = w => [w.claim, w.start, w.min, w.who, w.what].join('|');
        const a = W.map(key).sort(), b = (BJ.windows || []).map(key).sort();
        if (JSON.stringify(a) !== JSON.stringify(b))
          add(g, 'fail', 'wire.html', null, 'wire BOOKW != bookings.json windows (hand-sync drift)');
      }
    }
    /* declared-cost attrs must be exercised: ≥1 seed carries credits */
    if (!(FJ.demo_seeds || []).some(e => e.attrs && e.attrs.credits))
      add(g, 'fail', 'feed.json', null, 'no demo seed exercises attrs.credits — declared-cost display untested');
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
      `${(FJ.demo_seeds || []).length} seeds mirrored · v33 keys: ${Object.keys(V33).join(',') || 'none'} · ` +
      `v47 keys: ${Object.keys(V47).join(',') || 'none'} · v61 keys: ${Object.keys(V61).join(',') || 'none'} · ` +
      `v75 keys: ${Object.keys(V75).join(',') || 'none'}`;
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
        for (const k of ['id', 't', 'kind', 'text', 'status', 'req', 'venue', 'who', 'src'])
          if (String(a[i][k]) !== String(b[i][k]))
            add(g, 'fail', 'archive.html', null,
              `event ${a[i].id}: field "${k}" differs (json "${a[i][k]}" / demo "${b[i][k]}")`);
        for (const k of ['thread', 'mentions', 'attrs', 'outcome'])
          if (JSON.stringify(a[i][k] || null) !== JSON.stringify(b[i][k] || null))
            add(g, 'fail', 'archive.html', null, `event ${a[i].id}: ${k} not mirrored`);
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
          if (e.outcome && e.outcome.by !== undefined) {
            const allIds = new Set(Object.values(HJ.days).flat().map(x => x.id));
            if (!allIds.has(e.outcome.by))
              add(g, 'fail', 'history.json', null, `rumor ${e.id}: outcome.by "${e.outcome.by}" names no archived event — a settled-by link may only point at the public record`);
          }
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
      [/archive\.html#e=/, 'permalink format'],
      [/data-v="week"/, 'week view switch'],
      [/The week on record/i, 'week view head'],
      [/no editorial pick/, 'week counted-not-curated copy'],
      [/counted from the wire/, 'week provenance copy'],
      [/id="dprev"/, 'prev-day control'],
      [/id="dnext"/, 'next-day control'],
      [/ArrowLeft/, 'arrow-key day walk'],
      [/around that time/, 'record neighbor trail'],
      [/settled by the public record/, 'rumor settled-by affordance'],
      [/busiest/, 'busiest-corner day rows'],
      /* v62 — the reading layer */
      [/data-v="shelf"/, 'shelf view switch'],
      [/data-v="pair"/, 'pair view switch'],
      [/rw_archive_shelf/, 'shelf storage key'],
      [/the shelf lives in this browser/, 'shelf honesty copy'],
      [/keep on the shelf/, 'shelf pin affordance'],
      [/id="shelfBtn"/, 'record shelf toggle'],
      [/id="shelftx"/, 'shelf transcript control'],
      [/copy shelf/, 'copy-shelf affordance'],
      [/public co-presence/, 'pair honesty copy'],
      [/seen with — public rows only/, 'person seen-with chips'],
      [/first on record/, 'person first/latest jumps'],
      [/the corner’s rhythm/, 'venue rhythm strip'],
      [/not a promise/, 'rhythm honesty copy'],
      [/id="pickA"/, 'pair picker A'],
      [/id="pickB"/, 'pair picker B'],
      /* v76 — the shape layer */
      [/data-v="hour"/, 'same-hour view switch'],
      [/data-v="cmp"/, 'day-compare view switch'],
      [/id="pickHour"/, 'hour picker'],
      [/id="pickD1"/, 'compare picker A'],
      [/id="pickD2"/, 'compare picker B'],
      [/a shape the wire happened to draw/, 'hour honesty copy'],
      [/not a schedule/, 'hour not-a-schedule copy'],
      [/counted, not explained/, 'compare honesty copy'],
      [/shared corners/, 'compare shared-corners block'],
      [/named in passing/, 'person lens chip'],
      [/the trail, cut finer/, 'person lens label'],
      [/id="reccopy"/, 'copy-record control'],
      [/copy record/, 'copy-record affordance'],
      [/ev\.key==='j'/, 'j/k row walk'],
      [/visIds/, 'row-walk id track']
    ];
    if (!HJ.archive_ui?.archive_ui_v48)
      add(g, 'fail', 'history.json', null, 'archive_ui_v48 contract block missing');
    if (!HJ.archive_ui?.archive_ui_v62)
      add(g, 'fail', 'history.json', null, 'archive_ui_v62 contract block missing');
    if (!HJ.archive_ui?.archive_ui_v76)
      add(g, 'fail', 'history.json', null, 'archive_ui_v76 contract block missing');
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
      `${Object.keys(HJ.threads || {}).length} threads · schema archive-v6`;
  } catch (e) { add(g, 'fail', 'history.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G20 creation ============ */
{
  const g = gate('creation', 'character-creation contract (creation.json ↔ create.html; jobs/housing/look/people mirrors; move-in math; bill-on-approval; read-only seam)');
  try {
    const CJ = JSONF('creation.json');
    const JJ = JSONF('jobs.json');
    const HJ = JSONF('housing.json');
    const FJ = JSONF('feed.json');
    const CJ2 = JSONF('characters.json');
    const AJ = JSONF('ambients.json');
    const html = rd('create.html');
    /* contract blocks the v35+v49 surface depends on */
    for (const k of ['move_in_math', 'payday', 'job_board', 'live_seam', 'screening', 'briefing_whitelist',
                     'people_layer', 'names_registry', 'arrival_window', 'registry_entry',
                     'pending_queue', 'day_one_keys', 'sketch', 'block_capacity',
                     'seat_waitlist', 'multi_hire'])
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
    /* v63: pending-application key + goes_by on the screened surface */
    const ak = (CJ.pending_queue.doc.match(/rw_create_app_v\d+/) || [])[0];
    if (!ak || !html.includes(ak)) add(g, 'fail', 'create.html', null, `pending key "${ak}" not in page`);
    if (!(CJ.screening.surface || []).includes('goes_by'))
      add(g, 'fail', 'creation.json', null, 'screening.surface must carry goes_by — the block name is screened text');
    if (!/f\.goes_by/.test(html))
      add(g, 'fail', 'create.html', null, 'goes_by must ride the screened text + record, not sit unscreened');
    /* v77: seat-waitlist key + block-cap agreement */
    const wk = (CJ.seat_waitlist.storage.match(/rw_create_wait_v\d+/) || [])[0];
    if (!wk || !html.includes(wk)) add(g, 'fail', 'create.html', null, `waitlist key "${wk}" not in page`);
    const capM = html.match(/var BLOCK_CAP = (\d+)/);
    if (!capM || +capM[1] !== CJ.block_capacity.cap)
      add(g, 'fail', 'create.html', null, `BLOCK_CAP drifted from creation.json cap ${CJ.block_capacity.cap}`);
    if (!/no way to pay for a sooner seat/i.test(html + JSON.stringify(CJ.seat_waitlist)))
      add(g, 'fail', 'creation.json', null, 'seat waitlist must forbid paid position');
    if (!/stranger/.test(html) || !/stranger/.test(JSON.stringify(CJ.multi_hire)))
      add(g, 'fail', 'creation.json', null, 'multi_hire stranger rule must exist in contract + page');
    if (!/depFor/.test(html) || !/0\.5/.test(html))
      add(g, 'fail', 'create.html', null, 'deposit rule (1× flat / 0.5× room share) not implemented');
    const roomRow = DHOMES.find(h2 => h2.room);
    if (!roomRow) add(g, 'fail', 'create.html', null, 'no room-share home flagged for the 0.5× deposit rule');
    /* v49 PEOPLE mirror — every row re-verified against the registries:
       cast rows must match characters.json names exactly (w tokens → job,
       b → home, owns → landlord field); face rows match ambients by
       fullName|name (w tokens → venue; faces never carry a home). */
    const pm = /var PEOPLE = (\[[\s\S]*?\]);/.exec(html);
    const DPEOPLE = pm ? eval(pm[1]) : [];
    if (!pm || !DPEOPLE.length) add(g, 'fail', 'create.html', null, 'PEOPLE block not found or empty');
    const tok = w => w.replace(/\(.*?\)/, '').trim().split(' ')[0];
    let castRows = 0;
    for (const p of DPEOPLE) {
      if (p.k === 'cast') {
        castRows++;
        const c = CJ2.cast.find(x => x.name === p.n);
        if (!c) { add(g, 'fail', 'create.html', null, `PEOPLE cast "${p.n}" not in characters.json`); continue; }
        for (const w of p.w || []) if (!c.job.includes(tok(w)))
          add(g, 'fail', 'create.html', null, `${p.n}: employer "${w}" not under job "${c.job}"`);
        if (p.b && !c.home.startsWith(p.b + ' '))
          add(g, 'fail', 'create.html', null, `${p.n}: building "${p.b}" != home "${c.home}"`);
        for (const o of p.owns || []) {
          if (!/landlord/.test(c.job)) add(g, 'fail', 'create.html', null, `${p.n}: owns "${o}" but job carries no landlord role`);
          if (!c.job.includes(o.split(' ')[0])) add(g, 'fail', 'create.html', null, `${p.n}: owns "${o}" not under job "${c.job}"`);
        }
      } else {
        const a = AJ.ambients.find(x => x.fullName === p.n || x.name === p.n);
        if (!a) { add(g, 'fail', 'create.html', null, `PEOPLE face "${p.n}" not in ambients.json`); continue; }
        for (const w of p.w || []) if (!a.venue.includes(tok(w)))
          add(g, 'fail', 'create.html', null, `${p.n}: employer "${w}" not under venue "${a.venue}"`);
        if (p.b) add(g, 'fail', 'create.html', null, `${p.n}: faces never carry a home address (b)`);
      }
    }
    if (castRows !== CJ2.cast.length)
      add(g, 'fail', 'create.html', null, `PEOPLE lists ${castRows} cast, characters.json has ${CJ2.cast.length} — every main must be on the card`);
    /* TAKEN_NAMES — every listed string must actually refuse under TAKEN */
    const tm = /var TAKEN = (\/[^/]+\/\w+);/.exec(html);
    const TRX = tm ? eval(tm[1]) : null;
    const nm = /var TAKEN_NAMES = (\{[\s\S]*?\});/.exec(html);
    const TN = nm ? eval('(' + nm[1] + ')') : {};
    const flat = ['cast', 'faces', 'roles'].reduce((a, k2) => a.concat(TN[k2] || []), []);
    if (!flat.length) add(g, 'fail', 'create.html', null, 'TAKEN_NAMES block not found or empty');
    if (TRX) for (const n of flat)
      if (!TRX.test(n)) add(g, 'fail', 'create.html', null, `TAKEN_NAMES "${n}" is shown as taken but TAKEN does not refuse it`);
    if ((TN.cast || []).length !== CJ2.cast.length)
      add(g, 'fail', 'create.html', null, 'TAKEN_NAMES.cast must list every main');
    if ((TN.faces || []).length !== AJ.ambients.length)
      add(g, 'fail', 'create.html', null, 'TAKEN_NAMES.faces must list every ambient first name');
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
      [/TAKEN/, 'local name registry'],
      [/names already taken on the block/, 'v49: taken-names fold'],
      [/namesBox/, 'v49: taken-names box'],
      [/work alongside/, 'v49: crew card'],
      [/building you\\u2019d land in|building you'd land in/, 'v49: neighbor card'],
      [/landlord of record/, 'v49: named-landlord line'],
      [/crew introduces itself on shift/, 'v49: honest empty-crew copy'],
      [/lands tonight/, 'v49: landing option'],
      [/Saturday morning/, 'v49: landing option'],
      [/Landing scheduled/, 'v49: landing pipeline stage'],
      [/lands <window>|lands '|lands " ?\+f\.landing/, 'v49: landing on the wire'],
      [/Registry entry — h/, 'v49: registry record card'],
      [/no secret fields exist on it/i, 'v49: record honesty line'],
      [/roster is full/, 'v49: slot-cap honesty'],
      [/surface ties, not friendships/, 'v49: FACES honesty'],
      [/peopleCard/, 'v49: people card helper'],
      [/keeps its place/, 'v63: queue persistence honesty'],
      [/withdraw the application — never billed/, 'v63: withdraw affordance'],
      [/renderQueue|resolvePending/, 'v63: queue handlers'],
      [/savePending/, 'v63: pending write on submit'],
      [/Goes by — optional/, 'v63: block-name field'],
      [/goescheck/, 'v63: block-name live check'],
      [/Day one — the keys/, 'v63: keys card'],
      [/MAILBOX/, 'v63: mailbox line'],
      [/RENT BOOK/, 'v63: rent-book line'],
      [/FIRST SHIFT/, 'v63: first-shift line'],
      [/Logistics, not a script/, 'v63: keys honesty line'],
      [/different reviewer, not a faster one/, 'v63: no-expedite honesty'],
      [/casting-office sketch/, 'v77: sketch honesty caption'],
      [/id="sketch"/, 'v77: sketch canvas on step 2'],
      [/id="sketch6"/, 'v77: sketch on the review card'],
      [/drawSketch/, 'v77: sketch renderer'],
      [/the card holds/, 'v77: seat count line'],
      [/hired faces/, 'v77: block-capacity vocabulary'],
      [/Join the seat waitlist — free/, 'v77: waitlist CTA'],
      [/rw_create_wait_v\d+/, 'v77: waitlist persistence'],
      [/Seat waitlist — in line, not in review/, 'v77: wait card head'],
      [/a seat offer never bills until you take it/, 'v77: never-billed-while-waiting honesty'],
      [/48 h/, 'v77: seat-offer expiry'],
      [/no way to pay for a sooner seat/, 'v77: no-paid-position honesty'],
      [/leave the waitlist/, 'v77: leave affordance'],
      [/renderWait|seatOpened/, 'v77: waitlist handlers'],
      [/saveWait/, 'v77: waitlist write on join'],
      [/meet on the block like anyone else/, 'v77: other-hire honesty'],
      [/a stranger, not a contact/, 'v77: briefing stranger line']
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
      `${DHOMES.length} homes · ${DPEOPLE.length} people (${castRows} cast) · ` +
      `${flat.length} taken names · schema v${CJ.version} · draft ${dk}`;
  } catch (e) { add(g, 'fail', 'creation.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G21 mod ============ */
{
  const g = gate('mod', 'moderation tooling (taxonomy agreement, corpus↔lab mirror, console whitelist, v36+v50+v64+v78 affordances)');
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
    if (RS.VERSION !== 'v50' || !(MJ.testing.engine_version || '').includes('v50'))
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
      [/flag roster/, 'v64 flag roster affordance'],
      [/Owner docket|owner docket/, 'v64 owner-docket block'],
      [/never monetized around/, 'v64 flags-never-public rule copy'],
      [/exportLedger|export ledger records/, 'v64 ledger export affordance'],
      [/mod_decision/, 'v64 canonical ledger record shape'],
      [/claimed_by/, 'v78 review-lock field'],
      [/releaseClaim|their call to make/, 'v78 claim/release affordance'],
      [/DIFFERENT-REVIEWER RULE|different-reviewer rule/i, 'v78 enforced appeal block'],
      [/Appeal workspace/, 'v78 appeal workspace card'],
      [/Handoff notes — internal only/, 'v78 handoff-notes surface'],
      [/never the feed or the ledger|never the feed, never the ledger/i, 'v78 notes visibility rule'],
      [/revSel|setReviewer/, 'v78 reviewer identity switcher'],
      [/by_reviewer/, 'v78 per-reviewer session stats'],
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
    /* 4b. v78 contract blocks present in moderation.json */
    for (const k of ['review_locks', 'appeal_workspace', 'handoff_notes', 'reviewer_stats'])
      if (!MJ[k]) add(g, 'fail', 'moderation.json', null, `v78 contract block "${k}" missing`);
    if (MJ.appeal_workspace && !/ENFORCED/.test(MJ.appeal_workspace.different_reviewer_rule || ''))
      add(g, 'fail', 'moderation.json', null, 'appeal_workspace must state the different-reviewer rule is enforced');
    /* seeded affordances the demo must keep reachable */
    if (!/claimed_by:'m\.chen'/.test(mc))
      add(g, 'fail', 'mod-console.html', null, 'no seeded claimed item — the lock state must be demoable');
    if (!/orig:\{when:/.test(mc))
      add(g, 'fail', 'mod-console.html', null, 'appeal seed missing orig decision card data');
    if (!/notes:\[\{t:/.test(mc))
      add(g, 'fail', 'mod-console.html', null, 'no seeded handoff note');
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
  const g = gate('harness', 'playtest harness self-contract (v51+v65+v76 marks, LS/build agreement, scenario integrity, surface coverage)');
  try {
    const html = rd('playtest.html');
    const H = PT.harness_ui_v76 || {};
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
        add(g, 'fail', 'playtest.html', null, `required harness mark missing: ${m}`);
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

/* ============ G23 apply ============ */
{
  const g = gate('apply', 'application layer contract (applications.json ↔ apply.html; live-opening coverage; channel agreement; game dollars only)');
  try {
    const AJ = JSONF('applications.json');
    const JJ = JSONF('jobs.json');
    const HJ = JSONF('housing.json');
    const MJ = JSONF('market.json');
    const html = rd('apply.html');
    /* deep mirror: inline APPS == applications.json (doc line exempt) */
    const m = html.match(/const APPS = (\{[\s\S]*?\n\});/);
    if (!m) throw new Error('inline APPS block not found');
    const INL = eval('(' + m[1] + ')');
    const strip = o => { const c = JSON.parse(JSON.stringify(o)); delete c.doc; return c; };
    if (JSON.stringify(strip(INL)) !== JSON.stringify(strip(AJ)))
      add(g, 'fail', 'apply.html', null, 'inline APPS != applications.json (hand-sync drift)');
    if (AJ.schema !== 'apps-v1')
      add(g, 'fail', 'applications.json', null, `schema "${AJ.schema}" != apps-v1`);
    /* no credit figures anywhere in this layer */
    for (const [f, txt] of [['applications.json', rd('applications.json')], ['apply.html', html]])
      for (const mm of txt.matchAll(/\b\d[\d,]*\s*cr\b/gi))
        add(g, 'fail', f, null, `credit figure in application layer: "${mm[0]}"`);
    /* bidirectional coverage: job_apps == live openings (openings !== 0) */
    const openJobs = JJ.jobs.filter(j => j.openings !== 0);
    const chans = new Set(Object.keys(MJ.channels));
    const seen = new Set();
    for (const a of AJ.job_apps) {
      const key = a.employer + '|' + a.role;
      if (seen.has(key)) add(g, 'fail', 'applications.json', null, `duplicate job_app ${key}`);
      seen.add(key);
      const job = openJobs.find(j => j.employer === a.employer && j.role === a.role);
      if (!job) { add(g, 'fail', 'applications.json', null, `job_app ${key} has no live jobs.json opening`); continue; }
      if (!chans.has(a.channel))
        add(g, 'fail', 'applications.json', null, `${key}: channel "${a.channel}" not declared in market.json`);
      const churn = MJ.churn.find(c => c.employer === a.employer && c.role === a.role);
      if (churn && churn.channel !== a.channel)
        add(g, 'fail', 'applications.json', null, `${key}: channel "${a.channel}" disagrees with churn "${churn.channel}"`);
      if (a.trial && a.trial.wage !== job.wage)
        add(g, 'fail', 'applications.json', null, `${key}: trial wage ${a.trial.wage} != jobs.json ${job.wage}`);
      for (const fld of ['apply', 'days'])
        if (!a[fld]) add(g, 'fail', 'applications.json', null, `${key}: missing "${fld}"`);
      if (!a.screen || !a.screen.who || !a.screen.watches)
        add(g, 'fail', 'applications.json', null, `${key}: screen needs who + watches`);
      if (!a.trial || !a.trial.shape || !a.trial.passes_on || !a.trial.fails_on)
        add(g, 'fail', 'applications.json', null, `${key}: trial needs shape + passes_on + fails_on`);
      if (a.trial && a.trial.paid === false && !/unpaid/i.test(a.trial.shape))
        add(g, 'fail', 'applications.json', null, `${key}: unpaid trial must say so plainly in shape`);
      if (!a.decline || !a.decline.voiced)
        add(g, 'fail', 'applications.json', null, `${key}: decline.voiced missing`);
    }
    for (const j of openJobs)
      if (!AJ.job_apps.find(a => a.employer === j.employer && a.role === j.role))
        add(g, 'fail', 'applications.json', null, `live opening ${j.employer} — ${j.role} has no job_app row`);
    /* housing keys ⊆ live unit_ids ∪ tier-* ladder keys */
    const hKeys = new Set(HJ.listings_live.map(l => l.unit_id)
      .concat(HJ.listings_ladder.map(t => 'tier-' + t.tier)));
    for (const h of AJ.housing_apps) {
      if (!hKeys.has(h.key))
        add(g, 'fail', 'applications.json', null, `housing_app key "${h.key}" is not a live unit or ladder tier`);
      for (const fld of ['label', 'viewing', 'shown_by', 'watches', 'fee', 'decision'])
        if (!h[fld]) add(g, 'fail', 'applications.json', null, `${h.key}: missing "${fld}"`);
      if (!Array.isArray(h.packet) || !h.packet.length)
        add(g, 'fail', 'applications.json', null, `${h.key}: packet must be a non-empty list`);
      if (!h.decline || !h.decline.voiced)
        add(g, 'fail', 'applications.json', null, `${h.key}: decline.voiced missing`);
    }
    /* decline bank covers every channel + voice used */
    const bank = AJ.decline_bank || {};
    for (const c of chans)
      if (!bank[c]) add(g, 'fail', 'applications.json', null, `decline_bank missing channel "${c}"`);
    for (const v of ['owner_direct', 'manager', 'roommates', 'spectator_note'])
      if (!bank[v]) add(g, 'fail', 'applications.json', null, `decline_bank missing "${v}"`);
    /* demo surface honesty: badge + never-spectate rule + no mutation calls */
    for (const [re, label] of [
      [/DEMO/, 'demo badge'],
      [/never carries an applicant/i, 'applicant privacy copy'],
      [/conditions, not scripts|Conditions, not scripts/, 'conditions-not-scripts copy']
    ]) if (!re.test(html)) add(g, 'fail', 'apply.html', null, `missing required copy: ${label}`);
    html.split('\n').forEach((ln, i) => {
      if (/\bXMLHttpRequest\b|\bfetch\(|gsRequest[A-Z]|gsPossess|gsAdmin|gsApply/i.test(ln))
        add(g, 'fail', 'apply.html', i + 1, `world-mutation call on the surface: ${ln.trim().slice(0, 100)}`);
    });
    g.detail = `schema ${AJ.schema} · ${AJ.job_apps.length} job rows · ${AJ.housing_apps.length} housing rows · ${Object.keys(bank).length - 1} decline voices`;
  } catch (e) { add(g, 'fail', 'applications.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G24 griev ============ */
{
  const g = gate('griev', 'grievance layer contract (grievances.json ↔ grievance.html; employer/building coverage; refs resolve; surface bar)');
  try {
    const GJ = JSONF('grievances.json');
    const html = rd('grievance.html');
    const m = html.match(/const GRJ = (\{[\s\S]*?\});\n/);
    if (!m) throw new Error('inline GRJ not found in grievance.html');
    const GRJ = eval('(' + m[1] + ')');
    if (JSON.stringify(GRJ) !== JSON.stringify(GJ))
      add(g, 'fail', 'grievance.html', null, 'inline GRJ drifted from grievances.json');
    if (GJ.schema !== 'grievance-v1')
      add(g, 'fail', 'grievances.json', null, `schema "${GJ.schema}" != grievance-v1`);

    const JJ = JSONF('jobs.json'), HJ = JSONF('housing.json'), BJ = JSONF('businesses.json');
    const bizIds = new Set(BJ.businesses.map(b => b.id));
    const orgIds = new Set((GJ.orgs || []).map(o => o.id));
    const CASTID = /[cC][1-8]|[aA](0[1-9]|1[0-9]|20)/;
    const CASTIDG = /[cC][1-8]|[aA](0[1-9]|1[0-9]|20)/g;
    const VALIDID = /^[cC][1-8]$|^[aA](0[1-9]|1[0-9]|20)$/;
    const BANNED = [/unfiltered/i, /secret/i, /\bseed/i, /possess/i, /\bcredit/i, /\bloan\b/i];
    const sweep = (fields, tag) => {
      for (const s of fields)
        for (const re of BANNED)
          if (re.test(String(s)))
            add(g, 'fail', 'grievances.json', null, `${tag}: "${String(s).slice(0, 60)}" breaches the surface bar (${re})`);
    };
    const earIds = (ear, tag) => {
      for (const tok of String(ear).match(CASTIDG) || [])
        if (!VALIDID.test(tok))
          add(g, 'fail', 'grievances.json', null, `${tag}: ear token "${tok}" is not a cast id`);
    };

    /* orgs: ids unique, venue_id resolves to an offstage business */
    for (const o of GJ.orgs || []) {
      const b = BJ.businesses.find(x => x.id === o.venue_id);
      if (!b) add(g, 'fail', 'grievances.json', null, `org ${o.id}: venue_id "${o.venue_id}" not a business`);
      else if (b.tier !== 'offstage')
        add(g, 'fail', 'grievances.json', null, `org ${o.id}: venue ${o.venue_id} tier "${b.tier}" — tables are offstage`);
      sweep([o.name, o.table, o.who_runs, o.what_they_do, o.bounds], `org ${o.id}`);
    }

    /* ladder: rungs 1..5 unique */
    const rungs = new Set((GJ.ladder || []).map(r => r.rung));
    for (const i of [1, 2, 3, 4, 5])
      if (!rungs.has(i)) add(g, 'fail', 'grievances.json', null, `ladder missing rung ${i}`);

    /* work rows: exactly one per distinct jobs.json employer */
    const employers = [...new Set(JJ.jobs.map(j => j.employer))];
    const seen = new Set();
    const wArch = new Set(Object.keys(GJ.work_archetypes || {}));
    const hArch = new Set(Object.keys(GJ.housing_archetypes || {}));
    for (const r of GJ.work || []) {
      if (seen.has(r.employer)) add(g, 'fail', 'grievances.json', null, `duplicate work row "${r.employer}"`);
      seen.add(r.employer);
      if (!employers.includes(r.employer))
        add(g, 'fail', 'grievances.json', null, `work row "${r.employer}" is not a jobs.json employer`);
      if (r.venue_id != null && !bizIds.has(r.venue_id))
        add(g, 'fail', 'grievances.json', null, `${r.employer}: venue_id "${r.venue_id}" is not a business`);
      if (r.paper_route != null && !orgIds.has(r.paper_route))
        add(g, 'fail', 'grievances.json', null, `${r.employer}: paper_route "${r.paper_route}" is not an org`);
      if (!Array.isArray(r.live_rungs) || !r.live_rungs.length || r.live_rungs.some(x => !rungs.has(x)))
        add(g, 'fail', 'grievances.json', null, `${r.employer}: bad live_rungs ${JSON.stringify(r.live_rungs)}`);
      for (const a of r.archetypes || [])
        if (!wArch.has(a)) add(g, 'fail', 'grievances.json', null, `${r.employer}: archetype "${a}" not in work_archetypes`);
      earIds(r.ear, r.employer);
      sweep([r.ear, r.usual_fix, r.bounds, r.texture], r.employer);
    }
    for (const e of employers)
      if (!seen.has(e)) add(g, 'fail', 'grievances.json', null, `employer "${e}" has no grievance row`);

    /* housing rows: every building_cards key covered; only ambient-ring extra */
    const bKeys = new Set(Object.keys(HJ.building_cards || {}));
    const hSeen = new Set();
    for (const r of GJ.housing || []) {
      if (hSeen.has(r.building_id)) add(g, 'fail', 'grievances.json', null, `duplicate housing row "${r.building_id}"`);
      hSeen.add(r.building_id);
      if (r.building_id !== 'ambient-ring' && !bKeys.has(r.building_id))
        add(g, 'fail', 'grievances.json', null, `housing row "${r.building_id}" is not a building_cards key`);
      if (r.paper_route != null && !orgIds.has(r.paper_route))
        add(g, 'fail', 'grievances.json', null, `${r.building_id}: paper_route "${r.paper_route}" is not an org`);
      for (const a of r.archetypes || [])
        if (!hArch.has(a)) add(g, 'fail', 'grievances.json', null, `${r.building_id}: archetype "${a}" not in housing_archetypes`);
      earIds(r.ear, r.building_id);
      sweep([r.ear, r.usual_fix, r.bounds, r.texture], r.building_id);
    }
    for (const k of bKeys)
      if (!hSeen.has(k)) add(g, 'fail', 'grievances.json', null, `building "${k}" has no grievance row`);

    /* feed shapes: the door, never the name — no cast id or name pattern in lines */
    const fs = GJ.feed_shapes || {};
    for (const l of (fs.housing || []).concat(fs.work_proposal || []))
      if (/<addr|<venue>/.test(l) === false && CASTID.test(l))
        add(g, 'fail', 'grievances.json', null, `feed line carries a name/id: "${l}"`);
    if (!/door/i.test(fs.contract || ''))
      add(g, 'fail', 'grievances.json', null, 'feed_shapes.contract must state the door-not-name rule');

    g.detail = `schema v${GJ.version} · ${(GJ.work || []).length} work · ${(GJ.housing || []).length} housing · ${orgIds.size} orgs`;
  } catch (e) { add(g, 'fail', 'grievances.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G23b exits ============ */
{
  const g = gate('exits', 'exit layer contract (exits.json ↔ exit.html; employer/building coverage; door-not-name feed shapes; game dollars only)');
  try {
    const XJ = JSONF('exits.json');
    const html = rd('exit.html');
    /* deep mirror: inline EXITS == exits.json (doc line exempt) */
    const m = html.match(/const EXITS = (\{[\s\S]*?\n\});/);
    if (!m) throw new Error('inline EXITS block not found in exit.html');
    const INL = eval('(' + m[1] + ')');
    const strip = o => { const c = JSON.parse(JSON.stringify(o)); delete c.doc; return c; };
    if (JSON.stringify(strip(INL)) !== JSON.stringify(strip(XJ)))
      add(g, 'fail', 'exit.html', null, 'inline EXITS != exits.json (hand-sync drift)');
    if (XJ.schema !== 'exits-v1')
      add(g, 'fail', 'exits.json', null, `schema "${XJ.schema}" != exits-v1`);
    /* no credit figures anywhere in this layer */
    const xtxt = rd('exits.json');
    for (const mm of xtxt.matchAll(/\b\d[\d,]*\s*cr\b/gi))
      add(g, 'fail', 'exits.json', null, `credit figure in exit layer: "${mm[0]}"`);
    /* every jobs.json employer covered exactly once */
    const JJ = JSONF('jobs.json');
    const empAll = new Set(JJ.jobs.map(j => j.employer));
    const seen = new Set();
    const BANNED = [/unfiltered/i, /secret/i, /\bseed/i, /possess/i, /\bcredit/i, /\bloan\b/i];
    const sweep = (fields, tag) => {
      for (const s of fields)
        for (const re of BANNED)
          if (re.test(String(s))) add(g, 'fail', 'exits.json', null, `${tag}: banned vocab (${re}) in "${String(s).slice(0, 60)}"`);
    };
    for (const r of XJ.work || []) {
      const tag = `work:${r.employer}`;
      if (seen.has(r.employer)) add(g, 'fail', 'exits.json', null, `duplicate work row "${r.employer}"`);
      seen.add(r.employer);
      if (!empAll.has(r.employer)) add(g, 'fail', 'exits.json', null, `work row "${r.employer}" is not a jobs.json employer`);
      if (typeof r.notice_days !== 'number' || r.notice_days < 0)
        add(g, 'fail', 'exits.json', null, `${tag}: notice_days must be a number ≥ 0 (0 = no boss to tell)`);
      for (const k of ['notice_to', 'last_shift', 'reference', 'stays', 'texture'])
        if (!r[k]) add(g, 'fail', 'exits.json', null, `${tag}: missing field "${k}"`);
      sweep([r.notice_to, r.last_shift, r.reference, r.stays, r.texture], tag);
    }
    for (const e of empAll)
      if (!seen.has(e)) add(g, 'fail', 'exits.json', null, `employer "${e}" has no exit row`);
    /* every housing.json building_cards key + ambient-ring covered once */
    const HJ = JSONF('housing.json');
    const bKeys = new Set(Object.keys(HJ.building_cards || {}));
    bKeys.add('ambient-ring');
    const hSeen = new Set();
    for (const r of XJ.housing || []) {
      const tag = `housing:${r.building_id}`;
      if (hSeen.has(r.building_id)) add(g, 'fail', 'exits.json', null, `duplicate housing row "${r.building_id}"`);
      hSeen.add(r.building_id);
      if (!bKeys.has(r.building_id)) add(g, 'fail', 'exits.json', null, `${tag}: not a building_cards key or ambient-ring`);
      const registry = r.building_id !== 'ambient-ring' && r.building_id !== 'bld-m9102';
      if (registry && r.notice_days !== 30)
        add(g, 'fail', 'exits.json', null, `${tag}: registry units carry the 30-day notice norm`);
      if (registry && r.deposit_clock_days !== 21)
        add(g, 'fail', 'exits.json', null, `${tag}: deposit clock is 21 days (lease layer agreement)`);
      for (const k of ['turnover_scope', 'relist', 'texture'])
        if (!r[k]) add(g, 'fail', 'exits.json', null, `${tag}: missing field "${k}"`);
      sweep([r.turnover_scope, r.relist, r.texture], tag);
    }
    for (const k of bKeys)
      if (!hSeen.has(k)) add(g, 'fail', 'exits.json', null, `building "${k}" has no exit row`);
    /* feed shapes: the door, never the name — no cast id or name pattern */
    const CASTID = /[cC][1-8]|[aA](0[1-9]|1[0-9]|20)/;
    const fs = XJ.feed_shapes || {};
    for (const l of (fs.work || []).concat(fs.housing || []))
      if (!/<addr|<venue>/.test(l) && CASTID.test(l))
        add(g, 'fail', 'exits.json', null, `feed line carries a name/id: "${l}"`);
    if (!/door/i.test(fs.contract || ''))
      add(g, 'fail', 'exits.json', null, 'feed_shapes.contract must state the door-not-name rule');
    if (!Array.isArray(fs.never) || !fs.never.length)
      add(g, 'fail', 'exits.json', null, 'feed_shapes.never list missing');
    /* exit-kind catalogs declared */
    for (const cat of ['job_exit_kinds', 'housing_exit_kinds'])
      for (const k of Object.keys(XJ[cat] || {}))
        if (!/^[a-z_]+$/.test(k)) add(g, 'fail', 'exits.json', null, `bad ${cat} key "${k}"`);
    g.detail = `schema v${XJ.version} · ${(XJ.work || []).length} work · ${(XJ.housing || []).length} housing`;
  } catch (e) { add(g, 'fail', 'exits.json', null, 'parse/check failure: ' + e.message); }
}

/* ============ G24 book ============ */
{
  const g = gate('book', 'booking layer contract (bookings.json ↔ book.html ↔ request.html BOOKW; no repricing; feed-vocabulary reuse)');
  try {
    const BJ = JSONF('bookings.json');
    const bhtml = rd('book.html');
    const rhtml = rd('request.html');
    const RJ = JSONF('requests.json');
    /* deep mirror: inline BOOK == bookings.json (doc keys exempt anywhere) */
    const m = bhtml.match(/const BOOK = (\{[\s\S]*?\n\});/);
    if (!m) throw new Error('inline BOOK block not found in book.html');
    const INL = eval('(' + m[1] + ')');
    const strip = o => JSON.parse(JSON.stringify(o, (k, v) => k === 'doc' ? undefined : v));
    if (JSON.stringify(strip(INL)) !== JSON.stringify(strip(BJ)))
      add(g, 'fail', 'book.html', null, 'inline BOOK != bookings.json (hand-sync drift)');
    if (BJ.schema !== 'book-v1')
      add(g, 'fail', 'bookings.json', null, `schema "${BJ.schema}" != book-v1`);
    /* no prices on the Book — a time slot is not an upgrade */
    for (const [f, txt] of [['bookings.json', rd('bookings.json')], ['book.html', bhtml]])
      for (const mm of txt.matchAll(/\b\d[\d,]*\s*cr\b|\$\d/gi))
        add(g, 'fail', f, null, `price figure on the Book: "${mm[0]}"`);
    /* bookable ⊆ exclusive actions; booking block agreement in requests.json */
    const excl = new Set((RJ.actions || []).filter(a => a.class === 'exclusive').map(a => a.id));
    for (const b of BJ.rules.bookable || [])
      if (!excl.has(b)) add(g, 'fail', 'bookings.json', null, `bookable "${b}" is not an exclusive action`);
    const BK = RJ.booking || {};
    if (JSON.stringify(BK.bookable) !== JSON.stringify(BJ.rules.bookable) ||
        BK.horizon_h !== BJ.rules.horizon_h || BK.slot_min !== BJ.rules.slot_min)
      add(g, 'fail', 'requests.json', null, 'booking block drifted from bookings.json rules');
    /* claim keys resolve: resources ⊆ request.html CLAIMS keys */
    const resClaims = new Set();
    for (const r of BJ.resources || []) {
      resClaims.add(r.claim);
      if (!rhtml.includes(`'${r.claim}':`))
        add(g, 'fail', 'bookings.json', null, `resource claim "${r.claim}" has no CLAIMS key in request.html`);
      for (const b of r.bookable || [])
        if (!excl.has(b)) add(g, 'fail', 'bookings.json', null, `resource "${r.claim}" bookable "${b}" not exclusive`);
    }
    for (const w of BJ.windows || []) {
      if (!resClaims.has(w.claim)) add(g, 'fail', 'bookings.json', null, `window on undeclared claim "${w.claim}"`);
      if (!/^\d{2}:\d{2}$/.test(w.start)) add(g, 'fail', 'bookings.json', null, `window start "${w.start}" off HH:MM`);
      if (!(w.min > 0)) add(g, 'fail', 'bookings.json', null, `window "${w.what}" has no positive min`);
      if (!w.who || !w.what) add(g, 'fail', 'bookings.json', null, 'window missing holder handle or label');
    }
    /* request.html BOOKW mirrors bookings.windows (claim/start/min/who/what) */
    const wm = rhtml.match(/var BOOKW = (\[[\s\S]*?\]);/);
    if (!wm) add(g, 'fail', 'request.html', null, 'BOOKW block not found');
    else {
      const W = eval('(' + wm[1] + ')');
      const key = w => [w.claim, w.start, w.min, w.who, w.what].join('|');
      const a = W.map(key).sort(), b = (BJ.windows || []).map(key).sort();
      if (JSON.stringify(a) !== JSON.stringify(b))
        add(g, 'fail', 'request.html', null, 'BOOKW != bookings.json windows (hand-sync drift)');
    }
    /* feed shapes reuse the locked vocabulary — booking mints no status */
    const vocab = new Set(RJ.feed_vocabulary || []);
    for (const s of (BJ.feed_shapes || {}).statuses || [])
      if (!vocab.has(s)) add(g, 'fail', 'bookings.json', null, `feed status "${s}" not in feed_vocabulary`);
    if (!Array.isArray(BJ.feed_shapes.never) || !BJ.feed_shapes.never.length)
      add(g, 'fail', 'bookings.json', null, 'feed_shapes.never list missing');
    /* honesty copy + picker surfaces */
    for (const [f, txt, musts] of [
      ['book.html', bhtml, [/the book is public/i, /not an upgrade/i, /never skippable/i,
                            /full refund/i, /first-come-first-served|FCFS/i]],
      ['request.html', rhtml, [/whenRow/, /\bwsel\b/, /bkSlots/, /soonest free window/i,
                               /not an upgrade/i, /cancel free until it starts/i,
                               /Book it —/, /booked window arrived/i, /startMin/, /gsViewerState\(\)\.calendar|vs\.calendar/]]
    ]) for (const re of musts)
      if (!re.test(txt)) add(g, 'fail', f, null, `missing booking surface ${re}`);
    /* dark-pattern sweep on the calendar surface */
    for (const re of [/only \d+ (slots?|left)/i, /\bhurry\b/i, /act now/i, /premium slot/i,
                      /don'?t miss/i, /offer ends/i, /\bbid(?:ding)?\b/i])
      bhtml.split('\n').forEach((ln, i) => {
        if (re.test(ln)) add(g, 'fail', 'book.html', i + 1,
          `dark-pattern vocabulary ${re}: ${ln.trim().slice(0, 100)}`);
      });
    g.detail = `schema v${BJ.version} · ${(BJ.resources || []).length} claims · ${(BJ.windows || []).length} seeded windows`;
  } catch (e) { add(g, 'fail', 'bookings.json', null, 'parse/check failure: ' + e.message); }
}

/* ---------- report ---------- */
for (const g of out.gates) {
  if (g.status === 'fail') out.fails++;
  else if (g.status === 'review') out.reviews++;
  else out.passes++;
}
out.build = 'world v77 local';
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
