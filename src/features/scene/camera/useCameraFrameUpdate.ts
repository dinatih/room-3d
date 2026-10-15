import { useEffect, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMode, FollowPosition } from './types';
import {
  WALK_SPEED,
  ORBIT_CAMERA_LERP,
  _tmpOffset,
  _tmpSph,
  _tmpCamDir,
  _tmpCamRight,
  _tmpCamForward,
  _tmpPanDelta,
  _tmpDollyDir,
} from './cameraConstants';
import { cameraState } from '../cameraState';
import { useSceneStore } from '../store/useSceneStore';

interface UseCameraFrameUpdateParams {
  camera: THREE.Camera;
  ctrlRef: MutableRefObject<OrbitControlsImpl>;
  modeRef: MutableRefObject<CameraMode>;
  planeModeRef: MutableRefObject<boolean>;
  topFollowRef: MutableRefObject<boolean>;
  activeCharacterId: string;
  followPos: MutableRefObject<FollowPosition>;
  followYaw: MutableRefObject<number>;
  followPitch: MutableRefObject<number>;
  orbitYaw: MutableRefObject<number>;
  orbitPitch: MutableRefObject<number>;
  orbitDistance: MutableRefObject<number>;
  keys: MutableRefObject<Set<string>>;
  minimapThrottle: MutableRefObject<number>;
  updateFollowLook: () => void;
  invalidate: () => void;
}

export function useCameraFrameUpdate({
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
}: UseCameraFrameUpdateParams) {
  const keyboardOrbit = useRef<THREE.Vector3 | null>(null);
  useEffect(() => {
    const reset = () => { keyboardOrbit.current = null; };
    const controls = ctrlRef.current;
    controls?.addEventListener('start', reset);
    const events = ['camera-controls-release', 'camera-view', 'camera-mode', 'camera-arrow-control', 'camera-enter-top', 'camera-ortho-view', 'camera-zoom'];
    events.forEach(event => document.addEventListener(event, reset));
    const onKey = (event: KeyboardEvent) => { if (!event.key.startsWith('Arrow')) reset(); };
    window.addEventListener('keydown', onKey);
    const unsubscribe = useSceneStore.subscribe((state, previous) => {
      if (state.cameraMode !== previous.cameraMode || state.cameraTarget !== previous.cameraTarget || state.cameraProjection !== previous.cameraProjection) reset();
    });
    return () => {
      controls?.removeEventListener('start', reset);
      events.forEach(event => document.removeEventListener(event, reset));
      window.removeEventListener('keydown', onKey);
      unsubscribe();
    };
  }, [ctrlRef]);

  useFrame((_, delta) => {
    if (cameraState.isXR) return;
    if (planeModeRef.current) return;
    if (cameraState.isIntroRunning) return;

    // Normalize to 60 fps baseline so speed is frame-rate independent
    const dt = Math.min(delta, 0.1) * 60;

    cameraState.camX = camera.position.x;
    cameraState.camZ = camera.position.z;
    if (cameraState.animalTarget && (modeRef.current === 'fpv' || modeRef.current === 'follow')) {
      // Vue embarquée passive : ne pas transmettre les contrôles au personnage humain.
      cameraState.isFollowing = false;
      cameraState.isMoving = false;
      if (modeRef.current === 'follow') {
        const radius = cameraState.animalViews[cameraState.animalTarget]?.radius;
        if (radius && keys.current.has('CtrlArrowUp')) orbitDistance.current = Math.max(radius, orbitDistance.current - 4 * dt);
        if (keys.current.has('CtrlArrowDown')) orbitDistance.current += 4 * dt;
        if (keys.current.has('ArrowLeft')) orbitYaw.current -= 0.03 * dt;
        if (keys.current.has('ArrowRight')) orbitYaw.current += 0.03 * dt;
        if (keys.current.has('ArrowUp')) orbitPitch.current = Math.min(1.45, orbitPitch.current + 0.03 * dt);
        if (keys.current.has('ArrowDown')) orbitPitch.current = Math.max(-0.6, orbitPitch.current - 0.03 * dt);
      }
      updateFollowLook();
      cameraState.onUpdate?.();
      invalidate();
      return;
    }
    const store = useSceneStore.getState();
    const k = keys.current;
    const hasPlainArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(key => k.has(key));
    const movesCharacter = (modeRef.current === 'fpv' || store.arrowControl === 'character') && !store.layers.characterGrid && !cameraState.animalTarget;
    const manualMove = movesCharacter && hasPlainArrow;
    if (cameraState.isAIControlled) {
      followPos.current.x = cameraState.characterX;
      followPos.current.z = cameraState.characterZ;
      followYaw.current = cameraState.followYaw;
    }
    if (manualMove) {
      cameraState.lastUserControlTime = performance.now();
      if (k.has('ArrowLeft')) followYaw.current += 0.03 * dt;
      if (k.has('ArrowRight')) followYaw.current -= 0.03 * dt;
      const step = WALK_SPEED * dt * ((k.has('ArrowUp') ? 1 : 0) - (k.has('ArrowDown') ? 1 : 0));
      followPos.current.x += Math.sin(followYaw.current) * step;
      followPos.current.z += Math.cos(followYaw.current) * step;
      cameraState.followYaw = followYaw.current;
      cameraState.characterX = followPos.current.x;
      cameraState.characterZ = followPos.current.z;
      invalidate();
    }
    cameraState.isFollowing = modeRef.current === 'follow' || modeRef.current === 'fpv';
    cameraState.isMoving = movesCharacter && (k.has('ArrowUp') || k.has('ArrowDown'));

    if (cameraState.isFollowing) {
      if (!cameraState.isAIControlled) {
        cameraState.followYaw = followYaw.current;
        cameraState.followPitch = modeRef.current === 'follow' ? orbitPitch.current : followPitch.current;
        cameraState.characterX = followPos.current.x;
        cameraState.characterZ = followPos.current.z;
      }
    } else {
      if (!cameraState.isAIControlled) {
        cameraState.characterX = followPos.current.x;
        cameraState.characterZ = followPos.current.z;
      }
    }

    // Sync character yaw for minimap before onUpdate call
    cameraState.characterYaw = cameraState.followYaw;

    // Save active character position
    cameraState.positions[activeCharacterId] = {
      ...cameraState.positions[activeCharacterId],
      x: cameraState.characterX,
      y: cameraState.positions[activeCharacterId]?.y ?? 0,
      z: cameraState.characterZ,
      yaw: cameraState.characterYaw,
    };

    // Throttle minimap redraw à ~15fps (67ms) — drawFloorPlan est coûteux
    minimapThrottle.current += delta;
    if (minimapThrottle.current >= 0.067) {
      minimapThrottle.current = 0;
      cameraState.onUpdate?.();
    }

    // ── Orbit and Top mode keyboard navigation (Google Earth style) ─────────────
    if ((modeRef.current === 'orbit' || modeRef.current === 'top' || modeRef.current === 'ortho') && keys.current.size > 0) {
      const k = keys.current;
      const ctrl = ctrlRef.current;
      invalidate();

      if (ctrl) {
        const activeCamera = ctrl.object;
        const plainCamera = !movesCharacter && modeRef.current === 'orbit';
        const plainPan = !movesCharacter && (modeRef.current === 'top' || modeRef.current === 'ortho');
        // Shift+arrows — orbit (rotate camera around target)
        if ((plainCamera && hasPlainArrow) || k.has('ShiftArrowLeft') || k.has('ShiftArrowRight') || k.has('ShiftArrowUp') || k.has('ShiftArrowDown')) {
          const rotates = (key: string) => k.has('Shift' + key) || (plainCamera && k.has(key));
          if (!keyboardOrbit.current) keyboardOrbit.current = activeCamera.position.clone().sub(ctrl.target);
          _tmpOffset.copy(keyboardOrbit.current);
          _tmpSph.setFromVector3(_tmpOffset);
          if (rotates('ArrowLeft')) _tmpSph.theta -= 0.03 * dt;
          if (rotates('ArrowRight')) _tmpSph.theta += 0.03 * dt;
          if (rotates('ArrowUp')) _tmpSph.phi -= 0.03 * dt;
          if (rotates('ArrowDown')) _tmpSph.phi += 0.03 * dt;
          _tmpSph.makeSafe();
          keyboardOrbit.current.setFromSpherical(_tmpSph);
        }

        // Ctrl, Alt ou Shift+Ctrl+arrows — pan rapide (translate camera + target ensemble)
        const hasPan = (plainPan && hasPlainArrow) || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(
          a => k.has('Ctrl' + a) || k.has('Alt' + a) || k.has('ShiftCtrl' + a)
        );
        if (hasPan) {
          keyboardOrbit.current = null;
          if (plainPan && hasPlainArrow) topFollowRef.current = false;
          activeCamera.getWorldDirection(_tmpCamDir);
          if (plainPan) _tmpCamRight.setFromMatrixColumn(activeCamera.matrixWorld, 0);
          else _tmpCamRight.set(-_tmpCamDir.z, 0, _tmpCamDir.x).normalize();
          const panStep = Math.max(3, ctrl.target.distanceTo(activeCamera.position) * 0.015) * dt;
          _tmpPanDelta.set(0, 0, 0);
          const isPan = (a: string) => (plainPan && k.has(a)) || k.has('Ctrl' + a) || k.has('Alt' + a) || k.has('ShiftCtrl' + a);

          if (plainPan) _tmpCamForward.setFromMatrixColumn(activeCamera.matrixWorld, 1);
          else {
            _tmpCamForward.copy(_tmpCamDir);
            _tmpCamForward.y = 0;
            _tmpCamForward.normalize();
          }

          if (isPan('ArrowLeft')) _tmpPanDelta.addScaledVector(_tmpCamRight, -panStep);
          if (isPan('ArrowRight')) _tmpPanDelta.addScaledVector(_tmpCamRight, panStep);
          if (isPan('ArrowUp')) _tmpPanDelta.addScaledVector(_tmpCamForward, panStep);
          if (isPan('ArrowDown')) _tmpPanDelta.addScaledVector(_tmpCamForward, -panStep);

          activeCamera.position.add(_tmpPanDelta);
          ctrl.target.add(_tmpPanDelta);
          ctrl.update();
        }

        // PageUp/PageDown — zoom (dolly le long de l'axe caméra→cible)
        if (k.has('PageUp') || k.has('PageDown')) {
          keyboardOrbit.current = null;
          _tmpDollyDir.subVectors(ctrl.target, camera.position);
          const dist = _tmpDollyDir.length();
          _tmpDollyDir.normalize();
          const step = dist * 0.01 * dt;
          if (k.has('PageUp')) camera.position.addScaledVector(_tmpDollyDir, step);
          if (k.has('PageDown')) camera.position.addScaledVector(_tmpDollyDir, -step);
          ctrl.update();
        }
      }
    }

    if (keyboardOrbit.current && ctrlRef.current) {
      const ctrl = ctrlRef.current;
      _tmpOffset.copy(keyboardOrbit.current).add(ctrl.target);
      ctrl.object.position.lerp(_tmpOffset, ORBIT_CAMERA_LERP);
      ctrl.update();
      // Arrêter la boucle à la précision numérique de la position monde.
      if (ctrl.object.position.distanceToSquared(_tmpOffset) <= Number.EPSILON * Math.max(1, _tmpOffset.lengthSq())) {
        keyboardOrbit.current = null;
      } else invalidate();
    }

    if (modeRef.current === 'top' && topFollowRef.current) {
      const targetX = cameraState.characterX;
      const targetZ = cameraState.characterZ;
      const activeCam = ctrlRef.current?.object || camera;
      activeCam.position.x = targetX;
      activeCam.position.z = targetZ;
      if (ctrlRef.current) {
        ctrlRef.current.target.set(targetX, 0, targetZ);
        ctrlRef.current.update();
      }
      invalidate();
    }

    if (modeRef.current !== 'follow' && modeRef.current !== 'fpv') return;

    if (modeRef.current === 'follow' || modeRef.current === 'fpv') {
      invalidate();
    }

    if (keys.current.size > 0) {
      invalidate();
      const k = keys.current;
      if (modeRef.current === 'fpv') {
        const isArrowPress = k.has('ArrowUp') || k.has('ArrowDown') || k.has('ArrowLeft') || k.has('ArrowRight');
        if (isArrowPress) {
          cameraState.lastUserControlTime = performance.now();
        }
      }

      const sp = WALK_SPEED * dt;

      if (modeRef.current === 'follow') {
        // 3rd Person : Les touches fléchées orbitent la caméra autour du personnage
        if (!movesCharacter && k.has('ArrowLeft')) orbitYaw.current -= 0.03 * dt;
        if (!movesCharacter && k.has('ArrowRight')) orbitYaw.current += 0.03 * dt;

        // Ctrl+Haut / Bas : Zoom (rapprocher / éloigner la caméra)
        if (k.has('CtrlArrowUp')) orbitDistance.current = Math.max(30, orbitDistance.current - 4 * dt);
        if (k.has('CtrlArrowDown')) orbitDistance.current = orbitDistance.current + 4 * dt;

        // Haut / Bas simples : Inclinaison verticale (pitch)
        if (!movesCharacter && k.has('ArrowUp')) orbitPitch.current = Math.min(1.45, orbitPitch.current + 0.03 * dt);
        if (!movesCharacter && k.has('ArrowDown')) orbitPitch.current = Math.max(-0.6, orbitPitch.current - 0.03 * dt);

        if (k.has('AltArrowUp')) followPos.current.y += sp;
        if (k.has('AltArrowDown')) followPos.current.y -= sp;
      } else {
        // Mode FPV (1ère personne)
        if (k.has('CtrlArrowUp')) followPitch.current = Math.min(1.4, followPitch.current + 0.02 * dt);
        if (k.has('CtrlArrowDown')) followPitch.current = Math.max(-1.4, followPitch.current - 0.02 * dt);

        if (k.has('AltArrowUp')) followPos.current.y += sp;
        if (k.has('AltArrowDown')) followPos.current.y -= sp;
      }
    }

    updateFollowLook();
  });
}
