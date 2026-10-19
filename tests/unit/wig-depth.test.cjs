const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const THREE = require('three');
const { updateWigDepth } = require('../../src/features/scene/utils/wigDepth.ts');
describe('Profondeur des perruques sans découpe des mèches fines', () => {
    it('ne change pas les matériaux visibles et ne mesure que la couverture complètement opaque', () => {
        const map = new THREE.Texture(), alphaMap = new THREE.Texture();
        const mat = new THREE.MeshStandardMaterial({ map, alphaMap, transparent: true, opacity: .8, depthWrite: false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), mat); mesh.layers.set(4);
        updateWigDepth(mesh);
        assert.equal(mesh.material, mat); assert.equal(mat.transparent, true); assert.equal(mat.alphaTest, 0); assert.equal(mat.opacity, .8);
        const pass = mesh.children[0], depth = pass.material;
        assert.equal(pass.geometry, mesh.geometry); assert.equal(pass.layers.mask, mesh.layers.mask);
        assert.equal(pass.castShadow, false); assert.equal(pass.receiveShadow, false);
        assert.equal(depth.map, map); assert.equal(depth.alphaMap, alphaMap); assert.equal(depth.opacity, .8);
        assert.equal(depth.alphaTest, 1); assert.equal(depth.colorWrite, false); assert.equal(depth.depthWrite, true);
        assert.equal(depth.transparent, false); assert.equal(depth.alphaHash, false);
    });
    it('partage les os, les morphs, les transformations de liaison et les bornes du même personnage', () => {
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3));
        const source = new THREE.SkinnedMesh(geo, new THREE.MeshStandardMaterial({ transparent: true }));
        source.skeleton = new THREE.Skeleton([new THREE.Bone()]);
        source.bindMatrix.makeTranslation(1, 2, 3); source.bindMatrixInverse.copy(source.bindMatrix).invert();
        source.morphTargetInfluences = [.25]; source.morphTargetDictionary = { expression: 0 };
        source.boundingSphere = new THREE.Sphere(new THREE.Vector3(1, 2, 3), 5);
        updateWigDepth(source);
        const pass = source.children[0];
        assert(pass.isSkinnedMesh); assert.equal(pass.skeleton, source.skeleton);
        assert.equal(pass.morphTargetInfluences, source.morphTargetInfluences); assert.equal(pass.morphTargetDictionary, source.morphTargetDictionary);
        assert(pass.bindMatrix.equals(source.bindMatrix)); assert(pass.bindMatrixInverse.equals(source.bindMatrixInverse));
        assert.equal(pass.boundingSphere, source.boundingSphere);
        source.boundingSphere.radius = 10; assert.equal(pass.boundingSphere.radius, 10);
        assert.equal(pass.userData.__ownedWigSkeleton, undefined, 'The shared skeleton must not be disposed a second time');
    });
    it('remplace et libère le matériau de profondeur sans détruire les ressources GLTF partagées', () => {
        const geo = new THREE.PlaneGeometry(), texture = new THREE.Texture();
        const mat = new THREE.MeshStandardMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geo, mat);
        let depthDisposed = 0, sharedDisposed = 0;
        for (const resource of [geo, texture, mat]) resource.addEventListener('dispose', () => sharedDisposed++);
        updateWigDepth(mesh); mesh.children[0].material.addEventListener('dispose', () => depthDisposed++);
        updateWigDepth(mesh);
        assert.equal(mesh.children.length, 1); assert.equal(depthDisposed, 1); assert.equal(sharedDisposed, 0);
        mat.transparent = false; updateWigDepth(mesh); assert.equal(mesh.children.length, 0);
        assert.equal(sharedDisposed, 0);
    });
    it('ignore les éléments opaques et conserve les groupes multi-matériaux', () => {
        const opaque = new THREE.MeshStandardMaterial(), hair = new THREE.MeshStandardMaterial({ transparent: true });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), opaque); updateWigDepth(mesh); assert.equal(mesh.children.length, 0);
        mesh.material = [opaque, hair]; updateWigDepth(mesh);
        assert.equal(mesh.children[0].material[0].visible, false); assert.equal(mesh.children[0].material[1].visible, true);
        assert.equal(mesh.material[0], opaque); assert.equal(mesh.material[1], hair);
    });
});
