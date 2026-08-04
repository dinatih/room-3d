/**
 * SdbCloset.tsx — Placard PC-SDB : double porte coulissante + étagère triangulaire.
 * Coordonnées locales : centré XZ, Y=0 = sol, Z=0 = face mur (vers la SDB).
 * Fidèle à js/structure/bathroom.js (SLIDE_X0=70, SLIDE_X1=190, SLIDE_Z=600).
 *
 * Toggle (boolean) :
 *   false → fermé  (panneaux gauche/droite)
 *   true  → ouvert (les deux panneaux glissent à droite, côté gauche ouvert)
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { DiagWall, BATH_Z_END } from '@config';

const W       = 123.4; // BATH_E_FACE (192) - SHOWER_E_X (68.6)
const H       = 250;   // WALL_H
const PANEL_W = W / 2; // 61.7
const PANEL_T = 2.3;
const SEP_T   = 1;
const RAIL_D  = 7;
const SHELF_Y = 170;
const SHELF_T = 2;

const doorMat   = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.5 });
const railMat   = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.3 });
const shelfMat  = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.4 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.25, metalness: 0.8 });

// Positions X locales des panneaux
const X_CLOSED_L = -PANEL_W / 2;  // -27.5
const X_CLOSED_R = +PANEL_W / 2;  // +27.5
const X_OPEN     = +PANEL_W / 2;  // tous à droite quand ouvert

// Les deux panneaux se croisent : panneau L côté SDB, panneau R côté mur
const ZL = -(SEP_T / 2 + PANEL_T / 2);  // -1.65
const ZR = +(SEP_T / 2 + PANEL_T / 2);  // +1.65

export function SdbCloset({ actionState, onSize }: SceneItemProps) {
  const groupLRef = useRef<THREE.Group>(null!);
  const groupRRef = useRef<THREE.Group>(null!);
  const isOpen    = actionState['sdb-closet-toggle'] ?? false;
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, RAIL_D));
  }, []);

  const shelfGeo = useMemo(() => {
    // Coordonnées du centre du placard dans le monde (fixé dans Placements.tsx)
    const WORLD_X_CENTER = 130.3;
    
    // Pour -W/2 (côté gauche) :
    const xL = WORLD_X_CENTER - W / 2;
    const zL = DiagWall.A.z + (xL - DiagWall.A.x) * DiagWall.slope;
    const depthL = zL - BATH_Z_END;

    // Pour +W/2 (côté droit) :
    const xR = WORLD_X_CENTER + W / 2;
    const zR = DiagWall.A.z + (xR - DiagWall.A.x) * DiagWall.slope;
    const depthR = zR - BATH_Z_END;

    // Y du Shape devient -Z dans la 3D (après rotateX(-PI/2))
    // Donc une profondeur vers le sud (+Z) correspond à un Y négatif dans le Shape.
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0);          // Avant gauche
    shape.lineTo(+W / 2, 0);          // Avant droit
    shape.lineTo(+W / 2, -depthR);    // Arrière droit
    shape.lineTo(-W / 2, -depthL);    // Arrière gauche
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: SHELF_T, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, SHELF_Y, 0);
    return geo;
  }, []);

  useFrame(() => {
    const targetL = isOpen ? X_OPEN : X_CLOSED_L;
    const targetR = isOpen ? X_OPEN : X_CLOSED_R;
    const dL = targetL - groupLRef.current.position.x;
    const dR = targetR - groupRRef.current.position.x;
    if (Math.abs(dL) > 0.01 || Math.abs(dR) > 0.01) {
      groupLRef.current.position.x += dL * 0.12;
      groupRRef.current.position.x += dR * 0.12;
      invalidate();
    } else {
      groupLRef.current.position.x = targetL;
      groupRRef.current.position.x = targetR;
    }
  });

  return (
    <group userData={{ hoverAction: { label: 'Placard SDB', actionId: 'sdbCloset' } }}>
      {/* Rail haut */}
      <mesh position={[0, H - 1.5, 0]} castShadow material={railMat}>
        <boxGeometry args={[W + 4, 3, RAIL_D]} />
      </mesh>
      {/* Rail bas */}
      <mesh position={[0, 0.75, 0]} material={railMat}>
        <boxGeometry args={[W + 4, 1.5, RAIL_D]} />
      </mesh>

      {/* Panneau gauche + poignée */}
      <group ref={groupLRef} position={[X_CLOSED_L, 0, ZL]}>
        <mesh position={[0, H / 2, 0]} castShadow material={doorMat}>
          <boxGeometry args={[PANEL_W, H, PANEL_T]} />
        </mesh>
        <mesh position={[PANEL_W / 2 - 4, H * 0.5, -PANEL_T / 2 - 0.6]} material={handleMat}>
          <boxGeometry args={[1.2, 18, 1.2]} />
        </mesh>
      </group>

      {/* Panneau droit + poignée */}
      <group ref={groupRRef} position={[X_CLOSED_R, 0, ZR]}>
        <mesh position={[0, H / 2, 0]} castShadow material={doorMat}>
          <boxGeometry args={[PANEL_W, H, PANEL_T]} />
        </mesh>
        <mesh position={[-PANEL_W / 2 + 4, H * 0.5, PANEL_T / 2 + 0.6]} material={handleMat}>
          <boxGeometry args={[1.2, 18, 1.2]} />
        </mesh>
      </group>

      {/* Étagère triangulaire à 170cm */}
      <mesh geometry={shelfGeo} castShadow receiveShadow material={shelfMat} />
    </group>
  );
}
