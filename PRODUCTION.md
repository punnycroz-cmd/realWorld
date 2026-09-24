# PRODUCTION-2 — Real World: The Mission (the becoming-AI build)

Production-1's living Mission block PLUS the unified AI brain: the 8
mains run on the real brain contract (order + directive per filing,
mandatory in-fiction `why`), event-driven dispatch with T0/T1/T2 tier
routing, the two-party conversation channel, armed intents, the visible
`intention_gap`, and the daily reflect. 28 residents, real
request/review/ledger/housing/hiring/Wire systems, a multi-camera
spectator shell, and the agent bridge the mandated 8-agent playtest
drives. **Local only — no deploy, no accounts, no payments, nothing
pushed.**

## Run it

```bash
cd /home/hatch/workspace/world-sim-production-2
python3 production/build_production.py        # rebuild hub.html from the bundle
# then open in Chromium:
file:///home/hatch/workspace/world-sim-production-2/production/index.html   # front door
file:///home/hatch/workspace/world-sim-production-2/production/hub.html     # the hub
```

`hub.html` auto-appends `?sf=1` if opened bare (SF scenario gate). No
server is needed; everything is file://-safe. A local HTTP endpoint is
used only by the playtest driver (127.0.0.1:8797, per-run, never shipped).
The marketing pitch site (`marketing/site/index.html`) links into the
local hub; the front door links back.

## The brain contract (what's live)

- **Every act needs a why** (`src/sf/36_sf_agent.js`): a brain filing is
  `{act, directive, reason}` — an order the engine executes plus a
  will (`directive.verb`, bounded `holdH ≤ 2` / `untilH ≤ 6`) that keeps
  the character intentional between brain calls. Why-less, nonsense,
  speech, and spending directives are named at filing.
- **The engine ladder**: reflex → order → directive → **visible
  `intention_gap`** (never silent busyness, never `sfSched` for mains).
  A collapse reflex preempts the order and says why; it releases at the
  band edge into the gap. `repeat:false` directives fire once, then gap.
- **Outcomes feed back**: completed/expired/failed/interrupted land on
  `v.sfAgentResult` and surface as `order_end` dispatch triggers.
- **Dispatch** (`src/sf/38_sf_brain.js`): per-main trigger queue —
  order_end, gap, directive_expiry, convo_invite/floor/end, salient
  (bonded arrival / collapse in view / armed-intent `who`), needs bands,
  env transitions, heartbeat floor (~3.5 waking sim-h), sleep_refile
  (one mid-sleep refile; only `cueType:"time"` intents fire in sleep).
  Tier routing is real: T0 cheap refiles, T1 the cast model, T2 the
  daily reflect. Rate caps: 0.25 sim-h min spacing (0.04 inside convos),
  10 calls/sim-h hard stop. `__aiBridge.sfDispatchPoll()` is the driver
  surface.
- **Conversation channel**: talk opens `invited → participating →
  ended|dropped`; floor passes on every utterance (and on a pass-the-
  floor `do` beat), `'?'` creates obligations that survive as open
  loops, 16-utterance / 1.5 sim-h caps, asymmetric leave, thinned
  overhear records for bystanders.
- **Armed intents** (`act.intent`): `v.sfIntents[]`, event cues matched
  on perceived `who`/place, time cues as alarms.
- **Mind scan + reflect**: `sfMindScan` (mood echo, concerns, surfaced
  recalls — intrinsic weight order, never curated), `sfReflectArchive`
  (`?reflect=1` raw material for the T2 bedtime filing).
- **BRIEF v2**: `production/playtest/make_briefs.py` compiles
  `agents/C*/BRIEF.md` from the purpose-free character bibles — public
  profile + surface relationships + routine only (possession-briefing
  rule).

## What works (verified on this tree)

- **Living world**: 28 residents with needs/routines; 8 mains on the
  brain contract; 20 ambient NPCs housed and scheduled.
- **Production shell** (`production/shell.html` → `hub.html`):
  - WATCH: per-viewer cameras — Dolores Park overlook, 18th & Guerrero
    street level, rooftop over the park, follow-any-resident, free
    pan/zoom — plus a picture-in-picture monitor feed and the live
    spectator feed.
  - WIRE: the public feed + request-resolution ledger (public record).
  - REQUESTS: all six kinds through the **real** bus — quote → intent
    screen → lane → FCFS claims → bill → activate; weather/events/hires
    park in the review lane; the local desk approves/denies via
    `gsReviewResolve`.
  - LEDGER: credits + in-game dollars, full txn log, conservation math.
  - CAST: the 8 mains (brain mode, live state, home) + hired roster.
  - HOUSING: 570+ vacant units, apply-as-hire, approve/deny, lease book.
- **Possession ban**: absolute on C1–C8 — denied pre-billing for player,
  owner, admin, and agent principals; the bridge has no possess verb;
  the hub hides the sandbox's dev "Take Control" button on mains.
- **Multi-camera rig** (`src/sf/37_sf_cameras.js`): per-viewer view
  registry; secondary views render via `renderWorld()` with swapped
  globals and full restore; `sfCamWatch` tunes the main screen; the PiP
  rig view stays out of `sfCamList()`.
- **Far-zoom LOD** (`src/sf/32_sf_render.js`): below `cam.zoom < 0.55`
  buildings draw as massing (roof/pitch palette), not per-facade pixel
  bakes — the park overlook went from ~3.1s/15.7M-ops frames to
  ~160ms/~460k-ops steady state; `SF_TERR.max` raised 96→240 so one
  overview frame fits the terrain cache without thrashing.
- **Speech bubbles** render in all passes and bust the temporal frame
  cache (`sfStillKey` includes the speech signature).

## Test evidence (this tree)

| harness | result |
|---|---|
| `node devtools/node_harness.js` (medieval + GS, `?test`) | 0 FAIL — GS 496/496 |
| `GS_TEST_QUERY='?sf&test' node devtools/node_harness.js` | SF 14/14, **BRAIN 40/40**, GS 564/564 |
| `node devtools/sf_harness.js` | 132/132 |
| `node integration/proto_harness.js` | closed loop 37/37 |
| `node integration/agent_bridge_smoke.js` | 21/21 |
| `node devtools/cam_smoke.js` | camera rig 17/17 |
| `node devtools/prod_checks.js` | 11/11 (possession ban ×32, ledger conservation, parody, no-payment) |
| `production/smoke_hub.py` (Chromium) | 0 console errors, 13 shots — request filed→approved→running on Wire; possess-on-main denied |

Two integration bugs found and fixed while verifying:

- **Wire re-entrancy overflow** (`src/systems/41_game_systems_feed.js`):
  `gsWireOnEvent` pushed lines before committing `GS_WIRE_CURSOR.n`, so
  the live panel sync (`push → panelSync → tail → sync`) re-dispatched
  the same feed event until the stack overflowed (33 PAGEERRORs in the
  first smoke). Cursor now commits before the push.
- **Far-zoom render cliff** (production-1 latent): the overlook preset
  drew ~5.8k detailed facades through a 160-entry LRU — fixed by the
  far-LOD massing path + terrain cache above.

## Playtest artifacts

`production/playtest/` — the 8-agent live run: one persistent `devin`
session per main (`agents/C*/`, BRIEF.md ritual: `curl /state` →
`POST /act` → journal → stop), invoked only when `sfDispatchPoll()`
says a trigger is due. `--scripted` runs an honest in-driver policy as
the no-LLM production-path probe.

**Live run (6 sim-h, ~10× effective):** 33 dispatches — 31 contract
filings, 26 accepted, 5 rejected with honest reasons (retried to
acceptance). All three dispatch tiers exercised. 4 spontaneous talk
opens; convo channel carried invites/obligations/`no_answer` ends —
**0 accepted floor passes** (async ~90s brain turns vs ~3min invite TTL
at speed — the run's documented gap, see evaluation.md). 8/8 T2
reflects landed, referencing real run events. Failure-honesty probe:
all 8 mains withheld at directive boundaries across the live +
supplemental runs, `intention_gap` confirmed 8/8.

- `turns-live.jsonl` (= `turns.jsonl`) — every dispatch: trigger,
  tier, act, directive, why, engine result, per-turn gap flags
- `turns/` — one screenshot per dispatched turn (34)
- `video/playtest-live.webm` — VP8 recording, ~10 min
- `transcripts/C*.atif.json` + `C*.md` — independent agent records
- `replay.html` — scrub every turn: screenshot + camera + trigger +
  the filing + all eight standing wills side by side
- `turns-withhold-*` — the scripted gap-probe runs
- `evaluation.md` — full objective assessment (BECOMING rubric)
- `archive/prod1/` — production-1's run, preserved

Run:

```bash
# no-LLM contract probe
/home/hatch/workspace/village-game/tmp/.venv/bin/python \
    production/playtest/driver.py --scripted --sim-hours 8

# live 8-brain run (needs `devin` on PATH; Playwright Chromium)
/home/hatch/workspace/village-game/tmp/.venv/bin/python \
    production/playtest/driver.py --sim-hours 6 --speed 4 --cap-min 110
```

## Pinned source SHAs

| track | pin | version | merged by |
|---|---|---|---|
| base | `7eb476a` | sf/production-1 | — |
| game-systems | `f905a6d` | v16 "the becoming brain" | direct |
| world | `e20469a` | v106 | `be0d459` |
| art | `c02eb66` | v76 "Sunbreak Lanes" | `9dcc84c` |
| marketing | `859fca1` | v154 | `97771dc` |
| memory | `fe6c21d` | v110 | `2e6fb99` |

All merges clean; bundles rebuilt from merged source (never trusted).

## Honest limitations

- **Local file:// only.** Two browser windows = two separate worlds;
  there is no shared server. The Wire page, ledger, and feed are views
  of the one hub world, not cross-session state.
- **No real payments by design.** Credits mint via the honest ad trickle
  (`gsWatchAd`, 2cr/view, 5/day cap) or a labeled demo grant. Nothing
  bills a card; no payment-rail identifiers exist in the bundle.
- **Tier routing is real; tier models are not.** T0/T1/T2 all reach the
  same `devin` brain session — the dispatch interface is production
  shape, the cost regime behind it is the playtest driver, not three
  deployed models.
- **Memory wiring is partial, and documented as such** (see
  `src/sf/35_sf_memory.js` header): profiles + event-shaped records are
  wired through observe()/convo/reflection hooks; routine order steps
  (walking, idling, shift work) write nothing — no lifelogging.
- **Sim clock** syncs to America/Los_Angeles in normal use; the playtest
  pins a slow afternoon arc for legibility.
- **Weather** needs network (Open-Meteo); offline it degrades to mild
  defaults silently. The smoke/driver route a canned payload.
- **The review lane is the local desk** — in production that role is a
  staffed moderation surface; here it's the same window.
- `talk` speech bubbles persist ~21 sim-minutes and never interrupt a
  walk mid-stride; agents' `request` verb is public-goods only.
- The proto harness's schedule check is wall-clock sensitive (W.tod
  syncs to real LA time at boot). Production-1 found it caught a real
  headless freeze — NPC repath cooldown keyed on `G.frame`; fixed to
  the sim clock (`33_sf_cast.js`).
- The Dolores Park overlook frame is ~160ms even with the LOD — real
  headless screenshots of it take 10-15s (smoke timeouts are set
  accordingly).

## Rebuild from source

```bash
python3 scripts/build_willowbrook_natura.py   # src/** -> willowbrook_natura{,_test}.html
python3 production/build_production.py        # bundle + shell -> production/hub.html
```

Never hand-edit the generated bundles; edit `src/` and rebuild.
