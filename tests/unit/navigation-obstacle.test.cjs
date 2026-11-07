const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

function fixture() {
  const root = new THREE.Group(), parent = new THREE.Group(); parent.add(root);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 30)); root.add(mesh);
  const refs = [], effects = [], pending = [], obstacles = new Map();
  let cursor, effectIndex, frame, measures = 0, enabled = true;
  const { NavigationObstacle } = load('src/features/scene/ai/navigation/NavigationObstacle.tsx', {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    react: {
      useRef: value => refs[cursor++] ??= { current: value === null ? root : value },
      useLayoutEffect: (fn, deps) => {
        const index = effectIndex++, previous = effects[index];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) pending.push(() => {
          previous?.cleanup?.(); effects[index] = { fn, deps, cleanup: fn() };
        });
      },
    },
    '@react-three/fiber': { useFrame: callback => { frame = callback; } },
    './NavigationContext': { useNavigationEnabled: () => enabled },
    '../../glbUtils': { glbLocalBBox: object => { measures++; return new THREE.Box3().setFromObject(object); } },
    './geometry': require('../../src/features/scene/ai/navigation/geometry.ts'),
    './obstacles': { registerObstacle: value => obstacles.set(value.id, value), unregisterObstacle: id => obstacles.delete(id) },
  });
  return {
    root, parent, mesh, obstacles, get measures() { return measures; },
    render(props = {}) { cursor = effectIndex = 0; NavigationObstacle({ id: 'desk', children: {}, ...props }); pending.splice(0).forEach(fn => fn()); },
    frame() { frame(); }, enable(value) { enabled = value; },
    disconnect() { effects.forEach(effect => effect.cleanup?.()); },
    reconnect() { effects.forEach(effect => { effect.cleanup = effect.fn(); }); },
  };
}

it('ignore les rendus ordinaires et suit les placements sans remesurer les sommets', () => {
  const test = fixture(); test.render();
  for (let i = 0; i < 10; i++) { test.render(); test.frame(); }
  assert.equal(test.measures, 1);
  test.parent.position.x = 100; test.frame();
  assert.equal(test.measures, 1);
  assert.equal(test.obstacles.get('desk:0').polygon[0].x, 95);
});

it('remesure une géométrie modifiée et remplace propriétaire, identifiant et empreinte', () => {
  const test = fixture(); test.render({ geometryKey: 20 });
  test.mesh.geometry = new THREE.BoxGeometry(10, 40, 30);
  test.render({ geometryKey: 40 });
  assert.equal(test.measures, 2); assert.equal(test.obstacles.get('desk:0').yMax, 20);
  test.render({ id: 'new', owner: 'shared', geometryKey: 40 });
  assert.equal(test.obstacles.has('desk:0'), false);
  assert.equal(test.obstacles.get('new:0').owner, 'shared');
  const footprint = [{ x: 1, z: 2 }, { x: 3, z: 4 }, { x: 5, z: 6 }];
  test.render({ id: 'new', owner: 'shared', geometryKey: 40, footprint });
  assert.deepEqual(test.obstacles.get('new:0').polygon, footprint);
  test.disconnect(); assert.equal(test.obstacles.size, 0);
});

it('nettoie et réenregistre les obstacles après Suspense ou désactivation', () => {
  const test = fixture(); test.render(); test.disconnect();
  assert.equal(test.obstacles.size, 0);
  test.reconnect(); assert.equal(test.obstacles.size, 1);
  test.enable(false); test.render(); assert.equal(test.obstacles.size, 0);
  test.enable(true); test.render(); assert.equal(test.obstacles.size, 1);
  test.disconnect(); assert.equal(test.obstacles.size, 0);
});
