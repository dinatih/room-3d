import { useRef, useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function LampOla({ actionState, onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('items/lamp-ola/lamp-ola.glb');
  const diffuserMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const isOn = actionState?.on !== undefined
    ? Boolean(actionState.on)
    : Boolean(actionState?.['lamp-toggle'] || actionState?.lampOn);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    removeGlbLines(scene);

    scene.traverse(c => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.color) return;
      mesh.material = mat.clone();
      const hsl = { h: 0, s: 0, l: 0 };
      (mesh.material as THREE.MeshStandardMaterial).color.getHSL(hsl);
      if (hsl.h > 0.08 && hsl.h < 0.20 && hsl.s > 0.2) {
        (mesh.material as THREE.MeshStandardMaterial).color.set(0xffffff);
      }
    });

    // Merge to bake node transforms and scale into centimeters
    mergeGlbByMaterial(scene);

    // Isolate the diffuser disc from the merged mesh
    const mergedMesh = scene.children.find((c: any) => c.isMesh) as THREE.Mesh | undefined;
    if (mergedMesh && mergedMesh.geometry) {
      const origMat = mergedMesh.material as THREE.MeshStandardMaterial;
      const bodyMat = origMat ? origMat.clone() : new THREE.MeshStandardMaterial({ color: 0xffffff });
      const diffuserMat = bodyMat.clone();
      diffuserMat.polygonOffset = true;
      diffuserMat.polygonOffsetFactor = -2;
      diffuserMat.polygonOffsetUnits = -4;
      diffuserMat.side = THREE.DoubleSide;
      bodyMat.side = THREE.DoubleSide;
      diffuserMatRef.current = diffuserMat;

      const nonIndexed = mergedMesh.geometry.index ? mergedMesh.geometry.toNonIndexed() : mergedMesh.geometry.clone();
      const pos = nonIndexed.attributes.position;
      const uv = nonIndexed.attributes.uv;
      const normalAttr = nonIndexed.attributes.normal;
      const count = pos.count;

      nonIndexed.computeBoundingBox();
      const bbox = nonIndexed.boundingBox!;
      const height = bbox.max.y - bbox.min.y;
      const topThreshold = bbox.min.y + height * 0.45;

      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();
      const cb = new THREE.Vector3();
      const ab = new THREE.Vector3();
      const center = new THREE.Vector3();

      interface TriangleInfo {
        index: number;
        normal: THREE.Vector3;
        center: THREE.Vector3;
        d: number;
      }
      const topTriangles: TriangleInfo[] = [];

      for (let i = 0; i < count; i += 3) {
        vA.fromBufferAttribute(pos, i);
        vB.fromBufferAttribute(pos, i + 1);
        vC.fromBufferAttribute(pos, i + 2);

        center.set(0, 0, 0).add(vA).add(vB).add(vC).divideScalar(3);
        if (center.y < topThreshold) continue;

        cb.subVectors(vC, vB);
        ab.subVectors(vA, vB);
        cb.cross(ab).normalize();

        if (cb.y > 0.15) {
          const d = -cb.dot(center);
          topTriangles.push({
            index: i,
            normal: cb.clone(),
            center: center.clone(),
            d,
          });
        }
      }

      // Find dominant reference plane of the diffuser disc
      let bestRef: TriangleInfo | null = null;
      let maxCount = 0;

      for (let i = 0; i < topTriangles.length; i++) {
        const ref = topTriangles[i];
        let cnt = 0;
        for (let j = 0; j < topTriangles.length; j++) {
          const target = topTriangles[j];
          if (ref.normal.dot(target.normal) > 0.85) {
            const dist = Math.abs(ref.normal.dot(target.center) + ref.d);
            if (dist < 1.5) cnt++;
          }
        }
        if (cnt > maxCount) {
          maxCount = cnt;
          bestRef = ref;
        }
      }

      // Collect ALL triangles across the entire disc surface
      const bestCluster = new Set<number>();
      if (bestRef) {
        for (let i = 0; i < topTriangles.length; i++) {
          const tri = topTriangles[i];
          const dot = bestRef.normal.dot(tri.normal);
          const dist = Math.abs(bestRef.normal.dot(tri.center) + bestRef.d);
          if (dot > 0.70 && dist < 1.8) {
            bestCluster.add(tri.index);
          }
        }
      }

      const bodyPos: number[] = [];
      const bodyNorm: number[] = [];
      const bodyUv: number[] = [];

      const diffPos: number[] = [];
      const diffNorm: number[] = [];
      const diffUv: number[] = [];

      for (let i = 0; i < count; i += 3) {
        const isDiffuser = bestCluster.has(i);
        const targetPos = isDiffuser ? diffPos : bodyPos;
        const targetNorm = isDiffuser ? diffNorm : bodyNorm;
        const targetUv = isDiffuser ? diffUv : bodyUv;
        const offset = isDiffuser ? 0.08 : 0; // 0.8mm forward offset along normal

        for (let k = 0; k < 3; k++) {
          const idx = i + k;
          const nx = normalAttr ? normalAttr.getX(idx) : 0;
          const ny = normalAttr ? normalAttr.getY(idx) : 1;
          const nz = normalAttr ? normalAttr.getZ(idx) : 0;

          targetPos.push(
            pos.getX(idx) + nx * offset,
            pos.getY(idx) + ny * offset,
            pos.getZ(idx) + nz * offset
          );
          if (normalAttr) targetNorm.push(nx, ny, nz);
          if (uv) targetUv.push(uv.getX(idx), uv.getY(idx));
        }
      }

      scene.remove(mergedMesh);

      if (bodyPos.length > 0) {
        const bodyGeo = new THREE.BufferGeometry();
        bodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(bodyPos, 3));
        if (bodyNorm.length > 0) bodyGeo.setAttribute('normal', new THREE.Float32BufferAttribute(bodyNorm, 3));
        if (bodyUv.length > 0) bodyGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bodyUv, 2));
        bodyGeo.computeVertexNormals();
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        scene.add(bodyMesh);
      }

      if (diffPos.length > 0) {
        const diffGeo = new THREE.BufferGeometry();
        diffGeo.setAttribute('position', new THREE.Float32BufferAttribute(diffPos, 3));
        if (diffNorm.length > 0) diffGeo.setAttribute('normal', new THREE.Float32BufferAttribute(diffNorm, 3));
        if (diffUv.length > 0) diffGeo.setAttribute('uv', new THREE.Float32BufferAttribute(diffUv, 2));
        diffGeo.computeVertexNormals();
        const diffMesh = new THREE.Mesh(diffGeo, diffuserMat);
        diffMesh.castShadow = true;
        diffMesh.receiveShadow = true;
        scene.add(diffMesh);
      }
    }

    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  useLayoutEffect(() => {
    if (diffuserMatRef.current) {
      if (isOn) {
        diffuserMatRef.current.emissive.set(0xfff2d6);
        diffuserMatRef.current.emissiveIntensity = 2.5;
      } else {
        diffuserMatRef.current.emissive.set(0x000000);
        diffuserMatRef.current.emissiveIntensity = 0;
      }
    }
  }, [isOn]);

  return <primitive object={scene} />;
}

useGLTF.preload('items/lamp-ola/lamp-ola.glb');

