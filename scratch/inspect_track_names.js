import fs from 'fs';

const glb = fs.readFileSync('/home/dinatih/Projects/room-3d/public/media/sandbox/CCFemme_anim.glb');
const chunkLength = glb.readUInt32LE(12);
const jsonBuffer = glb.subarray(20, 20 + chunkLength);
const json = JSON.parse(jsonBuffer.toString('utf8'));

if (json.animations && json.animations.length > 0) {
  const anim = json.animations[0];
  console.log(`Animation name: "${anim.name}"`);
  console.log(`Tracks count: ${anim.channels.length}`);
  
  // Let's print the first 50 track target node names
  const printed = new Set();
  anim.channels.forEach((ch, idx) => {
    const node = json.nodes[ch.target.node];
    if (node && node.name && !printed.has(node.name)) {
      printed.add(node.name);
      if (printed.size <= 50) {
        console.log(`Track [${idx}] targets: "${node.name}" (${ch.target.path})`);
      }
    }
  });
} else {
  console.log('No animations found.');
}
