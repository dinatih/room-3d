import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '../store/useSceneStore';

/**
 * Écoute l'état réactif centralisé dans le store Zustand et mappe les clés
 * vers les états réactifs correspondants pour le mobilier et la scène 3D.
 */
export function useFurnitureToggles(map: Record<string, string>): Record<string, any> {
  const { invalidate } = useThree();
  const furniture = useSceneStore(state => state.furniture);
  const extraStates = useSceneStore(state => state.extraStates);

  const state: Record<string, any> = {};
  for (const [storeKey, uiKey] of Object.entries(map)) {
    const val = (furniture as any)[storeKey] ?? (extraStates as any)[storeKey];
    if (val !== undefined) {
      state[uiKey] = val;
    }
  }

  // Force le rafraîchissement du Canvas R3F quand une valeur change
  const valuesHash = Object.values(state).join(',');
  useEffect(() => {
    invalidate();
  }, [valuesHash, invalidate]);

  return state;
}


