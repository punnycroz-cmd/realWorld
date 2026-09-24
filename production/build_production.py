#!/usr/bin/env python3
"""production-1: build the one-file local hub.

Reads ../willowbrook_natura.html (the real bundled game, release build)
and shell.html (the production rail: cameras / wire / requests / ledger /
cast / housing), writes hub.html — one file, file://-safe, no server.

  python3 production/build_production.py
"""
import pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
GAME = ROOT / 'willowbrook_natura.html'
SHELL = HERE / 'shell.html'
OUT = HERE / 'hub.html'

# The Mission scenario gates on ?sf / ?scenario=sf in location.search.
# file:// URLs carry query strings fine; if the file was opened bare we
# redirect once before the game script evaluates SF_MODE (module const).
BOOTSTRAP = """<script>
/* production bootstrap: force the SF Mission scenario on bare opens */
window.SF_FORCE = true;   // the hub IS the Mission build — never boot Willowbrook
if(!/[?&](sf|scenario=sf)\\b/.test(location.search||'')){
  location.replace(location.pathname + '?sf=1' + (location.hash||''));
}
</script>
"""

def main():
    game = GAME.read_text(encoding='utf-8')
    shell = SHELL.read_text(encoding='utf-8')
    if '<script>' not in game or '</body>' not in game:
        sys.exit('game bundle missing expected <script>/</body> markers')
    out = game.replace('<script>', BOOTSTRAP + '<script>', 1)
    out = out.replace('</body>', shell + '\n</body>', 1)
    OUT.write_text(out, encoding='utf-8')
    print(f'wrote {OUT} ({len(out)} bytes)')
    print('open:  file://' + str(OUT) + '   (auto-appends ?sf=1 if bare)')

if __name__ == '__main__':
    main()
