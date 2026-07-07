
    
    
    

    

    let camera, scene, renderer, clock, mixer;
    let laraModel, skeletonHelper;
    let gui;
    let selectedBoneMarker;
    let guiOptions = {
      showSkeleton: true,
      wireframe: false,
      animation: 'None',
      paused: false,
      timeScale: 1.0
    };

    // Exact mapping from Mixamo bone names to Rigify metarig bone names
    const MIXAMO_TO_METARIG = {
      'Hips': 'spine',
      'Spine': 'spine001',
      'Spine1': 'spine002',
      'Spine2': 'spine003',
      'Neck': 'spine004',
      'Head': 'spine005',
      
      'LeftShoulder': 'shoulderL',
      'LeftArm': 'upper_armL',
      'LeftForeArm': 'forearmL',
      'LeftHand': 'handL',
      
      'RightShoulder': 'shoulderR',
      'RightArm': 'upper_armR',
      'RightForeArm': 'forearmR',
      'RightHand': 'handR',
      
      'LeftUpLeg': 'thighL',
      'LeftLeg': 'shinL',
      'LeftFoot': 'footL',
      'LeftToeBase': 'toeL',
      
      'RightUpLeg': 'thighR',
      'RightLeg': 'shinR',
      'RightFoot': 'footR',
      'RightToeBase': 'toeR',

      // Fingers - Left
      'LeftHandThumb1': 'thumb01L',
      'LeftHandThumb2': 'thumb02L',
      'LeftHandThumb3': 'thumb03L',
      'LeftHandIndex1': 'f_index01L',
      'LeftHandIndex2': 'f_index02L',
      'LeftHandIndex3': 'f_index03L',
      'LeftHandMiddle1': 'f_middle01L',
      'LeftHandMiddle2': 'f_middle02L',
      'LeftHandMiddle3': 'f_middle03L',
      'LeftHandRing1': 'f_ring01L',
      'LeftHandRing2': 'f_ring02L',
      'LeftHandRing3': 'f_ring03L',
      'LeftHandPinky1': 'f_pinky01L',
      'LeftHandPinky2': 'f_pinky02L',
      'LeftHandPinky3': 'f_pinky03L',

      // Fingers - Right
      'RightHandThumb1': 'thumb01R',
      'RightHandThumb2': 'thumb02R',
      'RightHandThumb3': 'thumb03R',
      'RightHandIndex1': 'f_index01R',
      'RightHandIndex2': 'f_index02R',
      'RightHandIndex3': 'f_index03R',
      'RightHandMiddle1': 'f_middle01R',
      'RightHandMiddle2': 'f_middle02R',
      'RightHandMiddle3': 'f_middle03R',
      'RightHandRing1': 'f_ring01R',
      'RightHandRing2': 'f_ring02R',
      'RightHandRing3': 'f_ring03R',
      'RightHandPinky1': 'f_pinky01R',
      'RightHandPinky2': 'f_pinky02R',
      'RightHandPinky3': 'f_pinky03R'
    };

    init();

    function init() {
      const container = document.createElement('div');
      document.body.appendChild(container);

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 100, 250);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xa0a0a0);
      scene.fog = new THREE.Fog(0xa0a0a0, 100, 10000);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
      hemiLight.position.set(0, 200, 0);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(-30, 100, 100);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const grid = new THREE.GridHelper(1000, 100, 0x000000, 0x000000);
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
      scene.add(grid);

      // Selected bone marker
      selectedBoneMarker = new THREE.Mesh(
        new THREE.SphereGeometry(2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x88ccff, depthTest: false, transparent: true, opacity: 0.8 })
      );
      selectedBoneMarker.renderOrder = 999;
      selectedBoneMarker.visible = false;
      scene.add(selectedBoneMarker);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 100, 0);
      controls.update();

      window.addEventListener('resize', onWindowResize);
      window.addEventListener('pointerdown', onPointerDown);

      clock = new THREE.Clock();
      
      setupGUI();
      loadModels();
    }

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 2; // Make it easier to click skeleton lines
    const mouse = new THREE.Vector2();

    let selectedBone = null;

    function buildBoneHierarchy(bone) {
      if (!bone.isBone && bone !== laraModel) {
        // If it's a node but not a bone, just traverse children (to find the root bone)
        let html = '';
        bone.children.forEach(c => { html += buildBoneHierarchy(c); });
        return html;
      }
      
      let html = '';
      if (bone.isBone) {
        html += `<li id="li-bone-${bone.name}" class="bone-item" onclick="selectBoneByName('${bone.name}', event)">🦴 ${bone.name}</li>`;
      }
      
      if (bone.children && bone.children.length > 0) {
        const childHtml = bone.children.map(c => buildBoneHierarchy(c)).join('');
        if (childHtml) {
          if (bone.isBone) {
            html = html.replace('</li>', `<ul>${childHtml}</ul></li>`);
          } else {
            html += childHtml;
          }
        }
      }
      return html;
    }

    const tempBonePos = new THREE.Vector3();
    
    window.selectBoneByName = function(name, event) {
      if (event) event.stopPropagation();
      if (selectedBone) {
        const oldLi = document.getElementById('li-bone-' + selectedBone.name);
        if (oldLi) oldLi.classList.remove('selected');
      }
      const bone = laraModel.getObjectByName(name);
      if (bone) {
        selectedBone = bone;
        const li = document.getElementById('li-bone-' + name);
        if (li) {
          li.classList.add('selected');
          li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        bone.getWorldPosition(tempBonePos);
        selectedBoneMarker.position.copy(tempBonePos);
        selectedBoneMarker.visible = true;
        
        console.log("Selected Bone:", name);
      }
    };

    function updateBoneUI() {
      let infoDiv = document.getElementById('bone-info');
      if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'bone-info';
        infoDiv.style.position = 'absolute';
        infoDiv.style.bottom = '10px';
        infoDiv.style.left = '10px';
        infoDiv.style.backgroundColor = '#2a2a2a';
        infoDiv.style.color = '#e0e0e0';
        infoDiv.style.padding = '10px';
        infoDiv.style.maxHeight = '400px';
        infoDiv.style.width = '300px';
        infoDiv.style.overflowY = 'auto';
        infoDiv.style.fontFamily = 'monospace';
        infoDiv.style.fontSize = '12px';
        infoDiv.style.border = '1px solid #444';
        infoDiv.style.borderRadius = '5px';
        infoDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
        
        const style = document.createElement('style');
        style.innerHTML = `
          #bone-info ul { padding-left: 15px; margin: 2px 0; border-left: 1px dashed #555; }
          #bone-info li { list-style-type: none; margin: 2px 0; cursor: pointer; padding: 2px 4px; border-radius: 3px; }
          #bone-info li:hover { background-color: #3a3a3a; }
          #bone-info li.selected { background-color: rgba(255,255,255,0.15); color: #88ccff; font-weight: bold; border-left: 2px solid #88ccff; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(infoDiv);
      }
      infoDiv.innerHTML = `<strong style="color:white;">Bone Hierarchy:</strong><ul>${buildBoneHierarchy(laraModel)}</ul>`;
    }

    function findClosestBone(model, worldPoint) {
      let closestBone = null;
      let minDistance = Infinity;
      const tPos = new THREE.Vector3();
      
      model.traverse(node => {
        if (node.isBone) {
          node.getWorldPosition(tPos);
          const dist = tPos.distanceTo(worldPoint);
          if (dist < minDistance) {
            minDistance = dist;
            closestBone = node;
          }
        }
      });
      return closestBone;
    }

    function onPointerDown(event) {
      // Don't intercept clicks on the UI
      if (event.target.tagName === 'LI' || event.target.closest('#bone-info') || event.target.closest('.lil-gui')) {
        return;
      }
      
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (laraModel) {
        const intersects = raycaster.intersectObject(laraModel, true);
        if (intersects.length > 0) {
          const intersectPoint = intersects[0].point;
          const closestBone = findClosestBone(laraModel, intersectPoint);
          if (closestBone) {
            selectBoneByName(closestBone.name);
          }
        }
      }
    }


    function setupGUI() {
      gui = new GUI();
      gui.add(guiOptions, 'showSkeleton').name('Afficher Squelette').onChange(v => {
        if (skeletonHelper) skeletonHelper.visible = v;
      });
      gui.add(guiOptions, 'wireframe').name('Wireframe').onChange(v => {
        if (laraModel) {
          laraModel.traverse(n => {
            if (n.isMesh && n.material) {
              // Handle multiple materials
              if (Array.isArray(n.material)) {
                n.material.forEach(m => m.wireframe = v);
              } else {
                n.material.wireframe = v;
              }
            }
          });
        }
      });
      gui.add(guiOptions, 'paused').name('Pause').onChange(v => {
        if (mixer) mixer.timeScale = v ? 0 : guiOptions.timeScale;
      });
      gui.add(guiOptions, 'timeScale', 0.1, 3.0, 0.1).name('Speed').onChange(v => {
        if (mixer && !guiOptions.paused) mixer.timeScale = v;
      });
    }

    let loadedClips = {};
    let currentAction = null;

    function loadModels() {
      const loader = new GLTFLoader();
      
      // Load Lara Model
      
        let rosannaModel = null;
        let rosannaMixer = null;
        let rosannaLoadedClips = {};

        loader.load('./media/sandbox/rosanna_lara_native.glb', (rosannaGltf) => {
          rosannaModel = rosannaGltf.scene;
          rosannaModel.position.set(100, 0, 0); 
          scene.add(rosannaModel);
          rosannaMixer = new THREE.AnimationMixer(rosannaModel);

          loader.load('./models/lara_perfect.glb', (gltf) => {
        laraModel = gltf.scene;
        laraModel.traverse(child => {
          if (child.name.toLowerCase().includes('pistol') || child.name.toLowerCase().includes('gun')) {
            child.visible = false;
          }
        });
        window.laraModel = laraModel;
        scene.add(laraModel);
        
        // Setup Rest Pose Math
        setupLaraModel(laraModel);
        updateBoneUI();

        skeletonHelper = new THREE.SkeletonHelper(laraModel);
        scene.add(skeletonHelper);

        mixer = new THREE.AnimationMixer(laraModel);

        // Load animations
                const animsToLoad = [
          { name: 'agreeing', url: './models/test_metarig_anims/agreeing.glb' },
          { name: 'back_flip_to_uppercut', url: './models/test_metarig_anims/back_flip_to_uppercut.glb' },
          { name: 'being_carried', url: './models/test_metarig_anims/being_carried.glb' },
          { name: 'bellydancing', url: './models/test_metarig_anims/bellydancing.glb' },
          { name: 'catwalk_sequence_05', url: './models/test_metarig_anims/catwalk_sequence_05.glb' },
          { name: 'dancing_twerk', url: './models/test_metarig_anims/dancing_twerk.glb' },
          { name: 'double_leg_takedown___attacker', url: './models/test_metarig_anims/double_leg_takedown___attacker.glb' },
          { name: 'double_leg_takedown___victim', url: './models/test_metarig_anims/double_leg_takedown___victim.glb' },
          { name: 'drinking_fountain', url: './models/test_metarig_anims/drinking_fountain.glb' },
          { name: 'female_laying_pose', url: './models/test_metarig_anims/female_laying_pose.glb' },
          { name: 'female_walk', url: './models/test_metarig_anims/female_walk.glb' },
          { name: 'flip_kick', url: './models/test_metarig_anims/flip_kick.glb' },
          { name: 'happy_idle', url: './models/test_metarig_anims/happy_idle.glb' },
          { name: 'happy_walk', url: './models/test_metarig_anims/happy_walk.glb' },
          { name: 'hook', url: './models/test_metarig_anims/hook.glb' },
          { name: 'idle', url: './models/test_metarig_anims/idle.glb' },
          { name: 'jump', url: './models/test_metarig_anims/jump.glb' },
          { name: 'kiss', url: './models/test_metarig_anims/kiss.glb' },
          { name: 'kiss_from_man', url: './models/test_metarig_anims/kiss_from_man.glb' },
          { name: 'kiss_from_woman', url: './models/test_metarig_anims/kiss_from_woman.glb' },
          { name: 'knee_kick_lead', url: './models/test_metarig_anims/knee_kick_lead.glb' },
          { name: 'laughing', url: './models/test_metarig_anims/laughing.glb' },
          { name: 'no', url: './models/test_metarig_anims/no.glb' },
          { name: 'pistol_idle', url: './models/test_metarig_anims/pistol_idle.glb' },
          { name: 'release_hostage___villain', url: './models/test_metarig_anims/release_hostage___villain.glb' },
          { name: 'taken_hostage___victim', url: './models/test_metarig_anims/taken_hostage___victim.glb' },
          { name: 'taken_hostage___villain', url: './models/test_metarig_anims/taken_hostage___villain.glb' },
          { name: 'skinning_test', url: './models/test_metarig_anims/skinning_test.glb' },
          { name: 'walking', url: './models/test_metarig_anims/walking.glb' }
        ];

        let loadedCount = 0;
        animsToLoad.forEach(animDef => {
          loader.load(animDef.url, (animGltf) => {
            if (!animGltf.animations.length) {
              console.warn("No animations in", animDef.url);
            } else {
              const retargetedClip = retargetMixamoClip(
                animGltf, 
                laraModel
              );
              const rosannaClip = retargetForRosanna(animGltf.animations[0], rosannaModel, animGltf.scene || animGltf.scenes[0]);
              if (rosannaClip) {
                rosannaLoadedClips[animDef.name] = rosannaClip;
              }
              loadedClips[animDef.name] = retargetedClip;
            }
            
            loadedCount++;
            if (loadedCount === animsToLoad.length) {
              const animOptions = Object.keys(loadedClips).sort();
              animOptions.unshift('None');
              
              gui.add(guiOptions, 'animation', animOptions).name('Animation').onChange(v => {
                playAnimation(v);
              });
              guiOptions.animation = 'None';
              playAnimation('None');
              animate();
            }
          });
        });
      });
      }); // Close Rosanna load
    }

    let currentRosannaAction = null;
    function playAnimation(name) {
      if (currentAction) currentAction.stop();
      if (currentRosannaAction) currentRosannaAction.stop();
      if (name === 'None') return;
      
      if (loadedClips[name]) {
        currentAction = mixer.clipAction(loadedClips[name]);
        currentAction.play();
      }
      if (typeof rosannaLoadedClips !== 'undefined' && rosannaLoadedClips[name] && typeof rosannaMixer !== 'undefined' && rosannaMixer) {
        currentRosannaAction = rosannaMixer.clipAction(rosannaLoadedClips[name]);
        currentRosannaAction.play();
      }
    }

    function setupLaraModel(model) {
      // Scale compensation if needed
      model.scale.set(100, 100, 100);
      model.position.y = 0;
      model.updateMatrixWorld(true);

      model.traverse(node => {
        if (node.isBone) {
          node.defaultPosition = node.position.clone();
          node.restLocalQuaternion = node.quaternion.clone();
          node.restWorldQuaternion = new THREE.Quaternion();
          node.getWorldQuaternion(node.restWorldQuaternion);
        }
      });
    }

    function retargetForRosanna(rawClip, targetInstance, animScene) {
      if (!rawClip || !targetInstance) return null;

      const animBones = {};
      const sourceHairMap = new Map();
      if (animScene) {
        animScene.updateMatrixWorld(true);

        const sourceHairBones = [];
        animScene.traverse(c => {
          if (c.isBone) {
            const nameLower = (c.name || '').toLowerCase();
            if (nameLower.includes('hair') || nameLower.includes('ponytail') || nameLower.includes('braid')) {
              const match = c.name.match(/mixamorig[:_]?(.+)/i);
              const base = match ? match[1] : c.name;
              sourceHairBones.push({ bone: c, baseName: base, depth: getDepth(c) });
            }
          }
        });
        sourceHairBones.sort((a, b) => a.depth - b.depth);
        sourceHairBones.forEach((hb, idx) => {
          sourceHairMap.set(hb.baseName.toLowerCase(), `hair_${idx + 1}`);
        });

        animScene.traverse(c => {
          if (c.isBone) {
            const match = c.name.match(/mixamorig[:_]?(.+)/i);
            if (match) {
              animBones[match[1]] = {
                restWorldQuaternion: c.getWorldQuaternion(new THREE.Quaternion()),
                restLocalQuaternion: c.quaternion.clone(),
                parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion(),
                defaultPosition: c.position.clone()
              };
            }
          }
        });
      }

      const clonedTracks = [];
      for (const track of rawClip.tracks) {
        const cl = track.clone();
        cl.times = new Float32Array(track.times);
        cl.values = new Float32Array(track.values);
        clonedTracks.push(cl);
      }
      const workingClip = new THREE.AnimationClip(rawClip.name, rawClip.duration, clonedTracks);

      for (const track of workingClip.tracks) {
        if (track.name.endsWith('.position')) {
          const firstVal = new THREE.Vector3(track.values[0], track.values[1], track.values[2]);
          if (firstVal.length() > 5.0) {
            for (let i = 0; track.values.length > i; i++) {
              track.values[i] *= 0.01;
            }
          }
        }
      }

      const rootRotTrackIndex = workingClip.tracks.findIndex(t => t.name.toLowerCase().includes('rootjoint') && t.name.endsWith('.quaternion'));
      const hipsRotTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('hips') || t.name.toLowerCase().endsWith('hips.quaternion')) && t.name.endsWith('.quaternion') && !t.name.toLowerCase().includes('rootjoint'));

      if (rootRotTrackIndex !== -1) {
        const rootRotTrack = workingClip.tracks[rootRotTrackIndex];
        if (hipsRotTrackIndex !== -1) {
          const hipsRotTrack = workingClip.tracks[hipsRotTrackIndex];
          const timesSet = new Set([...rootRotTrack.times, ...hipsRotTrack.times]);
          const times = Array.from(timesSet).sort((a, b) => a - b);
          
          const values = new Float32Array(times.length * 4);
          
          function evaluateQuaternionTrack(track, t) {
            const trackTimes = track.times;
            const trackValues = track.values;
            if (t <= trackTimes[0]) {
              return new THREE.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
            }
            if (t >= trackTimes[trackTimes.length - 1]) {
              const idx = (trackTimes.length - 1) * 4;
              return new THREE.Quaternion(trackValues[idx], trackValues[idx+1], trackValues[idx+2], trackValues[idx+3]);
            }
            let i = 0;
            while (i < trackTimes.length - 1 && trackTimes[i+1] < t) {
              i++;
            }
            const t0 = trackTimes[i];
            const t1 = trackTimes[i+1];
            const alpha = (t - t0) / (t1 - t0);
            
            const q0 = new THREE.Quaternion(trackValues[4*i], trackValues[4*i+1], trackValues[4*i+2], trackValues[4*i+3]);
            const q1 = new THREE.Quaternion(trackValues[4*(i+1)], trackValues[4*(i+1)+1], trackValues[4*(i+1)+2], trackValues[4*(i+1)+3]);
            return q0.slerp(q1, alpha);
          }

          for (let i = 0; i < times.length; i++) {
            const t = times[i];
            const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
            const qHips = evaluateQuaternionTrack(hipsRotTrack, t);
            const qCombined = qRoot.multiply(qHips);
            
            values[4*i] = qCombined.x;
            values[4*i+1] = qCombined.y;
            values[4*i+2] = qCombined.z;
            values[4*i+3] = qCombined.w;
          }
          
          hipsRotTrack.times = new Float32Array(times);
          hipsRotTrack.values = values;
          workingClip.tracks.splice(rootRotTrackIndex, 1);
        } else {
          const hipsPosTrack = workingClip.tracks.find(t => t.name.toLowerCase().includes('hips') && !t.name.toLowerCase().includes('rootjoint'));
          let hipsName = 'mixamorig:Hips.quaternion';
          if (hipsPosTrack) {
            hipsName = hipsPosTrack.name.split('.')[0] + '.quaternion';
          }
          rootRotTrack.name = hipsName;
        }
      }

      let srcHipsDefaultY = 0.991;
      let computedHipsRatio = 1.0; 
      
      const hipsBone = targetInstance.getObjectByName(resolveTargetBoneName(targetInstance, 'Hips', sourceHairMap));
      
      for (const tr of workingClip.tracks) {
        const [boneFull, prop] = tr.name.split('.');
        const match = boneFull.match(/mixamorig[:_]?(.+)/i);
        if (match) {
          const baseName = match[1];
          if (prop === 'position' && baseName.toLowerCase() === 'hips') {
            let refSrcY = 0.991;
            if (animBones[baseName]) {
              refSrcY = animBones[baseName].defaultPosition.y;
            }
            if (refSrcY > 5.0) {
              refSrcY *= 0.01;
            }
            srcHipsDefaultY = refSrcY;
            
            let targetHipsHeight = 0.991;
            if (hipsBone && hipsBone.defaultPosition) {
              const isLaraNative = targetInstance.getObjectByName('mixamorig_root_hips') !== undefined;
              targetHipsHeight = isLaraNative ? hipsBone.defaultPosition.z : hipsBone.defaultPosition.y;
            }
            
            if (refSrcY > 0) {
              computedHipsRatio = targetHipsHeight / refSrcY;
            }
          }
        }
      }

      const hasRootTranslation = workingClip.tracks.some(t => t.name.toLowerCase().includes('rootjoint') && t.name.endsWith('.position'));
      const tracks = [];

      for (const tr of workingClip.tracks) {
        const [boneFull, prop] = tr.name.split('.');
        const match = boneFull.match(/mixamorig[:_]?(.+)/i);
        if (!match) continue;
        let baseName = match[1];

        if (prop === 'position' && baseName.toLowerCase() === 'hips' && hasRootTranslation) {
          continue;
        }

        let isRootJointTranslation = false;
        if (prop === 'position' && baseName.toLowerCase().includes('rootjoint')) {
          baseName = 'Hips';
          isRootJointTranslation = true;
        }

        const targetBoneName = resolveTargetBoneName(targetInstance, baseName, sourceHairMap);
        if (targetBoneName) {
          if (prop === 'scale') continue;

          const isHips = targetBoneName.toLowerCase().endsWith('hips');
          if (prop === 'position' && !isHips) continue;

          const clone = tr.clone();
          clone.name = `${targetBoneName}.${prop}`;

          if (prop === 'position' && isHips) {
            const bone = targetInstance.getObjectByName(targetBoneName);
            if (bone && bone.defaultPosition) {
              let P_src = null;
              if (isRootJointTranslation) {
                P_src = new THREE.Quaternion();
              } else if (animBones[baseName]) {
                P_src = animBones[baseName].parentRestWorldQuaternion;
              } else {
                P_src = new THREE.Quaternion();
              }
              const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
                ? bone.parent.restWorldQuaternion
                : new THREE.Quaternion();
              const P_tgt_inv = P_tgt.clone().invert();
              
              let srcRestPos = null;
              if (isRootJointTranslation) {
                srcRestPos = new THREE.Vector3(0, 0, 0);
              } else if (animBones[baseName]) {
                srcRestPos = animBones[baseName].defaultPosition.clone();
                if (srcRestPos.length() > 5.0) {
                  srcRestPos.multiplyScalar(0.01);
                }
              } else {
                srcRestPos = new THREE.Vector3(0, srcHipsDefaultY, 0);
              }

              const animNameLower = (rawClip.name || "").toLowerCase();
              const isWalk = (animNameLower.includes('walk') || 
                              animNameLower.includes('run') || 
                              animNameLower.includes('step') || 
                              animNameLower.includes('stairs')) &&
                             !animNameLower.includes('dance');

              if (isWalk) {
                for (let j = 0; j < clone.values.length / 3; j++) {
                  let yVal = clone.values[3*j+1];
                  const dx = (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
                  const dy = 0.0; // walking in-place
                  const dz = (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;
                  
                  const dP = new THREE.Vector3(dx, dy, dz)
                    .applyQuaternion(P_src)
                    .applyQuaternion(P_tgt_inv);
                  const resPos = bone.defaultPosition.clone().add(dP);
                  
                  clone.values[3*j] = resPos.x;
                  clone.values[3*j+1] = resPos.y;
                  clone.values[3*j+2] = resPos.z;
                }
              } else {
                for (let j = 0; j < clone.values.length / 3; j++) {
                  let yVal = clone.values[3*j+1];
                  if (isRootJointTranslation && (animNameLower.includes('laying') || animNameLower.includes('sleeping'))) {
                    yVal = 0.12; 
                  }
                  const dx = (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
                  const dy = (yVal - srcRestPos.y) * computedHipsRatio;
                  const dz = (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;
                  
                  const dP = new THREE.Vector3(dx, dy, dz)
                    .applyQuaternion(P_src)
                    .applyQuaternion(P_tgt_inv);
                  const resPos = bone.defaultPosition.clone().add(dP);
                  
                  clone.values[3*j] = resPos.x;
                  clone.values[3*j+1] = resPos.y;
                  clone.values[3*j+2] = resPos.z;
                }
              }
            }
          }

          if (prop === 'quaternion') {
            const tgtLower = targetBoneName.toLowerCase();
            const isClavicle = tgtLower.includes('clavicle') || 
                               tgtLower.includes('shoulder_1') || 
                               tgtLower.includes('shoulder1') || 
                               (tgtLower.includes('shoulder') && 
                                !tgtLower.includes('shoulder_2') && 
                                !tgtLower.includes('shoulder2') && 
                                !tgtLower.includes('shoulder 2'));
            if (isClavicle) continue;

            const bone = targetInstance.getObjectByName(targetBoneName);
            if (bone) {
              if (bone.restLocalQuaternion && bone.restWorldQuaternion) {
                let B_src = null;
                let P_src = null;
                
                if (animBones[baseName]) {
                  const cached = animBones[baseName];
                  B_src = cached.restWorldQuaternion;
                  P_src = cached.parentRestWorldQuaternion;
                } else {
                  B_src = new THREE.Quaternion();
                  P_src = new THREE.Quaternion();
                }
                
                if (B_src && P_src) {
                  const B_tgt = bone.restWorldQuaternion;
                  const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
                    ? bone.parent.restWorldQuaternion
                    : new THREE.Quaternion();
                  
                  const P_tgt_inv = P_tgt.clone().invert();
                  const B_src_inv = B_src.clone().invert();

                  for (let i = 0; i < clone.values.length; i += 4) {
                    const srcLocalQ = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
                    const animWorldQ = P_src.clone().multiply(srcLocalQ);
                    const deltaQ = animWorldQ.clone().multiply(B_src_inv);
                    const tgtAnimWorldQ = deltaQ.clone().multiply(B_tgt);
                    const tgtLocalQ = P_tgt_inv.clone().multiply(tgtAnimWorldQ).normalize();

                    clone.values[i] = tgtLocalQ.x;
                    clone.values[i+1] = tgtLocalQ.y;
                    clone.values[i+2] = tgtLocalQ.z;
                    clone.values[i+3] = tgtLocalQ.w;
                  }
                } else {
                  // Fallback
                  const parentRestWorldQ = (bone.parent && bone.parent.restWorldQuaternion)
                    ? bone.parent.restWorldQuaternion
                    : new THREE.Quaternion();
                  const parentInv = parentRestWorldQ.clone().invert();
                  const boneRestLocalQ = bone.restLocalQuaternion.clone();

                  for (let i = 0; i < clone.values.length; i += 4) {
                    const q = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
                    const resQ = parentInv.clone()
                      .multiply(q)
                      .multiply(parentRestWorldQ)
                      .multiply(boneRestLocalQ);

                    clone.values[i] = resQ.x;
                    clone.values[i+1] = resQ.y;
                    clone.values[i+2] = resQ.z;
                    clone.values[i+3] = resQ.w;
                  }
                }
              }
            }
          }

          tracks.push(clone);
        }
      }

      const trackSample = tracks.find(t => t.name.includes('LeftArm') || t.name.includes('arm_left_shoulder_2') || t.name.includes('upper_arm'));
      if (trackSample) {
        console.log(`[TrackSample] model="${targetInstance.name}" name="${trackSample.name}" valuesSample="${Array.from(trackSample.values.slice(0, 8)).map(n => n.toFixed(4)).join(', ')}"`);
      }
      console.log(`[Retarget] model="${targetInstance.name}" rawTracks=${workingClip.tracks.length} retargetedTracks=${tracks.length} sampleHips="${resolveTargetBoneName(targetInstance, 'Hips', sourceHairMap)}" sampleLeftArm="${resolveTargetBoneName(targetInstance, 'LeftArm', sourceHairMap)}"`);
      return new THREE.AnimationClip(`${workingClip.name}_retargeted`, workingClip.duration, tracks);
    }

    const ANIMATION_FILES = [
      "idle.glb",
      "anim_back_flip_to_uppercut.glb",
      "walking.glb",
      "happy_walk.glb",
      "victory.glb",
      "jumping_jacks.glb",
      "t-pose.glb",
      "angry_gesture.glb",
      "ascending_stairs.glb",
      "asking_question.glb",
      "beckoning.glb",
      "catwalk_sequence_01.glb",
      "catwalk_sequence_02.glb",
      "catwalk_sequence_03.glb",
      "catwalk_sequence_04.glb",
      "catwalk_sequence_05.glb",
      "cheering_while_sitting.glb",
      "clapping.glb",
      "closing.glb",
      "crawl_backwards_in_prone.glb",
      "descending_stairs.glb",
      "dig_and_plant_seeds.glb",
      "disappointed.glb",
      "double_leg_takedown_-_attacker.glb",
      "drinking_fountain.glb",
      "finding.glb",
      "gaming.glb",
      "hanging_idle.glb",
      "having_a_meeting,_female.glb",
      "having_a_meeting,_male.glb",
      "laying_seizure.glb",
      "laying_severe_cough.glb",
      "left_turn.glb",
      "looking_through_files_low.glb",
      "martelo_do_chau_sem_mao.glb",
      "one_shoulder_lean.glb",
      "pick_fruit.glb",
      "plant_a_plant.glb",
      "plant_tree.glb",
      "pointing.glb",
      "pull_pilot_from_seat.glb",
      "pull_plant.glb",
      "pulled_from_seat.glb",
      "rapping.glb",
      "right_turn.glb",
      "rummaging.glb",
      "scared.glb",
      "searching_pockets.glb",
      "seated_idle.glb",
      "sitting_drinking.glb",
      "sitting_talking.glb",
      "skinning_test.glb",
      "stand_up.glb",
      "standing_arguing.glb",
      "surprised.glb",
      "swing_into_wall.glb",
      "talking.glb",
      "talking_at_watercooler.glb",
      "talking_on_a_cell_phone.glb",
      "talking_on_phone.glb",
      "telling_a_secret.glb",
      "tonic_seizure.glb",
      "tripping.glb",
      "watering.glb",
      "wheelbarrow_walk_turn.glb",
      "wheelchair.glb",
      "yelling.glb",
      "woman-solo.glb",
      "knee-push-up.glb"
    ];

    function formatName(fileName) {
      let name = fileName.replace('.glb', '');
      name = name.replace(/_/g, ' ');
      name = name.replace(/,/g, '');
      name = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return name;
    }

    let currentAnimFile = null;
    let rawAnimClip = null;
    let animScene = null;
    let isPaused = false;
    let playbackSpeed = 1.0;

    window.getCurrentAnimFile = () => currentAnimFile;
    window.getIsPaused = () => isPaused;
    window.getPlaybackSpeed = () => playbackSpeed;

    
    function retargetMixamoClip(animGltf, targetInstance) {
      const clip = animGltf.animations[0];
      const sourceScene = animGltf.scene || animGltf.scenes[0];
      
      // Build dynamic source rest pose mapping from this specific GLTF
      sourceScene.updateMatrixWorld(true);
      const animBones = {};
      sourceScene.traverse(node => {
        if (node.isBone) {
          const match = node.name.match(/mixamorig[:_]?(.+)/i);
          let baseName = match ? match[1] : null;
          if (!baseName && node.name.toLowerCase().includes('rootjoint')) {
            baseName = 'Hips';
          }
          if (baseName) {
            const restWorldQ = new THREE.Quaternion();
            node.getWorldQuaternion(restWorldQ);
            
            const parentRestWorldQ = new THREE.Quaternion();
            if (node.parent) {
              node.parent.getWorldQuaternion(parentRestWorldQ);
            }
            const restWorldP = new THREE.Vector3();
            node.getWorldPosition(restWorldP);

            animBones[baseName] = {
              restWorldQuaternion: restWorldQ,
              parentRestWorldQuaternion: parentRestWorldQ,
              restWorldPosition: restWorldP,
              parentMatrixWorld: node.parent ? node.parent.matrixWorld.clone() : new THREE.Matrix4()
            };
          }
        }
      });

      const newTracks = [];

      clip.tracks.forEach(tr => {
        let [boneFull, prop] = tr.name.split('.');
        const match = boneFull.match(/mixamorig[:_]?(.+)/i);
        let baseName = match ? match[1] : null;

        if (!baseName && boneFull.toLowerCase().includes('rootjoint')) {
          baseName = 'Hips';
        }

        if (!baseName) return;

        const targetBoneName = MIXAMO_TO_METARIG[baseName];
        if (!targetBoneName) return; // Skip unmapped bones

        const targetBone = targetInstance.getObjectByName(targetBoneName);
        if (!targetBone) {
          console.warn('Target bone not found in model:', targetBoneName);
          return;
        }

        if (prop === 'scale') return;

        const isHips = (baseName === 'Hips');
        if (prop === 'position' && !isHips) return;

        const clone = tr.clone();
        clone.name = `${targetBoneName}.${prop}`;

        if (prop === 'position' && isHips) {
          const P_tgt = (targetBone.parent && targetBone.parent.restWorldQuaternion)
            ? targetBone.parent.restWorldQuaternion
            : new THREE.Quaternion();
          const P_tgt_inv = P_tgt.clone().invert();

          const mixamoBone = animBones[baseName];
          if (!mixamoBone) return;

          // Compute first frame world position to use as reference rest pose
          const parentMatrixWorld = mixamoBone.parentMatrixWorld || new THREE.Matrix4();
          const firstLocalP = new THREE.Vector3(clone.values[0], clone.values[1], clone.values[2]);
          const firstWorldP = firstLocalP.applyMatrix4(parentMatrixWorld);
          
          // Use the true REST pose height to avoid scaling bugs on prone animations
          const mixamoRestY = mixamoBone.restWorldPosition.y;
          
          const isLaraNative = targetInstance.getObjectByName('mixamorig_root_hips') !== undefined;
          const targetHipsHeight = isLaraNative ? targetBone.defaultPosition.z : targetBone.defaultPosition.y;
          
          let computedHipsRatio = 1.0;
          if (mixamoRestY > 0.001) {
             computedHipsRatio = targetHipsHeight / mixamoRestY;
          }

          for (let i = 0; i < clone.values.length; i += 3) {
            const srcLocalP = new THREE.Vector3(clone.values[i], clone.values[i+1], clone.values[i+2]);
            const srcWorldP = srcLocalP.applyMatrix4(parentMatrixWorld);
            
            // World-space delta from first frame
            const deltaWorld = srcWorldP.sub(firstWorldP);
            
            // Scale translation based on character height ratio
            deltaWorld.multiplyScalar(computedHipsRatio);
            
            // Convert to target bone's local space
            const localDelta = deltaWorld.applyQuaternion(P_tgt_inv);
            
            clone.values[i]   = targetBone.defaultPosition.x + localDelta.x;
            clone.values[i+1] = targetBone.defaultPosition.y + localDelta.y;
            clone.values[i+2] = targetBone.defaultPosition.z + localDelta.z;
          }
        }

        if (prop === 'quaternion') {
          const isShoulder = targetBoneName.toLowerCase().includes('shoulder');

          const mixamoBone = animBones[baseName];
          if (!mixamoBone) return;

          const Q_src = mixamoBone.restWorldQuaternion;
          const P_src = mixamoBone.parentRestWorldQuaternion;
          const Q_src_inv = Q_src.clone().invert();
          
          const Q_tgt = targetBone.restWorldQuaternion;
          const P_tgt = (targetBone.parent && targetBone.parent.restWorldQuaternion)
            ? targetBone.parent.restWorldQuaternion
            : new THREE.Quaternion();
          const P_tgt_inv = P_tgt.clone().invert();

          for (let i = 0; i < clone.values.length; i += 4) {
            const srcLocalQ = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
            const animWorldQ = P_src.clone().multiply(srcLocalQ);
            const deltaQ = animWorldQ.clone().multiply(Q_src_inv);
            
            let finalDeltaQ = deltaQ;
            if (isShoulder) {
              // Dampen the world-space rotation for clavicles to prevent extreme Mixamo swings
              // from distorting the Rigify mesh, while still letting it move enough to keep arms attached.
              finalDeltaQ = new THREE.Quaternion().identity().slerp(deltaQ, 0.4);
            }
            const tgtAnimWorldQ = finalDeltaQ.clone().multiply(Q_tgt);
            const tgtLocalQ = P_tgt_inv.clone().multiply(tgtAnimWorldQ).normalize();

            clone.values[i] = tgtLocalQ.x;
            clone.values[i+1] = tgtLocalQ.y;
            clone.values[i+2] = tgtLocalQ.z;
            clone.values[i+3] = tgtLocalQ.w;
          }
        }
        newTracks.push(clone);
      });

      return new THREE.AnimationClip(clip.name, clip.duration, newTracks);
    }

    // Hardcoded Mixamo T-pose rest rotations
    function getMixamoAnimBones() {
      return {
        'Hips': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'Spine': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'Spine1': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'Spine2': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'Neck': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'Head': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'LeftShoulder': {
          restWorldQuaternion: new THREE.Quaternion(0.5, 0.5, 0.5, 0.5),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'LeftArm': {
          restWorldQuaternion: new THREE.Quaternion(0.5, 0.5, 0.5, 0.5),
          parentRestWorldQuaternion: new THREE.Quaternion(0.5, 0.5, 0.5, 0.5)
        },
        'LeftForeArm': {
          restWorldQuaternion: new THREE.Quaternion(0.5, 0.5, 0.5, 0.5),
          parentRestWorldQuaternion: new THREE.Quaternion(0.5, 0.5, 0.5, 0.5)
        },
        'LeftHand': {
          restWorldQuaternion: new THREE.Quaternion(0.5, 0.5, 0.5, 0.5),
          parentRestWorldQuaternion: new THREE.Quaternion(0.5, 0.5, 0.5, 0.5)
        },
        'RightShoulder': {
          restWorldQuaternion: new THREE.Quaternion(-0.5, 0.5, -0.5, 0.5),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'RightArm': {
          restWorldQuaternion: new THREE.Quaternion(-0.5, 0.5, -0.5, 0.5),
          parentRestWorldQuaternion: new THREE.Quaternion(-0.5, 0.5, -0.5, 0.5)
        },
        'RightForeArm': {
          restWorldQuaternion: new THREE.Quaternion(-0.5, 0.5, -0.5, 0.5),
          parentRestWorldQuaternion: new THREE.Quaternion(-0.5, 0.5, -0.5, 0.5)
        },
        'RightHand': {
          restWorldQuaternion: new THREE.Quaternion(-0.5, 0.5, -0.5, 0.5),
          parentRestWorldQuaternion: new THREE.Quaternion(-0.5, 0.5, -0.5, 0.5)
        },
        'LeftUpLeg': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 1, 0),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'LeftLeg': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 1, 0),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 1, 0)
        },
        'LeftFoot': {
          restWorldQuaternion: new THREE.Quaternion(0.707, 0, 0.707, 0),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 1, 0)
        },
        'LeftToeBase': {
          restWorldQuaternion: new THREE.Quaternion(0.707, 0, 0.707, 0),
          parentRestWorldQuaternion: new THREE.Quaternion(0.707, 0, 0.707, 0)
        },
        'RightUpLeg': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 1, 0),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 0, 1)
        },
        'RightLeg': {
          restWorldQuaternion: new THREE.Quaternion(0, 0, 1, 0),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 1, 0)
        },
        'RightFoot': {
          restWorldQuaternion: new THREE.Quaternion(0.707, 0, 0.707, 0),
          parentRestWorldQuaternion: new THREE.Quaternion(0, 0, 1, 0)
        },
        'RightToeBase': {
          restWorldQuaternion: new THREE.Quaternion(0.707, 0, 0.707, 0),
          parentRestWorldQuaternion: new THREE.Quaternion(0.707, 0, 0.707, 0)
        }
      };
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
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
    }
      renderer.render(scene, camera);
    }
  