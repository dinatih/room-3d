import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { isAppIdle } from '@features/scene/idleState';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';

function createDroneClips(nodeName = 'DronePivot'): THREE.AnimationClip[] {
  const hoverTimes = [0, 0.5, 1.0, 1.5, 2.0];
  const hoverPos = [0, 0, 0, 0, 0.6, 0, 0, 0, 0, 0, -0.6, 0, 0, 0, 0];
  const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.015, 0, 0.025));
  const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.01, 0, 0));
  const q3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.015, 0, -0.025));
  const hoverRots = [
    q0.x, q0.y, q0.z, q0.w,
    q1.x, q1.y, q1.z, q1.w,
    q2.x, q2.y, q2.z, q2.w,
    q3.x, q3.y, q3.z, q3.w,
    q0.x, q0.y, q0.z, q0.w,
  ];
  const hoverClip = new THREE.AnimationClip('Drone_Hover', 2.0, [
    new THREE.VectorKeyframeTrack(`${nodeName}.position`, hoverTimes, hoverPos, THREE.InterpolateSmooth),
    new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, hoverTimes, hoverRots, THREE.InterpolateLinear),
  ]);

  const flyTimes = [0, 0.75, 1.5];
  const flyPitch = -0.20;
  const qFly0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(flyPitch, 0, -0.03));
  const qFly1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(flyPitch, 0, 0.03));
  const flyPos = [0, 0, 0.6, 0, 0.3, -0.6, 0, 0, 0.6];
  const flyRots = [
    qFly0.x, qFly0.y, qFly0.z, qFly0.w,
    qFly1.x, qFly1.y, qFly1.z, qFly1.w,
    qFly0.x, qFly0.y, qFly0.z, qFly0.w,
  ];
  const flyClip = new THREE.AnimationClip('Drone_Fly', 1.5, [
    new THREE.VectorKeyframeTrack(`${nodeName}.position`, flyTimes, flyPos, THREE.InterpolateSmooth),
    new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, flyTimes, flyRots, THREE.InterpolateLinear),
  ]);

  const scanTimes = [0, 1.0, 2.0, 3.0, 4.0];
  const scanRots: number[] = [];
  for (let i = 0; i <= 4; i++) {
    const yaw = (i / 4) * Math.PI * 2;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, yaw, 0));
    scanRots.push(q.x, q.y, q.z, q.w);
  }
  const scanPos = [0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, -0.5, 0, 0, 0, 0];
  const scanClip = new THREE.AnimationClip('Drone_Scan', 4.0, [
    new THREE.VectorKeyframeTrack(`${nodeName}.position`, scanTimes, scanPos, THREE.InterpolateSmooth),
    new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, scanTimes, scanRots, THREE.InterpolateLinear),
  ]);

  const landedClip = new THREE.AnimationClip('Drone_Landed', 1.0, [
    new THREE.VectorKeyframeTrack(`${nodeName}.position`, [0, 1.0], [0, 0, 0, 0, 0, 0]),
    new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, [0, 1.0], [0, 0, 0, 1, 0, 0, 0, 1]),
  ]);

  return [hoverClip, flyClip, scanClip, landedClip];
}

interface DjiDroneProps {
  glbPath: string;
  targetMaxDimCm: number;
  itemName: string;
  rotationY?: number;
  isPreview?: boolean;
  previewAnim?: string;
  onSize?: (size: THREE.Vector3) => void;
}

export function DjiDrone({
  glbPath,
  targetMaxDimCm,
  itemName,
  rotationY = 0,
  isPreview = false,
  previewAnim = 'Drone_Hover',
  onSize,
}: DjiDroneProps) {
  const { scene } = useGLTFClone(glbPath);
  const { invalidate } = useThree();
  const rootRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentAction = useRef<THREE.AnimationAction | null>(null);

  const clips = useMemo(() => createDroneClips('DronePivot'), []);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
      const scaleFactor = targetMaxDimCm / maxDim;
      scene.scale.setScalar(scaleFactor);
      const scaledBox = glbLocalBBox(scene);
      scene.position.set(
        -scaledBox.getCenter(new THREE.Vector3()).x,
        -scaledBox.min.y,
        -scaledBox.getCenter(new THREE.Vector3()).z
      );
      const rawSize = scaledBox.getSize(new THREE.Vector3());
      const effectiveSize = Math.abs(Math.sin(rotationY)) > 0.5 ? new THREE.Vector3(rawSize.z, rawSize.y, rawSize.x) : rawSize;
      onSize?.(effectiveSize);
    }

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.material) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.metalness = mat.metalness ?? 0.35;
        mat.roughness = mat.roughness ?? 0.55;
      }
    });

    if (rootRef.current) {
      mixerRef.current = new THREE.AnimationMixer(rootRef.current);
    }

    invalidate();

    return () => {
      mixerRef.current?.stopAllAction();
      currentAction.current = null;
    };
  }, [scene, targetMaxDimCm, rotationY, onSize, invalidate]);

  useFrame((_, delta) => {
    if (isAppIdle() || !mixerRef.current) return;

    const targetAnimName = previewAnim || 'Drone_Hover';
    const clip = clips.find(a => a.name === targetAnimName) || clips[0];
    if (clip && clip.duration > 0) {
      let action = currentAction.current;
      if (!action || action.getClip().name !== clip.name) {
        const nextAction = mixerRef.current.clipAction(clip);
        nextAction.reset();
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
        nextAction.play();
        if (action) {
          nextAction.crossFadeFrom(action, 0.2, false);
        }
        action = nextAction;
        currentAction.current = action;
      }

      if (isPreview) {
        const store = useAnimPreviewStore.getState();
        store.setClipInfo(`${itemName} ${clip.name}`, clip.duration, false);
        const animDelta = delta * (store.speed || 1);
        if (store.isPlaying && !store.isScrubbing) {
          if (action.paused) action.paused = false;
          action.setLoop(store.isLooping ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
          mixerRef.current.update(animDelta);
          store.setCurrentTime(action.time % clip.duration);
        } else {
          action.time = store.currentTime;
          action.paused = true;
          mixerRef.current.update(0);
        }
      } else {
        mixerRef.current.update(delta);
      }
    }
    invalidate();
  });

  return (
    <group ref={rootRef} userData={{ itemName }}>
      <group ref={pivotRef} name="DronePivot">
        <group rotation={[0, rotationY, 0]}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

export function DjiNeoDrone(props: { isPreview?: boolean; previewAnim?: string; onSize?: (size: THREE.Vector3) => void }) {
  return <DjiDrone glbPath="/items/dji-neo/dji-neo.glb" targetMaxDimCm={15.7} itemName="Drone DJI Neo" rotationY={Math.PI / 2} {...props} />;
}

export function DjiAvata2Drone(props: { isPreview?: boolean; previewAnim?: string; onSize?: (size: THREE.Vector3) => void }) {
  return <DjiDrone glbPath="/items/dji-avata-2/dji-avata-2.glb" targetMaxDimCm={21.2} itemName="Drone DJI Avata 2" rotationY={Math.PI} {...props} />;
}

useGLTF.preload('/items/dji-neo/dji-neo.glb');
useGLTF.preload('/items/dji-avata-2/dji-avata-2.glb');
