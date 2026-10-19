const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const wallData = require('../../src/features/scene/wallData.ts');
const file = 'src/features/scene/birdPerches.ts';
const dependencies = { three: THREE, './wallData': wallData };
const current = load(file, dependencies);
const previous = load(file, dependencies, source => source
    .replace('      this.transform.multiply(mesh.bindMatrixInverse);', '')
    .replace('this.vertex.applyMatrix4(this.transform);', 'this.vertex.applyMatrix4(mesh.bindMatrixInverse).applyMatrix4(this.transform);'));

it('conserve les contacts animés avec morphs, transformations et plusieurs influences', () => {
    const geometry = new THREE.BoxGeometry(2, 1, 2);
    const count = geometry.attributes.position.count;
    const indices = [], weights = [];
    for (let i = 0; i < count; i++) { indices.push(i % 2, 2, 0, 0); weights.push(.75, .25, 0, 0); }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
    geometry.morphAttributes.position = [geometry.attributes.position.clone()];
    geometry.morphAttributes.position[0].array[1] += .5;
    const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
    const bones = ['L_Digit', 'R_Digit', 'Root'].map(name => { const bone = new THREE.Bone(); bone.name = name; return bone; });
    mesh.add(...bones); mesh.bind(new THREE.Skeleton(bones));
    const model = new THREE.Group(); model.add(mesh);
    model.scale.set(2, 3, 4); model.position.set(30, 12, -40);
    const before = new previous.RobinFootContact(model), after = new current.RobinFootContact(model);
    for (let frame = 0; frame < 30; frame++) {
        bones[0].rotation.z = frame / 30; bones[1].position.y = frame / 20;
        mesh.morphTargetInfluences[0] = frame / 30; model.rotation.y = frame / 10;
        const a = before.measure(model), b = after.measure(model);
        for (const foot of ['left', 'right']) assert(a[foot].distanceTo(b[foot]) < 1e-10);
        assert(Math.abs(a.thickness - b.thickness) < 1e-10);
    }
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
