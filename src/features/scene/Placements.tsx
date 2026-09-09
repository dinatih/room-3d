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

import { BathroomEquipment, BathroomFurniture } from './placements/BathroomPlacements';
import { KitchenEquipment, KitchenFurniture } from './placements/KitchenPlacements';
import { CorridorEquipment, CorridorFurniture } from './placements/CorridorPlacements';
import { LivingRoomPlacements } from './placements/LivingRoomPlacements';
import { GardenPlacements } from './placements/GardenPlacements';

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

// Layer 2 — Mobilier et aménagement
export function Furniture() {
  return (
    <>
      <BathroomFurniture />
      <KitchenFurniture />
      <CorridorFurniture />
      <LivingRoomPlacements />
      <GardenPlacements />
    </>
  );
}

