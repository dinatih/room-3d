const fs = require('fs');

let allLara = fs.readFileSync('/home/dinatih/Projects/room-3d/all_lara_style.html', 'utf8');
const retargetStart = allLara.indexOf('function retargetMixamoClip(rawClip, targetInstance, animScene) {');
const retargetEnd = allLara.indexOf('function playAnimationOnModel', retargetStart);
let retargetCode = allLara.substring(retargetStart, retargetEnd);
retargetCode = retargetCode.replace('function retargetMixamoClip', 'function retargetForRosanna');

let metarig = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');

// 1. Inject retargetForRosanna
const injectPos = metarig.indexOf('function retargetMixamoClip(animGltf, targetInstance) {');
metarig = metarig.slice(0, injectPos) + retargetCode + '\n    ' + metarig.slice(injectPos);

// 2. Load Rosanna
const oldLoader = /loader\.load\('\.\/models\/lara_perfect\.glb', \(gltf\) => \{/;
const newLoader = `
        let rosannaModel = null;
        let rosannaMixer = null;
        let rosannaLoadedClips = {};

        loader.load('./media/sandbox/rosanna_lara_native.glb', (rosannaGltf) => {
          rosannaModel = rosannaGltf.scene;
          rosannaModel.position.set(100, 0, 0); 
          scene.add(rosannaModel);
          rosannaMixer = new THREE.AnimationMixer(rosannaModel);

          loader.load('./models/lara_perfect.glb', (gltf) => {`;
metarig = metarig.replace(oldLoader, newLoader);

// 3. Process Rosanna clip
const oldRetargetCall = /const retargetedClip = retargetMixamoClip\([\s\S]*?laraModel\n[\s\S]*?\);/;
const newRetargetCall = `const retargetedClip = retargetMixamoClip(
                animGltf, 
                laraModel
              );
              const rosannaClip = retargetForRosanna(animGltf.animations[0], rosannaModel, animGltf.scene || animGltf.scenes[0]);
              if (rosannaClip) {
                rosannaLoadedClips[animDef.name] = rosannaClip;
              }`;
metarig = metarig.replace(oldRetargetCall, newRetargetCall);

// 4. Play Rosanna animation
const oldPlayCall = /mixer\.stopAllAction\(\);\n[\s\S]*?mixer\.clipAction\(loadedClips\[animName\]\)\.play\(\);\n[\s\S]*?\}/;
const newPlayCall = `mixer.stopAllAction();
        rosannaMixer.stopAllAction();
        if (loadedClips[animName]) {
          mixer.clipAction(loadedClips[animName]).play();
        }
        if (rosannaLoadedClips[animName]) {
          rosannaMixer.clipAction(rosannaLoadedClips[animName]).play();
        }
      }`;
metarig = metarig.replace(oldPlayCall, newPlayCall);

// 5. Update animate loop
const oldAnimate = /function animate\(\) \{\n[\s\S]*?if \(mixer && !guiOptions\.paused\) mixer\.update\(dt\);\n[\s\S]*?\}/;
const newAnimate = `function animate() {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      if (!guiOptions.paused) {
        if (mixer) mixer.update(dt);
        if (rosannaMixer) rosannaMixer.update(dt);
      }
      renderer.render(scene, camera);
    }`;
metarig = metarig.replace(oldAnimate, newAnimate);

// 6. Close the Rosanna load block at the end of init()
metarig = metarig.replace(/animate\(\);\n            \}\n          \}\);\n        \}\);\n      \}\);\n    \}/, `animate();
            }
          });
        });
      });
      }); // Close Rosanna load
    }`);

fs.writeFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', metarig);
