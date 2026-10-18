// Run against npm run dev. Uses the real GLB loader and application retargeter.
const fs = require('node:fs');
const launchBrowser = require('./browser-test-options.cjs');

(async () => {
  const graphicsArgs = process.argv.includes('--hardware-gpu')
    ? ['--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface']
    : ['--enable-unsafe-swiftshader'];
  const browser = await launchBrowser({args: ['--no-sandbox', '--disable-dev-shm-usage', ...graphicsArgs]});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR', error.message); });
    page.on('console', msg => { if (msg.type() === 'error') { errors.push(msg.text()); console.error('CONSOLE ERROR',msg.text()); } });
    page.on('response', response => {
      if (/\.glb(?:\?|$)/.test(response.url())) console.log('GLB', response.status(), response.headers()['content-type'], response.url());
    });
    await page.setViewport({width: 1600, height: 1000, deviceScaleFactor: 1});
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/__lara_mixamo_test__') {
        request.respond({contentType: 'text/html', body: '<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#17212b;color:white;font-family:sans-serif"><h2 style="margin:16px">Lara : originale / prototype Mixamo / Xbot</h2><div id="label" style="margin:16px"></div></body></html>'});
      } else request.continue();
    });
    if(process.argv.includes('--component')) {
      await page.goto('http://127.0.0.1:5173/scripts/lara-mixamo-fixture.html'+(process.argv.includes('--shoulders')?'?view=shoulders&anim=idle':''));
      await page.waitForFunction(()=>{
        let original=false,prototype=false;
        window.threeScene?.traverse(node=>{
          if(!node.isSkinnedMesh)return;
          let path;
          for(let parent=node;parent;parent=parent.parent){
            if(!parent.visible)return;
            if(parent.userData.gltfPath)path=parent.userData.gltfPath;
          }
          if(path==='characters/lara/lara_native.glb')original=true;
          if(path==='characters/lara/lara_mixamo_prototype.glb')prototype=true;
        });
        return original && prototype;
      }, {timeout:120000});
      await page.waitForFunction(async () => {
        const {useAnimPreviewStore} = await import('/src/features/inventory/useAnimPreviewStore.ts');
        return useAnimPreviewStore.getState().duration > 0;
      }, {timeout:120000});
      await page.evaluate(async () => {
        const {useAnimPreviewStore} = await import('/src/features/inventory/useAnimPreviewStore.ts');
        const store = useAnimPreviewStore.getState();
        store.pause();
        store.seekToTime(store.duration * .25);
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({path:'/tmp/lara-mixamo-component.png'});
      if(errors.length)throw new Error(errors.join('\n'));
      console.log('Actual CharacterGroup renders both Lara rigs through HTTP.');
      return;
    }
    if (process.argv.includes('--project')) {
      await page.goto('http://127.0.0.1:5173/?character=lara_mixamo&npcNb=1&preset=low&skipIntro=1');
      const asset = await page.evaluate(async () => {
        const response = await fetch('/characters/lara/lara_mixamo_prototype.glb');
        const data = await response.arrayBuffer();
        return {status:response.status,type:response.headers.get('content-type'),magic:new TextDecoder().decode(data.slice(0,4))};
      });
      if(asset.magic !== 'glTF')throw new Error('Prototype GLB is not served correctly: '+JSON.stringify(asset));
      await page.waitForFunction(() => document.body.innerText.includes('Lara Mixamo (prototype)'), {timeout:120000});
      await page.waitForFunction(() => {
        let found=false;
        window.threeScene?.traverse(node => { if(node.isBone && node.name === 'arm_left_shoulder')found=true; });
        const loading=document.getElementById('loading');
        return found && (!loading || getComputedStyle(loading).display === 'none');
      }, {timeout:120000});
      const state = await page.evaluate(async () => {
        const {CHARACTERS} = await import('/src/features/scene/characterConfig.ts');
        const {INVENTORY} = await import('/src/features/inventory/inventoryData.ts');
        const {useSceneStore} = await import('/src/features/scene/store/useSceneStore.ts');
        return {active:useSceneStore.getState().activeCharacterId, character:CHARACTERS.find(c=>c.id==='lara_mixamo'), item:INVENTORY.find(c=>c.id==='lara_mixamo')};
      });
      if(state.active !== 'lara_mixamo' || state.item?.glbPath !== state.character?.path)throw new Error('Prototype registration failed: '+JSON.stringify(state));
      await page.screenshot({path:'/tmp/lara-mixamo-project.png'});
      if(errors.length)throw new Error(errors.join('\n'));
      console.log('Project integration verified:', JSON.stringify(state));
      return;
    }
    await page.goto('http://127.0.0.1:5173/__lara_mixamo_test__');
    const result = await page.evaluate(async (calibrate) => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const {GLTFLoader} = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const {DRACOLoader} = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const {retargetClip} = await import('/src/features/scene/retargeting/retargetClip.ts');
      const {groundInterxClip, interxSoleHeight} = await import('/src/features/scene/retargeting/groundInterxClip.ts');
      const {resolveTargetBoneName} = await import('/src/features/scene/retargeting/boneResolver.ts');
      const {extractCharacterParts, applyClothingAndAccessoriesVisibility} = await import('/src/features/scene/characterParts.ts');
      const assert = (condition, message) => { if (!condition) throw new Error(message); };
      const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
      const gltfs = await Promise.all(['/characters/lara/lara_native.glb', '/characters/lara/lara_mixamo_prototype.glb', '/characters/xbot/Xbot_official.glb'].map(url => loader.loadAsync(url)));
      const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
      renderer.setSize(1600, 880);
      renderer.setClearColor('#17212b');
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x788698, 2));
      const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(2,4,5); scene.add(light);
      const camera = new THREE.PerspectiveCamera(32, 1600/880, .01, 100);
      camera.position.set(0, 1.2, 7); camera.lookAt(0, .95, 0);
      const targets = gltfs.map((gltf, index) => {
        const target = gltf.scene;
        // Normalize the character to metres, before caching application rest data.
        target.updateMatrixWorld(true);
        const size = new THREE.Box3().setFromObject(target).getSize(new THREE.Vector3());
        if (size.y > 10) target.scale.multiplyScalar(.01);
        target.position.x = (index-1)*1.7;
        scene.add(target);
        target.updateMatrixWorld(true);
        const parts = extractCharacterParts(target);
        if (index < 2) {
          applyClothingAndAccessoriesVisibility(parts, {laraTop:'native', laraBottom:'native', laraShoes:true, showAccessories:false, laraPistols:false, equipment:{holster:false,pistols:false,backpack:false}});
          target.traverse(node => { if (node.isMesh && /hair_classic|hair_fmv/.test(node.name)) node.visible=false; });
        }
        return target;
      });
      const prototype = targets[1];
      if (calibrate) prototype.traverse(node => { delete node.userData.retargetShoulderCorrection; });
      window.laraTargets = targets;
      const expected = {Hips:'pelvis', Spine:'spine_lower', Spine1:'spine_middle', Spine2:'spine_upper', Neck:'head_neck_lower', Head:'head_neck_upper'};
      for(const [side, role] of [['left','Left'],['right','Right']]) {
        for(const [name, part] of [['Shoulder','shoulder'],['Arm','shoulder_2'],['ForeArm','elbow'],['Hand','wrist']]) expected[role+name]=`arm_${side}_${part}`;
        for(const [name, part] of [['UpLeg','thigh'],['Leg','knee'],['Foot','ankle'],['ToeBase','toes']]) expected[role+name]=`leg_${side}_${part}`;
        ['Thumb','Index','Middle','Ring','Pinky'].forEach((finger,digit)=>{
          ['a','b','c'].forEach((letter,segment)=>{expected[`${role}Hand${finger}${segment+1}`]=`arm_${side}_finger_${digit+1}${letter}`;});
        });
      }
      const mapping = {};
      for (const name of Object.keys(expected)) {
        mapping[name] = resolveTargetBoneName(prototype, name);
        assert(mapping[name] === expected[name], `Incorrect mapping ${name}: ${mapping[name]}`);
      }
      prototype.traverse(node=>{if(node.isBone)assert(!/mixamo/i.test(node.name),`Unexpected prefixed bone ${node.name}`);});
      for (const [child, parent] of [['Spine','Hips'],['Spine1','Spine'],['Spine2','Spine1'],['LeftShoulder','Spine2'],['LeftArm','LeftShoulder'],['RightShoulder','Spine2'],['RightArm','RightShoulder'],['LeftUpLeg','Hips'],['RightUpLeg','Hips']]) {
        assert(prototype.getObjectByName(resolveTargetBoneName(prototype, child)).parent.name === resolveTargetBoneName(prototype, parent), `Wrong hierarchy ${child}`);
      }
      const render = () => {scene.updateMatrixWorld(true); targets.forEach(target => target.traverse(n => {if(n.isSkinnedMesh)n.skeleton.update();}));renderer.render(scene,camera);};
      const restore = target => target.traverse(node => {
        if(node.defaultPosition)node.position.copy(node.defaultPosition);
        if(node.restLocalQuaternion)node.quaternion.copy(node.restLocalQuaternion);
      });
      // Grounding must use the same translation bone as retargeting, including
      // native Lara's root_hips above its pelvis/spine split.
      const manifest = await (await fetch('/animations/npz/interx/interx_manifest.json')).json();
      const sourcePair = await loader.loadAsync('/'+manifest.duos[0].clips.p1.path);
      const native = targets[0];
      native.scale.setScalar(100);
      native.updateMatrixWorld(true);
      const metric = retargetClip(sourcePair.animations[0], native, sourcePair.scene, 'world-meters');
      const translation = metric.tracks.find(track=>track.name==='root_hips.position');
      assert(translation, 'Native root motion must move the entire body');
      // Grounder consumes centimetres; the render fixture uses metres.
      const grounded = groundInterxClip(metric, native, 0);
      const groundMixer = new THREE.AnimationMixer(native);
      groundMixer.clipAction(grounded).play();
      groundMixer.setTime(0);
      assert(Math.abs(interxSoleHeight(native)) < .001, 'Native root grounding regressed');
      groundMixer.stopAllAction();
      restore(native);
      native.scale.setScalar(1);
      const reports = [];
      window.laraReports = reports;
      const posture = target => {
        const result = {};
        for(const role of ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftFoot','RightFoot']) {
          const name=resolveTargetBoneName(target,role);
          if(!name)continue;
          const bone=target.getObjectByName(name);
          const point=bone.getWorldPosition(new THREE.Vector3()).sub(target.position);
          result[role]={name,position:point.toArray(),localPosition:bone.defaultPosition.toArray(),rotation:bone.quaternion.toArray(),rest:bone.restLocalQuaternion.toArray()};
        }
        return result;
      };
      window.laraPosture=()=>targets.map(posture);
      const boneMatrices = () => {
        prototype.updateMatrixWorld(true);
        const result = {};
        for(const name of Object.values(mapping))result[name]=prototype.getObjectByName(name).matrixWorld.toArray();
        return result;
      };
      window.laraBaked = {rest:boneMatrices(), clips:{}};
      {
        const source = await loader.loadAsync('/animations/miley/miley_armature_idle01_f.glb');
        const clip = retargetClip(source.animations[0], prototype, source.scene);
        const mixer = new THREE.AnimationMixer(prototype);
        mixer.clipAction(clip).play();
        const count = Math.ceil(clip.duration * 30);
        const sums = {}, first = {};
        for (const role of ['LeftShoulder', 'RightShoulder']) sums[mapping[role]] = [0,0,0,0];
        for (let frame=0;frame<count;frame++) {
          mixer.setTime(frame/30);
          for (const name of Object.keys(sums)) {
            const q = prototype.getObjectByName(name).quaternion.clone();
            first[name] ??= q.clone();
            const sign = q.dot(first[name]) < 0 ? -1 : 1;
            q.toArray().forEach((v,i)=>sums[name][i]+=sign*v);
          }
        }
        const corrections = {};
        for (const [name,values] of Object.entries(sums)) {
          const mean = new THREE.Quaternion().fromArray(values).normalize();
          corrections[name] = mean.invert().multiply(prototype.getObjectByName(name).restLocalQuaternion).normalize().toArray();
          if (!calibrate) assert(new THREE.Quaternion().fromArray(corrections[name]).angleTo(new THREE.Quaternion()) < 1e-4, `Neutral shoulder posture drifted: ${name}`);
        }
        window.laraCalibration = {reference:'/animations/miley/miley_armature_idle01_f.glb',fps:30,samples:count,corrections};
        mixer.stopAllAction();
        restore(prototype);
      }
      window.laraRender = async (id, fraction) => {
        targets.forEach(restore);
        if(id !== 'rest') {
          // Load separate source instances because retargetClip adjusts source rest poses.
          for(const target of targets) {
            const source = await loader.loadAsync(id === 'idle'
              ? '/animations/miley/miley_armature_idle01_f.glb'
              : '/animations/mixamo/'+id+'.glb');
            assert(source.animations.length, `Missing animation ${id}`);
            const clip = retargetClip(source.animations[0], target, source.scene);
            assert(clip.tracks.length, `No retargeted tracks ${id}`);
            assert(clip.tracks.every(track => Array.from(track.values).every(Number.isFinite)), `Invalid tracks ${id}`);
            if(target === prototype) {
              for(const bone of ['LeftShoulder','RightShoulder','Spine1']) {
                assert(clip.tracks.some(track => track.name === mapping[bone]+'.quaternion'), `Lost ${bone} track: ${id}`);
              }
            }
            let mixer = new THREE.AnimationMixer(target);
            mixer.clipAction(clip).play();
            if(target === prototype && !window.laraBaked.clips[id]) {
              const frames=[];
              const fps=30;
              for(let frame=0;frame<=Math.ceil(clip.duration*fps);frame++) {
                const time=Math.min(frame/fps,clip.duration);
                mixer.setTime(time);
                frames.push({time,bones:boneMatrices()});
              }
              window.laraBaked.clips[id]={fps,frames};
            }
            mixer.setTime(clip.duration*fraction);
            let shoulderLift;
            if (target === prototype && !calibrate) {
              const calibrated = {};
              prototype.traverse(node => {
                if (node.userData.retargetShoulderCorrection) {
                  calibrated[node.name] = node.userData.retargetShoulderCorrection;
                  delete node.userData.retargetShoulderCorrection;
                }
              });
              assert(Object.keys(calibrated).length === 2, 'Missing shoulder calibration in GLB');
              const controlSource = await loader.loadAsync(id === 'idle' ? '/animations/miley/miley_armature_idle01_f.glb' : '/animations/mixamo/'+id+'.glb');
              const controlClip = retargetClip(controlSource.animations[0], prototype, controlSource.scene);
              for (const [name,value] of Object.entries(calibrated)) prototype.getObjectByName(name).userData.retargetShoulderCorrection = value;
              const controlMixer = new THREE.AnimationMixer(prototype);
              restore(prototype);
              controlMixer.clipAction(controlClip).play();
              controlMixer.setTime(clip.duration*fraction);
              prototype.updateMatrixWorld(true);
              const control = ['LeftArm','RightArm'].map(role => {
                const bone = prototype.getObjectByName(mapping[role]);
                return {q:bone.getWorldQuaternion(new THREE.Quaternion()),y:bone.getWorldPosition(new THREE.Vector3()).y};
              });
              controlMixer.stopAllAction();
              mixer.stopAllAction();
              restore(prototype);
              mixer = new THREE.AnimationMixer(target);
              mixer.clipAction(clip).play();
              mixer.setTime(clip.duration*fraction);
              prototype.updateMatrixWorld(true);
              shoulderLift = ['LeftArm','RightArm'].map((role,i) => {
                const bone = prototype.getObjectByName(mapping[role]);
                const angle = control[i].q.angleTo(bone.getWorldQuaternion(new THREE.Quaternion()));
                assert(angle < 1e-3, `Calibration changed arm direction ${id}: ${angle}`);
                return bone.getWorldPosition(new THREE.Vector3()).y - control[i].y;
              });
            }
            render();
            // Evaluate the same four-influence GPU skinning on the CPU.
            let maxDistance=0;
            target.traverse(mesh => {
              if(!mesh.isSkinnedMesh)return;
              const attr=mesh.geometry.attributes.position;
              const point=new THREE.Vector3();
              for(let i=0;i<attr.count;i++) {
                mesh.getVertexPosition(i,point);
                assert(point.toArray().every(Number.isFinite), `Nonfinite vertex ${mesh.name}:${i}`);
                maxDistance=Math.max(maxDistance,point.length());
              }
            });
            reports.push({animation:id,fraction,target:targets.indexOf(target),tracks:clip.tracks.length,maxVertexDistance:maxDistance,
              shoulderLift,posture:posture(target)});
          }
          const samples = reports.slice(-3);
          assert(new THREE.Vector3().fromArray(samples[0].posture.Hips.position).distanceTo(new THREE.Vector3().fromArray(samples[1].posture.Hips.position)) < 1e-5, `Hip displacement depends on hierarchy: ${id}`);
        }
        document.getElementById('label').textContent=id+' — '+Math.round(fraction*100)+' %';
        render();
      };
      await window.laraRender('rest',0);
      return {mapping, reports};
    }, process.argv.includes('--calibrate'));
    await page.screenshot({path:'/tmp/lara-mixamo-rest.png'});
    if (process.argv.includes('--calibrate')) {
      const calibration = await page.evaluate(()=>window.laraCalibration);
      fs.writeFileSync('docs/lara-shoulder-calibration.json',JSON.stringify(calibration,null,2)+'\n');
      console.log('Shoulder calibration:',JSON.stringify(calibration));
    }
    const animations = ['idle','anim_female_walk','anim_overhead_squat','anim_ymca_dance','anim_air_squat_bent_arms'];
    for (const animation of animations) {
      for (const fraction of [.25, .5, .75]) {
        await page.evaluate((id, t) => window.laraRender(id,t), animation, fraction);
        if(fraction === .5)await page.screenshot({path:'/tmp/lara-mixamo-'+animation+'.png'});
      }
    }
    if(errors.length)throw new Error(errors.join('\n'));
    result.reports = await page.evaluate(() => window.laraReports);
    fs.writeFileSync('/tmp/lara-mixamo-poses.json', JSON.stringify(await page.evaluate(() => window.laraBaked))+'\n');
    fs.writeFileSync('/tmp/lara-mixamo-runtime.json', JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
