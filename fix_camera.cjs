const fs = require('fs');
const { NodeIO } = require('@gltf-transform/core');

async function main() {
  const io = new NodeIO();
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');

  // Scale the entire scene to normal size (20cm diameter) and squash the height by 3
  // Assimp made it 0.02, so *1000 = 20cm. And squash Y by 3 -> 333
  // Wait! The user wanted to squash by 3, AND the dome faces up.
  // Let's rotate 180 on X.
  const root = document.getRoot();
  const scene = root.getDefaultScene();
  
  scene.traverse((node) => {
    // Only apply to the top-level nodes of the scene
    if (scene.listChildren().includes(node)) {
      node.setScale([1000, 333, 1000]);
      node.setRotation([-1, 0, 0, 0]); // Math.PI on X axis quaternion (q.w=0, q.x=1 or -1)
      // wait, quaternion for 180 degrees on X: x=1, y=0, z=0, w=0.
      node.setRotation([1, 0, 0, 0]);
    }
  });

  // Now fix the materials
  const materials = root.listMaterials();
  for (const mat of materials) {
    const name = mat.getName();
    if (name === 'lambert2') {
       // This is likely the dome if lambert1 is the base
       // Let's make it black transparent
       mat.setBaseColorFactor([0, 0, 0, 0.7]);
       mat.setAlphaMode('BLEND');
       mat.setRoughnessFactor(0.1);
       mat.setMetallicFactor(0.0);
    } else {
       // lambert1 -> base
       mat.setBaseColorFactor([1, 1, 1, 1]);
       mat.setRoughnessFactor(0.5);
       mat.setMetallicFactor(0.0);
    }
  }

  // To be safe if lambert2 isn't the dome, we can check meshes
  const meshes = root.listMeshes();
  for (const mesh of meshes) {
    const prims = mesh.listPrimitives();
    for (const prim of prims) {
       const pos = prim.getAttribute('POSITION');
       if (pos && pos.getCount() < 1000) {
          // Dome
          prim.setMaterial(materials[1] || materials[0]);
       } else {
          // Base
          prim.setMaterial(materials[0]);
       }
    }
  }

  await io.write('public/media/sandbox/kin-fine-camera.glb', document);
}

main().catch(console.error);
