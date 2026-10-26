import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

export const HOOD_SHELF_THICKNESS = 1.8;

/** Planche 60 × 37 cm, percée pour laisser passer le tube et son collier. */
export function HoodShelf({ onSize }: SceneItemProps) {
  const geometry = useMemo(() => {
    const outline = new THREE.Shape();
    outline.moveTo(-30, -18.5);
    outline.lineTo(30, -18.5);
    outline.lineTo(30, 18.5);
    outline.lineTo(-30, 18.5);
    outline.closePath();
    const hole = new THREE.Path();
    // Buse à Z = 46.17 dans la cuisine ; planche centrée à Z = 41.5.
    hole.absarc(0, -(46.17 - 41.5), 5.8, 0, Math.PI * 2, true);
    outline.holes.push(hole);
    return new THREE.ExtrudeGeometry(outline, {
      depth: HOOD_SHELF_THICKNESS, bevelEnabled: false, curveSegments: 48,
    }).rotateX(-Math.PI / 2);
  }, []);

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(60, HOOD_SHELF_THICKNESS, 37));
  }, [onSize]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#c8a77b" roughness={0.7} />
    </mesh>
  );
}
