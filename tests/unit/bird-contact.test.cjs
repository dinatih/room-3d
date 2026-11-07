const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
require('../support/load-ts.cjs');
const current = require('../../src/features/scene/birdPerches.ts');
const { load } = require('../support/load-ts.cjs');
const { castAt } = load('src/features/scene/birdPerches.ts', {
    three: THREE, 'three-mesh-bvh': require('three-mesh-bvh'), './wallData': require('../../src/features/scene/wallData.ts'),
}, source => source + '\nexport { castAt };');

it('accélère les appuis animés sans changer les contacts, UV, triangles ni instances', () => {
    const geometry = new THREE.PlaneGeometry(20, 20, 30, 30).rotateX(-Math.PI / 2);
    const count = geometry.getAttribute('position').count;
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array.from({ length: count }, () => [0, 1, 0, 0]).flat(), 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Array.from({ length: count }, () => [.3, .7, 0, 0]).flat(), 4));
    geometry.morphTargetsRelative = true;
    geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(Array.from({ length: count }, () => [0, 2, 0]).flat(), 3)];
    const index = [...geometry.index.array], groups = structuredClone(geometry.groups);
    const make = () => {
        const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
        const root = new THREE.Bone(), bone = new THREE.Bone(); root.add(bone); mesh.add(root);
        mesh.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton([root, bone]));
        return { mesh, bone };
    };
    const first = make(), second = make(), ray = new THREE.Raycaster(); ray.layers.enableAll();
    const compare = meshes => {
        for (const x of [-7.1, -.4, 6.3]) for (const z of [-6.2, .7, 7.4]) {
            ray.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
            const expected = ray.intersectObjects(meshes, false)[0], actual = castAt(x, z, 100, meshes);
            assert.equal(!!actual, !!expected);
            if (!actual) continue;
            assert.equal(actual.object, expected.object); assert.equal(actual.faceIndex, expected.faceIndex);
            assert(actual.point.distanceTo(expected.point) < 1e-8); assert(actual.uv.distanceTo(expected.uv) < 1e-8);
        }
    };
    for (const y of [0, 3, -2, 0]) {
        first.bone.position.y = y; first.bone.rotation.z = y / 10;
        first.mesh.morphTargetInfluences[0] = Math.abs(y) / 3;
        first.mesh.updateMatrixWorld(true); compare([first.mesh]);
    }
    second.bone.position.y = 5; second.mesh.updateMatrixWorld(true);
    compare([second.mesh]); compare([first.mesh]);
    first.mesh.position.y = 4; first.mesh.scale.set(1.2, .8, 1.4); first.mesh.updateMatrixWorld(true); compare([first.mesh]);
    let vertices = 0;
    const getVertex = first.mesh.getVertexPosition;
    first.mesh.getVertexPosition = function (...args) { vertices++; return getVertex.apply(this, args); };
    compare([first.mesh]);
    vertices = 0; ray.intersectObject(first.mesh); const nativeVertices = vertices;
    vertices = 0; castAt(6.3, 7.4, 100, [first.mesh]);
    assert(vertices < nativeVertices, `Le BVH doit éviter le parcours complet : ${vertices}/${nativeVertices}`);
    assert.deepEqual([...geometry.index.array], index); assert.deepEqual(geometry.groups, groups);
    assert.equal(geometry.boundsTree, undefined, 'Le cache de pose reste propre à chaque instance');
});

it('conserve les surfaces découpées, les côtés et les matériaux multiples', () => {
    const transparent = new THREE.MeshBasicMaterial({ alphaTest: .5, opacity: 0, side: THREE.DoubleSide });
    const solid = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const upper = new THREE.Mesh(new THREE.PlaneGeometry(20, 20).rotateX(-Math.PI / 2), transparent);
    upper.position.y = 5; upper.updateMatrixWorld(true);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 20), [solid, solid, solid, solid, solid, solid]);
    lower.updateMatrixWorld(true);
    assert.equal(castAt(.3, .7, 100, [upper, lower]).object, lower);
    upper.material.opacity = 1;
    assert.equal(castAt(.3, .7, 100, [upper, lower]).object, upper);
    upper.material.side = THREE.BackSide;
    assert.equal(castAt(.3, .7, 100, [upper, lower]).object, lower);
});

it('résout les appuis de la mangeoire sans mesurer ses bornes, même après déplacement', () => {
    const world = new THREE.Scene(), support = new THREE.Group(); world.add(support);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial());
    mesh.rotation.x = -Math.PI / 2; support.add(mesh);
    const perch = { support, descriptor: { kind: 'feeder', id: 'feeder' }, mesh,
        point: new THREE.Vector3(), normal: new THREE.Vector3(0, 0, 1), tangent: new THREE.Vector3(1, 0, 0) };
    const feet = { left: new THREE.Vector3(-1,0,0), right: new THREE.Vector3(1,0,0), thickness: .1, height: 15, radius: 2 };
    const original = THREE.Box3.prototype.setFromObject;
    let boxes = 0;
    THREE.Box3.prototype.setFromObject = function(...args) { boxes++; return original.apply(this, args); };
    try {
        for (const y of [0, 50]) {
            support.position.y = y;
            const position = new THREE.Vector3(), rotation = new THREE.Quaternion();
            assert(current.resolveBirdPerch(perch, world, feet, position, rotation));
            assert(Math.abs(position.y - y) < 1e-10);
        }
        assert.equal(boxes, 0);
        support.visible = false;
        assert.equal(current.resolveBirdPerch(perch, world, feet, new THREE.Vector3(), new THREE.Quaternion()), false);
    } finally { THREE.Box3.prototype.setFromObject = original; }
});
