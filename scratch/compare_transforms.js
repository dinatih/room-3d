import fs from 'fs';

function getGLBTransforms(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  
  const result = {};
  if (json.nodes) {
    json.nodes.forEach((node, idx) => {
      // Keep only root-level nodes or armatures/meshes
      const isRoot = !json.nodes.some(n => n.children && n.children.includes(idx));
      const isArmature = node.name === 'Armature';
      const isMesh = node.mesh !== undefined;
      
      if (isRoot || isArmature || isMesh) {
        result[node.name || `Node_${idx}`] = {
          idx,
          translation: node.translation || [0, 0, 0],
          rotation: node.rotation || [0, 0, 0, 1],
          scale: node.scale || [1, 1, 1],
          isRoot,
          isArmature,
          isMesh
        };
      }
    });
  }
  return result;
}

const orig = getGLBTransforms('public/media/all_lara/lara_croft_red_dress.glb');
const reexp = getGLBTransforms('scratch/test_red_dress_reexported.glb');

console.log("=== COMPARING ROOT / ARMATURE / MESH TRANSFORMS ===");
const allKeys = new Set([...Object.keys(orig), ...Object.keys(reexp)]);
for (const key of allKeys) {
  const o = orig[key];
  const r = reexp[key];
  if (o && r) {
    const diffT = JSON.stringify(o.translation) !== JSON.stringify(r.translation);
    const diffR = JSON.stringify(o.rotation) !== JSON.stringify(r.rotation);
    const diffS = JSON.stringify(o.scale) !== JSON.stringify(r.scale);
    if (diffT || diffR || diffS) {
      console.log(`\nNode: "${key}"`);
      if (diffT) console.log(`  Translation: ${JSON.stringify(o.translation)} -> ${JSON.stringify(r.translation)}`);
      if (diffR) console.log(`  Rotation:    ${JSON.stringify(o.rotation)} -> ${JSON.stringify(r.rotation)}`);
      if (diffS) console.log(`  Scale:       ${JSON.stringify(o.scale)} -> ${JSON.stringify(r.scale)}`);
    }
  } else if (o) {
    console.log(`  Only in Original: "${key}"`);
  } else {
    console.log(`  Only in Re-exported: "${key}"`);
  }
}
