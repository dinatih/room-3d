import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMode, FollowPosition } from './types';
import {
  WALK_SPEED,
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
  useFrame((_, delta) => {
    if (cameraState.isXR) return;
    if (planeModeRef.current) return;
    if (cameraState.isIntroRunning) return;

    // Normalize to 60 fps baseline so speed is frame-rate independent
    const dt = Math.min(delta, 0.1) * 60;

    cameraState.camX = camera.position.x;
    cameraState.camZ = camera.position.z;
    if (cameraState.robinFPV && modeRef.current === 'fpv') {
      // Vue embarquée passive : ne pas transmettre les contrôles au personnage humain.
      cameraState.isFollowing = false;
      cameraState.isMoving = false;
      updateFollowLook();
      cameraState.onUpdate?.();
      invalidate();
      return;
    }
    cameraState.isFollowing = modeRef.current === 'follow' || modeRef.current === 'fpv';
    cameraState.isMoving = keys.current.has('ArrowUp') || keys.current.has('ArrowDown');

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
      x: cameraState.characterX,
      y: 0,
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
    if ((modeRef.current === 'orbit' || modeRef.current === 'top') && keys.current.size > 0) {
      const k = keys.current;
      const ctrl = ctrlRef.current;
      invalidate();

      // Plain arrows — move active character (uniquement hors grille de personnages)
      const isCharacterGridActive = useSceneStore.getState().layers.characterGrid;
      const isPlainMove = !isCharacterGridActive && (k.has('ArrowLeft') || k.has('ArrowRight') || k.has('ArrowUp') || k.has('ArrowDown'));
      if (isPlainMove) {
        cameraState.lastUserControlTime = performance.now();
      }

      if (!isCharacterGridActive) {
        if (k.has('ArrowLeft')) cameraState.followYaw += 0.03 * dt;
        if (k.has('ArrowRight')) cameraState.followYaw -= 0.03 * dt;
        const wYaw = cameraState.followYaw;
        const ws = WALK_SPEED * dt;

        let wdx = 0;
        let wdz = 0;
        if (k.has('ArrowUp')) {
          wdx += Math.sin(wYaw) * ws;
          wdz += Math.cos(wYaw) * ws;
        }
        if (k.has('ArrowDown')) {
          wdx -= Math.sin(wYaw) * ws;
          wdz -= Math.cos(wYaw) * ws;
        }
        if (wdx !== 0 || wdz !== 0) {
          cameraState.characterX += wdx;
          cameraState.characterZ += wdz;
          followPos.current.x = cameraState.characterX;
          followPos.current.z = cameraState.characterZ;
        }
      }

      if (ctrl) {
        // Shift+arrows — orbit (rotate camera around target)
        if (k.has('ShiftArrowLeft') || k.has('ShiftArrowRight') || k.has('ShiftArrowUp') || k.has('ShiftArrowDown')) {
          _tmpOffset.subVectors(camera.position, ctrl.target);
          _tmpSph.setFromVector3(_tmpOffset);
          if (k.has('ShiftArrowLeft')) _tmpSph.theta += 0.03 * dt;
          if (k.has('ShiftArrowRight')) _tmpSph.theta -= 0.03 * dt;
          if (k.has('ShiftArrowUp')) _tmpSph.phi -= 0.03 * dt;
          if (k.has('ShiftArrowDown')) _tmpSph.phi += 0.03 * dt;
          _tmpSph.makeSafe();
          camera.position.setFromSpherical(_tmpSph).add(ctrl.target);
          ctrl.update();
        }

        // Ctrl, Alt ou Shift+Ctrl+arrows — pan rapide (translate camera + target ensemble)
        const hasPan = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(
          a => k.has('Ctrl' + a) || k.has('Alt' + a) || k.has('ShiftCtrl' + a)
        );
        if (hasPan) {
          camera.getWorldDirection(_tmpCamDir);
          _tmpCamRight.set(-_tmpCamDir.z, 0, _tmpCamDir.x).normalize();
          const panStep = Math.max(3, ctrl.target.distanceTo(camera.position) * 0.015) * dt;
          _tmpPanDelta.set(0, 0, 0);
          const isPan = (a: string) => k.has('Ctrl' + a) || k.has('Alt' + a) || k.has('ShiftCtrl' + a);

          _tmpCamForward.copy(_tmpCamDir);
          _tmpCamForward.y = 0;
          _tmpCamForward.normalize();

          if (isPan('ArrowLeft')) _tmpPanDelta.addScaledVector(_tmpCamRight, -panStep);
          if (isPan('ArrowRight')) _tmpPanDelta.addScaledVector(_tmpCamRight, panStep);
          if (isPan('ArrowUp')) _tmpPanDelta.addScaledVector(_tmpCamForward, panStep);
          if (isPan('ArrowDown')) _tmpPanDelta.addScaledVector(_tmpCamForward, -panStep);

          camera.position.add(_tmpPanDelta);
          ctrl.target.add(_tmpPanDelta);
          ctrl.update();
        }

        // PageUp/PageDown — zoom (dolly le long de l'axe caméra→cible)
        if (k.has('PageUp') || k.has('PageDown')) {
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

    if (cameraState.isAIControlled) {
      followPos.current.x = cameraState.characterX;
      followPos.current.z = cameraState.characterZ;
      followYaw.current = cameraState.characterYaw;
    }

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
        if (k.has('ArrowLeft')) orbitYaw.current -= 0.03 * dt;
        if (k.has('ArrowRight')) orbitYaw.current += 0.03 * dt;

        // Ctrl+Haut / Bas : Zoom (rapprocher / éloigner la caméra)
        if (k.has('CtrlArrowUp')) orbitDistance.current = Math.max(30, orbitDistance.current - 4 * dt);
        if (k.has('CtrlArrowDown')) orbitDistance.current = orbitDistance.current + 4 * dt;

        // Haut / Bas simples : Inclinaison verticale (pitch)
        if (k.has('ArrowUp') && !k.has('CtrlArrowUp')) orbitPitch.current = Math.min(1.45, orbitPitch.current + 0.03 * dt);
        if (k.has('ArrowDown') && !k.has('CtrlArrowDown')) orbitPitch.current = Math.max(-0.6, orbitPitch.current - 0.03 * dt);

        if (k.has('AltArrowUp')) followPos.current.y += sp;
        if (k.has('AltArrowDown')) followPos.current.y -= sp;
      } else {
        // Mode FPV (1ère personne)
        const yaw = followYaw.current;
        const fwdX = Math.sin(yaw) * sp;
        const fwdZ = Math.cos(yaw) * sp;

        if (k.has('ArrowLeft')) followYaw.current += 0.03 * dt;
        if (k.has('ArrowRight')) followYaw.current -= 0.03 * dt;

        if (k.has('CtrlArrowUp')) followPitch.current = Math.min(1.4, followPitch.current + 0.02 * dt);
        if (k.has('CtrlArrowDown')) followPitch.current = Math.max(-1.4, followPitch.current - 0.02 * dt);

        if (k.has('AltArrowUp')) followPos.current.y += sp;
        if (k.has('AltArrowDown')) followPos.current.y -= sp;

        let dx = 0;
        let dz = 0;
        if (k.has('ArrowUp')) {
          dx += fwdX;
          dz += fwdZ;
        }
        if (k.has('ArrowDown')) {
          dx -= fwdX;
          dz -= fwdZ;
        }
        if (dx !== 0 || dz !== 0) {
          followPos.current.x += dx;
          followPos.current.z += dz;
        }
      }
    }

    updateFollowLook();
  });
}
