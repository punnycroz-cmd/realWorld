#!/usr/bin/env python3
"""release_manifest.py — emit or verify a per-release manifest.

The manifest is how we answer "is what is live what we shipped?":
deploy-site.sh writes release.json into every release dir before the
symlink flip; prod_smoke.sh fetches it back and compares git_sha to the
local checkout; --verify re-hashes a release dir against its own
manifest (catches corruption or post-deploy tampering on the host).

Usage:
  release_manifest.py <site-dir>            print manifest JSON to stdout
  release_manifest.py --verify <release-dir>  re-hash dir vs its release.json
"""
import datetime
import hashlib
import json
import os
import subprocess
import sys

EXCLUDE = {"release.json", ".DS_Store"}


def tree_hash(root):
    """Deterministic sha256 over (relpath, content-hash) pairs."""
    h = hashlib.sha256()
    count = 0
    for dirpath, dirs, files in os.walk(root):
        dirs.sort()
        for fn in sorted(files):
            if fn in EXCLUDE:
                continue
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, root)
            fh = hashlib.sha256()
            with open(p, "rb") as f:
                for chunk in iter(lambda: f.read(1 << 16), b""):
                    fh.update(chunk)
            h.update(rel.encode() + b"\0" + fh.hexdigest().encode() + b"\n")
            count += 1
    return h.hexdigest(), count


def git(field):
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref" if field == "branch" else "HEAD"],
            stderr=subprocess.DEVNULL, text=True).strip()
    except Exception:
        return "unknown"


def manifest(root):
    digest, count = tree_hash(root)
    return {
        "release_schema": 1,
        "site": "real-world-marketing",
        "git_sha": git("sha"),
        "git_branch": git("branch"),
        "deployed_at": datetime.datetime.now(datetime.timezone.utc)
        .strftime("%Y-%m-%dT%H:%M:%SZ"),
        "file_count": count,
        "tree_sha256": digest,
    }


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--verify":
        root = sys.argv[2]
        mf = os.path.join(root, "release.json")
        if not os.path.isfile(mf):
            print(f"FAIL: {mf} missing")
            return 1
        want = json.load(open(mf))
        digest, count = tree_hash(root)
        ok = digest == want.get("tree_sha256") and count == want.get("file_count")
        print(("PASS" if ok else "FAIL") +
              f": {root} tree_sha256 {'matches' if ok else 'MISMATCH'} " +
              f"({count} files vs manifest {want.get('file_count')}, " +
              f"sha {str(want.get('git_sha'))[:8]})")
        return 0 if ok else 1
    if len(sys.argv) == 2:
        print(json.dumps(manifest(sys.argv[1]), indent=2))
        return 0
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
