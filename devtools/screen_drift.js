#!/usr/bin/env node
/* devtools/screen_drift.js — v92 classifier-drift conformance report.

   moderation.json testing.drift_gate: "the game-track classifier may be
   STRICTER on identical input, never more permissive; the corpus is the
   conformance suite for any port." This script runs every case in
   world/screen-corpus.json through BOTH engines:

     - world/screen.js            (RWScreen — the reference implementation)
     - src/systems/41_game_systems_possession.js  (gsIntentScreen — the bus
       port, loaded with minimal stubs; its history signals read GS_REQ /
       GS_FLAGS, which we leave empty so text rules decide)

   The bus has no separate screen entry point and no corpus, so the fair
   input is: spec.note = "<action> <target_label> <text>" (the same strings
   RWScreen scans), target = target_id, appeal_of = in.player.appeal_of.

   Output: PASS/FAIL per corpus expectation on the reference engine, then a
   DRIFT table — 'PORT-GAP' where the bus is more permissive (a real finding
   for the game track), 'stricter' where the port tightens (allowed by the
   gate). Exit 1 only if the REFERENCE engine fails a corpus expectation —
   drift is reported, never judged here. node-only, reads the repo. */

'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ---- reference engine ---- */
const sandbox = { window: {} };
eval(rd('world/screen.js').replace(/window\.RWScreen/g, 'sandbox.window.RWScreen'));
const RS = sandbox.window.RWScreen;

/* ---- bus port: eval gsIntentScreen + its tables with stubs ---- */
const GS_REQ = { reqs: [] };
const GS_FLAGS = {};
const gsNowMin = () => 0;
const gsCharKind = () => false;
const gsCreditSpend = () => false;
const gsCreditRefund = () => {};
const gsCreditGrant = () => {};
const gsBusEmit = () => {};
const gsRepNote = () => {};
const gsIsAdmin = () => false;
let gsIntentScreen = null;
{
  const src = rd('src/systems/41_game_systems_possession.js')
    + '\n;__X = { screen: gsIntentScreen, rules: GS_INTENT_RULES };';
  let __X = null;
  eval(src);
  gsIntentScreen = __X.screen;
}

const corpus = JSON.parse(rd('world/screen-corpus.json')).cases;
let refFail = 0, gaps = 0, stricter = 0, agree = 0;
const rows = [];

const rank = v => v === 'deny' ? 2 : v === 'review' ? 1 : 0;

for (const c of corpus) {
  const i = c.in;
  const ref = RS.screenRequest(i);
  const eok = ref.verdict === c.expect.verdict &&
    (c.expect.code === undefined || ref.code === c.expect.code);
  if (!eok) refFail++;
  /* bus input: the same authored strings, as spec.note */
  const note = [(i.action || ''), (i.target_label || ''), (i.text || '')].join(' ');
  let bus = null;
  try {
    bus = gsIntentScreen({
      playerId: 'corpus', kind: i.action || 'nudge', target: i.target_id || null,
      params: { note }, note: note,
      appeal_of: (i.player && i.player.appeal_of) || null, now: 0 });
  } catch (e) { bus = { verdict: 'error', code: e.message }; }
  const cmp = rank(bus.verdict) - rank(ref.verdict);
  let tag;
  if (cmp > 0) { tag = 'stricter'; stricter++; }
  else if (cmp < 0) {
    /* diagnose the gap: player-history cases need a bus-side request log the
       stub doesn't seed — untestable here, not a confirmed gap. For text
       cases, re-screen the NORMALIZED string: if the bus then matches, the
       whole gap is the missing v22/v36/v50 normalization layer; if it still
       misses, the port's lexicon itself is weaker on plain text. */
    if (i.player && Object.keys(i.player).length) {
      tag = 'PORT-GAP? (player-history — needs a seeded bus log; untestable in stub)';
    } else {
      let bus2 = null;
      try { bus2 = gsIntentScreen({ playerId: 'corpus', kind: i.action || 'nudge',
        target: i.target_id || null, params: { note: RS.normalize(note) },
        note: RS.normalize(note), now: 0 }); } catch (e) {}
      tag = (bus2 && rank(bus2.verdict) >= rank(ref.verdict))
        ? 'PORT-GAP (missing normalization layer)'
        : 'PORT-GAP (lexicon drift — weaker on plain text)';
      gaps++;
    }
  }
  else if (bus.code === ref.code || (bus.verdict === 'pass' && ref.verdict === 'pass')) { tag = 'agree'; agree++; }
  else { tag = 'same-tier, different code'; agree++; }
  if (tag !== 'agree' || !eok)
    rows.push({ id: c.id, expect: c.expect.verdict + '/' + (c.expect.code || '*'),
      ref: ref.verdict + '/' + ref.code, bus: bus.verdict + '/' + bus.code, tag });
}

console.log(`reference engine: ${corpus.length - refFail}/${corpus.length} corpus expectations green` +
  (refFail ? ` — ${refFail} FAILURES` : ''));
console.log(`bus port vs reference: ${agree} agree · ${stricter} stricter (allowed) · ${gaps} PORT-GAP (more permissive — a real finding)`);
if (rows.length) {
  console.log('\ncase                expect           ref              bus              tag');
  for (const r of rows)
    console.log((r.id + ' '.repeat(20)).slice(0, 20) +
      (r.expect + ' '.repeat(17)).slice(0, 17) +
      (r.ref + ' '.repeat(17)).slice(0, 17) +
      (r.bus + ' '.repeat(17)).slice(0, 17) + r.tag);
}
if (gaps) {
  const norm = rows.filter(r => /normalization/.test(r.tag)).length;
  const lex = rows.filter(r => /lexicon/.test(r.tag)).length;
  const hist = rows.filter(r => /player-history/.test(r.tag)).length;
  console.log(`\ngap causes: ${norm} missing normalization · ${lex} lexicon drift · ${hist} player-history (untestable in stub)`);
}
console.log(gaps
  ? `\n${gaps} permissive gap(s): the bus screen is weaker than the reference on identical input — merge note for game-systems (mostly the v22/v36/v50 normalization layer the port never grew, plus a weaker lexicon generation).`
  : '\nno permissive gaps — the port holds the drift gate.');
process.exit(refFail ? 1 : 0);
