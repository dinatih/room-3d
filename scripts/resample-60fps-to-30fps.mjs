import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);

function findGlbs(dir, list = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      findGlbs(full, list);
    } else if (full.endsWith('.glb')) {
      list.push(full);
    }
  }
  return list;
}

const animFiles = findGlbs('public/animations');
console.log(`Scanning ${animFiles.length} animation files for ~60 FPS keyframes...`);

let processedCount = 0;
let totalBytesSaved = 0;

for (const filePath of animFiles) {
  try {
    const statBefore = fs.statSync(filePath);
    const doc = await io.read(filePath);
    const anims = doc.getRoot().listAnimations();
    if (anims.length === 0) continue;

    let is60Fps = false;

    // Check if any sampler is ~60 FPS (dt <= 0.02)
    for (const anim of anims) {
      for (const sampler of anim.listSamplers()) {
        const input = sampler.getInput();
        if (!input) continue;
        const times = input.getArray();
        if (times && times.length > 5) {
          let sumDt = 0;
          let count = 0;
          for (let i = 1; i < Math.min(times.length, 20); i++) {
            const dt = times[i] - times[i - 1];
            if (dt > 0.001) {
              sumDt += dt;
              count++;
            }
          }
          if (count > 0 && (sumDt / count) <= 0.022) { // 1/45s = 0.022s -> covers 50-60fps
            is60Fps = true;
            break;
          }
        }
      }
      if (is60Fps) break;
    }

    if (!is60Fps) continue;

    // Resample all animations in this doc from 60fps to 30fps
    const resampledInputs = new Map();
    const resampledOutputs = new Map();

    for (const anim of anims) {
      for (const sampler of anim.listSamplers()) {
        const inputAccessor = sampler.getInput();
        const outputAccessor = sampler.getOutput();
        if (!inputAccessor || !outputAccessor) continue;

        const times = inputAccessor.getArray();
        const values = outputAccessor.getArray();
        if (!times || !values || times.length <= 4) continue;

        const elementSize = values.length / times.length;
        if (!Number.isInteger(elementSize)) continue;

        // Subsample every 2nd frame, always preserving the last frame
        const indices = [];
        for (let i = 0; i < times.length; i += 2) {
          indices.push(i);
        }
        if (indices[indices.length - 1] !== times.length - 1) {
          indices.push(times.length - 1);
        }

        // Resample input (times)
        if (!resampledInputs.has(inputAccessor)) {
          const newTimes = new Float32Array(indices.length);
          for (let i = 0; i < indices.length; i++) {
            newTimes[i] = times[indices[i]];
          }
          inputAccessor.setArray(newTimes);
          resampledInputs.set(inputAccessor, true);
        }

        // Resample output (values)
        if (!resampledOutputs.has(outputAccessor)) {
          const newValues = new Float32Array(indices.length * elementSize);
          for (let i = 0; i < indices.length; i++) {
            const origIdx = indices[i];
            for (let e = 0; e < elementSize; e++) {
              newValues[i * elementSize + e] = values[origIdx * elementSize + e];
            }
          }
          outputAccessor.setArray(newValues);
          resampledOutputs.set(outputAccessor, true);
        }
      }
    }

    await io.write(filePath, doc);
    const statAfter = fs.statSync(filePath);
    const saved = statBefore.size - statAfter.size;
    totalBytesSaved += Math.max(0, saved);
    processedCount++;
    console.log(`[30 FPS] ${filePath} (${(statBefore.size / 1024).toFixed(1)} KB -> ${(statAfter.size / 1024).toFixed(1)} KB, saved ${(saved / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

console.log(`\nDone! Successfully resampled ${processedCount} animation files to 30 FPS.`);
console.log(`Total disk space saved: ${(totalBytesSaved / (1024 * 1024)).toFixed(2)} MB`);
