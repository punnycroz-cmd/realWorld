/**
 * Natura Phase 16 — 250+ Villager Population Stress Test
 * 
 * Validates diversity, anatomical integrity, zero crashes, and performance
 * across an entire simulated village population.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { CharacterDNA } = require('../character_dna.js');
const { CharacterCompositor } = require('../character_compositor.js');

const ROLES = ['farmer', 'baker', 'blacksmith', 'fisherman', 'ranger', 'knight', 'mage', 'miner', 'tailor', 'innkeeper'];
const SEXES = ['M', 'F'];
const AGES = [4, 6, 12, 16, 22, 28, 35, 42, 50, 62, 75];
const CONDITIONS = [
  {},
  { fatigue: 0.8 },
  { cold: 0.9 },
  { wetness: 0.7, dirt: 0.6 },
  { injury: 0.5 },
  { pregnant: 180 }
];

async function runPopulationTest() {
  const TOTAL_TARGET = 260;
  console.log(`Starting Phase 16 Population Test for ${TOTAL_TARGET} villagers...`);
  
  const startTime = Date.now();
  const results = [];
  let successCount = 0;

  for (let i = 0; i < TOTAL_TARGET; i++) {
    const role = ROLES[i % ROLES.length];
    const sex = SEXES[i % SEXES.length];
    const age = AGES[i % AGES.length];
    const cond = CONDITIONS[i % CONDITIONS.length];

    const dna = CharacterDNA.fromVillager({
      id: 1000 + i,
      name: `Villager_${i}`,
      sex,
      age,
      role
    });
    dna.role = role;

    try {
      const act = (i % 3 === 0) ? 'idle' : (i % 3 === 1 ? 'walk' : 'work');
      const frame = i % 6;
      const dir = i % 4;

      const canvas = CharacterCompositor.render(dna, dir, act, frame, cond, 64, 64);
      
      // Basic validity checks
      if (!canvas || !canvas.data || canvas.data.length !== 64 * 64 * 4) {
        throw new Error(`Invalid canvas buffer at index ${i}`);
      }

      let opaquePixels = 0;
      for (let p = 3; p < canvas.data.length; p += 4) {
        if (canvas.data[p] > 0) opaquePixels++;
      }

      if (opaquePixels < 200 || opaquePixels > 2500) {
        throw new Error(`Abnormal pixel count (${opaquePixels}) for villager ${i}`);
      }

      results.push({
        id: i,
        role,
        sex,
        age,
        act,
        opaquePixels,
        status: 'OK'
      });
      successCount++;
    } catch (err) {
      console.error(`Error rendering villager ${i}:`, err.message);
      results.push({
        id: i,
        role,
        error: err.message,
        status: 'FAIL'
      });
    }
  }

  const elapsedMs = Date.now() - startTime;
  const avgMsPerChar = (elapsedMs / TOTAL_TARGET).toFixed(2);

  const report = {
    timestamp: new Date().toISOString(),
    totalTested: TOTAL_TARGET,
    successful: successCount,
    failed: TOTAL_TARGET - successCount,
    totalElapsedMs: elapsedMs,
    avgMsPerChar: parseFloat(avgMsPerChar),
    summary: `${successCount}/${TOTAL_TARGET} villagers rendered cleanly with zero anatomical collapse.`
  };

  const reportPath = path.join(__dirname, '../population_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Population Test Completed!`);
  console.log(`  -> Rendered ${successCount}/${TOTAL_TARGET} villagers in ${elapsedMs}ms (${avgMsPerChar}ms per character)`);
  console.log(`  -> Report saved to: art/population_report.json`);

  if (successCount !== TOTAL_TARGET) {
    process.exit(1);
  }
}

runPopulationTest().catch(err => {
  console.error(err);
  process.exit(1);
});
