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
import {setAgentProfile} from '/src/features/scene/ai/navigation/obstacles.ts';
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

  const draco = new DRACOLoader(); draco.setDecoderPath('/draco/');
  const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  for (const modelPath of ['characters/lara/lara_native.glb','characters/alex/alex.glb']) {
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
window.runLiveCheck = async () => {
  const {Canvas} = await import('/node_modules/.vite/deps/@react-three_fiber.js');
  const {Character} = await import('/src/features/scene/character/Character.tsx');
  root.unmount();
  const container=document.createElement('div');
  container.style.cssText='width:800px;height:600px'; document.body.append(container);
  const liveRoot=ReactDOM.createRoot(container);
  let scene;
  liveRoot.render(React.createElement(Canvas,{camera:{position:[400,300,400],near:1,far:3000},
    onCreated:state=>{scene=state.scene;state.camera.layers.enableAll();state.camera.lookAt(100,80,-80);}},
    React.createElement('ambientLight',{intensity:2}),
    React.createElement(React.Suspense,{fallback:null},React.createElement(Character,{
      id:'posture-live',name:'Posture live',modelPath:'characters/lara/lara_native.glb',
      isLara:true,targetHeight:173.4,isActive:true,isNPC:false,npcPosition:[100,0,-80],
    }))));
  useSceneStore.setState(s=>({layers:{...s.layers,showAllLaraStyles:true,laraCount:15}}));
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let group;
  for(let i=0;i<300;i++) { group=scene?.getObjectByName('Posture live');if(group?.visible)break;await pause(50); }
  check(group?.visible,'live Character failed to mount');
  const waitForAnim=async name=>{
    for(let i=0;i<600;i++){if(cameraState.positions['posture-live']?.anim===name)return;await pause(50);}
    throw new Error('Live Character did not play '+name+' (actual: '+cameraState.positions['posture-live']?.anim+')');
  };
  document.dispatchEvent(new CustomEvent('agent-force-smartobject',{detail:{targetId:'posture-live',objectId:'sofa-garden-west',slotId:'seat-1',animation:'sitting-idle'}}));
  await waitForAnim('sitting-idle'); await pause(600);
  window.liveCapture='sitting';
  const hips=group.getObjectByName('pelvis') || group.getObjectByName('hips');
  check(hips,'live Character hips missing');
  let sawTransition=false, last=hips.getWorldPosition(new THREE.Vector3()), maxStep=0;
  const start=performance.now();
  while(performance.now()-start<20000){
    const anim=cameraState.positions['posture-live']?.anim;
    if(anim==='sit-to-stand'){sawTransition=true;window.liveCapture='rising';}
    const next=hips.getWorldPosition(new THREE.Vector3());maxStep=Math.max(maxStep,next.distanceTo(last));last=next;
    if(sawTransition && anim===resolveAnimationId('idle'))break;
    await pause(16);
  }
  check(sawTransition,'live renderer never played rise');
  check(cameraState.positions['posture-live']?.anim!== 'sit-to-stand','live renderer stuck in rise');
  check(maxStep<20,'live pelvis discontinuity: '+maxStep);
  return {liveCharacter:true,maxPelvisStep:maxStep};
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
    console.log('Posture checks passed: real clips on two rigs, pelvis continuity, immutable caches, delayed playback and scenario interruption.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
