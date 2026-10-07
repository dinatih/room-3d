import { ROOM_W, ROOM_D, BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL } from './wallData';
import { BATHTUB } from './bathtubData';
import { SHOE_HAT_RACK } from './shoeHatRackData';
import {
  currentFurnitureTransforms, DESK1_POSITIONS, DESK2_POSITIONS,
  SMORKULL_POSITIONS, AIRPERFORMER_POSITIONS, DOUBLE_BED_POSITIONS, type FurnitureTransform,
} from './furniturePositions';
import { positionState } from './positionState';
import { useSceneStore } from './store/useSceneStore';

/** Mobilier en coordonnées monde X/Z (cm). Les poses animées viennent de la scène. */
export function drawFurniture(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#92734f';
  ctx.fillStyle = 'rgba(146, 115, 79, 0.08)';
  const rect = (x: number, z: number, w: number, d: number, r = 0) => {
    ctx.beginPath();
    ctx.roundRect(x - w / 2, z - d / 2, w, d, r);
    ctx.fill();
    ctx.stroke();
  };
  const line = (x0: number, z0: number, x1: number, z1: number) => {
    ctx.beginPath(); ctx.moveTo(x0, z0); ctx.lineTo(x1, z1); ctx.stroke();
  };
  const at = (p: FurnitureTransform, draw: () => void) => {
    ctx.save(); ctx.translate(p.x, p.z); ctx.rotate(-p.ry); draw(); ctx.restore();
  };
  const pose = (key: string, positions: readonly FurnitureTransform[]) =>
    currentFurnitureTransforms[key] ?? positions[positionState[key]?.idx ?? 0];

  // UTÅKER : longueur locale X=205, largeur Z=83 ; deux cadres même en lit double.
  const isDouble = useSceneStore.getState().furniture.bedDouble;
  const doublePosition = DOUBLE_BED_POSITIONS[positionState['bed-position']?.idx ?? 0];
  const west = isDouble ? doublePosition.west : { x: 74, z: 151.5 };
  const east = isDouble ? doublePosition.east : { x: ROOM_W - 45.5, z: 190 };
  for (const [key, fallback] of [['bed-west-position', west], ['bed-east-position', east]] as const) {
    at(currentFurnitureTransforms[key] ?? { ...fallback, ry: Math.PI / 2 }, () => {
      rect(0, 0, 205, 83, 2);
      rect(-76, 0, 38, 67, 5);
      line(-50, -83 / 2, -50, 83 / 2);
    });
  }
  // Bureaux BOLLSIDAN 68×36 et fauteuil SMÖRKULL 65×66.
  for (const p of [pose('desk1-position', DESK1_POSITIONS), pose('desk2-position', DESK2_POSITIONS)]) {
    at(p, () => rect(0, 0, 68, 36, 6));
  }
  at(pose('smorkull-position', SMORKULL_POSITIONS), () => {
    rect(0, 0, 65, 66, 10);
    rect(0, 2, 45, 45, 8);
    line(-25, -25, 25, -25);
  });
  // Air Performer : socle Ø32.5 cm et corps supérieur 24.3×12.5 cm.
  at(pose('airperformer-position', AIRPERFORMER_POSITIONS), () => {
    ctx.beginPath();
    ctx.arc(0, 0, 32.5 / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    rect(0, 0, 24.3, 12.5, 12.5 / 2);
  });

  // KALLAX, MACKAPÄR et rangement chaussures (empilements projetés une seule fois).
  rect(39 / 2, 40.5 / 2, 39, 41);
  rect(ROOM_W - 39 / 2, 75.5 / 2, 39, 75.5);
  const seZ = ROOM_D - 60 - 40.5 / 2;
  rect(ROOM_W - 39 / 2, seZ, 39, 41);
  // Portant sous les huit casquettes : origine dans un coin, rotation totale −π/2.
  rect(ROOM_W - SHOE_HAT_RACK.depth / 2, ROOM_D - 60 + SHOE_HAT_RACK.width / 2,
    SHOE_HAT_RACK.depth, SHOE_HAT_RACK.width);
  // Meuble T intégré au KALLAX NW, déport local de 59.5 cm.
  rect(39 / 2 - 0.75, 40.5 / 2 + 59.5, 27.5, 22.5);
  rect(39 / 2 - 0.75 - 2, 40.5 / 2 + 59.5, 23.5, 80);
  rect(32, ROOM_D - 75.5 - 16, 78, 32);
  rect(160, ROOM_D - 14, 58, 27);
  for (const z of [155, 220]) rect(16, z, 22, 65, 3);

  // KALLAX cuisine, poubelle TATAY et meubles METOD de la salle de bain.
  rect(BATH_WEST_WALL + 39 / 2, ROOM_D - 75.5 / 2, 39, 75.5);
  at({ x: BATH_WEST_WALL + 39 + 18, z: ROOM_D - 75.5 - 16 + 75.5 / 2 - 6, ry: Math.PI / 2 },
    () => rect(0, 0, 26, 36, 2));
  rect(BATH_WEST_WALL + 20, BATH_NORTH_WALL + 19.5, 40, 37.6);
  rect(BATH_EAST_WALL - 23, BATH_NORTH_WALL + 19.5, 40, 37.6);
  for (const [x, z] of [[21, 110], [110, BATH_NORTH_WALL + 28 / 2 + 1]]) {
    ctx.beginPath(); ctx.arc(x, z, 28 / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // Jardin : canapé sans accoudoirs, canapé Sintra, banc et coffre VÄTTERSÖ.
  at({ x: 100, z: -80, ry: Math.PI / 2 }, () => {
    rect(0, 0, 100, 60, 6); line(-50, -20, 50, -20);
  });
  // Rotation du placement (−π/2) + rotation interne de Sintra (−π/2).
  at({ x: 270, z: -110, ry: -Math.PI }, () => {
    rect(0, 0, 61, 115, 2); line(-26, -57.5, -26, 57.5);
    // Géométrie Sintra : les accoudoirs se déploient suivant Z local.
    const states = useSceneStore.getState().furniture;
    for (const [side, key] of [[1, 'sofaArmLeft'], [-1, 'sofaArmRight']] as const) {
      const length = 34.25 * Math.cos(states[key] ? 0 : 1.309);
      rect(0, side * (57.5 + length / 2), 61, length, 1);
    }
  });
  at({ x: 40, z: -90, ry: Math.PI / 2 }, () => rect(0, 0, 122, 55, 2));
  at({ x: 264, z: -320, ry: -Math.PI / 2 }, () => rect(0, 0, 156, 72, 3));

  // Baignoire : rebord évidé et eau transparente.
  at({ x: BATHTUB.position[0], z: BATHTUB.position[2], ry: BATHTUB.rotation[1] }, () => {
    const { width: w, length: d, wallThickness: rim, cornerRadius: radius } = BATHTUB;
    ctx.fillStyle = '#d4b483'; ctx.strokeStyle = '#7a5830';
    ctx.beginPath(); ctx.roundRect(-w / 2, -d / 2, w, d, radius); ctx.stroke();
    ctx.roundRect(-w / 2 + rim, -d / 2 + rim, w - 2 * rim, d - 2 * rim, radius - rim);
    ctx.fill('evenodd');
    ctx.fillStyle = 'rgba(26, 111, 168, 0.08)';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + rim, -d / 2 + rim, w - 2 * rim, d - 2 * rim, radius - rim);
    ctx.fill();
  });
}
