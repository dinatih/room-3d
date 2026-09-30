// Script pour inspecter la structure GLB du Xbot
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const { DRACOLoader } = require('three/examples/jsm/loaders/DRACOLoader.js');
const THREE = require('three');
const fs = require('fs');
const path = require('path');

// Simuler le contexte navigateur minimal pour three.js
global.self = global;
global.window = {};
global.document = { createElementNS: () => ({ style: {} }) };

// Lire le fichier GLB
const glbPath = path.resolve(__dirname, '../public/characters/xbot/Xbot_official.glb');
const buffer = fs.readFileSync(glbPath);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuffer, '', (gltf) => {
  const scene = gltf.scene;
  
  console.log('=== STRUCTURE GLB XBOT (3 niveaux) ===');
  function printTree(obj, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return;
    const indent = '  '.repeat(depth);
    const scale = obj.scale ? `scale=[${obj.scale.x.toFixed(4)},${obj.scale.y.toFixed(4)},${obj.scale.z.toFixed(4)}]` : '';
    const pos = obj.position ? `pos=[${obj.position.x.toFixed(2)},${obj.position.y.toFixed(2)},${obj.position.z.toFixed(2)}]` : '';
    const type = obj.type || 'Object3D';
    const isMesh = obj.isMesh ? ' [MESH]' : '';
    const isBone = obj.isBone ? ' [BONE]' : '';
    const isSkinned = obj.isSkinnedMesh ? ' [SKINNED]' : '';
    console.log(`${indent}${type}[${obj.name}]${isMesh}${isBone}${isSkinned} ${scale} ${pos}`);
    if (obj.children) {
      obj.children.forEach(c => printTree(c, depth + 1, maxDepth));
    }
  }
  printTree(scene, 0, 3);
  
  console.log('\n=== SCENE ROOT INFO ===');
  console.log('scene.type:', scene.type);
  console.log('scene.name:', scene.name);
  console.log('scene.scale:', scene.scale);
  console.log('scene.children count:', scene.children.length);
  
  if (scene.children.length > 0) {
    const child0 = scene.children[0];
    console.log('\n=== FIRST CHILD ===');
    console.log('type:', child0.type);
    console.log('name:', child0.name);
    console.log('scale:', child0.scale);
    console.log('isBone:', child0.isBone);
    console.log('isSkinnedMesh:', child0.isSkinnedMesh);
  }
  
  // Chercher l'Armature
  scene.traverse(obj => {
    if (obj.name && obj.name.toLowerCase().includes('armature')) {
      console.log('\n=== ARMATURE NODE ===');
      console.log('name:', obj.name);
      console.log('type:', obj.type);
      console.log('scale:', obj.scale);
      console.log('isBone:', obj.isBone);
      console.log('parent.name:', obj.parent?.name);
    }
  });
  
  // Trouver les SkinnedMesh
  const meshes = [];
  scene.traverse(obj => {
    if (obj.isSkinnedMesh) meshes.push(obj);
  });
  console.log('\n=== SKINNED MESHES ===');
  meshes.forEach(m => {
    console.log(`  [${m.name}] parent=${m.parent?.name} parentScale=${m.parent?.scale.x.toFixed(4)}`);
    // Vertices bbox en géométrie locale
    m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox;
    console.log(`    geometry bbox Y: ${bb.min.y.toFixed(3)} to ${bb.max.y.toFixed(3)}`);
  });
  
}, (err) => {
  console.error('Erreur chargement GLTF:', err);
});
