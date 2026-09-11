/**
 * Phase 15.16 Population Generation
 */
const fs = require('fs');
const { CharacterDNA } = require('./art/character_dna.js');
const { CharacterGenerator } = require('./art/character_generator.js');

console.log("Generating population of 250 characters...");

const results = [];
let failures = 0;

for (let i = 0; i < 250; i++) {
  try {
    const v = {
      id: 1000 + i,
      name: `Villager_${i}`,
      sex: i % 2 === 0 ? 'F' : 'M',
      age: 5 + (i % 70)
    };
    
    const dna = CharacterDNA.fromVillager(v);
    const canvas = CharacterGenerator.renderFrame(dna, 0, 'idle', 0);
    
    // Check for pixel dropout
    let pixels = 0;
    for (let p = 0; p < canvas.data.length; p += 4) {
      if (canvas.data[p+3] > 0) pixels++;
    }
    
    if (pixels < 200) {
      failures++;
      results.push({ id: v.id, status: "failed", reason: "low pixel count", pixels });
    } else {
      results.push({ id: v.id, status: "passed", pixels });
    }
  } catch (err) {
    failures++;
    results.push({ id: 1000 + i, status: "failed", reason: err.message });
  }
}

const report = {
  total: 250,
  failures,
  successRate: ((250 - failures) / 250 * 100).toFixed(1) + "%",
  details: results.slice(0, 10) // store a sample to avoid huge file
};

fs.writeFileSync('./art/population_report.json', JSON.stringify(report, null, 2));
console.log(`Population test complete. Failures: ${failures}`);
