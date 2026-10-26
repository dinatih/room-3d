const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const { removeGlbBackFaces } = load('src/features/scene/glbUtils.ts', {
  three: THREE, 'three/addons/utils/BufferGeometryUtils.js': {},
});

for (const indexed of [true, false]) {
  it(`préserve le haut du cadre malgré les normales lissées (${indexed ? 'indexé' : 'non indexé'})`, () => {
    let geometry = new THREE.BoxGeometry(40, 150, 2);
    if (!indexed) geometry = geometry.toNonIndexed();
    const normals = geometry.getAttribute('normal');
    for (let i = 0; i < normals.count; i++) normals.setXYZ(i, 0, Math.sqrt(0.75), 0.5);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    removeGlbBackFaces(mesh);
    assert.equal(geometry.getIndex().count, 30, 'seule la face arrière doit être supprimée');
    assert.equal(mesh.material.side, THREE.FrontSide);
    const ray = (origin, direction) => new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction)).intersectObject(mesh);
    assert(ray([0, 100, 0], [0, -1, 0]).length > 0, 'le dessus doit rester visible');
    assert(ray([0, 0, -10], [0, 0, 1]).length > 0, 'la face avant doit rester visible');
    assert.equal(ray([0, 0, 10], [0, 0, -1]).length, 0, 'le dos doit rester traversant');
  });
}
