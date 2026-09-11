/**
 * Perceptual Critic (Phase 15.11)
 * Evaluates generator output against visual learning metrics rather than strict procedural rules.
 */
'use strict';

const fs = require('fs');
const { CharacterDNA } = require('./character_dna.js');
const { CharacterGenerator } = require('./character_generator.js');

function evaluatePerceptual(dna, canvas) {
  let score = 1.0;
  let deductions = [];

  const w = canvas.width;
  const h = canvas.height;
  let pixels = 0;
  let silhouetteDensity = 0;
  let hasOutline = false;
  let zLayersUsed = new Set();
  
  for (let i = 0; i < canvas.data.length; i += 4) {
    if (canvas.data[i+3] > 0) {
      pixels++;
      // Edge check
      if (canvas.data[i] < 60 && canvas.data[i+1] < 50) hasOutline = true;
    }
  }

  // 1. Silhouette Structure
  if (pixels < 250) {
    score -= 0.3;
    deductions.push("Silhouette lacks volume (under 250 pixels).");
  }

  // 2. Local Contrast & Edge Structure
  if (!hasOutline) {
    score -= 0.2;
    deductions.push("Lacks selective dark outlining for readability.");
  }

  // 3. Proportions
  // Ensure feet touch ground
  let touchesGround = false;
  for(let x=12; x<20; x++) {
     if(canvas.getPixel(x, 42)) touchesGround = true;
  }
  if (!touchesGround) {
    score -= 0.15;
    deductions.push("Character does not appear anchored to the ground.");
  }

  // Ensure head exists at expected height
  if (!canvas.getPixel(16, 17)) {
    score -= 0.2;
    deductions.push("Missing core facial pixels at expected anchor (16, 17).");
  }

  return { score: Math.max(0, score), deductions };
}

function runPerceptualAudit() {
  console.log("Running Perceptual Evaluation Loop...");
  const refData = JSON.parse(fs.readFileSync('./art/reference_library/high_fidelity_references.json', 'utf8'));
  
  let totalScore = 0;
  let results = [];

  for (const ref of refData.characters) {
    // Generate DNA from reference
    const dna = new CharacterDNA({
      id: ref.id,
      ageYears: ref.anatomy.agePhase === 'child' ? 5 : (ref.anatomy.agePhase === 'elder' ? 65 : 30),
      face: { skinRampKey: ref.face.skinTone, mouthShape: 'neutral', noseGeometry: 'straight', eyeShape: 'normal' },
      hair: { style: ref.hair.style, colorRampKey: ref.hair.color },
      clothing: { archetype: ref.clothing.family.split('-')[0], layers: { trousersOrSkirt: 'trousers', footwear: 'boots' } },
      palette: { shirt: '#35633f', pants: '#25395c', boots: '#422810' },
      anatomy: { heightScale: 1.0, widthScale: 1.0, shoulderWidth: 10 },
      condition: { wetness: ref.condition === 'wet' ? 1.0 : 0 }
    });

    const canvas = CharacterGenerator.renderFrame(dna, 0, 'idle', 0);
    const evalResult = evaluatePerceptual(dna, canvas);
    
    totalScore += evalResult.score;
    results.push({
      id: ref.id,
      score: evalResult.score,
      deductions: evalResult.deductions
    });
  }

  const finalScore = totalScore / refData.characters.length;
  console.log(`Perceptual Score: ${(finalScore * 100).toFixed(2)}%`);
  
  const report = {
    timestamp: new Date().toISOString(),
    averageScore: finalScore,
    details: results
  };

  fs.writeFileSync('./art/perceptual_report.json', JSON.stringify(report, null, 2));
  console.log("Saved perceptual_report.json");
}

runPerceptualAudit();
