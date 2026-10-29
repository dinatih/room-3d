/**
 * MaillotInyeong.tsx — Maillot de foot Coréen (Inyeong #25).
 * Modèle procédural rouge vif (#c8102e) avec col et détails noirs,
 * flocage au dos "INYEONG" et numéro 25, écusson Taegeuk sur la poitrine.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { createShirtGeometry, SHIRT_HALF_DEPTH as HALF_D } from './shirtGeometry';
import { glbLocalBBox } from '../glbUtils';
import type { ThreeElements } from '@react-three/fiber';
import type { SceneItemProps } from '@shared/types';

export type MaillotInyeongProps = Partial<SceneItemProps> & ThreeElements['group'] & {
  playerName?: string;
  playerNumber?: string | number;
}

export function MaillotInyeong({
  playerName = 'INYEONG',
  playerNumber = '24',
  onSize,
  ...props
}: MaillotInyeongProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.load('1em "Bebas Neue"').then(() => {
        setFontReady(true);
      }).catch(() => {});
    }
  }, []);

  const { frontGeometry, backGeometry, sideGeometry, collarGeometry } = useMemo(() => createShirtGeometry(.35), []);

  // Matériaux : Rouge Corée officiel et noir pour le col
  const jerseyMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xc8102e,
      roughness: 0.85,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });
  }, []);

  const blackCollarMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.92,
      metalness: 0.02,
    });
  }, []);

  const labelMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.6,
      metalness: 0.1,
    });
  }, []);

  // Flocage au dos : nom du joueur et grand numéro 25
  const backFlockingTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 1024, 1024);

    // Nom "INYEONG" au dos en 2x plus grand (260px) avec la police Bebas Neue
    ctx.fillStyle = '#111111';
    ctx.font = '700 260px "Bebas Neue", "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '6px';
    ctx.fillText(String(playerName).toUpperCase(), 512, 190);

    // Numéro imposant style maillot de foot en Bebas Neue
    ctx.font = '700 500px "Bebas Neue", "Impact", "Arial Black", sans-serif';
    ctx.letterSpacing = '0px';
    ctx.fillText(String(playerNumber), 512, 630);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }, [playerName, playerNumber, fontReady]);

  // Écusson Corée (Taegeuk rouge/bleu) et numéro poitrine
  const frontCrestTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, 512, 512);

    // Écusson gauche : cercle Taegeuk
    const cx = 150;
    const cy = 256;
    const r = 72;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Moitié supérieure rouge
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true);
    ctx.arc(cx, cy - r / 2, r / 2, Math.PI / 2, -Math.PI / 2, false);
    ctx.arc(cx, cy + r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true);
    ctx.fill();

    // Moitié inférieure bleue
    ctx.fillStyle = '#003478';
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2, true);
    ctx.arc(cx, cy - r / 2, r / 2, -Math.PI / 2, Math.PI / 2, true);
    ctx.arc(cx, cy + r / 2, r / 2, Math.PI / 2, -Math.PI / 2, false);
    ctx.fill();
    ctx.restore();

    // Petit numéro sur la poitrine côté droit en Bebas Neue
    ctx.fillStyle = '#111111';
    ctx.font = '700 160px "Bebas Neue", "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(playerNumber), 370, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }, [playerNumber, fontReady]);

  useLayoutEffect(() => {
    onSize?.(glbLocalBBox(groupRef.current).getSize(new THREE.Vector3()));
  }, [onSize, frontGeometry]);

  return (
    <group
      ref={groupRef}
      {...props}
      userData={{ sceneItemRoot: true, itemName: 'Maillot Coréen - Inyeong' }}
    >
      {/* Panneau avant rouge */}
      <mesh
        geometry={frontGeometry}
        material={jerseyMaterial}
        position={[0, 0, HALF_D]}
        castShadow
        receiveShadow
      />

      {/* Panneau arrière rouge */}
      <mesh
        geometry={backGeometry}
        material={jerseyMaterial}
        position={[0, 0, -HALF_D]}
        rotation={[0, Math.PI, 0]}
        castShadow
        receiveShadow
      />

      {/* Flancs et manches continus */}
      <mesh
        geometry={sideGeometry}
        material={jerseyMaterial}
        castShadow
        receiveShadow
      />

      {/* Col rond contrasté noir */}
      <mesh
        geometry={collarGeometry}
        material={blackCollarMaterial}
        castShadow
        receiveShadow
      />

      {/* Écusson Taegeuk et petit numéro 25 sur le torse */}
      {frontCrestTexture && (
        <mesh position={[0, -5, HALF_D + 0.03]}>
          <planeGeometry args={[22, 13]} />
          <meshStandardMaterial
            map={frontCrestTexture}
            transparent
            roughness={0.88}
            metalness={0.02}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}

      {/* Flocage arrière "INYEONG" et grand numéro 25 */}
      {backFlockingTexture && (
        <mesh position={[0, -14, -HALF_D - 0.03]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[27, 29]} />
          <meshStandardMaterial
            map={backFlockingTexture}
            transparent
            roughness={0.88}
            metalness={0.02}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}

      {/* Étiquette d'entretien intérieure au col */}
      <mesh
        position={[0, 11.4, -HALF_D + 0.08]}
        material={labelMaterial}
        castShadow
      >
        <boxGeometry args={[2.0, 2.2, 0.05]} />
      </mesh>
    </group>
  );
}
