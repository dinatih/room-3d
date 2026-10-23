const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

for (const [id, duration] of [['pick-fruit', 2.3], ['take-book-shelf', undefined], ['pick-fruit-3', undefined]])
it(`${id} termine le vrai GLB une seule fois sans boucler`, async () => {
  const definition = load('src/features/scene/animations/animationRegistry.ts', {}, source => {
    const start = source.indexOf(`    id: '${id}',`);
    return `export const definition = { ${source.slice(start, source.indexOf('\n  },', start))} };`;
  }).definition;
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  loader.register(() => ({ name: 'bones-only', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  const bytes = fs.readFileSync(`public/${definition.path}`);
  const source = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const clip = source.animations[0];
  if (duration !== undefined) assert(Math.abs(clip.duration - duration) < 1e-6, 'Le GLB d’origine contient uniquement la première prise');
  for (const track of clip.tracks) assert(track.times.at(-1) <= clip.duration);
  assert.equal(definition.loop, 'once');
  const mixer = new THREE.AnimationMixer(source.scene);
  let loops = 0, finishes = 0;
  mixer.addEventListener('loop', () => loops++);
  mixer.addEventListener('finished', () => finishes++);
  const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  for (let frame = 0; frame < Math.ceil(clip.duration * 3 * 30); frame++) mixer.update(1 / 30);
  assert.equal(finishes, 1);
  assert.equal(loops, 0);
  assert.equal(action.time, clip.duration);
});
