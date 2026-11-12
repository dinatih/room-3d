const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

it('instance les dix nervures du télémètre aux mêmes positions et conserve leur sélection', () => {
  const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, .16, 2.72), new THREE.MeshStandardMaterial(), 10);
  const { LaserDistanceMaster } = load('src/features/scene/items/LaserDistanceMaster.tsx', {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    react: { useRef: () => ({ current: ribs }), useMemo: () => null, useLayoutEffect: fn => fn() },
  });
  let size;
  const element = LaserDistanceMaster({ onSize: value => { size = value.toArray(); } });
  assert.deepEqual(size, [4.2, 10, 2.5]);
  const instance = element.props.children.find(child => child?.type === 'instancedMesh');
  assert.equal(instance.props.args[2], 10); assert.equal(instance.props.castShadow, undefined);
  assert.equal(instance.props.receiveShadow, undefined);
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3();
  ribs.updateMatrixWorld(true);
  for (let i = 0; i < ribs.count; i++) {
    ribs.getMatrixAt(i, matrix); position.setFromMatrixPosition(matrix);
    assert(Math.abs(position.x - (i < 5 ? -2.2 : 2.2)) < 1e-6);
    assert(Math.abs(position.y - (3.4 + i % 5 * .8)) < 1e-6);
    assert.equal(position.z, 0);
    const ray = new THREE.Raycaster(new THREE.Vector3(position.x, position.y, -10), new THREE.Vector3(0, 0, 1));
    assert.equal(ray.intersectObject(ribs)[0].instanceId, i);
  }
});
