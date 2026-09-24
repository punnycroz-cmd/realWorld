#!/usr/bin/env python3
"""query_map.py — map real search queries onto the SEO-PLAN §13 cannibalization
register and flag drift.

Input: a Search-Console-style CSV export (or any CSV) with columns:
    query,page,clicks,impressions,ctr,position
`page` may be a full URL or a path; only the basename is compared.
`ctr` may be a fraction (0.031) or a percent string ("3.1%").

Usage:
    tools/query_map.py export.csv                 # full report
    tools/query_map.py export.csv --min-impr 50   # ignore noise
    tools/query_map.py --validate-register        # lint query-register.csv only
    tools/query_map.py export.csv --json          # machine-readable

Exit code: 0 = no cannibalization hits; 1 = hits found; 2 = input error.
Reads nothing outside marketing/ — safe to run any version.
"""
import csv, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REGISTER = os.path.join(HERE, "..", "seo", "query-register.csv")
SITE = os.path.join(HERE, "..", "site")

# Words that assign an unseen query to a register cluster, longest match wins.
CLUSTER_HINTS = [
    ("truman", "truman-show"), ("life sim", "ai-life-sim"),
    ("villager", "watch"), ("watch", "watch"), ("spectat", "watch"),
    ("possess", "possession"), ("control", "possession"),
    ("browser", "browser"), ("persistent", "persistent"),
    ("inzoi", "compare"), ("sims", "compare"), ("paralives", "compare"),
    ("livora", "compare"), ("ourlife", "compare"), ("canvastown", "compare"),
    ("burbank", "compare"), ("alternative", "compare"), ("games like", "compare"),
    ("vs ", "compare"), ("versus", "compare"), ("compare", "compare"),
    ("dolores", "place"), ("mission district", "place"), ("san francisco", "place"),
    ("drama", "drama"), ("soap opera", "drama"),
    ("request", "mechanic"), ("job", "mechanic"), ("hire", "mechanic"),
    ("memory", "mechanic"), ("schedule", "mechanic"), ("rent", "mechanic"),
    ("landlord", "landlord"), ("property", "landlord"), ("evict", "landlord"),
    ("archive", "archive"), ("history", "archive"), ("past event", "archive"),
    ("screenshot", "proof"), ("gallery", "proof"),
    ("price", "pricing"), ("pricing", "pricing"), ("cost", "pricing"),
    ("credit", "pricing"), ("refund", "pricing"), ("free", "pricing"),
    ("cast", "cast"), ("character", "cast"),
]

def norm_page(p):
    p = p.strip().split("?")[0].split("#")[0]
    p = re.sub(r"^[a-z]+://[^/]+", "", p)  # strip scheme + host
    base = p.rstrip("/").rsplit("/", 1)[-1]
    return "index.html" if base in ("", "index") else base

def load_register(path=REGISTER):
    rows = []
    with open(path, newline="") as f:
        for r in csv.DictReader(f):
            r["owner_page"] = norm_page(r["owner_page"])
            rows.append(r)
    return rows

def validate_register(rows):
    errs = []
    known = {f for f in os.listdir(SITE) if f.endswith(".html")}
    for i, r in enumerate(rows, 2):
        if r["owner_page"] not in known:
            errs.append("line %d: owner_page %s not in site/" % (i, r["owner_page"]))
        if r["tier"] not in ("1", "2", "3"):
            errs.append("line %d: bad tier %r" % (i, r["tier"]))
        if not r["query"].strip():
            errs.append("line %d: empty query" % i)
    seen = {}
    for i, r in enumerate(rows, 2):
        q = r["query"].lower().strip()
        if q in seen:
            errs.append("line %d: duplicate query (first on line %d)" % (i, seen[q]))
        seen[q] = i
    return errs

def guess_cluster(query):
    q = " " + query.lower() + " "
    for needle, cluster in CLUSTER_HINTS:
        if needle in q:
            return cluster
    return None

def parse_ctr(v):
    v = v.strip().rstrip("%")
    try:
        f = float(v)
    except ValueError:
        return 0.0
    return f / 100.0 if f > 1 else f

def main(argv):
    if "--validate-register" in argv:
        rows = load_register()
        errs = validate_register(rows)
        for e in errs:
            print("FAIL", e)
        print("register: %d rows, %s" % (len(rows), "clean" if not errs else "%d problems" % len(errs)))
        return 2 if errs else 0

    path = next((a for a in argv[1:] if not a.startswith("--")), None)
    if not path or not os.path.exists(path):
        print("usage: query_map.py <gsc-export.csv> [--min-impr N] [--json] | --validate-register")
        return 2
    min_impr = int(argv[argv.index("--min-impr") + 1]) if "--min-impr" in argv else 0
    want_json = "--json" in argv

    rows = load_register()
    errs = validate_register(rows)
    if errs:
        for e in errs:
            print("FAIL register:", e)
        return 2
    by_query = {r["query"].lower(): r for r in rows}
    cluster_owner = {}
    for r in rows:  # lowest tier wins ownership of a cluster
        c, t = r["cluster"], int(r["tier"])
        if c not in cluster_owner or t < int(cluster_owner[c]["tier"]):
            cluster_owner[c] = r

    hits, unseen, totals = [], [], {"queries": 0, "clicks": 0, "impressions": 0}
    owner_traffic = {}
    with open(path, newline="") as f:
        rd = csv.DictReader(f)
        missing = {"query", "page", "clicks", "impressions"} - set(rd.fieldnames or [])
        if missing:
            print("FAIL: export missing columns: %s" % ", ".join(sorted(missing)))
            return 2
        for r in rd:
            try:
                impr = int(float(r["impressions"]))
                clicks = int(float(r["clicks"]))
            except (ValueError, TypeError):
                continue
            q = (r["query"] or "").lower().strip()
            page = norm_page(r["page"] or "")
            if not q or impr < min_impr:
                continue
            totals["queries"] += 1
            totals["clicks"] += clicks
            totals["impressions"] += impr
            owner_traffic[page] = owner_traffic.get(page, 0) + impr
            reg = by_query.get(q)
            if reg:
                owner = reg["owner_page"]
                if page != owner:
                    hits.append({"type": "cannibalization", "query": q,
                                 "owner": owner, "landed_on": page,
                                 "impressions": impr, "clicks": clicks,
                                 "position": r.get("position", "")})
                else:
                    hits.append({"type": "ok", "query": q, "owner": owner,
                                 "impressions": impr, "clicks": clicks,
                                 "position": r.get("position", "")})
            else:
                cluster = guess_cluster(q)
                suggestion = cluster_owner.get(cluster, {}).get("owner_page") if cluster else None
                unseen.append({"query": q, "landed_on": page, "impressions": impr,
                               "clicks": clicks, "ctr": parse_ctr(r.get("ctr", "0")),
                               "position": r.get("position", ""),
                               "guessed_cluster": cluster, "suggest_owner": suggestion})

    canni = [h for h in hits if h["type"] == "cannibalization"]
    unseen.sort(key=lambda x: -x["impressions"])

    if want_json:
        print(json.dumps({"totals": totals, "cannibalization": canni,
                          "unseen": unseen, "owner_traffic": owner_traffic}, indent=2))
    else:
        print("=== QUERY MAP — %s ===" % os.path.basename(path))
        print("queries: %(queries)d  clicks: %(clicks)d  impressions: %(impressions)d" % totals)
        print()
        if canni:
            print("CANNIBALIZATION (%d) — query landed on the wrong page:" % len(canni))
            for h in sorted(canni, key=lambda x: -x["impressions"]):
                print("  %-42s landed %-22s owner %-22s %5d impr" %
                      (h["query"], h["landed_on"], h["owner"], h["impressions"]))
        else:
            print("CANNIBALIZATION: none — every registered query landed on its owner.")
        print()
        if unseen:
            print("UNREGISTERED QUERIES (%d) — sort into seo/query-register.csv or §16 bank:" % len(unseen))
            for u in unseen[:40]:
                sug = ("-> %s (%s)" % (u["suggest_owner"], u["guessed_cluster"])) if u["suggest_owner"] else "-> ?"
                print("  %-42s %-22s %5d impr  %s" % (u["query"], u["landed_on"], u["impressions"], sug))
        print()
        print("OWNER-PAGE SHARE (impressions):")
        for p, i in sorted(owner_traffic.items(), key=lambda x: -x[1]):
            print("  %-24s %6d" % (p, i))
    return 1 if canni else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv))
