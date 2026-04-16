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

// @ts-ignore
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
    const btn = VRButton.createButton(gl);
    btn.style.bottom = '60px';
    document.body.appendChild(btn);

    // Réduire le bouton si WebXR non supporté
    const obs = new MutationObserver(() => {
      if (btn.textContent?.includes('NOT SUPPORTED')) {
        Object.assign(btn.style, { fontSize: '10px', padding: '4px 8px' });
      }
    });
    obs.observe(btn, { childList: true, characterData: true, subtree: true });

    // ── Controller (tap Cardboard = avancer) ──────────────────────────────────
    const ctrl = gl.xr.getController(0);
    ctrl.addEventListener('selectstart', () => { walkingRef.current = true;  });
    ctrl.addEventListener('selectend',   () => { walkingRef.current = false; });
    rig.add(ctrl);

    // ── Session start ─────────────────────────────────────────────────────────
    const onSessionStart = () => {
      cameraState.isXR = true;
      camera.position.set(0, 0, 0);
      rig.position.set(ROOM_W / 2, 170, ROOM_D / 2);
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

    return () => {
      obs.disconnect();
      btn.remove();
      gl.xr.enabled = false;
      gl.xr.removeEventListener('sessionstart', onSessionStart);
      gl.xr.removeEventListener('sessionend',   onSessionEnd);
      rig.remove(ctrl);
      scene.remove(rig);
      rigRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    if (!gl.xr.isPresenting || !walkingRef.current || !rigRef.current) return;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    rigRef.current.position.addScaledVector(dir, WALK_SPEED);
  });

  return null;
}
