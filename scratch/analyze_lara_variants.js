import fs from 'fs';
import path from 'path';

const files = [
  { id: 'lara_croft_324_rigged', label: 'Lara 324 Rigged', file: 'public/media/all_lara/lara_croft_324_rigged.glb' },
  { id: 'lara_croft_4543', label: 'Lara 4543', file: 'public/media/all_lara/lara_croft_4543.glb' },
  { id: 'lara_croft_43254_rigged', label: 'Lara 43254 Rigged', file: 'public/media/all_lara/lara_croft_43254_rigged.glb' },
  { id: 'lara_croft_brown_jacket', label: 'Brown Jacket', file: 'public/media/all_lara/lara_croft_brown_jacket.glb' },
  { id: 'lara_croft_dress_345', label: 'Dress 345', file: 'public/media/all_lara/lara_croft_dress_345.glb' },
  { id: 'lara_croft_motorcycle_gear', label: 'Motorcycle Gear', file: 'public/media/all_lara/lara_croft_motorcycle_gear.glb' },
  { id: 'lara_croft_red_dress', label: 'Red Dress', file: 'public/media/all_lara/lara_croft_red_dress.glb' },
  { id: 'lara_croft_spy_gear', label: 'Spy Gear', file: 'public/media/all_lara/lara_croft_spy_gear.glb' },
  { id: 'lara_croft_suit', label: 'Suit', file: 'public/media/all_lara/lara_croft_suit.glb' },
  { id: 'lara_croft_swim_gear', label: 'Swim Gear', file: 'public/media/all_lara/lara_croft_swim_gear.glb' },
  { id: 'lara_croft_swim_gear_1', label: 'Swim Gear 1', file: 'public/media/all_lara/lara_croft_swim_gear_1.glb' },
  { id: 'lara_croft_swim_gear_243', label: 'Swim Gear 243', file: 'public/media/all_lara/lara_croft_swim_gear_243.glb' },
  { id: 'lara_croft_black_tank_top', label: 'Black Tank Top', file: 'public/media/all_lara/lara_croft_black_tank_top.glb' },
  { id: 'lara_croft_4259', label: 'Lara 4259', file: 'public/media/all_lara/lara_croft_4259.glb' },
  { id: 'lara_officiel', label: 'Lara Officiel', file: 'public/media/sandbox/lara_native.glb' },
  { id: 'lara_croft_zip', label: 'Swim', file: 'public/media/all_lara/lara_croft_zip.glb' },
  { id: 'lara_croft_543i', label: 'Lara 543i', file: 'public/media/all_lara/lara_croft_543i.glb' },
  { id: 'lara_croft_3254_rigged', label: 'Lara 3254 Rigged', file: 'public/media/all_lara/lara_croft_3254_rigged.glb' }
];

const basePath = '/home/dinatih/Projects/room-3d';

function analyzeGLB(filePath) {
  const fullPath = path.join(basePath, filePath);
  if (!fs.existsSync(fullPath)) {
    return { error: `File not found: ${filePath}` };
  }
  
  const glb = fs.readFileSync(fullPath);
  const chunkLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + chunkLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));
  
  // Find nodes that represent bones
  const bones = [];
  const meshes = [];
  const skinnedMeshes = [];
  
  // A node is a bone if it's referenced in any skins joint list or has specific names/characteristics
  // Let's first list all nodes referenced by skins
  const jointNodeIndices = new Set();
  if (json.skins) {
    json.skins.forEach(skin => {
      skin.joints.forEach(j => jointNodeIndices.add(j));
    });
  }
  
  json.nodes.forEach((node, idx) => {
    // If referenced as a joint, it's a bone
    if (jointNodeIndices.has(idx)) {
      bones.push({ index: idx, name: node.name || `Bone_${idx}` });
    }
    
    // Check if it references a mesh
    if (node.mesh !== undefined) {
      const meshDef = json.meshes[node.mesh];
      const meshName = meshDef.name || node.name || `Mesh_${node.mesh}`;
      
      // Let's see if this node has skin property
      const isSkinned = node.skin !== undefined;
      
      if (isSkinned) {
        skinnedMeshes.push({ index: idx, meshIndex: node.mesh, name: meshName });
      } else {
        meshes.push({ index: idx, meshIndex: node.mesh, name: meshName });
      }
    }
  });
  
  return {
    boneCount: bones.length,
    meshCount: meshes.length,
    skinnedMeshCount: skinnedMeshes.length,
    bones: bones.map(b => b.name),
    meshes: meshes.map(m => m.name),
    skinnedMeshes: skinnedMeshes.map(sm => sm.name),
    skins: json.skins ? json.skins.length : 0
  };
}

const results = {};
files.forEach(f => {
  results[f.id] = analyzeGLB(f.file);
});

// Write JSON results to a temporary file for analysis
fs.writeFileSync(path.join(basePath, 'scratch/lara_structures.json'), JSON.stringify(results, null, 2));
console.log('Results successfully written to scratch/lara_structures.json');
