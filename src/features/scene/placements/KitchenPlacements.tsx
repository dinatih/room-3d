import { useEffect, useState } from 'react';
import { PositionTransition } from '../utils/PositionTransition';
import { getKitchenTrashParking, KITCHEN_TRASH_POSITION } from '../ai/diyChairClearance';
import { NavigationObstacle } from '../ai/navigation/NavigationObstacle';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { MergedStaticGroup } from '../Building';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { CuisineGroup, CuisineDrona, CuisineLillhavet } from '../items/CuisineGroup';
import { KallaxCuisine, KallaxCuisineDrona } from '../items/KallaxCuisine';
import { KALLAX_CUISINE_POSITION, KALLAX_CUISINE_ROTATION } from '../items/kallaxCuisineDrona';
import { TrashBin } from '../items/TrashBin';
import { Tackan } from '../items/Tackan';
import { Ikea36590066708 } from '../items/Ikea36590066708';
import { Kolvatten00594176 } from '../items/Kolvatten00594176';
import { useSceneStore } from '../store/useSceneStore';

import {
  ROOM_D,
  KITCHEN_WEST_WALL,
  KITCHEN_SOUTH_WALL,
} from '../wallData';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

const w2 = 75.5;
const KALLAX_DEPTH = 39;
const KALLAX_FRAME = 3.5;
const KALLAX_DIVIDER = 1.5;
const KALLAX_CELL_WIDTH = (w2 - 2 * KALLAX_FRAME - KALLAX_DIVIDER) / 2;
const KALLAX_UPPER_CELL_BASE = 2 * 76.5 + KALLAX_FRAME;
const IKEA365_COUNT = 3;
const IKEA365_LENGTH = 17;

export function KitchenEquipment() {
  return (
    <MergedStaticGroup name="merged-kitchen-equipment">
      {/* Meubles Cuisine (évier, structure) */}
      <group position={[KITCHEN_WEST_WALL, 0, ROOM_D]} userData={{ skipMerge: true, animUnit: true, itemName: 'Meubles Cuisine' }}>
        <NavigationObstacle id="cuisine-group"><CuisineGroup item={stub('cuisine-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} noDrona /></NavigationObstacle>
      </group>
    </MergedStaticGroup>
  );
}

// Pass 1 — Furniture (Structure & gros volumes)
export function KitchenFurniture() {
  const as = useFurnitureToggles([
    'ninja',
  ]);

  return (
    <MergedStaticGroup name="merged-kitchen-furniture">
      {/* Kallax Cuisine en séparation (structure sans Drona) */}
      <group position={KALLAX_CUISINE_POSITION} rotation={[0, KALLAX_CUISINE_ROTATION, 0]} userData={{ skipMerge: true, animUnit: true, itemName: 'Kallax Cuisine' }}>
        <NavigationObstacle id="kallax-cuisine"><KallaxCuisine item={stub('kallax-sw-stack')} actionState={as} onSize={NOOP_SIZE} noDrona /></NavigationObstacle>
      </group>

      {/* Poubelle TATAY — angle KallaxCuisine × Mackapar */}
      <KitchenTrashBin />
    </MergedStaticGroup>
  );
}

export function KitchenTrashBin() {
  const actionState = useFurnitureToggles(['bin-toggle']);
  const [parking, setParking] = useState(getKitchenTrashParking);
  useEffect(() => {
    const update = () => setParking(getKitchenTrashParking());
    document.addEventListener('kitchen-trash-clearance', update);
    return () => document.removeEventListener('kitchen-trash-clearance', update);
  }, []);
  const p = parking ?? KITCHEN_TRASH_POSITION;
  return <PositionTransition furnitureKey="trash-bin-position" x={p.x} z={p.z} ry={p.ry}>
    <group userData={{ animUnit: true, itemName: 'Poubelle Tatay' }}>
      <NavigationObstacle id="trash-bin"><TrashBin item={stub('trash-bin')} actionState={actionState} onSize={NOOP_SIZE} /></NavigationObstacle>
    </group>
  </PositionTransition>;
}

// Pass 2 — Furnishings (Habillage & confort fonctionnel)
export function KitchenFurnishings() {
  const as = useFurnitureToggles(['lamp-kitchen-toggle']);
  const lightsHD = useSceneStore(state => state.layers.lightsHD);
  const isKitchenLampOn = Boolean(as['lamp-kitchen-toggle']);

  return (
    <MergedStaticGroup name="merged-kitchen-furnishings">
      {/* Boîtes Drona intégrées à la cuisine */}
      <group position={[KITCHEN_WEST_WALL, 0, ROOM_D]} userData={{ animUnit: true, itemName: 'Boîtes Drona Cuisine' }}>
        <CuisineDrona />
      </group>

      {/* Boîtes Drona intégrées au Kallax Cuisine */}
      <group position={KALLAX_CUISINE_POSITION} rotation={[0, KALLAX_CUISINE_ROTATION, 0]}>
        <KallaxCuisineDrona />
      </group>

      {/* IKEA 365+ — bord avant de la case supérieure gauche (côté nord). */}
      <group position={KALLAX_CUISINE_POSITION} rotation={[0, KALLAX_CUISINE_ROTATION, 0]}>
        {Array.from({ length: IKEA365_COUNT }, (_, i) => (
          <group key={i}
            position={[-w2 / 2 + KALLAX_FRAME + (i + 0.5) * KALLAX_CELL_WIDTH / IKEA365_COUNT, KALLAX_UPPER_CELL_BASE, (KALLAX_DEPTH - IKEA365_LENGTH) / 2]}
            rotation-y={Math.PI / 2}
            userData={{ animUnit: true, itemName: 'Boîte IKEA 365+' }}>
            <Ikea36590066708 item={stub('ikea36590066708')} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
          </group>
        ))}
      </group>

      {/* LILLHAVET — égouttoir dans le meuble haut cuisine */}
      <group position={[KITCHEN_WEST_WALL, 0, ROOM_D]} userData={{ animUnit: true, itemName: 'Égouttoir Lillhavet' }}>
        <CuisineLillhavet />
      </group>

      {/* TACKAN évier — plan cuisine (y=93), fond à droite de la niche */}
      <group position={[KITCHEN_WEST_WALL + 5, 93, KITCHEN_SOUTH_WALL - 5]} userData={{ animUnit: true, itemName: 'Distributeur Tackan Cuisine' }}>
        <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>

      {/* KÖLVATTEN éclairage LED avec capteur — angle bas meuble haut METOD / mur ouest */}
      <group
        position={[KITCHEN_WEST_WALL + 1.8, 153, ROOM_D + 41.5]}
        rotation={[Math.PI, Math.PI / 2, 0]}
        userData={{
          skipMerge: true,
          animUnit: true,
          itemName: 'KÖLVATTEN éclairage LED avec capteur',
          hoverAction: { label: 'Éclairage Cuisine (KÖLVATTEN)', actions: ['kolvatten-toggle'] },
        }}
      >
        <Kolvatten00594176 item={stub('kolvatten00594176')} actionState={{ on: isKitchenLampOn }} onSize={NOOP_SIZE} />
        <pointLight
          position={[0, 5, 0]}
          intensity={isKitchenLampOn ? (lightsHD ? 80 : 2.5) : 0}
          distance={lightsHD ? 0 : 200}
          decay={lightsHD ? 1.0 : 2.0}
          color={0xfff5e6}
          castShadow={lightsHD}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.001}
          shadow-camera-near={1}
          shadow-camera-far={400}
        />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 3 — Decor (Détails & habillage de surface)
export function KitchenDecor() {
  return null;
}
