const fs = require('fs');
const grammarPath = './art/character_grammar.json';
let grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));

// Update version
grammar.version = "2.0.0";

// Add high-fidelity grammar structures
grammar.detailHierarchy = [
  "face", "eyes", "hair_silhouette", "fringe", "hands", "tools", "upper_torso", "clothing_folds", "legs", "boots", "micro_decoration"
];

grammar.multiScale = {
  "supportedNativeScales": [
    { "width": 32, "height": 48, "tag": "1x" },
    { "width": 48, "height": 72, "tag": "1.5x" },
    { "width": 64, "height": 96, "tag": "2x" }
  ],
  "downsampleStrategy": "pixel_aware_reduction"
};

// Expand face grammar
grammar.faceGrammar.eyeShapes = {
  "round": { "width": 2, "height": 2, "lidArc": true },
  "narrow": { "width": 2, "height": 1, "lidArc": false },
  "drooping": { "width": 2, "height": 2, "lidArc": true, "bagShadow": true }
};
grammar.faceGrammar.jawlines = ["soft", "angular", "square", "pointed", "jowls"];

// Expand materials
grammar.materials = {
  "linen": { "finish": "matte", "contrast": "low", "highlightStyle": "soft" },
  "leather": { "finish": "specular", "contrast": "high", "highlightStyle": "sharp" },
  "wool": { "finish": "matte", "contrast": "lowest", "highlightStyle": "none", "ditherEdges": true },
  "metal": { "finish": "metallic", "contrast": "extreme", "highlightStyle": "1px_glint" }
};

fs.writeFileSync(grammarPath, JSON.stringify(grammar, null, 2));
console.log("Updated character_grammar.json for Phase 15.3");
