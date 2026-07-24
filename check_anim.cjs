const fs = require('fs');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const THREE = require('three');

// Mock DOM for Three.js GLTFLoader in Node.js
const { JSDOM } = require('jsdom');
const { window } = new JSDOM();
global.window = window;
global.document = window.document;

const gltfData = fs.readFileSync('public/media/sandbox/anim_belly_dance.glb');
console.log('Size:', gltfData.length);
// Instead of full loader, we can just parse the JSON chunk of the GLB
const magic = gltfData.readUInt32LE(0);
const version = gltfData.readUInt32LE(4);
const length = gltfData.readUInt32LE(8);
const chunkLength = gltfData.readUInt32LE(12);
const chunkType = gltfData.readUInt32LE(16);

if (chunkType === 0x4E4F534A) { // 'JSON'
  const jsonString = gltfData.toString('utf8', 20, 20 + chunkLength);
  const json = JSON.parse(jsonString);
  console.log('Animations:', json.animations ? json.animations.length : 0);
  if (json.animations) {
    console.log('Animation names:', json.animations.map(a => a.name));
  }
}
