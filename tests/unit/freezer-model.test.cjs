const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

it('regroupe le congélateur en six dessins en conservant la porte animée et les triangles', async () => {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const bytes = fs.readFileSync('public/items/tillreda_anim/TILLREDA_anim.glb');
  const { scene, animations } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const meshes = []; scene.traverse(node => { if (node.isMesh) meshes.push(node); });
  assert.equal(meshes.length, 6);
  assert.equal(meshes.reduce((sum, mesh) => sum + mesh.geometry.index.count / 3, 0), 7399);
  assert.equal(new Set(meshes.map(mesh => mesh.material.name)).size, 4);
  assert(meshes.every(mesh => !mesh.material.transparent));
  const door = scene.getObjectByName('door'); assert(door);
  assert.equal(animations.length, 1); assert.equal(animations[0].name, 'door_open');
  assert.equal(animations[0].duration, 1);
  assert.deepEqual(animations[0].tracks.map(track => track.name), ['door.quaternion']);
  const moving = new Set(); door.traverse(node => moving.add(node));
  assert(meshes.some(mesh => moving.has(mesh)), 'La porte conserve sa géométrie');
  const mixer = new THREE.AnimationMixer(scene), action = mixer.clipAction(animations[0]);
  action.setLoop(THREE.LoopOnce, 1).play().clampWhenFinished = true;
  const poses = [0, .5, 1, 0].map(time => {
    action.paused = false; mixer.setTime(time); scene.updateMatrixWorld(true);
    return meshes.map(mesh => [...mesh.matrixWorld.elements]);
  });
  meshes.forEach((mesh, index) => {
    assert.deepEqual(poses[0][index], poses[3][index], 'La fermeture restitue la pose initiale');
    if (moving.has(mesh)) assert.notDeepEqual(poses[0][index], poses[2][index]);
    else for (const pose of poses) assert.deepEqual(pose[index], poses[0][index], 'Le caisson reste fixe');
  });
  mixer.stopAllAction(); mixer.uncacheRoot(scene);
});
