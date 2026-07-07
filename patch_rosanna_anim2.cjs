const fs = require('fs');
let metarig = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');

// 1. Update playAnimation
const oldPlayCall = /mixer\.stopAllAction\(\);\n[\s\S]*?mixer\.clipAction\(loadedClips\[name\]\)\.play\(\);\n[\s\S]*?\}/;
const newPlayCall = `mixer.stopAllAction();
      if (typeof rosannaMixer !== 'undefined' && rosannaMixer) rosannaMixer.stopAllAction();
      
      if (loadedClips[name]) {
        mixer.clipAction(loadedClips[name]).play();
      }
      if (typeof rosannaLoadedClips !== 'undefined' && rosannaLoadedClips[name] && typeof rosannaMixer !== 'undefined' && rosannaMixer) {
        rosannaMixer.clipAction(rosannaLoadedClips[name]).play();
      }
    }`;
metarig = metarig.replace(oldPlayCall, newPlayCall);

// 2. Update animate
const oldAnimate = /function animate\(\) \{\n[\s\S]*?if \(mixer\) mixer\.update\(delta\);\n[\s\S]*?\}/;
const newAnimate = `function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (!guiOptions.paused) {
        if (mixer) mixer.update(delta);
        if (typeof rosannaMixer !== 'undefined' && rosannaMixer) rosannaMixer.update(delta);
      }
      if (selectedBoneMarker && selectedBone && selectedBoneMarker.visible) {
        selectedBone.getWorldPosition(tempBonePos);
        selectedBoneMarker.position.copy(tempBonePos);
      }
      renderer.render(scene, camera);
    }`;
metarig = metarig.replace(oldAnimate, newAnimate);

fs.writeFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', metarig);
