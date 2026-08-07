const { NodeIO } = require('@gltf-transform/core');
const { center } = require('@gltf-transform/functions');

async function main() {
  const io = new NodeIO();
  const document = await io.read('public/media/sandbox/camera_render.glb');
  const root = document.getRoot();

  // On centre parfaitement la géométrie à l'origine !
  await document.transform(
      center({ pivot: 'center' })
  );

  // Appliquer le scale et les fix de base
  const nodes = root.listNodes();
  for (const node of nodes) {
      if (node.getMesh()) {
          // L'utilisateur dit qu'elle est x2 ou x3 trop grosse
          // Donc on met x0.33, z0.33, et on aplatit encore plus y (0.11)
          node.setScale([0.33, 0.11, 0.33]);
      }
  }

  // Appliquer les matériaux pour que l'inventaire soit joli
  const materials = root.listMaterials();
  for (const mat of materials) {
      const name = mat.getName();
      mat.setExtension('KHR_materials_transmission', null);
      mat.setExtension('KHR_materials_volume', null);
      mat.setDoubleSided(true);

      if (name.includes('lambert8')) { // Le dôme
          mat.setAlphaMode('BLEND');
          mat.setBaseColorFactor([0.01, 0.01, 0.01, 0.75]);
          mat.setRoughnessFactor(0.1);
          mat.setMetallicFactor(0.0);
      } else if (name.includes('lambert9')) { // Lentille interne
          mat.setAlphaMode('OPAQUE');
          mat.setBaseColorFactor([0.1, 0.1, 0.1, 1]);
          mat.setRoughnessFactor(0.5);
          mat.setMetallicFactor(0.0);
      } else { // Base
          mat.setAlphaMode('OPAQUE');
          mat.setBaseColorFactor([0.9, 0.9, 0.9, 1]);
          mat.setRoughnessFactor(0.8);
          mat.setMetallicFactor(0.0);
      }
  }

  await io.write('public/media/sandbox/camera_render.glb', document);
}

main().catch(console.error);
