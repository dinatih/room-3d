const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const { enableAnimatedFrustumCulling, meshWorldBounds, geometryBoneBoxCache } = load(
    'src/features/scene/utils/animatedFrustumCulling.ts', { three: THREE },
    source => `${source}\nexport { geometryBoneBoxCache };`,
);

function actor() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array(12).fill(0), 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4));
    geometry.morphTargetsRelative = true;
    geometry.morphAttributes.position = [new THREE.Float32BufferAttribute([10, 0, 0, 10, 0, 0, 10, 0, 0], 3)];
    const mesh = new THREE.SkinnedMesh(geometry), bone = new THREE.Bone();
    mesh.add(bone);
    mesh.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton([bone]));
    enableAnimatedFrustumCulling(mesh);
    return mesh;
}

it('ne retient pas chaque poids de morphing dans le cache partagé', () => {
    const mesh = actor(), neutral = mesh.boundingSphere.clone();
    for (let frame = 1; frame <= 120; frame++) {
        const weight = frame / 120;
        mesh.morphTargetInfluences[0] = weight;
        assert.ok(Math.abs(mesh.boundingSphere.center.x - neutral.center.x - 10 * weight) < 1e-6);
    }
    const entries = geometryBoneBoxCache.get(mesh.geometry);
    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0].morphWeights, [0]);
    mesh.morphTargetInfluences[0] = 0;
    assert.deepEqual(mesh.boundingSphere, neutral);
});

it('invalide les volumes lorsque les influences de morphing sont retirées', () => {
    const mesh = actor(), neutral = mesh.boundingSphere.clone();
    mesh.morphTargetInfluences[0] = 1;
    assert.equal(mesh.boundingSphere.center.x, neutral.center.x + 10);
    mesh.morphTargetInfluences = undefined;
    assert.deepEqual(mesh.boundingSphere, neutral);
});

it('conserve les bornes de référence avec rotations, échelles négatives et bind inverse', () => {
    const mesh = actor(), bone = mesh.skeleton.bones[0];
    mesh.bindMode = 'detached';
    const neutralBox = new THREE.Box3().setFromBufferAttribute(mesh.geometry.getAttribute('position'));
    const transform = new THREE.Matrix4(), actual = new THREE.Box3();
    for (const scale of [1, -1, 2]) for (const angle of [0, 0.4, 1.3, 3]) {
        bone.position.set(5, -3, 2);
        bone.rotation.set(angle, angle / 2, -angle);
        bone.scale.set(scale, 0.5, 1.5);
        mesh.updateMatrixWorld(true);
        mesh.bindMatrixInverse.makeRotationY(0.7).setPosition(3, -2, 5);
        transform.multiplyMatrices(mesh.bindMatrixInverse, bone.matrixWorld)
            .multiply(mesh.skeleton.boneInverses[0]).multiply(mesh.bindMatrix);
        const expected = neutralBox.clone().applyMatrix4(transform).applyMatrix4(mesh.matrixWorld);
        meshWorldBounds(mesh, actual);
        assert.ok(actual.min.distanceTo(expected.min) < 1e-12);
        assert.ok(actual.max.distanceTo(expected.max) < 1e-12);
        for (let vertex = 0; vertex < 3; vertex++) {
            const point = mesh.getVertexPosition(vertex, new THREE.Vector3());
            assert.ok(point.distanceTo(mesh.boundingSphere.center) <= mesh.boundingSphere.radius + 1e-12);
        }
    }
});
