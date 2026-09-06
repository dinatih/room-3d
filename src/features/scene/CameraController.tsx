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
  useCameraPointerEvents,
  useCameraShortcuts,
  useCameraFrameUpdate,
} from './camera';

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
  const orbitPitch = useRef(0.25);
  const orbitDistance = useRef(220);
  const keys = useRef(new Set<string>());
  const dragging = useRef(false);

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

    if (isFPV) {
      const cosP = Math.cos(walkPitch.current);
      const targetX = walkPos.current.x;
      const targetY = walkPos.current.y;
      const targetZ = walkPos.current.z;

      const lookDist = 200;
      ctrl.target.set(
        targetX + Math.sin(walkYaw.current) * cosP * lookDist,
        targetY + Math.sin(walkPitch.current) * lookDist,
        targetZ + Math.cos(walkYaw.current) * cosP * lookDist
      );
      camera.position.set(targetX, targetY, targetZ);
      ctrl.update();
    } else {
      // Mode 3ème Personne Intelligent & Cinématique
      const targetX = walkPos.current.x;
      const targetY = walkPos.current.y * 0.75;
      const targetZ = walkPos.current.z;

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

      const lerpFactor = 0.15;
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
    if (walkMode === 'walk') {
      orbitYaw.current = walkYaw.current;
      orbitYawOffset.current = 0;
      orbitPitch.current = 0.25;
      orbitDistance.current = 220;

      const targetX = x;
      const targetY = walkPos.current.y * 0.75;
      const targetZ = z;
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
