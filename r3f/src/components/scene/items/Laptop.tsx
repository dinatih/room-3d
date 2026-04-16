/**
 * Laptop.tsx — Framework Laptop 13".
 * Coordonnées locales : X/Z centrés, Y=0 = surface du bureau.
 * Placement monde dans LaptopDesk.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const BASE_W = 29.7, BASE_D = 22.8, BASE_H = 1.6;
const SCREEN_W = 29, SCREEN_D = 19.5, SCREEN_H = 0.8;
const BEZEL = 0.6;
const PORT_W = 1.2, PORT_H = 0.6, PORT_D = 3;

const aluMat   = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6, roughness: 0.35 });
const bezelMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
const kbMat    = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const portMat  = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3, metalness: 0.5 });

export function Laptop({ onSize }: SceneItemProps) {
  const screenTex = useTexture('media/omarchy-screen.png');
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: screenTex, roughness: 0.1, metalness: 0.2,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  }), [screenTex]);

  const { keyInst } = useMemo(() => {
    const KW = 1.28, KD = 1.22, KH = 0.18;
    const KPX = 1.64, KPZ = 1.56;
    const NCOLS = 14, NROWS = 5;
    const KB_CZ = -2.8;
    const KB_Z0 = KB_CZ - (NROWS - 1) * KPZ / 2;
    const geo = new THREE.BoxGeometry(KW, KH, KD);
    const inst = new THREE.InstancedMesh(geo, kbMat, NCOLS * NROWS);
    const dummy = new THREE.Object3D();
    let ki = 0;
    for (let r = 0; r < NROWS; r++) {
      for (let c = 0; c < NCOLS; c++) {
        dummy.position.set((-NCOLS / 2 + 0.5 + c) * KPX, BASE_H + KH / 2, KB_Z0 + r * KPZ);
        dummy.updateMatrix();
        inst.setMatrixAt(ki++, dummy.matrix);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    return { keyInst: inst };
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(BASE_W, BASE_H + SCREEN_D, BASE_D));
  }, []);

  return (
    <group>
      {/* Base */}
      <mesh position={[0, BASE_H / 2, 0]} castShadow receiveShadow material={aluMat}>
        <boxGeometry args={[BASE_W, BASE_H, BASE_D]} />
      </mesh>
      {/* Keys */}
      <primitive object={keyInst} />
      {/* Trackpad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_H + 0.01, 5.5]} material={kbMat}>
        <planeGeometry args={[10, 6]} />
      </mesh>
      {/* Screen hinge → écran ouvert 110° */}
      <group position={[0, BASE_H, -BASE_D / 2]} rotation={[-1.92, 0, 0]}>
        <mesh position={[0, 0, SCREEN_D / 2]} castShadow material={aluMat}>
          <boxGeometry args={[SCREEN_W, SCREEN_H, SCREEN_D]} />
        </mesh>
        {/* Bezels */}
        <mesh position={[0, -SCREEN_H / 2, BEZEL / 2]} material={bezelMat}>
          <boxGeometry args={[SCREEN_W, BEZEL, BEZEL]} />
        </mesh>
        <mesh position={[0, -SCREEN_H / 2, SCREEN_D - BEZEL / 2]} material={bezelMat}>
          <boxGeometry args={[SCREEN_W, BEZEL, BEZEL]} />
        </mesh>
        <mesh position={[-SCREEN_W / 2 + BEZEL / 2, -SCREEN_H / 2, SCREEN_D / 2]} material={bezelMat}>
          <boxGeometry args={[BEZEL, BEZEL, SCREEN_D]} />
        </mesh>
        <mesh position={[SCREEN_W / 2 - BEZEL / 2, -SCREEN_H / 2, SCREEN_D / 2]} material={bezelMat}>
          <boxGeometry args={[BEZEL, BEZEL, SCREEN_D]} />
        </mesh>
        {/* Écran */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -SCREEN_H / 2 - 0.01, SCREEN_D / 2]} material={screenMat}>
          <planeGeometry args={[SCREEN_W - BEZEL * 2, SCREEN_D - BEZEL * 2]} />
        </mesh>
      </group>
      {/* Ports USB-C */}
      <mesh position={[-BASE_W / 2 - PORT_W / 2 + 0.1, BASE_H * 0.6, -BASE_D / 2 + 5]} material={portMat}>
        <boxGeometry args={[PORT_W, PORT_H, PORT_D]} />
      </mesh>
      <mesh position={[BASE_W / 2 + PORT_W / 2 - 0.1, BASE_H * 0.6, -BASE_D / 2 + 5]} material={portMat}>
        <boxGeometry args={[PORT_W, PORT_H, PORT_D]} />
      </mesh>
    </group>
  );
}
