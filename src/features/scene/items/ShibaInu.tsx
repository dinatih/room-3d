import { useNavigationEnabled } from '../ai/navigation/NavigationContext';
import { createDogBehavior, DOG_CLIPS, resumeDogBehavior, releaseDogRoute, updateDogBehavior, transitionDogAction, type DogAction } from './dogBehavior';
import { createRouteState, followRoute, resetRoute } from '../ai/navigation/service';
import { setAgentProfile, removeAgentProfile } from '../ai/navigation/obstacles';
import { computeSteeringVector, computeRotYStep, reserveAgentDestination } from '../ai/agent/agentAvoidance';
import { useRef, useLayoutEffect, useEffect, useState, useMemo } from 'react';
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
import { enableAnimatedFrustumCulling } from '../utils/animatedFrustumCulling';
import { getObjectActionIds } from '../objectActions';
import { getAnimationOriginTransform } from '../animations/animationResolver';
import { SubjectDriver } from '../camera/subjectControls';

const GLB_PATH = '/characters/ushiro/shiba_inu_dog_ushiro.glb';
const DANCE_RADIUS = 75; // cm du partenaire
const WALK_SPEED = 50; // cm/s, approche avec Dog|Walk

function dogDanceTarget(x: number, y: number, z: number, yaw: number) {
  const { offset, rotY } = getAnimationOriginTransform('ff-dancewithdog');
  // Dans le clip Free Fire, le personnage se tourne vers son compagnon sur +X.
  const angle = yaw + rotY + Math.PI / 2;
  return {
    x: x + offset[0] * Math.cos(yaw) + offset[2] * Math.sin(yaw) + Math.sin(angle) * DANCE_RADIUS,
    y,
    z: z - offset[0] * Math.sin(yaw) + offset[2] * Math.cos(yaw) + Math.cos(angle) * DANCE_RADIUS,
    yaw: angle + Math.PI,
  };
}

function findDogClip(animations: THREE.AnimationClip[], keyword: string): THREE.AnimationClip {
  const name = keyword.includes('|') ? keyword : Object.values(DOG_CLIPS.shiba).find(name => name.toLowerCase().endsWith(`|${keyword.toLowerCase()}`));
  const clip = animations.find(clip => clip.name === name);
  if (!clip || clip.duration <= 0) throw new Error(`Ushiro : animation invalide ${keyword}`);
  return clip;
}

export function ShibaInu({ isPreview = false, previewAnim = '', dancePreview = false, showSkeletonPreview = false, onSize }: { isPreview?: boolean, previewAnim?: string, dancePreview?: boolean, showSkeletonPreview?: boolean, onSize?: (size: THREE.Vector3) => void }) {
  const navigationEnabled = useNavigationEnabled();
  const routeRef = useRef(createRouteState());
  const life = useMemo(createDogBehavior, []);
  const driver = useMemo(() => new SubjectDriver('shiba'), []);
  const activeAction = useRef<THREE.AnimationAction | null>(null);
  const { scene, animations } = useGLTFClone(GLB_PATH);
  const { invalidate } = useThree();
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null);
  const playingRef = useRef(false);
  const danceRef = useRef({ owner: null as string | null, jumping: false });
  
  const showSkeletonGlobal = useSceneStore(s => s.layers.skeleton);
  const showSkeleton = isPreview ? showSkeletonPreview : showSkeletonGlobal;
  const modelRef = useRef<THREE.Group>(null);
  const [bounds, setBounds] = useState<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null);
  useHelper(showSkeleton ? modelRef as any : null, THREE.SkeletonHelper);

  function context() {
    return { id: 'shiba' as const, root: modelRef.current!, play: (action: DogAction, once = false) => {
      if (action === 'eat') throw new Error('Ushiro has no eating clip');
      const clip = findDogClip(animations, DOG_CLIPS.shiba[action]);
      activeAction.current = transitionDogAction(mixerRef.current!, clip, activeAction.current, once);
      return clip.duration;
    } };
  }

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
    if (!isPreview && navigationEnabled) setAgentProfile('shiba', {
      radius: Math.min(finalSize.x, finalSize.z) / 2,
      height: targetHeight,
    });
    setBounds({ size: finalSize, center: rawBox.getCenter(new THREE.Vector3()).multiplyScalar(scaleFactor) });

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      enableAnimatedFrustumCulling(m);
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

    for (const name of Object.values(DOG_CLIPS.shiba)) findDogClip(animations, name);
    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      const clip = findDogClip(animations, previewAnim || 'idle');
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.reset().play();
      activeAction.current = action;
      playingRef.current = true;
    }

    if (modelRef.current && !isPreview) {
      modelRef.current.position.set(180, 0, -120);
      modelRef.current.rotation.y = -Math.PI / 4;
      modelRef.current.getWorldPosition(life.position);
      resumeDogBehavior(life, context());
    }
    if (modelRef.current && isPreview && dancePreview) {
      const target = dogDanceTarget(0, 0, 0, 0);
      modelRef.current.position.set(target.x, target.y, target.z);
      modelRef.current.rotation.y = target.yaw;
    }

    invalidate();
    onSize?.(finalSize);

    return () => {
      if (!isPreview) driver.dispose();
      if (!isPreview && navigationEnabled) { removeAgentProfile('shiba'); resetRoute(routeRef.current, 'shiba'); releaseDogRoute(life, 'shiba'); }
      mixerRef.current?.stopAllAction();
      mixerRef.current?.uncacheRoot(scene);
    };
  }, [scene, animations, isPreview, previewAnim, dancePreview, invalidate, onSize, navigationEnabled]);

  useEffect(() => {
    if (isPreview) return;
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      
      if (key === 'shiba-replay') {
        resumeDogBehavior(life, context());
        
      } else if (key.startsWith('shiba-play-') && mixerRef.current) {
        reserveAgentDestination('shiba', null);
        // Forced manual animation
        const idx = parseInt(key.split('-')[2], 10);
        if (!isNaN(idx) && animations[idx]) {
          resetRoute(routeRef.current, 'shiba');
          releaseDogRoute(life, 'shiba');
          life.autonomous = false;
          mixerRef.current.stopAllAction();
          const action = mixerRef.current.clipAction(animations[idx]);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          action.reset().play();
          activeAction.current = action;
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
    if (isAppIdle() || !modelRef.current || !mixerRef.current || (!isPreview && !navigationEnabled)) return;
    if (isPreview && dancePreview) {
      // Le personnage pilote la timeline ; le compagnon ne doit ni la modifier ni l'avancer.
      const time = useAnimPreviewStore.getState().currentTime;
      const clip = animations.find(clip => clip.name === 'Dog|Jump');
      if (!clip) throw new Error('Shiba choreography requires Dog|Jump');
      const action = mixerRef.current.clipAction(clip);
      action.time = time % clip.duration;
      action.paused = true;
      mixerRef.current.update(0);
      const target = dogDanceTarget(0, 0, 0, 0);
      modelRef.current.position.set(target.x, target.y, target.z);
      modelRef.current.rotation.y = target.yaw;
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
    driver.step(modelRef.current, delta, WALK_SPEED);
    if (driver.started) {
      releaseDogRoute(life, 'shiba'); resetRoute(routeRef.current, 'shiba');
      life.autonomous = false; danceRef.current.owner = null;
      mixerRef.current.stopAllAction(); activeAction.current = null;
    }
    if (driver.active) {
      const action = driver.moving ? 'walk' : 'idle';
      if (life.action !== action || driver.started) { life.action = action; context().play(action); }
      return;
    }
    if (driver.resumed) { modelRef.current.getWorldPosition(life.position); resumeDogBehavior(life, context()); }
    
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
          releaseDogRoute(life, 'shiba');
          resetRoute(routeRef.current, 'shiba');
          dance.owner = dancingId;
          dance.jumping = false;
          mixerRef.current.stopAllAction();
          const walkClip = animations.find(clip => clip.name === 'Dog|Walk');
          if (!walkClip) throw new Error('Shiba choreography requires Dog|Walk');
          mixerRef.current.clipAction(walkClip).setLoop(THREE.LoopRepeat, Infinity).reset().play();
        }
        const target = dogDanceTarget(dancingChar.x, dancingChar.y, dancingChar.z, dancingChar.yaw);
        reserveAgentDestination('shiba', target);
        const position = modelRef.current.position;
        const before = { x: position.x, z: position.z };
        const next = followRoute(routeRef.current, 'shiba', before, target, WALK_SPEED * delta, (direction, remaining) => {
          const steer = computeSteeringVector('shiba', before.x, before.z, direction.x, direction.z, remaining);
          return { x: steer.steerX, z: steer.steerZ };
        });
        position.x = next.x; position.z = next.z;
        const arrived = Math.hypot(position.x - target.x, position.z - target.z) < 1e-6;
        if (!arrived) {
          if (dance.jumping) {
            dance.jumping = false;
            mixerRef.current.stopAllAction();
            const walkClip = animations.find(clip => clip.name === 'Dog|Walk');
            if (!walkClip) throw new Error('Shiba choreography requires Dog|Walk');
            mixerRef.current.clipAction(walkClip).setLoop(THREE.LoopRepeat, Infinity).reset().play();
          }
          if (next.x !== before.x || next.z !== before.z) modelRef.current.rotation.y = computeRotYStep(modelRef.current.rotation.y, Math.atan2(next.x - before.x, next.z - before.z), Math.PI, delta);
        } else {
          modelRef.current.position.y = target.y;
          modelRef.current.rotation.y = computeRotYStep(modelRef.current.rotation.y, target.yaw, Math.PI, delta);
          if (!dance.jumping) {
            dance.jumping = true;
            mixerRef.current.stopAllAction();
            const jumpClip = animations.find(clip => clip.name === 'Dog|Jump');
            if (!jumpClip) throw new Error('Shiba choreography requires Dog|Jump');
            mixerRef.current.clipAction(jumpClip).setLoop(THREE.LoopRepeat, Infinity).reset().play();
          }
        }

      } else {
        if (danceRef.current.owner !== null) {
          reserveAgentDestination('shiba', null);
          resetRoute(routeRef.current, 'shiba');
          danceRef.current.owner = null;
          modelRef.current.getWorldPosition(life.position);
          activeAction.current = null;
          resumeDogBehavior(life, context());
        }
        updateDogBehavior(life, context(), delta);
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
      userData={isPreview ? {} : { dogBehavior: life, hoverAction: { label: 'Shiba Inu', actions: getObjectActionIds('shiba-inu') } }}>
      {!isPreview && bounds && <mesh position={bounds.center} userData={{ isHoverProxy: true }}>
        <boxGeometry args={bounds.size.toArray()} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>}
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_PATH);
