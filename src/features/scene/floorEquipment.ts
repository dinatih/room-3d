import {
  BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL, BATH_SOUTH_WALL,
  SHOWER_SOUTH_WALL, KITCHEN_WEST_WALL, KITCHEN_EAST_WALL,
  KITCHEN_SOUTH_WALL, CORRIDOR_NORTH_WALL, PARTITION_THICKNESS,
  DOOR_START, ROOM_W, ROOM_D, DiagWall, pEast, pWest, pNorth, pZ,
} from './wallData';

/** Vue de dessus des équipements fixes. Coordonnées et cotes en cm,
 * issues de BathroomPlacements, KitchenPlacements, CorridorPlacements et des items.
 * Les éléments suspendus sont en pointillés pour laisser lire les sanitaires dessous.
 */
export function drawEquipment(ctx: CanvasRenderingContext2D) {
  const water = 'rgba(26, 111, 168, 0.08)';
  const surface = 'rgba(148, 163, 184, 0.08)';
  ctx.strokeStyle = '#64748b';
  ctx.fillStyle = surface;

  const rect = (x: number, z: number, w: number, d: number, radius = 0) => {
    ctx.beginPath();
    ctx.roundRect(x - w / 2, z - d / 2, w, d, radius);
    ctx.fill();
    ctx.stroke();
  };
  const ellipse = (x: number, z: number, rx: number, rz: number) => {
    ctx.beginPath();
    ctx.ellipse(x, z, rx, rz, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  const line = (x0: number, z0: number, x1: number, z1: number) => {
    ctx.beginPath();
    ctx.moveTo(x0, z0);
    ctx.lineTo(x1, z1);
    ctx.stroke();
  };

  // WC President 40×70 : réservoir au nord, cuvette vers le sud.
  const wcX = BATH_WEST_WALL + 60;
  const wcZ = BATH_NORTH_WALL + 70 / 2 + 1.5;
  rect(wcX, wcZ - 70 / 2 + 10, 40, 20, 3);
  ellipse(wcX, wcZ + 10, 20, 25);
  ctx.fillStyle = water;
  ellipse(wcX, wcZ + 10, 12, 17);
  ctx.fillStyle = surface;

  // HAVBÄCK / ORRSJÖN 62×49 : meuble, vasque et mitigeur.
  const basinX = BATH_EAST_WALL - 76;
  const basinZ = BATH_NORTH_WALL + 49 / 2;
  rect(basinX, basinZ, 62, 49, 3);
  ctx.fillStyle = water;
  rect(basinX, basinZ + 3, 48, 30, 8);
  ctx.fillStyle = surface;
  line(basinX, basinZ - 49 / 2 + 3, basinX, basinZ - 6);

  // Receveur 71×71 ; la porte et les parois sont déjà dans floorData.
  const showerX = BATH_WEST_WALL + 71 / 2;
  const showerZ = SHOWER_SOUTH_WALL - 71 / 2;
  ctx.fillStyle = water;
  rect(showerX, showerZ, 71, 71, 3);
  ctx.fillStyle = surface;
  rect(showerX, showerZ, 61, 61, 5);
  ellipse(showerX, showerZ, 3, 3);
  line(showerX - 15, SHOWER_SOUTH_WALL - 5, showerX + 15, SHOWER_SOUTH_WALL - 5);

  // Plan de travail 102×62, évier BOHOLMEN tourné à 90° (30×47).
  const kitchenX = KITCHEN_WEST_WALL;
  rect(kitchenX + 50, ROOM_D + 30, 102, 62);
  line(kitchenX + 40, ROOM_D, kitchenX + 40, ROOM_D + 60);
  ctx.fillStyle = water;
  rect(kitchenX + 20, ROOM_D + 26, 30, 47, 5);
  ctx.fillStyle = surface;
  line(kitchenX + 20, ROOM_D + 42, kitchenX + 20, ROOM_D + 35);

  // VÄLBILDAD 29×52, deux foyers, au-dessus du réfrigérateur.
  rect(kitchenX + 70, ROOM_D + 30, 29, 52, 2);
  ellipse(kitchenX + 70, ROOM_D + 18, 10, 10);
  ellipse(kitchenX + 70, ROOM_D + 42, 8, 8);

  // Placard couloir : emprise des étagères, porte déjà dans le plan.
  const closetX0 = KITCHEN_EAST_WALL + PARTITION_THICKNESS;
  rect((closetX0 + DOOR_START) / 2, (CORRIDOR_NORTH_WALL + KITCHEN_SOUTH_WALL) / 2,
    DOOR_START - closetX0, KITCHEN_SOUTH_WALL - CORRIDOR_NORTH_WALL);

  // Placard SDB : étagère jusqu'au mur diagonal et rails de 7 cm.
  const shelfX0 = pEast('shower-ne');
  const shelfX1 = pWest('bath-se');
  const shelfZ = pNorth('shower-ne') + 7;
  const diagonalZ = (x: number) => DiagWall.A.z + (x - DiagWall.A.x) * DiagWall.slope;
  ctx.beginPath();
  ctx.moveTo(shelfX0, shelfZ);
  ctx.lineTo(shelfX1, shelfZ);
  ctx.lineTo(shelfX1, diagonalZ(shelfX1));
  ctx.lineTo(shelfX0, diagonalZ(shelfX0));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gaine 6.5×25.5 et Linky 12×7.1, monté face ouest.
  const linkyZ = ROOM_D + 16 + 25.5 / 2;
  rect(ROOM_W - 6.5 / 2, linkyZ, 6.5, 25.5);
  ctx.fillStyle = 'rgba(132, 204, 22, 0.08)';
  rect(ROOM_W - 6.5 - 7.1 / 2, linkyZ, 7.1, 12);
  ctx.fillStyle = surface;

  // Équipements suspendus : chauffe-eau Ø56, meuble haut et hotte.
  ctx.setLineDash([5, 4]);
  ellipse(BATH_WEST_WALL + 56 / 2, BATH_NORTH_WALL + 11 + 56 / 2, 28, 28);
  rect(kitchenX + 100, ROOM_D + 60 - 37 / 2, 100, 37);
  rect(kitchenX + 70, ROOM_D + 32, 60, 21.5);
  ctx.setLineDash([]);

  // Bandeau LED 35 cm et symboles des deux ampoules de plafond.
  line(basinX - 35 / 2, BATH_NORTH_WALL - 2, basinX + 35 / 2, BATH_NORTH_WALL - 2);
  const lamp = (x: number, z: number) => {
    ellipse(x, z, 6, 6);
    line(x - 4, z - 4, x + 4, z + 4);
    line(x - 4, z + 4, x + 4, z - 4);
  };
  lamp((BATH_WEST_WALL + BATH_EAST_WALL) / 2, (BATH_NORTH_WALL + BATH_SOUTH_WALL) / 2);
  lamp((DOOR_START + ROOM_W) / 2, (pZ('corner-se') + pZ('diag-ne')) / 2);
}
