// Run against npm run dev. Uses the real GLB loader and application retargeter.
const fs = require('node:fs');
const launchBrowser = require('./browser-test-options.cjs');

(async () => {
  const browser = await launchBrowser({args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('response', response => {
      if (/\.glb(?:\?|$)/.test(response.url())) console.log('GLB', response.status(), response.headers()['content-type'], response.url());
    });
    await page.setViewport({width: 1600, height: 1000, deviceScaleFactor: 1});
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/__lara_mixamo_test__') {
        request.respond({contentType: 'text/html', body: '<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#17212b;color:white;font-family:sans-serif"><h2 style="margin:16px">Lara : originale / prototype Mixamo / Xbot</h2><div id="label" style="margin:16px"></div></body></html>'});
      } else if (new URL(request.url()).pathname === '/characters/lara/lara_mixamo_prototype.glb') {
        // Vite ignores public/** changes, including files built after startup.
        request.respond({contentType:'model/gltf-binary', body:fs.readFileSync(require('node:path').join(__dirname,'../public/characters/lara/lara_mixamo_prototype.glb'))});
      } else request.continue();
    });
    if (process.argv.includes('--project')) {
      await page.goto('http://127.0.0.1:5173/?character=lara_mixamo&npcNb=1&inventory=characters');
      await page.waitForFunction(() => document.body.innerText.includes('Lara Mixamo (prototype)'), {timeout:120000});
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
    const result = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const {GLTFLoader} = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const {DRACOLoader} = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const {retargetClip} = await import('/src/features/scene/retargeting/retargetClip.ts');
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
      const mapping = {};
      for (const name of ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','RightShoulder','LeftArm','RightArm','LeftHandIndex1']) {
        mapping[name] = resolveTargetBoneName(prototype, name);
        assert(mapping[name] && mapping[name].replace(/[:_]/g,'') === 'mixamorig'+name, `Incorrect mapping ${name}: ${mapping[name]}`);
      }
      for (const [child, parent] of [['Spine','Hips'],['Spine1','Spine'],['Spine2','Spine1'],['LeftShoulder','Spine2'],['LeftArm','LeftShoulder'],['RightShoulder','Spine2'],['RightArm','RightShoulder'],['LeftUpLeg','Hips'],['RightUpLeg','Hips']]) {
        assert(prototype.getObjectByName(resolveTargetBoneName(prototype, child)).parent.name === resolveTargetBoneName(prototype, parent), `Wrong hierarchy ${child}`);
      }
      const render = () => {scene.updateMatrixWorld(true); targets.forEach(target => target.traverse(n => {if(n.isSkinnedMesh)n.skeleton.update();}));renderer.render(scene,camera);};
      const restore = target => target.traverse(node => {
        if(node.defaultPosition)node.position.copy(node.defaultPosition);
        if(node.restLocalQuaternion)node.quaternion.copy(node.restLocalQuaternion);
      });
      const reports = [];
      window.laraReports = reports;
      const boneMatrices = () => {
        prototype.updateMatrixWorld(true);
        const result = {};
        prototype.traverse(bone => {
          if (bone.isBone && /^mixamorig/.test(bone.name)) {
            result[bone.name.replace(/^mixamorig[:_]?/, 'mixamorig:')] = bone.matrixWorld.toArray();
          }
        });
        return result;
      };
      window.laraBaked = {rest:boneMatrices(), clips:{}};
      window.laraRender = async (id, fraction) => {
        targets.forEach(restore);
        if(id !== 'rest') {
          // Load separate source instances because retargetClip adjusts source rest poses.
          for(const target of targets) {
            const source = await loader.loadAsync('/animations/mixamo/'+id+'.glb');
            assert(source.animations.length, `Missing animation ${id}`);
            const clip = retargetClip(source.animations[0], target, source.scene);
            assert(clip.tracks.length, `No retargeted tracks ${id}`);
            assert(clip.tracks.every(track => Array.from(track.values).every(Number.isFinite)), `Invalid tracks ${id}`);
            if(target === prototype) {
              for(const bone of ['LeftShoulder','RightShoulder','Spine1']) {
                assert(clip.tracks.some(track => track.name === mapping[bone]+'.quaternion'), `Lost ${bone} track: ${id}`);
              }
            }
            const mixer = new THREE.AnimationMixer(target);
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
            reports.push({animation:id,fraction,target:targets.indexOf(target),tracks:clip.tracks.length,maxVertexDistance:maxDistance});
          }
        }
        document.getElementById('label').textContent=id+' — '+Math.round(fraction*100)+' %';
        render();
      };
      await window.laraRender('rest',0);
      return {mapping, reports};
    });
    await page.screenshot({path:'/tmp/lara-mixamo-rest.png'});
    const animations = ['anim_female_walk','anim_overhead_squat','anim_ymca_dance','anim_air_squat_bent_arms'];
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
