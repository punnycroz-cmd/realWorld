#!/usr/bin/env python3
"""Real World — Discord server blueprint renderer + verifier.

community/server-blueprint.json is COMMUNITY-FUNNEL.md §3 as data. This tool
is how the create-at-go checklist stays honest:

    # print the setup checklist (what to click, in order)
    python3 marketing/tools/server_blueprint.py --render

    # print a blank dump the owner fills in after creating the server
    python3 marketing/tools/server_blueprint.py --emit-dump

    # verify a real server against the blueprint before the site links it
    python3 marketing/tools/server_blueprint.py --check dump.json

--check accepts two input shapes:

  1. A simple dump (the --emit-dump format):
       {"server_name": "...", "roles": ["owner", ...],
        "channels": [{"name": "the-feed", "type": "text",
                      "readonly": true, "private": false}, ...]}

  2. A Discord guild-template export (Server Settings → Server Template, or
     GET /guilds/{id}/templates): top-level "serialized_guild" with "roles"
     and "channels" (Discord type ints: 0 text, 2 voice, 4 category, 15 forum)
     and per-channel "permission_overwrites".

Read-only is verified from permission_overwrites on the @everyone role
(SEND_MESSAGES 0x800 denied). Private is VIEW_CHANNEL 0x400 denied.
Checks it cannot verify from an export (rules gate, welcome screen, pins)
are printed as MANUAL rows — the human still confirms those.

Exit: 0 = pass (warnings allowed), 1 = any FAIL.
"""
import argparse
import json
import sys
from pathlib import Path

BLUEPRINT = Path(__file__).resolve().parent.parent / "community" / "server-blueprint.json"

SEND_MESSAGES = 0x800
VIEW_CHANNEL = 0x400
CHANNEL_TYPES = {0: "text", 2: "voice", 4: "category", 15: "forum"}
TYPE_TO_INT = {"text": 0, "voice": 2, "category": 4, "forum": 15}


def load_blueprint():
    with open(BLUEPRINT, encoding="utf-8") as f:
        return json.load(f)


def render(bp):
    s = bp["server"]
    print(f"# Server setup — {s['name']} (blueprint {bp['version']})")
    print("Owner-gated, ~1 session. Check off in order; --check verifies after.\n")
    print(f"[ ] Create server named exactly: {s['name']}")
    print(f"[ ] Enable community features: {', '.join(s['community_features'])}")
    rg = s["rules_gate"]
    print(f"[ ] Membership screening ON ({len(rg['rules'])} rules — copy verbatim "
          f"from COMMUNITY-FUNNEL.md §4.1 / blueprint rules_gate)")
    ws = s["welcome_screen"]
    print(f"[ ] Welcome screen: \"{ws['description']}\"")
    for q in ws["questions"]:
        print(f"      · \"{q['title']}\" → {', '.join(q['options'])}"
              + (f" (grants {q['assigns_role']})" if q.get("assigns_role") else ""))
    print("[ ] Roles:")
    for r in bp["roles"]:
        print(f"      · {r['mention']} — {r['permissions']} — {r['note']}")
    print("[ ] Channels (in this order):")
    for c in bp["channels"]:
        flags = []
        if c.get("readonly"):
            flags.append(f"READ-ONLY, posts: {c['posting']}")
        if c.get("private"):
            flags.append(f"PRIVATE to {c['posting']}")
        line = f"      · #{c['name']} ({c['type']}) — {c.get('topic','')}"
        if flags:
            line += "  [" + "; ".join(flags) + "]"
        print(line)
        for p in c.get("pins", []):
            print(f"          pin: {p}")
    print(f"[ ] Bots: none. ({bp['bots_note']})")
    print("[ ] Run: server_blueprint.py --emit-dump > dump.json, fill it in,")
    print("      then --check dump.json. Site invite link goes live only on PASS.")


def emit_dump(bp):
    dump = {
        "server_name": "",
        "roles": [],
        "channels": [
            {"name": c["name"], "type": c["type"],
             "readonly": bool(c.get("readonly")), "private": bool(c.get("private"))}
            for c in bp["channels"]
        ],
    }
    print(json.dumps(dump, indent=2))


def everyone_role_id(roles):
    for r in roles:
        if r.get("name") == "@everyone":
            return str(r.get("id"))
    return None


def normalize(data):
    """Return (name, {roles:set}, {channels:[{name,type,readonly,private}]}) or raise."""
    if "serialized_guild" in data:
        g = data["serialized_guild"]
        eid = everyone_role_id(g.get("roles", []))
        chans = []
        for c in g.get("channels", []):
            t = CHANNEL_TYPES.get(c.get("type"))
            if t is None or t == "category":
                continue
            ro = pv = False
            for ow in c.get("permission_overwrites", []):
                if eid is not None and str(ow.get("id")) != eid:
                    continue
                deny = int(ow.get("deny", 0))
                allow = int(ow.get("allow", 0))
                if deny & SEND_MESSAGES and not allow & SEND_MESSAGES:
                    ro = True
                if deny & VIEW_CHANNEL and not allow & VIEW_CHANNEL:
                    pv = True
            chans.append({"name": c.get("name", ""), "type": t,
                          "readonly": ro, "private": pv})
        roles = {r.get("name", "").lstrip("@") for r in g.get("roles", [])}
        roles.discard("@everyone")
        return g.get("name") or data.get("name", ""), roles, chans
    chans = [{"name": c.get("name", ""), "type": c.get("type", "text"),
              "readonly": bool(c.get("readonly")), "private": bool(c.get("private"))}
             for c in data.get("channels", [])]
    return data.get("server_name", ""), set(data.get("roles", [])), chans


def check(bp, dump_path):
    with open(dump_path, encoding="utf-8") as f:
        data = json.load(f)
    name, roles, chans = normalize(data)
    fails, warns, manuals = [], [], []
    chan_by_name = {c["name"]: c for c in chans}

    if name != bp["server"]["name"]:
        fails.append(f"server name {name!r} != {bp['server']['name']!r}")

    for r in bp["roles"]:
        if r["name"] not in roles:
            fails.append(f"missing role @{r['name']}")

    for spec in bp["channels"]:
        c = chan_by_name.get(spec["name"])
        if c is None:
            fails.append(f"missing channel #{spec['name']} ({spec['type']})")
            continue
        if c["type"] != spec["type"]:
            fails.append(f"#{spec['name']} type {c['type']} != {spec['type']}")
        if spec.get("readonly") and not c.get("readonly"):
            fails.append(f"#{spec['name']} must be READ-ONLY "
                         f"(deny @everyone Send Messages) — posting: {spec['posting']}")
        if spec.get("private") and not c.get("private"):
            fails.append(f"#{spec['name']} must be PRIVATE to {spec['posting']} "
                         "(deny @everyone View Channel)")
        if spec.get("pins"):
            manuals.append(f"#{spec['name']}: {len(spec['pins'])} pin(s) — "
                           + "; ".join(spec["pins"]))

    spec_names = {c["name"] for c in bp["channels"]}
    for c in chans:
        if c["name"] not in spec_names and c["type"] == "text" and not c.get("private"):
            warns.append(f"extra public text channel #{c['name']} — a quiet "
                         "40-channel server reads dead (FUNNEL §3); sure it's needed?")

    rg = bp["server"]["rules_gate"]
    manuals.append(f"membership screening ON with {len(rg['rules'])} verbatim rules")
    manuals.append("welcome screen question grants @resident")
    manuals.append("no bots installed (blueprint bots list is empty)")

    print(f"server_blueprint --check {dump_path}")
    for m in fails:
        print(f"  FAIL   {m}")
    for m in warns:
        print(f"  WARN   {m}")
    for m in manuals:
        print(f"  MANUAL {m}")
    print(f"{len(fails)} fail / {len(warns)} warn / {len(manuals)} manual")
    return 1 if fails else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--render", action="store_true", help="print the setup checklist")
    g.add_argument("--emit-dump", action="store_true", help="print a blank dump JSON")
    g.add_argument("--check", metavar="DUMP.json", help="verify a server dump/export")
    a = ap.parse_args()
    bp = load_blueprint()
    if a.render:
        render(bp)
        return 0
    if a.emit_dump:
        emit_dump(bp)
        return 0
    return check(bp, a.check)


if __name__ == "__main__":
    sys.exit(main())
