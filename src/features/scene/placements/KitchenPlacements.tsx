import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { MergedStaticGroup } from '../Building';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { CuisineGroup, CuisineDrona, CuisineLillhavet } from '../items/CuisineGroup';
import { KallaxCuisine, KallaxCuisineDrona } from '../items/KallaxCuisine';
import { LaserDistanceMaster } from '../items/LaserDistanceMaster';
import { TrashBin } from '../items/TrashBin';
import { Tackan } from '../items/Tackan';

import {
  ROOM_D,
  NICHE_X,
  KITCHEN_X0,
  KITCHEN_Z,
} from '@config';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

const w2 = 75.5;
const KALLAX_DEPTH = 39;
const MACK_Z = ROOM_D - w2 - 16;

export function KitchenEquipment() {
  return (
    <MergedStaticGroup name="merged-kitchen-equipment">
      {/* Meubles Cuisine (évier, structure) */}
      <group position={[KITCHEN_X0, 0, ROOM_D]} userData={{ itemName: 'Meubles Cuisine' }}>
        <CuisineGroup item={stub('cuisine-stack')} actionState={NOOP_STATE} onSize={NOOP_SIZE} noDrona />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 1 — Furniture (Structure & gros volumes)
export function KitchenFurniture() {
  const as = useFurnitureToggles([
    'ninja-toggle',
    'bin-toggle',
  ]);

  return (
    <MergedStaticGroup name="merged-kitchen-furniture">
      {/* Kallax Cuisine en séparation (structure sans Drona) */}
      <group position={[NICHE_X + KALLAX_DEPTH / 2, 0, ROOM_D - w2 / 2]} rotation={[0, -Math.PI / 2, 0]} userData={{ itemName: 'Kallax Cuisine' }}>
        <KallaxCuisine item={stub('kallax-sw-stack')} actionState={as} onSize={NOOP_SIZE} noDrona />
      </group>

      {/* Poubelle TATAY — angle KallaxCuisine × Mackapar */}
      <group position={[NICHE_X + KALLAX_DEPTH + 18, 0, MACK_Z + w2 / 2 - 6]} rotation-y={Math.PI / 2} userData={{ itemName: 'Poubelle Tatay' }}>
        <TrashBin item={stub('trash-bin')} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 2 — Furnishings (Habillage & confort fonctionnel)
export function KitchenFurnishings() {
  return (
    <MergedStaticGroup name="merged-kitchen-furnishings">
      {/* Boîtes Drona intégrées à la cuisine */}
      <group position={[KITCHEN_X0, 0, ROOM_D]} userData={{ itemName: 'Boîtes Drona Cuisine' }}>
        <CuisineDrona />
      </group>

      {/* Boîtes Drona intégrées au Kallax Cuisine */}
      <group position={[NICHE_X + KALLAX_DEPTH / 2, 0, ROOM_D - w2 / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <KallaxCuisineDrona />
      </group>

      {/* LILLHAVET — égouttoir dans le meuble haut cuisine */}
      <group position={[KITCHEN_X0, 0, ROOM_D]} userData={{ itemName: 'Égouttoir Lillhavet' }}>
        <CuisineLillhavet />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 3 — Decor (Détails & habillage de surface)
export function KitchenDecor() {
  return (
    <MergedStaticGroup name="merged-kitchen-decor">
      {/* Télémètre Laserliner posé dans la Drona du Kallax Cuisine */}
      <group position={[NICHE_X + KALLAX_DEPTH / 2, 0, ROOM_D - w2 / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <group position={[17.5, 6.25, -5]} rotation={[Math.PI / 2, 0, 0]} userData={{ itemName: 'Télémètre Laserliner' }}>
          <LaserDistanceMaster item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      </group>

      {/* TACKAN évier — plan cuisine (y=93), fond à droite de la niche */}
      <group position={[KITCHEN_X0 + 5, 93, KITCHEN_Z - 5]} userData={{ itemName: 'Distributeur Tackan Cuisine' }}>
        <Tackan item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}
