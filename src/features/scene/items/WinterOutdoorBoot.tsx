/**
 * WinterOutdoorBoot.tsx — Paire de baskets bottes d'hiver (lourde) (Temu).
 * 
 * Modélisation procédurale 3D fidèle à une version hivernale :
 *   1. Semelle isolée (Winter Sole) : ExtrudeGeometry pleine (sans les trous "blade") pour l'isolation.
 *   2. Crampons (Rugged Lugs) : Plusieurs blocs de caoutchouc antidérapant sous la semelle.
 *   3. Tige hermétique (Closed Upper) : Pas de découpe latérale en U, tige entièrement fermée.
 *   4. Col fourrure (Wool Collar) : Piping blanc très épais et rugueux représentant la doublure laineuse.
 *   5. Sangles renforcées : Sangles de cheville et de coup-de-pied robustes.
 * 
 * Coordonnées locales : Centré XZ, Y=0 = sol.
 * Paire : Pied gauche (X > 0) et Pied droit (miroir X, scale.x = -1).
 */
import { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

// ── Dimensions (1 unité = 1 cm) ───────────────────────────────────────────────
const L = 29.0;         // Longueur totale
const W = 10.8;         // Largeur max (légèrement plus large que l'été pour le rembourrage)
const GAP = 2.2;        // Écartement de la paire
const SH_HEEL = 4.6;
const SH_TOE = 2.0;

// ── Matériaux ──────────────────────────────────────────────────────────────────
const matRedUpper = new THREE.MeshStandardMaterial({
  color: 0xc81818, // Rouge un peu plus profond/dense
  roughness: 0.65, // Aspect cuir mat épais
  metalness: 0.02,
  side: THREE.DoubleSide,
});

const matRedSole = new THREE.MeshStandardMaterial({
  color: 0xa01010,
  roughness: 0.75,
  metalness: 0.0,
  side: THREE.DoubleSide,
});

const matDarkTread = new THREE.MeshStandardMaterial({
  color: 0x2d0505, // Caoutchouc de traction noir très foncé
  roughness: 0.90,
});

const matWoolCollar = new THREE.MeshStandardMaterial({
  color: 0xffffff, // Laine/fourrure blanche
  roughness: 0.98, // Très mat et diffus
  side: THREE.DoubleSide,
});

const matVelcroStrap = new THREE.MeshStandardMaterial({
  color: 0xd01c1c,
  roughness: 0.70,
  side: THREE.DoubleSide,
});

// ── 1. Forme 2D de la semelle (profil Z-Y sans trous) ──────────────────────────
const soleShape = (() => {
  const shape = new THREE.Shape();
  
  shape.moveTo(14.5, SH_HEEL);
  shape.bezierCurveTo(15.2, SH_HEEL * 0.85, 15.0, 1.2, 13.5, 0.0);
  shape.quadraticCurveTo(0.0, 0.1, -13.5, 0.0);
  shape.bezierCurveTo(-15.0, 0.8, -15.0, SH_TOE * 0.85, -14.5, SH_TOE);
  shape.quadraticCurveTo(0.0, 2.95, 14.5, SH_HEEL);

  // AUCUN trou dans la semelle hiver (isolation thermique)
  return shape;
})();

const soleExtrudeSettings = {
  depth: W - 0.4,
  bevelEnabled: true,
  bevelThickness: 0.25,
  bevelSize: 0.25,
  bevelSegments: 3,
  steps: 1,
};

const soleGeo = new THREE.ExtrudeGeometry(soleShape, soleExtrudeSettings);
soleGeo.center();

// ── 2. Géométrie de la tige fermée (Closed Upper) ──────────────────────────────
const numSlices = 20;
const numRadial = 40;

const upperGeo = (() => {
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < numSlices; s++) {
    const v = s / (numSlices - 1);
    const t = Math.pow(v, 1.3);

    for (let r = 0; r < numRadial; r++) {
      const angle = (r / numRadial) * Math.PI * 2;

      // Base du pied
      const zBase = 14.5 * Math.cos(angle);
      let wBase = 4.35; // Légèrement plus épais pour l'hiver
      if (zBase < 0) {
        const u = -zBase / 14.5;
        wBase = 3.9 * (1 - u) + 4.7 * Math.sin(u * Math.PI) * (1 - u) + 0.4 * u;
      } else {
        const u = zBase / 14.5;
        wBase = 3.9 * (1 - u) + 4.3 * Math.sin(u * Math.PI) * (1 - u) + 0.9 * u;
      }
      const xBase = wBase * Math.sin(angle);

      // Section cheville (col)
      const zCollar = 5.0 + 3.4 * Math.cos(angle);
      const xCollar = 2.9 * Math.sin(angle);

      // Interpolation
      const x = (1 - t) * xBase + t * xCollar;
      const z = (1 - t) * zBase + t * zCollar;

      const base_y = 2.95 + 1.35 * (z / 14.5) + 0.3 * Math.pow(z / 14.5, 2);

      // Hauteur du col
      let hTop = 18.0;
      
      // Languette avant
      if (Math.abs(angle - Math.PI) < Math.PI / 3) {
        const u = Math.abs(angle - Math.PI) / (Math.PI / 3);
        hTop += 1.5 * (1 - u * u);
      }
      
      // Talon arrière
      let angleDist = angle;
      if (angleDist > Math.PI) angleDist = 2 * Math.PI - angle;
      if (angleDist < Math.PI / 4) {
        const u = angleDist / (Math.PI / 4);
        hTop += 1.0 * (1 - u * u);
      }

      // PAS de découpe en U latérale ! Juste une légère incurvation anatomique normale (2 cm)
      const latDist = Math.abs(angle - 3 * Math.PI / 2);
      if (latDist < Math.PI / 4) {
        const u = latDist / (Math.PI / 4);
        hTop -= 2.0 * (1 - u * u);
      }

      const medDist = Math.abs(angle - Math.PI / 2);
      if (medDist < Math.PI / 4) {
        const u = medDist / (Math.PI / 4);
        hTop -= 2.0 * (1 - u * u);
      }

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

// Courbe de couture centrale
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

// Courbe du col pour la moumoute/fourrure blanche
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
  const idx0 = sLast * numRadial;
  points.push(new THREE.Vector3(
    positionAttr.getX(idx0),
    positionAttr.getY(idx0),
    positionAttr.getZ(idx0)
  ));
  
  return new THREE.CatmullRomCurve3(points);
})();

// ── Composant d'une botte d'hiver individuelle ─────────────────────────────────
function SingleShoe({ mirror }: { mirror: boolean }) {
  const ankleCenterZ = 5.0;
  
  // Sangle de coup-de-pied (plus épaisse et large)
  const instepStart = useMemo(() => new THREE.Vector3(-4.1, 3.4, -1.0), []);
  const instepEnd = useMemo(() => new THREE.Vector3(3.9, 4.8, -7.0), []);
  const instepCenter = useMemo(() => new THREE.Vector3().addVectors(instepStart, instepEnd).multiplyScalar(0.5), [instepStart, instepEnd]);
  const instepLen = useMemo(() => instepStart.distanceTo(instepEnd), [instepStart, instepEnd]);
  
  const instepRef = useRef<THREE.Group>(null);
  
  useLayoutEffect(() => {
    if (instepRef.current) {
      instepRef.current.lookAt(instepEnd);
    }
  }, [instepEnd]);

  // Crampons de traction antidérapante sous la semelle
  const treadPlacements = useMemo(() => [
    { x: -2.8, z: -11.0, w: 1.8, d: 0.8 },
    { x: 2.8,  z: -11.0, w: 1.8, d: 0.8 },
    { x: -3.2, z: -7.0,  w: 2.0, d: 0.8 },
    { x: 3.2,  z: -7.0,  w: 2.0, d: 0.8 },
    { x: -3.2, z: -3.0,  w: 2.0, d: 0.8 },
    { x: 3.2,  z: -3.0,  w: 2.0, d: 0.8 },
    { x: -3.0, z: 1.5,   w: 1.8, d: 0.8 },
    { x: 3.0,  z: 1.5,   w: 1.8, d: 0.8 },
    { x: -2.8, z: 6.0,   w: 1.8, d: 0.9 },
    { x: 2.8,  z: 6.0,   w: 1.8, d: 0.9 },
    { x: -2.6, z: 10.5,  w: 1.6, d: 0.9 },
    { x: 2.6,  z: 10.5,  w: 1.6, d: 0.9 },
  ], []);

  return (
    <group scale={[mirror ? -1 : 1, 1, 1]}>
      
      {/* ── 1. Semelle isolée pleine ── */}
      <mesh
        geometry={soleGeo}
        material={matRedSole}
        rotation={[0, -Math.PI / 2, 0]}
        position={[W / 2, 0, 0]}
        castShadow
        receiveShadow
      />
      
      {/* Base de semelle noire */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W - 0.5, L - 0.5]} />
        <meshStandardMaterial {...matDarkTread} />
      </mesh>

      {/* Crampons de traction hiver (lugs) */}
      {treadPlacements.map((t, idx) => (
        <mesh key={idx} position={[t.x, -0.05, t.z]} castShadow receiveShadow>
          <boxGeometry args={[t.w, 0.3, t.d]} />
          <primitive object={matDarkTread} />
        </mesh>
      ))}

      {/* ── 2. Tige isolée fermée ── */}
      <mesh geometry={upperGeo} material={matRedUpper} castShadow receiveShadow />

      {/* ── 3. Col en laine/fourrure blanche épais (moumoute) ── */}
      <mesh castShadow>
        <tubeGeometry args={[collarTrimCurve, 45, 0.42, 8, true]} />
        <primitive object={matWoolCollar} />
      </mesh>

      {/* ── 4. Couture centrale en relief ── */}
      <mesh castShadow>
        <tubeGeometry args={[frontSeamCurve, 20, 0.09, 5, false]} />
        <meshStandardMaterial color={0x8a0d0d} roughness={0.8} />
      </mesh>

      {/* ── 5. Sangle de cheville ── */}
      <group position={[0, 13.4, ankleCenterZ]} scale={[1.05, 1.0, 1.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[3.0, 3.1, 2.4, 32, 1, true]} />
          <primitive object={matVelcroStrap} />
        </mesh>
        
        {/* Rabat Velcro */}
        <mesh position={[-3.05, 0, -0.6]} rotation={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.22, 2.4, 3.2]} />
          <primitive object={matVelcroStrap} />
        </mesh>
      </group>

      {/* ── 6. Sangle diagonale coup-de-pied ── */}
      <group ref={instepRef} position={instepCenter}>
        <mesh castShadow>
          <boxGeometry args={[3.4, 0.18, instepLen]} />
          <primitive object={matVelcroStrap} />
        </mesh>
        <mesh position={[0, 0.10, 0]} castShadow>
          <boxGeometry args={[0.1, 0.04, instepLen - 0.2]} />
          <meshStandardMaterial color={0x8a0d0d} roughness={0.8} />
        </mesh>
      </group>

      {/* ── 7. Languette d'enfilage arrière ── */}
      <group position={[0, 18.0, 8.4]} rotation={[-0.32, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 2.5, 0.14]} />
          <primitive object={matRedSole} />
        </mesh>
        <mesh position={[0, 0, -0.08]} castShadow>
          <boxGeometry args={[0.7, 2.3, 0.03]} />
          <primitive object={matWoolCollar} />
        </mesh>
      </group>

    </group>
  );
}

// ── Composant exporté : Paire de bottes d'hiver ─────────────────────────────────
export function WinterOutdoorBoot({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  const xOff = W / 2 + GAP / 2;

  return (
    <group ref={groupRef}>
      <group position={[xOff, 0, 0]}>
        <SingleShoe mirror={false} />
      </group>
      <group position={[-xOff, 0, 0]}>
        <SingleShoe mirror={true} />
      </group>
    </group>
  );
}
