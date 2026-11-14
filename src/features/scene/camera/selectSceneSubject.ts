import { useSceneStore } from '../store/useSceneStore';

/** Sélectionne un sujet caméra dans la scène et synchronise le personnage actif si nécessaire. */
export function selectSceneSubject(id: string, cameraSubject: string) {
  if (cameraSubject === 'character') useSceneStore.getState().setActiveCharacterId(id);
  document.dispatchEvent(new CustomEvent('camera-subject', { detail: cameraSubject }));
}
