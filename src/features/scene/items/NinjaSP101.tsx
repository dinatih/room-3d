import { getObjectActionIds } from '../objectActions';
/**
 * NinjaSP101.tsx — Ninja Foodi SP101EU mini four 8-en-1 (procédural).
 * Réf : Sharkninja SP101EU, 51×37×19.5 cm, finition inox brossé + façade noire.
 * Façade : porte vitrée (gauche) + panneau de commande (droite).
 * Coordonnées locales : centré X/Z, Y=0 = sol. Façade = +Z.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MergedStaticGroup } from '../Building';
import type { SceneItemProps } from '@shared/types';

export const NINJA_DOOR_DURATION = 0.8;

const W = 51;     // largeur
const D = 37;     // profondeur
const H = 19.5;   // hauteur

const PANEL_W = 9;               // largeur panneau commande
const DOOR_W  = W - PANEL_W - 0.6; // largeur porte
const DOOR_X  = -W / 2 + DOOR_W / 2 + 0.3;
const PANEL_X =  W / 2 - PANEL_W / 2 - 0.3;

const FRONT_Z = D / 2;
const stainless = new THREE.MeshStandardMaterial({
  color: 0xc4c6c8, metalness: 0.88, roughness: 0.42,
});
const stainlessDark = new THREE.MeshStandardMaterial({
  color: 0x9a9c9e, metalness: 0.9, roughness: 0.5,
});
const blackPlastic = new THREE.MeshStandardMaterial({
  color: 0x131313, metalness: 0.15, roughness: 0.7,
});
const blackMatte = new THREE.MeshStandardMaterial({
  color: 0x0a0a0a, metalness: 0.05, roughness: 0.9,
});
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x1a2028, metalness: 0.3, roughness: 0.08,
  transparent: true, opacity: 0.55,
  transmission: 0.5, ior: 1.45, thickness: 0.2,
});
const quartzTube = new THREE.MeshStandardMaterial({
  color: 0xddd9cd,
  metalness: 0.1, roughness: 0.3,
});
const rackMat = new THREE.MeshStandardMaterial({
  color: 0x6e7074, metalness: 0.7, roughness: 0.45,
});
const rubberMat = new THREE.MeshStandardMaterial({
  color: 0x161616, roughness: 0.95, metalness: 0,
});
const displayMat = new THREE.MeshStandardMaterial({
  color: 0x2a2c2e, roughness: 0.5, metalness: 0.1,
});
const dialMat = new THREE.MeshStandardMaterial({
  color: 0x1c1c1c, metalness: 0.4, roughness: 0.55,
});
const dialIndicator = new THREE.MeshStandardMaterial({
  color: 0xe6e6e6, metalness: 0.6, roughness: 0.4,
});
const logoMat = new THREE.MeshStandardMaterial({
  color: 0xeaeaea, metalness: 0.5, roughness: 0.4,
});

function ventGeometry(): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(0.4, 0.25, 8);
  return g;
}

export function NinjaSP101({ actionState, onSize }: SceneItemProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const rackRef = useRef<THREE.Group>(null!);
  const isOpen = actionState.ninja ?? false;
  const rackOut = actionState['ninja-rack'] ?? false;
  const lightOn = actionState['ninja-light'] ?? false;
  const { invalidate } = useThree();

  useFrame((_, dt) => {
    const door = doorRef.current;
    const rack = rackRef.current;
    const angle = isOpen ? Math.PI / 2 : 0;
    // Rentrer la grille avant de refermer ; attendre la porte avant de la sortir.
    const extension = isOpen && rackOut && door.rotation.x > Math.PI / 2 - 0.05 ? D - 7 : 0;
    const rotation = !isOpen && rack.position.z > 0.01 ? door.rotation.x : angle;
    door.rotation.x = THREE.MathUtils.damp(door.rotation.x, rotation, 8, dt);
    rack.position.z = THREE.MathUtils.damp(rack.position.z, extension, 8, dt);
    if (Math.abs(door.rotation.x - angle) > 0.001 || Math.abs(rack.position.z - extension) > 0.001) invalidate();
  });

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, [onSize]);

  const ventOffsets = useMemo(() => {
    const arr: number[] = [];
    for (let i = -7; i <= 7; i++) arr.push(i * 1.4);
    return arr;
  }, []);

  return (
    <group userData={{ animUnit: true, hoverAction: { label: 'Mini four Ninja SP101EU', actions: [...getObjectActionIds('ninja-sp101'), 'smart-object:::cuisine-group:::cook-oven'] } }}>
      <MergedStaticGroup name="merged-ninja">
        {/* Parois distinctes : la façade reste réellement ouverte. */}
        {[
          { p: [0, H - 0.4, 0], size: [W, 0.8, D] },
          { p: [0, 0.6, 0], size: [W, 1.2, D] },
          { p: [-W / 2 + 0.4, H / 2, 0], size: [0.8, H, D] },
          { p: [W / 2 - 0.4, H / 2, 0], size: [0.8, H, D] },
          { p: [0, H / 2, -D / 2 + 0.4], size: [W, H, 0.8] },
          { p: [DOOR_X + DOOR_W / 2 - 0.8, H / 2, 0], size: [0.8, H, D] },
        ].map(({ p, size }, i) => (
          <mesh key={`shell-${i}`} position={p as [number, number, number]} material={stainless} castShadow receiveShadow>
            <boxGeometry args={size as [number, number, number]} />
          </mesh>
        ))}
        {/* Plateau ramasse-miettes et glissières latérales. */}
        <mesh position={[DOOR_X, 1.4, 0]} material={stainlessDark} receiveShadow>
          <boxGeometry args={[DOOR_W - 2, 0.3, D - 2]} />
        </mesh>
        {[-1, 1].flatMap(side => [6, H / 2 - 1, 13].map(y => (
          <mesh key={`rail-${side}-${y}`} position={[DOOR_X + side * (DOOR_W / 2 - 1.5), y, 0]} material={stainlessDark}>
            <boxGeometry args={[1.2, 0.4, D - 3]} />
          </mesh>
        )))}
        {/* Résistances quartz et supports en céramique, haut et bas. */}
        {[3, H - 2.2].flatMap(y => [-9, 9].map(z => (
          <group key={`heater-${y}-${z}`} position={[DOOR_X, y, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={quartzTube}>
              <cylinderGeometry args={[0.3, 0.3, DOOR_W - 4, 16]} />
            </mesh>
            {[-1, 1].map(side => (
              <mesh key={side} position={[side * (DOOR_W / 2 - 2), 0, 0]} material={blackMatte}>
                <boxGeometry args={[1, 1.2, 1.2]} />
              </mesh>
            ))}
          </group>
        )))}

        {/* Panneau de commande (droite) */}
        <group position={[PANEL_X, H / 2, FRONT_Z + 0.05]}>
          {/* Fond noir */}
          <mesh>
            <boxGeometry args={[PANEL_W, H, 0.6]} />
            <primitive object={blackPlastic} attach="material" />
          </mesh>
          {/* Recess (cadre légèrement enfoncé) */}
          <mesh position={[0, 0, 0.31]}>
            <boxGeometry args={[PANEL_W - 1.4, H - 1.4, 0.15]} />
            <primitive object={blackMatte} attach="material" />
          </mesh>
          {/* LCD display */}
          <mesh position={[0, H / 2 - 3.3, 0.4]}>
            <boxGeometry args={[PANEL_W - 3, 3.0, 0.1]} />
            <primitive object={displayMat} attach="material" />
          </mesh>
          {/* Bordure display */}
          <mesh position={[0, H / 2 - 3.3, 0.38]}>
            <boxGeometry args={[PANEL_W - 2.4, 3.4, 0.08]} />
            <primitive object={blackPlastic} attach="material" />
          </mesh>
          {/* Cadran rotatif central (Ø 2 cm) */}
          <mesh position={[0, 0.5, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.0, 1.1, 1.0, 32]} />
            <primitive object={dialMat} attach="material" />
          </mesh>
          {/* Indicateur cadran */}
          <mesh position={[0, 1.25, 0.55]}>
            <boxGeometry args={[0.2, 0.5, 0.15]} />
            <primitive object={dialIndicator} attach="material" />
          </mesh>
          {/* Knurl pourtour cadran (16 stries) */}
          {Array.from({ length: 16 }, (_, i) => i).map(i => {
            const a = (i / 16) * Math.PI * 2;
            return (
              <mesh
                key={`knurl-${i}`}
                position={[Math.sin(a) * 1.05, 0.5 + Math.cos(a) * 1.05, 0.45]}
                rotation={[0, 0, -a]}
              >
                <boxGeometry args={[0.08, 0.25, 0.9]} />
                <primitive object={blackPlastic} attach="material" />
              </mesh>
            );
          })}
          {/* 4 boutons en bas (TEMP / TIME / POWER / LIGHT) */}
          {[-2.7, -0.9, 0.9, 2.7].map((x, i) => (
            <mesh key={`btn-${i}`} position={[x, -H / 2 + 1.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.5, 16]} />
              <primitive object={dialMat} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Fentes d'aération dessus arrière */}
        {ventOffsets.map((x, i) => (
          <mesh key={`vt-${i}`} position={[x, H + 0.01, -D / 2 + 4]} geometry={ventGeometry()}>
            <primitive object={blackMatte} attach="material" />
          </mesh>
        ))}

        {/* 4 pieds antidérapants */}
        {[
          [-W / 2 + 3,  D / 2 - 3],
          [ W / 2 - 3,  D / 2 - 3],
          [-W / 2 + 3, -D / 2 + 3],
          [ W / 2 - 3, -D / 2 + 3],
        ].map(([x, z], i) => (
          <mesh key={`ft-${i}`} position={[x, -0.4, z]}>
            <cylinderGeometry args={[1.0, 1.2, 0.8, 16]} />
            <primitive object={rubberMat} attach="material" />
          </mesh>
        ))}
      </MergedStaticGroup>

      {/* Grille indépendante de la coque fusionnée, entièrement extractible. */}
      <group ref={rackRef} name="ninja-rack">
        <MergedStaticGroup name="merged-ninja-rack">
          {[-1, 1].map(side => (
            <mesh key={`edge-${side}`} position={[DOOR_X + side * (DOOR_W / 2 - 2.5), H / 2 - 0.6, 0]} material={rackMat}>
              <boxGeometry args={[0.4, 0.4, D - 4]} />
            </mesh>
          ))}
          {[-D / 2 + 2, 0, D / 2 - 2].map(z => (
            <mesh key={`cross-${z}`} position={[DOOR_X, H / 2 - 0.6, z]} rotation={[0, 0, Math.PI / 2]} material={rackMat}>
              <cylinderGeometry args={[0.2, 0.2, DOOR_W - 5, 8]} />
            </mesh>
          ))}
          {Array.from({ length: 19 }, (_, i) => (
            <mesh key={`wire-${i}`} position={[DOOR_X + (i / 18 - 0.5) * (DOOR_W - 5), H / 2 - 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={rackMat}>
              <cylinderGeometry args={[0.1, 0.1, D - 4, 8]} />
            </mesh>
          ))}
        </MergedStaticGroup>
      </group>
      <mesh position={[DOOR_X + DOOR_W / 2 - 1.3, H - 4, -5]} rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[0.65, 16, 8]} />
        <meshStandardMaterial color="#fff1cf" emissive="#ffd391" emissiveIntensity={lightOn ? 3 : 0} />
      </mesh>
      {lightOn && <pointLight position={[DOOR_X, H - 4, -5]} color="#ffe0a6" intensity={180} distance={D * 2} decay={2} />}

      {/* Cadre de porte (inox) — pivot bas-avant pour ouverture flip-down */}
      <group ref={doorRef} position={[DOOR_X, 0.6, FRONT_Z + 0.45]}>
       <group position={[0, H / 2 - 0.6, -0.4]}>
        {/* Frame top */}
        <mesh position={[0,  H / 2 - 1, 0]}>
          <boxGeometry args={[DOOR_W, 2, 0.8]} />
          <primitive object={stainless} attach="material" />
        </mesh>
        {/* Frame bottom */}
        <mesh position={[0, -H / 2 + 2.4, 0]}>
          <boxGeometry args={[DOOR_W, 4.8, 0.8]} />
          <primitive object={stainless} attach="material" />
        </mesh>
        {/* Frame left */}
        <mesh position={[-DOOR_W / 2 + 1.2, 0, 0]}>
          <boxGeometry args={[2.4, H, 0.8]} />
          <primitive object={stainless} attach="material" />
        </mesh>
        {/* Frame right */}
        <mesh position={[ DOOR_W / 2 - 1.2, 0, 0]}>
          <boxGeometry args={[2.4, H, 0.8]} />
          <primitive object={stainless} attach="material" />
        </mesh>
        {/* Vitre teintée */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[DOOR_W - 4.8, H - 7.4, 0.3]} />
          <primitive object={glassMat} attach="material" />
        </mesh>
        {/* Poignée verticale (côté droit porte) */}
        <mesh position={[DOOR_W / 2 - 2.4, 0.5, 0.9]}>
          <boxGeometry args={[0.6, H - 5, 0.5]} />
          <primitive object={stainless} attach="material" />
        </mesh>
        {/* Embouts poignée */}
        {[ -H / 2 + 3, H / 2 - 1.5 ].map((y, i) => (
          <mesh key={`hg-${i}`} position={[DOOR_W / 2 - 2.4, y - (i === 0 ? -1.5 : 1), 0.65]}>
            <boxGeometry args={[0.6, 1.5, 1.0]} />
            <primitive object={stainless} attach="material" />
          </mesh>
        ))}
        {/* Logo "ninja" bas-centre porte */}
        <mesh position={[0, -H / 2 + 2.4, 0.42]}>
          <boxGeometry args={[5.0, 0.9, 0.05]} />
          <primitive object={logoMat} attach="material" />
        </mesh>
       </group>
      </group>
    </group>
  );
}
