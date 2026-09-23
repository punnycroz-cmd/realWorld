// V52 interior verification shots — cafe + flat, same weather pins as v52.
const { chromium } = require('playwright');

const URL = 'file:///home/hatch/workspace/world-sim/willowbrook_natura.html?sf';
const OUT = '/home/hatch/workspace/your_files/sf-art-evolution/';

const PIN = `(() => {
  W.paused = true; W.tod = 16.5; W.rain = 0; W.storm = 0; W.temp = 21;
  W.hum = 0.5; W.month = 9; W.day = 22; W.season = 'Autumn';
  SF_WX.cover = 0.30; SF_WX.wet = 0; SF_WX.t = 30;
  if(typeof SF_STILL !== 'undefined') SF_STILL.key = '';
  sfSyncClock = function(){};
  sfFetchWeather = function(){ return Promise.resolve(); };
  sfLiveTick = function(){};
})()`;

(async () => {
  const br = await chromium.launch({
    executablePath: '/opt/meta-chromium/chrome',
    args: ['--no-sandbox'],
  });
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.goto(URL);
  await pg.waitForFunction(
    'typeof VILLAGERS !== "undefined" && VILLAGERS.length > 0 && typeof SF_BLD !== "undefined" && SF_BLD.length > 0',
    { timeout: 60000 });
  await pg.evaluate(PIN);
  await pg.waitForTimeout(800);

  for(const [tag, inside] of [['INT-cafe', 'Haus Coffee'], ['INT-flat', '750 Guerrero'],
                              ['INT-taq', 'Taqueria El Farolito'], ['INT-hw', 'Auerbach Hardware']]){
    await pg.evaluate(PIN + `;(() => {
      SF_VIEW = 'street'; SF_CAM.director = false;
      const v = VILLAGERS[inspectedPawnIdx];
      v.inBuilding = true; v.inside = '${inside}'; v.moving = false; v.state = 'idle';
      // two other pawns join them inside
      const s1 = VILLAGERS[(inspectedPawnIdx + 1) % VILLAGERS.length];
      const s2 = VILLAGERS[(inspectedPawnIdx + 3) % VILLAGERS.length];
      s1.inBuilding = true; s1.inside = '${inside}'; s1.moving = false;
      s2.inBuilding = true; s2.inside = '${inside}'; s2.moving = false;
    })()`);
    await pg.waitForTimeout(500);
    await pg.evaluate(PIN);
    await pg.screenshot({ path: OUT + 'v52-' + tag + '.png' });
  }
  await br.close();
})();
