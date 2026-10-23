// Use the same planted-foot movement in both directions instead of mixing two performances.
async function main() {
  const { NodeIO, PropertyType } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const { prune, dedup } = await import('@gltf-transform/functions');
  const draco = require('draco3d');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco.createDecoderModule(), 'draco3d.encoder': await draco.createEncoderModule(),
  });
  const doc = await io.read('public/animations/mixamo/anim_sit_to_stand.glb');
  for (const animation of doc.getRoot().listAnimations()) {
    animation.setName('stand-to-sit');
    for (const sampler of animation.listSamplers()) {
      if (!['LINEAR', 'STEP'].includes(sampler.getInterpolation())) throw new Error(`Unsupported reversal interpolation: ${sampler.getInterpolation()}`);
      const input = sampler.getInput(), output = sampler.getOutput();
      const times = input.getArray(), values = output.getArray(), size = output.getElementSize();
      const duration = times[times.length - 1], reversed = values.slice();
      for (let frame = 0; frame < times.length; frame++) for (let axis = 0; axis < size; axis++) {
        reversed[frame * size + axis] = values[(times.length - frame - 1) * size + axis];
      }
      sampler.setInput(input.clone().setArray(Float32Array.from(times, (_, frame) => duration - times[times.length - frame - 1])));
      sampler.setOutput(output.clone().setArray(reversed));
    }
  }
  await doc.transform(prune({ propertyTypes: [PropertyType.ACCESSOR] }), dedup());
  await io.write('public/animations/mixamo/anim_stand_to_sit.glb', doc);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
