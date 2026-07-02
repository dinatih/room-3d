import fs from 'fs';
import path from 'path';

const allLaraDir = 'public/media/all_lara';
const files = fs.readdirSync(allLaraDir).filter(f => f.endsWith('.glb')).sort();

files.forEach(file => {
  const filePath = path.join(allLaraDir, file);
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  
  // Find any material containing "backpack"
  const backpackMats = [];
  if (json.materials) {
    json.materials.forEach((m, idx) => {
      if ((m.name || '').toLowerCase().includes('backpack')) {
        backpackMats.push({ index: idx, name: m.name });
      }
    });
  }
  
  // Find any mesh containing "backpack"
  const backpackMeshes = [];
  if (json.meshes) {
    json.meshes.forEach((m, idx) => {
      if ((m.name || '').toLowerCase().includes('backpack')) {
        backpackMeshes.push({ index: idx, name: m.name });
      }
    });
  }
  
  if (backpackMats.length > 0 || backpackMeshes.length > 0) {
    console.log(`Model: ${file}`);
    if (backpackMats.length > 0) {
      console.log(`  Backpack Materials:`, backpackMats.map(m => `"${m.name}" (index ${m.index})`).join(', '));
    }
    if (backpackMeshes.length > 0) {
      console.log(`  Backpack Meshes:`, backpackMeshes.map(m => `"${m.name}" (index ${m.index})`).join(', '));
    }
  } else {
    console.log(`Model: ${file} (NO BACKPACK mesh/material)`);
  }
});
