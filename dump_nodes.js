import fs from 'fs';

const buf = fs.readFileSync('public/media/S9000_Double_Door.glb');
const jsonChunkLength = buf.readUInt32LE(12);
const jsonString = buf.toString('utf8', 20, 20 + jsonChunkLength);
const gltf = JSON.parse(jsonString);

function printNode(idx, indent) {
  const n = gltf.nodes[idx];
  console.log(indent + (n.name || 'node_' + idx) + (n.matrix ? ` matrix: ${JSON.stringify(n.matrix)}` : ''));
  if (n.mesh !== undefined) {
    console.log(indent + '  has mesh ' + n.mesh);
  }
  if (n.children) {
    for (let c of n.children) printNode(c, indent + '  ');
  }
}
gltf.scenes[0].nodes.forEach(n => printNode(n, ''));
