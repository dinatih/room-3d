const { NodeIO } = require('@gltf-transform/core');

async function main() {
  const io = new NodeIO();
  
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const root = document.getRoot();
  const materials = root.listMaterials();
  for (const mat of materials) {
    // ALWAYS MAKE DOUBLE SIDED TO FIX INVISIBLE MESHES!
    mat.setDoubleSided(true);
  }

  // We keep the RED and GREEN colors to verify if the RED dome finally appears!
  await io.write('public/media/sandbox/kin-fine-camera.glb', document);
}

main().catch(console.error);
