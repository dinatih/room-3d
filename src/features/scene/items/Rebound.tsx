/**
 * Rebound.tsx — Tyco R/C Rebound 4x4 Jet Turbo 6.0V (procédural).
 * Voiture RC monster truck symétrique haut/bas ("drive on 2 sides").
 * Carrosserie blanche, jantes vert citron étoilées, gros pneus chevrons noirs,
 * détails rouges (chassis + logo TYCO) et stripes jaunes.
 * Local coords : centré XZ, Y=0 = bas des pneus, hauteur ~14 cm.
 */
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { MergedStaticGroup } from '../Building';
import type { SceneItemProps } from '@shared/types';

// ── Dimensions globales (cm) ───────────────────────────────────────────────
const LEN     = 25;     // longueur (Z)
const WID     = 20;     // largeur (X) bord ext. pneu à bord ext. pneu
const HGT     = 14;     // hauteur totale
const AXLE_Y  = HGT / 2; // axe des roues = mi-hauteur (symétrie 2-sides)

// Roues
const TIRE_R   = 4.5;
const TIRE_W   = 5.0;
const HUB_R    = 2.7;
const WB       = 14;    // wheelbase Z
const TRACK    = WID - TIRE_W; // 15

// Corps
const BODY_W   = 12;
const BODY_L   = 22;
const SHELL_H  = 5.0;   // demi-coque haut (idem bas par symétrie)

// ── Matériaux partagés ────────────────────────────────────────────────────
const matBlack   = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85, metalness: 0.05 });
const matWhite   = new THREE.MeshStandardMaterial({ color: 0xeceef0, roughness: 0.35, metalness: 0.15 });
const matRed     = new THREE.MeshStandardMaterial({ color: 0xd91b1b, roughness: 0.45, metalness: 0.2 });
const matYellow  = new THREE.MeshStandardMaterial({ color: 0xf6d300, roughness: 0.4,  metalness: 0.1 });
const matLime    = new THREE.MeshStandardMaterial({ color: 0xc3e93a, roughness: 0.45, metalness: 0.15 });
const matChrome  = new THREE.MeshStandardMaterial({ color: 0xd0d3d8, roughness: 0.18, metalness: 0.85 });
const matGlass   = new THREE.MeshStandardMaterial({
  color: 0x223040, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.55,
});

// ── Texture procédurale : flanc de pneu (chevrons) ────────────────────────
function makeTreadTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#1f1f1f';
  const N = 22;
  const w = 512 / N;
  for (let i = 0; i < N; i++) {
    const x = i * w;
    ctx.beginPath();
    ctx.moveTo(x,           10);
    ctx.lineTo(x + w * 0.5, 64);
    ctx.lineTo(x,           118);
    ctx.lineTo(x + w * 0.25, 118);
    ctx.lineTo(x + w * 0.75, 64);
    ctx.lineTo(x + w * 0.25, 10);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}

// ── Texture procédurale : décal TYCO sur panneau blanc ────────────────────
function makeDecalTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#eceef0';
  ctx.fillRect(0, 0, 512, 128);
  // bande jaune
  ctx.fillStyle = '#f6d300';
  ctx.fillRect(0, 16, 512, 10);
  ctx.fillRect(0, 102, 512, 10);
  // grilles latérales rouges (évents)
  ctx.fillStyle = '#d91b1b';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(36 + i * 14, 44, 6, 40);
    ctx.fillRect(440 + i * 14, 44, 6, 40);
  }
  // logo TYCO
  ctx.fillStyle = '#d91b1b';
  ctx.font = 'bold italic 78px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TYCO', 256, 66);
  // soulignement rouge
  ctx.fillRect(180, 108, 152, 4);
  return new THREE.CanvasTexture(c);
}

// ── Une roue : jante étoile lime + pneu chevron ───────────────────────────
function Wheel({ x, z, mirrorTread }: { x: number; z: number; mirrorTread: boolean }) {
  const tread = useMemo(() => {
    const t = makeTreadTexture();
    t.repeat.set(1, mirrorTread ? -1 : 1);
    return t;
  }, [mirrorTread]);

  const tireMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x202020, roughness: 0.92, metalness: 0.0, map: tread,
  }), [tread]);

  const sideMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x0d0d0d, roughness: 0.95, metalness: 0.0,
  }), []);

  // jante 5 branches étoile : 5 boîtes croisées en croix de Saint-André + moyeu
  return (
    <group position={[x, AXLE_Y, z]} rotation={[0, 0, Math.PI / 2]}>
      {/* pneu (cylindre) — material side puis material curved */}
      <mesh material={[tireMat, sideMat, sideMat]} castShadow receiveShadow>
        <cylinderGeometry args={[TIRE_R, TIRE_R, TIRE_W, 32, 1, false]} />
      </mesh>
      {/* flancs anneau (légèrement renfoncés) */}
      <mesh position={[0,  TIRE_W / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sideMat}>
        <ringGeometry args={[HUB_R + 0.1, TIRE_R - 0.05, 32]} />
      </mesh>
      <mesh position={[0, -TIRE_W / 2 - 0.01, 0]} rotation={[ Math.PI / 2, 0, 0]} material={sideMat}>
        <ringGeometry args={[HUB_R + 0.1, TIRE_R - 0.05, 32]} />
      </mesh>
      {/* jante lime : disque central */}
      <mesh position={[0,  TIRE_W / 2 + 0.02, 0]} material={matLime}>
        <cylinderGeometry args={[HUB_R, HUB_R, 0.3, 24]} />
      </mesh>
      <mesh position={[0, -TIRE_W / 2 - 0.02, 0]} material={matLime}>
        <cylinderGeometry args={[HUB_R, HUB_R, 0.3, 24]} />
      </mesh>
      {/* étoile 5 branches sur chaque flanc */}
      {[0, 1].map(side => {
        const sy = side === 0 ? TIRE_W / 2 + 0.18 : -TIRE_W / 2 - 0.18;
        return (
          <group key={side} position={[0, sy, 0]}>
            {[0, 1, 2, 3, 4].map(i => {
              const a = (i / 5) * Math.PI * 2;
              return (
                <mesh
                  key={i}
                  rotation={[0, a, 0]}
                  position={[0, 0, 0]}
                  material={matLime}
                >
                  <boxGeometry args={[HUB_R * 1.8, 0.25, 0.8]} />
                </mesh>
              );
            })}
            {/* boulon central chrome */}
            <mesh material={matChrome}>
              <cylinderGeometry args={[0.4, 0.4, 0.4, 12]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Demi-coque (réutilisée en haut et en bas miroir) ──────────────────────
function HalfShell({
  flipY,
  flipZ,
  bodyMat,
  decalTex,
}: {
  flipY: boolean;
  flipZ: boolean;
  bodyMat: THREE.Material;
  decalTex: THREE.CanvasTexture;
}) {
  const sy = flipY ? -1 : 1;
  const sz = flipZ ? -1 : 1;

  const decalMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: decalTex, roughness: 0.4, metalness: 0.15,
  }), [decalTex]);

  return (
    <group scale={[1, sy, sz]} position={[0, 0, 0]}>
      {/* châssis longitudinal rouge (au niveau de l'axe) */}
      <mesh position={[0, 0.1, 0]} material={matRed} castShadow>
        <boxGeometry args={[BODY_W + 2, 0.6, BODY_L]} />
      </mesh>
      {/* plancher demi-coque */}
      <mesh position={[0, 0.6, 0]} material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[BODY_W, 0.4, BODY_L]} />
      </mesh>
      {/* benne arrière (pickup) — du milieu vers Z<0 */}
      <mesh position={[0, 1.6, -BODY_L * 0.22]} material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[BODY_W * 0.9, 1.6, BODY_L * 0.5]} />
      </mesh>
      {/* parois benne */}
      <mesh position={[-BODY_W * 0.45 + 0.15, 2.0, -BODY_L * 0.22]} material={bodyMat}>
        <boxGeometry args={[0.3, 2.4, BODY_L * 0.5]} />
      </mesh>
      <mesh position={[ BODY_W * 0.45 - 0.15, 2.0, -BODY_L * 0.22]} material={bodyMat}>
        <boxGeometry args={[0.3, 2.4, BODY_L * 0.5]} />
      </mesh>
      <mesh position={[0, 2.0, -BODY_L * 0.47]} material={bodyMat}>
        <boxGeometry args={[BODY_W * 0.9, 2.4, 0.3]} />
      </mesh>
      {/* cabine avant trapézoïdale (sports car) — du milieu vers Z>0 */}
      <mesh
        position={[0, 2.6, BODY_L * 0.18]}
        material={bodyMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BODY_W * 0.85, 3.8, BODY_L * 0.42]} />
      </mesh>
      {/* pare-brise incliné (verre) */}
      <mesh
        position={[0, 3.5, BODY_L * 0.36]}
        rotation={[Math.PI / 5, 0, 0]}
        material={matGlass}
      >
        <boxGeometry args={[BODY_W * 0.78, 0.15, 4.0]} />
      </mesh>
      {/* vitres latérales cabine */}
      <mesh position={[ BODY_W * 0.43, 3.3, BODY_L * 0.18]} material={matGlass}>
        <boxGeometry args={[0.15, 2.0, BODY_L * 0.32]} />
      </mesh>
      <mesh position={[-BODY_W * 0.43, 3.3, BODY_L * 0.18]} material={matGlass}>
        <boxGeometry args={[0.15, 2.0, BODY_L * 0.32]} />
      </mesh>
      {/* lunette arrière inclinée verre derrière cabine */}
      <mesh
        position={[0, 3.5, BODY_L * 0.0]}
        rotation={[-Math.PI / 6, 0, 0]}
        material={matGlass}
      >
        <boxGeometry args={[BODY_W * 0.78, 0.15, 3.0]} />
      </mesh>
      {/* panneau décal TYCO côté gauche */}
      <mesh position={[-BODY_W * 0.46, 1.8, BODY_L * 0.05]} rotation={[0, -Math.PI / 2, 0]} material={decalMat}>
        <planeGeometry args={[BODY_L * 0.55, 2.6]} />
      </mesh>
      {/* panneau décal TYCO côté droit */}
      <mesh position={[ BODY_W * 0.46, 1.8, BODY_L * 0.05]} rotation={[0,  Math.PI / 2, 0]} material={decalMat}>
        <planeGeometry args={[BODY_L * 0.55, 2.6]} />
      </mesh>
      {/* pare-chocs avant chrome */}
      <mesh position={[0, 0.9, BODY_L * 0.42]} material={matChrome} castShadow>
        <boxGeometry args={[BODY_W * 0.95, 1.2, 1.0]} />
      </mesh>
      {/* pare-chocs arrière chrome */}
      <mesh position={[0, 0.9, -BODY_L * 0.48]} material={matChrome} castShadow>
        <boxGeometry args={[BODY_W * 0.95, 1.2, 0.8]} />
      </mesh>
      {/* phares jaunes */}
      <mesh position={[-BODY_W * 0.3, 1.5, BODY_L * 0.47]} material={matYellow}>
        <boxGeometry args={[2.0, 0.8, 0.2]} />
      </mesh>
      <mesh position={[ BODY_W * 0.3, 1.5, BODY_L * 0.47]} material={matYellow}>
        <boxGeometry args={[2.0, 0.8, 0.2]} />
      </mesh>
      {/* feux arrières rouges */}
      <mesh position={[-BODY_W * 0.3, 1.5, -BODY_L * 0.49]} material={matRed}>
        <boxGeometry args={[2.0, 0.8, 0.15]} />
      </mesh>
      <mesh position={[ BODY_W * 0.3, 1.5, -BODY_L * 0.49]} material={matRed}>
        <boxGeometry args={[2.0, 0.8, 0.15]} />
      </mesh>
    </group>
  );
}

export function Rebound({ onSize }: SceneItemProps) {
  const decalTex = useMemo(() => makeDecalTexture(), []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(WID, HGT, LEN));
  }, [onSize]);

  return (
    <group userData={{ hoverAction: { label: 'Tyco R/C Rebound 4×4 Jet Turbo 6.0V' } }}>
      <MergedStaticGroup name="merged-rebound">
        {/* corps : à l'axe central. Dessus rouge, dessous blanc inversé Z (capot sur coffre) */}
        <group position={[0, AXLE_Y, 0]}>
          <HalfShell flipY={false} flipZ={false} bodyMat={matRed}   decalTex={decalTex} />
          <HalfShell flipY={true}  flipZ={true}  bodyMat={matWhite} decalTex={decalTex} />
          {/* essieux noirs reliant les roues */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, WB / 2]} material={matBlack}>
            <cylinderGeometry args={[0.5, 0.5, TRACK + 1, 12]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, -WB / 2]} material={matBlack}>
            <cylinderGeometry args={[0.5, 0.5, TRACK + 1, 12]} />
          </mesh>
        </group>

        {/* 4 roues */}
        <Wheel x={ TRACK / 2} z={ WB / 2} mirrorTread={false} />
        <Wheel x={-TRACK / 2} z={ WB / 2} mirrorTread={true}  />
        <Wheel x={ TRACK / 2} z={-WB / 2} mirrorTread={false} />
        <Wheel x={-TRACK / 2} z={-WB / 2} mirrorTread={true}  />
      </MergedStaticGroup>
    </group>
  );
}
