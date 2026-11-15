/**
 * Laptop.tsx — Framework Laptop 13".
 * Coordonnées locales : X/Z centrés, Y=0 = surface du bureau.
 *
 * Charge le GLB Draco exporté depuis framework-laptop13.blend, puis cloné par instance.
 * Ports et couleurs intégrés au modèle ; préparation statique mise en cache.
 * DRACOLoader configuré en amont dans main.tsx (useGLTF.setDecoderPath).
 */
import { useLayoutEffect } from 'react';
import { useGLTFClone } from '../useGLTFClone';
import { getPreparedLaptopScene } from './prepareLaptopScene';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { useDeskScreenVideo } from '@features/scene/utils/deskScreenVideo';

const BASE_W = 29.7, BASE_D = 22.8, BASE_H = 1.6;
const SCREEN_D = 19.5;

// source CAD : https://cad.onshape.com/documents/b17a72e361e72e3c5b6e7bb7/w/95ca42a57c78f484e8786505/e/db39482865fc64b9783df21f
const GLB_PATH = 'items/framework-laptop13/framework-laptop13.glb';

// GLB exporté Y-up. Z centré sur 0.41 cm → offset -0.41
const GLB_POS: [number, number, number] = [0, 0, -0.41];

// ── Export ────────────────────────────────────────────────────────────────────

export function Laptop({ onSize, actionState = {}, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene: clone } = useGLTFClone(GLB_PATH, false, getPreparedLaptopScene);
  const { isVideoActive, texture: videoTex } = useDeskScreenVideo(isPreview ? !!actionState['desk2-screen-toggle'] : undefined);

  useLayoutEffect(() => {
    onSize?.(new THREE.Vector3(BASE_W, BASE_H + SCREEN_D, BASE_D));
  }, [onSize]);

  return (
    <group>
      <primitive object={clone} scale={100} position={GLB_POS} />
      {/* Écran d'ordinateur portable (dalle 13.5" ratio 3:2 avec overlay vidéo) */}
      <mesh
        position={[0, 10.24, -19.59]}
        rotation={[-0.5866, 0, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[28.5, 19.0]} />
        <meshStandardMaterial
          side={THREE.DoubleSide}
          map={isVideoActive ? videoTex : null}
          color={isVideoActive ? 0xffffff : 0x080808}
          emissive={isVideoActive ? 0xffffff : 0x000000}
          emissiveMap={isVideoActive ? videoTex : null}
          emissiveIntensity={isVideoActive ? 0.85 : 0}
          roughness={0.08}
          metalness={0.15}
        />
      </mesh>
    </group>
  );
}
