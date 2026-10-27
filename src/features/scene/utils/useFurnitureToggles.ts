import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useShallow } from 'zustand/react/shallow';
import { useSceneStore, getSceneActionValue } from '../store/useSceneStore';

/** Lit uniquement les actions demandées, avec les mêmes identifiants que les previews. */
export function useFurnitureToggles(keys: string[]): Record<string, any> {
  const { invalidate } = useThree();
  const values = useSceneStore(useShallow(state => Object.fromEntries(
    keys.map(key => [key, getSceneActionValue(key, state)]),
  )));
  useEffect(() => { invalidate(); }, [values, invalidate]);
  return values;
}
