/**
 * CameraController.tsx — port de js/cameraManager.js
 *
 * Modes :
 *   orbit  — OrbitControls standard (défaut)
 *   walk   — première personne WASD + souris (touche M)
 *   top    — vue orthographique du dessus (touche T)
 *
 * Raccourcis clavier :
 *   P          — vue perspective (reset)
 *   M          — reprendre / entrer walk mode
 *   T          — toggle vue top-down
 *   Échap      — quitter walk mode / top-down
 *   Flèches / WASD  — déplacement walk
 *   ←→         — pivoter (walk)
 *   Ctrl+↑↓    — incliner la caméra (walk)
 *   Alt+↑↓     — monter/descendre (walk)
 *   Clic+glisser    — regarder librement (walk)
 */
import { useEffect, useRef, useState } from 'react';
import { useThree, useFrame }          from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useRapier, RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';

import { ROOM_W, ROOM_D, WALL_H } from '@config';
import { cameraState } from './cameraState';

// ── Constantes ────────────────────────────────────────────────────────────────

const CX = ROOM_W / 2;
const CZ = ROOM_D / 2;

const EYE_RATIO  = 0.93; // niveau yeux ≈ 93% taille totale
const WALK_SPEED = 2;

/** Hauteur caméra walk = niveau yeux du walker actif (≈ 93% de sa taille). */
function activeWalkH(): number {
  const h = cameraState.activeWalkerIdx === 0
    ? cameraState.walkerHeight0
    : cameraState.walkerHeight1;
  return h * EYE_RATIO;
}
const MOUSE_SENS  = 0.002;

const PERSP_POS:    [number, number, number] = [ROOM_W / 2, 1000, -150];
const PERSP_TARGET: [number, number, number] = [ROOM_W / 2, WALL_H / 3, ROOM_D / 2];

// Character capsule dimensions (cm): center at CHAR_CY above ground
const CHAR_RADIUS = 15;
const CHAR_HALF_H = 65;
const CHAR_CY     = CHAR_HALF_H + CHAR_RADIUS; // 80cm — capsule spans Y=[0,160]

type Mode = 'orbit' | 'walk' | 'top';

// ── Composant ─────────────────────────────────────────────────────────────────

export function CameraController({ planeMode = false }: { planeMode?: boolean } = {}) {
  const { camera, size, invalidate } = useThree();

  // Register invalidate for use outside Canvas (Studio.tsx layer/furniture toggles)
  useEffect(() => {
    cameraState.invalidate = invalidate;
    return () => { cameraState.invalidate = null; };
  }, [invalidate]);
  const [mode, setMode] = useState<Mode>('orbit');
  const modeRef = useRef<Mode>('orbit');

  // Mirror planeMode in a ref so the keyboard / frame handlers (bound once via
  // useEffect) can read its latest value without stale-closure issues.
  const planeModeRef = useRef(planeMode);
  useEffect(() => { planeModeRef.current = planeMode; }, [planeMode]);

  // sync ref with state so event handlers use latest mode without stale closure
  function changeMode(m: Mode) {
    modeRef.current = m;
    cameraState.mode = m;
    setMode(m);
  }

  // Rapier physics
  const { world } = useRapier();
  const charBodyRef       = useRef<RapierRigidBody | null>(null);
  const charCtrlRef       = useRef<any>(null);
  const physicsEnabledRef = useRef(false);
  useEffect(() => {
    const handler = (e: Event) => { physicsEnabledRef.current = (e as CustomEvent).detail.enabled as boolean; };
    document.addEventListener('physics-toggle', handler);
    return () => document.removeEventListener('physics-toggle', handler);
  }, []);

  // OrbitControls imperative ref
  const ctrlRef = useRef<OrbitControlsImpl>(null!);

  // Walk state (refs — updated every frame, no re-render needed)
  const walkPos   = useRef({ x: CX, y: activeWalkH(), z: CZ });
  const walkYaw   = useRef(0);
  const walkPitch = useRef(0);
  const keys      = useRef(new Set<string>());
  const dragging  = useRef(false);

  // Saved perspective state for top-down → orbit restore
  const savedPerspPos    = useRef(new THREE.Vector3(...PERSP_POS));
  const savedPerspTarget = useRef(new THREE.Vector3(...PERSP_TARGET));
  // FOV sauvegardé avant entrée walk (restauré à la sortie)
  const savedFov         = useRef(50);

  // ── Walk helpers ────────────────────────────────────────────────────────────

  function updateWalkLook() {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    const d    = 100;
    const cosP = Math.cos(walkPitch.current);
    ctrl.target.set(
      walkPos.current.x + Math.sin(walkYaw.current) * cosP * d,
      walkPos.current.y + Math.sin(walkPitch.current) * d,
      walkPos.current.z + Math.cos(walkYaw.current) * cosP * d,
    );
    camera.position.set(walkPos.current.x, walkPos.current.y, walkPos.current.z);
    ctrl.update();
  }

  function enterWalk(x: number, z: number) {
    walkPos.current = { x, y: activeWalkH(), z };
    walkYaw.current   = 0;
    walkPitch.current = 0;
    const ctrl = ctrlRef.current;
    if (ctrl) {
      ctrl.enableRotate = false;
      ctrl.enablePan    = false;
      ctrl.enableZoom   = false;
    }
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) savedFov.current = cam.fov;
    changeMode('walk');
    invalidate(); // déclenche un frame pour que la minimap affiche l'icône
  }

  function exitWalkMode() {
    dragging.current = false;
    keys.current.clear();
    const ctrl = ctrlRef.current;
    if (ctrl) {
      ctrl.enableRotate = true;
      ctrl.enablePan    = true;
      ctrl.enableZoom   = true;
    }
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      cam.fov = savedFov.current;
      cam.updateProjectionMatrix();
    }
    changeMode('orbit');
    invalidate(); // met à jour la minimap (supprime l'icône)
  }

  function enterTop() {
    if (modeRef.current === 'walk') exitWalkMode();
    // Save current perspective so we can restore on exit
    savedPerspPos.current.copy(camera.position);
    if (ctrlRef.current) savedPerspTarget.current.copy(ctrlRef.current.target);
    changeMode('top');
  }

  function exitTop() {
    // Restore perspective state after OrthographicCamera unmounts (next frame)
    changeMode('orbit');
    // camera.position / target restored by useEffect below
  }

  // Restore persp camera after leaving top mode
  useEffect(() => {
    if (mode === 'orbit' && ctrlRef.current) {
      // Only restore if we had a saved persp (i.e. we came from top mode)
      camera.position.copy(savedPerspPos.current);
      ctrlRef.current.target.copy(savedPerspTarget.current);
      ctrlRef.current.update();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Apply walk look after entering walk (mode ref is set, state follows)
  useEffect(() => {
    if (mode === 'walk') {
      // small delay to ensure OrbitControls has processed the enableRotate change
      requestAnimationFrame(() => updateWalkLook());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Character controller (Rapier) ─────────────────────────────────────────

  useEffect(() => {
    const ctrl = world.createCharacterController(2);
    ctrl.setUp({ x: 0, y: 1, z: 0 });
    ctrl.setMaxSlopeClimbAngle(45 * Math.PI / 180);
    ctrl.setMinSlopeSlideAngle(30 * Math.PI / 180);
    ctrl.enableAutostep(25, 10, true);
    ctrl.enableSnapToGround(5);
    ctrl.setApplyImpulsesToDynamicBodies(true);
    ctrl.setSlideEnabled(true);
    charCtrlRef.current = ctrl;
    return () => {
      world.removeCharacterController(ctrl);
      charCtrlRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper : téléporte body à (curX, curZ), query collision, retourne pos corrigée
  function collideMove(curX: number, curZ: number, dx: number, dz: number): { x: number; z: number } {
    if (!physicsEnabledRef.current) return { x: curX + dx, z: curZ + dz };
    const phys = charCtrlRef.current;
    const body = charBodyRef.current;
    if (!phys || !body || body.numColliders() === 0) {
      return { x: curX + dx, z: curZ + dz };
    }
    body.setTranslation({ x: curX, y: CHAR_CY, z: curZ }, false);
    try {
      phys.computeColliderMovement(body.collider(0), { x: dx, y: -2, z: dz });
      const mv = phys.computedMovement();
      return { x: curX + mv.x, z: curZ + mv.z };
    } catch {
      return { x: curX + dx, z: curZ + dz };
    }
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Plane mode owns input — bail out so arrow/WASD don't move walker or camera.
      if (planeModeRef.current) return;
      // Global shortcuts
      if (e.key === 'Escape') {
        if (modeRef.current === 'walk') exitWalkMode();
        else if (modeRef.current === 'top') exitTop();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        if (modeRef.current === 'walk') exitWalkMode();
        else if (modeRef.current === 'top') exitTop();
        // Reset to default perspective
        camera.position.set(...PERSP_POS);
        savedPerspPos.current.set(...PERSP_POS);
        savedPerspTarget.current.set(...PERSP_TARGET);
        if (ctrlRef.current) {
          ctrlRef.current.target.set(...PERSP_TARGET);
          ctrlRef.current.update();
        }
        return;
      }
      if ((e.key === 'm' || e.key === 'M') && modeRef.current !== 'walk') {
        enterWalk(walkPos.current.x, walkPos.current.z);
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        modeRef.current === 'top' ? exitTop() : enterTop();
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        const newIdx = (cameraState.activeWalkerIdx + 1) % 2;
        cameraState.activeWalkerIdx = newIdx;
        if (modeRef.current === 'walk') {
          walkPos.current.x = newIdx === 0 ? cameraState.walker0X : cameraState.walker1X;
          walkPos.current.z = newIdx === 0 ? cameraState.walker0Z : cameraState.walker1Z;
          walkPos.current.y = activeWalkH();
          updateWalkLook();
        }
        invalidate();
        return;
      }

      const k = e.key;
      const isArrow = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k);

      // Orbit-mode zoom (PageUp/PageDown)
      if (modeRef.current === 'orbit' && (k === 'PageUp' || k === 'PageDown')) {
        keys.current.add(k);
        e.preventDefault();
        invalidate();
        return;
      }

      // Orbit-mode arrow keys (Google Earth style)
      if (modeRef.current === 'orbit' && isArrow) {
        if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
          keys.current.add(k);                      // plain  → move walker
        } else if (e.shiftKey && e.ctrlKey) {
          keys.current.add('ShiftCtrl' + k);         // Shift+Ctrl → pan
        } else if (e.shiftKey) {
          keys.current.add('Shift' + k);             // Shift  → orbit
        } else if (e.ctrlKey) {
          keys.current.add('Ctrl' + k);              // Ctrl   → rotate camera
        } else if (e.altKey) {
          keys.current.add('Alt' + k);               // Alt    → pan
        }
        e.preventDefault();
        invalidate();
        return;
      }

      // Walk-only keys
      if (modeRef.current !== 'walk') return;
      if (isArrow) {
        keys.current.add(k);
        if (e.ctrlKey)  keys.current.add('Ctrl' + k);
        if (e.altKey)   keys.current.add('Alt' + k);
        e.preventDefault();
      }
      const lk = k.toLowerCase();
      if ('wasd'.includes(lk) && lk.length === 1) {
        keys.current.add(lk);
        e.preventDefault();
      }
      // Kick off the first frame — useFrame keeps the loop going while keys held
      if (keys.current.size > 0) invalidate();
    };

    const onUp = (e: KeyboardEvent) => {
      const k = e.key;
      keys.current.delete(k);
      keys.current.delete(k.toLowerCase());
      keys.current.delete('Shift'      + k);
      keys.current.delete('Ctrl'       + k);
      keys.current.delete('Alt'        + k);
      keys.current.delete('ShiftCtrl'  + k);
      // Modifier released → clear all keys that used it
      if (k === 'Shift')   for (const key of [...keys.current]) { if (key.startsWith('Shift'))   keys.current.delete(key); }
      if (k === 'Control') for (const key of [...keys.current]) { if (key.startsWith('Ctrl'))    keys.current.delete(key); }
      if (k === 'Alt')     for (const key of [...keys.current]) { if (key.startsWith('Alt'))     keys.current.delete(key); }
    };

    // Minimap / panel click → enter walk in that room
    const onPov = (e: Event) => {
      const { x, z } = (e as CustomEvent).detail as { x: number; z: number };
      enterWalk(x, z);
    };

    // Panel camera preset → move orbit camera
    const onView = (e: Event) => {
      const { pos, target } = (e as CustomEvent).detail as {
        pos: [number, number, number];
        target: [number, number, number];
      };
      if (modeRef.current === 'walk') exitWalkMode();
      if (modeRef.current === 'top')  exitTop();
      camera.position.set(...pos);
      savedPerspPos.current.set(...pos);
      savedPerspTarget.current.set(...target);
      if (ctrlRef.current) { ctrlRef.current.target.set(...target); ctrlRef.current.update(); }
      invalidate();
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    document.addEventListener('minimap-pov',  onPov);
    document.addEventListener('camera-pov',   onPov);
    document.addEventListener('camera-view',  onView);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
      document.removeEventListener('minimap-pov',  onPov);
      document.removeEventListener('camera-pov',   onPov);
      document.removeEventListener('camera-view',  onView);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  // ── Mouse drag (walk look) ──────────────────────────────────────────────────

  useEffect(() => {
    const { domElement } = (camera as any).__r3f?.root?.getState?.()?.gl ?? {};
    // Fallback: grab canvas from document
    const canvas = document.querySelector('canvas')!;

    const onDown  = (e: MouseEvent) => { if (modeRef.current === 'walk' && e.button === 0) dragging.current = true; };
    const onUp    = () => { dragging.current = false; };
    const onMove  = (e: MouseEvent) => {
      if (!dragging.current || modeRef.current !== 'walk') return;
      walkYaw.current   -= e.movementX * MOUSE_SENS;
      walkPitch.current  = Math.max(-1.4, Math.min(1.4, walkPitch.current - e.movementY * MOUSE_SENS));
      updateWalkLook();
      invalidate();
    };
    // Scroll wheel en walk = FOV (zoom). Range 30°–110°.
    const onWheel = (e: WheelEvent) => {
      if (modeRef.current !== 'walk') return;
      const cam = camera as THREE.PerspectiveCamera;
      if (!cam.isPerspectiveCamera) return;
      e.preventDefault();
      const step = e.deltaY > 0 ? 2 : -2;
      cam.fov = Math.max(30, Math.min(110, cam.fov + step));
      cam.updateProjectionMatrix();
      invalidate();
    };

    canvas.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup',   onUp);
    document.addEventListener('mousemove', onMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup',   onUp);
      document.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('wheel', onWheel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Frame loop — walk movement ──────────────────────────────────────────────

  useFrame((_, delta) => {
    if (cameraState.isXR) return;
    if (planeModeRef.current) return;
    // Normalize to 60 fps baseline so speed is frame-rate independent
    const dt = Math.min(delta, 0.1) * 60;
    // Sync camera position for minimap + walker
    cameraState.camX     = camera.position.x;
    cameraState.camZ     = camera.position.z;
    cameraState.camRY    = camera.rotation.y;
    cameraState.isWalking = modeRef.current === 'walk';
    cameraState.isMoving  = (modeRef.current === 'walk' && keys.current.size > 0)
      || (modeRef.current === 'orbit' && (keys.current.has('ArrowUp') || keys.current.has('ArrowDown')));
    // walkYaw is only synced from walk controls when in walk mode;
    // in orbit mode it is managed by the walker arrow keys below.
    if (modeRef.current === 'walk') {
      cameraState.walkYaw   = walkYaw.current;
      cameraState.walkPitch = walkPitch.current;
    }
    cameraState.onUpdate?.();

    // ── Orbit mode keyboard navigation (Google Earth style) ─────────────────────
    if (modeRef.current === 'orbit' && keys.current.size > 0) {
      const k   = keys.current;
      const ctrl = ctrlRef.current;
      invalidate();

      // Plain arrows — move active walker
      if (k.has('ArrowLeft'))  cameraState.walkYaw += 0.03 * dt;
      if (k.has('ArrowRight')) cameraState.walkYaw -= 0.03 * dt;
      const wYaw = cameraState.walkYaw;
      const ws   = WALK_SPEED * dt;
      {
        let wdx = 0, wdz = 0;
        if (k.has('ArrowUp'))   { wdx += Math.sin(wYaw)*ws; wdz += Math.cos(wYaw)*ws; }
        if (k.has('ArrowDown')) { wdx -= Math.sin(wYaw)*ws; wdz -= Math.cos(wYaw)*ws; }
        if (wdx !== 0 || wdz !== 0) {
          if (cameraState.activeWalkerIdx === 0) {
            const c = collideMove(cameraState.walker0X, cameraState.walker0Z, wdx, wdz);
            cameraState.walker0X = c.x; cameraState.walker0Z = c.z;
          } else {
            const c = collideMove(cameraState.walker1X, cameraState.walker1Z, wdx, wdz);
            cameraState.walker1X = c.x; cameraState.walker1Z = c.z;
          }
        }
      }

      if (ctrl) {
        // Shift+arrows — orbit (rotate camera around target)
        if (k.has('ShiftArrowLeft') || k.has('ShiftArrowRight') || k.has('ShiftArrowUp') || k.has('ShiftArrowDown')) {
          const offset = new THREE.Vector3().subVectors(camera.position, ctrl.target);
          const sph    = new THREE.Spherical().setFromVector3(offset);
          if (k.has('ShiftArrowLeft'))  sph.theta += 0.015 * dt;
          if (k.has('ShiftArrowRight')) sph.theta -= 0.015 * dt;
          if (k.has('ShiftArrowUp'))    sph.phi   -= 0.015 * dt;
          if (k.has('ShiftArrowDown'))  sph.phi   += 0.015 * dt;
          sph.makeSafe();
          camera.position.setFromSpherical(sph).add(ctrl.target);
          ctrl.update();
        }

        // Ctrl+arrows — rotate camera (heading/tilt, target moves around camera)
        if (k.has('CtrlArrowLeft') || k.has('CtrlArrowRight') || k.has('CtrlArrowUp') || k.has('CtrlArrowDown')) {
          const toTarget = new THREE.Vector3().subVectors(ctrl.target, camera.position);
          const up       = new THREE.Vector3(0, 1, 0);
          if (k.has('CtrlArrowLeft'))  toTarget.applyAxisAngle(up,  0.015 * dt);
          if (k.has('CtrlArrowRight')) toTarget.applyAxisAngle(up, -0.015 * dt);
          const camRight = new THREE.Vector3().crossVectors(toTarget.clone().normalize(), up).normalize();
          if (k.has('CtrlArrowUp'))   toTarget.applyAxisAngle(camRight,  0.015 * dt);
          if (k.has('CtrlArrowDown')) toTarget.applyAxisAngle(camRight, -0.015 * dt);
          ctrl.target.copy(camera.position).add(toTarget);
          ctrl.update();
        }

        // Alt or Shift+Ctrl+arrows — pan (translate camera + target together)
        const hasPan = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']
          .some(a => k.has('Alt'+a) || k.has('ShiftCtrl'+a));
        if (hasPan) {
          const camDir   = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x).normalize();
          const panStep  = ctrl.target.distanceTo(camera.position) * 0.0015;
          const panDelta = new THREE.Vector3();
          const isPan = (a: string) => k.has('Alt'+a) || k.has('ShiftCtrl'+a);
          const camForward = new THREE.Vector3();
          camera.getWorldDirection(camForward);
          camForward.y = 0;
          camForward.normalize();
          if (isPan('ArrowLeft'))  panDelta.addScaledVector(camRight,   -panStep);
          if (isPan('ArrowRight')) panDelta.addScaledVector(camRight,    panStep);
          if (isPan('ArrowUp'))    panDelta.addScaledVector(camForward,  panStep);
          if (isPan('ArrowDown'))  panDelta.addScaledVector(camForward, -panStep);
          camera.position.add(panDelta);
          ctrl.target.add(panDelta);
          ctrl.update();
        }
      }

      // PageUp/PageDown — zoom (dolly le long de l'axe caméra→cible)
      if (ctrl && (k.has('PageUp') || k.has('PageDown'))) {
        const dir  = new THREE.Vector3().subVectors(ctrl.target, camera.position);
        const dist = dir.length();
        dir.normalize();
        const step = dist * 0.01 * dt;
        if (k.has('PageUp'))   camera.position.addScaledVector(dir,  step);
        if (k.has('PageDown')) camera.position.addScaledVector(dir, -step);
        ctrl.update();
      }
    }

    if (modeRef.current !== 'walk') return;
    if (keys.current.size === 0) return;

    // Keep rendering while keys are held in walk mode
    invalidate();

    const yaw   = walkYaw.current;
    const sp    = WALK_SPEED * dt;
    const fwdX  = Math.sin(yaw) * sp;
    const fwdZ  = Math.cos(yaw) * sp;
    const rgtX  = fwdZ, rgtZ = -fwdX;
    const k     = keys.current;

    if (k.has('ArrowLeft'))  walkYaw.current += 0.03 * dt;
    if (k.has('ArrowRight')) walkYaw.current -= 0.03 * dt;

    if (k.has('CtrlArrowUp'))   walkPitch.current = Math.min( 1.4, walkPitch.current + 0.02 * dt);
    if (k.has('CtrlArrowDown')) walkPitch.current = Math.max(-1.4, walkPitch.current - 0.02 * dt);

    if (k.has('AltArrowUp'))   walkPos.current.y += sp;
    if (k.has('AltArrowDown')) walkPos.current.y -= sp;

    const noMod = !k.has('CtrlArrowUp') && !k.has('CtrlArrowDown') && !k.has('AltArrowUp') && !k.has('AltArrowDown');

    let dx = 0, dz = 0;
    if (noMod && (k.has('ArrowUp')   || k.has('w'))) { dx += fwdX; dz += fwdZ; }
    if (noMod && (k.has('ArrowDown') || k.has('s'))) { dx -= fwdX; dz -= fwdZ; }
    if (k.has('a')) { dx -= rgtX; dz -= rgtZ; }
    if (k.has('d')) { dx += rgtX; dz += rgtZ; }
    if (dx !== 0 || dz !== 0) {
      const c = collideMove(walkPos.current.x, walkPos.current.z, dx, dz);
      walkPos.current.x = c.x;
      walkPos.current.z = c.z;
    }

    updateWalkLook();
  });

  // ── Top-down orthographic frustum ──────────────────────────────────────────

  const aspect = size.width / size.height;
  const viewH  = 800;
  const viewW  = viewH * aspect;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {mode === 'top' && (
        <OrthographicCamera
          makeDefault
          position={[CX, 2000, CZ]}
          up={[0, 0, -1]}
          left={-viewW / 2}  right={viewW / 2}
          top={viewH / 2}    bottom={-viewH / 2}
          near={1}           far={5000}
        />
      )}

      <OrbitControls
        ref={ctrlRef}
        target={PERSP_TARGET}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI}
        enabled={!planeMode}
        enableRotate={!planeMode && mode !== 'top'}
        screenSpacePanning={mode === 'top'}
        mouseButtons={mode === 'top' ? {
          LEFT:   THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT:  THREE.MOUSE.ROTATE,
        } : undefined}
      />

      <RigidBody
        ref={charBodyRef}
        type="kinematicPosition"
        colliders={false}
        position={[CX, CHAR_CY, CZ]}
      >
        <CapsuleCollider args={[CHAR_HALF_H, CHAR_RADIUS]} />
      </RigidBody>
    </>
  );
}
