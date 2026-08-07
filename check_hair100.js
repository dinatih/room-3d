import { NodeIO } from '@gltf-transform/core';

async function check() {
  const io = new NodeIO();
  const doc = await io.read('public/media/wigs/wig_100.glb');
  const target = doc.getRoot().listNodes().find(n => n.getName().startsWith('Hair100_ARM'));
  console.log('Scale:', target.getScale());
  console.log('Translation:', target.getTranslation());
}
check();
