const {it}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('three');
const {load}=require('../support/load-ts.cjs');
const {simplifySceneGlass}=require('../../src/features/scene/utils/sceneGlass.ts');

it('preserves masked opaque regions, UV sampling and source images; releases only its own resources',()=>{
 const pixels=new Uint8ClampedArray([0,0,0,255,255,0,0,255]);let written;
 const image={width:2,height:1},canvas={getContext:()=>({drawImage:source=>assert.equal(source,image),getImageData:()=>({data:pixels}),putImageData:data=>{written=[...data.data]}})};
 const previous=global.document;global.document={createElement:()=>canvas};
 try{
  const map=new THREE.Texture(image);map.channel=1;map.flipY=false;map.wrapS=THREE.RepeatWrapping;map.offset.set(.25,.5);map.repeat.set(2,3);
  const source=new THREE.MeshPhysicalMaterial({transmission:1,transmissionMap:map,ior:1.5,roughness:.2});
  const opaque=new THREE.MeshStandardMaterial(),geometry=new THREE.BoxGeometry();
  const root=new THREE.Group(),a=new THREE.Mesh(geometry,[source,opaque]),b=new THREE.Mesh(geometry,source);root.add(a,b);
  const cleanup=simplifySceneGlass(root),glass=b.material;
  assert.notEqual(glass,source);assert.equal(a.material[0],glass);assert.equal(a.material[1],opaque);
  assert.equal(glass.transmission,0);assert.equal(glass.transparent,true);assert.equal(glass.depthWrite,false);
  assert.equal(glass.roughness,.2);assert.equal(glass.transmissionMap,null);
  assert.deepEqual(written,[255,255,255,255,10,10,10,255]);
  assert.equal(glass.alphaMap.image,canvas);assert.equal(map.image,image);assert.notEqual(glass.alphaMap.source,map.source);
  for(const key of ['channel','flipY','wrapS'])assert.equal(glass.alphaMap[key],map[key]);
  assert.deepEqual(glass.alphaMap.offset.toArray(),[.25,.5]);assert.deepEqual(glass.alphaMap.repeat.toArray(),[2,3]);
  assert.equal(a.geometry,geometry);assert.equal(source.transmission,1);
  const disposed=[];for(const resource of [map,source,opaque,geometry,glass,glass.alphaMap])resource.addEventListener('dispose',()=>disposed.push(resource));
  cleanup();assert.equal(b.material,source);assert.deepEqual(a.material,[source,opaque]);assert.deepEqual(disposed,[glass,glass.alphaMap]);
 }finally{global.document=previous;}
});

it('approximates untextured glass without mutating a shared preview material',()=>{
 const source=new THREE.MeshPhysicalMaterial({transmission:.5,opacity:.4,transparent:true,ior:1.5});const mesh=new THREE.Mesh(new THREE.BoxGeometry(),source);
 const cleanup=simplifySceneGlass(mesh);
 assert.ok(Math.abs(mesh.material.opacity-.208)<1e-12);assert.equal(source.opacity,.4);assert.equal(source.transmission,.5);cleanup();assert.equal(mesh.material,source);
});

it('applies the approximation only in the main scene, leaving detailed previews untouched',()=>{
 const context={};
 for(const [inScene, graphicsQualityPreset] of [[false,'mid'],[true,'mid'],[true,'high']]){
  const root=new THREE.Group(),events=[];
  const {useSceneGlass}=load('src/features/scene/utils/useSceneGlass.ts',{
   react:{useContext:value=>{assert.equal(value,context);return inScene},useLayoutEffect:fn=>{const cleanup=fn();if(cleanup)cleanup()}},
   '../useGLTFClone':{SceneModelContext:context},'./sceneGlass':{simplifySceneGlass:value=>{assert.equal(value,root);events.push('apply');return()=>events.push('release')}},
   '../store/useSceneStore':{useSceneStore:select=>select({graphicsQualityPreset})}
  });
  useSceneGlass(root);assert.deepEqual(events,inScene&&graphicsQualityPreset!=='high'?['apply','release']:[]);
 }
});
