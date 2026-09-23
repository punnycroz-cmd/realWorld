# PRODUCTION-1 — Real World: The Mission (local production cut)

A persistent fictional SF Mission block: 28 residents, 8 protected main
characters, real request/review/ledger/housing/hiring/Wire systems, a
multi-camera spectator shell, and an agent bridge used by the mandated
8-agent visual playtest. **Local only — no deploy, no accounts, no
payments, nothing pushed.**

## Run it

```bash
cd /home/hatch/workspace/world-sim-production
python3 production/build_production.py        # rebuild hub.html from the bundle
# then open in Chromium:
file:///home/hatch/workspace/world-sim-production/production/index.html   # front door
file:///home/hatch/workspace/world-sim-production/production/hub.html     # the hub
```

`hub.html` auto-appends `?sf=1` if opened bare (SF scenario gate). No
server is needed; everything is file://-safe. A local HTTP endpoint is
used only by the playtest driver (127.0.0.1:8797, per-run, never shipped).

## What works (verified on this tree)

- **Living world**: 28 residents with needs/routines; 8 mains on full
  brains (memory profiles wired from `memory/cast-profiles.md`).
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
- **Agent bridge** (`src/sf/36_sf_agent.js`, `window.__aiBridge`):
  `sfAgentAct(cid, {verb})` — move (POI/anchor/street-address), talk
  (walks to the target, enters their venue, speech bubble + memory
  observations both directions), work/rest/idle, request (weather /
  street_event through the real bus). `sfAgentState(cid)` — observable
  state only. This is an order channel into each NPC's own brain — not
  possession; `sfNpcTick` honors `v.sfAgent` then hands back to the
  schedule brain.
- **Speech bubbles** render in all passes (street, top-down, interior,
  legacy pawn pass) and bust the temporal frame cache (`sfStillKey`
  includes the speech signature).
- **Multi-camera rig** (`src/sf/37_sf_cameras.js`): per-viewer view
  registry; secondary views render via `renderWorld()` with swapped
  globals (`ctx/cv/cam/SF_CAM/SF_VIEW/inspectedPawnIdx/SF_CAM_FREE`) and
  full restore; presets + follow + free framing; `sfCamWatch` tunes the
  main screen. One spectator's camera never touches another's.
- **Possession ban**: absolute on C1–C8 — denied pre-billing for player,
  owner, admin, and agent principals; the bridge has no possess verb;
  the hub hides the sandbox's dev "Take Control" button on mains.

## Test evidence (this tree)

| harness | result |
|---|---|
| `node devtools/node_harness.js` (medieval + GS) | 657 lines, 0 FAIL — GS 367/367 |
| `node devtools/sf_harness.js` | 101/101 |
| `node integration/proto_harness.js` | closed loop 33/33 |
| `node integration/agent_bridge_smoke.js` | 19/19 |
| `node devtools/cam_smoke.js` | camera rig 17/17 |
| `node devtools/prod_checks.js` | 11/11 (possession ban ×32, ledger conservation, parody, no-payment) |
| `production/smoke_hub.py` (Chromium) | 0 console errors, 10 shots |

## Playtest artifacts

`production/playtest/` — 24-turn run, 8 independent `devin` sessions
(one per main, persistent per-dir under `agents/`), one shared world:

- `video/*.webm` — full session recording
- `turns/turnNN.png` — per-turn screenshots, rotating cameras
- `turns.jsonl` — every action + reason + result + positions + wire tail
- `replay.html` — scrubbable replay (visuals + per-agent actions/reasons)
- `transcripts/Cn.atif.json` + `Cn.md` — independent agent transcripts
- `evaluation.md` — objective evaluation (routines, interactions, bugs)

## Pinned source SHAs

| track | pin | merged by |
|---|---|---|
| game-systems v11 | `824709a` | `bd7857f` |
| art v49 | `07b3c44` | `b2ba541` |
| marketing v84 | `73a5934` | `1bc5113` |
| memory v56 | `5988a78` | `bb61af7` |
| world v58 (requirement pin) | `a46305c` | `f1d820b` |

Honest note: the merged tree actually carries world-track commits through
**v62** (`611f881` v60 request-ui, `83815d0` v61 Director's rail,
`2ee2b99` v62 Archive) — v58 is the requested pin label, not the ceiling.

## Honest limitations

- **Local file:// only.** Two browser windows = two separate worlds; there
  is no shared server. The Wire page, ledger, and feed are views of the
  one hub world, not cross-session state.
- **No real payments by design.** Credits mint via the honest ad trickle
  (`gsWatchAd`, 2cr/view, 5/day cap) or a labeled demo grant. Nothing
  bills a card; no payment-rail identifiers exist in the bundle.
- **Sim clock** syncs to America/Los_Angeles in normal use; the playtest
  pins a slow afternoon arc for legibility.
- **Weather** needs network (Open-Meteo); offline it degrades to mild
  defaults silently. The smoke routes a canned payload.
- **The review lane is the local desk** — in production that role is a
  staffed moderation surface; here it's the same window.
- `talk` speech bubbles persist ~21 sim-minutes and never interrupt a
  walk mid-stride; agents' `request` verb is public-goods only.
- Marketing site pages live under `marketing/site/` separately; the
  production front door (`production/index.html`) reuses their copy but
  doesn't ship the whole site.

## Rebuild from source

```bash
python3 scripts/build_willowbrook_natura.py   # src/** -> willowbrook_natura{,_test}.html
python3 production/build_production.py        # bundle + shell -> production/hub.html
```

Never hand-edit the generated bundles; edit `src/` and rebuild.
