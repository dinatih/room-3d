import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const results = JSON.parse(fs.readFileSync(path.join(basePath, 'scratch/lara_structures.json'), 'utf8'));

console.log('=== SKINNED MESH NAMING PATTERNS ===\n');

Object.entries(results).forEach(([id, res]) => {
  console.log(`- ${id}: ${res.skinnedMeshCount} skinned meshes`);
  const samples = res.skinnedMeshes || [];
  
  // Look for common keywords
  const bodyMeshes = samples.filter(m => m.toLowerCase().includes('body'));
  const hairMeshes = samples.filter(m => m.toLowerCase().includes('hair'));
  const faceMeshes = samples.filter(m => m.toLowerCase().includes('face'));
  const clothesMeshes = samples.filter(m => m.toLowerCase().includes('dress') || m.toLowerCase().includes('jacket') || m.toLowerCase().includes('pants') || m.toLowerCase().includes('shirt') || m.toLowerCase().includes('catsuit') || m.toLowerCase().includes('suit'));
  const gearMeshes = samples.filter(m => m.toLowerCase().includes('gear') || m.toLowerCase().includes('pack') || m.toLowerCase().includes('backpack') || m.toLowerCase().includes('grenade') || m.toLowerCase().includes('gun') || m.toLowerCase().includes('pistol'));

  console.log(`  * Body parts: ${bodyMeshes.slice(0, 3).join(', ')}${bodyMeshes.length > 3 ? '...' : ''} (${bodyMeshes.length})`);
  console.log(`  * Hair: ${hairMeshes.slice(0, 3).join(', ')}${hairMeshes.length > 3 ? '...' : ''} (${hairMeshes.length})`);
  console.log(`  * Face/Head: ${faceMeshes.slice(0, 3).join(', ')}${faceMeshes.length > 3 ? '...' : ''} (${faceMeshes.length})`);
  console.log(`  * Clothing items: ${clothesMeshes.slice(0, 3).join(', ')}${clothesMeshes.length > 3 ? '...' : ''} (${clothesMeshes.length})`);
  console.log(`  * Gear/Accessories: ${gearMeshes.slice(0, 3).join(', ')}${gearMeshes.length > 3 ? '...' : ''} (${gearMeshes.length})`);
  console.log(`  * Total Unique: ${samples.length}`);
  console.log(`  * Sample mesh 1: ${samples[0]}`);
});
