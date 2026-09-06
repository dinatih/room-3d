import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMode, WalkPosition } from './types';
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

interface UseCameraFrameUpdateParams {
  camera: THREE.Camera;
  ctrlRef: MutableRefObject<OrbitControlsImpl>;
  modeRef: MutableRefObject<CameraMode>;
  planeModeRef: MutableRefObject<boolean>;
  topFollowRef: MutableRefObject<boolean>;
  activeWalkerId: string;
  walkPos: MutableRefObject<WalkPosition>;
  walkYaw: MutableRefObject<number>;
  walkPitch: MutableRefObject<number>;
  orbitYaw: MutableRefObject<number>;
  orbitPitch: MutableRefObject<number>;
  orbitDistance: MutableRefObject<number>;
  keys: MutableRefObject<Set<string>>;
  minimapThrottle: MutableRefObject<number>;
  updateWalkLook: () => void;
  invalidate: () => void;
}

export function useCameraFrameUpdate({
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
}: UseCameraFrameUpdateParams) {
  useFrame((_, delta) => {
    if (cameraState.isXR) return;
    if (planeModeRef.current) return;

    // Normalize to 60 fps baseline so speed is frame-rate independent
    const dt = Math.min(delta, 0.1) * 60;

    cameraState.camX = camera.position.x;
    cameraState.camZ = camera.position.z;
    cameraState.isWalking = modeRef.current === 'walk' || modeRef.current === 'fpv';
    cameraState.isMoving =
      (modeRef.current === 'fpv' && (keys.current.has('ArrowUp') || keys.current.has('ArrowDown'))) ||
      (modeRef.current === 'orbit' && (keys.current.has('ArrowUp') || keys.current.has('ArrowDown')));

    if (cameraState.isWalking) {
      if (!cameraState.isAIControlled) {
        cameraState.walkYaw = walkYaw.current;
        cameraState.walkPitch = modeRef.current === 'walk' ? orbitPitch.current : walkPitch.current;
        cameraState.walkerX = walkPos.current.x;
        cameraState.walkerZ = walkPos.current.z;
      }
    } else {
      if (!cameraState.isAIControlled) {
        cameraState.walkerX = walkPos.current.x;
        cameraState.walkerZ = walkPos.current.z;
      }
    }

    // Sync walker yaw for minimap before onUpdate call
    cameraState.walkerYaw = cameraState.walkYaw;

    // Save active walker position
    cameraState.positions[activeWalkerId] = {
      x: cameraState.walkerX,
      y: 0,
      z: cameraState.walkerZ,
      yaw: cameraState.walkerYaw,
    };

    // Throttle minimap redraw à ~15fps (67ms) — drawFloorPlan est coûteux
    minimapThrottle.current += delta;
    if (minimapThrottle.current >= 0.067) {
      minimapThrottle.current = 0;
      cameraState.onUpdate?.();
    }

    // ── Orbit mode keyboard navigation (Google Earth style) ─────────────────────
    if (modeRef.current === 'orbit' && keys.current.size > 0) {
      const k = keys.current;
      const ctrl = ctrlRef.current;
      invalidate();

      // Plain arrows — move active walker
      const isPlainMove = k.has('ArrowLeft') || k.has('ArrowRight') || k.has('ArrowUp') || k.has('ArrowDown');
      if (isPlainMove) {
        cameraState.lastUserControlTime = performance.now();
      }

      if (k.has('ArrowLeft')) cameraState.walkYaw += 0.03 * dt;
      if (k.has('ArrowRight')) cameraState.walkYaw -= 0.03 * dt;
      const wYaw = cameraState.walkYaw;
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
        cameraState.walkerX += wdx;
        cameraState.walkerZ += wdz;
        walkPos.current.x = cameraState.walkerX;
        walkPos.current.z = cameraState.walkerZ;
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
      const targetX = cameraState.walkerX;
      const targetZ = cameraState.walkerZ;
      camera.position.x = targetX;
      camera.position.z = targetZ;
      if (ctrlRef.current) {
        ctrlRef.current.target.set(targetX, 0, targetZ);
        ctrlRef.current.update();
      }
      invalidate();
    }

    if (modeRef.current !== 'walk' && modeRef.current !== 'fpv') return;

    if (cameraState.isAIControlled) {
      walkPos.current.x = cameraState.walkerX;
      walkPos.current.z = cameraState.walkerZ;
      walkYaw.current = cameraState.walkerYaw;
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

      if (modeRef.current === 'walk') {
        // 3rd Person : Les touches fléchées orbitent la caméra autour du personnage
        if (k.has('ArrowLeft')) orbitYaw.current -= 0.03 * dt;
        if (k.has('ArrowRight')) orbitYaw.current += 0.03 * dt;

        // Ctrl+Haut / Bas : Zoom (rapprocher / éloigner la caméra)
        if (k.has('CtrlArrowUp')) orbitDistance.current = Math.max(30, orbitDistance.current - 4 * dt);
        if (k.has('CtrlArrowDown')) orbitDistance.current = orbitDistance.current + 4 * dt;

        // Haut / Bas simples : Inclinaison verticale (pitch)
        if (k.has('ArrowUp') && !k.has('CtrlArrowUp')) orbitPitch.current = Math.min(1.45, orbitPitch.current + 0.03 * dt);
        if (k.has('ArrowDown') && !k.has('CtrlArrowDown')) orbitPitch.current = Math.max(-0.6, orbitPitch.current - 0.03 * dt);

        if (k.has('AltArrowUp')) walkPos.current.y += sp;
        if (k.has('AltArrowDown')) walkPos.current.y -= sp;
      } else {
        // Mode FPV (1ère personne)
        const yaw = walkYaw.current;
        const fwdX = Math.sin(yaw) * sp;
        const fwdZ = Math.cos(yaw) * sp;

        if (k.has('ArrowLeft')) walkYaw.current += 0.03 * dt;
        if (k.has('ArrowRight')) walkYaw.current -= 0.03 * dt;

        if (k.has('CtrlArrowUp')) walkPitch.current = Math.min(1.4, walkPitch.current + 0.02 * dt);
        if (k.has('CtrlArrowDown')) walkPitch.current = Math.max(-1.4, walkPitch.current - 0.02 * dt);

        if (k.has('AltArrowUp')) walkPos.current.y += sp;
        if (k.has('AltArrowDown')) walkPos.current.y -= sp;

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
          walkPos.current.x += dx;
          walkPos.current.z += dz;
        }
      }
    }

    updateWalkLook();
  });
}
