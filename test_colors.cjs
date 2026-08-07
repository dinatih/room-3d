const { NodeIO } = require('@gltf-transform/core');
async function main() {
  const io = new NodeIO();
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const materials = document.getRoot().listMaterials();
  for (let m of materials) {
    console.log(m.getName(), m.getBaseColorFactor(), m.getMetallicFactor(), m.getRoughnessFactor(), m.getAlphaMode());
  }
}
main();
