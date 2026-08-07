const { NodeIO } = require('@gltf-transform/core');

async function main() {
  const io = new NodeIO();
  
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const root = document.getRoot();
  
  const materials = root.listMaterials();
  for (const mat of materials) {
    const name = mat.getName();
    
    // On s'assure de nettoyer les anciennes extensions de transmission qui causent des bugs de rendu sans envMap
    mat.setExtension('KHR_materials_transmission', null);
    mat.setExtension('KHR_materials_volume', null);
    
    if (name === 'lambert2' || mat.getAlphaMode() === 'BLEND') { 
       mat.setAlphaMode('BLEND');
       mat.setRoughnessFactor(0.2);
       mat.setMetallicFactor(0.8); // Rendre brillant
       mat.setBaseColorFactor([0.01, 0.01, 0.01, 0.75]); // Noir transparent classique
    } else {
       mat.setBaseColorFactor([0.9, 0.9, 0.9, 1]);
       mat.setRoughnessFactor(0.8);
    }
  }

  // Vérifier explicitement que le petit mesh est bien assigné au matériau noir
  const meshes = root.listMeshes();
  let domeMat = materials.find(m => m.getName() === 'lambert2') || materials[1];
  let baseMat = materials.find(m => m.getName() === 'lambert1') || materials[0];

  for (const mesh of meshes) {
    const prims = mesh.listPrimitives();
    for (const prim of prims) {
       const pos = prim.getAttribute('POSITION');
       if (pos && pos.getCount() < 1000) {
          // Dome
          prim.setMaterial(domeMat);
       } else {
          // Base
          prim.setMaterial(baseMat);
       }
    }
  }

  await io.write('public/media/sandbox/kin-fine-camera.glb', document);
}

main().catch(console.error);
