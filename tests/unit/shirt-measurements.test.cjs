const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

for (const name of ['TShirt', 'MaillotInyeong']) it(`${name}: mesure locale indépendante du parent`, async () => {
  const utilities = await import('three/addons/utils/BufferGeometryUtils.js');
  const glb = load('src/features/scene/glbUtils.ts', { three: THREE, 'three/addons/utils/BufferGeometryUtils.js': utilities });
  const group = new THREE.Group(), parent = new THREE.Group(), effects = [], sizes = [];
  parent.add(group);
  const { [name]: Component } = load(`src/features/scene/items/${name}.tsx`, {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    react: { useRef: () => ({ current: group }), useMemo: fn => fn(), useState: value => [value, () => {}], useEffect() {}, useLayoutEffect: fn => effects.push(fn) },
    './shirtGeometry': load('src/features/scene/items/shirtGeometry.ts', { three: THREE }), '../glbUtils': glb,
  });
  const element = Component({ onSize: size => sizes.push(size.toArray()) });
  for (const child of element.props.children) {
    if (!child?.props.geometry) continue;
    const mesh = new THREE.Mesh(child.props.geometry);
    if (child.props.position) mesh.position.fromArray(child.props.position);
    if (child.props.rotation) mesh.rotation.fromArray(child.props.rotation);
    group.add(mesh);
  }
  effects[0]();
  parent.position.set(90, 30, -120); parent.rotation.y = .8; parent.scale.set(2, 3, 4);
  effects[0]();
  assert.deepEqual(sizes[1], sizes[0]);
  assert(sizes[0].every(value => value > 0));
  group.traverse(node => { if (node.isMesh) node.geometry.dispose(); });
});
