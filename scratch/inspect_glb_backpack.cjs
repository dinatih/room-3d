const fs = require('fs');

// We can parse the GLB file to see mesh names and their materials
// Let's inspect the JSON chunk of the GLB
const fileBuffer = fs.readFileSync('/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb');
const magic = fileBuffer.readUInt32LE(0);
if (magic !== 0x46546C67) {
  console.log("Not a valid GLB");
  process.exit(1);
}
const version = fileBuffer.readUInt32LE(4);
const length = fileBuffer.readUInt32LE(8);
const chunkLength = fileBuffer.readUInt32LE(12);
const chunkType = fileBuffer.readUInt32LE(16);

if (chunkType === 0x4E4F534A) { // JSON
  const jsonBuffer = fileBuffer.slice(20, 20 + chunkLength);
  const gltf = JSON.parse(jsonBuffer.toString('utf8'));
  console.log("GLTF MESHES:");
  gltf.meshes.forEach((mesh, idx) => {
    console.log(`Mesh ${idx}: "${mesh.name}"`);
    mesh.primitives.forEach((prim, pIdx) => {
      const matIdx = prim.material;
      const matName = gltf.materials[matIdx] ? gltf.materials[matIdx].name : 'unknown';
      console.log(`  Primitive ${pIdx}: material="${matName}"`);
    });
  });
  
  console.log("\nGLTF NODES:");
  gltf.nodes.forEach((node, idx) => {
    if (node.mesh !== undefined) {
      console.log(`Node ${idx}: "${node.name}" references Mesh ${node.mesh}`);
    }
  });
}
