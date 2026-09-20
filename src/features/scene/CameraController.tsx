/**
 * CameraController.tsx
 *
 * Modes :
 *   orbit  — OrbitControls standard (défaut)
 *   walk   — troisième personne intelligente avec lissage et suivi de cible
 *   fpv    — première personne vue subjective (niveau des yeux)
 *   top    — vue orthographique du dessus (centrée pièce ou suivi walker)
 *
 * Raccourcis clavier :
 *   O          — vue perspective (reset) / orbit libre
 *   M          — basculer walk / fpv
 *   1 / 3      — vue FPV (1) / vue 3ème personne (3)
 *   T / Y      — vue 2D top pièce (T) / vue 2D top suivi perso (Y)
 *   L          — cycler les personnages actifs
 *   E          — basculer les personnages extra (5 aléatoires)
 *   Échap      — quitter walk mode / top-down
 *   Flèches    — déplacement walk / pan et rotation orbit
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { cameraState } from './cameraState';
import { useSceneStore } from './store/useSceneStore';
import { CHARACTERS } from './walkerConfig';
import {
  type CameraMode,
  CX,
  CZ,
  EYE_RATIO,
  PERSP_POS,
  PERSP_TARGET,
  activeWalkH,
  DEFAULT_ORBIT_DISTANCE,
  DEFAULT_ORBIT_PITCH,
  useCameraPointerEvents,
  useCameraShortcuts,
  useCameraFrameUpdate,
} from './camera';

const _tmpEyeTargetVec = new THREE.Vector3();
const _tmpEyeLookVec = new THREE.Vector3();
const _tmpEyeUpVec = new THREE.Vector3();

export function CameraController({ planeMode = false }: { planeMode?: boolean } = {}) {
  const { camera, size, invalidate, gl } = useThree();

  // Enregistrement d'invalidate pour usage externe (Studio.tsx, etc.)
  useEffect(() => {
    cameraState.invalidate = invalidate;
    return () => {
      cameraState.invalidate = null;
    };
  }, [invalidate]);

  const [mode, setMode] = useState<CameraMode>('orbit');
  const modeRef = useRef<CameraMode>('orbit');

  const planeModeRef = useRef(planeMode);
  useEffect(() => {
    planeModeRef.current = planeMode;
  }, [planeMode]);

  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const prevWalkerId = useRef<string | null>(null);

  // OrbitControls ref
  const ctrlRef = useRef<OrbitControlsImpl>(null!);

  // Walk state
  const initialWalker = CHARACTERS.find(c => c.id === useSceneStore.getState().activeWalkerId) || CHARACTERS[0];
  const walkPos = useRef({ x: initialWalker.pos[0], y: initialWalker.height * EYE_RATIO, z: initialWalker.pos[2] });
  const walkYaw = useRef(initialWalker.rot);
  const walkPitch = useRef(0);
  const orbitYaw = useRef(initialWalker.rot);
  const orbitYawOffset = useRef(0); // Différentiel d'angle relatif au personnage
  const orbitPitch = useRef(DEFAULT_ORBIT_PITCH);
  const orbitDistance = useRef(DEFAULT_ORBIT_DISTANCE);
  const keys = useRef(new Set<string>());
  const dragging = useRef(false);
  const bobOffset = useRef({ y: 0, side: 0 });
  const bobPhase = useRef(0);
  const lastWalkerPos = useRef({ x: initialWalker.pos[0], z: initialWalker.pos[2] });
  const smoothedEyePos = useRef(new THREE.Vector3());
  const smoothedLookTarget = useRef(new THREE.Vector3());
  const smoothedUp = useRef(new THREE.Vector3(0, 1, 0));
  const hasInitialStabilizedPos = useRef(false);

  // Sauvegarde d'état perspective pour retour depuis top-down
  const savedPerspPos = useRef(new THREE.Vector3(...PERSP_POS));
  const savedPerspTarget = useRef(new THREE.Vector3(...PERSP_TARGET));
  const savedFov = useRef(50);
  const minimapThrottle = useRef(0);
  const topFollowRef = useRef(false);

  // Synchronisation du changement de personnage actif
  useEffect(() => {
    if (activeWalkerId !== prevWalkerId.current) {
      const config = CHARACTERS.find(c => c.id === activeWalkerId);
      if (config) {
        const savedPos = cameraState.positions[activeWalkerId];
        cameraState.walkerX = savedPos ? savedPos.x : config.pos[0];
        cameraState.walkerZ = savedPos ? savedPos.z : config.pos[2];
        cameraState.walkerYaw = savedPos ? savedPos.yaw : config.rot;
        cameraState.walkerHeight = config.height;

        walkPos.current.x = cameraState.walkerX;
        walkPos.current.z = cameraState.walkerZ;
        walkYaw.current = cameraState.walkerYaw;
        orbitYaw.current = cameraState.walkerYaw;
        walkPos.current.y = activeWalkH();

        lastWalkerPos.current.x = cameraState.walkerX;
        lastWalkerPos.current.z = cameraState.walkerZ;
        hasInitialStabilizedPos.current = false;

        invalidate();
      }
    }
    prevWalkerId.current = activeWalkerId;
  }, [activeWalkerId, invalidate]);

  const changeMode = useCallback((m: CameraMode) => {
    modeRef.current = m;
    cameraState.mode = m;
    setMode(m);

    // Auto-enable HD mirrors en FPV, disable en walk (3ème pers.) pour les performances
    const isMirrorsHD = useSceneStore.getState().layers.mirrorsHD;
    if (m === 'fpv' && !isMirrorsHD) {
      useSceneStore.getState().toggleLayer('mirrorsHD');
    } else if (m === 'walk' && isMirrorsHD) {
      useSceneStore.getState().toggleLayer('mirrorsHD');
    }
  }, []);

  const updateWalkLook = useCallback(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;

    const isFPV = modeRef.current === 'fpv';
    const isBobbingEnabled = useSceneStore.getState().layers.fpvHeadBobbing ?? false;

    // Calcul du déplacement réel pour cadencer le bobbing
    const dx = cameraState.walkerX - lastWalkerPos.current.x;
    const dz = cameraState.walkerZ - lastWalkerPos.current.z;
    const movedDist = Math.hypot(dx, dz);
    lastWalkerPos.current.x = cameraState.walkerX;
    lastWalkerPos.current.z = cameraState.walkerZ;

    if (isBobbingEnabled && movedDist > 0.05) {
      // Cadence proportionnelle à la foulée (~70 cm par cycle complet)
      bobPhase.current += movedDist * (Math.PI / 35);
      const targetBobY = Math.sin(bobPhase.current * 2) * 2.0;
      const targetBobSide = Math.cos(bobPhase.current) * 0.9;
      bobOffset.current.y += (targetBobY - bobOffset.current.y) * 0.3;
      bobOffset.current.side += (targetBobSide - bobOffset.current.side) * 0.3;
    } else {
      bobOffset.current.y += (0 - bobOffset.current.y) * 0.15;
      bobOffset.current.side += (0 - bobOffset.current.side) * 0.15;
    }

    if (isFPV) {
      const isRealisticEyes = (useSceneStore.getState().layers.fpvRealisticEyes ?? false) && !!cameraState.activeEyesPos && !!cameraState.activeHeadForward;

      if (isRealisticEyes && cameraState.activeEyesPos && cameraState.activeHeadForward) {
        const eyes = cameraState.activeEyesPos;
        const fwd = cameraState.activeHeadForward;
        const up = cameraState.activeHeadUp;

        // Petite avance de 2 cm dans la direction du regard pour éliminer tout risque de clipping avec les cils/nez
        const eyeX = eyes.x + fwd.x * 2.0;
        const eyeY = eyes.y + fwd.y * 2.0;
        const eyeZ = eyes.z + fwd.z * 2.0;

        const storeLayers = useSceneStore.getState().layers;
        const isStabilizationActive = storeLayers.fpvStabilization ?? true;
        const stabFactor = Math.max(0.0, Math.min(0.95, storeLayers.fpvStabilizationFactor ?? 0.7));

        const lookDist = 200;
        const targetEyeVec = _tmpEyeTargetVec.set(eyeX, eyeY, eyeZ);
        const targetLookVec = _tmpEyeLookVec;
        if (Math.abs(walkPitch.current) > 0.001) {
          const cosP = Math.cos(walkPitch.current);
          const sinP = Math.sin(walkPitch.current);
          targetLookVec.set(
            eyeX + fwd.x * cosP * lookDist,
            eyeY + (fwd.y * cosP + sinP) * lookDist,
            eyeZ + fwd.z * cosP * lookDist
          );
        } else {
          targetLookVec.set(
            eyeX + fwd.x * lookDist,
            eyeY + fwd.y * lookDist,
            eyeZ + fwd.z * lookDist
          );
        }

        const targetUpVec = _tmpEyeUpVec.set(up?.x ?? 0, up?.y ?? 1, up?.z ?? 0);

        // Détection de premier placement ou de téléportation brusque (> 100 cm)
        const distFromCurrent = smoothedEyePos.current.distanceTo(targetEyeVec);
        if (!hasInitialStabilizedPos.current || distFromCurrent > 100) {
          smoothedEyePos.current.copy(targetEyeVec);
          smoothedLookTarget.current.copy(targetLookVec);
          smoothedUp.current.copy(targetUpVec);
          hasInitialStabilizedPos.current = true;
        } else if (isStabilizationActive && stabFactor > 0.01) {
          // Facteur d'amorti progressif : atténue les saccades et secousses brusques de tête
          const lerpFactor = Math.max(0.04, 1.0 - stabFactor * 0.92);
          smoothedEyePos.current.lerp(targetEyeVec, lerpFactor);
          smoothedLookTarget.current.lerp(targetLookVec, lerpFactor);
          smoothedUp.current.lerp(targetUpVec, lerpFactor).normalize();
        } else {
          smoothedEyePos.current.copy(targetEyeVec);
          smoothedLookTarget.current.copy(targetLookVec);
          smoothedUp.current.copy(targetUpVec);
        }

        camera.position.copy(smoothedEyePos.current);
        ctrl.target.copy(smoothedLookTarget.current);
        camera.up.copy(smoothedUp.current);
        ctrl.update();
      } else {
        const cosP = Math.cos(walkPitch.current);
        const bobY = isBobbingEnabled ? bobOffset.current.y : 0;
        const bobSide = isBobbingEnabled ? bobOffset.current.side : 0;
        const sideX = Math.cos(walkYaw.current) * bobSide;
        const sideZ = -Math.sin(walkYaw.current) * bobSide;

        const targetX = walkPos.current.x + sideX;
        const targetY = walkPos.current.y + bobY;
        const targetZ = walkPos.current.z + sideZ;

        const lookDist = 200;
        ctrl.target.set(
          targetX + Math.sin(walkYaw.current) * cosP * lookDist,
          targetY + Math.sin(walkPitch.current) * lookDist,
          targetZ + Math.cos(walkYaw.current) * cosP * lookDist
        );
        camera.position.set(targetX, targetY, targetZ);
        camera.up.set(0, 1, 0);
        ctrl.update();
      }
    } else {
      // Mode 3ème Personne Intelligent & Cinématique (style Lara Croft / Tomb Raider)
      const bobY = isBobbingEnabled ? bobOffset.current.y * 0.5 : 0;
      const head = cameraState.activeHeadPos;
      const hips = cameraState.activeHipsPos;

      let targetX = walkPos.current.x;
      let targetY = walkPos.current.y * 0.75 + bobY;
      let targetZ = walkPos.current.z;

      if (head) {
        if (hips) {
          // Point focal dynamique : 65% tête, 35% torse/hanches (centrage anatomique naturel)
          // S'adapte instantanément et fluidement quand le perso est debout, assis, couché ou en mouvement
          targetX = head.x * 0.65 + hips.x * 0.35;
          targetY = (head.y * 0.65 + hips.y * 0.35) + bobY;
          targetZ = head.z * 0.65 + hips.z * 0.35;
        } else {
          const headOffsetY = Math.min(18, Math.max(5, (head.y / 160) * 18));
          targetX = head.x;
          targetY = Math.max(15, head.y - headOffsetY) + bobY;
          targetZ = head.z;
        }
      }

      if (cameraState.isDragging || keys.current.has('ArrowLeft') || keys.current.has('ArrowRight')) {
        let diff = orbitYaw.current - walkYaw.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        orbitYawOffset.current = diff;
      } else {
        const desiredYaw = walkYaw.current + orbitYawOffset.current;
        let diffYaw = desiredYaw - orbitYaw.current;
        while (diffYaw > Math.PI) diffYaw -= 2 * Math.PI;
        while (diffYaw < -Math.PI) diffYaw += 2 * Math.PI;
        orbitYaw.current += diffYaw * 0.08;
      }

      const dist = orbitDistance.current;
      const cosP = Math.cos(orbitPitch.current);
      const sinP = Math.sin(orbitPitch.current);

      const camX = targetX - Math.sin(orbitYaw.current) * cosP * dist;
      const camY = Math.max(15, targetY + sinP * dist);
      const camZ = targetZ - Math.cos(orbitYaw.current) * cosP * dist;

      // Détection de saut brusque / changement de pièce (> 350 cm)
      const distToTarget = Math.hypot(targetX - ctrl.target.x, targetZ - ctrl.target.z);
      const isSnap = distToTarget > 350;
      const lerpFactor = isSnap ? 1.0 : 0.15;

      ctrl.target.x += (targetX - ctrl.target.x) * lerpFactor;
      ctrl.target.y += (targetY - ctrl.target.y) * lerpFactor;
      ctrl.target.z += (targetZ - ctrl.target.z) * lerpFactor;

      camera.position.x += (camX - camera.position.x) * lerpFactor;
      camera.position.y += (camY - camera.position.y) * lerpFactor;
      camera.position.z += (camZ - camera.position.z) * lerpFactor;
      ctrl.update();
    }
  }, [camera]);

  const enterWalk = useCallback((x: number, z: number, walkMode: 'walk' | 'fpv' = 'walk') => {
    walkPos.current = { x, y: activeWalkH(), z };
    if (cameraState.walkYaw !== undefined) {
      walkYaw.current = cameraState.walkYaw;
    }
    if (walkMode === 'walk') {
      orbitYaw.current = walkYaw.current;
      orbitYawOffset.current = 0;
      orbitPitch.current = DEFAULT_ORBIT_PITCH;
      orbitDistance.current = DEFAULT_ORBIT_DISTANCE;

      const head = cameraState.activeHeadPos;
      const hips = cameraState.activeHipsPos;
      const targetX = head && hips ? head.x * 0.65 + hips.x * 0.35 : (head ? head.x : x);
      const targetY = head && hips ? head.y * 0.65 + hips.y * 0.35 : (head ? Math.max(15, head.y - 15) : walkPos.current.y * 0.75);
      const targetZ = head && hips ? head.z * 0.65 + hips.z * 0.35 : (head ? head.z : z);
      const dist = orbitDistance.current;
      const cosP = Math.cos(orbitPitch.current);
      const sinP = Math.sin(orbitPitch.current);
      const camX = targetX - Math.sin(orbitYaw.current) * cosP * dist;
      const camY = Math.max(15, targetY + sinP * dist);
      const camZ = targetZ - Math.cos(orbitYaw.current) * cosP * dist;

      camera.position.set(camX, camY, camZ);
      if (ctrlRef.current) {
        ctrlRef.current.target.set(targetX, targetY, targetZ);
        ctrlRef.current.update();
      }
    } else {
      walkPitch.current = 0;
    }

    const ctrl = ctrlRef.current;
    if (ctrl) {
      ctrl.enableRotate = false;
      ctrl.enablePan = false;
      ctrl.enableZoom = false;
    }

    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) savedFov.current = cam.fov;

    hasInitialStabilizedPos.current = false;
    changeMode(walkMode);
    invalidate();
  }, [camera, changeMode, invalidate]);

  const exitWalkMode = useCallback(() => {
    dragging.current = false;
    cameraState.isDragging = false;
    keys.current.clear();
    const ctrl = ctrlRef.current;
    if (ctrl) {
      ctrl.enableRotate = true;
      ctrl.enablePan = true;
      ctrl.enableZoom = true;
    }
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      cam.fov = savedFov.current;
      cam.updateProjectionMatrix();
    }
    hasInitialStabilizedPos.current = false;
    camera.up.set(0, 1, 0);
    changeMode('orbit');
    invalidate();
  }, [camera, changeMode, invalidate]);

  const enterTop = useCallback((follow = false) => {
    if (modeRef.current === 'walk' || modeRef.current === 'fpv') exitWalkMode();
    savedPerspPos.current.copy(camera.position);
    if (ctrlRef.current) savedPerspTarget.current.copy(ctrlRef.current.target);
    topFollowRef.current = follow;

    if (follow) {
      const targetX = cameraState.walkerX;
      const targetZ = cameraState.walkerZ;
      camera.position.set(targetX, 2000, targetZ);
      if (ctrlRef.current) {
        ctrlRef.current.target.set(targetX, 0, targetZ);
        ctrlRef.current.update();
      }
    } else {
      camera.position.set(CX, 2000, CZ);
      if (ctrlRef.current) {
        ctrlRef.current.target.set(CX, 0, CZ);
        ctrlRef.current.update();
      }
    }
    changeMode('top');
    invalidate();
  }, [camera, changeMode, exitWalkMode, invalidate]);

  const exitTop = useCallback(() => {
    topFollowRef.current = false;
    changeMode('orbit');
  }, [changeMode]);

  // Restauration de la caméra perspective en sortant du mode top
  useEffect(() => {
    if (mode === 'orbit' && ctrlRef.current) {
      camera.position.copy(savedPerspPos.current);
      ctrlRef.current.target.copy(savedPerspTarget.current);
      ctrlRef.current.update();
    }
  }, [mode, camera]);

  // Synchronisation du mode avec le store (une seule fois au changement d'état)
  useEffect(() => {
    useSceneStore.setState({ cameraMode: mode });
    if (mode !== 'top') {
      useSceneStore.getState().setMeasurementActive(false);
    }
  }, [mode]);

  // Initialisation walk look lors de l'entrée en mode walk / FPV
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      cam.near = 0.1;
      cam.updateProjectionMatrix();
    }

    if (mode === 'walk' || mode === 'fpv') {
      requestAnimationFrame(() => updateWalkLook());
    }
  }, [mode, camera, updateWalkLook]);

  // Événements pointeur (souris, touch, molette)
  useCameraPointerEvents({
    domElement: gl.domElement,
    camera,
    modeRef,
    orbitYaw,
    orbitPitch,
    orbitDistance,
    walkYaw,
    walkPitch,
    dragging,
    updateWalkLook,
    invalidate,
  });

  // Raccourcis clavier et événements personnalisés (minimap, views)
  useCameraShortcuts({
    camera,
    ctrlRef,
    modeRef,
    planeModeRef,
    topFollowRef,
    walkPos,
    keys,
    savedPerspPos,
    savedPerspTarget,
    enterWalk,
    exitWalkMode,
    enterTop,
    exitTop,
    invalidate,
  });

  // Boucle de rendu frame
  useCameraFrameUpdate({
    camera,
    ctrlRef,
    modeRef,
    planeModeRef,
    topFollowRef,
    activeWalkerId,
    walkPos,
    walkYaw,
    walkPitch,
    orbitYaw,
    orbitPitch,
    orbitDistance,
    keys,
    minimapThrottle,
    updateWalkLook,
    invalidate,
  });

  // Frustum caméra orthographique (vue dessus)
  const aspect = size.width / size.height;
  const viewH = 800;
  const viewW = viewH * aspect;

  return (
    <>
      {mode === 'top' && (
        <OrthographicCamera
          makeDefault
          position={topFollowRef.current ? [cameraState.walkerX, 2000, cameraState.walkerZ] : [CX, 2000, CZ]}
          up={[0, 0, -1]}
          left={-viewW / 2}
          right={viewW / 2}
          top={viewH / 2}
          bottom={-viewH / 2}
          near={1}
          far={5000}
        />
      )}

      <OrbitControls
        ref={ctrlRef}
        target={PERSP_TARGET}
        enableDamping={mode !== 'walk'}
        dampingFactor={0.08}
        maxPolarAngle={Math.PI}
        enabled={!planeMode}
        enableRotate={!planeMode && mode !== 'top'}
        screenSpacePanning={mode !== 'walk'}
        mouseButtons={
          mode === 'top'
            ? {
                LEFT: THREE.MOUSE.PAN,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.ROTATE,
              }
            : undefined
        }
      />
    </>
  );
}
