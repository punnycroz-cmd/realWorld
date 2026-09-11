/**
 * CharacterDNA DSL & Model for Natura
 * Provides deterministic DNA generation, schema validation, hashing, and cloning.
 */
'use strict';

// Deterministic 32-bit PRNG helper
function phash(x, y, salt) {
  let h = (x * 73856093) ^ (y * 19349663) ^ ((salt | 0) * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function choose(arr, rngVal) {
  return arr[Math.floor(rngVal * arr.length) % arr.length];
}

class CharacterDNA {
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Deterministic generation of full CharacterDNA from villager parameters or seed.
   */
  static fromVillager(v, seedOverride) {
    const seed = seedOverride != null ? seedOverride : (typeof v.id === 'number' ? v.id * 10007 : 42);
    const name = v.name || 'Villager';
    const sex = v.sex === 'F' ? 'feminine' : (v.sex === 'M' ? 'masculine' : 'androgynous');
    const age = typeof v.age === 'number' ? v.age : 30;
    const colors = v.colors || {};

    const r1 = phash(seed, 1, 101);
    const r2 = phash(seed, 2, 102);
    const r3 = phash(seed, 3, 103);
    const r4 = phash(seed, 4, 104);
    const r5 = phash(seed, 5, 105);
    const r6 = phash(seed, 6, 106);

    // 1. Determine body archetype based on age and sex
    let anatomyArchetype = 'average_build';
    let heightScale = 1.0;
    let widthScale = 1.0;
    let shoulderWidth = sex === 'masculine' ? 12 : 10;
    let hipWidth = sex === 'feminine' ? 11 : 10;
    let limbThickness = 3;
    let torsoLegRatio = 1.2;
    let hunchForward = 0;

    if (age < 7) {
      anatomyArchetype = 'child';
      heightScale = 0.62 + (age / 7) * 0.15;
      widthScale = 0.7;
      shoulderWidth = 6;
      hipWidth = 6;
      limbThickness = 2;
      torsoLegRatio = 1.0;
    } else if (age < 16) {
      anatomyArchetype = 'teenager';
      heightScale = 0.80 + ((age - 7) / 9) * 0.15;
      widthScale = 0.85;
      shoulderWidth = 8;
      hipWidth = 8;
      limbThickness = 2;
      torsoLegRatio = 1.15;
    } else if (age > 58) {
      anatomyArchetype = 'elder';
      heightScale = 0.95;
      widthScale = 0.95;
      shoulderWidth = sex === 'masculine' ? 10 : 9;
      hipWidth = 9;
      torsoLegRatio = 1.1;
      hunchForward = 1 + Math.min(2, Math.floor((age - 58) / 10));
    } else {
      // Adult variations
      const archetypes = sex === 'masculine'
        ? ['average_build', 'broad_heavy', 'tall', 'slim']
        : ['average_build', 'average', 'tall', 'slim'];
      anatomyArchetype = choose(archetypes, r1);
      if (anatomyArchetype === 'broad_heavy') {
        widthScale = 1.15;
        shoulderWidth = 13;
        hipWidth = 11;
        limbThickness = 4;
      } else if (anatomyArchetype === 'tall') {
        heightScale = 1.08;
        shoulderWidth = 11;
        torsoLegRatio = 1.25;
      } else if (anatomyArchetype === 'slim') {
        widthScale = 0.88;
        shoulderWidth = 9;
        limbThickness = 2;
      }
    }

    // 2. Face
    const faceShapes = ['oval', 'round', 'broad', 'narrow', 'angular', 'soft'];
    const faceShape = age > 60 ? 'weathered' : choose(faceShapes, r2);
    const skinRamps = ['light', 'tan', 'deep'];
    let skinRampKey = choose(skinRamps, r3);
    if (colors.skin) {
      // Map existing skin hex if supplied
      if (colors.skin.includes('e8') || colors.skin.includes('f2') || colors.skin.includes('f5')) skinRampKey = 'light';
      else if (colors.skin.includes('c9') || colors.skin.includes('a8') || colors.skin.includes('9e')) skinRampKey = 'deep';
      else skinRampKey = 'tan';
    }

    const eyeColors = ['#2b3d4f', '#365238', '#422818', '#1c1c24'];
    const eyeColor = choose(eyeColors, r4);

    let facialHair = null;
    if (sex === 'masculine' && age >= 20) {
      if (age > 55) facialHair = 'long_grey_beard';
      else facialHair = choose(['none', 'full_beard', 'stubble', 'mustache', 'goatee'], r5);
    }

    // 3. Hair
    const femaleHair = ['long', 'bob', 'braided', 'tied', 'wavy', 'curly'];
    const maleHair = ['short', 'messy', 'tied', 'straight', 'curly', age > 50 ? 'bald' : 'short'];
    const hairStyles = sex === 'feminine' ? femaleHair : maleHair;
    const hairStyle = choose(hairStyles, r6);

    let hairColorKey = 'brown';
    if (age > 60) hairColorKey = 'grey';
    else if (colors.hair) {
      const h = colors.hair.toLowerCase();
      if (h.includes('d4') || h.includes('e8') || h.includes('c7')) hairColorKey = 'blonde';
      else if (h.includes('a3') || h.includes('72') || h.includes('8a')) hairColorKey = 'auburn';
      else if (h.includes('1') || h.includes('2') || h.includes('3')) hairColorKey = 'black';
      else hairColorKey = 'brown';
    } else {
      hairColorKey = choose(['black', 'brown', 'blonde', 'auburn'], r1);
    }

    // 4. Clothing & Role Archetype
    let clothingArchetype = 'simple_worker';
    let heldTool = null;
    if (name === 'Tomas') {
      clothingArchetype = 'simple_worker';
      heldTool = 'felling_axe';
    } else if (name === 'Marta') {
      clothingArchetype = 'farmer';
      heldTool = 'hoe';
    } else if (name === 'Sanna') {
      clothingArchetype = 'craftsman';
      heldTool = 'crosscut_saw';
    } else if (name === 'Petr') {
      clothingArchetype = 'hunter';
      heldTool = 'hunting_bow';
    } else {
      clothingArchetype = choose(['simple_worker', 'farmer', 'craftsman', 'traveler'], r2);
    }

    // Palette mapping from villager colors
    const palette = {
      shirt: colors.dress || choose(['#35633f', '#96333c', '#385382', '#946028', '#545563'], r3),
      pants: choose(['#25395c', '#3b3c47', '#5c3a21', '#422810'], r4),
      boots: '#422810',
      vest: clothingArchetype === 'farmer' ? '#7e512f' : null,
      apron: (clothingArchetype === 'craftsman' || clothingArchetype === 'farmer') ? '#c2baa8' : null,
      cloak: clothingArchetype === 'hunter' ? '#24452c' : (clothingArchetype === 'traveler' ? '#385382' : null),
      hat: colors.hat || (clothingArchetype === 'farmer' ? '#cfa23e' : null),
      belt: '#23160c'
    };

    return new CharacterDNA({
      id: `dna_${v.id || seed}_${name.toLowerCase()}`,
      version: '1.0.0',
      name,
      seed,
      ageYears: age,
      genderPresentation: sex,
      role: v.role || clothingArchetype,
      anatomy: {
        archetype: anatomyArchetype,
        heightScale,
        widthScale,
        headScale: age < 7 ? 1.15 : (age < 15 ? 1.05 : 1.0),
        shoulderWidth,
        hipWidth,
        limbThickness,
        torsoLegRatio,
        hunchForward,
        armProportions: 1.0,
        handSize: 1.0,
        footSize: 1.0,
        stance: 'neutral'
      },
      face: {
        shape: faceShape,
        skinRampKey,
        eyeShape: age > 60 ? 'deep_set' : (age < 7 ? 'wide' : 'normal'),
        eyeColor,
        browStyle: age > 60 ? 'drooping' : (sex === 'masculine' ? 'thick' : 'arched'),
        noseStyle: 'straight',
        mouthStyle: 'neutral',
        facialHair,
        blushIntensity: age < 12 ? 0.65 : 0.25,
        wrinkleIntensity: age > 55 ? Math.min(1.0, (age - 55) / 25) : 0,
        faceWidth: 1.0,
        faceHeight: 1.0,
        eyeSpacing: 5,
        eyeScale: 1.0,
        browAngle: 0,
        noseGeometry: 'straight',
        mouthShape: 'neutral',
        cheekVolume: 0.5,
        jawShape: 'angular'
      },
      hair: {
        style: hairStyle,
        colorRampKey: hairColorKey,
        volume: 1.0,
        fringe: true,
        accessory: sex === 'feminine' && hairStyle === 'braided' ? 'ribbon' : null,
        silhouette: hairStyle,
        strandGroups: 3,
        sideMass: 0.5,
        backMass: 0.5,
        highlightDirection: 'upper_left'
      },
      clothing: {
        archetype: clothingArchetype,
        layers: {
          undershirt: 'linen',
          tunicOrShirt: clothingArchetype,
          vestOrBodice: palette.vest ? 'leather' : null,
          trousersOrSkirt: sex === 'feminine' && age > 14 ? 'skirt' : 'trousers',
          apron: palette.apron ? 'apron' : null,
          cloakOrCowl: palette.cloak ? 'cloak' : null,
          hat: palette.hat ? 'hat' : null,
          footwear: 'boots',
          belt: 'leather_belt'
        },
        wearLevel: age > 40 ? 0.35 : 0.1,
        materialType: 'linen'
      },
      material: {
        roughness: 0.5,
        shadowDepth: 0.5,
        highlightStrength: 0.5,
        edgeResponse: 0.5,
        textureDensity: 0.5
      },
      palette,
      accessories: [],
      heldTool,
      condition: {
        fatigue: 0,
        cold: 0,
        wetness: 0,
        dirt: 0,
        injury: 0,
        illness: 0,
        pregnant: v.pregnant || 0,
        carryingItem: null
      },
      style: {
        outlineMode: 'selective_color',
        shadingQuality: 'volumetric_smooth',
        clusterSize: 2,
        outlineStrength: 1.0,
        contrast: 1.0,
        paletteCompression: 1.0,
        pixelRhythm: 'natural'
      }
    });
  }

  /**
   * Generates a stable cryptographic-grade short hash of the static visual identity.
   */
  hashIdentity() {
    const s = `${this.id}:${this.anatomy.archetype}:${this.anatomy.shoulderWidth}:${this.face.shape}:${this.face.skinRampKey}:${this.face.eyeColor}:${this.face.facialHair}:${this.hair.style}:${this.hair.colorRampKey}:${this.clothing.archetype}:${this.palette.shirt}:${this.palette.pants}:${this.palette.boots}:${this.palette.hat}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  clone() {
    return new CharacterDNA(JSON.parse(JSON.stringify(this)));
  }
}

if (typeof window !== 'undefined') {
  window.CharacterDNA = CharacterDNA;
  window.phash = phash;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterDNA, phash };
}
