/**
 * RingDroneCam.tsx — Ring Drone Cam (Nov 2026) et sa base de charge.
 *
 * Modèle GLB en mètres (scale ×100 pour la scène en cm) contenant :
 *   - RingDock  (27.0 × 7.83 × 23.35 cm) : base posée au fond de la boîte DRONA sur Kallax NE
 *   - RingDrone (17.18 × 3.315 × 13.69 cm) : quadricoptère caréné avec caméra 2K et double projecteur LED
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTFClone, preloadSceneGLTF } from '@features/scene/useGLTFClone';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { isAppIdle } from '@features/scene/idleState';
import { updateClipPreview } from '@features/inventory/updateClipPreview';
import { appLog } from '@features/ui/AppConsole';
import { cameraState } from '../cameraState';
import { HornetTour } from '../hornetTour';
import { SubjectDriver } from '../camera/subjectControls';
import { useDroneControlStore } from '../droneControls';
import { setAgentProfile, removeAgentProfile } from '../ai/navigation/obstacles';
import { useSceneStore } from '../store/useSceneStore';
import { KALLAX_NE_POSITION, KALLAX_NE_ROTATION } from './kallaxNeDrona';
import { KALLAX_NE_TOP_DRONA_FLOOR_LOCAL } from './KallaxNE';

const GLB_PATH = 'models/ring-drone-cam.glb';
const METERS_TO_CM = 100;
const DOCKED_OFFSET_Y = 4.35; // Hauteur d'assise du drone dans le berceau du dock (cm)
const TAKEOFF_ALTITUDE_Y = 178; // Dégagement au-dessus de la boîte DRONA (166.5 cm) et sous la TV murale (199 cm)
const VERTICAL_TAKEOFF_SPEED = 65;
const VERTICAL_LAND_SPEED = 50;
const RETURN_CRUISE_SPEED = 100;
const ROTOR_TAGS = [
  { tag: 'FL', dir: 1 },
  { tag: 'FR', dir: -1 },
  { tag: 'RL', dir: -1 },
  { tag: 'RR', dir: 1 },
] as const;

// Position monde du fond de la boîte DRONA posée sur la VARIERA de la Kallax NE.
const topDronaFloorLocal = new THREE.Vector3(...KALLAX_NE_TOP_DRONA_FLOOR_LOCAL)
  .applyAxisAngle(new THREE.Vector3(0, 1, 0), KALLAX_NE_ROTATION);
export const RING_DOCK_POSITION: [number, number, number] = [
  KALLAX_NE_POSITION[0] + topDronaFloorLocal.x,
  topDronaFloorLocal.y,
  KALLAX_NE_POSITION[2] + topDronaFloorLocal.z,
];
export const RING_DOCK_ROTATION_Y = -Math.PI / 2;

type FlightPhase = 'docked' | 'taking-off' | 'hover' | 'patrol' | 'returning' | 'landing';

export function RingDroneCam({
  isPreview = false,
  previewAnim = 'Drone_Hover',
  onSize,
}: {
  isPreview?: boolean;
  previewAnim?: string;
  onSize?: (size: THREE.Vector3) => void;
}) {
  const { scene } = useGLTFClone(GLB_PATH, true);
  const { invalidate } = useThree();
  const dockMountRef = useRef<THREE.Group>(null);
  const droneRootRef = useRef<THREE.Group>(null);
  const dronePivotRef = useRef<THREE.Group>(null);

  const rotorsRef = useRef<{ pivot: THREE.Group; dir: number }[]>([]);
  const spotlightMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const droneObjRef = useRef<THREE.Object3D | null>(null);
  const tourRef = useRef<HornetTour | null>(null);
  const phaseRef = useRef<FlightPhase>('docked');
  const returnWaypointsRef = useRef<THREE.Vector3[]>([]);
  const previewElapsedRef = useRef(0);
  const spotlightsOnRef = useRef<boolean | null>(null);
  const dimensionsRef = useRef(new THREE.Vector3(17.18, 3.315, 13.69));

  const driver = useMemo(() => new SubjectDriver('ring-drone-cam'), []);
  // Légèrement devant la lentille frontale (+7.195 cm) pour ne pas être occulté par la vitre de caméra.
  const cameraMount = useMemo(() => new THREE.Vector3(0, 1.66, 7.5), []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraForward = useMemo(() => new THREE.Vector3(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const dockQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, RING_DOCK_ROTATION_Y, 0)),
    [],
  );
  const directionVec = useMemo(() => new THREE.Vector3(), []);
  const previewDummyClip = useMemo(() => new THREE.AnimationClip('RingPreview', 2.0, []), []);
  const previewMixerRef = useRef<THREE.AnimationMixer | null>(null);

  const publishView = useCallback((root: THREE.Group, pivot: THREE.Group) => {
    root.updateMatrixWorld(true);
    pivot.localToWorld(cameraPosition.copy(cameraMount));
    pivot.getWorldDirection(cameraForward);
    const view = (cameraState.animalViews['ring-drone-cam'] ??= {
      eyes: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: 1 },
      radius: dimensionsRef.current.length() / 2,
    });
    Object.assign(view.eyes, cameraPosition);
    Object.assign(view.forward, cameraForward);
    root.getWorldPosition(cameraPosition);
    const pos = (cameraState.positions['ring-drone-cam'] ??= { x: 0, y: 0, z: 0, yaw: 0 });
    Object.assign(pos, cameraPosition);
    pos.yaw = root.rotation.y;
  }, [cameraMount, cameraPosition, cameraForward]);

  const setSpotlights = (enabled: boolean) => {
    if (spotlightsOnRef.current === enabled) return;
    spotlightsOnRef.current = enabled;
    for (const mat of spotlightMatsRef.current) {
      mat.emissiveIntensity = enabled ? 2.5 : 0;
    }
  };

  useLayoutEffect(() => {
    const dockObj = scene.getObjectByName('RingDock');
    const droneObj = scene.getObjectByName('RingDrone');
    if (!dockObj || !droneObj) {
      throw new Error('RingDroneCam : objets RingDock ou RingDrone absents du GLB');
    }
    droneObjRef.current = droneObj;

    // Remise à zéro idempotente avant mesure (Pattern B)
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    if (dockObj.parent !== scene) scene.add(dockObj);
    if (droneObj.parent !== scene) scene.add(droneObj);
    dockObj.position.set(0, 0, 0);
    dockObj.rotation.set(0, 0, 0);
    dockObj.scale.set(1, 1, 1);
    droneObj.position.set(0, DOCKED_OFFSET_Y / METERS_TO_CM, 0);
    droneObj.rotation.set(0, 0, 0);
    droneObj.scale.set(1, 1, 1);

    // Création des pivots de rotors autour de chaque moteur (idempotent)
    droneObj.updateMatrixWorld(true);
    const pivots: { pivot: THREE.Group; dir: number }[] = [];
    for (const { tag, dir } of ROTOR_TAGS) {
      let pivot = droneObj.getObjectByName(`RotorPivot_${tag}`) as THREE.Group | undefined;
      if (!pivot) {
        const motor = droneObj.getObjectByName(`Drone_Motor_${tag}`);
        if (!motor) throw new Error(`RingDroneCam : moteur Drone_Motor_${tag} absent`);
        pivot = new THREE.Group();
        pivot.name = `RotorPivot_${tag}`;
        pivot.position.copy(motor.position);
        droneObj.add(pivot);
        pivot.updateMatrixWorld(true);
        for (let b = 0; b < 3; b++) {
          const blade = droneObj.getObjectByName(`Drone_Blade_${tag}_${b}`);
          if (blade) pivot.attach(blade);
        }
      }
      pivots.push({ pivot, dir });
    }
    rotorsRef.current = pivots;

    const spotlights: THREE.MeshStandardMaterial[] = [];
    for (const side of ['Left', 'Right']) {
      const led = droneObj.getObjectByName(`Drone_SpotlightLED_${side}`) as THREE.Mesh | undefined;
      if (led?.material && !Array.isArray(led.material)) {
        spotlights.push(led.material as THREE.MeshStandardMaterial);
      }
    }
    spotlightMatsRef.current = spotlights;
    spotlightsOnRef.current = null;

    scene.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = isPreview;
      mesh.receiveShadow = true;
    });

    scene.scale.setScalar(METERS_TO_CM);
    const bbox = glbLocalBBox(scene);
    scene.position.set(-bbox.getCenter(new THREE.Vector3()).x, -bbox.min.y, -bbox.getCenter(new THREE.Vector3()).z);
    onSize?.(bbox.getSize(new THREE.Vector3()));

    if (isPreview) {
      previewMixerRef.current = new THREE.AnimationMixer(scene);
      setSpotlights(previewAnim !== 'Drone_Landed');
      invalidate();
      return () => {
        previewMixerRef.current?.stopAllAction();
        previewMixerRef.current = null;
      };
    }

    // Mode scène : sépare RingDock (fixe dans la DRONA) et RingDrone (mobile dans l'appartement)
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);

    if (dockMountRef.current && dronePivotRef.current && droneRootRef.current) {
      dockObj.scale.setScalar(METERS_TO_CM);
      dockObj.position.set(0, 0, 0);
      dockObj.rotation.set(0, 0, 0);
      dockMountRef.current.add(dockObj);

      droneObj.scale.setScalar(METERS_TO_CM);
      droneObj.position.set(0, 0, 0);
      droneObj.rotation.set(0, 0, 0);
      dronePivotRef.current.add(droneObj);

      droneRootRef.current.position.set(
        RING_DOCK_POSITION[0],
        RING_DOCK_POSITION[1] + DOCKED_OFFSET_Y,
        RING_DOCK_POSITION[2],
      );
      droneRootRef.current.quaternion.copy(dockQuat);
      publishView(droneRootRef.current, dronePivotRef.current);
    }

    phaseRef.current = 'docked';
    returnWaypointsRef.current = [];
    setSpotlights(false);

    const radius = Math.hypot(dimensionsRef.current.x / 2, dimensionsRef.current.y, dimensionsRef.current.z / 2);
    const tour = new HornetTour(radius, message => appLog('drone', `Ring Drone Cam : ${message}`), Math.random, 'ring-drone-cam');
    tourRef.current = tour;
    setAgentProfile('ring-drone-cam', { radius, height: radius * 2 });

    invalidate();

    return () => {
      driver.dispose();
      removeAgentProfile('ring-drone-cam');
      tourRef.current?.release();
      tourRef.current = null;
      delete cameraState.animalViews['ring-drone-cam'];
      delete cameraState.positions['ring-drone-cam'];
      if (cameraState.animalTarget === 'ring-drone-cam') {
        cameraState.animalTarget = null;
        document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'reset-orbit' }));
      }
    };
  }, [scene, isPreview, invalidate, driver, dockQuat, onSize, publishView]);

  useEffect(() => {
    if (isPreview) setSpotlights(previewAnim !== 'Drone_Landed');
  }, [isPreview, previewAnim]);

  useFrame((_, delta) => {
    if (isAppIdle()) return;

    if (isPreview) {
      const droneObj = droneObjRef.current;
      if (!droneObj) return;
      const landed = previewAnim === 'Drone_Landed';
      setSpotlights(!landed);
      if (previewMixerRef.current) {
        updateClipPreview(previewMixerRef.current, previewDummyClip, delta, 'Ring Drone Cam');
      }
      if (landed) {
        droneObj.position.set(0, DOCKED_OFFSET_Y / METERS_TO_CM, 0);
        droneObj.rotation.set(0, 0, 0);
      } else {
        previewElapsedRef.current += delta;
        const t = previewElapsedRef.current;
        const bob = Math.sin(t * 3.0) * 0.005;
        droneObj.position.set(0, 0.13 + bob, 0);
        droneObj.rotation.set(
          previewAnim === 'Drone_Fly' ? 0.10 : Math.sin(t * 1.5) * 0.02,
          previewAnim === 'Drone_Scan' ? Math.sin(t * 1.2) * 0.25 : 0,
          Math.cos(t * 2.0) * 0.02,
        );
        for (const { pivot, dir } of rotorsRef.current) {
          pivot.rotation.y += dir * delta * 48;
        }
      }
      invalidate();
      return;
    }

    const root = droneRootRef.current;
    const pivot = dronePivotRef.current;
    const tour = tourRef.current;
    if (!root || !pivot || !tour) return;

    const patrolRequested = Boolean(useSceneStore.getState().extraStates['ring-drone-patrol']);
    const inFpv = cameraState.animalTarget === 'ring-drone-cam' && cameraState.mode === 'fpv';
    const [dockX, dockY, dockZ] = RING_DOCK_POSITION;
    const dockedY = dockY + DOCKED_OFFSET_Y;

    const planReturnToDock = () => {
      const hoverAboveDock = new THREE.Vector3(dockX, TAKEOFF_ALTITUDE_Y, dockZ);
      const waypoints: THREE.Vector3[] = [];
      if (tour.space.blocker(root.position, hoverAboveDock)) {
        const neObs = tour.observations.find(o => o.id === 'north-east') ?? tour.observations[0];
        const route = tour.route(root.position, neObs.position);
        if (route) waypoints.push(...route);
      }
      waypoints.push(hoverAboveDock);
      returnWaypointsRef.current = waypoints;
      phaseRef.current = 'returning';
      appLog('drone', 'Ring Drone Cam : retour vers la base.');
    };

    driver.step(root, delta, useDroneControlStore.getState().speed, tour.radius);
    if (driver.started) {
      tour.release();
      if (phaseRef.current === 'docked') phaseRef.current = 'hover';
    }
    if (driver.resumed) {
      if (patrolRequested) {
        tour.reset();
        phaseRef.current = 'patrol';
      } else if (inFpv) {
        phaseRef.current = 'hover';
      } else {
        planReturnToDock();
      }
    }

    if (!driver.active) {
      const phase = phaseRef.current;
      if (phase === 'docked') {
        root.position.set(dockX, dockedY, dockZ);
        root.quaternion.copy(dockQuat);
        pivot.position.set(0, 0, 0);
        pivot.rotation.set(0, 0, 0);
        setSpotlights(false);
        if (patrolRequested || inFpv) {
          phaseRef.current = 'taking-off';
          appLog('drone', patrolRequested ? 'Ring Drone Cam : décollage depuis la base.' : 'Ring Drone Cam : décollage en vue FPV.');
        }
      } else if (phase === 'taking-off') {
        setSpotlights(true);
        root.position.y = Math.min(TAKEOFF_ALTITUDE_Y, root.position.y + VERTICAL_TAKEOFF_SPEED * delta);
        if (root.position.y >= TAKEOFF_ALTITUDE_Y) {
          if (patrolRequested) {
            tour.reset();
            phaseRef.current = 'patrol';
            appLog('drone', 'Ring Drone Cam : patrouille autonome.');
          } else if (inFpv) {
            phaseRef.current = 'hover';
          } else {
            phaseRef.current = 'landing';
          }
        }
      } else if (phase === 'hover') {
        setSpotlights(true);
        if (patrolRequested) {
          tour.reset();
          phaseRef.current = 'patrol';
          appLog('drone', 'Ring Drone Cam : patrouille autonome.');
        } else if (!inFpv) {
          planReturnToDock();
        }
      } else if (phase === 'patrol') {
        setSpotlights(true);
        if (!patrolRequested) {
          tour.release();
          if (inFpv) phaseRef.current = 'hover';
          else planReturnToDock();
        } else {
          tour.tick(root.position, root.quaternion, delta);
        }
      } else if (phase === 'returning') {
        setSpotlights(true);
        if (patrolRequested) {
          tour.reset();
          phaseRef.current = 'patrol';
        } else if (inFpv) {
          phaseRef.current = 'hover';
        } else {
          const waypoints = returnWaypointsRef.current;
          const nextTarget = waypoints[0];
          if (!nextTarget) {
            phaseRef.current = 'landing';
          } else {
            const dist = root.position.distanceTo(nextTarget);
            const step = Math.min(dist, RETURN_CRUISE_SPEED * delta);
            if (dist > 0.01) {
              directionVec.subVectors(nextTarget, root.position).normalize();
              const yaw = Math.atan2(directionVec.x, directionVec.z);
              targetQuat.setFromEuler(new THREE.Euler(0, yaw, 0));
              root.quaternion.rotateTowards(targetQuat, Math.PI * delta);
              root.position.addScaledVector(directionVec, step);
            }
            if (dist - step <= 0.1) {
              root.position.copy(nextTarget);
              waypoints.shift();
              if (!waypoints.length) phaseRef.current = 'landing';
            }
          }
        }
      } else if (phase === 'landing') {
        setSpotlights(true);
        if (patrolRequested || inFpv) {
          phaseRef.current = root.position.y < TAKEOFF_ALTITUDE_Y ? 'taking-off' : patrolRequested ? 'patrol' : 'hover';
        } else {
          root.quaternion.rotateTowards(dockQuat, Math.PI * delta);
          root.position.y = Math.max(dockedY, root.position.y - VERTICAL_LAND_SPEED * delta);
          if (root.position.y <= dockedY && root.quaternion.angleTo(dockQuat) < 0.02) {
            root.position.set(dockX, dockedY, dockZ);
            root.quaternion.copy(dockQuat);
            phaseRef.current = 'docked';
            setSpotlights(false);
            appLog('drone', 'Ring Drone Cam : posé sur sa base (confidentialité activée).');
          }
        }
      }
    }

    if (phaseRef.current !== 'docked' || driver.active) {
      for (const { pivot: rotorPivot, dir } of rotorsRef.current) {
        rotorPivot.rotation.y += dir * delta * 48;
      }
      if (phaseRef.current === 'patrol' || phaseRef.current === 'hover' || driver.active) {
        const t = performance.now() * 0.003;
        pivot.position.y = Math.sin(t) * 0.4;
      } else {
        pivot.position.y = 0;
      }
      invalidate();
    }

    publishView(root, pivot);
  }, -1);

  if (isPreview) {
    return <primitive object={scene} />;
  }

  return (
    <>
      <group
        ref={dockMountRef}
        name="ring-dock-mount"
        position={RING_DOCK_POSITION}
        rotation={[0, RING_DOCK_ROTATION_Y, 0]}
      />
      <group ref={droneRootRef} name="ring-drone-root">
        <group ref={dronePivotRef} name="RingDronePivot" />
      </group>
    </>
  );
}

preloadSceneGLTF(GLB_PATH);
