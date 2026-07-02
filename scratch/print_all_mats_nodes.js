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
  
  console.log(`--- Materials ---`);
  if (json.materials) {
    json.materials.forEach((mat, idx) => {
      console.log(`  [${idx}]: "${mat.name || ''}"`);
    });
  } else {
    console.log('No materials');
  }
  
  console.log(`--- Meshes & Nodes ---`);
  if (json.nodes) {
    json.nodes.forEach((n, idx) => {
      if (n.mesh !== undefined) {
        const mesh = json.meshes[n.mesh];
        console.log(`  Node [${idx}]: "${n.name || ''}" points to Mesh [${n.mesh}]: "${mesh.name || ''}"`);
        if (mesh.primitives) {
          mesh.primitives.forEach((prim, pIdx) => {
            const matName = json.materials && prim.material !== undefined ? json.materials[prim.material].name : 'none';
            console.log(`    Primitive [${pIdx}]: Material "${matName}"`);
          });
        }
      }
    });
  }
});
