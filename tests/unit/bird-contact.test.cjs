const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
require('../support/load-ts.cjs');
const current = require('../../src/features/scene/birdPerches.ts');

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
