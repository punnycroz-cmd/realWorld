#!/usr/bin/env python3
"""integration-1: build the one-file local prototype.

Reads ../willowbrook_natura.html (the real bundled game) and
proto_overlay.html (the request/wire/ledger/cast rail), writes
prototype.html — one file, file://-safe, no server.

  python3 integration/build_prototype.py
"""
import pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
GAME = ROOT / 'willowbrook_natura.html'
OVERLAY = HERE / 'proto_overlay.html'
OUT = HERE / 'prototype.html'

# The Mission scenario gates on ?sf / ?scenario=sf in location.search.
# file:// URLs carry query strings fine; if the file was opened bare we
# redirect once before the game script evaluates SF_MODE (module const).
BOOTSTRAP = """<script>
/* prototype bootstrap: force the SF Mission scenario on file:// opens */
if(!/[?&](sf|scenario=sf)\\b/.test(location.search||'')){
  location.replace(location.pathname + '?sf=1' + (location.hash||''));
}
</script>
"""

def main():
    game = GAME.read_text(encoding='utf-8')
    overlay = OVERLAY.read_text(encoding='utf-8')
    if '<script>' not in game or '</body>' not in game:
        sys.exit('game bundle missing expected <script>/</body> markers')
    # bootstrap before the first (game) script; overlay before </body>
    out = game.replace('<script>', BOOTSTRAP + '<script>', 1)
    out = out.replace('</body>', overlay + '\n</body>', 1)
    OUT.write_text(out, encoding='utf-8')
    print(f'wrote {OUT} ({len(out)} bytes)')
    print('open:  file://' + str(OUT) + '   (auto-appends ?sf=1 if bare)')

if __name__ == '__main__':
    main()
