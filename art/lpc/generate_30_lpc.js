/**
 * LPC High-Fidelity 30 Character Batch Generator
 * Standard: 64x64 square frames, 100% transparent RGBA, 0 jitter.
 * Produces:
 *   - 1x Spritesheet: 576 x 448 px (9 cols x 7 rows)
 *   - 2x Upscaled Spritesheet: 1152 x 896 px
 *   - Individual transparent frame PNGs in /frames/
 *   - Detailed JSON animation metadata
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const { CharacterDNA } = require('../character_dna.js');
const { LpcCharacterGenerator } = require('./lpc_character_generator.js');

// CRC32 table & PNG writer (zero external dependencies)
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
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
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
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const rowLength = width * 4;
  const rawData = Buffer.alloc(height * (rowLength + 1));
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (rowLength + 1);
    rawData[rawOffset] = 0; // Filter: none
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

function upscale(width, height, rgbaBuffer, scale = 2) {
  const wOut = width * scale;
  const hOut = height * scale;
  const out = Buffer.alloc(wOut * hOut * 4);
  for (let y = 0; y < hOut; y++) {
    const origY = Math.floor(y / scale);
    for (let x = 0; x < wOut; x++) {
      const origX = Math.floor(x / scale);
      const srcIdx = (origY * width + origX) * 4;
      const dstIdx = (y * wOut + x) * 4;
      out[dstIdx] = rgbaBuffer[srcIdx];
      out[dstIdx + 1] = rgbaBuffer[srcIdx + 1];
      out[dstIdx + 2] = rgbaBuffer[srcIdx + 2];
      out[dstIdx + 3] = rgbaBuffer[srcIdx + 3];
    }
  }
  return { width: wOut, height: hOut, buffer: out };
}

// 30 Diverse Character Specifications
const CHARACTERS_30 = [
  { id: 1, slug: 'blacksmith', name: 'Brom Ironbeard', titleVi: 'Thợ Rèn Luyện Kim', role: 'blacksmith', sex: 'M', age: 38, actionVi: 'Rèn Đe Đập Búa', colors: { skin: '#d8a878', hair: '#1f1e24' } },
  { id: 2, slug: 'farmer', name: 'Marta Greenleaf', titleVi: 'Nông Dân Cần Mẫn', role: 'farmer', sex: 'F', age: 32, actionVi: 'Cuốc Đất Canh Tác', colors: { skin: '#f5cfa0', hair: '#7a4a2c' } },
  { id: 3, slug: 'baker', name: 'Clara Hearthstone', titleVi: 'Thợ Bánh Mì Hảo Hạng', role: 'baker', sex: 'F', age: 29, actionVi: 'Nhào Bột Nướng Bánh', colors: { skin: '#fce7f3', hair: '#f59e0b' } },
  { id: 4, slug: 'herbalist', name: 'Lyra Wildflower', titleVi: 'Thầy Thuốc Thảo Dược', role: 'herbalist', sex: 'F', age: 26, actionVi: 'Thu Hái Cây Thuốc', colors: { skin: '#fed7aa', hair: '#92400e' } },
  { id: 5, slug: 'fisherman', name: 'Captain Sean', titleVi: 'Ngư Dân Biển Khơi', role: 'fisherman', sex: 'M', age: 46, actionVi: 'Quăng Câu Kéo Lưới', colors: { skin: '#d97706', hair: '#78716c' } },
  { id: 6, slug: 'miner', name: 'Torvald Deepdelver', titleVi: 'Thợ Mỏ Địa Tầng', role: 'miner', sex: 'M', age: 41, actionVi: 'Khai Thác Khoáng Thạch', colors: { skin: '#d8a878', hair: '#44403c' } },
  { id: 7, slug: 'lumberjack', name: 'Axel Timbercrest', titleVi: 'Tiều Phu Đốn Gỗ', role: 'lumberjack', sex: 'M', age: 35, actionVi: 'Vung Rìu Chặt Cây', colors: { skin: '#fdba74', hair: '#b45309' } },
  { id: 8, slug: 'guard', name: 'Sir Roland', titleVi: 'Vệ Binh Thị Trấn', role: 'guard', sex: 'M', age: 33, actionVi: 'Tuần Tra Phòng Thủ', colors: { skin: '#fed7aa', hair: '#18181b' } },
  { id: 9, slug: 'hunter', name: 'Ayla Swiftfoot', titleVi: 'Thợ Săn Rừng Sâu', role: 'hunter', sex: 'F', age: 27, actionVi: 'Kéo Cung Săn Mồi', colors: { skin: '#fcd34d', hair: '#1c1917' } },
  { id: 10, slug: 'merchant', name: 'Felix Goldcoin', titleVi: 'Thương Nhân Giàu Có', role: 'merchant', sex: 'M', age: 44, actionVi: 'Đếm Tiền Giao Thương', colors: { skin: '#ffedd5', hair: '#713f12' } },
  { id: 11, slug: 'scholar', name: 'Master Eldon', titleVi: 'Nhà Giả Kim Học Giả', role: 'scholar', sex: 'M', age: 55, actionVi: 'Nghiên Cứu Phép Thuật', colors: { skin: '#fed7aa', hair: '#94a3b8' } },
  { id: 12, slug: 'carpenter', name: 'Greta Sawdust', titleVi: 'Thợ Mộc Điêu Khắc', role: 'carpenter', sex: 'F', age: 30, actionVi: 'Cưa Đục Bàn Ghế', colors: { skin: '#fed7aa', hair: '#ca8a04' } },
  { id: 13, slug: 'tailor', name: 'Vivienne Stitches', titleVi: 'Thợ May Tinh Tế', role: 'tailor', sex: 'F', age: 34, actionVi: 'Khâu Vá Váy Lụa', colors: { skin: '#fce7f3', hair: '#7c2d12' } },
  { id: 14, slug: 'chef', name: 'Gustave Gourmet', titleVi: 'Đầu Bếp Cung Đình', role: 'chef', sex: 'M', age: 42, actionVi: 'Nấu Nướng Mỹ Vị', colors: { skin: '#fed7aa', hair: '#18181b' } },
  { id: 15, slug: 'potter', name: 'Nadia Claywell', titleVi: 'Nghệ Nhân Làm Gốm', role: 'potter', sex: 'F', age: 28, actionVi: 'Xoay Bàn Nặn Gốm', colors: { skin: '#fdba74', hair: '#451a03' } },
  { id: 16, slug: 'innkeeper', name: 'Barnaby Barley', titleVi: 'Chủ Quán Trọ Vui Vẻ', role: 'innkeeper', sex: 'M', age: 50, actionVi: 'Rót Đầy Ly Rượu', colors: { skin: '#fef08a', hair: '#78716c' } },
  { id: 17, slug: 'mason', name: 'Herrick Stonehewn', titleVi: 'Thợ Xây Đá Khối', role: 'mason', sex: 'M', age: 45, actionVi: 'Đục Đẽo Xây Tường', colors: { skin: '#fed7aa', hair: '#52525b' } },
  { id: 18, slug: 'shepherd', name: 'Silas Meadow', titleVi: 'Người Chăn Cừu Đồi Xanh', role: 'shepherd', sex: 'M', age: 23, actionVi: 'Dắt Cừu Đồng Cỏ', colors: { skin: '#fed7aa', hair: '#78350f' } },
  { id: 19, slug: 'sailor', name: 'Finn Oceanborne', titleVi: 'Thủy Thủ Viễn Dương', role: 'sailor', sex: 'M', age: 25, actionVi: 'Kéo Dây Thả Buồm', colors: { skin: '#fed7aa', hair: '#eab308' } },
  { id: 20, slug: 'apprentice', name: 'Toby Sparks', titleVi: 'Học Việc Lò Rèn', role: 'apprentice', sex: 'M', age: 17, actionVi: 'Kéo Bễ Thổi Lửa', colors: { skin: '#fef08a', hair: '#dc2626' } },
  { id: 21, slug: 'gardener', name: 'Flora Bloom', titleVi: 'Người Chăm Sóc Vườn Hoa', role: 'gardener', sex: 'F', age: 24, actionVi: 'Tưới Nước Vườn Hồng', colors: { skin: '#fce7f3', hair: '#f97316' } },
  { id: 22, slug: 'bard', name: 'Tristan Melodious', titleVi: 'Nhạc Công Thi Sĩ', role: 'bard', sex: 'M', age: 26, actionVi: 'Gảy Đàn Tình Ca', colors: { skin: '#fed7aa', hair: '#ca8a04' } },
  { id: 23, slug: 'fletcher', name: 'Rowan Arrowcraft', titleVi: 'Thợ Chế Tác Cung Tên', role: 'fletcher', sex: 'M', age: 36, actionVi: 'Gắn Lông Vũ Lên Tên', colors: { skin: '#fed7aa', hair: '#292524' } },
  { id: 24, slug: 'tanner', name: 'Gideon Leatherhide', titleVi: 'Thợ Thuộc Da Cổ Truyền', role: 'tanner', sex: 'M', age: 48, actionVi: 'Căng Thuộc Tấm Da', colors: { skin: '#fdba74', hair: '#57534e' } },
  { id: 25, slug: 'scout', name: 'Kaelen Eagle-Eye', titleVi: 'Trinh Sát Tiền Tuyến', role: 'scout', sex: 'M', age: 28, actionVi: 'Soi Tầm Nhìn Chiến Tuyến', colors: { skin: '#fed7aa', hair: '#1c1917' } },
  { id: 26, slug: 'apothecary', name: 'Selene Moonshade', titleVi: 'Dược Sĩ Bào Chế', role: 'apothecary', sex: 'F', age: 39, actionVi: 'Nghiền Thuốc Pha Độc', colors: { skin: '#fed7aa', hair: '#6b21a8' } },
  { id: 27, slug: 'glassblower', name: 'Vance Furnace', titleVi: 'Nghệ Nhân Thổi Thủy Tinh', role: 'glassblower', sex: 'M', age: 37, actionVi: 'Thổi Thủy Tinh Nóng Chảy', colors: { skin: '#fed7aa', hair: '#ea580c' } },
  { id: 28, slug: 'weaver', name: 'Penelope Loom', titleVi: 'Thợ Dệt Khung Cửi', role: 'weaver', sex: 'F', age: 31, actionVi: 'Đưa Thoi Dệt Lụa', colors: { skin: '#fce7f3', hair: '#b45309' } },
  { id: 29, slug: 'brewer', name: 'Hops McBarrel', titleVi: 'Thợ Nấu Bia Thượng Hạng', role: 'brewer', sex: 'M', age: 47, actionVi: 'Khuấy Thùng Đại Mạch', colors: { skin: '#fed7aa', hair: '#a16207' } },
  { id: 30, slug: 'mayor', name: 'Lord Aldous Sterling', titleVi: 'Thị Trưởng Đáng Kính', role: 'mayor', sex: 'M', age: 58, actionVi: 'Ký Sắc Lệnh Thị Trấn', colors: { skin: '#ffedd5', hair: '#e2e8f0' } }
];

async function generateAllLpcCharacters() {
  const baseOutDir = path.join(__dirname, 'generated');
  fs.mkdirSync(baseOutDir, { recursive: true });

  const CELL_W = 64;
  const CELL_H = 64;
  const COLS = 9;
  const ROWS = 7;
  const SHEET_W = COLS * CELL_W; // 576 px
  const SHEET_H = ROWS * CELL_H; // 448 px

  const manifest = [];

  console.log(`Starting High-Fidelity LPC Generation for ${CHARACTERS_30.length} characters...`);

  for (let i = 0; i < CHARACTERS_30.length; i++) {
    const cDef = CHARACTERS_30[i];
    const padId = String(cDef.id).padStart(2, '0');
    const folderName = `${padId}_${cDef.slug}`;
    const charDir = path.join(baseOutDir, folderName);
    const framesDir = path.join(charDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    // Generate deterministic DNA
    const dna = CharacterDNA.fromVillager(cDef);
    dna.genderPresentation = cDef.sex === 'F' ? 'feminine' : 'masculine';
    dna.role = cDef.role;

    const sheetBuf = Buffer.alloc(SHEET_W * SHEET_H * 4);

    function blitFrame(frameBuf, col, row) {
      for (let y = 0; y < CELL_H; y++) {
        for (let x = 0; x < CELL_W; x++) {
          const srcIdx = (y * CELL_W + x) * 4;
          const dstIdx = (((row * CELL_H + y) * SHEET_W) + (col * CELL_W + x)) * 4;
          sheetBuf[dstIdx] = frameBuf[srcIdx];
          sheetBuf[dstIdx + 1] = frameBuf[srcIdx + 1];
          sheetBuf[dstIdx + 2] = frameBuf[srcIdx + 2];
          sheetBuf[dstIdx + 3] = frameBuf[srcIdx + 3];
        }
      }
    }

    // --- ANIMATION COMPOSITION (LPC Native Rows) ---
    // Row 0: Idle Stance (Directional: 0..1 Down, 2..3 Up, 4..5 Left, 6..7 Right)
    for (let f = 0; f < 2; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, 0, 10); // Down Idle
      blitFrame(fBuf, f, 0);
      writePng(path.join(framesDir, `idle_down_${f}.png`), CELL_W, CELL_H, fBuf);
    }
    for (let f = 0; f < 2; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, 0, 8); // Up Idle
      blitFrame(fBuf, 2 + f, 0);
    }
    for (let f = 0; f < 2; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, 0, 9); // Left Idle
      blitFrame(fBuf, 4 + f, 0);
    }
    for (let f = 0; f < 2; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, 0, 11); // Right Idle
      blitFrame(fBuf, 6 + f, 0);
    }

    // Row 1: Walk Up (9 frames from LPC Row 8)
    for (let f = 0; f < 9; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, f, 8);
      blitFrame(fBuf, f, 1);
      writePng(path.join(framesDir, `walk_up_${f}.png`), CELL_W, CELL_H, fBuf);
    }

    // Row 2: Walk Left (9 frames from LPC Row 9)
    for (let f = 0; f < 9; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, f, 9);
      blitFrame(fBuf, f, 2);
      writePng(path.join(framesDir, `walk_left_${f}.png`), CELL_W, CELL_H, fBuf);
    }

    // Row 3: Walk Down (9 frames from LPC Row 10)
    for (let f = 0; f < 9; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, f, 10);
      blitFrame(fBuf, f, 3);
      writePng(path.join(framesDir, `walk_down_${f}.png`), CELL_W, CELL_H, fBuf);
    }

    // Row 4: Walk Right (9 frames from LPC Row 11)
    for (let f = 0; f < 9; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, f, 11);
      blitFrame(fBuf, f, 4);
      writePng(path.join(framesDir, `walk_right_${f}.png`), CELL_W, CELL_H, fBuf);
    }

    // Row 5: Action Down (Slash/Attack/Cast - 6 frames from LPC Row 14)
    for (let f = 0; f < 6; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, f, 14);
      blitFrame(fBuf, f, 5);
      writePng(path.join(framesDir, `action_down_${f}.png`), CELL_W, CELL_H, fBuf);
    }

    // Row 6: Action Side (Slash/Attack/Cast - 6 frames from LPC Row 15)
    for (let f = 0; f < 6; f++) {
      const fBuf = LpcCharacterGenerator.renderFrame(dna, f, 15);
      blitFrame(fBuf, f, 6);
      writePng(path.join(framesDir, `action_side_${f}.png`), CELL_W, CELL_H, fBuf);
    }

    // Write 1x PNG Spritesheet
    const pngPath1x = path.join(charDir, `${cDef.slug}_spritesheet.png`);
    writePng(pngPath1x, SHEET_W, SHEET_H, sheetBuf);

    // Write 2x Upscaled PNG Spritesheet (Pixel art preservation)
    const upscaled = upscale(SHEET_W, SHEET_H, sheetBuf, 2);
    const pngPath2x = path.join(charDir, `${cDef.slug}_spritesheet_2x.png`);
    writePng(pngPath2x, upscaled.width, upscaled.height, upscaled.buffer);

    // Write JSON Animation Metadata
    const jsonMeta = {
      id: cDef.id,
      slug: cDef.slug,
      name: cDef.name,
      titleVi: cDef.titleVi,
      role: cDef.role,
      sex: cDef.sex,
      age: cDef.age,
      actionVi: cDef.actionVi,
      standard: {
        engine: 'LPC Universal Modular Standard',
        transparent: true,
        squareGrid: true,
        cellWidth: CELL_W,
        cellHeight: CELL_H,
        sheetWidth: SHEET_W,
        sheetHeight: SHEET_H,
        columns: COLS,
        rows: ROWS,
        png1x: `${cDef.slug}_spritesheet.png`,
        png2x: `${cDef.slug}_spritesheet_2x.png`
      },
      animations: {
        idle_down: { row: 0, startCol: 0, frameCount: 2, fps: 3, loop: true },
        idle_up: { row: 0, startCol: 2, frameCount: 2, fps: 3, loop: true },
        idle_left: { row: 0, startCol: 4, frameCount: 2, fps: 3, loop: true },
        idle_right: { row: 0, startCol: 6, frameCount: 2, fps: 3, loop: true },
        walk_up: { row: 1, startCol: 0, frameCount: 9, fps: 10, loop: true },
        walk_left: { row: 2, startCol: 0, frameCount: 9, fps: 10, loop: true },
        walk_down: { row: 3, startCol: 0, frameCount: 9, fps: 10, loop: true },
        walk_right: { row: 4, startCol: 0, frameCount: 9, fps: 10, loop: true },
        profession_down: { row: 5, startCol: 0, frameCount: 6, fps: 8, loop: true, labelVi: `${cDef.actionVi} (Trước)` },
        profession_side: { row: 6, startCol: 0, frameCount: 6, fps: 8, loop: true, labelVi: `${cDef.actionVi} (Ngang)` }
      }
    };

    const jsonPath = path.join(charDir, `${cDef.slug}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonMeta, null, 2));

    manifest.push({
      id: cDef.id,
      slug: cDef.slug,
      name: cDef.name,
      titleVi: cDef.titleVi,
      role: cDef.role,
      actionVi: cDef.actionVi,
      folder: folderName,
      jsonFile: `${folderName}/${cDef.slug}.json`,
      sprite1x: `${folderName}/${cDef.slug}_spritesheet.png`,
      sprite2x: `${folderName}/${cDef.slug}_spritesheet_2x.png`
    });

    console.log(`[${i + 1}/30] Generated LPC Character: ${cDef.name} (${cDef.slug})`);
  }

  // Write Master Manifest
  fs.writeFileSync(path.join(baseOutDir, 'lpc_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Done! All 30 LPC characters exported to art/lpc/generated/');
}

generateAllLpcCharacters().catch(err => {
  console.error('Fatal error generating LPC characters:', err);
  process.exit(1);
});
