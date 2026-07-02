import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const results = JSON.parse(fs.readFileSync(path.join(basePath, 'scratch/lara_structures.json'), 'utf8'));
const res = results['lara_croft_543i'];

console.log('=== LARA CROFT 543I BONES ===');
console.log(res.bones.join(', '));
console.log('\n=== LARA CROFT 543I SKINNED MESHES ===');
console.log(res.skinnedMeshes.join(', '));
console.log('\n=== LARA CROFT 543I STATIC MESHES ===');
console.log(res.meshes.join(', '));
