const { NodeIO } = require('@gltf-transform/core');

async function main() {
  const io = new NodeIO();
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const root = document.getRoot();
  const meshes = root.listMeshes();
  
  meshes.forEach((mesh, index) => {
    const prim = mesh.listPrimitives()[0];
    const pos = prim.getAttribute('POSITION');
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.getCount(); i++) {
       let p = pos.getElement(i, []);
       min[0] = Math.min(min[0], p[0]);
       min[1] = Math.min(min[1], p[1]);
       min[2] = Math.min(min[2], p[2]);
       max[0] = Math.max(max[0], p[0]);
       max[1] = Math.max(max[1], p[1]);
       max[2] = Math.max(max[2], p[2]);
    }
    console.log(`Mesh ${index}: ${mesh.getName()}`);
    console.log(`  Vertices: ${pos.getCount()}`);
    console.log(`  Y range: ${min[1].toFixed(4)} to ${max[1].toFixed(4)}`);
    console.log(`  X range: ${min[0].toFixed(4)} to ${max[0].toFixed(4)}`);
  });
}

main().catch(console.error);
