import {
  ROOM_W, ROOM_D, DOOR_START, DOOR_END,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  GARDEN_JC_Z, CORR_DOOR_S, CORR_DOOR_E,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from './config.js';

const ROOMS = [
  {
    nameFr: 'Jardin',
    nameEn: 'garden',
    contains: (x, z) => {
      if (x < -1 || x > 31 || z > -1) return false;
      return z >= -14 - 7 * (x + 1) / 11;
    },
    labelX: 15,
    labelZ: -12,
    fills: () => [],
    fillPath: (ctx, tx, tz) => {
      ctx.beginPath();
      ctx.moveTo(tx(-1), tz(-1));
      ctx.lineTo(tx(-1), tz(-14));
      ctx.lineTo(tx(31), tz(GARDEN_JC_Z));
      ctx.lineTo(tx(31), tz(-1));
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    nameFr: 'Entrée',
    nameEn: 'entry',
    contains: (x, z) => x >= DOOR_START && x <= ROOM_W && z > ROOM_D && z <= ROOM_D + 14,
    labelX: (DOOR_START + ROOM_W) / 2,
    labelZ: ROOM_D + 7,
    fills: (tx, tz, S) => [[tx(DOOR_START), tz(ROOM_D + 1), (ROOM_W - DOOR_START) * S, 13 * S]],
  },
  {
    nameFr: 'Salle d\'eau',
    nameEn: 'bathroom',
    contains: (x, z) =>
      (x >= -NICHE_DEPTH && x <= DOOR_START && z >= KITCHEN_Z && z <= 60) ||
      (x >= -NICHE_DEPTH && x <= 7 && z > 60 && z <= 67),
    labelX: (DOOR_START - NICHE_DEPTH) / 2,
    labelZ: 53,
    fills: (tx, tz, S) => [
      [tx(-NICHE_DEPTH), tz(KITCHEN_Z + 1), (DOOR_START + NICHE_DEPTH) * S, 13 * S],
      [tx(0), tz(60), 7 * S, 7 * S],
    ],
  },
  {
    nameFr: 'Séjour',
    nameEn: 'living',
    contains: (x, z) =>
      (x >= 0 && x <= ROOM_W && z >= 0 && z <= ROOM_D) ||
      (x >= -NICHE_DEPTH && x < 0 && z >= NICHE_Z_START && z <= ROOM_D) ||
      (x >= KITCHEN_X0 && x <= KITCHEN_X1 && z > ROOM_D && z <= KITCHEN_Z),
    labelX: ROOM_W / 2,
    labelZ: ROOM_D / 2 - 2,
    fills: (tx, tz, S) => [
      [tx(0), tz(0), ROOM_W * S, ROOM_D * S],
      [tx(-NICHE_DEPTH), tz(NICHE_Z_START), NICHE_DEPTH * S, (ROOM_D - NICHE_Z_START) * S],
      [tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S],
    ],
  },
];

export function buildMinimap() {
  const canvas = document.getElementById('minimap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Limites du plan
  const PAD = 2;
  const X_MIN = -NICHE_DEPTH - PAD;
  const X_MAX = ROOM_W + PAD;
  const Z_MIN = -35;
  const Z_MAX = 76;

  // Ajuster la hauteur du canvas au ratio du plan
  const ratio = (Z_MAX - Z_MIN) / (X_MAX - X_MIN);
  canvas.height = Math.round(canvas.width * ratio);

  const S = canvas.width / (X_MAX - X_MIN);
  const tx = x => (x - X_MIN) * S;
  const tz = z => (z - Z_MIN) * S;
  const fromPx = px => px / S + X_MIN;
  const fromPz = pz => pz / S + Z_MIN;

  function draw(hoveredRoom) {
    // Fond
    ctx.fillStyle = '#111122';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sols (remplissage subtil)
    ctx.fillStyle = 'rgba(212, 164, 55, 0.12)';
    ctx.fillRect(tx(0), tz(0), ROOM_W * S, ROOM_D * S);
    ctx.fillRect(tx(-NICHE_DEPTH), tz(NICHE_Z_START), NICHE_DEPTH * S, (ROOM_D - NICHE_Z_START) * S);
    ctx.fillRect(tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S);
    ctx.fillRect(tx(KITCHEN_X1), tz(ROOM_D + 1), (DOOR_START - KITCHEN_X1) * S, (KITCHEN_Z - ROOM_D - 1) * S); // placard
    ctx.fillRect(tx(DOOR_START), tz(ROOM_D + 1), (ROOM_W - DOOR_START) * S, 13 * S);
    ctx.fillRect(tx(-NICHE_DEPTH), tz(KITCHEN_Z + 1), (DOOR_START + NICHE_DEPTH) * S, 13 * S);
    ctx.fillRect(tx(0), tz(60), 7 * S, 7 * S);

    // Hover highlight
    if (hoveredRoom) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
      for (const rect of hoveredRoom.fills(tx, tz, S)) {
        ctx.fillRect(...rect);
      }
      if (hoveredRoom.fillPath) hoveredRoom.fillPath(ctx, tx, tz);
    }

    // Helpers
    const wallW = Math.max(S * 0.8, 1.5);

    function drawWall(x1, z1, x2, z2) {
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = wallW;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx(x1), tz(z1));
      ctx.lineTo(tx(x2), tz(z2));
      ctx.stroke();
    }

    function drawDoor(x1, z1, x2, z2) {
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = Math.max(wallW * 0.5, 1);
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(tx(x1), tz(z1));
      ctx.lineTo(tx(x2), tz(z2));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawWindow(x1, z1, x2, z2) {
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = Math.max(wallW * 0.5, 1);
      ctx.beginPath();
      ctx.moveTo(tx(x1), tz(z1));
      ctx.lineTo(tx(x2), tz(z2));
      ctx.stroke();
    }

    // === MUR A OUEST (niche) ===
    drawWall(0, 0, 0, NICHE_Z_START);
    drawWall(0, NICHE_Z_START, -NICHE_DEPTH, NICHE_Z_START);
    drawWall(-NICHE_DEPTH, NICHE_Z_START, -NICHE_DEPTH, ROOM_D);

    // === MUR B EST ===
    drawWall(ROOM_W, 0, ROOM_W, ROOM_D);

    // === MUR C NORD (baie vitrée) ===
    drawWall(0, 0, GLASS_START, 0);
    drawWindow(GLASS_START, 0, GLASS_END, 0);
    drawWall(GLASS_END, 0, ROOM_W, 0);

    // === MUR D SUD (porte + cuisine) ===
    drawWall(-NICHE_DEPTH, ROOM_D, KITCHEN_X0, ROOM_D);
    drawWall(KITCHEN_X1, ROOM_D, DOOR_START, ROOM_D);
    drawDoor(DOOR_START, ROOM_D, DOOR_END, ROOM_D);
    drawWall(DOOR_END, ROOM_D, ROOM_W, ROOM_D);

    // === CUISINE ===
    drawWall(KITCHEN_X0, ROOM_D, KITCHEN_X0, KITCHEN_Z);
    drawWall(KITCHEN_X1, ROOM_D, KITCHEN_X1, KITCHEN_Z);

    // === MUR SDB NORD ===
    drawWall(-NICHE_DEPTH, KITCHEN_Z, DOOR_START, KITCHEN_Z);

    // === PORTE COULISSANTE PLACARD ===
    drawDoor(DOOR_START, ROOM_D + 1, DOOR_START, KITCHEN_Z);

    // === COULOIR STUDIO ===
    drawWall(DOOR_START, KITCHEN_Z, DOOR_START, CORR_DOOR_S);
    drawDoor(DOOR_START, CORR_DOOR_S, DOOR_START, CORR_DOOR_E);
    drawWall(DOOR_START, CORR_DOOR_E, DOOR_START, KITCHEN_Z + 14);

    drawWall(ROOM_W, ROOM_D + 1, ROOM_W, ROOM_D + 14);

    // === SDB OUEST (toute la longueur) ===
    drawWall(-NICHE_DEPTH, KITCHEN_Z, -NICHE_DEPTH, DIAG_CZ);

    // === MUR SDB SUD (vitrage douche + PC-SDB) ===
    drawWindow(-NICHE_DEPTH, 60, 6, 60);
    drawDoor(6, 60, DOOR_START, 60);

    // === DOUCHE ===
    drawWall(6, 60, 6, 67);
    drawWall(-NICHE_DEPTH, 67, 6, 67);

    // === MUR DIAGONAL BATIMENT (avec porte d'entrée) ===
    const DA = { x: DIAG_AX + 0.5, z: DIAG_AZ + 0.5 };
    const DC = { x: DIAG_CX - 0.5, z: DIAG_CZ + 0.5 };
    const dLen = Math.sqrt((DA.x - DC.x) ** 2 + (DA.z - DC.z) ** 2);
    const dX = (DC.x - DA.x) / dLen;
    const dZ = (DC.z - DA.z) / dLen;

    const doorS = { x: DA.x + 1 * dX, z: DA.z + 1 * dZ };
    const doorE = { x: DA.x + 10 * dX, z: DA.z + 10 * dZ };

    drawWall(DA.x, DA.z, doorS.x, doorS.z);
    drawDoor(doorS.x, doorS.z, doorE.x, doorE.z);
    drawWall(doorE.x, doorE.z, DC.x, DC.z);

    // === JARDIN (pointillés verts) ===
    ctx.fillStyle = 'rgba(74, 158, 84, 0.08)';
    ctx.beginPath();
    ctx.moveTo(tx(-1), tz(-1));
    ctx.lineTo(tx(-1), tz(-14));
    ctx.lineTo(tx(31), tz(GARDEN_JC_Z));
    ctx.lineTo(tx(31), tz(-1));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4a9e54';
    ctx.lineWidth = Math.max(wallW * 0.5, 1);
    ctx.setLineDash([3, 2]);
    for (const [x1, z1, x2, z2] of [
      [-1, -1, -1, -14],
      [-1, -14, 31, GARDEN_JC_Z],
      [31, GARDEN_JC_Z, 31, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(tx(x1), tz(z1));
      ctx.lineTo(tx(x2), tz(z2));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // === Labels des pièces ===
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const room of ROOMS) {
      const isHovered = hoveredRoom === room;

      // Nom français
      ctx.fillStyle = isHovered ? 'rgba(255, 215, 0, 0.95)' : 'rgba(255, 255, 255, 0.55)';
      ctx.font = `bold 7px sans-serif`;
      ctx.fillText(room.nameFr, tx(room.labelX), tz(room.labelZ));

      // Nom anglais (plus petit, dessous)
      ctx.fillStyle = isHovered ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      ctx.font = '5px sans-serif';
      ctx.fillText(room.nameEn, tx(room.labelX), tz(room.labelZ) + 9);
    }
  }

  // Dessin initial
  draw(null);

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: fixed; display: none; pointer-events: none;
    background: rgba(0,0,0,0.9); color: #fff;
    padding: 6px 10px; border-radius: 6px; font-size: 12px;
    backdrop-filter: blur(8px); z-index: 100;
    border: 1px solid #555; white-space: nowrap;
    font-family: 'Segoe UI', sans-serif;
  `;
  document.body.appendChild(tooltip);

  let currentRoom = null;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const pz = (e.clientY - rect.top) * (canvas.height / rect.height);
    const x = fromPx(px);
    const z = fromPz(pz);

    const room = ROOMS.find(r => r.contains(x, z)) || null;

    if (room !== currentRoom) {
      currentRoom = room;
      draw(room);
    }

    if (room) {
      tooltip.innerHTML = `<strong>${room.nameFr}</strong><br><span style="color:#aaa;font-size:10px">${room.nameEn}</span>`;
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY - 10) + 'px';
      canvas.style.cursor = 'pointer';
    } else {
      tooltip.style.display = 'none';
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (currentRoom) {
      currentRoom = null;
      draw(null);
    }
    tooltip.style.display = 'none';
    canvas.style.cursor = 'default';
  });

  // Clic sur une pièce → mode POV
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const pz = (e.clientY - rect.top) * (canvas.height / rect.height);
    const x = fromPx(px);
    const z = fromPz(pz);

    const room = ROOMS.find(r => r.contains(x, z));
    if (room) {
      document.dispatchEvent(new CustomEvent('minimap-pov', {
        detail: { x: room.labelX, z: room.labelZ, nameEn: room.nameEn }
      }));
    }
  });
}
