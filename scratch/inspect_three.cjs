const fs = require('fs');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const { JSDOM } = require('jsdom');
const THREE = require('three');

// Mock browser env for GLTFLoader
const { window } = new JSDOM();
global.window = window;
global.document = window.document;
global.self = window;
global.TextDecoder = require('util').TextDecoder;

const loader = new GLTFLoader();

function inspect(path) {
  const data = fs.readFileSync(path);
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  
  loader.parse(arrayBuffer, '', (gltf) => {
    console.log(`\n--- INSPECTING ${path} ---`);
    
    // Bones
    const bones = [];
    gltf.scene.traverse(node => {
      if (node.isBone) bones.push(node.name);
    });
    console.log(`Bones Found (${bones.length}):`, bones.slice(0, 10));

    // Animations
    gltf.animations.forEach(anim => {
      console.log(`Animation: ${anim.name}`);
      console.log(`Tracks (${anim.tracks.length}):`);
      anim.tracks.slice(0, 10).forEach(t => console.log(`  - ${t.name}`));
    });
  }, (err) => console.error(err));
}

inspect('public/media/sandbox/Xbot_official.glb');
inspect('public/media/sandbox/lara_native.glb');
