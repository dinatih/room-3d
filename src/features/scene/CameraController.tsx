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


import { ROOM_W, ROOM_D, WALL_H } from '@config';
import { cameraState } from './cameraState';
import { useSceneStore } from './store/useSceneStore';
import { appLog } from '@features/ui/AppConsole';
import { CHARACTERS, isCharacterVisibleInMode } from './walkerConfig';

// ── Constantes & Repères de Placement Caméra ───────────────────────────────────

const CX = ROOM_W / 2; // 150 cm — centre X de la pièce
const CZ = ROOM_D / 2; // 200 cm — centre Z du séjour

const EYE_RATIO  = 0.93; // niveau des yeux ≈ 93% de la taille totale du personnage
const WALK_SPEED = 2;

/** Hauteur caméra en mode marche = niveau des yeux du walker (≈ 93% de sa taille). */
function activeWalkH(): number {
  return cameraState.walkerHeight * EYE_RATIO;
}
const MOUSE_SENS  = 0.002;

/**
 * Position de départ de la caméra en mode Perspective / Orbit :
 * X = ROOM_W / 2 = 150 cm (centré horizontalement)
 * Y = 1000 cm = 10 m (vue en hauteur / plongée)
 * Z = -150 cm (reculé vers le nord, côté jardin, regardant vers le sud)
 */
const PERSP_POS:    [number, number, number] = [ROOM_W / 2, 1000, -150];

/**
 * Cible (look-at target) de la caméra en mode Orbit :
 * X = ROOM_W / 2 = 150 cm (centré)
 * Y = WALL_H / 3 = 83.3 cm (tiers inférieur de la hauteur des murs)
 * Z = ROOM_D / 2 = 200 cm (centre de la pièce)
 */
const PERSP_TARGET: [number, number, number] = [ROOM_W / 2, WALL_H / 3, ROOM_D / 2];

// Character capsule dimensions (cm): center at CHAR_CY above ground



type Mode = 'orbit' | 'walk' | 'fpv' | 'top';

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

  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const prevWalkerId = useRef<string | null>(null);

  useEffect(() => {
    if (activeWalkerId !== prevWalkerId.current) {
        const config = CHARACTERS.find(c => c.id === activeWalkerId);
        if (config) {
          const savedPos = cameraState.positions[activeWalkerId];
          cameraState.walkerX = savedPos ? savedPos.x : config.pos[0];
          cameraState.walkerZ = savedPos ? savedPos.z : config.pos[2];
          cameraState.walkerYaw = savedPos ? savedPos.yaw : config.rot;
          cameraState.walkerHeight = config.height;

          // Sync movement refs
          walkPos.current.x = cameraState.walkerX;
          walkPos.current.z = cameraState.walkerZ;
          walkYaw.current = cameraState.walkerYaw;
          walkPos.current.y = activeWalkH();

          invalidate();
        }
    }
    prevWalkerId.current = activeWalkerId;
  }, [activeWalkerId, invalidate]);

  // sync ref with state so event handlers use latest mode without stale closure
  function changeMode(m: Mode) {
    modeRef.current = m;
    cameraState.mode = m;
    setMode(m);
    
    // Auto-enable HD mirrors in fpv, disable in walk (3rd person) for performance
    const isMirrorsHD = useSceneStore.getState().layers.mirrorsHD;
    if (m === 'fpv' && !isMirrorsHD) {
      useSceneStore.getState().toggleLayer('mirrorsHD');
    } else if (m === 'walk' && isMirrorsHD) {
      useSceneStore.getState().toggleLayer('mirrorsHD');
    }
  }

  // OrbitControls imperative ref
  const ctrlRef = useRef<OrbitControlsImpl>(null!);

  // Walk state (refs — updated every frame, no re-render needed)
  const initialWalker = CHARACTERS.find(c => c.id === useSceneStore.getState().activeWalkerId) || CHARACTERS[0];
  const walkPos   = useRef({ x: initialWalker.pos[0], y: initialWalker.height * EYE_RATIO, z: initialWalker.pos[2] });
  const walkYaw   = useRef(initialWalker.rot);
  const walkPitch = useRef(0);
  const keys      = useRef(new Set<string>());
  const dragging  = useRef(false);

  // Saved perspective state for top-down → orbit restore
  const savedPerspPos    = useRef(new THREE.Vector3(...PERSP_POS));
  const savedPerspTarget = useRef(new THREE.Vector3(...PERSP_TARGET));
  // FOV sauvegardé avant entrée walk (restauré à la sortie)
  const savedFov         = useRef(50);
  const minimapThrottle  = useRef(0); // accumulateur pour throttler drawMinimap (~15fps)

  // ── Walk helpers ────────────────────────────────────────────────────────────

  /**
   * Recalcule la position et la visée (target) de la caméra lors de la marche :
   * - En mode FPV (1ère personne) : la caméra est exactement aux yeux du personnage (distanceBehind = 0, heightAbove = 0).
   * - En mode Walk (3ème personne / style GTA) : la caméra est décalée de 180 cm en arrière et 120 cm en hauteur au-dessus du walker.
   * - Calcul trigonométrique :
   *     camX = targetX - sin(yaw) * cos(pitch) * distance
   *     camY = targetY - sin(pitch) * distance + heightAbove
   *     camZ = targetZ - cos(yaw) * cos(pitch) * distance
   * - La cible de regard (target) est projetée 200 cm devant le regard du walker.
   */
  function updateWalkLook() {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    const cosP = Math.cos(walkPitch.current);

    // Position des yeux du personnage (point d'ancrage)
    const targetX = walkPos.current.x;
    const targetY = walkPos.current.y;
    const targetZ = walkPos.current.z;

    // Recul (GTA style) ou vue à la 1ère personne
    const isFPV = modeRef.current === 'fpv';
    const distanceBehind = isFPV ? 0 : 180;
    const heightAbove = isFPV ? 0 : 120;

    const camX = targetX - Math.sin(walkYaw.current) * cosP * distanceBehind;
    const camY = targetY - Math.sin(walkPitch.current) * distanceBehind + heightAbove;
    const camZ = targetZ - Math.cos(walkYaw.current) * cosP * distanceBehind;

    const lookDist = 200;
    ctrl.target.set(
      targetX + Math.sin(walkYaw.current) * cosP * lookDist,
      targetY + Math.sin(walkPitch.current) * lookDist,
      targetZ + Math.cos(walkYaw.current) * cosP * lookDist
    );
    camera.position.set(camX, camY, camZ);
    ctrl.update();
  }

  function enterWalk(x: number, z: number, walkMode: 'walk' | 'fpv' = 'walk') {
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
    changeMode(walkMode);
    invalidate(); // déclenche un frame pour que la minimap affiche l'icône
  }

  function exitWalkMode() {
    dragging.current = false;
    cameraState.isDragging = false;
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
    if (modeRef.current === 'walk' || modeRef.current === 'fpv') exitWalkMode();
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

  // Sync mode state with useSceneStore
  useEffect(() => {
    useSceneStore.setState({ cameraMode: mode });
    if (mode !== 'top') {
      useSceneStore.getState().setMeasurementActive(false);
    }
  }, [mode]);

  // Apply walk look after entering walk (mode ref is set, state follows)
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      cam.near = 0.1;
      cam.updateProjectionMatrix();
    }

    if (mode === 'walk' || mode === 'fpv') {
      // small delay to ensure OrbitControls has processed the enableRotate change
      requestAnimationFrame(() => updateWalkLook());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);



  function collideMove(curX: number, curZ: number, dx: number, dz: number): { x: number; z: number } {
    return { x: curX + dx, z: curZ + dz };
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Plane mode owns input — bail out so arrow/WASD don't move walker or camera.
      if (planeModeRef.current) return;
      
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      
      // Global shortcuts
      if (e.key === 'Escape') {
        if (modeRef.current === 'walk' || modeRef.current === 'fpv') exitWalkMode();
        else if (modeRef.current === 'top') exitTop();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        const laraGridActive = useSceneStore.getState().layers.laraGrid;
        if (laraGridActive) {
          document.dispatchEvent(new CustomEvent('toggle-lara-haircut'));
          return;
        }

        if (modeRef.current === 'walk' || modeRef.current === 'fpv') exitWalkMode();
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
      if (e.key === 'm' || e.key === 'M') {
        if (modeRef.current === 'orbit' || modeRef.current === 'top') {
          enterWalk(walkPos.current.x, walkPos.current.z, 'walk');
          appLog('system', '🎥 Mode Follow (3ème personne)');
        } else if (modeRef.current === 'walk') {
          enterWalk(walkPos.current.x, walkPos.current.z, 'fpv');
          appLog('system', '🎥 Mode FPV (1ère personne)');
        } else if (modeRef.current === 'fpv') {
          exitWalkMode();
          appLog('system', '🎥 Mode Vue Libre (Orbit)');
        }
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        const store = useSceneStore.getState();
        const laraCount = store.layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15);
        const visibleChars = CHARACTERS.filter(c => isCharacterVisibleInMode(c.id, laraCount, store.activeWalkerId));
        const currentIndex = visibleChars.findIndex(c => c.id === store.activeWalkerId);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % visibleChars.length;
        store.setActiveWalkerId(visibleChars[nextIndex].id);
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        const laraGridActive = useSceneStore.getState().layers.laraGrid;
        if (laraGridActive) {
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: 'animations/poses_idles/anim_t_pose.glb' } }));
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: 'animations/poses_idles/anim_t_pose.glb' } }));
        } else {
          modeRef.current === 'top' ? exitTop() : enterTop();
        }
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
      if (modeRef.current !== 'walk' && modeRef.current !== 'fpv') return;
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
      if (modeRef.current === 'walk' || modeRef.current === 'fpv') exitWalkMode();
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

    // Fallback: grab canvas from document
    const canvas = document.querySelector('canvas')!;

    let touchLastX = 0;
    let touchLastY = 0;

    const onDown  = (e: MouseEvent) => {
      if ((modeRef.current === 'walk' || modeRef.current === 'fpv') && e.button === 0) {
        dragging.current = true;
        cameraState.isDragging = true;
      }
    };
    const onUp    = () => {
      dragging.current = false;
      cameraState.isDragging = false;
    };
    const onMove  = (e: MouseEvent) => {
      if (!dragging.current || (modeRef.current !== 'walk' && modeRef.current !== 'fpv')) return;
      walkYaw.current   -= e.movementX * MOUSE_SENS;
      walkPitch.current  = Math.max(-1.4, Math.min(1.4, walkPitch.current - e.movementY * MOUSE_SENS));
      updateWalkLook();
      invalidate();
    };

    // ── Mobile Touch controls (Walk orientation) ────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if ((modeRef.current === 'walk' || modeRef.current === 'fpv') && e.touches.length === 1) {
        dragging.current = true;
        cameraState.isDragging = true;
        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || (modeRef.current !== 'walk' && modeRef.current !== 'fpv') || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchLastX;
      const dy = e.touches[0].clientY - touchLastY;
      touchLastX = e.touches[0].clientX;
      touchLastY = e.touches[0].clientY;

      const TOUCH_SENS = MOUSE_SENS * 1.5;
      walkYaw.current   -= dx * TOUCH_SENS;
      walkPitch.current  = Math.max(-1.4, Math.min(1.4, walkPitch.current - dy * TOUCH_SENS));
      updateWalkLook();
      invalidate();
    };

    const onTouchEnd = () => {
      dragging.current = false;
      cameraState.isDragging = false;
    };

    // Scroll wheel en walk = FOV (zoom). Range 30°–110°.
    const onWheel = (e: WheelEvent) => {
      if (modeRef.current !== 'walk' && modeRef.current !== 'fpv') return;
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

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup',   onUp);
      document.removeEventListener('mousemove', onMove);

      canvas.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);

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

    cameraState.camX     = camera.position.x;
    cameraState.camZ     = camera.position.z;
    cameraState.isWalking = modeRef.current === 'walk' || modeRef.current === 'fpv';
    cameraState.isMoving  = (cameraState.isWalking && keys.current.size > 0)
      || (modeRef.current === 'orbit' && (keys.current.has('ArrowUp') || keys.current.has('ArrowDown')));

    if (cameraState.isWalking) {
      if (!cameraState.isAIControlled) {
        cameraState.walkYaw   = walkYaw.current;
        cameraState.walkPitch = walkPitch.current;
      }

      // Sync walker position for minimap in walk mode
      if (!cameraState.isAIControlled) {
        cameraState.walkerX = walkPos.current.x;
        cameraState.walkerZ = walkPos.current.z;
      }
      updateWalkLook();
      
      // Update store for DevTools
      useSceneStore.getState().setCameraMode(mode);
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
      yaw: cameraState.walkerYaw
    };

    // Throttle minimap redraw à ~15fps (67ms) — drawFloorPlan est coûteux
    minimapThrottle.current += delta;
    if (minimapThrottle.current >= 0.067) {
      minimapThrottle.current = 0;
      cameraState.onUpdate?.();
    }

    // ── Orbit mode keyboard navigation (Google Earth style) ─────────────────────
    if (modeRef.current === 'orbit' && keys.current.size > 0) {
      const k   = keys.current;
      const ctrl = ctrlRef.current;
      invalidate();

      // Plain arrows — move active walker
      const isPlainMove = k.has('ArrowLeft') || k.has('ArrowRight') || k.has('ArrowUp') || k.has('ArrowDown');
      if (isPlainMove) {
        cameraState.lastUserControlTime = performance.now();
      }

      if (k.has('ArrowLeft'))  cameraState.walkYaw += 0.03 * dt;
      if (k.has('ArrowRight')) cameraState.walkYaw -= 0.03 * dt;
      const wYaw = cameraState.walkYaw;
      const ws   = WALK_SPEED * dt;
      {
        let wdx = 0, wdz = 0;
        if (k.has('ArrowUp'))   { wdx += Math.sin(wYaw)*ws; wdz += Math.cos(wYaw)*ws; }
        if (k.has('ArrowDown')) { wdx -= Math.sin(wYaw)*ws; wdz -= Math.cos(wYaw)*ws; }
        if (wdx !== 0 || wdz !== 0) {
          const c = collideMove(cameraState.walkerX, cameraState.walkerZ, wdx, wdz);
          cameraState.walkerX = c.x; cameraState.walkerZ = c.z;
          // Sync walkPos for potential entry into walk mode
          walkPos.current.x = c.x;
          walkPos.current.z = c.z;
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

    if (modeRef.current !== 'walk' && modeRef.current !== 'fpv') return;
    if (cameraState.isAIControlled) {
      walkPos.current.x = cameraState.walkerX;
      walkPos.current.z = cameraState.walkerZ;
      walkYaw.current = cameraState.walkerYaw;
      updateWalkLook();
      return;
    }

    if (keys.current.size === 0) return;

    // Keep rendering while keys are held in walk mode
    invalidate();

    cameraState.lastUserControlTime = performance.now();

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
        enableDamping={mode !== 'walk'}
        dampingFactor={0.08}
        maxPolarAngle={Math.PI}
        enabled={!planeMode}
        enableRotate={!planeMode && mode !== 'top'}
        screenSpacePanning={mode !== 'walk'}
        mouseButtons={mode === 'top' ? {
          LEFT:   THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT:  THREE.MOUSE.ROTATE,
        } : undefined}
      />


    </>
  );
}
