/**
 * ImmersiveMode.tsx — Mode plein écran monoscope (un seul œil).
 * Complémentaire au mode WebXR/Cardboard de VRMode.tsx.
 *
 * Mobile  : plein écran + gyroscope (DeviceOrientation) + touch hold → avancer
 * Desktop : plein écran + pointer lock mouse look + WASD
 *
 * Utilise cameraState.isXR pour suspendre CameraController.
 */
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraState } from './cameraState';

import { ROOM_W, ROOM_D } from '@config';

const WALK_HEAD_OFFSET = 10;
const WALK_SPEED       = 2;

function activeWalkH(): number {
  const h = cameraState.walkerHeight;
  return h + WALK_HEAD_OFFSET;
}

// Portrait → caméra regarde vers l'écran (même transform que DeviceOrientationControls)
const Q_SCREEN = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

export function ImmersiveMode() {
  const { camera, gl, invalidate } = useThree();

  const active  = useRef(false);
  const walking = useRef(false);
  const pos     = useRef(new THREE.Vector3(ROOM_W / 2, activeWalkH(), ROOM_D / 2));
  const orient  = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const alphaOffset = useRef<number | null>(null);

  useEffect(() => {
    // Desktop : rien à faire
    if (!('ontouchstart' in window)) return;

    // ── Shared Container ───────────────────────────────────────────────────────
    let container = document.getElementById('vr-immersive-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vr-immersive-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)',
        left: '12px',
        zIndex: '110',
        display: 'flex',
        gap: '8px',
        pointerEvents: 'none',
      });
      document.body.appendChild(container);
    }

    // ── Bouton ─────────────────────────────────────────────────────────────────
    const btn = document.createElement('button');
    btn.textContent = '👁 Immersif';
    Object.assign(btn.style, {
      background: 'rgba(255, 255, 255, 0.74)',
      color: '#212529',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontSize: '13px',
      cursor: 'pointer',
      fontFamily: 'sans-serif',
      backdropFilter: 'blur(14px)',
      webkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      pointerEvents: 'auto',
    });
    container.appendChild(btn);

    // ── DeviceOrientation ──────────────────────────────────────────────────────
    const onOrient = (e: DeviceOrientationEvent) => {
      if (!active.current) return;
      if (alphaOffset.current === null && e.alpha !== null) {
        // On the very first event, we calculate the offset so that the device faces X=0 (Wall A, Mirror)
        // Face X=0 means Y-rotation of +90 degrees.
        alphaOffset.current = e.alpha - 90;
      }
      orient.current = {
        alpha: e.alpha ?? 0,
        beta:  e.beta  ?? 0,
        gamma: e.gamma ?? 0,
      };
      invalidate();
    };

    // ── Touch hold (1 doigt ou clic) → avancer | 2 doigts → pivoter ──────────────────
    let touchStartX = 0;
    let initialAlphaOffset = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (!active.current) return;
      if (e.touches.length === 2) {
        walking.current = false;
        touchStartX = e.touches[0].clientX;
        initialAlphaOffset = alphaOffset.current || 0;
      } else if (e.touches.length === 1) {
        walking.current = true;
        invalidate();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current) return;
      if (e.touches.length === 2) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const sensitivity = 0.5; // 1px = 0.5 degré
        alphaOffset.current = initialAlphaOffset + (deltaX * sensitivity);
        invalidate();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active.current) return;
      if (e.touches.length === 0 || e.touches.length < 2) {
        walking.current = false;
        invalidate();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!active.current) return;
      if (e.button === 0) {
        walking.current = true;
        invalidate();
      }
    };

    const onPointerUp = () => {
      if (!active.current) return;
      walking.current = false;
      invalidate();
    };

    // ── Fullscreen quitté depuis navigateur ────────────────────────────────────
    const onFsChange = () => {
      if (!document.fullscreenElement && active.current) exit();
    };

    // ── Enter ──────────────────────────────────────────────────────────────────
    async function enter() {
      active.current   = true;
      cameraState.isXR = true;
      const startX = Number.isFinite(cameraState.walkerX) ? cameraState.walkerX : ROOM_W / 2;
      const startZ = Number.isFinite(cameraState.walkerZ) ? cameraState.walkerZ : ROOM_D / 2;
      pos.current.set(startX, activeWalkH(), startZ);
      orient.current   = null;
      alphaOffset.current = null;
      btn.textContent  = '✕ Quitter';

      try {
        await (gl.domElement.parentElement ?? document.documentElement).requestFullscreen();
      } catch { /* non supporté */ }

      // iOS 13+ : permission gyroscope
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const state = await (DeviceOrientationEvent as any).requestPermission();
          if (state === 'granted') window.addEventListener('deviceorientation', onOrient);
        } catch { /* refusé */ }
      } else {
        window.addEventListener('deviceorientation', onOrient);
      }

      invalidate();
    }

    // ── Exit ───────────────────────────────────────────────────────────────────
    function exit() {
      active.current   = false;
      walking.current  = false;
      cameraState.isXR = false;
      orient.current   = null;
      alphaOffset.current = null;
      btn.textContent  = '👁 Immersif';

      window.removeEventListener('deviceorientation', onOrient);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      invalidate();
    }

    btn.addEventListener('click', () => { active.current ? exit() : enter(); });

    gl.domElement.addEventListener('touchstart',  onTouchStart, { passive: true });
    gl.domElement.addEventListener('touchmove',   onTouchMove,  { passive: true });
    window.addEventListener('touchend',           onTouchEnd,   { passive: true });
    window.addEventListener('pointerdown',        onPointerDown);
    window.addEventListener('pointerup',          onPointerUp);
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      if (active.current) exit();
      btn.remove();
      const container = document.getElementById('vr-immersive-container');
      if (container && container.childNodes.length === 0) {
        container.remove();
      }
      gl.domElement.removeEventListener('touchstart',  onTouchStart);
      gl.domElement.removeEventListener('touchmove',   onTouchMove);
      window.removeEventListener('touchend',           onTouchEnd);
      window.removeEventListener('pointerdown',        onPointerDown);
      window.removeEventListener('pointerup',          onPointerUp);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!active.current) return;
    const dt = Math.min(delta, 0.1) * 60;

    // ── Rotation caméra (gyroscope) ────────────────────────────────────────────
    const o = orient.current;
    if (o) {
      const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(o.beta),
        THREE.MathUtils.degToRad(o.alpha - (alphaOffset.current || 0)),
        THREE.MathUtils.degToRad(-o.gamma),
        'YXZ',
      );
      camera.quaternion.setFromEuler(euler);
      camera.quaternion.multiply(Q_SCREEN);
      const screenAngle = screen.orientation?.angle ?? 0;
      if (screenAngle !== 0) {
        camera.quaternion.multiply(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            -THREE.MathUtils.degToRad(screenAngle),
          ),
        );
      }
    }

    // ── Avancer (touch hold) ───────────────────────────────────────────────────
    if (walking.current) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      pos.current.addScaledVector(dir, WALK_SPEED * dt);

      cameraState.isWalking = true;
      cameraState.isMoving = true;
      cameraState.lastUserControlTime = performance.now();
      cameraState.walkerX = pos.current.x;
      cameraState.walkerZ = pos.current.z;
      cameraState.walkYaw = Math.atan2(dir.x, dir.z);
      invalidate();
    } else {
      cameraState.isWalking = true;
      cameraState.isMoving = false;
      cameraState.walkerX = pos.current.x;
      cameraState.walkerZ = pos.current.z;
    }

    camera.position.copy(pos.current);
  });

  return null;
}
