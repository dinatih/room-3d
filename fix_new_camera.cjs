const { NodeIO } = require('@gltf-transform/core');
const { resample, dedup } = require('@gltf-transform/functions');

async function main() {
  const io = new NodeIO();
  const document = await io.read('public/media/sandbox/camera_render.glb');
  const root = document.getRoot();

  // Écraser la base pour réduire la hauteur par 3, comme demandé
  const nodes = root.listNodes();
  for (const node of nodes) {
      if (node.getParentNode() === null) {
          // Si c'est un noeud racine (pas un sous-noeud), on l'écrase
          // Attention, le DAE original est pSphere... ils n'ont peut-être pas de parent ou un parent root
      }
      // Au lieu de ça on va juste scaler les noeuds qui ont les meshes
      if (node.getMesh()) {
          node.setScale([10, 3.33, 10]); // On agrandit X et Z par 10 (c'était petit avant), et Y par 3.33 (ce qui fait 1/3 de 10)
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

  // Pour valider les échelles (bake)
  // Utilisons les outils de transformation de la géométrie au lieu du rescale node si ça bug, 
  // Mais node scale suffit généralement.

  await io.write('public/media/sandbox/camera_render.glb', document);
}

main().catch(console.error);
