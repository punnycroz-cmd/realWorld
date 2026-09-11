/**
 * Natura Standardized AI Sprite Sheet Generator
 * Standardizes raw AI sprite sheets according to the New Quality Standard:
 * 1. 100% Transparent Background Removal (Chroma-Key + Alpha Edge Smoothing).
 * 2. Strict Uniform Square Grid (128x128 px per cell).
 * 3. Exact Horizontal Dead-Centering and Ground Baseline Foot-Locking (Zero Jitter).
 * 4. Exports both assembled sprite sheet PNG and individual frame PNGs + JSON metadata.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

// CRC32 table & PNG Writer
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  }
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
  const rowLen = width * 4;
  const raw = Buffer.alloc(height * (rowLen + 1));
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (rowLen + 1);
    raw[rawOffset] = 0;
    rgbaBuffer.copy(raw, rawOffset + 1, y * rowLen, (y + 1) * rowLen);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    header,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(filePath, png);
}

const CHARACTERS = [
  {
    slug: 'blacksmith',
    folder: '01_blacksmith',
    name: 'Brom Ironbeard',
    titleVi: 'Thợ Rèn Luyện Kim',
    actionVi: 'Rèn Đe Đập Búa Tóe Lửa',
    rawImg: '01_blacksmith.png',
    idleSlices: [
      [20, 35, 220, 280], [275, 35, 220, 280], [530, 35, 220, 280], [785, 35, 220, 280]
    ],
    walkSlices: [
      [5, 355, 160, 280], [175, 355, 160, 280], [345, 355, 160, 280],
      [515, 355, 160, 280], [685, 355, 160, 280], [855, 355, 160, 280]
    ],
    actionSlices: [
      [5, 690, 165, 290], [175, 690, 165, 290], [345, 720, 165, 260],
      [510, 745, 165, 245], [675, 745, 170, 245], [845, 745, 165, 245]
    ]
  },
  {
    slug: 'farmer',
    folder: '02_farmer',
    name: 'Marta Greenleaf',
    titleVi: 'Nông Dân Cần Mẫn',
    actionVi: 'Gặt Lúa Mì Bằng Liềm Vàng',
    rawImg: '02_farmer.png',
    idleSlices: [
      [35, 30, 180, 230], [305, 30, 180, 230], [545, 30, 180, 230], [805, 30, 180, 230]
    ],
    walkSlices: [
      [35, 280, 140, 230], [195, 280, 140, 230], [355, 280, 140, 230],
      [515, 280, 140, 230], [675, 280, 140, 230], [835, 280, 140, 230]
    ],
    actionSlices: [
      [55, 775, 240, 220], [410, 775, 240, 220], [710, 750, 260, 240]
    ]
  },
  {
    slug: 'baker',
    folder: '03_baker',
    name: 'Clara Hearthstone',
    titleVi: 'Thợ Bánh Mì',
    actionVi: 'Nhào & Cán Bột Bụi Phấn',
    rawImg: '03_baker.png',
    idleSlices: [
      [55, 30, 150, 270], [305, 30, 150, 270], [555, 30, 150, 270], [805, 30, 150, 270]
    ],
    walkSlices: [
      [35, 355, 140, 285], [190, 355, 140, 285], [345, 355, 140, 285],
      [515, 355, 140, 285], [675, 355, 140, 285], [835, 355, 140, 285]
    ],
    actionSlices: [
      [30, 700, 240, 270], [270, 700, 240, 270], [560, 710, 210, 260], [780, 710, 210, 260]
    ]
  },
  {
    slug: 'guard',
    folder: '04_guard',
    name: 'Sir Roland',
    titleVi: 'Vệ Binh Hoàng Gia',
    actionVi: 'Thủ Khiên & Chém Kiếm Vệt Sáng',
    rawImg: '04_guard.png',
    idleSlices: [
      [195, 85, 135, 215], [355, 85, 135, 215], [515, 85, 135, 215], [675, 85, 135, 215]
    ],
    walkSlices: [
      [45, 415, 140, 215], [205, 415, 140, 215], [360, 415, 140, 215],
      [515, 415, 140, 215], [675, 415, 140, 215], [830, 415, 140, 215]
    ],
    actionSlices: [
      [35, 760, 150, 205], [205, 720, 145, 240], [345, 765, 150, 200],
      [500, 720, 140, 240], [660, 725, 175, 235], [825, 710, 145, 250]
    ]
  },
  {
    slug: 'fisherman',
    folder: '05_fisherman',
    name: 'Captain Sean',
    titleVi: 'Ngư Dân Biển Sâu',
    actionVi: 'Quăng Dây Câu & Giật Cá Bạc',
    rawImg: '05_fisherman.png',
    idleSlices: [
      [75, 55, 175, 225], [325, 55, 175, 225], [560, 55, 175, 225], [800, 55, 175, 225]
    ],
    walkSlices: [
      [40, 350, 130, 235], [200, 350, 130, 235], [360, 350, 130, 235],
      [515, 350, 130, 235], [670, 350, 130, 235], [830, 350, 130, 235]
    ],
    actionSlices: [
      [40, 675, 140, 275], [215, 715, 160, 235], [295, 670, 310, 280],
      [620, 685, 180, 265], [800, 665, 175, 285]
    ]
  },
  {
    slug: 'scholar',
    folder: '06_scholar',
    name: 'Master Eldon',
    titleVi: 'Nhà Giả Kim Học Giả',
    actionVi: 'Pha Chế Thuốc & Khói Tím Ma Thuật',
    rawImg: '06_scholar.png',
    idleSlices: [
      [60, 40, 155, 250], [315, 40, 155, 250], [560, 40, 155, 250], [805, 40, 155, 250]
    ],
    walkSlices: [
      [30, 350, 145, 255], [195, 350, 145, 255], [350, 350, 145, 255],
      [510, 350, 145, 255], [675, 350, 145, 255], [830, 350, 145, 255]
    ],
    actionSlices: [
      [30, 715, 160, 230], [195, 720, 155, 225], [360, 725, 155, 220],
      [515, 720, 150, 225], [670, 655, 175, 290], [830, 715, 155, 230]
    ]
  }
];

const SQ = 128; // Fixed 128x128 square cell size
const BASELINE_Y = 114; // Fixed ground baseline
const COLS = 6;
const ROWS = 3;
const SHEET_W = COLS * SQ; // 768 px
const SHEET_H = ROWS * SQ; // 384 px

function processCharacter(charDef) {
  const baseAiDir = path.resolve(__dirname, '../ai_spritesheets');
  const targetDir = path.join(baseAiDir, 'standardized', charDef.folder);
  const framesDir = path.join(targetDir, 'frames');
  fs.mkdirSync(framesDir, { recursive: true });

  const rawPath = path.join(baseAiDir, charDef.rawImg);
  const tempBmp = path.join('/tmp', `temp_${charDef.slug}.bmp`);
  execSync(`sips -s format bmp "${rawPath}" --out "${tempBmp}"`);

  const bmp = fs.readFileSync(tempBmp);
  const offset = bmp.readUInt32LE(10);

  // Sample background color (multiple edge points)
  let bgR = 0, bgG = 0, bgB = 0;
  const samples = [
    [10, 10], [1014, 10], [10, 1014], [1014, 1014],
    [512, 10], [10, 512], [1014, 512]
  ];
  for (const [sx, sy] of samples) {
    const idx = offset + sy * 3072 + sx * 3;
    bgB += bmp[idx]; bgG += bmp[idx + 1]; bgR += bmp[idx + 2];
  }
  bgR = Math.round(bgR / samples.length);
  bgG = Math.round(bgG / samples.length);
  bgB = Math.round(bgB / samples.length);

  // Convert 1024x1024 to RGBA with clean background transparency
  const rgba1024 = Buffer.alloc(1024 * 1024 * 4);
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const bIdx = offset + y * 3072 + x * 3;
      const b = bmp[bIdx], g = bmp[bIdx + 1], r = bmp[bIdx + 2];
      const dIdx = (y * 1024 + x) * 4;
      const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
      rgba1024[dIdx] = r;
      rgba1024[dIdx + 1] = g;
      rgba1024[dIdx + 2] = b;
      if (dist < 28) {
        rgba1024[dIdx + 3] = 0; // Transparent
      } else if (dist < 42) {
        rgba1024[dIdx + 3] = Math.round(((dist - 28) / 14) * 255);
      } else {
        rgba1024[dIdx + 3] = 255;
      }
    }
  }

  // Master Standardized Sprite Sheet (768 x 384 px)
  const masterSheet = Buffer.alloc(SHEET_W * SHEET_H * 4);

  function placeFrame(srcSlice, col, row, frameName) {
    const [srcX, srcY, srcW, srcH] = srcSlice;
    let minX = srcX + srcW, maxX = srcX, minY = srcY + srcH, maxY = srcY;
    let found = false;

    for (let y = srcY; y < srcY + srcH; y++) {
      for (let x = srcX; x < srcX + srcW; x++) {
        const a = rgba1024[(y * 1024 + x) * 4 + 3];
        if (a > 30) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) return;

    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const scale = Math.min(1.0, 96 / Math.max(cw, ch));
    const sw = Math.round(cw * scale);
    const sh = Math.round(ch * scale);

    // Centered in 128x128 square
    const cellOffsetX = Math.round((SQ - sw) / 2);
    const cellOffsetY = Math.round(BASELINE_Y - sh);

    // Individual frame buffer (128x128)
    const singleFrame = Buffer.alloc(SQ * SQ * 4);

    for (let dy = 0; dy < sh; dy++) {
      const sy = minY + Math.floor(dy / scale);
      for (let dx = 0; dx < sw; dx++) {
        const sx = minX + Math.floor(dx / scale);
        const sIdx = (sy * 1024 + sx) * 4;

        // Blit to Master Sheet
        const sheetX = col * SQ + cellOffsetX + dx;
        const sheetY = row * SQ + cellOffsetY + dy;
        const dIdx = (sheetY * SHEET_W + sheetX) * 4;
        masterSheet[dIdx] = rgba1024[sIdx];
        masterSheet[dIdx + 1] = rgba1024[sIdx + 1];
        masterSheet[dIdx + 2] = rgba1024[sIdx + 2];
        masterSheet[dIdx + 3] = rgba1024[sIdx + 3];

        // Blit to Single Frame
        const fIdx = ((cellOffsetY + dy) * SQ + (cellOffsetX + dx)) * 4;
        singleFrame[fIdx] = rgba1024[sIdx];
        singleFrame[fIdx + 1] = rgba1024[sIdx + 1];
        singleFrame[fIdx + 2] = rgba1024[sIdx + 2];
        singleFrame[fIdx + 3] = rgba1024[sIdx + 3];
      }
    }

    // Save individual 128x128 transparent frame
    writePng(path.join(framesDir, `${frameName}.png`), SQ, SQ, singleFrame);
  }

  // Row 0: Idle (4 frames)
  charDef.idleSlices.forEach((s, idx) => placeFrame(s, idx, 0, `idle_${idx}`));

  // Row 1: Walk (6 frames)
  charDef.walkSlices.forEach((s, idx) => placeFrame(s, idx, 1, `walk_${idx}`));

  // Row 2: Action (6 frames)
  charDef.actionSlices.forEach((s, idx) => placeFrame(s, idx, 2, `action_${idx}`));

  // Write Master Standardized Sprite Sheet
  const sheetPngPath = path.join(targetDir, `${charDef.slug}_spritesheet_standard.png`);
  writePng(sheetPngPath, SHEET_W, SHEET_H, masterSheet);

  // Write Metadata JSON
  const meta = {
    slug: charDef.slug,
    name: charDef.name,
    titleVi: charDef.titleVi,
    actionVi: charDef.actionVi,
    standard: {
      transparent: true,
      squareGrid: true,
      cellWidth: SQ,
      cellHeight: SQ,
      baselineY: BASELINE_Y,
      sheetWidth: SHEET_W,
      sheetHeight: SHEET_H,
      columns: COLS,
      rows: ROWS,
      masterSheet: `${charDef.slug}_spritesheet_standard.png`
    },
    animations: {
      idle: { row: 0, startCol: 0, frameCount: charDef.idleSlices.length, fps: 4, loop: true },
      walk: { row: 1, startCol: 0, frameCount: charDef.walkSlices.length, fps: 8, loop: true },
      profession: {
        row: 2,
        startCol: 0,
        frameCount: charDef.actionSlices.length,
        fps: 8,
        loop: true,
        labelVi: charDef.actionVi
      }
    }
  };
  fs.writeFileSync(path.join(targetDir, `${charDef.slug}_meta.json`), JSON.stringify(meta, null, 2));

  console.log(`[SUCCESS] Standardized ${charDef.name} -> ${charDef.folder}/ (128x128 square grid, transparent background)`);
}

function run() {
  console.log('--- Starting Standardization Pipeline According to New Standard ---');
  CHARACTERS.forEach(c => processCharacter(c));
  console.log('--- All Characters Standardized Successfully! ---');
}

run();
