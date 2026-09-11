const fs = require('fs');

const ages = ['child', 'youth', 'adult', 'middle-aged', 'elder'];
const bodies = ['short', 'slim', 'average', 'tall', 'broad', 'heavy', 'athletic'];
const faces = ['round', 'oval', 'long', 'broad', 'angular', 'soft', 'narrow', 'expressive', 'masculine', 'feminine', 'neutral', 'age-varied'];
const hairs = ['short-cropped', 'long-flowing', 'bob', 'braided', 'ponytail', 'tied-back', 'curly', 'wavy', 'straight', 'messy', 'layered', 'bun', 'shaved', 'partially-shaved', 'elderly-thin'];
const clothings = ['farmer-work', 'artisan-craftsman', 'hunter-leathers', 'fisherman-waterproof', 'traveler-cloak', 'villager-casual', 'winter-heavy', 'summer-light', 'rain-slick', 'worn-tattered', 'wealthy-fine', 'simple-linen', 'layered-warm', 'practical-apron', 'worker-tunic'];
const accessories = ['basket', 'hoe', 'hammer', 'axe', 'broom', 'fishing-rod', 'knife', 'shovel', 'bag', 'lantern', 'mug', 'tool-bundle', 'none'];
const conditions = ['healthy', 'tired', 'exhausted', 'cold', 'hot', 'wet', 'dirty', 'injured', 'sick', 'carrying-heavy'];

const palettes = ['light', 'tan', 'deep', 'pale_sickly', 'fever_flush'];
const hairColors = ['black', 'brown', 'blonde', 'auburn', 'grey'];

const references = [];

let idCounter = 1;
function makeRef(age, body, face, hair, clothing, acc, cond, palette, hairC) {
    references.push({
        id: `ref_${idCounter.toString().padStart(3, '0')}`,
        name: `Reference ${idCounter}`,
        anatomy: { agePhase: age, build: body },
        face: { shape: face, expression: 'neutral', skinTone: palette },
        hair: { style: hair, color: hairC },
        clothing: { family: clothing },
        accessory: acc,
        condition: cond
    });
    idCounter++;
}

// Ensure at least 60 diverse references
// 15 specific archetype bases to ensure every hair and clothing type is hit once, then combinations.
for (let i = 0; i < 60; i++) {
    const age = ages[i % ages.length];
    const body = bodies[i % bodies.length];
    const face = faces[i % faces.length];
    const hair = hairs[i % hairs.length];
    const clothing = clothings[i % clothings.length];
    const acc = accessories[i % accessories.length];
    const cond = conditions[i % conditions.length];
    const palette = palettes[i % palettes.length];
    const hairC = hairColors[i % hairColors.length];
    
    makeRef(age, body, face, hair, clothing, acc, cond, palette, hairC);
}

// Specifically craft a few very unique ones to ensure extreme variations are represented
makeRef('child', 'short', 'round', 'messy', 'summer-light', 'none', 'dirty', 'tan', 'blonde');
makeRef('elder', 'slim', 'angular', 'elderly-thin', 'winter-heavy', 'lantern', 'cold', 'pale_sickly', 'grey');
makeRef('adult', 'athletic', 'masculine', 'shaved', 'hunter-leathers', 'axe', 'healthy', 'deep', 'black');
makeRef('middle-aged', 'broad', 'soft', 'bun', 'artisan-craftsman', 'hammer', 'tired', 'light', 'auburn');
makeRef('youth', 'average', 'expressive', 'braided', 'traveler-cloak', 'bag', 'wet', 'tan', 'brown');

fs.mkdirSync('./art/reference_library', { recursive: true });
fs.writeFileSync(
    './art/reference_library/high_fidelity_references.json', 
    JSON.stringify({
        version: "1.0.0",
        description: "High-quality reference set for visual learning and perceptual evaluation.",
        characters: references
    }, null, 2)
);
console.log(`Generated ${references.length} high-fidelity references.`);
