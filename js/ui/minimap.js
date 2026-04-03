let _walker = null;
let _redrawFn = null;

export function setMinimapWalker(group) { _walker = group; }
export function redrawMinimap() { if (_redrawFn) _redrawFn(); }

import {
  ROOM_W, ROOM_D, DOOR_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  NICHE_DEPTH, NICHE_Z_START,
  GARDEN_JC_Z,
  SDB_Z_END,
  DIAG_AZ, DIAG_CZ,
} from '../config.js';
import { FLOOR_SEGMENTS, ROOMS, WALL_LABELS } from './floorData.js';


export function buildMinimap() {
  const canvas = document.getElementById('minimap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const SMALL_W = 150;

  // Limites du plan
  const PAD = 20;
  const X_MIN = -NICHE_DEPTH - PAD;
  const X_MAX = ROOM_W + PAD;
  const Z_MIN = -350;
  const Z_MAX = 760;
  const ratio = (Z_MAX - Z_MIN) / (X_MAX - X_MIN);

  // S est recalculé à chaque draw() — permet le resize expand/collapse
  let S = SMALL_W / (X_MAX - X_MIN);
  const tx = x => (x - X_MIN) * S;
  const tz = z => (z - Z_MIN) * S;
  const fromPx = px => px / S + X_MIN;
  const fromPz = pz => pz / S + Z_MIN;

  // Init canvas
  canvas.width = SMALL_W;
  canvas.height = Math.round(SMALL_W * ratio);

  // ── Expand / collapse ───────────────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(6px); z-index: 200;
  `;
  document.body.appendChild(backdrop);

  const expandBtn = document.getElementById('minimap-expand');
  let expanded = false;
  let currentRoom = null;

  function setExpanded(on) {
    expanded = on;
    const container = canvas.parentElement;
    if (on) {
      const maxW = window.innerWidth  * 0.88;
      const maxH = window.innerHeight * 0.88;
      canvas.width = Math.round(Math.min(maxW, maxH / ratio));
      container.classList.add('expanded');
      backdrop.style.display = 'block';
      expandBtn.textContent = '✕';
      expandBtn.title = 'Réduire';
    } else {
      canvas.width = SMALL_W;
      container.classList.remove('expanded');
      backdrop.style.display = 'none';
      expandBtn.textContent = '⛶';
      expandBtn.title = 'Agrandir';
    }
    S = canvas.width / (X_MAX - X_MIN);
    canvas.height = Math.round(canvas.width * ratio);
    draw(currentRoom);
  }

  if (expandBtn) {
    expandBtn.addEventListener('click', (e) => { e.stopPropagation(); setExpanded(!expanded); });
  }
  backdrop.addEventListener('click', () => setExpanded(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && expanded) setExpanded(false); });

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw(hoveredRoom) {
    S = canvas.width / (X_MAX - X_MIN);
    const scale = canvas.width / SMALL_W; // facteur pour fonts et icônes

    // Fond
    ctx.fillStyle = '#111122';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sols (remplissage subtil)
    ctx.fillStyle = 'rgba(212, 164, 55, 0.12)';
    ctx.fillRect(tx(0), tz(0), ROOM_W * S, ROOM_D * S);
    ctx.fillRect(tx(-NICHE_DEPTH), tz(NICHE_Z_START), NICHE_DEPTH * S, (ROOM_D - NICHE_Z_START) * S);
    ctx.fillRect(tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S);
    ctx.fillRect(tx(KITCHEN_X1), tz(ROOM_D + 10), (DOOR_START - KITCHEN_X1) * S, (KITCHEN_Z - ROOM_D - 10) * S); // placard
    // Entrée : rect + triangle
    ctx.fillRect(tx(DOOR_START), tz(ROOM_D + 10), (ROOM_W - DOOR_START) * S, (DIAG_AZ - ROOM_D - 10) * S);
    ctx.beginPath();
    ctx.moveTo(tx(DOOR_START), tz(DIAG_AZ));
    ctx.lineTo(tx(ROOM_W), tz(DIAG_AZ));
    ctx.lineTo(tx(DOOR_START), tz(SDB_Z_END));
    ctx.closePath();
    ctx.fill();
    // SDB : rect + triangle sud
    ctx.fillRect(tx(-NICHE_DEPTH), tz(KITCHEN_Z + 10), (DOOR_START + NICHE_DEPTH) * S, (SDB_Z_END - KITCHEN_Z - 10) * S);
    ctx.beginPath();
    ctx.moveTo(tx(-NICHE_DEPTH), tz(SDB_Z_END));
    ctx.lineTo(tx(DOOR_START), tz(SDB_Z_END));
    ctx.lineTo(tx(-NICHE_DEPTH), tz(DIAG_CZ));
    ctx.closePath();
    ctx.fill();

    // Hover highlight
    if (hoveredRoom) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
      for (const rect of hoveredRoom.fills(tx, tz, S)) {
        ctx.fillRect(...rect);
      }
      if (hoveredRoom.fillPath) hoveredRoom.fillPath(ctx, tx, tz);
    }

    // Helpers
    const wallW = Math.max(S * 8, 1.5);

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
      ctx.setLineDash([2 * scale, 2 * scale]);
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

    // === SEGMENTS ===
    for (const { t, x1, z1, x2, z2 } of FLOOR_SEGMENTS) {
      if      (t === 'w') drawWall(x1, z1, x2, z2);
      else if (t === 'd') drawDoor(x1, z1, x2, z2);
      else if (t === 'n') drawWindow(x1, z1, x2, z2);
    }

    // === JARDIN (pointillés verts) ===
    ctx.fillStyle = 'rgba(74, 158, 84, 0.08)';
    ctx.beginPath();
    ctx.moveTo(tx(-10), tz(-10));
    ctx.lineTo(tx(-10), tz(-140));
    ctx.lineTo(tx(310), tz(GARDEN_JC_Z));
    ctx.lineTo(tx(310), tz(-10));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4a9e54';
    ctx.lineWidth = Math.max(wallW * 0.5, 1);
    ctx.setLineDash([3 * scale, 2 * scale]);
    for (const [x1, z1, x2, z2] of [
      [-10, -10, -10, -140],
      [-10, -140, 310, GARDEN_JC_Z],
      [310, GARDEN_JC_Z, 310, -10],
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

      ctx.fillStyle = isHovered ? 'rgba(255, 215, 0, 0.95)' : 'rgba(255, 255, 255, 0.55)';
      ctx.font = `bold ${Math.round(7 * scale)}px sans-serif`;
      ctx.fillText(room.nameFr, tx(room.labelX), tz(room.labelZ));

      ctx.fillStyle = isHovered ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      ctx.font = `${Math.round(5 * scale)}px sans-serif`;
      ctx.fillText(room.nameEn, tx(room.labelX), tz(room.labelZ) + 9 * scale);
    }

    // === Labels des murs, portes, fenêtres ===
    const wallLabelColor = { w: 'rgba(200,190,100,0.65)', d: 'rgba(220,80,80,0.7)', n: 'rgba(80,150,255,0.7)' };
    ctx.font = `bold ${Math.round(5 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const w of WALL_LABELS) {
      ctx.fillStyle = wallLabelColor[w.t];
      ctx.fillText(w.name, tx(w.x), tz(w.z));
    }

    // === WALKING MAN (casquette vue du haut) ===
    if (_walker) {
      const wx = _walker.position.x;
      const wz = _walker.position.z;
      const ry = _walker.rotation.y;

      ctx.save();
      ctx.translate(tx(wx), tz(wz));
      ctx.rotate(Math.PI - ry);

      const V_FOV_RAD = 50 * Math.PI / 180;
      const hFov = 2 * Math.atan(Math.tan(V_FOV_RAD / 2) * (window.innerWidth / window.innerHeight));
      const fovR = 120 * S;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, fovR, Math.PI / 2 - hFov / 2, Math.PI / 2 + hFov / 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 221, 0, 0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 221, 0, 0.55)';
      ctx.lineWidth = 0.7 * scale;
      ctx.stroke();

      const R  = 5  * scale;
      const BW = 8  * scale;
      const BH = 4  * scale;

      ctx.fillStyle = '#ff4444';
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 0.8 * scale;

      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.rect(-BW / 2, R, BW, BH);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  _redrawFn = () => draw(currentRoom);

  // Dessin initial
  draw(null);

  // ── Tooltip ─────────────────────────────────────────────────────────────────
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: fixed; display: none; pointer-events: none;
    background: rgba(0,0,0,0.9); color: #fff;
    padding: 6px 10px; border-radius: 6px; font-size: 12px;
    backdrop-filter: blur(8px); z-index: 202;
    border: 1px solid #555; white-space: nowrap;
    font-family: 'Segoe UI', sans-serif;
  `;
  document.body.appendChild(tooltip);

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
      tooltip.style.top  = (e.clientY - 10) + 'px';
      canvas.style.cursor = 'pointer';
    } else {
      tooltip.style.display = 'none';
      canvas.style.cursor = 'default';
    }
  });

  window.addEventListener('resize', () => {
    if (expanded) setExpanded(true); // recalcule la taille
    else draw(currentRoom);
  });

  canvas.addEventListener('mouseleave', () => {
    if (currentRoom) { currentRoom = null; draw(null); }
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
