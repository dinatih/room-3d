const fs = require('node:fs');
const launchBrowser = require('./browser-test-options.cjs');
async function main() {
 const browser = await launchBrowser({ args: ['--no-sandbox'] });
 try {
  const page = await browser.newPage();
  page.on('console', msg => { console.log(msg.text()); });
  await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5176'}/AGENTS.md`);
  const result = await page.evaluate(async () => {
   window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
   const THREE = await import('/node_modules/.vite/deps/three.js');
   const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
   const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
   const { ANIMATION_DEFINITIONS } = await import('/src/features/scene/animations/animationRegistry.ts');
   const { extractCharacterParts, applyClothingAndAccessoriesVisibility } = await import('/src/features/scene/characterParts.ts');
   const { retargetClip } = await import('/src/features/scene/retargeting/index.ts');
   const loader = new GLTFLoader(); loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/')); loader.setMeshoptDecoder(MeshoptDecoder);
   const targets=[];
   for(const path of ['ybot/ybot.glb','lara/lara_native.glb']) {
    const target=(await loader.loadAsync('/characters/'+path)).scene; target.updateMatrixWorld(true);
    const parts=extractCharacterParts(target);
    if(path.startsWith('lara')) applyClothingAndAccessoriesVisibility(parts,{laraShoes:true,laraTop:'native',laraBottom:'native',showAccessories:false,laraPistols:false,equipment:{holster:false,pistols:false,backpack:false}});
    const rest=[]; target.traverse(o=>{if(o.isBone)rest.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);});
    targets.push({target,rest,path});
   }
   const rows=[]; const snapshots=[];
   for(const def of ANIMATION_DEFINITIONS.filter(d=>d.category==='yoga')) {
    const gltf=await loader.loadAsync('/'+def.path); const raw=gltf.animations[0].clone(); raw.name=def.id;
    for(const {target,rest,path} of targets) {
     for(const [o,p,q,s] of rest){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);} target.updateMatrixWorld(true);
     const clip=retargetClip(raw,target,gltf.scene,def.rootMotionSpace);
     const hipsTrack = clip.tracks.find(t=>t.name.endsWith('.position'));
     const referenceRaw = raw.clone(); referenceRaw.name = 'yoga-reference';
     const reference = retargetClip(referenceRaw,target,gltf.scene,def.rootMotionSpace);
     const referenceHips = reference.tracks.find(t=>t.name===hipsTrack?.name);
     if (!hipsTrack || !referenceHips || !hipsTrack.values.every((value,index)=>value===referenceHips.values[index])) throw Error(`Posture name changes hips motion: ${def.id} / ${path}`);
     const mixer=new THREE.AnimationMixer(target); mixer.clipAction(clip).play();
     const measurements=[];
     for(const fraction of [0,0.25,0.5,0.75,0.99]) {
      mixer.setTime(clip.duration*fraction);target.updateMatrixWorld(true);
      let min=Infinity; target.traverseVisible(o=>{if(o.isSkinnedMesh){o.skeleton.update();const p=new THREE.Vector3();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,p).applyMatrix4(o.matrixWorld);min=Math.min(min,p.y);}}});
      if (!Number.isFinite(min)) throw Error(`Invalid mesh bounds: ${def.id} / ${path}`);
      measurements.push(min);
     }
     rows.push({id:def.id,target:path,min:measurements});
     if(def.id.includes('bharadvajas') || /yoga-(corpse|tree|supported-headstand|random-movements-jumps)/.test(def.id)) snapshots.push({target,clip,path,id:def.id});
     mixer.stopAllAction();mixer.uncacheRoot(target);
    }
   }
   window.yogaGrounding={THREE,targets,snapshots};return rows;
  });
  const output=process.env.YOGA_REPORT || '/tmp/yoga-grounding.json';fs.writeFileSync(output,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result.filter(r=>r.id.includes('bharadvajas')),null,2));console.log(`${result.length} target/clip combinations: ${output}`);
  await page.setViewport({width:1500,height:900,deviceScaleFactor:1});
  await page.evaluate(()=>{
   const {THREE,targets,snapshots}=window.yogaGrounding; document.body.innerHTML='';document.body.style.margin='0';
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1500,900);renderer.setClearColor(0xd2d2d2);document.body.appendChild(renderer.domElement);renderer.setScissorTest(true);
   const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x777777,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,5,4);scene.add(light);
   scene.add(new THREE.GridHelper(8,40));const camera=new THREE.PerspectiveCamera(40,500/450,0.01,100);
   const selected=snapshots.filter(s=>s.id.includes('bharadvajas'));
   selected.forEach(({target,clip,path,id},index)=>{
    const {rest}=targets.find(t=>t.target===target);for(const[o,p,q,s]of rest){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}scene.add(target);
    const mixer=new THREE.AnimationMixer(target);mixer.clipAction(clip).play();mixer.setTime(clip.duration/2);target.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(target,true);const center=box.getCenter(new THREE.Vector3()); center.y = 0.65; camera.position.copy(center).add(new THREE.Vector3(2,1.2,3));camera.lookAt(center);
    const x=Math.floor(index/2)*500,y=(1-index%2)*450;renderer.setViewport(x,y,500,450);renderer.setScissor(x,y,500,450);renderer.render(scene,camera);
    const label=document.createElement('div');label.textContent=id+' '+path;Object.assign(label.style,{position:'absolute',left:`${x+10}px`,top:`${900-y-440}px`,font:'13px sans-serif'});document.body.appendChild(label);
    mixer.stopAllAction();mixer.uncacheRoot(target);scene.remove(target);
   });
  });
  await page.screenshot({path:output.replace('.json','.png')});
 } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
