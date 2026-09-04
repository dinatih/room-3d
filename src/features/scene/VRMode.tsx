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

import { ROOM_W, ROOM_D } from '@config';

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

    // ── VRButton ──────────────────────────────────────────────────────────────
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

    // ── VRButton ──────────────────────────────────────────────────────────────
    const btn = VRButton.createButton(gl);
    
    // Custom styling to match Immersive glassmorphic button
    Object.assign(btn.style, {
      position: 'static',
      width: 'auto',
      height: 'auto',
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
      opacity: '1',
      bottom: 'auto',
      left: 'auto',
      right: 'auto',
      top: 'auto',
      display: 'none', // hidden initially until support is confirmed
    });

    container.appendChild(btn);

    // MutationObserver to customize label and hide when VR is not supported
    const obs = new MutationObserver(() => {
      const txt = btn.textContent || '';
      if (txt.includes('NOT SUPPORTED') || txt.includes('NOT ALLOWED')) {
        btn.style.display = 'none';
      } else if (txt === 'ENTER VR') {
        obs.disconnect();
        btn.textContent = 'VR';
        btn.style.display = '';
        obs.observe(btn, { childList: true, characterData: true, subtree: true });
      } else if (txt === 'EXIT VR') {
        obs.disconnect();
        btn.textContent = '✕ VR';
        btn.style.display = '';
        obs.observe(btn, { childList: true, characterData: true, subtree: true });
      }
    });
    obs.observe(btn, { childList: true, characterData: true, subtree: true });

    // Initial check (force observer update check)
    const initialText = btn.textContent || '';
    if (initialText.includes('NOT SUPPORTED')) {
      btn.style.display = 'none';
    } else if (initialText === 'ENTER VR') {
      btn.textContent = 'VR';
      btn.style.display = '';
    }

    // ── Controller (tap Cardboard = avancer) ──────────────────────────────────
    const ctrl = gl.xr.getController(0);
    ctrl.addEventListener('selectstart', () => { walkingRef.current = true;  });
    ctrl.addEventListener('selectend',   () => { walkingRef.current = false; });
    rig.add(ctrl);

    // ── Session start ─────────────────────────────────────────────────────────
    const onSessionStart = () => {
      cameraState.isXR = true;
      camera.position.set(0, 0, 0);
      const startX = Number.isFinite(cameraState.walkerX) ? cameraState.walkerX : ROOM_W / 2;
      const startZ = Number.isFinite(cameraState.walkerZ) ? cameraState.walkerZ : ROOM_D / 2;
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
      walkingRef.current = false;
      scene.add(camera);  // reparente au root de la scène
    };

    gl.xr.addEventListener('sessionstart', onSessionStart);
    gl.xr.addEventListener('sessionend',   onSessionEnd);

    // ── Touch fallback pour avancer (si le controller WebXR échoue sur certains mobiles) ──
    const onWalkStart = () => { walkingRef.current = true; };
    const onWalkEnd   = () => { walkingRef.current = false; };

    window.addEventListener('touchstart', onWalkStart);
    window.addEventListener('touchend',   onWalkEnd);
    window.addEventListener('mousedown',  onWalkStart);
    window.addEventListener('mouseup',    onWalkEnd);

    return () => {
      obs.disconnect();
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

  useFrame(() => {
    if (!gl.xr.isPresenting || !rigRef.current) return;

    if (walkingRef.current) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      rigRef.current.position.addScaledVector(dir, WALK_SPEED);

      cameraState.isWalking = true;
      cameraState.isMoving = true;
      cameraState.lastUserControlTime = performance.now();
      cameraState.walkerX = rigRef.current.position.x;
      cameraState.walkerZ = rigRef.current.position.z;
      cameraState.walkYaw = Math.atan2(dir.x, dir.z);
    } else {
      if (cameraState.isXR) {
        cameraState.isWalking = true;
        cameraState.isMoving = false;
        cameraState.walkerX = rigRef.current.position.x;
        cameraState.walkerZ = rigRef.current.position.z;
      }
    }
  });

  return null;
}
