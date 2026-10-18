const assert = require('node:assert/strict');
const launchBrowser = require('./browser-test-options.cjs');

// A single self-contained harness: real GLB clips, retargeting, mixers and controller.
const harness = `<!doctype html><base href="/"><div id="root"></div><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type;
window.__vite_plugin_react_preamble_installed__=true;
</script><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import * as THREE from '/node_modules/.vite/deps/three.js';
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from '/node_modules/three/examples/jsm/loaders/DRACOLoader.js';
import {useAgentController} from '/src/features/scene/ai/useAgentController.ts';
import {useSceneStore} from '/src/features/scene/store/useSceneStore.ts';
import {getExitTransition} from '/src/features/scene/animations/animationTransitions.ts';
import {getAnimationDef, resolveAnimationId} from '/src/features/scene/animations/animationResolver.ts';
import {fitPostureTransition} from '/src/features/scene/animations/postureTransition.ts';
import {retargetClip} from '/src/features/scene/retargeting/retargetClip.ts';
import {extractCharacterParts} from '/src/features/scene/characterParts.ts';
import {setAgentProfile,getAgentProfile,registerObstacle,unregisterObstacle} from '/src/features/scene/ai/navigation/obstacles.ts';
import {rectangle} from '/src/features/scene/ai/navigation/geometry.ts';
import {cameraState} from '/src/features/scene/cameraState.ts';
const check = (ok, message) => { if (!ok) throw new Error(message); };
useSceneStore.setState(s => ({layers: {...s.layers, exitTransitions:true, animCrossfade:true, animOriginLerp:true}}));
cameraState.isSceneLaunched = true;
const root = ReactDOM.createRoot(document.getElementById('root'));
let sequence = [], agent;
function Harness() {
  agent = useAgentController('posture-check', sequence, false, () => ({x:125,y:0,z:150,rotY:0}));
  return null;
}
const mount = async next => {
  sequence = next;
  root.render(React.createElement(Harness));
  await new Promise(r => setTimeout(r, 30));
};
window.runChecks = async () => {
  const results = [];
  for (const pose of ['sitting-idle','laying','female-laying-pose-1','crouch-idle']) {
    const exit = getExitTransition(pose);
    check(exit && exit.duration === getAnimationDef(exit.anim).duration, 'registry duration: '+pose);
    for (let i=0;i<20;i++) check(getExitTransition(pose).anim === exit.anim, 'nondeterministic exit');
  }
  check(getExitTransition('sit-to-stand') === null, 'recursive transition');
  check(getExitTransition('walk') === null, 'walking transition');
  setAgentProfile('posture-check', {radius:10,height:173.4});
  for (const pose of ['sitting-idle','laying','female-laying-pose-1','crouch-idle']) {
    await mount([{type:'USE_OBJECT',targetPos:[125,0,150],animation:pose,duration:0.01}, {type:'WAIT',duration:1,animation:'idle'}]);
    agent.setPosition(125,0,150);
    for(let i=0;i<200 && agent.getStatus()!=='TRANSITIONING';i++) { agent.update(0.1); await new Promise(r=>setTimeout(r,5)); }
    check(agent.getStatus()==='TRANSITIONING','did not begin: '+pose+' ('+agent.getStatus()+')');
    const state = {...agent.update(0)};
    for(let i=0;i<100;i++) agent.update(0.1);
    check(agent.getStatus()==='TRANSITIONING','loading consumed clip duration');
    check(agent.update(0).x===state.x && agent.update(0).z===state.z,'moved while loading');
    agent.reportAnimationPlayback('unrelated',1,true);
    agent.update(0.1);
    check(agent.getStatus()==='TRANSITIONING','unrelated clip completed transition');
    agent.reportAnimationPlayback(state.animation,0.5,false);
    agent.update(0.1);
    check(agent.getStatus()==='TRANSITIONING','half clip completed transition');
    agent.reportAnimationPlayback(state.animation,1,true);
    agent.update(0.1);
    check(agent.getStatus()==='IDLE','real completion ignored');
    results.push({controller:pose,delayedPlayback:true});
  }
  // Replace a scenario halfway through a rise: preserve it and do not skip the new step.
  await mount([{type:'USE_OBJECT',targetPos:[125,0,150],animation:'sitting-idle',duration:0.01}]);
  for(let i=0;i<200 && agent.getStatus()!=='TRANSITIONING';i++) { agent.update(0.1); await new Promise(r=>setTimeout(r,5)); }
  agent.reportAnimationPlayback('sit-to-stand',0.5,false);
  agent.update(0.1);
  await mount([{type:'WAIT',duration:2,animation:'idle'}]);
  check(agent.getStatus()==='TRANSITIONING','interruption abandoned rise');
  agent.reportAnimationPlayback('sit-to-stand',1,true);
  agent.update(0.1); agent.update(0.1);
  check(agent.getStatus()==='INTERACTING','replacement first step was skipped');

  registerObstacle({id:'bed-west-test',owner:'bed-west',polygon:rectangle(125,150,40,40),yMin:0,yMax:45});
  await mount([
    {type:'USE_OBJECT',smartObjectId:'bed-west',slotId:'lie-down',targetPos:[125,45,150],animation:'laying',duration:0.01},
    {type:'MOVE_TO',smartObjectId:'bed-west',targetPos:[125,45,160],postureExit:true},
    {type:'MOVE_TO',smartObjectId:'bed-west',targetPos:[125,0,180],postureExit:true},
    {type:'WAIT',duration:1,animation:'idle'},
  ]);
  agent.setPosition(125,45,150);
  for(let i=0;i<200 && agent.getStatus()!=='TRANSITIONING';i++){agent.update(0.1);await new Promise(r=>setTimeout(r,5));}
  check(agent.getStatus()==='TRANSITIONING','bed did not begin its rise');
  const walls=[rectangle(95,150,10,100),rectangle(155,150,10,100),rectangle(125,120,100,10),rectangle(125,180,100,10)];
  walls.forEach((polygon,index)=>registerObstacle({id:'sealed-exit-'+index,owner:'sealed-exit',polygon,yMin:0,yMax:200}));
  const waiting=agent.update(0.1);
  check(waiting.animation==='laying' && waiting.animationPaused && agent.getStatus()==='TRANSITIONING','blocked rise abandoned its supported pose');
  walls.forEach((_,index)=>unregisterObstacle('sealed-exit-'+index));
  agent.reportAnimationPlayback('getting-up',1,true);
  agent.update(0.1);agent.update(0.1);
  check(agent.getStatus()==='INTERACTING','bed exit walked back onto the mattress');
  check(agent.update(0).y===0,'bed exit remained above the floor');
  unregisterObstacle('bed-west-test');

  const draco = new DRACOLoader(); draco.setDecoderPath('/draco/');
  const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  for (const modelPath of ['characters/lara/lara_native.glb','characters/alex/alex.glb','characters/gloria/gloria.glb']) {
    const model = (await loader.loadAsync('/'+modelPath)).scene;
    model.scale.setScalar(100); model.updateMatrixWorld(true);
    const parts = extractCharacterParts(model), hips = parts.bones.hips;
    check(hips,'missing model hips');
    const load = async key => {
      const def = getAnimationDef(key), gltf = await loader.loadAsync('/'+def.path);
      gltf.animations[0].name = def.id;
      return retargetClip(gltf.animations[0],model,gltf.scene,def.rootMotionSpace);
    };
    const idle = await load('idle');
    for (const pose of ['sitting-idle','sitting-2','female-sitting-pose-1','laying','female-laying-pose-1','crouch-idle']) {
      const mixer = new THREE.AnimationMixer(model);
      const source = await load(pose), exit = await load(getExitTransition(pose).anim);
      const from = mixer.clipAction(source).play(); mixer.update(0.1);
      const initial = hips.getWorldPosition(new THREE.Vector3());
      const untouched = Array.from(exit.tracks.find(t=>t.name===hips.name+'.position').values);
      const fitted = fitPostureTransition(exit,hips,idle);
      const to = mixer.clipAction(fitted).setLoop(THREE.LoopOnce,1);
      to.clampWhenFinished=true; to.reset().crossFadeFrom(from,0.4,false).play();
      mixer.update(0);
      check(hips.getWorldPosition(new THREE.Vector3()).distanceTo(initial)<0.001,'entry pelvis discontinuity: '+pose);
      const samples=[];
      for(let frame=0;frame<=Math.ceil(fitted.duration*60);frame++) {
        mixer.update(1/60);
        const p=hips.getWorldPosition(new THREE.Vector3());
        check(Number.isFinite(p.y),'nonfinite pelvis'); samples.push(p.y);
      }
      const end=hips.getWorldPosition(new THREE.Vector3());
      to.stop(); mixer.clipAction(idle).play(); mixer.update(0);
      check(hips.getWorldPosition(new THREE.Vector3()).distanceTo(end)<0.001,'standing pelvis discontinuity: '+pose);
      check(JSON.stringify(untouched)===JSON.stringify(Array.from(exit.tracks.find(t=>t.name===hips.name+'.position').values)),'mutated cached clip');
      results.push({model:modelPath,pose,startY:initial.y,endY:end.y,minY:Math.min(...samples)});
      mixer.stopAllAction(); mixer.uncacheRoot(model);
    }
  }
  draco.dispose();
  return results;
};
window.ready=true;
window.runLiveCheck = async (kind='sofa') => {
  const isToilet=kind==='toilet';
  const {Canvas} = await import('/node_modules/.vite/deps/@react-three_fiber.js');
  const {Character} = await import('/src/features/scene/character/Character.tsx');
  const {ArmrestSofa} = await import('/src/features/scene/items/ArmrestSofa.tsx');
  const {NavigationObstacle} = await import('/src/features/scene/ai/navigation/NavigationObstacle.tsx');
  const {AUTONOMOUS_NPC_IDS} = await import('/src/features/scene/characterConfig.ts');
  const {Toilet,TOILET_D} = await import('/src/features/scene/items/Toilet.tsx');
  const {BATH_WEST_WALL,BATH_NORTH_WALL} = await import('/src/features/scene/wallData.ts');
  AUTONOMOUS_NPC_IDS.delete('gloria');
  root.unmount();
  window.liveRoot?.unmount();
  window.liveCapture='loading';
  const container=document.createElement('div');
  container.style.cssText='width:800px;height:600px'; document.body.append(container);
  const liveRoot=ReactDOM.createRoot(container);
  window.liveRoot=liveRoot;
  let scene;
  const fixture=isToilet
    ? React.createElement('group',{position:[BATH_WEST_WALL+60,1,BATH_NORTH_WALL+TOILET_D/2+1.5]},
        React.createElement(React.Suspense,{fallback:null},React.createElement(NavigationObstacle,{id:'toilet'},React.createElement(Toilet,{item:{},actionState:{},onSize:()=>{}}))))
    : React.createElement('group',{position:[270,0,-110],rotation:[0,-Math.PI/2,0]},
        React.createElement(NavigationObstacle,{id:'sofa-garden-east'},React.createElement(ArmrestSofa,{item:{},actionState:{},onSize:()=>{}})));
  liveRoot.render(React.createElement(Canvas,{camera:{position:isToilet?[220,180,700]:[30,210,130],near:1,far:3000},
    onCreated:state=>{scene=state.scene;state.camera.layers.enableAll();state.camera.lookAt(...(isToilet?[50,65,510]:[270,75,-110]));}},
    React.createElement('ambientLight',{intensity:2}),
    fixture,
    React.createElement(React.Suspense,{fallback:null},React.createElement(Character,{
      id:'gloria',name:'Posture live',modelPath:'characters/gloria/gloria.glb',
      isLara:false,targetHeight:168,isActive:true,isNPC:false,npcPosition:isToilet?[50,0,560]:[200,0,-80],
    }))));
  useSceneStore.setState(s=>({layers:{...s.layers,showAllLaraStyles:true,laraCount:15,npcCollisions:true}}));
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let group;
  for(let i=0;i<300;i++) { group=scene?.getObjectByName('Posture live');if(group?.visible)break;await pause(50); }
  check(group?.visible,'live Character failed to mount');
  const waitForAnim=async name=>{
    for(let i=0;i<600;i++){if(cameraState.positions['gloria']?.anim===name)return;await pause(50);}
    throw new Error('Live Character did not play '+name+' (actual: '+cameraState.positions['gloria']?.anim+')');
  };
  document.dispatchEvent(new CustomEvent('agent-force-smartobject',{detail:{targetId:'gloria',objectId:isToilet?'toilet':'sofa-garden-east',slotId:isToilet?'use':'seat-1',animation:'sitting-idle'}}));
  await waitForAnim('sitting-idle'); await pause(600);
  window.liveCapture='sitting';
  const {resolveTargetBoneName} = await import('/src/features/scene/retargeting/boneResolver.ts');
  const hips=group.getObjectByName(resolveTargetBoneName(group,'Hips'));
  check(hips,'live Character hips missing');
  const measure=()=>Object.fromEntries(['Hips','LeftUpLeg','LeftLeg','LeftFoot','RightFoot'].map(name=>{
    const bone=group.getObjectByName(resolveTargetBoneName(group,name));
    return [name,bone?.getWorldPosition(new THREE.Vector3()).toArray()];
  }));
  const seated=measure();
  let seat;
  scene.traverse(object=>{if(isToilet?object.name==='seat':object.userData.seatSurface)seat=new THREE.Box3().setFromObject(object);});
  check(seat,'missing real seat surface');
  if(isToilet){
    check(seated.Hips[2]>=seat.min.z && seated.Hips[2]<=seat.max.z,'pelvis missed the toilet seat');
    check(seated.LeftLeg[2]>seat.max.z,'toilet knee is inside the seat');
  }else{
    check(seated.Hips[0]>=seat.min.x && seated.Hips[0]<=seat.max.x,'seated pelvis is behind the cushion: '+JSON.stringify({seated,seat}));
    check(seated.LeftLeg[0]<seat.min.x,'seated knee is inside the cushion');
  }
  let sawTransition=false, last=hips.getWorldPosition(new THREE.Vector3()), maxStep=0;
  let blockedAt=0, frozenPose, released=false;
  const profile=getAgentProfile('gloria'), initialRoot=group.position.clone();
  const start=performance.now();
  while(performance.now()-start<20000){
    const anim=cameraState.positions['gloria']?.anim;
    if(anim==='sit-to-stand'){sawTransition=true;window.liveCapture='rising';}
    const next=hips.getWorldPosition(new THREE.Vector3());maxStep=Math.max(maxStep,next.distanceTo(last));last=next;
    if(!isToilet && sawTransition && !blockedAt && initialRoot.x-group.position.x>profile.radius/4){
      registerObstacle({id:'posture-blocker',owner:'posture-blocker',yMin:0,yMax:profile.height,
        polygon:rectangle(group.position.x-profile.radius*1.5,group.position.z,profile.radius/2,profile.height*2)});
      blockedAt=performance.now();
    }
    if(blockedAt && !released){
      const elapsed=performance.now()-blockedAt;
      if(elapsed>400 && !frozenPose)frozenPose=hips.getWorldPosition(new THREE.Vector3());
      if(elapsed>800){
        check(frozenPose.distanceTo(hips.getWorldPosition(new THREE.Vector3()))<0.001,'rise kept playing while its exit was blocked');
        unregisterObstacle('posture-blocker');released=true;
      }
    }
    if(sawTransition && anim===resolveAnimationId('idle'))break;
    await pause(16);
  }
  check(sawTransition,'live renderer never played rise');
  check(isToilet || released,'blocked-exit regression did not run');
  check(cameraState.positions['gloria']?.anim!== 'sit-to-stand','live renderer stuck in rise');
  check(maxStep<20,'live pelvis discontinuity: '+maxStep);
  check(isToilet?measure().Hips[2]>seat.max.z:measure().Hips[0]<seat.min.x,'character stood up inside the fixture');
  return {liveCharacter:kind,maxPelvisStep:maxStep,seated,standing:measure()};
};
</script>`;

(async () => {
  const browser = await launchBrowser({args:['--no-sandbox']});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
    page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
    await page.setRequestInterception(true);
    page.on('request', request => request.url().endsWith('/scripts/temp_posture_transitions.html')
      ? request.respond({status:200,contentType:'text/html',body:harness}) : request.continue());
    await page.goto((process.env.ROOM_TEST_URL || 'http://127.0.0.1:5183')+'/scripts/temp_posture_transitions.html');
    await page.waitForFunction(()=>window.ready, {timeout:60000});
    const result = await page.evaluate(()=>window.runChecks());
    assert.deepEqual(errors, []);
    console.log(JSON.stringify(result,null,2));
    const liveCheck=page.evaluate(()=>window.runLiveCheck());
    await page.waitForFunction(()=>window.liveCapture==='sitting',{timeout:60000});
    await page.screenshot({path:'/tmp/room-posture-sitting.png'});
    await page.waitForFunction(()=>window.liveCapture==='rising',{timeout:30000});
    await page.screenshot({path:'/tmp/room-posture-rising.png'});
    console.log(JSON.stringify(await liveCheck));
    assert.deepEqual(errors, []);
    await page.screenshot({path:'/tmp/room-posture-standing.png'});
    console.log(JSON.stringify(await page.evaluate(()=>window.runLiveCheck('toilet'))));
    assert.deepEqual(errors, []);
    await page.screenshot({path:'/tmp/room-toilet-standing.png'});
    console.log('Posture checks passed: real clips on three rigs, actual sofa and toilet, blocked exits, bed departure, delayed playback and scenario interruption.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
