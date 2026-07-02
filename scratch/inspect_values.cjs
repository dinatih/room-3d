const fs = require('fs');

const w = JSON.parse(fs.readFileSync('/tmp/woman_solo_test.gltf', 'utf8'));

console.log("WOMAN-SOLO ANIMATIONS:");
w.animations.forEach((anim, idx) => {
  console.log(`\nAnim #${idx}: name=${anim.name}, channels=${anim.channels.length}, samplers=${anim.samplers.length}`);
  // Check the first channel
  const ch = anim.channels[0];
  const node = w.nodes[ch.target.node].name;
  const sampler = anim.samplers[ch.sampler];
  // Look at the input (time accessor) and output (value accessor)
  const inputAccessor = w.accessors[sampler.input];
  const outputAccessor = w.accessors[sampler.output];
  console.log(`  Channel 0 target=${node}, path=${ch.target.path}`);
  console.log(`  Time count=${inputAccessor.count}, min=${inputAccessor.min}, max=${inputAccessor.max}`);
  console.log(`  Values count=${outputAccessor.count}`);
});
