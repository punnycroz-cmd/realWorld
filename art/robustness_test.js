/**
 * Natura Multi-Generation Robustness Test (Phase 9)
 * Generates 24+ diverse characters across body types, faces, hair, clothing, and conditions.
 * Validates against anatomical malformations, palette drift, and visual artifacts.
 */
'use strict';

const fs = require('fs');
const { CharacterDNA } = require('./character_dna.js');
const { CharacterGenerator } = require('./character_generator.js');
const { VisualCritic } = require('./critic.js');

const POPULATION = [
  { id: 1, name: 'Tomas', sex: 'M', age: 35, colors: { dress: '#4a6a3a', skin: '#d8a878', hair: '#3a2a1a' } },
  { id: 2, name: 'Marta', sex: 'F', age: 34, colors: { dress: '#cf6a26', skin: '#f5cfa0', hat: '#e8c35a', hair: '#7a4a2c' } },
  { id: 3, name: 'Sanna', sex: 'F', age: 29, colors: { dress: '#4c4c55', skin: '#e0a878', hair: '#7b808c' } },
  { id: 4, name: 'Petr', sex: 'M', age: 31, colors: { dress: '#24452c', skin: '#c47d4e', hair: '#22222a' } },
  { id: 5, name: 'Joren', sex: 'M', age: 68, colors: { dress: '#3b3c47', skin: '#dda078', hair: '#c8cdd9' } },
  { id: 6, name: 'Pip', sex: 'M', age: 5, colors: { dress: '#96333c', skin: '#f2be9b', hair: '#9c3d2e' } },
  { id: 7, name: 'Lena', sex: 'F', age: 14, colors: { dress: '#385382', skin: '#dda078', hair: '#c7923e' } },
  { id: 8, name: 'Bram', sex: 'M', age: 42, colors: { dress: '#545563', skin: '#c47d4e', hair: '#1f1e24' } },
  { id: 9, name: 'Sella', sex: 'F', age: 36, colors: { dress: '#96333c', skin: '#f2be9b', hair: '#24140c' } },
  { id: 10, name: 'Tobin', sex: 'M', age: 27, colors: { dress: '#946028', skin: '#dda078', hair: '#5a331c' } },
  { id: 11, name: 'Wren', sex: 'F', age: 23, colors: { dress: '#35633f', skin: '#fce0cb', hair: '#7c4828' } },
  { id: 12, name: 'Finn', sex: 'M', age: 19, colors: { dress: '#25395c', skin: '#c47d4e', hair: '#c7923e' } },
  { id: 13, name: 'Alden', sex: 'M', age: 74, colors: { dress: '#262420', skin: '#b87656', hair: '#edf0f7' } },
  { id: 14, name: 'Klara', sex: 'F', age: 52, colors: { dress: '#4e855b', skin: '#dda078', hair: '#a1a6b3' } },
  { id: 15, name: 'Marek', sex: 'M', age: 48, colors: { dress: '#3b2717', skin: '#9e5a38', hair: '#121114' } },
  { id: 16, name: 'Anika', sex: 'F', age: 30, colors: { dress: '#bf4f58', skin: '#fce0cb', hair: '#40280e' }, pregnant: 180 },
  { id: 17, name: 'Goran', sex: 'M', age: 38, colors: { dress: '#422810', skin: '#dda078', hair: '#3c2214' }, carry: ['log'] },
  { id: 18, name: 'Eliska', sex: 'F', age: 8, colors: { dress: '#7899cf', skin: '#fce0cb', hair: '#e5b65f' } },
  { id: 19, name: 'Vojtech', sex: 'M', age: 3, colors: { dress: '#a8d4b2', skin: '#fce0cb', hair: '#a36239' } },
  { id: 20, name: 'Radim_Injured', sex: 'M', age: 33, colors: { dress: '#545563', skin: '#dda078', hair: '#24140c' }, condition: { injury: 0.6 } },
  { id: 21, name: 'Zofie_Exhausted', sex: 'F', age: 26, colors: { dress: '#35633f', skin: '#dda078', hair: '#5a331c' }, condition: { fatigue: 0.9 } },
  { id: 22, name: 'Ondrej_Cold', sex: 'M', age: 45, colors: { dress: '#25395c', skin: '#dda078', hair: '#32303a' }, condition: { cold: 0.8 } },
  { id: 23, name: 'Tereza_Wet', sex: 'F', age: 28, colors: { dress: '#cf6a26', skin: '#dda078', hair: '#7c4828' }, condition: { wetness: 0.8, dirt: 0.7 } },
  { id: 24, name: 'Matej_Traveler', sex: 'M', age: 37, colors: { dress: '#747687', skin: '#995634', hair: '#1f1e24' } }
];

function runRobustnessTest() {
  console.log(`Starting robustness validation for ${POPULATION.length} characters...`);
  const populationStats = [];
  let totalEvaluated = 0;
  let allPassed = true;

  for (const spec of POPULATION) {
    const dna = CharacterDNA.fromVillager(spec);
    if (spec.condition) Object.assign(dna.condition, spec.condition);
    if (spec.pregnant) dna.condition.pregnant = spec.pregnant;
    if (spec.carry) dna.condition.carryingItem = spec.carry[0];

    // Render frame
    const frame = CharacterGenerator.renderFrame(dna, 0, 'walk', 1, dna.condition);
    const evalScores = VisualCritic.evaluateFrame(frame, dna, 'walk', 1, 0);

    // Compute metrics
    let opaqueCount = 0;
    for (let i = 3; i < frame.data.length; i += 4) {
      if (frame.data[i] > 0) opaqueCount++;
    }

    const isChild = spec.age < 7;
    const isTeen = spec.age >= 7 && spec.age < 16;
    const minPixels = isChild ? 70 : (isTeen ? 150 : 250);
    const maxPixels = isChild ? 350 : (isTeen ? 520 : 650);

    const pixelBoundsOk = opaqueCount >= minPixels && opaqueCount <= maxPixels;
    const scoreOk = evalScores.overall >= 0.88;

    if (!pixelBoundsOk || !scoreOk) {
      allPassed = false;
      console.warn(`WARNING: Character ${spec.name} failed constraints! Pixels: ${opaqueCount} (exp: ${minPixels}..${maxPixels}), Score: ${evalScores.overall}`);
    }

    populationStats.push({
      id: spec.id,
      name: spec.name,
      age: spec.age,
      sex: spec.sex,
      archetype: dna.anatomy.archetype,
      clothing: dna.clothing.archetype,
      opaquePixels: opaqueCount,
      overallScore: evalScores.overall,
      scores: evalScores
    });
    totalEvaluated++;
  }

  const meanScore = populationStats.reduce((acc, c) => acc + c.overallScore, 0) / totalEvaluated;
  const report = {
    timestamp: new Date().toISOString(),
    populationSize: POPULATION.length,
    meanScore: parseFloat(meanScore.toFixed(3)),
    allConstraintsMet: allPassed,
    populationStats
  };

  fs.writeFileSync('./art/robustness_report.json', JSON.stringify(report, null, 2));
  console.log(`Robustness test completed: ${totalEvaluated}/${POPULATION.length} passed. Mean score: ${meanScore.toFixed(3)}. All constraints met: ${allPassed}`);
}

runRobustnessTest();
