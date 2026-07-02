import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const results = JSON.parse(fs.readFileSync(path.join(basePath, 'scratch/lara_structures.json'), 'utf8'));

console.log('=== DETAILED MESH SPLIT ===\n');

Object.entries(results).forEach(([id, res]) => {
  console.log(`Model: ${id}`);
  console.log(`- Skinned meshes (${res.skinnedMeshCount}):`);
  res.skinnedMeshes.slice(0, 5).forEach(m => console.log(`  * [Skinned] ${m}`));
  if (res.skinnedMeshCount > 5) console.log(`  * ... (${res.skinnedMeshCount - 5} more)`);
  
  console.log(`- Standard meshes (${res.meshCount}):`);
  res.meshes.slice(0, 5).forEach(m => console.log(`  * [Standard] ${m}`));
  if (res.meshCount > 5) console.log(`  * ... (${res.meshCount - 5} more)`);
  console.log('------------------------------------');
});
