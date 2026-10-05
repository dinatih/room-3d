/**
 * CameraController.tsx
 *
 * Modes :
 *   orbit  — OrbitControls standard (défaut)
 *   follow — troisième personne intelligente avec lissage et suivi de cible
 *   fpv    — première personne vue subjective (niveau des yeux)
 *   top    — vue orthographique du dessus (centrée pièce ou suivi character)
 *
 * Raccourcis clavier :
 *   O          — vue perspective (reset) / orbit libre
 *   M          — basculer follow / fpv
 *   1 / 3      — vue FPV (1) / vue 3ème personne (3)
 *   T / Y      — vue 2D top pièce (T) / vue 2D top suivi perso (Y)
 *   L          — cycler les personnages actifs
 *   E          — basculer les personnages extra (5 aléatoires)
 *   Échap      — quitter follow mode / top-down
 *   Flèches    — déplacement follow / pan et rotation orbit
 */
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { cameraState } from './cameraState';
import { useSceneStore } from './store/useSceneStore';
import { CHARACTERS } from './characterConfig';
import { appLog } from '@features/ui/AppConsole';
import {
  type CameraMode,
  CX,
  CZ,
  EYE_RATIO,
  PERSP_POS,
  PERSP_TARGET,
  TOP_POS,
  TOP_TARGET,
  activeFollowH,
  DEFAULT_ORBIT_DISTANCE,
  DEFAULT_ORBIT_PITCH,
  parseUrlCameraMode,
  updateUrlCameraMode,
  useCameraPointerEvents,
  useCameraShortcuts,
  useCameraFrameUpdate,
  CameraIntroController,
  SKY_START_POS,
  SKY_START_TARGET,
} from './camera';
import { parseUrlLayerOverrides } from './store/layerUrlParams';

const FPV_DEFAULT_FOV = 100;
const FPV_DEFAULT_PITCH = -0.55; // ~ -12.6° sous l'horizon pour bien cadrer le torse et les bras des PNJ

const DEFAULT_MOUSE_BUTTONS = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN,
};

const _tmpEyeTargetVec = new THREE.Vector3();
const _tmpEyeLookVec = new THREE.Vector3();
const _tmpEyeUpVec = new THREE.Vector3();

export function CameraController({ planeMode = false }: { planeMode?: boolean } = {}) {
  const { camera, size, invalidate, gl, set } = useThree();

  // Enregistrement d'invalidate pour usage externe (Studio.tsx, etc.)
  useEffect(() => {
    cameraState.invalidate = invalidate;
    return () => {
      cameraState.invalidate = null;
    };
  }, [invalidate]);

  const initialMode = parseUrlCameraMode();
  const [mode, setMode] = useState<CameraMode>(() => initialMode);
  const modeRef = useRef<CameraMode>(initialMode);

  const cameraProjection = useSceneStore(state => state.cameraProjection);
  // Type d'orbite libre : perspective standard 3D ou isométrique orthographique 3D
  const orbitTypeRef = useRef<'persp' | 'ortho'>(useSceneStore.getState().cameraProjection);
  const defaultPerspCamRef = useRef<THREE.PerspectiveCamera>(camera as THREE.PerspectiveCamera);
  const orthoCamRef = useRef<THREE.OrthographicCamera>(null!);

  const planeModeRef = useRef(planeMode);
  useEffect(() => {
    planeModeRef.current = planeMode;
  }, [planeMode]);

  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const prevCharacterId = useRef<string | null>(null);

  // OrbitControls ref
  const ctrlRef = useRef<OrbitControlsImpl>(null!);

  // Follow state
  const initialCharacter = CHARACTERS.find(c => c.id === useSceneStore.getState().activeCharacterId) || CHARACTERS[0];
  const followPos = useRef({ x: initialCharacter.pos[0], y: initialCharacter.height * EYE_RATIO, z: initialCharacter.pos[2] });
  const followYaw = useRef(initialCharacter.rot);
  const followPitch = useRef(initialMode === 'fpv' ? FPV_DEFAULT_PITCH : 0);
  const orbitYaw = useRef(initialCharacter.rot);
  const orbitYawOffset = useRef(0); // Différentiel d'angle relatif au personnage
  const orbitPitch = useRef(DEFAULT_ORBIT_PITCH);
  const orbitDistance = useRef(DEFAULT_ORBIT_DISTANCE);
  const keys = useRef(new Set<string>());
  const dragging = useRef(false);
  const bobOffset = useRef({ y: 0, side: 0 });
  const bobPhase = useRef(0);
  const lastCharacterPos = useRef({ x: initialCharacter.pos[0], z: initialCharacter.pos[2] });
  const smoothedEyePos = useRef(new THREE.Vector3());
  const smoothedLookTarget = useRef(new THREE.Vector3());
  const smoothedUp = useRef(new THREE.Vector3(0, 1, 0));
  const hasInitialStabilizedPos = useRef(false);

  // Sauvegarde d'état perspective pour retour depuis top-down
  const savedPerspPos = useRef(new THREE.Vector3(...PERSP_POS));
  const savedPerspTarget = useRef(new THREE.Vector3(...PERSP_TARGET));
  const currentTarget = useRef(new THREE.Vector3(...PERSP_TARGET));
  const savedFov = useRef(50);
  const prevIsXR = useRef(cameraState.isXR);
  const minimapThrottle = useRef(0);
  const topFollowRef = useRef(false);
  const savedMirrorsRef = useRef(false);

  // Maintient le target d'OrbitControls synchronisé avec currentTarget lors du changement de caméra
  useLayoutEffect(() => {
    if (ctrlRef.current && modeRef.current === 'orbit') {
      ctrlRef.current.target.copy(currentTarget.current);
      ctrlRef.current.update();
    }
  }, [camera]);

  // Synchronisation du changement de personnage actif
  useEffect(() => {
    if (activeCharacterId !== prevCharacterId.current) {
      const config = CHARACTERS.find(c => c.id === activeCharacterId);
      if (config) {
        const savedPos = cameraState.positions[activeCharacterId];
        cameraState.characterX = savedPos ? savedPos.x : config.pos[0];
        cameraState.characterZ = savedPos ? savedPos.z : config.pos[2];
        cameraState.characterYaw = savedPos ? savedPos.yaw : config.rot;
        cameraState.characterHeight = config.height;

        followPos.current.x = cameraState.characterX;
        followPos.current.z = cameraState.characterZ;
        followYaw.current = cameraState.characterYaw;
        orbitYaw.current = cameraState.characterYaw;
        followPos.current.y = activeFollowH();

        lastCharacterPos.current.x = cameraState.characterX;
        lastCharacterPos.current.z = cameraState.characterZ;
        hasInitialStabilizedPos.current = false;

        invalidate();
      }
    }
    prevCharacterId.current = activeCharacterId;
  }, [activeCharacterId, invalidate]);

  const changeMode = useCallback((m: CameraMode) => {
    const prev = modeRef.current;
    modeRef.current = m;
    cameraState.mode = m;
    setMode(m);

    // Auto-enable HD mirrors en FPV, disable hors FPV (orbit, follow, top, ortho) pour les performances.
    // On bypass toggleLayer pour ne pas polluer l'URL avec mirrorsHD=1 (comportement automatique, pas un choix utilisateur).
    // On respecte uniquement un mirrorsHD=0 explicite dans l'URL pour forcer la désactivation.
    const urlLayerOverrides = parseUrlLayerOverrides();
    const isMirrorsHDExplicitlyOff = urlLayerOverrides.mirrorsHD === false;
    const isMirrorsHD = useSceneStore.getState().layers.mirrorsHD;
    if (m === 'fpv' && !isMirrorsHD && !isMirrorsHDExplicitlyOff) {
      useSceneStore.setState(state => ({
        layers: { ...state.layers, mirrorsHD: true },
      }));
      cameraState.mirrorsHD = true;
    } else if (m !== 'fpv' && isMirrorsHD && urlLayerOverrides.mirrorsHD !== true) {
      useSceneStore.setState(state => ({
        layers: { ...state.layers, mirrorsHD: false },
      }));
      cameraState.mirrorsHD = false;
    }

    // Vues Top (ortho) : Désactiver le calque Miroir dans les 2 Vues Top (pièce et suivi perso)
    const isMirrors = useSceneStore.getState().layers.mirrors;
    if (m === 'top' && prev !== 'top') {
      if (isMirrors) {
        savedMirrorsRef.current = true;
        useSceneStore.getState().toggleLayer('mirrors');
      }
    } else if (m !== 'top' && prev === 'top') {
      if (savedMirrorsRef.current && !useSceneStore.getState().layers.mirrors) {
        useSceneStore.getState().toggleLayer('mirrors');
      }
      savedMirrorsRef.current = false;
    }
  }, []);

  const updateFollowLook = useCallback(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;

    const isFPV = modeRef.current === 'fpv';
    const isBobbingEnabled = useSceneStore.getState().layers.fpvHeadBobbing ?? false;

    // Calcul du déplacement réel pour cadencer le bobbing
    const dx = cameraState.characterX - lastCharacterPos.current.x;
    const dz = cameraState.characterZ - lastCharacterPos.current.z;
    const movedDist = Math.hypot(dx, dz);
    lastCharacterPos.current.x = cameraState.characterX;
    lastCharacterPos.current.z = cameraState.characterZ;

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
      const isRealisticEyes = (useSceneStore.getState().layers.fpvRealisticEyes ?? true) && !!cameraState.activeEyesPos && !!cameraState.activeHeadForward;

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
        if (Math.abs(followPitch.current) > 0.001) {
          const cosP = Math.cos(followPitch.current);
          const sinP = Math.sin(followPitch.current);
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
        const cosP = Math.cos(followPitch.current);
        const bobY = isBobbingEnabled ? bobOffset.current.y : 0;
        const bobSide = isBobbingEnabled ? bobOffset.current.side : 0;
        const sideX = Math.cos(followYaw.current) * bobSide;
        const sideZ = -Math.sin(followYaw.current) * bobSide;

        const targetX = followPos.current.x + sideX;
        const targetY = followPos.current.y + bobY;
        const targetZ = followPos.current.z + sideZ;

        const lookDist = 200;
        ctrl.target.set(
          targetX + Math.sin(followYaw.current) * cosP * lookDist,
          targetY + Math.sin(followPitch.current) * lookDist,
          targetZ + Math.cos(followYaw.current) * cosP * lookDist
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

      let targetX = followPos.current.x;
      let targetY = followPos.current.y * 0.75 + bobY;
      let targetZ = followPos.current.z;

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
        let diff = orbitYaw.current - followYaw.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        orbitYawOffset.current = diff;
      } else {
        const desiredYaw = followYaw.current + orbitYawOffset.current;
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

      const activeCam = ctrl.object || camera;
      activeCam.position.x += (camX - activeCam.position.x) * lerpFactor;
      activeCam.position.y += (camY - activeCam.position.y) * lerpFactor;
      activeCam.position.z += (camZ - activeCam.position.z) * lerpFactor;

      if ('isOrthographicCamera' in activeCam && (activeCam as THREE.OrthographicCamera).isOrthographicCamera) {
        const ortho = activeCam as THREE.OrthographicCamera;
        const targetZoom = Math.max(0.1, Math.min(10, 800 / (2 * dist * Math.tan(THREE.MathUtils.degToRad(25)))));
        ortho.zoom += (targetZoom - ortho.zoom) * lerpFactor;
        ortho.updateProjectionMatrix();
      }
      ctrl.update();
    }
  }, [camera]);

  const enterFollow = useCallback((x: number, z: number, followMode: 'follow' | 'fpv' = 'follow') => {
    followPos.current = { x, y: activeFollowH(), z };
    if (cameraState.followYaw !== undefined) {
      followYaw.current = cameraState.followYaw;
    }
    if (followMode === 'follow') {
      orbitYaw.current = followYaw.current;
      orbitYawOffset.current = 0;
      orbitPitch.current = DEFAULT_ORBIT_PITCH;
      orbitDistance.current = DEFAULT_ORBIT_DISTANCE;

      const head = cameraState.activeHeadPos;
      const hips = cameraState.activeHipsPos;
      const targetX = head && hips ? head.x * 0.65 + hips.x * 0.35 : (head ? head.x : x);
      const targetY = head && hips ? head.y * 0.65 + hips.y * 0.35 : (head ? Math.max(15, head.y - 15) : followPos.current.y * 0.75);
      const targetZ = head && hips ? head.z * 0.65 + hips.z * 0.35 : (head ? head.z : z);
      const dist = orbitDistance.current;
      const cosP = Math.cos(orbitPitch.current);
      const sinP = Math.sin(orbitPitch.current);
      const camX = targetX - Math.sin(orbitYaw.current) * cosP * dist;
      const camY = Math.max(15, targetY + sinP * dist);
      const camZ = targetZ - Math.cos(orbitYaw.current) * cosP * dist;

      const proj = useSceneStore.getState().cameraProjection;
      const activeCam = (proj === 'ortho' && orthoCamRef.current) ? orthoCamRef.current : defaultPerspCamRef.current;
      activeCam.position.set(camX, camY, camZ);
      activeCam.up.set(0, 1, 0);
      if (proj === 'ortho' && orthoCamRef.current) {
        orthoCamRef.current.zoom = Math.max(0.1, Math.min(10, 800 / (2 * dist * Math.tan(THREE.MathUtils.degToRad(25)))));
        orthoCamRef.current.updateProjectionMatrix();
      }
      set({ camera: activeCam });
      if (ctrlRef.current) {
        ctrlRef.current.object = activeCam;
        ctrlRef.current.target.set(targetX, targetY, targetZ);
        ctrlRef.current.update();
      }
    } else {
      followPitch.current = FPV_DEFAULT_PITCH;
    }

    const ctrl = ctrlRef.current;
    if (ctrl) {
      ctrl.enableRotate = false;
      ctrl.enablePan = false;
      ctrl.enableZoom = false;
    }

    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      if (followMode === 'fpv') {
        if (modeRef.current !== 'fpv') {
          savedFov.current = cam.fov;
        }
        if (!cameraState.isXR) {
          cam.fov = FPV_DEFAULT_FOV;
          cam.updateProjectionMatrix();
        }
      } else {
        cam.fov = savedFov.current;
        cam.updateProjectionMatrix();
      }
    }

    hasInitialStabilizedPos.current = false;
    changeMode(followMode);
    invalidate();
  }, [camera, changeMode, invalidate]);

  const exitFollow = useCallback(() => {
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
      cam.near = 5;
      cam.updateProjectionMatrix();
    }
    hasInitialStabilizedPos.current = false;
    camera.up.set(0, 1, 0);
    changeMode('orbit');
    invalidate();
  }, [camera, changeMode, invalidate]);

  const switchOrbitProjection = useCallback((
    targetProj: 'persp' | 'ortho',
    options?: {
      pos?: [number, number, number];
      target?: [number, number, number];
      zoom?: number;
    }
  ) => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;

    const perspCam = defaultPerspCamRef.current;
    const orthoCam = orthoCamRef.current;
    if (!perspCam || !orthoCam) return;

    const fov = perspCam.fov ?? 50;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(fov / 2));

    const isOrtho = targetProj === 'ortho';
    const activeCam = isOrtho ? orthoCam : perspCam;
    const fromCam = ctrl.object || camera;

    if (options?.target) {
      currentTarget.current.set(...options.target);
    } else if (ctrl.target.lengthSq() > 1) {
      currentTarget.current.copy(ctrl.target);
    }
    const target = currentTarget.current;

    const dir = new THREE.Vector3().subVectors(fromCam.position, target);
    const dist = Math.max(10, dir.length());
    dir.normalize();
    if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);

    if (isOrtho) {
      if (options?.pos) {
        orthoCam.position.set(...options.pos);
        const pDist = Math.max(10, orthoCam.position.distanceTo(target));
        orthoCam.zoom = options.zoom ?? Math.max(0.05, Math.min(30, 800 / (2 * pDist * tanHalfFov)));
      } else {
        orthoCam.position.copy(target).addScaledVector(dir, Math.max(dist, 2500));
        orthoCam.zoom = options?.zoom ?? Math.max(0.05, Math.min(30, 800 / (2 * dist * tanHalfFov)));
      }
      orthoCam.near = -20000;
      orthoCam.far = 50000;
    } else {
      if (options?.pos) {
        perspCam.position.set(...options.pos);
      } else {
        const curOrthoZoom = (fromCam as THREE.OrthographicCamera).zoom || orthoCam.zoom || 1;
        const equivalentDist = Math.max(20, Math.min(8000, 800 / (2 * curOrthoZoom * tanHalfFov)));
        perspCam.position.copy(target).addScaledVector(dir, equivalentDist);
      }
    }

    activeCam.up.set(0, 1, 0);
    activeCam.lookAt(target);
    activeCam.updateProjectionMatrix();

    set({ camera: activeCam });
    ctrl.object = activeCam;
    ctrl.target.copy(target);

    const offset = new THREE.Vector3().subVectors(activeCam.position, target);
    if ((ctrl as any).spherical) (ctrl as any).spherical.setFromVector3(offset);
    if ((ctrl as any).sphericalDelta) (ctrl as any).sphericalDelta.set(0, 0, 0);
    if ((ctrl as any).panOffset) (ctrl as any).panOffset.set(0, 0, 0);
    (ctrl as any).scale = 1;
    ctrl.mouseButtons = DEFAULT_MOUSE_BUTTONS;
    ctrl.enableRotate = true;
    ctrl.enablePan = true;
    ctrl.enableZoom = true;
    ctrl.update();

    orbitTypeRef.current = targetProj;
    if (useSceneStore.getState().cameraProjection !== targetProj) {
      useSceneStore.getState().setCameraProjection(targetProj);
    }
    appLog('system', isOrtho ? '🎥 Mode Orbit 3D (Isométrique Ortho)' : '🎥 Mode Orbit 3D (Perspective)');
    invalidate();
  }, [camera, invalidate, set]);

  // Réinitialiser la vue preset active dès que l'utilisateur commence à manipuler la caméra manuellement
  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    const onStart = () => {
      if (modeRef.current === 'orbit' && useSceneStore.getState().activeCameraView) {
        useSceneStore.getState().setActiveCameraView(null);
      }
    };
    ctrl.addEventListener('start', onStart);
    return () => {
      ctrl.removeEventListener('start', onStart);
    };
  }, []);

  const toggleOrbitType = useCallback((
    targetType?: 'persp' | 'ortho',
    options?: {
      pos?: [number, number, number];
      target?: [number, number, number];
      zoom?: number;
    }
  ) => {
    const nextType = targetType ?? (useSceneStore.getState().cameraProjection === 'persp' ? 'ortho' : 'persp');
    switchOrbitProjection(nextType, options);
  }, [switchOrbitProjection]);

  const applyTopCamera = useCallback((targetX: number, targetZ: number, proj: 'persp' | 'ortho') => {
    const isOrtho = proj === 'ortho';
    const activeCam = (isOrtho && orthoCamRef.current) ? orthoCamRef.current : defaultPerspCamRef.current;
    if (!activeCam) return;

    if (isOrtho && orthoCamRef.current) {
      orthoCamRef.current.position.set(targetX, 2000, targetZ);
      orthoCamRef.current.zoom = 1;
      orthoCamRef.current.near = -20000;
      orthoCamRef.current.far = 50000;
    } else if (defaultPerspCamRef.current) {
      defaultPerspCamRef.current.position.set(targetX, 850, targetZ);
    }
    activeCam.up.set(0, 0, -1);
    activeCam.lookAt(targetX, 0, targetZ);
    activeCam.updateProjectionMatrix();

    set({ camera: activeCam });
    if (ctrlRef.current) {
      ctrlRef.current.object = activeCam;
      ctrlRef.current.target.set(targetX, 0, targetZ);
      ctrlRef.current.update();
    }
  }, [set]);

  // Synchronisation réactive de la projection de caméra (Perspective <-> Ortho)
  useEffect(() => {
    if (orbitTypeRef.current === cameraProjection) return;
    orbitTypeRef.current = cameraProjection;

    if (modeRef.current === 'orbit') {
      switchOrbitProjection(cameraProjection);
    } else if (modeRef.current === 'top') {
      const targetX = topFollowRef.current ? cameraState.characterX : CX;
      const targetZ = topFollowRef.current ? cameraState.characterZ : CZ;
      applyTopCamera(targetX, targetZ, cameraProjection);
      appLog('system', cameraProjection === 'ortho' ? '🎥 Mode Top (Ortho 2D)' : '🎥 Mode Top (Perspective 3D)');
      invalidate();
    } else if (modeRef.current === 'follow') {
      const ctrl = ctrlRef.current;
      const activeCam = (cameraProjection === 'ortho' && orthoCamRef.current) ? orthoCamRef.current : defaultPerspCamRef.current;
      if (ctrl && activeCam) {
        set({ camera: activeCam });
        ctrl.object = activeCam;
      }
      updateFollowLook();
      invalidate();
    }
  }, [applyTopCamera, cameraProjection, invalidate, set, switchOrbitProjection, updateFollowLook]);

  const enterTop = useCallback((follow = false) => {
    if (modeRef.current === 'follow' || modeRef.current === 'fpv') exitFollow();
    if (modeRef.current !== 'top') {
      savedPerspPos.current.copy(ctrlRef.current?.object.position || camera.position);
      if (ctrlRef.current) savedPerspTarget.current.copy(ctrlRef.current.target);
    }
    topFollowRef.current = follow;
    const targetX = follow ? cameraState.characterX : CX;
    const targetZ = follow ? cameraState.characterZ : CZ;
    applyTopCamera(targetX, targetZ, useSceneStore.getState().cameraProjection);
    useSceneStore.getState().setActiveCameraView('top');
    changeMode('top');
    invalidate();
  }, [applyTopCamera, camera.position, changeMode, exitFollow, invalidate]);

  const exitTop = useCallback(() => {
    topFollowRef.current = false;
    const proj = useSceneStore.getState().cameraProjection;
    orbitTypeRef.current = proj;
    const activeCam = (proj === 'ortho' && orthoCamRef.current) ? orthoCamRef.current : defaultPerspCamRef.current;
    if (activeCam) {
      activeCam.position.copy(savedPerspPos.current);
      activeCam.up.set(0, 1, 0);
      activeCam.updateProjectionMatrix();
      set({ camera: activeCam });
      if (ctrlRef.current) {
        ctrlRef.current.object = activeCam;
        ctrlRef.current.target.copy(savedPerspTarget.current);
        ctrlRef.current.mouseButtons = DEFAULT_MOUSE_BUTTONS;
        ctrlRef.current.enableRotate = true;
        ctrlRef.current.enablePan = true;
        ctrlRef.current.enableZoom = true;
        ctrlRef.current.update();
      }
    }
    useSceneStore.getState().setActiveCameraView(null);
    changeMode('orbit');
    appLog('system', proj === 'ortho' ? '🎥 Mode Orbit 3D (Isométrique Ortho)' : '🎥 Mode Orbit 3D (Perspective)');
    invalidate();
  }, [changeMode, invalidate, set]);

  const [orthoConfig, setOrthoConfig] = useState<{
    pos: [number, number, number];
    target: [number, number, number];
    up: [number, number, number];
    viewH: number;
  }>({
    pos: [CX, 700, 1500],
    target: [CX, 700, CZ],
    up: [0, 1, 0],
    viewH: 800,
  });

  const enterOrtho = useCallback((config: {
    pos: [number, number, number];
    target: [number, number, number];
    up: [number, number, number];
    viewH: number;
  }) => {
    if (modeRef.current === 'follow' || modeRef.current === 'fpv') exitFollow();
    if (modeRef.current === 'top') exitTop();
    if (modeRef.current !== 'ortho') {
      savedPerspPos.current.copy(camera.position);
      if (ctrlRef.current) savedPerspTarget.current.copy(ctrlRef.current.target);
    }
    setOrthoConfig(config);
    changeMode('ortho');

    requestAnimationFrame(() => {
      const activeCam = ctrlRef.current?.object || camera;
      activeCam.position.set(...config.pos);
      activeCam.up.set(...config.up);
      if ('zoom' in activeCam) {
        (activeCam as THREE.OrthographicCamera).zoom = 1;
      }
      activeCam.lookAt(...config.target);
      activeCam.updateProjectionMatrix();
      if (ctrlRef.current) {
        ctrlRef.current.target.set(...config.target);
        ctrlRef.current.update();
      }
      invalidate();
    });
  }, [camera, changeMode, exitTop, exitFollow, invalidate]);

  const exitOrtho = useCallback(() => {
    changeMode('orbit');
  }, [changeMode]);

  // Synchronisation de la caméra orthographique et du target OrbitControls dès l'activation
  useEffect(() => {
    if (mode === 'ortho' && ctrlRef.current) {
      const activeCam = ctrlRef.current.object || camera;
      activeCam.position.set(...orthoConfig.pos);
      activeCam.up.set(...orthoConfig.up);
      if ('zoom' in activeCam) {
        (activeCam as THREE.OrthographicCamera).zoom = 1;
      }
      activeCam.lookAt(...orthoConfig.target);
      activeCam.updateProjectionMatrix();
      ctrlRef.current.target.set(...orthoConfig.target);
      ctrlRef.current.update();
      invalidate();
    }
  }, [mode, orthoConfig, camera, invalidate]);

  // Synchronisation du mode avec le store et l'URL (une seule fois au changement d'état)
  useEffect(() => {
    useSceneStore.setState({ cameraMode: mode });
    updateUrlCameraMode(mode);
    if (mode !== 'top') {
      useSceneStore.getState().setMeasurementActive(false);
    }
  }, [mode]);

  // Initialisation follow look et ajustement du near plane selon le mode
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      cam.near = (mode === 'follow' || mode === 'fpv') ? 0.1 : 5;
      cam.updateProjectionMatrix();
    }

    if (mode === 'follow' || mode === 'fpv') {
      requestAnimationFrame(() => updateFollowLook());
    }
  }, [mode, camera, updateFollowLook]);

  // Contrôleur de transition d'introduction
  const introCtrlRef = useRef<CameraIntroController | null>(null);
  const [isIntroRunningState, setIsIntroRunningState] = useState(false);

  // Positionnement initial dans le ciel avant le lancement effectif
  useEffect(() => {
    if (!cameraState.isSceneLaunched) {
      camera.position.copy(SKY_START_POS);
      if (ctrlRef.current) {
        ctrlRef.current.target.copy(SKY_START_TARGET);
        ctrlRef.current.update();
      }
    }
  }, [camera]);

  // Lancement automatique du mode initial depuis les paramètres d'URL (ex: ?fpv ou ?mode=fpv)
  const initialModeLaunchedRef = useRef(false);
  useEffect(() => {
    if (initialModeLaunchedRef.current) return;
    initialModeLaunchedRef.current = true;

    const startMode = parseUrlCameraMode();
    if (cameraState.isSceneLaunched) {
      if (startMode === 'fpv') {
        const curX = cameraState.characterX ?? followPos.current.x;
        const curZ = cameraState.characterZ ?? followPos.current.z;
        enterFollow(curX, curZ, 'fpv');
        appLog('system', '🎥 Mode FPV (1ère personne) initialisé via URL');
      } else if (startMode === 'follow') {
        const curX = cameraState.characterX ?? followPos.current.x;
        const curZ = cameraState.characterZ ?? followPos.current.z;
        enterFollow(curX, curZ, 'follow');
        appLog('system', '🎥 Mode Follow (3ème personne) initialisé via URL');
      } else if (startMode === 'top') {
        enterTop(false);
        appLog('system', '🎥 Mode 2D Top initialisé via URL');
      }
    } else {
      if (startMode !== 'orbit') {
        changeMode(startMode);
      }
    }
  }, [enterTop, enterFollow, changeMode]);

  // Écoute de l'événement de lancement pour démarrer l'animation d'intro
  useEffect(() => {
    const onStartIntro = () => {
      if (!ctrlRef.current) return;
      if (!introCtrlRef.current) {
        introCtrlRef.current = new CameraIntroController(camera, ctrlRef.current);
      }
      setIsIntroRunningState(true);
      const targetMode = modeRef.current;
      introCtrlRef.current.start(targetMode, () => {
        setIsIntroRunningState(false);
        cameraState.isSceneLaunched = true;
        const curX = cameraState.characterX ?? followPos.current.x;
        const curZ = cameraState.characterZ ?? followPos.current.z;
        if (targetMode === 'fpv') {
          enterFollow(curX, curZ, 'fpv');
          appLog('system', '🎥 Mode FPV (1ère personne) initialisé');
        } else if (targetMode === 'follow') {
          enterFollow(curX, curZ, 'follow');
          appLog('system', '🎥 Mode Follow (3ème personne) initialisé');
        } else if (targetMode === 'top') {
          enterTop(false);
          appLog('system', '🎥 Mode 2D Top initialisé');
        } else if (targetMode === 'orbit') {
          camera.position.set(...PERSP_POS);
          ctrlRef.current.target.set(...PERSP_TARGET);
          ctrlRef.current.enabled = !planeModeRef.current;
          ctrlRef.current.enableRotate = !planeModeRef.current;
          ctrlRef.current.enablePan = !planeModeRef.current;
          ctrlRef.current.enableZoom = !planeModeRef.current;
          ctrlRef.current.update();
        }
        invalidate();
      });
    };

    document.addEventListener('start-camera-intro', onStartIntro);
    return () => {
      document.removeEventListener('start-camera-intro', onStartIntro);
      introCtrlRef.current?.destroy();
    };
  }, [camera, enterTop, enterFollow, invalidate]);

  // Synchronisation du FOV lors de l'entrée/sortie du mode VR / Immersif et suivi du target orbit
  useFrame(() => {
    if (cameraState.isIntroRunning) return;
    if (modeRef.current === 'orbit' && ctrlRef.current) {
      if (ctrlRef.current.target.lengthSq() > 1) {
        currentTarget.current.copy(ctrlRef.current.target);
      }
    }
    if (prevIsXR.current !== cameraState.isXR) {
      prevIsXR.current = cameraState.isXR;
      const cam = camera as THREE.PerspectiveCamera;
      if (cam.isPerspectiveCamera) {
        if (cameraState.isXR) {
          cam.fov = savedFov.current;
        } else if (modeRef.current === 'fpv') {
          cam.fov = FPV_DEFAULT_FOV;
        }
        cam.updateProjectionMatrix();
        invalidate();
      }
    }
  });

  // Événements pointeur (souris, touch, molette)
  useCameraPointerEvents({
    domElement: gl.domElement,
    camera,
    modeRef,
    orbitYaw,
    orbitPitch,
    orbitDistance,
    followYaw,
    followPitch,
    dragging,
    updateFollowLook,
    invalidate,
  });

  // Raccourcis clavier et événements personnalisés (minimap, views)
  useCameraShortcuts({
    camera,
    ctrlRef,
    modeRef,
    planeModeRef,
    topFollowRef,
    followPos,
    keys,
    savedPerspPos,
    savedPerspTarget,
    changeMode,
    enterFollow,
    exitFollow,
    enterTop,
    exitTop,
    toggleOrbitType,
    enterOrtho,
    exitOrtho,
    invalidate,
  });

  // Boucle de rendu frame
  useCameraFrameUpdate({
    camera,
    ctrlRef,
    modeRef,
    planeModeRef,
    topFollowRef,
    activeCharacterId,
    followPos,
    followYaw,
    followPitch,
    orbitYaw,
    orbitPitch,
    orbitDistance,
    keys,
    minimapThrottle,
    updateFollowLook,
    invalidate,
  });

  // Frustum caméra orthographique (vue dessus)
  const aspect = size.width / size.height;
  const viewH = 800;
  const viewW = viewH * aspect;

  // Frustum caméra orthographique (grille Lara)
  const orthoViewH = orthoConfig.viewH;
  const orthoViewW = orthoViewH * aspect;

  return (
    <>
      <OrthographicCamera
        ref={orthoCamRef}
        makeDefault={cameraProjection === 'ortho' && mode !== 'ortho'}
        position={mode === 'top' ? (topFollowRef.current ? [cameraState.characterX, 2000, cameraState.characterZ] : TOP_POS) : undefined}
        up={mode === 'top' ? [0, 0, -1] : [0, 1, 0]}
        left={-viewW / 2}
        right={viewW / 2}
        top={viewH / 2}
        bottom={-viewH / 2}
        near={-20000}
        far={50000}
      />

      {mode === 'ortho' && (
        <OrthographicCamera
          makeDefault
          position={orthoConfig.pos}
          up={orthoConfig.up}
          left={-orthoViewW / 2}
          right={orthoViewW / 2}
          top={orthoViewH / 2}
          bottom={-orthoViewH / 2}
          near={-20000}
          far={50000}
          onUpdate={(self) => {
            self.position.set(...orthoConfig.pos);
            self.up.set(...orthoConfig.up);
            self.lookAt(...orthoConfig.target);
            self.updateProjectionMatrix();
          }}
        />
      )}

      <OrbitControls
        ref={ctrlRef}
        target={
          mode === 'ortho'
            ? orthoConfig.target
            : mode === 'top'
              ? (topFollowRef.current ? undefined : TOP_TARGET)
              : undefined
        }
        enableDamping={mode !== 'follow'}
        dampingFactor={0.08}
        maxPolarAngle={Math.PI}
        enabled={!planeMode && !isIntroRunningState && mode !== 'follow' && mode !== 'fpv'}
        enableRotate={!planeMode && !isIntroRunningState && mode !== 'follow' && mode !== 'fpv'}
        enablePan={!planeMode && !isIntroRunningState && mode !== 'follow' && mode !== 'fpv'}
        enableZoom={!planeMode && !isIntroRunningState && mode !== 'follow' && mode !== 'fpv'}
        screenSpacePanning={mode !== 'follow'}
        mouseButtons={DEFAULT_MOUSE_BUTTONS}
      />
    </>
  );
}
