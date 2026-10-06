/**
 * PaperPlane.tsx — Mode "Avion" : pilote un avion dans le studio.
 *
 * Modèles : catalogue aircraftModels (papier, origami animé, avions et voitures volantes).
 *
 * Vues (touche C) :  prelaunch → follow → cockpit → character
 *
 * Atterrissage automatique :
 *   Quand l'avion s'aligne avec une piste (±22°, dist < 60 cm latéral),
 *   il atterrit automatiquement le long de la piste puis passe en vue
 *   orbitale autour du point d'atterrissage.
 *
 * Contrôles de vol :
 *   W / ↑   — piquer   S / ↓   — cabrer
 *   A / ←   — roulis / vrille G  D / →  — roulis / vrille D
 *   Espace / Ctrl — accélérer   Shift — freiner
 *   V       — changer de modèle
 *   C       — changer vue (ou décoller depuis prelaunch)
 *   F / Échap — quitter
 */
import { useEffect, useMemo, useRef, Suspense } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AircraftMesh } from './AircraftMesh';
import { AIRCRAFT_MODELS, type PlaneModelKey } from './aircraftModels';
export type { PlaneModelKey } from './aircraftModels';

import { ROOM_W, ROOM_D, WALL_H } from './wallData';
import { cameraState } from './cameraState';
import { LANDING_STRIPS } from './LandingStrips';
import { planeInput } from './planeInput';
import { CategoryLayerGroup } from './sceneLayer';
import { LAYER_AIRCRAFT } from './config';
import { SKY_CENTER, SKY_RADIUS } from './skyBounds';

// ── Types exportés ────────────────────────────────────────────────────────────

export type PlaneViewMode = 'prelaunch' | 'follow' | 'cockpit' | 'character' | 'landing' | 'landed';

// ── Constantes physique ───────────────────────────────────────────────────────

const START_POS    = new THREE.Vector3(ROOM_W / 2, WALL_H + 250, ROOM_D / 2 + 200);
const MIN_Y        = 20;

const GRAVITY      = 30;
const SPEED_MIN    = 50;
export const SPEED_MAX = 450;
const SPEED_INIT   = 130;
const SPEED_BOOST  = 110;
const SPEED_BRAKE  = 90;
const SPEED_DIVE   = 80;
const SPEED_DRAG   = 14;
const PITCH_RATE   = 1.6;
const ROLL_RATE    = 2.4;
const ROLL_TO_YAW  = 1.2;

const CAM_FOLLOW_OFFSET = new THREE.Vector3(0, 30, 90);
const CAM_FOLLOW_LOOK   = new THREE.Vector3(0, 0, -80);
const CAM_LERP          = 0.18;
const CHARACTER_EYE_OFFSET = 2; // cm devant le centre réel des yeux
const CHARACTER_CAMERA_NEAR = 0.1; // cm, comme la caméra FPV

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

export function PlaneMesh({ model, onLaunchReady }: { model: PlaneModelKey; onLaunchReady?: () => void }) {
  const definition = AIRCRAFT_MODELS.find(entry => entry.key === model)!;
  return <Suspense fallback={null}><AircraftMesh key={model} definition={definition} onLaunchReady={onLaunchReady} /></Suspense>;
}

// ── Composant principal ───────────────────────────────────────────────────────

interface PaperPlaneProps {
  onExit:            () => void;
  model?:            PlaneModelKey;
  onCycleModel?:    () => void;
  onViewModeChange?: (vm: PlaneViewMode, launched: boolean) => void;
}

export function PaperPlane({ onExit, model = 'origami', onViewModeChange, onCycleModel }: PaperPlaneProps) {
  const { camera, invalidate } = useThree();
  const originalNear = useRef(camera.near);
  const planeRef    = useRef<THREE.Group>(null!);
  const onExitRef   = useRef(onExit);
  onExitRef.current = onExit;
  const onCycleModelRef = useRef(onCycleModel);
  onCycleModelRef.current = onCycleModel;
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
  const previousPosition = useRef(new THREE.Vector3());
  const planeBounds = useRef(new THREE.Box3());
  const planeSphere = useRef(new THREE.Sphere());
  const skyCenter = useMemo(() => new THREE.Vector3(...SKY_CENTER), []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function changeVM(vm: PlaneViewMode) {
    viewModeRef.current       = vm;
    cameraState.planeViewMode = vm;
    onVMRef.current?.(vm, launchedRef.current);
    invalidate();
  }

  function finishLaunch() {
    if (launchedRef.current) return;
    cameraState.planeLaunching = false;
    launchedRef.current       = true;
    cameraState.planeLaunched = true;
    changeVM('follow');
  }

  function launch() {
    if (launchedRef.current || cameraState.planeLaunching) return;
    if (model === 'origami') {
      cameraState.planeLaunching = true;
      invalidate();
    } else finishLaunch();
  }
  const launchRef = useRef(launch);
  launchRef.current = launch;
  useEffect(() => {
    if (cameraState.planeLaunching && model !== 'origami') { cameraState.planeLaunching = false; finishLaunch(); }
  }, [model]);

  // ── Setup effet ──────────────────────────────────────────────────────────────

  useEffect(() => {
    cameraState.mode          = 'plane';
    cameraState.planeViewMode = 'prelaunch';
    cameraState.planeLaunched = false;
    cameraState.planeLaunching = false;
    cameraState.planeSpeed = 0;
    cameraState.planeSkyContact = false;
    camera.up.set(0, 1, 0);
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
    onVMRef.current?.('prelaunch', false);

    const onDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.altKey || (e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)))) return;
      const k = e.key.toLowerCase();
      const flightKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'control', ' '];
      if (e.ctrlKey && !flightKeys.includes(k)) return;
      if (k === 'v') {
        e.preventDefault();
        if (!e.repeat) onCycleModelRef.current?.();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault(); onExitRef.current(); return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (e.repeat) return;
        if (!launchedRef.current) { launchRef.current(); return; }
        if (landingRef.current || landedRef.current) return; // pas de cycle pendant atterro
        const modes: PlaneViewMode[] = ['follow', 'cockpit', 'character'];
        const cur = viewModeRef.current as PlaneViewMode;
        const idx = modes.indexOf(cur);
        changeVM(modes[(idx < 0 ? 0 : (idx + 1)) % modes.length]);
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter' || k === 'control') && !launchedRef.current) {
        e.preventDefault(); launchRef.current();
        if (k === 'control' || k === ' ') keys.current.add(k);
        return;
      }
      if (!launchedRef.current || landingRef.current || landedRef.current) return;
      if (e.key === ' ') { keys.current.add(' '); e.preventDefault(); invalidate(); return; }
      if (flightKeys.includes(k)) {
        keys.current.add(k); e.preventDefault(); invalidate();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
      if (e.key === ' ') keys.current.delete(' ');
    };
    const onCommand = (e: Event) => {
      const command = (e as CustomEvent<string>).detail;
      if (command === 'launch') launchRef.current();
      if (command === 'view') onDown(new KeyboardEvent('keydown', { key: 'c' }));
    };
    const clearKeys = () => keys.current.clear();
    const onVisibility = () => { if (document.hidden) clearKeys(); };
    document.addEventListener('plane-command', onCommand);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      document.removeEventListener('plane-command', onCommand);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', onVisibility);
      camera.up.set(0, 1, 0);
      camera.near = originalNear.current;
      camera.updateProjectionMatrix();
      cameraState.planeSpeed = 0;
      cameraState.planeSkyContact = false;
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
      cameraState.mode          = 'orbit';
      cameraState.planeViewMode = 'follow';
      cameraState.planeLaunched = false;
      cameraState.planeLaunching = false;
      keys.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate]);

  // ── Frame loop ───────────────────────────────────────────────────────────────

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s  = flight.current;
    const previousPos = previousPosition.current.copy(s.pos);

    // ── Phase prelaunch ─────────────────────────────────────────────────────
    if (!launchedRef.current) {
      prelaunchAngle.current += dt * 0.35;
      const a = prelaunchAngle.current;
      planeRef.current.position.copy(s.pos);
      _euler.current.set(0, s.yaw, 0);
      planeRef.current.quaternion.setFromEuler(_euler.current);
      planeRef.current.updateWorldMatrix(true, true);
      planeBounds.current.setFromObject(planeRef.current, true);
      _vb.current.copy(s.pos);
      if (!planeBounds.current.isEmpty()) planeBounds.current.getCenter(_vb.current);
      _va.current.set(_vb.current.x + 150 * Math.cos(a), _vb.current.y + 70, _vb.current.z + 150 * Math.sin(a));
      camera.position.lerp(_va.current, 1 - Math.pow(1 - 0.04, dt * 60));
      camera.lookAt(_vb.current);
      cameraState.planeX = _vb.current.x; cameraState.planeZ = _vb.current.z; cameraState.planeYaw = s.yaw;
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
      camera.position.lerp(_va.current, 1 - Math.pow(1 - 0.04, dt * 60));
      camera.lookAt(landedPos.current);
      cameraState.onUpdate?.();
      invalidate(); return;
    }

    // ── Détection atterrissage automatique ──────────────────────────────────
    if (!landingRef.current && cameraState.landingStripsVisible) {
      _va.current.set(0, 0, -1).applyQuaternion(s.quat);
      const planeFwdX = _va.current.x;
      const planeFwdZ = _va.current.z;
      const isUpright = _vb.current.set(0, 1, 0).applyQuaternion(s.quat).y > 0;

      for (const strip of LANDING_STRIPS) {
        const sdX = Math.sin(strip.angleY);
        const sdZ = Math.cos(strip.angleY);
        const dot = planeFwdX * sdX + planeFwdZ * sdZ;

        if (isUpright && Math.abs(dot) > LAND_ALIGN_DOT) {
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
      s.yaw   = lerpAngle(s.yaw, landTargetYaw.current, 1 - Math.pow(1 - 0.08, dt * 60));
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
        s.speed = 0;
        s.pitch = 0;
        s.roll = 0;
        _euler.current.set(0, s.yaw, 0);
        s.quat.setFromEuler(_euler.current);
        landedRef.current = true;
        landedPos.current.copy(s.pos);
        changeVM('landed');
      }
    } else {
      // Vol normal
      const k = keys.current;
      let pitchIn = planeInput.pitch, rollIn = planeInput.roll, throttleIn = planeInput.throttle;
      if (k.has('w') || k.has('arrowup'))    pitchIn -= 1;
      if (k.has('s') || k.has('arrowdown'))  pitchIn += 1;
      if (k.has('a') || k.has('arrowleft'))  rollIn  += 1;
      if (k.has('d') || k.has('arrowright')) rollIn  -= 1;
      if (k.has(' ') || k.has('control')) throttleIn += 1;
      if (k.has('shift')) throttleIn -= 1;

      pitchIn = THREE.MathUtils.clamp(pitchIn, -1, 1);
      rollIn = THREE.MathUtils.clamp(rollIn, -1, 1);
      throttleIn = THREE.MathUtils.clamp(throttleIn, -1, 1);
      s.pitch += pitchIn * PITCH_RATE * dt;
      s.roll  += rollIn  * ROLL_RATE  * dt;
      // Angle périodique : aucune butée, les commandes traversent le dos et la verticale.
      s.pitch = Math.atan2(Math.sin(s.pitch), Math.cos(s.pitch));
      s.roll = Math.atan2(Math.sin(s.roll), Math.cos(s.roll));
      s.yaw += Math.sin(s.roll) * Math.cos(s.pitch) * ROLL_TO_YAW * dt;

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
      if (s.pos.y < MIN_Y) {
        s.pos.y = MIN_Y;
        if (Math.sin(s.pitch) < 0) s.pitch = Math.cos(s.pitch) >= 0 ? 0 : Math.PI;
      }
    }

    _euler.current.set(s.pitch, s.yaw, s.roll);
    s.quat.setFromEuler(_euler.current);
    planeRef.current.position.copy(s.pos);
    planeRef.current.quaternion.copy(s.quat);

    // La limite suit le dôme réel et l'encombrement du modèle courant.
    planeRef.current.updateWorldMatrix(true, true);
    planeBounds.current.setFromObject(planeRef.current, true);
    cameraState.planeSkyContact = false;
    // Le groupe peut être vide pendant le chargement Suspense d'un modèle.
    if (!planeBounds.current.isEmpty()) {
      planeBounds.current.getBoundingSphere(planeSphere.current);
      _va.current.copy(planeSphere.current.center).sub(skyCenter);
      const distance = _va.current.length();
      const penetration = distance + planeSphere.current.radius - SKY_RADIUS;
      if (penetration >= 0) {
        cameraState.planeSkyContact = true;
        s.pos.addScaledVector(_va.current.normalize(), -penetration);
        planeRef.current.position.copy(s.pos);
      }
    }

    const vm = viewModeRef.current;
    camera.up.set(0, 1, 0);
    cameraState.planeSpeed = landedRef.current || dt === 0 ? 0 : s.pos.distanceTo(previousPos) / dt;

    // ── Caméra ─────────────────────────────────────────────────────────────
    const eyes = cameraState.activeEyesPos;
    const headForward = cameraState.activeHeadForward;
    const near = vm === 'character' ? CHARACTER_CAMERA_NEAR : originalNear.current;
    if (camera.near !== near) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
    if (vm === 'follow' || vm === 'landing' || (vm === 'character' && (!eyes || !headForward))) {
      _va.current.copy(CAM_FOLLOW_OFFSET).applyQuaternion(s.quat).add(s.pos);
      camera.position.lerp(_va.current, 1 - Math.pow(1 - CAM_LERP, dt * 60));
      _vb.current.copy(CAM_FOLLOW_LOOK).applyQuaternion(s.quat).add(s.pos);
      camera.up.set(0, 1, 0).applyQuaternion(s.quat);
      camera.lookAt(_vb.current);

    } else if (vm === 'cockpit') {
      _va.current.set(0, 4, -22).applyQuaternion(s.quat).add(s.pos);
      camera.position.copy(_va.current);
      // La caméra et l'avion partagent leurs axes : tangage ET roulis.
      camera.quaternion.copy(s.quat);

    } else if (vm === 'character') {
      // Les données anatomiques arrivent après le chargement du personnage.
      // Pendant ce chargement, conserver la vue de suivi ci-dessus.
      if (eyes && headForward) {
        _va.current.set(headForward.x, headForward.y, headForward.z).normalize();
        camera.position.set(eyes.x, eyes.y, eyes.z).addScaledVector(_va.current, CHARACTER_EYE_OFFSET);
        const headUp = cameraState.activeHeadUp;
        if (headUp) camera.up.set(headUp.x, headUp.y, headUp.z).normalize();
        camera.lookAt(s.pos);
      }
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
      <CategoryLayerGroup layer={LAYER_AIRCRAFT} register={false}>
        <PlaneMesh model={model} onLaunchReady={finishLaunch} />
      </CategoryLayerGroup>
    </group>
  );
}
