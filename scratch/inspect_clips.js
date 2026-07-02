import fs from 'fs';

function inspectGLB(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  console.log(`=== ${filePath} ===`);
  if (!json.animations || json.animations.length === 0) {
    console.log('No animations found');
    return;
  }
  
  const anim = json.animations[0];
  console.log(`Animation name: "${anim.name}", duration: ${anim.duration}`);
  console.log(`Channels count: ${anim.channels ? anim.channels.length : 0}`);
  
  // Show a few channels/samplers
  if (anim.channels) {
    console.log('Sample channels:');
    anim.channels.slice(0, 10).forEach((ch, idx) => {
      const targetNode = json.nodes[ch.target.node];
      console.log(`  [${idx}]: node "${targetNode ? targetNode.name : 'unknown'}" target path "${ch.target.path}"`);
    });
  }
}

try {
  inspectGLB('public/media/glb-animations/idle.glb');
  inspectGLB('public/media/glb-animations/idle.glb.backup');
} catch (err) {
  console.error(err.message);
}
