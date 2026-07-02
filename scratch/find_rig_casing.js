import fs from 'fs';
import path from 'path';

const basePath = '/home/dinatih/Projects/room-3d';
const results = JSON.parse(fs.readFileSync(path.join(basePath, 'scratch/lara_structures.json'), 'utf8'));

console.log('=== RIG GROUPS DETAILS ===\n');

Object.entries(results).forEach(([id, res]) => {
  const sampleBones = res.bones || [];
  console.log(`- ${id}: ${res.boneCount} bones.`);
  // check root bones
  const rootBones = sampleBones.filter(b => b.toLowerCase().includes('root') || b.toLowerCase().includes('hip') || b.toLowerCase().includes('pelvis'));
  console.log(`  Roots/Pelvis found: ${rootBones.join(', ')}`);
  
  // check prefix or suffix style
  const countWithPrefix = sampleBones.filter(b => b.startsWith('mixamorig')).length;
  if (countWithPrefix > 0) {
    console.log(`  Has ${countWithPrefix} bones with 'mixamorig' prefix!`);
  }
  
  const countWithUnderscores = sampleBones.filter(b => b.includes('_')).length;
  console.log(`  Bones with underscores: ${countWithUnderscores} / ${res.boneCount}`);
});
