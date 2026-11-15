const {it}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('three');
require('../support/load-ts.cjs');
const {getPreparedLaptopScene,prepareLaptopScene}=require('../../src/features/scene/items/prepareLaptopScene.ts');
function model(){
    const root=new THREE.Group(),material=new THREE.MeshStandardMaterial();
    for(const x of [0,2]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(),material);mesh.position.x=x;root.add(mesh);}
    return root;
}
it('ne prépare qu’une fois la même source, même après cinquante reprises de rendu',()=>{
    const source=model(),clone=source.clone;let calls=0;
    source.clone=function(...args){calls++;return clone.apply(this,args);};
    const template=getPreparedLaptopScene(source);
    for(let retry=0;retry<50;retry++)assert.equal(getPreparedLaptopScene(source),template);
    assert.equal(calls,1);
    assert.equal(source.children.length,2);
    assert.equal(source.userData.merged,undefined);
    assert.equal(template.children.length,1);
    assert.equal(template.userData.merged,true);
});
it('conserve la géométrie et les propriétés du prétraitement original avec des instances indépendantes',()=>{
    const source=model(),template=getPreparedLaptopScene(source),reference=prepareLaptopScene(source);
    assert.deepEqual(template.children[0].geometry.attributes.position.array,reference.children[0].geometry.attributes.position.array);
    assert.deepEqual(template.children[0].geometry.index.array,reference.children[0].geometry.index.array);
    assert.equal(template.children[0].castShadow,reference.children[0].castShadow);
    assert.equal(template.children[0].receiveShadow,reference.children[0].receiveShadow);
    const first=template.clone(true),second=template.clone(true);
    first.position.x=10;first.children[0].visible=false;first.children[0].layers.set(4);
    assert.equal(second.position.x,0);assert.equal(second.children[0].visible,true);assert.equal(second.children[0].layers.mask,1);
    assert.equal(first.children[0].geometry,second.children[0].geometry);
});
it('recalcule la préparation quand la source GLTF change',()=>{
    const first=model(),second=model();
    assert.notEqual(getPreparedLaptopScene(first),getPreparedLaptopScene(second));
});
