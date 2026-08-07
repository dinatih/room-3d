const { NodeIO } = require('@gltf-transform/core');

async function main() {
  const io = new NodeIO();
  
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const root = document.getRoot();
  const materials = root.listMaterials();
  for (const mat of materials) {
    mat.setExtension('KHR_materials_transmission', null);
    mat.setExtension('KHR_materials_volume', null);
    mat.setAlphaMode('OPAQUE');
    mat.setRoughnessFactor(1.0);
    mat.setMetallicFactor(0.0);
  }

  const meshes = root.listMeshes();
  let domeMat = materials.find(m => m.getName() === 'lambert2') || materials[1];
  let baseMat = materials.find(m => m.getName() === 'lambert1') || materials[0];

  domeMat.setBaseColorFactor([1, 0, 0, 1]); // RED
  baseMat.setBaseColorFactor([0, 1, 0, 1]); // GREEN

  for (const mesh of meshes) {
    const prims = mesh.listPrimitives();
    for (const prim of prims) {
       const pos = prim.getAttribute('POSITION');
       if (pos && pos.getCount() < 1000) {
          prim.setMaterial(domeMat);
       } else {
          prim.setMaterial(baseMat);
       }
    }
  }

  await io.write('public/media/sandbox/kin-fine-camera.glb', document);
}

main().catch(console.error);
