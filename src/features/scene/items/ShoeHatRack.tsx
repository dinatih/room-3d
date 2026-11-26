/**
 * ShoeHatRack.tsx — Range-chaussures / porte-chapeaux tubulaire.
 *
 * Géométrie locale : centrée XZ, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneModelProps } from '@shared/types';
import { TruckerCap } from './TruckerCap';
import { SHOE_HAT_RACK } from '../shoeHatRackData';
import { glbLocalBBox, mergeGlbByMaterial } from '../glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';

const PATH = '/items/shoe-hat-rack/shoe-hat-rack.glb';
preloadSceneGLTF(PATH);

const { width: W, depth: D } = SHOE_HAT_RACK;
const TR = 0.8;
const Y_MID = 105;
const Y_TOP = 140;
const HOOK_XS = [W * 0.12, W * 0.37, W * 0.63, W * 0.88] as const;

export function ShoeHatRackCaps() {
  return (
    <>
      {HOOK_XS.flatMap(x => ([Y_MID, Y_TOP] as const).filter(barY => !(x === HOOK_XS[0] && barY === Y_MID)).map(barY => (
        <group key={`${x}-${barY}`} position={[x - W / 2, barY + 1.5, TR + 8.5 - D / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <TruckerCap />
        </group>
      )))}
    </>
  );
}

export function ShoeHatRack({ onSize, noCaps }: SceneModelProps & { noCaps?: boolean }) {
  const { scene } = useGLTFClone(PATH);

  useLayoutEffect(() => {
    if (!scene.userData.merged) {
      scene.scale.setScalar(100);
      mergeGlbByMaterial(scene);
    } else {
      scene.scale.set(1, 1, 1);
    }
    const box = glbLocalBBox(scene);
    scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return (
    <group userData={{ sceneItemRoot: true }}>
      <primitive object={scene} />
      {!noCaps && <ShoeHatRackCaps />}
    </group>
  );
}
