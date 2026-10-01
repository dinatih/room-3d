/**
 * DoorsPlaced.tsx — Portes placées en coordonnées monde (séjour, SDB, entrée, baie vitrée).
 */
import { useMemo } from 'react';
import { DoorLiving, DoorBath } from '../items/DoorWhite';
import { DoorEntry }            from '../items/DoorEntry';
import { GlassDoor }            from '../items/GlassDoor';
import { NOOP_ITEM, NOOP_SIZE } from '../sceneItem';
import { useFurnitureToggles }  from '../utils/useFurnitureToggles';
import { useSceneStore }        from '../store/useSceneStore';
import { pEast, pWest, pZ, pX, DOOR_START, DOOR_END, DiagWall } from '../wallData';

const DOOR_W_ENTRY = 90;

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
      wy:       0,
      wz:       center.z,
      diagRotY: DiagWall.rotY - Math.PI / 2,
    };
  }, []);

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
        <GlassDoor item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[(DOOR_START + DOOR_END) / 2, 0, pZ('door-living-w')]}
        userData={{ animUnit: true, itemName: 'Porte séjour', hoverAction: { label: 'Porte séjour', actionId: 'livingDoor' } }}>
        <DoorLiving item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[pX('door-bath-n'), 0, (pZ('door-bath-n') + pZ('door-bath-s')) / 2]}
        rotation-y={Math.PI / 2}
        userData={{ animUnit: true, itemName: 'Porte SDB', hoverAction: { label: 'Porte SDB', actionId: 'bathroomDoor' } }}>
        <DoorBath item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
      <group
        position={[entry.wx, entry.wy, entry.wz]}
        rotation-y={entry.diagRotY}
        userData={{ animUnit: true, itemName: 'Porte entrée', hoverAction: { label: 'Porte entrée', actionId: 'entryDoor' } }}>
        <DoorEntry item={NOOP_ITEM} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
