import { useSceneStore } from '../store/useSceneStore';
import type { CameraMode, CameraTarget } from './types';

export const CHARACTER_CONTROL_ANIMATIONS = {
  Elevate: 'miley-armature-cheer-feminine-jump',
  Descend: 'miley-armature-fall-down-f',
} as const;

/** IDs match the poses published by animals and RobotPlacements. */
export const CAMERA_SUBJECTS = [
  { id: 'character', target: 'character', label: 'Personnage actif', icon: 'bi-person-bounding-box', category: 'Personnages' },
  { id: 'drone', target: 'hornet', label: 'Hornet', icon: 'bi-airplane', category: 'Robots' },
  { id: 'ring-drone-cam', target: 'ring-drone-cam', label: 'Ring Drone', icon: 'bi-airplane', category: 'Robots' },
  { id: 'shiba', target: 'ushiro', label: 'Ushiro', icon: 'bi-heart', category: 'Animaux' },
  { id: 'ulotte', target: 'ulotte', label: 'Ulotte', icon: 'bi-heart', category: 'Animaux' },
  { id: 'robin', target: 'bird', label: 'Oiseau', icon: 'bi-twitter', category: 'Animaux' },
  { id: 'unitree-g1', target: 'g1', label: 'G1', icon: 'bi-robot', category: 'Robots' },
  { id: 'unitree-as2w', target: 'as2', label: 'As2', icon: 'bi-robot', category: 'Robots' },
  { id: 'microduck', target: 'microduck', label: 'Microduck', icon: 'bi-robot', category: 'Robots' },
  { id: 'raph-rover', target: 'raph', label: 'Raph', icon: 'bi-robot', category: 'Robots' },
  { id: 'unitree-h2', target: 'h2', label: 'H2', icon: 'bi-robot', category: 'Robots' },
  { id: 'jumper-robot', target: 'jumper', label: 'Jumper', icon: 'bi-robot', category: 'Robots' },
] as const;

export type CameraSubjectId = typeof CAMERA_SUBJECTS[number]['id'] | 'jikin' | 'tosakin' | 'cat';
export function isFlyingSubject(id: string | null): boolean {
  return id === 'drone' || id === 'robin' || id === 'ring-drone-cam';
}

export function resolveCameraSubject(value: string): CameraSubjectId | undefined {
  const choice = CAMERA_SUBJECTS.find(subject => subject.id === value || subject.target === value);
  if (choice) return choice.id;
  if (value === 'dog') return 'shiba';
  if (value === 'jikin' || value === 'tosakin' || value === 'cat') return value;
}

/** The selected subject is observed only while a follow/FPV camera is active. */
export function selectAnimalCameraTarget({ cameraMode, cameraTarget }: { cameraMode: CameraMode | 'plane'; cameraTarget: CameraTarget }): CameraSubjectId | null {
  if (cameraMode !== 'follow' && cameraMode !== 'fpv') return null;
  const subject = resolveCameraSubject(cameraTarget);
  return subject && subject !== 'character' ? subject : null;
}

export function selectSceneSubject(id: string, cameraSubject: string) {
  if (cameraSubject === 'character') useSceneStore.getState().setActiveCharacterId(id);
  document.dispatchEvent(new CustomEvent('camera-subject', { detail: cameraSubject }));
}
