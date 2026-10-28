import type { CameraMode, CameraTarget } from './types';

/** IDs match the poses published by animals and RobotPlacements. */
export const CAMERA_SUBJECTS = [
  { id: 'character', target: 'character', label: 'Personnage actif', icon: 'bi-person-bounding-box' },
  { id: 'drone', target: 'hornet', label: 'Hornet', icon: 'bi-airplane' },
  { id: 'shiba', target: 'ushiro', label: 'Ushiro', icon: 'bi-heart' },
  { id: 'ulotte', target: 'ulotte', label: 'Ulotte', icon: 'bi-heart' },
  { id: 'robin', target: 'bird', label: 'Oiseau', icon: 'bi-twitter' },
  { id: 'unitree-g1', target: 'g1', label: 'G1', icon: 'bi-robot' },
  { id: 'unitree-go2', target: 'go2', label: 'Go2', icon: 'bi-robot' },
  { id: 'unitree-as2w', target: 'as2', label: 'As2', icon: 'bi-robot' },
  { id: 'microduck', target: 'microduck', label: 'Microduck', icon: 'bi-robot' },
  { id: 'raph-rover', target: 'raph', label: 'Raph', icon: 'bi-robot' },
  { id: 'unitree-h2', target: 'h2', label: 'H2', icon: 'bi-robot' },
  { id: 'jumper-robot', target: 'jumper', label: 'Jumper', icon: 'bi-robot' },
] as const;

export type CameraSubjectId = typeof CAMERA_SUBJECTS[number]['id'] | 'jikin' | 'tosakin' | 'cat';

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
