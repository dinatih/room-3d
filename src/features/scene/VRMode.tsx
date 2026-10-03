/**
 * VRMode.tsx — port de js/ui/events.js (section VR WebXR).
 *
 * - Active renderer.xr, injecte VRButton dans le DOM
 * - Crée un vrRig Group ; la caméra y est parentée pendant la session
 * - Tap/bouton Cardboard → avancer dans la direction du regard
 * - Session end → restaure la caméra et désactive isXR
 */
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import * as THREE from 'three';
import { cameraState } from './cameraState';

import { ROOM_W, ROOM_D } from './wallData';

const WALK_SPEED = 2;

export function VRMode() {
  const { gl, camera, scene } = useThree();
  const rigRef     = useRef<THREE.Group | null>(null);
  const walkingRef = useRef(false);

  useEffect(() => {
    gl.xr.enabled = true;

    // ── Rig ───────────────────────────────────────────────────────────────────
    const rig = new THREE.Group();
    rigRef.current = rig;
    scene.add(rig);

    // ── VRButton (invisible, déclenché via toggle-vr ou clic direct) ────────
    const btn = VRButton.createButton(gl);
    btn.id = 'vr-native-btn';
    btn.style.display = 'none';
    document.body.appendChild(btn);

    const onToggleVR = () => {
      btn.click();
    };
    document.addEventListener('toggle-vr', onToggleVR);

    // MutationObserver pour détecter le support WebXR
    const obs = new MutationObserver(() => {
      const txt = btn.textContent || '';
      if (txt.includes('NOT SUPPORTED') || txt.includes('NOT ALLOWED')) {
        document.dispatchEvent(new CustomEvent('vr-support-change', { detail: { supported: false } }));
      } else if (txt === 'ENTER VR' || txt === 'VR') {
        document.dispatchEvent(new CustomEvent('vr-support-change', { detail: { supported: true } }));
      }
    });
    obs.observe(btn, { childList: true, characterData: true, subtree: true });

    // Initial check
    const initialText = btn.textContent || '';
    if (initialText.includes('NOT SUPPORTED') || initialText.includes('NOT ALLOWED')) {
      document.dispatchEvent(new CustomEvent('vr-support-change', { detail: { supported: false } }));
    } else if (initialText === 'ENTER VR' || initialText === 'VR') {
      document.dispatchEvent(new CustomEvent('vr-support-change', { detail: { supported: true } }));
    }

    // ── Controller (tap Cardboard = avancer) ──────────────────────────────────
    const ctrl = gl.xr.getController(0);
    ctrl.addEventListener('selectstart', () => { walkingRef.current = true;  });
    ctrl.addEventListener('selectend',   () => { walkingRef.current = false; });
    rig.add(ctrl);

    // ── Session start ─────────────────────────────────────────────────────────
    const onSessionStart = () => {
      cameraState.isXR = true;
      document.dispatchEvent(new CustomEvent('vr-state-change', { detail: { active: true } }));
      camera.position.set(0, 0, 0);
      const activeId = (window as any).activeWalkerId || 'lara';
      const pos = cameraState.positions[activeId];
      const startX = pos ? pos.x : (Number.isFinite(cameraState.walkerX) ? cameraState.walkerX : ROOM_W / 2);
      const startZ = pos ? pos.z : (Number.isFinite(cameraState.walkerZ) ? cameraState.walkerZ : ROOM_D / 2);
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
    };

    // ── Session end ───────────────────────────────────────────────────────────
    const onSessionEnd = () => {
      cameraState.isXR = false;
      document.dispatchEvent(new CustomEvent('vr-state-change', { detail: { active: false } }));
      walkingRef.current = false;
      cameraState.isMoving = false;
      scene.add(camera);  // reparente au root de la scène
    };

    gl.xr.addEventListener('sessionstart', onSessionStart);
    gl.xr.addEventListener('sessionend',   onSessionEnd);

    // ── Touch fallback pour avancer (uniquement quand WebXR est actif) ──
    const onWalkStart = (e: Event) => {
      if (!gl.xr.isPresenting) return;
      // Éviter d'intercepter les clics sur les boutons DOM ou UI
      if (e.target && (e.target as HTMLElement).tagName === 'BUTTON') return;
      walkingRef.current = true;
    };
    const onWalkEnd = () => {
      if (!gl.xr.isPresenting) return;
      walkingRef.current = false;
    };

    window.addEventListener('touchstart', onWalkStart, { passive: true });
    window.addEventListener('touchend',   onWalkEnd, { passive: true });
    window.addEventListener('mousedown',  onWalkStart);
    window.addEventListener('mouseup',    onWalkEnd);

    return () => {
      obs.disconnect();
      document.removeEventListener('toggle-vr', onToggleVR);
      document.dispatchEvent(new CustomEvent('vr-state-change', { detail: { active: false } }));
      btn.remove();
      const container = document.getElementById('vr-immersive-container');
      if (container && container.childNodes.length === 0) {
        container.remove();
      }
      gl.xr.enabled = false;
      gl.xr.removeEventListener('sessionstart', onSessionStart);
      gl.xr.removeEventListener('sessionend',   onSessionEnd);
      
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

    if (walkingRef.current) {
      const dir = new THREE.Vector3();
      // Obtenir la caméra WebXR active pour le calcul précis de la direction de vue
      const xrCam = gl.xr.getCamera() || camera;
      xrCam.getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() > 1e-4) {
        dir.normalize();
        rigRef.current.position.addScaledVector(dir, WALK_SPEED * dt);

        cameraState.isWalking = true;
        cameraState.isMoving = true;
        cameraState.lastUserControlTime = performance.now();
        cameraState.walkerX = rigRef.current.position.x;
        cameraState.walkerZ = rigRef.current.position.z;
        cameraState.walkYaw = Math.atan2(dir.x, dir.z);
      }
    } else {
      if (cameraState.isXR) {
        cameraState.isWalking = true;
        cameraState.isMoving = false;
        if (cameraState.isAIControlled) {
          rigRef.current.position.x = cameraState.walkerX;
          rigRef.current.position.z = cameraState.walkerZ;
        } else {
          cameraState.walkerX = rigRef.current.position.x;
          cameraState.walkerZ = rigRef.current.position.z;
        }
      }
    }
  });

  return null;
}
