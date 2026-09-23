#!/usr/bin/env python3
"""V25 canonical screenshots for sf-art-evolution. One browser session, four
fixed framings against willowbrook_natura.html?sf with pinned clear late-afternoon +
paused sim. Output: your_files/sf-art-evolution/v25-{A,B,C,D}.png"""
from playwright.sync_api import sync_playwright

URL = 'file:///home/hatch/workspace/world-sim/willowbrook_natura.html?sf'
OUT = '/home/hatch/workspace/your_files/sf-art-evolution/'

PIN = """(() => {
  W.paused = true; W.tod = 16.5; W.rain = 0; W.storm = 0; W.temp = 21;
  W.hum = 0.5; W.month = 9; W.day = 22; W.season = 'Autumn';
  SF_WX.cover = 0.12; SF_WX.wet = 0; SF_WX.t = 30;
  sfSyncClock = function(){};
  sfFetchWeather = function(){ return Promise.resolve(); };
  sfLiveTick = function(){};
})()"""

def main():
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path='/opt/meta-chromium/chrome',
                                args=['--no-sandbox'])
        pg = br.new_page(viewport={'width': 1440, 'height': 900})
        pg.goto(URL)
        pg.wait_for_function('typeof VILLAGERS !== "undefined" && VILLAGERS.length > 0 && typeof SF_BLD !== "undefined" && SF_BLD.length > 0', timeout=60000)
        pg.evaluate(PIN)
        pg.wait_for_timeout(800)

        # --- A: top-down over the Haus Coffee block ---
        pg.evaluate(PIN + """;(() => {
          SF_VIEW = 'top'; SF_CAM.director = false;
          const p = sfFindPOI('Haus Coffee');
          const b = SF_BLD[p.bld];
          const v = VILLAGERS[inspectedPawnIdx];
          v.x = p.x; v.y = p.y; v.inBuilding = false; v.moving = false;
          cam.x = b.x; cam.y = b.y; cam.zoom = 0.85;
        })()""")
        pg.wait_for_timeout(600)
        pg.evaluate(PIN)
        pg.screenshot(path=OUT + 'v25-A.png')

        # --- B: street follow-cam at Haus Coffee (~26m out, oblique) ---
        pg.evaluate(PIN + """;(() => {
          const p = sfFindPOI('Haus Coffee');
          const b = SF_BLD[p.bld];
          const d = sfPoiDoor(p);
          const v = VILLAGERS[inspectedPawnIdx];
          const bx = b.x / SF_PXM, by = b.y / SF_PXM;
          const dx = d.wx * 2 - bx, dy = d.wy * 2 - by;
          const dl = Math.hypot(dx, dy) || 1;
          v.x = (d.wx * 2 + dx / dl * 26 - dy / dl * 8) * SF_PXM;
          v.y = (d.wy * 2 + dy / dl * 26 + dx / dl * 8) * SF_PXM;
          v.inBuilding = false; v.moving = false; v.state = 'idle';
          const fx = -dx / dl, fy = -dy / dl;
          v.face = Math.abs(fx) > Math.abs(fy) ? (fx > 0 ? 3 : 2) : (fy > 0 ? 0 : 1);
          SF_VIEW = 'street'; SF_CAM.director = false;
          SF_CAM.yaw = Math.atan2(fy, fx); SF_CAM.pitch = 0.04; SF_CAM.h = 2.0; SF_CAM._snap = true;
          SF_CAM._lastPawn = inspectedPawnIdx;
          // two passers-by on the sidewalk between camera and shopfront
          const s1 = VILLAGERS[(inspectedPawnIdx + 1) % VILLAGERS.length];
          const s2 = VILLAGERS[(inspectedPawnIdx + 2) % VILLAGERS.length];
          s1.x = (d.wx * 2 + dx / dl * 14 + dy / dl * 4) * SF_PXM;
          s1.y = (d.wy * 2 + dy / dl * 14 - dx / dl * 4) * SF_PXM;
          s2.x = (d.wx * 2 + dx / dl * 9 - dy / dl * 6) * SF_PXM;
          s2.y = (d.wy * 2 + dy / dl * 9 + dx / dl * 6) * SF_PXM;
          for(const s of [s1, s2]){
            s.inBuilding = false; s.moving = false; s.state = 'idle';
            s.face = Math.abs(fx) > Math.abs(fy) ? (fx > 0 ? 3 : 2) : (fy > 0 ? 0 : 1);
          }
        })()""")
        pg.wait_for_timeout(600)
        pg.evaluate(PIN)
        pg.screenshot(path=OUT + 'v25-B.png')

        # --- C: top-down Dolores Park (park-tile centroid) ---
        pg.evaluate(PIN + """;(() => {
          SF_VIEW = 'top'; SF_CAM.director = false;
          let sx = 0, sy = 0, n = 0;
          for(let y = 0; y < SF_M.gh; y++) for(let x = 0; x < SF_M.gw; x++)
            if(SF_GRID[y * SF_M.gw + x] === 13){ sx += x; sy += y; n++; }
          const px = (sx / n) * CS, py = (sy / n) * CS;
          const v = VILLAGERS[inspectedPawnIdx];
          v.x = px; v.y = py; v.inBuilding = false; v.moving = false;
          cam.x = px; cam.y = py; cam.zoom = 0.4;
        })()""")
        pg.wait_for_timeout(600)
        pg.evaluate(PIN)
        pg.screenshot(path=OUT + 'v25-C.png')

        # --- D: director-mode free angle on a Victorian facade row (Guerrero) ---
        pg.evaluate(PIN + """;(() => {
          SF_VIEW = 'street'; SF_CAM.director = true;
          const g = SF_MAP.anchors.g744;
          const b = SF_BLD[g.bld];
          const bx = b.x / SF_PXM, by = b.y / SF_PXM;
          SF_CAM.x = bx - 26; SF_CAM.y = by + 34;
          SF_CAM.h = 9;
          SF_CAM.yaw = Math.atan2(by - SF_CAM.y - 18, bx - SF_CAM.x + 30);
          SF_CAM.pitch = 0.12; SF_CAM._snap = true;
        })()""")
        pg.wait_for_timeout(600)
        pg.evaluate(PIN)
        pg.screenshot(path=OUT + 'v25-D.png')

        br.close()

if __name__ == '__main__':
    main()
