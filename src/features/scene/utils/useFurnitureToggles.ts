import { useState, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Écoute l'événement personnalisé 'furniture-toggle' et mappe les clés d'événement
 * vers les états réactifs correspondants.
 * Évite les duplications de listeners d'événements dans le mobilier et la scène 3D.
 */
export function useFurnitureToggles(map: Record<string, string>): Record<string, boolean> {
  const [state, setState] = useState<Record<string, boolean>>({});
  const { invalidate } = useThree();

  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    const handler = (e: Event) => {
      const { key } = (e as CustomEvent).detail as { key: string };
      const stateKey = mapRef.current[key];
      if (!stateKey) return;
      setState(prev => ({ ...prev, [stateKey]: !prev[stateKey] }));
      invalidate();
    };
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, [invalidate]);

  return state;
}

