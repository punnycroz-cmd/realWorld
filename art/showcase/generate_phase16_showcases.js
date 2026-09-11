/**
 * Phase 16 Visual Showcase Asset Generator
 * 
 * Generates all mandatory visual deliverables:
 * 1. silhouette_sheet.png (20+ diverse silhouettes)
 * 2. face_quality_sheet.png (30+ distinct expressive faces)
 * 3. hair_library.png (20+ structured hairstyles)
 * 4. material_library.png (8 material response swatches)
 * 5. resolution_comparison.png (32x48, 48x72, 64x64, 64x96)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const VP = require('../visual_primitives.js');
const { CharacterDNA } = require('../character_dna.js');
const { CharacterCompositor } = require('../character_compositor.js');
const { FacePainter } = require('../face_painter.js');
const { HairPainter } = require('../hair_painter.js');
const { MaterialPainter } = require('../material_painter.js');

// Fast PNG Writer
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'binary');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function writePng(filePath, width, height, rgbaBuffer) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const rowLength = width * 4;
  const rawData = Buffer.alloc(height * (rowLength + 1));
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (rowLength + 1);
    rawData[rawOffset] = 0;
    rgbaBuffer.copy(rawData, rawOffset + 1, y * rowLength, (y + 1) * rowLength);
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const png = Buffer.concat([
    header,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(filePath, png);
}

const outDir = path.join(__dirname);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// =========================================================================
// 1. SILHOUETTE SHEET (20+ Characters, 5 cols x 4 rows, 64x64 grid -> 320x256)
// =========================================================================
function generateSilhouetteSheet() {
  console.log('Generating: silhouette_sheet.png...');
  const cols = 5;
  const rows = 4;
  const cellW = 64, cellH = 64;
  const sheetW = cols * cellW, sheetH = rows * cellH;
  const sheetBuf = Buffer.alloc(sheetW * sheetH * 4);

  const archetypes = ['farmer', 'baker', 'blacksmith', 'fisherman', 'ranger', 'knight', 'mage'];
  const sexes = ['M', 'F'];
  const ages = [6, 15, 28, 35, 68];

  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const charIndex = r * cols + c;
      const role = archetypes[charIndex % archetypes.length];
      const sex = sexes[charIndex % sexes.length];
      const age = ages[charIndex % ages.length];

      const dna = CharacterDNA.fromVillager({ id: charIndex + 100, role, sex, age });
      dna.role = role;
      const frame = CharacterCompositor.render(dna, 0, 'idle', charIndex % 4, {}, 64, 64);

      // Blit as solid dark silhouette on clean cream/paper background
      const dstX = c * cellW;
      const dstY = r * cellH;

      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const sIdx = (y * cellW + x) * 4;
          const dIdx = ((dstY + y) * sheetW + (dstX + x)) * 4;

          if (frame.data[sIdx + 3] > 30) {
            // Solid dark charcoal silhouette
            sheetBuf[dIdx] = 24;
            sheetBuf[dIdx + 1] = 20;
            sheetBuf[dIdx + 2] = 24;
            sheetBuf[dIdx + 3] = 255;
          } else {
            // Light cream grid background
            sheetBuf[dIdx] = 245;
            sheetBuf[dIdx + 1] = 243;
            sheetBuf[dIdx + 2] = 238;
            sheetBuf[dIdx + 3] = 255;
          }
        }
      }
      count++;
    }
  }

  writePng(path.join(outDir, 'silhouette_sheet.png'), sheetW, sheetH, sheetBuf);
  console.log(`  -> Saved: silhouette_sheet.png (${count} characters)`);
}

// =========================================================================
// 2. FACE QUALITY SHEET (30+ Distinct Faces, 6 cols x 5 rows, 32x32 crop -> 192x160)
// =========================================================================
function generateFaceQualitySheet() {
  console.log('Generating: face_quality_sheet.png...');
  const cols = 6;
  const rows = 5;
  const cellW = 32, cellH = 32;
  const sheetW = cols * cellW, sheetH = rows * cellH;
  const sheetBuf = Buffer.alloc(sheetW * sheetH * 4);

  const shapes = ['oval', 'round', 'broad', 'angular', 'weathered'];
  const skinTones = ['light', 'tan', 'deep'];
  const hairColors = ['blonde', 'auburn', 'black', 'grey'];
  const beards = [null, 'mustache', 'full_beard', null];

  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cvs = new VP.PixelCanvas(32, 32);

      const dna = {
        ageYears: idx > 24 ? 65 : (idx < 5 ? 6 : 28 + (idx % 20)),
        face: {
          shape: shapes[idx % shapes.length],
          skinRampKey: skinTones[idx % skinTones.length],
          facialHair: beards[idx % beards.length]
        },
        hair: {
          colorRampKey: hairColors[idx % hairColors.length],
          style: (idx % 3 === 0) ? 'short' : ((idx % 3 === 1) ? 'bob' : 'long')
        },
        anatomy: {
          archetype: (idx % 4 === 0) ? 'broad_heavy' : 'average_build'
        }
      };

      // Paint face centered at (16, 16)
      FacePainter.paintFace(cvs, 16, 15, dna, 0, (idx % 7 === 0), (idx % 5 === 0), 20);
      HairPainter.paintFrontHair(cvs, 16, 15, dna, 0, 30);
      CharacterCompositor.applySelectiveContour(cvs);

      // Blit to sheet with border
      const dstX = c * cellW;
      const dstY = r * cellH;

      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const sIdx = (y * cellW + x) * 4;
          const dIdx = ((dstY + y) * sheetW + (dstX + x)) * 4;

          if (x === 0 || y === 0) {
            // Grid line
            sheetBuf[dIdx] = 40; sheetBuf[dIdx+1] = 45; sheetBuf[dIdx+2] = 55; sheetBuf[dIdx+3] = 255;
          } else if (cvs.data[sIdx + 3] > 30) {
            sheetBuf[dIdx] = cvs.data[sIdx];
            sheetBuf[dIdx + 1] = cvs.data[sIdx + 1];
            sheetBuf[dIdx + 2] = cvs.data[sIdx + 2];
            sheetBuf[dIdx + 3] = 255;
          } else {
            // Dark blue-slate backdrop
            sheetBuf[dIdx] = 15; sheetBuf[dIdx+1] = 20; sheetBuf[dIdx+2] = 30; sheetBuf[dIdx+3] = 255;
          }
        }
      }
      count++;
    }
  }

  writePng(path.join(outDir, 'face_quality_sheet.png'), sheetW, sheetH, sheetBuf);
  console.log(`  -> Saved: face_quality_sheet.png (${count} faces)`);
}

// =========================================================================
// 3. HAIR LIBRARY (20 Distinct Hairstyles, 5 cols x 4 rows, 48x48 -> 240x192)
// =========================================================================
function generateHairLibrary() {
  console.log('Generating: hair_library.png...');
  const cols = 5;
  const rows = 4;
  const cellW = 48, cellH = 48;
  const sheetW = cols * cellW, sheetH = rows * cellH;
  const sheetBuf = Buffer.alloc(sheetW * sheetH * 4);

  const styles = [
    'short', 'long', 'bob', 'braid', 'ponytail',
    'bun', 'messy', 'straight', 'wavy', 'shaved',
    'elder', 'topknot', 'twintails', 'curly', 'bangs',
    'side_part', 'braided', 'cropped', 'parted', 'flowing'
  ];
  const colors = ['blonde', 'auburn', 'black', 'grey'];

  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cvs = new VP.PixelCanvas(48, 48);

      const dna = {
        ageYears: (idx === 10) ? 72 : 25,
        face: { skinRampKey: 'light' },
        hair: {
          style: styles[idx % styles.length],
          colorRampKey: colors[idx % colors.length]
        },
        anatomy: {}
      };

      // Base head silhouette
      const skinRamp = MaterialPainter.getRamp('skin', '#dda078');
      FacePainter.paintHeadBase(cvs, 24, 24, 'oval', skinRamp, 10);
      HairPainter.paintBackHair(cvs, 24, 24, dna, 0, 5);
      HairPainter.paintFrontHair(cvs, 24, 24, dna, 0, 20);
      CharacterCompositor.applySelectiveContour(cvs);

      const dstX = c * cellW;
      const dstY = r * cellH;

      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const sIdx = (y * cellW + x) * 4;
          const dIdx = ((dstY + y) * sheetW + (dstX + x)) * 4;

          if (x === 0 || y === 0) {
            sheetBuf[dIdx] = 50; sheetBuf[dIdx+1] = 55; sheetBuf[dIdx+2] = 65; sheetBuf[dIdx+3] = 255;
          } else if (cvs.data[sIdx + 3] > 30) {
            sheetBuf[dIdx] = cvs.data[sIdx];
            sheetBuf[dIdx + 1] = cvs.data[sIdx + 1];
            sheetBuf[dIdx + 2] = cvs.data[sIdx + 2];
            sheetBuf[dIdx + 3] = 255;
          } else {
            sheetBuf[dIdx] = 18; sheetBuf[dIdx+1] = 22; sheetBuf[dIdx+2] = 32; sheetBuf[dIdx+3] = 255;
          }
        }
      }
      count++;
    }
  }

  writePng(path.join(outDir, 'hair_library.png'), sheetW, sheetH, sheetBuf);
  console.log(`  -> Saved: hair_library.png (${count} hairstyles)`);
}

// =========================================================================
// 4. MATERIAL LIBRARY (8 Material Swatches -> 256x64)
// =========================================================================
function generateMaterialLibrary() {
  console.log('Generating: material_library.png...');
  const materials = ['skin', 'hair', 'linen', 'cotton', 'wool', 'leather', 'metal', 'straw'];
  const swatchW = 32, swatchH = 64;
  const sheetW = materials.length * swatchW, sheetH = swatchH;
  const sheetBuf = Buffer.alloc(sheetW * sheetH * 4);

  for (let m = 0; m < materials.length; m++) {
    const mat = materials[m];
    const ramp = MaterialPainter.getRamp(mat);
    const startX = m * swatchW;

    for (let y = 0; y < swatchH; y++) {
      for (let x = 0; x < swatchW; x++) {
        const dIdx = (y * sheetW + (startX + x)) * 4;

        if (x === 0) {
          // Divider
          sheetBuf[dIdx] = 30; sheetBuf[dIdx+1] = 35; sheetBuf[dIdx+2] = 45; sheetBuf[dIdx+3] = 255;
          continue;
        }

        // Display the 7-tone ramp gradient
        const tone = Math.min(6, Math.floor((y / (swatchH - 16)) * 7));
        const hex = ramp[tone] || ramp[3];
        const rgb = VP.parseHex(hex);

        // Specular demonstration in lower section
        if (y >= swatchH - 16) {
          if (x > 8 && x < 24 && y > swatchH - 12 && y < swatchH - 4) {
            sheetBuf[dIdx] = rgb.r;
            sheetBuf[dIdx+1] = rgb.g;
            sheetBuf[dIdx+2] = rgb.b;
            sheetBuf[dIdx+3] = 255;
            if (x === 12 && y === swatchH - 8) {
              // Highlight glint
              sheetBuf[dIdx] = 255; sheetBuf[dIdx+1] = 255; sheetBuf[dIdx+2] = 255;
            }
          } else {
            sheetBuf[dIdx] = 20; sheetBuf[dIdx+1] = 24; sheetBuf[dIdx+2] = 32; sheetBuf[dIdx+3] = 255;
          }
        } else {
          sheetBuf[dIdx] = rgb.r;
          sheetBuf[dIdx+1] = rgb.g;
          sheetBuf[dIdx+2] = rgb.b;
          sheetBuf[dIdx+3] = 255;
        }
      }
    }
  }

  writePng(path.join(outDir, 'material_library.png'), sheetW, sheetH, sheetBuf);
  console.log(`  -> Saved: material_library.png (${materials.length} materials)`);
}

// =========================================================================
// 5. RESOLUTION COMPARISON (32x48, 48x72, 64x64, 64x96)
// =========================================================================
function generateResolutionComparison() {
  console.log('Generating: resolution_comparison.png...');
  const dna = CharacterDNA.fromVillager({ id: 1, role: 'farmer', age: 30, sex: 'M' });
  dna.role = 'farmer';

  // Generate at native resolutions, then display side-by-side in 384x128 banner
  const canvasW = 384, canvasH = 128;
  const sheetBuf = Buffer.alloc(canvasW * canvasH * 4);
  sheetBuf.fill(20); // Dark backdrop

  const targets = [
    { label: '32x48', w: 32, h: 48, x: 20, y: 40 },
    { label: '48x72', w: 48, h: 72, x: 80, y: 28 },
    { label: '64x64', w: 64, h: 64, x: 160, y: 32 },
    { label: '64x96', w: 64, h: 96, x: 260, y: 16 }
  ];

  targets.forEach(t => {
    const rendered = CharacterCompositor.render(dna, 0, 'idle', 0, {}, t.w, t.h);
    for (let y = 0; y < t.h; y++) {
      for (let x = 0; x < t.w; x++) {
        const sIdx = (y * t.w + x) * 4;
        const dIdx = ((t.y + y) * canvasW + (t.x + x)) * 4;
        if (rendered.data[sIdx + 3] > 30) {
          sheetBuf[dIdx] = rendered.data[sIdx];
          sheetBuf[dIdx + 1] = rendered.data[sIdx + 1];
          sheetBuf[dIdx + 2] = rendered.data[sIdx + 2];
          sheetBuf[dIdx + 3] = 255;
        }
      }
    }
  });

  writePng(path.join(outDir, 'resolution_comparison.png'), canvasW, canvasH, sheetBuf);
  console.log('  -> Saved: resolution_comparison.png');
}

async function main() {
  generateSilhouetteSheet();
  generateFaceQualitySheet();
  generateHairLibrary();
  generateMaterialLibrary();
  generateResolutionComparison();

  // Export Individual Characters for Reference Comparison
  console.log('Generating individual character comparison sprites...');
  const characters = ['farmer', 'baker', 'blacksmith', 'fisherman', 'ranger', 'knight', 'mage'];
  characters.forEach(role => {
    const dna = CharacterDNA.fromVillager({ id: 10, role, age: 30, sex: 'M' });
    dna.role = role;
    const c = CharacterCompositor.render(dna, 0, 'idle', 0, {}, 64, 64);
    writePng(path.join(outDir, `natura_${role}_64.png`), 64, 64, Buffer.from(c.data));
  });
  console.log('  -> Exported 7 individual character sprites (64x64).');

  console.log('All Phase 16 Visual Showcases Generated Successfully!');
}

main().catch(console.error);
