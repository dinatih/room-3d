const { NodeIO } = require('@gltf-transform/core');
async function main() {
  const io = new NodeIO();
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const root = document.getRoot();
  const meshes = root.listMeshes();
  for (let mesh of meshes) {
    if (mesh.getName() === 'meshId1') {
       // Move meshId1 away by 5 units
       const nodes = root.listNodes().filter(n => n.getMesh() === mesh);
       for (let node of nodes) {
           node.setTranslation([5, 0, 0]);
       }
    }
  }
  await io.write('public/media/sandbox/kin-fine-camera_split.glb', document);
}
main();
