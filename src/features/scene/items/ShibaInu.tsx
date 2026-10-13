import { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useHelper } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { useAnimalCamera } from '../camera/useAnimalCamera';
import { cameraState } from '@features/scene/cameraState';
import { isAppIdle } from '@features/scene/idleState';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import { glbLocalBBox } from '../glbUtils';
import { getObjectActionIds } from '../objectActions';

const GLB_PATH = '/characters/ushiro/shiba_inu_dog_ushiro.glb';
const DANCE_RADIUS = 75; // cm devant le partenaire
const DANCE_FREQUENCY = 2.5;
const DANCE_ARC = 0.45;
const _tmpDogDir = new THREE.Vector3();

type AIState = { mode: 'autonomous' | 'forced', state: 'idle' | 'walking' | 'running', targetPos: THREE.Vector3, timer: number };

function findDogClip(animations: THREE.AnimationClip[], keyword: string): THREE.AnimationClip {
  const kw = keyword.toLowerCase();
  return (
    animations.find(a => a.name.toLowerCase().includes(kw)) ||
    animations.find(a => a.name.toLowerCase().includes('idle')) ||
    animations[0]
  );
}

export function ShibaInu({ isPreview = false, previewAnim = '', dancePreview = false, showSkeletonPreview = false, onSize }: { isPreview?: boolean, previewAnim?: string, dancePreview?: boolean, showSkeletonPreview?: boolean, onSize?: (size: THREE.Vector3) => void }) {
  const { scene, animations } = useGLTFClone(GLB_PATH);
  const { invalidate } = useThree();
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null);
  const playingRef = useRef(false);
  const danceRef = useRef({ owner: null as string | null, elapsed: 0 });
  
  const showSkeletonGlobal = useSceneStore(s => s.layers.skeleton);
  const showSkeleton = isPreview ? showSkeletonPreview : showSkeletonGlobal;
  const modelRef = useRef<THREE.Group>(null);
  const [bounds, setBounds] = useState<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null);
  useHelper(showSkeleton ? modelRef as any : null, THREE.SkeletonHelper);

  const aiStateRef = useRef<AIState>({
    mode: 'autonomous',
    state: 'idle',
    targetPos: new THREE.Vector3(180, 0, -120),
    timer: 2.0
  });

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    const rawBox = glbLocalBBox(scene);
    const rawSize = rawBox.getSize(new THREE.Vector3());

    const targetHeight = 40; // 40 cm au garrot
    if (!Number.isFinite(rawSize.y) || rawSize.y <= 0) throw new Error('Invalid Shiba model height');
    const scaleFactor = targetHeight / rawSize.y;

    scene.scale.setScalar(scaleFactor);
    scene.position.set(0, 0, 0);

    const finalSize = new THREE.Vector3(
      rawSize.x * scaleFactor,
      targetHeight,
      rawSize.z * scaleFactor
    );
    setBounds({ size: finalSize, center: rawBox.getCenter(new THREE.Vector3()).multiplyScalar(scaleFactor) });

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false; // Le saut déforme le mesh hors des bornes de sa pose initiale.
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach(mat => {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (stdMat.isMeshStandardMaterial) {
            stdMat.metalness = 0;
            stdMat.roughness = 0.8;
          }
          mat.transparent = false;
          mat.depthWrite = true;
        });
      }
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      const clip = findDogClip(animations, previewAnim || 'idle');
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset().play();
      playingRef.current = true;
    }

    if (modelRef.current && !isPreview) {
      modelRef.current.position.set(180, 0, -120);
      modelRef.current.rotation.y = -Math.PI / 4;
    }
    if (modelRef.current && isPreview && dancePreview) {
      modelRef.current.position.set(0, 0, DANCE_RADIUS);
      modelRef.current.rotation.y = Math.PI;
    }

    invalidate();
    onSize?.(finalSize);

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current?.uncacheRoot(scene);
    };
  }, [scene, animations, isPreview, previewAnim, dancePreview, invalidate, onSize]);

  useEffect(() => {
    if (isPreview) return;
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      
      if (key === 'shiba-replay') {
        // Return to autonomous mode
        aiStateRef.current.mode = 'autonomous';
        aiStateRef.current.state = 'idle';
        aiStateRef.current.timer = 1.0;
        
      } else if (key.startsWith('shiba-play-') && mixerRef.current) {
        // Forced manual animation
        const idx = parseInt(key.split('-')[2], 10);
        if (!isNaN(idx) && animations[idx]) {
          aiStateRef.current.mode = 'forced';
          mixerRef.current.stopAllAction();
          const action = mixerRef.current.clipAction(animations[idx]);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          action.reset().play();
          playingRef.current = true;
          invalidate();
        }
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => {
      document.removeEventListener('furniture-toggle', handler);
      delete cameraState.positions.shiba;
    };
  }, [invalidate, isPreview, animations]);

  useFrame((_, delta) => {
    if (isAppIdle() || !modelRef.current || !mixerRef.current) return;
    if (isPreview && dancePreview) {
      // Le personnage pilote la timeline ; le compagnon ne doit ni la modifier ni l'avancer.
      const time = useAnimPreviewStore.getState().currentTime;
      const clip = animations.find(clip => clip.name === 'Dog|Jump');
      if (!clip) throw new Error('Shiba choreography requires Dog|Jump');
      const action = mixerRef.current.clipAction(clip);
      action.time = time % clip.duration;
      action.paused = true;
      mixerRef.current.update(0);
      const angle = Math.sin(time * DANCE_FREQUENCY) * DANCE_ARC;
      modelRef.current.position.set(Math.sin(angle) * DANCE_RADIUS, 0, Math.cos(angle) * DANCE_RADIUS);
      modelRef.current.rotation.y = angle + Math.PI;
      invalidate();
      return;
    }
    if (isPreview) {
      const clip = findDogClip(animations, previewAnim || 'idle');
      if (clip && clip.duration > 0) {
        const store = useAnimPreviewStore.getState();
        store.setClipInfo(`Shiba ${clip.name}`, clip.duration, false);
        const action = mixerRef.current.clipAction(clip);
        const animDelta = delta * (store.speed || 1);
        if (store.isPlaying && !store.isScrubbing) {
          if (action.paused) action.paused = false;
          if (!store.isLooping) {
            action.setLoop(THREE.LoopOnce, 0);
            action.clampWhenFinished = true;
            if (action.time >= clip.duration - 0.005) {
              action.time = 0;
            }
          } else {
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.clampWhenFinished = false;
          }
          mixerRef.current.update(animDelta);
          if (!store.isLooping && action.time >= clip.duration) {
            action.time = clip.duration;
            action.paused = true;
            store.setCurrentTime(clip.duration);
            store.pause();
          } else {
            store.setCurrentTime(action.time % clip.duration);
          }
        } else {
          action.setEffectiveWeight(1);
          (action as any)._fadeDuration = 0;
          (action as any)._weight = 1;
          action.time = store.currentTime;
          action.paused = true;
          mixerRef.current.update(0);
        }
      }
      invalidate();
      return;
    }
    mixerRef.current.update(delta);
    invalidate();
    
    if (!isPreview) {
      // Vérifier si un personnage actif exécute l'animation Dance With Dog
      let dancingChar: { x: number; y: number; z: number; yaw: number } | null = null;
      let dancingId: string | null = null;
      for (const charId in cameraState.positions) {
        const c = cameraState.positions[charId];
        if (c?.anim && (c.anim.includes('dancewithdog') || c.anim.includes('dance-with-dog'))) {
          dancingChar = c;
          dancingId = charId;
          break;
        }
      }

      if (dancingChar) {
        // Mode danse synchronisée : le chien vient danser juste devant son maître
        const dance = danceRef.current;
        if (dance.owner !== dancingId) {
          dance.owner = dancingId;
          dance.elapsed = 0;
          mixerRef.current.stopAllAction();
          const jumpClip = animations.find(clip => clip.name === 'Dog|Jump');
          if (!jumpClip) throw new Error('Shiba choreography requires Dog|Jump');
          mixerRef.current.clipAction(jumpClip).setLoop(THREE.LoopRepeat, Infinity).reset().play();
        }
        dance.elapsed += delta;
        const t = dance.elapsed;
        // Décalage orbital fluide autour du maître (courbe de danse)
        const danceRadius = DANCE_RADIUS;
        const angle = dancingChar.yaw + Math.sin(t * DANCE_FREQUENCY) * DANCE_ARC;
        const targetX = dancingChar.x + Math.sin(angle) * danceRadius;
        const targetZ = dancingChar.z + Math.cos(angle) * danceRadius;

        modelRef.current.position.x += (targetX - modelRef.current.position.x) * Math.min(1.0, delta * 6.0);
        modelRef.current.position.z += (targetZ - modelRef.current.position.z) * Math.min(1.0, delta * 6.0);
        // Le chien regarde son maître en dansant
        const faceOwnerYaw = Math.atan2(dancingChar.x - modelRef.current.position.x, dancingChar.z - modelRef.current.position.z);
        let yawDiff = faceOwnerYaw - modelRef.current.rotation.y;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        modelRef.current.rotation.y += yawDiff * Math.min(1.0, delta * 8.0);

      } else {
        const ai = aiStateRef.current;
        if (danceRef.current.owner !== null) {
          danceRef.current.owner = null;
          ai.mode = 'autonomous';
          ai.state = 'idle';
          ai.timer = 1;
          mixerRef.current.stopAllAction();
          mixerRef.current.clipAction(findDogClip(animations, 'idle')).setLoop(THREE.LoopRepeat, Infinity).reset().play();
        }
        if (ai.mode === 'autonomous') {
          if (ai.state === 'idle') {
            ai.timer -= delta;
            if (ai.timer <= 0) {
              // Pick new target (champ d'action complet appartement, jardin et zones AI etendues)
              const rand = Math.random();
              let tx, tz;
            if (rand < 0.5) {
              // Garden étendu (50%)
              tx = -350 + Math.random() * 1000;  // X: -350 to 650
              tz = -350 + Math.random() * 320; // Z: -350 to -30
            } else if (rand < 0.7) {
              // Main Room (20%)
              tx = 50 + Math.random() * 200;   // X: 50 to 250
              tz = 50 + Math.random() * 300;   // Z: 50 to 350
            } else if (rand < 0.9) {
              // Couloir rouge (20%) - Zone AI Entrée bat B
              tx = -350 + Math.random() * 1000; // X: -350 to 650
              tz = 598.3 - (tx - 348.5) * 0.57735; // Suit l'axe central du couloir
            } else {
              // Bathroom (10%)
              tx = 20 + Math.random() * 110;
              tz = 520 + Math.random() * 120;
            }
            ai.targetPos.set(tx, 0, tz);
            
            const dist = modelRef.current.position.distanceTo(ai.targetPos);
            ai.state = dist > 150 ? 'running' : 'walking';
            
            mixerRef.current.stopAllAction();
            const clip = findDogClip(animations, ai.state === 'running' ? 'run' : 'walk');
            const action = mixerRef.current.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.reset().play();
          }
        } else {
          // Moving
          const speed = ai.state === 'running' ? 120 : 50;
          const dist = modelRef.current.position.distanceTo(ai.targetPos);
          if (dist < 5) {
            ai.state = 'idle';
            ai.timer = 3 + Math.random() * 8; // wait 3 to 11 seconds
            
            mixerRef.current.stopAllAction();
            const clip = findDogClip(animations, Math.random() > 0.5 ? 'idle' : 'sitdown');
            const action = mixerRef.current.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.reset().play();
          } else {
            const dir = _tmpDogDir.subVectors(ai.targetPos, modelRef.current.position).normalize();
            modelRef.current.position.addScaledVector(dir, speed * delta);
            
            const targetRot = Math.atan2(dir.x, dir.z);
            let diff = targetRot - modelRef.current.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            modelRef.current.rotation.y += diff * 10 * delta;
          }
        }
      }
    }
  }
    
    
    if (!isPreview) {
      cameraState.positions['shiba'] = {
        x: modelRef.current.position.x,
        y: modelRef.current.position.y,
        z: modelRef.current.position.z,
        yaw: modelRef.current.rotation.y
      };
    }
  });

  useAnimalCamera('shiba', modelRef, scene, isPreview, 'Dogger_head_j', 'Dogger_jaw_j');

  return (
    <group name="shiba-inu" ref={modelRef as any} position={isPreview ? undefined : [180, 0, -120]} rotation={isPreview ? undefined : [0, -Math.PI / 4, 0]}
      userData={isPreview ? {} : { hoverAction: { label: 'Shiba Inu', actions: getObjectActionIds('shiba-inu') } }}>
      {!isPreview && bounds && <mesh position={bounds.center} userData={{ isHoverProxy: true }}>
        <boxGeometry args={bounds.size.toArray()} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>}
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_PATH);
