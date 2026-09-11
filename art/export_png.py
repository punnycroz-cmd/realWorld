#!/usr/bin/env python3
"""Exports rendered character sprite sheets to PNG using standard Python zlib (zero dependencies)."""
import json, struct, zlib, sys, subprocess

def write_png(filename, width, height, rgba_bytes):
    def chunk(tag, data):
        c = tag + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    raw = bytearray()
    for y in range(height):
        raw.append(0) # filter: none
        raw.extend(rgba_bytes[y * width * 4 : (y + 1) * width * 4])

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    iend = chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(header + ihdr + idat + iend)

# Node runner to export frames
script = """
const { CharacterDNA } = require('./art/character_dna.js');
const { CharacterGenerator } = require('./art/character_generator.js');

const chars = [
  { name: 'Tomas', id: 1, sex: 'M', age: 35, colors: { dress: '#4a6a3a', skin: '#d8a878', hair: '#3a2a1a' } },
  { name: 'Marta', id: 2, sex: 'F', age: 34, colors: { dress: '#cf6a26', skin: '#f5cfa0', hat: '#e8c35a', hair: '#7a4a2c' } },
  { name: 'Sanna', id: 3, sex: 'F', age: 29, colors: { dress: '#4c4c55', skin: '#e0a878', hair: '#7b808c' } },
  { name: 'Petr', id: 4, sex: 'M', age: 31, colors: { dress: '#24452c', skin: '#c47d4e', hair: '#22222a' } },
  { name: 'Joren_Elder', id: 5, sex: 'M', age: 68, colors: { dress: '#3b3c47', skin: '#dda078', hair: '#c8cdd9' } },
  { name: 'Pip_Child', id: 6, sex: 'M', age: 5, colors: { dress: '#96333c', skin: '#f2be9b', hair: '#9c3d2e' } }
];

const sheetWidth = 6 * 32; // 6 frames
const sheetHeight = chars.length * 48; // 6 characters
const outBuffer = new Uint8Array(sheetWidth * sheetHeight * 4);

chars.forEach((charSpec, row) => {
  const dna = CharacterDNA.fromVillager(charSpec);
  for (let f = 0; f < 6; f++) {
    const pC = CharacterGenerator.renderFrame(dna, 0, 'walk', f);
    for (let py = 0; py < 48; py++) {
      for (let px = 0; px < 32; px++) {
        const srcIdx = (py * 32 + px) * 4;
        const dstIdx = ((row * 48 + py) * sheetWidth + (f * 32 + px)) * 4;
        outBuffer[dstIdx] = pC.data[srcIdx];
        outBuffer[dstIdx + 1] = pC.data[srcIdx + 1];
        outBuffer[dstIdx + 2] = pC.data[srcIdx + 2];
        outBuffer[dstIdx + 3] = pC.data[srcIdx + 3];
      }
    }
  }
});

process.stdout.write(Buffer.from(outBuffer));
"""

out = subprocess.check_output(['node', '-e', script])
write_png('art/showcase/walk_cycle_spritesheet.png', 6 * 32, 6 * 48, out)
print('Generated art/showcase/walk_cycle_spritesheet.png (192x288 px)')

# Scale 4x for crisp viewing
scale = 4
w_scaled = (6 * 32) * scale
h_scaled = (6 * 48) * scale
scaled_out = bytearray(w_scaled * h_scaled * 4)
for sy in range(h_scaled):
    orig_y = sy // scale
    for sx in range(w_scaled):
        orig_x = sx // scale
        src_idx = (orig_y * (6 * 32) + orig_x) * 4
        dst_idx = (sy * w_scaled + sx) * 4
        scaled_out[dst_idx : dst_idx + 4] = out[src_idx : src_idx + 4]

write_png('art/showcase/walk_cycle_showcase_4x.png', w_scaled, h_scaled, bytes(scaled_out))
print(f'Generated art/showcase/walk_cycle_showcase_4x.png ({w_scaled}x{h_scaled} px)')
