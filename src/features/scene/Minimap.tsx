/**
 * Minimap.tsx — overlay canvas 2D, port de js/ui/minimap.js.
 *
 * Composant HTML pur rendu HORS du Canvas R3F (dans Studio.tsx).
 * Se synchronise avec la caméra via cameraState.onUpdate.
 * Styled using Bootstrap 5.3 and the red theme accent.
 */
import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cameraState } from '@features/scene/cameraState';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import {
  drawFloorPlan,
  PLAN_X_MIN, PLAN_X_MAX, PLAN_Z_MIN, PLAN_Z_MAX,
} from './floorDraw';
import { LANDING_STRIPS } from './LandingStrips';
import { CHARACTERS, isCharacterVisibleInMode } from './characterConfig';
import { useSceneStore } from './store/useSceneStore';
import { isAppIdle } from './idleState';
import { Group } from './sidepanel/Group';

export const SMALL_W_DESKTOP = 140;
export const SMALL_W_MOBILE  = 115;

export interface MinimapProps {
  embedded?: boolean;
  showGroup?: boolean;
}

// ── Icône avion (plan 2D) ─────────────────────────────────────────────────────
function drawPlaneIcon(
  ctx: CanvasRenderingContext2D,
  px: number, pz: number, yaw: number,
  sc: number,
  fillColor: string, strokeColor: string,
  tx: (x: number) => number, tz: (z: number) => number,
) {
  ctx.save();
  ctx.translate(tx(px), tz(pz));
  ctx.rotate(-yaw);
  const PL = 10 * sc, PW = 9 * sc;
  ctx.fillStyle   = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = 0.9 * sc;
  ctx.beginPath();
  ctx.moveTo(0, -PL);
  ctx.lineTo(-PW, PL);
  ctx.lineTo(0,  PL * 0.4);
  ctx.lineTo( PW, PL);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const floorPlanCache = new Map<string, HTMLCanvasElement>();

// ── Simulation physique de la queue de cheval de Lara (Inertie 2D) ───────────
interface HairNode {
  x: number;
  z: number;
  vx: number;
  vz: number;
}
const ponytailNodes: HairNode[] = [
  { x: 0, z: 0, vx: 0, vz: 0 },
  { x: 0, z: 0, vx: 0, vz: 0 },
  { x: 0, z: 0, vx: 0, vz: 0 },
];
let ponytailInitialized = false;
let lastCharacterMotion = { x: 0, z: 0, yaw: 0, time: 0 };
let ponytailLift = 0; // 0 = au repos (tresse verticale le long du dos), 1 = déployée à pleine vitesse

function getCachedFloorPlan(w: number, h: number, showEquipment: boolean): HTMLCanvasElement {
  const key = `${w}x${h}:${showEquipment}`;
  let cached = floorPlanCache.get(key);
  if (!cached || cached.width !== w || cached.height !== h) {
    cached = document.createElement('canvas');
    cached.width = w;
    cached.height = h;
    const ctx = cached.getContext('2d');
    if (ctx) {
      drawFloorPlan(ctx, w, h, { showEquipment });
    }
    floorPlanCache.set(key, cached);
  }
  return cached;
}

function drawMinimap(
  canvas: HTMLCanvasElement,
  smallW: number,
  showEquipment: boolean,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const S = Math.min(W / (PLAN_X_MAX - PLAN_X_MIN), H / (PLAN_Z_MAX - PLAN_Z_MIN));
  const sc = W / smallW;

  const offX = (W - (PLAN_X_MAX - PLAN_X_MIN) * S) / 2;
  const offZ = (H - (PLAN_Z_MAX - PLAN_Z_MIN) * S) / 2;

  const tx = (x: number) => offX + (x - PLAN_X_MIN) * S;
  const tz = (z: number) => offZ + (z - PLAN_Z_MIN) * S;

  // Fond du canvas (totalement transparent pour préserver le glassmorphism)
  ctx.clearRect(0, 0, W, H);

  // ── Pistes d'atterrissage (seulement si activées) ─────────────────────────
  if (cameraState.landingStripsVisible) {
    for (const strip of LANDING_STRIPS) {
      const sw = strip.width  * S;
      const sl = strip.length * S;
      ctx.save();
      ctx.translate(tx(strip.cx), tz(strip.cz));
      ctx.rotate(-strip.angleY);
      ctx.fillStyle = 'rgba(40,40,40,0.80)';
      ctx.fillRect(-sw / 2, -sl / 2, sw, sl);
      ctx.fillStyle = 'rgba(220,210,0,0.9)';
      ctx.fillRect(-1.2 * S, -sl / 2 * 0.85, 2.4 * S, sl * 0.85);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (const side of [-1, 1] as const) {
        for (const xOff of [-1.5, -0.5, 0.5, 1.5]) {
          const bw = sw * 0.14, bh = sl * 0.055;
          ctx.fillRect(xOff * sw * 0.22 - bw / 2, side * sl * 0.44 - bh / 2, bw, bh);
        }
      }
      ctx.restore();
    }
  }

  // Plan partagé (mis en cache sur un canvas offscreen pour épargner le CPU à chaque frame)
  const cachedPlan = getCachedFloorPlan(W, H, showEquipment);
  ctx.drawImage(cachedPlan, 0, 0);

  // ── Dimensions proportionnelles au monde réel (1 unité = 1 cm) ────────────
  // Rayon d'une tête humaine vue du dessus : ~11 cm (diamètre ~22 cm)
  const HEAD_RADIUS_WORLD = 11;
  const rNpc = Math.max(2.5 * sc, HEAD_RADIUS_WORLD * S);
  const R    = Math.max(3.2 * sc, HEAD_RADIUS_WORLD * S);

  // ── Other characters (NPCs) icons (y compris à l'extérieur) ─────────────────
  const activeCharacterId = useSceneStore.getState().activeCharacterId;
  const showAllLaraStyles = useSceneStore.getState().layers.showAllLaraStyles;
  const laraCount = useSceneStore.getState().layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15);
  const extraCharacters = useSceneStore.getState().layers.extraCharacters ?? false;
  const activeExtraIds = useSceneStore.getState().activeExtraIds;
  const activeMainIds = useSceneStore.getState().activeMainIds;
  
  CHARACTERS.forEach(char => {
    if (char.id !== activeCharacterId) {
      if (!showAllLaraStyles) return;
      if (!isCharacterVisibleInMode(char.id, laraCount, activeCharacterId, extraCharacters, activeExtraIds, activeMainIds)) return;
      const currentPos = cameraState.headPositions[char.id];
      if (!currentPos) return;
      const rawX = tx(currentPos.x);
      const rawZ = tz(currentPos.z);
      // Bornage doux pour garder le point visible sur le bord s'il est au loin hors champ
      const px = Math.max(rNpc + 2, Math.min(W - rNpc - 2, rawX));
      const pz = Math.max(rNpc + 2, Math.min(H - rNpc - 2, rawZ));
      const isOffscreen = rawX < rNpc || rawX > W - rNpc || rawZ < rNpc || rawZ > H - rNpc;

      ctx.save();
      ctx.translate(px, pz);
      ctx.beginPath(); 
      ctx.arc(0, 0, rNpc, 0, Math.PI * 2); 
      ctx.fillStyle   = 'rgba(37, 99, 235, 0.75)'; // Bleu franc et net
      ctx.fill(); 
      ctx.strokeStyle = isOffscreen ? 'rgba(234, 88, 12, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth   = Math.max(0.8, 0.6 * sc);
      ctx.stroke();
      ctx.restore();
    }
  });

  // ── Shiba Inu (Ushiro) ──────────────────────────────────────────────────────
  const shibaPos = cameraState.positions['shiba'];
  if (shibaPos) {
    const rShiba = Math.max(2.2 * sc, 8 * S);
    const rawX = tx(shibaPos.x);
    const rawZ = tz(shibaPos.z);
    const px = Math.max(rShiba + 2, Math.min(W - rShiba - 2, rawX));
    const pz = Math.max(rShiba + 2, Math.min(H - rShiba - 2, rawZ));
    const isOffscreen = rawX < rShiba || rawX > W - rShiba || rawZ < rShiba || rawZ > H - rShiba;

    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-shibaPos.yaw);
    ctx.fillStyle = 'rgba(255, 153, 0, 0.85)'; // Orange
    ctx.strokeStyle = isOffscreen ? 'rgba(234, 88, 12, 0.9)' : 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = Math.max(0.8, 1 * sc);
    ctx.beginPath(); 
    ctx.arc(0, 0, rShiba, 0, Math.PI * 2); 
    ctx.fill(); 
    ctx.stroke();
    // Petit museau pour indiquer la direction
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, rShiba, rShiba * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Oiseau Robin (Rouge-gorge) ──────────────────────────────────────────────
  const robinPos = cameraState.positions['robin'];
  if (robinPos) {
    const rBird = Math.max(1.8 * sc, 5.5 * S);
    const rawX = tx(robinPos.x);
    const rawZ = tz(robinPos.z);
    const px = Math.max(rBird + 2, Math.min(W - rBird - 2, rawX));
    const pz = Math.max(rBird + 2, Math.min(H - rBird - 2, rawZ));
    const isOffscreen = rawX < rBird || rawX > W - rBird || rawZ < rBird || rawZ > H - rBird;

    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-robinPos.yaw);

    // Corps / ailes (brun chaud)
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = isOffscreen ? 'rgba(234, 88, 12, 0.9)' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = Math.max(0.6, 0.7 * sc);
    ctx.beginPath();
    ctx.ellipse(0, 0, rBird * 1.25, rBird * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Poitrail rouge-gorge caractéristique (orange/rouge vif)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(0, rBird * 0.3, rBird * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Bec vers l'avant (+Y)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-rBird * 0.28, rBird * 0.7);
    ctx.lineTo(0, rBird * 1.4);
    ctx.lineTo(rBird * 0.28, rBird * 0.7);
    ctx.closePath();
    ctx.fill();

    // Plumes de queue vers l'arrière (-Y)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(-rBird * 0.35, -rBird * 0.6);
    ctx.lineTo(0, -rBird * 1.45);
    ctx.lineTo(rBird * 0.35, -rBird * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ── Avion joueur ────────────────────────────────────────────────────────────
  if (cameraState.mode === 'plane') {
    drawPlaneIcon(
      ctx, cameraState.planeX, cameraState.planeZ, cameraState.planeYaw,
      sc, 'rgba(120,200,255,0.9)', 'rgba(255,255,255,0.9)',
      tx, tz,
    );
  }

  // ── Avion autopilote ────────────────────────────────────────────────────────
  if (cameraState.autopilotActive) {
    drawPlaneIcon(
      ctx, cameraState.autopilotX, cameraState.autopilotZ, cameraState.autopilotYaw,
      sc, 'rgba(100,255,150,0.9)', 'rgba(255,255,255,0.9)',
      tx, tz,
    );
  }

  // ── Character icon (position XZ réelle de la tête ; sans tête publiée : non dessiné) ──
  const characterHead = cameraState.headPositions[activeCharacterId];
  if (!characterHead) return;
  const w = { x: characterHead.x, z: characterHead.z, yaw: cameraState.characterYaw };

  // Bornage sur le bord : même logique que les PNJ, appliquée par décalage à tout le bloc character
  const characterRawX = tx(w.x);
  const characterRawZ = tz(w.z);
  const characterEdge = R * 2.3; // marge pour que la flèche d'orientation reste visible
  const characterClampX = Math.max(characterEdge, Math.min(W - characterEdge, characterRawX));
  const characterClampZ = Math.max(characterEdge, Math.min(H - characterEdge, characterRawZ));
  const characterOffscreen = characterClampX !== characterRawX || characterClampZ !== characterRawZ;
  ctx.save();
  ctx.translate(characterClampX - characterRawX, characterClampZ - characterRawZ);
  
  // 1. Arc FOV orienté vers l'avant (+Y local)
  ctx.save();
  ctx.translate(tx(w.x), tz(w.z));
  ctx.rotate(-w.yaw);

  // FOV arc — follows WALKER facing
  const V    = 50 * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(V / 2) * (window.innerWidth / window.innerHeight));
  const fovR = 100 * S;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.arc(0, 0, fovR, Math.PI / 2 - hFov / 2, Math.PI / 2 + hFov / 2);
  ctx.closePath();
  ctx.fillStyle   = 'rgba(211,47,47,0.18)'; ctx.fill();
  ctx.strokeStyle = 'rgba(211,47,47,0.45)'; ctx.lineWidth = Math.max(0.5, 0.4 * sc); ctx.stroke();
  ctx.restore();

  // 2. Simulation physique & rendu de la queue de cheval de Lara (Inertie, Allongement & Mouvement)
  const facingX = Math.sin(w.yaw);
  const facingZ = Math.cos(w.yaw);
  const attachX = w.x - facingX * (HEAD_RADIUS_WORLD * 0.75);
  const attachZ = w.z - facingZ * (HEAD_RADIUS_WORLD * 0.75);

  const now = performance.now();
  const dt = lastCharacterMotion.time ? Math.min(0.1, Math.max(0.005, (now - lastCharacterMotion.time) / 1000)) : 0.016;

  // Détection dynamique de la vitesse de translation (position réelle de la tête) et de rotation
  const dX = w.x - lastCharacterMotion.x;
  const dZ = w.z - lastCharacterMotion.z;
  const linSpeed = lastCharacterMotion.time ? (Math.hypot(dX, dZ) / dt) : 0;
  
  let dYaw = w.yaw - lastCharacterMotion.yaw;
  while (dYaw > Math.PI) dYaw -= Math.PI * 2;
  while (dYaw < -Math.PI) dYaw += Math.PI * 2;
  const angSpeed = lastCharacterMotion.time ? (Math.abs(dYaw) / dt) : 0;

  lastCharacterMotion.x = w.x;
  lastCharacterMotion.z = w.z;
  lastCharacterMotion.yaw = w.yaw;
  lastCharacterMotion.time = now;

  // Calcul du facteur de portance / déploiement (0 = repos le long du dos, 1 = pleine vitesse en vol horizontal)
  const isMoving = cameraState.isFollowing || cameraState.isMoving || linSpeed > 18 || angSpeed > 1.0;
  const targetLift = isMoving ? Math.min(1, Math.max(0.35, linSpeed / 130 + angSpeed * 0.22)) : 0;

  // Déploiement rapide lors de la marche/course, retombée souple et progressive à l'arrêt
  ponytailLift += (targetLift - ponytailLift) * (targetLift > ponytailLift ? Math.min(1, 10 * dt) : Math.min(1, 5 * dt));

  // Segments courts au repos (~3 cm au total = simple nœud/début de tresse le long du dos),
  // et s'allongeant progressivement avec la vitesse jusqu'à pleine longueur (~33 cm)
  const segLengths = [
    2.0 + 7.5 * ponytailLift,  // ~2 cm -> ~9.5 cm
    1.2 + 9.8 * ponytailLift,  // ~1.2 cm -> ~11 cm
    0.6 + 11.9 * ponytailLift, // ~0.6 cm -> ~12.5 cm
  ];

  if (!ponytailInitialized) {
    let curX = attachX;
    let curZ = attachZ;
    for (let i = 0; i < ponytailNodes.length; i++) {
      curX -= facingX * segLengths[i];
      curZ -= facingZ * segLengths[i];
      ponytailNodes[i].x = curX;
      ponytailNodes[i].z = curZ;
      ponytailNodes[i].vx = 0;
      ponytailNodes[i].vz = 0;
    }
    ponytailInitialized = true;
  } else {
    for (let i = 0; i < ponytailNodes.length; i++) {
      const prevX = (i === 0) ? attachX : ponytailNodes[i - 1].x;
      const prevZ = (i === 0) ? attachZ : ponytailNodes[i - 1].z;
      const restX = prevX - facingX * segLengths[i];
      const restZ = prevZ - facingZ * segLengths[i];

      const node = ponytailNodes[i];
      const spring = 0.35; // Raideur élastique
      const damping = 0.76; // Amortissement fluide

      node.vx = (node.vx + (restX - node.x) * spring) * damping;
      node.vz = (node.vz + (restZ - node.z) * spring) * damping;

      node.x += node.vx;
      node.z += node.vz;

      const dx = node.x - prevX;
      const dz = node.z - prevZ;
      const dist = Math.hypot(dx, dz) || 0.001;
      node.x = prevX + (dx / dist) * segLengths[i];
      node.z = prevZ + (dz / dist) * segLengths[i];
    }
  }

  // Tracé fluide de la queue de cheval (largeur affinée de moitié)
  const p0x = tx(attachX), p0z = tz(attachZ);
  const p1x = tx(ponytailNodes[0].x), p1z = tz(ponytailNodes[0].z);
  const p2x = tx(ponytailNodes[1].x), p2z = tz(ponytailNodes[1].z);
  const p3x = tx(ponytailNodes[2].x), p3z = tz(ponytailNodes[2].z);

  const wScale = 0.65 + 0.35 * ponytailLift;
  const w1 = Math.max(1.0 * sc, 3.5 * S) * wScale;
  const w2 = Math.max(0.75 * sc, 2.5 * S) * wScale;
  const w3 = Math.max(0.45 * sc, 1.5 * S) * wScale;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ombre extérieure foncée
  ctx.strokeStyle = '#180e07';
  ctx.lineWidth = w1 + 0.6 * sc;
  ctx.beginPath(); ctx.moveTo(p0x, p0z); ctx.lineTo(p1x, p1z); ctx.stroke();
  ctx.lineWidth = w2 + 0.6 * sc;
  ctx.beginPath(); ctx.moveTo(p1x, p1z); ctx.lineTo(p2x, p2z); ctx.stroke();
  ctx.lineWidth = w3 + 0.6 * sc;
  ctx.beginPath(); ctx.moveTo(p2x, p2z); ctx.lineTo(p3x, p3z); ctx.stroke();

  // Mèche brune principale (teinte Lara Croft)
  ctx.strokeStyle = '#4a2810';
  ctx.lineWidth = w1;
  ctx.beginPath(); ctx.moveTo(p0x, p0z); ctx.lineTo(p1x, p1z); ctx.stroke();
  ctx.lineWidth = w2;
  ctx.beginPath(); ctx.moveTo(p1x, p1z); ctx.lineTo(p2x, p2z); ctx.stroke();
  ctx.lineWidth = w3;
  ctx.beginPath(); ctx.moveTo(p2x, p2z); ctx.lineTo(p3x, p3z); ctx.stroke();

  // Reflet soyeux
  ctx.strokeStyle = 'rgba(146, 88, 48, 0.75)';
  ctx.lineWidth = Math.max(0.4, w2 * 0.35);
  ctx.beginPath(); ctx.moveTo(p0x, p0z); ctx.lineTo(p2x, p2z); ctx.stroke();
  ctx.restore();

  // 3. Tête du Character
  ctx.save();
  ctx.translate(tx(w.x), tz(w.z));
  ctx.rotate(-w.yaw);

  // Body icon (tête)
  ctx.fillStyle   = '#d32f2f'; // Red Theme Accent
  ctx.strokeStyle = characterOffscreen ? 'rgba(234, 88, 12, 0.95)' : 'rgba(255,255,255,0.9)';
  ctx.lineWidth   = Math.max(0.8, 0.8 * sc);
  
  // Cercle de la tête
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Hors plan : le cône est rogné par le bord, on matérialise donc le sens par une flèche (+Y local = avant)
  if (characterOffscreen) {
    ctx.beginPath();
    ctx.moveTo(-R * 0.65, R * 1.15);
    ctx.lineTo(R * 0.65, R * 1.15);
    ctx.lineTo(0, R * 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  ctx.restore();

  // Fin du décalage de bornage
  ctx.restore();
}

// ── Composant HTML principal ──────────────────────────────────────────────────

export function Minimap({ embedded = false, showGroup = true }: MinimapProps = {}) {
  const isMobile = useIsMobile();
  const floatingCanvasRef = useRef<HTMLCanvasElement>(null);
  const expandedCanvasRef = useRef<HTMLCanvasElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [showEquipment, setShowEquipment] = useState(true);

  // Contrôles de zoom et déplacement (Pan) pour la grande minimap
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const smallW = isMobile ? SMALL_W_MOBILE : SMALL_W_DESKTOP;

  // Boucle de rendu pour la minimap compacte (flottante ou embedded)
  useEffect(() => {
    if (!isOpen || expanded) return;
    const canvas = floatingCanvasRef.current;
    if (!canvas) return;

    let currentSmallW = smallW;
    const resize = () => {
      currentSmallW = canvas.clientWidth;
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(currentSmallW * dpr);
      canvas.height = canvas.width;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let rafId: number;
    let lastDraw = 0;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (isAppIdle()) return;
      if (now - lastDraw < 50) return; // Limite à 20 FPS (au lieu de 60/120 FPS continus)
      lastDraw = now;
      drawMinimap(canvas, currentSmallW, showEquipment);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [smallW, isOpen, expanded, showEquipment]);

  // Boucle de rendu pour la minimap agrandie (modal)
  useEffect(() => {
    if (!expanded) return;
    const canvas = expandedCanvasRef.current;
    if (!canvas) return;

    let currentExpW = 200;

    const resize = () => {
      const chromeH = 70;
      // Ratio carré pour la minimap agrandie
      const maxSide = Math.min(window.innerWidth * 0.88, window.innerHeight * 0.84 - chromeH, 620);
      const squareSide = Math.max(220, Math.round(maxSide));
      currentExpW = squareSide;

      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(squareSide * dpr);
      canvas.height = Math.round(squareSide * dpr);
      canvas.style.width = `${squareSide}px`;
      canvas.style.height = `${squareSide}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    let rafId: number;
    let lastDraw = 0;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (isAppIdle()) return;
      if (now - lastDraw < 40) return; // Limite à 25 FPS quand agrandie
      lastDraw = now;
      drawMinimap(canvas, currentExpW, showEquipment);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, [expanded, showEquipment]);

  // Zoom molette non-passif : empêche formellement le zoom global de la page du navigateur
  useEffect(() => {
    if (!expanded) return;
    const el = zoomContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom(prev => {
        const next = Math.min(5, Math.max(0.5, +(prev * factor).toFixed(2)));
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [expanded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape' && expanded) {
        setExpanded(false);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
      if (e.key === '9' || e.code === 'Digit9' || e.code === 'Numpad9') {
        setIsOpen(c => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    isPanningRef.current = true;
    startPanRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - startPanRef.current.x;
    const dy = e.clientY - startPanRef.current.y;
    setPan({
      x: startPanRef.current.panX + dx,
      y: startPanRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isPanningRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const equipmentButton = (compact = false) => (
    <button
      type="button"
      className={`btn btn-sm py-0 px-1 d-flex align-items-center gap-1 ${showEquipment ? 'btn-primary' : 'btn-outline-secondary text-dark'}`}
      aria-label="Équipements"
      aria-pressed={showEquipment}
      title={`${showEquipment ? 'Cacher' : 'Afficher'} les équipements sur la minimap`}
      onClick={(e) => {
        e.stopPropagation();
        setShowEquipment(visible => !visible);
      }}
    >
      <i className="bi bi-box-seam" aria-hidden="true" />
      <span className={compact ? 'visually-hidden' : 'small'}>Équipements</span>
    </button>
  );

  const minimapContent = (
    <div
      className="d-flex justify-content-center p-1 bg-transparent"
      style={{ cursor: 'pointer' }}
      onClick={() => {
        setExpanded(true);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }}
    >
      <div className="ratio ratio-1x1 w-100">
        <canvas
          ref={floatingCanvasRef}
          className="rounded-2 d-block bg-transparent"
          style={{ opacity: 0.95, transition: 'transform 0.15s ease' }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* ── EXPANDED MODAL VIEW (Grande Minimap Zoomable - rendu via Portal sur document.body) ── */}
      {expanded && typeof document !== 'undefined' && createPortal(
        <div
          className="position-fixed d-flex align-items-center justify-content-center"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'transparent',
            zIndex: 99999,
            pointerEvents: 'auto',
          }}
          onClick={() => {
            setExpanded(false);
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <div 
            className="card glass-card shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'fit-content',
              maxWidth: '96vw',
              maxHeight: '94vh',
              pointerEvents: 'auto',
              background: 'rgba(255, 255, 255, 0.32)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              border: '1px solid rgba(255, 255, 255, 0.55)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 100000,
            }}
          >
            {/* Header style accordéon (comme Perf / Group) */}
            <div className="card-header border-0 border-bottom border-light-subtle bg-transparent px-2 py-1.5 d-flex flex-wrap justify-content-between align-items-center gap-2 flex-shrink-0">
              <div className="d-flex align-items-center gap-1.5">
                <span className="fw-bold text-dark text-uppercase small d-flex align-items-center gap-1">
                  <span>🗺️</span>
                  <span>Plan 2D</span>
                </span>
                {zoom !== 1 && (
                  <span className="badge bg-primary bg-opacity-75 text-white fw-semibold" style={{ fontSize: '0.65rem', padding: '0.2em 0.4em' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center gap-1">
                {equipmentButton()}
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-1.5 fw-bold text-dark"
                    style={{ height: '22px', lineHeight: '20px', fontSize: '11px' }}
                    onClick={() => setZoom(z => {
                      const next = Math.max(0.5, +(z - 0.25).toFixed(2));
                      if (next === 1) setPan({ x: 0, y: 0 });
                      return next;
                    })}
                    disabled={zoom <= 0.5}
                    title="Dézoomer"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-1.5 fw-bold text-dark"
                    style={{ height: '22px', lineHeight: '20px', fontSize: '11px' }}
                    onClick={() => setZoom(z => Math.min(5, +(z + 0.25).toFixed(2)))}
                    disabled={zoom >= 5}
                    title="Zoomer"
                  >
                    +
                  </button>
                </div>
                {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger py-0 px-1.5 fw-semibold"
                    style={{ height: '22px', lineHeight: '20px', fontSize: '10px' }}
                    onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                    title="Réinitialiser zoom 100%"
                  >
                    ↺ 100%
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn-close ms-1" 
                  style={{ fontSize: '0.65rem' }}
                  aria-label="Close" 
                  onClick={() => {
                    setExpanded(false);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                />
              </div>
            </div>

            {/* Conteneur de zoom et pan compact et transparent */}
            <div 
              ref={zoomContainerRef}
              className="position-relative d-flex align-items-center justify-content-center overflow-hidden user-select-none p-1"
              style={{
                cursor: zoom > 1 ? (isPanningRef.current ? 'grabbing' : 'grab') : 'default',
                touchAction: 'none',
                maxWidth: 'calc(100% - 0.5rem)',
                maxHeight: 'calc(94vh - 70px)',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            >
              <canvas 
                ref={expandedCanvasRef} 
                className="rounded-2" 
                style={{
                  display: 'block',
                  background: 'transparent',
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isPanningRef.current ? 'none' : 'transform 0.1s ease-out',
                }} 
              />
            </div>

            {/* Footer compact avec bordure discrète */}
            <div className="card-footer border-0 border-top border-light-subtle bg-transparent text-center px-2 py-1 text-muted user-select-none text-wrap flex-shrink-0" style={{ fontSize: '10px', maxWidth: '100%' }}>
              💡 Molette pour zoomer · Glisser pour déplacer · Double-clic pour réinitialiser · Échap pour fermer
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MINIMAP CARD HARMONISÉE (Panel Header comme Perf, clic pour agrandir) ── */}
      <div
        className={`${embedded ? 'w-100' : 'position-fixed'} ${!embedded ? 'shadow-sm' : ''}`}
        style={embedded ? undefined : {
          bottom: isMobile ? 'calc(3.75rem + env(safe-area-inset-bottom) + 0.75rem)' : 20,
          left: isMobile ? 12 : undefined,
          right: isMobile ? undefined : 20,
          width: smallW + 8,
          zIndex: 90,
          pointerEvents: 'auto',
        }}
      >
        {!embedded && isMobile && (
          <div style={{ marginBottom: 6 }}>
            <DevToolsGroups Group={Group} compact />
          </div>
        )}
        {showGroup ? (
          <Group
            emoji="🗺️"
            title="Plan 2D"
            defaultOpen
            headerPadding="py-1.5 px-2"
            extra={equipmentButton(!embedded)}
            onToggle={(open) => setIsOpen(open)}
          >
            {minimapContent}
          </Group>
        ) : (
          <>
            <div className="d-flex justify-content-end px-1 pt-1">{equipmentButton()}</div>
            {minimapContent}
          </>
        )}
      </div>
    </>
  );
}
