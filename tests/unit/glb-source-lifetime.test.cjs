const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const { disposeModelResources } = require('../../src/features/scene/utils/disposeModelResources.ts');

function fixture(sceneMode) {
    const scene = new THREE.Group(), geometry = new THREE.BoxGeometry(), texture = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({ map: texture });
    scene.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
    const gltf = { scene, animations: [], parser: { binary: new ArrayBuffer(100) } };
    const effects = [], loads = [], clears = [], disposed = [];
    for (const resource of [geometry, material, texture]) resource.addEventListener('dispose', () => disposed.push(resource));
    const useGLTF = Object.assign(path => { loads.push(path); return gltf; }, { clear: path => clears.push(path), preload() {} });
    const category = {};
    const api = load('src/features/scene/useGLTFClone.ts', {
        react: { createContext: () => ({}), useContext: context => context === category ? null : sceneMode, useMemo: fn => fn(), useEffect: fn => effects.push(fn) },
        '@react-three/drei': { useGLTF }, three: THREE,
        'three/examples/jsm/utils/SkeletonUtils.js': { clone: root => root.clone(true) },
        './sceneLayer': { CategoryLayerContext: category }, '@config': { LAYER_WALKER_DETAIL: 1 },
        './utils/animatedFrustumCulling': {}, './utils/shareSkeletons': { shareSkeletons() {} },
        './sceneModelPaths': { sceneModelPath: path => path === '/model.glb' ? '/model-scene.glb' : path },
        './utils/disposeModelResources': { disposeModelResources },
    });
    return { api, gltf, effects, loads, clears, disposed };
}

it('releases full-resolution preview sources only after their last clone unmounts', () => {
    const f = fixture(false);
    f.api.useGLTFClone('/model.glb'); f.api.useGLTFClone('/model.glb');
    assert.equal(f.gltf.parser, undefined);
    assert.deepEqual(f.loads, ['/model.glb', '/model.glb']);
    const cleanup = f.effects.map(effect => effect());
    cleanup[0](); assert.deepEqual(f.clears, []); assert.deepEqual(f.disposed, []);
    cleanup[1](); assert.deepEqual(f.clears, ['/model.glb']); assert.equal(f.disposed.length, 3);
    assert.equal(f.api.hasMountedGLTFClones('/model.glb'), false);
});

it('keeps reduced scene sources cached and leaves unaudited sources alone', () => {
    for (const [sceneMode, path, expected] of [[true, '/model.glb', '/model-scene.glb'], [false, '/other.glb', '/other.glb']]) {
        const f = fixture(sceneMode);
        const clone = f.api.useGLTFClone(path);
        assert.deepEqual(f.loads, [expected]);
        assert.equal(clone.scene.userData.gltfPath, path);
        assert.equal(clone.scene.userData.loadedGltfPath, expected);
        f.effects[0]()();
        assert.deepEqual(f.clears, []); assert.deepEqual(f.disposed, []);
    }
});
