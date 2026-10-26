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
    removeGlbBackFaces(mesh, 1.8);
    assert.equal(geometry.getIndex().count, 30, 'seule la face arrière doit être supprimée');
    assert.equal(mesh.material.side, THREE.FrontSide);
    const ray = (origin, direction) => new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction)).intersectObject(mesh);
    assert(ray([0, 100, 0], [0, -1, 0]).length > 0, 'le dessus doit rester visible');
    assert(ray([0, 0, -10], [0, 0, 1]).length > 0, 'la face avant doit rester visible');
    assert.equal(ray([0, 0, 10], [0, 0, -1]).length, 0, 'le dos doit rester traversant');
  });
}

it('conserve la traverse haute vue de dos sur les deux vrais modèles NISSEDAL', async () => {
  const { NodeIO } = require('@gltf-transform/core');
  const io = new NodeIO().registerExtensions(require('@gltf-transform/extensions').ALL_EXTENSIONS)
    .registerDependencies({ 'draco3d.decoder': await require('draco3d').createDecoderModule() });
  for (const id of ['30320321', '50320320']) {
    const doc = await io.read(`public/items/nissedal${id}/Nissedal${id}.glb`);
    const group = new THREE.Group();
    doc.getRoot().getDefaultScene().traverse(node => {
      for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(primitive.getAttribute('POSITION').getArray(), 3));
        if (primitive.getIndices()) geometry.setIndex(new THREE.BufferAttribute(primitive.getIndices().getArray(), 1));
        geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)
          .multiply(new THREE.Matrix4().fromArray(node.getWorldMatrix())).premultiply(new THREE.Matrix4().makeScale(100, 100, 100)));
        group.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()));
      }
    });
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const ray = new THREE.Raycaster(new THREE.Vector3(center.x, box.max.y - 0.7, box.max.z + 10), new THREE.Vector3(0, 0, -1));
    assert(ray.intersectObject(group).length > 0, `${id}: traverse présente dans le GLB source`);
    removeGlbBackFaces(group, 2.2);
    assert(ray.intersectObject(group).length > 0, `${id}: traverse visible de dos après filtrage`);
    ray.ray.origin.y = center.y;
    assert.equal(ray.intersectObject(group).length, 0, `${id}: panneau central traversant de dos`);
  }
});
