const {it}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('three');
require('../support/load-ts.cjs');
const {registerStaticShadowBatches,installStaticShadowBatching,staticShadowBatching}=require('../fixtures/static-shadow-batches.ts');
function fixture(callback=()=>{}){
    const scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
    for(let i=0;i<3;i++){
        const geometry=new THREE.BoxGeometry().translate(i*2,0,0);
        const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:i+1}));
        mesh.castShadow=true;group.add(mesh);
    }
    const meshes=group.children,geometries=meshes.map(m=>m.geometry),materials=meshes.map(m=>m.material);
    const original=function(lights,s,camera){assert.equal(this,renderer.shadowMap);callback(meshes,s,camera);return 42;};
    const renderer={shadowMap:{render:original,enabled:true,autoUpdate:true,needsUpdate:false,type:THREE.PCFShadowMap}};
    const unregister=registerStaticShadowBatches(scene,meshes),uninstall=installStaticShadowBatching(renderer,scene);
    return {scene,meshes,geometries,materials,renderer,original,unregister,uninstall,
        draw:(s=scene)=>renderer.shadowMap.render([],s,new THREE.Camera()),
        restored:()=>{assert.deepEqual(meshes.map(m=>m.geometry),geometries);assert.deepEqual(meshes.map(m=>m.material),materials);assert(meshes.every(m=>m.castShadow));}};
}
it('fusionne uniquement la profondeur : mêmes positions, matériaux et géométries beauté restaurés',()=>{
    const f=fixture(meshes=>{
        assert.deepEqual(meshes.map(m=>m.castShadow),[true,false,false]);
        const geometry=meshes[0].geometry;
        assert.deepEqual(Object.keys(geometry.attributes),['position']);
        assert.equal(geometry.index.count,108);
        assert.deepEqual([...geometry.attributes.position.array],f.geometries.flatMap(g=>[...g.attributes.position.array]));
        assert.equal(meshes[0].material.map,null);
        assert(geometry.boundingSphere.radius>2);
    });
    assert.equal(f.draw(),42);f.restored();f.uninstall();assert.equal(f.renderer.shadowMap.render,f.original);f.unregister();
});
it('préserve les masquages, calques, transformations, matériaux modifiés et politiques de culling',()=>{
    for(const change of [m=>{m.visible=false;},m=>{m.layers.set(3);},m=>{m.position.x=2;m.updateMatrix();},m=>{m.material.wireframe=true;},m=>{m.frustumCulled=false;}]){
        const f=fixture(meshes=>{assert.equal(meshes[0].geometry,f.geometries[0]);assert(meshes.every(m=>m.castShadow));});
        change(f.meshes[1]);f.draw();f.restored();f.unregister();f.uninstall();
    }
});
it('ne supprime jamais une alpha découpe, une déformation ou un matériau de profondeur personnalisé',()=>{
    for(const change of [m=>{m.material.alphaTest=.5;},m=>{m.material.transparent=true;},m=>{m.material.displacementMap=new THREE.Texture();},m=>{m.customDepthMaterial=new THREE.MeshDepthMaterial();},m=>{m.material.clippingPlanes=[new THREE.Plane()];}]){
        const f=fixture(meshes=>{assert.equal(meshes[0].geometry,f.geometries[0]);assert(meshes.every(m=>m.castShadow));});
        change(f.meshes[0]);f.draw();f.restored();f.unregister();f.uninstall();
    }
});
it('respecte les toggles d’ombres et exclut VSM, les autres scènes et le diagnostic désactivé',()=>{
    for(const change of [f=>{f.renderer.shadowMap.type=THREE.VSMShadowMap;},f=>{f.renderer.shadowMap.enabled=false;},f=>{f.renderer.shadowMap.autoUpdate=false;},()=>{staticShadowBatching.enabled=false;}]){
        const f=fixture(meshes=>{assert.equal(meshes[0].geometry,f.geometries[0]);});
        try{change(f);f.draw();f.restored();}finally{staticShadowBatching.enabled=true;f.unregister();f.uninstall();}
    }
    const f=fixture(meshes=>assert.equal(meshes[0].geometry,f.geometries[0]));f.draw(new THREE.Scene());f.unregister();f.uninstall();
});
it('restaure les sources après une exception et libère les buffers au démontage',()=>{
    let geometry,material;
    const f=fixture(meshes=>{geometry=meshes[0].geometry;material=meshes[0].material;throw Error('driver');});
    assert.throws(()=>f.draw(),/driver/);f.restored();
    let disposed=0;geometry.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
    f.unregister();assert.equal(disposed,2);f.uninstall();
});
it('préserve les ombres cubiques des lumières ponctuelles et les désactivations individuelles',()=>{
    const f=fixture(meshes=>assert.equal(meshes[0].geometry,f.geometries[0]));
    const point=new THREE.PointLight();point.castShadow=true;
    f.renderer.shadowMap.render([point],f.scene,new THREE.Camera());f.restored();
    f.meshes[1].castShadow=false;f.draw();assert.deepEqual(f.meshes.map(m=>m.castShadow),[true,false,true]);
    f.unregister();f.uninstall();
});
