/**
 * Natura 30 Character Batch Generator
 * Generates 30 complete character sprite sheets with basic + profession animations.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const { CharacterDNA } = require('../character_dna.js');
const { ProfessionCharacterGenerator } = require('../profession_character_generator.js');

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

function upscale4x(width, height, rgbaBuffer) {
  const scale = 4;
  const w4 = width * scale;
  const h4 = height * scale;
  const out = Buffer.alloc(w4 * h4 * 4);
  for (let y = 0; y < h4; y++) {
    const origY = Math.floor(y / scale);
    for (let x = 0; x < w4; x++) {
      const origX = Math.floor(x / scale);
      const srcIdx = (origY * width + origX) * 4;
      const dstIdx = (y * w4 + x) * 4;
      out[dstIdx] = rgbaBuffer[srcIdx];
      out[dstIdx + 1] = rgbaBuffer[srcIdx + 1];
      out[dstIdx + 2] = rgbaBuffer[srcIdx + 2];
      out[dstIdx + 3] = rgbaBuffer[srcIdx + 3];
    }
  }
  return { width: w4, height: h4, buffer: out };
}

// 30 Diverse Character Definitions with Professions
const CHARACTERS_30 = [
  {
    id: 1,
    slug: 'blacksmith',
    name: 'Brom Ironbeard',
    titleVi: 'Thợ Rèn Luyện Kim',
    role: 'blacksmith',
    sex: 'M',
    age: 38,
    actionName: 'Hammer Forge',
    actionVi: 'Rèn Đe Đập Búa Tóe Lửa',
    bio: 'Thợ rèn danh tiếng của thị trấn, sở hữu đôi tay chai sần và cơ bắp cuồn cuộn.',
    colors: { dress: '#2b2a36', skin: '#d8a878', hair: '#1f1e24' },
    archetype: 'broad_heavy'
  },
  {
    id: 2,
    slug: 'farmer',
    name: 'Marta Greenleaf',
    titleVi: 'Nông Dân Cần Mẫn',
    role: 'farmer',
    sex: 'F',
    age: 32,
    actionName: 'Till Ground',
    actionVi: 'Cuốc Đất Canh Tác',
    bio: 'Chăm sóc những cánh đồng lúa mì trĩu hạt và vườn rau xanh tốt quanh năm.',
    colors: { dress: '#3b82f6', skin: '#f5cfa0', hat: '#e8c35a', hair: '#7a4a2c' },
    archetype: 'average'
  },
  {
    id: 3,
    slug: 'baker',
    name: 'Clara Hearthstone',
    titleVi: 'Thợ Bánh Mì Hảo Hạng',
    role: 'baker',
    sex: 'F',
    age: 29,
    actionName: 'Knead Dough',
    actionVi: 'Nhào Bột Cán Bánh Bụi Phấn',
    bio: 'Mỗi buổi sáng lò bánh của Clara luôn ngập tràn mùi bơ thơm lừng khắp phố xá.',
    colors: { dress: '#f5f5f4', skin: '#fce7f3', hair: '#f59e0b' },
    archetype: 'round_soft'
  },
  {
    id: 4,
    slug: 'herbalist',
    name: 'Lyra Wildflower',
    titleVi: 'Thầy Thuốc Thảo Dược',
    role: 'herbalist',
    sex: 'F',
    age: 26,
    actionName: 'Gather Herbs',
    actionVi: 'Thu Hái Thảo Mộc Vào Giỏ',
    bio: 'Am hiểu mọi loài thảo mộc chữa lành và cây thuốc quý ẩn sâu trong rừng thẳm.',
    colors: { dress: '#15803d', skin: '#fed7aa', hair: '#92400e' },
    archetype: 'slim'
  },
  {
    id: 5,
    slug: 'fisherman',
    name: 'Captain Sean',
    titleVi: 'Ngư Dân Biển Khơi',
    role: 'fisherman',
    sex: 'M',
    age: 46,
    actionName: 'Cast & Reel',
    actionVi: 'Quăng Câu Kéo Cá Bạc',
    bio: 'Dày dặn kinh nghiệm sóng gió, quen thuộc với mọi luồng lạch và bầy cá ngừ.',
    colors: { dress: '#eab308', skin: '#d97706', hair: '#78716c' },
    archetype: 'average_build'
  },
  {
    id: 6,
    slug: 'miner',
    name: 'Torvald Deepdelver',
    titleVi: 'Thợ Mỏ Địa Tầng',
    role: 'miner',
    sex: 'M',
    age: 41,
    actionName: 'Mine Rock',
    actionVi: 'Bổ Cuốc Khai Thác Khoáng Thạch',
    bio: 'Chuyên gia khai thác sâu trong lòng đất, nơi cất giấu vàng bạc và đá quý phát sáng.',
    colors: { dress: '#475569', skin: '#d8a878', hair: '#44403c' },
    archetype: 'broad_heavy'
  },
  {
    id: 7,
    slug: 'lumberjack',
    name: 'Axel Timbercrest',
    titleVi: 'Tiều Phu Đốn Gỗ',
    role: 'lumberjack',
    sex: 'M',
    age: 35,
    actionName: 'Chop Wood',
    actionVi: 'Vung Rìu Chặt Cây Bắn Dăm Gỗ',
    bio: 'Tiều phu khỏe mạnh với chiếc rìu bén ngót cung cấp gỗ sồi vững chãi cho làng.',
    colors: { dress: '#dc2626', skin: '#fdba74', hair: '#b45309' },
    archetype: 'broad_heavy'
  },
  {
    id: 8,
    slug: 'guard',
    name: 'Sir Roland',
    titleVi: 'Vệ Binh Thị Trấn',
    role: 'guard',
    sex: 'M',
    age: 33,
    actionName: 'Shield & Slash',
    actionVi: 'Giơ Khiên Chém Kiếm Phòng Vệ',
    bio: 'Đội trưởng đội tuần tra mang theo thanh kiếm sáng loáng bảo vệ an ninh thôn làng.',
    colors: { dress: '#334155', skin: '#fed7aa', hair: '#18181b' },
    archetype: 'tall'
  },
  {
    id: 9,
    slug: 'hunter',
    name: 'Ayla Swiftfoot',
    titleVi: 'Thợ Săn Rừng Sâu',
    role: 'hunter',
    sex: 'F',
    age: 27,
    actionName: 'Shoot Bow',
    actionVi: 'Kéo Căng Cung Bắn Tên Chuẩn Xác',
    bio: 'Thợ săn thiện xạ di chuyển nhẹ như sương sớm, bách phát bách trúng.',
    colors: { dress: '#166534', skin: '#fcd34d', hair: '#1c1917' },
    archetype: 'slim'
  },
  {
    id: 10,
    slug: 'merchant',
    name: 'Felix Goldcoin',
    titleVi: 'Thương Nhân Giàu Có',
    role: 'merchant',
    sex: 'M',
    age: 44,
    actionName: 'Appraise Coin',
    actionVi: 'Tung Hứng Đồng Tiền Vàng',
    bio: 'Thương nhân đi khắp các nẻo đường, mang về lụa là hương liệu và ngọc ngà.',
    colors: { dress: '#0d9488', skin: '#ffedd5', hair: '#713f12' },
    archetype: 'round_soft'
  },
  {
    id: 11,
    slug: 'scholar',
    name: 'Master Eldon',
    titleVi: 'Nhà Giả Kim Học Giả',
    role: 'scholar',
    sex: 'M',
    age: 55,
    actionName: 'Brew Potion',
    actionVi: 'Pha Chế Thuốc Sủi Bọt Hơi Khói',
    bio: 'Học giả uyên bác dành hàng chục năm nghiên cứu sách cổ và thuật giả kim nhiệm màu.',
    colors: { dress: '#4f46e5', skin: '#fed7aa', hair: '#94a3b8' },
    archetype: 'tall'
  },
  {
    id: 12,
    slug: 'carpenter',
    name: 'Greta Sawdust',
    titleVi: 'Thợ Mộc Điêu Khắc',
    role: 'carpenter',
    sex: 'F',
    age: 30,
    actionName: 'Saw Wood',
    actionVi: 'Cưa Gỗ Nhịp Nhàng Rơi Bụi',
    bio: 'Bàn tay tài hoa dựng nên những căn nhà gỗ vững chãi và bàn ghế nội thất tinh xảo.',
    colors: { dress: '#9a3412', skin: '#fed7aa', hair: '#ca8a04' },
    archetype: 'average'
  },
  {
    id: 13,
    slug: 'tailor',
    name: 'Vivienne Stitches',
    titleVi: 'Thợ May Tinh Tế',
    role: 'tailor',
    sex: 'F',
    age: 34,
    actionName: 'Sew Cloth',
    actionVi: 'Luồn Kim Đính Chỉ Khâu Vải',
    bio: 'Nhà may khéo léo tạo nên trang phục dạ hội tuyệt mỹ cho cư dân trong thung lũng.',
    colors: { dress: '#0284c7', skin: '#fce7f3', hair: '#7c2d12' },
    archetype: 'slim'
  },
  {
    id: 14,
    slug: 'chef',
    name: 'Gustave Gourmet',
    titleVi: 'Đầu Bếp Cung Đình',
    role: 'chef',
    sex: 'M',
    age: 42,
    actionName: 'Taste Stew',
    actionVi: 'Khuấy Nồi Hầm Nếm Vị Súp',
    bio: 'Bếp trưởng tài ba luôn biết cách biến những nguyên liệu mộc mạc thành mỹ vị nhân gian.',
    colors: { dress: '#ffffff', skin: '#fed7aa', hair: '#18181b' },
    archetype: 'round_soft'
  },
  {
    id: 15,
    slug: 'potter',
    name: 'Nadia Claywell',
    titleVi: 'Nghệ Nhân Làm Gốm',
    role: 'potter',
    sex: 'F',
    age: 28,
    actionName: 'Throw Pottery',
    actionVi: 'Xoay Bàn Gốm Nặn Bình Đất',
    bio: 'Nghệ nhân gốm sứ với đôi tay khéo léo biến đất sét thô thành những bình hoa kiệt tác.',
    colors: { dress: '#c2410c', skin: '#fdba74', hair: '#451a03' },
    archetype: 'average'
  },
  {
    id: 16,
    slug: 'innkeeper',
    name: 'Barnaby Barley',
    titleVi: 'Chủ Quán Trọ Vui Vẻ',
    role: 'innkeeper',
    sex: 'M',
    age: 50,
    actionName: 'Pour Drink',
    actionVi: 'Rót Bia Vại Gỗ Sủi Bọt',
    bio: 'Chủ quán trọ nồng hậu luôn đón tiếp lữ khách bằng nụ cười sảng khoái và vại bia mát lạnh.',
    colors: { dress: '#991b1b', skin: '#fef08a', hair: '#78716c' },
    archetype: 'round_soft'
  },
  {
    id: 17,
    slug: 'mason',
    name: 'Herrick Stonehewn',
    titleVi: 'Thợ Xây Đá Khối',
    role: 'mason',
    sex: 'M',
    age: 45,
    actionName: 'Chisel Block',
    actionVi: 'Đục Đẽo Khắc Hoa Văn Đá',
    bio: 'Bậc thầy về tường thành đá, lâu đài và những bậc thềm đá nghìn năm bất diệt.',
    colors: { dress: '#64748b', skin: '#fed7aa', hair: '#52525b' },
    archetype: 'broad_heavy'
  },
  {
    id: 18,
    slug: 'shepherd',
    name: 'Silas Meadow',
    titleVi: 'Người Chăn Cừu Đồi Xanh',
    role: 'shepherd',
    sex: 'M',
    age: 23,
    actionName: 'Herd Sheep',
    actionVi: 'Vẫy Gậy Móc Huýt Sáo Dắt Cừu',
    bio: 'Chàng trai gắn bó với đồng cỏ bao la cùng đàn cừu trắng như mây trời.',
    colors: { dress: '#854d0e', skin: '#fed7aa', hair: '#78350f' },
    archetype: 'slim'
  },
  {
    id: 19,
    slug: 'sailor',
    name: 'Finn Oceanborne',
    titleVi: 'Thủy Thủ Viễn Dương',
    role: 'sailor',
    sex: 'M',
    age: 25,
    actionName: 'Row Oar',
    actionVi: 'Chèo Thuyền Rẽ Sóng Nước Bọt',
    bio: 'Chàng thủy thủ yêu biển khơi, quen thuộc với la bàn và cánh buồm no gió.',
    colors: { dress: '#1e40af', skin: '#fed7aa', hair: '#eab308' },
    archetype: 'average_build'
  },
  {
    id: 20,
    slug: 'apprentice',
    name: 'Toby Sparks',
    titleVi: 'Học Việc Lò Rèn',
    role: 'apprentice',
    sex: 'M',
    age: 17,
    actionName: 'Pump Bellows',
    actionVi: 'Kéo Bễ Thổi Lửa Lò Rực Cháy',
    bio: 'Thiếu niên nhiệt huyết chăm chỉ kéo bễ thổi lửa, mơ ước trở thành thợ rèn đại sư.',
    colors: { dress: '#57534e', skin: '#fef08a', hair: '#dc2626' },
    archetype: 'teenager'
  },
  {
    id: 21,
    slug: 'gardener',
    name: 'Flora Bloom',
    titleVi: 'Người Chăm Sóc Vườn Hoa',
    role: 'gardener',
    sex: 'F',
    age: 24,
    actionName: 'Water Plants',
    actionVi: 'Tưới Nước Hoa Nở Rực Rỡ',
    bio: 'Người biến mọi góc sân thôn làng thành những thảm hoa rực rỡ ngát hương thơm.',
    colors: { dress: '#10b981', skin: '#fce7f3', hair: '#f97316' },
    archetype: 'average'
  },
  {
    id: 22,
    slug: 'bard',
    name: 'Tristan Melodious',
    titleVi: 'Nhạc Công Thi Sĩ',
    role: 'bard',
    sex: 'M',
    age: 26,
    actionName: 'Strum Lute',
    actionVi: 'Gảy Đàn Lute Nốt Nhạc Bay Lượn',
    bio: 'Chàng thi sĩ mang tiếng đàn và những khúc tình ca ru say lòng người khắp quán trọ.',
    colors: { dress: '#7c3aed', skin: '#fed7aa', hair: '#ca8a04' },
    archetype: 'slim'
  },
  {
    id: 23,
    slug: 'fletcher',
    name: 'Rowan Arrowcraft',
    titleVi: 'Thợ Chế Tác Cung Tên',
    role: 'fletcher',
    sex: 'M',
    age: 36,
    actionName: 'Fletch Arrow',
    actionVi: 'Gắn Lông Vũ Cân Chỉnh Thân Tên',
    bio: 'Đôi mắt sắc sảo gọt đẽo từng thân tên thẳng tắp và gắn lông vũ chính xác tuyệt đối.',
    colors: { dress: '#4d7c0f', skin: '#fed7aa', hair: '#292524' },
    archetype: 'average_build'
  },
  {
    id: 24,
    slug: 'tanner',
    name: 'Gideon Leatherhide',
    titleVi: 'Thợ Thuộc Da Cổ Truyền',
    role: 'tanner',
    sex: 'M',
    age: 48,
    actionName: 'Scrape Leather',
    actionVi: 'Cạo Phẳng Da Thú Căng Khung',
    bio: 'Chuyên gia xử lý da thú thành những tấm da mềm mịn, bền bỉ làm áo giáp và ủng.',
    colors: { dress: '#713f12', skin: '#fdba74', hair: '#57534e' },
    archetype: 'broad_heavy'
  },
  {
    id: 25,
    slug: 'scout',
    name: 'Kaelen Eagle-Eye',
    titleVi: 'Trinh Sát Tiền Tuyến',
    role: 'scout',
    sex: 'M',
    age: 28,
    actionName: 'Spyglass Lookout',
    actionVi: 'Ống Nhòm Soi Tầm Nhìn Chiến Tuyến',
    bio: 'Trinh sát nhanh nhẹn với chiếc kính viễn vọng có thể quan sát động tĩnh từ xa vạn dặm.',
    colors: { dress: '#3f6212', skin: '#fed7aa', hair: '#1c1917' },
    archetype: 'slim'
  },
  {
    id: 26,
    slug: 'apothecary',
    name: 'Selene Moonshade',
    titleVi: 'Dược Sĩ Bào Chế',
    role: 'apothecary',
    sex: 'F',
    age: 39,
    actionName: 'Crush Remedy',
    actionVi: 'Nghiền Cối Bào Chế Dược Liệu',
    bio: 'Dược sĩ điều chế cao thuốc và thuốc mỡ xoa dịu những vết thương hiểm hóc nhất.',
    colors: { dress: '#581c87', skin: '#fdf4ff', hair: '#3b0764' },
    archetype: 'average'
  },
  {
    id: 27,
    slug: 'scribe',
    name: 'Theron Quillsmith',
    titleVi: 'Người Chép Sử Ký',
    role: 'scribe',
    sex: 'M',
    age: 52,
    actionName: 'Write Record',
    actionVi: 'Chấm Bút Lông Viết Sử Lên Cuộn Da',
    bio: 'Người ghi chép những trang sử hào hùng và biên niên ký của vương quốc qua các thời kỳ.',
    colors: { dress: '#374151', skin: '#fed7aa', hair: '#d1d5db' },
    archetype: 'slim'
  },
  {
    id: 28,
    slug: 'master_smith',
    name: 'Vulkan Firebrand',
    titleVi: 'Đại Sư Luyện Kiếm Thần',
    role: 'master_smith',
    sex: 'M',
    age: 58,
    actionName: 'Quench Sword',
    actionVi: 'Nhúng Kiếm Đỏ Tôi Nước Bốc Khói',
    bio: 'Bậc thầy luyện kiếm huyền thoại, lưỡi kiếm tôi rèn chém sắt như chém bùn.',
    colors: { dress: '#1c1917', skin: '#d97706', hair: '#e5e7eb' },
    archetype: 'broad_heavy'
  },
  {
    id: 29,
    slug: 'rancher',
    name: 'Dusty McCallister',
    titleVi: 'Chủ Trang Trại Ngựa',
    role: 'rancher',
    sex: 'M',
    age: 40,
    actionName: 'Twirl Lasso',
    actionVi: 'Quay Dây Thừng Lasso Bắt Ngựa',
    bio: 'Tay thuần hóa ngựa hoang dũng cảm với kỹ thuật quăng dây thừng điêu luyện trên thảo nguyên.',
    colors: { dress: '#854d0e', skin: '#fdba74', hair: '#451a03' },
    archetype: 'average_build'
  },
  {
    id: 30,
    slug: 'village_elder',
    name: 'Arch-Elder Nicholas',
    titleVi: 'Trưởng Lão Làng Cổ',
    role: 'village_elder',
    sex: 'M',
    age: 72,
    actionName: 'Bless Village',
    actionVi: 'Giơ Quyền Trượng Ban Phước Hào Quang',
    bio: 'Người đứng đầu tôn kính của thị trấn, che chở dân làng bằng sự thông tuệ và linh lực tổ tiên.',
    colors: { dress: '#4c0519', skin: '#fed7aa', hair: '#f8fafc' },
    archetype: 'elder'
  }
];

// Generation Pipeline
async function generateAll() {
  const baseOutDir = path.resolve(__dirname, '../characters');
  if (!fs.existsSync(baseOutDir)) {
    fs.mkdirSync(baseOutDir, { recursive: true });
  }

  console.log(`Starting generation of 30 Characters in ${baseOutDir}...`);

  const manifest = [];
  const CELL_W = 32;
  const CELL_H = 48;
  const COLS = 8;
  const ROWS = 7;
  const SHEET_W = COLS * CELL_W; // 256 px
  const SHEET_H = ROWS * CELL_H; // 336 px

  for (let idx = 0; idx < CHARACTERS_30.length; idx++) {
    const charDef = CHARACTERS_30[idx];
    const folderName = `${String(charDef.id).padStart(2, '0')}_${charDef.slug}`;
    const charDir = path.join(baseOutDir, folderName);
    if (!fs.existsSync(charDir)) {
      fs.mkdirSync(charDir, { recursive: true });
    }

    const dna = CharacterDNA.fromVillager({
      id: charDef.id,
      name: charDef.name,
      role: charDef.role,
      sex: charDef.sex,
      age: charDef.age,
      colors: charDef.colors
    });

    // Create 256x336 buffer for sprite sheet
    const sheetBuf = Buffer.alloc(SHEET_W * SHEET_H * 4);

    function blitFrame(frameCanvas, col, row) {
      for (let y = 0; y < CELL_H; y++) {
        for (let x = 0; x < CELL_W; x++) {
          const srcIdx = (y * CELL_W + x) * 4;
          const dstIdx = (((row * CELL_H + y) * SHEET_W) + (col * CELL_W + x)) * 4;
          sheetBuf[dstIdx] = frameCanvas.data[srcIdx];
          sheetBuf[dstIdx + 1] = frameCanvas.data[srcIdx + 1];
          sheetBuf[dstIdx + 2] = frameCanvas.data[srcIdx + 2];
          sheetBuf[dstIdx + 3] = frameCanvas.data[srcIdx + 3];
        }
      }
    }

    // Row 0: Idle Down (4f) + Idle Up (4f)
    for (let f = 0; f < 4; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 0, 'idle', f);
      blitFrame(c, f, 0);
    }
    for (let f = 0; f < 4; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 1, 'idle', f);
      blitFrame(c, 4 + f, 0);
    }

    // Row 1: Idle Left (4f) + Idle Right (4f)
    for (let f = 0; f < 4; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 2, 'idle', f);
      blitFrame(c, f, 1);
    }
    for (let f = 0; f < 4; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 3, 'idle', f);
      blitFrame(c, 4 + f, 1);
    }

    // Row 2: Walk Down (6f)
    for (let f = 0; f < 6; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 0, 'walk', f);
      blitFrame(c, f, 2);
    }

    // Row 3: Walk Up (6f)
    for (let f = 0; f < 6; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 1, 'walk', f);
      blitFrame(c, f, 3);
    }

    // Row 4: Walk Left (6f)
    for (let f = 0; f < 6; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 2, 'walk', f);
      blitFrame(c, f, 4);
    }

    // Row 5: Walk Right (6f)
    for (let f = 0; f < 6; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 3, 'walk', f);
      blitFrame(c, f, 5);
    }

    // Row 6: Profession Action (8 full frames!)
    for (let f = 0; f < 8; f++) {
      const c = ProfessionCharacterGenerator.renderFrame(dna, 0, charDef.role, f);
      blitFrame(c, f, 6);
    }

    // Write 1x Spritesheet
    const pngPath1x = path.join(charDir, `${charDef.slug}_spritesheet.png`);
    writePng(pngPath1x, SHEET_W, SHEET_H, sheetBuf);

    // Write 4x Spritesheet
    const upscaled = upscale4x(SHEET_W, SHEET_H, sheetBuf);
    const pngPath4x = path.join(charDir, `${charDef.slug}_spritesheet_4x.png`);
    writePng(pngPath4x, upscaled.width, upscaled.height, upscaled.buffer);

    // Write JSON animation metadata
    const jsonMeta = {
      id: charDef.id,
      slug: charDef.slug,
      name: charDef.name,
      titleVi: charDef.titleVi,
      role: charDef.role,
      sex: charDef.sex,
      age: charDef.age,
      bio: charDef.bio,
      actionName: charDef.actionName,
      actionVi: charDef.actionVi,
      sprite: {
        sheetWidth: SHEET_W,
        sheetHeight: SHEET_H,
        frameWidth: CELL_W,
        frameHeight: CELL_H,
        columns: COLS,
        rows: ROWS,
        png1x: `${charDef.slug}_spritesheet.png`,
        png4x: `${charDef.slug}_spritesheet_4x.png`
      },
      animations: {
        idle_down: { row: 0, startCol: 0, frameCount: 4, fps: 4, loop: true },
        idle_up: { row: 0, startCol: 4, frameCount: 4, fps: 4, loop: true },
        idle_left: { row: 1, startCol: 0, frameCount: 4, fps: 4, loop: true },
        idle_right: { row: 1, startCol: 4, frameCount: 4, fps: 4, loop: true },
        walk_down: { row: 2, startCol: 0, frameCount: 6, fps: 8, loop: true },
        walk_up: { row: 3, startCol: 0, frameCount: 6, fps: 8, loop: true },
        walk_left: { row: 4, startCol: 0, frameCount: 6, fps: 8, loop: true },
        walk_right: { row: 5, startCol: 0, frameCount: 6, fps: 8, loop: true },
        profession_action: {
          row: 6,
          startCol: 0,
          frameCount: 8,
          fps: 8,
          loop: true,
          label: charDef.actionName,
          labelVi: charDef.actionVi
        }
      }
    };

    const jsonPath = path.join(charDir, `${charDef.slug}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonMeta, null, 2));

    manifest.push({
      id: charDef.id,
      slug: charDef.slug,
      name: charDef.name,
      titleVi: charDef.titleVi,
      role: charDef.role,
      actionName: charDef.actionName,
      actionVi: charDef.actionVi,
      folder: folderName,
      jsonFile: `${folderName}/${charDef.slug}.json`,
      sprite1x: `${folderName}/${charDef.slug}_spritesheet.png`,
      sprite4x: `${folderName}/${charDef.slug}_spritesheet_4x.png`
    });

    console.log(`[${idx + 1}/30] Generated ${charDef.name} (${charDef.slug}) -> ${folderName}`);
  }

  // Write Manifest
  fs.writeFileSync(path.join(baseOutDir, 'characters_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`All 30 characters exported! Manifest written to characters_manifest.json`);
}

generateAll().catch(err => {
  console.error('Error generating characters:', err);
  process.exit(1);
});
