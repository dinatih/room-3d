const fs = require('node:fs');
for (const name of ['sitting_idle', 'sit_to_stand']) {
  const data = fs.readFileSync(`public/animations/mixamo/anim_${name}.glb`);
  const jsonLength = data.readUInt32LE(12);
  const gltf = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
  const binStart = 28 + jsonLength;
  for (const animation of gltf.animations) {
    for (const channel of animation.channels) {
      const node = gltf.nodes[channel.target.node];
      if (!/hips/i.test(node.name) || channel.target.path !== 'translation') continue;
      const accessor = gltf.accessors[animation.samplers[channel.sampler].output];
      const view = gltf.bufferViews[accessor.bufferView];
      const offset = binStart + (view.byteOffset || 0) + (accessor.byteOffset || 0);
      const frame = index => Array.from({length: 3}, (_, axis) => data.readFloatLE(offset + index * (view.byteStride || 12) + axis * 4));
      console.log(name, {rest: node.translation, first: frame(0), last: frame(accessor.count - 1), min: accessor.min, max: accessor.max});
    }
  }
}
