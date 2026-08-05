const fs = require('fs');
const buf = fs.readFileSync('public/media/hair_pack_part_2.glb');
// GLB format: 12 byte header, then chunks
// Chunk 0 = JSON, Chunk 1 = BIN
const magic = buf.readUInt32LE(0);
const version = buf.readUInt32LE(4);
const length = buf.readUInt32LE(8);
const chunk0Length = buf.readUInt32LE(12);
const chunk0Type = buf.readUInt32LE(16); // 0x4E4F534A = JSON
const jsonStr = buf.slice(20, 20 + chunk0Length).toString('utf8');
const gltf = JSON.parse(jsonStr);

console.log("Nodes count:", gltf.nodes.length);
// Print first 60 nodes
gltf.nodes.slice(0, 80).forEach((n, i) => {
  if (n.name) console.log(`Node ${i}: "${n.name}", mesh: ${n.mesh !== undefined ? n.mesh : 'none'}, children: ${n.children ? n.children.length : 0}`);
});
