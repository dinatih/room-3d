import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneStore, resolveStoreKey } from '../store/useSceneStore';

/**
 * Écoute l'état réactif centralisé dans le store Zustand et mappe les clés
 * vers les états réactifs correspondants pour le mobilier et la scène 3D.
 *
 * Le format attendu est { 'event-key': 'event-key' } (kebab-case uniforme).
 * resolveStoreKey() traduit automatiquement vers la vraie propriété du store.
 */
export function useFurnitureToggles(map: Record<string, string>): Record<string, any> {
  const { invalidate } = useThree();
  const furniture = useSceneStore(state => state.furniture);
  const extraStates = useSceneStore(state => state.extraStates);

  const state: Record<string, any> = {};
  for (const [rawKey, uiKey] of Object.entries(map)) {
    // Résoudre la clé via le mapping du store (supporte kebab-case ET camelCase)
    const resolved = resolveStoreKey(rawKey);
    let val: any;
    if (resolved.type === 'furniture') {
      val = (furniture as any)[resolved.name];
    } else if (resolved.type === 'extra') {
      val = (extraStates as any)[resolved.name];
    }
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


