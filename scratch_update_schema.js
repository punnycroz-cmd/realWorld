const fs = require('fs');

const schemaPath = './art/character_dna.schema.json';
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Update Anatomy
schema.properties.anatomy.properties = {
  ...schema.properties.anatomy.properties,
  "headScale": { "type": "number", "minimum": 0.5, "maximum": 1.5 },
  "armProportions": { "type": "number", "minimum": 0.5, "maximum": 1.5 },
  "handSize": { "type": "number", "minimum": 0.5, "maximum": 1.5 },
  "footSize": { "type": "number", "minimum": 0.5, "maximum": 1.5 },
  "stance": { "type": "string", "enum": ["neutral", "wide", "narrow", "pigeon_toed", "splayed"] }
};

// Update Face
schema.properties.face.properties = {
  ...schema.properties.face.properties,
  "faceWidth": { "type": "number", "minimum": 0.5, "maximum": 1.5 },
  "faceHeight": { "type": "number", "minimum": 0.5, "maximum": 1.5 },
  "eyeSpacing": { "type": "number", "minimum": 1, "maximum": 8 },
  "eyeScale": { "type": "number", "minimum": 0.5, "maximum": 1.5 },
  "browAngle": { "type": "number", "minimum": -45, "maximum": 45 },
  "noseGeometry": { "type": "string", "enum": ["subtle", "straight", "aquiline", "button", "broad", "hooked"] },
  "mouthShape": { "type": "string", "enum": ["neutral", "thin", "full", "smile", "firm", "pursed"] },
  "cheekVolume": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
  "jawShape": { "type": "string", "enum": ["soft", "angular", "square", "pointed", "jowls", "weak"] }
};

// Update Hair
schema.properties.hair.properties = {
  ...schema.properties.hair.properties,
  "silhouette": { "type": "string" },
  "strandGroups": { "type": "number", "minimum": 1, "maximum": 7 },
  "sideMass": { "type": "number", "minimum": 0, "maximum": 1 },
  "backMass": { "type": "number", "minimum": 0, "maximum": 1 },
  "highlightDirection": { "type": "string", "enum": ["upper_left", "top", "diffuse"] }
};

// Update Clothing
schema.properties.clothing.properties.layers.properties = {
  ...schema.properties.clothing.properties.layers.properties,
  "seamPlacement": { "type": "string" },
  "foldStyle": { "type": "string" },
  "cuffs": { "type": "string" },
  "collar": { "type": "string" },
  "hems": { "type": "string" }
};
schema.properties.clothing.properties["materialType"] = { "type": "string", "enum": ["linen", "wool", "leather", "rough_cloth"] };

// Add Material base property
schema.properties.material = {
  "type": "object",
  "properties": {
    "roughness": { "type": "number", "minimum": 0, "maximum": 1 },
    "shadowDepth": { "type": "number", "minimum": 0, "maximum": 1 },
    "highlightStrength": { "type": "number", "minimum": 0, "maximum": 1 },
    "edgeResponse": { "type": "number", "minimum": 0, "maximum": 1 },
    "textureDensity": { "type": "number", "minimum": 0, "maximum": 1 }
  }
};

// Update Style
schema.properties.style.properties = {
  ...schema.properties.style.properties,
  "clusterSize": { "type": "number" },
  "outlineStrength": { "type": "number" },
  "contrast": { "type": "number" },
  "paletteCompression": { "type": "number" },
  "pixelRhythm": { "type": "string" }
};

fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
console.log("Updated DNA Schema.");
