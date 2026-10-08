/**
 * TV.tsx — CHiQ L32H7A 32" (items/tv/tv.glb).
 * Scaled to TV_W=73 cm. Action 'tv-toggle' : écran ON/OFF.
 */
import { useLayoutEffect, useMemo, useState } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { useDeskScreenVideo } from '@features/scene/utils/deskScreenVideo';
import { cameraState } from '@features/scene/cameraState';

export const TV_W = 73;
export const TV_H = 41;

const ACTION_KEY = 'tv-toggle';

export function TV({ actionState, onSize }: SceneItemProps) {
  const { scene: gltfScene } = useGLTF('items/tv/tv.glb');
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene]);
  const screenTex = useTexture('items/omarchy-screen/omarchy-screen.png');
  screenTex.colorSpace = THREE.SRGBColorSpace;

  const { isVideoActive, texture: videoTex } = useDeskScreenVideo();

  const isTvOn = actionState[ACTION_KEY] ?? false;
  const isDisplaying = isVideoActive || isTvOn;
  const activeTex = isVideoActive ? videoTex : (isTvOn ? screenTex : null);
  const [screenZ, setScreenZ] = useState(0);

  useFrame(() => {
    if (isVideoActive) {
      cameraState.invalidate?.();
    }
  });

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.rotation.set(0, Math.PI, 0);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TV_W / raw.x);
    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -(box.min.y + box.max.y) / 2,
      -(box.min.z + box.max.z) / 2,
    );
    // Après rotation π Y : screen side = bbox.min.z (-Z), dos = +Z
    setScreenZ(-(size.z / 2 + 0.15));
    onSize(size);
  }, [scene]);

  return (
    <group userData={{ hoverAction: { label: 'TV CHiQ L32H7A', actions: ['tv-toggle', 'desk2-screen-toggle'] } }}>
      <primitive object={scene} />
      {/* Screen overlay — DoubleSide : visible quel que soit l'angle caméra */}
      <mesh position={[0, 0, screenZ]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[TV_W - 4, TV_H - 4]} />
        <meshStandardMaterial
          side={THREE.DoubleSide}
          map={activeTex}
          color={isDisplaying ? 0xffffff : 0x060606}
          emissive={isVideoActive ? new THREE.Color(0xffffff) : (isTvOn ? new THREE.Color(0x111111) : new THREE.Color(0x000000))}
          emissiveMap={isVideoActive ? videoTex : null}
          emissiveIntensity={isVideoActive ? 0.8 : (isTvOn ? 0.15 : 0)}
          roughness={0.05}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('items/tv/tv.glb');
