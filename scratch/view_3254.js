import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const results = JSON.parse(fs.readFileSync(path.join(basePath, 'scratch/lara_structures.json'), 'utf8'));
const res = results['lara_croft_3254_rigged'];

console.log('=== LARA CROFT 3254 BONES ===');
console.log(res.bones.join(', '));
console.log('\n=== LARA CROFT 3254 SKINNED MESHES ===');
console.log(res.skinnedMeshes.join(', '));
console.log('\n=== LARA CROFT 3254 STATIC MESHES ===');
console.log(res.meshes.join(', '));
