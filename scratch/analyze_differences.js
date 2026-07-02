import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const results = JSON.parse(fs.readFileSync(path.join(basePath, 'scratch/lara_structures.json'), 'utf8'));

// Group models by their exact list of bones (joined by comma)
const rigGroups = {};
Object.entries(results).forEach(([id, res]) => {
  const boneKey = (res.bones || []).sort().join(',');
  if (!rigGroups[boneKey]) {
    rigGroups[boneKey] = {
      boneCount: res.boneCount,
      sampleBones: res.bones || [],
      models: []
    };
  }
  rigGroups[boneKey].models.push(id);
});

console.log(`Found ${Object.keys(rigGroups).length} unique rig configurations (bone structures) among 16 models:\n`);

Object.entries(rigGroups).forEach(([key, group], idx) => {
  console.log(`Rig Group ${idx + 1}:`);
  console.log(`- Models (${group.models.length}): ${group.models.join(', ')}`);
  console.log(`- Bone Count: ${group.boneCount}`);
  console.log(`- Sample Bones (first 10): ${group.sampleBones.slice(0, 10).join(', ')}`);
  console.log(`----------------------------------------`);
});

// Let's also look at the meshes of a few models to see their naming convention.
console.log('\nSample mesh names per rig group:');
Object.entries(rigGroups).forEach(([key, group], idx) => {
  const modelId = group.models[0];
  const res = results[modelId];
  console.log(`\nGroup ${idx + 1} (${modelId}) Skinned Meshes (${res.skinnedMeshCount}):`);
  console.log(res.skinnedMeshes.slice(0, 15).map(m => `  * ${m}`).join('\n') + (res.skinnedMeshes.length > 15 ? '\n  * ... and more' : ''));
});
