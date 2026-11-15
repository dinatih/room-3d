const {it}=require('node:test');const assert=require('node:assert/strict');const T=require('three');
require('../support/load-ts.cjs');
const {createLaraShadowBatching}=require('../../src/features/scene/utils/laraShadowBatches.ts');
const {enableAnimatedFrustumCulling}=require('../../src/features/scene/utils/animatedFrustumCulling.ts');
function model(geometries){
 const root=new T.Group(),bone=new T.Bone(),tip=new T.Bone();tip.position.y=1;bone.add(tip);root.add(bone);
 const skeleton=new T.Skeleton([bone,tip]);const meshes=[];
 for(let i=0;i<3;i++){
  const g=geometries?.[i]??new T.BoxGeometry(1,1,1).translate(i*2,1,0);
  if(!g.getAttribute('skinIndex')){g.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(g.attributes.position.count*4).fill(1),4));const w=new Float32Array(g.attributes.position.count*4);for(let j=0;j<w.length;j+=4)w[j]=1;g.setAttribute('skinWeight',new T.Float32BufferAttribute(w,4));}
  const mesh=new T.SkinnedMesh(g,new T.MeshStandardMaterial());mesh.castShadow=true;root.add(mesh);mesh.bind(skeleton);meshes.push(mesh);enableAnimatedFrustumCulling(mesh);
 }
 root.updateMatrixWorld(true);return{root,meshes,tip,geometries:meshes.map(m=>m.geometry)};
}
function install(models,draw){
 const scene=new T.Scene();for(const m of models)scene.add(m.root);scene.updateMatrixWorld(true);
 const c=createLaraShadowBatching(models.map(m=>m.root));
 const original=function(){draw();return 42;};const renderer={shadowMap:{render:original,enabled:true,autoUpdate:true,needsUpdate:false,type:T.PCFShadowMap}};
 const uninstall=c.install(renderer,scene);return{c,uninstall,render:(lights=[])=>renderer.shadowMap.render(lights,scene,new T.Camera())};
}
it('fusionne les skins en profondeur et conserve les sommets animés et les bornes de toutes les pièces',()=>{
 const m=model(),materials=m.meshes.map(mesh=>mesh.material),descriptor=Object.getOwnPropertyDescriptor(m.meshes[0],'boundingSphere');
 const check=install([m],()=>{
  const first=m.meshes[0];assert.deepEqual(m.meshes.map(mesh=>mesh.castShadow),[true,false,false]);
  assert.deepEqual(Object.keys(first.geometry.attributes).sort(),['position','skinIndex','skinWeight']);
  let offset=0;const a=new T.Vector3(),b=new T.Vector3();
  for(let j=0;j<m.meshes.length;j++){
   const mesh=m.meshes[j],proxy=mesh.clone();proxy.geometry=m.geometries[j];
   for(let i=0;i<proxy.geometry.attributes.position.count;i++){
    proxy.getVertexPosition(i,a);first.getVertexPosition(offset+i,b);assert(a.distanceTo(b)<1e-6);assert(first.boundingSphere.containsPoint(a));
   }
   offset+=proxy.geometry.attributes.position.count;
  }
 });
 for(const angle of [0,.5,-.7]){m.tip.rotation.z=angle;m.root.updateMatrixWorld(true);m.meshes[0].skeleton.update();assert.equal(check.render(),42);assert.deepEqual(m.meshes.map(mesh=>mesh.geometry),m.geometries);assert.deepEqual(m.meshes.map(mesh=>mesh.material),materials);assert.deepEqual(Object.getOwnPropertyDescriptor(m.meshes[0],'boundingSphere'),descriptor);}
 assert.equal(check.c.stats().builds,1);check.uninstall();check.c.dispose();
});
it('suit les masquages et ne conserve que les géométries des combinaisons encore utilisées',()=>{
 const m=model();let count=3;const check=install([m],()=>{assert.equal(m.meshes[0].geometry.attributes.position.count,count*24);});
 check.render();m.meshes[2].visible=false;count=2;check.render();assert.equal(check.c.stats().geometries,1);assert.equal(check.c.stats().builds,2);
 m.meshes[2].visible=true;count=3;check.render();assert.equal(check.c.stats().geometries,1);check.uninstall();check.c.dispose();assert.equal(check.c.stats().bytes,0);
});
it('partage les buffers entre acteurs compatibles mais conserve leurs squelettes et poses indépendants',()=>{
 const a=model(),b=model(a.geometries);let geometry;
 const check=install([a,b],()=>{geometry=a.meshes[0].geometry;assert.equal(geometry,b.meshes[0].geometry);assert.notEqual(a.meshes[0].skeleton,b.meshes[0].skeleton);});
 check.render();assert.equal(check.c.stats().geometries,1);assert.equal(check.c.stats().builds,1);let disposed=0;geometry.addEventListener('dispose',()=>disposed++);
 check.uninstall();check.c.dispose();assert.equal(disposed,1);
});
it('laisse les masques alpha et morphs sur leur rendu normal et restaure après exception',()=>{
 const m=model();m.meshes[2].material.alphaTest=.5;
 const check=install([m],()=>{assert.deepEqual(m.meshes.map(mesh=>mesh.castShadow),[true,false,true]);throw Error('depth');});
 assert.throws(check.render,/depth/);assert.deepEqual(m.meshes.map(mesh=>mesh.geometry),m.geometries);assert(m.meshes.every(mesh=>mesh.castShadow));check.uninstall();check.c.dispose();
});
it('n’utilise pas une ancienne géométrie après un masque de corps ou une mise à jour d’attribut',()=>{
 for(const change of [g=>{g.attributes.position.needsUpdate=true;},g=>g.setIndex(g.index.clone()),g=>{g.index.needsUpdate=true;}]){
  const m=model();let modified=false;
  const check=install([m],()=>{assert.equal(m.meshes[0].geometry.attributes.position.count,modified?48:72);assert.equal(m.meshes[2].castShadow,modified);});
  check.render();change(m.meshes[2].geometry);modified=true;check.render();check.uninstall();check.c.dispose();
 }
});
it('partage un contrôleur par renderer et le retire au démontage de la dernière Lara',()=>{
 const {registerLaraShadowBatching,getLaraShadowBatching}=require('../../src/features/scene/utils/laraShadowBatches.ts');
 const a=model(),b=model(a.geometries),scene=new T.Scene();scene.add(a.root,b.root);scene.updateMatrixWorld(true);
 const original=()=>{};const renderer={shadowMap:{render:original,enabled:true,autoUpdate:true,needsUpdate:false,type:T.PCFShadowMap}};
 const removeA=registerLaraShadowBatching(renderer,scene,a.root),controller=getLaraShadowBatching(renderer);
 const removeB=registerLaraShadowBatching(renderer,scene,b.root);assert.equal(getLaraShadowBatching(renderer),controller);
 renderer.shadowMap.render([],scene,new T.Camera());assert.equal(controller.stats().geometries,1);
 removeA();assert.equal(getLaraShadowBatching(renderer),controller);assert.equal(controller.stats().geometries,1);
 removeB();assert.equal(getLaraShadowBatching(renderer),undefined);assert.equal(renderer.shadowMap.render,original);assert.equal(controller.stats().bytes,0);
});
it('exclut les morphs et laisse les cheveux découpés produire leur ombre normale',()=>{
 const m=model();m.meshes[2].geometry.morphAttributes.position=[m.geometries[2].attributes.position.clone()];m.meshes[2].updateMorphTargets();
 const check=install([m],()=>{assert.deepEqual(m.meshes.map(mesh=>mesh.castShadow),[true,false,true]);assert.equal(m.meshes[0].geometry.attributes.position.count,48);});
 check.render();check.uninstall();check.c.dispose();
});
it('ignore les acteurs masqués par un parent et conserve le cache pour leur réapparition',()=>{
 const m=model();let hidden=false;
 const check=install([m],()=>assert.equal(m.meshes[0].geometry.attributes.position.count,hidden?24:72));
 check.render();m.root.visible=false;hidden=true;check.render();assert.equal(check.c.stats().builds,1);
 m.root.visible=true;hidden=false;check.render();assert.equal(check.c.stats().builds,1);check.uninstall();check.c.dispose();
});

it('conserve les callbacks d’ombres personnalisés sur leur mesh d’origine',()=>{
 const m=model();m.meshes[2].onBeforeShadow=()=>{};
 const check=install([m],()=>{assert.deepEqual(m.meshes.map(mesh=>mesh.castShadow),[true,false,true]);assert.equal(m.meshes[2].geometry,m.geometries[2]);});
 check.render();check.uninstall();check.c.dispose();
});
it('préserve les ombres cubiques et permet le diagnostic sans regroupement',()=>{
 const m=model();let unbatched=false;
 const check=install([m],()=>assert.equal(m.meshes[0].geometry.attributes.position.count,unbatched?24:72));
 check.render();unbatched=true;check.render([new T.PointLight()]);check.c.state.enabled=false;check.render();
 check.uninstall();check.c.dispose();
});
