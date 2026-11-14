import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { applyMagazineCut, MAGAZINE_CUT_HEIGHT } from '../photo/clipGeometryY';
import { cameraState } from '../cameraState';
import { useSceneStore } from '../store/useSceneStore';

/** Applique et restaure la coupe horizontale Magazine (1,35 m) sur les portes, placards et plafonds dans la scène temps réel. */
export function MagazineCutController({ active, assetsLoaded }: { active: boolean; assetsLoaded: boolean }) {
  const { scene } = useThree();
  const wallStructure = useSceneStore(state => state.layers.wallStructure);
  const structure = useSceneStore(state => state.layers.structure);
  const doors = useSceneStore(state => state.layers.doors);
  const floorCoverings = useSceneStore(state => state.layers.floorCoverings);
  const mirrorSurfaces = useSceneStore(state => state.layers.mirrorSurfaces);
  const equipment = useSceneStore(state => state.layers.equipment);

  useLayoutEffect(() => {
    if (!active) return;

    const geomMap = new Map<THREE.Mesh, THREE.BufferGeometry>();
    const hidden: THREE.Object3D[] = [];
    applyMagazineCut(scene, MAGAZINE_CUT_HEIGHT, geomMap, hidden);
    cameraState.invalidate?.();

    return () => {
      hidden.forEach(obj => { obj.visible = true; });
      geomMap.forEach((origGeom, mesh) => {
        const tempGeom = mesh.geometry;
        mesh.geometry = origGeom;
        if (tempGeom && tempGeom !== origGeom) tempGeom.dispose();
      });
      cameraState.invalidate?.();
    };
  }, [active, scene, assetsLoaded, wallStructure, structure, doors, floorCoverings, mirrorSurfaces, equipment]);

  return null;
}
