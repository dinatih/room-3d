import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
import fs from 'fs';

async function splitWigs() {
  const io = new NodeIO();
  const inputPath = 'public/media/hair_pack_part_2.glb';
  
  // Read original
  const originalDoc = await io.read(inputPath);
  const root = originalDoc.getRoot();
  
  // Find all Hair groups (the top level Armature nodes)
  const hairNodes = root.listNodes().filter(n => n.getName().startsWith('Hair') && n.getName().includes('_ARM_'));
  
  console.log(`Found ${hairNodes.length} hair groups. Splitting...`);
  
  if (!fs.existsSync('public/media/wigs')) {
    fs.mkdirSync('public/media/wigs');
  }

  for (const targetNode of hairNodes) {
    const targetName = targetNode.getName();
    // e.g. "Hair100"
    const idMatch = targetName.match(/Hair(\d+)/);
    if (!idMatch) continue;
    const wigId = idMatch[1];
    
    console.log(`Processing wig ${wigId}...`);
    
    // Clone document
    const doc = await io.read(inputPath);
    const docRoot = doc.getRoot();
    const docScene = docRoot.getDefaultScene() || docRoot.listScenes()[0];
    
    // Remove all OTHER hair nodes from the scene
    const nodesToRemove = docRoot.listNodes().filter(n => 
      n.getName().startsWith('Hair') && n.getName().includes('_ARM_') && n.getName() !== targetName
    );
    
    for (const node of nodesToRemove) {
      // Remove from scene if present
      docScene.removeChild(node);
      node.dispose();
    }
    
    // Now find the target node in the cloned doc
    const currentTarget = docRoot.listNodes().find(n => n.getName() === targetName);
    if (!currentTarget) continue;
    
    // Find bip_head
    const bipHead = docRoot.listNodes().find(n => {
      const name = n.getName().toLowerCase();
      return (name.startsWith('bip_head') || name.startsWith('head_140') || name === 'head');
    });
    
    if (bipHead) {
      // Calculate offset based on Lara's scale (1.4)
      const headPos = bipHead.getTranslation(); // [x, y, z]
      const s = 1.4;
      
      const newX = -headPos[0] * s;
      const newY = -headPos[1] * s + 0.07;
      const newZ = -headPos[2] * s;
      
      currentTarget.setTranslation([newX, newY, newZ]);
      currentTarget.setScale([s, s, s]);
    } else {
      console.warn(`WARNING: bip_head not found for ${wigId}`);
      currentTarget.setTranslation([0, 0.15, 0]); // fallback
      currentTarget.setScale([1.4, 1.4, 1.4]);
    }
    
    // Prune unreferenced resources (materials, meshes, etc)
    await doc.transform(prune());
    
    // Save
    const outPath = `public/media/wigs/wig_${wigId}.glb`;
    await io.write(outPath, doc);
    console.log(`Saved ${outPath}`);
  }
}

splitWigs().catch(console.error);
