import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { isAppIdle } from '@features/scene/idleState';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { updateClipPreview } from '@features/inventory/updateClipPreview';
import { cameraState } from '../cameraState';
import { HornetTour } from '../hornetTour';
import { SubjectDriver } from '../camera/subjectControls';
import { useDroneControlStore } from '../droneControls';
import { appLog } from '@features/ui/AppConsole';
import { setAgentProfile, removeAgentProfile } from '../ai/navigation/obstacles';

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
  subjectId: string;
  startObservation: string;
  glbPath: string;
  targetMaxDimCm: number;
  itemName: string;
  rotationY?: number;
  isPreview?: boolean;
  previewAnim?: string;
  onSize?: (size: THREE.Vector3) => void;
}

export function DjiDrone({
  subjectId,
  startObservation,
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
  const tourRef = useRef<HornetTour | null>(null);
  const driver = useMemo(() => new SubjectDriver(subjectId), [subjectId]);
  const cameraMount = useRef(new THREE.Vector3());
  const cameraPosition = useRef(new THREE.Vector3());
  const cameraForward = useRef(new THREE.Vector3());
  const dimensions = useRef(new THREE.Vector3());
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

    if (!Number.isFinite(maxDim) || maxDim <= 0) throw new Error(`${itemName} : dimensions invalides`);
    scene.scale.setScalar(targetMaxDimCm / maxDim);
    const scaledBox = glbLocalBBox(scene);
    scene.position.set(-scaledBox.getCenter(new THREE.Vector3()).x, -scaledBox.min.y, -scaledBox.getCenter(new THREE.Vector3()).z);
    scaledBox.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(rotationY)).getSize(dimensions.current);
    cameraMount.current.set(0, dimensions.current.y / 2, dimensions.current.z / 2);

    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
    });

    if (rootRef.current) {
      mixerRef.current = new THREE.AnimationMixer(rootRef.current);
      if (!isPreview) {
        const radius = Math.hypot(dimensions.current.x / 2, dimensions.current.y, dimensions.current.z / 2);
        const tour = new HornetTour(radius, message => appLog('drone', `${itemName} : ${message}`), Math.random, subjectId);
        const start = tour.observations.find(observation => observation.id === startObservation);
        if (!start || !tour.space.safeStop(start.position)) throw new Error(`${itemName} : départ de visite invalide`);
        setAgentProfile(subjectId, { radius, height: radius * 2 });
        tourRef.current = tour;
        rootRef.current.position.copy(start.position);
      }
    }

    invalidate();

    return () => {
      mixerRef.current?.stopAllAction();
      currentAction.current = null;
      if (mixerRef.current) mixerRef.current.uncacheRoot(mixerRef.current.getRoot());
      if (!isPreview) {
        driver.dispose();
        removeAgentProfile(subjectId);
        tourRef.current?.release();
        tourRef.current = null;
        delete cameraState.animalViews[subjectId];
        delete cameraState.positions[subjectId];
        if (cameraState.animalTarget === subjectId) {
          cameraState.animalTarget = null;
          document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'reset-orbit' }));
        }
      }
    };
  }, [scene, targetMaxDimCm, rotationY, invalidate, isPreview, subjectId, startObservation, driver, itemName]);

  useLayoutEffect(() => {
    onSize?.(dimensions.current.clone());
  }, [scene, targetMaxDimCm, rotationY, onSize]);

  useFrame((_, delta) => {
    if (isAppIdle() || !mixerRef.current) return;

    const tour = tourRef.current;
    if (!isPreview && rootRef.current && tour) {
      driver.step(rootRef.current, delta, useDroneControlStore.getState().speed, tour.radius);
      if (driver.started) tour.release();
      if (driver.resumed) tour.reset();
      if (!driver.active) tour.tick(rootRef.current.position, rootRef.current.quaternion, delta);
    }
    const targetAnimName = isPreview ? previewAnim || 'Drone_Hover' : driver.active ? 'Drone_Hover' : tour?.state === 'travelling' ? 'Drone_Fly' : tour?.observation?.sweep ? 'Drone_Scan' : 'Drone_Hover';
    const clip = clips.find(a => a.name === targetAnimName);
    if (!clip) throw new Error(`${itemName} : animation inconnue ${targetAnimName}`);
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
      updateClipPreview(mixerRef.current, clip, delta, itemName);
    } else {
      mixerRef.current.update(delta);
    }
    invalidate();
  }, -2);

  useFrame(() => {
    const root = rootRef.current;
    const pivot = pivotRef.current;
    if (isPreview || !root || !pivot) return;
    pivot.localToWorld(cameraPosition.current.copy(cameraMount.current));
    pivot.getWorldDirection(cameraForward.current);
    const view = cameraState.animalViews[subjectId] ??= { eyes: { x: 0, y: 0, z: 0 }, forward: { x: 0, y: 0, z: 1 }, radius: dimensions.current.length() / 2 };
    Object.assign(view.eyes, cameraPosition.current);
    Object.assign(view.forward, cameraForward.current);
    root.getWorldPosition(cameraPosition.current);
    const position = cameraState.positions[subjectId] ??= { x: 0, y: 0, z: 0, yaw: 0 };
    Object.assign(position, cameraPosition.current);
    position.yaw = root.rotation.y;
  }, -1);

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
  return <DjiDrone subjectId="dji-neo" startObservation="terrace" glbPath="/items/dji-neo/dji-neo.glb" targetMaxDimCm={15.7} itemName="Drone DJI Neo" rotationY={-Math.PI / 2} {...props} />;
}

export function DjiAvata2Drone(props: { isPreview?: boolean; previewAnim?: string; onSize?: (size: THREE.Vector3) => void }) {
  return <DjiDrone subjectId="dji-avata-2" startObservation="feeder" glbPath="/items/dji-avata-2/dji-avata-2.glb" targetMaxDimCm={21.2} itemName="Drone DJI Avata 2" {...props} />;
}

export function DjiFpvDrone(props: { isPreview?: boolean; previewAnim?: string; onSize?: (size: THREE.Vector3) => void }) {
  return <DjiDrone subjectId="dji-fpv" startObservation="top" glbPath="/items/dji-fpv/dji-fpv.glb" targetMaxDimCm={31.2} itemName="Drone DJI FPV" {...props} />;
}

useGLTF.preload('/items/dji-neo/dji-neo.glb');
useGLTF.preload('/items/dji-avata-2/dji-avata-2.glb');
useGLTF.preload('/items/dji-fpv/dji-fpv.glb');
