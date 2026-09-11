/**
 * LPC Modular Character Generator
 * Maps CharacterDNA into layered LPC components (body, hair, clothes, armor, shoes, tools).
 * Produces clean 64x64 square frames with 100% native RGBA transparency.
 */
'use strict';

const { LpcLayerLoader } = require('./lpc_layer_loader.js');

// Parse HEX to RGB
function hexToRgb(hex) {
  if (!hex || hex[0] !== '#') return { r: 128, g: 128, b: 128 };
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

class LpcCharacterGenerator {
  /**
   * Resolve appropriate LPC layers based on CharacterDNA
   */
  static resolveLayers(dna) {
    const isFemale = dna.genderPresentation === 'feminine';
    const skinTone = (dna.face && dna.face.skinRampKey) || 'light';

    // 1. Base Body
    let bodyAsset = isFemale ? 'body_female_light.png' : 'body_male_light.png';
    if (skinTone === 'tanned' || skinTone === 'olive') {
      bodyAsset = isFemale ? 'body_female_tanned.png' : 'body_male_tanned.png';
    } else if (skinTone === 'deep' || skinTone === 'dark') {
      bodyAsset = isFemale ? 'body_female_dark.png' : 'body_male_dark.png';
    }

    // 2. Hairstyle
    let hairAsset = isFemale ? 'hair_female_ponytail.png' : 'hair_male_bangs.png';
    const hairStyle = (dna.hair && dna.hair.style) || 'short';
    if (isFemale) {
      if (hairStyle === 'long' || hairStyle === 'braided') hairAsset = 'hair_female_long.png';
      else if (hairStyle === 'princess') hairAsset = 'hair_female_princess.png';
      else if (hairStyle === 'bangs') hairAsset = 'hair_female_bangs.png';
    } else {
      if (hairStyle === 'bangslong' || hairStyle === 'messy') hairAsset = 'hair_male_bangslong.png';
      else if (hairStyle === 'plain' || hairStyle === 'short') hairAsset = 'hair_male_plain.png';
    }

    // 3. Torso / Clothing
    const role = (dna.role || 'farmer').toLowerCase();
    let torsoAsset = 'shirt_white.png';
    let armorAsset = null;

    if (role === 'guard' || role === 'knight') {
      armorAsset = 'armor_plate.png';
      torsoAsset = 'shirt_white.png';
    } else if (role === 'hunter' || role === 'scout' || role === 'woodcutter' || role === 'lumberjack') {
      armorAsset = 'leather_armor.png';
      torsoAsset = 'shirt_brown.png';
    } else if (role === 'blacksmith' || role === 'miner' || role === 'mason') {
      torsoAsset = 'shirt_brown.png';
    } else if (role === 'scholar' || role === 'apothecary' || role === 'herbalist') {
      torsoAsset = 'shirt_teal.png';
    } else if (role === 'merchant' || role === 'innkeeper' || role === 'bard') {
      torsoAsset = 'shirt_maroon.png';
    } else if (isFemale && (role === 'baker' || role === 'gardener' || role === 'tailor' || role === 'potter')) {
      torsoAsset = 'dress_female.png';
    }

    // 4. Legs / Pants
    let pantsAsset = 'pants_white.png';
    if (role === 'blacksmith' || role === 'miner') pantsAsset = 'pants_white.png';
    else if (role === 'guard' || role === 'merchant') pantsAsset = 'pants_red.png';
    else if (role === 'scholar' || role === 'herbalist' || role === 'fisherman') pantsAsset = 'pants_teal.png';

    // 5. Shoes
    let shoesAsset = 'shoes_brown.png';
    if (role === 'guard' || role === 'blacksmith') shoesAsset = 'shoes_black.png';
    else if (role === 'merchant' || role === 'scholar') shoesAsset = 'shoes_maroon.png';

    // 6. Weapon / Tool prop
    let weaponAsset = null;
    if (role === 'guard' || role === 'knight') weaponAsset = 'spear.png';
    else if (role === 'hunter' || role === 'fletcher') weaponAsset = 'bow.png';
    else if (role === 'scholar' || role === 'apothecary') weaponAsset = 'woodwand.png';
    else if (role === 'rogue' || role === 'assassin' || role === 'scout') weaponAsset = 'dagger.png';
    else if (role === 'farmer' || role === 'shepherd') weaponAsset = 'spear.png'; // Hand staff/hoe
    else if (role === 'blacksmith' || role === 'miner') weaponAsset = 'dagger.png'; // Small side tool

    // Ordered layers from back to front
    const layers = [
      { name: 'body', asset: bodyAsset },
      { name: 'pants', asset: pantsAsset, tintHex: dna.palette && dna.palette.pants },
      { name: 'shoes', asset: shoesAsset, tintHex: dna.palette && dna.palette.boots },
      { name: 'shirt', asset: torsoAsset, tintHex: dna.palette && dna.palette.shirt },
      armorAsset ? { name: 'armor', asset: armorAsset } : null,
      { name: 'hair', asset: hairAsset },
      weaponAsset ? { name: 'weapon', asset: weaponAsset } : null
    ].filter(Boolean);

    return layers;
  }

  /**
   * Renders a single 64x64 frame from LPC spritesheet coordinates
   * @param {Object} dna - Character DNA
   * @param {number} lpcCol - Column in LPC spritesheet (0..12)
   * @param {number} lpcRow - Row in LPC spritesheet (0..20)
   * @returns {Buffer} 64x64 RGBA buffer (16,384 bytes)
   */
  static renderFrame(dna, lpcCol, lpcRow) {
    const outBuf = Buffer.alloc(64 * 64 * 4); // Clear transparent
    const layers = this.resolveLayers(dna);

    const CELL_W = 64;
    const CELL_H = 64;
    const LPC_SHEET_W = 832;

    const srcStartX = lpcCol * CELL_W;
    const srcStartY = lpcRow * CELL_H;

    for (const layer of layers) {
      const layerData = LpcLayerLoader.getLayer(layer.asset);
      if (!layerData) continue;

      const srcRgba = layerData.rgba;
      let tintRgb = null;
      if (layer.tintHex && layer.name !== 'body' && layer.name !== 'hair') {
        // Optional palette tinting
        tintRgb = hexToRgb(layer.tintHex);
      }

      for (let y = 0; y < CELL_H; y++) {
        const sy = srcStartY + y;
        if (sy >= layerData.height) continue;

        for (let x = 0; x < CELL_W; x++) {
          const sx = srcStartX + x;
          if (sx >= layerData.width) continue;

          const srcIdx = (sy * LPC_SHEET_W + sx) * 4;
          const srcA = srcRgba[srcIdx + 3];
          if (srcA === 0) continue;

          const dstIdx = (y * CELL_W + x) * 4;
          const dstA = outBuf[dstIdx + 3];

          let sr = srcRgba[srcIdx];
          let sg = srcRgba[srcIdx + 1];
          let sb = srcRgba[srcIdx + 2];

          // Alpha blending
          if (dstA === 0 || srcA === 255) {
            outBuf[dstIdx] = sr;
            outBuf[dstIdx + 1] = sg;
            outBuf[dstIdx + 2] = sb;
            outBuf[dstIdx + 3] = srcA;
          } else {
            const alpha = srcA / 255;
            const invAlpha = 1 - alpha;
            outBuf[dstIdx] = Math.round(sr * alpha + outBuf[dstIdx] * invAlpha);
            outBuf[dstIdx + 1] = Math.round(sg * alpha + outBuf[dstIdx + 1] * invAlpha);
            outBuf[dstIdx + 2] = Math.round(sb * alpha + outBuf[dstIdx + 2] * invAlpha);
            outBuf[dstIdx + 3] = Math.min(255, Math.round(srcA + dstA * invAlpha));
          }
        }
      }
    }

    return outBuf;
  }
}

module.exports = { LpcCharacterGenerator };
