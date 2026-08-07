const { NodeIO } = require('@gltf-transform/core');

async function main() {
  const io = new NodeIO();
  // We need to read the ORIGINAL assimp output, because the current one is already modified.
  // Wait, I overwrote `kin-fine-camera.glb` with the baked one!
  // I should re-convert from DAE to get a clean slate, or just scale the current one by 0.01!
  // If I just scale the current one by 0.01:
  const document = await io.read('public/media/sandbox/kin-fine-camera.glb');
  
  const root = document.getRoot();
  const scene = root.getDefaultScene();
  
  scene.traverse((node) => {
    if (scene.listChildren().includes(node)) {
      // The current scale is [1000, 333, 1000].
      // We want to scale it down by 100, so new scale is [10, 3.33, 10].
      // Actually, applying scale on top of existing scale:
      const currentScale = node.getScale();
      node.setScale([currentScale[0] * 0.01, currentScale[1] * 0.01, currentScale[2] * 0.01]);
    }
  });

  await io.write('public/media/sandbox/kin-fine-camera.glb', document);
}

main().catch(console.error);
