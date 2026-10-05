/**
 * VRMode.tsx — Gestion de session WebXR pure.
 *
 * - Active gl.xr.enabled
 * - Crée un vrRig Group ; la caméra y est parentée pendant la session
 * - Démarre la session WebXR uniquement sur demande explicite (toggle-vr)
 * - Aucune injection DOM parasite ni message 'VR NOT SUPPORTED'
 */
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraState } from './cameraState';
import { ROOM_W, ROOM_D } from './wallData';

const WALK_SPEED = 2;

export function VRMode() {
  const { gl, camera, scene } = useThree();
  const rigRef     = useRef<THREE.Group | null>(null);
  const movingRef = useRef(false);

  useEffect(() => {
    gl.xr.enabled = true;

    // ── Rig ───────────────────────────────────────────────────────────────────
    const rig = new THREE.Group();
    rigRef.current = rig;
    scene.add(rig);

    // ── Contrôleur WebXR (tap Cardboard = avancer) ───────────────────────────
    const ctrl = gl.xr.getController(0);
    ctrl.addEventListener('selectstart', () => { movingRef.current = true; });
    ctrl.addEventListener('selectend',   () => { movingRef.current = false; });
    rig.add(ctrl);

    let currentSession: any = null;

    const onSessionEnd = () => {
      currentSession = null;
      cameraState.isXR = false;
      document.dispatchEvent(new CustomEvent('vr-state-change', { detail: { active: false } }));
      movingRef.current = false;
      cameraState.isMoving = false;
      scene.add(camera);
    };

    const onToggleVR = async () => {
      const navXr = (navigator as any).xr;
      if (!navXr) return;
      if (currentSession) {
        currentSession.end();
        return;
      }
      try {
        const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] };
        const session = await navXr.requestSession('immersive-vr', sessionInit);
        session.addEventListener('end', onSessionEnd);
        await gl.xr.setSession(session);
        currentSession = session;

        cameraState.isXR = true;
        document.dispatchEvent(new CustomEvent('vr-state-change', { detail: { active: true } }));
        camera.position.set(0, 0, 0);
        const activeId = (window as any).activeCharacterId || 'lara';
        const pos = cameraState.positions[activeId];
        const startX = pos ? pos.x : (Number.isFinite(cameraState.characterX) ? cameraState.characterX : ROOM_W / 2);
        const startZ = pos ? pos.z : (Number.isFinite(cameraState.characterZ) ? cameraState.characterZ : ROOM_D / 2);
        rig.position.set(startX, 170, startZ);
        rig.add(camera);

        const hint = document.createElement('div');
        hint.textContent = 'Appuyer pour avancer';
        hint.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);'
          + 'background:rgba(0,0,0,0.8);color:#fff;padding:12px 24px;'
          + 'border-radius:8px;font-size:14px;z-index:9999;transition:opacity 0.5s';
        document.body.appendChild(hint);
        setTimeout(() => { hint.style.opacity = '0'; }, 4500);
        setTimeout(() => { hint.remove(); }, 5000);
      } catch {
        // VR non supporté ou refusé — rien à afficher
      }
    };

    document.addEventListener('toggle-vr', onToggleVR);

    // ── Touch fallback pour avancer (uniquement quand WebXR est actif) ──
    const onWalkStart = (e: Event) => {
      if (!gl.xr.isPresenting) return;
      if (e.target && (e.target as HTMLElement).tagName === 'BUTTON') return;
      movingRef.current = true;
    };
    const onWalkEnd = () => {
      if (!gl.xr.isPresenting) return;
      movingRef.current = false;
    };

    window.addEventListener('touchstart', onWalkStart, { passive: true });
    window.addEventListener('touchend',   onWalkEnd, { passive: true });
    window.addEventListener('mousedown',  onWalkStart);
    window.addEventListener('mouseup',    onWalkEnd);

    return () => {
      document.removeEventListener('toggle-vr', onToggleVR);
      document.dispatchEvent(new CustomEvent('vr-state-change', { detail: { active: false } }));
      if (currentSession) currentSession.end().catch(() => {});
      gl.xr.enabled = false;

      window.removeEventListener('touchstart', onWalkStart);
      window.removeEventListener('touchend',   onWalkEnd);
      window.removeEventListener('mousedown',  onWalkStart);
      window.removeEventListener('mouseup',    onWalkEnd);

      rig.remove(ctrl);
      scene.remove(rig);
      rigRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!gl.xr.isPresenting || !rigRef.current) return;
    const dt = Math.min(delta, 0.1) * 60;

    if (movingRef.current) {
      const dir = new THREE.Vector3();
      const xrCam = gl.xr.getCamera() || camera;
      xrCam.getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() > 1e-4) {
        dir.normalize();
        rigRef.current.position.addScaledVector(dir, WALK_SPEED * dt);

        cameraState.isFollowing = true;
        cameraState.isMoving = true;
        cameraState.lastUserControlTime = performance.now();
        cameraState.characterX = rigRef.current.position.x;
        cameraState.characterZ = rigRef.current.position.z;
        cameraState.followYaw = Math.atan2(dir.x, dir.z);
      }
    } else {
      if (cameraState.isXR) {
        cameraState.isFollowing = true;
        cameraState.isMoving = false;
        if (cameraState.isAIControlled) {
          rigRef.current.position.x = cameraState.characterX;
          rigRef.current.position.z = cameraState.characterZ;
        } else {
          cameraState.characterX = rigRef.current.position.x;
          cameraState.characterZ = rigRef.current.position.z;
        }
      }
    }
  });

  return null;
}
