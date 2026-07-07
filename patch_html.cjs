const fs = require('fs');
let code = fs.readFileSync('test_metarig.html', 'utf-8');

// 1. Fix variables
code = code.replace('let camera, scene, renderer, clock, mixer;', 'let camera, perspCamera, orthoCamera, activeCamera, scene, renderer, clock, mixer;');
code = code.replace("animation: 't-pose',", "animation: 'None',");
code = code.replace(/frame: 0,/g, "frame: 0,\n      ortho: true,\n      cameraView: 'Face',");

code = code.replace(
`    let rawAnimActions = {};
    let rawAnimMixers = [];
    let currentRawAction = null;`,
`    let rawAnimClips = {};
    let xbotMixer = null;
    let rosannaMixer = null;
    let xbotAction = null;
    let rosannaAction = null;`
);

// 2. Camera Setup
code = code.replace(
`      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 100, 250);`,
`      perspCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      perspCamera.position.set(0, 100, 250);
      
      const aspect = window.innerWidth / window.innerHeight;
      const d = 150;
      orthoCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
      orthoCamera.position.set(0, 100, 250);
      
      activeCamera = orthoCamera;
      camera = activeCamera;`
);

code = code.replace(
`      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 100, 0);
      controls.update();`,
`      const controls = new OrbitControls(perspCamera, renderer.domElement);
      controls.target.set(0, 100, 0);
      controls.update();
      
      const orthoControls = new OrbitControls(orthoCamera, renderer.domElement);
      orthoControls.target.set(0, 100, 0);
      orthoControls.update();`
);

// 3. GUI
code = code.replace(/gui\.add\(guiOptions, 'wireframe'\)[\s\S]*?\}\);\n/, '');
code = code.replace(
`      gui.add(guiOptions, 'paused').name('Pause').onChange(v => {
        if (mixer) mixer.timeScale = v ? 0 : guiOptions.timeScale;
        rawAnimMixers.forEach(m => m.timeScale = v ? 0 : guiOptions.timeScale);
      });
      gui.add(guiOptions, 'timeScale', 0.1, 3.0, 0.1).name('Speed').onChange(v => {
        if (mixer && !guiOptions.paused) mixer.timeScale = v;
        rawAnimMixers.forEach(m => { if (!guiOptions.paused) m.timeScale = v; });
      });
      gui.add(guiOptions, 'frame', 0, 100, 1).name('Frame (%)').listen().onChange(v => {
        if (currentAction && currentAction.getClip()) {
           guiOptions.paused = true;
           if (mixer) mixer.timeScale = 0;
           rawAnimMixers.forEach(m => m.timeScale = 0);
           const targetTime = (v / 100) * currentAction.getClip().duration;
           mixer.setTime(targetTime);
           rawAnimMixers.forEach(m => m.setTime(targetTime));
        }
      });`,
`      gui.add(guiOptions, 'ortho').name('Orthographique').onChange(v => {
        activeCamera = v ? orthoCamera : perspCamera;
        camera = activeCamera;
      });
      
      guiOptions.toggleFront = () => { activeCamera.position.set(0, 100, 250); activeCamera.lookAt(0, 100, 0); controls.target.set(0,100,0); controls.update(); orthoControls.target.set(0,100,0); orthoControls.update(); };
      guiOptions.toggleRight = () => { activeCamera.position.set(250, 100, 0); activeCamera.lookAt(0, 100, 0); controls.target.set(0,100,0); controls.update(); orthoControls.target.set(0,100,0); orthoControls.update(); };
      guiOptions.toggleLeft = () => { activeCamera.position.set(-250, 100, 0); activeCamera.lookAt(0, 100, 0); controls.target.set(0,100,0); controls.update(); orthoControls.target.set(0,100,0); orthoControls.update(); };
      guiOptions.toggleBack = () => { activeCamera.position.set(0, 100, -250); activeCamera.lookAt(0, 100, 0); controls.target.set(0,100,0); controls.update(); orthoControls.target.set(0,100,0); orthoControls.update(); };
      
      gui.add(guiOptions, 'toggleFront').name('Vue Face');
      gui.add(guiOptions, 'toggleRight').name('Vue Droite');
      gui.add(guiOptions, 'toggleLeft').name('Vue Gauche');
      gui.add(guiOptions, 'toggleBack').name('Vue Arriere');

      guiOptions.togglePause = () => {
        guiOptions.paused = !guiOptions.paused;
        const v = guiOptions.paused;
        if (mixer) mixer.timeScale = v ? 0 : guiOptions.timeScale;
        if (xbotMixer) xbotMixer.timeScale = v ? 0 : guiOptions.timeScale;
        if (rosannaMixer) rosannaMixer.timeScale = v ? 0 : guiOptions.timeScale;
      };
      gui.add(guiOptions, 'togglePause').name('Pause/Play');
      
      gui.add(guiOptions, 'timeScale', 0.1, 3.0, 0.1).name('Speed').onChange(v => {
        if (mixer && !guiOptions.paused) mixer.timeScale = v;
        if (xbotMixer && !guiOptions.paused) xbotMixer.timeScale = v;
        if (rosannaMixer && !guiOptions.paused) rosannaMixer.timeScale = v;
      });
      gui.add(guiOptions, 'frame', 0, 100, 1).name('Frame (%)').listen().onChange(v => {
        if (currentAction && currentAction.getClip()) {
           guiOptions.paused = true;
           if (mixer) mixer.timeScale = 0;
           if (xbotMixer) xbotMixer.timeScale = 0;
           if (rosannaMixer) rosannaMixer.timeScale = 0;
           const targetTime = (v / 100) * currentAction.getClip().duration;
           mixer.setTime(targetTime);
           if (xbotMixer) xbotMixer.setTime(targetTime);
           if (rosannaMixer) rosannaMixer.setTime(targetTime);
        }
      });`
);

// Mixers and Fixes
code = code.replace(
`          scene.add(xbotHelper);
        });`,
`          scene.add(xbotHelper);
          xbotMixer = new THREE.AnimationMixer(xbotModel);
        });`
);

code = code.replace(
`          scene.add(rosannaHelper);
        });`,
`          scene.add(rosannaHelper);
          
          rosannaModel.traverse(n => {
            if (n.isMesh && n.material) {
              if (Array.isArray(n.material)) {
                n.material.forEach(m => {
                  if (m.transparent && m.opacity === 1) m.transparent = false;
                  m.alphaTest = 0.5;
                });
              } else {
                if (n.material.transparent && n.material.opacity === 1) n.material.transparent = false;
                n.material.alphaTest = 0.5;
              }
            }
          });
          
          rosannaMixer = new THREE.AnimationMixer(rosannaModel);
        });`
);

code = code.replace(
`              const retargetedClip = retargetMixamoClip(
                animGltf, 
                laraModel
              );
              loadedClips[animDef.name] = retargetedClip;
              
              const rawScene = animGltf.scene || animGltf.scenes[0];
              rawScene.scale.set(100, 100, 100);
              rawScene.visible = false;
              rawAnimGroup.add(rawScene);
              rawAnimScenes[animDef.name] = rawScene;

              const rawMixer = new THREE.AnimationMixer(rawScene);
              rawAnimMixers.push(rawMixer);
              rawAnimActions[animDef.name] = rawMixer.clipAction(animGltf.animations[0]);`,
`              const rawClip = animGltf.animations[0];
              rawAnimClips[animDef.name] = rawClip;
              
              const retargetedClip = retargetMixamoClip(
                animGltf, 
                laraModel
              );
              loadedClips[animDef.name] = retargetedClip;`
);

code = code.replace(
`              const animOptions = Object.keys(loadedClips).sort();
              animOptions.unshift('None');
              
              gui.add(guiOptions, 'animation', animOptions).name('Animation').onChange(v => {
                playAnimation(v);
              });
              guiOptions.animation = 'None';
              playAnimation('None');`,
`              const animOptions = ['None', ...Object.keys(loadedClips).sort()];
              
              gui.add(guiOptions, 'animation', animOptions).name('Animation').onChange(v => {
                playAnimation(v);
              }).setValue('None');`
);

code = code.replace(
`    function playAnimation(name) {
      if (currentAction) currentAction.stop();
      if (currentRawAction) currentRawAction.stop();
      
      Object.values(rawAnimScenes).forEach(s => s.visible = false);

      if (name === 'None') return;
      if (loadedClips[name]) {
        currentAction = mixer.clipAction(loadedClips[name]);
        currentAction.play();
      }
      if (rawAnimActions[name]) {
        rawAnimScenes[name].visible = true;
        currentRawAction = rawAnimActions[name];
        currentRawAction.play();
      }
    }`,
`    function playAnimation(name) {
      if (currentAction) currentAction.stop();
      if (xbotAction) xbotAction.stop();
      if (rosannaAction) rosannaAction.stop();
      
      if (name === 'None') return;
      
      if (loadedClips[name]) {
        currentAction = mixer.clipAction(loadedClips[name]);
        currentAction.play();
        
        if (rosannaMixer) {
          rosannaAction = rosannaMixer.clipAction(loadedClips[name]);
          rosannaAction.play();
        }
      }
      
      if (rawAnimClips[name] && xbotMixer) {
        xbotAction = xbotMixer.clipAction(rawAnimClips[name]);
        xbotAction.play();
      }
    }`
);

code = code.replace(
`      if (mixer && !guiOptions.paused) {
        mixer.update(delta * guiOptions.timeScale);
      }
      rawAnimMixers.forEach(m => {
        if (!guiOptions.paused) m.update(delta * guiOptions.timeScale);
      });`,
`      if (mixer && !guiOptions.paused) mixer.update(delta * guiOptions.timeScale);
      if (xbotMixer && !guiOptions.paused) xbotMixer.update(delta * guiOptions.timeScale);
      if (rosannaMixer && !guiOptions.paused) rosannaMixer.update(delta * guiOptions.timeScale);`
);

code = code.replace(
`    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();`,
`    function onWindowResize() {
      const aspect = window.innerWidth / window.innerHeight;
      
      perspCamera.aspect = aspect;
      perspCamera.updateProjectionMatrix();
      
      const d = 150;
      orthoCamera.left = -d * aspect;
      orthoCamera.right = d * aspect;
      orthoCamera.top = d;
      orthoCamera.bottom = -d;
      orthoCamera.updateProjectionMatrix();`
);

// Fix hips height and dampening
code = code.replace("const targetHipsHeight = isLaraNative ? targetBone.defaultPosition.z : targetBone.defaultPosition.y;", "const targetHipsHeight = targetBone.defaultPosition.y;");

code = code.replace(
`            let finalDeltaQ = deltaQ;
            if (isShoulder) {
              // Dampen the world-space rotation for clavicles to prevent extreme Mixamo swings
              // from distorting the Rigify mesh, while still letting it move enough to keep arms attached.
              finalDeltaQ = new THREE.Quaternion().identity().slerp(deltaQ, 0.4);
            }
            const tgtAnimWorldQ = finalDeltaQ.clone().multiply(Q_tgt);`,
`            const tgtAnimWorldQ = deltaQ.clone().multiply(Q_tgt);`
);

// Save
fs.writeFileSync('test_metarig.html', code);
console.log("Done");
