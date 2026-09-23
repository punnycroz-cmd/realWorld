#!/usr/bin/env python3
"""Measure SF render ms/frame (mean over N frames) in both views.
Usage: /tmp/pwenv/bin/python devtools/perf_probe.py"""
from playwright.sync_api import sync_playwright
import sys

URL = 'file:///home/hatch/workspace/world-sim/willowbrook_natura.html?sf'

PIN = """(() => {
  W.paused = true; W.tod = 12.5; W.rain = 0; W.storm = 0; W.temp = 21;
  sfSyncClock = function(){};
  sfFetchWeather = function(){ return Promise.resolve(); };
  sfLiveTick = function(){};
})()"""

def measure(pg, setup_js, fn):
    pg.evaluate(PIN + ';' + setup_js)
    pg.wait_for_timeout(300)
    pg.evaluate("""(() => {
      window.__PT = 0; window.__PN = 0;
      const wrap = (name) => {
        const o = window[name];
        window[name] = function(a, b){
          const t = performance.now(); o(a, b); window.__PT += performance.now() - t; window.__PN++;
        };
      };
      wrap('SF_FN');
    })()""".replace('SF_FN', fn))
    pg.wait_for_timeout(2500)
    r = pg.evaluate('[window.__PN ? window.__PT / window.__PN : -1, window.__PN]')
    print(f'   frames={r[1]}')
    return r[0]

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

        top_ms = measure(pg, """(() => {
          SF_VIEW='top'; SF_CAM.director=false;
          const p = sfFindPOI('Haus Coffee'); const b = SF_BLD[p.bld];
          cam.x = b.x; cam.y = b.y; cam.zoom = 0.85;
        })()""", 'sfRenderWorld')

        st_ms = measure(pg, """(() => {
          SF_VIEW='street'; SF_CAM.director=true;
          const g = SF_MAP.anchors.g744; const b = SF_BLD[g.bld];
          const bx = b.x / SF_PXM, by = b.y / SF_PXM;
          SF_CAM.x = bx - 26; SF_CAM.y = by + 34; SF_CAM.h = 9;
          SF_CAM.yaw = Math.atan2(by - SF_CAM.y - 18, bx - SF_CAM.x + 30);
          SF_CAM.pitch = 0.12; SF_CAM._snap = true;
        })()""", 'sfRenderStreet')

        print(f'TOP {top_ms:.2f} ms/frame')
        print(f'STREET {st_ms:.2f} ms/frame')
        if errs: print('ERRORS:', errs[:3])
        br.close()

if __name__ == '__main__':
    main()
