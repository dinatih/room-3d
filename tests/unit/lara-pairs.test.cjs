const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const bounds = require('../../src/features/scene/utils/animatedFrustumCulling.ts');
const helper = import('three/examples/jsm/utils/BufferGeometryUtils.js').then(utils => load('src/features/scene/character/mergeLaraPairs.ts', {
    three: THREE, 'three/examples/jsm/utils/BufferGeometryUtils.js': utils,
    '../utils/animatedFrustumCulling': bounds,
}).mergeLaraPairs);
const pairs = [['eye2','eyes'], ['handgun_left','handgun_right'], ['handgun_left_holster','handgun_right_holster']];
const parts = load('src/features/scene/characterParts.ts', {
    three: THREE,
    './characterConfig': { ACCESSORIES_MESH_NAMES: pairs.flat().filter(name=>name.includes('handgun')) },
    './retargeting/index': { resolveTargetBoneName: ()=>null, getDepth: ()=>0 },
});
const {updateCharacterLayers} = load('src/features/scene/character/characterLayers.ts', {
    three: THREE, '@config': { LAYER_WALKER: 1, LAYER_WALKER_DETAIL: 2 }, '../characterParts': parts,
});
function make(shared) {
    const root = new THREE.Group(), bones = [new THREE.Bone(), new THREE.Bone()];
    root.add(...bones); root.updateMatrixWorld(true);
    const skeleton = new THREE.Skeleton(bones);
    for (const [pairIndex, names] of pairs.entries()) for (const [side, name] of names.entries()) {
        let geometry = shared?.getObjectByName(name)?.geometry;
        if (!geometry) {
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([side*5,0,0, side*5+1,0,0, side*5,1,0],3));
            geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array.from({length:3},()=>[side,0,0,0]).flat(),4));
            geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Array.from({length:3},()=>[1,0,0,0]).flat(),4));
            geometry.setIndex([0,1,2]);
        }
        const material = new THREE.MeshStandardMaterial({color: pairIndex * 0x111111}); material.name = name;
        const mesh = new THREE.SkinnedMesh(geometry,material); mesh.name = name; root.add(mesh); mesh.bind(skeleton,new THREE.Matrix4());
        bounds.enableAnimatedFrustumCulling(mesh);
    }
    return root;
}
it('fusionne les paires sans changer leurs triangles ni leur skinning et renouvelle les bornes', async () => {
    const merge = await helper, original = make(), root = make(original);
    merge(root);
    for (const y of [0,4,-2]) {
        original.children[1].position.y = root.children[1].position.y = y;
        original.updateMatrixWorld(true); root.updateMatrixWorld(true);
        for (const [left,right] of pairs) {
            const merged = root.getObjectByName(left);
            assert.equal(root.getObjectByName(right),undefined);
            assert.equal(merged.geometry.index.count,6);
            assert.equal(merged.geometry.groups.length,0);
            for (const [side,name] of [left,right].entries()) for(let i=0;i<3;i++) {
                const expected = original.getObjectByName(name).getVertexPosition(i,new THREE.Vector3());
                assert.ok(expected.distanceTo(merged.getVertexPosition(side*3+i,new THREE.Vector3()))<1e-12);
                assert.ok(expected.distanceTo(merged.boundingSphere.center)<=merged.boundingSphere.radius+1e-12);
            }
        }
    }
    const geometry = root.getObjectByName('eye2').geometry;
    merge(root); assert.equal(root.getObjectByName('eye2').geometry,geometry);
});
it('partage les géométries fusionnées entre clones et garde leurs matériaux indépendants', async () => {
    const merge = await helper, first = make(), second = make(first);
    merge(first);merge(second);
    for(const [name] of pairs) {
        assert.equal(first.getObjectByName(name).geometry,second.getObjectByName(name).geometry);
        assert.notEqual(first.getObjectByName(name).material,second.getObjectByName(name).material);
        assert.notEqual(first.getObjectByName(name).skeleton,second.getObjectByName(name).skeleton);
    }
});
it('refuse une paire dont le matériau ou le squelette a changé', async () => {
    const merge = await helper;
    const differentMaterial=make();differentMaterial.getObjectByName('eyes').material.color.set('red');
    assert.throws(()=>merge(differentMaterial),/Incompatible Lara pair/);
    const differentSkeleton=make();differentSkeleton.getObjectByName('eyes').skeleton=new THREE.Skeleton([new THREE.Bone()]);
    assert.throws(()=>merge(differentSkeleton),/Incompatible Lara pair/);
});
it('préserve les modes équipement, les ombres et le masquage de tête en FPV', async () => {
    const merge = await helper, before=make(), after=make();merge(after);
    const original=parts.extractCharacterParts(before), merged=parts.extractCharacterParts(after);
    const triangles = root => {
        const totals={};root.traverse(mesh=>{
            if(!mesh.isMesh||!mesh.visible)return;
            const key=`${mesh.layers.mask}:${mesh.castShadow}`;
            totals[key]=(totals[key]??0)+mesh.geometry.index.count/3;
        });return totals;
    };
    for(const equipment of [undefined,'dual-pistols','holstered','shower']) for(const enabled of [true,false]) for(const fpv of [true,false]) {
        for(const [root,character] of [[before,original],[after,merged]]) {
            parts.applyClothingAndAccessoriesVisibility(character,{laraTop:'native',laraBottom:'native',laraShoes:true,showAccessories:enabled,laraPistols:enabled,equipment:{holster:true,pistols:true,backpack:true},animationEquipment:equipment});
            parts.applyRenderProperties(character,{characterShadows:enabled,showWallhack:false,characterWireframe:false});
            updateCharacterLayers(root,fpv);
        }
        assert.deepEqual(triangles(after),triangles(before));
    }
});
