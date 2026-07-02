const fs = require('fs');
const path = require('path');
const THREE = require('three');

// Load GLTFs
const victoryGltf = JSON.parse(fs.readFileSync('/tmp/victory_test.gltf', 'utf8'));
const womanSoloGltf = JSON.parse(fs.readFileSync('/tmp/woman_solo_test.gltf', 'utf8'));

// Let's compare the structure of node names!
console.log("VICTORY NODES:");
const victoryBones = victoryGltf.nodes.filter(n => n.name && n.name.includes('mixamorig'));
console.log("Count:", victoryBones.length);
console.log("Sample:", victoryBones.slice(0, 10).map(n => n.name));

console.log("\nWOMAN-SOLO NODES:");
const womanSoloBones = womanSoloGltf.nodes.filter(n => n.name && n.name.includes('mixamorig'));
console.log("Count:", womanSoloBones.length);
console.log("Sample:", womanSoloBones.slice(0, 10).map(n => n.name));
