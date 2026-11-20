// Apply the apartment/garden selection to the three dogs sharing the Pitbull rig.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const catalogPath = 'src/features/inventory/dogAnimationOptions.json';
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const models = {
  'animated-pitbull-dog': 'public/characters/animated-pitbull-dog/dog.glb',
  ushiro: 'public/characters/ushiro/ushiro.glb',
  'dachshund-sculpt': 'public/characters/dachshund-sculpt/dog.glb',
};
const excluded = /swim|water|canter|sprint|sneak|aggressive|dodge|bank_|^atttack |^fall |^(yes|no|wave) |^track_bark_harvest /;
const selected = catalog['animated-pitbull-dog'].filter(clip => !excluded.test(clip.value));
const names = selected.map(clip => clip.value).sort();
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const [id, path] of Object.entries(models)) {
  const before = (await fs.stat(path)).size;
  const doc = await io.read(path);
  const root = doc.getRoot();
  const count = root.listAnimations().length;
  assert.deepEqual(root.listAnimations().map(a => a.getName()).sort(), catalog[id].map(c => c.value).sort(), id);
  for (const animation of root.listAnimations()) {
    if (excluded.test(animation.getName())) {
      const samplers = animation.listSamplers();
      for (const channel of animation.listChannels()) channel.dispose();
      for (const sampler of samplers) sampler.dispose();
      animation.dispose();
    }
  }
  // Only remove orphan animation data; preserve geometry, skin and scene nodes.
  for (const accessor of root.listAccessors()) {
    if (accessor.listParents().every(parent => parent === root)) accessor.dispose();
  }
  assert.deepEqual(root.listAnimations().map(a => a.getName()).sort(), names, id);
  const bytes = await io.writeBinary(doc);
  const reread = await io.readBinary(bytes);
  assert.deepEqual(reread.getRoot().listAnimations().map(a => a.getName()).sort(), names, id);
  assert.equal(reread.getRoot().listMeshes().length, root.listMeshes().length);
  assert.equal(reread.getRoot().listSkins().length, root.listSkins().length);
  await fs.writeFile(path, bytes);
  catalog[id] = selected;
  console.log(`${id}: ${count} -> ${names.length} clips; ${before} -> ${bytes.length} bytes`);
}
await fs.writeFile(catalogPath, JSON.stringify(catalog) + '\n');
