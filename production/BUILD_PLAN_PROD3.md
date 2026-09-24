# PRODUCTION-3 — Build Plan

## Pinned SHAs (deterministic snapshot — mid-build commits ignored)

| Branch | SHA | Version |
|---|---|---|
| sf/production-2 (base) | 1dfc981ae227e53dd2bd1df681a380733f5f4964 | prod-2 smoke evidence |
| sf/game-systems | ff6266d4fba1412761477c012f9545a79f68881c | game v18 (gate: > v17 ✓) |
| sf/world | a87e9f64e9233332b86b8778a1bf7775c43beff1 | world v134 (gate: > v116 ✓) |
| sf/full-neighborhood | 4acd5c2e6121190bd2688630e2221b4e3719762d | art v86 (gate: > v82 ✓) |
| sf/marketing | 567f3c756fd35df74156f5e18e7d89ed6c0f0aa0 | mkt v193 (gate: > v167 ✓) |
| sf/memory | 31a8a61cb83a70d1b1107179459ac723fd9ffd1b | memory v143 (gate: > v123 ✓) |

Direction gate: all five input tips pass (art v86>82, game v18>17, mkt v193>167, memory v143>123, world v134>116).

## Per-track readiness

- **game v18** — the errand layer: `41_game_systems_errands.js` (possession
  verbs, session trail, extend meter, 1.5cr/min card) + request/registry
  updates. **Also ships `41_game_systems_assessor.js` — county parcel
  roll, Prop-13 assessed values, secured-roll tax bills. This is the
  banned real-estate administration: it is dropped from production-3.**
  All callers are `typeof … === 'function'` guarded, so the module is
  safely removable; saves then carry `assessor: null`.
- **world v134** — content/names/ambients under `world/` incl.
  moderation-tooling ("ruled alike" precedent layer), wire/onboarding/
  request/lease UI+JSON, promoted residents.
- **art v86** — `32_sf_render.js` major rework ("The Great Lawn"),
  camera tweaks, devtools shoot scripts.
- **mkt v193** — `marketing/` additive: site, press kit, trailer assets,
  moderation-plan realignment.
- **memory v143** — `memory/` research docs (validation-design XII,
  consequence continuity). Docs only — honest wiring note in PRODUCTION.md.

## Conflicts foreseen

Only `willowbrook_natura.html` / `willowbrook_natura_test.html` are touched
by two tracks (game + art). Both are generated bundles: resolve by keeping
the merged `src/` and rebuilding — never hand-merge bundle text.
All other changes are disjoint by path (verified via diff --name-only).

Precedence: game-systems wins systems/bus/ledger; world wins data/names;
art wins rendering; marketing additive under `marketing/`; memory under `memory/`.

## Real-estate excision (Astra direction)

1. `git rm src/systems/41_game_systems_assessor.js` after the game merge.
2. Remove its line from `src/_order.txt` (line 95) and MANIFEST entry.
3. Strip the assessor/tax/parcel test block from
   `src/tests/41_game_systems_autotest.js` (~26 refs).
4. Rebuild bundle; grep `PARCEL|parcel|taxBill|TaxRoll|assessor` must return
   nothing live (stub-documented hits allowed only in comments/changelog).
5. Housing stays minimal: leases/registry/possession only.

## What production-3 contains / acceptance checklist

- [ ] One runnable product: `production/index.html` front door → hub.html
      (`?sf=1`), Mission/Dolores render, 8 mains on brain contract, Wire,
      request submission, ledger movement, multi-camera spectator.
- [ ] No parcel-assessment/property-tax machinery (grep clean).
- [ ] Consequence continuity: commitments/promises with fulfillment-vs-breach
      memory; verify via tests + playtest grade.
- [ ] Catalytic actions: hook → bounded action → observable consequence,
      delivery/refusal/refund tested; intervention log readable.
- [ ] Observation editor pieces present or honest stubs documented.
- [ ] Possession ban on 8 mains tested (owner included).
- [ ] Brain contract green: ladder fallthrough (no sfSched for mains),
      directive lapse → intention_gap, outcome feedback, tier routing,
      rate caps.
- [ ] No real-payment paths; parody business names only.
- [ ] Headless Chromium smoke: 0 console errors, screenshots in
      `production/smoke/`.
- [ ] 8-agent playtest evidence in `production/playtest/`.
- [ ] No file > 10 MB in tree.
- [ ] `PRODUCTION.md` at root with SHAs, evidence, stubs, run commands.
