import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const resultsPath = path.join(basePath, 'scratch/lara_structures.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('=== LARA VARIANT STRUCTURAL SUMMARY ===\n');

// 1. Bone Count & Unique Bone Check
console.log('Bone and Mesh counts per model:');
const modelInfo = [];
Object.entries(results).forEach(([id, res]) => {
  modelInfo.push({
    id,
    bones: res.boneCount,
    skinnedMeshes: res.skinnedMeshCount,
    staticMeshes: res.meshCount
  });
});
console.table(modelInfo);

// 2. Bone Set Intersection
const allModelsBones = Object.entries(results).map(([id, res]) => ({ id, bones: new Set(res.bones || []) }));
const commonBones = new Set(allModelsBones[0].bones);
allModelsBones.forEach(({ bones }) => {
  for (const b of commonBones) {
    if (!bones.has(b)) {
      commonBones.delete(b);
    }
  }
});

console.log(`\nCommon bones present in ALL models (Count: ${commonBones.size}):`);
console.log(Array.from(commonBones).slice(0, 10).join(', ') + ' ... etc.');

// 3. Bone name mismatches: let's see which models differ from the reference model lara_croft_red_dress
const refId = 'lara_croft_red_dress';
const refBones = new Set(results[refId].bones);
console.log(`\nReference model: ${refId} has ${refBones.size} bones.`);

Object.entries(results).forEach(([id, res]) => {
  if (id === refId) return;
  const currentBones = new Set(res.bones);
  const missingInCurrent = Array.from(refBones).filter(b => !currentBones.has(b));
  const extraInCurrent = Array.from(currentBones).filter(b => !refBones.has(b));
  
  if (missingInCurrent.length > 0 || extraInCurrent.length > 0) {
    console.log(`\nModel "${id}" differences compared to red dress:`);
    if (missingInCurrent.length > 0) console.log(`  - Missing bones (${missingInCurrent.length}): ${missingInCurrent.slice(0, 5).join(', ')}${missingInCurrent.length > 5 ? '...' : ''}`);
    if (extraInCurrent.length > 0) console.log(`  - Extra bones (${extraInCurrent.length}): ${extraInCurrent.slice(0, 5).join(', ')}${extraInCurrent.length > 5 ? '...' : ''}`);
  } else {
    console.log(`Model "${id}" has EXACT same bone names as red dress.`);
  }
});

// 4. Skinned Mesh names per model
console.log('\nSkinned Meshes per model:');
Object.entries(results).forEach(([id, res]) => {
  console.log(`- ${id}:`);
  res.skinnedMeshes.forEach(sm => {
    console.log(`  * ${sm}`);
  });
});
