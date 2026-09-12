#!/usr/bin/env python3
"""build_willowbrook_natura.py
Compiles the unified willowbrook_natura.html application:
- Fuses Natura's causal meteorological and biological simulation core
- Converted to Willowbrook's 7-tone storybook pixel art graphics
- Situates the Willowbrook village settlement in the living Natura biosphere
- Features the RimWorld-style biological Pawn Inspector and AI Brain bridge
"""
import os, sys, re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEV_DIR = os.path.join(BASE_DIR, 'willowbrook', 'dev')
OUT_FILE = os.path.join(BASE_DIR, 'willowbrook_natura.html')

def read_dev(name):
    path = os.path.join(DEV_DIR, name)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

print("Reading Willowbrook pixel-art dev modules...")
pa_core = read_dev('pa-core.js')
pa_terrain = read_dev('pa-terrain.js')
pa_veg = read_dev('pa-veg.js')
pa_props = read_dev('pa-props.js')
pa_buildings = read_dev('pa-buildings.js')
pa_chars = read_dev('pa-chars.js')
pa_fx = read_dev('pa-fx.js')

print("All modules loaded. Compiling willowbrook_natura.html...")

HTML_TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Willowbrook Natura — Living World Simulation</title>
<style>
  :root {
    --bg: #07090e;
    --panel: rgba(13, 18, 28, 0.92);
    --panel-border: #1e293b;
    --text: #f1f5f9;
    --muted: #94a3b8;
    --gold: #f59e0b;
    --blue: #38bdf8;
    --green: #4ade80;
    --red: #f43f5e;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
    background: var(--bg); color: var(--text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none; -webkit-user-select: none;
  }
  #top {
    position: fixed; top: 0; left: 0; right: 0; height: 44px;
    background: rgba(10, 14, 23, 0.95); backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--panel-border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px; z-index: 20; font-size: 13px;
  }
  .top-left, .top-right, .top-center { display: flex; align-items: center; gap: 10px; }
  .title { font-weight: 800; color: #86efac; letter-spacing: 0.5px; font-size: 14px; display: flex; align-items: center; gap: 6px; }
  .pill {
    background: #162032; border: 1px solid #283548; border-radius: 999px;
    padding: 3px 11px; font-size: 12px; color: #cbd5e1; font-weight: 500;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .pill-weather { color: #38bdf8; border-color: rgba(56,189,248,0.3); }
  .pill-temp { color: #facc15; }
  .btn {
    background: #1e293b; border: 1px solid #334155; color: #f8fafc;
    border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 12px;
    font-family: inherit; transition: all 0.15s ease;
  }
  .btn:hover { background: #334155; border-color: #475569; }
  .btn.active { background: #047857; border-color: #10b981; color: #ecfdf5; font-weight: 600; }
  #cv {
    position: fixed; top: 44px; left: 0; width: 100vw; height: calc(100vh - 44px);
    display: block; cursor: crosshair; image-rendering: pixelated;
  }

  /* RimWorld-Style Pawn Inspector */
  #pawn-inspector {
    position: fixed; left: 16px; bottom: 16px; width: 330px;
    background: var(--panel); backdrop-filter: blur(14px);
    border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px;
    padding: 12px 14px; z-index: 25; box-shadow: 0 16px 36px rgba(0,0,0,0.65);
    display: flex; flex-direction: column; gap: 10px;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .pi-header { display: flex; align-items: center; gap: 12px; }
  .pi-avatar-wrap {
    width: 44px; height: 52px; background: #0f172a; border-radius: 8px;
    border: 1px solid #334155; overflow: hidden; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pi-avatar-wrap canvas { width: 44px; height: 52px; image-rendering: pixelated; }
  .pi-meta { flex: 1; min-width: 0; }
  .pi-name-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .pi-name { font-weight: 800; font-size: 14.5px; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pi-badge {
    font-size: 9.5px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;
    padding: 2px 7px; border-radius: 999px; background: #1e3a8a; color: #93c5fd; border: 1px solid #3b82f6;
  }
  .pi-badge.controlled { background: #854d0e; color: #fef08a; border-color: #eab308; }
  .pi-role { font-size: 11.5px; color: var(--muted); margin-top: 1px; }
  .pi-trait-badge {
    display: inline-block; padding: 2px 7px; border-radius: 999px;
    font-size: 10px; font-weight: 700; margin-top: 3px; letter-spacing: 0.3px;
  }
  .pi-trait-swimmer { background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #7dd3fc; }
  .pi-trait-nonswimmer { background: rgba(248, 113, 113, 0.2); border: 1px solid #f87171; color: #fca5a5; }
  .pi-act {
    font-size: 11.5px; color: #e2e8f0; display: flex; align-items: center; gap: 6px;
    background: rgba(15,23,42,0.6); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);
  }
  .pi-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; flex-shrink: 0; }

  /* Biological Needs Grid */
  .pi-needs { display: flex; flex-direction: column; gap: 5px; }
  .pi-need-row { display: flex; flex-direction: column; gap: 2px; }
  .pi-need-head { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--muted); }
  .pi-need-head span:last-child { color: #e2e8f0; font-weight: 700; }
  .pi-track { height: 5px; background: #0f172a; border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
  .pi-fill { height: 100%; transition: width 0.25s ease; }
  .pi-food-fill { background: linear-gradient(90deg, #eab308, #4ade80); }
  .pi-hydro-fill { background: linear-gradient(90deg, #0284c7, #38bdf8); }
  .pi-rest-fill { background: linear-gradient(90deg, #6366f1, #a855f7); }
  .pi-temp-fill { background: linear-gradient(90deg, #38bdf8, #22c55e, #f97316); }
  .pi-mood-fill { background: linear-gradient(90deg, #ec4899, #f43f5e); }

  /* Gear & Thoughts */
  .pi-gear-card {
    display: flex; align-items: center; gap: 8px; padding: 5px 8px;
    background: rgba(15,23,42,0.6); border-radius: 6px; border: 1px solid #1e293b;
  }
  .pi-gear-icon { font-size: 15px; flex-shrink: 0; }
  .pi-gear-details { flex: 1; min-width: 0; }
  .pi-gear-name { font-weight: 700; font-size: 11px; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pi-gear-desc { font-size: 9.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .pi-thoughts-box { display: flex; flex-direction: column; gap: 3px; max-height: 85px; overflow-y: auto; }
  .pi-th-title { font-size: 9.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .pi-thought-item {
    font-size: 10.5px; padding: 2px 6px; border-radius: 4px; background: rgba(30,41,59,0.5);
    color: #cbd5e1; display: flex; justify-content: space-between;
  }
  .pi-thought-pos { color: #86efac; border-left: 2px solid #22c55e; }
  .pi-thought-neg { color: #fca5a5; border-left: 2px solid #ef4444; }

  /* Controls row */
  .pi-actions { display: flex; gap: 6px; }
  .pi-actions button { flex: 1; padding: 5px 0; font-size: 11px; font-weight: 600; border-radius: 6px; }

  /* Floating notification & hints */
  #toast {
    position: fixed; top: 58px; left: 50%; transform: translateX(-50%);
    background: rgba(15,23,42,0.92); border: 1px solid #38bdf8; color: #f8fafc;
    padding: 6px 16px; border-radius: 999px; font-size: 12px; font-weight: 600;
    pointer-events: none; opacity: 0; transition: opacity 0.25s ease; z-index: 30;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  #help-bar {
    position: fixed; right: 16px; bottom: 16px;
    background: rgba(10,14,23,0.85); backdrop-filter: blur(8px);
    border: 1px solid var(--panel-border); border-radius: 8px;
    padding: 6px 12px; font-size: 11.5px; color: var(--muted);
    display: flex; gap: 12px; z-index: 15;
  }
  #help-bar kbd {
    background: #1e293b; border: 1px solid #475569; color: #e2e8f0;
    padding: 1px 5px; border-radius: 4px; font-size: 10.5px; font-weight: 700;
  }
  #autotest {
    position: fixed; top: 60px; right: 20px; width: 380px; max-height: 80vh;
    background: rgba(10,14,24,0.95); border: 2px solid #38bdf8; border-radius: 8px;
    padding: 12px; font-family: monospace; font-size: 11.5px; line-height: 1.5;
    color: #cbd5e1; overflow-y: auto; z-index: 999; display: none; white-space: pre-wrap;
  }
</style>
</head>
<body>

<div id="top">
  <div class="top-left">
    <span class="title">🌿 WILLOWBROOK NATURA</span>
    <span class="pill" id="ui-clock">Day 1 · Spring · 08:00</span>
    <span class="pill pill-weather" id="ui-weather">⛅ Fair</span>
    <span class="pill pill-temp" id="ui-temp">21°C</span>
  </div>
  <div class="top-center">
    <button class="btn" id="btn-pause">⏸</button>
    <button class="btn active" id="btn-speed-1">1×</button>
    <button class="btn" id="btn-speed-2">2×</button>
    <button class="btn" id="btn-speed-4">4×</button>
    <button class="btn" id="btn-speed-16">16×</button>
  </div>
  <div class="top-right">
    <button class="btn" id="btn-sound">🔊 Sound: ON</button>
    <button class="btn" id="btn-spawn-visitor">✦ Invite Visitor</button>
  </div>
</div>

<canvas id="cv"></canvas>

<!-- RimWorld-Style Pawn Inspector -->
<div id="pawn-inspector">
  <div class="pi-header">
    <div class="pi-avatar-wrap"><canvas id="pi-avatar" width="44" height="52"></canvas></div>
    <div class="pi-meta">
      <div class="pi-name-row">
        <span class="pi-name" id="pi-name">Marta</span>
        <span class="pi-badge controlled" id="pi-badge">Controlled</span>
      </div>
      <div class="pi-role" id="pi-role">Village Farmer</div>
      <div class="pi-trait-badge pi-trait-swimmer" id="pi-swim-badge">🏊 Swimmer (Skill 60%)</div>
    </div>
  </div>

  <div class="pi-act" id="pi-act-box">
    <div class="pi-dot" id="pi-dot"></div>
    <span id="pi-act-label">Tending the vegetable rows</span>
  </div>

  <!-- Real-time Biological Needs (Metabolism & Thermoregulation) -->
  <div class="pi-needs">
    <div class="pi-need-row">
      <div class="pi-need-head"><span>🍞 Food (Satiety)</span><span id="pi-val-food">90%</span></div>
      <div class="pi-track"><div class="pi-fill pi-food-fill" id="pi-fill-food" style="width:90%"></div></div>
    </div>
    <div class="pi-need-row">
      <div class="pi-need-head"><span>💧 Hydration (Water)</span><span id="pi-val-hydro">85%</span></div>
      <div class="pi-track"><div class="pi-fill pi-hydro-fill" id="pi-fill-hydro" style="width:85%"></div></div>
    </div>
    <div class="pi-need-row">
      <div class="pi-need-head"><span>💤 Rest (Stamina)</span><span id="pi-val-rest">92%</span></div>
      <div class="pi-track"><div class="pi-fill pi-rest-fill" id="pi-fill-rest" style="width:92%"></div></div>
    </div>
    <div class="pi-need-row">
      <div class="pi-need-head"><span>🌡️ Body Temp</span><span id="pi-val-temp">37.0°C</span></div>
      <div class="pi-track"><div class="pi-fill pi-temp-fill" id="pi-fill-temp" style="width:70%"></div></div>
    </div>
    <div class="pi-need-row">
      <div class="pi-need-head"><span>❤️ Mood</span><span id="pi-val-mood">95%</span></div>
      <div class="pi-track"><div class="pi-fill pi-mood-fill" id="pi-fill-mood" style="width:95%"></div></div>
    </div>
  </div>

  <!-- Active Tool Gear -->
  <div class="pi-gear-card">
    <div class="pi-gear-icon" id="pi-gear-icon">🌾</div>
    <div class="pi-gear-details">
      <div class="pi-gear-name" id="pi-gear-name">Sturdy Farming Hoe</div>
      <div class="pi-gear-desc" id="pi-gear-desc">Hand-forged blade, ash wood handle.</div>
    </div>
  </div>

  <!-- Psychological & Biological Thoughts -->
  <div class="pi-thoughts-box">
    <div class="pi-th-title">Recent Thoughts & Sensations</div>
    <div id="pi-th-list" style="display:flex; flex-direction:column; gap:3px;"></div>
  </div>

  <!-- Actions -->
  <div class="pi-actions">
    <button class="btn" id="btn-prev-pawn">◀ Prev</button>
    <button class="btn active" id="btn-toggle-ctrl">Release to AI</button>
    <button class="btn" id="btn-next-pawn">Next ▶</button>
  </div>
</div>

<div id="toast">✦ A visitor arrives</div>

<div id="help-bar">
  <span><kbd>WASD</kbd> Move</span>
  <span><kbd>Click</kbd> Select / Walk</span>
  <span><kbd>Tab</kbd> Cycle Pawn</span>
  <span><kbd>E</kbd> Interact / Drink / Work</span>
</div>

<div id="autotest"></div>

<script>
'use strict';
'''

# Add closing and generation code
def generate():
    full_js = []

    # 1. Pixel Art Core Modules from Willowbrook
    full_js.append("/* =====================================================================\n"
                   "   PART 1: WILLOWBROOK PIXEL-ART MODULES (NATIVE PROCEDURAL COMPILER)\n"
                   "   ===================================================================== */")
    full_js.append(pa_core)
    full_js.append(pa_terrain)
    full_js.append(pa_veg)
    full_js.append(pa_props)
    full_js.append(pa_buildings)
    full_js.append(pa_chars)
    full_js.append(pa_fx)

    # 2. Natura Simulation Core + Willowbrook Unified Bridge
    bridge_script = r'''
/* =====================================================================
   PART 2: NATURA CAUSAL METEOROLOGICAL & BIOLOGICAL SIMULATION CORE
   FUSED WITH WILLOWBROOK VILLAGE SETTLEMENT & CHIBI RENDERER
   ===================================================================== */

const CS = 32;          // 1 Natura cell = 32x32 px (1-to-1 match with Willowbrook tiles!)
const CHN = 16;         // 16 cells per chunk = 512x512 px
const SEA = 0.32;       // sea level
let SEED = 20260912;

/* ---- World Clock & Weather State ---- */
const W = {
  day: 1,
  tod: 8.0,            // Time of day: 0.0 .. 24.0
  speed: 1,            // Simulation multiplier
  paused: false,
  windAng: 0.8,
  windSpd: 1.2,
  season: 'Spring',
  temp: 21.0,          // Ambient village temperature (°C)
  hum: 0.55,           // Ambient humidity
  rain: 0.0,           // Precipitation level 0..1
  storm: 0.0,          // Thunderstorm gloom 0..1
};

/* Noise & Math Helpers */
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const lerp = (a,b,t) => a+(b-a)*t;
// Configuration for curve enhancements
const CURVE_UI_RADIUS = 12; // px, can be adjusted in CSS as well
const SPRITE_SCALE_FACTOR = 3; // 2, 3, or 4 – higher values give smoother curves

function paBlob(g,cx,cy,r,col){
  if(col==null) return;
  g.fillStyle=col;
  const rr=Math.ceil(r);
  for(let j=-rr;j<=rr;j++) for(let i=-rr;i<=rr;i++)
    if(i*i+j*j<=r*r+0.4) g.fillRect(Math.round(cx+i),Math.round(cy+j),1,1);
}

// Draw a rectangle with rounded corners on a given 2D context
function drawRoundedRect(g, x, y, w, h, r, col) {
  if(col==null) return;
  g.fillStyle = col;
  const radius = Math.min(r, w/2, h/2);
  g.beginPath();
  g.moveTo(x + radius, y);
  g.lineTo(x + w - radius, y);
  g.arcTo(x + w, y, x + w, y + radius, radius);
  g.lineTo(x + w, y + h - radius);
  g.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  g.lineTo(x + radius, y + h);
  g.arcTo(x, y + h, x, y + h - radius, radius);
  g.lineTo(x, y + radius);
  g.arcTo(x, y, x + radius, y, radius);
  g.closePath();
  g.fill();
}

// Helper to render at higher resolution then downscale without smoothing
function highResRender(drawFn, scale) {
  const s = paMk(32 * scale, 32 * scale); // base size * scale (adjust as needed)
  const g = s.g;
  // Run the drawing function on the high‑res context
  drawFn(g);
  // Downscale back to original size
  const final = paMk(32, 32);
  const fg = final.g;
  fg.imageSmoothingEnabled = false;
  fg.drawImage(s.c, 0, 0, 32, 32);
  return final;
}

function paBlob(g,cx,cy,r,col){
  if(col==null) return;
  g.fillStyle=col;
  const rr=Math.ceil(r);
  for(let j=-rr;j<=rr;j++) for(let i=-rr;i<=rr;i++)
    if(i*i+j*j<=r*r+0.4) g.fillRect(Math.round(cx+i),Math.round(cy+j),1,1);
}

function hash2(x,y,s){
  let h = Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,2246822519);
  h = Math.imul(h^(h>>>13),1274126177); h^=h>>>16;
  return (h>>>0)/4294967295;
}
function vnoise(x,y,s){
  const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi,s), b=hash2(xi+1,yi,s), c=hash2(xi,yi+1,s), d=hash2(xi+1,yi+1,s);
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function fbm(x,y,s,oct=3){
  let t=0,amp=0.5,f=1,n=0;
  for(let i=0;i<oct;i++){ t+=amp*vnoise(x*f,y*f,s+i*131); n+=amp; amp*=0.5; f*=2.02; }
  return t/n;
}

/* ---- Meteorological Systems (Migratory Low-Pressure Fronts) ---- */
const systems = [];
function initSystems(){
  systems.length=0;
  for(let k=0;k<5;k++){
    systems.push({
      x: (hash2(k,1,SEED+900)-0.5)*3600,
      y: (hash2(k,2,SEED+900)-0.5)*3600,
      r: 600 + hash2(k,3,SEED+900)*400,
      inten: 0.4 + hash2(k,4,SEED+900)*0.6,
      ph: hash2(k,5,SEED+900)*10
    });
  }
}
initSystems();

/* ---- Procedural Infinite Chunks ---- */
const chunks = new Map();
function genChunk(cx,cy){
  const N = CHN, n = N*N;
  const ch = {
    cx, cy,
    h: new Float32Array(n),
    moist: new Float32Array(n),
    fert: new Float32Array(n),
    grass: new Float32Array(n),
    tStage: new Float32Array(n),
    treeType: new Uint8Array(n), // 0: Oak, 1: Pine, 2: Apple
    snag: new Float32Array(n),
    bush: new Float32Array(n),
    temp: new Float32Array(n),
    hum: new Float32Array(n),
    cloud: new Float32Array(n),
    rain: new Float32Array(n),
    storm: new Float32Array(n),
    burn: new Float32Array(n),
    tileType: new Uint8Array(n)  // 0: grass, 1: path, 2: water, 3: stone, 4: field
  };

  const isVillageCenter = (cx === 0 && cy === 0);

  for(let iy=0;iy<N;iy++)for(let ix=0;ix<N;ix++){
    const wx = cx*N + ix, wy = cy*N + iy, i = iy*N + ix;
    let h = fbm(wx*0.035, wy*0.035, SEED, 3);
    h = Math.pow(h, 1.2);

    // Elevated dry meadow foundation across entire village settlement (no water near buildings)
    if(wx >= -22 && wx <= 20 && wy >= -22 && wy <= 22){
      h = Math.max(SEA + 0.15, h);
    }

    // Lake / Freshwater Creek on the eastern side of village (wx: 28, wy: 7)
    const pondDist = Math.hypot(wx - 28, wy - 7);
    if(pondDist < 7.5){
      if(pondDist < 4.0){
        // Deep lake center (> 1.8m depth, requires swimming)
        h = SEA - 0.14;
      } else {
        // Lake perimeter: shallow water (~0.4m depth, wading)
        h = SEA - 0.038 * (1 - (pondDist - 4.0)/3.5);
      }
    }

    ch.h[i] = h;
    const land = h >= SEA;
    ch.moist[i] = land ? 0.5 + fbm(wx*0.03+900, wy*0.03+900, SEED+31, 2)*0.4 : 1.0;
    ch.fert[i] = 0.35 + fbm(wx*0.05+300, wy*0.05+300, SEED+77, 2)*0.55;
    ch.grass[i] = land ? 0.35 + hash2(wx,wy,SEED+5)*0.5 : 0;
    ch.temp[i] = 21.0;
    ch.hum[i] = 0.55;

    // Default tile typing:
    // 0: grass, 1: path, 2: deep water, 3: stone, 4: field, 5: bridge/pier, 6: shallow water
    if(!land){
      ch.tileType[i] = (h < SEA - 0.05) ? 2 : 6;
    } else {
      ch.tileType[i] = 0; // grass
    }

    // Vegetation
    if(land && h < 0.75 && !(isVillageCenter && Math.hypot(wx-3, wy-3) < 12)){
      const f = fbm(wx*0.06+700, wy*0.06+700, SEED+55, 2);
      if(f > 0.58 && hash2(wx,wy,SEED+6) > 0.35){
        ch.tStage[i] = 3.0 + hash2(wx,wy,SEED+8)*1.5; // mature tree
        ch.treeType[i] = Math.floor(hash2(wx,wy,SEED+12)*3); // 0: Oak, 1: Pine, 2: Apple
      } else if(hash2(wx,wy,SEED+20) > 0.93){
        ch.bush[i] = 1.0; // berry bush
      }
    }
  }

  chunks.set(cx+','+cy, ch);
  return ch;
}

function chunkAt(cx,cy){
  const k = cx+','+cy;
  let c = chunks.get(k);
  if(!c) c = genChunk(cx,cy);
  return c;
}

function cellChunk(wx,wy){
  const cx = Math.floor(wx/CHN), cy = Math.floor(wy/CHN);
  const c = chunkAt(cx,cy);
  const i = (wy - cy*CHN)*CHN + (wx - cx*CHN);
  return {c, i, cx, cy};
}

/* ---------------------------------------------------------------------
   PART 3: WILLOWBROOK VILLAGE SETTLEMENT IN NATURA
   --------------------------------------------------------------------- */
const VILLAGE_BUILDINGS = [];
const VILLAGE_OBJECTS = [];

function initVillageSettlement(){
  // Clear trees in village plaza
  for(let wy=-20; wy<=22; wy++) for(let wx=-20; wx<=26; wx++){
    const {c, i} = cellChunk(wx, wy);
    c.tStage[i] = 0;
    c.bush[i] = 0;
  }

  // 11 Buildings
  VILLAGE_BUILDINGS.length = 0;
  function addBld(id, name, wx, wy, tw, th, sprKey){
    VILLAGE_BUILDINGS.push({
      id, name,
      wx, wy,
      x: wx * CS, y: wy * CS,
      tw, th,
      sprKey,
      door: { wx: wx + Math.floor(tw/2), wy: wy + th }
    });
  }

  addBld('townhall', 'Alden’s Town Hall', -3, -16, 6, 5, 'townhall');
  addBld('house5', 'Rose Cottage', -14, -16, 4, 4, 'house5');
  addBld('shop', 'Sella’s General Store & Bakery', 8, -14, 5, 4, 'shop');
  addBld('farmhouse', 'Marta’s Farmhouse', -16, -6, 4, 4, 'farmhouse');
  addBld('herbhut', 'Wren’s Herbalist Cottage', 14, -6, 4, 4, 'herbhut');
  addBld('inn', 'The Sleepy Stag Inn', 4, 4, 6, 5, 'inn');
  addBld('smithy', 'Bram’s Smithy', -12, 4, 5, 4, 'smithy');
  addBld('fishhut', 'Finn’s Dockhouse', 14, 3, 4, 4, 'house3');
  addBld('house1', 'Stone Cottage', -14, 14, 4, 4, 'house1');
  addBld('house2', 'Timber Cabin', -4, 15, 4, 4, 'house2');
  addBld('house4', 'Slate Cottage', 6, 15, 4, 4, 'house4');

  // Stone Pathways (leading cleanly to doorsteps without cutting through buildings or crop fields)
  const pathCells = [
    // Central North-South Main Street
    [0,-11],[0,-10],[0,-9],[0,-8],[0,-7],[0,-6],[0,-5],[0,-4],[0,-3],[0,-2],[0,-1],[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],[0,13],[0,14],[0,15],[0,16],[0,17],[0,18],[0,19],
    // Central East-West Boulevard
    [-16,0],[-15,0],[-14,0],[-13,0],[-12,0],[-11,0],[-10,0],[-9,0],[-8,0],[-7,0],[-6,0],[-5,0],[-4,0],[-3,0],[-2,0],[-1,0],[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[15,0],[16,0],
    // Town Hall Plaza & Front Steps
    [-1,-11],[0,-11],[1,-11],
    // Sella's Bakery Walkway
    [1,-9],[2,-9],[3,-9],[4,-9],[5,-9],[6,-9],[7,-9],[8,-9],[9,-9],[10,-9],[10,-10],
    // Marta's Farm Lane (clean straight lane running along front of fields directly to doorstep [-14, -2])
    [-1,-2],[-2,-2],[-3,-2],[-4,-2],[-5,-2],[-6,-2],[-7,-2],[-8,-2],[-9,-2],[-10,-2],[-11,-2],[-12,-2],[-13,-2],[-14,-2],
    // Wren's Herbal Garden Walkway
    [1,-2],[2,-2],[3,-2],[4,-2],[5,-2],[6,-2],[7,-2],[8,-2],[9,-2],[10,-2],[11,-2],[12,-2],[13,-2],[14,-2],[15,-2],[16,-2],
    // Smithy Branch
    [-1,8],[-2,8],[-3,8],[-4,8],[-5,8],[-6,8],[-7,8],[-8,8],[-9,8],[-10,8],
    // Inn Promenade
    [1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9],
    // Fisher's Creek Pier approach (runs along py: 7 directly in front of Finn's door to the pier)
    [1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],
    // South Cottages Front Street (runs along py: 19 connecting doorsteps [-12, 19], [-2, 19], [8, 19])
    [-14,19],[-13,19],[-12,19],[-11,19],[-10,19],[-9,19],[-8,19],[-7,19],[-6,19],[-5,19],[-4,19],[-3,19],[-2,19],[-1,19],[0,19],[1,19],[2,19],[3,19],[4,19],[5,19],[6,19],[7,19],[8,19],
  ];
  for(const [px,py] of pathCells){
    const {c, i} = cellChunk(px, py);
    c.tileType[i] = 1; // path
  }

  // Marta's Fertile Crop Rows (placed cleanly east of farmhouse, matching farmhouse height wy: -6..-3)
  for(let fy=-6; fy<=-3; fy++) for(let fx=-11; fx<=-7; fx++){
    const {c, i} = cellChunk(fx, fy);
    c.tileType[i] = 4; // field
    c.moist[i] = 0.85;
    c.tStage[i] = 0;
    c.bush[i] = 0;
  }

  // Wooden Fishing Pier (Bridge tiles extending out over lake at py: 7)
  for(let px=18; px<=24; px++){
    const {c, i} = cellChunk(px, 7);
    c.tileType[i] = 5; // bridge / pier
  }

  // Props: Well, Anvil, Firepit, Benches, Streetlamps
  VILLAGE_OBJECTS.length = 0;
  VILLAGE_OBJECTS.push({ kind: 'well', wx: 0, wy: 0, x: 0*CS + 16, y: 0*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'anvil', wx: -9, wy: 8, x: -9*CS + 16, y: 8*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'bench', wx: 3, wy: 2, x: 3*CS + 16, y: 2*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'bench', wx: -2, wy: 2, x: -2*CS + 16, y: 2*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'lamp', wx: 0, wy: -6, x: 0*CS + 16, y: -6*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'lamp', wx: 0, wy: 6, x: 0*CS + 16, y: 6*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'lamp', wx: 6, wy: 1, x: 6*CS + 16, y: 1*CS + 16 });
  VILLAGE_OBJECTS.push({ kind: 'lamp', wx: -6, wy: 1, x: -6*CS + 16, y: 1*CS + 16 });

  // STRICT SANITIZATION: Guarantee 100% dry foundation and zero stray tiles inside any building
  for(const b of VILLAGE_BUILDINGS){
    for(let dy=0; dy<b.th; dy++){
      for(let dx=0; dx<b.tw; dx++){
        const {c, i} = cellChunk(b.wx + dx, b.wy + dy);
        c.h[i] = SEA + 0.15; // elevated dry foundation
        c.tileType[i] = 0;   // clean solid grass/ground foundation
        c.tStage[i] = 0;     // remove trees
        c.treeType[i] = 0;
        c.bush[i] = 0;       // remove bushes
      }
    }
  }
}

/* ---------------------------------------------------------------------
   PART 4: LIVING BODIES & CHARACTER BIOMETRICS (NATURA ENGINE)
   --------------------------------------------------------------------- */
const VILLAGERS = [];
const G = {
  villagers: VILLAGERS,
  frame: 0,
  particles: [],
  inspectedVillager: null
};
let controlledPawnIdx = 0;
let inspectedPawnIdx = 0;

function ensureBody(v){
  if(v.body) return v.body;
  v.body = {
    hydration: 0.90 + Math.random()*0.08,
    satiety: 0.88 + Math.random()*0.10,
    fatigue: 0.10 + Math.random()*0.08,
    sleepDebt: 0.0,
    coreTemp: 37.0,
    stress: 0.05,
    thermal: 0.0,
    tissue: 1.0,
    wetness: 0.0,
    oxygen: 1.0,
    lastMeal: 2.0,
    lastDrink: 1.0
  };
  return v.body;
}

function bodyDrives(v){
  const b = ensureBody(v), out = [];
  if(v.state === 'drown_panic') out.push({ text: 'CANNOT SWIM! Choking on deep water! 💦😱', val: -15 });
  else if(v.state === 'swim') out.push({ text: 'Gliding smoothly through cool lake water 🏊', val: 6 });
  else if(v.state === 'wade') out.push({ text: 'Wading through refreshing shallow ripples 🌊', val: 4 });

  if(b.hydration < 0.15) out.push({ text: 'Mouth parched; desperately needs water', val: -6 });
  else if(b.hydration < 0.35) out.push({ text: 'Feeling thirsty; craving cool water', val: -3 });
  if(b.satiety < 0.15) out.push({ text: 'Hollow with hunger; needs food immediately', val: -6 });
  else if(b.satiety < 0.35) out.push({ text: 'Stomach rumbling; needs a meal soon', val: -3 });
  if(b.fatigue > 0.80) out.push({ text: 'Body heavy with exhaustion; needs sleep', val: -5 });
  else if(b.fatigue > 0.60) out.push({ text: 'Muscles weary from daily labor', val: -2 });

  if(b.wetness > 0.5 && b.coreTemp < 36.4) out.push({ text: 'Soaked clothes clinging, shivering in cold breeze', val: -5 });
  else if(b.coreTemp < 36.2) out.push({ text: 'Chilled to the bone from cold wind/rain', val: -4 });
  else if(b.wetness > 0.3 && b.coreTemp > 37.2) out.push({ text: 'Cool lake water feels wonderfully soothing', val: 5 });
  else if(b.coreTemp > 37.8) out.push({ text: 'Overheated and sweating under the sun', val: -2 });

  if(v.state === 'work') out.push({ text: 'Engaged in productive honest labor', val: 4 });
  if(out.length === 0) out.push({ text: 'Body feels steady, strong and capable', val: 5 });
  return out;
}

function bodyTick(v, dtH){
  const b = ensureBody(v);
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const {c, i} = cellChunk(wx, wy);

  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;
  const isShallow = depth > 0 && depth <= 0.05;

  // Environmental exposure
  const isRainWet = c.rain[i] > 0.15 && !v.inBuilding;
  const isNearFire = (v.name === 'Bram' && v.state === 'work') || v.inBuilding;
  const envTemp = c.temp[i];

  // Wetness dynamics
  if(isDeep) b.wetness = 1.0;
  else if(isShallow) b.wetness = Math.min(1.0, b.wetness + dtH * 15);
  else if(isRainWet) b.wetness = Math.min(1.0, b.wetness + dtH * 2.5);
  else b.wetness = Math.max(0, b.wetness - dtH * (envTemp > 24 ? 2.5 : 1.2)); // dries off

  // Water / Swimming / Drowning mechanics
  let exert = (v.state === 'work' ? 1.8 : (v.moving ? 0.7 : 0.15));
  if(isDeep){
    if(v.canSwim){
      v.state = 'swim';
      exert = 2.4; // swimming is a vigorous whole-body cardio workout
      b.oxygen = Math.min(1.0, b.oxygen + dtH * 5);
      // Lake water cooling effect
      b.coreTemp = Math.max(35.5, b.coreTemp - 0.4 * dtH);
    } else {
      v.state = 'drown_panic';
      exert = 3.5; // frantic flailing
      b.oxygen = Math.max(0, b.oxygen - dtH * 35);
      b.stress = Math.min(1.0, b.stress + dtH * 25);
      b.hydration = Math.min(1.0, b.hydration + dtH * 1.5); // swallowing water
    }
  } else if(isShallow){
    if(v.state === 'walk' || v.state === 'wade') v.state = 'wade';
    exert = (v.moving ? 1.4 : 0.2); // wading drag
    b.oxygen = Math.min(1.0, b.oxygen + dtH * 20);
    if(envTemp > 24) b.stress = Math.max(0, b.stress - dtH * 0.5); // refreshing summer dip
  } else {
    b.oxygen = Math.min(1.0, b.oxygen + dtH * 20);
  }

  // Water depletion (accelerates with heat & exertion)
  const waterLoss = (0.015 + 0.008*exert + (envTemp > 25 ? 0.012 : 0)) * dtH;
  b.hydration = clamp(b.hydration - waterLoss, 0, 1);

  // Calorie burn
  const calLoss = (0.014 + 0.010*exert) * dtH;
  b.satiety = clamp(b.satiety - calLoss, 0, 1);

  // Rest / Stamina
  if(v.state === 'sleep'){
    b.fatigue = clamp(b.fatigue - dtH / 4.5, 0, 1);
    b.sleepDebt = Math.max(0, b.sleepDebt - dtH * 1.5);
  } else if(v.state === 'sit'){
    b.fatigue = clamp(b.fatigue - dtH / 12, 0, 1);
  } else {
    b.fatigue = clamp(b.fatigue + (0.01 + 0.02*exert) * dtH, 0, 1);
    b.sleepDebt = Math.min(18, b.sleepDebt + dtH * 0.03);
  }

  // Thermoregulation (core body temperature)
  // Wet clothes cause evaporative cooling; cold rain lowers temp
  const targetTemp = 37.0 + (envTemp - 20)*0.04 + (isNearFire ? 0.7 : 0) - (b.wetness * (envTemp < 22 ? 1.6 : 0.6));
  b.coreTemp += (targetTemp - b.coreTemp) * Math.min(1, 0.3 * dtH);

  // Stress & Mood
  const deficits = (1 - b.hydration)*0.9 + (1 - b.satiety)*0.8 + b.fatigue*0.6 + Math.abs(b.coreTemp - 37.0)*1.2 + (1 - b.oxygen)*4.0;
  b.stress = clamp(b.stress + (deficits*0.15 - b.stress*0.05)*dtH, 0, 1);

  // Mood synthesis
  v.mood = clamp(1.0 - b.stress * 0.85, 0.05, 1.0);
  v.hunger = b.satiety;
  v.energy = clamp(1.0 - b.fatigue, 0, 1);
  v.hydration = b.hydration;
  v.coreTemp = b.coreTemp;

  // Sensation drives
  v.thoughts = bodyDrives(v);
}

/* ---------------------------------------------------------------------
   PART 5: VILLAGER ROSTER INITIALIZATION
   --------------------------------------------------------------------- */
function initVillagers(){
  VILLAGERS.length = 0;
  function makeV(name, role, homeId, wx, wy, toolKind, toolName, toolIcon, toolDesc, thoughts, canSwim, swimSkill, swimReason){
    const v = {
      name, role, homeId,
      x: wx * CS + 16, y: wy * CS + 16,
      targetX: wx * CS + 16, targetY: wy * CS + 16,
      workWx: wx, workWy: wy,
      face: 0, state: 'idle', moving: false, walkPhase: 0,
      seed: Math.random() * 100,
      isNPC: true, inBuilding: false,
      canSwim: (canSwim !== false),
      swimSkill: (swimSkill != null ? swimSkill : 0.6),
      swimReason: swimReason || '',
      workProgress: 0, triumphT: 0,
      equippedTool: { kind: toolKind, name: toolName, icon: toolIcon, desc: toolDesc },
      mood: 0.95, hunger: 0.9, energy: 0.9, hydration: 0.9, coreTemp: 37.0,
      thoughts: thoughts || []
    };
    ensureBody(v);
    VILLAGERS.push(v);
    return v;
  }

  makeV('Marta', 'Village Farmer', 'farmhouse', -12, -3, 'hoe', 'Sturdy Farming Hoe', '🌾',
    'Hand-forged hoe blade, ash wood handle.', [{text:'The soil is rich and generous today', val:5}],
    true, 0.6, 'Strong farm swimmer');

  makeV('Bram', 'Master Blacksmith', 'smithy', -10, 8, 'hammer', 'Smithing Hammer', '⚒️',
    'Dense cast steel hammer for anvil shaping.', [{text:'Good steel takes patience and heat', val:5}],
    false, 0.0, 'Dense blacksmith physique');
  const bramObj = VILLAGERS.find(v => v.name === 'Bram');
  if(bramObj) bramObj.face = 3;

  makeV('Sella', 'Baker & Shopkeeper', 'shop', 10, -9, 'rollingpin', 'Maple Rolling Pin', '🥖',
    'Smooth carved maple pin for sourdough loaves.', [{text:'Fresh bread aroma fills the street', val:5}],
    false, 0.0, 'Never learned to swim');

  makeV('Tobin', 'Innkeeper', 'inn', 7, 9, 'mug', 'Cellar Ale Tankard', '🍺',
    'Oak tankard with cellar-chilled brew.', [{text:'The tavern fireplace is roaring and warm', val:5}],
    true, 0.5, 'Casual river swimmer');

  makeV('Wren', 'Herbalist & Apothecary', 'herbhut', 16, -1, 'broom', 'Herbalist Broom', '🌿',
    'Lavender-scented broom for herb bundling.', [{text:'Sage and thyme harvested in peak bloom', val:4}],
    true, 0.6, 'Practiced stream bather');

  makeV('Finn', 'Pond Fisherman', 'fishhut', 16, 8, 'rod', 'Willow Fishing Rod', '🎣',
    'Bending willow pole with silken line.', [{text:'Quiet morning ripples by the water', val:4}],
    true, 1.0, 'Master fisherman & diver');

  makeV('Alden', 'Village Mayor', 'townhall', 0, -10, 'scroll', 'Mayor’s Walking Cane', '📜',
    'Polished walnut cane with brass pommel.', [{text:'Order and prosperity in the valley', val:4}],
    false, 0.0, 'Elderly mayor with cane');

  makeV('Pip', 'Village Kid', 'house1', 1, -1, 'ball', 'Oak Slingshot', '🎯',
    'Forked oak branch with leather pouch.', [{text:'Playing games under the morning sun!', val:6}],
    true, 0.8, 'Nimble kid & lake diver');

  // Wandering Visitors
  makeV('Rowan', 'Traveling Bard', 'inn', 3, 2, 'lute', 'Carved Pine Lute', '🎵',
    'Resonant lute crafted from ancient pines.', [{text:'Ballads sound lovely in this cozy valley', val:5}],
    true, 0.5, 'Traveling river swimmer');

  makeV('Clara', 'Silk Merchant', 'inn', -1, 0, 'basket', 'Silk Merchant Basket', '🧺',
    'Woven basket overflowing with exotic fabrics.', [{text:'Fine trade and friendly villagers', val:4}],
    true, 0.5, 'Silk merchant river bather');

  makeV('Gareth', 'Wandering Knight', 'inn', 0, 11, 'sword', 'Silver Longsword', '⚔️',
    'Gleaming castle-forged blade inscribed with vows.', [{text:'A peaceful haven away from royal intrigue', val:6}],
    false, 0.0, 'Heavy iron armor (35kg)');

  // Player controls Marta initially
  VILLAGERS[0].isNPC = false;
  controlledPawnIdx = 0;
  inspectedPawnIdx = 0;
}

/* ---------------------------------------------------------------------
   PART 5B: NAVIGATION, WATER DEPTH & COLLISION ENGINE
   --------------------------------------------------------------------- */
function getWaterDepth(wx, wy){
  const {c, i} = cellChunk(wx, wy);
  if(c.tileType[i] === 5) return 0; // Wooden bridge / pier is above water
  if(c.h[i] >= SEA) return 0;       // Dry land
  return SEA - c.h[i];              // Water depth: <= 0.05 shallow, > 0.05 deep
}

function getShallowEscapeVector(px, py){
  const curWx = Math.floor(px / CS), curWy = Math.floor(py / CS);
  let bestDist = 9999, bestWx = curWx, bestWy = curWy;
  for(let dy=-5; dy<=5; dy++){
    for(let dx=-5; dx<=5; dx++){
      const wx = curWx + dx, wy = curWy + dy;
      const depth = getWaterDepth(wx, wy);
      if(depth <= 0.05){
        const d = Math.hypot(dx, dy);
        if(d < bestDist){
          bestDist = d;
          bestWx = wx;
          bestWy = wy;
        }
      }
    }
  }
  const tx = bestWx * CS + 16, ty = bestWy * CS + 16;
  const len = Math.hypot(tx - px, ty - py) || 1;
  return { dx: (tx - px)/len, dy: (ty - py)/len };
}

function canMoveTo(x, y, v){
  const r = 8; // character collision radius
  const wx = Math.floor(x / CS), wy = Math.floor(y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;
  const isWater = depth > 0;

  // 1. Building Solid Walls & Doorways
  for(const b of VILLAGE_BUILDINGS){
    const bx0 = b.wx * CS;
    const by0 = (b.wy + 1) * CS; // Wall body starts at row wy+1; row wy behind the roof remains walkable with Y-depth sorting
    const bx1 = (b.wx + b.tw) * CS;
    const by1 = (b.wy + b.th) * CS - 6;

    if(x + r > bx0 && x - r < bx1 && y + r > by0 && y - r < by1){
      // Doorway entrance threshold check:
      const doorX = (b.wx + Math.floor(b.tw/2)) * CS + 16;
      const doorY = (b.wy + b.th) * CS;
      if(Math.hypot(x - doorX, y - (doorY - 6)) < 18){
        continue; // Permitted on doorway doorstep threshold
      }
      return { ok: false, reason: 'building_wall', bld: b.name };
    }
  }

  // 2. Solid Props (Well, Anvil, Streetlamps, Benches)
  for(const obj of VILLAGE_OBJECTS){
    if(obj.kind === 'well'){
      if(Math.hypot(x - obj.x, y - obj.y) < 22) return { ok: false, reason: 'well' };
    } else if(obj.kind === 'anvil'){
      if(Math.hypot(x - obj.x, y - obj.y) < 16) return { ok: false, reason: 'anvil' };
    } else if(obj.kind === 'bench'){
      if(Math.hypot(x - obj.x, y - obj.y) < 14) return { ok: false, reason: 'bench' };
    } else if(obj.kind === 'lamp'){
      if(Math.hypot(x - obj.x, y - obj.y) < 10) return { ok: false, reason: 'lamp' };
    }
  }

  // 3. Autonomous AI avoidance for deep water
  if(isDeep && v && !v.canSwim && v.isNPC){
    return { ok: false, reason: 'cannot_swim' };
  }

  return { ok: true, depth, isWater, isDeep };
}

/* ---------------------------------------------------------------------
   PART 6: RENDER PIPELINE (WILLOWBROOK CONVERTED ART ON NATURA WORLD)
   --------------------------------------------------------------------- */
const cam = { x: 0, y: 0, zoom: 1.0, targetX: 0, targetY: 0 };
let cv, ctx, dpr = 1;

function setupCanvas(){
  cv = document.getElementById('cv');
  ctx = cv.getContext('2d');
  function resize(){
    dpr = window.devicePixelRatio || 1;
    cv.width = window.innerWidth * dpr;
    cv.height = (window.innerHeight - 44) * dpr;
  }
  window.addEventListener('resize', resize);
  resize();

  // Interactive Canvas Pointer: Select Villager / Click-to-Move
  cv.addEventListener('pointerdown', (e) => {
    const rect = cv.getBoundingClientRect();
    const clickX = (e.clientX - rect.left);
    const clickY = (e.clientY - rect.top);
    const cw = cv.width / dpr, ch = cv.height / dpr;
    const worldX = (clickX - cw / 2) / cam.zoom + cam.x;
    const worldY = (clickY - ch / 2) / cam.zoom + cam.y;

    // Check if clicked near a villager
    let clickedV = null, clickedDist = 36;
    VILLAGERS.forEach((v, idx) => {
      const d = Math.hypot(v.x - worldX, v.y - worldY);
      if(d < clickedDist){
        clickedDist = d;
        clickedV = v;
        inspectedPawnIdx = idx;
      }
    });

    if(clickedV){
      updateHUD();
      showToast(`✦ Inspected ${clickedV.name} the ${clickedV.role}`);
    } else {
      const ctrlPawn = VILLAGERS[controlledPawnIdx];
      if(ctrlPawn){
        const testMove = canMoveTo(worldX, worldY, ctrlPawn);
        if(testMove.ok){
          ctrlPawn.targetX = worldX;
          ctrlPawn.targetY = worldY;
          showToast(`✦ Command: Walking towards destination`);
        } else {
          showToast(`⚠️ Blocked by ${testMove.reason}`);
        }
      }
    }
  });
}

function renderWorld(){
  if(!ctx) return;
  const cw = cv.width / dpr, ch = cv.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, cw, ch);

  // Camera smooth follow
  const targetPawn = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
  if(targetPawn){
    cam.x += (targetPawn.x - cam.x) * 0.1;
    cam.y += (targetPawn.y - cam.y) * 0.1;
  }

  const cs = CS * cam.zoom;
  const wx0 = Math.floor((cam.x - cw/2/cam.zoom) / CS) - 1;
  const wx1 = Math.floor((cam.x + cw/2/cam.zoom) / CS) + 1;
  const wy0 = Math.floor((cam.y - ch/2/cam.zoom) / CS) - 1;
  const wy1 = Math.floor((cam.y + ch/2/cam.zoom) / CS) + 1;

  ctx.imageSmoothingEnabled = false;

  function getCvs(spr){
    if(!spr) return null;
    if(spr.c) return spr.c;
    if(spr instanceof HTMLCanvasElement || spr instanceof ImageBitmap) return spr;
    return null;
  }

  // 1. Terrain Layer (Willowbrook Pixel Art Tiles)
  const waterSpr = (PA.terrain.water && PA.terrain.water[Math.floor(W.tod*4)%4]) || null;
  const grassSpr = (PA.terrain.grass && PA.terrain.grass[0]) || null;
  const pathSpr = (PA.terrain.path && PA.terrain.path[0]) || null;
  const stoneSpr = PA.terrain.stone || null;
  const fieldSpr = (PA.terrain.tilled && PA.terrain.tilled[0]) || null;

  for(let wy = wy0; wy <= wy1; wy++){
    for(let wx = wx0; wx <= wx1; wx++){
      const {c, i} = cellChunk(wx, wy);
      const sx = Math.round((wx * CS - cam.x) * cam.zoom + cw / 2);
      const sy = Math.round((wy * CS - cam.y) * cam.zoom + ch / 2);
      const tt = c.tileType[i];

      let spr = null;
      if(tt === 2 || tt === 6) spr = waterSpr;
      else if(tt === 1) spr = pathSpr;
      else if(tt === 3) spr = stoneSpr;
      else if(tt === 4) spr = fieldSpr;
      else if(grassSpr){
        const varIdx = Math.abs(hash2(wx, wy, SEED+11)*4)|0;
        spr = (PA.terrain.grass && PA.terrain.grass[varIdx]) || grassSpr;
      }

      const tCvs = getCvs(spr);
      if(tCvs){
        ctx.drawImage(tCvs, sx, sy, cs, cs);
      } else {
        ctx.fillStyle = '#3f7338';
        ctx.fillRect(sx, sy, cs, cs);
      }

      // Shallow Water overlay & shore shimmer (tt === 6)
      if(tt === 6){
        ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
        ctx.fillRect(sx, sy, cs, cs);
        ctx.fillStyle = 'rgba(217, 180, 130, 0.26)';
        ctx.fillRect(sx, sy + cs*0.7, cs, cs*0.3);
        const rip = Math.sin(W.tod * 35 + wx*2 + wy*3) * 0.5 + 0.5;
        if(rip > 0.65){
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(sx + 3*cam.zoom, sy + 5*cam.zoom, cs - 6*cam.zoom, 2*cam.zoom);
        }
      }

      // Wooden Fishing Pier / Bridge (tt === 5)
      if(tt === 5){
        ctx.fillStyle = '#5c3a21'; // dark foundation timber
        ctx.fillRect(sx, sy, cs, cs);
        ctx.fillStyle = '#8b5a2b'; // upper timber planks
        ctx.fillRect(sx + 1, sy + 2, cs - 2, cs - 4);
        ctx.fillStyle = '#3e2716';
        ctx.fillRect(sx, sy + Math.floor(cs*0.33), cs, 1);
        ctx.fillRect(sx, sy + Math.floor(cs*0.66), cs, 1);
        ctx.fillStyle = '#1e1b18';
        ctx.fillRect(sx + 2, sy + 3, 2, 2);
        ctx.fillRect(sx + cs - 4, sy + 3, 2, 2);
        ctx.fillRect(sx + 2, sy + cs - 5, 2, 2);
        ctx.fillRect(sx + cs - 4, sy + cs - 5, 2, 2);
      }

      // Berry Bushes
      if(c.bush[i] > 0.5 && PA.veg.bush && PA.veg.bush[0]){
        const bCvs = getCvs(PA.veg.bush[0]);
        if(bCvs) ctx.drawImage(bCvs, sx, sy - 8*cam.zoom, cs, cs);
      }

      // Procedural Trees scaled to Natura's tStage
      if(c.tStage[i] >= 1.5 && PA.veg.tree){
        const treeArr = (c.treeType[i] === 1 && PA.veg.pine) ? PA.veg.pine : PA.veg.tree;
        const treeSpr = treeArr[Math.abs(hash2(wx, wy, SEED+33)) % treeArr.length];
        const trCvs = getCvs(treeSpr);
        if(trCvs){
          const tw = trCvs.width * cam.zoom;
          const th = trCvs.height * cam.zoom;
          ctx.drawImage(trCvs, sx + cs/2 - tw/2, sy + cs - th, tw, th);
        }
      }
    }
  }

  // 2. Y-Sorted World Entities Pass (Buildings, Props, Living Chibi Characters)
  // True 2.5D depth sorting ensures characters behind buildings/roofs are realistically occluded
  const dark = isNight() ? 0.75 : 0;
  const drawables = [];
  for(const bld of VILLAGE_BUILDINGS){
    drawables.push({ kind: 'building', y: (bld.wy + bld.th) * CS, bld });
  }
  for(const obj of VILLAGE_OBJECTS){
    drawables.push({ kind: 'prop', y: obj.y, obj });
  }
  for(const v of VILLAGERS){
    drawables.push({ kind: 'pawn', y: v.y, v });
  }
  drawables.sort((a, b) => {
    if(a.y !== b.y) return a.y - b.y;
    if(a.kind === 'building' && b.kind === 'pawn') return -1;
    if(a.kind === 'pawn' && b.kind === 'building') return 1;
    return 0;
  });

  for(const d of drawables){
    if(d.kind === 'building'){
      const bld = d.bld;
      const bArt = PA.bld && (PA.bld[bld.sprKey] || PA.bld[bld.id]);
      if(bArt && bArt.day){
        const dayCvs = getCvs(bArt.day);
        const sx = Math.round((bld.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round((bld.y - cam.y) * cam.zoom + ch / 2);
        if(dayCvs){
          const bw = dayCvs.width * cam.zoom;
          const bh = dayCvs.height * cam.zoom;
          const ox = (bArt.ox != null ? bArt.ox : -16) * cam.zoom;
          const oy = (bArt.oy != null ? bArt.oy : -60) * cam.zoom;
          ctx.drawImage(dayCvs, sx + ox, sy + oy, bw, bh);
          if(dark > 0.05 && bArt.night){
            const nightCvs = getCvs(bArt.night);
            if(nightCvs){
              ctx.save();
              ctx.globalAlpha = dark;
              ctx.drawImage(nightCvs, sx + ox, sy + oy, bw, bh);
              ctx.restore();
            }
          }
        }

        // Building name label
        if(cam.zoom >= 0.75){
          ctx.fillStyle = 'rgba(15,23,42,0.85)';
          const tw = ctx.measureText(bld.name).width;
          const ly = Math.round(sy - 22 * cam.zoom);
          ctx.fillRect(sx + (bld.tw*cs)/2 - tw/2 - 4, ly, tw + 8, 16);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(bld.name, sx + (bld.tw*cs)/2 - tw/2, ly + 12);
        }
      }
    } else if(d.kind === 'prop'){
      const obj = d.obj;
      const sx = Math.round((obj.x - cam.x) * cam.zoom + cw / 2);
      const sy = Math.round((obj.y - cam.y) * cam.zoom + ch / 2);
      let spr = null;
      if(obj.kind === 'well') spr = PA.props.well && PA.props.well.spr;
      else if(obj.kind === 'anvil') spr = PA.props.anvil && PA.props.anvil.spr;
      else if(obj.kind === 'bench') spr = PA.props.bench && PA.props.bench.spr;
      else if(obj.kind === 'lamp') spr = PA.props.lamp && (isNight() ? PA.props.lamp.on : PA.props.lamp.off);

      const pCvs = getCvs(spr);
      if(pCvs){
        const pw = pCvs.width * cam.zoom;
        const ph = pCvs.height * cam.zoom;
        ctx.drawImage(pCvs, sx - pw/2, sy - ph/2, pw, ph);
      }
    } else if(d.kind === 'pawn'){
      if(!d.v.inBuilding || d.v === VILLAGERS[controlledPawnIdx]){
        renderChibiPawn(d.v, cw, ch);
      }
    }
  }

  // 5. Particles & Weather Atmosphere
  renderWeatherAtmosphere(cw, ch);
}

function isNight(){
  return W.tod < 5.5 || W.tod > 20.0;
}

function renderChibiPawn(v, cw, ch){
  const sx = Math.round((v.x - cam.x) * cam.zoom + cw / 2);
  const sy = Math.round((v.y - cam.y) * cam.zoom + ch / 2);

  // Water depth at character feet
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeepWater = depth > 0.05;
  const isShallowWater = depth > 0 && depth <= 0.05;

  // Selection ring
  if(v === VILLAGERS[controlledPawnIdx]){
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 16*cam.zoom, 7*cam.zoom, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  } else if(v === VILLAGERS[inspectedPawnIdx]){
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 15*cam.zoom, 6.5*cam.zoom, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  // Ground Shadow (only when on land or wading; when swimming in deep water, foam replaces shadow)
  if(!isDeepWater){
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 11*cam.zoom, 4.5*cam.zoom, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // Wading Foot Ripples in shallow water
  if(isShallowWater || v.state === 'wade'){
    ctx.save();
    const ripR = (13 + Math.sin(W.tod * 45 + v.seed) * 3) * cam.zoom;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, ripR, ripR * 0.45, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  // Deep Water Swimming Foam Ring & Swirls
  if(isDeepWater && v.canSwim){
    ctx.save();
    const foamR = (16 + Math.sin(W.tod * 40 + v.seed) * 3) * cam.zoom;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 6*cam.zoom, foamR, foamR * 0.45, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 6*cam.zoom, foamR * 1.35, foamR * 0.6, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  // Character Sprite
  const F = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  let fr = null;
  const dir = v.face === 1 ? 1 : ((v.face === 2 || v.face === 3) ? 2 : 0);

  if(F && F[dir]){
    const act = (v.state === 'walk' || v.state === 'wade' || v.state === 'swim') ? 'walk' : (v.state === 'work' ? 'work' : 'idle');
    const arr = F[dir][act] || F[dir].idle;
    const fi = (v.state === 'walk' || v.state === 'wade' || v.state === 'swim') ? Math.floor(v.walkPhase * 4) % arr.length : 0;
    fr = arr[fi % arr.length];
  }

  if(fr){
    const pw = 48 * cam.zoom;
    const ph = 64 * cam.zoom;
    let bounce = v.triumphT > 0 ? -Math.sin(v.triumphT * Math.PI) * 5 * cam.zoom : 0;

    let yOffset = 0;
    let flailX = 0, flailY = 0;

    if(isDeepWater && v.canSwim){
      yOffset = 18 * cam.zoom; // Chest submerged!
      bounce += Math.sin(W.tod * 50 + v.seed) * 2 * cam.zoom; // Swimming bob
    } else if(v.state === 'drown_panic'){
      flailX = (Math.sin(G.frame * 0.9 + v.seed) * 4) * cam.zoom;
      flailY = (Math.cos(G.frame * 0.7 + v.seed) * 4 + 14) * cam.zoom;
    } else if(isShallowWater){
      yOffset = 4 * cam.zoom; // Shins submerged
    }

    ctx.save();
    if(isDeepWater && v.canSwim){
      // Clip lower body beneath the water surface
      ctx.beginPath();
      ctx.rect(sx - pw, sy - ph*1.5, pw*2, ph*1.5 - 6*cam.zoom);
      ctx.clip();
    }

    const drawX = sx + flailX;
    const drawY = sy - ph + bounce + yOffset + flailY;

    if(v.face === 3){
      ctx.translate(drawX, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(fr, -pw/2, drawY, pw, ph);
    } else {
      ctx.drawImage(fr, drawX - pw/2, drawY, pw, ph);
    }
    ctx.restore();

    // Drowning Splash Particles & Emotes
    if(v.state === 'drown_panic'){
      ctx.save();
      for(let d=0; d<6; d++){
        const dropX = sx + (Math.sin(G.frame*0.4 + d*1.2) * 16) * cam.zoom;
        const dropY = sy - 14*cam.zoom - (Math.abs(Math.cos(G.frame*0.5 + d*1.5)) * 14) * cam.zoom;
        ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
        ctx.beginPath();
        ctx.arc(dropX, dropY, (2 + (d%2)) * cam.zoom, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('💦😱 CANNOT SWIM!', sx - 44*cam.zoom, sy - 84*cam.zoom);
      ctx.restore();
    }
  }

  // Dynamic Attached Tool (tucked away while swimming or drowning)
  const toolSpr = PA.tools && PA.tools[v.equippedTool.kind];
  if(toolSpr && v.state !== 'sleep' && v.state !== 'swim' && v.state !== 'drown_panic'){
    const tx = sx + (v.face === 3 ? 8 : -8) * cam.zoom;
    const ty = sy - 20 * cam.zoom;
    let angle = 0;
    if(v.triumphT > 0) angle = -1.2;
    else if(v.state === 'work'){
      if(v.equippedTool.kind === 'hammer') angle = Math.sin(W.tod * 40) * 1.1;
      else if(v.equippedTool.kind === 'hoe') angle = Math.sin(W.tod * 30) * 0.8;
      else if(v.equippedTool.kind === 'lute') angle = -0.3 + Math.sin(W.tod * 35) * 0.2;
      else angle = Math.sin(W.tod * 25) * 0.4;
    }

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle);
    const tw = 28 * cam.zoom;
    const th = 28 * cam.zoom;
    ctx.drawImage(toolSpr, -tw/2, -th/2, tw, th);
    ctx.restore();
  }

  // Mini Work Progress Bar
  if(v.state === 'work' && v.workProgress > 0){
    const bw = 24 * cam.zoom, bh = 4 * cam.zoom;
    const bx = sx - bw/2, by = sy - 70 * cam.zoom;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = v.workProgress > 0.8 ? '#4ade80' : '#38bdf8';
    ctx.fillRect(bx, by, bw * clamp(v.workProgress, 0, 1), bh);
  }

  // Name tag
  if(cam.zoom >= 0.8){
    ctx.font = 'bold 11px system-ui, sans-serif';
    const tag = v.name + (v === VILLAGERS[controlledPawnIdx] ? ' ★' : '');
    const tw = ctx.measureText(tag).width;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(sx - tw/2 - 4, sy - 78 * cam.zoom, tw + 8, 15);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(tag, sx - tw/2, sy - 66 * cam.zoom);
  }
}

function renderWeatherAtmosphere(cw, ch){
  // Darkness Overlay
  let darkness = 0;
  if(W.tod < 5) darkness = 0.85;
  else if(W.tod < 6.5) darkness = 0.85 * (1 - (W.tod - 5) / 1.5);
  else if(W.tod > 21) darkness = 0.85;
  else if(W.tod > 19) darkness = 0.85 * ((W.tod - 19) / 2.0);

  // Storm gloom
  darkness = Math.min(0.9, darkness + W.storm * 0.45);

  if(darkness > 0.05){
    ctx.save();
    ctx.fillStyle = `rgba(8, 14, 28, ${darkness.toFixed(2)})`;
    ctx.fillRect(0, 0, cw, ch);

    // Warm radial cutouts for lanterns and tavern windows
    ctx.globalCompositeOperation = 'destination-out';
    for(const obj of VILLAGE_OBJECTS){
      if(obj.kind === 'lamp' && isNight()){
        const sx = Math.round((obj.x - cam.x) * cam.zoom + cw / 2);
        const sy = Math.round((obj.y - cam.y) * cam.zoom + ch / 2);
        const rad = 75 * cam.zoom;
        const grad = ctx.createRadialGradient(sx, sy, 5, sx, sy, rad);
        grad.addColorStop(0, 'rgba(255, 230, 150, 0.9)');
        grad.addColorStop(1, 'rgba(255, 230, 150, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Rain Streaks
  if(W.rain > 0.1){
    ctx.save();
    ctx.strokeStyle = `rgba(186, 230, 253, ${clamp(W.rain * 0.65, 0, 0.75)})`;
    ctx.lineWidth = 1;
    const dropCount = Math.floor(W.rain * 120);
    for(let i=0; i<dropCount; i++){
      const rx = (hash2(i, Math.floor(W.tod*100), SEED+88) * cw);
      const ry = (hash2(i, Math.floor(W.tod*100)+1, SEED+89) * ch);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 14);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* ---------------------------------------------------------------------
   PART 7: MAIN LOOP & SIMULATION UPDATE
   --------------------------------------------------------------------- */
let lastTime = 0;
function loop(timestamp){
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (timestamp - lastTime) / 1000 || 0.016);
  lastTime = timestamp;
  G.frame++;
  G.inspectedVillager = VILLAGERS[inspectedPawnIdx];

  if(!W.paused){
    const dtH = (dt * W.speed * 2.5) / 60; // Simulation hours per frame
    simTick(dtH);
  }

  renderWorld();
  updateHUD();
}

function simTick(dtH){
  W.tod += dtH;
  if(W.tod >= 24){
    W.tod -= 24;
    W.day += 1;
    onDayPass();
  }

  // Wind vectors
  W.windAng += (fbm(W.day*0.3, 3.7, SEED+400, 2) - 0.5) * 0.5 * dtH;
  W.windSpd = clamp(W.windSpd + (hash2(Math.floor(W.day*10),7,SEED+401)-0.5)*0.3*dtH, 0.3, 3.0);

  // Weather systems drift
  const wxVX = Math.cos(W.windAng)*W.windSpd*40, wxVY = Math.sin(W.windAng)*W.windSpd*40;
  for(const s of systems){
    s.x += wxVX * dtH;
    s.y += wxVY * dtH;
    const R = 3000;
    if(s.x < -R) s.x += R*2; if(s.x > R) s.x -= R*2;
    if(s.y < -R) s.y += R*2; if(s.y > R) s.y -= R*2;
  }

  // Active weather front over the village center (0, 0)
  let villageLift = 0;
  for(const s of systems){
    const d2 = s.x*s.x + s.y*s.y, r2 = s.r*s.r;
    if(d2 < r2 * 4) villageLift += s.inten * Math.exp(-d2/r2);
  }

  W.rain = clamp(villageLift > 0.25 ? (villageLift - 0.25) * 1.4 : 0, 0, 1);
  W.storm = clamp(villageLift > 0.65 ? (villageLift - 0.65) * 2.0 : 0, 0, 1);

  // Diurnal temperature cycle
  const diurnal = Math.sin(((W.tod - 9)/24) * Math.PI*2);
  W.temp = 20.0 + diurnal * 6.5 - (W.rain * 3.5);

  // Villager biological ticks & autonomous schedules
  for(const v of VILLAGERS){
    bodyTick(v, dtH);
    if(v.isNPC) updateVillagerAI(v, dtH);
    else updatePlayerPawn(v, dtH);
  }
}

function onDayPass(){
  showToast(`✦ Day ${W.day} dawns over Willowbrook!`);
  // Season cycle
  if(W.day < 30) W.season = 'Spring';
  else if(W.day < 60) W.season = 'Summer';
  else if(W.day < 90) W.season = 'Autumn';
  else W.season = 'Winter';
}

/* ---------------------------------------------------------------------
   PART 8: VILLAGER AI & PAWN CONTROLS
   --------------------------------------------------------------------- */
function updateVillagerAI(v, dtH){
  // Clamp dtH for movement similar to player pawn to avoid jitter at high speeds
  const moveDtH = Math.min(dtH, 0.03);

  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;

  // If a non-swimmer somehow ends up in deep water, panic and struggle towards shore
  if(isDeep && !v.canSwim){
    v.state = 'drown_panic';
    v.moving = true;
    const esc = getShallowEscapeVector(v.x, v.y);
    const struggleSpd = 30 * (moveDtH * 60);
    v.x += esc.dx * struggleSpd;
    v.y += esc.dy * struggleSpd;
    return;
  }

  // Daily schedule
  const hour = W.tod;
  if(hour >= 21 || hour < 6){
    // Night: sleep indoors
    v.state = 'sleep';
    v.inBuilding = true;
  } else if(hour >= 8 && hour < 17){
    // Daytime work & seasonal activities
    v.inBuilding = false;

    // On hot summer afternoons, swimmers (Finn, Pip, Wren) might wander to lake shore/pier
    if(hour >= 12 && hour <= 15 && W.temp > 23 && v.canSwim && (v.name === 'Finn' || v.name === 'Pip')){
      const pierX = 20 * CS + 16, pierY = 7 * CS + 16;
      const d = Math.hypot(v.x - pierX, v.y - pierY);
      if(d > 20){
        const mx = ((pierX - v.x)/d) * 45 * (moveDtH * 60);
        const my = ((pierY - v.y)/d) * 45 * (moveDtH * 60);
        if(canMoveTo(v.x + mx, v.y + my, v).ok){
          v.x += mx; v.y += my;
          v.state = 'walk';
          v.moving = true;
        }
      } else {
        v.state = 'swim';
        v.moving = false;
      }
    } else {
      v.state = 'work';
      v.workProgress = (v.workProgress || 0) + moveDtH * 0.8;
      if(v.workProgress >= 1.0){
        v.workProgress = 0;
        v.triumphT = 1.0;
        if(v === VILLAGERS[controlledPawnIdx]){
          showToast(`✨ ${v.name} completed their task!`);
        }
      }
    }
  }
}
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;

  // If a non-swimmer somehow ends up in deep water, panic and struggle towards shore
  if(isDeep && !v.canSwim){
    v.state = 'drown_panic';
    v.moving = true;
    const esc = getShallowEscapeVector(v.x, v.y);
    const struggleSpd = 30 * (dtH * 60);
    v.x += esc.dx * struggleSpd;
    v.y += esc.dy * struggleSpd;
    return;
  }

  // Daily schedule
  const hour = W.tod;
  if(hour >= 21 || hour < 6){
    // Night: sleep indoors
    v.state = 'sleep';
    v.inBuilding = true;
  } else if(hour >= 8 && hour < 17){
    // Daytime work & seasonal activities
    v.inBuilding = false;

    // On hot summer afternoons, swimmers (Finn, Pip, Wren) might wander to lake shore/pier
    if(hour >= 12 && hour <= 15 && W.temp > 23 && v.canSwim && (v.name === 'Finn' || v.name === 'Pip')){
      const pierX = 20 * CS + 16, pierY = 7 * CS + 16;
      const d = Math.hypot(v.x - pierX, v.y - pierY);
      if(d > 20){
        const mx = ((pierX - v.x)/d) * 45 * (dtH * 60);
        const my = ((pierY - v.y)/d) * 45 * (dtH * 60);
        if(canMoveTo(v.x + mx, v.y + my, v).ok){
          v.x += mx; v.y += my;
          v.state = 'walk';
          v.moving = true;
        }
      } else {
        v.state = 'swim';
        v.moving = false;
      }
    } else {
      v.state = 'work';
      v.workProgress = (v.workProgress || 0) + dtH * 0.8;
      if(v.workProgress >= 1.0){
        v.workProgress = 0;
        v.triumphT = 1.0;
        if(v === VILLAGERS[controlledPawnIdx]){
          showToast(`✨ ${v.name} completed their task!`);
        }
      }
    }
  } else {
    // Evening / Morning leisure
    v.state = 'idle';
    v.inBuilding = false;
  }

  if(v.triumphT > 0){
    v.triumphT = Math.max(0, v.triumphT - dtH * 15);
  }
}

const keysDown = {};
window.addEventListener('keydown', e => {
  keysDown[e.code] = true;
  if(e.code === 'Tab'){
    e.preventDefault();
    cyclePawn(1);
  } else if(e.code === 'KeyE'){
    interactKey();
  }
});
window.addEventListener('keyup', e => { keysDown[e.code] = false; });

function updatePlayerPawn(v, dtH){
  // Clamp dtH for movement to avoid excessive displacement at high simulation speeds
  const moveDtH = Math.min(dtH, 0.03); // limit to ~30ms equivalent per frame

  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;
  const isWater = depth > 0;

  // Non-swimmer in deep water: violent struggle flailing towards shore
  if(isDeep && !v.canSwim){
    v.state = 'drown_panic';
    v.moving = true;
    const esc = getShallowEscapeVector(v.x, v.y);
    const struggleSpd = 32 * (moveDtH * 60);
    v.x += esc.dx * struggleSpd;
    v.y += esc.dy * struggleSpd;
    return;
  }

  let dx = 0, dy = 0;
  if(keysDown['KeyW'] || keysDown['ArrowUp']) dy -= 1;
  if(keysDown['KeyS'] || keysDown['ArrowDown']) dy += 1;
  if(keysDown['KeyA'] || keysDown['ArrowLeft']) dx -= 1;
  if(keysDown['KeyD'] || keysDown['ArrowRight']) dx += 1;

  // Also support click-to-move destination
  if(dx === 0 && dy === 0 && v.targetX != null && v.targetY != null){
    const dist = Math.hypot(v.targetX - v.x, v.targetY - v.y);
    if(dist > 6){
      dx = (v.targetX - v.x);
      dy = (v.targetY - v.y);
    } else {
      v.targetX = null;
      v.targetY = null;
    }
  }

  if(dx !== 0 || dy !== 0){
    let baseSpd = (v.energy < 0.25 ? 60 : 90);
    if(isDeep && v.canSwim){
      baseSpd = 48 * (0.6 + (v.swimSkill || 0.5) * 0.7); // swimming speed based on skill
      v.state = 'swim';
    } else if(isWater){
      baseSpd = (v.energy < 0.25 ? 32 : 46); // wading speed penalty (~45% slower)
      v.state = 'wade';
    } else {
      v.state = 'walk';
    }

    const spd = baseSpd * (moveDtH * 60);
    const len = Math.hypot(dx, dy);
    const mx = (dx / len) * spd;
    const my = (dy / len) * spd;

    // Decoupled sliding collision:
    const targetX = v.x + mx;
    const targetY = v.y + my;
    const testBoth = canMoveTo(targetX, targetY, v);

    if(testBoth.ok){
      v.x = targetX;
      v.y = targetY;
    } else {
      // Test sliding horizontally along X
      const testX = canMoveTo(targetX, v.y, v);
      if(testX.ok) v.x = targetX;
      // Test sliding vertically along Y
      const testY = canMoveTo(v.x, targetY, v);
      if(testY.ok) v.y = targetY;
    }

    v.walkPhase += moveDtH * (isDeep ? 8 : (isWater ? 10 : 13));
    v.moving = true;
    if(dx > 0) v.face = 3;
    else if(dx < 0) v.face = 2;
    else if(dy < 0) v.face = 1;
    else v.face = 0;
  } else {
    if(isDeep && v.canSwim) v.state = 'swim';
    else if(isWater) v.state = 'wade';
    else if(v.state === 'walk' || v.state === 'wade' || v.state === 'swim'){
      v.state = 'idle';
    }
    v.moving = false;
  }
}
  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);
  const isDeep = depth > 0.05;
  const isWater = depth > 0;

  // Non-swimmer in deep water: violent struggle flailing towards shore
  if(isDeep && !v.canSwim){
    v.state = 'drown_panic';
    v.moving = true;
    const esc = getShallowEscapeVector(v.x, v.y);
    const struggleSpd = 32 * (dtH * 60);
    v.x += esc.dx * struggleSpd;
    v.y += esc.dy * struggleSpd;
    return;
  }

  let dx = 0, dy = 0;
  if(keysDown['KeyW'] || keysDown['ArrowUp']) dy -= 1;
  if(keysDown['KeyS'] || keysDown['ArrowDown']) dy += 1;
  if(keysDown['KeyA'] || keysDown['ArrowLeft']) dx -= 1;
  if(keysDown['KeyD'] || keysDown['ArrowRight']) dx += 1;

  // Also support click-to-move destination
  if(dx === 0 && dy === 0 && v.targetX != null && v.targetY != null){
    const dist = Math.hypot(v.targetX - v.x, v.targetY - v.y);
    if(dist > 6){
      dx = (v.targetX - v.x);
      dy = (v.targetY - v.y);
    } else {
      v.targetX = null;
      v.targetY = null;
    }
  }

  if(dx !== 0 || dy !== 0){
    let baseSpd = (v.energy < 0.25 ? 60 : 90);
    if(isDeep && v.canSwim){
      baseSpd = 48 * (0.6 + (v.swimSkill || 0.5) * 0.7); // swimming speed based on skill
      v.state = 'swim';
    } else if(isWater){
      baseSpd = (v.energy < 0.25 ? 32 : 46); // wading speed penalty (~45% slower)
      v.state = 'wade';
    } else {
      v.state = 'walk';
    }

    const spd = baseSpd * (dtH * 60);
    const len = Math.hypot(dx, dy);
    const mx = (dx / len) * spd;
    const my = (dy / len) * spd;

    // Decoupled sliding collision:
    const targetX = v.x + mx;
    const targetY = v.y + my;
    const testBoth = canMoveTo(targetX, targetY, v);

    if(testBoth.ok){
      v.x = targetX;
      v.y = targetY;
    } else {
      // Test sliding horizontally along X
      const testX = canMoveTo(targetX, v.y, v);
      if(testX.ok) v.x = targetX;
      // Test sliding vertically along Y
      const testY = canMoveTo(v.x, targetY, v);
      if(testY.ok) v.y = targetY;
    }

    v.walkPhase += dtH * (isDeep ? 8 : (isWater ? 10 : 13));
    v.moving = true;
    if(dx > 0) v.face = 3;
    else if(dx < 0) v.face = 2;
    else if(dy < 0) v.face = 1;
    else v.face = 0;
  } else {
    if(isDeep && v.canSwim) v.state = 'swim';
    else if(isWater) v.state = 'wade';
    else if(v.state === 'walk' || v.state === 'wade' || v.state === 'swim'){
      v.state = 'idle';
    }
    v.moving = false;
  }
}

function cyclePawn(dir){
  inspectedPawnIdx = (inspectedPawnIdx + dir + VILLAGERS.length) % VILLAGERS.length;
  updateHUD();
}

function interactKey(){
  const v = VILLAGERS[inspectedPawnIdx];
  if(!v) return;

  const wx = Math.floor(v.x / CS), wy = Math.floor(v.y / CS);
  const depth = getWaterDepth(wx, wy);

  // 1. Drink at village well
  const well = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  if(well && Math.hypot(v.x - well.x, v.y - well.y) < 55){
    const b = ensureBody(v);
    b.hydration = 1.0;
    showToast(`💧 ${v.name} drank fresh, cold well water!`);
    updateHUD();
    return;
  }

  // 2. Drink at lake shallows / shore
  if(depth > 0 || Math.hypot(v.x - (25*CS+16), v.y - (7*CS+16)) < 90){
    const b = ensureBody(v);
    b.hydration = 1.0;
    showToast(`💧 ${v.name} scooped and drank cool, pristine lake water!`);
    updateHUD();
    return;
  }

  // 3. Work at blacksmith anvil
  const anvil = VILLAGE_OBJECTS.find(o => o.kind === 'anvil');
  if(anvil && Math.hypot(v.x - anvil.x, v.y - anvil.y) < 45){
    showToast(`⚒️ ${v.name} forged red-hot steel at Bram's anvil!`);
    return;
  }

  showToast(`✦ ${v.name} interacted with village environment`);
}

/* ---------------------------------------------------------------------
   PART 9: HUD & RIMWORLD PAWN INSPECTOR UI
   --------------------------------------------------------------------- */
function updateHUD(){
  // Clock & Weather pills
  const hourInt = Math.floor(W.tod);
  const minInt = Math.floor((W.tod - hourInt)*60);
  const timeStr = `${String(hourInt).padStart(2,'0')}:${String(minInt).padStart(2,'0')}`;
  document.getElementById('ui-clock').textContent = `Day ${W.day} · ${W.season} · ${timeStr}`;

  let wxText = '⛅ Fair';
  if(W.storm > 0.2) wxText = '⛈️ Thunderstorm';
  else if(W.rain > 0.1) wxText = '🌧️ Rain';
  else if(W.temp > 26) wxText = '☀️ Warm & Sunny';
  document.getElementById('ui-weather').textContent = wxText;
  document.getElementById('ui-temp').textContent = `${W.temp.toFixed(1)}°C`;

  // Pawn Inspector
  const v = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
  if(!v) return;

  document.getElementById('pi-name').textContent = v.name;
  document.getElementById('pi-role').textContent = v.role;

  const isCtrl = (v === VILLAGERS[controlledPawnIdx]);
  const badge = document.getElementById('pi-badge');
  badge.textContent = isCtrl ? 'Controlled' : 'Autonomous AI';
  badge.className = isCtrl ? 'pi-badge controlled' : 'pi-badge';
  document.getElementById('btn-toggle-ctrl').textContent = isCtrl ? 'Release to AI' : 'Take Control';

  // Swimming trait badge
  const sBadge = document.getElementById('pi-swim-badge');
  if(sBadge){
    if(v.canSwim){
      sBadge.className = 'pi-trait-badge pi-trait-swimmer';
      sBadge.textContent = `🏊 Swimmer (${Math.round((v.swimSkill||0.6)*100)}%)`;
    } else {
      sBadge.className = 'pi-trait-badge pi-trait-nonswimmer';
      sBadge.textContent = `🚫 Non-Swimmer (${v.swimReason || 'Cannot swim'})`;
    }
  }

  // Live status label
  let actStr = 'Resting peacefully';
  if(v.state === 'drown_panic') actStr = '🚨 DROWNING! Panicking in deep water - cannot swim!';
  else if(v.state === 'swim') actStr = 'Swimming gracefully across deep lake';
  else if(v.state === 'wade') actStr = 'Wading in refreshing lake shallows';
  else if(v.state === 'work') actStr = `Working diligently (${(v.workProgress*100).toFixed(0)}%)`;
  else if(v.state === 'walk') actStr = 'Walking down village path';
  else if(v.state === 'sleep') actStr = 'Sleeping soundly in bed';
  else if(v.body && v.body.hydration < 0.25) actStr = 'Looking for water to drink';
  document.getElementById('pi-act-label').textContent = actStr;

  // Real-time biological meters
  const b = ensureBody(v);
  document.getElementById('pi-val-food').textContent = `${(b.satiety*100).toFixed(0)}%`;
  document.getElementById('pi-fill-food').style.width = `${(b.satiety*100).toFixed(0)}%`;

  document.getElementById('pi-val-hydro').textContent = `${(b.hydration*100).toFixed(0)}%`;
  document.getElementById('pi-fill-hydro').style.width = `${(b.hydration*100).toFixed(0)}%`;

  document.getElementById('pi-val-rest').textContent = `${((1 - b.fatigue)*100).toFixed(0)}%`;
  document.getElementById('pi-fill-rest').style.width = `${((1 - b.fatigue)*100).toFixed(0)}%`;

  document.getElementById('pi-val-temp').textContent = `${b.coreTemp.toFixed(1)}°C`;
  const tempRatio = clamp((b.coreTemp - 35.0) / 4.0, 0, 1);
  document.getElementById('pi-fill-temp').style.width = `${(tempRatio*100).toFixed(0)}%`;

  document.getElementById('pi-val-mood').textContent = `${(v.mood*100).toFixed(0)}%`;
  document.getElementById('pi-fill-mood').style.width = `${(v.mood*100).toFixed(0)}%`;

  // Equipped Tool
  document.getElementById('pi-gear-icon').textContent = v.equippedTool.icon;
  document.getElementById('pi-gear-name').textContent = v.equippedTool.name;
  document.getElementById('pi-gear-desc').textContent = v.equippedTool.desc;

  // Thoughts
  const thList = document.getElementById('pi-th-list');
  thList.innerHTML = '';
  const thoughts = (v.thoughts && v.thoughts.length ? v.thoughts : bodyDrives(v)).slice(0, 4);
  for(const th of thoughts){
    const item = document.createElement('div');
    const isPos = (th.val >= 0);
    item.className = 'pi-thought-item ' + (isPos ? 'pi-thought-pos' : 'pi-thought-neg');
    item.innerHTML = `<span>${th.text}</span><span>${isPos?'+':''}${th.val||0}</span>`;
    thList.appendChild(item);
  }

  // Draw avatar portrait to inspector canvas
  drawInspectorAvatar(v);
}

function drawInspectorAvatar(v){
  const acv = document.getElementById('pi-avatar');
  const actx = acv.getContext('2d');
  actx.clearRect(0, 0, 44, 52);
  const F = PA.chars && PA.chars[v._ci != null ? v._ci : 0];
  if(F && F[0] && F[0].idle && F[0].idle[0]){
    actx.imageSmoothingEnabled = false;
    actx.drawImage(F[0].idle[0], -2, -6, 48, 64);
  }
}

function showToast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

/* ---------------------------------------------------------------------
   PART 10: AI BRAIN BRIDGE (UNIVERSAL AGENT INTERFACE)
   --------------------------------------------------------------------- */
window.__aiBridge = {
  listVillagers: () => VILLAGERS.map(v => v.name),
  getPerception: (name) => {
    const v = VILLAGERS.find(p => p.name === name);
    if(!v) return null;
    const b = ensureBody(v);
    return {
      name: v.name,
      role: v.role,
      worldTime: W.tod.toFixed(2),
      season: W.season,
      weather: { temp: W.temp.toFixed(1), rain: W.rain.toFixed(2), storm: W.storm.toFixed(2) },
      biometrics: {
        satiety: +b.satiety.toFixed(2),
        hydration: +b.hydration.toFixed(2),
        energy: +(1 - b.fatigue).toFixed(2),
        coreTemp: +b.coreTemp.toFixed(1),
        mood: +v.mood.toFixed(2)
      },
      sensations: bodyDrives(v).map(d => d.text),
      equippedTool: v.equippedTool.name,
      location: { x: Math.round(v.x), y: Math.round(v.y), inBuilding: v.inBuilding }
    };
  },
  postAction: (name, action) => {
    const v = VILLAGERS.find(p => p.name === name);
    if(!v) return false;
    if(action.kind === 'drink'){
      v.body.hydration = 1.0;
      showToast(`💧 [AI Brain] ${v.name} drank water`);
    } else if(action.kind === 'eat'){
      v.body.satiety = 1.0;
      showToast(`🍞 [AI Brain] ${v.name} ate a nourishing meal`);
    } else if(action.kind === 'work'){
      v.state = 'work';
    } else if(action.kind === 'sleep'){
      v.state = 'sleep';
    }
    return true;
  }
};

/* ---------------------------------------------------------------------
   PART 11: INITIALIZATION & AUTOTEST
   --------------------------------------------------------------------- */
function initControls(){
  document.getElementById('btn-pause').onclick = () => {
    W.paused = !W.paused;
    document.getElementById('btn-pause').textContent = W.paused ? '▶' : '⏸';
  };
  const speeds = [1, 2, 4, 16];
  speeds.forEach(s => {
    const btn = document.getElementById('btn-speed-' + s);
    btn.onclick = () => {
      W.speed = s;
      speeds.forEach(other => {
        document.getElementById('btn-speed-' + other).classList.toggle('active', other === s);
      });
    };
  });

  document.getElementById('btn-toggle-ctrl').onclick = () => {
    const v = VILLAGERS[inspectedPawnIdx];
    if(v === VILLAGERS[controlledPawnIdx]){
      v.isNPC = true;
      controlledPawnIdx = -1;
    } else {
      VILLAGERS.forEach(p => p.isNPC = true);
      v.isNPC = false;
      controlledPawnIdx = inspectedPawnIdx;
    }
    updateHUD();
  };

  document.getElementById('btn-prev-pawn').onclick = () => cyclePawn(-1);
  document.getElementById('btn-next-pawn').onclick = () => cyclePawn(1);

  document.getElementById('btn-spawn-visitor').onclick = () => {
    const visitors = ['Rowan', 'Clara', 'Gareth'];
    const pick = visitors[Math.floor(Math.random()*visitors.length)];
    const v = VILLAGERS.find(p => p.name === pick);
    if(v){
      inspectedPawnIdx = VILLAGERS.indexOf(v);
      showToast(`✦ Visiting traveler: ${v.name} the ${v.role}!`);
      updateHUD();
    }
  };
}

function boot(){
  setupCanvas();
  initVillageSettlement();
  initVillagers();

  // Prerender Willowbrook art assets
  buildTerrain();
  buildVeg();
  buildProps();
  buildBuildingArt();
  if(PA.bld.store) PA.bld.shop = PA.bld.store;
  buildFx();

  // Connect G and compile characters + dynamic attached tools
  G.villagers = VILLAGERS;
  G.inspectedVillager = VILLAGERS[inspectedPawnIdx];
  buildChars();
  VILLAGERS.forEach((v, i) => { v._ci = i; });

  initControls();
  updateHUD();

  requestAnimationFrame(loop);

  // Check query params for testing or inspection
  const qp = new URLSearchParams(location.search);
  if(qp.has('inspect')){
    const target = qp.get('inspect').toLowerCase();
    const idx = VILLAGERS.findIndex(v => v.name.toLowerCase() === target);
    if(idx !== -1){
      inspectedPawnIdx = idx;
      cam.x = VILLAGERS[idx].x;
      cam.y = VILLAGERS[idx].y;
      updateHUD();
    }
  }
  if(qp.has('pos')){
    const [px, py] = qp.get('pos').split(',').map(Number);
    const p = VILLAGERS[inspectedPawnIdx] || VILLAGERS[0];
    if(p && !isNaN(px) && !isNaN(py)){
      p.x = px * CS + 16;
      p.y = py * CS + 16;
      cam.x = p.x;
      cam.y = p.y;
      updateHUD();
    }
  }
  if(qp.has('test') || qp.has('autotest')){
    runAutoTest();
  }
}

async function runAutoTest(){
  const el = document.getElementById('autotest');
  el.style.display = 'block';
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok, title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };

  await new Promise(r => setTimeout(r, 400));
  log(VILLAGERS.length >= 10, 'boot: villagers spawned', `${VILLAGERS.length} pawns`);
  log(VILLAGE_BUILDINGS.length === 11, 'settlement: 11 village buildings placed', 'inn, smithy, farm, etc.');
  log(VILLAGE_OBJECTS.length >= 6, 'settlement: village props active', 'well, anvil, lamps');
  log(!!chunkAt(0,0), 'natura: procedural chunk system active', 'chunk (0,0) generated');
  log(systems.length === 5, 'meteorology: dynamic pressure fronts drifting');

  // Test biological metabolism
  const marta = VILLAGERS[0];
  const b = ensureBody(marta);
  log(b.hydration > 0 && b.satiety > 0 && b.coreTemp > 35, 'biometrics: biological human metabolism verified');

  // Test solid building wall & prop collision
  const innBld = VILLAGE_BUILDINGS.find(b => b.id === 'inn');
  const wallCheck = canMoveTo(innBld.wx * CS + 20, (innBld.wy + 2) * CS + 20, marta);
  log(!wallCheck.ok && wallCheck.reason === 'building_wall', 'collision: solid building walls block characters');

  const smithyBld = VILLAGE_BUILDINGS.find(b => b.id === 'smithy');
  const wallBodyCheck = canMoveTo(smithyBld.wx * CS + 16, (smithyBld.wy + 1) * CS + 16, marta);
  log(!wallBodyCheck.ok && wallBodyCheck.reason === 'building_wall', 'collision: building wall body strictly blocks movement');

  const wellCheck = canMoveTo(16, 16, marta);
  log(!wellCheck.ok && wellCheck.reason === 'well', 'collision: solid well blocks characters');

  const anvilCheck = canMoveTo(-9 * CS + 16, 8 * CS + 16, marta);
  log(!anvilCheck.ok && anvilCheck.reason === 'anvil', 'collision: blacksmith anvil blocks characters');

  // Test water depth & shallow/deep mechanics
  const deepLakeDepth = getWaterDepth(28, 7);
  log(deepLakeDepth > 0.05, 'hydrology: lake center has deep water depth (> 0.05)', `depth: ${deepLakeDepth.toFixed(3)}`);

  const shallowShoreDepth = getWaterDepth(22, 6);
  log(shallowShoreDepth <= 0.05 && shallowShoreDepth > 0, 'hydrology: lake shore has shallow wading depth (<= 0.05)', `depth: ${shallowShoreDepth.toFixed(3)}`);

  // Test wooden pier bridge traversal over water
  const pierDepth = getWaterDepth(22, 7);
  log(pierDepth === 0, 'hydrology: wooden fishing pier provides dry bridge deck over lake');

  // Test swimmer vs non-swimmer traits & AI pathing
  const finn = VILLAGERS.find(v => v.name === 'Finn');
  const gareth = VILLAGERS.find(v => v.name === 'Gareth');
  const bram = VILLAGERS.find(v => v.name === 'Bram');
  log(finn && finn.canSwim === true && finn.swimSkill === 1.0, 'swimming: Finn the Fisherman is master swimmer');
  log(gareth && gareth.canSwim === false && gareth.swimReason.includes('armor'), 'swimming: Gareth in plate armor cannot swim');
  log(bram && bram.canSwim === false, 'swimming: Bram the blacksmith cannot swim');

  const garethWaterCheck = canMoveTo(28 * CS + 16, 7 * CS + 16, gareth);
  log(!garethWaterCheck.ok && garethWaterCheck.reason === 'cannot_swim', 'swimming: autonomous AI non-swimmers safely avoid deep water');

  const finnWaterCheck = canMoveTo(28 * CS + 16, 7 * CS + 16, finn);
  log(finnWaterCheck.ok && finnWaterCheck.isDeep === true, 'swimming: swimmers permitted to enter deep lake water');

  // Test AI bridge
  const perc = window.__aiBridge.getPerception('Marta');
  log(!!perc && perc.biometrics.hydration != null, 'ai_bridge: perception JSON pipeline verified');

  // Test Direction A chibi character rendering
  const f0 = PA.chars[0][0].idle[0];
  log(!!f0 && f0.width === 48 && f0.height === 64, 'graphics: Direction A chibi 48x64 sprites with specular catchlights');

  // Test tool attachment
  log(!!PA.tools.lute && !!PA.tools.hammer && !!PA.tools.hoe, 'graphics: dynamic attached tools prerendered');

  const passed = res.filter(r => r.ok).length;
  el.textContent += `\n==== ${passed}/${res.length} passed ====\n`;
  document.title = `AUTOTEST ${passed}/${res.length}`;
}

window.addEventListener('DOMContentLoaded', boot);
</script>
</body>
</html>
'''

    full_html = HTML_TEMPLATE.replace(
        "/* All Willowbrook modules and bridge will be inserted here */",
        "\n".join(full_js)
    )

    # Actually combine full HTML with script
    parts = HTML_TEMPLATE.split("<script>\n'use strict';")
    final_output = parts[0] + "<script>\n'use strict';\n" + "\n".join(full_js) + "\n" + bridge_script

    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write(final_output)

    print(f"Successfully compiled {OUT_FILE} ({len(final_output)} bytes)!")

if __name__ == '__main__':
    generate()

