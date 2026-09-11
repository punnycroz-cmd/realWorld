WILLOWBROOK - game source
=========================
Contents:
  dev/pa-*.js        Pixel-art modules (chars, buildings, terrain, veg, props, fx, core, integrate)
  index.html.bak-v1  Pristine original game (logic + engine, before pixel-art integration)
  build.py           Build script: injects dev/pa-*.js into index.html.bak-v1 -> index.html

How to rebuild:
  cp index.html.bak-v1 index.html
  python3 build.py
  # outputs index.html (~177KB, self-contained, opens from file://)

Notes:
  - build.py must patch the PRISTINE backup, never an already-built file.
  - pa-chars.js defines buildChars, paCharDraw, workFor, cR, cP, cBlob, cUp,
    cAutoOutline — the build silently breaks if any are missing.
  - Character frames are 48x64 native cells (v5: curved/organic style).
