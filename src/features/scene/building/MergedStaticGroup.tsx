/**
 * MergedStaticGroup.tsx — Fusion statique de maillages à géométrie identique pour optimisation des draw calls R3F/Three.js.
 */
import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function MergedStaticGroup({ children, name = 'merged-static', userData }: { children: React.ReactNode; name?: string; userData?: Record<string, any> }) {
  const sourceRef = useRef<THREE.Group>(null!);
  const mergedRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    if (!sourceRef.current || !mergedRef.current) return;
    if ((window as any).isAnimProRunning) return;

    const src = sourceRef.current;
    const dst = mergedRef.current;

    dst.clear();
    const groups = new Map<string, { geos: THREE.BufferGeometry[]; mat: THREE.Material; userData: any }>();

    src.updateMatrixWorld(true);
    const invWorldMat = src.matrixWorld.clone().invert();

    const processedMeshes = new Set<THREE.Mesh>();

    src.traverse(node => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh || mesh.type !== 'Mesh' || (mesh as any).isInstancedMesh || mesh.userData?.isMergedStatic || mesh.userData?.skipMerge) return;

      // Skip merging if any ancestor has skipMerge: true or hoverAction defined
      let parent = mesh.parent;
      let skip = false;
      if (mesh.userData?.skipMerge || mesh.userData?.hoverAction) skip = true;
      while (!skip && parent && parent !== src) {
        if (parent.userData?.skipMerge || parent.userData?.hoverAction) {
          skip = true;
          break;
        }
        parent = parent.parent;
      }
      if (skip) return;

      if (processedMeshes.has(mesh)) return;

      // On cache l'original
      mesh.visible = false;
      mesh.userData.wasMerged = true;
      processedMeshes.add(mesh);

      const geom = mesh.geometry;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      // Transformation RELATIVE au groupe source (évite le double transform)
      const relMat = mesh.matrixWorld.clone().premultiply(invWorldMat);

      const udKey = JSON.stringify({ brickType: mesh.userData?.brickType });

      if (!geom.groups || geom.groups.length === 0 || mats.length === 1) {
        const mat = mats[0];
        if (!mat || (mat as any).visible === false) return;

        let clone = geom.clone();
        clone = clone.index ? clone.toNonIndexed() : clone;
        clone.applyMatrix4(relMat);

        const key = `${mat.uuid}|${udKey}`;
        if (!groups.has(key)) groups.set(key, { geos: [], mat, userData: { brickType: mesh.userData?.brickType } });
        groups.get(key)!.geos.push(clone);
      } else {
        for (const group of geom.groups) {
          const mat = mats[group.materialIndex || 0] || mats[0];
          if (!mat || (mat as any).visible === false) continue;

          let clone = geom.clone();
          if (geom.index) {
            const newIndex = geom.index.array.slice(group.start, group.start + group.count);
            clone.setIndex(new THREE.BufferAttribute(newIndex, 1));
          }
          clone.groups = [];
          clone = clone.index ? clone.toNonIndexed() : clone;
          clone.applyMatrix4(relMat);

          const key = `${mat.uuid}|${udKey}`;
          if (!groups.has(key)) groups.set(key, { geos: [], mat, userData: { brickType: mesh.userData?.brickType } });
          groups.get(key)!.geos.push(clone);
        }
      }
    });

    for (const { geos, mat, userData } of groups.values()) {
      const allAttrs = new Set<string>();
      geos.forEach(g => Object.keys(g.attributes).forEach(k => allAttrs.add(k)));
      for (const a of allAttrs) {
        if (!geos.every(g => g.hasAttribute(a))) geos.forEach(g => g.deleteAttribute(a));
      }

      const merged = mergeGeometries(geos, false);
      geos.forEach(g => g.dispose());
      if (!merged) continue;

      const m = new THREE.Mesh(merged, mat);
      m.name = name;
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData = { ...userData, isMergedStatic: true };
      m.raycast = () => {}; // OPTIMISATION : Désactive le raycasting sur ce gros mesh statique pour ne pas plomber les perfs au survol

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

      dst.add(m);
    }

    return () => {
      if ((window as any).isAnimProRunning) return;
      // Nettoyage : restaurer la visibilité des originaux
      processedMeshes.forEach(m => {
        m.visible = true;
        delete m.userData.wasMerged;
      });
      dst.clear();
    };
  }, []);

  return (
    <group userData={userData}>
      {/* isMergedSource : visit() doit toujours descendre dans ce groupe, jamais le classifier */}
      <group ref={sourceRef} userData={{ isMergedSource: true }}>{children}</group>
      <group ref={mergedRef} userData={{ isMergedStatic: true }} />
    </group>
  );
}
