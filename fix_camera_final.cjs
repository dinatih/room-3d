const { NodeIO } = require('@gltf-transform/core');
const fs = require('fs');

async function main() {
  const io = new NodeIO();
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  const root = document.getRoot();

  // Create textures
  const tLambert1Albedo = document.createTexture('lambert1_albedo').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert1_albedo.jpg')).setMimeType('image/jpeg');
  const tLambert1Metallic = document.createTexture('lambert1_metallic').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert1_metallic.jpg')).setMimeType('image/jpeg');
  const tLambert1Roughness = document.createTexture('lambert1_roughness').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert1_roughness.jpg')).setMimeType('image/jpeg');
  const tLambert1Normal = document.createTexture('lambert1_normal').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert1_normal.png')).setMimeType('image/png');

  const tLambert2Albedo = document.createTexture('lambert2_albedo').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert2_albedo.jpg')).setMimeType('image/jpeg');
  const tLambert2Metallic = document.createTexture('lambert2_metallic').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert2_metallic.jpg')).setMimeType('image/jpeg');
  const tLambert2Roughness = document.createTexture('lambert2_roughness').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert2_roughness.jpg')).setMimeType('image/jpeg');
  const tLambert2Normal = document.createTexture('lambert2_normal').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert2_normal.png')).setMimeType('image/png');
  const tLambert2Opacity = document.createTexture('lambert2_opacity').setImage(fs.readFileSync('sources_backup/kin-fine-camera_unzipped/source/model/textures/lambert2_opacity.jpg')).setMimeType('image/jpeg');

  const materials = root.listMaterials();
  let baseMat = materials[0];
  let domeMat = materials[1];

  baseMat.setBaseColorTexture(tLambert1Albedo);
  baseMat.setMetallicRoughnessTexture(tLambert1Roughness); // It expects a combined metallic/roughness, but let's just set the maps if we can. Actually gltf-transform requires combined texture for met/rough.
  // We'll just set baseColor and normal.
  baseMat.setNormalTexture(tLambert1Normal);
  baseMat.setBaseColorFactor([1,1,1,1]);
  baseMat.setRoughnessFactor(0.8);
  baseMat.setMetallicFactor(0.0);
  baseMat.setDoubleSided(true);

  domeMat.setBaseColorTexture(tLambert2Albedo);
  domeMat.setNormalTexture(tLambert2Normal);
  domeMat.setBaseColorFactor([1,1,1,1]);
  domeMat.setAlphaMode('BLEND');
  domeMat.setRoughnessFactor(0.1);
  domeMat.setMetallicFactor(0.0);
  domeMat.setDoubleSided(true);

  // Re-apply to meshes correctly:
  // If meshId1 was smaller, let's SCALE IT UP so it swallows the dummy dome!
  const nodes = root.listNodes();
  for (let node of nodes) {
      if (node.getMesh() && node.getMesh().getName() === 'meshId1') {
          // Scale it up by 1.1!
          node.setScale([1.1, 1.1, 1.1]);
      }
  }

  await io.write('public/media/sandbox/kin-fine-camera.glb', document);
}

main().catch(console.error);
