/**
 * MergedStaticGroup.tsx — Fusion statique de maillages à géométrie identique pour optimisation des draw calls R3F/Three.js.
 */
import React, { useRef, useLayoutEffect, useContext } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CategoryLayerContext } from '../sceneLayer';
import { geometryLayoutKey } from '../glbUtils';

export function MergedStaticGroup({ children, name = 'merged-static', userData, materialOverride }: { children: React.ReactNode; name?: string; userData?: Record<string, any>; materialOverride?: THREE.Material }) {
  const categoryLayer = useContext(CategoryLayerContext);
  const sourceRef = useRef<THREE.Group>(null!);
  const mergedRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    if (!sourceRef.current || !mergedRef.current) return;

    const src = sourceRef.current;
    const dst = mergedRef.current;

    dst.clear();
    const groups = new Map<string, { geos: THREE.BufferGeometry[]; mat: THREE.Material; userData: any; renderOrder: number }>();

    src.updateMatrixWorld(true);
    const invWorldMat = src.matrixWorld.clone().invert();

    const processedMeshes = new Set<THREE.Mesh>();

    src.traverseVisible(node => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh || mesh.type !== 'Mesh' || mesh.userData?.isMergedStatic || mesh.userData?.skipMerge) return;

      // Skip merging if any ancestor has skipMerge: true or hoverAction defined
      let parent = mesh.parent;
      let skip = false;
      if (mesh.userData?.hoverAction) skip = true;
      while (!skip && parent && parent !== src) {
        if (parent.userData?.skipMerge || parent.userData?.hoverAction) {
          skip = true;
          break;
        }
        parent = parent.parent;
      }
      if (skip) return;

      const geom = mesh.geometry;
      const mats = materialOverride ? [materialOverride] : Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      // Transformation RELATIVE au groupe source (évite le double transform)
      const relMat = mesh.matrixWorld.clone().premultiply(invWorldMat);

      const udKey = JSON.stringify({ brickType: mesh.userData?.brickType });

      const ranges = geom.groups.length && mats.length > 1 ? geom.groups : [undefined];
      for (const range of ranges) {
        const mat = mats[range?.materialIndex ?? 0];
        if (!mat) throw new Error(`Missing material on static mesh: ${mesh.name}`);
        if (!mat.visible) continue;
        let clone = geom.clone();
        if (range) {
          clone.setIndex(geom.index
            ? new THREE.BufferAttribute(geom.index.array.slice(range.start, range.start + range.count), 1)
            : Array.from({ length: range.count }, (_, i) => range.start + i));
          clone.clearGroups();
        }
        clone = clone.index ? clone.toNonIndexed() : clone;
        clone.applyMatrix4(relMat);

        const order = mesh.renderOrder || 0;
        const key = `${mat.uuid}|${udKey}|ro${order}|${geometryLayoutKey(clone)}`;
        if (!groups.has(key)) groups.set(key, { geos: [], mat, userData: { brickType: mesh.userData?.brickType }, renderOrder: order });
        groups.get(key)!.geos.push(clone);
        processedMeshes.add(mesh);
      }
    });

    for (const { geos, mat, userData, renderOrder } of groups.values()) {
      const merged = mergeGeometries(geos, false);
      geos.forEach(g => g.dispose());
      if (!merged) throw new Error(`Cannot merge static geometry: ${name}`);

      merged.computeBoundingBox();
      merged.computeBoundingSphere();

      const m = new THREE.Mesh(merged, mat);
      m.name = name;
      m.renderOrder = renderOrder;
      m.castShadow = !mat.transparent;
      m.receiveShadow = true;
      m.userData = { ...userData, isMergedStatic: true };
      if (name !== 'merged-walls') {
        m.raycast = () => {}; // OPTIMISATION : Désactive le raycasting sur les gros meshes statiques pour ne pas plomber les perfs au survol (sauf les murs pour l'occlusion)
      }

      if (categoryLayer !== null && categoryLayer !== undefined) {
        m.layers.disable(0);
        m.layers.enable(categoryLayer);
      } else {
        // Héritage automatique du layer mask depuis le premier mesh source correspondant
        src.traverse(node => {
          if (m.layers.mask !== 1) return;
          const mesh = node as THREE.Mesh;
          if (!mesh.isMesh || mesh.userData.isMergedStatic) return;
          const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          if (ms.some(sm => sm?.uuid === mat.uuid)) {
            m.layers.mask = mesh.layers.mask;
          }
        });
      }

      dst.add(m);
    }

    processedMeshes.forEach(mesh => { mesh.visible = false; });

    return () => {
      // Nettoyage : restaurer la visibilité des originaux
      processedMeshes.forEach(mesh => { mesh.visible = true; });
      dst.traverse(obj => { if (obj instanceof THREE.Mesh) obj.geometry.dispose(); });
      dst.clear();
    };
  }, [categoryLayer, materialOverride]);

  return (
    <group userData={userData}>
      <group ref={sourceRef}>{children}</group>
      <group ref={mergedRef} />
    </group>
  );
}
