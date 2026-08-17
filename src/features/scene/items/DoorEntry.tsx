/**
 * Porte d'entrée rouge — 90×204cm, charnière gauche, ouvre à -120°.
 * Encadrement rouge (extérieur) + blanc (intérieur).
 */
import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { SceneItemProps } from '@shared/types';

const W  = 90;    // ENTRY_DOOR_W
const H  = 204;   // DOOR_H
const T  = 4;     // épaisseur panneau
const R  = 1.3;

const FW = 3;     // largeur encadrement (chambranle)
const WW = 10;    // épaisseur du panneau (profondeur Z)

function useEntryFrameGeo() {
  return useMemo(() => {
    const redGeos: THREE.BufferGeometry[] = [];
    const whtGeos: THREE.BufferGeometry[] = [];
    const addBox = (geos: THREE.BufferGeometry[], w: number, h: number, d: number, x: number, y: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      geo.translate(x, y, z);
      geos.push(geo);
    };

    // Encadrement extérieur rouge (face -Z)
    const zRed = -(WW / 2 + 0.5);
    addBox(redGeos, FW, H, 1, -(W / 2 + FW / 2), H / 2, zRed);
    addBox(redGeos, FW, H, 1,  (W / 2 + FW / 2), H / 2, zRed);
    addBox(redGeos, W + FW * 2, FW, 1, 0, H + FW / 2, zRed);

    // Encadrement intérieur blanc (face +Z)
    const zWht = WW / 2 + 0.5;
    addBox(whtGeos, FW, H, 1, -(W / 2 + FW / 2), H / 2, zWht);
    addBox(whtGeos, FW, H, 1,  (W / 2 + FW / 2), H / 2, zWht);
    addBox(whtGeos, W + FW * 2, FW, 1, 0, H + FW / 2, zWht);

    const red = mergeGeometries(redGeos, false);
    const wht = mergeGeometries(whtGeos, false);
    redGeos.forEach(g => g.dispose());
    whtGeos.forEach(g => g.dispose());
    return { red, wht };
  }, []);
}

function useHandleGeo() {
  return useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const addGeo = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
      if (rx) geo.rotateX(rx);
      if (ry) geo.rotateY(ry);
      if (rz) geo.rotateZ(rz);
      geo.translate(x, y, z);
      geos.push(geo);
    };

    const fZ = T / 2;
    // Poignée intérieure
    addGeo(new THREE.CylinderGeometry(3, 3, 1, 12), 0, 0, fZ + 0.5, Math.PI / 2);
    addGeo(new THREE.CylinderGeometry(R, R, 5, 8),  0, 0, fZ + 3.5, Math.PI / 2);
    addGeo(new THREE.CylinderGeometry(R, R, 14, 8), -7, 0, fZ + 6, 0, 0, Math.PI / 2);
    addGeo(new THREE.SphereGeometry(R, 8, 6), 0, 0, fZ + 6);
    addGeo(new THREE.SphereGeometry(R, 8, 6), -14, 0, fZ + 6);

    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    return merged;
  }, []);
}

const redFrameMaterial = new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.5 });
const whiteFrameMaterial = new THREE.MeshStandardMaterial({ color: '#f5f5f0', roughness: 0.3 });
const redPanelMaterial = new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.5, metalness: 0.1 });
const metalHandleMaterial = new THREE.MeshStandardMaterial({ color: '#999999', metalness: 0.85, roughness: 0.15 });
const knobMaterial = new THREE.MeshStandardMaterial({ color: '#cc0000', metalness: 0.3, roughness: 0.4 });

export function DoorEntry({ actionState, onSize }: SceneItemProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState['entry-door-toggle'] ?? false;
  const { invalidate } = useThree();

  const frames = useEntryFrameGeo();
  const handle = useHandleGeo();

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W + FW * 2, H + FW, WW));
  }, []);

  useFrame(() => {
    const target = isOpen ? -(2 * Math.PI / 3) : 0;
    const delta = target - doorRef.current.rotation.y;
    if (Math.abs(delta) > 0.001) {
      doorRef.current.rotation.y += delta * 0.12;
      invalidate();
    } else {
      doorRef.current.rotation.y = target;
    }
  });

  return (
    <group position={[0, -H / 2, 0]}>
      <mesh geometry={frames.red} material={redFrameMaterial} castShadow />
      <mesh geometry={frames.wht} material={whiteFrameMaterial} castShadow />

      <group ref={doorRef} position={[-W / 2, 0, 0]}>
        {/* Panneau rouge */}
        <mesh position={[W / 2, H / 2, 0]} material={redPanelMaterial} castShadow receiveShadow>
          <boxGeometry args={[W, H, T]} />
        </mesh>

        {/* Poignée intérieure */}
        <mesh position={[70, 100, 0]} geometry={handle} material={metalHandleMaterial} />

        {/* Knob rouge extérieur (face -Z) */}
        <mesh position={[W / 2, H / 2, -T / 2 - 5]} material={knobMaterial}>
          <sphereGeometry args={[5, 16, 12]} />
        </mesh>
      </group>
    </group>
  );
}
