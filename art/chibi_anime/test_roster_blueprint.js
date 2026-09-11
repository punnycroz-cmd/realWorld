/**
 * Test script with clean filtered blueprints and perfected character styling
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const VP = require('../visual_primitives.js');

// Fast PNG writer
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
  const png = Buffer.concat([header, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(filePath, png);
}

const bp = JSON.parse(fs.readFileSync(path.join(__dirname, 'blueprint_components_64.json'), 'utf8'));

// 1. Clean anatomical components (strip out shadows and misplaced clusters)
const cleanFarmerBoots = bp.farmer.boots.filter(p => p.y >= 50);
const cleanFarmerPants = bp.farmer.pants.filter(p => p.y >= 43 && p.y <= 52);
const cleanFarmerTorso = bp.farmer.torso.filter(p => p.y >= 25 && p.y <= 46);

// Clean full male head: forehead + lower face (strictly between x:23..38)
const fullMaleHead = bp.farmer.head.filter(p => p.x >= 23 && p.x <= 38 && p.y >= 20);
bp.farmer.hat.forEach(p => {
  if (p.x >= 24 && p.x <= 37 && p.y >= 13 && p.y <= 19) {
    fullMaleHead.push(p);
  }
});

// Clean full female head (Mage & Ranger: face only, no twintails)
const fullFemaleHead = [];
bp.baker.head.forEach(p => {
  if (p.x >= 25 && p.x <= 39 && p.y >= 16 && p.y <= 27) fullFemaleHead.push(p);
});
bp.baker.toque.forEach(p => {
  if (p.x >= 25 && p.x <= 39 && p.y >= 12 && p.y <= 15) fullFemaleHead.push(p);
});

function remapTonalColor(hex, ramp) {
  const { r, g, b } = VP.parseHex(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const idx = Math.min(ramp.length - 1, Math.max(0, lum * (ramp.length - 1)));
  const i0 = Math.floor(idx);
  const i1 = Math.ceil(idx);
  if (i0 === i1) return ramp[i0];
  const t = idx - i0;
  const c0 = VP.parseHex(ramp[i0]);
  const c1 = VP.parseHex(ramp[i1]);
  const nr = Math.round(c0.r * (1 - t) + c1.r * t);
  const ng = Math.round(c0.g * (1 - t) + c1.g * t);
  const nb = Math.round(c0.b * (1 - t) + c1.b * t);
  return '#' + ((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1);
}

// Quadratic Bezier
function getBezierPoint(p0, p1, p2, t) {
  const invT = 1 - t;
  const x = Math.round(invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x);
  const y = Math.round(invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y);
  return { x, y };
}
function drawBezier(c, p0, p1, p2, colorHex, thickness = 1, z = 0) {
  const steps = Math.max(16, Math.round(Math.hypot(p2.x - p0.x, p2.y - p0.y) * 1.5));
  for (let i = 0; i <= steps; i++) {
    const pt = getBezierPoint(p0, p1, p2, i / steps);
    c.fillRect(pt.x - Math.floor(thickness / 2), pt.y - Math.floor(thickness / 2), thickness, thickness, colorHex, 2, z);
  }
}

function reinforceOutline(c, outlineHex) {
  const w = c.width, h = c.height;
  const isSolid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (c.data[i * 4 + 3] > 20) isSolid[i] = 1;
  }
  const { r, g, b } = VP.parseHex(outlineHex);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (isSolid[idx] === 1) continue;
      if (isSolid[idx - 1] === 1 || isSolid[idx + 1] === 1 ||
          isSolid[idx - w] === 1 || isSolid[idx + w] === 1) {
        const pIdx = idx * 4;
        c.data[pIdx] = r;
        c.data[pIdx + 1] = g;
        c.data[pIdx + 2] = b;
        c.data[pIdx + 3] = 255;
      }
    }
  }
}

function renderPixels(c, pixels, ramp, midX, bobY, leftFootLift, rightFootLift, zIdx) {
  pixels.forEach(p => {
    let dy = p.y;
    const dx = p.x;
    if (p.y >= 52) {
      const isLeft = (dx < midX);
      const lift = isLeft ? leftFootLift : rightFootLift;
      dy = p.y - lift;
    } else if (p.y >= 43) {
      const isLeft = (dx < midX);
      const lift = isLeft ? leftFootLift : rightFootLift;
      const t = (p.y - 43) / 9;
      dy = p.y + Math.round((1 - t) * bobY - t * lift);
    } else {
      dy = p.y + bobY;
    }
    if (dx >= 0 && dx < 64 && dy >= 0 && dy < 64) {
      const col = ramp ? remapTonalColor(p.col, ramp) : p.col;
      c.setPixel(dx, dy, col, 2, zIdx);
    }
  });
}

function renderChar(key) {
  const c = new VP.PixelCanvas(64, 64);
  const OUTLINE = '#140c06';
  const bobY = 0, lLift = 0, rLift = 0;

  if (key === 'farmer') {
    renderPixels(c, cleanFarmerBoots, null, 35, bobY, lLift, rLift, 10);
    renderPixels(c, cleanFarmerPants, null, 35, bobY, lLift, rLift, 15);
    renderPixels(c, cleanFarmerTorso, null, 35, bobY, lLift, rLift, 20);
    renderPixels(c, bp.farmer.head, null, 35, bobY, lLift, rLift, 30);
    renderPixels(c, bp.farmer.hat, null, 35, bobY, lLift, rLift, 40);
    renderPixels(c, bp.farmer.sickle, null, 35, bobY, lLift, rLift, 50);
  } else if (key === 'baker') {
    const cleanBakerBoots = bp.baker.boots.filter(p => p.y >= 50 && p.y <= 57 && p.x >= 15 && p.x <= 48);
    renderPixels(c, cleanBakerBoots, null, 31, bobY, lLift, rLift, 10);
    renderPixels(c, bp.baker.pants, null, 31, bobY, lLift, rLift, 15);
    renderPixels(c, bp.baker.torso, null, 31, bobY, lLift, rLift, 20);
    renderPixels(c, bp.baker.head, null, 31, bobY, lLift, rLift, 30);
    renderPixels(c, bp.baker.toque, null, 31, bobY, lLift, rLift, 40);
    renderPixels(c, bp.baker.bread, null, 31, bobY, lLift, rLift, 50);
  } else if (key === 'blacksmith') {
    const bootsRamp = ['#180e08', '#2a1a10', '#3e281c', '#553928', '#6f4c37', '#8c6249'];
    const pantsRamp = ['#09090b', '#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'];
    const shirtRamp = ['#1c1917', '#292524', '#44403c', '#57534e', '#78716c', '#a8a29e'];
    const apronRamp = ['#1c140e', '#2e1c12', '#452a1b', '#5c3924', '#784b30', '#96603e'];
    const bandanaRamp = ['#450a0a', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171'];
    const metalRamp = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff'];

    renderPixels(c, cleanFarmerBoots, bootsRamp, 35, bobY, lLift, rLift, 10);
    renderPixels(c, cleanFarmerPants, pantsRamp, 35, bobY, lLift, rLift, 15);
    renderPixels(c, cleanFarmerTorso, shirtRamp, 35, bobY, lLift, rLift, 20);
    renderPixels(c, fullMaleHead, null, 35, bobY, lLift, rLift, 30);

    // Leather Apron overlay
    for (let y = 30 + bobY; y <= 47 + bobY; y++) {
      const curW = y < 44 + bobY ? 14 : 12;
      const cx = 35;
      for (let x = cx - Math.floor(curW / 2); x <= cx + Math.floor(curW / 2); x++) {
        const edgeDist = Math.min(Math.abs(x - (cx - Math.floor(curW / 2))), Math.abs(x - (cx + Math.floor(curW / 2))));
        const col = edgeDist === 0 ? apronRamp[0] : (edgeDist === 1 ? apronRamp[2] : apronRamp[3]);
        c.setPixel(x, y, col, 3, 25);
      }
    }
    c.fillRect(32, 28 + bobY, 2, 4, apronRamp[1], 3, 26);
    c.fillRect(38, 28 + bobY, 2, 4, apronRamp[1], 3, 26);
    c.setPixel(32, 29 + bobY, '#f59e0b', 4, 27);
    c.setPixel(38, 29 + bobY, '#f59e0b', 4, 27);

    // Crimson Bandana & Spiky Hair
    for (let x = 24; x <= 38; x++) {
      c.setPixel(x, 14 + bobY, bandanaRamp[5], 3, 40);
      c.setPixel(x, 15 + bobY, bandanaRamp[4], 3, 40);
      c.setPixel(x, 16 + bobY, bandanaRamp[2], 3, 40);
    }
    c.fillRect(22, 14 + bobY, 3, 3, bandanaRamp[3], 4, 41);
    drawBezier(c, { x: 22, y: 15 + bobY }, { x: 19, y: 18 + bobY }, { x: 20, y: 22 + bobY }, bandanaRamp[4], 2, 42);
    // Hair tufts
    c.fillRect(26, 9 + bobY, 4, 5, '#542618', 3, 38);
    c.fillRect(31, 8 + bobY, 5, 6, '#7c3f15', 3, 38);
    c.fillRect(37, 10 + bobY, 4, 4, '#542618', 3, 38);

    // Sledgehammer
    c.fillRect(47, 18 + bobY, 3, 24, '#451a03', 4, 80);
    c.fillRect(44, 14 + bobY, 9, 6, metalRamp[3], 4, 82);
    c.fillRect(44, 14 + bobY, 9, 2, metalRamp[6], 4, 83);
    c.fillRect(43, 26 + bobY, 5, 5, '#7c3f15', 4, 85);
  } else if (key === 'knight') {
    const armorRamp = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff'];
    const pantsRamp = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];
    const bootsRamp = ['#0f172a', '#1e293b', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff'];
    const goldRamp = ['#78350f', '#b45309', '#d97706', '#f59e0b', '#fef08a'];
    const plumeRamp = ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

    renderPixels(c, cleanFarmerBoots, bootsRamp, 35, bobY, lLift, rLift, 10);
    renderPixels(c, cleanFarmerPants, pantsRamp, 35, bobY, lLift, rLift, 15);
    renderPixels(c, cleanFarmerTorso, armorRamp, 35, bobY, lLift, rLift, 20);
    renderPixels(c, fullMaleHead, null, 35, bobY, lLift, rLift, 30);

    // Gold Cross on breastplate
    c.fillRect(32, 33 + bobY, 7, 1, goldRamp[3], 3, 25);
    c.fillRect(35, 30 + bobY, 1, 7, goldRamp[3], 3, 25);
    // Pauldrons
    c.fillRect(25, 27 + bobY, 5, 5, armorRamp[5], 3, 26);
    c.fillRect(40, 27 + bobY, 5, 5, armorRamp[4], 3, 26);

    // Helmet Brow & Cheekguards
    c.fillRect(24, 13 + bobY, 16, 3, armorRamp[4], 3, 40);
    c.fillRect(24, 13 + bobY, 16, 1, armorRamp[6], 3, 41);
    c.fillRect(23, 16 + bobY, 3, 8, armorRamp[3], 3, 40);
    c.fillRect(39, 16 + bobY, 3, 8, armorRamp[3], 3, 40);

    // Blue Plume
    drawBezier(c, { x: 32, y: 13 + bobY }, { x: 27, y: 5 + bobY }, { x: 21, y: 4 + bobY }, plumeRamp[3], 3, 50);
    drawBezier(c, { x: 32, y: 13 + bobY }, { x: 27, y: 5 + bobY }, { x: 21, y: 4 + bobY }, plumeRamp[4], 1, 51);

    // Royal Heater Shield (Left)
    for (let y = 27 + bobY; y <= 42 + bobY; y++) {
      const sw = y < 35 + bobY ? 9 : Math.max(3, 9 - (y - (35 + bobY)) * 1.4);
      c.fillRect(20 - Math.floor(sw / 2), y, sw, 1, '#1e3a8a', 4, 70);
    }
    c.fillRect(16, 27 + bobY, 9, 1, goldRamp[3], 4, 71);
    c.fillRect(20, 31 + bobY, 1, 7, goldRamp[3], 4, 72);
    c.fillRect(17, 34 + bobY, 7, 1, goldRamp[3], 4, 72);

    // Broadsword (Right)
    c.fillRect(45, 18 + bobY, 2, 22, armorRamp[5], 4, 80);
    c.fillRect(45, 18 + bobY, 1, 22, '#ffffff', 4, 81);
    c.fillRect(42, 30 + bobY, 8, 2, goldRamp[3], 4, 82);
    c.fillRect(45, 32 + bobY, 2, 4, '#451a03', 4, 83);
    c.setPixel(45, 36 + bobY, goldRamp[3], 4, 84);
    c.fillRect(44, 29 + bobY, 4, 4, armorRamp[4], 4, 85);
  } else if (key === 'mage') {
    const robeRamp = ['#1e1035', '#2e1065', '#3b0764', '#581c87', '#6b21a8', '#7e22ce', '#a855f7', '#d8b4fe'];
    const skinRamp = ['#3b180a', '#692812', '#df9575', '#fbc5b0', '#ffece6'];
    const hairRamp = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9', '#ffffff'];
    const goldRamp = ['#78350f', '#b45309', '#d97706', '#f59e0b', '#fef08a'];
    const crystalRamp = ['#083344', '#0e7490', '#06b6d4', '#22d3ee', '#67e8f9', '#ffffff'];

    // Torso: upper body from Farmer's shirt remapped to royal violet
    renderPixels(c, cleanFarmerTorso, robeRamp, 35, bobY, lLift, rLift, 20);

    // Flowing Arcane Robe Skirt (y=40..56)
    for (let y = 40; y <= 56; y++) {
      const rw = Math.min(22, 13 + Math.round((y - 40) * 0.55));
      for (let x = 35 - Math.floor(rw / 2); x <= 35 + Math.floor(rw / 2); x++) {
        const edge = (x === 35 - Math.floor(rw / 2) || x === 35 + Math.floor(rw / 2));
        const col = edge ? robeRamp[1] : (Math.abs(x - 35) < 3 ? robeRamp[4] : robeRamp[2]);
        c.setPixel(x, y, col, 2, 15);
      }
    }
    // Gold Rune hem & sash
    c.fillRect(24, 56, 23, 2, goldRamp[3], 3, 16);
    c.fillRect(34, 30 + bobY, 2, 26, goldRamp[3], 3, 22);

    // Face: porcelain skin
    renderPixels(c, fullFemaleHead, skinRamp, 31, bobY, lLift, rLift, 30);

    // Flowing Silver Hair
    for (let y = 16 + bobY; y <= 32 + bobY; y++) {
      c.fillRect(23, y, 4, 1, hairRamp[4], 3, 35);
      c.fillRect(24, y, 2, 1, hairRamp[6], 3, 36);
      c.fillRect(37, y, 4, 1, hairRamp[4], 3, 35);
      c.fillRect(38, y, 2, 1, hairRamp[6], 3, 36);
    }

    // Wizard Hat
    drawBezier(c, { x: 31, y: 13 + bobY }, { x: 33, y: 6 + bobY }, { x: 39, y: 2 + bobY }, robeRamp[3], 5, 50);
    drawBezier(c, { x: 31, y: 13 + bobY }, { x: 33, y: 6 + bobY }, { x: 39, y: 2 + bobY }, robeRamp[5], 2, 51);
    drawBezier(c, { x: 14, y: 15 + bobY }, { x: 31, y: 12 + bobY }, { x: 48, y: 14 + bobY }, robeRamp[2], 3, 52);
    drawBezier(c, { x: 14, y: 14 + bobY }, { x: 31, y: 11 + bobY }, { x: 48, y: 13 + bobY }, goldRamp[3], 1, 53);
    c.fillRect(30, 11 + bobY, 3, 3, goldRamp[4], 4, 54);

    // Staff & Crystal
    c.fillRect(44, 14 + bobY, 2, 34, '#451a03', 4, 80);
    c.fillRect(42, 28 + bobY, 4, 4, skinRamp[3], 4, 81);
    c.ellipse(45, 12 + bobY, 3.5, 3.5, crystalRamp[2], 4, 85);
    c.ellipse(45, 12 + bobY, 2, 2, crystalRamp[4], 4, 86);
    c.setPixel(44, 11 + bobY, '#ffffff', 4, 87);
  } else if (key === 'fisherman') {
    const wadersRamp = ['#052e16', '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80'];
    const bootsRamp = ['#09090b', '#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'];
    const hatRamp = ['#713f12', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fef08a'];
    const fishRamp = ['#0e7490', '#06b6d4', '#22d3ee', '#67e8f9', '#ffffff'];

    renderPixels(c, cleanFarmerBoots, bootsRamp, 35, bobY, lLift, rLift, 10);
    renderPixels(c, cleanFarmerPants, wadersRamp, 35, bobY, lLift, rLift, 15);
    renderPixels(c, cleanFarmerTorso, wadersRamp, 35, bobY, lLift, rLift, 20);
    renderPixels(c, fullMaleHead, null, 35, bobY, lLift, rLift, 30);

    // Sailor Sweater
    c.fillRect(28, 28 + bobY, 14, 2, '#ffffff', 3, 22);
    c.fillRect(28, 30 + bobY, 14, 2, '#1d4ed8', 3, 23);
    c.fillRect(28, 32 + bobY, 14, 2, '#ffffff', 3, 22);

    // Wader Bib
    c.fillRect(30, 33 + bobY, 10, 8, wadersRamp[2], 3, 25);
    c.fillRect(31, 28 + bobY, 2, 6, wadersRamp[1], 3, 26);
    c.fillRect(37, 28 + bobY, 2, 6, wadersRamp[1], 3, 26);
    c.setPixel(31, 33 + bobY, '#f59e0b', 4, 27);
    c.setPixel(37, 33 + bobY, '#f59e0b', 4, 27);

    // Sou'wester Hat
    for (let y = 6 + bobY; y <= 13 + bobY; y++) {
      const hw = Math.round(7 + (y - (6 + bobY)) * 1.0);
      c.fillRect(35 - hw, y, hw * 2 + 1, 1, hatRamp[3], 3, 50);
    }
    c.fillRect(30, 7 + bobY, 10, 2, hatRamp[4], 3, 51);
    drawBezier(c, { x: 18, y: 15 + bobY }, { x: 35, y: 12 + bobY }, { x: 52, y: 14 + bobY }, hatRamp[2], 3, 52);

    // Rod & Fish
    c.fillRect(44, 28 + bobY, 4, 4, '#f5b584', 4, 80);
    drawBezier(c, { x: 46, y: 38 + bobY }, { x: 49, y: 22 + bobY }, { x: 56, y: 6 + bobY }, '#a16207', 2, 85);
    c.fillRect(56, 8 + bobY, 1, 20, '#ffffff', 4, 88);
    c.ellipse(56, 30 + bobY, 3.5, 2.5, fishRamp[1], 4, 90);
    c.setPixel(54, 30 + bobY, '#ffffff', 4, 91);
    c.setPixel(54, 30 + bobY, '#000000', 4, 92);
    c.fillRect(59, 29 + bobY, 2, 3, fishRamp[2], 4, 90);
    c.setPixel(56, 28 + bobY, fishRamp[3], 4, 91);
  } else if (key === 'ranger') {
    const tunicRamp = ['#052e16', '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80'];
    const leatherRamp = ['#271306', '#451e08', '#632e0e', '#7c3f15', '#9a531e', '#bf763b'];
    const hoodRamp = ['#052e16', '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e'];
    const hairRamp = ['#2c1404', '#5a2e0e', '#7c431a', '#9c5c2a', '#bf763b', '#dd9955'];

    renderPixels(c, cleanFarmerBoots, leatherRamp, 35, bobY, lLift, rLift, 10);
    renderPixels(c, cleanFarmerPants, tunicRamp, 35, bobY, lLift, rLift, 15);
    renderPixels(c, cleanFarmerTorso, tunicRamp, 35, bobY, lLift, rLift, 20);

    // Leather Corslet
    c.fillRect(31, 35 + bobY, 9, 5, leatherRamp[2], 3, 25);
    drawBezier(c, { x: 30, y: 29 + bobY }, { x: 35, y: 34 + bobY }, { x: 40, y: 39 + bobY }, leatherRamp[1], 2, 26);
    c.setPixel(35, 34 + bobY, '#f59e0b', 4, 27);

    // Face
    renderPixels(c, fullFemaleHead, null, 31, bobY, lLift, rLift, 30);

    // Auburn Braid
    for (let y = 18 + bobY; y <= 32 + bobY; y++) {
      c.fillRect(23, y, 3, 1, hairRamp[3], 3, 35);
      c.setPixel(24, y, hairRamp[4], 3, 36);
    }
    c.fillRect(23, 32 + bobY, 3, 2, '#dc2626', 4, 37);

    // Hood & Feather
    drawBezier(c, { x: 31, y: 5 + bobY }, { x: 23, y: 9 + bobY }, { x: 21, y: 16 + bobY }, hoodRamp[2], 3, 50);
    drawBezier(c, { x: 31, y: 5 + bobY }, { x: 39, y: 9 + bobY }, { x: 41, y: 16 + bobY }, hoodRamp[2], 3, 50);
    c.fillRect(26, 6 + bobY, 10, 2, hoodRamp[4], 3, 51);
    c.fillRect(23, 2 + bobY, 2, 6, '#dc2626', 4, 55);

    // Recurve Bow
    c.fillRect(44, 28 + bobY, 4, 4, '#fbc5b0', 4, 80);
    drawBezier(c, { x: 50, y: 14 + bobY }, { x: 46, y: 28 + bobY }, { x: 50, y: 44 + bobY }, '#713f12', 2, 85);
    c.fillRect(50, 15 + bobY, 1, 28, '#e2e8f0', 4, 86);
    c.fillRect(43, 28 + bobY, 10, 1, '#d4d4d8', 4, 88);
    c.setPixel(43, 28 + bobY, '#dc2626', 4, 89);
  }

  reinforceOutline(c, OUTLINE);

  const shadowCx = 35;
  c.ellipse(shadowCx, 59, 13, 3, 'rgba(40, 20, 15, 0.45)', 0, 0);

  return c;
}

// Render test lineup
const keys = ['farmer', 'baker', 'blacksmith', 'knight', 'mage', 'fisherman', 'ranger'];
const lineupW = keys.length * 64;
const lineupBuf = Buffer.alloc(lineupW * 64 * 4);

keys.forEach((k, idx) => {
  const c = renderChar(k);
  for (let py = 0; py < 64; py++) {
    for (let px = 0; px < 64; px++) {
      const srcIdx = (py * 64 + px) * 4;
      const dstIdx = ((py * lineupW) + (idx * 64 + px)) * 4;
      lineupBuf[dstIdx] = c.data[srcIdx];
      lineupBuf[dstIdx + 1] = c.data[srcIdx + 1];
      lineupBuf[dstIdx + 2] = c.data[srcIdx + 2];
      lineupBuf[dstIdx + 3] = c.data[srcIdx + 3];
    }
  }
});

const outPath = path.join(__dirname, 'generated', 'test_lineup_perfect.png');
writePng(outPath, lineupW, 64, lineupBuf);
console.log('Saved test lineup to:', outPath);
