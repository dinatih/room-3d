import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneStore, resolveStoreKey } from '../store/useSceneStore';

/**
 * Écoute l'état réactif centralisé dans le store Zustand et retourne un objet
 * indexé par event-key pour chaque clé demandée.
 *
 * Usage : useFurnitureToggles(['lamp-bath-toggle', 'corr-doors-toggle'])
 * → retourne { 'lamp-bath-toggle': boolean, 'corr-doors-toggle': boolean, … }
 *
 * resolveStoreKey() traduit automatiquement chaque event-key vers la vraie
 * propriété du store (ex: 'lamp-bath-toggle' → furniture.lampBath).
 */
export function useFurnitureToggles(keys: string[]): Record<string, any> {
  const { invalidate } = useThree();
  const furniture = useSceneStore(state => state.furniture);
  const extraStates = useSceneStore(state => state.extraStates);

  const state: Record<string, any> = {};
  for (const key of keys) {
    const resolved = resolveStoreKey(key);
    let val: any;
    if (resolved.type === 'furniture') {
      val = (furniture as any)[resolved.name];
    } else if (resolved.type === 'extra') {
      val = (extraStates as any)[resolved.name];
    }
    if (val !== undefined) {
      state[key] = val;
    }
  }

  // Force le rafraîchissement du Canvas R3F quand une valeur change
  const valuesHash = Object.values(state).join(',');
  useEffect(() => {
    invalidate();
  }, [valuesHash, invalidate]);

  return state;
}
