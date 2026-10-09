import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import { useSceneStore } from '../store/useSceneStore';
import { MergedStaticGroup } from '../Building';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import type { Item } from '@shared/types';

import { CorridorCloset } from '../items/CorridorCloset';
import { TradfriBulb } from '../items/TradfriBulb';
import { Linky } from '../items/Linky';
import { Scooter } from '../items/Scooter';

import {
  ROOM_W,
  ROOM_D,
  WALL_H,
  KITCHEN_SOUTH_WALL,
  DOOR_START,
  KITCHEN_EAST_WALL,
  PARTITION_THICKNESS
} from '../wallData';
import { CORRIDOR_NORTH_WALL, pZ } from '../wallData';

const stub = (id: string): Item =>
  ({ id, name: '', brand: '', category: '', qty: 1, dims: { w: 0, d: 0, h: 0 } });

// Coffrage plastique vertical 25.5×6.5×WALL_H, contre mur est du couloir,
// début Z=ROOM_D+5 (5 cm du mur nord du couloir = mur sud séjour).
// Linky Enedis monté en façade à ~130 cm du sol.
const LINKY_GAINE_W   = 6.5;            // X — profondeur (depuis mur est)
const LINKY_GAINE_L   = 25.5;           // Z — largeur le long du mur
const LINKY_GAINE_Z0  = ROOM_D + 16;     // 416 — 6 cm de la face couloir du mur sud séjour (Z=ROOM_D+W=410)
const LINKY_GAINE_X1  = ROOM_W;         // colle au mur est (X=316)
const LINKY_GAINE_X0  = ROOM_W - LINKY_GAINE_W;
const LINKY_GAINE_CX  = (LINKY_GAINE_X0 + LINKY_GAINE_X1) / 2; // 312.75
const LINKY_GAINE_CZ  = LINKY_GAINE_Z0 + LINKY_GAINE_L / 2;    // 512.75
const LINKY_MOUNT_Y   = 170;            // hauteur base du Linky (bas du compteur à 170 cm du sol)
const linkyGaineMat   = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.7, metalness: 0.05 });

function LinkyGaine() {
  return (
    <>
      {/* Coffrage plastique sol→plafond */}
      <mesh position={[LINKY_GAINE_CX, WALL_H / 2, LINKY_GAINE_CZ]} castShadow receiveShadow material={linkyGaineMat}>
        <boxGeometry args={[LINKY_GAINE_W, WALL_H, LINKY_GAINE_L]} />
      </mesh>
      {/* Linky face -X (vers le couloir). GLB front +Z → rotation-y = -π/2.
          Profondeur GLB ≈ 7.1 cm → recule Linky pour que son dos affleure la gaine. */}
      <group position={[LINKY_GAINE_X0 - 7.1 / 2, LINKY_MOUNT_Y, LINKY_GAINE_CZ]} rotation={[0, -Math.PI / 2, 0]} userData={{ animUnit: true, itemName: 'Compteur Linky' }}>
        <Linky item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
      </group>
    </>
  );
}

const CORRIDOR_LIGHT_COLORS = [
  new THREE.Color(0xff2222), // Rouge (1)
  new THREE.Color(0xff2222), // Rouge (2)
  new THREE.Color(0xff2222), // Rouge (3)
  new THREE.Color(0xff7700), // Orange
  new THREE.Color(0xffdd00), // Jaune
  new THREE.Color(0xff2a85), // Rose
];
const DURATION_PER_COLOR = 1.0; // 1s par couleur
const TOTAL_CYCLE_DURATION = CORRIDOR_LIGHT_COLORS.length * DURATION_PER_COLOR; // 6s au total (3s rouge + 1s orange + 1s jaune + 1s rose)
const _tempColor = new THREE.Color();

function CorridorLamp({ isOn, lightsHD }: { isOn: boolean; lightsHD: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const bulbGroupRef = useRef<THREE.Group>(null);
  const emissiveMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const elapsedRef = useRef(0);

  const CORR_CX = (DOOR_START + ROOM_W) / 2;
  const CORR_LAMP_Z = (pZ('corner-se') + pZ('diag-ne')) / 2;

  useFrame((state, delta) => {
    if (!isOn) return;

    if (emissiveMatsRef.current.length === 0 && bulbGroupRef.current) {
      const mats: THREE.MeshStandardMaterial[] = [];
      bulbGroupRef.current.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          list.forEach((m) => {
            if ('emissive' in m) {
              mats.push(m as THREE.MeshStandardMaterial);
            }
          });
        }
      });
      emissiveMatsRef.current = mats;
    }

    elapsedRef.current += delta;
    const t = (elapsedRef.current % TOTAL_CYCLE_DURATION + TOTAL_CYCLE_DURATION) % TOTAL_CYCLE_DURATION;
    const segment = t / DURATION_PER_COLOR;
    const idx = Math.floor(segment);
    const nextIdx = (idx + 1) % CORRIDOR_LIGHT_COLORS.length;
    const alpha = segment - idx;

    _tempColor.lerpColors(CORRIDOR_LIGHT_COLORS[idx], CORRIDOR_LIGHT_COLORS[nextIdx], alpha);

    if (lightRef.current) {
      lightRef.current.color.copy(_tempColor);
    }
    for (let i = 0; i < emissiveMatsRef.current.length; i++) {
      emissiveMatsRef.current[i].emissive.copy(_tempColor);
    }

    state.invalidate();
  });

  return (
    <group
      ref={bulbGroupRef}
      position={[CORR_CX, WALL_H - 10, CORR_LAMP_Z]}
      rotation={[Math.PI, 0, 0]}
      userData={{
        skipMerge: true,
        animUnit: true,
        itemName: 'Ampoule Couloir (TRÅDFRI)',
        hoverAction: { label: 'Ampoule Couloir (TRÅDFRI)', actions: ['lampCorridor'] },
      }}
    >
      <TradfriBulb item={stub('tradfri-bulb-couloir')} actionState={{ on: isOn }} onSize={NOOP_SIZE} />
      <pointLight
        ref={lightRef}
        position={[0, 20, 0]}
        intensity={isOn ? (lightsHD ? 120 : 2.5) : 0}
        distance={lightsHD ? 0 : 280}
        decay={lightsHD ? 1.0 : 2.0}
        color={0xff2222}
        castShadow={lightsHD}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
        shadow-camera-near={1}
        shadow-camera-far={600}
      />
    </group>
  );
}

export function CorridorEquipment() {
  const as = useFurnitureToggles([
    'lamp-corridor-toggle',
    'corrDoors',
  ]);

  const lightsHD = useSceneStore((state) => state.layers.lightsHD);

  return (
    <MergedStaticGroup name="merged-corridor-equipment">
      {/* Ampoule Couloir (TRÅDFRI) couleur variable */}
      <CorridorLamp isOn={!!as['lamp-corridor-toggle']} lightsHD={lightsHD} />

      {/* Gaine plastique couloir mur est + Linky */}
      <LinkyGaine />

      {/* Placard Couloir */}
      <group position={[(KITCHEN_EAST_WALL + PARTITION_THICKNESS + DOOR_START) / 2, 0, (CORRIDOR_NORTH_WALL + KITCHEN_SOUTH_WALL) / 2]} userData={{ animUnit: true, itemName: 'Placard Couloir' }}>
        <CorridorCloset item={stub('corridor-closet')} actionState={as} onSize={NOOP_SIZE} />
      </group>
    </MergedStaticGroup>
  );
}

// Pass 2 — Furnishings (Habillage & confort fonctionnel)
export function CorridorFurnishings() {
  return (
    <MergedStaticGroup name="merged-corridor-furnishings">
      {/* Trottinette Xiaomi */}
      <group position={[298, 0, 470]} rotation-y={Math.PI - THREE.MathUtils.degToRad(5)} userData={{ skipMerge: true, animUnit: true, itemName: 'Trottinette Xiaomi' }}>
        <Scooter item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} steeringAngle={-Math.PI / 6} />
      </group>
    </MergedStaticGroup>
  );
}

export function CorridorFurniture() {
  return null;
}
