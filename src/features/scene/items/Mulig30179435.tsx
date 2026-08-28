import { useGLTF } from '@react-three/drei';
import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { Spruttig20317079 } from './Spruttig20317079';
import { NOOP_ITEM, NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';

// ── 6 cintres Spruttig sur la tringle Mulig ──────────────────────────────────
const HANGER_Z   = [-20, -12, -4, 4, 12, 20];
const HANGER_ROTS = [0.04, -0.03, 0.05, -0.02, 0.03, -0.04];
// Barre Mulig à ~18.5 cm de hauteur (18.5 - 19 cm hook height = -0.5 cm)
// Barre avancée à X = 10.5 cm par rapport au centre de Mulig
const RAIL_X = 10.5;
const RAIL_Y = 18.5 - 19;

/**
 * MULIG Tringle à vêtements, blanc
 * Price: 4,99
 * URL: https://www.ikea.com/fr/fr/p/mulig-tringle-a-vetements-blanc-30179435/
 */
export function Mulig30179435({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/mulig30179435/Mulig30179435.glb');
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI / 2;
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    if (groupRef.current) {
      groupRef.current.updateMatrixWorld(true);
      onSize?.(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
    }
  }, [scene, onSize]);

  return (
    <group ref={groupRef} {...props}>
      <primitive object={scene} />

      {/* 6 cintres Spruttig sur la tringle Mulig */}
      {HANGER_Z.map((z, i) => (
        <group
          key={`mulig-hanger-${i}`}
          position={[RAIL_X, RAIL_Y, z]}
          rotation={[0, HANGER_ROTS[i], 0]}
          userData={{ animUnit: true, isIkea: true, itemName: `Cintre Spruttig Mulig ${i + 1}` }}
        >
          <Spruttig20317079 item={NOOP_ITEM} actionState={NOOP_STATE} onSize={NOOP_SIZE} />
        </group>
      ))}
    </group>
  );
}

useGLTF.preload('/items/mulig30179435/Mulig30179435.glb');


