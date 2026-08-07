const { NodeIO } = require('@gltf-transform/core');
const { KHRMaterialsTransmission, KHRMaterialsVolume } = require('@gltf-transform/extensions');

async function main() {
  const io = new NodeIO().registerExtensions([KHRMaterialsTransmission, KHRMaterialsVolume]);
  
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const root = document.getRoot();
  
  const transmissionExtension = document.createExtension(KHRMaterialsTransmission);
  const volumeExtension = document.createExtension(KHRMaterialsVolume);

  const materials = root.listMaterials();
  for (const mat of materials) {
    const name = mat.getName();
    if (name === 'lambert2' || mat.getBaseColorFactor()[3] < 1.0) { // If it's already blend
       mat.setAlphaMode('BLEND');
       
       const transmission = transmissionExtension.createTransmission()
         .setTransmissionFactor(0.9);
         
       const volume = volumeExtension.createVolume()
         .setThicknessFactor(1.0);
         
       mat.setExtension('KHR_materials_transmission', transmission);
       mat.setExtension('KHR_materials_volume', volume);
       mat.setRoughnessFactor(0.05);
       mat.setBaseColorFactor([0.02, 0.02, 0.02, 0.8]);
    }
  }

  await io.write('public/media/sandbox/kin-fine-camera.glb', document);
}

main().catch(console.error);
