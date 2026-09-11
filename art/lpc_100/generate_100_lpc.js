/**
 * LPC 100 Character Full-Animation Generator
 * Compiles all 100 characters with complete master spritesheets (832x1344 px)
 * and all 6 animation categories (Spellcast, Thrust, Walk, Slash, Shoot, Hurt).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { CharacterDNA } = require('../character_dna.js');
const { LpcLayerLoader } = require('../lpc/lpc_layer_loader.js');
const { ROLES_100 } = require('./data/roles_100.js');

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

const MASTER_W = 832;
const MASTER_H = 1344;
const TOTAL_PIXELS = MASTER_W * MASTER_H;

async function generateAll100() {
  const outBase = path.join(__dirname, 'characters');
  fs.mkdirSync(outBase, { recursive: true });

  const manifest = [];
  console.log(`Starting Full Master Spritesheet generation for ${ROLES_100.length} characters...`);

  for (let i = 0; i < ROLES_100.length; i++) {
    const cDef = ROLES_100[i];
    const padId = String(cDef.id).padStart(3, '0');
    const folderName = `${padId}_${cDef.slug}`;
    const charDir = path.join(outBase, folderName);
    const framesDir = path.join(charDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    // Determine layered asset stack
    const isFemale = cDef.sex === 'F';
    const bodyAsset = `body_${isFemale ? 'female' : 'male'}_${cDef.skin}.png`;

    const layerStack = [
      bodyAsset,
      cDef.pants,
      cDef.shoes,
      cDef.shirt,
      cDef.hair,
      cDef.weapon
    ].filter(Boolean);

    // Master 832x1344 Composite Buffer
    const masterBuf = Buffer.alloc(TOTAL_PIXELS * 4);

    for (const assetName of layerStack) {
      const layer = LpcLayerLoader.getLayer(assetName);
      if (!layer) continue;

      const srcRgba = layer.rgba;
      for (let p = 0; p < TOTAL_PIXELS; p++) {
        const idx = p * 4;
        const srcA = srcRgba[idx + 3];
        if (srcA === 0) continue;

        const dstA = masterBuf[idx + 3];
        if (dstA === 0 || srcA === 255) {
          masterBuf[idx] = srcRgba[idx];
          masterBuf[idx + 1] = srcRgba[idx + 1];
          masterBuf[idx + 2] = srcRgba[idx + 2];
          masterBuf[idx + 3] = srcA;
        } else {
          const a = srcA / 255;
          const invA = 1 - a;
          masterBuf[idx] = Math.round(srcRgba[idx] * a + masterBuf[idx] * invA);
          masterBuf[idx + 1] = Math.round(srcRgba[idx + 1] * a + masterBuf[idx + 1] * invA);
          masterBuf[idx + 2] = Math.round(srcRgba[idx + 2] * a + masterBuf[idx + 2] * invA);
          masterBuf[idx + 3] = Math.min(255, Math.round(srcA + dstA * invA));
        }
      }
    }

    // Write Master Full Spritesheet (832x1344)
    const masterPngPath = path.join(charDir, `${cDef.slug}_full_sheet.png`);
    writePng(masterPngPath, MASTER_W, MASTER_H, masterBuf);

    // Also extract 6 representative animation preview frames into frames/
    // 1. Idle Down (Col 0, Row 10)
    // 2. Walk Down (Col 1, Row 10)
    // 3. Walk Right (Col 1, Row 11)
    // 4. Slash Down (Col 2, Row 14)
    // 5. Thrust Down (Col 3, Row 6)
    // 6. Hurt (Col 3, Row 20)
    const previewSpecs = [
      { name: 'idle_down', col: 0, row: 10 },
      { name: 'walk_down', col: 1, row: 10 },
      { name: 'walk_right', col: 1, row: 11 },
      { name: 'slash_down', col: 2, row: 14 },
      { name: 'thrust_down', col: 3, row: 6 },
      { name: 'hurt_down', col: 3, row: 20 }
    ];

    for (const spec of previewSpecs) {
      const fBuf = Buffer.alloc(64 * 64 * 4);
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const srcIdx = (((spec.row * 64 + y) * MASTER_W) + (spec.col * 64 + x)) * 4;
          const dstIdx = (y * 64 + x) * 4;
          fBuf[dstIdx] = masterBuf[srcIdx];
          fBuf[dstIdx + 1] = masterBuf[srcIdx + 1];
          fBuf[dstIdx + 2] = masterBuf[srcIdx + 2];
          fBuf[dstIdx + 3] = masterBuf[srcIdx + 3];
        }
      }
      writePng(path.join(framesDir, `${spec.name}.png`), 64, 64, fBuf);
    }

    // Write JSON metadata
    const jsonMeta = {
      id: cDef.id,
      slug: cDef.slug,
      name: cDef.name,
      titleVi: cDef.titleVi,
      role: cDef.role,
      sex: cDef.sex,
      skin: cDef.skin,
      spritesheet: {
        width: MASTER_W,
        height: MASTER_H,
        cellWidth: 64,
        cellHeight: 64,
        masterFile: `${cDef.slug}_full_sheet.png`
      },
      animations: {
        spellcast_up: { row: 0, frameCount: 7, fps: 8 },
        spellcast_left: { row: 1, frameCount: 7, fps: 8 },
        spellcast_down: { row: 2, frameCount: 7, fps: 8 },
        spellcast_right: { row: 3, frameCount: 7, fps: 8 },
        thrust_up: { row: 4, frameCount: 8, fps: 8 },
        thrust_left: { row: 5, frameCount: 8, fps: 8 },
        thrust_down: { row: 6, frameCount: 8, fps: 8 },
        thrust_right: { row: 7, frameCount: 8, fps: 8 },
        walk_up: { row: 8, frameCount: 9, fps: 10 },
        walk_left: { row: 9, frameCount: 9, fps: 10 },
        walk_down: { row: 10, frameCount: 9, fps: 10 },
        walk_right: { row: 11, frameCount: 9, fps: 10 },
        slash_up: { row: 12, frameCount: 6, fps: 8 },
        slash_left: { row: 13, frameCount: 6, fps: 8 },
        slash_down: { row: 14, frameCount: 6, fps: 8 },
        slash_right: { row: 15, frameCount: 6, fps: 8 },
        shoot_up: { row: 16, frameCount: 13, fps: 12 },
        shoot_left: { row: 17, frameCount: 13, fps: 12 },
        shoot_down: { row: 18, frameCount: 13, fps: 12 },
        shoot_right: { row: 19, frameCount: 13, fps: 12 },
        hurt_collapse: { row: 20, frameCount: 6, fps: 6 }
      }
    };

    fs.writeFileSync(path.join(charDir, `${cDef.slug}.json`), JSON.stringify(jsonMeta, null, 2));

    manifest.push({
      id: cDef.id,
      slug: cDef.slug,
      name: cDef.name,
      titleVi: cDef.titleVi,
      role: cDef.role,
      sex: cDef.sex,
      folder: folderName,
      masterSheet: `${folderName}/${cDef.slug}_full_sheet.png`,
      jsonFile: `${folderName}/${cDef.slug}.json`,
      previewFrame: `${folderName}/frames/idle_down.png`
    });

    if ((i + 1) % 10 === 0 || i === ROLES_100.length - 1) {
      console.log(`[${i + 1}/100] Master Spritesheets generated.`);
    }
  }

  fs.writeFileSync(path.join(outBase, 'lpc_100_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Finished generating all 100 LPC Master Characters!');
}

generateAll100().catch(err => {
  console.error('Fatal error generating 100 LPC characters:', err);
  process.exit(1);
});
