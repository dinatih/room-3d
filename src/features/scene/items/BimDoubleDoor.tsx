import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { SceneItemProps } from '@shared/types';
import { Box3, Vector3, Group, MathUtils } from 'three';
import { splitBimDoor } from './splitBimDoor';

export function BimDoubleDoor({ actionState, onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('/media/S9000_Double_Door.glb');
  
  const { frameGroup, leftGroup, rightGroup } = useMemo(() => {
    // To prevent re-splitting the same scene
    if (scene.userData.splitParts) return scene.userData.splitParts;
    const parts = splitBimDoor(scene);
    scene.userData.splitParts = parts;
    return parts;
  }, [scene]);

  const leftRef = useRef<Group>(null!);
  const rightRef = useRef<Group>(null!);

  useLayoutEffect(() => {
    if (!scene) return;
    scene.scale.set(100, 100, 100);
    scene.rotation.set(0, 0, 0);
    
    // Size is computed from the original scene or the group.
    // Actually we can compute size from the assembled parts!
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    box.getSize(size);
    if (onSize) onSize(size);
  }, [scene, onSize]);

  // Target angles
  // For the left door, open means rotating inwards or outwards? Let's say it rotates out (Math.PI / 2)
  // We can use generic actionState like actionState['east-glass-door-toggle'] or we can add new ones
  const leftOpen = !!actionState['bim-door-left-open'];
  const rightOpen = !!actionState['bim-door-right-open'];

  // To open inwards, we invert the signs
  const leftTarget = leftOpen ? -Math.PI / 2 : 0;
  const rightTarget = rightOpen ? Math.PI / 2 : 0;

  useFrame((_, delta) => {
    if (leftRef.current) {
      const cur = leftRef.current.rotation.y;
      if (Math.abs(leftTarget - cur) > 0.001) {
        leftRef.current.rotation.y = MathUtils.damp(cur, leftTarget, 5, delta);
      } else if (cur !== leftTarget) {
        leftRef.current.rotation.y = leftTarget;
      }
    }
    if (rightRef.current) {
      const cur = rightRef.current.rotation.y;
      if (Math.abs(rightTarget - cur) > 0.001) {
        rightRef.current.rotation.y = MathUtils.damp(cur, rightTarget, 5, delta);
      } else if (cur !== rightTarget) {
        rightRef.current.rotation.y = rightTarget;
      }
    }
  });

  return (
    <group position={[-80, -85, 0]} scale={[106.667, 100, 100]}>
      <primitive object={frameGroup} />
      <primitive object={leftGroup} ref={leftRef} />
      <primitive object={rightGroup} ref={rightRef} />
    </group>
  );
}
