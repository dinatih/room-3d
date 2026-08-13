import fs from 'fs';
import { NodeIO, Document } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression])
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const CC3_TO_MIXAMO = {
  'CC_Base_Hip': 'Hips', 'CC_Base_Pelvis': 'Pelvis', 'CC_Base_L_Thigh': 'LeftUpLeg', 'CC_Base_L_Calf': 'LeftLeg',
  'CC_Base_L_Foot': 'LeftFoot', 'CC_Base_L_ToeBase': 'LeftToeBase', 'CC_Base_R_Thigh': 'RightUpLeg',
  'CC_Base_R_Calf': 'RightLeg', 'CC_Base_R_Foot': 'RightFoot', 'CC_Base_R_ToeBase': 'RightToeBase',
  'CC_Base_Waist': 'Spine', 'CC_Base_Spine01': 'Spine1', 'CC_Base_Spine02': 'Spine2', 'CC_Base_NeckTwist01': 'Neck',
  'CC_Base_Head': 'Head', 'CC_Base_L_Clavicle': 'LeftShoulder', 'CC_Base_L_Upperarm': 'LeftArm',
  'CC_Base_L_Forearm': 'LeftForeArm', 'CC_Base_L_Hand': 'LeftHand', 'CC_Base_L_Thumb1': 'LeftHandThumb1',
  'CC_Base_L_Thumb2': 'LeftHandThumb2', 'CC_Base_L_Thumb3': 'LeftHandThumb3', 'CC_Base_L_Index1': 'LeftHandIndex1',
  'CC_Base_L_Index2': 'LeftHandIndex2', 'CC_Base_L_Index3': 'LeftHandIndex3', 'CC_Base_L_Mid1': 'LeftHandMiddle1',
  'CC_Base_L_Mid2': 'LeftHandMiddle2', 'CC_Base_L_Mid3': 'LeftHandMiddle3', 'CC_Base_L_Ring1': 'LeftHandRing1',
  'CC_Base_L_Ring2': 'LeftHandRing2', 'CC_Base_L_Ring3': 'LeftHandRing3', 'CC_Base_L_Pinky1': 'LeftHandPinky1',
  'CC_Base_L_Pinky2': 'LeftHandPinky2', 'CC_Base_L_Pinky3': 'LeftHandPinky3', 'CC_Base_R_Clavicle': 'RightShoulder',
  'CC_Base_R_Upperarm': 'RightArm', 'CC_Base_R_Forearm': 'RightForeArm', 'CC_Base_R_Hand': 'RightHand',
  'CC_Base_R_Thumb1': 'RightHandThumb1', 'CC_Base_R_Thumb2': 'RightHandThumb2', 'CC_Base_R_Thumb3': 'RightHandThumb3',
  'CC_Base_R_Index1': 'RightHandIndex1', 'CC_Base_R_Index2': 'RightHandIndex2', 'CC_Base_R_Index3': 'RightHandIndex3',
  'CC_Base_R_Mid1': 'RightHandMiddle1', 'CC_Base_R_Mid2': 'RightHandMiddle2', 'CC_Base_R_Mid3': 'RightHandMiddle3',
  'CC_Base_R_Ring1': 'RightHandRing1', 'CC_Base_R_Ring2': 'RightHandRing2', 'CC_Base_R_Ring3': 'RightHandRing3',
  'CC_Base_R_Pinky1': 'RightHandPinky1', 'CC_Base_R_Pinky2': 'RightHandPinky2', 'CC_Base_R_Pinky3': 'RightHandPinky3'
};
const BONE_MAP = Object.fromEntries(Object.entries(CC3_TO_MIXAMO).map(([k, v]) => [k, 'mixamorig:' + v]));

function quatInverse(q){return [-q[0],-q[1],-q[2],q[3]];}
function quatMultiply(a,b){return [a[0]*b[3]+a[3]*b[0]+a[1]*b[2]-a[2]*b[1],a[1]*b[3]+a[3]*b[1]+a[2]*b[0]-a[0]*b[2],a[2]*b[3]+a[3]*b[2]+a[0]*b[1]-a[1]*b[0],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
function quatNormalize(q){let l=Math.sqrt(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]+q[3]*q[3]);if(l===0)return[0,0,0,1];return[q[0]/l,q[1]/l,q[2]/l,q[3]/l];}
function applyQuatToVec3(q,v){const ix=q[3]*v[0]+q[1]*v[2]-q[2]*v[1],iy=q[3]*v[1]+q[2]*v[0]-q[0]*v[2],iz=q[3]*v[2]+q[0]*v[1]-q[1]*v[0],iw=-q[0]*v[0]-q[1]*v[1]-q[2]*v[2];return[ix*q[3]+iw*-q[0]+iy*-q[2]-iz*-q[1],iy*q[3]+iw*-q[1]+iz*-q[0]-ix*-q[2],iz*q[3]+iw*-q[2]+ix*-q[1]-iy*-q[0]];}

function evalPos(sampler, t, restPos) {
  if (!sampler) return restPos;
  const inArr = sampler.getInput().getArray();
  const outArr = sampler.getOutput().getArray();
  let idx = 0;
  while (idx < inArr.length - 1 && inArr[idx + 1] <= t) idx++;
  return [outArr[idx * 3], outArr[idx * 3 + 1], outArr[idx * 3 + 2]];
}

function evalRot(sampler, t, restRot) {
  if (!sampler) return restRot;
  const inArr = sampler.getInput().getArray();
  const outArr = sampler.getOutput().getArray();
  let idx = 0;
  while (idx < inArr.length - 1 && inArr[idx + 1] <= t) idx++;
  return [outArr[idx * 4], outArr[idx * 4 + 1], outArr[idx * 4 + 2], outArr[idx * 4 + 3]];
}

async function run() {
  const doc = await io.read('/home/dinatih/Projects/room-3d/public/models/miley_all_animations.glb.bak');
  for (const node of doc.getRoot().listNodes()) {
    if (BONE_MAP[node.getName()]) node.setName(BONE_MAP[node.getName()]);
  }
  const rootNode = doc.getRoot().listNodes().find(n => n.getName() === 'CC_Base_BoneRoot');
  const qRest = rootNode ? Array.from(rootNode.getRotation()) : [0,0,0,1];
  const pRest = rootNode ? Array.from(rootNode.getTranslation()) : [0,0,0];
  const qRestInv = quatInverse(qRest);

  for (const anim of doc.getRoot().listAnimations()) {
    let rPC=null, rRC=null, hPC=null, hRC=null;
    for (const ch of anim.listChannels()) {
      const t=ch.getTargetNode(); if(!t)continue;
      const n=t.getName(), p=ch.getTargetPath();
      if(n==='CC_Base_BoneRoot'){if(p==='translation')rPC=ch;if(p==='rotation')rRC=ch;}
      if(n==='mixamorig:Hips'){if(p==='translation')hPC=ch;if(p==='rotation')hRC=ch;}
    }
    if(!hPC||!hRC)continue;
    const hPS=hPC.getSampler(),hRS=hRC.getSampler();
    const rPS=rPC?rPC.getSampler():null,rRS=rRC?rRC.getSampler():null;
    const hT=hPS.getInput().getArray(),hV=hPS.getOutput().getArray();
    const hRT=hRS.getInput().getArray(),hRV=hRS.getOutput().getArray();
    const nP=new Float32Array(hV.length);
    for(let i=0;i<hT.length;i++){
      const t=hT[i],rP=evalPos(rPS,t,pRest),rR=evalRot(rRS,t,qRest);
      const qD=quatNormalize(quatMultiply(qRestInv,rR));
      const hP=[hV[i*3],hV[i*3+1],hV[i*3+2]];
      const rPL=applyQuatToVec3(qRestInv,rP),hPR=applyQuatToVec3(qD,hP);
      nP[i*3]=rPL[0]+hPR[0];nP[i*3+1]=rPL[1]+hPR[1];nP[i*3+2]=rPL[2]+hPR[2];
    }
    const nR=new Float32Array(hRV.length);
    for(let i=0;i<hRT.length;i++){
      const t=hRT[i],rR=evalRot(rRS,t,qRest);
      const qD=quatNormalize(quatMultiply(qRestInv,rR));
      const hR=[hRV[i*4],hRV[i*4+1],hRV[i*4+2],hRV[i*4+3]];
      const fR=quatNormalize(quatMultiply(qD,hR));
      nR[i*4]=fR[0];nR[i*4+1]=fR[1];nR[i*4+2]=fR[2];nR[i*4+3]=fR[3];
    }
    hPS.setOutput(doc.createAccessor().setType('VEC3').setArray(nP));
    hRS.setOutput(doc.createAccessor().setType('VEC4').setArray(nR));
  }
  
  await io.write('/home/dinatih/Projects/room-3d/public/models/miley_all_animations_fixed.glb', doc);
}
run();
