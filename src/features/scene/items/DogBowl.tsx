import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { useNavigationEnabled } from '../ai/navigation/NavigationContext';
import { DOG_BOWL, dogFeedingStation } from './dogBowlData';

export function DogBowl({ onSize, isPreview = false, feedingStation = false }: Partial<Omit<SceneItemProps, 'item' | 'actionState'>> & { feedingStation?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const navigationEnabled = useNavigationEnabled();
  const profile = useMemo(() => [
    new THREE.Vector2(0, 0), new THREE.Vector2(8, 0), new THREE.Vector2(DOG_BOWL.radius, DOG_BOWL.height),
    new THREE.Vector2(9, DOG_BOWL.height), new THREE.Vector2(7, 1), new THREE.Vector2(0, 1),
  ], []);
  useLayoutEffect(() => {
    if (feedingStation && !isPreview && navigationEnabled) dogFeedingStation.position = root.current!.getWorldPosition(new THREE.Vector3());
    onSize?.(new THREE.Vector3(DOG_BOWL.radius * 2, DOG_BOWL.height, DOG_BOWL.radius * 2));
    return () => { if (feedingStation && !isPreview && navigationEnabled) dogFeedingStation.position = null; };
  }, [feedingStation, isPreview, navigationEnabled, onSize]);
  return <group ref={root} name="ulotte-bowl" userData={{ itemName: 'Gamelle d’Ulotte' }}>
    <mesh castShadow receiveShadow>
      <latheGeometry args={[profile, 48]} />
      <meshStandardMaterial color="#ad3831" roughness={0.35} metalness={0.15} />
    </mesh>
    <mesh position={[0, DOG_BOWL.height - 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[9.5, 0.5, 8, 48]} />
      <meshStandardMaterial color="#c9c6bd" metalness={0.7} roughness={0.25} />
    </mesh>
    <mesh position={[0, DOG_BOWL.foodHeight, 0]} receiveShadow>
      <cylinderGeometry args={[8, 7, 1, 32]} />
      <meshStandardMaterial color="#704327" roughness={1} />
    </mesh>
  </group>;
}
