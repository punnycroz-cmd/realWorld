/**
 * Test Trained Procedural Generator against LPC Ground Truth
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { ROLES_100 } = require('./data/roles_100.js');
const { LpcTrainedProceduralGenerator } = require('./lpc_trained_procedural_generator.js');

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

const testOutDir = path.join(__dirname, 'learned_models');
fs.mkdirSync(testOutDir, { recursive: true });

// Render 9-frame walk cycle test for Blacksmith, Farmer, Guard
const testChars = [ROLES_100[0], ROLES_100[1], ROLES_100[30]];

for (const cDef of testChars) {
  const sheetW = 9 * 64; // 576
  const sheetH = 64;
  const sheetBuf = Buffer.alloc(sheetW * sheetH * 4);

  for (let f = 0; f < 9; f++) {
    const frameCanvas = LpcTrainedProceduralGenerator.renderFrame(cDef, 'walk_down', f);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const srcIdx = (y * 64 + x) * 4;
        const dstIdx = ((y * sheetW) + (f * 64 + x)) * 4;
        sheetBuf[dstIdx] = frameCanvas.data[srcIdx];
        sheetBuf[dstIdx + 1] = frameCanvas.data[srcIdx + 1];
        sheetBuf[dstIdx + 2] = frameCanvas.data[srcIdx + 2];
        sheetBuf[dstIdx + 3] = frameCanvas.data[srcIdx + 3];
      }
    }
  }

  const outPath = path.join(testOutDir, `${cDef.slug}_trained_walk.png`);
  writePng(outPath, sheetW, sheetH, sheetBuf);
  console.log(`Generated Trained Procedural Walk Cycle: ${outPath}`);
}
