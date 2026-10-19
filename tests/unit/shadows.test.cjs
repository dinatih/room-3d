const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const { meshWorldBounds, enableAnimatedFrustumCulling } = require('../../src/features/scene/utils/animatedFrustumCulling.ts');
let beforeBounds = 0, afterBounds = 0;
const before = load('tests/fixtures/visible-shadow-reference.ts', {
    three: THREE, '../../src/features/scene/utils/animatedFrustumCulling': {
        meshWorldBounds: (...args) => { beforeBounds++; return meshWorldBounds(...args); },
    },
}).getUnusedShadows;
const after = load('src/features/scene/utils/visibleShadowReceivers.ts', {
    three: THREE, './animatedFrustumCulling': {
        meshWorldBounds: (...args) => { afterBounds++; return meshWorldBounds(...args); },
    },
}).getUnusedShadows;
const geometry = new THREE.BoxGeometry(2, 2, 2), material = new THREE.MeshStandardMaterial();
function world() {
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(60, 1, .1, 300);
    camera.position.set(0, 10, 30); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
    return { scene, camera };
}
function light(scene, Type = THREE.DirectionalLight) {
    const light = new Type(); light.castShadow = true; light.position.set(0, 10, 0);
    light.shadow.map = {}; // The test exercises coverage, without allocating a GL target.
    if (light.isDirectionalLight) Object.assign(light.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
    light.shadow.camera.updateProjectionMatrix();
    scene.add(light); if (light.target) scene.add(light.target);
    return light;
}
function receiver(scene, x = 0) {
    const mesh = new THREE.Mesh(geometry, material.clone()); mesh.receiveShadow = true;
    mesh.position.x = x; scene.add(mesh); return mesh;
}
function compare(scene, camera) {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    const expected = before(scene, camera), actual = after(scene, camera);
    assert.deepEqual(actual.shadows, expected.shadows);
    assert.equal(actual.allUnused, expected.allUnused);
    return actual;
}
describe('Receveurs d’ombres', () => {
    it('arrête les mesures dès que chaque lumière possède un receveur', () => {
        const { scene, camera } = world(); light(scene);
        for (let i = 0; i < 100; i++) receiver(scene, 0);
        beforeBounds = afterBounds = 0;
        assert.equal(compare(scene, camera).allUnused, false);
        assert.equal(beforeBounds, 100); assert.equal(afterBounds, 1);
    });
    it('préserve les ombres directionnelles, spot et ponctuelles, les lumières éteintes et leur initialisation', () => {
        const { scene, camera } = world();
        const lights = [light(scene), light(scene, THREE.SpotLight), light(scene, THREE.PointLight)];
        lights[2].distance = 12;
        const mesh = receiver(scene);
        for (const x of [0, 3, 10, 40, -40]) for (const bias of [0, 1, -1]) {
            mesh.position.x = x;
            for (const light of lights) light.shadow.normalBias = bias;
            compare(scene, camera);
        }
        for (const light of lights) {
            light.intensity = 0; compare(scene, camera);
            light.shadow.map = null; compare(scene, camera);
        }
        assert.equal(compare(scene, camera).allUnused, false, 'Uninitialized maps must still render once');
    });
    it('réévalue les déplacements, matériaux, groupes masqués et calques à chaque image', () => {
        const { scene, camera } = world(), lamp = light(scene), mesh = receiver(scene);
        const group = new THREE.Group(); scene.add(group); group.add(mesh);
        for (const visible of [true, false, true]) for (const receive of [true, false]) {
            group.visible = visible; mesh.receiveShadow = receive; compare(scene, camera);
        }
        group.visible = true; mesh.receiveShadow = true;
        mesh.material = [new THREE.MeshStandardMaterial({ visible: false }), new THREE.MeshStandardMaterial()];
        for (const visible of [true, false, true]) {
            mesh.material[1].visible = visible; compare(scene, camera);
        }
        for (const layer of [0, 1, 0]) {
            mesh.layers.set(layer); compare(scene, camera);
            lamp.layers.set(layer); compare(scene, camera);
        }
    });
    it('garde les miroirs visibles et les vues multiples conservateurs', () => {
        const { scene, camera } = world(); light(scene); receiver(scene);
        const mirror = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial());
        mirror.isReflector = true; scene.add(mirror);
        for (const visible of [true, false, true]) {
            mirror.visible = visible; compare(scene, camera);
            mirror.position.x = 100; compare(scene, camera); mirror.position.x = 0;
        }
        const other = camera.clone(); other.layers.enable(1); other.position.x = 15; other.lookAt(0, 0, 0);
        other.updateMatrixWorld(true);
        const stereo = new THREE.ArrayCamera([camera, other]);
        mirror.layers.set(1); compare(scene, stereo);
        mirror.material.visible = false; compare(scene, stereo);
    });
    it('trouve les miroirs dans le parcours des lumières, sans reparcourir toute la scène', () => {
        const { scene, camera } = world(); light(scene); receiver(scene);
        const mirror = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial());
        mirror.isReflector = true; scene.add(mirror); scene.updateMatrixWorld(true);
        const traverse = scene.traverseVisible;
        let scans = 0;
        scene.traverseVisible = function (...args) { scans++; return traverse.apply(this, args); };
        const expected = before(scene, camera); assert.equal(scans, 2);
        scans = 0; assert.deepEqual(after(scene, camera), expected); assert.equal(scans, 1);
    });
    it('mesure les instances déplacées et les receveurs hors frustum si le culling est désactivé', () => {
        const { scene, camera } = world(); light(scene);
        const mesh = new THREE.InstancedMesh(geometry, material, 2); mesh.receiveShadow = true; scene.add(mesh);
        for (const x of [0, 100, 0]) {
            mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(x, 0, 0));
            mesh.setMatrixAt(1, new THREE.Matrix4().makeTranslation(x + 2, 0, 0));
            mesh.computeBoundingSphere();
            for (const culling of [true, false]) { mesh.frustumCulled = culling; compare(scene, camera); }
        }
        assert.equal(compare(new THREE.Scene(), camera).allUnused, true);
    });
    it('suit les déformations du squelette et les morphs sans conserver une boîte périmée', () => {
        const { scene, camera } = world(); light(scene);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 0, 1, 0], 3));
        geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array(12).fill(0), 4));
        geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4));
        geo.morphTargetsRelative = true;
        geo.morphAttributes.position = [new THREE.Float32BufferAttribute([10, 0, 0, 10, 0, 0, 10, 0, 0], 3)];
        const mesh = new THREE.SkinnedMesh(geo, material), bone = new THREE.Bone();
        mesh.receiveShadow = true; mesh.add(bone); scene.add(mesh); scene.updateMatrixWorld(true);
        mesh.bind(new THREE.Skeleton([bone])); enableAnimatedFrustumCulling(mesh);
        for (const x of [-40, 0, 40, 0]) for (const morph of [0, 1, 0]) {
            bone.position.x = x; mesh.morphTargetInfluences[0] = morph; compare(scene, camera);
        }
    });
});
