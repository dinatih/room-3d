/**
 * Placements.tsx — Façade de groupement des placements par zone.
 *
 * Les objets sont désormais répartis et maintenus par pièce dans ./placements/ :
 *   - BathroomPlacements.tsx  (sanitaires, douche, chauffe-eau, meubles SDB, Fniss SDB...)
 *   - KitchenPlacements.tsx   (cuisine, kallax cuisine, drona cuisine, tatay...)
 *   - CorridorPlacements.tsx  (placard couloir, gaine Linky, ampoule, trottinette...)
 *   - LivingRoomPlacements.tsx(lits Utaker, bureaux Bollsidan, TV, kallax, déco, Fniss séjour...)
 *   - GardenPlacements.tsx    (canapés, baignoire balnéo, mangeoire, animaux Robin & Shiba...)
 */

import { BathroomEquipment, BathroomFurniture, BathroomFurnishings } from './placements/BathroomPlacements';
import { KitchenEquipment, KitchenFurniture, KitchenFurnishings } from './placements/KitchenPlacements';
import { CorridorEquipment, CorridorFurnishings } from './placements/CorridorPlacements';
import { LivingRoomFurniture, LivingRoomFurnishings, LivingRoomDecor } from './placements/LivingRoomPlacements';
import { GardenFurniture, GardenDecor, GardenAnimals } from './placements/GardenPlacements';
import { RobotPlacements } from './placements/RobotPlacements';
import { BuildingPipes } from './items/BuildingPipes';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import { useSceneStore } from './store/useSceneStore';

// Layer 1 — Équipements sanitaires, cuisine et technique
export function Equipment() {
  return (
    <>
      <BathroomEquipment />
      <KitchenEquipment />
      <CorridorEquipment />
      <group position={[14, 0, 440]}>
        <BuildingPipes item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

// Pass 1 — Furniture : Structure & gros volumes (collisions strictes au sol, bloque le passage, définit les zones)
export function Furniture() {
  return (
    <>
      <BathroomFurniture />
      <KitchenFurniture />
      <LivingRoomFurniture />
      <GardenFurniture />
    </>
  );
}

// Pass 2 — Furnishings : Habillage & confort fonctionnel (s'ancre murs/sols/fenêtres, sans bloquer la circulation)
export function Furnishings() {
  return (
    <>
      <BathroomFurnishings />
      <KitchenFurnishings />
      <CorridorFurnishings />
      <LivingRoomFurnishings />
    </>
  );
}

// Pass 3 — Decor : Détails & habillage de surface (props sur meubles, décorations murales, plantes)
export function Decor() {
  return (
    <>
      <LivingRoomDecor />
      <GardenDecor />
    </>
  );
}

// Pass 4 — Animals : Animaux autonomes (Robin Bird, Shiba Inu, poissons, étoiles de mer) et robots (G1, Go2, Jumper, Drone)
export function Animals() {
  const enabled = useSceneStore(state => state.layers.animals ?? true);
  // Unmount autonomous actors so hidden layers have no frame updates or listeners.
  if (!enabled) return null;

  return (
    <>
      <GardenAnimals />
      <RobotPlacements />
    </>
  );
}

