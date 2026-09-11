/**
 * LPC Layer Cache & Pixel Loader
 * Converts PNG assets into uncompressed 32-bit RGBA buffers for fast composition.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'assets');
const CACHE_DIR = path.join(__dirname, '.cache_bmp');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

class LpcLayerLoader {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Load an LPC 832x1344 spritesheet as raw RGBA Buffer
   */
  getLayer(assetName) {
    if (this.cache.has(assetName)) {
      return this.cache.get(assetName);
    }

    const pngPath = path.join(ASSETS_DIR, assetName);
    if (!fs.existsSync(pngPath)) {
      console.warn(`[LpcLayerLoader] Asset not found: ${pngPath}`);
      return null;
    }

    const bmpPath = path.join(CACHE_DIR, `${assetName}.bmp`);
    if (!fs.existsSync(bmpPath) || fs.statSync(bmpPath).mtimeMs < fs.statSync(pngPath).mtimeMs) {
      execSync(`/usr/bin/sips -s format bmp "${pngPath}" --out "${bmpPath}"`, { stdio: 'ignore' });
    }

    const buf = fs.readFileSync(bmpPath);
    const offset = buf.readUInt32LE(10);
    const width = buf.readInt32LE(18);
    const height = buf.readInt32LE(22);
    const bpp = buf.readUInt16LE(28);

    const absW = Math.abs(width);
    const absH = Math.abs(height);
    const rgba = Buffer.alloc(absW * absH * 4);

    for (let y = 0; y < absH; y++) {
      const srcY = height < 0 ? y : (absH - 1 - y);
      for (let x = 0; x < absW; x++) {
        const srcIdx = offset + (srcY * absW + x) * (bpp / 8);
        const dstIdx = (y * absW + x) * 4;
        rgba[dstIdx] = buf[srcIdx + 2];     // R
        rgba[dstIdx + 1] = buf[srcIdx + 1]; // G
        rgba[dstIdx + 2] = buf[srcIdx];     // B
        rgba[dstIdx + 3] = bpp === 32 ? buf[srcIdx + 3] : 255; // A
      }
    }

    const layerData = { width: absW, height: absH, rgba };
    this.cache.set(assetName, layerData);
    return layerData;
  }
}

module.exports = { LpcLayerLoader: new LpcLayerLoader() };
