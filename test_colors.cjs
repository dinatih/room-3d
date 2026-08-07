const { NodeIO } = require('@gltf-transform/core');
async function main() {
  const io = new NodeIO();
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const meshes = document.getRoot().listMeshes();
  for (let mesh of meshes) {
    console.log("Mesh:", mesh.getName());
    for (let prim of mesh.listPrimitives()) {
       const count = prim.getAttribute('POSITION').getCount();
       const mat = prim.getMaterial();
       console.log("  Vertices:", count, " Material:", mat ? mat.getName() : "None", mat ? mat.getBaseColorFactor() : "");
    }
  }
}
main();
