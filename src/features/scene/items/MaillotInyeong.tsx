/**
 * MaillotInyeong.tsx — Maillot de foot Coréen (Inyeong #25).
 * Modèle procédural rouge vif (#c8102e) avec col et détails noirs,
 * flocage au dos "INYEONG" et numéro 25, écusson Taegeuk sur la poitrine.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { GroupProps } from '@react-three/fiber';
import type { SceneItemProps } from '@shared/types';

export interface MaillotInyeongProps extends Partial<SceneItemProps>, GroupProps {
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

  const HALF_D = 1.0;

  // Profil du contour extérieur (identique pour l'avant et l'arrière)
  const perimeter = useMemo(() => [
    new THREE.Vector2(5.5, 13.5),    // 0: Encolure droite
    new THREE.Vector2(19.5, 4.5),    // 1: Pointe épaule droite
    new THREE.Vector2(26.0, 0.0),    // 2: Haut manche droite
    new THREE.Vector2(22.5, -11.0),  // 3: Bas manche droite
    new THREE.Vector2(18.5, -8.0),   // 4: Aisselle droite
    new THREE.Vector2(18.5, -42.0),  // 5: Bas droit
    new THREE.Vector2(0.0, -42.6),   // 6: Centre bas
    new THREE.Vector2(-18.5, -42.0), // 7: Bas gauche
    new THREE.Vector2(-18.5, -8.0),  // 8: Aisselle gauche
    new THREE.Vector2(-22.5, -11.0), // 9: Bas manche gauche
    new THREE.Vector2(-26.0, 0.0),   // 10: Haut manche gauche
    new THREE.Vector2(-19.5, 4.5),   // 11: Pointe épaule gauche
    new THREE.Vector2(-5.5, 13.5),   // 12: Encolure gauche
  ], []);

  // Panneau avant avec col ras-du-cou plongeant
  const frontGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(perimeter[0].x, perimeter[0].y);
    for (let i = 1; i < perimeter.length; i++) {
      shape.lineTo(perimeter[i].x, perimeter[i].y);
    }
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = -5.5 + 11.0 * t;
      const y = 13.5 - 3.7 * (1 - (x / 5.5) * (x / 5.5));
      shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [perimeter]);

  // Panneau arrière avec nuque montante
  const backGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(perimeter[0].x, perimeter[0].y);
    for (let i = 1; i < perimeter.length; i++) {
      shape.lineTo(perimeter[i].x, perimeter[i].y);
    }
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = -5.5 + 11.0 * t;
      const y = 13.5 - 0.7 * (1 - (x / 5.5) * (x / 5.5));
      shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [perimeter]);

  // Épaisseur latérale continue fermant les flancs et les manches
  const sideGeometry = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i < perimeter.length; i++) {
      const p = perimeter[i];
      positions.push(p.x, p.y, HALF_D);
      positions.push(p.x, p.y, -HALF_D);
      uvs.push(i / (perimeter.length - 1), 1);
      uvs.push(i / (perimeter.length - 1), 0);
    }

    for (let i = 0; i < perimeter.length - 1; i++) {
      const a = 2 * i;
      const b = 2 * i + 1;
      const c = 2 * (i + 1);
      const d = 2 * (i + 1) + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [perimeter, HALF_D]);

  // Bord-côte noir du col rond
  const collarGeometry = useMemo(() => {
    const collarPoints = [
      new THREE.Vector3(-5.5, 13.5, 0.0),
      new THREE.Vector3(-3.2, 10.8, HALF_D * 0.95),
      new THREE.Vector3(0.0, 9.8, HALF_D * 1.02),
      new THREE.Vector3(3.2, 10.8, HALF_D * 0.95),
      new THREE.Vector3(5.5, 13.5, 0.0),
      new THREE.Vector3(3.2, 13.0, -HALF_D * 0.95),
      new THREE.Vector3(0.0, 12.8, -HALF_D * 1.02),
      new THREE.Vector3(-3.2, 13.0, -HALF_D * 0.95),
    ];
    const curve = new THREE.CatmullRomCurve3(collarPoints, true);
    return new THREE.TubeGeometry(curve, 36, 0.35, 8, true);
  }, [HALF_D]);

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
    if (groupRef.current && onSize) {
      groupRef.current.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(groupRef.current);
      onSize(box.getSize(new THREE.Vector3()));
    }
  }, [onSize, frontGeometry]);

  return (
    <group
      ref={groupRef}
      {...props}
      userData={{ animUnit: true, itemName: 'Maillot Coréen - Inyeong' }}
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
