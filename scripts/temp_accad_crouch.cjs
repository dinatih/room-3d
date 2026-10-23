const fs = require('node:fs');
const T = require('three');
(async () => {
 const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} }); loader.register(() => ({ name:'SkeletonOnly', loadMesh:()=>Promise.resolve(new T.Group()) }));
 const read = async file => {const b=fs.readFileSync(file);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
 for(const id of ['male1','male2','female']) {
  const {scene,animations:[clip]}=await read(`public/animations/npz/accad/accad-crouch-${id}.glb`);
  const sample=time=>{for(const tr of clip.tracks){const [name,prop]=tr.name.split('.');scene.getObjectByName(name)[prop].fromArray(tr.createInterpolant().evaluate(time));}scene.updateMatrixWorld(true);};
  const rows=[];
  for(let frame=0;frame<clip.duration*30;frame+=10){sample(frame/30);rows.push({frame,feet:['Left','Right'].map(side=>['Foot','ToeBase'].map(part=>scene.getObjectByName(`mixamorig${side}${part}`).getWorldPosition(new T.Vector3()).toArray().map(v=>+(v*100).toFixed(2))))});}
  console.log(JSON.stringify({id,rows}));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
