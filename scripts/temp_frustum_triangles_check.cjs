const assert = require('node:assert/strict');
const fs = require('node:fs');
const launchBrowser = require('./browser-test-options.cjs');

function loadTs(path) {
  const ts = require('typescript');
  require.extensions['.ts'] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    module._compile(compiled, filename);
  };
  return require(path);
}

function checkAnimatedBounds() {
  const {enableAnimatedFrustumCulling,meshWorldBounds} = loadTs('../src/features/scene/utils/animatedFrustumCulling.ts');
  const THREE = require('three');
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1,0,0, 1,0,0, 0,1,0], 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0,0,0,0, 1,0,0,0, 0,1,0,0], 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1,0,0,0, 1,0,0,0, 0.25,0.75,0,0], 4));
  geometry.morphTargetsRelative = true;
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute([0,0,0, 10,0,0, 0,5,0], 3)];
  const scene = new THREE.Scene(), parent = new THREE.Group();
  scene.add(parent);
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  const root = new THREE.Bone(), arm = new THREE.Bone();
  root.add(arm); arm.position.y = 1; mesh.add(root); parent.add(mesh);
  scene.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton([root,arm]));
  enableAnimatedFrustumCulling(mesh);
  enableAnimatedFrustumCulling(mesh); // React strict-mode setup is idempotent.
  const point = new THREE.Vector3();
  function containsVertices(label) {
    scene.updateMatrixWorld(true);
    const sphere = mesh.boundingSphere.clone();
    const worldBounds = meshWorldBounds(mesh,new THREE.Box3()).expandByScalar(1e-6);
    for (let index = 0; index < geometry.attributes.position.count; index++) {
      mesh.getVertexPosition(index, point);
      assert.ok(point.distanceTo(sphere.center) <= sphere.radius + 1e-6, `${label}: vertex ${index} outside animated sphere`);
      assert.ok(worldBounds.containsPoint(point.clone().applyMatrix4(mesh.matrixWorld)),`${label}: vertex ${index} outside world bounds`);
    }
  }
  containsVertices('bind pose');
  root.position.set(100,20,0); arm.rotation.z = Math.PI / 2; arm.scale.set(2,0.5,3);
  containsVertices('translated skeleton / rotated and scaled limb');
  mesh.morphTargetInfluences[0] = 1;
  containsVertices('changed morph target');
  mesh.morphTargetInfluences[0] = 0;
  parent.position.set(40,10,-5); parent.rotation.y = 0.7; parent.scale.set(3,2,0.5);
  containsVertices('transformed parent');
  mesh.bindMode = 'detached';
  containsVertices('detached bind mode');
  mesh.bindMode = 'attached';
  parent.position.set(0,0,0); parent.rotation.set(0,0,0); parent.scale.set(1,1,1);
  const camera = new THREE.PerspectiveCamera(45,1,0.1,100);
  camera.position.set(0,0,10); camera.lookAt(0,0,0); camera.updateMatrixWorld(true);
  const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  scene.updateMatrixWorld(true);
  assert.equal(frustum.intersectsObject(mesh), false, 'Animated character entirely offscreen is culled');
  root.position.set(0,0,0); arm.rotation.z=0; arm.scale.set(1,1,1); scene.updateMatrixWorld(true);
  assert.equal(frustum.intersectsObject(mesh), true, 'Previously culled character reappears when its bones return');
  assert.equal(geometry.boundingSphere, null, 'Instance bounds must not modify shared geometry');
  console.log('Animated bounds unit checks passed: deformed limbs, morphs, transforms, detached binding and reentry.');
}

function checkShadowReceivers() {
  const THREE = require('three');
  const {getUnusedShadows} = loadTs('../src/features/scene/utils/visibleShadowReceivers.ts');
  const scene = new THREE.Scene(), parent = new THREE.Group();
  const light = new THREE.DirectionalLight(); light.castShadow=true; light.position.set(0,10,10); scene.add(light,light.target);
  light.shadow.map = new THREE.WebGLRenderTarget(1,1);
  const needsShadow = view => !getUnusedShadows(scene,view).shadows.includes(light.shadow);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  receiver.receiveShadow = true;
  scene.add(parent); parent.add(receiver);
  const camera = new THREE.PerspectiveCamera(45,1,0.1,100);
  camera.position.z = 10; camera.lookAt(0,0,0); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  assert.equal(needsShadow(camera),true);
  receiver.position.x=100; scene.updateMatrixWorld(true);
  assert.equal(needsShadow(camera),false);
  receiver.position.x=0; scene.updateMatrixWorld(true);
  parent.visible=false; assert.equal(needsShadow(camera),false); parent.visible=true;
  receiver.material.visible=false; assert.equal(needsShadow(camera),false); receiver.material.visible=true;
  camera.layers.set(1); light.layers.set(1); assert.equal(needsShadow(camera),false); camera.layers.set(0); light.layers.set(0);
  receiver.receiveShadow=false; assert.equal(needsShadow(camera),false);
  receiver.isReflector=true; assert.equal(needsShadow(camera),true);
  const away = camera.clone(); away.lookAt(0,0,20); away.updateMatrixWorld(true);
  assert.equal(needsShadow(new THREE.ArrayCamera([away,camera])),true);
  receiver.isReflector=false;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial());
  ground.receiveShadow=true; ground.rotation.x=-Math.PI/2; ground.position.y=-5; scene.add(ground);
  camera.lookAt(0,1,10); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  assert.equal(needsShadow(camera),false,'Ground-plane sphere must not keep unused shadows active while looking up');
  ground.visible=false; receiver.receiveShadow=true; receiver.position.x=100;
  camera.position.set(100,0,10); camera.lookAt(100,0,0); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  assert.equal(needsShadow(camera),false,'Visible FPV body outside directional shadow coverage must not keep the studio shadow pass active');
  receiver.isReflector=true; assert.equal(needsShadow(camera),true,'Mirror preserves offscreen shadow receivers');
  light.intensity=0; assert.equal(needsShadow(camera),false,'Extinguished light does not render shadows, even with a mirror');
  light.intensity=1; receiver.isReflector=false;
  const point = new THREE.PointLight(); point.castShadow=true; point.shadow.camera.far=5; scene.add(point);
  point.shadow.map = new THREE.WebGLCubeRenderTarget(1);
  receiver.position.set(4,4,4); camera.position.set(4,4,14); camera.lookAt(4,4,4); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  assert.equal(getUnusedShadows(scene,camera).shadows.includes(point.shadow),false,'Point shadow coverage follows cube depth rather than radial distance');
  point.distance=2;
  assert.equal(getUnusedShadows(scene,camera).shadows.includes(point.shadow),true,'Point-light distance controls shadow far extent');
  const spot = new THREE.SpotLight(); spot.castShadow=true; spot.position.set(0,0,10); scene.add(spot,spot.target);
  spot.shadow.map = new THREE.WebGLRenderTarget(1,1);
  receiver.position.set(100,0,0); camera.position.set(100,0,10); camera.lookAt(100,0,0); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  assert.equal(getUnusedShadows(scene,camera).shadows.includes(spot.shadow),true,'Visible receiver outside spotlight cone needs no map');
  receiver.position.set(0,0,0); camera.position.set(0,0,10); camera.lookAt(0,0,0); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  assert.equal(getUnusedShadows(scene,camera).shadows.includes(spot.shadow),false,'Receiver returning inside spotlight cone restores map updates');
  point.intensity=0; point.shadow.map.dispose(); point.shadow.map=null;
  assert.equal(getUnusedShadows(scene,camera).shadows.includes(point.shadow),false,'Depth texture must be initialized before any PCF shadow sampler can be skipped');
  console.log('Shadow receiver checks passed: camera layers, hidden parents/materials, mirrors, stereo cameras and sky above a large ground plane.');
}

(async () => {
  const baseline = process.argv.includes('--baseline');
  const fpvShadows = process.argv.includes('--fpv-shadows');
  if (!baseline) { checkAnimatedBounds(); checkShadowReceivers(); }
  if (process.argv.includes('--unit')) return;
  const browser = await launchBrowser({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--render-node-override=/dev/dri/renderD128', '--disable-vulkan-surface'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5190'}/?characterCount=7&preset=high&animOriginLerp=false&animCrossfade=false&exitTransitions=false`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(async () => {
      const idle = await import('/src/features/scene/idleState.ts');
      setInterval(idle.resetAppIdle, 1000);
    });
    await page.waitForFunction(() => {
      const labels = new Set();
      window.__THREE_SCENE__?.traverse(node => {
        if (node.isSkinnedMesh && node.userData.itemName && !node.userData.isCustomHair) labels.add(node.userData.itemName);
      });
      return labels.size >= 7 && window.__THREE_GL__;
    }, { timeout: 180000 }).catch(async error => {
      console.log('Readiness failure:', await page.evaluate(() => {
        const meshes = [];
        window.__THREE_SCENE__?.traverse(node => { if (node.isSkinnedMesh) meshes.push({name:node.name,label:node.userData.itemName}); });
        return {meshes,dev:window.__DEV_STATE__?.triangles,html:document.body.innerText.slice(0, 1000)};
      }));
      throw error;
    });
    console.log('Seven characters loaded.');
    await page.evaluate(async () => {
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const {useSceneStore} = await import('/src/features/scene/store/useSceneStore.ts');
      const renderer = window.__THREE_GL__;
      const render = renderer.render, draw = renderer.renderBufferDirect;
      const savedPosition = new THREE.Vector3(), savedQuaternion = new THREE.Quaternion();
      const savedCharacterPosition = new THREE.Vector3();
      window.cullingAudit = { mode: 'toward', frames: [] };
      window.cullingStore = useSceneStore;
      const lights = new Map();
      window.__THREE_SCENE__.traverse(light => { if (light.isLight && light.shadow) lights.set(light.shadow.camera.uuid, light); });
      let current;
      renderer.renderBufferDirect = function(camera, scene, geometry, material, object, group) {
        const previous = this.info.render.triangles;
        const result = draw.call(this, camera, scene, geometry, material, object, group);
        if (current) {
          const pass = material.isMeshDepthMaterial || material.isMeshDistanceMaterial ? 'shadow' : this.getRenderTarget() ? 'reflection' : 'main';
          const triangles = this.info.render.triangles - previous;
          current[pass].triangles += triangles;
          current[pass].calls++;
          if (object.isSkinnedMesh) current[pass].skinnedTriangles += triangles;
          if (pass === 'shadow') {
            const light = lights.get(camera.uuid);
            const key = light?.uuid || camera.uuid;
            current.shadowLights[key] ??= {type:light?.type,position:light?.position.toArray(),intensity:light?.intensity,triangles:0,calls:0};
            current.shadowLights[key].triangles += triangles;
            current.shadowLights[key].calls++;
            const label = object.userData.itemName || object.name;
            current.shadowObjects[label] = (current.shadowObjects[label] || 0) + triangles;
          }
          if (pass === 'main' && window.cullingAudit.mode === 'sky') {
            const sphere = (object.boundingSphere ?? object.geometry.boundingSphere)?.clone().applyMatrix4(object.matrixWorld);
            current.skyObjects.push({name:object.name,label:object.userData.itemName,triangles,culled:object.frustumCulled,center:sphere?.center.toArray(),radius:sphere?.radius});
          }
        }
        return result;
      };
      renderer.render = function(scene, camera) {
        if (this.getRenderTarget() !== null || !camera.isPerspectiveCamera) return render.call(this, scene, camera);
        savedPosition.copy(camera.position); savedQuaternion.copy(camera.quaternion);
        const fpv = window.cullingAudit.mode.startsWith('fpv');
        const character = fpv && scene.getObjectByName('Native');
        if (fpv) {
          savedCharacterPosition.copy(character.parent.position);
          if (window.cullingAudit.mode === 'fpv-far') { character.parent.position.x += 3000; character.parent.position.y=0; }
          scene.updateMatrixWorld(true);
          const left = character.getObjectByName('head_eyeball_left'), right = character.getObjectByName('head_eyeball_right');
          camera.position.copy(left.getWorldPosition(new THREE.Vector3())).add(right.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
          camera.lookAt(camera.position.clone().add(new THREE.Vector3(1,-0.1,0)));
        } else {
          camera.position.set(0, 400, 1500);
          camera.lookAt(window.cullingAudit.mode === 'sky' ? new THREE.Vector3(0, 401, 1500) : new THREE.Vector3(0, 100, 200));
        }
        current = { main: {triangles:0,calls:0,skinnedTriangles:0}, shadow: {triangles:0,calls:0,skinnedTriangles:0}, reflection: {triangles:0,calls:0,skinnedTriangles:0}, skyObjects: [], shadowLights: {}, shadowObjects: {} };
        try { return render.call(this, scene, camera); }
        finally {
          current.gpuError = renderer.getContext().getError();
          window.cullingAudit.frames.push(current);
          current = undefined;
          if (fpv) { character.parent.position.copy(savedCharacterPosition); scene.updateMatrixWorld(true); }
          camera.position.copy(savedPosition); camera.quaternion.copy(savedQuaternion); camera.updateMatrixWorld();
        }
      };
    });
    const report = {};
    for (const mode of fpvShadows ? ['fpv-near', 'fpv-far', 'toward-again'] : ['toward', 'sky', 'toward-again']) {
      await page.evaluate(mode => { window.cullingAudit.mode = mode; window.cullingAudit.frames = []; window.cullingStore.getState().setCameraMode(mode.startsWith('fpv') ? 'fpv' : 'orbit'); }, mode);
      await page.waitForFunction(() => window.cullingAudit.frames.length >= 8, { timeout: 60000 });
      report[mode] = await page.evaluate(() => {
        const frames = window.cullingAudit.frames.slice(-5), result = {};
        for (const pass of ['main', 'shadow', 'reflection']) {
          result[pass] = {};
          for (const key of ['triangles', 'calls', 'skinnedTriangles']) result[pass][key] = Math.round(frames.reduce((sum, frame) => sum + frame[pass][key], 0) / frames.length);
        }
        result.gpuErrors = frames.map(frame=>frame.gpuError).filter(error=>error!==0);
        if (window.cullingAudit.mode === 'sky') result.objects = frames[frames.length - 1].skyObjects;
        if (window.cullingAudit.mode.startsWith('fpv')) {
          result.lights = Object.values(frames[frames.length - 1].shadowLights);
          result.shadowObjects = Object.entries(frames[frames.length - 1].shadowObjects).sort((a,b)=>b[1]-a[1]).slice(0,10);
        }
        return result;
      });
      console.log(mode, JSON.stringify(report[mode]));
      assert.deepEqual(report[mode].gpuErrors, [], 'Measured frames must render without WebGL errors');
    }
    if (!baseline && !fpvShadows) {
      assert.ok(report.toward.main.skinnedTriangles > 0, 'Visible characters must still be rendered');
      const containment = await page.evaluate(async () => {
        const THREE = await import('/node_modules/.vite/deps/three.js');
        const scene = window.__THREE_SCENE__;
        scene.updateMatrixWorld(true);
        const point = new THREE.Vector3(), violations = [];
        let meshes = 0, vertices = 0;
        scene.traverse(mesh => {
          if (!mesh.isSkinnedMesh || !Object.getOwnPropertyDescriptor(mesh, 'boundingSphere')?.get) return;
          meshes++;
          const sphere = mesh.boundingSphere.clone();
          for (let index = 0; index < mesh.geometry.attributes.position.count; index++) {
            mesh.getVertexPosition(index, point);
            vertices++;
            if (point.distanceTo(sphere.center) > sphere.radius + 1e-5) {
              violations.push({name:mesh.userData.itemName,mesh:mesh.name,index});
              break;
            }
          }
        });
        return {meshes, vertices, violations};
      });
      console.log('Animated vertex containment:', JSON.stringify(containment));
      assert.ok(containment.meshes > 0);
      assert.deepEqual(containment.violations, []);
      assert.equal(report.sky.main.skinnedTriangles, 0, 'Offscreen characters must not be submitted to the main camera');
      assert.equal(report.sky.shadow.triangles, 0, 'Sky-only view must not recompute unused shadows');
      assert.ok(report['toward-again'].shadow.triangles > 0, 'Shadows must update again when looking back at the apartment');
      assert.ok(report['toward-again'].reflection.triangles > 0, 'Mirrors must still render when returning to the apartment');
      const animations = await page.evaluate(async () => {
        const THREE = await import('/node_modules/.vite/deps/three.js');
        const {GLTFLoader} = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
        const {DRACOLoader} = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
        const {enableAnimatedFrustumCulling} = await import('/src/features/scene/utils/animatedFrustumCulling.ts');
        const {RIGGED_WIGS_PATHS} = await import('/src/features/inventory/inventoryData.ts');
        const paths = ['/characters/ushiro/shiba_inu_dog_ushiro.glb', '/characters/robin/robin.glb', '/' + RIGGED_WIGS_PATHS['100'].replace(/^\//, '')];
        const reports = [];
        const point = new THREE.Vector3();
        const draco = new DRACOLoader().setDecoderPath('/node_modules/three/examples/jsm/libs/draco/gltf/');
        const loader = new GLTFLoader().setDRACOLoader(draco);
        for (const path of paths) {
          const gltf = await loader.loadAsync(path);
          const meshes = [];
          gltf.scene.traverse(mesh => { if (mesh.isSkinnedMesh) { enableAnimatedFrustumCulling(mesh); meshes.push(mesh); } });
          const mixer = new THREE.AnimationMixer(gltf.scene);
          let vertices = 0, poses = 0;
          const failures = [];
          function checkPose(label) {
            gltf.scene.updateMatrixWorld(true); poses++;
            for (const mesh of meshes) {
              const sphere = mesh.boundingSphere.clone();
              for (let vertex = 0; vertex < mesh.geometry.attributes.position.count; vertex++) {
                mesh.getVertexPosition(vertex, point); vertices++;
                if (point.distanceTo(sphere.center) > sphere.radius + 1e-5) { failures.push({label,mesh:mesh.name,vertex}); break; }
              }
            }
          }
          checkPose('bind');
          for (const clip of gltf.animations) {
            mixer.stopAllAction(); const action = mixer.clipAction(clip); action.setLoop(THREE.LoopOnce,0).reset().play();
            for (const fraction of [0, 0.25, 0.5, 0.75, 1]) { mixer.setTime(clip.duration * fraction); checkPose(`${clip.name}:${fraction}`); }
          }
          if (path === paths[2]) {
            // The attached wig must follow a translated, scaled head and moving strands.
            const head = new THREE.Bone(); head.position.set(10,20,30); head.scale.setScalar(100); head.add(gltf.scene);
            gltf.scene.traverse(bone => { if (bone.isBone) bone.rotation.z += 0.15; });
            head.updateMatrixWorld(true); checkPose('attached / wind');
          }
          reports.push({path,clips:gltf.animations.map(clip=>clip.name),meshes:meshes.length,poses,vertices,failures});
          mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
        }
        draco.dispose();
        return reports;
      });
      console.log('Animal / wig animation containment:', JSON.stringify(animations));
      for (const model of animations) { assert.ok(model.meshes > 0); assert.deepEqual(model.failures, []); }
    }
    assert.deepEqual(errors, []);
    if (fpvShadows) {
      if (!baseline) {
        assert.ok(report['fpv-far'].main.skinnedTriangles > 0, 'FPV body remains visible');
        assert.equal(report['fpv-far'].shadow.triangles, 0, 'Body outside studio shadow coverage does not trigger studio shadow passes');
        for (const mode of ['fpv-near','fpv-far']) assert.ok(report[mode].lights.every(light=>light.intensity!==0),'Extinguished lights must not render shadows');
        assert.ok(report['toward-again'].shadow.triangles > 0);
      }
      const details = await page.evaluate(() => {
        const found = [];
        window.__THREE_SCENE__.traverse(mesh => {
          if (!mesh.isMesh || !mesh.userData.itemName) return;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          if (['Native','Rosanna','Marissa','Delphina','Sara','Sabira'].includes(mesh.userData.itemName) && /eye|tongue|teeth|lash|langue|cornea|sclera|mouth_inner/.test([mesh.name,...materials.map(m=>m.name)].join(' ').toLowerCase())) found.push({name:mesh.name,label:mesh.userData.itemName,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow});
        });
        return found;
      });
      console.log('Facial shadow policy:', JSON.stringify(details));
      assert.ok(details.length > 0); assert.ok(details.every(mesh=>!mesh.castShadow && !mesh.receiveShadow));
      if (!baseline) {
        await page.evaluate(()=>{window.cullingAudit.mode='fpv-far';window.cullingStore.getState().setCameraMode('fpv');});
        for (const enabled of [false,true]) {
          await page.evaluate(enabled => { window.cullingAudit.frames=[]; const store=window.cullingStore; store.setState(state=>({layers:{...state.layers,shadows:enabled}})); },enabled);
          await page.waitForFunction(enabled=>window.__THREE_GL__.shadowMap.enabled===enabled,{},enabled);
          await page.waitForFunction(()=>window.cullingAudit.frames.length>=8);
          assert.deepEqual(await page.evaluate(()=>window.cullingAudit.frames.map(frame=>frame.gpuError).filter(error=>error!==0)),[],'Shadow toggle must not introduce sampler or texture errors');
          const castingDetails = await page.evaluate(() => {
            const result = [];
            window.__THREE_SCENE__.traverse(mesh=>{ if (mesh.isMesh && ['Native','Rosanna','Marissa','Delphina','Sara','Sabira'].includes(mesh.userData.itemName) && /eye|teeth|tongue|lashes/.test(mesh.name.toLowerCase()) && mesh.castShadow) result.push(mesh.name); });
            return result;
          });
          assert.deepEqual(castingDetails,[],'Global shadow toggle must preserve exclusions on facial details');
        }
      }
    }
    fs.writeFileSync(`/tmp/room-frustum-${fpvShadows ? 'fpv-' : ''}${baseline ? 'baseline' : 'corrected'}.json`, JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
