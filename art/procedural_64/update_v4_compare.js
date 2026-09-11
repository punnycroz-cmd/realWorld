/**
 * Render V4 Spritesheet to procedural_64/generated
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { ROLES_100 } = require('../lpc_100/data/roles_100.js');
const { LpcTrainedProceduralGenerator } = require('../lpc_100/lpc_trained_procedural_generator.js');

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

const sampleRoles = [
  { slug: 'blacksmith', roleDef: ROLES_100[0] },
  { slug: 'farmer', roleDef: ROLES_100[1] },
  { slug: 'guard', roleDef: ROLES_100[30] }
];

const CELL_W = 64;
const CELL_H = 64;
const COLS = 6;
const ROWS = 4;
const SHEET_W = COLS * CELL_W;
const SHEET_H = ROWS * CELL_H;

for (const s of sampleRoles) {
  const sheetBuf = Buffer.alloc(SHEET_W * SHEET_H * 4);

  function blit(canvas, col, row) {
    for (let y = 0; y < CELL_H; y++) {
      for (let x = 0; x < CELL_W; x++) {
        const srcIdx = (y * CELL_W + x) * 4;
        const dstIdx = (((row * CELL_H + y) * SHEET_W) + (col * CELL_W + x)) * 4;
        sheetBuf[dstIdx] = canvas.data[srcIdx];
        sheetBuf[dstIdx + 1] = canvas.data[srcIdx + 1];
        sheetBuf[dstIdx + 2] = canvas.data[srcIdx + 2];
        sheetBuf[dstIdx + 3] = canvas.data[srcIdx + 3];
      }
    }
  }

  // Row 0: Idle Down (4f)
  for (let f = 0; f < 4; f++) {
    const c = LpcTrainedProceduralGenerator.renderFrame(s.roleDef, 'idle', f);
    blit(c, f, 0);
  }

  // Row 1: Walk Down (6f)
  for (let f = 0; f < 6; f++) {
    const c = LpcTrainedProceduralGenerator.renderFrame(s.roleDef, 'walk_down', f);
    blit(c, f, 1);
  }

  // Row 2: Walk Right (6f)
  for (let f = 0; f < 6; f++) {
    const c = LpcTrainedProceduralGenerator.renderFrame(s.roleDef, 'walk_down', f);
    blit(c, f, 2);
  }

  // Row 3: Action (6f)
  for (let f = 0; f < 6; f++) {
    const c = LpcTrainedProceduralGenerator.renderFrame(s.roleDef, 'walk_down', f);
    blit(c, f, 3);
  }

  const outPath = path.join(__dirname, 'generated', `${s.slug}_procedural64.png`);
  writePng(outPath, SHEET_W, SHEET_H, sheetBuf);
  console.log(`Updated Procedural 64x64 V4 for: ${outPath}`);
}
