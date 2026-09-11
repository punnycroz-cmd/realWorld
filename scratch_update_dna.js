const fs = require('fs');

const file = './art/character_dna.js';
let content = fs.readFileSync(file, 'utf8');

// Injecting new high fidelity anatomy properties
content = content.replace(/torsoLegRatio\,\n\s*hunchForward\n\s*\}\,/g, `torsoLegRatio,
        hunchForward,
        armProportions: 1.0,
        handSize: 1.0,
        footSize: 1.0,
        stance: 'neutral'
      },`);

// Injecting new high fidelity face properties
content = content.replace(/wrinkleIntensity: age > 55 \? Math\.min\(1\.0, \(age - 55\) \/ 25\) : 0\n\s*\}\,/g, `wrinkleIntensity: age > 55 ? Math.min(1.0, (age - 55) / 25) : 0,
        faceWidth: 1.0,
        faceHeight: 1.0,
        eyeSpacing: 5,
        eyeScale: 1.0,
        browAngle: 0,
        noseGeometry: 'straight',
        mouthShape: 'neutral',
        cheekVolume: 0.5,
        jawShape: 'angular'
      },`);

// Injecting new high fidelity hair properties
content = content.replace(/accessory: sex === 'feminine' && hairStyle === 'braided' \? 'ribbon' : null\n\s*\}\,/g, `accessory: sex === 'feminine' && hairStyle === 'braided' ? 'ribbon' : null,
        silhouette: hairStyle,
        strandGroups: 3,
        sideMass: 0.5,
        backMass: 0.5,
        highlightDirection: 'upper_left'
      },`);

// Injecting new high fidelity clothing/materials properties
content = content.replace(/wearLevel: age > 40 \? 0\.35 : 0\.1\n\s*\}\,/g, `wearLevel: age > 40 ? 0.35 : 0.1,
        materialType: 'linen'
      },
      material: {
        roughness: 0.5,
        shadowDepth: 0.5,
        highlightStrength: 0.5,
        edgeResponse: 0.5,
        textureDensity: 0.5
      },`);

// Injecting new high fidelity style properties
content = content.replace(/shadingQuality: 'volumetric_smooth'\n\s*\}\n\s*\}\)/g, `shadingQuality: 'volumetric_smooth',
        clusterSize: 2,
        outlineStrength: 1.0,
        contrast: 1.0,
        paletteCompression: 1.0,
        pixelRhythm: 'natural'
      }
    })`);

fs.writeFileSync(file, content);
console.log("Updated art/character_dna.js");
