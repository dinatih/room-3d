/**
 * DoorsPlaced.tsx — Portes placées en coordonnées monde (séjour, SDB, entrée, baie vitrée).
 */
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoorLiving, DoorBath } from '../items/DoorWhite';
import { DoorEntry }            from '../items/DoorEntry';
import { GlassDoor }            from '../items/GlassDoor';
import { NOOP_ITEM, NOOP_SIZE } from '../sceneItem';
import { useFurnitureToggles }  from '../utils/useFurnitureToggles';
import { useSceneStore }        from '../store/useSceneStore';
import { cameraState }          from '../cameraState';
import { pEast, pWest, CORR_WALL_X, PARTITION_THICKNESS } from '../wallData';
import {
  ROOM_D, DOOR_START, DOOR_END, DiagWall
} from '@config';

const DOOR_W_ENTRY = 90;
const DOOR_HEIGHT  = 204;

const OPEN_RADIUS  = 115; // Rayon de détection d'approche pour ouverture automatique (cm)
const CLOSE_RADIUS = 145; // Rayon au-delà duquel la porte se referme (cm)
const CLOSE_DELAY  = 1.0; // Délai d'attente (secondes) avant fermeture automatique

interface AutoDoorState {
  entryDoor: boolean;
  livingDoor: boolean;
  bathroomDoor: boolean;
  eastGlassDoor: boolean;
}

export function DoorsPlaced() {
  const layers = useSceneStore(state => state.layers);
  const as = useFurnitureToggles([
    'east-glass-door-toggle',
    'living-door-toggle',
    'bathroom-door-toggle',
    'entry-door-toggle',
    'glass-door-v2-left-open',
    'glass-door-v2-shutter-pos',
  ]);

  const entry = useMemo(() => {
    const center = DiagWall.p(DiagWall.door.start + DOOR_W_ENTRY / 2, 5);
    return {
      wx:       center.x,
      wy:       DOOR_HEIGHT / 2,
      wz:       center.z,
      diagRotY: DiagWall.rotY - Math.PI / 2,
    };
  }, []);

  const [autoOpen, setAutoOpen] = useState<AutoDoorState>({
    entryDoor: false,
    livingDoor: false,
    bathroomDoor: false,
    eastGlassDoor: false,
  });

  const autoOpenRef = useRef<AutoDoorState>({
    entryDoor: false,
    livingDoor: false,
    bathroomDoor: false,
    eastGlassDoor: false,
  });

  const closeTimersRef = useRef({
    entryDoor: 0,
    livingDoor: 0,
    bathroomDoor: 0,
    eastGlassDoor: 0,
  });

  const doorPositions = useMemo(() => [
    { key: 'entryDoor' as const, x: entry.wx, z: entry.wz },
    { key: 'livingDoor' as const, x: (DOOR_START + DOOR_END) / 2, z: ROOM_D + PARTITION_THICKNESS / 2 },
    { key: 'bathroomDoor' as const, x: CORR_WALL_X, z: 560 },
    { key: 'eastGlassDoor' as const, x: (pEast('glass-west') + pWest('glass-east')) / 2, z: 0 },
  ], [entry]);

  // Gestion automatique de l'ouverture des portes à l'approche des PNJ ou du joueur
  useFrame((_, delta) => {
    const charPositions: Array<{ x: number; z: number }> = [];
    const positions = cameraState.positions;
    for (const id in positions) {
      const p = positions[id];
      if (p) charPositions.push(p);
    }
    if (cameraState.isWalking) {
      charPositions.push({ x: cameraState.walkerX, z: cameraState.walkerZ });
    }

    let stateChanged = false;

    for (const d of doorPositions) {
      let isNearby = false;
      let isFar = true;

      for (let i = 0; i < charPositions.length; i++) {
        const cp = charPositions[i];
        const dist = Math.hypot(cp.x - d.x, cp.z - d.z);
        if (dist <= OPEN_RADIUS) {
          isNearby = true;
          isFar = false;
          break;
        }
        if (dist < CLOSE_RADIUS) {
          isFar = false;
        }
      }

      if (isNearby) {
        closeTimersRef.current[d.key] = 0;
        if (!autoOpenRef.current[d.key]) {
          autoOpenRef.current[d.key] = true;
          stateChanged = true;
        }
      } else if (autoOpenRef.current[d.key]) {
        if (isFar) {
          closeTimersRef.current[d.key] += delta;
          if (closeTimersRef.current[d.key] >= CLOSE_DELAY) {
            autoOpenRef.current[d.key] = false;
            closeTimersRef.current[d.key] = 0;
            stateChanged = true;
          }
        } else {
          closeTimersRef.current[d.key] = 0;
        }
      }
    }

    if (stateChanged) {
      setAutoOpen({ ...autoOpenRef.current });
    }
  });

  const effectiveActionState = useMemo(() => ({
    ...as,
    'entry-door-toggle': as['entry-door-toggle'] || autoOpen.entryDoor,
    'living-door-toggle': as['living-door-toggle'] || autoOpen.livingDoor,
    'bathroom-door-toggle': as['bathroom-door-toggle'] || autoOpen.bathroomDoor,
    'east-glass-door-toggle': as['east-glass-door-toggle'] || autoOpen.eastGlassDoor,
  }), [as, autoOpen]);

  return (
    <group visible={layers.doors}>
      <group
        position={[(pEast('glass-west') + pWest('glass-east')) / 2, 105, 0]}
        userData={{
          animUnit: true,
          itemName: 'Porte-fenêtre double vitrée',
          hoverAction: {
            label: 'Porte-fenêtre',
            actions: ['eastGlassDoor', 'glassDoorLeftOpen', 'glassDoorShutter']
          }
        }}>
        <GlassDoor item={NOOP_ITEM} actionState={effectiveActionState} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[(DOOR_START + DOOR_END) / 2, DOOR_HEIGHT / 2, ROOM_D + PARTITION_THICKNESS / 2]}
        userData={{ animUnit: true, itemName: 'Porte séjour', hoverAction: { label: 'Porte séjour', actionId: 'livingDoor' } }}>
        <DoorLiving item={NOOP_ITEM} actionState={effectiveActionState} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[CORR_WALL_X, DOOR_HEIGHT / 2, 560]}
        rotation-y={Math.PI / 2}
        userData={{ animUnit: true, itemName: 'Porte SDB', hoverAction: { label: 'Porte SDB', actionId: 'bathroomDoor' } }}>
        <DoorBath item={NOOP_ITEM} actionState={effectiveActionState} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[entry.wx, entry.wy, entry.wz]}
        rotation-y={entry.diagRotY}
        userData={{ animUnit: true, itemName: 'Porte entrée', hoverAction: { label: 'Porte entrée', actionId: 'entryDoor' } }}>
        <DoorEntry item={NOOP_ITEM} actionState={effectiveActionState} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
