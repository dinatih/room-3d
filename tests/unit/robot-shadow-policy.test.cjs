const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const { createRigidMeshBatches } = require('../../src/features/scene/utils/rigidMeshBatches.ts');

for (const inScene of [false, true]) it(`ombres des robots : ${inScene ? 'désactivées en scène' : 'conservées en preview'}, animation intacte`, () => {
  const scene = new THREE.Group(), geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
  let frame, cleanup;
  const { useRigidMeshBatches } = load('src/features/scene/utils/useRigidMeshBatches.ts', {
    three: THREE, react: { useContext: () => inScene, useMemo: fn => fn(), useRef: () => ({ current: undefined }), useLayoutEffect: fn => { cleanup = fn(); } },
    '@react-three/fiber': { useFrame: fn => { frame = fn; } },
    './rigidMeshBatches': { createRigidMeshBatches }, '../useGLTFClone': { SceneModelContext: {} },
  });
  const batches = useRigidMeshBatches(scene);
  assert.equal(batches.children[0].castShadow, !inScene);
  assert.equal(batches.children[0].receiveShadow, true);
  mesh.position.x = 3; frame();
  assert.equal(batches.children[0].matrix.elements[12], 3);
  cleanup(); assert.equal(batches.children.length, 0); assert.equal(mesh.visible, true);
});
