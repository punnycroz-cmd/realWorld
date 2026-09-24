# Press Kit — changelog / freshness record

Newest first. Journalists: the screenshot filenames encode the renderer
build they were captured from (v83-* is the current development build).

## v181 — 2026-09-24
- Screenshots rebased v81→**v83** (art's roof-catalog pass: flat roofs
  bake a deterministic furniture/deck/penthouse-pop-up catalog in world
  meters, projected identically in overhead and street views; pitched
  ridges gain widow's-walk cresting + hip-apex finials. v82 between them
  was an invisible perf pass — frame-scoped field memoization, street
  render ~halved). Site gallery/index/demo/press-kit/sitemap, kit
  screenshots + webp (PIL q82) swapped; README, captions, manifest,
  fact-sheet, whats-new (v83 + v82 bullets, count 17→19), deadline-desk,
  b-roll, one-sheet, embargo-briefing, awards, pitch-emails refs updated;
  v81 shots demoted to the gallery archive (files kept in site/shots/).
- `screenshots/v83-C.png` (2.23MB) breaches the 2MB PNG ceiling —
  webp-only `<img>` on the site per the v135 rule; PNG ships in the
  kit as a full-size download.
- Demo page fallback deck + "label the shot" marker sets moved to the
  v83 frames (positions re-checked against the new captures).

## v167 — 2026-09-24
- Screenshots rebased v80→**v81** (art's coverage-grammar pass:
  follow-cam look-room pan off smoothed lateral velocity, two-shot
  composer with boom widen + amber partner brackets + 2-SHOT flag,
  gust buffeting scaled by lens exposure × crosswind, director thirds
  grid + center cross on `SF_CAM.guides` (H key), viewfinder strip
  reading EV/compass/height, feed switching that glides instead of
  snapping). Site shots, kit screenshots swapped; captions, README,
  manifest, fact-sheet, index, contact-sheet, deadline-desk, b-roll,
  one-sheet, embargo-briefing, awards-festivals, pitch-emails,
  whats-new, alt-text, store-copy, store preview, checklist refs
  updated; `make_brand_assets.py` SHOT pin repointed to v81-D; v80
  shots demoted to the gallery archive (files kept in site/shots/).
- `screenshots/v81-C.png` (2.23MB) breaches the 2MB PNG ceiling —
  webp-only `<img>` on the site per the v135 rule; PNG ships in the
  kit as a full-size download.
- NEW `ai-transparency.md` — AI disclosure one-pager: what's
  AI-driven (resident minds, request classification), what isn't
  (visuals, writing, audio, your data), the control rules, storefront
  AI-disclosure field answers, and red lines for coverage.

## v166 — 2026-09-24
- Screenshots rebased v76→**v80** (art shipped two passes mid-version:
  v79 rooftop murals + wind-blown roofscape, then v80 — a raymarched
  sky-visibility field through building masses and crown volumes:
  building-scale shade pools on the park's east edge, crown-shadow
  dapple on the lawns, props/residents self-shadow and pick up skylight
  fill only from open sky). Site shots, kit screenshots, key art,
  og-card, banners rebaked on v80-D; captions, README, manifest,
  fact-sheet, index, contact-sheet, deadline-desk, b-roll, one-sheet,
  embargo-briefing, whats-new, alt-text, store-copy refs updated; v76
  shots demoted to the gallery archive section (files kept in
  site/shots/).
- `screenshots/v80-C.png` (2.24MB) breaches the 2MB PNG ceiling —
  webp-only `<img>` on the site per the v135 rule; PNG ships in the
  kit as a full-size download.

## v152 — 2026-09-24
- Screenshots rebased v75→**v76** (crepuscular lanes — each cloud
  throws a warm volumetric streak from its body to the sun-gap it
  shades, landing on lawns in the top view and dying in a warm splash
  on facades in director mode; silver-lining rim arcs on every cloud
  dome; carries v75 living walls + meadow drifts + gust field
  underneath). Site shots, kit screenshots, key art, og-card, banners,
  store capsules rebaked on v76-D; captions, README, manifest,
  fact-sheet, index, contact-sheet, deadline-desk, b-roll, one-sheet,
  embargo-briefing refs updated; v75 shots demoted to the gallery
  archive section (files kept in site/shots/).
- NEW kit documents: `quotes-boilerplate.md` (approved first-party
  team quotes + boilerplate in three lengths), `pitch-emails.md`
  (per-desk outreach drafts — templates only, nothing sent),
  `awards-festivals.md` (submission target calendar).
- `whats-new.md` extended: arc now covers v53→…→v74→v75→v76.
- `screenshots/v76-C.png` (2.25MB) breaches the 2MB PNG ceiling —
  webp-only `<img>` on the site per the v135 rule; PNG ships in the
  kit as a full-size download.


## v151 — 2026-09-24
- Screenshots rebased v71→**v75** (living walls — ivy and
  bougainvillea strands on residential fronts with sun-warmed magenta
  bracts and trailing balcony gardens; poppy/lupine meadow decal
  drifts on free grass; and a traveling gust field — the wind crest
  advects downwind through trees and facades as one wave; carries the
  v72 declared-material facades, v73 sidewalk wear, v74 laundry-line
  cloth sim underneath).
  Site shots, kit screenshots, key art, og-card, banners, store
  capsules rebaked on v75-D; captions, README, fact-sheet, index,
  contact-sheet, deadline-desk, b-roll, one-sheet, embargo-briefing
  refs updated.
- `whats-new.md` extended: arc now covers v53→…→v71→v72→v73→v74→v75.
- `screenshots/v75-C.png` (2.04MB) breaches the 2MB PNG ceiling —
  webp-only `<img>` on the site per the v135 rule; PNG ships in the
  kit as a full-size download.

## v143 — 2026-09-24
- Screenshots rebased v67→**v71** (the dollhouse pass + block
  shadows: inspect a resident indoors and their building ghosts open
  into a real floor plan — door-anchored rooms, per-archetype floors
  and furniture, party walls, sun patch, lamp pools after dark; and the
  top view now throws per-building swept shadows with AO contact
  skirts, so the block sits on the ground; carries v68 PiP rig monitor,
  v69 canopy dapple, and the v67 lens rebuild underneath).
  Site shots, kit screenshots, key art, og-card, banners, store capsules
  rebaked; captions, README, fact-sheet, index, contact-sheet,
  deadline-desk, b-roll, one-sheet, embargo-briefing refs updated.
- `whats-new.md` extended: arc now covers v53→…→v67→v68→v69→v70→v71.

## v137 — 2026-09-23
- NEW `coverage-log.md` — post-launch coverage tracker: per-piece ledger,
  misstated-claims checklist, corrections-sent + inbound-contact tables.
- NEW integrity gate `tools/press_kit_check.py` — manifest↔disk↔captions↔
  index-link↔zip parity; first run caught 8 gaps, all fixed (captions now
  name every asset file individually, incl. logo rasters, mono lockup,
  and the v67 webp companions; manifest self-declares).

## v136 — 2026-09-23
- Screenshots rebased v65→**v67** (the lens rebuild: lateral chromatic
  fringing, scanline blur, and film grain retired; vignette softened;
  one weather-driven visibility number now drives haze, the horizon
  marine band, and the skyline veil — a cleaner frame at ~5 fewer
  full-frame passes; carries art-v66's crown-genome trees — turned by
  the in-world calendar, flipped per instance — with autumn leaf-fall
  drifting over the block).
  Site shots, kit screenshots, key art, og-card, banners, store capsules
  rebaked; captions, README, fact-sheet, index, contact-sheet,
  deadline-desk, b-roll, one-sheet, embargo-briefing refs updated.
- `whats-new.md` extended: arc now covers v53→v55→v56→v59→v61→v65→v67.

## v128 — 2026-09-23
- Screenshots rebased v61→**v65** (the street dresses up: parklets in
  the parking lane, bin rows, papel-picado garlands and porch flags on
  the facades — all wind-driven; carries v64's cast-iron tree grate
  wells + sidewalk utility lids and the v63 wall-impostor atlas
  underneath — same painted facades, roughly half the canvas-ops per
  frame).
  Site shots, kit screenshots, key art, og-card, banners, store capsules
  rebaked; captions, README, fact-sheet, index, contact-sheet,
  deadline-desk, b-roll, one-sheet, embargo-briefing refs updated.
- `whats-new.md` extended: arc now covers v53→v55→v56→v59→v61→v65.

## v122 — 2026-09-23
- Screenshots rebased v55→**v61** (weather you can see coming: patchy
  Karl fog, distant cumulus shower cells with wind-leaned rain shafts
  and virga on the skyline, fog-drip pavement wetting, and the
  re-framed Dolores overlook — perimeter streets and facades ring the
  lawns). Site shots, kit screenshots, key art, og-card, banners, and
  store capsules rebaked; captions, README, fact-sheet, index,
  contact-sheet, deadline-desk, b-roll refs updated.
- NEW `one-sheet.html` — single-page printable sell sheet (Print → PDF).
- NEW `embargo-briefing.md` — long-lead pre-brief book for coverage
  under embargo: the two-hour embargo session plan, what's on and off
  the record, embargo terms.
- NEW `review-guide.md` — how to review a spectator sim: a self-guided
  30-minute / 90-minute / one-evening watch plan with what to look for
  and the traps to avoid.
- `whats-new.md` extended: arc now covers v53→v55→v56→v59→v61.

## v107 — 2026-09-23
- Screenshots rebased v53→**v55** (the September turn: contour-following
  mow stripes on the Dolores lawns, autumn crown sets — ginkgo gold,
  rust, wine — gust-driven leaf-fall and sidewalk litter, fallen palm
  fronds; includes the v54 facade dressing: window boxes, AC sleeves,
  Juliet rails, house numbers, stoop pots, A-boards). Site shots, kit
  screenshots, key art, banners, og-card, store capsules rebaked;
  captions, README, fact-sheet, index, contact-sheet, deadline-desk,
  b-roll refs updated.
- NEW `whats-new.md` — build-highlights sheet covering the v53→v54→v55
  arc so press can write "what changed" pieces without archaeology.

## v100 — 2026-09-23
- Screenshots rebased v51→**v53** (curb-edge street furniture — hydrants,
  trash cans, news boxes, bike racks — plus picnic-blanket lawns in the
  park shots; same four framings, autumn 16:30 pin). Site shots, kit
  screenshots, key art, banners, og-card, store capsules rebaked;
  captions, README feature list, and social alt-text table updated.

## v92 — 2026-09-23
- NEW `deadline-desk.md` — the 15-minute coverage path for journalists on
  deadline: three checkable facts, a verbatim-safe paragraph, the three
  images that carry a piece, the five mistakes to avoid, and the
  corrections policy.
- NEW `contact-sheet.html` — printable visual index of every image asset
  in the kit (screenshots, key art, logos, badges, banners) with exact
  filenames; Print → PDF works.
- Fixed v91 drift: `manifest.json`, `fact-sheet.html`, and
  `b-roll-shotlist.md` still said v50 — now all references match the
  v53 screenshots actually in `screenshots/`.

## v91 — 2026-09-23
- Screenshots rebased to renderer build **v53** (specular window glints,
  lamplit spill, eave-shadow band — same framings as v50). Site shots,
  kit screenshots, key art, banners, og-card rebaked; new site gallery
  page. (Manifest/fact-sheet/b-roll text refs caught up in v92.)

## v78 — 2026-09-24
- Screenshots rebased to renderer build **v50** (lived-in ground line:
  areaway lightwells + iron railings, toter bins with sun shadows,
  garage-door throwies and buff patches, cornice pigeons — same framings
  and weather pins as v47). Site shots, kit screenshots, key art, banners,
  og-card, store capsules rebaked; captions and README updated.

## v77 — 2026-09-24
- Screenshots rebased to renderer build **v47** (sunbreak light field:
  lanes of full sun between scattered-cumulus shade streets, crepuscular
  fan 5→7 wedges). Site shots, kit screenshots, key art, banners, og-card,
  store capsules rebaked; captions updated.
- NEW `media-alert.md` — 120-word launch-day "it's live" notice (distinct
  from the full release; send rules included).
- NEW `interview-prep.md` — spokesperson sheet: five talking points,
  bridges, red lines (internal; not for distribution).
- NEW this changelog; `build-press-kit.sh` now ships .webp companions in
  `screenshots/` so the manifest matches the zip.
- Still placeholders: studio name, press@/hello@, handles, founder quote,
  release date, final domain.

## v76 — 2026-09-24
- Screenshots rebased v44→v46 (crown-registry tree shadows). Full asset
  rebake; trailer EDL + animatics rebuilt.

## v62 — 2026-09-23
- Added `context.md` (endorsed comparisons), `guided-tour.md` (10-minute
  preview run sheet), `b-roll-shotlist.md` (video-press capture guide).

## v32 — earlier
- Added `copy-deck.md` (approved wording) + `creator-notes.md` (streamer
  guide); index.html fast-facts strip + social-banners gallery.

## v0–v3 — 2026-09-22
- Kit created: logos, key art, screenshots, fact-sheet.html, index.html
  offline hub, manifest, captions, license; first zip build.
