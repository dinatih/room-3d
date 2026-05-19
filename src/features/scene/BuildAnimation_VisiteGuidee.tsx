/**
 * BuildAnimation_VisiteGuidee.tsx — Visite guidée du studio.
 *
 * Scripte le Walker (Lara) à travers une succession de points : entrée par la
 * porte diagonale, tour de la salle de bain (douche, WC, lavabo), placard
 * couloir (ouvre/referme), coin séjour, coin cuisine, lit, traversée de la
 * porte-fenêtre vers le jardin, passage le long de la baignoire et regard
 * final vers le studio.
 *
 * Walker piloté via `cameraState.walker0X/Z`, `walkYaw`, `isMoving`.
 * Portes déclenchées via `furniture-toggle` (mêmes clés que HoverMenu).
 * Caméra : chase cam dispatchée chaque frame en `camera-view`
 * (handler dans CameraController.onView).
 */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { cameraState } from './cameraState';
import { GLASS_DOOR_X } from './wallData';
import {
  DIAG_AX, DIAG_AZ,
  DOOR_START, KITCHEN_X0, KITCHEN_Z, BATH_Z_END, NICHE_X,
} from '@config';

// Convention yaw : sin(yaw)=Δx, cos(yaw)=Δz  ⇒  yaw = atan2(dx, dz).
// (Cohérent avec Walker.tsx : groupRef.rotation.y = walkYaw)

type Segment = {
  to:             [number, number];  // (X, Z) cible au sol
  walkMs:         number;            // durée du segment de marche
  pauseMs?:       number;            // pause sur place après arrivée
  faceYaw?:       number;            // orientation finale explicite ; sinon = direction de marche
  actionAtStart?: string;            // clé furniture-toggle déclenchée en début de segment
  actionAtEnd?:   string;            // clé furniture-toggle déclenchée à l'arrivée
};

// Coordonnées clés
const SHOWER_XZ:  [number, number] = [NICHE_X + 35, BATH_Z_END + 35];   // (25, 635)
const TOILET_XZ:  [number, number] = [NICHE_X + 60, KITCHEN_Z + 46.5];  // (50, 506.5)
const VASQUE_XZ:  [number, number] = [DOOR_START - 84, KITCHEN_Z + 12]; // (116, 472)
const KITCHEN_XZ: [number, number] = [KITCHEN_X0, KITCHEN_Z];           // (30, 460)
const BED_XZ:     [number, number] = [260, 130];
const BATHTUB_XZ: [number, number] = [120, -250];

const START_POS:  [number, number] = [DIAG_AX + 25, DIAG_AZ + 5]; // dehors, devant la porte

const TOUR: Segment[] = [
  // 1. Approche : on ouvre la porte d’entrée et on entre
  { to: [DIAG_AX - 20, DIAG_AZ - 10], walkMs: 1600, actionAtStart: 'entryDoor', pauseMs: 300 },

  // 2. Vers la porte SDB (ouverture)
  { to: [DOOR_START + 5, BATH_Z_END - 15], walkMs: 2200, actionAtStart: 'bathroomDoor', pauseMs: 400 },

  // 3. Devant la douche
  { to: [90, BATH_Z_END - 25],
    walkMs: 1500,
    faceYaw: Math.atan2(SHOWER_XZ[0] - 90, SHOWER_XZ[1] - (BATH_Z_END - 25)),
    pauseMs: 1500 },

  // 4. Devant le WC
  { to: [95, KITCHEN_Z + 70],
    walkMs: 1100,
    faceYaw: Math.atan2(TOILET_XZ[0] - 95, TOILET_XZ[1] - (KITCHEN_Z + 70)),
    pauseMs: 1400 },

  // 5. Devant le lavabo
  { to: [165, KITCHEN_Z + 55],
    walkMs: 1000,
    faceYaw: Math.atan2(VASQUE_XZ[0] - 165, VASQUE_XZ[1] - (KITCHEN_Z + 55)),
    pauseMs: 1400 },

  // 6. Sortie SDB → couloir
  { to: [215, BATH_Z_END - 25], walkMs: 1400 },

  // 7. Devant placard couloir — ouverture
  { to: [165, 405], walkMs: 1500, faceYaw: 0, actionAtEnd: 'corrDoors', pauseMs: 1800 },

  // 8. Refermeture du placard
  { to: [165, 405], walkMs: 200, faceYaw: 0, actionAtEnd: 'corrDoors', pauseMs: 600 },

  // 9. Vers le coin séjour puis cuisine
  { to: [110, 380], walkMs: 900 },
  { to: [80, 360],
    walkMs: 1100,
    faceYaw: Math.atan2(KITCHEN_XZ[0] - 80, KITCHEN_XZ[1] - 360),
    pauseMs: 1600 },

  // 10. Vers le lit
  { to: [200, 200], walkMs: 1700 },
  { to: [220, 160],
    walkMs: 900,
    faceYaw: Math.atan2(BED_XZ[0] - 220, BED_XZ[1] - 160),
    pauseMs: 1500 },

  // 11. Vers la porte vitrée — ouverture
  { to: [GLASS_DOOR_X, 35], walkMs: 1700, faceYaw: Math.PI, actionAtEnd: 'eastGlassDoor', pauseMs: 900 },

  // 12. Traversée de la porte vers le jardin
  { to: [GLASS_DOOR_X, -40], walkMs: 1300, faceYaw: Math.PI },

  // 13. Longer la baignoire
  { to: [200, -200], walkMs: 1700 },
  { to: [190, -240],
    walkMs: 700,
    faceYaw: Math.atan2(BATHTUB_XZ[0] - 190, BATHTUB_XZ[1] - (-240)),
    pauseMs: 1500 },

  // 14. Recul + se retourner vers le studio
  { to: [160, -340], walkMs: 1500, faceYaw: 0, pauseMs: 2800 },
];

const TOTAL_MS = TOUR.reduce((a, s) => a + s.walkMs + (s.pauseMs ?? 0), 0);

// Chase camera (3e personne) — caméra plus haute (>4 m du sol) pour une plongée nette
const CAM_HEIGHT_3RD  = 420;
const CAM_BEHIND_3RD  = 190;
const CAM_LOOK_Y      = 110;
const CAM_LOOK_AHEAD  = 60;

// Vue première personne — caméra dans la tête de Lara
const EYE_HEIGHT      = 162;
const FPV_LOOK_AHEAD  = 100;

// Vue top 2D — caméra plein-ciel orientée nord, suit la position du walker
const TOP_HEIGHT      = 750;

const YAW_LERP    = 0.18;

type ViewMode = '3rd' | '1st' | 'top';
const NEXT_VIEW: Record<ViewMode, ViewMode> = { '3rd': '1st', '1st': 'top', 'top': '3rd' };

function wrapAngle(a: number): number {
  return ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

export function BuildAnimation_VisiteGuidee({
  onFinish, onDuration,
}: { onFinish: () => void; onDuration?: (ms: number) => void }) {
  const { camera, invalidate } = useThree();
  const finishedRef = useRef(false);
  const viewModeRef = useRef<ViewMode>('3rd');

  useEffect(() => {
    onDuration?.(TOTAL_MS);

    // Sauvegarde de l'état caméra/walker pour restauration en cleanup
    const savedActiveIdx = cameraState.activeWalkerIdx;
    const savedX = cameraState.walker0X, savedZ = cameraState.walker0Z;
    const savedYaw = cameraState.walkYaw;
    const savedCamPos = camera.position.clone();
    const savedWalkerHidden = cameraState.walkerHidden;

    // Cycle vue : 3e personne → 1re personne → top 2D → 3e personne … (touche V)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'v' && e.key !== 'V') return;
      viewModeRef.current = NEXT_VIEW[viewModeRef.current];
      cameraState.walkerHidden = viewModeRef.current === '1st';
      invalidate();
    };
    window.addEventListener('keydown', onKey);

    // Walker en mode "scénarisé"
    cameraState.activeWalkerIdx = 0;
    cameraState.isWalking = false;
    cameraState.isMoving  = false;
    cameraState.walker0X = START_POS[0];
    cameraState.walker0Z = START_POS[1];
    cameraState.walkYaw  = Math.atan2(TOUR[0].to[0] - START_POS[0],
                                      TOUR[0].to[1] - START_POS[1]);
    cameraState.walkerX = cameraState.walker0X;
    cameraState.walkerZ = cameraState.walker0Z;

    const startedActions = new Set<number>();
    const endedActions   = new Set<number>();

    let raf = 0;
    let startTime: number | null = null;
    let lastNow = performance.now();

    function tick(now: number) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const dt      = Math.max(0, now - lastNow);
      lastNow = now;

      // Localise le segment courant
      let acc = 0;
      let idx = 0;
      let local = 0;
      for (; idx < TOUR.length; idx++) {
        const seg   = TOUR[idx];
        const total = seg.walkMs + (seg.pauseMs ?? 0);
        if (elapsed < acc + total) { local = elapsed - acc; break; }
        acc += total;
      }

      if (idx >= TOUR.length) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          cameraState.isMoving = false;
          invalidate();
          onFinish();
        }
        return;
      }

      const seg  = TOUR[idx];
      const prev = idx === 0 ? START_POS : TOUR[idx - 1].to;

      // Déclenche l'action de début de segment une seule fois
      if (seg.actionAtStart && !startedActions.has(idx)) {
        startedActions.add(idx);
        document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: seg.actionAtStart } }));
      }

      // Position cible (lerp linéaire pendant walkMs, statique pendant pauseMs)
      let tx: number, tz: number, moving: boolean;
      if (local < seg.walkMs) {
        const t = seg.walkMs > 0 ? local / seg.walkMs : 1;
        tx = prev[0] + (seg.to[0] - prev[0]) * t;
        tz = prev[1] + (seg.to[1] - prev[1]) * t;
        moving = true;
      } else {
        tx = seg.to[0];
        tz = seg.to[1];
        moving = false;
        if (seg.actionAtEnd && !endedActions.has(idx)) {
          endedActions.add(idx);
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: seg.actionAtEnd } }));
        }
      }

      cameraState.walker0X = tx;
      cameraState.walker0Z = tz;
      cameraState.walkerX  = tx;
      cameraState.walkerZ  = tz;
      cameraState.isMoving = moving;

      // Lerp angulaire vers yaw cible
      const motionDx = seg.to[0] - prev[0];
      const motionDz = seg.to[1] - prev[1];
      const motionYaw = (motionDx !== 0 || motionDz !== 0)
        ? Math.atan2(motionDx, motionDz)
        : cameraState.walkYaw;
      const targetYaw = seg.faceYaw ?? motionYaw;
      const lerp = 1 - Math.exp(-YAW_LERP * (dt / 16.67));
      cameraState.walkYaw += wrapAngle(targetYaw - cameraState.walkYaw) * lerp;

      // Caméra : 3e personne (chase ~45°) / 1re personne (dans la tête) / top 2D (plein-ciel, nord en haut)
      const yaw = cameraState.walkYaw;
      let camPos:    [number, number, number];
      let camTarget: [number, number, number];
      if (viewModeRef.current === '1st') {
        camPos    = [tx, EYE_HEIGHT, tz];
        camTarget = [tx + Math.sin(yaw) * FPV_LOOK_AHEAD, EYE_HEIGHT, tz + Math.cos(yaw) * FPV_LOOK_AHEAD];
      } else if (viewModeRef.current === 'top') {
        // Léger décalage en Z pour éviter look-vector dégénéré sous up=(0,1,0)
        camPos    = [tx, TOP_HEIGHT, tz + 0.01];
        camTarget = [tx, 0, tz];
      } else {
        camPos    = [tx - Math.sin(yaw) * CAM_BEHIND_3RD, CAM_HEIGHT_3RD, tz - Math.cos(yaw) * CAM_BEHIND_3RD];
        camTarget = [tx + Math.sin(yaw) * CAM_LOOK_AHEAD, CAM_LOOK_Y,     tz + Math.cos(yaw) * CAM_LOOK_AHEAD];
      }
      document.dispatchEvent(new CustomEvent('camera-view', {
        detail: { pos: camPos, target: camTarget },
      }));

      invalidate();
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      cameraState.isMoving = false;
      cameraState.activeWalkerIdx = savedActiveIdx;
      cameraState.walker0X = savedX;
      cameraState.walker0Z = savedZ;
      cameraState.walkerX  = savedX;
      cameraState.walkerZ  = savedZ;
      cameraState.walkYaw  = savedYaw;
      cameraState.walkerHidden = savedWalkerHidden;
      camera.position.copy(savedCamPos);
      invalidate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
