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

const FPV_PROP_AXIS = new THREE.Vector3(-0.685935, 0.367274, -0.628174).normalize();
const FPV_PROP_NODES = ['polySurface2_1_7', 'polySurface8_1_10', 'polySurface13_1_13', 'polySurface17_1_16'];

export interface DronePropellerDef {
  x: number;
  y: number;
  z: number;
  radius: number;
  blades?: number;
}

function DronePropeller({ radius, blades = 3, isSpinning }: { radius: number; blades?: number; isSpinning: boolean }) {
  const bladeAngles = useMemo(() => Array.from({ length: blades }, (_, i) => (i * Math.PI * 2) / blades), [blades]);
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.22, 8]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.3} metalness={0.4} />
      </mesh>
      {blades === 2 ? (
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[radius * 1.85, 0.03, radius * 0.22]} />
          <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.2} />
        </mesh>
      ) : (
        bladeAngles.map((angle, i) => (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[radius * 0.45, 0.04, 0]}>
              <boxGeometry args={[radius * 0.85, 0.03, radius * 0.22]} />
              <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.2} />
            </mesh>
          </group>
        ))
      )}
      {isSpinning && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <circleGeometry args={[radius, 24]} />
          <meshStandardMaterial color="#222222" transparent opacity={0.32} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

interface DjiDroneProps {
  glbPath: string;
  targetMaxDimCm: number;
  itemName: string;
  rotationY?: number;
  propellers?: DronePropellerDef[];
  isPreview?: boolean;
  previewAnim?: string;
  onSize?: (size: THREE.Vector3) => void;
}

export function DjiDrone({
  glbPath,
  targetMaxDimCm,
  itemName,
  rotationY = 0,
  propellers,
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
  const fpvPropsRef = useRef<THREE.Object3D[]>([]);
  const propRefs = useRef<(THREE.Group | null)[]>([]);
  const propAngleRef = useRef(0);

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

    const fpvNodes: THREE.Object3D[] = [];
    scene.traverse(c => {
      if (FPV_PROP_NODES.includes(c.name)) fpvNodes.push(c);
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
    fpvPropsRef.current = fpvNodes;

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
    const isLanded = targetAnimName === 'Drone_Landed';
    const store = isPreview ? useAnimPreviewStore.getState() : null;
    const isPlaying = !store || (store.isPlaying && !store.isScrubbing);

    if (!isLanded && isPlaying) {
      const playSpeed = store?.speed || 1;
      const spinStep = delta * playSpeed * 55;
      propAngleRef.current = (propAngleRef.current + spinStep) % (Math.PI * 2);

      fpvPropsRef.current.forEach((node, i) => {
        node.rotateOnAxis(FPV_PROP_AXIS, (i % 2 === 0 ? 1 : -1) * spinStep);
      });

      propRefs.current.forEach((ref, i) => {
        if (ref) ref.rotation.y = (i % 2 === 0 ? 1 : -1) * propAngleRef.current;
      });
    }

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

      if (isPreview && store) {
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

  const isSpinning = (previewAnim || 'Drone_Hover') !== 'Drone_Landed';

  return (
    <group ref={rootRef} userData={{ itemName }}>
      <group ref={pivotRef} name="DronePivot">
        <group rotation={[0, rotationY, 0]}>
          <primitive object={scene} />
          {propellers && (
            <group>
              {propellers.map((p, idx) => (
                <group
                  key={idx}
                  position={[p.x, p.y, p.z]}
                  ref={el => { propRefs.current[idx] = el; }}
                >
                  <DronePropeller radius={p.radius} blades={p.blades ?? 3} isSpinning={isSpinning} />
                </group>
              ))}
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

const NEO_PROPS: DronePropellerDef[] = [
  { x: 2.7, y: 2.6, z: 2.7, radius: 2.4, blades: 2 },
  { x: 2.7, y: 2.6, z: -2.7, radius: 2.4, blades: 2 },
  { x: -2.7, y: 2.6, z: 2.7, radius: 2.4, blades: 2 },
  { x: -2.7, y: 2.6, z: -2.7, radius: 2.4, blades: 2 },
];

const AVATA2_PROPS: DronePropellerDef[] = [
  { x: -4.55, y: 2.32, z: 4.75, radius: 3.3, blades: 3 },
  { x: 4.56, y: 2.32, z: 4.75, radius: 3.3, blades: 3 },
  { x: -4.83, y: 2.02, z: -4.58, radius: 3.3, blades: 3 },
  { x: 4.84, y: 2.02, z: -4.58, radius: 3.3, blades: 3 },
];

export function DjiNeoDrone(props: { isPreview?: boolean; previewAnim?: string; onSize?: (size: THREE.Vector3) => void }) {
  return <DjiDrone glbPath="/items/dji-neo/dji-neo.glb" targetMaxDimCm={15.7} itemName="Drone DJI Neo" rotationY={Math.PI / 2} propellers={NEO_PROPS} {...props} />;
}

export function DjiAvata2Drone(props: { isPreview?: boolean; previewAnim?: string; onSize?: (size: THREE.Vector3) => void }) {
  return <DjiDrone glbPath="/items/dji-avata-2/dji-avata-2.glb" targetMaxDimCm={21.2} itemName="Drone DJI Avata 2" rotationY={Math.PI} propellers={AVATA2_PROPS} {...props} />;
}

export function DjiFpvDrone(props: { isPreview?: boolean; previewAnim?: string; onSize?: (size: THREE.Vector3) => void }) {
  return <DjiDrone glbPath="/items/dji-fpv/dji-fpv.glb" targetMaxDimCm={31.2} itemName="Drone DJI FPV" rotationY={Math.PI} {...props} />;
}

useGLTF.preload('/items/dji-neo/dji-neo.glb');
useGLTF.preload('/items/dji-avata-2/dji-avata-2.glb');
useGLTF.preload('/items/dji-fpv/dji-fpv.glb');
