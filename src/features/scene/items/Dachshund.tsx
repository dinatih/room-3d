import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useHelper } from '@react-three/drei';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';
import { enableAnimatedFrustumCulling } from '../utils/animatedFrustumCulling';
import { getObjectActionIds } from '../objectActions';
import { useSceneStore } from '../store/useSceneStore';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';
import { cameraState } from '../cameraState';
import { useAnimalCamera } from '../camera/useAnimalCamera';
import { isAppIdle } from '../idleState';
import { useNavigationEnabled } from '../ai/navigation/NavigationContext';
import { createRouteState, followRoute, randomReachableTarget, resetRoute } from '../ai/navigation/service';
import { setAgentProfile, removeAgentProfile } from '../ai/navigation/obstacles';
import { computeRotYStep, computeSteeringVector, reserveAgentDestination } from '../ai/agent/agentAvoidance';
import { appLog } from '@features/ui/AppConsole';

const HEIGHT = 30; // cm, hauteur totale du teckel (tête comprise).
const WALK_SPEED = 50; // cm/s, comme Ushiro.
const RUN_SPEED = 120;

export function Dachshund({ isPreview = false, previewAnim = 'idle-1', onSize }: {
  isPreview?: boolean;
  previewAnim?: string;
  onSize?: (size: THREE.Vector3) => void;
}) {
  const { scene, animations } = useGLTFClone('/characters/ulotte/ulotte.glb');
  const { invalidate } = useThree();
  const navigationEnabled = useNavigationEnabled();
  const root = useRef<THREE.Group>(null);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const clips = useMemo(() => Object.fromEntries(animations.map(clip => [clip.name, clip])), [animations]);
  const active = useRef<THREE.AnimationAction | null>(null);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const localPosition = useMemo(() => new THREE.Vector3(), []);
  const worldRotation = useMemo(() => new THREE.Quaternion(), []);
  const worldEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);
  const route = useRef(createRouteState());
  const life = useRef({ autonomous: true, moving: false, target: new THREE.Vector3(), timer: 0, speed: WALK_SPEED });
  const [bounds, setBounds] = useState<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null);
  const showSkeleton = useSceneStore(s => s.layers.skeleton);
  useHelper(!isPreview && showSkeleton ? root as any : null, THREE.SkeletonHelper);

  function play(name: string) {
    const clip = clips[name];
    if (!clip || clip.duration <= 0) throw new Error(`Ulotte : animation invalide ${name}`);
    mixer.stopAllAction();
    const action = mixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat, Infinity).play();
    active.current = action;
    return clip;
  }

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    play('idle-1');
    mixer.update(0);
    const box = glbLocalBBox(scene, true);
    const size = box.getSize(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Ulotte : dimensions invalides');
    const scale = HEIGHT / size.y;
    const center = box.getCenter(new THREE.Vector3());
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    size.multiplyScalar(scale);
    setBounds({ size, center: new THREE.Vector3(0, size.y / 2, 0) });
    scene.traverse(object => {
      if (!(object as THREE.Mesh).isMesh) return;
      const mesh = object as THREE.Mesh;
      mesh.castShadow = mesh.receiveShadow = true;
      enableAnimatedFrustumCulling(mesh);
    });
    if (!isPreview && navigationEnabled) {
      setAgentProfile('ulotte', { radius: Math.min(size.x, size.z) / 2, height: HEIGHT });
    }
    if (!isPreview) root.current!.getWorldPosition(worldPosition);
    life.current.timer = clips['idle-1'].duration * 2;
    invalidate();
    onSize?.(size);
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      if (!isPreview && navigationEnabled) {
        removeAgentProfile('ulotte');
        resetRoute(route.current, 'ulotte');
        reserveAgentDestination('ulotte', null);
      }
      if (!isPreview && navigationEnabled) delete cameraState.positions.ulotte;
    };
  }, [scene, mixer, clips, isPreview, navigationEnabled, invalidate, onSize, worldPosition]);

  useEffect(() => {
    if (!isPreview) return;
    const clip = play(previewAnim);
    useAnimPreviewStore.getState().setClipInfo(`Ulotte ${clip.name}`, clip.duration, false, 24);
    invalidate();
  }, [isPreview, previewAnim, clips, mixer, invalidate]);

  useEffect(() => {
    if (isPreview || !navigationEnabled) return;
    const handler = (event: Event) => {
      const { key, value } = (event as CustomEvent<{ key: string; value?: string }>).detail;
      if (key !== 'ulotte-replay' && key !== 'ulotte-motion') return;
      resetRoute(route.current, 'ulotte');
      reserveAgentDestination('ulotte', null);
      life.current.autonomous = key === 'ulotte-replay';
      life.current.moving = false;
      const clip = play(key === 'ulotte-replay' ? 'idle-1' : value!);
      life.current.timer = clip.duration * 2;
      invalidate();
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [isPreview, navigationEnabled, clips, mixer, invalidate]);

  useFrame((_, delta) => {
    if (isAppIdle() || !root.current || !active.current) return;
    if (isPreview) {
      const store = useAnimPreviewStore.getState();
      active.current.setLoop(THREE.LoopOnce, 0);
      active.current.clampWhenFinished = true;
      active.current.paused = false;
      mixer.setTime(store.tick(delta));
      invalidate();
      return;
    }
    // Les previews de zones ne doivent pas publier d'agents dans la scène principale.
    if (!navigationEnabled) return;
    const body = root.current;
    const ai = life.current;
    // Keep the planner’s exact coordinates: a round trip through the rotated
    // placement would perturb reached vertices and prevent advancing the route.
    body.getWorldQuaternion(worldRotation);
    const worldYaw = worldEuler.setFromQuaternion(worldRotation).y;
    if (ai.autonomous) {
      if (!ai.moving) {
        ai.timer -= delta;
        if (ai.timer <= 0) {
          const target = randomReachableTarget('ulotte', worldPosition);
          if (target) {
            ai.target.set(target.x, worldPosition.y, target.z);
            resetRoute(route.current, 'ulotte');
            reserveAgentDestination('ulotte', target);
            // Même choix d'allure qu'Ushiro selon la distance à parcourir.
            ai.speed = worldPosition.distanceTo(ai.target) > 150 ? RUN_SPEED : WALK_SPEED;
            play(ai.speed === RUN_SPEED ? 'run' : 'walk');
            ai.moving = true;
          }
        }
      } else {
        const before = { x: worldPosition.x, z: worldPosition.z };
        const next = followRoute(route.current, 'ulotte', before, ai.target, ai.speed * delta, (direction, remaining) => {
          const steer = computeSteeringVector('ulotte', before.x, before.z, direction.x, direction.z, remaining);
          return { x: steer.steerX, z: steer.steerZ };
        });
        worldPosition.set(next.x, worldPosition.y, next.z);
        body.position.copy(body.parent!.worldToLocal(localPosition.copy(worldPosition)));
        if (next.x !== before.x || next.z !== before.z) {
          body.rotation.y = body.rotation.y + computeRotYStep(worldYaw, Math.atan2(next.x - before.x, next.z - before.z), Math.PI, delta) - worldYaw;
        }
        if (route.current.error) appLog('ulotte', `⚠️ Navigation : ${route.current.error}`);
        if (route.current.error || Math.hypot(next.x - ai.target.x, next.z - ai.target.z) < 1e-6) {
          reserveAgentDestination('ulotte', null);
          resetRoute(route.current, 'ulotte');
          ai.moving = false;
          const clip = play(Math.random() < 0.5 ? 'idle-1' : 'idle-2');
          ai.timer = clip.duration * 2;
        }
      }
    }
    mixer.update(delta);
    const position = worldPosition;
    body.getWorldQuaternion(worldRotation);
    cameraState.positions.ulotte = { x: position.x, y: position.y, z: position.z, yaw: worldEuler.setFromQuaternion(worldRotation).y };
    invalidate();
  });

  useAnimalCamera('ulotte', root, scene, isPreview || !navigationEnabled, 'Head', 'Muzzle');

  return (
    <group ref={root} name="ulotte" userData={isPreview ? {} : {
      itemName: 'Ulotte (Teckel)',
      hoverAction: { label: 'Ulotte (Teckel)', actions: getObjectActionIds('ulotte') },
    }}>
      {!isPreview && bounds && <mesh position={bounds.center} userData={{ isHoverProxy: true }}>
        <boxGeometry args={bounds.size.toArray()} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>}
      <primitive object={scene} />
    </group>
  );
}
