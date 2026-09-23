#!/usr/bin/env python3
"""v11 perf A/B — measures REAL render ms/frame with the v10 temporal
frame-cache disabled (sfStillHit/sfStillStore overridden) and a slowly
drifting camera so every frame does full work.

Usage: /tmp/pwenv/bin/python devtools/perf_probe_v11.py [html_path]
"""
from playwright.sync_api import sync_playwright
import sys, os

PAGE = sys.argv[1] if len(sys.argv) > 1 else \
    '/home/hatch/workspace/world-sim/willowbrook_natura.html'
URL = 'file://' + PAGE + '?sf'

PIN = """(() => {
  W.paused = true; W.tod = 12.5; W.rain = 0; W.storm = 0; W.temp = 21;
  sfSyncClock = function(){};
  sfFetchWeather = function(){ return Promise.resolve(); };
  sfLiveTick = function(){};
  sfStillHit = function(){ return false; };   // defeat temporal cache
  sfStillStore = function(){};
})()"""

def measure(pg, setup_js, tick_js, fn):
    pg.evaluate(PIN + ';' + setup_js)
    pg.wait_for_timeout(400)
    pg.evaluate("""(() => {
      window.__PT = 0; window.__PN = 0;
      const o = window['SF_FN'];
      window['SF_FN'] = function(a, b){
        TICK
        const t = performance.now(); o(a, b); window.__PT += performance.now() - t; window.__PN++;
      };
    })()""".replace('SF_FN', fn).replace('TICK', tick_js))
    pg.wait_for_timeout(3000)
    r = pg.evaluate('[window.__PN ? window.__PT / window.__PN : -1, window.__PN]')
    return r[0], r[1]

def main():
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path='/opt/meta-chromium/chrome',
                                args=['--no-sandbox'])
        pg = br.new_page(viewport={'width': 1440, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL)
        pg.wait_for_function('typeof VILLAGERS !== "undefined" && VILLAGERS.length > 0 && typeof SF_BLD !== "undefined" && SF_BLD.length > 0', timeout=60000)
        pg.evaluate(PIN)
        pg.wait_for_timeout(500)

        # TOP view: slow pan across the Haus Coffee block (worst case for
        # the v10 viewport bake: re-rendered the whole tile field per frame)
        top, n1 = measure(pg, """(() => {
          SF_VIEW='top'; SF_CAM.director=false;
          const p = sfFindPOI('Haus Coffee'); const b = SF_BLD[p.bld];
          cam.x = b.x; cam.y = b.y; cam.zoom = 0.85;
        })()""", "cam.x += 1.7; cam.y += 0.9;", 'sfRenderWorld')

        # STREET view: slow director pan across the Guerrero facade row
        st, n2 = measure(pg, """(() => {
          SF_VIEW='street'; SF_CAM.director=true;
          const g = SF_MAP.anchors.g744; const b = SF_BLD[g.bld];
          const bx = b.x / SF_PXM, by = b.y / SF_PXM;
          SF_CAM.x = bx - 26; SF_CAM.y = by + 34; SF_CAM.h = 9;
          SF_CAM.yaw = Math.atan2(by - SF_CAM.y - 18, bx - SF_CAM.x + 30);
          SF_CAM.pitch = 0.12; SF_CAM._snap = true;
        })()""", "SF_CAM.yaw += 0.004; SF_CAM._snap = true;", 'sfRenderStreet')

        print(f'{os.path.basename(PAGE)}')
        print(f'  TOP    {top:.2f} ms/frame  ({n1} frames, panning)')
        print(f'  STREET {st:.2f} ms/frame  ({n2} frames, yaw drift)')
        if errs: print('  ERRORS:', errs[:3])
        br.close()

if __name__ == '__main__':
    main()
