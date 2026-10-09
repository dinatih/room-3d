import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { cameraState } from './cameraState';
import { useSceneStore } from './store/useSceneStore';
import { isAgentInBathroom, isAgentInCorridor } from './ai/SpatialZone';

const SHUTOFF_DELAY_MS = 4000;

/**
 * PresenceLightController — Contrôle automatique des lampes de la SDB et du couloir
 * par capteurs de présence.
 *
 * Règle :
 * - Quand un agent entre dans la pièce, la lampe s'allume immédiatement.
 * - Quand la pièce se vide (aucun agent à l'intérieur), un compte à rebours de 4 secondes
 *   est déclenché.
 * - Si un agent entre pendant ces 4 secondes, le compte à rebours est annulé.
 * - Après 4 secondes consécutives sans personne, la lampe s'éteint.
 */
export function PresenceLightController() {
  const bathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const corridorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bathTimerRef.current !== null) {
        clearTimeout(bathTimerRef.current);
        bathTimerRef.current = null;
      }
      if (corridorTimerRef.current !== null) {
        clearTimeout(corridorTimerRef.current);
        corridorTimerRef.current = null;
      }
    };
  }, []);

  useFrame(() => {
    // Récupération des positions des personnages/agents actifs dans la scène
    const positions = Object.values(cameraState.positions);
    if (
      positions.length === 0 &&
      cameraState.characterX !== undefined &&
      cameraState.characterZ !== undefined
    ) {
      positions.push({ x: cameraState.characterX, y: 0, z: cameraState.characterZ, yaw: 0 });
    }

    const bathOccupants = positions.filter(isAgentInBathroom).length;
    const corridorOccupants = positions.filter(isAgentInCorridor).length;

    const { furniture } = useSceneStore.getState();

    // ── 1. Salle de bain (lampBath) ──
    if (bathOccupants > 0) {
      if (bathTimerRef.current !== null) {
        clearTimeout(bathTimerRef.current);
        bathTimerRef.current = null;
      }
      if (!furniture.lampBath) {
        useSceneStore.setState((s) => ({
          furniture: { ...s.furniture, lampBath: true },
        }));
        cameraState.invalidate?.();
      }
    } else {
      if (!furniture.lampBath && bathTimerRef.current !== null) {
        clearTimeout(bathTimerRef.current);
        bathTimerRef.current = null;
      } else if (furniture.lampBath && bathTimerRef.current === null) {
        bathTimerRef.current = setTimeout(() => {
          bathTimerRef.current = null;
          const currentPositions = Object.values(cameraState.positions);
          const stillOccupied = currentPositions.some(isAgentInBathroom);
          if (!stillOccupied && useSceneStore.getState().furniture.lampBath) {
            useSceneStore.setState((s) => ({
              furniture: { ...s.furniture, lampBath: false },
            }));
            cameraState.invalidate?.();
          }
        }, SHUTOFF_DELAY_MS);
      }
    }

    // ── 2. Couloir (lampCorridor) ──
    if (corridorOccupants > 0) {
      if (corridorTimerRef.current !== null) {
        clearTimeout(corridorTimerRef.current);
        corridorTimerRef.current = null;
      }
      if (!furniture.lampCorridor) {
        useSceneStore.setState((s) => ({
          furniture: { ...s.furniture, lampCorridor: true },
        }));
        cameraState.invalidate?.();
      }
    } else {
      if (!furniture.lampCorridor && corridorTimerRef.current !== null) {
        clearTimeout(corridorTimerRef.current);
        corridorTimerRef.current = null;
      } else if (furniture.lampCorridor && corridorTimerRef.current === null) {
        corridorTimerRef.current = setTimeout(() => {
          corridorTimerRef.current = null;
          const currentPositions = Object.values(cameraState.positions);
          const stillOccupied = currentPositions.some(isAgentInCorridor);
          if (!stillOccupied && useSceneStore.getState().furniture.lampCorridor) {
            useSceneStore.setState((s) => ({
              furniture: { ...s.furniture, lampCorridor: false },
            }));
            cameraState.invalidate?.();
          }
        }, SHUTOFF_DELAY_MS);
      }
    }
  });

  return null;
}
