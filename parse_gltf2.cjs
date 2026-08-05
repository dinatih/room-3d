const fs = require('fs');
const buf = fs.readFileSync('public/media/hair_pack_part_2.glb');
const chunk0Length = buf.readUInt32LE(12);
const jsonStr = buf.slice(20, 20 + chunk0Length).toString('utf8');
const gltf = JSON.parse(jsonStr);

// List the 13 top-level children of GLTF_SceneRootNode (node 2)
const rootNode = gltf.nodes[2];
console.log("Top-level children of GLTF_SceneRootNode:", rootNode.children);
rootNode.children.forEach(idx => {
  const n = gltf.nodes[idx];
  console.log(`  Node ${idx}: "${n.name}"`);
});
