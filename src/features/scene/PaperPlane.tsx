/**
 * PaperPlane.tsx — Mode "Avion" : pilote un avion dans le studio.
 *
 * Modèles :  paper (procédural) | rocket (GLB) | comet (GLB animé)
 *
 * Vues (touche C) :  prelaunch → follow → cockpit → walker
 *
 * Atterrissage automatique :
 *   Quand l'avion s'aligne avec une piste (±22°, dist < 60 cm latéral),
 *   il atterrit automatiquement le long de la piste puis passe en vue
 *   orbitale autour du point d'atterrissage.
 *
 * Contrôles de vol :
 *   W / ↑   — piquer   S / ↓   — cabrer
 *   A / ←   — roulis G  D / →  — roulis D
 *   Espace  — accélérer   Shift — freiner
 *   C       — changer vue (ou décoller depuis prelaunch)
 *   F / Échap — quitter
 */
import { useEffect, useMemo, useRef, Suspense } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { ROOM_W, ROOM_D, WALL_H } from '@config';
import { cameraState } from './cameraState';
import { useGLTFClone } from './useGLTFClone';
import { LANDING_STRIPS } from './LandingStrips';

// ── Types exportés ────────────────────────────────────────────────────────────

export type PlaneModelKey = 'paper' | 'rocket' | 'comet';
export type PlaneViewMode = 'prelaunch' | 'follow' | 'cockpit' | 'walker' | 'landing' | 'landed';

// ── Constantes physique ───────────────────────────────────────────────────────

const START_POS    = new THREE.Vector3(ROOM_W / 2, WALL_H + 250, ROOM_D / 2 + 200);
const MIN_Y        = 20;
const MAX_Y        = 2500;
const WORLD_X_MIN  = -1500;
const WORLD_X_MAX  = ROOM_W + 1500;
const WORLD_Z_MIN  = -1500;
const WORLD_Z_MAX  = ROOM_D + 1500;

const GRAVITY      = 30;
const SPEED_MIN    = 50;
const SPEED_MAX    = 450;
const SPEED_INIT   = 130;
const SPEED_BOOST  = 110;
const SPEED_BRAKE  = 90;
const SPEED_DIVE   = 80;
const SPEED_DRAG   = 14;
const PITCH_RATE   = 1.6;
const ROLL_RATE    = 2.4;
const ROLL_TO_YAW  = 1.2;
const PITCH_LIMIT  = 1.2;
const ROLL_LIMIT   = 1.3;
const PITCH_DAMP   = 1.6;
const ROLL_DAMP    = 2.6;

const CAM_FOLLOW_OFFSET = new THREE.Vector3(0, 30, 90);
const CAM_FOLLOW_LOOK   = new THREE.Vector3(0, 0, -80);
const CAM_LERP          = 0.18;

// Atterrissage automatique
const LAND_ALIGN_DOT    = 0.93;  // cos(22°) — seuil alignement
const LAND_LATERAL_MAX  = 60;    // cm — distance latérale max à la piste
const LAND_ALONG_EXTRA  = 150;   // cm — zone d'approche au-delà de chaque extrémité
const LAND_ALT_MAX      = 40;    // cm — altitude max pour déclencher l'atterrissage
const LAND_DECEL        = 60;    // cm/s² — décélération
const LAND_GRAVITY_MULT = 3;     // gravité renforcée pendant l'atterrissage

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Lerp d'angle court-circuit (gère le wrap -π/+π). */
function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d >  Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}

/**
 * Calcule le facteur d'échelle pour ramener un GLB à targetCm.
 * Box3.setFromObject avec matrixWorld mis à jour au root.scale=1
 * → prend en compte les transforms de nœuds (scale mm→m etc.).
 */
function glbScale(root: THREE.Object3D, targetCm: number): number {
  const saved = root.scale.clone();
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);         // force-update sur tout le sous-arbre
  const box = new THREE.Box3().setFromObject(root);
  root.scale.copy(saved);
  if (box.isEmpty()) return 1;
  const size = box.getSize(new THREE.Vector3());
  const max  = Math.max(size.x, size.y, size.z);
  return max > 0 ? targetCm / max : 1;
}

// ── Mesh avion en papier ──────────────────────────────────────────────────────

export function PaperPlaneMesh() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const L = 30, W = 18, T = 18, H = 6;
    const v = new Float32Array([
      0, 0, -L, -W, 0, T,  0, 0, T,
      0, 0, -L,  0, 0, T,  W, 0, T,
      0, 0, -L,  0, 0, T, -W, 0, T,
      0, 0, -L,  W, 0, T,  0, 0, T,
      0, 0, -L,  0,-H, T,  0, 0, T,
      0, 0, -L,  0, 0, T,  0,-H, T,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color="#f5f5ee" side={THREE.DoubleSide} roughness={0.85} />
    </mesh>
  );
}

// ── Mesh Rocket ───────────────────────────────────────────────────────────────

function RocketMesh() {
  const { scene } = useGLTFClone('items/plane-rocket/plane-rocket.glb');
  const s = useMemo(() => glbScale(scene, 55), [scene]);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <primitive object={scene} scale={s} />
    </group>
  );
}

// ── Mesh Comète (animé, SkinnedMesh) ─────────────────────────────────────────

function CometMesh() {
  const gltf = useGLTF('items/plane-comet/plane-comet.glb');

  const { cloned, s, offset } = useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const size   = box.isEmpty() ? new THREE.Vector3() : box.getSize(new THREE.Vector3());
    const max    = Math.max(size.x, size.y, size.z);
    const sc     = max > 0 ? 55 / max : 1;
    return { cloned: c, s: sc, offset: center.multiplyScalar(-sc) };
  }, [gltf.scene]);

  const mixer = useRef<THREE.AnimationMixer | null>(null);
  useEffect(() => {
    if (!gltf.animations.length) return;
    const m = new THREE.AnimationMixer(cloned);
    gltf.animations.forEach(clip => m.clipAction(clip).play());
    mixer.current = m;
    return () => { mixer.current?.stopAllAction(); mixer.current = null; };
  }, [cloned, gltf.animations]);

  useFrame((_, dt) => mixer.current?.update(dt));

  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <group position={offset.toArray()}>
        <primitive object={cloned} scale={s} />
      </group>
    </group>
  );
}

// ── Sélecteur de mesh ─────────────────────────────────────────────────────────

export function PlaneMesh({ model }: { model: PlaneModelKey }) {
  if (model === 'rocket') return <Suspense fallback={<PaperPlaneMesh />}><RocketMesh /></Suspense>;
  if (model === 'comet')  return <Suspense fallback={<PaperPlaneMesh />}><CometMesh /></Suspense>;
  return <PaperPlaneMesh />;
}

useGLTF.preload('items/plane-rocket/plane-rocket.glb');
useGLTF.preload('items/plane-comet/plane-comet.glb');

// ── Composant principal ───────────────────────────────────────────────────────

interface PaperPlaneProps {
  onExit:            () => void;
  model?:            PlaneModelKey;
  onViewModeChange?: (vm: PlaneViewMode, launched: boolean) => void;
}

export function PaperPlane({ onExit, model = 'paper', onViewModeChange }: PaperPlaneProps) {
  const { camera, invalidate } = useThree();
  const planeRef    = useRef<THREE.Group>(null!);
  const onExitRef   = useRef(onExit);
  onExitRef.current = onExit;
  const onVMRef     = useRef(onViewModeChange);
  onVMRef.current   = onViewModeChange;

  // ── Vue & vol ────────────────────────────────────────────────────────────────
  const viewModeRef    = useRef<PlaneViewMode>('prelaunch');
  const launchedRef    = useRef(false);
  const prelaunchAngle = useRef(0);

  // ── Atterrissage ─────────────────────────────────────────────────────────────
  const landingRef      = useRef(false);
  const landedRef       = useRef(false);
  const landTargetYaw   = useRef(0);
  const landedPos       = useRef(new THREE.Vector3());
  const landedOrbit     = useRef(0); // angle orbite post-atterrissage

  // ── Physique de vol ───────────────────────────────────────────────────────────
  const flight = useRef({
    pos:   START_POS.clone(),
    yaw:   Math.PI,
    pitch: -0.05,
    roll:  0,
    speed: SPEED_INIT,
    quat:  new THREE.Quaternion(),
  });
  const keys  = useRef(new Set<string>());
  const _euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const _va    = useRef(new THREE.Vector3());
  const _vb    = useRef(new THREE.Vector3());

  // ── Helpers ────────────────────────────────────────────────────────────────

  function changeVM(vm: PlaneViewMode) {
    viewModeRef.current       = vm;
    cameraState.planeViewMode = vm;
    onVMRef.current?.(vm, launchedRef.current);
    invalidate();
  }

  function launch() {
    if (launchedRef.current) return;
    launchedRef.current       = true;
    cameraState.planeLaunched = true;
    changeVM('follow');
  }

  // ── Setup effet ──────────────────────────────────────────────────────────────

  useEffect(() => {
    cameraState.mode          = 'plane';
    cameraState.planeViewMode = 'prelaunch';
    cameraState.planeLaunched = false;
    flight.current.pos.copy(START_POS);
    flight.current.yaw   = Math.PI;
    flight.current.pitch = -0.05;
    flight.current.roll  = 0;
    flight.current.speed = SPEED_INIT;
    launchedRef.current  = false;
    landingRef.current   = false;
    landedRef.current    = false;
    viewModeRef.current  = 'prelaunch';
    prelaunchAngle.current = 0;
    keys.current.clear();

    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        e.preventDefault(); onExitRef.current(); return;
      }
      if (e.key === 'c' || e.key === 'C') {
        if (!launchedRef.current) { launch(); return; }
        if (landingRef.current || landedRef.current) return; // pas de cycle pendant atterro
        const modes: PlaneViewMode[] = ['follow', 'cockpit', 'walker'];
        const cur = viewModeRef.current as PlaneViewMode;
        const idx = modes.indexOf(cur as any);
        changeVM(modes[(idx < 0 ? 0 : (idx + 1)) % modes.length]);
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter') && !launchedRef.current) {
        e.preventDefault(); launch(); return;
      }
      if (!launchedRef.current || landingRef.current || landedRef.current) return;
      if (e.key === ' ') { keys.current.add(' '); e.preventDefault(); invalidate(); return; }
      const k = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)) {
        keys.current.add(k); e.preventDefault(); invalidate();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
      if (e.key === ' ') keys.current.delete(' ');
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
      cameraState.mode          = 'orbit';
      cameraState.planeViewMode = 'follow';
      cameraState.planeLaunched = false;
      keys.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate]);

  // ── Frame loop ───────────────────────────────────────────────────────────────

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s  = flight.current;
    const vm = viewModeRef.current;

    // ── Phase prelaunch ─────────────────────────────────────────────────────
    if (!launchedRef.current) {
      prelaunchAngle.current += dt * 0.35;
      const a = prelaunchAngle.current;
      _va.current.set(s.pos.x + 150 * Math.cos(a), s.pos.y + 70, s.pos.z + 150 * Math.sin(a));
      camera.position.lerp(_va.current, 0.04);
      camera.lookAt(s.pos);
      planeRef.current.position.copy(s.pos);
      _euler.current.set(0, s.yaw, 0);
      planeRef.current.quaternion.setFromEuler(_euler.current);
      cameraState.planeX = s.pos.x; cameraState.planeZ = s.pos.z; cameraState.planeYaw = s.yaw;
      cameraState.onUpdate?.();
      invalidate(); return;
    }

    // ── Phase atterri (orbite) ──────────────────────────────────────────────
    if (landedRef.current) {
      landedOrbit.current += dt * 0.25;
      const a = landedOrbit.current;
      _va.current.set(
        landedPos.current.x + 120 * Math.cos(a),
        landedPos.current.y + 60,
        landedPos.current.z + 120 * Math.sin(a),
      );
      camera.position.lerp(_va.current, 0.04);
      camera.lookAt(landedPos.current);
      cameraState.onUpdate?.();
      invalidate(); return;
    }

    // ── Détection atterrissage automatique ──────────────────────────────────
    if (!landingRef.current && cameraState.landingStripsVisible) {
      const planeFwdX = -Math.sin(s.yaw);
      const planeFwdZ = -Math.cos(s.yaw);

      for (const strip of LANDING_STRIPS) {
        const sdX = Math.sin(strip.angleY);
        const sdZ = Math.cos(strip.angleY);
        const dot = planeFwdX * sdX + planeFwdZ * sdZ;

        if (Math.abs(dot) > LAND_ALIGN_DOT) {
          const dX = s.pos.x - strip.cx;
          const dZ = s.pos.z - strip.cz;
          // Composante latérale (perpendiculaire à la piste)
          const lateral = Math.abs(-dX * sdZ + dZ * sdX);
          // Composante longitudinale (le long de la piste)
          const along   = Math.abs(dX * sdX + dZ * sdZ);

          if (
            lateral < LAND_LATERAL_MAX &&
            along   < strip.length / 2 + LAND_ALONG_EXTRA &&
            s.pos.y < LAND_ALT_MAX
          ) {
            landingRef.current  = true;
            // dot > 0 → plane avance dans le sens +strip → conserver ce cap
            landTargetYaw.current = dot > 0
              ? strip.angleY + Math.PI
              : strip.angleY;
            changeVM('landing');
            break;
          }
        }
      }
    }

    // ── Physique de vol (ou d'atterrissage) ─────────────────────────────────
    if (landingRef.current) {
      // Aligner le cap sur la piste, niveler
      s.yaw   = lerpAngle(s.yaw, landTargetYaw.current, 0.08);
      s.pitch = s.pitch * Math.max(0, 1 - 3 * dt);
      s.roll  = s.roll  * Math.max(0, 1 - 3 * dt);
      _euler.current.set(s.pitch, s.yaw, s.roll);
      s.quat.setFromEuler(_euler.current);

      // Décélérer
      s.speed = Math.max(0, s.speed - LAND_DECEL * dt);

      // Descendre plus fort
      s.pos.y -= GRAVITY * LAND_GRAVITY_MULT * dt;
      _va.current.set(0, 0, -1).applyQuaternion(s.quat);
      s.pos.addScaledVector(_va.current, s.speed * dt);

      // Atterri ?
      if (s.pos.y <= 5) {
        s.pos.y = 5;
        landedRef.current = true;
        landedPos.current.copy(s.pos);
        changeVM('landed');
      }
    } else {
      // Vol normal
      const k = keys.current;
      let pitchIn = 0, rollIn = 0, throttleIn = 0;
      if (k.has('w') || k.has('arrowup'))    pitchIn -= 1;
      if (k.has('s') || k.has('arrowdown'))  pitchIn += 1;
      if (k.has('a') || k.has('arrowleft'))  rollIn  += 1;
      if (k.has('d') || k.has('arrowright')) rollIn  -= 1;
      if (k.has(' '))     throttleIn += 1;
      if (k.has('shift')) throttleIn -= 1;

      s.pitch += pitchIn * PITCH_RATE * dt;
      s.roll  += rollIn  * ROLL_RATE  * dt;
      if (pitchIn === 0) s.pitch *= Math.max(0, 1 - PITCH_DAMP * dt);
      if (rollIn  === 0) s.roll  *= Math.max(0, 1 - ROLL_DAMP  * dt);
      s.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.pitch));
      s.roll  = Math.max(-ROLL_LIMIT,  Math.min(ROLL_LIMIT,  s.roll));
      s.yaw  += s.roll * ROLL_TO_YAW * dt;

      _euler.current.set(s.pitch, s.yaw, s.roll);
      s.quat.setFromEuler(_euler.current);

      if (throttleIn > 0) s.speed += SPEED_BOOST * dt;
      if (throttleIn < 0) s.speed -= SPEED_BRAKE * dt;
      s.speed += -Math.sin(s.pitch) * SPEED_DIVE * dt;
      s.speed -= SPEED_DRAG * dt;
      s.speed  = Math.max(SPEED_MIN, Math.min(SPEED_MAX, s.speed));

      _va.current.set(0, 0, -1).applyQuaternion(s.quat);
      s.pos.addScaledVector(_va.current, s.speed * dt);
      s.pos.y -= GRAVITY * dt;
      s.pos.x  = Math.max(WORLD_X_MIN, Math.min(WORLD_X_MAX, s.pos.x));
      s.pos.z  = Math.max(WORLD_Z_MIN, Math.min(WORLD_Z_MAX, s.pos.z));
      if (s.pos.y < MIN_Y) { s.pos.y = MIN_Y; s.pitch = Math.max(s.pitch, 0.1); }
      if (s.pos.y > MAX_Y) s.pos.y = MAX_Y;
    }

    planeRef.current.position.copy(s.pos);
    planeRef.current.quaternion.copy(s.quat);

    // ── Caméra ─────────────────────────────────────────────────────────────
    if (vm === 'follow' || vm === 'landing') {
      _va.current.copy(CAM_FOLLOW_OFFSET).applyQuaternion(s.quat).add(s.pos);
      camera.position.lerp(_va.current, CAM_LERP);
      _vb.current.copy(CAM_FOLLOW_LOOK).applyQuaternion(s.quat).add(s.pos);
      camera.lookAt(_vb.current);

    } else if (vm === 'cockpit') {
      _va.current.set(0, 4, -22).applyQuaternion(s.quat).add(s.pos);
      camera.position.copy(_va.current);
      _vb.current.set(0, 0, -300).applyQuaternion(s.quat).add(s.pos);
      camera.lookAt(_vb.current);

    } else if (vm === 'walker') {
      const wx = cameraState.walkerX;
      const wz = cameraState.walkerZ;
      const wh = cameraState.walkerHeight * 0.93;
      camera.position.set(wx, wh, wz);
      camera.lookAt(s.pos);
    }

    cameraState.camX  = camera.position.x;
    cameraState.camZ  = camera.position.z;
    cameraState.camRY = s.yaw;
    cameraState.planeX   = s.pos.x;
    cameraState.planeZ   = s.pos.z;
    cameraState.planeYaw = s.yaw;
    cameraState.onUpdate?.();
    invalidate();
  });

  return (
    <group ref={planeRef}>
      <PlaneMesh model={model} />
    </group>
  );
}
