import { NodeIO } from '@gltf-transform/core';

async function check() {
  const io = new NodeIO();
  const doc = await io.read('public/media/wigs/wig_100.glb');
  
  const printNode = (node, depth = 0) => {
    let type = [];
    if (node.getMesh()) type.push('Mesh');
    if (node.getSkin()) type.push('Skin');
    if (node.getCamera()) type.push('Camera');
    
    console.log(' '.repeat(depth * 2) + node.getName() + (type.length ? ` (${type.join(',')})` : ''));
    node.listChildren().forEach(c => printNode(c, depth + 1));
  };
  
  doc.getRoot().listScenes()[0].listChildren().forEach(c => printNode(c, 0));
}
check();
