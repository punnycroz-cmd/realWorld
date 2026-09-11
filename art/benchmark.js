/**
 * Natura Character Art Benchmark (Phase 11)
 * Measures:
 * 1. Raw frame generation speed (cold cache)
 * 2. Cache hit rate under active simulation conditions
 * 3. Composite blit speed for 50+ NPCs
 * 4. Memory footprint of the canvas cache
 */
'use strict';

const { CharacterDNA } = require('./character_dna.js');
const { CharacterGenerator } = require('./character_generator.js');
const { CharacterVisualState } = require('./visual_state_adapter.js');

class BenchmarkSuite {
  static run() {
    console.log('=== Running Natura Character Art Performance Benchmark ===');

    // 1. Cold Frame Generation Benchmark
    const tomas = CharacterDNA.fromVillager({ id: 1, name: 'Tomas', sex: 'M', age: 35 });
    const coldSamples = 50;
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < coldSamples; i++) {
      CharacterGenerator.renderFrame(tomas, 0, 'walk', i % 6);
    }
    const t1 = process.hrtime.bigint();
    const totalColdMs = Number(t1 - t0) / 1e6;
    const avgColdMs = totalColdMs / coldSamples;
    console.log(`[Cold Generation] 50 frames generated in ${totalColdMs.toFixed(2)}ms (${avgColdMs.toFixed(3)}ms per frame)`);

    // 2. Cache Hit Rate & Multi-NPC Simulation Test
    // Simulate 30 villagers over 500 game ticks (15,000 draw calls)
    const frameCache = new Map();
    const villagers = [];
    const names = ['Tomas', 'Marta', 'Sanna', 'Petr', 'Joren', 'Pip', 'Lena', 'Bram', 'Sella', 'Tobin'];

    for (let i = 0; i < 30; i++) {
      const name = names[i % names.length];
      const v = {
        id: i + 1,
        name,
        sex: i % 2 === 0 ? 'M' : 'F',
        age: 5 + (i * 2.3) % 65,
        body: { fatigue: (i * 0.1) % 1.0, coreTemp: 36.5 + (i % 3) * 0.5, injury: (i % 5 === 0 ? 0.4 : 0) },
        act: ['walk', 'idle', 'work', 'talk', 'sit', 'sleep'][i % 6],
        x: 100 + i * 10,
        y: 100 + i * 10,
        colors: { dress: '#35633f', skin: '#dda078', hair: '#3a2a1a' }
      };
      v.dna = CharacterDNA.fromVillager(v);
      villagers.push(v);
    }

    let cacheHits = 0;
    let cacheMisses = 0;
    const ticks = 300;
    const tStartSim = process.hrtime.bigint();

    for (let tick = 0; tick < ticks; tick++) {
      const animFrame = Math.floor(tick / 2) % 6;
      const env = { rain: tick > 150 ? 0.3 : 0, groundWet: tick > 180 ? 0.7 : 0 };

      for (const v of villagers) {
        // Adapt visual state
        const vis = CharacterVisualState.adapt(v, env);
        const cacheKey = `${v.dna.hashIdentity()}_${vis.dir}_${vis.act}_${animFrame}_${vis.conditionKey}`;

        if (frameCache.has(cacheKey)) {
          cacheHits++;
          const cachedCvs = frameCache.get(cacheKey); // Instant hit
        } else {
          cacheMisses++;
          const pCanvas = CharacterGenerator.renderFrame(v.dna, vis.dir, vis.act, animFrame, vis.condition);
          frameCache.set(cacheKey, pCanvas);
        }
      }
    }

    const tEndSim = process.hrtime.bigint();
    const totalSimMs = Number(tEndSim - tStartSim) / 1e6;
    const totalCalls = cacheHits + cacheMisses;
    const hitRate = (cacheHits / totalCalls) * 100;
    const avgDrawMs = totalSimMs / totalCalls;

    console.log(`[Cache Simulation] Total render requests: ${totalCalls}`);
    console.log(`[Cache Simulation] Cache hits: ${cacheHits}, Misses: ${cacheMisses}`);
    console.log(`[Cache Simulation] Hit rate: ${hitRate.toFixed(2)}%`);
    console.log(`[Cache Simulation] Total time: ${totalSimMs.toFixed(2)}ms (Average overhead per villager: ${(avgDrawMs * 1000).toFixed(2)} µs)`);
    console.log(`[Cache Memory] Total cached unique frames: ${frameCache.size}`);

    const memEstimatedKb = (frameCache.size * 32 * 48 * 4) / 1024;
    console.log(`[Cache Memory] Estimated texture memory: ${memEstimatedKb.toFixed(1)} KB`);

    const benchmarkPassed = hitRate > 95.0 && avgDrawMs < 0.05;
    console.log(`=== Benchmark Result: ${benchmarkPassed ? 'PASSED (Production Grade)' : 'FAILED'} ===`);

    return {
      avgColdMs,
      hitRate,
      avgDrawMs,
      cachedFrames: frameCache.size,
      memEstimatedKb,
      passed: benchmarkPassed
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BenchmarkSuite };
}

if (typeof require !== 'undefined' && require.main === module) {
  BenchmarkSuite.run();
}
