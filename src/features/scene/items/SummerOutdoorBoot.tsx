/**
 * SummerOutdoorBoot.tsx — Paire de baskets bottes d'été hommes (Temu).
 * 
 * Modélisation procédurale 3D fidèle à l'image :
 *   1. Semelle type "lames" (Blade Sole) : ExtrudeGeometry avec 4 ouvertures elliptiques.
 *   2. Tige montante (Bootie Upper) : Lofting de sections transversales avec découpe en U sur le côté latéral.
 *   3. Sangle de cheville : Sangle horizontale avec rabat velcro latéral.
 *   4. Sangle de coup-de-pied : Sangle diagonale croisée sur l'instep.
 *   5. Liseré de col : Piping clair (lumière rose/blanche) autour de l'ouverture du col.
 *   6. Languette arrière (Pull Tab) : Boucle de tirage au talon.
 * 
 * Coordonnées locales : Centré XZ, Y=0 = sol.
 * Paire : Pied gauche (X > 0, latéral à X < 0) et Pied droit (miroir X, scale.x = -1).
 */
import { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

// ── Dimensions et Constantes (1 unité = 1 cm) ─────────────────────────────────
const L = 29.0;         // Longueur totale (Z)
const W = 10.5;         // Largeur max (X)
const GAP = 2.0;        // Écartement de la paire
const SH_HEEL = 4.5;    // Hauteur semelle au talon
const SH_TOE = 1.8;     // Hauteur semelle à la pointe

// ── Palettes de couleurs et matériaux ──────────────────────────────────────────
const matRedUpper = new THREE.MeshStandardMaterial({
  color: 0xd01c1c,
  roughness: 0.55,
  metalness: 0.05,
  side: THREE.DoubleSide,
});

const matRedSole = new THREE.MeshStandardMaterial({
  color: 0xaa1414,
  roughness: 0.70,
  metalness: 0.0,
  side: THREE.DoubleSide,
});

const matDarkTread = new THREE.MeshStandardMaterial({
  color: 0x550a0a,
  roughness: 0.85,
});

const matLightTrim = new THREE.MeshStandardMaterial({
  color: 0xffe8e5, // Rose très clair/blanc cassé
  roughness: 0.80,
  side: THREE.DoubleSide,
});

const matVelcroStrap = new THREE.MeshStandardMaterial({
  color: 0xd82222,
  roughness: 0.60,
  metalness: 0.02,
  side: THREE.DoubleSide,
});

// ── 1. Forme 2D de la semelle (profil Z-Y) ──────────────────────────────────────
const soleShape = (() => {
  const shape = new THREE.Shape();
  // Z va de -14.5 (pointe) à 14.5 (talon) dans l'espace de la forme
  // Y va de 0 au dessus de la semelle
  
  // Point de départ : talon supérieur (Z = 14.5, Y = SH_HEEL)
  shape.moveTo(14.5, SH_HEEL);
  
  // Courbe du talon (arrière)
  shape.bezierCurveTo(15.2, SH_HEEL * 0.8, 15.0, 1.2, 13.5, 0.0);
  
  // Dessous de la semelle (légèrement incurvé au niveau de la voûte plantaire)
  shape.quadraticCurveTo(0.0, 0.1, -13.5, 0.0);
  
  // Courbe de la pointe (avant)
  shape.bezierCurveTo(-15.0, 0.8, -15.0, SH_TOE * 0.8, -14.5, SH_TOE);
  
  // Profil supérieur de la semelle (du bout vers le talon)
  shape.quadraticCurveTo(0.0, 2.85, 14.5, SH_HEEL);

  // Ajout des 4 découpes elliptiques (trous de suspension de la semelle)
  // Les trous doivent être définis dans le sens horaire (CW) pour être soustraits
  const makeHole = (cx: number, cy: number, rx: number, ry: number) => {
    const p = new THREE.Path();
    p.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, true);
    return p;
  };

  shape.holes.push(
    makeHole(9.0, 2.0, 2.2, 0.8),    // Trou talon
    makeHole(3.5, 1.7, 2.0, 0.7),    // Trou arrière-milieu
    makeHole(-2.5, 1.4, 1.8, 0.5),   // Trou milieu-avant
    makeHole(-8.0, 1.0, 1.4, 0.4)    // Trou pointe
  );

  return shape;
})();

const soleExtrudeSettings = {
  depth: W - 0.4,
  bevelEnabled: true,
  bevelThickness: 0.2,
  bevelSize: 0.2,
  bevelSegments: 3,
  steps: 1,
};

// Geometry unique de la semelle extrudée
const soleGeo = new THREE.ExtrudeGeometry(soleShape, soleExtrudeSettings);
soleGeo.center(); // Centre la géométrie

// ── 2. Géométrie de la tige (Bootie Upper) ─────────────────────────────────────
const numSlices = 20;
const numRadial = 40;

const upperGeo = (() => {
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < numSlices; s++) {
    const v = s / (numSlices - 1);
    // Interpolation non-linéaire pour donner du galbe
    const t = Math.pow(v, 1.3);

    for (let r = 0; r < numRadial; r++) {
      const angle = (r / numRadial) * Math.PI * 2;

      // Base du pied (épouse la semelle)
      const zBase = 14.5 * Math.cos(angle);
      let wBase = 4.25;
      if (zBase < 0) {
        const u = -zBase / 14.5;
        wBase = 3.8 * (1 - u) + 4.6 * Math.sin(u * Math.PI) * (1 - u) + 0.3 * u;
      } else {
        const u = zBase / 14.5;
        wBase = 3.8 * (1 - u) + 4.2 * Math.sin(u * Math.PI) * (1 - u) + 0.8 * u;
      }
      const xBase = wBase * Math.sin(angle);

      // Section cheville (col) : recentrée vers l'arrière
      const zCollar = 5.0 + 3.3 * Math.cos(angle);
      const xCollar = 2.8 * Math.sin(angle);

      // Interpolation X et Z
      const x = (1 - t) * xBase + t * xCollar;
      const z = (1 - t) * zBase + t * zCollar;

      // Calcul de la base Y (hauteur supérieure de la semelle)
      const base_y = 2.85 + 1.35 * (z / 14.5) + 0.3 * Math.pow(z / 14.5, 2);

      // Profil de hauteur du col (sommet Y)
      let hTop = 17.5;
      
      // Rehausse de la languette (avant, angle proche de PI)
      if (Math.abs(angle - Math.PI) < Math.PI / 3) {
        const u = Math.abs(angle - Math.PI) / (Math.PI / 3);
        hTop += 1.5 * (1 - u * u);
      }
      
      // Rehausse du talon (arrière, angle proche de 0/2PI)
      let angleDist = angle;
      if (angleDist > Math.PI) angleDist = 2 * Math.PI - angle;
      if (angleDist < Math.PI / 4) {
        const u = angleDist / (Math.PI / 4);
        hTop += 1.0 * (1 - u * u);
      }

      // Découpe latérale en U (flanc extérieur, angle proche de 3*PI/2)
      // Concerne uniquement le pied gauche non-miroir (X < 0)
      const latDist = Math.abs(angle - 3 * Math.PI / 2);
      if (latDist < Math.PI / 3) {
        const u = latDist / (Math.PI / 3);
        hTop -= 6.0 * (1 - u * u); // Creux de 6 cm
      }

      // Léger creux médial (flanc intérieur, angle proche de PI/2)
      const medDist = Math.abs(angle - Math.PI / 2);
      if (medDist < Math.PI / 4) {
        const u = medDist / (Math.PI / 4);
        hTop -= 2.0 * (1 - u * u);
      }

      // Hauteur Y finale interpolée
      const y = base_y + v * (hTop - base_y);

      verts.push(x, y, z);
      uvs.push(r / numRadial, v);
    }
  }

  // Triangulation
  for (let s = 0; s < numSlices - 1; s++) {
    for (let r = 0; r < numRadial; r++) {
      const nextR = (r + 1) % numRadial;
      const i00 = s * numRadial + r;
      const i01 = s * numRadial + nextR;
      const i10 = (s + 1) * numRadial + r;
      const i11 = (s + 1) * numRadial + nextR;

      indices.push(i00, i10, i01);
      indices.push(i01, i10, i11);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
})();

// ── 3. Ligne de couture centrale et liseré de col (piping) ──────────────────────
// Extrait la courbe de la couture centrale à l'avant (r = numRadial / 2)
const frontSeamCurve = (() => {
  const points: THREE.Vector3[] = [];
  const rIndex = numRadial / 2;
  const positionAttr = upperGeo.getAttribute('position');
  
  for (let s = 0; s < numSlices; s++) {
    const idx = s * numRadial + rIndex;
    points.push(new THREE.Vector3(
      positionAttr.getX(idx),
      positionAttr.getY(idx),
      positionAttr.getZ(idx)
    ));
  }
  return new THREE.CatmullRomCurve3(points);
})();

// Extrait le contour supérieur du col pour le liseré clair
const collarTrimCurve = (() => {
  const points: THREE.Vector3[] = [];
  const positionAttr = upperGeo.getAttribute('position');
  const sLast = numSlices - 1;
  
  for (let r = 0; r < numRadial; r++) {
    const idx = sLast * numRadial + r;
    points.push(new THREE.Vector3(
      positionAttr.getX(idx),
      positionAttr.getY(idx),
      positionAttr.getZ(idx)
    ));
  }
  // Fermer la boucle
  const idx0 = sLast * numRadial;
  points.push(new THREE.Vector3(
    positionAttr.getX(idx0),
    positionAttr.getY(idx0),
    positionAttr.getZ(idx0)
  ));
  
  return new THREE.CatmullRomCurve3(points);
})();

// ── Composant d'une chaussure individuelle ──────────────────────────────────────
function SingleShoe({ mirror }: { mirror: boolean }) {
  // Points de repère pour les sangles
  // Sangle de cheville : autour de Y = 13
  const ankleCenterZ = 5.0;
  
  // Sangle de coup-de-pied (diagonale)
  // Définie sur le pied gauche (non-miroir) et sera automatiquement inversée par le groupe parent scale.x
  const instepStart = useMemo(() => new THREE.Vector3(-4.0, 3.2, -1.0), []); // Latéral
  const instepEnd = useMemo(() => new THREE.Vector3(3.8, 4.6, -7.0), []);   // Médial
  const instepCenter = useMemo(() => new THREE.Vector3().addVectors(instepStart, instepEnd).multiplyScalar(0.5), [instepStart, instepEnd]);
  const instepLen = useMemo(() => instepStart.distanceTo(instepEnd), [instepStart, instepEnd]);
  
  const instepRef = useRef<THREE.Group>(null);
  
  useLayoutEffect(() => {
    if (instepRef.current) {
      instepRef.current.lookAt(instepEnd);
    }
  }, [instepEnd]);

  return (
    <group scale={[mirror ? -1 : 1, 1, 1]}>
      
      {/* ── 1. Semelle (Blade Sole) ── */}
      {/* Positionnée pour centrer l'extrusion (de W/2 à -W/2) */}
      <mesh
        geometry={soleGeo}
        material={matRedSole}
        rotation={[0, -Math.PI / 2, 0]}
        position={[W / 2, 0, 0]}
        castShadow
        receiveShadow
      />
      
      {/* Semelle extérieure fine noire sous le dessous (tread) */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W - 0.6, L - 0.6]} />
        <meshStandardMaterial {...matDarkTread} />
      </mesh>

      {/* ── 2. Tige (Upper) ── */}
      <mesh geometry={upperGeo} material={matRedUpper} castShadow receiveShadow />

      {/* ── 3. Liseré clair du col (piping) ── */}
      <mesh castShadow>
        <tubeGeometry args={[collarTrimCurve, 45, 0.12, 6, true]} />
        <primitive object={matLightTrim} />
      </mesh>

      {/* ── 4. Couture centrale en relief ── */}
      <mesh castShadow>
        <tubeGeometry args={[frontSeamCurve, 20, 0.08, 5, false]} />
        <meshStandardMaterial color={0x900a0a} roughness={0.8} />
      </mesh>

      {/* ── 5. Sangle de cheville ── */}
      <group position={[0, 13.2, ankleCenterZ]} scale={[1.05, 1.0, 1.15]}>
        {/* Bande principale de cheville (cylindre ouvert) */}
        <mesh castShadow>
          <cylinderGeometry args={[2.9, 3.0, 2.2, 32, 1, true]} />
          <primitive object={matVelcroStrap} />
        </mesh>
        
        {/* Rabat Velcro épais sur le côté latéral (X < 0) */}
        <mesh position={[-2.95, 0, -0.6]} rotation={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.2, 2.2, 3.2]} />
          <primitive object={matVelcroStrap} />
        </mesh>
        
        {/* Bout clair/couture du velcro */}
        <mesh position={[-3.06, 0, -2.1]} castShadow>
          <boxGeometry args={[0.04, 2.0, 0.2]} />
          <primitive object={matLightTrim} />
        </mesh>
      </group>

      {/* ── 6. Sangle diagonale coup-de-pied (Instep Strap) ── */}
      <group ref={instepRef} position={instepCenter}>
        {/* La boîte est alignée sur l'axe Z local et regarde vers instepEnd */}
        <mesh castShadow>
          <boxGeometry args={[3.2, 0.16, instepLen]} />
          <primitive object={matVelcroStrap} />
        </mesh>
        {/* Couture décorative sur le dessus */}
        <mesh position={[0, 0.09, 0]} castShadow>
          <boxGeometry args={[0.08, 0.04, instepLen - 0.2]} />
          <meshStandardMaterial color={0x900a0a} roughness={0.8} />
        </mesh>
      </group>

      {/* ── 7. Languette d'enfilage arrière (Pull Tab) ── */}
      <group position={[0, 17.5, 8.4]} rotation={[-0.35, 0, 0]}>
        {/* Boucle extérieure rouge */}
        <mesh castShadow>
          <boxGeometry args={[0.8, 2.4, 0.12]} />
          <primitive object={matRedSole} />
        </mesh>
        {/* Doublure intérieure claire */}
        <mesh position={[0, 0, -0.07]} castShadow>
          <boxGeometry args={[0.7, 2.2, 0.03]} />
          <primitive object={matLightTrim} />
        </mesh>
      </group>

    </group>
  );
}

// ── Composant exporté : Paire complète de bottes d'été ──────────────────────────
export function SummerOutdoorBoot({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  const xOff = W / 2 + GAP / 2;

  return (
    <group ref={groupRef}>
      {/* Pied gauche */}
      <group position={[xOff, 0, 0]}>
        <SingleShoe mirror={false} />
      </group>
      {/* Pied droit */}
      <group position={[-xOff, 0, 0]}>
        <SingleShoe mirror={true} />
      </group>
    </group>
  );
}
