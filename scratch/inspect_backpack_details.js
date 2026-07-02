import fs from 'fs';
import path from 'path';

const allLaraDir = 'public/media/all_lara';
const targetModels = [
  'lara_croft_3254_rigged.glb',
  'lara_croft_543i.glb',
  'lara_croft_red_dress.glb',
  'lara_croft_suit.glb',
  'lara_croft_43254_rigged.glb',
  'lara_croft_324_rigged.glb'
];

targetModels.forEach(file => {
  const filePath = path.join(allLaraDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  
  console.log(`\n==========================================`);
  console.log(`Model: ${file}`);
  console.log(`==========================================`);
  
  console.log(`--- Meshes (${json.meshes ? json.meshes.length : 0}) ---`);
  if (json.meshes) {
    json.meshes.forEach((m, idx) => {
      const lower = (m.name || '').toLowerCase();
      if (lower.includes('backpack') || lower.includes('pack') || lower.includes('bag') || lower.includes('gear') || lower.includes('acc') || lower.includes('body')) {
        console.log(`  Mesh [${idx}]: "${m.name}"`);
      }
    });
  }
  
  console.log(`--- Materials (${json.materials ? json.materials.length : 0}) ---`);
  if (json.materials) {
    json.materials.forEach((mat, idx) => {
      const lower = (mat.name || '').toLowerCase();
      if (lower.includes('backpack') || lower.includes('pack') || lower.includes('bag') || lower.includes('gear') || lower.includes('acc') || lower.includes('body') || lower.includes('vest') || lower.includes('suit') || lower.includes('dress')) {
        console.log(`  Material [${idx}]: "${mat.name}"`);
      }
    });
  }
});
