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

// @ts-ignore
import { ROOM_W, ROOM_D } from '@config';

const WALK_H     = 180;
const WALK_SPEED = 2;

// Portrait → caméra regarde vers l'écran (même transform que DeviceOrientationControls)
const Q_SCREEN = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

export function ImmersiveMode() {
  const { camera, gl, invalidate } = useThree();

  const active  = useRef(false);
  const walking = useRef(false);
  const pos     = useRef(new THREE.Vector3(ROOM_W / 2, WALK_H, ROOM_D / 2));
  const orient  = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);

  useEffect(() => {
    // Desktop : rien à faire
    if (!('ontouchstart' in window)) return;

    // ── Bouton ─────────────────────────────────────────────────────────────────
    const btn = document.createElement('button');
    btn.textContent = '👁 Immersif';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      background: 'rgba(10,10,40,0.85)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.35)',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      cursor: 'pointer',
      zIndex: '200',
      fontFamily: 'sans-serif',
    });
    document.body.appendChild(btn);

    // ── DeviceOrientation ──────────────────────────────────────────────────────
    const onOrient = (e: DeviceOrientationEvent) => {
      if (!active.current) return;
      orient.current = {
        alpha: e.alpha ?? 0,
        beta:  e.beta  ?? 0,
        gamma: e.gamma ?? 0,
      };
      invalidate();
    };

    // ── Touch hold → avancer ───────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (!active.current) return;
      walking.current = true;
      e.preventDefault();
    };
    const onTouchEnd = () => { walking.current = false; };

    // ── Fullscreen quitté depuis navigateur ────────────────────────────────────
    const onFsChange = () => {
      if (!document.fullscreenElement && active.current) exit();
    };

    // ── Enter ──────────────────────────────────────────────────────────────────
    async function enter() {
      active.current   = true;
      cameraState.isXR = true;
      pos.current.set(cameraState.camX, WALK_H, cameraState.camZ);
      orient.current   = null;
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
      btn.textContent  = '👁 Immersif';

      window.removeEventListener('deviceorientation', onOrient);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      invalidate();
    }

    btn.addEventListener('click', () => { active.current ? exit() : enter(); });

    gl.domElement.addEventListener('touchstart',  onTouchStart, { passive: false });
    gl.domElement.addEventListener('touchend',    onTouchEnd,   { passive: true  });
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      if (active.current) exit();
      btn.remove();
      gl.domElement.removeEventListener('touchstart',  onTouchStart);
      gl.domElement.removeEventListener('touchend',    onTouchEnd);
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
        THREE.MathUtils.degToRad(o.alpha),
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
      invalidate();
    }

    camera.position.copy(pos.current);
  });

  return null;
}
