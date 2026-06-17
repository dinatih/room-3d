import os

file_path = 'lara_xbot_debug.html'
with open(file_path, 'r') as f:
    content = f.read()

start_marker = "    // ── LOAD GLTF MODELS ──"
end_marker = "    async function loadAnimations() {"
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_models_func = """    // ── LOAD GLTF MODELS ──
    async function loadModels() {
      for (const [key, meta] of Object.entries(MODELS_META)) {
        document.getElementById('loading-label').innerText = `Chargement de ${meta.label}...`;

        const gltf = await new Promise((res, rej) => {
          gltfLoader.load(meta.path, res, undefined, rej);
        });

        const instance = gltf.scene;
        
        // Material overrides
        instance.traverse(c => {
          if (c.isMesh) {
            c.castShadow = c.receiveShadow = true;
            c.frustumCulled = false;
            
            if (c.material) {
              const mats = Array.isArray(c.material) ? c.material : [c.material];
              mats.forEach(mat => {
                mat.depthWrite = true;
                mat.transparent = true;
                if (key === 'lara') mat.opacity = 1.0;
                if (key === 'xbot') mat.opacity = 0.7;
                if (key === 'ybot') mat.opacity = 0.0;
              });
            }
          }
        });

        // Set scaling to match
        const box = new THREE.Box3().setFromObject(instance);
        const size = box.getSize(new THREE.Vector3());
        const targetHeight = 173.4;
        let scaleFactor = targetHeight / size.y;
        if (size.y > 1000) scaleFactor = targetHeight / (size.y / 100);
        instance.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Align pivot bottom to ground (Y=0)
        instance.updateMatrixWorld(true);
        const reBox = new THREE.Box3().setFromObject(instance);
        instance.position.y = -reBox.min.y;
        instance.updateMatrixWorld(true);

        // Wrapper
        const wrapper = new THREE.Group();
        wrapper.add(instance);
        scene.add(wrapper);
        
        // Capture rest pose with model at origin context
        scene.updateMatrixWorld(true);

        instance.traverse(c => {
          c.restWorldQuaternion = c.getWorldQuaternion(new THREE.Quaternion());
          if (c.isBone) {
            c.defaultPosition = c.position.clone();
            c.defaultRotation = c.rotation.clone();
            c.defaultScale = c.scale.clone();
            c.restLocalQuaternion = c.quaternion.clone();
          }
        });

        // Helpers
        const helper = new THREE.SkeletonHelper(instance);
        helper.material.linewidth = 2;
        helper.visible = state.showSkeletons;
        helper.raycast = () => {};
        scene.add(helper);

        instance.traverse(c => {
          if (c.isBone) {
            const axes = new THREE.AxesHelper(10);
            axes.visible = state.showAxes;
            axes.raycast = () => {};
            c.add(axes);
            meta.axesHelpers.push(axes);
          }
        });

        const mixer = new THREE.AnimationMixer(instance);

        // Save meta
        meta.instance = instance;
        meta.wrapper = wrapper;
        meta.skeletonHelper = helper;
        meta.mixer = mixer;

        // Embedded animations
        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach((clip, index) => {
            const clipName = clip.name || `anim_${index}`;
            const clipKey = `embedded_${key}_${clipName}`;
            loadedClips[clipKey] = clip;
            const select = document.getElementById('select-anim');
            const opt = document.createElement('option');
            opt.value = clipKey;
            opt.innerText = `Studio Embedded: ${clipName} (${meta.label})`;
            select.appendChild(opt);
          });
        }
      }
    }

"""

content = content[:start_idx] + new_models_func + content[end_idx:]
with open(file_path, 'w') as f:
    f.write(content)
print("SUCCESS")
