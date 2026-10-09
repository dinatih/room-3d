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
import { DiagWall, pEast, pWest, pNorth, WALL_H } from '../wallData';
import { Grejig40329868 } from './Grejig40329868';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';

export const SDB_CLOSET_W = pWest('bath-se') - pEast('shower-ne');
export const SDB_CLOSET_D = 7;
export const SDB_CLOSET_X = (pEast('shower-ne') + pWest('bath-se')) / 2;
export const SDB_CLOSET_Z = pNorth('shower-ne') + SDB_CLOSET_D / 2;

const W       = SDB_CLOSET_W;
const H       = WALL_H;
const PANEL_W = W / 2;
const PANEL_T = 2.3;
const SEP_T   = 1;
const RAIL_D  = SDB_CLOSET_D;
const SHELF_Y = 170;
const SHELF_T = 2;

const doorMat   = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.5 });
const railMat   = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.3 });
const shelfMat  = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.4 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.25, metalness: 0.8 });

// Positions X locales des panneaux
const X_CLOSED_L = -PANEL_W / 2;
const X_CLOSED_R = +PANEL_W / 2;

// Les deux panneaux se croisent : panneau L côté SDB, panneau R côté mur
const ZL = -(SEP_T / 2 + PANEL_T / 2);
const ZR = +(SEP_T / 2 + PANEL_T / 2);

export function SdbCloset({ actionState, onSize }: SceneItemProps) {
  const groupLRef = useRef<THREE.Group>(null!);
  const groupRRef = useRef<THREE.Group>(null!);
  const isOpenL   = !!actionState.sdbClosetL;
  const isOpenR   = !!actionState.sdbClosetR;
  
  // Use refs for useFrame to prevent stale closures (as per GEMINI.md)
  const isOpenLRef = useRef(isOpenL);
  const isOpenRRef = useRef(isOpenR);
  
  useLayoutEffect(() => {
    isOpenLRef.current = isOpenL;
    isOpenRRef.current = isOpenR;
  }, [isOpenL, isOpenR]);

  const { invalidate } = useThree();

  useLayoutEffect(() => {
    groupLRef.current.position.x = isOpenRRef.current ? X_CLOSED_R : X_CLOSED_L;
    groupRRef.current.position.x = isOpenLRef.current ? X_CLOSED_L : X_CLOSED_R;
    onSize(new THREE.Vector3(W, H, RAIL_D));
  }, []);

  const shelfGeo = useMemo(() => {
    const xL = pEast('shower-ne');
    const xR = pWest('bath-se');

    const zL = DiagWall.A.z + (xL - DiagWall.A.x) * DiagWall.slope;
    const depthL = zL - SDB_CLOSET_Z;

    const zR = DiagWall.A.z + (xR - DiagWall.A.x) * DiagWall.slope;
    const depthR = zR - SDB_CLOSET_Z;

    // Y du Shape devient -Z dans la 3D (après rotateX(-PI/2))
    // Donc une profondeur vers le sud (+Z) correspond à un Y négatif dans le Shape.
    // L'étagère commence au niveau du dos des rails (local Z = RAIL_D / 2)
    // et va jusqu'au mur diagonal DiagWall (depthL / depthR).
    const frontZ = RAIL_D / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, -frontZ);       // Avant gauche
    shape.lineTo(+W / 2, -frontZ);       // Avant droit
    shape.lineTo(+W / 2, -depthR);       // Arrière droit
    shape.lineTo(-W / 2, -depthL);       // Arrière gauche
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: SHELF_T, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, SHELF_Y, 0);
    return geo;
  }, []);

  useFrame(() => {
    // groupLRef (en -X) est la Porte Droite depuis la SDB -> obéit à isOpenR
    const targetL = isOpenRRef.current ? X_CLOSED_R : X_CLOSED_L;
    // groupRRef (en +X) est la Porte Gauche depuis la SDB -> obéit à isOpenL
    const targetR = isOpenLRef.current ? X_CLOSED_L : X_CLOSED_R;
    const curL = groupLRef.current.position.x;
    const curR = groupRRef.current.position.x;
    if (curL === targetL && curR === targetR) return;

    const dL = targetL - curL;
    const dR = targetR - curR;
    let changed = false;
    if (Math.abs(dL) > 0.01) {
      groupLRef.current.position.x += dL * 0.12;
      changed = true;
    } else if (curL !== targetL) {
      groupLRef.current.position.x = targetL;
      changed = true;
    }

    if (Math.abs(dR) > 0.01) {
      groupRRef.current.position.x += dR * 0.12;
      changed = true;
    } else if (curR !== targetR) {
      groupRRef.current.position.x = targetR;
      changed = true;
    }

    if (changed) invalidate();
  });

  return (
    <group>
      {/* Rail haut */}
      <mesh position={[0, H - 1.5, 0]} castShadow material={railMat}>
        <boxGeometry args={[W, 3, RAIL_D]} />
      </mesh>
      {/* Rail bas */}
      <mesh position={[0, 0.75, 0]} material={railMat}>
        <boxGeometry args={[W, 1.5, RAIL_D]} />
      </mesh>

      {/* Panneau gauche (en -X, ce qui correspond à la Droite depuis la SDB) */}
      <group ref={groupLRef} position-y={0} position-z={ZL}
             userData={{ hoverAction: { label: 'Porte SDB D', actionId: 'sdbClosetR' } }}>
        <mesh position={[0, H / 2, 0]} castShadow material={doorMat}>
          <boxGeometry args={[PANEL_W, H, PANEL_T]} />
        </mesh>
        <mesh position={[PANEL_W / 2 - 4, H * 0.5, -PANEL_T / 2 - 0.6]} material={handleMat}>
          <boxGeometry args={[1.2, 18, 1.2]} />
        </mesh>
      </group>

      {/* Panneau droit (en +X, ce qui correspond à la Gauche depuis la SDB) */}
      <group ref={groupRRef} position-y={0} position-z={ZR}
             userData={{ hoverAction: { label: 'Porte SDB G', actionId: 'sdbClosetL' } }}>
        <mesh position={[0, H / 2, 0]} castShadow material={doorMat}>
          <boxGeometry args={[PANEL_W, H, PANEL_T]} />
        </mesh>
        <mesh position={[-PANEL_W / 2 + 4, H * 0.5, PANEL_T / 2 + 0.6]} material={handleMat}>
          <boxGeometry args={[1.2, 18, 1.2]} />
        </mesh>
      </group>

      {/* Étagère triangulaire à 170cm */}
      <mesh geometry={shelfGeo} castShadow receiveShadow material={shelfMat} />

      {/* Étagère à chaussures GREJIG le long de la porte droite du placard (côté Ouest) */}
      <group position={[X_CLOSED_L, 0, 20]} rotation={[0, 0, 0]} userData={{ animUnit: true, itemName: 'Étagère chaussures Grejig SDB' }}>
        <Grejig40329868 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </group>
  );
}
