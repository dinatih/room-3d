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

import { BathroomEquipment, BathroomFurniture, BathroomFurnishings, BathroomDecor } from './placements/BathroomPlacements';
import { KitchenEquipment, KitchenFurniture, KitchenFurnishings, KitchenDecor } from './placements/KitchenPlacements';
import { CorridorEquipment, CorridorFurniture, CorridorFurnishings } from './placements/CorridorPlacements';
import { LivingRoomFurniture, LivingRoomFurnishings, LivingRoomDecor } from './placements/LivingRoomPlacements';
import { GardenFurniture, GardenFurnishings, GardenDecor, GardenAnimals } from './placements/GardenPlacements';

// Layer 1 — Équipements sanitaires, cuisine et technique
export function Equipment() {
  return (
    <>
      <BathroomEquipment />
      <KitchenEquipment />
      <CorridorEquipment />
    </>
  );
}

// Pass 1 — Furniture : Structure & gros volumes (collisions strictes au sol, bloque le passage, définit les zones)
export function Furniture() {
  return (
    <>
      <BathroomFurniture />
      <KitchenFurniture />
      <CorridorFurniture />
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
      <GardenFurnishings />
    </>
  );
}

// Pass 3 — Decor : Détails & habillage de surface (props sur meubles, décorations murales, plantes)
export function Decor() {
  return (
    <>
      <BathroomDecor />
      <KitchenDecor />
      <LivingRoomDecor />
      <GardenDecor />
      <GardenAnimals />
    </>
  );
}

