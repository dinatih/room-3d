const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');

it('Microduck : clips complets, semelles au sol, mouvements distincts et plastique rouge', async () => {
  const T = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const bytes = await fs.readFile('public/models/microduck.glb');
  const { scene, animations } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  assert.deepEqual(animations.map(c => c.name).sort(), ['grab', 'idle', 'quack', 'sit-stand', 'walk']);
  const names = []; scene.traverse(node => { if (node.name) names.push(node.name); });
  assert.equal(new Set(names).size, names.length, 'mesh and joint names must be unique');
  const mixer = new T.AnimationMixer(scene);
  const sample = (clip, time) => {
    mixer.stopAllAction();
    const action = mixer.clipAction(clip).reset().setLoop(T.LoopOnce, 1).play();
    action.clampWhenFinished = true;
    mixer.setTime(time);
    scene.updateMatrixWorld(true);
  };
  const soles = [];
  let red = 0, black = 0, metal = 0;
  scene.traverse(node => {
    if (!node.isMesh) return;
    if (/^sole_(left|right)\.stl$/.test(node.userData.meshName)) soles.push(node);
    if (node.material.name === 'Microduck red shells') { red++; assert(node.material.color.r > node.material.color.g); }
    else if (node.material.color.r < 0.03 && node.material.color.g < 0.03) black++;
    else metal++;
  });
  assert(red > 0 && black > 0 && metal > 0);
  assert.equal(soles.length, 2);
  for (const clip of animations) {
    assert.equal(clip.tracks.length, 17, `${clip.name} resets all animated nodes`);
    for (const track of clip.tracks) {
      assert(T.PropertyBinding.findNode(scene, T.PropertyBinding.parseTrackName(track.name).nodeName));
      assert([...track.values].every(Number.isFinite));
    }
    for (let frame = 0; frame <= 20; frame++) {
      sample(clip, clip.duration * frame / 20);
      const bounds = new T.Box3();
      for (const sole of soles) bounds.union(new T.Box3().setFromObject(sole));
      assert(Math.abs(bounds.min.y) < 0.001, `${clip.name}: sole at ${bounds.min.y} m`);
    }
  }
  const idle = animations.find(c => c.name === 'idle');
  sample(idle, 0);
  let head; scene.traverse(node => { if (node.userData.meshName === 'soft_mouth_top.stl') head = node; });
  const standing = head.getWorldPosition(new T.Vector3()).y;
  sample(animations.find(c => c.name === 'sit-stand'), 2);
  assert(head.getWorldPosition(new T.Vector3()).y < standing, 'sits down');
  sample(animations.find(c => c.name === 'sit-stand'), 7);
  assert(head.getWorldPosition(new T.Vector3()).y > standing * 0.9, 'stands back up');
  sample(animations.find(c => c.name === 'grab'), 1.2);
  assert(head.getWorldPosition(new T.Vector3()).y < standing / 2, 'beak reaches toward ground');
  const walk = animations.find(c => c.name === 'walk');
  for (const track of walk.tracks) {
    const size = track.getValueSize();
    assert.deepEqual([...track.values.slice(0, size)], [...track.values.slice(-size)], 'walk loops continuously');
  }
  sample(animations.find(c => c.name === 'quack'), 0.12);
  assert(Math.abs(scene.getObjectByName('jaw_pivot').quaternion.angleTo(new T.Quaternion()) - 35 * Math.PI / 180) < 0.00001);
});
