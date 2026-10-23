// Bake horizontal toe contacts into the source leg rotations; no runtime correction.
const fs = require('node:fs');
const THREE = require('three');
const file = 'public/animations/mixamo/anim_snake_hip_hop_dance.glb';
// Contact intervals annotated on the 30 FPS source, separated by its foot lifts.
const contacts = {
 Left: [[0,108],[148,181],[194,355],[400,435],[454,458]],
 Right: [[0,85],[103,127],[134,143],[170,198],[205,326],[354,402],[436,458]],
};
const v = () => new THREE.Vector3();
const world = bone => bone.getWorldPosition(v());
function aim(bone, child, target) {
 const origin = world(bone), rotation = bone.getWorldQuaternion(new THREE.Quaternion());
 const swing = new THREE.Quaternion().setFromUnitVectors(world(child).sub(origin).normalize(), target.clone().sub(origin).normalize());
 bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(swing.multiply(rotation)));
 bone.updateWorldMatrix(false, true);
}
async function main() {
 const bytes = fs.readFileSync(file);
 const {GLTFLoader} = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader(); loader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new THREE.Group())}));
 const {scene,animations:[clip]}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const track = clip.tracks.find(t=>t.name==='mixamorigHips.position');
 if (track.times.length !== 459 || Math.abs(clip.duration-15.3)>1e-5) throw Error('Unexpected source timing '+track.times.length+' '+clip.duration);
 const evaluators=clip.tracks.map(t=>({node:scene.getObjectByName(t.name.split('.')[0]),prop:t.name.split('.')[1],interpolant:t.createInterpolant()}));
 const sample = i => {for(const {node,prop,interpolant} of evaluators)node[prop].fromArray(interpolant.evaluate(track.times[i]));scene.updateMatrixWorld(true);};
 const output = new Map(), legs = [];
 let maxError=0, before=0;
 for (const [side, spans] of Object.entries(contacts)) {
  const [hip,knee,foot,toe]=['UpLeg','Leg','Foot','ToeBase'].map(part=>scene.getObjectByName(`mixamorig${side}${part}`));
  const points=Array.from(track.times,(_,i)=>{sample(i);return world(toe);});
  const anchors=spans.map(([a,b],index)=> {
   if(index===0 || index===spans.length-1) return points[0].clone();
   const median=axis=>points.slice(a,b+1).map(p=>p[axis]).sort((a,b)=>a-b)[Math.floor((b-a)/2)];
   return new THREE.Vector3(median('x'),0,median('z'));
  });
  const deltas=points.map((p,i)=>{
   let index=spans.findIndex(([a,b])=>i>=a&&i<=b);
   if(index>=0)return anchors[index].clone().sub(p).setY(0);
   index=spans.findIndex(([a])=>a>i);
   if(index<=0)throw Error('Uncovered frame');
   const end=spans[index-1][1],start=spans[index][0],t=(i-end)/(start-end),blend=t*t*(3-2*t);
   return anchors[index-1].clone().sub(points[end]).lerp(anchors[index].clone().sub(points[start]),blend).setY(0);
  });
  legs.push({hip,knee,foot,toe,points,deltas,spans});
  for(const bone of [hip,knee,foot])output.set(bone.name,new Float32Array(track.times.length*4));
 }
 const hips=scene.getObjectByName('mixamorigHips'), positions=track.values.slice();
 for(let i=0;i<track.times.length;i++) {
  sample(i);
  // Lower the pelvis only when a planted leg would otherwise overextend.
  let drop=0;
  const targets=new Map();
  for(const {hip,knee,foot,deltas} of legs) {
   const a=world(hip),b=world(knee),c=world(foot),target=c.clone().add(deltas[i]);
   targets.set(foot,target);
   const length=a.distanceTo(b)+b.distanceTo(c),horizontal=Math.hypot(a.x-target.x,a.z-target.z);
   if(horizontal>=length)throw Error('Unreachable horizontal contact');
   const ceiling=target.y+Math.sqrt(length*length-horizontal*horizontal);
   if(a.y>=ceiling)drop=Math.max(drop,a.y-ceiling+2 ** -23 * length * 8);
  }
  const shift=new THREE.Vector3(0,-drop,0).applyMatrix3(new THREE.Matrix3().setFromMatrix4(hips.parent.matrixWorld).invert());
  hips.position.add(shift);hips.position.toArray(positions,i*3);scene.updateMatrixWorld(true);
  for(const {hip,knee,foot,toe,points,deltas,spans} of legs) {
   const a=world(hip), b=world(knee), c=world(foot), target=targets.get(foot);
   const footRotation=foot.getWorldQuaternion(new THREE.Quaternion());
   const upper=a.distanceTo(b), lower=b.distanceTo(c), direction=target.clone().sub(a), distance=direction.length();
   if(distance>=upper+lower || distance<=Math.abs(upper-lower))throw Error(`Unreachable ${hip.name} contact at ${i}: ${distance} vs ${upper+lower}, drop ${drop}`);
   direction.normalize();
   const bend=b.clone().sub(a).addScaledVector(direction,-b.clone().sub(a).dot(direction)).normalize();
   const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
   const joint=a.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(upper*upper-along*along));
   aim(hip,knee,joint); aim(knee,foot,target);
   foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(footRotation));
   scene.updateMatrixWorld(true);
   maxError=Math.max(maxError,world(toe).distanceTo(points[i].clone().add(deltas[i])));
   for(const bone of [hip,knee,foot])bone.quaternion.toArray(output.get(bone.name),i*4);
   if(spans.some(([a,b])=>i>=a&&i<=b))before=Math.max(before,deltas[i].length());
  }
 }
 if(maxError>1e-6)throw Error(`Contact bake residual ${maxError}`);
 const jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength));
 for(const channel of gltf.animations[0].channels) {
  const name=gltf.nodes[channel.target.node].name.replace(/[:_]/g,'');
  const isHips=channel.target.path==='translation'&&name===hips.name;
  if(!isHips&&(channel.target.path!=='rotation'||!output.has(name)))continue;
  const accessor=gltf.accessors[gltf.animations[0].samplers[channel.sampler].output],view=gltf.bufferViews[accessor.bufferView],values=isHips?positions:output.get(name),width=isHips?3:4;
  if(accessor.componentType!==5126||accessor.count*width!==values.length)throw Error('Unsupported rotation accessor');
  const offset=28+jsonLength+(view.byteOffset||0)+(accessor.byteOffset||0);
  for(let i=0;i<accessor.count;i++)for(let axis=0;axis<width;axis++)bytes.writeFloatLE(values[i*width+axis],offset+i*(view.byteStride||width*4)+axis*4);
  for(const key of ['min','max'])if(accessor[key])accessor[key]=Array.from({length:width},(_,axis)=>Math[key](...Array.from({length:accessor.count},(_,i)=>values[i*width+axis])));
  output.delete(name);
 }
 if(output.size)throw Error('Missing rotation channels');
 const json=Buffer.from(JSON.stringify(gltf)),padded=Buffer.alloc(Math.ceil(json.length/4)*4,0x20);json.copy(padded);
 const header=Buffer.from(bytes.subarray(0,20));header.writeUInt32LE(padded.length,12);header.writeUInt32LE(20+padded.length+bytes.length-20-jsonLength,8);
 if(process.argv.includes('--write'))fs.writeFileSync(file,Buffer.concat([header,padded,bytes.subarray(20+jsonLength)]));
 console.log(JSON.stringify({written:process.argv.includes('--write'),frames:track.times.length,duration:clip.duration,bytes:bytes.length,maxOriginalContactDriftCm:before*100,maxBakeErrorCm:maxError*100}));
}
function annotate() {
 const bytes=fs.readFileSync(file),length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length));
 const channel=gltf.animations[0].channels.find(c=>c.target.path==='translation'&&gltf.nodes[c.target.node].name.replace(/[:_]/g,'')==='mixamorigHips');
 const accessor=gltf.accessors[gltf.animations[0].samplers[channel.sampler].input],view=gltf.bufferViews[accessor.bufferView];
 const time=i=>bytes.readFloatLE(28+length+(view.byteOffset||0)+(accessor.byteOffset||0)+i*4);
 gltf.scenes[gltf.scene||0].extras={...gltf.scenes[gltf.scene||0].extras,footContacts:Object.entries(contacts).flatMap(([side,spans])=>spans.map(([a,b])=>({side,start:time(a),end:time(b)})))};
 const json=Buffer.from(JSON.stringify(gltf)),padded=Buffer.alloc(Math.ceil(json.length/4)*4,0x20);json.copy(padded);
 const header=Buffer.from(bytes.subarray(0,20));header.writeUInt32LE(padded.length,12);header.writeUInt32LE(20+padded.length+bytes.length-20-length,8);
 fs.writeFileSync(file,Buffer.concat([header,padded,bytes.subarray(20+length)]));
 console.log('Authored foot contacts saved in GLB scene extras');
}
async function visual() {
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true},plugins:[{name:'snake-visual',configureServer(server){
  server.middlewares.use('/__snake_test',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0"><script type="module" src="/@vite/client"></script></body></html>');});
 }}]});
 let browser;
 try {
  await server.listen();
  browser=await require('./browser-test-options.cjs')({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage();await page.setViewport({width:1000,height:620});
  page.on('pageerror',error=>console.error('PAGE',error));
  await page.goto('http://127.0.0.1:5173/__snake_test');
  await page.evaluate(async()=>{
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
   const {retargetClip}=await import('/src/features/scene/retargeting/retargetClip.ts');
   const {extractCharacterParts,applyClothingAndAccessoriesVisibility}=await import('/src/features/scene/characterParts.ts');
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,620);document.body.append(renderer.domElement);
   const scene=new THREE.Scene();scene.background=new THREE.Color('#dddddd');
   scene.add(new THREE.HemisphereLight(0xffffff,0x555555,3));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(100,250,200);scene.add(sun);
   const grid=new THREE.GridHelper(1000,100,0x555555,0x999999);scene.add(grid);
   const camera=new THREE.PerspectiveCamera(35,1000/620,1,2000);camera.position.set(80,220,650);camera.lookAt(0,85,0);
   const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
   const sourceLoader=new GLTFLoader();sourceLoader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new THREE.Group())}));
   const actors=[];
   for(const [index,label]of ['Avant : GLB seul','Après : appuis respectés sur Lara'].entries()) {
    const source=await sourceLoader.loadAsync('/animations/mixamo/anim_snake_hip_hop_dance.glb');source.animations[0].name='snake-hip-hop-dance';
    if(!index)delete source.scene.userData.footContacts;
    const model=(await loader.loadAsync('/characters/lara/lara_native.glb')).scene;
    model.scale.multiplyScalar(100);model.updateMatrixWorld(true);
    model.traverse(node=>{node.defaultPosition=node.position.clone();node.restLocalQuaternion=node.quaternion.clone();node.restWorldQuaternion=node.getWorldQuaternion(new THREE.Quaternion());});
    const clip=retargetClip(source.animations[0],model,source.scene);
    const parts=extractCharacterParts(model);
    applyClothingAndAccessoriesVisibility(parts,{laraTop:'native',laraBottom:'native',laraShoes:true,showAccessories:true,laraPistols:true,equipment:{holster:true,pistols:true,backpack:true}});
    model.position.x=index?110:-110;scene.add(model);
    const mixer=new THREE.AnimationMixer(model),action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();actors.push(mixer);
    const caption=document.createElement('div');caption.textContent=label;caption.style.cssText=`position:absolute;top:10px;left:${index?55:8}%;font:18px sans-serif`;document.body.append(caption);
   }
   window.renderSnake=time=>{for(const mixer of actors)mixer.setTime(time);scene.updateMatrixWorld(true);renderer.render(scene,camera);};
   window.renderSnake(0);
  });
  fs.mkdirSync('/tmp/snake-before-after',{recursive:true});
  for(let frame=0;frame<=Math.ceil(15.3*4);frame++) {
   await page.evaluate(time=>window.renderSnake(time),Math.min(frame/4,15.3));
   await page.screenshot({path:`/tmp/snake-before-after/${String(frame).padStart(3,'0')}.png`});
  }
  console.log('Visual comparison frames: /tmp/snake-before-after');
 } finally {if(browser)await browser.close();await server.close();}
}
Promise.resolve().then(()=>process.argv.includes('--visual')?visual():process.argv.includes('--annotate')?annotate():main()).catch(e=>{console.error(e);process.exitCode=1;});
