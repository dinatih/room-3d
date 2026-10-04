/**
 * cameraIntroTransition.ts
 *
 * Gère l'animation de transition cinématique fluide (plongée / dive de 1.35s)
 * entre le fond 2D Ciel de Paris (page de préchargement) et la première frame
 * de la scène 3D (selon le mode : orbit, fpv, top, walk).
 */
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { cameraState } from '../cameraState';
import { CX, CZ, PERSP_POS, PERSP_TARGET, activeWalkH } from './cameraConstants';
import type { CameraMode } from './types';

export interface IntroPose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
}

/** Pose initiale en altitude dans le ciel calée sur l'horizon du panorama Ciel de Paris */
export const SKY_START_POS = new THREE.Vector3(150, 1600, -850);
export const SKY_START_TARGET = new THREE.Vector3(150, 750, 800);

export const INTRO_DURATION_SEC = 1.35;

/** Calcule la pose cible exacte de la caméra en fonction du mode actif */
export function getIntroTargetPose(mode: CameraMode): IntroPose {
  if (mode === 'top') {
    const targetX = cameraState.walkerX ?? CX;
    const targetZ = cameraState.walkerZ ?? CZ;
    return {
      pos: new THREE.Vector3(targetX, 2000, targetZ),
      target: new THREE.Vector3(targetX, 0, targetZ),
    };
  }

  if (mode === 'fpv') {
    if (cameraState.activeEyesPos && cameraState.activeHeadForward) {
      const eyes = cameraState.activeEyesPos;
      const fwd = cameraState.activeHeadForward;
      const eyeX = eyes.x + fwd.x * 2.0;
      const eyeY = eyes.y + fwd.y * 2.0;
      const eyeZ = eyes.z + fwd.z * 2.0;
      return {
        pos: new THREE.Vector3(eyeX, eyeY, eyeZ),
        target: new THREE.Vector3(eyeX + fwd.x * 200, eyeY + fwd.y * 200, eyeZ + fwd.z * 200),
      };
    }
    const wX = cameraState.walkerX ?? CX;
    const wZ = cameraState.walkerZ ?? CZ;
    const wH = activeWalkH();
    const yaw = cameraState.walkerYaw ?? 0;
    return {
      pos: new THREE.Vector3(wX, wH, wZ),
      target: new THREE.Vector3(wX + Math.sin(yaw) * 200, wH, wZ + Math.cos(yaw) * 200),
    };
  }

  if (mode === 'walk') {
    const wX = cameraState.walkerX ?? CX;
    const wZ = cameraState.walkerZ ?? CZ;
    const wH = activeWalkH();
    const yaw = cameraState.walkerYaw ?? 0;
    const dist = 360;
    const pitch = 0.35;
    const camX = wX - Math.sin(yaw) * Math.cos(pitch) * dist;
    const camY = Math.max(15, wH * 0.75 + Math.sin(pitch) * dist);
    const camZ = wZ - Math.cos(yaw) * Math.cos(pitch) * dist;
    return {
      pos: new THREE.Vector3(camX, camY, camZ),
      target: new THREE.Vector3(wX, wH * 0.75, wZ),
    };
  }

  // Mode Orbit par défaut
  return {
    pos: new THREE.Vector3(...PERSP_POS),
    target: new THREE.Vector3(...PERSP_TARGET),
  };
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class CameraIntroController {
  private camera: THREE.Camera;
  private ctrl: OrbitControlsImpl;
  private isRunning = false;
  private elapsed = 0;
  private startPose: IntroPose = {
    pos: SKY_START_POS.clone(),
    target: SKY_START_TARGET.clone(),
  };
  private targetPose: IntroPose = {
    pos: new THREE.Vector3(...PERSP_POS),
    target: new THREE.Vector3(...PERSP_TARGET),
  };
  private onCompleteCallback: (() => void) | null = null;
  private cleanupListeners: (() => void) | null = null;

  constructor(camera: THREE.Camera, ctrl: OrbitControlsImpl) {
    this.camera = camera;
    this.ctrl = ctrl;
  }

  public start(mode: CameraMode, onComplete: () => void) {
    if (this.isRunning) return;

    this.isRunning = true;
    cameraState.isIntroRunning = true;
    this.elapsed = 0;
    this.onCompleteCallback = onComplete;

    // Point de départ : position et cible actuelles de la caméra (ou le ciel par défaut)
    this.startPose.pos.copy(this.camera.position);
    this.startPose.target.copy(this.ctrl.target);

    // Cible finale selon le mode
    this.targetPose = getIntroTargetPose(mode);

    // Enregistrer le callback de skip dans cameraState
    cameraState.skipIntro = () => this.finish(true);

    // Écouteurs de skip au clic ou à l'appui d'une touche
    const handleSkip = (e: Event) => {
      // Ignorer si clic sur un lien externe ou un bouton spécifique
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'A') return;
      this.finish(true);
    };

    window.addEventListener('pointerdown', handleSkip, { passive: true });
    window.addEventListener('keydown', handleSkip, { passive: true });

    this.cleanupListeners = () => {
      window.removeEventListener('pointerdown', handleSkip);
      window.removeEventListener('keydown', handleSkip);
    };
  }

  public update(delta: number): boolean {
    if (!this.isRunning) return false;

    this.elapsed += delta;
    const progress = Math.min(1, this.elapsed / INTRO_DURATION_SEC);
    const ease = easeInOutCubic(progress);

    this.camera.position.lerpVectors(this.startPose.pos, this.targetPose.pos, ease);
    this.ctrl.target.lerpVectors(this.startPose.target, this.targetPose.target, ease);
    this.ctrl.update();

    if (progress >= 1) {
      this.finish(false);
      return false;
    }

    return true;
  }

  public finish(skipped = false) {
    if (!this.isRunning) return;

    this.isRunning = false;
    cameraState.isIntroRunning = false;
    cameraState.skipIntro = null;

    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }

    // Caler définitivement la caméra sur la pose cible
    this.camera.position.copy(this.targetPose.pos);
    this.ctrl.target.copy(this.targetPose.target);
    this.ctrl.update();

    window.dispatchEvent(new CustomEvent('camera-intro-finished', { detail: { skipped } }));

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  public destroy() {
    this.finish(true);
  }
}
