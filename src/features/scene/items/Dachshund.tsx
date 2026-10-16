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
import { createDogBehavior, DOG_CLIPS, resumeDogBehavior, releaseDogRoute, updateDogBehavior, transitionDogAction, type DogAction } from './dogBehavior';
import { setAgentProfile, removeAgentProfile } from '../ai/navigation/obstacles';

const HEIGHT = 30; // cm, hauteur totale du teckel (tête comprise).

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
  const life = useMemo(createDogBehavior, []);
  const eatingMuzzle = useMemo(() => new THREE.Vector3(), []);
  const [bounds, setBounds] = useState<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null);
  const showSkeleton = useSceneStore(s => s.layers.skeleton);
  useHelper(!isPreview && showSkeleton ? root as any : null, THREE.SkeletonHelper);

  function play(name: string, once = false) {
    const clip = clips[name];
    if (!clip || clip.duration <= 0) throw new Error(`Ulotte : animation invalide ${name}`);
    if (isPreview) {
      mixer.stopAllAction();
      active.current = mixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat, Infinity).play();
    } else active.current = transitionDogAction(mixer, clip, active.current, once);
    return clip;
  }
  function context() {
    return { id: 'ulotte' as const, root: root.current!, eatingMuzzle,
      play: (action: DogAction, once = false) => play(DOG_CLIPS.ulotte[action], once).duration };
  }

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    for (const name of Object.values(DOG_CLIPS.ulotte)) {
      if (!clips[name]) throw new Error(`Ulotte : animation manquante ${name}`);
    }
    active.current = null;
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
    if (!isPreview) {
      root.current!.getWorldPosition(life.position);
      // Measure the actual animated muzzle rather than inventing an approach offset.
      mixer.stopAllAction(); active.current = null;
      play('eating');
      mixer.setTime(clips.eating.duration / 2);
      scene.updateWorldMatrix(true, false);
      scene.updateMatrixWorld(true);
      // The Head bone tip lies inside the long snout. Measure the foremost
      // posed skin vertex so the nose, rather than the skull, reaches the food.
      const inverseRoot = root.current!.matrixWorld.clone().invert();
      const point = new THREE.Vector3();
      eatingMuzzle.set(0, 0, -Infinity);
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const transform = new THREE.Matrix4().multiplyMatrices(inverseRoot, mesh.matrixWorld);
        const count = mesh.geometry.getAttribute('position').count;
        for (let vertex = 0; vertex < count; vertex++) {
          mesh.getVertexPosition(vertex, point).applyMatrix4(transform);
          if (point.z > eatingMuzzle.z) eatingMuzzle.copy(point);
        }
      });
      if (!Number.isFinite(eatingMuzzle.z)) throw new Error('Ulotte : museau introuvable');
      mixer.stopAllAction(); active.current = null;
      resumeDogBehavior(life, context());
      mixer.update(0);
      scene.updateMatrixWorld(true);
    }
    invalidate();
    onSize?.(size);
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      if (!isPreview && navigationEnabled) {
        removeAgentProfile('ulotte');
        releaseDogRoute(life, 'ulotte');
      }
      if (!isPreview && navigationEnabled) delete cameraState.positions.ulotte;
    };
  }, [scene, mixer, clips, isPreview, navigationEnabled, invalidate, onSize, life, eatingMuzzle]);

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
      if (key === 'ulotte-replay') resumeDogBehavior(life, context());
      else {
        releaseDogRoute(life, 'ulotte');
        life.autonomous = false;
        play(value!);
      }
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
    updateDogBehavior(life, context(), delta);
    mixer.update(delta);
    root.current.getWorldQuaternion(life.rotation);
    const position = life.position;
    cameraState.positions.ulotte = { x: position.x, y: position.y, z: position.z, yaw: life.euler.setFromQuaternion(life.rotation).y };
    invalidate();
  });

  useAnimalCamera('ulotte', root, scene, isPreview || !navigationEnabled, 'Head', 'Muzzle');

  return (
    <group ref={root} name="ulotte" userData={isPreview ? {} : {
      dogBehavior: life, itemName: 'Ulotte (Teckel)',
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
