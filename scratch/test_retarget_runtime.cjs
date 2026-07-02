const fs = require('fs');

const victoryGltf = JSON.parse(fs.readFileSync('/tmp/victory_test.gltf', 'utf8'));
const womanSoloGltf = JSON.parse(fs.readFileSync('/tmp/woman_solo_test.gltf', 'utf8'));

console.log("VICTORY CHANNELS (first 5):");
const vChannels = victoryGltf.animations[0].channels;
for (let i = 0; i < Math.min(5, vChannels.length); i++) {
  const ch = vChannels[i];
  const nodeName = victoryGltf.nodes[ch.target.node].name;
  console.log(`Target Node: ${nodeName}, path: ${ch.target.path}`);
}

console.log("\nWOMAN-SOLO CHANNELS (first 5):");
const wChannels = womanSoloGltf.animations[0].channels;
for (let i = 0; i < Math.min(5, wChannels.length); i++) {
  const ch = wChannels[i];
  const nodeName = womanSoloGltf.nodes[ch.target.node].name;
  console.log(`Target Node: ${nodeName}, path: ${ch.target.path}`);
}
