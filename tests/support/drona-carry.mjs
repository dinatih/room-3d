import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { extractCharacterParts } from '/src/features/scene/characterParts.ts';
import trajectories from '/src/features/scene/animations/dronaCarryMotion.json';
import { resolveTargetBoneName } from '/src/features/scene/retargeting/boneResolver.ts';
import { fitDronaCarry } from '/src/features/scene/animations/fitDronaCarry.ts';
import { retargetClip } from '/src/features/scene/retargeting/retargetClip.ts';
import { sampleDronaMotion } from '/src/features/scene/items/dronaPlayback.ts';
import { buildSmartObjectInstructionSequence, getSmartObject } from '/src/features/scene/ai/smartObjectRegistry.ts';

const loader = new GLTFLoader();
const draco=new DRACOLoader();draco.setDecoderPath('/draco/');loader.setDRACOLoader(draco);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#dee6eb');
scene.add(new THREE.HemisphereLight(0xffffff,0x545463,3));
const light = new THREE.DirectionalLight(0xffffff,3);light.position.set(-180,300,250);scene.add(light);
const renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1200,800);document.body.style.margin='0';document.body.append(renderer.domElement);
const camera = new THREE.PerspectiveCamera(35,1.5,1,2000);
let actors=[];
function box(w,h,d,color,x,y,z){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.8}));mesh.position.set(x,y,z);scene.add(mesh);return mesh;
}
// Open topped prop: the free hand must be visible inside, rather than through a solid cube.
const model=await loader.loadAsync('/items/dröna/DRÖNA_low.glb');
let mesh;model.scene.traverse(node=>{if(node.isMesh)mesh=node;});
const geometry=mesh.geometry.clone();geometry.scale(99.5,99.5,99.5);geometry.rotateY(Math.PI/2);geometry.computeBoundingBox();
const centre=geometry.boundingBox.getCenter(new THREE.Vector3());geometry.translate(-centre.x,-centre.y,-centre.z);
const prop=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xcc0000,side:THREE.DoubleSide}));scene.add(prop);
const environment=new THREE.Group();scene.add(environment);
const sources={};
for(const variant of ['pyjama','upper'])for(const phase of ['pull','search','push'])sources[`${variant}-${phase}`]=await loader.loadAsync(`/animations/custom/${variant}_${phase}.glb`);
const rigs={};
for(const [id,path]of [['xbot','xbot/Xbot_official.glb'],['vivida','lara/lara_native.glb']])rigs[id]=await loader.loadAsync('/characters/'+path);

export async function check(){
 const result=[];
 for(const [id,height] of [['drona-se-pyjama',145.75],['drona-nw-upper',136.25]]){
  const sequence=buildSmartObjectInstructionSequence(id,'pick-item','vivida');
  const steps=sequence.filter(s=>s.dronaMotion);
  if(steps.length!==3||steps.some(s=>!s.waitForAnimation))throw Error('Invalid carry sequence '+id);
  if(Math.abs(getSmartObject(id).slots[0].offset[1])>1e-6)throw Error('Actor must stand on the floor');
  result.push({id,height,steps:steps.map(s=>s.animation)});
 }
 return result;
}
export async function pose(character,variant,phase,time,view='front'){
 for(const a of actors)scene.remove(a);actors=[];
 const {clone}=await import('three/examples/jsm/utils/SkeletonUtils.js');
 const rig=clone(rigs[character].scene);extractCharacterParts(rig);rig.scale.setScalar(100);rig.updateMatrixWorld(true);
 const source=sources[`${variant}-${phase}`];
 const raw=source.animations[0].clone();raw.name=`drona-${variant}-${phase}`;
 const retargeted=retargetClip(raw,rig,clone(source.scene));retargeted.name=raw.name;
 const clip=fitDronaCarry(retargeted,rig);
 const mixer=new THREE.AnimationMixer(rig);const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.setTime(time);
 scene.add(rig);actors.push(rig);rig.updateMatrixWorld(true);
 const height=variant==='pyjama'?145.75:136.25;
 environment.clear();
 for(const [w,h,d,x,y,z]of [[40.5,3.5,39,0,height-18.25,62],[40.5,3.5,39,0,height+18.25,62],[3.5,33,39,-18.5,height,62],[3.5,33,39,18.5,height,62]]){
  const plank=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0xf2f1eb}));plank.position.set(x,y,z);environment.add(plank);
 }

 const motion=sampleDronaMotion({action:'test',animation:`drona-${variant}-${phase}`},time/clip.duration);
 prop.position.set(motion.position[0],motion.position[1]+height,motion.position[2]+62);
 camera.position.set(...(view==='front'?[-230,190,-300]:[300,180,-100]));camera.lookAt(5,105,25);
 renderer.render(scene,camera);
 const contacts=trajectories[raw.name],frame=Math.round(time/clip.duration*(contacts.positions.length-1));
 let maxPalmErrorCm=0;
 if(contacts.weights[frame]===1)for(const side of ['Left','Right']){
  const hand=rig.getObjectByName(resolveTargetBoneName(rig,side+'Hand'));
  const middle=rig.getObjectByName(resolveTargetBoneName(rig,side+'HandMiddle1'));
  const palm=hand.getWorldPosition(new THREE.Vector3()).lerp(middle.getWorldPosition(new THREE.Vector3()),.65);
  maxPalmErrorCm=Math.max(maxPalmErrorCm,palm.distanceTo(new THREE.Vector3().fromArray(contacts.hands[side].palms[frame])));
 }
 if(maxPalmErrorCm>.05)throw Error(`${character} ${raw.name}: palm error ${maxPalmErrorCm} cm`);
 const hands={};rig.traverse(b=>{if(/(LeftHand|RightHand|left_wrist|right_wrist)$/.test(b.name))hands[b.name]=b.getWorldPosition(new THREE.Vector3()).toArray();});
 return {character,variant,phase,time,maxPalmErrorCm,duration:clip.duration,hands,box:prop.position.toArray(),bounds:new THREE.Box3().setFromObject(rig).getSize(new THREE.Vector3()).toArray()};
}
window.dronaTest={pose,check};
