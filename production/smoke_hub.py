#!/usr/bin/env python3
"""production-2 smoke: boot production/hub.html in Chromium, assert zero
console errors, screenshot the front door + pitch site, every rail view,
camera presets, the request flow (file -> review -> resolve), and the
Wire. Output: production/smoke/*.png

  /home/hatch/workspace/village-game/tmp/.venv/bin/python production/smoke_hub.py
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
HUB = 'file://' + str(HERE / 'hub.html')
DOOR = 'file://' + str(HERE / 'index.html')
PITCH = 'file://' + str(HERE.parent / 'marketing' / 'site' / 'index.html')
OUT = HERE / 'smoke'
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
        import glob
        chrome = (glob.glob('/opt/.devin/chrome/chrome/linux-*/chrome-linux64/chrome') or
                  ['/usr/bin/google-chrome-stable'])[0]
        br = pw.chromium.launch(executable_path=chrome,
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

        # front door + the marketing pitch site (local front door #2)
        pg.goto(DOOR); pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / 'front-door.png'))
        pg.goto(PITCH); pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / 'pitch-site.png'))

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
        for tab in ['watch', 'wire', 'req', 'led', 'cast', 'house',
                    'drive', 'archive']:
            pg.evaluate(f'document.querySelector("#rwTabs button[data-t=\'{tab}\']").click()')
            pg.wait_for_timeout(350)
            pg.evaluate(PIN)
            pg.screenshot(path=str(OUT / f'hub-{tab}.png'))
            print('shot', tab)

        # request flow on the real bus: file -> review lane -> resolve
        # -> Wire line. grant credits, file a street_event, approve at the
        # desk, then shoot each stage.
        pg.evaluate("""(() => {
          gsCreditGrant('spectator-1', 500, 'smoke grant');
          document.querySelector('#rwTabs button[data-t="req"]').click();
          document.getElementById('rqKind').value = 'street_event';
          document.getElementById('rqKind').onchange();
          document.getElementById('rqNote').value = 'smoke: mural tour on the green';
          document.getElementById('rqGo').click();
        })()""")
        pg.wait_for_timeout(500); pg.evaluate(PIN)
        pg.screenshot(path=str(OUT / 'req-filed.png'))
        filed = pg.evaluate("""(() => {
          const r = GS_REQ.reqs[GS_REQ.reqs.length - 1];
          return r ? { id: r.id, status: r.status, kind: r.kind } : null;
        })()""")
        print('filed:', filed)
        pg.evaluate("""(() => {
          const r = GS_REQ.reqs[GS_REQ.reqs.length - 1];
          if(r && r.status === 'in_review')
            __aiBridge.gsReviewResolve(r.id, true, { by: 'smoke-desk' });
          document.querySelector('#rwTabs button[data-t="wire"]').click();
        })()""")
        pg.wait_for_timeout(500); pg.evaluate(PIN)
        pg.screenshot(path=str(OUT / 'wire-after-request.png'))
        resolved = pg.evaluate("""(() => {
          const r = GS_REQ.reqs[GS_REQ.reqs.length - 1];
          const w = GS_WIRE.slice(-3).map(e => e.kind + ':' + (e.status || ''));
          return { status: r && r.status, wire: w };
        })()""")
        print('resolved:', resolved)

        # possession ban on a main — the direct bus call must refuse
        ban = pg.evaluate("""(() => {
          const r = __aiBridge.gsSubmitRequest({ playerId: 'spectator-1',
            kind: 'possess', target: 'C1', durationMin: 10,
            params: { note: 'smoke: must be denied' } });
          return r && { status: r.status, reason: r.reason || r.reason_code };
        })()""")
        print('possess-on-main:', ban)

        # camera presets through the real rail buttons. NOTE: the overlook
        # runs the far-LOD massing path (zoom 0.24 over ~5.8k buildings) —
        # frames are heavy (~10s real canvas), so shots get a long timeout.
        pg.evaluate("""(() => {
          document.querySelector('#rwTabs button[data-t="watch"]').click();
          document.querySelector('button[data-cam="overlook"]').click();
        })()""")
        pg.wait_for_timeout(800); pg.evaluate(PIN)
        pg.screenshot(path=str(OUT / 'hub-cam-overlook.png'), timeout=90000)
        pg.evaluate("document.querySelector('button[data-cam=\"streetlv\"]').click()")
        pg.wait_for_timeout(800); pg.evaluate(PIN)
        pg.screenshot(path=str(OUT / 'hub-cam-street.png'), timeout=90000)

        # PiP monitor
        pg.evaluate("""(() => {
          const s = document.getElementById('rwPipSel');
          s.value = 'overlook'; s.onchange();
        })()""")
        pg.wait_for_timeout(800); pg.evaluate(PIN)
        pg.screenshot(path=str(OUT / 'hub-pip.png'), timeout=90000)

        br.close()

    errs = [e for e in errors if 'favicon' not in e.lower()]
    print('console errors:', len(errs))
    for e in errs[:15]: print('  !', e[:300])
    sys.exit(1 if errs else 0)

if __name__ == '__main__':
    main()
