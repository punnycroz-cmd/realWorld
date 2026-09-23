#!/usr/bin/env python3
"""production-1 smoke: boot production/hub.html in Chromium, assert zero
console errors, screenshot every rail view + a camera preset + the front
door. Output: production/shots/*.png

  /home/hatch/workspace/village-game/tmp/.venv/bin/python production/smoke_hub.py
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
HUB = 'file://' + str(HERE / 'hub.html')
DOOR = 'file://' + str(HERE / 'index.html')
OUT = HERE / 'shots'
OUT.mkdir(exist_ok=True)

PIN = """(() => {
  W.paused = true; W.tod = 16.5; W.rain = 0; W.storm = 0; W.temp = 21;
  SF_WX.cover = 0.12; SF_WX.wet = 0;
  sfSyncClock = function(){}; sfFetchWeather = function(){ return Promise.resolve(); };
  sfLiveTick = function(){};
})()"""

def main():
    errors = []
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path='/opt/meta-chromium/chrome',
                                args=['--no-sandbox'])
        pg = br.new_page(viewport={'width': 1600, 'height': 950})
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errors.append('PAGEERROR ' + str(e)))

        # satisfy the live weather fetch with a canned mild-SF payload so the
        # smoke is deterministic and console-clean even sandboxed offline
        pg.route('**/api.open-meteo.com/**', lambda route: route.fulfill(
            status=200, content_type='application/json',
            body='{"current":{"temperature_2m":21,"relative_humidity_2m":55,'
                 '"precipitation":0,"cloud_cover":18,"wind_speed_10m":8,'
                 '"wind_direction_10m":250,"weather_code":1}}'))

        # front door
        pg.goto(DOOR); pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / 'hub-index.png'))

        # hub — wait for the SF world
        pg.goto(HUB)
        pg.wait_for_function(
            'typeof VILLAGERS !== "undefined" && VILLAGERS.length > 0',
            timeout=60000)
        pg.wait_for_timeout(1500)
        pg.evaluate(PIN)
        pg.wait_for_timeout(600)

        # shell present?
        ok = pg.evaluate("!!document.getElementById('rwShell')")
        print('rwShell mounted:', ok)

        # each rail view
        for tab in ['watch', 'wire', 'req', 'led', 'cast', 'house']:
            pg.evaluate(f'document.querySelector("#rwTabs button[data-t=\'{tab}\']").click()')
            pg.wait_for_timeout(350)
            pg.evaluate(PIN)
            pg.screenshot(path=str(OUT / f'hub-{tab}.png'))
            print('shot', tab)

        # camera presets through the real rail buttons
        pg.evaluate("""(() => {
          document.querySelector('#rwTabs button[data-t="watch"]').click();
          document.querySelector('button[data-cam="overlook"]').click();
        })()""")
        pg.wait_for_timeout(800); pg.evaluate(PIN)
        pg.screenshot(path=str(OUT / 'hub-cam-overlook.png'))
        pg.evaluate("document.querySelector('button[data-cam=\"streetlv\"]').click()")
        pg.wait_for_timeout(800); pg.evaluate(PIN)
        pg.screenshot(path=str(OUT / 'hub-cam-street.png'))

        # PiP monitor
        pg.evaluate("""(() => {
          const s = document.getElementById('rwPipSel');
          s.value = 'overlook'; s.onchange();
        })()""")
        pg.wait_for_timeout(800); pg.evaluate(PIN)
        pg.screenshot(path=str(OUT / 'hub-pip.png'))

        br.close()

    errs = [e for e in errors if 'favicon' not in e.lower()]
    print('console errors:', len(errs))
    for e in errs[:15]: print('  !', e[:300])
    sys.exit(1 if errs else 0)

if __name__ == '__main__':
    main()
