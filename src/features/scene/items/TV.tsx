/**
 * TV.tsx — CHiQ L32H7A 32" (items/tv/tv.glb).
 * Scaled to TV_W=73 cm. Action 'tv-toggle' : écran ON/OFF.
 */
import { useLayoutEffect, useState } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useGLTFClone } from '../useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { useDeskScreenVideo } from '@features/scene/utils/deskScreenVideo';
import { isHomeAssistantLinked, useHomeAssistant } from '../../home-assistant/connection';
import { getObjectActionIds } from '../objectActions';
import { TV_W, TV_H } from '../tvData';

const ACTION_KEY = 'tv-toggle';

export function TV({ actionState = {}, onSize, isPreview = false }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene } = useGLTFClone('items/tv/tv.glb');
  const screenTex = useTexture('items/omarchy-screen/omarchy-screen.png');
  screenTex.colorSpace = THREE.SRGBColorSpace;

  const remote = useHomeAssistant(state => isHomeAssistantLinked(state) && !isPreview);
  const { isVideoActive: videoActive, texture: videoTex } = useDeskScreenVideo(isPreview ? !!actionState['desk2-screen-toggle'] : undefined);

  const isTvOn = actionState[ACTION_KEY] ?? false;
  const isVideoActive = videoActive && (!remote || isTvOn);
  const isDisplaying = isVideoActive || isTvOn;
  const activeTex = isVideoActive ? videoTex : (isTvOn ? screenTex : null);
  const [screenZ, setScreenZ] = useState(0);

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
    onSize?.(size);
  }, [scene, onSize]);

  return (
    <group userData={{ hoverAction: { label: 'TV CHiQ L32H7A', actions: getObjectActionIds('tv') } }}>
      <primitive object={scene} />
      {/* Screen overlay — DoubleSide : visible quel que soit l'angle caméra */}
      <mesh position={[0, 0, screenZ]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[TV_W - 4, TV_H - 4]} />
        <meshStandardMaterial
          side={THREE.DoubleSide}
          map={activeTex}
          color={isDisplaying ? 0xffffff : 0x060606}
          emissive={isVideoActive ? 0xffffff : (isTvOn ? 0x111111 : 0x000000)}
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
