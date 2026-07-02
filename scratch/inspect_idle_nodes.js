import fs from 'fs';

const filePath = 'public/media/glb-animations/idle.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const jsonBuffer = glb.subarray(20, 20 + jsonLength);
const json = JSON.parse(jsonBuffer.toString('utf8'));

const nodeNames = json.nodes.map(n => n.name || 'unnamed');
console.log('All node names in GLB:');
nodeNames.forEach((name, idx) => {
  console.log(`  [${idx}]: "${name}"`);
});
