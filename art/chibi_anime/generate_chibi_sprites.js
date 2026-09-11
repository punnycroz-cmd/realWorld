/**
 * Chibi Anime Sprite Generator & PNG Exporter
 * Generates both 64x64 Game Sprites and 96x128 Master Art
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { ChibiOrganicGenerator } = require('./chibi_organic_generator.js');
const { ChibiBlueprintEngine } = require('./chibi_blueprint_engine.js');

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

const outDir = path.join(__dirname, 'generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const characters = ['farmer', 'baker'];
const actions = [
  { name: 'idle', frames: 4 },
  { name: 'walk', frames: 6 },
  { name: 'action', frames: 6 }
];

console.log('Rendering Chibi Anime Collections...');

// 1. Render 64x64 Mode
characters.forEach(charType => {
  const sheetW = 6 * 64;
  const sheetH = 3 * 64;
  const sheetBuf = Buffer.alloc(sheetW * sheetH * 4);

  actions.forEach((actObj, rowIdx) => {
    for (let f = 0; f < actObj.frames; f++) {
      const canvas = ChibiBlueprintEngine.renderFrame(charType, actObj.name, f);
      for (let py = 0; py < 64; py++) {
        for (let px = 0; px < 64; px++) {
          const srcIdx = (py * 64 + px) * 4;
          const dstIdx = (((rowIdx * 64 + py) * sheetW) + (f * 64 + px)) * 4;
          sheetBuf[dstIdx] = canvas.data[srcIdx];
          sheetBuf[dstIdx + 1] = canvas.data[srcIdx + 1];
          sheetBuf[dstIdx + 2] = canvas.data[srcIdx + 2];
          sheetBuf[dstIdx + 3] = canvas.data[srcIdx + 3];
        }
      }

      if (rowIdx === 0 && f === 0) {
        writePng(path.join(outDir, `${charType}_portrait_64.png`), 64, 64, Buffer.from(canvas.data));
      }
    }
  });

  const sheetPath = path.join(outDir, `${charType}_chibi_sheet_64.png`);
  writePng(sheetPath, sheetW, sheetH, sheetBuf);
  console.log(`Saved 64x64 sheet: ${sheetPath}`);
});

// 2. Render Master Mode (128x128 for Farmer, 64x128 for Baker)
characters.forEach(charType => {
  const fW = charType === 'farmer' ? 128 : 64;
  const fH = 128;
  const sheetW = 6 * fW;
  const sheetH = 3 * fH;
  const sheetBuf = Buffer.alloc(sheetW * sheetH * 4);

  actions.forEach((actObj, rowIdx) => {
    for (let f = 0; f < actObj.frames; f++) {
      const canvas = ChibiOrganicGenerator.renderFrame(charType, actObj.name, f, 'master');
      for (let py = 0; py < fH; py++) {
        for (let px = 0; px < fW; px++) {
          const srcIdx = (py * fW + px) * 4;
          const dstIdx = (((rowIdx * fH + py) * sheetW) + (f * fW + px)) * 4;
          sheetBuf[dstIdx] = canvas.data[srcIdx];
          sheetBuf[dstIdx + 1] = canvas.data[srcIdx + 1];
          sheetBuf[dstIdx + 2] = canvas.data[srcIdx + 2];
          sheetBuf[dstIdx + 3] = canvas.data[srcIdx + 3];
        }
      }

      if (rowIdx === 0 && f === 0) {
        writePng(path.join(outDir, `${charType}_master_portrait.png`), fW, fH, Buffer.from(canvas.data));
      }
    }
  });

  const sheetPath = path.join(outDir, `${charType}_master_sheet.png`);
  writePng(sheetPath, sheetW, sheetH, sheetBuf);
  console.log(`Saved Master sheet: ${sheetPath}`);
});

console.log('All sprite sheets generated successfully!');
