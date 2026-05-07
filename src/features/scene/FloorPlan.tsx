/**
 * FloorPlan.tsx — plan 2D affiché dans la scène 3D (mode Plan).
 * Même dessin que la Minimap : drawFloorPlan() sur un canvas → CanvasTexture
 * projetée sur un PlaneGeometry horizontal.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  drawFloorPlan,
  PLAN_X_MIN, PLAN_X_MAX, PLAN_Z_MIN, PLAN_Z_MAX, PLAN_ASPECT,
} from './floorDraw';

export function FloorPlan() {
  const { texture, W, D, cx, cz } = useMemo(() => {
    const W = PLAN_X_MAX - PLAN_X_MIN;
    const D = PLAN_Z_MAX - PLAN_Z_MIN;
    const cw = 1024;
    const ch = Math.round(cw * PLAN_ASPECT);

    const canvas = document.createElement('canvas');
    canvas.width  = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111122';
    ctx.fillRect(0, 0, cw, ch);
    drawFloorPlan(ctx, cw, ch);

    return {
      texture: new THREE.CanvasTexture(canvas),
      W, D,
      cx: (PLAN_X_MIN + PLAN_X_MAX) / 2,
      cz: (PLAN_Z_MIN + PLAN_Z_MAX) / 2,
    };
  }, []);

  return (
    <mesh position={[cx, 3, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[W, D]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
