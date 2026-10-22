import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { isAppIdle } from '@features/scene/idleState';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { useAnimPreviewStore } from '@features/inventory/useAnimPreviewStore';

const GLB_PATH = '/items/dji-neo/dji-neo.glb';
const TARGET_LENGTH_CM = 15.7;

function createDroneClips(nodeName = 'DronePivot'): THREE.AnimationClip[] {
  // 1. Drone_Hover (2s loop)
  const hoverTimes = [0, 0.5, 1.0, 1.5, 2.0];
  const hoverPos = [
    0, 0, 0,
    0, 0.6, 0,
    0, 0, 0,
    0, -0.6, 0,
    0, 0, 0,
  ];
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

  // 2. Drone_Fly (1.5s loop, cruise posture)
  const flyTimes = [0, 0.75, 1.5];
  const flyPitch = -0.22; // ~12.6 deg pitch forward
  const qFly0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(flyPitch, 0, -0.03));
  const qFly1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(flyPitch, 0, 0.03));
  const flyPos = [
    0, 0, -0.8,
    0, 0.3, 0.8,
    0, 0, -0.8,
  ];
  const flyRots = [
    qFly0.x, qFly0.y, qFly0.z, qFly0.w,
    qFly1.x, qFly1.y, qFly1.z, qFly1.w,
    qFly0.x, qFly0.y, qFly0.z, qFly0.w,
  ];
  const flyClip = new THREE.AnimationClip('Drone_Fly', 1.5, [
    new THREE.VectorKeyframeTrack(`${nodeName}.position`, flyTimes, flyPos, THREE.InterpolateSmooth),
    new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, flyTimes, flyRots, THREE.InterpolateLinear),
  ]);

  // 3. Drone_Scan (4s loop, 360 yaw rotation)
  const scanTimes = [0, 1.0, 2.0, 3.0, 4.0];
  const scanRots: number[] = [];
  for (let i = 0; i <= 4; i++) {
    const yaw = (i / 4) * Math.PI * 2;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, yaw, 0));
    scanRots.push(q.x, q.y, q.z, q.w);
  }
  const scanPos = [
    0, 0, 0,
    0, 0.5, 0,
    0, 0, 0,
    0, -0.5, 0,
    0, 0, 0,
  ];
  const scanClip = new THREE.AnimationClip('Drone_Scan', 4.0, [
    new THREE.VectorKeyframeTrack(`${nodeName}.position`, scanTimes, scanPos, THREE.InterpolateSmooth),
    new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, scanTimes, scanRots, THREE.InterpolateLinear),
  ]);

  // 4. Drone_Landed (1s static on ground)
  const landedClip = new THREE.AnimationClip('Drone_Landed', 1.0, [
    new THREE.VectorKeyframeTrack(`${nodeName}.position`, [0, 1.0], [0, 0, 0, 0, 0, 0]),
    new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, [0, 1.0], [0, 0, 0, 1, 0, 0, 0, 1]),
  ]);

  return [hoverClip, flyClip, scanClip, landedClip];
}

export function DjiNeoDrone({
  isPreview = false,
  previewAnim = 'Drone_Hover',
  onSize,
}: {
  isPreview?: boolean;
  previewAnim?: string;
  onSize?: (size: THREE.Vector3) => void;
}) {
  const { scene } = useGLTFClone(GLB_PATH);
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
    const length = Math.max(size.x, size.y, size.z);

    if (length > 0) {
      const scaleFactor = TARGET_LENGTH_CM / length;
      scene.scale.setScalar(scaleFactor);
      const scaledBox = glbLocalBBox(scene);
      scene.position.set(
        -scaledBox.getCenter(new THREE.Vector3()).x,
        -scaledBox.min.y,
        -scaledBox.getCenter(new THREE.Vector3()).z
      );
      onSize?.(scaledBox.getSize(new THREE.Vector3()));
    }

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.material) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.metalness = 0.35;
        mat.roughness = 0.55;
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
  }, [scene, onSize, invalidate]);

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
        store.setClipInfo(`DJI Neo ${clip.name}`, clip.duration, false);
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
    <group ref={rootRef} userData={{ itemName: 'Drone DJI Neo' }}>
      <group ref={pivotRef} name="DronePivot">
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(GLB_PATH);
