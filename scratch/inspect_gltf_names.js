const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader');
const { JSDOM } = require('jsdom');
const fs = require('fs');

async function inspect() {
    const data = fs.readFileSync('public/media/sandbox/Xbot_official.glb');
    // Simplified: we just want names
    const glb = JSON.parse(data.toString('utf8', data.indexOf('{"asset"'), data.indexOf('}') + 1));
    console.log('Meshes:', glb.meshes.map(m => m.name));
    console.log('Nodes:', glb.nodes.map(n => n.name));
}
// inspect();
// Wait, I can't easily run JS with three/jsm in shell without node setup.
// I'll just use grep on the GLB file to see strings.
